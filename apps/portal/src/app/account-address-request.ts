import type {ApplicationSession} from './session.ts';
import {clientCookieRequest} from './retained.ts';
import {TransportError} from '../transport/session.ts';
import type {OperationKind,OperationOptions} from '../transport/session.ts';
import {createClientPaymentPorts} from './client-payments-request.ts';
import {buildPaymentCall,mapPaymentReceipt,paymentObject,paymentUuid} from '../../../../supabase/functions/concierge-payments/contract.ts';
import type {ShippingAddressReceipt} from '../../../../supabase/functions/concierge-payments/types.ts';

/** Fixed own-client PaymentV2 read and existing legacy address confirmation.
 * No care/service read, caller selector, new namespace or permission. */
export function createAccountAddressRequest(runtime:ApplicationSession){
 const cookie=runtime.cookie,boundary=runtime.getSnapshot().boundary,owner=cookie.identity?.ownerId;
 const generation=cookie.generation,epoch=cookie._epoch,serverGeneration=cookie._view?.generation,csrf=cookie._view?.csrf;
 const same=()=>!!boundary&&!!owner&&runtime.getSnapshot().boundary===boundary&&cookie.audience==='client'&&
  cookie.identity?.role==='client'&&cookie.identity.ownerId===owner&&cookie.generation===generation&&cookie._epoch===epoch&&
  cookie._view?.generation===serverGeneration&&cookie._view?.csrf===csrf;
 function current(){
  if(!same())throw new TransportError(401);
  const valid=boundary!.isCurrent();
  if(!valid||!same())throw new TransportError(401);
 }
 current();const clientId=paymentUuid(owner),read=createClientPaymentPorts(runtime).read;
 function operation(kind:OperationKind,options:OperationOptions={}){
  current();const view=cookie._view;
  function ready(){
   current();
   if(cookie.status!=='ready'||cookie._view!==view)throw new TransportError(503,kind);
   if(view?.capabilities.view!==true||view.capabilities.edit||view.capabilities.publish||view.capabilities.confirmPayments)throw new TransportError(403,kind);
  }
  ready();let signal:AbortSignal|undefined,local:OperationOptions['isApplicable'];
  try{signal=options.signal;ready();local=options.isApplicable;ready();}catch{ready();throw new TransportError(503,kind);}
  const applicable=()=>{
   ready();const before=signal?.aborted===true;ready();if(before)return false;
   let allowed=true;try{if(local!==undefined)allowed=local()===true;}catch{allowed=false;}
   ready();const aborted=signal?.aborted===true;ready();return allowed&&!aborted;
  };
  if(!applicable())throw new TransportError(503,kind);
  return {ready,applicable,options:{signal,isApplicable:applicable}};
 }
 return Object.freeze({
  isCurrent(){try{current();return true;}catch{return false;}},
  async readPayments(options?:OperationOptions){
   const op=operation('read',options);
   try{
    const value=await read.execute({schemaVersion:2,action:'client_read'},op.options);
    if(!op.applicable())throw new TransportError(503,'read');
    const latest=Math.max(0,...value.shippingAddresses.map(a=>a.version));
    if((value.shippingAddress?.version??0)!==latest||value.revision<latest)throw new TransportError(503,'read');
    if(!op.applicable())throw new TransportError(503,'read');return value;
   }catch(error){current();throw error;}
  },
  async confirmAddress(input:unknown,options?:OperationOptions):Promise<ShippingAddressReceipt>{
   const op=operation('write',options);let call:ReturnType<typeof buildPaymentCall>;
   try{
    const detached=structuredClone(input);op.ready();const raw=paymentObject(detached);
    if(raw.action!=='confirm_shipping_address')throw new TransportError(400,'write');
    if(new TextEncoder().encode(JSON.stringify(detached)).byteLength>100000)throw new TransportError(413,'write');
    call=buildPaymentCall(detached,clientId);op.ready();
    if(call.name!=='concierge_payment_write'||call.args.p_action!=='confirm_shipping_address')throw new TransportError(400,'write');
   }catch(error){op.ready();throw error instanceof TransportError?error:new TransportError(400,'write');}
   if(call.name!=='concierge_payment_write')throw new TransportError(400,'write');
   const command={action:'confirm_shipping_address',requestId:call.args.p_request_id,expectedRevision:call.args.p_expected_revision,address:call.args.p_payload.address};
   if(!op.applicable())throw new TransportError(503,'write');
   const request=clientCookieRequest('payments',cookie);
   const port=runtime.transport.bind<typeof command,ShippingAddressReceipt>({kind:'write',invoke:(value,opts)=>request(value,opts),decode:value=>{
    if(!op.applicable())throw new TransportError(503,'write');let mapped:ShippingAddressReceipt;
    try{
     const result=mapPaymentReceipt(value,call);
     if(result.operation!=='confirm_shipping_address'||result.revision!==command.expectedRevision+1)throw Error('unavailable');
     mapped=result;
    }catch{op.ready();throw new TransportError(503,'write');}
    if(!op.applicable())throw new TransportError(503,'write');return mapped;
   }});
   try{const result=await port.execute(command,op.options);if(!op.applicable())throw new TransportError(503,'write');return result;}
   catch(error){current();throw error;}
  },
 });
}
export type AccountAddressRequest=ReturnType<typeof createAccountAddressRequest>;
