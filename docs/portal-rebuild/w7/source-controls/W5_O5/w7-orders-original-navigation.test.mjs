// Controlled React hook/effect scheduler + real Orders controller/port/codecs.
// These finite source cases are not hydrated React/browser/Auth/finance proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {quoteFixture,purchaseFixture,finiteRequest,runtime,boundary,owner,id} from './w5-orders-commerce-fixtures.mjs';
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

// W7 current-bb1-only ordinary UI navigation control. Controlled hook scheduling,
// runtime-shaped session + actual Orders controller/port/Root codecs; no browser,
// Auth, financial authority or real network execution.
function findButton(node,label){
 if(!node||typeof node!=='object')return null;
 if(node.props?.children===label&&typeof node.props.onClick==='function')return node;
 for(const child of [node.props?.children].flat(Infinity)){const match=findButton(child,label);if(match)return match;}
 return null;
}
test('an internally opened original quote remains visible while the requested purchase prop is unchanged',async t=>{
 const q=await quoteFixture(),purchase=purchaseFixture(q),p={kind:'purchase',id:purchase.id,revision:purchase.revision},quote={kind:'quote',id:q.header.target.quoteId,revision:q.header.target.quoteVersion};
 const index=[{entity:p,label:'Exact purchase',state:'ordered',recordedAt:purchase.recordedAt},{entity:quote,label:'Original quote',state:'awaiting_acceptance',recordedAt:q.header.issuedAt}];
 const purchaseRead=finiteRequest(q,{detail:purchase,index}),quoteRead=finiteRequest(q,{index}),calls=[];
 const request={family:'commerce-v1',async execute(command,options){calls.push(structuredClone(command));return (command.entity?.kind==='purchase'?purchaseRead:quoteRead).execute(command,options);}};
 const session=boundary(),real=createOrdersController({port:createCommercePort(runtime(session),request),session,ownerId:owner,mode:'client',contextKey:'w7-original-quote-source'}),pending=[];
 const controller={...real,refresh(){const value=real.refresh();pending.push(value);return value;},open(ref){const value=real.open(ref);pending.push(value);return value;},openOriginalQuote(){const value=real.openOriginalQuote();pending.push(value);return value;}};
 const h=hooks();globalThis[hookKey]=h;t.after(()=>{delete globalThis[hookKey];real.dispose();});
 const render=()=>{h.reset();return api.exports.OrdersPage({controller,selected:p});};
 async function settle(){let tree;for(let turn=0;turn<8;turn++){tree=render();if(!h.queued&&!pending.length)return tree;h.flush();await Promise.all(pending.splice(0));}throw Error('controlled page did not settle');}
 const first=await settle();assert.equal(real.getSnapshot().selection?.detail.kind,'purchase');
 const detail=api.exports.OrdersView(first.props.children[0].props),button=findButton(detail,'view complete original quote');assert.ok(button,'the actual purchase view offers the original quote button');
 button.props.onClick();await Promise.all(pending.splice(0));
 assert.equal(real.getSnapshot().selection?.detail.kind,'quote','the existing controller successfully loaded the original quote');
 const current=await settle();
 t.diagnostic(JSON.stringify({requested:p,final:real.getSnapshot().selection?.entity,visible:current.props.children[0].props.state.selection?.entity??null,detailReads:calls.filter(c=>c.action==='read_commerce_detail_v1').map(c=>c.entity),writes:calls.filter(c=>!c.action.startsWith('read_')).length}));
 assert.equal(real.getSnapshot().selection?.entity.kind,'quote','the original quote read must not be undone by a prop that has not changed');
 assert.deepEqual(current.props.children[0].props.state.selection?.entity,quote);
});
