import type {Known,ProductQuoteDraftBody,ProductQuoteLineDraft,CommerceReturnTermsDraft} from '../../../../../../src/contracts/PortalCommerce.ts';
import {readCommerceShape,cDraftBody,cDraftLine,cDay,co,ct} from '../../../../../../src/contracts/PortalCommerceValidation.ts';
import {commerceQuantityMax} from '../../../../../../src/contracts/PortalCommerceValues.ts';
import {requireValue} from '../../../../../../src/contracts/ConciergePortalValidation.ts';
import {parseProductQuoteCents,productQuoteCheckedMoney} from './quote-model.ts';

export const productQuoteHeaderFields=['taxAmount','taxCheckedOn','shippingAmount','shippingCheckedOn','note','serviceChoice'] as const;
export const productQuoteLineFields=['quantity','retailer','seller','fulfiller','sourceUrl','checkedOn','unitPrice','unitPriceCheckedOn','policyCheckedOn','policySourceUrl','policySummary','openedAllowed','deadline','returnBy','shipByKind','shipBy','relativeDays','relativeAnchor','shipWithinKind','shipWithinDays','returnCost','returnCostAmount','returnCostDescription'] as const;
export type ProductQuoteHeaderInputs=Record<typeof productQuoteHeaderFields[number],string>;
export type ProductQuoteLineInputs=Record<typeof productQuoteLineFields[number],string>;
export class ProductQuoteInputError extends Error {
 readonly field:string;
 constructor(field:string,message:string){super(message);this.field=field;this.name='ProductQuoteInputError';}
}
const known=<T>(value:T):Known<T>=>({state:'known',value});
const unknown=<T>():Known<T>=>({state:'unknown'});
const text=<T extends string|number>(value:Known<T>)=>value.state==='known'?String(value.value):'';
function decimal(cents:number):string {const value=BigInt(cents);return `${value/100n}.${String(value%100n).padStart(2,'0')}`;}
function money(value:ProductQuoteDraftBody['tax']){return value.state==='known'?{amount:decimal(value.value.cents),day:value.value.checkedOn}:{amount:'',day:''};}
const headerShape=co(Object.fromEntries(productQuoteHeaderFields.map(field=>[field,ct(4000,true)])));
const lineShape=co(Object.fromEntries(productQuoteLineFields.map(field=>[field,ct(4000,true)])));
export function readProductQuoteHeaderInputs(value:unknown):ProductQuoteHeaderInputs{return readCommerceShape(value,headerShape);}
export function readProductQuoteLineInputs(value:unknown):ProductQuoteLineInputs{return readCommerceShape(value,lineShape);}
function number(value:string,field:string,maximum=Number.MAX_SAFE_INTEGER):Known<number> {
 const raw=value.trim();if(raw==='')return unknown();
 if(!/^\d{1,16}$/.test(raw)||!Number.isSafeInteger(Number(raw))||Number(raw)<1||Number(raw)>maximum)throw new ProductQuoteInputError(field,'enter a whole number within the allowed range');
 return known(Number(raw));
}
function date(value:string,field:string):Known<string> {
 const raw=value.trim();if(raw==='')return unknown();
 try{readCommerceShape(raw,cDay);return known(raw);}catch{throw new ProductQuoteInputError(field,'enter a valid checked or actual date');}
}
function url(value:string,field:string):Known<string> {
 const raw=value.trim();if(raw==='')return unknown();
 try{return known(readCommerceShape<string>(raw,{type:'url'}));}catch{throw new ProductQuoteInputError(field,'enter the exact safe HTTPS source link');}
}
function checked(amount:string,day:string,field:string){
 try{return productQuoteCheckedMoney(amount,day);}catch{throw new ProductQuoteInputError(field,'enter both the exact amount and the date it was checked, or leave both blank');}
}
const entry=(value:string):Known<string>=>value.trim()===''?unknown():known(value.trim());
function nullableDate(mode:string,value:string,field:string):Known<string|null> {
 if(mode==='unknown')return unknown();if(mode==='none')return known(null);requireValue(mode==='date');return date(value,field);
}
function nullableDays(mode:string,value:string,field:string):Known<number|null> {
 if(mode==='unknown')return unknown();if(mode==='none')return known(null);requireValue(mode==='days');return number(value,field);
}

/** Raw editable strings can be retained without pretending a partial checked
 * amount/date or a half-typed source URL is a canonical financial fact. */
export function productQuoteHeaderInputs(value:ProductQuoteDraftBody):ProductQuoteHeaderInputs {
 const body=readCommerceShape<ProductQuoteDraftBody>(value,cDraftBody),tax=money(body.tax),shipping=money(body.shipping);
 return {taxAmount:tax.amount,taxCheckedOn:tax.day,shippingAmount:shipping.amount,shippingCheckedOn:shipping.day,note:body.note??'',serviceChoice:body.serviceCents.state==='unknown'?'unknown':body.serviceCents.value===0?'product_only':'recorded_service'};
}
export function productQuoteHeaderFromInputs(value:ProductQuoteDraftBody,input:ProductQuoteHeaderInputs):ProductQuoteDraftBody {
 const base=readCommerceShape<ProductQuoteDraftBody>(value,cDraftBody),fields=readProductQuoteHeaderInputs(input);
 let serviceCents:ProductQuoteDraftBody['serviceCents'],servicePeriod=base.servicePeriod;
 if(fields.serviceChoice==='unknown')serviceCents=unknown();
 else if(fields.serviceChoice==='product_only'){serviceCents=known(0);servicePeriod=null;}
 else{
  requireValue(fields.serviceChoice==='recorded_service'&&base.serviceCents.state==='known'&&base.serviceCents.value===10000);
  serviceCents=known(10000); // Retain only an existing source allocation/period.
 }
 return readCommerceShape({...base,tax:checked(fields.taxAmount,fields.taxCheckedOn,'taxAmount'),shipping:checked(fields.shippingAmount,fields.shippingCheckedOn,'shippingAmount'),serviceCents,servicePeriod,note:fields.note===''?null:fields.note},cDraftBody);
}
export function productQuoteLineInputs(value:ProductQuoteLineDraft):ProductQuoteLineInputs {
 const line=readCommerceShape<ProductQuoteLineDraft>(value,cDraftLine),price=money(line.unitPrice),terms=line.returnTerms,d=terms.deadline,c=terms.returnCost;
 const shipBy=d.kind==='absolute'?d.shipBy:unknown<string|null>(),within=d.kind==='relative'?d.shipWithinDays:unknown<number|null>();
 return {
  quantity:text(line.quantity),retailer:text(line.retailer),seller:text(line.seller),fulfiller:text(line.fulfiller),sourceUrl:text(line.sourceUrl),checkedOn:text(line.checkedOn),unitPrice:price.amount,unitPriceCheckedOn:price.day,
  policyCheckedOn:text(terms.checkedOn),policySourceUrl:text(terms.sourceUrl),policySummary:terms.summary,openedAllowed:terms.openedAllowed.state==='unknown'?'unknown':terms.openedAllowed.value?'yes':'no',
  deadline:d.kind,returnBy:d.kind==='absolute'?text(d.returnBy):'',shipByKind:shipBy.state==='unknown'?'unknown':shipBy.value===null?'none':'date',shipBy:shipBy.state==='known'&&shipBy.value!==null?shipBy.value:'',
  relativeDays:d.kind==='relative'?text(d.days):'',relativeAnchor:d.kind==='relative'&&d.anchor.state==='known'?d.anchor.value:'unknown',shipWithinKind:within.state==='unknown'?'unknown':within.value===null?'none':'days',shipWithinDays:within.state==='known'&&within.value!==null?String(within.value):'',
  returnCost:c.kind,returnCostAmount:c.kind==='known'&&c.cents.state==='known'?decimal(c.cents.value):'',returnCostDescription:c.kind==='client_pays'?c.description:'',
 };
}
export function productQuoteLineFromInputs(value:ProductQuoteLineDraft,input:ProductQuoteLineInputs):ProductQuoteLineDraft {
 const base=readCommerceShape<ProductQuoteLineDraft>(value,cDraftLine),f=readProductQuoteLineInputs(input);
 let deadline:CommerceReturnTermsDraft['deadline'],returnCost:CommerceReturnTermsDraft['returnCost'];
 if(f.deadline==='unknown')deadline={kind:'unknown'};
 else if(f.deadline==='final_sale')deadline={kind:'final_sale'};
 else if(f.deadline==='absolute')deadline={kind:'absolute',returnBy:date(f.returnBy,'returnBy'),shipBy:nullableDate(f.shipByKind,f.shipBy,'shipBy')};
 else{
  requireValue(f.deadline==='relative'&&['unknown','purchase','delivery'].includes(f.relativeAnchor));
  deadline={kind:'relative',days:number(f.relativeDays,'relativeDays'),anchor:f.relativeAnchor==='unknown'?unknown():known(f.relativeAnchor as 'purchase'|'delivery'),shipWithinDays:nullableDays(f.shipWithinKind,f.shipWithinDays,'shipWithinDays')};
 }
 if(f.returnCost==='unknown')returnCost={kind:'unknown'};
 else if(f.returnCost==='known'){const cents=parseProductQuoteCents(f.returnCostAmount);returnCost={kind:'known',cents:cents===null?unknown():known(cents)};}
 else if(f.returnCost==='client_pays')returnCost={kind:'client_pays',description:f.returnCostDescription};
 else{requireValue(f.returnCost==='not_applicable');returnCost={kind:'not_applicable',reason:'final_sale'};}
 requireValue(['unknown','yes','no'].includes(f.openedAllowed));
 return readCommerceShape({...base,quantity:number(f.quantity,'quantity',commerceQuantityMax),retailer:entry(f.retailer),seller:entry(f.seller),fulfiller:entry(f.fulfiller),sourceUrl:url(f.sourceUrl,'sourceUrl'),checkedOn:date(f.checkedOn,'checkedOn'),unitPrice:checked(f.unitPrice,f.unitPriceCheckedOn,'unitPrice'),returnTerms:{checkedOn:date(f.policyCheckedOn,'policyCheckedOn'),sourceUrl:url(f.policySourceUrl,'policySourceUrl'),summary:f.policySummary,openedAllowed:f.openedAllowed==='unknown'?unknown():known(f.openedAllowed==='yes'),deadline,returnCost}},cDraftLine);
}
