// Actual controllers/session/navigation with finite closed HTTP. No DOM or SQL.
import test from 'node:test';
import assert from 'node:assert/strict';
import { accountFixture, gate, id } from './rebuild-account-entry-fixture.mjs';

async function started(t, options) {
  const f = await accountFixture(t, options), entry = f.create();
  t.after(() => entry.dispose());
  await entry.start();
  const { profile, contact } = entry.getSnapshot();
  assert.ok(profile); assert.ok(contact);
  return { f, entry, profile, contact };
}
test('one started lifetime shares the same promise and both actual domain controllers', async t => {
  const f = await accountFixture(t), entry = f.create(); t.after(() => entry.dispose());
  let nested;
  entry.subscribe(() => { if (entry.getSnapshot().phase === 'active' && !nested) nested = entry.start(); });
  const loading = entry.start();
  assert.equal(entry.start(), loading); assert.equal(nested, loading);
  await loading;
  const state = entry.getSnapshot(); assert.equal(state.phase, 'active');
  assert.ok(state.profile); assert.ok(state.contact); assert.ok(Object.isFrozen(state));
  const calls = f.http.length; await entry.start(); assert.equal(f.http.length, calls);
});
test('StrictMode setup/cleanup/setup recreates domain controllers and clears before disposal observers', async t => {
  const { f, entry, profile, contact } = await started(t);
  let observed = false;
  entry.subscribe(() => {
    if (entry.getSnapshot().profile === null) {
      observed = true;
      assert.equal(entry.getSnapshot().profile, null);
      assert.equal(entry.getSnapshot().contact, null);
      assert.doesNotMatch(f.html(entry), /<input|save changes|verify email/);
    }
  });
  entry.stop(); assert.ok(observed);
  assert.equal(contact.getSnapshot().phase, 'ended');
  await entry.start();
  assert.notEqual(entry.getSnapshot().profile, profile);
  assert.notEqual(entry.getSnapshot().contact, contact);
});
test('actual navigator Back/Forward retires Account and preserves the canonical route snapshots', async t => {
  const { f, entry, profile } = await started(t);
  f.navigation.navigate({ name: 'notifications' });
  assert.equal(entry.getSnapshot().phase, 'inactive');
  assert.equal(profile.getSnapshot().phase, 'ended');
  f.navigation.back(); assert.equal(f.navigation.getSnapshot(), '/account');
  await entry.start(); assert.equal(entry.getSnapshot().phase, 'active');
  f.win.history.go(1); assert.equal(f.navigation.getSnapshot(), '/notifications');
  assert.equal(entry.getSnapshot().profile, null);
});
for (const change of ['owner','csrf','generation']) test(`actual ${change} replacement cannot be adopted by an old Account entry`, async t => {
  const { f, entry, profile, contact } = await started(t);
  f.login(change === 'owner' ? { ownerId: id(92) } : change === 'csrf' ? { csrf: 'SYNTHETIC-new-account' } : { generation: 2 });
  await f.runtime.restore(); await entry.start();
  assert.equal(entry.getSnapshot().phase, 'ended');
  assert.equal(entry.getSnapshot().profile, null); assert.equal(entry.getSnapshot().contact, null);
  assert.equal(profile.getSnapshot().phase, 'ended'); assert.equal(contact.getSnapshot().phase, 'ended');
  const next = f.create(); t.after(() => next.dispose()); await next.start(); assert.equal(next.getSnapshot().phase, 'active');
});
test('predecessor retirement route callback publishes inactive; returning permits a real new start', async t => {
  const { f, entry: a, profile } = await started(t);
  a.subscribe(() => { if (a.getSnapshot().phase === 'ended') f.navigation.navigate({ name: 'notifications' }); });
  const b = f.create(); t.after(() => b.dispose()); const phases = [];
  b.subscribe(() => phases.push(b.getSnapshot().phase));
  await b.start(); assert.deepEqual(phases, ['inactive']);
  f.navigation.back(); await b.start(); assert.equal(b.getSnapshot().phase, 'active');
  a.dispose(); assert.equal(b.getSnapshot().phase, 'active');
});
test('reentrant C replacement during A disposal survives B finalization and old cleanup', async t => {
  const { f, entry: a, profile } = await started(t);
  let c, loading;
  a.subscribe(() => {
    if (a.getSnapshot().phase === 'ended' && !c) { c = f.create(); loading = c.start(); }
  });
  const b = f.create(); t.after(() => { b.dispose(); c?.dispose(); });
  await b.start(); await loading; assert.ok(c);
  a.dispose(); b.stop(); b.dispose();
  assert.equal(c.getSnapshot().phase, 'active');
  f.navigation.navigate({ name: 'notifications' }); assert.equal(c.getSnapshot().phase, 'inactive');
});
test('throwing disposal observers do not prevent either domain retirement or a successor', async t => {
  const { f, entry, profile, contact } = await started(t);
  entry.subscribe(() => { if (entry.getSnapshot().profile === null) throw Error('synthetic observer'); });
  entry.subscribe(() => { throw Error('synthetic entry observer'); });
  entry.stop(); assert.equal(profile.getSnapshot().phase, 'ended'); assert.equal(contact.getSnapshot().phase, 'ended');
  const next = f.create(); t.after(() => next.dispose()); await next.start();
  entry.dispose(); assert.equal(next.getSnapshot().phase, 'active');
});
test('stop before queued load prevents all domain HTTP and signout clears before private SSR', async t => {
  const f = await accountFixture(t), entry = f.create(); t.after(() => entry.dispose());
  const calls = f.http.length, loading = entry.start(); entry.stop(); await loading;
  assert.equal(f.http.length, calls); assert.equal(entry.getSnapshot().profile, null);
  await entry.start(); await f.runtime.signOut();
  assert.equal(entry.getSnapshot().phase, 'ended'); assert.doesNotMatch(f.html(entry), /<input|save changes/);
});
for (const audience of ['client','advisor']) test(`${audience} real Notifications entry reads through serial cookie/gateway/Vault and Root handler`, async t => {
  const f = await accountFixture(t, { audience, serial: true, initialPath: '/notifications' });
  const entry = f.createNotifications(); t.after(() => entry.dispose());
  f.reply('list_inbox_v1', f.page()); await entry.start();
  const c = entry.getSnapshot().controller; assert.equal(c.getSnapshot().phase, 'ready');
  assert.match(f.notificationHtml(entry), /mark seen/);
  assert.equal(f.queued(), 1); assert.equal(f.record().status, 'active');
});
test('late cancelled notification read cannot clear Account or superseding notifications', async t => {
  const f = await accountFixture(t, { initialPath: '/notifications' }), old = f.createNotifications();
  const hold = gate(); f.reply('list_inbox_v1', f.page(), 200, hold);
  const loading = old.start(); await hold.entered;
  f.navigation.navigate({ name: 'account' });
  const account = f.create(); t.after(() => { old.dispose(); account.dispose(); }); await account.start();
  hold.release(); await loading;
  assert.equal(account.getSnapshot().phase, 'active'); assert.equal(f.runtime.cookie.status, 'ready');
});

test('actual view-used opaque dialog activation rejects old Close after a newer activation or route lifetime', async t => {
  // Only the fixture's appended export exposes the actual private helper. No
  // controller/session/currentness method is supplied or replaced by this test.
  const { f, entry } = await started(t);
  const details = f.api.testCreateDetailsActivation(entry); t.after(() => details.dispose());
  details.open(); const a = details.capture(); assert.ok(a);
  details.open(); const b = details.capture(); assert.ok(b); assert.notEqual(a.activation, b.activation);
  details.close(a); assert.equal(details.getSnapshot(), b.activation);
  f.navigation.navigate({ name: 'notifications' }); details.close(b);
  assert.equal(entry.getSnapshot().profile, null);
  f.navigation.back(); await entry.start();
  const currentDetails=f.api.testCreateDetailsActivation(entry); t.after(()=>currentDetails.dispose());
  currentDetails.open(); const c = currentDetails.capture(); assert.ok(c);
  details.close(b); assert.equal(currentDetails.getSnapshot(), c.activation);
  currentDetails.close(b); assert.equal(currentDetails.getSnapshot(), c.activation);
  currentDetails.close(c); assert.equal(currentDetails.getSnapshot(), null);
});
test('actual view-used dialog publishes closed before callbacks and preserves a reentrant activation', async t => {
  const { f, entry } = await started(t);
  const details = f.api.testCreateDetailsActivation(entry); t.after(() => details.dispose());
  details.open(); const a = details.capture(); assert.ok(a);
  let replacement;
  details.subscribe(() => { if (details.getSnapshot() === null && !replacement) { details.open(); replacement = details.getSnapshot(); } });
  details.close(a); assert.ok(replacement); assert.equal(details.getSnapshot(), replacement);
  details.close(a); assert.equal(details.getSnapshot(), replacement);
});

test('SYNTHETIC registered channels: old Close cannot erase equal-valued replacement draft objects', async t => {
  const { f, entry, profile, contact } = await started(t, {syntheticAccountChannels:true});
  const details = f.api.testCreateDetailsActivation(entry); t.after(() => details.dispose());
  details.open(); const a = details.capture(); assert.ok(a.profileDraft); assert.ok(a.contactDraft);
  profile.setDisplayName(a.profileDraft.displayName); contact.setEmail(a.contactDraft.email);
  const b = details.capture();
  assert.notEqual(a.profileDraft, b.profileDraft); assert.notEqual(a.contactDraft, b.contactDraft);
  assert.equal(a.profileDraft.displayName, b.profileDraft.displayName); assert.equal(a.contactDraft.email, b.contactDraft.email);
  details.close(a); assert.equal(details.getSnapshot(), b.activation);
  assert.equal(profile.getSnapshot().draft, b.profileDraft); assert.equal(contact.getSnapshot().draft, b.contactDraft);
  details.close(b); assert.equal(details.getSnapshot(), null);
  assert.equal(profile.getSnapshot().draft, null); assert.equal(contact.getSnapshot().draft, null);
});
test('SYNTHETIC registered channels: reentrant name-discard callback cannot discard the new email edit', async t => {
  const { f, entry, profile, contact } = await started(t, {syntheticAccountChannels:true});
  const details = f.api.testCreateDetailsActivation(entry); t.after(() => details.dispose()); details.open();
  profile.setDisplayName('Unsent Name'); contact.setEmail('Unsent@Example.invalid');
  const a = details.capture(); let b;
  profile.subscribe(() => { if (profile.getSnapshot().draft === null && !b) { details.open(); b = details.capture(); } });
  details.close(a); assert.ok(b); assert.equal(details.getSnapshot(), b.activation);
  assert.equal(contact.getSnapshot().draft, b.contactDraft); assert.equal(contact.getSnapshot().draft.email, 'Unsent@Example.invalid');
});
test('SYNTHETIC registered channels: dialog Close retains actual immutable uncertain email original', async t => {
  const { f, entry, contact } = await started(t, {syntheticAccountChannels:true});
  const details = f.api.testCreateDetailsActivation(entry); t.after(() => details.dispose()); details.open();
  contact.setEmail('Original@Example.invalid'); assert.equal(contact.reviewEmail(), true);
  f.accountReply({code:'unavailable'},503); await contact.requestChange();
  const original = contact.getSnapshot().original; assert.ok(original); const n=f.accountCommands.length;
  const a=details.capture(); details.close(a);
  assert.equal(contact.getSnapshot().original, original); assert.equal(f.accountCommands.length,n);
  await f.runtime.restore(); entry.stop(); await entry.start();
  assert.deepEqual(entry.getSnapshot().contact.getSnapshot().original,original);
  assert.equal(f.accountCommands.filter(c=>c.action==='request_account_email_change_v1').length,1);
});

test('SYNTHETIC registered channels: name save leaves the independently edited email untouched', async t => {
  const {f,entry,profile,contact}=await started(t,{syntheticAccountChannels:true});
  const details=f.api.testCreateDetailsActivation(entry);t.after(()=>details.dispose());details.open();
  profile.setDisplayName('Saved Name');contact.setEmail('Unsent@Example.invalid');const emailDraft=contact.getSnapshot().draft;
  f.profileView.displayName='Saved Name';f.profileView.profileRevision=8;
  f.accountReply(command=>({schemaVersion:1,requestId:command.requestId,action:command.action,previousRevision:7,revision:8,displayName:command.displayName,recordedAt:'2026-11-02T12:00:00Z'}));
  assert.equal(await profile.save(),true);assert.equal(profile.getSnapshot().writeState,'saved');
  assert.equal(contact.getSnapshot().draft,emailDraft);assert.equal(contact.getSnapshot().draft.email,'Unsent@Example.invalid');
  assert.equal(f.accountCommands.filter(c=>c.action==='set_account_display_name_v1').length,1);
  assert.equal(f.accountCommands.filter(c=>c.action==='request_account_email_change_v1').length,0);
});

test('CURRENT registered Account name read/save/reread/remount uses actual serialized encrypted gateway/Vault/Root producer',async t=>{
 const f=await accountFixture(t,{serial:true}),entry=f.create();t.after(()=>entry.dispose());await entry.start();const first=entry.getSnapshot();
 assert.equal(first.profile.getSnapshot().current.displayName,'Synthetic Name');assert.equal(first.contact.getSnapshot().current.currentEmail.address,'Current@Example.invalid');
 first.profile.editDisplayName();first.profile.setDisplayName('  Actual Registered Name  ');assert.equal(await first.profile.save(),true);
 assert.equal(first.profile.getSnapshot().writeState,'saved');assert.equal(first.profile.getSnapshot().current.displayName,'  Actual Registered Name  ');
 assert.equal(f.accountCommands.filter(c=>c.action==='set_account_display_name_v1').length,1);
 entry.stop();await entry.start();const next=entry.getSnapshot();assert.notEqual(next.profile,first.profile);assert.equal(next.profile.getSnapshot().current.displayName,'  Actual Registered Name  ');
 assert.equal(f.accountCommands.filter(c=>c.action==='set_account_display_name_v1').length,1);assert.equal(f.runtime.cookie.status,'ready');
 assert.ok(f.http.every(p=>['/api/client/session','/api/client/account-profile','/api/client/account-contact'].includes(p)),'no clinical read');
});
test('CURRENT actual Account session retirement clears both domains before entry observers',async t=>{
 const f=await accountFixture(t,{serial:true}),entry=f.create();t.after(()=>entry.dispose());await entry.start();const before=entry.getSnapshot();before.profile.editDisplayName();before.profile.setDisplayName('Private Draft');
 let observed=false;entry.subscribe(()=>{if(entry.getSnapshot().phase==='ended'){observed=true;assert.equal(before.profile.getSnapshot().current,null);assert.equal(before.contact.getSnapshot().current,null);}});
 f.runtime.cookie._end();assert.equal(observed,true);assert.equal(entry.getSnapshot().profile,null);assert.equal(entry.getSnapshot().contact,null);
});
