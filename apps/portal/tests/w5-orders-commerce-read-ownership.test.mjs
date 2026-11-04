import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createOrdersController} from '../src/features/orders/controller.ts';
import {createCommercePort} from '../src/features/orders/port.ts';
import {hashFrozenCommerceTerms} from '../../../src/contracts/PortalCommerceMapping.ts';
import {quoteFixture,finiteRequest,owner,id} from './w5-orders-commerce-fixtures.mjs';
// Actual current controller/port/Root session and codecs with finite synthetic
// request replies only. No real Auth, transport endpoint, hydration or finance.
test('a newer open from old-read abort cleanup keeps the read claim',async t=>{
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{
  assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'SYNTHETIC-w7-read-claim',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 }});t.after(()=>runtime.dispose());await runtime.restore();
 const qA=await quoteFixture(),qB=await quoteFixture();qB.header.target.quoteId=id(22);
 qB.header.target.termsHash=await hashFrozenCommerceTerms(qB.header,qB.lines,qB.options);
 const a={kind:'quote',id:qA.header.target.quoteId,revision:1},b={kind:'quote',id:qB.header.target.quoteId,revision:1};
 const index=[a,b].map(entity=>({entity,label:'Exact '+entity.id,state:'awaiting_acceptance',recordedAt:qA.header.issuedAt}));
 const requestA=finiteRequest(qA,{index}),requestB=finiteRequest(qB,{index}),calls=[],trace=[];let previousSignal,newer;
 const port=createCommercePort(runtime,{family:'commerce-v1',async execute(c,options){
  calls.push(c);if(c.action==='read_commerce_v1'&&!previousSignal)previousSignal=options.signal;
  if(c.action==='read_commerce_detail_v1')trace.push('read:'+c.entity.id);
  return (c.entity?.id===b.id||c.quote?.target?.quoteId===b.id?requestB:requestA).execute(c,options);
 }});
 const controller=createOrdersController({port,session:runtime.getSnapshot().boundary,ownerId:owner,mode:'client',contextKey:'w7-read-claim'});t.after(()=>controller.dispose());
 await controller.refresh();assert.equal(controller.getSnapshot().index.entries.length,2);assert.ok(previousSignal);
 previousSignal.addEventListener('abort',()=>{trace.push('newer-open-B');newer=controller.open(b);},{once:true});
 trace.push('older-open-A');await controller.open(a);assert.ok(newer);await newer;
 const state=controller.getSnapshot();const writes=calls.filter(c=>!c.action.startsWith('read_')).length;
 t.diagnostic(JSON.stringify({trace,phase:state.phase,selectedId:state.selection?.entity.id,expectedNewerId:b.id,writes,cookie:runtime.cookie.status}));
 assert.equal(writes,0);assert.equal(runtime.cookie.status,'ready');assert.equal(state.phase,'ready');
 assert.equal(state.selection?.entity.id,b.id,'the older begin continuation must not steal the newer read claim after abort cleanup');
});

// Owner current-only callback schedules. Same finite source boundary as above.
async function readFixture(t){
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'SYNTHETIC-read-ownership',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});}});t.after(()=>runtime.dispose());await runtime.restore();
 const quotes=await Promise.all([quoteFixture(),quoteFixture(),quoteFixture()]);quotes[1].header.target.quoteId=id(22);quotes[2].header.target.quoteId=id(23);
 for(const q of quotes)q.header.target.termsHash=await hashFrozenCommerceTerms(q.header,q.lines,q.options);
 const refs=quotes.map(q=>({kind:'quote',id:q.header.target.quoteId,revision:1})),index=refs.map(entity=>({entity,label:'Exact quote',state:'awaiting_acceptance',recordedAt:quotes[0].header.issuedAt})),requests=quotes.map(q=>finiteRequest(q,{index})),calls=[],signals=[];
 const port=createCommercePort(runtime,{family:'commerce-v1',async execute(c,options){calls.push(c);signals.push(options.signal);const target=c.entity?.id??c.quote?.target?.quoteId;const i=Math.max(0,refs.findIndex(ref=>ref.id===target));return requests[i].execute(c,options);}});
 const controller=createOrdersController({port,session:runtime.getSnapshot().boundary,ownerId:owner,mode:'client',contextKey:'read-ownership-source'});t.after(()=>controller.dispose());await controller.refresh();return {controller,runtime,calls,signals,a:refs[0],b:refs[1],c:refs[2]};
}
const detailIds=f=>f.calls.filter(c=>c.action==='read_commerce_detail_v1').map(c=>c.entity.id);
const writes=f=>f.calls.filter(c=>!c.action.startsWith('read_'));
test('a newer open from abort cleanup also supersedes the older refresh',async t=>{
 const f=await readFixture(t);let newer;f.signals[0].addEventListener('abort',()=>{newer=f.controller.open(f.b);},{once:true});
 await f.controller.refresh();await newer;assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);assert.deepEqual(detailIds(f),[f.b.id]);assert.equal(f.calls.filter(c=>c.action==='read_commerce_v1').length,1);assert.equal(writes(f).length,0);
});
test('a newest open from a loading observer supersedes both older begin continuations',async t=>{
 const f=await readFixture(t);let b,c,started=false;
 const stop=f.controller.subscribe(()=>{if(!started&&f.controller.getSnapshot().phase==='loading'){started=true;c=f.controller.open(f.c);}});t.after(stop);
 f.signals[0].addEventListener('abort',()=>{b=f.controller.open(f.b);},{once:true});await f.controller.open(f.a);await b;await c;
 assert.equal(f.controller.getSnapshot().selection.entity.id,f.c.id);assert.deepEqual(detailIds(f),[f.c.id]);assert.equal(writes(f).length,0);
});
async function pendingWithReentry(f,t){
 await f.controller.open(f.a);f.controller.reviewQuote();const pending=f.controller.acceptQuote();assert.equal(f.controller.getSnapshot().pending?.dispatched,false);let newer,started=false;
 const stop=f.controller.subscribe(()=>{if(!started&&!f.controller.getSnapshot().pending){started=true;newer=f.controller.open(f.b);}});t.after(stop);return {pending,getNewer:()=>newer};
}
test('a newer open from unsent-intent cancellation supersedes the older open',async t=>{
 const f=await readFixture(t),p=await pendingWithReentry(f,t);await f.controller.open(f.a);await p.pending;await p.getNewer();
 assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);assert.equal(f.controller.getSnapshot().pending,null);assert.deepEqual(detailIds(f),[f.a.id,f.b.id]);assert.equal(writes(f).length,0);
 await f.controller.refresh();assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);
});
test('an older close cannot erase a newer open started by unsent-intent cancellation',async t=>{
 const f=await readFixture(t),p=await pendingWithReentry(f,t);f.controller.close();await p.pending;await p.getNewer();
 assert.equal(f.controller.getSnapshot().selection?.entity.id,f.b.id);assert.equal(f.controller.getSnapshot().phase,'ready');assert.equal(writes(f).length,0);
 await f.controller.refresh();assert.equal(f.controller.getSnapshot().selection?.entity.id,f.b.id);
});
test('terminal disposal from previous-read abort cannot acquire another fixed read',async t=>{
 const f=await readFixture(t);let later;f.signals[0].addEventListener('abort',()=>{f.controller.dispose();later=f.controller.open(f.b);},{once:true});await f.controller.open(f.a);await later;
 assert.equal(f.controller.getSnapshot().phase,'ended');assert.equal(f.controller.getSnapshot().selection,null);assert.equal(f.calls.length,1);assert.equal(f.runtime.cookie.status,'ready');
});
