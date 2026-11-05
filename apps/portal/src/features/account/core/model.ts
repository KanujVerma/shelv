import type {ShippingAddress,PaymentView} from '../../../../../../supabase/functions/concierge-payments/types.ts';
import {buildPaymentCall} from '../../../../../../supabase/functions/concierge-payments/contract.ts';
export type {ShippingAddress};
export type AccountData=Pick<PaymentView,'revision'|'shippingAddress'|'shippingAddresses'|'service'|'nextServicePeriod'>;
export const addressFields=[
 {key:'recipientName',label:'recipient name',limit:200,autoComplete:'shipping name'},
 {key:'line1',label:'address line 1',limit:200,autoComplete:'shipping address-line1'},
 {key:'line2',label:'address line 2 (optional)',limit:200,autoComplete:'shipping address-line2'},
 {key:'city',label:'city',limit:100,autoComplete:'shipping address-level2'},
 {key:'region',label:'state or region',limit:100,autoComplete:'shipping address-level1'},
 {key:'postalCode',label:'postal code',limit:20,autoComplete:'shipping postal-code'},
 {key:'countryCode',label:'country code (2 letters)',limit:2,autoComplete:'shipping country'},
] as const;
export const emptyAddress=():ShippingAddress=>({recipientName:'',line1:'',line2:'',city:'',region:'',postalCode:'',countryCode:''});
export function addressErrors(address:ShippingAddress){
 const errors:Partial<Record<keyof ShippingAddress,string>>={};
 for(const {key,limit} of addressFields){const value=address[key];if(typeof value!=='string'||/[\x00-\x1f\x7f]/.test(value)||Array.from(value).length>limit||key!=='line2'&&!value.trim())errors[key]=`enter ${key==='line2'?'up to':'1 to'} ${limit} characters without control characters`;}
 if(typeof address.countryCode==='string'&&!/^[A-Za-z]{2}$/.test(address.countryCode.trim()))errors.countryCode='enter a 2-letter country code';
 return errors;
}
export function addressCommand(address:ShippingAddress,requestId:string,expectedRevision:number,owner:string){
 const call=buildPaymentCall({action:'confirm_shipping_address',requestId,expectedRevision,address},owner);
 if(call.name!=='concierge_payment_write'||call.args.p_action!=='confirm_shipping_address')throw Error('invalid_input');
 return {action:'confirm_shipping_address' as const,requestId:call.args.p_request_id,expectedRevision:call.args.p_expected_revision,address:call.args.p_payload.address as ShippingAddress};
}
/** Positive Account projection: never retain the financial arrays/recipient or
 * service care/private fields in this controller, view, or transient draft. */
export function projectAccountPayment(v:PaymentView):AccountData{return{revision:v.revision,shippingAddress:v.shippingAddress,shippingAddresses:v.shippingAddresses,service:v.service,nextServicePeriod:v.nextServicePeriod};}
export function freeze<T>(value:T):T{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
