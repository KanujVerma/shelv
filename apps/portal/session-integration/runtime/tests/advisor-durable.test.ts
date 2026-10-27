import test from 'node:test';
import assert from 'node:assert/strict';
import candidateGateway from '../server/advisor-candidate-gateway';
import {advisorGateway} from '../server/gateway';
import {SessionVault} from '../server/session-vault';
import {AuthFlow} from '../server/auth-flow';
import {CredentialEnvelope} from '../server/credential-envelope';
import {SupabaseProvider} from '../server/upstream';
import {CookieAdvisorSession} from '../adapter/advisor-cookie-session.js';
import {createAdvisorSessionBridge} from '../../frontend/advisor-session-bridge.js';
const origin='https://portal.goshelv.com', owner='11111111-1111-4111-8111-111111111111',ps='22222222-2222-4222-8222-222222222222';
const caps={view:true,edit:true,publish:false,confirmPayments:false}, ring=JSON.stringify({active:'fixture',keys:{fixture:Buffer.alloc(32,25).toString('base64url')}});
const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:owner,session_id:ps,exp:Date.now()/1000+3600})).toString('base64url'),'synthetic'].join('.');
const credentials={access_token:token,refresh_token:'synthetic-refresh',expires_at:Date.now()/1000+3600,user:{id:owner},providerSessionId:ps};
const options={now:()=>1800000000000,idleMs:3600000,absoluteMs:28800000,flowMs:600000,rememberedIdleMs:3600000,rememberedAbsoluteMs:28800000,recheckContext:true,policyAudience:'advisor'};
function store(){let record:any=null;return {read:()=>structuredClone(record),write:(v:any)=>{record=structuredClone(v);}};}
test('advisor request admits explicit boolean consent and emits bounded durable cookie only after consent',async()=>{
 const calls:any[]=[];const env:any={PORTAL_ORIGIN:origin,ASSETS:{fetch:async()=>new Response('asset')},ADVISOR_SESSIONS:{getByName:()=>({invoke:async(c:any)=>{calls.push(c);return {ok:true,value:c.type==='limit'?{allowed:true}:c.type==='flow.complete'?{sessionId:'a'.repeat(43),session:{remembered:true,absoluteExpiresAt:new Date(Date.now()+28800000).toISOString()}}:{sent:true}};}})}};
 const request=(path:string,body:any)=>new Request(origin+path,{method:'POST',headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':'192.0.2.1','Content-Type':'application/json','X-Shelv-CSRF':'synthetic',Cookie:'__Host-shelv_advisor_flow='+ 'b'.repeat(43)},body:JSON.stringify(body)});
 const response=await advisorGateway.fetch(request('/api/advisor/auth/request',{email:'synthetic@example.test',remember:true}),env);assert.equal(response.status,200);assert.equal(calls.at(-1).remember,true);
 const complete=await advisorGateway.fetch(request('/api/advisor/auth/complete',{code:'synthetic'}),env);assert.match(complete.headers.get('set-cookie')??'',/Max-Age=28[78][0-9]{2}/);
 for(const remember of ['true',1,null])assert.equal((await advisorGateway.fetch(request('/api/advisor/auth/request',{email:'synthetic@example.test',remember}),env)).status,400);
});
test('advisor policy snapshot survives flow recreation and rejects client policy confusion',async()=>{
 const s=store(),seen:any[]=[];const target:any={initialize:async(_c:any,_g:any,remember:any,policy:any)=>{seen.push({remember,policy});return {ownerId:owner,absoluteExpiresAt:new Date(1800028800000).toISOString()};},view:async()=>({ownerId:owner}),retire:async()=>{}};
 const auth={requestOtp:async()=>({verifier:'synthetic'}),exchange:async()=>credentials,upgrade:async()=>credentials};
 const flow=()=>new AuthFlow(s,new CredentialEnvelope(ring,'flow'),auth,()=>target,options);
 const boot=await flow().bootstrap();await flow().request(boot.csrf,'synthetic@example.test',true);assert.equal(s.read().sessionPolicy.policyId,'advisor-remember-v1');await flow().complete(boot.csrf,'synthetic');assert.equal(seen[0].remember,true);assert.equal(seen[0].policy.absoluteMs,28800000);
 const v=new SessionVault(store(),new CredentialEnvelope(ring,'session'),{context:async()=>({ownerId:owner,providerSessionId:ps,capabilities:caps}),refresh:async()=>credentials,logout:async()=>{}},options);
 const view=await v.initialize(credentials,'grant',true,{idleMs:3600000,absoluteMs:28800000,policyId:'advisor-remember-v1',remembered:true});assert.equal(view.remembered,true);assert.equal(Date.parse(view.absoluteExpiresAt),1800028800000);
});
test('durable advisor context binds role/provider session and rejects missing or expired deadline metadata',async()=>{
 const valid={ownerId:owner,providerSessionId:ps,role:'advisor',sessionNotAfter:new Date(Date.now()+120000).toISOString(),capabilities:caps};
 const p=(value:any)=>new SupabaseProvider('sb_publishable_synthetic',async()=>Response.json(value),12000,true);
 assert.ok((await p(valid).context(credentials)).sessionNotAfter);
 for(const change of [{role:'client'},{providerSessionId:owner},{sessionNotAfter:'invalid'},{sessionNotAfter:new Date(0).toISOString()},{sessionNotAfter:undefined}])await assert.rejects(p({...valid,...change}).context(credentials));
});
test('advisor bridge exposes consent and adapter transmits it without provider credentials',async()=>{
 let body:any;const session=new CookieAdvisorSession({locks:{request:async(_n:any,_o:any,run:any)=>run()},fetcher:async(path:any,init:any)=>path.endsWith('/session')?Response.json({signedIn:false,csrf:'flow'}):(body=JSON.parse(init.body),Response.json({sent:true}))});
 const bridge=createAdvisorSessionBridge({Cookie:class{audience='advisor';} as any});assert.equal(bridge.storage.durableAvailable,true);
 await session.sendLink('synthetic@example.test',undefined,true);assert.deepEqual(body,{email:'synthetic@example.test',remember:true});
});

test('advisor candidate route gate denies disabled/missing flags before private binding or assets',async()=>{
 for(const flag of [undefined,'false','TRUE']){let calls=0;const env:any={ADVISOR_SHARED_SESSIONS:flag,ASSETS:{fetch:async()=>{calls++;throw Error('asset must not run');}}};Object.defineProperty(env,'ADVISOR_SESSIONS',{get(){calls++;throw Error('binding must not run');}});
 for(const path of ['/api/advisor','/api/advisor/session','/api/advisor/auth/request','/api/advisor/operations']){const response=await candidateGateway.fetch(new Request(origin+path),env);assert.equal(response.status,404);assert.match(response.headers.get('cache-control')??'',/private, no-store/);}
 assert.equal(calls,0);}
});
test('advisor session refuses a client policy and any privileged lifetime beyond 1h idle/8h absolute',async()=>{
 const auth={context:async()=>({ownerId:owner,providerSessionId:ps,capabilities:caps}),refresh:async()=>credentials,logout:async()=>{}};
 for(const policy of [{idleMs:3600000,absoluteMs:28800000,policyId:'client-remember-v1',remembered:true},{idleMs:3600001,absoluteMs:28800000,policyId:'advisor-remember-v1',remembered:true},{idleMs:3600000,absoluteMs:28800001,policyId:'advisor-remember-v1',remembered:true}]){const v=new SessionVault(store(),new CredentialEnvelope(ring,'session'),auth,options);await assert.rejects(v.initialize(credentials,'grant',true,policy));}
});

test('advisor reload obeys exact idle and absolute boundaries and cannot extend a provider timebox',async()=>{
 for(const remember of [false,true])for(const boundary of ['idle','absolute']){
  let now=1800000000000;const s=store(),auth={context:async()=>({ownerId:owner,providerSessionId:ps,capabilities:caps}),refresh:async()=>({...credentials,expires_at:now/1000+3600}),logout:async()=>{}};const opts={...options,now:()=>now};const vault=()=>new SessionVault(s,new CredentialEnvelope(ring,'session'),auth,opts);
  const initial=await vault().initialize(credentials,'grant',remember);if(boundary==='absolute'){for(let hour=1;hour<=7;hour++){now=1800000000000+hour*3500000;await vault().view();}now=1800028800000;}else now+=3600000;
  await assert.rejects(vault().view(),(error:any)=>error.status===401);assert.equal(s.read().credentials,null);
 }
 let now=1800000000000,deadline=now+120000;const s=store(),auth={context:async()=>({ownerId:owner,providerSessionId:ps,capabilities:caps,sessionNotAfter:deadline}),refresh:async()=>credentials,logout:async()=>{}};const v=new SessionVault(s,new CredentialEnvelope(ring,'session'),auth,{...options,now:()=>now});const initial=await v.initialize(credentials,'grant',true);deadline+=86400000;assert.equal((await v.view()).absoluteExpiresAt,initial.absoluteExpiresAt);now+=120000;await assert.rejects(v.view());
});
test('advisor logout and live grant revocation suppress an already-held private reply',async()=>{
 for(const logout of [false,true]){let enabled=true,release!:()=>void,enter!:()=>void;const held=new Promise<void>(r=>release=r),entered=new Promise<void>(r=>enter=r),s=store();const auth={context:async()=>{if(!enabled)throw Object.assign(Error('forbidden'),{status:403});return {ownerId:owner,providerSessionId:ps,capabilities:caps};},refresh:async()=>credentials,logout:async()=>{}};
 const v=new SessionVault(s,new CredentialEnvelope(ring,'session'),auth,options),view=await v.initialize(credentials,'grant',true);const pending=v.execute(view.csrf,async()=>{enter();await held;return {private:'PRIVATE_ADVISOR_CANARY'};}),rejected=assert.rejects(pending);await entered;if(logout)await v.logout(view.csrf);else enabled=false;release();await rejected;assert.equal(s.read().credentials,null);}
});
