import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from '../node_modules/esbuild/lib/main.js';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const baseline=process.env.PHOTO_HEAD_BASELINE==='1';
const owned=new Set(['supabase/functions/concierge-checkins/commands.ts','supabase/functions/concierge-checkins/types.ts','supabase/functions/concierge-checkins/projection.ts','supabase/functions/concierge-checkins/handler.ts','supabase/functions/concierge-checkins/index.ts','apps/portal/site/auth/client-cookie-session.js','apps/portal/session-integration/runtime/server/client-policy.ts','apps/portal/session-integration/runtime/server/client-upstream.ts','apps/portal/session-integration/runtime/server/gateway.ts']);
const originalFetch=globalThis.fetch,originalDeno=globalThis.Deno;
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
import './supabase/functions/concierge-checkins/index.ts';
`,resolveDir:root,sourcefile:'photo-head-closed-entry.ts',loader:'ts'},bundle:true,write:false,metafile:true,platform:'node',format:'cjs',logLevel:'silent',plugins:baseline?[{name:'immutable-base-only-owned',setup(b){b.onLoad({filter:/\.(?:ts|js)$/},args=>{const rel=args.path.slice(root.length);if(!owned.has(rel))return;return {contents:execFileSync('git',['show',`d4125cca52cb21d0c0a79a5733662f782a0dea76:${rel}`],{cwd:root,encoding:'utf8'}),loader:rel.endsWith('.ts')?'ts':'js'};});}}]:[]};
const compiled=await build(bundleOptions);
// CJS evaluation stays in memory, including auth-js's native Node imports.
const module={exports:{}};new Function('require','module','exports',compiled.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const api=module.exports;
test.after(()=>{globalThis.fetch=originalFetch;globalThis.Deno=originalDeno;});
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
   if(state.rpcError)return Response.json({message:state.rpcError.code},{status:state.rpcError.status});return Response.json(state.rpcData);
  }
  if(url.pathname==='/rest/v1/rpc/concierge_checkin_read')return Response.json({message:'concierge_content_version_required'},{status:409});
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
 t.after(()=>{app.dispose();globalThis.fetch=originalFetch;});await app.restore();
 assert.equal(app.getSnapshot().status,'ready');assert.ok(app.getSnapshot().boundary?.isCurrent());
 const port=app.transport.bindCookieChannel(api.clientCookieRequest,'checkins','read',decode);
 return {app,port,provider,vault,state,calls,env,credentials,advance:ms=>{clock+=ms;}};
}

test('actual ApplicationSession/cookie/gateway/Vault/ClientProvider/Root entry returns independent metadata',async t=>{
 const f=await fixture(t);const result=await f.port.execute(command);assert.deepEqual(result,{revision:17});
 assert.equal(f.state.authReads,2);assert.ok(f.state.contextCount>=4);
 assert.deepEqual(f.calls.filter(c=>c.path.endsWith('concierge_checkin_head_v1')).map(c=>c.body),[{}]);
 assert.equal(f.calls.some(c=>/storage|checkin_write|review_command/.test(c.path)),false);
 assert.deepEqual(Object.keys(result),['revision']);
});

test('full fixed path permits a proven zero and rejects null/extra/unsafe responses at all three positive edges',async t=>{
 const f=await fixture(t);f.state.rpcData={revision:0};assert.deepEqual(await f.port.execute(command),{revision:0});
 for(const boundary of ['rpcData','overrideEdge'])for(const data of [null,{},[],{revision:null},{revision:-1},{revision:1.1},{revision:'0'},{revision:Number.MAX_SAFE_INTEGER+1},{revision:17,reportHead:55},{revision:17,clinical:'PRIVATE_CANARY'}]){
  if(boundary==='overrideEdge'&&data===null)continue;
  f.state[boundary]=data;await assert.rejects(f.port.execute(command),{status:503});f.state[boundary]=boundary==='rpcData'?{revision:17}:null;await f.app.restore();
 }
 for(const body of [{revision:17,extra:true},null,{revision:'17'}]){
  f.state.overrideWire={status:200,body};await assert.rejects(f.port.execute(command),{status:503});f.state.overrideWire=null;await f.app.restore();
 }
});

test('injection and old advisor actions remain denied before Root/RPC and raw upload classification is unchanged',async t=>{
 const f=await fixture(t),before=f.calls.length;
 for(const key of ['clientId','ownerId','userId','rpc','url','headers','expectedRevision'])await assert.rejects(f.port.execute({...command,[key]:other}),{status:400});
 assert.equal(f.calls.length,before);
 const request=new Request(origin+'/api/advisor/checkins',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(command)});
 assert.equal((await api.gateway.fetch(request,f.env)).status,404);
 assert.throws(()=>api.parseCommand('checkins',command),{status:403});
 assert.throws(()=>api.parseClientCommand('payments',command),{status:403});
});

test('anonymous/null/currently revoked and expired transcripts are rejected without a metadata acknowledgement',async t=>{
 for(const [code,status] of [['concierge_forbidden',403],['concierge_session_ended',401],['concierge_not_found',404]]){
  const f=await fixture(t);f.state.rpcError={code,status};await assert.rejects(f.port.execute(command),{status});
 }
 for(const user of [null,{id:owner,is_anonymous:true}]){
  const f=await fixture(t);f.state.authUser=user;await assert.rejects(f.port.execute(command),{status:user===null?401:403});
 }
});

test('actual post-wait Root identity and Vault context rechecks reject late positive RPC transcripts',async t=>{
 for(const failure of ['identity','owner','context']){
  const f=await fixture(t);
  f.state.rpcGate=deferred();f.state.rpcEntered=deferred();const attempt=f.port.execute(command);await f.state.rpcEntered.promise;
  if(failure==='identity')f.state.authUser=null;else if(failure==='owner')f.state.authUser={id:other,is_anonymous:false};else f.state.contextError={status:403,code:'forbidden'};
  f.state.rpcGate.resolve();await assert.rejects(attempt,{status:failure==='identity'?401:403});
 }
});

test('actual signout retires the boundary before a held metadata success can return',async t=>{
 const f=await fixture(t),held=deferred();f.state.holdResponse=held;f.state.responseEntered=deferred();
 const attempt=f.port.execute(command);await f.state.responseEntered.promise;const old=f.app.getSnapshot().boundary;
 await f.app.signOut();assert.equal(f.app.getSnapshot().boundary,null);assert.equal(old.isCurrent(),false);
 held.resolve();await assert.rejects(attempt,{status:401});
});

test('deadline, deny-only applicability and current failed read cannot authorize held acknowledgement or writes',async t=>{
 const f=await fixture(t),held=deferred();f.state.holdResponse=held;f.state.responseEntered=deferred();let applicable=true;
 const attempt=f.port.execute(command,{isApplicable:()=>applicable});await f.state.responseEntered.promise;
 f.state.rpcError={status:403,code:'concierge_forbidden'};await assert.rejects(f.port.execute(command),{status:403});
 applicable=false;held.resolve();await assert.rejects(attempt,{status:503});
 f.state.rpcError=null;f.advance(3600001);await assert.rejects(f.port.execute(command),{status:401});
 assert.equal(f.calls.some(c=>/storage|checkin_write/.test(c.path)),false);
});

test('existing metadata body and upstream response byte limits stay finite',async t=>{
 const f=await fixture(t);await assert.rejects(f.port.execute({...command,padding:'x'.repeat(100001)}),{status:413});
 f.state.overrideEdge={revision:17,padding:'x'.repeat(2000001)};await assert.rejects(f.port.execute(command),{status:503});
});
test('actual legacy client read still returns M59 conflict without a head fallback',async t=>{
 const f=await fixture(t);await assert.rejects(f.port.execute({action:'client_read'}),{status:409});
 assert.equal(f.calls.some(c=>c.path.endsWith('concierge_checkin_head_v1')),false);
 assert.deepEqual(await f.port.execute(command),{revision:17});
 assert.equal(f.calls.filter(c=>c.path.endsWith('concierge_checkin_read')).length,1);
 assert.equal(f.calls.filter(c=>c.path.endsWith('concierge_checkin_head_v1')).length,1);
});

test('source bundle includes actual canonical entry and session graph with no disk output',()=>{
 assert.equal(compiled.outputFiles.length,1);
 for(const path of ['supabase/functions/concierge-checkins/index.ts','apps/portal/src/app/session.ts','apps/portal/site/auth/client-cookie-session.js','apps/portal/session-integration/runtime/server/session-vault.ts','apps/portal/session-integration/runtime/server/gateway.ts','apps/portal/session-integration/runtime/server/client-upstream.ts'])assert.ok(Object.keys(compiled.metafile.inputs).includes(path),path);
});
test('entire actual closed session/gateway/Root graph emits byte-identical JavaScript across six Parent annotations',async()=>{
 const handler='supabase/functions/concierge-checkins/handler.ts';
 const previous=execFileSync('git',['show',`b42742a1:${handler}`],{cwd:root});
 const before=await build({...bundleOptions,plugins:[{name:'only-admitted-six-annotation-preimage',setup(b){b.onLoad({filter:/concierge-checkins\/handler\.ts$/},args=>{assert.equal(args.path,root+handler);return {contents:previous.toString('utf8'),loader:'ts'};});}}]});
 assert.deepEqual(Object.keys(before.metafile.inputs),Object.keys(compiled.metafile.inputs));
 assert.equal(before.outputFiles[0].text,compiled.outputFiles[0].text);
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 console.log('CLOSED_GRAPH_JS_BYTE_EXACT '+JSON.stringify({inputCount:Object.keys(compiled.metafile.inputs).length,bundleSha256:sha(compiled.outputFiles[0].text),files:Object.keys(compiled.metafile.inputs).filter(f=>f!=='photo-head-closed-entry.ts').map(f=>({path:f,before:sha(f===handler?previous:readFileSync(new URL('../../../'+f,import.meta.url))),after:sha(readFileSync(new URL('../../../'+f,import.meta.url)))}))}));
});
