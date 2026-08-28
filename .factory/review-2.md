# Adversarial first-read review 2

**Verdict: FAIL** — 12 findings remain, including one repeated blocking finding. PASS requires zero findings and no untested claim.

Review target: <https://async-trace-stitcher.sociobot.in>, checked 28 August 2026 in fresh Chromium contexts at 390×844 and 1440×900. Repository base: `b3329328938237a42dabbd01ed6212cb176b58d6`. No product code was changed.

## Cold first screen

Before scrolling, I could answer all three questions on both viewports:

- **What it does:** turns log, queue, and webhook exports for one failed transaction into an incident timeline.
- **Who it is for:** engineers debugging a customer failure across those systems.
- **What to click first:** **“Try it with sample data”**, followed immediately by **“See a stitched six-event incident timeline.”**

The exact copy that established this was **“Build a timeline for one failed transaction”** and **“For engineers debugging a customer failure across logs, queues, and webhooks.”** The first screen therefore passes the blocking first-read test.

## Findings

### F-2-1 — BLOCKING — Review 1’s shared-skeleton finding is only partly fixed on the direct 404

**Repeated earlier finding:** Review 1, **“Required metadata, route titles, and shared skeleton are incomplete.”** Review 1 did not assign numeric IDs, so its exact heading is retained here as the stable reference.

**Exact location and evidence:** a cold request to `/no-such-page` correctly returns HTTP 404 and shows the designed text **“This page is not on the evidence board”**. However, the live response and `public/404.html` have no meta description, canonical, Open Graph metadata, Twitter metadata, Apple touch icon, or skip link. The header contains only **“Async Trace Stitcher”**. The footer contains only **“Built by Param Factory · Build 1.1.0-r1”**; it omits the product one-liner, Privacy, Terms, and Source links present on every SPA route.

**Why this matters:** a direct bad URL drops visitors into a visibly different site shell and removes the legal/trust navigation. The in-app 404 has the full shell, so direct and client-side routing disagree. Under the history rule, a half-fixed earlier finding is blocking again.

**Concrete fix:** generate `404.html` from the shared header/footer or duplicate the complete shell deliberately. Add the missing metadata and skip link. Add a deployed-route test that requires HTTP 404 plus the same header links, footer links, metadata, one h1, and main landmark as the real routes.

### F-2-2 — Major — Timeline ordering and proximity behavior are unlisted claims

**Exact quotes:** landing, **“Time proximity is flagged but never creates an identifier match.”**; landing, **“It proposes an order from your exports and visible rules.”**; README, **“The app proposes an event order from timestamps and visible matching rules.”**

**Why this matters:** these are algorithm guarantees an incident reviewer may rely on. `sample-timeline` counts events but does not assert timestamp order. `visible-evidence` checks displayed evidence but does not construct two close events without a shared identifier and prove they remain unmatched.

**Concrete fix:** add `timeline-ordering` and `proximity-does-not-match` entries to `claims.json`. Test deliberately out-of-order timestamps and close events without a shared identifier. Alternatively remove these guarantees from the copy.

### F-2-3 — Major — The causal/live-ingestion boundary is an unlisted claim

**Exact quote/location:** landing and README, **“It does not ingest live telemetry or prove what caused a failure.”**

**Why this matters:** this is an important safety boundary, but no claim entry names or tests it. The same-origin request test does not check request methods or bodies and does not establish how the result avoids causal conclusions.

**Concrete fix:** use the testable copy **“Import files from your systems; this app does not connect to them. Its output marks matches as proposed, not proven.”** Add a claim test that records the whole workflow, rejects data-bearing network requests, and asserts the non-causal label on every result state.

### F-2-4 — Major — Advertised Pro outputs are not tested

**Exact quote/location:** landing license section, **“Existing licenses add rule-preset files and Markdown review notes.”**

**Why this matters:** `license-restore` proves only that a mocked valid token unlocks the heading and is stored. It does not prove that Markdown downloads, rule-preset downloads, or preset imports work.

**Concrete fix:** add `markdown-export` and `rule-preset-roundtrip` claims. With the documented mocked license response, assert the downloaded Markdown contents and export/import a rule preset into a changed case. Otherwise remove the feature sentence.

### F-2-5 — Minor — The update-notice statement is an unlisted claim

**Exact quote/location:** README deployment section, **“It shows a notice when an update is ready.”**

**Why this matters:** the offline test proves a reload, not the waiting-worker update path.

**Concrete fix:** add a `service-worker-update-notice` claim and simulate a waiting worker, or remove this implementation promise from the README.

### F-2-6 — Minor — The purchase-status statement is an unlisted claim

**Exact quotes:** landing, **“New purchases are paused while checkout is unavailable.”**; README, **“New purchases are paused because the checkout route is unavailable.”**

**Why this matters:** this changing commercial state has no registry entry or test. A visitor may reasonably rely on it when deciding whether to look for a purchase path.

**Concrete fix:** add a `purchase-paused` claim that asserts no purchase action is rendered, or replace both sentences with a non-temporal support note outside the product claims.

### F-2-7 — Minor — The original-art disclosure is an unlisted claim

**Exact quote/location:** landing footer, **“Original hero imagery was generated for this product.”**

**Why this matters:** the design file records provenance, but the public claim has no claims entry or automated check connecting the shipped asset to that record.

**Concrete fix:** add an `original-hero-asset` claim with a checked asset hash and provenance-file assertion, or keep the disclosure only in the documented provenance section.

### F-2-8 — Minor — Visible control labels do not name their result

**Exact locations:** four source/rule buttons show only **“Remove”**; source file controls show **“Choose file”**.

**Why this matters:** the adjacent context and accessible names help, but the visible labels still make a scanning user infer what will change.

**Concrete fix:** show **“Remove source”**, **“Remove rule”**, and **“Import JSON file”**. Keep the specific source/rule name in the accessible label.

### F-2-9 — Minor — Two unexplained terms break the plain-words standard

**Exact quotes:** landing help, **“Matches a terminal key such as `request_id`, or an exact path such as `data.order_id`.”**; README, **“The service worker caches the app shell and assets.”**

**Why this matters:** “terminal key” and “app shell” are implementation terms, not first-read descriptions.

**Concrete rewrite:** **“Matches a field name anywhere in a record, such as `request_id`, or a full path such as `data.order_id`.”** In the README use **“The offline cache stores the page and app files.”**

### F-2-10 — Minor — “Honest gaps” is a vague marketing heading

**Exact location:** landing evidence strip, **“Honest gaps.”**

**Why this matters:** heard out of context, it does not identify the content; “honest” is an unmeasured adjective.

**Concrete rewrite:** **“Unmatched events.”**

### F-2-11 — Minor — The try-out has two terms

**Exact locations:** landing uses **“sample data”**; README uses **“Try the isolated sample.”**

**Why this matters:** the demo contract requires one stable name for the same thing.

**Concrete rewrite:** **“Try it with sample data: https://async-trace-stitcher.sociobot.in/demo.”**

### F-2-12 — Minor — Rule and JSON-download terminology changes across copy

**Exact locations:** the UI says **“matching rules”** but later says **“visible rules”**. The JSON output is called **“JSON exports”**, a **“scrubbed bundle”**, and an **“incident bundle.”**

**Why this matters:** a visitor has to decide whether these are different rules or files.

**Concrete fix:** use **“matching rules”** everywhere. Use **“JSON bundle”** for the JSON file and **“CSV timeline”** for the CSV file; update actions and claims to match.

## Demo and sandbox result

The demo passes its blocking acceptance checks.

- The first click changes the URL to `/demo` and immediately renders six events, five identifier matches, one unmatched event, and one parse issue.
- The persistent banner reads **“Demo — sample data, nothing is saved to your real case.”** It includes working **Reset demo** and **Start for real** controls.
- Reset restored **“Payment retry failed after vendor timeout.”**
- A real case named **“Preserved real incident”** survived demo edits and was restored after leaving.
- Demo data used `demo:async-trace-stitcher`; the real case used `async-trace-stitcher`. Leaving removed the demo `active-draft` record.
- The entire live flow requested only `https://async-trace-stitcher.sociobot.in`.
- After the first visit, `/demo` reloaded offline with all six events.

## Claims result

All six listed commands were run independently from clean clone `/tmp/ats-review-2-clean.Tl8EsU`. Every test passed:

| Claim | Result | Observable evidence |
|---|---|---|
| `sample-timeline` | PASS | 6 events, 5 matched, 1 unmatched, 1 parse issue |
| `visible-evidence` | PASS | all five matched cards name evidence; gap and parse issue remain visible |
| `local-private` | PASS | real/demo databases isolated; no license keys in demo; same-origin requests only |
| `offline-reload` | PASS | service-worker-controlled `/demo` reloaded offline with 6 events |
| `export-safety` | PASS | 6 CSV rows and 6 JSON events; seeded email/token absent; redaction marker present |
| `license-restore` | PASS | mocked Sociobot response unlocked Pro and stored the token |

The live verification endpoint also returned HTTP 200 with `{ "valid": false }` for an invalid review token, confirming that the documented route exists. F-2-2 through F-2-7 identify public claim-like statements missing from the registry; therefore the claim inventory is not complete.

## Copy audit

Counts use whitespace-separated words; hyphenated and code/path tokens count as one. No sentence exceeds 22 words, and no banned word from the supplied list appears. Repeated source/rule help is listed once and marked `×2`.

### Landing-page sentences

| Words | Sentence |
|---:|---|
| 7 | Build a timeline for one failed transaction. |
| 11 | For engineers debugging a customer failure across logs, queues, and webhooks. |
| 6 | See a stitched six-event incident timeline. |
| 4 | Runs in your browser. |
| 6 | Works offline after your first visit. |
| 6 | Timeline building and exports are free. |
| 3 | Three disconnected systems. |
| 3 | One inspectable thread. |
| 9 | Each matched event names its rule and exact value. |
| 7 | Unmatched events and malformed lines stay visible. |
| 10 | JSON and CSV downloads remove common personal and secret fields. |
| 3 | Import redacted exports. |
| 9 | Your case remains in browser storage on this device. |
| 6 | Paste JSON exports into two sources. |
| 8 | Check the matching rules, then stitch the timeline. |
| 2 | Paste JSON. |
| 6 | One record per line is supported. |
| 14 | Matches a terminal key such as `request_id`, or an exact path such as `data.order_id`. ×2 |
| 9 | Terminal keys or exact paths, tried in this order. |
| 10 | Time proximity is flagged but never creates an identifier match. |
| 3 | Paste redacted exports. |
| 9 | Add JSON from the app, queue, webhook, or vendor. |
| 4 | Name the matching fields. |
| 8 | Choose the identifiers that connect records across sources. |
| 3 | Review and export. |
| 9 | Inspect every match, gap, and malformed line before sharing. |
| 12 | It does not ingest live telemetry or prove what caused a failure. |
| 10 | It proposes an order from your exports and visible rules. |
| 16 | No analytics, fonts, scripts, or case data are sent to third parties during the core workflow. |
| 9 | Existing licenses add rule-preset files and Markdown review notes. |
| 8 | New purchases are paused while checkout is unavailable. |
| 12 | Timeline building, redaction, offline use, and JSON or CSV exports remain free. |
| 6 | Build incident timelines in your browser. |
| 8 | Original hero imagery was generated for this product. |

### README sentences

| Words | Sentence |
|---:|---|
| 12 | Build a reviewable incident timeline from redacted log, queue, and webhook exports. |
| 10 | The app is for engineers debugging one failed customer transaction. |
| 5 | Try the isolated sample: `https://async-trace-stitcher.sociobot.in/demo`. |
| 12 | The sample builds a six-event timeline from app, queue, and webhook JSON. |
| 9 | Each match names its rule and exact identifier value. |
| 8 | Unmatched events and malformed input lines remain visible. |
| 9 | The core workflow keeps case data in browser storage. |
| 8 | The app works offline after the first visit. |
| 8 | Free CSV and JSON exports include every event. |
| 9 | Exports remove common personal and secret values before download. |
| 12 | The app proposes an event order from timestamps and visible matching rules. |
| 12 | It does not ingest live telemetry or prove what caused a failure. |
| 7 | Use Node.js 20 or later with npm. |
| 6 | Vite prints the local development URL. |
| 7 | Runtime assets are bundled in the app. |
| 6 | Claim tests are listed in `.factory/claims.json`. |
| 11 | Each command builds the app and runs one tagged browser test. |
| 10 | The production build writes `dist/index.html` and its assets to `dist/`. |
| 6 | Upload `dist/` to a static host. |
| 17 | Configure unknown routes to serve `index.html` so client routes can render their correct page or 404 state. |
| 9 | The checked-in host configuration sets security and cache headers. |
| 8 | It also sets the web manifest content type. |
| 9 | The service worker caches the app shell and assets. |
| 9 | It shows a notice when an update is ready. |
| 5 | Case data stays in IndexedDB. |
| 13 | The demo uses its own `demo:` database and never opens the real case. |
| 10 | The core workflow sends requests only to the product origin. |
| 10 | Existing Pro licenses can be verified through the Sociobot API. |
| 10 | New purchases are paused because the checkout route is unavailable. |
| 4 | Never paste vendor credentials. |
| 6 | Review each export before sharing it. |
| 4 | See Privacy and Terms. |
| 2 | MIT licensed. |
| 2 | See LICENSE. |

### Headings, actions, and fragments

The following non-sentence interface text was also checked: **Incident evidence workbench; Visible matches; Honest gaps; Scrubbed exports; Case workspace; Build the incident timeline; Your incident timeline is empty; Name the case; Add exports; Set matching rules; How it works; Clear limits; What this tool does not do; Existing licenses; Restore Pro investigator tools; Try it with sample data; Import redacted exports; Load sample data; Import case; Delete this case; Add source; Remove; Choose file; Add rule; Stitch the timeline; Restore license.** README headings are **What it does; Run locally; Test and build; Deploy; Privacy and licenses; Project notes.** F-2-8 and F-2-10 contain the flags and rewrites. The remaining headings/actions make sense in context and name their result.

### Terminology check

| Concept | Terms found | Result |
|---|---|---|
| Try-out | sample data; isolated sample | Flagged in F-2-11 |
| Rule logic | matching rules; visible rules | Flagged in F-2-12 |
| JSON download | JSON export; scrubbed bundle; incident bundle | Flagged in F-2-12 |
| Imported material | exports; source (editable container) | Consistent distinction |
| Local persistence | browser storage; IndexedDB (technical detail) | Acceptable |

## Structure, accessibility, and visual identity

- `/`, `/demo`, `/privacy`, and `/terms` return 200, set route-specific titles, descriptions, canonicals, Open Graph/Twitter metadata, favicon/touch icon, one h1, `lang="en"`, and a main landmark.
- Direct `/no-such-page` returns 404 and is designed, but fails the shared-shell and metadata checks in F-2-1.
- History navigation moved focus to the demo h1, Back restored `/` and focused its h1, and the polite region announced both titles.
- Every discovered internal link returned 200. The external Source link returned 200. No dead checkout link is rendered.
- `robots.txt`, `sitemap.xml`, manifest, social image, icon, and touch icon all returned 200.
- Live axe checks found zero violations on home, demo, privacy, terms, and 404. `verify-url.sh` found zero console errors on home and demo, with one h1, `lang`, main, complete alt text, and labelled buttons.
- The paper evidence board, teal thread, hard paper shadows, and original workbench art form a distinct visual identity. It is not a generic SaaS template.

## Earlier-review reconciliation

| Review 1 finding | Live and code result |
|---|---|
| No isolated one-click demo | Fixed: direct demo, first-frame result, banner, reset, exit, separate storage, and offline reload all verified. |
| Claims registry and claim tests missing | Fixed for all six registered claims; all six commands pass. New inventory gaps are F-2-2 through F-2-7. |
| Broken route and link behavior | Fixed: demo/legal deep links work, unknown paths return 404, and every current link resolves. |
| First-screen copy and actions | Fixed: job, user, and first action are clear on mobile and desktop. |
| Required metadata, route titles, and shared skeleton | **Partly fixed:** real routes pass; direct static 404 still fails. Repeated as blocking F-2-1. |
| README long sentences | Fixed: no README sentence exceeds 22 words. |

## Missed leverage

No missed-leverage finding is raised. The brief’s obvious import/export loop is present: users can paste or import JSON, export CSV, and export/import a JSON case bundle. Sync would conflict with the local-first privacy promise. An AI summary is not clearly beneficial for a tool whose value is deterministic, inspectable evidence and could introduce unsupported causal language.

## Verification record

- Fresh live mobile and desktop first screens: 200, expected first-screen copy, no console errors.
- Live real workflow: two pasted records with a shared request ID produced two matched events using only the product origin.
- Live demo: immediate six-event result, reset/exit/isolation/offline checks passed.
- Clean clone: `npm test` passed 6/6; `npm run build` produced `dist/` with 13.48 kB gzip JS; `npm run test:e2e` passed 33 with one intentional desktop skip.
- Live axe: zero violations across all five checked routes.
- Live crawl: all current links resolve; unknown route returns 404; invalid license verification returns a valid 200 response with `valid:false`.

## What would make this perfect

Resolve F-2-1 through F-2-12: make the direct 404 use the complete shared shell and metadata, register or remove every remaining claim, prove the advertised Pro outputs, and normalize the few vague controls and inconsistent terms. Then rerun this entire review from fresh contexts and a fresh clone. PASS is appropriate only if that rerun produces zero findings.
