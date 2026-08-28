# Repair handoff — async-trace-stitcher-polish-1

Perfection-loop round 1 repairs the candidate reviewed in
`.factory/review-1.md`. Functional repair commit: `a25cf0d`. Deployed routing
commit: `f9c4ec6`.

## What changed

- Replaced the metaphorical first screen with the engineer, failed-transaction
  job, one primary sample action, a named import action, and three plain facts.
- Added `/demo` and `?demo=1`. Both seed and immediately render the six-event
  result without a second click.
- Added the persistent demo banner, **Reset demo**, and **Start for real**.
  Demo writes use `demo:async-trace-stitcher`; real case and license storage
  are never read or written while the banner is active. Leaving clears demo
  data.
- Added `.factory/claims.json`, six uniquely tagged claim tests, and
  `.factory/demo.md`.
- Added History API navigation, back-button state, route-title updates, heading
  focus, polite announcements, canonical metadata, Open Graph and Twitter
  metadata, a 1200×630 social image, an Apple touch icon, `/demo` sitemap entry,
  and client plus static 404 states.
- Removed the dead checkout action. Existing license restoration remains;
  new purchases are described as paused.
- Reordered the demo timeline before controls on phones and retained the
  side-by-side evidence workbench on desktop.
- Reworked input terms, the time-window label, README sentences, legal copy,
  footer attribution/build ID, and the catalog description.
- Preserved the paper-cut evidence-board identity. The new social image is a
  crop of the original generated workbench art.

## Verification evidence

Persistent summary: `.factory/evidence/round-1/local-verification.json`.

- `npm ci`: passed; audit reported 0 vulnerabilities.
- `npm test`: 6 unit tests passed.
- `npm run build`: passed and wrote `dist/index.html`.
- Production assets: 39,459-byte JS, 14,561-byte CSS, and 34,462-byte mobile
  hero image. These are below the 200 KB, 50 KB, and 300 KB budgets.
- `npm run test:e2e`: 33 passed, 1 intentional desktop skip, 0 failed across
  desktop and 390×844 mobile projects. The skip is the mobile-only viewport
  assertion running under the desktop project.
- Integrated axe checks: home, demo, privacy, terms, and 404 passed in both
  projects with 0 serious or critical violations.
- Privacy proof: the complete demo flow made only same-origin requests. The
  test also proved the real and `demo:` IndexedDB records remain isolated.
- Offline proof: `/demo` reloaded with all six events after Chromium was set
  offline.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/demo ...`: passed with
  0 console errors, one h1, `lang=en`, a main landmark, complete alt text, and
  no unlabeled buttons.
- Lighthouse mobile landing: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100, LCP 1.6 s, CLS 0, TBT 0 ms.
- Lighthouse mobile demo: Performance 100, Accessibility 100, Best Practices
  100, SEO 100, LCP 1.4 s, CLS 0, TBT 30 ms.

## Clean-clone claim proof

Cloned committed source with `git clone --no-local /work/repo` to
`/tmp/ats-polish-clean.pSjwPA`, then ran `npm ci`. Every command read from
`.factory/claims.json` passed independently:

- `@claim:sample-timeline`: 1 passed.
- `@claim:visible-evidence`: 1 passed.
- `@claim:local-private`: 1 passed.
- `@claim:offline-reload`: 1 passed.
- `@claim:export-safety`: 1 passed.
- `@claim:license-restore`: 1 passed.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
jq -r '.[].test' .factory/claims.json
```

Run each printed claim command from a fresh clone. Serve `dist/` to inspect the
production service worker and offline behavior.

## Deployment evidence

- Ran the work-order command: `npm ci && npm test && npm run build`.
- Deployed `dist/` with
  `/opt/fleet/lib/deploy-static.sh async-trace-stitcher dist`.
- Azure deployment `e49dd996-3ba0-4632-accf-5713a7612d27` succeeded on
  `proud-sea-07b7c890f.7.azurestaticapps.net`.
- The custom domain is ready at
  <https://async-trace-stitcher.sociobot.in>.
- Live status: `/`, `/demo`, `/?demo=1`, `/privacy`, and `/terms` return 200.
  `/no-such-page` returns the designed static page with status 404.
- Live `verify-url.sh` passed on home and demo. Both reported zero console
  errors, one h1, `lang=en`, a main landmark, complete alt text, and no
  unlabeled buttons.
- A fresh live Chromium context loaded six demo events, reloaded all six
  offline, and observed only the product origin during the demo flow.
- Live History API checks moved focus to the demo h1 and restored focus to the
  home h1 after Back. Privacy and Terms returned their route-specific titles.

## Known gaps

There are no known blocking product findings. The Sociobot checkout endpoint
still returns 404, so no purchase link is shown. This avoids sending visitors
to a broken destination while preserving existing license restore.
