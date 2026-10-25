import test from 'node:test';
import assert from 'node:assert/strict';
import {handlePaymentRequest,type PaymentPorts} from '../supabase/functions/concierge-payments/handler.ts';
import {mapPaymentViewV2} from '../supabase/functions/concierge-payments/methods.ts';
import {mapPaymentView} from '../supabase/functions/concierge-payments/contract.ts';
const owner='bf000000-0000-4000-8000-000000000001',quoteId='bf000000-0000-4000-8000-000000000002',option='bf000000-0000-4000-8000-000000000003',claimId='bf000000-0000-4000-8000-000000000004',requestId='bf000000-0000-4000-8000-000000000005';
const basis={quoteId,quoteVersion:1,serviceCents:0,productCents:1399,totalCents:1399,shippingAddressVersion:1,paymentOptionId:option};
const submit={schemaVersion:2,action:'submit_claim',requestId,expectedRevision:1,...basis,evidenceId:null};
const receipt={schemaVersion:2,revision:2,operation:'submit_claim',quoteId,claimId,status:'submitted_unverified',serviceUnlocked:false,serviceAccessStatus:null,productOrderStatus:null,paymentOptionId:option};
function fixture(){const calls:any[]=[];const ports:PaymentPorts={allowedOrigins:[],authenticate:async()=>({id:owner,is_anonymous:false}),rpc:async(_token,call)=>{calls.push(call);return {data:receipt,error:null};}};const http=(command:unknown)=>handlePaymentRequest(new Request('https://synthetic.invalid/payments',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify(command)}),ports);return {ports,calls,http};}
test('V2 claim preserves option/full intent and rejects recipient injection or missing method binding',async()=>{
 const f=fixture(),result=await f.http(submit);assert.equal(result.status,200);assert.deepEqual(await result.json(),receipt);assert.equal(f.calls[0].name,'concierge_payment_write_v2');assert.equal(f.calls[0].args.p_payload.paymentOptionId,option);
 for(const delta of [{paymentOptionId:undefined},{recipient:{$cashtag:'attacker'}},{method:'apple_cash'},{recipientId:'attacker'},{receiptVerified:true}])assert.equal((await f.http({...submit,...delta})).status,400);
});
test('V2 confirmation requires generic actual receipt acknowledgement and exact option receipt',async()=>{
 const f=fixture();f.ports.rpc=async()=>({data:{...receipt,operation:'confirm_payment',status:'confirmed',productOrderStatus:'ready_to_purchase'},error:null});
 const command={schemaVersion:2,action:'confirm_payment',clientId:owner,requestId,expectedRevision:2,...basis,claimId,receiptVerified:true};assert.equal((await f.http(command)).status,200);
 for(const delta of [{receiptVerified:false},{receiptVerified:undefined},{bankReceiptVerified:true}])assert.equal((await f.http({...command,...delta})).status,400);
 f.ports.rpc=async()=>({data:{...receipt,paymentOptionId:owner},error:null});assert.equal((await f.http(submit)).status,503);
});
test('V1 upgrade requirement is explicit and sanitized',async()=>{
 const f=fixture();f.ports.rpc=async()=>({data:null,error:{message:'concierge_payment_contract_upgrade_required'}});const response=await f.http({action:'client_read'});assert.equal(response.status,409);assert.deepEqual(await response.json(),{code:'concierge_payment_contract_upgrade_required'});
});
test('V2 projection retains all three exact recipient variants and legacy mappers refuse method-bearing data',()=>{
 const recipients=[{method:'zelle',name:'Kanuj Verma',email:'kanuj.verma12@gmail.com',phone:'(925)719-1334'},{method:'cash_app',name:'Kanuj Verma',cashtag:'$KanujVerma'},{method:'apple_cash',name:'Kanuj Verma',phone:'(925)719-1334'}];
 const quote={id:quoteId,version:1,publicationVersion:0,currency:'USD',status:'payable',serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000,contractVersion:2,paymentOptions:recipients.map((recipient,index)=>({id:`bf000000-0000-4000-8000-${String(index+10).padStart(12,'0')}`,recipientVersion:1,recipient,available:true,privateAccountNote:'PRIVATE_OPTION'}))};
 const raw={schemaVersion:2,revision:0,quotes:[quote],claims:[],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:null,shippingAddresses:[],privateNotes:'PRIVATE_ROOT'};
 assert.deepEqual(mapPaymentViewV2(raw).quotes[0].paymentOptions.map(o=>o.recipient),recipients);assert.doesNotMatch(JSON.stringify(mapPaymentViewV2(raw)),/PRIVATE_|privateAccount/);assert.throws(()=>mapPaymentView(raw),/unavailable/);
 for(const recipient of [{method:'unknown',name:'X'},{method:'cash_app',name:'X',cashtag:'https://attacker.invalid'},{method:'apple_cash',name:'X',phone:'bad'}])assert.throws(()=>mapPaymentViewV2({...raw,quotes:[{...quote,paymentOptions:[{...quote.paymentOptions[0],recipient}]}]}),/unavailable/);
});
