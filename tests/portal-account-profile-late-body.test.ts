import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createAccountProfilePorts} from '../supabase/functions/concierge-account-profile/runtime.ts';
import {handleAccountProfileRequest} from '../supabase/functions/concierge-account-profile/handler.ts';
import {buildAccountProfileRpc,mapAccountProfileResult} from '../src/contracts/PortalAccountProfileMapping.ts';
import {accountProfileWait,setAccountProfileDeadline} from '../supabase/functions/concierge-account-profile/body.ts';
import type {AccountProfileCommand} from '../src/contracts/PortalAccountProfile.ts';
const actor='20000000-0000-4000-8000-000000000001',session='20000000-0000-4000-8000-000000000002';
const claims={sub:actor,role:'authenticated',session_id:session,exp:4102444800};
const token=`e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.synthetic`;
const read={schemaVersion:1,action:'read_account_profile_v1'} satisfies AccountProfileCommand;
const write={schemaVersion:1,action:'set_account_display_name_v1',requestId:'20000000-0000-4000-8000-000000000003',expectedRevision:0,displayName:'  Synthetic Zoë  '};
const view={schemaVersion:1,profileRevision:0,displayName:'Synthetic Original',currentEmail:{state:'unknown'}};
const auth=()=>({id:actor,is_anonymous:false});
const json=(v:unknown)=>new Response(JSON.stringify(v));
const req=(value:unknown=read,signal?:AbortSignal)=>new Request('https://edge.example.invalid',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json',origin:'https://portal.example.invalid'},body:JSON.stringify(value),signal});
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
function setup(override?:(index:number,url:string,init:RequestInit)=>Response|Promise<Response>|undefined){
 let index=0;const seen:{url:string;init:RequestInit}[]=[];
 const config={supabaseUrl:'https://project.example.invalid',publicKey:'synthetic-key',allowedOrigins:['https://portal.example.invalid'],fetch:(async(input,init={})=>{const url=String(input);seen.push({url,init});return await override?.(++index,url,init)??json(url.endsWith('/user')?auth():view);}) as typeof fetch};
 return {config,ports:createAccountProfilePorts(config),seen};
}
test('independent: captured configuration survives mutation during first Auth',async()=>{
 const f=setup(i=>{if(i===1){f.config.supabaseUrl='https://changed.example.invalid';f.config.publicKey='changed';f.config.allowedOrigins.splice(0);f.config.fetch=async()=>{throw Error('replacement');};}return undefined;});
 assert.equal((await handleAccountProfileRequest(req(),f.ports)).status,200);
 assert.equal(f.seen.length,5);for(const x of f.seen){assert.ok(x.url.startsWith('https://project.example.invalid/'));assert.equal(new Headers(x.init.headers).get('apikey'),'synthetic-key');assert.equal(new Headers(x.init.headers).get('authorization'),`Bearer ${token}`);}
});
test('independent: unchanged revision with changed email fails stable current-view fence',async()=>{
 const f=setup(i=>i===4?json({...view,currentEmail:{state:'known',address:'new@example.invalid',verified:false}}):undefined);
 const r=await handleAccountProfileRequest(req(),f.ports);assert.equal(r.status,409);assert.deepEqual(await r.json(),{code:'basis_conflict'});
});
test('independent: identity correlation change at each Auth recheck retires prior result',async()=>{
 for(const step of [3,5]){const f=setup(i=>i===step?json({id:session,is_anonymous:false}):undefined);const r=await handleAccountProfileRequest(req(),f.ports);assert.equal(r.status,403);assert.ok(f.seen.length<=step);}
});
test('independent: denied status survives reentrant deadline before any body getter',async(t)=>{
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
 for(const status of [401,403]){let statusRead=0;const f=setup(()=>new Proxy(new Response(null,{status}),{get(target,key){if(key==='status'){statusRead++;t.mock.timers.setTime(Date.now()+10001);return status;}if(key==='body')throw Error('cleanup');return Reflect.get(target,key,target);}}));
  assert.equal((await handleAccountProfileRequest(req(),f.ports)).status,status);assert.equal(statusRead,1);}
});
test('independent: expiry/unregistered/renewed signals cannot start provider callback',async()=>{
 const signal=new AbortController().signal;let called=0;
 await assert.rejects(()=>accountProfileWait(async()=>{called++;},signal));assert.equal(called,0);
 setAccountProfileDeadline(signal,Date.now()-1);await assert.rejects(()=>accountProfileWait(async()=>{called++;},signal));assert.equal(called,0);
 assert.throws(()=>setAccountProfileDeadline(signal,Date.now()+10000));
});
test('independent: multibyte and escaped names use encoded command bytes, no truncation',()=>{
 for(const displayName of ['\tÉlodie\n','𐐀'.repeat(200),'\u200b','\u180e'])assert.equal((buildAccountProfileRpc({...write,displayName}).args.p_command as typeof write).displayName,displayName);
 for(const displayName of [' '.repeat(8192)+'x','𐐀'.repeat(201),'\udfff','\0'])assert.throws(()=>buildAccountProfileRpc({...write,displayName}));
 assert.throws(()=>mapAccountProfileResult({...view,displayName:' '.repeat(17000)+'x'},read));
});
test('independent: local abort cancels a later native success response once',async()=>{
 const ac=new AbortController();let resolve!:(v:Response)=>void,cancelled=0;
 const f=setup(()=>new Promise<Response>(r=>{resolve=r;}));const pending=handleAccountProfileRequest(req(read,ac.signal),f.ports);await flush();ac.abort();assert.equal((await pending).status,503);
 resolve(new Response(new ReadableStream({cancel(){cancelled++;}})));await flush();assert.equal(cancelled,1);
});
test('independent: exact incoming8192/Auth8192/RPC16384 byte boundaries',async()=>{
 const padded=(v:unknown,size:number)=>{const body=JSON.stringify(v);return body+' '.repeat(size-new TextEncoder().encode(body).length);};
 for(const extra of [0,1]){
  const incoming=new Request(req(),{body:padded(read,8192+extra)});assert.equal((await handleAccountProfileRequest(incoming,setup().ports)).status,extra?413:200);
  for(const target of ['auth','rpc']){const f=setup((_i,url)=>url.endsWith('/user')===(target==='auth')?new Response(padded(target==='auth'?auth():view,(target==='auth'?8192:16384)+extra)):undefined);
   assert.equal((await handleAccountProfileRequest(req(),f.ports)).status,extra?503:200);}
 }
});
test('independent: hanging overflow cleanup is initiated once and cannot renew deadline',async(t)=>{
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});let cancelled=0;
 const f=setup(()=>new Response(new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(8193));},cancel(){cancelled++;return new Promise<void>(()=>{});}})));
 const pending=handleAccountProfileRequest(req(),f.ports);await flush();assert.equal(cancelled,1);let ended=false;void pending.then(()=>{ended=true;});await flush();assert.equal(ended,false);
 t.mock.timers.tick(10000);assert.equal((await pending).status,503);assert.equal(cancelled,1);
});
test('AP1: wall-clock expired native success is cancelled before timer callback',async(t)=>{
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});let cancelled=0;
 const f=setup(()=>{t.mock.timers.setTime(start+10001);return new Response(new ReadableStream({cancel(){cancelled++;}}));});
 const r=await handleAccountProfileRequest(req(),f.ports);assert.equal(r.status,503);assert.equal(f.seen.length,1);
 await flush();t.mock.timers.tick(60000);await flush();
 t.diagnostic(JSON.stringify({status:r.status,cancelled,signalAborted:f.seen[0].init.signal?.aborted,clock:Date.now()}));assert.equal(cancelled,1);
});
test('absolute expiry retires the received native body at each Auth/RPC stage for read and write',async(t)=>{
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
 const receipt={schemaVersion:1,requestId:write.requestId,action:write.action,previousRevision:0,revision:1,displayName:write.displayName,recordedAt:'2026-11-02T00:00:00Z'};
 for(const command of [read,write])for(const step of [1,2,3,4,5]){
  t.mock.timers.setTime(start);let cancelled=0;
  const f=setup(i=>{if(i===step){t.mock.timers.setTime(start+10001);return new Response(new ReadableStream({cancel(){cancelled++;}}));}return command===write&&i===2?json(receipt):undefined;});
  const r=await handleAccountProfileRequest(req(command),f.ports);await flush();assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});assert.equal(f.seen.length,step);assert.equal(cancelled,1,`stage ${step} ${command.action}`);
 }
});
for(const mode of ['pending','rejected','throwing'])test(`late-body ${mode} cancellation cannot block safe refusal`,async(t)=>{
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});let cancelled=0;
 const f=setup(()=>{t.mock.timers.setTime(start+10001);return new Response(new ReadableStream({cancel(){cancelled++;if(mode==='pending')return new Promise<void>(()=>{});if(mode==='rejected')return Promise.reject(Error('synthetic_cancel'));throw Error('synthetic_cancel');}}));});
 const r=await handleAccountProfileRequest(req(),f.ports);await flush();assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});assert.equal(cancelled,1);
});
test('known received denials retain precedence through clock expiry and body cancellation at every stage',async(t)=>{
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
 for(const status of [401,403])for(const step of [1,2,3,4,5]){
  t.mock.timers.setTime(start);let cancelled=0;
  const f=setup(i=>{if(i!==step)return undefined;t.mock.timers.setTime(start+10001);return new Response(new ReadableStream({cancel(){cancelled++;return Promise.reject(Error('synthetic_denial_cleanup'));}}),{status});});
  const r=await handleAccountProfileRequest(req(),f.ports);await flush();assert.equal(r.status,status);assert.deepEqual(await r.json(),{code:status===401?'session_ended':'forbidden'});assert.equal(f.seen.length,step);assert.equal(cancelled,1);
 }
});
