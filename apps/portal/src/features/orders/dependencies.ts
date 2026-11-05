import {checkCommerceQuoteHeader,hashFrozenCommerceTerms,mapCommerceResult} from '../../../../../src/contracts/PortalCommerceMapping.ts';
import {commerceReturnBasis,commerceCanonicalJson} from '../../../../../src/contracts/PortalCommerceValidation.ts';
import type {ClientCommerceCommand,CompleteQuote,OrdersSelection} from './types.ts';

/** cab source authority, derived only from closed positive-mapped DTOs. */
export function quoteWriteDependency(quote:CompleteQuote|null|undefined):{available:true;currency:'USD'}|{available:false;code:'currency_unavailable'}{
 try{if(!quote?.verified)throw Error();checkCommerceQuoteHeader(quote.header);return {available:true,currency:quote.header.currency};}
 catch{return {available:false,code:'currency_unavailable'};}
}
export function returnWriteDependency(selection:OrdersSelection|null|undefined):{available:true;expectedReturnRevision:number}|{available:false;code:'return_revision_unavailable'}{
 try{if(selection?.detail.kind!=='purchase')throw Error();return {available:true,...commerceReturnBasis(selection.snapshot)};}
 catch{return {available:false,code:'return_revision_unavailable'};}
}
/** Revalidate the supplied finite basis at the real raw-port boundary, including
 * all frozen components/hash. This is not a flag granting transport/authority. */
export async function checkCommerceWriteBasis(command:ClientCommerceCommand,basis:OrdersSelection|undefined,actorId:string):Promise<void>{
 if(!basis)throw Error('unavailable');
 mapCommerceResult({schemaVersion:1,action:'read_commerce_detail_v1',entity:basis.entity,snapshot:basis.snapshot},{schemaVersion:1,clientId:actorId,snapshot:basis.snapshot,detail:basis.detail},{actorId,requestHash:null});
 if(command.action==='request_product_return_v1'){
  const dep=returnWriteDependency(basis);if(!dep.available||basis.detail.kind!=='purchase'||basis.detail.id!==command.purchaseId||dep.expectedReturnRevision!==command.expectedReturnRevision)throw Error('unavailable');return;
 }
 if(command.action!=='accept_product_quote_v1'&&command.action!=='submit_payment_claim_v1')throw Error('unavailable');
 const q=basis.quote,dep=quoteWriteDependency(q);if(!q||!dep.available||basis.detail.kind!=='quote'||commerceCanonicalJson(q.header)!==commerceCanonicalJson(basis.detail)||commerceCanonicalJson(command.quote)!==commerceCanonicalJson(q.header.target))throw Error('unavailable');
 if(await hashFrozenCommerceTerms(q.header,q.lines,q.options)!==command.quote.termsHash)throw Error('unavailable');
 if(q.header.status!=='payable'||command.action==='accept_product_quote_v1'&&q.header.acceptance!==null)throw Error('unavailable');
 if(command.action==='submit_payment_claim_v1'){
  const h=q.header,expected={currency:dep.currency,quoteId:h.target.quoteId,quoteVersion:h.target.quoteVersion,shippingAddressVersion:h.address.version,serviceCents:h.serviceCents,productCents:h.productSubtotalCents+h.tax.cents+h.shipping.cents,totalCents:h.totalCents,paymentOptionId:command.payment.paymentOptionId};
  if(!h.canPay||!h.acceptance||basis.snapshot.paymentRevision!==command.expectedPaymentRevision||!q.options.some(o=>o.id===command.payment.paymentOptionId&&o.available)||commerceCanonicalJson(command.payment)!==commerceCanonicalJson(expected))throw Error('unavailable');
 }
}
/** Historical custody hash only. Never parses/upgrades an unsupported old wire
 * into a new command or inserts currency. Callers permit READ recovery only. */
export async function hashRetainedCommerceCommand(command:unknown):Promise<string>{
 const bytes=new TextEncoder().encode(commerceCanonicalJson(command));
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
}
