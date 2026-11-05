import {useEffect,useRef,useSyncExternalStore} from 'react';
import type {ReactElement} from 'react';
import type {ServicePurchase,ServiceReturn} from '../../../../../../src/contracts/ConciergeService.ts';
import {Badge,Button,Icon,StatusNotice} from '../../../ui/index.ts';
import {PageHeader,Panel} from '../../../shell/PortalShell.tsx';
import type {ClientOrdersReadController,ClientOrdersRoute} from './types.ts';
import {dateLabel,formatRecordedCents,recordedPurchaseTotalCents,returnConditionLabel,returnStatusLabel,selectClientPurchase} from './model.ts';
// Reuse the existing token-based page compositions; no Orders stylesheet/shell.
import '../../plan/plan.css';

function PurchaseFacts({purchase}:{purchase:ServicePurchase}):ReactElement {
  return <dl>
    <dt>retailer</dt><dd>{purchase.retailer}</dd>
    <dt>seller</dt><dd>{purchase.seller}</dd>
    <dt>quantity</dt><dd>{purchase.quantity}</dd>
    <dt>purchase date</dt><dd><time dateTime={purchase.purchasedOn}>{dateLabel(purchase.purchasedOn)}</time></dd>
    <dt>delivery date in the purchase record</dt><dd>{purchase.deliveredOn?<time dateTime={purchase.deliveredOn}>{dateLabel(purchase.deliveredOn)}</time>:'not recorded'}</dd>
    <dt>purchase recorded at</dt><dd><time dateTime={purchase.recordedAt}>{purchase.recordedAt}</time></dd>
    <dt>unit amount</dt><dd>{formatRecordedCents(purchase.unitPriceCents)}</dd>
    <dt>tax</dt><dd>{formatRecordedCents(purchase.taxCents)}</dd>
    <dt>shipping</dt><dd>{formatRecordedCents(purchase.shippingCents)}</dd>
    <dt>recorded purchase total</dt><dd>{formatRecordedCents(recordedPurchaseTotalCents(purchase))}</dd>
    <dt>currency</dt><dd>not provided</dd>
  </dl>;
}
function SavedPolicy({purchase,owns}:{purchase:ServicePurchase;owns:()=>boolean}):ReactElement {
  const policy=purchase.policy;
  return <section className="plan-stack" aria-label="saved return conditions">
    <h3>return conditions saved at purchase</h3><p>{policy.summary}</p>
    <dl>
      <dt>checked on</dt><dd><time dateTime={policy.checkedOn}>{dateLabel(policy.checkedOn)}</time></dd>
      <dt>opened items</dt><dd>{policy.openedAllowed===null?'not provided':policy.openedAllowed?'allowed in the saved policy':'not allowed in the saved policy'}</dd>
      <dt>final sale</dt><dd>{policy.finalSale?'recorded as final sale':'not recorded as final sale'}</dd>
      <dt>return by</dt><dd>{dateLabel(policy.returnBy)}</dd>
      <dt>ship by</dt><dd>{dateLabel(policy.shipBy)}</dd>
      <dt>recorded return cost</dt><dd>{formatRecordedCents(policy.returnCostCents)} · currency not provided</dd>
    </dl>
    <a href={policy.url} rel="noreferrer" onClick={event=>{if(!owns())event.preventDefault();}}>recorded policy link</a>
    <p className="plan-meta">these are saved conditions, not a new eligibility check.</p>
  </section>;
}
function ReturnHistory({record}:{record:ServiceReturn}):ReactElement {
  return <section className="plan-stack" aria-label="recorded return history">
    <h3>{returnStatusLabel(record.status)}</h3>
    <dl>
      <dt>requested at</dt><dd><time dateTime={record.requestedAt}>{record.requestedAt}</time></dd>
      <dt>quantity</dt><dd>{record.quantity}</dd>
      <dt>reported condition</dt><dd>{returnConditionLabel(record.condition)}</dd>
      <dt>reason</dt><dd>{record.reason}</dd>
    </dl>
    {record.events.length===0?<p>no return events recorded.</p>:<ol className="plan-stack">{record.events.map(event=><li key={event.id}>
      <p>{returnStatusLabel(event.status)} · <time dateTime={event.recordedAt}>{event.recordedAt}</time></p>
      <p>{event.note}</p>
      <dl>
        <dt>expected refund recorded</dt><dd>{formatRecordedCents(event.expectedRefundCents)}</dd>
        <dt>retailer funds recorded</dt><dd>{formatRecordedCents(event.retailerRefundCents)}</dd>
        <dt>client repayment recorded</dt><dd>{formatRecordedCents(event.clientRepaidCents)}</dd>
        <dt>currency</dt><dd>not provided</dd>
        <dt>policy checked on</dt><dd>{dateLabel(event.policyCheckedOn)}</dd>
      </dl>
    </li>)}</ol>}
  </section>;
}

/** Read-only C06/C06D history packet inside the one actual client shell. A saved
 * purchase never supplies current guidance, tracking, payability or actual use. */
export function ClientOrdersView({controller,route,onOpenPurchase,onBack}:{
  controller:ClientOrdersReadController;route:ClientOrdersRoute;
  onOpenPurchase:(id:string)=>void;onBack:()=>void;
}):ReactElement {
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const live=useRef<object|null>(null),lifetime=Object.freeze({});live.current=lifetime;
  useEffect(()=>{
    // Effect replay must restore this committed lifetime after its own cleanup.
    live.current=lifetime;
    return()=>{if(live.current===lifetime)live.current=null;};
  },[lifetime]);
  const view=state.phase==='ready'?state.view:null;
  const selected=route.name==='order'&&view?selectClientPurchase(view,route.orderId):null;
  const owns=()=>{
    if(live.current!==lifetime)return false;
    const current=controller.getSnapshot();
    return live.current===lifetime&&current===state&&current.phase!=='ended'&&current.phase!=='denied';
  };
  const ownsPurchase=(purchase:ServicePurchase)=>{
    if(!owns()||!view)return false;
    const current=controller.getSnapshot();
    return live.current===lifetime&&current===state&&current.phase==='ready'&&current.view===view&&
      selectClientPurchase(current.view,purchase.id)===purchase;
  };
  const back=()=>{if(owns())onBack();};
  const reload=()=>{if(owns())void controller.load();};
  const refresh=<Button variant="secondary" busy={state.phase==='loading'} disabled={state.phase==='ended'||state.phase==='denied'||state.phase==='loading'} onClick={reload}>{state.phase==='idle'?'load orders':'refresh orders'}</Button>;
  return <div className="plan-view" data-client-orders="read-only">
    <PageHeader title={route.name==='order'?'recorded purchase':'orders'} description="recorded purchases and return history" action={refresh}/>
    {route.name==='order'?<div><Button variant="ghost" onClick={back}><Icon name="arrow-left"/>back to orders</Button></div>:null}
    {state.phase==='idle'?<StatusNotice title="orders are not loaded"/>:null}
    {state.phase==='loading'?<StatusNotice tone="loading" title="reading your recorded orders"/>:null}
    {state.phase==='unavailable'?<StatusNotice tone="error" title="orders are unavailable">refresh to try again.</StatusNotice>:null}
    {state.phase==='denied'?<StatusNotice tone="denied" title="you do not have access to these orders"/>:null}
    {state.phase==='ended'?<StatusNotice tone="denied" title="this orders view is closed"/>:null}
    {view&&route.name==='orders'?<>
      {view.purchases.length===0?<StatusNotice tone="empty" title="no recorded purchases"/>:
        <div className="plan-stack">{view.purchases.map(purchase=><Panel key={purchase.id}>
          <Badge>purchase recorded</Badge><h2>{purchase.productName}</h2>
          <p>{purchase.retailer} · {purchase.seller}</p>
          <p>purchased <time dateTime={purchase.purchasedOn}>{dateLabel(purchase.purchasedOn)}</time> · quantity {purchase.quantity}</p>
          <Button variant="secondary" onClick={()=>{if(ownsPurchase(purchase))onOpenPurchase(purchase.id);}}>view purchase</Button>
        </Panel>)}</div>}
      {view.returns.length>0?<Panel><h2>recorded returns</h2>{view.returns.map(record=><section className="plan-stack" key={record.id}>
        <h3>{selectClientPurchase(view,record.purchaseId)?.productName??'purchase details unavailable'}</h3>
        <ReturnHistory record={record}/>
      </section>)}</Panel>:<p>no return requests recorded.</p>}
    </>:null}
    {view&&route.name==='order'&&!selected?<StatusNotice tone="error" title="this purchase is unavailable">return to orders to choose a recorded purchase.</StatusNotice>:null}
    {view&&selected?<div className="plan-columns">
      <div className="plan-stack"><Panel>
        <Badge>purchase recorded</Badge><h2>{selected.productName}</h2>
        <PurchaseFacts purchase={selected}/><hr/>
        <SavedPolicy purchase={selected} owns={()=>ownsPurchase(selected)}/>
      </Panel>
      <Panel><h2>recorded return history</h2>
        {view.returns.some(record=>record.purchaseId===selected.id)?view.returns.filter(record=>record.purchaseId===selected.id).map(record=><ReturnHistory key={record.id} record={record}/>):<p>no return requests recorded for this purchase.</p>}
      </Panel></div>
      <aside className="plan-stack plan-context"><Panel className="plan-follow-up">
        <h2>purchase and actual use are separate</h2>
        <p>this purchase record does not establish whether you have started using the product.</p>
      </Panel><Panel>
        <h2>delivery and tracking</h2><p>current delivery and tracking details are not provided.</p>
      </Panel></aside>
    </div>:null}
  </div>;
}
