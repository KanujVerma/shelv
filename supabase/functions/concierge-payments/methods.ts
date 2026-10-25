import {buildPaymentCall,mapPaymentReceipt,mapPaymentView,paymentInteger,paymentKeys,paymentObject,paymentRecipient,paymentUuid,requirePayment} from './contract.ts';
import type {PaymentRpcCall} from './types.ts';
export function buildPaymentCallV2(input:unknown,ownerId:string):PaymentRpcCall{
 const raw=paymentObject(input);requirePayment(raw.schemaVersion===2);const {schemaVersion:_schema,paymentOptionId,receiptVerified,...legacy}=raw;
 const read=['client_read','advisor_read'].includes(String(raw.action)),issue=raw.action==='issue_quote';
 if(read||issue)requirePayment(paymentOptionId===undefined&&receiptVerified===undefined);
 else{requirePayment(['submit_claim','confirm_payment','reject_claim'].includes(String(raw.action)));paymentUuid(paymentOptionId);}
 if(raw.action==='confirm_payment'){requirePayment(receiptVerified===true&&!Object.hasOwn(legacy,'bankReceiptVerified'));legacy.bankReceiptVerified=true;}
 else requirePayment(receiptVerified===undefined);
 const call=buildPaymentCall(legacy,ownerId);
 if(read){requirePayment(call.name==='concierge_payment_view');return {...call,name:'concierge_payment_view_v2'};}
 requirePayment(call.name==='concierge_payment_write');const payload:Record<string,unknown>={...call.args.p_payload,...(!issue?{paymentOptionId:paymentUuid(paymentOptionId)}:{})};
 if(raw.action==='confirm_payment'){delete payload.bankReceiptVerified;payload.receiptVerified=true;}
 return {name:'concierge_payment_write_v2',args:{...call.args,p_payload:payload}};
}
function recipient(input:unknown){
 const r=paymentObject(input);requirePayment(typeof r.name==='string'&&r.name.trim().length>0&&Array.from(r.name).length<=100&&!/[\u0000-\u001f\uD800-\uDFFF]/u.test(r.name));
 if(r.method==='zelle'){paymentKeys(r,['method','name','email','phone']);return paymentRecipient({name:r.name,email:r.email as string,phone:r.phone as string});}
 if(r.method==='apple_cash'){paymentKeys(r,['method','name','phone']);requirePayment(typeof r.phone==='string'&&/^\+?[\d() .-]+$/.test(r.phone)&&r.phone.replace(/\D/g,'').length>=10&&r.phone.replace(/\D/g,'').length<=15);return {method:'apple_cash' as const,name:r.name,phone:r.phone};}
 paymentKeys(r,['method','name','cashtag']);requirePayment(r.method==='cash_app'&&typeof r.cashtag==='string'&&/^\$[A-Za-z][A-Za-z0-9_]{0,19}$/.test(r.cashtag));
 return {method:'cash_app' as const,name:r.name,cashtag:r.cashtag};
}
export function mapPaymentViewV2(input:unknown){
 try{
  const raw=paymentObject(input);requirePayment(raw.schemaVersion===2&&Array.isArray(raw.quotes));const {schemaVersion:_schema,...legacy}=raw;const mapped=mapPaymentView({...legacy,quotes:raw.quotes.map(value=>{const {contractVersion:_version,paymentOptions:_options,...quote}=paymentObject(value);return quote;})}),original=raw.quotes as Record<string,unknown>[];
  const quotes=mapped.quotes.map(q=>{const r=original.find(row=>row.id===q.id)!;requirePayment(r.contractVersion===1||r.contractVersion===2);requirePayment(Array.isArray(r.paymentOptions));
   const paymentOptions=r.paymentOptions.map(value=>{const o=paymentObject(value);requirePayment(typeof o.available==='boolean');return {id:paymentUuid(o.id),recipientVersion:paymentInteger(o.recipientVersion,1),recipient:recipient(o.recipient),available:o.available};});
   requirePayment(new Set(paymentOptions.map(o=>o.id)).size===paymentOptions.length&&(r.contractVersion===1?paymentOptions.length===0:paymentOptions.length>0));
   return {...q,contractVersion:r.contractVersion as 1|2,paymentOptions};});
  const claims=mapped.claims.map(c=>{const r=(raw.claims as Record<string,unknown>[]).find(row=>row.id===c.id)!,q=quotes.find(q=>q.id===c.quoteId)!;const paymentOptionId=r.paymentOptionId===null?null:paymentUuid(r.paymentOptionId);requirePayment(q.contractVersion===1?paymentOptionId===null:q.paymentOptions.some(o=>o.id===paymentOptionId));return {...c,paymentOptionId};});
  return {...mapped,schemaVersion:2 as const,quotes,claims};
 }catch{throw Error('unavailable');}
}
export function mapPaymentReceiptV2(raw:unknown,call:PaymentRpcCall){
 try{requirePayment(call.name==='concierge_payment_write_v2');const r=paymentObject(raw);requirePayment(r.schemaVersion===2);const paymentOptionId=call.args.p_action==='issue_quote'?null:paymentUuid(r.paymentOptionId);requirePayment(r.paymentOptionId===paymentOptionId&&(paymentOptionId===null||paymentOptionId===call.args.p_payload.paymentOptionId));return {...mapPaymentReceipt(raw,{...call,name:'concierge_payment_write'}),schemaVersion:2 as const,paymentOptionId};}
 catch{throw Error('unavailable');}
}
