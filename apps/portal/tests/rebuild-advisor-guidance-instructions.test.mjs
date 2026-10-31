import test from "node:test";
import assert from "node:assert/strict";
import { createAdvisorGuidanceController } from "../src/features/advisor/guidance/controller.ts";
import { newInstructionBody } from "../src/features/advisor/guidance/drafts.ts";
import {
  guidanceApp,
  selection,
  ids,
  clone,
  at,
  cursor,
} from "./rebuild-advisor-guidance-fixture.mjs";
const schedule = {
  periods: ["evening"],
  days: { kind: "daily" },
  condition: null,
  asNeeded: false,
  stages: [
    {
      id: "first",
      directions: "SYNTHETIC first stage",
      minimumDaysFromActualStart: null,
      proceedOnlyWhen: "only when comfortable",
    },
    {
      id: "second",
      directions: "SYNTHETIC second stage",
      minimumDaysFromActualStart: 4,
      proceedOnlyWhen: "human-authored condition",
    },
  ],
  anchor: "actual_start",
  automaticAdvance: false,
};
async function instructions(t) {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  h.data.view.plan.content.routine = ["first-scope", "second-scope"].map(
    (slotId, index) => ({
      id: slotId,
      slotId,
      kind: "instruction",
      productId: null,
      title: slotId,
      directions: ["SYNTHETIC baseline"],
      cautions: [],
      schedule: clone(schedule),
    }),
  );
  h.data.view.currentGuidance.instructionCount = 2;
  h.data.view.currentGuidance.snapshot.instructionHead = 2;
  h.data.page.heads.instructionHead = 2;
  h.data.draft.capturedBasis.instructionHead = 2;
  h.data.draft.currentBasis.instructionHead = 2;
  const snapshot = h.data.view.currentGuidance.snapshot;
  const items = ["first-scope", "second-scope"].map((slotId, index) => ({
    instructionId: index ? ids.other : ids.amend,
    version: 1,
    format: "authored_schedule",
    scope: {
      publication: { version: 1, documentSchemaVersion: 3 },
      slotId,
      productId: null,
    },
    contentHash: (index ? "d" : "c").repeat(64),
    effectiveOn: "2026-10-01",
    baseInstructionId: null,
    baseInstructionVersion: 0,
    reviewedUseBasis: null,
    basisStatus: "current",
    originalStart: null,
  }));
  const details = items.map((item) => ({
    schemaVersion: 1,
    audience: "advisor",
    clientId: ids.client,
    snapshot,
    item,
    content: {
      format: "authored_schedule",
      body: {
        kind: "instruction",
        publication: item.scope.publication,
        slotId: item.scope.slotId,
        productId: null,
        baseInstructionId: null,
        baseInstructionVersion: 0,
        useBasis: null,
        directions: ["SYNTHETIC exact directions"],
        cautions: ["SYNTHETIC full caution"],
        schedule: clone(schedule),
        reason: "SYNTHETIC authored reason",
        effectiveOn: item.effectiveOn,
        reviewId: null,
      },
    },
    publishedBy: ids.actor,
    publishedAt: at,
  }));
  const pages = items.map((item, index) => ({
    schemaVersion: 1,
    audience: "advisor",
    clientId: ids.client,
    snapshot,
    total: 2,
    cursor: index ? cursor(1) : null,
    items: [item],
    nextCursor: index ? null : cursor(1),
  }));
  let manifest = 0;
  h.override("read_advisor_instruction_manifest_v1", pages[0]);
  h.data.items = items;
  h.data.details = details;
  h.data.pages = pages;
  return h;
}
test("all manifest pages and every exact detail are required before evidence acknowledgement", async (t) => {
  const h = await instructions(t);
  await h.c.open(selection);
  await h.c.loadInstructions();
  assert.equal(h.c.getSnapshot().instructions.complete, false);
  assert.equal(h.c.getSnapshot().instructions.items.length, 1);
  h.override("read_advisor_instruction_manifest_v1", h.data.pages[1]);
  let count = 0;
  h.override("read_advisor_instruction_v1", h.data.details[0]);
  await h.c.loadInstructions();
  assert.equal(
    h.c.getSnapshot().instructions.complete,
    false,
    "wrong second detail rejected",
  );
  assert.equal(h.c.getSnapshot().instructions.details.length, 1);
  await h.runtime.restore();
  h.override("read_advisor_instruction_v1", h.data.details[1]);
  await h.c.loadInstructions();
  assert.equal(h.c.getSnapshot().instructions.complete, true);
  assert.equal(h.c.getSnapshot().instructions.details.length, 2);
  assert.equal(h.c.getSnapshot().evidenceComplete, true);
  const calls = h.calls.filter(
    (x) => x.command.action === "read_advisor_instruction_v1",
  );
  assert.equal(calls.at(-1).command.instructionId, ids.other);
  assert.equal(calls.at(-1).command.contentHash, "d".repeat(64));
});
for (const change of [
  "client",
  "publication",
  "head",
  "day",
  "cursor",
  "scope",
])
  test(
    "exact instruction " + change + " mismatch cannot be acknowledged",
    async (t) => {
      const h = await instructions(t);
      await h.c.open(selection);
      const page = clone(h.data.pages[0]);
      if (change === "client") page.clientId = ids.other;
      if (change === "publication") page.snapshot.publication.version = 2;
      if (change === "head") page.snapshot.reportHead = 2;
      if (change === "day") page.snapshot.asOfDay = "2026-11-01";
      if (change === "cursor") page.cursor = cursor(2);
      if (change === "scope") page.items[0].scope.slotId = "absent-scope";
      h.override("read_advisor_instruction_manifest_v1", page);
      await h.c.loadInstructions();
      assert.equal(h.c.getSnapshot().instructions.complete, false);
      assert.equal(h.c.getSnapshot().evidenceComplete, false);
      h.c.acknowledgeEvidence(true);
      assert.equal(h.c.can("review"), false);
    },
  );
test("new instruction retains exact authored base/use and distinct stages without creating Start", async (t) => {
  const h = await instructions(t);
  const body = newInstructionBody(
    h.data.view,
    h.data.items[0].scope,
    h.data.details[0],
  );
  assert.equal(body.baseInstructionId, ids.amend);
  assert.equal(body.baseInstructionVersion, 1);
  assert.equal(body.effectiveOn, "", "human must author the effective day");
  assert.equal(body.useBasis, null);
  assert.equal("originalStart" in body, false);
  assert.equal(body.schedule.automaticAdvance, false);
  assert.equal(body.schedule.anchor, "actual_start");
  assert.equal(
    newInstructionBody(
      h.data.view,
      { ...h.data.items[0].scope, slotId: "absent" },
      null,
    ),
    null,
  );
});

test("held old instruction detail cannot replace a newly refreshed publication snapshot", async (t) => {
  const h = await instructions(t);
  await h.c.open(selection);
  await h.c.loadInstructions();
  h.override("read_advisor_instruction_manifest_v1", h.data.pages[1]);
  h.override("read_advisor_instruction_v1", h.data.details[0]);
  const hold = h.hold("read_advisor_instruction_v1");
  const work = h.c.loadInstructions();
  await hold.ready;
  h.data.view.currentGuidance.snapshot.instructionHead = 3;
  h.data.view.currentGuidance.snapshot.manifestHash = "e".repeat(64);
  await h.c.refreshPublication();
  hold.release();
  await work;
  assert.equal(
    h.c.getSnapshot().publication.currentGuidance.snapshot.instructionHead,
    3,
  );
  assert.equal(h.c.getSnapshot().instructions.details.length, 0);
  assert.equal(h.c.getSnapshot().instructions.complete, false);
  assert.equal(h.c.getSnapshot().busy.length, 0);
});
