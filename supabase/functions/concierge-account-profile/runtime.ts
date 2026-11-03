import type {ConciergeTransportConfiguration} from '../concierge-operations/runtime.ts';
import type {AccountProfilePorts,AccountProfileIdentity,AccountProfileRpcCall} from '../../../src/contracts/PortalAccountProfile.ts';
import {buildAccountProfileRpc} from '../../../src/contracts/PortalAccountProfileMapping.ts';
import {readObject,readUuid,requireValue} from '../../../src/contracts/ConciergePortalValidation.ts';
import {accountProfileAuthMaxBytes,accountProfileCommandMaxBytes,accountProfileResultMaxBytes} from '../../../src/contracts/PortalAccountProfileValues.ts';
import {AccountProfileFailure,accountProfileWait,accountProfileReceivedDenial,readAccountProfileJson} from './body.ts';

export function createAccountProfilePorts(config:ConciergeTransportConfiguration):AccountProfilePorts{
 let base:URL;const origins=Object.freeze([...config.allowedOrigins]),key=config.publicKey,send=config.fetch??globalThis.fetch;
 try{
  base=new URL(config.supabaseUrl);requireValue(base.protocol==='https:'&&!base.username&&!base.password&&base.pathname==='/'&&!base.search&&!base.hash&&key.trim().length>0);
  for(const origin of origins){const u=new URL(origin);requireValue(['https:','http:'].includes(u.protocol)&&u.origin===origin);}
 }catch{throw new Error('unavailable');}
 const cleanup=(response:Response)=>{try{void response.body?.cancel().catch(()=>{});}catch{/* Received denial is authoritative without body/statusText/headers. */}};
 const exchange=async(token:string,path:string,method:string,signal:AbortSignal,body?:string)=>{
  if(!signal||signal.aborted)throw new AccountProfileFailure(503,'unavailable');
  let received:Response|undefined;
  try{return await accountProfileWait(()=>{
   // Keep standard Fetch privacy options across DOM and Worker declarations.
   const url=new URL(path,base).href;
   const init:RequestInit & {credentials:'omit'}={method,headers:{authorization:`Bearer ${token}`,apikey:key,'content-type':'application/json'},body,signal,credentials:'omit',redirect:'error',cache:'no-store'};
   return send(url,init).then(response=>{
   // Inspect status at receipt, before any abort check or cleanup body getter.
   const status=response.status;
   if(status===401||status===403){const denial=accountProfileReceivedDenial(signal,status)!;cleanup(response);throw denial;}
   if(signal.aborted)cleanup(response);else received=response;
   return {response,status};
  });},signal);}catch(error){
   // The registered absolute deadline can refuse before its abort timer fires.
   if(received)cleanup(received);
   throw error;
  }
 };
 const decode=async(response:Response,maximum:number,signal:AbortSignal)=>{
  try{return await readAccountProfileJson(response.body,maximum,signal);}catch{throw new AccountProfileFailure(503,'unavailable');}
 };
 return Object.freeze({allowedOrigins:origins,
  authenticate:async(token:string,signal:AbortSignal):Promise<AccountProfileIdentity>=>{
   const {response,status}=await exchange(token,'/auth/v1/user','GET',signal);
   if(status<200||status>=300){cleanup(response);throw new AccountProfileFailure(503,'unavailable');}
   const user=readObject(await decode(response,accountProfileAuthMaxBytes,signal));
   if(user.is_anonymous!==false)throw new AccountProfileFailure(403,'forbidden');
   // Only correlation. Authenticating the actual user and trusted SQL session lookup are mandatory.
   let payload:Record<string,unknown>;
   try{
    const parts=token.split('.'),encoded=parts[1];requireValue(parts.length===3&&typeof encoded==='string'&&encoded.length<=8192&&/^[A-Za-z0-9_-]+$/.test(encoded));
    payload=readObject(JSON.parse(atob(encoded.replace(/-/g,'+').replace(/_/g,'/'))));
    requireValue(payload.role==='authenticated'&&typeof payload.exp==='number'&&Number.isSafeInteger(payload.exp));readUuid(payload.sub);readUuid(payload.session_id);readUuid(user.id);
   }catch{throw new AccountProfileFailure(401,'session_ended');}
   if(String(payload.sub).toLowerCase()!==String(user.id).toLowerCase())throw new AccountProfileFailure(403,'forbidden');
   return Object.freeze({id:String(user.id).toLowerCase(),is_anonymous:false,sessionId:String(payload.session_id).toLowerCase(),expiresAt:payload.exp as number});
  },
  rpc:async(token:string,call:AccountProfileRpcCall,signal:AbortSignal)=>{
   requireValue(call.name==='concierge_account_profile_command_v1');const command=buildAccountProfileRpc(call.args.p_command);
   const body=JSON.stringify(command.args);requireValue(new TextEncoder().encode(JSON.stringify(command.args.p_command)).byteLength<=accountProfileCommandMaxBytes);
   const {response,status}=await exchange(token,'/rest/v1/rpc/concierge_account_profile_command_v1','POST',signal,body);
   const data=await decode(response,accountProfileResultMaxBytes,signal);
   if(status>=200&&status<300)return {data,error:null};
   const message=data!==null&&typeof data==='object'&&!Array.isArray(data)?(data as Record<string,unknown>).message:undefined;
   return {data:null,error:{status,...(typeof message==='string'?{message}:{})}};
  },
 });
}
