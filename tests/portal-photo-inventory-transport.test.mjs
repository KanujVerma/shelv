import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from '../apps/portal/node_modules/esbuild/lib/main.js';

const root=fileURLToPath(new URL('../',import.meta.url));
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
export * as projection from './supabase/functions/concierge-checkins/projection.ts';
export {createPhotoInventoryRequest} from './apps/portal/src/app/photo-inventory-request.ts';
import './supabase/functions/concierge-checkins/index.ts';
`,resolveDir:root,sourcefile:'photo-head-closed-entry.ts',loader:'ts'},bundle:true,write:false,metafile:true,platform:'node',format:'cjs',logLevel:'silent'};
const compiled=await build(bundleOptions);
// CJS evaluation stays in memory, including auth-js's native Node imports.
const module={exports:{}};new Function('require','module','exports',compiled.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const api=module.exports;
const rootHandlers=new Map();globalThis.fetch=async(input,init)=>{const req=input instanceof Request?input:new Request(input,init),handler=rootHandlers.get(req.headers.get('authorization'));assert.ok(handler,'global network denied');return handler(input,init);};
test.after(()=>{globalThis.fetch=originalFetch;globalThis.Deno=originalDeno;});
const owner='d1000000-0000-4000-8000-000000000001',other='d1000000-0000-4000-8000-000000000002',sid='d1000000-0000-4000-8000-000000000003';
const origin='https://portal.goshelv.com',upstream='https://snojlbqovlawewwqbviz.supabase.co';
const caps={view:true,edit:false,publish:false,confirmPayments:false};
const page={cursor:null,limit:2,expectedRevision:17};
const command={action:'read_photo_inventory_v1',...page};
const inventory={revision:17,photos:[{id:'d1000000-0000-4000-8000-000000000004',angle:'front'},{id:'d1000000-0000-4000-8000-000000000005',angle:'left'}],nextCursor:null};
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const decode=(value,input=page)=>{const mapped=api.projection.mapCheckinPhotoInventory(value,input);assert.equal(mapped.ok,true);return mapped.value;};

async function fixture(t){
 const state={rpcData:inventory,rpcError:null,contextError:null,authUser:{id:owner,is_anonymous:false},authReads:0,rpcGate:null,rpcEntered:null,holdResponse:null,responseEntered:null,overrideEdge:null,overrideWire:null,contextCount:0};
 const calls=[];let record=null;const clock=()=>Date.now();
 const token=`${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:owner,session_id:sid,jti:crypto.randomUUID(),exp:Math.floor(clock()/1000)+3600,role:'authenticated',is_anonymous:false,iss:upstream+'/auth/v1'})).toString('base64url')}.synthetic`;
 const credentials={access_token:token,refresh_token:'synthetic-refresh-never-sent',expires_at:Math.floor(clock()/1000)+3600,user:{id:owner},providerSessionId:sid};
 const closedFetch=async(input,init)=>{
  const req=input instanceof Request?input:new Request(input,init);const url=new URL(req.url);assert.equal(url.origin,upstream,'closed upstream origin');
  const auth=req.headers.get('authorization');assert.equal(auth,`Bearer ${token}`);calls.push({path:url.pathname,method:req.method,body:req.method==='POST'?await req.clone().json():null});
  if(url.pathname==='/rest/v1/rpc/concierge_client_session_context'){
   state.contextCount++;if(state.contextError)return Response.json({message:state.contextError.code},{status:state.contextError.status});
   return Response.json({ownerId:owner,providerSessionId:sid,role:'client',sessionNotAfter:null,capabilities:caps,...state.contextPatch});
  }
  if(url.pathname==='/auth/v1/user'){state.authReads++;if(state.authResponse)return state.authResponse(req);return state.authUser===null?Response.json({message:'expired'},{status:401}):Response.json(state.authUser);}
  if(url.pathname==='/functions/v1/concierge-checkins'){
   state.edgeSignal=req.signal;state.edgeEntered?.resolve();if(state.edgeResponse)return state.edgeResponse(req);if(state.overrideEdge!==null)return Response.json(state.overrideEdge);
   const response=await entry(req);if(state.edgeTransform)return state.edgeTransform(response,req);return response;
  }
  if(url.pathname==='/rest/v1/rpc/concierge_checkin_photo_inventory_v1'){
   assert.deepEqual(Object.keys(await req.clone().json()).sort(),['p_cursor','p_expected_revision','p_limit']);state.rpcEntered?.resolve();if(state.rpcGate)await state.rpcGate.promise;
   if(state.rpcResponse)return state.rpcResponse(req);if(state.rpcError)return Response.json({message:state.rpcError.code},{status:state.rpcError.status});return Response.json(state.rpcData);
  }
  if(url.pathname==='/rest/v1/rpc/concierge_checkin_head_v1')return Response.json({revision:17});
  if(url.pathname==='/rest/v1/rpc/concierge_checkin_read')return Response.json({message:'concierge_content_version_required'},{status:409});
  if(url.pathname==='/auth/v1/logout')return new Response(null,{status:204});
  assert.fail(`CLOSED unexpected upstream ${url.pathname}`);
 };
 rootHandlers.set(`Bearer ${token}`,closedFetch);
 const provider=new api.ClientProvider('sb_publishable_synthetic',closedFetch);
 const store={read:()=>record,write:r=>{record=r;}};
 const envelope=new api.CredentialEnvelope(JSON.stringify({active:'synthetic',keys:{synthetic:Buffer.alloc(32,7).toString('base64url')}}),'synthetic-in-memory-vault');
 const vault=new api.SessionVault(store,envelope,provider,{now:clock,idleMs:600000,absoluteMs:3600000,recheckContext:true,policyAudience:'client'});
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
  return state.browserTransform&&new URL(req.url).pathname==='/api/client/checkins'?state.browserTransform(response,req):response;
 };
 const app=api.createApplicationSession({audience:'client',fetcher:browserFetch,now:clock,locks:{request:async(_name,_opts,fn)=>fn()}});
 t.after(()=>{app.dispose();rootHandlers.delete(`Bearer ${token}`);});await app.restore();
 assert.equal(app.getSnapshot().status,'ready');assert.ok(app.getSnapshot().boundary?.isCurrent());
 const port=app.transport.bindCookieChannel(api.clientCookieRequest,'checkins','read',decode);
 const reader=api.createPhotoInventoryRequest(app);const browserRestore=()=>app.restore();
 return {app,port,reader,restore:browserRestore,browserFetch,provider,vault,state,calls,env,credentials,record:()=>record};
}


test('actual retained client to canonical Root returns a strict inventory PAGE while legacy M59 stays409',async t=>{
 const f=await fixture(t);const result=await f.reader.readPage(page);assert.deepEqual(result,inventory);
 assert.equal(f.state.authReads,2);assert.ok(f.state.contextCount>=4);
 assert.deepEqual(f.calls.filter(c=>c.path.endsWith('concierge_checkin_photo_inventory_v1')).map(c=>c.body),[{p_cursor:null,p_limit:2,p_expected_revision:17}]);
 assert.equal(f.calls.some(c=>/storage|checkin_write|review_command/.test(c.path)),false);
 await assert.rejects(f.port.execute({action:'client_read'}),{status:409});
});

for(const boundary of ['edgeTransform','browserTransform'])test(`${boundary}: actual Root page accepts8192 and rejects8193 before JSON`,async t=>{
 for(const maximum of [8192,8193]){
  const f=await fixture(t);let cancelled=false;
  f.state[boundary]=async response=>{
   const text=await response.text();assert.equal(response.status,200);
   const bytes=new TextEncoder().encode(' '.repeat(maximum-new TextEncoder().encode(text).length)+text);
   return new Response(new ReadableStream({start(c){c.enqueue(bytes);c.close();},cancel(){cancelled=true;}}),{status:200,headers:response.headers});
  };
  if(maximum===8192)assert.deepEqual(await f.reader.readPage(page),inventory);
  else await assert.rejects(f.reader.readPage(page),{status:503,outcome:'rejected'});
  assert.ok(f.calls.some(c=>c.path.endsWith('concierge_checkin_photo_inventory_v1')));
 }
});

test('Root strict inventory projection refuses private extras rather than producing a page',async t=>{
 const f=await fixture(t);f.state.rpcData={...inventory,path:'PRIVATE_STORAGE_PATH'};
 await assert.rejects(f.reader.readPage(page),{status:503});
});

test('Root initial zero is accepted only from an actual valid terminal response',async t=>{
 const f=await fixture(t);f.state.rpcData={revision:0,photos:[],nextCursor:null};
 assert.deepEqual(await f.reader.readPage({...page,expectedRevision:null}),f.state.rpcData);
 for(const value of [null,{},[],{revision:0,photos:null,nextCursor:null},{revision:0,photos:[]},{revision:0,photos:[],nextCursor:null,complete:true}]){
  f.state.rpcData=value;await assert.rejects(f.reader.readPage({...page,expectedRevision:null}),{status:503});await f.app.restore();
 }
});

test('cursor/head/limit and caller selectors are rejected before any operation egress',async t=>{
 const f=await fixture(t);
 for(const input of [{...page,cursor:other,expectedRevision:null},{...page,limit:0},{...page,limit:51},{...page,limit:1.5},{...page,expectedRevision:-1},{...page,expectedRevision:Number.MAX_SAFE_INTEGER+1},{...page,cursor:'not-a-uuid'},...['ownerId','clientId','role','current','url','endpoint','rpc','action','maxBytes'].map(key=>({...page,[key]:other}))]){
  const before=f.calls.length;await assert.rejects(f.reader.readPage(input),{status:400});assert.equal(f.calls.length,before);
 }
});

test('canonical UUID/page binding detaches before both actual lease waits and never writes',async t=>{
 const f=await fixture(t),entered=deferred(),release=deferred();const acquire=f.app.cookie.acquire.bind(f.app.cookie);let count=0;
 f.app.cookie.acquire=async()=>{const lease=await acquire();if(++count===1){entered.resolve();await release.promise;}return lease;};
 const input={...page};const pending=f.reader.readPage(input);await entered.promise;input.limit=50;input.expectedRevision=99;release.resolve();
 assert.deepEqual(await pending,inventory);assert.deepEqual(f.calls.filter(c=>c.path.endsWith('concierge_checkin_photo_inventory_v1')).map(c=>c.body),[{p_cursor:null,p_limit:2,p_expected_revision:17}]);
 assert.equal(f.calls.some(c=>/write|upload|storage/.test(c.path)),false);
 const cursor=inventory.photos[0].id;f.state.rpcData={revision:17,photos:[inventory.photos[1]],nextCursor:null};
 assert.deepEqual(await f.reader.readPage({cursor:cursor.toUpperCase(),limit:1,expectedRevision:17}),f.state.rpcData);
 assert.equal(f.calls.at(-2).path,'/rest/v1/rpc/concierge_client_session_context');
});

test('strict mapped pages reject duplicates/order/angles/cursors/private extras at provider and gateway',async t=>{
 const invalid=[{...inventory,revision:-1},{...inventory,revision:18},{...inventory,photos:[inventory.photos[0],inventory.photos[0]]},{...inventory,photos:[inventory.photos[1],inventory.photos[0]]},{...inventory,photos:[{...inventory.photos[0],angle:'unknown'}]},{...inventory,photos:[{...inventory.photos[0],url:'PRIVATE'}]},{...inventory,nextCursor:other},{...inventory,notes:'PRIVATE'}];
 for(const layer of ['overrideEdge','overrideWire'])for(const value of invalid){const f=await fixture(t);f.state[layer]=layer==='overrideWire'?{status:200,body:value}:value;await assert.rejects(f.reader.readPage(page),error=>{assert.equal(error.status,503);assert.doesNotMatch(JSON.stringify(error),/PRIVATE/);return true;});}
});

test('real Root409 and unknown status never become an empty inventory or acknowledgement',async t=>{
 for(const [code,status] of [['concierge_revision_conflict',409],['concierge_content_version_required',409],['unknown_private_code',418]]){
  const f=await fixture(t);f.state.rpcError={code,status};await assert.rejects(f.reader.readPage(page),{status:status===418?503:status});
 }
});

test('advisor/namespace/agent/lostVIEW are denied with no invented client selector',async t=>{
 const f=await fixture(t);
 assert.throws(()=>api.parseCommand('checkins',command),{status:403});assert.throws(()=>api.parseClientCommand('payments',command),{status:403});
 const advisor=api.createApplicationSession({audience:'advisor',fetcher:async()=>assert.fail('advisor must not dispatch')});t.after(()=>advisor.dispose());
 assert.throws(()=>api.createPhotoInventoryRequest(advisor),{status:403});
 for(const patch of [{role:'agent'},{ownerId:other},{providerSessionId:other},{capabilities:{...caps,view:false}},{sessionNotAfter:'2000-01-01'}]){
  const g=await fixture(t);g.state.contextPatch=patch;await assert.rejects(g.reader.readPage(page),{status:patch.sessionNotAfter?401:403});
  assert.equal(g.calls.some(c=>c.path==='/functions/v1/concierge-checkins'),false);
 }
});

test('final actual provider context rejects changed identity/role/VIEW before private return',async t=>{
 for(const patch of [{role:'agent'},{ownerId:other},{providerSessionId:other},{capabilities:{...caps,view:false}},{sessionNotAfter:'2000-01-01'}]){
  const f=await fixture(t);f.state.edgeTransform=async response=>{f.state.contextPatch=patch;return response;};
  await assert.rejects(f.reader.readPage(page),{status:patch.sessionNotAfter?401:403});
 }
});

test('final Root Auth identity and anonymity rechecks stay authoritative',async t=>{
 for(const user of [null,{id:other,is_anonymous:false},{id:owner,is_anonymous:true}]){
  const f=await fixture(t);f.state.authResponse=()=>f.state.authReads===1?Response.json({id:owner,is_anonymous:false}):user===null?Response.json({message:'expired'},{status:401}):Response.json(user);
  await assert.rejects(f.reader.readPage(page),{status:user===null?401:403});
 }
});

for(const layer of ['edgeTransform','browserTransform'])for(const status of [401,403])test(`${layer}: received${status} never waits for unreadable or pending cancellation bodies`,async t=>{
 for(const body of ['malformed','throw','pending']){
  const f=await fixture(t);f.state.rpcError={status,code:status===401?'concierge_session_ended':'concierge_forbidden'};let release;
  f.state[layer]=response=>{assert.equal(response.status,status);return body==='malformed'?new Response('<html>PRIVATE</html>',{status}):new Response(new ReadableStream({cancel(){if(body==='throw')throw Error('PRIVATE_CANCEL');return new Promise(r=>{release=r;});}}),{status});};
  try{await assert.rejects(f.reader.readPage(page),error=>{assert.equal(error.status,status);assert.doesNotMatch(JSON.stringify(error),/PRIVATE/);return true;});if(status===401){assert.equal(f.app.cookie.status,'signedout');assert.equal(f.record().status,'revoked');}}
  finally{release?.();}
 }
});

for(const layer of ['edgeTransform','browserTransform'])test(`${layer}: overflow chunk is cancelled without awaiting a hanging cancel`,async t=>{
 const f=await fixture(t);let cancelled=false,release;
 f.state[layer]=()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(8193));},cancel(){cancelled=true;return new Promise(r=>{release=r;});}}));
 try{await assert.rejects(f.reader.readPage(page),{status:503});assert.equal(cancelled,true);}finally{release?.();}
});

test('classification follows detached outgoing wire and leaves the old head decoder unchanged',async t=>{
 const f=await fixture(t);f.state.browserTransform=async response=>{const text=await response.text();return new Response(' '.repeat(9000-text.length)+text,{status:response.status,headers:response.headers});};
 const raw=api.clientCookieRequest('checkins',f.app.cookie);
 await assert.rejects(raw({action:'client_read',toJSON(){return command;}}),{status:503});await f.app.restore();
 assert.deepEqual(await raw({action:'read_photo_inventory_v1',toJSON(){return {action:'read_photo_head_v1'};}}),{revision:17});
});

test('false/nonliteral/throwing relevance and serialization reentry never dispatch',async t=>{
 for(const callback of [()=>false,()=>0,()=>({}),()=>{throw Error('PRIVATE_CALLBACK');}]){
  const f=await fixture(t),before=f.calls.length;await assert.rejects(f.reader.readPage(page,{isApplicable:callback}),{status:503});assert.equal(f.calls.length,before);
 }
 const f=await fixture(t),before=f.calls.length;
 await assert.rejects(f.reader.readPage({toJSON(){f.reader.dispose();return page;}}),{status:401});assert.equal(f.calls.length,before);
});

test('caller abort/disposal/relevance loss suppress held private pages without retiring another current reader',async t=>{
 for(const loss of ['abort','dispose','relevance']){
  const f=await fixture(t),entered=deferred(),release=deferred(),controller=new AbortController();let relevant=true;
  f.state.rpcEntered=entered;f.state.rpcGate=release;const pending=f.reader.readPage(page,{signal:controller.signal,isApplicable:()=>relevant});const denied=assert.rejects(pending,e=>[401,503].includes(e.status));
  await entered.promise;if(loss==='abort')controller.abort();else if(loss==='dispose')f.reader.dispose();else relevant=false;
  release.resolve();await denied;assert.notEqual(f.app.cookie.status,'signedout');f.state.rpcGate=null;
  const fresh=api.createPhotoInventoryRequest(f.app);assert.deepEqual(await fresh.readPage(page),inventory);fresh.dispose();
 }
});

test('same-owner server-generation replacement at actual browser restore rejects A and preserves B',async t=>{
 const f=await fixture(t),entered=deferred(),release=deferred();f.state.responseEntered=entered;f.state.holdResponse=release;
 const pending=f.reader.readPage(page);const denied=assert.rejects(pending,{status:401});await entered.promise;
 f.state.browserTransform=response=>response;
 // The actual new Vault generation is obtained by its ordinary same-record view.
 const record=f.record();record.generation++;await f.app.restore();
 const b=api.createPhotoInventoryRequest(f.app);release.resolve();await denied;assert.equal(f.app.cookie.status,'ready');assert.equal(b.isCurrent(),true);assert.deepEqual(await b.readPage(page),inventory);b.dispose();
});

test('actual provider12-second abort cannot turn a late Root401 into session revocation',async t=>{
 const f=await fixture(t),entered=deferred(),release=deferred();let providerAborted=false;
 f.state.edgeEntered=entered;f.state.authResponse=async()=>{await release.promise;return Response.json({message:'expired'},{status:401});};
 const started=Date.now();const pending=f.reader.readPage(page);await entered.promise;
 f.state.edgeSignal.addEventListener('abort',()=>{providerAborted=true;release.resolve();},{once:true});
 await assert.rejects(pending,{status:503,outcome:'rejected'});assert.equal(providerAborted,true);assert.ok(Date.now()-started>=12000);
 assert.equal(f.record().status,'active');assert.equal(f.app.cookie.status,'offline');assert.equal(f.app.getSnapshot().boundary.isCurrent(),true);
});

test('inventory facade rejects final local relevance lost during actual generic signal cleanup (NT2 remains shared hold)',async t=>{
 const f=await fixture(t),caller=new AbortController(),any=AbortSignal.any;let relevant=true,armed=true,removed=false;
 AbortSignal.any=function(signals){const signal=any.call(this,signals);if(armed){armed=false;const original=signal.removeEventListener.bind(signal);signal.removeEventListener=(...args)=>{original(...args);removed=true;relevant=false;};}return signal;};
 try{await assert.rejects(f.reader.readPage(page,{signal:caller.signal,isApplicable:()=>relevant}),{status:503});assert.equal(removed,true);assert.equal(f.record().status,'active');}
 finally{AbortSignal.any=any;}
});

test('browser inventory never parses a held private body after server-generation replacement',async t=>{
 const f=await fixture(t),entered=deferred(),release=deferred(),parse=JSON.parse;const prefix=' \n\t '.repeat(8);let parsed=0;
 f.state.browserTransform=async response=>{const raw=prefix+await response.text(),bytes=new TextEncoder().encode(raw);return new Response(new ReadableStream({async start(c){c.enqueue(bytes.slice(0,8));entered.resolve();await release.promise;c.enqueue(bytes.slice(8));c.close();}}),{status:response.status,headers:response.headers});};
 JSON.parse=function(text,...rest){if(typeof text==='string'&&text.startsWith(prefix))parsed++;return parse.call(this,text,...rest);};
 try{
  const pending=f.reader.readPage(page),denied=assert.rejects(pending,{status:401});await entered.promise;f.record().generation++;await f.app.restore();release.resolve();await denied;assert.equal(parsed,0);
  assert.equal(f.app.cookie.status,'ready');assert.equal(f.app.getSnapshot().boundary.isCurrent(),true);
 }finally{release.resolve();JSON.parse=parse;}
});

for(const leaseNumber of [1,2])test(`actual lease wait${leaseNumber} cannot dispatch after local retirement and real same-owner restore`,async t=>{
 const f=await fixture(t),entered=deferred(),release=deferred(),acquire=f.app.cookie.acquire.bind(f.app.cookie);let count=0;
 f.app.cookie.acquire=async()=>{const lease=await acquire();if(++count===leaseNumber){entered.resolve();await release.promise;}return lease;};
 const pending=f.reader.readPage(page),denied=assert.rejects(pending,{status:401});await entered.promise;
 assert.equal(f.calls.some(c=>c.path.endsWith('concierge_checkin_photo_inventory_v1')),false);
 f.app.cookie._end();await f.app.restore();const b=api.createPhotoInventoryRequest(f.app);release.resolve();await denied;
 assert.equal(f.app.cookie.status,'ready');assert.equal(b.isCurrent(),true);assert.deepEqual(await b.readPage(page),inventory);b.dispose();
});

test('fifty completed metadata rows and full-page cursor remain a PAGE with no completeness or byte access grant',async t=>{
 const f=await fixture(t),photos=Array.from({length:50},(_,i)=>({id:`f1000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,angle:['front','left','right'][i%3]}));
 f.state.rpcData={revision:17,photos,nextCursor:photos.at(-1).id};const result=await f.reader.readPage({cursor:null,limit:50,expectedRevision:17});
 assert.deepEqual(result,f.state.rpcData);assert.deepEqual(Object.keys(result),['revision','photos','nextCursor']);assert.equal(Object.isFrozen(result),true);assert.equal(Object.isFrozen(result.photos),true);
 assert.equal(f.calls.some(c=>/write|storage|upload|photo_authorize/.test(c.path)),false);
});

test('pre-aborted caller cannot start inventory egress',async t=>{
 const f=await fixture(t),signal=new AbortController();signal.abort();const before=f.calls.length;
 await assert.rejects(f.reader.readPage(page,{signal:signal.signal}),{status:503});assert.equal(f.calls.length,before);
});

test('inventory cannot return a private page after actual cleanup microtask suspension',async t=>{
 const f=await fixture(t),caller=new AbortController(),any=AbortSignal.any;let armed=true,suspended=false;
 AbortSignal.any=function(signals){const signal=any.call(this,signals);if(armed){armed=false;const original=signal.removeEventListener.bind(signal);signal.removeEventListener=(...args)=>{original(...args);queueMicrotask(()=>{suspended=true;f.app.cookie.suspend();});};}return signal;};
 try{await assert.rejects(f.reader.readPage(page,{signal:caller.signal}),{status:503});assert.equal(suspended,true);assert.equal(f.app.cookie.status,'offline');assert.equal(f.record().status,'active');}
 finally{AbortSignal.any=any;}
});

test('actual fixed Root RPC success reader accepts8192 and cancels8193 before final Auth',async t=>{
 for(const size of [8192,8193]){
  const f=await fixture(t);let cancelled=false,release;
  f.state.rpcResponse=()=>{const raw=JSON.stringify(inventory),bytes=new TextEncoder().encode(' '.repeat(size-raw.length)+raw);return new Response(new ReadableStream({start(c){c.enqueue(bytes.slice(0,4096));c.enqueue(bytes.slice(4096));if(size===8192)c.close();},cancel(){cancelled=true;return new Promise(r=>{release=r;});}}));};
  try{if(size===8192)assert.deepEqual(await f.reader.readPage(page),inventory);else{await assert.rejects(f.reader.readPage(page),{status:503});assert.equal(cancelled,true);assert.equal(f.state.authReads,1);assert.equal(f.state.edgeSignal.aborted,false);}}
  finally{release?.();}
 }
});

test('actual Root and browser count UTF8 crossing chunks before retaining or parsing overflow',async t=>{
 for(const layer of ['rpcResponse','browserTransform']){
  const f=await fixture(t);let cancelled=false,release;
  f.state[layer]=()=>new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(' '.repeat(8191)));c.enqueue(new TextEncoder().encode('é'));},cancel(){cancelled=true;return new Promise(r=>{release=r;});}}));
  try{await assert.rejects(f.reader.readPage(page),{status:503});assert.equal(cancelled,true);assert.equal(f.state.edgeSignal.aborted,false);}finally{release?.();}
 }
});

test('gateway rejects an oversized private extra instead of serializing a non-page',async t=>{
 const f=await fixture(t);f.state.overrideWire={status:200,body:{...inventory,privateSource:'PRIVATE'+ 'x'.repeat(8193)}};
 await assert.rejects(f.reader.readPage(page),error=>{assert.equal(error.status,503);assert.doesNotMatch(JSON.stringify(error),/PRIVATE/);return true;});
});
