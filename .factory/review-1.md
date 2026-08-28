# Adversarial first-read review 1

**Verdict: FAIL** — blocking findings are present.

Review target: `https://async-trace-stitcher.sociobot.in`, checked 2026-08-28 in new Chromium contexts at 390×844 and 1440×900. No product code was changed.

## Cold first screen

Before scrolling, I understood this as a browser tool that turns log, queue, and webhook exports into a timeline. I could infer it is for a technical person with exported records, but could not identify the intended person or situation: the screen never says “engineer”, “debugging”, or “failed customer transaction”. I also saw two competing actions, **“Start an investigation”** and **“Try the example”**; the first does not state its result and the second is not labelled sample data.

This is **BLOCKING** under the first-screen rule. The heading, **“Find the thread through async failure.”**, is a metaphor rather than the job, and the supporting sentence, **“Turn redacted logs, queue records, and webhook exports into a timestamped, reviewable timeline—without deploying an APM or uploading customer evidence.”**, names inputs but not the visitor. Replace the hero with:

> **Build a timeline for one failed transaction**  
> For engineers debugging a customer failure across logs, queues, and webhooks.  
> **Try it with sample data** — See a stitched six-event incident timeline.

Keep one primary sample action. Put the real action beside it as **“Import redacted exports”**.

## Findings, in severity order

### BLOCKING — No isolated one-click demo

**Evidence.** The only hero action is **“Try the example”**. Clicking it stays at `/`, scrolls to the workbench, and shows **“Your evidence board is empty”** rather than a stitched result. It loads realistic source records but requires a second click on **“Stitch the timeline”** to show value. There is no `/demo` implementation: direct `/demo` returns HTTP 200 but renders the ordinary empty landing page.

The required persistent banner, **“Demo — sample data, nothing is saved”**, is absent. There is no **“Reset demo”** or **“Start for real”** control. In a fresh context, clicking the example created/used IndexedDB database `async-trace-stitcher`, the same production database and `active-draft` key used by normal work; the visible status became **“Saved locally”**. Therefore sample data is not sandboxed from real data.

**Why this loses or misleads a first-time visitor.** The visitor is told they can try an example but first sees an empty product and is silently saving data in the real workspace.

**Concrete fix.** Implement `/demo` (or `?demo=1`) that seeds and immediately displays the six-event stitched timeline. Use a separate `demo:` IndexedDB namespace and never read/write the real draft while the banner is visible. Add the banner and working Reset/Start-for-real actions. Add Playwright tests for direct demo entry, first-frame results, reset, no writes to the real namespace, and offline demo reload.

### BLOCKING — Claims registry and claim tests are missing

**Evidence.** `.factory/claims.json` and `.factory/demo.md` are absent. A fresh local clone therefore had zero listed claim commands to run. `npm test` (6 unit tests) and `npm run build` passed, but neither creates a claims registry or tagged `@claim:<id>` tests. Existing browser tests are also untagged and do not use a demo entry point.

The following live landing claims are all unlisted:

| Unlisted claim | Required resolution |
|---|---|
| “Turn redacted logs, queue records, and webhook exports into a timestamped, reviewable timeline—without deploying an APM or uploading customer evidence.” | Register import, stitching, and same-origin/local-only observable tests, or reduce to non-claim explanatory copy. |
| “Runs in this browser” | Register a demo test that completes the workflow with no cross-origin request. |
| “Works offline” | Register an offline reload test from `/demo`, after the first visit. |
| “Evidence stays in IndexedDB on this device.” | Register a storage-namespace and request-interception test. |
| “Every match names the rule and exact value.” | Register a demo assertion over the displayed matched events. |
| “Unmatched and malformed events stay visible.” | Register a demo assertion containing both an unmatched event and a parse issue. |
| “Nothing below leaves this device unless you choose checkout.” | Register request interception over the entire demo flow, explicitly allow only same-origin assets, and separately test the checkout boundary. |
| “The full stitcher, JSON/CSV export, redaction, and offline use stay free.” | Register export, redaction, and offline tests, or replace with exact, supportable plan copy. |

The required privacy/offline interception test cannot be performed through a valid demo because none exists. For information only, clicking the current example after initial load made only same-origin image requests; that is not proof of the advertised whole-flow privacy claim.

### BLOCKING — Broken route and link behaviour

**Evidence.** `/demo` renders the normal home page rather than the demo. `/no-such-page` returns HTTP 200 and renders the normal home page; there is no designed 404. The live **“Buy Pro securely”** link (`https://api.sociobot.in/api/v1/products/async-trace-stitcher/checkout`) returned HTTP 404 when crawled. Source inspection also finds no History API route handling, route-change focus movement, or polite route announcement.

**Why this loses or misleads a visitor.** A promised destination does not exist, an unknown address masquerades as the home page, and a purchase action fails.

**Concrete fix.** Route `/demo`, `/privacy`, `/terms`, and an explicit 404 as real states; set focus to the new h1 and announce route changes on in-app navigation. Return/render a designed 404 for unknown paths. Correct or remove the checkout URL until the target returns a valid response. Add a crawler test plus direct-route/back-button/focus tests.

### Major — First-screen copy and actions fail the plain-words contract

**Evidence.** **“Find the thread through async failure.”** is metaphorical and does not say that the app builds a timeline. **“Local evidence workbench”**, **“APM”**, **“NDJSON”**, **“IndexedDB”**, and **“correlation”** appear without first-read explanations. **“Start an investigation”** only scrolls; it is not a result-naming verb. **“Try the example”** is inconsistent with the required “sample data”, and **“Load a worked example”** introduces a third name for the same thing.

**Concrete fix.** Use the hero rewrite above. Use “sample data” everywhere. Replace “Start an investigation” with **“Import redacted exports”**, and replace “Load a worked example” with **“Load sample data”**. Explain technical formats at the point of input: “Paste JSON log exports (one record per line is supported).”

### Major — Required metadata, route titles, and shared skeleton are incomplete

**Evidence.** Every tested route (`/`, `/privacy`, `/terms`, `/demo`, and an unknown route) has the identical title **“Async Trace Stitcher · Local incident timeline builder”**. This uses `·`, not the required `Product — what it does` pattern; Privacy and Terms do not receive route-specific titles. The landing does have `lang`, one h1, a description, SVG favicon, main landmark, and meaningful hero alt text. It lacks canonical, Open Graph, Twitter-card, and apple-touch metadata. The sitemap omits `/demo` and any 404 route.

The header has no Demo link. The footer has Privacy and Terms but omits **“Built by Param Factory”** and a version/build ID. The original paper-cut evidence artwork and warm workbench treatment are distinct and consistent with `.factory/design.md`; no generic-template finding is raised.

**Concrete fix.** Set titles such as **“Async Trace Stitcher — incident timelines”**, **“Privacy — Async Trace Stitcher”**, **“Terms — Async Trace Stitcher”**, and **“Demo — Async Trace Stitcher”**. Add canonical, OG/Twitter image metadata, 180px apple touch icon, Demo route/sitemap entry, and required footer text. Add metadata and route-title checks to browser tests.

### Minor — README copy is accurate in places but is too implementation-heavy and contains long sentences

**Evidence and fix.** The 33-word deployment sentence and 32-word service-worker sentence exceed the 22-word cap. Rewrite them as short deployment steps, for example: **“Upload `dist/` to a static host. Configure unknown routes to serve `index.html`.”** and **“The service worker caches the app shell and assets. It shows a notice when an update is ready.”** Explain or move terms such as CSP, MIME, IndexedDB, PII, and NDJSON into a technical appendix.

## Copy audit

Word counts treat a hyphenated or code/path token as one word. Commands and headings are inventoried separately because they are not sentences.

### Landing sentences

| Words | Sentence |
|---:|---|
| 6 | Find the thread through async failure. |
| 21 | Turn redacted logs, queue records, and webhook exports into a timestamped, reviewable timeline—without deploying an APM or uploading customer evidence. |
| 9 | Runs in this browser · Works offline · Visible rules only. |
| 3 | Three disconnected systems. |
| 3 | One inspectable thread. |
| 7 | Evidence stays in IndexedDB on this device. |
| 8 | Every match names the rule and exact value. |
| 6 | Unmatched and malformed events stay visible. |
| 4 | Import redacted data only. |
| 9 | Nothing below leaves this device unless you choose checkout. |
| 17 | Matches a terminal key such as `request_id`, or an exact path such as `data.order_id`. |
| 9 | Terminal keys or exact paths, tried in this order. |
| 1 | Seconds. |
| 6 | Proximity never creates an identifier match. |
| 19 | Paste or choose JSON/NDJSON in at least two source slips, check the visible rules, then stitch the timeline. |
| 8 | Add reusable rule-preset files and Markdown review notes. |
| 12 | The full stitcher, JSON/CSV export, redaction, and offline use stay free. |
| 7 | Sociobot/Dodo is the merchant of record. |
| 3 | Local-first incident analysis. |
| 6 | Hero imagery generated for this product. |

Landing headings/actions/fragments checked: **“Local evidence workbench”** (4), **“Start an investigation”** (3), **“Try the example”** (3), **“Local by default”** (3), **“No hidden inference”** (3), **“Honest gaps”** (2), **“Case workspace”** (2), **“Build the evidence board”** (4), **“Name the case”** (3), **“Add evidence”** (2), **“Set visible rules”** (3), **“Stitch the timeline”** (3), **“Your evidence board is empty”** (5), **“Load a worked example”** (4), **“Pro investigator tools · US$29 once”** (6), **“Buy Pro securely”** (3), and **“Restore purchase”** (2). Flagged items are addressed in the Major first-screen finding; **“Seconds.”** is an out-of-context heading and should be **“Time window in seconds”**.

### README sentences

| Words | Sentence |
|---:|---|
| 22 | Async Trace Stitcher is a local-first investigation workbench for engineers reconstructing one failed transaction across application logs, queues, webhooks, and vendor exports. |
| 19 | Paste or import redacted JSON/NDJSON, define the identifiers that count as evidence, and export a reviewable incident timeline. |
| 16 | Parses JSON objects, arrays of objects, and NDJSON while preserving malformed lines as visible parse issues. |
| 9 | Searches nested objects for configurable timestamp and identifier fields. |
| 20 | Correlates exact values across sources, shows the matching rule and value, and keeps time-only proximity explicitly low confidence and unmatched. |
| 16 | Saves the active case in IndexedDB and runs after the first visit without a network connection. |
| 8 | Exports CSV and an importable JSON incident bundle. |
| 18 | Common PII and sensitive keys—including values retained by configured correlation rules—are scrubbed locally before any export. |
| 16 | Offers an optional US$29 one-time Pro unlock for reusable rule presets and Markdown review notes. |
| 10 | Core analysis, safety, accessibility, and JSON/CSV exports remain free. |
| 18 | This is a case-by-case evidence tool, not live telemetry ingestion, an APM, or a source of causal truth. |
| 10 | Always review the original exports and the explicitly unmatched events. |
| 6 | Vite prints the local development URL. |
| 14 | All runtime assets are bundled; there are no font, script, analytics, or image CDNs. |
| 9 | The exact production build command is `npm run build`. |
| 14 | It type-checks the app and writes the static deployment to `dist/`, with `dist/index.html` at its root. |
| 20 | Browser tests cover the worked investigation, mobile and desktop accessibility, legal routes, and an offline reload with restored IndexedDB state. |
| 19 | Upload the contents of `dist/` to the static host and configure navigation fallbacks to `index.html` so `/privacy` and `/terms` resolve directly. |
| **33** | **The checked-in `staticwebapp.config.json` supplies CSP, disabled browser permissions, manifest MIME, no-cache service-worker behavior, and immutable caching for hashed assets on the production Azure Static Web App; `_headers` provides the same policy for standard compatible hosts.** |
| 10 | Do not edit DNS, billing, or infrastructure from this repository. |
| **32** | **The service worker precaches the versioned app shell, discovers Vite’s hashed JS/CSS assets at install time, caches assets locally, and shows an in-app update notice when a new worker is waiting.** |
| 5 | Evidence stays in the browser. |
| 17 | IndexedDB stores the active case; localStorage stores only a Pro license token and its cached verification result. |
| 7 | The core workbench makes no API calls. |
| 16 | License checkout and verification use the Sociobot billing API; Sociobot/Dodo is the merchant of record. |
| 20 | Never paste vendor credentials, and review every scrubbed export because arbitrary schemas can hide sensitive data under unexpected field names. |
| 2 | MIT licensed. |

README headings and label fragments checked: **“What it does”**, **“Run locally”**, **“Test and build”**, **“Deploy”**, **“Privacy and licenses”**, **“Project notes”**, **“Live product”**, and **“Requirements: Node.js 20+ and npm.”** The last is a fragment; rewrite it as **“Use Node.js 20 or later with npm.”**

### Terminology consistency check

| Concept | Terms currently used | Required single term |
|---|---|---|
| Try-out | example; worked example; sample data (only in requirements) | sample data |
| Imported material | logs; queue records; webhook exports; evidence; source slips; sources | exports (with source as the UI object) |
| Output | timeline; evidence board; incident bundle | incident timeline (bundle only for the downloadable file) |
| Local location | browser; device; IndexedDB; local | browser storage (name IndexedDB in technical help) |

## Verification record

- Fresh live contexts at 390×844 and 1440×900: no console errors on landing; screenshots retained in the review environment.
- Live crawl: `/`, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`, and the GitHub Source link returned 200. The checkout link returned 404.
- Live route inspection: one h1, `lang="en"`, description, favicon, and main present; no canonical, OG, or Twitter metadata; `/demo` and an unknown path render home.
- Clean clone: `/tmp/async-trace-review-clone.rjOaSJ`; `.factory/claims.json` missing, so zero listed claim tests could be run. In that clone, `npm test` passed (6 tests) and `npm run build` passed.
- Current checkout: `npm test` and `npm run build` passed. `npx playwright test --project=desktop --workers=2` passed (7 tests), and the corresponding mobile command passed (7 tests). These are not claim tests and do not repair the missing demo/registry findings.

PASS requires all blocking findings resolved and no more than three minor findings. This review has three blocking findings and therefore remains FAIL.
