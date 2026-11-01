// Finite SYNTHETIC HTTP inputs; actual session/cookie/raw/Root/controller.
import test from "node:test";
import assert from "node:assert/strict";
import {
  loaded,
  openHeld,
  ids,
  clone,
} from "./rebuild-advisor-guidance-g6-helper.mjs";
import {
  prepared,
  actions,
  selection,
} from "./rebuild-advisor-guidance-g8-helper.mjs";
for (const kind of ["save", "private_note"])
  test(
    "G8 " +
      kind +
      "403 clears A before notifying and preserves the newer B owner",
    async (t) => {
      const h = await loaded(t);
      const action =
        kind === "save"
          ? "save_guidance_draft_v1"
          : "append_private_review_note_v1";
      if (kind === "save")
        h.c.editBody({
          ...clone(h.data.body),
          conclusion: "SYNTHETIC G8 denied save",
        });
      h.override(action, { code: "forbidden" }, 403);
      const held = h.hold(action);
      const work =
        kind === "save"
          ? h.c.save()
          : h.c.savePrivateNote(
              { kind: "goal_report", id: ids.report },
              "SYNTHETIC G8 private preparation",
            );
      await held.ready;
      const sent = h.calls.at(-1),
        wire = sent.wire;
      let once = true,
        next;
      const off = h.c.subscribe(() => {
        const s = h.c.getSnapshot();
        if (once && s.saveState === "error") {
          once = false;
          assert.equal(s.body, null);
          assert.equal(s.history.entries.length, 0);
          next = openHeld(h);
        }
      });
      t.after(off);
      try {
        held.release();
        await work;
        assert.equal(once, false);
        assert.ok(h.c.getSnapshot().busy.includes("publication"));
        assert.equal(h.c.getSnapshot().privateDenied, false);
        await next.held.ready;
      } finally {
        held.release();
        next?.held?.release();
        await next?.work;
      }
      assert.equal(h.c.getSnapshot().publication?.clientId, ids.other);
      assert.equal(
        h.calls.filter((x) => x.command.action === action).length,
        1,
      );
      assert.equal(sent.wire, wire);
      assert.equal(h.c.can("publish"), false);
      assert.equal(h.runtime.cookie.status, "ready");
    },
  );

function viewTransition(t, h, change) {
  const old = h.c.getSnapshot().selection;
  if (change === "dispose") {
    h.c.dispose();
    return {};
  }
  if (change === "signout") return { work: h.runtime.signOut() };
  if (change === "instructions") {
    if (h.data.view.currentGuidance.instructionCount === 0)
      return { work: h.c.loadInstructions() };
    h.override("read_advisor_instruction_manifest_v1", h.manifest);
    const held = h.hold("read_advisor_instruction_manifest_v1");
    return { held, lane: "instructions", work: h.c.loadInstructions() };
  }
  const clientId =
    change === "B-C" ? ids.amend : change === "B" ? ids.other : ids.client;
  const view = clone(h.data.view);
  view.clientId = clientId;
  h.override("read_advisor_publication_v3", view);
  if (clientId !== ids.client)
    h.override("read_advisor_care_history_v1", {
      ...clone(h.data.page),
      clientId,
      entries: [],
    });
  const held = h.hold("read_advisor_publication_v3");
  if (change === "B-C") {
    let once = true,
      c;
    const off = h.c.subscribe(() => {
      if (once && h.c.getSnapshot().selection?.clientId === ids.other) {
        once = false;
        c = h.c.open({
          clientId: ids.amend,
          publicationVersion: null,
          draftId: null,
          kind: null,
        });
      }
    });
    t.after(off);
    const b = h.c.open({
      ...clone(selection),
      clientId: ids.other,
      draftId: null,
      kind: null,
    });
    assert.equal(once, false);
    return { held, lane: "publication", clientId, work: Promise.all([b, c]) };
  }
  if (change === "ABA") {
    const b = h.c.open({
      ...clone(old),
      clientId: ids.other,
      draftId: null,
      kind: null,
    });
    const a = h.c.open(clone(old));
    return { held, lane: "publication", clientId, work: Promise.all([b, a]) };
  }
  return {
    held,
    lane: "publication",
    clientId,
    work: h.c.open(
      change === "same-reference"
        ? old
        : change === "new-reference"
          ? clone(old)
          : { ...clone(selection), clientId, draftId: null, kind: null },
    ),
  };
}

for (const kind of Object.keys(actions))
  test(
    "G8 committed " + kind + " status notification is terminal before B",
    async (t) => {
      const h = await prepared(t, kind);
      let receipt;
      const held =
        kind === "revoke"
          ? h.holdHttp(actions[kind])
          : h.hold(actions[kind], {
              replace: (body) => {
                receipt = clone(body);
                return body;
              },
            });
      const write = h.invoke();
      await held.ready;
      const sent = h.calls.at(-1),
        wire = sent.wire;
      await h.c.refreshPublication();
      held.release();
      await write;
      // Review's finite fixture lacks a status ledger for these two replies.
      // Reuse only its unchanged canonical write reply actually delivered. This
      // is SYNTHETIC HTTP, never a successful domain/current/authority port.
      if (kind === "conversation" || kind === "private_note")
        h.override("request_status_v1", { status: "committed", receipt });
      const statusHeld = h.hold("request_status_v1"),
        status = h.c.checkStatus();
      await statusHeld.ready;
      let once = true,
        next;
      const off = h.c.subscribe(() => {
        if (
          once &&
          h.c.getSnapshot().lastReceipt?.requestId === sent.command.requestId
        ) {
          once = false;
          next = viewTransition(t, h, "B");
        }
      });
      t.after(off);
      try {
        statusHeld.release();
        await status;
        assert.equal(once, false);
        await next.held.ready;
      } finally {
        statusHeld.release();
        next?.held?.release();
        await next?.work;
      }
      assert.equal(h.c.getSnapshot().publication?.clientId, ids.other);
      assert.equal(h.c.getSnapshot().lastReceipt, null);
      assert.equal(h.c.getSnapshot().pending, null);
      assert.equal(sent.wire, wire);
      assert.equal(h.c.can("publish"), false);
    },
  );

for (const kind of ["create", "save", "conversation", "private_note"])
  test(
    "G8 " + kind + " validation notification is terminal and sends no mutation",
    async (t) => {
      const h = await prepared(t, kind);
      if (kind === "create" || kind === "save")
        h.c.editBody({ ...clone(h.data.body), conclusion: "x".repeat(4001) });
      let once = true,
        next;
      const off = h.c.subscribe(() => {
        const notice = h.c.getSnapshot().notice;
        if (
          once &&
          (notice?.includes("not sent") ||
            notice === "enter a private note before saving.")
        ) {
          once = false;
          next = viewTransition(t, h, "B");
        }
      });
      t.after(off);
      try {
        if (kind === "conversation")
          await h.c.recordConversation({
            publication: clone(h.data.body.publication),
            occurredOn: { state: "unknown" },
            channel: "invalid-channel",
            clientReported: [],
            advisorConclusions: [],
            agentProposals: [],
            contradictions: [],
          });
        else if (kind === "private_note")
          await h.c.savePrivateNote(
            { kind: "goal_report", id: ids.report },
            "🧴".repeat(125001),
          );
        else await h.invoke();
        assert.equal(once, false);
        await next.held.ready;
        assert.equal(
          h.calls.filter((x) => x.command.action === actions[kind]).length,
          0,
        );
      } finally {
        next?.held?.release();
        await next?.work;
      }
      assert.equal(h.c.getSnapshot().publication?.clientId, ids.other);
    },
  );

for (const kind of Object.keys(actions)) {
  test(
    "G8 owning " + kind + "403 clears private A and pending with cookie ready",
    async (t) => {
      const h = await prepared(t, kind),
        held = h.denied();
      const work = h.invoke();
      await held.ready;
      held.release();
      await work;
      const s = h.c.getSnapshot();
      assert.equal(s.body, null);
      assert.equal(s.history.entries.length, 0);
      assert.equal(s.privateDenied, true);
      assert.equal(s.pending, null);
      assert.equal(h.runtime.cookie.status, "ready");
      assert.equal(h.c.can("publish"), false);
    },
  );
  for (const change of [
    "B",
    "same-reference",
    "new-reference",
    "ABA",
    "instructions",
    "dispose",
    "signout",
    "B-C",
  ])
    test("G8 " + kind + " error boundary preserves " + change, async (t) => {
      const h = await prepared(t, kind),
        held = h.denied();
      const work = h.invoke();
      await held.ready;
      const sent = h.calls.at(-1),
        wire = sent.wire;
      let once = true,
        next;
      const off = h.c.subscribe(() => {
        const s = h.c.getSnapshot();
        if (once && s.saveState === "error") {
          once = false;
          assert.equal(s.body, null);
          assert.equal(s.history.entries.length, 0);
          next = viewTransition(t, h, change);
        }
      });
      t.after(off);
      try {
        held.release();
        await work;
        assert.equal(once, false);
        if (next.held) {
          assert.ok(h.c.getSnapshot().busy.includes(next.lane));
          await next.held.ready;
        }
      } finally {
        held.release();
        next?.held?.release();
        await next?.work;
      }
      const s = h.c.getSnapshot();
      if (change === "dispose" || change === "signout") {
        assert.equal(s.ended, true);
        assert.equal(s.body, null);
      } else if (change === "instructions")
        assert.equal(s.instructions.complete, true);
      else {
        assert.equal(s.publication?.clientId, next.clientId);
        assert.equal(s.conflict, null);
      }
      assert.equal(
        h.calls.filter((x) => x.command.action === actions[kind]).length,
        1,
      );
      assert.equal(sent.wire, wire);
      assert.equal(h.c.can("publish"), false);
    });
  test(
    "G8 cosmetic acknowledgement cannot escape owning " + kind + "403 cleanup",
    async (t) => {
      const h = await prepared(t, kind),
        held = h.denied();
      const work = h.invoke();
      await held.ready;
      let once = true;
      const off = h.c.subscribe(() => {
        if (once && h.c.getSnapshot().saveState === "error") {
          once = false;
          h.c.acknowledgeEvidence(false);
        }
      });
      t.after(off);
      held.release();
      await work;
      assert.equal(once, false);
      assert.equal(h.c.getSnapshot().body, null);
      assert.equal(h.c.getSnapshot().history.entries.length, 0);
      assert.equal(h.c.getSnapshot().pending, null);
      assert.equal(h.c.getSnapshot().privateDenied, true);
    },
  );
  test(
    "G8 " +
      kind +
      " registration notification cannot egress or leave a fresh sending command after B",
    async (t) => {
      const h = await prepared(t, kind),
        before = h.calls.length;
      let once = true,
        next;
      const off = h.c.subscribe(() => {
        if (once && h.c.getSnapshot().busy.includes("write")) {
          once = false;
          next = viewTransition(t, h, "B");
        }
      });
      t.after(off);
      try {
        await h.invoke();
        assert.equal(once, false);
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
      await h.c.open(selection);
      assert.equal(h.c.getSnapshot().pending, null);
    },
  );
  test(
    "G8 " + kind + " success receipt is terminal before a new B owner",
    async (t) => {
      const h = await prepared(t, kind);
      let once = true,
        next;
      const off = h.c.subscribe(() => {
        if (once && h.c.getSnapshot().lastReceipt?.action === actions[kind]) {
          once = false;
          next = viewTransition(t, h, "B");
        }
      });
      t.after(off);
      try {
        await h.invoke();
        assert.equal(once, false);
        assert.ok(h.c.getSnapshot().busy.includes("publication"));
        await next.held.ready;
      } finally {
        next?.held?.release();
        await next?.work;
      }
      assert.equal(h.c.getSnapshot().publication?.clientId, ids.other);
      assert.equal(h.c.getSnapshot().lastReceipt, null);
      assert.equal(h.c.can("publish"), false);
    },
  );
  test(
    "G8 " + kind + "409 conflict notification is terminal before B",
    async (t) => {
      const h = await prepared(t, kind),
        held = h.denied(409);
      const work = h.invoke();
      await held.ready;
      let once = true,
        next;
      const off = h.c.subscribe(() => {
        if (once && h.c.getSnapshot().conflict) {
          once = false;
          next = viewTransition(t, h, "B");
        }
      });
      t.after(off);
      try {
        held.release();
        await work;
        assert.equal(once, false);
        await next.held.ready;
      } finally {
        held.release();
        next?.held?.release();
        await next?.work;
      }
      assert.equal(h.c.getSnapshot().conflict, null);
      assert.equal(h.c.getSnapshot().publication?.clientId, ids.other);
    },
  );
  test(
    "G8 " +
      kind +
      "503 preserves exact status READ and explicit immutable retry",
    async (t) => {
      const h = await prepared(t, kind),
        held = h.denied(503);
      const work = h.invoke();
      await held.ready;
      const sent = h.calls.at(-1),
        wire = sent.wire;
      held.release();
      await work;
      assert.equal(h.runtime.cookie.status, "offline");
      assert.equal(h.c.getSnapshot().pending.requestId, sent.command.requestId);
      assert.equal(h.c.getSnapshot().pending.state, "uncertain");
      await h.c.checkConnection();
      await h.c.checkStatus();
      assert.equal(h.calls.at(-1).command.action, "request_status_v1");
      assert.equal(h.calls.at(-1).command.requestId, sent.command.requestId);
      assert.equal(h.c.getSnapshot().pending.requestId, sent.command.requestId);
      const retryHeld = h.denied();
      const retry = h.c.retry();
      await retryHeld.ready;
      const again = h.calls.at(-1);
      assert.equal(again.command.requestId, sent.command.requestId);
      assert.equal(again.wire, wire);
      retryHeld.release();
      await retry;
      assert.equal(h.c.getSnapshot().pending, null);
      assert.equal(h.c.getSnapshot().body, null);
      assert.equal(
        h.calls.filter((x) => x.command.action === actions[kind]).length,
        2,
      );
    },
  );
  for (const status of [403, 401])
    test(
      "G8 native " +
        kind +
        " abort preserves C unless actual wire" +
        status +
        " ends the boundary",
      async (t) => {
        const h = await prepared(t, kind),
          held = h.denied(status);
        const original = h.runtime.cookie.fetcher;
        let signal;
        h.runtime.cookie.fetcher = (url, init) => {
          if (init?.body && JSON.parse(init.body).action === actions[kind])
            signal = init.signal;
          return original(url, init);
        };
        const work = h.invoke();
        await held.ready;
        let next;
        signal.addEventListener(
          "abort",
          () => {
            next = viewTransition(t, h, "B-C");
          },
          { once: true },
        );
        const b = h.c.open({
          ...clone(selection),
          clientId: ids.other,
          draftId: null,
          kind: null,
        });
        try {
          assert.ok(next);
          await next.held.ready;
          held.release();
          await work;
          if (status === 401) {
            assert.equal(h.runtime.cookie.status, "signedout");
            assert.equal(h.c.getSnapshot().ended, true);
            assert.equal(h.c.getSnapshot().pending, null);
          } else {
            assert.equal(h.runtime.cookie.status, "ready");
            assert.ok(h.c.getSnapshot().busy.includes("publication"));
          }
        } finally {
          held.release();
          next?.held?.release();
          await Promise.all([b, next?.work, work]);
        }
        if (status === 401) assert.equal(h.c.getSnapshot().publication, null);
        else assert.equal(h.c.getSnapshot().publication?.clientId, ids.amend);
        assert.equal(h.c.can("publish"), false);
      },
    );
  test(
    "G8 failed original " + kind + " status cannot retire B or lose parked A",
    async (t) => {
      const h = await prepared(t, kind),
        held = h.denied(503);
      const write = h.invoke();
      await held.ready;
      const sent = h.calls.at(-1),
        wire = sent.wire;
      held.release();
      await write;
      await h.c.checkConnection();
      const statusHeld = h.hold("request_status_v1", {
        status: 403,
        replace: () => ({ code: "forbidden" }),
      });
      const status = h.c.checkStatus();
      await statusHeld.ready;
      const next = viewTransition(t, h, "B");
      try {
        await next.held.ready;
        statusHeld.release();
        await status;
        assert.ok(h.c.getSnapshot().busy.includes("publication"));
        assert.equal(h.c.getSnapshot().privateDenied, false);
        assert.equal(h.c.getSnapshot().authorityContext, null);
      } finally {
        statusHeld.release();
        next.held.release();
        await Promise.all([status, next.work]);
      }
      const originalSelection =
        kind === "create"
          ? { ...clone(selection), draftId: null, kind: "review" }
          : selection;
      h.override("read_advisor_publication_v3", clone(h.data.view));
      h.override("read_advisor_care_history_v1", clone(h.data.page));
      await h.c.open(originalSelection);
      assert.equal(h.c.getSnapshot().pending.requestId, sent.command.requestId);
      assert.equal(h.c.getSnapshot().pending.state, "uncertain");
      assert.equal(sent.wire, wire);
      assert.equal(h.c.can("publish"), false);
    },
  );
}
