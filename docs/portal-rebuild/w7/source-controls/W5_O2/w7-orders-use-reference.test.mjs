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
