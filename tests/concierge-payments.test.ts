import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPaymentCall, mapPaymentView as rawPaymentView, mapPaymentReceipt, paymentRecipient } from '../supabase/functions/concierge-payments/contract.ts';

const clientId = '00000000-0000-4000-8000-000000000001';
const otherId = '00000000-0000-4000-8000-000000000002';
const quoteId = '00000000-0000-4000-8000-000000000003';
const claimId = '00000000-0000-4000-8000-000000000004';
const requestId = '00000000-0000-4000-8000-000000000005';
const address={recipientName:'Synthetic Client',line1:'123 Example Lane',line2:'',city:'Example City',region:'CA',postalCode:'94500',countryCode:'US'};
const extras = {nextServicePeriod:null,service:{status:'unpaid',period:null},shippingAddress:{version:1,address},shippingAddresses:[{version:1,address}]};
const mapPaymentView=(raw:unknown)=>rawPaymentView({...extras,...raw as Record<string,unknown>});
const totals = { serviceCents: 10000, productCents: 4200, totalCents: 14200, shippingAddressVersion:1 };
const quote = { id: quoteId, version: 2, publicationVersion: 3, status: 'payable', currency: 'USD', shippingAddressVersion:1, serviceCents: 10000,
  servicePeriod: { startOn: '2026-10-01', endOn: '2026-11-01' },
  items: [{ recommendationId: 'cleanser', quantity: 2, unitPriceCents: 1800, lineTotalCents: 3600 }],
  productSubtotalCents: 3600, taxCents: 300, shippingCents: 300, productTotalCents: 4200, totalCents: 14200 };
const claim = { id: claimId, quoteId, quoteVersion: 2, status: 'submitted_unverified', ...totals, evidenceId: null };
const submit = () => ({ action: 'submit_claim', requestId, expectedRevision: 4, quoteId, quoteVersion: 2, ...totals, evidenceId: null });

test('client payment targets derive from authenticated owner; claims cannot assert payment authority', () => {
  const call = buildPaymentCall(submit(), clientId);
  assert.deepEqual(call, { name: 'concierge_payment_write', args: { p_client_id: clientId, p_action: 'submit_claim', p_request_id: requestId,
    p_expected_revision: 4, p_payload: { quoteId, quoteVersion: 2, ...totals, evidenceId: null } } });
  for (const field of ['clientId', 'actorId', 'role', 'verified', 'paid', 'bankReceiptVerified']) {
    assert.throws(() => buildPaymentCall({ ...submit(), [field]: field === 'clientId' ? otherId : true }, clientId), /invalid_input/);
  }
});

test('one combined claim allocates exact integer cents without balances or fractional money', () => {
  for (const delta of [{serviceCents: 10000.1}, {productCents: -1}, {totalCents: 14201}, {serviceCents: Number.MAX_SAFE_INTEGER},
    {quoteVersion: 0}, {expectedRevision: -1}, {balanceCents: 1}, {evidenceId: 'https://public.invalid/screenshot.png'}]) {
    assert.throws(() => buildPaymentCall({ ...submit(), ...delta }, clientId), /invalid_input/);
  }
  assert.equal(buildPaymentCall({...submit(), ...{serviceCents: 0, productCents: 4200, totalCents: 4200}}, clientId).name, 'concierge_payment_write');
});

test('advisor confirmation requires explicit external bank verification and immutable expected allocation', () => {
  const command = {action: 'confirm_payment', clientId, requestId, expectedRevision: 5, claimId, quoteId, quoteVersion: 2, ...totals, bankReceiptVerified: true};
  const call = buildPaymentCall(command, otherId);
  assert.equal(call.name, 'concierge_payment_write');
  assert.equal(call.args.p_client_id, clientId);
  assert.equal(call.args.p_action, 'confirm_payment');
  assert.equal((call.args.p_payload as Record<string, unknown>).bankReceiptVerified, true);
  for (const bankReceiptVerified of [false, undefined, 'true', 1]) assert.throws(() => buildPaymentCall({...command, bankReceiptVerified}, otherId), /invalid_input/);
  assert.deepEqual(buildPaymentCall(command, otherId), call, 'exact retry preserves request ID and body');
});

test('final quote includes tax and shipping and rejects changed or inconsistent totals', () => {
  const view = mapPaymentView({revision: 4, quotes: [quote], claims: [claim], privateHealthNote: 'exclude', bankAccount: 'exclude'});
  assert.deepEqual(view, {...extras,revision: 4, quotes: [quote], claims: [claim]});
  for (const delta of [{productSubtotalCents: 3599}, {productTotalCents: 4201}, {totalCents: 14201}, {serviceCents: 10001},
    {taxCents: undefined}, {shippingCents: null}, {servicePeriod: {startOn:'2026-02-30',endOn:'2026-03-30'}},
    {items:[{...quote.items[0],lineTotalCents:3599}]}]) {
    assert.throws(() => mapPaymentView({revision:4,quotes:[{...quote,...delta}],claims:[]}), /unavailable/);
  }
});

test('claim upload/sent response cannot unlock service or imply procurement', () => {
  const call = buildPaymentCall(submit(), clientId);
  const receipt = {revision:5,operation:'submit_claim',quoteId,claimId,status:'submitted_unverified',serviceUnlocked:false,serviceAccessStatus:null,productOrderStatus:null};
  assert.deepEqual(mapPaymentReceipt(receipt,call), receipt);
  for (const delta of [{status:'confirmed'}, {serviceUnlocked:true}, {productOrderStatus:'ready_to_purchase'}, {productOrderStatus:'purchased'}]) {
    assert.throws(() => mapPaymentReceipt({...receipt,...delta}, call), /unavailable/);
  }
});

test('confirmation permits ready to purchase only, and strips private bank metadata', () => {
  const call = buildPaymentCall({action:'confirm_payment',clientId,requestId,expectedRevision:5,claimId,quoteId,quoteVersion:2,...totals,bankReceiptVerified:true}, otherId);
  const receipt = {revision:6,operation:'confirm_payment',quoteId,claimId,status:'confirmed',serviceUnlocked:true,serviceAccessStatus:'active',productOrderStatus:'ready_to_purchase'};
  assert.deepEqual(mapPaymentReceipt({...receipt,bankReference:'exclude',screenshotContent:'exclude'},call),receipt);
  for (const delta of [{productOrderStatus:'purchased'}, {productOrderStatus:'received'}, {status:'submitted_unverified'}, {claimId:otherId}, {quoteId:otherId}]) {
    assert.throws(() => mapPaymentReceipt({...receipt,...delta},call), /unavailable/);
  }
});

test('recipient is configurable, validated, and Zelle-only with explicitly approved defaults', () => {
  assert.deepEqual(paymentRecipient(), {method:'zelle',name:'Kanuj Verma',email:'kanuj.verma12@gmail.com',phone:'(925)719-1334'});
  assert.deepEqual(paymentRecipient({name:'Test Advisor',email:'advisor@example.invalid',phone:'+1 925 555 0101'}),
    {method:'zelle',name:'Test Advisor',email:'advisor@example.invalid',phone:'+1 925 555 0101'});
  assert.throws(() => paymentRecipient({name:'',email:'bad',phone:'bad'}), /unavailable/);
});

test('quote issuance validates item structure and authoritative monthly price before RPC',()=>{
  const {id: _id,version: _version,status: _status,currency: _currency,...money}=quote;
  const issue={action:'issue_quote',clientId,requestId,expectedRevision:4,...money};
  const result=buildPaymentCall(issue,otherId);assert.equal(result.name,'concierge_payment_write');
  if(result.name!=='concierge_payment_write')throw new Error('expected write');
  assert.deepEqual(result.args.p_payload,money);
  for(const items of [{},'wrong',undefined])assert.throws(()=>buildPaymentCall({...issue,items},otherId),/invalid_input/);
  assert.throws(()=>buildPaymentCall({...issue,items:[{...quote.items[0],rationale:'private health details'}]},otherId),/invalid_input/);
});

test('UUIDs accepted in mixed case are canonicalized before command and response identity comparisons',()=>{
  const mixedQuote='ABCDEF12-1234-4000-8000-ABCDEF123456';
  const call=buildPaymentCall({...submit(),quoteId:mixedQuote},clientId);
  assert.equal(call.name,'concierge_payment_write');if(call.name!=='concierge_payment_write')throw new Error('expected write');
  assert.equal(call.args.p_payload.quoteId,mixedQuote.toLowerCase());
  const receipt={revision:5,operation:'submit_claim',quoteId:mixedQuote.toLowerCase(),claimId,status:'submitted_unverified',serviceUnlocked:false,serviceAccessStatus:null,productOrderStatus:null};
  assert.deepEqual(mapPaymentReceipt(receipt,call),receipt);
});

test('a service quote buys one calendar month, including month-end clamping',()=>{
 const view=(servicePeriod:{startOn:string;endOn:string})=>({revision:4,quotes:[{...quote,servicePeriod}],claims:[]});
 for(const servicePeriod of [{startOn:'2026-10-01',endOn:'2027-10-01'},{startOn:'2026-10-01',endOn:'2026-10-31'},{startOn:'2026-10-01',endOn:'2026-12-01'}])assert.throws(()=>mapPaymentView(view(servicePeriod)),/unavailable/);
 for(const servicePeriod of [{startOn:'2026-01-31',endOn:'2026-02-28'},{startOn:'2028-01-31',endOn:'2028-02-29'}])assert.doesNotThrow(()=>mapPaymentView(view(servicePeriod)));
});

test('complete financial history remains readable beyond the first 100 records',()=>{
 const quotes=Array.from({length:101},(_,index)=>({...quote,id:`00000000-0000-4000-8000-${String(index+100).padStart(12,'0')}`,version:index+1,status:'superseded'}));
 assert.equal(mapPaymentView({revision:101,quotes,claims:[]}).quotes.length,101);
});

test('initial service payment may precede publication without consuming days or granting active access',()=>{
 const before={...quote,publicationVersion:0,servicePeriod:null,items:[],shippingAddressVersion:null,productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000};
 assert.doesNotThrow(()=>mapPaymentView({revision:4,quotes:[before],claims:[],service:{status:'pending_publication',period:null}}));
 const call=buildPaymentCall({action:'confirm_payment',clientId,requestId,expectedRevision:5,claimId,quoteId,quoteVersion:2,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,bankReceiptVerified:true},otherId);
 const receipt={revision:6,operation:'confirm_payment',quoteId,claimId,status:'confirmed',serviceUnlocked:false,serviceAccessStatus:'pending_publication',productOrderStatus:null};
 assert.deepEqual(mapPaymentReceipt(receipt,call),receipt);
 assert.throws(()=>mapPaymentReceipt({...receipt,serviceUnlocked:true},call),/unavailable/);
});

test('client confirms a private immutable shipping-address version through an owner-derived action',()=>{
 const address={recipientName:'Synthetic Client',line1:'123 Example Lane',line2:'',city:'Example City',region:'CA',postalCode:'94500',countryCode:'US'};
 const command={action:'confirm_shipping_address',requestId,expectedRevision:4,address};
 const call=buildPaymentCall(command,clientId);assert.deepEqual(call,{name:'concierge_payment_write',args:{p_client_id:clientId,p_action:'confirm_shipping_address',p_expected_revision:4,p_request_id:requestId,p_payload:{address}}});
 assert.deepEqual(mapPaymentReceipt({revision:5,operation:'confirm_shipping_address',addressVersion:2,privateNote:'exclude'},call),{revision:5,operation:'confirm_shipping_address',addressVersion:2});
 assert.throws(()=>buildPaymentCall({...command,clientId:otherId},clientId),/invalid_input/);
 assert.throws(()=>buildPaymentCall({...command,address:{...address,line1:''}},clientId),/invalid_input/);
});

test('product claim basis binds a positive confirmed shipping-address version',()=>{
 assert.equal(buildPaymentCall({...submit(),shippingAddressVersion:2},clientId).name,'concierge_payment_write');
 for(const shippingAddressVersion of [null,0,-1,1.5])assert.throws(()=>buildPaymentCall({...submit(),shippingAddressVersion},clientId),/invalid_input/);
});


test('financial history keeps exact immutable shipping snapshots without private-field passthrough',()=>{
 const oldAddress={...address,line1:'123 Old Example Road'},latest={...address,line1:'456 New Example Road'};
 const result=mapPaymentView({revision:8,quotes:[{...quote,status:'settled'}],claims:[{...claim,status:'confirmed'}],shippingAddress:{version:2,address:latest},shippingAddresses:[{version:1,address:oldAddress,privateNote:'exclude'},{version:2,address:latest}]});
 assert.equal(result.shippingAddresses[0].address.line1,'123 Old Example Road');assert.equal(result.shippingAddress!.version,2);assert.doesNotMatch(JSON.stringify(result),/privateNote|exclude/);
 assert.throws(()=>mapPaymentView({revision:8,quotes:[quote],claims:[],shippingAddresses:[{version:2,address:latest}],shippingAddress:{version:2,address:latest}}),/unavailable/);
});

test('next invoice period comes from the authoritative projection and grants no access while unpaid',()=>{
 const nextServicePeriod={startOn:'2026-10-01',endOn:'2026-11-01'};
 const result=mapPaymentView({revision:0,quotes:[],claims:[],service:{status:'unpaid',period:nextServicePeriod},nextServicePeriod});
 assert.deepEqual(result.nextServicePeriod,nextServicePeriod);assert.equal(result.service.status,'unpaid');
 assert.throws(()=>mapPaymentView({revision:0,quotes:[],claims:[],nextServicePeriod:{startOn:'2026-10-01',endOn:'2027-10-01'}}),/unavailable/);
});
