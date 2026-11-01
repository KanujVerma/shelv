// Finite SYNTHETIC HTTP/delivery/logout only; actual session/cookie/raw/Root.
import test from "node:test";
import assert from "node:assert/strict";
import {
  loaded,
  openHeld,
  ids,
  selection,
  clone,
} from "./rebuild-advisor-guidance-g6-helper.mjs";
import { ready } from "./rebuild-advisor-guidance-g123-helper.mjs";
import { createAdvisorReviewRequest } from "../src/app/advisor-review-request.ts";
import { readReviewCommand } from "../../../src/contracts/PortalReviewValidation.ts";

const kinds = {
  history: {
    action: "read_advisor_care_history_v1",
    method: "refreshHistory",
    emissions: 4,
  },
  reported: {
    action: "read_advisor_reported_products_v1",
    method: "loadMoreReportedProducts",
    emissions: 5,
  },
  instructions: {
    action: "read_advisor_instruction_manifest_v1",
    method: "loadInstructions",
    emissions: 5,
  },
  publication: {
    action: "read_advisor_publication_v3",
    method: "refreshPublication",
    emissions: 4,
  },
  draft: {
    action: "read_guidance_draft_v1",
    method: "refreshDraft",
    emissions: 3,
  },
  authority: {
    action: "read_policy_v1",
    method: "refreshAuthority",
    emissions: 4,
  },
};
async function failing(t, kind) {
  const h = kind === "authority" ? await ready(t) : await loaded(t);
  if (kind === "reported") {
    h.data.view.use.reportedProducts.nextCursor = `c:${"a".repeat(64)}:${ids.report}`;
    await h.c.refreshPublication();
  }
  const { action, method } = kinds[kind];
  h.override(action, { code: "forbidden" }, 403);
  const held = h.hold(action),
    work = h.c[method]();
  await held.ready;
  return { h, held, work };
}
function move(h, change) {
  if (change === "dispose") {
    h.c.dispose();
    return {};
  }
  if (change === "signout") return { work: h.runtime.signOut() };
  if (change === "rejected-selection")
    return {
      work: h.c.open({
        ...clone(selection),
        clientId: "not-a-uuid",
        draftId: null,
        kind: null,
      }),
    };
  if (change === "new-reference") {
    h.clear("read_advisor_publication_v3");
    const held = h.hold("read_advisor_publication_v3");
    return { held, work: h.c.refreshPublication() };
  }
  if (change === "instructions") {
    h.override("read_advisor_instruction_manifest_v1", h.manifest);
    const held = h.hold("read_advisor_instruction_manifest_v1");
    return { held, work: h.c.loadInstructions() };
  }
  if (change === "same-value-ABA") {
    const b = h.c.open({
      ...clone(selection),
      clientId: ids.other,
      draftId: null,
      kind: null,
    });
    const a = openHeld(h, ids.client);
    return { held: a.held, work: Promise.all([b, a.work]) };
  }
  return openHeld(h);
}

for (const [kind, info] of Object.entries(kinds))
  for (let emission = 1; emission <= info.emissions; emission++)
    test(
      "G7 " +
        kind +
        "403 notification " +
        emission +
        " preserves a newer B owner",
      async (t) => {
        const { h, held, work } = await failing(t, kind);
        let seen = 0,
          next;
        const off = h.c.subscribe(() => {
          if (++seen === emission) next = move(h, "selection");
        });
        t.after(off);
        try {
          held.release();
          await work;
          assert.ok(
            next,
            "requested actual post-response notification must occur",
          );
          assert.equal(h.c.getSnapshot().selection.clientId, ids.other);
          assert.equal(h.c.getSnapshot().body, null);
          assert.equal(h.c.getSnapshot().instructions.details.length, 0);
          assert.ok(h.c.getSnapshot().busy.includes("publication"));
          await next.held.ready;
        } finally {
          next?.held?.release();
          await next?.work;
        }
        assert.equal(h.c.getSnapshot().publication?.clientId, ids.other);
        assert.equal(h.c.can("publish"), false);
        assert.equal(h.runtime.cookie.status, "ready");
      },
    );

for (const kind of ["history", "reported", "instructions"])
  for (const change of [
    "instructions",
    "new-reference",
    "same-value-ABA",
    "rejected-selection",
    "dispose",
    "signout",
  ])
    test("G7 inner " + kind + " denial preserves " + change, async (t) => {
      const { h, held, work } = await failing(t, kind);
      let seen = 0,
        next;
      const off = h.c.subscribe(() => {
        if (++seen === 2) next = move(h, change);
      });
      t.after(off);
      try {
        held.release();
        await work;
        assert.ok(next);
        if (next.held) {
          assert.ok(h.c.getSnapshot().busy.length > 0);
          await next.held.ready;
        }
        assert.equal(
          h.c.getSnapshot().body,
          null,
          "owning A private projection must already be cleared",
        );
        assert.equal(h.c.can("publish"), false);
      } finally {
        next?.held?.release();
        await next?.work;
      }
      const s = h.c.getSnapshot();
      if (change === "dispose" || change === "signout") {
        assert.equal(s.ended, true);
        assert.equal(s.instructions.details.length, 0);
      } else if (change === "instructions") {
        assert.equal(s.instructions.complete, true);
        assert.equal(s.instructions.details.length, 1);
      } else if (change === "rejected-selection")
        assert.equal(s.selection.clientId, "not-a-uuid");
      else assert.equal(s.publication?.clientId, ids.client);
    });

for (const change of [
  "selection",
  "instructions",
  "new-reference",
  "same-value-ABA",
  "rejected-selection",
  "dispose",
  "signout",
])
  test(
    "G7 actual old draft AbortSignal cannot cancel or overwrite " + change,
    async (t) => {
      const h = await loaded(t);
      const original = h.runtime.cookie.fetcher;
      let signal;
      // Observe only the actual fixed raw HTTP signal. Every response still comes
      // from the existing finite fixture; acquire/current/rights are untouched.
      h.runtime.cookie.fetcher = (url, init) => {
        if (
          init?.body &&
          JSON.parse(init.body).action === "read_guidance_draft_v1"
        )
          signal = init.signal;
        return original(url, init);
      };
      const draftHeld = h.hold("read_guidance_draft_v1"),
        draft = h.c.refreshDraft();
      await draftHeld.ready;
      let next;
      signal.addEventListener(
        "abort",
        () => {
          next = move(h, change);
        },
        { once: true },
      );
      h.override("read_advisor_care_history_v1", { code: "forbidden" }, 403);
      try {
        await h.c.refreshHistory();
        assert.ok(next);
        if (next.held) {
          assert.ok(h.c.getSnapshot().busy.length > 0);
          await next.held.ready;
        }
        assert.equal(h.c.getSnapshot().body, null);
        assert.equal(h.c.can("publish"), false);
      } finally {
        next?.held?.release();
        draftHeld.release();
        await Promise.all([next?.work, draft]);
      }
      const s = h.c.getSnapshot();
      if (change === "dispose" || change === "signout")
        assert.equal(s.ended, true);
      else if (change === "instructions")
        assert.equal(s.instructions.complete, true);
      else if (change === "selection")
        assert.equal(s.publication?.clientId, ids.other);
      else if (change !== "rejected-selection")
        assert.equal(s.publication?.clientId, ids.client);
    },
  );

test("G7 actual wire401 still ends the boundary and the newer B read", async (t) => {
  const { h, held, work } = await failing(t, "history");
  let seen = 0,
    next;
  const off = h.c.subscribe(() => {
    if (++seen === 2) next = move(h, "selection");
  });
  t.after(off);
  try {
    held.release();
    await work;
    assert.ok(h.c.getSnapshot().busy.includes("publication"));
    await next.held.ready;
    h.override("read_advisor_care_history_v1", { code: "session_ended" }, 401);
    await assert.rejects(
      createAdvisorReviewRequest(h.runtime).execute(
        readReviewCommand({
          schemaVersion: 1,
          action: "read_advisor_care_history_v1",
          clientId: ids.other,
          version: null,
          cursor: null,
          limit: 25,
        }),
      ),
      (error) => error.status === 401,
    );
    assert.equal(h.runtime.cookie.status, "signedout");
    assert.equal(h.c.getSnapshot().ended, true);
    assert.equal(h.c.getSnapshot().pending, null);
  } finally {
    next?.held?.release();
    await next?.work;
  }
  assert.equal(h.c.getSnapshot().body, null);
  assert.equal(h.c.getSnapshot().publication, null);
});

for (const target of [
  "history",
  "reported",
  "instructions",
  "publication",
  "draft",
  "authority",
])
  for (const change of ["selection", "new-reference", "dispose"])
    test(
      "G7 captured " +
        target +
        " abort targets exclude " +
        change +
        " and its finally",
      async (t) => {
        const h = target === "authority" ? await ready(t) : await loaded(t);
        if (target === "reported") {
          h.data.view.use.reportedProducts.nextCursor = `c:${"a".repeat(64)}:${ids.report}`;
          await h.c.refreshPublication();
        }
        const action = kinds[target].action;
        const original = h.runtime.cookie.fetcher;
        let signal;
        h.runtime.cookie.fetcher = (url, init) => {
          if (init?.body && JSON.parse(init.body).action === action)
            signal = init.signal;
          return original(url, init);
        };
        const oldHeld = h.hold(action),
          old = h.c[kinds[target].method]();
        await oldHeld.ready;
        let next;
        signal.addEventListener(
          "abort",
          () => {
            next = move(h, change);
          },
          { once: true },
        );
        const denial = target === "history" ? "instructions" : "history";
        h.override(kinds[denial].action, { code: "forbidden" }, 403);
        const beforeDenial = h.calls.filter(
          (x) => x.command.action === kinds[denial].action,
        ).length;
        try {
          await h.c[kinds[denial].method]();
          assert.ok(next);
          if (next.held) {
            assert.ok(h.c.getSnapshot().busy.includes("publication"));
            await next.held.ready;
          }
          oldHeld.release();
          await old;
          if (next.held)
            assert.ok(
              h.c.getSnapshot().busy.includes("publication"),
              "old finally cannot clear the new busy lane",
            );
          if (target === "authority") {
            // New history capture retires the old authority before any history
            // egress. This is honest cancellation, not a claimed wire403 result.
            assert.equal(
              h.calls.filter((x) => x.command.action === kinds[denial].action)
                .length,
              beforeDenial,
            );
          }
        } finally {
          oldHeld.release();
          next?.held?.release();
          await Promise.all([old, next?.work]);
        }
        const s = h.c.getSnapshot();
        if (change === "dispose") assert.equal(s.ended, true);
        else
          assert.equal(
            s.publication?.clientId,
            change === "selection" ? ids.other : ids.client,
          );
        assert.equal(h.c.can("publish"), false);
      },
    );

test("G7 failed status of parked A cannot poison the newer B context gate", async (t) => {
  const h = await ready(t);
  h.override("approve_guidance_v1", { code: "unavailable" }, 503);
  await h.c.approve();
  const sent = h.calls.at(-1),
    wire = sent.wire;
  await h.c.checkConnection();
  h.clear("approve_guidance_v1");
  const statusHeld = h.hold("request_status_v1", {
    status: 403,
    replace: () => ({ code: "forbidden" }),
  });
  const status = h.c.checkStatus();
  await statusHeld.ready;
  const next = openHeld(h);
  try {
    await next.held.ready;
    statusHeld.release();
    await status;
    assert.equal(h.c.getSnapshot().selection.clientId, ids.other);
    assert.ok(h.c.getSnapshot().busy.includes("publication"));
    assert.equal(h.c.getSnapshot().privateDenied, false);
    assert.equal(h.c.getSnapshot().authorityContext, null);
  } finally {
    statusHeld.release();
    next.held.release();
    await Promise.all([status, next.work]);
  }
  await h.c.open(selection);
  assert.equal(h.c.getSnapshot().pending.requestId, sent.command.requestId);
  assert.equal(h.c.getSnapshot().pending.state, "uncertain");
  assert.equal(sent.wire, wire);
  assert.equal(h.c.can("publish"), false);
});

test("G7 cosmetic acknowledgement during owning denial cannot skip private cleanup", async (t) => {
  const { h, held, work } = await failing(t, "history");
  let once = true;
  const off = h.c.subscribe(() => {
    if (once && h.c.getSnapshot().history.error) {
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
  assert.equal(h.c.getSnapshot().privateDenied, true);
});

test("G7 VIEW-only scoped instruction403 preserves the newer safe B read", async (t) => {
  const h = await loaded(t, { viewOnly: true });
  h.override(
    "read_advisor_instruction_manifest_v1",
    { code: "forbidden" },
    403,
  );
  const held = h.hold("read_advisor_instruction_manifest_v1"),
    work = h.c.loadInstructions();
  await held.ready;
  let emissions = 0,
    next;
  const off = h.c.subscribe(() => {
    if (++emissions === 2) next = move(h, "selection");
  });
  t.after(off);
  try {
    held.release();
    await work;
    assert.ok(next);
    assert.ok(h.c.getSnapshot().busy.includes("publication"));
    await next.held.ready;
  } finally {
    next?.held?.release();
    await next?.work;
  }
  assert.equal(h.c.getSnapshot().publication?.clientId, ids.other);
  assert.equal(h.c.getSnapshot().body, null);
  assert.equal(h.c.can("review"), false);
  assert.equal(h.c.can("publish"), false);
});

test("G7 first error notification preserves a new same-client instruction lane and clears denied private data", async (t) => {
  const { h, held, work } = await failing(t, "history");
  let next,
    started = false;
  const off = h.c.subscribe(() => {
    if (!started) {
      started = true;
      next = move(h, "instructions");
    }
  });
  t.after(off);
  try {
    held.release();
    await work;
    assert.equal(h.c.getSnapshot().body, null);
    assert.ok(h.c.getSnapshot().busy.includes("instructions"));
    await next.held.ready;
  } finally {
    next?.held?.release();
    await next?.work;
  }
  assert.equal(h.c.getSnapshot().instructions.complete, true);
  assert.equal(h.c.can("publish"), false);
});

test("G7 first error notification preserves the newer exact status owner without restoring private data", async (t) => {
  const h = await loaded(t);
  h.c.editBody({
    ...clone(h.data.body),
    conclusion: "SYNTHETIC G7 immutable original save",
  });
  const saved = h.hold("save_guidance_draft_v1"),
    write = h.c.save();
  await saved.ready;
  const sent = h.calls.at(-1),
    wire = sent.wire;
  h.override("read_advisor_care_history_v1", { code: "forbidden" }, 403);
  const denial = h.hold("read_advisor_care_history_v1"),
    failed = h.c.refreshHistory();
  await denial.ready;
  saved.release();
  await write;
  const statusHeld = h.hold("request_status_v1");
  let started = false,
    status;
  const off = h.c.subscribe(() => {
    if (!started) {
      started = true;
      status = h.c.checkStatus();
    }
  });
  t.after(off);
  try {
    denial.release();
    await failed;
    assert.equal(h.c.getSnapshot().body, null);
    assert.ok(h.c.getSnapshot().busy.includes("status"));
    await statusHeld.ready;
  } finally {
    denial.release();
    saved.release();
    statusHeld.release();
    await Promise.all([status, write]);
  }
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(h.c.getSnapshot().body, null);
  assert.equal(h.calls.at(-1).command.requestId, sent.command.requestId);
  assert.equal(sent.wire, wire);
  assert.equal(h.c.can("publish"), false);
});
