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

// Current R7 controlled source-render observation only. No hydration, real Auth,
// finance workflow, browser, external network or stopped-head execution.
test('a new requested B stays masked through cancellation notifications from an unsent A intent',async t=>{
 const f=await fixture(t);await f.settle(f.a);f.controller.reviewQuote();
 const writing=f.controller.acceptQuote();
 assert.equal(f.controller.getSnapshot().pending?.phase,'sending');
 assert.equal(f.controller.getSnapshot().pending?.dispatched,false,'the intent is still before raw dispatch');
 const observed=[];let watching=false;
 const off=f.controller.subscribe(()=>{
  const state=f.controller.getSnapshot();
  if(watching&&state.phase==='ready'&&state.selection?.entity.id===f.a.id&&state.pending===null){
   const rendered=f.render(f.b);observed.push({phase:view(rendered).state.phase,visible:view(rendered).state.selection?.entity??null});
  }
 });t.after(off);
 const first=f.render(f.b);assert.equal(view(first).state.selection,null,'B masks A before effects');
 watching=true;f.h.flush();
 await f.settle(f.b);await writing;watching=false;
 assert.equal(f.controller.getSnapshot().selection?.entity.id,f.b.id,'the new B eventually loads');
 assert.equal(f.calls.filter(c=>!c.action.startsWith('read_')).length,0,'the old write was never dispatched');
 t.diagnostic(JSON.stringify({requested:f.b,observedDuringCancel:observed,final:f.controller.getSnapshot().selection?.entity,writes:0}));
 assert.equal(observed.filter(x=>x.visible!==null).length,0,'a cancellation observer must not render old A after B was requested');
});

// Owner extensions on the corrected successor. The original committed W7
// program is an unchanged byte prefix; stopped R7 is never executed here.
function unsent(f){f.controller.reviewQuote();const writing=f.controller.acceptQuote();assert.equal(f.controller.getSnapshot().pending?.dispatched,false);return writing;}
async function finishSwitch(f,writing){const before=f.render(f.b);assert.equal(view(before).state.selection,null);f.h.flush();await f.settle(f.b);await writing;assert.equal(f.controller.getSnapshot().selection?.entity.id,f.b.id);assert.equal(f.calls.filter(c=>!c.action.startsWith('read_')).length,0);}
test('every cancellation/loading/accepted subscriber snapshot keeps A hidden until matching B',async t=>{
 const f=await fixture(t);await f.settle(f.a);const writing=unsent(f),seen=[];let watching=true;
 const off=f.controller.subscribe(()=>{if(watching){const rendered=f.render(f.b);seen.push({phase:view(rendered).state.phase,id:view(rendered).state.selection?.entity.id??null});}});t.after(off);
 await finishSwitch(f,writing);watching=false;assert.ok(seen.some(x=>x.id===null));assert.ok(seen.some(x=>x.id===f.b.id));assert.equal(seen.some(x=>x.id===f.a.id),false);
});
test('an actual native abort listener sees the requested-target mask before loading clears old A',async t=>{
 const f=await fixture(t);await f.settle(f.a);const writing=unsent(f),seen=[];let watching=true;const original=AbortController.prototype.abort;
 AbortController.prototype.abort=function(...args){if(watching&&!this.signal.aborted)this.signal.addEventListener('abort',()=>{if(watching)seen.push(view(f.render(f.b)).state.selection?.entity.id??null);},{once:true});return original.apply(this,args);};
 t.after(()=>{AbortController.prototype.abort=original;});
 try{await finishSwitch(f,writing);}finally{watching=false;AbortController.prototype.abort=original;}
 assert.ok(seen.length>0,'the real abort notification was observed');assert.equal(seen.includes(f.a.id),false);
});
test('a cancellation observer flushing current effects cannot recursively open B or expose A',async t=>{
 const f=await fixture(t);await f.settle(f.a);const writing=unsent(f),seen=[];let watching=true;
 const off=f.controller.subscribe(()=>{const state=f.controller.getSnapshot();if(watching&&state.phase==='ready'&&state.selection?.entity.id===f.a.id&&state.pending===null){seen.push(view(f.render(f.b)).state.selection);f.h.flush();}});t.after(off);
 await finishSwitch(f,writing);watching=false;assert.ok(seen.length>0);assert.equal(seen.some(Boolean),false);assert.equal(f.opened.filter(x=>x.id===f.b.id).length,1);
});
test('after actual B acceptance the mask releases and local Back remains usable without reselecting B',async t=>{
 const f=await fixture(t);await f.settle(f.a);const writing=unsent(f);await finishSwitch(f,writing);const accepted=await f.settle(f.b);assert.equal(view(accepted).state.selection?.entity.id,f.b.id);f.controller.close();const index=await f.settle({...f.b});assert.equal(f.controller.getSnapshot().selection,null);assert.equal(view(index).state.selection,null);assert.equal(view(index).state.phase,'ready');assert.equal(f.opened.filter(x=>x.id===f.b.id).length,1);
});
