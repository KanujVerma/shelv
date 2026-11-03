import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,retainHistoricalClaim,intentKey,deferred,receiptHash,id,owner,instant} from './w5-orders-commerce-cu-fixtures.mjs';

for(const action of ['status','projection'])for(const status of [401,403])test(`CU1 current ${action} READ${status} retires private views but preserves exact historical wire/hash in owning ApplicationSession`,async t=>{
 const f=await setup(t,{accepted:true}),expected=await retainHistoricalClaim(f),c=f.create('restored');t.after(()=>c.dispose());
 await c.refresh();await c.open(f.entity);
 f.request.override=async command=>command.action===(action==='status'?'request_status_v1':'read_commerce_v1')?Response.json({code:'forbidden'},{status}):undefined;
 if(action==='status')await c.checkStatus();else await c.refresh();
 assert.equal(f.boundary.isCurrent(),true);assert.equal(c.getSnapshot().selection,null);assert.equal(c.getSnapshot().index,null);
 const stored=f.boundary.memory.get(intentKey);assert.ok(stored,'denied read erased original dispatched intent');assert.equal(stored.rawWire,expected.rawWire);assert.equal(stored.commandHash,expected.commandHash);assert.deepEqual(stored.command,expected.command);
 c.dispose();const next=f.create('same-owning-session');t.after(()=>next.dispose());assert.deepEqual(next.getSnapshot().pending.command,expected.command);
 assert.equal(next.getSnapshot().pending.rawWire,expected.rawWire);assert.equal(next.getSnapshot().pending.commandHash,expected.commandHash);
});
test('CU1 actual owning ApplicationSession disposal clears intent and cannot expose it to replacement owner',async t=>{
 const f=await setup(t);await retainHistoricalClaim(f);f.runtime.dispose();assert.equal(f.boundary.memory.get(intentKey),undefined);assert.equal(f.c.getSnapshot().pending,null);assert.equal(f.c.getSnapshot().index,null);
});
for(const operation of ['close','refresh'])test(`CU2 ${operation} during actual receipt command hash cancels UNSENT continuation with zero egress and no false uncertainty`,async t=>{
 const f=await setup(t,{purchase:true});const write=f.c.reportReceived({state:'unknown'});const changing=operation==='close'?f.c.close():f.c.refresh();await Promise.all([write,changing]);
 assert.equal(f.calls.filter(c=>c.action==='confirm_product_received_v1').length,0);assert.equal(f.c.getSnapshot().pending,null);assert.equal(f.boundary.memory.get(intentKey),undefined);
});
test('CU2 changing selection after controller hashing but during actual port hashing still prevents raw egress',async t=>{
 const f=await setup(t,{purchase:true});let c;
 const wrapped={availability:f.port.availability,execute(command,options){const response=f.port.execute(command,options);if(command.action==='confirm_product_received_v1')c.close();return response;}};
 c=f.create('port-await-window',wrapped);t.after(()=>c.dispose());await c.refresh();await c.open(f.entity);await c.reportReceived({state:'unknown'});
 assert.equal(f.calls.filter(x=>x.action==='confirm_product_received_v1').length,0);assert.equal(c.getSnapshot().pending,null);assert.equal(f.boundary.memory.get(intentKey),undefined);
});
test('CU2 normal receipt hashing dispatches through actual port, stores exact raw wire/hash, and remains separate from Start',async t=>{
 const f=await setup(t,{purchase:true});await f.c.reportReceived({state:'unknown'});
 const command=f.calls.find(c=>c.action==='confirm_product_received_v1');assert.ok(command);assert.equal(command.expectedFulfillmentRevision,f.detail.fulfillmentRevision);
 const pending=f.c.getSnapshot().pending;assert.equal(pending.phase,'uncertain');assert.equal(pending.dispatched,true);assert.equal(pending.rawWire,JSON.stringify(command));assert.equal(pending.commandHash,await receiptHash(command));assert.deepEqual(f.boundary.memory.get(intentKey),pending);assert.equal(f.calls.some(c=>/start|care|use/.test(c.action)),false);
});
test('CU2 close AFTER raw egress preserves the exact dispatched uncertain receipt request for remount',async t=>{
 const f=await setup(t,{purchase:true}),entered=deferred(),reply=deferred();f.request.override=async command=>{if(command.action==='confirm_product_received_v1'){entered.resolve();return reply.promise;}};
 const write=f.c.reportReceived({state:'unknown'});await entered.promise;f.c.close();reply.resolve(Response.json({code:'uncertain'},{status:503}));await write;
 const original=f.calls.find(c=>c.action==='confirm_product_received_v1'),stored=f.boundary.memory.get(intentKey);assert.deepEqual(stored.command,original);assert.equal(stored.rawWire,JSON.stringify(original));assert.equal(stored.dispatched,true);
 f.c.dispose();const next=f.create('dispatched-recovery');t.after(()=>next.dispose());assert.deepEqual(next.getSnapshot().pending.command,original);
});
for(const kind of ['acceptance','claim'])test(`CU3 old target missing currency blocks new ${kind} before any write`,async t=>{
 const f=await setup(t,{accepted:kind==='claim'});delete f.q.header.currency;delete f.c.getSnapshot().selection.quote.header.currency;assert.equal('currency'in f.q.header,false);f.c.reviewQuote();if(kind==='claim')await f.c.claimPayment(f.q.options[0].id);else await f.c.acceptQuote();
 assert.equal(f.calls.some(c=>c.action==='accept_product_quote_v1'||c.action==='submit_payment_claim_v1'),false);assert.equal(f.c.getSnapshot().pending,null);
});
test('retired return basis blocks source write instead of guessing purchase revision9 for service-head23',async t=>{
 const f=await setup(t,{purchase:true});assert.equal(f.detail.revision,9);assert.equal(f.c.getSnapshot().selection.snapshot.serviceRevision,23);
 f.c.close();await f.c.requestReturn({quantity:1,condition:'unopened',reason:'Actual item differs'});assert.equal(f.calls.some(c=>c.action==='request_product_return_v1'),false);
});
test('CU3 direct available port requires complete new claim basis, while exact recorded recovery stays possible',async t=>{
 const f=await setup(t,{accepted:true}),intent=await retainHistoricalClaim(f);f.boundary.memory.delete(intentKey);
 await assert.rejects(f.port.execute(intent.command),e=>e.status===503&&e.dispatched===false);assert.equal(f.calls.some(c=>c.action==='submit_payment_claim_v1'),false);
 f.boundary.memory.set(intentKey,intent);await assert.rejects(f.port.execute(intent.command),e=>e.status===503&&e.dispatched===true);assert.equal(f.wire.at(-1),intent.rawWire);
});
test('CU1 current status503 and a matching-hash wrong-kind receipt preserve exact original request',async t=>{
 const f=await setup(t),{retainHistoricalAcceptance}=await import('./w5-orders-commerce-cu-fixtures.mjs'),expected=await retainHistoricalAcceptance(f),c=f.create('lookup-controls');t.after(()=>c.dispose());
 await c.checkStatus();assert.deepEqual(c.getSnapshot().pending.command,expected.command);assert.equal(c.getSnapshot().pending.status,'failed');
 f.request.override=async command=>command.action==='request_status_v1'?Response.json({status:'committed',receipt:{schemaVersion:1,requestId:expected.command.requestId,commandHash:expected.commandHash,action:'confirm_product_received_v1',clientId:owner,entity:{kind:'event',id:id(999),revision:1},subject:{kind:'purchase',id:id(4)},quote:null,lineId:null,revision:1,recordedBy:owner,recordedAt:instant,paymentBasis:null,payment:null}}):undefined;
 await c.checkStatus();assert.equal(c.getSnapshot().pending.status,'failed');assert.equal(c.getSnapshot().pending.rawWire,expected.rawWire);assert.equal(f.boundary.memory.get(intentKey).commandHash,expected.commandHash);
});
test('CU1 stale403 cannot retire a newer readable view or replace its retained intent',async t=>{
 const f=await setup(t),expected=await retainHistoricalClaim(f),c=f.create('stale-read'),d=deferred();t.after(()=>c.dispose());let first=true;
 f.request.override=async command=>{if(command.action==='read_commerce_v1'&&first){first=false;return d.promise;}};
 const old=c.refresh();await c.refresh();await c.open(f.entity);d.resolve(Response.json({code:'forbidden'},{status:403}));await old;
 assert.equal(c.getSnapshot().phase,'ready');assert.ok(c.getSnapshot().selection);assert.equal(c.getSnapshot().pending.rawWire,expected.rawWire);
});
test('CU1 denied private view renders only recovery status, never pending private form or frozen payment details',async t=>{
 const f=await setup(t,{purchase:true}),{renderSource}=await import('./w5-orders-commerce-cu-fixtures.mjs');
 const command={schemaVersion:1,action:'request_product_return_v1',requestId:id(902),purchaseId:f.detail.id,expectedReturnRevision:23,quantity:1,condition:'unopened',reason:'PRIVATE_CU_FORM_TEXT'};
 f.boundary.memory.set(intentKey,{command,phase:'uncertain',status:'unchecked',dispatched:true,rawWire:JSON.stringify(command),commandHash:await receiptHash(command)});
 const c=f.create('private-recovery');t.after(()=>c.dispose());await c.refresh();await c.open(f.entity);
 f.request.override=async q=>q.action==='request_status_v1'?Response.json({code:'forbidden'},{status:403}):undefined;await c.checkStatus();
 const html=await renderSource(c.getSnapshot(),c);assert.match(html,/request result uncertain/);assert.doesNotMatch(html,/PRIVATE_CU_FORM_TEXT|Exact Product|10 Example St|receiving@example|1000 cents/);assert.equal(c.getSnapshot().selection,null);
});
test('CU1 exact historical retry after denied status uses original wire and payment revision despite a newer read clock',async t=>{
 const f=await setup(t,{accepted:true}),expected=await retainHistoricalClaim(f),c=f.create('exact-retry');t.after(()=>c.dispose());
 f.request.override=async q=>q.action==='request_status_v1'?Response.json({code:'forbidden'},{status:403}):undefined;await c.checkStatus();
 f.request.snapshot={...f.request.snapshot,paymentRevision:18,serviceRevision:24,revision:32,hash:'f'.repeat(64)};await c.refresh();await c.open(f.entity);assert.equal(c.getSnapshot().selection.snapshot.paymentRevision,18);
 await c.retryIntent();assert.equal(f.wire.at(-1),expected.rawWire);assert.equal(f.calls.at(-1).expectedPaymentRevision,17);assert.equal(c.getSnapshot().pending.command.requestId,expected.command.requestId);
});
test('CU2 actual dispose during unsent hash cancels work without leaving recoverable business intent',async t=>{
 const f=await setup(t,{purchase:true}),p=f.c.reportReceived({state:'unknown'});f.c.dispose();await p;
 assert.equal(f.calls.some(x=>x.action==='confirm_product_received_v1'),false);assert.equal(f.boundary.memory.get(intentKey),undefined);assert.equal(f.c.getSnapshot().selection,null);
});
test('CU2 dispose AFTER dispatch preserves exact memory custody while clearing all readable snapshots',async t=>{
 const f=await setup(t,{purchase:true}),entered=deferred(),reply=deferred();f.request.override=async command=>{if(command.action==='confirm_product_received_v1'){entered.resolve();return reply.promise;}};
 const p=f.c.reportReceived({state:'unknown'});await entered.promise;const expected=structuredClone(f.boundary.memory.get(intentKey));f.c.dispose();reply.resolve(Response.json({code:'uncertain'},{status:503}));await p;
 assert.equal(f.c.getSnapshot().index,null);assert.equal(f.c.getSnapshot().selection,null);assert.equal(f.c.getSnapshot().pending,null);
 const c=f.create('disposed-dispatch');t.after(()=>c.dispose());assert.equal(c.getSnapshot().pending.rawWire,expected.rawWire);assert.equal(c.getSnapshot().pending.commandHash,expected.commandHash);
});
test('CU3 matching historical receipt plus a newer service clock cannot authorize a new currency-less acceptance',async t=>{
 const f=await setup(t),{retainHistoricalAcceptance}=await import('./w5-orders-commerce-cu-fixtures.mjs'),expected=await retainHistoricalAcceptance(f),c=f.create('receipt-is-not-authority');t.after(()=>c.dispose());
 f.request.snapshot={...f.request.snapshot,serviceRevision:24,revision:32,hash:'f'.repeat(64)};
 f.request.override=async command=>command.action==='request_status_v1'?Response.json({status:'committed',receipt:{schemaVersion:1,requestId:expected.command.requestId,commandHash:expected.commandHash,action:'accept_product_quote_v1',clientId:owner,entity:{kind:'quote_acceptance',id:id(998),revision:1},subject:{kind:'quote',id:f.entity.id},quote:expected.command.quote,lineId:null,revision:1,recordedBy:owner,recordedAt:instant,paymentBasis:null,payment:null}}):undefined;
 await c.checkStatus();assert.equal(c.getSnapshot().pending,null);assert.equal(f.boundary.memory.get(intentKey),undefined);await c.refresh();await c.open(f.entity);assert.equal(c.getSnapshot().selection.snapshot.serviceRevision,24);delete c.getSnapshot().selection.quote.header.currency;c.reviewQuote();await c.acceptQuote();
 assert.equal(f.calls.some(x=>x.action==='accept_product_quote_v1'),false);assert.equal(c.getSnapshot().reviewed,true);
});
test('CU3 actual shared review sheet disables consequential acceptance and displays unavailable currency',async t=>{
 const f=await setup(t),{renderSource}=await import('./w5-orders-commerce-cu-fixtures.mjs');delete f.c.getSnapshot().selection.quote.header.currency;f.c.reviewQuote();const html=await renderSource(f.c.getSnapshot(),f.c,'review');
 assert.match(html,/currency unavailable/);assert.match(html,/<button[^>]*disabled[^>]*>accept this quote<\/button>/);assert.doesNotMatch(html,/currency: USD/);
});
test('CU1 delayed403 from an invalidated owner cannot retire the next actual ApplicationSession owner view',async t=>{
 const f=await setup(t),reply=deferred();await retainHistoricalClaim(f);f.request.override=async q=>q.action==='read_commerce_v1'?reply.promise:undefined;
 const old=f.c.refresh();f.runtime.dispose();
 const {createApplicationSession}=await import('../src/app/session.ts'),{createCommercePort}=await import('../src/features/orders/port.ts'),{createOrdersController}=await import('../src/features/orders/controller.ts');
 const nextOwner=id(77),runtime=createApplicationSession({audience:'client',locks:{request:async(_k,o,fn)=>fn(o.signal)},fetcher:async url=>{assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:nextOwner,generation:8,capabilities:{view:true,edit:false,publish:false,confirmPayments:false},csrf:'CU-next-owner-synthetic',idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});}});t.after(()=>runtime.dispose());await runtime.restore();
 const boundary=runtime.getSnapshot().boundary,port=createCommercePort(runtime,{family:'commerce-v1',async execute(command){assert.equal(command.action,'read_commerce_v1');return Response.json({schemaVersion:1,clientId:nextOwner,snapshot:f.request.snapshot,entries:[],nextCursor:null}).json();}}),c=createOrdersController({port,session:boundary,ownerId:nextOwner,mode:'client',contextKey:'new-owner'});t.after(()=>c.dispose());await c.refresh();
 reply.resolve(Response.json({code:'forbidden'},{status:403}));await old;
 assert.equal(c.getSnapshot().phase,'empty');assert.ok(c.getSnapshot().index);assert.equal(c.getSnapshot().pending,null);assert.equal(boundary.memory.get(intentKey),undefined);assert.equal(f.boundary.memory.get(intentKey),undefined);
});
test('CU1 a later exact historical status receipt clears intent but cannot reopen a denied private projection',async t=>{
 const f=await setup(t),{retainHistoricalAcceptance}=await import('./w5-orders-commerce-cu-fixtures.mjs'),expected=await retainHistoricalAcceptance(f),c=f.create('denied-receipt');t.after(()=>c.dispose());await c.refresh();await c.open(f.entity);
 f.request.override=async q=>q.action==='request_status_v1'?Response.json({code:'forbidden'},{status:403}):undefined;await c.checkStatus();assert.equal(c.getSnapshot().phase,'denied');
 const reads=f.calls.filter(q=>q.action==='read_commerce_v1').length;
 f.request.override=async q=>q.action==='request_status_v1'?Response.json({status:'committed',receipt:{schemaVersion:1,requestId:expected.command.requestId,commandHash:expected.commandHash,action:'accept_product_quote_v1',clientId:owner,entity:{kind:'quote_acceptance',id:id(997),revision:1},subject:{kind:'quote',id:f.entity.id},quote:expected.command.quote,lineId:null,revision:1,recordedBy:owner,recordedAt:instant,paymentBasis:null,payment:null}}):undefined;
 await c.checkStatus();assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().phase,'denied');assert.equal(c.getSnapshot().selection,null);assert.equal(c.getSnapshot().index,null);assert.equal(f.calls.filter(q=>q.action==='read_commerce_v1').length,reads);
});
