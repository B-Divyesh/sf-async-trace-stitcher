# Demo sandbox

Open <https://async-trace-stitcher.sociobot.in/demo> or use `?demo=1`.
The first frame shows a stitched six-event payment failure. The sample spans
application logs, a queue worker, and a vendor webhook. It includes five
matched events, one unmatched event, and one malformed input line.

Demo changes use the separate IndexedDB database
`demo:async-trace-stitcher`. Demo mode never reads or writes the production
database `async-trace-stitcher` or its `active-draft` record. It also skips
license storage and verification. Leaving demo mode clears the demo record.

Use **Reset demo** to restore the bundled sample. Use **Start for real** to
discard demo changes and open the real local case. The demo app shell and
sample are bundled for offline reload after the first visit.
