/** Wire contract of concierge R1. Product IDs are opaque; private notes are advisor-only. */
export type ConciergeRecommendation = {
  id: string; slot: string; currentProductId: string; proposedProductId: string;
  priceCents: number; currency: 'USD'; rationale: string;
};
export type ConciergeItemState = {
  recommendationId: string; choice: 'approved' | 'declined' | null;
  reason: string | null; received: boolean; startedOn: string | null;
};
export type ConciergePublication = { version: number; recommendations: ConciergeRecommendation[] };
export type ConciergeClientView = {
  revision: number;
  plan: (ConciergePublication & { itemStates: ConciergeItemState[] }) | null;
  history: ConciergePublication[];
  orderProposal: {
    kind: 'proposal'; currency: 'USD'; items: ConciergeRecommendation[]; subtotalCents: number;
    payable: false; shippingAndTaxConfirmed: false;
  };
  routine: { slot: string; productId: string }[];
  routineHistory: { version: number; recommendationId: string; slot: string; productId: string; startedOn: string }[];
};
export type ConciergeAdvisorView = {
  client: ConciergeClientView;
  intake: { version: number; goal: string; note: string } | null;
  draft: { intakeVersion: number; recommendations: ConciergeRecommendation[]; advisorNote: string } | null;
};
export type ConciergePayloads = {
  submit_intake: { goal: string; note: string; baseline: { slot: string; productId: string }[] };
  save_draft: { intakeVersion: number; recommendations: ConciergeRecommendation[]; advisorNote: string };
  publish: Record<string, never>;
  decide: { version: number; recommendationId: string; choice: 'approved' | 'declined'; reason: string };
  receive: { version: number; recommendationId: string };
  start: { version: number; recommendationId: string; startedOn: string };
};
export type ConciergeWriteAction = keyof ConciergePayloads;
export type ConciergeWriteCommand = {
  [A in ConciergeWriteAction]: { action: A; requestId: string; expectedRevision: number }
    & (A extends 'save_draft' | 'publish' ? { clientId: string } : Record<never, never>)
    & (A extends 'publish' ? Record<never, never> : ConciergePayloads[A])
}[ConciergeWriteAction];
export type ConciergeCommand = { action: 'client_read' } | { action: 'advisor_read'; clientId: string } | ConciergeWriteCommand;
export type ConciergeWriteRpc = {
  [A in ConciergeWriteAction]: { name: 'concierge_write'; args: {
    p_client_id: string; p_action: A; p_expected_revision: number; p_request_id: string; p_payload: ConciergePayloads[A];
  } }
}[ConciergeWriteAction];
export type ConciergeRpcCall = { name: 'concierge_client_view'; args: Record<string, never> }
  | { name: 'concierge_advisor_view'; args: { p_client_id: string } } | ConciergeWriteRpc;
export type ConciergeWriteReceipt = { revision: number; publishedVersion: number; operation: ConciergeWriteAction };

/** Identity verification is not an enrollment, entitlement or advisor-capability grant.
 * Every feature RPC must enforce those authoritative guards transactionally. */
export type ConciergeVerifiedIdentity = { id: string; is_anonymous: boolean };
export type ConciergeRpcReply = { data: unknown; error: { message?: string; status?: number } | null };
export type ConciergeAuthenticatedPorts<Call> = {
  allowedOrigins: readonly string[];
  authenticate(token: string, signal?: AbortSignal): Promise<ConciergeVerifiedIdentity | null>;
  rpc(token: string, call: Call, signal?: AbortSignal): Promise<ConciergeRpcReply>;
};
