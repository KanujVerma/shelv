import type {ClientOrdersReadPorts,ClientOrdersReadIdentity,ClientOrdersReadView,ClientOrdersReadRpcCall} from '../../../src/contracts/PortalClientOrders.ts';
import {buildClientOrdersReadRpc,mapClientOrdersReadResult} from '../../../src/contracts/PortalClientOrdersMapping.ts';
import {readUuid,requireValue} from '../../../src/contracts/ConciergePortalValidation.ts';
import {clientOrdersReadCommandMaxBytes,clientOrdersReadErrorStatuses,clientOrdersReadOperationMilliseconds} from '../../../src/contracts/PortalClientOrdersValues.ts';
import {ClientOrdersReadFailure,clientOrdersReadWait,clientOrdersReadReceivedDenial,readClientOrdersReadJson,setClientOrdersReadDeadline} from './body.ts';

export async function handleClientOrdersReadRequest(request:Request,ports:ClientOrdersReadPorts):Promise<Response>{
 // One absolute deadline starts before the first await, including body/cleanup.
 const deadline=Date.now()+clientOrdersReadOperationMilliseconds,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),clientOrdersReadOperationMilliseconds);
 const incoming=request.signal,abort=()=>controller.abort();incoming.addEventListener('abort',abort,{once:true});if(incoming.aborted)abort();
 const signal=controller.signal,headers:Record<string,string>={'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin'};
 const reply=(status:number,code:string)=>new Response(JSON.stringify({code}),{status,headers});
 let result:ClientOrdersReadView|undefined,serialized:string|undefined,finalIdentity:ClientOrdersReadIdentity|undefined,failure:unknown,early:Response|undefined;
 try{
  setClientOrdersReadDeadline(signal,deadline);
  const origins=[...ports.allowedOrigins],authenticate=ports.authenticate.bind(ports),rpc=ports.rpc.bind(ports);
  const origin=request.headers.get('origin');
  if(origin&&!origins.includes(origin))early=reply(403,'origin_forbidden');
  else{
   if(origin)headers['access-control-allow-origin']=origin;
   if(request.method==='OPTIONS'){headers['access-control-allow-methods']='POST, OPTIONS';headers['access-control-allow-headers']='authorization, apikey, content-type';early=new Response(null,{status:204,headers});}
   else if(request.method!=='POST')early=reply(405,'method_not_allowed');
   else{
    const token=/^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization')??'')?.[1];
    if(!token)throw new ClientOrdersReadFailure(401,'unauthorized');
    if(new TextEncoder().encode(token).byteLength>8192)throw new ClientOrdersReadFailure(400,'invalid_input');
    if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')throw new ClientOrdersReadFailure(415,'unsupported_media_type');
    const checkIdentity=(identity:ClientOrdersReadIdentity)=>{
     try{readUuid(identity.id);readUuid(identity.sessionId);requireValue(identity.is_anonymous===false&&Number.isSafeInteger(identity.expiresAt));}
     catch{throw new ClientOrdersReadFailure(403,'forbidden');}
     if(identity.expiresAt*1000<=Date.now())throw new ClientOrdersReadFailure(401,'session_ended');
    };
    const actor=Object.freeze({...await clientOrdersReadWait(()=>authenticate(token,signal),signal)});checkIdentity(actor);finalIdentity=actor;
    const reauthenticate=async()=>{
     const current=await clientOrdersReadWait(()=>authenticate(token,signal),signal);checkIdentity(current);
     if(current.id!==actor.id||current.sessionId!==actor.sessionId||current.expiresAt!==actor.expiresAt)throw new ClientOrdersReadFailure(403,'forbidden');
    };
    let call:ClientOrdersReadRpcCall;
    try{call=buildClientOrdersReadRpc(await readClientOrdersReadJson(request.body,clientOrdersReadCommandMaxBytes,signal));}
    catch(error){if(error instanceof ClientOrdersReadFailure)throw error;throw new ClientOrdersReadFailure(400,'invalid_input');}
    const execute=async():Promise<ClientOrdersReadView>=>{
     const response=await clientOrdersReadWait(()=>rpc(token,call,signal),signal);
     if(response.error){
      const status=response.error.status;if(status===401||status===403)throw new ClientOrdersReadFailure(status,status===401?'session_ended':'forbidden');
      const code=Object.keys(clientOrdersReadErrorStatuses).find(key=>response.error?.message===`concierge_${key}`);
      throw new ClientOrdersReadFailure(code?clientOrdersReadErrorStatuses[code]:503,code??'unavailable');
     }
     try{return mapClientOrdersReadResult(response.data,call.args.p_command);}catch{throw new ClientOrdersReadFailure(503,'unavailable');}
    };
    result=await execute();await reauthenticate();const current=await execute();
    if(JSON.stringify(current)!==JSON.stringify(result))throw new ClientOrdersReadFailure(409,'basis_conflict');
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
 const denial=clientOrdersReadReceivedDenial(signal);if(denial)return reply(denial.status,denial.code);
 if(signal.aborted||incoming.aborted||Date.now()>=deadline)return reply(503,'unavailable');
 if(finalIdentity&&finalIdentity.expiresAt*1000<=Date.now())return reply(401,'session_ended');
 if(failure!==undefined)return failure instanceof ClientOrdersReadFailure?reply(failure.status,failure.code):reply(503,'unavailable');
 return early??(serialized!==undefined?new Response(serialized,{status:200,headers}):reply(503,'unavailable'));
}
