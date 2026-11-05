import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {quoteFixture,purchaseFixture,snapshot,owner} from './w5-orders-commerce-fixtures.mjs';
const output=await build({absWorkingDir:new URL('../',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{contents:"export {OrdersView} from './src/features/orders/OrdersPage.tsx';",resolveDir:new URL('../',import.meta.url).pathname,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',external:['react','react-dom/server'],loader:{'.css':'empty'}});
const module={exports:{}};new Function('require','module','exports',output.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
test('a use row from a different immutable publication cannot render under this purchase selection',async()=>{
 const q=await quoteFixture(),purchase=purchaseFixture(q),selection=q.lines[0].selection;
 const use={product:{kind:'plan_product',publication:{version:selection.publication.version-1,documentSchemaVersion:selection.publication.documentSchemaVersion},productId:selection.productId,slotId:null},state:'not_reported',originalStart:{state:'unknown'},latestEvent:null,identity:null,contradiction:false};
 const state={phase:'ready',index:null,selection:{entity:{kind:'purchase',id:purchase.id,revision:0},snapshot,detail:purchase,quote:null,history:[]},reviewed:false,pending:null,notice:null,mode:'client',available:true};
 const useDisplay={clientId:owner,selection,view:{status:'available',use}};
 const html=renderToStaticMarkup(createElement(module.exports.OrdersView,{state,useDisplay}));
 assert.match(html,/actual use is not supplied by this order record/);
 assert.doesNotMatch(html,/use not reported/);
});
// Owner successor controls; the original W7 program above is byte-identical.
const {id,instant,known}=await import('./w5-orders-commerce-fixtures.mjs');
async function currentView(){
 const q=await quoteFixture(),purchase=purchaseFixture(q),selection=q.lines[0].selection;
 const use={product:{kind:'plan_product',publication:{...selection.publication},productId:selection.productId,slotId:null},state:'not_reported',originalStart:{state:'unknown'},latestEvent:null,identity:null,contradiction:false};
 return {state:{phase:'ready',index:null,selection:{entity:{kind:'purchase',id:purchase.id,revision:0},snapshot,detail:purchase,quote:null,history:[]},reviewed:false,pending:null,notice:null,mode:'client',available:true},display:{clientId:owner,selection,view:{status:'available',use}}};
}
const render=({state,display})=>renderToStaticMarkup(createElement(module.exports.OrdersView,{state,useDisplay:display}));
test('current use reference also requires the exact immutable document schema',async()=>{
 const value=await currentView();value.display.view.use.product.publication.documentSchemaVersion=2;
 const html=render(value);assert.match(html,/actual use is not supplied by this order record/);assert.doesNotMatch(html,/use not reported/);
});
test('missing current reference publication stays unavailable instead of presenting a use state',async()=>{
 const value=await currentView();delete value.display.view.use.product.publication;
 const html=render(value);assert.match(html,/actual use is not supplied by this order record/);assert.doesNotMatch(html,/use not reported/);
});
test('matching outer selection cannot substitute for a different inner current product identity',async()=>{
 const value=await currentView();value.display.view.use.product.productId='different-current-product';
 const html=render(value);assert.match(html,/actual use is not supplied by this order record/);assert.doesNotMatch(html,/use not reported/);
});
test('matching current reference preserves legitimately older latest-event publication and all provenance unchanged',async()=>{
 const value=await currentView(),use=value.display.view.use;use.state='stopped';use.originalStart=known('2026-10-01');use.contradiction=true;
 use.latestEvent={eventId:id(80),product:{...use.product,publication:{version:1,documentSchemaVersion:3}},changeKind:'stopped',acquisition:'self',identityEventId:null,originalActivationId:null,amendment:null,occurredOn:{state:'unknown'},reportedBy:owner,recordedBy:id(9),recordedAt:instant,channel:'text',sourcePublication:{version:1,documentSchemaVersion:3}};
 const original=structuredClone(value.display),html=render(value);assert.match(html,/reported stopped/);assert.match(html,/reported original start: 2026-10-01/);assert.match(html,/product or reports need clarification/);assert.match(html,/recorded by advisor/);assert.match(html,/occurred date not known/);assert.doesNotMatch(html,/actual use is not supplied by this order record/);assert.deepEqual(value.display,original);
});
