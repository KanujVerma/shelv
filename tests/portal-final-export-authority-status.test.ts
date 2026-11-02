import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {FinalExportCommand} from '../src/contracts/PortalFinalExport.ts';
import {readFinalExportCommand} from '../src/contracts/PortalFinalExportValidation.ts';
import {finalExportFixture,finalExportWire} from './portal-final-export-fixtures.ts';
import {createFinalExportPorts} from '../supabase/functions/concierge-final-export/runtime.ts';
import {handleFinalExportRequest} from '../supabase/functions/concierge-final-export/handler.ts';

globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const authUrl='https://synthetic.example.com/auth/v1/user',rpcUrl='https://synthetic.example.com/rest/v1/rpc/concierge_final_export_command_v1';
const manifest:FinalExportCommand={schemaVersion:1,action:'read_final_export_manifest_v1'};
const actor=()=>Response.json({id:owner,is_anonymous:false});
const turn=()=>new Promise<void>(resolve=>setImmediate(resolve));
function latch(){let release=()=>{};const promise=new Promise<void>(resolve=>{release=resolve;});return {promise,release};}
type Mode='empty'|'non_json'|'oversized'|'body_error'|'locked'|'cancel_reject'|'cancel_pending'|'pending';
function bodyResource(status:number,mode:Mode){
 const gate=latch(),state={cancelCalls:0,cancelCompleted:false,pulls:0};let controller:ReadableStreamDefaultController<Uint8Array>|undefined,locked:ReadableStreamDefaultReader<Uint8Array>|undefined;
 const init={status,statusText:'synthetic received status',headers:{'content-type':'application/json','x-synthetic-status':'received'}};
 let response:Response;
 if(mode==='empty')response=new Response(null,init);
 else if(mode==='non_json')response=new Response('PRIVATE_FE6_DENIAL_BODY',init);
 else {
  const stream=new ReadableStream<Uint8Array>({start(c){controller=c;if(mode==='body_error')c.error(Error('PRIVATE_FE6_STREAM_ERROR'));else if(mode==='oversized'||mode==='cancel_reject'||mode==='cancel_pending')c.enqueue(new Uint8Array(400001).fill(65));else if(mode==='locked')c.enqueue(new Uint8Array([65]));},pull(){state.pulls++;},async cancel(){state.cancelCalls++;if(mode==='cancel_reject')throw Error('PRIVATE_FE6_CANCEL_ERROR');if(mode==='cancel_pending'||mode==='pending')await gate.promise;state.cancelCompleted=true;}},{highWaterMark:0});
  response=new Response(stream,init);if(mode==='locked')locked=stream.getReader();
 }
 return {response,state,release(){if(mode==='pending'&&state.cancelCalls===0)controller?.close();gate.release();locked?.releaseLock();}};
}
function harness(send:typeof fetch,command:FinalExportCommand=manifest,signal?:AbortSignal){
 const calls:{url:string;method:string|undefined}[]=[];
 const checked:typeof fetch=async(input,init)=>{const url=String(input);assert.ok(url===authUrl||url===rpcUrl,'fixed targets only');const h=new Headers(init?.headers);assert.equal(h.get('authorization'),'Bearer finite-test');assert.equal(h.get('apikey'),'synthetic-public');assert.equal(init?.credentials,'omit');assert.equal(init?.redirect,'error');assert.equal(init?.cache,'no-store');assert.ok(init?.signal instanceof AbortSignal);if(url===authUrl)assert.equal(init?.method,'GET');else {assert.equal(init?.method,'POST');assert.deepEqual(JSON.parse(String(init?.body)),{p_command:command});}calls.push({url,method:init?.method});return send(input,init);};
 const ports=createFinalExportPorts({supabaseUrl:'https://synthetic.example.com',publicKey:'synthetic-public',allowedOrigins:['https://portal.example.com'],fetch:checked});
 const request=new Request('https://edge.example.com/concierge-final-export',{method:'POST',headers:{authorization:'Bearer finite-test','content-type':'application/json',origin:'https://portal.example.com'},body:JSON.stringify(command),signal});
 return {calls,request,ports,run:()=>handleFinalExportRequest(request,ports)};
}
async function publicReply(response:Response){const text=await response.text();assert.match(response.headers.get('cache-control')??'',/no-store/);assert.equal(response.headers.get('access-control-allow-origin'),'https://portal.example.com');assert.doesNotMatch(text,/PRIVATE_FE6|CLIENT_RESULT_CANARY|access_token|raw SQL/);return {status:response.status,body:JSON.parse(text)};}
const modes:readonly Mode[]=['empty','non_json','oversized','body_error','locked','cancel_reject','cancel_pending','pending'];
const phases:readonly ('initial_auth'|'rpc'|'current_auth')[]=['initial_auth','rpc','current_auth'];
for(const phase of phases)for(const status of [401,403])for(const mode of modes)test(`received ${phase} ${status} survives ${mode} body independently with nonwaiting cleanup`,async()=>{
 const resource=bodyResource(status,mode),wire=finalExportWire(finalExportFixture());let authCalls=0;
 const h=harness(async input=>{if(String(input)===authUrl){authCalls++;return phase==='initial_auth'||phase==='current_auth'&&authCalls===2?resource.response:actor();}return phase==='rpc'?resource.response:Response.json(wire.manifest);});
 let settled=false;const pending=h.run().then(response=>{settled=true;return response;});await turn();const beforeRelease=settled;resource.release();const response=await pending,result=await publicReply(response);
 const expectedStatus=phase==='rpc'?status:401,code=phase==='initial_auth'?'unauthorized':phase==='rpc'&&status===403?'forbidden':'session_ended';assert.equal(result.status,expectedStatus);assert.deepEqual(result.body,{code});assert.equal(beforeRelease,true,'received denial must not await a body read or discard acknowledgement');
 assert.equal(h.calls.length,phase==='initial_auth'?1:phase==='rpc'?2:3);assert.equal(authCalls,phase==='current_auth'?2:1);if(mode==='cancel_pending'||mode==='pending')assert.equal(resource.state.cancelCalls,1);
});

test('an ordinary uncancelled readable RPC401 remains a known ended session',async()=>{
 const controller=new AbortController(),h=harness(async input=>String(input)===authUrl?actor():Response.json({message:'denied'},{status:401}),manifest,controller.signal);const result=await publicReply(await h.run());assert.equal(controller.signal.aborted,false);assert.equal(result.status,401);assert.deepEqual(result.body,{code:'session_ended'});assert.equal(h.calls.length,2);
});

for(const mode of ['non_json','oversized','body_error','locked'] as const)test(`malformed successful RPC ${mode} stays honest unavailable and never releases a result`,async()=>{
 const resource=bodyResource(200,mode),h=harness(async input=>String(input)===authUrl?actor():resource.response);const result=await publicReply(await h.run());resource.release();assert.equal(result.status,503);assert.deepEqual(result.body,{code:'unavailable'});assert.equal(h.calls.length,2);if(mode==='oversized')assert.equal(resource.state.cancelCalls,1);
});

test('exactly400000 successful bytes are accepted and400001 are rejected before retained decode',async()=>{
 const wire=finalExportWire(finalExportFixture()),json=JSON.stringify(wire.manifest);for(const size of [400000,400001]){const payload=json+' '.repeat(size-Buffer.byteLength(json));let cancelled=0;const h=harness(async input=>String(input)===authUrl?actor():new Response(new ReadableStream<Uint8Array>({start(c){c.enqueue(new TextEncoder().encode(payload));c.close();},cancel(){cancelled++;}})));const response=await h.run();if(size===400000){assert.equal(response.status,200);assert.deepEqual(await response.json(),wire.manifest);assert.equal(h.calls.length,3);}else {assert.deepEqual(await publicReply(response),{status:503,body:{code:'unavailable'}});assert.equal(h.calls.length,2);}assert.ok(cancelled<=1);}
});

for(const status of [400,404,500])test(`unknown ${status} without an understood body remains unavailable, not an invented denial or absence`,async()=>{
 const resource=bodyResource(status,'body_error'),h=harness(async input=>String(input)===authUrl?actor():resource.response);const result=await publicReply(await h.run());assert.deepEqual(result,{status:503,body:{code:'unavailable'}});
});

test('a lost transport response remains503 and does not fabricate received401',async()=>{
 const h=harness(async input=>{if(String(input)===authUrl)return actor();throw Error('PRIVATE_FE6_LOST_RESPONSE');});assert.deepEqual(await publicReply(await h.run()),{status:503,body:{code:'unavailable'}});
});

test('readable recognized business errors retain their existing public mapping',async()=>{
 const h=harness(async input=>String(input)===authUrl?actor():Response.json({message:'concierge_basis_conflict'},{status:400}));assert.deepEqual(await publicReply(await h.run()),{status:409,body:{code:'basis_conflict'}});
});

async function partFixture(){const record=finalExportFixture();if(record.plan.documentSchemaVersion!==3)throw Error('fixture');record.plan.content.title='CLIENT_RESULT_CANARY';const wire=finalExportWire(record),command:FinalExportCommand={schemaVersion:1,action:'read_final_export_part_v1',basis:wire.manifest.basis,partIndex:{unitIndex:0,segmentIndex:0}};return {wire,command,data:await wire.read(command)};}
for(const current of ['changed','anonymous','denied_error_body'] as const)test(`actual current Auth ${current} refuses a previously read client result`,async()=>{
 const f=await partFixture();let authCalls=0;const denied=bodyResource(401,'body_error');const h=harness(async input=>{if(String(input)===authUrl){if(++authCalls===1)return actor();if(current==='denied_error_body')return denied.response;return Response.json({id:current==='changed'?other:owner,is_anonymous:current==='anonymous'});}return Response.json(f.data);},f.command);const result=await publicReply(await h.run());assert.equal(result.status,current==='denied_error_body'?401:403);assert.deepEqual(result.body,{code:current==='denied_error_body'?'session_ended':'forbidden'});assert.equal(authCalls,2);assert.equal(h.calls.length,3);
});

test('caller abort before RPC remains fenced despite a finite fetch ignoring the signal',async()=>{
 const controller=new AbortController(),h=harness(async input=>{assert.equal(String(input),authUrl);controller.abort();return actor();},manifest,controller.signal);assert.deepEqual(await publicReply(await h.run()),{status:503,body:{code:'unavailable'}});assert.equal(h.calls.length,1);
});

test('late successful RPC after caller abort cannot release client content',async()=>{
 const f=await partFixture(),controller=new AbortController(),entered=latch(),release=latch();let authCalls=0;const h=harness(async input=>{if(String(input)===authUrl){authCalls++;return actor();}entered.release();await release.promise;return Response.json(f.data);},f.command,controller.signal);const pending=h.run();await entered.promise;controller.abort();release.release();assert.deepEqual(await publicReply(await pending),{status:503,body:{code:'unavailable'}});assert.equal(authCalls,2);
});

test('abort during current Auth remains fenced after all finite200 bodies have arrived',async()=>{
 const f=await partFixture(),controller=new AbortController();let authCalls=0;const h=harness(async input=>{if(String(input)===authUrl){if(++authCalls===2)controller.abort();return actor();}return Response.json(f.data);},f.command,controller.signal);assert.deepEqual(await publicReply(await h.run()),{status:503,body:{code:'unavailable'}});assert.equal(authCalls,2);
});

test('a completed client read still uses fixed commands, current identity and cache protections',async()=>{
 const f=await partFixture();let authCalls=0;const h=harness(async(input,init)=>{if(String(input)===authUrl){authCalls++;return actor();}const parsed:unknown=JSON.parse(String(init?.body));assert.ok(parsed&&typeof parsed==='object'&&'p_command'in parsed);return Response.json(await f.wire.read(readFinalExportCommand(parsed.p_command)));},f.command);const response=await h.run();assert.equal(response.status,200);assert.deepEqual(await response.json(),f.data);assert.equal(authCalls,2);assert.match(response.headers.get('cache-control')??'',/no-store/);
});

test('synchronous cleanup throw cannot replace a received denial with unavailable',async()=>{
 const resource=bodyResource(401,'locked'),body=resource.response.body;if(!body)throw Error('fixture');Object.defineProperty(body,'cancel',{value(){throw Error('PRIVATE_FE6_SYNCHRONOUS_CANCEL');}});const h=harness(async input=>String(input)===authUrl?actor():resource.response);const result=await publicReply(await h.run());resource.release();assert.deepEqual(result,{status:401,body:{code:'session_ended'}});
});
