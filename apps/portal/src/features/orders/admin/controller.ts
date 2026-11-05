import type {CommerceReceipt,CommerceQuoteTarget,ProductQuoteDraftBody,ProductQuoteLineDraft} from '../../../../../../src/contracts/PortalCommerce.ts';
import {readCommerceCommand,readCommerceShape,hashCommerceCommand,commerceCanonicalJson,emptyProductQuoteLine,cDraftBody,cDraftLine,cSelection,cIdentity,cQuote,co,ca} from '../../../../../../src/contracts/PortalCommerceValidation.ts';
import {mapCommerceResult} from '../../../../../../src/contracts/PortalCommerceMapping.ts';
import {readUuid,requireValue} from '../../../../../../src/contracts/ConciergePortalValidation.ts';
import {newProductQuotePreparation,addProductQuoteLine,replaceProductQuoteLine,buildAdminQuoteDraftSave,buildAdminQuoteLineSave,buildAdminQuoteIssue} from './quote-model.ts';
import {readAdminQuoteIndex,loadAdminQuoteDraft} from './quote-read.ts';
import {productQuoteInputs,readProductQuoteInputs,parseProductQuoteInputs,productQuoteHasInputErrors,rebaseProductQuoteInputs} from './quote-inputs.ts';
import {readProductQuoteShippingView} from './shipping.ts';
import {readProductQuoteHeaderInputs,readProductQuoteLineInputs} from './quote-form.ts';
import type {ProductQuoteHeaderInputs,ProductQuoteLineInputs} from './quote-form.ts';
import type {ProductQuoteInputs} from './quote-inputs.ts';
import type {AdminQuoteWrite,AdminQuoteIssue,ProductQuotePreparation,ProductQuoteDraftRead,ProductQuoteAdminControllerOptions,ProductQuoteAdminState,ProductQuoteAdminPending,ProductQuoteProductPicker,ProductQuotePublishedOption,ProductQuoteAddressPicker} from './types.ts';

function frozen<T>(value:T):T {
 if(value!==null&&typeof value==='object'){for(const item of Object.values(value))frozen(item);Object.freeze(value);}
 return value;
}
const copy=<T>(value:T):T=>frozen(structuredClone(value));
const same=(a:unknown,b:unknown)=>commerceCanonicalJson(a)===commerceCanonicalJson(b);
const quoteWrite=(value:unknown):AdminQuoteWrite=>{
 const c=readCommerceCommand(value);requireValue(['save_product_quote_draft_v1','save_product_quote_line_v1','issue_product_quote_v1'].includes(c.action));return c as AdminQuoteWrite;
};
function preparationFromRead(read:ProductQuoteDraftRead):ProductQuotePreparation {
 requireValue(read.lines.every(line=>read.draft.body.lineIds.includes(line.lineId)));
 // Missing stored rows become explicitly unsent empty form slots only. The
 // canonical read/ready flag is retained separately, never fabricated.
 return copy({body:read.draft.body,lines:read.draft.body.lineIds.map(id=>read.lines.find(line=>line.lineId===id)??emptyProductQuoteLine(id))});
}
function fingerprint(read:ProductQuoteDraftRead):string {
 return commerceCanonicalJson({draft:read.draft.target,body:read.draft.body,lines:read.lines});
}

/** Product quote consumer only. Parent client ID is correlation, never a grant.
 * W0 supplies the fixed actual selected-client/live-finance operation port. */
export function createProductQuoteAdminController({runtime,clientId:inputClientId,request}:ProductQuoteAdminControllerOptions){
 const clientId=readUuid(inputClientId).toLowerCase(),boundary=runtime.getSnapshot().boundary,cookie=runtime.cookie;
 const owner=cookie.identity?.ownerId,generation=cookie.generation,epoch=cookie._epoch,serverGeneration=cookie._view?.generation,csrf=cookie._view?.csrf;
 const intentKey=`commerce-admin-quote-intent:${owner}:${clientId}`,editKey=`commerce-admin-quote-edit:${owner}:${clientId}`;
 const listeners=new Set<()=>void>();let disposed=false,readToken=0,writeToken=0,pickerToken=0,editGeneration=0,readAbort:AbortController|null=null;
 let selectedId:string|null=null,editBase:string|null=null,review:AdminQuoteIssue|null=null;
 let editCacheKnown=false,expectedEditCache:string|null=null;
 let activeWrite:{token:number;requestId:string;view:number;attempted:boolean;signal:AbortController;prior:ProductQuoteAdminPending|null}|null=null;
 const empty=newProductQuotePreparation();
 let state:ProductQuoteAdminState=copy({phase:request?'initial':'unavailable',index:null,loaded:null,latest:null,preparation:empty,inputs:productQuoteInputs(empty),inputErrors:{header:null,lines:{}},dirty:false,reviewed:false,pending:null,receipt:null,error:null,available:!!request,localEditConflict:false,choosingProduct:null,choosingAddress:false});
 // Creation binding is also used by terminal cache cleanup, never as a
 // replacement for alive/READY or the actual finance-bound operation port.
 function ownerCurrent():boolean {
  if(!boundary||runtime.getSnapshot().boundary!==boundary||cookie.audience!=='advisor'||cookie.identity?.role!=='advisor')return false;
  const valid=boundary.isCurrent();
  return valid&&runtime.getSnapshot().boundary===boundary&&cookie.identity?.ownerId===owner&&cookie.generation===generation&&cookie._epoch===epoch&&cookie._view?.generation===serverGeneration&&cookie._view?.csrf===csrf;
 }
 function alive():boolean {if(disposed)return false;const valid=ownerCurrent();return !disposed&&valid;}
 function ready():boolean{return alive()&&cookie.status==='ready'&&cookie._view?.capabilities.view===true;}
 function notify(){const published=state;for(const fn of [...listeners]){if(state!==published)break;if(listeners.has(fn)){try{fn();}catch{/* Observers can only retire their own local work. */}}}}
 type ReadClaim={read:number;view:typeof cookie._view;signal?:AbortSignal};
 // Internal deny-only publication fence, never operation authority.
 function emit(patch:Partial<ProductQuoteAdminState>,fence?:{read?:number;write?:number;view?:typeof cookie._view;signal?:AbortSignal;ready?:true}){
  if(!alive()||fence?.read!==undefined&&readToken!==fence.read||fence?.write!==undefined&&writeToken!==fence.write||fence?.view!==undefined&&cookie._view!==fence.view||fence?.signal?.aborted||fence?.ready&&(cookie.status!=='ready'||cookie._view?.capabilities.view!==true))return;
  const published=frozen({...state,...copy(patch)});state=published;notify();return state===published;
 }
 function readCurrent(claim:ReadClaim){return ready()&&readToken===claim.read&&cookie._view===claim.view&&!claim.signal?.aborted;}
 function claimRead():ReadClaim|null {
  if(disposed)return null;
  if(!request){if(alive())emit({phase:'unavailable'});return null;}
  const read=++readToken,view=cookie._view,allowed=ready();
  if(disposed||readToken!==read||cookie._view!==view)return null;
  if(!allowed){if(alive())emit({phase:'offline'},{read,view});return null;}
  return {read,view};
 }
 function emitRead(patch:Partial<ProductQuoteAdminState>,claim:ReadClaim){if(readCurrent(claim))return emit(patch,{...claim,ready:true});return false;}
 function forgetIntent(pending:ProductQuoteAdminPending):boolean {
  if(!alive())return false;const saved=boundary!.memory.get<{requestId?:string;wire?:string;hash?:string}>(intentKey);
  if(!alive())return false;
  if(saved===undefined)return true;
  if(saved.requestId!==pending.requestId||saved.wire!==pending.wire||saved.hash!==pending.hash)return false;
  boundary!.memory.delete(intentKey);return alive();
 }
 function storedPending():ProductQuoteAdminPending|null {
  const raw=boundary?.memory.get<{version?:unknown;wire?:unknown;hash?:unknown;requestId?:unknown}>(intentKey);
  if(raw===undefined)return null;
  try{
   requireValue(raw!==null&&raw.version===1&&typeof raw.wire==='string'&&typeof raw.hash==='string'&&/^[a-f0-9]{64}$/.test(raw.hash)&&typeof raw.requestId==='string');
   const command=quoteWrite(JSON.parse(raw.wire));requireValue(command.clientId===clientId&&command.requestId===raw.requestId&&JSON.stringify(command)===raw.wire);
   return copy({command,requestId:command.requestId,wire:raw.wire,hash:raw.hash,phase:'uncertain',status:'unchecked'});
  }catch{return copy({command:null,requestId:null,wire:typeof raw?.wire==='string'?raw.wire:null,hash:typeof raw?.hash==='string'?raw.hash:null,phase:'uncertain',status:'unsupported'});}
 }
 const editCacheWire=(value:unknown)=>value===undefined?null:commerceCanonicalJson(value);
 function observeEditCache(value:unknown){try{expectedEditCache=editCacheWire(value);editCacheKnown=true;}catch{editCacheKnown=false;}}
 function replaceEditCache(value:unknown):boolean {
  if(!boundary||!editCacheKnown)return false;
  try{
   const next=value===undefined?undefined:copy(value),wire=editCacheWire(next);
   // Expected is this controller's last observed/written record, NOT whichever
   // newer record happens to be present when old cleanup starts.
   if(editCacheWire(boundary.memory.get(editKey))!==expectedEditCache)return false;
   if(next===undefined)boundary.memory.delete(editKey);else boundary.memory.set(editKey,next);
   expectedEditCache=wire;return true;
  }catch{return false;}
 }
 // A replacement may be constructed before old terminal cleanup retains its
 // final edit. Only an untouched same-draft/base context can adopt that handoff;
 // terminal cleanup never adopts and authored work never silently loses custody.
 function reconcileEditHandoff():boolean {
  const origin=state,read=readToken,write=writeToken,view=cookie._view;
  if(!alive()||!boundary||!editCacheKnown)return false;
  try{
   const raw=boundary.memory.get<{version?:unknown;selectedId?:unknown;preparation?:unknown;inputs?:unknown;base?:unknown}>(editKey),wire=editCacheWire(raw);
   if(wire===expectedEditCache)return true;
   if(editGeneration!==0||activeWrite||state.pending||state.choosingProduct!==null||state.choosingAddress)return false;
   let preparation:ProductQuotePreparation,inputs:ProductQuoteInputs,errors:ProductQuoteAdminState['inputErrors'],dirty:boolean;
   if(raw===undefined){preparation=state.loaded?preparationFromRead(state.loaded):newProductQuotePreparation();inputs=productQuoteInputs(preparation);errors={header:null,lines:{}};dirty=false;}
   else{
    requireValue(raw!==null&&raw.version===1&&raw.selectedId===selectedId&&raw.base===(state.loaded?fingerprint(state.loaded):editBase));
    preparation=readCommerceShape<ProductQuotePreparation>(raw.preparation,co({body:cDraftBody,lines:ca(cDraftLine,50)}));
    const parsed=parseProductQuoteInputs(preparation,raw.inputs===undefined?productQuoteInputs(preparation):readProductQuoteInputs(raw.inputs,preparation));
    preparation=parsed.preparation;inputs=parsed.inputs;errors=parsed.errors;dirty=true;
   }
   if(!alive()||state!==origin||readToken!==read||writeToken!==write||cookie._view!==view||editCacheWire(boundary.memory.get(editKey))!==wire)return false;
   observeEditCache(raw);
   return emit({preparation,inputs,inputErrors:errors,dirty,reviewed:false},{read,write,view})===true;
  }catch{return false;}
 }
 function blockLocalEdits(fence?:{read?:number;write?:number;view?:typeof cookie._view}){review=null;emit({localEditConflict:true,reviewed:false,error:409},fence);return false;}
 function rememberEdits(){if(alive())return replaceEditCache({version:1,selectedId,preparation:state.preparation,inputs:state.inputs,base:state.loaded?fingerprint(state.loaded):editBase});return false;}
 function forgetEdits(){return alive()?replaceEditCache(undefined):false;}
 function retire(){
  readToken++;writeToken++;pickerToken++;readAbort?.abort();activeWrite?.signal.abort();activeWrite=null;review=null;selectedId=null;
  const preparation=newProductQuotePreparation();state=copy({...state,phase:'ended',index:null,loaded:null,latest:null,preparation,inputs:productQuoteInputs(preparation),inputErrors:{header:null,lines:{}},dirty:false,reviewed:false,pending:null,receipt:null,error:401,localEditConflict:false,choosingProduct:null,choosingAddress:false});notify();
 }
 const stopBoundary=boundary?.subscribeInvalidation(retire)??(()=>{});
 const stopRuntime=runtime.subscribe(()=>{
  if(!alive()){retire();return;}
  if(cookie.status!=='ready'){review=null;pickerToken++;emit({phase:'offline',reviewed:false,choosingProduct:null,choosingAddress:false});}
 });
 if(alive()){
  state=copy({...state,pending:storedPending()});
  const saved=boundary!.memory.get<{version:number;selectedId:string|null;preparation:ProductQuotePreparation;inputs?:unknown;base:string|null}>(editKey);
  observeEditCache(saved);
  if(saved?.version===1)try{
   const preparation=readCommerceShape<ProductQuotePreparation>(saved.preparation,co({body:cDraftBody,lines:ca(cDraftLine,50)}));
   if(saved.selectedId!==null)readUuid(saved.selectedId);requireValue(saved.base===null||typeof saved.base==='string');
   const inputs=saved.inputs===undefined?productQuoteInputs(preparation):readProductQuoteInputs(saved.inputs,preparation),parsed=parseProductQuoteInputs(preparation,inputs);
   selectedId=saved.selectedId;editBase=saved.base;state=copy({...state,preparation:parsed.preparation,inputs:parsed.inputs,inputErrors:parsed.errors,dirty:true});
  }catch{/* Unsupported unsent form does not become a current server draft. */}
 }else retire();
 function fail(error:unknown){
  if(!alive())return;
  const status=(error as {status?:unknown}|null)?.status,safe=typeof status==='number'&&[400,401,403,404,409,413,415,429,503].includes(status)?status:503;
  review=null;
  if(safe===401||safe===403){
   pickerToken++;forgetEdits();const preparation=newProductQuotePreparation();emit({phase:safe===401?'ended':'denied',index:null,loaded:null,latest:null,preparation,inputs:productQuoteInputs(preparation),inputErrors:{header:null,lines:{}},dirty:false,reviewed:false,error:safe,localEditConflict:false,choosingProduct:null,choosingAddress:false});return;
  }
  emit({phase:safe===409?'conflict':cookie.status==='offline'?'offline':safe===503?'unavailable':'error',reviewed:false,error:safe});
 }
 function writeReady(){return ready()&&!state.localEditConflict&&!!request&&!activeWrite&&!state.pending&&state.phase==='ready'&&state.index!==null;}
 function cancelUnsent(){
  const op=activeWrite;if(!op||op.attempted)return;
  const prior=op.prior,write=++writeToken;activeWrite=null;op.signal.abort();
  if(!alive()||writeToken!==write)return;
  const pending=prior?(storedPending()??{...prior,phase:'uncertain' as const}):null;
  emit({pending},{write});
 }
 async function refresh(ack?:{command:AdminQuoteWrite;receipt:CommerceReceipt},claimed?:ReadClaim){
  const claim=claimed??claimRead();if(!claim||!request||!readCurrent(claim))return;
  if(!reconcileEditHandoff()&&readCurrent(claim))blockLocalEdits(claim);if(!readCurrent(claim))return;
  const previous=readAbort;readAbort=null;
  try{cancelUnsent();}finally{previous?.abort();}
  if(!readCurrent(claim))return;
  const abort=new AbortController(),operation={...claim,signal:abort.signal},token=claim.read;readAbort=abort;
  const current=()=>readCurrent(operation);
  review=null;pickerToken++;emitRead({phase:'loading',reviewed:false,error:state.localEditConflict?409:null,choosingProduct:null,choosingAddress:false},operation);
  if(!current())return;
  try{
   const index=await readAdminQuoteIndex(request,{actorId:owner!,clientId},{signal:abort.signal,isApplicable:current});if(!current())return;
   if(!selectedId){emitRead({index,loaded:null,latest:null,phase:index.entries.length||state.dirty?'ready':'empty'},operation);return;}
   const entity=index.entries.find(entry=>entry.entity.kind==='quote_draft'&&entry.entity.id===selectedId)?.entity;
   if(!entity){emitRead({index,phase:'conflict',latest:null,error:409},operation);return;}
   const loaded=await loadAdminQuoteDraft(request,{actorId:owner!,clientId},{entity,snapshot:index.snapshot},{signal:abort.signal,isApplicable:current});if(!current())return;
   const receipt=ack?.receipt??state.receipt;
   if(receipt&&((receipt.entity.kind==='quote_draft'&&receipt.entity.id===selectedId&&loaded.draft.target.revision<receipt.entity.revision)||(receipt.action==='issue_product_quote_v1'&&loaded.snapshot.paymentRevision<receipt.revision))){emitRead({index,latest:loaded,phase:'conflict',error:409},operation);return;}
   const canonical=preparationFromRead(loaded),base=state.loaded?fingerprint(state.loaded):editBase;
   let ownSave=false;
   if(ack&&ack.receipt.entity.kind==='quote_draft'&&ack.receipt.entity.id===selectedId&&loaded.draft.target.revision===ack.receipt.entity.revision){
    const saved=ack.command;
    if(saved.action==='save_product_quote_draft_v1')ownSave=same(loaded.draft.body,saved.body);
    else if(saved.action==='save_product_quote_line_v1'){const body=saved.body;ownSave=loaded.lines.some(line=>line.lineId===body.lineId&&same(line,body));}
   }
   if(state.dirty&&base!==null&&fingerprint(loaded)!==base&&!ownSave){emitRead({index,latest:loaded,phase:'conflict',error:409},operation);return;}
   const preparation=state.dirty?state.preparation:canonical,parsed=parseProductQuoteInputs(preparation,state.dirty?state.inputs:productQuoteInputs(canonical)),dirty=!same(parsed.preparation,canonical)||productQuoteHasInputErrors(parsed.errors);
   editBase=fingerprint(loaded);const published=emitRead({index,loaded,latest:null,preparation:parsed.preparation,inputs:parsed.inputs,inputErrors:parsed.errors,dirty,phase:'ready',reviewed:false,error:state.localEditConflict?409:null},operation);
   if(!published||!current())return;
   if(!(dirty?rememberEdits():forgetEdits())&&current()&&!reconcileEditHandoff()&&current())blockLocalEdits(operation);
  }catch(error){if(alive()&&token===readToken)fail(error);}
 }
 async function openDraft(id:string){
  if(!request||!state.index||state.dirty||activeWrite)return;
  const found=state.index.entries.some(entry=>entry.entity.kind==='quote_draft'&&entry.entity.id===id);if(!found)return;
  const claim=claimRead();if(!claim||!readCurrent(claim))return;
  selectedId=id;editBase=null;const preparation=newProductQuotePreparation();emitRead({loaded:null,latest:null,preparation,inputs:productQuoteInputs(preparation),inputErrors:{header:null,lines:{}},dirty:false},claim);await refresh(undefined,claim);
 }
 async function send(command:AdminQuoteWrite,retry=false){
  if(!ready()||!request||activeWrite||(!retry&&state.pending))return;
  const token=++writeToken,viewToken=readToken,view=cookie._view,preparation=state.preparation,loaded=state.loaded;
  const op={token,requestId:command.requestId,view:viewToken,attempted:false,signal:new AbortController(),prior:retry?state.pending:null};activeWrite=op;
  const owns=()=>alive()&&activeWrite===op&&writeToken===token;
  const applicable=()=>owns()&&ready()&&cookie._view===view&&!op.signal.signal.aborted&&(op.attempted||readToken===viewToken&&state.preparation===preparation&&state.loaded===loaded);
  let pending:ProductQuoteAdminPending=copy({command,requestId:command.requestId,wire:JSON.stringify(command),hash:null,phase:'sending',status:'unchecked'});
  emit({pending,reviewed:false,error:null});review=null;
  try{
   const hash=await hashCommerceCommand(command);if(!applicable())return;
   const original=retry?storedPending():null;
   if(retry&&(op.prior?.wire!==pending.wire||op.prior?.hash!==hash||(original!==null&&(!original.command||original.wire!==pending.wire||original.hash!==hash))))throw Error('unavailable');
   const saved=boundary!.memory.get<{requestId?:string;wire?:string;hash?:string}>(intentKey);
   if(saved&&(saved.requestId!==command.requestId||saved.wire!==pending.wire||saved.hash!==hash)){emit({pending:storedPending()});return;}
   pending=copy({...pending,hash});
   boundary!.memory.set(intentKey,{version:1,requestId:command.requestId,wire:pending.wire,hash});
   if(!applicable())return;
   // Custody is recorded before invoking the fixed port, without observers
   // between the final READY fence and invocation. Invocation may be uncertain.
   op.attempted=true;state=copy({...state,pending});
   const raw=await request.execute(command,{signal:op.signal.signal,isApplicable:applicable});if(!owns())return;
   if(!ready()||cookie._view!==view||op.signal.signal.aborted)throw Error('unavailable');
   const receipt=mapCommerceResult(command,raw,{actorId:owner!,requestHash:hash}) as CommerceReceipt;
   if(!owns()||!ready()||!forgetIntent(pending))return;
   emit({pending:null,receipt,reviewed:false,error:null});
   activeWrite=null;
   if(readToken===viewToken){if(command.action==='save_product_quote_draft_v1'&&selectedId===null)selectedId=receipt.entity.id;await refresh({command,receipt});}
  }catch(error){
   if(!owns())return;
   const status=(error as {status?:number}|null)?.status;
   if(!op.attempted){if(!op.prior)emit({pending:null});return;}
   const saved=boundary!.memory.get<{requestId?:string;wire?:string;hash?:string}>(intentKey);
   if(saved?.requestId!==pending.requestId||saved.wire!==pending.wire||saved.hash!==pending.hash)return;
   if(retry||status===401||status===403||status===503||status===undefined){emit({pending:{...pending,phase:'uncertain'},reviewed:false});if(status===401||status===403)fail(error);return;}
   if(forgetIntent(pending))emit({pending:null});fail(error);
  }finally{
   if(activeWrite===op){activeWrite=null;if(!op.attempted&&alive()){
    if(op.prior){if(state.pending?.requestId===op.requestId)emit({pending:storedPending()??{...op.prior,phase:'uncertain'}});}
    else{forgetIntent(pending);if(state.pending?.requestId===op.requestId)emit({pending:null});}
   }}
  }
 }
 async function recoverLocalEdits(){
  if(!ready()||!request||!state.localEditConflict||activeWrite||state.pending||state.choosingProduct!==null||state.choosingAddress)return false;
  const claim=claimRead();if(!claim||!readCurrent(claim))return false;
  try{
   const raw=boundary!.memory.get<{version?:unknown;selectedId?:unknown;preparation?:unknown;inputs?:unknown;base?:unknown}>(editKey),wire=editCacheWire(raw);
   if(raw===undefined){
    if(!readCurrent(claim)||boundary!.memory.get(editKey)!==undefined)return false;
    observeEditCache(raw);
    if(!emitRead({localEditConflict:false,error:null},claim)||!readCurrent(claim))return false;
    if(state.dirty&&!rememberEdits())return blockLocalEdits(claim);
    return readCurrent(claim);
   }
   requireValue(raw!==null&&raw.version===1&&(raw.selectedId===null||typeof raw.selectedId==='string')&&(raw.base===null||typeof raw.base==='string'));
   const selected=raw.selectedId===null?null:readUuid(raw.selectedId),base=raw.base as string|null;
   const preparation=readCommerceShape<ProductQuotePreparation>(raw.preparation,co({body:cDraftBody,lines:ca(cDraftLine,50)}));
   const parsed=parseProductQuoteInputs(preparation,raw.inputs===undefined?productQuoteInputs(preparation):readProductQuoteInputs(raw.inputs,preparation));
   if(!readCurrent(claim)||editCacheWire(boundary!.memory.get(editKey))!==wire)return false;
   // This deliberate local replacement observes the exact retained record.
   // It supplies no saved-draft/current-finance fact; refresh must read that.
   observeEditCache(raw);selectedId=selected;editBase=base;editGeneration=0;review=null;pickerToken++;
   if(!emitRead({localEditConflict:false,loaded:null,latest:null,preparation:parsed.preparation,inputs:parsed.inputs,inputErrors:parsed.errors,dirty:true,reviewed:false,phase:'loading',error:null,choosingProduct:null,choosingAddress:false},claim)||!readCurrent(claim))return false;
   await refresh(undefined,claim);
   return readCurrent(claim)&&!state.localEditConflict;
  }catch{if(readCurrent(claim))blockLocalEdits(claim);return false;}
 }
 async function checkStatus(){
  const pending=state.pending;if(!ready()||!request||activeWrite||!pending?.command||!pending.hash||!pending.requestId||!pending.wire)return;
  const token=++writeToken,view=cookie._view,selected=selectedId,preparation=state.preparation,inputs=state.inputs,loadedTarget=state.loaded?.draft.target??null,edit=editGeneration,controller=new AbortController();
  const current=()=>ready()&&writeToken===token&&cookie._view===view&&state.pending?.requestId===pending.requestId&&!controller.signal.aborted;
  try{
   const hash=await hashCommerceCommand(pending.command);if(!current()||hash!==pending.hash||JSON.stringify(pending.command)!==pending.wire)return;
   const command={schemaVersion:1,action:'request_status_v1',requestId:pending.requestId} as const;
   const raw=await request.execute(command,{signal:controller.signal,isApplicable:current});if(!current())return;
   const result=mapCommerceResult(command,raw,{actorId:owner!,requestHash:hash});requireValue('status'in result);
   if(result.status==='committed'){
    const receipt=mapCommerceResult(pending.command,result.receipt,{actorId:owner!,requestHash:hash}) as CommerceReceipt;requireValue(receipt.clientId===clientId);
    if(!current())return;
    // A read refresh may replace object identities without changing this
    // unsaved form. Real edits or a different selected draft are new context.
    const sameForm=(selection:string|null)=>selectedId===selection&&editGeneration===edit&&same(state.preparation,preparation)&&same(state.inputs,inputs)&&same(state.loaded?.draft.target??null,loadedTarget);
    let follow=sameForm(selected),acknowledgedSelection=selected;
    if(follow&&pending.command.action==='save_product_quote_draft_v1'&&pending.command.draftId===null&&selectedId===null){
     acknowledgedSelection=receipt.entity.id;selectedId=acknowledgedSelection;
     // Retain the known entity binding before dropping original uncertainty,
     // including when its later canonical read is unavailable or interrupted.
     rememberEdits();follow=sameForm(acknowledgedSelection);
    }
    if(!current()||!forgetIntent(pending))return;
    const reconciliationRead=readToken;
    // A recovered creation is not a fresh empty form. Close the write window
    // before observers run, then read the exact acknowledged draft canonically.
    emit({pending:null,receipt,reviewed:false,...(follow?{phase:'loading' as const}:{})},{write:token,view});
    if(follow&&ready()&&writeToken===token&&cookie._view===view&&readToken===reconciliationRead&&sameForm(acknowledgedSelection))await refresh({command:pending.command,receipt});
   }else emit({pending:{...pending,status:'absent',phase:'uncertain'}});
  }catch(error){if(!alive()||writeToken!==token)return;emit({pending:{...pending,status:'failed',phase:'uncertain'}});const status=(error as {status?:number}).status;if(status===401||status===403)fail(error);}
 }
 function mutateInputs(preparation:ProductQuotePreparation,inputs:ProductQuoteInputs){
  if(!writeReady())return false;const origin=state,fence={read:readToken,write:writeToken,view:cookie._view};if(!reconcileEditHandoff())return blockLocalEdits(fence);if(state!==origin)return false;const parsed=parseProductQuoteInputs(preparation,inputs);review=null;editGeneration++;
  emit({preparation:parsed.preparation,inputs:parsed.inputs,inputErrors:parsed.errors,dirty:!state.loaded||!same(parsed.preparation,preparationFromRead(state.loaded))||productQuoteHasInputErrors(parsed.errors),reviewed:false,error:null});const remembered=rememberEdits();if(!remembered)blockLocalEdits(fence);return remembered&&ready();
 }
 function mutate(preparation:ProductQuotePreparation){return mutateInputs(preparation,rebaseProductQuoteInputs(state.preparation,state.inputs,preparation));}
 return {
  clientId, getSnapshot:()=>state,subscribe(fn:()=>void){if(disposed)return()=>{};listeners.add(fn);return()=>listeners.delete(fn);},refresh:()=>refresh(),openDraft,checkStatus,recoverLocalEdits,
  newDraft(){if(!ready()||state.localEditConflict||!request||!state.index||state.phase==='loading'||state.pending||state.dirty||activeWrite)return false;selectedId=null;editBase=null;review=null;pickerToken++;const preparation=newProductQuotePreparation();emit({phase:'ready',loaded:null,latest:null,preparation,inputs:productQuoteInputs(preparation),inputErrors:{header:null,lines:{}},dirty:false,reviewed:false,error:null,choosingProduct:null,choosingAddress:false});return true;},
  setHeaderInputs(value:ProductQuoteHeaderInputs){try{const header=readProductQuoteHeaderInputs(value);return mutateInputs(state.preparation,{...state.inputs,header});}catch{return false;}},
  setLineInputs(id:string,value:ProductQuoteLineInputs){try{if(!state.preparation.lines.some(line=>line.lineId===id))return false;const line=readProductQuoteLineInputs(value);return mutateInputs(state.preparation,{...state.inputs,lines:{...state.inputs.lines,[id]:line}});}catch{return false;}},
  setBody(body:ProductQuoteDraftBody){try{const parsed=readCommerceShape<ProductQuoteDraftBody>(body,cDraftBody);requireValue(same(parsed.lineIds,state.preparation.body.lineIds));return mutate(copy({...state.preparation,body:parsed}));}catch{return false;}},
  addLine(){try{const id=crypto.randomUUID();return mutate(addProductQuoteLine(state.preparation,id))?id:null;}catch{return null;}},
  removeLine(id:string){
   if(!writeReady()||!state.preparation.lines.some(line=>line.lineId===id))return false;
   const preparation=state.preparation;pickerToken++;
   emit({choosingProduct:null,choosingAddress:false});
   if(!writeReady()||state.preparation!==preparation)return false;
   return mutate(copy({body:{...preparation.body,lineIds:preparation.body.lineIds.filter(line=>line!==id)},lines:preparation.lines.filter(line=>line.lineId!==id)}));
  },
  setLine(line:ProductQuoteLineDraft){try{return mutate(replaceProductQuoteLine(state.preparation,line));}catch{return false;}},
  async chooseProduct(id:string,picker?:ProductQuoteProductPicker){
   if(!writeReady()||!picker||!state.preparation.lines.some(line=>line.lineId===id))return false;
   const token=++pickerToken,read=readToken,write=writeToken,view=cookie._view,preparation=state.preparation,loaded=state.loaded,selected=selectedId;
   const current=()=>ready()&&pickerToken===token&&readToken===read&&writeToken===write&&cookie._view===view&&state.phase==='ready'&&!state.pending&&!activeWrite&&selectedId===selected&&state.preparation===preparation&&state.loaded===loaded;
   review=null;emit({choosingProduct:id,choosingAddress:false,reviewed:false});
   try{
    if(!current())return false;
    const value=await picker(id);if(!current()||value===null)return false;
    const option=readCommerceShape<ProductQuotePublishedOption>(value,co({selection:cSelection,identity:cIdentity}));
    if(!current())return false;
    const publication=option.selection.publication,existing=preparation.body.publication;
    if(existing.state==='known'&&!same(existing.value,publication))return false;
    if(preparation.lines.some(line=>line.lineId!==id&&line.selection.state==='known'&&!same(line.selection.value.publication,publication)))return false;
    const original=preparation.lines.find(line=>line.lineId===id)!;
    const replaced=replaceProductQuoteLine(preparation,{...original,selection:{state:'known',value:option.selection},identity:option.identity});
    if(!current())return false;
    const applied=mutate(copy({...replaced,body:{...replaced.body,publication:{state:'known',value:publication}}}));
    // Publishing local state invokes observers too. Success must still belong
    // to the same actual owner/READY/draft/line after those callbacks return.
    return applied&&ready()&&pickerToken===token&&readToken===read&&writeToken===write&&cookie._view===view&&selectedId===selected&&state.phase==='ready'&&state.preparation.lines.some(line=>line.lineId===id&&line.selection.state==='known'&&same(line.selection.value,option.selection)&&same(line.identity,option.identity));
   }catch{return false;}
   finally{if(alive()&&pickerToken===token)emit({choosingProduct:null,choosingAddress:false});}
  },
  async chooseShippingAddress(picker?:ProductQuoteAddressPicker){
   if(!writeReady()||!picker||!state.index)return false;
   const token=++pickerToken,read=readToken,write=writeToken,view=cookie._view,index=state.index,preparation=state.preparation,inputs=state.inputs,loaded=state.loaded,selected=selectedId,edit=editGeneration;
   // Index object, exact draft/CAS, raw edit generation and live owner are all
   // captured. A coincidentally equal payment revision is never sufficient.
   const current=()=>ready()&&pickerToken===token&&readToken===read&&writeToken===write&&cookie._view===view&&state.index===index&&state.phase==='ready'&&!state.pending&&!activeWrite&&selectedId===selected&&state.preparation===preparation&&state.inputs===inputs&&state.loaded===loaded&&editGeneration===edit;
   review=null;emit({choosingAddress:true,choosingProduct:null,reviewed:false});
   try{
    if(!current())return false;
    const value=await picker();if(!current()||value===null)return false;
    const chosen=readProductQuoteShippingView(value);
    if(!current()||chosen.clientId!==clientId||chosen.paymentRevision!==index.snapshot.paymentRevision||chosen.shippingAddress===null)return false;
    const version=chosen.shippingAddress.version;
    if(!current())return false;
    const applied=mutate(copy({...preparation,body:{...preparation.body,shippingAddressVersion:{state:'known',value:version}}}));
    return applied&&ready()&&pickerToken===token&&readToken===read&&writeToken===write&&cookie._view===view&&state.index===index&&state.loaded===loaded&&editGeneration===edit+1&&selectedId===selected&&state.phase==='ready'&&state.preparation.body.shippingAddressVersion.state==='known'&&state.preparation.body.shippingAddressVersion.value===version;
   }catch{return false;}
   finally{if(alive()&&pickerToken===token)emit({choosingAddress:false});}
  },
  async saveDraft(){if(!writeReady()||state.inputErrors.header!==null)return;try{await send(buildAdminQuoteDraftSave({clientId,requestId:crypto.randomUUID(),draft:state.loaded?.draft??null,body:state.preparation.body}));}catch{if(alive())emit({error:400});}},
  async saveLine(id:string){if(!writeReady()||!state.loaded||Object.hasOwn(state.inputErrors.lines,id))return;const line=state.preparation.lines.find(item=>item.lineId===id);if(!line)return;try{await send(buildAdminQuoteLineSave({clientId,requestId:crypto.randomUUID(),draft:state.loaded.draft,line}));}catch{if(alive())emit({error:400});}},
  reviewIssue(){
   if(!writeReady()||productQuoteHasInputErrors(state.inputErrors)||state.choosingProduct!==null||state.choosingAddress||!state.loaded||state.dirty||!state.loaded.options.some(option=>option.available))return false;
   try{review=buildAdminQuoteIssue({clientId,requestId:crypto.randomUUID(),draft:state.loaded.draft,snapshot:state.loaded.snapshot,lines:state.loaded.lines});emit({reviewed:true,error:null});return ready()&&review!==null&&state.reviewed;}catch{return false;}
  },
  async issueQuote(){if(!writeReady()||!review||!state.reviewed||!state.loaded||state.dirty)return;const command=review;try{const check=buildAdminQuoteIssue({clientId,requestId:command.requestId,draft:state.loaded.draft,snapshot:state.loaded.snapshot,lines:state.loaded.lines});if(!same(command,check))return;await send(command);}catch{if(alive())emit({error:400});}},
  openIssuedQuote(open?:(target:CommerceQuoteTarget)=>void){
   if(!ready()||!open||state.receipt?.action!=='issue_product_quote_v1'||!state.receipt.quote)return false;
   const receipt=state.receipt;
   try{
    const target=copy(readCommerceShape<CommerceQuoteTarget>(receipt.quote,cQuote));
    if(!ready()||state.receipt!==receipt)return false;
    open(target);return ready()&&state.receipt===receipt;
   }catch{return false;}
  },
  async retryOriginal(){const pending=state.pending;if(pending?.phase==='uncertain'&&pending.command)await send(pending.command,true);},
  discardLocal(){
   if(!writeReady())return false;reconcileEditHandoff();if(!writeReady())return false;
   const preparation=state.loaded?preparationFromRead(state.loaded):newProductQuotePreparation();
   review=null;pickerToken++;editGeneration++;forgetEdits();
   emit({preparation,inputs:productQuoteInputs(preparation),inputErrors:{header:null,lines:{}},dirty:false,reviewed:false,error:null,choosingProduct:null,choosingAddress:false});return ready();
  },
  useLatest(){if(!ready()||state.localEditConflict||state.pending||activeWrite||!state.latest)return false;const loaded=state.latest,preparation=preparationFromRead(loaded);review=null;editBase=fingerprint(loaded);forgetEdits();emit({loaded,latest:null,preparation,inputs:productQuoteInputs(preparation),inputErrors:{header:null,lines:{}},dirty:false,reviewed:false,phase:'ready',error:null});return true;},
  keepLocalWithLatest(){
   if(!ready()||state.localEditConflict||state.pending||activeWrite||!state.latest)return false;
   const loaded=state.latest,canonical=preparationFromRead(loaded),parsed=parseProductQuoteInputs(state.preparation,state.inputs);
   review=null;pickerToken++;editBase=fingerprint(loaded);
   emit({loaded,latest:null,preparation:parsed.preparation,inputs:parsed.inputs,inputErrors:parsed.errors,dirty:!same(parsed.preparation,canonical)||productQuoteHasInputErrors(parsed.errors),reviewed:false,phase:'ready',error:null,choosingProduct:null,choosingAddress:false});rememberEdits();return ready();
  },
  dispose(){
   if(disposed)return;
   const edits=state.dirty?copy({version:1,selectedId,preparation:state.preparation,inputs:state.inputs,base:state.loaded?fingerprint(state.loaded):editBase}):null;
   disposed=true;
   const abort=readAbort,op=activeWrite,observers=[...listeners];
   readToken++;writeToken++;pickerToken++;readAbort=null;activeWrite=null;review=null;selectedId=null;editBase=null;listeners.clear();
   const preparation=newProductQuotePreparation();state=copy({...state,phase:'ended',index:null,loaded:null,latest:null,preparation,inputs:productQuoteInputs(preparation),inputErrors:{header:null,lines:{}},dirty:false,reviewed:false,pending:null,receipt:null,localEditConflict:false,choosingProduct:null,choosingAddress:false});
   // State is already terminal before any callback-capable cleanup. Preserve
   // only this still-bound owner's unsent cache, without erasing a replacement
   // written during a relevance callback. Dispatched original custody stays.
   if(edits&&boundary)try{if(ownerCurrent())replaceEditCache(edits);}catch{/* Cache failure cannot reopen a terminal controller. */}
   for(const cleanup of [stopBoundary,stopRuntime,()=>abort?.abort(),()=>op?.signal.abort()])try{cleanup();}catch{/* Attempt every remaining cleanup. */}
   for(const fn of observers)try{fn();}catch{/* One observer cannot hide termination from others. */}
  },
 };
}
export type ProductQuoteAdminController=ReturnType<typeof createProductQuoteAdminController>;
