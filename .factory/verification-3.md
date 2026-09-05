# Async Trace Stitcher verification 3

**Verdict: PASS.** Zero findings. Zero untested public claims.

Verified 5 September 2026 UTC against
<https://async-trace-stitcher.sociobot.in>.

- Implementation candidate: `fe981ab5cb7f623069c29d0fefa21b0daae4ddbe`
- Documentation base: `f73481f7bf01d84506c67f6ed6e83625ec561816`

The later documentation commit changes only `.factory/handoff.md`; the live
application bytes match a fresh production build from that checkout and thus
the implementation candidate.

## Job, audience, and first action

This is a local browser tool that builds a reviewable timeline for one failed
customer transaction from redacted app, queue, and webhook exports. It is for
engineers debugging a customer failure across those systems. The first action
is **Try it with sample data**, which opens the already-stitched sample
timeline.

Fresh desktop (1440×900) and phone (390×844) browser contexts began at scroll
position zero and showed that job, audience, and action before scrolling. The
home title is `Async Trace Stitcher — incident timelines`.

## Clean-checkout quality gates

Fresh clone: `/tmp/async-trace-stitcher-verify-3.A74bqV` at
`f73481f7bf01d84506c67f6ed6e83625ec561816`.

| Check | Result |
|---|---|
| `npm ci --no-audit --no-fund` | PASS; 61 packages installed. |
| `npm test` | PASS; 6/6 Vitest tests. |
| `npm run build` | PASS; creates `dist/`. Initial JS is 39.38 kB (13.41 kB gzip); CSS is 14.56 kB (4.21 kB gzip). |
| `npm audit --omit=dev --audit-level=high` | PASS; 0 vulnerabilities. |
| `npm run test:e2e` | PASS; 55 passed and one intentional desktop-only mobile-layout skip. |
| Every `test` command in `.factory/claims.json` | PASS independently; all 14 commands ended successfully with `ALL_CLAIMS_OK`. |

The test suite exercises normal, malformed, invalid, oversized, recovery,
export, license-restoration, rule-preset, update-notice, keyboard, route, and
responsive paths. The only browser-suite skip is deliberate: the mobile-layout
assertion skips in the desktop project and passes in the 390px mobile project.

## Public claims

All 14 registered claims are listed, have exactly one tagged test, and passed
their declared clean-demo command: sample timeline; visible evidence;
local-private; offline reload; export safety; license restoration; timeline
ordering; no proximity match; local import boundary; Markdown export; rule
preset round-trip; service-worker update notice; paused purchase; and original
hero asset provenance.

I cross-checked landing, workbench, README, legal, and footer copy against the
registry. The public promises about local storage, same-origin core workflow,
offline reload, exports/redaction, ordering, matching, import limits, Pro
restoration, paused sales, update notices, and hero provenance are covered.
No unlisted or untested public claim remains.

## Live product exercise

In new desktop and phone contexts:

- `/demo` immediately rendered the persistent **Demo — sample data, nothing is
  saved** label, six events, five identifier matches, one explicit unmatched
  event, and one parse issue.
- Changing the sample then selecting **Reset demo** restored `Payment retry
  failed after vendor timeout`. **Start for real** removed the label and
  opened `Untitled incident`; demo data did not leak into real data.
- After the first demo visit, an offline phone reload retained the banner,
  six events, and **Offline ready**.
- Desktop and phone had no horizontal overflow. No console or page errors were
  observed during the normal demo/reset/leave flow.
- Live response checks returned 200 for home, demo, privacy, terms, manifest,
  robots, and sitemap. An unknown route returned the completed designed page
  with HTTP 404. The deliberate 404 document status is expected, not a defect.
- The live page serves HSTS, CSP with `frame-ancestors` as a response header,
  `nosniff`, strict referrer policy, permissions policy, correct manifest MIME,
  and the expected cache policies.

Fresh live checks confirmed each route below has one h1 and one main landmark.
Playwright Axe with WCAG 2 A/AA and 2.1 AA tags found zero serious or critical
violations on every route.

| Route | HTTP | Title | Axe serious/critical |
|---|---:|---|---:|
| `/` | 200 | Async Trace Stitcher — incident timelines | 0 |
| `/demo` | 200 | Demo — Async Trace Stitcher | 0 |
| `/privacy` | 200 | Privacy — Async Trace Stitcher | 0 |
| `/terms` | 200 | Terms — Async Trace Stitcher | 0 |
| `/no-such-page` | 404 | Page not found — Async Trace Stitcher | 0 |

Keyboard testing on live home verified Tab reaches the visible skip link and
Enter focuses `main`. Under reduced motion, the primary-control transition is
`1e-05s`. The built-in Playwright Axe scan is the equivalent of the requested
Axe check. `npx @axe-core/cli` was also attempted, but its Selenium driver
could not find a system Chrome binary in this worker. This is an environment
limitation; it is not a product failure because the bundled Playwright browser
completed the live scans above. No `verify-url.sh` exists in this repository;
the route/title/lang/main/alt/console checks were performed directly by the
browser suite and live probes.

## Candidate and deployment identity

Fresh build and live response SHA-256 values match exactly:

| File | SHA-256 |
|---|---|
| `index.html` | `d996bee42a5ee22d72daefb175f58d205839319904e1f7229b8ce8eb49202084` |
| `404.html` | `d9d6621e2b674c96cb6a4d55b96f0d4f5ac91b4636b0042393036c536d9a4bd0` |

This proves the tested live runtime is the reviewed implementation, not a
stale deployment. The static PWA has no backend, tenant, health endpoint,
rate-limit surface, or server-side persistence; tenant isolation, restart,
health, and 429 checks do not apply.

## Earlier findings disposition

All findings in `.factory/review-1.md`, `.factory/review-2.md`,
`.factory/verification.md`, and `.factory/verification-2.md` were inspected.

| Earlier area | Current disposition and evidence |
|---|---|
| Review 1: first screen, one-click isolated demo, claim registry | Fixed. Live first screen is plain and explicit; `/demo` is populated immediately, labelled persistently, resettable, and isolated. All 14 claim commands passed. |
| Review 1: routes, metadata, shell, links, 404 | Fixed. Live route table above passed; direct unknown route is a designed HTTP 404 with shared navigation/footer and metadata. |
| Review 1: copy and terminology | Fixed. Current copy audit records no flagged landing/demo sentence; product uses sample data, exports, matching rules, incident timeline, JSON bundle, and CSV timeline consistently. |
| F-2-1 | Fixed. Direct static 404 has the shared shell, skip link, legal links, metadata, title, one h1, and main. |
| F-2-2 and F-2-3 | Fixed. Independent ordering, proximity, and local-import-boundary claims passed. The UI calls results proposed, not proven. |
| F-2-4 through F-2-7 | Fixed. Markdown export, rule preset round-trip, isolated update notice, paused purchase, and generated-asset provenance claims passed. |
| F-2-8 through F-2-12 | Fixed. Current control labels, plain language, unmatched heading, sample-data wording, and terminology match the repair record and current UI. |
| Verification-2 update limitation | Resolved by the independent `service-worker-update-notice` claim, which passed from the shipped worker in a clean browser context. |

## Finding count

| Severity | Count |
|---|---:|
| Blocker | 0 |
| Major | 0 |
| Minor | 0 |
| Informational | 0 |
| Untested claims | 0 |

**Final verdict: PASS.**
