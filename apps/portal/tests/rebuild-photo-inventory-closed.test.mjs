import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from '../node_modules/esbuild/lib/main.js';
import {execFileSync} from 'node:child_process';

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
const built=await build({absWorkingDir:root,stdin:{contents:`export {createConciergeAuthenticatedPorts} from './supabase/functions/concierge-operations/runtime.ts'; import './supabase/functions/concierge-checkins/index.ts';`,resolveDir:root,sourcefile:'inventory-root-entry.ts',loader:'ts'},bundle:true,write:false,metafile:true,platform:'node',format:'cjs',logLevel:'silent',plugins:process.env.PHOTO_INVENTORY_OLD_RPC_BUDGET==='1'?[{name:'immutable-before-inventory-budget',setup(b){b.onLoad({filter:/concierge-operations\/runtime\.ts$/},args=>({contents:execFileSync('git',['show','3bd152a259b7b9b9971caa1546e65f69de12aab9:supabase/functions/concierge-operations/runtime.ts'],{cwd:root,encoding:'utf8'}),loader:'ts'}));}}]:[]});
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

const utf8=new TextEncoder();
const padded=(size)=>{const text=JSON.stringify(page);assert.ok(text.length<=size);return utf8.encode(text+' '.repeat(size-text.length));};
function streamed(bytes,{chunkSize=1024,headers={},status=200,errorAt=-1,cancelThrows=false}={}){
 const stats={bytes:0,pulls:0,cancels:0};let at=0;
 const response=new Response(new ReadableStream({pull(c){
  stats.pulls++;
  if(stats.pulls===errorAt){c.error(new Error('synthetic stream failure'));return;}
  if(at===bytes.length){c.close();return;}
  const part=bytes.slice(at,at+chunkSize);at+=part.length;stats.bytes+=part.length;c.enqueue(part);
 },cancel(){stats.cancels++;if(cancelThrows)throw new Error('synthetic cancellation failure');}},{highWaterMark:0}),{status,headers:{'content-type':'application/json',...headers}});
 return {response,stats};
}

test('inventory actual RPC success admits exactly8192 UTF8 bytes despite lying Content-Length',async t=>{
 for(const headers of [{},{'content-length':'1'},{'content-length':'999999999'}]){
  const f=fixture(t),s=streamed(padded(8192),{headers,chunkSize:257});f.state.response=s.response;
  const result=await f.run();assert.equal(result.status,200);assert.deepEqual(await result.json(),page);
  assert.equal(s.stats.bytes,8192);assert.equal(s.stats.cancels,0);
 }
});
test('inventory actual RPC success8193 cancels at overflow before oversized JSON acknowledgement',async t=>{
 for(const headers of [{},{'content-length':'1'},{'content-length':'8192'}]){
  const f=fixture(t),s=streamed(padded(8193),{headers});f.state.response=s.response;
  const result=await f.run();assert.equal(result.status,503);assert.deepEqual(await result.json(),{code:'unavailable',retryable:true});
  assert.equal(s.stats.bytes,8193);assert.equal(s.stats.cancels,1);assert.equal(f.state.authReads,1);
 }
});
test('inventory actual oversized UTF8 stream stops on crossing chunk; stream and cancel errors stay503',async t=>{
 const text=JSON.stringify({...page,padding:'é'.repeat(5000)}),bytes=utf8.encode(text);assert.ok(text.length<8192&&bytes.length>8192);
 for(const options of [{},{cancelThrows:true},{errorAt:2}]){
  const f=fixture(t),s=streamed(bytes,options);f.state.response=s.response;
  assert.equal((await f.run()).status,503);assert.equal(s.stats.bytes,options.errorAt?1024:9216);assert.equal(s.stats.cancels,options.errorAt?0:1);
 }
 const f=fixture(t),s=streamed(padded(3*1024*1024),{chunkSize:65536});f.state.response=s.response;
 assert.equal((await f.run()).status,503);assert.equal(s.stats.bytes,65536);assert.equal(s.stats.cancels,1);
});
test('inventory known401/403 and malformed or interrupted error bodies preserve denial without pages',async t=>{
 for(const status of [401,403])for(const mode of ['large','error','malformed']){
  const f=fixture(t),s=streamed(mode==='malformed'?utf8.encode('{'):utf8.encode('{"message":"denied"}'+' '.repeat(9000)),{status,...(mode==='error'?{errorAt:2}:{})});f.state.response=s.response;
  const result=await f.run();assert.equal(result.status,status);assert.equal('photos' in await result.json(),false);
  if(mode==='large'){assert.equal(s.stats.bytes,9020);assert.equal(s.stats.cancels,0);}
 }
});
test('retained head4096 and legacy/near-match unlimited RPC decoders keep their exact bounds',async()=>{
 for(const name of ['concierge_checkin_head_v1','concierge_checkin_read','concierge_checkin_write','concierge_checkin_photo_inventory_v10','concierge_checkin_photo_inventory_v1_extra']){
  const bytes=name==='concierge_checkin_head_v1'?utf8.encode('{"revision":17}'+' '.repeat(4097-15)):utf8.encode(JSON.stringify({history:'x'.repeat(3*1024*1024)}));
  const s=streamed(bytes,{chunkSize:1024});
  const ports=module.exports.createConciergeAuthenticatedPorts({supabaseUrl:base,publicKey:'synthetic-public-key',allowedOrigins:[],allowedRpcNames:[name],fetch:async(input,init)=>{assert.equal(String(input),base+'/rest/v1/rpc/'+name);assert.equal(init.method,'POST');return s.response;}});
  if(name==='concierge_checkin_head_v1'){await assert.rejects(ports.rpc('closed-synthetic',{name,args:{}}));assert.equal(s.stats.cancels,1);}
  else {const result=await ports.rpc('closed-synthetic',{name,args:{}});assert.equal(result.error,null);assert.equal(result.data.history.length,3*1024*1024);assert.equal(s.stats.cancels,0);assert.equal(s.stats.bytes,bytes.length);}
 }
});

test('Root page ownership uses captured input and immutable result bytes through reentrant final Auth',async t=>{
 const f=fixture(t);f.state.authEntered=deferred();f.state.authWait=deferred();
 const pending=f.run({...command,cursor:photo(1),expectedRevision:17});
 f.state.data={revision:17,photos:[{id:photo(2),angle:'left'},{id:photo(3),angle:'right'}],nextCursor:null};
 await f.state.authEntered.promise;
 const prior=f.state.authWait;f.state.authWait=null;
 f.state.data={revision:18,photos:[{id:photo(4),angle:'front'}],nextCursor:null};
 const b=await f.run({...command,expectedRevision:18});assert.equal(b.status,200);assert.equal((await b.json()).revision,18);
 prior.resolve();const a=await pending;assert.equal(a.status,200);assert.deepEqual(await a.json(),{revision:17,photos:[{id:photo(2),angle:'left'},{id:photo(3),angle:'right'}],nextCursor:null});
 assert.deepEqual(f.calls.filter(c=>c.path.endsWith('concierge_checkin_photo_inventory_v1')).map(c=>c.args),[{p_cursor:photo(1),p_limit:2,p_expected_revision:17},{p_cursor:null,p_limit:2,p_expected_revision:18}]);
});
