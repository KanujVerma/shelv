import { mapConciergePreview } from './preview.ts';
import { mapConciergeClientViewV2, mapConciergeAdvisorViewV2 } from '../../../src/contracts/ConciergePresentationMapping.ts';
import type { ConciergeAuthenticatedPorts, ConciergeRpcCall } from '../../../src/contracts/ConciergePortal.ts';
import { mapConciergeAdvisorDirectory, mapConciergeAdvisorView, mapConciergeClientView, mapConciergeWriteReceipt } from '../../../src/contracts/ConciergePortalMapping.ts';
import { readUuid } from '../../../src/contracts/ConciergePortalValidation.ts';
import { readConciergeJson } from './body.ts';
import { buildConciergeRpc } from './commands.ts';

export type ConciergePorts = ConciergeAuthenticatedPorts<ConciergeRpcCall>;
const sqlErrors: Readonly<Record<string, number>> = {
  concierge_content_version_required:409, concierge_unauthorized: 401, concierge_forbidden: 403, concierge_invalid_input: 400,
  concierge_revision_conflict: 409, concierge_request_conflict: 409, concierge_intake_conflict: 409,
  concierge_routine_basis_conflict:409, concierge_baseline_conflict: 409, concierge_publication_conflict: 409, concierge_draft_unavailable: 409,
  concierge_already_received: 409, concierge_already_started: 409, concierge_product_not_approved: 409,
  concierge_product_not_received: 409, concierge_not_found: 404,
};

/** No local role claims, service key, retries, optimistic activation or raw RPC passthrough. */
export async function handleConciergeRequest(request: Request, ports: ConciergePorts): Promise<Response> {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = { 'content-type': 'application/json', 'cache-control': 'private, no-store, max-age=0', pragma: 'no-cache', vary: 'Origin' };
  const reply = (status: number, value: unknown) => new Response(JSON.stringify(value), { status, headers });
  const error = (status: number, code: string) => reply(status, { code });
  if (origin && !ports.allowedOrigins.includes(origin)) return error(403, 'origin_forbidden');
  if (origin) headers['access-control-allow-origin'] = origin;
  if (request.method === 'OPTIONS') {
    headers['access-control-allow-headers'] = 'authorization, apikey, content-type';
    headers['access-control-allow-methods'] = 'POST, OPTIONS';
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== 'POST') return error(405, 'method_not_allowed');
  const bearer = /^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization') ?? '');
  if (!bearer) return error(401, 'unauthorized');
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return error(415, 'unsupported_media_type');
  try {
    const user = await ports.authenticate(bearer[1], request.signal);
    if (!user) return error(401, 'unauthorized');
    try { readUuid(user.id); } catch { return error(401, 'unauthorized'); }
    if (user.is_anonymous !== false) return error(403, 'forbidden');
    const call = buildConciergeRpc(await readConciergeJson(request.body, 100000), user.id);
    const result = await ports.rpc(bearer[1], call, request.signal);
    if (result.error) {
      if (result.error.status === 401) return error(401, 'unauthorized');
      if (result.error.status === 403) return error(403, 'forbidden');
      const code = result.error.message ?? '';
      if(call.name==='concierge_advisor_preview_v2') {
        const previewErrors: Readonly<Record<string,number>> = {concierge_stale_draft:409,concierge_draft_missing:404,concierge_unauthorized:401,concierge_forbidden:403,concierge_invalid_input:400};
        if(Object.hasOwn(previewErrors,code))return error(previewErrors[code],code.slice('concierge_'.length));
      }
      return Object.hasOwn(sqlErrors, code) ? error(sqlErrors[code], code) : error(503, 'unavailable');
    }
    if(call.name==='concierge_advisor_preview_v2')return reply(200,mapConciergePreview(result.data,call.args));
    if(call.name==='concierge_client_view_v2')return reply(200,mapConciergeClientViewV2(result.data));
    if(call.name==='concierge_advisor_view_v2')return reply(200,mapConciergeAdvisorViewV2(result.data));
    if (call.name === 'concierge_advisor_directory') return reply(200, mapConciergeAdvisorDirectory(result.data));
    if (call.name === 'concierge_client_view') return reply(200, mapConciergeClientView(result.data));
    if (call.name === 'concierge_advisor_view') return reply(200, mapConciergeAdvisorView(result.data));
    return reply(200, mapConciergeWriteReceipt(result.data, call.args.p_action));
  } catch (cause) {
    const code = cause instanceof Error ? cause.message : '';
    if (code === 'too_large') return error(413, 'too_large');
    if (code === 'invalid_input') return error(400, 'invalid_input');
    return error(503, 'unavailable');
  }
}
