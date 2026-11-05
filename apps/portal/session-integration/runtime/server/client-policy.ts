import {demand,SessionError} from './types';
import {mapCheckinPhotoHead,mapCheckinPhotoInventory} from '../../../../../supabase/functions/concierge-checkins/projection.ts';
import type {CheckinPhotoInventoryPage} from '../../../../../supabase/functions/concierge-checkins/types.ts';
import {parsePlanCommand} from './plan-policy';
import {parseCareCommand} from './care-policy';
import {parseReviewCommand} from './review-policy';
import {reviewClientActions} from '../../../../../src/contracts/PortalReviewValues.ts';
import {clientCareActions} from '../../../site/auth/care-actions.js';
import {clientPlanActions} from '../../../site/auth/plan-actions.js';
import {object, exact, uuid, type Channel, type Operation, parseNotificationCommand} from './policy';
import type {OwnAdminChannel} from './own-admin-provider.ts';
import {buildAccountProfileRpc,mapAccountProfileResult} from '../../../../../src/contracts/PortalAccountProfileMapping.ts';
import {readAccountContactCommand} from '../../../../../src/contracts/PortalAccountContactValidation.ts';
import {mapAccountContactResult} from '../../../../../src/contracts/PortalAccountContactMapping.ts';
import {buildClientOrdersReadRpc,mapClientOrdersReadResult} from '../../../../../src/contracts/PortalClientOrdersMapping.ts';
export const clientActions: Record<Channel, readonly string[]> = {
    operations: ['client_read_v2', 'client_read', 'decide', 'receive', 'start', 'service_client_read', 'request_return'],
    payments: ['client_read', 'submit_claim', 'confirm_shipping_address', 'evidence_url'],
    checkins: ['client_read', 'read_photo_head_v1', 'read_photo_inventory_v1', 'submit_report', 'photo_view'],
    admission: [], walkthroughs:[],plans:clientPlanActions,care:clientCareActions,reviews:reviewClientActions,guidance:[],notifications:['list_inbox_v1','mark_seen_v1','request_status_v1'],
    'account-profile':['read_account_profile_v1','set_account_display_name_v1'],
    'account-contact':['read_account_contact_v1','request_account_email_change_v1','read_account_email_change_request_v1'],
    'client-orders':['read_client_orders_v1']
};
export function parseClientCommand(channel: Channel, value: unknown): Operation {
    if(channel==='account-profile'||channel==='account-contact'||channel==='client-orders'){
        const raw=object(value);demand(typeof raw.action==='string'&&clientActions[channel].includes(raw.action),403,'action_forbidden');
        try{
            const command=channel==='account-profile'?buildAccountProfileRpc(value).args.p_command:channel==='account-contact'?readAccountContactCommand(value):buildClientOrdersReadRpc(value).args.p_command;
            return {kind:'command',channel,command:{...command}};
        }catch{throw new SessionError(400,'invalid_input');}
    }
    if(channel==='notifications')return {kind:'command',channel,command:parseNotificationCommand(value,'client')};
    if(channel==='plans')return {kind:'command',channel,command:parsePlanCommand(value,'client')};
    if(channel==='care')return {kind:'command',channel,command:parseCareCommand(value,'client')};
    if(channel==='reviews')return {kind:'command',channel,command:parseReviewCommand(value,'client')};
    const command = object(value);
    demand(Object.hasOwn(clientActions, channel) && typeof command.action === 'string' && clientActions[channel].includes(command.action), 403, 'action_forbidden');
    if(channel==='checkins'&&command.action==='read_photo_inventory_v1')return {kind:'command',channel,command:{action:'read_photo_inventory_v1',...parseClientPhotoInventoryPage(command)}};
    if(channel==='checkins' && command.action==='read_photo_head_v1')exact(command,['action']);
    demand(!Object.keys(command).some(k => /^(client_?id|owner_?id|user_?id|rpc(name)?|endpoint|url|upstream|function(name)?|headers|authorization|access_?token|refresh_?token)$/i.test(k)));
    // Existing Edge schemas remain authoritative for payloads/revisions/idempotency.
    return {kind:'command', channel, command};
}
export function mapOwnAdminResponse(channel:OwnAdminChannel,value:unknown,input:unknown,status:number):unknown{
    const operation=parseClientCommand(channel,input);demand(operation.kind==='command');
    if(status===401||status===403)return {code:status===401?'session_ended':'forbidden'};
    if(status!==200){
        const v=object(value);exact(v,['code']);
        const errors:Readonly<Record<string,number>>={invalid_input:400,invalid_request:400,too_large:413,unsupported_media_type:415,revision_conflict:409,request_conflict:409,basis_conflict:409,rate_limited:429,unavailable:503};
        demand(typeof v.code==='string'&&errors[v.code]===status,503,'unavailable');return {code:v.code};
    }
    try{
        if(channel==='account-profile')return mapAccountProfileResult(value,buildAccountProfileRpc(operation.command).args.p_command);
        if(channel==='client-orders')return mapClientOrdersReadResult(value,buildClientOrdersReadRpc(operation.command).args.p_command);
        const command=readAccountContactCommand(operation.command);demand(command.action==='read_account_contact_v1',503,'unavailable');
        return mapAccountContactResult(value,command);
    }catch{throw new SessionError(503,'unavailable');}
}
export function mapClientPhotoHeadResponse(input: unknown) {
    const head=mapCheckinPhotoHead(input);demand(head.ok,503,'unavailable');return head.value;
}
export function parseClientPhotoInventoryPage(input:unknown):CheckinPhotoInventoryPage{
    const command=object(input);exact(command,['action','cursor','limit','expectedRevision']);
    demand(command.action==='read_photo_inventory_v1');
    const cursor=command.cursor===null?null:uuid(command.cursor),limit=command.limit,expectedRevision=command.expectedRevision;
    demand(typeof limit==='number'&&Number.isSafeInteger(limit)&&limit>=1&&limit<=50);
    demand(expectedRevision===null||typeof expectedRevision==='number'&&Number.isSafeInteger(expectedRevision)&&expectedRevision>=0);
    demand(cursor===null||expectedRevision!==null);
    return {cursor,limit,expectedRevision};
}
export function mapClientPhotoInventoryResponse(input:unknown,command:unknown){
    const value=mapCheckinPhotoInventory(input,parseClientPhotoInventoryPage(command));demand(value.ok,503,'unavailable');
    demand(new TextEncoder().encode(JSON.stringify(value.value)).byteLength<=8192,503,'unavailable');return value.value;
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
