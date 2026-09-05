# Build an incident timeline — review 3

**Verdict: PASS.** Zero findings. Zero untested public claims.

Reviewed 5 September 2026 UTC at
<https://async-trace-stitcher.sociobot.in>.

- Implementation candidate: `fe981ab5cb7f623069c29d0fefa21b0daae4ddbe`
- Documentation base reviewed: `7b63d1dfcac2d43a1b11fa9e5c818f32533ce67b`

The commits after the implementation candidate change only factory reports.
Freshly built `index.html` and `404.html` match the live response bytes by
SHA-256, so the live product is the implementation candidate.

## Job, audience, and first action

This browser app builds a reviewable timeline for one failed customer
transaction from redacted app, queue, and webhook exports. It is for engineers
debugging that customer failure. Before scrolling, fresh desktop (1440×900)
and phone (390×844) contexts showed the headline **Build a timeline for one
failed transaction**, the audience sentence, and **Try it with sample data**.
The action immediately opens the stitched sample timeline.

## Demo and product paths

Direct `/demo` rendered the persistent **Demo — sample data, nothing is
saved** label, six events, five identifier matches, one explicit unmatched
event, and one parse issue on desktop and phone. Editing the sample and using
**Reset demo** restored `Payment retry failed after vendor timeout`. A saved
real-case title survived entering, editing, resetting, and leaving demo; the
demo changes did not replace it.

Fresh phone offline testing waited for the shipped service worker, disabled the
network, and reloaded `/demo`. The banner, six events, and **Offline ready**
state remained available. The complete browser suite also covers malformed
JSON, invalid bundle import, an over-10-MB import, recovery through demo,
exports, keyboard navigation, reduced motion, responsive layout, legal pages,
and direct 404 handling.

## Quality gates and claims

The checkout was clean before dependency installation.

| Check | Result |
|---|---|
| `npm ci --no-audit --no-fund` | PASS; 61 packages installed. |
| `npm test` | PASS; 6/6 tests. |
| `npm run build` | PASS; writes `dist/`. Initial JS is 39.38 kB (13.41 kB gzip); CSS is 14.56 kB (4.21 kB gzip). |
| `npm run test:e2e` | PASS; 55 passed, 1 deliberate desktop-only mobile-layout skip. |
| Every command in `.factory/claims.json` | PASS independently; all 14 declared commands passed. |

The independent claim commands exercised the sample timeline, visible evidence,
local privacy, offline reload, scrubbed free exports, license restoration,
timestamp ordering, no proximity-only match, local import boundary, Markdown
export, rule preset round-trip, update notice, paused purchase, and original
hero provenance. All claims have one tagged observable test; page and README
claims match that registry. No unlisted or untested public claim was found.

## Live routes, accessibility, and privacy

| Route | HTTP | Title | Serious/critical Axe findings |
|---|---:|---|---:|
| `/` | 200 | Async Trace Stitcher — incident timelines | 0 |
| `/demo` | 200 | Demo — Async Trace Stitcher | 0 |
| `/privacy` | 200 | Privacy — Async Trace Stitcher | 0 |
| `/terms` | 200 | Terms — Async Trace Stitcher | 0 |
| `/no-such-page` | 404 | Page not found — Async Trace Stitcher | 0 |

Every route has `lang="en"`, one h1, one main landmark, and no images without
alt text. Live Playwright Axe scans used WCAG 2 A/AA and 2.1 AA tags. On home,
Tab reached the visible 3px focus-ring skip link and Enter focused `main`.
Reduced motion reduced the primary-control transition to `0.00001s`.

The direct unknown route is a complete designed 404 with the product shell and
HTTP 404 status. Chromium reports that deliberate document status as a failed
resource in its console; it is expected for a 404 response, not an application
error. All normal app flows had no console or page errors.

Live headers provide HSTS, CSP (including response-header `frame-ancestors`),
`nosniff`, strict referrer policy, and permissions policy. The manifest,
robots, and sitemap return 200. The product is a static local-first PWA: it
has no backend tenant, restart, health, or 429 surface. Core-flow network tests
record only same-origin GET requests; data stays in browser storage. The only
optional external endpoint is the disclosed Sociobot license-verification API.

No `verify-url.sh` exists in this repository. Equivalent title, language,
landmark, alt-text, and console checks were run directly in the live browser.

## Earlier findings

All findings in `review-1.md`, `review-2.md`, `verification.md`, and
`verification-2.md` were checked, including their minor items.

| Earlier finding area | Current disposition |
|---|---|
| Review 1 demo, first screen, routes, metadata, links, claims | Fixed and covered by direct live exercise plus browser and claim tests. |
| Review 1 copy and README issues | Fixed; the current copy audit has no sentence over 22 words or banned term, and terminology is consistent. |
| F-2-1 direct 404 shared shell | Fixed; shared header/footer, skip link, metadata, title, main, legal links, and designed HTTP 404 all passed. |
| F-2-2/F-2-3 ordering, proximity, import/causal boundary | Fixed by independent ordering, no-proximity, and local-import-boundary claims; results state proposed, not proven. |
| F-2-4 through F-2-7 Pro outputs, update, purchase, art claims | Fixed by independent Markdown, preset, update-notice, paused-purchase, and provenance claims. |
| F-2-8 through F-2-12 labels, plain words, stable terms | Fixed in current controls and audited copy. |
| Earlier PII export, offline, focus, target size, and update limitations | Fixed by export, offline, keyboard/target, and waiting-worker tests. |

## Finding count

| Severity | Count |
|---|---:|
| Blocker | 0 |
| Major | 0 |
| Minor | 0 |
| Informational | 0 |
| Untested claims | 0 |

**Final verdict: PASS.**
