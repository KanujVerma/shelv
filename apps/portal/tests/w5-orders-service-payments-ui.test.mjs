import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {fixture,quoteId,optionId} from './w5-orders-service-payments-helper.mjs';
import {createClientPaymentsController} from '../src/features/payments/controller.ts';
let Component;
async function render(c){
 if(!Component){
  const out=path.resolve(import.meta.dirname,'../node_modules/.cache/w5-commerce/ServicePayments.mjs');await mkdir(path.dirname(out),{recursive:true});
  try{await build({entryPoints:[path.resolve(import.meta.dirname,'../src/features/payments/ServicePayments.tsx')],outfile:out,bundle:true,platform:'node',format:'esm',jsx:'automatic',packages:'external',loader:{'.css':'empty'},logLevel:'silent'});}catch(e){assert.fail('service-payment view is missing: '+e.message);}
  Component=(await import(pathToFileURL(out))).ServicePayments;
 }
 return renderToStaticMarkup(createElement(Component,{controller:c}));
}
test('service quote exposes amount and frozen recipient without a provider payment button',async t=>{
 const f=await fixture(t),c=createClientPaymentsController(f.runtime,f.ports);t.after(()=>c.dispose());await c.load();const html=await render(c);
 assert.match(html,/first service payment/);assert.match(html,/\$100\.00/);assert.match(html,/Synthetic Recipient/);assert.match(html,/\$synthetic/);assert.match(html,/record payment sent/);
 assert.doesNotMatch(html,/<a[^>]+href="https:\/\/(cash|zelle|apple)/);assert.equal(f.calls.length,1);
});
test('sent acknowledgement remains unverified and never claims publication',async t=>{
 const f=await fixture(t),c=createClientPaymentsController(f.runtime,f.ports);t.after(()=>c.dispose());await c.load();await c.claim(c.getSnapshot(),quoteId,optionId,true);const html=await render(c);
 assert.match(html,/payment claim recorded/);assert.match(html,/awaiting receipt verification/);assert.doesNotMatch(html,/plan published|service is active/);
});
test('fresh rejected-claim read restores the eligible form and removes the old success notice',async t=>{
 const f=await fixture(t),c=createClientPaymentsController(f.runtime,f.ports);t.after(()=>c.dispose());await c.load();await c.claim(c.getSnapshot(),quoteId,optionId,true);
 const latest=structuredClone(c.getSnapshot().view);latest.revision=5;latest.claims=[{id:'44444444-4444-4444-8444-444444444444',quoteId,quoteVersion:1,paymentOptionId:optionId,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,evidenceId:null,status:'rejected'}];
 f.setView(latest);await c.load();const html=await render(c);
 assert.equal(c.getSnapshot().outcome,'none');assert.match(html,/record payment sent/);assert.match(html,/payment claim needs review/);assert.doesNotMatch(html,/payment claim recorded|awaiting receipt verification/);
});
test('a replacement first-service quote remains actionable after acknowledged earlier claim',async t=>{
 const f=await fixture(t),c=createClientPaymentsController(f.runtime,f.ports);t.after(()=>c.dispose());await c.load();await c.claim(c.getSnapshot(),quoteId,optionId,true);
 const latest=structuredClone(c.getSnapshot().view);latest.revision=5;latest.quotes[0].status='superseded';const replacement=structuredClone(latest.quotes[0]);replacement.id='77777777-7777-4777-8777-777777777777';replacement.status='payable';replacement.paymentOptions[0].id='88888888-8888-4888-8888-888888888888';latest.quotes.push(replacement);
 f.setView(latest);await c.load();const html=await render(c);assert.match(html,/record payment sent/);assert.doesNotMatch(html,/payment claim recorded|awaiting receipt verification/);
 f.setReply(()=>Response.json({schemaVersion:2,paymentOptionId:replacement.paymentOptions[0].id,revision:6,operation:'submit_claim',quoteId:replacement.id,claimId:'99999999-9999-4999-8999-999999999999',status:'submitted_unverified',serviceUnlocked:false,serviceAccessStatus:null,productOrderStatus:null}));
 await c.claim(c.getSnapshot(),replacement.id,replacement.paymentOptions[0].id,true);assert.equal(c.getSnapshot().outcome,'submitted_unverified');const writes=f.calls.filter(x=>x.command.action==='submit_claim');assert.equal(writes.length,2);assert.equal(writes[1].command.quoteId,replacement.id);assert.equal(writes[1].command.expectedRevision,5);
});
