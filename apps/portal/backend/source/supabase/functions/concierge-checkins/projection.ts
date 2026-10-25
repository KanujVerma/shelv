import { validateCheckinDate } from './dates.ts';
import { isCheckinPhotoAngle } from './photos.ts';
import type { CheckinPhotoAngle } from './photos.ts';
import { checkinFailure, isCheckinUuid, validateCheckinSubmission } from './validation.ts';
import type { CheckinResult } from './validation.ts';
export type CheckinReport = Readonly<{
  id: string; submittedAt: string; comfort: string; consistency: string; changes: string;
  photos: readonly Readonly<{ id: string; angle: CheckinPhotoAngle }>[];
}>;
export type CheckinClientView = Readonly<{ revision: number; nextCheckinOn: string | null; reports: readonly CheckinReport[] }>;
export type CheckinSubmitReceipt = Readonly<{ revision: number; operation: 'submit_report'; reportId: string }>;

export function isCheckinRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
export function isCheckinInstant(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value)) return false;
  return validateCheckinDate(value.slice(0,10)).ok && Number.isFinite(Date.parse(value));
}

export function mapCheckinSubmitReceipt(input: unknown): CheckinResult<CheckinSubmitReceipt> {
  if (!input || typeof input !== 'object') return checkinFailure('unavailable');
  const value = input as Record<string, unknown>;
  if (!isCheckinRevision(value.revision) || value.operation !== 'submit_report' || !isCheckinUuid(value.reportId)) return checkinFailure('unavailable');
  return { ok: true, value: Object.freeze({ revision: value.revision, operation: 'submit_report', reportId: value.reportId.toLowerCase() }) };
}

/** An explicit allowlist at every nesting level, including photos. No raw RPC response is returned. */
export function mapCheckinClientView(input: unknown): CheckinResult<CheckinClientView> {
  try {
    if (!input || typeof input !== 'object') throw new Error();
    const view = input as Record<string, unknown>, date = validateCheckinDate(view.nextCheckinOn);
    if (!isCheckinRevision(view.revision) || !date.ok || !Array.isArray(view.reports)) throw new Error();
    const reports = view.reports.map((raw: unknown): CheckinReport => {
      if (!raw || typeof raw !== 'object') throw new Error();
      const report = raw as Record<string, unknown>;
      if (!isCheckinUuid(report.id) || !isCheckinInstant(report.submittedAt) || !Array.isArray(report.photos) || report.photos.length > 3) throw new Error();
      const photos = report.photos.map((raw: unknown) => {
        if (!raw || typeof raw !== 'object') throw new Error();
        const photo = raw as Record<string, unknown>;
        if (!isCheckinUuid(photo.id) || !isCheckinPhotoAngle(photo.angle)) throw new Error();
        return Object.freeze({ id: photo.id.toLowerCase(), angle: photo.angle });
      });
      if (new Set(photos.map(photo => photo.angle)).size !== photos.length) throw new Error();
      const parsed = validateCheckinSubmission({ requestId: report.id, comfort: report.comfort,
        consistency: report.consistency, changes: report.changes, photoIds: photos.map(photo => photo.id) });
      if (!parsed.ok) throw new Error();
      return Object.freeze({ id: report.id.toLowerCase(), submittedAt: report.submittedAt,
        comfort: parsed.value.comfort, consistency: parsed.value.consistency, changes: parsed.value.changes,
        photos: Object.freeze(photos) });
    });
    if (new Set(reports.map(report => report.id)).size !== reports.length) throw new Error();
    return { ok: true, value: Object.freeze({ revision: view.revision, nextCheckinOn: date.value, reports: Object.freeze(reports) }) };
  } catch { return checkinFailure('unavailable'); }
}
