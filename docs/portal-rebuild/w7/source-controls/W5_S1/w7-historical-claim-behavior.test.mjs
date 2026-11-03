import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {fixture,view,receipt,quoteId,optionId,claimId} from './w5-orders-service-payments-helper.mjs';
import {createClientPaymentsController} from '../src/features/payments/controller.ts';
const output=new URL('../.local-artifacts/w7-historical-claim-component.cjs',import.meta.url);
await mkdir(new URL('.',output),{recursive:true});
await build({entryPoints:[new URL('../src/features/payments/ServicePayments.tsx',import.meta.url).pathname],outfile:output.pathname,bundle:true,platform:'node',format:'cjs',packages:'external',jsx:'automatic',loader:{'.css':'empty'}});
const {ServicePayments}=createRequire(import.meta.url)(output.pathname);
for(const status of ['confirmed','rejected'])test('historical ACK after current '+status+' read keeps the customer status truthful',async t=>{
 const f=await fixture(t),c=createClientPaymentsController(f.runtime,f.ports);t.after(()=>c.dispose());
 f.setReply(()=>Response.json({code:'unavailable'},{status:503}));await c.load();await c.claim(c.getSnapshot(),quoteId,optionId,true);
 const latest=view();latest.revision=5;latest.claims=[{id:claimId,quoteId,quoteVersion:1,paymentOptionId:optionId,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,evidenceId:null,status}];
 if(status==='confirmed'){latest.quotes[0].status='settled';latest.service={status:'pending_publication',period:null};}
 f.setView(latest);await f.runtime.restore();await c.load();
 f.setReply(()=>Response.json(receipt()));await c.retry(c.getSnapshot());
 const html=renderToStaticMarkup(createElement(ServicePayments,{controller:c}));
 assert.match(html,status==='confirmed'?/verified payment recorded/:/payment claim needs review/);
 assert.doesNotMatch(html,/awaiting receipt verification/,'a historical acknowledgement must not replace the current status');
 if(status==='rejected')assert.match(html,/record payment sent/,'the rejected current quote remains actionable');
});
