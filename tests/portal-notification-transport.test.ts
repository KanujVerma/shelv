import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-ignore retained JavaScript is exercised directly
import {createClientCookieRequest} from '../apps/portal/site/auth/client-cookie-session.js';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {createNotificationRequest} from '../apps/portal/src/app/notification-request.ts';
import type {NotificationCommand} from '../src/contracts/PortalNotification.ts';

globalThis.fetch=async()=>{throw new Error('global_network_denied');};
const owner='11111111-1111-4111-8111-111111111111';
const command={schemaVersion:1 as const,action:'list_inbox_v1' as const,cursor:null,limit:5};
const page={schemaVersion:1,consistency:'live_keyset',observedAt:'2026-11-01T12:00:00.000Z',cursor:null,items:[],nextCursor:null};

test('actual retained client admits only the notification channel and sends the detached list',async()=>{
 const paths:string[]=[];
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_name:unknown,_options:unknown,callback:()=>unknown)=>callback()} as unknown as Pick<LockManager,'request'>,fetcher:async(input,init)=>{
  paths.push(String(input));
  if(input==='/api/client/session')return Response.json({signedIn:true,ownerId:owner,generation:1,capabilities:{view:true,edit:false,publish:false,confirmPayments:false},csrf:'synthetic-csrf',idleExpiresAt:'2090-01-01T00:00:00Z',absoluteExpiresAt:'2090-01-02T00:00:00Z'});
  assert.equal(input,'/api/client/notifications');assert.equal(new Headers(init?.headers).get('X-Shelv-CSRF'),'synthetic-csrf');assert.deepEqual(JSON.parse(String(init?.body)),command);return Response.json(page);
 }});
 try{await runtime.restore();const request=createClientCookieRequest('notifications',runtime.cookie);assert.deepEqual(await request(command),page);const api=createNotificationRequest(runtime);assert.equal(api.isCurrent(),true);assert.deepEqual(await api.execute(command),page);api.dispose();assert.equal(api.isCurrent(),false);await assert.rejects(api.execute(command),{status:401});assert.deepEqual(paths,['/api/client/session','/api/client/notifications','/api/client/notifications']);}
 finally{runtime.dispose();}
});

const mark={schemaVersion:1 as const,action:'mark_seen_v1' as const,requestId:'22222222-2222-4222-8222-222222222222',deliveryId:'33333333-3333-4333-8333-333333333333',expectedRevision:4};
const receipt={requestId:mark.requestId,action:mark.action,deliveryId:mark.deliveryId,previousRevision:4,revision:5,recordedAt:'2026-11-01T12:00:00.000Z',effect:'seen'};
async function fixture(audience:'client'|'advisor',reply:(c:NotificationCommand)=>Response|Promise<Response>,edit=false){
 const sent:NotificationCommand[]=[];
 let sessionPatch:Record<string,unknown>={};
 const runtime=createApplicationSession({audience,locks:{request:async(_name:unknown,_options:unknown,callback:()=>unknown)=>callback()} as unknown as Pick<LockManager,'request'>,fetcher:async(input,init)=>{
  if(input===`/api/${audience}/session`)return Response.json({signedIn:true,ownerId:owner,generation:1,capabilities:{view:true,edit,publish:false,confirmPayments:false},csrf:'synthetic-csrf',idleExpiresAt:'2090-01-01T00:00:00Z',absoluteExpiresAt:'2090-01-02T00:00:00Z',...sessionPatch});
  assert.equal(input,`/api/${audience}/notifications`);const c=JSON.parse(String(init?.body)) as NotificationCommand;sent.push(c);return reply(c);
 }});await runtime.restore();return {runtime,sent,api:createNotificationRequest(runtime),restoreWith(patch:Record<string,unknown>){sessionPatch=patch;return runtime.restore();}};
}
test('VIEW-only client and advisor can mark seen and observe the exact original receipt',async()=>{
 for(const audience of ['client','advisor'] as const){const f=await fixture(audience,c=>Response.json(c.action==='request_status_v1'?{status:'committed',receipt}:receipt));try{
  assert.deepEqual(await f.api.execute(mark),receipt);assert.deepEqual(await f.api.execute({schemaVersion:1,action:'request_status_v1',original:mark}),{status:'committed',receipt});assert.deepEqual(f.sent,[mark,{schemaVersion:1,action:'request_status_v1',original:mark}]);
 }finally{f.runtime.dispose();}}
});
test('client staff actions and advisor retry/status require their exact capability before egress',async()=>{
 for(const audience of ['client','advisor'] as const){const f=await fixture(audience,()=>{throw Error('must_not_dispatch');});try{
  const retry={...mark,action:'retry_failed_email_v1' as const};
  await assert.rejects(f.api.execute(retry),{status:403});await assert.rejects(f.api.execute({schemaVersion:1,action:'request_status_v1',original:retry}),{status:403});
  if(audience==='client')await assert.rejects(f.api.execute({schemaVersion:1,action:'read_event_deliveries_v1',eventId:owner,cursor:null,limit:1}),{status:403});
  assert.equal(f.sent.length,0);
 }finally{f.runtime.dispose();}}
});
test('deny-only relevance requires literal true and throws never permit dispatch',async()=>{
 for(const isApplicable of [()=>false,()=>0,()=>({}),()=>{throw Error('private_callback');}]){
  const f=await fixture('client',()=>{throw Error('must_not_dispatch');});try{await assert.rejects(f.api.execute(mark,{isApplicable:isApplicable as ()=>boolean}),{status:503,outcome:'uncertain'});assert.equal(f.sent.length,0);}finally{f.runtime.dispose();}
 }
});
test('malformed success remains uncertain with a detached exact original and unknown never becomes absent',async()=>{
 const f=await fixture('client',c=>Response.json(c.action==='request_status_v1'?{status:'unknown'}:{...receipt,privateNotes:'PRIVATE'}));try{
  const input={...mark};await assert.rejects(f.api.execute(input),e=>{assert.equal((e as {status:number}).status,503);assert.deepEqual((e as {original:unknown}).original,mark);assert.notEqual((e as {original:unknown}).original,input);return true;});
  await f.runtime.restore();assert.deepEqual(await f.api.execute({schemaVersion:1,action:'request_status_v1',original:mark}),{status:'unknown'});assert.equal(f.sent.length,2);
 }finally{f.runtime.dispose();}
});
test('notification cookie boundary preserves malformed401/403 bodies without waiting for disposal',async()=>{
 for(const status of [401,403])for(const body of [null,'','<html>PRIVATE</html>','x'.repeat(100001)]){
  const f=await fixture('client',()=>new Response(body,{status}));try{await assert.rejects(f.api.execute(mark),{status});}finally{f.runtime.dispose();}
 }
 for(const status of [401,403]){
  const f=await fixture('client',()=>new Response(new ReadableStream({cancel(){return new Promise(()=>{});}}),{status}));try{await assert.rejects(f.api.execute(mark),{status});}finally{f.runtime.dispose();}
 }
});
test('response byte cap applies before decode, while exact100000-byte whitespace padding is accepted',async()=>{
 const raw=JSON.stringify(page);
 for(const bytes of [100000,100001]){const f=await fixture('client',()=>new Response(' '.repeat(bytes-raw.length)+raw));try{
  if(bytes===100000)assert.deepEqual(await f.api.execute(command),page);else await assert.rejects(f.api.execute(command),{status:503});
 }finally{f.runtime.dispose();}}
});
test('serialization and relevance callbacks cannot smuggle a retired actor',async()=>{
 for(const stage of ['serialization','relevance']){const f=await fixture('client',()=>{throw Error('must_not_dispatch');});try{
  const c=stage==='serialization'?{toJSON(){f.runtime.cookie._end();return mark;}}:mark;
  await assert.rejects(f.api.execute(c as NotificationCommand,stage==='relevance'?{isApplicable(){f.runtime.cookie._end();return true;}}:{}),{status:401});assert.equal(f.sent.length,0);
 }finally{f.runtime.dispose();}}
});
test('abort before dispatch and ignored late abort retain write uncertainty without retry or a new UUID',async()=>{
 const f=await fixture('client',()=>{throw Error('must_not_dispatch');});try{const abort=new AbortController();abort.abort();await assert.rejects(f.api.execute(mark,{signal:abort.signal}),e=>{assert.equal((e as {status:number}).status,503);assert.deepEqual((e as {original:unknown}).original,mark);return true;});assert.equal(f.sent.length,0);}finally{f.runtime.dispose();}
 let enter!:()=>void,release!:()=>void;const entered=new Promise<void>(r=>{enter=r;}),held=new Promise<void>(r=>{release=r;});
 const g=await fixture('client',async()=>{enter();await held;return Response.json(receipt);});try{
  const abort=new AbortController();const p=g.api.execute(mark,{signal:abort.signal});await entered;abort.abort();const denied=assert.rejects(p,{status:503,outcome:'uncertain'});release();await denied;assert.deepEqual(g.sent,[mark]);
 }finally{g.runtime.dispose();}
});
test('strict Root command bounds and caller selector rejection occur before retained HTTP egress',async()=>{
 const f=await fixture('client',()=>{throw Error('must_not_dispatch');});try{
  for(const key of ['ownerId','role','current','clock','endpoint','rpc','providerReconciled','metadata'])await assert.rejects(f.api.execute({...command,[key]:'private'} as NotificationCommand),{status:400});
  await assert.rejects(f.api.execute({...command,extra:'x'.repeat(8192)} as NotificationCommand),{status:413});assert.equal(f.sent.length,0);
 }finally{f.runtime.dispose();}
});

test('actual session HTTP server-generation replacement retires the creation-bound adapter',async()=>{
 const f=await fixture('client',()=>Response.json(page));try{await f.restoreWith({generation:2});assert.equal(f.api.isCurrent(),false);await assert.rejects(f.api.execute(command),{status:401});assert.equal(f.sent.length,0);assert.deepEqual(await createNotificationRequest(f.runtime).execute(command),page);}finally{f.runtime.dispose();}
});
test('same-lease HTTP loss of EDIT blocks the late retry receipt without relaxing read-only bookkeeping',async()=>{
 let enter!:()=>void,release!:()=>void;const entered=new Promise<void>(r=>{enter=r;}),held=new Promise<void>(r=>{release=r;});
 const f=await fixture('advisor',async c=>{enter();await held;return Response.json({...receipt,action:c.action,effect:'retry_queued'});},true);try{
  const retry={...mark,action:'retry_failed_email_v1' as const};const pending=f.api.execute(retry);await entered;await f.restoreWith({capabilities:{view:true,edit:false,publish:false,confirmPayments:false}});const denied=assert.rejects(pending,{status:403});release();await denied;assert.deepEqual(f.sent,[retry]);assert.equal(f.api.isCurrent(),true);
 }finally{release?.();f.runtime.dispose();}
});
test('disposing A aborts its actual request before a late401 can end B in the same session',async()=>{
 let enter!:()=>void,release!:()=>void;const entered=new Promise<void>(r=>{enter=r;}),held=new Promise<void>(r=>{release=r;});let calls=0;
 const f=await fixture('client',async()=>{calls++;if(calls===1){enter();await held;return Response.json({code:'session_ended'},{status:401});}return Response.json(page);});
 try{const a=f.api.execute(command);await entered;f.api.dispose();const b=createNotificationRequest(f.runtime);assert.deepEqual(await b.execute(command),page);const rejected=assert.rejects(a);release();await rejected;assert.equal(f.runtime.cookie.status,'ready');assert.equal(b.isCurrent(),true);assert.deepEqual(await b.execute(command),page);}finally{release?.();f.runtime.dispose();}
});
test('held notification401 cannot end B after actual same-owner/CSRF server-generation-only restore',async()=>{
 let enter!:()=>void,release!:()=>void;const entered=new Promise<void>(r=>{enter=r;}),held=new Promise<void>(r=>{release=r;});let calls=0;
 const f=await fixture('client',async()=>{calls++;if(calls===1){enter();await held;return Response.json({code:'session_ended'},{status:401});}return Response.json(page);});
 try{const a=f.api.execute(command);await entered;await f.restoreWith({generation:2});const b=createNotificationRequest(f.runtime);assert.deepEqual(await b.execute(command),page);const rejected=assert.rejects(a,{status:401});release();await rejected;assert.equal(f.runtime.cookie.status,'ready');assert.equal(b.isCurrent(),true);assert.deepEqual(await b.execute(command),page);}finally{release?.();f.runtime.dispose();}
});
test('certified uncancelled current notification401 still ends its actual session',async()=>{
 const f=await fixture('client',()=>Response.json({code:'session_ended'},{status:401}));try{await assert.rejects(f.api.execute(command),{status:401});assert.equal(f.runtime.cookie.status,'signedout');assert.equal(f.runtime.getSnapshot().boundary,null);}finally{f.runtime.dispose();}
});
