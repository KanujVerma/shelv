import {useSyncExternalStore} from 'react';
import {Badge,Button,StatusNotice} from '../../../ui/index.ts';
import type {AccountServiceController,CancellationDraft} from './types.ts';
import {serviceDateLabel} from './model.ts';

const statusLabels={unpaid:'service payment not recorded',pending_publication:'awaiting first publication',active:'active service',expired:'paid service period ended',cancelled:'service ended'};
/** C08 content only. Parent owns Account layout, routes, dialog and autoload. */
export function AccountService({controller,presentation='summary',onOpenService,onOpenCancellation,onReviewCancellation,onReadCurrent,onReadOriginalStatus}:{
  controller:AccountServiceController;presentation?:'summary'|'details';onOpenService?:()=>void;onOpenCancellation?:(draft:CancellationDraft)=>void;
  onReviewCancellation?:(current:CancellationDraft['current'])=>void;
  onReadCurrent?:()=>void;onReadOriginalStatus?:(original:NonNullable<ReturnType<AccountServiceController['getSnapshot']>['original']>)=>void;
}){
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const current=state.current,draft=state.draft;
  if(state.phase==='ended'||state.phase==='denied')return <StatusNotice tone="denied" title={state.message??'service details are unavailable'}/>;
  if(state.phase==='inactive')return null;
  const rendered=()=>controller.getSnapshot()===state;
  const openCancellation=()=>{
    if(!current||!rendered())return;
    if(onReviewCancellation){onReviewCancellation(current);return;}
    if(!controller.openCancellation(current))return;
    const next=controller.getSnapshot();
    if(next.current===current&&next.draft&&(draft?next.draft===draft:next.draft.current===current))onOpenCancellation?.(next.draft);
  };
  return <div className="app-stack">
    {current?<>
      <Badge tone={current.coverage.status==='active'?'active':'neutral'}>{statusLabels[current.coverage.status]}</Badge>
      <dl>
        {current.coverage.period?<><dt>current paid period</dt><dd><time dateTime={current.coverage.period.startOn}>{current.coverage.period.startOn}</time> to the start of <time dateTime={current.coverage.period.endOn}>{current.coverage.period.endOn}</time> (Chicago time)</dd></>:null}
        <dt>paid periods end</dt><dd>{current.coverage.paidSupportEndsOn?<>start of <time dateTime={current.coverage.paidSupportEndsOn}>{current.coverage.paidSupportEndsOn}</time> (Chicago time)</>:serviceDateLabel(null)}</dd>
        {current.cancellation?<><dt>cancellation</dt><dd>recorded</dd><dt>support ends</dt><dd>start of <time dateTime={current.cancellation.supportEndsOn}>{current.cancellation.supportEndsOn}</time> (Chicago time)</dd></>:null}
        <dt>read-only access ends</dt><dd>{current.postServiceAccess?.state==='known'?<>start of <time dateTime={current.postServiceAccess.readOnlyEndsOn}>{current.postServiceAccess.readOnlyEndsOn}</time> (Chicago time)</>:'unknown'}</dd>
      </dl>
      <p>renewal is a new payment, not an automatic charge. products are separate, with no markup.</p>
      {presentation==='details'?<>
        <dl>
          <dt>service payment amounts</dt><dd>unavailable</dd>
          <dt>cancellation preview</dt><dd>{current.periodEndCancellation.state==='available'?<>if you cancel now, read-only access ends at the start of <time dateTime={current.periodEndCancellation.readOnlyEndsOn}>{current.periodEndCancellation.readOnlyEndsOn}</time> (Chicago time)</>:'unavailable'}</dd>
        </dl>
        <h2>not happy? service fees back.</h2>
        <p>first three monthly periods, including early requests. request through 30 days after the third period ends. products are excluded.</p>
        <p>your paid amounts and personal request deadline are unavailable here.</p>
        <p>after support ends, plan and history access is read-only for 30 days.</p>
        <dl><dt>last entitled plan</dt><dd>unavailable here</dd><dt>final-plan download</dt><dd>unavailable here</dd></dl>
        <a href="/orders">unfinished orders &amp; refunds</a>
      </>:null}
    </>:null}
    {state.phase==='unread'?<StatusNotice title="your service details have not been loaded"/>:null}
    {state.phase==='loading'?<StatusNotice tone="loading" title="reading your current service details"/>:null}
    {state.phase==='unavailable'?<StatusNotice tone="error" title="your current service details are unavailable"/>:null}
    {state.message&&(!state.original||state.receipt||state.writeState==='conflict')?<StatusNotice tone={state.writeState==='confirmed'?'success':state.writeState==='conflict'?'warning':'neutral'} title={state.message}/>:null}
    {state.original&&!state.receipt&&state.writeState!=='conflict'?<StatusNotice tone="uncertain" title="the original cancellation result is uncertain">
      <Button variant="secondary" disabled={state.busy!==null} onClick={()=>{if(rendered()&&state.original){if(onReadOriginalStatus)onReadOriginalStatus(state.original);else void controller.readOriginalStatus(state.original);}}}>check original cancellation status</Button>
    </StatusNotice>:null}
    {state.receipt&&state.writeState!=='confirmed'?<StatusNotice title="original cancellation acknowledged">
      <p>recorded support end: {state.receipt.cancellation.supportEndsOn}. current service details are shown separately.</p>
    </StatusNotice>:null}
    <div className="app-actions">
      {presentation==='summary'&&onOpenService?<Button variant="secondary" disabled={!current||state.busy!==null} onClick={()=>{if(rendered())onOpenService();}}>service payments</Button>:null}
      {onOpenCancellation||onReviewCancellation?<Button variant="ghost" disabled={!state.canReview} onClick={openCancellation}>cancel service</Button>:null}
      <Button variant="ghost" disabled={state.busy!==null} onClick={()=>{if(rendered()){if(onReadCurrent)onReadCurrent();else void controller.readCurrent();}}}>read current service</Button>
    </div>
  </div>;
}
