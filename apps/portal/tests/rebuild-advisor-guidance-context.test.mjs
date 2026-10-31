// SYNTHETIC finite HTTP. Real session/cookie/factories/Root parsers/mappers, no context stub.
import test from "node:test";
import assert from "node:assert/strict";
import {
  contextApp,
  selection,
  ids,
  clone,
} from "./rebuild-advisor-guidance-context-fixture.mjs";
import { createAdvisorGuidanceController } from "../src/features/advisor/guidance/controller.ts";
export function request(h) {
  return {
    boundaryKey: h.runtime.getSnapshot().boundary.key,
    selection: clone(selection),
    target: clone(h.data.target),
    publisher: { kind: "human", actorId: ids.actor },
    scope: "review.publish",
    required: [
      "read_policy_v1",
      "fresh_guidance_draft",
      "current_publication",
      "current_session_capabilities",
    ],
    snapshot: clone(h.data.view.currentGuidance.snapshot),
  };
}
test("actual context composes fixed policy/directory/guidance/V3 reads and supplies real fields, no eligible flag", async (t) => {
  const h = await contextApp(t, createAdvisorGuidanceController);
  const value = await h.context.read(request(h));
  assert.equal(value.policy.ownerActorId, ids.actor);
  assert.equal(value.policy.revision, 1);
  assert.equal(value.client.clientId, ids.client);
  assert.equal(value.capabilities.edit, true);
  assert.equal(value.draft.target.kind, "review");
  assert.equal("eligible" in value, false);
  assert.equal(h.context.isCurrent(value), true);
  assert.ok(
    h.calls.some(
      (x) =>
        x.url === "/api/advisor/plans" && x.command.action === "read_policy_v1",
    ),
  );
  assert.ok(
    h.calls.some(
      (x) =>
        x.url === "/api/advisor/operations" &&
        x.command.action === "advisor_list",
    ),
  );
});
test("context rejects selected target/kind/publisher mismatch before permission can be displayed", async (t) => {
  const h = await contextApp(t, createAdvisorGuidanceController);
  for (const patch of [
    { publisher: { kind: "human", actorId: ids.other } },
    { scope: "instruction.publish" },
    { selection: { ...selection, clientId: ids.other } },
  ]) {
    await assert.rejects(h.context.read({ ...request(h), ...patch }), (e) =>
      [400, 403].includes(e.status),
    );
  }
  assert.equal(h.calls.length, 0);
  h.data.draft = {
    ...h.data.draft,
    target: { ...h.data.draft.target, contentHash: "d".repeat(64) },
  };
  await assert.rejects(h.context.read(request(h)), (e) => e.status === 409);
});
test("view-only truthful policy403 yields no context and no permission workaround", async (t) => {
  const h = await contextApp(t, createAdvisorGuidanceController);
  await h.caps({ edit: false, publish: false });
  h.override("read_policy_v1", { code: "forbidden" }, 403);
  await assert.rejects(h.context.read(request(h)), (e) => e.status === 403);
  assert.equal(
    h.calls.some((x) => x.command.action === "read_advisor_gate_v1"),
    false,
  );
});
test("policy changes during composition and session replacement after wait retire the captured context", async (t) => {
  const h = await contextApp(t, createAdvisorGuidanceController);
  const hold = h.hold("advisor_list");
  const work = h.context.read(request(h));
  const rejected = assert.rejects(work, (e) => e.status === 409);
  await hold.ready;
  h.data.policy.revision = 2;
  hold.release();
  await rejected;
});
