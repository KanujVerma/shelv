import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ApplicationSession } from './session.ts';
import type { PortalNavigator } from '../navigation/history.ts';
import { parseRoute } from '../navigation/routes.ts';
import { useCompletePortalNavigator } from '../navigation/react.tsx';
import { createOwnerPolicyController } from '../features/advisor/permissions/controller.ts';
import type { OwnerPolicyController } from '../features/advisor/permissions/controller.ts';
import { OwnerPolicy } from '../features/advisor/permissions/OwnerPolicy.tsx';
import { StatusNotice } from '../ui/index.ts';

type Snapshot =
  | Readonly<{ phase: 'active'; controller: OwnerPolicyController }>
  | Readonly<{ phase: 'inactive' | 'denied' | 'ended'; controller: null }>;
const inactive: Snapshot = Object.freeze({ phase: 'inactive', controller: null });
const denied: Snapshot = Object.freeze({ phase: 'denied', controller: null });
const ended: Snapshot = Object.freeze({ phase: 'ended', controller: null });
const scopeBrand: unique symbol = Symbol('owner-policy-application');

/** Created after commit, against the actual session and canonical navigator.
 * The feature owns commands and pending session memory; this scope owns only
 * the mounted entry's controller. Reads start in OwnerPolicy's existing effect. */
export function createOwnerPolicyApplicationScope({ runtime, navigator, win }: {
  runtime: ApplicationSession;
  navigator: PortalNavigator;
  win: Window;
}) {
  const boundary = runtime.getSnapshot().boundary;
  const listeners = new Set<() => void>();
  let disposed = false, superseded = false, sequence = 0, snapshot: Snapshot = inactive;
  let owner: { entry: string; controller: OwnerPolicyController } | null = null;
  function context(): { entry: string | null; fallback: Snapshot } {
    if (disposed || superseded || !boundary || runtime.getSnapshot().boundary !== boundary ||
        !boundary.isCurrent() || runtime.cookie.audience !== 'advisor' ||
        runtime.cookie.identity?.role !== 'advisor') return { entry: null, fallback: ended };
    if (runtime.cookie._view?.capabilities.view !== true) return { entry: null, fallback: denied };
    const path = navigator.getSnapshot();
    if (path !== win.location.pathname + win.location.search ||
        parseRoute(path)?.name !== 'advisor-permissions') return { entry: null, fallback: inactive };
    const marker = (win.history.state as {
      shelvNavigation?: { scopeKey?: unknown; entryId?: unknown };
    } | null)?.shelvNavigation;
    const entry = marker?.scopeKey === boundary.key && typeof marker.entryId === 'string' &&
      /^[a-zA-Z0-9_:.-]{1,160}$/.test(marker.entryId) ? marker.entryId : null;
    return { entry, fallback: inactive };
  }
  function emit() {
    for (const fn of [...listeners]) {
      try { fn(); } catch { /* A local observer cannot fail shared navigation/session work. */ }
    }
  }
  function retire(fallback: Snapshot) {
    const prior = owner;
    owner = null;
    const changed = snapshot !== fallback;
    snapshot = fallback;
    // Detach first. A synchronous invalidation callback may already enter B.
    // Let the fixed feature retire lost view/session authority before disposal;
    // on ordinary route exit its dispatched pending command remains in memory.
    try { prior?.controller.getSnapshot(); }
    finally { prior?.controller.dispose(); }
    if (changed) emit();
  }
  function reconcile() {
    if (disposed) return;
    const token = ++sequence, captured = owner;
    const phase = captured?.controller.getSnapshot().phase;
    if (token !== sequence || disposed || owner !== captured) return;
    if (phase === 'ended') {
      superseded = true;
      retire(ended);
      return;
    }
    const next = context();
    if (token !== sequence || disposed || owner !== captured) return;
    if (owner && next.entry === owner.entry) return;
    retire(next.fallback);
    if (token !== sequence || disposed || !next.entry) return;
    const fresh = context();
    if (fresh.entry !== next.entry) return;
    const controller = createOwnerPolicyController(runtime);
    if (token !== sequence || disposed || context().entry !== next.entry) {
      controller.dispose();
      return;
    }
    owner = { entry: next.entry, controller };
    snapshot = Object.freeze({ phase: 'active', controller });
    emit();
  }
  const stopNavigation = navigator.subscribe(reconcile);
  const stopSession = runtime.subscribe(reconcile);
  const stopBoundary = boundary?.subscribeInvalidation(reconcile);
  reconcile();
  return Object.freeze({
    [scopeBrand]: true as const,
    getSnapshot(): Snapshot {
      const captured = owner;
      const replaced = captured?.controller.getSnapshot().phase === 'ended';
      if (owner !== captured) return snapshot;
      const next = context();
      if (owner !== captured) return snapshot;
      if (replaced) superseded = true;
      if (captured && (next.entry !== captured.entry || replaced)) {
        // This read may retire an old controller, never construct one in render.
        sequence++;
        retire(replaced ? ended : next.fallback);
      }
      return snapshot;
    },
    subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
    dispose() {
      if (disposed) return;
      disposed = true;
      sequence++;
      stopNavigation();
      stopSession();
      stopBoundary?.();
      retire(ended);
      listeners.clear();
    },
  });
}
export type OwnerPolicyApplicationScope = ReturnType<typeof createOwnerPolicyApplicationScope>;

/** Same source composition for React and source-only SSR verification. The
 * scope supplies a real controller; it accepts no policy/owner/current flags. */
export function OwnerPolicyApplicationContent({ scope }: { scope: OwnerPolicyApplicationScope }) {
  const state = useSyncExternalStore(scope.subscribe, scope.getSnapshot, scope.getSnapshot);
  if (state.controller) return <OwnerPolicy controller={state.controller} />;
  if (state.phase === 'inactive') return null;
  return <StatusNotice tone="denied" title={state.phase === 'denied'
    ? 'you do not have access to this policy.' : 'your session has ended. sign in again.'} />;
}
export function OwnerPolicyApplication({ runtime, win }: { runtime: ApplicationSession; win: Window }) {
  const { boundary } = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getSnapshot);
  const navigator = useCompletePortalNavigator();
  const [scope, setScope] = useState<OwnerPolicyApplicationScope | null>(null);
  useEffect(() => {
    if (!navigator) return;
    const next = createOwnerPolicyApplicationScope({ runtime, navigator, win });
    setScope(next);
    return () => next.dispose();
  }, [runtime, boundary, navigator, win]);
  return scope ? <OwnerPolicyApplicationContent scope={scope} />
    : <StatusNotice tone="loading" title="loading workspace permissions" />;
}
