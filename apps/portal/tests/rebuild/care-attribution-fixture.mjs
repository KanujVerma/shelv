import {carePlan,summary,uid,read,owner} from './care-fixture.mjs';
import {mapCareResult} from '../../../../src/contracts/PortalCareMapping.ts';

export const actors={client:owner,advisor:uid(911),otherAdvisor:uid(913)};
export const correctionTime='2026-10-31T01:00:00Z';

export function attributedCorrection(actor,{differentProduct=false,selfRecorded=false,reportedProduct=false,access='active'}={}){
  const view=carePlan();
  view.access=access;
  const planRow=view.use.planProducts.find(row=>row.product.productId==='cerave-pm');
  const original=reportedProduct?{...planRow}:planRow;
  const selected=differentProduct?view.use.planProducts.find(row=>row.product.productId==='ordinary-azelaic-10'):original;
  if(reportedProduct){
    original.product={kind:'client_reported_product',reportedProductId:uid(914),version:1};
    original.descriptor={name:'Synthetic reported moisturizer',brand:{state:'unknown'},variant:{state:'unknown'},strength:{state:'unknown'},sizeLabel:{state:'unknown'},labelPhotoIds:[]};
    view.use.reportedProducts.items.push(original);
  }
  const event=summary(original.product,reportedProduct?'unreviewed_added':'paused',910);
  event.recordedBy=selfRecorded?actors.client:actors.advisor;
  event.channel=selfRecorded?'portal':'call';
  event.occurredOn={state:'known',value:'2026-10-29'};
  const replacement={product:selected.product,change:{kind:'different',details:'CU3 CURRENT DETAILS',frequency:{state:'known',value:'twice a week'},amount:{state:'unknown'}},sourcePublication:selected.product.kind==='plan_product'?selected.product.publication:null,occurredOn:{state:'unknown'},acquisition:'self',identityEventId:null};
  const amendment={id:uid(912),eventId:event.eventId,previousAmendmentHeadId:null,replacement,amendedBy:actors[actor],amendedAt:correctionTime,reason:'CU3 CORRECTION REASON'};
  const {replacement:_,reason:__,...head}=amendment,{change,...effective}=replacement;
  selected.state='using_differently';
  selected.latestEvent={...event,amendment:{...head,...effective,changeKind:change.kind}};
  const full={...event,change:{kind:reportedProduct?'unreviewed_added':'paused',details:'CU3 ORIGINAL CALL DETAILS'},amendment};
  delete full.changeKind;
  const entries=reportedProduct?[{kind:'reported_product',event:{...event,product:original.product,descriptor:original.descriptor,previousVersion:null,reason:null,initialUse:full}}]:[{kind:'use',event:full}];
  // A descriptor event has attribution but no use-specific summary fields.
  if(reportedProduct)for(const key of ['changeKind','acquisition','identityEventId','originalActivationId','amendment'])delete entries[0].event[key];
  const command={schemaVersion:1,action:'read_use_history_v1',product:original.product,cursor:null,limit:25};
  const history=mapCareResult({revision:0,entries,nextCursor:null},command);
  return {view:mapCareResult(view,read),history,command,original:original.product,selected:selected.product,amendment,route:reportedProduct?'/plan/products/'+original.product.reportedProductId:'/plan/products/'+selected.product.productId};
}
