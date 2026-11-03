import {createConciergeAuthenticatedPorts} from '../concierge-operations/runtime.ts';
import type {ConciergeTransportConfiguration} from '../concierge-operations/runtime.ts';
import type {ConciergeAuthenticatedPorts} from '../../../src/contracts/ConciergePortal.ts';
import type {ServiceFinancialsRpcCall} from '../../../src/contracts/PortalServiceFinancials.ts';
import {buildServiceFinancialsRpc} from '../../../src/contracts/PortalServiceFinancialsMapping.ts';
import {serviceFinancialsCommandMaxBytes,serviceFinancialsResultMaxBytes,serviceFinancialsAuthMaxBytes,serviceFinancialsOperationMilliseconds} from '../../../src/contracts/PortalServiceFinancialsValues.ts';
import {clientOrdersReadWait as wait,readClientOrdersReadJson as readJson,setClientOrdersReadDeadline as setDeadline} from '../concierge-client-orders/body.ts';

const rpcName='concierge_client_service_financials_read_v1' as const;
function available(signal?:AbortSignal):void {if(signal?.aborted)throw new Error('unavailable');}
function operation(signal?:AbortSignal):AbortSignal {
  return signal?AbortSignal.any([signal,AbortSignal.timeout(serviceFinancialsOperationMilliseconds)]):AbortSignal.timeout(serviceFinancialsOperationMilliseconds);
}
function discard(response:Response):void {try{void response.body?.cancel().catch(()=>{});}catch{/* Refusal cannot wait for remote cleanup. */}}

/** Fixed read transport only. The W1 builder/mapper and SQL still supply strict
 * business parsing, own-client/session authorization and actual financial truth.
 * Construction registers no gateway/route and changes no existing V2 port. */
export function createServiceFinancialsPorts(config:ConciergeTransportConfiguration):ConciergeAuthenticatedPorts<ServiceFinancialsRpcCall> {
  const send=config.fetch??globalThis.fetch;
  const bounded:typeof fetch=async(input,init)=>{
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
        return value;
      }),signal);
    }catch{
      retired=true;
      // A denial already observed before settlement remains authoritative.
      if(observed&&(observed.status===401||observed.status===403)){
        discard(observed);return new Response(null,{status:observed.status});
      }
      if(observed)discard(observed);
      throw new Error('unavailable');
    }
    if(response.redirected||response.status===0||response.status>=300&&response.status<400){discard(response);throw new Error('unavailable');}
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
  const retained=createConciergeAuthenticatedPorts<ServiceFinancialsRpcCall>({...config,fetch:bounded,allowedRpcNames:[rpcName]});
  return {
    allowedOrigins:retained.allowedOrigins,
    async authenticate(token,signal){
      const live=operation(signal);available(live);
      const user=await retained.authenticate(token,live);
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
      const result=await retained.rpc(token,frozen,live);
      if(result.error&&(result.error.status===401||result.error.status===403))return result;
      available(live);return result;
    },
  };
}
