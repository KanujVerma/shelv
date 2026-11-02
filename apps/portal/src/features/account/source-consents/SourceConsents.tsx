import {useId,useSyncExternalStore} from 'react';
import {Badge,Button,Dialog,StatusNotice} from '../../../ui/index.ts';
import type {SourceAccountPurpose} from '../../../../../../src/contracts/PortalSourceAccount.ts';
import type {SourceConsentsModel,SourceConsentReview,SourceConsentRow,SourceConsentsSnapshot} from './types.ts';
import './source-consents.css';

const purpose:Record<SourceAccountPurpose,string>={service_storage:'storage of consultation material',service_review:'use to prepare your advice'};
const channel={text:'text',call:'call',video:'video',in_person:'in person'};
const effective={not_withdrawn:'not withdrawn',withdrawn:'withdrawn',superseded:'superseded'};
function Stamp({value}:{value:string}){
  return <time dateTime={value}>{new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Chicago'}).format(new Date(value))} (Chicago time)</time>;
}
function ConsentRecord({row,model}:{row:SourceConsentRow;model:SourceConsentsModel}){
  const id=useId(),record=row.record,confirmation=record.confirmation;
  return <article className="source-consents-record" aria-labelledby={`${id}-purpose`}>
    <div className="source-consents-record-heading"><h4 id={`${id}-purpose`}>{purpose[record.consent.purpose]}</h4><Badge>recorded status: {effective[record.effective]}</Badge></div>
    <p>{confirmation.decision==='allow'?'recorded confirmation':'recorded withdrawal'} · {channel[confirmation.channel]}</p>
    <dl className="source-consents-dates">
      <div><dt>confirmation occurred at</dt><dd>{confirmation.occurredAt.state==='known'?<Stamp value={confirmation.occurredAt.value}/>:<span>confirmation date not known</span>}</dd></div>
      <div><dt>recorded at</dt><dd><Stamp value={confirmation.recordedAt}/></dd></div>
    </dl>
    <p className="source-consents-version">disclosure version {record.consent.disclosure.version}</p>
    <div className="source-consents-disclosure">{record.disclosureText}</div>
    {record.withdrawal?<p>withdrawal recorded in Account · <Stamp value={record.withdrawal.recordedAt}/></p>:null}
    <div><Button variant="secondary" disabled={row.unavailableReason!==null} aria-describedby={row.unavailableReason?`${id}-reason`:undefined} onClick={()=>model.reviewWithdrawal(row)}>review withdrawal</Button>
      {row.unavailableReason?<p id={`${id}-reason`} className="source-consents-muted">{row.unavailableReason}</p>:null}</div>
  </article>;
}
const recoveryTitle:Record<Exclude<SourceConsentsSnapshot['recovery']['state'],'none'>,string>={
  unknown:'the original withdrawal result is unknown',absent:'no committed result was reported for the original request',
  unavailable:'the original request status is unavailable',purged:'the original request status is no longer retained',
};
function Recovery({model,state}:{model:SourceConsentsModel;state:SourceConsentsSnapshot}){
  const id=useId(),recovery=state.recovery;
  if(recovery.state==='none')return null;
  return <StatusNotice tone="uncertain" title={recoveryTitle[recovery.state]}>
    <div className="source-consents-actions">
      <div><Button variant="secondary" disabled={recovery.checkUnavailableReason!==null} aria-describedby={recovery.checkUnavailableReason?`${id}-check`:undefined} onClick={()=>model.checkOriginalResult()}>check original result</Button>
        {recovery.checkUnavailableReason?<p id={`${id}-check`}>{recovery.checkUnavailableReason}</p>:null}</div>
      <div><Button variant="secondary" disabled={recovery.retryUnavailableReason!==null} aria-describedby={recovery.retryUnavailableReason?`${id}-retry`:undefined} onClick={()=>model.retryOriginal()}>retry original withdrawal</Button>
        {recovery.retryUnavailableReason?<p id={`${id}-retry`}>{recovery.retryUnavailableReason}</p>:null}</div>
    </div>
  </StatusNotice>;
}
/** Actual dialog body, also usable by an allocated Account composition. */
export function SourceConsentReviewForm({model,review}:{model:SourceConsentsModel;review:SourceConsentReview}){
  // A retained form cannot reveal an obsolete confirmation after replacement/cancel.
  if(model.getSnapshot().confirmation!==review)return null;
  return <form className="source-consents-review" aria-label="confirm consent withdrawal" onSubmit={event=>{event.preventDefault();model.confirmWithdrawal(review);}}>
    <p>{purpose[review.consent.purpose]}</p>
    <p>disclosure version {review.consent.disclosure.version}</p>
    <div className="source-consents-disclosure">{review.disclosureText}</div>
    <div className="source-consents-actions"><Button variant="secondary" type="button" onClick={()=>model.cancelReview(review)}>cancel</Button><Button type="submit">confirm withdrawal</Button></div>
  </form>;
}
/** Unmounted source slice. It renders supplied records and emits local intents only. */
export function SourceConsentSection({model}:{model:SourceConsentsModel}){
  const state=useSyncExternalStore(model.subscribe,model.getSnapshot,model.getSnapshot),id=useId(),read=state.read,review=state.confirmation;
  return <section className="source-consents" data-design-frame="498:399" aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>privacy &amp; source material</h2>
    {read.state==='unknown'?<StatusNotice title="recorded consents not loaded"/>:null}
    {read.state==='unavailable'?<StatusNotice tone="warning" title="recorded consents are unavailable"/>:null}
    {read.state==='loaded'&&read.page.total===0?<StatusNotice tone="empty" title="no recorded consents in this complete snapshot"/>:null}
    {read.state==='loaded'&&read.page.total>0?<>
      <p className="source-consents-muted">records {(read.page.cursor??0)+1} to {(read.page.cursor??0)+read.page.entries.length} of {read.page.total}{read.page.cursor!==null||read.page.nextCursor!==null?'. other records are outside this page.':null}</p>
      {state.groups.map((group,index)=><div key={group.alias} className="source-consents-group"><h3>consent group {index+1}</h3>
        {group.rows.map(row=><ConsentRecord key={row.record.consent.id} model={model} row={row}/>)}</div>)}
    </>:null}
    <Recovery model={model} state={state}/>
    {state.intentState==='emitted'?<StatusNotice tone="uncertain" title="withdrawal has not been confirmed"/>:null}
    {state.intentState==='unavailable'?<StatusNotice tone="warning" title="the withdrawal action is unavailable"/>:null}
    <div><Button variant="secondary" disabled={state.refreshUnavailableReason!==null} aria-describedby={state.refreshUnavailableReason?`${id}-refresh`:undefined} onClick={()=>model.refresh()}>refresh consents</Button>
      {state.refreshUnavailableReason?<p id={`${id}-refresh`} className="source-consents-muted">{state.refreshUnavailableReason}</p>:null}</div>
    <Dialog open={review!==null} title="review consent withdrawal" description="review the recorded purpose and disclosure before confirming." onOpenChange={open=>{if(!open)model.cancelReview(review);}}>
      {review?<SourceConsentReviewForm model={model} review={review}/>:null}
    </Dialog>
  </section>;
}
