import {createConciergeAuthenticatedPorts} from '../concierge-operations/runtime.ts';
import type {ConciergeTransportConfiguration} from '../concierge-operations/runtime.ts';
import type {ServiceFinancialsRpcCall} from '../../../src/contracts/PortalServiceFinancials.ts';
import type {ServiceFinancialsPorts,ServiceFinancialsReceivedDenial} from './service-financials-handler.ts';
import {buildServiceFinancialsRpc} from '../../../src/contracts/PortalServiceFinancialsMapping.ts';
import {serviceFinancialsCommandMaxBytes,serviceFinancialsResultMaxBytes,serviceFinancialsAuthMaxBytes,serviceFinancialsOperationMilliseconds} from '../../../src/contracts/PortalServiceFinancialsValues.ts';
import {clientOrdersReadWait as wait,readClientOrdersReadJson as readJson,setClientOrdersReadDeadline as setDeadline} from '../concierge-client-orders/body.ts';

const rpcName='concierge_client_service_financials_read_v1' as const;
function available(signal?:AbortSignal):void {if(signal?.aborted)throw new Error('unavailable');}
function operation(signal?:AbortSignal):AbortSignal {
  return signal?AbortSignal.any([signal,AbortSignal.timeout(serviceFinancialsOperationMilliseconds)]):AbortSignal.timeout(serviceFinancialsOperationMilliseconds);
}
function discard(response:Response):void {try{void response.body?.cancel().catch(()=>{});}catch{/* Refusal cannot wait for remote cleanup. */}}
function redirected(response:Response):boolean {return response.redirected||response.status===0||response.status>=300&&response.status<400;}

/** Fixed read transport only. The W1 builder/mapper and SQL still supply strict
 * business parsing, own-client/session authorization and actual financial truth.
 * Construction registers no gateway/route and changes no existing V2 port. */
export function createServiceFinancialsPorts(config:ConciergeTransportConfiguration):ServiceFinancialsPorts {
  const send=config.fetch??globalThis.fetch;
  const captured={supabaseUrl:config.supabaseUrl,publicKey:config.publicKey,allowedOrigins:Object.freeze([...config.allowedOrigins])};
  const received=new WeakMap<AbortSignal,ServiceFinancialsReceivedDenial>();
  const bounded=(observe?:(status:401|403)=>void):typeof fetch=>async(input,init)=>{
    const signal=init?.signal;if(!signal)throw new Error('unavailable');
    available(signal);const deadline=Date.now()+serviceFinancialsOperationMilliseconds;
    // Reuse the unchanged pure bounded-reader mechanics. No Orders read,
    // controller, permission, fixture or accepted M02 source is changed.
    setDeadline(signal,deadline);
    let observed:Response|undefined,retired=false,response:Response;
    try{
      response=await wait(()=>send(input,{...init,redirect:'manual'}).then(value=>{
        observed=value;
        if(retired){discard(value);throw new Error('unavailable');}
        // Observe at actual header receipt, before the handler's outer abort
        // race can settle and before any remote body decode/cancel is awaited.
        if(!redirected(value)&&(value.status===401||value.status===403))observe?.(value.status);
        return value;
      }),signal);
    }catch{
      retired=true;
      // A denial already observed before settlement remains authoritative.
      if(observed&&!redirected(observed)&&(observed.status===401||observed.status===403)){
        discard(observed);return new Response(null,{status:observed.status});
      }
      if(observed)discard(observed);
      throw new Error('unavailable');
    }
    if(redirected(response)){discard(response);throw new Error('unavailable');}
    if(response.status===401||response.status===403){discard(response);return new Response(null,{status:response.status});}
    try{
      available(signal);
      const maximum=String(input).endsWith('/auth/v1/user')?serviceFinancialsAuthMaxBytes:serviceFinancialsResultMaxBytes;
      const value=await readJson(response.body,maximum,signal);
      available(signal);
      return new Response(JSON.stringify(value),{status:response.status,
        headers:{'content-type':'application/json','cache-control':'private, no-store'}});
    }catch{discard(response);throw new Error('unavailable');}
  };
  // Each call gets its own receipt observer; concurrent requests cannot share
  // an ambient signal or overwrite each other's denial classification.
  const retained=(observe?:(status:401|403)=>void)=>createConciergeAuthenticatedPorts<ServiceFinancialsRpcCall>({...captured,fetch:bounded(observe),allowedRpcNames:[rpcName]});
  const validated=retained(); // Preserve synchronous configuration validation.
  return {
    allowedOrigins:validated.allowedOrigins,
    receivedDenial:signal=>received.get(signal),
    async authenticate(token,signal){
      const live=operation(signal);available(live);
      const transport=retained(()=>received.set(signal??live,Object.freeze({status:401,code:'unauthorized'})));
      const user=await transport.authenticate(token,live);
      // Received identity denial wins over a coincident cancellation.
      if(user===null)return null;
      available(live);return user;
    },
    async rpc(token,call,signal){
      const live=operation(signal);available(live);
      if(!call||call.name!==rpcName||!call.args||typeof call.args!=='object'||
        Object.keys(call.args).length!==1||!Object.hasOwn(call.args,'p_command'))throw new Error('unavailable');
      // Snapshot the envelope once before egress. W1's canonical builder rejects
      // business selectors/schema before the sole fixed RPC; SQL still rechecks authority.
      const wire=JSON.stringify(call.args.p_command);
      if(typeof wire!=='string'||new TextEncoder().encode(wire).byteLength>serviceFinancialsCommandMaxBytes)throw new Error('unavailable');
      available(live);
      const frozen=buildServiceFinancialsRpc(JSON.parse(wire));
      available(live);
      const transport=retained(status=>{
        const denial:ServiceFinancialsReceivedDenial=status===401?{status:401,code:'session_ended'}:{status:403,code:'forbidden'};
        received.set(signal??live,Object.freeze(denial));
      });
      const result=await transport.rpc(token,frozen,live);
      if(result.error&&(result.error.status===401||result.error.status===403))return result;
      available(live);return result;
    },
  };
}
