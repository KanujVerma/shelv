// SYNTHETIC actual finite HTTP/cookie/Root/controller, no successful context port.
import test from "node:test";
import assert from "node:assert/strict";
import {
  contextApp,
  selection,
  ids,
  clone,
  at,
} from "./rebuild-advisor-guidance-context-fixture.mjs";
import { createAdvisorGuidanceController } from "../src/features/advisor/guidance/controller.ts";
async function app(t, options = {}) {
  const h = await contextApp(t, createAdvisorGuidanceController);
  if (options.policy) Object.assign(h.data.policy, options.policy);
  if (options.caps) Object.assign(h.data.directory.capabilities, options.caps);
  if (options.source) {
    h.data.draft.capturedBasis.sourceManifest.count = 1;
    h.data.draft.currentBasis.sourceManifest.count = 1;
  }
  h.data.draft.review = {
    id: ids.report,
    target: clone(h.data.target),
    reviewedBy: ids.actor,
    reviewedAt: at,
  };
  h.data.draft.issues = [];
  await h.c.open(selection);
  return h;
}
async function inspect(h) {
  if (h.c.refreshAuthority) await h.c.refreshAuthority();
  h.c.acknowledgeEvidence(true);
}
test("existing source-free disabled path enables deliberate exact self-approval then requires fresh matching authority before publish", async (t) => {
  const h = await app(t);
  assert.equal(h.c.can("approve"), false);
  await inspect(h);
  assert.equal(h.c.can("approve"), true);
  await h.c.approve();
  const approve = h.calls.at(-1).command;
  assert.equal(approve.action, "approve_guidance_v1");
  assert.deepEqual(approve.publisher, { kind: "human", actorId: ids.actor });
  assert.equal(approve.scope, "review.publish");
  assert.equal(h.c.can("publish"), false);
  await h.c.refreshDraft();
  await inspect(h);
  assert.equal(h.c.can("publish"), true);
  await h.c.publish();
  const publish = h.calls.at(-1).command;
  assert.equal(publish.action, "publish_guidance_v1");
  assert.equal(publish.approvalId, ids.other);
  assert.equal(publish.publisher.actorId, ids.actor);
  assert.equal(h.c.getSnapshot().draftCurrent, false);
});
for (const [name, policy, want] of [
  [
    "nonowner policy on",
    { ownerActorId: ids.other, requireKanujApproval: true },
    false,
  ],
  [
    "nonowner policy off",
    { ownerActorId: ids.other, requireKanujApproval: false },
    true,
  ],
  [
    "actual owner policy on",
    { ownerActorId: ids.actor, requireKanujApproval: true },
    true,
  ],
])
  test(name + " governs self approval using actual owner UUID", async (t) => {
    const h = await app(t, { policy });
    await inspect(h);
    assert.equal(h.c.can("approve"), want);
  });
test("EDIT without PUBLISH can read actual policy but cannot approve a self publisher or publish", async (t) => {
  const h = await app(t, { caps: { publish: false } });
  await inspect(h);
  assert.equal(h.c.getSnapshot().authorityContext?.capabilities.edit, true);
  assert.equal(h.c.can("approve"), false);
  assert.equal(h.c.can("publish"), false);
});
test("sourceManifest count without raw evidence remains blocked under otherwise current owner context", async (t) => {
  const h = await app(t, { source: true });
  await inspect(h);
  assert.equal(
    h.c.getSnapshot().authorityContext?.policy.ownerActorId,
    ids.actor,
  );
  assert.equal(h.c.can("approve"), false);
  await h.c.approve();
  assert.equal(
    h.calls.some((c) => c.command.action === "approve_guidance_v1"),
    false,
  );
});
test("manual edits retire context; reverted text still needs a new actual context read and acknowledgement", async (t) => {
  const h = await app(t);
  await inspect(h);
  assert.equal(h.c.can("approve"), true);
  h.c.editBody({ ...h.data.body, conclusion: "SYNTHETIC changed" });
  assert.equal(h.c.can("approve"), false);
  h.c.editBody(clone(h.data.body));
  assert.equal(h.c.can("approve"), false);
  await inspect(h);
  assert.equal(h.c.can("approve"), true);
});
test("current context403 removes private view and cannot leave a new approval enabled", async (t) => {
  const h = await app(t);
  await inspect(h);
  h.override("read_policy_v1", { code: "forbidden" }, 403);
  await h.c.refreshAuthority();
  assert.equal(h.c.getSnapshot().draft, null);
  assert.equal(h.c.getSnapshot().history.entries.length, 0);
  assert.equal(h.c.getSnapshot().authorityContext, null);
  assert.equal(h.c.can("approve"), false);
});

test("context is installed atomically before synchronous subscribers read the actual snapshot", async (t) => {
  const h = await app(t);
  let saw = false;
  h.c.subscribe(() => {
    const state = h.c.getSnapshot();
    if (state.contextStatus === "ready" && state.authorityContext) saw = true;
  });
  await inspect(h);
  assert.equal(saw, true);
  assert.equal(h.c.can("approve"), true);
});
test("old pending status resolves only its original command while a newer selection keeps its review context", async (t) => {
  const h = await app(t);
  h.c.editBody({ ...h.data.body, conclusion: "SYNTHETIC uncertain A" });
  h.override("save_guidance_draft_v1", { code: "uncertain" }, 503);
  await h.c.save();
  const original = h.calls.at(-1).command;
  await h.runtime.restore();
  h.clear("save_guidance_draft_v1");
  const receipt = {
    requestId: original.requestId,
    draft: {
      ...clone(h.data.draft),
      target: {
        ...clone(h.data.target),
        revision: 2,
        contentHash: "d".repeat(64),
      },
      body: clone(original.body),
      review: null,
      approval: null,
    },
  };
  h.override("request_status_v1", { status: "committed", receipt });
  const hold = h.hold("request_status_v1");
  const status = h.c.checkStatus();
  await hold.ready;
  const oldDraft = clone(h.data.draft);
  h.data.draft = {
    ...clone(oldDraft),
    target: { ...clone(h.data.target), draftId: ids.other },
  };
  h.data.draft.review = {
    id: ids.report,
    target: clone(h.data.draft.target),
    reviewedBy: ids.actor,
    reviewedAt: at,
  };
  await h.c.open({ ...selection, draftId: ids.other });
  await inspect(h);
  assert.equal(h.c.can("approve"), true);
  const context = h.c.getSnapshot().authorityContext;
  hold.release();
  await status;
  assert.equal(h.c.getSnapshot().authorityContext, context);
  assert.equal(h.c.can("approve"), true);
  h.data.draft = oldDraft;
  await h.c.open(selection);
  assert.equal(
    h.c.getSnapshot().pending,
    null,
    "exact committed status retired parked A without changing newer context B",
  );
});

test("all current evidence pages are still required under a successfully composed owner context", async (t) => {
  const h = await contextApp(t, createAdvisorGuidanceController);
  h.data.draft.review = {
    id: ids.report,
    target: clone(h.data.target),
    reviewedBy: ids.actor,
    reviewedAt: at,
  };
  h.data.draft.issues = [];
  h.setHistory([
    { ...h.data.page, nextCursor: `r:${"a".repeat(64)}:${ids.report}` },
  ]);
  await h.c.open(selection);
  await inspect(h);
  assert.equal(h.c.getSnapshot().contextStatus, "ready");
  assert.equal(h.c.getSnapshot().evidenceComplete, false);
  assert.equal(h.c.can("approve"), false);
});
test("changed opaque legacy basis stays unavailable despite complete history and owner policy", async (t) => {
  const h = await contextApp(t, createAdvisorGuidanceController);
  h.data.draft.currentBasis = {
    ...clone(h.data.draft.currentBasis),
    legacyBasisManifestHash: "9".repeat(64),
  };
  h.data.draft.needsRebase = true;
  await h.c.open(selection);
  await inspect(h);
  assert.ok(
    h.c.getSnapshot().missing.some((d) => d.kind === "legacy_basis_reader"),
  );
  assert.equal(h.c.can("rebase"), false);
  assert.equal(h.c.can("approve"), false);
});
test("current read-only care observed by context cannot borrow earlier writable publication metadata", async (t) => {
  const h = await app(t);
  h.data.view.clientAccess = {
    care: "read_only",
    entitled: true,
    canRead: true,
    canWrite: false,
  };
  await inspect(h);
  assert.equal(h.c.getSnapshot().publication.clientAccess.canWrite, false);
  assert.equal(h.c.can("approve"), false);
  assert.equal(h.c.can("save"), false);
});
for (const step of [
  "read_policy_v1",
  "advisor_list",
  "read_guidance_draft_v1",
  "read_advisor_publication_v3",
])
  test(
    "manual edit during held " +
      step +
      " retires old context result/error/finally",
    async (t) => {
      const h = await app(t);
      const hold = h.hold(step);
      const pending = h.c.refreshAuthority();
      await hold.ready;
      h.c.editBody({
        ...clone(h.data.body),
        conclusion: "SYNTHETIC new manual owner",
      });
      hold.release();
      await pending;
      assert.equal(h.c.getSnapshot().authorityContext, null);
      assert.equal(
        h.c.getSnapshot().body.conclusion,
        "SYNTHETIC new manual owner",
      );
      assert.equal(h.c.getSnapshot().busy.length, 0);
      assert.equal(h.c.can("approve"), false);
    },
  );
test("observed directory EDIT revocation during a wait clears private views without inventing a permission upgrade", async (t) => {
  const h = await app(t);
  const hold = h.hold("read_guidance_draft_v1");
  const read = h.c.refreshAuthority();
  await hold.ready;
  h.data.directory.capabilities.edit = false;
  hold.release();
  await read;
  assert.equal(h.c.getSnapshot().authorityContext, null);
  assert.equal(h.c.getSnapshot().draft, null);
  assert.equal(h.c.getSnapshot().history.entries.length, 0);
});
for (const replacement of [
  { csrf: "SYNTHETIC-followup-csrf" },
  { ownerId: ids.other },
])
  test(
    "held context cannot cross actual " +
      Object.keys(replacement)[0] +
      " restoration",
    async (t) => {
      const h = await app(t);
      const hold = h.hold("advisor_list");
      const read = h.c.refreshAuthority();
      await hold.ready;
      Object.assign(h.login, replacement);
      await h.runtime.restore();
      hold.release();
      await read;
      assert.equal(h.c.getSnapshot().authorityContext, null);
      assert.equal(h.c.getSnapshot().history.entries.length, 0);
      assert.equal(h.c.getSnapshot().draft, null);
    },
  );
test("context READ failure after uncertain approval retains the original UUID and exact retry payload", async (t) => {
  const h = await app(t);
  await inspect(h);
  h.override("approve_guidance_v1", { code: "uncertain" }, 503);
  await h.c.approve();
  const first = h.calls.at(-1);
  assert.equal(h.c.getSnapshot().pending.requestId, first.command.requestId);
  await h.runtime.restore();
  h.override("request_status_v1", { code: "unavailable" }, 503);
  await h.c.checkStatus();
  assert.equal(h.c.getSnapshot().pending.requestId, first.command.requestId);
  await h.runtime.restore();
  h.clear("approve_guidance_v1");
  await h.c.retry();
  assert.equal(h.calls.at(-1).wire, first.wire);
  assert.equal(h.c.can("publish"), false);
});
test("fresh exact approval for another publisher cannot authorize current self publication", async (t) => {
  const h = await app(t);
  h.data.draft.approval = {
    id: ids.other,
    target: clone(h.data.target),
    scope: "review.publish",
    publisher: { kind: "human", actorId: ids.other },
    approvedBy: ids.actor,
    approvedAt: at,
    policyRevision: 1,
    revokedAt: null,
    receiptId: null,
  };
  await h.c.refreshDraft();
  await inspect(h);
  assert.equal(h.c.can("publish"), false);
  await h.c.publish();
  assert.equal(
    h.calls.some((x) => x.command.action === "publish_guidance_v1"),
    false,
  );
});
test("fresh approval from another policy revision is not current publication authority", async (t) => {
  const h = await app(t);
  h.data.draft.approval = {
    id: ids.other,
    target: clone(h.data.target),
    scope: "review.publish",
    publisher: { kind: "human", actorId: ids.actor },
    approvedBy: ids.actor,
    approvedAt: at,
    policyRevision: 2,
    revokedAt: null,
    receiptId: null,
  };
  await h.c.refreshDraft();
  await inspect(h);
  assert.equal(h.c.can("publish"), false);
});
test("reading composed context never automatically reviews, rebases, approves, saves or publishes", async (t) => {
  const h = await app(t);
  await inspect(h);
  assert.ok(
    h.calls.every((x) =>
      [
        "read_advisor_publication_v3",
        "read_advisor_care_history_v1",
        "read_guidance_draft_v1",
        "read_policy_v1",
        "advisor_list",
      ].includes(x.command.action),
    ),
  );
});
test("injected Chicago day change and offline state retire new write readiness without clearing pending ownership", async (t) => {
  const h = await app(t);
  await inspect(h);
  assert.equal(h.c.can("approve"), true);
  h.advance(24 * 60 * 60 * 1000);
  assert.equal(h.c.getSnapshot().authorityContext, null);
  assert.equal(h.c.can("approve"), false);
});

test("in-flight evidence read cannot be bypassed by a new authority read", async (t) => {
  const h = await app(t);
  const hold = h.hold("read_advisor_care_history_v1");
  const read = h.c.refreshHistory();
  await hold.ready;
  const before = h.calls.length;
  await h.c.refreshAuthority();
  h.c.acknowledgeEvidence(true);
  assert.equal(h.calls.length, before);
  assert.equal(h.c.can("approve"), false);
  hold.release();
  await read;
  await inspect(h);
  assert.equal(h.c.can("approve"), true);
});

test("synchronous snapshot subscribers cannot retire the exact dispatch owner between approval readiness and egress", async (t) => {
  const h = await app(t);
  h.c.subscribe(() => h.c.getSnapshot());
  await inspect(h);
  assert.equal(h.c.can("approve"), true);
  await h.c.approve();
  assert.equal(h.calls.at(-1).command.action, "approve_guidance_v1");
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(h.c.can("publish"), false);
});

test("source-free review, approval and publication remain three deliberate commands with fresh reads between", async (t) => {
  const h = await contextApp(t, createAdvisorGuidanceController);
  h.c.subscribe(() => h.c.getSnapshot());
  await h.c.open(selection);
  await inspect(h);
  assert.equal(h.c.can("review"), true);
  await h.c.review();
  assert.equal(h.c.can("approve"), false);
  await h.c.refreshDraft();
  await inspect(h);
  await h.c.approve();
  assert.equal(h.c.can("publish"), false);
  await h.c.refreshDraft();
  await inspect(h);
  await h.c.publish();
  assert.deepEqual(
    h.calls
      .map((x) => x.command.action)
      .filter(
        (a) =>
          ![
            "read_advisor_publication_v3",
            "read_advisor_care_history_v1",
            "read_guidance_draft_v1",
            "read_policy_v1",
            "advisor_list",
          ].includes(a),
      ),
    ["review_guidance_v1", "approve_guidance_v1", "publish_guidance_v1"],
  );
});

test("approval revoked while the publication read waits cannot survive as displayed publish authority", async (t) => {
  const h = await app(t);
  h.data.draft.approval = {
    id: ids.other,
    target: clone(h.data.target),
    scope: "review.publish",
    publisher: { kind: "human", actorId: ids.actor },
    approvedBy: ids.actor,
    approvedAt: at,
    policyRevision: 1,
    revokedAt: null,
    receiptId: null,
  };
  await h.c.refreshDraft();
  const hold = h.hold("read_advisor_publication_v3");
  const read = h.c.refreshAuthority();
  await hold.ready;
  h.data.draft.approval = null;
  hold.release();
  await read;
  h.c.acknowledgeEvidence(true);
  assert.equal(h.c.getSnapshot().authorityContext, null);
  assert.equal(h.c.can("publish"), false);
});

test("old conflict refresh continuation cannot install its base into a newer selected guidance context", async (t) => {
  const h = await app(t);
  h.c.editBody({
    ...clone(h.data.body),
    conclusion: "SYNTHETIC local conflict A",
  });
  h.override("save_guidance_draft_v1", { code: "revision_conflict" }, 409);
  await h.c.save();
  h.clear("save_guidance_draft_v1");
  const hold = h.hold("read_guidance_draft_v1");
  const old = h.c.refreshAfterConflict();
  await hold.ready;
  h.data.draft = {
    ...clone(h.data.draft),
    target: { ...clone(h.data.target), draftId: ids.other },
  };
  h.data.draft.review = {
    id: ids.report,
    target: clone(h.data.draft.target),
    reviewedBy: ids.actor,
    reviewedAt: at,
  };
  await h.c.open({ ...selection, draftId: ids.other });
  await inspect(h);
  assert.equal(h.c.can("approve"), true);
  const context = h.c.getSnapshot().authorityContext;
  hold.release();
  await old;
  assert.equal(h.c.getSnapshot().conflict, null);
  assert.equal(h.c.getSnapshot().authorityContext, context);
  assert.equal(h.c.can("approve"), true);
});
