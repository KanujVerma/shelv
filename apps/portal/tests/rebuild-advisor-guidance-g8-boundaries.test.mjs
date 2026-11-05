// Finite SYNTHETIC HTTP only. Each real prepared write-denial notification is
// exercised separately, including the formerly unchecked caller notification.
import test from "node:test";
import assert from "node:assert/strict";
import {
  prepared,
  actions,
  openHeld,
  ids,
  clone,
} from "./rebuild-advisor-guidance-g8-helper.mjs";
for (const kind of Object.keys(actions))
  for (const phase of [1, 2, 3, 4])
    test(
      "G8 " +
        kind +
        " denial notification " +
        phase +
        " keeps its origin through B",
      async (t) => {
        const h = await prepared(t, kind),
          held = h.denied();
        const work = h.invoke();
        await held.ready;
        let count = 0,
          next;
        const off = h.c.subscribe(() => {
          const s = h.c.getSnapshot();
          if (s.saveState === "error" && ++count === phase) {
            assert.equal(s.body, null);
            assert.equal(s.history.entries.length, 0);
            h.override("read_advisor_care_history_v1", {
              ...clone(h.data.page),
              clientId: ids.other,
              entries: [],
            });

            next = openHeld(h);
          }
        });
        t.after(off);
        try {
          held.release();
          await work;
          assert.ok(next, "the actual prepared-denial notification must occur");
          assert.equal(h.c.getSnapshot().selection.clientId, ids.other);
          assert.equal(h.c.getSnapshot().privateDenied, false);
          assert.equal(h.c.getSnapshot().notice, null);
          assert.ok(h.c.getSnapshot().busy.includes("publication"));
          await next.held.ready;
        } finally {
          held.release();
          next?.held?.release();
          await next?.work;
        }
        assert.equal(h.c.getSnapshot().publication?.clientId, ids.other);
        assert.equal(h.c.getSnapshot().privateDenied, false);
        assert.equal(h.c.can("publish"), false);
      },
    );

for (const kind of Object.keys(actions)) {
  test(
    "G8 " +
      kind +
      " second registration notification cancels only the fresh unsent intent",
    async (t) => {
      const h = await prepared(t, kind),
        before = h.calls.length;
      const originalSelection = clone(h.c.getSnapshot().selection);
      let phases = 0,
        next;
      const off = h.c.subscribe(() => {
        if (h.c.getSnapshot().busy.includes("write") && ++phases === 2)
          next = openHeld(h);
      });
      t.after(off);
      try {
        await h.invoke();
        assert.ok(next);
        await next.held.ready;
        assert.equal(
          h.calls
            .slice(before)
            .filter((x) => x.command.action === actions[kind]).length,
          0,
        );
      } finally {
        next?.held?.release();
        await next?.work;
      }
      h.override("read_advisor_publication_v3", clone(h.data.view));
      h.override("read_advisor_care_history_v1", clone(h.data.page));
      await h.c.open(originalSelection);
      assert.equal(h.c.getSnapshot().pending, null);
    },
  );
  for (const phase of [1, 2])
    test(
      "G8 uncertain " +
        kind +
        " retry registration " +
        phase +
        " preserves exact parked A",
      async (t) => {
        const h = await prepared(t, kind),
          held = h.denied(503);
        const originalSelection = clone(h.c.getSnapshot().selection);
        const work = h.invoke();
        await held.ready;
        const sent = h.calls.at(-1),
          wire = sent.wire;
        held.release();
        await work;
        await h.c.checkConnection();
        let phases = 0,
          next;
        const off = h.c.subscribe(() => {
          if (h.c.getSnapshot().busy.includes("write") && ++phases === phase)
            next = openHeld(h);
        });
        t.after(off);
        try {
          await h.c.retry();
          assert.ok(next);
          await next.held.ready;
          assert.equal(
            h.calls.filter((x) => x.command.action === actions[kind]).length,
            1,
          );
        } finally {
          next?.held?.release();
          await next?.work;
        }
        h.override("read_advisor_publication_v3", clone(h.data.view));
        h.override("read_advisor_care_history_v1", clone(h.data.page));
        await h.c.open(originalSelection);
        assert.equal(
          h.c.getSnapshot().pending.requestId,
          sent.command.requestId,
        );
        assert.equal(h.c.getSnapshot().pending.state, "uncertain");
        assert.equal(sent.wire, wire);
        assert.equal(h.c.can("publish"), false);
        assert.equal(h.runtime.cookie.status, "ready");
      },
    );
}
