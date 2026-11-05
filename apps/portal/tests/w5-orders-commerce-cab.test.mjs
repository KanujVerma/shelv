// cab target integration: finite synthetic HTTP only; no admitted endpoint.
import test from 'node:test';import assert from 'node:assert/strict';
import {setup,id,owner,instant,deferred,retainHistoricalAcceptance,receiptHash,renderSource} from './w5-orders-commerce-cu-fixtures.mjs';
import {mapCommerceResult,hashFrozenCommerceTerms} from '../../../src/contracts/PortalCommerceMapping.ts';
import {readCommerceCommand,commerceReturnBasis,commerceCanonicalJson} from '../../../src/contracts/PortalCommerceValidation.ts';

test('cab positive USD quote acceptance reaches fixed raw port only after complete current review',async t=>{
 const f=await setup(t);await f.c.acceptQuote();assert.equal(f.calls.some(c=>c.action==='accept_product_quote_v1'),false);
 f.c.reviewQuote();await f.c.acceptQuote();const sent=f.calls.find(c=>c.action==='accept_product_quote_v1');assert.ok(sent);assert.deepEqual(sent.quote,f.q.header.target);assert.equal(f.c.getSnapshot().pending.phase,'uncertain');
});
test('cab claim copies validated frozen USD and all exact amount/address/method/payment-head fields',async t=>{
 const f=await setup(t,{accepted:true});f.c.reviewQuote();await f.c.claimPayment(f.q.options[0].id);const sent=f.calls.find(c=>c.action==='submit_payment_claim_v1');
 assert.ok(sent);assert.deepEqual(sent.payment,{currency:'USD',quoteId:f.q.header.target.quoteId,quoteVersion:1,shippingAddressVersion:2,serviceCents:0,productCents:1000,totalCents:1000,paymentOptionId:f.q.options[0].id});assert.equal(sent.expectedPaymentRevision,17);assert.equal(sent.evidenceId,null);
 const html=await renderSource(f.c.getSnapshot(),f.c,'payment');assert.match(html,/USD/);assert.doesNotMatch(html,/currency is not supplied/);
});
test('cab current service head23, purchase entity9 and fulfillment5 build return CAS23, not9 or5',async t=>{
 const f=await setup(t,{purchase:true});f.detail.fulfillmentRevision=5;await f.c.refresh();await f.c.open(f.entity);
 await f.c.requestReturn({quantity:1,condition:'unopened',reason:'Exact actual item differs'});const sent=f.calls.find(c=>c.action==='request_product_return_v1');assert.ok(sent);assert.equal(sent.expectedReturnRevision,23);assert.equal(sent.purchaseId,f.detail.id);assert.equal('photo'in sent,false);assert.equal('start'in sent,false);
});
test('cab service-head receipt24 with entity9 resolves the exact return without treating entity revision as the head',async t=>{
 const f=await setup(t,{purchase:true});f.request.override=async c=>c.action==='request_product_return_v1'?Response.json({schemaVersion:1,requestId:c.requestId,commandHash:await receiptHash(c),action:c.action,clientId:owner,entity:{kind:'return_case',id:id(800),revision:9},subject:{kind:'purchase',id:f.detail.id},quote:null,lineId:null,revision:24,recordedBy:owner,recordedAt:instant,paymentBasis:null,payment:null}):undefined;
 await f.c.requestReturn({quantity:1,condition:'opened',reason:'Wrong item'});assert.ok(f.calls.some(c=>c.action==='request_product_return_v1'));assert.equal(f.c.getSnapshot().pending,null);assert.equal(f.c.getSnapshot().phase,'ready');
});
test('cab Root positive mapper binds issue payment head24 independently of immutable quote version4 and has no fake payment acknowledgement',async t=>{
 const f=await setup(t);const command=readCommerceCommand({schemaVersion:1,action:'issue_product_quote_v1',requestId:id(801),clientId:owner,target:{draftId:id(802),revision:9,contentHash:'b'.repeat(64),selectionHash:'c'.repeat(64)},expectedPaymentRevision:23});
 const receipt={schemaVersion:1,requestId:command.requestId,commandHash:await receiptHash(command),action:command.action,clientId:owner,entity:{kind:'quote',id:id(803),revision:4},subject:{kind:'quote_draft',id:command.target.draftId},quote:{quoteId:id(803),quoteVersion:4,termsHash:'d'.repeat(64)},lineId:null,revision:24,recordedBy:owner,recordedAt:instant,paymentBasis:null,payment:null};
 assert.equal(mapCommerceResult(command,receipt,{actorId:owner,requestHash:receipt.commandHash}).revision,24);assert.throws(()=>mapCommerceResult(command,{...receipt,revision:4},{actorId:owner,requestHash:receipt.commandHash}));assert.equal(f.calls.some(c=>c.action==='issue_product_quote_v1'),false);
});
test('cab Root refuses missing/unsupported currency and the frozen hash changes with the adopted currency field',async t=>{
 const f=await setup(t);for(const currency of [undefined,'CAD']){const q={...f.q.header};if(currency===undefined)delete q.currency;else q.currency=currency;await assert.rejects(hashFrozenCommerceTerms(q,f.q.lines,f.q.options));}
 const noCurrency={...f.q.header};delete noCurrency.currency;
 const command={schemaVersion:1,action:'read_commerce_detail_v1',snapshot:f.request.snapshot,entity:f.entity};assert.throws(()=>mapCommerceResult(command,{schemaVersion:1,clientId:owner,snapshot:f.request.snapshot,detail:noCurrency},{actorId:owner,requestHash:null}));
 assert.deepEqual(commerceReturnBasis(f.request.snapshot),{expectedReturnRevision:23});assert.throws(()=>commerceReturnBasis({...f.request.snapshot,serviceRevision:'23'}));
});
for(const change of ['close','refresh'])test(`cab CU2 valid USD acceptance cancelled by ${change} during actual hash has zero raw egress`,async t=>{
 const f=await setup(t);f.c.reviewQuote();const write=f.c.acceptQuote(),changing=change==='close'?f.c.close():f.c.refresh();await Promise.all([write,changing]);
 assert.equal(f.calls.some(c=>c.action==='accept_product_quote_v1'),false);assert.equal(f.c.getSnapshot().pending,null);assert.equal(f.boundary.memory.get(`orders-intent:${owner}`),undefined);
});
for(const path of ['write','status'])test(`cab ${path} receipt for A cannot acknowledge, reopen or review a changed current proposal B`,async t=>{
 const f=await setup(t),entered=deferred(),reply=deferred();let c=f.c,commandA;
 if(path==='status'){const held=await retainHistoricalAcceptance(f);commandA=held.command;c=f.create('A-status');t.after(()=>c.dispose());await c.refresh();await c.open(f.entity);}
 f.request.override=async command=>{
  if(path==='status'&&command.action==='request_status_v1'||path==='write'&&command.action==='accept_product_quote_v1'&&command.quote.quoteId===id(2)){
   if(path==='write')commandA=structuredClone(command);entered.resolve();return reply.promise;
  }
 };
 if(path==='write')c.reviewQuote();const operation=path==='write'?c.acceptQuote():c.checkStatus();await entered.promise;
 const h=f.q.header;h.target={quoteId:id(850),quoteVersion:2,termsHash:'b'.repeat(64)};h.publication={version:3,documentSchemaVersion:3};h.selectionHash='f'.repeat(64);h.address={...h.address,version:3,address:{...h.address.address,line1:'27 Current Address'}};
 for(const line of f.q.lines)line.selection.publication=h.publication;h.target.termsHash=await hashFrozenCommerceTerms(h,f.q.lines,f.q.options);
 f.entity.id=id(850);f.entity.revision=2;f.request.snapshot={...f.request.snapshot,revision:32,paymentRevision:18,serviceRevision:24,hash:'f'.repeat(64)};
 await c.refresh();await c.open(f.entity);const current=c.getSnapshot().selection;assert.equal(current.quote.header.target.quoteId,id(850));assert.equal(current.snapshot.serviceRevision,24);
 const receipt={schemaVersion:1,requestId:commandA.requestId,commandHash:await receiptHash(commandA),action:'accept_product_quote_v1',clientId:owner,entity:{kind:'quote_acceptance',id:id(851),revision:1},subject:{kind:'quote',id:commandA.quote.quoteId},quote:commandA.quote,lineId:null,revision:1,recordedBy:owner,recordedAt:instant,paymentBasis:null,payment:null};
 reply.resolve(Response.json(path==='status'?{status:'committed',receipt}:receipt));await operation;
 assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().selection,current);assert.equal(c.getSnapshot().reviewed,false);
 await c.acceptQuote();assert.equal(f.calls.some(x=>x.action==='accept_product_quote_v1'&&x.quote.quoteId===id(850)),false);
 c.reviewQuote();await c.acceptQuote();assert.ok(f.calls.some(x=>x.action==='accept_product_quote_v1'&&x.quote.quoteId===id(850)&&x.quote.quoteVersion===2));
});
for(const action of ['record_purchase_v2','record_product_return_event_v1','record_founder_fault_resolution_v1'])test(`cab ${action} receipt uses canonical service head24 separately from entity9`,async t=>{
 const f=await setup(t);let fields,kind,subject,quote=null;
 if(action==='record_purchase_v2'){fields={expectedServiceRevision:23,quote:f.q.header.target,lineId:f.q.lines[0].lineId,quantity:1,taxCents:0,shippingCents:0,purchasedOn:'2026-10-31',orderReference:'synthetic order',receiptReference:'synthetic receipt'};kind='purchase';subject={kind:'quote',id:f.q.header.target.quoteId};quote=f.q.header.target;}
 else if(action==='record_product_return_event_v1'){fields={returnId:id(860),expectedReturnRevision:23,event:{status:'reviewing',note:'Finite review',expectedRefundCents:null,retailerRefundCents:null,clientRepaidCents:null,policyCheckedOn:null},occurredAt:{state:'unknown'},privateReference:''};kind='event';subject={kind:'return_case',id:id(860)};}
 else{fields={returnId:id(860),expectedReturnRevision:23,resolution:'manual_repayment_required',reason:'Finite founder ordering mistake',confirmationReference:'synthetic confirmation'};kind='event';subject={kind:'return_case',id:id(860)};}
 const command=readCommerceCommand({schemaVersion:1,action,requestId:id(861),clientId:owner,...fields}),hash=await receiptHash(command);
 const receipt={schemaVersion:1,requestId:command.requestId,commandHash:hash,action,clientId:owner,entity:{kind,id:id(862),revision:9},subject,quote,lineId:null,revision:24,recordedBy:owner,recordedAt:instant,paymentBasis:null,payment:null};
 assert.equal(mapCommerceResult(command,receipt,{actorId:owner,requestHash:hash}).revision,24);assert.throws(()=>mapCommerceResult(command,{...receipt,revision:9},{actorId:owner,requestHash:hash}));assert.equal(f.calls.some(c=>c.action===action),false);
});
test('cab positive claim consumes all 50 frozen lines and 101 options through actual session/Root/complete raw-port proof',async t=>{
 const f=await setup(t),{quoteFixture,finiteRequest,snapshot}=await import('./w5-orders-commerce-fixtures.mjs');const q=await quoteFixture({lineCount:50,optionCount:101,accepted:true});for(const line of q.lines){line.quantity=100;line.lineTotalCents=100000;}q.header.productSubtotalCents=5000000;q.header.totalCents=5000000;q.header.target.termsHash=await hashFrozenCommerceTerms(q.header,q.lines,q.options);q.header.acceptance.target={...q.header.target};const source=finiteRequest(q);
 f.request.snapshot=snapshot;f.request.override=async command=>command.action.startsWith('read_')?Response.json(await source.execute(command)):undefined;
 await f.c.refresh();await f.c.open(f.entity);assert.equal(f.c.getSnapshot().selection.quote.options.length,101);assert.equal(f.c.getSnapshot().selection.quote.lines.length,50);f.c.reviewQuote();await f.c.claimPayment(q.options[100].id);
 const sent=f.calls.find(c=>c.action==='submit_payment_claim_v1');assert.equal(sent.payment.currency,'USD');assert.equal(sent.payment.paymentOptionId,q.options[100].id);assert.equal(sent.payment.productCents,5000000);assert.equal(sent.expectedPaymentRevision,4);
});
test('cab unsupported pre-currency dispatched wire is retained exactly, remains READ-recoverable and is never upgraded or resent',async t=>{
 const f=await setup(t,{accepted:true}),{retainHistoricalClaim,intentKey}=await import('./w5-orders-commerce-cu-fixtures.mjs');const held=await retainHistoricalClaim(f);delete held.command.payment.currency;
 const bytes=new TextEncoder().encode(commerceCanonicalJson(held.command));held.commandHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');held.rawWire=JSON.stringify(held.command);f.boundary.memory.set(intentKey,structuredClone(held));
 const c=f.create('unsupported-old-wire');t.after(()=>c.dispose());await c.checkStatus();assert.ok(f.calls.some(x=>x.action==='request_status_v1'));assert.equal(f.boundary.memory.get(intentKey).rawWire,held.rawWire);
 await c.retryIntent();assert.equal(f.calls.some(x=>x.action==='submit_payment_claim_v1'),false);assert.equal(c.getSnapshot().pending.status,'unsupported');assert.equal(c.getSnapshot().pending.rawWire,held.rawWire);assert.equal('currency'in c.getSnapshot().pending.command.payment,false);
});
