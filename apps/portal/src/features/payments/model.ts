import type {ClientPaymentView} from './types.ts';

/** First-publication slice only. Legacy records have no frozen recipient;
 * product quotes require the complete product/return-terms commerce producer. */
export function firstServiceQuotes(view:ClientPaymentView){
  return view.quotes.filter(q=>q.contractVersion===2&&q.status==='payable'&&
    q.publicationVersion===0&&q.serviceCents===10000&&q.totalCents===10000&&
    q.servicePeriod===null&&q.shippingAddressVersion===null&&q.items.length===0&&
    q.productSubtotalCents===0&&q.taxCents===0&&q.shippingCents===0&&q.productTotalCents===0&&
    !view.claims.some(c=>c.quoteId===q.id&&c.status!=='rejected'));
}
export function paymentMoney(cents:number):string{
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
}
export function immutable<T>(value:T):T {
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    for(const child of Object.values(value))immutable(child);
    Object.freeze(value);
  }
  return value;
}
