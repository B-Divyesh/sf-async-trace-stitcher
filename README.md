# Async Trace Stitcher

Build a reviewable incident timeline from redacted log, queue, and webhook
exports. The app is for engineers debugging one failed customer transaction.

Try the isolated sample: <https://async-trace-stitcher.sociobot.in/demo>

## What it does

- The sample builds a six-event timeline from app, queue, and webhook JSON.
- Each match names its rule and exact identifier value.
- Unmatched events and malformed input lines remain visible.
- The core workflow keeps case data in browser storage.
- The app works offline after the first visit.
- Free CSV and JSON exports include every event.
- Exports remove common personal and secret values before download.

The app proposes an event order from timestamps and visible matching rules.
It does not ingest live telemetry or prove what caused a failure.

## Run locally

Use Node.js 20 or later with npm.

```sh
npm ci
npm run dev
```

Vite prints the local development URL. Runtime assets are bundled in the app.

## Test and build

```sh
npm test
npm run build
npm run test:e2e
```

Claim tests are listed in [`.factory/claims.json`](.factory/claims.json).
Each command builds the app and runs one tagged browser test.

```sh
npm run test:claim -- --grep @claim:sample-timeline
```

The production build writes `dist/index.html` and its assets to `dist/`.

## Deploy

Upload `dist/` to a static host. Configure unknown routes to serve
`index.html` so client routes can render their correct page or 404 state.

The checked-in host configuration sets security and cache headers. It also
sets the web manifest content type.

The service worker caches the app shell and assets. It shows a notice when an
update is ready.

## Privacy and licenses

Case data stays in IndexedDB. The demo uses its own `demo:` database and never
opens the real case.

The core workflow sends requests only to the product origin. Existing Pro
licenses can be verified through the Sociobot API. New purchases are paused
because the checkout route is unavailable.

Never paste vendor credentials. Review each export before sharing it.

See [Privacy](https://async-trace-stitcher.sociobot.in/privacy) and
[Terms](https://async-trace-stitcher.sociobot.in/terms).

## Project notes

- Scope: [`.factory/brief.json`](.factory/brief.json)
- Visual system: [`.factory/design.md`](.factory/design.md)
- Demo contract: [`.factory/demo.md`](.factory/demo.md)
- Verification handoff: [`.factory/handoff.md`](.factory/handoff.md)

MIT licensed. See [LICENSE](LICENSE).
