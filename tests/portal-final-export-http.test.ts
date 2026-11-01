import assert from 'node:assert/strict';
import {test} from 'node:test';
import {handleFinalExportRequest} from '../supabase/functions/concierge-final-export/handler.ts';
import {createFinalExportPorts} from '../supabase/functions/concierge-final-export/runtime.ts';
import {collectFinalExport} from '../src/contracts/PortalFinalExportMapping.ts';
import {serializeFinalExport,createFinalExportHtmlSink} from '../supabase/functions/concierge-final-export/serializer.ts';
import {finalExportFixture,finalExportLegacyFixture,finalExportWire} from './portal-final-export-fixtures.ts';
import type {FinalExportPorts} from '../supabase/functions/concierge-final-export/handler.ts';
import type {FinalExportSink,FinalExportPlanUnit} from '../src/contracts/PortalFinalExport.ts';

const request=(body:unknown,signal?:AbortSignal)=>new Request('https://edge.example.com/concierge-final-export',{method:'POST',headers:{authorization:'Bearer finite-test','content-type':'application/json',origin:'https://portal.example.com'},body:JSON.stringify(body),signal});
const manifestCommand={schemaVersion:1,action:'read_final_export_manifest_v1'};
globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
function stagingFixture(){const html:string[]=[],text:string[]=[];let commits=0,aborts=0;const sink=createFinalExportHtmlSink({write:async(chunk)=>{html.push(chunk.html);text.push(chunk.text);},commit:async metadata=>{commits++;return metadata.filename;},abort:async()=>{aborts++;html.length=0;text.length=0;}});return {sink,html,text,get commits(){return commits;},get aborts(){return aborts;}};}

const owner='11111111-1111-4111-8111-111111111111';
test('actual handler and retained Auth runtime compose with only the fixed finite HTTP targets',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
 try{
  const wire=finalExportWire(finalExportFixture()),urls:string[]=[];
  const send:typeof fetch=async(input,init)=>{
   const url=String(input);urls.push(url);assert.equal(new Headers(init?.headers).get('authorization'),'Bearer finite-test');
   if(url==='https://synthetic.example.com/auth/v1/user')return Response.json({id:owner,is_anonymous:false});
   if(url==='https://synthetic.example.com/rest/v1/rpc/concierge_final_export_command_v1'){
    assert.equal(init?.method,'POST');const value:unknown=JSON.parse(String(init?.body));
    const {readFinalExportCommand}=await import('../src/contracts/PortalFinalExportValidation.ts');
    assert.ok(value&&typeof value==='object'&&'p_command'in value);return Response.json(await wire.read(readFinalExportCommand(value.p_command)));
   }
   throw Error('unexpected_target');
  };
  const ports=createFinalExportPorts({supabaseUrl:'https://synthetic.example.com',publicKey:'synthetic-public',allowedOrigins:['https://portal.example.com'],fetch:send});
  const staging=stagingFixture();const collected=await collectFinalExport(async command=>{
   const response=await handleFinalExportRequest(new Request('https://edge.example.com/concierge-final-export',{method:'POST',headers:{authorization:'Bearer finite-test','content-type':'application/json',origin:'https://portal.example.com'},body:JSON.stringify(command)}),ports);
   assert.equal(response.status,200);assert.match(response.headers.get('cache-control')??'',/no-store/);return response.json();
  },staging.sink);
  assert.match(staging.text.join(''),/CeraVe PM/);assert.match(staging.text.join(''),/stop if uncomfortable/);assert.doesNotMatch(staging.html.join(''),/<script|<iframe|onerror=/);assert.equal(collected.commitResult,'shelv-final-plan-v7.html');
  assert.equal(urls.filter(u=>u.endsWith('/auth/v1/user')).length,8);assert.equal(urls.filter(u=>u.endsWith('/concierge_final_export_command_v1')).length,4);
 }finally{globalThis.fetch=original;}
});

test('handler rechecks identity after the RPC and refuses a replaced or ended session',async()=>{
 const wire=finalExportWire(finalExportFixture());let auth=0;
 const ports:FinalExportPorts={allowedOrigins:['https://portal.example.com'],authenticate:async()=>++auth===1?{id:owner,is_anonymous:false}:null,rpc:async()=>({data:wire.manifest,error:null})};
 const ended=await handleFinalExportRequest(request(manifestCommand),ports);assert.equal(ended.status,401);assert.deepEqual(await ended.json(),{code:'session_ended'});
 auth=0;ports.authenticate=async()=>({id:++auth===1?owner:'22222222-2222-4222-8222-222222222222',is_anonymous:false});
 const replaced=await handleFinalExportRequest(request(manifestCommand),ports);assert.equal(replaced.status,403);assert.doesNotMatch(await replaced.text(),/recordHash|publication/);
});

test('handler rejects malformed/private upstream records with a finite public error',async()=>{
 const ports:FinalExportPorts={allowedOrigins:['https://portal.example.com'],authenticate:async()=>({id:owner,is_anonymous:false}),rpc:async()=>({data:{schemaVersion:1,status:'available',basis:{privateNote:'PRIVATE_FINAL_EXPORT_CANARY'}},error:null})};
 const response=await handleFinalExportRequest(request(manifestCommand),ports);assert.equal(response.status,503);assert.equal(await response.text(),'{"code":"unavailable"}');
 ports.rpc=async()=>({data:null,error:{message:'raw PRIVATE_FINAL_EXPORT_CANARY SQL'}});
 assert.equal(await (await handleFinalExportRequest(request(manifestCommand),ports)).text(),'{"code":"unavailable"}');
});

test('bounded upstream wrapper cancels a 400001-byte successful RPC before retained decode',async()=>{
 let cancelled=false,rpcs=0;
 const send:typeof fetch=async input=>{
  if(String(input).endsWith('/auth/v1/user'))return Response.json({id:owner,is_anonymous:false});
  rpcs++;return new Response(new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new Uint8Array(400001).fill(32));},cancel(){cancelled=true;}}),{headers:{'content-length':'1'}});
 };
 const ports=createFinalExportPorts({supabaseUrl:'https://synthetic.example.com',publicKey:'synthetic-public',allowedOrigins:['https://portal.example.com'],fetch:send});
 const response=await handleFinalExportRequest(request(manifestCommand),ports);assert.equal(response.status,503);assert.ok(cancelled);assert.equal(rpcs,1);assert.equal(await response.text(),'{"code":"unavailable"}');
});

test('body overflow, bad UTF8, origin and selectors cannot reach an RPC',async()=>{
 let rpcs=0;const ports:FinalExportPorts={allowedOrigins:['https://portal.example.com'],authenticate:async()=>({id:owner,is_anonymous:false}),rpc:async()=>{rpcs++;throw Error('RPC must not run');}};
 const overflow=new Request('https://edge.example.com/concierge-final-export',{method:'POST',headers:{authorization:'Bearer finite-test','content-type':'application/json','content-length':'1'},body:' '.repeat(100001)});
 assert.equal((await handleFinalExportRequest(overflow,ports)).status,413);
 const utf8=new Request('https://edge.example.com/concierge-final-export',{method:'POST',headers:{authorization:'Bearer finite-test','content-type':'application/json'},body:new Uint8Array([0xff,0xfe])});
 assert.equal((await handleFinalExportRequest(utf8,ports)).status,400);
 assert.equal((await handleFinalExportRequest(request({...manifestCommand,clientId:owner}),ports)).status,400);
 const foreign=request(manifestCommand);foreign.headers.set('origin','https://foreign.example.com');assert.equal((await handleFinalExportRequest(foreign,ports)).status,403);assert.equal(rpcs,0);
});

test('serializer rejects private/raw Source fields at every typed public boundary',()=>{
 const record=finalExportFixture();assert.throws(()=>serializeFinalExport({...record,privateNote:'PRIVATE_FINAL_EXPORT_CANARY'}));
 assert.throws(()=>serializeFinalExport({...record,plan:{...record.plan,rawSource:{text:'PRIVATE_FINAL_EXPORT_CANARY'}}}));
 if(record.plan.documentSchemaVersion!==3)throw Error('fixture');const product=record.plan.content.products[0];if(!product)throw Error('fixture');
 const leaked={...record,plan:{documentSchemaVersion:3,content:{...record.plan.content,products:[{...product,privateEvidence:'PRIVATE_FINAL_EXPORT_CANARY'}]}}};
 assert.throws(()=>serializeFinalExport(leaked));
});

test('serializer preserves authored public guidance and escapes ampersands and angle characters',()=>{
 const record=finalExportFixture();if(record.plan.documentSchemaVersion!==3)throw Error('fixture');record.plan.content.summary='A & B < 3';
 const exported=serializeFinalExport(record);assert.match(exported.text,/A & B < 3/);assert.match(exported.html,/A &amp; B &lt; 3/);
 assert.match(exported.text,/unknown/);assert.match(exported.text,/paused/);assert.match(exported.text,/2026-11-01/);assert.match(exported.text,/only when comfortable/);
 assert.doesNotMatch(exported.text,/use the product daily|automatic escalation|support continues/);
});

test('human-readable current instructions identify the actual product, not only an opaque instruction ID',()=>{
 const exported=serializeFinalExport(finalExportFixture()),instructions=exported.text.split('applicable instructions at support end')[1];
 assert.ok(instructions);assert.match(instructions,/applies to: CeraVe PM/);
});
test('static copy never claims the thirty-day read-only window already ended when it may still be open',()=>{
 const exported=serializeFinalExport(finalExportFixture());assert.doesNotMatch(exported.text,/interactive care access have ended|read-only access ended on/);
 assert.match(exported.text,/read-only end: 2026-12-01/);
});

test('legacy original presentation and complete applicable usage survive without a synthetic plan conversion',async()=>{
 const record=finalExportLegacyFixture(),staging=stagingFixture(),collected=await collectFinalExport(finalExportWire(record).read,staging.sink),text=staging.text.join('');
 for(const value of ['original legacy title','original public goal','Original variant','Original size','original public reference','legacy short directions','legacy original directions','legacy reason body','legacy action','legacy current comparison','legacy proposed comparison','legacy significance','legacy comparison limit','legacy evidence limit','legacy intro','legacy step body','legacy care note','legacy public source','actual latest legacy instruction','actual legacy instruction reason','original recommendation rationale','original current label','original proposed label'])assert.ok(text.includes(value),value);
 assert.equal(collected.manifest.basis.publication.documentSchemaVersion,2);assert.doesNotMatch(text,/legacy-intake-|legacy-current-products-none/);
 if(record.plan.documentSchemaVersion!==2)throw Error('fixture');const legacy=record.plan;
 assert.throws(()=>serializeFinalExport({...record,plan:{...legacy,legacyOriginal:{...legacy.legacyOriginal,recommendations:[{...legacy.legacyOriginal.recommendations[0],privateNote:'PRIVATE_FINAL_EXPORT_CANARY'}]}}}));
});
test('real HTML staging sink discards partial output on a final root/authority failure',async()=>{
 const wire=finalExportWire(finalExportFixture()),staging=stagingFixture();let manifests=0;
 await assert.rejects(collectFinalExport(async command=>command.action==='read_final_export_manifest_v1'&&manifests++>0?{...wire.manifest,rootHash:'f'.repeat(64)}:wire.read(command),staging.sink));
 assert.equal(staging.commits,0);assert.equal(staging.aborts,1);assert.equal(staging.html.length,0);assert.equal(staging.text.length,0);
});
test('HTML staging ownership rejects reentrant stage and failed commit yields only abort',async()=>{
 const record=finalExportFixture(),wire=finalExportWire(record),unit:FinalExportPlanUnit={schemaVersion:1,kind:'plan',careBasis:record.careBasis,plan:record.plan,use:record.use};let sink:FinalExportSink<string>|undefined,aborts=0;
 sink=createFinalExportHtmlSink({write:async()=>{if(!sink)throw Error('fixture');await assert.rejects(sink.stage(unit,0,wire.manifest));},commit:async()=>{throw Error('storage commit failed');},abort:async()=>{aborts++;}});
 await assert.rejects(collectFinalExport(wire.read,sink),/storage commit failed/);assert.equal(aborts,1);await assert.rejects(sink.stage(unit,0,wire.manifest));
});
