import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {build} from '../apps/portal/node_modules/esbuild/lib/main.js';
const evidence=path.resolve('.local-artifacts/w0-notification-transport');await mkdir(evidence,{recursive:true});
const bundle=await build({stdin:{contents:`export {createApplicationSession} from './apps/portal/src/app/session.ts';
export {createNotificationRequest} from './apps/portal/src/app/notification-request.ts';
export {default as clientGateway,advisorGateway} from './apps/portal/session-integration/runtime/server/gateway.ts';
export {ClientProvider} from './apps/portal/session-integration/runtime/server/client-upstream.ts';
export {SupabaseProvider} from './apps/portal/session-integration/runtime/server/upstream.ts';
export {SessionVault} from './apps/portal/session-integration/runtime/server/session-vault.ts';
export {CredentialEnvelope} from './apps/portal/session-integration/runtime/server/credential-envelope.ts';
export {createNotificationPorts} from './supabase/functions/concierge-notifications/runtime.ts';
export {handleNotificationRequest} from './supabase/functions/concierge-notifications/handler.ts';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,format:'esm',platform:'node',write:false,tsconfig:'apps/portal/tsconfig.frontend.json'});
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
const canonical=await build({entryPoints:['supabase/functions/concierge-notifications/index.ts'],bundle:true,format:'cjs',platform:'node',write:false,tsconfig:'apps/portal/tsconfig.frontend.json'});
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
  assert.equal(url.pathname,'/functions/v1/concierge-notifications');return state.edge?state.edge():canonicalEntry(new Request(url,{...init}));
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
 return {runtime,provider,vault,env,request,calls,state,caps,api:()=>createNotificationRequest(runtime),record:()=>record};
}
test('closed finite HTTP: actual cookie, gateway, Vault, provider and canonical Root list',async()=>{
 const f=await connected();try{assert.deepEqual(await f.api().execute(list),page);assert.equal(f.calls.filter(c=>c[1]==='/rest/v1/rpc/concierge_notification_command_v1').length,1);assert.equal(f.calls.filter(c=>c[1]==='/auth/v1/user').length,2);}finally{f.runtime.dispose();}
});
const mark={schemaVersion:1,action:'mark_seen_v1',requestId:'33333333-3333-4333-8333-333333333333',deliveryId:'44444444-4444-4444-8444-444444444444',expectedRevision:7};
const retry={...mark,action:'retry_failed_email_v1'};
const receipt=c=>({requestId:c.requestId,action:c.action,deliveryId:c.deliveryId,previousRevision:c.expectedRevision,revision:c.expectedRevision+1,recordedAt:'2026-11-01T12:00:00Z',effect:c.action==='mark_seen_v1'?'seen':'retry_queued'});
const event={eventId:'55555555-5555-4555-8555-555555555555',createdAt:'2026-11-01T00:00:00Z',source:{kind:'publication',publicationVersion:3},destination:{kind:'plan_version',version:3}};
const deliveries={...page,event,items:[{deliveryId:mark.deliveryId,channel:'email',status:'failed',revision:7,seenAt:null}]};
const readEvent={schemaVersion:1,action:'read_event_deliveries_v1',eventId:event.eventId,cursor:null,limit:5};
const status=original=>({schemaVersion:1,action:'request_status_v1',original});
const bodyForms=()=>[()=>new Response(null),()=>new Response(''),()=>new Response('<html>PRIVATE_EMAIL provider-id notes</html>'),()=>new Response('x'.repeat(100001)),()=>new Response(new ReadableStream({start(c){c.error(Error('private-stream'));}})),()=>new Response(new ReadableStream({cancel(){return new Promise(()=>{});}}))];
async function rejection(promise,statusValue){await assert.rejects(promise,e=>{assert.equal(e.status,statusValue);assert.doesNotMatch(JSON.stringify(e),/PRIVATE_EMAIL|provider-id|private-stream/);return true;});}
test('VIEW-only bookkeeping stays writable for client and advisor; exact original UUID/CAS and unknown status survive',async()=>{
 for(const audience of ['client','advisor']){const f=await connected(audience);try{
  const seen=[];f.state.rpc=c=>{seen.push(c);return Response.json(c.action==='request_status_v1'?{status:'unknown'}:receipt(c));};const api=f.api();
  assert.deepEqual(await api.execute(mark),receipt(mark));assert.deepEqual(await api.execute(status(mark)),{status:'unknown'});assert.deepEqual(seen,[mark,status(mark)]);
 }finally{f.runtime.dispose();}}
});
test('human advisor VIEW reads deliveries; only EDIT admits retry and status-original-retry',async()=>{
 for(const edit of [false,true]){const f=await connected('advisor',edit);try{
  f.state.rpc=c=>Response.json(c.action==='read_event_deliveries_v1'?deliveries:c.action==='request_status_v1'?{status:'committed',receipt:receipt(c.original)}:receipt(c));
  assert.deepEqual(await f.api().execute(readEvent),deliveries);
  if(edit){assert.deepEqual(await f.api().execute(retry),receipt(retry));assert.deepEqual(await f.api().execute(status(retry)),{status:'committed',receipt:receipt(retry)});}
  else{const before=f.calls.length;await rejection(f.api().execute(retry),403);await rejection(f.api().execute(status(retry)),403);assert.equal(f.calls.length,before);}
 }finally{f.runtime.dispose();}}
});
test('client staff/service selectors and unknown actions fail before provider egress; CSRF is required even for bookkeeping',async()=>{
 const f=await connected();try{
  for(const c of [readEvent,retry,status(retry),{...list,action:'worker_claim_v1'},{...list,action:'concierge_plan_delivery_context_v1'},{...list,action:'sms'},{...list,rpc:'other'},{...list,ownerId:owner},{...list,current:true},{...list,endpoint:'https://other.invalid'},{...list,role:'owner'}]){
   const before=f.calls.length;const r=await f.request(c);assert.ok([400,403].includes(r.status));assert.equal(f.calls.length,before);
  }
  const r=await f.request(mark,'wrong-csrf');assert.equal(r.status,403);assert.deepEqual(await r.json(),{code:'csrf_rejected'});assert.equal(f.calls.length,0);
 }finally{f.runtime.dispose();}
});
test('Root RPC and provider HTTP known401/403 survive every unreadable denial body',async()=>{
 for(const layer of ['rpc','edge'])for(const code of [401,403])for(const makeBody of bodyForms())for(const c of [list,mark]){
  const f=await connected();try{f.state[layer]=()=>{const r=makeBody();return new Response(r.body,{status:code});};await rejection(f.api().execute(c),code);assert.ok(f.calls.some(x=>x[1]==='/rest/v1/rpc/concierge_client_session_context'));}finally{f.runtime.dispose();}
 }
});
test('malformed/private/oversized success and503 preserve unavailable reads and exact-original uncertain writes at both HTTP layers',async()=>{
 for(const layer of ['rpc','edge'])for(const statusCode of [200,503])for(const body of ['', '<html>PRIVATE_EMAIL</html>', JSON.stringify({...page,metadata:{email:'PRIVATE_EMAIL'}}),'x'.repeat(100001)])for(const c of [list,mark]){
  const f=await connected();try{f.state[layer]=()=>new Response(body,{status:statusCode});await assert.rejects(f.api().execute(c),e=>{assert.equal(e.status,503);assert.equal(e.outcome,c===mark?'uncertain':'rejected');if(c===mark)assert.deepEqual(e.original,mark);return true;});}finally{f.runtime.dispose();}
 }
});
test('provider final actual context denies lost EDIT, changed owner/session/role and expired session; known denials contain no private detail',async()=>{
 for(const patch of [{capabilities:{view:true,edit:false,publish:false,confirmPayments:false}},{ownerId:'99999999-9999-4999-8999-999999999999'},{providerSessionId:'99999999-9999-4999-8999-999999999999'},{role:'agent'},{sessionNotAfter:'2020-01-01T00:00:00Z'}]){
  const f=await connected('advisor',true);try{f.state.rpc=()=>Response.json(receipt(retry));f.state.afterRpc=()=>{f.state.context=()=>Response.json({ownerId:owner,providerSessionId:providerSession,role:'advisor',sessionNotAfter:null,capabilities:f.caps,...patch});};await rejection(f.api().execute(retry),patch.sessionNotAfter?401:403);}finally{f.runtime.dispose();}
 }
});
test('caller serialization detaches before await and client original-status rejects forged or absent success',async()=>{
 const f=await connected();try{
  const seen=[];f.state.rpc=c=>{seen.push(c);return Response.json(c.action==='request_status_v1'?{status:'absent'}:receipt(c));};const c={...mark};const pending=f.api().execute(c);c.requestId='99999999-9999-4999-8999-999999999999';c.expectedRevision=99;assert.deepEqual(await pending,receipt(mark));assert.deepEqual(seen[0],mark);await rejection(f.api().execute(status(mark)),503);assert.equal(seen.length,2);
 }finally{f.runtime.dispose();}
});
test('late A completion cannot return private data or clear replacement B; disposal and relevance stay deny-only',async()=>{
 for(const action of ['replace','dispose','irrelevant']){
  const f=await connected();try{
   let entered,release;const started=new Promise(r=>{entered=r;}),held=new Promise(r=>{release=r;});f.state.rpc=async()=>{entered();await held;return Response.json(page);};const api=f.api();let applies=true;const pending=api.execute(list,{isApplicable:()=>applies});await started;
   let newApi,replacement;if(action==='replace'){replacement=await connected();f.state.browser=(input,init)=>replacement.runtime.cookie.fetcher(input,init);await f.runtime.restore();newApi=f.api();}else if(action==='dispose')api.dispose();else applies=false;
   const denied=assert.rejects(pending,e=>[401,503].includes(e.status));release();await denied;if(newApi){assert.equal(newApi.isCurrent(),true);assert.deepEqual(await newApi.execute(list),page);replacement.runtime.dispose();}
  }finally{f.runtime.dispose();}
 }
});
test('finite Root errors preserve their exact original safe envelope without inventing retryability',async()=>{
 for(const [code,statusValue] of [['revision_conflict',409],['request_conflict',409],['reconciliation_unavailable',409],['cursor_conflict',409],['not_found',404],['candidate_inactive',503]]){
  const f=await connected('advisor',true);try{f.state.rpc=()=>Response.json({message:`concierge_${code}`,details:'PRIVATE_EMAIL'}, {status:statusValue});const r=await f.request(retry);assert.equal(r.status,statusValue);assert.deepEqual(await r.json(),{code:statusValue===503?'uncertain':code});}finally{f.runtime.dispose();}
 }
});
test('provider rejects an oversized body before a pending cancellation can hold the private return',async()=>{
 const f=await connected();let releaseCancel;try{
  f.state.edge=()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(100001));},cancel(){return new Promise(r=>{releaseCancel=r;});}}));
  const pending=f.request(mark);const observed=await Promise.race([pending.then(response=>({response})),new Promise(r=>setTimeout(()=>r({late:true}),40))]);
  releaseCancel?.();const response=await pending;assert.equal(response.status,503);assert.deepEqual(await response.json(),{code:'uncertain'});assert.equal(observed.late,undefined,'predecode size rejection cannot await cancellation');
 }finally{releaseCancel?.();f.runtime.dispose();}
});
test('actual pre-dispatch provider context rejects agent or wrong-audience HTTP roles before notification egress',async()=>{
 for(const audience of ['client','advisor']){const f=await connected(audience);try{
  f.state.context=()=>Response.json({ownerId:owner,providerSessionId:providerSession,role:'agent',sessionNotAfter:null,capabilities:f.caps});const r=await f.request(list);assert.equal(r.status,403);assert.equal(f.calls.some(c=>c[1]==='/functions/v1/concierge-notifications'),false);assert.equal(f.calls.some(c=>c[1]==='/rest/v1/rpc/concierge_notification_command_v1'),false);
 }finally{f.runtime.dispose();}}
});
