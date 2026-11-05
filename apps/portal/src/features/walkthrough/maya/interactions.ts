import type {AttributedUseEvent,ClientPlanViewV2,EffectiveUse,ProductRef,UseProjection} from '../../../../../../src/contracts/PortalCare.ts';
import {mapCareResult} from '../../../../../../src/contracts/PortalCareMapping.ts';
import {careChange,careDescriptor,sameCareValue} from '../../../../../../src/contracts/PortalCareValidation.ts';
import {readPlanShape} from '../../../../../../src/contracts/PortalRebuildValidation.ts';
import {captureUse} from '../../plan/useModel.ts';
import type {CapturedUse} from '../../plan/useModel.ts';
import {SAMPLE_ACTOR,SAMPLE_RECORDED_AT,sampleId} from './fixture.ts';

export const MAYA_SAMPLE_TODAY='2026-11-03';
const sameProduct=(a:ProductRef,b:ProductRef)=>sameCareValue(a,b);
/** This validates a READ projection, never a Care command or business receipt.
 * The authored later-story review is composed separately by the existing view. */
export function validateDemoProjection(view:ClientPlanViewV2):UseProjection {
  return (mapCareResult({...view,latestPublicReview:null},{schemaVersion:1,action:'read_client_plan_v2',version:null}) as ClientPlanViewV2).use;
}

/** Pure public-sample intent reduction. All actors/times are declared fictional
 * fixture values. No client identity, authority, request or Care basis exists. */
export function reduceMayaUse(view:ClientPlanViewV2,priorReports:readonly AttributedUseEvent[],input:CapturedUse):{use:UseProjection;reports:AttributedUseEvent[]} {
  if(!view.plan||view.access!=='active')throw Error('sample plan unavailable');
  if(priorReports.some(e=>e.amendment!==null))throw Error('sample amendments unavailable');
  const publication={version:view.plan.version,documentSchemaVersion:view.plan.documentSchemaVersion};
  if(!sameCareValue(input.sourcePublication,publication))throw Error('sample publication changed');
  const original=input.original;
  if(original&&!view.use.planProducts.some(s=>sameProduct(s.product,original))&&!view.use.reportedProducts.items.some(s=>sameProduct(s.product,original)))throw Error('sample product unavailable');
  const captured=captureUse(input.form,original,publication,MAYA_SAMPLE_TODAY);
  if(!sameCareValue(captured,input))throw Error('sample form changed');
  readPlanShape(captured.change,careChange);
  if(captured.descriptor)readPlanShape(captured.descriptor,careDescriptor);
  const use=structuredClone(view.use),reports=structuredClone([...priorReports]);
  const n=10000+use.revision*4,attribution={occurredOn:captured.occurredOn,channel:'portal' as const,sourcePublication:publication,reportedBy:SAMPLE_ACTOR,recordedBy:SAMPLE_ACTOR,recordedAt:SAMPLE_RECORDED_AT};
  const find=(p:ProductRef):EffectiveUse|undefined=>p.kind==='plan_product'?use.planProducts.find(s=>sameProduct(s.product,p)):use.reportedProducts.items.find(s=>sameProduct(s.product,p));
  function identity(subject:ProductRef,comparedWith:ProductRef|null,offset=0){
    const row=find(subject);
    if(!row||!captured.form.match)return;
    row.identity={...attribution,eventId:sampleId(n+offset),target:{subject,comparedWith:comparedWith?.kind==='plan_product'?comparedWith:null},match:captured.form.match};
  }
  if(original)identity(original,original.kind==='plan_product'?original:null);
  let subject=original;
  if(captured.descriptor){
    if(use.reportedProducts.items.length>=100)throw Error('reset the demo before adding more sample products');
    subject={kind:'client_reported_product',reportedProductId:sampleId(n+2),version:1};
    use.reportedProducts.items.push({product:subject,descriptor:captured.descriptor,state:'unreviewed',originalStart:{state:'unknown'},latestEvent:null,identity:null,contradiction:false});
    identity(subject,original?.kind==='plan_product'?original:null,1);
  }
  if(!subject)throw Error('sample product unavailable');
  const row=find(subject)!;
  const event:AttributedUseEvent={...attribution,eventId:sampleId(n+3),product:subject,change:captured.change,acquisition:captured.form.acquisition,identityEventId:row.identity?.eventId??null,originalActivationId:null,amendment:null};
  reports.push(event);
  const matching=reports.filter(e=>sameProduct(e.product,subject));
  const firstStart=matching.find(e=>e.change.kind==='started');
  // Known occurrence dates order the sample history; unknown occurrence uses
  // its declared recording time. Sequence breaks equal sample-time ties.
  const occurredKey=(e:AttributedUseEvent)=>e.occurredOn.state==='known'?e.occurredOn.value+'T00:00:00Z':e.recordedAt;
  const effective=matching.reduce((a,b)=>occurredKey(b)>=occurredKey(a)?b:a);
  const {change,amendment:_amendment,...summary}=effective;
  row.state=change.kind==='started'?subject.kind==='plan_product'?'using':'unreviewed':change.kind==='different'?'using_differently':change.kind==='unreviewed_added'?'unreviewed':change.kind;
  row.originalStart=firstStart?.occurredOn??{state:'unknown'};
  row.latestEvent={...summary,changeKind:change.kind,amendment:null};
  row.contradiction=matching.slice(matching.indexOf(effective)+1).some(e=>e.change.kind!==change.kind);
  use.revision++;
  return {use:validateDemoProjection({...view,use}),reports};
}
