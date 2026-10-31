import type {ConciergeAuthenticatedPorts} from '../../../src/contracts/ConciergePortal.ts';
import type {ReviewRpcCall,GuidanceRpcCall} from '../../../src/contracts/PortalReview.ts';
import {reviewCommandMaxBytes,reviewErrorStatuses,isPortalReviewRead} from '../../../src/contracts/PortalReviewValues.ts';
import {readUuid} from '../../../src/contracts/ConciergePortalValidation.ts';
import {readConciergeJson} from '../concierge-operations/body.ts';
/** Same retained Auth/transport boundary for the two closed families. */
export async function handleTypedReviewRequest<C extends ReviewRpcCall|GuidanceRpcCall>(request:Request,ports:ConciergeAuthenticatedPorts<C>,build:(value:unknown)=>C,map:(value:unknown,command:C['args']['p_command'])=>unknown):Promise<Response>{
 const headers:Record<string,string>={'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin'};
 const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers}),error=(status:number,code:string)=>reply(status,{code});
 const origin=request.headers.get('origin');if(origin&&!ports.allowedOrigins.includes(origin))return error(403,'origin_forbidden');if(origin)headers['access-control-allow-origin']=origin;
 if(request.method==='OPTIONS'){headers['access-control-allow-methods']='POST, OPTIONS';headers['access-control-allow-headers']='authorization, apikey, content-type';return new Response(null,{status:204,headers});}
 if(request.method!=='POST')return error(405,'method_not_allowed');
 const bearer=/^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization')??'');if(!bearer)return error(401,'unauthorized');
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')return error(415,'unsupported_media_type');
 let call:C|undefined;
 const uncertain=()=>error(503,call&&!isPortalReviewRead(call.args.p_command)?'uncertain':'unavailable');
 try{
  const actor=await ports.authenticate(bearer[1],request.signal);if(!actor)return error(401,'unauthorized');
  try{readUuid(actor.id);}catch{return error(401,'unauthorized');}if(actor.is_anonymous!==false)return error(403,'forbidden');
  try{call=build(await readConciergeJson(request.body,reviewCommandMaxBytes));}catch(cause){return cause instanceof Error&&cause.message==='too_large'?error(413,'too_large'):error(400,'invalid_input');}
  const result=await ports.rpc(bearer[1],call,request.signal);
  if(result.error){
   if(result.error.status===401)return error(401,'session_ended');if(result.error.status===403)return error(403,'forbidden');
   const message=result.error.message??'',code=message.startsWith('concierge_')?message.slice(10):'';
   if(Object.hasOwn(reviewErrorStatuses,code))return error(reviewErrorStatuses[code as keyof typeof reviewErrorStatuses],code);
   return uncertain();
  }
  try{return reply(200,map(result.data,call.args.p_command));}catch{return uncertain();}
 }catch{return uncertain();}
}
