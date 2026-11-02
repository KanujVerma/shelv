import { createNotificationsEntry, NotificationsEntryView } from '../src/app/notifications-entry.tsx';
import type { NotificationsEntry } from '../src/app/notifications-entry.tsx';
import type { ApplicationSession } from '../src/app/session.ts';
import type { PortalNavigationCore } from '../src/navigation/react.tsx';
declare const runtime: ApplicationSession;
declare const navigation: PortalNavigationCore;
const entry: NotificationsEntry = createNotificationsEntry(runtime, navigation);
const started: Promise<void> = entry.start(); void started;
NotificationsEntryView({ entry });
// @ts-expect-error no caller identity, authority, positive currentness or business port
createNotificationsEntry(runtime, navigation, { ownerId: 'caller', isCurrent: () => true });
// @ts-expect-error no injected controller factory
createNotificationsEntry({ createController() {} }, navigation);
// @ts-expect-error entry snapshot cannot be rebound by a consumer
entry.getSnapshot().controller = null;
// @ts-expect-error no mutable currentness projection
entry.getSnapshot().phase = 'active';
// @ts-expect-error no free-form event ID API
entry.openPublication('caller-event');
// @ts-expect-error incomplete navigator cannot supply canonical route/lifetime behavior
createNotificationsEntry(runtime, { isCurrent: () => true });
const controller = entry.getSnapshot().controller;
if (controller) {
  // @ts-expect-error existing Root publication custody requires original command and receipt
  controller.openPublication('event-id');
}
// @ts-expect-error the entry API itself is readonly
entry.start = async () => {};
