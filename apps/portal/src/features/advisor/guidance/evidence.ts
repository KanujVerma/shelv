import type {
  AdvisorCareHistoryEntry,
  AdvisorCareHistoryPage,
  AdvisorPublicationViewV3,
  GuidanceDraftView,
  GuidanceBasis,
  ReviewInputRef,
  InstructionDetail,
  InstructionManifestPage,
  InstructionManifestEntry,
} from "../../../../../../src/contracts/PortalReview.ts";
import type { ReportedProductUse } from "../../../../../../src/contracts/PortalCare.ts";
import { sameCareValue } from "../../../../../../src/contracts/PortalCareValidation.ts";
import {
  collectInstructionManifest,
  bindInstructionForScope,
} from "../../../../../../src/contracts/PortalReviewMapping.ts";
import { guidanceDependencies } from "./types.ts";
import type { GuidanceDependencyRequest } from "./types.ts";

/** Canonical event keys also detect duplicate legacy/typed output across pages. */
export function guidanceHistoryKey(entry: AdvisorCareHistoryEntry): string {
  switch (entry.kind) {
    case "publication":
      return `publication:${entry.publication.version}`;
    case "report":
      return `report:${entry.event.id}`;
    case "report_amendment":
      return `report_amendment:${entry.amendment.id}`;
    case "review_attention":
      return `attention_event:${entry.eventId}`;
    case "conversation":
      return `conversation:${entry.event.id}`;
    case "private_note":
      return `private_note:${entry.note.id}`;
    case "legacy_review_note":
      return `legacy_review_note:${entry.reviewId}`;
    case "guidance":
      return `public_${entry.guidance.record.kind}:${entry.guidance.record.id}`;
    case "legacy_review":
      return `public_review:${entry.review.id}`;
    case "legacy_instruction":
      return `public_instruction:${entry.revision.id}`;
    case "legacy_reply":
      return `public_reply:${entry.id}`;
    case "amendment":
      return `use_amendment:${entry.amendment.id}`;
    default:
      return `${entry.kind}:${entry.event.eventId}`;
  }
}
export function appendGuidanceHistory(
  previous: AdvisorCareHistoryEntry[],
  page: AdvisorCareHistoryPage,
  clientId: string,
): AdvisorCareHistoryEntry[] {
  if (page.clientId !== clientId) throw Error("unavailable");
  const keys = new Set(previous.map(guidanceHistoryKey));
  for (const entry of page.entries) {
    const key = guidanceHistoryKey(entry);
    if (keys.has(key)) throw Error("unavailable");
    keys.add(key);
    const actor =
      entry.kind === "report" || entry.kind === "conversation"
        ? entry.event.reportedBy
        : entry.kind === "report_amendment"
          ? entry.original.reportedBy
          : entry.kind === "use" ||
              entry.kind === "identity" ||
              entry.kind === "reported_product"
            ? entry.event.reportedBy
            : null;
    if (actor !== null && actor !== clientId) throw Error("unavailable");
  }
  return [...previous, ...page.entries];
}
export function inputPresent(
  ref: ReviewInputRef,
  entries: AdvisorCareHistoryEntry[],
): boolean {
  return entries.some((entry) =>
    ref.kind === "goal_report" || ref.kind === "legacy_report"
      ? (entry.kind === "report" &&
          entry.event.kind === ref.kind &&
          entry.event.id === ref.id) ||
        (entry.kind === "report_amendment" &&
          entry.original.kind === ref.kind &&
          entry.original.id === ref.id)
      : ref.kind === "conversation"
        ? entry.kind === "conversation" && entry.event.id === ref.id
        : entry.kind === ref.kind &&
          "event" in entry &&
          "eventId" in entry.event &&
          entry.event.eventId === ref.id,
  );
}
export interface EvidenceInput {
  draft: GuidanceDraftView | null;
  publication: AdvisorPublicationViewV3 | null;
  history: {
    complete: boolean;
    heads: AdvisorCareHistoryPage["heads"] | null;
    entries: AdvisorCareHistoryEntry[];
  };
  reported: { complete: boolean; items: ReportedProductUse[] };
  instructions: {
    complete: boolean;
    pages: InstructionManifestPage[];
    items: InstructionManifestEntry[];
    details: InstructionDetail[];
  };
}
export function guidanceEvidence(
  input: EvidenceInput,
  basis: GuidanceBasis | null,
): {
  complete: boolean;
  reasons: string[];
  missing: GuidanceDependencyRequest[];
} {
  const { draft, publication, history, reported, instructions } = input,
    reasons: string[] = [],
    missing: GuidanceDependencyRequest[] = [];
  if (!draft || !basis || !publication)
    return {
      complete: false,
      reasons: ["load the selected draft and current publication."],
      missing,
    };
  const snapshot = publication.currentGuidance.snapshot;
  if (
    !sameCareValue(basis.publication, snapshot.publication) ||
    !sameCareValue(snapshot.publication, snapshot.currentPublication)
  )
    reasons.push("the draft does not refer to the current publication.");
  if (!history.complete)
    reasons.push(
      "load the complete care history, including corrections and review attention.",
    );
  if (
    !history.heads ||
    history.heads.useHead !== basis.useHead ||
    history.heads.reportHead !== basis.reportHead ||
    history.heads.instructionHead !== basis.instructionHead ||
    history.heads.serviceRevision !== snapshot.serviceRevision ||
    history.heads.publicationVersion !== snapshot.currentPublication.version ||
    snapshot.useHead !== basis.useHead ||
    snapshot.reportHead !== basis.reportHead ||
    snapshot.instructionHead !== basis.instructionHead
  )
    reasons.push(
      "current reports, use or instructions changed. refresh the current information.",
    );
  if (!reported.complete) reasons.push("load all current reported products.");
  if (!instructions.complete)
    reasons.push("load every applicable instruction and its exact directions.");
  else
    try {
      const manifest = collectInstructionManifest(
        publication,
        instructions.pages,
      );
      for (const item of manifest) {
        const detail = instructions.details.find(
          (d) => d.item.instructionId === item.instructionId,
        );
        if (!detail) throw Error();
        bindInstructionForScope(publication, manifest, item.scope, detail);
      }
    } catch {
      reasons.push(
        "the instruction pages or details no longer match this publication.",
      );
    }
  for (const ref of basis.references) {
    if (!inputPresent(ref.event, history.entries))
      reasons.push(
        `referenced ${ref.event.kind.replaceAll("_", " ")} is unavailable: ${ref.event.id}`,
      );
    if (
      ref.amendmentHeadId !== null &&
      !history.entries.some(
        (e) =>
          (e.kind === "report_amendment" &&
            e.amendment.id === ref.amendmentHeadId &&
            e.amendment.event.id === ref.event.id) ||
          (e.kind === "amendment" &&
            e.amendment.id === ref.amendmentHeadId &&
            e.amendment.eventId === ref.event.id),
      )
    )
      reasons.push("a referenced correction is unavailable.");
  }
  if (
    draft.capturedBasis.legacyBasisManifestHash !==
      basis.legacyBasisManifestHash ||
    !sameCareValue(draft.capturedBasis.legacyBasis, basis.legacyBasis)
  ) {
    const dependency = guidanceDependencies.find(
      (d) => d.kind === "legacy_basis_reader",
    )!;
    missing.push(dependency);
    reasons.push(dependency.reason);
  }
  // The captured frame binds all inputs. Even a complete hash/count is never a
  // content reader, source consent, or evidence that the human saw those sources.
  const sourceBearing = basis.references.some(
    (ref) =>
      ref.event.kind === "conversation" &&
      history.entries.some(
        (e) =>
          e.kind === "conversation" &&
          e.event.id === ref.event.id &&
          [
            ...e.event.body.clientReported,
            ...e.event.body.advisorConclusions,
            ...e.event.body.agentProposals,
          ].some((f) => f.sources.length > 0),
      ),
  );
  if (basis.sourceManifest.count > 0 || sourceBearing) {
    const dependency = guidanceDependencies.find(
      (d) => d.kind === "private_source_reader",
    )!;
    missing.push(dependency);
    reasons.push(dependency.reason);
  }
  return {
    complete: reasons.length === 0,
    reasons: [...new Set(reasons)],
    missing,
  };
}
