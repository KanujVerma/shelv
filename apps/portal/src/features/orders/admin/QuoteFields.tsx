import type {ReactElement} from 'react';
import {Field,Input,Select,Textarea} from '../../../ui/index.ts';
import type {ProductQuoteHeaderInputs,ProductQuoteLineInputs} from './quote-form.ts';
import type {ProductQuoteFieldError} from './quote-inputs.ts';

type HeaderProps={value:ProductQuoteHeaderInputs;error:ProductQuoteFieldError|null;disabled:boolean;onChange:(value:ProductQuoteHeaderInputs)=>void};
export function QuoteHeaderFields({value,error,disabled,onChange}:HeaderProps):ReactElement {
 const change=(key:keyof ProductQuoteHeaderInputs,next:string)=>onChange({...value,[key]:next});
 return <div className="quote-admin-grid">
  <Field label="tax (USD)" error={error?.field==='taxAmount'?error.message:undefined} hint="leave unknown amounts blank; enter 0 only when checked"><Input inputMode="decimal" value={value.taxAmount} disabled={disabled} onChange={e=>change('taxAmount',e.target.value)}/></Field>
  <Field label="tax checked on"><Input type="date" value={value.taxCheckedOn} disabled={disabled} onChange={e=>change('taxCheckedOn',e.target.value)}/></Field>
  <Field label="shipping (USD)" error={error?.field==='shippingAmount'?error.message:undefined}><Input inputMode="decimal" value={value.shippingAmount} disabled={disabled} onChange={e=>change('shippingAmount',e.target.value)}/></Field>
  <Field label="shipping checked on"><Input type="date" value={value.shippingCheckedOn} disabled={disabled} onChange={e=>change('shippingCheckedOn',e.target.value)}/></Field>
  <Field label="service allocation"><Select value={value.serviceChoice} disabled={disabled} onValueChange={v=>change('serviceChoice',v)} options={[{value:'unknown',label:'not recorded'},{value:'product_only',label:'products only · no service amount'},...(value.serviceChoice==='recorded_service'?[{value:'recorded_service',label:'retain recorded service amount'}]:[])]}/></Field>
  <Field label="quote note"><Textarea value={value.note} maxLength={4000} disabled={disabled} onChange={e=>change('note',e.target.value)}/></Field>
  {error&&!['taxAmount','shippingAmount'].includes(error.field)?<p className="shelv-field-error" role="alert">{error.message}</p>:null}
 </div>;
}

type LineProps={value:ProductQuoteLineInputs;error:ProductQuoteFieldError|undefined;disabled:boolean;onChange:(value:ProductQuoteLineInputs)=>void};
/** Published identity is selected outside this sheet through the actual parent
 * picker. Raw product/publication/address identifiers are never form fields. */
export function QuoteLineFields({value,error,disabled,onChange}:LineProps):ReactElement {
 const change=(key:keyof ProductQuoteLineInputs,next:string)=>onChange({...value,[key]:next});
 const input=(key:keyof ProductQuoteLineInputs,label:string,type:'text'|'date'|'url'='text',hint?:string)=><Field key={key} label={label} hint={hint} error={error?.field===key?error.message:undefined}><Input type={type} inputMode={['unitPrice','returnCostAmount'].includes(key)?'decimal':key==='quantity'||key.endsWith('Days')?'numeric':undefined} value={value[key]} maxLength={4000} disabled={disabled} onChange={e=>change(key,e.target.value)}/></Field>;
 const select=(key:keyof ProductQuoteLineInputs,label:string,options:readonly {value:string;label:string;disabled?:boolean}[])=><Field label={label} error={error?.field===key?error.message:undefined}><Select value={value[key]} disabled={disabled} options={options} onValueChange={v=>change(key,v)}/></Field>;
 return <div className="quote-admin-stack">
  <fieldset className="quote-admin-fields"><legend>retailer and price</legend><div className="quote-admin-grid">
   {input('quantity','quantity')}{input('retailer','retailer')}{input('seller','seller')}{input('fulfiller','fulfilled by','text','leave blank when unknown')}{input('sourceUrl','item source link','url')}{input('checkedOn','item checked on','date')}{input('unitPrice','unit price (USD)','text','record the retailer price without a shelv markup')}{input('unitPriceCheckedOn','price checked on','date')}
  </div></fieldset>
  <fieldset className="quote-admin-fields"><legend>checked return terms</legend><div className="quote-admin-grid">
   {input('policySourceUrl','return policy source link','url')}{input('policyCheckedOn','policy checked on','date')}
   <Field label="return terms summary"><Textarea value={value.policySummary} maxLength={4000} disabled={disabled} onChange={e=>change('policySummary',e.target.value)}/></Field>
   {select('openedAllowed','opened products',[{value:'unknown',label:'not checked'},{value:'yes',label:'allowed by these terms'},{value:'no',label:'not allowed by these terms'}])}
   {select('deadline','return window',[{value:'unknown',label:'not checked'},{value:'final_sale',label:'final sale'},{value:'absolute',label:'exact return deadline'},{value:'relative',label:'days from purchase or delivery'}])}
   {value.deadline==='absolute'?<>{input('returnBy','return by','date')}{select('shipByKind','separate ship-by deadline',[{value:'unknown',label:'not checked'},{value:'none',label:'no separate deadline'},{value:'date',label:'exact date'}])}{value.shipByKind==='date'?input('shipBy','ship by','date'):null}</>:null}
   {value.deadline==='relative'?<>{input('relativeDays','return window in days')}{select('relativeAnchor','window starts from',[{value:'unknown',label:'not checked'},{value:'purchase',label:'actual purchase date'},{value:'delivery',label:'actual confirmed delivery'}])}{select('shipWithinKind','separate shipping window',[{value:'unknown',label:'not checked'},{value:'none',label:'no separate window'},{value:'days',label:'number of days'}])}{value.shipWithinKind==='days'?input('shipWithinDays','ship within days'):null}</>:null}
   {select('returnCost','return shipping cost',[{value:'unknown',label:'not checked'},{value:'known',label:'checked amount'},{value:'client_pays',label:'client pays under these terms'},...(value.deadline==='final_sale'||value.returnCost==='not_applicable'?[{value:'not_applicable',label:'not applicable · final sale',disabled:value.deadline!=='final_sale'}]:[])])}
   {value.returnCost==='known'?input('returnCostAmount','return shipping cost (USD)'):null}{value.returnCost==='client_pays'?input('returnCostDescription','client-paid cost terms'):null}
  </div></fieldset>
  {error?<p className="shelv-field-error" role="alert">{error.message}</p>:null}
 </div>;
}
