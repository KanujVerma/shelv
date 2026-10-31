import type {ClientPlanView,AdvisorPublicationView} from './PortalRebuild.ts';
import type {CareCommand,CareResult,CareWriteResult,ClientPlanViewV2,AdvisorPublicationViewV2,ProductRef,AttributedUseEvent,EffectiveUse} from './PortalCare.ts';
import {mapPlanResult} from './PortalRebuildMapping.ts';
import {readPlanShape} from './PortalRebuildValidation.ts';
import type {PlanShape} from './PortalRebuildValidation.ts';
import {readObject,requireValue} from './ConciergePortalValidation.ts';
import {careObject as obj,careArray as arr,careEnum as en,careNull as nil,careUnion as union,careUuid as uuid,careRevision as rev,carePositive as pos,careText as text,careInstant as instant,careBool as bool,careCursor as cursor,careDay as day,carePublication as pub,carePlanProduct as planProduct,careReportedProduct as reportedProduct,careProduct as product,careDescriptor as descriptor,careIdentityTarget as identityTarget,careIdentityAnswer as answer,careChange as change,careOccurrence as occurrence,careAcquisition as acquisition,careReplacement as replacement,sameCareValue} from './PortalCareValidation.ts';
import {carePlanProductsMax,carePageMaxBytes,careResponseMaxBytes} from './PortalCareValues.ts';
export const careEventRefShape=obj({kind:en('legacy_report','goal_report','conversation','use','identity','reported_product','review','reply','instruction'),id:{type:'text',max:100,empty:false}});
export const careReceiptShape=obj({requestId:uuid,event:careEventRefShape,revision:pos,recordedAt:instant,notificationEventId:nil(uuid)});
const attribution={...occurrence,reportedBy:uuid,recordedBy:uuid,recordedAt:instant,sourcePublication:nil(pub)};
export const careAmendmentShape=obj({id:uuid,eventId:uuid,previousAmendmentHeadId:nil(uuid),replacement,amendedBy:uuid,amendedAt:instant,reason:text});
export const careUseEventShape=obj({...attribution,eventId:uuid,product,change,acquisition,identityEventId:nil(uuid),originalActivationId:nil({type:'text',max:100,empty:false}),amendment:nil(careAmendmentShape)});
export const careIdentityEventShape=obj({...attribution,eventId:uuid,target:identityTarget,answer});
const changeKind=en('started','paused','stopped','different','unreviewed_added');
export const careAmendmentSummaryShape=obj({id:uuid,eventId:uuid,previousAmendmentHeadId:nil(uuid),amendedBy:uuid,amendedAt:instant,...Object.fromEntries(Object.entries(replacement.fields!).filter(([key])=>key!=='change')),changeKind});
export const careUseSummaryShape=obj({...attribution,eventId:uuid,product,changeKind,acquisition,identityEventId:nil(uuid),originalActivationId:nil({type:'text',max:100,empty:false}),amendment:nil(careAmendmentSummaryShape)});
export const careIdentitySummaryShape=obj({...attribution,eventId:uuid,target:identityTarget,match:en('yes','no','not_sure')});
const effective={state:en('not_reported','using','paused','stopped','using_differently','unreviewed'),originalStart:day,latestEvent:nil(careUseSummaryShape),identity:nil(careIdentitySummaryShape),contradiction:bool};
export const carePlanUseShape=obj({product:planProduct,...effective});
export const careReportedUseShape=obj({product:reportedProduct,descriptor,...effective});
export const careUseProjectionShape=obj({revision:rev,planProducts:arr(carePlanUseShape,carePlanProductsMax),reportedProducts:obj({items:arr(careReportedUseShape),nextCursor:nil(cursor)})});
export const careHistoryEntryShape=union(obj({kind:en('use'),event:careUseEventShape}),obj({kind:en('identity'),event:careIdentityEventShape}),obj({kind:en('reported_product'),event:obj({...attribution,eventId:uuid,product:reportedProduct,descriptor,previousVersion:nil(pos),reason:nil(text),initialUse:nil(careUseEventShape)})}),obj({kind:en('amendment'),amendment:careAmendmentShape}));
const writeShape=union(careReceiptShape,obj({receipt:careReceiptShape,product:reportedProduct}));
export const careResultShapes={receipt:careReceiptShape,created:obj({receipt:careReceiptShape,product:reportedProduct}),reported:obj({revision:rev,items:arr(careReportedUseShape),nextCursor:nil(cursor)}),history:obj({revision:rev,entries:arr(careHistoryEntryShape),nextCursor:nil(cursor)})};
function sameProduct(a:ProductRef,b:ProductRef):boolean{return a.kind==='plan_product'&&b.kind==='plan_product'?sameCareValue(a.publication,b.publication)&&a.productId===b.productId:sameCareValue(a,b);}
function validateEffective(s:EffectiveUse):void{
 if(s.latestEvent){const e=s.latestEvent;requireValue((sameProduct(e.amendment?.product??e.product,s.product)||((e.amendment?.product??e.product).kind==='plan_product'&&s.product.kind==='plan_product'&&((e.amendment?.product??e.product) as import('./PortalCare.ts').PlanProductRef).productId===s.product.productId)));if(e.amendment)requireValue(e.amendment.eventId===e.eventId);}
 if(s.identity)requireValue(sameProduct(s.identity.target.subject,s.product));
}
function mapWrite(value:unknown,requestId:string):CareWriteResult{
 const r=readPlanShape(value,writeShape) as CareWriteResult,receipt='receipt'in r?r.receipt:r;requireValue(receipt.requestId===requestId);return r;
}
/** Strict positive projection; safe v1 document validation is reused without widening it. */
export function mapCareResult(value:unknown,command:CareCommand):CareResult{
 requireValue(new TextEncoder().encode(JSON.stringify(value)).byteLength<=careResponseMaxBytes);
 if(command.action==='request_status_v1'){
  const v=readObject(value);if(v.status==='absent')return readPlanShape(v,obj({status:en('absent')})) as {status:'absent'};
  requireValue(Object.keys(v).length===2&&v.status==='committed'&&Object.hasOwn(v,'receipt'));
  return {status:'committed',receipt:mapWrite(v.receipt,command.requestId)};
 }
 if(command.action==='read_client_plan_v2'||command.action==='read_advisor_publication_v2'){
  const v=readObject(value);requireValue(v.schemaVersion===2&&Object.hasOwn(v,'use')&&v.latestPublicReview===null);
  const {schemaVersion:_schema,use,latestPublicReview:_review,...old}=v;
  const base=mapPlanResult({...old,schemaVersion:1},command.action==='read_client_plan_v2'?{schemaVersion:1,action:'read_client_plan_v1',version:command.version}:{schemaVersion:1,action:'read_advisor_publication_v1',clientId:command.clientId,version:command.version});
  const projection=readPlanShape(use,careUseProjectionShape) as ClientPlanViewV2['use'];
  const b=base as ClientPlanView|AdvisorPublicationView;
  requireValue(new TextEncoder().encode(JSON.stringify(projection.reportedProducts)).byteLength<=carePageMaxBytes);
  if(b.plan){requireValue(command.version===null||b.plan.version===command.version);requireValue(projection.planProducts.length===b.plan.content.products.length&&new Set(projection.planProducts.map(s=>s.product.productId)).size===projection.planProducts.length);for(const s of projection.planProducts){requireValue(s.product.slotId===null&&s.product.publication.version===b.plan.version&&s.product.publication.documentSchemaVersion===b.plan.documentSchemaVersion&&b.plan.content.products.some(p=>p.id===s.product.productId));validateEffective(s);}}
  else requireValue(projection.planProducts.length===0);
  projection.reportedProducts.items.forEach(validateEffective);
  return {...b,schemaVersion:2,use:projection,latestPublicReview:null};
 }
 if(command.action==='read_reported_products_v1'){
  const r=readPlanShape(value,careResultShapes.reported) as import('./PortalCare.ts').ReportedProductsPage;
  requireValue(new TextEncoder().encode(JSON.stringify(r)).byteLength<=carePageMaxBytes);
  requireValue(r.revision===command.expectedUseRevision&&r.items.length<=command.limit);r.items.forEach(validateEffective);return r;
 }
 if(command.action==='read_use_history_v1'||command.action==='read_advisor_use_history_v1'){
  const r=readPlanShape(value,careResultShapes.history) as import('./PortalCare.ts').UseHistoryPage;requireValue(new TextEncoder().encode(JSON.stringify(r)).byteLength<=carePageMaxBytes);requireValue(r.entries.length<=command.limit);
  for(const entry of r.entries)if(entry.kind==='reported_product'&&entry.event.initialUse){const e=entry.event,u=e.initialUse!;requireValue(e.previousVersion===null&&u.eventId===e.eventId&&sameCareValue(u.product,e.product)&&u.change.kind==='unreviewed_added'&&u.amendment===null);}
  if(command.product)for(const entry of r.entries){const p:ProductRef=entry.kind==='use'?entry.event.product:entry.kind==='identity'?entry.event.target.subject:entry.kind==='reported_product'?entry.event.product:entry.amendment.replacement.product;const matches=(candidate:ProductRef)=>candidate.kind==='plan_product'&&command.product?.kind==='plan_product'?sameCareValue(candidate.publication,command.product.publication)&&candidate.productId===command.product.productId&&(command.product.slotId===null||candidate.slotId===command.product.slotId):sameCareValue(candidate,command.product);requireValue(matches(p)||(entry.kind==='use'&&entry.event.amendment!==null&&matches(entry.event.amendment.replacement.product)));}
  return r;
 }
 const r=mapWrite(value,command.requestId);
 requireValue(('receipt'in r)===(command.action==='report_unreviewed_product_v1'||command.action==='record_client_unreviewed_product_v1'));
 const receipt='receipt'in r?r.receipt:r;requireValue(receipt.revision===command.expectedUseRevision+1);
 const kind=command.action==='report_identity_v1'?'identity':command.action==='amend_reported_product_v1'||'receipt'in r?'reported_product':'use';requireValue(receipt.event.kind===kind);
 return r;
}
