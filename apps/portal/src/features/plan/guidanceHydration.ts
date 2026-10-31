import type {ClientPlanViewV3,InstructionScope,InstructionManifestEntry,InstructionManifestPage,InstructionDetail} from '../../../../../src/contracts/PortalReview.ts';
import {mapReviewResult,collectInstructionManifest,bindInstructionForScope,instructionScopes} from '../../../../../src/contracts/PortalReviewMapping.ts';
import {sameCareValue} from '../../../../../src/contracts/PortalCareValidation.ts';
import {TransportError} from '../../transport/session.ts';
import type {ClientGuidancePort} from './guidancePort.ts';
import type {PlanSessionBoundary} from './types.ts';
import type {PresentationMode} from '../../navigation/routes.ts';

export const guidanceScopeKey=(s:InstructionScope)=>JSON.stringify([s.publication.version,s.publication.documentSchemaVersion,s.slotId,s.productId]);
export type GuidanceScopeState={state:'baseline'}|{state:'instruction';detail:InstructionDetail}|{state:'pending'}|{state:'error';status:number};
export interface GuidanceHydrationState {
 phase:'idle'|'manifest'|'ready'|'error'|'retired';
 manifest:InstructionManifestEntry[]|null;
 details:ReadonlyMap<string,InstructionDetail>;
 errors:ReadonlyMap<string,number>;
 error:number|null;
}
const statusOf=(e:unknown)=>{const n=(e as {status?:number})?.status;return n&&[400,401,403,404,409,413,429,503].includes(n)?n:503;};
/** Per captured owner/view/snapshot/mode context. At most three exact detail
 * requests run concurrently; at most150 detail bodies remain in volatile memory.
 * Manifest completeness never depends on visible scopes or response item count. */
export function createGuidanceHydrator({view,session,mode,port}:{view:ClientPlanViewV3;session:PlanSessionBoundary;mode:PresentationMode;port?:ClientGuidancePort}) {
 const parsed=mapReviewResult(view,{schemaVersion:1,action:'read_client_plan_v3',version:view.plan?.version??null});
 if(!sameCareValue(parsed,view))throw new TransportError(503);
 const reference=view.currentGuidance,allowed=instructionScopes(view),listeners=new Set<()=>void>(),abort=new AbortController();
 let retired=false,state:GuidanceHydrationState={phase:'idle',manifest:null,details:new Map(),errors:new Map(),error:null};
 let manifestWork:Promise<void>|null=null,active=0,visibilityEpoch=0,shownKey:string|null=null;
 let visibleScopes:Set<string>|null=null;
 const pending=new Map<string,Promise<void>>(),queue:(()=>void)[]=[];
 const live=()=>!retired&&session.isCurrent();
 const emit=(patch:Partial<GuidanceHydrationState>)=>{if(live()){state={...state,...patch};listeners.forEach(fn=>fn());}};
 const validScope=(scope:InstructionScope)=>allowed.some(s=>sameCareValue(s,scope));
 function dispose(){if(retired)return;retired=true;abort.abort();state={phase:'retired',manifest:null,details:new Map(),errors:new Map(),error:401};queue.splice(0).forEach(run=>run());listeners.forEach(fn=>fn());listeners.clear();stop();}
 const stop=session.subscribeInvalidation(dispose);
 async function manifest(){
  if(state.manifest!==null||!live())return;
  if(manifestWork)return manifestWork;
  manifestWork=(async()=>{
   emit({phase:'manifest',error:null});
   try{
    if(!['client','historical'].includes(mode)||!port||!reference)throw new TransportError(503);
    const pages:InstructionManifestPage[]=[],seen=new Set<string>();let cursor:string|null=null;
    if(reference.instructionCount>0)do{
     const command={schemaVersion:1,action:'read_client_instruction_manifest_v1',snapshot:reference.snapshot,cursor,limit:100} as const;
     const page=mapReviewResult(await port.execute(command,{signal:abort.signal}),command) as InstructionManifestPage;
     if(!live())return;
     pages.push(page);
     if(pages.length>reference.instructionCount||page.total!==reference.instructionCount||page.items.length===0)throw new TransportError(503);
     cursor=page.nextCursor;if(cursor!==null){if(seen.has(cursor))throw new TransportError(503);seen.add(cursor);}
    }while(cursor!==null);
    const entries=collectInstructionManifest(view,pages);
    emit({phase:'ready',manifest:entries,error:null});
   }catch(error){emit({phase:'error',manifest:null,details:new Map(),error:statusOf(error)});}
   finally{manifestWork=null;}
  })();return manifestWork;
 }
 function drain(){while(active<3&&queue.length){const run=queue.shift()!;run();}}
 function detail(scope:InstructionScope,visibility:number):Promise<void>{
  const key=guidanceScopeKey(scope),jobKey=`${visibility}:${key}`;if(state.details.has(key))return Promise.resolve();const old=pending.get(jobKey);if(old)return old;
  const item=state.manifest?.find(x=>sameCareValue(x.scope,scope));if(!item)return Promise.resolve();
  const work=new Promise<void>(resolve=>{
   const run=()=>{
    if(!live()||visibility!==visibilityEpoch||visibleScopes&&!visibleScopes.has(key)){pending.delete(jobKey);resolve();return;}
    active++;
    void (async()=>{try{
     if(!port||!reference)throw new TransportError(503);
     const command={schemaVersion:1,action:'read_client_instruction_v1',snapshot:reference.snapshot,instructionId:item.instructionId,version:item.version,contentHash:item.contentHash} as const;
     const body=mapReviewResult(await port.execute(command,{signal:abort.signal}),command) as InstructionDetail;
     if(!live()||visibility!==visibilityEpoch||visibleScopes&&!visibleScopes.has(key))return;
     const joined=bindInstructionForScope(view,state.manifest!,scope,body);if(!joined)throw new TransportError(503);
     const details=new Map(state.details),errors=new Map(state.errors);details.delete(key);details.set(key,joined);errors.delete(key);
     while(details.size>150)details.delete(details.keys().next().value!);
     emit({details,errors});
    }catch(error){if(live()&&visibility===visibilityEpoch&&(!visibleScopes||visibleScopes.has(key))){const status=statusOf(error);if([401,403,409].includes(status)){emit({phase:'error',manifest:null,details:new Map(),errors:new Map(),error:status});}else{const errors=new Map(state.errors);errors.set(key,status);emit({errors});}}}
    finally{active--;pending.delete(jobKey);resolve();drain();}})();
   };
   queue.push(run);
  });pending.set(jobKey,work);drain();return work;
 }
 async function load(scopes:InstructionScope[]){
  if(scopes.length>150||scopes.some(s=>!validScope(s)))throw new TransportError(400);
  if(!live())return;const visibility=visibilityEpoch;
  await manifest();if(!live()||state.manifest===null||visibility!==visibilityEpoch)return;
  await Promise.all([...new Map(scopes.map(s=>[guidanceScopeKey(s),s])).values()].map(scope=>detail(scope,visibility)));
 }
 return {
  view,session,mode,
  getSnapshot:()=>state,
  subscribe(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn);},
  async load(scopes:InstructionScope[]){return load(scopes);},
  async observe(scopes:InstructionScope[]){
   if(scopes.length>150||scopes.some(s=>!validScope(s)))throw new TransportError(400);
   const keys=scopes.map(guidanceScopeKey),next=JSON.stringify([...new Set(keys)].sort());
   if(next!==shownKey){shownKey=next;visibleScopes=new Set(keys);visibilityEpoch++;}
   return load(scopes);
  },
  scope(scope:InstructionScope):GuidanceScopeState {
   if(!live()||!validScope(scope))return{state:'error',status:401};
   if(state.phase==='error')return{state:'error',status:state.error??503};
   if(state.manifest===null)return{state:'pending'};
   const entry=state.manifest.find(x=>sameCareValue(x.scope,scope));
   if(!entry){bindInstructionForScope(view,state.manifest,scope,null);return{state:'baseline'};}
   const error=state.errors.get(guidanceScopeKey(scope));if(error)return{state:'error',status:error};
   const body=state.details.get(guidanceScopeKey(scope));return body?{state:'instruction',detail:body}:{state:'pending'};
  },
  dispose,
 };
}
export type GuidanceHydrator=ReturnType<typeof createGuidanceHydrator>;
/** Pure fixture/demonstration data only. No transport or live callback is used. */
export function fixtureInstruction(view:ClientPlanViewV3,pages:InstructionManifestPage[],scope:InstructionScope,detail:InstructionDetail|null){return bindInstructionForScope(view,collectInstructionManifest(view,pages),scope,detail);}
