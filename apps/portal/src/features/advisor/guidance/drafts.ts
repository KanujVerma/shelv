import type {
  AdvisorPublicationViewV3,
  GuidanceBody,
  ReviewInputRef,
  ReportRef,
  InstructionScope,
  InstructionDetail,
} from "../../../../../../src/contracts/PortalReview.ts";
import { instructionScopes } from "../../../../../../src/contracts/PortalReviewMapping.ts";
import { sameCareValue } from "../../../../../../src/contracts/PortalCareValidation.ts";
export function newReviewBody(
  view: AdvisorPublicationViewV3,
  refs: ReviewInputRef[],
): Extract<GuidanceBody, { kind: "review" }> {
  return {
    kind: "review",
    publication: {
      version: view.plan.version,
      documentSchemaVersion: view.plan.documentSchemaVersion,
    },
    reportRefs: structuredClone(refs),
    occurredOn: { state: "unknown" },
    channel: "portal",
    clientReport: "",
    conclusion: "",
    rationale: "",
    changes: [],
    nextStep: "",
    nextReviewOn: null,
  };
}
export function newReplyBody(
  view: AdvisorPublicationViewV3,
  ref: ReportRef,
): Extract<GuidanceBody, { kind: "reply" }> {
  return {
    kind: "reply",
    publication: {
      version: view.plan.version,
      documentSchemaVersion: view.plan.documentSchemaVersion,
    },
    reportRef: structuredClone(ref),
    reply: "",
    nextStep: null,
  };
}
/** User still authors effectiveOn/directions. Never assigns a physical Start. */
export function newInstructionBody(
  view: AdvisorPublicationViewV3,
  scope: InstructionScope,
  detail: InstructionDetail | null,
): Extract<GuidanceBody, { kind: "instruction" }> | null {
  if (
    scope.publication.documentSchemaVersion !== 3 ||
    !sameCareValue(
      scope.publication,
      view.currentGuidance.snapshot.publication,
    ) ||
    !instructionScopes(view).some((s) => sameCareValue(s, scope))
  )
    return null;
  if (detail && !sameCareValue(detail.item.scope, scope)) return null;
  const use =
    scope.productId === null
      ? null
      : view.use.planProducts.find(
          (p) => p.product.productId === scope.productId,
        );
  if (scope.productId !== null && !use) return null;
  return {
    kind: "instruction",
    publication: { version: view.plan.version, documentSchemaVersion: 3 },
    slotId: scope.slotId,
    productId: scope.productId,
    baseInstructionId: detail?.item.instructionId ?? null,
    baseInstructionVersion: detail?.item.version ?? 0,
    useBasis: use
      ? {
          useRevision: view.use.revision,
          latestEventId: use.latestEvent?.eventId ?? null,
          amendmentHeadId: use.latestEvent?.amendment?.id ?? null,
        }
      : null,
    directions: [],
    cautions: [],
    schedule: {
      periods: [],
      days: { kind: "daily" },
      condition: null,
      asNeeded: false,
      stages: [],
      anchor: "actual_start",
      automaticAdvance: false,
    },
    reason: "",
    effectiveOn: "",
    reviewId: null,
  };
}
