import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// The complete actual-source fixture is loaded only after this owned entry
// exists. A missing implementation is distinct from an unavailable dependency.
async function fixture(t, options) {
  assert.ok(existsSync(new URL('../src/app/notifications-entry.tsx',import.meta.url)), 'the owned notifications App-entry seam is missing');
  const { entryFixture } = await import('./rebuild-notifications-entry-fixture.mjs');
  return entryFixture(t, options);
}
test('constructor and SSR stay inert; explicit start performs exactly one initial read', async t => {
  const f = await fixture(t);
  const e = f.create(); t.after(() => e.dispose());
  assert.equal(f.win.history.state, null, 'constructor does not subscribe or start canonical navigation');
  const initial = e.getSnapshot();
  assert.equal(initial.controller, null);
  assert.equal(e.getSnapshot(), initial);
  assert.ok(Object.isFrozen(initial));
  const before = f.commands.length;
  assert.match(f.html(e), /notifications/);
  assert.equal(f.win.history.state, null, 'SSR has no navigator subscription');
  assert.equal(f.commands.length, before);
  f.reply('list_inbox_v1', f.page());
  await e.start(); await e.start();
  assert.equal(f.commands.length, before + 1);
  assert.equal(e.getSnapshot().controller.getSnapshot().phase, 'ready');
  assert.match(f.html(e), /mark seen/);
});
test('stop clears before observers and remount retains the actual original request', async t => {
  const f = await fixture(t), e = f.create(); t.after(() => e.dispose());
  f.reply('list_inbox_v1', f.page()); await e.start();
  const a = e.getSnapshot().controller;
  f.reply('mark_seen_v1', { message: 'concierge_uncertain' }, 503);
  await a.markSeen(f.item.deliveryId);
  const original = f.commands.at(-1);
  e.subscribe(() => { if (e.getSnapshot().controller === null) assert.equal(a.getSnapshot().inbox, null); });
  e.stop(); await f.runtime.restore();
  f.reply('list_inbox_v1', f.page(8)); await e.start();
  const b = e.getSnapshot().controller;
  assert.notEqual(a, b);
  assert.deepEqual(b.getSnapshot().pending, original);
  assert.equal(b.getSnapshot().inbox.items[0].revision, 8);
  assert.equal(f.commands.filter(x => x.action === 'mark_seen_v1').length, 1);
});
test('actual canonical route exit retires A; old entry disposal cannot stop B navigation', async t => {
  const f = await fixture(t), a = f.create();
  f.reply('list_inbox_v1', f.page()); await a.start();
  f.navigation.navigate({ name: 'account' });
  assert.equal(a.getSnapshot().controller, null);
  assert.equal(f.commands.length, 1);
  f.navigation.navigate({ name: 'notifications' });
  const b = f.create(); t.after(() => b.dispose());
  f.reply('list_inbox_v1', f.page(9)); await b.start();
  a.dispose();
  assert.equal(b.getSnapshot().controller.getSnapshot().inbox.items[0].revision, 9);
  f.navigation.navigate({ name: 'account' });
  assert.equal(b.getSnapshot().controller, null);
  assert.equal(f.navigation.getSnapshot(), '/account');
});
test('an explicit start on another canonical route publishes inactive without dispatch', async t => {
  const f = await fixture(t, { initialPath: '/account' }), e = f.create(); t.after(() => e.dispose());
  const changes = []; e.subscribe(() => changes.push(e.getSnapshot().phase));
  await e.start();
  assert.deepEqual(changes, ['inactive']);
  assert.equal(e.getSnapshot().controller, null);
  assert.equal(f.commands.length, 0);
  assert.equal(f.html(e), '');
});
