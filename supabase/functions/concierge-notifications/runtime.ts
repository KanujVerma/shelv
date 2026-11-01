import type {ConciergeTransportConfiguration} from '../concierge-operations/runtime.ts';
import type {NotificationPorts} from './handler.ts';
import {readConciergeJson} from '../concierge-operations/body.ts';
import {readObject,readUuid,requireValue} from '../../../src/contracts/ConciergePortalValidation.ts';
import {notificationResponseMaxBytes} from '../../../src/contracts/PortalNotificationValues.ts';
/** Fixed public-key/caller-bearer transport. No service credential or RPC selector in a command. */
export function createNotificationPorts(config:ConciergeTransportConfiguration):NotificationPorts{
 const base=new URL(config.supabaseUrl);requireValue(base.protocol==='https:'&&base.pathname==='/'&&!base.username&&!base.password&&!base.search&&!base.hash&&config.publicKey.trim().length>0);
 const allowedOrigins=[...config.allowedOrigins];for(const o of allowedOrigins)requireValue(new URL(o).origin===o);
 const send=config.fetch??globalThis.fetch;
 const options=(token:string,signal?:AbortSignal):RequestInit=>({headers:{authorization:`Bearer ${token}`,apikey:config.publicKey,'content-type':'application/json'},redirect:'error',cache:'no-store',credentials:'omit',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)});
 return {allowedOrigins,authenticate:async(token,signal)=>{
  const r=await send(new URL('/auth/v1/user',base),{...options(token,signal),method:'GET'});
  if(r.status===401||r.status===403){await r.body?.cancel();return null;}requireValue(r.ok);const u=readObject(await readConciergeJson(r.body,8192));requireValue(typeof u.is_anonymous==='boolean');return {id:readUuid(u.id),is_anonymous:u.is_anonymous};
 },rpc:async(token,call,signal)=>{
  requireValue(call.name==='concierge_notification_command_v1');const r=await send(new URL('/rest/v1/rpc/concierge_notification_command_v1',base),{...options(token,signal),method:'POST',body:JSON.stringify(call.args)});
  const data=await readConciergeJson(r.body,notificationResponseMaxBytes);
  if(r.ok)return {data,error:null};const e=readObject(data);return {data:null,error:{status:r.status,...(typeof e.message==='string'?{message:e.message}:{})}};
 }};
}
