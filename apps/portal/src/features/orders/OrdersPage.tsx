import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {quoteWriteDependency} from './dependencies.ts';
import type {CommerceEntityRef,FrozenProductLine} from '../../../../../src/contracts/PortalCommerce.ts';
import {Badge,Button,Sheet,StatusNotice} from '../../ui/index.ts';
import type {OrdersController,OrdersState} from './controller.ts';
import type {OrdersNavigation,OrdersUseDisplay} from './types.ts';
import {UseFacts,useLabels} from '../plan/UseFacts.tsx';
import {Facts,FrozenLine,OrderHistory,ProductIdentity,ReturnTerms,knownText,money,stateText} from './presentation.tsx';
import {OrderSheetContent} from './OrderSheets.tsx';
import type {OrderSheetKind} from './OrderSheets.tsx';
import './orders.css';
export {OrderSheetContent} from './OrderSheets.tsx';
export interface OrdersViewProps {state:OrdersState;controller?:OrdersController;navigation?:OrdersNavigation;useDisplay?:OrdersUseDisplay;onSheet?:(kind:OrderSheetKind,line?:FrozenProductLine)=>void}
const missingLabels:Record<string,string>={missing_line:'product details awaiting confirmation',incomplete_terms:'seller, total or return terms awaiting confirmation',selection_unproven:'product selection awaiting confirmation',address_unverified:'shipping address awaiting confirmation',method_unavailable:'receiving method unavailable'};
function Recovery({state,controller}:{state:OrdersState;controller?:OrdersController}){
 const details={
  initial:['orders not loaded','load current orders to continue.'],loading:['loading orders','loading complete current details.'],empty:['no product orders','self-purchased products remain in your plan.'],
  unavailable:['orders unavailable','order access is unavailable here. use order help for unfinished administration.'],offline:['connection unavailable','retry to load current details. an uncertain request remains separate.'],
  error:['could not load orders','retry to load current details.'],denied:['orders access denied','readable order details have been removed.'],ended:['session ended','sign in again to view your orders.'],
  conflict:['review current order details','refresh, then deliberately review the complete current quote before another acceptance or claim.'],ready:['',''],
 } as const;
 if(state.phase==='ready')return null;
 const [title,body]=details[state.phase];
 return <StatusNotice title={title} tone={state.phase==='loading'?'loading':state.phase==='denied'||state.phase==='ended'?'denied':state.phase==='empty'?'empty':state.phase==='conflict'?'warning':'neutral'} action={controller&&!['ended','denied','empty'].includes(state.phase)?<Button variant="secondary" onClick={()=>void controller.refresh()}>retry loading orders</Button>:undefined}>{body}</StatusNotice>;
}
export function OrdersView({state,controller,navigation,onSheet,useDisplay}:OrdersViewProps){
 const selection=state.selection,d=selection?.detail,q=selection?.quote,quoteDependency=quoteWriteDependency(q),writable=state.available&&state.mode!=='historical'&&!state.pending;
 const target=d?.kind==='purchase'?d.line.selection:null;
 const use=state.phase==='ready'&&target&&useDisplay!==undefined&&useDisplay.clientId===d?.clientId&&
  useDisplay.selection.productId===target.productId&&useDisplay.selection.decisionId===target.decisionId&&
  useDisplay.selection.publication.version===target.publication.version&&useDisplay.selection.publication.documentSchemaVersion===target.publication.documentSchemaVersion&&
  useDisplay.view.status==='available'&&useDisplay.view.use.product.kind==='plan_product'&&useDisplay.view.use.product.productId===target.productId&&
  useDisplay.view.use.product.publication?.version===target.publication.version&&useDisplay.view.use.product.publication?.documentSchemaVersion===target.publication.documentSchemaVersion?useDisplay.view.use:null;
 const detailAction=(line:FrozenProductLine)=>onSheet?.('product',line);
 return <div className="orders-view" data-orders-source>
  <header className="orders-heading" data-delivered={d?.kind==='purchase'&&!!d.delivery}><h1 data-page-heading tabIndex={-1}>{d?.kind==='purchase'&&d.delivery?'your order has arrived':'orders'}</h1>{selection?<Button variant="ghost" onClick={()=>{controller?.close();navigation?.back();}}>back to orders</Button>:null}<p className="orders-muted">product approval, payment and delivery are separate steps</p></header>
  {state.mode==='read-only'?<StatusNotice title="read-only care access">order administration remains available. new skincare support is not included.</StatusNotice>:state.mode==='administration'?<StatusNotice title="order administration">care access has ended. unfinished orders and returns remain separately reachable.</StatusNotice>:state.mode==='historical'?<StatusNotice title="historical order view">these original transaction details are read-only.</StatusNotice>:null}
  <Recovery state={state} controller={controller}/>
  {state.pending?<StatusNotice title={state.pending.phase==='sending'?'request in progress':'request result uncertain'} tone={state.pending.phase==='sending'?'loading':'uncertain'} action={state.pending.phase==='uncertain'&&controller?<div className="orders-actions"><Button onClick={()=>void controller.checkStatus()}>check request status</Button><Button variant="secondary" onClick={()=>void controller.retryIntent()}>retry this exact request</Button></div>:undefined}><p>{state.pending.command.requestId}</p>{state.pending.status==='unsupported'?<p>this saved request uses an unavailable format. its original data is retained.</p>:state.pending.status==='failed'?<p>status could not be checked. the original request remains uncertain.</p>:state.pending.status==='absent'?<p>no committed result was returned. retry uses the same request and terms.</p>:null}</StatusNotice>:state.notice==='acknowledged'?<StatusNotice tone="success" title="request recorded">refresh the order to see its current recorded state.</StatusNotice>:null}
  {!selection&&state.index?<section className="orders-index" aria-label="quotes and orders">{state.index.entries.map(entry=><article className="orders-panel" key={entry.entity.kind+':'+entry.entity.id}><Badge>{stateText(entry.state)}</Badge><h2>{entry.label}</h2><p className="orders-muted">recorded at {entry.recordedAt}</p><Button variant="secondary" onClick={()=>{if(navigation)navigation.open(entry.entity);else void controller?.open(entry.entity);}} disabled={!controller&&!navigation}>view details</Button></article>)}{state.index.nextCursor?<Button variant="secondary" disabled={!controller} onClick={()=>void controller?.loadMore()}>load more orders</Button>:null}</section>:null}
  {selection&&d?<div className="orders-columns" data-delivered={d.kind==='purchase'&&!!d.delivery}><div className="orders-main">
   {d.kind==='quote_preparation'?<section className="orders-panel"><Badge tone="pending">quote being prepared</Badge><h2>final quote pending</h2><Facts rows={[
    ['products',`${d.lineCount} recorded quote lines`],['retailer & seller','awaiting confirmation'],['tax & shipping','awaiting confirmation'],['return conditions','awaiting confirmation'],['ship to','awaiting confirmed address'],
   ]}/>{d.missing.length?<ul>{d.missing.map(issue=><li key={issue}>{missingLabels[issue]}</li>)}</ul>:null}<p>you’ll approve the final total and terms before sending payment. there is nothing to pay yet.</p><Button disabled>payment not available yet</Button></section>:null}
   {q?<section className="orders-panel"><Badge tone={q.header.status==='payable'?'pending':'neutral'}>{q.header.status==='payable'?(q.header.acceptance?'quote accepted':'final quote ready'):stateText(q.header.status)}</Badge><h2>quote version {q.header.target.quoteVersion}</h2>{q.lines.map(line=><div key={line.lineId} className="orders-main"><FrozenLine line={line} onDetails={onSheet?()=>detailAction(line):undefined}/>{q.lines.length>1&&navigation?.selfPurchase&&state.mode==='client'?<Button variant="secondary" onClick={()=>navigation.selfPurchase?.(line.selection)}>i bought it myself</Button>:null}</div>)}<Facts rows={[
    ['product subtotal',money(q.header.productSubtotalCents)],['tax',`${money(q.header.tax.cents)} · checked ${q.header.tax.checkedOn}`],['shipping',`${money(q.header.shipping.cents)} · checked ${q.header.shipping.checkedOn}`],['service',money(q.header.serviceCents)],['service period',q.header.servicePeriod?`${q.header.servicePeriod.startOn} to ${q.header.servicePeriod.endOn}`:'not supplied'],['total',money(q.header.totalCents)],['currency',quoteDependency.available?quoteDependency.currency:'not supplied'],['ship to',Object.values(q.header.address.address).filter(Boolean).join(', ')],['saved address version',q.header.address.version],['issued at',q.header.issuedAt],['accepted at',q.header.acceptance?.acceptedAt??'not recorded'],
   ]}/><p>changing material terms requires a new quote, acceptance and reconciliation. the saved quote remains unchanged.</p><div className="orders-actions"><Button disabled={!onSheet||!writable||q.header.status!=='payable'} onClick={()=>onSheet?.('review')}>review final quote</Button>{q.header.acceptance?<Button variant="secondary" disabled={!quoteDependency.available||!onSheet||!writable||!state.reviewed||!q.header.canPay} onClick={()=>onSheet?.('payment')}>view payment instructions</Button>:null}</div></section>:null}
   {d.kind==='purchase'?<section className="orders-panel"><Badge tone={d.delivery?'active':'neutral'}>{d.delivery?'delivery recorded':stateText(d.fulfillmentState)}</Badge><ProductIdentity line={d.line} onDetails={onSheet?()=>detailAction(d.line):undefined}/><Facts rows={[
    ['order record',d.id],['original quote',`${d.quote.quoteId} · version ${d.quote.quoteVersion}`],['purchased on',d.purchasedOn],['quantity',d.quantity],['retailer & seller',`${d.line.retailer} · ${d.line.seller}`],['delivery',d.delivery?knownText(d.delivery.occurredOn):'not recorded'],['delivery recorded by',d.delivery?.recordedBy??'not recorded'],['delivery recorded at',d.delivery?.recordedAt??'not recorded'],['delivery reported by',d.delivery?knownText(d.delivery.reportedBy):'not recorded'],['actual use',use?useLabels[use.state]:'actual use is not supplied by this order record'],['return window',d.returnWindow.kind==='resolved'?`return by ${d.returnWindow.returnBy}${d.returnWindow.shipBy?`; ship by ${d.returnWindow.shipBy}`:''}`:d.returnWindow.kind==='final_sale'?'final sale':stateText(d.returnWindow.reason)],
   ]}/>{use?<UseFacts use={use}/>:null}<ReturnTerms terms={d.line.returnTerms}/><Button variant="ghost" disabled={!controller} onClick={()=>void controller?.openOriginalQuote()}>view complete original quote</Button><div className="orders-actions"><Button variant="secondary" disabled={!onSheet||!writable} onClick={()=>onSheet?.('received')}>report received</Button><Button variant="secondary" disabled={!onSheet||!writable} onClick={()=>onSheet?.('return')}>get return help</Button>{navigation?.actualUse&&state.mode==='client'?<Button onClick={()=>navigation.actualUse?.(d.line.selection)}>record actual use</Button>:null}</div></section>:null}
   {d.kind==='legacy_quote'?<section className="orders-panel"><Badge>historical quote</Badge><h2>quote version {d.quote.version}</h2><Facts rows={[
    ['quote',d.quote.id],['publication version',d.quote.publicationVersion],['saved address version',d.quote.shippingAddressVersion??'unknown'],['product subtotal',money(d.quote.productSubtotalCents)],['tax',money(d.quote.taxCents)],['shipping',money(d.quote.shippingCents)],['service',money(d.quote.serviceCents)],['total',`${money(d.quote.totalCents)} · ${d.quote.currency}`],
   ]}/>{d.quote.items.map(item=><section key={item.recommendationId}><h3>original quoted line</h3><Facts rows={[['recommendation identity',item.recommendationId],['quantity',item.quantity],['unit price',money(item.unitPriceCents)],['line total',money(item.lineTotalCents)]]}/></section>)}<StatusNotice title="complete frozen terms unavailable">this original quote cannot be paid through this view.</StatusNotice></section>:null}
   {d.kind==='legacy_purchase'?<section className="orders-panel"><Badge>historical purchase</Badge><h2>{d.purchase.productName}</h2><Facts rows={[
    ['order record',d.purchase.id],['original quote',d.purchase.quoteId??'not supplied'],['original recommendation',d.purchase.recommendationId??'not supplied'],['product identity',d.purchase.productId],['retailer & seller',`${d.purchase.retailer} · ${d.purchase.seller}`],['quantity',d.purchase.quantity],['purchased on',d.purchase.purchasedOn],['delivered on',d.purchase.deliveredOn??'unknown'],['unit price',d.purchase.unitPriceCents===null?'unknown':money(d.purchase.unitPriceCents)],['tax',d.purchase.taxCents===null?'unknown':money(d.purchase.taxCents)],['shipping',d.purchase.shippingCents===null?'unknown':money(d.purchase.shippingCents)],['return policy',d.purchase.policy.summary],['policy checked on',d.purchase.policy.checkedOn],['policy source',<a href={d.purchase.policy.url} target="_blank" rel="noreferrer">saved policy source</a>],['opened items',d.purchase.policy.openedAllowed===null?'unknown':d.purchase.policy.openedAllowed?'allowed':'not allowed'],['final sale',d.purchase.policy.finalSale?'yes':'no'],['return by',d.purchase.policy.returnBy??'unknown'],['ship by',d.purchase.policy.shipBy??'unknown'],['return cost',d.purchase.policy.returnCostCents===null?'unknown':money(d.purchase.policy.returnCostCents)],['recorded by',d.purchase.recordedBy],['recorded at',d.purchase.recordedAt],
   ]}/><p>use order help for this original purchase. no replacement quote or receipt is created here.</p></section>:null}
   {d.kind==='return_case'?<section className="orders-panel"><Badge>{stateText(d.status)}</Badge><h2>product return</h2><Facts rows={[
    ['purchase',d.purchaseId],['quantity',d.quantity],['condition',d.condition],['reason',d.reason],['requested at',d.requestedAt],
   ]}/><p>retailer refund and client repayment are separate recorded events.</p></section>:null}
   {d.kind==='reconciliation'?<section className="orders-panel"><Badge tone="pending">{stateText(d.disposition)}</Badge><h2>quote reconciliation</h2><p>{d.reason}</p><Facts rows={[
    ['original quote',`${d.oldQuote.quoteId} · version ${d.oldQuote.quoteVersion}`],['replacement quote',d.replacementQuote?`${d.replacementQuote.quoteId} · version ${d.replacementQuote.quoteVersion}`:'not supplied'],['recorded by',d.recordedBy],['recorded at',d.recordedAt],
   ]}/><p>review the exact replacement quote separately before accepting changed terms.</p></section>:null}
   <OrderHistory entries={selection.history}/>
  </div><aside className="orders-context"><section className="orders-context-panel"><h2>{d.kind==='purchase'&&d.delivery?'arrived is not the same as started':'we’ll handle the details'}</h2><p>{d.kind==='purchase'?'delivery never records actual use. report your real use through your plan.':'we choose the retailer, check the exact variant and arrange delivery after the final quote is paid and verified.'}</p><p className="orders-muted">actual product cost, tax and shipping. no markup.</p>{q&&q.lines.length===1&&navigation?.selfPurchase&&state.mode==='client'?<Button variant="secondary" onClick={()=>{const line=q.lines[0];if(line)navigation.selfPurchase?.(line.selection);}}>i bought it myself</Button>:null}{d.kind==='purchase'&&navigation?.product?<Button variant="secondary" onClick={()=>navigation.product?.(d.line.selection)}>read introduction guide</Button>:null}</section>{navigation?.help?<Button variant="secondary" onClick={navigation.help}>get order help</Button>:null}</aside></div>:null}
 </div>;
}
export interface OrdersPageProps {controller:OrdersController;navigation?:OrdersNavigation;selected?:CommerceEntityRef;useDisplay?:OrdersUseDisplay}
/** Parent supplies shared shell/navigation/OverlayProvider and creation-bound
 * controller. This module does not register routes or create a transport. */
export function OrdersPage({controller,navigation,selected,useDisplay}:OrdersPageProps){
 const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
 const sameEntity=(a:CommerceEntityRef|undefined,b:CommerceEntityRef|undefined)=>a?.kind===b?.kind&&a?.id===b?.id&&a?.revision===b?.revision;
 const requestedKey=selected?`${selected.kind}:${selected.id}:${selected.revision}`:null,context=useRef({controller,requestedKey,request:selected?{...selected}:undefined,pending:selected!==undefined,opening:false});
 if(context.current.controller!==controller||context.current.requestedKey!==requestedKey)context.current={controller,requestedKey,request:selected?{...selected}:undefined,pending:selected!==undefined,opening:false};
 const renderedContext=context.current;
 // Starting open is not acquisition. Only an actual matching ready snapshot
 // releases the request mask; cancellation/abort observers can still see A.
 if(renderedContext.pending&&renderedContext.request&&state.phase==='ready'&&sameEntity(renderedContext.request,state.selection?.entity)&&controller.getSnapshot()===state)renderedContext.pending=false;
 type SheetState={kind:OrderSheetKind;line?:FrozenProductLine;context:typeof renderedContext;entity:CommerceEntityRef};
 const [sheet,setSheet]=useState<SheetState|null>(null),sheetOwner=useRef<SheetState|null>(sheet);
 sheetOwner.current=sheet;
 const ownsSheet=(expected:SheetState)=>sheetOwner.current===expected&&context.current===expected.context&&expected.context.controller===controller&&sameEntity(sheetOwner.current.entity,expected.entity);
 const dismissSheet=(expected:SheetState)=>{
  if(!ownsSheet(expected))return;
  setSheet(current=>{
   if(current!==expected||!ownsSheet(expected)||!sameEntity(current.entity,expected.entity))return current;
   sheetOwner.current=null;return null;
  });
 };
 const mismatch=renderedContext.pending&&renderedContext.request!==undefined&&!sameEntity(renderedContext.request,state.selection?.entity),indexed=state.index?.entries.some(entry=>sameEntity(entry.entity,renderedContext.request));
 // A requested target is not evidence that the previous target is still its
 // financial detail. Mask the prior selection before effects acquire the next.
 const visibleState:OrdersState=mismatch?{...state,selection:null,reviewed:false,phase:state.phase==='ready'?(indexed?'loading':'unavailable'):state.phase}:state;
 const visibleSheet=sheet&&sheet.context===renderedContext&&!mismatch&&sameEntity(sheet.entity,state.selection?.entity)?sheet:null;
 useEffect(()=>{void controller.refresh();return()=>controller.close();},[controller]);
 useEffect(()=>{
  const request=renderedContext.request;
  if(context.current!==renderedContext||!renderedContext.pending||renderedContext.opening||!request||controller.getSnapshot()!==state||!state.index||state.phase!=='ready')return;
  if(sameEntity(request,state.selection?.entity)){renderedContext.pending=false;return;}
  if(!state.index.entries.some(entry=>sameEntity(entry.entity,request)))return;
  // Prevent reentrant opens without dropping the mask before accepted state.
  renderedContext.opening=true;
  void controller.open(request).then(()=>{renderedContext.opening=false;},()=>{renderedContext.opening=false;});
 },[controller,requestedKey,state]);
 useEffect(()=>{setSheet(current=>{
  if(context.current!==renderedContext||!current||current.context===renderedContext)return current;
  if(sheetOwner.current===current)sheetOwner.current=null;return null;
 });},[controller,requestedKey]);
 useEffect(()=>{if(['ended','denied','conflict'].includes(state.phase)&&sheet)dismissSheet(sheet);},[state.phase]);
 return <><OrdersView state={visibleState} controller={controller} navigation={navigation} useDisplay={useDisplay} onSheet={(kind,line)=>{if(context.current===renderedContext&&controller.getSnapshot()===state&&!mismatch&&state.phase==='ready'&&state.selection){const next={kind,line,context:renderedContext,entity:state.selection.entity};sheetOwner.current=next;setSheet(next);}}}/>{visibleSheet&&state.selection?<Sheet open={true} title={visibleSheet.kind==='product'?'frozen product details':visibleSheet.kind==='review'?'review final quote':visibleSheet.kind==='payment'?'payment instructions':visibleSheet.kind==='received'?'report actual receipt':'request product return'} backLabel="back to order" onOpenChange={open=>{if(!open)dismissSheet(visibleSheet);}} canClose={()=>ownsSheet(visibleSheet)&&sameEntity(controller.getSnapshot().selection?.entity,visibleSheet.entity)&&controller.getSnapshot().pending?.phase!=='sending'}><OrderSheetContent key={visibleSheet.kind+':'+state.selection.entity.id} kind={visibleSheet.kind} line={visibleSheet.line} state={state} controller={controller} onDone={()=>dismissSheet(visibleSheet)}/></Sheet>:null}</>;
}
