import test from 'node:test';
import assert from 'node:assert/strict';
import gateway from '../server/gateway';
import {AuthFlow} from '../server/auth-flow';
import {SessionVault} from '../server/session-vault';
import {CredentialEnvelope} from '../server/credential-envelope';
import {parseClientCommand} from '../server/client-policy';
import {ClientProvider} from '../server/client-upstream';
const origin='https://portal.goshelv.com',owner='11111111-1111-4111-8111-111111111111',ps='22222222-2222-4222-8222-222222222222';
const caps={view:true,edit:false,publish:false,confirmPayments:false};
const ring=JSON.stringify({active:'fixture',keys:{fixture:Buffer.alloc(32,19).toString('base64url')}});
function fixture(){let now=1800000000000,record:any=null,enabled=true;const credentials={access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:now/1000+86400,user:{id:owner},providerSessionId:ps};
 const auth={context:async()=>{if(!enabled)throw Object.assign(Error('session_ended'),{status:401});return {ownerId:owner,providerSessionId:ps,capabilities:caps};},refresh:async()=>({...credentials,expires_at:now/1000+3600}),logout:async()=>{}};
 const store={read:()=>structuredClone(record),write:(v:any)=>{record=structuredClone(v);}};
 const vault=()=>new SessionVault(store,new CredentialEnvelope(ring,'fixture'),auth,{now:()=>now,idleMs:3600000,absoluteMs:28800000,rememberedIdleMs:7*86400000,rememberedAbsoluteMs:30*86400000});
 return {vault,credentials,store,auth,advance:(ms:number)=>now+=ms,revoke:()=>enabled=false,record:()=>record};}
test('remembered client survives return after a day; default session expires',async()=>{
 const f=fixture(),v=f.vault();const view=await v.initialize(f.credentials,'grant',true);assert.equal(view.remembered,true);assert.equal(Date.parse(view.absoluteExpiresAt)-1800000000000,30*86400000);f.advance(86400000);assert.equal((await f.vault().view()).ownerId,owner);
 const g=fixture();await g.vault().initialize(g.credentials,'grant');g.advance(3600000);await assert.rejects(g.vault().view(),/session_ended/);
});
test('remembered idle and absolute expiry, revocation and stale logout lease fail closed',async()=>{
 for(const elapsed of [7*86400000,30*86400000]){const f=fixture();await f.vault().initialize(f.credentials,'grant',true);f.advance(elapsed);await assert.rejects(f.vault().view(),/session_ended/);assert.equal(f.record().credentials,null);}
 const f=fixture(),v=f.vault();await v.initialize(f.credentials,'grant',true);f.revoke();await assert.rejects(v.view(),/session_ended/);assert.equal(f.record().credentials,null);
 const g=fixture(),w=g.vault(),s=await w.initialize(g.credentials,'grant',true);await w.logout(s.csrf);await assert.rejects(w.execute(s.csrf,async()=>({private:'canary'})),/session_ended/);assert.doesNotMatch(JSON.stringify(g.record()),/synthetic-access|synthetic-refresh/);
});
test('client command surface denies advisor authority, owner overrides and upstream selection',()=>{
 for(const [channel,action] of [['operations','advisor_list'],['operations','publish_v2'],['payments','confirm_payment'],['checkins','advisor_photo_view']])assert.throws(()=>parseClientCommand(channel as any,{action}),/action_forbidden/);
 for(const field of ['clientId','ownerId','url','rpc','Authorization','refreshToken'])assert.throws(()=>parseClientCommand('operations',{action:'client_read_v2',[field]:owner}));
 for(const [channel,action] of [['payments','client_read'],['payments','submit_claim'],['payments','confirm_shipping_address'],['checkins','client_read'],['checkins','submit_report']])assert.doesNotThrow(()=>parseClientCommand(channel as any,{action}));
});
function request(path:string,body?:unknown,cookies=''){return new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':'192.0.2.1',Cookie:cookies,...(body===undefined?{}:{'Content-Type':'application/json','X-Shelv-CSRF':'flow-csrf'})},...(body===undefined?{}:{body:JSON.stringify(body)})});}
test('disabled client gateway fails closed; advisor cookies never authorize client requests',async()=>{
 const names:string[]=[],commands:any[]=[];const env:any={PORTAL_ORIGIN:origin,ASSETS:{fetch:async()=>new Response('asset')},ADVISOR_SESSIONS:{getByName:(n:string)=>{names.push(n);return {invoke:async(c:any)=>{commands.push(c);return {ok:true,value:c.type==='limit'?{allowed:true}:{signedIn:false,csrf:'flow-csrf'}};}};}}};
 assert.equal((await gateway.fetch(request('/api/client/session'),env)).status,503);assert.equal(commands.length,0);env.CLIENT_SHARED_SESSIONS='true';
 const r=await gateway.fetch(request('/api/client/session',undefined,'__Host-shelv_advisor='+ 'a'.repeat(43)),env);assert.equal(r.status,200);assert.ok(names.every(n=>n.startsWith('client:')));assert.ok(commands.every(c=>c.audience==='client'));assert.equal(commands.some(c=>c.type==='session.view'),false);
 assert.match(r.headers.get('set-cookie')!,/__Host-shelv_client_flow=.*HttpOnly/);
 assert.equal((await gateway.fetch(request('/api/client/session/upgrade',{}),env)).status,404);
});
test('flow consent is bound at email request and passed to the session target',async()=>{
 const now=1800000000000;let record:any=null;const seen:boolean[]=[];const target={initialize:async(_c:any,_g:any,remember:boolean)=>{seen.push(remember);return {ownerId:owner,remembered:remember,absoluteExpiresAt:new Date(now+100000).toISOString()};},view:async()=>({ownerId:owner}),retire:async()=>{}};
 const flow=new AuthFlow({read:()=>record,write:(r:any)=>record=r},new CredentialEnvelope(ring,'flow'),{requestOtp:async()=>({verifier:'synthetic'}),exchange:async()=>fixture().credentials,upgrade:async()=>fixture().credentials},()=>target as any,{now:()=>now,flowMs:600000});
 const boot=await flow.bootstrap();await flow.request(boot.csrf,'synthetic@example.test',true);assert.equal(record.remember,true);await flow.complete(boot.csrf,'synthetic-code');assert.deepEqual(seen,[true]);
});
test('client provider uses client context and never the held advisor RPC',async()=>{
 const f=fixture(),paths:string[]=[];const token=[btoa('{}'),Buffer.from(JSON.stringify({sub:owner,session_id:ps,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'synthetic'].join('.');
 const p=new ClientProvider('sb_publishable_synthetic',async(input:any)=>{paths.push(new URL(String(input)).pathname);return Response.json({ownerId:owner,providerSessionId:ps,role:'client',sessionNotAfter:null,capabilities:caps});});
 const c=await p.context({...f.credentials,access_token:token});assert.deepEqual(c.capabilities,caps);assert.deepEqual(paths,['/rest/v1/rpc/concierge_client_session_context']);
});
test('provider deadline only shortens absolute expiry and held external revocation blocks private egress',async()=>{
 const f=fixture();let deadline=1800000000000+120000;
 f.auth.context=async()=>({ownerId:owner,providerSessionId:ps,capabilities:caps,sessionNotAfter:deadline});
 const v=new SessionVault(f.store,new CredentialEnvelope(ring,'fixture'),f.auth,{now:()=>1800000000000,idleMs:3600000,absoluteMs:28800000,rememberedIdleMs:604800000,rememberedAbsoluteMs:2592000000,recheckContext:true});
 const s=await v.initialize(f.credentials,'grant',true);assert.equal(Date.parse(s.absoluteExpiresAt),deadline);deadline+=86400000;assert.equal((await v.view()).absoluteExpiresAt,s.absoluteExpiresAt);
 let enter!:()=>void,release!:()=>void;const entered=new Promise<void>(r=>enter=r),held=new Promise<void>(r=>release=r);
 const pending=v.execute(s.csrf,async()=>{enter();await held;return {private:'PRIVATE_CANARY'};});await entered;
 f.auth.context=async()=>{throw Object.assign(Error('revoked'),{status:401});};release();await assert.rejects(pending);assert.equal(f.record().credentials,null);
});
test('pending consent and duration policy survive restart and config drift before completion',async()=>{
 let record:any=null;let enter!:()=>void,release!:()=>void;const entered=new Promise<void>(r=>enter=r),held=new Promise<void>(r=>release=r),seen:any[]=[];
 const store={read:()=>structuredClone(record),write:(v:any)=>record=structuredClone(v)};
 const auth={requestOtp:async()=>{enter();await held;return {verifier:'synthetic'};},exchange:async()=>fixture().credentials,upgrade:async()=>fixture().credentials};
 const target:any={initialize:async(_c:any,_g:any,remember:boolean,policy:any)=>{seen.push({remember,policy});return {ownerId:owner,absoluteExpiresAt:new Date(1800000010000).toISOString()};},view:async()=>({ownerId:owner}),retire:async()=>{}};
 const opts={now:()=>1800000000000,flowMs:600000,idleMs:3600000,absoluteMs:28800000,rememberedIdleMs:604800000,rememberedAbsoluteMs:2592000000,recheckContext:true};
 const make=()=>new AuthFlow(store,new CredentialEnvelope(ring,'flow'),auth,()=>target,opts);const flow=make(),boot=await flow.bootstrap(),sending=flow.request(boot.csrf,'synthetic@example.test',true);await entered;assert.equal(record.remember,true);assert.equal(record.sessionPolicy.absoluteMs,2592000000);release();await sending;
 opts.rememberedAbsoluteMs=86400000;await make().complete(boot.csrf,'synthetic-code');assert.equal(seen[0].policy.absoluteMs,2592000000);
});

test('token-free ending cookie denies all private work without dispatch and permits only logout control',async()=>{
 const commands:any[]=[];const env:any={PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true',ASSETS:{fetch:async()=>new Response('asset')},ADVISOR_SESSIONS:{getByName:()=>({invoke:async(c:any)=>{commands.push(c);return {ok:true,value:{csrf:'flow-csrf'}};}})}};
 const cookies='__Host-shelv_client='+ 'a'.repeat(43)+'; __Host-shelv_client_ending=1';
 for(const [path,body] of [['/api/client/session',undefined],['/api/client/operations',{action:'client_read_v2'}],['/api/client/auth/complete',{code:'retained'}]])assert.equal((await gateway.fetch(request(path as string,body,cookies),env)).status,401);
 assert.equal(commands.length,0);const r=request('/api/client/session',undefined,cookies);r.headers.set('X-Shelv-Logout','1');assert.equal((await gateway.fetch(r,env)).status,200);assert.equal(commands[0].type,'session.logout-context');
});
