import {co,readCommerceShape} from '../../../../../../src/contracts/PortalCommerceValidation.ts';
import {ProductQuoteInputError,productQuoteHeaderFields,productQuoteLineFields,productQuoteHeaderInputs,productQuoteLineInputs,productQuoteHeaderFromInputs,productQuoteLineFromInputs,readProductQuoteHeaderInputs,readProductQuoteLineInputs} from './quote-form.ts';
import type {ProductQuoteHeaderInputs,ProductQuoteLineInputs} from './quote-form.ts';
import type {ProductQuotePreparation} from './types.ts';

export type ProductQuoteInputs={header:ProductQuoteHeaderInputs;lines:Record<string,ProductQuoteLineInputs>};
export type ProductQuoteFieldError={field:string;message:string};
export type ProductQuoteInputErrors={header:ProductQuoteFieldError|null;lines:Record<string,ProductQuoteFieldError>};
const noErrors=():ProductQuoteInputErrors=>({header:null,lines:{}});
export function productQuoteInputs(preparation:ProductQuotePreparation):ProductQuoteInputs {
 return {header:productQuoteHeaderInputs(preparation.body),lines:Object.fromEntries(preparation.lines.map(line=>[line.lineId,productQuoteLineInputs(line)]))};
}
export function readProductQuoteInputs(value:unknown,preparation:ProductQuotePreparation):ProductQuoteInputs {
 const stringShape={type:'text' as const,max:4000,empty:true};
 const header=co(Object.fromEntries(productQuoteHeaderFields.map(field=>[field,stringShape]))),line=co(Object.fromEntries(productQuoteLineFields.map(field=>[field,stringShape])));
 return readCommerceShape<ProductQuoteInputs>(value,co({header,lines:co(Object.fromEntries(preparation.lines.map(item=>[item.lineId,line])))}));
}
function problem(error:unknown):ProductQuoteFieldError {
 return error instanceof ProductQuoteInputError?{field:error.field,message:'check the exact amount, date or source entered for this field'}:{field:'form',message:'check the quote fields before saving'};
}
export function parseProductQuoteInputs(preparation:ProductQuotePreparation,value:ProductQuoteInputs){
 const inputs=readProductQuoteInputs(value,preparation),errors=noErrors();let body=preparation.body;
 try{body=productQuoteHeaderFromInputs(body,inputs.header);}catch(error){errors.header=problem(error);}
 const lines=preparation.lines.map(line=>{
  try{return productQuoteLineFromInputs(line,inputs.lines[line.lineId]!);}
  catch(error){errors.lines={...errors.lines,[line.lineId]:problem(error)};return line;}
 });
 return {preparation:{body,lines},inputs,errors};
}
export function productQuoteHasInputErrors(errors:ProductQuoteInputErrors):boolean{return errors.header!==null||Object.keys(errors.lines).length>0;}
/** Keep half-typed fields unless an explicit DTO edit changed that very field.
 * Picker identity/publication/address metadata cannot erase unrelated typing. */
export function rebaseProductQuoteInputs(previous:ProductQuotePreparation,inputs:ProductQuoteInputs,next:ProductQuotePreparation):ProductQuoteInputs {
 const old=productQuoteInputs(previous),fresh=productQuoteInputs(next);
 const header=Object.fromEntries(productQuoteHeaderFields.map(field=>[field,old.header[field]===fresh.header[field]?inputs.header[field]:fresh.header[field]])) as ProductQuoteHeaderInputs;
 const lines=Object.fromEntries(next.lines.map(line=>{
  const before=old.lines[line.lineId],raw=inputs.lines[line.lineId],after=fresh.lines[line.lineId]!;
  if(!before||!raw)return [line.lineId,after];
  return [line.lineId,Object.fromEntries(productQuoteLineFields.map(field=>[field,before[field]===after[field]?raw[field]:after[field]]))];
 })) as Record<string,ProductQuoteLineInputs>;
 return {header:readProductQuoteHeaderInputs(header),lines:Object.fromEntries(Object.entries(lines).map(([id,line])=>[id,readProductQuoteLineInputs(line)]))};
}
