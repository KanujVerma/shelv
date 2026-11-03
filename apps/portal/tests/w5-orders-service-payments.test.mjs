import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,view,receipt,deferred,quoteId,optionId,claimId} from './w5-orders-service-payments-helper.mjs';
async function controller(t,f){
 let module;try{module=await import('../src/features/payments/controller.ts');}catch(e){assert.fail('service-payment controller is missing: '+e.code);}
 const c=module.createClientPaymentsController(f.runtime,f.ports);t.after(()=>c.dispose());return c;
}
test('first service quote is read through actual session and claim remains unverified',async t=>{
 const f=await fixture(t),c=await controller(t,f);assert.equal(f.calls.length,0);
 await c.load();assert.equal(c.getSnapshot().phase,'ready');
 const rendered=c.getSnapshot();await c.claim(rendered,quoteId,optionId,true);
 const s=c.getSnapshot();assert.equal(s.outcome,'submitted_unverified');assert.equal(s.pending,null);
 const write=f.calls.find(x=>x.command.action==='submit_claim').command;
 assert.deepEqual({...write,requestId:'one-request'}, {schemaVersion:2,action:'submit_claim',requestId:'one-request',expectedRevision:3,quoteId,quoteVersion:1,paymentOptionId:optionId,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,evidenceId:null});
 assert.equal(s.receipt.claimId,claimId);assert.equal(s.receipt.serviceUnlocked,false);
 assert.equal(Object.isFrozen(s.receipt),true);assert.equal(f.calls.filter(x=>x.command.action!=='client_read').length,1);
});
test('claim requires deliberate confirmation and exact rendered snapshot',async t=>{
 const f=await fixture(t),c=await controller(t,f);await c.load();const old=c.getSnapshot();
 await c.claim(old,quoteId,optionId,false);assert.equal(f.calls.length,1);
 await c.load();await c.claim(old,quoteId,optionId,true);assert.equal(f.calls.length,2);
});
for(const variant of ['unavailable option','legacy','settled','existing claim','product','renewal'])test('inapplicable '+variant+' cannot create first-service claim',async t=>{
 const f=await fixture(t),data=view(),q=data.quotes[0];
 if(variant==='unavailable option')q.paymentOptions[0].available=false;
 if(variant==='legacy'){q.contractVersion=1;q.paymentOptions=[];}
 if(variant==='settled')q.status='settled';
 if(variant==='existing claim')data.claims=[{id:claimId,quoteId,quoteVersion:1,paymentOptionId:optionId,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,evidenceId:null,status:'submitted_unverified'}];
 if(variant==='product'){q.publicationVersion=1;q.items=[{recommendationId:'product',quantity:1,unitPriceCents:2000,lineTotalCents:2000}];q.productSubtotalCents=q.productTotalCents=2000;q.totalCents=12000;q.shippingAddressVersion=1;const address={recipientName:'Synthetic A',line1:'1 Test',line2:'',city:'Test',region:'WI',postalCode:'00000',countryCode:'US'};data.shippingAddress={version:1,address};data.shippingAddresses=[data.shippingAddress];}
 if(variant==='renewal'){q.publicationVersion=1;q.servicePeriod={startOn:'2026-11-03',endOn:'2026-12-03'};}
 f.setView(data);const c=await controller(t,f);await c.load();assert.equal(c.getSnapshot().phase,'ready');await c.claim(c.getSnapshot(),quoteId,optionId,true);assert.equal(f.calls.length,1);
});
test('interrupted claim keeps exact UUID/body/revision through reload and deliberate retry',async t=>{
 const f=await fixture(t);f.setReply(()=>Response.json({code:'unavailable'},{status:503}));const c=await controller(t,f);await c.load();
 await c.claim(c.getSnapshot(),quoteId,optionId,true);let s=c.getSnapshot();assert.equal(s.outcome,'uncertain');const pending=s.pending;
 await f.runtime.restore();await c.load();assert.equal(c.getSnapshot().phase,'ready');assert.deepEqual(c.getSnapshot().pending,pending);
 await c.claim(c.getSnapshot(),quoteId,optionId,true);assert.equal(f.calls.filter(x=>x.command.action==='submit_claim').length,1);
 f.setReply(()=>Response.json(receipt()));await c.retry(c.getSnapshot());s=c.getSnapshot();assert.equal(s.pending,null);assert.equal(s.outcome,'submitted_unverified');
 const writes=f.calls.filter(x=>x.command.action==='submit_claim');assert.equal(writes.length,2);assert.equal(writes[0].body,writes[1].body);
});
test('wrong-recipient confirmation response cannot acknowledge a sent claim',async t=>{
 const f=await fixture(t);f.setReply(()=>Response.json({...receipt(),paymentOptionId:'55555555-5555-4555-8555-555555555555'}));const c=await controller(t,f);await c.load();await c.claim(c.getSnapshot(),quoteId,optionId,true);
 assert.equal(c.getSnapshot().outcome,'uncertain');assert.notEqual(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().receipt,null);
});
test('duplicate click while first claim is pending dispatches once',async t=>{
 const f=await fixture(t),held=deferred();f.setReply(async()=>{await held.promise;return Response.json(receipt());});t.after(()=>held.release());
 const c=await controller(t,f);await c.load();const rendered=c.getSnapshot(),first=c.claim(rendered,quoteId,optionId,true);
 await c.claim(rendered,quoteId,optionId,true);held.release();await first;assert.equal(f.calls.filter(x=>x.command.action==='submit_claim').length,1);
});
test('logout clears private quote and uncertain command before held success returns',async t=>{
 const f=await fixture(t),held=deferred();f.setReply(async()=>{await held.promise;return Response.json(receipt());});t.after(()=>held.release());
 const c=await controller(t,f);await c.load();const first=c.claim(c.getSnapshot(),quoteId,optionId,true);
 f.setLogin({ownerId:'66666666-6666-4666-8666-666666666666',generation:2,csrf:'new-synthetic'});await f.runtime.restore();
 assert.equal(c.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().view,null);assert.equal(c.getSnapshot().pending,null);
 held.release();await first;assert.equal(c.getSnapshot().receipt,null);
});
test('observer session loss prevents dispatch after local pending notification',async t=>{
 const f=await fixture(t),c=await controller(t,f);await c.load();c.subscribe(()=>{if(c.getSnapshot().phase==='submitting')f.runtime.dispose();});
 await c.claim(c.getSnapshot(),quoteId,optionId,true);assert.equal(f.calls.filter(x=>x.command.action==='submit_claim').length,0);assert.equal(c.getSnapshot().phase,'ended');
});

test('uncertain intent survives controller remount in the same actual session',async t=>{
 const f=await fixture(t);f.setReply(()=>Response.json({code:'unavailable'},{status:503}));let c=await controller(t,f);await c.load();await c.claim(c.getSnapshot(),quoteId,optionId,true);
 const original=c.getSnapshot().pending;c.dispose();await f.runtime.restore();c=await controller(t,f);assert.deepEqual(c.getSnapshot().pending,original);await c.load();
 f.setReply(()=>Response.json(receipt()));await c.retry(c.getSnapshot());const writes=f.calls.filter(x=>x.command.action==='submit_claim');assert.equal(writes.length,2);assert.equal(writes[0].body,writes[1].body);
});
test('denied read clears private display while retaining original uncertain custody',async t=>{
 const f=await fixture(t);f.setReply(()=>Response.json({code:'unavailable'},{status:503}));const c=await controller(t,f);await c.load();await c.claim(c.getSnapshot(),quoteId,optionId,true);const original=c.getSnapshot().pending;
 await f.runtime.restore();f.setReadReply(()=>Response.json({code:'forbidden'},{status:403}));await c.load();assert.equal(c.getSnapshot().phase,'denied');assert.equal(c.getSnapshot().view,null);assert.deepEqual(c.getSnapshot().pending,original);
});
test('frozen view rejects caller mutation of gross or recipient',async t=>{
 const f=await fixture(t),c=await controller(t,f);await c.load();const q=c.getSnapshot().view.quotes[0];
 assert.throws(()=>{q.totalCents=1;},TypeError);assert.throws(()=>{q.paymentOptions[0].recipient.cashtag='$elsewhere';},TypeError);
});
test('a second mounted consumer cannot mint another claim while the original is uncertain',async t=>{
 const f=await fixture(t),a=await controller(t,f),b=await controller(t,f);await a.load();await b.load();
 f.setReply(()=>Response.json({code:'unavailable'},{status:503}));await a.claim(a.getSnapshot(),quoteId,optionId,true);
 await f.runtime.restore();await b.load();await b.claim(b.getSnapshot(),quoteId,optionId,true);
 assert.equal(f.calls.filter(x=>x.command.action==='submit_claim').length,1);assert.deepEqual(b.getSnapshot().pending,a.getSnapshot().pending);
});
test('a late receipt for an older command cannot erase a newer uncertain claim during remount recovery',async t=>{
 const f=await fixture(t),heldA=deferred(),heldC=deferred();let enterA,enterC,oldCalls=0;
 const startedA=new Promise(r=>{enterA=r;}),startedC=new Promise(r=>{enterC=r;});
 t.after(()=>{heldA.release();heldC.release();});
 f.setReply(async command=>{oldCalls++;if(oldCalls===1){enterA();await heldA.promise;}return Response.json(receipt());});
 const a=await controller(t,f);await a.load();const first=a.claim(a.getSnapshot(),quoteId,optionId,true);await startedA;
 const b=await controller(t,f);await b.load();await b.retry(b.getSnapshot());assert.equal(b.getSnapshot().pending,null);
 const latest=view();latest.revision=7;latest.quotes[0].status='superseded';const q=structuredClone(latest.quotes[0]);q.id='77777777-7777-4777-8777-777777777777';q.status='payable';q.paymentOptions[0].id='88888888-8888-4888-8888-888888888888';latest.quotes.push(q);f.setView(latest);await b.load();
 f.setReply(async()=>{enterC();await heldC.promise;return Response.json({...receipt(),revision:8,quoteId:q.id,paymentOptionId:q.paymentOptions[0].id});});
 const newer=b.claim(b.getSnapshot(),q.id,q.paymentOptions[0].id,true);await startedC;const originalNewer=b.getSnapshot().pending;
 heldA.release();await first;const d=await controller(t,f);assert.deepEqual(d.getSnapshot().pending,originalNewer);
 heldC.release();await newer;
});
