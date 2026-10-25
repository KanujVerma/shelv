import { checkinFailure, isCheckinUuid, validateCheckinSubmission } from './validation.ts';
import type { CheckinErrorCode, CheckinResult, CheckinSubmission } from './validation.ts';
import { isCheckinInstant, isCheckinRevision, mapCheckinSubmitReceipt } from './projection.ts';
import type { CheckinReport, CheckinSubmitReceipt } from './projection.ts';
import { isCheckinPhotoAngle } from './photos.ts';
import type { CheckinPhotoAngle } from './photos.ts';

export type BoundCheckinSubmission = Readonly<{ ownerId: string; expectedRevision: number; submission: CheckinSubmission }>;
export type CheckinSubmissionSnapshot = {
  ownerId: string; revision: number;
  /** Supplied by the current authoritative guard, never from client JSON. */
  authorization: CheckinResult<true>;
  previousRequest: { command: BoundCheckinSubmission; receipt: CheckinSubmitReceipt } | null;
  reportId: string; submittedAt: string;
  photos: readonly { id: string; ownerId: string; angle: CheckinPhotoAngle; state: 'pending' | 'complete'; attachedReportId: string | null }[];
};
export type CheckinSubmissionTransition = Readonly<
  { mode: 'create'; receipt: CheckinSubmitReceipt; report: CheckinReport } | { mode: 'replay'; receipt: CheckinSubmitReceipt }
>;
const safeCodes = new Set<CheckinErrorCode>(['forbidden', 'service_inactive', 'routine_not_started', 'photo_unavailable',
  'request_conflict', 'revision_conflict', 'invalid_input', 'unavailable']);
function safeFailure(code: unknown): CheckinResult<never> {
  return checkinFailure(typeof code === 'string' && safeCodes.has(code as CheckinErrorCode) ? code as CheckinErrorCode : 'unavailable');
}
function bind(input: unknown, context: { ownerId: string; expectedRevision: number }): CheckinResult<BoundCheckinSubmission> {
  if (!isCheckinUuid(context.ownerId) || !isCheckinRevision(context.expectedRevision)
    || context.expectedRevision === Number.MAX_SAFE_INTEGER) return checkinFailure('invalid_input');
  const parsed = validateCheckinSubmission(input);
  return parsed.ok ? { ok: true, value: Object.freeze({ ownerId: context.ownerId.toLowerCase(), expectedRevision: context.expectedRevision,
    submission: parsed.value }) } : parsed;
}
function sameCommand(a: BoundCheckinSubmission, b: BoundCheckinSubmission): boolean {
  return a.ownerId === b.ownerId && a.expectedRevision === b.expectedRevision
    && JSON.stringify(a.submission) === JSON.stringify(b.submission);
}

/** Pure transition oracle. The repository must enforce this atomically; it is not a database or authorization substitute. */
export function evaluateCheckinSubmission(snapshot: CheckinSubmissionSnapshot, input: BoundCheckinSubmission): CheckinResult<CheckinSubmissionTransition> {
  const bound = bind(input.submission, input);
  if (!bound.ok) return bound;
  const command = bound.value;
  if (snapshot.ownerId !== command.ownerId) return checkinFailure('forbidden');
  // Recheck BEFORE looking at idempotency history or now-attached photos.
  if (!snapshot.authorization.ok) return safeFailure(snapshot.authorization.error.code);
  if (snapshot.authorization.value !== true || !isCheckinRevision(snapshot.revision)) return checkinFailure('unavailable');
  if (snapshot.previousRequest) {
    const previous = snapshot.previousRequest;
    const prior = bind(previous.command.submission, previous.command);
    if (!prior.ok || prior.value.submission.requestId !== command.submission.requestId) return checkinFailure('unavailable');
    if (!sameCommand(prior.value, command)) return checkinFailure('request_conflict');
    const receipt = mapCheckinSubmitReceipt(previous.receipt);
    return receipt.ok ? { ok: true, value: Object.freeze({ mode: 'replay', receipt: receipt.value }) } : receipt;
  }
  if (command.expectedRevision !== snapshot.revision) return checkinFailure('revision_conflict');
  if (!isCheckinUuid(snapshot.reportId) || !isCheckinInstant(snapshot.submittedAt)) return checkinFailure('unavailable');
  const photos: { id: string; angle: CheckinPhotoAngle }[] = [];
  for (const id of command.submission.photoIds) {
    const photo = snapshot.photos.find(photo => photo.id === id);
    if (!photo || photo.ownerId !== command.ownerId || photo.state !== 'complete' || photo.attachedReportId !== null
      || !isCheckinPhotoAngle(photo.angle) || photos.some(other => other.angle === photo.angle)) return checkinFailure('photo_unavailable');
    photos.push(Object.freeze({ id, angle: photo.angle }));
  }
  const report = Object.freeze({ id: snapshot.reportId.toLowerCase(), submittedAt: snapshot.submittedAt,
    comfort: command.submission.comfort, consistency: command.submission.consistency, changes: command.submission.changes,
    photos: Object.freeze(photos) });
  const receipt: CheckinSubmitReceipt = Object.freeze({ revision: snapshot.revision + 1, operation: 'submit_report', reportId: report.id });
  return { ok: true, value: Object.freeze({ mode: 'create', receipt, report }) };
}

/** Provisional port. Its implementation must recheck access and enforce uniqueness/locking in the same transaction as the write. */
export type CheckinSubmissionRepository = {
  submitAtomically(command: BoundCheckinSubmission): Promise<{ data: unknown; error: { code: string } | null }>;
};
export async function submitCheckin(input: unknown, verifiedContext: { ownerId: string; expectedRevision: number },
  repository: CheckinSubmissionRepository): Promise<CheckinResult<CheckinSubmitReceipt>> {
  const bound = bind(input, verifiedContext);
  if (!bound.ok) return bound;
  try {
    const result = await repository.submitAtomically(bound.value);
    if (result.error) return safeFailure(result.error.code);
    const receipt = mapCheckinSubmitReceipt(result.data);
    return receipt.ok && receipt.value.revision <= bound.value.expectedRevision ? checkinFailure('unavailable') : receipt;
  } catch { return checkinFailure('unavailable'); }
}
