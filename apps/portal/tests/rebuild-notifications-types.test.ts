import { createNotificationsController } from '../src/features/notifications/controller.ts';
import type { ApplicationSession } from '../src/app/session.ts';
import type { NotificationController } from '../src/features/notifications/types.ts';
// Compiler-only contract checks; this function is never called.
function notificationTypeContract(runtime: ApplicationSession) {
  const controller: NotificationController = createNotificationsController(runtime, { isApplicable: () => false });
  // @ts-expect-error a caller cannot supply an operation port
  createNotificationsController(runtime, { port: { execute: async () => ({}) } });
  // @ts-expect-error a caller cannot grant current authority
  createNotificationsController(runtime, { current: () => true });
  // @ts-expect-error a caller cannot supply a client selector
  createNotificationsController(runtime, { clientId: 'caller' });
  // @ts-expect-error a caller cannot supply an owner selector
  createNotificationsController(runtime, { owner: 'caller' });
  // @ts-expect-error a caller cannot supply role/rights
  createNotificationsController(runtime, { edit: true });
  // @ts-expect-error a caller cannot supply a clock
  createNotificationsController(runtime, { now: () => 0 });
  // @ts-expect-error relevance must return a literal boolean
  createNotificationsController(runtime, { isApplicable: () => ({ current: true }) });
  // @ts-expect-error the public snapshot is readonly
  controller.getSnapshot().phase = 'ready';
  return controller;
}
void notificationTypeContract;
