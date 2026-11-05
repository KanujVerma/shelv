// Controlled React hook/effect scheduler + real Orders controller/port/codecs.
// These finite source cases are not hydrated React/browser/Auth/finance proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {quoteFixture,finiteRequest,runtime,boundary,owner,id} from './w5-orders-commerce-fixtures.mjs';
import {createOrdersController} from '../src/features/orders/controller.ts';
import {createCommercePort} from '../src/features/orders/port.ts';
import {hashFrozenCommerceTerms} from '../../../src/contracts/PortalCommerceMapping.ts';
const hookKey='__w5OrdersSelectionHooks';
const output=await build({absWorkingDir:new URL('../',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',entryPoints:['src/features/orders/OrdersPage.tsx'],bundle:true,write:false,platform:'node',format:'cjs',external:['react','react-dom/server'],loader:{'.css':'empty'},plugins:[{name:'controlled-page-hooks',setup(b){
 b.onLoad({filter:/\/features\/orders\/OrdersPage\.tsx$/},async args=>({contents:(await readFile(args.path,'utf8')).replace("from 'react';","from 'w5-controlled-page-hooks';"),loader:'tsx'}));
 b.onResolve({filter:/^w5-controlled-page-hooks$/},()=>({path:'hooks',namespace:'w5-hooks'}));
 b.onLoad({filter:/.*/,namespace:'w5-hooks'},()=>({contents:`export const useEffect=(...a)=>globalThis.${hookKey}.effect(...a);export const useState=(...a)=>globalThis.${hookKey}.state(...a);export const useSyncExternalStore=(_s,get)=>globalThis.${hookKey}.read(get);export const useRef=(...a)=>globalThis.${hookKey}.ref(...a);`,loader:'js'}));
}}]});
const api={exports:{}};new Function('require','module','exports',output.outputFiles[0].text)(createRequire(import.meta.url),api,api.exports);
function hooks(){
 let cursor=0;const values=[],deps=[],cleanups=[],effects=[];
 return {reset(){cursor=0;},read(get){cursor++;return get();},state(initial){const i=cursor++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return [values[i],value=>{values[i]=typeof value==='function'?value(values[i]):value;}];},ref(initial){const i=cursor++;if(!(i in values))values[i]={current:initial};return values[i];},effect(fn,next){const i=cursor++,prior=deps[i];if(!prior||next.some((value,n)=>value!==prior[n])){deps[i]=next;effects.push(()=>{cleanups[i]?.();const cleanup=fn();cleanups[i]=typeof cleanup==='function'?cleanup:undefined;});}},flush(){for(const effect of effects.splice(0))effect();},get queued(){return effects.length;}};
}
async function fixture(t){
 const qA=await quoteFixture(),qB=await quoteFixture();qA.lines[0].identity.name='Exact Product A';qB.lines[0].identity.name='Exact Product B';qB.header.target.quoteId=id(22);
 for(const q of [qA,qB])q.header.target.termsHash=await hashFrozenCommerceTerms(q.header,q.lines,q.options);
 const a={kind:'quote',id:qA.header.target.quoteId,revision:1},b={kind:'quote',id:qB.header.target.quoteId,revision:1},index=[{entity:a,label:'Exact quote A',state:'awaiting_acceptance',recordedAt:qA.header.issuedAt},{entity:b,label:'Exact quote B',state:'awaiting_acceptance',recordedAt:qB.header.issuedAt}],requestA=finiteRequest(qA,{index}),requestB=finiteRequest(qB,{index}),calls=[];
 const request={family:'commerce-v1',async execute(c,options){calls.push(c);return (c.entity?.id===b.id||c.quote?.target?.quoteId===b.id?requestB:requestA).execute(c,options);}},session=boundary(),real=createOrdersController({port:createCommercePort(runtime(session),request),session,ownerId:owner,mode:'client',contextKey:'controlled-selection-source'}),pending=[],opened=[];
 const controller={...real,refresh(){const p=real.refresh();pending.push(p);return p;},open(ref){opened.push({...ref});const p=real.open(ref);pending.push(p);return p;}};
 const h=hooks();globalThis[hookKey]=h;t.after(()=>{delete globalThis[hookKey];real.dispose();});
 function render(selected){h.reset();return api.exports.OrdersPage({controller,selected});}
 async function settle(selected){let tree;for(let i=0;i<8;i++){tree=render(selected);if(!h.queued&&!pending.length)return tree;h.flush();await Promise.all(pending.splice(0));}throw Error('controlled page did not settle');}
 return {a,b,controller,opened,calls,qA,qB,render,settle,h};
}
const view=tree=>tree.props.children[0].props;
test('a changed selected entity opens B even when the retained controller already holds A',async t=>{
 const f=await fixture(t);await f.settle(f.a);assert.equal(f.controller.getSnapshot().selection.entity.id,f.a.id);await f.settle(f.b);assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);assert.equal(f.controller.getSnapshot().selection.detail.target.quoteId,f.b.id);assert.equal(f.opened.filter(x=>x.id===f.b.id).length,1);
});
test('requested B masks A financial details before selection effects have run',async t=>{
 const f=await fixture(t);await f.settle(f.a);const tree=f.render(f.b);assert.equal(view(tree).state.selection,null);assert.equal(view(tree).state.reviewed,false);assert.equal(view(tree).state.phase,'loading');
});
test('a new reference object with the same exact entity does not reload the existing selection',async t=>{
 const f=await fixture(t);await f.settle(f.a);const before=f.calls.length;await f.settle({...f.a});assert.equal(f.calls.length,before);assert.equal(f.controller.getSnapshot().selection.entity.id,f.a.id);
});
test('a requested entity absent from the observed index cannot display A as its fallback',async t=>{
 const f=await fixture(t);await f.settle(f.a);const tree=f.render({kind:'quote',id:id(91),revision:1});assert.equal(view(tree).state.selection,null);assert.equal(view(tree).state.phase,'unavailable');assert.equal(f.controller.getSnapshot().selection.entity.id,f.a.id,'masking makes no new financial read or absence claim');
});
test('changing the requested target immediately hides an already open A sheet',async t=>{
 const f=await fixture(t);const current=await f.settle(f.a);view(current).onSheet('product',f.qA.lines[0]);const a=f.render(f.a);assert.ok(a.props.children[1],'the current A product sheet was opened');const b=f.render(f.b);assert.equal(b.props.children[1],null);assert.equal(view(b).state.selection,null);
});
test('a retained old A sheet callback cannot open its product line after B becomes current',async t=>{
 const f=await fixture(t),a=await f.settle(f.a),oldOpen=view(a).onSheet;await f.settle(f.b);oldOpen('product',f.qA.lines[0]);const b=f.render(f.b);assert.equal(b.props.children[1],null);assert.equal(view(b).state.selection.entity.id,f.b.id);
});
test('a changed revision or kind is not silently treated as the already loaded financial entity',async t=>{
 const f=await fixture(t);await f.settle(f.a);for(const selected of [{...f.a,revision:2},{...f.a,kind:'purchase'}]){const next=f.render(selected);assert.equal(view(next).state.selection,null);assert.equal(view(next).state.phase,'unavailable');}
});
test('viewing requested B leaves an uncertain original A command UUID and immutable target untouched',async t=>{
 const f=await fixture(t);await f.settle(f.a);f.controller.reviewQuote();await f.controller.acceptQuote();const original=structuredClone(f.controller.getSnapshot().pending.command);await f.controller.refresh();await f.settle(f.b);assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);assert.deepEqual(f.controller.getSnapshot().pending.command,original);assert.equal(original.quote.quoteId,f.a.id);assert.equal(f.calls.filter(c=>c.action==='accept_product_quote_v1').length,1);
});
