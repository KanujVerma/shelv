import type { ApplicationSession } from './session.ts';
import type { PlanSessionBoundary } from '../features/plan/types.ts';
import { createNotificationsController } from '../features/notifications/controller.ts';
import type { NotificationController, NotificationState } from '../features/notifications/types.ts';

type View = { clear(): () => void; changed(): void };
type Slot = {
  boundary: PlanSessionBoundary;
  core: NotificationController | null;
  view: View | null;
  creating: boolean;
  ended: boolean;
  unsubscribe(): void;
};
const slots = new WeakMap<ApplicationSession, Slot>();

export interface NotificationViewLease {
  readonly controller: NotificationController;
  /** Call after commit. Construction and SSR do not create a feature owner. */
  readonly start: () => boolean;
  readonly dispose: () => void;
}

/** One private feature controller per actual runtime boundary. A view handle
 * owns presentation and callbacks only; it cannot supply identity or rights. */
export function createNotificationViewLease(
  runtime: ApplicationSession,
  options: { isApplicable?: () => boolean } = {},
): NotificationViewLease {
  const boundary = runtime.getSnapshot().boundary;
  const audience = runtime.cookie.audience, actor = runtime.cookie.identity?.ownerId;
  const epoch = runtime.cookie._epoch, generation = runtime.cookie.generation;
  const serverGeneration = runtime.cookie._view?.generation, csrf = runtime.cookie._view?.csrf;
  const listeners = new Set<() => void>();
  let slot: Slot | null = null, running = false, disposed = false, evaluating = false;
  const blank = (phase: 'idle' | 'ended'): NotificationState => Object.freeze({
    phase, audience, inbox: null, deliveries: null, selectedEvent: null,
    loadingDeliveries: false, canPreviousInbox: false, canPreviousDeliveries: false,
    canRetryEmail: false, pendingRecovery: Object.freeze({ available: false, reason: null }),
    mutation: 'idle', pending: null, receipt: null, checkingStatus: false,
    confirmation: null, message: null, missingInput: 'trusted_notification_event_reference',
  });
  let hidden = blank('idle');
  function same() {
    return !disposed && boundary !== null && runtime.getSnapshot().boundary === boundary &&
      runtime.cookie.audience === audience && runtime.cookie.identity?.role === audience &&
      runtime.cookie.identity.ownerId === actor && runtime.cookie._epoch === epoch &&
      runtime.cookie.generation === generation && runtime.cookie._view?.generation === serverGeneration &&
      runtime.cookie._view?.csrf === csrf;
  }
  function lifetime() {
    if (!same()) return false;
    const current = boundary!.isCurrent();
    return current && same();
  }
  function direct() {
    return running && !disposed && slot !== null && !slot.ended &&
      slots.get(runtime) === slot && slot.view === view && same();
  }
  function applicable() {
    // Eligibility is unknown until the complete check returns. Reentry cannot
    // observe a provisional ready phase, including through the option getter.
    if (evaluating) return false;
    evaluating = true;
    try {
      if (!direct() || !lifetime()) return false;
      let relevant = false;
      try {
        const callback = options.isApplicable;
        relevant = callback === undefined || typeof callback === 'function' && callback() === true;
      } catch { relevant = false; }
      return relevant && direct() && lifetime() && direct();
    } finally { evaluating = false; }
  }
  function clear() {
    const observers = [...listeners];
    disposed = true; running = false; hidden = blank('ended'); listeners.clear();
    const previous = slot; slot = null;
    if (previous?.view === view) previous.view = null;
    return () => { for (const observer of observers) { try { observer(); } catch { /* local observer */ } } };
  }
  function endSlot(value: Slot) {
    if (value.ended) return;
    value.ended = true;
    if (slots.get(runtime) === value) slots.delete(runtime);
    const previous = value.view, core = value.core, unsubscribe = value.unsubscribe;
    value.view = null; value.core = null; value.unsubscribe = () => {};
    const notify = previous?.clear();
    unsubscribe(); core?.dispose(); notify?.();
  }
  function dispose() {
    if (disposed) return;
    const previous = slot, owned = previous?.view === view;
    const notify = clear();
    // The feature clears its operation before abort/observer callbacks. Keep
    // the core alive so uncertainty remains with this actual session owner.
    if (owned) previous?.core?.closeEvent();
    notify();
  }
  function changed() {
    if (!running || disposed) return;
    if (!applicable()) { dispose(); return; }
    for (const listener of [...listeners]) {
      if (!direct()) break;
      try { listener(); } catch { /* local observer */ }
      if (!applicable()) { dispose(); break; }
    }
  }
  const view: View = { clear, changed };
  function start() {
    if (disposed) return false;
    if (running) { if (!applicable()) dispose(); return direct(); }
    if (!lifetime()) { dispose(); return false; }
    let current = slots.get(runtime);
    if (current && current.boundary !== boundary) { endSlot(current); current = undefined; }
    if (!lifetime()) { dispose(); return false; }
    current = slots.get(runtime);
    if (!current) {
      current = { boundary: boundary!, core: null, view: null, creating: false, ended: false, unsubscribe() {} };
      slots.set(runtime, current);
    }
    if (current.boundary !== boundary || current.ended) { dispose(); return false; }
    slot = current; running = true;
    const previous = current.view; current.view = view;
    const notifyPrevious = previous && previous !== view ? previous.clear() : null;
    current.core?.closeEvent();
    notifyPrevious?.();
    if (!applicable()) { dispose(); return false; }
    if (!current.core) {
      if (current.creating) { dispose(); return false; }
      current.creating = true;
      let created: NotificationController;
      try { created = createNotificationsController(runtime); }
      catch (error) { endSlot(current); throw error; }
      finally { current.creating = false; }
      if (slots.get(runtime) !== current || current.ended || !lifetime()) {
        created.dispose(); dispose(); return false;
      }
      current.core = created;
      const captured = current;
      current.unsubscribe = created.subscribe(() => {
        if (captured.ended || captured.core !== created) return;
        if (created.getSnapshot().phase === 'ended') { endSlot(captured); return; }
        captured.view?.changed();
      });
    }
    if (!applicable()) { dispose(); return false; }
    if (current.core.getSnapshot().phase === 'ended') { endSlot(current); return false; }
    changed();
    if (!direct() || !lifetime() || !direct()) { dispose(); return false; }
    return true;
  }
  function read(): NotificationState {
    if (!running || disposed) return hidden;
    if (!applicable()) { dispose(); return hidden; }
    const current = slot, core = current?.core;
    if (!core) return hidden;
    const state = core.getSnapshot();
    if (state.phase === 'ended') { endSlot(current!); return hidden; }
    if (!applicable()) { dispose(); return hidden; }
    const final = core.getSnapshot();
    if (!direct() || !lifetime() || !direct()) { dispose(); return hidden; }
    return final;
  }
  async function invoke(action: (core: NotificationController) => Promise<void>) {
    if (!applicable()) { if (running) dispose(); return; }
    if (runtime.cookie.status !== 'ready' || !direct()) return;
    const core = slot?.core;
    if (!core) return;
    await action(core);
    if (!applicable()) dispose();
  }
  function local(action: (core: NotificationController) => void) {
    if (!applicable()) { if (running) dispose(); return; }
    if (runtime.cookie.status !== 'ready' || !direct()) return;
    const core = slot?.core;
    if (core) action(core);
    if (!applicable()) dispose();
  }
  const controller: NotificationController = Object.freeze({
    getSnapshot: read,
    subscribe(listener: () => void) { if (disposed) return () => {}; listeners.add(listener); return () => { listeners.delete(listener); }; },
    loadInbox: () => invoke(core => core.loadInbox()),
    nextInbox: () => invoke(core => core.nextInbox()),
    previousInbox: () => invoke(core => core.previousInbox()),
    openEvent: (id: string) => invoke(core => core.openEvent(id)),
    openPublication: (...args: Parameters<NotificationController['openPublication']>) => invoke(core => core.openPublication(...args)),
    closeEvent: () => local(core => core.closeEvent()),
    loadDeliveries: () => invoke(core => core.loadDeliveries()),
    nextDeliveries: () => invoke(core => core.nextDeliveries()),
    previousDeliveries: () => invoke(core => core.previousDeliveries()),
    markSeen: (id: string) => invoke(core => core.markSeen(id)),
    prepareRetry: (id: string) => local(core => core.prepareRetry(id)),
    cancelRetry: () => local(core => core.cancelRetry()),
    confirmRetry: () => invoke(core => core.confirmRetry()),
    checkStatus: () => invoke(core => core.checkStatus()),
    retryExact: () => invoke(core => core.retryExact()),
    dispose,
  });
  return Object.freeze({ controller, start, dispose });
}
