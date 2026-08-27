export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface SourceInput {
  id: string;
  name: string;
  content: string;
}

export interface CorrelationRule {
  id: string;
  name: string;
  fields: string[];
  enabled: boolean;
}

export interface CaseDraft {
  version: 1;
  title: string;
  sources: SourceInput[];
  rules: CorrelationRule[];
  timestampFields: string[];
  proximitySeconds: number;
  updatedAt: string;
}

export interface Evidence {
  rule: string;
  field: string;
  value: string;
  peers: number;
}

export interface StitchedEvent {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceIndex: number;
  timestamp: string | null;
  timestampMs: number | null;
  label: string;
  raw: JsonValue;
  identifiers: Record<string, string[]>;
  evidence: Evidence[];
  confidence: number;
  confidenceLabel: 'High' | 'Medium' | 'Low' | 'Unmatched';
  groupId: string | null;
  notes: string[];
}

export interface ParseIssue {
  sourceName: string;
  message: string;
}

export interface StitchResult {
  events: StitchedEvent[];
  matched: StitchedEvent[];
  unmatched: StitchedEvent[];
  issues: ParseIssue[];
  generatedAt: string;
}
