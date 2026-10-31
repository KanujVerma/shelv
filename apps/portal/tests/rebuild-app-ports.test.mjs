import test from "node:test";
import assert from "node:assert/strict";
import { createApplicationSession } from "../src/app/session.ts";
import { draftView, ids } from "./rebuild/advisor-fixture.mjs";
import { projectClientPlan } from "../../../src/contracts/PortalRebuild.ts";
const api = await import("../src/app/ports.ts").catch(() => ({}));
const source = await import("../src/app/preview.ts").catch(() => ({}));
const locks = { request: async (_, o, run) => run(o.signal) };
function setup(audience, reply) {
  const calls = [];
  let csrf = "csrf-1";
  const runtime = createApplicationSession({
    audience,
    locks,
    fetcher: async (url, options) => {
      assert.ok(
        [
          "/api/" + audience + "/session",
          "/api/" + audience + "/plans",
          "/api/advisor/operations",
          "/api/advisor/payments",
        ].includes(url),
        "unknown network " + url,
      );
      const command = options.body ? JSON.parse(options.body) : null;
      calls.push({ url, command, options });
      if (url.endsWith("/session"))
        return Response.json({
          signedIn: true,
          ownerId: ids.actor,
          generation: 1,
          capabilities: {
            view: true,
            edit: true,
            publish: true,
            confirmPayments: true,
          },
          csrf,
          idleExpiresAt: "2099-01-01T00:00:00Z",
          absoluteExpiresAt: "2099-01-02T00:00:00Z",
        });
      const result = await reply(command, url);
      return result instanceof Response ? result : Response.json(result);
    },
  });
  return {
    runtime,
    calls,
    relogin() {
      csrf = "new-csrf";
    },
  };
}
const preparation = {
  schemaVersion: 1,
  access: "preparation",
  plan: null,
  decisionRevision: 0,
  decisions: [],
  actualUse: [],
  nextReviewOn: null,
};
function gate(view, patch = {}) {
  return {
    schemaVersion: 1,
    clientId: ids.client,
    target: view.target,
    publisher: { kind: "human", actorId: ids.actor },
    approval: null,
    publication: "first",
    coverage: "inactive",
    capabilities: {
      actorId: ids.actor,
      view: true,
      edit: false,
      assign: false,
      review: false,
      approve: false,
      publish: false,
      confirmPayments: false,
    },
    policy: {
      revision: 1,
      ownerActorId: ids.actor,
      requireKanujApproval: true,
    },
    ...patch,
  };
}
test("typed operation seam exists", () =>
  assert.equal(typeof api.createClientPorts, "function"));
test("client uses only owner-derived fixed read and strict response; no private fields or advisor command", async () => {
  const f = setup("client", () => preparation);
  try {
    await f.runtime.restore();
    const p = api.createClientPorts(f.runtime);
    assert.deepEqual(
      await p.read.execute({
        schemaVersion: 1,
        action: "read_client_plan_v1",
        version: null,
      }),
      preparation,
    );
    const op = f.calls.at(-1);
    assert.equal(op.url, "/api/client/plans");
    assert.equal(op.options.headers["X-Shelv-CSRF"], "csrf-1");
    assert.equal(op.options.credentials, "same-origin");
    assert.equal(op.options.redirect, "error");
    assert.equal(op.options.cache, "no-store");
    for (const input of [
      {
        schemaVersion: 1,
        action: "read_client_plan_v1",
        version: null,
        clientId: ids.client,
      },
      { schemaVersion: 1, action: "read_policy_v1" },
      {
        schemaVersion: 1,
        action: "read_client_plan_v1",
        version: null,
        role: "owner",
      },
    ])
      await assert.rejects(p.read.execute(input));
    assert.equal(f.calls.length, 2);
  } finally {
    f.runtime.dispose();
  }
  const bad = setup("client", () => ({
    ...preparation,
    privateNotes: "never client",
  }));
  try {
    await bad.runtime.restore();
    await assert.rejects(
      api
        .createClientPorts(bad.runtime)
        .read.execute({
          schemaVersion: 1,
          action: "read_client_plan_v1",
          version: null,
        }),
    );
  } finally {
    bad.runtime.dispose();
  }
});
test("decision receipt binds exact request/choice; acknowledgement cannot fabricate money/use/notifications", async () => {
  const cmd = {
    schemaVersion: 1,
    action: "record_decision_v1",
    requestId: ids.receipt,
    expectedDecisionRevision: 0,
    publicationVersion: 1,
    decisionId: "decision-1",
    choice: "approved",
    reason: null,
  };
  for (const malicious of [false, true]) {
    const f = setup("client", () => ({
      requestId: ids.receipt,
      decisionRevision: 1,
      publicationVersion: 1,
      decisionId: "decision-1",
      choice: malicious ? "declined" : "approved",
      reason: null,
    }));
    try {
      await f.runtime.restore();
      const p = api.createClientPorts(f.runtime);
      if (malicious) await assert.rejects(p.decision.execute(cmd));
      else assert.equal(await p.decision.execute(cmd), undefined);
      assert.deepEqual(f.calls.at(-1).command, cmd);
      assert.equal(f.calls.length, 2);
    } finally {
      f.runtime.dispose();
    }
  }
});
test("assigned authority uses server gate; unassigned human bootstrap never grants approval", async () => {
  const view = draftView(true),
    f = setup("advisor", (c) =>
      c.action === "read_advisor_gate_v1" ? gate(view) : view,
    );
  try {
    await f.runtime.restore();
    const a = api.createAdvisorPorts(f.runtime);
    assert.equal(a.permissions.approve, false);
    assert.equal(a.permissions.assign, true);
    await a.ports.plans.execute({
      schemaVersion: 1,
      action: "read_draft_v1",
      draftId: ids.draft,
    });
    assert.equal(a.permissions.edit, false);
    assert.equal(a.permissions.approve, false);
    assert.deepEqual(
      await a.ports.context.execute({
        clientId: ids.client,
        draftId: ids.draft,
        target: view.target,
      }),
      {
        clientId: ids.client,
        approval: null,
        publication: "first",
        coverage: "inactive",
      },
    );
    assert.equal(f.calls.at(-1).command.publisher.actorId, ids.actor);
  } finally {
    f.runtime.dispose();
  }
});
test("wrong actor/target and reverse gate delivery cannot grant permissions", async () => {
  let release;
  const wait = new Promise((r) => (release = r));
  let n = 0;
  const v = draftView(true),
    f = setup("advisor", async (c) => {
      if (c.action === "read_draft_v1") return v;
      if (++n === 2) {
        await wait;
        return gate(v, {
          capabilities: { ...gate(v).capabilities, approve: true },
        });
      }
      return gate(v);
    });
  try {
    await f.runtime.restore();
    const a = api.createAdvisorPorts(f.runtime);
    await a.ports.plans.execute({
      schemaVersion: 1,
      action: "read_draft_v1",
      draftId: ids.draft,
    });
    const input = {
      clientId: ids.client,
      draftId: ids.draft,
      target: v.target,
    };
    const old = a.ports.context.execute(input);
    await new Promise((r) => setImmediate(r));
    await a.ports.context.execute(input);
    release();
    await assert.rejects(old);
    assert.equal(a.permissions.approve, false);
    await assert.rejects(
      a.ports.context.execute({ ...input, clientId: ids.other }),
    );
  } finally {
    release();
    f.runtime.dispose();
  }
});
test("actual factory 503 keeps write identity/manual memory; same-owner relogin rejects late response before mapper", async () => {
  let release;
  const wait = new Promise((r) => (release = r)),
    f = setup("client", async () => {
      await wait;
      return preparation;
    });
  try {
    await f.runtime.restore();
    const b = f.runtime.getSnapshot().boundary;
    b.memory.set("manual", "private");
    const pending = api
      .createClientPorts(f.runtime)
      .read.execute({
        schemaVersion: 1,
        action: "read_client_plan_v1",
        version: null,
      });
    await new Promise((r) => setImmediate(r));
    f.relogin();
    await f.runtime.restore();
    release();
    await assert.rejects(pending, (e) => e.status === 401);
    assert.equal(b.memory.get("manual"), undefined);
  } finally {
    release();
    f.runtime.dispose();
  }
  const down = setup("advisor", () =>
    Response.json({ code: "unavailable" }, { status: 503 }),
  );
  try {
    await down.runtime.restore();
    const b = down.runtime.getSnapshot().boundary;
    b.memory.set("manual", "private");
    const a = api.createAdvisorPorts(down.runtime);
    await assert.rejects(
      a.ports.plans.execute({
        schemaVersion: 1,
        action: "create_draft_v1",
        requestId: ids.receipt,
        kind: "care_plan",
        templateVersionId: null,
      }),
      (e) => e.status === 503 && e.outcome === "uncertain",
    );
    assert.equal(b.memory.get("manual"), "private");
    assert.equal(b.isCurrent(), true);
  } finally {
    down.runtime.dispose();
  }
});
test("preview stores only safe projection plus actual nested draft source and binds null targets to the request", () => {
  const v = draftView(false),
    p = {
      mode: "advisor-preview",
      published: false,
      target: null,
      content: projectClientPlan(v.draft.content),
      issues: v.issues,
    };
  const record = source.bindPreview(
    p,
    v,
    { draftId: ids.draft, contentRevision: 1, assignmentRevision: 0 },
    "epoch",
  );
  assert.deepEqual(record.source, {
    draftId: ids.draft,
    contentRevision: 1,
    assignmentRevision: 0,
    target: null,
  });
  assert.equal("draft" in record, false);
  assert.equal("savedAt" in record.source, false);
  assert.equal("version" in record.preview, false);
  assert.throws(() =>
    source.bindPreview(
      p,
      v,
      { draftId: ids.other, contentRevision: 1, assignmentRevision: 0 },
      "epoch",
    ),
  );
  assert.throws(() =>
    source.bindPreview(
      { ...p, privateNotes: "secret" },
      v,
      { draftId: ids.draft, contentRevision: 1, assignmentRevision: 0 },
      "epoch",
    ),
  );
});
test("direct preview entry fetches actual draft/preview and rejects a changed unassigned source basis", async () => {
  assert.equal(typeof source.loadPreview, "function");
  for (const stale of [false, true]) {
    const v = draftView(false),
      calls = [],
      b = { key: "epoch", isCurrent: () => true };
    const record = source.loadPreview(
      {
        execute: async (c) => {
          calls.push(c);
          if (c.action === "preview_draft_v1")
            return {
              mode: "advisor-preview",
              published: false,
              target: null,
              content: projectClientPlan(v.draft.content),
              issues: v.issues,
            };
          return calls.length > 2 && stale
            ? { ...v, draft: { ...v.draft, contentRevision: 2 } }
            : v;
        },
      },
      ids.draft,
      b,
    );
    if (stale) await assert.rejects(record);
    else assert.equal((await record).source.contentRevision, 1);
    assert.deepEqual(
      calls.map((c) => c.action),
      ["read_draft_v1", "preview_draft_v1", "read_draft_v1"],
    );
  }
});
test("reverse draft delivery cannot replace newer selected target/capabilities at the actual port boundary", async () => {
  let release;
  const wait = new Promise((r) => (release = r)),
    a = draftView(true),
    b = structuredClone(a);
  b.draft.id = ids.other;
  b.target.draftId = ids.other;
  const f = setup("advisor", async (c) => {
    if (c.action === "read_draft_v1") {
      if (c.draftId === ids.draft) {
        await wait;
        return a;
      }
      return b;
    }
    const v = c.target.draftId === ids.other ? b : a;
    return gate(v, {
      capabilities: {
        ...gate(v).capabilities,
        edit: c.target.draftId === ids.draft,
      },
    });
  });
  try {
    await f.runtime.restore();
    const ports = api.createAdvisorPorts(f.runtime);
    const first = ports.ports.plans.execute({
      schemaVersion: 1,
      action: "read_draft_v1",
      draftId: ids.draft,
    });
    await new Promise((r) => setImmediate(r));
    await ports.ports.plans.execute({
      schemaVersion: 1,
      action: "read_draft_v1",
      draftId: ids.other,
    });
    assert.equal(ports.permissions.edit, false);
    release();
    await first;
    assert.equal(ports.permissions.edit, false);
    assert.equal(
      (
        await ports.ports.context.execute({
          clientId: ids.client,
          draftId: ids.other,
          target: b.target,
        })
      ).clientId,
      ids.client,
    );
  } finally {
    release();
    f.runtime.dispose();
  }
});
test("actual W2 controller plus ports keeps B and refuses A context after reverse draft delivery", async () => {
  const { createAdvisorController } = await import(
    "../src/features/advisor/controller.ts"
  );
  let release;
  const wait = new Promise((r) => (release = r)),
    a = draftView(true),
    b = structuredClone(a);
  b.draft.id = ids.other;
  b.target.draftId = ids.other;
  const f = setup("advisor", async (c) => {
    if (c.action === "advisor_read")
      return {
        schemaVersion: 2,
        revision: 0,
        quotes: [],
        claims: [],
        service: { status: "unpaid", period: null },
        nextServicePeriod: null,
        shippingAddress: null,
        shippingAddresses: [],
      };
    if (c.action === "read_draft_v1") {
      if (c.draftId === ids.draft) {
        await wait;
        return a;
      }
      return b;
    }
    return gate(c.target.draftId === ids.other ? b : a);
  });
  let c;
  try {
    await f.runtime.restore();
    const ports = api.createAdvisorPorts(f.runtime);
    c = createAdvisorController({
      session: f.runtime.getSnapshot().boundary,
      permissions: ports.permissions,
      ports: ports.ports,
    });
    const first = c.open(ids.draft);
    await new Promise((r) => setImmediate(r));
    await c.open(ids.other);
    release();
    await first;
    assert.equal(c.getSnapshot().view.draft.id, ids.other);
    assert.equal(ports.permissions.edit, false);
    await c.refreshContext();
    assert.equal(c.getSnapshot().context.clientId, ids.client);
    assert.equal(c.getSnapshot().notice, null);
  } finally {
    release();
    c?.dispose();
    f.runtime.dispose();
  }
});
test("v1/v2 payment receipts use their exact mapper and never fabricate publication or use", async () => {
  for (const v2 of [false, true]) {
    const command = {
      action: "confirm_payment",
      requestId: ids.receipt,
      clientId: ids.client,
      expectedRevision: 1,
      quoteId: ids.quote,
      quoteVersion: 1,
      shippingAddressVersion: null,
      claimId: ids.claim,
      serviceCents: 10000,
      productCents: 0,
      totalCents: 10000,
      ...(v2
        ? {
            schemaVersion: 2,
            paymentOptionId: ids.event,
            receiptVerified: true,
          }
        : { bankReceiptVerified: true }),
    };
    const receipt = {
      revision: 2,
      operation: "confirm_payment",
      quoteId: ids.quote,
      claimId: ids.claim,
      status: "confirmed",
      serviceUnlocked: false,
      serviceAccessStatus: "pending_publication",
      productOrderStatus: null,
      ...(v2 ? { schemaVersion: 2, paymentOptionId: ids.event } : {}),
    };
    const f = setup("advisor", () => receipt);
    try {
      await f.runtime.restore();
      const ports = api.createAdvisorPorts(f.runtime);
      assert.deepEqual(await ports.ports.payments.execute(command), receipt);
      assert.deepEqual(f.calls.at(-1).command, command);
      assert.equal(f.calls.length, 2);
      await assert.rejects(
        ports.ports.payments.execute({ ...command, approved: true }),
      );
      assert.equal(f.calls.length, 2);
    } finally {
      f.runtime.dispose();
    }
  }
});
test("publication audit read binds canonical client/version and never accepts mutable draft or private fields", async () => {
  const v = draftView(true),
    published = {
      schemaVersion: 1,
      clientId: ids.client,
      version: 3,
      plan: {
        documentSchemaVersion: 3,
        version: 3,
        publishedAt: "2026-10-30T12:00:00Z",
        content: projectClientPlan(v.draft.content),
      },
      decisionRevision: 0,
      decisions: [],
      actualUse: [],
      nextReviewOn: null,
      reviewSchedule: null,
      clientAccess: {
        care: "ended",
        entitled: false,
        canRead: false,
        canWrite: false,
      },
    };
  for (const wrong of [false, true]) {
    const f = setup("advisor", () =>
      wrong ? { ...published, clientId: ids.other } : published,
    );
    try {
      await f.runtime.restore();
      const read = api
        .createAdvisorPorts(f.runtime)
        .publication.execute({
          schemaVersion: 1,
          action: "read_advisor_publication_v1",
          clientId: ids.client,
          version: 3,
        });
      if (wrong) await assert.rejects(read);
      else assert.deepEqual(await read, published);
    } finally {
      f.runtime.dispose();
    }
  }
});
test("selection ordering never disables recoverable manual editing after an uncertain actual cookie save", async () => {
  const { createAdvisorController } = await import(
    "../src/features/advisor/controller.ts"
  );
  const v = draftView(false);
  let down = false,
    c;
  const f = setup("advisor", () =>
    down ? Response.json({ code: "unavailable" }, { status: 503 }) : v,
  );
  try {
    await f.runtime.restore();
    const a = api.createAdvisorPorts(f.runtime);
    c = createAdvisorController({
      session: f.runtime.getSnapshot().boundary,
      permissions: a.permissions,
      ports: a.ports,
    });
    await c.open(ids.draft);
    c.edit((x) => ({ ...x, title: "manual before outage" }));
    down = true;
    await c.save();
    assert.equal(c.getSnapshot().save, "uncertain");
    const request = c.getSnapshot().pending;
    assert.ok(request.requestId);
    c.edit((x) => ({ ...x, summary: "manual after outage" }));
    assert.equal(c.getSnapshot().local.summary, "manual after outage");
    assert.deepEqual(c.getSnapshot().pending, request);
  } finally {
    c?.dispose();
    f.runtime.dispose();
  }
});
test("ports created for an old login cannot start new commands after same-owner relogin", async () => {
  const f = setup("client", () => preparation);
  try {
    await f.runtime.restore();
    const old = api.createClientPorts(f.runtime);
    f.relogin();
    await f.runtime.restore();
    const count = f.calls.length;
    await assert.rejects(
      old.read.execute({
        schemaVersion: 1,
        action: "read_client_plan_v1",
        version: null,
      }),
      (e) => e.status === 401,
    );
    assert.equal(f.calls.length, count);
    assert.deepEqual(
      await api
        .createClientPorts(f.runtime)
        .read.execute({
          schemaVersion: 1,
          action: "read_client_plan_v1",
          version: null,
        }),
      preparation,
    );
  } finally {
    f.runtime.dispose();
  }
});
