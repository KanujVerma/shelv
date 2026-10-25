import assert from 'node:assert/strict';
import test from 'node:test';
import {handlePaymentRequest, type PaymentPorts} from '../supabase/functions/concierge-payments/handler.ts';

const owner = '00000000-0000-4000-8000-000000000001';
const quoteId = '00000000-0000-4000-8000-000000000003';
const claimId = '00000000-0000-4000-8000-000000000004';
const requestId = '00000000-0000-4000-8000-000000000005';
const command = {action:'submit_claim',requestId,expectedRevision:4,quoteId,quoteVersion:2,serviceCents:10000,productCents:4200,totalCents:14200,shippingAddressVersion:1,evidenceId:null};
const receipt = {revision:5,operation:'submit_claim',quoteId,claimId,status:'submitted_unverified',serviceUnlocked:false,serviceAccessStatus:null,productOrderStatus:null};
function request(body:unknown,token='verified') {return new Request('https://payment.invalid',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(body)});}
function fixture() {
  const calls:{token:string;call:unknown}[]=[];
  const ports:PaymentPorts={allowedOrigins:['https://portal.invalid'],authenticate:async(token)=>token==='verified'?{id:owner,is_anonymous:false}:null,
    rpc:async(token,call)=>{calls.push({token,call});return {data:receipt,error:null};}};
  return {ports,calls};
}

test('HTTP verifies permanent bearer before payment RPC; input role cannot grant advisor',async()=>{
  for(const token of ['expired','']) {const p=fixture();assert.equal((await handlePaymentRequest(request(command,token),p.ports)).status,401);assert.equal(p.calls.length,0);}
  const p=fixture();p.ports.authenticate=async()=>({id:owner,is_anonymous:true});assert.equal((await handlePaymentRequest(request(command),p.ports)).status,403);assert.equal(p.calls.length,0);
  const invalid=fixture();assert.equal((await handlePaymentRequest(request({...command,role:'advisor'}),invalid.ports)).status,400);assert.equal(invalid.calls.length,0);
});

test('payment receipt remains unverified and exact HTTP retries preserve all inputs',async()=>{
  const p=fixture();const a=await handlePaymentRequest(request(command),p.ports),b=await handlePaymentRequest(request(command),p.ports);
  assert.equal(a.status,200);assert.deepEqual(await a.json(),receipt);assert.deepEqual(await b.json(),receipt);assert.deepEqual(p.calls[0],p.calls[1]);
  assert.equal(p.calls[0].token,'verified');assert.match(a.headers.get('cache-control')??'',/no-store/);assert.equal(a.headers.get('pragma'),'no-cache');
});

test('stale quote, changed allocations, duplicate confirmation and cross-owner errors remain explicit and sanitized',async()=>{
  const statuses:Record<string,number>={concierge_product_already_funded:409,concierge_product_not_approved:409,concierge_quote_conflict:409,concierge_quote_stale:409,concierge_payment_already_confirmed:409,concierge_request_conflict:409,concierge_forbidden:403,concierge_unauthorized:401};
  for(const [message,status] of Object.entries(statuses)){
    const p=fixture();p.ports.rpc=async()=>({data:null,error:{message}});const r=await handlePaymentRequest(request(command),p.ports);assert.equal(r.status,status);assert.deepEqual(await r.json(),{code:message});
  }
  const p=fixture();p.ports.rpc=async()=>({data:null,error:{message:'SQL includes bank information and screenshot content'}});
  const r=await handlePaymentRequest(request(command),p.ports);assert.equal(r.status,503);assert.equal(await r.text(),'{"code":"unavailable"}');
});

test('unapproved origins, methods, body size and unexpected fields stop before financial RPC',async()=>{
  const p=fixture();const evil=request(command);evil.headers.set('origin','https://evil.invalid');assert.equal((await handlePaymentRequest(evil,p.ports)).status,403);
  assert.equal((await handlePaymentRequest(new Request('https://payment.invalid'),p.ports)).status,405);
  const media=request(command);media.headers.set('content-type','text/plain');assert.equal((await handlePaymentRequest(media,p.ports)).status,415);
  assert.equal((await handlePaymentRequest(request({...command,x:'x'.repeat(17000)}),p.ports)).status,413);
  assert.equal(p.calls.length,0);
  const preflight=await handlePaymentRequest(new Request('https://payment.invalid',{method:'OPTIONS',headers:{origin:'https://portal.invalid'}}),p.ports);
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://portal.invalid');
});

test('unknown financial response fields are omitted and malformed/optimistically settled claims fail closed',async()=>{
  const p=fixture();p.ports.rpc=async()=>({data:{...receipt,privateNote:'secret',bankReference:'secret'},error:null});
  assert.deepEqual(await (await handlePaymentRequest(request(command),p.ports)).json(),receipt);
  p.ports.rpc=async()=>({data:{...receipt,status:'confirmed',serviceUnlocked:true},error:null});
  assert.equal((await handlePaymentRequest(request(command),p.ports)).status,503);
});
