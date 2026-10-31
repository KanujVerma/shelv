// SYNTHETIC / DO NOT FULFILL. Only finite HTTP responses are controlled.
// The application session, cookie factories, transport, parsers, mappers,
// adapter and advisor controller are the production implementations.
import assert from "node:assert/strict";
import { createApplicationSession } from "../src/app/session.ts";
import { createAdvisorPorts } from "../src/app/ports.ts";
import { createAdvisorController } from "../src/features/advisor/controller.ts";
import { projectClientPlan } from "../../../src/contracts/PortalRebuild.ts";
import { fixture, ids, stamp, hash } from "./rebuild/advisor-fixture.mjs";
export { ids };
export const product = {
  kind: "client_reported_product",
  reportedProductId: "20000000-0000-4000-8000-000000000001",
  version: 1,
};
export const descriptor = {
  name: "CeraVe PM SYNTHETIC",
  brand: { state: "known", value: "CeraVe" },
  variant: { state: "unknown" },
  strength: { state: "unknown" },
  sizeLabel: { state: "unknown" },
  labelPhotoIds: [],
};
const eventId = "20000000-0000-4000-8000-000000000002";
export const original = {
  eventId,
  product,
  change: {
    kind: "different",
    frequency: { state: "known", value: "twice a week" },
    amount: { state: "unknown" },
    details: "client reported dryness",
  },
  sourcePublication: { version: 1, documentSchemaVersion: 3 },
  reportedBy: ids.client,
  recordedBy: ids.actor,
  channel: "call",
  occurredOn: { state: "unknown" },
  recordedAt: stamp,
  acquisition: "self",
  identityEventId: null,
  originalActivationId: null,
  amendment: {
    id: "20000000-0000-4000-8000-000000000003",
    eventId,
    previousAmendmentHeadId: null,
    replacement: {
      product,
      change: {
        kind: "different",
        frequency: { state: "known", value: "once a week" },
        amount: { state: "known", value: "a small amount" },
        details: "corrected report",
      },
      sourcePublication: { version: 1, documentSchemaVersion: 3 },
      occurredOn: { state: "unknown" },
      acquisition: "self",
      identityEventId: null,
    },
    amendedBy: ids.other,
    amendedAt: stamp,
    reason: "correct frequency and amount",
  },
};
const { change, amendment, ...event } = original;
const { replacement, reason: _reason, ...amendmentBody } = amendment;
const { change: correctedChange, ...correctedBody } = replacement;
export const summary = {
  ...event,
  changeKind: change.kind,
  amendment: {
    ...amendmentBody,
    ...correctedBody,
    changeKind: correctedChange.kind,
  },
};
export function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}
export async function dependencyApp(t, { care = true, assigned = true } = {}) {
  const f = fixture({ ready: assigned }),
    calls = [],
    holds = [],
    receipts = new Map();
  let view = f.getView();
  view.draft.basis = {
    publicationVersion: assigned ? 1 : null,
    useRevision: 0,
  };
  f.setView(view);
  const base = {
    schemaVersion: 2,
    legacyBasis: { ...view.draft.basis },
    legacyBasisManifestHash: hash,
    useHead: 0,
    reportHead: 0,
    instructionHead: 0,
    references: [],
  };
  let captured = structuredClone(base),
    current = { ...structuredClone(base), useHead: 2 };
  let entries = [
      { kind: "use", event: original },
      { kind: "amendment", amendment },
    ],
    nextCursor = null,
    historyRevision = 2;
  const caps = { ...f.options.permissions };
  const login = {
    signedIn: true,
    ownerId: ids.actor,
    generation: 1,
    csrf: "SYNTHETIC-dependencies",
    capabilities: {
      view: true,
      edit: true,
      publish: true,
      confirmPayments: true,
    },
    idleExpiresAt: "2099-01-01T00:00:00Z",
    absoluteExpiresAt: "2099-01-02T00:00:00Z",
  };
  const runtime = createApplicationSession({
    audience: "advisor",
    locks: { request: async (_n, o, run) => run(o.signal) },
    fetcher: async (url, o) => {
      assert.ok(
        [
          "/api/advisor/session",
          "/api/advisor/logout",
          "/api/advisor/plans",
          "/api/advisor/care",
          "/api/advisor/payments",
          "/api/advisor/operations",
        ].includes(url),
        "unexpected endpoint " + url,
      );
      if (url.endsWith("/session")) return Response.json(login);
      if (url.endsWith("/logout")) return Response.json({ signedOut: true });
      assert.equal(o.credentials, "same-origin");
      assert.equal(new Headers(o.headers).get("x-shelv-csrf"), login.csrf);
      const c = JSON.parse(o.body);
      calls.push({ command: c, bytes: o.body, url });
      let result;
      if (c.action === "read_advisor_gate_v1")
        result = {
          schemaVersion: 1,
          clientId: c.target.clientId,
          target: c.target,
          publisher: c.publisher,
          approval: f.context.approval,
          publication: "later",
          coverage: "active",
          capabilities: { ...caps },
          policy: {
            revision: 1,
            ownerActorId: ids.actor,
            requireKanujApproval: true,
          },
        };
      else if (c.action === "read_draft_dependencies_v1")
        result = {
          draftId: c.draftId,
          contentRevision: c.contentRevision,
          assignmentRevision: c.assignmentRevision,
          captured,
          current,
          needsRebase: JSON.stringify(captured) !== JSON.stringify(current),
          affectedSections:
            JSON.stringify(captured) !== JSON.stringify(current)
              ? ["context", "decisions", "routine", "follow_up"]
              : [],
        };
      else if (c.action === "rebase_draft_dependencies_v1") {
        if (receipts.has(c.requestId)) result = receipts.get(c.requestId);
        else if (
          JSON.stringify(c.expectedHeads) !==
            JSON.stringify({
              useHead: current.useHead,
              reportHead: current.reportHead,
              instructionHead: current.instructionHead,
            }) ||
          c.expectedLegacyBasisManifestHash !==
            current.legacyBasisManifestHash ||
          JSON.stringify(c.expectedLegacyBasis) !==
            JSON.stringify(current.legacyBasis) ||
          c.expectedContentRevision !== f.getView().draft.contentRevision
        )
          result = Response.json(
            { code: "revision_conflict" },
            { status: 409 },
          );
        else {
          view = f.getView();
          view.draft.contentRevision++;
          view.draft.contentHash = "c".repeat(64);
          view.target = {
            ...view.target,
            contentRevision: view.draft.contentRevision,
            contentHash: view.draft.contentHash,
          };
          view.sections = view.sections.map((s) => ({ ...s, reviewed: false }));
          view.issues = [];
          captured = structuredClone(current);
          f.setView(view);
          f.context.approval = null;
          result = view;
          receipts.set(c.requestId, structuredClone(result));
        }
      } else if (c.action === "request_status_v1" && receipts.has(c.requestId))
        result = { status: "committed", receipt: receipts.get(c.requestId) };
      else if (c.action === "read_advisor_publication_v2")
        result = {
          schemaVersion: 2,
          clientId: c.clientId,
          version: 1,
          plan: {
            documentSchemaVersion: 3,
            version: 1,
            publishedAt: stamp,
            content: projectClientPlan(f.getView().draft.content),
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
          latestPublicReview: null,
          use: {
            revision: current.useHead,
            planProducts: [],
            reportedProducts: {
              items: [
                {
                  product,
                  descriptor,
                  state: "using_differently",
                  originalStart: { state: "unknown" },
                  latestEvent: summary,
                  identity: null,
                  contradiction: true,
                },
              ],
              nextCursor: null,
            },
          },
        };
      else if (c.action === "read_advisor_use_history_v1")
        result = { revision: historyRevision, entries, nextCursor };
      else if (c.action === "advisor_read") {
        const p = f.context.payments;
        result = {
          ...p,
          schemaVersion: 2,
          quotes: p.quotes.map((q) => ({
            ...q,
            contractVersion: 1,
            paymentOptions: [],
          })),
          claims: p.claims.map((x) => ({ ...x, paymentOptionId: null })),
        };
      } else if (c.action === "advisor_list")
        result = await f.options.ports.clients.execute(c);
      else result = await f.options.ports.plans.execute(c);
      result = result instanceof Response ? result : structuredClone(result);
      const held = holds.find((h) => !h.used && h.action === c.action);
      if (held) {
        held.used = true;
        held.ready.resolve();
        await held.done.promise;
        result = held.transform(result);
      }
      return result instanceof Response ? result : Response.json(result);
    },
  });
  await runtime.restore();
  const adapter = createAdvisorPorts(runtime, { care }),
    boundary = runtime.getSnapshot().boundary;
  let c;
  const mount = () =>
    createAdvisorController({
      session: boundary,
      permissions: adapter.permissions,
      ports: adapter.ports,
      onPreview() {},
    });
  c = mount();
  t.after(() => {
    holds.forEach((h) => h.done.resolve());
    c.dispose();
    adapter.dispose();
    runtime.dispose();
  });
  return {
    f,
    calls,
    caps,
    login,
    runtime,
    adapter,
    boundary,
    get c() {
      return c;
    },
    get current() {
      return current;
    },
    setCurrent(patch) {
      current = { ...current, ...patch };
    },
    setHistory(e, cursor = null, revision = current.useHead) {
      entries = e;
      nextCursor = cursor;
      historyRevision = revision;
    },
    remount() {
      c.dispose();
      c = mount();
      return c;
    },
    hold(action, transform = (v) => v) {
      const h = {
        action,
        transform,
        ready: deferred(),
        done: deferred(),
        used: false,
      };
      holds.push(h);
      return { ready: h.ready.promise, release: () => h.done.resolve() };
    },
  };
}
