// Actual session/controller/shared React; closed synthetic HTTP, no Auth/SQL proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {accountAddressSourceApi} from './w6-account-address-fixture.mjs';
const api=await accountAddressSourceApi();
async function fixture(t) {
  let status=200;
  const calls=[],address={recipientName:'Synthetic Recipient',line1:'1 Test Road',line2:'',city:'Madison',region:'WI',postalCode:'53703',countryCode:'US'};
  const runtime=api.createApplicationSession({audience:'client',now:()=>Date.parse('2026-11-03T12:00:00Z'),locks:{request:async(_name,_options,run)=>run()},fetcher:async(url,init)=>{
    calls.push(url);
    if(url==='/api/client/session')return Response.json({signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'synthetic-address-ssr',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2026-11-03T12:10:00Z',absoluteExpiresAt:'2026-11-03T13:00:00Z'});
    assert.equal(url,'/api/client/payments');assert.deepEqual(JSON.parse(init.body),{schemaVersion:2,action:'client_read'});
    return status===200?Response.json({schemaVersion:2,revision:3,quotes:[],claims:[],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:{version:3,address},shippingAddresses:[1,2,3].map(version=>({version,address}))}):Response.json({code:'forbidden'},{status});
  }});
  await runtime.restore();runtime.cookie.channel?.unref?.();t.after(()=>runtime.dispose());
  const controller=api.createAccountAddressController(runtime);t.after(()=>controller.dispose());await controller.load();
  const render=()=>api.renderToStaticMarkup(api.createElement(api.OverlayProvider,null,api.createElement(api.AccountAddress,{controller})));
  return{runtime,controller,calls,render,setStatus:value=>{status=value;}};
}
test('one address card composes without replacing accepted profile/service and renders inertly',async t=>{
  const f=await fixture(t),before=f.calls.length,html=f.render();
  assert.match(html,/shipping address/);assert.match(html,/Synthetic Recipient/);assert.match(html,/address version 3/);
  assert.doesNotMatch(html,/<h1|<nav|profile and contact|cancellation requests are unavailable|final plan download is unavailable/);
  f.render();assert.equal(f.calls.length,before,'render acquires no data or extra lifecycle');
});
test('actual address edit uses shared fields and preserves the paid-order address consequence',async t=>{
  const f=await fixture(t);f.controller.editAddress();const html=f.render();
  assert.match(html,/shipping address-line1/);assert.match(html,/review address/);assert.match(html,/discard edits/);
  assert.match(html,/paid quotes and orders keep their original address/);assert.ok(f.calls.every(url=>!url.endsWith('/operations')));
});
test('actual denial and actual session retirement remove old private address/form data',async t=>{
  const f=await fixture(t);f.setStatus(403);await f.controller.load();
  assert.equal(f.controller.getSnapshot().phase,'denied');assert.doesNotMatch(f.render(),/Synthetic Recipient|1 Test Road|<input/);
  const ended=await fixture(t);ended.runtime.dispose();assert.equal(ended.controller.getSnapshot().phase,'ended');
  assert.doesNotMatch(ended.render(),/Synthetic Recipient|1 Test Road|<input/);
});
