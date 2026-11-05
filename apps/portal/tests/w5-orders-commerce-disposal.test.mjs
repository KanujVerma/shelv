import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createCommercePort} from '../src/features/orders/port.ts';
import {createOrdersController} from '../src/features/orders/controller.ts';
import {owner,snapshot} from './w5-orders-commerce-fixtures.mjs';
test('disposed Orders controller cannot start a new read while its actual session remains ready',async t=>{
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{
  assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'SYNTHETIC-w7-disposed-orders',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 }});t.after(()=>runtime.dispose());await runtime.restore();let calls=0;
 const port=createCommercePort(runtime,{family:'commerce-v1',async execute(){calls++;return{schemaVersion:1,clientId:owner,snapshot,entries:[],nextCursor:null};}});
 const controller=createOrdersController({port,session:runtime.getSnapshot().boundary,ownerId:owner,mode:'client',contextKey:'W7-source-orders'});t.after(()=>controller.dispose());
 controller.dispose();await controller.refresh();
 assert.equal(runtime.cookie.status,'ready');assert.equal(controller.getSnapshot().phase,'ended');
 assert.equal(calls,0,'permanent controller disposal must deny a fresh fixed-request invocation');
});
// Owner R4 variants below. Original W7 control above is byte-identical.
const {quoteFixture,finiteRequest,entity,purchaseFixture,id,deferred}=await import('./w5-orders-commerce-fixtures.mjs');
async function actual(t,{paging=false,purchase=false}={}){
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'SYNTHETIC-w5-disposal-r4',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});}});t.after(()=>runtime.dispose());await runtime.restore();
 const q=await quoteFixture(),detail=purchase?purchaseFixture(q):q.header,ref=purchase?{kind:'purchase',id:detail.id,revision:0}:entity;
 const index=[{entity:ref,label:'Synthetic exact record',state:'awaiting_acceptance',recordedAt:q.header.issuedAt}],fixed=finiteRequest(q,{detail,index});let calls=0,attempts=0,signal;
 const real=createCommercePort(runtime,{family:'commerce-v1',async execute(c,options){calls++;if(paging&&c.action==='read_commerce_v1')return {schemaVersion:1,clientId:owner,snapshot,entries:index,nextCursor:`c:${snapshot.hash}:${id(20)}:1`};return fixed.execute(c,options);}});
 const port={availability:real.availability,execute(c,options){attempts++;if(options?.signal)signal=options.signal;return real.execute(c,options);}};
 return {runtime,port,q,ref,get calls(){return calls;},get attempts(){return attempts;},get signal(){return signal;}};
}
function controller(t,f,session=f.runtime.getSnapshot().boundary){const c=createOrdersController({port:f.port,session,ownerId:owner,mode:'client',contextKey:'W5-r4-current'});t.after(()=>c.dispose());return c;}
for(const method of ['refresh','loadMore','open','openOriginalQuote'])test(`abort cleanup retiring the controller blocks the fresh ${method} acquisition`,async t=>{
 const f=await actual(t,{paging:method==='loadMore',purchase:method==='openOriginalQuote'}),c=controller(t,f);await c.refresh();if(method==='openOriginalQuote')await c.open(f.ref);const before=f.calls;
 assert.ok(f.signal);f.signal.addEventListener('abort',()=>c.dispose(),{once:true});
 if(method==='open')await c.open(f.ref);else await c[method]();
 assert.equal(f.runtime.cookie.status,'ready');assert.equal(c.getSnapshot().phase,'ended');assert.equal(f.calls,before,'abort cleanup cannot be followed by a new fixed read');
});
test('subscriber disposal when an undispatched write is canceled stops fresh read allocation',async t=>{
 const f=await actual(t),c=controller(t,f);await c.refresh();await c.open(entity);c.reviewQuote();const digest=crypto.subtle.digest,entered=deferred(),held=deferred();let armed=false;const stop=c.subscribe(()=>{if(armed&&c.getSnapshot().pending===null){armed=false;c.dispose();}});t.after(stop);
 crypto.subtle.digest=async function(...args){entered.resolve();await held.promise;return digest.apply(this,args);};let pending;
 try{pending=c.acceptQuote();await entered.promise;armed=true;const before=f.calls;await c.refresh();held.resolve();await pending;assert.equal(c.getSnapshot().phase,'ended');assert.equal(f.calls,before,'canceled-write subscriber cannot precede fresh fixed read');}finally{held.resolve();crypto.subtle.digest=digest;await Promise.allSettled(pending?[pending]:[]);}
});
test('isCurrent callback cannot return a live controller after synchronously disposing it',async t=>{
 const f=await actual(t),actualBoundary=f.runtime.getSnapshot().boundary;let c,armed=false;
 const session={...actualBoundary,isCurrent(){if(armed){armed=false;c.dispose();}return actualBoundary.isCurrent();}};c=controller(t,f,session);armed=true;await c.refresh();assert.equal(c.getSnapshot().phase,'ended');assert.equal(f.calls,0);
});
test('index subscriber disposal stops the next selected-detail port attempt',async t=>{
 const f=await actual(t),c=controller(t,f);await c.refresh();await c.open(entity);const calls=f.calls,attempts=f.attempts;let armed=true;
 const stop=c.subscribe(()=>{const state=c.getSnapshot();if(armed&&state.phase==='ready'&&state.index&&!state.selection){armed=false;c.dispose();}});t.after(stop);await c.refresh();assert.equal(c.getSnapshot().phase,'ended');assert.equal(f.calls,calls+1,'only the preceding index was invoked');assert.equal(f.attempts,attempts+1,'no selected-detail port attempt after subscriber disposal');
});
