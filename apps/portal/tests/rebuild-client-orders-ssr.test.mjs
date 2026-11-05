// HISTORICAL unregistered constructor controls: exact immutable556 source, not current registry.
// Authored SSR checks. Run only with Parent's dependency/heavy-slot grant.
// The physical registry is deliberately unavailable; no ready controller fake.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {historical as actual,purchaseId} from './rebuild-client-orders-fixture.mjs';
import {createClientOrdersReadController} from '../src/features/orders/read/controller.ts';

const bundle=await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',
  stdin:{resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx',contents:
    "import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{ClientOrdersView}from'./src/features/orders/read/ClientOrdersView.tsx';export const render=(props)=>renderToStaticMarkup(React.createElement(ClientOrdersView,props));"},
  bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'}});
const module={exports:{}};
new Function('module','exports','require',bundle.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));
const render=module.exports.render;
globalThis.fetch=async()=>{throw Error('external network denied for Orders SSR');};

for(const route of [{name:'orders'},{name:'order',orderId:purchaseId}])test('actual '+route.name+' SSR is inert and never fills unavailable records with demo content',async t=>{
  const f=await actual(t),controller=createClientOrdersReadController(f.runtime);t.after(()=>controller.dispose());
  const props={controller,route,onOpenPurchase(){throw Error('SSR navigation');},onBack(){throw Error('SSR navigation');}};
  const before=f.calls.length,initial=render(props);
  assert.match(initial,/orders/);assert.match(initial,/not loaded/);
  assert.doesNotMatch(initial,/no recorded purchases|Recorded Product|Maya|quote being prepared|not started|request return|pay now|<nav|<aside/);
  assert.equal(f.calls.length,before);
  await controller.load();const html=render(props);
  assert.match(html,/orders are unavailable/);
  assert.doesNotMatch(html,/no recorded purchases|Recorded Product|Maya|quote being prepared|not started|request return|pay now/);
  assert.equal(f.calls.length,before);
});
test('an ended actual controller renders no purchase or return details',async t=>{
  const f=await actual(t),controller=createClientOrdersReadController(f.runtime);controller.dispose();
  const html=render({controller,route:{name:'orders'},onOpenPurchase(){},onBack(){}});
  assert.match(html,/orders view is closed/);assert.match(html,/recorded purchases and return history/);
  assert.doesNotMatch(html,/no recorded purchases|Recorded Product|saved return conditions|retailer funds/);
  assert.equal(f.calls.length,1);
});
