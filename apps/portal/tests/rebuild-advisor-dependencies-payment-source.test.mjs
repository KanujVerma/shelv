// Source-only actual cookie/ports/controller regression for the browser-found
// continuation. dependencyBackend supplies finite DTOs only; no browser starts.
import test from "node:test";
import assert from "node:assert/strict";
import { createApplicationSession } from "../src/app/session.ts";
import { createAdvisorPorts } from "../src/app/ports.ts";
import { createAdvisorController } from "../src/features/advisor/controller.ts";
import {
  dependencyBackend,
  ids,
} from "./rebuild-advisor-dependencies-browser-helper.mjs";
async function paymentApp(t) {
  const s = dependencyBackend({ preparation: true });
  const runtime = createApplicationSession({
    audience: "advisor",
    locks: { request: async (_n, o, run) => run(o.signal) },
    fetcher: async (url, o) => {
      if (url === "/api/advisor/session")
        return Response.json({
          signedIn: true,
          ownerId: ids.actor,
          generation: 1,
          csrf: s.csrf,
          capabilities: {
            view: true,
            edit: true,
            publish: true,
            confirmPayments: true,
          },
          idleExpiresAt: "2099-01-01T00:00:00Z",
          absoluteExpiresAt: "2099-01-02T00:00:00Z",
        });
      assert.ok(
        [
          "/api/advisor/plans",
          "/api/advisor/care",
          "/api/advisor/payments",
        ].includes(url),
      );
      assert.equal(new Headers(o.headers).get("x-shelv-csrf"), s.csrf);
      const command = JSON.parse(o.body);
      s.calls.push({ url, command, bytes: o.body });
      const result = await s.respond(command, o.body);
      return result?.status && result.body
        ? Response.json(result.body, { status: result.status })
        : Response.json(result);
    },
  });
  await runtime.restore();
  const adapter = createAdvisorPorts(runtime, { care: true }),
    c = createAdvisorController({
      session: runtime.getSnapshot().boundary,
      permissions: adapter.permissions,
      ports: adapter.ports,
    });
  t.after(() => {
    s.holds.forEach((h) => h.done.resolve());
    c.dispose();
    adapter.dispose();
    runtime.dispose();
  });
  await c.open(ids.draft);
  await c.refreshContext();
  await c.inspectDependencies();
  await c.approve();
  await c.inspectDependencies();
  return { s, c };
}
test("known financial acknowledgement waits for applicable dependency evidence before its continuation resolves", async (t) => {
  const { s, c } = await paymentApp(t),
    body = structuredClone(c.getSnapshot().local),
    approval = structuredClone(c.getSnapshot().context.approval),
    held = s.hold("read_draft_dependencies_v1");
  let settled = false;
  const paying = c
    .confirmPayment(ids.claim, "100.00", true)
    .then(() => (settled = true));
  await Promise.race([held.ready, paying]);
  assert.equal(settled, false);
  assert.equal(c.getSnapshot().pending, null);
  assert.equal(c.getSnapshot().busy, false);
  assert.equal(c.getSnapshot().context.payments.claims[0].status, "confirmed");
  assert.equal(c.canPublish(), false);
  held.release();
  await paying;
  assert.equal(c.canPublish(), true);
  assert.deepEqual(c.getSnapshot().context.approval, approval);
  assert.deepEqual(c.getSnapshot().local, body);
  assert.equal(
    s.calls.filter((x) => x.command.action === "confirm_payment").length,
    1,
  );
  assert.equal(
    s.calls.filter((x) => x.command.action === "publish_plan_v1").length,
    0,
  );
});
for (const status of [403, 503])
  test(`dependency ${status} after known payment acknowledgement cannot turn it into uncertain money or publication authority`, async (t) => {
    const { s, c } = await paymentApp(t),
      held = s.hold("read_draft_dependencies_v1", () => ({
        status,
        body: { code: "unavailable" },
      }));
    const paying = c.confirmPayment(ids.claim, "100.00", true);
    await held.ready;
    held.release();
    await paying;
    assert.equal(c.getSnapshot().pending, null);
    assert.notEqual(c.getSnapshot().save, "uncertain");
    assert.equal(
      c.getSnapshot().context.payments.claims[0].status,
      "confirmed",
    );
    assert.equal(c.getSnapshot().dependencies.status, "unavailable");
    assert.equal(c.canPublish(), false);
    assert.equal(
      s.calls.filter((x) => x.command.action === "confirm_payment").length,
      1,
    );
    assert.equal(
      s.calls.filter((x) => x.command.action === "publish_plan_v1").length,
      0,
    );
  });
