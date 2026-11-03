import {readCommerceCommand,hashCommerceCommand,commerceCanonicalJson} from '../../../../../src/contracts/PortalCommerceValidation.ts';
import {mapCommerceResult} from '../../../../../src/contracts/PortalCommerceMapping.ts';
import {checkCommerceWriteBasis,hashRetainedCommerceCommand} from './dependencies.ts';
import {isCommerceRead} from '../../../../../src/contracts/PortalCommerceValues.ts';
import type {CommerceRuntime,CommercePort,FutureCommerceRequest,ClientCommerceCommand} from './types.ts';
const allowed:ReadonlySet<string>=new Set(['read_commerce_v1','read_commerce_detail_v1','read_quote_components_v1','read_commerce_history_v1','request_status_v1','accept_product_quote_v1','submit_payment_claim_v1','confirm_product_received_v1','request_product_return_v1']);
export class CommerceError extends Error {
 readonly status:number;readonly dispatched:boolean;readonly uncertain:boolean;
 constructor(status:number,dispatched=false,uncertain=false){super(status===401?'session ended':status===403?'access denied':status===409?'review current terms':'commerce unavailable');this.status=status;this.dispatched=dispatched;this.uncertain=uncertain;}
}
/** Captured at creation, never rebound to a replacement session. No fetch or
 * Plan/Care/Review channel fallback. Raw data is mapped after every await fence. */
export function createCommercePort(runtime:CommerceRuntime,request?:FutureCommerceRequest):CommercePort {
 const boundary=runtime.getSnapshot().boundary,owner=runtime.cookie.identity?.ownerId,generation=runtime.cookie.generation,epoch=runtime.cookie._epoch;
 function current(){if(!boundary||!boundary.isCurrent()||runtime.getSnapshot().boundary!==boundary||runtime.cookie.audience!=='client'||runtime.cookie.identity?.role!=='client'||runtime.cookie.identity.ownerId!==owner||runtime.cookie.generation!==generation||runtime.cookie._epoch!==epoch)throw new CommerceError(401);}
 current();
 return {availability:request?'available':'unavailable',async execute(input,options={}){
  current();const command=readCommerceCommand(input);
  if(!allowed.has(command.action))throw new CommerceError(403);
  const c=command as ClientCommerceCommand,kind=isCommerceRead(c.action)?'read':'write';
  if('entity'in c&&!['quote_draft','quote','purchase','return_case','reconciliation'].includes(c.entity.kind))throw new CommerceError(403);
  if(!request||request.family!=='commerce-v1')throw new CommerceError(503);
  if(options.signal?.aborted||options.isApplicable?.()===false||runtime.cookie.status!=='ready')throw new CommerceError(503);
  let dispatched=false;
  try {
   let hash:string|null=null;
   if(kind==='write'){hash=await hashCommerceCommand(c);current();}
   else if(c.action==='request_status_v1'){
    if(!options.statusIntent||!allowed.has(options.statusIntent.action)||isCommerceRead(options.statusIntent.action)||options.statusIntent.requestId!==c.requestId)throw new CommerceError(400);
    const saved=boundary!.memory?.get<{command:ClientCommerceCommand;phase:string;dispatched?:boolean;commandHash?:string;rawWire?:string}>(`orders-intent:${owner}`);
    try{hash=await hashCommerceCommand(options.statusIntent);}catch{
     if(!saved||saved.dispatched===false||commerceCanonicalJson(saved.command)!==commerceCanonicalJson(options.statusIntent))throw new CommerceError(503);
     hash=await hashRetainedCommerceCommand(saved.command);if(saved.commandHash!==hash||saved.rawWire!==JSON.stringify(saved.command))throw new CommerceError(503);
    }current();
   }
   if(options.signal?.aborted||options.isApplicable?.()===false)throw new CommerceError(503);
   if(c.action==='accept_product_quote_v1'||c.action==='submit_payment_claim_v1'||c.action==='request_product_return_v1'){
    const intent=boundary!.memory?.get<{command:ClientCommerceCommand;phase:string;dispatched?:boolean;commandHash?:string;rawWire?:string}>(`orders-intent:${owner}`);
    const exactRecovery=intent&&intent.dispatched!==false&&(intent.phase==='uncertain'||intent.dispatched===true)&&commerceCanonicalJson(intent.command)===commerceCanonicalJson(c)&&(intent.commandHash===undefined||intent.commandHash===hash)&&(intent.rawWire===undefined||intent.rawWire===JSON.stringify(c));
    if(!exactRecovery){try{await checkCommerceWriteBasis(c,options.basis,owner!);}catch{throw new CommerceError(503);}current();}
   }
   // Offline custody remains current for recovery, but first raw egress must
   // still be ready after every hash/proof await and before intent handoff.
   if(options.signal?.aborted||options.isApplicable?.()===false||runtime.cookie.status!=='ready')throw new CommerceError(503);
   options.onDispatch?.();
   dispatched=true;
   const raw=await request.execute(c,{kind,signal:options.signal});current();
   if(options.signal?.aborted||runtime.cookie.status!=='ready')throw new CommerceError(503,true,kind==='write');
   const result=mapCommerceResult(c,raw,{actorId:owner!,requestHash:hash});
   if(c.action==='request_status_v1'&&'status'in result&&result.status==='committed'&&options.statusIntent)mapCommerceResult(options.statusIntent,result.receipt,{actorId:owner!,requestHash:hash});
   current();return result;
  }catch(error){
   current();const status=(error as {status?:number}).status;
   if(error instanceof CommerceError)throw error;
   throw new CommerceError(status&&[400,401,403,404,409,413,429,503].includes(status)?status:503,dispatched,dispatched&&kind==='write'&&(!status||status===503));
  }
 }};
}
