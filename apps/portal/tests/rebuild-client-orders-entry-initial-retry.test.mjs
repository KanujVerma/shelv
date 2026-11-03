import test from 'node:test';
import assert from 'node:assert/strict';
import {entryFixture} from './rebuild-client-orders-entry-fixture.mjs';

test('first inactive A retry cannot supersede B after ordinary restore',async t=>{
  const f=await entryFixture(t),a=f.create();let b;
  t.after(()=>{a.dispose();b?.dispose();});
  f.runtime.cookie.suspend();await a.start();
  const stale=a.getSnapshot();assert.equal(stale.phase,'inactive');
  await f.runtime.restore();b=f.create();await b.start();
  const current=b.getSnapshot(),calls=f.calls.length;
  f.actions(a).retry(stale);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.calls.length,calls,'stale inactive retry must not issue another read');
  assert.equal(b.getSnapshot(),current,'B must remain current');
});

test('first non-Orders inactive A retry cannot supersede B on returning to Orders',async t=>{
  const f=await entryFixture(t,{initial:'/account'}),a=f.create();let b;
  t.after(()=>{a.dispose();b?.dispose();});
  await a.start();const stale=a.getSnapshot();assert.equal(stale.phase,'inactive');
  f.navigation.navigate({name:'orders'});b=f.create();await b.start();
  const current=b.getSnapshot(),calls=f.calls.length;
  f.actions(a).retry(stale);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.calls.length,calls,'stale non-Orders retry must not issue another read');
  assert.equal(b.getSnapshot(),current,'B must remain current');
});
