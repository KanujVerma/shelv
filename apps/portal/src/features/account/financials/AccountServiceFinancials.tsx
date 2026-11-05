import type {ServiceFinancialsView,ServiceFinancialsSnapshot} from '../../../../../../src/contracts/PortalServiceFinancials.ts';
import {Button,StatusNotice} from '../../../ui/index.ts';
import {paymentMoney} from '../../payments/model.ts';

export type AccountFinancialsRead=
  | {readonly state:'unread'|'loading'|'unavailable'|'denied'|'ended'}
  | {readonly state:'loaded';readonly view:ServiceFinancialsView};
export type FinancialNextPageIntent=Readonly<{snapshot:ServiceFinancialsSnapshot;cursor:string}>;
const verifiedDate=new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeZone:'America/Chicago'});
const day=(value:string)=><time dateTime={value}>{value}</time>;

/** Pure V1 Account content. Parent owns actual authentication, coherent reads,
 * request binding and private retirement. This view has no transport or writes. */
export function AccountServiceFinancials({read,onReadNextPage}:{read:AccountFinancialsRead;onReadNextPage?:(intent:FinancialNextPageIntent)=>void}) {
  if(read.state!=='loaded')return <StatusNotice
    tone={read.state==='loading'?'loading':read.state==='denied'||read.state==='ended'?'denied':read.state==='unavailable'?'error':'neutral'}
    title={read.state==='loading'?'reading recorded service payments':read.state==='unread'?'recorded payments have not been loaded':read.state==='ended'?'your financial session has ended':'payment details are unavailable'}/>;
  const view=read.view;
  // A future legacy/unknown-currency or supported-policy version needs its own
  // reviewed renderer. It cannot inherit canonical V1 USD or eligibility.
  if(view.schemaVersion!==1||view.guarantee.state!=='unavailable'||view.payments.some(row=>row.kind!=='canonical_payment'||!['pending_publication','scheduled'].includes(row.period.state)))
    return <StatusNotice tone="error" title="payment details are unavailable"/>;
  const snapshot=view.snapshot,cursor=view.nextCursor;
  return <section className="app-stack" aria-label="recorded service payments">
    <h2>recorded service payments</h2>
    <p>records as of {day(snapshot.asOfDay)} (Chicago time)</p>
    <dl><dt>first plan published</dt><dd>{view.firstPublicationOn.state==='known'?day(view.firstPublicationOn.value):'publication date is unavailable'}</dd></dl>
    {view.payments.length?<ul className="app-stack">{view.payments.map(row=><li key={row.claimId}>
      <dl>
        <dt>verified service payment</dt><dd>{paymentMoney(row.serviceCents)}</dd>
        <dt>verified on</dt><dd><time dateTime={row.verifiedAt}>{verifiedDate.format(new Date(row.verifiedAt))}</time> (Chicago time)</dd>
        <dt>recorded paid period</dt><dd>{row.period.state==='pending_publication'?'awaiting publication; dates are not recorded':<>{day(row.period.startOn)} until the start of {day(row.period.endOn)} (Chicago time)</>}</dd>
      </dl>
    </li>)}</ul>:<p>there are no payment entries on this page.</p>}
    {cursor!==null?<div className="app-stack"><p>more payment entries are available.</p>
      {onReadNextPage?<div><Button variant="secondary" onClick={()=>onReadNextPage(Object.freeze({snapshot,cursor}))}>load more payments</Button></div>:null}
    </div>:null}
    <StatusNotice title="guarantee details are unavailable">
      <p>your service-fee guarantee follows your agreed terms. text shelv about a refund.</p>
    </StatusNotice>
  </section>;
}
