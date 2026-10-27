import { readConciergeJson } from '../concierge-operations/body.ts';
import { exactKeys, readArray, readInteger, readObject, readText, readUuid, requireValue } from '../../../src/contracts/ConciergePortalValidation.ts';
import { buildCheckinCall } from './commands.ts';
import { isCheckinInstant, mapCheckinClientView } from './projection.ts';
import { isCheckinPhotoAngle, validateCheckinPhoto } from './photos.ts';
import type { CheckinPorts, CheckinRpcCall, PrivateCheckinPhoto } from './types.ts';
class HttpFailure extends Error {
  status: number; code: string; retryable: boolean;
  constructor(status: number, code: string, retryable = false) { super(code); this.status = status; this.code = code; this.retryable = retryable; }
}
const errors: Record<string, number> = { unauthorized: 401, forbidden: 403, invalid_input: 400, service_inactive: 403,
  routine_not_started: 409, revision_conflict: 409, request_conflict: 409, photo_unavailable: 404, not_found: 404 };
async function rpcData(ports: CheckinPorts, token: string, call: CheckinRpcCall, signal: AbortSignal): Promise<unknown> {
  return rpcResult(await ports.rpc(token, call, signal));
}
function rpcResult(result: Awaited<ReturnType<CheckinPorts['rpc']>>): unknown {
  if (result.error) {
    const code = result.error.message?.replace(/^concierge_/, '') ?? '';
    if (result.error.status === 401 || result.error.status === 403) throw new HttpFailure(result.error.status, result.error.status === 401 ? 'unauthorized' : 'forbidden');
    if (Object.hasOwn(errors, code)) throw new HttpFailure(errors[code], code);
    throw new HttpFailure(503, 'unavailable', true);
  }
  return result.data;
}
function photoDescriptor(input: unknown, ownerId: string, photoId?: string): PrivateCheckinPhoto {
  try {
    const p = readObject(input), id = readUuid(p.photoId).toLowerCase();
    requireValue(readUuid(p.ownerId).toLowerCase() === ownerId && (!photoId || id === photoId));
    requireValue(p.bucket === 'concierge-checkin-photos' && typeof p.path === 'string' && p.path.length <= 512);
    const parts = p.path.split('/');
    requireValue(parts.length >= 2 && parts[0] === ownerId && parts.every(part => /^[a-zA-Z0-9_.-]+$/.test(part) && part !== '.' && part !== '..'));
    requireValue(isCheckinPhotoAngle(p.angle) && ['image/jpeg','image/png','image/webp'].includes(String(p.contentType)));
    requireValue(typeof p.sha256 === 'string' && /^[0-9a-f]{64}$/.test(p.sha256) && (p.state === 'pending' || p.state === 'complete'));
    return { revision: readInteger(p.revision), photoId: id, ownerId, bucket: p.bucket, path: p.path,
      angle: p.angle, contentType: p.contentType as PrivateCheckinPhoto['contentType'], sizeBytes: readInteger(p.sizeBytes,1,5*1024*1024),
      sha256: p.sha256, state: p.state };
  } catch { throw new HttpFailure(503, 'unavailable', true); }
}
async function completedPhoto(reserved: PrivateCheckinPhoto, token: string, ports: CheckinPorts, signal: AbortSignal): Promise<boolean> {
  const reply = await ports.rpc(token,{name:'concierge_checkin_photo_authorize',args:{p_client_id:reserved.ownerId,p_photo_id:reserved.photoId}},signal);
  if (reply.error?.message === 'concierge_not_found' && reply.error.status !== 401 && reply.error.status !== 403) return false;
  const current = photoDescriptor(rpcResult(reply),reserved.ownerId,reserved.photoId);
  // The authorized read's revision is the CURRENT head. Keep the original
  // reservation revision for completion, and compare only immutable metadata.
  if (current.state !== 'complete' || (['photoId','ownerId','bucket','path','angle','contentType','sizeBytes','sha256'] as const)
    .some(key => current[key] !== reserved[key])) throw new HttpFailure(503,'unavailable',true);
  return true;
}
function receipt(input: unknown, operation: string) {
  try {
    const r = readObject(input); requireValue(r.operation === operation && (r.reportId === null || typeof r.reportId === 'string'));
    if (operation === 'submit_report') requireValue(r.reportId !== null);
    return { revision: readInteger(r.revision), operation, reportId: r.reportId === null ? null : readUuid(r.reportId).toLowerCase() };
  } catch { throw new HttpFailure(503, 'unavailable', true); }
}
async function readPhotoBytes(request: Request, maximum = 5*1024*1024): Promise<Uint8Array<ArrayBuffer>> {
  if (!request.body) throw new HttpFailure(400, 'invalid_input');
  const reader = request.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break; size += value.length;
      if (size > maximum) { await reader.cancel(); throw new HttpFailure(413, 'photo_too_large'); } chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; } return bytes;
}
async function upload(request: Request, ports: CheckinPorts, token: string, ownerId: string) {
  const requestId = readUuid(request.headers.get('x-request-id')).toLowerCase();
  const completionId = readUuid(request.headers.get('x-completion-request-id')).toLowerCase(); requireValue(completionId !== requestId);
  const revisionText = request.headers.get('x-expected-revision') ?? ''; requireValue(/^(0|[1-9]\d*)$/.test(revisionText));
  const expectedRevision = readInteger(Number(revisionText)); requireValue(expectedRevision < Number.MAX_SAFE_INTEGER);
  const bytes = await readPhotoBytes(request);
  const validated = await validateCheckinPhoto({ requestId, angle: request.headers.get('x-photo-angle'), contentType: request.headers.get('content-type'), sizeBytes: bytes.length }, bytes);
  if (!validated.ok) throw new HttpFailure(validated.error.code === 'photo_too_large' ? 413 : validated.error.code === 'unsupported_photo' ? 415 : 400, validated.error.code);
  const photo = validated.value;
  const reserved = photoDescriptor(await rpcData(ports, token, { name: 'concierge_checkin_write', args: { p_client_id: ownerId,
    p_action: 'reserve_photo', p_request_id: requestId, p_expected_revision: expectedRevision,
    p_payload: { angle: photo.angle, contentType: photo.contentType, sizeBytes: photo.sizeBytes, sha256: photo.sha256 } } }, request.signal), ownerId);
  if (reserved.angle !== photo.angle || reserved.contentType !== photo.contentType || reserved.sizeBytes !== photo.sizeBytes || reserved.sha256 !== photo.sha256) throw new HttpFailure(503,'unavailable',true);
  // Exact reserve replays retain their old pending descriptor after completion.
  if (!await completedPhoto(reserved,token,ports,request.signal)) {
    let outcome: 'uploaded' | 'exists' | 'completed';
    try {
      outcome = await ports.storage.upload(reserved, photo.body, request.signal);
    } catch {
      // Only POST failure can race with completion. Never mask a subsequent
      // duplicate read/size/MIME/digest failure with a completed descriptor.
      if (!await completedPhoto(reserved,token,ports,request.signal)) throw new HttpFailure(503,'upload_failed',true);
      outcome = 'completed';
    }
    if (outcome !== 'completed' && outcome !== 'exists' && outcome !== 'uploaded') throw new HttpFailure(503,'upload_failed',true);
    if (outcome === 'exists') {
      try {
        const existing = await ports.storage.read(reserved, request.signal);
        if (!(existing instanceof Blob) || existing.size !== photo.sizeBytes || existing.type !== photo.contentType) throw new Error();
        const checked = await validateCheckinPhoto({ requestId, angle: photo.angle, contentType: existing.type, sizeBytes: existing.size }, new Uint8Array(await existing.arrayBuffer()));
        if (!checked.ok || checked.value.sha256 !== photo.sha256) throw new Error();
      } catch { throw new HttpFailure(503,'upload_failed',true); }
    }
  }
  // Completion fences this immutable reservation, not the feature head advanced by other writes.
  // Preserve it with the original completion UUID on every retry; SQL advances the current head.
  const reservationRevision = reserved.revision;
  const completed = receipt(await rpcData(ports, token, { name: 'concierge_checkin_write', args: { p_client_id: ownerId,
    p_action: 'complete_photo', p_request_id: completionId, p_expected_revision: reservationRevision, p_payload: { photoId: reserved.photoId } } }, request.signal), 'complete_photo');
  return { revision: completed.revision, photo: { id: reserved.photoId, angle: reserved.angle } };
}
async function multipartUpload(request: Request, ports: CheckinPorts, token: string, ownerId: string) {
  let entries: [string, unknown][];
  try {
    const bytes = await readPhotoBytes(request,5*1024*1024+16384);
    const form = await new Response(bytes,{headers:{'content-type':request.headers.get('content-type') ?? ''}}).formData();
    // React Native globals omit standard multipart iteration. Keep the Edge/Node bridge local.
    entries = [...(form as unknown as { entries(): Iterable<[string, unknown]> }).entries()];
  } catch (cause) { if(cause instanceof HttpFailure)throw cause; throw new HttpFailure(400,'invalid_input'); }
  requireValue(entries.length === 2 && entries.filter(([key]) => key === 'metadata').length === 1 && entries.filter(([key]) => key === 'file').length === 1);
  const raw = entries.find(([key]) => key === 'metadata')![1], file = entries.find(([key]) => key === 'file')![1]; requireValue(typeof raw === 'string' && raw.length <= 4096 && file instanceof Blob);
  let metadata: Record<string,unknown>;
  try { metadata = readObject(JSON.parse(raw)); } catch { throw new HttpFailure(400,'invalid_input'); }
  exactKeys(metadata,['action','requestId','completionRequestId','expectedRevision','angle']); requireValue(metadata.action === 'upload_photo');
  const headers = new Headers(request.headers); headers.delete('content-length'); headers.set('content-type',file.type);
  headers.set('x-request-id',readUuid(metadata.requestId));headers.set('x-completion-request-id',readUuid(metadata.completionRequestId));
  headers.set('x-expected-revision',String(readInteger(metadata.expectedRevision)));headers.set('x-photo-angle',readText(metadata.angle,5));
  return upload(new Request(request.url,{method:'POST',headers,body:file,signal:request.signal}),ports,token,ownerId);
}
function authorizedSignedUrl(raw: string, ports: CheckinPorts, descriptor: PrivateCheckinPhoto): string {
  const url = new URL(raw), base = new URL(ports.storage.origin);
  if (base.protocol !== 'https:' || url.origin !== base.origin || url.username || url.password || url.hash
    || url.pathname !== `/storage/v1/object/sign/${descriptor.bucket}/${descriptor.path}`
    || url.searchParams.getAll('token').length !== 1 || !url.searchParams.get('token')) throw new HttpFailure(503, 'unavailable', true);
  return url.href;
}

/** No local enrollment/phase/timer rule grants or refuses optional upload access; each RPC rechecks it. */
export async function handleCheckinsRequest(request: Request, ports: CheckinPorts): Promise<Response> {
  const origin = request.headers.get('origin');
  const headers: Record<string,string> = { 'content-type':'application/json', 'cache-control':'private, no-store, max-age=0', pragma:'no-cache', vary:'Origin' };
  const reply = (status: number, value: unknown) => new Response(JSON.stringify(value), { status, headers });
  if (origin && !ports.allowedOrigins.includes(origin)) return reply(403, { code:'origin_forbidden', retryable:false });
  if (origin) headers['access-control-allow-origin'] = origin;
  if (request.method === 'OPTIONS') { headers['access-control-allow-methods']='POST, OPTIONS';
    headers['access-control-allow-headers']='authorization, apikey, content-type, x-request-id, x-completion-request-id, x-expected-revision, x-photo-angle';
    return new Response(null,{status:204,headers}); }
  if (request.method !== 'POST') return reply(405,{code:'method_not_allowed',retryable:false});
  const bearer = /^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization') ?? '');
  if (!bearer) return reply(401,{code:'unauthorized',retryable:false});
  try {
    const user = await ports.authenticate(bearer[1],request.signal);
    if (!user) throw new HttpFailure(401,'unauthorized');
    let ownerId: string; try { ownerId = readUuid(user.id).toLowerCase(); } catch { throw new HttpFailure(503,'unavailable',true); }
    if (user.is_anonymous !== false) throw new HttpFailure(403,'forbidden');
    if (request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data;')) return reply(200,await multipartUpload(request,ports,bearer[1],ownerId));
    if (new URL(request.url).pathname.endsWith('/upload')) return reply(200,await upload(request,ports,bearer[1],ownerId));
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new HttpFailure(415,'unsupported_media_type');
    const call = buildCheckinCall(await readConciergeJson(request.body,100000),ownerId), data = await rpcData(ports,bearer[1],call,request.signal);
    if (call.name === 'concierge_checkin_read' || call.name === 'concierge_checkin_advisor_read') {
      try {
      const source = call.name === 'concierge_checkin_read' ? data : readObject(data).client;
      const client = mapCheckinClientView(source); if (!client.ok) throw new HttpFailure(503,'unavailable',true);
      if (call.name === 'concierge_checkin_read') return reply(200,client.value);
      const meetingNotes = readArray(readObject(data).meetingNotes).map(raw => {
        const note = readObject(raw); requireValue(isCheckinInstant(note.createdAt));
        return { id:readUuid(note.id), checkinId:readUuid(note.checkinId), note:readText(note.note,4000), createdAt:note.createdAt };
      }); return reply(200,{client:client.value,meetingNotes});
      } catch { throw new HttpFailure(503,'unavailable',true); }
    }
    if (call.name === 'concierge_checkin_photo_authorize') {
      const descriptor = photoDescriptor(data,call.args.p_client_id,call.args.p_photo_id);
      if (descriptor.state !== 'complete') throw new HttpFailure(404,'photo_unavailable');
      const signedUrl = authorizedSignedUrl(await ports.storage.sign(descriptor,60,request.signal),ports,descriptor);
      return reply(200,{photoId:descriptor.photoId,signedUrl,expiresIn:60});
    }
    if (call.name === 'concierge_checkin_write') return reply(200,receipt(data,call.args.p_action));
    throw new HttpFailure(503,'unavailable',true);
  } catch (cause) {
    if (cause instanceof HttpFailure) return reply(cause.status,{code:cause.code,retryable:cause.retryable});
    if (cause instanceof Error && cause.message === 'invalid_input') return reply(400,{code:'invalid_input',retryable:false});
    if (cause instanceof Error && cause.message === 'too_large') return reply(413,{code:'too_large',retryable:false});
    return reply(503,{code:'unavailable',retryable:true});
  }
}
