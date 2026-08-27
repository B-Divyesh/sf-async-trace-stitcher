import { describe, expect, it } from 'vitest';
import { parseSource, scrubPii, stitch } from './engine';
import type { CorrelationRule, SourceInput } from './types';

const rule: CorrelationRule = { id: 'request', name: 'Request', fields: ['request_id', 'data.order_id'], enabled: true };

describe('parseSource', () => {
  it('accepts JSON arrays and NDJSON while reporting malformed lines', () => {
    expect(parseSource({ id: 'a', name: 'array', content: '[{"a":1},{"b":2}]' }).values).toHaveLength(2);
    const parsed = parseSource({ id: 'b', name: 'lines', content: '{"a":1}\nnot-json\n{"b":2}' });
    expect(parsed.values).toHaveLength(2);
    expect(parsed.issues[0].message).toContain('Line 2');
  });
});

describe('stitch', () => {
  it('matches exact identifiers across sources and orders timestamps', () => {
    const sources: SourceInput[] = [
      { id: 'app', name: 'App', content: '{"timestamp":"2026-01-01T00:00:02Z","request_id":"Req_1","message":"second"}' },
      { id: 'queue', name: 'Queue', content: '{"timestamp":"2026-01-01T00:00:01Z","request_id":"req_1","event":"first"}' },
    ];
    const result = stitch(sources, [rule], ['timestamp'], 120);
    expect(result.matched).toHaveLength(2);
    expect(result.unmatched).toHaveLength(0);
    expect(result.events[0].label).toBe('first');
    expect(result.events[0].confidenceLabel).toBe('High');
    expect(result.events[0].evidence[0].value).toBe('req_1');
  });

  it('supports nested exact paths and unix-second timestamps', () => {
    const sources: SourceInput[] = [
      { id: 'a', name: 'A', content: '{"created":1767225600,"data":{"order_id":"ord_7"}}' },
      { id: 'b', name: 'B', content: '{"created":1767225601,"data":{"order_id":"ord_7"}}' },
    ];
    const result = stitch(sources, [rule], ['created'], 20);
    expect(result.matched).toHaveLength(2);
    expect(result.events[0].timestamp).toBe('2026-01-01T00:00:00.000Z');
    expect(result.events[0].evidence[0].field).toBe('data.order_id');
  });

  it('does not claim a match from proximity or same-source repetition', () => {
    const sources: SourceInput[] = [
      { id: 'a', name: 'A', content: '{"timestamp":"2026-01-01T00:00:00Z","request_id":"same"}\n{"timestamp":"2026-01-01T00:00:01Z","request_id":"same"}' },
      { id: 'b', name: 'B', content: '{"timestamp":"2026-01-01T00:00:02Z","request_id":"different"}' },
    ];
    const result = stitch(sources, [rule], ['timestamp'], 10);
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toHaveLength(3);
    expect(result.events.every((event) => event.confidenceLabel === 'Unmatched')).toBe(true);
  });
});

describe('scrubPii', () => {
  it('redacts sensitive keys and common PII embedded in strings', () => {
    const scrubbed = scrubPii({
      email: 'person@example.com',
      safe_id: 'req_42',
      message: 'Call +1 (415) 555-0199 from 192.168.1.2',
      nested: { authorization: 'Bearer secret' },
    });
    expect(scrubbed).toEqual({
      email: '[REDACTED]',
      safe_id: 'req_42',
      message: 'Call [REDACTED_PHONE] from [REDACTED_IP]',
      nested: { authorization: '[REDACTED]' },
    });
  });
});
