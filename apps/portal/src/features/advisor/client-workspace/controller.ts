import { mapPlanResult } from "../../../../../../src/contracts/PortalRebuildMapping.ts";
import type { PlanDirectory } from "../../../../../../src/contracts/PortalRebuildMapping.ts";
import { readUuid } from "../../../../../../src/contracts/ConciergePortalValidation.ts";
import type { AdvisorClientWorkspaceController, AdvisorClientWorkspaceDirectory, AdvisorClientWorkspaceOptions, AdvisorClientWorkspaceState } from "./types.ts";

type ReadOperation = { kind: "read"; cursor: string | null; base: AdvisorClientWorkspaceDirectory | null; seen: Set<string>; abort: AbortController };
type Operation = ReadOperation | { kind: "connection"; abort: AbortController };
const limit = 25;

/** Read-only, route-owned presentation. Client identity is correlation, never authority. */
export function createAdvisorClientWorkspaceController({ runtime, clientId, readPlans }: AdvisorClientWorkspaceOptions): AdvisorClientWorkspaceController {
  clientId = readUuid(clientId);
  const captured = runtime.getSnapshot().boundary, cookie = runtime.cookie, identity = cookie.identity, view = cookie._view;
  if (!captured || cookie.audience !== "advisor" || identity?.role !== "advisor" || !view)
    throw Error("client workspace unavailable");
  const boundary = captured, actor = identity.ownerId, epoch = cookie._epoch,
    generation = cookie.generation, serverGeneration = view.generation, csrf = view.csrf;
  const blank = (phase: AdvisorClientWorkspaceState["phase"]): AdvisorClientWorkspaceState =>
    Object.freeze({ clientId, phase, directory: null, complete: false, filter: "" });
  let state = blank("idle"), disposed = false, ended = false, reconciling = false;
  let active: Operation | null = null, failed: { cursor: string | null } | null = null;
  let seen = new Set<string>();
  const listeners = new Set<() => void>();
  const same = () => !disposed && !ended && runtime.getSnapshot().boundary === boundary &&
    cookie.audience === "advisor" && cookie.identity?.role === "advisor" && cookie.identity.ownerId === actor &&
    cookie._epoch === epoch && cookie.generation === generation && cookie._view?.generation === serverGeneration && cookie._view?.csrf === csrf;
  const lifetime = () => same() && boundary.isCurrent() && same();
  const ready = () => lifetime() && cookie.status === "ready" && lifetime() && cookie.status === "ready";
  const owns = (op: Operation) => active === op && ready() && active === op;
  function notify(expected: AdvisorClientWorkspaceState) {
    for (const listener of [...listeners]) {
      if (!reconciling) reconcile();
      if (state !== expected || disposed) break;
      if (listeners.has(listener)) { try { listener(); } catch { /* Continue only while this state still owns the view. */ } }
      if (!reconciling) reconcile();
      if (state !== expected || disposed) break;
    }
  }
  function retire() {
    if (ended || disposed) return;
    ended = true;
    const old = active; active = null; failed = null; seen = new Set();
    state = blank("ended"); const next = state;
    old?.abort.abort(); if (state === next) notify(next);
  }
  function reconcile() {
    if (disposed || ended || reconciling) return;
    reconciling = true;
    try {
      if (!lifetime()) { retire(); return; }
      if (cookie.status !== "ready" && state.phase !== "offline") {
        const old = active; active = null; failed = null; seen = new Set();
        state = blank("offline"); const next = state;
        old?.abort.abort(); if (state === next) notify(next);
      }
    } finally { reconciling = false; }
  }
  function emit(patch: Partial<AdvisorClientWorkspaceState>) {
    reconcile(); if (!ready()) return false;
    state = Object.freeze({ ...state, ...patch }); const next = state;
    notify(next); reconcile();
    return state === next && ready();
  }
  function failure(error: unknown, op: ReadOperation) {
    reconcile(); if (!owns(op)) return;
    const status = (error as { status?: number } | null)?.status;
    if (!owns(op)) return;
    if (status === 401) { retire(); return; }
    if (status === 403) {
      failed = { cursor: null }; seen = new Set();
      emit({ phase: "denied", directory: null, complete: false, filter: "" });
    } else {
      failed = { cursor: op.cursor };
      emit({ phase: "error", complete: false });
    }
  }
  async function read(cursor: string | null) {
    reconcile(); if (!ready()) return;
    if (cursor !== null && (!state.directory || cursor !== state.directory.nextCursor)) return;
    const old = active;
    const op: ReadOperation = { kind: "read", cursor, base: cursor === null ? null : state.directory,
      seen: cursor === null ? new Set() : new Set(seen), abort: new AbortController() };
    active = op; failed = null;
    old?.abort.abort();
    if (!owns(op)) return;
    emit({ phase: "loading", complete: false });
    if (!owns(op)) return;
    try {
      const value = await readPlans.execute({ cursor, limit }, { signal: op.abort.signal, isApplicable: () => owns(op) });
      if (!owns(op)) return;
      const page = mapPlanResult(value, { schemaVersion: 1, action: "list_plans_v1", clientId, cursor, limit }) as PlanDirectory;
      if (!owns(op)) return;
      if (page.drafts.some(row => row.clientId !== clientId) || page.publications.some(row => row.clientId !== clientId)) throw Error("unavailable");
      if (page.nextCursor !== null && (page.nextCursor === cursor || op.seen.has(page.nextCursor))) throw Error("unavailable");
      const drafts = [...(op.base?.drafts ?? []), ...page.drafts], publications = [...(op.base?.publications ?? []), ...page.publications];
      if (new Set(drafts.map(row => row.id)).size !== drafts.length ||
        new Set(publications.map(row => row.version)).size !== publications.length) throw Error("unavailable");
      const directory: AdvisorClientWorkspaceDirectory = Object.freeze({ nextCursor: page.nextCursor,
        drafts: Object.freeze(drafts.map(row => Object.freeze({ ...row }))),
        publications: Object.freeze(publications.map(row => Object.freeze({ ...row }))) });
      if (!owns(op)) return;
      if (cursor !== null) op.seen.add(cursor);
      seen = op.seen;
      emit({ phase: "ready", directory, complete: page.nextCursor === null });
    } catch (error) { failure(error, op); }
    finally {
      if (active === op) active = null;
      reconcile();
    }
  }
  const offBoundary = boundary.subscribeInvalidation(retire), offRuntime = runtime.subscribe(reconcile);
  reconcile();
  return {
    getSnapshot() { reconcile(); return state; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    refresh() { return read(null); },
    async loadMore() {
      reconcile(); if (!ready() || active || state.phase !== "ready" || !state.directory?.nextCursor) return;
      await read(state.directory.nextCursor);
    },
    async retry() { reconcile(); if (ready() && !active && failed) await read(failed.cursor); },
    async checkConnection() {
      reconcile(); if (!lifetime() || active) return;
      const op: Operation = { kind: "connection", abort: new AbortController() }; active = op;
      try {
        await runtime.restore();
        if (!owns(op)) return;
        active = null;
        emit({ phase: "idle", directory: null, complete: false });
        if (ready() && !active) await read(null);
      } catch {
        reconcile();
      } finally { if (active === op) active = null; reconcile(); }
    },
    setFilter(value) { reconcile(); if (ready()) emit({ filter: value.slice(0, 200) }); },
    dispose() {
      if (disposed) return;
      disposed = true;
      const old = active; active = null; failed = null; seen = new Set();
      offBoundary(); offRuntime(); state = blank("ended"); old?.abort.abort(); listeners.clear();
    },
  };
}
