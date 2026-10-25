import {admissionEmail,type AdmissionIdentity} from '../../../src/contracts/ConciergeAdmission.ts';
import {readObject,readUuid,requireValue} from '../../../src/contracts/ConciergePortalValidation.ts';
import {createConciergeAuthenticatedPorts} from '../concierge-operations/runtime.ts';
import {readConciergeJson} from '../concierge-operations/body.ts';
import type {AdmissionPorts} from './handler.ts';

type AdmissionRpc={name:'concierge_admission_capabilities'|'concierge_admission_begin'|'concierge_admission_status';args:object};
type Config={supabaseUrl:string;publicKey:string;serviceKey:string;allowedOrigins:readonly string[];fetch?:typeof globalThis.fetch};
export function createAdmissionPorts(config:Config):AdmissionPorts{
 const base=new URL(config.supabaseUrl);requireValue(base.protocol==='https:'&&base.pathname==='/'&&!base.username&&!base.password&&!base.search&&!base.hash&&config.serviceKey.trim().length>0);
 const shared=createConciergeAuthenticatedPorts<AdmissionRpc>({...config,allowedRpcNames:['concierge_admission_capabilities','concierge_admission_begin','concierge_admission_status']});
 const send=config.fetch??globalThis.fetch;
 const administrative=async(path:string,method:string,body:unknown,signal?:AbortSignal)=>{
  const response=await send(new URL(path,base),{method,headers:{apikey:config.serviceKey,authorization:'Bearer '+config.serviceKey,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),credentials:'omit',redirect:'error',cache:'no-store',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)});
  let data:unknown;try{data=await readConciergeJson(response.body,65536);}catch{throw Error('unavailable');}
  if(!response.ok){
   const value=data&&typeof data==='object'?data as Record<string,unknown>:{};
   const allowed=['concierge_admission_forbidden','concierge_admission_session_ended','concierge_admission_conflict','concierge_admission_not_found','concierge_admission_pending'];
   if(typeof value.message==='string'&&allowed.includes(value.message))throw Error(value.message);
   if(method==='GET'&&response.status===404)return null;
   if(method==='POST'&&path==='/auth/v1/admin/users'&&[409,422].includes(response.status))throw Error('concierge_admission_conflict');
   throw Error('unavailable');
  }
  return data;
 };
 const identity=(raw:unknown):AdmissionIdentity=>{const value=readObject(raw);requireValue(typeof value.is_anonymous==='boolean');return{id:readUuid(value.id),email:admissionEmail(value.email),is_anonymous:value.is_anonymous};};
 return{
  allowedOrigins:shared.allowedOrigins,authenticate:shared.authenticate,
  rpc:async(token,name,args,signal)=>{const result=await shared.rpc(token,{name,args},signal);if(result.error)throw Error(result.error.status===401?'concierge_admission_session_ended':result.error.message??'unavailable');return result.data;},
  getIdentity:async(id,signal)=>{const data=await administrative('/auth/v1/admin/users/'+readUuid(id),'GET',undefined,signal);return data===null?null:identity(data);},
  createIdentity:async(id,email,signal)=>identity(await administrative('/auth/v1/admin/users','POST',{id:readUuid(id),email:admissionEmail(email),email_confirm:false},signal)),
  finish:(actorId,requestId,signal)=>administrative('/rest/v1/rpc/concierge_admission_finish','POST',{p_actor_id:readUuid(actorId),p_request_id:readUuid(requestId)},signal),
 };
}
