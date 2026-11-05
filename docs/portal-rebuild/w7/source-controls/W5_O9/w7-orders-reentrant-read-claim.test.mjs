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
