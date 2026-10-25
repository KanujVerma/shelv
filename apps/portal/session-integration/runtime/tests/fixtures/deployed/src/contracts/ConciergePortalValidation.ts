import type { ConciergeRecommendation } from './ConciergePortal.ts';

export function requireValue(condition: unknown): asserts condition {
  if (!condition) throw new Error('invalid_input');
}
export function readObject(value: unknown): Record<string, unknown> {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
}
export function readArray(value: unknown, maximum = Number.MAX_SAFE_INTEGER): unknown[] {
  requireValue(Array.isArray(value) && value.length <= maximum);
  return value;
}
export function readText(value: unknown, maximum: number, empty = false): string {
  // PostgreSQL length(text) counts Unicode code points, not UTF-16 code units.
  requireValue(typeof value === 'string' && Array.from(value).length <= maximum && (empty || value.trim().length > 0));
  return value;
}
export function readInteger(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): number {
  requireValue(typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum);
  return value;
}
export function readIdentifier(value: unknown): string {
  const id = readText(value, 100);
  requireValue(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(id) && !['constructor', 'prototype', '__proto__'].includes(id));
  return id;
}
export function readUuid(value: unknown): string {
  const id = readText(value, 36);
  requireValue(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
  return id;
}
export function readDate(value: unknown): string {
  const day = readText(value, 10);
  requireValue(/^\d{4}-\d{2}-\d{2}$/.test(day) && day >= '1900-01-01' && Number.isFinite(Date.parse(day)));
  requireValue(new Date(day).toISOString().slice(0, 10) === day);
  return day;
}
export function exactKeys(value: Record<string, unknown>, expected: string[]): void {
  requireValue(Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key)));
}
export const recommendationKeys = ['id', 'slot', 'currentProductId', 'proposedProductId', 'priceCents', 'currency', 'rationale'];
export function readRecommendations(value: unknown): ConciergeRecommendation[] {
  const ids = new Set<string>(), slots = new Set<string>();
  return readArray(value, 50).map(item => {
    const r = readObject(item);
    const id = readIdentifier(r.id), slot = readIdentifier(r.slot);
    requireValue(!ids.has(id) && !slots.has(slot) && r.currency === 'USD');
    ids.add(id); slots.add(slot);
    return { id, slot, currentProductId: readIdentifier(r.currentProductId), proposedProductId: readIdentifier(r.proposedProductId),
      priceCents: readInteger(r.priceCents, 0, 100000000), currency: 'USD', rationale: readText(r.rationale, 4000) };
  });
}
