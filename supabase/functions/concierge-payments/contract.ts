import type { PaymentClaim, PaymentQuote, PaymentReceipt, PaymentRecipient, PaymentRpcCall, PaymentTotals, ServicePeriod, ShippingAddress, ShippingAddressReceipt, ServiceAccess } from './types.ts';

export const MONTHLY_SERVICE_CENTS = 10000;
export const MAX_PAYMENT_CENTS = 100000000;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function requirePayment(value: unknown): asserts value { if (!value) throw new Error('invalid_input'); }
export function paymentObject(value: unknown): Record<string, unknown> {
  requirePayment(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
}
export function paymentUuid(value: unknown): string { requirePayment(typeof value === 'string' && uuidPattern.test(value)); return value.toLowerCase(); }
export function paymentInteger(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): number {
  requirePayment(typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum); return value;
}
export function paymentKeys(value: Record<string, unknown>, fields: readonly string[]): void {
  requirePayment(Object.keys(value).length === fields.length && fields.every(field => Object.hasOwn(value, field)));
}
function identifier(value: unknown): string {
  requirePayment(typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value) && !['constructor', 'prototype', '__proto__'].includes(value)); return value;
}
function date(value: unknown): string {
  requirePayment(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value));
  const time = Date.parse(value); requirePayment(Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value); return value;
}
function period(value: unknown): ServicePeriod | null {
  if (value === null) return null;
  const row = paymentObject(value); paymentKeys(row, ['startOn', 'endOn']);
  const startOn = date(row.startOn), endOn = date(row.endOn);
  const next = new Date(`${startOn}T00:00:00.000Z`), day = next.getUTCDate();
  next.setUTCDate(1); next.setUTCMonth(next.getUTCMonth()+1);
  const last = new Date(next); last.setUTCMonth(last.getUTCMonth()+1); last.setUTCDate(0);
  next.setUTCDate(Math.min(day,last.getUTCDate()));
  requirePayment(endOn === next.toISOString().slice(0,10));
  return { startOn, endOn };
}
function cents(value: unknown): number { return paymentInteger(value, 0, MAX_PAYMENT_CENTS); }
function allocations(row: Record<string, unknown>): PaymentTotals {
  const serviceCents = cents(row.serviceCents), productCents = cents(row.productCents), totalCents = cents(row.totalCents);
  requirePayment([0, MONTHLY_SERVICE_CENTS].includes(serviceCents) && totalCents > 0 && serviceCents + productCents === totalCents);
  return { serviceCents, productCents, totalCents };
}
function shippingVersion(value:unknown,products:number):number|null { if(products>0)return paymentInteger(value,1);requirePayment(value===null);return null; }
function quoteBasis(row: Record<string, unknown>) { const totals=allocations(row);return { quoteId: paymentUuid(row.quoteId), quoteVersion: paymentInteger(row.quoteVersion, 1), ...totals,shippingAddressVersion:shippingVersion(row.shippingAddressVersion,totals.productCents) }; }
function nullableUuid(value: unknown) { return value === null ? null : paymentUuid(value); }
function readItems(value: unknown) {
  requirePayment(Array.isArray(value) && value.length <= 50);
  const seen = new Set<string>();
  return value.map(raw => {
    const row = paymentObject(raw); const recommendationId = identifier(row.recommendationId);
    requirePayment(!seen.has(recommendationId)); seen.add(recommendationId);
    const quantity = paymentInteger(row.quantity, 1, 100), unitPriceCents = cents(row.unitPriceCents), lineTotalCents = cents(row.lineTotalCents);
    requirePayment(unitPriceCents > 0 && quantity * unitPriceCents === lineTotalCents);
    return { recommendationId, quantity, unitPriceCents, lineTotalCents };
  });
}
function quoteMoney(row: Record<string, unknown>) {
  const servicePeriod = period(row.servicePeriod), serviceCents = cents(row.serviceCents);
  requirePayment([0,MONTHLY_SERVICE_CENTS].includes(serviceCents) && (serviceCents>0 || servicePeriod===null));
  const items = readItems(row.items), productSubtotalCents = cents(row.productSubtotalCents), taxCents = cents(row.taxCents), shippingCents = cents(row.shippingCents);
  const productTotalCents = cents(row.productTotalCents), totalCents = cents(row.totalCents);
  requirePayment(items.reduce((sum, item) => sum + item.lineTotalCents, 0) === productSubtotalCents);
  requirePayment(productSubtotalCents + taxCents + shippingCents === productTotalCents && serviceCents + productTotalCents === totalCents && totalCents > 0);
  requirePayment(items.length > 0 || (taxCents === 0 && shippingCents === 0));
  requirePayment(row.publicationVersion !== 0 || (items.length===0 && productTotalCents===0 && serviceCents===MONTHLY_SERVICE_CENTS));
  return { serviceCents, servicePeriod,shippingAddressVersion:shippingVersion(row.shippingAddressVersion,productTotalCents), items, productSubtotalCents, taxCents, shippingCents, productTotalCents, totalCents };
}

function readShippingAddress(raw:unknown):ShippingAddress {
  const row=paymentObject(raw);const fields=['recipientName','line1','line2','city','region','postalCode','countryCode'];paymentKeys(row,fields);
  const limits:Record<string,number>={recipientName:200,line1:200,line2:200,city:100,region:100,postalCode:20,countryCode:2};
  const result:Record<string,string>={};for(const field of fields){const value=row[field];requirePayment(typeof value==='string'&&Array.from(value).length<=limits[field]!&&!/[\x00-\x1f\x7f]/.test(value));result[field]=value.trim();requirePayment(field==='line2'||result[field]!.length>0);}
  requirePayment(/^[A-Za-z]{2}$/.test(result.countryCode!));result.countryCode=result.countryCode!.toUpperCase();return result as ShippingAddress;
}

/** No actor/advisor claims are forwarded. SQL rechecks identity, capabilities and enrollment. */
export function buildPaymentCall(raw: unknown, authenticatedOwnerId: string): PaymentRpcCall {
  const owner = paymentUuid(authenticatedOwnerId), row = paymentObject(raw);
  if (row.action === 'client_read') { paymentKeys(row, ['action']); return { name: 'concierge_payment_view', args: { p_client_id: owner } }; }
  if (row.action === 'advisor_read') { paymentKeys(row, ['action', 'clientId']); return { name: 'concierge_payment_view', args: { p_client_id: paymentUuid(row.clientId) } }; }
  const action = row.action; requirePayment(['issue_quote', 'submit_claim', 'confirm_payment', 'reject_claim','confirm_shipping_address'].includes(String(action)));
  const advisor = ['issue_quote','confirm_payment','reject_claim'].includes(String(action));
  const common = ['action', 'requestId', 'expectedRevision', ...(advisor ? ['clientId'] : [])];
  const target = advisor ? paymentUuid(row.clientId) : owner;
  const requestId = paymentUuid(row.requestId), revision = paymentInteger(row.expectedRevision);
  let payload: Record<string, unknown>;
  if(action==='confirm_shipping_address'){paymentKeys(row,[...common,'address']);payload={address:readShippingAddress(row.address)};}
  else if (action === 'issue_quote') {
    const fields = ['publicationVersion','shippingAddressVersion', 'serviceCents', 'servicePeriod', 'items', 'productSubtotalCents', 'taxCents', 'shippingCents', 'productTotalCents', 'totalCents'];
    paymentKeys(row, [...common, ...fields]);
    requirePayment(Array.isArray(row.items));
    for (const rawItem of row.items) paymentKeys(paymentObject(rawItem), ['recommendationId', 'quantity', 'unitPriceCents', 'lineTotalCents']);
    payload = { publicationVersion: paymentInteger(row.publicationVersion, 0), ...quoteMoney(row) };
  } else {
    const basisFields = ['quoteId', 'quoteVersion','shippingAddressVersion', 'serviceCents', 'productCents', 'totalCents'];
    const fields = action === 'submit_claim' ? ['evidenceId'] : action === 'confirm_payment' ? ['claimId', 'bankReceiptVerified'] : ['claimId', 'reasonCode'];
    paymentKeys(row, [...common, ...basisFields, ...fields]); payload = quoteBasis(row);
    if (action === 'submit_claim') payload.evidenceId = nullableUuid(row.evidenceId);
    else {
      payload.claimId = paymentUuid(row.claimId);
      if (action === 'confirm_payment') { requirePayment(row.bankReceiptVerified === true); payload.bankReceiptVerified = true; }
      else { requirePayment(['not_received', 'amount_mismatch', 'duplicate_claim', 'wrong_recipient'].includes(String(row.reasonCode))); payload.reasonCode = row.reasonCode; }
    }
  }
  return { name: 'concierge_payment_write', args: { p_client_id: target, p_action: action as 'issue_quote' | 'submit_claim' | 'confirm_payment' | 'reject_claim'|'confirm_shipping_address', p_expected_revision: revision, p_request_id: requestId, p_payload: payload } };
}
function readQuote(raw: unknown): PaymentQuote {
  const row = paymentObject(raw); requirePayment(row.currency === 'USD' && ['payable', 'superseded', 'settled'].includes(String(row.status)));
  return { id: paymentUuid(row.id), version: paymentInteger(row.version, 1), publicationVersion: paymentInteger(row.publicationVersion, 0),
    currency: 'USD', status: row.status as PaymentQuote['status'], ...quoteMoney(row) };
}
function readClaim(raw: unknown): PaymentClaim {
  const row = paymentObject(raw); requirePayment(['submitted_unverified', 'confirmed', 'rejected'].includes(String(row.status)));
  return { id: paymentUuid(row.id), ...quoteBasis(row), status: row.status as PaymentClaim['status'], evidenceId: nullableUuid(row.evidenceId) };
}
/** Explicit allowlist: no bank references, evidence paths, advisor notes or health context. */
export function mapPaymentView(raw: unknown) {
  try {
    const row = paymentObject(raw); requirePayment(Array.isArray(row.quotes) && Array.isArray(row.claims));
    requirePayment(row.schemaVersion!==2&&!row.quotes.some(raw=>{const q=paymentObject(raw);return q.contractVersion===2||Array.isArray(q.paymentOptions)&&q.paymentOptions.length>0;}));
    const quotes = row.quotes.map(readQuote), claims = row.claims.map(readClaim);
    requirePayment(new Set(quotes.map(quote => quote.id)).size === quotes.length && new Set(claims.map(claim => claim.id)).size === claims.length);
    const quotesById = new Map(quotes.map(quote => [quote.id, quote]));
    for (const claim of claims) {
      const quote = quotesById.get(claim.quoteId);
      requirePayment(quote && quote.version === claim.quoteVersion && quote.serviceCents === claim.serviceCents && quote.productTotalCents === claim.productCents && quote.totalCents === claim.totalCents && quote.shippingAddressVersion===claim.shippingAddressVersion);
    }
    const serviceRaw=paymentObject(row.service);requirePayment(['unpaid','pending_publication','active','expired','cancelled'].includes(String(serviceRaw.status)));
    const service:ServiceAccess={status:serviceRaw.status as ServiceAccess['status'],period:period(serviceRaw.period)};
    requirePayment(service.status!=='pending_publication'||service.period===null);
    const shipping=row.shippingAddress===null?null:paymentObject(row.shippingAddress);
    const shippingAddress=shipping?{version:paymentInteger(shipping.version,1),address:readShippingAddress(shipping.address)}:null;
    requirePayment(Array.isArray(row.shippingAddresses));
    const shippingAddresses=row.shippingAddresses.map(raw=>{const entry=paymentObject(raw);return {version:paymentInteger(entry.version,1),address:readShippingAddress(entry.address)};});
    const versions=new Map(shippingAddresses.map(entry=>[entry.version,entry.address]));requirePayment(versions.size===shippingAddresses.length);
    if(shippingAddress)requirePayment(JSON.stringify(versions.get(shippingAddress.version))===JSON.stringify(shippingAddress.address));
    for(const quote of quotes)if(quote.shippingAddressVersion!==null)requirePayment(versions.has(quote.shippingAddressVersion));
    return { revision: paymentInteger(row.revision), quotes, claims,service,nextServicePeriod:period(row.nextServicePeriod),shippingAddress,shippingAddresses };
  } catch { throw new Error('unavailable'); }
}
export function mapPaymentReceipt(raw: unknown, call: PaymentRpcCall): PaymentReceipt|ShippingAddressReceipt {
  try {
    requirePayment(call.name === 'concierge_payment_write'); const row = paymentObject(raw), operation = call.args.p_action;
    if(operation==='confirm_shipping_address'){requirePayment(row.operation===operation);return {revision:paymentInteger(row.revision),operation,addressVersion:paymentInteger(row.addressVersion,1)};}
    const expectedStatus = {issue_quote: 'payable', submit_claim: 'submitted_unverified', confirm_payment: 'confirmed', reject_claim: 'rejected'}[operation];
    requirePayment(row.operation === operation && row.status === expectedStatus && typeof row.serviceUnlocked === 'boolean');
    requirePayment(row.productOrderStatus === null || row.productOrderStatus === 'ready_to_purchase');
    const quoteId = paymentUuid(row.quoteId), claimId = nullableUuid(row.claimId);
    if (operation !== 'issue_quote') requirePayment(quoteId === call.args.p_payload.quoteId && claimId !== null);
    if (operation === 'confirm_payment' || operation === 'reject_claim') requirePayment(claimId === call.args.p_payload.claimId);
    if (operation === 'confirm_payment') {
      requirePayment([null,'pending_publication','active'].includes(row.serviceAccessStatus as string|null));
      requirePayment(row.serviceUnlocked === (row.serviceAccessStatus==='active'));
      requirePayment(call.args.p_payload.serviceCents!==0 || row.serviceAccessStatus===null);
      requirePayment(row.productOrderStatus === (call.args.p_payload.productCents === 0 ? null : 'ready_to_purchase'));
    } else requirePayment(row.serviceUnlocked === false && row.serviceAccessStatus===null && row.productOrderStatus === null);
    requirePayment(operation !== 'issue_quote' || claimId === null);
    return {revision: paymentInteger(row.revision), operation, quoteId, claimId, status: expectedStatus as PaymentReceipt['status'], serviceUnlocked: row.serviceUnlocked,serviceAccessStatus:row.serviceAccessStatus as PaymentReceipt['serviceAccessStatus'], productOrderStatus: row.productOrderStatus};
  } catch { throw new Error('unavailable'); }
}
export function paymentRecipient(config: Partial<Omit<PaymentRecipient, 'method'>> = {}): PaymentRecipient {
  const name = config.name ?? 'Kanuj Verma', email = config.email ?? 'kanuj.verma12@gmail.com', phone = config.phone ?? '(925)719-1334';
  if (typeof name !== 'string' || !name.trim() || name.length > 100 || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
    || typeof phone !== 'string' || !/^\+?[\d() .-]+$/.test(phone) || phone.replace(/\D/g, '').length < 10 || phone.replace(/\D/g, '').length > 15) throw new Error('unavailable');
  return { method: 'zelle', name, email, phone };
}
