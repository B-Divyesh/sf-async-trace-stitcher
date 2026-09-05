# Async Trace Stitcher

Build a reviewable incident timeline from redacted log, queue, and webhook
exports. The app is for engineers debugging one failed customer transaction.

Try it with sample data: <https://async-trace-stitcher.sociobot.in/demo>

## What it does

- The sample builds a six-event timeline from app, queue, and webhook JSON.
- Each match names its matching rule and exact identifier value.
- Unmatched events and malformed input lines remain visible.
- The core workflow keeps case data in browser storage.
- The app works offline after the first visit.
- Free CSV timeline and JSON bundle exports include every event.
- Exports remove common personal and secret values before download.

The app orders events by parsed timestamps and matching rules.
Time proximity never creates an identifier match.
Import files from your systems; the app does not connect to them.
Results are proposed, not proven.

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

The offline cache stores the page and app files. The app offers an update when
a new version is ready.

## Privacy and licenses

Case data stays in IndexedDB. The demo uses its own `demo:` database and never
opens the real case.

The core workflow sends requests only to the product origin. Existing Pro
licenses can be verified through the Sociobot API. This app does not sell new
licenses.

Never paste vendor credentials. Review each export before sharing it.

See [Privacy](https://async-trace-stitcher.sociobot.in/privacy) and
[Terms](https://async-trace-stitcher.sociobot.in/terms).

## Project notes

- Scope: [`.factory/brief.json`](.factory/brief.json)
- Visual system: [`.factory/design.md`](.factory/design.md)
- Demo contract: [`.factory/demo.md`](.factory/demo.md)
- Verification handoff: [`.factory/handoff.md`](.factory/handoff.md)

MIT licensed. See [LICENSE](LICENSE).
