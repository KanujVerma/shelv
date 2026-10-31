import type {ClientPlanViewV3} from '../../../../../src/contracts/PortalReview.ts';
import {mapReviewResult} from '../../../../../src/contracts/PortalReviewMapping.ts';
import type {ClientPlanProps} from './types.ts';
import type {GuidanceHydrator} from './guidanceHydration.ts';
import {readCurrentPlan} from './care.ts';
import {guidanceRestriction} from './guidanceContext.ts';

export interface GuidanceRetryContext {props:ClientPlanProps&{view:ClientPlanViewV3};hydrator:GuidanceHydrator|null;scopeKey:string}
const idle={retrying:false,failed:false};
/** Volatile ownership of the shared renderer's explicit guidance reread. */
export function createGuidanceRetryController(initial:GuidanceRetryContext){
 let ctx=initial,epoch=0,operation:object|null=null,active=true,state=idle,restriction=guidanceRestriction(initial.props.session);
 const listeners=new Set<()=>void>();
 const live=()=>active&&ctx.props.session.isCurrent();
 const usable=(c:GuidanceRetryContext)=>!!c.hydrator&&c.hydrator.view===c.props.view&&c.hydrator.session===c.props.session&&c.hydrator.mode===c.props.mode&&c.hydrator.getSnapshot().phase!=='retired';
 const emit=(next:typeof idle)=>{if(live()){state=next;listeners.forEach(fn=>fn());}};
 return{
  getSnapshot:()=>live()&&usable(ctx)?state:idle,
  subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},
  context(next:GuidanceRetryContext){
   const nextRestriction=guidanceRestriction(next.props.session);
   if(ctx.props.view!==next.props.view||ctx.props.session!==next.props.session||ctx.props.mode!==next.props.mode||ctx.props.ports?.review!==next.props.ports?.review||ctx.props.onViewChange!==next.props.onViewChange||ctx.hydrator!==next.hydrator||ctx.scopeKey!==next.scopeKey||restriction!==nextRestriction){epoch++;operation=null;state=idle;}
   restriction=nextRestriction;
   ctx=next;
  },
  activate(){active=true;},
  retire(){active=false;epoch++;operation=null;state=idle;},
  async retry(){
   const captured=ctx,{props}=captured;
   if(operation||!live()||!usable(captured)||!props.ports?.review||!props.onViewChange||!['client','historical'].includes(props.mode))return;
   const start=epoch,op={},spent=guidanceRestriction(props.session);operation=op;
   const current=()=>live()&&props.session.isCurrent()&&epoch===start&&operation===op&&guidanceRestriction(props.session)===spent&&usable(captured);
   emit({retrying:true,failed:false});
   try{
    // Public subscribers may synchronously retire the effective context.
    if(!current())return;
    const historical=props.mode==='historical'||props.view.currentGuidance?.mode==='historical_document';
    const command={schemaVersion:1,action:'read_client_plan_v3',version:props.view.plan!.version} as const;
    const next=historical&&props.ports?.review?mapReviewResult(await props.ports.review.execute(command),command) as ClientPlanViewV3:await readCurrentPlan(props);
    if(current())props.onViewChange(next);
   }catch{if(current())emit({...state,failed:true});}
   finally{if(operation===op){const owns=current();operation=null;if(owns)emit({...state,retrying:false});}}
  },
 };
}
