// SYNTHETIC / DO NOT FULFILL. Real cookie/factory/transport/mappers/app ports/controller.
// Only the finite fetch boundary supplies fixture DTOs and delivery faults.
import test from "node:test";
import assert from "node:assert/strict";
import { createApplicationSession } from "../src/app/session.ts";
import { createAdvisorPorts } from "../src/app/ports.ts";
import { createAdvisorController } from "../src/features/advisor/controller.ts";
import { fixture, ids } from "./rebuild/advisor-fixture.mjs";

const mutationCaps = [
  "edit",
  "assign",
  "review",
  "approve",
  "publish",
  "confirmPayments",
];
const ownerCaps = {
  actorId: ids.actor,
  view: true,
  ...Object.fromEntries(mutationCaps.map((k) => [k, true])),
};
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
async function app(t) {
  const f = fixture({ ready: true }),
    calls = [],
    holds = [],
    previews = [];
  const login = {
    signedIn: true,
    ownerId: ids.actor,
    generation: 1,
    csrf: "SYNTHETIC-csrf-1",
    capabilities: {
      view: true,
      edit: true,
      publish: true,
      confirmPayments: true,
    },
    idleExpiresAt: "2099-01-01T00:00:00Z",
    absoluteExpiresAt: "2099-01-02T00:00:00Z",
  };
  let caps = { ...ownerCaps },
    time = Date.now();
  const runtime = createApplicationSession({
    audience: "advisor",
    now: () => time,
    locks: { request: async (_, o, run) => run(o.signal) },
    fetcher: async (url, options) => {
      assert.ok(
        [
          "/api/advisor/session",
          "/api/advisor/plans",
          "/api/advisor/payments",
          "/api/advisor/operations",
          "/api/advisor/logout",
        ].includes(url),
        "unexpected network " + url,
      );
      if (url === "/api/advisor/session") return Response.json(login);
      if (url === "/api/advisor/logout")
        return Response.json({ signedOut: true });
      assert.equal(options.credentials, "same-origin");
      assert.equal(options.headers["X-Shelv-CSRF"], login.csrf);
      const c = JSON.parse(options.body);
      calls.push(structuredClone(c));
      let result;
      if (url === "/api/advisor/plans") {
        if (c.action === "read_advisor_gate_v1") {
          result = {
            schemaVersion: 1,
            clientId: c.target.clientId,
            target: c.target,
            publisher: c.publisher,
            approval: f.context.approval,
            publication: f.context.publication,
            coverage: f.context.coverage,
            capabilities: { ...caps },
            policy: {
              revision: 1,
              ownerActorId: ids.actor,
              requireKanujApproval: true,
            },
          };
        } else result = await f.options.ports.plans.execute(c);
      } else if (url === "/api/advisor/payments") {
        assert.equal(c.action, "advisor_read");
        const p = await f.options.ports.paymentRead.execute(c);
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
        assert.equal(c.action, "advisor_list");
        result = await f.options.ports.clients.execute(c);
      }
      result = structuredClone(result);
      const hold = holds.find((h) => !h.used && h.match(c));
      if (hold) {
        hold.used = true;
        hold.signal = options.signal;
        hold.ready.resolve();
        await hold.done.promise;
        result = hold.outcome(result);
      }
      return result instanceof Response ? result : Response.json(result);
    },
  });
  await runtime.restore();
  const adapter = createAdvisorPorts(runtime),
    boundary = runtime.getSnapshot().boundary;
  const c = createAdvisorController({
    session: boundary,
    permissions: adapter.permissions,
    ports: adapter.ports,
    onPreview: (...v) => previews.push(v),
  });
  t.after(() => {
    holds.forEach((h) => h.done.resolve());
    c.dispose();
    adapter.dispose();
    runtime.dispose();
  });
  return {
    f,
    calls,
    runtime,
    adapter,
    boundary,
    c,
    login,
    previews,
    caps(patch) {
      caps = { ...caps, ...patch };
    },
    expire() {
      time = Date.parse("2099-01-03T00:00:00Z");
    },
    hold(action, outcome = (v) => v) {
      const h = {
        match: typeof action === "string" ? (c) => c.action === action : action,
        outcome,
        ready: deferred(),
        done: deferred(),
        used: false,
      };
      holds.push(h);
      return {
        ready: h.ready.promise,
        release: () => h.done.resolve(),
        get signal() {
          return h.signal;
        },
      };
    },
  };
}
const fail = (status) => () =>
  Response.json({ code: "unavailable" }, { status });

// Full permission JSON equality must fail this ordinary, non-overlapping first open.
test("R2-1 first assigned open accepts its own default owner gate, without retry", async (t) => {
  const h = await app(t);
  assert.equal(h.adapter.permissions.approve, false);
  await h.c.open(ids.draft);
  assert.equal(h.c.getSnapshot().view?.draft.id, ids.draft);
  assert.equal(h.c.getSnapshot().busy, false);
  assert.equal(h.c.getSnapshot().notice, null);
  assert.deepEqual(h.adapter.permissions, ownerCaps);
  assert.deepEqual(
    h.calls.map((c) => c.action),
    ["read_draft_v1", "read_advisor_gate_v1"],
  );
  await h.c.refreshContext();
  assert.equal(h.c.getSnapshot().context?.clientId, ids.client);
});

for (const cap of [...mutationCaps.filter((k) => k !== "approve"), "all"])
  test(`R2-1 first assigned view survives current ${cap} mutation restriction`, async (t) => {
    const h = await app(t);
    h.caps(
      cap === "all"
        ? Object.fromEntries(mutationCaps.map((k) => [k, false]))
        : { [cap]: false },
    );
    await h.c.open(ids.draft);
    const s = h.c.getSnapshot();
    assert.equal(s.view?.draft.id, ids.draft);
    assert.equal(s.busy, false);
    assert.equal(s.notice, null);
    assert.equal(h.adapter.permissions.view, true);
    for (const k of cap === "all" ? mutationCaps : [cap])
      assert.equal(h.adapter.permissions[k], false);
    if (cap === "all") {
      const before = JSON.stringify(s.local);
      h.c.edit((v) => ({ ...v, summary: "must not edit" }));
      await h.c.save();
      await h.c.review("routine");
      await h.c.approve();
      await h.c.publish();
      assert.equal(JSON.stringify(h.c.getSnapshot().local), before);
      assert.equal(h.calls.filter((c) => c.requestId).length, 0);
    }
  });

for (const path of [
  "refreshContext",
  "validate",
  "preview",
  "compare",
  "loadDirectory",
  "loadClients",
])
  test(`R2-1 ${path} survives a lawful authoritative mutation-capability transition`, async (t) => {
    const h = await app(t);
    await h.c.open(ids.draft);
    assert.ok(h.c.getSnapshot().view);
    const actions = {
      refreshContext: "read_advisor_gate_v1",
      validate: "validate_draft_v1",
      preview: "preview_draft_v1",
      compare: "compare_import_v1",
      loadDirectory: "list_plans_v1",
      loadClients: "advisor_list",
    };
    if (path === "refreshContext") {
      h.caps({ edit: false, review: false, approve: false });
      h.f.context.coverage = "active";
    }
    const hold = h.hold(
      actions[path],
      path === "validate"
        ? (v) => ({
            ...v,
            issues: [
              { section: "routine", path: "routine", code: "missing_goals" },
            ],
          })
        : (v) => v,
    );
    const reading =
      path === "compare" ? h.c.compare(h.c.getSnapshot().local) : h.c[path]();
    await hold.ready;
    h.caps({ edit: false, review: false, approve: false });
    // A real current app gate changes the same shared permission object while
    // this view-only read is pending. No port or current() function is stubbed.
    if (path !== "refreshContext")
      await h.adapter.ports.context.execute({
        clientId: ids.client,
        draftId: ids.draft,
        target: h.c.getSnapshot().view.target,
      });
    hold.release();
    await reading;
    if (path === "refreshContext") {
      assert.equal(h.c.getSnapshot().context?.clientId, ids.client);
      assert.equal(h.c.getSnapshot().context?.coverage, "active");
    }
    if (path === "validate")
      assert.equal(h.c.getSnapshot().view.issues[0]?.code, "missing_goals");
    if (path === "preview") assert.equal(h.previews.length, 1);
    if (path === "compare") assert.ok(h.c.getSnapshot().comparison);
    if (path === "loadDirectory") assert.ok(h.c.getSnapshot().directory);
    if (path === "loadClients") assert.ok(h.c.getSnapshot().clients);
    assert.equal(h.c.getSnapshot().notice, null);
  });

for (const fault of [
  "view-denied",
  "source-denied",
  "current-401",
  "malformed-target",
])
  test(`R2-1 current open ${fault} returns no private view and releases only its busy`, async (t) => {
    const h = await app(t);
    if (fault === "view-denied") h.caps({ view: false });
    const held = h.hold(
      "read_draft_v1",
      fault === "source-denied"
        ? fail(403)
        : fault === "current-401"
          ? fail(401)
          : fault === "malformed-target"
            ? (v) => ({ ...v, target: { ...v.target, clientId: ids.other } })
            : (v) => v,
    );
    const reading = h.c.open(ids.draft);
    await held.ready;
    held.release();
    await reading;
    const s = h.c.getSnapshot();
    assert.equal(s.view, null);
    assert.equal(s.local, null);
    assert.equal(s.busy, false);
    if (fault === "current-401") assert.equal(s.ended, true);
    else assert.ok(s.notice);
  });

test("R2-1 a supplied actor replacement cannot apply an already pending private read", async (t) => {
  const h = await app(t);
  await h.c.open(ids.draft);
  const held = h.hold("validate_draft_v1", (v) => ({
    ...v,
    issues: [{ section: "routine", path: "routine", code: "stale" }],
  }));
  const reading = h.c.validate();
  await held.ready;
  h.adapter.permissions.actorId = ids.other;
  const before = h.c.getSnapshot();
  held.release();
  await reading;
  assert.deepEqual(h.c.getSnapshot(), before);
});

for (const completion of [
  "ack",
  "retry",
  "status",
  "remount-retry",
  "remount-status",
])
  test(`R2-1 old approval ${completion} acknowledges its command without restoring newer revoked authority`, async (t) => {
    const h = await app(t);
    let c = h.c;
    h.f.context.publication = "later";
    h.f.context.coverage = "active";
    await h.c.open(ids.draft);
    await h.c.refreshContext();
    assert.equal(h.c.canApprove(), true);
    const held = h.hold(
      "approve_publication_v1",
      completion === "ack" ? (v) => v : (v) => ({ ...v, unsupported: true }),
    );
    const approving = h.c.approve();
    await held.ready;
    const command = JSON.stringify(h.c.getSnapshot().pending);
    if (completion !== "ack") {
      held.release();
      await approving;
      assert.equal(h.c.getSnapshot().notice.kind, "uncertain");
      assert.equal(JSON.stringify(h.c.getSnapshot().pending), command);
    }
    if (completion.startsWith("remount")) {
      c.dispose();
      c = createAdvisorController({
        session: h.boundary,
        permissions: h.adapter.permissions,
        ports: h.adapter.ports,
      });
      t.after(() => c.dispose());
    }
    // The committed receipt describes the earlier approval. A later, real gate
    // response explicitly reports that approval is no longer current.
    h.f.context.approval = null;
    await c.refreshContext();
    assert.equal(c.getSnapshot().context?.approval, null);
    assert.equal(c.canPublish(), false);
    if (completion === "ack") {
      held.release();
      await approving;
    } else if (completion.endsWith("retry")) await c.retry();
    else await c.reconcile();
    assert.equal(c.getSnapshot().pending, null);
    assert.equal(c.getSnapshot().busy, false);
    assert.equal(c.getSnapshot().context?.approval, null);
    assert.equal(c.canPublish(), false);
    if (completion.endsWith("retry"))
      assert.deepEqual(
        h.calls
          .filter((c) => c.action === "approve_publication_v1")
          .map((c) => JSON.stringify(c)),
        [command, command],
      );
    assert.equal(
      h.calls.some((c) => c.action === "publish_plan_v1"),
      false,
    );
  });

for (const order of ["old-first", "new-first"])
  test(`R2-1 actual same-target gates preserve newest restrictive role/approval/coverage, ${order}`, async (t) => {
    const h = await app(t);
    h.f.context.publication = "later";
    h.f.context.coverage = "active";
    await h.c.open(ids.draft);
    await h.c.refreshContext();
    await h.c.approve();
    assert.equal(h.c.canPublish(), true);
    const old = h.hold("read_advisor_gate_v1");
    const first = h.c.refreshContext();
    await old.ready;
    h.f.context.approval = null;
    h.f.context.coverage = "inactive";
    h.caps({ edit: false, review: false, approve: false });
    const next = h.hold("read_advisor_gate_v1");
    const second = h.c.refreshContext();
    await next.ready;
    if (order === "new-first") {
      next.release();
      await second;
    }
    const before = h.c.getSnapshot();
    old.release();
    await first;
    assert.deepEqual(h.c.getSnapshot(), before);
    if (order === "old-first") {
      next.release();
      await second;
    }
    assert.equal(h.c.getSnapshot().context?.approval, null);
    assert.equal(h.c.getSnapshot().context?.coverage, "inactive");
    assert.equal(h.c.getSnapshot().notice, null);
    assert.equal(h.c.canPublish(), false);
    assert.equal(h.c.canApprove(), false);
    assert.equal(h.adapter.permissions.edit, false);
    assert.equal(h.adapter.permissions.view, true);
  });

for (const change of ["owner", "csrf", "logout", "role", "expiry"])
  test(`R2-1 held private open rejects ${change} replacement through actual cookie boundary`, async (t) => {
    const h = await app(t),
      held = h.hold("read_draft_v1");
    h.boundary.memory.set("intent", "private-old-intent");
    const reading = h.c.open(ids.draft);
    await held.ready;
    if (change === "owner" || change === "csrf") {
      if (change === "owner") h.login.ownerId = ids.other;
      h.login.csrf = "SYNTHETIC-new-csrf";
      await h.runtime.restore();
    } else if (change === "logout") await h.runtime.signOut();
    else if (change === "role") h.runtime.cookie.identity.role = "client";
    else h.expire();
    held.release();
    await reading;
    const s = h.c.getSnapshot();
    assert.equal(s.ended, true);
    assert.equal(s.busy, false);
    assert.equal(s.view, null);
    assert.equal(s.local, null);
    assert.equal(h.boundary.memory.get("intent"), undefined);
    const n = h.calls.length;
    await assert.rejects(
      h.adapter.ports.plans.execute({
        schemaVersion: 1,
        action: "read_draft_v1",
        draftId: ids.draft,
      }),
      (e) => e.status === 401,
    );
    assert.equal(h.calls.length, n);
  });

for (const phase of ["draft", "gate"])
  for (const order of ["old-first", "new-first"])
    test(`R2-1 reverse A/B ${phase}, ${order}: old aborted cleanup cannot release new busy`, async (t) => {
      const h = await app(t),
        a = h.f.getView(),
        b = structuredClone(a);
      b.draft.id = ids.other;
      b.target.draftId = ids.other;
      const old = h.hold(
        phase === "draft" ? "read_draft_v1" : "read_advisor_gate_v1",
      );
      const first = h.c.open(ids.draft);
      await old.ready;
      h.f.setView(b);
      h.caps({ edit: false, review: false });
      const next = h.hold("read_draft_v1");
      const second = h.c.open(ids.other);
      await next.ready;
      assert.equal(old.signal.aborted, true);
      if (order === "new-first") {
        next.release();
        await second;
      }
      const before = h.c.getSnapshot();
      old.release();
      await first;
      assert.deepEqual(h.c.getSnapshot(), before);
      if (order === "old-first") {
        assert.equal(h.c.getSnapshot().busy, true);
        next.release();
        await second;
      }
      assert.equal(h.c.getSnapshot().view?.draft.id, ids.other);
      assert.equal(h.c.getSnapshot().busy, false);
      assert.equal(h.adapter.permissions.edit, false);
      await assert.rejects(
        h.adapter.ports.context.execute({
          clientId: ids.client,
          draftId: ids.draft,
          target: a.target,
        }),
        (e) => e.status === 409,
      );
      await h.c.refreshContext();
      assert.equal(h.c.getSnapshot().context?.clientId, ids.client);
    });
