import {createConciergeAuthenticatedPorts} from '../concierge-operations/runtime.ts';
import type {ConciergeTransportConfiguration} from '../concierge-operations/runtime.ts';
import {commerceOperation,commerceAvailable,commerceWait,readCommerceJson} from './body.ts';
import type {CommerceRpcCall} from '../../../src/contracts/PortalCommerce.ts';
import type {CommercePorts} from './handler.ts';

function discard(response:Response):void {
  // Refusal cannot wait for a remote body cancellation to finish.
  try{void response.body?.cancel().catch(()=>{});}catch{/* Already closed/locked. */}
}
function redirected(response:Response):boolean {
  return response.redirected||response.status===0||response.status>=300&&response.status<400;
}
/** The retained transport still owns Auth, bearer/public-key plumbing and its
 * fixed RPC registry. This Commerce envelope never follows a credentialed
 * redirect and bounds provider JSON without losing known session denials. */
export function createCommercePorts(config:ConciergeTransportConfiguration):CommercePorts {
  const send=config.fetch??globalThis.fetch;
  const bounded:typeof fetch=async(input,init)=>{
    const operation=commerceOperation(init?.signal??undefined);
    let observed:Response|undefined,retired=false,response:Response;
    try{
      response=await commerceWait(()=>send(input,{...init,signal:operation.signal,redirect:'manual'}).then(value=>{
        observed=value;
        if(retired){discard(value);throw new Error('unavailable');}
        return value;
      }),operation);
    }catch{
      retired=true;
      // Received session denials stay definite; late responses only get cleanup.
      if(observed&&!redirected(observed)&&(observed.status===401||observed.status===403)){
        discard(observed);return new Response(null,{status:observed.status});
      }
      if(observed)discard(observed);
      throw new Error('unavailable');
    }
    if(redirected(response)){
      discard(response);throw new Error('unavailable');
    }
    if(response.status===401||response.status===403){
      discard(response);
      return new Response(null,{status:response.status});
    }
    try{
      const data=await readCommerceJson(response.body,2000000,operation);
      const encoded=JSON.stringify(data);commerceAvailable(operation);
      return new Response(encoded,{status:response.status,
        headers:{'content-type':'application/json','cache-control':'private, no-store'}});
    }catch{discard(response);throw new Error('unavailable');}
  };
  const retained=createConciergeAuthenticatedPorts<CommerceRpcCall>({...config,fetch:bounded,
    allowedRpcNames:['concierge_commerce_command_v1']});
  return {
    allowedOrigins:retained.allowedOrigins,
    async authenticate(token,signal){
      const operation=commerceOperation(signal);commerceAvailable(operation);
      // The bounded fetch owns settlement. A second race here could outrun a
      // received denial while the retained transport maps its empty body.
      const user=await retained.authenticate(token,operation.signal);
      if(user===null)return null;
      commerceAvailable(operation);return user;
    },
    async rpc(token,call,signal){
      const operation=commerceOperation(signal);commerceAvailable(operation);
      const result=await retained.rpc(token,call,operation.signal);
      if(result.error&&(result.error.status===401||result.error.status===403))return result;
      commerceAvailable(operation);return result;
    },
  };
}
