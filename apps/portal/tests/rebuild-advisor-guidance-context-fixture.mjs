import { createAdvisorGuidanceContext } from "../src/app/advisor-guidance-context.ts";
// SYNTHETIC finite HTTP DTO ledger. Never a successful production port.
import assert from "node:assert/strict";
import { createApplicationSession } from "../src/app/session.ts";
import {
  createEmptyPlanContent,
  projectClientPlan,
} from "../../../src/contracts/PortalRebuild.ts";
export const ids = {
  actor: "11111111-1111-4111-8111-111111111111",
  client: "22222222-2222-4222-8222-222222222222",
  draft: "33333333-3333-4333-8333-333333333333",
  report: "44444444-4444-4444-8444-444444444444",
  other: "55555555-5555-4555-8555-555555555555",
  amend: "66666666-6666-4666-8666-666666666666",
};
export const at = "2026-10-01T12:00:00Z",
  publication = { version: 1, documentSchemaVersion: 3 };
export const clone = (v) => structuredClone(v),
  cursor = (n) => `r:${"a".repeat(64)}:${n === 1 ? ids.report : ids.amend}`;
export function dto() {
  const snapshot = {
    publication,
    currentPublication: publication,
    useHead: 0,
    reportHead: 1,
    instructionHead: 0,
    serviceRevision: 0,
    decisionRevision: 0,
    asOfDay: "2026-10-31",
    manifestHash: "a".repeat(64),
  };
  const body = {
    kind: "review",
    publication,
    reportRefs: [{ kind: "goal_report", id: ids.report }],
    occurredOn: { state: "unknown" },
    channel: "portal",
    clientReport: "SYNTHETIC client report",
    conclusion: "keep the current plan",
    rationale: "reviewed comfort",
    changes: [],
    nextStep: "contact shelv if comfort changes",
    nextReviewOn: null,
  };
  const basis = {
    schemaVersion: 1,
    publication,
    legacyBasis: { publicationVersion: 1, useRevision: 0 },
    legacyBasisManifestHash: "e".repeat(64),
    useHead: 0,
    reportHead: 1,
    instructionHead: 0,
    references: [
      { event: { kind: "goal_report", id: ids.report }, amendmentHeadId: null },
    ],
    sourceManifest: { schemaVersion: 1, hash: "f".repeat(64), count: 0 },
  };
  const target = {
    draftId: ids.draft,
    clientId: ids.client,
    kind: "review",
    revision: 1,
    contentHash: "b".repeat(64),
    basisHash: "c".repeat(64),
  };
  const draft = {
    target,
    body,
    capturedBasis: basis,
    currentBasis: basis,
    needsRebase: false,
    savedAt: at,
    recordedBy: ids.other,
    review: null,
    approval: null,
    issues: [{ path: "review", code: "review_required" }],
  };
  const report = {
    kind: "goal_report",
    id: ids.report,
    body: {
      publication,
      answers: [],
      comfort: "SYNTHETIC original comfort",
      actualUseEventIds: [],
      notes: null,
      photoIds: [],
    },
    occurredOn: { state: "unknown" },
    channel: "portal",
    reportedBy: ids.client,
    recordedBy: ids.client,
    recordedAt: at,
  };
  const view = {
    schemaVersion: 3,
    clientId: ids.client,
    version: 1,
    plan: {
      documentSchemaVersion: 3,
      version: 1,
      publishedAt: at,
      content: projectClientPlan(createEmptyPlanContent()),
    },
    decisionRevision: 0,
    decisions: [],
    actualUse: [],
    nextReviewOn: null,
    reviewSchedule: null,
    clientAccess: {
      care: "active",
      entitled: true,
      canRead: true,
      canWrite: true,
    },
    use: {
      revision: 0,
      planProducts: [],
      reportedProducts: { items: [], nextCursor: null },
    },
    latestPublicReview: null,
    decisionGuidance: [],
    currentGuidance: {
      schemaVersion: 1,
      mode: "current_document",
      instructionSemantics: "current_for_selected_publication",
      snapshot,
      instructionCount: 0,
    },
  };
  const heads = {
    useHead: 0,
    reportHead: 1,
    instructionHead: 0,
    serviceRevision: 0,
    publicationVersion: 1,
  };
  const page = {
    schemaVersion: 1,
    audience: "advisor",
    clientId: ids.client,
    version: null,
    heads,
    entries: [{ kind: "report", event: report }],
    nextCursor: null,
  };
  return clone({ snapshot, body, basis, target, draft, report, view, page });
}
export function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}
export async function contextApp(t, createController) {
  const data = dto(),
    calls = [],
    holds = [],
    overrides = new Map(),
    receipts = new Map();
  let history = [data.page],
    time = Date.parse("2026-10-31T18:00:00Z");
  const login = {
    signedIn: true,
    ownerId: ids.actor,
    generation: 1,
    csrf: "SYNTHETIC-guidance-csrf",
    capabilities: {
      view: true,
      edit: true,
      publish: true,
      confirmPayments: false,
    },
    idleExpiresAt: "2099-01-01T00:00:00Z",
    absoluteExpiresAt: "2099-01-02T00:00:00Z",
  };
  data.policy = {
    revision: 1,
    ownerActorId: ids.actor,
    requireKanujApproval: true,
  };
  data.directory = {
    capabilities: {
      view: true,
      edit: true,
      publish: true,
      confirmPayments: false,
    },
    clients: [
      {
        clientId: ids.client,
        displayName: "SYNTHETIC client",
        enrollmentStatus: "active",
        revision: 1,
        publishedVersion: 1,
        hasDraft: false,
      },
    ],
  };
  const runtime = createApplicationSession({
    audience: "advisor",
    now: () => time,
    locks: { request: async (_n, _o, run) => run() },
    fetcher: async (url, init) => {
      assert.ok(
        [
          "/api/advisor/session",
          "/api/advisor/reviews",
          "/api/advisor/guidance",
          "/api/advisor/logout",
          "/api/advisor/plans",
          "/api/advisor/operations",
        ].includes(url),
        "unexpected network " + url,
      );
      if (url.endsWith("/session")) return Response.json(login);
      if (url.endsWith("/logout")) return Response.json({ signedOut: true });
      assert.equal(new Headers(init.headers).get("x-shelv-csrf"), login.csrf);
      assert.equal(init.credentials, "same-origin");
      const command = JSON.parse(init.body);
      calls.push({ url, command: clone(command), wire: init.body });
      let result,
        status = 200;
      const override = overrides.get(command.action);
      if (override) {
        const out =
          typeof override === "function" ? override(command) : override;
        result = out.body;
        status = out.status ?? 200;
      } else if (command.action === "read_policy_v1") result = data.policy;
      else if (command.action === "advisor_list") result = data.directory;
      else if (command.action === "read_advisor_publication_v3")
        result = data.view;
      else if (command.action === "read_advisor_care_history_v1")
        result =
          history[
            command.cursor === null ? 0 : command.cursor === cursor(1) ? 1 : 2
          ];
      else if (command.action === "read_guidance_draft_v1") result = data.draft;
      else if (command.action === "read_advisor_reported_products_v1")
        result = {
          revision: data.view.use.revision,
          items: [],
          nextCursor: null,
        };
      else if (command.action === "request_status_v1")
        result = receipts.has(command.requestId)
          ? { status: "committed", receipt: receipts.get(command.requestId) }
          : { status: "absent" };
      else if (
        command.action === "create_guidance_draft_v1" ||
        command.action === "save_guidance_draft_v1" ||
        command.action === "rebase_guidance_draft_v1" ||
        command.action === "review_guidance_v1"
      ) {
        const draft = clone(data.draft);
        if (command.action === "create_guidance_draft_v1") {
          draft.target.revision = 1;
          draft.body = command.body;
          draft.target.kind = command.body.kind;
        }
        if (command.action === "save_guidance_draft_v1") {
          draft.target.revision++;
          draft.body = command.body;
          draft.target.contentHash = "d".repeat(64);
          draft.review = null;
          draft.approval = null;
        }
        if (command.action === "review_guidance_v1") {
          draft.review = {
            id: ids.other,
            target: clone(command.target),
            reviewedBy: ids.actor,
            reviewedAt: at,
          };
          draft.issues = [];
        }
        if (command.action === "rebase_guidance_draft_v1") {
          draft.target.revision++;
          draft.capturedBasis = command.expectedBasis;
          draft.currentBasis = command.expectedBasis;
          draft.needsRebase = false;
          draft.review = null;
          draft.approval = null;
        }
        data.draft = clone(draft);
        result = { requestId: command.requestId, draft };
        receipts.set(command.requestId, clone(result));
      } else if (command.action === "approve_guidance_v1") {
        const approval = {
          id: ids.other,
          target: clone(command.target),
          scope: command.scope,
          publisher: clone(command.publisher),
          approvedBy: login.ownerId,
          approvedAt: at,
          policyRevision: data.policy.revision,
          revokedAt: null,
          receiptId: null,
        };
        data.draft.approval = clone(approval);
        result = { requestId: command.requestId, approval };
        receipts.set(command.requestId, clone(result));
      } else if (command.action === "publish_guidance_v1") {
        result = {
          requestId: command.requestId,
          receiptId: ids.amend,
          target: clone(command.target),
          approvalId: command.approvalId,
          publisher: clone(command.publisher),
          record: { kind: command.target.kind, id: ids.amend },
          publishedAt: at,
          notificationEventId: ids.other,
        };
        receipts.set(command.requestId, clone(result));
        history = [
          {
            ...data.page,
            entries: [
              ...data.page.entries,
              {
                kind: "guidance",
                guidance: {
                  record: result.record,
                  body: clone(data.draft.body),
                  publishedBy: login.ownerId,
                  publishedAt: at,
                  originalStart: null,
                },
              },
            ],
          },
        ];
        data.draft.approval = null;
      } else if (command.action === "append_private_review_note_v1")
        result = {
          requestId: command.requestId,
          action: command.action,
          noteId: ids.other,
          reviewEvent: command.reviewEvent,
          recordedBy: ids.actor,
          recordedAt: at,
          notificationEventId: null,
        };
      else if (command.action === "record_conversation_v1")
        result = {
          requestId: command.requestId,
          action: command.action,
          event: { kind: "conversation", id: ids.other },
          amendmentId: null,
          revision: command.expectedReportRevision + 1,
          recordedAt: at,
          notificationEventId: ids.other,
          attentionEventId: ids.other,
        };
      else throw Error("unhandled SYNTHETIC command " + command.action);
      if (!result) throw Error("missing SYNTHETIC DTO " + command.action);
      const body = clone(result),
        hold = holds.find((h) => !h.used && h.action === command.action);
      if (hold) {
        hold.used = true;
        hold.ready.resolve();
        await hold.done.promise;
        return Response.json(hold.replace ? hold.replace(body) : body, {
          status: hold.status ?? status,
        });
      }
      return Response.json(body, { status });
    },
  });
  t.after(() => runtime.dispose());
  await runtime.restore();
  const context = createAdvisorGuidanceContext(runtime);
  const controller = createController({ runtime, context });
  t.after(() => context.dispose());
  t.after(() => {
    holds.forEach((h) => h.done.resolve());
    controller.dispose();
  });
  return {
    runtime,
    context,
    c: controller,
    data,
    calls,
    login,
    receipts,
    setHistory(pages) {
      history = clone(pages);
    },
    override(action, body, status = 200) {
      overrides.set(action, { body, status });
    },
    clear(action) {
      overrides.delete(action);
    },
    async caps(patch) {
      Object.assign(login.capabilities, patch);
      await runtime.restore();
    },
    advance(milliseconds) {
      time += milliseconds;
    },
    expire() {
      time = Date.parse("2099-01-03T00:00:00Z");
    },
    hold(action, options = {}) {
      const h = {
        action,
        used: false,
        ready: deferred(),
        done: deferred(),
        ...options,
      };
      holds.push(h);
      return { ready: h.ready.promise, release: () => h.done.resolve() };
    },
  };
}
export const selection = {
  clientId: ids.client,
  publicationVersion: null,
  draftId: ids.draft,
  kind: "review",
};
