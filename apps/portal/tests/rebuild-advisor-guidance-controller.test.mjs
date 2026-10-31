import test from "node:test";
import assert from "node:assert/strict";
import { createAdvisorGuidanceController } from "../src/features/advisor/guidance/controller.ts";
import {
  guidanceApp,
  selection,
  ids,
  clone,
  cursor,
  at,
} from "./rebuild-advisor-guidance-fixture.mjs";
async function ready(t) {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  await h.c.open(selection);
  return h;
}
test("safe VIEW reads do not grant private reads or mutations", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  await h.caps({ edit: false, publish: false });
  await h.c.open(selection);
  assert.equal(h.c.getSnapshot().publication?.clientId, ids.client);
  assert.equal(h.c.getSnapshot().draft, null);
  assert.equal(
    h.calls.some((x) => x.command.action === "read_advisor_care_history_v1"),
    false,
  );
  assert.equal(h.c.can("save"), false);
});
test("originals, amendments and every review attention relationship survive complete pages", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  const original = h.data.report,
    amendment = {
      id: ids.amend,
      event: { kind: "goal_report", id: ids.report },
      previousAmendmentHeadId: null,
      replacement: {
        kind: "goal_report",
        body: { ...original.body, comfort: "SYNTHETIC corrected comfort" },
      },
      occurredOn: { state: "unknown" },
      reason: "correct the report",
      amendedBy: ids.other,
      recordedAt: at,
      attention: null,
    };
  const attention = (n) => ({
    kind: "review_attention",
    eventId: n === 1 ? ids.other : ids.draft,
    publication: { version: 1, documentSchemaVersion: 3 },
    amendmentId: ids.amend,
    event: { kind: "goal_report", id: ids.report },
    attention: {
      id: n === 1 ? ids.other : ids.draft,
      priorReview: { kind: "review", id: n === 1 ? ids.report : ids.draft },
      state: "unresolved",
      resolvedBy: null,
    },
    recordedAt: at,
  });
  h.setHistory([
    {
      ...h.data.page,
      entries: [{ kind: "report", event: original }],
      nextCursor: cursor(1),
    },
    {
      ...h.data.page,
      entries: [
        { kind: "report_amendment", original, amendment },
        attention(1),
      ],
      nextCursor: cursor(2),
    },
    { ...h.data.page, entries: [attention(2)], nextCursor: null },
  ]);
  await h.c.open(selection);
  assert.equal(h.c.getSnapshot().history.complete, false);
  await h.c.loadMoreHistory();
  await h.c.loadMoreHistory();
  assert.equal(h.c.getSnapshot().history.entries.length, 4);
  assert.equal(h.c.getSnapshot().history.complete, true);
  assert.equal(
    h.c.getSnapshot().history.entries[1].amendment.amendedBy,
    ids.other,
  );
});
test("current pagination503 keeps allowed text but403 removes the private projection", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  h.setHistory([{ ...h.data.page, nextCursor: cursor(1) }]);
  await h.c.open(selection);
  h.override("read_advisor_care_history_v1", { code: "unavailable" }, 503);
  await h.c.loadMoreHistory();
  assert.equal(h.c.getSnapshot().history.entries.length, 1);
  assert.equal(h.c.getSnapshot().history.complete, false);
  await h.runtime.restore();
  h.override("read_advisor_care_history_v1", { code: "forbidden" }, 403);
  await h.c.loadMoreHistory();
  assert.equal(h.c.getSnapshot().history.entries.length, 0);
  assert.equal(h.c.getSnapshot().draft, null);
  assert.equal(h.c.getSnapshot().publication?.clientId, ids.client);
});
test("late private403 cannot retire a newly selected draft or leave retry busy", async (t) => {
  const h = await ready(t),
    hold = h.hold("read_advisor_care_history_v1", {
      status: 403,
      replace: () => ({ code: "forbidden" }),
    });
  const old = h.c.refreshHistory();
  await hold.ready;
  await h.c.open({ ...selection, draftId: null, kind: null });
  hold.release();
  await old;
  assert.equal(h.c.getSnapshot().selection.draftId, null);
  assert.equal(h.c.getSnapshot().history.entries.length, 1);
  assert.equal(h.c.getSnapshot().busy.length, 0);
});
test("incomplete guidance saves with exact body; receipt never grants current review rights", async (t) => {
  const h = await ready(t);
  h.c.editBody({
    ...h.data.body,
    conclusion: "",
    rationale: "",
    nextStep: "",
    changes: [""],
  });
  assert.equal(h.c.can("save"), true);
  await h.c.save();
  const sent = h.calls.find(
    (x) => x.command.action === "save_guidance_draft_v1",
  ).command;
  assert.equal(sent.body.conclusion, "");
  assert.deepEqual(sent.body.changes, [""]);
  assert.equal(h.c.getSnapshot().saveState, "saved");
  assert.equal(h.c.getSnapshot().draftCurrent, false);
  assert.equal(h.c.can("review"), false);
});
test("private manifest hash/count cannot authorize unseen source review or exact approval", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  h.data.draft.capturedBasis.sourceManifest.count = 101;
  h.data.draft.currentBasis.sourceManifest.count = 101;
  await h.c.open(selection);
  assert.ok(
    h.c.getSnapshot().missing.some((x) => x.kind === "private_source_reader"),
  );
  h.c.acknowledgeEvidence(true);
  await h.c.review();
  await h.c.approve();
  await h.c.publish();
  assert.equal(
    h.calls.some((x) =>
      [
        "review_guidance_v1",
        "approve_guidance_v1",
        "publish_guidance_v1",
      ].includes(x.command.action),
    ),
    false,
  );
});
test("uncertain save keeps UUID/payload through failed and absent READ status; exact retry uses original bytes", async (t) => {
  const h = await ready(t);
  h.c.editBody({ ...h.data.body, conclusion: "SYNTHETIC unsent" });
  h.override("save_guidance_draft_v1", { code: "uncertain" }, 503);
  await h.c.save();
  const first = h.calls.at(-1);
  assert.equal(h.c.getSnapshot().pending.state, "uncertain");
  await h.runtime.restore();
  h.override("request_status_v1", { code: "unavailable" }, 503);
  await h.c.checkStatus();
  assert.equal(h.c.getSnapshot().pending.requestId, first.command.requestId);
  await h.runtime.restore();
  h.clear("request_status_v1");
  await h.c.checkStatus();
  assert.equal(h.c.getSnapshot().pending.requestId, first.command.requestId);
  h.clear("save_guidance_draft_v1");
  await h.c.retry();
  assert.equal(h.calls.at(-1).wire, first.wire);
  assert.equal(h.c.getSnapshot().pending, null);
});
test("409 fetches latest separately and requires a deliberate revision choice before another save", async (t) => {
  const h = await ready(t);
  h.c.editBody({ ...h.data.body, conclusion: "SYNTHETIC local work" });
  h.override("save_guidance_draft_v1", { code: "revision_conflict" }, 409);
  await h.c.save();
  assert.equal(h.c.getSnapshot().conflict.state, "needs_refresh");
  h.clear("save_guidance_draft_v1");
  h.data.draft.target.revision = 2;
  h.data.draft.target.contentHash = "d".repeat(64);
  h.data.draft.body.conclusion = "SYNTHETIC newer remote work";
  await h.c.refreshAfterConflict();
  assert.equal(h.c.getSnapshot().conflict.state, "current_displayed");
  assert.equal(h.c.can("save"), false);
  h.c.acceptLatestRevision();
  assert.equal(h.c.getSnapshot().body.conclusion, "SYNTHETIC local work");
  assert.equal(h.c.can("save"), true);
});
for (const replacement of [
  { csrf: "SYNTHETIC-new-csrf" },
  { ownerId: ids.other },
])
  test(
    "creation-bound controller clears private snapshots after actual " +
      Object.keys(replacement)[0] +
      " replacement",
    async (t) => {
      const h = await ready(t),
        hold = h.hold("read_guidance_draft_v1");
      const work = h.c.refreshDraft();
      await hold.ready;
      Object.assign(h.login, replacement);
      await h.runtime.restore();
      hold.release();
      await work;
      assert.equal(h.c.getSnapshot().draft, null);
      assert.equal(h.c.getSnapshot().history.entries.length, 0);
      assert.equal(h.c.can("save"), false);
    },
  );
test("current mismatching client/draft/publication/head cannot become evidence", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  h.data.draft.target.clientId = ids.other;
  await h.c.open(selection);
  assert.equal(h.c.getSnapshot().draft, null);
  assert.equal(h.c.can("review"), false);
});
test("conversation facts and preparation note are distinct exact commands without photo fabrication", async (t) => {
  const h = await ready(t);
  await h.c.recordConversation({
    publication: { version: 1, documentSchemaVersion: 3 },
    occurredOn: { state: "unknown" },
    channel: "call",
    clientReported: [
      {
        id: "confirmed-fact",
        text: "SYNTHETIC client confirmed comfort",
        sources: [],
      },
    ],
    advisorConclusions: [],
    agentProposals: [],
    contradictions: [],
  });
  await h.c.refreshHistory();
  await h.c.savePrivateNote(
    { kind: "goal_report", id: ids.report },
    "SYNTHETIC private preparation",
  );
  const convo = h.calls.find(
    (x) => x.command.action === "record_conversation_v1",
  ).command;
  const note = h.calls.find(
    (x) => x.command.action === "append_private_review_note_v1",
  ).command;
  assert.equal(
    convo.body.clientReported[0].text,
    "SYNTHETIC client confirmed comfort",
  );
  assert.equal(note.note, "SYNTHETIC private preparation");
  assert.equal("reply" in note, false);
  assert.equal("photoIds" in convo.body, false);
});
test("zero-source complete evidence requires deliberate acknowledgement before exact human review", async (t) => {
  const h = await ready(t);
  assert.equal(h.c.getSnapshot().evidenceComplete, true);
  assert.equal(h.c.can("review"), false);
  h.c.acknowledgeEvidence(true);
  assert.equal(h.c.can("review"), true);
  await h.c.review();
  const command = h.calls.at(-1).command;
  assert.equal(command.action, "review_guidance_v1");
  assert.deepEqual(command.target, h.data.target);
  assert.equal(h.c.getSnapshot().draftCurrent, false);
  assert.equal(h.c.can("approve"), false);
});
test("unresolved command returns with original payload after leaving and re-entering its selection", async (t) => {
  const h = await ready(t);
  h.c.editBody({ ...h.data.body, conclusion: "SYNTHETIC unresolved" });
  h.override("save_guidance_draft_v1", { code: "uncertain" }, 503);
  await h.c.save();
  const first = h.calls.at(-1);
  await h.runtime.restore();
  await h.c.open({ ...selection, draftId: null, kind: null });
  assert.equal(h.c.getSnapshot().pending, null);
  await h.c.open(selection);
  assert.equal(h.c.getSnapshot().pending?.requestId, first.command.requestId);
  assert.equal(h.c.can("save"), false);
  h.clear("save_guidance_draft_v1");
  await h.c.retry();
  assert.equal(h.calls.at(-1).wire, first.wire);
});
test("old write finally cannot clear a newer write busy lane after selection replacement", async (t) => {
  const h = await ready(t);
  h.c.editBody({ ...h.data.body, conclusion: "SYNTHETIC A" });
  const a = h.hold("save_guidance_draft_v1");
  const first = h.c.save();
  await a.ready;
  await h.c.open({ ...selection, draftId: null, kind: null });
  h.c.editBody({ ...h.data.body, conclusion: "SYNTHETIC B" });
  const b = h.hold("create_guidance_draft_v1");
  const next = h.c.create();
  await b.ready;
  a.release();
  await first;
  assert.ok(h.c.getSnapshot().busy.includes("write"));
  assert.equal(h.c.getSnapshot().pending.action, "create_guidance_draft_v1");
  b.release();
  await next;
});
test("same-selection superseded open cannot initiate private reads after newer restrictive open", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  const hold = h.hold("read_advisor_publication_v3");
  const first = h.c.open(selection);
  await hold.ready;
  await h.c.open(selection);
  const count = h.calls.length;
  hold.release();
  await first;
  assert.equal(h.calls.length, count);
});
test("ended care metadata forbids saving or recording new care even with an edit cookie", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  h.data.view.clientAccess = {
    care: "read_only",
    entitled: true,
    canRead: true,
    canWrite: false,
  };
  await h.c.open(selection);
  h.c.editBody({ ...h.data.body, conclusion: "SYNTHETIC draft" });
  assert.equal(h.c.can("save"), false);
  assert.equal(h.c.can("conversation"), false);
  assert.equal(h.c.can("private_note"), false);
});
test("all source-valid history beyond100 is kept; an omitted tail blocks evidence", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  const pages = Array.from({ length: 5 }, (_, p) => ({
    ...h.data.page,
    entries: Array.from({ length: 25 }, (_, i) => ({
      kind: "report",
      event: {
        ...clone(h.data.report),
        id: `70000000-0000-4000-8000-${String(p * 25 + i + 1).padStart(12, "0")}`,
      },
    })),
    nextCursor:
      p < 4
        ? `r:${"b".repeat(64)}:70000000-0000-4000-8000-${String(p + 1).padStart(12, "0")}`
        : null,
  }));
  let index = 0;
  h.override("read_advisor_care_history_v1", pages[0]);
  await h.c.open(selection);
  assert.equal(h.c.getSnapshot().history.complete, false);
  for (index = 1; index < 5; index++) {
    h.override("read_advisor_care_history_v1", pages[index]);
    await h.c.loadMoreHistory();
  }
  assert.equal(h.c.getSnapshot().history.entries.length, 125);
  assert.equal(h.c.getSnapshot().history.complete, true);
  assert.equal(
    h.c.getSnapshot().history.entries.at(-1).event.id,
    "70000000-0000-4000-8000-000000000125",
  );
  assert.equal(
    h.c.getSnapshot().evidenceComplete,
    false,
    "missing selected input is never reconstructed from a manifest count",
  );
});
test("changed heads and duplicate cross-page identities preserve readable first page but block complete review", async (t) => {
  for (const changed of ["head", "duplicate"]) {
    const h = await guidanceApp(t, createAdvisorGuidanceController);
    h.setHistory([
      { ...h.data.page, nextCursor: cursor(1) },
      {
        ...h.data.page,
        heads: { ...h.data.page.heads, reportHead: changed === "head" ? 2 : 1 },
        nextCursor: null,
      },
    ]);
    await h.c.open(selection);
    await h.c.loadMoreHistory();
    assert.equal(h.c.getSnapshot().history.entries.length, 1);
    assert.equal(h.c.getSnapshot().history.complete, false);
    assert.equal(h.c.can("review"), false);
  }
});
test("a failed status with a current403 removes private views but retains original unresolved intent", async (t) => {
  const h = await ready(t);
  h.c.editBody({ ...h.data.body, conclusion: "SYNTHETIC original intent" });
  h.override("save_guidance_draft_v1", { code: "uncertain" }, 503);
  await h.c.save();
  const original = h.calls.at(-1);
  await h.runtime.restore();
  h.override("request_status_v1", { code: "forbidden" }, 403);
  await h.c.checkStatus();
  assert.equal(h.c.getSnapshot().draft, null);
  assert.equal(h.c.getSnapshot().history.entries.length, 0);
  assert.equal(h.c.getSnapshot().pending.requestId, original.command.requestId);
  assert.equal(h.c.getSnapshot().pending.state, "uncertain");
});
test("dispose clears private data, pending commands, parked context and old late work", async (t) => {
  const h = await ready(t);
  const hold = h.hold("read_advisor_care_history_v1");
  const work = h.c.refreshHistory();
  await hold.ready;
  h.c.dispose();
  hold.release();
  await work;
  assert.equal(h.c.getSnapshot().ended, true);
  assert.equal(h.c.getSnapshot().body, null);
  assert.equal(h.c.getSnapshot().history.entries.length, 0);
  assert.equal(h.c.getSnapshot().pending, null);
});
test("a current safe-read403 also retires private projections without retaining stale text", async (t) => {
  const h = await ready(t);
  h.override("read_advisor_publication_v3", { code: "forbidden" }, 403);
  await h.c.refreshPublication();
  assert.equal(h.c.getSnapshot().history.entries.length, 0);
  assert.equal(h.c.getSnapshot().draft, null);
  assert.equal(h.c.getSnapshot().body, null);
});
test("failed current publication refresh preserves readable data but cannot be acknowledged as fresh", async (t) => {
  const h = await ready(t);
  assert.equal(h.c.getSnapshot().evidenceComplete, true);
  h.override("read_advisor_publication_v3", { code: "unavailable" }, 503);
  await h.c.refreshPublication();
  await h.runtime.restore();
  assert.equal(h.c.getSnapshot().publication?.clientId, ids.client);
  assert.equal(h.c.getSnapshot().evidenceComplete, false);
  h.c.acknowledgeEvidence(true);
  assert.equal(h.c.can("review"), false);
});

test("explicit connection recovery restores the actual cookie without automatically retrying a read or write", async (t) => {
  const h = await ready(t);
  h.override("read_advisor_care_history_v1", { code: "unavailable" }, 503);
  await h.c.refreshHistory();
  assert.equal(h.runtime.cookie.status, "offline");
  const calls = h.calls.length;
  h.clear("read_advisor_care_history_v1");
  await h.c.checkConnection();
  assert.equal(h.runtime.cookie.status, "ready");
  assert.equal(h.calls.length, calls);
  assert.equal(h.c.getSnapshot().busy.length, 0);
  await h.c.refreshHistory();
  assert.equal(h.c.getSnapshot().history.complete, true);
});
