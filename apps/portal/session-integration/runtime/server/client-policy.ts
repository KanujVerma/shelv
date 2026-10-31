import {demand} from './types';
import {parsePlanCommand} from './plan-policy';
import {parseCareCommand} from './care-policy';
import {clientCareActions} from '../../../site/auth/care-actions.js';
import {clientPlanActions} from '../../../site/auth/plan-actions.js';
import {object, exact, uuid, type Channel, type Operation} from './policy';
export const clientActions: Record<Channel, readonly string[]> = {
    operations: ['client_read_v2', 'client_read', 'decide', 'receive', 'start', 'service_client_read', 'request_return'],
    payments: ['client_read', 'submit_claim', 'confirm_shipping_address', 'evidence_url'],
    checkins: ['client_read', 'submit_report', 'photo_view'],
    admission: [], walkthroughs:[],plans:clientPlanActions,care:clientCareActions
};
export function parseClientCommand(channel: Channel, value: unknown): Operation {
    if(channel==='plans')return {kind:'command',channel,command:parsePlanCommand(value,'client')};
    if(channel==='care')return {kind:'command',channel,command:parseCareCommand(value,'client')};
    const command = object(value);
    demand(Object.hasOwn(clientActions, channel) && typeof command.action === 'string' && clientActions[channel].includes(command.action), 403, 'action_forbidden');
    demand(!Object.keys(command).some(k => /^(client_?id|owner_?id|user_?id|rpc(name)?|endpoint|url|upstream|function(name)?|headers|authorization|access_?token|refresh_?token)$/i.test(k)));
    // Existing Edge schemas remain authoritative for payloads/revisions/idempotency.
    return {kind:'command', channel, command};
}
export function parseClientMedia(url: URL): Operation {
    const media = url.pathname.endsWith('/photo') ? 'photo' : 'evidence';
    const v2=url.searchParams.get('v')==='2';exact(Object.fromEntries(url.searchParams), ['id',...(v2?['v']:[])]);
    demand(url.searchParams.getAll('id').length === 1);
    demand(!v2||url.searchParams.getAll('v').length===1);return {kind:'client-media', media, id:uuid(url.searchParams.get('id')),...(v2?{schemaVersion:2 as const}:{})};
}
export function validateClientUpload(channel: Channel, metadata: Record<string, unknown>, bytes: Uint8Array, contentType: string): Operation {
    demand(channel === 'payments' || channel === 'checkins', 403, 'action_forbidden');
    demand(bytes.byteLength > 0 && bytes.byteLength <= 5242880, 413, 'too_large');
    demand((channel === 'payments' ? ['image/png','image/jpeg'] : ['image/png','image/jpeg','image/webp']).includes(contentType), 415, 'unsupported_media_type');
    demand(metadata.action === (channel === 'payments' ? 'upload_evidence' : 'upload_photo'), 403, 'action_forbidden');
    const keys = channel === 'payments' ? ['action','requestId','completionRequestId','expectedRevision','quoteId','quoteVersion',...(metadata.schemaVersion===2?['schemaVersion','paymentOptionId']:[])] : ['action','requestId','completionRequestId','expectedRevision','angle'];
    exact(metadata, keys);
    uuid(metadata.requestId); uuid(metadata.completionRequestId);
    demand(Number.isSafeInteger(metadata.expectedRevision) && Number(metadata.expectedRevision) >= 0);
    if(channel === 'payments'){uuid(metadata.quoteId);demand(Number.isSafeInteger(metadata.quoteVersion) && Number(metadata.quoteVersion)>0);if(metadata.schemaVersion===2)uuid(metadata.paymentOptionId);}
    else demand(['front','left','right'].includes(String(metadata.angle)));
    return {kind:'client-upload',channel,metadata,bytes,contentType};
}
