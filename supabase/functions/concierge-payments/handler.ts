import type {ConciergeAuthenticatedPorts} from '../../../src/contracts/ConciergePortal.ts';
import {buildPaymentCall, mapPaymentReceipt, mapPaymentView, paymentKeys, paymentObject, paymentRecipient, paymentUuid} from './contract.ts';
import {PaymentHttpError, paymentJson} from './body.ts';
import {readPaymentEvidence, uploadPaymentEvidence, type PaymentStorage} from './evidence.ts';
import type {PaymentRecipient, PaymentRpcCall} from './types.ts';
import {buildPaymentCallV2,mapPaymentViewV2,mapPaymentReceiptV2} from './methods.ts';

export type PaymentBackendCall = PaymentRpcCall | {name: 'concierge_payment_evidence_reserve' | 'concierge_payment_evidence_commit' | 'concierge_payment_evidence_access'|'concierge_payment_evidence_reserve_v2'|'concierge_payment_evidence_commit_v2'|'concierge_payment_evidence_access_v2'; args: Record<string, unknown>};
/** Core owns bearer verification and authoritative SQL authorization; Storage is privileged server-only. */
export type PaymentPorts = ConciergeAuthenticatedPorts<PaymentBackendCall> & {
  storage?: PaymentStorage;
  recipient?: Partial<Omit<PaymentRecipient, 'method'>>;
};
const sqlErrors: Readonly<Record<string, number>> = {
  concierge_unauthorized: 401, concierge_forbidden: 403, concierge_invalid_input: 400, concierge_not_found: 404,
  concierge_revision_conflict: 409, concierge_request_conflict: 409, concierge_publication_conflict: 409,concierge_payment_contract_upgrade_required:409,concierge_payment_method_unavailable:409,concierge_payment_method_conflict:409,
  concierge_product_already_funded:409, concierge_product_not_approved:409, concierge_quote_conflict: 409, concierge_quote_stale: 409, concierge_payment_already_confirmed: 409,
  concierge_address_conflict:409, concierge_shipping_address_conflict:409, concierge_claim_conflict: 409, concierge_evidence_conflict: 409, concierge_enrollment_inactive: 403,
};
export async function paymentRpc(ports: PaymentPorts, token: string, call: PaymentBackendCall, signal?: AbortSignal): Promise<unknown> {
  const result = await ports.rpc(token, call, signal);
  if (!result.error) return result.data;
  if (result.error.status === 401) throw new PaymentHttpError('unauthorized', 401);
  if (result.error.status === 403) throw new PaymentHttpError('forbidden', 403);
  const code = result.error.message ?? '';
  throw new PaymentHttpError(Object.hasOwn(sqlErrors, code) ? code : 'unavailable', Object.hasOwn(sqlErrors, code) ? sqlErrors[code] : 503);
}
export async function handlePaymentRequest(request: Request, ports: PaymentPorts): Promise<Response> {
  const headers: Record<string, string> = {'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin','x-content-type-options':'nosniff'};
  const reply = (status: number, value: unknown) => new Response(JSON.stringify(value), {status, headers});
  const origin = request.headers.get('origin');
  if (origin && !ports.allowedOrigins.includes(origin)) return reply(403, {code:'origin_forbidden'});
  if (origin) headers['access-control-allow-origin'] = origin;
  if (request.method === 'OPTIONS') {
    headers['access-control-allow-headers'] = 'authorization, apikey, content-type'; headers['access-control-allow-methods'] = 'POST, OPTIONS';
    return new Response(null, {status:204, headers});
  }
  if (request.method !== 'POST') return reply(405, {code:'method_not_allowed'});
  const bearer = /^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization') ?? '');
  if (!bearer) return reply(401, {code:'unauthorized'});
  const media = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (media !== 'application/json' && media !== 'multipart/form-data') return reply(415, {code:'unsupported_media_type'});
  try {
    const user = await ports.authenticate(bearer[1], request.signal);
    if (!user) return reply(401, {code:'unauthorized'});
    try { paymentUuid(user.id); } catch { return reply(401, {code:'unauthorized'}); }
    if (user.is_anonymous !== false) return reply(403, {code:'forbidden'});
    if (media === 'multipart/form-data') return reply(200, await uploadPaymentEvidence(request, user.id, bearer[1], ports));
    const raw = paymentObject(await paymentJson(request.body));
    if (raw.action === 'evidence_url') {
      paymentKeys(raw, ['action', 'evidenceId',...(raw.schemaVersion===2?['schemaVersion']:[])]);
      return reply(200, await readPaymentEvidence(paymentUuid(raw.evidenceId), bearer[1], ports, request.signal,raw.schemaVersion===2));
    }
    const call = raw.schemaVersion===2?buildPaymentCallV2(raw,user.id):buildPaymentCall(raw, user.id), data = await paymentRpc(ports, bearer[1], call, request.signal);
    return reply(200,call.name==='concierge_payment_view_v2'?{...mapPaymentViewV2(data),legacyRecipient:paymentRecipient(ports.recipient)}:call.name==='concierge_payment_write_v2'?mapPaymentReceiptV2(data,call):call.name === 'concierge_payment_view' ? {...mapPaymentView(data), recipient:paymentRecipient(ports.recipient)} : mapPaymentReceipt(data, call));
  } catch (cause) {
    if (cause instanceof PaymentHttpError) return reply(cause.status, {code:cause.message});
    if (cause instanceof Error && cause.message === 'invalid_input') return reply(400, {code:'invalid_input'});
    return reply(503, {code:'unavailable'});
  }
}
