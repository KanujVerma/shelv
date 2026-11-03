import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createClientServicePorts} from '../../../supabase/functions/concierge-client-service/runtime.ts';
import {handleClientServiceRequest} from '../../../supabase/functions/concierge-client-service/handler.ts';
import type {ClientServiceCommand} from '../../../src/contracts/PortalClientService.ts';
import {buildClientServiceRpc} from '../../../src/contracts/PortalClientServiceMapping.ts';

// Only closed native HTTP transcripts. No socket, browser, real Auth/SQL or IPC.
globalThis.fetch=async()=>{throw Error('unexpected_network_denied');};
const actor='10000000-0000-4000-8000-000000000001',session='10000000-0000-4000-8000-000000000002',hash='a'.repeat(64);
const claims={sub:actor,role:'authenticated',session_id:session,exp:4102444800};
const credential=(context:unknown)=>`e30.${Buffer.from(JSON.stringify(context)).toString('base64url')}.synthetic`;
const token=credential(claims);
const read={schemaVersion:1,action:'read_client_service_v1'} as const;
const cancel={schemaVersion:1,action:'cancel_client_service_period_end_v1',requestId:actor,expectedServiceRevision:7,expectedBasisHash:hash,reason:'Please stop renewal requests',confirmed:true} as const;
const cancellation={id:actor,kind:'period_end',supportEndsOn:'2026-12-01',reason:cancel.reason,recordedBy:actor,recordedAt:'2026-11-02T01:02:03.000000Z'};
const view={schemaVersion:1,serviceRevision:7,basisHash:hash,asOfDay:'2026-11-02',coverage:{status:'active',period:{startOn:'2026-11-01',endOn:'2026-12-01'},paidSupportEndsOn:'2026-12-01',pendingPublication:false},cancellation:null,periodEndCancellation:{state:'available',supportEndsOn:'2026-12-01',readOnlyEndsOn:'2026-12-31'}};
const receipt={schemaVersion:1,requestId:actor,action:cancel.action,previousServiceRevision:7,serviceRevision:8,expectedBasisHash:hash,cancellation};
const status={schemaVersion:1,requestId:actor,state:'committed',original:cancel,receipt};
const json=(value:unknown)=>new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});
const request=(command:unknown=read,signal?:AbortSignal,auth=token)=>new Request('https://edge.example.invalid/service',{method:'POST',headers:{authorization:`Bearer ${auth}`,origin:'https://portal.example.invalid','content-type':'application/json'},body:JSON.stringify(command),signal});
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
function fixture(options:{command?:ClientServiceCommand;token?:string;override?:(stage:number,command:Record<string,unknown>|null,init:RequestInit)=>Response|Promise<Response>|undefined}={}){
 const calls:{url:string;command:Record<string,unknown>|null;signal:AbortSignal}[]=[];
 const ports=createClientServicePorts({supabaseUrl:'https://project.example.invalid',publicKey:'synthetic-public',allowedOrigins:['https://portal.example.invalid'],fetch:async(input,init={})=>{
  const url=String(input),auth=url.endsWith('/auth/v1/user'),body=init.body?JSON.parse(String(init.body)):null,command=body?.p_command??null;
  assert.ok(init.signal);assert.equal(init.credentials,'omit');assert.equal(init.redirect,'manual');assert.equal(init.cache,'no-store');
  assert.equal(new Headers(init.headers).get('authorization'),`Bearer ${options.token??token}`);
  if(auth){assert.equal(init.method,'GET');assert.equal(body,null);}
  else{assert.equal(url,'https://project.example.invalid/rest/v1/rpc/concierge_client_service_command_v1');assert.equal(init.method,'POST');assert.deepEqual(Object.keys(body),['p_command']);
   if(command.action==='client_service_request_status_v1')assert.deepEqual(command,{schemaVersion:1,action:'client_service_request_status_v1',requestId:actor});
   else assert.deepEqual(command,options.command??read);
  }
  const stage=calls.push({url,command,signal:init.signal});
  return await options.override?.(stage,command,init)??json(auth?{id:actor,is_anonymous:false}:command.action==='read_client_service_v1'?view:command.action==='cancel_client_service_period_end_v1'?receipt:status);
 }});
 return {ports,calls};
}
test('real service handler/ports read uses fixed Auth/RPC/Auth/RPC/Auth under one signal',async()=>{
 const f=fixture(),r=await handleClientServiceRequest(request(),f.ports);
 assert.equal(r.status,200);assert.deepEqual(await r.json(),view);assert.equal(f.calls.length,5);assert.ok(f.calls.every(c=>c.signal===f.calls[0].signal));assert.equal(r.headers.get('cache-control'),'private, no-store, max-age=0');
});
test('ordinary cancellation dispatches once then confirms original journal outcome, never retries mutation',async()=>{
 const f=fixture({command:cancel}),r=await handleClientServiceRequest(request(cancel),f.ports);
 assert.equal(r.status,200);assert.deepEqual(await r.json(),receipt);assert.equal(f.calls.length,5);
 assert.equal(f.calls[1].command?.action,cancel.action);assert.equal(f.calls[3].command?.action,'client_service_request_status_v1');
});
test('read rejects drift at unchanged head and never returns the first stale projection',async()=>{
 const f=fixture({override:n=>n===4?json({...view,basisHash:'b'.repeat(64)}):undefined});const r=await handleClientServiceRequest(request(),f.ports);assert.equal(r.status,409);assert.deepEqual(await r.json(),{code:'basis_conflict'});
});
test('postcommit missing or mismatched journal is uncertain and never a current saved success',async()=>{
 for(const changed of [{schemaVersion:1,requestId:actor,state:'absent'},{...status,receipt:{...receipt,cancellation:{...cancellation,reason:'Other'}}}]){
  const f=fixture({command:cancel,override:n=>n===4?json(changed):undefined}),r=await handleClientServiceRequest(request(cancel),f.ports);assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});assert.equal(f.calls.filter(c=>c.command?.action===cancel.action).length,1);
 }
});
for(const code of [401,403] as const)for(const stage of [1,2,3,4,5])test(`known ${code} at stage ${stage} survives throwing cleanup and local abort`,async()=>{
 const ac=new AbortController();let cleanup=0;
 const f=fixture({override:n=>n===stage?new Proxy(new Response(null,{status:code}),{get(target,key){if(['body','headers','statusText'].includes(String(key))){cleanup++;ac.abort();throw Error('private diagnostic');}return Reflect.get(target,key,target);}}):undefined});
 const r=await handleClientServiceRequest(request(read,ac.signal),f.ports);assert.equal(r.status,code);assert.deepEqual(await r.json(),{code:code===401?'session_ended':'forbidden'});assert.equal(cleanup,1);assert.equal(f.calls.length,stage);
});
test('each actual Auth fence refuses switched or anonymous identity',async()=>{
 for(const stage of [1,3,5])for(const user of [{id:session,is_anonymous:false},{id:actor,is_anonymous:true},{id:actor}]){
  const f=fixture({override:n=>n===stage?json(user):undefined});assert.equal((await handleClientServiceRequest(request(),f.ports)).status,403);assert.equal(f.calls.length,stage);
 }
});
test('real Auth result must match valid permanent token correlation',async()=>{
 for(const context of [{...claims,exp:0},{...claims,role:'service_role'},{...claims,session_id:null}]){
  const auth=credential(context),f=fixture({token:auth});assert.equal((await handleClientServiceRequest(request(read,undefined,auth),f.ports)).status,401);assert.equal(f.calls.length,1);
 }
});
test('closed fields, origin and media refusal start no service RPC',async()=>{
 const f=fixture();assert.equal((await handleClientServiceRequest(request({...read,clientId:actor}),f.ports)).status,400);assert.equal(f.calls.length,1);
 assert.equal((await handleClientServiceRequest(new Request(request(),{headers:{origin:'https://foreign.example.invalid'}}),f.ports)).status,403);
 assert.equal((await handleClientServiceRequest(new Request(request(),{headers:{authorization:`Bearer ${token}`,'content-type':'text/plain'}}),f.ports)).status,415);assert.equal(f.calls.length,1);
});
test('bounded request/Auth/result streams refuse overflow and malformed bytes without leakage',async()=>{
 assert.equal((await handleClientServiceRequest(request({...read,padding:'x'.repeat(8192)}),fixture().ports)).status,413);
 for(const stage of [1,2])for(const response of [()=>json({padding:'x'.repeat(stage===1?8192:32768)}),()=>new Response('private diagnostic'),()=>new Response(new Uint8Array([0xc0,0xaf]))]){
  const f=fixture({override:n=>n===stage?response():undefined}),r=await handleClientServiceRequest(request(),f.ports);assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});
 }
});
test('single absolute deadline covers sequential Auth, body, SQL, and cleanup',async(t)=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,10,2)});
 const f=fixture({override:(stage,command)=>stage===3?new Promise<Response>(()=>{}):new Promise<Response>(resolve=>setTimeout(()=>resolve(json(command?view:{id:actor,is_anonymous:false})),4000))});
 const pending=handleClientServiceRequest(request(),f.ports);await flush();t.mock.timers.tick(4000);await flush();t.mock.timers.tick(4000);await flush();assert.equal(f.calls.length,3);t.mock.timers.tick(2000);assert.equal((await pending).status,503);
});
test('response arriving beyond absolute deadline is retired even before timer fires',async(t)=>{
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
 for(const target of [1,2,3,4,5]){
  t.mock.timers.setTime(start);let cancelled=0;const f=fixture({override:n=>{if(n!==target)return;t.mock.timers.setTime(start+10000);return new Response(new ReadableStream({cancel(){cancelled++;}}));}});
  assert.equal((await handleClientServiceRequest(request(),f.ports)).status,503);assert.equal(cancelled,1);assert.equal(f.calls.length,target);
 }
});
test('pending decoder and rejecting or hanging body cleanup share the same deadline',async(t)=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,10,2)});
 for(const target of [1,2,3,4,5]){
  let cancelled=0;const f=fixture({override:n=>n===target?new Response(new ReadableStream<Uint8Array>({pull(){return new Promise<void>(()=>{});},cancel(){cancelled++;return new Promise<void>(()=>{});}})):undefined});
  const pending=handleClientServiceRequest(request(),f.ports);await flush();t.mock.timers.tick(10000);assert.equal((await pending).status,503);assert.equal(cancelled,1);
 }
});
test('final cleanup cannot revive private response after abort or token expiry',async(t)=>{
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
 for(const expired of [false,true]){
  t.mock.timers.setTime(start);const auth=credential({...claims,exp:start/1000+1}),input=request(read,undefined,auth),remove=input.signal.removeEventListener.bind(input.signal);
  input.signal.removeEventListener=(...args:Parameters<AbortSignal['removeEventListener']>)=>{remove(...args);if(expired)t.mock.timers.setTime(start+1000);else Object.defineProperty(input.signal,'aborted',{value:true});};
  const r=await handleClientServiceRequest(input,fixture({token:auth}).ports);assert.equal(r.status,expired?401:503);
 }
});
test('invalid direct RPC/config selector or missing handler lifetime never starts Fetch',async()=>{
 for(const supabaseUrl of ['http://project.example.invalid','https://project.example.invalid/path','https://x:y@project.example.invalid'])assert.throws(()=>createClientServicePorts({supabaseUrl,publicKey:'synthetic',allowedOrigins:[]}));
 const f=fixture();for(const call of [{name:'foreign',args:{p_command:read}},{name:'concierge_client_service_command_v1',args:{p_command:read,clientId:actor}},buildClientServiceRpc(read)])await assert.rejects(()=>f.ports.rpc(token,call as never,new AbortController().signal));assert.equal(f.calls.length,0);
});
test('safe SQL conflicts retain status while private error text is unavailable',async()=>{
 for(const [message,expected,code] of [['concierge_revision_conflict',409,'revision_conflict'],['concierge_request_conflict',409,'request_conflict'],['concierge_forbidden',403,'forbidden'],['private SQL',503,'unavailable']] as const){
  const f=fixture({override:n=>n===2?new Response(JSON.stringify({message}),{status:400}):undefined}),r=await handleClientServiceRequest(request(),f.ports);assert.equal(r.status,expected);assert.deepEqual(await r.json(),{code});
 }
});
test('blocked incoming body cleanup shares original deadline before any SQL',async(t)=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,10,2)});let cancelled=0;
 const input=new Request('https://edge.example.invalid',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:new ReadableStream<Uint8Array>({pull(){return new Promise<void>(()=>{});},cancel(){cancelled++;return new Promise<void>(()=>{});}}),duplex:'half'} as RequestInit);
 const f=fixture(),pending=handleClientServiceRequest(input,f.ports);await flush();t.mock.timers.tick(10000);assert.equal((await pending).status,503);assert.equal(cancelled,1);assert.equal(f.calls.length,1);
});
test('pre-abort starts no Auth; late HTTP reply after abort is physically retired when received',async()=>{
 const ac=new AbortController();ac.abort();const f=fixture();assert.equal((await handleClientServiceRequest(request(read,ac.signal),f.ports)).status,503);assert.equal(f.calls.length,0);
 const later=new AbortController();let resolve!:(response:Response)=>void,cancelled=0;
 const held=fixture({override:()=>new Promise<Response>(done=>{resolve=done;})}),pending=handleClientServiceRequest(request(read,later.signal),held.ports);
 await flush();later.abort();assert.equal((await pending).status,503);resolve(new Response(new ReadableStream({cancel(){cancelled++;}})));await flush();assert.equal(cancelled,1);
});
test('nullable reason and exact supplied text survive real JSON transport and journal recovery',async()=>{
 for(const reason of [null,'  exact reason\n"quoted" \\ retained  ']){
  const command={...cancel,reason},expected={...receipt,cancellation:{...cancellation,reason:reason??'client requested period-end cancellation'}};
  const f=fixture({command,override:n=>n===2?json(expected):n===4?json({...status,original:command,receipt:expected}):undefined});
  const response=await handleClientServiceRequest(request(command),f.ports);assert.equal(response.status,200);assert.deepEqual(await response.json(),expected);assert.deepEqual(f.calls[1].command,command);
 }
});

const access={state:'known',supportEndsOn:'2026-12-01',readOnlyEndsOn:'2026-12-31'};
const cancelledView={...view,serviceRevision:8,cancellation,periodEndCancellation:{state:'unavailable',reason:'already_cancelled'},postServiceAccess:access};
test('current post-cancellation access survives the real handler fixed Auth/RPC double read',async()=>{
 const f=fixture({override:(_n,command)=>command?json(cancelledView):undefined}),r=await handleClientServiceRequest(request(),f.ports);
 assert.equal(r.status,200);assert.deepEqual(await r.json(),cancelledView);assert.equal(f.calls.length,5);assert.ok(f.calls.every(c=>c.signal===f.calls[0].signal));
});
test('real handler preserves known active and expired boundaries and explicit pending unknown',async()=>{
 const values=[{...view,postServiceAccess:access},
  {...view,asOfDay:'2026-12-31',coverage:{...view.coverage,status:'expired'},periodEndCancellation:{state:'unavailable',reason:'not_active'},postServiceAccess:access},
  {...cancelledView,asOfDay:'2026-11-20',coverage:{...view.coverage,status:'cancelled'},cancellation:{...cancellation,kind:'early_departure',supportEndsOn:'2026-11-15'},postServiceAccess:{state:'known',supportEndsOn:'2026-11-15',readOnlyEndsOn:'2026-12-15'}},
  {...view,coverage:{status:'pending_publication',period:null,paidSupportEndsOn:null,pendingPublication:true},periodEndCancellation:{state:'unavailable',reason:'coverage_unknown'},postServiceAccess:{state:'unknown'}}];
 for(const value of values){const f=fixture({override:(_n,command)=>command?json(value):undefined}),r=await handleClientServiceRequest(request(),f.ports);assert.equal(r.status,200);assert.deepEqual(await r.json(),value);assert.equal(f.calls.length,5);}
});
test('access-only drift or loss at unchanged service head and basis refuses the stale current view',async()=>{
 const older={...view,cancellation,periodEndCancellation:{state:'unavailable',reason:'already_cancelled'}};
 for(const later of [older,{...cancelledView,postServiceAccess:{state:'unknown'}}]){
  const f=fixture({override:(n,command)=>command?json(n===4?later:cancelledView):undefined}),r=await handleClientServiceRequest(request(),f.ports);
  assert.equal(r.status,409);assert.deepEqual(await r.json(),{code:'basis_conflict'});assert.equal(f.calls.length,4);
 }
});
test('malformed or private current access at either real RPC return is safely unavailable',async()=>{
 for(const stage of [2,4])for(const postServiceAccess of [null,{...access,readOnlyEndsOn:'2027-01-01'},{...access,privateNotes:'PRIVATE_ACCESS_CANARY'},{state:'unknown',supportEndsOn:'2026-12-01'}]){
  const f=fixture({override:(n,command)=>command?json({...cancelledView,...(n===stage?{postServiceAccess}:{})}):undefined}),r=await handleClientServiceRequest(request(),f.ports);
  assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});assert.equal(f.calls.length,stage);
 }
});
test('known current dates never survive final actual Auth denial or original actor expiry',async(t)=>{
 for(const code of [401,403]){
  const f=fixture({override:(n,command)=>n===5?new Response(null,{status:code}):command?json(cancelledView):undefined}),r=await handleClientServiceRequest(request(),f.ports);assert.equal(r.status,code);assert.deepEqual(await r.json(),{code:code===401?'session_ended':'forbidden'});assert.equal(f.calls.length,5);
 }
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});const auth=credential({...claims,exp:start/1000+1});
 const f=fixture({token:auth,override:(n,command)=>{if(n===5)t.mock.timers.setTime(start+1000);return command?json(cancelledView):undefined;}}),r=await handleClientServiceRequest(request(read,undefined,auth),f.ports);assert.equal(r.status,401);assert.deepEqual(await r.json(),{code:'session_ended'});assert.equal(f.calls.length,5);
});

// W6 successor: the real provider must support Workers' no-follow mode.
// A closed Fetch boundary enforces that runtime contract; actual workerd proof
// is separately queued under W7's serialized resource custody.
for (const redirectStatus of [200, 301, 302, 303, 307, 308]) test(`W6 no-follow service HTTP ${redirectStatus}`, async () => {
 const calls: string[] = [];
 let cancelled = 0;
 const ports = createClientServicePorts({
  supabaseUrl: 'https://supabase.example.invalid', publicKey: 'synthetic-public-key', allowedOrigins: ['https://portal.example.invalid'],
  fetch: async (url, init) => {
   calls.push(String(url));
   assert.equal(init?.redirect, 'manual');
   assert.equal(init?.credentials, 'omit');
   assert.equal(init?.cache, 'no-store');
   if (redirectStatus !== 200) return new Response(new ReadableStream({cancel() {cancelled++;}}), {
    status: redirectStatus, headers: {location: 'https://redirect.example.invalid/private'},
   });
   return String(url).endsWith('/auth/v1/user') ? json({id: actor, is_anonymous: false}) : json(view);
  },
 });
 const response = await handleClientServiceRequest(request(), ports);
 assert.equal(response.status, redirectStatus === 200 ? 200 : 503);
 if (redirectStatus === 200) assert.deepEqual(await response.json(), view);
 else {assert.deepEqual(await response.json(), {code: 'unavailable'}); assert.equal(cancelled, 1);}
 assert.equal(calls.length, redirectStatus === 200 ? 5 : 1);
 assert.ok(calls.every(url => new URL(url).origin === 'https://supabase.example.invalid'));
});
