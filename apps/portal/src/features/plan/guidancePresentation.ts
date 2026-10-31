import type {InstructionScope,ClientPlanViewV3} from '../../../../../src/contracts/PortalReview.ts';
import {instructionScopes} from '../../../../../src/contracts/PortalReviewMapping.ts';
import type {PlanDecision} from '../../../../../src/contracts/PortalRebuild.ts';
import type {PortalRoute} from '../../navigation/routes.ts';
import type {GuidanceHydrator} from './guidanceHydration.ts';
import {routineFor,suppressContinue} from './model.ts';
export function productInstructionScopes(view:ClientPlanViewV3,productId:string){return instructionScopes(view).filter(s=>s.productId===productId);}
export function decisionInstructionScopes(view:ClientPlanViewV3,decision:PlanDecision){return instructionScopes(view).filter(s=>s.slotId===decision.slotId&&s.productId!==null&&[...decision.currentProductIds,...decision.alternativeProductIds,decision.primaryProductId].includes(s.productId));}
/** Actual visible routine plus opened product/decision only. No all-body preload. */
export function visibleInstructionScopes(view:ClientPlanViewV3,route:PortalRoute|null):InstructionScope[]{
 const all=instructionScopes(view),period=route&&'routine'in route?route.routine:'morning';
 if(route?.name==='product-use'||route?.name==='report-use')return [];
 if(route?.name==='recommendation'){const d=view.plan?.content.decisions.find(d=>d.id===route.decisionId);return d?decisionInstructionScopes(view,d):[];}
 if(route?.name==='product-evidence')return productInstructionScopes(view,route.productId);
 const rows=[...routineFor(view,'morning'),...routineFor(view,'evening')],scopes=all.filter(s=>rows.some(r=>r.slotId===s.slotId&&r.productId===s.productId));
 if(route?.name==='product')for(const s of productInstructionScopes(view,route.productId))if(!scopes.includes(s))scopes.push(s);
 return scopes;
}
export function decisionGuidanceReady(view:ClientPlanViewV3,decision:PlanDecision,hydrator:GuidanceHydrator|null):boolean {
 if(!hydrator||hydrator.view!==view||hydrator.getSnapshot().manifest===null||!view.currentGuidance||view.currentGuidance.mode!=='current_document')return false;
 return decisionInstructionScopes(view,decision).every(s=>{const value=hydrator.scope(s);return value.state==='baseline'||value.state==='instruction'&&value.detail.item.basisStatus!=='changed';});
}
export function instructionNeedsUseReview(view:ClientPlanViewV3,scope:InstructionScope,basisStatus:string){const productId=scope.productId;return basisStatus==='changed'||productId!==null&&(suppressContinue(view,productId)||!!view.plan?.content.decisions.some(d=>(d.kind==='pause'||d.kind==='leave_out')&&(d.primaryProductId===productId||d.currentProductIds.includes(productId))));}

/** Rendering selects verified authored periods without changing immutable steps. */
export function guidedRoutineFor(view:ClientPlanViewV3,period:'morning'|'evening',hydrator:GuidanceHydrator|null){
 const rows=[...new Map([...routineFor(view,'morning'),...routineFor(view,'evening')].map(r=>[r.id,r])).values()];
 return rows.filter(step=>{const scope={publication:view.currentGuidance!.snapshot.publication,slotId:step.slotId,productId:step.productId},s=hydrator?.scope(scope);
  const detail=s?.state==='instruction'&&s.detail.item.basisStatus!=='changed'?s.detail:null;
  return (detail?detail.content.format==='authored_schedule'?detail.content.body.schedule.periods:detail.content.revision.usage.periods:step.schedule.periods).includes(period);
 });
}
