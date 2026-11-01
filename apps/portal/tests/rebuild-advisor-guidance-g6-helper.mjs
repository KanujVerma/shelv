// Finite SYNTHETIC HTTP DTOs only. Actual ApplicationSession/cookie/factories,
// positive Root mapping and the unmodified public controller API execute.
import { createAdvisorGuidanceController } from "../src/features/advisor/guidance/controller.ts";
import {
  guidanceApp,
  selection,
  ids,
  clone,
  at,
  cursor,
} from "./rebuild-advisor-guidance-fixture.mjs";
export { selection, ids, clone, cursor };
export const canary = "SYNTHETIC G6 CLIENT A EXACT DIRECTIONS";
export async function loaded(t, { viewOnly = false, empty = false } = {}) {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  const slot = "synthetic-g6-slot";
  const schedule = {
    periods: ["evening"],
    days: { kind: "daily" },
    condition: null,
    asNeeded: false,
    stages: [],
    anchor: "actual_start",
    automaticAdvance: false,
  };
  if (!empty) {
    h.data.view.plan.content.routine = [
      {
        id: slot,
        slotId: slot,
        kind: "instruction",
        productId: null,
        title: "SYNTHETIC instruction",
        directions: ["SYNTHETIC baseline"],
        cautions: [],
        schedule,
      },
    ];
    h.data.view.currentGuidance.instructionCount = 1;
    h.data.view.currentGuidance.snapshot.instructionHead = 1;
    h.data.page.heads.instructionHead = 1;
    h.data.draft.currentBasis.instructionHead = 1;
    h.data.draft.capturedBasis.instructionHead = 1;
  }
  const snapshot = clone(h.data.view.currentGuidance.snapshot);
  const scope = {
    publication: clone(snapshot.publication),
    slotId: slot,
    productId: null,
  };
  const item = {
    instructionId: ids.amend,
    version: 1,
    format: "authored_schedule",
    scope,
    contentHash: "d".repeat(64),
    effectiveOn: "2026-10-01",
    baseInstructionId: null,
    baseInstructionVersion: 0,
    reviewedUseBasis: null,
    basisStatus: "current",
    originalStart: null,
  };
  h.manifest = {
    schemaVersion: 1,
    audience: "advisor",
    clientId: ids.client,
    snapshot,
    total: 1,
    cursor: null,
    items: [item],
    nextCursor: null,
  };
  h.detail = {
    schemaVersion: 1,
    audience: "advisor",
    clientId: ids.client,
    snapshot,
    item,
    content: {
      format: "authored_schedule",
      body: {
        kind: "instruction",
        publication: scope.publication,
        slotId: slot,
        productId: null,
        baseInstructionId: null,
        baseInstructionVersion: 0,
        useBasis: null,
        directions: [canary],
        cautions: [],
        schedule,
        reason: "SYNTHETIC authored",
        effectiveOn: item.effectiveOn,
        reviewId: null,
      },
    },
    publishedBy: ids.actor,
    publishedAt: at,
  };
  h.override("read_advisor_instruction_manifest_v1", h.manifest);
  h.override("read_advisor_instruction_v1", h.detail);
  if (viewOnly) await h.caps({ edit: false, publish: false });
  await h.c.open(selection);
  return h;
}
export function openHeld(h, clientId = ids.other) {
  const view = clone(h.data.view);
  view.clientId = clientId;
  h.override("read_advisor_publication_v3", view);
  const held = h.hold("read_advisor_publication_v3");
  const work = h.c.open({
    ...clone(selection),
    clientId,
    draftId: null,
    kind: null,
  });
  return { held, work };
}
