import type {ContentId} from '../../../../../src/contracts/PortalRebuild.ts';
import type {ClientPublicationRef,EffectiveUse,PlanProductRef} from '../../../../../src/contracts/PortalCare.ts';
import type {ClientPlanReadView} from './types.ts';

/** Structural compatibility with the frozen product selection. No dependency
 * on an unadmitted Commerce contract or authority inferred from an order. */
export interface OrderProductUseSelection {publication:ClientPublicationRef;decisionId:ContentId;productId:ContentId}
export type OrderProductUseView={status:'available';use:EffectiveUse<PlanProductRef>}|{status:'unavailable'};

/** W0 supplies an authorized, strictly decoded read of the exact selected
 * publication. This lookup is display data, never permission to record Start. */
export function selectOrderProductUse(view:ClientPlanReadView|null,selection:OrderProductUseSelection):OrderProductUseView {
  if(!view||view.schemaVersion===1||view.access==='preparation'||!view.plan)return {status:'unavailable'};
  const plan=view.plan,publication=selection.publication;
  if(plan.version!==publication.version||plan.documentSchemaVersion!==publication.documentSchemaVersion)return {status:'unavailable'};
  const product=plan.content.products.find(product=>product.id===selection.productId);
  const decision=plan.content.decisions.find(decision=>decision.id===selection.decisionId);
  if(!product||!decision||decision.primaryProductId!==product.id&&!decision.currentProductIds.includes(product.id)&&!decision.alternativeProductIds.includes(product.id))return {status:'unavailable'};
  const rows=view.use.planProducts.filter(row=>row.product.productId===product.id);
  if(rows.length!==1)return {status:'unavailable'};
  const use=rows[0]!;
  if(use.product.publication.version!==publication.version||use.product.publication.documentSchemaVersion!==publication.documentSchemaVersion||use.product.slotId!==null)return {status:'unavailable'};
  return {status:'available',use};
}
