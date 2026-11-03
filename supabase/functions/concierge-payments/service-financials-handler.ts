import type {ConciergeAuthenticatedPorts} from '../../../src/contracts/ConciergePortal.ts';
import type {ServiceFinancialsRpcCall} from '../../../src/contracts/PortalServiceFinancials.ts';
import {buildServiceFinancialsRpc,mapServiceFinancialsResult} from '../../../src/contracts/PortalServiceFinancialsMapping.ts';
import {serviceFinancialsCommandMaxBytes,serviceFinancialsErrorStatuses,serviceFinancialsOperationMilliseconds} from '../../../src/contracts/PortalServiceFinancialsValues.ts';
import {readUuid} from '../../../src/contracts/ConciergePortalValidation.ts';
import {ClientOrdersReadFailure,clientOrdersReadWait as wait,readClientOrdersReadJson as readJson,setClientOrdersReadDeadline as setDeadline} from '../concierge-client-orders/body.ts';

export type ServiceFinancialsPorts=ConciergeAuthenticatedPorts<ServiceFinancialsRpcCall>;
const errors=new Map(Object.entries(serviceFinancialsErrorStatuses).map(([code,status])=>['concierge_'+code,{code,status}]));
function failure(error:{status?:number;message?:string}){
  if(error.status===401)return {status:401,code:'session_ended'};
  if(error.status===403)return {status:403,code:'forbidden'};
  return errors.get(error.message??'')??{status:503,code:'unavailable'};
}
/** One own-client READ boundary. SQL must derive the real subject and recheck
 * administration/session/deletion rights. No caller identity, guarantee
 * authority, financial mutation or existing PaymentV2 action is added here. */
export async function handleServiceFinancialsRequest(request:Request,ports:ServiceFinancialsPorts):Promise<Response> {
  const headers:Record<string,string>={'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin','x-content-type-options':'nosniff'};
  const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers});
  const origin=request.headers.get('origin');
  if(origin&&!ports.allowedOrigins.includes(origin))return reply(403,{code:'origin_forbidden'});
  if(origin)headers['access-control-allow-origin']=origin;
  if(request.method==='OPTIONS'){
    headers['access-control-allow-headers']='authorization, apikey, content-type';headers['access-control-allow-methods']='POST, OPTIONS';
    return new Response(null,{status:204,headers});
  }
  if(request.method!=='POST')return reply(405,{code:'method_not_allowed'});
  const token=/^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization')??'')?.[1];
  if(!token)return reply(401,{code:'unauthorized'});
  if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')return reply(415,{code:'unsupported_media_type'});
  const signal=AbortSignal.any([request.signal,AbortSignal.timeout(serviceFinancialsOperationMilliseconds)]);
  const observed:{denial:{status:number;code:string}|null}={denial:null};
  try{
    setDeadline(signal,Date.now()+serviceFinancialsOperationMilliseconds);
    const user=await wait(async()=>{
      const value=await ports.authenticate(token,signal);
      if(value===null)observed.denial={status:401,code:'unauthorized'};
      return value;
    },signal);
    if(!user)return reply(401,{code:'unauthorized'});
    try{readUuid(user.id);}catch{return reply(401,{code:'unauthorized'});}
    if(user.is_anonymous!==false)return reply(403,{code:'forbidden'});
    const call=buildServiceFinancialsRpc(await readJson(request.body,serviceFinancialsCommandMaxBytes,signal));
    const result=await wait(async()=>{
      const value=await ports.rpc(token,call,signal);
      if(value.error){const known=failure(value.error);if(known.status===401||known.status===403)observed.denial=known;}
      return value;
    },signal);
    if(result.error){const safe=failure(result.error);return reply(safe.status,{code:safe.code});}
    if(signal.aborted)throw new Error('unavailable');
    const view=mapServiceFinancialsResult(result.data,call.args.p_command);
    const encoded=JSON.stringify(view);
    if(signal.aborted)throw new Error('unavailable');
    return new Response(encoded,{status:200,headers});
  }catch(cause){
    // A received authentication/authorization denial is not a retryable read.
    if(observed.denial)return reply(observed.denial.status,{code:observed.denial.code});
    if(!signal.aborted&&cause instanceof ClientOrdersReadFailure&&(cause.status===400||cause.status===413))return reply(cause.status,{code:cause.status===413?'too_large':'invalid_input'});
    if(!signal.aborted&&cause instanceof Error&&cause.message==='invalid_input')return reply(400,{code:'invalid_input'});
    return reply(503,{code:'unavailable'});
  }
}
