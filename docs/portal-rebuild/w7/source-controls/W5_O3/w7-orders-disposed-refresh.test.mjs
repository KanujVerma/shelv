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
