# Async Trace Stitcher candidate handoff — FAIL

**Candidate:** `7fc1e2bc56fd7b57819a59e87100a39ca1345d9d`
**Verified URL:** https://async-trace-stitcher.sociobot.in
**Date:** 2026-08-27 UTC
**Release decision:** **FAIL — do not ship.**

Independent verification from a clean checkout found a P0 privacy violation:
the “Export scrubbed bundle” JSON retains configured email correlation values
inside `timeline[*].identifiers`, despite redacting the same email in `raw` and
evidence fields. This violates the brief's required PII scrubbing before
export. The checked-in offline PWA E2E test also fails on desktop and mobile:
the saved case reloads offline, but the UI incorrectly remains “On device”
instead of “Offline ready.”

`npm ci`, `npm test` (5/5), `npm run build`, normal desktop/mobile workflow,
axe serious/critical scan, legal routes, live-browser smoke, bundle budget,
and Lighthouse mobile (Performance 100 / Accessibility 100) otherwise passed.
The live deployment byte-matches local `dist/` for HTML, JS, CSS, service
worker, manifest, and offline page.

Full reproduction steps, exact command results, header/cache findings,
severity-ranked defects, and required remediation are in
[`verification.md`](verification.md). Product code was not changed during this
verification; this handoff and the verification report are the only candidate
tree changes.

Before re-verification: scrub all derived/exported identifier values; make both
offline E2E projects pass; repair skip-link focus and 44px controls; and address
the documented static-host response-policy gaps.
