import {createContext,useContext,useEffect,useState,useSyncExternalStore,useRef} from 'react';
import type {ReactNode} from 'react';
import type {InstructionScope,InstructionDetail,ClientPlanViewV3} from '../../../../../src/contracts/PortalReview.ts';
import type {PlanDecision} from '../../../../../src/contracts/PortalRebuild.ts';
import type {Guide} from '../../../../../src/contracts/ConciergePresentation.ts';
import {Button,StatusNotice} from '../../ui/index.ts';
import type {ClientPlanProps} from './types.ts';
import {createGuidanceHydrator,guidanceScopeKey} from './guidanceHydration.ts';
import type {GuidanceHydrator} from './guidanceHydration.ts';
import {productInstructionScopes,decisionInstructionScopes,instructionNeedsUseReview} from './guidancePresentation.ts';
import {ScheduleContent} from './content.tsx';
import {readCurrentPlan} from './care.ts';
import {mapReviewResult} from '../../../../../src/contracts/PortalReviewMapping.ts';
interface GuidanceContextValue {props:ClientPlanProps&{view:ClientPlanViewV3};hydrator:GuidanceHydrator|null;retrying:boolean;retry():void}
const Context=createContext<GuidanceContextValue|null>(null);
export const useGuidance=()=>useContext(Context);
export function GuidanceBoundary({props,scopes,children}:{props:ClientPlanProps;scopes:InstructionScope[];children:ReactNode}){
 const [hydrator,setHydrator]=useState<GuidanceHydrator|null>(null);
 const keys=JSON.stringify(scopes.map(guidanceScopeKey));
 useEffect(()=>{
  if(props.view.schemaVersion!==3)return;
  const h=createGuidanceHydrator({view:props.view,mode:props.mode,session:props.session,port:props.ports?.review});setHydrator(h);void h.load(scopes);
  return()=>h.dispose();
 },[props.view,props.mode,props.session,props.ports?.review,keys]);
 if(props.view.schemaVersion!==3)return children;
 const h=hydrator?.view===props.view&&hydrator.session===props.session&&hydrator.mode===props.mode&&hydrator.getSnapshot().phase!=='retired'?hydrator:null;
 return <GuidanceState props={{...props,view:props.view}} hydrator={h}>{children}</GuidanceState>;
}
const idleSubscribe=()=>()=>{},idleSnapshot=()=>null;
function GuidanceState({props,hydrator,children}:{props:ClientPlanProps&{view:ClientPlanViewV3};hydrator:GuidanceHydrator|null;children:ReactNode}){
 useSyncExternalStore(hydrator?.subscribe??idleSubscribe,hydrator?.getSnapshot??idleSnapshot,hydrator?.getSnapshot??idleSnapshot);
 const [retrying,setRetrying]=useState(false),[failed,setFailed]=useState(false);
 const latest=useRef({view:props.view,session:props.session,mode:props.mode,hydrator,epoch:0}),busy=useRef<object|null>(null);
 if(latest.current.view!==props.view||latest.current.session!==props.session||latest.current.mode!==props.mode||latest.current.hydrator!==hydrator){latest.current={view:props.view,session:props.session,mode:props.mode,hydrator,epoch:latest.current.epoch+1};busy.current=null;}
 useEffect(()=>()=>{latest.current.epoch++;busy.current=null;},[]);
 useEffect(()=>{setRetrying(false);setFailed(false);},[props.view,props.session,props.mode]);
 function retry(){
  if(busy.current||!props.session.isCurrent()||!props.onViewChange||!['client','historical'].includes(props.mode))return;
  setRetrying(true);setFailed(false);const view=props.view,session=props.session,epoch=latest.current.epoch,operation={};busy.current=operation;const current=()=>session.isCurrent()&&latest.current.epoch===epoch&&busy.current===operation;
  // The enclosing boundary instance is retired with the captured hydrator.
  const historical=props.mode==='historical'||props.view.currentGuidance?.mode==='historical_document';
  const command={schemaVersion:1,action:'read_client_plan_v3',version:props.view.plan!.version} as const;
  const read=historical&&props.ports?.review?props.ports.review.execute(command).then(value=>mapReviewResult(value,command) as ClientPlanViewV3):readCurrentPlan(props);
  void read.then(next=>{if(current()&&hydrator?.view===view&&hydrator.getSnapshot().phase!=='retired')props.onViewChange?.(next);}).catch(()=>{if(current()&&hydrator?.getSnapshot().phase!=='retired')setFailed(true);}).finally(()=>{if(busy.current===operation){busy.current=null;if(latest.current.epoch===epoch)setRetrying(false);};});
 }
 return <Context.Provider value={{props,hydrator,retrying,retry}}>{failed?<StatusNotice tone="error" title="current guidance unavailable">your recorded use and choices are retained.</StatusNotice>:null}{children}</Context.Provider>;
}
export function InstructionDirections({detail}:{detail:InstructionDetail}){
 const content=detail.content;
 return <section className="plan-stack"><p className="plan-meta">instructions effective {detail.item.effectiveOn} · published {detail.publishedAt}</p>
 {content.format==='authored_schedule'?<>{content.body.directions.map((t,i)=><p key={i}>{t}</p>)}{content.body.cautions.map((t,i)=><p className="plan-inline-caution" key={i}>{t}</p>)}<ScheduleContent schedule={content.body.schedule}/><p>{content.body.reason}</p></>:<><p className="plan-meta">legacy published instructions · use basis was not versioned</p>{content.revision.usage.periods.map(period=><section key={period}><h3>{period}</h3>{content.revision.usage.short[period]?<p>{content.revision.usage.short[period]}</p>:null}</section>)}{content.revision.usage.instructions.map((t,i)=><p key={i}>{t}</p>)}<p>{content.revision.reason}</p></>}
 </section>;
}
/** One shared practical-directions seam. Immutable content remains unchanged and
 * inspectable; it is never silently reused as current while applicability waits. */
const ReferenceContext=createContext(false);
export function GuidanceDirections({scopes,children,referenceOnly=false}:{scopes:InstructionScope[];children:ReactNode;referenceOnly?:boolean}){
 const context=useGuidance(),reference=useContext(ReferenceContext);if(!context||reference)return children;
 const {hydrator,props}=context,states=scopes.map(s=>hydrator?.scope(s)??{state:'pending' as const});
 const incomplete=!hydrator||hydrator.getSnapshot().manifest===null||states.some(s=>s.state==='pending'||s.state==='error');
 if(incomplete){const error=hydrator?.getSnapshot().phase==='error'||states.some(s=>s.state==='error');return <StatusNotice tone={error?'warning':'loading'} title={error?'current directions unavailable':'checking current directions'} action={error&&['client','historical'].includes(props.mode)&&props.onViewChange?<Button variant="secondary" busy={context.retrying} disabled={context.retrying} onClick={context.retry}>retry current guidance</Button>:undefined}>directions will appear after the current guidance is checked. your use reports remain separate.</StatusNotice>;}
 const details=states.flatMap(s=>s.state==='instruction'?[s.detail]:[]);
 if(!details.length)return children;
 if(referenceOnly)return <details><summary>original plan guidance for reference</summary><ReferenceContext.Provider value={true}>{children}</ReferenceContext.Provider></details>;
 const changed=details.some(d=>instructionNeedsUseReview(props.view,d.item.scope,d.item.basisStatus));
 return <section className="plan-stack">{changed?<StatusNotice tone="warning" title="instructions and reported use need review">these instructions do not confirm that you should continue. your reported use and the published plan remain separate.</StatusNotice>:null}
 {changed?<details><summary>published instructions for reference</summary>{details.map(d=><InstructionDirections key={d.item.instructionId} detail={d}/>)}</details>:details.map(d=><InstructionDirections key={d.item.instructionId} detail={d}/>)}
 <details><summary>original plan directions for reference</summary><ReferenceContext.Provider value={true}>{children}</ReferenceContext.Provider></details></section>;
}
export function GuidanceForProduct({productId,children}:{productId:string;children:ReactNode}){const c=useGuidance();return <GuidanceDirections scopes={c?productInstructionScopes(c.props.view,productId):[]}>{children}</GuidanceDirections>;}
export function GuidanceForDecision({decision,children,referenceOnly=false}:{decision:PlanDecision;children:ReactNode;referenceOnly?:boolean}){const c=useGuidance();return <GuidanceDirections scopes={c?decisionInstructionScopes(c.props.view,decision):[]} referenceOnly={referenceOnly}>{children}</GuidanceDirections>;}
export function GuidanceForGuide({guide,children}:{guide:Guide;children:ReactNode}){const c=useGuidance();return <GuidanceDirections scopes={c?guide.productId?productInstructionScopes(c.props.view,guide.productId):c.props.view.plan?.content.routine.filter(s=>s.productId===null).map(s=>({publication:c.props.view.currentGuidance!.snapshot.publication,slotId:s.slotId,productId:null}))??[]:[]}>{children}</GuidanceDirections>;}
