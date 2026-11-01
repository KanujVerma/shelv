// Closed synthetic HTTP; actual notification runtime/handler/Root/session implementations.
// No SQL/Auth service, authority predicate override, admitted cookie channel, or provider send.
import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {setImmediate as nextTurn} from 'node:timers/promises';
import {handleNotificationRequest} from '../supabase/functions/concierge-notifications/handler.ts';
import {createNotificationPorts} from '../supabase/functions/concierge-notifications/runtime.ts';
import {readNotificationCommand} from '../src/contracts/PortalNotificationValidation.ts';
import {decodeNotificationResponse,mapNotificationResult} from '../src/contracts/PortalNotificationMapping.ts';
import type {NotificationCommand} from '../src/contracts/PortalNotification.ts';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {clientCookieRequest} from '../apps/portal/src/app/retained.ts';
const originalFetch=globalThis.fetch;before(()=>{globalThis.fetch=async()=>{throw Error('global_external_fetch_denied');};});after(()=>{globalThis.fetch=originalFetch;});
const id='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002';
const read=readNotificationCommand({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:1});
const write=readNotificationCommand({schemaVersion:1,action:'mark_seen_v1',requestId:id,deliveryId:id,expectedRevision:0});
const page={schemaVersion:1,consistency:'live_keyset',observedAt:'2026-11-01T00:00:00Z',cursor:null,items:[],nextCursor:null};
const receipt={requestId:id,action:'mark_seen_v1',deliveryId:id,previousRevision:0,revision:1,recordedAt:'2026-11-01T00:00:00Z',effect:'seen'};
type Mode='valid'|'empty'|'html'|'oversized'|'stream-error'|'cancel-reject'|'cancel-pending';
function response(status:number,mode:Mode,onCancel?:()=>void):Response{
 if(mode==='valid')return Response.json({message:`concierge_${status===401?'session_ended':status===403?'forbidden':'unavailable'}`},{status});
 if(mode==='stream-error')return new Response(new ReadableStream<Uint8Array>({start(c){c.error(Error('PRIVATE upstream stream'));}}),{status});
 if(mode==='cancel-reject'||mode==='cancel-pending')return new Response(new ReadableStream<Uint8Array>({start(c){c.enqueue(new TextEncoder().encode('<html>PRIVATE</html>'));c.close();},cancel(){onCancel?.();if(mode==='cancel-reject')throw Error('PRIVATE cancel rejected');return new Promise<void>(()=>{});}}),{status});
 return new Response(mode==='empty'?'':mode==='oversized'?'x'.repeat(100001):'<html>PRIVATE upstream</html>',{status});
}
function request(command:NotificationCommand,signal?:AbortSignal){return new Request('https://edge.synthetic.invalid',{method:'POST',headers:{authorization:'Bearer SYNTHETIC-token','content-type':'application/json'},body:JSON.stringify(command),...(signal?{signal}:{})});}
function boundary(command:NotificationCommand,rpc:()=>Response|Promise<Response>,finalAuth:()=>Response|Promise<Response>=()=>Response.json({id,is_anonymous:false})){
 let auth=0,calls=0;
 const ports=createNotificationPorts({supabaseUrl:'https://notification.synthetic.invalid',publicKey:'SYNTHETIC-public',allowedOrigins:[],fetch:async(input,init)=>{
  const url=new URL(String(input));assert.equal(url.origin,'https://notification.synthetic.invalid');assert.equal(new Headers(init?.headers).get('authorization'),'Bearer SYNTHETIC-token');assert.equal(init?.redirect,'error');
  if(url.pathname==='/auth/v1/user'){auth++;return auth===1?Response.json({id,is_anonymous:false}):finalAuth();}
  assert.equal(url.pathname,'/rest/v1/rpc/concierge_notification_command_v1');assert.deepEqual(JSON.parse(String(init?.body)),{p_command:command});calls++;return rpc();
 }});
 return {ports,counts:()=>({auth,rpc:calls})};
}
async function call(command:NotificationCommand,b:ReturnType<typeof boundary>,signal?:AbortSignal){const r=await handleNotificationRequest(request(command,signal),b.ports),body=await r.json();assert.doesNotMatch(JSON.stringify(body),/PRIVATE|password|sql|provider/);return {status:r.status,body,outcome:decodeNotificationResponse(command,r.status,body),counts:b.counts()};}
for(const status of [401,403])test(`known RPC${status} survives all five original body forms with final exact identity recheck`,async()=>{
 for(const mode of ['valid','empty','html','oversized','stream-error'] as const)for(const command of [read,write]){
  const r=await call(command,boundary(command,()=>response(status,mode)));assert.equal(r.status,status,`${mode}/${command.action}`);assert.deepEqual(r.body,{code:status===401?'session_ended':'forbidden'});assert.equal(r.outcome.state,'rejected');assert.deepEqual(r.counts,{auth:2,rpc:1});
 }
});
test('rejected or pending authority-body cancellation cannot replace the denial or block its final Auth check',async()=>{
 for(const status of [401,403])for(const mode of ['cancel-reject','cancel-pending'] as const)for(const command of [read,write]){
  let cancelled=0;const b=boundary(command,()=>response(status,mode,()=>{cancelled++;}));const pending=call(command,b);
  const r=await Promise.race([pending,nextTurn().then(()=>{throw Error('authority denial waited for body cancellation');})]);
  assert.equal(r.status,status);assert.equal(cancelled,1);assert.deepEqual(r.counts,{auth:2,rpc:1});
 }
});
test('known final Auth denial survives its own rejected body cancellation and suppresses the original RPC status',async()=>{
 for(const upstream of [401,403])for(const authStatus of [401,403]){
  const r=await call(write,boundary(write,()=>response(upstream,'empty'),()=>response(authStatus,'cancel-reject')));assert.equal(r.status,401);assert.deepEqual(r.body,{code:'session_ended'});
 }
});
test('confirmed final changed identity or anonymity always denies before returning an RPC result or denial',async()=>{
 for(const auth of [{id:other,is_anonymous:false},{id,is_anonymous:true}])for(const upstream of [401,403,200]){
  const r=await call(write,boundary(write,()=>upstream===200?Response.json(receipt):response(upstream,'empty'),()=>Response.json(auth)));assert.equal(r.status,401);assert.deepEqual(r.body,{code:'session_ended'});
 }
});
test('an unverifiable final Auth body or transport cannot erase an already known authority denial',async()=>{
 const authResponses=[()=>Response.json({is_anonymous:false}),()=>Response.json({id:'invalid',is_anonymous:false}),()=>Response.json({id}),()=>Response.json({id,is_anonymous:null}),()=>new Response('<html>PRIVATE auth</html>'),()=>{throw Error('PRIVATE auth lost');}];
 for(const upstream of [401,403])for(const auth of authResponses){const r=await call(write,boundary(write,()=>response(upstream,'empty'),auth));assert.equal(r.status,upstream);assert.deepEqual(r.body,{code:upstream===401?'session_ended':'forbidden'});assert.deepEqual(r.counts,{auth:2,rpc:1});}
});
test('abort before or during final Auth prevents even a signal-ignoring fetcher from returning a result',async()=>{
 for(const upstream of [401,403,200])for(const phase of ['before-auth','during-auth'] as const){
  const controller=new AbortController(),b=boundary(write,()=>{if(phase==='before-auth')controller.abort();return upstream===200?Response.json(receipt):response(upstream,'empty');},()=>{controller.abort();throw new DOMException('PRIVATE aborted','AbortError');});
  const r=await call(write,b,controller.signal);assert.equal(r.status,401);assert.deepEqual(r.body,{code:'session_ended'});
 }
 const controller=new AbortController(),b=boundary(write,()=>{controller.abort();throw new DOMException('PRIVATE rpc aborted','AbortError');});const r=await call(write,b,controller.signal);assert.equal(r.status,401);
});
test('valid bounded success survives while malformed200 and lost503 writes retain their original uncertainty',async()=>{
 for(const [command,value] of [[read,page],[write,receipt]] as const){const r=await call(command,boundary(command,()=>Response.json(value)));assert.equal(r.status,200);assert.deepEqual(r.body,value);assert.equal(r.outcome.state,'ok');assert.deepEqual(r.counts,{auth:2,rpc:1});}
 for(const status of [200,503])for(const mode of ['valid','empty','html','oversized','stream-error'] as const)for(const command of [read,write]){
  const r=await call(command,boundary(command,()=>response(status,mode)));assert.equal(r.status,503);assert.equal(r.outcome.state,command===write?'uncertain':'rejected');
 }
 const lost=await call(write,boundary(write,()=>{throw Error('PRIVATE rpc lost');}));assert.deepEqual(lost.body,{code:'uncertain'});assert.equal(lost.outcome.state,'uncertain');
 const finalAuthLost=await call(write,boundary(write,()=>Response.json(receipt),()=>{throw Error('PRIVATE final auth lost');}));assert.equal(finalAuthLost.status,503);assert.equal(finalAuthLost.outcome.state,'uncertain');
});
test('known denial does not depend on a locked body and cancellation reentrancy still encounters the current identity/abort fence',async()=>{
 for(const status of [401,403])for(const command of [read,write]){const r=await call(command,boundary(command,()=>new Response(null,{status})));assert.equal(r.status,status);assert.deepEqual(r.counts,{auth:2,rpc:1});}
 const locked=response(403,'html'),reader=locked.body!.getReader();
 try{const r=await call(write,boundary(write,()=>locked));assert.equal(r.status,403);assert.deepEqual(r.counts,{auth:2,rpc:1});}finally{reader.releaseLock();}
 let finalId=id;const changed=await call(write,boundary(write,()=>response(403,'cancel-reject',()=>{finalId=other;}),()=>Response.json({id:finalId,is_anonymous:false})));assert.equal(changed.status,401);
 const controller=new AbortController(),aborted=await call(write,boundary(write,()=>response(403,'cancel-reject',()=>controller.abort())),controller.signal);assert.equal(aborted.status,401);
});
test('other finite errors keep their safe code/status and private upstream text never reaches the caller',async()=>{
 const conflict=await call(write,boundary(write,()=>Response.json({message:'concierge_request_conflict'},{status:400})));assert.deepEqual({status:conflict.status,body:conflict.body},{status:409,body:{code:'request_conflict'}});
 const privateError=await call(write,boundary(write,()=>Response.json({message:'PRIVATE SQL and password'},{status:400})));assert.equal(privateError.status,503);assert.equal(privateError.outcome.state,'uncertain');
});
function withLock<T>(name:string,callback:LockGrantedCallback<T>):Promise<Awaited<T>>;
function withLock<T>(name:string,options:LockOptions,callback:LockGrantedCallback<T>):Promise<Awaited<T>>;
async function withLock<T>(_name:string,options:LockOptions|LockGrantedCallback<T>,callback?:LockGrantedCallback<T>):Promise<Awaited<T>>{const run=typeof options==='function'?options:callback;assert.ok(run);if(typeof options!=='function'&&options.signal?.aborted)throw new DOMException('aborted','AbortError');return await run(null);}
test('actual retained session reports403 rejection for every denied body without admitting a notification cookie channel',async()=>{
 for(const mode of ['valid','empty','html','oversized','stream-error'] as const){
  const session=createApplicationSession({audience:'client',locks:{request:withLock},fetcher:async(input)=>{assert.equal(String(input),'/api/client/session');return Response.json({signedIn:true,ownerId:id,generation:1,csrf:'SYNTHETIC-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});}});
  try{await session.restore();assert.throws(()=>clientCookieRequest('notifications' as never,session.cookie));const b=boundary(write,()=>response(403,mode));const operation=session.transport.bind({kind:'write',invoke:async(command:NotificationCommand,{signal})=>{const r=await handleNotificationRequest(request(command,signal),b.ports);if(!r.ok)throw {status:r.status};return r.json();},decode:v=>mapNotificationResult(v,write)});
   await assert.rejects(operation.execute(write),(e:unknown)=>{assert.equal((e as {status:number}).status,403);assert.equal((e as {outcome:string}).outcome,'rejected');return true;});
  }finally{session.dispose();}
 }
});
test('actual cookie HTTP owner replacement or loss of the signed-in role discards the old generic operation',async()=>{
 for(const loss of ['owner','signed-in-role'] as const){
  let changed=false;
  const session=createApplicationSession({audience:'client',locks:{request:withLock},fetcher:async(input)=>{assert.equal(String(input),'/api/client/session');return changed&&loss==='signed-in-role'?Response.json({signedIn:false}):Response.json({signedIn:true,ownerId:changed?other:id,generation:changed?2:1,csrf:changed?'SYNTHETIC-new-csrf':'SYNTHETIC-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});}});
  try{
   await session.restore();const captured=session.getSnapshot().boundary;assert.ok(captured?.isCurrent());
   const b=boundary(write,async()=>{changed=true;await session.restore();return response(403,'empty');});
   const operation=session.transport.bind({kind:'write',invoke:async(command:NotificationCommand,{signal})=>{const r=await handleNotificationRequest(request(command,signal),b.ports);if(!r.ok)throw {status:r.status};return r.json();},decode:v=>mapNotificationResult(v,write)});
   await assert.rejects(operation.execute(write),(e:unknown)=>(e as {status:number}).status===401);assert.equal(captured?.isCurrent(),false);
   if(loss==='signed-in-role'){assert.equal(session.cookie.identity,null);assert.equal(session.getSnapshot().boundary,null);}else assert.equal(session.cookie.identity?.ownerId,other);
  }finally{session.dispose();}
 }
});
