import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,initial,controllerApi,requestApi} from './rebuild-account-profile-fixture.mjs';
const root=new URL('../src/features/account/profile/',import.meta.url);
test('account profile consumer source is present at its exact owned path',async()=>{
 const {existsSync}=await import('node:fs');assert.equal(existsSync(new URL('controller.ts',root)),true,'missing approved Account profile consumer');
});
test('HISTORICAL unregistered profile channel is unavailable without synthetic success or egress',async t=>{
 const f=await fixture(t,{physical:true,historicalUnregistered:true}),{createAccountProfileController}=await controllerApi({physical:true}),c=createAccountProfileController(f.runtime);t.after(()=>c.dispose());
 assert.equal(c.getSnapshot().phase,'unread');assert.equal(f.calls.length,0);
 await c.load();assert.equal(c.getSnapshot().phase,'error');assert.equal(c.getSnapshot().current,null);assert.equal(f.calls.length,0);assert.equal(f.runtime.cookie.status,'ready');
});
test('canonical validation preserves exact accepted Unicode/case/whitespace and rejects unrepresentable names',async()=>{
 const {validDisplayName}=await import(new URL('model.ts',root));
 for(const name of ['  MaYa  ','😀'.repeat(200),' '.repeat(1000)+'a'])assert.equal(validDisplayName(name),true);
 for(const name of ['', '   ','😀'.repeat(201),'a\0','\ud800'])assert.equal(validDisplayName(name),false);
 assert.equal(initial().displayName,'  Maya Example  ');
});
async function controlled(t){const f=await fixture(t),{createAccountProfileController}=await controllerApi();const c=createAccountProfileController(f.runtime);t.after(()=>c.dispose());return {...f,c,createAccountProfileController};}
test('SYNTHETIC channel-admission read and save use actual cookie/CAS/Root codecs with VIEW only',async t=>{
 const f=await controlled(t),{c}=f;await c.load();assert.deepEqual(c.getSnapshot().current,initial());
 assert.equal(c.editDisplayName(),true);c.setDisplayName('  MaYa Updated  ');assert.equal(c.getSnapshot().canSave,true);
 await c.save();const s=c.getSnapshot();assert.equal(s.writeState,'saved');assert.equal(s.current.displayName,'  MaYa Updated  ');assert.equal(s.draft,null);assert.equal(s.acknowledgement.displayName,'  MaYa Updated  ');
 assert.deepEqual(f.calls.map(c=>c.command.action),['read_account_profile_v1','set_account_display_name_v1','read_account_profile_v1']);
 for(const {init} of f.calls){assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.equal(new Headers(init.headers).get('x-shelv-csrf'),'synthetic-profile-csrf');assert.equal(new Headers(init.headers).has('authorization'),false);}
});
test('SYNTHETIC canonical name accepts 200 astral scalars without a UTF16 field limit',async t=>{
 const f=await controlled(t);await f.c.load();f.c.editDisplayName();f.c.setDisplayName(' 😀'.slice(1).repeat(200));await f.c.save();assert.equal(f.c.getSnapshot().writeState,'saved');assert.equal([...f.c.getSnapshot().current.displayName].length,200);
});
for(const [status,value] of [[503,{code:'unavailable'}],[200,{malformed:true}]])test('SYNTHETIC uncertain '+status+' preserves exact command, newer draft, and deliberately retries only original',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();c.setDisplayName('Original Change');f.reply(value,status);await c.save();
 const pending=c.getSnapshot().pending,wire=f.calls.at(-1).wire;assert.ok(pending);assert.equal(c.getSnapshot().writeState,'uncertain');
 c.setDisplayName('Newer Unsent');await c.readCurrent();assert.equal(c.getSnapshot().pending,pending);assert.equal(c.getSnapshot().draft.displayName,'Newer Unsent');
 await c.save();assert.equal(f.calls.at(-2).wire,wire);assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().draft.displayName,'Newer Unsent');assert.equal(c.getSnapshot().writeState,'acknowledged');assert.equal(c.getSnapshot().current.displayName,'Original Change');
});
test('SYNTHETIC local discard leaves immutable uncertain original for same-session remount',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();c.setDisplayName('Original');f.reply({code:'unavailable'},503);await c.save();const p=c.getSnapshot().pending;
 c.discardEdit();assert.equal(c.getSnapshot().draft,null);assert.equal(c.getSnapshot().pending,p);c.dispose();const b=f.createAccountProfileController(f.runtime);t.after(()=>b.dispose());assert.equal(b.getSnapshot().pending.requestId,p.requestId);assert.equal(b.getSnapshot().current,null);await b.readCurrent();await b.save();assert.equal(b.getSnapshot().current.displayName,'Original');
});
test('SYNTHETIC a valid historical ACK followed by unavailable current read is not current save completion',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();c.setDisplayName('Historical');const h=f.hold(),saving=c.save();await h.entered;f.reply({code:'unavailable'},503);h.resolve();await saving;
 assert.equal(c.getSnapshot().current,null);assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().acknowledgement.displayName,'Historical');assert.notEqual(c.getSnapshot().writeState,'saved');
});
test('SYNTHETIC stale CAS retains unsent draft and requires deliberate new editing of current basis',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();c.setDisplayName('Unsent');f.setCurrent({...initial(),profileRevision:8,displayName:'Other Writer'});await c.save();
 assert.equal(c.getSnapshot().writeState,'conflict');assert.equal(c.getSnapshot().draft.base.profileRevision,7);await c.readCurrent();assert.equal(c.getSnapshot().current.profileRevision,8);assert.equal(c.getSnapshot().draft.displayName,'Unsent');assert.equal(c.getSnapshot().canSave,false);c.discardEdit();c.editDisplayName();c.setDisplayName('Deliberate');await c.save();assert.equal(f.calls.at(-2).command.expectedRevision,8);assert.equal(c.getSnapshot().writeState,'saved');
});
test('SYNTHETIC edit and discard while a write is held cannot be stale-closed by its ACK',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();c.setDisplayName('First');const h=f.hold(),saving=c.save();await h.entered;c.setDisplayName('Later');const newer=c.getSnapshot().draft;h.resolve();await saving;assert.equal(c.getSnapshot().draft,newer);assert.equal(c.getSnapshot().writeState,'acknowledged');
});
for(const status of [401,403])test('SYNTHETIC current HTTP '+status+' retires private data synchronously',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();c.setDisplayName('private draft');f.reply({code:'forbidden'},status);await c.readCurrent();const s=c.getSnapshot();assert.equal(s.current,null);assert.equal(s.draft,null);assert.equal(s.pending,null);assert.equal(s.acknowledgement,null);assert.equal(s.phase,status===401?'ended':'denied');
});
for(const event of ['owner','role','generation','serverGeneration','epoch','csrf','expiry','view','capabilities','applicability','dispose'])test('SYNTHETIC held private read is refused after actual '+event+' change',async t=>{
 const f=await fixture(t);let applicable=true;const {createAccountProfileController}=await controllerApi(),c=createAccountProfileController(f.runtime,{isApplicable:()=>applicable});t.after(()=>c.dispose());await c.load();c.editDisplayName();const h=f.hold(),reading=c.readCurrent();await h.entered;
 const cookie=f.runtime.cookie;
 if(event==='owner')cookie.identity.ownerId='22222222-2222-4222-8222-222222222222';
 if(event==='role')cookie.identity.role='advisor';if(event==='generation')cookie.generation++;if(event==='serverGeneration')cookie._view.generation++;if(event==='epoch')cookie._epoch++;if(event==='csrf')cookie._view.csrf='changed';
 if(event==='expiry')f.now(Date.parse('2100-01-01T00:00:00Z'));if(event==='view')cookie._view.capabilities.view=false;if(event==='capabilities')cookie._view.capabilities.edit=true;if(event==='applicability')applicable=false;if(event==='dispose')c.dispose();
 assert.equal(c.getSnapshot().current,null);h.resolve();await reading;assert.equal(c.getSnapshot().current,null);assert.notEqual(c.getSnapshot().writeState,'saved');
});
test('SYNTHETIC reentrant observer can replace a lane before write egress without old cleanup affecting new state',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();c.setDisplayName('First');let b;const stop=c.subscribe(()=>{if(!b&&c.getSnapshot().writeState==='saving'){b=f.createAccountProfileController(f.runtime);throw Error('deliberate observer fault');}});await c.save();stop();t.after(()=>b?.dispose());assert.equal(f.calls.filter(x=>x.command.action==='set_account_display_name_v1').length,0);await b.load();assert.equal(b.getSnapshot().current.displayName,initial().displayName);c.dispose();assert.equal(b.getSnapshot().current.displayName,initial().displayName);
});
test('SYNTHETIC current 403 hides an unresolved original until a fresh permitted profile read',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();c.setDisplayName('Private Original');f.reply({code:'unavailable'},503);await c.save();const original=c.getSnapshot().pending;
 f.reply({code:'forbidden'},403);await c.readCurrent();assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().draft,null);assert.equal(c.getSnapshot().canRetry,false);const calls=f.calls.length;await c.save();assert.equal(f.calls.length,calls);
 await c.readCurrent();assert.equal(c.getSnapshot().pending.requestId,original.requestId);assert.equal(c.getSnapshot().current.displayName,initial().displayName);
});
test('SYNTHETIC disposed or replaced callbacks stay terminal even after a fresh current read',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();const before=f.calls.length;c.dispose();c.dispose();await c.load();await c.save();c.setDisplayName('stale');c.discardEdit();assert.equal(f.calls.length,before);assert.equal(c.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().draft,null);
});
for(const kind of ['read','write'])test('SYNTHETIC actual caller abort refuses '+kind+' private return without forging HTTP401',async t=>{
 const f=await fixture(t),{createClientAccountProfileRequest}=await requestApi(),p=createClientAccountProfileRequest(f.runtime),abort=new AbortController();
 const command=kind==='read'?{schemaVersion:1,action:'read_account_profile_v1'}:{schemaVersion:1,action:'set_account_display_name_v1',requestId:'33333333-3333-4333-8333-333333333333',expectedRevision:7,displayName:'Aborted'};
 const h=f.hold(),running=p.execute(command,{signal:abort.signal}),rejected=assert.rejects(running,e=>e.status===503);await h.entered;abort.abort();h.resolve();await rejected;assert.equal(f.runtime.cookie.status,'ready');
});
for(const status of [403,503])test('SYNTHETIC retired A '+status+' cannot overwrite a newer read or unsent edit',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();c.setDisplayName('Original');f.reply({code:'unavailable'},status);const h=f.hold(),saving=c.save();await h.entered;
 await c.readCurrent();c.setDisplayName('Newer Edit');const before=c.getSnapshot();h.resolve();await saving;const after=c.getSnapshot();assert.equal(after.draft,before.draft);assert.equal(after.pending,before.pending);assert.notEqual(after.writeState,'saved');if(status===403)assert.equal(after.current,before.current);
});
test('SYNTHETIC invalid or oversized local edits never allocate or dispatch a request UUID',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();for(const text of ['  ','x'.repeat(201),'a\0',' '.repeat(9000)+'a']){c.setDisplayName(text);assert.equal(c.getSnapshot().canSave,false);await c.save();assert.equal(c.getSnapshot().pending,null);assert.equal(f.calls.length,1);}
});
for(const state of ['unknown','unverified'])test('SYNTHETIC current email '+state+' is a readonly canonical fact',async t=>{
 const f=await controlled(t);f.setCurrent({...initial(),currentEmail:state==='unknown'?{state:'unknown'}:{state:'known',address:'Exact.Case@EXAMPLE.invalid',verified:false}});await f.c.load();assert.deepEqual(f.c.getSnapshot().current.currentEmail,f.current().currentEmail);assert.equal(f.calls.length,1);
});
for(const offset of [1,2])for(const loss of ['view','expiry','applicability'])test('SYNTHETIC real lease wait '+offset+' denies write egress after '+loss+' loss',async t=>{
 const f=await fixture(t);let relevant=true;const {createAccountProfileController}=await controllerApi(),c=createAccountProfileController(f.runtime,{isApplicable:()=>relevant});t.after(()=>c.dispose());await c.load();c.editDisplayName();c.setDisplayName('Must Not Send');const h=f.holdAcquire(offset),saving=c.save();await h.entered;
 if(loss==='view')f.runtime.cookie._view.capabilities.view=false;if(loss==='expiry')f.now(Date.parse('2100-01-01T00:00:00Z'));if(loss==='applicability')relevant=false;
 h.resolve();await saving;assert.equal(f.calls.filter(x=>x.command.action==='set_account_display_name_v1').length,0);assert.equal(c.getSnapshot().current,null);
});
test('SYNTHETIC explicit save captures the original draft before its first await',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();c.setDisplayName('Clicked Original');const saving=c.save();c.setDisplayName('Typed After Click');await saving;
 assert.equal(f.calls.find(x=>x.command.action==='set_account_display_name_v1').command.displayName,'Clicked Original');assert.equal(c.getSnapshot().draft.displayName,'Typed After Click');assert.equal(c.getSnapshot().current.displayName,'Clicked Original');
});
test('SYNTHETIC reentrant newer read invalidates the old operation before any write egress',async t=>{
 const f=await controlled(t),{c}=f;await c.load();c.editDisplayName();c.setDisplayName('Retired Before Egress');let reading,ran=false;const stop=c.subscribe(()=>{if(!ran&&c.getSnapshot().writeState==='saving'){ran=true;reading=c.readCurrent();}});await c.save();await reading;stop();assert.equal(f.calls.filter(x=>x.command.action==='set_account_display_name_v1').length,0);assert.equal(c.getSnapshot().current.displayName,initial().displayName);
});
