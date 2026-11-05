import type {ConciergeAuthenticatedPorts} from '../../../src/contracts/ConciergePortal.ts';
import type {FinalExportRpcCall} from '../../../src/contracts/PortalFinalExport.ts';
import {readUuid} from '../../../src/contracts/ConciergePortalValidation.ts';
import {buildFinalExportRpc,mapFinalExportResult} from '../../../src/contracts/PortalFinalExportMapping.ts';
import {freezeFinalExport} from '../../../src/contracts/PortalFinalExportValidation.ts';
import {finalExportCommandMaxBytes,finalExportErrorStatuses} from '../../../src/contracts/PortalFinalExportValues.ts';
import {readFinalExportJson} from './body.ts';

export type FinalExportPorts=ConciergeAuthenticatedPorts<FinalExportRpcCall>;
export async function handleFinalExportRequest(request:Request,ports:FinalExportPorts):Promise<Response>{
 const origins=[...ports.allowedOrigins],authenticate=ports.authenticate.bind(ports),rpc=ports.rpc.bind(ports);
 const headers:Record<string,string>={'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin'};
 const reply=(status:number,code:string)=>new Response(JSON.stringify({code}),{status,headers});
 const origin=request.headers.get('origin');if(origin&&!origins.includes(origin))return reply(403,'origin_forbidden');if(origin)headers['access-control-allow-origin']=origin;
 if(request.method==='OPTIONS'){headers['access-control-allow-methods']='POST, OPTIONS';headers['access-control-allow-headers']='authorization, apikey, content-type';return new Response(null,{status:204,headers});}
 if(request.method!=='POST')return reply(405,'method_not_allowed');
 const token=/^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization')??'')?.[1];if(!token)return reply(401,'unauthorized');
 if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')return reply(415,'unsupported_media_type');
 try{
  const actor=await authenticate(token,request.signal);if(!actor)return reply(401,'unauthorized');
  try{readUuid(actor.id);}catch{return reply(401,'unauthorized');}if(actor.is_anonymous!==false)return reply(403,'forbidden');
  const owner=actor.id;let call:FinalExportRpcCall;
  try{call=buildFinalExportRpc(await readFinalExportJson(request.body,finalExportCommandMaxBytes));freezeFinalExport(call);}
  catch(e){return reply(e instanceof Error&&e.message==='too_large'?413:400,e instanceof Error&&e.message==='too_large'?'too_large':'invalid_input');}
  if(request.signal.aborted)return reply(503,'unavailable');
  const result=await rpc(token,call,request.signal);
  if(result.error){
   if(result.error.status===401)return reply(401,'session_ended');if(result.error.status===403)return reply(403,'forbidden');
   const raw=result.error.message??'';const error=Object.entries(finalExportErrorStatuses).find(([code])=>raw==='concierge_'+code);return error?reply(error[1],error[0]):reply(503,'unavailable');
  }
  const mapped=mapFinalExportResult(result.data,call.args.p_command);
  const current=await authenticate(token,request.signal);
  if(!current)return reply(401,'session_ended');
  if(current.id!==owner||current.is_anonymous!==false)return reply(403,'forbidden');
  if(request.signal.aborted)return reply(503,'unavailable');
  return new Response(JSON.stringify(mapped),{status:200,headers});
 }catch{return reply(503,'unavailable');}
}
