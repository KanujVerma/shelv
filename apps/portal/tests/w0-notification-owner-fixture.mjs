// One actual Node module graph: no bundled/native duplicate error classes,
// source projection, constructor, authority or currentness substitutions.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {build} from '../node_modules/esbuild/lib/main.js';
const root=fileURLToPath(new URL('../../../',import.meta.url));
let compiled;
export async function ownerSource(){
 if(compiled)return compiled;
 const evidence=path.join(root,'.local-artifacts/portal-rebuild/w0-20261103');await mkdir(evidence,{recursive:true});
 const result=await build({absWorkingDir:root,stdin:{contents:`
export {createNotificationViewLease} from './apps/portal/src/app/notification-owner.ts';
export {createApplicationSession} from './apps/portal/src/app/session.ts';
export {createNotificationPorts} from './supabase/functions/concierge-notifications/runtime.ts';
export {handleNotificationRequest} from './supabase/functions/concierge-notifications/handler.ts';
export {readNotificationCommand} from './src/contracts/PortalNotificationValidation.ts';
export {default as clientGateway,advisorGateway} from './apps/portal/session-integration/runtime/server/gateway.ts';
export {ClientProvider} from './apps/portal/session-integration/runtime/server/client-upstream.ts';
export {SupabaseProvider} from './apps/portal/session-integration/runtime/server/upstream.ts';
export {SessionVault} from './apps/portal/session-integration/runtime/server/session-vault.ts';
export {CredentialEnvelope} from './apps/portal/session-integration/runtime/server/credential-envelope.ts';`,resolveDir:root,loader:'ts'},
  tsconfig:'apps/portal/tsconfig.frontend.json',bundle:true,platform:'node',format:'esm',write:false,metafile:true,
  banner:{js:"import {createRequire as sourceRequire} from 'node:module'; const require=sourceRequire(import.meta.url);"}});
 const file=path.join(evidence,'notification-owner-graph-'+crypto.randomUUID()+'.mjs');
 await writeFile(file,result.outputFiles[0].contents,{flag:'wx'});await writeFile(file+'.inputs.json',JSON.stringify(result.metafile.inputs,null,2),{flag:'wx'});
 compiled=await import(pathToFileURL(file).href);return compiled;
}
export const id=n=>`40000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export const at='2026-11-02T12:00:00Z';
export const event={eventId:id(1),createdAt:at,source:{kind:'publication',publicationVersion:3},destination:{kind:'plan_version',version:3}};
const item={deliveryId:id(2),revision:4,seenAt:null,event,email:{status:'failed',revision:2}};
const page=(revision=4,seenAt=null)=>({schemaVersion:1,consistency:'live_keyset',observedAt:at,cursor:null,items:[{...item,revision,seenAt}],nextCursor:null});
const receipt=c=>({requestId:c.requestId,action:c.action,deliveryId:c.deliveryId,previousRevision:c.expectedRevision,revision:c.expectedRevision+1,recordedAt:at,effect:c.action==='mark_seen_v1'?'seen':'retry_queued'});
export function gate(){let enter,release;return{entered:new Promise(r=>enter=r),promise:new Promise(r=>release=r),enter:()=>enter(),release:()=>release()};}
export async function entryFixture(t,{audience='client',edit=false,serial=false,restore=true}={}){
 const {createApplicationSession,createNotificationPorts,handleNotificationRequest,readNotificationCommand,clientGateway,advisorGateway,ClientProvider,SupabaseProvider,SessionVault,CredentialEnvelope}=await ownerSource();
 const origin='https://portal.goshelv.com',upstream='https://snojlbqovlawewwqbviz.supabase.co',owner=id(90),providerSession=id(91);
 const commands=[],steps=[],events=[],queuedWaits=[];let record=null,queued=0,now=Date.now();
 let login={signedIn:true,ownerId:owner,generation:1,csrf:'SYNTHETIC-owner',capabilities:{view:true,edit,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'};
 const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:owner,session_id:providerSession,jti:crypto.randomUUID(),exp:Math.floor(now/1000)+3600})).toString('base64url'),'synthetic'].join('.');
 const ports=createNotificationPorts({supabaseUrl:upstream,publicKey:'sb_publishable_synthetic',allowedOrigins:[origin],fetch:async(input,init)=>{
  const u=new URL(String(input));assert.equal(u.origin,upstream);
  if(u.pathname==='/auth/v1/user')return Response.json({id:serial?owner:login.ownerId,is_anonymous:false});
  assert.equal(u.pathname,'/rest/v1/rpc/concierge_notification_command_v1');const c=readNotificationCommand(JSON.parse(init.body).p_command),step=steps.shift();
  assert.ok(step,'unexpected Root RPC '+c.action);assert.equal(c.action,step.action);commands.push(c);events.push(c.action+':start');
  if(step.hold){step.hold.enter();await step.hold.promise;}
  events.push(c.action+':end');return Response.json(typeof step.body==='function'?step.body(c):step.body,{status:step.status});
 }});
 let vault,gateway,env;
 if(serial){
  const provider=new(audience==='client'?ClientProvider:SupabaseProvider)('sb_publishable_synthetic',async(input,init)=>{
   const u=new URL(String(input));assert.equal(u.origin,upstream);
   if(u.pathname===`/rest/v1/rpc/concierge_${audience}_session_context`)return Response.json({ownerId:owner,providerSessionId:providerSession,role:audience,sessionNotAfter:null,capabilities:login.capabilities});
   assert.equal(u.pathname,'/functions/v1/concierge-notifications');return handleNotificationRequest(new Request(u,init),ports);
  },12000,true);
  vault=new SessionVault({read:()=>record,write:r=>{record=r;}},new CredentialEnvelope(JSON.stringify({active:'synthetic',keys:{synthetic:Buffer.alloc(32,29).toString('base64url')}}),'owner-synthetic'),provider,{now:()=>now,idleMs:3600000,absoluteMs:28800000,recheckContext:true,policyAudience:audience});
  await vault.initialize({access_token:token,refresh_token:'SYNTHETIC-refresh',expires_at:now/1000+3600,user:{id:owner},providerSessionId:providerSession},'SYNTHETIC');
  env={PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true',ASSETS:{fetch:async()=>{throw Error('unexpected asset');}},ADVISOR_SESSIONS:{getByName:()=>({invoke:async c=>{
   try{
    if(c.type==='session.view')return{ok:true,value:await vault.view()};
    if(c.type==='session.execute'){queued++;for(const w of queuedWaits)if(queued>=w.n)w.resolve();return{ok:true,value:await vault.execute(c.csrf,(credentials,context)=>provider.perform(credentials,context,c.operation))};}
    if(c.type==='session.logout-context')return{ok:true,value:vault.logoutContext()};
    if(c.type==='session.logout')return{ok:true,value:await vault.logout(c.csrf)};
    throw Error('unexpected Vault command');
   }catch(e){return{ok:false,error:{status:e.status??503,code:e.code??'unavailable'}};}
  }})}};gateway=audience==='client'?clientGateway:advisorGateway;
 }
 const runtime=createApplicationSession({audience,now:()=>now,locks:{request:async(_n,_o,run)=>run()},fetcher:async(input,init)=>{
  const u=new URL(String(input),origin);assert.ok([`/api/${audience}/session`,`/api/${audience}/notifications`,`/api/${audience}/logout`].includes(u.pathname));
  if(serial){const headers=new Headers(init?.headers);headers.set('Origin',origin);headers.set('Sec-Fetch-Site','same-origin');headers.set('Cookie',`__Host-shelv_${audience}=${'a'.repeat(43)}`);return gateway.fetch(new Request(u,{...init,headers}),env);}
  if(u.pathname===`/api/${audience}/session`)return Response.json(login);
  if(u.pathname===`/api/${audience}/logout`)return Response.json({signedOut:true});
  return handleNotificationRequest(new Request('https://edge.synthetic.invalid',{method:'POST',headers:{authorization:'Bearer SYNTHETIC','content-type':'application/json',Origin:origin},body:init.body,signal:init.signal}),ports);
 }});
 if(restore)await runtime.restore();t.after(()=>runtime.dispose());
 return{runtime,commands,events,page,item,receipt,reply(action,body,status=200,hold=null){steps.push({action,body,status,hold});},login(patch){login={...login,...patch};},record:()=>record,
  whenQueued(n){return queued>=n?Promise.resolve():new Promise(resolve=>queuedWaits.push({n,resolve}));},queued:()=>queued};
}
