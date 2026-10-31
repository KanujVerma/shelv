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

export type AdvisorCommand = Extract<
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
>;
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
};
export interface AdvisorState {
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
