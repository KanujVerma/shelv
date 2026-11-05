import test from 'node:test';import assert from 'node:assert/strict';
import { entryFixture, gate, at, event, id } from './rebuild-notifications-entry-fixture.mjs';
async function ready(t, options) { const f = await entryFixture(t, options), e = f.create(); t.after(() => e.dispose()); f.reply('list_inbox_v1', f.page()); await e.start(); return { f, e, c: e.getSnapshot().controller }; }
for (const status of [401, 503]) test(`cancelled A HTTP${status} cannot erase newer B on the same actual boundary`, async t => {
  const { f, e: a, c } = await ready(t), h = gate();
  f.reply('list_inbox_v1', { message: status === 401 ? 'concierge_session_ended' : 'concierge_unavailable' }, status, h);
  const old = c.loadInbox(); await h.entered;
  a.stop(); const b = f.create(); t.after(() => b.dispose()); f.reply('list_inbox_v1', f.page(9)); await b.start();
  h.release(); await old; a.dispose();
  assert.equal(f.runtime.cookie.status, 'ready'); assert.equal(b.getSnapshot().controller.getSnapshot().inbox.items[0].revision, 9);
});
for (const change of ['owner', 'csrf', 'generation']) test(`actual ${change} replacement permanently retires the creation-bound entry`, async t => {
  const { f, e, c } = await ready(t);
  f.login(change === 'owner' ? { ownerId: id(92) } : change === 'csrf' ? { csrf: 'SYNTHETIC-entry-new' } : { generation: 2 });
  await f.runtime.restore(); const n = f.commands.length; await e.start();
  assert.equal(e.getSnapshot().controller, null); assert.equal(e.getSnapshot().phase, 'ended'); assert.equal(c.getSnapshot().inbox, null); assert.equal(f.commands.length, n);
  const b = f.create(); t.after(() => b.dispose()); f.reply('list_inbox_v1', f.page(11)); await b.start(); assert.equal(b.getSnapshot().controller.getSnapshot().inbox.items[0].revision, 11);
});
test('current HTTP403 clears feature rows; actual current HTTP401 ends the owning session', async t => {
  for (const status of [403, 401]) {
    const { f, e, c } = await ready(t); f.reply('list_inbox_v1', { message: status === 401 ? 'concierge_session_ended' : 'concierge_forbidden' }, status); await c.loadInbox();
    assert.equal(c.getSnapshot().inbox, null); assert.equal(f.runtime.cookie.status, status === 401 ? 'signedout' : 'ready');
    assert.equal(status === 401 ? e.getSnapshot().controller : c.getSnapshot().phase, status === 401 ? null : 'denied');
  }
});
test('expiry and signout clear the entry before any private SSR return', async t => {
  for (const kind of ['expiry', 'signout']) {
    const { f, e, c } = await ready(t);
    if (kind === 'expiry') f.now(Date.parse('2099-01-03')); else await f.runtime.signOut();
    assert.equal(e.getSnapshot().controller, null); assert.equal(c.getSnapshot().inbox, null); assert.doesNotMatch(f.html(e), /mark seen|your plan is ready/);
  }
});
test('throwing and reentrant stop observers cannot erase B or its canonical navigator', async t => {
  const { f, e: a, c } = await ready(t); let b, loading;
  c.subscribe(() => { if (c.getSnapshot().phase === 'ended' && !b) { assert.equal(a.getSnapshot().controller, null); b = f.create(); f.reply('list_inbox_v1', f.page(12)); loading = b.start(); } });
  a.subscribe(() => { throw Error('synthetic observer'); }); a.stop(); assert.ok(b); t.after(() => b.dispose()); await loading;
  a.dispose(); assert.equal(b.getSnapshot().controller.getSnapshot().inbox.items[0].revision, 12);
  f.navigation.navigate({ name: 'account' }); assert.equal(b.getSnapshot().controller, null);
});
test('reentrant start on the active notification subscriber shares the single initial read', async t => {
  const f = await entryFixture(t), e = f.create(); let nested;
  e.subscribe(() => { if (e.getSnapshot().controller && !nested) nested = e.start(); });
  t.after(() => e.dispose()); f.reply('list_inbox_v1', f.page()); await e.start(); await nested; assert.equal(f.commands.length, 1);
});
test('startup without an actual boundary cannot silently bind after restore', async t => {
  const f = await entryFixture(t, { restore: false }), old = f.create(); t.after(() => old.dispose()); await old.start(); assert.equal(old.getSnapshot().controller, null);
  await f.runtime.restore(); await old.start(); assert.equal(old.getSnapshot().controller, null); assert.equal(f.commands.length, 0);
  const current = f.create(); t.after(() => current.dispose()); f.reply('list_inbox_v1', f.page()); await current.start(); assert.equal(f.commands.length, 1);
});
test('route-back remount preserves one exact original and resolves only its historical receipt', async t => {
  const { f, e, c } = await ready(t); f.reply('mark_seen_v1', { message: 'concierge_uncertain' }, 503); await c.markSeen(f.item.deliveryId); const original = f.commands.at(-1);
  f.navigation.navigate({ name: 'account' }); e.stop(); await f.runtime.restore(); f.navigation.back();
  f.reply('list_inbox_v1', f.page(15, at)); await e.start(); const b = e.getSnapshot().controller; assert.deepEqual(b.getSnapshot().pending, original);
  f.reply('request_status_v1', { status: 'committed', receipt: f.receipt(original) }); f.reply('list_inbox_v1', f.page(16, at)); await b.checkStatus();
  assert.equal(b.getSnapshot().receipt.revision, 5); assert.equal(b.getSnapshot().inbox.items[0].revision, 16); assert.equal(b.getSnapshot().pending, null); assert.equal(f.commands.filter(c => c.action === 'mark_seen_v1').length, 1);
});
for (const audience of ['client', 'advisor']) test(`${audience} VIEW-only bookkeeping remains available without care EDIT`, async t => {
  const { f, c } = await ready(t, { audience }); f.reply('mark_seen_v1', f.receipt); f.reply('list_inbox_v1', f.page(5, at)); await c.markSeen(f.item.deliveryId);
  assert.equal(c.getSnapshot().inbox.items[0].seenAt, at); assert.deepEqual(f.commands.map(c => c.action), ['list_inbox_v1', 'mark_seen_v1', 'list_inbox_v1']);
  if (audience === 'client') { await c.openEvent(f.item.deliveryId); assert.equal(f.commands.length, 3); }
});
test('A06 exact Root publication custody keeps staff retry EDIT-only through capability loss', async t => {
  const { f, e, c } = await ready(t, { audience: 'advisor', edit: true });
  const target = { draftId: id(30), clientId: id(31), contentRevision: 2, assignmentRevision: 1, contentHash: 'a'.repeat(64) };
  const command = { schemaVersion: 1, action: 'publish_plan_v1', requestId: id(32), target, approvalId: id(33), firstServiceClaimId: null };
  const published = { requestId: id(32), publicationReceiptId: id(34), target, kind: 'care_plan', publicationVersion: 3, instructionId: null, reviewId: null, publishedAt: at, firstServiceStarted: false, notificationEventId: event.eventId };
  const delivery = { schemaVersion: 1, consistency: 'live_keyset', observedAt: at, cursor: null, event, items: [{ deliveryId: id(3), channel: 'email', status: 'failed', revision: 2, seenAt: null }], nextCursor: null };
  f.reply('read_event_deliveries_v1', delivery); await c.openPublication(command, published); c.prepareRetry(id(3)); assert.ok(c.getSnapshot().confirmation);
  f.login({ capabilities: { view: true, edit: false, publish: false, confirmPayments: false } }); await f.runtime.restore(); const n = f.commands.length; await c.confirmRetry(); assert.equal(f.commands.length, n); assert.equal(c.getSnapshot().confirmation, null);
  f.reply('list_inbox_v1', f.page()); await c.loadInbox(); assert.equal(e.getSnapshot().controller, c); assert.doesNotMatch(f.html(e), /confirm email retry/);
  await c.openPublication(command, { ...published, target: { ...target, assignmentRevision: 2 } }); assert.equal(f.commands.length, n + 1);
});
test('actual serial gateway/Vault queues B behind held A and preserves original custody', { timeout: 20000 }, async t => {
  const { f, e: a, c } = await ready(t, { serial: true }), h = gate();
  f.reply('mark_seen_v1', f.receipt, 200, h); const old = c.markSeen(f.item.deliveryId); await h.entered; const original = f.commands.at(-1);
  a.stop(); const b = f.create(); t.after(() => b.dispose()); const n = f.queued(); f.reply('list_inbox_v1', f.page(18, at)); const loading = b.start(); await f.whenQueued(n + 1);
  assert.equal(f.commands.length, 2); h.release(); await Promise.all([old, loading]);
  assert.equal(b.getSnapshot().controller.getSnapshot().inbox.items[0].revision, 18); assert.deepEqual(b.getSnapshot().controller.getSnapshot().pending, original);
  assert.equal(f.runtime.cookie.status, 'ready'); assert.equal(f.record().status, 'active');
  assert.deepEqual(f.events, ['list_inbox_v1:start', 'list_inbox_v1:end', 'mark_seen_v1:start', 'mark_seen_v1:end', 'list_inbox_v1:start', 'list_inbox_v1:end']);
});
