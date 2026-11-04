import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {view} from './w5-orders-service-payments-helper.mjs';
import {buildPaymentCall} from '../../../supabase/functions/concierge-payments/contract.ts';
const api=await import('../src/app/account-address-request.ts').catch(e=>{if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;return {};});
test('fixed creation-bound address request is available without a service read',()=>{
 assert.equal(typeof api.createAccountAddressRequest,'function');
});
const actor='11111111-1111-4111-8111-111111111111',requestId='77777777-7777-4777-8777-777777777777';
const address=()=>({recipientName:'Synthetic Client',line1:'1 Example Road',line2:'',city:'Sample',region:'CA',postalCode:'00000',countryCode:'us'});
const command=()=>({action:'confirm_shipping_address',requestId,expectedRevision:3,address:address()});
const receipt=()=>({operation:'confirm_shipping_address',revision:4,addressVersion:1});
const gate=()=>{let release,enter;return{promise:new Promise(r=>release=r),entered:new Promise(r=>enter=r),release:()=>release(),enter:()=>enter()};};
async function fixture(t,{audience='client',restore=true}={}){
 let login={signedIn:true,ownerId:actor,generation:1,csrf:'SYNTHETIC-address',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'};
 let respond=c=>Response.json(c.action==='client_read'?view():receipt());const calls=[];
 const runtime=createApplicationSession({audience,locks:{request:async(_n,o,run)=>run(o.signal)},fetcher:async(url,init)=>{
  assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.equal(new Headers(init.headers).has('authorization'),false);
  if(url===`/api/${audience}/session`)return Response.json(login);
  assert.equal(url,`/api/${audience}/payments`,'unexpected HTTP is refused');assert.equal(new Headers(init.headers).get('X-Shelv-CSRF'),login.csrf);
  const c=JSON.parse(init.body);calls.push(c);return respond(c);
 }});
 if(restore)await runtime.restore();t.after(()=>runtime.dispose());
 return{runtime,calls,create:()=>api.createAccountAddressRequest(runtime),reply(fn){respond=fn;},login(v){login={...login,...v};}};
}
test('public request exposes exactly the three approved methods and no service read',async t=>{
 const f=await fixture(t),r=f.create();assert.deepEqual(Object.keys(r).sort(),['confirmAddress','isCurrent','readPayments']);assert.equal(r.isCurrent(),true);assert.equal(f.calls.length,0);
});
test('canonical PaymentV2 read uses only the existing own-client payment channel',async t=>{
 const f=await fixture(t),r=f.create();assert.deepEqual(await r.readPayments(),view());assert.deepEqual(f.calls,[{schemaVersion:2,action:'client_read'}]);
});
test('confirmation normalizes and binds only the fixed legacy address command',async t=>{
 const f=await fixture(t),c=command(),expected=buildPaymentCall(c,actor);assert.equal(expected.name,'concierge_payment_write');
 assert.deepEqual(await f.create().confirmAddress(c),receipt());assert.deepEqual(f.calls,[{action:'confirm_shipping_address',requestId,expectedRevision:3,address:expected.args.p_payload.address}]);
});
test('financial actions and owner/RPC selectors never reach HTTP',async t=>{
 const f=await fixture(t),r=f.create();for(const bad of [{...command(),clientId:actor},{...command(),rpc:'anything'},{...command(),action:'confirm_payment'},{...command(),expectedRevision:-1}])await assert.rejects(r.confirmAddress(bad),e=>e.status===400);
 assert.equal(f.calls.length,0);
});
test('the actual advisor runtime cannot construct an own-client request',async t=>{
 const f=await fixture(t,{audience:'advisor'});assert.throws(()=>f.create(),e=>e.status===401);assert.equal(f.calls.length,0);
});
test('caller edits after confirmation starts cannot change the dispatched original',async t=>{
 const f=await fixture(t),c=command(),pending=f.create().confirmAddress(c);c.requestId=actor;c.address.line1='changed';await pending;
 assert.equal(f.calls[0].requestId,requestId);assert.equal(f.calls[0].address.line1,'1 Example Road');
});
for(const status of [401,403])test('actual current payment HTTP'+status+' keeps its denial',async t=>{
 const f=await fixture(t),r=f.create();f.reply(()=>Response.json({code:status===401?'session_ended':'forbidden'},{status}));
 await assert.rejects(r.readPayments(),e=>e.status===status);assert.equal(f.calls.length,1);
});
for(const method of ['readPayments','confirmAddress'])test('pre-aborted '+method+' cannot dispatch',async t=>{
 const f=await fixture(t),r=f.create(),abort=new AbortController();abort.abort();
 await assert.rejects(method==='readPayments'?r.readPayments({signal:abort.signal}):r.confirmAddress(command(),{signal:abort.signal}),e=>e.status===503);assert.equal(f.calls.length,0);assert.equal(f.runtime.cookie.status,'ready');
});
test('reentrant callback suspension is not a READY grant',async t=>{
 const f=await fixture(t),r=f.create();await assert.rejects(r.confirmAddress(command(),{isApplicable(){f.runtime.cookie.suspend();return true;}}),e=>e.status===503);
 assert.equal(f.calls.length,0);assert.equal(r.isCurrent(),true);
});
test('option getter suspension is followed by an actual READY check',async t=>{
 const f=await fixture(t),r=f.create();await assert.rejects(r.readPayments({get isApplicable(){f.runtime.cookie.suspend();return()=>true;}}),e=>e.status===503);assert.equal(f.calls.length,0);
});
test('a malformed current-address/head relation remains unavailable',async t=>{
 const f=await fixture(t),data=view();data.revision=1;data.shippingAddress={version:2,address:{...address(),countryCode:'US'}};data.shippingAddresses=[data.shippingAddress];f.reply(()=>Response.json(data));
 await assert.rejects(f.create().readPayments(),e=>e.status===503);
});
test('historical confirmation receipt is not rewritten to the newer current financial head',async t=>{
 const f=await fixture(t),r=f.create();const data=view();data.revision=9;f.reply(c=>Response.json(c.action==='client_read'?data:receipt()));
 assert.equal((await r.readPayments()).revision,9);assert.equal((await r.confirmAddress(command())).revision,4);
});
test('retirement during input cloning cannot dispatch',async t=>{
 const f=await fixture(t),r=f.create();const c={...command(),get address(){f.runtime.dispose();return address();}};
 await assert.rejects(r.confirmAddress(c),e=>e.status===401);assert.equal(f.calls.length,0);
});
test('late payment read cannot return after actual actor replacement',async t=>{
 const f=await fixture(t),r=f.create(),held=gate();f.reply(async()=>{held.enter();await held.promise;return Response.json(view());});
 const reading=r.readPayments();await held.entered;f.login({ownerId:'88888888-8888-4888-8888-888888888888'});await f.runtime.restore();held.release();
 await assert.rejects(reading,e=>e.status===401);assert.equal(r.isCurrent(),false);
});
for(const status of [401,403])test('legacy address HTTP'+status+' is not relabeled as uncertainty',async t=>{
 const f=await fixture(t),r=f.create();f.reply(()=>Response.json({code:status===401?'session_ended':'forbidden'},{status}));
 await assert.rejects(r.confirmAddress(command()),e=>e.status===status);assert.equal(f.calls.length,1);
});
test('late confirmation cannot return after actual READY suspension',async t=>{
 const f=await fixture(t),r=f.create();let returned=false;f.reply(()=>{returned=true;return Response.json(receipt());});
 await assert.rejects(r.confirmAddress(command(),{isApplicable(){if(returned)f.runtime.cookie.suspend();return true;}}),e=>e.status===503);
 assert.equal(f.calls.length,1);assert.equal(r.isCurrent(),true);
});
test('a mismatched historical confirmation revision is refused',async t=>{
 const f=await fixture(t);f.reply(()=>Response.json({...receipt(),revision:8}));await assert.rejects(f.create().confirmAddress(command()),e=>e.status===503);
});
