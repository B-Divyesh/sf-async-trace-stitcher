import type { CorrelationRule, JsonValue, ParseIssue, SourceInput, StitchResult, StitchedEvent } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseSource(source: SourceInput): { values: JsonValue[]; issues: ParseIssue[] } {
  const text = source.content.trim();
  if (!text) return { values: [], issues: [] };

  try {
    const parsed: unknown = JSON.parse(text);
    const values = Array.isArray(parsed) ? parsed : [parsed];
    return { values: values.filter(isRecord) as JsonValue[], issues: [] };
  } catch {
    const values: JsonValue[] = [];
    const issues: ParseIssue[] = [];
    text.split(/\r?\n/).forEach((line, index) => {
      if (!line.trim()) return;
      try {
        const parsed: unknown = JSON.parse(line);
        if (isRecord(parsed)) values.push(parsed as JsonValue);
        else issues.push({ sourceName: source.name, message: `Line ${index + 1} is valid JSON but not an object.` });
      } catch (error) {
        const detail = error instanceof Error ? error.message.replace(/^JSON\.parse: /, '') : 'Invalid JSON';
        issues.push({ sourceName: source.name, message: `Line ${index + 1}: ${detail}` });
      }
    });
    return { values, issues };
  }
}

function walk(value: unknown, visit: (key: string, value: unknown, path: string) => void, path = ''): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, visit, `${path}[${i}]`));
    return;
  }
  if (!isRecord(value)) return;
  Object.entries(value).forEach(([key, child]) => {
    const childPath = path ? `${path}.${key}` : key;
    visit(key, child, childPath);
    if (isRecord(child) || Array.isArray(child)) walk(child, visit, childPath);
  });
}

function keyMatches(candidate: string, key: string, path: string): boolean {
  const clean = candidate.trim().toLowerCase();
  return clean === key.toLowerCase() || clean === path.toLowerCase();
}

function scalar(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function findValues(raw: JsonValue, fields: string[]): Array<{ field: string; value: string }> {
  const found: Array<{ field: string; value: string }> = [];
  walk(raw, (key, value, path) => {
    if (!fields.some((field) => keyMatches(field, key, path))) return;
    const simple = scalar(value);
    if (simple !== null && simple.trim()) found.push({ field: path, value: simple.trim() });
  });
  return found;
}

function parseTimestamp(value: string): number | null {
  if (/^\d+(\.\d+)?$/.test(value)) {
    const number = Number(value);
    const ms = number < 100_000_000_000 ? number * 1000 : number;
    return Number.isFinite(ms) && ms > 0 ? ms : null;
  }
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function eventLabel(raw: JsonValue, index: number): string {
  if (isRecord(raw)) {
    for (const key of ['message', 'event', 'type', 'action', 'name', 'status']) {
      const value = raw[key];
      if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 120);
    }
  }
  return `Event ${index + 1}`;
}

class UnionFind {
  private parent: number[];
  constructor(size: number) { this.parent = Array.from({ length: size }, (_, index) => index); }
  find(index: number): number {
    if (this.parent[index] !== index) this.parent[index] = this.find(this.parent[index]);
    return this.parent[index];
  }
  join(a: number, b: number): void { this.parent[this.find(b)] = this.find(a); }
}

export function stitch(
  sources: SourceInput[],
  rules: CorrelationRule[],
  timestampFields: string[],
  proximitySeconds: number,
): StitchResult {
  const issues: ParseIssue[] = [];
  const events: StitchedEvent[] = [];
  const activeRules = rules.filter((rule) => rule.enabled && rule.fields.length);

  sources.forEach((source) => {
    const parsed = parseSource(source);
    issues.push(...parsed.issues);
    parsed.values.forEach((raw, sourceIndex) => {
      const timestampHit = findValues(raw, timestampFields)
        .map((item) => ({ ...item, ms: parseTimestamp(item.value) }))
        .find((item) => item.ms !== null);
      const identifiers: Record<string, string[]> = {};
      activeRules.forEach((rule) => {
        identifiers[rule.id] = [...new Set(findValues(raw, rule.fields).map((item) => item.value))];
      });
      const timestampMs = timestampHit?.ms ?? null;
      events.push({
        id: `${source.id}:${sourceIndex}`,
        sourceId: source.id,
        sourceName: source.name || 'Unnamed source',
        sourceIndex,
        timestamp: timestampMs === null ? null : new Date(timestampMs).toISOString(),
        timestampMs,
        label: eventLabel(raw, sourceIndex),
        raw,
        identifiers,
        evidence: [],
        confidence: 0,
        confidenceLabel: 'Unmatched',
        groupId: null,
        notes: timestampMs === null ? ['No usable timestamp found'] : [],
      });
    });
  });

  const union = new UnionFind(events.length);
  activeRules.forEach((rule) => {
    const index = new Map<string, number[]>();
    events.forEach((event, eventIndex) => {
      (event.identifiers[rule.id] ?? []).forEach((value) => {
        const key = value.toLowerCase();
        const bucket = index.get(key) ?? [];
        bucket.push(eventIndex);
        index.set(key, bucket);
      });
    });
    index.forEach((eventIndexes, value) => {
      const acrossSources = new Set(eventIndexes.map((i) => events[i].sourceId)).size > 1;
      if (eventIndexes.length < 2 || !acrossSources) return;
      eventIndexes.slice(1).forEach((eventIndex) => union.join(eventIndexes[0], eventIndex));
      eventIndexes.forEach((eventIndex) => {
        const field = findValues(events[eventIndex].raw, rule.fields).find((hit) => hit.value.toLowerCase() === value)?.field ?? rule.fields[0];
        events[eventIndex].evidence.push({ rule: rule.name, field, value, peers: eventIndexes.length - 1 });
      });
    });
  });

  events.forEach((event, index) => {
    const root = union.find(index);
    if (event.evidence.length) {
      event.groupId = `thread-${root + 1}`;
      const distinctRules = new Set(event.evidence.map((item) => item.rule)).size;
      event.confidence = Math.min(98, 72 + distinctRules * 10 + (event.timestampMs === null ? 0 : 6));
      event.confidenceLabel = event.confidence >= 85 ? 'High' : 'Medium';
      return;
    }
    if (event.timestampMs !== null) {
      const nearest = events
        .filter((candidate) => candidate.sourceId !== event.sourceId && candidate.evidence.length && candidate.timestampMs !== null)
        .map((candidate) => Math.abs((candidate.timestampMs as number) - (event.timestampMs as number)))
        .sort((a, b) => a - b)[0];
      if (nearest !== undefined && nearest <= proximitySeconds * 1000) {
        event.confidence = 30;
        event.confidenceLabel = 'Low';
        event.notes.push(`Near matched evidence in time (within ${proximitySeconds}s); no identifier match`);
      }
    }
    event.notes.push('No enabled rule matched this event to another source.');
  });

  events.sort((a, b) => {
    if (a.timestampMs === null && b.timestampMs === null) return a.sourceName.localeCompare(b.sourceName);
    if (a.timestampMs === null) return 1;
    if (b.timestampMs === null) return -1;
    return a.timestampMs - b.timestampMs;
  });
  const matched = events.filter((event) => event.evidence.length > 0);
  const unmatched = events.filter((event) => event.evidence.length === 0);
  return { events, matched, unmatched, issues, generatedAt: new Date().toISOString() };
}

const sensitiveKey = /(^|_)(email|phone|mobile|address|first_name|last_name|full_name|password|secret|token|authorization|cookie|card|cvv)($|_)/i;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const phonePattern = /(?<!\w)\+?\d[\d ()-]{7,}\d(?!\w)/g;

export function scrubPii(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(scrubPii);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sensitiveKey.test(key) ? '[REDACTED]' : scrubPii(child)]));
  }
  if (typeof value === 'string') {
    return value.replace(emailPattern, '[REDACTED_EMAIL]').replace(ipPattern, '[REDACTED_IP]').replace(phonePattern, '[REDACTED_PHONE]');
  }
  return value;
}
