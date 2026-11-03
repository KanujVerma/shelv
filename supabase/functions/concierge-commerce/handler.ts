import type {ConciergeAuthenticatedPorts} from '../../../src/contracts/ConciergePortal.ts';
import type {CommerceRpcCall} from '../../../src/contracts/PortalCommerce.ts';
import {buildCommerceRpc,hashCommerceCommand} from '../../../src/contracts/PortalCommerceValidation.ts';
import {mapCommerceResult} from '../../../src/contracts/PortalCommerceMapping.ts';
import {commerceCommandMaxBytes,commerceErrorStatuses,commerceFailureCode,isCommerceRead} from '../../../src/contracts/PortalCommerceValues.ts';
import {readUuid} from '../../../src/contracts/ConciergePortalValidation.ts';
import {readConciergeJson} from '../concierge-operations/body.ts';
export type CommercePorts=ConciergeAuthenticatedPorts<CommerceRpcCall>;
const errors=new Map(Object.entries(commerceErrorStatuses).map(([code,status])=>['concierge_'+code,{code,status}]));
/** Authenticated finite transport only; business authority and canonical effects remain SQL-owned. */
export async function handleCommerceRequest(request:Request,ports:CommercePorts):Promise<Response>{
 const headers:Record<string,string>={'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin','x-content-type-options':'nosniff'};
 const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers}),error=(status:number,code:string)=>reply(status,{code});
 const origin=request.headers.get('origin');if(origin&&!ports.allowedOrigins.includes(origin))return error(403,'origin_forbidden');if(origin)headers['access-control-allow-origin']=origin;
 if(request.method==='OPTIONS'){headers['access-control-allow-methods']='POST, OPTIONS';headers['access-control-allow-headers']='authorization, apikey, content-type';return new Response(null,{status:204,headers});}
 if(request.method!=='POST')return error(405,'method_not_allowed');
 const token=/^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization')??'')?.[1];if(!token)return error(401,'unauthorized');
 if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')return error(415,'unsupported_media_type');
 let call:CommerceRpcCall|undefined;
 const failed=()=>error(503,call?commerceFailureCode(call.args.p_command.action):'unavailable');
 try{
  const user=await ports.authenticate(token,request.signal);if(!user)return error(401,'unauthorized');let actorId:string;try{actorId=readUuid(user.id).toLowerCase();}catch{return error(401,'unauthorized');}if(user.is_anonymous!==false)return error(403,'forbidden');
  try{call=buildCommerceRpc(await readConciergeJson(request.body,commerceCommandMaxBytes));}catch(cause){return cause instanceof Error&&cause.message==='too_large'?error(413,'too_large'):error(400,'invalid_input');}
  const command=call.args.p_command,requestHash=isCommerceRead(command.action)?null:await hashCommerceCommand(command);
  if(request.signal.aborted)return failed();
  const result=await ports.rpc(token,call,request.signal);
  if(result.error){if(result.error.status===401)return error(401,'session_ended');if(result.error.status===403)return error(403,'forbidden');const safe=errors.get(result.error.message??'');return safe?error(safe.status,safe.code):failed();}
  if(request.signal.aborted)return failed();
  try{return reply(200,mapCommerceResult(command,result.data,{actorId,requestHash}));}catch{return failed();}
 }catch{return failed();}
}
