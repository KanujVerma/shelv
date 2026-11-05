// HISTORICAL unregistered constructor controls: exact immutable556 source, not current registry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {recordedView,purchaseId,other,historical as actual,command} from './rebuild-client-orders-fixture.mjs';
import {selectClientPurchase,recordedPurchaseTotalCents,formatRecordedCents,returnStatusLabel,returnConditionLabel} from '../src/features/orders/read/model.ts';

globalThis.fetch=async()=>{throw Error('external network denied for Orders consumer');};

test('detail selection uses only one exact purchase in the own recorded collection',()=>{
  const view=recordedView();
  assert.equal(selectClientPurchase(view,purchaseId),view.purchases[0]);
  assert.equal(selectClientPurchase(view,other),null);
  assert.equal(selectClientPurchase({...view,purchases:[]},purchaseId),null);
  assert.equal(selectClientPurchase({...view,purchases:[...view.purchases,...view.purchases]},purchaseId),null);
  assert.equal(selectClientPurchase(view,'recorded-product'),null);
});
test('recorded total uses quantity, unit amount, recorded tax and recorded shipping only',()=>{
  assert.equal(recordedPurchaseTotalCents(recordedView().purchases[0]),3041);
  assert.equal(formatRecordedCents(3041),'30.41');
  assert.equal(formatRecordedCents(0),'0.00');
  assert.equal(formatRecordedCents(null),'not provided');
});
for(const patch of [{quantity:0},{quantity:-1},{quantity:0.5},{unitPriceCents:-1},{taxCents:NaN},{shippingCents:Infinity},{unitPriceCents:Number.MAX_SAFE_INTEGER},{quantity:Number.MAX_SAFE_INTEGER}]) {
  test('unsafe or overflowing recorded arithmetic stays unknown: '+JSON.stringify(patch),()=>{
    assert.equal(recordedPurchaseTotalCents({...recordedView().purchases[0],...patch}),null);
  });
}
for(const cents of [-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])test('invalid recorded amount is not rounded or represented as zero: '+cents,()=>{
  assert.equal(formatRecordedCents(cents),'not provided');
});
test('return labels distinguish retailer funds from client repayment and preserve condition',()=>{
  assert.equal(returnStatusLabel('retailer_funds_received'),'retailer funds receipt recorded');
  assert.equal(returnStatusLabel('client_repaid'),'client repayment recorded');
  assert.equal(returnStatusLabel('requested'),'return help requested');
  assert.equal(returnConditionLabel('used'),'used');
});

// These tests use the physical retained registry. It has no client-orders entry.
// No positive port/authority/registry is substituted to make a read succeed.
async function consumer() {
  const {createClientOrdersReadController}=await import('../src/features/orders/read/controller.ts');
  const {createClientOrdersReadPort}=await import('../src/app/client-orders-read-request.ts');
  return {createClientOrdersReadController,createClientOrdersReadPort};
}
test('actual construction, snapshots, subscription and disposal remain request-inert',async t=>{
  const f=await actual(t),{createClientOrdersReadController}=await consumer();
  const c=createClientOrdersReadController(f.runtime),count=f.calls.length,stop=c.subscribe(()=>{});
  assert.equal(c.getSnapshot().phase,'idle');assert.equal(c.getSnapshot().view,null);
  assert.equal(f.calls.length,count);stop();c.dispose();
  assert.equal(c.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().view,null);
  await c.load();assert.equal(f.calls.length,count);
});
test('the real unregistered channel is unavailable rather than an empty successful Orders read',async t=>{
  const f=await actual(t),{createClientOrdersReadController,createClientOrdersReadPort}=await consumer();
  const c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());
  await assert.rejects(createClientOrdersReadPort(f.runtime).execute(command),e=>e.status===503);
  await c.load();assert.equal(c.getSnapshot().phase,'unavailable');
  assert.equal(c.getSnapshot().error,503);assert.equal(c.getSnapshot().view,null);
  assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls.length,1);
});
for(const input of [{...command,clientId:other},{...command,ownerId:other},{...command,role:'client'}, {...command,url:'/api/client/operations'}, {schemaVersion:1,action:'request_return'}, {...command,schemaVersion:2}])test('strict Root command rejects selectors or another action before registry lookup: '+JSON.stringify(input),async t=>{
  const f=await actual(t),{createClientOrdersReadPort}=await consumer();
  await assert.rejects(createClientOrdersReadPort(f.runtime).execute(input),e=>e.status===400);
  assert.equal(f.calls.length,1);
});
test('preaborted and denied local applicability cannot fetch or certify records',async t=>{
  const f=await actual(t),{createClientOrdersReadPort}=await consumer(),p=createClientOrdersReadPort(f.runtime);
  const abort=new AbortController();abort.abort();
  await assert.rejects(p.execute(command,{signal:abort.signal}),e=>e.status===503);
  await assert.rejects(p.execute(command,{isApplicable:()=>false}),e=>e.status===503);
  await assert.rejects(p.execute(command,{isApplicable:()=>{throw Error('local denial');}}),e=>e.status===503);
  assert.equal(f.calls.length,1);
});
for(const loss of ['owner','role','view','session','offline','dispose','route'])test('actual '+loss+' loss leaves no private view and no late request',async t=>{
  const f=await actual(t),{createClientOrdersReadController}=await consumer();let applicable=true;
  const c=createClientOrdersReadController(f.runtime,{isApplicable:()=>applicable});t.after(()=>c.dispose());
  await c.load();
  if(loss==='owner'){f.setLogin({ownerId:other});await f.runtime.restore();}
  if(loss==='role')f.runtime.cookie.identity.role='advisor';
  if(loss==='view')f.runtime.cookie._view.capabilities.view=false;
  if(loss==='session')f.runtime.cookie._end();
  if(loss==='offline')f.runtime.cookie.suspend();
  if(loss==='dispose')c.dispose();
  if(loss==='route')applicable=false;
  const n=f.calls.length;await c.load();assert.equal(c.getSnapshot().view,null);
  assert.notEqual(c.getSnapshot().phase,'ready');assert.equal(f.calls.length,n);
});
test('throwing and reentrant observers cannot prevent private-state retirement',async t=>{
  const f=await actual(t),{createClientOrdersReadController}=await consumer(),c=createClientOrdersReadController(f.runtime);
  let later=0;c.subscribe(()=>{throw Error('synthetic observer failure');});
  c.subscribe(()=>{later++;c.dispose();void c.load();});
  await c.load();assert.ok(later>0);assert.equal(c.getSnapshot().phase,'ended');
  assert.equal(c.getSnapshot().view,null);assert.equal(f.calls.length,1);
});
test('applicability may inspect a snapshot without recursively starting a load',async t=>{
  const f=await actual(t),{createClientOrdersReadController}=await consumer();let c,enabled=false;
  c=createClientOrdersReadController(f.runtime,{isApplicable:()=>{
    if(enabled){assert.equal(c.getSnapshot().view,null);void c.load();}return true;
  }});t.after(()=>c.dispose());enabled=true;
  await c.load();assert.equal(c.getSnapshot().phase,'unavailable');assert.equal(f.calls.length,1);
});
test('cleanup callbacks see cleared terminal state and cannot revive the disposed controller',async t=>{
  const f=await actual(t),{createClientOrdersReadController}=await consumer();
  const subscribe=f.runtime.subscribe;let c,cleaned=0;
  f.runtime.subscribe=fn=>{const stop=subscribe(fn);return()=>{
    cleaned++;assert.equal(c.getSnapshot().view,null);void c.load();stop();throw Error('synthetic cleanup failure');
  };};
  c=createClientOrdersReadController(f.runtime);await c.load();c.dispose();c.dispose();
  assert.equal(cleaned,1);assert.equal(c.getSnapshot().phase,'ended');assert.equal(f.calls.length,1);
});
test('option capture cannot continue after replacing the actual session',async t=>{
  const f=await actual(t),{createClientOrdersReadPort}=await consumer();
  await assert.rejects(createClientOrdersReadPort(f.runtime).execute(command,{get signal(){f.runtime.cookie._end();return undefined;}}),e=>e.status===401);
  assert.equal(f.calls.length,1);
});
test('repeated unavailable snapshots are referentially stable while the real cookie is offline',async t=>{
  const f=await actual(t),{createClientOrdersReadController}=await consumer(),c=createClientOrdersReadController(f.runtime);
  t.after(()=>c.dispose());await c.load();f.runtime.cookie.suspend();
  const first=c.getSnapshot();assert.equal(first.view,null);assert.equal(first.phase,'unavailable');
  for(let i=0;i<10;i++)assert.equal(c.getSnapshot(),first);
  assert.equal(f.calls.length,1);
});
test('caller relevance suspension cannot pass a merely-current ApplicationSession boundary',async t=>{
  const f=await actual(t),{createClientOrdersReadController}=await consumer();let enabled=false;
  const c=createClientOrdersReadController(f.runtime,{isApplicable:()=>{if(enabled)f.runtime.cookie.suspend();return true;}});
  t.after(()=>c.dispose());enabled=true;await c.load();
  assert.equal(f.runtime.getSnapshot().boundary.isCurrent(),true);
  assert.equal(f.runtime.cookie.status,'offline');assert.equal(c.getSnapshot().view,null);
  assert.equal(c.getSnapshot().phase,'unavailable');assert.equal(f.calls.length,1);
});
