import test from 'node:test';
import assert from 'node:assert/strict';
import { accountFixture } from './rebuild-account-entry-fixture.mjs';

for (const path of ['/account','/notifications']) test(`actual Application SSR at ${path} selects the actual inert entry without a care read`, async t => {
  const f = await accountFixture(t, { initialPath: path });
  const html = f.applicationHtml();
  assert.match(html, path === '/account' ? /loading account/ : /loading notifications/);
  assert.doesNotMatch(html, /this page is not connected yet|loading your plan/);
  assert.deepEqual(f.http, ['/api/client/session']); assert.equal(f.win.history.state, null);
});
test('advisor notifications SSR selects the shared actual entry', async t => {
  const f = await accountFixture(t, { audience: 'advisor', initialPath: '/notifications' });
  assert.match(f.applicationHtml(), /loading notifications/); assert.equal(f.commands.length, 0);
});
test('Account constructor and SSR do not create child controllers or subscribe/start navigation', async t => {
  const f = await accountFixture(t), entry = f.create(); t.after(() => entry.dispose());
  const state = entry.getSnapshot();
  assert.equal(state.phase, 'idle'); assert.equal(state.profile, null); assert.equal(state.contact, null);
  assert.equal(entry.getSnapshot(), state); assert.ok(Object.isFrozen(state));
  assert.match(f.html(entry), /account/); assert.equal(f.win.history.state, null);
  assert.deepEqual(f.http, ['/api/client/session']);
});
test('HISTORICAL unregistered constructor keeps Account unavailable, with no clinical request or fabricated module', async t => {
  const f = await accountFixture(t,{historicalUnregistered:true}), entry = f.create(); t.after(() => entry.dispose()); await entry.start();
  const html = f.html(entry);
  assert.match(html, /unavailable|could not/);
  assert.doesNotMatch(html, /profile saved|email sent|shipping address|cancel service|download final plan|source consent/);
  assert.deepEqual(f.http, ['/api/client/session']);
  assert.equal((html.match(/shelv-panel/g) ?? []).length, 1);
  assert.equal((html.match(/edit details/g) ?? []).length, 1);
});
for (const config of [{ audience: 'advisor' }, { initialPath: '/plan' }, { restore: false }]) test('Account outside its captured own-client route/session stays empty '+JSON.stringify(config), async t => {
  const f = await accountFixture(t, config), entry = f.create(); t.after(() => entry.dispose()); await entry.start();
  assert.equal(entry.getSnapshot().profile, null); assert.equal(entry.getSnapshot().contact, null);
  assert.equal(f.commands.length, 0);
});

test('SYNTHETIC registered channels render one shared card and one canonical email owner', async t => {
  const f = await accountFixture(t,{syntheticAccountChannels:true}),entry=f.create();t.after(()=>entry.dispose());await entry.start();
  const html=f.html(entry);
  assert.match(html,/Synthetic Name/);assert.match(html,/Current@Example.invalid/);
  assert.equal((html.match(/<dt>email<\/dt>/g)??[]).length,1);
  assert.equal((html.match(/contact preference/g)??[]).length,1);
  assert.equal((html.match(/shelv-panel/g)??[]).length,1);
  assert.equal((html.match(/edit details/g)??[]).length,1);
});
