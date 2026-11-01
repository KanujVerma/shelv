// SYNTHETIC HTTP ONLY: actual ApplicationSession, retained cookie session, transport and Root codec.
// This deliberately DOES NOT register a new cookie channel or mount notification UI.
import assert from 'node:assert/strict';import {test} from 'node:test';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {clientCookieRequest} from '../apps/portal/src/app/retained.ts';
import {mapNotificationResult} from '../src/contracts/PortalNotificationMapping.ts';
import {readNotificationCommand} from '../src/contracts/PortalNotificationValidation.ts';
import {handleNotificationRequest} from '../supabase/functions/concierge-notifications/handler.ts';
import {createNotificationPorts} from '../supabase/functions/concierge-notifications/runtime.ts';
const id='10000000-0000-4000-8000-000000000001';
function withLock<T>(name:string,callback:LockGrantedCallback<T>):Promise<Awaited<T>>;
function withLock<T>(name:string,options:LockOptions,callback:LockGrantedCallback<T>):Promise<Awaited<T>>;
async function withLock<T>(_name:string,options:LockOptions|LockGrantedCallback<T>,callback?:LockGrantedCallback<T>):Promise<Awaited<T>>{const run=typeof options==='function'?options:callback;assert.ok(run);if(typeof options!=='function'&&options.signal?.aborted)throw new DOMException('aborted','AbortError');return await run(null);}
test('retained actual session has no activated notification channel and discards a late notification read after real sign-out',async()=>{
 const external=globalThis.fetch;globalThis.fetch=async()=>{throw Error('global_external_fetch_denied');};
 const calls:string[]=[];const runtime=createApplicationSession({audience:'client',locks:{request:withLock},fetcher:async(input,init)=>{
  const path=String(input);calls.push(path);
  if(path==='/api/client/session')return Response.json({signedIn:true,ownerId:id,generation:1,csrf:'SYNTHETIC-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
  assert.equal(path,'/api/client/logout');assert.equal(init?.credentials,'same-origin');assert.equal(new Headers(init?.headers).get('x-shelv-csrf'),'SYNTHETIC-csrf');return Response.json({signedOut:true});
 }});
 try{
  await runtime.restore();const boundary=runtime.getSnapshot().boundary;assert.ok(boundary);assert.ok(boundary.isCurrent());
  assert.throws(()=>clientCookieRequest('notifications' as never,runtime.cookie));
  const command=readNotificationCommand({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:1});
  let release!:()=>void,entered!:()=>void;const hold=new Promise<void>(r=>{release=r;}),started=new Promise<void>(r=>{entered=r;});
  const ports=createNotificationPorts({supabaseUrl:'https://notification.synthetic.invalid',publicKey:'SYNTHETIC-public',allowedOrigins:[],fetch:async(input)=>{
   const path=new URL(String(input)).pathname;if(path==='/auth/v1/user')return Response.json({id,is_anonymous:false});assert.equal(path,'/rest/v1/rpc/concierge_notification_command_v1');entered();await hold;return Response.json({schemaVersion:1,consistency:'live_keyset',observedAt:'2026-11-01T00:00:00Z',cursor:null,items:[],nextCursor:null});
  }});
  const operation=runtime.transport.bind({kind:'read',invoke:async(_input:unknown,{signal})=>{const r=await handleNotificationRequest(new Request('https://edge.synthetic.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify(command),signal}),ports);if(!r.ok)throw {status:r.status};return r.json();},decode:v=>mapNotificationResult(v,command)});
  const pending=operation.execute(command);await started;const rejected=assert.rejects(pending,e=>(e as {status:number}).status===401);await runtime.signOut();assert.equal(boundary.isCurrent(),false);release();await rejected;assert.deepEqual(calls,['/api/client/session','/api/client/session','/api/client/logout']);
 }finally{runtime.dispose();globalThis.fetch=external;}
});

// Every test fails closed if any dependency falls back to global network.
import {before,after} from 'node:test';
const originalGlobalFetch=globalThis.fetch;before(()=>{globalThis.fetch=async()=>{throw Error('global_external_fetch_denied');};});after(()=>{globalThis.fetch=originalGlobalFetch;});
