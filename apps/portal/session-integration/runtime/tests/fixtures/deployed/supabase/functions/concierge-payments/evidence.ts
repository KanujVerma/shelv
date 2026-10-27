import {validatePaymentImage} from './image.ts';
import {paymentBytes, PaymentHttpError, PaymentUploadPostError} from './body.ts';
import {paymentInteger, paymentKeys, paymentObject, paymentUuid, requirePayment} from './contract.ts';
import {paymentRpc, paymentRpcResult, type PaymentPorts} from './handler.ts';

export const PAYMENT_EVIDENCE_BUCKET = 'concierge-payment-evidence';
export const MAX_PAYMENT_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const PAYMENT_EVIDENCE_READ_SECONDS = 60;
export type PaymentStorage = {
  /** Immutable, no upsert; exact existing-object retries must verify the stored digest. */
  upload(path: string, bytes: Uint8Array, contentType: string, signal?: AbortSignal): Promise<void>;
  sign(path: string, expiresInSeconds: number, signal?: AbortSignal): Promise<string>;
};
const extensions: Readonly<Record<string, string>> = {'image/png':'png','image/jpeg':'jpg'};
function extension(contentType: unknown): string { requirePayment(typeof contentType === 'string' && Object.hasOwn(extensions,contentType)); return extensions[contentType]; }
function descriptor(raw: unknown) {
  try {
    const row = paymentObject(raw), evidenceId = paymentUuid(row.evidenceId), clientId = paymentUuid(row.clientId), quoteId = paymentUuid(row.quoteId);
    const quoteVersion = paymentInteger(row.quoteVersion,1), ext = extension(row.contentType), sizeBytes = paymentInteger(row.sizeBytes,1,MAX_PAYMENT_EVIDENCE_BYTES);
    requirePayment(typeof row.sha256 === 'string' && /^[a-f0-9]{64}$/.test(row.sha256) && ['reserved','uploaded'].includes(String(row.status)));
    requirePayment(row.storagePath === `${clientId}/${quoteId}/${evidenceId}.${ext}`);
    return {evidenceId,clientId,quoteId,quoteVersion,storagePath:row.storagePath as string,contentType:row.contentType as string,sizeBytes,sha256:row.sha256,status:row.status};
  } catch { throw new Error('unavailable'); }
}
async function completedEvidence(reserved: ReturnType<typeof descriptor>, token: string, ports: PaymentPorts, signal?: AbortSignal): Promise<boolean> {
  const reply = await ports.rpc(token,{name:'concierge_payment_evidence_access',args:{p_evidence_id:reserved.evidenceId}},signal);
  // The read RPC uses this error for pending evidence (and missing final metadata).
  // It never grants upload permission: the unchanged pending-only Storage fence still applies.
  if (reply.error?.message === 'concierge_upload_incomplete' && reply.error.status !== 401 && reply.error.status !== 403) return false;
  const current = descriptor(paymentRpcResult(reply));
  if (current.status !== 'uploaded' || (['evidenceId','clientId','quoteId','quoteVersion','storagePath','contentType','sizeBytes','sha256'] as const)
    .some(key => current[key] !== reserved[key])) throw new Error('unavailable');
  return true;
}
export async function uploadPaymentEvidence(request: Request, ownerId: string, token: string, ports: PaymentPorts) {
  if (!ports.storage) throw new Error('unavailable');
  const bytes = await paymentBytes(request.body, MAX_PAYMENT_EVIDENCE_BYTES + 16384);
  const form = await new Response(bytes as BodyInit, {headers:{'content-type':request.headers.get('content-type')!}}).formData()
    .catch(() => { throw new PaymentHttpError('invalid_input',400); });
  // The repo's React Native globals omit standard FormData iteration. Edge and
  // Node expose the standard interface; keep that platform bridge local.
  const entries = [...(form as unknown as {entries(): Iterable<[string,unknown]>}).entries()];
  requirePayment(entries.length === 2 && entries.filter(([key])=>key==='metadata').length===1 && entries.filter(([key])=>key==='file').length===1);
  const meta = entries.find(([key])=>key==='metadata')![1], file = entries.find(([key])=>key==='file')![1];
  requirePayment(typeof meta === 'string' && meta.length <= 4096 && file instanceof Blob);
  let row: Record<string,unknown>;
  try { row = paymentObject(JSON.parse(meta)); } catch { throw new PaymentHttpError('invalid_input',400); }
  paymentKeys(row,['action','requestId','completionRequestId','expectedRevision','quoteId','quoteVersion']); requirePayment(row.action === 'upload_evidence');
  const requestId = paymentUuid(row.requestId), completionRequestId = paymentUuid(row.completionRequestId), quoteId = paymentUuid(row.quoteId), quoteVersion = paymentInteger(row.quoteVersion,1), expectedRevision = paymentInteger(row.expectedRevision);
  requirePayment(requestId !== completionRequestId);
  if (file.size > MAX_PAYMENT_EVIDENCE_BYTES) throw new PaymentHttpError('too_large',413);
  if (!Object.hasOwn(extensions,file.type)) throw new PaymentHttpError('unsupported_image_type',415);
  const image = new Uint8Array(await file.arrayBuffer());
  try { await validatePaymentImage(image,file.type); } catch { throw new PaymentHttpError('unsupported_image_type',415); }
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256',image));
  const sha256 = Array.from(hash,value=>value.toString(16).padStart(2,'0')).join('');
  const reserved = descriptor(await paymentRpc(ports,token,{name:'concierge_payment_evidence_reserve',args:{p_client_id:ownerId,p_request_id:requestId,p_expected_revision:expectedRevision,
    p_quote_id:quoteId,p_quote_version:quoteVersion,p_content_type:file.type,p_size_bytes:image.length,p_sha256:sha256}},request.signal));
  if (reserved.clientId !== ownerId || reserved.quoteId !== quoteId || reserved.quoteVersion !== quoteVersion || reserved.contentType !== file.type || reserved.sizeBytes !== image.length || reserved.sha256 !== sha256) throw new Error('unavailable');
  // Reservation receipts are immutable: an exact replay can still say reserved
  // after completion. Resolve current authorized state instead of uploading again.
  if (!await completedEvidence(reserved,token,ports,request.signal)) {
    try { await ports.storage.upload(reserved.storagePath,image,file.type,request.signal); }
    catch (cause) {
      // An overlapping identical request may have completed after our pending read.
      // Re-resolve once; never retry POST, overwrite, or replace either request UUID.
      if (!(cause instanceof PaymentUploadPostError) || !await completedEvidence(reserved,token,ports,request.signal)) throw cause;
    }
  }
  const result = paymentObject(await paymentRpc(ports,token,{name:'concierge_payment_evidence_commit',args:{p_evidence_id:reserved.evidenceId,p_request_id:completionRequestId}},request.signal));
  if (result.evidenceId !== reserved.evidenceId || result.quoteId !== quoteId || result.quoteVersion !== quoteVersion || result.status !== 'uploaded_unverified') throw new Error('unavailable');
  return {evidenceId:reserved.evidenceId,quoteId,quoteVersion,status:'uploaded_unverified' as const};
}
export async function readPaymentEvidence(evidenceId: string, token: string, ports: PaymentPorts, signal?: AbortSignal) {
  if (!ports.storage) throw new Error('unavailable');
  const record = descriptor(await paymentRpc(ports,token,{name:'concierge_payment_evidence_access',args:{p_evidence_id:evidenceId}},signal));
  if (record.evidenceId !== evidenceId || record.status !== 'uploaded') throw new Error('unavailable');
  const signedUrl = await ports.storage.sign(record.storagePath,PAYMENT_EVIDENCE_READ_SECONDS,signal);
  const url = new URL(signedUrl); if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('unavailable');
  return {evidenceId,signedUrl,expiresInSeconds:PAYMENT_EVIDENCE_READ_SECONDS};
}
