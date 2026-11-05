// Synthetic recorded data and closed HTTP only. No server, real Auth, channel
// registration, successful operation port or authority/currentness replacement.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createApplicationSession as currentApplication} from '../src/app/session.ts';
import {historicalUnregisteredApplication} from './helpers/historical-unregistered-session.mjs';

export const actor = '11111111-1111-4111-8111-111111111111';
export const other = '22222222-2222-4222-8222-222222222222';
export const purchaseId = '33333333-3333-4333-8333-333333333333';
export const returnId = '44444444-4444-4444-8444-444444444444';
export const command = Object.freeze({schemaVersion:1, action:'read_client_orders_v1'});
export function recordedView() {
  return {schemaVersion:1, revision:17, purchases:[{
    id:purchaseId, quoteId:null, recommendationId:null,
    retailer:'Recorded Retailer', seller:'Recorded Seller', productId:'recorded-product',
    productName:'Recorded Product 10%', quantity:2, unitPriceCents:1234,
    taxCents:123, shippingCents:450, purchasedOn:'2026-10-29', deliveredOn:null,
    policy:{checkedOn:'2026-10-28', url:'https://example.com/saved-policy',
      summary:'Recorded item policy, subject to the saved conditions.',
      openedAllowed:null, finalSale:false, returnBy:null, shipBy:null, returnCostCents:250},
    recordedAt:'2026-10-30T12:00:00Z', recordedBy:actor,
  }], returns:[{
    id:returnId, purchaseId, quantity:1, reason:'The recorded item was damaged.',
    condition:'damaged', status:'retailer_funds_received', requestedAt:'2026-10-31T12:00:00Z',
    events:[{
      id:'55555555-5555-4555-8555-555555555555', status:'retailer_funds_received',
      note:'Retailer funds receipt recorded; client repayment is separate.',
      expectedRefundCents:1234, retailerRefundCents:1100, clientRepaidCents:null,
      policyCheckedOn:'2026-10-31', actorId:actor, recordedAt:'2026-11-01T12:00:00Z',
    }],
  }]};
}
export async function historical(t,options={}) {return actual(t,{...options,historicalUnregistered:true});}
export async function actual(t, {audience='client', restore=true, allowOrders=false, ordersResponse=()=>Response.json(recordedView()),historicalUnregistered=false}={}) {
  const createApplicationSession=historicalUnregistered?await historicalUnregisteredApplication():currentApplication;
  const broadcast=globalThis.BroadcastChannel;
  globalThis.BroadcastChannel=undefined;
  t.after(()=>{globalThis.BroadcastChannel=broadcast;});
  const calls=[];
  let login={signedIn:true, ownerId:actor, generation:1, csrf:'orders-synthetic-csrf',
    capabilities:{view:true, edit:false, publish:false, confirmPayments:false},
    idleExpiresAt:'2026-11-03T00:00:00Z', absoluteExpiresAt:'2026-11-04T00:00:00Z'};
  let status=200,respond=ordersResponse;
  const runtime=createApplicationSession({audience,
    now:()=>Date.parse('2026-11-02T12:00:00Z'),
    locks:{request:async(_name,_options,run)=>run()},
    fetcher:async(url,init)=>{
      calls.push({url,init});
      assert.equal(init.credentials,'same-origin'); assert.equal(init.cache,'no-store');
      assert.equal(init.redirect,'error');
      const headers=new Headers(init.headers);
      assert.equal(headers.has('authorization'),false); assert.equal(headers.has('apikey'),false);
      if(url===`/api/${audience}/client-orders`){
        assert.equal(allowOrders,true,'physical unregistered Orders cannot egress');
        assert.equal(audience,'client');assert.equal(init.method,'POST');
        assert.equal(headers.get('X-Shelv-CSRF'),login.csrf);
        assert.deepEqual(JSON.parse(init.body),command);
        return respond({url,init});
      }
      assert.equal(url,`/api/${audience}/session`,'unexpected HTTP denied');
      return Response.json(status===200?{...login,capabilities:{...login.capabilities}}:{code:'forbidden'},{status});
    }});
  t.after(()=>runtime.dispose());
  if(restore) await runtime.restore();
  return {runtime,calls,setLogin(value){login={...login,...value};},setStatus(value){status=value;},setOrdersResponse(value){respond=value;}};
}

/** Invoked only by the separately authorized ignored constructor projection.
 * Original physical-registry tests run intact in their own process. This suite
 * proves a finite source channel fixture, never Root channel/SQL admission. */
export function defineSyntheticOrdersTests() {
  const deferred=()=>{let enter,release;return {entered:new Promise(r=>enter=r),wait:new Promise(r=>release=r),enter:()=>enter(),release:()=>release()};};
  const consumer=async()=>({
    ...await import('../src/features/orders/read/controller.ts'),
    ...await import('../src/app/client-orders-read-request.ts'),
  });
  test('SYNTHETIC admission fixture: actual session, strict DTO and recorded return fields reach the controller',async t=>{
    const f=await actual(t,{allowOrders:true}),{createClientOrdersReadController}=await consumer();
    const c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());await c.load();
    const s=c.getSnapshot();assert.equal(s.phase,'ready');assert.equal(s.view.revision,17);
    assert.equal(s.view.purchases[0].productName,'Recorded Product 10%');
    assert.equal(s.view.purchases[0].deliveredOn,null);assert.equal(s.view.returns[0].status,'retailer_funds_received');
    assert.equal(s.view.returns[0].events[0].clientRepaidCents,null);
    assert.deepEqual(Object.keys(s.view).sort(),['purchases','returns','revision','schemaVersion']);
    assert.equal(Object.isFrozen(s.view),true);assert.equal(f.calls.length,2);
    assert.equal(c.getSnapshot(),s);
  });
  test('SYNTHETIC admission fixture: a complete empty read is distinct from unavailable',async t=>{
    const f=await actual(t,{allowOrders:true,ordersResponse:()=>Response.json({schemaVersion:1,revision:0,purchases:[],returns:[]})});
    const {createClientOrdersReadController}=await consumer(),c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());await c.load();
    assert.equal(c.getSnapshot().phase,'ready');assert.deepEqual(c.getSnapshot().view.purchases,[]);
    f.setOrdersResponse(()=>Response.json({code:'unavailable'},{status:503}));await c.load();
    assert.equal(c.getSnapshot().view,null);assert.equal(c.getSnapshot().phase,'unavailable');
  });
  for(const status of [400,401,403,404,409,413,415,429,503])test('SYNTHETIC admission fixture: received HTTP '+status+' retains its safe disposition',async t=>{
    const f=await actual(t,{allowOrders:true,ordersResponse:()=>Response.json({code:'unavailable'},{status})});
    const {createClientOrdersReadController}=await consumer(),c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());await c.load();
    const s=c.getSnapshot();assert.equal(s.view,null);assert.equal(s.error,status);
    assert.equal(s.phase,status===401?'ended':status===403?'denied':'unavailable');
    assert.equal(f.calls.length,2);
  });
  for(const status of [401,403])test('SYNTHETIC admission fixture: real received '+status+' survives failed body and lost relevance',async t=>{
    let applicable=true;
    const f=await actual(t,{allowOrders:true,ordersResponse:()=>{
      applicable=false;
      return new Response(new ReadableStream({start(controller){controller.error(Error('synthetic unreadable denial body'));}}),{status});
    }});
    const {createClientOrdersReadPort}=await consumer();
    await assert.rejects(createClientOrdersReadPort(f.runtime).execute(command,{isApplicable:()=>applicable}),e=>e.status===status);
    assert.equal(f.calls.length,2);
  });
  for(const patch of [{privateNotes:[]},{reviews:[]},{revision:1.5},{schemaVersion:2},{purchases:[],'care':{}}])test('SYNTHETIC admission fixture: strict result rejects extra/private or invalid fields '+JSON.stringify(patch),async t=>{
    const f=await actual(t,{allowOrders:true,ordersResponse:()=>Response.json({...recordedView(),...patch})});
    const {createClientOrdersReadController}=await consumer(),c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());await c.load();
    assert.equal(c.getSnapshot().view,null);assert.equal(c.getSnapshot().phase,'unavailable');assert.equal(c.getSnapshot().error,503);
  });
  test('SYNTHETIC admission fixture: superseded loads cannot replace the newer view, including old finally',async t=>{
    const held=deferred();let n=0;
    t.after(()=>held.release());
    const f=await actual(t,{allowOrders:true,ordersResponse:async()=>{
      if(++n===1){held.enter();await held.wait;return Response.json(recordedView());}
      const view=recordedView();view.revision=18;view.purchases[0].productName='Newer Recorded Product';return Response.json(view);
    }});
    const {createClientOrdersReadController}=await consumer(),c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());
    const first=c.load();await held.entered;await c.load();
    const current=c.getSnapshot();assert.equal(current.phase,'ready');assert.equal(current.view.revision,18);
    held.release();await first;assert.equal(c.getSnapshot(),current);assert.equal(f.calls.length,3);
  });
  for(const loss of ['owner','role','view','csrf','generation','epoch','offline','route','dispose'])test('SYNTHETIC admission fixture: pending '+loss+' loss refuses late private data',async t=>{
    const held=deferred();let applicable=true;
    const f=await actual(t,{allowOrders:true,ordersResponse:async()=>{held.enter();await held.wait;return Response.json(recordedView());}});
    const {createClientOrdersReadController}=await consumer(),c=createClientOrdersReadController(f.runtime,{isApplicable:()=>applicable});t.after(()=>c.dispose());
    const reading=c.load();await held.entered;
    if(loss==='owner'){f.setLogin({ownerId:other});await f.runtime.restore();}
    if(loss==='role')f.runtime.cookie.identity.role='advisor';
    if(loss==='view')f.runtime.cookie._view.capabilities.view=false;
    if(loss==='csrf')f.runtime.cookie._view.csrf='changed-synthetic-csrf';
    if(loss==='generation')f.runtime.cookie._view.generation++;
    if(loss==='epoch')f.runtime.cookie._epoch++;
    if(loss==='offline')f.runtime.cookie.suspend();
    if(loss==='route')applicable=false;
    if(loss==='dispose')c.dispose();
    held.release();await reading;
    assert.equal(c.getSnapshot().view,null);assert.notEqual(c.getSnapshot().phase,'ready');
  });
  for(const loss of ['offline','view','abort','applicability'])test('SYNTHETIC admission fixture: signal cleanup '+loss+' is fenced before the final private return',async t=>{
    const f=await actual(t,{allowOrders:true}),{createClientOrdersReadPort}=await consumer();
    const abort=new AbortController(),remove=abort.signal.removeEventListener.bind(abort.signal);let applies=true;
    abort.signal.removeEventListener=(...args)=>{
      remove(...args);
      if(loss==='offline')f.runtime.cookie.suspend();
      if(loss==='view')f.runtime.cookie._view.capabilities.view=false;
      if(loss==='abort')abort.abort();
      if(loss==='applicability')applies=false;
    };
    // Parent-approved successor: a local callback refusal is 503, including VIEW
    // loss. It is not a received HTTP403. Original32/33 raw/fixture are retained.
    await assert.rejects(createClientOrdersReadPort(f.runtime).execute(command,{signal:abort.signal,isApplicable:()=>applies}),e=>e.status===503);
    if(loss==='offline')assert.equal(f.runtime.getSnapshot().boundary.isCurrent(),true);
    assert.equal(f.calls.length,2);
  });
  test('SYNTHETIC admission fixture: loaded private state clears before throwing retirement observers',async t=>{
    const f=await actual(t,{allowOrders:true}),{createClientOrdersReadController}=await consumer();
    const c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());await c.load();
    assert.equal(c.getSnapshot().phase,'ready');let retired=0;
    c.subscribe(()=>{throw Error('synthetic subscriber failure');});
    c.subscribe(()=>{if(c.getSnapshot().view===null)retired++;});
    f.runtime.cookie._end();assert.equal(c.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().view,null);assert.ok(retired>0);
  });
  test('SYNTHETIC admission fixture: old controller disposal cannot clear a newer controller read',async t=>{
    const f=await actual(t,{allowOrders:true}),{createClientOrdersReadController}=await consumer();
    const old=createClientOrdersReadController(f.runtime),current=createClientOrdersReadController(f.runtime);
    t.after(()=>{old.dispose();current.dispose();});await old.load();await current.load();
    const s=current.getSnapshot();assert.equal(s.phase,'ready');old.dispose();await old.load();
    assert.equal(current.getSnapshot(),s);assert.equal(f.calls.length,3);
  });
  test('SYNTHETIC admission fixture: malformed native JSON cannot become an empty success',async t=>{
    const f=await actual(t,{allowOrders:true,ordersResponse:()=>new Response('{not JSON}',{headers:{'Content-Type':'application/json'}})});
    const {createClientOrdersReadController}=await consumer(),c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());await c.load();
    assert.equal(c.getSnapshot().phase,'unavailable');assert.equal(c.getSnapshot().view,null);
  });
  function history(size) {
    const sample=recordedView().purchases[0];
    return {schemaVersion:1,revision:19,purchases:Array.from({length:size},(_,i)=>({...sample,
      id:`00000000-0000-4000-8000-${(i+1).toString(16).padStart(12,'0')}`,
      policy:{...sample.policy,summary:'recorded conditions '.repeat(100)}})),returns:[]};
  }
  // Parent pins the successor producer cap at the existing gateway 2,000,000.
  // Raw 504e's 100,000-byte refusal is preserved separately, never called green.
  test('SYNTHETIC admission fixture: complete recorded history above old100k fits the approved2m wire',async t=>{
    const data=history(100),bytes=new TextEncoder().encode(JSON.stringify(data)).byteLength;
    assert.ok(bytes>100000&&bytes<2000000);
    const f=await actual(t,{allowOrders:true,ordersResponse:()=>Response.json(data)});
    const {createClientOrdersReadController}=await consumer(),c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());await c.load();
    assert.equal(c.getSnapshot().phase,'ready');assert.equal(c.getSnapshot().view.purchases.length,100);
  });
  test('SYNTHETIC admission fixture: a whole history above2m is unavailable, never truncated into completeness',async t=>{
    const data=history(1000);assert.ok(new TextEncoder().encode(JSON.stringify(data)).byteLength>2000000);
    const f=await actual(t,{allowOrders:true,ordersResponse:()=>Response.json(data)});
    const {createClientOrdersReadController}=await consumer(),c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());await c.load();
    assert.equal(c.getSnapshot().phase,'unavailable');assert.equal(c.getSnapshot().view,null);
  });
}
