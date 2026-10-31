import test from "node:test";
import assert from "node:assert/strict";
import { createAdvisorController } from "../src/features/advisor/controller.ts";
import { fixture, ids } from "./rebuild/advisor-fixture.mjs";

test("SYNTHETIC/DO NOT FULFILL: incomplete unassigned creation and save use exact commands without creating a client", async () => {
  const f = fixture(),
    c = createAdvisorController(f.options);
  await c.create();
  assert.equal(c.getSnapshot().view.draft.clientId, null);
  c.edit((v) => ({ ...v, title: "unfinished" }));
  assert.equal(c.getSnapshot().save, "idle");
  await c.save();
  assert.equal(c.getSnapshot().save, "saved");
  assert.deepEqual(
    f.calls.map((c) => c.action),
    ["create_draft_v1", "save_draft_v1"],
  );
  assert.equal(f.calls[1].expectedContentRevision, 1);
  assert.deepEqual(f.calls[1].content.goals, []);
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: 503 preserves original request, manual work and exact retry identity", async () => {
  const f = fixture(),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  c.edit((v) => ({ ...v, title: "manual" }));
  f.fail = 503;
  await c.save();
  const request = f.calls.at(-1);
  assert.equal(c.getSnapshot().save, "uncertain");
  c.edit((v) => ({ ...v, summary: "later manual work" }));
  f.fail = 0;
  await c.reconcile();
  assert.deepEqual(f.calls.at(-1), {
    schemaVersion: 1,
    action: "request_status_v1",
    requestId: request.requestId,
  });
  assert.equal(c.getSnapshot().save, "uncertain");
  await c.retry();
  assert.deepEqual(f.calls.at(-1), request);
  assert.equal(c.getSnapshot().local.summary, "later manual work");
  assert.equal(c.getSnapshot().save, "idle");
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: conflict preserves proposed edits, imports compare latest and stale proposals cannot apply", async () => {
  const f = fixture(),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  c.edit((v) => ({ ...v, title: "manual" }));
  f.fail = 409;
  await c.save();
  assert.equal(c.getSnapshot().notice.kind, "conflict");
  assert.equal(c.getSnapshot().local.title, "manual");
  f.fail = 0;
  await c.compareLocal();
  assert.equal(c.getSnapshot().comparison.proposed.title, "manual");
  f.stale = true;
  await c.compareLocal();
  await c.applyImport();
  assert.equal(f.calls.filter((x) => x.action === "apply_import_v1").length, 0);
  assert.equal(c.getSnapshot().local.title, "manual");
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: strict fallback rejects unsupported fields and never executes source instructions", async () => {
  const f = fixture(),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  await c.compareImport(
    JSON.stringify({ ...c.getSnapshot().local, approved: true }),
  );
  assert.equal(c.getSnapshot().notice.kind, "invalid");
  assert.equal(
    f.calls.filter((x) => x.action === "compare_import_v1").length,
    0,
  );
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: session replacement aborts pending operations, clears private drafts and rejects late replies", async () => {
  const f = fixture(),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  c.edit((v) => ({ ...v, title: "private" }));
  f.hold = true;
  const pending = c.save();
  f.invalidate();
  assert.equal(c.getSnapshot().local, null);
  assert.equal(f.signals.at(-1).aborted, true);
  f.release();
  await pending;
  assert.equal(c.getSnapshot().view, null);
  assert.equal(f.memory.size, 0);
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: exact reviews/approval/payment gate deliberate publication; payment does not alter target", async () => {
  const f = fixture({ ready: true }),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  await c.refreshContext();
  assert.equal(c.canPublish(), false);
  await c.approve();
  assert.equal(c.canPublish(), false);
  const before = structuredClone(c.getSnapshot().view.target);
  await c.confirmPayment(ids.claim, "100.00", true);
  assert.deepEqual(c.getSnapshot().view.target, before);
  assert.equal(f.calls.filter((x) => x.action === "publish_plan_v1").length, 0);
  assert.equal(c.canPublish(), true);
  await c.publish();
  assert.equal(c.getSnapshot().receipt.publicationVersion, 1);
  assert.equal(c.getSnapshot().receipt.notificationEventId, ids.event);
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: changed target, wrong client, unreviewed sections and denied permission block authority", async () => {
  const f = fixture({ ready: true }),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  await c.refreshContext();
  await c.approve();
  c.edit((v) => ({ ...v, title: "changed" }));
  await c.publish();
  assert.equal(f.calls.filter((x) => x.action === "publish_plan_v1").length, 0);
  f.options.permissions.approve = false;
  await c.save();
  await c.approve();
  assert.equal(c.getSnapshot().notice.kind, "denied");
  f.context.clientId = ids.other;
  await c.refreshContext();
  assert.equal(c.getSnapshot().context, null);
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: preview uses server-safe unpublished content and exact typed callback without publication fabrication", async () => {
  const f = fixture({ ready: true }),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  await c.preview();
  assert.equal(f.previews.length, 1);
  assert.equal(f.previews[0][0].published, false);
  assert.equal(f.previews[0][0].mode, "advisor-preview");
  assert.equal(Object.hasOwn(f.previews[0][0], "publishedAt"), false);
  assert.equal(f.previews[0][1].draft.id, ids.draft);
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: compared import never overwrites separate unsaved manual work", async () => {
  const f = fixture(),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  const imported = { ...c.getSnapshot().local, title: "agent proposal" };
  c.edit((v) => ({ ...v, summary: "manual correction" }));
  await c.compareImport(JSON.stringify(imported));
  await c.applyImport();
  assert.equal(f.calls.filter((v) => v.action === "apply_import_v1").length, 0);
  assert.equal(c.getSnapshot().local.summary, "manual correction");
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: assignment requires an existing active client and review uses exact server section hash", async () => {
  const f = fixture(),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  await c.loadClients();
  await c.assign(ids.other);
  assert.equal(f.calls.filter((v) => v.action === "assign_draft_v1").length, 0);
  await c.assign(ids.client);
  assert.equal(c.getSnapshot().view.target.clientId, ids.client);
  await c.review("sources");
  const command = f.calls.at(-1);
  assert.equal(command.sectionHash, "a".repeat(64));
  assert.equal(command.expectedAssignmentRevision, 1);
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: malformed acknowledgement remains uncertain and exact pending command survives remount", async () => {
  const f = fixture(),
    execute = f.options.ports.plans.execute;
  f.options.ports.plans.execute = async (c, o) => {
    const value = await execute(c, o);
    return c.action === "save_draft_v1"
      ? { ...value, unexpectedPrivate: "rejected" }
      : value;
  };
  let c = createAdvisorController(f.options);
  await c.open(ids.draft);
  c.edit((v) => ({ ...v, title: "manual" }));
  await c.save();
  assert.equal(c.getSnapshot().save, "uncertain");
  const pending = c.getSnapshot().pending;
  c.dispose();
  c = createAdvisorController(f.options);
  assert.deepEqual(c.getSnapshot().pending, pending);
  assert.equal(c.getSnapshot().local.title, "manual");
  await c.reconcile();
  assert.equal(c.getSnapshot().save, "saved");
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: remount during a write reports uncertainty and never starts a new automatic request", async () => {
  const f = fixture();
  let c = createAdvisorController(f.options);
  await c.open(ids.draft);
  c.edit((v) => ({ ...v, title: "private work" }));
  f.hold = true;
  const saving = c.save();
  c.dispose();
  c = createAdvisorController(f.options);
  assert.equal(c.getSnapshot().save, "uncertain");
  assert.equal(c.getSnapshot().notice.kind, "uncertain");
  f.release();
  await saving;
  assert.equal(c.getSnapshot().save, "uncertain");
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: delayed preview and approval context cannot apply after manual edits", async () => {
  const f = fixture({ ready: true }),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  f.hold = true;
  const preview = c.preview();
  c.edit((v) => ({ ...v, title: "new manual advice" }));
  f.release();
  await preview;
  assert.equal(f.previews.length, 0);
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: mismatched decoded draft target cannot authorize wrong-client actions", async () => {
  const f = fixture({ ready: true }),
    view = f.getView();
  view.target.clientId = ids.other;
  f.setView(view);
  const c = createAdvisorController(f.options);
  await c.open(ids.draft);
  assert.equal(c.getSnapshot().view, null);
  assert.equal(c.canPublish(), false);
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: legacy quotes read through v2 retain legacy confirmation semantics", async () => {
  const f = fixture({ ready: true }),
    p = f.context.payments;
  f.context.payments = {
    ...p,
    schemaVersion: 2,
    quotes: p.quotes.map((q) => ({
      ...q,
      contractVersion: 1,
      paymentOptions: [],
    })),
    claims: p.claims.map((c) => ({ ...c, paymentOptionId: null })),
  };
  const c = createAdvisorController(f.options);
  await c.open(ids.draft);
  await c.refreshContext();
  await c.confirmPayment(ids.claim, "100.00", true);
  const command = f.calls.find((c) => c.action === "confirm_payment");
  assert.equal(Object.hasOwn(command, "schemaVersion"), false);
  assert.equal(command.bankReceiptVerified, true);
  assert.equal(c.getSnapshot().pending, null);
  c.dispose();
});

test("SYNTHETIC/DO NOT FULFILL: accepting a newer comparison base requires another diff before any save", async () => {
  const f = fixture(),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  c.edit((v) => ({ ...v, title: "manual" }));
  const latest = f.getView();
  latest.draft.contentRevision = 2;
  latest.draft.content.summary = "later agent correction";
  f.setView(latest);
  f.stale = true;
  await c.compareLocal();
  await c.rebaseComparison();
  await c.save();
  assert.equal(f.calls.filter((c) => c.action === "save_draft_v1").length, 0);
  assert.equal(c.getSnapshot().local.title, "manual");
  assert.equal(c.getSnapshot().notice.kind, "conflict");
  f.stale = false;
  await c.compareLocal();
  await c.applyImport();
  assert.equal(c.getSnapshot().view.draft.content.title, "manual");
  c.dispose();
});
