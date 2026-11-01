import type {ConciergeAuthenticatedPorts} from '../../../src/contracts/ConciergePortal.ts';
import type {NotificationRpcCall} from '../../../src/contracts/PortalNotification.ts';
import {buildNotificationRpc} from '../../../src/contracts/PortalNotificationValidation.ts';
import {mapNotificationResult} from '../../../src/contracts/PortalNotificationMapping.ts';
import {notificationCommandMaxBytes,notificationErrorStatuses as errors} from '../../../src/contracts/PortalNotificationValues.ts';
import {readUuid} from '../../../src/contracts/ConciergePortalValidation.ts';
import {readConciergeJson} from '../concierge-operations/body.ts';
export type NotificationPorts=ConciergeAuthenticatedPorts<NotificationRpcCall>;
export async function handleNotificationRequest(request:Request,ports:NotificationPorts):Promise<Response>{
 const headers:Record<string,string>={'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin'};
 const reply=(status:number,v:unknown)=>new Response(JSON.stringify(v),{status,headers});const error=(status:number,code:string)=>reply(status,{code});
 const origin=request.headers.get('origin');if(origin&&!ports.allowedOrigins.includes(origin))return error(403,'origin_forbidden');if(origin)headers['access-control-allow-origin']=origin;
 if(request.method==='OPTIONS'){headers['access-control-allow-methods']='POST, OPTIONS';headers['access-control-allow-headers']='authorization, apikey, content-type';return new Response(null,{status:204,headers});}
 if(request.method!=='POST')return error(405,'method_not_allowed');
 const bearer=/^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization')??'');const token=bearer?.[1];if(!token)return error(401,'unauthorized');
 if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')return error(415,'unsupported_media_type');
 let writing=false;
 try{
  const user=await ports.authenticate(token,request.signal);if(!user)return error(401,'unauthorized');
  try{readUuid(user.id);}catch{return error(401,'unauthorized');}if(user.is_anonymous!==false)return error(403,'forbidden');
  let call:NotificationRpcCall;
  try{call=buildNotificationRpc(await readConciergeJson(request.body,notificationCommandMaxBytes));}catch(cause){return cause instanceof Error&&cause.message==='too_large'?error(413,'too_large'):error(400,'invalid_input');}
  writing=call.args.p_command.action==='mark_seen_v1'||call.args.p_command.action==='retry_failed_email_v1';
  const result=await ports.rpc(token,call,request.signal);
  // Native Auth recheck supplements, never replaces, transactional SQL session/rights checks.
  const current=await ports.authenticate(token,request.signal);if(!current||current.id!==user.id||current.is_anonymous!==false||request.signal.aborted)return error(401,'session_ended');
  if(result.error){if(result.error.status===401)return error(401,'session_ended');if(result.error.status===403)return error(403,'forbidden');const raw=result.error.message??'',code=raw.startsWith('concierge_')?raw.slice(10):'';return Object.hasOwn(errors,code)?error(errors[code]!,code):error(503,writing?'uncertain':'unavailable');}
  try{return reply(200,mapNotificationResult(result.data,call.args.p_command));}catch{return error(503,writing?'uncertain':'unavailable');}
 }catch{return error(503,writing?'uncertain':'unavailable');}
}
