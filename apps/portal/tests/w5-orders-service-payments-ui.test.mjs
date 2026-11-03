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
