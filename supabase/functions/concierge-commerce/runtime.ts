import {createConciergeAuthenticatedPorts} from '../concierge-operations/runtime.ts';
import type {ConciergeTransportConfiguration} from '../concierge-operations/runtime.ts';
import {readConciergeJson} from '../concierge-operations/body.ts';
import type {CommerceRpcCall} from '../../../src/contracts/PortalCommerce.ts';
import type {CommercePorts} from './handler.ts';

function discard(response:Response):void {
  // Refusal cannot wait for a remote body cancellation to finish.
  try{void response.body?.cancel().catch(()=>{});}catch{/* Already closed/locked. */}
}
/** The retained transport still owns Auth, bearer/public-key plumbing and its
 * fixed RPC registry. This Commerce envelope never follows a credentialed
 * redirect and bounds provider JSON without losing known session denials. */
export function createCommercePorts(config:ConciergeTransportConfiguration):CommercePorts {
  const send=config.fetch??globalThis.fetch;
  const bounded:typeof fetch=async(input,init)=>{
    const response=await send(input,{...init,redirect:'manual'});
    if(response.redirected||response.status===0||response.status>=300&&response.status<400){
      discard(response);throw new Error('unavailable');
    }
    if(response.status===401||response.status===403){
      discard(response);
      return new Response(null,{status:response.status});
    }
    const data=await readConciergeJson(response.body,2000000);
    return new Response(JSON.stringify(data),{status:response.status,
      headers:{'content-type':'application/json','cache-control':'private, no-store'}});
  };
  return createConciergeAuthenticatedPorts<CommerceRpcCall>({...config,fetch:bounded,
    allowedRpcNames:['concierge_commerce_command_v1']});
}
