import { keys, opaqueId, instant, record, requireWalkthrough } from './walkthrough-contract';
export type WalkthroughShareCursor={phase:'active'|'inactive';createdAt:string;id:string};
export type WalkthroughCommand = {action:'library'} | {action:'open';caseId:string;versionId?:string} | {action:'share_list';caseId:string;cursor?:WalkthroughShareCursor} | {action:'share_create';caseId:string;versionId:string;requestId:string;token:string;expiresAt?:string} | {action:'share_revoke';caseId:string;grantId:string;requestId:string};
export function readShareCursor(value:unknown):WalkthroughShareCursor{const v=record(value);keys(v,['phase','createdAt','id']);requireWalkthrough(v.phase==='active'||v.phase==='inactive');return {phase:v.phase,createdAt:instant(v.createdAt),id:opaqueId(v.id)};}
export const CAPABILITY_PATTERN=/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
export function capability(value:unknown):string{requireWalkthrough(typeof value==='string'&&CAPABILITY_PATTERN.test(value));return value;}
export function parseWalkthroughCommand(value:unknown):WalkthroughCommand{
    const v=record(value);
    switch(v.action){
        case 'library':keys(v,['action']);return {action:'library'};
        case 'open':keys(v,['action','caseId'],['versionId']);return {action:'open',caseId:opaqueId(v.caseId),...(v.versionId!==undefined?{versionId:opaqueId(v.versionId)}:{})};
        case 'share_list':keys(v,['action','caseId'],['cursor']);return {action:'share_list',caseId:opaqueId(v.caseId),...(v.cursor!==undefined?{cursor:readShareCursor(v.cursor)}:{})};
        case 'share_create':keys(v,['action','caseId','versionId','requestId','token'],['expiresAt']);return {action:'share_create',caseId:opaqueId(v.caseId),versionId:opaqueId(v.versionId),requestId:opaqueId(v.requestId),token:capability(v.token),...(v.expiresAt!==undefined?{expiresAt:instant(v.expiresAt)}:{})};
        case 'share_revoke':keys(v,['action','caseId','grantId','requestId']);return {action:'share_revoke',caseId:opaqueId(v.caseId),grantId:opaqueId(v.grantId),requestId:opaqueId(v.requestId)};
        default:requireWalkthrough(false,403,'action_forbidden');
    }
}
export async function capabilityDigest(token:string):Promise<string>{capability(token);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
