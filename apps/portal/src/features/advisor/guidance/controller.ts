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
  let dispatchOwner: Pending | null = null;
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
  function emit(patch: Partial<AdvisorGuidanceState> = {}) {
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
      ...(next.authorityContext && contextPort?.isCurrent(next.authorityContext)
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
    listeners.forEach((fn) => fn());
  }
  function retireAuthority() {
    contextPort?.invalidate();
    contextStamp = null;
    aborters.get("authority")?.abort();
    aborters.delete("authority");
    laneVersions.set("authority", (laneVersions.get("authority") ?? 0) + 1);
    emit({
      authorityContext: null,
      contextStatus: "unavailable",
      busy: state.busy.filter((x) => x !== "authority"),
      acknowledged: false,
    });
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
  function cancelAll() {
    aborters.forEach((c) => c.abort());
    aborters.clear();
    laneVersions.forEach((n, k) => laneVersions.set(k, n + 1));
  }
  function clearPrivate(ended = false) {
    retireAuthority();
    if (ended) {
      parked.clear();
      dispatchOwner = null;
    }
    authority++;
    manual++;
    cancelAll();
    emit({
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
    });
  }
  function reconcile() {
    if (disposed) return;
    if (!current()) {
      pending = null;
      context++;
      clearPrivate(true);
      return;
    }
    if (state.connection !== runtime.cookie.status) emit({});
    const next = capabilityWire();
    if (next !== capabilities) {
      capabilities = next;
      retireAuthority();
      authority++;
      context++;
      cancelAll();
      if (!caps()?.edit) clearPrivate();
      emit({
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
    reconcile();
    return (
      current() &&
      !state.ended &&
      runtime.cookie.status === "ready" &&
      caps()?.[right] === true
    );
  }
  function capture(lane: Lane) {
    reconcile();
    if (lane !== "authority" && lane !== "status" && lane !== "write")
      retireAuthority();
    if (!current()) throw new TransportError(401);
    aborters.get(lane)?.abort();
    const controller = new AbortController(),
      version = (laneVersions.get(lane) ?? 0) + 1;
    laneVersions.set(lane, version);
    aborters.set(lane, controller);
    const expected = {
      context,
      manual,
      authority,
      pending,
      selection: state.selection,
      publication: state.publication,
      publicationCurrent: state.publicationCurrent,
      capabilities,
    };
    emit({ busy: [...new Set([...state.busy, lane])] });
    return {
      signal: controller.signal,
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
  }
  function failure(error: unknown, privateRead: boolean) {
    const status = (error as { status?: unknown })?.status;
    if (status === 401) {
      pending = null;
      context++;
      clearPrivate(true);
      emit({ notice: "your session has ended. sign in again." });
    } else if (status === 403) {
      clearPrivate();
      if (!privateRead)
        emit({
          publication: null,
          publicationCurrent: false,
          reported: emptyReported(),
          instructions: emptyInstructions(),
        });
      emit({
        notice:
          "access to this information is unavailable. refresh after access is restored.",
      });
    } else
      emit({
        acknowledged: false,
        notice:
          status === 409
            ? "this information changed. refresh it before continuing."
            : "we could not load this information. try again.",
      });
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
    emit({ acknowledged: false, publicationCurrent: false });
    try {
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
    emit({ acknowledged: false });
    try {
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
        emit({
          history: {
            ...state.history,
            complete: false,
            error: "care history is incomplete. retry this page.",
          },
        });
        failure(error, true);
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
    emit({ acknowledged: false, draftCurrent: false });
    try {
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
    emit({ acknowledged: false });
    try {
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
        emit({
          reported: {
            ...state.reported,
            complete: false,
            error: "current reported products are incomplete.",
          },
        });
        failure(error, false);
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
      emit({ instructions: { ...emptyInstructions(), complete: true } });
      return;
    }
    const lease = capture("instructions"),
      prior = state.instructions;
    emit({ acknowledged: false });
    try {
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
        emit({
          instructions: {
            ...state.instructions,
            complete: false,
            error:
              "applicable instructions are incomplete. retry the matching page or detail.",
          },
        });
        failure(error, false);
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
    retireAuthority();
    const selection = state.selection,
      draft = state.draft,
      publication = state.publication;
    const lease = capture("authority");
    emit({ contextStatus: "loading", acknowledged: false });
    try {
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
        retireAuthority();
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
        };
    if (!own) return;
    if (retry) {
      if (!sameCareValue(own.selection, state.selection) || !permitted("edit"))
        return;
      own.state = "sending";
    } else if (pending) return;
    if (!retry && needsCurrentAuthority(command)) dispatchOwner = own;
    pending = own;
    const lease = capture("write");
    emit({
      saveState: command.action.includes("draft") ? "saving" : state.saveState,
      acknowledged: false,
      notice: null,
    });
    try {
      if (!retry && needsCurrentAuthority(command) && !authorityCurrent(own))
        throw new TransportError(409);
      const dispatched =
        family === "guidance"
          ? adapters.guidance.execute(own.command as GuidanceCommand, {
              signal: lease.signal,
            })
          : adapters.review.execute(own.command as AdvisorReviewCommand, {
              signal: lease.signal,
            });
      retireAuthority();
      dispatchOwner = null;
      const result = await dispatched;
      if (!lease.valid()) return;
      acknowledge(result as GuidanceWriteResult | ReviewWriteResult, own);
    } catch (error) {
      if (!lease.valid()) return;
      const status = (error as { status?: unknown })?.status;
      if (status === 503) {
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
        emit({ saveState: "error" });
        failure(error, true);
      }
    } finally {
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
    try {
      const command = readGuidanceCommand({
        schemaVersion: 1,
        action: "create_guidance_draft_v1",
        requestId: crypto.randomUUID(),
        clientId: state.selection.clientId,
        body: state.body,
      });
      await executeWrite("guidance", command as Write);
    } catch {
      emit({ notice: "check the draft fields. the content was not sent." });
    }
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
      if (lease.valid())
        acknowledge(receipt as GuidanceWriteResult | ReviewWriteResult, own);
      else {
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
      retireAuthority();
      context++;
      manual++;
      cancelAll();
      if (pending) {
        if (pending.state === "sending") pending.state = "uncertain";
        parked.set(JSON.stringify(pending.selection), pending);
      }
      pending = parked.get(JSON.stringify(selection)) ?? null;
      parked.delete(JSON.stringify(selection));
      emit({
        ...initial(),
        selection: freeze(detached(selection)),
        pending: null,
      });
      const selected = state.selection;
      await refreshPublication();
      if (!current() || state.selection !== selected) return;
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
      retireAuthority();
      context++;
      manual++;
      cancelAll();
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
      retireAuthority();
      manual++;
      cancelAll();
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
      emit({
        acknowledged:
          value && state.evidenceComplete && permitted("edit") && !state.dirty,
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
      try {
        const command = readReviewCommand({
          schemaVersion: 1,
          action: "record_conversation_v1",
          requestId: crypto.randomUUID(),
          clientId: state.selection.clientId,
          expectedReportRevision: state.history.heads.reportHead,
          body,
        });
        await executeWrite("review", command as Write);
      } catch {
        emit({
          notice:
            "check the conversation facts and actual channel. the record was not sent.",
        });
      }
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
      try {
        const command = readReviewCommand({
          schemaVersion: 1,
          action: "append_private_review_note_v1",
          requestId: crypto.randomUUID(),
          clientId: state.selection.clientId,
          reviewEvent: subject,
          note,
        });
        await executeWrite("review", command as Write);
      } catch {
        emit({ notice: "enter a private note before saving." });
      }
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
