import { mapAdmissionReceipt, parseAdmissionCommand } from "../../../../../../src/contracts/ConciergeAdmission.ts";
import type { AdmissionReceipt } from "../../../../../../src/contracts/ConciergeAdmission.ts";
import type { AddClientCommand, AdvisorAdmissionController, AdvisorAdmissionOptions, AdvisorAdmissionState } from "./types.ts";
const key = "advisor.admission.v1";
const blankFields = () => Object.freeze({ email: "", displayName: "" });
const blank = (): AdvisorAdmissionState => Object.freeze({ phase: "idle", canAddClient: null,
  fields: blankFields(), confirmation: null, pending: null, recovery: null, receipt: null, busy: null, message: null });
type Stored = { owner: object; fields: AdvisorAdmissionState["fields"]; pending: Readonly<AddClientCommand> | null; rejected: boolean };
type Operation = { abort: AbortController; kind: NonNullable<AdvisorAdmissionState["busy"]> };

/** Presentation and immutable original custody only. Actual admission authority,
 * identity creation and receipt journal remain in the fixed server operation. */
export function createAdvisorAdmissionController({ runtime, ports }: AdvisorAdmissionOptions): AdvisorAdmissionController {
  const capturedBoundary = runtime.getSnapshot().boundary, cookie = runtime.cookie;
  if (!capturedBoundary || cookie.audience !== "advisor" || cookie.identity?.role !== "advisor")
    throw Error("admission session unavailable");
  const boundary = capturedBoundary;
  const actor = cookie.identity.ownerId, epoch = cookie._epoch,
    generation = cookie.generation, serverGeneration = cookie._view?.generation,
    owner = Object.freeze({}), listeners = new Set<() => void>();
  const prior = boundary.memory.get<Stored>(key);
  // Only completed, canonical conflicts from an otherwise certain original can
  // qualify. An unknown earlier attempt may still arrive after a status read.
  let rejected = prior?.pending !== null && prior?.rejected === true;
  let state: AdvisorAdmissionState = Object.freeze({ ...blank(), fields: prior?.fields ?? blankFields(),
    pending: prior?.pending ?? null, recovery: prior?.pending ? "unresolved" : null,
    message: prior?.pending ? "the original add still needs confirmation." : null });
  let disposed = false, ended = false, reconciling = false, active: Operation | null = null;
  const same = () => !disposed && !ended && runtime.getSnapshot().boundary === boundary &&
    cookie.audience === "advisor" && cookie.identity?.role === "advisor" && cookie.identity.ownerId === actor &&
    cookie._epoch === epoch && cookie.generation === generation && cookie._view?.generation === serverGeneration;
  const lifetime = () => same() && boundary.isCurrent() && same();
  const mine = () => lifetime() && boundary.memory.get<Stored>(key)?.owner === owner && lifetime();
  const ready = () => mine() && cookie.status === "ready" && mine() && cookie.status === "ready";
  function remember() {
    if (!mine()) return false;
    try { boundary.memory.set(key, Object.freeze({ owner, fields: state.fields, pending: state.pending, rejected })); }
    catch { retire(); return false; }
    return mine();
  }
  function notify(expected: AdvisorAdmissionState) {
    for (const listener of [...listeners]) {
      if (!reconciling) reconcile();
      if (state !== expected) break;
      try { listener(); } catch { /* A view cannot change the recorded result. */ }
      if (!reconciling) reconcile();
      if (state !== expected || disposed) break;
    }
  }
  function retire() {
    if (ended || disposed) return;
    ended = true;
    const old = active; active = null;
    state = Object.freeze({ ...blank(), phase: "ended" });
    if (boundary.memory.get<Stored>(key)?.owner === owner) boundary.memory.delete(key);
    old?.abort.abort();
    notify(state);
  }
  function reconcile() {
    if (disposed || ended || reconciling) return;
    reconciling = true;
    try {
      if (!mine()) { retire(); return; }
      if (cookie.status !== "ready" && state.phase !== "offline") {
        const old = active; active = null;
        state = Object.freeze({ ...state, phase: "offline", canAddClient: null, confirmation: null,
          receipt: null, recovery: state.pending ? "unresolved" : null, busy: null,
          message: "restore the connection before checking the original add." });
        const hidden = state;
        remember(); old?.abort.abort(); if (state === hidden) notify(hidden);
      }
    } finally { reconciling = false; }
  }
  function emit(patch: Partial<AdvisorAdmissionState>) {
    reconcile(); if (!ready()) return false;
    state = Object.freeze({ ...state, ...patch }); const next = state;
    if (!remember()) return false;
    if (!ready()) { reconcile(); return false; }
    notify(next); reconcile();
    return state === next && ready();
  }
  function start(kind: Operation["kind"]): Operation | null {
    reconcile(); if (!ready() || active) return null;
    const op = { kind, abort: new AbortController() }; active = op;
    if (!emit({ busy: kind, message: null }) || active !== op) return null;
    return op;
  }
  const owns = (op: Operation) => mine() && active === op;
  const finish = (op: Operation) => {
    reconcile(); if (active !== op) return;
    active = null; if (ready()) emit({ busy: null });
  };
  function failure(error: unknown, op: Operation, command?: Readonly<AddClientCommand>, mayCorrect = false) {
    reconcile(); if (!owns(op)) return;
    const status = (error as { status?: number } | null)?.status;
    const code = (error as { code?: string } | null)?.code;
    if (!owns(op)) return;
    if (status === 401) { retire(); return; }
    if (command && state.pending === command && ready()) {
      if (op.kind === "add" && status === 409 && code === "concierge_admission_conflict" && mayCorrect) {
        rejected = true;
      } else if (op.kind === "status" && status === 404 && code === "concierge_admission_not_found" && rejected) {
        emit({ phase: "ready", recovery: "rejected_no_intent", confirmation: null, receipt: null,
          message: "the original add was rejected and no add is recorded. review and correct the client details." });
        return;
      }
    }
    if (status === 403) emit({ phase: "denied", canAddClient: false, confirmation: null, receipt: null,
      message: "client admission is unavailable with current access. the original add is kept for this session." });
    else emit({ phase: "error", confirmation: null, receipt: null,
      message: state.pending ? "the original add still needs confirmation. check its status or retry the same add." : "client admission is unavailable. try checking access again." });
  }
  function receiptFor(raw: unknown, command: Readonly<AddClientCommand>): Readonly<AdmissionReceipt> {
    const receipt = mapAdmissionReceipt(raw);
    if (receipt.requestId !== command.requestId || receipt.email !== command.email) throw Error("unavailable");
    return Object.freeze(receipt);
  }
  async function send(command: Readonly<AddClientCommand>) {
    if (!ready() || state.canAddClient !== true || active) return;
    const mayCorrect = state.pending === null || rejected;
    const op = start("add"); if (!op) return;
    // Persist uncertainty before dispatch, including disposal/offline during it.
    // A retry must never inherit an earlier not-found result.
    rejected = false;
    if (!emit({ pending: command, recovery: "unresolved", confirmation: null, receipt: null }) || !owns(op) || !ready()) return;
    try {
      const value = await ports.add.execute(command, { signal: op.abort.signal, isApplicable: () => owns(op) && ready() });
      if (!owns(op) || !ready()) return;
      const receipt = receiptFor(value, command);
      if (!owns(op) || !ready()) return;
      emit({ phase: "ready", receipt, pending: null, recovery: null, message: null });
    } catch (error) { failure(error, op, command, mayCorrect); } finally { finish(op); }
  }
  try {
    if (lifetime()) boundary.memory.set(key, Object.freeze({ owner, fields: state.fields, pending: state.pending, rejected }));
    else retire();
  } catch { retire(); }
  const offBoundary = boundary.subscribeInvalidation(retire), offRuntime = runtime.subscribe(reconcile);
  return {
    getSnapshot() { reconcile(); return state; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async refreshCapabilities() {
      reconcile(); if (!ready() || active) return;
      const op = start("capabilities"); if (!op) return;
      if (!emit({ phase: "loading", canAddClient: null, confirmation: null, receipt: null }) || !owns(op)) return;
      try {
        const value = await ports.capabilities.execute({ action: "capabilities" }, { signal: op.abort.signal, isApplicable: () => owns(op) && ready() });
        if (!owns(op) || !ready()) return;
        const canAddClient = value?.canAddClient;
        if (!owns(op) || !ready()) return;
        if (typeof canAddClient !== "boolean") throw Error("unavailable");
        emit({ phase: canAddClient ? "ready" : "denied", canAddClient });
      } catch (error) { failure(error, op); } finally { finish(op); }
    },
    async checkConnection() {
      reconcile(); if (!mine() || active) return;
      const op: Operation = { kind: "connection", abort: new AbortController() }; active = op;
      // A lifetime-current offline session can restore only its ordinary login.
      try {
        await runtime.restore();
        if (!owns(op) || !ready()) return;
        emit({ phase: "idle", canAddClient: null, confirmation: null, receipt: null, message: null });
      } catch (error) { failure(error, op); } finally { finish(op); }
    },
    editFields(patch) {
      reconcile(); if (!ready() || state.canAddClient !== true || state.pending || state.receipt || active) return;
      emit({ fields: Object.freeze({ ...state.fields, ...patch }), confirmation: null, message: null });
    },
    prepare() {
      reconcile(); if (!ready() || state.canAddClient !== true || state.pending || state.receipt || active) return;
      try {
        const command = parseAdmissionCommand({ action: "add_client", requestId: crypto.randomUUID(), ...state.fields });
        if (!ready()) return;
        if (command.action !== "add_client") throw Error("unavailable");
        emit({ confirmation: Object.freeze(command), fields: Object.freeze({ email: command.email, displayName: command.displayName }), message: null });
      } catch { if (ready()) emit({ message: "check the client name and email before continuing." }); }
    },
    backToFields() { reconcile(); if (ready() && !state.pending && !active) emit({ confirmation: null }); },
    async confirm() { reconcile(); const command = state.confirmation; if (!command || state.pending) return; await send(command); },
    async checkStatus() {
      reconcile(); const command = state.pending;
      if (!command || !ready() || state.canAddClient !== true || active) return;
      const op = start("status"); if (!op) return;
      try {
        const result = await ports.status.execute({ action: "admission_status", requestId: command.requestId }, { signal: op.abort.signal, isApplicable: () => owns(op) && ready() });
        if (!owns(op) || !ready() || state.pending !== command) return;
        if (result.requestId !== command.requestId) throw Error("unavailable");
        if (result.status === "pending" && result.client === null) {
          rejected = false;
          emit({ phase: "ready", recovery: "unresolved", message: "the original add is pending. retry the same add to continue." });
        }
        else if (result.status === "ready") {
          const receipt = receiptFor(result.client, command);
          if (owns(op) && ready() && state.pending === command) {
            rejected = false;
            emit({ phase: "ready", receipt, pending: null, recovery: null, message: null });
          }
        } else throw Error("unavailable");
      } catch (error) { failure(error, op, command); } finally { finish(op); }
    },
    async retry() { reconcile(); const command = state.pending; if (command) await send(command); },
    correctDetails() {
      reconcile();
      if (!ready() || state.canAddClient !== true || active || !state.pending || state.recovery !== "rejected_no_intent") return;
      rejected = false;
      emit({ phase: "ready", pending: null, recovery: null, confirmation: null, receipt: null, message: null });
    },
    addAnother() { reconcile(); if (ready() && !state.pending && !active) emit({ fields: blankFields(), receipt: null, confirmation: null, message: null }); },
    dispose() {
      if (disposed) return;
      disposed = true; const old = active; active = null;
      offBoundary(); offRuntime(); state = Object.freeze({ ...blank(), phase: "ended" });
      old?.abort.abort(); listeners.clear();
    },
  };
}
