import { mkdir, open, readFile, rename, rm, lstat, chmod } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { WalkthroughError, opaqueId, projectWalkthrough, requireWalkthrough, validatePrivateInput, type WalkthroughSnapshot } from '../../session-integration/runtime/server/walkthrough-contract.ts';
import { capabilityDigest, parseWalkthroughCommand, type WalkthroughCommand } from '../../session-integration/runtime/server/walkthrough-policy.ts';
import type { WalkthroughGrant } from '../../session-integration/runtime/server/walkthrough-upstream.ts';

type Case={id:string;title:string;status:'draft'|'ready';sourceReference:string;latestVersionId:string};
type Version={caseId:string;id:string;createdAt:string;status:'draft'|'ready';snapshot:WalkthroughSnapshot};
type StoredGrant=Omit<WalkthroughGrant,'status'>&{digest:string};
type State={schemaVersion:1;cases:Record<string,Case>;versions:Record<string,Version>;provenance:Record<string,Record<string,unknown>>;grants:Record<string,StoredGrant>;requests:Record<string,{fingerprint:string;grantId:string}>};
export type LocalWalkthroughActor={ownerId:string;canView:boolean;canShare:boolean};
const empty=():State=>({schemaVersion:1,cases:{},versions:{},provenance:{},grants:{},requests:{}});
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const canonical=(value:unknown):string=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
/** Local private persistence only. Imports do not create Auth users, live cases or share grants. */
export class LocalWalkthroughStore {
    readonly directory:string;
    constructor(directory:string,private now:()=>number=Date.now){this.directory=resolve(directory);}
    private async prepare(){
        await mkdir(this.directory,{recursive:true,mode:0o700});const info=await lstat(this.directory);requireWalkthrough(info.isDirectory()&&!info.isSymbolicLink(),503,'unavailable');await chmod(this.directory,0o700);
    }
    private async read():Promise<State>{
        const file=join(this.directory,'store.json');
        try{const info=await lstat(file);requireWalkthrough(info.isFile()&&!info.isSymbolicLink()&&info.size<=30_000_000,503,'unavailable');await chmod(file,0o600);const state=JSON.parse(await readFile(file,'utf8')) as State;requireWalkthrough(state.schemaVersion===1&&state.cases&&state.versions&&state.provenance&&state.grants&&state.requests,503,'unavailable');return state;}
        catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return empty();throw error;}
    }
    private async transaction<T>(work:(state:State)=>Promise<T>|T,write=true):Promise<T>{
        await this.prepare();const lock=join(this.directory,'.write-lock'),deadline=Date.now()+5000;
        for(;;){try{await mkdir(lock,{mode:0o700});break;}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST'||Date.now()>deadline)throw new WalkthroughError(503,'unavailable');await pause(15);}}
        let temporary:string|undefined;
        try{const state=await this.read(),result=await work(state);if(write){temporary=join(this.directory,`.store-${randomUUID()}.tmp`);const handle=await open(temporary,'wx',0o600);try{await handle.writeFile(JSON.stringify(state));await handle.sync();}finally{await handle.close();}await rename(temporary,join(this.directory,'store.json'));temporary=undefined;}return clone(result);}
        finally{if(temporary)await rm(temporary,{force:true});await rm(lock,{recursive:true,force:true});}
    }
    async import(value:unknown){
        const {input,snapshot}=validatePrivateInput(value);
        return this.transaction(state=>{
            const previous=state.versions[snapshot.versionId];
            const version:Version={caseId:snapshot.caseId,id:snapshot.versionId,createdAt:input.version.createdAt,status:input.case.status,snapshot};
            if(previous){requireWalkthrough(canonical(previous)===canonical(version)&&canonical(state.provenance[snapshot.versionId])===canonical(input.version.provenance),409,'immutable_version');}
            else{state.versions[snapshot.versionId]=version;state.provenance[snapshot.versionId]=clone(input.version.provenance);}
            const oldCase=state.cases[snapshot.caseId];
            if(previous&&oldCase?.latestVersionId!==snapshot.versionId)throw new WalkthroughError(409,'immutable_version');
            state.cases[snapshot.caseId]={...input.case,latestVersionId:snapshot.versionId};
            return {schemaVersion:1,caseId:snapshot.caseId,versionId:snapshot.versionId,imported:!previous,shareGrantsCreated:0};
        });
    }
    private grantView(grant:StoredGrant):WalkthroughGrant{
        return {id:grant.id,caseId:grant.caseId,versionId:grant.versionId,createdBy:grant.createdBy,createdAt:grant.createdAt,expiresAt:grant.expiresAt,revokedAt:grant.revokedAt,status:grant.revokedAt?'revoked':this.now()>=Date.parse(grant.expiresAt)?'expired':'active'};
    }
    async command(value:unknown,authorize:()=>Promise<LocalWalkthroughActor>):Promise<unknown>{
        const command=parseWalkthroughCommand(value),actor=await authorize();opaqueId(actor.ownerId);requireWalkthrough(actor.canView,403,'forbidden');
        const sharing=command.action==='share_create'||command.action==='share_revoke';requireWalkthrough(!sharing||actor.canShare,403,'forbidden');
        const digest=command.action==='share_create'?await capabilityDigest(command.token):undefined;
        return this.transaction(async state=>{
            const current=await authorize();requireWalkthrough(current.ownerId===actor.ownerId&&current.canView&&(!sharing||current.canShare),403,'forbidden');
            let result:unknown;
            if(command.action==='library')result={schemaVersion:1,entries:Object.values(state.cases).map(c=>({caseId:c.id,title:c.title,status:c.status,versionId:c.latestVersionId,createdAt:state.versions[c.latestVersionId]?.createdAt??null,sourceReference:c.sourceReference,canShare:current.canShare}))};
            else{
                const c=state.cases[command.caseId];requireWalkthrough(c,404,'unavailable');
                if(command.action==='open'){
                    const v=state.versions[command.versionId??c.latestVersionId];requireWalkthrough(v&&v.caseId===c.id,404,'unavailable');result={schemaVersion:1,snapshot:projectWalkthrough(v.snapshot)};
                }else if(command.action==='share_list'){
                    const listedAt=this.now(),active=(g:StoredGrant)=>!g.revokedAt&&listedAt<Date.parse(g.expiresAt);
                    const remaining=Object.values(state.grants).filter(g=>g.caseId===c.id).sort((a,b)=>Number(active(b))-Number(active(a))||b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id)).filter(g=>{
                        const cursor=command.cursor;if(!cursor)return true;
                        const before=g.createdAt<cursor.createdAt||(g.createdAt===cursor.createdAt&&g.id<cursor.id);
                        return cursor.phase==='active'?!active(g)||before:!active(g)&&before;
                    });
                    const page=remaining.slice(0,200),last=page.at(-1);
                    result={schemaVersion:1,grants:page.map(g=>this.grantView(g)),nextCursor:remaining.length>200&&last?{phase:active(last)?'active':'inactive',createdAt:last.createdAt,id:last.id}:null};
                }
                else{
                    const selector=command.action==='share_create'?{action:command.action,caseId:command.caseId,versionId:command.versionId,digest,expiresAt:command.expiresAt??null}:{action:command.action,caseId:command.caseId,grantId:command.grantId};
                    const fingerprint=canonical(selector),requestKey=`${actor.ownerId}:${command.requestId}`,prior=state.requests[requestKey];
                    if(prior){requireWalkthrough(prior.fingerprint===fingerprint,409,'request_conflict');const grant=state.grants[prior.grantId];requireWalkthrough(grant&&grant.caseId===c.id,503,'unavailable');result={schemaVersion:1,grant:this.grantView(grant)};}
                    else{
                        let grant:StoredGrant;
                        if(command.action==='share_create'){
                            const v=state.versions[command.versionId];requireWalkthrough(c.status==='ready'&&v?.caseId===c.id&&v.status==='ready',409,'not_ready');projectWalkthrough(v.snapshot);
                            requireWalkthrough(!Object.values(state.grants).some(g=>g.digest===digest),409,'request_conflict');
                            // The file transaction serializes concurrent creates; a prior exact retry
                            // returned above before this cap. Revoked/expired grants release a slot.
                            requireWalkthrough(Object.values(state.grants).filter(g=>g.caseId===c.id&&!g.revokedAt&&this.now()<Date.parse(g.expiresAt)).length<100,409,'share_limit_reached');
                            const createdAt=new Date(this.now()).toISOString(),expiresAt=command.expiresAt??new Date(this.now()+30*86400000).toISOString();
                            requireWalkthrough(Date.parse(expiresAt)>this.now()&&Date.parse(expiresAt)<=this.now()+90*86400000,400,'invalid_expiry');
                            grant={id:randomUUID(),caseId:c.id,versionId:v.id,digest:digest!,createdBy:actor.ownerId,createdAt,expiresAt,revokedAt:null};state.grants[grant.id]=grant;
                        }else{grant=state.grants[command.grantId];requireWalkthrough(grant&&grant.caseId===c.id,404,'unavailable');if(!grant.revokedAt)grant.revokedAt=new Date(this.now()).toISOString();}
                        state.requests[requestKey]={fingerprint,grantId:grant.id};result={schemaVersion:1,grant:this.grantView(grant)};
                    }
                }
            }
            const after=await authorize();requireWalkthrough(after.ownerId===actor.ownerId&&after.canView&&(!sharing||after.canShare),403,'forbidden');
            return result;
        },sharing);
    }
    async readCapability(digest:string):Promise<WalkthroughSnapshot>{
        requireWalkthrough(/^[a-f0-9]{64}$/.test(digest),404,'unavailable');
        return this.transaction(state=>{
            const g=Object.values(state.grants).find(value=>value.digest===digest);
            requireWalkthrough(g&&!g.revokedAt&&this.now()<Date.parse(g.expiresAt),404,'unavailable');
            const c=state.cases[g.caseId],v=state.versions[g.versionId];requireWalkthrough(c?.status==='ready'&&v?.status==='ready'&&v.caseId===c.id,404,'unavailable');
            return projectWalkthrough(v.snapshot);
        },false);
    }
}
