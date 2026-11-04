// Closed in-memory file methods plus the actual ApplicationSession/cookie.
// No browser, filesystem delivery, provider or persistence acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplicationSession } from '../src/app/session.ts';
import { createAccountFinalExport } from '../src/features/account/final-export/controller.ts';

async function session(t) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw Error('unexpected global network'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];
  const runtime = createApplicationSession({ audience: 'client', now: () => Date.parse('2026-11-03T12:00:00Z'),
    locks: { request: async (_name, _options, run) => run() },
    fetcher: async url => {
      calls.push(url); assert.equal(url, '/api/client/session');
      return Response.json({ signedIn: true, ownerId: '11111111-1111-4111-8111-111111111111', generation: 1,
        csrf: 'synthetic-export-recovery', capabilities: { view: true, edit: false, publish: false, confirmPayments: false },
        idleExpiresAt: '2026-11-03T12:10:00Z', absoluteExpiresAt: '2026-11-03T13:00:00Z' });
    } });
  await runtime.restore(); runtime.cookie.channel?.unref?.(); t.after(() => runtime.dispose());
  return { runtime, calls };
}

test('AFEC1 a rejected writer acquisition leaves an explicit user retry available', async t => {
  const f = await session(t); let picks = 0, creates = 0;
  const c = createAccountFinalExport(f.runtime, { async showSaveFilePicker() {
    picks++; return { async createWritable() { creates++; throw new DOMException('synthetic rejection', 'NoModificationAllowedError'); } };
  } }); t.after(() => c.dispose());
  await c.saveFromUserAction();
  assert.equal(c.getSnapshot().phase, 'unavailable');
  assert.equal(c.getSnapshot().writer, 'unopened');
  await c.saveFromUserAction(); assert.equal(picks, 2); assert.equal(creates, 2);
  assert.deepEqual(f.calls, ['/api/client/session']);
});

test('AFEC1 late writer acquisition after cancellation publishes actual cleanup acknowledgement and permits retry', async t => {
  const f = await session(t); let release, entered, picks = 0, aborts = 0, writes = 0, closes = 0;
  const opening = new Promise(resolve => { release = resolve; }), acquired = new Promise(resolve => { entered = resolve; });
  const stream = { async write() { writes++; }, async close() { closes++; }, async abort() { aborts++; } };
  const c = createAccountFinalExport(f.runtime, { async showSaveFilePicker() {
    picks++; return { async createWritable() { if (picks > 1) throw Error('synthetic acquisition rejection'); entered(); return opening; } };
  } }); t.after(() => c.dispose());
  const saving = c.saveFromUserAction(); await acquired; c.cancel();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(c.getSnapshot(), { phase: 'cancelled', writer: 'aborting' });
  release(stream); await saving; await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(c.getSnapshot(), { phase: 'cancelled', writer: 'abort-acknowledged' });
  assert.equal(aborts, 1); assert.equal(writes, 0); assert.equal(closes, 0);
  await c.saveFromUserAction(); assert.equal(picks, 2);
  assert.deepEqual(f.calls, ['/api/client/session']);
});

for (const action of ['cancel', 'dispose']) for (const supported of [true, false])
  test(`AFEC2 picker capability getter cannot revive ${action}, supported=${supported}`, async t => {
    const f = await session(t); let c, picks = 0;
    const host = { get showSaveFilePicker() { c[action](); return supported ? async () => { picks++; throw Error('must not dispatch'); } : undefined; } };
    c = createAccountFinalExport(f.runtime, host); t.after(() => c.dispose());
    await c.saveFromUserAction();
    assert.equal(c.getSnapshot().phase, action === 'cancel' ? 'cancelled' : 'retired');
    assert.equal(picks, 0); assert.deepEqual(f.calls, ['/api/client/session']);
  });

for (const retirement of ['offline', 'disposed'])
  test(`cleanup ownership survives cancel then ${retirement} while writer acquisition is pending`, async t => {
    const f = await session(t); let release, entered, picks = 0, aborts = 0, writes = 0, closes = 0;
    const opening = new Promise(resolve => { release = resolve; }), acquired = new Promise(resolve => { entered = resolve; });
    const stream = { async write() { writes++; }, async close() { closes++; }, async abort() { aborts++; } };
    t.after(() => release(stream));
    const c = createAccountFinalExport(f.runtime, { async showSaveFilePicker() {
      picks++; return { async createWritable() { if (picks > 1) throw Error('synthetic acquisition rejection'); entered(); return opening; } };
    } }); t.after(() => c.dispose());
    const saving = c.saveFromUserAction(); await acquired; c.cancel();
    if (retirement === 'offline') f.runtime.cookie.suspend(); else c.dispose();
    const phase = retirement === 'offline' ? 'unavailable' : 'retired';
    assert.deepEqual(c.getSnapshot(), { phase, writer: 'aborting' });
    await c.saveFromUserAction(); assert.equal(picks, 1, 'no replacement while late acquisition cleanup is outstanding');
    release(stream); await saving; await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(c.getSnapshot(), { phase, writer: 'abort-acknowledged' });
    assert.deepEqual({ aborts, writes, closes }, { aborts: 1, writes: 0, closes: 0 });
    if (retirement === 'offline') {
      await f.runtime.restore(); await c.saveFromUserAction(); assert.equal(picks, 2, 'new user action is available after real session recovery and cleanup');
      assert.deepEqual(f.calls, ['/api/client/session', '/api/client/session']);
    } else {
      await c.saveFromUserAction(); assert.equal(picks, 1, 'cleanup acknowledgement never revives a disposed export');
      assert.deepEqual(f.calls, ['/api/client/session']);
    }
  });

test('repeated offline retirement preserves failed cleanup and continues to deny another destination', async t => {
  const f = await session(t); let release, entered, picks = 0, aborts = 0;
  const opening = new Promise(resolve => { release = resolve; }), acquired = new Promise(resolve => { entered = resolve; });
  const stream = { async write() { assert.fail('retired content write'); }, async close() { assert.fail('retired close'); }, async abort() { aborts++; throw Error('synthetic cleanup refusal'); } };
  t.after(() => release(stream));
  const c = createAccountFinalExport(f.runtime, { async showSaveFilePicker() {
    picks++; return { async createWritable() { entered(); return opening; } };
  } }); t.after(() => c.dispose());
  const saving = c.saveFromUserAction(); await acquired; c.cancel(); f.runtime.cookie.suspend();
  release(stream); await saving; await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(c.getSnapshot(), { phase: 'unavailable', writer: 'abort-unconfirmed' });
  assert.equal(aborts, 1); await f.runtime.restore(); await c.saveFromUserAction(); assert.equal(picks, 1);
});

test('error-path cleanup ownership survives a later offline presentation', async t => {
  const f = await session(t); let release, entered, picks = 0, aborts = 0;
  const cleanup = new Promise(resolve => { release = resolve; }), aborting = new Promise(resolve => { entered = resolve; });
  t.after(() => release());
  const c = createAccountFinalExport(f.runtime, { async showSaveFilePicker() {
    picks++; return { async createWritable() { return {
      async write() { assert.fail('unregistered export must not write'); }, async close() { assert.fail('unregistered export must not close'); },
      async abort() { aborts++; entered(); await cleanup; },
    }; } };
  } }); t.after(() => c.dispose());
  const saving = c.saveFromUserAction(); await aborting; f.runtime.cookie.suspend();
  assert.deepEqual(c.getSnapshot(), { phase: 'unavailable', writer: 'aborting' });
  release(); await saving;
  assert.deepEqual(c.getSnapshot(), { phase: 'unavailable', writer: 'abort-acknowledged' });
  assert.equal(aborts, 1); assert.equal(picks, 1); assert.deepEqual(f.calls, ['/api/client/session']);
});
