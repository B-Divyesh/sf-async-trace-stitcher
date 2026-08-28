import './style.css';
import { DEFAULT_DRAFT, SAMPLE_SOURCES } from './defaults';
import { scrubPii, scrubStitchedEventForExport, stitch } from './engine';
import { BUY_URL, cachedUnlock, captureReturnedLicense, removeToken, storeToken, verifyLicense } from './license';
import { clearDraft, loadDraft, saveDraft } from './storage';
import type { CaseDraft, StitchResult, StitchedEvent } from './types';

const appElement = document.querySelector<HTMLDivElement>('#app');
if (!appElement) throw new Error('App root missing');
const app = appElement;

let draft: CaseDraft = structuredClone(DEFAULT_DRAFT);
let result: StitchResult | null = null;
let lastSaved: Date | null = null;
let saveTimer = 0;
let notice = '';
let isPro = cachedUnlock();
let offlineReady = !navigator.onLine;

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const cloneDefault = (): CaseDraft => ({
  ...structuredClone(DEFAULT_DRAFT),
  sources: DEFAULT_DRAFT.sources.map((source) => ({ ...source, id: crypto.randomUUID() })),
  rules: DEFAULT_DRAFT.rules.map((rule) => ({ ...rule, id: crypto.randomUUID() })),
  updatedAt: new Date().toISOString(),
});

function header(): string {
  return `<header class="site-header">
    <div class="header-inner">
      <a class="brand" href="/" aria-label="Async Trace Stitcher home"><img src="/mark.svg" alt=""><span>Async Trace Stitcher</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <span class="online-state ${offlineReady ? 'offline' : ''}" id="online-state">${offlineReady ? 'Offline ready' : 'On device'}</span>
        <a href="/#workbench">Workbench</a><a href="/privacy">Privacy</a>
      </nav>
    </div>
  </header>`;
}

function footer(): string {
  return `<footer class="site-footer"><div class="footer-inner">
    <p><strong>Async Trace Stitcher</strong><br><span class="tiny">Local-first incident analysis. Hero imagery generated for this product.</span></p>
    <div class="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://github.com/B-Divyesh/sf-async-trace-stitcher">Source</a></div>
  </div></footer>`;
}

function legalPage(kind: 'privacy' | 'terms'): string {
  const privacy = `<p class="eyebrow">Plain-language policy · Effective 27 August 2026</p>
    <h1>Your evidence stays on your device.</h1>
    <p class="lede">Async Trace Stitcher processes imported logs in your browser. We do not operate an ingestion backend and cannot read your case.</p>
    <h2>Data the app stores</h2><p>Your active case, source text, and correlation rules are stored in your browser’s IndexedDB so the workbench survives a refresh. License tokens and their cached verification result are stored in localStorage.</p>
    <h2>Network requests</h2><p>The core workbench makes no API requests. If you buy or verify a Pro license, your browser contacts <span class="mono">api.sociobot.in</span>. Sociobot/Dodo is the merchant of record and processes checkout information under its own policy. No vendor credentials should ever be pasted here.</p>
    <h2>Exports and deletion</h2><p>Exports are created locally. Incident bundles scrub common email, phone, IP address, secret, authorization, address, and card fields before download. Review every bundle before sharing: arbitrary application schemas can contain sensitive data under unexpected field names. “Delete local case” removes the active IndexedDB record; your downloaded files remain yours.</p>
    <h2>Contact</h2><p>Questions can be filed in the product’s public source repository.</p>`;
  const terms = `<p class="eyebrow">Product terms · Effective 27 August 2026</p>
    <h1>Useful evidence, not a causal oracle.</h1>
    <p class="lede">By using Async Trace Stitcher, you agree to use its output as an investigation aid and review the underlying evidence yourself.</p>
    <h2>What the tool does</h2><p>It proposes ordering and matches from timestamps and the visible rules you configure. Confidence labels describe the strength of those mechanical matches. They do not prove causation, completeness, or fault.</p>
    <h2>Your responsibility</h2><p>Import only data you are authorized to process. Redact credentials before import, confirm scrubbed exports before sharing, and comply with your organization’s retention rules.</p>
    <h2>Pro purchase</h2><p>Pro is a one-time US$29 license for the rule-preset library and Markdown review export. Core analysis, JSON/CSV export, accessibility, and redaction remain free. Sociobot/Dodo is the merchant of record and handles payments and refunds; a refund revokes the associated license.</p>
    <h2>Warranty and liability</h2><p>The software is provided “as is” under the MIT License, without warranties. To the extent permitted by law, its authors are not liable for losses arising from use or interpretation of an incident bundle.</p>`;
  return `${header()}<main id="main" tabindex="-1" class="legal">${kind === 'privacy' ? privacy : terms}<p><a class="button secondary" href="/">Return to the workbench</a></p></main>${footer()}`;
}

function sourceMarkup(): string {
  return draft.sources.map((source, index) => `<div class="source-slip" data-source="${escapeHtml(source.id)}">
    <div class="source-title">
      <label class="sr-only" for="source-name-${index}">Source ${index + 1} name</label>
      <input id="source-name-${index}" type="text" value="${escapeHtml(source.name)}" data-field="source-name" data-id="${escapeHtml(source.id)}">
      <button class="ghost danger" type="button" data-action="remove-source" data-id="${escapeHtml(source.id)}" aria-label="Remove ${escapeHtml(source.name)}">Remove</button>
    </div>
    <label for="source-content-${index}">JSON or NDJSON evidence</label>
    <textarea id="source-content-${index}" data-field="source-content" data-id="${escapeHtml(source.id)}" spellcheck="false" placeholder='{"timestamp":"…","request_id":"…"}'>${escapeHtml(source.content)}</textarea>
    <div class="source-meta">
      <span class="tiny muted">${source.content.trim() ? `${source.content.split(/\r?\n/).length} text line${source.content.split(/\r?\n/).length === 1 ? '' : 's'}` : 'No evidence yet'}</span>
      <label class="file-button">Choose file<input type="file" accept=".json,.jsonl,.ndjson,application/json" data-file-source="${escapeHtml(source.id)}"><span class="sr-only"> for ${escapeHtml(source.name)}</span></label>
    </div>
  </div>`).join('');
}

function ruleMarkup(): string {
  return draft.rules.map((rule, index) => `<div class="rule-row">
    <div class="rule-top">
      <input id="rule-enabled-${index}" type="checkbox" ${rule.enabled ? 'checked' : ''} data-field="rule-enabled" data-id="${escapeHtml(rule.id)}">
      <label class="sr-only" for="rule-enabled-${index}">Enable ${escapeHtml(rule.name)}</label>
      <label class="sr-only" for="rule-name-${index}">Rule ${index + 1} name</label>
      <input id="rule-name-${index}" type="text" value="${escapeHtml(rule.name)}" data-field="rule-name" data-id="${escapeHtml(rule.id)}">
      <button class="ghost danger" type="button" data-action="remove-rule" data-id="${escapeHtml(rule.id)}" aria-label="Remove ${escapeHtml(rule.name)}">Remove</button>
    </div>
    <label class="rule-fields" for="rule-fields-${index}">Fields, comma separated</label>
    <input id="rule-fields-${index}" type="text" value="${escapeHtml(rule.fields.join(', '))}" data-field="rule-fields" data-id="${escapeHtml(rule.id)}" aria-describedby="rule-help-${index}">
    <span class="field-hint" id="rule-help-${index}">Matches a terminal key such as <span class="mono">request_id</span>, or an exact path such as <span class="mono">data.order_id</span>.</span>
  </div>`).join('');
}

function confidenceClass(event: StitchedEvent): string {
  if (event.confidenceLabel === 'Low') return 'low';
  if (event.confidenceLabel === 'Unmatched') return 'unmatched';
  return 'matched';
}

function eventMarkup(event: StitchedEvent): string {
  const state = confidenceClass(event);
  const evidence = event.evidence.length
    ? `<ul class="evidence-list">${event.evidence.map((item) => `<li><strong>${escapeHtml(item.rule)}</strong> matched <span class="mono">${escapeHtml(item.field)}=${escapeHtml(item.value)}</span> in ${item.peers} other event${item.peers === 1 ? '' : 's'}.</li>`).join('')}</ul>`
    : `<ul class="evidence-list">${event.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('') || '<li>No enabled rule matched this event to another source.</li>'}</ul>`;
  return `<li class="event ${state}">
    <div class="event-top"><div>
      <span class="source-tag">${escapeHtml(event.sourceName)}</span>
      <h3>${escapeHtml(event.label)}</h3>
      <div class="mono tiny">${event.timestamp ? escapeHtml(event.timestamp) : 'Timestamp unavailable'}${event.groupId ? ` · ${escapeHtml(event.groupId)}` : ''}</div>
    </div><div class="confidence ${state}" aria-label="${escapeHtml(event.confidenceLabel)} confidence${event.confidence ? `, ${event.confidence} percent` : ''}">${escapeHtml(event.confidenceLabel)}${event.confidence ? ` · ${event.confidence}%` : ''}</div></div>
    ${evidence}
    <details><summary>Inspect original event</summary><pre>${escapeHtml(JSON.stringify(event.raw, null, 2))}</pre></details>
  </li>`;
}

function resultMarkup(): string {
  if (!result) return `<section class="empty-sheet" aria-labelledby="empty-title">
    <div class="empty-mark" aria-hidden="true">?</div><h2 id="empty-title">Your evidence board is empty</h2>
    <p>Paste or choose JSON/NDJSON in at least two source slips, check the visible rules, then stitch the timeline.</p>
    <button class="secondary" type="button" data-action="sample">Load a worked example</button>
  </section>`;

  const matched = result.events.filter((event) => event.evidence.length);
  const unmatched = result.events.filter((event) => !event.evidence.length);
  return `<section aria-labelledby="result-title">
    <div class="result-head"><div><p class="eyebrow">Proposed, not proven</p><h2 id="result-title">Reviewable timeline</h2><p class="muted">Ordered by parsed timestamp. Exact cross-source identifier matches are threaded; proximity alone remains unmatched.</p></div>
      <div class="button-row"><button type="button" class="secondary" data-action="export-csv">Export CSV</button><button type="button" class="secondary" data-action="export-json">Export scrubbed bundle</button>${isPro ? '<button type="button" class="secondary" data-action="export-markdown">Export review notes</button>' : ''}</div>
    </div>
    <div class="metrics" aria-label="Timeline summary">
      <div class="metric"><strong>${matched.length}</strong> identifier matched</div>
      <div class="metric unmatched"><strong>${unmatched.length}</strong> explicitly unmatched</div>
      <div class="metric issue"><strong>${result.issues.length}</strong> parse issue${result.issues.length === 1 ? '' : 's'}</div>
    </div>
    ${result.issues.length ? `<div class="issue-box" role="alert"><strong>Some input could not be parsed.</strong><ul>${result.issues.map((issue) => `<li><strong>${escapeHtml(issue.sourceName)}:</strong> ${escapeHtml(issue.message)}</li>`).join('')}</ul></div>` : ''}
    ${result.events.length ? `<ol class="timeline" aria-label="Matched timeline">${matched.map(eventMarkup).join('')}</ol>
      ${unmatched.length ? `<div class="unmatched-divider"><h2>Unmatched evidence</h2><p>These events stay visible because a defensible timeline must show what the rules could not connect.</p></div><ol class="timeline" aria-label="Unmatched evidence">${unmatched.map(eventMarkup).join('')}</ol>` : ''}`
      : `<div class="empty-sheet"><div class="empty-mark" aria-hidden="true">0</div><h2>No events found</h2><p>Add a JSON object, JSON array of objects, or one JSON object per NDJSON line.</p></div>`}
  </section>`;
}

function licenseMarkup(): string {
  if (isPro) return `<aside class="license-strip" aria-labelledby="pro-title"><div><p class="eyebrow">License active</p><h2 id="pro-title">Pro investigator tools are unlocked</h2><p>Markdown review notes and reusable rule presets are available on this device.</p></div><button class="secondary" type="button" data-action="remove-license">Remove license</button></aside>`;
  return `<aside class="license-strip" aria-labelledby="pro-title"><div><p class="eyebrow">Optional one-time unlock</p><h2 id="pro-title">Pro investigator tools · US$29 once</h2><p>Add reusable rule-preset files and Markdown review notes. The full stitcher, JSON/CSV export, redaction, and offline use stay free. Sociobot/Dodo is the merchant of record.</p><p><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p></div><div>
    <p><a class="button primary" href="${BUY_URL}">Buy Pro securely</a></p>
    <form class="license-form" id="license-form"><label class="sr-only" for="license-token">License token</label><input id="license-token" name="license" type="text" autocomplete="off" placeholder="Have a license? Paste it"><button class="secondary" type="submit">Restore purchase</button></form>
  </div></aside>`;
}

function homePage(): string {
  return `${header()}<main id="main" tabindex="-1">
    <section class="hero" aria-labelledby="page-title"><div class="hero-copy">
      <p class="eyebrow">Local evidence workbench</p><h1 id="page-title">Find the thread through async failure.</h1>
      <p class="lede">Turn redacted logs, queue records, and webhook exports into a timestamped, reviewable timeline—without deploying an APM or uploading customer evidence.</p>
      <div class="hero-actions"><a class="button primary" href="#workbench">Start an investigation</a><button class="secondary" type="button" data-action="sample">Try the example</button></div>
      <p class="tiny muted">Runs in this browser · Works offline · Visible rules only</p>
    </div><figure class="hero-figure">
      <picture><source media="(max-width: 700px)" srcset="/assets/hero-paper-trace-small.webp"><img src="/assets/hero-paper-trace.webp" width="1200" height="800" fetchpriority="high" decoding="async" alt="A paper-cut application, queue, and webhook connected by teal thread into one evidence timeline"></picture>
      <figcaption>Three disconnected systems. One inspectable thread.</figcaption>
    </figure></section>
    <ul class="promise-strip" aria-label="Product guarantees"><li><span>01</span><div><strong>Local by default</strong><br><span class="muted">Evidence stays in IndexedDB on this device.</span></div></li><li><span>02</span><div><strong>No hidden inference</strong><br><span class="muted">Every match names the rule and exact value.</span></div></li><li><span>03</span><div><strong>Honest gaps</strong><br><span class="muted">Unmatched and malformed events stay visible.</span></div></li></ul>

    <section id="workbench" aria-labelledby="workbench-title">
      <div class="workbench-head"><div><p class="eyebrow">Case workspace</p><h2 id="workbench-title">Build the evidence board</h2><p class="muted">Import redacted data only. Nothing below leaves this device unless you choose checkout.</p></div><div class="save-state" aria-live="polite">${lastSaved ? `Saved locally ${escapeHtml(lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}` : 'Local draft loading…'}</div></div>
      <div class="workbench"><div class="control-rail">
        <section class="paper-panel" aria-labelledby="case-heading"><div class="panel-heading"><h3 id="case-heading"><span class="step">1</span>Name the case</h3></div>
          <div class="field"><label for="case-title">Incident title</label><input id="case-title" type="text" value="${escapeHtml(draft.title)}" data-field="case-title"></div>
          <div class="button-row"><label class="file-button">Import case<input id="import-case" type="file" accept="application/json,.json"><span class="sr-only"> JSON bundle</span></label><button class="ghost danger" type="button" data-action="delete-case">Delete local case</button></div>
        </section>
        <section class="paper-panel" aria-labelledby="sources-heading"><div class="panel-heading"><h3 id="sources-heading"><span class="step">2</span>Add evidence</h3><button class="ghost" type="button" data-action="add-source">+ Source</button></div>${sourceMarkup()}</section>
        <section class="paper-panel" aria-labelledby="rules-heading"><div class="panel-heading"><h3 id="rules-heading"><span class="step">3</span>Set visible rules</h3><button class="ghost" type="button" data-action="add-rule">+ Rule</button></div>
          ${ruleMarkup()}
          <div class="field"><label for="timestamp-fields">Timestamp fields</label><input id="timestamp-fields" type="text" value="${escapeHtml(draft.timestampFields.join(', '))}" data-field="timestamp-fields"><span class="field-hint">Terminal keys or exact paths, tried in this order.</span></div>
          <div class="field"><label for="proximity">Flag timestamp proximity within</label><input id="proximity" type="number" min="1" max="86400" value="${draft.proximitySeconds}" data-field="proximity"> <span class="field-hint">Seconds. Proximity never creates an identifier match.</span></div>
          <div class="button-row"><button class="primary" type="button" data-action="analyze">Stitch the timeline</button>${isPro ? '<button class="secondary" type="button" data-action="export-rules">Save rule preset</button><label class="file-button">Load preset<input id="import-rules" type="file" accept="application/json,.json"><span class="sr-only"> JSON rule preset</span></label>' : ''}</div>
        </section>
      </div><div class="timeline-area" aria-live="polite">${resultMarkup()}</div></div>
    </section>
    ${licenseMarkup()}
  </main>${footer()}${notice ? `<div class="toast" role="status">${escapeHtml(notice)}<button type="button" data-action="dismiss-notice">Dismiss</button></div>` : ''}`;
}

function render(): void {
  if (location.pathname === '/privacy' || location.pathname === '/privacy/') app.innerHTML = legalPage('privacy');
  else if (location.pathname === '/terms' || location.pathname === '/terms/') app.innerHTML = legalPage('terms');
  else app.innerHTML = homePage();
  bindFileInputs();
}

function scheduleSave(): void {
  draft.updatedAt = new Date().toISOString();
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    try {
      await saveDraft(draft);
      lastSaved = new Date();
      const state = document.querySelector('.save-state');
      if (state) state.textContent = `Saved locally ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch { notice = 'This browser could not save the local draft. Export a bundle before closing.'; render(); }
  }, 250);
}

function parseList(value: string): string[] { return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]; }

function updateField(target: HTMLInputElement | HTMLTextAreaElement): void {
  const field = target.dataset.field;
  const id = target.dataset.id;
  if (field === 'case-title') draft.title = target.value || 'Untitled incident';
  if (field === 'timestamp-fields') draft.timestampFields = parseList(target.value);
  if (field === 'proximity') draft.proximitySeconds = Math.max(1, Math.min(86400, Number(target.value) || 120));
  const source = id ? draft.sources.find((item) => item.id === id) : undefined;
  if (source && field === 'source-name') source.name = target.value || 'Unnamed source';
  if (source && field === 'source-content') source.content = target.value;
  const rule = id ? draft.rules.find((item) => item.id === id) : undefined;
  if (rule && field === 'rule-name') rule.name = target.value || 'Unnamed rule';
  if (rule && field === 'rule-fields') rule.fields = parseList(target.value);
  if (rule && field === 'rule-enabled' && target instanceof HTMLInputElement) rule.enabled = target.checked;
  scheduleSave();
}

function bindFileInputs(): void {
  document.querySelectorAll<HTMLInputElement>('[data-file-source]').forEach((input) => input.addEventListener('change', async () => {
    const file = input.files?.[0];
    const source = draft.sources.find((item) => item.id === input.dataset.fileSource);
    if (!file || !source) return;
    if (file.size > 10_000_000) { notice = `${file.name} is over the 10 MB browser safety limit.`; render(); return; }
    source.content = await file.text();
    if (!source.name || source.name.startsWith('Source ')) source.name = file.name.replace(/\.(jsonl?|ndjson)$/i, '');
    scheduleSave(); render();
  }));
  document.querySelector<HTMLInputElement>('#import-case')?.addEventListener('change', async (event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text()) as unknown;
      if (!imported || typeof imported !== 'object') throw new Error('Unsupported case file');
      const record = imported as Record<string, unknown>;
      const candidate = (record.draft ?? imported) as Partial<CaseDraft>;
      if (candidate.version !== 1 || !Array.isArray(candidate.sources) || !Array.isArray(candidate.rules)) throw new Error('Unsupported case file');
      draft = candidate as CaseDraft;
      const timeline = Array.isArray(record.timeline) ? record.timeline as Array<Record<string, unknown>> : [];
      if (timeline.length && draft.sources.every((source) => source.content.startsWith('[Omitted:'))) {
        draft.sources = draft.sources.map((source) => {
          const events = timeline.filter((event) => event.sourceId === source.id).map((event) => event.raw).filter(Boolean);
          return { ...source, content: events.map((raw) => JSON.stringify(raw)).join('\n') };
        });
      }
      result = null;
      notice = `Imported ${file.name}. Review rules, then stitch the timeline.`;
      scheduleSave(); render();
    } catch { notice = `${file.name} is not a valid Async Trace Stitcher case bundle.`; render(); }
  });
  document.querySelector<HTMLInputElement>('#import-rules')?.addEventListener('change', async (event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !isPro) return;
    try {
      const preset = JSON.parse(await file.text()) as Partial<Pick<CaseDraft, 'rules' | 'timestampFields' | 'proximitySeconds'>>;
      if (!Array.isArray(preset.rules) || !Array.isArray(preset.timestampFields)) throw new Error('Invalid preset');
      draft.rules = preset.rules.map((rule) => ({ ...rule, id: crypto.randomUUID() }));
      draft.timestampFields = preset.timestampFields;
      draft.proximitySeconds = Number(preset.proximitySeconds) || 120;
      notice = `Loaded rule preset ${file.name}.`;
      scheduleSave(); render();
    } catch { notice = `${file.name} is not a valid rule preset.`; render(); }
  });
}

function download(filename: string, content: string, type: string): void {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([content], { type }));
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

function filenameBase(): string { return draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'incident'; }

function safeText(value: unknown): string { return String(scrubPii(String(value ?? ''))); }
function scrubDraftForExport(): CaseDraft {
  return {
    ...draft,
    title: safeText(draft.title),
    sources: draft.sources.map((source) => ({ ...source, name: safeText(source.name), content: '[Omitted: see scrubbed events]' })),
    rules: draft.rules.map((rule) => ({ ...rule, name: safeText(rule.name), fields: rule.fields.map(safeText) })),
    timestampFields: draft.timestampFields.map(safeText),
  };
}

function exportJson(): void {
  if (!result) return;
  const safeDraft = scrubDraftForExport();
  const bundle = {
    format: 'async-trace-stitcher/v1',
    caution: 'Mechanical correlation only. Review source evidence before drawing causal conclusions.',
    draft: safeDraft,
    summary: { events: result.events.length, matched: result.matched.length, unmatched: result.unmatched.length, parseIssues: result.issues.length },
    timeline: result.events.map((event) => scrubStitchedEventForExport(event, draft.rules)),
    parseIssues: result.issues.map((issue) => ({ sourceName: safeText(issue.sourceName), message: safeText(issue.message) })),
    exportedAt: new Date().toISOString(),
  };
  download(`${filenameBase()}-bundle.json`, JSON.stringify(bundle, null, 2), 'application/json');
  notice = 'Scrubbed incident bundle exported. Review it before sharing.'; render();
}

function csvCell(value: unknown): string { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function exportCsv(): void {
  if (!result) return;
  const lines = [['timestamp', 'source', 'event', 'confidence', 'score', 'group', 'evidence']
    .map(csvCell).join(','), ...result.events.map((event) => scrubStitchedEventForExport(event, draft.rules)).map((event) => [event.timestamp, event.sourceName, event.label, event.confidenceLabel, event.confidence, event.groupId, event.evidence.map((item) => `${item.rule}:${item.field}=${item.value}`).join('; ')].map(csvCell).join(','))];
  download(`${filenameBase()}-timeline.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
}

function exportMarkdown(): void {
  if (!result || !isPro) return;
  const rows = result.events.map((event) => scrubStitchedEventForExport(event, draft.rules)).map((event) => `| ${event.timestamp ?? 'Unknown'} | ${event.sourceName.replaceAll('|', '\\|')} | ${event.label.replaceAll('|', '\\|')} | ${event.confidenceLabel} ${event.confidence || ''} |`).join('\n');
  const text = `# ${safeText(draft.title)}\n\n> Proposed mechanical correlation. Review underlying evidence before making causal claims.\n\n## Summary\n\n- ${result.matched.length} identifier-matched events\n- ${result.unmatched.length} unmatched events\n- ${result.issues.length} parse issues\n\n## Timeline\n\n| Timestamp | Source | Event | Confidence |\n|---|---|---|---|\n${rows}\n\n## Review checklist\n\n- [ ] Confirm clock skew between sources\n- [ ] Review every unmatched event\n- [ ] Validate identifiers against original exports\n- [ ] Record alternate explanations\n`;
  download(`${filenameBase()}-review.md`, text, 'text/markdown;charset=utf-8');
}

function exportRules(): void {
  if (!isPro) return;
  download(`${filenameBase()}-rules.json`, JSON.stringify({ format: 'async-trace-stitcher/rules-v1', rules: draft.rules, timestampFields: draft.timestampFields, proximitySeconds: draft.proximitySeconds }, null, 2), 'application/json');
}

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    if (target.dataset.field) updateField(target);
  }
});

document.addEventListener('click', async (event) => {
  const button = (event.target as Element).closest<HTMLElement>('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'sample') {
    draft.sources = SAMPLE_SOURCES.map((source) => ({ ...source, id: crypto.randomUUID() }));
    result = null; notice = 'Worked example loaded. Its identifiers and one unrelated event are ready to inspect.'; scheduleSave(); render();
    requestAnimationFrame(() => document.querySelector('#workbench')?.scrollIntoView());
  }
  if (action === 'add-source') { draft.sources.push({ id: crypto.randomUUID(), name: `Source ${draft.sources.length + 1}`, content: '' }); scheduleSave(); render(); }
  if (action === 'remove-source') {
    const source = draft.sources.find((item) => item.id === button.dataset.id);
    if (source && confirm(`Remove “${source.name}” and its pasted evidence from this case?`)) { draft.sources = draft.sources.filter((item) => item.id !== source.id); result = null; scheduleSave(); render(); }
  }
  if (action === 'add-rule') { draft.rules.push({ id: crypto.randomUUID(), name: 'New correlation rule', fields: [], enabled: true }); scheduleSave(); render(); }
  if (action === 'remove-rule') { draft.rules = draft.rules.filter((item) => item.id !== button.dataset.id); result = null; scheduleSave(); render(); }
  if (action === 'analyze') {
    result = stitch(draft.sources, draft.rules, draft.timestampFields, draft.proximitySeconds);
    notice = result.events.length ? `Stitched ${result.events.length} events; ${result.unmatched.length} remain explicitly unmatched.` : 'No event objects were found. Check the input format and parse issues.';
    render(); requestAnimationFrame(() => document.querySelector('#result-title, #empty-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  if (action === 'export-json') exportJson();
  if (action === 'export-csv') exportCsv();
  if (action === 'export-markdown') exportMarkdown();
  if (action === 'export-rules') exportRules();
  if (action === 'delete-case' && confirm(`Delete “${draft.title}” and all pasted evidence stored by this browser?`)) {
    await clearDraft(); draft = cloneDefault(); result = null; lastSaved = null; notice = 'Local case deleted. A fresh empty case is ready.'; render();
  }
  if (action === 'remove-license') { removeToken(); isPro = false; notice = 'License removed from this device.'; render(); }
  if (action === 'dismiss-notice') { notice = ''; render(); }
});

document.addEventListener('submit', async (event) => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'license-form') return;
  event.preventDefault();
  const data = new FormData(event.target);
  const token = String(data.get('license') ?? '').trim();
  if (!token) { notice = 'Paste the license token from your receipt.'; render(); return; }
  storeToken(token);
  notice = 'Checking the license…'; render();
  const verdict = await verifyLicense(true);
  isPro = verdict?.valid ?? false;
  notice = verdict?.valid ? 'Pro unlocked on this device.' : verdict ? 'That license is not active for this product.' : 'Could not verify while offline. Reconnect and try again.';
  render();
});

function setConnectivityState(isOffline: boolean): void {
  offlineReady = isOffline;
  const state = document.querySelector('#online-state');
  if (!state) return;
  state.textContent = offlineReady ? 'Offline ready' : 'On device';
  state.classList.toggle('offline', offlineReady);
}

window.addEventListener('online', () => setConnectivityState(false));
window.addEventListener('offline', () => setConnectivityState(true));

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  const registration = await navigator.serviceWorker.register('/sw.js');
  if (registration.waiting) showUpdate(registration);
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(registration); });
  });
  if (hadController) navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
}

function showUpdate(registration: ServiceWorkerRegistration): void {
  notice = 'A new offline version is ready.'; render();
  const toast = document.querySelector('.toast');
  if (!toast) return;
  const update = document.createElement('button');
  update.type = 'button'; update.textContent = 'Update now';
  update.addEventListener('click', () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }));
  toast.append(update);
}

async function initialize(): Promise<void> {
  captureReturnedLicense();
  try {
    const stored = await loadDraft();
    if (stored?.version === 1) draft = stored;
    lastSaved = stored ? new Date(stored.updatedAt) : null;
  } catch { notice = 'Local storage is unavailable; exports still work for this session.'; }
  render();
  setConnectivityState(!navigator.onLine);
  const verdict = await verifyLicense();
  if (verdict) {
    const before = isPro;
    isPro = verdict.valid;
    if (before !== isPro) { notice = isPro ? 'Pro license verified.' : 'License no longer active. Free tools remain available.'; render(); }
  }
  registerServiceWorker().catch(() => { /* Core app remains available without install support. */ });
}

initialize();
