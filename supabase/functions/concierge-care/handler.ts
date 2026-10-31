import type {ConciergeAuthenticatedPorts} from '../../../src/contracts/ConciergePortal.ts';
import type {CareRpcCall} from '../../../src/contracts/PortalCare.ts';
import {buildCareRpc} from '../../../src/contracts/PortalCareValidation.ts';
import {mapCareResult} from '../../../src/contracts/PortalCareMapping.ts';
import {careCommandMaxBytes,careErrorStatuses as errors} from '../../../src/contracts/PortalCareValues.ts';
import {readUuid} from '../../../src/contracts/ConciergePortalValidation.ts';
import {readConciergeJson} from '../concierge-operations/body.ts';
export type CarePorts=ConciergeAuthenticatedPorts<CareRpcCall>;
export async function handleCareRequest(request:Request,ports:CarePorts):Promise<Response>{
 const headers:Record<string,string>={'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin'};
 const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers});
 const error=(status:number,code:string)=>reply(status,{code});
 const origin=request.headers.get('origin');if(origin&&!ports.allowedOrigins.includes(origin))return error(403,'origin_forbidden');if(origin)headers['access-control-allow-origin']=origin;
 if(request.method==='OPTIONS'){headers['access-control-allow-methods']='POST, OPTIONS';headers['access-control-allow-headers']='authorization, apikey, content-type';return new Response(null,{status:204,headers});}
 if(request.method!=='POST')return error(405,'method_not_allowed');
 const bearer=/^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization')??'');if(!bearer)return error(401,'unauthorized');
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')return error(415,'unsupported_media_type');
 let call:CareRpcCall|undefined;
 try{
  const user=await ports.authenticate(bearer[1],request.signal);if(!user)return error(401,'unauthorized');
  try{readUuid(user.id);}catch{return error(401,'unauthorized');}if(user.is_anonymous!==false)return error(403,'forbidden');
  try{call=buildCareRpc(await readConciergeJson(request.body,careCommandMaxBytes));}catch(cause){if(cause instanceof Error&&cause.message==='too_large')return error(413,'too_large');return error(400,'invalid_input');}
  const result=await ports.rpc(bearer[1],call,request.signal);
  if(result.error){
   if(result.error.status===401)return error(401,'session_ended');if(result.error.status===403)return error(403,'forbidden');
   const raw=result.error.message??'',code=raw.startsWith('concierge_')?raw.slice(10):'';
   return Object.hasOwn(errors,code)?error(errors[code],code):error(503,'unavailable');
  }
  try{return reply(200,mapCareResult(result.data,call.args.p_command));}catch{return error(503,'unavailable');}
 }catch{return error(503,call&&call.args.p_command.action!=='request_status_v1'&&'requestId'in call.args.p_command?'uncertain':'unavailable');}
}
