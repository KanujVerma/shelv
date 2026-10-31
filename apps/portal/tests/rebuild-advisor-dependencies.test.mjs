import test from "node:test";
import assert from "node:assert/strict";
import { dependencyApp, ids } from "./rebuild-advisor-dependencies-helper.mjs";
import { planSections } from "../../../src/contracts/PortalRebuild.ts";
import { original } from "./rebuild-advisor-dependencies-helper.mjs";
const rebaseCalls = (h) =>
  h.calls.filter((x) => x.command.action === "rebase_draft_dependencies_v1");
const cursor = "c:" + "a".repeat(64) + ":" + ids.event;
async function inspect(h) {
  await h.c.open(ids.draft);
  await h.c.inspectDependencies();
}
test("care-aware review and publication remain blocked until current client information is inspected and deliberately rebased", async (t) => {
  const h = await dependencyApp(t);
  await h.c.open(ids.draft);
  await h.c.refreshContext();
  assert.equal(
    h.c.canApprove(),
    false,
    "unknown client basis cannot grant approval",
  );
  await h.c.inspectDependencies();
  assert.equal(h.c.getSnapshot().dependencies.view.needsRebase, true);
  assert.equal(h.c.canReview(), false);
  assert.equal(h.c.canRebaseDependencies(), false);
  await h.c.rebaseDependencies();
  assert.equal(rebaseCalls(h).length, 0, "no blind rebase");
  h.c.acknowledgeDependencies(true);
  assert.equal(h.c.canRebaseDependencies(), true);
  const body = structuredClone(h.c.getSnapshot().local);
  await h.c.rebaseDependencies();
  const s = h.c.getSnapshot();
  assert.deepEqual(s.local, body);
  assert.equal(s.view.draft.contentRevision, 2);
  assert.equal(s.pending, null);
  assert.ok(s.view.sections.every((x) => !x.reviewed));
  assert.equal(s.context, null);
  assert.equal(h.c.canPublish(), false);
  assert.deepEqual(
    Object.keys(rebaseCalls(h)[0].command).sort(),
    [
      "schemaVersion",
      "action",
      "requestId",
      "draftId",
      "expectedContentRevision",
      "expectedAssignmentRevision",
      "expectedHeads",
      "expectedLegacyBasis",
      "expectedLegacyBasisManifestHash",
    ].sort(),
  );
});
for (const head of ["reportHead", "instructionHead"])
  test(
    head + " without a content reader prevents blind clinical rebasing",
    async (t) => {
      const h = await dependencyApp(t);
      h.setCurrent({ [head]: 1 });
      await inspect(h);
      h.c.acknowledgeDependencies(true);
      assert.equal(h.c.getSnapshot().dependencies.status, "unavailable");
      assert.equal(h.c.canRebaseDependencies(), false);
      await h.c.rebaseDependencies();
      assert.equal(rebaseCalls(h).length, 0);
    },
  );
test("changed legacy manifest cannot be accepted from raw hash/revision counters", async (t) => {
  const h = await dependencyApp(t);
  h.setCurrent({ legacyBasisManifestHash: "b".repeat(64) });
  await inspect(h);
  h.c.acknowledgeDependencies(true);
  assert.equal(h.c.canRebaseDependencies(), false);
  assert.match(
    h.c.getSnapshot().dependencies.unavailable.join(" "),
    /intake|baseline/,
  );
});
test("paged history must finish at the inspected use head before acknowledgement", async (t) => {
  const h = await dependencyApp(t);
  h.setHistory([], cursor);
  await inspect(h);
  h.c.acknowledgeDependencies(true);
  assert.equal(h.c.canRebaseDependencies(), false);
  h.setHistory([], null, 3);
  await h.c.loadDependencyHistory();
  assert.equal(h.c.canRebaseDependencies(), false);
  assert.equal(h.c.getSnapshot().dependencies.status, "unavailable");
});
test("manual edit retires held dependency reads, keeps autosave available and retains complete text", async (t) => {
  const h = await dependencyApp(t);
  await h.c.open(ids.draft);
  const held = h.hold("read_draft_dependencies_v1");
  const reading = h.c.inspectDependencies();
  await held.ready;
  h.c.edit((p) => ({ ...p, summary: "new manual buffer" }));
  held.release();
  await reading;
  assert.equal(h.c.getSnapshot().dependencies, null);
  assert.equal(h.c.getSnapshot().local.summary, "new manual buffer");
  await h.c.save();
  assert.equal(h.c.getSnapshot().save, "saved");
  assert.equal(h.c.getSnapshot().local.summary, "new manual buffer");
});
for (const status of [403, 503])
  test(
    "dependency " +
      status +
      " cannot acknowledge or erase a newer uncertain save B",
    async (t) => {
      const h = await dependencyApp(t);
      await h.c.open(ids.draft);
      const held = h.hold("read_draft_dependencies_v1", () =>
        Response.json({ code: "unavailable" }, { status }),
      );
      const reading = h.c.inspectDependencies();
      await held.ready;
      h.c.edit((p) => ({ ...p, summary: "manual B" }));
      const b = h.hold("save_draft_v1", (v) => ({ ...v, unsupported: true }));
      const saving = h.c.save();
      await b.ready;
      b.release();
      await saving;
      const pending = h.c.getSnapshot().pending;
      const bytes = JSON.stringify(pending);
      held.release();
      await reading;
      assert.equal(h.c.getSnapshot().pending, pending);
      assert.equal(JSON.stringify(pending), bytes);
      assert.equal(h.c.getSnapshot().save, "uncertain");
      assert.equal(h.c.getSnapshot().local.summary, "manual B");
    },
  );
test("rebase uncertainty retains exact UUID/payload after denied status and retries only those captured bytes", async (t) => {
  const h = await dependencyApp(t);
  await inspect(h);
  h.c.acknowledgeDependencies(true);
  const held = h.hold("rebase_draft_dependencies_v1", (v) => ({
    ...v,
    unsupported: true,
  }));
  const writing = h.c.rebaseDependencies();
  await held.ready;
  const pending = h.c.getSnapshot().pending;
  held.release();
  await writing;
  assert.equal(h.c.getSnapshot().save, "uncertain");
  const denied = h.hold("request_status_v1", () =>
    Response.json({ code: "forbidden" }, { status: 403 }),
  );
  const checking = h.c.reconcile();
  await denied.ready;
  denied.release();
  await checking;
  assert.equal(h.c.getSnapshot().pending, pending);
  assert.equal(h.c.canPublish(), false);
  await h.c.retry();
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(rebaseCalls(h)[0].bytes, rebaseCalls(h)[1].bytes);
  assert.equal(h.c.getSnapshot().context, null);
  assert.equal(h.c.canPublish(), false);
});
test("definite head CAS conflict requires a fresh inspection and deliberate acknowledgement before a NEW request", async (t) => {
  const h = await dependencyApp(t);
  await inspect(h);
  h.c.acknowledgeDependencies(true);
  h.setCurrent({ useHead: 3 });
  await h.c.rebaseDependencies();
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(h.c.canRebaseDependencies(), false);
  h.setHistory([], null, 3);
  await h.c.inspectDependencies();
  assert.equal(h.c.canRebaseDependencies(), false);
  h.c.acknowledgeDependencies(true);
  await h.c.rebaseDependencies();
  assert.equal(rebaseCalls(h).length, 2);
  assert.notEqual(
    rebaseCalls(h)[0].command.requestId,
    rebaseCalls(h)[1].command.requestId,
  );
  assert.equal(rebaseCalls(h)[1].command.expectedHeads.useHead, 3);
});
test("view-only readers retain safe disclosures and cannot rebase; unassigned preparation makes no care read", async (t) => {
  const h = await dependencyApp(t);
  h.caps.edit = false;
  h.caps.approve = false;
  await inspect(h);
  assert.ok(h.c.getSnapshot().dependencies.publication);
  h.c.acknowledgeDependencies(true);
  await h.c.rebaseDependencies();
  assert.equal(rebaseCalls(h).length, 0);
  const u = await dependencyApp(t, { assigned: false });
  await inspect(u);
  assert.equal(u.calls.filter((x) => x.url.endsWith("/care")).length, 0);
  assert.equal(u.c.getSnapshot().view.draft.clientId, null);
});
test("rebased text needs deliberate fresh section reviews and exact approval; those actions never publish, start or confirm payment", async (t) => {
  const h = await dependencyApp(t);
  await inspect(h);
  h.c.acknowledgeDependencies(true);
  await h.c.rebaseDependencies();
  await h.c.inspectDependencies();
  assert.equal(h.c.canApprove(), false);
  for (const section of planSections) {
    await h.c.review(section);
    await h.c.inspectDependencies();
  }
  assert.equal(h.c.canApprove(), true);
  await h.c.approve();
  assert.ok(
    h.c.getSnapshot().context?.approval,
    "the deliberate exact approval continues after its fresh gate and dependency reads",
  );
  const commands = h.calls.map((x) => x.command);
  assert.equal(
    commands.filter((c) => c.action === "approve_publication_v1").length,
    1,
  );
  assert.equal(
    commands.find((c) => c.action === "approve_publication_v1").target
      .contentRevision,
    2,
  );
  assert.equal(
    commands.filter((c) => c.action === "review_section_v1").length,
    5,
  );
  assert.equal(
    commands.filter((c) =>
      /publish_plan|confirm_payment|report_product_use|record_client_use|report_unreviewed|assign_draft|create_draft/.test(
        c.action,
      ),
    ).length,
    0,
  );
});
test("explicit care factory selects the existing dependency API and real read operation semantics", async (t) => {
  const h = await dependencyApp(t);
  await h.c.open(ids.draft);
  assert.equal(
    h.adapter.permissions.approve,
    true,
    "lawful assigned-gate upgrade",
  );
  const view = h.c.getSnapshot().view;
  const command = {
    schemaVersion: 1,
    action: "read_draft_dependencies_v1",
    draftId: ids.draft,
    contentRevision: view.draft.contentRevision,
    assignmentRevision: view.draft.assignmentRevision,
  };
  const result = await h.adapter.ports.plans.execute(command);
  assert.equal(result.needsRebase, true);
  assert.equal(h.calls.at(-1).url, "/api/advisor/plans");
  const held = h.hold(command.action, () =>
    Response.json({ code: "unavailable" }, { status: 503 }),
  );
  const reading = h.adapter.ports.plans.execute(command);
  await held.ready;
  held.release();
  await assert.rejects(
    reading,
    (e) => e.status === 503 && e.outcome === "rejected",
  );
});
test("legacy factory excludes dependency actions and has no extra care reader", async (t) => {
  const h = await dependencyApp(t, { care: false });
  await h.c.open(ids.draft);
  const before = h.calls.length;
  await assert.rejects(
    h.adapter.ports.plans.execute({
      schemaVersion: 1,
      action: "read_draft_dependencies_v1",
      draftId: ids.draft,
      contentRevision: 1,
      assignmentRevision: 1,
    }),
    (e) => e.status === 403,
  );
  assert.equal(h.calls.length, before);
  assert.equal(h.adapter.ports.dependencies, undefined);
  assert.equal(h.adapter.ports.careRead, undefined);
});
test("history attributed to a different client cannot form a review basis", async (t) => {
  const h = await dependencyApp(t);
  h.setHistory([
    { kind: "use", event: { ...original, reportedBy: ids.other } },
  ]);
  await inspect(h);
  assert.equal(h.c.getSnapshot().dependencies.status, "unavailable");
  h.c.acknowledgeDependencies(true);
  assert.equal(h.c.canRebaseDependencies(), false);
});
for (const property of ["ownerId", "csrf"])
  test(
    "actual " +
      property +
      " replacement retires a held care read and clears private state",
    async (t) => {
      const h = await dependencyApp(t);
      await h.c.open(ids.draft);
      const held = h.hold("read_advisor_publication_v2");
      const reading = h.c.inspectDependencies();
      await held.ready;
      h.login[property] =
        property === "ownerId" ? ids.other : "replacement-csrf";
      await h.runtime.restore();
      held.release();
      await reading;
      assert.equal(h.c.getSnapshot().ended, true);
      assert.equal(h.c.getSnapshot().dependencies, null);
      assert.equal(h.c.getSnapshot().local, null);
    },
  );
for (const property of ["actorId", "view", "edit"])
  test(
    "held dependency read cannot survive restrictive " +
      property +
      " replacement",
    async (t) => {
      const h = await dependencyApp(t);
      await h.c.open(ids.draft);
      const held = h.hold("read_advisor_use_history_v1");
      const reading = h.c.inspectDependencies();
      await held.ready;
      h.adapter.permissions[property] =
        property === "actorId" ? ids.other : false;
      held.release();
      await reading;
      assert.equal(h.c.dependencyReviewCurrent(), false);
      assert.equal(h.c.canRebaseDependencies(), false);
    },
  );
test("newer restrictive gate and mode retirement defeat old disclosure success without losing the draft", async (t) => {
  const h = await dependencyApp(t);
  await h.c.open(ids.draft);
  const held = h.hold("read_advisor_use_history_v1");
  const reading = h.c.inspectDependencies();
  await held.ready;
  h.caps.edit = false;
  h.caps.review = false;
  h.caps.approve = false;
  h.caps.publish = false;
  await h.c.refreshContext();
  held.release();
  await reading;
  assert.equal(h.c.getSnapshot().dependencies, null);
  assert.equal(h.c.getSnapshot().context.approval, null);
  assert.equal(h.c.canApprove(), false);
  h.caps.edit = true;
  await h.c.refreshContext();
  await h.c.inspectDependencies();
  assert.equal(h.c.dependencyReviewCurrent(), true);
  h.c.retireDependencyReview();
  assert.equal(h.c.getSnapshot().dependencies, null);
  assert.equal(h.c.getSnapshot().view.draft.id, ids.draft);
});
test("same-head history pages accumulate without a changed-head page or duplicate automatic mutation", async (t) => {
  const h = await dependencyApp(t);
  h.setHistory([{ kind: "use", event: original }], cursor);
  await inspect(h);
  h.setHistory([{ kind: "amendment", amendment: original.amendment }]);
  await h.c.loadDependencyHistory();
  assert.equal(h.c.getSnapshot().dependencies.history.length, 2);
  h.c.acknowledgeDependencies(true);
  assert.equal(h.c.canRebaseDependencies(), true);
  assert.equal(rebaseCalls(h).length, 0);
});
test("cached rebase status is only acknowledgement and a remount requires fresh dependency/gate reads", async (t) => {
  const h = await dependencyApp(t);
  await inspect(h);
  h.c.acknowledgeDependencies(true);
  const held = h.hold("rebase_draft_dependencies_v1", (v) => ({
    ...v,
    unsupported: true,
  }));
  const writing = h.c.rebaseDependencies();
  await held.ready;
  held.release();
  await writing;
  const originalPending = h.c.getSnapshot().pending;
  h.remount();
  assert.equal(h.c.getSnapshot().pending, originalPending);
  assert.equal(h.c.getSnapshot().dependencies, null);
  await h.c.reconcile();
  assert.equal(h.c.getSnapshot().pending, null);
  assert.equal(h.c.getSnapshot().view.draft.contentRevision, 2);
  assert.equal(h.c.getSnapshot().context, null);
  assert.equal(h.c.canPublish(), false);
});
test("concurrent legacy basis CAS failure cannot mutate the original rebase payload automatically", async (t) => {
  const h = await dependencyApp(t);
  await inspect(h);
  h.c.acknowledgeDependencies(true);
  h.setCurrent({ legacyBasisManifestHash: "d".repeat(64) });
  await h.c.rebaseDependencies();
  assert.equal(rebaseCalls(h).length, 1);
  assert.equal(h.c.getSnapshot().pending, null);
  await h.c.inspectDependencies();
  h.c.acknowledgeDependencies(true);
  await h.c.rebaseDependencies();
  assert.equal(rebaseCalls(h).length, 1);
});
for (const change of ["body", "client", "revision", "basis", "reviews"])
  test(
    "rebase acknowledgement with wrong " +
      change +
      " remains uncertain and cannot approve",
    async (t) => {
      const h = await dependencyApp(t);
      await inspect(h);
      h.c.acknowledgeDependencies(true);
      const held = h.hold("rebase_draft_dependencies_v1", (v) => {
        if (change === "body") v.draft.content.summary = "wrong body";
        if (change === "client") {
          v.draft.clientId = ids.other;
          v.target.clientId = ids.other;
        }
        if (change === "revision") {
          v.draft.contentRevision++;
          v.target.contentRevision++;
        }
        if (change === "basis") v.draft.basis.useRevision++;
        if (change === "reviews")
          v.sections = v.sections.map((s) => ({ ...s, reviewed: true }));
        return v;
      });

      const writing = h.c.rebaseDependencies();
      await held.ready;
      const pending = h.c.getSnapshot().pending;
      held.release();
      await writing;
      assert.equal(h.c.getSnapshot().pending, pending);
      assert.equal(h.c.getSnapshot().save, "uncertain");
      assert.equal(h.c.getSnapshot().view.draft.contentRevision, 1);
      assert.equal(h.c.canApprove(), false);
      assert.equal(h.c.canPublish(), false);
    },
  );
test("current source denial keeps manual work editable and blocks publication without a replacement write", async (t) => {
  const h = await dependencyApp(t);
  await h.c.open(ids.draft);
  const held = h.hold("read_draft_dependencies_v1", () => Response.json({code: "forbidden"}, {status: 403}));
  const reading = h.c.inspectDependencies();
  await held.ready; held.release(); await reading;
  assert.equal(h.c.getSnapshot().dependencies.status, "unavailable");
  assert.equal(h.c.canApprove(), false);
  h.c.edit(p => ({...p, summary: "retained source-denial manual text"}));
  assert.equal(h.c.getSnapshot().local.summary, "retained source-denial manual text");
  assert.equal(rebaseCalls(h).length, 0);
});
