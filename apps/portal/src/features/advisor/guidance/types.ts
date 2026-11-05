import type { ApplicationSession } from "../../../app/session.ts";
import type { OperationPort } from "../../../transport/session.ts";
import type {
  GuidanceCommand,
  GuidanceResult,
  ReviewCommand,
  ReviewResult,
  GuidanceKind,
  GuidanceTarget,
} from "../../../../../../src/contracts/PortalReview.ts";

export type AdvisorReviewCommand = Extract<
  ReviewCommand,
  {
    action:
      | "record_conversation_v1"
      | "append_private_review_note_v1"
      | "read_advisor_care_history_v1"
      | "read_advisor_publication_v3"
      | "read_advisor_reported_products_v1"
      | "read_advisor_instruction_manifest_v1"
      | "read_advisor_instruction_v1"
      | "request_status_v1";
  }
>;
/** Parent composition request only, not a new wire action or permission grant.
 * The owner can resolve these from existing retained reads in the same captured
 * ApplicationSession, then bind the returned context to these exact identities. */
export interface GuidanceParentContextRequest {
  boundaryKey: string;
  selection: AdvisorGuidanceSelection;
  target: GuidanceTarget;
  publisher: { kind: "human"; actorId: string };
  scope: `${GuidanceKind}.publish`;
  required: readonly [
    "read_policy_v1",
    "fresh_guidance_draft",
    "current_publication",
    "current_session_capabilities",
  ];
}
export type GuidanceDependencyRequest =
  | {
      state: "unavailable";
      kind: "private_source_reader";
      owner: "Root/API";
      reason: string;
    }
  | {
      state: "unavailable";
      kind: "guidance_authority";
      owner: "parent composition";
      reason: string;
    }
  | {
      state: "unavailable";
      kind: "legacy_basis_reader";
      owner: "Root/API";
      reason: string;
    }
  | {
      state: "unavailable";
      kind: "photo_upload";
      owner: "Root/API";
      reason: string;
    };
/** Requests only. None grants consent, supplies fake data, or is an executable port. */
export const guidanceDependencies: readonly GuidanceDependencyRequest[] =
  Object.freeze([
    {
      state: "unavailable",
      kind: "private_source_reader",
      owner: "Root/API",
      reason:
        "referenced source content and current source access are unavailable. review the sources after access is restored.",
    },
    {
      state: "unavailable",
      kind: "guidance_authority",
      owner: "parent composition",
      reason:
        "current approval policy and exact guidance authority are unavailable. refresh authority before approval or publication.",
    },
    {
      state: "unavailable",
      kind: "legacy_basis_reader",
      owner: "Root/API",
      reason:
        "changed original client context is unavailable. review that context before updating the draft basis.",
    },
    {
      state: "unavailable",
      kind: "photo_upload",
      owner: "Root/API",
      reason:
        "photo upload is unavailable. you can record this conversation without a photo.",
    },
  ]);
export interface AdvisorGuidanceAdapters {
  readonly review: OperationPort<AdvisorReviewCommand, ReviewResult>;
  readonly guidance: OperationPort<GuidanceCommand, GuidanceResult>;
  readonly unavailable: readonly GuidanceDependencyRequest[];
  isCurrent(): boolean;
  dispose(): void;
}
/** Navigation data only; parent owns actual routes, Back, focus and shell. */
export type AdvisorGuidanceSelection = {
  clientId: string;
  publicationVersion: number | null;
  draftId: string | null;
  kind: GuidanceKind | null;
};
export interface AdvisorGuidanceNavigation {
  selection: AdvisorGuidanceSelection;
  onSelect(selection: AdvisorGuidanceSelection): void;
  onBack(): void;
}
export type AdvisorGuidanceOptions = {
  runtime: ApplicationSession;
  context?: import("../../../app/advisor-guidance-context.ts").AdvisorGuidanceContextPort;
};
export type ExactGuidanceSelection = {
  target: GuidanceTarget;
  publisher: { kind: "human"; actorId: string };
  scope: `${GuidanceKind}.publish`;
};
