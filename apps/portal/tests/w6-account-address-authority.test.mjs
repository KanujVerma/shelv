// Actual cookie/session/Root codecs with closed HTTP. No real Auth or SQL.
import test from 'node:test';
import assert from 'node:assert/strict';
import {accountAddressSourceApi} from './w6-account-address-fixture.mjs';
const {createApplicationSession,createAccountAddressController}=await accountAddressSourceApi();

for (const status of [200,401,403]) test(`address administration depends on its payment authority, not care read (${status})`, async t => {
  const calls=[];
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>{throw Error('unexpected global network');};
  t.after(()=>{globalThis.fetch=originalFetch;});
  const runtime=createApplicationSession({audience:'client',now:()=>Date.parse('2026-11-03T12:00:00Z'),
    locks:{request:async(_name,_options,run)=>run()},fetcher:async(url,init)=>{
      calls.push(url);
      if(url==='/api/client/session')return Response.json({signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'synthetic-address',
        capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2026-11-03T12:10:00Z',absoluteExpiresAt:'2026-11-03T13:00:00Z'});
      if(url==='/api/client/operations')return Response.json({code:'forbidden'},{status:403});
      assert.equal(url,'/api/client/payments'); assert.deepEqual(JSON.parse(init.body),{schemaVersion:2,action:'client_read'});
      return status===200?Response.json({schemaVersion:2,revision:0,quotes:[],claims:[],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:null,shippingAddresses:[]}):Response.json({code:'forbidden'},{status});
    }});
  await runtime.restore();runtime.cookie.channel?.unref?.();t.after(()=>runtime.dispose());
  const controller=createAccountAddressController(runtime);t.after(()=>controller.dispose());
  await controller.load();const current=controller.getSnapshot();
  if(status===200){assert.equal(current.phase,'ready');assert.equal(current.data.shippingAddress,null);}
  else{assert.equal(current.phase,status===401?'ended':'denied');assert.equal(current.data,null);}
  assert.equal(calls.includes('/api/client/operations'),false,'shipping address must not acquire a care projection');
});
