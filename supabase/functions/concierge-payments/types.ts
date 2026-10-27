/** Private payment boundary. Financial records contain no clinical notes or routine rationale. */
export type PaymentTotals = { serviceCents: number; productCents: number; totalCents: number };
export type ServicePeriod = { startOn: string; endOn: string };
export type ShippingAddress = {recipientName:string;line1:string;line2:string;city:string;region:string;postalCode:string;countryCode:string};
export type ServiceAccess = {status:'unpaid'|'pending_publication'|'active'|'expired'|'cancelled';period:ServicePeriod|null};
export type PaymentQuote = {
  id: string; version: number; publicationVersion: number; currency: 'USD'; status: 'payable' | 'superseded' | 'settled';
  serviceCents: number; servicePeriod: ServicePeriod | null; shippingAddressVersion:number|null;
  items: { recommendationId: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
  productSubtotalCents: number; taxCents: number; shippingCents: number; productTotalCents: number; totalCents: number;
};
export type PaymentClaim = PaymentTotals & {
  id: string; quoteId: string; quoteVersion: number; shippingAddressVersion:number|null; status: 'submitted_unverified' | 'confirmed' | 'rejected'; evidenceId: string | null;
};
export type PaymentView = { revision: number; quotes: PaymentQuote[]; claims: PaymentClaim[];service:ServiceAccess;nextServicePeriod:ServicePeriod|null;shippingAddress:{version:number;address:ShippingAddress}|null;shippingAddresses:{version:number;address:ShippingAddress}[] };
export type FinancialPaymentAction = 'issue_quote' | 'submit_claim' | 'confirm_payment' | 'reject_claim';
export type PaymentAction = FinancialPaymentAction|'confirm_shipping_address';
export type PaymentWriteCall = { name: 'concierge_payment_write'|'concierge_payment_write_v2'; args: {
  p_client_id: string; p_action: PaymentAction; p_expected_revision: number; p_request_id: string; p_payload: Record<string, unknown>;
} };
export type PaymentRpcCall = { name: 'concierge_payment_view'|'concierge_payment_view_v2'; args: { p_client_id: string } } | PaymentWriteCall;
export type PaymentReceipt = {
  revision: number; operation: FinancialPaymentAction; quoteId: string; claimId: string | null;
  status: 'payable' | 'submitted_unverified' | 'confirmed' | 'rejected'; serviceUnlocked: boolean;serviceAccessStatus:'pending_publication'|'active'|null; productOrderStatus: 'ready_to_purchase' | null;
};
export type PaymentRecipient = { method: 'zelle'; name: string; email: string; phone: string };

export type ShippingAddressReceipt={revision:number;operation:'confirm_shipping_address';addressVersion:number};
