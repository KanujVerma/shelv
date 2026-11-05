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
