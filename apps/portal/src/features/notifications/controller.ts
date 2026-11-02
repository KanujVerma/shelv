import type { ApplicationSession } from '../../app/session.ts';
import { createNotificationRequest } from '../../app/notification-request.ts';
import type { NotificationCommand, NotificationInboxPage, NotificationDeliveryPage, NotificationWriteReceipt } from '../../../../../src/contracts/PortalNotification.ts';
import { mapNotificationResult } from '../../../../../src/contracts/PortalNotificationMapping.ts';
import { freeze } from './model.ts';
import { captureOriginal, observeOriginal, publicationReference } from './recovery.ts';
import type { PendingNotification, NotificationReference } from './recovery.ts';
import type { NotificationController, NotificationPhase, NotificationState } from './types.ts';
type Memory = { readonly owner: object; readonly pending: PendingNotification | null };
type Operation = { readonly abort: AbortController; readonly command: NotificationCommand; readonly pending: PendingNotification | null; readonly caps: string; resolved: boolean };
const memoryKey = 'notifications.original.v1';
const editRecoveryReason = 'editing access is needed to check or retry this email action. the original action is kept for this session.';
const viewRecoveryReason = 'viewing access is needed to check or retry this notification action. the original action is kept for this session.';

/** Creation-bound to the actual runtime. Relevance can deny, never grant. */
export function createNotificationsController(runtime: ApplicationSession, options: { isApplicable?: () => boolean } = {}): NotificationController {
  const capturedBoundary = runtime.getSnapshot().boundary, request = createNotificationRequest(runtime);
  if (!capturedBoundary) throw Error('notification session unavailable');
  const boundary = capturedBoundary;
  const audience = runtime.cookie.audience, actor = runtime.cookie.identity?.ownerId,
    epoch = runtime.cookie._epoch, generation = runtime.cookie.generation, serverGeneration = runtime.cookie._view?.generation;
  const owner = Object.freeze({}), listeners = new Set<() => void>();
  let disposed = false, ended = false, reconciling = false, evaluating = false, active: Operation | null = null;
  let pending = boundary.memory.get<Memory>(memoryKey)?.pending ?? null;
  boundary.memory.set(memoryKey, Object.freeze({ owner, pending }));
  let selected: NotificationReference | null = null, inboxTrail: (string | null)[] = [], deliveryTrail: (string | null)[] = [];
  const caps = () => JSON.stringify([runtime.cookie._view?.capabilities.view, runtime.cookie._view?.capabilities.edit]);
  let lastCaps = caps();
  const blank = (phase: NotificationPhase): NotificationState => freeze({ phase, audience, inbox: null, deliveries: null, selectedEvent: null,
    loadingDeliveries: false, canPreviousInbox: false, canPreviousDeliveries: false, canRetryEmail: false,
    pendingRecovery: { available: false, reason: null },
    mutation: 'idle', pending: null, receipt: null, checkingStatus: false, confirmation: null, message: null,
    missingInput: 'trusted_notification_event_reference' });
  let state: NotificationState = blank('idle');
  const same = () => !disposed && !ended && runtime.getSnapshot().boundary === boundary && runtime.cookie.audience === audience &&
    runtime.cookie.identity?.role === audience && runtime.cookie.identity.ownerId === actor && runtime.cookie._epoch === epoch &&
    runtime.cookie.generation === generation && runtime.cookie._view?.generation === serverGeneration;
  const identity = () => same() && request.isCurrent() && same();
  const memoryOwner = () => identity() && boundary.memory.get<Memory>(memoryKey)?.owner === owner && identity();
  /** Projection only, after the caller's current/ownership checks. No callbacks,
   * authorization grant, mutable getter or new snapshot on a stable read. */
  function project(next: NotificationState): NotificationState {
    let reason: string | null = null;
    if (next.pending) {
      if (!same() || runtime.cookie.status !== 'ready') reason = 'notifications are unavailable. the original action is kept for this session.';
      else if (runtime.cookie._view?.capabilities.view !== true) reason = viewRecoveryReason;
      else if (next.pending.action === 'retry_failed_email_v1' && (audience !== 'advisor' || runtime.cookie._view.capabilities.edit !== true)) reason = editRecoveryReason;
      else if (next.phase !== 'ready') reason = 'refresh notifications before checking or retrying this action.';
    }
    return freeze({ ...next, pendingRecovery: { available: next.pending !== null && reason === null, reason } });
  }
  function notify(expected: NotificationState) {
    for (const listener of [...listeners]) {
      if (state !== expected) break;
      try { listener(); } catch { /* Observer exceptions are not validation or network failures. */ }
      if (!reconciling) reconcile();
      if (state !== expected || disposed) break;
    }
  }
  /** Clear private state and detach the old operation before ANY callback. */
  function hide(phase: NotificationPhase, terminal = false) {
    const old = active;
    active = null;
    if (terminal) ended = true;
    selected = null; inboxTrail = []; deliveryTrail = [];
    state = blank(phase);
    const cleared = state;
    old?.abort.abort();
    if (state === cleared) notify(cleared);
  }
  function reconcile() {
    if (disposed || ended || reconciling) return;
    reconciling = true;
    try {
      if (!memoryOwner()) { if (!disposed && !ended) hide('ended', true); return; }
      let relevant = true;
      if (!evaluating && options.isApplicable) {
        evaluating = true;
        try { relevant = options.isApplicable() === true; } catch { relevant = false; }
        finally { evaluating = false; }
        if (!memoryOwner()) { if (!disposed && !ended) hide('ended', true); return; }
      }
      if (!relevant) { hide('ended', true); return; }
      const nextCaps = caps(), view = runtime.cookie._view?.capabilities.view === true;
      const phase = runtime.cookie.status === 'offline' ? 'offline' : !view ? 'denied' : null;
      if (phase) { lastCaps = nextCaps; if (state.phase !== phase || state.inbox || state.deliveries || active) hide(phase); return; }
      if (nextCaps !== lastCaps) { lastCaps = nextCaps; hide('idle'); }
    } finally { reconciling = false; }
  }
  const usable = () => { reconcile(); return !disposed && !ended && memoryOwner() && runtime.cookie.status === 'ready' && runtime.cookie._view?.capabilities.view === true; };
  const owns = (op: Operation) => usable() && active === op && !op.abort.signal.aborted && caps() === op.caps &&
    (op.pending === null || pending === (op.resolved ? null : op.pending));
  function remember() {
    if (!memoryOwner()) return false;
    boundary.memory.set(memoryKey, Object.freeze({ owner, pending }));
    return memoryOwner();
  }
  function update(patch: Partial<NotificationState>, op?: Operation) {
    // All invalidating checks precede the spread of current state.
    const expected = state;
    if ((op ? !owns(op) : !usable()) || state !== expected) return false;
    const next = project({ ...expected, ...patch });
    state = next;
    notify(next);
    return state === next && (op ? owns(op) : usable());
  }
  function start(command: NotificationCommand, patch: Partial<NotificationState>, original: PendingNotification | null = null) {
    const expected = state;
    if (!usable() || state !== expected) return null;
    const old = active, op: Operation = { abort: new AbortController(), command: freeze(command), pending: original, caps: caps(), resolved: false };
    active = op;
    state = project({ ...state, ...patch, pending: pending?.original ?? null,
      mutation: original ? command.action === 'request_status_v1' ? state.mutation : 'saving' : pending ? state.mutation === 'unknown' ? 'unknown' : 'uncertain' : state.mutation,
      confirmation: null, message: null, canRetryEmail: false });
    const next = state;
    old?.abort.abort();
    if (!owns(op) || state !== next) return null;
    notify(next);
    return owns(op) && state === next ? op : null;
  }
  async function execute(op: Operation, command = op.command) {
    if (!owns(op)) return null;
    const result = await request.execute(command, { signal: op.abort.signal, isApplicable: () => owns(op) });
    if (!owns(op)) return null;
    return freeze(mapNotificationResult(result, command));
  }
  function failure(op: Operation, error: unknown) {
    reconcile();
    if (!owns(op)) return;
    const status = (error as { status?: number } | null)?.status;
    if (status === 401) {
      // A sibling suspension can cause a local401 while this same boundary is
      // still current. It is not proven server revocation or permission to lose custody.
      if (runtime.cookie.status === 'offline' && identity()) hide('offline');
      else hide('ended', true);
      return;
    }
    if (status === 403) { hide('denied'); return; }
    const write = op.pending !== null && !op.resolved;
    update({ phase: write ? 'ready' : 'error', inbox: null, deliveries: null, selectedEvent: null,
      loadingDeliveries: false, checkingStatus: false, canRetryEmail: false, pending: pending?.original ?? null,
      mutation: write ? status === 409 ? 'conflict' : 'uncertain' : state.mutation,
      message: status === 409 ? 'this changed. refresh before trying again.' : write ? 'the original action still needs confirmation.' : 'could not load notifications.' }, op);
  }
  function finish(op: Operation) { reconcile(); if (active === op) active = null; }
  const inboxCommand = (cursor: string | null): NotificationCommand => ({ schemaVersion: 1, action: 'list_inbox_v1', cursor, limit: 50 });
  const deliveryCommand = (ref: NotificationReference, cursor: string | null): NotificationCommand => ({ schemaVersion: 1, action: 'read_event_deliveries_v1', eventId: ref.eventId, cursor, limit: 50 });
  async function readInbox(cursor: string | null, trail: (string | null)[]) {
    const op = start(inboxCommand(cursor), { phase: 'loading', inbox: null });
    if (!op) return;
    try {
      const value = await execute(op);
      if (!owns(op) || !value || !('items' in value) || 'event' in value) return;
      inboxTrail = [...trail];
      update({ phase: 'ready', inbox: value as NotificationInboxPage, canPreviousInbox: trail.length > 1,
        pending: pending?.original ?? null, mutation: pending ? state.mutation === 'unknown' ? 'unknown' : 'uncertain' : state.mutation,
        canRetryEmail: !!state.deliveries && audience === 'advisor' && runtime.cookie._view?.capabilities.edit === true }, op);
    } catch (error) { failure(op, error); } finally { finish(op); }
  }
  async function readDeliveries(cursor: string | null, trail: (string | null)[]) {
    if (!usable() || audience !== 'advisor' || !selected) return;
    const ref = selected, op = start(deliveryCommand(ref, cursor), { phase: 'ready', deliveries: null, loadingDeliveries: true });
    if (!op) return;
    try {
      const value = await execute(op);
      if (!owns(op) || selected !== ref || !value || !('event' in value)) return;
      if (JSON.stringify(value.event.source) !== JSON.stringify(ref.source)) throw Error('notification source changed');
      deliveryTrail = [...trail];
      update({ phase: 'ready', deliveries: value as NotificationDeliveryPage, selectedEvent: value.event,
        loadingDeliveries: false, missingInput: null, canPreviousDeliveries: trail.length > 1,
        canRetryEmail: runtime.cookie._view?.capabilities.edit === true }, op);
    } catch (error) { failure(op, error); } finally { finish(op); }
  }
  async function resolved(op: Operation, receipt: NotificationWriteReceipt) {
    if (!owns(op) || !op.pending || pending !== op.pending) return;
    // Historical receipt resolves only its original. Do not overlay live rows.
    const hadInbox = state.inbox !== null || op.pending.original.action === 'mark_seen_v1';
    const inboxCursor = state.inbox?.cursor ?? null, ref = selected, deliveryCursor = state.deliveries?.cursor ?? null;
    pending = null; op.resolved = true;
    if (!remember() || !owns(op)) return;
    if (!update({ phase: 'loading', inbox: null, deliveries: null, selectedEvent: null,
      pending: null, receipt, mutation: 'resolved', checkingStatus: false, loadingDeliveries: false }, op)) return;
    let inbox: NotificationInboxPage | null = null, deliveries: NotificationDeliveryPage | null = null;
    if (hadInbox) {
      const value = await execute(op, inboxCommand(inboxCursor));
      if (!owns(op) || !value || !('items' in value) || 'event' in value) return;
      inbox = value as NotificationInboxPage;
    }
    if (ref && audience === 'advisor') {
      const value = await execute(op, deliveryCommand(ref, deliveryCursor));
      if (!owns(op) || selected !== ref || !value || !('event' in value)) return;
      if (JSON.stringify(value.event.source) !== JSON.stringify(ref.source)) throw Error('notification source changed');
      deliveries = value as NotificationDeliveryPage;
    }
    update({ phase: 'ready', inbox, deliveries, selectedEvent: deliveries?.event ?? null,
      canRetryEmail: !!deliveries && runtime.cookie._view?.capabilities.edit === true,
      message: 'the original action was recorded. current status has been refreshed.' }, op);
  }
  async function runOriginal(statusOnly: boolean) {
    if (!usable() || !pending) return;
    const original = pending;
    if (original.original.action === 'retry_failed_email_v1' && (audience !== 'advisor' || runtime.cookie._view?.capabilities.edit !== true)) {
      update({ pending: original.original, mutation: state.mutation === 'unknown' || state.mutation === 'conflict' ? state.mutation : 'uncertain', message: editRecoveryReason });
      return;
    }
    const command: NotificationCommand = statusOnly ? { schemaVersion: 1, action: 'request_status_v1', original: original.original } : original.original;
    const op = start(command, { phase: 'ready', checkingStatus: statusOnly }, original);
    if (!op) return;
    try {
      const value = await execute(op);
      if (!owns(op) || pending !== original || !value) return;
      if (statusOnly) {
        const observed = observeOriginal(original, value);
        if (observed.mutation === 'unknown') { update({ mutation: 'unknown', checkingStatus: false, pending: original.original }, op); return; }
        await resolved(op, observed.receipt!);
      } else await resolved(op, value as NotificationWriteReceipt);
    } catch (error) { failure(op, error); } finally { finish(op); }
  }
  const unsubscribeRuntime = runtime.subscribe(reconcile), unsubscribeBoundary = boundary.subscribeInvalidation(reconcile);
  const controller: NotificationController = {
    getSnapshot() { reconcile(); return state; },
    subscribe(fn) { if (disposed) return () => {}; listeners.add(fn); return () => listeners.delete(fn); },
    loadInbox: () => readInbox(null, [null]),
    async nextInbox() { if (!usable() || !state.inbox?.nextCursor) return; await readInbox(state.inbox.nextCursor, [...inboxTrail, state.inbox.nextCursor]); },
    async previousInbox() { if (!usable() || inboxTrail.length < 2) return; const trail = inboxTrail.slice(0, -1); await readInbox(trail.at(-1) ?? null, trail); },
    async openEvent(deliveryId) {
      if (!usable() || audience !== 'advisor') return;
      const event = state.inbox?.items.find(item => item.deliveryId === deliveryId)?.event;
      if (!event) return;
      selected = freeze({ eventId: event.eventId, source: event.source });
      await readDeliveries(null, [null]);
    },
    async openPublication(command, receipt) {
      if (!usable() || audience !== 'advisor') return;
      let ref: NotificationReference;
      try { ref = publicationReference(command, receipt); } catch { update({ message: 'delivery status is unavailable for this publication.' }); return; }
      if (!usable()) return;
      selected = ref;
      await readDeliveries(null, [null]);
    },
    closeEvent() {
      if (!usable()) return;
      const old = active; active = null; selected = null; deliveryTrail = [];
      state = project({ ...state, selectedEvent: null, deliveries: null, loadingDeliveries: false, confirmation: null, canRetryEmail: false,
        missingInput: 'trusted_notification_event_reference', pending: pending?.original ?? null, mutation: pending ? 'uncertain' : state.mutation });
      const next = state; old?.abort.abort(); if (state === next) notify(next);
    },
    loadDeliveries: () => readDeliveries(null, [null]),
    async nextDeliveries() { if (!usable() || !state.deliveries?.nextCursor) return; await readDeliveries(state.deliveries.nextCursor, [...deliveryTrail, state.deliveries.nextCursor]); },
    async previousDeliveries() { if (!usable() || deliveryTrail.length < 2) return; const trail = deliveryTrail.slice(0, -1); await readDeliveries(trail.at(-1) ?? null, trail); },
    async markSeen(deliveryId) {
      if (!usable() || pending || active) return;
      const item = state.inbox?.items.find(item => item.deliveryId === deliveryId);
      if (!item || item.seenAt !== null) return;
      pending = captureOriginal({ schemaVersion: 1, action: 'mark_seen_v1', requestId: crypto.randomUUID(), deliveryId: item.deliveryId, expectedRevision: item.revision }, item.event);
      if (!remember()) return;
      await runOriginal(false);
    },
    prepareRetry(deliveryId) {
      if (!usable() || active || pending || audience !== 'advisor' || !state.canRetryEmail || runtime.cookie._view?.capabilities.edit !== true) return;
      const item = state.deliveries?.items.find(item => item.deliveryId === deliveryId);
      if (!item || item.channel !== 'email' || item.status !== 'failed') return;
      update({ confirmation: { deliveryId: item.deliveryId, revision: item.revision } });
    },
    cancelRetry() { update({ confirmation: null }); },
    async confirmRetry() {
      if (!usable() || active || pending || audience !== 'advisor' || runtime.cookie._view?.capabilities.edit !== true) return;
      const confirmation = state.confirmation, page = state.deliveries;
      const item = page?.items.find(item => item.deliveryId === confirmation?.deliveryId && item.revision === confirmation.revision && item.channel === 'email' && item.status === 'failed');
      if (!item || !page) return;
      pending = captureOriginal({ schemaVersion: 1, action: 'retry_failed_email_v1', requestId: crypto.randomUUID(), deliveryId: item.deliveryId, expectedRevision: item.revision }, page.event);
      if (!remember()) return;
      await runOriginal(false);
    },
    checkStatus: () => runOriginal(true), retryExact: () => runOriginal(false),
    dispose() {
      if (disposed) return;
      // The memory owner remains available for same-session remount. This old
      // controller cannot clear or modify the next owner's original.
      const old = active, observers = [...listeners];
      disposed = true; active = null; selected = null; state = blank('ended'); listeners.clear();
      request.dispose(); unsubscribeRuntime(); unsubscribeBoundary(); old?.abort.abort();
      for (const observer of observers) { try { observer(); } catch { /* local observer */ } }
    },
  };
  reconcile();
  return controller;
}
