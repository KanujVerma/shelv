import type {ApplicationSession} from './session.ts';
import type {createClientPlanController} from './client-state.ts';
import type {PlanSessionBoundary,ClientPlanReadView} from '../features/plan/types.ts';
import type {PortalNavigationCore} from '../navigation/react.tsx';
import {parseRoute} from '../navigation/routes.ts';
import {isPurchaseDecision} from '../features/plan/model.ts';

function targets(view:ClientPlanReadView){
 if(view.schemaVersion===1||view.access!=='active'||!view.plan||view.schemaVersion===3&&view.currentGuidance?.mode==='historical_document')return null;
 const plan=view.plan,pairs=plan.content.decisions.flatMap(d=>isPurchaseDecision(d)&&d.primaryProductId!==null&&plan.content.products.some(p=>p.id===d.primaryProductId)?[[d.primaryProductId,d.id]]:[]);
 return {pairs,key:JSON.stringify([view.schemaVersion,view.access,plan.version,plan.documentSchemaVersion,view.schemaVersion===3?view.currentGuidance?.mode:null,pairs])};
}
/** Local navigation only. W3 owns exact-publication acquisition intent; this
 * callback creates no choice, order, payment, Start or other use event. */
export function createSelfPurchaseNavigation(runtime:ApplicationSession,controller:ReturnType<typeof createClientPlanController>,boundary:PlanSessionBoundary,navigation:PortalNavigationCore){
 const cookie=runtime.cookie,state=controller.getSnapshot(),view=state.view;
 if(!view||state.loading||state.error||state.ended)return undefined;
 const source:ClientPlanReadView=view,captured=targets(source);if(!captured)return undefined;
 const capturedKey=captured.key;
 const owner=cookie.identity?.ownerId,generation=cookie.generation,epoch=cookie._epoch,lease=cookie._view,
  serverGeneration=lease?.generation,csrf=lease?.csrf,path=navigation.getSnapshot(),route=parseRoute(path);
 if(!route||!('routine'in route))return undefined;
 const routine=route.routine,allowed=new Set(captured.pairs.map(pair=>JSON.stringify(pair)));
 function ready(){
  if(runtime.getSnapshot().boundary!==boundary||!boundary.isCurrent()||runtime.getSnapshot().boundary!==boundary)return false;
  return cookie.status==='ready'&&cookie.audience==='client'&&cookie.identity?.role==='client'&&cookie.identity.ownerId===owner&&
   cookie.generation===generation&&cookie._epoch===epoch&&cookie._view===lease&&cookie._view?.generation===serverGeneration&&
   cookie._view?.csrf===csrf&&cookie._view?.capabilities.view===true;
 }
 function current(){
  try{
   if(!ready()||controller.getSnapshot()!==state)return false;
   const samePath=navigation.getSnapshot()===path;
   if(!ready()||!samePath||controller.getSnapshot()!==state)return false;
   const sameBasis=targets(source)?.key===capturedKey;
   return ready()&&controller.getSnapshot()===state&&sameBasis;
  }catch{return false;}
 }
 if(!current())return undefined;
 return (productId:string,decisionId:string)=>{
  if(!allowed.has(JSON.stringify([productId,decisionId]))||!current())return;
  navigation.navigate({name:'product-use',productId,routine});
 };
}
