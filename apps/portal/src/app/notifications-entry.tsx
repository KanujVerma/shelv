import { useEffect, useSyncExternalStore } from 'react';
import type { ApplicationSession } from './session.ts';
import type { PortalNavigationCore } from '../navigation/react.tsx';
import { buildRoute, parseRoute } from '../navigation/routes.ts';
import { createNotificationsController } from '../features/notifications/controller.ts';
import { Notifications } from '../features/notifications/Notifications.tsx';
import type { NotificationController } from '../features/notifications/types.ts';
import { StatusNotice } from '../ui/index.ts';

type EntrySnapshot = Readonly<{
  phase: 'idle' | 'active' | 'inactive' | 'ended';
  controller: NotificationController | null;
}>;
export type NotificationsEntry = Readonly<{
  getSnapshot(): EntrySnapshot;
  subscribe(listener: () => void): () => void;
  /** Called after React commit. Repeated starts share the same initial read. */
  start(): Promise<void>;
  stop(): void;
  dispose(): void;
}>;
type Owner = { retire(): void };
// Local lifetime arbitration only. No event, recipient, authority or client lookup.
const owners = new WeakMap<PortalNavigationCore, Owner>();
const idle: EntrySnapshot = Object.freeze({ phase: 'idle', controller: null });
const inactive: EntrySnapshot = Object.freeze({ phase: 'inactive', controller: null });
const ended: EntrySnapshot = Object.freeze({ phase: 'ended', controller: null });
const legacyNotificationsPath = buildRoute({ name: 'notifications' });

/** Binds the real session and canonical navigator once. Construction has no
 * subscriptions, controller, read, write or automatic session restoration. */
export function createNotificationsEntry(
  runtime: ApplicationSession,
  navigation: PortalNavigationCore,
): NotificationsEntry {
  const boundary = runtime.getSnapshot().boundary;
  const audience = runtime.cookie.audience;
  const notificationsPath = buildRoute({ name: audience === 'advisor' ? 'advisor-notifications' : 'notifications' });
  const actor = runtime.cookie.identity?.ownerId;
  const epoch = runtime.cookie._epoch;
  const generation = runtime.cookie.generation;
  const serverGeneration = runtime.cookie._view?.generation;
  const listeners = new Set<() => void>();
  let snapshot: EntrySnapshot = idle;
  let disposed = false, superseded = false, running = false, sequence = 0;
  let controller: NotificationController | null = null;
  let cleanups: (() => void)[] = [];
  let initialRead: Promise<void> | null = null;
  const owner: Owner = { retire() { superseded = true; retire(ended); } };

  function same() {
    return !disposed && !superseded && boundary !== null &&
      runtime.getSnapshot().boundary === boundary &&
      runtime.cookie.audience === audience && runtime.cookie.identity?.role === audience &&
      runtime.cookie.identity.ownerId === actor && runtime.cookie._epoch === epoch &&
      runtime.cookie.generation === generation && runtime.cookie._view?.generation === serverGeneration;
  }
  function lifetime() {
    if (!same()) return false;
    const valid = boundary!.isCurrent();
    return valid && same();
  }
  function onRoute() {
    const path = navigation.getSnapshot();
    const name = parseRoute(path)?.name;
    return (path === notificationsPath || audience === 'advisor' && path === legacyNotificationsPath) &&
      (name === 'notifications' || name === 'advisor-notifications');
  }
  // This callback can only deny. Actual session/role/rights stay in the feature
  // and retained transport; a route never supplies positive currentness.
  function applicable() {
    return running && owners.get(navigation) === owner && lifetime() && onRoute() &&
      running && owners.get(navigation) === owner && same();
  }
  function emit(expected: EntrySnapshot) {
    for (const listener of [...listeners]) {
      if (snapshot !== expected) break;
      try { listener(); } catch { /* Observer failures are local. */ }
    }
  }
  function retire(next: EntrySnapshot) {
    const old = controller, detach = cleanups;
    const changed = snapshot !== next;
    // Publish cleared ownership before unsubscribe, abort or observer callbacks.
    sequence++; running = false; controller = null; cleanups = []; initialRead = null;
    snapshot = next;
    if (owners.get(navigation) === owner) owners.delete(navigation);
    for (const stop of detach) { try { stop(); } catch { /* Continue own cleanup. */ } }
    old?.dispose();
    if (changed && snapshot === next) emit(next);
  }
  function reconcile() {
    if (!running) return;
    const token = sequence, captured = controller;
    const valid = applicable();
    if (token !== sequence || controller !== captured || !running) return;
    if (!valid) { retire(same() ? inactive : ended); return; }
    const phase = captured?.getSnapshot().phase;
    if (token !== sequence || controller !== captured || !running) return;
    if (phase === 'ended') { superseded = true; retire(ended); }
  }
  function attach(stop: () => void, token: number) {
    if (sequence === token && running) cleanups.push(stop);
    else stop();
  }
  function start(): Promise<void> {
    if (running) { reconcile(); if (running) return initialRead ?? Promise.resolve(); }
    if (disposed || superseded) return Promise.resolve();
    const token = ++sequence;
    if (!lifetime() || sequence !== token) {
      if (sequence === token) retire(ended);
      return Promise.resolve();
    }
    if (!onRoute()) { if (sequence === token) retire(inactive); return Promise.resolve(); }
    const previous = owners.get(navigation);
    running = true; owners.set(navigation, owner);
    if (previous !== owner) previous?.retire();
    if (sequence !== token || !applicable()) {
      if (sequence === token) {
        const next = same() ? inactive : ended;
        if (sequence === token) retire(next);
      }
      return Promise.resolve();
    }
    attach(navigation.subscribe(reconcile), token);
    if (sequence !== token || !applicable()) { reconcile(); return Promise.resolve(); }
    attach(runtime.subscribe(reconcile), token);
    attach(boundary!.subscribeInvalidation(reconcile), token);
    if (sequence !== token || !applicable()) { reconcile(); return Promise.resolve(); }
    const next = createNotificationsController(runtime, { isApplicable: applicable });
    if (sequence !== token || !applicable()) { next.dispose(); reconcile(); return Promise.resolve(); }
    controller = next;
    attach(next.subscribe(reconcile), token);
    snapshot = Object.freeze({ phase: 'active', controller: next });
    const published = snapshot;
    // Install the promise before observer callbacks so a reentrant start cannot
    // create a second initial read. The microtask rechecks exact ownership.
    const read = Promise.resolve().then(async () => {
      if (sequence === token && controller === next && applicable()) await next.loadInbox();
    });
    initialRead = read;
    emit(published);
    return read;
  }
  return Object.freeze({
    getSnapshot() { reconcile(); return snapshot; },
    subscribe(listener: () => void) {
      if (disposed) return () => {};
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start,
    stop() { if (!disposed) retire(idle); },
    dispose() {
      if (disposed) return;
      disposed = true;
      retire(ended);
      listeners.clear();
    },
  });
}

/** Uses the actual feature and shared wrappers. SSR never runs this effect. */
export function NotificationsEntryView({ entry }: { entry: NotificationsEntry }) {
  const state = useSyncExternalStore(entry.subscribe, entry.getSnapshot, entry.getSnapshot);
  useEffect(() => { void entry.start(); return () => entry.stop(); }, [entry]);
  if (state.controller) return <Notifications controller={state.controller} />;
  if (state.phase === 'inactive') return null;
  return <StatusNotice tone={state.phase === 'ended' ? 'denied' : 'loading'}
    title={state.phase === 'ended' ? 'your session has ended. sign in again.' : 'loading notifications'} />;
}
