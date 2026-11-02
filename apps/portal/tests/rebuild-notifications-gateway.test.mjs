// Separate finite-HTTP composition. The unchanged43 intentionally bypasses this
// real, serial Vault path. No success/authority/current implementation is replaced.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';import {pathToFileURL,fileURLToPath} from 'node:url';import path from 'node:path';
import {build} from '../node_modules/esbuild/lib/main.js';
import {createApplicationSession} from '../src/app/session.ts';
import {createNotificationsController} from '../src/features/notifications/controller.ts';
import {readNotificationCommand} from '../../../src/contracts/PortalNotificationValidation.ts';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const evidence=path.join(root,'.local-artifacts/w2-notifications-followup');await mkdir(evidence,{recursive:true});
// Server-only bundle keeps browser cookie/WeakMap identities in their one actual
// Node module graph, shared by the ApplicationSession and feature controller.
const bundle=await build({absWorkingDir:root,stdin:{contents:`export {default as clientGateway,advisorGateway} from './apps/portal/session-integration/runtime/server/gateway.ts';
export {ClientProvider} from './apps/portal/session-integration/runtime/server/client-upstream.ts';
export {SupabaseProvider} from './apps/portal/session-integration/runtime/server/upstream.ts';
export {SessionVault} from './apps/portal/session-integration/runtime/server/session-vault.ts';
export {CredentialEnvelope} from './apps/portal/session-integration/runtime/server/credential-envelope.ts';
export {createNotificationPorts} from './supabase/functions/concierge-notifications/runtime.ts';
export {handleNotificationRequest} from './supabase/functions/concierge-notifications/handler.ts';`,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,tsconfig:'apps/portal/tsconfig.frontend.json'});
const file=path.join(evidence,`gateway-${crypto.randomUUID()}.mjs`);await writeFile(file,bundle.outputFiles[0].contents,{flag:'wx'});
const {clientGateway,advisorGateway,ClientProvider,SupabaseProvider,SessionVault,CredentialEnvelope,createNotificationPorts,handleNotificationRequest}=await import(pathToFileURL(file).href);
const id=n=>`30000000-0000-4000-8000-${String(n).padStart(12,'0')}`,origin='https://portal.goshelv.com',upstream='https://snojlbqovlawewwqbviz.supabase.co',at='2026-11-01T12:00:00Z';
const event={eventId:id(1),createdAt:at,source:{kind:'publication',publicationVersion:3},destination:{kind:'plan_version',version:3}},item={deliveryId:id(2),revision:4,seenAt:null,event,email:{status:'failed',revision:2}};
const page=(revision=4,seenAt=null)=>({schemaVersion:1,consistency:'live_keyset',observedAt:at,cursor:null,items:[{...item,revision,seenAt}],nextCursor:null});
const receipt=c=>({requestId:c.requestId,action:c.action,deliveryId:c.deliveryId,previousRevision:c.expectedRevision,revision:c.expectedRevision+1,recordedAt:at,effect:c.action==='mark_seen_v1'?'seen':'retry_queued'});
const gate=()=>{let enter,release;return {entered:new Promise(r=>enter=r),promise:new Promise(r=>release=r),enter:()=>enter(),release:()=>release()};};
async function fixture(t,audience='client',edit=false){
 const owner=id(90),providerSession=id(91),caps={view:true,edit,publish:false,confirmPayments:false},commands=[],events=[],steps=[];
 let record=null,contextPatch={},now=Date.now(),queued=0;const waits=[];
 const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:owner,session_id:providerSession,jti:crypto.randomUUID(),exp:Math.floor(now/1000)+3600})).toString('base64url'),'synthetic'].join('.');
 const credentials={access_token:token,refresh_token:'SYNTHETIC-refresh',expires_at:now/1000+3600,user:{id:owner},providerSessionId:providerSession};
 const ports=createNotificationPorts({supabaseUrl:upstream,publicKey:'sb_publishable_synthetic',allowedOrigins:[origin],fetch:async(input,init)=>{
  const url=new URL(String(input));assert.equal(url.origin,upstream);assert.equal(new Headers(init.headers).get('authorization'),`Bearer ${token}`);
  if(url.pathname==='/auth/v1/user'){events.push('auth');return Response.json({id:owner,is_anonymous:false});}
  assert.equal(url.pathname,'/rest/v1/rpc/concierge_notification_command_v1');const c=readNotificationCommand(JSON.parse(init.body).p_command),step=steps.shift();assert.ok(step,'unexpected Root RPC '+c.action);assert.equal(c.action,step.action);commands.push(c);events.push('rpc:'+c.action+':start');
  if(step.hold){step.hold.enter();await step.hold.promise;}step.after?.();events.push('rpc:'+c.action+':end');
  return Response.json(typeof step.body==='function'?step.body(c):step.body,{status:step.status});
 }});
 const provider=new (audience==='client'?ClientProvider:SupabaseProvider)('sb_publishable_synthetic',async(input,init)=>{
  const url=new URL(String(input));assert.equal(url.origin,upstream);assert.equal(new Headers(init.headers).get('authorization'),`Bearer ${token}`);
  if(url.pathname===`/rest/v1/rpc/concierge_${audience}_session_context`){events.push('context');return Response.json({ownerId:owner,providerSessionId:providerSession,role:audience,sessionNotAfter:null,capabilities:caps,...contextPatch});}
  assert.equal(url.pathname,'/functions/v1/concierge-notifications');events.push('edge');return handleNotificationRequest(new Request(url,init),ports);
 },12000,true);
 const vault=new SessionVault({read:()=>record,write:r=>{record=r;}},new CredentialEnvelope(JSON.stringify({active:'synthetic',keys:{synthetic:Buffer.alloc(32,27).toString('base64url')}}),'w2-notification-synthetic'),provider,{now:()=>now,idleMs:3600000,absoluteMs:28800000,recheckContext:true,policyAudience:audience});
 await vault.initialize(credentials,'SYNTHETIC');
 const env={PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true',ASSETS:{fetch:async()=>{throw Error('unexpected asset');}},ADVISOR_SESSIONS:{getByName:()=>({invoke:async command=>{
  try{
   if(command.type==='session.view')return {ok:true,value:await vault.view()};
   if(command.type==='session.execute'){
    events.push('queued:'+command.operation.command.action);queued++;for(const w of waits)if(queued>=w.n)w.resolve();
    return {ok:true,value:await vault.execute(command.csrf,(c,k)=>provider.perform(c,k,command.operation))};
   }
   if(command.type==='session.logout-context')return {ok:true,value:vault.logoutContext()};
   if(command.type==='session.logout')return {ok:true,value:await vault.logout(command.csrf)};
   throw Error('unexpected Vault command '+command.type);
  }catch(error){return {ok:false,error:{status:error.status??503,code:error.code??'unavailable'}};}
 }})}};
 const gateway=audience==='client'?clientGateway:advisorGateway;
 const runtime=createApplicationSession({audience,now:()=>now,locks:{request:async(_n,_o,run)=>run()},fetcher:async(input,init)=>{
  const u=new URL(String(input),origin);assert.ok([`/api/${audience}/session`,`/api/${audience}/notifications`,`/api/${audience}/logout`].includes(u.pathname));
  const headers=new Headers(init?.headers);headers.set('Origin',origin);headers.set('Sec-Fetch-Site','same-origin');headers.set('Cookie',`__Host-shelv_${audience}=${'a'.repeat(43)}`);
  return gateway.fetch(new Request(u,{...init,headers}),env);
 }});await runtime.restore();t.after(()=>runtime.dispose());
 return {runtime,commands,events,record:()=>record,reply(action,body,status=200,hold=null,after=null){steps.push({action,body,status,hold,after});},queued:()=>queued,whenQueued(n){return queued>=n?Promise.resolve():new Promise(resolve=>waits.push({n,resolve}));},context(patch){contextPatch=patch;},now(v){now=v;}};
}
async function ready(t,audience='client',edit=false){const f=await fixture(t,audience,edit),c=createNotificationsController(f.runtime);t.after(()=>c.dispose());f.reply('list_inbox_v1',page());await c.loadInbox();assert.equal(c.getSnapshot().phase,'ready');return {f,c};}
test('full source chain serializes newer B behind held A and cancelled A cannot overwrite B',{timeout:20000},async t=>{
 const {f,c}=await ready(t),h=gate();f.reply('list_inbox_v1',page(7),200,h);const a=c.loadInbox();await h.entered;const before=f.queued();f.reply('list_inbox_v1',page(8));const b=c.loadInbox();await f.whenQueued(before+1);assert.equal(f.commands.length,2,'B is queued in actual Vault, not dispatched');assert.equal(c.getSnapshot().phase,'loading');
 h.release();await Promise.all([a,b]);assert.equal(c.getSnapshot().inbox.items[0].revision,8);assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.runtime.getSnapshot().boundary.isCurrent(),true);
 t.diagnostic(JSON.stringify({serializedRpcOrder:f.events.filter(x=>x.startsWith('rpc:')),finalPhase:c.getSnapshot().phase,cookieStatus:f.runtime.cookie.status}));
 assert.deepEqual(f.events.filter(x=>x.startsWith('rpc:')),['rpc:list_inbox_v1:start','rpc:list_inbox_v1:end','rpc:list_inbox_v1:start','rpc:list_inbox_v1:end','rpc:list_inbox_v1:start','rpc:list_inbox_v1:end']);
});
test('actual serialized write, ordinary remount and matching historical status retain one exact original',{timeout:20000},async t=>{
 const {f,c:a}=await ready(t),h=gate();f.reply('mark_seen_v1',receipt,200,h);const old=a.markSeen(item.deliveryId);await h.entered;const original=f.commands.at(-1);a.dispose();const b=createNotificationsController(f.runtime);t.after(()=>b.dispose());const before=f.queued();f.reply('list_inbox_v1',page(8,at));const loading=b.loadInbox();await f.whenQueued(before+1);assert.equal(f.commands.length,2);h.release();await Promise.all([old,loading]);
 assert.equal(b.getSnapshot().inbox.items[0].revision,8);assert.deepEqual(b.getSnapshot().pending,original);assert.equal(f.runtime.cookie.status,'ready');f.reply('request_status_v1',{status:'committed',receipt:receipt(original)});f.reply('list_inbox_v1',page(9,at));await b.checkStatus();assert.equal(b.getSnapshot().receipt.revision,5);assert.equal(b.getSnapshot().inbox.items[0].revision,9);assert.equal(b.getSnapshot().pending,null);assert.equal(f.commands.filter(c=>c.action==='mark_seen_v1').length,1);
});
test('actual gateway write503 stays uncertain across restore/remount and unknown never authorizes a new UUID',{timeout:20000},async t=>{
 const {f,c:a}=await ready(t);f.reply('mark_seen_v1',{message:'concierge_uncertain'},503);await a.markSeen(item.deliveryId);const original=f.commands.at(-1);assert.equal(f.runtime.cookie.status,'offline');assert.equal(a.getSnapshot().inbox,null);a.dispose();await f.runtime.restore();const b=createNotificationsController(f.runtime);t.after(()=>b.dispose());f.reply('list_inbox_v1',page());await b.loadInbox();assert.deepEqual(b.getSnapshot().pending,original);f.reply('request_status_v1',{status:'unknown'});await b.checkStatus();const n=f.commands.length;await b.markSeen(item.deliveryId);assert.equal(f.commands.length,n);assert.equal(b.getSnapshot().mutation,'unknown');f.reply('mark_seen_v1',receipt);f.reply('list_inbox_v1',page(5,at));await b.retryExact();assert.deepEqual(f.commands[n],original);assert.equal(b.getSnapshot().pending,null);
});
for(const status of [401,403])test(`actual uncancelled Root HTTP${status} clears private controller state with truthful session outcome`,{timeout:20000},async t=>{
 const {f,c}=await ready(t);const boundary=f.runtime.getSnapshot().boundary;f.reply('list_inbox_v1',{message:status===401?'concierge_session_ended':'concierge_forbidden'},status);await c.loadInbox();assert.equal(c.getSnapshot().inbox,null);assert.equal(c.getSnapshot().phase,status===401?'ended':'denied');assert.equal(f.runtime.cookie.status,status===401?'signedout':'ready');assert.equal(boundary.isCurrent(),status!==401);assert.equal(f.record().status,status===401?'revoked':'active');
});
test('actual provider HTTP role loss rejects human delivery reads without a positive role port',{timeout:20000},async t=>{
 const {f,c}=await ready(t,'advisor',true);f.context({role:'agent'});await c.openEvent(item.deliveryId);assert.equal(c.getSnapshot().deliveries,null);assert.ok(['ended','denied'].includes(c.getSnapshot().phase));assert.equal(f.commands.length,1,'no staff event RPC after actual context loses human role');
});
test('A06 actual human VIEW status and EDIT-only confirmed retry use only the existing event command family',{timeout:20000},async t=>{
 const target={draftId:id(30),clientId:id(31),contentRevision:2,assignmentRevision:1,contentHash:'a'.repeat(64)},command={schemaVersion:1,action:'publish_plan_v1',requestId:id(32),target,approvalId:id(33),firstServiceClaimId:null},published={requestId:id(32),publicationReceiptId:id(34),target,kind:'care_plan',publicationVersion:3,instructionId:null,reviewId:null,publishedAt:at,firstServiceStarted:false,notificationEventId:event.eventId};
 const delivery=(status='failed',revision=2)=>({schemaVersion:1,consistency:'live_keyset',observedAt:at,cursor:null,event,items:[{deliveryId:id(3),channel:'email',status,revision,seenAt:null}],nextCursor:null});
 for(const edit of [false,true]){const f=await fixture(t,'advisor',edit),c=createNotificationsController(f.runtime);t.after(()=>c.dispose());f.reply('read_event_deliveries_v1',delivery());await c.openPublication(command,published);assert.equal(c.getSnapshot().deliveries.items[0].status,'failed');c.prepareRetry(id(3));assert.equal(f.commands.length,1);
  if(edit){assert.ok(c.getSnapshot().confirmation);f.reply('retry_failed_email_v1',receipt);f.reply('read_event_deliveries_v1',delivery('queued',3));await c.confirmRetry();assert.equal(f.commands[1].expectedRevision,2);assert.equal(c.getSnapshot().deliveries.items[0].status,'queued');assert.deepEqual(f.commands.map(c=>c.action),['read_event_deliveries_v1','retry_failed_email_v1','read_event_deliveries_v1']);}
  else{await c.confirmRetry();assert.equal(c.getSnapshot().confirmation,null);assert.equal(f.commands.length,1);}
 }
});
