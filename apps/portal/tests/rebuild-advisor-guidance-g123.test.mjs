import test from "node:test";
import assert from "node:assert/strict";
import {
  ready,
  actionNames,
  selection,
  ids,
  clone,
} from "./rebuild-advisor-guidance-g123-helper.mjs";
for (const action of Object.keys(actionNames)) {
  test(
    "G1 " +
      action +
      " cancels retired evidence ownership through actual asynchronous cookie acquisition",
    async (t) => {
      const h = await ready(t, action);
      const write = h.c[action](),
        read = h.c.refreshHistory();
      await Promise.all([write, read]);
      assert.equal(
        h.calls.filter((x) => x.command.action === actionNames[action]).length,
        0,
      );
      assert.equal(
        h.runtime.cookie.status,
        "ready",
        "local cancellation must not suspend the real cookie",
      );
      assert.equal(
        h.c.getSnapshot().pending,
        null,
        "known pre-egress cancellation must not strand an unsent intent",
      );
      assert.equal(h.c.getSnapshot().busy.length, 0);
    },
  );
  test(
    "CONTROL " +
      action +
      " deliberately dispatches once with unchanged current owner",
    async (t) => {
      const h = await ready(t, action);
      await h.c[action]();
      assert.equal(
        h.calls.filter((x) => x.command.action === actionNames[action]).length,
        1,
      );
      assert.equal(h.c.getSnapshot().pending, null);
    },
  );
}
for (const kind of ["publication-refresh", "private403"])
  test(
    "G2 " +
      kind +
      " retires a sent save to exact usable uncertainty and status READ",
    async (t) => {
      const h = await ready(t);
      h.c.editBody({
        ...clone(h.data.body),
        conclusion: "SYNTHETIC preserved save",
      });
      const hold = h.hold("save_guidance_draft_v1");
      const work = h.c.save();
      await hold.ready;
      const first = h.calls.at(-1);
      if (kind === "publication-refresh") await h.c.refreshPublication();
      else {
        h.override("read_advisor_care_history_v1", { code: "forbidden" }, 403);
        await h.c.refreshHistory();
      }
      hold.release();
      await work;
      const state = h.c.getSnapshot();
      assert.equal(state.pending?.state, "uncertain");
      assert.equal(state.pending?.requestId, first.command.requestId);
      assert.equal(state.busy.length, 0);
      assert.equal(state.draftCurrent, false);
      h.override("request_status_v1", { code: "unavailable" }, 503);
      await h.c.checkStatus();
      assert.equal(
        h.c.getSnapshot().pending.requestId,
        first.command.requestId,
      );
      await h.runtime.restore();
      h.clear("request_status_v1");
      const before = h.calls.length;
      await h.c.checkStatus();
      assert.equal(h.calls[before].command.action, "request_status_v1");
      assert.equal(h.calls[before].command.requestId, first.command.requestId);
      assert.equal(h.c.getSnapshot().pending, null);
      assert.equal(h.c.can("approve"), false);
      if (kind === "private403") {
        assert.equal(h.c.getSnapshot().draft, null);
        assert.equal(h.c.getSnapshot().body, null);
        assert.equal(h.c.getSnapshot().history.entries.length, 0);
      }
    },
  );
test("G3 direct context refuses a day change after the final matching directory wait", async (t) => {
  const h = await ready(t);
  const r = {
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
  const first = h.hold("advisor_list");
  const work = h.context.read(r);
  const outcome = work.then(
    (v) => ({ value: v }),
    (error) => ({ error }),
  );
  await first.ready;
  const final = h.hold("advisor_list");
  first.release();
  await final.ready;
  h.advance(24 * 60 * 60 * 1000);
  final.release();
  const result = await outcome;
  assert.equal(result.error?.status, 409);
  assert.equal("value" in result, false);
});
for (const action of ["save", "approve"])
  test(
    "synchronous subscriber evidence change before " +
      action +
      " registration cannot egress or invent a conflict",
    async (t) => {
      const h = await ready(t);
      if (action === "save")
        h.c.editBody({
          ...clone(h.data.body),
          conclusion: "SYNTHETIC new manual buffer",
        });
      let first = true,
        refresh;
      h.c.subscribe(() => {
        const s = h.c.getSnapshot();
        if (first && s.busy.includes("write")) {
          first = false;
          refresh = h.c.refreshHistory();
        }
      });
      await h.c[action]();
      await refresh;
      assert.equal(
        h.calls.filter(
          (x) =>
            x.command.action ===
            (action === "save"
              ? "save_guidance_draft_v1"
              : "approve_guidance_v1"),
        ).length,
        0,
      );
      assert.equal(h.c.getSnapshot().pending, null);
      assert.equal(h.c.getSnapshot().conflict, null);
      assert.equal(h.c.getSnapshot().busy.length, 0);
      assert.equal(h.runtime.cookie.status, "ready");
    },
  );
test("G2 original positive status cannot reset a freshly read newer revision or bless its local manual buffer", async (t) => {
  const h = await ready(t);
  const bodyA = { ...clone(h.data.body), conclusion: "SYNTHETIC own A" };
  h.c.editBody(bodyA);
  const hold = h.hold("save_guidance_draft_v1");
  const write = h.c.save();
  await hold.ready;
  const first = h.calls.at(-1);
  await h.c.refreshPublication();
  h.data.draft = {
    ...clone(h.data.draft),
    target: {
      ...clone(h.data.draft.target),
      revision: 3,
      contentHash: "e".repeat(64),
    },
    body: { ...clone(h.data.body), conclusion: "SYNTHETIC remote B" },
    review: null,
    approval: null,
    issues: [{ path: "review", code: "review_required" }],
  };
  await h.c.refreshDraft();
  const newer = h.c.getSnapshot().draft;
  assert.equal(h.c.getSnapshot().draftCurrent, true);
  assert.equal(h.c.getSnapshot().dirty, true);
  hold.release();
  await write;
  await h.c.checkStatus();
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(h.c.getSnapshot().draft, newer);
  assert.equal(h.c.getSnapshot().draftCurrent, true);
  assert.equal(h.c.getSnapshot().dirty, true);
  assert.equal(h.c.getSnapshot().body.conclusion, bodyA.conclusion);
  assert.equal(h.c.getSnapshot().saveState, "idle");
  h.c.editBody({
    ...clone(newer.body),
    conclusion: "SYNTHETIC new deliberate B edit",
  });
  await h.c.save();
  const next = h.calls.at(-1);
  assert.equal(next.command.target.revision, 3);
  assert.notEqual(next.command.requestId, first.command.requestId);
  assert.equal(next.command.body.conclusion, "SYNTHETIC new deliberate B edit");
});
test("G2 cancelling a queued exact retry preserves the earlier uncertain UUID and UTF8 payload", async (t) => {
  const h = await ready(t);
  h.c.editBody({
    ...clone(h.data.body),
    conclusion: "SYNTHETIC é🧴\noriginal retry",
  });
  h.override("save_guidance_draft_v1", { code: "uncertain" }, 503);
  await h.c.save();
  const first = h.calls.at(-1);
  await h.runtime.restore();
  h.clear("save_guidance_draft_v1");
  const retry = h.c.retry(),
    read = h.c.refreshHistory();
  await Promise.all([retry, read]);
  assert.equal(
    h.calls.filter((x) => x.command.action === "save_guidance_draft_v1").length,
    1,
  );
  assert.equal(h.c.getSnapshot().pending.requestId, first.command.requestId);
  assert.equal(h.c.getSnapshot().pending.state, "uncertain");
  assert.equal(h.runtime.cookie.status, "ready");
  await h.c.checkStatus();
  assert.equal(h.c.getSnapshot().pending.requestId, first.command.requestId);
  await h.c.retry();
  assert.equal(h.calls.at(-1).wire, first.wire);
  assert.equal(h.c.getSnapshot().pending, null);
});
test("G1 cancellation after a native async yield still prevents typed egress and retains conservative exact recovery", async (t) => {
  const h = await ready(t);
  const write = h.c.approve();
  const requestId = h.c.getSnapshot().pending.requestId;
  await Promise.resolve();
  const read = h.c.refreshHistory();
  await Promise.all([write, read]);
  assert.equal(
    h.calls.filter((x) => x.command.action === "approve_guidance_v1").length,
    0,
  );
  assert.equal(h.c.getSnapshot().pending.requestId, requestId);
  assert.equal(h.c.getSnapshot().pending.state, "uncertain");
  await h.c.checkStatus();
  assert.equal(h.c.getSnapshot().pending.requestId, requestId);
  assert.equal(h.c.can("publish"), false);
  assert.equal(h.runtime.cookie.status, "ready");
});
test("G1 old cancelled write finally cannot clear a new same-selection save owner or its manual buffer", async (t) => {
  const h = await ready(t);
  const old = h.c.approve(),
    read = h.c.refreshHistory();
  h.c.editBody({
    ...clone(h.data.body),
    conclusion: "SYNTHETIC newer same-selection buffer",
  });
  const hold = h.hold("save_guidance_draft_v1");
  const newer = h.c.save();
  await hold.ready;
  await Promise.all([old, read]);
  assert.ok(h.c.getSnapshot().busy.includes("write"));
  assert.equal(h.c.getSnapshot().pending.action, "save_guidance_draft_v1");
  assert.equal(
    h.c.getSnapshot().body.conclusion,
    "SYNTHETIC newer same-selection buffer",
  );
  hold.release();
  await newer;
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(h.c.getSnapshot().busy.length, 0);
});
for (const status of [403, 503])
  test(
    "G2 original status " +
      status +
      " preserves retired uncertainty and private clearing",
    async (t) => {
      const h = await ready(t);
      h.c.editBody({
        ...clone(h.data.body),
        conclusion: "SYNTHETIC unresolved report",
      });
      const hold = h.hold("save_guidance_draft_v1");
      const write = h.c.save();
      await hold.ready;
      const sent = h.calls.at(-1).command;
      h.override("read_advisor_care_history_v1", { code: "forbidden" }, 403);
      await h.c.refreshHistory();
      hold.release();
      await write;
      h.override(
        "request_status_v1",
        { code: status === 403 ? "forbidden" : "unavailable" },
        status,
      );
      await h.c.checkStatus();
      assert.equal(h.c.getSnapshot().pending.requestId, sent.requestId);
      assert.equal(h.c.getSnapshot().pending.state, "uncertain");
      assert.equal(h.c.getSnapshot().draft, null);
      assert.equal(h.c.getSnapshot().history.entries.length, 0);
      assert.equal(h.c.can("publish"), false);
    },
  );
for (const action of Object.keys(actionNames))
  test(
    "G2 already-sent " +
      action +
      " retains exact uncertain recovery after its display owner retires",
    async (t) => {
      const h = await ready(t, action);
      const hold = h.holdHttp(actionNames[action]);
      const work = h.c[action]();
      await hold.ready;
      const first = h.calls.at(-1);
      assert.equal(first.command.action, actionNames[action]);
      await h.c.refreshPublication();
      hold.release();
      await work;
      assert.equal(
        h.c.getSnapshot().pending.requestId,
        first.command.requestId,
      );
      assert.equal(h.c.getSnapshot().pending.state, "uncertain");
      assert.equal(h.c.getSnapshot().lastReceipt, null);
      assert.equal(h.c.getSnapshot().draftCurrent, false);
      assert.equal(h.c.getSnapshot().busy.length, 0);
      await h.c.checkStatus();
      assert.equal(h.calls.at(-1).command.action, "request_status_v1");
      assert.equal(h.calls.at(-1).command.requestId, first.command.requestId);
      assert.equal(h.c.getSnapshot().pending, null);
      assert.equal(h.c.getSnapshot().authorityContext, null);
      assert.equal(h.c.can("publish"), false);
    },
  );
