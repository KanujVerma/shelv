import test from 'node:test';
import assert from 'node:assert/strict';
import {SessionVault} from '../server/session-vault';
import {CredentialEnvelope} from '../server/credential-envelope';

const owner='11111111-1111-4111-8111-111111111111', providerSession='22222222-2222-4222-8222-222222222222';
const ring={active:'first',keys:{first:Buffer.alloc(32,7).toString('base64url')}};
const caps={view:true,edit:true,publish:false,confirmPayments:false};
function deferred(){let resolve!: (v?:unknown)=>void;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function fixture(){
 let now=1_800_000_000_000, record:any=null, rotations=0, revoked=0, enabled=true;
 const store={read:()=>structuredClone(record),write:(r:any)=>{record=structuredClone(r);}};
 const credentials=(n=0)=>({access_token:`synthetic-access-${n}`,refresh_token:`synthetic-refresh-${n}`,expires_at:now/1000+3600,user:{id:owner},providerSessionId:providerSession});
 const auth={refresh:async()=>{rotations++;return credentials(rotations);},context:async()=>{if(!enabled)throw Object.assign(Error('forbidden'),{status:403});return {ownerId:owner,providerSessionId:providerSession,capabilities:caps};},logout:async()=>{revoked++;}};
 const envelope=new CredentialEnvelope(JSON.stringify(ring),'session:fixture');
 const vault=()=>new SessionVault(store,envelope,auth,{now:()=>now,idleMs:3600000,absoluteMs:28800000});
 return {vault,store,auth,credentials,advance:(ms:number)=>{now+=ms;},record:()=>record,rotations:()=>rotations,revoked:()=>revoked,disable:()=>{enabled=false;}};
}
test('unknown cookies do not initialize sessions',async()=>{const f=fixture();await assert.rejects(f.vault().view(),/session_ended/);assert.equal(f.record(),null);});
test('two concurrent requests persist one refresh before returning the same owner and generation',async()=>{
 const f=fixture(),v=f.vault();await v.initialize(f.credentials(),'grant');f.advance(3570000);
 const gate=deferred();f.auth.refresh=async()=>{await gate.promise;return f.credentials(1);};
 const a=v.view(),b=v.view();gate.resolve();const [x,y]=await Promise.all([a,b]);
 assert.equal(x.ownerId,owner);assert.equal(x.generation,y.generation);assert.equal(x.generation,2);
 assert.equal(f.record().status,'active');assert.ok(!JSON.stringify(f.record()).includes('synthetic-access'));
});
test('held refresh cannot restore credentials or return private data after durable logout',async()=>{
 const f=fixture(),v=f.vault();const initial=await v.initialize(f.credentials(),'grant');f.advance(3570000);
 const entered=deferred(),release=deferred();f.auth.refresh=async()=>{entered.resolve();await release.promise;return f.credentials(1);};
 const pending=v.execute(initial.csrf,async()=>({private:'canary'}));const rejected=assert.rejects(pending,/session_ended/);
 await entered.promise;await v.logout(initial.csrf);release.resolve();await rejected;
 assert.equal(f.record().status,'revoked');assert.equal(f.record().credentials,null);
});
test('logout fences a held upstream reply',async()=>{
 const f=fixture(),v=f.vault(),initial=await v.initialize(f.credentials(),'grant');const entered=deferred(),release=deferred();
 const pending=v.execute(initial.csrf,async()=>{entered.resolve();await release.promise;return {private:'canary'};});const rejected=assert.rejects(pending,/session_ended/);
 await entered.promise;assert.deepEqual(v.logoutContext(),{csrf:initial.csrf});await v.logout(initial.csrf);release.resolve();await rejected;
});
test('held session work cannot cross a deleted-and-recreated record with the same numeric epoch',async()=>{
 const f=fixture(),old=f.vault(),s=await old.initialize(f.credentials(),'old-grant'),entered=deferred(),release=deferred();
 const pending=old.execute(s.csrf,async()=>{entered.resolve();await release.promise;return {private:'synthetic-old-lifecycle'};}),rejected=assert.rejects(pending,/session_ended/);await entered.promise;await old.logout(s.csrf);
 f.store.write(null);const fresh=await f.vault().initialize(f.credentials(),'new-grant');assert.notEqual(fresh.csrf,s.csrf);release.resolve();await rejected;assert.equal(f.record().status,'active');assert.equal(f.record().csrf,fresh.csrf);
});
test('idle and absolute expiry refuse reuse and initialization replay',async()=>{
 for(const absolute of [false,true]){const f=fixture(),v=f.vault();await v.initialize(f.credentials(),'grant');
 if(absolute){for(let i=0;i<8;i++){f.advance(3500000);await v.view();}f.advance(900000);}else f.advance(3600000);
 await assert.rejects(v.view(),/session_ended/);await assert.rejects(v.initialize(f.credentials(),'grant'),/session_ended/);assert.equal(f.record().credentials,null);}
});
test('revoked advisor authorization denies the next request and erases credentials',async()=>{
 const f=fixture(),v=f.vault(),s=await v.initialize(f.credentials(),'grant');f.disable();
 await assert.rejects(v.execute(s.csrf,async()=>({private:'canary'})),/forbidden/);assert.equal(f.record().credentials,null);
});
test('uncertain refresh and eviction during refresh fail closed without replay',async()=>{
 const f=fixture(),v=f.vault();await v.initialize(f.credentials(),'grant');f.advance(3570000);
 f.auth.refresh=async()=>{throw Error('synthetic transport uncertainty');};await assert.rejects(v.view());
 assert.equal(f.record().status,'revoked');await assert.rejects(f.vault().view(),/session_ended/);
 const g=fixture();await g.vault().initialize(g.credentials(),'grant');g.store.write({...g.record(),status:'refreshing'});
 await assert.rejects(g.vault().view(),/session_ended/);assert.equal(g.record().credentials,null);
});
test('CSRF mismatch never dispatches and provider-session binding is immutable',async()=>{
 const f=fixture(),v=f.vault();await v.initialize(f.credentials(),'grant');let dispatched=false;
 await assert.rejects(v.execute('forged',async()=>{dispatched=true;}),/csrf/);assert.equal(dispatched,false);
 f.advance(3570000);f.auth.refresh=async()=>({...f.credentials(1),providerSessionId:'different'});
 await assert.rejects(v.view(),/session_ended/);assert.equal(f.record().credentials,null);
});
test('rotation survives recreation and old grants cannot replace an active owner',async()=>{
 const f=fixture(),v=f.vault();await v.initialize(f.credentials(),'grant');f.advance(3570000);await v.view();
 assert.equal((await f.vault().view()).generation,2);await assert.rejects(v.initialize(f.credentials(),'other'),/account_conflict/);
});
test('AES-GCM binds ciphertext to object and owner, supports retained decrypt keys and rejects tampering',async()=>{
 const a=new CredentialEnvelope(JSON.stringify(ring),'session:a'),b=new CredentialEnvelope(JSON.stringify(ring),'session:b');
 const enc=await a.seal({secret:'synthetic-pair'},owner);assert.ok(!JSON.stringify(enc).includes('synthetic-pair'));
 assert.deepEqual(await a.open(enc,owner),{secret:'synthetic-pair'});await assert.rejects(b.open(enc,owner));await assert.rejects(a.open(enc,'other'));
 const changed={...enc,ciphertext:enc.ciphertext.slice(0,-2)+'AA'};await assert.rejects(a.open(changed,owner));
 const newer=new CredentialEnvelope(JSON.stringify({active:'second',keys:{...ring.keys,second:Buffer.alloc(32,8).toString('base64url')}}),'session:a');
 assert.deepEqual(await newer.open(enc,owner),{secret:'synthetic-pair'});assert.equal((await newer.seal({value:1},owner)).keyId,'second');
 assert.throws(()=>new CredentialEnvelope('{}','x'),/configuration/);
});
test('an upstream authentication failure revokes locally and private retirement fences late initialization',async()=>{
 const f=fixture(),v=f.vault(),s=await v.initialize(f.credentials(),'grant');await assert.rejects(v.execute(s.csrf,async()=>{throw Object.assign(Error('session_ended'),{status:401});}));assert.equal(f.record().credentials,null);
 const g=fixture();await g.vault().retire();await assert.rejects(g.vault().initialize(g.credentials(),'grant'));assert.equal(g.record().credentials,null);
});
