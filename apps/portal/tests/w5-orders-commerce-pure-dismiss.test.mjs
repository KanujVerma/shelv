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

// Current-only controlled scheduling of the actual installed React DEV
// reducer contract: the first updater invocation is discarded, the second
// supplies the result when no eager state was calculated. No hydration claim.
test('current sheet dismissal remains closed when React replays a functional updater',async t=>{
 const f=await fixture(t),ready=await f.settle(f.a);view(ready).onSheet('review');
 assert.ok(f.render(f.a).props.children[1]);
 const originalState=f.h.state.bind(f.h);let replayed=0;
 f.h.state=initial=>{const [value,set]=originalState(initial);return [value,update=>set(typeof update==='function'?prior=>{replayed++;update(prior);return update(prior);}:update)];};
 const current=f.render(f.a).props.children[1];assert.equal(current.props.canClose(),true);
 current.props.children.props.onDone();const after=f.render(f.a);
 t.diagnostic(JSON.stringify({replayed,currentSheetStillOpen:after.props.children[1]!==null,selectedId:f.controller.getSnapshot().selection.entity.id,writes:f.calls.filter(c=>!c.action.startsWith('read_')).length}));
 assert.equal(replayed,1);assert.equal(f.controller.getSnapshot().selection.entity.id,f.a.id);
 assert.equal(f.calls.filter(c=>!c.action.startsWith('read_')).length,0);
 assert.equal(after.props.children[1],null,'the current owned sheet should close after a replayed state updater');
});
