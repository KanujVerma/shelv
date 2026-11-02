import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from '../node_modules/esbuild/lib/main.js';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const owner='d1000000-0000-4000-8000-000000000001';
const other='d1000000-0000-4000-8000-000000000002';
const photo=n=>`d2000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const base='https://synthetic.invalid';
const command={action:'read_photo_inventory_v1',cursor:null,limit:2,expectedRevision:null};
const page={revision:17,photos:[{id:photo(1),angle:'front'},{id:photo(2),angle:'left'}],nextCursor:photo(2)};
const deny=async()=>assert.fail('CLOSED unexpected external fetch');
globalThis.fetch=deny;
const priorDeno=globalThis.Deno;
let entry;
globalThis.Deno={env:{get:key=>({SUPABASE_URL:base,SUPABASE_PUBLISHABLE_KEY:'synthetic-public-key',SUPABASE_SERVICE_ROLE_KEY:'synthetic-never-used-storage',CONCIERGE_ALLOWED_ORIGINS:'https://portal.invalid'})[key]},serve:fn=>{entry=fn;}};
const built=await build({absWorkingDir:root,stdin:{contents:`import './supabase/functions/concierge-checkins/index.ts';`,resolveDir:root,sourcefile:'inventory-root-entry.ts',loader:'ts'},bundle:true,write:false,metafile:true,platform:'node',format:'cjs',logLevel:'silent'});
assert.ok(Object.keys(built.metafile.inputs).includes('supabase/functions/concierge-operations/runtime.ts'));
const module={exports:{}};
new Function('require','module','exports',built.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
test.after(()=>{globalThis.fetch=deny;globalThis.Deno=priorDeno;});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};

function fixture(t){
 const calls=[],state={data:structuredClone(page),auth:{id:owner,is_anonymous:false},authReads:0,error:null,entered:null,wait:null,response:null,authWait:null,authEntered:null,legacyGoalHistory:true};
 globalThis.fetch=async(input,init)=>{
  const req=input instanceof Request?input:new Request(input,init),url=new URL(req.url);
  assert.equal(url.origin,base);assert.equal(req.headers.get('authorization'),'Bearer closed-synthetic');assert.equal(req.headers.get('apikey'),'synthetic-public-key');
  calls.push({path:url.pathname,method:req.method,args:req.method==='POST'?await req.clone().json():null});
  if(url.pathname==='/auth/v1/user'){
   state.authReads++;
   if(state.authReads===2){state.authEntered?.resolve();if(state.authWait)await state.authWait.promise;}
   return state.auth===null?Response.json({message:'expired'},{status:401}):Response.json(state.auth);
  }
  if(url.pathname==='/rest/v1/rpc/concierge_checkin_read'){
   assert.deepEqual(await req.json(),{p_client_id:owner});assert.equal(state.legacyGoalHistory,true);
   return Response.json({message:'concierge_content_version_required'},{status:409});
  }
  assert.equal(url.pathname,'/rest/v1/rpc/concierge_checkin_photo_inventory_v1');
  state.entered?.resolve();if(state.wait)await state.wait.promise;
  return state.response??(state.error?Response.json({message:state.error.message},{status:state.error.status}):Response.json(state.data));
 };
 t.after(()=>{globalThis.fetch=deny;});
 const run=(body=command,signal)=>entry(new Request(base+'/functions/v1/concierge-checkins',{method:'POST',headers:{authorization:'Bearer closed-synthetic','content-type':'application/json',origin:'https://portal.invalid'},body:JSON.stringify(body),signal}));
 return {state,calls,run};
}

test('Root actual legacy Goal/amendment history409 is retained while completed-photo inventory uses the fixed RPC',async t=>{
 const f=fixture(t);
 const legacy=await f.run({action:'client_read'});assert.equal(legacy.status,409);assert.deepEqual(await legacy.json(),{code:'content_version_required',retryable:false});
 f.calls.length=0;
 const result=await f.run();assert.equal(result.status,200);assert.deepEqual(await result.json(),page);
 assert.deepEqual(f.calls.map(c=>c.path),['/auth/v1/user','/rest/v1/rpc/concierge_checkin_photo_inventory_v1','/auth/v1/user']);
 assert.deepEqual(f.calls[1].args,{p_cursor:null,p_limit:2,p_expected_revision:null});assert.match(result.headers.get('cache-control'),/no-store/);
});

test('Root pages are explicit terminal metadata, including zero and all50 completed identities',async t=>{
 for(const revision of [0,17,Number.MAX_SAFE_INTEGER]){
  const f=fixture(t);f.state.data={revision,photos:[],nextCursor:null};
  const result=await f.run({...command,expectedRevision:revision});assert.equal(result.status,200);assert.deepEqual(await result.json(),f.state.data);
 }
 const f=fixture(t);f.state.data={revision:17,photos:Array.from({length:50},(_,i)=>({id:photo(i+1),angle:['front','left','right'][i%3]})),nextCursor:null};
 const result=await f.run({...command,limit:50});assert.equal(result.status,200);assert.deepEqual(await result.json(),f.state.data);
});

test('Root rejects selectors and malformed pagination before fixed RPC dispatch',async t=>{
 const invalid=[...['clientId','ownerId','rpc','url','total','requestId','current'].map(k=>({...command,[k]:owner})),
  ...[0,51,1.5,'2',null,Number.MAX_SAFE_INTEGER+1].map(limit=>({...command,limit})),
  ...[-1,0.5,'17',Number.MAX_SAFE_INTEGER+1].map(expectedRevision=>({...command,expectedRevision})),
  {...command,cursor:photo(1)}, {...command,cursor:'not-a-uuid',expectedRevision:17},
  {action:command.action,cursor:null,limit:2},{action:command.action,limit:2,expectedRevision:null},{action:command.action,cursor:null,expectedRevision:null}];
 for(const body of invalid){const f=fixture(t);assert.equal((await f.run(body)).status,400);assert.equal(f.calls.filter(c=>c.method==='POST').length,0);}
});

test('Root strict inventory projection refuses unknown fields, invalid identity/order/bounds/snapshot without partial data',async t=>{
 const bad=[null,[],{}, {revision:17}, {...page,reportHead:77},{...page,total:2},{...page,privateNote:'PRIVATE_CANARY'},
  ...[null,'17',-1,1.5,Number.MAX_SAFE_INTEGER+1].map(revision=>({...page,revision})),
  {...page,revision:18}, {...page,nextCursor:photo(1)}, {...page,nextCursor:photo(3)}, {...page,nextCursor:photo(2).toUpperCase()},
  {...page,photos:[]}, {...page,photos:[page.photos[0]]},{...page,photos:[...page.photos,{id:photo(3),angle:'right'}]},
  {...page,photos:[...page.photos].reverse()}, {...page,photos:[page.photos[0],page.photos[0]]},
  ...['id','angle','path','signedUrl','sha256','clientId','state'].map(k=>({...page,photos:[{...page.photos[0],[k]:k==='id'?'bad':k==='angle'?'back':'PRIVATE_CANARY'},page.photos[1]]})),
  {...page,photos:[{id:photo(1).toUpperCase(),angle:'front'},page.photos[1]]}];
 for(const value of bad){
  const f=fixture(t);f.state.data=value;const result=await f.run({...command,expectedRevision:17});
  assert.equal(result.status,503,JSON.stringify(value));assert.deepEqual(await result.json(),{code:'unavailable',retryable:true});
 }
 const f=fixture(t);f.state.data={revision:17,photos:[{id:photo(1),angle:'front'}],nextCursor:null};
 assert.equal((await f.run({...command,cursor:photo(1),expectedRevision:17})).status,503);
});

test('Root actual post-wait Auth identity/null/anonymous denials never acknowledge inventory',async t=>{
 for(const auth of [null,{id:other,is_anonymous:false},{id:owner,is_anonymous:true}]){
  const f=fixture(t);f.state.entered=deferred();f.state.wait=deferred();
  const pending=f.run();await f.state.entered.promise;f.state.auth=auth;f.state.wait.resolve();
  const result=await pending;assert.equal(result.status,auth===null?401:403);assert.equal('photos' in await result.json(),false);
 }
});

test('Root final Auth wait, cancellation and changed-head conflicts remain closed',async t=>{
 const f=fixture(t);f.state.authEntered=deferred();f.state.authWait=deferred();const abort=new AbortController();
 const pending=f.run(command,abort.signal);await f.state.authEntered.promise;abort.abort();f.state.authWait.resolve();
 assert.equal((await pending).status,503);
 for(const [status,message,expected] of [[409,'concierge_revision_conflict',409],[403,'concierge_forbidden',403],[401,'concierge_session_ended',401]]){
  const g=fixture(t);g.state.error={status,message};const result=await g.run({...command,cursor:photo(1),expectedRevision:17});
  assert.equal(result.status,expected);assert.equal('photos' in await result.json(),false);
 }
});
