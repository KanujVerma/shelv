import type {ConciergeAuthenticatedPorts} from '../../../src/contracts/ConciergePortal.ts';
import type {CommerceRpcCall} from '../../../src/contracts/PortalCommerce.ts';
import {buildCommerceRpc,hashCommerceCommand} from '../../../src/contracts/PortalCommerceValidation.ts';
import {mapCommerceResult} from '../../../src/contracts/PortalCommerceMapping.ts';
import {commerceCommandMaxBytes,commerceErrorStatuses,commerceFailureCode,isCommerceRead} from '../../../src/contracts/PortalCommerceValues.ts';
import {readUuid} from '../../../src/contracts/ConciergePortalValidation.ts';
import {commerceOperation,commerceAvailable,commerceWait,readCommerceJson} from './body.ts';
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
 const operation=commerceOperation(request.signal);
 try{
  commerceAvailable(operation);
  // Actual retained-factory ports bound transport settlement. Preserve a
  // received denial while their finite local decoder completes.
  const user=await ports.authenticate(token,operation.signal);
  if(!user)return error(401,'unauthorized');commerceAvailable(operation);
  let actorId:string;try{actorId=readUuid(user.id).toLowerCase();}catch{return error(401,'unauthorized');}if(user.is_anonymous!==false)return error(403,'forbidden');
  try{call=buildCommerceRpc(await readCommerceJson(request.body,commerceCommandMaxBytes,operation));}catch(cause){commerceAvailable(operation);return cause instanceof Error&&cause.message==='too_large'?error(413,'too_large'):error(400,'invalid_input');}
  const command=call.args.p_command,requestHash=isCommerceRead(command.action)?null:await commerceWait(()=>hashCommerceCommand(command),operation);
  commerceAvailable(operation);
  const result=await ports.rpc(token,call,operation.signal);
  if(result.error?.status===401)return error(401,'session_ended');if(result.error?.status===403)return error(403,'forbidden');
  commerceAvailable(operation);
  if(result.error){const safe=errors.get(result.error.message??'');return safe?error(safe.status,safe.code):failed();}
  const encoded=JSON.stringify(mapCommerceResult(command,result.data,{actorId,requestHash}));
  commerceAvailable(operation);return new Response(encoded,{status:200,headers});
 }catch{return failed();}
}
