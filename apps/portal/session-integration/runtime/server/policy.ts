import {parseWalkthroughCommand, type WalkthroughCommand} from './walkthrough-policy';
import {parsePlanCommand} from './plan-policy';
import {advisorPlanActions} from '../../../site/auth/plan-actions.js';
import {planErrorStatuses} from '../../../../../src/contracts/PortalRebuildValues.ts';
import { demand, SessionError } from './types';
export const PORTAL_ORIGIN = 'https://portal.goshelv.com';
export const SUPABASE_ORIGIN = 'https://snojlbqovlawewwqbviz.supabase.co';
export type Channel = 'operations' | 'payments' | 'checkins' | 'admission' | 'walkthroughs' | 'plans';
export type Operation = {kind:'walkthrough'; command:WalkthroughCommand} | {
    kind: 'client-media'; media: 'photo' | 'evidence'; id: string; schemaVersion?:2;
} | {
    kind: 'advisor-evidence'; clientId:string; evidenceId:string; schemaVersion?:2;
} | {
    kind: 'client-upload'; channel: 'payments' | 'checkins'; metadata: Record<string, unknown>; bytes: Uint8Array; contentType: string;
} | {
    kind: 'command';
    channel: Channel;
    command: Record<string, unknown>;
} | {
    kind: 'preview';
    mode: 'draft' | 'published' | 'payments' | 'checkins';
    clientId: string;
    expectedRevision?: number;
} | {
    kind: 'photo';
    clientId: string;
    photoId: string;
};
const actions: Record<Channel, readonly string[]> = { operations: ['advisor_preview_read_v2', 'advisor_list', 'advisor_read_v2', 'save_intake_v2', 'save_draft_v2', 'publish_v2', 'save_meeting_note', 'service_advisor_read', 'record_review', 'save_instruction_draft', 'publish_instruction_revision', 'record_purchase', 'record_return_event', 'cancel_service'], payments: ['advisor_read', 'issue_quote', 'confirm_payment', 'reject_claim', 'evidence_url'], checkins: ['advisor_read', 'advisor_photo_view', 'set_next_checkin', 'add_meeting_note', 'send_advisor_reply'], admission: ['capabilities','add_client','admission_status'], walkthroughs:['library','open','share_list','share_create','share_revoke'],plans:advisorPlanActions };
export function object(value: unknown): Record<string, unknown> { demand(value !== null && typeof value === 'object' && !Array.isArray(value)); return value as Record<string, unknown>; }
export function exact(value: Record<string, unknown>, keys: string[]) { demand(Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k))); }
export function uuid(value: unknown) { demand(typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)); return value.toLowerCase(); }
export function parseCommand(channel: Channel, value: unknown): Operation {
    if(channel==='walkthroughs')return {kind:'walkthrough',command:parseWalkthroughCommand(value)};
    if(channel==='plans')return {kind:'command',channel,command:parsePlanCommand(value,'advisor')};
    const command = object(value);
    demand(Object.hasOwn(actions, channel) && typeof command.action === 'string' && actions[channel].includes(command.action), 403, 'action_forbidden');
    demand(!Object.keys(command).some(k => ['rpc', 'rpcname', 'endpoint', 'url', 'upstream', 'function', 'functionname', 'headers', 'authorization', 'access_token', 'refresh_token', 'accesstoken', 'refreshtoken'].includes(k.toLowerCase())), 400, 'invalid_request');
    if (command.action === 'advisor_preview_read_v2') {
        exact(command, ['action', 'clientId', 'mode', 'expectedRevision']);
        demand(command.mode === 'draft' || command.mode === 'published');
        demand(command.mode === 'draft'
            ? typeof command.expectedRevision === 'number' && Number.isSafeInteger(command.expectedRevision) && command.expectedRevision >= 0
            : command.expectedRevision === null);
    }
    if (channel === 'admission') {
        if (command.action === 'capabilities') exact(command, ['action']);
        else if (command.action === 'admission_status') { exact(command, ['action','requestId']); uuid(command.requestId); }
        else {
            exact(command, ['action','requestId','email','displayName']); uuid(command.requestId);
            demand(typeof command.email === 'string' && command.email.length <= 254 && typeof command.displayName === 'string' && Array.from(command.displayName).length <= 200);
        }
    }
    if (command.action === 'send_advisor_reply') {
        exact(command, ['action','clientId','checkinId','reply','requestId','expectedRevision']);
        uuid(command.checkinId); uuid(command.requestId);
        demand(typeof command.reply === 'string' && command.reply.trim().length > 0 && Array.from(command.reply).length <= 4000 && !command.reply.includes('\u0000'));
        demand(typeof command.expectedRevision === 'number' && Number.isSafeInteger(command.expectedRevision) && command.expectedRevision >= 0);
    }
    // Other payload schemas and existing revision/request-id semantics remain with the established Edge handlers.
    if (command.action === 'evidence_url') { exact(command, ['action','evidenceId',...(command.schemaVersion===2?['schemaVersion']:[])]); uuid(command.evidenceId); }
    if (channel !== 'admission' && command.action !== 'advisor_list' && command.action !== 'evidence_url')
        uuid(command.clientId);
    return { kind: 'command', channel, command };
}
export async function readBounded(stream: ReadableStream<Uint8Array> | null, max: number): Promise<Uint8Array> {
    if (!stream)
        return new Uint8Array();
    const reader = stream.getReader(), chunks: Uint8Array[] = [];
    let total = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done)
                break;
            total += value.length;
            if (total > max) {
                await reader.cancel();
                throw new SessionError(413, 'too_large');
            }
            chunks.push(value);
        }
    }
    finally {
        reader.releaseLock();
    }
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}
export async function jsonBody(request: Request,maxBytes=100000) {
    demand(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() === 'application/json', 415, 'unsupported_media_type');
    const bytes = await readBounded(request.body, maxBytes);
    try {
        return object(JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)));
    }
    catch (error) {
        if (error instanceof SessionError)
            throw error;
        throw new SessionError(400, 'invalid_request');
    }
}
export function validateRequest(request: Request, origin: string) {
    const url = new URL(request.url);
    demand(origin === PORTAL_ORIGIN, 503, 'configuration_missing');
    demand(url.origin === origin && !url.username && !url.password, 403, 'origin_rejected');
    const host = request.headers.get('host')?.toLowerCase(), canonicalHost = new URL(origin).host;
    demand(!host || host === canonicalHost || host === `${canonicalHost}:443`, 403, 'origin_rejected');
    const supplied = request.headers.get('origin'), site = request.headers.get('sec-fetch-site');
    demand((!supplied || supplied === origin) && site !== 'cross-site' && site !== 'same-site' && site !== 'none' && (site === 'same-origin' || supplied === origin), 403, 'origin_rejected');
    if (request.method === 'POST') {
        demand(supplied === origin, 403, 'origin_rejected');
        demand(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() === 'application/json', 415, 'unsupported_media_type');
        demand((request.headers.get('x-shelv-csrf')?.length ?? 0) > 0 && (request.headers.get('x-shelv-csrf')?.length ?? 0) <= 128, 403, 'csrf_rejected');
    }
}
export function parsePreview(url: URL): Operation {
    const mode = url.pathname.slice('/api/advisor/preview/'.length);
    demand(['draft', 'published', 'payments', 'checkins', 'photo'].includes(mode), 404, 'not_found');
    const keys = mode === 'photo' ? ['clientId', 'photoId'] : mode === 'draft' ? ['clientId', 'expectedRevision'] : ['clientId'];
    demand([...url.searchParams.keys()].length === keys.length && keys.every(k => url.searchParams.getAll(k).length === 1));
    const clientId = uuid(url.searchParams.get('clientId'));
    if (mode === 'photo')
        return { kind: 'photo', clientId, photoId: uuid(url.searchParams.get('photoId')) };
    if (mode === 'draft') {
        const raw = url.searchParams.get('expectedRevision')!;
        demand(/^(0|[1-9][0-9]*)$/.test(raw));
        const expectedRevision = Number(raw);
        demand(Number.isSafeInteger(expectedRevision));
        return { kind: 'preview', mode, clientId, expectedRevision };
    }
    return { kind: 'preview', mode: mode as 'published' | 'payments' | 'checkins', clientId };
}
export function parseAdvisorEvidence(url:URL):Operation{
    demand(url.pathname==='/api/advisor/media/evidence',404,'not_found');const v2=url.searchParams.get('v')==='2',keys=['clientId','evidenceId','view',...(v2?['v']:[])];
    demand([...url.searchParams.keys()].length===keys.length&&keys.every(key=>url.searchParams.getAll(key).length===1));
    uuid(url.searchParams.get('view')); // Cache key only; authority still comes from the current cookie and SQL guard.
    return {kind:'advisor-evidence',clientId:uuid(url.searchParams.get('clientId')),evidenceId:uuid(url.searchParams.get('evidenceId')),...(v2?{schemaVersion:2 as const}:{})};
}
export const safeCodes = new Set(['invalid_request', 'invalid_input', 'forbidden', 'action_forbidden', 'not_found', 'session_ended', 'flow_ended', 'flow_replayed', 'account_conflict', 'csrf_rejected', 'origin_rejected', 'unsupported_media_type', 'too_large', 'unavailable', 'configuration_missing', 'rate_limited', 'share_limit_reached', 'stale_revision', 'stale_draft', 'draft_missing', 'photo_unavailable', 'preview_read_only', 'concierge_admission_forbidden', 'concierge_admission_session_ended', 'concierge_admission_conflict', 'concierge_admission_not_found', 'concierge_admission_pending']);
for(const code of [...Object.keys(planErrorStatuses),'uncertain'])safeCodes.add(code);
export function safeError(error: unknown) { const e = error as {
    status?: number;
    code?: string;
}; return { status: typeof e?.status === 'number' && [400, 401, 403, 404, 405, 409, 413, 415, 429, 503].includes(e.status) ? e.status : 503, code: typeof e?.code === 'string' && safeCodes.has(e.code) ? e.code : 'unavailable' }; }
