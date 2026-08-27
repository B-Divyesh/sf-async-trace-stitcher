# Async Trace Stitcher

Async Trace Stitcher is a local-first investigation workbench for engineers
reconstructing one failed transaction across application logs, queues,
webhooks, and vendor exports. Paste or import redacted JSON/NDJSON, define the
identifiers that count as evidence, and export a reviewable incident timeline.

Live product: <https://async-trace-stitcher.sociobot.in>

## What it does

- Parses JSON objects, arrays of objects, and NDJSON while preserving malformed
  lines as visible parse issues.
- Searches nested objects for configurable timestamp and identifier fields.
- Correlates exact values across sources, shows the matching rule and value,
  and keeps time-only proximity explicitly low confidence and unmatched.
- Saves the active case in IndexedDB and runs after the first visit without a
  network connection.
- Exports CSV and an importable JSON incident bundle. Common PII and sensitive
  keys are scrubbed locally before any export.
- Offers an optional US$29 one-time Pro unlock for reusable rule presets and
  Markdown review notes. Core analysis, safety, accessibility, and JSON/CSV
  exports remain free.

This is a case-by-case evidence tool, not live telemetry ingestion, an APM, or
a source of causal truth. Always review the original exports and the explicitly
unmatched events.

## Run locally

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev
```

Vite prints the local development URL. All runtime assets are bundled; there
are no font, script, analytics, or image CDNs.

## Test and build

```sh
npm test
npm run build
```

The exact production build command is `npm run build`. It type-checks the app
and writes the static deployment to `dist/`, with `dist/index.html` at its root.

Browser tests cover the worked investigation, mobile and desktop accessibility,
legal routes, and an offline reload with restored IndexedDB state:

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```

## Deploy

Upload the contents of `dist/` to the static host and configure navigation
fallbacks to `index.html` so `/privacy` and `/terms` resolve directly. Do not
edit DNS, billing, or infrastructure from this repository.

The service worker precaches the versioned app shell, discovers Vite’s hashed
JS/CSS assets at install time, caches assets locally, and shows an in-app update
notice when a new worker is waiting.

## Privacy and licenses

Evidence stays in the browser. IndexedDB stores the active case; localStorage
stores only a Pro license token and its cached verification result. The core
workbench makes no API calls. License checkout and verification use the
Sociobot billing API; Sociobot/Dodo is the merchant of record. Never paste
vendor credentials, and review every scrubbed export because arbitrary schemas
can hide sensitive data under unexpected field names.

See [`/privacy`](https://async-trace-stitcher.sociobot.in/privacy) and
[`/terms`](https://async-trace-stitcher.sociobot.in/terms).

## Project notes

- Product scope: [`.factory/brief.json`](.factory/brief.json)
- Visual system and generated-asset provenance: [`.factory/design.md`](.factory/design.md)
- Verification and handoff: [`.factory/handoff.md`](.factory/handoff.md)

MIT licensed. See [LICENSE](LICENSE).
