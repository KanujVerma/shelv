import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {createClientOrdersReadPorts} from '../supabase/functions/concierge-client-orders/runtime.ts';
import {handleClientOrdersReadRequest} from '../supabase/functions/concierge-client-orders/handler.ts';
import {buildClientOrdersReadRpc,mapClientOrdersReadResult} from '../src/contracts/PortalClientOrdersMapping.ts';
import {clientOrdersReadResultMaxBytes} from '../src/contracts/PortalClientOrdersValues.ts';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {clientCookieRequest} from '../apps/portal/src/app/retained.ts';
import {TransportError} from '../apps/portal/src/transport/session.ts';

// Closed synthetic HTTP only. No listener, real Auth/SQL, browser or native IPC.
globalThis.fetch=async()=>{throw Error('unexpected_network_denied');};
const broadcast=Object.getOwnPropertyDescriptor(globalThis,'BroadcastChannel');
Reflect.deleteProperty(globalThis,'BroadcastChannel');
after(()=>{if(broadcast)Object.defineProperty(globalThis,'BroadcastChannel',broadcast);});
const actor='10000000-0000-4000-8000-000000000001',session='10000000-0000-4000-8000-000000000002';
const claims={sub:actor,role:'authenticated',session_id:session,exp:4102444800};
const token=`e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.synthetic`;
const command={schemaVersion:1,action:'read_client_orders_v1'} as const;
const view={schemaVersion:1,revision:17,purchases:[],returns:[]};
const json=(value:unknown)=>new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});
const request=(value:unknown=command,signal?:AbortSignal,credential=token)=>new Request('https://edge.example.invalid/orders',{method:'POST',headers:{authorization:`Bearer ${credential}`,origin:'https://portal.example.invalid','content-type':'application/json'},body:JSON.stringify(value),signal});
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
function fixture(override?:(stage:number,url:string,init:RequestInit)=>Response|Promise<Response>|undefined,credential=token){
 const calls:string[]=[],signals:AbortSignal[]=[];
 const fetcher:typeof fetch=async(input,init={})=>{
  const url=String(input),stage=calls.push(url);assert.ok(init.signal);signals.push(init.signal);
  assert.equal(init.cache,'no-store');assert.equal(init.credentials,'omit');assert.equal(init.redirect,'manual');
  assert.equal(new Headers(init.headers).get('authorization'),`Bearer ${credential}`);
  if(stage%2){assert.equal(url,'https://project.example.invalid/auth/v1/user');assert.equal(init.method,'GET');assert.equal(init.body,undefined);}
  else{assert.equal(url,'https://project.example.invalid/rest/v1/rpc/concierge_client_orders_read_v1');assert.equal(init.method,'POST');assert.deepEqual(JSON.parse(String(init.body)),{p_command:command});}
  return await override?.(stage,url,init)??json(stage%2?{id:actor,is_anonymous:false}:view);
 };
 return {calls,signals,ports:createClientOrdersReadPorts({supabaseUrl:'https://project.example.invalid',publicKey:'synthetic-public',allowedOrigins:['https://portal.example.invalid'],fetch:fetcher})};
}
test('real handler/runtime uses Auth/RPC/Auth/RPC/Auth, fixed command and one signal',async()=>{
 const f=fixture(),response=await handleClientOrdersReadRequest(request(),f.ports);
 assert.equal(response.status,200);assert.deepEqual(await response.json(),view);assert.equal(f.calls.length,5);
 assert.ok(f.signals.every(signal=>signal===f.signals[0]));assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0');
});
test('complete projection comparison detects same-head drift, not only revision changes',async()=>{
 for(const changed of [{...view,revision:18},{...view,returns:[{privateNote:'must refuse'}]}]){
  const f=fixture(stage=>stage===4?json(changed):undefined),response=await handleClientOrdersReadRequest(request(),f.ports);
  assert.notEqual(response.status,200);assert.doesNotMatch(await response.text(),/privateNote/);
 }
 const purchase={id:actor,quoteId:null,recommendationId:null,retailer:'Synthetic Retailer',seller:'Synthetic Seller',productId:'recorded_product',productName:'Recorded Product',quantity:1,unitPriceCents:500,taxCents:0,shippingCents:0,purchasedOn:'2026-10-01',deliveredOn:null,policy:{checkedOn:'2026-10-01',url:'https://example.com/recorded-synthetic-terms',summary:'Recorded policy',openedAllowed:null,finalSale:false,returnBy:null,shipBy:null,returnCostCents:0},recordedAt:'2026-10-02T00:00:00Z',recordedBy:actor};
 const f=fixture(stage=>stage%2?undefined:json({...view,purchases:[{...purchase,productName:stage===2?'Recorded Product':'Changed At Same Head'}]}));
 const r=await handleClientOrdersReadRequest(request(),f.ports);assert.equal(r.status,409);assert.deepEqual(await r.json(),{code:'basis_conflict'});
});
for(const status of [401,403] as const)for(const stage of [1,2,3,4,5])test(`received ${status} at stage ${stage} survives throwing cleanup and local abort`,async()=>{
 const ac=new AbortController();let cleanup=0;
 const f=fixture(n=>n===stage?new Proxy(new Response(null,{status}),{get(target,key){if(['body','headers','statusText'].includes(String(key))){cleanup++;ac.abort();throw Error('private diagnostic');}return Reflect.get(target,key,target);}}):undefined);
 const response=await handleClientOrdersReadRequest(request(command,ac.signal),f.ports);assert.equal(response.status,status);
 assert.deepEqual(await response.json(),{code:status===401?'session_ended':'forbidden'});assert.equal(f.calls.length,stage);assert.equal(cleanup,1);
});
test('changed identity and anonymous Auth at either return fence refuse all private data',async()=>{
 for(const stage of [1,3,5])for(const identity of [{id:session,is_anonymous:false},{id:actor,is_anonymous:true},{id:actor}]){
  const f=fixture(n=>n===stage?json(identity):undefined);assert.equal((await handleClientOrdersReadRequest(request(),f.ports)).status,403);assert.equal(f.calls.length,stage);
 }
});
test('missing/expired token context is never a substitute for actual Auth and SQL session',async()=>{
 for(const context of [{sub:actor,role:'authenticated',exp:4102444800},{...claims,exp:0},{...claims,role:'service_role'}]){
  const credential=`e30.${Buffer.from(JSON.stringify(context)).toString('base64url')}.synthetic`;
  const f=fixture(undefined,credential);assert.equal((await handleClientOrdersReadRequest(request(command,undefined,credential),f.ports)).status,401);assert.equal(f.calls.length,1);
 }
});
test('unknown command fields, wrong origin and content type are refused without orders RPC',async()=>{
 const f=fixture();assert.equal((await handleClientOrdersReadRequest(request({...command,clientId:actor}),f.ports)).status,400);assert.equal(f.calls.length,1);
 const bad=new Request(request(),{headers:{origin:'https://other.example.invalid'}});assert.equal((await handleClientOrdersReadRequest(bad,f.ports)).status,403);assert.equal(f.calls.length,1);
 const media=new Request(request(),{headers:{authorization:`Bearer ${token}`,'content-type':'text/plain'}});assert.equal((await handleClientOrdersReadRequest(media,f.ports)).status,415);
});
test('request/Auth/full RPC bounds and malformed UTF8/JSON fail safely',async()=>{
 assert.equal((await handleClientOrdersReadRequest(request({...command,padding:'x'.repeat(8192)}),fixture().ports)).status,413);
 for(const stage of [1,2])for(const response of [()=>json({padding:'x'.repeat(stage===1?8192:clientOrdersReadResultMaxBytes)}),()=>new Response('private upstream diagnostic'),()=>new Response(new Uint8Array([0xc0,0xaf]))]){
  const f=fixture(n=>n===stage?response():undefined),r=await handleClientOrdersReadRequest(request(),f.ports);assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});
 }
 const input=new Request('https://edge.example.invalid',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:new Uint8Array([0xc0,0xaf])});
 assert.equal((await handleClientOrdersReadRequest(input,fixture().ports)).status,400);
});
test('one absolute 10s budget covers every stage with no nested renewal',async(t)=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,10,2)});
 const f=fixture(stage=>stage===3?new Promise<Response>(()=>{}):new Promise<Response>(resolve=>setTimeout(()=>resolve(json(stage%2?{id:actor,is_anonymous:false}:view)),4000)));
 const pending=handleClientOrdersReadRequest(request(),f.ports);await flush();t.mock.timers.tick(4000);await flush();t.mock.timers.tick(4000);await flush();assert.equal(f.calls.length,3);
 t.mock.timers.tick(1999);await flush();t.mock.timers.tick(1);assert.equal((await pending).status,503);
});
test('late success at each stage retires response even before the abort timer fires',async(t)=>{
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
 for(const target of [1,2,3,4,5]){
  t.mock.timers.setTime(start);let cancelled=0;
  const f=fixture(stage=>{if(stage!==target)return; t.mock.timers.setTime(start+10000);return new Response(new ReadableStream({cancel(){cancelled++;}}));});
  assert.equal((await handleClientOrdersReadRequest(request(),f.ports)).status,503);assert.equal(cancelled,1);assert.equal(f.calls.length,target);assert.equal(f.signals[0].aborted,false);
 }
});
test('blocked body cancellation is bounded by the original deadline',async(t)=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,10,2)});
 for(const stage of [1,2,3,4,5]){
  let cancelled=0;const f=fixture(n=>n===stage?new Response(new ReadableStream<Uint8Array>({pull(){return new Promise<void>(()=>{});},cancel(){cancelled++;return new Promise<void>(()=>{});}})):undefined);
  const pending=handleClientOrdersReadRequest(request(),f.ports);await flush();t.mock.timers.tick(10000);assert.equal((await pending).status,503);assert.equal(cancelled,1);
 }
});
test('blocked incoming request body consumes the same deadline and starts cleanup',async(t)=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,10,2)});let cancelled=0;
 const input=new Request('https://edge.example.invalid',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:new ReadableStream<Uint8Array>({pull(){return new Promise<void>(()=>{});},cancel(){cancelled++;}}),duplex:'half'} as RequestInit);
 const f=fixture(),pending=handleClientOrdersReadRequest(input,f.ports);await flush();t.mock.timers.tick(10000);assert.equal((await pending).status,503);assert.equal(cancelled,1);assert.equal(f.calls.length,1);
});
test('pre-aborted request starts no Auth and local abort retires a later native response',async()=>{
 const ac=new AbortController();ac.abort();const f=fixture();assert.equal((await handleClientOrdersReadRequest(request(command,ac.signal),f.ports)).status,503);assert.equal(f.calls.length,0);
 const late=new AbortController();let finish!:(value:Response)=>void,cancelled=0;
 const held=fixture(()=>new Promise<Response>(resolve=>{finish=resolve;}));const pending=handleClientOrdersReadRequest(request(command,late.signal),held.ports);await flush();late.abort();assert.equal((await pending).status,503);
 finish(new Response(new ReadableStream({cancel(){cancelled++;}})));await flush();assert.equal(cancelled,1);
});
test('server configuration and direct RPC selector are closed; missing registered lifetime refuses',async()=>{
 for(const supabaseUrl of ['http://project.example.invalid','https://project.example.invalid/path','https://x:y@project.example.invalid'])assert.throws(()=>createClientOrdersReadPorts({supabaseUrl,publicKey:'synthetic',allowedOrigins:[]}));
 const f=fixture();
 for(const call of [{name:'foreign',args:{p_command:command}},{name:'concierge_client_orders_read_v1',args:{p_command:command,clientId:actor}},buildClientOrdersReadRpc(command)])await assert.rejects(()=>f.ports.rpc(token,call as never,new AbortController().signal));
 assert.equal(f.calls.length,0);
});
test('safe SQL errors never expose upstream diagnostics',async()=>{
 for(const [message,status,code] of [['concierge_revision_conflict',409,'revision_conflict'],['concierge_forbidden',403,'forbidden'],['private SQL',503,'unavailable']] as const){
  const f=fixture(stage=>stage===2?new Response(JSON.stringify({message}),{status:400}):undefined),r=await handleClientOrdersReadRequest(request(),f.ports);assert.equal(r.status,status);assert.deepEqual(await r.json(),{code});
 }
});
test('final request-listener cleanup cannot revive a result after local abort',async()=>{
 const input=request(),remove=input.signal.removeEventListener.bind(input.signal);let cleaned=0;
 // Deliberate source hook, not naturally reachable browser behavior.
 input.signal.removeEventListener=(...args:Parameters<AbortSignal['removeEventListener']>)=>{remove(...args);cleaned++;Object.defineProperty(input.signal,'aborted',{value:true});};
 const r=await handleClientOrdersReadRequest(input,fixture().ports);assert.equal(cleaned,1);assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});
});
test('original JWT expiry is checked again after final cleanup before private return',async(t)=>{
 const start=Date.UTC(2026,10,2);t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
 const credential=`e30.${Buffer.from(JSON.stringify({...claims,exp:start/1000+1})).toString('base64url')}.synthetic`;
 const input=request(command,undefined,credential),remove=input.signal.removeEventListener.bind(input.signal);
 input.signal.removeEventListener=(...args:Parameters<AbortSignal['removeEventListener']>)=>{remove(...args);t.mock.timers.setTime(start+1000);};
 const r=await handleClientOrdersReadRequest(input,fixture(undefined,credential).ports);assert.equal(r.status,401);assert.deepEqual(await r.json(),{code:'session_ended'});
});
function ordersRequestLock<T>(name:string,callback:LockGrantedCallback<T>):Promise<Awaited<T>>;
function ordersRequestLock<T>(name:string,options:LockOptions,callback:LockGrantedCallback<T>):Promise<Awaited<T>>;
function ordersRequestLock<T>(_name:string,options:LockOptions|LockGrantedCallback<T>,callback?:LockGrantedCallback<T>):Promise<Awaited<T>>{
 const run=typeof options==='function'?options:callback;
 if(!run)return Promise.reject(Error('missing callback'));
 return Promise.resolve(run(null));
}
test('actual ApplicationSession/cookie/transport refuses the unregistered orders action',async()=>{
 let commands=0;
 const runtime=createApplicationSession({audience:'client',locks:{request:ordersRequestLock},fetcher:async(input)=>{
  if(input==='/api/client/session')return json({signedIn:true,ownerId:actor,generation:1,csrf:'synthetic',capabilities:{view:true},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});
  commands++;throw Error('unregistered action must never dispatch');
 }});
 try{
  await runtime.restore();assert.equal(runtime.getSnapshot().status,'ready');assert.ok(runtime.getSnapshot().boundary?.isCurrent());
  const port=runtime.transport.bindCookieChannel(clientCookieRequest,'operations','read',value=>mapClientOrdersReadResult(value,command));
  await assert.rejects(()=>port.execute(buildClientOrdersReadRpc(command).args.p_command),error=>error instanceof TransportError&&error.status===403);assert.equal(commands,0);
 }finally{runtime.dispose();}
});

for(const status of [301,302,303,307,308])for(const stage of ['auth','rpc'])test(`manual redirects ${status} at ${stage} refuse before reading bodies or following Location`,async()=>{
 let cancelled=0;
 const redirect=()=>new Proxy(new Response(new ReadableStream({cancel(){cancelled++;return new Promise<void>(()=>{});}}),{status,headers:{location:'https://foreign.example.invalid/private'}}),{get(target,key){if(key==='headers')throw Error('redirect headers must not be read');return Reflect.get(target,key,target);}});
 const f=fixture(n=>n===(stage==='auth'?1:2)?redirect():undefined);
 const response=await handleClientOrdersReadRequest(request(),f.ports);assert.equal(response.status,503);assert.deepEqual(await response.json(),{code:'unavailable'});assert.equal(cancelled,1);assert.equal(f.calls.length,stage==='auth'?1:2);
});
