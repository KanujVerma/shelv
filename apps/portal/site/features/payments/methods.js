import {paymentView,claimCommand,confirmationCommand,rejectionCommand,validateReceipt} from './model.js';
const ensure=value=>{if(!value)throw Error('invalid_input');};
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const methodLabels={zelle:'Zelle',cash_app:'Cash App',apple_cash:'Apple Cash'};
export const methodAsset=method=>new URL(`../../assets/payment-methods/${method}.${{zelle:'png',cash_app:'svg',apple_cash:'jpg'}[method]}`,import.meta.url).href;
export function paymentViewWithMethods(raw,options={}){
 if(raw?.schemaVersion!==2){ensure(!raw?.quotes?.some(q=>q.contractVersion===2||q.paymentOptions?.length));return paymentView(raw,options);}
 const base=paymentView(raw,{recipientRequired:false});
 for(const q of base.quotes){ensure([1,2].includes(q.contractVersion)&&Array.isArray(q.paymentOptions)&&(q.contractVersion===1?q.paymentOptions.length===0:q.paymentOptions.length>0));const ids=new Set();
  for(const o of q.paymentOptions){const r=o.recipient;ensure(uuid(o.id)&&!ids.has(o.id)&&Number.isSafeInteger(o.recipientVersion)&&o.recipientVersion>0&&typeof o.available==='boolean'&&r&&Object.hasOwn(methodLabels,r.method)&&typeof r.name==='string'&&r.name.trim());ids.add(o.id);ensure(r.method==='zelle'?typeof r.email==='string'&&typeof r.phone==='string':r.method==='cash_app'?typeof r.cashtag==='string'&&/^\$[A-Za-z][A-Za-z0-9_]{0,19}$/.test(r.cashtag):typeof r.phone==='string'&&r.phone.replace(/\D/g,'').length>=10);}
 }
 for(const claim of base.claims){const q=base.quotes.find(q=>q.id===claim.quoteId);ensure(q.contractVersion===1?claim.paymentOptionId===null:q.paymentOptions.some(o=>o.id===claim.paymentOptionId));}
 return base;
}
export function methodClaimCommand(q,option,revision,evidenceId,requestId){const command=claimCommand(q,revision,evidenceId,requestId);if(q.contractVersion!==2)return command;ensure(q.paymentOptions.some(o=>o.id===option&&o.available));return {...command,schemaVersion:2,paymentOptionId:option};}
export function methodConfirmationCommand(q,claim,clientId,revision,verified,requestId){const command=confirmationCommand(q,claim,clientId,revision,verified,requestId);if(q.contractVersion!==2)return command;ensure(q.paymentOptions.some(o=>o.id===claim.paymentOptionId));delete command.bankReceiptVerified;return {...command,schemaVersion:2,paymentOptionId:claim.paymentOptionId,receiptVerified:true};}
export function methodRejectionCommand(q,claim,clientId,revision,reasonCode,requestId){const command=rejectionCommand(q,claim,clientId,revision,reasonCode,requestId);return q.contractVersion===2?{...command,schemaVersion:2,paymentOptionId:claim.paymentOptionId}:command;}
export function validateMethodReceipt(command,result){if(command.schemaVersion===2)ensure(result?.schemaVersion===2&&result.paymentOptionId===(command.action==='issue_quote'?null:command.paymentOptionId));return validateReceipt(command,result);}
export function recipientIdentifier(recipient){return recipient.method==='cash_app'?recipient.cashtag:recipient.method==='apple_cash'?recipient.phone:recipient.email;}
