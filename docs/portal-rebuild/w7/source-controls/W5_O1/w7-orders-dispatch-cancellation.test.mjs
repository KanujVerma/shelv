import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createCommercePort} from '../src/features/orders/port.ts';

test('Orders port does not invoke the fixed request after onDispatch synchronously suspends its actual session',async t=>{
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{
  assert.equal(url,'/api/client/session');
  return Response.json({signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'SYNTHETIC-w7-orders-dispatch',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 }});
 t.after(()=>runtime.dispose());await runtime.restore();
 let calls=0;
 const port=createCommercePort(runtime,{family:'commerce-v1',async execute(){calls++;return undefined;}});
 await assert.rejects(port.execute({schemaVersion:1,action:'read_commerce_v1',snapshot:null,cursor:null,limit:100},{onDispatch(){runtime.cookie.suspend();}}),error=>error.status===503);
 assert.equal(runtime.cookie.status,'offline');
 assert.equal(calls,0,'a synchronously retired READY state must fence the fixed request invocation');
});
