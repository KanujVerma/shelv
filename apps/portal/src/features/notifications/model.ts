import type { NotificationDeliveryStatus, NotificationEvent, NotificationInboxPage } from '../../../../../src/contracts/PortalNotification.ts';
import { mapNotificationResult, readNotificationEvent } from '../../../../../src/contracts/PortalNotificationMapping.ts';
import { readNotificationCommand } from '../../../../../src/contracts/PortalNotificationValidation.ts';
import { buildRoute } from '../../navigation/routes.ts';

export function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) freeze(item);
    Object.freeze(value);
  }
  return value;
}
const emailDetails: Record<NotificationDeliveryStatus, string> = {
  queued: 'waiting to be sent.',
  claimed: 'sending is in progress. delivery is not confirmed.',
  uncertain: 'the send result is unknown. it needs reconciliation before another send.',
  accepted: 'accepted for sending. delivery is not confirmed.',
  delivered: 'delivery was confirmed. this does not confirm the email was opened.',
  failed: 'the send failed. an authorized advisor can retry this email.',
  bounced: 'the email bounced. another send is unavailable here.',
};
export function presentEmail(status: NotificationDeliveryStatus) {
  return freeze({ label: status, detail: emailDetails[status], retryable: status === 'failed' });
}
/** Only Root-approved source/destination pairs reach the canonical serializers. */
export function presentEvent(value: NotificationEvent) {
  const event = readNotificationEvent(value);
  const title = event.source.kind === 'publication' ? 'your plan is ready'
    : event.source.kind === 'guidance' ? 'an update is available'
    : 'a client update is available';
  const destination = event.destination;
  const href = destination.kind === 'plan_version'
    ? buildRoute({ name: 'history-version', version: String(destination.version) })
    : destination.kind === 'public_history'
      ? buildRoute({ name: 'history-event', eventId: `public_${destination.recordKind}:${destination.recordId}` })
      : null;
  return freeze({ title, href, createdAt: event.createdAt,
    missingInput: destination.kind === 'unavailable' ? destination.reason : null });
}
/** A page is an observation. No total, unread badge or immutable completeness. */
export function presentInbox(value: NotificationInboxPage) {
  const command = readNotificationCommand({ schemaVersion: 1, action: 'list_inbox_v1', cursor: value.cursor, limit: 50 });
  const page = mapNotificationResult(value, command) as NotificationInboxPage;
  return freeze({ observedAt: page.observedAt, cursor: page.cursor, nextCursor: page.nextCursor,
    items: page.items.map(item => ({ ...presentEvent(item.event), portalLabel: item.seenAt === null ? 'unread' : 'seen',
      seenAt: item.seenAt, email: item.email === null ? null : presentEmail(item.email.status) })) });
}
