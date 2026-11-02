import type { AdvisorGuidanceContext } from "../../../app/advisor-guidance-context.ts";
import type { ApplicationSession } from "../../../app/session.ts";
import { TransportError } from "../../../transport/session.ts";
import { createAdvisorGuidanceAdapters } from "./adapters.ts";
import type {
  AdvisorGuidanceSelection,
  AdvisorGuidanceOptions,
  AdvisorReviewCommand,
  GuidanceDependencyRequest,
} from "./types.ts";
import { guidanceDependencies } from "./types.ts";
import type {
  AdvisorCareHistoryEntry,
  AdvisorCareHistoryPage,
  AdvisorPublicationViewV3,
  GuidanceDraftView,
  GuidanceReadSnapshot,
  GuidanceBody,
  GuidanceCommand,
  GuidanceWriteResult,
  ReviewWriteResult,
  ConversationBody,
  PrivateNoteSubject,
  InstructionManifestPage,
  InstructionManifestEntry,
  InstructionDetail,
} from "../../../../../../src/contracts/PortalReview.ts";
import type { ReportedProductUse } from "../../../../../../src/contracts/PortalCare.ts";
import { sameCareValue } from "../../../../../../src/contracts/PortalCareValidation.ts";
import {
  readGuidanceCommand,
  readReviewCommand,
} from "../../../../../../src/contracts/PortalReviewValidation.ts";
import {
  mapGuidanceResult,
  mapReviewResult,
  collectInstructionManifest,
  bindInstructionForScope,
} from "../../../../../../src/contracts/PortalReviewMapping.ts";
import { appendGuidanceHistory, guidanceEvidence } from "./evidence.ts";

export type GuidanceAction =
  | "save"
  | "create"
  | "review"
  | "rebase"
  | "approve"
  | "publish"
  | "revoke"
  | "conversation"
  | "private_note";
type Family = "review" | "guidance";
type Write = Exclude<
  Extract<GuidanceCommand | AdvisorReviewCommand, { requestId: string }>,
  { action: "request_status_v1" }
>;
type Pending = {
  family: Family;
  command: Write;
  selection: AdvisorGuidanceSelection;
  state: "sending" | "uncertain";
  wire: string;
  readSnapshot: GuidanceReadSnapshot | null;
};
type Lane =
  | "publication"
  | "history"
  | "draft"
  | "reported"
  | "instructions"
  | "status"
  | "write"
  | "connection"
  | "authority";
type HistoryState = {
  entries: AdvisorCareHistoryEntry[];
  heads: AdvisorCareHistoryPage["heads"] | null;
  nextCursor: string | null;
  complete: boolean;
  error: string | null;
  seenCursors: string[];
};
export interface AdvisorGuidanceState {
  selection: AdvisorGuidanceSelection | null;
  publication: AdvisorPublicationViewV3 | null;
  publicationCurrent: boolean;
  history: HistoryState;
  reported: {
    items: ReportedProductUse[];
    nextCursor: string | null;
    complete: boolean;
    error: string | null;
  };
  instructions: {
    pages: InstructionManifestPage[];
    items: InstructionManifestEntry[];
    details: InstructionDetail[];
    nextCursor: string | null;
    complete: boolean;
    error: string | null;
  };
  draft: GuidanceDraftView | null;
  draftCurrent: boolean;
  body: GuidanceBody | null;
  dirty: boolean;
  busy: Lane[];
  notice: string | null;
  saveState: "idle" | "saving" | "saved" | "error" | "uncertain";
  pending: {
    family: Family;
    action: Write["action"];
    requestId: string;
    state: Pending["state"];
  } | null;
  conflict: {
    state: "needs_refresh" | "current_displayed";
    base: GuidanceDraftView | null;
    latest: GuidanceDraftView | null;
  } | null;
  acknowledged: boolean;
  evidenceComplete: boolean;
  evidenceReasons: string[];
  missing: GuidanceDependencyRequest[];
  lastReceipt: {
    action: string;
    requestId: string;
    recordedAt: string | null;
  } | null;
  ended: boolean;
  connection: string;
  privateDenied: boolean;
  authorityContext: AdvisorGuidanceContext | null;
  contextStatus: "unavailable" | "loading" | "ready";
}
const emptyHistory = (): HistoryState => ({
  entries: [],
  heads: null,
  nextCursor: null,
  complete: false,
  error: null,
  seenCursors: [],
});
const emptyInstructions = (): AdvisorGuidanceState["instructions"] => ({
  pages: [],
  items: [],
  details: [],
  nextCursor: null,
  complete: false,
  error: null,
});
const emptyReported = (): AdvisorGuidanceState["reported"] => ({
  items: [],
  nextCursor: null,
  complete: false,
  error: null,
});
const initial = (): AdvisorGuidanceState => ({
  selection: null,
  publication: null,
  publicationCurrent: false,
  history: emptyHistory(),
  reported: emptyReported(),
  instructions: emptyInstructions(),
  draft: null,
  draftCurrent: false,
  body: null,
  dirty: false,
  busy: [],
  notice: null,
  saveState: "idle",
  pending: null,
  conflict: null,
  acknowledged: false,
  evidenceComplete: false,
  evidenceReasons: [],
  missing: [],
  lastReceipt: null,
  ended: false,
  connection: "ready",
  privateDenied: false,
  authorityContext: null,
  contextStatus: "unavailable",
});
const detached = <T>(value: T): T => structuredClone(value);
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function assert(value: unknown): asserts value {
  if (!value) throw new TransportError(503);
}

/** Creation-bound, memory-only source module. Parent owns mounting and routes. */
export function createAdvisorGuidanceController({
  runtime,
  context: contextPort,
}: AdvisorGuidanceOptions) {
  const adapters = createAdvisorGuidanceAdapters(runtime),
    boundary = runtime.getSnapshot().boundary;
  const parked = new Map<string, Pending>();
  const listeners = new Set<() => void>(),
    aborters = new Map<Lane, AbortController>(),
    laneVersions = new Map<Lane, number>();
  let state = freeze(initial()),
    disposed = false,
    context = 0,
    manual = 0,
    authority = 0,
    pending: Pending | null = null;
  let evidenceGeneration = 0;
  let dispatchOwner: Pending | null = null;
  let activeWrite: {
    intent: Pending;
    cancel(): boolean;
    mayHaveDispatched: boolean;
    retry: boolean;
    readGeneration: number | null;
  } | null = null;
  let contextStamp: {
    selection: AdvisorGuidanceSelection | null;
    draft: GuidanceDraftView | null;
    body: GuidanceBody | null;
    publication: AdvisorPublicationViewV3 | null;
    history: HistoryState;
    reported: AdvisorGuidanceState["reported"];
    instructions: AdvisorGuidanceState["instructions"];
    manual: number;
    authority: number;
    pending: Pending | null;
  } | null = null;
  const capabilityWire = () =>
    JSON.stringify(runtime.cookie._view?.capabilities ?? null);
  let capabilities = capabilityWire();
  const current = () =>
    !disposed &&
    adapters.isCurrent() &&
    runtime.getSnapshot().boundary === boundary;
  const caps = () => runtime.cookie._view?.capabilities;
  function readGeneration(): number | null {
    try {
      const value = contextPort?.getReadGeneration?.();
      return typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= 0
        ? value
        : null;
    } catch {
      return null;
    }
  }
  const dayFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // A notification/abort can synchronously start another public operation.
  // This is local continuation ownership, never a permission or read grant.
  function continuation() {
    const own = {
      disposed,
      context,
      manual,
      authority,
      evidenceGeneration,
      pending,
      activeWrite,
      dispatchOwner,
      selection: state.selection,
      publication: state.publication,
      publicationCurrent: state.publicationCurrent,
      draft: state.draft,
      body: state.body,
      ended: state.ended,
      capabilities: capabilityWire(),
      boundary: runtime.getSnapshot().boundary,
      owner: runtime.cookie.identity?.ownerId,
      role: runtime.cookie.identity?.role,
      epoch: runtime.cookie._epoch,
      generation: runtime.cookie.generation,
      csrf: runtime.cookie._view?.csrf,
      status: runtime.cookie.status,
      readGeneration: readGeneration(),
      versions: [...laneVersions],
      controllers: [...aborters],
    };
    return () => {
      try {
        return (
          disposed === own.disposed &&
          context === own.context &&
          manual === own.manual &&
          authority === own.authority &&
          evidenceGeneration === own.evidenceGeneration &&
          pending === own.pending &&
          activeWrite === own.activeWrite &&
          dispatchOwner === own.dispatchOwner &&
          state.selection === own.selection &&
          state.publication === own.publication &&
          state.publicationCurrent === own.publicationCurrent &&
          state.draft === own.draft &&
          state.body === own.body &&
          state.ended === own.ended &&
          capabilityWire() === own.capabilities &&
          runtime.getSnapshot().boundary === own.boundary &&
          runtime.cookie.identity?.ownerId === own.owner &&
          runtime.cookie.identity?.role === own.role &&
          runtime.cookie._epoch === own.epoch &&
          runtime.cookie.generation === own.generation &&
          runtime.cookie._view?.csrf === own.csrf &&
          runtime.cookie.status === own.status &&
          readGeneration() === own.readGeneration &&
          laneVersions.size === own.versions.length &&
          own.versions.every(
            ([lane, version]) => laneVersions.get(lane) === version,
          ) &&
          aborters.size === own.controllers.length &&
          own.controllers.every(
            ([lane, controller]) => aborters.get(lane) === controller,
          )
        );
      } catch {
        return false;
      }
    };
  }
  function update(patch: Partial<AdvisorGuidanceState>) {
    const next = { ...state, ...patch };
    next.connection = next.ended ? "ended" : runtime.cookie.status;
    const basis = next.draft?.currentBasis ?? null;
    const evidence = guidanceEvidence(next, basis);
    next.evidenceComplete =
      next.publicationCurrent && next.draftCurrent && evidence.complete;
    if (!next.publicationCurrent && next.publication)
      evidence.reasons.push(
        "current publication could not be refreshed. retry before reviewing.",
      );
    next.evidenceReasons = evidence.reasons;
    next.missing = [
      ...evidence.missing,
      ...(next.authorityContext &&
      contextPort?.isCurrent(next.authorityContext) &&
      readGeneration() !== null
        ? []
        : [guidanceDependencies.find((d) => d.kind === "guidance_authority")!]),
    ];
    next.pending = pending
      ? {
          family: pending.family,
          action: pending.command.action,
          requestId: pending.command.requestId,
          state: pending.state,
        }
      : null;
    state = freeze(next);
  }
  function emit(patch: Partial<AdvisorGuidanceState> = {}) {
    update(patch);
    const owns = continuation();
    listeners.forEach((fn) => fn());
    return owns();
  }
  type Retirement = {
    cancel: Array<() => boolean>;
    notify: Array<() => Partial<AdvisorGuidanceState>>;
  };
  function finishRetirement(work: Retirement, owns = true) {
    // All targets are captured/detached before the first callback. Continue
    // cancelling only those old targets even if an earlier callback selects B.
    for (const cancel of work.cancel) if (!cancel()) owns = false;
    if (!owns) return false;
    for (const patch of work.notify) if (!emit(patch())) return false;
    return true;
  }
  function prepareWrite(preserve?: Pending): Retirement {
    const work: Retirement = { cancel: [], notify: [] };
    const operation = activeWrite;
    if (!operation || operation.intent === preserve) return work;
    activeWrite = null;
    work.cancel.push(operation.cancel);
    if (pending !== operation.intent) return work;
    if (operation.retry || operation.mayHaveDispatched) {
      operation.intent.state = "uncertain";
      work.notify.push(() => ({
        saveState: "uncertain",
        draftCurrent: false,
        notice: "the result is uncertain. check its status before retrying.",
      }));
    } else {
      // The fixed raw factories await cookie acquisition before write egress.
      // A cancellation in the initial JS turn is therefore known unsent.
      pending = null;
      work.notify.push(() => ({
        saveState: "idle",
        notice:
          "the action was cancelled before it was sent. refresh the current information before trying again.",
      }));
    }
    return work;
  }
  function retireWrite(preserve?: Pending) {
    return finishRetirement(prepareWrite(preserve));
  }
  function prepareAuthority(preserveWrite?: Pending): Retirement {
    if (!preserveWrite) evidenceGeneration++;
    contextPort?.invalidate();
    // Capture only the operation's OWN invalidation, before abort listeners,
    // state emissions, subscribers, or any other external callback can run.
    if (preserveWrite && activeWrite?.intent === preserveWrite)
      activeWrite.readGeneration = readGeneration();
    contextStamp = null;
    const target = aborters.get("authority");
    aborters.delete("authority");
    laneVersions.set("authority", (laneVersions.get("authority") ?? 0) + 1);
    update({
      authorityContext: null,
      contextStatus: "unavailable",
      acknowledged: false,
    });
    const work = prepareWrite(preserveWrite);
    if (target)
      work.cancel.push(() => {
        const owns = continuation();
        target.abort();
        return owns();
      });
    work.notify.push(() => ({
      authorityContext: null,
      contextStatus: "unavailable",
      busy: state.busy.filter((x) => x !== "authority"),
      acknowledged: false,
    }));
    return work;
  }
  function retireAuthority(preserveWrite?: Pending) {
    return finishRetirement(prepareAuthority(preserveWrite));
  }
  function authorityCurrent(
    own: Pending | undefined = dispatchOwner ?? undefined,
  ): boolean {
    const value = state.authorityContext,
      stamp = contextStamp;
    return (
      !!value &&
      !!stamp &&
      !!contextPort?.isCurrent(value) &&
      state.selection === stamp.selection &&
      state.draft === stamp.draft &&
      state.body === stamp.body &&
      state.publication === stamp.publication &&
      state.history === stamp.history &&
      state.reported === stamp.reported &&
      state.instructions === stamp.instructions &&
      manual === stamp.manual &&
      authority === stamp.authority &&
      (pending === stamp.pending ||
        (own !== undefined && pending === own && stamp.pending === null)) &&
      !!state.draft &&
      sameCareValue(value.request.target, state.draft.target) &&
      sameCareValue(value.draft.body, state.body) &&
      sameCareValue(
        value.request.snapshot,
        state.publication?.currentGuidance.snapshot,
      ) &&
      value.request.publisher.actorId === runtime.cookie.identity?.ownerId &&
      value.request.scope === `${state.draft.target.kind}.publish`
    );
  }
  function prepareAll(): Retirement {
    const targets = [...aborters.values()];
    aborters.clear();
    laneVersions.forEach((n, k) => laneVersions.set(k, n + 1));
    const work = prepareWrite();
    work.cancel.push(
      ...targets.map((target) => () => {
        const owns = continuation();
        target.abort();
        return owns();
      }),
    );
    return work;
  }
  function cancelAll() {
    return finishRetirement(prepareAll());
  }
  function preparePrivate(ended = false) {
    const authorityWork = prepareAuthority();
    if (ended) {
      parked.clear();
      dispatchOwner = null;
    }
    authority++;
    manual++;
    const cancelled = prepareAll();
    const patch: Partial<AdvisorGuidanceState> = {
      draft: null,
      body: null,
      draftCurrent: false,
      dirty: false,
      history: emptyHistory(),
      conflict: null,
      acknowledged: false,
      busy: [],
      privateDenied: !ended,
      ...(ended
        ? {
            publication: null,
            publicationCurrent: false,
            reported: emptyReported(),
            instructions: emptyInstructions(),
            ended: true,
            lastReceipt: null,
            saveState: "idle",
          }
        : {}),
    };
    // Clear the owning projection before abort/subscriber callbacks, retaining
    // the intermediate error status until the existing final notification.
    update({
      ...patch,
      busy: state.busy,
      history: { ...emptyHistory(), error: state.history.error },
    });
    return {
      work: {
        cancel: [...authorityWork.cancel, ...cancelled.cancel],
        notify: [...authorityWork.notify, ...cancelled.notify],
      },
      patch,
    };
  }
  function finishPrivate(
    prepared: ReturnType<typeof preparePrivate>,
    owns = true,
  ) {
    if (!finishRetirement(prepared.work, owns)) return false;
    return emit(prepared.patch);
  }
  function clearPrivate(ended = false) {
    return finishPrivate(preparePrivate(ended));
  }
  function reconcile() {
    if (disposed) return false;
    if (!current()) {
      pending = null;
      context++;
      clearPrivate(true);
      return false;
    }
    if (state.connection !== runtime.cookie.status && !emit({})) return false;
    const next = capabilityWire();
    if (next !== capabilities) {
      capabilities = next;
      if (!retireAuthority()) return false;
      authority++;
      context++;
      if (!cancelAll()) return false;
      if (!caps()?.edit && !clearPrivate()) return false;
      return emit({
        busy: [],
        acknowledged: false,
        draftCurrent: false,
        ...(!caps()?.view
          ? {
              publication: null,
              publicationCurrent: false,
              reported: emptyReported(),
              instructions: emptyInstructions(),
            }
          : {}),
        notice: "access changed. refresh the information available to you.",
      });
    }
    return true;
  }
  const unsubscribe = runtime.subscribe(reconcile),
    unend = boundary?.subscribeInvalidation(() => {
      if (!disposed) {
        pending = null;
        context++;
        clearPrivate(true);
      }
    });
  function permitted(right: "view" | "edit" | "publish") {
    if (!reconcile()) return false;
    return (
      current() &&
      !state.ended &&
      runtime.cookie.status === "ready" &&
      caps()?.[right] === true
    );
  }
  function capture(lane: Lane) {
    const reconciled = reconcile();
    const prior = aborters.get(lane);
    const controller = new AbortController(),
      version = (laneVersions.get(lane) ?? 0) + 1;
    if (reconciled && current()) {
      laneVersions.set(lane, version);
      aborters.set(lane, controller);
    } else controller.abort();
    const expected = {
      context,
      manual,
      authority,
      pending,
      selection: state.selection,
      publication: state.publication,
      publicationCurrent: state.publicationCurrent,
      capabilities,
      evidenceGeneration,
    };
    const lease = {
      signal: controller.signal,
      cancel() {
        const owned =
          laneVersions.get(lane) === version &&
          aborters.get(lane) === controller;
        if (owned) {
          aborters.delete(lane);
          laneVersions.set(lane, version + 1);
        }
        const owns = continuation();
        controller.abort();
        if (!owns()) return false;
        return !owned || emit({ busy: state.busy.filter((x) => x !== lane) });
      },
      owns() {
        return (
          current() &&
          !controller.signal.aborted &&
          laneVersions.get(lane) === version &&
          context === expected.context &&
          manual === expected.manual &&
          authority === expected.authority &&
          state.selection === expected.selection &&
          capabilityWire() === expected.capabilities
        );
      },
      valid() {
        return (
          this.owns() &&
          pending === expected.pending &&
          (lane !== "write" ||
            evidenceGeneration === expected.evidenceGeneration) &&
          (lane === "publication" ||
            lane === "connection" ||
            (state.publication === expected.publication &&
              state.publicationCurrent === expected.publicationCurrent))
        );
      },
      finish() {
        if (this.owns()) {
          aborters.delete(lane);
          emit({ busy: state.busy.filter((x) => x !== lane) });
        }
      },
    };
    if (controller.signal.aborted) return lease;
    if (lane !== "authority" && lane !== "status" && lane !== "write") {
      if (!retireAuthority()) {
        lease.cancel();
        return lease;
      }
      // Only this completed, ownership-checked retirement can change intent.
      // Never adopt a new selection/manual owner after a callback.
      expected.pending = pending;
      expected.evidenceGeneration = evidenceGeneration;
    }
    prior?.abort();
    if (!lease.valid()) {
      lease.cancel();
      return lease;
    }
    if (!emit({ busy: [...new Set([...state.busy, lane])] })) lease.cancel();
    return lease;
  }
  function failure(
    error: unknown,
    privateRead: boolean,
    progress?: Partial<AdvisorGuidanceState>,
  ) {
    const status = (error as { status?: unknown })?.status;
    if (progress) update(progress);
    if (status === 401) {
      pending = null;
      context++;
      const prepared = preparePrivate(true);
      if (!finishPrivate(prepared, !progress || emit({}))) return;
      emit({ notice: "your session has ended. sign in again." });
    } else if (status === 403) {
      const prepared = preparePrivate();
      if (!finishPrivate(prepared, !progress || emit({}))) return;
      if (!privateRead)
        if (
          !emit({
            publication: null,
            publicationCurrent: false,
            reported: emptyReported(),
            instructions: emptyInstructions(),
          })
        )
          return;
      emit({
        notice:
          "access to this information is unavailable. refresh after access is restored.",
      });
    } else {
      if (progress && !emit({})) return;
      emit({
        acknowledged: false,
        notice:
          status === 409
            ? "this information changed. refresh it before continuing."
            : "we could not load this information. try again.",
      });
    }
  }
  function matchesDraft(draft: GuidanceDraftView) {
    const s = state.selection;
    assert(
      s &&
        draft.target.clientId === s.clientId &&
        (!s.draftId || draft.target.draftId === s.draftId) &&
        (!s.kind || draft.target.kind === s.kind),
    );
    if (s.publicationVersion !== null)
      assert(draft.body.publication.version === s.publicationVersion);
    if (state.publication)
      assert(
        sameCareValue(
          draft.body.publication,
          state.publication.currentGuidance.snapshot.publication,
        ),
      );
  }
  async function refreshPublication() {
    if (!permitted("view") || !state.selection) return;
    const selection = state.selection,
      lease = capture("publication");
    try {
      if (!lease.valid()) return;
      if (!emit({ acknowledged: false, publicationCurrent: false })) return;
      const value = await adapters.review.execute(
        {
          schemaVersion: 1,
          action: "read_advisor_publication_v3",
          clientId: selection.clientId,
          version: selection.publicationVersion,
        },
        { signal: lease.signal },
      );
      if (!lease.valid()) return;
      assert(
        "currentGuidance" in value &&
          "clientId" in value &&
          value.clientId === selection.clientId,
      );
      const publication = value as AdvisorPublicationViewV3;
      emit({
        publication,
        publicationCurrent: true,
        reported: {
          items: publication.use.reportedProducts.items,
          nextCursor: publication.use.reportedProducts.nextCursor,
          complete: publication.use.reportedProducts.nextCursor === null,
          error: null,
        },
        instructions: {
          ...emptyInstructions(),
          complete: publication.currentGuidance.instructionCount === 0,
        },
        acknowledged: false,
      });
    } catch (error) {
      if (lease.valid()) failure(error, false);
    } finally {
      lease.finish();
    }
  }
  async function historyRead(more: boolean) {
    if (
      !permitted("edit") ||
      !state.selection ||
      (more && !state.history.nextCursor)
    )
      return;
    const selection = state.selection,
      prior = more ? state.history : emptyHistory(),
      cursor = more ? prior.nextCursor : null,
      lease = capture("history");
    try {
      if (!lease.valid()) return;
      if (
        !emit({
          acknowledged: false,
          history: { ...state.history, complete: false },
        })
      )
        return;
      const value = await adapters.review.execute(
        {
          schemaVersion: 1,
          action: "read_advisor_care_history_v1",
          clientId: selection.clientId,
          version: selection.publicationVersion,
          cursor,
          limit: 25,
        },
        { signal: lease.signal },
      );
      if (!lease.valid()) return;
      assert(
        "audience" in value &&
          value.audience === "advisor" &&
          "entries" in value,
      );
      const page = value as AdvisorCareHistoryPage;
      if (more) assert(sameCareValue(prior.heads, page.heads));
      if (page.nextCursor)
        assert(
          page.nextCursor !== cursor &&
            !prior.seenCursors.includes(page.nextCursor),
        );
      const entries = appendGuidanceHistory(
        prior.entries,
        page,
        selection.clientId,
      );
      emit({
        history: {
          entries,
          heads: page.heads,
          nextCursor: page.nextCursor,
          complete: page.nextCursor === null,
          error: null,
          seenCursors: [
            ...prior.seenCursors,
            ...(page.nextCursor ? [page.nextCursor] : []),
          ],
        },
        privateDenied: false,
        authorityContext: null,
        contextStatus: "unavailable",
      });
    } catch (error) {
      if (lease.valid()) {
        failure(error, true, {
          history: {
            ...state.history,
            complete: false,
            error: "care history is incomplete. retry this page.",
          },
        });
      }
    } finally {
      lease.finish();
    }
  }
  async function refreshDraft(preserveBuffer = false) {
    if (!permitted("edit") || !state.selection?.draftId) return;
    const selection = state.selection,
      draftId = selection.draftId!,
      lease = capture("draft");
    try {
      if (!lease.valid()) return;
      if (!emit({ acknowledged: false, draftCurrent: false })) return;
      const value = await adapters.guidance.execute(
        { schemaVersion: 1, action: "read_guidance_draft_v1", draftId },
        { signal: lease.signal },
      );
      if (!lease.valid()) return;
      assert("target" in value && "body" in value);
      const draft = value as GuidanceDraftView;
      matchesDraft(draft);
      emit({
        draft,
        draftCurrent: true,
        body: preserveBuffer && state.body ? state.body : draft.body,
        dirty:
          preserveBuffer &&
          !!state.body &&
          !sameCareValue(state.body, draft.body),
        privateDenied: false,
        authorityContext: null,
        contextStatus: "unavailable",
        notice: null,
        saveState: preserveBuffer ? state.saveState : "saved",
      });
    } catch (error) {
      if (lease.valid()) failure(error, true);
    } finally {
      lease.finish();
    }
  }
  async function loadMoreReportedProducts() {
    if (
      !permitted("view") ||
      !state.selection ||
      !state.publication ||
      !state.reported.nextCursor
    )
      return;
    const selection = state.selection,
      publication = state.publication,
      prior = state.reported,
      lease = capture("reported");
    try {
      if (!lease.valid()) return;
      if (!emit({ acknowledged: false })) return;
      const value = await adapters.review.execute(
        {
          schemaVersion: 1,
          action: "read_advisor_reported_products_v1",
          clientId: selection.clientId,
          publicationVersion: publication.plan.version,
          cursor: prior.nextCursor,
          limit: 100,
          expectedUseRevision: publication.use.revision,
        },
        { signal: lease.signal },
      );
      if (!lease.valid()) return;
      assert(
        "revision" in value &&
          "items" in value &&
          value.revision === publication.use.revision,
      );
      const page =
        value as import("../../../../../../src/contracts/PortalCare.ts").ReportedProductsPage;
      assert(page.nextCursor !== prior.nextCursor);
      const keys = new Set(
        prior.items.map(
          (i) => `${i.product.reportedProductId}:${i.product.version}`,
        ),
      );
      for (const item of page.items) {
        const key = `${item.product.reportedProductId}:${item.product.version}`;
        assert(!keys.has(key));
        keys.add(key);
      }
      emit({
        reported: {
          items: [...prior.items, ...page.items],
          nextCursor: page.nextCursor,
          complete: page.nextCursor === null,
          error: null,
        },
      });
    } catch (error) {
      if (lease.valid()) {
        failure(error, false, {
          reported: {
            ...state.reported,
            complete: false,
            error: "current reported products are incomplete.",
          },
        });
      }
    } finally {
      lease.finish();
    }
  }
  async function loadInstructions() {
    if (!permitted("view") || !state.selection || !state.publication) return;
    const publication = state.publication,
      selection = state.selection,
      snapshot = publication.currentGuidance.snapshot;
    if (publication.currentGuidance.instructionCount === 0) {
      if (!retireAuthority()) return;
      if (
        !current() ||
        state.selection !== selection ||
        state.publication !== publication
      )
        return;
      emit({ instructions: { ...emptyInstructions(), complete: true } });
      return;
    }
    const lease = capture("instructions"),
      prior = state.instructions;
    try {
      if (!lease.valid()) return;
      if (!emit({ acknowledged: false })) return;
      const pages = [...prior.pages];
      if (pages.length === 0 || prior.nextCursor !== null) {
        const value = await adapters.review.execute(
          {
            schemaVersion: 1,
            action: "read_advisor_instruction_manifest_v1",
            clientId: selection.clientId,
            snapshot,
            cursor: pages.length ? prior.nextCursor : null,
            limit: 100,
          },
          { signal: lease.signal },
        );
        if (!lease.valid()) return;
        assert("items" in value && "snapshot" in value);
        const page = value as InstructionManifestPage;
        assert(
          page.items.length > 0 &&
            page.total === publication.currentGuidance.instructionCount,
        );
        assert(
          !pages.some(
            (p) =>
              p.cursor === page.cursor ||
              (page.nextCursor !== null && p.cursor === page.nextCursor),
          ),
        );
        pages.push(page);
        const items = pages.flatMap((p) => p.items);
        const ids = new Set(items.map((i) => i.instructionId)),
          scopes = new Set(items.map((i) => JSON.stringify(i.scope)));
        assert(
          ids.size === items.length &&
            scopes.size === items.length &&
            items.length <= page.total,
        );
        emit({
          instructions: {
            pages,
            items,
            details: prior.details,
            nextCursor: page.nextCursor,
            complete: false,
            error: null,
          },
        });
        if (page.nextCursor !== null) return;
      }
      const items = collectInstructionManifest(publication, pages),
        details = [...state.instructions.details];
      for (const item of items) {
        if (details.some((d) => d.item.instructionId === item.instructionId))
          continue;
        if (!lease.valid()) return;
        const value = await adapters.review.execute(
          {
            schemaVersion: 1,
            action: "read_advisor_instruction_v1",
            clientId: selection.clientId,
            snapshot,
            instructionId: item.instructionId,
            version: item.version,
            contentHash: item.contentHash,
          },
          { signal: lease.signal },
        );
        if (!lease.valid()) return;
        assert("content" in value && "item" in value);
        const detail = value as InstructionDetail;
        bindInstructionForScope(publication, items, item.scope, detail);
        details.push(detail);
        emit({
          instructions: {
            pages,
            items,
            details: [...details],
            nextCursor: null,
            complete: false,
            error: null,
          },
        });
      }
      if (!lease.valid()) return;
      emit({
        instructions: {
          pages,
          items,
          details,
          nextCursor: null,
          complete: true,
          error: null,
        },
      });
    } catch (error) {
      if (lease.valid()) {
        failure(error, false, {
          instructions: {
            ...state.instructions,
            complete: false,
            error:
              "applicable instructions are incomplete. retry the matching page or detail.",
          },
        });
      }
    } finally {
      lease.finish();
    }
  }
  async function refreshAuthority() {
    if (
      !contextPort ||
      !permitted("edit") ||
      pending ||
      state.busy.some((lane) => lane !== "authority") ||
      !state.selection?.draftId ||
      !state.draft ||
      !state.publicationCurrent ||
      !state.publication ||
      !state.draftCurrent ||
      state.dirty
    )
      return;
    if (!retireAuthority()) return;
    const selection = state.selection,
      draft = state.draft,
      publication = state.publication;
    const lease = capture("authority");
    try {
      if (!lease.valid()) return;
      if (!emit({ contextStatus: "loading", acknowledged: false })) return;
      const value = await contextPort.read(
        {
          boundaryKey: boundary!.key,
          selection,
          target: draft.target,
          publisher: {
            kind: "human",
            actorId: runtime.cookie.identity!.ownerId,
          },
          scope: `${draft.target.kind}.publish`,
          required: [
            "read_policy_v1",
            "fresh_guidance_draft",
            "current_publication",
            "current_session_capabilities",
          ],
          snapshot: publication.currentGuidance.snapshot,
        },
        { signal: lease.signal },
      );
      if (!lease.valid()) return;
      assert(
        contextPort.isCurrent(value) &&
          sameCareValue(value.draft.target, draft.target) &&
          sameCareValue(value.draft.body, state.body) &&
          sameCareValue(value.draft.currentBasis, draft.currentBasis) &&
          sameCareValue(value.draft.capturedBasis, draft.capturedBasis),
      );
      contextStamp = {
        selection: state.selection,
        draft: value.draft,
        body: state.body,
        publication: value.publication,
        history: state.history,
        reported: state.reported,
        instructions: state.instructions,
        manual,
        authority,
        pending,
      };
      emit({
        authorityContext: value,
        contextStatus: "ready",
        draft: value.draft,
        publication: value.publication,
        publicationCurrent: true,
        draftCurrent: true,
        acknowledged: false,
        notice: null,
      });
    } catch (error) {
      if (lease.valid()) {
        if (!retireAuthority()) return;
        failure(error, true);
      }
    } finally {
      lease.finish();
    }
  }
  function can(action: GuidanceAction): boolean {
    if (
      !permitted("edit") ||
      !state.selection ||
      pending ||
      state.busy.includes("write") ||
      state.conflict
    )
      return false;
    if (action === "conversation" || action === "private_note")
      return (
        state.publicationCurrent &&
        state.publication?.clientAccess.canWrite === true &&
        state.history.complete &&
        state.history.heads !== null &&
        !state.privateDenied
      );
    if (action === "create")
      return (
        state.publicationCurrent &&
        !!state.body &&
        !!state.publication &&
        state.publication.clientAccess.canWrite
      );
    if (action === "save")
      return (
        state.publicationCurrent &&
        state.publication?.clientAccess.canWrite === true &&
        !!state.draft &&
        state.draftCurrent &&
        !!state.body &&
        state.body.kind === state.draft.target.kind &&
        state.dirty &&
        !state.privateDenied
      );
    if (
      !state.draft ||
      !state.draftCurrent ||
      state.dirty ||
      !state.publication?.clientAccess.canWrite ||
      state.privateDenied
    )
      return false;
    if (contextPort && readGeneration() === null) return false;
    if (action === "revoke") {
      const approval = state.draft.approval;
      if (!approval) return false;
      if (!contextPort) return true;
      const value = state.authorityContext;
      return (
        authorityCurrent() &&
        !!value &&
        approval.policyRevision === value.policy.revision &&
        (approval.approvedBy === value.actorId ||
          value.actorId === value.policy.ownerActorId)
      );
    }
    if (action === "approve" || action === "publish") {
      if (
        state.busy.length > 0 ||
        !authorityCurrent() ||
        !state.evidenceComplete ||
        !state.acknowledged ||
        state.draft.needsRebase
      )
        return false;
      const value = state.authorityContext!,
        draft = value.draft;
      if (
        value.client.enrollmentStatus !== "active" ||
        !value.publication.clientAccess.canWrite ||
        !value.capabilities.edit ||
        !value.capabilities.publish ||
        !permitted("publish") ||
        !draft.review ||
        !sameCareValue(draft.review.target, draft.target) ||
        draft.issues.length !== 0
      )
        return false;
      if (action === "approve")
        return (
          value.actorId === value.policy.ownerActorId ||
          !value.policy.requireKanujApproval
        );
      const approval = draft.approval;
      return (
        !!approval &&
        sameCareValue(approval.target, draft.target) &&
        approval.scope === value.request.scope &&
        sameCareValue(approval.publisher, value.request.publisher) &&
        approval.publisher.actorId === value.actorId &&
        approval.policyRevision === value.policy.revision &&
        approval.revokedAt === null &&
        approval.receiptId === null &&
        (!value.policy.requireKanujApproval ||
          approval.approvedBy === value.policy.ownerActorId)
      );
    }
    if (
      contextPort &&
      (action === "review" || action === "rebase") &&
      !authorityCurrent()
    )
      return false;
    if (!state.evidenceComplete || !state.acknowledged) return false;
    if (action === "rebase") return state.draft.needsRebase;
    return (
      !state.draft.needsRebase &&
      state.draft.issues.every((i) => i.code === "review_required")
    );
  }
  function needsCurrentAuthority(command: Write) {
    return (
      !!contextPort &&
      [
        "review_guidance_v1",
        "rebase_guidance_draft_v1",
        "approve_guidance_v1",
        "publish_guidance_v1",
        "revoke_guidance_approval_v1",
      ].includes(command.action)
    );
  }
  async function executeWrite(family: Family, command: Write, retry = false) {
    if (!current() || !state.selection) return;
    if (!retry && needsCurrentAuthority(command) && !authorityCurrent()) return;
    const own = retry
      ? pending
      : {
          family,
          command: freeze(detached(command)),
          selection: state.selection,
          state: "sending" as const,
          wire: JSON.stringify(command),
          readSnapshot: state.publication?.currentGuidance.snapshot ?? null,
        };
    if (!own) return;
    if (retry) {
      if (!sameCareValue(own.selection, state.selection) || !permitted("edit"))
        return;
      own.state = "sending";
    } else if (pending) return;
    const bound = {
      readGeneration: readGeneration(),
      context,
      manual,
      authority,
      evidenceGeneration,
      selection: state.selection,
      draft: state.draft,
      body: state.body,
      publication: state.publication,
      history: state.history,
      reported: state.reported,
      instructions: state.instructions,
      capabilities: capabilityWire(),
      command: own.command,
      wire: own.wire,
      boundary: runtime.getSnapshot().boundary,
      owner: runtime.cookie.identity?.ownerId,
      audience: runtime.cookie.audience,
      generation: runtime.cookie.generation,
      epoch: runtime.cookie._epoch,
      csrf: runtime.cookie._view?.csrf,
      deadline: Math.min(
        Date.parse(runtime.cookie._view?.idleExpiresAt ?? ""),
        Date.parse(runtime.cookie._view?.absoluteExpiresAt ?? ""),
      ),
    };
    if (!retry && needsCurrentAuthority(command)) dispatchOwner = own;
    pending = own;
    const lease = capture("write");
    if (!lease.valid()) {
      // This fresh command has not reached either raw factory. Retire only its
      // own unsent intent; an uncertain retry and any newer owner stay intact.
      if (activeWrite?.intent !== own) {
        if (!retry) {
          if (pending === own) pending = null;
          const key = JSON.stringify(own.selection);
          if (parked.get(key) === own) parked.delete(key);
        } else own.state = "uncertain";
        if (
          state.selection === bound.selection &&
          context === bound.context &&
          manual === bound.manual &&
          authority === bound.authority
        )
          emit({});
      }
      if (dispatchOwner === own) dispatchOwner = null;
      lease.finish();
      return;
    }
    const operation = {
      intent: own,
      cancel: () => lease.cancel(),
      mayHaveDispatched: false,
      retry,
      readGeneration: bound.readGeneration,
    };
    activeWrite = operation;
    const cancelCapturedAttempt = () => {
      // An earlier false result stays false: only this attempt's captured
      // cancellation may run, with no new-scope retirement notifications.
      if (activeWrite === operation) finishRetirement(prepareWrite(), false);
      if (dispatchOwner === own) dispatchOwner = null;
      if (
        current() &&
        state.selection === bound.selection &&
        context === bound.context &&
        manual === bound.manual &&
        authority === bound.authority &&
        activeWrite?.intent !== own
      )
        emit({
          saveState: retry
            ? "uncertain"
            : command.action.includes("draft")
              ? "idle"
              : state.saveState,
        });
      lease.finish();
    };
    // Pure deny-only relevance. Mandatory live lease/current/CSRF checks stay
    // in the real shared transport before and after this callback.
    const isApplicable = () => {
      try {
        const cookie = runtime.cookie,
          now = cookie.now?.() ?? Date.now();
        return (
          !disposed &&
          activeWrite === operation &&
          pending === own &&
          own.state === "sending" &&
          !lease.signal.aborted &&
          context === bound.context &&
          manual === bound.manual &&
          authority === bound.authority &&
          evidenceGeneration === bound.evidenceGeneration &&
          state.selection === bound.selection &&
          state.draft === bound.draft &&
          state.body === bound.body &&
          state.publication === bound.publication &&
          state.history === bound.history &&
          state.reported === bound.reported &&
          state.instructions === bound.instructions &&
          own.command === bound.command &&
          own.wire === bound.wire &&
          runtime.getSnapshot().boundary === bound.boundary &&
          bound.boundary === boundary &&
          cookie.audience === bound.audience &&
          cookie.audience === "advisor" &&
          cookie.identity?.role === "advisor" &&
          cookie.identity.ownerId === bound.owner &&
          cookie.generation === bound.generation &&
          cookie._epoch === bound.epoch &&
          cookie._view?.csrf === bound.csrf &&
          cookie.status === "ready" &&
          capabilityWire() === bound.capabilities &&
          now < bound.deadline &&
          own.readSnapshot !== null &&
          sameCareValue(
            state.publication?.currentGuidance.snapshot,
            own.readSnapshot,
          ) &&
          dayFormatter.format(new Date(now)) === own.readSnapshot.asOfDay &&
          (!contextPort ||
            (operation.readGeneration !== null &&
              readGeneration() === operation.readGeneration))
        );
      } catch {
        return false;
      }
    };
    if (
      !emit({
        saveState: command.action.includes("draft")
          ? "saving"
          : state.saveState,
        acknowledged: false,
        notice: null,
      })
    ) {
      // No factory has been called. Cancel only the captured attempt and latch
      // the lost origin; a cancellation helper cannot adopt the new view.
      cancelCapturedAttempt();
      return;
    }
    try {
      if (!lease.valid()) {
        if (activeWrite === operation) retireWrite();
        return;
      }
      if (!retry && needsCurrentAuthority(command) && !authorityCurrent(own))
        throw new TransportError(409);
      // This marks possibility after the initial synchronous turn, never an
      // assertion of HTTP egress. Older uncertain attempts remain recoverable.
      queueMicrotask(() => {
        operation.mayHaveDispatched = true;
      });
      const dispatched =
        family === "guidance"
          ? adapters.guidance.execute(own.command as GuidanceCommand, {
              signal: lease.signal,
              isApplicable,
            })
          : adapters.review.execute(own.command as AdvisorReviewCommand, {
              signal: lease.signal,
              isApplicable,
            });
      const retired = retireAuthority(own);
      if (dispatchOwner === own) dispatchOwner = null;
      if (!retired) {
        cancelCapturedAttempt();
        // Drain only the already-created promise. Real global401 handling has
        // already run in the actual cookie/session path; never install an old
        // receipt or recapture the newer owner in a failure continuation.
        try {
          await dispatched;
        } catch {
          /* Intent remains exact or known unsent. */
        }
        return;
      }
      const result = await dispatched;
      if (!lease.valid()) return;
      acknowledge(result as GuidanceWriteResult | ReviewWriteResult, own);
    } catch (error) {
      if (!lease.valid()) return;
      const status = (error as { status?: unknown })?.status;
      if ((status === 401 || status === 503) && runtime.cookie.status === "offline" && current()) {
        // A concurrent transport loss can invalidate ready-only result delivery
        // while this exact application boundary still owns offline custody.
        // Reject/clear private projections; never forget a possibly committed
        // intent or turn custody into readiness. Real ended boundaries fail the
        // lease check above and still clear memory through invalidation.
        own.state = "uncertain";
        if (!clearPrivate()) return;
        emit({
          saveState: "uncertain",
          notice:
            "connection unavailable. the original result is uncertain. check its status after reconnecting.",
        });
      } else if (status === 503) {
        own.state = "uncertain";
        emit({
          saveState: "uncertain",
          notice: "the result is uncertain. check its status before retrying.",
        });
      } else if (status === 409) {
        pending = null;
        emit({
          conflict: { state: "needs_refresh", base: state.draft, latest: null },
          saveState: "error",
          draftCurrent: false,
          acknowledged: false,
          notice:
            "this changed. load the latest draft and compare before saving again.",
        });
      } else {
        pending = null;
        failure(error, true, { saveState: "error" });
      }
    } finally {
      if (activeWrite === operation) activeWrite = null;
      if (dispatchOwner === own) dispatchOwner = null;
      lease.finish();
    }
  }
  function acknowledge(
    result: GuidanceWriteResult | ReviewWriteResult,
    own: Pending,
  ) {
    if (pending !== own) return;
    pending = null;
    const saved = "draft" in result ? result.draft : null;
    // Receipt is historical. Fresh readable draft/rights/evidence are fetched by a
    // separate deliberate action; no receipt can install usable review/approval.
    emit({
      lastReceipt: {
        action: own.command.action,
        requestId: own.command.requestId,
        recordedAt:
          "recordedAt" in result
            ? result.recordedAt
            : "publishedAt" in result
              ? result.publishedAt
              : (saved?.savedAt ?? null),
      },
      saveState: saved ? "saved" : state.saveState,
      draft: saved ?? state.draft,
      draftCurrent: false,
      body:
        saved &&
        state.body &&
        "body" in own.command &&
        sameCareValue(state.body, own.command.body)
          ? saved.body
          : state.body,
      dirty:
        saved &&
        "body" in own.command &&
        sameCareValue(state.body, own.command.body)
          ? false
          : state.dirty,
      acknowledged: false,
      history:
        own.family === "review"
          ? { ...state.history, complete: false }
          : state.history,
      notice:
        "recorded. refresh the current information before the next action.",
    });
  }
  async function save() {
    if (!can("save") || !state.draft || !state.body) return;
    let command: GuidanceCommand;
    try {
      command = readGuidanceCommand({
        schemaVersion: 1,
        action: "save_guidance_draft_v1",
        requestId: crypto.randomUUID(),
        target: state.draft.target,
        body: state.body,
      });
    } catch {
      emit({
        saveState: "error",
        notice: "check the draft fields. the content was not sent.",
      });
      return;
    }
    await executeWrite("guidance", command as Write);
  }
  async function create() {
    if (!can("create") || !state.selection || !state.body) return;
    let command: GuidanceCommand;
    try {
      command = readGuidanceCommand({
        schemaVersion: 1,
        action: "create_guidance_draft_v1",
        requestId: crypto.randomUUID(),
        clientId: state.selection.clientId,
        body: state.body,
      });
    } catch {
      emit({ notice: "check the draft fields. the content was not sent." });
      return;
    }
    await executeWrite("guidance", command as Write);
  }
  async function action(
    which: "review" | "rebase" | "approve" | "publish" | "revoke",
  ) {
    if (!can(which) || !state.draft) return;
    const draft = state.draft;
    const command: GuidanceCommand =
      which === "review"
        ? {
            schemaVersion: 1,
            action: "review_guidance_v1",
            requestId: crypto.randomUUID(),
            target: draft.target,
          }
        : which === "rebase"
          ? {
              schemaVersion: 1,
              action: "rebase_guidance_draft_v1",
              requestId: crypto.randomUUID(),
              target: draft.target,
              expectedBasis: draft.currentBasis,
            }
          : which === "revoke" && draft.approval
            ? {
                schemaVersion: 1,
                action: "revoke_guidance_approval_v1",
                requestId: crypto.randomUUID(),
                approvalId: draft.approval.id,
                expectedPolicyRevision: draft.approval.policyRevision,
              }
            : which === "approve"
              ? {
                  schemaVersion: 1,
                  action: "approve_guidance_v1",
                  requestId: crypto.randomUUID(),
                  target: draft.target,
                  publisher: {
                    kind: "human",
                    actorId: runtime.cookie.identity!.ownerId,
                  },
                  scope: `${draft.target.kind}.publish`,
                }
              : {
                  schemaVersion: 1,
                  action: "publish_guidance_v1",
                  requestId: crypto.randomUUID(),
                  target: draft.target,
                  approvalId: draft.approval!.id,
                  publisher: draft.approval!.publisher,
                };
    await executeWrite("guidance", readGuidanceCommand(command) as Write);
  }
  async function checkStatus() {
    if (!pending || pending.state !== "uncertain" || !current()) return;
    const own = pending,
      lease = capture("status");
    try {
      const status = {
        schemaVersion: 1 as const,
        action: "request_status_v1" as const,
        requestId: own.command.requestId,
      };
      const result =
        own.family === "guidance"
          ? await adapters.guidance.execute(status)
          : await adapters.review.execute(status);
      if (!current()) return;
      assert("status" in result);
      if (result.status === "absent") {
        if (!lease.valid()) return;
        emit({
          notice:
            "no receipt was found. the original request is still unresolved.",
        });
        return;
      }
      assert(result.status === "committed");
      const receipt =
        own.family === "guidance"
          ? mapGuidanceResult(result.receipt, own.command as GuidanceCommand)
          : mapReviewResult(
              result.receipt,
              own.command as AdvisorReviewCommand,
            );
      if (lease.valid() && pending === own) {
        pending = null;
        const matchesBuffer =
          "body" in own.command &&
          state.body !== null &&
          sameCareValue(state.body, own.command.body);
        const sameTarget =
          "target" in own.command &&
          sameCareValue(state.draft?.target, own.command.target);
        emit({
          lastReceipt: {
            action: own.command.action,
            requestId: own.command.requestId,
            recordedAt:
              "recordedAt" in receipt
                ? receipt.recordedAt
                : "publishedAt" in receipt
                  ? receipt.publishedAt
                  : "draft" in receipt
                    ? receipt.draft.savedAt
                    : null,
          },
          saveState:
            sameTarget && matchesBuffer
              ? "saved"
              : state.saveState === "uncertain" || state.saveState === "saving"
                ? "idle"
                : state.saveState,
          dirty: sameTarget && matchesBuffer ? false : state.dirty,
          draftCurrent: sameTarget ? false : state.draftCurrent,
          notice:
            "the original request was recorded. refresh the current information before the next action.",
        });
      } else {
        // A committed original status can settle only its exact parked intent.
        // It cannot replace a newer selected draft, evidence or authority gate.
        const key = JSON.stringify(own.selection);
        if (parked.get(key) === own) parked.delete(key);
      }
    } catch (error) {
      if (lease.valid()) failure(error, true);
    } finally {
      lease.finish();
    }
  }
  return {
    getSnapshot: () => {
      if (state.authorityContext && !authorityCurrent()) retireAuthority();
      return state;
    },
    refreshAuthority,
    hasAuthorityReader: contextPort !== undefined,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    can,
    async open(selection: AdvisorGuidanceSelection) {
      if (!current()) return;
      if (!retireAuthority()) return;
      context++;
      manual++;
      if (!cancelAll()) return;
      if (pending) {
        if (pending.state === "sending") pending.state = "uncertain";
        parked.set(JSON.stringify(pending.selection), pending);
      }
      pending = parked.get(JSON.stringify(selection)) ?? null;
      parked.delete(JSON.stringify(selection));
      const selected = freeze(detached(selection));
      const opened = { context, manual };
      if (
        !emit({
          ...initial(),
          selection: selected,
          pending: null,
        })
      )
        return;
      await refreshPublication();
      if (
        !current() ||
        state.selection !== selected ||
        context !== opened.context ||
        manual !== opened.manual
      )
        return;
      if (permitted("edit"))
        await Promise.all([
          historyRead(false),
          selection.draftId ? refreshDraft() : Promise.resolve(),
        ]);
    },
    async checkConnection() {
      if (!current()) return;
      const lease = capture("connection");
      try {
        if (!lease.valid()) return;
        await runtime.restore();
        if (lease.valid())
          emit({
            notice:
              runtime.cookie.status === "ready"
                ? "connection restored. retry the original read or check the unresolved request."
                : "connection is unavailable. try again.",
          });
      } catch (error) {
        if (lease.valid()) failure(error, false);
      } finally {
        lease.finish();
      }
    },
    refreshPublication,
    refreshHistory: () => historyRead(false),
    loadMoreHistory: () => historyRead(true),
    refreshDraft: () => refreshDraft(true),
    loadMoreReportedProducts,
    loadInstructions,
    canEditBody() {
      return (
        permitted("edit") &&
        !pending &&
        state.publicationCurrent &&
        state.publication?.clientAccess.canWrite === true
      );
    },
    startDraft(body: GuidanceBody) {
      if (
        !permitted("edit") ||
        pending ||
        !state.selection ||
        !state.publicationCurrent ||
        !state.publication?.clientAccess.canWrite ||
        !sameCareValue(
          body.publication,
          state.publication.currentGuidance.snapshot.publication,
        )
      )
        return;
      if (!retireAuthority()) return;
      context++;
      manual++;
      if (!cancelAll()) return;
      emit({
        selection: freeze({
          ...state.selection,
          draftId: null,
          kind: body.kind,
        }),
        draft: null,
        draftCurrent: false,
        body: freeze(detached(body)),
        dirty: true,
        acknowledged: false,
        busy: [],
        saveState: "idle",
        conflict: null,
      });
    },
    editBody(body: GuidanceBody) {
      if (!permitted("edit") || pending || !state.selection) return;
      if (!retireAuthority()) return;
      manual++;
      if (!cancelAll()) return;
      emit({
        body: freeze(detached(body)),
        dirty: !sameCareValue(body, state.draft?.body),
        acknowledged: false,
        busy: [],
        saveState: "idle",
      });
    },
    acknowledgeEvidence(value: boolean) {
      if (!current()) return;
      const owns = continuation();
      const editable = permitted("edit");
      if (!owns()) return;
      emit({
        acknowledged:
          value && state.evidenceComplete && editable && !state.dirty,
      });
    },
    save,
    create,
    review: () => action("review"),
    rebase: () => action("rebase"),
    approve: () => action("approve"),
    publish: () => action("publish"),
    revoke: () => action("revoke"),
    async recordConversation(body: ConversationBody) {
      if (
        !can("conversation") ||
        !state.selection ||
        !state.history.heads ||
        !state.publication
      )
        return;
      assert(
        sameCareValue(
          body.publication,
          state.publication.currentGuidance.snapshot.publication,
        ),
      );
      let command: ReturnType<typeof readReviewCommand>;
      try {
        command = readReviewCommand({
          schemaVersion: 1,
          action: "record_conversation_v1",
          requestId: crypto.randomUUID(),
          clientId: state.selection.clientId,
          expectedReportRevision: state.history.heads.reportHead,
          body,
        });
      } catch {
        emit({
          notice:
            "check the conversation facts and actual channel. the record was not sent.",
        });
        return;
      }
      await executeWrite("review", command as Write);
    },
    async savePrivateNote(subject: PrivateNoteSubject, note: string) {
      if (!can("private_note") || !state.selection) return;
      const exists =
        subject.kind === "review"
          ? state.history.entries.some(
              (e) =>
                (e.kind === "guidance" &&
                  e.guidance.record.kind === "review" &&
                  e.guidance.record.id === subject.id) ||
                (e.kind === "legacy_review" && e.review.id === subject.id),
            )
          : state.history.entries.some((e) =>
              subject.kind === "conversation"
                ? e.kind === "conversation" && e.event.id === subject.id
                : (e.kind === "report" &&
                    e.event.kind === subject.kind &&
                    e.event.id === subject.id) ||
                  (e.kind === "report_amendment" &&
                    e.original.kind === subject.kind &&
                    e.original.id === subject.id),
            );
      if (!exists) return;
      let command: ReturnType<typeof readReviewCommand>;
      try {
        command = readReviewCommand({
          schemaVersion: 1,
          action: "append_private_review_note_v1",
          requestId: crypto.randomUUID(),
          clientId: state.selection.clientId,
          reviewEvent: subject,
          note,
        });
      } catch {
        emit({ notice: "enter a private note before saving." });
        return;
      }
      await executeWrite("review", command as Write);
    },
    checkStatus,
    async retry() {
      if (pending?.state === "uncertain")
        await executeWrite(pending.family, pending.command, true);
    },
    async refreshAfterConflict() {
      if (!state.conflict || pending) return;
      const conflict = state.conflict,
        base = conflict.base;
      const expected = {
        context,
        manual,
        authority,
        pending,
        selection: state.selection,
        publication: state.publication,
      };
      await refreshDraft(true);
      if (
        !current() ||
        context !== expected.context ||
        manual !== expected.manual ||
        authority !== expected.authority ||
        pending !== expected.pending ||
        state.selection !== expected.selection ||
        state.publication !== expected.publication ||
        state.conflict !== conflict
      )
        return;
      if (state.draftCurrent && state.draft)
        emit({
          conflict: { state: "current_displayed", base, latest: state.draft },
        });
    },
    acceptLatestRevision() {
      if (
        !permitted("edit") ||
        state.conflict?.state !== "current_displayed" ||
        !state.conflict.latest ||
        state.draft !== state.conflict.latest
      )
        return;
      emit({
        conflict: null,
        draftCurrent: true,
        acknowledged: false,
        notice:
          "the latest revision is selected. review your changes, then save deliberately.",
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      dispatchOwner = null;
      context++;
      pending = null;
      parked.clear();
      cancelAll();
      contextPort?.dispose();
      adapters.dispose();
      unsubscribe();
      unend?.();
      state = freeze({ ...initial(), ended: true });
      listeners.forEach((fn) => fn());
      listeners.clear();
    },
  };
}
export type AdvisorGuidanceController = ReturnType<
  typeof createAdvisorGuidanceController
>;
