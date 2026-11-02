import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createAccountProfilePorts} from '../supabase/functions/concierge-account-profile/runtime.ts';
import {handleAccountProfileRequest} from '../supabase/functions/concierge-account-profile/handler.ts';

// Finite synthetic HTTP transcripts only. Native Request/Response/streams and real codec/handler/runtime.
const actor='10000000-0000-4000-8000-000000000001',session='10000000-0000-4000-8000-000000000002';
const claims={sub:actor,role:'authenticated',session_id:session,exp:4102444800};
const token=`e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.synthetic`;
const read={schemaVersion:1,action:'read_account_profile_v1'};
const write={schemaVersion:1,action:'set_account_display_name_v1',requestId:'10000000-0000-4000-8000-000000000003',expectedRevision:0,displayName:'Synthetic Renée'};
const view={schemaVersion:1,profileRevision:0,displayName:'Synthetic Original',currentEmail:{state:'known',address:'synthetic@example.invalid',verified:true}};
const json=(data:unknown)=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
const request=(data:unknown=read,signal?:AbortSignal)=>new Request('https://edge.example.invalid/ignored',{method:'POST',headers:{authorization:`Bearer ${token}`,origin:'https://portal.example.invalid','content-type':'application/json'},body:JSON.stringify(data),signal});
function fixture(override?:(url:string,init:RequestInit,auth:number,rpc:number)=>Response|Promise<Response>|undefined,expectedToken=token){
 let auth=0,rpc=0;const signals:AbortSignal[]=[];const calls:string[]=[];
 const send:typeof fetch=async(input,init={})=>{
  const url=String(input);calls.push(url);assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');assert.equal(init.cache,'no-store');assert.equal(new Headers(init.headers).get('authorization'),`Bearer ${expectedToken}`);assert.ok(init.signal);signals.push(init.signal);
  if(url.endsWith('/auth/v1/user'))auth++;else {rpc++;assert.equal(url,'https://project.example.invalid/rest/v1/rpc/concierge_account_profile_command_v1');const sent=JSON.parse(String(init.body));assert.deepEqual(Object.keys(sent),['p_command']);}
  return await override?.(url,init,auth,rpc)??json(url.endsWith('/auth/v1/user')?{id:actor,is_anonymous:false}:view);
 };
 const ports=createAccountProfilePorts({supabaseUrl:'https://project.example.invalid',publicKey:'synthetic-public-key',allowedOrigins:['https://portal.example.invalid'],fetch:send});
 return {ports,signals,calls};
}
test('real closed runtime reauthenticates, repeats fixed current read, uses one operation signal',async()=>{
 const f=fixture();const response=await handleAccountProfileRequest(request(),f.ports);
 assert.equal(response.status,200);assert.deepEqual(await response.json(),view);assert.equal(f.calls.length,5);assert.ok(f.signals.every(x=>x===f.signals[0]));assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0');
});
test('current read changed after first RPC is not returned as current',async()=>{
 const f=fixture((url,_i,_a,r)=>url.includes('/rpc/')&&r===2?json({...view,profileRevision:1,displayName:'Synthetic New'}):undefined);
 const r=await handleAccountProfileRequest(request(),f.ports);assert.equal(r.status,409);assert.deepEqual(await r.json(),{code:'basis_conflict'});
});
test('historical write ACK remains historical when subsequent current name differs',async()=>{
 const receipt={schemaVersion:1,requestId:write.requestId,action:write.action,previousRevision:0,revision:1,displayName:write.displayName,recordedAt:'2026-11-02T11:00:00.000000Z'};
 const f=fixture((url,init,_a,r)=>url.includes('/rpc/')?(r===1?(assert.deepEqual(JSON.parse(String(init.body)).p_command,write),json(receipt)):(assert.deepEqual(JSON.parse(String(init.body)).p_command,read),json({...view,profileRevision:2,displayName:'Synthetic Later'}))):undefined);
 const response=await handleAccountProfileRequest(request(write),f.ports);assert.equal(response.status,200);assert.deepEqual(await response.json(),receipt);
});
for(const status of [401,403])for(const stage of ['auth','rpc','final'])test(`received ${status} at ${stage} survives throwing denial body/statusText/headers cleanup`,async()=>{
 const f=fixture((url,_i,a,r)=>((stage==='auth'&&a===1)||(stage==='rpc'&&url.includes('/rpc/')&&r===1)||(stage==='final'&&a===3))?new Proxy(new Response(null,{status}),{get(target,key){if(['body','statusText','headers'].includes(String(key)))throw Error('private');return Reflect.get(target,key,target);}}):undefined);
 const response=await handleAccountProfileRequest(request(),f.ports);assert.equal(response.status,status);assert.doesNotMatch(await response.text(),/private/);
});
test('same actor and permanent Auth required again after fixed context read',async()=>{
 for(const patch of [{id:session,is_anonymous:false},{id:actor,is_anonymous:true}]){
  const f=fixture((url,_i,a)=>url.endsWith('/user')&&a===3?json(patch):undefined);assert.equal((await handleAccountProfileRequest(request(),f.ports)).status,403);
 }
});
test('request, Auth and RPC bodies have distinct byte bounds and safe malformed errors',async()=>{
 const f=fixture();assert.equal((await handleAccountProfileRequest(request({...read,padding:'x'.repeat(8192)}),f.ports)).status,413);
 for(const auth of [true,false]){
  const f=fixture(url=>url.endsWith('/user')===auth?json(auth?{id:actor,is_anonymous:false,padding:'x'.repeat(8192)}:{...view,padding:'x'.repeat(16384)}):undefined);
  assert.equal((await handleAccountProfileRequest(request(),f.ports)).status,503);
 }
});
test('a local abort returns 503 even when fetch ignores signal; late value is retired',async()=>{
 const ac=new AbortController();let finish!:(r:Response)=>void;
 const f=fixture(()=>new Promise<Response>(resolve=>{finish=resolve;}));const pending=handleAccountProfileRequest(request(read,ac.signal),f.ports);
 await new Promise<void>(resolve=>setImmediate(resolve));ac.abort();assert.equal((await pending).status,503);finish(json({id:actor,is_anonymous:false}));
});
test('unsupported origin/method/input fail before provider RPC',async()=>{
 const f=fixture();const bad=new Request(request(),{headers:{origin:'https://evil.example.invalid'}});assert.equal((await handleAccountProfileRequest(bad,f.ports)).status,403);assert.equal(f.calls.length,0);
 assert.equal((await handleAccountProfileRequest(request({...read,clientId:actor}),f.ports)).status,400);
 assert.ok(f.calls.every(url=>url.endsWith('/user')));
});
test('configuration and RPC selector are closed; missing operation signal is refused',async()=>{
 for(const supabaseUrl of ['http://project.example.invalid','https://project.example.invalid/path','https://x:y@project.example.invalid'])assert.throws(()=>createAccountProfilePorts({supabaseUrl,publicKey:'synthetic',allowedOrigins:[]}));
 const f=fixture();await assert.rejects(()=>f.ports.rpc(token,{name:'foreign',args:{}} as never,new AbortController().signal));assert.equal(f.calls.length,0);
 await assert.rejects(()=>f.ports.rpc(token,{name:'concierge_account_profile_command_v1',args:{p_command:read}} as never,undefined as never));assert.equal(f.calls.length,0);
 await assert.rejects(()=>f.ports.rpc(token,{name:'concierge_account_profile_command_v1',args:{p_command:read}} as never,new AbortController().signal));assert.equal(f.calls.length,0);
});
test('the absolute 10s operation deadline is not renewed for a later provider call',async(t)=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,10,2)});
 const f=fixture((url,_i,a)=>url.endsWith('/user')&&a===2?new Promise<Response>(()=>{}):new Promise<Response>(resolve=>setTimeout(()=>resolve(json(url.endsWith('/user')?{id:actor,is_anonymous:false}:view)),4000)));
 const pending=handleAccountProfileRequest(request(),f.ports);
 const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
 await flush();t.mock.timers.tick(4000);await flush();t.mock.timers.tick(4000);await flush();assert.equal(f.calls.length,3);
 let ended=false;void pending.then(()=>{ended=true;});t.mock.timers.tick(1999);await flush();assert.equal(ended,false);
 t.mock.timers.tick(1);await flush();const r=await pending;assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});assert.equal(Date.now(),Date.UTC(2026,10,2)+10000);
});
test('deadline retires blocked request body and physically starts cancellation',async(t)=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,10,2)});let cancelled=0;
 const stream=new ReadableStream<Uint8Array>({pull(){return new Promise<void>(()=>{});},cancel(){cancelled++;}});
 const input=new Request('https://edge.example.invalid',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:stream,duplex:'half'} as RequestInit);
 const pending=handleAccountProfileRequest(input,fixture().ports);await new Promise<void>(resolve=>setImmediate(resolve));t.mock.timers.tick(10000);
 assert.equal((await pending).status,503);assert.equal(cancelled,1);
});
test('known denial outranks a local abort caused by its own cleanup',async()=>{
 for(const status of [401,403]){
  const ac=new AbortController();let cancelled=0;
  const f=fixture(()=>new Response(new ReadableStream({cancel(){cancelled++;ac.abort();return new Promise<void>(()=>{});}}),{status}));
  const response=await handleAccountProfileRequest(request(read,ac.signal),f.ports);assert.equal(response.status,status);assert.equal(cancelled,1);
 }
});
test('Auth cannot substitute token-only email, identity, or missing session context',async()=>{
 for(const user of [{id:actor},{id:session,is_anonymous:false},{id:actor,is_anonymous:true}]){
  const f=fixture(url=>url.endsWith('/user')?json(user):undefined);const r=await handleAccountProfileRequest(request(),f.ports);assert.equal(r.status,403);assert.equal(f.calls.length,1);
 }
 const invalidToken=`e30.${Buffer.from(JSON.stringify({sub:actor,role:'authenticated',exp:4102444800})).toString('base64url')}.synthetic`;
 const input=new Request(request(),{headers:{authorization:`Bearer ${invalidToken}`,'content-type':'application/json'}});
 assert.equal((await handleAccountProfileRequest(input,fixture(undefined,invalidToken).ports)).status,401);
});
test('malformed UTF8/request bytes and malformed upstream JSON never leak values',async()=>{
 const input=new Request('https://edge.example.invalid',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:new Uint8Array([0xc0,0xaf])});
 assert.equal((await handleAccountProfileRequest(input,fixture().ports)).status,400);
 const f=fixture(url=>url.includes('/rpc/')?new Response('private error text'):undefined);const r=await handleAccountProfileRequest(request(),f.ports);assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});
});
test('SQL safe conflict namespace maps without exposing upstream error bodies',async()=>{
 for(const [message,status,code] of [['concierge_revision_conflict',409,'revision_conflict'],['concierge_request_conflict',409,'request_conflict'],['private SQL diagnostic',503,'unavailable']] as const){
  const f=fixture(url=>url.includes('/rpc/')?new Response(JSON.stringify({message}),{status:400}):undefined);
  const response=await handleAccountProfileRequest(request(write),f.ports);assert.equal(response.status,status);assert.deepEqual(await response.json(),{code});
 }
});
test('a received denial at the final context read cannot return an earlier private result',async()=>{
 for(const status of [401,403]){
  const f=fixture((url,_i,_a,r)=>url.includes('/rpc/')&&r===2?new Response(null,{status}):undefined);
  const response=await handleAccountProfileRequest(request(),f.ports);assert.equal(response.status,status);assert.deepEqual(await response.json(),{code:status===401?'session_ended':'forbidden'});
 }
});
test('blocked Auth and RPC body reads consume the original operation deadline',async(t)=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,10,2)});
 for(const auth of [true,false]){
  let cancelled=0;const f=fixture(url=>url.endsWith('/user')===auth?new Response(new ReadableStream<Uint8Array>({pull(){return new Promise<void>(()=>{});},cancel(){cancelled++;}})):undefined);
  const pending=handleAccountProfileRequest(request(),f.ports);await new Promise<void>(resolve=>setImmediate(resolve));t.mock.timers.tick(10000);
  assert.equal((await pending).status,503);assert.equal(cancelled,1);
 }
});
test('reentrant wall-clock overrun before RPC is unavailable even before timer callback',async(t)=>{
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
 const f=fixture(url=>{if(url.endsWith('/user'))t.mock.timers.setTime(start+10001);return undefined;});
 const response=await handleAccountProfileRequest(request(write),f.ports);assert.equal(response.status,503);assert.equal(f.calls.length,1);
});
