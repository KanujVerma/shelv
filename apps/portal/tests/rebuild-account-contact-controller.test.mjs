// HISTORICAL unregistered constructor controls: exact immutable556 source, not current registry.
// Source/pure and finite HTTP only. Positive contact-channel integration is UNRUN:
// actual retained registry has no account-contact entry and must stay unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import {historical as actual,contact,original,requestId,other,basis} from './rebuild-account-contact-fixture.mjs';
import {createAccountContactController} from '../src/features/account/contact/controller.ts';
import {createClientAccountContactRequest} from '../src/app/account-contact-request.ts';
import {initialAccountContactSnapshot,emailDraftError,contactRequestNotice} from '../src/features/account/contact/model.ts';
import {readAccountContactCommand} from '../../../src/contracts/PortalAccountContactValidation.ts';
import {mapAccountContactResult} from '../../../src/contracts/PortalAccountContactMapping.ts';
globalThis.fetch=async()=>{throw Error('external network denied for contact consumer');};
const read={schemaVersion:1,action:'read_account_contact_v1'};

test('constructing, reading, subscribing and disposing are inert and do not fetch or mint an intent',async t=>{
  const f=await actual(t);const before=f.calls.length;
  const c=createAccountContactController(f.runtime);const stop=c.subscribe(()=>{});
  assert.equal(c.getSnapshot().phase,'unread');assert.equal(c.getSnapshot().original,null);
  assert.equal(c.getSnapshot().current,null);assert.equal(f.calls.length,before);
  stop();c.dispose();assert.equal(c.getSnapshot().phase,'ended');assert.equal(f.calls.length,before);
});
test('unregistered real channel stays unavailable without contacting Auth or claiming current facts',async t=>{
  const f=await actual(t),c=createAccountContactController(f.runtime);t.after(()=>c.dispose());
  assert.equal(await c.load(),false);const s=c.getSnapshot();
  assert.equal(s.phase,'unavailable');assert.equal(s.current,null);assert.equal(s.original,null);
  assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls.length,1);
  c.editEmail();c.setEmail('New@Example.test');assert.equal(c.reviewEmail(),false);assert.equal(await c.requestChange(),false);
  assert.equal(await c.readOriginalStatus(),false);assert.equal(f.calls.length,1);
});
test('raw bridge preserves unknown registry failure as unavailable rather than a server denial',async t=>{
  const f=await actual(t),port=createClientAccountContactRequest(f.runtime);
  await assert.rejects(port.execute(read),e=>e.status===503);assert.equal(f.calls.length,1);
  assert.equal(f.runtime.cookie.status,'ready');
});
for(const input of [{...read,clientId:other},{...original,actorId:other},{...original,redirect:'https://example.test'}, {...original,email:' bad@example.test'}, {...original,email:'x\u0000@example.test'}])test('Root command validation rejects extra authority or invalid email before unavailable-channel lookup '+JSON.stringify(input),async t=>{
  const f=await actual(t),port=createClientAccountContactRequest(f.runtime);
  await assert.rejects(port.execute(input),e=>e.status===400);assert.equal(f.calls.length,1);
});
test('aborted or inapplicable local operation cannot inspect a channel or fetch',async t=>{
  const f=await actual(t),port=createClientAccountContactRequest(f.runtime);const abort=new AbortController();abort.abort();
  await assert.rejects(port.execute(read,{signal:abort.signal}),e=>e.status===503);
  await assert.rejects(port.execute(read,{isApplicable:()=>false}),e=>e.status===503);
  assert.equal(f.calls.length,1);
});
for(const loss of ['owner','role','view','session','dispose'])test('stale '+loss+' retires controller private state and all later actions stay inert',async t=>{
  const f=await actual(t),c=createAccountContactController(f.runtime);t.after(()=>c.dispose());await c.load();
  if(loss==='owner'){f.setLogin({ownerId:other});await f.runtime.restore();}
  if(loss==='role')f.runtime.cookie.identity.role='advisor';
  if(loss==='view')f.runtime.cookie._view.capabilities.view=false;
  if(loss==='session')f.runtime.cookie._end();
  if(loss==='dispose')c.dispose();
  const n=f.calls.length;c.editEmail();c.setEmail('Other@Example.test');c.reviewEmail();
  assert.equal(await c.requestChange(),false);assert.equal(await c.load(),false);assert.equal(await c.readOriginalStatus(),false);
  const s=c.getSnapshot();assert.equal(s.current,null);assert.equal(s.draft,null);assert.equal(s.review,null);assert.equal(s.original,null);assert.equal(f.calls.length,n);
});
test('throwing and reentrant observers cannot start an operation after disposal',async t=>{
  const f=await actual(t),c=createAccountContactController(f.runtime);let count=0;
  c.subscribe(()=>{count++;c.dispose();throw Error('synthetic observer fault');});
  await c.load();assert.ok(count>0);assert.equal(c.getSnapshot().phase,'ended');assert.equal(f.calls.length,1);
});
test('replacement lane owner remains usable when old controller cleanup runs',async t=>{
  const f=await actual(t),a=createAccountContactController(f.runtime),b=createAccountContactController(f.runtime);t.after(()=>{a.dispose();b.dispose();});
  await a.load();await b.load();a.dispose();assert.equal(await a.load(),false);
  assert.equal(await b.load(),false);assert.equal(b.getSnapshot().phase,'unavailable');assert.equal(f.runtime.cookie.status,'ready');
});
test('route applicability can only deny and is rechecked after reentrant callback',async t=>{
  const f=await actual(t);let c,called=0;
  c=createAccountContactController(f.runtime,{isApplicable:()=>{if(++called===2)c.dispose();return true;}});
  assert.equal(await c.load(),false);assert.equal(c.getSnapshot().phase,'ended');assert.equal(f.calls.length,1);
});
for(const bad of ['', ' bad@example.test', 'bad@example.test ', 'bad\n@example.test', 'a\ud800@example.test'])test('draft errors use strict Root email command grammar without normalizing '+JSON.stringify(bad),()=>{
  assert.notEqual(emailDraftError(bad),null);
});
test('accepted address preserves exact case and canonical email/pending facts stay separate from receipt/status',()=>{
  assert.equal(emailDraftError('Proposed@Example.test'),null);
  const cmd=readAccountContactCommand(original);assert.equal(cmd.email,'Proposed@Example.test');assert.ok(Object.isFrozen(cmd));
  const current=mapAccountContactResult(contact,read);assert.equal(current.currentEmail.address,'Current@Example.test');assert.equal(current.pendingEmail.state,'unknown');
  const receipt=mapAccountContactResult({schemaVersion:1,action:original.action,requestId,outcome:'provider_accepted',recordedAt:'2026-11-02T12:00:00Z'},cmd);
  const status=mapAccountContactResult({schemaVersion:1,action:'read_account_email_change_request_v1',requestId,state:'provider_accepted'},{schemaVersion:1,action:'read_account_email_change_request_v1',requestId});
  const s={...initialAccountContactSnapshot(),phase:'ready',current,draft:{email:'Later@Example.test',expectedContactBasis:basis},original:cmd,receipt,originalStatus:status,requestState:'acknowledged'};
  const notice=contactRequestNotice(s);assert.match(notice,/verification|verified/);assert.doesNotMatch(notice,/email changed|delivered|sent successfully/i);
  assert.equal(s.current.currentEmail.address,'Current@Example.test');assert.equal(s.draft.email,'Later@Example.test');assert.equal(s.original.email,'Proposed@Example.test');
});
for(const state of ['not_found','registered','dispatch_unknown','provider_accepted','provider_rejected'])test('pure status presentation retains original meaning without authorizing another dispatch: '+state,()=>{
  const s={...initialAccountContactSnapshot(),original,originalStatus:{schemaVersion:1,action:'read_account_email_change_request_v1',requestId,state},requestState:'uncertain'};
  const text=contactRequestNotice(s);assert.equal(typeof text,'string');assert.doesNotMatch(text,/retry|resend|cancel.*request|email changed|delivered/i);
});

test('disposing during actual offline-session restoration rejects late work and preserves an empty terminal snapshot',async t=>{
  const f=await actual(t),c=createAccountContactController(f.runtime);f.runtime.cookie.suspend();const h=f.hold(),loading=c.load();
  await h.entered;c.dispose();const terminal=c.getSnapshot();h.release();assert.equal(await loading,false);
  assert.equal(c.getSnapshot(),terminal);assert.equal(c.getSnapshot().current,null);assert.equal(f.calls.length,2);
});
for(const status of [401,403])test('received session HTTP '+status+' during actual restore retires the contact controller, without changing denial to private success',async t=>{
  const broadcast=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;t.after(()=>{globalThis.BroadcastChannel=broadcast;});
  let denied=false;const {createApplicationSession}=await import('../src/app/session.ts');
  const runtime=createApplicationSession({audience:'client',now:()=>Date.parse('2026-11-02T12:00:00Z'),locks:{request:async(_n,_o,run)=>run()},fetcher:async(url)=>{
    assert.equal(url,'/api/client/session');
    return denied?Response.json({code:'forbidden'},{status}):Response.json({signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'denial-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2026-11-03T00:00:00Z',absoluteExpiresAt:'2026-11-04T00:00:00Z'});
  }});t.after(()=>runtime.dispose());await runtime.restore();const c=createAccountContactController(runtime);t.after(()=>c.dispose());
  denied=true;runtime.cookie.suspend();assert.equal(await c.load(),false);assert.equal(runtime.cookie.status,'signedout');assert.equal(c.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().current,null);
});
test('late unsubscribe callback sees cleared state and cannot revive or dispatch the disposed controller',async t=>{
  const f=await actual(t),subscribe=f.runtime.subscribe;let c,cleaned=0;
  f.runtime.subscribe=fn=>{const stop=subscribe(fn);return()=>{cleaned++;assert.equal(c.getSnapshot().current,null);assert.equal(c.getSnapshot().draft,null);void c.load();stop();throw Error('synthetic cleanup rejection');};};
  c=createAccountContactController(f.runtime);await c.load();c.dispose();c.dispose();assert.equal(cleaned,1);assert.equal(c.getSnapshot().phase,'ended');assert.equal(f.calls.length,1);
});

test('applicability can inspect the snapshot without recursive dispatch or reviving state after session loss',async t=>{
  const f=await actual(t);let c,enabled=false;
  c=createAccountContactController(f.runtime,{isApplicable:()=>{if(enabled){assert.equal(c.getSnapshot().current,null);void c.load();}return true;}});
  enabled=true;assert.equal(await c.load(),false);assert.equal(c.getSnapshot().phase,'unavailable');
  f.runtime.cookie._end();assert.equal(c.getSnapshot().phase,'ended');assert.equal(f.calls.length,1);
});
test('callback-capable option capture cannot continue under a replaced actual session',async t=>{
  const f=await actual(t),p=createClientAccountContactRequest(f.runtime);
  const options={get signal(){f.runtime.cookie._end();return undefined;}};
  await assert.rejects(p.execute(read,options),e=>e.status===401);assert.equal(f.calls.length,1);
});

// Synthetic local original-intent custody only. This grants no current facts,
// server registration, successful operation, provider receipt or verified email.
function seedUncertainOriginal(runtime){
  runtime.getSnapshot().boundary.memory.set('account.contact.original.v1',Object.freeze({owner:Object.freeze({}),retire:()=>{},original,receipt:null,originalStatus:null}));
}
test('synthetic local original survives discard, disposal and remount without any resend or new UUID',async t=>{
  const f=await actual(t);seedUncertainOriginal(f.runtime);const a=createAccountContactController(f.runtime);await a.load();
  assert.equal(a.getSnapshot().original,original);a.discardEdit();assert.equal(a.getSnapshot().original,original);a.dispose();
  const b=createAccountContactController(f.runtime);t.after(()=>b.dispose());await b.readOriginalStatus();assert.equal(b.getSnapshot().original,original);assert.equal(b.getSnapshot().receipt,null);assert.equal(b.getSnapshot().originalStatus,null);
  assert.equal(await b.requestChange(),false);assert.equal(b.getSnapshot().original.requestId,requestId);assert.equal(f.calls.length,1);
});
test('route-only lifetime retirement clears private snapshot but preserves synthetic local original for the same actual session',async t=>{
  const f=await actual(t);seedUncertainOriginal(f.runtime);let route=true;
  const a=createAccountContactController(f.runtime,{isApplicable:()=>route});await a.load();route=false;
  assert.equal(a.getSnapshot().original,null);assert.equal(a.getSnapshot().phase,'ended');
  const b=createAccountContactController(f.runtime);t.after(()=>b.dispose());await b.readOriginalStatus();assert.equal(b.getSnapshot().original,original);assert.equal(f.calls.length,1);
});
