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

// Supported source component callbacks only. No hydration, Root VM, network,
// financial command or private-return authority claim.
test('a retained old A sheet completion cannot close the newer current B sheet',async t=>{
 const f=await fixture(t),a=await f.settle(f.a);view(a).onSheet('review');
 const aPage=f.render(f.a),oldSheet=aPage.props.children[1];assert.ok(oldSheet);
 const oldDone=oldSheet.props.children.props.onDone;assert.equal(typeof oldDone,'function');
 assert.equal(oldSheet.props.children.props.state.selection.entity.id,f.a.id);
 const b=await f.settle(f.b);view(b).onSheet('product',f.qB.lines[0]);
 const before=f.render(f.b);assert.ok(before.props.children[1]);
 assert.equal(before.props.children[1].props.children.props.state.selection.entity.id,f.b.id,'the newer B sheet is open');
 oldDone();const after=f.render(f.b);
 assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);
 assert.equal(f.calls.filter(c=>!c.action.startsWith('read_')).length,0);
 t.diagnostic(JSON.stringify({oldSheetEntity:f.a,currentEntity:f.b,currentSheetClosed:after.props.children[1]===null,writes:0}));
 assert.ok(after.props.children[1],'a stale A completion must not close B');
 assert.equal(after.props.children[1].props.children.props.state.selection.entity.id,f.b.id);
});

// Owner current-successor extensions. The original W7 program above remains
// byte-exact; no stopped R8 or financial submit/child promise executes here.
const sheetOf=tree=>tree.props.children[1];
async function openSheet(f,selected,kind,line){const ready=await f.settle(selected);view(ready).onSheet(kind,line);const tree=f.render(selected);assert.ok(sheetOf(tree));return sheetOf(tree);}
test('a retained old A dismissal cannot close B and its canClose no longer owns the current sheet',async t=>{
 const f=await fixture(t),old=await openSheet(f,f.a,'review');await openSheet(f,f.b,'product',f.qB.lines[0]);assert.equal(old.props.canClose(),false);old.props.onOpenChange(false);const current=sheetOf(f.render(f.b));assert.ok(current);assert.equal(current.props.children.props.state.selection.entity.id,f.b.id);assert.equal(f.calls.filter(c=>!c.action.startsWith('read_')).length,0);
});
test('same-context same-target replacement still has a distinct sheet token',async t=>{
 const f=await fixture(t),old=await openSheet(f,f.a,'review');const current=await openSheet(f,f.a,'product',f.qA.lines[0]);assert.equal(old.props.canClose(),false);old.props.children.props.onDone();old.props.onOpenChange(false);const after=sheetOf(f.render(f.a));assert.ok(after);assert.equal(after.props.children.props.kind,'product');assert.equal(after.props.children.props.line,f.qA.lines[0]);assert.equal(current.props.canClose(),true);
});
test('a current owned sheet completion closes that sheet without changing selection or dispatching',async t=>{
 const f=await fixture(t),current=await openSheet(f,f.a,'product',f.qA.lines[0]),before=f.calls.length;current.props.children.props.onDone();const after=f.render(f.a);assert.equal(sheetOf(after),null);assert.equal(f.controller.getSnapshot().selection.entity.id,f.a.id);assert.equal(f.calls.length,before);
});
test('current dismissal preserves normal close behavior while later retained completion is inert',async t=>{
 const f=await fixture(t),first=await openSheet(f,f.a,'review');assert.equal(first.props.canClose(),true);first.props.onOpenChange(false);assert.equal(sheetOf(f.render(f.a)),null);const second=await openSheet(f,f.a,'product',f.qA.lines[0]);first.props.children.props.onDone();assert.ok(sheetOf(f.render(f.a)));second.props.onOpenChange(false);assert.equal(sheetOf(f.render(f.a)),null);
});
test('a delayed context cleanup cannot erase a newly opened sheet in that same current context',async t=>{
 const f=await fixture(t);await openSheet(f,f.a,'review');const register=f.h.effect;let delayed=null;
 // This controlled scheduler defers only the actual context effect; the
 // component/controller/read path and all other effects remain unchanged.
 f.h.effect=(fn,deps)=>{if(!delayed&&deps.length===2&&deps[0]===f.controller&&typeof deps[1]==='string'&&deps[1].includes(f.b.id)){delayed=fn;register(()=>{},deps);}else register(fn,deps);};
 await openSheet(f,f.b,'product',f.qB.lines[0]);assert.equal(typeof delayed,'function');delayed();const current=sheetOf(f.render(f.b));assert.ok(current);assert.equal(current.props.children.props.state.selection.entity.id,f.b.id);assert.equal(f.calls.filter(c=>!c.action.startsWith('read_')).length,0);
});
test('reopening the same sheet kind and target creates a fresh child generation and refuses old completion',async t=>{
 const f=await fixture(t),first=await openSheet(f,f.a,'review'),second=await openSheet(f,f.a,'review');assert.notEqual(second.props.children.key,first.props.children.key,'fresh review form must not reuse the previous sheet instance');first.props.children.props.onDone();assert.ok(sheetOf(f.render(f.a)));second.props.children.props.onDone();assert.equal(sheetOf(f.render(f.a)),null);
});
