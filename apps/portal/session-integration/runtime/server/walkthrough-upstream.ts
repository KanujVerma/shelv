import { SupabaseProvider } from './upstream';
import { SUPABASE_ORIGIN, readBounded } from './policy';
import type { Credentials } from './types';
import type { WireResponse } from './protocol';
import { WalkthroughError, instant, keys, opaqueId, projectWalkthrough, record, requireWalkthrough, text, WALKTHROUGH_MAX_BYTES } from './walkthrough-contract';
import { capabilityDigest, parseWalkthroughCommand, readShareCursor, type WalkthroughCommand } from './walkthrough-policy';

export type WalkthroughGrant={id:string;caseId:string;versionId:string;createdBy:string;createdAt:string;expiresAt:string;revokedAt:string|null;status:'active'|'expired'|'revoked'};
export function mapGrant(value:unknown):WalkthroughGrant{
    const v=record(value);keys(v,['id','caseId','versionId','createdBy','createdAt','expiresAt','revokedAt','status']);requireWalkthrough(['active','expired','revoked'].includes(String(v.status)),503,'unavailable');
    return {id:opaqueId(v.id),caseId:opaqueId(v.caseId),versionId:opaqueId(v.versionId),createdBy:opaqueId(v.createdBy),createdAt:instant(v.createdAt),expiresAt:instant(v.expiresAt),revokedAt:v.revokedAt===null?null:instant(v.revokedAt),status:v.status as WalkthroughGrant['status']};
}
export function mapWalkthroughResponse(command:WalkthroughCommand,value:unknown):unknown{
    const v=record(value);requireWalkthrough(v.schemaVersion===1,503,'unavailable');
    if(command.action==='open'){
        keys(v,['schemaVersion','snapshot']);const snapshot=projectWalkthrough(v.snapshot);requireWalkthrough(snapshot.caseId===command.caseId&&(!command.versionId||snapshot.versionId===command.versionId),503,'unavailable');return {schemaVersion:1,snapshot};
    }
    if(command.action==='library'){
        keys(v,['schemaVersion','entries']);requireWalkthrough(Array.isArray(v.entries)&&v.entries.length<=100,503,'unavailable');
        return {schemaVersion:1,entries:v.entries.map(entry=>{
            const e=record(entry);keys(e,['caseId','title','status','versionId','createdAt','sourceReference','canShare']);requireWalkthrough((e.status==='draft'||e.status==='ready')&&typeof e.canShare==='boolean');
            return {caseId:opaqueId(e.caseId),title:text(e.title,200),status:e.status,versionId:e.versionId===null?null:opaqueId(e.versionId),createdAt:e.createdAt===null?null:instant(e.createdAt),sourceReference:text(e.sourceReference,2048),canShare:e.canShare};
        })};
    }
    if(command.action==='share_list'){
        keys(v,['schemaVersion','grants','nextCursor']);requireWalkthrough(Array.isArray(v.grants)&&v.grants.length<=200,503,'unavailable');const grants=v.grants.map(mapGrant);requireWalkthrough(grants.every(g=>g.caseId===command.caseId),503,'unavailable');return {schemaVersion:1,grants,nextCursor:v.nextCursor===null?null:readShareCursor(v.nextCursor)};
    }
    keys(v,['schemaVersion','grant']);const grant=mapGrant(v.grant);requireWalkthrough(grant.caseId===command.caseId&&(command.action==='share_create'?grant.versionId===command.versionId:grant.id===command.grantId),503,'unavailable');return {schemaVersion:1,grant};
}
/** Advisor credentials remain in the existing private vault and every RPC rechecks live grants. */
export class WalkthroughProvider extends SupabaseProvider {
    async performWalkthrough(credentials:Credentials,value:WalkthroughCommand):Promise<WireResponse>{
        const command=parseWalkthroughCommand(value);
        const payload:Record<string,unknown>={...command};delete payload.token;
        if(command.action==='share_create')payload.digest=await capabilityDigest(command.token);
        const response=await this.response(`${SUPABASE_ORIGIN}/rest/v1/rpc/walkthrough_advisor_command`,{method:'POST',headers:this.headers(credentials.access_token),body:JSON.stringify({p_command:payload})});
        let raw:unknown;try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true,ignoreBOM:false}).decode(response.bytes));}catch{throw new WalkthroughError(503,'unavailable');}
        if(response.status!==200){
            // PostgREST puts a deliberate PT409 application's code in message,
            // while code contains PT409. Never forward arbitrary provider text.
            const error=raw&&typeof raw==='object'?raw as Record<string,unknown>:{},allowed=new Set(['session_ended','forbidden','action_forbidden','not_ready','invalid_expiry','request_conflict','share_limit_reached','invalid_request','invalid_input']);
            const code=typeof error.message==='string'&&allowed.has(error.message)?error.message:typeof error.code==='string'&&allowed.has(error.code)?error.code:response.status===401?'session_ended':response.status===403?'forbidden':'unavailable';
            throw new WalkthroughError([400,401,403,404,409,413,429].includes(response.status)?response.status:503,code);
        }
        try{return {status:200,body:mapWalkthroughResponse(command,raw)};}catch{throw new WalkthroughError(503,'unavailable');}
    }
}
/** Dedicated guest reader. Its credential is a vault-only secret, never an advisor/client fallback. */
export async function readWalkthroughWithKey(key:string,digest:string,fetcher:typeof fetch=globalThis.fetch):Promise<ReturnType<typeof projectWalkthrough>>{
    requireWalkthrough(typeof key==='string'&&key.length>=40&&/^[A-Za-z0-9_.-]+$/.test(key)&&/^[a-f0-9]{64}$/.test(digest),503,'configuration_missing');
    let permitted=/^sb_secret_/.test(key);
    if(!permitted&&key.split('.').length===3){try{const raw=key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');permitted=JSON.parse(atob(raw)).role==='service_role';}catch{/* fail closed */}}
    requireWalkthrough(permitted,503,'configuration_missing');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
        const response=await fetcher(`${SUPABASE_ORIGIN}/rest/v1/rpc/walkthrough_capability_read`,{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:`Bearer ${key}`},body:JSON.stringify({p_digest:digest}),redirect:'manual',cache:'no-store',signal:controller.signal});
        requireWalkthrough(response.status===200,503,'unavailable');
        const bytes=await readBounded(response.body,WALKTHROUGH_MAX_BYTES+1000);
        const raw=JSON.parse(new TextDecoder('utf-8',{fatal:true,ignoreBOM:false}).decode(bytes));requireWalkthrough(raw!==null,404,'unavailable');
        return projectWalkthrough(raw);
    }catch(error){if(error instanceof WalkthroughError)throw error;throw new WalkthroughError(503,'unavailable');}
    finally{clearTimeout(timer);}
}
