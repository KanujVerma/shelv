import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,view,receipt,deferred,quoteId,optionId,claimId} from './w5-orders-service-payments-helper.mjs';
const source=()=>import('../src/app/client-payments-request.ts');
const read={schemaVersion:2,action:'client_read'};
const claim=()=>({schemaVersion:2,action:'submit_claim',requestId:'77777777-7777-4777-8777-777777777777',expectedRevision:3,quoteId,quoteVersion:1,paymentOptionId:optionId,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,evidenceId:null});
async function ports(t){const f=await fixture(t),{createClientPaymentPorts}=await source();return {...f,p:createClientPaymentPorts(f.runtime)};}

// Closed synthetic HTTP through the real session/cookie/transport. The helper's
// test ports are unused: all calls below go through the new production adapter.
test('payment read uses the actual registered fixed client channel and canonical V2 view',async t=>{
 const f=await ports(t);assert.deepEqual(await f.p.read.execute(read),view());
 assert.deepEqual(f.calls.map(c=>c.command),[read]);
});
test('claim uses the exact V2 intent and returns an immutable event receipt, never a verified payment',async t=>{
 const f=await ports(t),command=claim(),result=await f.p.claim.execute(command);
 assert.deepEqual(result,receipt());assert.equal(result.status,'submitted_unverified');assert.equal(result.serviceUnlocked,false);
 assert.deepEqual(f.calls.map(c=>c.command),[command]);
});
test('caller mutation after execute cannot change the dispatched claim',async t=>{
 const f=await ports(t),command=claim(),pending=f.p.claim.execute(command);
 command.totalCents=1;command.paymentOptionId='88888888-8888-4888-8888-888888888888';
 await pending;assert.equal(f.calls[0].command.totalCents,10000);assert.equal(f.calls[0].command.paymentOptionId,optionId);
});
test('selectors and caller-selected RPCs are refused before payment HTTP',async t=>{
 const f=await ports(t);
 for(const invalid of [{...read,clientId:claimId},{...read,rpc:'anything'},{...read,schemaVersion:1}])await assert.rejects(f.p.read.execute(invalid),e=>e.status===400);
 assert.equal(f.calls.length,0);
});
test('client adapter cannot read advisor state or verify a receipt',async t=>{
 const f=await ports(t);
 await assert.rejects(f.p.read.execute({schemaVersion:2,action:'advisor_read',clientId:claimId}),e=>e.status===403);
 await assert.rejects(f.p.claim.execute({...claim(),action:'confirm_payment',receiptVerified:true}),e=>e.status===403);
 assert.equal(f.calls.length,0);
});
test('an actual advisor runtime cannot invoke either own-client payment operation',async t=>{
 const {actual}=await import('./rebuild-client-orders-fixture.mjs');
 const f=await actual(t,{audience:'advisor'}),{createClientPaymentPorts}=await source(),p=createClientPaymentPorts(f.runtime),before=f.calls.length;
 await assert.rejects(p.read.execute(read),e=>e.status===401);
 await assert.rejects(p.claim.execute(claim()),e=>e.status===401);
 assert.equal(f.calls.length,before);
});
test('an already-cancelled read never dispatches payment HTTP',async t=>{
 const f=await ports(t),controller=new AbortController();controller.abort();
 await assert.rejects(f.p.read.execute(read,{signal:controller.signal}),e=>e.status===503);
 assert.equal(f.calls.length,0);assert.equal(f.runtime.cookie.status,'ready');
});
for(const event of ['offline','disposed'])test('reentrant relevance '+event+' loss prevents egress despite true return',async t=>{
 const f=await ports(t);
 await assert.rejects(f.p.read.execute(read,{isApplicable:()=>{if(event==='offline')f.runtime.cookie.status='offline';else f.runtime.dispose();return true;}}),e=>[401,503].includes(e.status));
 assert.equal(f.calls.length,0);
});
test('option getter side effects are followed by real READY checks',async t=>{
 const f=await ports(t);
 await assert.rejects(f.p.read.execute(read,{get isApplicable(){f.runtime.cookie.status='offline';return()=>true;}}),e=>e.status===503);
 assert.equal(f.calls.length,0);
});
for(const status of [401,403])test('actual payment HTTP'+status+' retains its denial',async t=>{
 const f=await ports(t);f.setReadReply(()=>Response.json({code:status===401?'session_ended':'forbidden'},{status}));
 await assert.rejects(f.p.read.execute(read),e=>e.status===status);assert.equal(f.calls.length,1);
});
test('wrong-recipient receipt is unavailable or uncertain, never a successful claim',async t=>{
 const f=await ports(t);f.setReply(()=>Response.json({...receipt(),paymentOptionId:'88888888-8888-4888-8888-888888888888'}));
 await assert.rejects(f.p.claim.execute(claim()),e=>e.status===503);assert.equal(f.calls.length,1);
});
test('held read cannot return private payment data after actual owner/session replacement',async t=>{
 const f=await ports(t),held=deferred();let entered;const started=new Promise(r=>{entered=r;});t.after(()=>held.release());
 f.setReadReply(async()=>{entered();await held.promise;return Response.json(view());});
 const pending=f.p.read.execute(read);await started;f.setLogin({ownerId:'99999999-9999-4999-8999-999999999999',generation:2,csrf:'replacement'});await f.runtime.restore();
 held.release();await assert.rejects(pending,e=>[401,503].includes(e.status));
});
test('historical submitted receipt does not replace the independently read confirmed view',async t=>{
 const f=await ports(t),current=view();current.revision=5;current.quotes[0].status='settled';current.claims=[{id:claimId,quoteId,quoteVersion:1,paymentOptionId:optionId,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,evidenceId:null,status:'confirmed'}];
 f.setView(current);const actual=await f.p.read.execute(read);assert.equal(actual.claims[0].status,'confirmed');
 assert.equal((await f.p.claim.execute(claim())).status,'submitted_unverified');
 assert.equal((await f.p.read.execute(read)).claims[0].status,'confirmed');
});
