import { readUuid, readObject, exactKeys } from "../../../../../../src/contracts/ConciergePortalValidation.ts";
import { readUnpublishedPreview } from "../../plan/preview.ts";
import type { PlanPreviewSource } from "../../plan/preview.ts";
import type { PlanPreview } from "../../../../../../src/contracts/PortalRebuildMapping.ts";
import type { PlanContent } from "../../../../../../src/contracts/PortalRebuild.ts";
import { assertDraft, sameTarget } from "../model.ts";
import type { AdvisorInlinePreviewController, AdvisorInlinePreviewOptions, AdvisorInlinePreviewState } from "./types.ts";

type Basis = { source: PlanPreviewSource; hash: string; local: PlanContent | null };
type Operation = { abort: AbortController; basis: Basis | null; kind: "read" | "connection" };
const emptyInput: Readonly<Record<string, never>> = Object.freeze({});
const sameSource = (a: PlanPreviewSource, b: PlanPreviewSource) => a.draftId === b.draftId &&
  a.contentRevision === b.contentRevision && a.assignmentRevision === b.assignmentRevision &&
  (a.target === null ? b.target === null : sameTarget(a.target, b.target));
const sameBasis = (a: Basis | null | undefined, b: Basis | null) => a === null ? b === null :
  !!a && !!b && a.hash === b.hash && a.local === b.local && sameSource(a.source, b.source);
function freeze<T>(value: T): T {
  if (value && typeof value === "object") { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}

/** Local read/presentation custody only. W0 supplies the fixed real read port;
 * existing loadPreview/validators and the shared renderer remain authoritative. */
export function createAdvisorInlinePreviewController({ runtime, advisor, draftId, read }: AdvisorInlinePreviewOptions): AdvisorInlinePreviewController {
  draftId = readUuid(draftId).toLowerCase();
  const captured = runtime.getSnapshot().boundary, cookie = runtime.cookie, identity = cookie.identity, view = cookie._view;
  if (!captured || cookie.audience !== "advisor" || identity?.role !== "advisor" || !view) throw Error("preview session unavailable");
  const boundary = captured, actor = identity.ownerId, epoch = cookie._epoch,
    generation = cookie.generation, serverGeneration = view.generation, csrf = view.csrf;
  let state: AdvisorInlinePreviewState = Object.freeze({ phase: "idle", source: null, record: null });
  let disposed = false, ended = false, reconciling = false, active: Operation | null = null;
  let observed: Basis | null | undefined;
  const listeners = new Set<() => void>();
  const same = () => !disposed && !ended && runtime.getSnapshot().boundary === boundary && cookie.audience === "advisor" &&
    cookie.identity?.role === "advisor" && cookie.identity.ownerId === actor && cookie._epoch === epoch &&
    cookie.generation === generation && cookie._view?.generation === serverGeneration && cookie._view?.csrf === csrf;
  const lifetime = () => same() && boundary.isCurrent() && same();
  const ready = () => lifetime() && cookie.status === "ready" && cookie._view?.capabilities.view === true &&
    advisor.permissions.actorId === actor && advisor.permissions.view && lifetime() && cookie.status === "ready";
  function basis(): Basis | null {
    const s = advisor.getSnapshot();
    if (s.ended || !s.view || !s.local || s.view.draft.id !== draftId || s.view.draft.state !== "working" ||
      s.pending || s.busy || s.receipt || s.needsComparison || s.notice?.kind === "conflict" || advisor.dirty()) return null;
    try {
      assertDraft(s.view);
      return { source: freeze({ draftId, contentRevision: s.view.draft.contentRevision,
        assignmentRevision: s.view.draft.assignmentRevision, target: structuredClone(s.view.target) }),
        hash: s.view.draft.contentHash, local: s.local };
    } catch { return null; }
  }
  function notify(expected: AdvisorInlinePreviewState) {
    for (const listener of [...listeners]) {
      if (!reconciling) reconcile();
      if (state !== expected || disposed) break;
      if (listeners.has(listener)) { try { listener(); } catch { /* A view cannot own another read. */ } }
      if (!reconciling) reconcile();
      if (state !== expected || disposed) break;
    }
  }
  function reset(phase: AdvisorInlinePreviewState["phase"], source: PlanPreviewSource | null = null, preserveConnection = false) {
    const old = active, keep = preserveConnection && old?.kind === "connection";
    if (!keep) active = null;
    state = Object.freeze({ phase, source, record: null }); const next = state;
    if (!keep) old?.abort.abort();
    if (state === next) notify(next);
  }
  function retire() {
    if (disposed || ended) return;
    ended = true; observed = null; reset("ended");
  }
  function reconcile() {
    if (disposed || ended || reconciling) return;
    reconciling = true;
    try {
      if (!lifetime() || advisor.getSnapshot().ended || advisor.permissions.actorId !== actor) { retire(); return; }
      if (cookie.status !== "ready") {
        observed = undefined;
        if (state.phase !== "offline" || state.record) reset("offline");
        return;
      }
      if (!ready()) {
        observed = undefined;
        if (state.phase !== "denied" || state.record) reset("denied");
        return;
      }
      const next = basis();
      if (!ready()) { observed = undefined; reset(cookie.status === "ready" ? "denied" : "offline"); return; }
      if (!read) {
        observed = next;
        if (state.phase !== "unavailable") reset("unavailable");
      } else if (!sameBasis(observed, next)) {
        observed = next; reset(next ? "idle" : "stale", next?.source ?? null, true);
      }
    } finally { reconciling = false; }
  }
  const owns = (op: Operation) => active === op && ready() && active === op && sameBasis(op.basis, basis()) && ready();
  function emit(patch: Partial<AdvisorInlinePreviewState>) {
    reconcile(); if (!ready()) return;
    state = Object.freeze({ ...state, ...patch }); const next = state;
    notify(next); reconcile();
  }
  async function refresh() {
    reconcile(); if (!read || !ready()) return;
    const capturedBasis = basis(); if (!capturedBasis) return;
    const old = active, op: Operation = { kind: "read", abort: new AbortController(), basis: capturedBasis };
    active = op; old?.abort.abort();
    if (!owns(op)) return;
    emit({ phase: "loading", source: capturedBasis.source, record: null });
    if (!owns(op)) return;
    try {
      const raw = await read.execute(emptyInput, { signal: op.abort.signal, isApplicable: () => owns(op) });
      if (!owns(op)) return;
      const value = readObject(raw); exactKeys(value, ["preview", "source", "sessionKey"]);
      const sessionKey = value.sessionKey;
      if (!owns(op)) return;
      if (sessionKey !== boundary.key) throw Error("preview unavailable");
      const decoded = readUnpublishedPreview(value.preview as PlanPreview, value.source as PlanPreviewSource);
      if (!owns(op)) return;
      if (!sameSource(decoded.source, capturedBasis.source)) throw Error("stale preview");
      const record = freeze({ preview: decoded.preview, source: decoded.source, sessionKey: boundary.key });
      if (!owns(op)) return;
      emit({ phase: "ready", source: record.source, record });
    } catch (error) {
      reconcile(); if (!owns(op)) return;
      const status = (error as { status?: number } | null)?.status;
      if (!owns(op)) return;
      if (status === 401) retire();
      else emit({ phase: status === 403 ? "denied" : "error", record: null,
        ...(status === 403 ? { source: null } : {}) });
    } finally { if (active === op) active = null; reconcile(); }
  }
  const offBoundary = boundary.subscribeInvalidation(retire), offRuntime = runtime.subscribe(reconcile), offAdvisor = advisor.subscribe(reconcile);
  reconcile();
  return {
    session: boundary,
    getSnapshot() { reconcile(); return state; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    refresh,
    async checkConnection() {
      reconcile(); if (!lifetime() || active) return;
      const op: Operation = { kind: "connection", basis: null, abort: new AbortController() }; active = op;
      try {
        await runtime.restore();
        if (active !== op || !ready()) return;
        active = null;
        await refresh();
      } catch { reconcile(); }
      finally { if (active === op) active = null; reconcile(); }
    },
    dispose() {
      if (disposed) return;
      disposed = true; const old = active; active = null; observed = null;
      offBoundary(); offRuntime(); offAdvisor(); state = Object.freeze({ phase: "ended", source: null, record: null });
      old?.abort.abort(); listeners.clear();
    },
  };
}
