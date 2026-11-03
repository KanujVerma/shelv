import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildClientOrdersReadRpc,mapClientOrdersReadResult} from '../src/contracts/PortalClientOrdersMapping.ts';
import {clientOrdersReadResultMaxBytes} from '../src/contracts/PortalClientOrdersValues.ts';

const id='10000000-0000-4000-8000-000000000001';
const command={schemaVersion:1,action:'read_client_orders_v1'} as const;
const policy={checkedOn:'2026-10-01',url:'https://example.com/recorded-synthetic-terms',summary:'Recorded item-specific terms',openedAllowed:null,finalSale:false,returnBy:null,shipBy:null,returnCostCents:400};
const purchase={id,quoteId:null,recommendationId:null,retailer:'Synthetic Retailer',seller:'Synthetic Seller',productId:'product_1',productName:'Synthetic Exact Product',quantity:2,unitPriceCents:1200,taxCents:192,shippingCents:300,purchasedOn:'2026-10-01',deliveredOn:null,policy,recordedAt:'2026-10-02T11:00:00+00:00',recordedBy:id};
const event={id:'10000000-0000-4000-8000-000000000003',status:'reviewing',note:'Recorded review',expectedRefundCents:null,retailerRefundCents:null,clientRepaidCents:null,policyCheckedOn:null,actorId:id,recordedAt:'2026-10-03T11:00:00Z'};
const returned={id:'10000000-0000-4000-8000-000000000002',purchaseId:id,quantity:1,reason:'Client report',condition:'opened',status:'reviewing',requestedAt:'2026-10-02T12:00:00Z',events:[event]};
const view=()=>({schemaVersion:1,revision:17,purchases:[structuredClone(purchase)],returns:[structuredClone(returned)]});

test('one closed own read maps only the fixed RPC and rejects selectors/writes',()=>{
 assert.deepEqual(buildClientOrdersReadRpc(command),{name:'concierge_client_orders_read_v1',args:{p_command:command}});
 for(const value of [null,{},[],{...command,schemaVersion:2},{...command,action:'request_return'},...['clientId','role','current','rpc','limit','cursor','signal'].map(key=>({...command,[key]:id}))])assert.throws(()=>buildClientOrdersReadRpc(value));
});
test('complete recorded purchase and return facts survive without invented care or delivery',()=>{
 const raw=view(),mapped=mapClientOrdersReadResult(raw,command);assert.deepEqual(mapped,raw);
 assert.equal(mapped.revision,17);assert.equal(mapped.purchases[0].deliveredOn,null);assert.equal(mapped.purchases[0].quoteId,null);
 raw.purchases[0].productName='Mutated';assert.equal(mapped.purchases[0].productName,purchase.productName);
 assert.ok(Object.isFrozen(mapped));assert.ok(Object.isFrozen(mapped.purchases));assert.ok(Object.isFrozen(mapped.purchases[0].policy));
 assert.deepEqual(mapClientOrdersReadResult({schemaVersion:1,revision:0,purchases:[],returns:[]},command),{schemaVersion:1,revision:0,purchases:[],returns:[]});
});
test('private/unknown/missing fields refuse at every orders projection level',()=>{
 for(const mutate of [
  (v:ReturnType<typeof view>)=>{Object.assign(v,{reviews:[]});},
  (v:ReturnType<typeof view>)=>{Object.assign(v.purchases[0],{orderReference:'private'});},
  (v:ReturnType<typeof view>)=>{Object.assign(v.purchases[0].policy,{privateReference:'private'});},
  (v:ReturnType<typeof view>)=>{Object.assign(v.returns[0],{actorId:id});},
  (v:ReturnType<typeof view>)=>{Object.assign(v.returns[0].events[0],{privateReference:'private'});},
  (v:ReturnType<typeof view>)=>{Reflect.deleteProperty(v.purchases[0],'deliveredOn');},
  (v:ReturnType<typeof view>)=>{Reflect.deleteProperty(v,'returns');},
 ]){const raw=view();mutate(raw);assert.throws(()=>mapClientOrdersReadResult(raw,command));}
 assert.throws(()=>mapClientOrdersReadResult(view(),{...command,action:'service_client_read'} as never));
});
test('canonical legacy cents, quantities, dates, stamps and text limits are preserved',()=>{
 for(const [field,value] of [['quantity',0],['quantity',101],['unitPriceCents',-1],['taxCents',100000001],['shippingCents',0.5],['purchasedOn','2026-02-30'],['recordedAt','not a timestamp'],['productId','__proto__'],['productName','x'.repeat(201)]]){
  const raw=view();Object.assign(raw.purchases[0],{[field]:value});assert.throws(()=>mapClientOrdersReadResult(raw,command));
 }
 const raw=view();raw.purchases[0].unitPriceCents=0;raw.purchases[0].productName='😀'.repeat(200);assert.equal(mapClientOrdersReadResult(raw,command).purchases[0].unitPriceCents,0);
 raw.returns[0].events[0].note='';assert.throws(()=>mapClientOrdersReadResult(raw,command));
 const invalidUrl=view();invalidUrl.purchases[0].policy.url='https://seller.example.invalid/returns';assert.throws(()=>mapClientOrdersReadResult(invalidUrl,command));
});
test('full-view byte budget refuses a large complete history rather than truncating',()=>{
 const raw=view();const count=Math.ceil(clientOrdersReadResultMaxBytes/JSON.stringify(purchase).length)+1;
 raw.purchases=Array.from({length:count},(_,i)=>({...structuredClone(purchase),id:`10000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`}));
 assert.ok(new TextEncoder().encode(JSON.stringify(raw)).length>clientOrdersReadResultMaxBytes);
 assert.throws(()=>mapClientOrdersReadResult(raw,command));
});
