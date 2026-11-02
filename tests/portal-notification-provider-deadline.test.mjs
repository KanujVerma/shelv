import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {build} from '../apps/portal/node_modules/esbuild/lib/main.js';
const evidence=path.resolve(`.local-artifacts/w0-nt1/tests-${crypto.randomUUID()}`);await mkdir(evidence,{recursive:true});
const bundle=await build({stdin:{contents:`export {createApplicationSession} from './apps/portal/src/app/session.ts';
export {createNotificationRequest} from './apps/portal/src/app/notification-request.ts';
export {default as clientGateway,advisorGateway} from './apps/portal/session-integration/runtime/server/gateway.ts';
export {ClientProvider} from './apps/portal/session-integration/runtime/server/client-upstream.ts';
export {SupabaseProvider} from './apps/portal/session-integration/runtime/server/upstream.ts';
export {SessionVault} from './apps/portal/session-integration/runtime/server/session-vault.ts';
export {CredentialEnvelope} from './apps/portal/session-integration/runtime/server/credential-envelope.ts';
export {createNotificationPorts} from './supabase/functions/concierge-notifications/runtime.ts';
export {handleNotificationRequest} from './supabase/functions/concierge-notifications/handler.ts';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,format:'esm',platform:'node',write:false,metafile:true,tsconfig:'apps/portal/tsconfig.frontend.json'});
const output=path.join(evidence,`closed-${crypto.randomUUID()}.mjs`);await writeFile(output,bundle.outputFiles[0].contents,{flag:'wx'});
const {createApplicationSession,createNotificationRequest,clientGateway,advisorGateway,ClientProvider,SupabaseProvider,SessionVault,CredentialEnvelope,createNotificationPorts,handleNotificationRequest}=await import(pathToFileURL(output).href);
const rootHandlers=new Map();
const deny=async()=>{throw Error('global_network_denied');};
globalThis.fetch=async(input,init)=>{
 const token=new Headers(init?.headers).get('authorization');const handler=rootHandlers.get(token);
 if(!handler)return deny();return handler(input,init);
};
let canonicalEntry;const originalDeno=globalThis.Deno;
globalThis.Deno={env:{get(name){
 assert.ok(['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_ANON_KEY','CONCIERGE_ALLOWED_ORIGINS'].includes(name),'no service/worker key lookup');
 return {SUPABASE_URL:'https://snojlbqovlawewwqbviz.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic',CONCIERGE_ALLOWED_ORIGINS:'https://portal.goshelv.com'}[name];
}},serve(fn){assert.equal(canonicalEntry,undefined);canonicalEntry=fn;}};
const canonical=await build({entryPoints:['supabase/functions/concierge-notifications/index.ts'],bundle:true,format:'cjs',platform:'node',write:false,metafile:true,tsconfig:'apps/portal/tsconfig.frontend.json'});
new Function(canonical.outputFiles[0].text)();assert.equal(typeof canonicalEntry,'function');
test.after(()=>{globalThis.Deno=originalDeno;globalThis.fetch=deny;});
const origin='https://portal.goshelv.com',upstream='https://snojlbqovlawewwqbviz.supabase.co';
const owner='11111111-1111-4111-8111-111111111111',providerSession='22222222-2222-4222-8222-222222222222';
const list={schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:5};
const page={schemaVersion:1,consistency:'live_keyset',observedAt:'2026-11-01T12:00:00Z',cursor:null,items:[],nextCursor:null};
async function connected(audience='client',edit=false){
 const caps={view:true,edit,publish:false,confirmPayments:false},calls=[];
 const state={rpc:()=>Response.json(page),edge:undefined,context:undefined,afterRpc:undefined};
 const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:owner,session_id:providerSession,jti:crypto.randomUUID(),exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'synthetic'].join('.');
 const credentials={access_token:token,refresh_token:'synthetic-refresh',expires_at:Date.now()/1000+3600,user:{id:owner},providerSessionId:providerSession};
 const rootHttp=async(input,init)=>{
  const url=new URL(String(input));assert.equal(url.origin,upstream);calls.push(['root',url.pathname]);assert.equal(new Headers(init?.headers).get('authorization'),`Bearer ${token}`);
  if(url.pathname==='/auth/v1/user')return Response.json({id:owner,is_anonymous:false});
  assert.equal(url.pathname,'/rest/v1/rpc/concierge_notification_command_v1');const args=JSON.parse(init.body);assert.deepEqual(Object.keys(args),['p_command']);const response=await state.rpc(args.p_command);await state.afterRpc?.();return response;
 };rootHandlers.set(`Bearer ${token}`,rootHttp);
 const provider=new (audience==='client'?ClientProvider:SupabaseProvider)('sb_publishable_synthetic',async(input,init)=>{
  const url=new URL(String(input));assert.equal(url.origin,upstream);calls.push(['provider',url.pathname]);assert.equal(new Headers(init?.headers).get('authorization'),`Bearer ${token}`);
  if(url.pathname===`/rest/v1/rpc/concierge_${audience}_session_context`)return state.context?state.context():Response.json({ownerId:owner,providerSessionId:providerSession,role:audience,sessionNotAfter:null,capabilities:caps});
  assert.equal(url.pathname,'/functions/v1/concierge-notifications');return state.edge?state.edge(input,init):canonicalEntry(new Request(url,{...init}));
 },12000,true);
 let record=null;
 const vault=new SessionVault({read:()=>record,write:r=>{record=r;}},new CredentialEnvelope(JSON.stringify({active:'synthetic',keys:{synthetic:Buffer.alloc(32,17).toString('base64url')}}),'notification-synthetic'),provider,{now:()=>Date.now(),idleMs:3600000,absoluteMs:28800000,recheckContext:true,policyAudience:audience});
 await vault.initialize(credentials,'synthetic');
 const env={PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true',ASSETS:{fetch:async()=>{throw Error('asset_unexpected');}},ADVISOR_SESSIONS:{getByName:()=>({invoke:async command=>{
  try{
   if(command.type==='session.view')return {ok:true,value:await vault.view()};
   if(command.type==='session.execute')return {ok:true,value:await vault.execute(command.csrf,(c,k)=>provider.perform(c,k,command.operation))};
   if(command.type==='session.logout-context')return {ok:true,value:vault.logoutContext()};
   throw Error('unexpected_vault_command');
  }catch(error){return {ok:false,error:{status:error.status??503,code:error.code??'unavailable'}};}
 }})}};
 const gateway=audience==='client'?clientGateway:advisorGateway;
 const request=(command,csrf=record.csrf)=>gateway.fetch(new Request(`${origin}/api/${audience}/notifications`,{method:'POST',headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','Content-Type':'application/json',Cookie:`__Host-shelv_${audience}=${'a'.repeat(43)}`,'X-Shelv-CSRF':csrf},body:JSON.stringify(command)}),env);
 const runtime=createApplicationSession({audience,locks:{request:async(_name,_options,fn)=>fn()},fetcher:async(input,init)=>{
  if(state.browser)return state.browser(input,init);
  const h=new Headers(init?.headers);h.set('Origin',origin);h.set('Sec-Fetch-Site','same-origin');h.set('Cookie',`__Host-shelv_${audience}=${'a'.repeat(43)}`);return gateway.fetch(new Request(new URL(String(input),origin),{...init,headers:h}),env);
 }});
 await runtime.restore();calls.length=0;
 return {runtime,provider,vault,env,request,calls,state,caps,providerSession,api:()=>createNotificationRequest(runtime),record:()=>record};
}
const mark={schemaVersion:1,action:'mark_seen_v1',requestId:'33333333-3333-4333-8333-333333333333',deliveryId:'44444444-4444-4444-8444-444444444444',expectedRevision:7};
const receipt={requestId:mark.requestId,action:mark.action,deliveryId:mark.deliveryId,previousRevision:7,revision:8,recordedAt:'2026-11-01T12:00:00Z',effect:'seen'};

// Bind the actual closed runtime/index graph; HTTP fixtures below are synthetic only.
const graph=await Promise.all([...new Set([...Object.keys(bundle.metafile.inputs),...Object.keys(canonical.metafile.inputs)])].filter(file=>file!=='<stdin>').sort().map(async file=>({path:file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')})));
await writeFile(path.join(evidence,'runtime-inputs.json'),JSON.stringify(graph,null,2)+'\n',{flag:'wx'});

for(const audience of ['client','advisor']){
 test(`${audience}: canonical list and mark remain actual current private results`,async()=>{
  const f=await connected(audience);try{
   const api=f.api(),boundary=f.runtime.getSnapshot().boundary;
   assert.deepEqual(await api.execute(list),page);
   f.state.rpc=c=>{assert.deepEqual(c,mark);return Response.json(receipt);};
   assert.deepEqual(await api.execute(mark),receipt);assert.equal(boundary.isCurrent(),true);assert.equal(f.record().status,'active');
  }finally{f.runtime.dispose();}
 });
 for(const status of [401,403])test(`${audience}: genuine Root${status} before abort retains its denial`,async()=>{
  const f=await connected(audience);try{
   f.state.rpc=()=>Response.json({message:status===401?'concierge_session_ended':'concierge_forbidden'},{status});
   await assert.rejects(f.api().execute(mark),{status});
   assert.equal(f.record().status,status===401?'revoked':'active');
   assert.equal(f.runtime.cookie.status,status===401?'signedout':'ready');
  }finally{f.runtime.dispose();}
 });
 for(const status of [401,403])for(const cleanup of ['throw','pending'])test(`${audience}: pre-abort HTTP${status} survives ${cleanup} unreadable-body cleanup`,async()=>{
  const f=await connected(audience);let cancelled=false,release;try{
   f.state.edge=(_input,init)=>{
    assert.equal(init.signal.aborted,false);
    return new Response(new ReadableStream({pull(){throw Error('PRIVATE_DENIAL_BODY');},cancel(){cancelled=true;if(cleanup==='throw')throw Error('PRIVATE_CANCEL');return new Promise(r=>{release=r;});}},{highWaterMark:0}),{status});
   };
   await assert.rejects(f.api().execute(mark),error=>{assert.equal(error.status,status);assert.doesNotMatch(JSON.stringify(error),/PRIVATE_/);return true;});
   assert.equal(cancelled,true);assert.equal(f.record().status,status===401?'revoked':'active');
  }finally{release?.();f.runtime.dispose();}
 });
}

// These use the real provider's 12,000ms timer. The canonical Root also retains
// its real 10,000ms timer; only the finite RPC fixture ignores both signals.
test('NT1: actual provider deadline rejects post-abort headers without certifying a denial',{concurrency:true},async t=>{
 const cases=[
  {audience:'client',command:mark,kind:'canonical'},
  {audience:'advisor',command:mark,kind:'canonical'},
  {audience:'client',command:list,kind:'canonical'},
  {audience:'advisor',command:list,kind:'late403'},
  {audience:'client',command:mark,kind:'late403'},
  {audience:'client',command:mark,kind:'late200'},
  {audience:'advisor',command:list,kind:'late200'},
  {audience:'client',command:mark,kind:'fresh401'},
  {audience:'advisor',command:{...mark,action:'retry_failed_email_v1'},kind:'lostEdit'},
 ];
 await Promise.all(cases.map(c=>t.test(`${c.audience}/${c.command.action}/${c.kind}`,async()=>{
  const f=await connected(c.audience,c.kind==='lostEdit');let release,enter;
  const held=new Promise(r=>{release=r;}),entered=new Promise(r=>{enter=r;}),observed={};
  try{
   const boundary=f.runtime.getSnapshot().boundary,seen=[];
   f.state.rpc=async command=>{seen.push(command);enter();await held;return Response.json(command.action==='list_inbox_v1'?page:{...receipt,action:command.action,effect:command.action==='retry_failed_email_v1'?'retry_queued':'seen'});};
   f.state.edge=async(input,init)=>{
    assert.equal(init.signal.aborted,false);observed.providerSignal=init.signal;
    init.signal.addEventListener('abort',()=>{observed.abort=true;release();},{once:true});
    if(['canonical','fresh401','lostEdit'].includes(c.kind)){
     const response=await canonicalEntry(new Request(input,init));observed.rootStatus=response.status;return response;
    }
    enter();await held;
    if(c.kind==='late403')return new Response(new ReadableStream({cancel(){throw Error('PRIVATE_POST_ABORT_CANCEL');}}),{status:403});
    // A strict abort fence must reject this private success without body decode.
    return new Response(new ReadableStream({pull(controller){observed.bodyRead=true;controller.enqueue(new TextEncoder().encode(JSON.stringify(c.command===list?page:receipt)));controller.close();}},{highWaterMark:0}),{status:200});
   };
   const pending=f.api().execute(c.command);const rejected=assert.rejects(pending,error=>{
    const expected=c.kind==='fresh401'?401:c.kind==='lostEdit'?403:503;
    assert.equal(error.status,expected);assert.doesNotMatch(JSON.stringify(error),/PRIVATE_/);
    if(expected===503){assert.equal(error.outcome,c.command===mark?'uncertain':'rejected');if(c.command===mark)assert.deepEqual(error.original,mark);}
    return true;
   });
   await entered;
   let serial;
   if(c.audience==='client'&&c.command===mark&&c.kind==='canonical'){
    serial=f.request(list);assert.deepEqual(seen,[mark],'the actual Vault holds B behind all of A');
   }
   if(c.kind==='fresh401')f.state.context=()=>Response.json({code:'session_ended'},{status:401});
   if(c.kind==='lostEdit'){
    // Final current capability checks remain authoritative after an abort.
    f.state.context=()=>Response.json({ownerId:owner,providerSessionId:providerSession,role:'advisor',sessionNotAfter:null,capabilities:{...f.caps,edit:false}});
   }
   await rejected;assert.equal(observed.abort,true);assert.equal(observed.providerSignal.aborted,true);
   if(['canonical','fresh401','lostEdit'].includes(c.kind))assert.equal(observed.rootStatus,401,'actual aborted Root denial');
   if(c.kind==='late200')assert.equal(observed.bodyRead,undefined,'post-abort success is cancelled before private body consumption');
   if(c.kind==='fresh401'){assert.equal(f.record().status,'revoked');assert.equal(f.runtime.cookie.status,'signedout');return;}
   if(c.kind==='lostEdit'){assert.equal(f.record().status,'active');return;}
   assert.equal(boundary.isCurrent(),true);assert.equal(f.record().status,'active');
   if(serial){const response=await serial;assert.equal(response.status,200);assert.deepEqual(await response.json(),page);assert.deepEqual(seen,[mark,list]);}
   f.state.edge=undefined;f.state.rpc=command=>{seen.push(command);assert.deepEqual(command,{schemaVersion:1,action:'request_status_v1',original:mark});return Response.json({status:'unknown'});};
   await f.runtime.restore();
   if(c.command===mark){assert.deepEqual(await f.api().execute({schemaVersion:1,action:'request_status_v1',original:mark}),{status:'unknown'});}
   else{f.state.rpc=()=>Response.json(page);assert.deepEqual(await f.api().execute(list),page);}
   assert.equal(f.record().status,'active');
  }finally{release?.();f.runtime.dispose();}
 })));
});

for(const mode of ['cancel','dispose','irrelevant'])test(`caller ${mode} never returns a held private receipt or changes Vault authority`,async()=>{
 const f=await connected();let enter,release;
 const entered=new Promise(r=>{enter=r;}),held=new Promise(r=>{release=r;});
 try{
  f.state.rpc=async()=>{enter();await held;return Response.json(receipt);};
  const api=f.api(),controller=new AbortController();let relevant=true;
  const pending=api.execute(mark,{signal:controller.signal,isApplicable:()=>relevant});
  const rejected=assert.rejects(pending,error=>{assert.ok([401,503].includes(error.status));return true;});await entered;
  if(mode==='cancel')controller.abort();else if(mode==='dispose')api.dispose();else relevant=false;
  release();await rejected;assert.equal(f.record().status,'active');assert.notEqual(f.runtime.cookie.status,'signedout');
 }finally{release?.();f.runtime.dispose();}
});
