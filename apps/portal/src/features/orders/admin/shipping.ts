import type {CommerceDetail,CommerceSnapshot,ShippingAddress,ProductQuoteDraftBody} from '../../../../../../src/contracts/PortalCommerce.ts';
import type {PaymentRpcCall} from '../../../../../../supabase/functions/concierge-payments/types.ts';
import {mapPaymentViewV2} from '../../../../../../supabase/functions/concierge-payments/methods.ts';
import {commerceDetailShape} from '../../../../../../src/contracts/PortalCommerceMapping.ts';
import {readCommerceShape,cAddress,cPositive,cRev,cSnapshot,cUuid,cDraftBody,co,ce,cn} from '../../../../../../src/contracts/PortalCommerceValidation.ts';
import {exactKeys,readObject,readUuid,requireValue} from '../../../../../../src/contracts/ConciergePortalValidation.ts';
import type {ProductQuoteDraftRead} from './types.ts';

export type ProductQuoteShippingView={readonly clientId:string;readonly paymentRevision:number;readonly shippingAddress:{readonly version:number;readonly address:Readonly<ShippingAddress>}|null};
export type ProductQuoteShippingSelection={status:'available';address:{version:number;address:Readonly<ShippingAddress>}}|{status:'unavailable'};
export type ProductQuoteShippingReadBinding={command:{schemaVersion:2;action:'advisor_read';clientId:string};call:PaymentRpcCall;value:unknown};

const versionedAddress=co({version:cPositive,address:cAddress});
const viewShape=co({clientId:cUuid,paymentRevision:cRev,shippingAddress:cn(versionedAddress)});
function immutable<T>(value:T):T {
 if(value!==null&&typeof value==='object'){for(const item of Object.values(value))immutable(item);Object.freeze(value);}
 return value;
}
function draftContext(value:ProductQuoteDraftRead){
 const draft=readCommerceShape<CommerceDetail>(value.draft,commerceDetailShape),snapshot=readCommerceShape<CommerceSnapshot>(value.snapshot,cSnapshot);
 requireValue(draft.kind==='quote_draft');return {draft,snapshot};
}
const identity=(value:string)=>readUuid(value).toLowerCase();

/** Strict readonly data, not an authorization or an address mutation. */
export function readProductQuoteShippingView(value:unknown):ProductQuoteShippingView {
 const parsed=readCommerceShape<ProductQuoteShippingView>(value,viewShape);
 if(parsed.shippingAddress)requireValue(/^[A-Z]{2}$/.test(parsed.shippingAddress.address.countryCode));
 return immutable({clientId:identity(parsed.clientId),paymentRevision:parsed.paymentRevision,shippingAddress:parsed.shippingAddress?{version:parsed.shippingAddress.version,address:{...parsed.shippingAddress.address}}:null});
}

/** Pure projection of an EXISTING authorized response. W0 must supply actual
 * creation-bound selected-client/read metadata; this function proves no Auth,
 * finance capability, current write grant or installed producer by itself. */
export function productQuoteShippingFromPaymentRead(binding:ProductQuoteShippingReadBinding,selection:ProductQuoteDraftRead):ProductQuoteShippingView|null {
 try{
  exactKeys(readObject(binding),['command','call','value']);
  const command=readCommerceShape<ProductQuoteShippingReadBinding['command']>(binding.command,co({schemaVersion:ce(2),action:ce('advisor_read'),clientId:cUuid}));
  const call=readCommerceShape<{name:'concierge_payment_view_v2';args:{p_client_id:string}}>(binding.call,co({name:ce('concierge_payment_view_v2'),args:co({p_client_id:cUuid})}));
  const {draft,snapshot}=draftContext(selection),client=identity(draft.clientId);
  requireValue(identity(command.clientId)===client&&identity(call.args.p_client_id)===client);
  const payment=mapPaymentViewV2(binding.value);
  requireValue(payment.revision===snapshot.paymentRevision&&draft.body.shippingAddressVersion.state==='known');
  const version=draft.body.shippingAddressVersion.value;
  const address=payment.shippingAddresses.find(entry=>entry.version===version);
  if(!address)return null;
  // No latest/profile/cache fallback: only that immutable version in this
  // exact canonical response may identify the selected draft address.
  return immutable({clientId:client,paymentRevision:payment.revision,shippingAddress:{version:address.version,address:{...address.address}}});
 }catch{return null;}
}

/** Display availability only. Issued quotes instead use their own immutable
 * CommerceQuoteHeader.address; a payment revision match cannot grant a write. */
export function selectProductQuoteShippingAddress(value:ProductQuoteShippingView|null|undefined,selection:ProductQuoteDraftRead|null):ProductQuoteShippingSelection {
 try{
  requireValue(value!==null&&value!==undefined&&selection!==null);
  const parsed=readProductQuoteShippingView(value),{draft,snapshot}=draftContext(selection);
  requireValue(identity(parsed.clientId)===identity(draft.clientId)&&parsed.paymentRevision===snapshot.paymentRevision&&draft.body.shippingAddressVersion.state==='known'&&parsed.shippingAddress!==null&&parsed.shippingAddress.version===draft.body.shippingAddressVersion.value);
  requireValue(/^[A-Z]{2}$/.test(parsed.shippingAddress.address.countryCode));
  return immutable({status:'available',address:{version:parsed.shippingAddress.version,address:{...parsed.shippingAddress.address}}});
 }catch{return {status:'unavailable'};}
}

/** Presentation of the explicitly editable local selection. It is not a
 * fabricated canonical draft, saved address or current write authorization. */
export function selectProductQuoteWorkingAddress(value:ProductQuoteShippingView|null|undefined,clientId:string,snapshot:CommerceSnapshot|null,body:ProductQuoteDraftBody):ProductQuoteShippingSelection {
 try{
  requireValue(value!==null&&value!==undefined&&snapshot!==null);
  const parsed=readProductQuoteShippingView(value),head=readCommerceShape<CommerceSnapshot>(snapshot,cSnapshot),draft=readCommerceShape<ProductQuoteDraftBody>(body,cDraftBody);
  requireValue(parsed.clientId===identity(clientId)&&parsed.paymentRevision===head.paymentRevision&&draft.shippingAddressVersion.state==='known'&&parsed.shippingAddress!==null&&parsed.shippingAddress.version===draft.shippingAddressVersion.value);
  return immutable({status:'available',address:{version:parsed.shippingAddress.version,address:{...parsed.shippingAddress.address}}});
 }catch{return {status:'unavailable'};}
}
