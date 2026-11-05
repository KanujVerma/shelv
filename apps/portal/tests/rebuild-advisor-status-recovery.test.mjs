import test from "node:test";
// SYNTHETIC / DO NOT FULFILL. Actual cookie session, transport, application ports,
// strict mappers and controller. Only finite HTTP DTOs/delivery are synthetic.
import assert from "node:assert/strict";
import { createApplicationSession } from "../src/app/session.ts";
import { createAdvisorPorts } from "../src/app/ports.ts";
import { createAdvisorController } from "../src/features/advisor/controller.ts";
import { fixture, ids } from "./rebuild/advisor-fixture.mjs";
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
const unavailable = (status) => () =>
  Response.json({ code: "unavailable" }, { status });

async function recoveryApp(t) {
  const f = fixture({ ready: true }),
    calls = [],
    holds = [];
  const login = {
    signedIn: true,
    ownerId: ids.actor,
    generation: 1,
    csrf: "SYNTHETIC-recovery",
    capabilities: {
      view: true,
      edit: true,
      publish: true,
      confirmPayments: true,
    },
    idleExpiresAt: "2099-01-01T00:00:00Z",
    absoluteExpiresAt: "2099-01-02T00:00:00Z",
  };
  const caps = {
    actorId: ids.actor,
    view: true,
    edit: true,
    assign: true,
    review: true,
    approve: true,
    publish: true,
    confirmPayments: true,
  };
  let policy = {
    revision: 1,
    ownerActorId: ids.actor,
    requireKanujApproval: true,
  };
  let time = Date.now();
  const runtime = createApplicationSession({
    audience: "advisor",
    now: () => time,
    locks: { request: async (_, o, run) => run(o.signal) },
    fetcher: async (url, o) => {
      assert.ok(
        [
          "/api/advisor/session",
          "/api/advisor/logout",
          "/api/advisor/plans",
          "/api/advisor/operations",
          "/api/advisor/payments",
        ].includes(url),
        "unexpected destination",
      );
      if (url === "/api/advisor/session") return Response.json(login);
      if (url === "/api/advisor/logout")
        return Response.json({ signedOut: true });
      assert.equal(o.credentials, "same-origin");
      assert.equal(o.headers["X-Shelv-CSRF"], login.csrf);
      const command = JSON.parse(o.body);
      calls.push({ command, bytes: o.body });
      let result;
      if (url === "/api/advisor/plans") {
        result =
          command.action === "read_advisor_gate_v1"
            ? {
                schemaVersion: 1,
                clientId: command.target.clientId,
                target: command.target,
                publisher: command.publisher,
                approval: f.context.approval,
                publication: f.context.publication,
                coverage: f.context.coverage,
                capabilities: { ...caps },
                policy: { ...policy },
              }
            : await f.options.ports.plans.execute(command);
      } else if (url === "/api/advisor/operations") {
        assert.equal(command.action, "advisor_list");
        result = await f.options.ports.clients.execute(command);
      } else if (command.action === "advisor_read") {
        const p = await f.options.ports.paymentRead.execute(command);
        result = {
          ...p,
          schemaVersion: 2,
          quotes: p.quotes.map((q) => ({
            ...q,
            contractVersion: 1,
            paymentOptions: [],
          })),
          claims: p.claims.map((c) => ({ ...c, paymentOptionId: null })),
        };
      } else {
        assert.equal(command.action, "confirm_payment");
        result = await f.options.ports.payments.execute(command);
      }
      result = structuredClone(result);
      const held = holds.find((h) => !h.used && h.action === command.action);
      if (held) {
        held.used = true;
        held.signal = o.signal;
        held.dto = structuredClone(result);
        held.ready.resolve();
        await held.done.promise;
        result = held.transform(result);
      }
      return result instanceof Response ? result : Response.json(result);
    },
  });
  await runtime.restore();
  const adapter = createAdvisorPorts(runtime),
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
    runtime,
    adapter,
    boundary,
    login,
    caps,
    calls,
    get c() {
      return c;
    },
    expire() {
      time = Date.parse("2099-01-03T00:00:00Z");
    },
    setPolicy(patch) {
      policy = { ...policy, ...patch };
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
      return {
        ready: h.ready.promise,
        release: () => h.done.resolve(),
        get dto() {
          return h.dto;
        },
        get signal() {
          return h.signal;
        },
      };
    },
  };
}

async function uncertainApproval(h) {
  h.f.context.publication = "later";
  h.f.context.coverage = "active";
  await h.c.open(ids.draft);
  await h.c.refreshContext();
  assert.equal(
    h.adapter.permissions.approve,
    true,
    "default assigned first open",
  );
  assert.equal(h.c.getSnapshot().context.approval, null);
  const held = h.hold("approve_publication_v1", (v) => ({
    ...v,
    unsupported: true,
  }));
  const approving = h.c.approve();
  await held.ready;
  const command = h.c.getSnapshot().pending,
    bytes = JSON.stringify(command);
  assert.match(command.requestId, /^[0-9a-f-]{36}$/);
  held.release();
  await approving;
  assert.equal(h.c.getSnapshot().save, "uncertain");
  assert.equal(h.c.getSnapshot().pending, command);
  // Actual current read learns the committed A. A remains uncertain/pending.
  await h.c.refreshContext();
  assert.ok(h.c.getSnapshot().context.approval);
  assert.equal(h.c.canPublish(), false);
  return { command, bytes, receipt: held.dto };
}

// A lookup error cannot decide the outcome of an already-issued command.
// Returning fail(e, true) from reconcile is the mutation each assertion catches.
async function lookup(h, status = 403, transform) {
  assert.ok(
    h.c.getSnapshot().pending,
    "lookup requires original pending command",
  );
  const held = h.hold("request_status_v1", transform ?? unavailable(status));
  const running = h.c.reconcile();
  await held.ready;
  held.release();
  await running;
}
function retained(h, a) {
  const s = h.c.getSnapshot();
  assert.equal(
    s.pending,
    a.command,
    "original uncertain intent remains recoverable",
  );
  assert.equal(
    JSON.stringify(s.pending),
    a.bytes,
    "original UUID and payload are intact",
  );
  assert.equal(
    s.save,
    "uncertain",
    "failed status read does not decide original write outcome",
  );
  assert.equal(s.busy, false);
  assert.equal(h.c.canPublish(), false);
  assert.equal(h.c.canApprove(), false);
  assert.equal(h.c.canReview(), false);
  const lookups = h.calls.filter(
    (x) => x.command.action === "request_status_v1",
  );
  assert.ok(lookups.length);
  for (const x of lookups)
    assert.deepEqual(x.command, {
      schemaVersion: 1,
      action: "request_status_v1",
      requestId: a.command.requestId,
    });
}
for (const restriction of ["approval", "coverage"])
  for (const order of ["failure-first", "authority-first"])
    test(`403 ${restriction} ${order}: lookup denial retains intent and current restrictive authority`, async (t) => {
      const h = await recoveryApp(t),
        a = await uncertainApproval(h);
      h.f.context[restriction] = restriction === "approval" ? null : "inactive";
      const gate = h.hold("read_advisor_gate_v1"),
        reading = h.c.refreshContext();
      await gate.ready;
      if (order === "authority-first") {
        gate.release();
        await reading;
      }
      await lookup(h);
      assert.equal(h.c.getSnapshot().notice.kind, "denied");
      retained(h, a);
      if (order === "failure-first") {
        gate.release();
        await reading;
      }
      retained(h, a);
      assert.equal(
        h.c.getSnapshot().context[restriction],
        restriction === "approval" ? null : "inactive",
      );
      assert.equal(
        h.c.getSnapshot().notice.kind,
        "denied",
        "a pending lookup denial is not an obsolete context notice",
      );
      await h.c.publish();
      assert.equal(
        h.calls.some((x) => x.command.action === "publish_plan_v1"),
        false,
      );
      assert.equal(
        h.calls.filter((x) => x.command.action === "approve_publication_v1")
          .length,
        1,
      );
    });
for (const status of [400, 404, 429, 409, 503])
  test(`status ${status}: failed lookup preserves uncertainty, comparison semantics and exact retry`, async (t) => {
    const h = await recoveryApp(t),
      a = await uncertainApproval(h);
    await lookup(h, status);
    retained(h, a);
    const s = h.c.getSnapshot();
    assert.equal(s.notice.kind, status === 409 ? "conflict" : "error");
    assert.equal(s.needsComparison, status === 409);
    if (status === 503) await h.runtime.restore();
    h.f.context.approval = null;
    await h.c.refreshContext();
    retained(h, a);
    assert.equal(h.c.getSnapshot().context.approval, null);
    assert.equal(h.c.getSnapshot().notice, s.notice);
    await h.c.retry();
    assert.equal(h.c.getSnapshot().pending, null);
    assert.deepEqual(
      h.calls
        .filter((x) => x.command.action === "approve_publication_v1")
        .map((x) => x.bytes),
      [a.bytes, a.bytes],
    );
    assert.equal(
      h.c.canPublish(),
      false,
      "immutable approval receipt cannot replace current null approval",
    );
    h.f.context.approval = a.receipt;
    await h.c.refreshContext();
    assert.equal(
      h.c.canPublish(),
      status !== 409,
      "a current gate recovers authority but cannot waive a real comparison requirement",
    );
    assert.equal(h.c.getSnapshot().needsComparison, status === 409);
  });
test("positive absent status preserves original uncertainty and denial until a positive exact receipt", async (t) => {
  const h = await recoveryApp(t),
    a = await uncertainApproval(h);
  await lookup(h);
  const denied = h.c.getSnapshot().notice;
  await lookup(h, 200, () => ({ status: "absent" }));
  retained(h, a);
  assert.equal(h.c.getSnapshot().notice, denied);
  await h.c.reconcile();
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(h.c.getSnapshot().save, "saved");
  assert.equal(
    h.calls.filter((x) => x.command.action === "approve_publication_v1").length,
    1,
  );
});
test("remount after lookup denial retains exact bytes; receipt retires unknown authority; current refresh recovers", async (t) => {
  const h = await recoveryApp(t),
    a = await uncertainApproval(h);
  await lookup(h);
  h.remount();
  retained(h, a);
  assert.equal(h.c.getSnapshot().context, null);
  await h.c.reconcile();
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(h.c.canPublish(), false);
  await h.c.refreshContext();
  assert.equal(h.c.canPublish(), true);
});
for (const response of ["malformed", "wrong-receipt"])
  test(`${response} status success cannot acknowledge the original command`, async (t) => {
    const h = await recoveryApp(t),
      a = await uncertainApproval(h);
    await lookup(h, 200, (v) =>
      response === "malformed"
        ? { ...v, unsupported: true }
        : { ...v, receipt: { ...v.receipt, draftId: ids.other } },
    );
    retained(h, a);
    await h.runtime.restore();
    await h.c.reconcile();
    assert.equal(h.c.getSnapshot().pending, null);
  });

async function uncertainWrite(h, action) {
  if (action !== "create_draft_v1") await h.c.open(ids.draft);
  if (action === "save_draft_v1")
    h.c.edit((v) => ({ ...v, summary: "original manual A" }));
  if (action === "apply_import_v1")
    await h.c.compare({
      ...h.c.getSnapshot().local,
      summary: "compared proposal A",
    });
  if (action === "publish_plan_v1") {
    await h.c.refreshContext();
    await h.c.approve();
    await h.c.refreshContext();
    h.f.context.payments.claims[0].status = "confirmed";
    h.f.context.payments.service.status = "pending_publication";
    await h.c.refreshContext();
    assert.equal(h.c.canPublish(), true);
  }
  const held = h.hold(action, (v) => ({ ...v, unsupported: true }));
  const run =
    h.c[
      action === "create_draft_v1"
        ? "create"
        : action === "save_draft_v1"
          ? "save"
          : action === "apply_import_v1"
            ? "applyImport"
            : "publish"
    ]();
  await held.ready;
  const command = h.c.getSnapshot().pending,
    bytes = JSON.stringify(command);
  held.release();
  await run;
  assert.equal(h.c.getSnapshot().save, "uncertain");
  return {
    command,
    bytes,
    wireBytes: h.calls.findLast((x) => x.command.action === action).bytes,
  };
}
for (const action of [
  "create_draft_v1",
  "save_draft_v1",
  "apply_import_v1",
  "publish_plan_v1",
])
  test(`${action}: lookup denial cannot lose intent or unlock another write`, async (t) => {
    const h = await recoveryApp(t),
      a = await uncertainWrite(h, action);
    const local = h.c.getSnapshot().local;
    await lookup(h);
    retained(h, a);
    assert.equal(h.c.getSnapshot().local, local);
    const count = h.calls.length;
    await h.c.create();
    await h.c.save();
    await h.c.applyImport();
    await h.c.approve();
    await h.c.publish();
    assert.equal(
      h.calls.length,
      count,
      "pending original blocks a fresh write or UUID",
    );
    retained(h, a);
    await h.c.retry();
    assert.equal(h.c.getSnapshot().pending, null);
    assert.deepEqual(
      h.calls.filter((x) => x.command.action === action).map((x) => x.bytes),
      [a.wireBytes, a.wireBytes],
    );
  });

for (const boundary of [
  "401",
  "owner",
  "csrf",
  "logout",
  "role",
  "expiry",
  "actor",
  "view",
  "manual",
  "draft",
  "retry",
  "new-operation",
])
  test(`held lookup error respects ${boundary} boundary`, async (t) => {
    const h = await recoveryApp(t),
      a = await uncertainWrite(h, "save_draft_v1");
    const held = h.hold(
        "request_status_v1",
        unavailable(boundary === "401" ? 401 : 403),
      ),
      checking = h.c.reconcile();
    await held.ready;
    if (["owner", "csrf"].includes(boundary)) {
      if (boundary === "owner") h.login.ownerId = ids.other;
      h.login.csrf = "SYNTHETIC-new-lease";
      await h.runtime.restore();
    } else if (boundary === "logout") await h.runtime.signOut();
    else if (boundary === "role") h.runtime.cookie.identity.role = "client";
    else if (boundary === "expiry") h.expire();
    else if (boundary === "actor") h.adapter.permissions.actorId = ids.other;
    else if (boundary === "view") h.adapter.permissions.view = false;
    else if (boundary === "manual")
      h.c.edit((v) => ({ ...v, summary: "new manual B" }));
    else if (boundary === "draft")
      await h.c.open(ids.other); // blocked while A is uncertain
    else if (boundary === "retry" || boundary === "new-operation") {
      await h.c.retry();
      if (boundary === "new-operation") {
        h.c.edit((v) => ({ ...v, summary: "new operation B" }));
        const next = h.hold("save_draft_v1", unavailable(503)),
          writing = h.c.save();
        await next.ready;
        const b = h.c.getSnapshot().pending;
        held.release();
        await checking;
        assert.equal(h.c.getSnapshot().pending, b);
        assert.equal(h.c.getSnapshot().busy, true);
        next.release();
        await writing;
        assert.equal(h.c.getSnapshot().pending, b);
        assert.equal(h.c.getSnapshot().save, "uncertain");
        return;
      }
    }
    const before = h.c.getSnapshot();
    held.release();
    await checking;
    const after = h.c.getSnapshot();
    if (
      ["401", "owner", "csrf", "logout", "role", "expiry"].includes(boundary)
    ) {
      assert.equal(after.ended, true);
      assert.equal(after.pending, null);
      assert.equal(after.local, null);
      assert.equal(h.boundary.isCurrent(), false);
    } else if (boundary === "draft") {
      assert.equal(after.view.draft.id, ids.draft);
      retained(h, a);
    } else {
      assert.deepEqual(
        after,
        before,
        "obsolete recovery cannot alter newer/manual/private state",
      );
      if (boundary === "manual")
        assert.equal(after.local.summary, "new manual B");
    }
  });
