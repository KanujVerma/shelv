import type {
  Approval,
  DraftView,
  PlanContent,
  PublishReceipt,
  SectionId,
} from "../../../../../src/contracts/PortalRebuild.ts";
import {
  readPlanCommand,
  readPlanContent,
} from "../../../../../src/contracts/PortalRebuildValidation.ts";
import { mapPlanResult } from "../../../../../src/contracts/PortalRebuildMapping.ts";
import type {
  PlanDirectory,
  PlanImportComparison,
  PlanPreview,
  PlanValidation,
} from "../../../../../src/contracts/PortalRebuildMapping.ts";
import {
  buildPaymentCall,
  mapPaymentReceipt,
  mapPaymentView,
} from "../../../../../supabase/functions/concierge-payments/contract.ts";
import {
  buildPaymentCallV2,
  mapPaymentReceiptV2,
  mapPaymentViewV2,
} from "../../../../../supabase/functions/concierge-payments/methods.ts";
import {
  sameContent,
  sameTarget,
  sameDraft,
  assertDraft,
  exactApproval,
  reviewed,
  paymentReady,
  firstServiceClaim,
} from "./model.ts";
import type {
  AdvisorCommand,
  AdvisorControllerOptions,
  AdvisorGateContext,
  AdvisorState,
  AdvisorWrite,
  ConfirmPaymentCommand,
} from "./types.ts";

const empty = (): AdvisorState => ({
  needsComparison: false,
  ended: false,
  busy: false,
  save: "saved",
  notice: null,
  directory: null,
  clients: null,
  view: null,
  local: null,
  context: null,
  comparison: null,
  comparisonLocal: null,
  pending: null,
  receipt: null,
});
const memoryKey = "advisor:working-state";
export function createAdvisorController(options: AdvisorControllerOptions) {
  const { session, ports, permissions } = options,
    listeners = new Set<() => void>(),
    controllers = new Set<AbortController>();
  const restored = session.isCurrent()
    ? session.memory.get<AdvisorState>(memoryKey)
    : undefined;
  let state: AdvisorState = restored
      ? {
          ...restored,
          busy: false,
          context: null,
          ...(restored.pending
            ? {
                save: "uncertain",
                notice: { kind: "uncertain", title: "result uncertain" },
              }
            : {}),
        }
      : empty(),
    disposed = false,
    epoch = 0,
    contextGeneration = 0,
    operationGeneration = 0,
    recoveryGeneration = 0;
  const live = () => !disposed && !state.ended && session.isCurrent();
  const emit = (patch: Partial<AdvisorState>) => {
    if (!live()) return;
    state = { ...state, ...patch };
    session.memory.set(memoryKey, state);
    listeners.forEach((fn) => fn());
  };
  const invalidate = () => {
    epoch++;
    controllers.forEach((c) => c.abort());
    controllers.clear();
    session.memory.delete(memoryKey);
    state = { ...empty(), ended: true };
    listeners.forEach((fn) => fn());
  };
  const unsubscribe = session.subscribeInvalidation(invalidate);
  const deny = () =>
    emit({ notice: { kind: "denied", title: "action unavailable" } });
  const dirty = () =>
    !!state.view && !sameContent(state.local, state.view.draft.content);
  const stable = () =>
    !!state.view &&
    state.view.draft.state === "working" &&
    !dirty() &&
    !state.pending &&
    !state.busy &&
    !state.receipt &&
    !state.needsComparison;
  function canReview() {
    return permissions.review && stable();
  }
  function canApprove() {
    return (
      permissions.approve &&
      stable() &&
      !!state.view?.target &&
      reviewed(state.view) &&
      state.view.issues.length === 0
    );
  }
  function canPublish() {
    return (
      permissions.publish &&
      stable() &&
      !!state.view?.target &&
      reviewed(state.view) &&
      state.view.issues.length === 0 &&
      state.context?.clientId === state.view.target.clientId &&
      exactApproval(
        state.context.approval,
        state.view.target,
        permissions.actorId,
      ) &&
      paymentReady(state.context)
    );
  }
  async function invoke<T>(
    run: (signal: AbortSignal) => Promise<T>,
  ): Promise<T | undefined> {
    if (!live()) return;
    const start = epoch,
      controller = new AbortController();
    controllers.add(controller);
    try {
      const value = await run(controller.signal);
      if (!live() || start !== epoch || controller.signal.aborted) return;
      return value;
    } catch (error) {
      if (!live() || start !== epoch || controller.signal.aborted) return;
      throw error;
    } finally {
      controllers.delete(controller);
    }
  }
  function fail(error: unknown, write = false, preserveBusy = false) {
    if (!live()) return;
    const status = (error as { status?: number } | null)?.status;
    if (status === 401) {
      invalidate();
      return;
    }
    const uncertain = write && (!status || status === 503),
      kind =
        status === 403
          ? "denied"
          : status === 409
            ? "conflict"
            : uncertain
              ? "uncertain"
              : "error";
    emit({
      busy: preserveBusy ? state.busy : false,
      needsComparison:
        state.needsComparison || (status === 409 && state.view !== null),
      save: write ? (uncertain ? "uncertain" : "error") : state.save,
      pending: write ? (uncertain ? state.pending : null) : state.pending,
      notice: {
        kind,
        title:
          kind === "denied"
            ? "action unavailable"
            : kind === "conflict"
              ? "draft changed"
              : kind === "uncertain"
                ? "result uncertain"
                : "could not complete request",
      },
    });
  }
  async function read(command: AdvisorCommand) {
    return invoke(async (signal) =>
      mapPlanResult(await ports.plans.execute(command, { signal }), command),
    );
  }
  function requireDraft() {
    const view = state.view;
    if (!view || !live()) return null;
    return view;
  }
  const writeBasis = (view: DraftView) => ({
    schemaVersion: 1 as const,
    requestId: crypto.randomUUID(),
    draftId: view.draft.id,
    expectedContentRevision: view.draft.contentRevision,
    expectedAssignmentRevision: view.draft.assignmentRevision,
  });
  function accept(command: AdvisorWrite, result: unknown) {
    const mapped = mapPlanResult(result, command);
    contextGeneration++;
    if (command.action === "approve_publication_v1") {
      const approval = mapped as Approval;
      if (
        !sameTarget(approval, command.target) ||
        approval.publisher.kind !== "human" ||
        approval.publisher.actorId !== permissions.actorId
      )
        throw Error("invalid_response");
      if (state.context && sameTarget(state.view?.target, command.target))
        emit({ context: { ...state.context, approval } });
    } else if (command.action === "publish_plan_v1") {
      const receipt = mapped as PublishReceipt;
      if (!sameTarget(receipt.target, command.target))
        throw Error("invalid_response");
      emit({ receipt });
    } else {
      const view = assertDraft(mapped as DraftView);
      if (
        command.action === "create_draft_v1" &&
        (view.draft.clientId !== null || view.target !== null)
      )
        throw Error("invalid_create_target");
      if (
        command.action !== "create_draft_v1" &&
        view.draft.id !== command.draftId
      )
        throw Error("invalid_response");
      if (
        command.action === "save_draft_v1" ||
        command.action === "apply_import_v1"
      ) {
        if (
          !sameContent(view.draft.content, command.content) ||
          view.draft.contentRevision !== command.expectedContentRevision + 1 ||
          view.draft.assignmentRevision !== command.expectedAssignmentRevision
        )
          throw Error("invalid_response");
      }
      if (
        command.action === "assign_draft_v1" &&
        (view.draft.clientId !== command.toClientId ||
          view.draft.assignmentRevision !==
            command.expectedAssignmentRevision + 1)
      )
        throw Error("invalid_response");
      if (
        command.action === "review_section_v1" &&
        (!state.view ||
          !sameDraft(view, state.view) ||
          !view.sections.some(
            (s) =>
              s.sectionId === command.sectionId &&
              s.sectionHash === command.sectionHash &&
              s.reviewed,
          ))
      )
        throw Error("invalid_response");
      const keep =
        command.action === "save_draft_v1" &&
        !sameContent(state.local, command.content);
      emit({
        view,
        needsComparison: false,
        local: keep ? state.local : view.draft.content,
        context: null,
        comparison: null,
        comparisonLocal: null,
        receipt: null,
      });
    }
    emit({
      pending: null,
      busy: false,
      notice: null,
      save: dirty() ? "idle" : "saved",
    });
  }
  async function execute(command: AdvisorWrite) {
    if (!live() || state.busy) return;
    readPlanCommand(command);
    const operation = ++operationGeneration;
    const current = () =>
      live() && operation === operationGeneration && state.pending === command;
    emit({
      pending: command,
      busy: true,
      notice: null,
      ...(command.action === "save_draft_v1"
        ? { save: "saving" as const }
        : {}),
    });
    try {
      const result = await read(command);
      if (result !== undefined && current()) accept(command, result);
    } catch (e) {
      if (current()) fail(e, true);
    }
  }
  async function refreshContext() {
    const view = requireDraft(),
      target = view?.target;
    if (!target) return;
    const generation = ++contextGeneration,
      start = epoch,
      operation = operationGeneration;
    // Both success and failure belong to one ordered read of this exact view.
    const current = () =>
      live() &&
      start === epoch &&
      generation === contextGeneration &&
      operation === operationGeneration &&
      state.view === view &&
      sameTarget(state.view?.target, target);
    try {
      const reads = await invoke((signal) =>
        Promise.all([
          ports.context.execute(
            { clientId: target.clientId, draftId: target.draftId, target },
            { signal },
          ),
          ports.paymentRead.execute(
            {
              schemaVersion: 2,
              action: "advisor_read",
              clientId: target.clientId,
            },
            { signal },
          ),
        ]),
      );
      if (!reads || !current()) return;
      const [result, paymentResult] = reads;
      if (
        result.clientId !== target.clientId ||
        !sameTarget(state.view?.target, target)
      )
        throw Error("wrong_context");
      const payments =
        "schemaVersion" in paymentResult && paymentResult.schemaVersion === 2
          ? mapPaymentViewV2(paymentResult)
          : mapPaymentView(paymentResult);
      let approval: Approval | null = null;
      if (result.approval) {
        approval = mapPlanResult(result.approval, {
          schemaVersion: 1,
          action: "approve_publication_v1",
          requestId: crypto.randomUUID(),
          target,
          scope: "care_plan.publish",
          publisher: { kind: "human", actorId: permissions.actorId },
        }) as Approval;
      }
      emit({ context: { ...result, payments, approval } });
    } catch (e) {
      if (!current()) return;
      emit({ context: null });
      fail(e, false, true);
    }
  }
  async function executePayment(command: ConfirmPaymentCommand) {
    if (
      !permissions.confirmPayments ||
      !ports.payments ||
      state.busy ||
      command.clientId !== state.view?.draft.clientId
    )
      return deny();
    const operation = ++operationGeneration;
    const current = () =>
      live() && operation === operationGeneration && state.pending === command;
    emit({ pending: command, busy: true, notice: null });
    try {
      const receipt = await invoke((signal) =>
        ports.payments!.execute(command, { signal }),
      );
      if (receipt && current()) {
        const call =
          command.schemaVersion === 2
            ? buildPaymentCallV2(command, permissions.actorId)
            : buildPaymentCall(command, permissions.actorId);
        command.schemaVersion === 2
          ? mapPaymentReceiptV2(receipt, call)
          : mapPaymentReceipt(receipt, call);
        await refreshContext();
        if (!current()) return;
        emit({ pending: null, busy: false });
      }
    } catch (e) {
      if (current()) fail(e, true);
    }
  }

  return {
    getSnapshot: () => state,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    permissions,
    dirty,
    canReview,
    canApprove,
    canPublish,
    async loadDirectory(cursor: string | null = null) {
      if (!permissions.view) return deny();
      try {
        const result = await read({
          schemaVersion: 1,
          action: "list_plans_v1",
          clientId: null,
          cursor,
          limit: 50,
        });
        if (result)
          emit({
            directory: result as PlanDirectory,
            notice: state.needsComparison ? state.notice : null,
          });
      } catch (e) {
        fail(e);
      }
    },
    async loadClients() {
      if (!permissions.view) return deny();
      try {
        const result = await invoke((signal) =>
          ports.clients.execute({ action: "advisor_list" }, { signal }),
        );
        if (result) emit({ clients: result });
      } catch (e) {
        fail(e);
      }
    },
    async open(draftId: string) {
      if (!permissions.view) return deny();
      if (state.view?.draft.id === draftId) return;
      if (state.pending || dirty()) {
        emit({
          notice: {
            kind: "conflict",
            title: "save or compare your current work first",
          },
        });
        return;
      }
      epoch++;
      controllers.forEach((c) => c.abort());
      emit({
        view: null,
        local: null,
        context: null,
        comparison: null,
        receipt: null,
        busy: true,
        notice: null,
      });
      try {
        const result = await read({
          schemaVersion: 1,
          action: "read_draft_v1",
          draftId,
        });
        if (result) {
          const view = assertDraft(result as DraftView);
          emit({ view, local: view.draft.content, busy: false, save: "saved" });
        }
      } catch (e) {
        fail(e);
      }
    },
    async create() {
      if (!permissions.edit) return deny();
      if (state.pending || dirty()) return deny();
      await execute({
        schemaVersion: 1,
        action: "create_draft_v1",
        requestId: crypto.randomUUID(),
        kind: "care_plan",
        templateVersionId: null,
      });
    },
    edit(update: (content: PlanContent) => PlanContent) {
      if (
        !permissions.edit ||
        !state.local ||
        state.receipt ||
        state.view?.draft.state !== "working" ||
        (state.pending && state.pending.action !== "save_draft_v1")
      )
        return;
      emit({
        local: update(structuredClone(state.local)),
        save: state.pending ? state.save : "idle",
        comparison: null,
        comparisonLocal: null,
      });
    },
    async save() {
      const view = requireDraft();
      if (!permissions.edit) return deny();
      if (
        !view ||
        !state.local ||
        state.pending ||
        state.busy ||
        !dirty() ||
        state.needsComparison ||
        state.receipt ||
        state.notice?.kind === "conflict"
      )
        return;
      try {
        const content = readPlanContent(state.local);
        await execute({
          ...writeBasis(view),
          action: "save_draft_v1",
          kind: "care_plan",
          content,
        });
      } catch {
        emit({
          save: "error",
          notice: {
            kind: "invalid",
            title: "check the draft fields before saving",
          },
        });
      }
    },
    async assign(clientId: string) {
      if (!permissions.assign) return deny();
      const view = requireDraft();
      if (
        !view ||
        !stable() ||
        !state.clients?.clients.some(
          (c) => c.clientId === clientId && c.enrollmentStatus === "active",
        )
      )
        return deny();
      await execute({
        ...writeBasis(view),
        action: "assign_draft_v1",
        fromClientId: view.draft.clientId,
        toClientId: clientId,
      });
    },
    async review(sectionId: SectionId) {
      if (!canReview()) return deny();
      const view = requireDraft(),
        section = view?.sections.find((s) => s.sectionId === sectionId);
      if (view && section)
        await execute({
          ...writeBasis(view),
          action: "review_section_v1",
          sectionId,
          sectionHash: section.sectionHash,
        });
    },
    async validate() {
      const view = requireDraft();
      if (!view || !stable()) return;
      try {
        const result = (await read({
          schemaVersion: 1,
          action: "validate_draft_v1",
          draftId: view.draft.id,
          contentRevision: view.draft.contentRevision,
          assignmentRevision: view.draft.assignmentRevision,
        })) as PlanValidation | undefined;
        if (
          result &&
          state.view &&
          sameDraft(state.view, view) &&
          ((result.target === null && view.target === null) ||
            sameTarget(result.target, view.target))
        )
          emit({ view: { ...view, issues: result.issues } });
      } catch (e) {
        fail(e);
      }
    },
    async compareImport(raw: string) {
      try {
        await this.compare(readPlanContent(JSON.parse(raw)));
      } catch {
        emit({
          notice: {
            kind: "invalid",
            title:
              "import must match the plan fields; unsupported fields are not accepted",
          },
        });
      }
    },
    async compareLocal() {
      if (state.local) await this.compare(state.local);
    },
    async compare(content: PlanContent) {
      const view = requireDraft();
      if (!permissions.edit) return deny();
      if (!view || state.pending || state.busy) return;
      try {
        const localAtStart = state.local,
          proposed = readPlanContent(content),
          result = (await read({
            schemaVersion: 1,
            action: "compare_import_v1",
            draftId: view.draft.id,
            baseContentRevision: view.draft.contentRevision,
            baseAssignmentRevision: view.draft.assignmentRevision,
            content: proposed,
          })) as PlanImportComparison | undefined;
        if (result) {
          assertDraft(result.latest);
          if (
            !sameContent(result.proposed, proposed) ||
            result.latest.draft.id !== view.draft.id
          )
            throw Error("invalid_comparison");
          emit({
            comparison: result,
            needsComparison: state.needsComparison || result.stale,
            comparisonLocal: localAtStart,
            notice: null,
          });
        }
      } catch (e) {
        fail(e);
      }
    },
    async applyImport() {
      const v = state.view,
        c = state.comparison;
      if (!permissions.edit) return deny();
      if (
        !v ||
        !c ||
        c.stale ||
        state.pending ||
        state.busy ||
        (dirty() && !sameContent(state.local, c.proposed)) ||
        !sameContent(state.local, state.comparisonLocal) ||
        c.baseContentRevision !== v.draft.contentRevision ||
        c.baseAssignmentRevision !== v.draft.assignmentRevision ||
        c.latest.draft.contentRevision !== v.draft.contentRevision ||
        c.latest.draft.assignmentRevision !== v.draft.assignmentRevision
      )
        return;
      await execute({
        ...writeBasis(v),
        action: "apply_import_v1",
        baseContentRevision: c.baseContentRevision,
        proposalHash: c.proposalHash,
        content: c.proposed,
      });
    },
    /** Deliberate use of latest base retains manual content, then requires a fresh diff before apply. */
    async rebaseComparison() {
      const c = state.comparison;
      if (!c || state.pending || state.busy) return;
      emit({
        view: c.latest,
        needsComparison: true,
        context: null,
        comparison: null,
        comparisonLocal: null,
        notice: {
          kind: "conflict",
          title: "compare your work with the latest draft",
        },
        save: sameContent(state.local, c.latest.draft.content)
          ? "saved"
          : "idle",
      });
    },
    refreshContext,
    async approve() {
      if (!canApprove()) return deny();
      const target = state.view!.target!;
      if (!state.context || state.context.clientId !== target.clientId) {
        await refreshContext();
        if (!state.context) return;
      }
      if (!canApprove() || !sameTarget(state.view?.target, target)) return;
      await execute({
        schemaVersion: 1,
        action: "approve_publication_v1",
        requestId: crypto.randomUUID(),
        target,
        scope: "care_plan.publish",
        publisher: { kind: "human", actorId: permissions.actorId },
      });
    },
    async publish() {
      if (!canPublish()) return deny();
      await execute({
        schemaVersion: 1,
        action: "publish_plan_v1",
        requestId: crypto.randomUUID(),
        target: state.view!.target!,
        approvalId: state.context!.approval!.id,
        firstServiceClaimId:
          state.context!.publication === "first"
            ? firstServiceClaim(state.context!.payments)!.id
            : null,
      });
    },
    async preview() {
      const v = requireDraft();
      if (!v || !stable() || !options.onPreview) return;
      try {
        const p = (await read({
          schemaVersion: 1,
          action: "preview_draft_v1",
          draftId: v.draft.id,
          contentRevision: v.draft.contentRevision,
          assignmentRevision: v.draft.assignmentRevision,
        })) as PlanPreview | undefined;
        if (
          p &&
          state.view &&
          sameDraft(v, state.view) &&
          !dirty() &&
          ((p.target === null && v.target === null) ||
            sameTarget(p.target, v.target))
        )
          options.onPreview(p, v);
      } catch (e) {
        fail(e);
      }
    },
    async confirmPayment(claimId: string, gross: string, checked: boolean) {
      if (!permissions.confirmPayments || !ports.payments) return deny();
      const context = state.context,
        claim = context?.payments.claims.find((c) => c.id === claimId),
        quote = context?.payments.quotes.find(
          (q) => q.id === claim?.quoteId && q.version === claim.quoteVersion,
        );
      if (
        !context ||
        !claim ||
        !quote ||
        !stable() ||
        context.publication !== "first" ||
        claim.status !== "submitted_unverified" ||
        quote.status !== "payable" ||
        quote.publicationVersion !== 0 ||
        quote.serviceCents <= 0 ||
        !checked ||
        !/^\d+(?:\.\d{1,2})?$/.test(gross) ||
        Math.round(Number(gross) * 100) !== quote.totalCents
      )
        return deny();
      const base = {
        action: "confirm_payment" as const,
        requestId: crypto.randomUUID(),
        clientId: context.clientId,
        expectedRevision: context.payments.revision,
        quoteId: quote.id,
        quoteVersion: quote.version,
        shippingAddressVersion: quote.shippingAddressVersion,
        claimId: claim.id,
        serviceCents: quote.serviceCents,
        productCents: quote.productTotalCents,
        totalCents: quote.totalCents,
      };
      const v2 = "contractVersion" in quote && quote.contractVersion === 2;
      const command: ConfirmPaymentCommand = v2
        ? {
            ...base,
            schemaVersion: 2,
            paymentOptionId: ("paymentOptionId" in claim
              ? claim.paymentOptionId
              : null) as string,
            receiptVerified: true,
          }
        : { ...base, bankReceiptVerified: true };
      await executePayment(command);
    },
    async reconcile() {
      const pending = state.pending;
      if (!pending || state.busy) return;
      const operation = operationGeneration,
        recovery = ++recoveryGeneration;
      // A retry starts another operation even though it reuses the same UUID.
      const current = () =>
        live() &&
        operation === operationGeneration &&
        recovery === recoveryGeneration &&
        state.pending === pending;
      if (pending.action === "confirm_payment") {
        await refreshContext();
        if (
          current() &&
          state.context?.payments.claims.some(
            (c) => c.id === pending.claimId && c.status === "confirmed",
          )
        )
          emit({
            pending: null,
            busy: false,
            notice: null,
            save: dirty() ? "idle" : "saved",
          });
        return;
      }
      try {
        const result = await read({
          schemaVersion: 1,
          action: "request_status_v1",
          requestId: pending.requestId,
        });
        if (
          current() &&
          result &&
          "status" in result &&
          result.status === "committed"
        )
          accept(pending, result.receipt);
      } catch (e) {
        if (current()) fail(e, true);
      }
    },
    async retry() {
      const pending = state.pending;
      if (!pending || state.busy) return;
      if (pending.action === "confirm_payment") {
        await executePayment(pending);
        return;
      }
      await execute(pending);
    },
    hasPreview: !!options.onPreview,
    hasPayments: !!ports.payments,
    dispose() {
      if (disposed) return;
      epoch++;
      controllers.forEach((c) => c.abort());
      controllers.clear();
      unsubscribe();
      listeners.clear();
      disposed = true;
    },
  };
}
