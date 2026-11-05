import type {ApplicationSession} from '../../../app/session.ts';
import {createAccountAddressRequest} from '../../../app/account-address-request.ts';
import {addressCommand,addressErrors,emptyAddress,freeze,projectAccountPayment} from './model.ts';
import type {AccountData,ShippingAddress} from './model.ts';
export type AccountPhase='idle'|'loading'|'ready'|'editing'|'confirming'|'saving'|'saved'|'uncertain'|'conflict'|'error'|'denied'|'ended';
export type AddressIntent={command:ReturnType<typeof addressCommand>;base:AccountData['shippingAddress'];baseRevision:number};
export type AccountSnapshot={phase:AccountPhase;data:AccountData|null;draft:ShippingAddress|null;errors:Partial<Record<keyof ShippingAddress,string>>;pending:AddressIntent|null;canReapply:boolean;message:string|null};
const initial=():AccountSnapshot=>({phase:'idle',data:null,draft:null,errors:{},pending:null,canReapply:false,message:null});
/** Address administration only. The route predicate can only deny relevance;
 * runtime/cookie/Root operations establish identity and validate every result. */
export function createAccountAddressController(runtime:ApplicationSession,options:{isApplicable?:()=>boolean}={}){
 const request=createAccountAddressRequest(runtime),boundary=runtime.getSnapshot().boundary,owner=runtime.cookie.identity!.ownerId;
 const route=options.isApplicable,listeners=new Set<()=>void>();let state=freeze(initial()),disposed=false;
 let operation:{abort:AbortController}|null=null;
 let unsubscribe=()=>{};
 function live(){
  if(disposed||!request.isCurrent())return false;
  let applies=true;try{if(route)applies=route()===true;}catch{applies=false;}
  return applies&&!disposed&&request.isCurrent();
 }
 function emit(published=state){
  for(const fn of [...listeners]){
   if(state!==published)break;
   if(!listeners.has(fn))continue;
   // Observers cannot become operation errors or skip another observer.
   try{fn();}catch{}
  }
 }
 function retire(phase:'ended'|'denied'='ended'){
  if(disposed)return;
  const old=operation,remove=unsubscribe;
  disposed=true;operation=null;unsubscribe=()=>{};
  // Publish the terminal private projection before ANY synchronous effect.
  state=freeze({...initial(),phase});
  try{old?.abort.abort();}catch{}
  try{remove();}catch{}
  emit();listeners.clear();
 }
 function current(){if(live())return true;retire();return false;}
 function update(value:AccountSnapshot,expected=state){
  if(!current()||state!==expected)return false;
  const published=freeze(value);state=published;emit(published);
  return current()&&state===published;
 }
 // Existing local cancelled-state denial only, separate from server permission.
 // Exact retry of an already-dispatched uncertain command is not a new intent.
 const addressUnavailable='shipping address changes are unavailable for cancelled service.';
 const newAddressAllowed=(data:AccountData|null)=>data!==null&&data.service.status!=='cancelled';
 function canStartAddress(){
  if(newAddressAllowed(state.data))return true;
  if(state.data?.service.status==='cancelled'&&(state.canReapply||state.message!==addressUnavailable))update({...state,canReapply:false,message:addressUnavailable});
  return false;
 }
 function owns(op:NonNullable<typeof operation>){return current()&&operation===op;}
 function begin(){const prior=operation;const next={abort:new AbortController()};operation=next;try{prior?.abort.abort();}catch{}return next;}
 const unBoundary=boundary!.subscribeInvalidation(()=>retire());const unSession=runtime.subscribe(()=>{if(!live())retire();});unsubscribe=()=>{try{unBoundary();}finally{unSession();}};
 function getSnapshot(){current();return state;}
 async function load(){
  if(!current()||['saving','confirming','editing','uncertain'].includes(state.phase))return;
  const before=state,pending=before.pending,op=begin();if(!owns(op)||state!==before)return;
  if(!update({...before,phase:'loading',message:null},before)||!owns(op))return;
  const opts={signal:op.abort.signal,isApplicable:()=>owns(op)};
  const unavailable=()=>{
   if(!owns(op))return;
   // Custody of the original work is distinct from fresh read/write readiness.
   update({...before,phase:pending?'conflict':'error',canReapply:false,message:'account details are unavailable. try loading again.'});
  };
  try{
   if(runtime.cookie.status==='offline'){await runtime.restore();if(!owns(op))return;}
   const read=async<T>(run:()=>Promise<T>)=>{try{return await run();}catch(error){if(owns(op)){const status=(error as {status?:number})?.status;if(status===401||status===403)retire(status===403?'denied':'ended');}throw error;}};
   // Account address administration does not acquire care/service advice.
   // Its own payment operation still enforces the actual server permission.
   const payments=await read(()=>request.readPayments(opts));
   if(!owns(op))return;
   if(runtime.cookie.status!=='ready'){unavailable();return;}
   const data=projectAccountPayment(payments);
   update({...state,data,phase:pending?'conflict':'ready',canReapply:pending!==null&&newAddressAllowed(data),message:pending&&!newAddressAllowed(data)?addressUnavailable:null});
  }catch{unavailable();}
  finally{if(operation===op)operation=null;}
 }
 function editAddress(){if(!current()||!['ready','saved'].includes(state.phase)||!canStartAddress())return;update({...state,phase:'editing',draft:{...(state.data!.shippingAddress?.address??emptyAddress())},pending:null,errors:{},message:null,canReapply:false});}
 function setField(key:keyof ShippingAddress,value:string){if(!current()||state.phase!=='editing'||!state.draft||typeof key!=='string'||!Object.hasOwn(emptyAddress(),key)||typeof value!=='string'||!canStartAddress())return;update({...state,draft:{...state.draft,[key]:value},errors:{...state.errors,[key]:undefined}});}
 function reviewAddress(){
  if(!current()||state.phase!=='editing'||!state.draft||!state.data||!canStartAddress())return;
  const errors=addressErrors(state.draft);if(Object.keys(errors).length){update({...state,errors});return;}
  const before=state,draft=state.draft,data=state.data;let command:ReturnType<typeof addressCommand>;
  try{command=addressCommand(draft,crypto.randomUUID(),data.revision,owner);}
  catch{update({...before,message:'check the address fields before continuing.'},before);return;}
  update({...before,phase:'confirming',draft:command.address,pending:{command,base:data.shippingAddress,baseRevision:data.revision},errors:{},message:null},before);
 }
 function backToEdit(){if(!current()||state.phase!=='confirming'||!canStartAddress())return;update({...state,phase:'editing',pending:null});}
 function discardEdit(){if(!current()||!['editing','confirming','conflict'].includes(state.phase))return;update({...state,phase:state.data?'ready':'idle',draft:null,pending:null,errors:{},canReapply:false,message:null});}
 async function save(retry:boolean){
  if(!current()||state.phase!==(retry?'uncertain':'confirming')||!state.pending||(!retry&&!canStartAddress()))return;
  const before=state,pending=state.pending,op=begin();if(!owns(op)||state!==before)return;
  if(!update({...before,phase:'saving',message:null},before)||!owns(op))return;
  const applicable=()=>owns(op)&&state.pending===pending&&(retry||newAddressAllowed(state.data));
  try{
   if(retry&&runtime.cookie.status==='offline'){await runtime.restore();if(!owns(op))return;}
   const receipt=await request.confirmAddress(pending.command,{signal:op.abort.signal,isApplicable:applicable});if(!owns(op)||state.pending!==pending)return;
   if(receipt.addressVersion!==(pending.base?.version??0)+1)throw Error('unavailable');
   const entry={version:receipt.addressVersion,address:pending.command.address};const prior=state.data!;
   update({...state,phase:'saved',data:{...prior,revision:receipt.revision,shippingAddress:entry,shippingAddresses:[...prior.shippingAddresses,entry]},draft:null,pending:null,canReapply:false,message:'shipping address confirmed'});
  }catch(error){
   if(!owns(op)||state.pending!==pending)return;
   const status=(error as {status?:number})?.status;
   if(status===401||status===403){retire(status===403?'denied':'ended');return;}
   update({...state,phase:status===409?'conflict':'uncertain',canReapply:false,message:status===409?'the address changed. load the latest address, then choose whether to reapply your changes.':'the result is uncertain. retry only this original confirmation.'});
  }finally{if(operation===op)operation=null;}
 }
 function reapplyAddress(){
  if(!current()||state.phase!=='conflict'||!state.canReapply||!state.pending||!state.data||!canStartAddress())return false;
  const draft={...state.pending.command.address};return update({...state,phase:'editing',draft,pending:null,errors:{},canReapply:false,message:null});
 }
 return {getSnapshot,subscribe(fn:()=>void){if(disposed)return()=>{};listeners.add(fn);return()=>{listeners.delete(fn);};},load,editAddress,setField,reviewAddress,backToEdit,discardEdit,confirmAddress:()=>save(false),retryOriginal:()=>save(true),reapplyAddress,dispose(){retire();}};
}
export type AccountAddressController=ReturnType<typeof createAccountAddressController>;
