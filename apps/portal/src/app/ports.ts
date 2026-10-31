import type {
  AdvisorGateView,
  AdvisorPublicationView,
  ClientPlanView,
  DraftView,
  ExactTarget,
  PlanCommand,
} from "../../../../src/contracts/PortalRebuild.ts";
import { readPlanCommand } from "../../../../src/contracts/PortalRebuildValidation.ts";
import { mapPlanResult } from "../../../../src/contracts/PortalRebuildMapping.ts";
import type { PlanResult } from "../../../../src/contracts/PortalRebuildMapping.ts";
import { buildConciergeRpc } from "../../../../supabase/functions/concierge-operations/commands.ts";
import { mapConciergeAdvisorDirectory } from "../../../../src/contracts/ConciergePortalMapping.ts";
import {
  buildPaymentCall,
  mapPaymentReceipt,
} from "../../../../supabase/functions/concierge-payments/contract.ts";
import {
  buildPaymentCallV2,
  mapPaymentReceiptV2,
  mapPaymentViewV2,
} from "../../../../supabase/functions/concierge-payments/methods.ts";
import type { PaymentReceipt } from "../../../../supabase/functions/concierge-payments/types.ts";
import type {
  AdvisorCommand,
  AdvisorPermissions,
  AdvisorPorts,
  ConfirmPaymentCommand,
} from "../features/advisor/types.ts";
import type { ClientPlanPorts } from "../features/plan/types.ts";
import { TransportError } from "../transport/session.ts";
import type {
  CookieChannel,
  OperationKind,
  OperationPort,
} from "../transport/session.ts";
import { advisorCookieRequest, clientCookieRequest } from "./retained.ts";
import type { ApplicationSession } from "./session.ts";
import { createClientCarePort, createAdvisorCarePort } from "./care-ports.ts";
const advisorActions = new Set<PlanCommand["action"]>([
  "list_plans_v1",
  "read_draft_v1",
  "create_draft_v1",
  "save_draft_v1",
  "assign_draft_v1",
  "compare_import_v1",
  "apply_import_v1",
  "validate_draft_v1",
  "preview_draft_v1",
  "review_section_v1",
  "approve_publication_v1",
  "publish_plan_v1",
  "request_status_v1",
]);
const reads = new Set<PlanCommand["action"]>([
  "list_plans_v1",
  "read_draft_v1",
  "compare_import_v1",
  "validate_draft_v1",
  "preview_draft_v1",
  "request_status_v1",
  "read_client_plan_v1",
  "read_advisor_gate_v1",
  "read_advisor_publication_v1",
  "read_draft_dependencies_v1",
]);
const targetKey = (t: ExactTarget | null) =>
  t === null
    ? "unassigned"
    : JSON.stringify([
        t.draftId,
        t.clientId,
        t.contentRevision,
        t.assignmentRevision,
        t.contentHash,
      ]);
function audience(runtime: ApplicationSession, expected: "client" | "advisor") {
  if (
    runtime.cookie.audience !== expected ||
    runtime.cookie.identity?.role !== expected
  )
    throw new TransportError(401);
}
function capturedSession(runtime: ApplicationSession) {
  const boundary = runtime.getSnapshot().boundary;
  if (!boundary?.isCurrent()) throw new TransportError(401);
  return (options?: { signal?: AbortSignal }, kind: OperationKind = "read") => {
    if (runtime.getSnapshot().boundary !== boundary || !boundary.isCurrent())
      throw new TransportError(401);
    if (options?.signal?.aborted) throw new TransportError(503, kind);
  };
}
function channel<I, O>(
  runtime: ApplicationSession,
  name: CookieChannel,
  kind: "read" | "write",
  command: I,
  decode: (value: unknown) => O,
  options?: { signal?: AbortSignal },
) {
  const factory =
    runtime.cookie.audience === "advisor"
      ? advisorCookieRequest
      : clientCookieRequest;
  return runtime.transport
    .bindCookieChannel<I, O>(factory, name, kind, decode)
    .execute(command, options);
}
/** One decoder closure per parsed request. Its response mapper runs only after
 * the retained cookie factory AND captured transport lease fences. */
function plan(
  runtime: ApplicationSession,
  raw: unknown,
  allowed: ReadonlySet<PlanCommand["action"]>,
  options?: { signal?: AbortSignal },
): Promise<PlanResult> {
  const command = readPlanCommand(raw);
  if (!allowed.has(command.action)) throw new TransportError(403);
  return channel(
    runtime,
    "plans",
    reads.has(command.action) ? "read" : "write",
    command,
    (value) => mapPlanResult(value, command),
    options,
  );
}
export function createClientPorts(
  runtime: ApplicationSession,
  options: { care?: boolean } = {},
): ClientPlanPorts {
  audience(runtime, "client");
  const current = capturedSession(runtime);
  return {
    ...(options.care ? { care: createClientCarePort(runtime) } : {}),
    read: {
      async execute(input, options) {
        current();
        const result = (await plan(
          runtime,
          input,
          new Set(["read_client_plan_v1"]),
          options,
        )) as ClientPlanView;
        current(options);
        return result;
      },
    },
    decision: {
      async execute(input, options) {
        current();
        await plan(runtime, input, new Set(["record_decision_v1"]), options);
        current(options, "write");
      },
    },
  };
}
/** Human-cookie composition only. Task agents use the authenticated backend API
 * and actual grants; no browser global advisor cookie is an agent capability. */
export function createAdvisorPorts(runtime: ApplicationSession, options: { care?: boolean } = {}) {
  audience(runtime, "advisor");
  const current = capturedSession(runtime);
  const actorId = runtime.cookie.identity!.ownerId;
  const allowedActions = options.care
    ? new Set<PlanCommand["action"]>([
        ...advisorActions,
        "read_draft_dependencies_v1",
        "rebase_draft_dependencies_v1",
      ])
    : advisorActions;
  const care = options.care ? createAdvisorCarePort(runtime) : undefined;
  let selected: ExactTarget | null = null,
    gateSequence = 0,
    selectionSequence = 0;
  const selecting = new Set<AdvisorCommand["action"]>([
    "read_draft_v1",
    "create_draft_v1",
    "save_draft_v1",
    "assign_draft_v1",
    "apply_import_v1",
    "review_section_v1",
    "rebase_draft_dependencies_v1",
  ]);
  const permissions: AdvisorPermissions = {
    actorId,
    view: false,
    edit: false,
    assign: false,
    review: false,
    approve: false,
    publish: false,
    confirmPayments: false,
  };
  function reset(bootstrap: boolean) {
    const c = runtime.cookie._view?.capabilities;
    Object.assign(permissions, {
      actorId,
      view: c?.view === true,
      edit: bootstrap && c?.edit === true,
      assign: bootstrap && c?.edit === true,
      review: bootstrap && c?.edit === true,
      approve: false,
      publish: c?.publish === true,
      confirmPayments: bootstrap && c?.confirmPayments === true,
    });
  }
  reset(true);
  const stop = runtime.transport.subscribeInvalidation(() => {
    gateSequence++;
    selectionSequence++;
    selected = null;
    Object.assign(permissions, {
      view: false,
      edit: false,
      assign: false,
      review: false,
      approve: false,
      publish: false,
      confirmPayments: false,
    });
  });
  async function gate(
    target: ExactTarget,
    options?: { signal?: AbortSignal },
  ): Promise<AdvisorGateView> {
    current();
    const key = targetKey(target),
      sequence = ++gateSequence;
    const command: Extract<PlanCommand, { action: "read_advisor_gate_v1" }> = {
      schemaVersion: 1,
      action: "read_advisor_gate_v1",
      target,
      publisher: { kind: "human", actorId },
    };
    const result = (await plan(
      runtime,
      command,
      new Set(["read_advisor_gate_v1"]),
      options,
    )) as AdvisorGateView;
    current(options);
    if (sequence !== gateSequence || key !== targetKey(selected))
      throw new TransportError(409);
    if (result.capabilities.actorId !== actorId) throw new TransportError(503);
    Object.assign(permissions, result.capabilities);
    return result;
  }
  async function select(view: DraftView, options?: { signal?: AbortSignal }) {
    current(options);
    selected = view.target;
    gateSequence++;
    reset(selected === null);
    if (selected) {
      // A failed read leaves the authorized draft readable, but mutation/approval
      // unavailable. The workspace's explicit refresh recovers actual context.
      try {
        await gate(selected, options);
      } catch (error) {
        if ((error as { status?: number }).status === 401) throw error;
      }
    }
  }
  const ports: AdvisorPorts = {
    plans: {
      async execute(input, options) {
        current();
        const kind = reads.has(input.action) ? "read" : "write";
        const selection = selecting.has(input.action)
          ? ++selectionSequence
          : null;
        if (selection !== null) gateSequence++;
        const result = await plan(runtime, input, allowedActions, options);
        current(options, kind);
        if ("draft" in result && selection === selectionSequence)
          await select(result, options);
        current(options, kind);
        return result;
      },
    },
    clients: {
      async execute(input, options) {
        current();
        const command = structuredClone(input);
        if (command.action !== "advisor_list") throw new TransportError(403);
        buildConciergeRpc(command, actorId);
        const result = await channel(
          runtime,
          "operations",
          "read",
          command,
          mapConciergeAdvisorDirectory,
          options,
        );
        current(options);
        return result;
      },
    },
    context: {
      async execute(input, options) {
        current();
        if (
          input.clientId !== input.target.clientId ||
          input.draftId !== input.target.draftId ||
          targetKey(input.target) !== targetKey(selected)
        )
          throw new TransportError(409);
        const result = await gate(input.target, options);
        current(options);
        return {
          clientId: result.clientId,
          approval: result.approval,
          publication: result.publication,
          coverage: result.coverage,
        };
      },
    },
    paymentRead: {
      async execute(input, options) {
        current();
        const command = structuredClone(input);
        if (command.action !== "advisor_read" || command.schemaVersion !== 2)
          throw new TransportError(403);
        buildPaymentCallV2(command, actorId);
        const result = await channel(
          runtime,
          "payments",
          "read",
          command,
          (value) => mapPaymentViewV2(value),
          options,
        );
        current(options);
        return result;
      },
    },
    payments: {
      async execute(input, options) {
        current();
        const command: ConfirmPaymentCommand = structuredClone(input);
        if (command.action !== "confirm_payment") throw new TransportError(403);
        const call =
          command.schemaVersion === 2
            ? buildPaymentCallV2(command, actorId)
            : buildPaymentCall(command, actorId);
        const result = await channel(
          runtime,
          "payments",
          "write",
          command,
          (value) => {
            const receipt =
              command.schemaVersion === 2
                ? mapPaymentReceiptV2(value, call)
                : mapPaymentReceipt(value, call);
            if (receipt.operation !== "confirm_payment")
              throw new TransportError(503, "write");
            return receipt as
              | PaymentReceipt
              | (PaymentReceipt & {
                  schemaVersion: 2;
                  paymentOptionId: string | null;
                });
          },
          options,
        );
        current(options, "write");
        return result;
      },
    },
  };
  if (care) {
    ports.dependencies = {
      execute(input, options) {
        if (
          input?.action !== "read_draft_dependencies_v1" &&
          input?.action !== "rebase_draft_dependencies_v1"
        )
          throw new TransportError(403);
        return ports.plans.execute(input, options);
      },
    };
    ports.careRead = {
      execute(input, options) {
        if (
          input.action !== "read_advisor_publication_v2" &&
          input.action !== "read_advisor_use_history_v1"
        )
          throw new TransportError(403);
        return care.execute(input, options);
      },
    };
  }
  const publication: OperationPort<
    Extract<PlanCommand, { action: "read_advisor_publication_v1" }>,
    AdvisorPublicationView
  > = {
    async execute(input, options) {
      current();
      const result = (await plan(
        runtime,
        input,
        new Set(["read_advisor_publication_v1"]),
        options,
      )) as AdvisorPublicationView;
      current(options);
      return result;
    },
  };
  return { ports, permissions, publication, care, dispose: stop };
}
