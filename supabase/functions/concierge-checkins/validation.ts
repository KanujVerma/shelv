export type CheckinErrorCode = 'invalid_input' | 'unsupported_photo' | 'photo_too_large' | 'forbidden'
  | 'revision_conflict' | 'service_inactive' | 'routine_not_started' | 'photo_unavailable' | 'request_conflict' | 'unavailable';
export type CheckinResult<T> = { ok: true; value: T } | { ok: false; error: { code: CheckinErrorCode; retryable: boolean } };
export type CheckinSubmission = Readonly<{
  requestId: string; comfort: string; consistency: string; changes: string; photoIds: readonly string[];
}>;

export function checkinFailure(code: CheckinErrorCode): CheckinResult<never> {
  return { ok: false, error: { code, retryable: code === 'unavailable' } };
}
function requireValue(value: unknown): asserts value {
  if (!value) throw new Error('invalid_input');
}
function object(value: unknown): Record<string, unknown> {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, required: string[], optional: string[] = []): void {
  requireValue(required.every(key => Object.hasOwn(value, key))
    && Object.keys(value).every(key => required.includes(key) || optional.includes(key)));
}
export function isCheckinUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function uuid(value: unknown): string {
  requireValue(isCheckinUuid(value));
  return value.toLowerCase();
}
function text(value: unknown, maximum: number, empty = false): string {
  requireValue(typeof value === 'string' && !value.includes('\u0000')
    && Array.from(value).length <= maximum && (empty || value.trim().length > 0));
  // PostgreSQL rejects lone UTF-16 surrogates; avoid accepting text that cannot persist.
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit >= 0xD800 && unit <= 0xDBFF) {
      const low = value.charCodeAt(++i); requireValue(low >= 0xDC00 && low <= 0xDFFF);
    } else requireValue(unit < 0xDC00 || unit > 0xDFFF);
  }
  return value;
}

/** Pure provisional input contract. Owner/capability/storage fields are never client input. */
export function validateCheckinReply(input: unknown): CheckinResult<string> {
  try { return { ok: true, value: text(input, 4000) }; }
  catch { return checkinFailure('invalid_input'); }
}

export function validateCheckinSubmission(input: unknown): CheckinResult<CheckinSubmission> {
  try {
    const value = object(input);
    keys(value, ['requestId', 'comfort', 'consistency', 'changes'], ['photoIds']);
    const refs = Object.hasOwn(value, 'photoIds') ? value.photoIds : [];
    requireValue(Array.isArray(refs) && refs.length <= 3);
    const photoIds = refs.map(uuid).sort();
    requireValue(new Set(photoIds).size === photoIds.length);
    return { ok: true, value: Object.freeze({ requestId: uuid(value.requestId), comfort: text(value.comfort, 1000),
      consistency: text(value.consistency, 1000), changes: text(value.changes, 1000, true), photoIds: Object.freeze(photoIds) }) };
  } catch { return checkinFailure('invalid_input'); }
}
