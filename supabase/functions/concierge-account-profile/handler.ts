import type {AccountProfilePorts,AccountProfileIdentity,AccountProfileResult,AccountProfileRpcCall} from '../../../src/contracts/PortalAccountProfile.ts';
import {buildAccountProfileRpc,mapAccountProfileResult} from '../../../src/contracts/PortalAccountProfileMapping.ts';
import {readUuid,requireValue} from '../../../src/contracts/ConciergePortalValidation.ts';
import {accountProfileCommandMaxBytes,accountProfileErrorStatuses,accountProfileOperationMilliseconds} from '../../../src/contracts/PortalAccountProfileValues.ts';
import {AccountProfileFailure,accountProfileWait,accountProfileReceivedDenial,readAccountProfileJson,setAccountProfileDeadline} from './body.ts';

export async function handleAccountProfileRequest(request:Request,ports:AccountProfilePorts):Promise<Response>{
 // Starts before the first await. No nested call may create a fresh timeout budget.
 const deadline=Date.now()+accountProfileOperationMilliseconds,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),accountProfileOperationMilliseconds);
 const abort=()=>controller.abort();request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)abort();
 const signal=controller.signal,headers:Record<string,string>={'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin'};
 const reply=(status:number,code:string)=>new Response(JSON.stringify({code}),{status,headers});
 try{
  setAccountProfileDeadline(signal,deadline);
  const origins=[...ports.allowedOrigins],authenticate=ports.authenticate.bind(ports),rpc=ports.rpc.bind(ports);
  const origin=request.headers.get('origin');if(origin&&!origins.includes(origin))return reply(403,'origin_forbidden');if(origin)headers['access-control-allow-origin']=origin;
  if(request.method==='OPTIONS'){headers['access-control-allow-methods']='POST, OPTIONS';headers['access-control-allow-headers']='authorization, apikey, content-type';return new Response(null,{status:204,headers});}
  if(request.method!=='POST')return reply(405,'method_not_allowed');
  const token=/^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization')??'')?.[1];if(!token)return reply(401,'unauthorized');
  if(new TextEncoder().encode(token).byteLength>8192)return reply(400,'invalid_input');
  if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')return reply(415,'unsupported_media_type');
  const checkIdentity=(identity:AccountProfileIdentity)=>{
   try{readUuid(identity.id);readUuid(identity.sessionId);requireValue(identity.is_anonymous===false&&Number.isSafeInteger(identity.expiresAt));}
   catch{throw new AccountProfileFailure(403,'forbidden');}
   if(identity.expiresAt*1000<=Date.now())throw new AccountProfileFailure(401,'session_ended');
  };
  const actor=Object.freeze({...await accountProfileWait(()=>authenticate(token,signal),signal)});checkIdentity(actor);
  const reauthenticate=async()=>{
   const current=await accountProfileWait(()=>authenticate(token,signal),signal);checkIdentity(current);
   if(current.id!==actor.id||current.sessionId!==actor.sessionId||current.expiresAt!==actor.expiresAt)throw new AccountProfileFailure(403,'forbidden');
  };
  let call:AccountProfileRpcCall;
  try{call=buildAccountProfileRpc(await readAccountProfileJson(request.body,accountProfileCommandMaxBytes,signal));}
  catch(e){if(e instanceof AccountProfileFailure)throw e;throw new AccountProfileFailure(400,'invalid_input');}
  const execute=async(command:typeof call):Promise<AccountProfileResult>=>{
   const result=await accountProfileWait(()=>rpc(token,command,signal),signal);
   if(result.error){
    const status=result.error.status;if(status===401||status===403)throw new AccountProfileFailure(status,status===401?'session_ended':'forbidden');
    const code=Object.keys(accountProfileErrorStatuses).find(k=>result.error?.message===`concierge_${k}`);
    throw new AccountProfileFailure(code?(accountProfileErrorStatuses[code]??503):503,code??'unavailable');
   }
   try{return mapAccountProfileResult(result.data,command.args.p_command);}catch{throw new AccountProfileFailure(503,'unavailable');}
  };
  const result=await execute(call);
  await reauthenticate();
  const current=await execute(buildAccountProfileRpc({schemaVersion:1,action:'read_account_profile_v1'}));
  if(call.args.p_command.action==='read_account_profile_v1'&&JSON.stringify(current)!==JSON.stringify(result))throw new AccountProfileFailure(409,'basis_conflict');
  await reauthenticate();
  if(signal.aborted||Date.now()>=deadline)throw new AccountProfileFailure(503,'unavailable');checkIdentity(actor);
  // A write returns only its immutable historical receipt; the follow-up read is a return fence.
  return new Response(JSON.stringify(result),{status:200,headers});
 }catch(e){const denial=accountProfileReceivedDenial(signal);if(denial)return reply(denial.status,denial.code);if(signal.aborted)return reply(503,'unavailable');return e instanceof AccountProfileFailure?reply(e.status,e.code):reply(503,'unavailable');}
 finally{clearTimeout(timer);request.signal.removeEventListener('abort',abort);}
}
