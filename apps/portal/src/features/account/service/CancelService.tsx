import {useSyncExternalStore} from 'react';
import {Button,StatusNotice} from '../../../ui/index.ts';
import type {AccountServiceController,CancellationDraft} from './types.ts';

/** C08C confirmation content only, inside Parent's single dialog or route. */
export function CancelService({controller,onKeepService,onDiscardCancellation,onConfirmCancellation,onReadOriginalStatus,onRetryOriginal}:{
  controller:AccountServiceController;onKeepService?:(draft:CancellationDraft)=>void;
  onDiscardCancellation?:(draft:CancellationDraft)=>void;
  onConfirmCancellation?:(draft:CancellationDraft)=>void;
  onReadOriginalStatus?:(original:NonNullable<ReturnType<AccountServiceController['getSnapshot']>['original']>)=>void;
  onRetryOriginal?:(original:NonNullable<ReturnType<AccountServiceController['getSnapshot']>['original']>)=>void;
}){
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const draft=state.draft,original=state.original;
  if(state.phase==='ended'||state.phase==='denied')return <StatusNotice tone="denied" title={state.message??'service details are unavailable'}/>;
  if(state.phase==='inactive')return null;
  const rendered=()=>controller.getSnapshot()===state;
  const keep=()=>{if(!rendered()||!draft)return;if(onDiscardCancellation){onDiscardCancellation(draft);return;}if(controller.discardCancellation(draft))onKeepService?.(draft);};
  return <div className="app-stack">
    {draft?<form aria-label="cancel service" className="app-stack" onSubmit={event=>{event.preventDefault();if(rendered()){if(onConfirmCancellation)onConfirmCancellation(draft);else void controller.confirmCancellation(draft);}}}>
      <h2>support continues through your paid period</h2>
      <dl>
        <dt>support ends</dt><dd>start of <time dateTime={draft.supportEndsOn}>{draft.supportEndsOn}</time> (Chicago time)</dd>
        <dt>read-only access ends</dt><dd>start of <time dateTime={draft.readOnlyEndsOn}>{draft.readOnlyEndsOn}</time> (Chicago time)</dd>
        <dt>final plan</dt><dd>download unavailable here</dd>
        <dt>orders &amp; refunds</dt><dd><a href="/orders">unfinished orders &amp; refunds</a></dd>
      </dl>
      <p>we stop future renewal requests. this is not an automatic product return or service-fee refund.</p>
      {state.writeState==='conflict'?<StatusNotice tone="warning" title="compare your reviewed dates with current service details">
        <p>current paid support end: {state.current?.coverage.paidSupportEndsOn??'unavailable'}.</p>
        <p>close this review, read the current service details, then review cancellation again.</p>
      </StatusNotice>:null}
      <div className="app-actions">
        <Button variant="secondary" disabled={state.busy==='confirm'||state.busy==='retry'} onClick={keep}>{original?'close review':'keep my service'}</Button>
        {!original?<Button type="submit" disabled={!state.canConfirm} busy={state.busy==='confirm'}>confirm cancellation</Button>:null}
      </div>
    </form>:null}
    {state.writeState==='expired'?<StatusNotice title="your paid service period has ended"/>:null}
    {!draft&&!original&&state.writeState!=='expired'?<StatusNotice title={state.phase==='unread'?'read your service details before reviewing cancellation':'cancellation review is unavailable'}/>:null}
    {original&&!state.receipt&&state.writeState!=='conflict'?<StatusNotice tone="uncertain" title={state.busy==='confirm'||state.busy==='retry'?'sending the original cancellation':'the original cancellation result is uncertain'}>
      <p>check the original request before making another cancellation.</p>
      {state.originalStatus?.state==='absent'?<p>no committed result was found. this does not confirm cancellation.</p>:null}
      <div className="app-actions">
        <Button variant="secondary" disabled={state.busy!==null} onClick={()=>{if(rendered()){if(onReadOriginalStatus)onReadOriginalStatus(original);else void controller.readOriginalStatus(original);}}}>check original cancellation status</Button>
        {state.originalStatus?.state==='absent'?<Button variant="secondary" disabled={!state.canRetry} onClick={()=>{if(rendered()){if(onRetryOriginal)onRetryOriginal(original);else void controller.retryOriginal(original);}}}>retry original cancellation</Button>:null}
      </div>
    </StatusNotice>:null}
    {state.receipt?<StatusNotice tone={state.writeState==='confirmed'?'success':'neutral'} title={state.writeState==='confirmed'?'cancellation confirmed':'original cancellation acknowledged'}>
      <p>recorded support end: {state.receipt.cancellation.supportEndsOn}. this receipt does not confirm a refund or a payment.</p>
    </StatusNotice>:null}
    {state.phase==='unavailable'?<StatusNotice tone="error" title="current service details are unavailable"/>:null}
    {state.message&&state.writeState!=='confirmed'&&!draft&&(!original||state.writeState==='conflict')?<StatusNotice tone={state.writeState==='conflict'?'warning':'neutral'} title={state.message}/>:null}
    <h2>looking for a refund?</h2>
    <p>contact shelv about the service-fee guarantee. an early refund and departure uses a confirmed support-end date.</p>
  </div>;
}
