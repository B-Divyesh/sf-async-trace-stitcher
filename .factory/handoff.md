# Async Trace Stitcher v1 handoff

## Shipped

- A complete browser-only workflow for JSON, JSON-array, and NDJSON evidence:
  named source slips, file/paste input, visible nested-field rules, configurable
  timestamps, exact cross-source matching, proposed ordering, confidence and
  evidence explanations, parse errors, and an explicit unmatched section.
- IndexedDB draft persistence, importable scrubbed incident bundles, scrubbed
  CSV, local deletion, and a PWA shell that reloads the saved case offline.
- A paper-cut evidence-workbench visual system with an original generated hero,
  responsive 36 KB/92 KB WebP assets, authored mark/icons, mobile layout,
  designed focus states, reduced-motion treatment, and offline/update states.
- One-time Pro contract: production Sociobot checkout link, returned token
  capture and URL cleanup, daily cached verification, optimistic cached unlock,
  restore/remove controls, and no blocking of the free experience. Pro adds
  reusable rule preset files and Markdown review notes; price is US$29 once.
- Privacy and terms routes, MIT license, sitemap/robots, README, and an honest
  warning that matches are mechanical evidence rather than causal claims.

## Verification

Run from a clean checkout:

```sh
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Verified on 2026-08-27:

- `npm test`: 5/5 engine tests passed.
- `npm run build`: passed; `dist/index.html` present.
- Playwright: 8/8 passed across desktop Chrome and a 390px-class mobile
  viewport, including offline reload with restored IndexedDB state.
- Axe (WCAG A/AA/2.1 AA tags): zero serious or critical violations on the
  completed sample investigation in both viewports.
- Factory `verify-url.sh`: HTTP 200, no console errors, title and `lang=en`, one
  h1, main landmark, zero missing image alt attributes, zero unlabeled buttons.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.6 s, CLS 0, total blocking time 0 ms, FCP 1.0 s.
- Production payload: 33.2 KB JS (11.6 KB gzip), 11.8 KB CSS (3.6 KB gzip),
  92 KB desktop hero / 36 KB mobile hero. No runtime third-party CDN requests.

The worker’s Playwright browser was supplied with
`PW_CHROME_PATH=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome`; a normal
developer setup can instead run `npx playwright install chromium` once.

## Known gaps and next steps

- Input is capped at 10 MB per chosen file to prevent accidental browser stalls.
  Very large exports should be filtered or split before import.
- The generic scrubber covers common sensitive keys and email/phone/IP patterns,
  but cannot infer every proprietary schema. The UI and exported bundle both
  instruct the investigator to review before sharing.
- Source clocks are ordered as provided; v1 flags proximity but does not estimate
  per-system clock skew. A future version could add a visible, manual skew rule.
- Billing product registration and production checkout smoke testing belong to
  the factory release process. No product ID or payment-provider secret is
  hardcoded here.
- Static hosting must route `/privacy` and `/terms` to `index.html`.
