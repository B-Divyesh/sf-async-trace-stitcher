# Review handoff — async-trace-stitcher-review-2

## What was done

- Completed the requested adversarial first-read review on the deployed site in fresh 390×844 and 1440×900 Chromium contexts.
- Audited landing and README copy, demo behavior, storage isolation, offline behavior, listed and unlisted claims, route metadata, link health, history focus, accessibility, visual identity, and every Review 1 finding.
- Wrote `.factory/review-2.md` with a **FAIL** verdict: 12 findings remain. The direct static 404 repeats a partly fixed Review 1 structure finding and is blocking.
- Changed no product code.

## How it was verified

Clean clone: `/tmp/ats-review-2-clean.Tl8EsU`.

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run test:claim -- --grep @claim:sample-timeline
npm run test:claim -- --grep @claim:visible-evidence
npm run test:claim -- --grep @claim:local-private
npm run test:claim -- --grep @claim:offline-reload
npm run test:claim -- --grep @claim:export-safety
npm run test:claim -- --grep @claim:license-restore
```

Results: 6 unit tests passed; build passed and produced `dist/`; 33 browser tests passed with one intentional desktop skip; all six claim commands passed. Live `verify-url.sh` checks passed on home and demo. Live axe checks reported zero violations on home, demo, privacy, terms, and 404.

## What remains

See F-2-1 through F-2-12 in `.factory/review-2.md`. The highest-priority work is to make the direct HTTP 404 use the complete shared shell and metadata, then add tests/registry entries for the ordering, proximity, boundary, Pro-output, update-notice, purchase-status, and provenance claims. Copy cleanup remains for generic control labels, two jargon terms, one vague heading, and inconsistent sample/rule/download terminology.
