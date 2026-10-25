import {createSyntheticClientRequests} from '../preview/synthetic-requests.js';
import {createCheckinPreviewRequest} from '../features/checkins/fixtures.js';
import {createPaymentPreviewStore,createPaymentPreviewRequest,syncPaymentPreviewProposal} from '../features/payments/fixtures.js';
import {createServicePreviewRequests} from '../features/service/fixtures.js';
const clone=value=>structuredClone(value);
const localId=index=>'ed000000-0000-4000-8000-'+String(index).padStart(12,'0');
const blocked=message=>{throw Object.assign(new Error(message),{status:403,code:'walkthrough_action_unavailable'});};
/** Unavailable methods cannot render a recipient, transfer link, QR or copy action. */
export function nonpayablePaymentOptions(){return [{id:localId(900),recipientVersion:1,recipient:{method:'zelle',name:'No payment in this view',email:'no-payment@example.invalid',phone:'+1 202 555 0100'},available:false}];}
/** This module has no fetch, account transport, persistent storage, message or upload implementation. */
export async function createWalkthroughAdapters(snapshot,{index=0}={}){
 if(snapshot?.schemaVersion!==1||!Array.isArray(snapshot.stages)||!snapshot.stages.length)throw Error('Walkthrough unavailable.');
 const bounded=Math.min(Math.max(index,0),snapshot.stages.length-1),stage=snapshot.stages[bounded];
 const now=()=>new Date(stage.day+'T18:00:00Z'),clientId=snapshot.caseId;
 const paymentStore=createPaymentPreviewStore({publicationVersion:1,recommendationId:'none',unitPriceCents:0,includeService:false,paymentOptionsFactory:nonpayablePaymentOptions});
 // No quote, purchase, service payment or confirmed address exists just because a plan exists.
 paymentStore.quotes=[];paymentStore.shippingAddress=null;paymentStore.shippingAddresses=[];
 const plan=createSyntheticClientRequests({identity:{clientId},presentation:snapshot.presentation,now,onChange:view=>{if(paymentStore.shippingAddress)syncPaymentPreviewProposal(paymentStore,view);}});
 const core=async(command,options)=>{if(command instanceof FormData)blocked('Uploads are unavailable in this walkthrough.');const result=await plan.core(command,options);return result;};core.syntheticPreview=true;
 const checkinStore={kind:'synthetic-checkin-preview',revision:0,nextCheckinOn:snapshot.stages.find(s=>s.review)?.review.occurredOn||null,reports:[],notes:[],uploads:new Map(),receipts:new Map()};
 const checkinRead=createCheckinPreviewRequest({mode:'client',store:checkinStore});
 const checkins=async(command,options)=>{if(command instanceof FormData)blocked('Photo uploads are unavailable in this walkthrough.');if(command?.action!=='client_read')blocked('Use the preset story to explore a review. Nothing is sent.');return checkinRead(command,options);};checkins.syntheticPreview=true;
 const paymentRead=createPaymentPreviewRequest({mode:'client',store:paymentStore});
 const payments=async(command,options)=>{if(command instanceof FormData)blocked('Payment uploads are unavailable in this walkthrough.');if(command?.action!=='client_read')blocked('Nothing is charged or sent in this view.');return paymentRead(command,options);};payments.syntheticPreview=true;
 let serial=0;
 for(const current of snapshot.stages.slice(0,bounded+1)){
  for(const event of current.events||[]){const view=plan.read();await core({...clone(event),requestId:localId(++serial),expectedRevision:view.revision,version:view.plan.version});}
 }
 const service=createServicePreviewRequests({clientId,clientView:plan.read(),now:now().toISOString()});
 const read=()=>{service.updateClientView(plan.read());return service.getClientView();};
 for(const current of snapshot.stages.slice(0,bounded+1)){
  let reviewId=null;
  if(current.review){const r=current.review;const saved=await service.advisor({action:'record_review',clientId,requestId:localId(1000+(++serial)),expectedRevision:service.read().revision,channel:r.channel==='phone'?'call':r.channel,occurredOn:r.occurredOn,summary:r.summary,reportedUse:r.reportedUse,decision:r.decision,nextReviewOn:r.nextReviewOn,privateNote:''});reviewId=saved.entityId;checkinStore.nextCheckinOn=r.nextReviewOn;}
  for(const update of current.instructionUpdates||[]){
   const step=read().activeRoutine.find(s=>s.kind==='product'&&s.productId===update.productKey);if(!step)throw Error('A reviewed instruction needs an active product.');
   const prior=service.read().instructions.filter(i=>i.slot===step.slot&&i.productId===step.productId).at(-1),usage=clone(step.usage);
   for(const period of ['morning','evening'])if(update.instructions[period]){usage.short[period]=update.instructions[period];if(!usage.periods.includes(period))usage.periods.push(period);}
   usage.instructions=[...usage.periods.map(period=>usage.short[period]).filter(Boolean),...(update.instructions.notes?[update.instructions.notes]:[])];
   const draft=await service.advisor({action:'save_instruction_draft',clientId,requestId:localId(1000+(++serial)),expectedRevision:service.read().revision,slot:step.slot,productId:step.productId,planVersion:plan.read().plan.version,baseInstructionVersion:prior?.version||0,usage,reason:update.reason,reviewId,effectiveOn:current.day});
   await service.advisor({action:'publish_instruction_revision',clientId,requestId:localId(1000+(++serial)),expectedRevision:service.read().revision,draftId:draft.entityId});
  }
 }
 const client=async(command,options)=>command?.action==='client_read_v2'?read():core(command,options);client.syntheticPreview=true;
 return {core:client,checkins,payments,service,paymentStore,checkinStore,read,now,clientId,productLabels:plan.productLabels,stage,readPaymentStatus:()=>clone({service:paymentStore.service,claims:paymentStore.claims,quotes:paymentStore.quotes})};
}
