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
