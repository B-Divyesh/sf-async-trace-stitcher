# Independent candidate verification — FAIL

**Verified:** 2026-08-27 (UTC)
**Candidate:** `7fc1e2bc56fd7b57819a59e87100a39ca1345d9d`
**Live URL:** https://async-trace-stitcher.sociobot.in
**Verdict:** **FAIL — do not release this candidate.**

The app is a strong local-first trace-stitching implementation, but it fails a
non-negotiable brief constraint: scrub PII before export. A realistic,
user-configured email correlation rule leaks the email addresses in the
supposedly scrubbed incident bundle. The repository's own offline PWA test also
fails on both supported viewports.

## Blocking defects

### P0 — scrubbed incident bundles leak configured PII identifiers

**Reproduction (production build):**

1. Load the worked example, replace the first two sources with JSON events
   containing the same `email: "alice@example.com"`, and set the visible
   `Request chain` rule's field list to `email`.
2. Stitch the timeline and select **Export scrubbed bundle**.
3. Inspect `timeline[*].identifiers` in the downloaded JSON.

The exported `raw.email` and evidence value are `[REDACTED]`, but each event
still contains, for example:

```json
"identifiers": {
  "<request-chain-rule-id>": ["alice@example.com"]
}
```

This is a direct disclosure through the product's deliberately named
“scrubbed” export. It violates the researched brief's “scrub PII before export”
constraint and the privacy policy's export claim. Do not ship until every
exported representation of identifiers/rules/events is scrubbed consistently.

### P1 — checked-in offline PWA test fails on desktop and mobile

After installing the matching Playwright Chromium, `npm run test:e2e` ran the
browser suite. The core shell and IndexedDB case do reload offline, but
`restores the app shell and saved case offline` fails for both projects:

```text
expect(getByText('Offline ready')).toBeAttached()
element(s) not found
```

On an offline reload, the header remains **On device**. This leaves the
required offline state inaccurate and means the repository's required E2E gate
does not pass (6 passing tests, 2 failing tests). The prior handoff's 8/8
claim is not supported by fresh evidence.

## Other defects / release concerns

### P2 — keyboard skip link does not move focus into main content

On desktop and 390px mobile, `Tab` exposes the skip link with a designed
3px focus outline. Pressing `Enter` changes the fragment to `#main`, but focus
ends on `body`; `<main id="main">` has no `tabindex`. Keyboard users must tab
through the header again rather than being placed at the main landmark.

### P2 — target-size and delivery-policy gaps

- Several interactive controls are under the stated 44px minimum: desktop
  header links are 25px high, mobile header links 22px high, source/rule text
  inputs 40px high, and checkboxes 22px square.
- The live host applies `Cache-Control: public, must-revalidate, max-age=30`
  even to hashed JS/CSS and the service worker, not the required long-lived
  immutable asset policy. `manifest.webmanifest` is served as
  `application/octet-stream` rather than a manifest MIME type.
- Live headers include HSTS, `Referrer-Policy`, and `X-Content-Type-Options`,
  but no `Content-Security-Policy` or `Permissions-Policy` was present.

## Evidence from clean checkout

The tree was clean at the requested SHA before installation. `npm ci` installed
60 packages and reported 0 vulnerabilities.

| Gate | Result | Evidence |
|---|---|---|
| Unit tests | PASS | `npm test`: 5/5 Vitest tests passed. |
| Type check / exact production build | PASS | `npm run build` passed and wrote `dist/`. |
| Bundle budget | PASS | Initial JS 33.20 KB / 11.63 KB gzip; CSS 11.82 KB / 3.60 KB gzip; all below the static budgets. |
| Repository E2E | FAIL | After `npx playwright install chromium`, 6 tests passed and the 2 offline-state tests above failed. Desktop/mobile normal workflow, axe, and legal-route tests passed. |
| Axe | PASS | Existing Playwright axe scan found zero serious/critical WCAG A/AA/2.1-AA violations in the completed sample workflow on desktop and mobile. |
| Lighthouse mobile, local production preview | PASS | Performance 100; Accessibility 100; FCP 1.0 s, LCP 1.4 s, TBT 0 ms, CLS 0. |
| Console/page errors | PASS | None during independent local and live sample workflows. |
| Normal E2E | PASS | Worked example produced 5 identifier-matched and 1 explicitly-unmatched event. |
| Invalid/recovery E2E | PASS | A malformed NDJSON line stayed visible as a parse issue; invalid case import displayed a recovery error; a 10,000,001-byte source was rejected with the stated 10 MB limit; loading the worked example then recovered. |
| Privacy/network | FAIL | Core local and live workbench activity requested only its own origin, but the P0 exported-bundle leak above breaks the privacy guarantee. |
| PWA shell | PARTIAL | Service worker installed/activated, controlled the page, and created cache `ats-v2`; offline reload restored the saved IndexedDB case. Offline status assertion fails. Source contains an update toast/`SKIP_WAITING` path; a real rolling deployment update was not available to test. |
| Responsive/reduced motion | PASS with P2 target-size gap | No horizontal overflow at 390px or 1440px. Reduced-motion context set `scroll-behavior: auto`, removed hero transform, and reduced transition duration to 0.01ms. |

## Live deployment identity and response evidence

The live URL is the candidate build, not a stale deployment. Byte comparisons
matched local `dist/` for all of the following:

- `index.html`: SHA-256 `cddc7841577d5f8a28cbb1e6a3670ffb906e01ea40496c58bffef6242424f216`
- `/assets/index-DOAvu8KZ.js`
- `/assets/index-D1873N5T.css`
- `/sw.js`, `/manifest.webmanifest`, and `/offline.html`

Independent live-browser smoke test completed the sample workflow with the
expected 5/1 summary, no console/page errors, and requests only to
`https://async-trace-stitcher.sociobot.in`. `/privacy` and `/terms` each
returned the SPA document and have one page heading in the local E2E coverage.

## Required next steps

1. Redact or omit identifier values (and any other derived fields) in JSON,
   CSV, and Markdown exports whenever their rule/path/value is sensitive; add
   regression coverage for email, phone, token, and nested sensitive fields.
2. Correct offline status from actual browser events/state and make the
   Playwright offline test pass on both projects.
3. Make the skip destination focusable, bring all controls to the 44px target
   contract, and configure static-host CSP/permissions/manifest MIME/immutable
   asset caching where supported.
4. Re-run this verification from a clean checkout and replace the FAIL only
   after every gate passes.
