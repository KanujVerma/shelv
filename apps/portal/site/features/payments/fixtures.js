import {nextMonth} from './model.js';
/** Synthetic-only preview state; never fetches, authenticates, transfers money or persists data. */
const syntheticAddress={recipientName:'Synthetic Client',line1:'123 Example Lane',line2:'',city:'Example City',region:'CA',postalCode:'94500',countryCode:'US'};
const recipients=[{method:'zelle',name:'Kanuj Verma',email:'kanuj.verma12@gmail.com',phone:'(925)719-1334'},{method:'cash_app',name:'Kanuj Verma',cashtag:'$KanujVerma'},{method:'apple_cash',name:'Kanuj Verma',phone:'(925)719-1334'}];
export const previewPaymentOptions=()=>recipients.map(recipient=>({id:crypto.randomUUID(),recipientVersion:1,recipient:structuredClone(recipient),available:true}));
export function createPaymentPreviewStore({publicationVersion=1,recommendationId='moisturizer-1',unitPriceCents=1600,onConfirmed,includeService=true,contractVersion=2}={}){
 const period=includeService&&publicationVersion>0?{startOn:'2026-10-01',endOn:'2026-11-01'}:null;
 const shippingAddress={version:1,address:{...syntheticAddress}},products=publicationVersion>0?unitPriceCents:0;
 return {revision:0,shippingAddresses:[shippingAddress],quotes:[{id:'00000000-0000-4000-8000-000000000003',version:1,publicationVersion,status:'payable',currency:'USD',serviceCents:includeService?10000:0,servicePeriod:period,shippingAddressVersion:products?1:null,items:products?[{recommendationId,quantity:1,unitPriceCents,lineTotalCents:unitPriceCents}]:[],productSubtotalCents:products,taxCents:0,shippingCents:0,productTotalCents:products,totalCents:(includeService?10000:0)+products,contractVersion,paymentOptions:contractVersion===2?previewPaymentOptions():[]}],claims:[],shippingAddress,service:{status:'unpaid',period},nextServicePeriod:period,receipts:new Map(),evidence:new Map(),onConfirmed};
}
/** Synthetic quote preparation only. Reads cannot renew paid service or quote already-funded products. */
export function syncPaymentPreviewProposal(state,view){
 const proposal=view?.orderProposal;if(!proposal||proposal.subtotalCents===null)return false;
 const funded=new Set(state.claims.filter(claim=>claim.status==='confirmed').flatMap(claim=>state.quotes.find(q=>q.id===claim.quoteId)?.items.map(item=>item.recommendationId)||[]));
 const items=proposal.items.filter(item=>!funded.has(item.id)).map(item=>{if(typeof item.id!=='string'||!Number.isSafeInteger(item.priceCents)||item.priceCents<=0)throw Error('invalid_preview_proposal');return {recommendationId:item.id,quantity:1,unitPriceCents:item.priceCents,lineTotalCents:item.priceCents};}).sort((a,b)=>a.recommendationId.localeCompare(b.recommendationId));
 if(new Set(items.map(item=>item.recommendationId)).size!==items.length)throw Error('invalid_preview_proposal');
 const publicationVersion=view.plan?.version||0,serviceCents=state.service.status==='unpaid'?10000:0,servicePeriod=serviceCents&&publicationVersion>0?(state.nextServicePeriod||state.quotes.at(-1)?.servicePeriod||null):null;
 const productSubtotalCents=items.reduce((sum,item)=>sum+item.lineTotalCents,0),money={serviceCents,servicePeriod,shippingAddressVersion:items.length?state.shippingAddress?.version||null:null,items,productSubtotalCents,taxCents:0,shippingCents:0,productTotalCents:productSubtotalCents,totalCents:serviceCents+productSubtotalCents};
 if(!Number.isSafeInteger(money.totalCents)||money.totalCents>100000000||items.length&&(!publicationVersion||money.shippingAddressVersion===null))throw Error('invalid_preview_proposal');
 const fingerprint=JSON.stringify({publicationVersion,...money});if(state.proposalFingerprint===fingerprint)return false;
 const initial=state.proposalFingerprint===undefined&&!state.previewRead&&state.revision===0&&state.quotes.length===1&&state.quotes[0].status==='payable'&&state.claims.length===0&&state.receipts.size===0&&state.evidence.size===0;
 state.proposalFingerprint=fingerprint;
 if(initial){state.quotes[0]={...state.quotes[0],publicationVersion,...money};if(!publicationVersion){state.nextServicePeriod=null;state.service.period=null;}return false;}
 const payable=state.quotes.some(q=>q.status==='payable');if(!payable&&money.totalCents===0)return false;
 state.quotes=state.quotes.map(q=>q.status==='payable'?{...q,status:'superseded'}:q);
 if(money.totalCents>0)state.quotes.push({...state.quotes.at(-1),id:crypto.randomUUID(),version:Math.max(...state.quotes.map(q=>q.version),0)+1,status:'payable',currency:'USD',publicationVersion,...money,contractVersion:2,paymentOptions:previewPaymentOptions()});
 state.revision++;return true;
}
function legacyStore(mode){
 const store=createPaymentPreviewStore({publicationVersion:3,recommendationId:'cleanser',unitPriceCents:1800,contractVersion:1});store.revision=4;
 Object.assign(store.quotes[0],{version:2,items:[{recommendationId:'cleanser',quantity:2,unitPriceCents:1800,lineTotalCents:3600}],productSubtotalCents:3600,taxCents:300,shippingCents:300,productTotalCents:4200,totalCents:14200});
 if(mode==='advisor')store.claims=[{id:'00000000-0000-4000-8000-000000000004',quoteId:store.quotes[0].id,quoteVersion:2,status:'submitted_unverified',serviceCents:10000,productCents:4200,totalCents:14200,evidenceId:null,shippingAddressVersion:1}];return store;
}
export function createPaymentPreviewRequest({mode='client',scenario='default',store}={}){
 const state=store??legacyStore(mode);let uncertain=scenario==='uncertain';const copy=value=>structuredClone(value),fail=(status,code)=>{throw {status,code};};
 const request=async function(command,{signal}={}){
  if(signal?.aborted)throw new DOMException('Aborted','AbortError');
  if(command instanceof FormData){let metadata;try{metadata=JSON.parse(command.get('metadata'));}catch{return fail(400,'invalid_input');}if(metadata.action!=='upload_evidence'||metadata.requestId===metadata.completionRequestId)return fail(400,'invalid_input');const q=state.quotes.find(q=>q.id===metadata.quoteId),option=q?.paymentOptions.find(o=>o.id===metadata.paymentOptionId&&o.available);if(q?.contractVersion===2&&(!option||metadata.schemaVersion!==2))return fail(409,'concierge_payment_method_conflict');const fingerprint=JSON.stringify(metadata),prior=state.evidence.get(metadata.requestId);if(prior){if(prior.fingerprint!==fingerprint)return fail(409,'concierge_request_conflict');return copy(prior.result);}const result={evidenceId:crypto.randomUUID(),quoteId:metadata.quoteId,quoteVersion:metadata.quoteVersion,status:'uploaded_unverified',...(metadata.schemaVersion===2?{schemaVersion:2,paymentOptionId:metadata.paymentOptionId}:{})};state.evidence.set(metadata.requestId,{fingerprint,result});return result;}
  if(['client_read','advisor_read'].includes(command.action)){state.previewRead=true;if(command.schemaVersion!==2&&state.quotes.some(q=>q.contractVersion===2))return fail(409,'concierge_payment_contract_upgrade_required');const recipient={method:'zelle',name:'Synthetic advisor',email:'advisor@example.invalid',phone:'(925) 555-0101'};return copy({revision:state.revision,quotes:state.quotes,claims:state.claims.map(c=>({...c,paymentOptionId:c.paymentOptionId??null})),shippingAddress:state.shippingAddress,shippingAddresses:state.shippingAddresses,service:state.service,nextServicePeriod:state.nextServicePeriod,...(command.schemaVersion===2?{schemaVersion:2,legacyRecipient:recipient}:{recipient})});}
  if(command.action==='evidence_url')return fail(503,'preview_private_storage_unavailable');
  const fingerprint=JSON.stringify(command),prior=state.receipts.get(command.requestId);if(prior){if(prior.fingerprint!==fingerprint)return fail(409,'concierge_request_conflict');return copy(prior.result);}
  if(command.expectedRevision!==state.revision)return fail(409,'concierge_revision_conflict');
  if(command.action==='confirm_shipping_address'){
   state.shippingAddress={version:(state.shippingAddress?.version??0)+1,address:copy(command.address)};state.shippingAddresses.push(state.shippingAddress);state.quotes=state.quotes.map(item=>item.status==='payable'&&item.productTotalCents>0?{...item,status:'superseded'}:item);
   const result={revision:++state.revision,operation:'confirm_shipping_address',addressVersion:state.shippingAddress.version};state.receipts.set(command.requestId,{fingerprint,result});return copy(result);
  }
  let selected=state.quotes.find(item=>item.id===command.quoteId),claim=state.claims.find(item=>item.id===command.claimId),status,claimId=null;
  if(command.action==='issue_quote'){
   state.quotes=state.quotes.map(item=>item.status==='payable'?{...item,status:'superseded'}:item);const {action,clientId,requestId,expectedRevision,...amounts}=command;
   selected={...copy(amounts),id:crypto.randomUUID(),version:Math.max(...state.quotes.map(item=>item.version),0)+1,status:'payable',currency:'USD',contractVersion:command.schemaVersion===2?2:1,paymentOptions:command.schemaVersion===2?previewPaymentOptions():[]};state.quotes.push(selected);status='payable';
  }else{
   if(!selected||selected.status!=='payable'||selected.version!==command.quoteVersion||selected.serviceCents!==command.serviceCents||selected.productTotalCents!==command.productCents||selected.totalCents!==command.totalCents)return fail(409,'concierge_quote_stale');
   if(selected.contractVersion===2&&command.schemaVersion!==2)return fail(409,'concierge_payment_contract_upgrade_required');if(command.schemaVersion===2&&!selected.paymentOptions.some(o=>o.id===command.paymentOptionId&&(command.action!=='submit_claim'||o.available)))return fail(409,'concierge_payment_method_conflict');
   if(command.action==='submit_claim'){if(command.evidenceId&&command.schemaVersion===2&&![...state.evidence.values()].some(e=>e.result.evidenceId===command.evidenceId&&e.result.paymentOptionId===command.paymentOptionId))return fail(409,'concierge_payment_method_conflict');claimId=crypto.randomUUID();state.claims.push({id:claimId,quoteId:selected.id,quoteVersion:selected.version,status:'submitted_unverified',serviceCents:command.serviceCents,productCents:command.productCents,totalCents:command.totalCents,evidenceId:command.evidenceId,shippingAddressVersion:selected.shippingAddressVersion,paymentOptionId:command.paymentOptionId??null});status='submitted_unverified';}
   else if(['confirm_payment','reject_claim'].includes(command.action)){
    if(!claim||claim.status!=='submitted_unverified'||claim.quoteId!==selected.id||command.schemaVersion===2&&claim.paymentOptionId!==command.paymentOptionId)return fail(409,'concierge_claim_conflict');if(command.action==='confirm_payment'&&(command.schemaVersion===2?command.receiptVerified:command.bankReceiptVerified)!==true)return fail(400,'invalid_input');
    claimId=claim.id;status=command.action==='confirm_payment'?'confirmed':'rejected';state.claims=state.claims.map(item=>item.id===claimId?{...item,status}:item);if(status==='confirmed'){state.quotes=state.quotes.map(item=>item.id===selected.id?{...item,status:'settled'}:item);if(selected.serviceCents>0)state.service={status:selected.publicationVersion===0?'pending_publication':'active',period:selected.servicePeriod??state.service.period};if(selected.servicePeriod)state.nextServicePeriod={startOn:selected.servicePeriod.endOn,endOn:nextMonth(selected.servicePeriod.endOn)};}
   }else return fail(400,'invalid_input');
  }
  const serviceAccessStatus=status==='confirmed'&&selected.serviceCents>0?(state.service.status==='active'?'active':'pending_publication'):null;
  const result={revision:++state.revision,operation:command.action,quoteId:selected.id,claimId,status,serviceUnlocked:serviceAccessStatus==='active',serviceAccessStatus,productOrderStatus:status==='confirmed'&&selected.productTotalCents>0?'ready_to_purchase':null,...(command.schemaVersion===2?{schemaVersion:2,paymentOptionId:command.paymentOptionId??null}:{})};
  state.receipts.set(command.requestId,{fingerprint,result});if(status==='confirmed')state.onConfirmed?.(copy(result));if(uncertain){uncertain=false;return fail(503,'unavailable');}return copy(result);
 };request.syntheticPreview=true;return request;
}
