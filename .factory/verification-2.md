# Independent candidate verification — PASS

**Verified:** 2026-08-28 UTC

**Candidate:** `432f313d4b4195a628a56eb4f2b64d3ad1a2f3ec`

**Live URL:** https://async-trace-stitcher.sociobot.in
**Verdict:** **PASS — candidate is release-ready.**

This is a fresh independent verification of the repaired candidate. It does
not rely on the prior failed report at `verification.md` or on the builder's
handoff assertions. No product code was changed during this verification.

## Scope and result

The application meets the researched job: it accepts JSON/NDJSON evidence,
uses named visible rules to produce timestamp-ordered mechanical matches and
confidence, keeps unmatched evidence visible, and exports a locally created,
scrubbed incident bundle. It remains local-first except for the optional
license path.

No release defects were observed.

| Severity | Defects |
|---|---|
| P0 / blocker | None observed. |
| P1 / major | None observed. |
| P2 / minor | None observed. |
| P3 / informational | A rolling live service-worker revision was not available during this run. The update UI was instead exercised against a temporary, isolated copy of this exact `dist/` artifact; this is a coverage limitation, not a product defect. |

## Clean-checkout quality gates

The worktree was clean and checked out at the candidate SHA before dependency
installation. `npm ci` installed 61 packages and reported **0
vulnerabilities**. There is no lint script or lint configuration in this
repository; the production build includes the available strict TypeScript
check.

| Gate | Result | Fresh evidence |
|---|---|---|
| Unit tests | PASS | `npm test`: 6/6 Vitest tests passed. |
| Type check and exact production build | PASS | `npm run build`: `tsc --noEmit -p tsconfig.app.json` and Vite build both passed; `dist/` produced. |
| Browser integration | PASS | `npm run test:e2e`: 14/14 Playwright tests passed across desktop and 390×844 mobile. The recorded run status is `passed` with no failed tests. |
| Dependency security | PASS | `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities. |
| Bundle budgets | PASS | Initial JS: 33,969 bytes / 11.93 KB gzip (budget ≤200 KB); CSS: 11,932 bytes / 3.62 KB gzip (budget ≤50 KB). Mobile hero: 34,462 bytes; desktop hero: 94,198 bytes, both below 300 KB. |
| Lighthouse, live mobile run | PASS | Performance 100; Accessibility 100; FCP 0.9 s; LCP 1.2 s; TBT 70 ms; CLS 0. |

## Independent product exercise

All browser probes below used the live candidate after its byte identity was
established.

- **Normal workflow:** loaded the worked example and stitched it on desktop
  and 390px mobile. Each produced 5 identifier-matched events, 1 explicitly
  unmatched event, 0 parse issues, a reviewable timeline, and an unmatched
  evidence section.
- **Visible rules and honest inference:** the UI exposes each named rule and
  its fields. A proximity-only case remains unmatched; the copy says
  proximity never creates an identifier match.
- **Malformed and recovery paths:** two sources with one valid shared
  `request_id` event and an invalid NDJSON line produced 2 identifier-matched
  events and a visible, source/line-specific parse issue. Loading the worked
  example afterwards recovered to the expected 5/1/0 result.
- **Invalid/boundary input:** an unsupported case bundle displayed
  `not-a-case.json is not a valid Async Trace Stitcher case bundle`; a
  10,000,001-byte source was rejected with the visible 10 MB browser-safety
  message.
- **Export privacy:** an independently downloaded JSON bundle containing
  configured `email`, `phone`, `client_ip`, and nested `accessToken` matching
  fields contained none of the supplied email, phone, IP, or token literals;
  it contained 28 redaction markers. This covers raw data, labels/evidence,
  and derived identifiers, the prior P0 failure mode.
- **Local-first/network:** during normal, malformed, recovery, and export
  workflows the only request origin was
  `https://async-trace-stitcher.sociobot.in`. Static review found no analytics
  or vendor-ingestion endpoint; the optional Sociobot license endpoint is the
  only permitted external connection and is declared in CSP/privacy copy.
- **Persistence and offline:** on the live 390px app, after saving
  `Independent offline case`, the active service worker (`ats-v3`) controlled
  the page. With Playwright offline mode enabled, reload restored the case,
  the app shell, and `Offline ready` with no page errors.
- **Service-worker update:** in an isolated temporary copy of the exact built
  artifact, changing only the worker cache-version string caused
  `registration.update()` to show `A new offline version is ready` and the
  `Update now` control. Activating it triggered the app's controller-change
  reload; a subsequent load was controlled by `ats-v5-update-qa`. The live
  candidate's worker itself is `ats-v3`, uses versioned precache cleanup,
  `skipWaiting`, and `clients.claim`.

## Accessibility, interaction, and responsive evidence

- Live desktop and exact 390×844 mobile have `lang="en"`, one `<h1>`, one
  `<main>`, a title, labelled controls, and meaningful hero-image alt text.
- Independent Axe scans of the completed workflow on both viewports found
  **0 serious/critical** violations under `wcag2a`, `wcag2aa`, and
  `wcag21aa`.
- Keyboard-only smoke test: Tab reveals the skip link and Enter moves focus
  to `main`; the primary and form controls expose the designed 3px focus
  outline. Header/form control regression coverage verifies ≥44px targets.
- No horizontal overflow was observed at 1440px or 390px. Under
  `prefers-reduced-motion: reduce`, the hero transform is `none` and control
  transitions are `0.00001s` on both viewports.
- No console errors or uncaught page errors occurred in the independent
  desktop/mobile, recovery, offline, export, or live normal-flow probes.
- `/privacy` and `/terms` return the SPA legal pages with one clear heading
  each.

## Live identity and browser response policy

The deployment is not stale: its core bytes exactly match this candidate's
fresh local production build.

| Resource | SHA-256 |
|---|---|
| `index.html` | `5aa9a884c8fbffe58cd80015ac80fd54a2f8307c17e9ec009722b9934d04bb1b` |
| `/assets/index-SwnKZJTg.js` | `d6f111001aebfc8f33972991d0df04e04a15cfd63b0029a02010a15c7b2ef513` |
| `/assets/index-Dxazl3ON.css` | `16de3afa0a21ff9a4dc5117cb967087322fe598cc8b9ab631ac5e63e8e085a8d` |
| `sw.js` | `5b3b1021b7ac7e9b13b8bb091acb2d6b200471f4361e8f5f953a1b909ae98d00` |
| `manifest.webmanifest` | `20179aee3758637f0d1fb8e77ff1395e42b4f38e7b744431bd94463689182555` |

Fresh live HTTP checks confirmed CSP (`default-src 'self'`, narrowly allowing
the optional Sociobot API), Permissions-Policy, HSTS, strict-origin referrer
policy, and `X-Content-Type-Options: nosniff`. Hashed JS/CSS use
`Cache-Control: public, max-age=31536000, immutable`; `sw.js` uses
`no-cache`; HTML must revalidate; and the manifest is served as
`application/manifest+json` with its stated cache policy.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

For the live checks, use `https://async-trace-stitcher.sociobot.in`. This is a
static PWA, not a library/CLI or backend, so consumer-package, concurrency,
health, and persistence-server tests do not apply.
