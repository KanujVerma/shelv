import test from 'node:test';import assert from 'node:assert/strict';
import {AuthFlow,flowExpiryDisposition} from '../server/auth-flow';import {CredentialEnvelope} from '../server/credential-envelope';
const ring=JSON.stringify({active:'one',keys:{one:Buffer.alloc(32,9).toString('base64url')}});
const credentials={access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:1800003600,user:{id:'owner'},providerSessionId:'session'};
function setup(){let now=1800000000000,record:any=null,exchanges=0,imports=0,revoked=false;
 const targets=new Map();const store={read:()=>structuredClone(record),write:(r:any)=>{record=structuredClone(r);}};
 const auth={requestOtp:async(_email:string)=>({'synthetic-code-verifier':'synthetic-verifier'}),exchange:async()=>{exchanges++;return credentials;},upgrade:async()=>credentials};
 const targetAbsolute=now+28800000;const session={initialize:async(_c:any,_g:any)=>{imports++;return session.view();},view:async()=>{if(revoked)throw Error('session_ended');return {ownerId:'owner',csrf:'session-csrf',generation:1,absoluteExpiresAt:new Date(targetAbsolute).toISOString()};},retire:async()=>{revoked=true;}};
 const resolve=(id:string)=>{targets.set(id,session);return session;};
 const envelope=new CredentialEnvelope(ring,'flow:a');const flow=new AuthFlow(store,envelope,auth,resolve,{now:()=>now,flowMs:600000});
 return {flow,auth,session,envelope,store,resolve,now:()=>now,record:()=>record,advance:(ms:number)=>{now+=ms;},exchanges:()=>exchanges,imports:()=>imports,revoke:()=>{revoked=true;},revoked:()=>revoked};
}
test('pending PKCE verifier is encrypted; completed-code retries acknowledge one exchange and one session',async()=>{
 const f=setup(),start=await f.flow.bootstrap();await f.flow.request(start.csrf,'synthetic@example.test');
 assert.ok(!JSON.stringify(f.record()).includes('synthetic-verifier'));
 const first=await f.flow.complete(start.csrf,'synthetic-code');const second=await f.flow.complete(start.csrf,'synthetic-code');
 assert.equal(first.sessionId,second.sessionId);assert.equal(f.exchanges(),1);assert.equal(f.imports(),1);
 await assert.rejects(f.flow.complete(start.csrf,'different-code'),/flow_replayed/);
 f.revoke();await assert.rejects(f.flow.complete(start.csrf,'synthetic-code'),/session_ended/);
});
test('flow expiry and CSRF mismatch never send mail or exchange credentials',async()=>{
 const f=setup(),s=await f.flow.bootstrap();await assert.rejects(f.flow.request('forged','synthetic@example.test'),/csrf/);
 f.advance(600000);await assert.rejects(f.flow.complete(s.csrf,'code'),/flow_ended/);assert.equal(f.exchanges(),0);assert.equal(f.record().payload,null);
});
test('upgrade is acknowledgement-safe and never substitutes a different cookie owner',async()=>{
 const f=setup(),s=await f.flow.bootstrap();const one=await f.flow.upgrade(s.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'});
 const two=await f.flow.upgrade(s.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'});assert.equal(one.sessionId,two.sessionId);assert.equal(f.imports(),1);
 const g=setup(),t=await g.flow.bootstrap();g.session.view=async()=>({ownerId:'other-owner',csrf:'x',generation:1});
 await assert.rejects(g.flow.upgrade(t.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'},'existing-cookie'),/account_conflict/);
});
test('uncertain exchange is never retried with the same verifier',async()=>{
 const f=setup(),s=await f.flow.bootstrap();await f.flow.request(s.csrf,'synthetic@example.test');f.auth.exchange=async()=>{throw Error('uncertain');};
 await assert.rejects(f.flow.complete(s.csrf,'code'));await assert.rejects(f.flow.complete(s.csrf,'code'),/flow_ended/);assert.equal(f.record().payload,null);
});
test('cancel during a held exchange fences the late acknowledgement',async()=>{
 const f=setup(),s=await f.flow.bootstrap();await f.flow.request(s.csrf,'synthetic@example.test');let release!:()=>void,entered!:()=>void;
 const gate=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r);f.auth.exchange=async()=>{entered();await gate;return credentials;};
 const pending=f.flow.complete(s.csrf,'code');const rejected=assert.rejects(pending,/flow_ended/);await started;await f.flow.cancel(s.csrf);release();await rejected;assert.equal(f.imports(),0);
});
test('cancel during final handoff encryption retires the newly created target',async()=>{
 const f=setup(),s=await f.flow.bootstrap();await f.flow.request(s.csrf,'synthetic@example.test');let release!:()=>void,entered!:()=>void;const gate=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r);
 let intercepted=false;const seal=f.envelope.seal.bind(f.envelope);f.envelope.seal=async(value:any,owner:string)=>{if(value.targetId&&!value.credentials&&!intercepted){intercepted=true;entered();await gate;}return seal(value,owner);};
 const pending=f.flow.complete(s.csrf,'code'),rejected=assert.rejects(pending,/flow_ended/);await started;await f.flow.cancel(s.csrf);release();await rejected;assert.equal(f.revoked(),true);assert.equal(f.record().payload,null);
});
test('logout after a lost completion response retires the completed target; ordinary flow TTL preserves it',async()=>{
 const f=setup(),s=await f.flow.bootstrap();await f.flow.upgrade(s.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'});await f.flow.cancel(s.csrf);assert.equal(f.revoked(),true);
 const g=setup(),t=await g.flow.bootstrap();await g.flow.upgrade(t.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'});g.advance(600000);await g.flow.expire();assert.equal(g.revoked(),false);assert.ok(g.record().payload);await assert.rejects(g.flow.upgrade(t.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'}),/flow_ended/);
 await g.flow.cancel(t.csrf);assert.equal(g.revoked(),true);assert.equal(g.record().payload,null);
});
test('uncertain target retirement keeps a durable encrypted retry reference and never reopens the flow',async()=>{
 const f=setup(),s=await f.flow.bootstrap();await f.flow.upgrade(s.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'});
 const retire=f.session.retire;f.session.retire=async()=>{throw Error('synthetic-private-binding-unavailable');};await assert.rejects(f.flow.cancel(s.csrf));assert.equal(f.record().status,'failed');assert.ok(f.record().payload);
 await assert.rejects(f.flow.complete(s.csrf,'code'),/flow_ended/);f.session.retire=retire;await f.flow.cancel(s.csrf);assert.equal(f.revoked(),true);assert.equal(f.record().payload,null);
});
test('replacement fences an unacknowledged target but preserves only the exact acknowledged cookie target',async()=>{
 const f=setup(),s=await f.flow.bootstrap(),created=await f.flow.upgrade(s.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'});await f.flow.retire('different-acknowledged-session');assert.equal(f.revoked(),true);
 const g=setup(),t=await g.flow.bootstrap(),kept=await g.flow.upgrade(t.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'});await g.flow.retire(kept.sessionId);assert.equal(g.revoked(),false);await assert.rejects(g.flow.complete(t.csrf,'code'),/flow_ended/);
});
test('retirement failure retains only a bounded target reference, and expiry eventually erases it without a provider',async()=>{
 const f=setup(),s=await f.flow.bootstrap();f.session.initialize=async()=>{throw Error('synthetic-lost-target-ack');};await assert.rejects(f.flow.upgrade(s.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'}));
 f.session.retire=async()=>{throw Error('synthetic-private-binding-unavailable');};await assert.rejects(f.flow.cancel(s.csrf));const payload:any=await f.envelope.open(f.record().payload,'pending');assert.ok(payload.targetId);assert.equal(payload.credentials,undefined);assert.equal(f.record().payloadKind,'reference');
 f.advance(40000000);await f.flow.expire();assert.equal(f.record().payload,null);
});
test('cleanup disposition is independent of keys/Auth and bounds every encrypted record deadline',()=>{
 const base:any={kind:'flow',status:'sent',expiresAt:100,payload:{},epoch:1,csrf:'x',payloadKind:'sdk'};
 assert.equal(flowExpiryDisposition(base,100),'erase');assert.equal(flowExpiryDisposition({...base,status:'completed',payloadKind:'reference',cleanupAt:1000},100),'retain');
 assert.equal(flowExpiryDisposition({...base,status:'failed',payloadKind:'reference',revocationPending:true,cleanupAt:1000},1000),'erase');
 assert.equal(flowExpiryDisposition({...base,status:'handoff',payloadKind:'credentials',cleanupAt:1000},100),'retire');
});
test('serialized restarts rotate CSRF/epoch on one authority and retire its previous target',async()=>{
 const f=setup(),s=await f.flow.bootstrap();await f.flow.upgrade(s.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'});const epoch=f.record().epoch;
 const [a,b]=await Promise.all([f.flow.restart(),f.flow.restart()]);assert.equal(f.revoked(),true);assert.notEqual(a.csrf,b.csrf);assert.equal(f.record().csrf,b.csrf);assert.ok(f.record().epoch>epoch);
 await assert.rejects(f.flow.request(s.csrf,'synthetic@example.test'),/csrf/);await assert.rejects(f.flow.request(a.csrf,'synthetic@example.test'),/csrf/);await f.flow.request(b.csrf,'synthetic@example.test');
 const g=setup(),t=await g.flow.bootstrap(),kept=await g.flow.upgrade(t.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'});await g.flow.restart(kept.sessionId);assert.equal(g.revoked(),false);
});
test('logout during restart retirement cannot be overwritten by a stale new pending record',async()=>{
 const f=setup(),s=await f.flow.bootstrap();await f.flow.upgrade(s.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'});
 let release!:()=>void,entered!:()=>void,attempts=0;const gate=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r);
 f.session.retire=async()=>{if(++attempts===1){entered();await gate;}};const restart=f.flow.restart(),rejected=assert.rejects(restart,/flow_ended/);await started;await f.flow.cancel(s.csrf);release();await rejected;assert.equal(f.record().status,'failed');assert.equal(f.record().payload,null);
});
test('a canceled old flow cannot authenticate after storage cleanup recreates the same numeric epoch',async()=>{
 const f=setup(),s=await f.flow.restart();let release!:()=>void,entered!:()=>void;const gate=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r);
 f.auth.upgrade=async()=>{entered();await gate;return credentials;};const pending=f.flow.upgrade(s.csrf,{accessToken:'synthetic-access',refreshToken:'synthetic-refresh'}),rejected=assert.rejects(pending,/flow_ended/);await started;await f.flow.cancel(s.csrf);
 f.store.write(null);const next=new AuthFlow(f.store,f.envelope,f.auth,f.resolve,{now:f.now,flowMs:600000}),fresh=await next.restart();assert.equal(f.record().epoch,2);assert.notEqual(fresh.csrf,s.csrf);release();await rejected;assert.equal(f.imports(),0);assert.equal(f.record().status,'pending');assert.equal(f.record().csrf,fresh.csrf);
});
