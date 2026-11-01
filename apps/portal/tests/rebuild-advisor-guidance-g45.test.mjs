// Finite SYNTHETIC HTTP/clock/delivery only; real session, both acquires,
// fixed factories, Root, context and controller. No current/acquire/UUID override.
import test from "node:test";
import assert from "node:assert/strict";
import {
  ready,
  actionNames,
  selection,
  ids,
  clone,
} from "./rebuild-advisor-guidance-g123-helper.mjs";
import { createAdvisorReviewRequest } from "../src/app/advisor-review-request.ts";
import { readReviewCommand } from "../../../src/contracts/PortalReviewValidation.ts";
const request = (h) => ({
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
});
for (const action of Object.keys(actionNames)) {
  test(
    "G4 " +
      action +
      " rechecks captured day through actual final acquisition before first typed egress",
    async (t) => {
      const h = await ready(t, action);
      const write = h.c[action]();
      const original = h.c.getSnapshot().pending?.requestId;
      h.advance(86400000);
      await write;
      assert.equal(
        h.calls.filter((x) => x.command.action === actionNames[action]).length,
        0,
      );
      assert.equal(h.runtime.cookie.status, "ready");
      assert.equal(h.c.can("publish"), false);
      if (h.c.getSnapshot().pending)
        assert.equal(h.c.getSnapshot().pending.requestId, original);
    },
  );
  test(
    "G4 positive " +
      action +
      " preserves only operation consistency while displayed context and isCurrent retire",
    async (t) => {
      const h = await ready(t, action),
        displayed = h.c.getSnapshot().authorityContext;
      const write = h.c[action]();
      assert.equal(h.c.getSnapshot().authorityContext, null);
      assert.equal(h.context.isCurrent(displayed), false);
      assert.equal(h.c.getSnapshot().acknowledged, false);
      await write;
      assert.equal(
        h.calls.filter((x) => x.command.action === actionNames[action]).length,
        1,
      );
      assert.equal(h.c.getSnapshot().pending, null);
    },
  );
}
test("G4 own read generation is captured before a self-retirement subscriber can invalidate it", async (t) => {
  const h = await ready(t);
  let once = true;
  h.c.subscribe(() => {
    const s = h.c.getSnapshot();
    if (once && s.busy.includes("write") && !s.authorityContext) {
      once = false;
      h.context.invalidate();
    }
  });
  await h.c.approve();
  assert.equal(once, false);
  assert.equal(
    h.calls.filter((x) => x.command.action === "approve_guidance_v1").length,
    0,
  );
  assert.equal(h.runtime.cookie.status, "ready");
});
test("G4 absent optional read-lineage support is honest unavailable, never a true fallback", async (t) => {
  const h = await ready(t);
  delete h.context.getReadGeneration;
  await h.c.refreshAuthority();
  h.c.acknowledgeEvidence(true);
  assert.equal(h.c.can("approve"), false);
  assert.ok(
    h.c.getSnapshot().missing.some((x) => x.kind === "guidance_authority"),
  );
  await h.c.approve();
  assert.equal(
    h.calls.filter((x) => x.command.action === "approve_guidance_v1").length,
    0,
  );
});
for (const turns of [0, 2, 3])
  test(
    "G5 natural valid raw HTTP503 observed at closing wait " +
      turns +
      " rejects direct private issuance",
    async (t) => {
      const h = await ready(t);
      const first = h.hold("advisor_list"),
        work = h.context.read(request(h)).then(
          (value) => ({ value }),
          (error) => ({ error }),
        );
      await first.ready;
      const last = h.hold("advisor_list");
      first.release();
      await last.ready;
      h.override("read_advisor_care_history_v1", { code: "unavailable" }, 503);
      const hold = h.hold("read_advisor_care_history_v1");
      const raw = createAdvisorReviewRequest(h.runtime)
        .execute(
          readReviewCommand({
            schemaVersion: 1,
            action: "read_advisor_care_history_v1",
            clientId: ids.client,
            cursor: null,
            limit: 100,
            version: null,
          }),
        )
        .catch((e) => e);
      await hold.ready;
      last.release();
      for (let i = 0; i < turns; i++) await Promise.resolve();
      hold.release();
      const [result, failure] = await Promise.all([work, raw]);
      assert.equal(failure.status, 503);
      assert.equal(result.error?.status, 503);
      assert.equal(result.value, undefined);
      assert.equal(h.runtime.cookie.status, "offline");
    },
  );
test("G5 natural loss after an already returned context invalidates it while keeping offline custody", async (t) => {
  const h = await ready(t);
  const boundary = h.runtime.getSnapshot().boundary;
  const context = await h.context.read(request(h));
  assert.equal(h.runtime.cookie.status, "ready");
  assert.equal(h.context.isCurrent(context), true);
  h.override("read_advisor_care_history_v1", { code: "unavailable" }, 503);
  await assert.rejects(
    createAdvisorReviewRequest(h.runtime).execute(
      readReviewCommand({
        schemaVersion: 1,
        action: "read_advisor_care_history_v1",
        clientId: ids.client,
        cursor: null,
        limit: 100,
        version: null,
      }),
    ),
    (e) => e.status === 503,
  );
  assert.equal(h.context.isCurrent(context), false);
  assert.equal(h.runtime.getSnapshot().boundary, boundary);
  assert.equal(boundary.isCurrent(), true);
  assert.equal(h.c.can("approve"), false);
});
test("G4 a retry cannot adopt an unrelated read generation emitted during registration", async (t) => {
  const h = await ready(t);
  h.override("approve_guidance_v1", { code: "uncertain" }, 503);
  await h.c.approve();
  const first = h.calls.at(-1);
  await h.runtime.restore();
  h.clear("approve_guidance_v1");
  let once = true;
  h.c.subscribe(() => {
    const s = h.c.getSnapshot();
    if (once && s.busy.includes("write")) {
      once = false;
      h.context.invalidate();
    }
  });
  await h.c.retry();
  assert.equal(
    h.calls.filter((x) => x.command.action === "approve_guidance_v1").length,
    1,
  );
  assert.equal(h.c.getSnapshot().pending.requestId, first.command.requestId);
  assert.equal(h.c.getSnapshot().pending.state, "uncertain");
  assert.equal(h.runtime.cookie.status, "ready");
});
