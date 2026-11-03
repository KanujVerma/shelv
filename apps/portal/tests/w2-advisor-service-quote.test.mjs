// Synthetic controller proof only. No Auth, bank, payment provider, email or publication.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdvisorController} from '../src/features/advisor/controller.ts';
import {buildPaymentCallV2} from '../../../supabase/functions/concierge-payments/methods.ts';
import {fixture,ids} from './rebuild/advisor-fixture.mjs';
function setup({withPort=true}={}){
 const f=fixture({ready:true}),writes=[];
 f.context.payments.quotes=[];f.context.payments.claims=[];
 let fail=0,hold=null;
 f.options.ports.issueQuote={async execute(command){
  writes.push(structuredClone(command));buildPaymentCallV2(command,ids.actor);
  if(hold)await hold;
  if(fail)throw {status:fail};
  return {schemaVersion:2,paymentOptionId:null,revision:2,operation:'issue_quote',quoteId:ids.quote,claimId:null,status:'payable',serviceUnlocked:false,serviceAccessStatus:null,productOrderStatus:null};
 }};
 if(!withPort)delete f.options.ports.issueQuote;
 const c=createAdvisorController(f.options);
 return {f,c,writes,setFail(v){fail=v},setHold(v){hold=v}};
}
async function ready(t,options){const h=setup(options);t.after(()=>h.c.dispose());await h.c.open(ids.draft);await h.c.refreshContext();assert.equal(typeof h.c.issueFirstServiceQuote,'function');return h;}
test('first-service quote sends the canonical service-only v2 command without approval or publication',async t=>{
 const {c,writes,f}=await ready(t);await c.issueFirstServiceQuote();
 assert.equal(writes.length,1);const {requestId,...command}=writes[0];assert.match(requestId,/^[0-9a-f-]{36}$/);
 assert.deepEqual(command,{schemaVersion:2,action:'issue_quote',clientId:ids.client,expectedRevision:1,publicationVersion:0,serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000});
 assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().context.approval,null);
 assert.deepEqual(f.calls.map(x=>x.action),['read_draft_v1']);
});
test('uncertain quote response retains one exact request and retry never substitutes a new UUID',async t=>{
 const {c,writes,setFail}=await ready(t);setFail(503);await c.issueFirstServiceQuote();
 assert.equal(c.getSnapshot().notice.kind,'uncertain');const original=structuredClone(writes[0]);
 await c.reconcile();assert.equal(c.getSnapshot().pending.requestId,original.requestId);
 setFail(0);await c.retry();assert.deepEqual(writes,[original,original]);assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().save,'saved');
});
test('payment revision conflict requires fresh financial context without invalidating clinical content',async t=>{
 const {c,writes,setFail}=await ready(t);const target=structuredClone(c.getSnapshot().view.target);setFail(409);await c.issueFirstServiceQuote();
 assert.equal(c.getSnapshot().needsComparison,false);assert.deepEqual(c.getSnapshot().view.target,target);assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().context,null);
 setFail(0);await c.refreshContext();await c.issueFirstServiceQuote();assert.equal(writes.length,2);assert.notEqual(writes[0].requestId,writes[1].requestId);
});
test('missing quote adapter, denied finance capability, existing payable quote and later publication stay blocked',async t=>{
 for(const kind of ['port','capability','quote','later']){
  const {c,f,writes}=await ready(t);
  if(kind==='port')delete f.options.ports.issueQuote;
  if(kind==='capability')f.options.permissions.confirmPayments=false;
  if(kind==='later'){f.context.publication='later';await c.refreshContext();}
  if(kind==='quote'){f.context.payments.quotes=fixture({ready:true}).context.payments.quotes;await c.refreshContext();}
  await c.issueFirstServiceQuote();assert.equal(writes.length,0,kind);
 }
});
test('session retirement during an issued quote rejects its delayed receipt and clears private pending work',async t=>{
 const {c,f,writes,setHold}=await ready(t);let release;setHold(new Promise(r=>release=r));const sending=c.issueFirstServiceQuote();
 await Promise.resolve();f.invalidate();release();await sending;
 assert.equal(writes.length,1);assert.equal(c.getSnapshot().ended,true);assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().context,null);
});

// Actual component SSR; browser/keyboard/financial persistence remain W7 gates.
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const output=new URL('../../../.local-artifacts/w2/quote-ssr.cjs',import.meta.url);
await mkdir(new URL('.',output),{recursive:true});
await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{contents:`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{OverlayProvider}from'./src/ui/index.ts';import{AdvisorWorkspace}from'./src/features/advisor/AdvisorWorkspace.tsx';export const render=(props)=>renderToStaticMarkup(React.createElement(OverlayProvider,null,React.createElement(AdvisorWorkspace,props)));`,resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},outfile:output.pathname,platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});
const {render}=createRequire(import.meta.url)(output.pathname);
const html=c=>render({controller:c,navigation:{route:{name:'advisor-editor',draftId:ids.draft,section:'review-publish'},navigate(){}}});
test('advisor publication checks expose a separate deliberate first-service quote action',async t=>{
 const {c}=await ready(t);const markup=html(c);assert.match(markup,/issue first service quote/);assert.match(markup,/\$100\.00/);assert.match(markup,/does not verify payment or publish/);
});
test('advisor quote availability stays honest when optional authenticated adapter is absent',async t=>{
 const {c}=await ready(t,{withPort:false});const markup=html(c);
 assert.match(markup,/quote preparation unavailable/);assert.match(markup,/<button[^>]*disabled[^>]*>issue first service quote/);
});
