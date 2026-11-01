// Finite SYNTHETIC metadata/business HTTP. No acquire/current/rights override.
import test from "node:test";
import assert from "node:assert/strict";
import { prepared, actions } from "./rebuild-advisor-guidance-g8-helper.mjs";
for (const kind of Object.keys(actions))
  test(
    "G8 " +
      kind +
      " cannot regain origin after self-retirement notification starts a connection read",
    async (t) => {
      const h = await prepared(t, kind),
        before = h.calls.length;
      let count = 0,
        connection;
      const off = h.c.subscribe(() => {
        if (h.c.getSnapshot().busy.includes("write") && ++count === 3)
          connection = h.c.checkConnection();
      });
      t.after(off);
      await h.invoke();
      await connection;
      assert.ok(count >= 3);
      assert.equal(
        h.calls.slice(before).filter((x) => x.command.action === actions[kind])
          .length,
        0,
        "a lost continuation cannot dispatch after declaring its display retirement obsolete",
      );
      assert.equal(h.c.getSnapshot().lastReceipt, null);
      assert.equal(h.c.getSnapshot().pending, null);
      assert.equal(h.c.can("publish"), false);
    },
  );
