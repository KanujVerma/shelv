import test from "node:test";
import assert from "node:assert/strict";
import { createApplicationSession } from "../src/app/session.ts";
import { createAdvisorPorts } from "../src/app/ports.ts";
import { draftView, ids } from "./rebuild/advisor-fixture.mjs";
const locks = { request: async (_, o, run) => run(o.signal) };
const caps = [
  "view",
  "edit",
  "assign",
  "review",
  "approve",
  "publish",
  "confirmPayments",
];
const read = { schemaVersion: 1, action: "read_draft_v1", draftId: ids.draft };
const dto = (csrf, ownerId = ids.actor) => ({
  signedIn: true,
  ownerId,
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
function gate(view, ownerId) {
  return {
    schemaVersion: 1,
    clientId: ids.client,
    target: view.target,
    publisher: { kind: "human", actorId: ownerId },
    approval: null,
    publication: "first",
    coverage: "inactive",
    capabilities: {
      actorId: ownerId,
      view: true,
      edit: true,
      assign: true,
      review: true,
      approve: false,
      publish: true,
      confirmPayments: true,
    },
    policy: { revision: 1, ownerActorId: ownerId, requireKanujApproval: true },
  };
}
for (const assigned of [false, true])
  for (const owner of [ids.actor, ids.other]) {
    test(`internal diagnosis: old ${assigned ? "assigned" : "unassigned"} continuation cannot mutate permissions after ${owner === ids.actor ? "same-owner" : "owner-change"} acceptance`, async () => {
      let runtime,
        adapter,
        step = 0,
        armed = true,
        login = dto("old"),
        invalidated;
      const view = draftView(assigned),
        calls = [];
      runtime = createApplicationSession({
        audience: "advisor",
        locks,
        fetcher: async (url, options) => {
          calls.push(url);
          if (url === "/api/advisor/session") return Response.json(login);
          assert.equal(url, "/api/advisor/plans");
          const command = JSON.parse(options.body);
          if (command.action === "read_advisor_gate_v1")
            return Response.json(gate(view, login.ownerId));
          assert.equal(command.action, "read_draft_v1");
          if (armed) {
            armed = false;
            const tick = () => {
              if (++step === 12) {
                login = dto("new", owner);
                // Real internal transition used by complete/restore. This controls
                // the post-transport boundary, not ordinary browser reachability.
                runtime.cookie._accept(login);
                invalidated = caps.map((key) => adapter.permissions[key]);
              } else queueMicrotask(tick);
            };
            queueMicrotask(tick);
          }
          return Response.json(view);
        },
      });
      try {
        await runtime.restore();
        const boundary = runtime.getSnapshot().boundary;
        boundary.memory.set("intent", "private-old-intent");
        runtime.transport.memory.set("intent", "private-old-intent");
        adapter = createAdvisorPorts(runtime);
        const outcome = await adapter.ports.plans.execute(read).then(
          (value) => ({ value }),
          (error) => ({ error }),
        );
        assert.deepEqual(
          invalidated,
          caps.map(() => false),
        );
        assert.equal(boundary.isCurrent(), false);
        assert.deepEqual(
          caps.map((key) => adapter.permissions[key]),
          caps.map(() => false),
        );
        assert.equal(outcome.value, undefined);
        assert.equal(outcome.error?.status, 401);
        assert.equal(boundary.memory.get("intent"), undefined);
        assert.equal(runtime.transport.memory.get("intent"), undefined);
        const count = calls.length;
        await assert.rejects(
          adapter.ports.plans.execute(read),
          (e) => e.status === 401,
        );
        assert.equal(calls.length, count);
        const lawful = createAdvisorPorts(runtime);
        try {
          assert.deepEqual(await lawful.ports.plans.execute(read), view);
          assert.equal(lawful.permissions.actorId, owner);
          assert.equal(lawful.permissions.view, true);
          assert.equal(lawful.permissions.edit, true);
        } finally {
          lawful.dispose();
        }
      } finally {
        adapter?.dispose();
        runtime.dispose();
      }
    });
  }

test("ordinary public restore microtask sweep preserves rejection/clearing with actual cookie factories", async () => {
  for (let offset = 1; offset <= 24; offset++) {
    let runtime,
      adapter,
      login = dto("old"),
      step = 0,
      relogin,
      armed = true;
    runtime = createApplicationSession({
      audience: "advisor",
      locks,
      fetcher: async (url) => {
        if (url === "/api/advisor/session") return Response.json(login);
        assert.equal(url, "/api/advisor/plans");
        if (armed) {
          armed = false;
          const tick = () => {
            if (++step === offset) {
              login = dto("new");
              relogin = runtime.restore();
            } else queueMicrotask(tick);
          };
          queueMicrotask(tick);
        }
        return Response.json(draftView(false));
      },
    });
    try {
      await runtime.restore();
      const boundary = runtime.getSnapshot().boundary;
      adapter = createAdvisorPorts(runtime);
      const settled = await adapter.ports.plans.execute(read).then(
        (value) => ({ value }),
        (error) => ({ error }),
      );
      await new Promise((resolve) => setImmediate(resolve));
      await relogin;
      // An already fulfilled promise may be consumed after a later invalidation.
      // The observable regression here is a post-invalidation permission reset.
      if (settled.error) assert.equal(settled.error.status, 401);
      assert.equal(boundary.isCurrent(), false);
      assert.deepEqual(
        caps.map((key) => adapter.permissions[key]),
        caps.map(() => false),
      );
    } finally {
      adapter?.dispose();
      runtime.dispose();
    }
  }
});

test("post-transport abort cannot select a draft or change existing permission state", async () => {
  const abort = new AbortController();
  let step = 0;
  const runtime = createApplicationSession({
    audience: "advisor",
    locks,
    fetcher: async (url) => {
      if (url === "/api/advisor/session") return Response.json(dto("old"));
      assert.equal(url, "/api/advisor/plans");
      const tick = () => {
        if (++step === 12) abort.abort();
        else queueMicrotask(tick);
      };
      queueMicrotask(tick);
      return Response.json(draftView(true));
    },
  });
  let adapter;
  try {
    await runtime.restore();
    adapter = createAdvisorPorts(runtime);
    const before = { ...adapter.permissions };
    await assert.rejects(
      adapter.ports.plans.execute(read, { signal: abort.signal }),
      (e) => e.status === 503,
    );
    assert.deepEqual(adapter.permissions, before);
  } finally {
    adapter?.dispose();
    runtime.dispose();
  }
});

test("gate continuation checks abort before accepting capabilities from an otherwise valid response", async () => {
  const abort = new AbortController(),
    view = draftView(true);
  let armed = false,
    step = 0;
  const runtime = createApplicationSession({
    audience: "advisor",
    locks,
    fetcher: async (url, options) => {
      if (url === "/api/advisor/session") return Response.json(dto("old"));
      assert.equal(url, "/api/advisor/plans");
      if (JSON.parse(options.body).action === "read_draft_v1")
        return Response.json(view);
      if (armed) {
        const tick = () => {
          if (++step === 12) abort.abort();
          else queueMicrotask(tick);
        };
        queueMicrotask(tick);
      }
      const result = gate(view, ids.actor);
      result.capabilities.edit = armed;
      return Response.json(result);
    },
  });
  let adapter;
  try {
    await runtime.restore();
    adapter = createAdvisorPorts(runtime);
    await adapter.ports.plans.execute(read);
    const before = { ...adapter.permissions };
    armed = true;
    await assert.rejects(
      adapter.ports.context.execute(
        { clientId: ids.client, draftId: ids.draft, target: view.target },
        { signal: abort.signal },
      ),
      (e) => e.status === 503,
    );
    assert.deepEqual(adapter.permissions, before);
  } finally {
    adapter?.dispose();
    runtime.dispose();
  }
});
