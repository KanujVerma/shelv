import { useEffect, useRef, useState } from 'react';
import type { PlanDecision } from '../../../../../src/contracts/PortalRebuild.ts';
import { Button, StatusNotice } from '../../ui/index.ts';
import {fetchedBasis,isReviewable,sameFetchedRevision,useReviewScope} from './reviewBasis.tsx';
import type {ReviewBasis} from './reviewBasis.tsx';
import { isPurchaseDecision } from './model.ts';
import type { ClientPlanProps, DecisionCommand } from './types.ts';

type Phase = 'idle' | 'saving' | 'refreshing' | 'uncertain' | 'conflict' | 'denied' | 'error' | 'saved';
interface Intent {
    reviewBasis?:ReviewBasis|null;
    command: DecisionCommand | null;
    attemptedChoice: DecisionCommand['choice'] | null;
    basisVersion: number;
    decisionTitle: string;
    phase: Phase;
}
type Ledger = Record<string, Intent>;
const memoryKey = (props: Pick<ClientPlanProps,'session'|'mode'>) => `plan-intents:${props.session.key}:${props.mode}`;
const readIntents = (props: Pick<ClientPlanProps,'session'|'mode'>) => props.session.memory.get<Ledger>(memoryKey(props)) ?? {};
function remember(props: Pick<ClientPlanProps,'session'|'mode'>, id: string, next: Intent) {
    props.session.memory.set(memoryKey(props), {...readIntents(props), [id]:next});
}
function requestId() {
    const b=crypto.getRandomValues(new Uint8Array(16));
    b[6]=(b[6]! & 15) | 64; b[8]=(b[8]! & 63) | 128;
    const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

/** A rejected intent survives publication replacement and navigation, including
 * removal of the decision. It never becomes a command for the new publication. */
export function PendingDecisionReviews({props,selectedDecisionId,onReview,inPlan}: {
    props:ClientPlanProps;selectedDecisionId:string|null;onReview:()=>void;inPlan:boolean;
}) {
    return <>{Object.entries(readIntents(props)).filter(([id,intent])=>intent.phase==='conflict' && id!==selectedDecisionId).map(([id,intent])=>
        <PendingReview key={`${props.mode}:${id}`} props={props} id={id} intent={intent} onReview={onReview} inPlan={inPlan}/>)}</>;
}
function PendingReview({props,id,intent,onReview,inPlan}:{props:ClientPlanProps;id:string;intent:Intent;onReview:()=>void;inPlan:boolean}) {
    const [state,setState]=useState(intent),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false);
    const scope=useReviewScope(),alive=useRef(true),busy=useRef<object|null>(null),context=useRef({view:props.view,mode:props.mode,session:props.session,epoch:0});
    if(context.current.view!==props.view || context.current.mode!==props.mode || context.current.session!==props.session){
        context.current={view:props.view,mode:props.mode,session:props.session,epoch:context.current.epoch+1};
        // Retire obsolete ownership without waiting for its read to settle.
        // The captured epoch still denies its result, even on an exact-object return.
        busy.current=null;
    }
    const epoch=context.current.epoch,current=()=>alive.current&&props.session.isCurrent()&&context.current.epoch===epoch;
    useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
    useEffect(()=>{setLoading(false);},[props.view,props.mode,props.session]);
    const port=decisionPort(props),reviewable=isReviewable(props,scope,state.reviewBasis);
    const removed=!props.view.plan?.content.decisions.some(d=>d.id===id);
    async function refresh(acknowledge:boolean) {
        if(!port||busy.current||!current())return;
        const basis=state.reviewBasis,canAcknowledge=acknowledge&&isReviewable(props,scope,basis);
        const operation={},ownsOperation=()=>current()&&busy.current===operation;
        busy.current=operation;setLoading(true);setFailed(false);
        try {
            const authoritative=await port.read.execute({schemaVersion:1,action:'read_client_plan_v1',version:null});
            if(!ownsOperation())return;
            const next:Intent={...state,command:null,phase:canAcknowledge&&basis&&sameFetchedRevision(basis,authoritative)?'idle':'conflict',reviewBasis:fetchedBasis(props,scope,authoritative)};
            remember(props,id,next);setState(next);props.onViewChange?.(authoritative);
        } catch {if(ownsOperation())setFailed(true);}
        finally {
            // An obsolete finally must never release a newer operation's lock.
            if(busy.current===operation){busy.current=null;if(current())setLoading(false);}
        }
    }
    if(state.phase!=='conflict')return null;
    return <StatusNotice tone="warning" title="plan changed" action={!inPlan ? <Button variant="secondary" onClick={onReview}>review latest plan</Button> : <div className="plan-stack">
        <Button variant="secondary" busy={loading} disabled={!port||loading} onClick={()=>void refresh(reviewable)}>{reviewable?'i’ve reviewed this plan':'retry latest plan'}</Button>
        {!reviewable ? <Button variant="secondary" disabled>i’ve reviewed this plan</Button> : null}
    </div>}>
        <p>{state.decisionTitle} · attempted choice: {state.attemptedChoice}</p>
        <p>{removed ? `this decision is no longer in ${reviewable?'the latest plan':'the displayed plan'}. your earlier choice was not saved.` : 'your earlier choice was not saved. review the latest plan before choosing again.'}</p>
        {failed ? <p>latest plan unavailable</p> : null}
    </StatusNotice>;
}
function decisionPort(props:ClientPlanProps) {
    return !props.onViewChange || props.view.access!=='active' ? undefined : props.mode==='client' ? props.ports : props.mode==='public-demo'&&props.demoPorts?.mode==='public-demo' ? props.demoPorts : undefined;
}

export function DecisionControls(props: ClientPlanProps & {decision:PlanDecision}) {
    const {decision,view,mode,session,onViewChange,onSelfPurchase}=props;
    const scope=useReviewScope();
    const [intent,setIntent]=useState<Intent>(()=>{
        const saved=readIntents(props)[decision.id];
        return saved ? {...saved,phase:saved.phase==='saving'||saved.phase==='refreshing' ? 'uncertain' : saved.phase} : {command:null,attemptedChoice:null,basisVersion:view.plan!.version,decisionTitle:decision.guidance.title,phase:'idle'};
    });
    const alive=useRef(true),busy=useRef(false);
    // Object identity fences even same-version/access replacements. The epoch
    // also invalidates a response when context changes away and then back.
    const context=useRef({view,mode,epoch:0});
    if(context.current.view!==view || context.current.mode!==mode)
        context.current={view,mode,epoch:context.current.epoch+1};
    const epoch=context.current.epoch;
    const current=()=>alive.current && session.isCurrent() && context.current.epoch===epoch;
    useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
    useEffect(()=>{
        if(intent.phase==='saving'||intent.phase==='refreshing'){
            const next={...intent,phase:'uncertain' as const};remember(props,decision.id,next);setIntent(next);
        } else if(intent.basisVersion!==view.plan!.version && !intent.command && intent.phase!=='conflict'){
            const next={...intent,phase:'idle' as const,basisVersion:view.plan!.version};remember(props,decision.id,next);setIntent(next);
        }
        // Only enclosing context replacement supersedes the in-flight operation.
        // Local phase transitions must not invalidate their own command.
    },[view]);
    const port=decisionPort(props);
    const update=(next:Intent)=>{if(current()){remember(props,decision.id,next);setIntent(next);}};
    const read=()=>port!.read.execute({schemaVersion:1,action:'read_client_plan_v1',version:null});
    async function submit(choice:DecisionCommand['choice'],retry=false) {
        if(!port || busy.current || !current() || intent.phase==='conflict' || (!retry && intent.command))return;
        const command=retry ? intent.command : {schemaVersion:1 as const,action:'record_decision_v1' as const,requestId:requestId(),publicationVersion:view.plan!.version,expectedDecisionRevision:view.decisionRevision,decisionId:decision.id,choice,reason:null};
        if(!command)return;
        busy.current=true;
        const pending:Intent={command,attemptedChoice:choice,basisVersion:command.publicationVersion,decisionTitle:decision.guidance.title,phase:'saving'};
        update(pending);
        let acknowledged=false;
        try {
            await port.decision.execute(command);acknowledged=true;
            if(!current())return;
            update({...pending,phase:'refreshing'});
            const authoritative=await read();
            if(!current())return;
            const confirmed=authoritative.access==='active' && authoritative.plan?.version===command.publicationVersion && authoritative.decisions.some(d=>d.decisionId===command.decisionId && d.choice===command.choice && d.reason===command.reason);
            // Store the outcome before notifying the parent, which replaces this
            // view context. No late state update can undo newer restrictions.
            update({...pending,command:confirmed ? null : command,phase:confirmed ? 'saved' : 'uncertain'});
            onViewChange?.(authoritative);
        } catch(error) {
            if(!current())return;
            const status=(error as {status?:number})?.status;
            if(!acknowledged && status===409){
                update({...pending,command:null,phase:'conflict',reviewBasis:null});
                try {const authoritative=await read();if(current()){update({...pending,command:null,phase:'conflict',reviewBasis:fetchedBasis(props,scope,authoritative)});onViewChange?.(authoritative);}}catch{/* Deliberate review remains required after read failure. */}
            } else if(!acknowledged && [400,403,404,413,415,429].includes(status??0)){
                update({...pending,command:null,phase:status===403||status===404 ? 'denied' : 'error'});
            } else update({...pending,phase:'uncertain'});
        } finally {busy.current=false;}
    }
    async function reviewLatest() {
        if(!port || busy.current || !current())return;
        const basis=intent.reviewBasis,canAcknowledge=isReviewable(props,scope,basis);
        busy.current=true;
        try {
            const authoritative=await read();
            if(!current())return;
            // A second changed version still needs to be seen and reviewed.
            const same=canAcknowledge&&basis&&sameFetchedRevision(basis,authoritative);
            update({...intent,command:null,reviewBasis:fetchedBasis(props,scope,authoritative),phase:same ? 'idle' : 'conflict'});
            onViewChange?.(authoritative);
        } catch {update({...intent,phase:intent.phase==='conflict' ? 'conflict' : 'error'});}
        finally {busy.current=false;}
    }
    const locked=intent.phase==='saving'||intent.phase==='refreshing'||!!intent.command||intent.phase==='conflict';
    const recorded=view.decisions.find(d=>d.decisionId===decision.id),purchase=isPurchaseDecision(decision);
    if(!port)return <div className="plan-stack"><h2>your choice</h2><StatusNotice title={view.access==='read_only' ? 'read-only plan' : mode==='historical' ? 'historical plan' : mode==='public-demo' ? 'demo preview' : 'preview only'}>choices are unavailable in this view.</StatusNotice>{recorded ? <p>recorded choice: {recorded.choice}</p> : null}</div>;
    return <div className="plan-stack"><h2>your choice</h2>
      <Button busy={intent.phase==='saving'} disabled={locked} onClick={()=>void submit('approved')}>{purchase ? 'approve product' : 'approve decision'}</Button>
      <Button variant="secondary" disabled={locked} onClick={()=>void submit('deferred')}>decide later</Button>
      <Button variant="ghost" disabled={locked} onClick={()=>void submit('declined')}>decline</Button>
      {recorded ? <p className="plan-muted">recorded choice: {recorded.choice}</p> : null}
      {intent.attemptedChoice && intent.phase!=='saved' ? <p>attempted choice: {intent.attemptedChoice}</p> : null}
      {intent.phase==='refreshing' ? <StatusNotice tone="loading" title="checking your choice"/> : null}
      {intent.phase==='saving' ? <StatusNotice tone="loading" title="recording your choice"/> : null}
      {intent.phase==='saved' ? <StatusNotice tone="success" title="choice recorded">your current routine has not changed.</StatusNotice> : null}
      {intent.phase==='uncertain' ? <StatusNotice tone="uncertain" title="result uncertain" action={<Button variant="secondary" onClick={()=>void submit(intent.command!.choice,true)}>retry same choice</Button>}>your choice may have been recorded. retry the exact choice for plan version {intent.basisVersion} to confirm.</StatusNotice> : null}
      {intent.phase==='conflict' ? <StatusNotice tone="warning" title="plan changed" action={<Button variant="secondary" onClick={()=>void reviewLatest()}>review latest plan</Button>}>your choice was not saved. review the latest plan before choosing again. your attempted choice is kept for review.</StatusNotice> : null}
      {intent.phase==='denied' ? <StatusNotice tone="denied" title="action unavailable">your choice was not saved. your attempted choice is kept.</StatusNotice> : null}
      {intent.phase==='error' ? <StatusNotice tone="error" title="choice not saved" action={<Button variant="secondary" onClick={()=>void reviewLatest()}>refresh plan</Button>}>your attempted choice is kept. check the latest plan before trying again.</StatusNotice> : null}
      <p className="plan-meta">{purchase ? 'no order or charge yet. we confirm the all-in total and return terms before you pay.' : 'this records your choice about the guidance. it does not place an order or record product use.'}</p>
      {onSelfPurchase && mode==='client' && purchase ? <><hr/><Button variant="secondary" disabled={locked} onClick={()=>onSelfPurchase(decision.primaryProductId!,decision.id)}>i’ll buy it myself</Button></> : null}
    </div>;
}
