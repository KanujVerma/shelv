import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createOrdersController} from '../src/features/orders/controller.ts';
import {createCommercePort} from '../src/features/orders/port.ts';
import {hashFrozenCommerceTerms} from '../../../src/contracts/PortalCommerceMapping.ts';
import {quoteFixture,purchaseFixture,finiteRequest,owner,id} from './w5-orders-commerce-fixtures.mjs';
// Explicit adversarial currentness callback around the actual native boundary.
// The controller's public boundary seam is wrapped; actual runtime/port/SDK are
// unchanged. This does NOT claim native isCurrent calls a consumer callback.
test('older original-quote read cannot claim after currentness starts a newer open',async t=>{
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{
  assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'SYNTHETIC-w7-original-read-claim',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 }});t.after(()=>runtime.dispose());await runtime.restore();
 const qA=await quoteFixture(),qB=await quoteFixture();qB.header.target.quoteId=id(22);qB.header.target.termsHash=await hashFrozenCommerceTerms(qB.header,qB.lines,qB.options);
 const purchase=purchaseFixture(qA),a={kind:'purchase',id:purchase.id,revision:purchase.revision},b={kind:'quote',id:qB.header.target.quoteId,revision:1},original={kind:'quote',id:qA.header.target.quoteId,revision:1};
 const index=[a,b,original].map(entity=>({entity,label:'Exact '+entity.id,state:'awaiting_acceptance',recordedAt:qA.header.issuedAt}));
 const pReq=finiteRequest(qA,{index,detail:purchase}),aReq=finiteRequest(qA,{index}),bReq=finiteRequest(qB,{index}),calls=[],trace=[];
 const port=createCommercePort(runtime,{family:'commerce-v1',async execute(c,o){calls.push(c);if(c.action==='read_commerce_detail_v1')trace.push('read:'+c.entity.kind+':'+c.entity.id);return (c.entity?.kind==='purchase'?pReq:c.entity?.id===b.id||c.quote?.target?.quoteId===b.id?bReq:aReq).execute(c,o);}});
 const native=runtime.getSnapshot().boundary;let onCurrent;
 const session={...native,isCurrent(){const callback=onCurrent;onCurrent=undefined;callback?.();return native.isCurrent();}};
 const controller=createOrdersController({port,session,ownerId:owner,mode:'client',contextKey:'w7-original-read-claim'});t.after(()=>controller.dispose());
 await controller.refresh();await controller.open(a);assert.equal(controller.getSnapshot().selection.detail.kind,'purchase');trace.length=0;
 let newer;onCurrent=()=>{trace.push('newer-open-B');newer=controller.open(b);};
 trace.push('older-original-quote');await controller.openOriginalQuote();assert.ok(newer);await newer;
 const state=controller.getSnapshot(),writes=calls.filter(c=>!c.action.startsWith('read_')).length;
 t.diagnostic(JSON.stringify({trace,phase:state.phase,selectedId:state.selection?.entity.id,expectedNewerId:b.id,writes,cookie:runtime.cookie.status,controllerCurrentnessWrapper:true}));
 assert.equal(writes,0);assert.equal(runtime.cookie.status,'ready');assert.equal(state.phase,'ready');
 assert.equal(state.selection?.entity.id,b.id,'the older original-quote continuation must not supersede the newer open started during its currentness check');
});

// Owner source schedules: actual native runtime/port/codecs, explicit controller
// currentness wrapper. No assertion that native isCurrent calls consumers.
async function entryFixture(t,{paged=true}={}){
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'SYNTHETIC-entrypoints',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});}});t.after(()=>runtime.dispose());await runtime.restore();
 const qA=await quoteFixture(),qB=await quoteFixture();qB.header.target.quoteId=id(22);qB.header.target.termsHash=await hashFrozenCommerceTerms(qB.header,qB.lines,qB.options);
 const purchase=purchaseFixture(qA),a={kind:'purchase',id:purchase.id,revision:purchase.revision},b={kind:'quote',id:qB.header.target.quoteId,revision:1},original={kind:'quote',id:qA.header.target.quoteId,revision:1};
 const refs=[a,b,original,...(paged?Array.from({length:98},(_,i)=>({kind:'quote',id:id(1000+i),revision:1})):[])],index=refs.map(entity=>({entity,label:'Exact indexed record',state:'awaiting_acceptance',recordedAt:qA.header.issuedAt}));
 const pReq=finiteRequest(qA,{index,detail:purchase}),aReq=finiteRequest(qA,{index}),bReq=finiteRequest(qB,{index}),calls=[],signals=[];let beforeRequest,afterResponse,onCurrent;
 const port=createCommercePort(runtime,{family:'commerce-v1',async execute(c,o){calls.push(c);signals.push(o.signal);await beforeRequest?.(c,o);const raw=await (c.entity?.kind==='purchase'?pReq:c.entity?.id===b.id||c.quote?.target?.quoteId===b.id?bReq:aReq).execute(c,o);afterResponse?.(c,o);return raw;}});
 const native=runtime.getSnapshot().boundary,session={...native,isCurrent(){const callback=onCurrent;onCurrent=undefined;callback?.();return native.isCurrent();}};
 const controller=createOrdersController({port,session,ownerId:owner,mode:'client',contextKey:'entrypoint-source'});t.after(()=>controller.dispose());await controller.refresh();await controller.open(a);calls.length=0;
 return {controller,runtime,calls,signals,a,b,original,qA,arm(callback){onCurrent=callback;},before(callback){beforeRequest=callback;},after(callback){afterResponse=callback;}};
}
const details=f=>f.calls.filter(c=>c.action==='read_commerce_detail_v1').map(c=>c.entity.id);
const writeCalls=f=>f.calls.filter(c=>!c.action.startsWith('read_'));
for(const entry of ['refresh','loadMore','open','openOriginalQuote'])test('currentness-created newer B owns the '+entry+' entrypoint',async t=>{
 const f=await entryFixture(t);assert.ok(f.controller.getSnapshot().index.nextCursor);let newer;
 f.arm(()=>{newer=f.controller.open(f.b);});await (entry==='open'?f.controller.open(f.original):f.controller[entry]());assert.ok(newer);await newer;
 assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);assert.deepEqual(details(f),[f.b.id]);assert.equal(writeCalls(f).length,0);assert.equal(f.runtime.cookie.status,'ready');
 await f.controller.refresh();assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id,'refresh retains the newer exact selected target');
});
test('normal exact original quote and close/back remain usable',async t=>{
 const f=await entryFixture(t);await f.controller.openOriginalQuote();const state=f.controller.getSnapshot();assert.equal(state.selection.entity.id,f.original.id);assert.equal(state.selection.quote.header.target.termsHash,f.qA.header.target.termsHash);
 f.controller.close();assert.equal(f.controller.getSnapshot().selection,null);assert.equal(f.controller.getSnapshot().phase,'ready');await f.controller.open(f.a);await f.controller.openOriginalQuote();assert.equal(f.controller.getSnapshot().selection.entity.id,f.original.id);assert.equal(writeCalls(f).length,0);
});
test('ineligible view reads remain no-ops while a valid newer open is in flight',async t=>{
 const f=await entryFixture(t,{paged:false});let release,started;const gate=new Promise(r=>release=r),begun=new Promise(r=>started=r);
 f.before(async c=>{if(c.action==='read_commerce_detail_v1'&&c.entity.id===f.b.id){started();await gate;}});
 const newer=f.controller.open(f.b);await begun;
 await f.controller.openOriginalQuote();await f.controller.loadMore();await f.controller.open({kind:'quote',id:id(9999),revision:1});release();await newer;
 assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);assert.deepEqual(details(f),[f.b.id]);assert.equal(writeCalls(f).length,0);
});
test('abort cleanup from original quote navigation preserves a newer open',async t=>{
 const f=await entryFixture(t);let newer;f.signals.at(-1).addEventListener('abort',()=>{newer=f.controller.open(f.b);},{once:true});await f.controller.openOriginalQuote();assert.ok(newer);await newer;
 assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);assert.deepEqual(details(f),[f.b.id]);assert.equal(writeCalls(f).length,0);
});
test('loading observers can replace original quote navigation before raw read',async t=>{
 const f=await entryFixture(t);let newer,started=false;const stop=f.controller.subscribe(()=>{if(!started&&f.controller.getSnapshot().phase==='loading'){started=true;newer=f.controller.open(f.b);}});t.after(stop);await f.controller.openOriginalQuote();assert.ok(newer);await newer;
 assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);assert.deepEqual(details(f),[f.b.id]);assert.equal(writeCalls(f).length,0);
});
test('a read-state emission rechecks ownership after its currentness callback',async t=>{
 const f=await entryFixture(t);let newer,armed=false,started=false,stale=0;
 f.after(c=>{if(!armed&&c.action==='read_commerce_history_v1'&&c.entity.id===f.original.id){armed=true;f.arm(()=>f.arm(()=>{started=true;newer=f.controller.open(f.b);}));}});
 const stop=f.controller.subscribe(()=>{const s=f.controller.getSnapshot();if(started&&s.phase==='ready'&&s.selection?.entity.id===f.original.id)stale++;});t.after(stop);
 await f.controller.openOriginalQuote();assert.ok(newer);await newer;
 assert.equal(stale,0);assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);assert.equal(writeCalls(f).length,0);
});
