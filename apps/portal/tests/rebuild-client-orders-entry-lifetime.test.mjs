import test from 'node:test';
import assert from 'node:assert/strict';
import {entryFixture,gate,recordedView,purchaseId} from './rebuild-client-orders-entry-fixture.mjs';

test('route departure clears the entry and controller before observers; old callbacks cannot adopt a restarted controller',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());await e.start();const rendered=e.getSnapshot(),c=rendered.controller;
  let cleared=false;e.subscribe(()=>{if(e.getSnapshot().phase==='inactive'){cleared=true;assert.equal(e.getSnapshot().controller,null);assert.equal(c.getSnapshot().view,null);}});
  f.navigation.navigate({name:'account'});assert.equal(cleared,true);
  f.actions(e).back(rendered);f.actions(e).open(rendered,purchaseId);assert.equal(f.navigation.getSnapshot(),'/account');
  f.navigation.navigate({name:'orders'});await e.start();const newer=e.getSnapshot();assert.notEqual(newer.controller,c);
  f.actions(e).open(rendered,purchaseId);assert.equal(f.navigation.getSnapshot(),'/orders');
});
test('new entry on the same actual navigator supersedes old ownership without disposing the navigator',async t=>{
  const f=await entryFixture(t),a=f.create(),b=f.create();t.after(()=>{a.dispose();b.dispose();});await a.start();const c=a.getSnapshot().controller;
  await b.start();assert.equal(a.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().phase,'ended');
  const s=b.getSnapshot();a.stop();a.dispose();await a.start();assert.equal(b.getSnapshot(),s);
  f.navigation.navigate({name:'order',orderId:purchaseId});assert.equal(b.getSnapshot().route.orderId,purchaseId);
});
for(const loss of ['owner','role','epoch','generation','serverGeneration','csrf','view','offline','expiry','signout'])test('actual '+loss+' loss clears all entry-owned private state',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());await e.start();const c=e.getSnapshot().controller,s=e.getSnapshot();
  if(loss==='owner'){f.login({ownerId:'22222222-2222-4222-8222-222222222222'});await f.runtime.restore();}
  if(loss==='role')f.runtime.cookie.identity.role='advisor';
  if(loss==='epoch')f.runtime.cookie._epoch++;
  if(loss==='generation')f.runtime.cookie.generation++;
  if(loss==='serverGeneration')f.runtime.cookie._view.generation++;
  if(loss==='csrf')f.runtime.cookie._view.csrf='SYNTHETIC-replaced';
  if(loss==='view')f.runtime.cookie._view.capabilities.view=false;
  if(loss==='offline')f.runtime.cookie.suspend();
  if(loss==='expiry')f.now(Date.parse('2099-01-03'));
  if(loss==='signout')await f.runtime.signOut();
  assert.equal(e.getSnapshot().controller,null);assert.equal(c.getSnapshot().view,null);
  f.actions(e).open(s,purchaseId);assert.equal(f.navigation.getSnapshot(),'/orders');
});
test('retirement is complete despite throwing and reentrant observers',async t=>{
  const f=await entryFixture(t),a=f.create();t.after(()=>a.dispose());await a.start();let b,read;
  a.subscribe(()=>{throw Error('deliberate observer');});
  a.subscribe(()=>{if(a.getSnapshot().phase==='idle'&&!b){b=f.create();read=b.start();}});
  a.stop();assert.ok(b);t.after(()=>b.dispose());await read;a.dispose();assert.equal(b.getSnapshot().phase,'active');
});

test('reentrant C supersession during B start cannot be retired by B or old A callbacks',async t=>{
  const f=await entryFixture(t),a=f.create(),b=f.create();let c,readC,observed;
  t.after(()=>{a.dispose();b.dispose();c?.dispose();});await a.start();
  const rendered=a.getSnapshot(),old=rendered.controller;
  a.subscribe(()=>{if(a.getSnapshot().phase==='ended'&&!c){
    observed={entry:a.getSnapshot(),consumer:old.getSnapshot()};c=f.create();readC=c.start();
  }});
  await b.start();await readC;const current=c.getSnapshot();
  assert.equal(observed.entry.controller,null);assert.equal(observed.consumer.view,null);
  assert.equal(current.phase,'active');assert.equal(current.controller.getSnapshot().view.revision,17);
  a.stop();b.stop();a.dispose();b.dispose();f.actions(a).open(rendered,purchaseId);f.actions(a).back(rendered);
  assert.equal(c.getSnapshot(),current);assert.equal(f.navigation.getSnapshot(),'/orders');
});

test('same-entry stop and restart while the old read is held leaves old catch and finally without newer ownership',async t=>{
  const f=await entryFixture(t),e=f.create(),h=gate();let count=0;t.after(()=>{h.release();e.dispose();});
  f.response(async()=>{if(++count===1){h.enter();await h.wait;return Response.json({code:'unavailable'},{status:503});}return Response.json(recordedView(24));});
  const first=e.start();await h.entered;const before=e.getSnapshot();e.stop();await e.start();
  const current=e.getSnapshot();h.release();await first;
  assert.equal(e.getSnapshot(),current);assert.equal(current.controller.getSnapshot().view.revision,24);
  f.actions(e).back(before);f.actions(e).open(before,purchaseId);assert.equal(f.navigation.getSnapshot(),'/orders');
  assert.equal(f.runtime.cookie.status,'ready');
});

test('retirement clears the private read before its actual abort listener can reenter',async t=>{
  const f=await entryFixture(t),e=f.create(),h=gate();let atAbort,read;
  t.after(()=>{h.release();e.dispose();});await e.start();const old=e.getSnapshot().controller;
  f.response(async init=>{init.signal.addEventListener('abort',()=>{atAbort={entry:e.getSnapshot(),consumer:old.getSnapshot()};},{once:true});h.enter();await h.wait;return Response.json(recordedView(22));});
  read=old.load();await h.entered;e.stop();
  assert.equal(atAbort.entry.controller,null);assert.equal(atAbort.consumer.view,null);
  h.release();await read;assert.equal(e.getSnapshot().phase,'idle');
});

test('an old inactive retry cannot supersede a newer entry on the same navigator',async t=>{
  const f=await entryFixture(t),a=f.create();let b;t.after(()=>{a.dispose();b?.dispose();});await a.start();
  f.runtime.cookie.suspend();const stale=a.getSnapshot();await f.runtime.restore();
  b=f.create();await b.start();const current=b.getSnapshot(),calls=f.calls.length;
  f.actions(a).retry(stale);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.calls.length,calls);assert.equal(b.getSnapshot(),current);
  assert.equal(current.controller.getSnapshot().view.revision,17);
});

test('an old inactive retry cannot adopt a later inactive state of the same restarted entry',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());await e.start();
  f.runtime.cookie.suspend();const stale=e.getSnapshot();await f.runtime.restore();await e.start();
  f.runtime.cookie.suspend();const current=e.getSnapshot();await f.runtime.restore();const calls=f.calls.length;
  f.actions(e).retry(stale);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.calls.length,calls);assert.equal(e.getSnapshot(),current);
});

test('the current inactive retry still recovers through one fresh actual read',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());await e.start();
  f.runtime.cookie.suspend();const current=e.getSnapshot();await f.runtime.restore();const calls=f.calls.length;
  f.actions(e).retry(current);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.calls.length,calls+1);assert.equal(e.getSnapshot().phase,'active');
  assert.equal(e.getSnapshot().controller.getSnapshot().view.revision,17);
});
