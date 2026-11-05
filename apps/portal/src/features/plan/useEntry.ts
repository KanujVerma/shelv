import type {ProductRef} from '../../../../../src/contracts/PortalCare.ts';
import type {ClientPlanProps} from './types.ts';
import {isPurchaseDecision} from './model.ts';

interface SelfPurchaseEntry {productId:string;decisionId:string;version:number;documentSchemaVersion:1|2|3}
// Ownership of public UI allocations only, never permission or a Care receipt.
// Abandoning one entry cannot delete or invalidate a replacement in the memory.
const demoEntries=new WeakMap<SelfPurchaseEntry,ClientPlanProps['session']['isCurrent']>();
const entryKey=(props:ClientPlanProps,productId:string)=>`care-self-purchase:${props.session.key}:${productId}`;
const available=(props:ClientPlanProps)=>props.mode==='client'&&props.view.access==='active'&&!!props.view.plan&&!(props.view.schemaVersion===3&&props.view.currentGuidance?.mode==='historical_document')&&props.session.isCurrent();

const demoAvailable=(props:ClientPlanProps)=>props.mode==='public-demo'&&props.view.schemaVersion===2&&props.view.access==='active'&&!!props.view.plan&&!!props.navigation&&!!props.onViewChange&&props.demoInteractions?.mode==='public-demo'&&props.demoInteractions.use?.kind==='demo-use'&&props.demoInteractions.choice?.kind==='demo-choice'&&props.session.isCurrent()&&props.demoInteractions.use.isCurrent()&&props.demoInteractions.choice.isCurrent()&&props.session.isCurrent();

/** Public sample UI entry only. The existing client callback is never used. */
export function canOpenDemoSelfPurchase(props:ClientPlanProps,productId:string|null,decisionId:string):boolean {
  if(!demoAvailable(props)||!productId)return false;
  const route=props.navigation!.route,plan=props.view.plan!;
  const decision=plan.content.decisions.find(item=>item.id===decisionId);
  return route.name==='recommendation'&&route.decisionId===decisionId&&!!decision&&isPurchaseDecision(decision)&&decision.primaryProductId===productId&&plan.content.products.some(product=>product.id===productId);
}

export function openDemoSelfPurchase(props:ClientPlanProps,productId:string,decisionId:string):void {
  if(!canOpenDemoSelfPurchase(props,productId,decisionId))return;
  const plan=props.view.plan!,navigation=props.navigation!,routine=navigation.route.routine;
  const entry:SelfPurchaseEntry=Object.freeze({productId,decisionId,version:plan.version,documentSchemaVersion:plan.documentSchemaVersion}),key=entryKey(props,productId);
  demoEntries.set(entry,props.session.isCurrent);
  try{
    props.session.memory.set(key,entry);
    if(!canOpenDemoSelfPurchase(props,productId,decisionId)||props.session.memory.get<SelfPurchaseEntry>(key)!==entry||!canOpenDemoSelfPurchase(props,productId,decisionId)){demoEntries.delete(entry);return;}
    // Navigation deliberately retires the old view/route context. Consumption
    // validates this allocation under the form's new current context instead.
    navigation.navigate({name:'product-use',productId,routine});
  }catch{demoEntries.delete(entry);}
}

function acquisitionAvailable(props:ClientPlanProps,product:ProductRef|null):boolean {
  if(available(props))return true;
  if(!demoAvailable(props)||product?.kind!=='plan_product')return false;
  const route=props.navigation!.route;
  return route.name==='product-use'&&route.productId===product.productId;
}

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
  if(!acquisitionAvailable(props,product)||product?.kind!=='plan_product')return null;
  const entry=props.session.memory.get<SelfPurchaseEntry>(entryKey(props,product.productId));
  if(!acquisitionAvailable(props,product))return null;
  if(props.mode==='public-demo'&&(!entry||demoEntries.get(entry)!==props.session.isCurrent))return null;
  const plan=props.view.plan!;
  return entry&&entry.productId===product.productId&&entry.version===plan.version&&entry.documentSchemaVersion===plan.documentSchemaVersion&&entry.version===product.publication.version&&entry.documentSchemaVersion===product.publication.documentSchemaVersion&&plan.content.decisions.some(decision=>decision.id===entry.decisionId&&isPurchaseDecision(decision)&&decision.primaryProductId===product.productId)?'self':null;
}
