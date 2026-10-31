import {Button,StatusNotice} from '../../ui/index.ts';
import type {ClientPlanProps} from './types.ts';
import {guidanceIntentKey} from './guidanceDecision.ts';
import type {GuidanceDecisionIntent} from './guidanceDecision.ts';
/** Navigation never acknowledges a choice or clears an uncertain request. */
export function PendingGuidanceDecisionReviews({props,selectedDecisionId,onSelect}:{props:ClientPlanProps;selectedDecisionId:string|null;onSelect?:(id:string)=>void}){
 if(props.mode!=='client'||!props.session.isCurrent())return null;
 const ledger=props.session.memory.get<Record<string,GuidanceDecisionIntent>>(guidanceIntentKey(props.session))??{};
 return <>{Object.entries(ledger).filter(([id,s])=>id!==selectedDecisionId&&(s.phase==='conflict'||!!s.command)).map(([id,s])=>{
  const decision=props.view.plan?.content.decisions.find(d=>d.id===id);
  return <StatusNotice key={id} tone={s.command?'uncertain':'warning'} title={s.command?'choice result uncertain':'plan changed'} action={decision&&onSelect?<Button variant="secondary" onClick={()=>onSelect(id)}>review the recorded choice</Button>:undefined}><p>{decision?.guidance.title??'an earlier plan decision'} · attempted choice: {s.attemptedChoice}</p>{s.reason?<p>{s.reason}</p>:null}<p>{decision?'open the recommendation to review current guidance or check the original request.':'this decision is no longer in this plan. the earlier request and choice are retained.'}</p></StatusNotice>;
 })}</>;
}
