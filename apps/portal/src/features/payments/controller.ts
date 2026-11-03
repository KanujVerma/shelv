import {buildPaymentCallV2,mapPaymentReceiptV2,mapPaymentViewV2} from '../../../../../supabase/functions/concierge-payments/methods.ts';
import {TransportError} from '../../transport/session.ts';
import {firstServiceQuotes,immutable} from './model.ts';
import type {ClientPaymentClaim,ClientPaymentPorts,ClientPaymentSnapshot,ClientPaymentsController,ClientPaymentsRuntime} from './types.ts';

const memoryKey='w5:first-service-payment:uncertain';
const initial=():ClientPaymentSnapshot=>Object.freeze({phase:'idle',view:null,pending:null,receipt:null,outcome:'none',error:null});

/** A controller belongs to one actual ApplicationSession boundary. Construction
 * is inert. Disposal cancels its work; uncertain intent stays in session memory
 * for deliberate recovery after remount and is cleared by the real session. */
export function createClientPaymentsController(runtime:ClientPaymentsRuntime,ports:ClientPaymentPorts):ClientPaymentsController {
  const boundary=runtime.getSnapshot().boundary,cookie=runtime.cookie;
  const owner=cookie.identity?.ownerId,generation=cookie.generation,epoch=cookie._epoch,
    serverGeneration=cookie._view?.generation,csrf=cookie._view?.csrf;
  const listeners=new Set<()=>void>();
  let state=initial(),disposed=false,checking=false,notifying=false,sequence=0;
  let active:AbortController|null=null;
  const cleanups:(()=>void)[]=[];
  function safe(fn:()=>void){try{fn();}catch{/* Complete retirement despite an observer. */}}
  function notify(){
    if(notifying)return;
    notifying=true;
    try{let before;do{before=state;for(const fn of [...listeners]){
      if(state!==before||disposed)break;if(listeners.has(fn))safe(fn);
    }}while(before!==state&&!disposed);}finally{notifying=false;}
  }
  function update(patch:Partial<ClientPaymentSnapshot>){state=Object.freeze({...state,...patch});notify();}
  function end(){
    if(state.phase==='ended')return;
    const old=active;active=null;sequence++;state=Object.freeze({...initial(),phase:'ended'});
    safe(()=>old?.abort());notify();
  }
  function same(){return !disposed&&!!boundary&&runtime.getSnapshot().boundary===boundary&&
    cookie.audience==='client'&&cookie.identity?.role==='client'&&cookie.identity.ownerId===owner&&
    cookie.generation===generation&&cookie._epoch===epoch&&cookie._view?.generation===serverGeneration&&cookie._view?.csrf===csrf;}
  function current(){
    if(checking||disposed||state.phase==='ended')return false;
    if(!same()){end();return false;}
    checking=true;let valid=false;try{valid=boundary!.isCurrent();}finally{checking=false;}
    if(!valid||!same()){end();return false;}
    return true;
  }
  function ready(){return current()&&cookie.status==='ready'&&cookie._view?.capabilities.view===true;}
  function reconcile(){
    if(checking||!current())return;
    if(cookie._view?.capabilities.view!==true){if(state.phase!=='denied'||state.view)update({phase:'denied',view:null,receipt:null,error:403});}
    else if(cookie.status!=='ready'&&state.phase!=='unavailable')update({phase:'unavailable',view:null,receipt:null,error:503});
  }
  function own(id:number,abort:AbortController){return current()&&sequence===id&&active===abort&&!abort.signal.aborted;}
  function remember(command:ClientPaymentClaim|null,expected?:ClientPaymentClaim){
    if(!current())return false;
    const stored=boundary!.memory.get<ClientPaymentClaim>(memoryKey),basis=command??expected;
    const matches=!!stored&&!!basis&&JSON.stringify(stored)===JSON.stringify(basis);
    if(!current())return false;
    if(command){
      if(stored&&!matches)return false;
      boundary!.memory.set(memoryKey,command);
    }else if(matches)boundary!.memory.delete(memoryKey);
    return current();
  }
  function failure(error:unknown,write:boolean,command?:ClientPaymentClaim){
    if(!current())return;
    const raw=error instanceof TransportError?error.status:503;
    const status=[400,401,403,404,409,413,415,429,503].includes(raw)?raw:503;
    if(status===401){end();return;}
    const uncertain=write&&status===503;
    // A received write rejection is definite. A denied read cannot resolve an
    // earlier dispatched uncertain write or discard its original command.
    if(write&&!uncertain){if(!remember(null,command))return;}
    update({phase:status===403?'denied':'unavailable',view:null,receipt:null,error:status,
      ...(write?{pending:uncertain?state.pending:null,outcome:uncertain?'uncertain':'rejected'}:{})});
  }
  async function load(){
    if(notifying||!current()||active)return;
    if(!ready()){reconcile();return;}
    const abort=new AbortController(),id=++sequence;active=abort;
    update({phase:'loading',view:null,receipt:null,error:null});
    try{
      if(!own(id,abort)||!ready())return;
      const raw=await ports.read.execute({schemaVersion:2,action:'client_read'},{signal:abort.signal,isApplicable:()=>own(id,abort)&&ready()});
      if(!own(id,abort)||!ready())return;
      const view=immutable(mapPaymentViewV2(raw));
      if(!own(id,abort)||!ready())return;
      active=null;update({phase:'ready',view,error:null,outcome:state.pending?'uncertain':'none'});reconcile();
    }catch(error){if(own(id,abort)){active=null;failure(error,false);}}
    finally{if(active===abort){active=null;if(current())reconcile();}}
  }
  async function submit(command:ClientPaymentClaim){
    if(active||!ready())return;
    const abort=new AbortController(),id=++sequence;active=abort;
    // Capture before observer callbacks and before the first possible egress.
    if(!remember(command)){active=null;return;}
    update({phase:'submitting',pending:command,receipt:null,outcome:'uncertain',error:null});
    try{
      if(!own(id,abort)||!ready())return;
      const raw=await ports.claim.execute(command,{signal:abort.signal,isApplicable:()=>own(id,abort)&&ready()});
      if(!own(id,abort)||!ready())return;
      const call=buildPaymentCallV2(command,owner!),receipt=immutable(mapPaymentReceiptV2(raw,call));
      if(!('quoteId' in receipt)||receipt.operation!=='submit_claim')throw new TransportError(503,'write');
      if(!own(id,abort)||!ready()||state.pending!==command)return;
      if(!remember(null,command)||!own(id,abort))return;
      active=null;update({phase:'ready',pending:null,receipt,outcome:'submitted_unverified',error:null});reconcile();
    }catch(error){if(own(id,abort)){active=null;failure(error,true,command);}}
    finally{if(active===abort){active=null;if(current()){reconcile();if(state.phase==='submitting')update({phase:'unavailable',view:null,error:503,outcome:'uncertain'});}}}
  }
  const stop=runtime.subscribe(reconcile);cleanups.push(stop);
  if(boundary)cleanups.push(boundary.subscribeInvalidation(reconcile));
  if(current()){
    const stored=boundary!.memory.get<ClientPaymentClaim>(memoryKey);
    if(stored){try{buildPaymentCallV2(stored,owner!);state=Object.freeze({...state,pending:immutable(structuredClone(stored)),outcome:'uncertain'});}catch{safe(()=>boundary!.memory.delete(memoryKey));}}
  }
  return {
    getSnapshot(){if(checking)return Object.freeze({...initial(),phase:'unavailable'});reconcile();return state;},
    subscribe(fn){if(disposed)return()=>{};listeners.add(fn);return()=>{listeners.delete(fn);};},load,
    async claim(rendered,quoteId,optionId,confirmed){
      if(notifying||rendered!==state||!confirmed||!ready()||state.phase!=='ready'||state.pending||!state.view||active)return;
      const existing=boundary!.memory.get<ClientPaymentClaim>(memoryKey);
      if(!current()||rendered!==state)return;
      if(existing){
        try{buildPaymentCallV2(existing,owner!);const pending=immutable(structuredClone(existing));if(current()&&rendered===state)update({pending,outcome:'uncertain'});}catch{/* Unrecognized custody never authorizes a replacement. */}
        return;
      }
      const quote=firstServiceQuotes(state.view).find(q=>q.id===quoteId),option=quote?.paymentOptions.find(o=>o.id===optionId&&o.available);
      if(!quote||!option||state.receipt?.quoteId===quote.id)return;
      const command:ClientPaymentClaim=Object.freeze({schemaVersion:2,action:'submit_claim',requestId:crypto.randomUUID(),expectedRevision:state.view.revision,
        quoteId:quote.id,quoteVersion:quote.version,paymentOptionId:option.id,serviceCents:quote.serviceCents,productCents:0,totalCents:quote.totalCents,shippingAddressVersion:null,evidenceId:null});
      buildPaymentCallV2(command,owner!);
      if(rendered!==state||!ready())return;
      await submit(command);
    },
    async retry(rendered){if(notifying||rendered!==state||!ready()||state.phase!=='ready'||!state.pending||active)return;await submit(state.pending);},
    dispose(){if(disposed)return;disposed=true;sequence++;const old=active;active=null;state=Object.freeze({...initial(),phase:'ended'});listeners.clear();safe(()=>old?.abort());for(const stop of cleanups.splice(0))safe(stop);},
  };
}
