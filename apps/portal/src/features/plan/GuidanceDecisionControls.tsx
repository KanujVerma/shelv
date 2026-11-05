import {DecisionChoiceButton} from './DecisionChoiceButton.tsx';
import {useEffect,useState,useSyncExternalStore} from 'react';
import type {PlanDecision} from '../../../../../src/contracts/PortalRebuild.ts';
import type {ClientPlanViewV3} from '../../../../../src/contracts/PortalReview.ts';
import type {ClientPlanProps} from './types.ts';
import {Button,StatusNotice} from '../../ui/index.ts';
import {useGuidance} from './Guidance.tsx';
import {decisionGuidanceReady} from './guidancePresentation.ts';
import {createGuidanceDecisionController} from './guidanceDecision.ts';
import {useReviewScope} from './reviewBasis.tsx';
import {isPurchaseDecision} from './model.ts';
export function GuidanceDecisionControls(props:ClientPlanProps&{view:ClientPlanViewV3;decision:PlanDecision}){
 const guidance=useGuidance(),scope=useReviewScope(),view=props.view,decision=props.decision;
 const context={view,decision,session:props.session,mode:props.mode,port:props.ports?.review,scope,ready:()=>decisionGuidanceReady(view,decision,guidance?.hydrator??null),onViewChange:props.onViewChange};
 const [controller]=useState(()=>createGuidanceDecisionController(context));controller.context(context);
 const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
 useEffect(()=>()=>controller.retire(),[controller]);
 const recorded=view.decisions.find(d=>d.decisionId===decision.id),provenance=view.decisionGuidance.find(d=>d.decisionId===decision.id);
 const allowed=props.mode==='client'&&view.access==='active'&&view.currentGuidance?.mode==='current_document'&&!!props.ports?.review&&!!props.onViewChange;
 const ready=context.ready(),busy=state.phase==='saving'||state.phase==='refreshing',locked=busy||!!state.command||state.phase==='conflict'||!ready;
 return <div className="plan-stack"><h2>your choice</h2>
 {recorded?<><p>recorded choice: {recorded.choice}</p>{recorded.reason?<p>{recorded.reason}</p>:null}
 {provenance?.basisStatus==='stale'?<StatusNotice tone="warning" title="review updated directions">your recorded choice remains. it has not been reviewed against the updated guidance.</StatusNotice>:provenance?.basisStatus==='legacy_unbound'?<p className="plan-meta">the guidance reviewed for this recorded choice is not known.</p>:provenance?.basisStatus==='current'?<p className="plan-meta">recorded choice reviewed against the current guidance.</p>:null}</>:null}
 {!allowed?<StatusNotice title={view.access==='read_only'?'read-only plan':view.currentGuidance?.mode==='historical_document'||props.mode==='historical'?'historical plan':'choices unavailable'}>choices are unavailable in this view.</StatusNotice>:<>
 {!ready?<StatusNotice title="check current guidance">current directions must be checked before a new choice can be recorded.</StatusNotice>:null}
 {recorded&&provenance?.basisStatus==='stale'?<Button disabled={locked} onClick={()=>void controller.submit(recorded.choice,recorded.reason)}>keep my choice after reviewing</Button>:null}
 <DecisionChoiceButton choice="approved" purchase={isPurchaseDecision(decision)} busy={busy} disabled={locked} onClick={()=>void controller.submit('approved',null)}/>
 <DecisionChoiceButton choice="deferred" purchase={isPurchaseDecision(decision)} disabled={locked} onClick={()=>void controller.submit('deferred',null)}/><DecisionChoiceButton choice="declined" purchase={isPurchaseDecision(decision)} disabled={locked} onClick={()=>void controller.submit('declined',null)}/>
 {state.attemptedChoice&&state.phase!=='saved'?<p>attempted choice: {state.attemptedChoice}{state.reason?` · ${state.reason}`:''}</p>:null}
 {busy?<StatusNotice tone="loading" title="checking your choice"/>:null}
 {state.phase==='conflict'?<StatusNotice tone="warning" title="plan changed" action={<Button variant="secondary" onClick={()=>void controller.review()}>review latest plan</Button>}>your attempted choice is retained. review the fetched current guidance before choosing again.</StatusNotice>:null}
 {state.phase==='saved'?<StatusNotice tone="success" title="choice recorded">this does not record product use, place an order or move money.</StatusNotice>:null}
 {state.phase==='acknowledged'?<StatusNotice title="earlier choice receipt confirmed">the current recorded choice is shown above.</StatusNotice>:null}
 {state.phase==='denied'?<StatusNotice title="action unavailable">your attempted choice is retained.</StatusNotice>:null}
 </>}
 {state.command?<StatusNotice tone="uncertain" title="result uncertain" action={<div className="plan-stack"><Button variant="secondary" disabled={busy||!allowed} onClick={()=>void controller.retry()}>retry same choice</Button><Button variant="secondary" disabled={busy||props.mode!=='client'||!props.ports?.review} onClick={()=>void controller.status()}>check choice status</Button></div>}>the original choice is retained until its result can be confirmed.</StatusNotice>:null}
 <p className="plan-meta">{isPurchaseDecision(decision)?'no order or charge yet. we confirm the all-in total and return terms before you pay.':'this records your choice about the guidance. it does not place an order or record product use.'}</p>
 {allowed&&props.onSelfPurchase&&isPurchaseDecision(decision)?<Button variant="secondary" disabled={locked} onClick={()=>props.onSelfPurchase?.(decision.primaryProductId!,decision.id)}>i’ll buy it myself</Button>:null}
 </div>;
}
