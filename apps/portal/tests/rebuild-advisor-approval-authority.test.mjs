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
  const runtime = createApplicationSession({
    audience: "advisor",
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

function assertExactRecovery(h, original, recovery) {
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(h.c.getSnapshot().busy, false);
  const approvals = h.calls.filter(
    (c) => c.command.action === "approve_publication_v1",
  );
  assert.deepEqual(
    approvals.map((c) => c.bytes),
    recovery === "retry" ? [original.bytes, original.bytes] : [original.bytes],
  );
  if (recovery === "status") {
    const status = h.calls.filter(
      (c) => c.command.action === "request_status_v1",
    );
    assert.equal(status.length, 1);
    assert.equal(status[0].command.requestId, original.command.requestId);
  }
  assert.equal(
    h.calls.some((c) => c.command.action === "publish_plan_v1"),
    false,
  );
}

for (const outcome of [403, 409, 503, "malformed"])
  test(`C1 retry ${outcome}: invalidating C must retire authority even without a valid acknowledgement`, async (t) => {
    const h = await recoveryApp(t),
      original = await uncertainApproval(h);
    const gate = h.hold("read_advisor_gate_v1"),
      reading = h.c.refreshContext();
    await gate.ready;
    const ack = h.hold(
      "approve_publication_v1",
      outcome === "malformed"
        ? (v) => ({ ...v, unsupported: true })
        : unavailable(outcome),
    );
    const retrying = h.c.retry();
    await ack.ready;
    gate.release();
    await reading;
    ack.release();
    await retrying;
    assert.equal(
      h.c.canPublish(),
      false,
      "failed recovery must not resurrect C's earlier permissive authority",
    );
    assert.deepEqual(
      h.calls
        .filter((c) => c.command.action === "approve_publication_v1")
        .map((c) => c.bytes),
      [original.bytes, original.bytes],
    );
    assert.equal(h.c.getSnapshot().local.summary, "reviewed synthetic plan");
    if (outcome === 503 || outcome === "malformed") {
      assert.equal(h.c.getSnapshot().pending, original.command);
      assert.equal(h.c.getSnapshot().save, "uncertain");
    }
  });

for (const recovery of ["retry", "status"])
  for (const restriction of ["approval", "coverage"])
    for (const order of ["authority-first", "receipt-first"])
      for (const remount of [false, true])
        test(`C1 ${recovery} ${restriction} ${order}${remount ? " restored" : ""}: old receipt cannot leave publishable authority`, async (t) => {
          const h = await recoveryApp(t),
            original = await uncertainApproval(h);
          if (remount) {
            h.remount();
            assert.equal(h.c.getSnapshot().context, null);
            assert.equal(
              JSON.stringify(h.c.getSnapshot().pending),
              original.bytes,
            );
            await h.c.refreshContext();
          }
          if (restriction === "approval") h.f.context.approval = null;
          else h.f.context.coverage = "inactive";
          const held = h.hold("read_advisor_gate_v1"),
            reading = h.c.refreshContext();
          await held.ready;
          assert.equal(
            held.dto[restriction],
            restriction === "approval" ? null : "inactive",
          );
          if (order === "authority-first") {
            held.release();
            await reading;
          }
          await h.c[recovery === "retry" ? "retry" : "reconcile"]();
          assertExactRecovery(h, original, recovery);
          assert.equal(
            h.c.canPublish(),
            false,
            "acknowledgement must immediately retire unverified older authority",
          );
          if (order === "receipt-first") {
            held.release();
            await reading;
          }
          assert.equal(
            h.c.canPublish(),
            false,
            "delayed current restriction cannot leave the prior permissive context",
          );
          // Conservative retirement may discard C, but recovery must remain lawful.
          await h.c.refreshContext();
          assert.equal(
            h.c.getSnapshot().context[restriction],
            restriction === "approval" ? null : "inactive",
          );
          assert.equal(h.c.canPublish(), false);
          h.f.context.approval = original.receipt;
          h.f.context.coverage = "active";
          await h.c.refreshContext();
          assert.equal(
            h.c.canPublish(),
            true,
            "fresh real gate may restore eligibility without issuing a new approval",
          );
        });

for (const recovery of ["retry", "status"])
  for (const leg of ["read_advisor_gate_v1", "advisor_read"])
    for (const status of [403, 409, 503])
      test(`C1 ${recovery}: ${leg} ${status} after receipt cannot leave old eligibility`, async (t) => {
        const h = await recoveryApp(t),
          original = await uncertainApproval(h);
        const held = h.hold(leg, unavailable(status)),
          reading = h.c.refreshContext();
        await held.ready;
        await h.c[recovery === "retry" ? "retry" : "reconcile"]();
        assertExactRecovery(h, original, recovery);
        assert.equal(h.c.canPublish(), false);
        held.release();
        await reading;
        assert.equal(h.c.canPublish(), false);
      });

for (const recovery of ["retry", "status"])
  for (const restriction of [
    "policy",
    "source",
    "view",
    "publish",
    "wrong-target",
    "malformed-approval",
  ])
    test(`C1 ${recovery}: ${restriction} current gate held beyond immutable receipt`, async (t) => {
      const h = await recoveryApp(t),
        original = await uncertainApproval(h);
      if (restriction === "policy")
        h.setPolicy({ revision: 2, requireKanujApproval: true });
      if (restriction === "policy" || restriction === "source")
        h.f.context.approval = null;
      if (restriction === "view") h.caps.view = false;
      if (restriction === "publish") h.caps.publish = false;
      const held = h.hold("read_advisor_gate_v1", (v) =>
        restriction === "source"
          ? unavailable(403)()
          : restriction === "wrong-target"
            ? { ...v, target: { ...v.target, contentHash: "b".repeat(64) } }
            : restriction === "malformed-approval"
              ? { ...v, approval: { ...v.approval, unsupported: true } }
              : v,
      );
      const reading = h.c.refreshContext();
      await held.ready;
      await h.c[recovery === "retry" ? "retry" : "reconcile"]();
      assertExactRecovery(h, original, recovery);
      assert.equal(
        h.c.canPublish(),
        false,
        "unresolved newer gate must block even before delivery",
      );
      held.release();
      await reading;
      assert.equal(h.c.canPublish(), false);
    });

for (const recovery of ["retry", "status"])
  for (const change of [
    "owner",
    "csrf",
    "logout",
    "actor",
    "view",
    "new-operation",
    "new-draft",
    "manual",
  ])
    test(`C1 ${recovery}: receipt retirement retains ${change} and stale-read fences`, async (t) => {
      const h = await recoveryApp(t),
        original = await uncertainApproval(h);
      const held = h.hold("advisor_read"),
        reading = h.c.refreshContext();
      await held.ready;
      await new Promise((r) => setImmediate(r));
      await h.c[recovery === "retry" ? "retry" : "reconcile"]();
      assertExactRecovery(h, original, recovery);
      let writing, next;
      if (change === "owner" || change === "csrf") {
        if (change === "owner") h.login.ownerId = ids.other;
        h.login.csrf = "SYNTHETIC-replacement";
        await h.runtime.restore();
      } else if (change === "logout") await h.runtime.signOut();
      else if (change === "actor") h.adapter.permissions.actorId = ids.other;
      else if (change === "view") {
        h.caps.view = false;
        await h.adapter.ports.context.execute({
          clientId: ids.client,
          draftId: ids.draft,
          target: h.c.getSnapshot().view.target,
        });
      } else if (change === "new-operation") {
        h.c.edit((v) => ({ ...v, summary: "newer manual B" }));
        next = h.hold("save_draft_v1");
        writing = h.c.save();
        await next.ready;
      } else if (change === "new-draft") {
        const v = h.f.getView();
        v.draft.id = ids.other;
        v.target.draftId = ids.other;
        h.f.setView(v);
        await h.c.open(ids.other);
      } else h.c.edit((v) => ({ ...v, summary: "newer unsent manual work" }));
      const before = h.c.getSnapshot();
      held.release();
      await reading;
      assert.deepEqual(
        h.c.getSnapshot(),
        before,
        "obsolete private/context delivery cannot change new basis",
      );
      assert.equal(h.c.canPublish(), false);
      if (writing) {
        next.release();
        await writing;
        assert.equal(h.c.getSnapshot().pending, null);
      }
    });

for (const leg of ["read_advisor_gate_v1", "advisor_read"])
  for (const status of [403, 503])
    for (const remount of [false, true])
      test(`notice: successful current refresh supersedes its ${leg} ${status}${remount ? " after remount" : ""}`, async (t) => {
        const h = await recoveryApp(t);
        await h.c.open(ids.draft);
        await h.c.refreshContext();
        const held = h.hold(leg, unavailable(status)),
          reading = h.c.refreshContext();
        await held.ready;
        // Let the other Promise.all leg finish before a real 503 suspends the
        // shared cookie session. Otherwise its late success correctly ends it.
        await new Promise((r) => setImmediate(r));
        held.release();
        await reading;
        assert.equal(h.c.getSnapshot().pending, null);
        assert.equal(
          h.c.getSnapshot().notice.kind,
          status === 403 ? "denied" : "error",
        );
        if (status === 503) await h.runtime.restore();
        if (remount) {
          const n = h.c.getSnapshot().notice;
          h.remount();
          assert.deepEqual(h.c.getSnapshot().notice, n);
        }
        h.f.context.payments.claims[0].id = ids.other;
        h.f.context.payments.revision++;
        await h.c.refreshContext();
        assert.equal(
          h.c.getSnapshot().context.payments.claims[0].id,
          ids.other,
        );
        assert.equal(
          h.c.getSnapshot().notice,
          null,
          "superseded context failure must not label the eligible replacement claim",
        );
        assert.equal(
          h.calls.some((c) => c.command.action === "confirm_payment"),
          false,
        );
      });

test("notice: successful context refresh preserves uncertain command and exact recovery", async (t) => {
  const h = await recoveryApp(t),
    original = await uncertainApproval(h);
  const before = h.c.getSnapshot();
  await h.c.refreshContext();
  assert.equal(h.c.getSnapshot().notice, before.notice);
  assert.equal(h.c.getSnapshot().pending, original.command);
  assert.equal(h.c.getSnapshot().save, "uncertain");
});

for (const source of ["validation", "manual", "comparison", "context-conflict"])
  test(`notice: successful context refresh preserves real ${source} failure`, async (t) => {
    const h = await recoveryApp(t);
    await h.c.open(ids.draft);
    await h.c.refreshContext();
    if (source === "manual") await h.c.confirmPayment(ids.claim, "wrong", true);
    else {
      const action =
        source === "validation"
          ? "validate_draft_v1"
          : source === "comparison"
            ? "compare_import_v1"
            : "read_advisor_gate_v1";
      const held = h.hold(
        action,
        unavailable(source === "validation" ? 503 : 409),
      );
      const reading =
        source === "validation"
          ? h.c.validate()
          : source === "comparison"
            ? h.c.compare(h.c.getSnapshot().local)
            : h.c.refreshContext();
      await held.ready;
      held.release();
      await reading;
    }
    const before = h.c.getSnapshot();
    assert.ok(before.notice);
    if (source === "validation") await h.runtime.restore();
    await h.c.refreshContext();
    assert.equal(h.c.getSnapshot().notice, before.notice);
    assert.equal(h.c.getSnapshot().needsComparison, before.needsComparison);
  });
