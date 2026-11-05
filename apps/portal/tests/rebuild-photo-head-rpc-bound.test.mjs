const originUrl = new URL('./rebuild-photo-head-closed.test.mjs',import.meta.url).href;
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {portalCiBaselines} from '../../../tests/helpers/portal-ci-baselines.ts';
import {withoutPhotoInventory} from './helpers/photo-inventory-baseline.mjs';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from '../node_modules/esbuild/lib/main.js';
import ts from '../node_modules/typescript/lib/typescript.js';

const root=fileURLToPath(new URL('../../../',originUrl));
const baseline=process.env.PHOTO_HEAD_BASELINE==='1';
const owned=new Set(['supabase/functions/concierge-checkins/commands.ts','supabase/functions/concierge-checkins/types.ts','supabase/functions/concierge-checkins/projection.ts','supabase/functions/concierge-checkins/handler.ts','supabase/functions/concierge-checkins/index.ts','apps/portal/site/auth/client-cookie-session.js','apps/portal/session-integration/runtime/server/client-policy.ts','apps/portal/session-integration/runtime/server/client-upstream.ts','apps/portal/session-integration/runtime/server/gateway.ts']);
const originalFetch=globalThis.fetch,originalDeno=globalThis.Deno;
const denyExternal=async()=>assert.fail('CLOSED unexpected external fetch');
globalThis.fetch=denyExternal;
let entry;
globalThis.Deno={env:{get:key=>({SUPABASE_URL:'https://snojlbqovlawewwqbviz.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic',SUPABASE_SERVICE_ROLE_KEY:'synthetic-storage-never-used',CONCIERGE_ALLOWED_ORIGINS:'https://portal.goshelv.com'})[key]},serve:fn=>{entry=fn;}};
const bundleOptions={absWorkingDir:root,stdin:{contents:`
export {createApplicationSession} from './apps/portal/src/app/session.ts';
export {clientCookieRequest} from './apps/portal/src/app/retained.ts';
export {default as gateway,advisorGateway} from './apps/portal/session-integration/runtime/server/gateway.ts';
export {ClientProvider} from './apps/portal/session-integration/runtime/server/client-upstream.ts';
export {SessionVault} from './apps/portal/session-integration/runtime/server/session-vault.ts';
export {CredentialEnvelope} from './apps/portal/session-integration/runtime/server/credential-envelope.ts';
export {SessionError} from './apps/portal/session-integration/runtime/server/types.ts';
export {parseClientCommand,mapClientPhotoHeadResponse} from './apps/portal/session-integration/runtime/server/client-policy.ts';
export {parseCommand} from './apps/portal/session-integration/runtime/server/policy.ts';
export {createConciergeAuthenticatedPorts} from './supabase/functions/concierge-operations/runtime.ts';
import './supabase/functions/concierge-checkins/index.ts';
`,resolveDir:root,sourcefile:'photo-head-closed-entry.ts',loader:'ts'},bundle:true,write:false,metafile:true,platform:'node',format:'cjs',logLevel:'silent',plugins:baseline?[{name:'immutable-base-only-owned',setup(b){b.onLoad({filter:/\.(?:ts|js)$/},args=>{const rel=args.path.slice(root.length);if(!owned.has(rel))return;return {contents:portalCiBaselines.readBytes('d4125cca52cb21d0c0a79a5733662f782a0dea76',rel).toString('utf8'),loader:rel.endsWith('.ts')?'ts':'js'};});}}]:[]};
const compiled=await build(bundleOptions);
// CJS evaluation stays in memory, including auth-js's native Node imports.
const module={exports:{}};new Function('require','module','exports',compiled.outputFiles[0].text)(createRequire(originUrl),module,module.exports);
const api=module.exports;
test.after(()=>{globalThis.fetch=denyExternal;globalThis.Deno=originalDeno;});
const owner='d1000000-0000-4000-8000-000000000001',other='d1000000-0000-4000-8000-000000000002',sid='d1000000-0000-4000-8000-000000000003';
const origin='https://portal.goshelv.com',upstream='https://snojlbqovlawewwqbviz.supabase.co';
const caps={view:true,edit:false,publish:false,confirmPayments:false};
const command={action:'read_photo_head_v1'};
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const decode=value=>{assert.deepEqual(Object.keys(value),['revision']);assert.ok(Number.isSafeInteger(value.revision)&&value.revision>=0);return value;};

async function fixture(t){
 const state={rpcData:{revision:17},rpcError:null,contextError:null,authUser:{id:owner,is_anonymous:false},authReads:0,rpcGate:null,rpcEntered:null,holdResponse:null,responseEntered:null,overrideEdge:null,overrideWire:null,contextCount:0};
 const calls=[];let record=null,clock=Date.now();
 const token=`${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:owner,session_id:sid,exp:Math.floor(clock/1000)+3600,role:'authenticated',is_anonymous:false,iss:upstream+'/auth/v1'})).toString('base64url')}.synthetic`;
 const credentials={access_token:token,refresh_token:'synthetic-refresh-never-sent',expires_at:Math.floor(clock/1000)+3600,user:{id:owner},providerSessionId:sid};
 const closedFetch=async(input,init)=>{
  const req=input instanceof Request?input:new Request(input,init);const url=new URL(req.url);assert.equal(url.origin,upstream,'closed upstream origin');
  const auth=req.headers.get('authorization');assert.equal(auth,`Bearer ${token}`);calls.push({path:url.pathname,method:req.method,body:req.method==='POST'?await req.clone().json():null});
  if(url.pathname==='/rest/v1/rpc/concierge_client_session_context'){
   state.contextCount++;if(state.contextError)return Response.json({message:state.contextError.code},{status:state.contextError.status});
   return Response.json({ownerId:owner,providerSessionId:sid,role:'client',sessionNotAfter:null,capabilities:caps});
  }
  if(url.pathname==='/auth/v1/user'){state.authReads++;return state.authUser===null?Response.json({message:'expired'},{status:401}):Response.json(state.authUser);}
  if(url.pathname==='/functions/v1/concierge-checkins'){
   if(state.overrideEdge!==null)return Response.json(state.overrideEdge);
   return entry(req);
  }
  if(url.pathname==='/rest/v1/rpc/concierge_checkin_head_v1'){
   assert.deepEqual(await req.json(),{});state.rpcEntered?.resolve();if(state.rpcGate)await state.rpcGate.promise;
   if(state.rpcError)return Response.json({message:state.rpcError.code},{status:state.rpcError.status});return state.rpcResponse ?? Response.json(state.rpcData);
  }
  if(url.pathname==='/rest/v1/rpc/concierge_checkin_read')return state.legacyResponse ?? Response.json({message:'concierge_content_version_required'},{status:409});
  if(url.pathname==='/auth/v1/logout')return new Response(null,{status:204});
  assert.fail(`CLOSED unexpected upstream ${url.pathname}`);
 };
 globalThis.fetch=closedFetch;
 const provider=new api.ClientProvider('sb_publishable_synthetic',closedFetch);
 const store={read:()=>record,write:r=>{record=r;}};
 const envelope=new api.CredentialEnvelope(JSON.stringify({active:'synthetic',keys:{synthetic:Buffer.alloc(32,7).toString('base64url')}}),'synthetic-in-memory-vault');
 const vault=new api.SessionVault(store,envelope,provider,{now:()=>clock,idleMs:600000,absoluteMs:3600000,recheckContext:true,policyAudience:'client'});
 await vault.initialize(credentials,'synthetic-grant');
 const env={PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true',ASSETS:{fetch(){assert.fail('unexpected assets');}},ADVISOR_SESSIONS:{getByName(name){assert.match(name,/^client:session:/);return {async invoke(c){
  assert.equal(c.audience,'client');try{
   let value;if(c.type==='session.view')value=await vault.view();
   else if(c.type==='session.logout-context')value=vault.logoutContext();
   else if(c.type==='session.logout')value=await vault.logout(c.csrf);
   else if(c.type==='session.execute')value=await vault.execute(c.csrf,(creds,capabilities)=>provider.perform(creds,capabilities,c.operation));
   else assert.fail(`CLOSED unexpected Vault ${c.type}`);
   if(c.type==='session.execute'&&state.overrideWire!==null)value=state.overrideWire;
   return {ok:true,value};
  }catch(error){return {ok:false,error:{status:error.status??503,code:error.code??'unavailable'}};}
 }};}}};
 const browserFetch=async(input,init)=>{
  const req=new Request(new URL(input,origin),init);req.headers.set('Cookie','__Host-shelv_client='+'s'.repeat(43));req.headers.set('Origin',origin);req.headers.set('Sec-Fetch-Site','same-origin');
  const response=await api.gateway.fetch(req,env);
  if(new URL(req.url).pathname==='/api/client/checkins'&&state.holdResponse){const held=state.holdResponse;state.holdResponse=null;state.responseEntered?.resolve();await held.promise;}
  return response;
 };
 const app=api.createApplicationSession({audience:'client',fetcher:browserFetch,now:()=>clock,locks:{request:async(_name,_opts,fn)=>fn()}});
 t.after(()=>{app.dispose();globalThis.fetch=denyExternal;});await app.restore();
 assert.equal(app.getSnapshot().status,'ready');assert.ok(app.getSnapshot().boundary?.isCurrent());
 const port=app.transport.bindCookieChannel(api.clientCookieRequest,'checkins','read',decode);
 return {app,port,provider,vault,state,calls,env,credentials,advance:ms=>{clock+=ms;}};
}

test('W7 RPC streaming bound: fixed metadata response stops before consuming an oversized clinical-sized RPC body',async t=>{
 const f=await fixture(t);let consumed=0,cancelled=false,index=0;
 const prefix=new TextEncoder().encode('{"revision":17,"padding":"');const chunk=new Uint8Array(65536).fill(120);const suffix=new TextEncoder().encode('"}');
 f.state.rpcResponse=new Response(new ReadableStream({pull(c){
  const bytes=index===0?prefix:index<=48?chunk:index===49?suffix:null;index++;
  if(bytes){consumed+=bytes.byteLength;c.enqueue(bytes);}else c.close();
 },cancel(){cancelled=true;}},{highWaterMark:0}),{headers:{'Content-Type':'application/json'}});
 await assert.rejects(f.port.execute(command),{status:503});
 console.log('RPC_STREAM_OBSERVATION '+JSON.stringify({consumed,cancelled,chunks:index,rootRejects:true,maximumExpected:2097152}));
 assert.ok(consumed<=2097152+65536,'metadata must enforce a finite 2MiB-or-smaller upstream bound before buffering full oversized RPC JSON');
 assert.equal(cancelled,true,'oversized RPC body must be cancelled');
});

const utf8=new TextEncoder();
function streamed(chunks,{headers={},status=200,errorAt=-1,cancelThrows=false}={}){
 const stats={bytes:0,pulls:0,cancels:0};let index=0;
 const response=new Response(new ReadableStream({pull(c){
  stats.pulls++;
  if(index===errorAt){c.error(new Error('synthetic stream error'));return;}
  const value=chunks[index++];if(value){stats.bytes+=value.byteLength;c.enqueue(value);}else c.close();
 },cancel(){stats.cancels++;if(cancelThrows)throw Error('synthetic cancel error');}},{highWaterMark:0}),{status,headers:{'content-type':'application/json',...headers}});
 return {response,stats};
}
function chunksOf(bytes,size){const chunks=[];for(let at=0;at<bytes.byteLength;at+=size)chunks.push(bytes.slice(at,at+size));return chunks;}
function padded(size){const tiny='{"revision":17}';return utf8.encode(tiny+' '.repeat(size-tiny.length));}

test('PH1 actual fixed path accepts tiny/max-safe head JSON and exact4096 streamed bytes with harmless whitespace',async t=>{
 for(const bytes of [utf8.encode('{"revision":0}'),utf8.encode('{"revision":9007199254740991}'),padded(4096)]){
  const f=await fixture(t),s=streamed(chunksOf(bytes,257));f.state.rpcResponse=s.response;
  assert.deepEqual(await f.port.execute(command),JSON.parse(new TextDecoder().decode(bytes)));
  assert.equal(s.stats.bytes,bytes.byteLength);assert.equal(s.stats.cancels,0);assert.equal(f.state.authReads,2);
 }
});
test('PH1 actual4097 success stream cancels at overflow for missing and lying Content-Length headers',async t=>{
 for(const headers of [{},{'content-length':'1'},{'content-length':'4096'}]){
  const f=await fixture(t),s=streamed(chunksOf(padded(8192),1024),{headers});f.state.rpcResponse=s.response;
  await assert.rejects(f.port.execute(command),{status:503});
  assert.equal(s.stats.bytes,5120);assert.equal(s.stats.pulls,5);assert.equal(s.stats.cancels,1);
 }
 const f=await fixture(t),s=streamed([padded(4096),utf8.encode(' ')]);f.state.rpcResponse=s.response;
 await assert.rejects(f.port.execute(command),{status:503});assert.equal(s.stats.bytes,4097);assert.equal(s.stats.cancels,1);
});
test('PH1 actual bytes govern the bound rather than a false oversized Content-Length',async t=>{
 const f=await fixture(t),s=streamed([utf8.encode('{"revision":17}')],{headers:{'content-length':'999999999'}});f.state.rpcResponse=s.response;
 assert.deepEqual(await f.port.execute(command),{revision:17});assert.equal(s.stats.cancels,0);
});
test('PH1 fixed byte bound rejects multibyte UTF8 overflow before collecting/parsing the whole RPC JSON',async t=>{
 const text=JSON.stringify({revision:17,padding:'é'.repeat(3000)}),bytes=utf8.encode(text);assert.ok(text.length<4096&&bytes.length>4096);
 const f=await fixture(t),s=streamed(chunksOf(bytes,1024));f.state.rpcResponse=s.response;
 await assert.rejects(f.port.execute(command),{status:503});assert.equal(s.stats.bytes,5120);assert.equal(s.stats.cancels,1);assert.ok(s.stats.bytes<bytes.length);
});
test('PH1 stream failure and rejecting cancel remain safe503 without a metadata acknowledgement',async t=>{
 for(const kind of ['stream-error','cancel-error']){
  const f=await fixture(t),s=streamed(chunksOf(padded(8192),1024),kind==='stream-error'?{errorAt:1}:{cancelThrows:true});f.state.rpcResponse=s.response;
  await assert.rejects(f.port.execute(command),{status:503});
  assert.equal(s.stats.pulls,kind==='stream-error'?2:5);assert.equal(s.stats.cancels,kind==='stream-error'?0:1);
 }
});
test('PH1 shared RPC known401/403 replies preserve actual full-session denial semantics',async t=>{
 for(const status of [401,403]){
  const bytes=utf8.encode('{"message":"synthetic denial"}'+' '.repeat(9000));
  const f=await fixture(t),s=streamed(chunksOf(bytes,1024),{status});f.state.rpcResponse=s.response;
  await assert.rejects(f.port.execute(command),{status});assert.equal(s.stats.bytes,bytes.length);assert.equal(s.stats.cancels,0);
 }
});
test('PH1 actual full session legacy RPC ingress still collects more than2MiB while Root keeps its existing projection',async t=>{
 const f=await fixture(t),raw={revision:17,nextCheckinOn:null,reports:[],retainedExtra:'x'.repeat(3*1024*1024)};
 const bytes=utf8.encode(JSON.stringify(raw)),s=streamed(chunksOf(bytes,65536));f.state.legacyResponse=s.response;
 const port=f.app.transport.bindCookieChannel(api.clientCookieRequest,'checkins','read',value=>value);
 assert.deepEqual(await port.execute({action:'client_read'}),{revision:17,nextCheckinOn:null,reports:[]});
 assert.equal(s.stats.bytes,bytes.length);assert.equal(s.stats.cancels,0);assert.ok(s.stats.bytes>2*1024*1024);
});
test('PH1 actual Root/index/shared runtime legacy clinical history above2MiB remains complete',async t=>{
 const f=await fixture(t),reports=Array.from({length:850},(_,i)=>({id:`d2000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,submittedAt:'2026-11-01T12:00:00Z',comfort:'c'.repeat(1000),consistency:'u'.repeat(1000),changes:'n'.repeat(1000),photos:[]}));
 const view={revision:17,nextCheckinOn:null,reports},bytes=utf8.encode(JSON.stringify(view));assert.ok(bytes.length>2*1024*1024);
 const s=streamed(chunksOf(bytes,65536));
 globalThis.fetch=async(input,init)=>{const req=input instanceof Request?input:new Request(input,init),url=new URL(req.url);assert.equal(url.origin,upstream);assert.equal(req.headers.get('authorization'),`Bearer ${f.credentials.access_token}`);
  if(url.pathname==='/auth/v1/user')return Response.json({id:owner,is_anonymous:false});
  assert.equal(url.pathname,'/rest/v1/rpc/concierge_checkin_read');assert.deepEqual(await req.json(),{p_client_id:owner});return s.response;
 };
 const response=await entry(new Request(upstream+'/functions/v1/concierge-checkins',{method:'POST',headers:{authorization:`Bearer ${f.credentials.access_token}`,'content-type':'application/json'},body:'{"action":"client_read"}'}));
 assert.equal(response.status,200);const returned=utf8.encode(await response.text());assert.ok(returned.length>2*1024*1024);assert.deepEqual(JSON.parse(new TextDecoder().decode(returned)),view);
 assert.equal(s.stats.bytes,bytes.length);assert.equal(s.stats.cancels,0);
});
test('PH1 other exact shared RPC success names retain their existing unlimited decoder',async()=>{
 for(const name of ['concierge_checkin_read','concierge_checkin_write','concierge_checkin_head_v10','concierge_checkin_head_v1_extra']){
  const data={history:'x'.repeat(3*1024*1024)},bytes=utf8.encode(JSON.stringify(data)),s=streamed(chunksOf(bytes,65536));
  const ports=api.createConciergeAuthenticatedPorts({supabaseUrl:upstream,publicKey:'sb_publishable_synthetic',allowedOrigins:[],allowedRpcNames:[name],fetch:async(input,init)=>{assert.equal(String(input),upstream+'/rest/v1/rpc/'+name);assert.equal(init.method,'POST');return s.response;}});
  assert.deepEqual(await ports.rpc('synthetic',{name,args:{} }),{data,error:null});assert.equal(s.stats.bytes,bytes.length);assert.equal(s.stats.cancels,0);
 }
});
test('PH1 production AST differs only at the fixed-name success budget; emitted runtime JS intentionally changes',()=>{
 const name='supabase/functions/concierge-operations/runtime.ts';
 const before=portalCiBaselines.readBytes('d226194115fd5917afa591f478e4c20836bc54a8',name).toString('utf8'),after=readFileSync(root+name,'utf8');
 let replaced=0;
 const normalize=(text,strip)=>{
  const source=ts.createSourceFile(name,text,ts.ScriptTarget.ESNext,true);
  const result=ts.transform(source,[context=>{
   const visit=node=>{
    if(strip&&ts.isConditionalExpression(node)&&node.condition.getText(source)==="call.name === 'concierge_checkin_head_v1'"){
     assert.equal(node.whenTrue.getText(source),'4096');assert.equal(node.whenFalse.getText(source),'Number.MAX_SAFE_INTEGER');replaced++;return node.whenFalse;
    }
    return ts.visitEachChild(node,visit,context);
   };return node=>ts.visitNode(node,visit);
  }]);
  const value=ts.createPrinter({removeComments:true}).printFile(result.transformed[0]);result.dispose();return value;
 };
 assert.equal(normalize(withoutPhotoInventory(after,name),true),normalize(before,false));assert.equal(replaced,1);
 const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,lib:['lib.es2022.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],strict:true,noUncheckedIndexedAccess:true,verbatimModuleSyntax:true,skipLibCheck:false,allowImportingTsExtensions:true,noEmit:true,types:[]};
 function program(old){const host=ts.createCompilerHost(options),get=host.getSourceFile;
  if(old)host.getSourceFile=(file,version,onError,create)=>file===root+name?ts.createSourceFile(file,before,version,true):get(file,version,onError,create);
  const p=ts.createProgram([root+'supabase/functions/concierge-checkins/index.ts'],options,host);assert.equal(ts.getPreEmitDiagnostics(p).length,0);
  return p.getSourceFiles().filter(f=>!f.isDeclarationFile).map(f=>({path:f.fileName.slice(root.length),output:ts.transpileModule(f.text,{compilerOptions:{...options,noEmit:false},fileName:f.fileName}).outputText}));
 }
 const old=program(true),current=program(false);assert.deepEqual(old.map(f=>f.path),current.map(f=>f.path));
 const changed=current.filter((f,i)=>f.output!==old[i].output).map(f=>f.path);assert.deepEqual(changed,[name]);
 const sha=s=>createHash('sha256').update(s).digest('hex');
 console.log('PH1_ACTUAL_JS_CHANGE '+JSON.stringify({rootFiles:current.length,changed,sourceBefore:sha(before),sourceAfter:sha(after),files:current.map((f,i)=>({path:f.path,before:sha(old[i].output),after:sha(f.output)}))}));
});
