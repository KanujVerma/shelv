import type {ClientServicePorts,ClientServiceIdentity,ClientServiceResult,ClientServiceRpcCall} from '../../../src/contracts/PortalClientService.ts';
import {buildClientServiceRpc,mapClientServiceResult} from '../../../src/contracts/PortalClientServiceMapping.ts';
import {readUuid,requireValue} from '../../../src/contracts/ConciergePortalValidation.ts';
import {clientServiceCommandMaxBytes,clientServiceErrorStatuses,clientServiceOperationMilliseconds} from '../../../src/contracts/PortalClientServiceValues.ts';
import {ClientServiceFailure,clientServiceWait,clientServiceReceivedDenial,readClientServiceJson,setClientServiceDeadline} from './body.ts';

export async function handleClientServiceRequest(request:Request,ports:ClientServicePorts):Promise<Response>{
 // One absolute deadline starts before the first await, including body/cleanup.
 const deadline=Date.now()+clientServiceOperationMilliseconds,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),clientServiceOperationMilliseconds);
 const incoming=request.signal,abort=()=>controller.abort();incoming.addEventListener('abort',abort,{once:true});if(incoming.aborted)abort();
 const signal=controller.signal,headers:Record<string,string>={'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin'};
 const reply=(status:number,code:string)=>new Response(JSON.stringify({code}),{status,headers});
 let result:ClientServiceResult|undefined,serialized:string|undefined,finalIdentity:ClientServiceIdentity|undefined,failure:unknown,early:Response|undefined;
 try{
  setClientServiceDeadline(signal,deadline);
  const origins=[...ports.allowedOrigins],authenticate=ports.authenticate.bind(ports),rpc=ports.rpc.bind(ports);
  const origin=request.headers.get('origin');
  if(origin&&!origins.includes(origin))early=reply(403,'origin_forbidden');
  else{
   if(origin)headers['access-control-allow-origin']=origin;
   if(request.method==='OPTIONS'){headers['access-control-allow-methods']='POST, OPTIONS';headers['access-control-allow-headers']='authorization, apikey, content-type';early=new Response(null,{status:204,headers});}
   else if(request.method!=='POST')early=reply(405,'method_not_allowed');
   else{
    const token=/^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization')??'')?.[1];
    if(!token)throw new ClientServiceFailure(401,'unauthorized');
    if(new TextEncoder().encode(token).byteLength>8192)throw new ClientServiceFailure(400,'invalid_input');
    if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')throw new ClientServiceFailure(415,'unsupported_media_type');
    const checkIdentity=(identity:ClientServiceIdentity)=>{
     try{readUuid(identity.id);readUuid(identity.sessionId);requireValue(identity.is_anonymous===false&&Number.isSafeInteger(identity.expiresAt));}
     catch{throw new ClientServiceFailure(403,'forbidden');}
     if(identity.expiresAt*1000<=Date.now())throw new ClientServiceFailure(401,'session_ended');
    };
    const actor=Object.freeze({...await clientServiceWait(()=>authenticate(token,signal),signal)});checkIdentity(actor);finalIdentity=actor;
    const reauthenticate=async()=>{
     const current=await clientServiceWait(()=>authenticate(token,signal),signal);checkIdentity(current);
     if(current.id!==actor.id||current.sessionId!==actor.sessionId||current.expiresAt!==actor.expiresAt)throw new ClientServiceFailure(403,'forbidden');
    };
    let call:ClientServiceRpcCall;
    try{call=buildClientServiceRpc(await readClientServiceJson(request.body,clientServiceCommandMaxBytes,signal));}
    catch(error){if(error instanceof ClientServiceFailure)throw error;throw new ClientServiceFailure(400,'invalid_input');}
    const execute=async(target:ClientServiceRpcCall):Promise<ClientServiceResult>=>{
     const response=await clientServiceWait(()=>rpc(token,target,signal),signal);
     if(response.error){
      const status=response.error.status;if(status===401||status===403)throw new ClientServiceFailure(status,status===401?'session_ended':'forbidden');
      const code=Object.keys(clientServiceErrorStatuses).find(key=>response.error?.message===`concierge_${key}`);
      throw new ClientServiceFailure(code?clientServiceErrorStatuses[code]:503,code??'unavailable');
     }
     try{return mapClientServiceResult(response.data,target.args.p_command);}catch{throw new ClientServiceFailure(503,'unavailable');}
    };
    result=await execute(call);await reauthenticate();
    if(call.args.p_command.action==='cancel_client_service_period_end_v1'){
     const recovery=buildClientServiceRpc({schemaVersion:1,action:'client_service_request_status_v1',requestId:call.args.p_command.requestId});
     const current=await execute(recovery);
     if(!('state' in current)||current.state!=='committed'||JSON.stringify(current.original)!==JSON.stringify(call.args.p_command)||JSON.stringify(current.receipt)!==JSON.stringify(result)||current.receipt.cancellation.recordedBy!==actor.id)throw new ClientServiceFailure(503,'unavailable');
    }else{
     const current=await execute(call);
     if(JSON.stringify(current)!==JSON.stringify(result))throw new ClientServiceFailure(409,'basis_conflict');
     if('state' in current&&current.state==='committed'&&current.receipt.cancellation.recordedBy!==actor.id)throw new ClientServiceFailure(503,'unavailable');
    }
    await reauthenticate();checkIdentity(actor);serialized=JSON.stringify(result);
   }
  }
 }catch(error){failure=error;}
 finally{
  clearTimeout(timer);
  try{incoming.removeEventListener('abort',abort);}catch(error){failure??=error;}
 }
 // Cleanup is callback-capable too. No private response is constructed before
 // the final original-signal/deadline check. Received denial retains precedence.
 const denial=clientServiceReceivedDenial(signal);if(denial)return reply(denial.status,denial.code);
 if(signal.aborted||incoming.aborted||Date.now()>=deadline)return reply(503,'unavailable');
 if(finalIdentity&&finalIdentity.expiresAt*1000<=Date.now())return reply(401,'session_ended');
 if(failure!==undefined)return failure instanceof ClientServiceFailure?reply(failure.status,failure.code):reply(503,'unavailable');
 return early??(serialized!==undefined?new Response(serialized,{status:200,headers}):reply(503,'unavailable'));
}
