import type { NotificationEvent, NotificationSource, NotificationWrite, NotificationWriteReceipt } from '../../../../../src/contracts/PortalNotification.ts';
import type { PlanCommand, PublishReceipt } from '../../../../../src/contracts/PortalRebuild.ts';
import { readNotificationCommand } from '../../../../../src/contracts/PortalNotificationValidation.ts';
import { readNotificationEvent, mapNotificationResult } from '../../../../../src/contracts/PortalNotificationMapping.ts';
import { readPlanCommand } from '../../../../../src/contracts/PortalRebuildValidation.ts';
import { mapPlanResult } from '../../../../../src/contracts/PortalRebuildMapping.ts';
import { freeze } from './model.ts';
export interface NotificationReference { readonly eventId: string; readonly source: NotificationSource }
export interface PendingNotification {
  readonly original: NotificationWrite;
  readonly event: NotificationEvent;
  readonly wire: string;
}
export function captureOriginal(value: NotificationWrite, event: NotificationEvent): PendingNotification {
  const original = readNotificationCommand(value);
  if (original.action !== 'mark_seen_v1' && original.action !== 'retry_failed_email_v1') throw Error('invalid notification write');
  return freeze({ original, event: readNotificationEvent(event), wire: JSON.stringify(original) });
}
/** This resolves a receipt only. A caller must separately refresh live rows. */
export function observeOriginal(pending: PendingNotification, value: unknown): {
  pending: PendingNotification | null; receipt: NotificationWriteReceipt | null; mutation: 'unknown' | 'resolved';
} {
  const result = mapNotificationResult(value, { schemaVersion: 1, action: 'request_status_v1', original: pending.original });
  if (!('status' in result)) throw Error('invalid original status');
  return result.status === 'unknown'
    ? freeze({ pending, receipt: null, mutation: 'unknown' })
    : freeze({ pending: null, receipt: result.receipt, mutation: 'resolved' });
}
/** Existing PublishReceipt is the A06 producer. No freeform event lookup. */
export function publicationReference(value: Extract<PlanCommand, { action: 'publish_plan_v1' }>, receipt: PublishReceipt): NotificationReference {
  const command = readPlanCommand(value);
  if (command.action !== 'publish_plan_v1') throw Error('invalid publication');
  const result = mapPlanResult(receipt, command) as PublishReceipt;
  if (result.target.contentRevision !== command.target.contentRevision || result.target.assignmentRevision !== command.target.assignmentRevision) throw Error('publication revision mismatch');
  return freeze({ eventId: result.notificationEventId, source: { kind: 'publication', publicationVersion: result.publicationVersion } });
}
