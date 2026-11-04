// Pure presentation with synthetic canonical-format data. No receipt provenance,
// authentication, financial action or current-service permission is proved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const portal=new URL('..',import.meta.url).pathname;
let api={};
if(existsSync(new URL('../src/features/account/financials/AccountServiceFinancials.tsx',import.meta.url))) {
  const output=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',stdin:{contents:"import React from'react';import{renderToStaticMarkup}from'react-dom/server';export{AccountServiceFinancials}from'./src/features/account/financials/AccountServiceFinancials.tsx';export{Button}from'./src/ui/index.ts';import{AccountServiceFinancials}from'./src/features/account/financials/AccountServiceFinancials.tsx';export const render=p=>renderToStaticMarkup(React.createElement(AccountServiceFinancials,p));",loader:'tsx',resolveDir:portal},bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'}});
  const module={exports:{}};new Function('module','exports','require',output.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));api=module.exports;
}
const required=()=>assert.equal(typeof api.AccountServiceFinancials,'function','canonical financials presentation is implemented');
const id=n=>`${String(n).padStart(8,'0')}-1111-4111-8111-111111111111`;
const row=(n=1)=>({kind:'canonical_payment',claimId:id(n),quoteId:id(n+10),verifiedAt:'2026-10-31T12:00:00Z',serviceCents:10000,period:{state:'scheduled',startOn:'2026-10-31',endOn:'2026-11-30'}});
const view=()=>({schemaVersion:1,snapshot:{paymentRevision:7,serviceRevision:4,asOfDay:'2026-11-03',hash:'a'.repeat(64)},payments:[row()],nextCursor:null,firstPublicationOn:{state:'known',value:'2026-09-01'},pendingServiceQuotes:[{id:id(20),version:2}],guarantee:{state:'unavailable',code:'service_terms_unavailable'}});
const render=value=>{required();return api.render({read:{state:'loaded',view:value}});};
function buttons(element) {
  if(!element||typeof element!=='object')return[];
  const children=Array.isArray(element.props?.children)?element.props.children:[element.props?.children];
  return [...(element.type===api.Button?[element]:[]),...children.flat(Infinity).flatMap(buttons)];
}

test('canonical V1 uses explicit USD units and recorded periods without totals or clocks',()=>{
  const value={...view(),privateNote:'PRIVATE_FINANCIAL_CANARY',bankReference:'PRIVATE_BANK_CANARY'};
  const html=render(value);assert.match(html,/\$100\.00/);assert.match(html,/2026-10-31/);assert.match(html,/start of[^]*2026-11-30/);assert.match(html,/Chicago/);assert.match(html,/2026-09-01/);
  assert.doesNotMatch(html,/<h1|<nav|PRIVATE_|00000001-1111|00000020-1111|aaaaaaa|total paid|active service|refund sent/);
});
test('USD2500 is preserved as a numeric formatting fixture only, never replaced by the current offer',()=>{
  const html=render({...view(),payments:[{...row(),serviceCents:2500}]});assert.match(html,/\$25\.00/);assert.doesNotMatch(html,/\$100\.00/);
});
test('pending publication and unknown first publication never invent dates or an active clock',()=>{
  const html=render({...view(),firstPublicationOn:{state:'unknown'},payments:[{...row(),period:{state:'pending_publication'}}]});assert.match(html,/awaiting publication/);assert.match(html,/publication date is unavailable/);assert.doesNotMatch(html,/2026-11-30|active service|request deadline|90 days/);
});
test('all six unavailable guarantees preserve the business distinction without a supported branch',()=>{
  for(const code of ['payment_lineage_unavailable','legacy_payment_provenance_required','service_terms_unavailable','period_basis_unavailable','calendar_policy_unavailable','broader_terms_unavailable']) {
    const html=render({...view(),guarantee:{state:'unavailable',code},payments:[row(1),row(2),row(3)]});
    assert.match(html,/guarantee details are unavailable/);assert.match(html,/agreed terms/);assert.match(html,/text shelv/);assert.doesNotMatch(html,/\$300\.00|not eligible|eligible for|refund confirmed/);
  }
});
test('empty and partial pages do not claim no real payment or complete history',()=>{
  const empty=render({...view(),payments:[]});assert.match(empty,/no payment entries on this page/);assert.doesNotMatch(empty,/you have not paid|no payments ever|total/);
  const partial=render({...view(),nextCursor:'next-page'});assert.match(partial,/more payment entries/);assert.doesNotMatch(partial,/complete payment history|next-page/);
});
test('next-page intent retains exactly the captured server snapshot and cursor and rendering is inert',()=>{
  required();const value={...view(),nextCursor:'cursor-original'},intents=[];
  const props={read:{state:'loaded',view:value},onReadNextPage:intent=>intents.push(intent)};
  api.render(props);assert.equal(intents.length,0);
  const button=buttons(api.AccountServiceFinancials(props)).find(x=>x.props.children==='load more payments');assert.ok(button);
  const captured=value.snapshot;value.snapshot={...captured,hash:'b'.repeat(64)};value.nextCursor='replacement';
  button.props.onClick();assert.equal(intents.length,1);assert.deepEqual(Object.keys(intents[0]).sort(),['cursor','snapshot']);assert.equal(intents[0].snapshot,captured);assert.equal(intents[0].cursor,'cursor-original');assert.ok(Object.isFrozen(intents[0]));
});
test('unsupported schema, legacy/unknown period and supported-guarantee variants cannot inherit canonical USD',()=>{
  for(const value of [{...view(),schemaVersion:2},{...view(),payments:[{...row(),kind:'legacy_receipt'}]},{...view(),payments:[{...row(),period:{state:'unknown'}}]},{...view(),guarantee:{state:'supported',firstThreePaidCents:10000}}]) {
    const html=render(value);assert.match(html,/payment details are unavailable/);assert.doesNotMatch(html,/\$|2026-10-31|eligible/);
  }
});
test('nonloaded and retired views render no accidentally retained financial rows',()=>{
  required();for(const state of ['unread','loading','unavailable','denied','ended']) {
    const html=api.render({read:{state,view:view()}});assert.doesNotMatch(html,/\$100|2026-10-31|2026-09-01|load more payments/);
  }
});
test('browser build is presentation-only and uses the existing W5 money formatter/shared controls',async()=>{
  required();const output=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['src/features/account/financials/index.ts'],bundle:true,write:false,metafile:true,format:'esm',platform:'browser',loader:{'.css':'empty'},outdir:'unused-financials-output'});
  const inputs=Object.keys(output.metafile.inputs);assert.ok(inputs.some(p=>p.endsWith('features/payments/model.ts')));assert.ok(inputs.some(p=>p.endsWith('ui/primitives.tsx')));assert.ok(!inputs.some(p=>/transport\/|session-integration|\/server\/|supabase\/functions|payments\/controller/.test(p)));
});
