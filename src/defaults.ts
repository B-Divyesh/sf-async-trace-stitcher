import type { CaseDraft } from './types';

export const DEFAULT_DRAFT: CaseDraft = {
  version: 1,
  title: 'Untitled incident',
  sources: [
    { id: crypto.randomUUID(), name: 'Application logs', content: '' },
    { id: crypto.randomUUID(), name: 'Queue / webhook export', content: '' },
  ],
  rules: [
    { id: crypto.randomUUID(), name: 'Request chain', fields: ['trace_id', 'request_id', 'correlation_id', 'job_id'], enabled: true },
    { id: crypto.randomUUID(), name: 'Business object', fields: ['order_id', 'transaction_id', 'payment_intent_id'], enabled: true },
  ],
  timestampFields: ['timestamp', 'time', 'created_at', 'created', 'ts', 'occurred_at'],
  proximitySeconds: 120,
  updatedAt: new Date().toISOString(),
};

export const SAMPLE_SOURCES = [
  {
    name: 'Application logs',
    content: `{"timestamp":"2026-08-26T14:03:11.120Z","level":"info","message":"Checkout accepted","request_id":"req_7fc2","order_id":"ord_1842","email":"customer@example.com"}\n{"timestamp":"2026-08-26T14:03:12.008Z","level":"info","message":"Payment job queued","request_id":"req_7fc2","job_id":"job_91","access_token":"tok_demo_secret"}\n{malformed export line}`,
  },
  {
    name: 'Queue worker',
    content: `{"time":"2026-08-26T14:03:12.441Z","event":"job.started","job_id":"job_91","order_id":"ord_1842"}\n{"time":"2026-08-26T14:03:14.201Z","event":"vendor.timeout","job_id":"job_91","order_id":"ord_1842"}`,
  },
  {
    name: 'Vendor webhook',
    content: `[{"created":1787752996,"type":"payment.failed","data":{"order_id":"ord_1842","payment_intent_id":"pi_332"}},{"created":"2026-08-26T14:10:41Z","type":"unrelated.ping","id":"evt_other"}]`,
  },
];
