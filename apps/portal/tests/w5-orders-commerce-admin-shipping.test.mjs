import test from 'node:test';
import assert from 'node:assert/strict';
import {load,actor,client,other,draft,snapshot,line,option} from './w5-orders-commerce-admin-helper.mjs';
const module=await load('apps/portal/src/features/orders/admin/shipping.ts').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND'&&error.url?.endsWith('/orders/admin/shipping.ts'))return {};throw error;});
const fn=name=>{assert.equal(typeof module[name],'function',`missing exact quote shipping selector ${name}`);return module[name];};
const {buildPaymentCallV2}=await load('supabase/functions/concierge-payments/methods.ts');
const loaded=()=>({snapshot:snapshot(),draft:draft(),lines:[line()],options:[option()]});
const address=n=>({recipientName:'Synthetic Client',line1:`${n} Synthetic Street`,line2:'',city:'Synthetic City',region:'WI',postalCode:'55555',countryCode:'US'});
const command=()=>({schemaVersion:2,action:'advisor_read',clientId:client});
const payment=()=>({schemaVersion:2,revision:11,quotes:[],claims:[],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:{version:3,address:address(3)},shippingAddresses:[1,2,3].map(version=>({version,address:address(version)}))});
const binding=()=>({command:command(),call:buildPaymentCallV2(command(),actor),value:payment()});

test('selected draft address uses exact immutable version from the same authorized-read data',()=>{
 const view=fn('productQuoteShippingFromPaymentRead')(binding(),loaded());assert.equal(view.clientId,client);assert.equal(view.paymentRevision,11);assert.equal(view.shippingAddress.version,2);assert.equal(view.shippingAddress.address.line1,'2 Synthetic Street');assert.equal(Object.isFrozen(view.shippingAddress.address),true);
});
test('missing historical version never substitutes the latest address',()=>{
 const input=binding();input.value.shippingAddresses=[{version:3,address:address(3)}];assert.equal(fn('productQuoteShippingFromPaymentRead')(input,loaded()),null);
});
test('unknown draft address and stale financial revision stay unavailable',()=>{
 const project=fn('productQuoteShippingFromPaymentRead');assert.equal(project(binding(),{...loaded(),draft:{...draft(),body:{...draft().body,shippingAddressVersion:{state:'unknown'}}}}),null);const input=binding();input.value.revision=12;assert.equal(project(input,loaded()),null);
});
test('fixed call, read command and client context must all identify the same client',()=>{
 const project=fn('productQuoteShippingFromPaymentRead');for(const patch of [{command:{...command(),clientId:other}},{call:{name:'concierge_payment_view_v2',args:{p_client_id:other}}},{call:{name:'concierge_payment_view',args:{p_client_id:client}}},{command:{...command(),actorId:actor}},{call:{name:'concierge_payment_view_v2',args:{p_client_id:client,url:'https://other.invalid'}}}])assert.equal(project({...binding(),...patch},loaded()),null);
});
test('absent presentation VM cannot become no-address or current authority',()=>{
 const select=fn('selectProductQuoteShippingAddress');assert.deepEqual(select(null,loaded()),{status:'unavailable'});assert.deepEqual(select(undefined,loaded()),{status:'unavailable'});assert.deepEqual(select({clientId:client,paymentRevision:11,shippingAddress:null},loaded()),{status:'unavailable'});
});
test('presentation selector enforces exact client, revision and known draft version',()=>{
 const select=fn('selectProductQuoteShippingAddress'),valid={clientId:client,paymentRevision:11,shippingAddress:{version:2,address:address(2)}};assert.equal(select(valid,loaded()).status,'available');for(const value of [{...valid,clientId:other},{...valid,paymentRevision:12},{...valid,shippingAddress:{version:3,address:address(3)}}])assert.deepEqual(select(value,loaded()),{status:'unavailable'});
});
test('valid UUID case variants preserve identity but malformed address data refuses',()=>{
 const select=fn('selectProductQuoteShippingAddress'),view={clientId:client.toUpperCase(),paymentRevision:11,shippingAddress:{version:2,address:address(2)}};assert.equal(select(view,loaded()).status,'available');assert.deepEqual(select({...view,shippingAddress:{version:2,address:{...address(2),privateReference:'not-an-address'}}},loaded()),{status:'unavailable'});
});
test('selector returns copied immutable address and cannot relabel another quote kind',()=>{
 const select=fn('selectProductQuoteShippingAddress'),view={clientId:client,paymentRevision:11,shippingAddress:{version:2,address:address(2)}},result=select(view,loaded());view.shippingAddress.address.line1='changed caller';assert.equal(result.address.address.line1,'2 Synthetic Street');assert.throws(()=>{result.address.address.line1='mutation';});assert.deepEqual(select(view,{...loaded(),draft:{kind:'quote',clientId:client,address:{version:2,address:address(2)}}}),{status:'unavailable'});
});
test('no confirmed address and foreign canonical envelopes remain unavailable',()=>{
 const project=fn('productQuoteShippingFromPaymentRead'),none=binding();none.value.shippingAddress=null;none.value.shippingAddresses=[];assert.equal(project(none,loaded()),null);assert.equal(project(binding(),{...loaded(),draft:{...draft(),clientId:other}}),null);
});
