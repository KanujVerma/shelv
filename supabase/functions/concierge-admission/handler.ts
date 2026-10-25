import {admissionEmail,mapAdmissionReceipt,parseAdmissionCommand,type AdmissionIdentity} from '../../../src/contracts/ConciergeAdmission.ts';
import {readObject,readUuid,requireValue} from '../../../src/contracts/ConciergePortalValidation.ts';
import {readConciergeJson} from '../concierge-operations/body.ts';

export type AdmissionPorts={
 allowedOrigins:readonly string[];
 authenticate(token:string,signal?:AbortSignal):Promise<{id:string;is_anonymous:boolean}|null>;
 rpc(token:string,name:'concierge_admission_capabilities'|'concierge_admission_begin'|'concierge_admission_status',args:object,signal?:AbortSignal):Promise<unknown>;
 getIdentity(id:string,signal?:AbortSignal):Promise<AdmissionIdentity|null>;
 createIdentity(id:string,email:string,signal?:AbortSignal):Promise<AdmissionIdentity>;
 finish(actorId:string,requestId:string,signal?:AbortSignal):Promise<unknown>;
};
const errors:Record<string,number>={invalid_input:400,too_large:413,concierge_admission_forbidden:403,concierge_admission_session_ended:401,concierge_admission_conflict:409,concierge_admission_not_found:404,concierge_admission_pending:503};
/** Administrative identity creation is confined to these fixed server ports. No email API is present. */
export async function handleAdmissionRequest(request:Request,ports:AdmissionPorts):Promise<Response>{
 const headers:Record<string,string>={'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin'};
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
 const origin=request.headers.get('origin');if(origin&&!ports.allowedOrigins.includes(origin))return reply(403,{code:'origin_forbidden'});
 if(origin)headers['access-control-allow-origin']=origin;
 if(request.method==='OPTIONS'){headers['access-control-allow-headers']='authorization, apikey, content-type';headers['access-control-allow-methods']='POST, OPTIONS';return new Response(null,{status:204,headers});}
 if(request.method!=='POST')return reply(405,{code:'method_not_allowed'});
 const bearer=/^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization')??'');if(!bearer)return reply(401,{code:'unauthorized'});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')return reply(415,{code:'unsupported_media_type'});
 let validatedInput=false;
 try{
  const command=parseAdmissionCommand(await readConciergeJson(request.body,4096));validatedInput=true;
  const actor=await ports.authenticate(bearer[1],request.signal);if(!actor)return reply(401,{code:'unauthorized'});readUuid(actor.id);if(actor.is_anonymous!==false)return reply(403,{code:'forbidden'});
  if(command.action==='capabilities'){const capabilities=readObject(await ports.rpc(bearer[1],'concierge_admission_capabilities',{},request.signal));requireValue(typeof capabilities.canAddClient==='boolean');return reply(200,{canAddClient:capabilities.canAddClient});}
  if(command.action==='admission_status'){
   const status=readObject(await ports.rpc(bearer[1],'concierge_admission_status',{p_request_id:command.requestId},request.signal));requireValue(status.requestId===command.requestId&&(status.status==='pending'||status.status==='ready'));
   return reply(200,{requestId:command.requestId,status:status.status,client:status.status==='ready'?mapAdmissionReceipt(status.client):null});
  }
  const intent=readObject(await ports.rpc(bearer[1],'concierge_admission_begin',{p_request_id:command.requestId,p_email:command.email,p_display_name:command.displayName},request.signal));
  if(intent.state==='complete')return reply(200,mapAdmissionReceipt(intent.receipt));
  requireValue(intent.state==='needs_identity'||intent.state==='identity_ready');const targetId=readUuid(intent.targetId),email=admissionEmail(intent.email);requireValue(email===command.email);
  if(intent.state==='needs_identity'){
   const identity=await ports.getIdentity(targetId,request.signal)??await ports.createIdentity(targetId,email,request.signal);
   if(identity.id!==targetId||admissionEmail(identity.email)!==email||identity.is_anonymous!==false)throw Error('concierge_admission_conflict');
  }
  const receipt=mapAdmissionReceipt(await ports.finish(actor.id,command.requestId,request.signal));requireValue(receipt.requestId===command.requestId&&receipt.clientId===targetId&&receipt.email===email);
  return reply(200,receipt);
 }catch(error){const reason=error instanceof Error?error.message:'',code=validatedInput&&reason==='invalid_input'?'unavailable':reason;return reply(errors[code]??503,{code:Object.hasOwn(errors,code)?code:'unavailable'});}
}
