# Async Trace Stitcher repair-2 handoff

## Independent verification 3

**PASS — 5 September 2026 UTC.** Independent QA reviewed implementation
`fe981ab5cb7f623069c29d0fefa21b0daae4ddbe` and documentation base
`f73481f7bf01d84506c67f6ed6e83625ec561816`. The documentation-only commit
does not change product code. Fresh build and live `index.html`/`404.html`
SHA-256 values matched exactly.

From a clean clone, `npm test` passed 6/6, `npm run build` produced `dist/`,
the production dependency audit found 0 vulnerabilities, `npm run test:e2e`
passed 55 checks with one intentional desktop-only skip, and every one of the
14 declared claim commands passed independently. Fresh desktop and 390px live
contexts confirmed the first-screen job/audience/action, populated sample,
demo label/reset/isolation, real-data exit, offline reload, route titles,
legal pages, designed HTTP 404, keyboard skip link, reduced motion, and zero
serious/critical Playwright Axe findings on home, demo, privacy, terms, and
404. There are zero findings and zero untested claims.

The standalone `npx @axe-core/cli` could not start because this worker has no
system Chrome binary; Playwright's bundled Chromium completed the equivalent
live Axe scans. No `verify-url.sh` is present; equivalent browser checks were
run directly. Full evidence is in `.factory/verification-3.md`.

## Status

**PASS.** The repaired implementation is
`fe981ab5cb7f623069c29d0fefa21b0daae4ddbe`. It was deployed as static
deployment `45c2366b-67d2-4ab5-bf90-f94bd5dfb591` and verified at
<https://async-trace-stitcher.sociobot.in>.

This is a local-first tool for engineers debugging one failed customer
transaction across app logs, queues, webhooks, and vendor exports. The first
action is **Try it with sample data**. It immediately opens a reviewable
six-event timeline in an isolated demo database.

The handoff documentation is committed after the implementation SHA. The
final delivery records that documentation SHA separately.

## Repairs

| Review finding | Disposition |
|---|---|
| F-2-1, repeated Review 1 shared-shell finding | Fixed. `public/404.html` now has the product header, primary navigation, skip link, main landmark, footer links and one-liner, route metadata, social metadata, touch icon, and the same paper-workbench visual system. A direct unknown URL remains an intentional HTTP 404. |
| F-2-2 | Fixed. Added independent `timeline-ordering` and `proximity-does-not-match` claims. They use out-of-order timestamps and nearby, different IDs to assert rendered order and explicit unmatched events. |
| F-2-3 | Fixed. Copy now states the import/non-causal boundary plainly. `local-import-boundary` records every request, rejects data-bearing or external requests, and checks the proposed-result label. |
| F-2-4 | Fixed. `markdown-export` downloads and inspects review notes; `rule-preset-roundtrip` exports, changes, imports, and verifies matching rules. |
| F-2-5 | Fixed. `service-worker-update-notice` installs the shipped worker, registers an isolated waiting worker, and checks the notice and action. |
| F-2-6 | Fixed. `purchase-paused` checks that license restoration is present and no checkout action is rendered. |
| F-2-7 | Fixed. `original-hero-asset` checks the disclosed image and SHA-256 provenance for its source and shipped derivatives. |
| F-2-8 | Fixed. Visible actions now say **Remove source**, **Remove rule**, and **Import JSON file**. |
| F-2-9 | Fixed. Replaced implementation jargon with **field name** and **offline cache stores the page and app files**. |
| F-2-10 | Fixed. The heading is **Unmatched events**. |
| F-2-11 | Fixed. The try-out is consistently called **sample data**. |
| F-2-12 | Fixed. The product consistently uses **matching rules**, **JSON bundle**, and **CSV timeline**. |

Live testing also found a rapid-click edge case: **Reset demo** followed
immediately by **Start for real** could let the reset seed race with navigation.
The final implementation serializes the reset and start transition. The
regression test proves the real incident remains intact.

## Earlier review and verification reconciliation

| Earlier finding | Current disposition |
|---|---|
| Review 1: no isolated one-click demo | Still fixed. `/demo` immediately shows the six-event sample, persistent banner, Reset demo, Start for real, and the separate `demo:async-trace-stitcher` IndexedDB database. |
| Review 1: missing claims registry | Fixed and expanded from 6 to 14 independently executable claims. |
| Review 1: routes, titles, history, and links | Still fixed. Demo, legal routes, unknown route, route focus, and internal links have browser coverage. The direct static 404 is now complete. |
| Review 1: first-screen and README plain words | Still fixed. `.factory/copy-audit.md` has current counts, no flagged long sentences, and the terminology table. |
| Initial verification: PII export, offline state, skip focus, control targets, static headers | Still fixed by the existing export, offline, keyboard, target-size, and header checks. |
| Verification-2 informational worker-update limitation | Covered by the new isolated waiting-worker claim. The real live release has no artificial second version to wait on. |

## Clean-checkout verification

Fresh clone: `/tmp/async-trace-stitcher-clean-final.BRnVlV` at the final
implementation SHA.

| Gate | Result |
|---|---|
| Dependency install | `npm ci --no-audit --no-fund` installed 61 packages. Separate `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. |
| Unit tests | `npm test` passed: 6/6. |
| Build | `npm run build` passed and wrote `dist/`. Initial JS is 39.38 kB (13.41 kB gzip); CSS is 14.56 kB (4.21 kB gzip). |
| Browser suite | `npm run test:e2e` passed: 55 checks plus one intentional desktop-only mobile-layout skip, across desktop and 390 px mobile projects. |
| Public claims | All 14 declared commands passed independently from the fresh clone: sample timeline, visible evidence, local privacy, offline reload, export safety, license restore, timeline ordering, proximity, local import boundary, Markdown export, rule preset, worker update, purchase paused, and original hero asset. The run ended with `ALL_CLAIMS_OK`. |

The mobile hero image is 34,462 bytes and the desktop hero image is 94,198
bytes. Both are below the 300 kB budget.

## Live verification

- Production `index.html` SHA-256 is
  `d996bee42a5ee22d72daefb175f58d205839319904e1f7229b8ce8eb49202084`,
  exactly matching the deployed local build.
- Production unknown-route HTML SHA-256 is
  `d9d6621e2b674c96cb6a4d55b96f0d4f5ac91b4636b0042393036c536d9a4bd0`,
  exactly matching `dist/404.html`; the response status is 404.
- `verify-url.sh` passed on `/` and `/demo`: HTTP 200, correct titles,
  `lang="en"`, one h1, main landmark, image alt text, labelled buttons, and
  no console/page errors. Cold load measurements were 658 ms for home and
  826 ms for demo.
- Fresh 1440×900 and 390×844 browser contexts both started at scroll position
  zero and showed: **Build a timeline for one failed transaction**; **For
  engineers debugging a customer failure across logs, queues, and webhooks.**;
  **Try it with sample data**.
- In a fresh live demo context, the banner remained visible, six events and
  the five-match summary rendered, reset restored the bundled title, and a
  deliberately rapid reset/start transition preserved the real case. The demo
  `active-draft` was cleared after leaving.
- A live offline reload after the first demo visit retained the banner, all six
  events, and the **Offline ready** state.
- Live Playwright Axe scans found zero violations on `/`, `/demo`, `/privacy`,
  `/terms`, and an unknown route. Direct 404 keyboard testing confirmed Tab
  reaches the skip link and Enter focuses main. The browser records the
  deliberate document HTTP 404 as a failed-resource console entry; it is not
  an application error and the page itself completed normally.
- `manifest.webmanifest`, `robots.txt`, and `sitemap.xml` return 200. CSP,
  HSTS, no-sniff, strict referrer, and permissions-policy headers are present.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; LCP 1,136 ms, CLS 0, TBT 15 ms.

The requested `npx @axe-core/cli` command was attempted. Its Selenium driver
could not find a system Chrome binary in this worker. This is an environment
limitation, not a product result; the equivalent Playwright Axe integration
ran in both clean-suite and live scans above with zero violations.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
for claim in $(node -e "for (const c of require('./.factory/claims.json')) console.log(c.id)"); do
  npm run test:claim -- --grep "@claim:$claim"
done
```

Open `http://localhost:5173/demo` after `npm run dev`, or the live `/demo`
route. The sample is isolated from real browser data and can be reset.

## Notes and known gaps

No known product defects remain. This static PWA has no backend, tenant,
health, rate-limit, or server-persistence surface to test. New license sales
are deliberately unavailable; existing license restoration is supported and
tested. No vendor credentials, analytics, or third-party runtime assets are
used in the core workflow.

`.factory/catalog-description.txt` is a 103-character verb-first description
and has been copied unchanged to `/work/.evidence/catalog-description.txt`.
