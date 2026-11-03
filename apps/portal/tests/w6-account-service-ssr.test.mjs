// Rendering evidence only; supplied state is synthetic, not service authority.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';

test('service and cancellation fragments present only supplied server dates and keep unknown facts honest', async () => {
  const portal=new URL('..',import.meta.url).pathname;
  const output=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',stdin:{
    contents:"import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{AccountService}from'./src/features/account/service/AccountService.tsx';import{CancelService}from'./src/features/account/service/CancelService.tsx';import{initialServiceState}from'./src/features/account/service/model.ts';export{initialServiceState};export const render=(c,cancel=false)=>renderToStaticMarkup(cancel?<CancelService controller={c}/>:<AccountService controller={c} presentation='details'/>);",loader:'tsx',resolveDir:portal},
    bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'}});
  const module={exports:{}};new Function('module','exports','require',output.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));
  let state=module.exports.initialServiceState();let loads=0;
  const controller={getSnapshot:()=>state,subscribe:()=>()=>{},load(){loads++;}};
  assert.doesNotMatch(module.exports.render(controller),/active service|2027|\$100|\$0/);assert.equal(loads,0);
  const current={coverage:{status:'active',period:{startOn:'2026-11-01',endOn:'2026-12-01'},paidSupportEndsOn:'2027-01-01'},cancellation:null,
    periodEndCancellation:{state:'available',supportEndsOn:'2027-01-01',readOnlyEndsOn:'2027-01-31'},postServiceAccess:{state:'known',supportEndsOn:'2027-01-01',readOnlyEndsOn:'2027-01-31'}};
  state={...state,phase:'ready',current};
  const detail=module.exports.render(controller);assert.match(detail,/2027-01-01/);assert.match(detail,/2027-01-31/);assert.match(detail,/Chicago time/);
  assert.match(detail,/service payment amounts<\/dt><dd>unavailable/);assert.doesNotMatch(detail,/<h1|<nav|\$100|\$0|refund sent/);
  state={...state,current:{...current,postServiceAccess:{state:'unknown'}}};assert.match(module.exports.render(controller),/read-only access ends<\/dt><dd>unknown/);
  state={...state,draft:{current,supportEndsOn:'2027-01-01',readOnlyEndsOn:'2027-01-31',generation:1},canConfirm:true};
  const cancel=module.exports.render(controller,true);assert.match(cancel,/confirm cancellation/);assert.match(cancel,/2027-01-31/);
  assert.match(cancel,/not an automatic product return or service-fee refund/);assert.doesNotMatch(cancel,/<textarea|<input|<dialog/);
  state={...state,phase:'ended',current:null,draft:null};const ended=module.exports.render(controller)+module.exports.render(controller,true);
  assert.doesNotMatch(ended,/2027-01-01|2027-01-31|confirm cancellation/);
});
