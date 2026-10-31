// SYNTHETIC / DO NOT FULFILL. Memory operations only; never bank, provider, Auth or email calls.
import {
  createEmptyPlanContent,
  planSections,
  projectClientPlan,
} from "../../../../src/contracts/PortalRebuild.ts";
export const ids = {
  draft: "10000000-0000-4000-8000-000000000001",
  client: "10000000-0000-4000-8000-000000000002",
  other: "10000000-0000-4000-8000-000000000003",
  actor: "10000000-0000-4000-8000-000000000004",
  approval: "10000000-0000-4000-8000-000000000005",
  claim: "10000000-0000-4000-8000-000000000006",
  quote: "10000000-0000-4000-8000-000000000007",
  event: "10000000-0000-4000-8000-000000000008",
  receipt: "10000000-0000-4000-8000-000000000009",
};
export const stamp = "2026-10-30T12:00:00Z",
  hash = "a".repeat(64);
export function draftView(ready = false) {
  const content = createEmptyPlanContent();
  if (ready) {
    content.title = "SYNTHETIC / DO NOT FULFILL";
    content.summary = "reviewed synthetic plan";
    content.context.facts = [
      {
        id: "none",
        kind: "client_report",
        visibility: "client",
        text: "no current products reported",
        sources: [],
        contradicts: [],
      },
    ];
    content.context.products = { state: "none", factId: "none" };
    content.goals = [{ id: "goal-1", text: "comfort", factIds: [] }];
    content.followUp.criteria = ["check comfort"];
    content.routine = [
      {
        id: "step-1",
        slotId: "water",
        kind: "instruction",
        productId: null,
        title: "water rinse",
        directions: ["if comfortable"],
        cautions: [],
        schedule: {
          periods: ["morning"],
          days: { kind: "daily" },
          condition: null,
          asNeeded: false,
          stages: [],
          anchor: "actual_start",
          automaticAdvance: false,
        },
      },
    ];
  }
  const draft = {
    id: ids.draft,
    clientId: ready ? ids.client : null,
    kind: "care_plan",
    state: "working",
    contentRevision: 1,
    assignmentRevision: ready ? 1 : 0,
    contentHash: hash,
    content,
    savedAt: stamp,
    basis: { publicationVersion: null, useRevision: 0 },
    origin: { kind: "new", id: null },
  };
  return {
    draft,
    target: ready
      ? {
          draftId: draft.id,
          clientId: ids.client,
          contentRevision: 1,
          assignmentRevision: 1,
          contentHash: hash,
        }
      : null,
    sections: planSections.map((sectionId) => ({
      sectionId,
      sectionHash: hash,
      reviewed: ready,
    })),
    issues: ready
      ? []
      : [{ section: "context", path: "goals", code: "missing_goals" }],
  };
}
export function fixture({ ready = false } = {}) {
  let view = draftView(ready),
    current = true,
    release;
  const listeners = new Set(),
    memory = new Map(),
    committed = new Map();
  const f = {
    calls: [],
    signals: [],
    previews: [],
    memory,
    fail: 0,
    stale: false,
    hold: false,
    context: {
      clientId: ids.client,
      approval: null,
      publication: "first",
      coverage: "inactive",
      payments: {
        revision: 1,
        quotes: [
          {
            id: ids.quote,
            version: 1,
            publicationVersion: 0,
            currency: "USD",
            status: "payable",
            serviceCents: 10000,
            servicePeriod: null,
            shippingAddressVersion: null,
            items: [],
            productSubtotalCents: 0,
            taxCents: 0,
            shippingCents: 0,
            productTotalCents: 0,
            totalCents: 10000,
          },
        ],
        claims: [
          {
            id: ids.claim,
            quoteId: ids.quote,
            quoteVersion: 1,
            shippingAddressVersion: null,
            status: "submitted_unverified",
            evidenceId: null,
            serviceCents: 10000,
            productCents: 0,
            totalCents: 10000,
          },
        ],
        service: { status: "unpaid", period: null },
        nextServicePeriod: null,
        shippingAddress: null,
        shippingAddresses: [],
      },
    },
    invalidate() {
      current = false;
      memory.clear();
      listeners.forEach((fn) => fn());
    },
    release() {
      release?.();
    },
    getView() {
      return structuredClone(view);
    },
    setView(v) {
      view = structuredClone(v);
    },
  };
  const execute = async (command, options = {}) => {
    f.calls.push(structuredClone(command));
    f.signals.push(options.signal);
    if (f.hold) {
      f.hold = false;
      await new Promise((resolve) => (release = resolve));
    }
    if (f.fail) throw { status: f.fail };
    if (
      command.requestId &&
      command.action !== "request_status_v1" &&
      committed.has(command.requestId)
    )
      return structuredClone(committed.get(command.requestId));
    let result;
    switch (command.action) {
      case "read_draft_v1":
        result = view;
        break;
      case "create_draft_v1":
        view = draftView();
        result = view;
        break;
      case "list_plans_v1":
        result = {
          nextCursor: null,
          drafts: [
            {
              id: view.draft.id,
              clientId: view.draft.clientId,
              state: view.draft.state,
              contentRevision: view.draft.contentRevision,
              assignmentRevision: view.draft.assignmentRevision,
              savedAt: stamp,
            },
          ],
          publications: [],
        };
        break;
      case "save_draft_v1":
      case "apply_import_v1":
        view = {
          ...view,
          draft: {
            ...view.draft,
            content: structuredClone(command.content),
            contentRevision: view.draft.contentRevision + 1,
            contentHash: "b".repeat(64),
          },
          sections: view.sections.map((s) => ({ ...s, reviewed: false })),
        };
        if (view.target)
          view.target = {
            ...view.target,
            contentRevision: view.draft.contentRevision,
            contentHash: view.draft.contentHash,
          };
        f.context.approval = null;
        result = view;
        break;
      case "assign_draft_v1":
        view = {
          ...view,
          draft: {
            ...view.draft,
            clientId: command.toClientId,
            assignmentRevision: view.draft.assignmentRevision + 1,
          },
        };
        view.target = {
          draftId: view.draft.id,
          clientId: command.toClientId,
          contentRevision: view.draft.contentRevision,
          assignmentRevision: view.draft.assignmentRevision,
          contentHash: view.draft.contentHash,
        };
        result = view;
        break;
      case "compare_import_v1":
        result = {
          baseContentRevision: command.baseContentRevision,
          baseAssignmentRevision: command.baseAssignmentRevision,
          latest: view,
          proposed: command.content,
          stale: f.stale,
          proposalHash: hash,
        };
        break;
      case "review_section_v1":
        view = {
          ...view,
          sections: view.sections.map((s) =>
            s.sectionId === command.sectionId ? { ...s, reviewed: true } : s,
          ),
        };
        result = view;
        break;
      case "validate_draft_v1":
        result = { target: view.target, issues: view.issues };
        break;
      case "preview_draft_v1":
        result = {
          mode: "advisor-preview",
          published: false,
          target: view.target,
          content: projectClientPlan(view.draft.content),
          issues: view.issues,
        };
        break;
      case "approve_publication_v1":
        result = {
          ...command.target,
          id: ids.approval,
          scope: "care_plan.publish",
          approvedBy: ids.actor,
          approvedAt: stamp,
          publisher: command.publisher,
          revokedAt: null,
          publicationReceiptId: null,
        };
        f.context.approval = result;
        break;
      case "publish_plan_v1":
        result = {
          requestId: command.requestId,
          publicationReceiptId: ids.receipt,
          target: command.target,
          kind: "care_plan",
          publicationVersion: 1,
          instructionId: null,
          reviewId: null,
          publishedAt: stamp,
          firstServiceStarted: true,
          notificationEventId: ids.event,
        };
        break;
      case "request_status_v1":
        result = committed.has(command.requestId)
          ? { status: "committed", receipt: committed.get(command.requestId) }
          : { status: "absent" };
        break;
      default:
        throw Error("unsupported synthetic operation");
    }
    if (command.requestId && command.action !== "request_status_v1")
      committed.set(command.requestId, structuredClone(result));
    return structuredClone(result);
  };
  f.options = {
    session: {
      key: "SYNTHETIC-owner:1",
      isCurrent: () => current,
      subscribeInvalidation: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      memory: {
        get: (key) => memory.get(key),
        set: (key, value) => memory.set(key, value),
        delete: (key) => memory.delete(key),
      },
    },
    permissions: {
      actorId: ids.actor,
      view: true,
      edit: true,
      assign: true,
      review: true,
      approve: true,
      publish: true,
      confirmPayments: true,
    },
    ports: {
      plans: { execute },
      clients: {
        async execute() {
          return {
            capabilities: {
              view: true,
              edit: true,
              publish: true,
              confirmPayments: true,
            },
            clients: [
              {
                clientId: ids.client,
                displayName: "Maya SYNTHETIC",
                enrollmentStatus: "active",
                revision: 1,
                publishedVersion: 0,
                hasDraft: false,
              },
            ],
          };
        },
      },
      context: {
        async execute() {
          const { payments, ...context } = f.context;
          return structuredClone(context);
        },
      },
      paymentRead: {
        async execute(command) {
          f.paymentReads ??= [];
          f.paymentReads.push(structuredClone(command));
          return structuredClone(f.context.payments);
        },
      },
      payments: {
        async execute(command) {
          f.calls.push(structuredClone(command));
          if (f.fail) throw { status: f.fail };
          f.context.payments = {
            ...f.context.payments,
            revision: 2,
            claims: f.context.payments.claims.map((c) => ({
              ...c,
              status: "confirmed",
            })),
            service: { status: "pending_publication", period: null },
          };
          return {
            revision: 2,
            operation: "confirm_payment",
            quoteId: ids.quote,
            claimId: ids.claim,
            status: "confirmed",
            serviceUnlocked: false,
            serviceAccessStatus: "pending_publication",
            productOrderStatus: null,
          };
        },
      },
    },
    onPreview: (...args) => f.previews.push(args),
  };
  return f;
}
