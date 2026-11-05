import type {ApplicationSession} from './session.ts';
import {clientCookieRequest} from './retained.ts';
import {TransportError} from '../transport/session.ts';
import type {CookieRequestFactory,OperationOptions,OperationPort} from '../transport/session.ts';
import type {ClientOrdersReadCommand,ClientOrdersReadView} from '../features/orders/read/types.ts';
import {readClientOrdersReadCommand} from '../../../../src/contracts/PortalClientOrdersValidation.ts';
import {mapClientOrdersReadResult} from '../../../../src/contracts/PortalClientOrdersMapping.ts';

// A literal call bridge, not a registry, allowlist, channel grant or session cast.
type OrdersFactory=(channel:'client-orders',...args:Parameters<CookieRequestFactory> extends [unknown,...infer Rest]?Rest:never)=>ReturnType<CookieRequestFactory>;

export function createClientOrdersReadPort(runtime:ApplicationSession):OperationPort<ClientOrdersReadCommand,ClientOrdersReadView> {
  const boundary=runtime.getSnapshot().boundary;
  function identity():void {
    if(!boundary||runtime.getSnapshot().boundary!==boundary||!boundary.isCurrent()||
      runtime.getSnapshot().boundary!==boundary||runtime.cookie.audience!=='client'||runtime.cookie.identity?.role!=='client')throw new TransportError(401);
  }
  return {async execute(input,options:OperationOptions={}) {
    identity();
    // Capture actual owner/lease context BEFORE parser, option getters or the
    // caller's deny-only callback can synchronously replace it.
    const cookie=runtime.cookie,view=cookie._view,owner=cookie.identity?.ownerId,
      generation=cookie.generation,epoch=cookie._epoch,serverGeneration=view?.generation,csrf=view?.csrf;
    const same=()=>{
      identity();
      return cookie.identity?.ownerId===owner&&cookie.generation===generation&&cookie._epoch===epoch&&
        cookie._view===view&&cookie._view?.generation===serverGeneration&&cookie._view?.csrf===csrf;
    };
    function ready():void {
      if(!same())throw new TransportError(503);
      if(cookie._view?.capabilities.view!==true)throw new TransportError(403);
      if(cookie.status!=='ready')throw new TransportError(503);
    }
    let command:ClientOrdersReadCommand;
    try{command=readClientOrdersReadCommand(input);}catch{identity();throw new TransportError(400);}
    const signal=options.signal,isApplicable=options.isApplicable;
    ready();
    const applicable=()=>{
      ready();if(signal?.aborted)return false;
      let allowed=false;
      try{allowed=isApplicable===undefined||isApplicable()===true;}catch{/* Local relevance can only deny. */}
      // Boundary currentness can survive offline. READY and VIEW are final.
      ready();return allowed&&!signal?.aborted;
    };
    if(!applicable())throw new TransportError(503);
    const registry:unknown=Reflect.get(cookie,'actions');
    ready();
    const registered=!!registry&&typeof registry==='object'&&Object.hasOwn(registry,'client-orders');
    ready();
    // Known physical absence only. Never catch/relabel a real factory or HTTP
    // denial as missing registration, and never fall back to operations/care.
    if(!registered)throw new TransportError(503);
    const request=(clientCookieRequest as unknown as OrdersFactory)('client-orders',cookie);
    ready();
    const port=runtime.transport.bind<ClientOrdersReadCommand,ClientOrdersReadView>({kind:'read',
      invoke:(value,opts)=>request(value,opts),decode:value=>{
        if(!applicable())throw new TransportError(503);
        const result=mapClientOrdersReadResult(value,command);
        if(!applicable())throw new TransportError(503);
        return result;
      }});
    try {
      const result=await port.execute(command,{signal,isApplicable:applicable});
      if(!applicable())throw new TransportError(503);
      return result;
    }catch(error){
      // Preserve genuine received denials regardless of local route relevance.
      identity();throw error;
    }
  }};
}
