import {useState,useSyncExternalStore} from 'react';
import type {ReactElement} from 'react';
import {Badge,Button,Field,Select,StatusNotice} from '../../ui/index.ts';
import {Panel} from '../../shell/PortalShell.tsx';
import {firstServiceQuotes,paymentMoney} from './model.ts';
import type {ClientPaymentSnapshot,ClientPaymentsController} from './types.ts';

type Quote=NonNullable<ClientPaymentSnapshot['view']>['quotes'][number];
function ServiceQuote({controller,rendered,quote}:{controller:ClientPaymentsController;rendered:ClientPaymentSnapshot;quote:Quote}):ReactElement {
  const [intent,setIntent]=useState({snapshot:rendered,optionId:'',confirmed:false});
  // A fresh financial read invalidates the prior confirmation, including when
  // identical option IDs appear under a changed quote/recipient basis.
  if(intent.snapshot!==rendered)setIntent({snapshot:rendered,optionId:'',confirmed:false});
  const selected=quote.paymentOptions.find(o=>o.id===intent.optionId&&o.available);
  const enabled=rendered.phase==='ready'&&!rendered.pending&&intent.snapshot===rendered;
  return <section className="plan-stack" aria-label="first service quote">
    <Badge>service quote</Badge><h3>{paymentMoney(quote.totalCents)} · first monthly service period</h3>
    <p>products are separate. your service period starts when your first plan is published.</p>
    <Field label="payment method" hint="choose the method you used and check the recipient below">
      <Select value={selected?.id??''} disabled={!enabled} options={quote.paymentOptions.filter(o=>o.available).map(o=>({value:o.id,label:o.recipient.method.replaceAll('_',' ')}))}
        onValueChange={optionId=>{if(controller.getSnapshot()===rendered)setIntent({snapshot:rendered,optionId,confirmed:false});}}/>
    </Field>
    {quote.paymentOptions.filter(o=>o.available).map(option=><dl key={option.id} aria-label={`${option.recipient.method.replaceAll('_',' ')} recipient`}>
      <dt>recipient</dt><dd>{option.recipient.name}</dd>
      {'cashtag' in option.recipient?<><dt>Cash App</dt><dd>{option.recipient.cashtag}</dd></>:null}
      {'email' in option.recipient?<><dt>email</dt><dd>{option.recipient.email}</dd></>:null}
      {'phone' in option.recipient?<><dt>phone</dt><dd>{option.recipient.phone}</dd></>:null}
      <dt>recipient version</dt><dd>{option.recipientVersion}</dd>
    </dl>)}
    <Field label="payment sent" hint="this records your claim; a founder still verifies the actual receipt">
      <Select value={intent.confirmed?'yes':'no'} disabled={!enabled||!selected} options={[{value:'no',label:'not yet'},{value:'yes',label:'i sent this amount to the selected recipient'}]}
        onValueChange={value=>{if(controller.getSnapshot()===rendered&&selected)setIntent({snapshot:rendered,optionId:selected.id,confirmed:value==='yes'});}}/>
    </Field>
    <Button disabled={!enabled||!selected||!intent.confirmed} onClick={()=>{if(selected&&intent.snapshot===rendered)void controller.claim(rendered,quote.id,selected.id,intent.confirmed);}}>record payment sent</Button>
  </section>;
}

/** W0 mounts this alongside M02 within the existing Orders shell. Loading and
 * disposal belong to its actual route/session entry; rendering performs no IO. */
export function ServicePayments({controller}:{controller:ClientPaymentsController}):ReactElement {
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const quotes=state.view?firstServiceQuotes(state.view):[];
  const claims=state.view?.claims.filter(c=>state.view!.quotes.some(q=>q.id===c.quoteId&&q.publicationVersion===0&&q.serviceCents>0))??[];
  return <Panel><div className="plan-stack" data-service-payments="first-service">
    <h2>first service payment</h2>
    {state.phase==='loading'?<StatusNotice tone="loading" title="reading your service payment"/>:null}
    {state.phase==='idle'?<StatusNotice title="service payment is not loaded"/>:null}
    {state.phase==='ended'?<StatusNotice tone="denied" title="this payment view is closed"/>:null}
    {state.phase==='denied'?<StatusNotice tone="denied" title="this payment view is unavailable"/>:null}
    {state.phase==='unavailable'?<StatusNotice tone="error" title="service payment is unavailable">refresh to check the latest status.</StatusNotice>:null}
    {state.outcome==='submitted_unverified'?<StatusNotice tone="success" title="payment claim recorded">awaiting receipt verification. payment does not automatically publish your plan.</StatusNotice>:null}
    {state.pending?<StatusNotice tone="warning" title="payment claim result is uncertain">
      <p>refresh first. if the result is still uncertain, retry the original claim.</p>
      <Button variant="secondary" disabled={state.phase!=='ready'} onClick={()=>{void controller.retry(state);}}>retry original claim</Button>
    </StatusNotice>:null}
    {state.phase==='submitting'?<StatusNotice tone="loading" title="recording your payment claim"/>:null}
    {state.view&&state.outcome!=='submitted_unverified'&&!state.pending?quotes.map(quote=><ServiceQuote key={`${quote.id}:${quote.version}`} controller={controller} rendered={state} quote={quote}/>):null}
    {state.view&&quotes.length===0&&claims.length===0?<p>your first service quote is not available yet.</p>:null}
    {claims.map(claim=><StatusNotice key={claim.id} title={claim.status==='confirmed'?'verified payment recorded':claim.status==='rejected'?'payment claim needs review':'awaiting receipt verification'}>
      {claim.status==='confirmed'?'your plan still requires a separate publication.':claim.status==='rejected'?'contact your advisor before sending another payment.':'a sent claim is awaiting a founder’s receipt check.'}
    </StatusNotice>)}
    <div><Button variant="secondary" busy={state.phase==='loading'} disabled={state.phase==='ended'||state.phase==='loading'||state.phase==='submitting'} onClick={()=>{if(controller.getSnapshot()===state)void controller.load();}}>refresh service payment</Button></div>
  </div></Panel>;
}
