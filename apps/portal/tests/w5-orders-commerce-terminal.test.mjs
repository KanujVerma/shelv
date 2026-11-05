import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createCommercePort} from '../src/features/orders/port.ts';
import {createOrdersController} from '../src/features/orders/controller.ts';
import {owner,snapshot} from './w5-orders-commerce-fixtures.mjs';
test('Orders disposal is already terminal when its existing read abort cleanup runs',async t=>{
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{
  assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'SYNTHETIC-w7-dispose-reentry',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 }});t.after(()=>runtime.dispose());await runtime.restore();let calls=0,signal;
 const port=createCommercePort(runtime,{family:'commerce-v1',async execute(_command,options){calls++;signal=options.signal;return{schemaVersion:1,clientId:owner,snapshot,entries:[],nextCursor:null};}});
 const controller=createOrdersController({port,session:runtime.getSnapshot().boundary,ownerId:owner,mode:'client',contextKey:'W7-disposal-reentry'});t.after(()=>controller.dispose());
 await controller.refresh();const before=calls;assert.equal(before,1);assert.ok(signal);let nested;
 signal.addEventListener('abort',()=>{nested=controller.refresh();},{once:true});
 controller.dispose();await nested;
 assert.equal(runtime.cookie.status,'ready');assert.equal(controller.getSnapshot().phase,'ended');assert.equal(controller.getSnapshot().index,null);
 assert.equal(calls,before,'disposal cleanup cannot acquire a fresh fixed read while the controller is retiring');
});
// Owner R5 terminal-cleanup variants; original W7 program above byte-identical.
const {quoteFixture,finiteRequest,entity,deferred}=await import('./w5-orders-commerce-fixtures.mjs');
async function setup(t,{quote=false,stopHook}={}){
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'SYNTHETIC-w5-terminal-r5',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});}});t.after(()=>runtime.dispose());await runtime.restore();
 const q=quote?await quoteFixture():null,finite=q?finiteRequest(q):null;let calls=0,signal,stops=0,c;
 const port=createCommercePort(runtime,{family:'commerce-v1',async execute(command,options){calls++;signal=options.signal;return finite?finite.execute(command):{schemaVersion:1,clientId:owner,snapshot,entries:[],nextCursor:null};}}),actualBoundary=runtime.getSnapshot().boundary;
 const session={...actualBoundary,subscribeInvalidation(fn){const unsubscribe=actualBoundary.subscribeInvalidation(fn);return()=>{stops++;unsubscribe();stopHook?.(c);};}};
 c=createOrdersController({port,session,ownerId:owner,mode:'client',contextKey:'W5-terminal-r5'});t.after(()=>c.dispose());
 return {runtime,port,controller:c,get calls(){return calls;},get signal(){return signal;},get stops(){return stops;}};
}
test('abort cleanup observes already-ended state with all visible view references detached',async t=>{
 const f=await setup(t);await f.controller.refresh();let during,nested;f.signal.addEventListener('abort',()=>{during=f.controller.getSnapshot();nested=f.controller.refresh();},{once:true});const before=f.calls;f.controller.dispose();await nested;assert.equal(during.phase,'ended');assert.equal(during.index,null);assert.equal(during.selection,null);assert.equal(during.pending,null);assert.equal(f.calls,before);
});
test('unsubscribe cleanup cannot reenter a still-live controller or acquire a fixed read',async t=>{
 let during,nested;const f=await setup(t,{stopHook(c){during=c.getSnapshot();nested=c.refresh();}});await f.controller.refresh();const before=f.calls;f.controller.dispose();await nested;assert.equal(during.phase,'ended');assert.equal(during.index,null);assert.equal(f.calls,before);assert.equal(f.stops,1);
});
test('disposing an undispatched write notifies observers only after permanent termination',async t=>{
 const f=await setup(t,{quote:true}),c=f.controller;await c.refresh();await c.open(entity);c.reviewQuote();const digest=crypto.subtle.digest,entered=deferred(),held=deferred(),observed=[];let armed=false;
 const stop=c.subscribe(()=>{if(armed&&c.getSnapshot().pending===null)observed.push(c.getSnapshot().phase);});t.after(stop);crypto.subtle.digest=async function(...args){entered.resolve();await held.promise;return digest.apply(this,args);};let pending;
 try{pending=c.acceptQuote();await entered.promise;armed=true;const before=f.calls;c.dispose();held.resolve();await pending;assert.deepEqual(observed,['ended']);assert.equal(f.calls,before);}finally{held.resolve();crypto.subtle.digest=digest;await Promise.allSettled(pending?[pending]:[]);}
});
test('failed unsubscribe still aborts the read and publishes terminal state',async t=>{
 const f=await setup(t,{stopHook(){throw Error('synthetic unsubscribe failure');}});await f.controller.refresh();let aborts=0,observed=0;f.signal.addEventListener('abort',()=>aborts++,{once:true});f.controller.subscribe(()=>{if(f.controller.getSnapshot().phase==='ended')observed++;});assert.doesNotThrow(()=>f.controller.dispose());assert.equal(aborts,1);assert.equal(observed,1);assert.equal(f.controller.getSnapshot().phase,'ended');const before=f.calls;await f.controller.refresh();assert.equal(f.calls,before);
});
test('one throwing observer cannot prevent the others seeing cleared terminal state',async t=>{
 const f=await setup(t);await f.controller.refresh();let observed=0;f.controller.subscribe(()=>{throw Error('synthetic observer failure');});f.controller.subscribe(()=>{observed++;assert.equal(f.controller.getSnapshot().phase,'ended');assert.equal(f.controller.getSnapshot().index,null);});assert.doesNotThrow(()=>f.controller.dispose());assert.equal(observed,1);
});
test('recursive and repeated disposal run owned cleanup once',async t=>{
 const f=await setup(t);await f.controller.refresh();let aborts=0,observed=0;f.signal.addEventListener('abort',()=>{aborts++;f.controller.dispose();},{once:true});f.controller.subscribe(()=>observed++);f.controller.dispose();f.controller.dispose();assert.equal(aborts,1);assert.equal(f.stops,1);assert.equal(observed,1);
});
test('terminal old controller does not retire a legitimate replacement in the same actual session',async t=>{
 const f=await setup(t);await f.controller.refresh();let replacement,nested;f.signal.addEventListener('abort',()=>{replacement=createOrdersController({port:f.port,session:f.runtime.getSnapshot().boundary,ownerId:owner,mode:'client',contextKey:'W5-legitimate-replacement'});nested=replacement.refresh();},{once:true});f.controller.dispose();await nested;t.after(()=>replacement?.dispose());assert.equal(f.controller.getSnapshot().phase,'ended');assert.equal(replacement.getSnapshot().phase,'empty');assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls,2);
});
