import type {ProductRef} from '../../../../../src/contracts/PortalCare.ts';
import type {ClientPlanProps} from './types.ts';
import {isPurchaseDecision} from './model.ts';

interface SelfPurchaseEntry {productId:string;decisionId:string;version:number;documentSchemaVersion:1|2|3}
const entryKey=(props:ClientPlanProps,productId:string)=>`care-self-purchase:${props.session.key}:${productId}`;
const available=(props:ClientPlanProps)=>props.mode==='client'&&props.view.access==='active'&&!!props.view.plan&&!(props.view.schemaVersion===3&&props.view.currentGuidance?.mode==='historical_document')&&props.session.isCurrent();

/** Navigation context only. This creates no choice, use, quote or order. The
 * existing report intent is never overwritten, including an uncertain write. */
export function prepareSelfPurchase(props:ClientPlanProps,productId:string,decisionId:string):boolean {
  if(!available(props))return false;
  const plan=props.view.plan!,decision=plan.content.decisions.find(item=>item.id===decisionId);
  if(!decision||!isPurchaseDecision(decision)||decision.primaryProductId!==productId||!plan.content.products.some(product=>product.id===productId))return false;
  if(props.view.schemaVersion!==1){
    const entry:SelfPurchaseEntry={productId,decisionId,version:plan.version,documentSchemaVersion:plan.documentSchemaVersion};
    props.session.memory.set(entryKey(props,productId),entry);
  }
  return available(props);
}

export function selfPurchaseAcquisition(props:ClientPlanProps,product:ProductRef|null):'self'|null {
  if(!available(props)||product?.kind!=='plan_product')return null;
  const entry=props.session.memory.get<SelfPurchaseEntry>(entryKey(props,product.productId));
  if(!available(props))return null;
  const plan=props.view.plan!;
  return entry&&entry.productId===product.productId&&entry.version===plan.version&&entry.documentSchemaVersion===plan.documentSchemaVersion&&entry.version===product.publication.version&&entry.documentSchemaVersion===product.publication.documentSchemaVersion&&plan.content.decisions.some(decision=>decision.id===entry.decisionId&&isPurchaseDecision(decision)&&decision.primaryProductId===product.productId)?'self':null;
}
