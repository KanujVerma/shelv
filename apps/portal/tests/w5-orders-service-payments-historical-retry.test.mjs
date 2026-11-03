import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,view,receipt,quoteId,optionId,claimId} from './w5-orders-service-payments-helper.mjs';
import {createClientPaymentsController} from '../src/features/payments/controller.ts';
for(const status of ['confirmed','rejected'])test('historical claim retry cannot contradict already-read '+status+' current claim',async t=>{
 const f=await fixture(t),c=createClientPaymentsController(f.runtime,f.ports);t.after(()=>c.dispose());
 f.setReply(()=>Response.json({code:'unavailable'},{status:503}));await c.load();await c.claim(c.getSnapshot(),quoteId,optionId,true);
 assert.equal(c.getSnapshot().outcome,'uncertain');const original=c.getSnapshot().pending;
 const latest=view();latest.revision=5;latest.claims=[{id:claimId,quoteId,quoteVersion:1,paymentOptionId:optionId,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,evidenceId:null,status}];
 if(status==='confirmed'){latest.quotes[0].status='settled';latest.service={status:'pending_publication',period:null};}
 f.setView(latest);await f.runtime.restore();await c.load();
 assert.equal(c.getSnapshot().view.claims[0].status,status);assert.deepEqual(c.getSnapshot().pending,original);
 f.setReply(()=>Response.json(receipt()));await c.retry(c.getSnapshot());
 assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().view.claims[0].status,status);
 assert.notEqual(c.getSnapshot().outcome,'submitted_unverified','current view must not be presented as awaiting verification after a historical ACK');
});

test('a historical ACK stays immutable while the canonically rejected quote permits a deliberate new claim',async t=>{
 const f=await fixture(t),c=createClientPaymentsController(f.runtime,f.ports);t.after(()=>c.dispose());
 f.setReply(()=>Response.json({code:'unavailable'},{status:503}));await c.load();await c.claim(c.getSnapshot(),quoteId,optionId,true);
 const original=c.getSnapshot().pending,latest=view();latest.revision=5;
 latest.claims=[{id:claimId,quoteId,quoteVersion:1,paymentOptionId:optionId,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,evidenceId:null,status:'rejected'}];
 f.setView(latest);await f.runtime.restore();await c.load();f.setReply(()=>Response.json(receipt()));await c.retry(c.getSnapshot());
 assert.deepEqual(c.getSnapshot().receipt,receipt(),'the original receipt is historical evidence, not a mutable claim status');
 f.setReply(()=>Response.json({...receipt(),revision:6,claimId:'99999999-9999-4999-8999-999999999999'}));
 await c.claim(c.getSnapshot(),quoteId,optionId,true);const writes=f.calls.filter(x=>x.command.action==='submit_claim');
 assert.equal(writes.length,3);assert.equal(writes[0].body,writes[1].body);assert.equal(writes[0].command.requestId,original.requestId);
 assert.notEqual(writes[2].command.requestId,original.requestId);assert.equal(writes[2].command.expectedRevision,5);
 assert.equal(c.getSnapshot().receipt.serviceUnlocked,false);assert.equal(c.getSnapshot().receipt.productOrderStatus,null);
});
