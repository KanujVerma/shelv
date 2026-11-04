import type {CommerceEntityRef,CommerceReceipt,Known} from '../../../../../src/contracts/PortalCommerce.ts';
import type {PlanSessionBoundary} from '../plan/types.ts';
import {hashCommerceCommand,readCommerceCommand} from '../../../../../src/contracts/PortalCommerceValidation.ts';
import {mapCommerceResult} from '../../../../../src/contracts/PortalCommerceMapping.ts';
import {readOrdersIndex,loadOrdersSelection} from './model.ts';
import {CommerceError} from './port.ts';
import {quoteWriteDependency,returnWriteDependency,hashRetainedCommerceCommand} from './dependencies.ts';
import type {CommercePort,OrdersMode,OrdersSelection,OrdersIndex,ClientCommerceWrite} from './types.ts';
export interface OrdersPending {command:ClientCommerceWrite;phase:'sending'|'uncertain';status:'unchecked'|'absent'|'failed'|'unsupported';dispatched?:boolean;rawWire?:string;commandHash?:string}
export interface OrdersState {
 phase:'initial'|'loading'|'ready'|'empty'|'unavailable'|'offline'|'error'|'denied'|'ended'|'conflict';
 index:OrdersIndex|null;selection:OrdersSelection|null;reviewed:boolean;
 pending:OrdersPending|null;notice:'acknowledged'|'uncertain'|'status-failed'|'review-required'|'intent-unavailable'|null;
 mode:OrdersMode;available:boolean;
}
export interface OrdersControllerOptions {port:CommercePort;session:PlanSessionBoundary;ownerId:string;mode:OrdersMode;contextKey:string}
export type OrdersController=ReturnType<typeof createOrdersController>;
/** One immutable owner/mode/context per controller. Replace+dispose on route
 * authority changes. Pending payload lives only in this session's memory. */
export function createOrdersController({port,session,ownerId,mode,contextKey}:OrdersControllerOptions){
 const listeners=new Set<()=>void>(),key=`orders-intent:${ownerId}`,boundaryKey=session.key,context=contextKey;
 const retained=session.memory?.get<OrdersPending>(key);
 let state:OrdersState={phase:'initial',index:null,selection:null,reviewed:false,pending:retained&&retained.dispatched!==false?{...retained,phase:'uncertain'}:null,notice:null,mode,available:port.availability==='available'},disposed=false,readToken=0,writeToken=0,readAbort:AbortController|null=null,selectedRef:CommerceEntityRef|null=null;
 let activeWrite:{token:number;requestId:string;dispatched:boolean}|null=null;
 const live=()=>{
  if(disposed||session.key!==boundaryKey||contextKey!==context)return false;
  const current=session.isCurrent();
  return current&&!disposed&&session.key===boundaryKey&&contextKey===context;
 };
 const matches=(token:number)=>live()&&token===readToken;
 const emit=(patch:Partial<OrdersState>)=>{if(!live())return;state={...state,...patch};listeners.forEach(fn=>fn());};
 function remember(pending:OrdersPending|null){if(!live())return;if(pending)session.memory?.set(key,structuredClone(pending));else session.memory?.delete(key);}
 function cancelUnsent(){
  const op=activeWrite;if(!op||op.dispatched)return;writeToken++;activeWrite=null;
  if(state.pending?.command.requestId===op.requestId)emit({pending:null,notice:null});
 }
 function retireView(phase:'ended'|'denied'){
  cancelUnsent();readToken++;readAbort?.abort();selectedRef=null;
  state={...state,phase,index:null,selection:null,reviewed:false,notice:state.pending?'uncertain':null};
  // A current failed READ retires projections, never the original write.
  listeners.forEach(fn=>fn());
 }
 const stop=session.subscribeInvalidation(()=>{
  readToken++;writeToken++;activeWrite=null;readAbort?.abort();selectedRef=null;session.memory?.delete(key);
  state={...state,phase:'ended',index:null,selection:null,reviewed:false,pending:null,notice:null};listeners.forEach(fn=>fn());
 });
 function begin(){
  if(!live())return null;
  cancelUnsent();if(!live())return null;
  readAbort?.abort();if(!live())return null;
  const abort=new AbortController();readAbort=abort;const token=++readToken;
  emit({phase:'loading',selection:null,reviewed:false,notice:null});
  if(!matches(token)||abort.signal.aborted)return null;
  return {token,signal:abort.signal};
 }
 function failure(error:unknown,token:number){if(!matches(token))return;const status=(error as {status?:number}).status;if(status===401||status===403){retireView(status===401?'ended':'denied');return;}emit({phase:status===409?'conflict':status===503?(port.availability==='unavailable'?'unavailable':'offline'):'error',selection:null,reviewed:false,notice:status===409?'review-required':null});}
 async function refresh(){
  const selected=selectedRef,operation=begin();if(!operation)return;const {token,signal}=operation;
  try{
   let index=await readOrdersIndex(port,ownerId,null,null,signal);if(!matches(token))return;
   // A selected order may be beyond the first index page. Find its current exact
   // revision before refresh; do not reuse the prior snapshot/terms.
   if(selected){const seen=new Set<string>();while(!index.entries.some(e=>e.entity.kind===selected.kind&&e.entity.id===selected.id)&&index.nextCursor){if(seen.has(index.nextCursor))throw new CommerceError(503);seen.add(index.nextCursor);const page=await readOrdersIndex(port,ownerId,index.snapshot,index.nextCursor,signal);if(!matches(token))return;index={...page,entries:[...index.entries,...page.entries]};}}
   emit({index,phase:index.entries.length||index.nextCursor?'ready':'empty'});
   if(!matches(token)||signal.aborted)return;
   if(selected){const ref=index.entries.find(e=>e.entity.kind===selected.kind&&e.entity.id===selected.id)?.entity;if(ref){const selection=await loadOrdersSelection(port,ref,index.snapshot,ownerId,signal);if(!matches(token))return;emit({selection,phase:'ready',reviewed:false});}}
  }catch(error){failure(error,token);}
 }
 async function loadMore(){
  const prior=state.index;if(!prior?.nextCursor)return;
  const operation=begin();if(!operation)return;const {token,signal}=operation;
  try{const page=await readOrdersIndex(port,ownerId,prior.snapshot,prior.nextCursor,signal);if(!matches(token))return;const keys=new Set(prior.entries.map(e=>e.entity.kind+':'+e.entity.id));if(page.entries.some(e=>keys.has(e.entity.kind+':'+e.entity.id)))throw new CommerceError(503);emit({index:{...page,entries:[...prior.entries,...page.entries]},phase:'ready'});}catch(error){failure(error,token);}
 }
 async function open(entity:CommerceEntityRef){
  const index=state.index;if(!index||!index.entries.some(e=>e.entity.kind===entity.kind&&e.entity.id===entity.id&&e.entity.revision===entity.revision))return;
  selectedRef=structuredClone(entity);const operation=begin();if(!operation)return;const {token,signal}=operation;
  try{const selection=await loadOrdersSelection(port,entity,index.snapshot,ownerId,signal);if(!matches(token))return;emit({selection,phase:'ready'});}catch(error){failure(error,token);}
 }
 async function openOriginalQuote(){
  const prior=state.selection;if(!live()||prior?.detail.kind!=='purchase')return;
  const expected=prior.detail.quote,ref:CommerceEntityRef={kind:'quote',id:expected.quoteId,revision:expected.quoteVersion};
  selectedRef=ref;const operation=begin();if(!operation)return;const {token,signal}=operation;
  try{
   const selection=await loadOrdersSelection(port,ref,prior.snapshot,ownerId,signal);if(!matches(token))return;
   const target=selection.quote?.header.target;
   if(!target||target.termsHash!==expected.termsHash||target.quoteId!==expected.quoteId||target.quoteVersion!==expected.quoteVersion)throw new CommerceError(503);
   emit({selection,phase:'ready',reviewed:false});
  }catch(error){failure(error,token);}
 }
 function reviewQuote(){if(!live()||state.phase!=='ready'||!state.selection?.quote?.verified||state.pending)return;emit({reviewed:true,notice:null});}
 async function send(command:ClientCommerceWrite,retry=false){
  if(!live()||mode==='historical'||port.availability!=='available'||(!retry&&state.pending))return;
  const prior=retry?state.pending:null;
  let parsed:ClientCommerceWrite;
  try{parsed=readCommerceCommand(structuredClone(command)) as ClientCommerceWrite;}catch{if(prior){const pending={...prior,status:'unsupported' as const};remember(pending);emit({pending,notice:'intent-unavailable'});}return;}
  const token=++writeToken,viewToken=readToken,selection=state.selection,reviewed=state.reviewed;
  const op={token,requestId:parsed.requestId,dispatched:retry};activeWrite=op;
  const owns=()=>live()&&activeWrite===op&&token===writeToken;
  const applicable=()=>owns()&&(op.dispatched||viewToken===readToken&&state.selection===selection&&state.reviewed===reviewed&&state.phase==='ready');
  let pending:OrdersPending={...prior,command:parsed,phase:'sending',status:'unchecked',dispatched:retry,rawWire:prior?.rawWire??JSON.stringify(parsed)};
  emit({pending,notice:null});
  try{
   const hash=await hashCommerceCommand(parsed);if(!applicable())return;
   if(prior?.commandHash&&prior.commandHash!==hash)throw new CommerceError(503);
   pending={...pending,commandHash:hash};
   const raw=await port.execute(parsed,{basis:retry?undefined:selection??undefined,isApplicable:applicable,onDispatch(){
    // Atomic local handoff to the fixed request. No subscriber callback runs
    // between this custody record and raw request invocation.
    op.dispatched=true;pending={...pending,dispatched:true};remember(pending);
    if(owns())state={...state,pending};
   }});if(!owns())return;
   mapCommerceResult(parsed,raw,{actorId:ownerId,requestHash:hash});
   if(!owns())return;remember(null);emit({pending:null,notice:'acknowledged',reviewed:false});
   if(viewToken===readToken&&state.phase==='ready')await refresh();
  }catch(error){
   if(!owns())return;
   const e=error as {status?:number;uncertain?:boolean;dispatched?:boolean};
   if(!op.dispatched){emit({pending:null,notice:null});return;}
   if(retry||e.uncertain===true||e.dispatched!==false&&(!e.status||e.status===503)){
    const uncertain={...pending,phase:'uncertain' as const};remember(uncertain);emit({pending:uncertain,reviewed:false,notice:'uncertain'});
    if((e.status===401||e.status===403)&&viewToken===readToken)retireView(e.status===401?'ended':'denied');
    return;
   }
   remember(null);emit({pending:null,reviewed:false,notice:null});
   if((e.status===401||e.status===403)&&viewToken===readToken){retireView(e.status===401?'ended':'denied');return;}
   if(e.status===409){emit({notice:'review-required',...(viewToken===readToken?{phase:'conflict' as const,selection:null}:{})});return;}
   if(viewToken===readToken)failure(error,viewToken);
  }finally{
   if(activeWrite===op){activeWrite=null;if(!op.dispatched&&live()&&state.pending?.command.requestId===op.requestId)emit({pending:null,notice:null});}
  }
 }
 async function checkStatus(){
  const pending=state.pending;if(!live()||pending?.phase!=='uncertain')return;
  const token=++writeToken,viewToken=readToken,command=pending.command;
  const applicable=()=>live()&&token===writeToken&&state.pending?.command.requestId===command.requestId;
  try{
   const hash=await hashRetainedCommerceCommand(command);if(!applicable())return;
   if(pending.commandHash&&pending.commandHash!==hash)throw new CommerceError(503);
   const raw=await port.execute({schemaVersion:1,action:'request_status_v1',requestId:command.requestId},{statusIntent:command});if(!applicable())return;
   const result=mapCommerceResult({schemaVersion:1,action:'request_status_v1',requestId:command.requestId},raw,{actorId:ownerId,requestHash:hash});
   if(!('status'in result))throw new CommerceError(503);
   if(result.status==='committed'){
    mapCommerceResult(command,result.receipt,{actorId:ownerId,requestHash:hash});
    remember(null);emit({pending:null,reviewed:false,notice:'acknowledged'});if(viewToken===readToken&&state.phase==='ready')await refresh();
   }else{const next={...pending,status:'absent' as const};remember(next);emit({pending:next,notice:'uncertain'});}
  }catch(error){if(!applicable())return;const status=(error as {status?:number}).status;const next={...pending,status:'failed' as const};remember(next);emit({pending:next,notice:'status-failed'});if((status===401||status===403)&&viewToken===readToken)retireView(status===401?'ended':'denied');}
 }
 const mutationReady=()=>live()&&state.phase==='ready'&&mode!=='historical'&&!state.pending;
 return {
  getSnapshot:()=>state,subscribe(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn);},refresh,loadMore,open,openOriginalQuote,reviewQuote,checkStatus,
  async retryIntent(){const p=state.pending;if(p?.phase==='uncertain')await send(p.command,true);},
  async acceptQuote(){const q=state.selection?.quote;if(!quoteWriteDependency(q).available)return;if(!mutationReady()||!state.reviewed||!q||q.header.status!=='payable'||q.header.acceptance)return;await send({schemaVersion:1,action:'accept_product_quote_v1',requestId:crypto.randomUUID(),quote:q.header.target});},
  async claimPayment(optionId:string){const s=state.selection,q=s?.quote,dependency=quoteWriteDependency(q);if(!dependency.available)return;if(!mutationReady()||!state.reviewed||!q||!q.header.canPay||!q.header.acceptance||!q.options.some(o=>o.id===optionId&&o.available))return;const h=q.header;await send({schemaVersion:1,action:'submit_payment_claim_v1',requestId:crypto.randomUUID(),quote:h.target,expectedPaymentRevision:s!.snapshot.paymentRevision,payment:{currency:dependency.currency,quoteId:h.target.quoteId,quoteVersion:h.target.quoteVersion,shippingAddressVersion:h.address.version,serviceCents:h.serviceCents,productCents:h.productSubtotalCents+h.tax.cents+h.shipping.cents,totalCents:h.totalCents,paymentOptionId:optionId},evidenceId:null});},
  async reportReceived(occurredOn:Known<string>){const d=state.selection?.detail;if(!mutationReady()||d?.kind!=='purchase')return;await send({schemaVersion:1,action:'confirm_product_received_v1',requestId:crypto.randomUUID(),purchaseId:d.id,expectedFulfillmentRevision:d.fulfillmentRevision,occurredOn});},
  async requestReturn(input:{quantity:number;reason:string;condition:'unopened'|'opened'|'used'|'damaged'}){
   const selection=state.selection,d=selection?.detail,dependency=returnWriteDependency(selection);
   if(!mutationReady()||d?.kind!=='purchase'||!dependency.available||input.quantity>d.quantity)return;
   await send({schemaVersion:1,action:'request_product_return_v1',requestId:crypto.randomUUID(),purchaseId:d.id,expectedReturnRevision:dependency.expectedReturnRevision,...input});
  },
  close(){if(!live())return;cancelUnsent();selectedRef=null;readToken++;readAbort?.abort();emit({selection:null,reviewed:false,phase:state.index?'ready':'initial'});},
  dispose(){if(disposed)return;cancelUnsent();activeWrite=null;readToken++;writeToken++;readAbort?.abort();stop();disposed=true;selectedRef=null;state={...state,index:null,selection:null,pending:null,reviewed:false,phase:'ended',notice:null};listeners.forEach(fn=>fn());listeners.clear();},
 };
}
