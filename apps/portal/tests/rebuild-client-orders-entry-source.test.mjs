import test from 'node:test';
import assert from 'node:assert/strict';
import {entryFixture,purchaseId,defineRegisteredEntryTests} from './rebuild-client-orders-entry-fixture.mjs';

// The original 23 pre-registration cases and 9/10 constructor projection are
// retained at immutable 2563ad56. These are current registered successors.
defineRegisteredEntryTests();

test('construction/subscription are inert; actual minimum VIEW client selects canonical Orders without care',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());const n=f.calls.length;
  const stop=e.subscribe(()=>{});assert.equal(e.getSnapshot().phase,'idle');assert.equal(e.getSnapshot().controller,null);
  assert.equal(f.calls.length,n);assert.equal(f.win.history.state,null);stop();
  await e.start();const s=e.getSnapshot();assert.equal(s.phase,'active');assert.equal(s.route.name,'orders');
  assert.equal(s.controller.getSnapshot().phase,'ready');assert.equal(s.controller.getSnapshot().error,null);
  assert.equal(s.controller.getSnapshot().view.revision,17);assert.equal(f.calls.length,n+1);
});
for(const initial of ['/orders','/orders/'+purchaseId])test('canonical '+initial+' selects the exact consumer route',async t=>{
  const f=await entryFixture(t,{initial}),e=f.create();t.after(()=>e.dispose());await e.start();
  assert.deepEqual(e.getSnapshot().route,initial==='/orders'?{name:'orders'}:{name:'order',orderId:purchaseId});
  assert.equal(f.calls.length,2);
});
for(const initial of ['/account','/plan','/advisor/clients'])test('non-Orders '+initial+' cannot create a controller or read',async t=>{
  const f=await entryFixture(t,{initial}),e=f.create();t.after(()=>e.dispose());await e.start();
  assert.equal(e.getSnapshot().controller,null);assert.equal(f.calls.length,1);
});
test('advisor audience cannot use client Orders entry',async t=>{
  const f=await entryFixture(t,{audience:'advisor'}),e=f.create();t.after(()=>e.dispose());await e.start();
  assert.equal(e.getSnapshot().phase,'ended');assert.equal(e.getSnapshot().controller,null);assert.equal(f.calls.length,1);
});
test('startup-bound entry cannot acquire a later actual session',async t=>{
  const f=await entryFixture(t,{restore:false}),e=f.create();t.after(()=>e.dispose());await e.start();await f.runtime.restore();await e.start();
  assert.equal(e.getSnapshot().phase,'ended');assert.equal(e.getSnapshot().controller,null);assert.equal(f.calls.length,1);
});
test('reentrant and repeated starts share one controller; StrictMode stop/start retires the old controller',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());let nested;
  e.subscribe(()=>{if(e.getSnapshot().phase==='active'&&!nested)nested=e.start();});
  const read=e.start();assert.equal(e.start(),read);await read;await nested;const a=e.getSnapshot().controller;
  e.stop();assert.equal(a.getSnapshot().view,null);assert.equal(a.getSnapshot().phase,'ended');
  await e.start();assert.notEqual(e.getSnapshot().controller,a);assert.equal(f.calls.length,3);
});
test('actual navigator list/detail/Back keeps one started controller and direct-detail Back falls back to Orders',async t=>{
  for(const initial of ['/orders','/orders/'+purchaseId]){
    const f=await entryFixture(t,{initial}),e=f.create();t.after(()=>e.dispose());await e.start();const c=e.getSnapshot().controller;
    if(initial==='/orders')f.navigation.navigate({name:'order',orderId:purchaseId});
    assert.equal(e.getSnapshot().controller,c);assert.equal(e.getSnapshot().route.orderId,purchaseId);
    const rendered=e.getSnapshot();f.actions(e).back(rendered);
    assert.equal(f.navigation.getSnapshot(),'/orders');assert.equal(e.getSnapshot().controller,c);assert.equal(f.calls.length,2);
  }
});

test('view-object replacement alone preserves entry identity while an explicit read uses actual current context',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());
  await e.start();const before=e.getSnapshot(),controller=before.controller;
  f.runtime.cookie._view={...f.runtime.cookie._view};
  assert.equal(e.getSnapshot(),before);assert.equal(controller.getSnapshot().view,null);
  await controller.load();assert.equal(controller.getSnapshot().phase,'ready');
  assert.equal(controller.getSnapshot().view.revision,17);assert.equal(e.getSnapshot().controller,controller);
});

test('complete empty, unavailable and denied results never turn into another recorded purchase',async t=>{
  for(const status of [200,404,403]){
    const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());
    f.response(()=>Response.json(status===200?{schemaVersion:1,revision:18,purchases:[],returns:[]}:{code:status===403?'forbidden':'not_found'},{status}));
    await e.start();const state=e.getSnapshot(),consumer=state.controller?.getSnapshot();
    if(status===200){assert.equal(consumer.phase,'ready');assert.deepEqual(consumer.view.purchases,[]);}
    if(status===404){assert.equal(consumer.phase,'unavailable');assert.equal(consumer.error,404);assert.equal(consumer.view,null);}
    if(status===403){assert.equal(consumer?.view??null,null);assert.notEqual(consumer?.phase,'ready');}
    const before=f.navigation.getSnapshot();f.actions(e).open(state,purchaseId);assert.equal(f.navigation.getSnapshot(),before);
  }
});

test('actual strict Root mapping refuses a private key and never falls back to an empty success',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());
  f.response(()=>Response.json({schemaVersion:1,revision:18,purchases:[],returns:[],privateNotes:'PRIVATE-should-not-return'}));
  await e.start();const state=e.getSnapshot();
  assert.equal(state.controller.getSnapshot().phase,'unavailable');assert.equal(state.controller.getSnapshot().view,null);
  assert.equal(f.calls.filter(c=>c.url==='/api/client/client-orders').length,1);
  assert.ok(f.calls.every(c=>c.url==='/api/client/session'||c.url==='/api/client/client-orders'));
});

test('selection comes from the exact own collection; missing and ambiguous IDs cannot navigate',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());await e.start();
  const foreign='44444444-4444-4444-8444-444444444444';
  f.actions(e).open(e.getSnapshot(),foreign);assert.equal(f.navigation.getSnapshot(),'/orders');
  const row=e.getSnapshot().controller.getSnapshot().view.purchases[0];
  f.response(()=>Response.json({schemaVersion:1,revision:19,purchases:[row,{...row}],returns:[]}));
  await e.getSnapshot().controller.load();f.actions(e).open(e.getSnapshot(),purchaseId);
  assert.equal(f.navigation.getSnapshot(),'/orders');
});

test('normal actual restore with equal session metadata before first start preserves the eligible entry',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());
  const boundary=f.runtime.getSnapshot().boundary,view=f.runtime.cookie._view;
  await f.runtime.restore();assert.equal(f.runtime.getSnapshot().boundary,boundary);assert.notEqual(f.runtime.cookie._view,view);
  await e.start();assert.equal(e.getSnapshot().phase,'active');
  assert.equal(e.getSnapshot().controller.getSnapshot().view.revision,17);
  assert.equal(f.calls.filter(c=>c.url==='/api/client/client-orders').length,1);
});

test('offline then actual same-session restore requires a fresh controller/read and rejects old callbacks',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());await e.start();
  const rendered=e.getSnapshot(),old=rendered.controller,boundary=f.runtime.getSnapshot().boundary;
  f.runtime.cookie.suspend();assert.equal(e.getSnapshot().phase,'inactive');assert.equal(old.getSnapshot().view,null);
  await f.runtime.restore();assert.equal(f.runtime.getSnapshot().boundary,boundary);
  f.response(()=>Response.json({schemaVersion:1,revision:21,purchases:[],returns:[]}));await e.start();
  const current=e.getSnapshot();assert.equal(current.phase,'active');assert.notEqual(current.controller,old);
  assert.equal(current.controller.getSnapshot().view.revision,21);
  f.actions(e).open(rendered,purchaseId);f.actions(e).back(rendered);assert.equal(e.getSnapshot(),current);
  assert.equal(f.navigation.getSnapshot(),'/orders');
});

for(const changed of ['csrf','ownerId','generation'])test('actual restore changing '+changed+' retires the captured entry',async t=>{
  const f=await entryFixture(t),e=f.create();t.after(()=>e.dispose());await e.start();const rendered=e.getSnapshot(),old=rendered.controller;
  f.login({[changed]:changed==='generation'?2:changed==='csrf'?'SYNTHETIC-new-csrf':'22222222-2222-4222-8222-222222222222'});
  await f.runtime.restore();assert.equal(e.getSnapshot().phase,'ended');assert.equal(old.getSnapshot().view,null);
  const calls=f.calls.length;await e.start();assert.equal(f.calls.length,calls);f.actions(e).open(rendered,purchaseId);assert.equal(f.navigation.getSnapshot(),'/orders');
});
