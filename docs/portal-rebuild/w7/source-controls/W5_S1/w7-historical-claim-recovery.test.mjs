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
