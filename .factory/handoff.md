# Async Trace Stitcher repair handoff — PASS

**Work order:** `async-trace-stitcher-repair-1`  
**Base verified:** `aabd9e6bafb0c1d27b419238dd1821955326065f`  
**Repair:** `d8b3f22de047a6ad5ec1a35a04b5d24190be02f1`  
**Date:** 2026-08-28 UTC  
**Release decision:** **PASS — static PWA repair is buildable and deployed.**

The independent report remains at [`verification.md`](verification.md) as the
record of the failed candidate. This handoff records the repair evidence.

## Repairs

- **P0 export privacy:** centralized event-export scrubbing. Raw data,
  evidence, derived `identifiers`, labels, notes, draft metadata, and parse
  issue text are now scrubbed before JSON/CSV/Markdown export. Sensitive paths
  recognize nested and camelCase forms such as `nested.accessToken`; configured
  email, phone, and token identifier values are replaced with `[REDACTED]`.
  Safe IDs in a mixed rule remain reviewable.
- **P1 offline status:** pinned `@playwright/test` to `1.58.2`, the version
  matching the supplied Chromium installation, and made the initial/header
  offline state an explicit application state updated from browser online and
  offline events. The saved IndexedDB case and `Offline ready` status now pass
  in the checked-in desktop and 390px mobile offline-reload test.
- **Keyboard and targets:** `main` is focusable by the skip link; navigation,
  text fields, and rule checkboxes meet a 44×44px target contract. Both checks
  have desktop and mobile regression coverage.
- **Response policy:** added Azure Static Web Apps
  `staticwebapp.config.json` plus portable `_headers`: CSP, disabled unused
  permissions, manifest MIME, uncached service worker, and immutable hashed
  assets. The manifest version query and cache name were advanced for the
  release.

## Verification evidence

Performed from a clean dependency install (`npm ci`: 61 packages, 0
vulnerabilities) with Node 22.23.2.

| Gate | Result | Evidence |
|---|---|---|
| Unit/type/production build | PASS | `npm test`: 6/6; `npm run build`: TypeScript check and `dist/` output. |
| Browser integration | PASS | `npm run test:e2e`: 14/14 across desktop and exact 390×844 mobile. Covers workflow, JSON PII export download, offline IndexedDB reload, skip focus, 44px targets, legal pages, and axe. |
| Accessibility | PASS | Playwright axe serious/critical: 0 on completed workflow in both viewports. Local `verify-url.sh`: title, `lang`, one h1, main, image alt, labeled buttons, and zero console/page errors. |
| Offline/PWA | PASS | Playwright explicitly calls `context.setOffline(true)`, reloads under service-worker control, restores “Offline refund incident” from IndexedDB, and sees `Offline ready` in both projects. Service worker retains skip-waiting/client-claim update behavior; `ats-v3` is the new cache generation. |
| Privacy/network | PASS | A browser workflow requested only its own origin: document, hashed JS/CSS, mark SVG, and local hero WebP. No analytics, CDNs, or evidence uploads. |
| Response policy | PASS | Built `dist/staticwebapp.config.json` parses with `jq`; it specifies CSP, Permissions-Policy, manifest `application/manifest+json`, immutable `/assets/*`, and no-cache `/sw.js`. |
| Performance | PASS | Mobile Lighthouse against local production preview: Performance 100, Accessibility 100, FCP 1.0s, LCP 1.6s, TBT 0ms, CLS 0. Initial JS 33.97KB (11.93KB gzip), CSS 11.93KB (3.62KB gzip); both below budget. |

## Run and deploy

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

`dist/` is the deployable static artifact, containing `index.html` and the
Azure Static Web Apps policy file. It was deployed with
`/opt/fleet/lib/deploy-static.sh async-trace-stitcher dist`; post-deploy
identity, headers, and browser checks are recorded with the deployment result.

## Known gaps

No rolling production update was available to manually trigger the visible
“Update now” toast. The implemented `updatefound`/`SKIP_WAITING` path remains
in place; the service worker cache generation and installed-app start URL were
advanced in this release.
