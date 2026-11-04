import type {ApplicationSession} from './session.ts';
import {clientCookieRequest} from './retained.ts';
import {TransportError} from '../transport/session.ts';
import type {OperationKind,OperationOptions,OperationPort} from '../transport/session.ts';
import type {ClientPaymentPorts,ClientPaymentReceipt} from '../features/payments/types.ts';
import {buildPaymentCallV2,mapPaymentViewV2,mapPaymentReceiptV2} from '../../../../supabase/functions/concierge-payments/methods.ts';
import {paymentObject,paymentUuid} from '../../../../supabase/functions/concierge-payments/contract.ts';
import type {PaymentRpcCall} from '../../../../supabase/functions/concierge-payments/types.ts';

/** Fixed own-client read/claim bridge. The server derives financial ownership;
 * a receipt acknowledges its original event, never the current claim status. */
export function createClientPaymentPorts(runtime:ApplicationSession):ClientPaymentPorts {
  const boundary=runtime.getSnapshot().boundary,owner=runtime.cookie.identity?.ownerId;
  function current():void {
    if(!boundary||!owner||runtime.getSnapshot().boundary!==boundary||!boundary.isCurrent()||
      runtime.getSnapshot().boundary!==boundary||runtime.cookie.audience!=='client'||
      runtime.cookie.identity?.role!=='client'||runtime.cookie.identity.ownerId!==owner)throw new TransportError(401);
  }
  function port<I,O>(action:'client_read'|'submit_claim',kind:OperationKind,decode:(value:unknown,call:PaymentRpcCall)=>O):OperationPort<I,O> {
    return {async execute(input,options:OperationOptions={}) {
      current();
      const cookie=runtime.cookie,view=cookie._view,generation=cookie.generation,epoch=cookie._epoch,
        serverGeneration=view?.generation,csrf=view?.csrf;
      const ready=()=>{
        current();
        if(cookie.status!=='ready'||cookie._view!==view||cookie.generation!==generation||cookie._epoch!==epoch||
          cookie._view?.generation!==serverGeneration||cookie._view?.csrf!==csrf)throw new TransportError(503,kind);
        if(view?.capabilities.view!==true||view.capabilities.edit||view.capabilities.publish||view.capabilities.confirmPayments)throw new TransportError(403,kind);
      };
      ready();
      let command:I,call:PaymentRpcCall;
      try {
        command=structuredClone(input);
        const raw=paymentObject(command);
        if(raw.schemaVersion!==2)throw new TransportError(400,kind);
        if(raw.action!==action)throw new TransportError(403,kind);
        call=buildPaymentCallV2(command,paymentUuid(owner));
        if(new TextEncoder().encode(JSON.stringify(command)).byteLength>100000)throw new TransportError(413,kind);
      }catch(error){ready();throw error instanceof TransportError?error:new TransportError(400,kind);}
      ready();
      let signal:AbortSignal|undefined,local:OperationOptions['isApplicable'];
      try{signal=options.signal;local=options.isApplicable;}catch{ready();throw new TransportError(503,kind);}
      ready();
      const applicable=()=>{
        ready();
        const before=signal?.aborted===true;ready();if(before)return false;
        let allowed=true;
        try{if(local!==undefined)allowed=local()===true;}catch{allowed=false;}
        ready();const aborted=signal?.aborted===true;ready();return allowed&&!aborted;
      };
      if(!applicable())throw new TransportError(503,kind);
      let request:ReturnType<typeof clientCookieRequest>;
      try{request=clientCookieRequest('payments',cookie);}catch{ready();throw new TransportError(503,kind);}
      ready();
      const bound=runtime.transport.bind<I,O>({kind,invoke:(value,opts)=>request(value,opts),decode:value=>{
        if(!applicable())throw new TransportError(503,kind);
        let mapped:O;
        try{mapped=decode(value,call);}catch{ready();throw new TransportError(503,kind);}
        if(!applicable())throw new TransportError(503,kind);return mapped;
      }});
      try{
        const result=await bound.execute(command,{signal,isApplicable:applicable});
        if(!applicable())throw new TransportError(503,kind);return result;
      }catch(error){
        // Local relevance never relabels a received denial in the same session.
        current();throw error;
      }
    }};
  }
  return {
    read:port('client_read','read',value=>mapPaymentViewV2(value)),
    claim:port('submit_claim','write',(value,call):ClientPaymentReceipt=>{
      const receipt=mapPaymentReceiptV2(value,call);
      if(receipt.operation!=='submit_claim'||!('quoteId'in receipt))throw new TransportError(503,'write');
      return receipt;
    }),
  };
}
