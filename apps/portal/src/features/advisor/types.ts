import type {
  Approval,
  DraftView,
  ExactTarget,
  PlanCommand,
  PlanContent,
  PublishReceipt,
} from "../../../../../src/contracts/PortalRebuild.ts";
import type {
  PlanDirectory,
  PlanImportComparison,
  PlanPreview,
  PlanResult,
} from "../../../../../src/contracts/PortalRebuildMapping.ts";
import type { ConciergeAdvisorDirectory } from "../../../../../src/contracts/ConciergePortal.ts";
import type {
  PaymentView,
  PaymentReceipt,
} from "../../../../../supabase/functions/concierge-payments/types.ts";
import type { mapPaymentViewV2 } from "../../../../../supabase/functions/concierge-payments/methods.ts";
import type { OperationPort } from "../../transport/session.ts";
import type { PlanSessionBoundary } from "../plan/types.ts";
import type { SaveState } from "../../ui/index.ts";
import type {
  AdvisorPublicationViewV2,
  CareCommand,
  CareResult,
  DraftDependenciesView,
  UseHistoryEntry,
} from "../../../../../src/contracts/PortalCare.ts";

export type AdvisorDependencyCommand = Extract<
  PlanCommand,
  { action: "read_draft_dependencies_v1" | "rebase_draft_dependencies_v1" }
>;
export type AdvisorCareRead = Extract<
  CareCommand,
  { action: "read_advisor_publication_v2" | "read_advisor_use_history_v1" }
>;
/** Immutable identity fields only. Historical care overlays/access are not cached. */
export type AdvisorPlanIdentityDocument = {
  version: number;
  documentSchemaVersion: 1 | 2 | 3;
  products: Pick<
    AdvisorPublicationViewV2["plan"]["content"]["products"][number],
    "id" | "name" | "brand" | "variant" | "strength" | "sizeLabel"
  >[];
  slots: { slotId: string; productIds: string[]; label: string }[];
};
export interface AdvisorDependencyReview {
  status: "loading" | "ready" | "unavailable";
  view: DraftDependenciesView | null;
  publication: AdvisorPublicationViewV2 | null;
  documents?: Partial<Record<number, AdvisorPlanIdentityDocument>>;
  history: UseHistoryEntry[];
  nextCursor: string | null;
  acknowledged: boolean;
  unavailable: string[];
}

export type AdvisorCommand =
  | Extract<
      PlanCommand,
      {
        action:
          | "list_plans_v1"
          | "read_draft_v1"
          | "create_draft_v1"
          | "save_draft_v1"
          | "assign_draft_v1"
          | "compare_import_v1"
          | "apply_import_v1"
          | "validate_draft_v1"
          | "preview_draft_v1"
          | "review_section_v1"
          | "approve_publication_v1"
          | "publish_plan_v1"
          | "request_status_v1";
      }
    >
  | AdvisorDependencyCommand;
export type AdvisorWrite = Exclude<
  Extract<AdvisorCommand, { requestId: string }>,
  { action: "request_status_v1" }
>;
export type AdvisorPayments = PaymentView | ReturnType<typeof mapPaymentViewV2>;
/** The coordinator supplies authenticated capabilities, never a display-name policy. SQL rechecks every command. */
export interface AdvisorPermissions {
  actorId: string;
  view: boolean;
  edit: boolean;
  assign: boolean;
  review: boolean;
  approve: boolean;
  publish: boolean;
  confirmPayments: boolean;
}
/** An explicit authorized projection. Unknown gates stay blocked. No draft-content reconstruction of published history. */
export interface AdvisorGateContext {
  clientId: string;
  approval: Approval | null;
  publication: "first" | "later" | "unknown";
  coverage: "active" | "inactive" | "unknown";
  payments: AdvisorPayments;
}
export type AdvisorGateAuthority = Omit<AdvisorGateContext, "payments">;
export type AdvisorPaymentRead = {
  schemaVersion: 2;
  action: "advisor_read";
  clientId: string;
};
export type ConfirmPaymentCommand = {
  schemaVersion?: 2;
  action: "confirm_payment";
  requestId: string;
  clientId: string;
  expectedRevision: number;
  quoteId: string;
  quoteVersion: number;
  shippingAddressVersion: number | null;
  claimId: string;
  serviceCents: number;
  productCents: number;
  totalCents: number;
} & (
  | { bankReceiptVerified: true }
  | { schemaVersion: 2; paymentOptionId: string; receiptVerified: true }
);
export interface AdvisorPorts {
  plans: OperationPort<AdvisorCommand, PlanResult>;
  /** Explicit opt-in to existing M56 commands, never a second backend. */
  dependencies?: OperationPort<AdvisorDependencyCommand, PlanResult>;
  careRead?: OperationPort<AdvisorCareRead, CareResult>;
  clients: OperationPort<{ action: "advisor_list" }, ConciergeAdvisorDirectory>;
  context: OperationPort<
    { clientId: string; draftId: string; target: ExactTarget },
    AdvisorGateAuthority
  >;
  paymentRead: OperationPort<AdvisorPaymentRead, AdvisorPayments>;
  payments?: OperationPort<
    ConfirmPaymentCommand,
    | PaymentReceipt
    | (PaymentReceipt & { schemaVersion: 2; paymentOptionId: string | null })
  >;
}
export interface AdvisorControllerOptions {
  session: PlanSessionBoundary;
  permissions: AdvisorPermissions;
  ports: AdvisorPorts;
  onPreview?: (preview: PlanPreview, draft: DraftView) => void;
}
export type AdvisorNotice = {
  kind: "error" | "denied" | "conflict" | "uncertain" | "invalid";
  title: string;
  /** Internal read provenance retained with session memory across remounts. */
  origin?: { purpose: "context"; actorId: string; target: ExactTarget };
};
export interface AdvisorState {
  dependencies: AdvisorDependencyReview | null;
  needsComparison: boolean;
  ended: boolean;
  busy: boolean;
  save: SaveState;
  notice: AdvisorNotice | null;
  directory: PlanDirectory | null;
  clients: ConciergeAdvisorDirectory | null;
  view: DraftView | null;
  local: PlanContent | null;
  context: AdvisorGateContext | null;
  comparison: PlanImportComparison | null;
  comparisonLocal: PlanContent | null;
  pending: AdvisorWrite | ConfirmPaymentCommand | null;
  receipt: PublishReceipt | null;
}
export type AdvisorController = ReturnType<
  typeof import("./controller.ts").createAdvisorController
>;
