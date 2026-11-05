import type {ReactNode} from 'react';
import type {CommerceHistoryEntry,CommerceReturnTerms,FrozenProductLine,Known} from '../../../../../src/contracts/PortalCommerce.ts';
import {Badge,Button,Icon} from '../../ui/index.ts';
/** Currency is not a field in the proposed new quote DTO. Preserve exact cents
 * without inventing currency, exchange rates or locale-derived money facts. */
export const money=(cents:number)=>`${cents} cents`;
export const knownText=(v:Known<string>)=>v.state==='known'?v.value:'unknown';
export const stateText=(value:string)=>value.replaceAll('_',' ');
export function Facts({rows}:{rows:readonly (readonly [string,ReactNode])[]}){return <dl className="orders-facts">{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;}
export function ReturnTerms({terms}:{terms:CommerceReturnTerms}){
 const d=terms.deadline,c=terms.returnCost;
 return <section className="orders-terms"><h3>checked return terms</h3><p>{terms.summary}</p><Facts rows={[
  ['checked on',terms.checkedOn],['policy source',<a href={terms.sourceUrl} target="_blank" rel="noreferrer">saved policy source</a>],
  ['opened items',terms.openedAllowed?'allowed under these terms':'not allowed under these terms'],
  ['return deadline',d.kind==='final_sale'?'final sale':d.kind==='absolute'?d.returnBy:`${d.days} days after ${d.anchor}`],
  ['ship by',d.kind==='absolute'?(d.shipBy??'not supplied'):d.kind==='relative'?(d.shipWithinDays===null?'not supplied':`${d.shipWithinDays} days after ${d.anchor}`):'not applicable'],
  ['return cost',c.kind==='known'?money(c.cents):c.kind==='client_pays'?c.description:'not applicable: final sale'],
 ]}/></section>;
}
export function ProductIdentity({line,onDetails}:{line:FrozenProductLine;onDetails?:()=>void}){
 const i=line.identity;
 return <div className="orders-product"><div className="orders-image" aria-label="product image unavailable"><Icon name="orders"/></div><div><h2>{i.name||'product name unavailable'}</h2><p className="orders-muted">{knownText(i.variant)} · {i.strength.state==='not_applicable'?i.strength.reason:knownText(i.strength)} · {knownText(i.sizeLabel)}</p>{onDetails?<Button variant="ghost" onClick={onDetails}>product details</Button>:null}</div></div>;
}
export function FrozenLine({line,onDetails}:{line:FrozenProductLine;onDetails?:()=>void}){return <section className="orders-line"><ProductIdentity line={line} onDetails={onDetails}/><Facts rows={[
 ['retailer & seller',`${line.retailer} · ${line.seller}`],['fulfilled by',knownText(line.fulfiller)],['quantity',line.quantity],['unit price',money(line.unitPrice.cents)],['line total',money(line.lineTotalCents)],['price checked on',line.unitPrice.checkedOn],['item checked on',line.checkedOn],['item source',<a href={line.sourceUrl} target="_blank" rel="noreferrer">saved item source</a>],
 ]}/><ReturnTerms terms={line.returnTerms}/></section>;}
function HistoryBody({entry}:{entry:CommerceHistoryEntry}){
 const b=entry.body;
 switch(b.kind){
  case 'payment_confirmed':return <><Facts rows={[
   ['gross received',money(b.totalCents)],['product',money(b.productCents)],['service',money(b.serviceCents)],['verified at',b.verifiedAt],['receipt date',b.receivedAt.state==='known'?b.receivedAt.value:'receipt date unknown'],
  ]}/><p>fee unknown · net unknown</p></>;
  case 'payment_claim':return <><p>sent payment is unverified</p><Facts rows={[
   ['claim status',stateText(b.claim.status)],['product',money(b.claim.productCents)],['service',money(b.claim.serviceCents)],['claimed total',money(b.claim.totalCents)],['quote version',b.claim.quoteVersion],
  ]}/></>;
  case 'payment_rejected':return <p>{stateText(b.reasonCode)}</p>;
  case 'quote_issued':return <p>quote version {b.quote.quoteVersion} · {money(b.totalCents)}</p>;
  case 'quote_accepted':return <p>quote version {b.acceptance.target.quoteVersion} · accepted at {b.acceptance.acceptedAt} by {b.acceptance.acceptedBy}</p>;
  case 'fulfillment':return <><p>{stateText(b.event.kind)} · {knownText(b.event.occurredOn)}</p>{b.event.kind==='shipped'?<p>tracking reference: {b.event.trackingReference}</p>:null}</>;
  case 'receipt_report':return <p>client receipt report recorded</p>;
  case 'return_event':return <><p>{b.event.note}</p><Facts rows={[
   ['status',stateText(b.event.status)],['expected refund',b.event.expectedRefundCents===null?'unknown':money(b.event.expectedRefundCents)],['retailer funds received',b.event.retailerRefundCents===null?'not recorded':money(b.event.retailerRefundCents)],['client repaid',b.event.clientRepaidCents===null?'not recorded':money(b.event.clientRepaidCents)],['policy checked on',b.event.policyCheckedOn??'unknown'],
  ]}/></>;
  case 'founder_fault':return <><p>{b.reason}</p><p>{stateText(b.resolution)}</p></>;
  case 'repayment_event':return <p>{stateText(b.event.kind)} · {b.event.amountCents===null?'amount unknown':money(b.event.amountCents)}</p>;
  case 'service_refund_request':return null;
 }
}
export function OrderHistory({entries}:{entries:CommerceHistoryEntry[]}){
 const visible=entries.filter(e=>e.body.kind!=='service_refund_request');
 return <section className="orders-panel"><h2>order history</h2>{visible.length?<ol className="orders-history">{visible.map(entry=><li key={entry.id}><Badge>{stateText(entry.kind)}</Badge><HistoryBody entry={entry}/><Facts rows={[
  ['occurred on',knownText(entry.occurredOn)],['occurred at',knownText(entry.occurredAt)],['recorded at',entry.recordedAt],['reported by',knownText(entry.reportedBy)],['recorded by',entry.recordedBy],['channel',entry.channel.state==='known'?stateText(entry.channel.value):'unknown'],
 ]}/></li>)}</ol>:<p className="orders-muted">no history supplied for this version</p>}</section>;
}
