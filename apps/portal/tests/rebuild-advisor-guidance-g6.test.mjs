// Source state assertions, no browser/DOM or successful domain/current port.
import test from "node:test";
import assert from "node:assert/strict";
import {
  loaded,
  openHeld,
  selection,
  ids,
  clone,
  canary,
} from "./rebuild-advisor-guidance-g6-helper.mjs";

for (const stage of ["manifest", "last-detail"])
  for (const change of ["selection", "same-value-ABA", "dispose", "signout"])
    test(
      "G6 " + stage + " emission retains retirement after " + change,
      async (t) => {
        const h = await loaded(t);
        let once = true,
          next,
          held;
        const off = h.c.subscribe(() => {
          const s = h.c.getSnapshot();
          if (
            once &&
            s.instructions.items.length === 1 &&
            s.instructions.details.length === (stage === "manifest" ? 0 : 1) &&
            !s.instructions.complete
          ) {
            once = false;
            if (change === "dispose") h.c.dispose();
            else if (change === "signout") next = h.runtime.signOut();
            else {
              if (change === "same-value-ABA") {
                const b = h.c.open({
                  ...clone(selection),
                  clientId: ids.other,
                  draftId: null,
                  kind: null,
                });
                ({ held, work: next } = openHeld(h, ids.client));
                next = Promise.all([b, next]);
              } else ({ held, work: next } = openHeld(h));
            }
            assert.equal(h.c.getSnapshot().instructions.details.length, 0);
          }
        });
        t.after(off);
        try {
          await h.c.loadInstructions();
          assert.equal(once, false);
          const after = h.c.getSnapshot();
          assert.equal(after.instructions.details.length, 0);
          assert.equal(after.instructions.complete, false);
          assert.doesNotMatch(
            JSON.stringify(after.instructions),
            new RegExp(canary),
          );
          assert.equal(h.c.can("publish"), false);
          if (held) {
            await held.ready;
            assert.equal(after.publication, null);
            assert.equal(after.body, null);
            assert.equal(
              after.selection.clientId,
              change === "selection" ? ids.other : ids.client,
            );
          } else assert.equal(after.ended, true);
        } finally {
          held?.release();
          await next;
        }
        assert.equal(h.c.getSnapshot().instructions.details.length, 0);
        assert.equal(h.c.getSnapshot().instructions.complete, false);
      },
    );

test("G6 unchanged VIEW-only owner reads every exact detail without edit or publication rights", async (t) => {
  const h = await loaded(t, { viewOnly: true });
  await h.c.loadInstructions();
  const s = h.c.getSnapshot();
  assert.equal(s.instructions.complete, true);
  assert.equal(s.instructions.details.length, 1);
  assert.equal(s.instructions.details[0].content.body.directions[0], canary);
  assert.equal(s.instructions.details[0].publishedBy, ids.actor);
  assert.equal(h.c.can("review"), false);
  assert.equal(h.c.can("publish"), false);
});

test("G6 new instruction read from a partial manifest keeps its newer held detail owner", async (t) => {
  const h = await loaded(t);
  let once = true,
    next,
    held;
  const off = h.c.subscribe(() => {
    const s = h.c.getSnapshot();
    if (
      once &&
      s.instructions.items.length === 1 &&
      !s.instructions.details.length
    ) {
      once = false;
      held = h.hold("read_advisor_instruction_v1");
      next = h.c.loadInstructions();
    }
  });
  t.after(off);
  try {
    await h.c.loadInstructions();
    await held.ready;
    assert.equal(
      h.calls.filter((x) => x.command.action === "read_advisor_instruction_v1")
        .length,
      1,
    );
    assert.equal(h.c.getSnapshot().instructions.complete, false);
    assert.ok(h.c.getSnapshot().busy.includes("instructions"));
  } finally {
    held?.release();
    await next;
  }
  assert.equal(h.c.getSnapshot().instructions.complete, true);
  assert.equal(h.c.getSnapshot().instructions.details.length, 1);
  assert.equal(h.c.getSnapshot().busy.length, 0);
});

test("G6 a synchronous cached newer instruction read completes once, without old completion emission", async (t) => {
  const h = await loaded(t);
  let once = true,
    next,
    completions = 0;
  const off = h.c.subscribe(() => {
    const s = h.c.getSnapshot();
    if (s.instructions.complete) completions++;
    if (
      once &&
      s.instructions.details.length === 1 &&
      !s.instructions.complete
    ) {
      once = false;
      next = h.c.loadInstructions();
    }
  });
  t.after(off);
  await h.c.loadInstructions();
  await next;
  // One data completion and its own busy-finish emission. The old lane cannot emit.
  assert.equal(completions, 2);
  assert.equal(h.c.getSnapshot().instructions.complete, true);
});

for (const change of ["selection", "same-value-ABA", "dispose", "signout"])
  test(
    "G6 zero-instruction completion stays retired after " + change,
    async (t) => {
      const h = await loaded(t, { empty: true });
      let once = true,
        next,
        held;
      const off = h.c.subscribe(() => {
        if (once) {
          once = false;
          if (change === "dispose") h.c.dispose();
          else if (change === "signout") next = h.runtime.signOut();
          else if (change === "same-value-ABA") {
            const b = h.c.open({
              ...clone(selection),
              clientId: ids.other,
              draftId: null,
              kind: null,
            });
            ({ held, work: next } = openHeld(h, ids.client));
            next = Promise.all([b, next]);
          } else ({ held, work: next } = openHeld(h));
        }
      });
      t.after(off);
      try {
        await h.c.loadInstructions();
        if (held) await held.ready;
        else assert.equal(h.c.getSnapshot().ended, true);
        assert.equal(h.c.getSnapshot().publication, null);
        assert.equal(h.c.getSnapshot().instructions.complete, false);
      } finally {
        held?.release();
        await next;
      }
    },
  );

for (const read of ["history", "reported", "instructions"])
  test(
    "G6 " +
      read +
      " error subscriber cannot apply the retired denial to the newer publication read",
    async (t) => {
      const h = await loaded(t);
      if (read === "reported") {
        h.data.view.use.reportedProducts.nextCursor = `c:${"a".repeat(64)}:${ids.report}`;
        await h.c.refreshPublication();
        assert.equal(
          h.c.getSnapshot().reported.nextCursor,
          h.data.view.use.reportedProducts.nextCursor,
        );
        assert.equal(h.c.getSnapshot().reported.error, null);
      }
      const action =
        read === "history"
          ? "read_advisor_care_history_v1"
          : read === "reported"
            ? "read_advisor_reported_products_v1"
            : "read_advisor_instruction_manifest_v1";
      h.override(action, { code: "forbidden" }, 403);
      let once = true,
        next,
        held;
      const off = h.c.subscribe(() => {
        const s = h.c.getSnapshot();
        const error =
          read === "history"
            ? s.history.error
            : read === "reported"
              ? s.reported.error
              : s.instructions.error;
        if (once && error) {
          once = false;
          ({ held, work: next } = openHeld(h));
        }
      });
      t.after(off);
      try {
        await h.c[
          read === "history"
            ? "refreshHistory"
            : read === "reported"
              ? "loadMoreReportedProducts"
              : "loadInstructions"
        ]();
        assert.equal(once, false);
        assert.ok(h.calls.some((x) => x.command.action === action));
        assert.ok(h.c.getSnapshot().busy.includes("publication"));
        await held.ready;
      } finally {
        held?.release();
        await next;
      }
      assert.equal(h.c.getSnapshot().publication?.clientId, ids.other);
      assert.equal(h.c.getSnapshot().instructions.details.length, 0);
    },
  );

for (const read of ["history", "reported", "instructions"])
  test(
    "G6 current " + read + "403 still clears its applicable projection",
    async (t) => {
      const h = await loaded(t);
      if (read === "reported") {
        h.data.view.use.reportedProducts.nextCursor = `c:${"a".repeat(64)}:${ids.report}`;
        await h.c.refreshPublication();
      }
      await h.c.loadInstructions();
      const action =
        read === "history"
          ? "read_advisor_care_history_v1"
          : read === "reported"
            ? "read_advisor_reported_products_v1"
            : "read_advisor_instruction_v1";
      h.override(action, { code: "forbidden" }, 403);
      // A fresh publication drops cached safe details before the current detail403.
      if (read === "instructions") await h.c.refreshPublication();
      await h.c[
        read === "history"
          ? "refreshHistory"
          : read === "reported"
            ? "loadMoreReportedProducts"
            : "loadInstructions"
      ]();
      const s = h.c.getSnapshot();
      assert.equal(s.body, null);
      assert.equal(s.history.entries.length, 0);
      assert.equal(s.privateDenied, true);
      assert.equal(h.runtime.cookie.status, "ready");
      assert.equal(h.c.can("publish"), false);
      if (read !== "history") {
        assert.equal(s.publication, null);
        assert.equal(s.instructions.details.length, 0);
      }
    },
  );

test("G6 instruction loading preserves an unrelated sent SAVE's immutable uncertain recovery", async (t) => {
  const h = await loaded(t);
  h.c.editBody({
    ...clone(h.data.body),
    conclusion: "SYNTHETIC G6 unsatisfied receipt",
  });
  const held = h.hold("save_guidance_draft_v1");
  const write = h.c.save();
  await held.ready;
  const sent = h.calls.at(-1),
    wire = sent.wire;
  await h.c.loadInstructions();
  assert.equal(h.c.getSnapshot().instructions.complete, true);
  assert.equal(h.c.getSnapshot().pending.requestId, sent.command.requestId);
  assert.equal(h.c.getSnapshot().pending.state, "uncertain");
  held.release();
  await write;
  assert.equal(h.c.getSnapshot().pending.requestId, sent.command.requestId);
  assert.equal(h.c.getSnapshot().lastReceipt, null);
  await h.c.checkStatus();
  assert.equal(h.calls.at(-1).command.action, "request_status_v1");
  assert.equal(h.calls.at(-1).command.requestId, sent.command.requestId);
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(h.c.can("publish"), false);
  assert.equal(
    h.calls.filter((x) => x.command.action === "save_guidance_draft_v1").length,
    1,
  );
  assert.equal(sent.wire, wire);
});
