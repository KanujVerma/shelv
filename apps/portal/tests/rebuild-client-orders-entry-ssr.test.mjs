// These include the original Application mount assertions. Until Parent supplies
// and admits its bounded mount, those assertions remain explicit open gates.
// Execution requires Parent's dependency and central heavy-slot grant.
// Source SSR is distinct from mounted React effects, browser and genuine Auth.
import test from 'node:test';
import assert from 'node:assert/strict';
import {entryFixture,ssrAPI,purchaseId,recordedView,connectedEntryFixture} from './rebuild-client-orders-entry-fixture.mjs';

for(const initial of ['/orders','/orders/'+purchaseId])test('actual Application '+initial+' SSR selects the inert Orders entry before clinical composition',async t=>{
  const f=await entryFixture(t,{initial}),api=await ssrAPI(),before=f.calls.length;
  const html=api.application({runtime:f.runtime,startup:Promise.resolve(),win:f.win});
  assert.match(html,/loading orders/);assert.doesNotMatch(html,/loading your plan|this page is not connected yet|Recorded Product|no recorded purchases/);
  assert.equal(f.calls.length,before);assert.equal(f.win.history.state,null);
  assert.equal((html.match(/id="portal-content"/g)??[]).length,1);
});
test('actual consumer JSX receives the started entry controller and honest unavailable result without duplicate headers',async t=>{
  const f=await entryFixture(t),api=await ssrAPI(),entry=api.createClientOrdersEntry(f.runtime,f.navigation);t.after(()=>entry.dispose());
  f.response(()=>Response.json({code:'not_found'},{status:404}));
  assert.match(api.entry(entry),/loading orders/);await entry.start();const before=f.calls.length;
  const html=api.entry(entry);assert.match(html,/data-client-orders="read-only"/);assert.match(html,/orders are unavailable/);
  assert.equal((html.match(/<h1/g)??[]).length,1);assert.equal(f.calls.length,before);
  assert.doesNotMatch(html,/no recorded purchases|Recorded Product|pay now|request return|not started/);
  entry.dispose();assert.doesNotMatch(api.entry(entry),/data-client-orders=|Recorded Product/);
});

test('registered source SSR renders the exact recorded purchase and return history with one header',async t=>{
  const f=await entryFixture(t),api=await ssrAPI(),entry=api.createClientOrdersEntry(f.runtime,f.navigation);t.after(()=>entry.dispose());
  const view=recordedView();view.purchases[0].deliveredOn='2026-10-31';
  view.returns=[{id:'55555555-5555-4555-8555-555555555555',purchaseId:purchaseId,quantity:1,reason:'Recorded reason',condition:'opened',status:'client_repaid',requestedAt:'2026-11-01T10:00:00Z',events:[
    {id:'66666666-6666-4666-8666-666666666666',status:'client_repaid',note:'Repayment recorded',expectedRefundCents:1234,retailerRefundCents:1200,clientRepaidCents:1200,policyCheckedOn:null,actorId:'11111111-1111-4111-8111-111111111111',recordedAt:'2026-11-02T11:00:00Z'}]}];
  f.response(()=>Response.json(view));await entry.start();const n=f.calls.length;
  const list=api.entry(entry);assert.match(list,/Recorded Product/);assert.match(list,/client repayment recorded/);assert.equal((list.match(/<h1/g)??[]).length,1);
  f.navigation.navigate({name:'order',orderId:purchaseId});const detail=api.entry(entry);
  for(const text of ['Recorded Product','Recorded Seller','Recorded conditions','2026-10-31','not provided','Repayment recorded','12.00'])assert.ok(detail.includes(text),text);
  assert.doesNotMatch(detail,/USD|\$|not started|pay now|request return|record start/);assert.equal(f.calls.length,n);
  entry.stop();const closed=api.entry(entry);assert.doesNotMatch(closed,/Recorded Product|Recorded Seller|Recorded conditions|Repayment recorded/);
});

test('registered source SSR distinguishes complete empty from missing own detail without selecting a sample',async t=>{
  const f=await entryFixture(t),api=await ssrAPI(),entry=api.createClientOrdersEntry(f.runtime,f.navigation);t.after(()=>entry.dispose());
  f.response(()=>Response.json({schemaVersion:1,revision:20,purchases:[],returns:[]}));await entry.start();
  assert.match(api.entry(entry),/no recorded purchases/);
  f.navigation.navigate({name:'order',orderId:purchaseId});const html=api.entry(entry);
  assert.match(html,/this purchase is unavailable/);assert.doesNotMatch(html,/Recorded Product|no recorded purchases/);
});
test('composed Account and frozen notification entry retain distinct source SSR routing',async t=>{
  const api=await ssrAPI();
  for(const [initial,expected] of [['/account',/loading account/],['/notifications',/loading notifications/]]){
    const f=await entryFixture(t,{initial}),before=f.calls.length;
    const html=api.application({runtime:f.runtime,startup:Promise.resolve(),win:f.win});assert.match(html,expected);
    assert.doesNotMatch(html,/loading orders/);assert.equal(f.calls.length,before);
  }
});

test('finite actual entry/cookie/gateway/serialized Vault/provider/Root producer chain reads own Orders only',async t=>{
  const f=await connectedEntryFixture(t),e=f.create();t.after(()=>e.dispose());assert.equal(f.requests.length,1);
  await e.start();const state=e.getSnapshot();assert.equal(state.controller.getSnapshot().phase,'ready');
  assert.equal(state.controller.getSnapshot().view.purchases[0].id,purchaseId);
  assert.equal(f.commands.filter(c=>c.type==='session.execute').length,1);
  assert.equal(f.upstream.filter(c=>c.path==='/rest/v1/rpc/concierge_client_orders_read_v1').length,2);
  assert.ok(f.upstream.every(c=>['/auth/v1/user','/rest/v1/rpc/concierge_client_session_context','/rest/v1/rpc/concierge_client_orders_read_v1'].includes(c.path)));
  assert.ok(f.record().credentials);assert.doesNotMatch(JSON.stringify(f.record().credentials),/SYNTHETIC-refresh|access_token/);
  f.actions(e).open(state,purchaseId);assert.equal(f.navigation.getSnapshot(),'/orders/'+purchaseId);
  f.actions(e).back(e.getSnapshot());assert.equal(f.navigation.getSnapshot(),'/orders');
  assert.equal(f.commands.filter(c=>c.type==='session.execute').length,1);
});
