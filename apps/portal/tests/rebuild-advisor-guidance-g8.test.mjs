// Finite SYNTHETIC HTTP inputs; actual session/cookie/raw/Root/controller.
import test from "node:test";
import assert from "node:assert/strict";
import { loaded, openHeld, ids, clone } from "./rebuild-advisor-guidance-g6-helper.mjs";
for (const kind of ["save", "private_note"])
  test("G8 " + kind + "403 clears A before notifying and preserves the newer B owner", async (t) => {
    const h = await loaded(t);
    const action = kind === "save" ? "save_guidance_draft_v1" : "append_private_review_note_v1";
    if (kind === "save") h.c.editBody({ ...clone(h.data.body), conclusion: "SYNTHETIC G8 denied save" });
    h.override(action, { code: "forbidden" }, 403);
    const held = h.hold(action);
    const work = kind === "save" ? h.c.save() : h.c.savePrivateNote({ kind: "goal_report", id: ids.report }, "SYNTHETIC G8 private preparation");
    await held.ready;
    const sent = h.calls.at(-1), wire = sent.wire;
    let once = true, next;
    const off = h.c.subscribe(() => {
      const s = h.c.getSnapshot();
      if (once && s.saveState === "error") {
        once = false;
        assert.equal(s.body, null); assert.equal(s.history.entries.length, 0);
        next = openHeld(h);
      }
    }); t.after(off);
    try {
      held.release(); await work;
      assert.equal(once, false);
      assert.ok(h.c.getSnapshot().busy.includes("publication"));
      assert.equal(h.c.getSnapshot().privateDenied, false);
      await next.held.ready;
    } finally { held.release(); next?.held?.release(); await next?.work; }
    assert.equal(h.c.getSnapshot().publication?.clientId, ids.other);
    assert.equal(h.calls.filter(x => x.command.action === action).length, 1);
    assert.equal(sent.wire, wire); assert.equal(h.c.can("publish"), false);
    assert.equal(h.runtime.cookie.status, "ready");
  });
