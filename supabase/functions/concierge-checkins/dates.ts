import { checkinFailure } from './validation.ts';
import type { CheckinResult } from './validation.ts';

/** An external meeting's date, never a booking or local-time timestamp. Null clears a suggestion. */
export function validateCheckinDate(value: unknown): CheckinResult<string | null> {
  if (value === null) return { ok: true, value: null };
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') return checkinFailure('invalid_input');
  const date = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) return checkinFailure('invalid_input');
  return { ok: true, value };
}

/** Suggested dates only. Core persists an advisor-confirmed date; no timer or booking is created. */
export function recommendNextCheckinDate(input: { routineStartedOn: string; previousMeetingOn?: string | null }): CheckinResult<string> {
  const started = validateCheckinDate(input.routineStartedOn);
  if (!started.ok || started.value === null) return checkinFailure('invalid_input');
  let next: Date;
  if (input.previousMeetingOn == null) {
    next = new Date(started.value + 'T00:00:00.000Z'); next.setUTCDate(next.getUTCDate() + 14);
  } else {
    const previous = validateCheckinDate(input.previousMeetingOn);
    if (!previous.ok || previous.value === null || previous.value < started.value) return checkinFailure('invalid_input');
    const date = new Date(previous.value + 'T00:00:00.000Z');
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 0)).getUTCDate();
    next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, Math.min(date.getUTCDate(), lastDay)));
  }
  const day = next.toISOString().slice(0,10), valid = validateCheckinDate(day);
  return valid.ok && valid.value !== null ? { ok: true, value: valid.value } : checkinFailure('invalid_input');
}
