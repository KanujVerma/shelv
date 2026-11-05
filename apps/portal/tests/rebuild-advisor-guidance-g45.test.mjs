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
for (const action of ["save", "publish"])
  test(
    "G4 natural concurrent503 after sent " +
      action +
      " keeps exact intent in the still-current offline session",
    async (t) => {
      const h = await ready(t, action === "save" ? "approve" : "publish");
      if (action === "save")
        h.c.editBody({
          ...clone(h.data.body),
          conclusion: "SYNTHETIC possibly committed",
        });
      const hold = h.holdHttp(
        action === "save" ? "save_guidance_draft_v1" : actionNames.publish,
      );
      const work = h.c[action]();
      await hold.ready;
      const sent = h.calls.at(-1);
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
      hold.release();
      await work;
      assert.equal(h.runtime.cookie.status, "offline");
      assert.equal(h.c.getSnapshot().ended, false);
      assert.equal(h.c.getSnapshot().body, null);
      assert.equal(h.c.getSnapshot().history.entries.length, 0);
      assert.equal(h.c.getSnapshot().pending.requestId, sent.command.requestId);
      assert.equal(h.c.getSnapshot().pending.state, "uncertain");
      assert.equal(h.c.getSnapshot().lastReceipt, null);
      assert.equal(h.c.can("publish"), false);
      await h.c.checkConnection();
      await h.c.checkStatus();
      assert.equal(h.c.getSnapshot().pending, null);
      assert.equal(h.calls.at(-1).command.requestId, sent.command.requestId);
    },
  );
test("G4 actual known HTTP401 still ends the owning boundary and clears intent/private snapshots", async (t) => {
  const h = await ready(t);
  h.override("approve_guidance_v1", { code: "session_ended" }, 401);
  await h.c.approve();
  assert.equal(h.runtime.cookie.status, "signedout");
  assert.equal(h.c.getSnapshot().ended, true);
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(h.c.getSnapshot().history.entries.length, 0);
});

test("G4 rejected new context read retires old lineage before parsing", async (t) => {
  const h = await ready(t),
    old = h.c.getSnapshot().authorityContext,
    generation = h.context.getReadGeneration();
  await assert.rejects(
    h.context.read({ ...request(h), boundaryKey: "wrong-boundary" }),
    (error) => error.status === 400,
  );
  assert.equal(h.context.getReadGeneration(), generation + 1);
  assert.equal(h.context.isCurrent(old), false);
  assert.equal(h.c.can("approve"), false);
});

test("G5 restoring real cookie readiness cannot revive returned authority from before natural loss", async (t) => {
  const h = await ready(t),
    old = h.c.getSnapshot().authorityContext;
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
    (error) => error.status === 503,
  );
  assert.equal(h.context.isCurrent(old), false);
  await h.runtime.restore();
  assert.equal(h.runtime.cookie.status, "ready");
  assert.equal(h.context.isCurrent(old), false);
  assert.equal(h.c.can("approve"), false);
});

const contextReads = [
  "read_policy_v1",
  "advisor_list",
  "read_guidance_draft_v1",
  "read_advisor_publication_v3",
  "read_guidance_draft_v1",
  "read_advisor_publication_v3",
  "read_policy_v1",
  "advisor_list",
];
for (let stage = 0; stage < contextReads.length; stage++)
  test(
    "G5 completed natural503 before releasing actual context read " +
      stage +
      " rejects private return",
    async (t) => {
      const h = await ready(t),
        name = contextReads[stage];
      const prior = contextReads.slice(0, stage).filter((x) => x === name).length;
      let hold = h.hold(name);
      const work = h.context.read(request(h)).then(
        (value) => ({ value }),
        (error) => ({ error }),
      );
      for (let n = 0; n < prior; n++) {
        await hold.ready;
        const next = h.hold(name);
        hold.release();
        hold = next;
      }
      await hold.ready;
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
        (error) => error.status === 503,
      );
      // Actual producer is still awaiting its held HTTP response. Loss has
      // completed before this release, not merely before a consumer's .then.
      assert.equal(h.runtime.cookie.status, "offline");
      hold.release();
      const result = await work;
      assert.equal(result.value, undefined);
      assert.equal(result.error?.status, 503);
      assert.equal(h.c.can("approve"), false);
    },
  );

for (const action of Object.keys(actionNames)) {
  test(
    "G4 captured day rollback denies first " + action + " egress during real acquire",
    async (t) => {
      const h = await ready(t, action);
      const work = h.c[action]();
      h.advance(-86400000);
      await work;
      assert.equal(
        h.calls.filter((x) => x.command.action === actionNames[action]).length,
        0,
      );
      assert.equal(h.runtime.cookie.status, "ready");
      assert.equal(h.c.can("publish"), false);
    },
  );
  test(
    "G4 late day change rejects sent " + action + " receipt and recovers exact status READ",
    async (t) => {
      const h = await ready(t, action),
        hold = h.holdHttp(actionNames[action]);
      const work = h.c[action]();
      await hold.ready;
      const sent = h.calls.at(-1),
        wire = sent.wire;
      h.advance(86400000);
      hold.release();
      await work;
      assert.equal(h.c.getSnapshot().pending?.requestId, sent.command.requestId);
      assert.equal(h.c.getSnapshot().pending?.state, "uncertain");
      assert.equal(h.c.getSnapshot().lastReceipt, null);
      assert.equal(h.c.getSnapshot().authorityContext, null);
      assert.equal(h.c.can("publish"), false);
      await h.c.checkStatus();
      assert.equal(h.calls.at(-1).command.action, "request_status_v1");
      assert.equal(h.calls.at(-1).command.requestId, sent.command.requestId);
      assert.equal(h.c.getSnapshot().pending, null);
      assert.equal(h.c.can("publish"), false);
      assert.equal(
        h.calls.filter((x) => x.command.action === actionNames[action]).length,
        1,
      );
      assert.equal(sent.wire, wire);
    },
  );
}
