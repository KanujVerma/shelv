import {parseDeliveryContext,buildNeutralNotificationEmail} from './neutralPayload.ts';
import type {NeutralNotificationEmail} from './neutralPayload.ts';
import {readPlanShape} from '../../../src/contracts/PortalRebuildValidation.ts';
import {object,uuid,en,rev} from '../../../src/contracts/PortalNotificationValidation.ts';
import {requireValue} from '../../../src/contracts/ConciergePortalValidation.ts';
export type AdapterResult={status:'accepted';providerMessageId:string}|{status:'failed'|'uncertain';errorCode:string};
export type NotificationAdapter={kind:'local_synthetic_filesystem';send(message:NeutralNotificationEmail):Promise<AdapterResult>};
export type NotificationWorkerCall=
 |{name:'concierge_plan_delivery_claim_v1';args:{p_limit:number}}
 |{name:'concierge_plan_delivery_context_v1';args:{p_delivery_id:string;p_lease_id:string}}
 |{name:'concierge_plan_delivery_result_v1';args:{p_delivery_id:string;p_lease_id:string;p_status:'accepted'|'failed'|'uncertain';p_provider_message_id:string|null;p_error_code:string|null}};
export type NotificationWorkerPorts={rpc(call:NotificationWorkerCall):Promise<unknown>};
export type NotificationBatchResult={state:'busy'}|{state:'completed';items:{deliveryId:string;status:'accepted'|'failed'|'uncertain';recorded:boolean}[]};
const active=new WeakSet<NotificationWorkerPorts>();
/** A concrete adapter is mandatory. No default accepted result, provider retry or reconciliation bit. */
export async function runNotificationBatch(ports:NotificationWorkerPorts,adapter:NotificationAdapter,options:{limit:number;portalOrigin:string}):Promise<NotificationBatchResult>{
 requireValue(adapter?.kind==='local_synthetic_filesystem'&&typeof adapter.send==='function'&&Number.isInteger(options.limit)&&options.limit>=1&&options.limit<=50);
 if(active.has(ports))return {state:'busy'};active.add(ports);
 try{
  const raw=await ports.rpc({name:'concierge_plan_delivery_claim_v1',args:{p_limit:options.limit}});
  const claims=readPlanShape(raw,{type:'array',max:options.limit,min:0,item:object({deliveryId:uuid,leaseId:uuid,recipientId:uuid,eventId:uuid,idempotencyKey:uuid})}) as {deliveryId:string;leaseId:string;recipientId:string;eventId:string;idempotencyKey:string}[];
  requireValue(new Set(claims.map(c=>c.deliveryId)).size===claims.length&&claims.every(c=>c.idempotencyKey===c.deliveryId));
  const items:Extract<NotificationBatchResult,{state:'completed'}>['items']=[];
  for(const c of claims){
   let outcome:AdapterResult={status:'failed',errorCode:'context_unavailable'};
   try{
    const context=parseDeliveryContext(await ports.rpc({name:'concierge_plan_delivery_context_v1',args:{p_delivery_id:c.deliveryId,p_lease_id:c.leaseId}}));
    requireValue(context.deliveryId===c.deliveryId&&context.leaseId===c.leaseId&&context.recipientId===c.recipientId&&context.event.eventId===c.eventId);
    const message=buildNeutralNotificationEmail(context,options.portalOrigin);
    // Any adapter exception may follow a completed side effect. It is never an automatic resend.
    outcome={status:'uncertain',errorCode:'adapter_response_lost'};
    const result=await adapter.send(message);
    if(result.status==='accepted'){requireValue(typeof result.providerMessageId==='string'&&result.providerMessageId.length>0&&result.providerMessageId.length<=200&&!/[\r\n]/.test(result.providerMessageId));outcome={status:'accepted',providerMessageId:result.providerMessageId};}
    else{requireValue((result.status==='failed'||result.status==='uncertain')&&/^[a-z0-9_]{1,80}$/.test(result.errorCode));outcome={status:result.status,errorCode:result.errorCode};}
   }catch{/* preserve sanitized failed-before-send versus uncertain-after-dispatch */}
   let recorded=false;
   try{const r=readPlanShape(await ports.rpc({name:'concierge_plan_delivery_result_v1',args:{p_delivery_id:c.deliveryId,p_lease_id:c.leaseId,p_status:outcome.status,p_provider_message_id:outcome.status==='accepted'?outcome.providerMessageId:null,p_error_code:outcome.status==='accepted'?null:outcome.errorCode}}),object({deliveryId:uuid,status:en('accepted','failed','uncertain'),revision:rev})) as {deliveryId:string;status:string};requireValue(r.deliveryId===c.deliveryId&&r.status===outcome.status);recorded=true;}catch{/* result may have committed; no resend or guessed reconciliation */}
   items.push({deliveryId:c.deliveryId,status:recorded?outcome.status:'uncertain',recorded});
  }
  return {state:'completed',items};
 }finally{active.delete(ports);}
}
/** An explicit server credential is supplied by the owner, never discovered from provider/env/config. */
export function createNotificationWorkerPorts(config:{supabaseUrl:string;serviceKey:string;fetch:typeof globalThis.fetch}):NotificationWorkerPorts{
 const base=new URL(config.supabaseUrl);requireValue(base.protocol==='https:'&&base.origin===config.supabaseUrl&&!base.username&&!base.password&&config.serviceKey.length>0&&typeof config.fetch==='function');
 const send=config.fetch;
 return {rpc:async(call)=>{requireValue(['concierge_plan_delivery_claim_v1','concierge_plan_delivery_context_v1','concierge_plan_delivery_result_v1'].includes(call.name));const r=await send(new URL(`/rest/v1/rpc/${call.name}`,base),{method:'POST',redirect:'error',cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000),headers:{authorization:`Bearer ${config.serviceKey}`,apikey:config.serviceKey,'content-type':'application/json'},body:JSON.stringify(call.args)});if(!r.ok){await r.body?.cancel();throw Error('unavailable');}const {readConciergeJson}=await import('../concierge-operations/body.ts');return readConciergeJson(r.body,100000);}};
}
