import type { ConciergeRecommendation } from './ConciergePortal.ts';
import type { IntakePresentation, Presentation, Step } from './ConciergePresentation.ts';
import { readArray, readDate, readIdentifier, readInteger, readObject, readText, requireValue } from './ConciergePortalValidation.ts';

export const ingredientGuideKeys = ['niacinamide','ceramide_np','ceramide_ap','ceramide_eop','glycerin','hyaluronic_acid','sodium_hyaluronate','squalane','dimethicone','ceramide_ng','ceramide_as','cetearyl-alcohol','stearyl-alcohol','potassium-phosphate','ceramide-np','ceramide-ap','ceramide-eop','carbomer','glyceryl-stearate','behentrimonium-methosulfate','sodium-lauroyl-lactylate','sodium-hyaluronate','cholesterol','phenoxyethanol','disodium-edta','dipotassium-phosphate','tocopherol','phytosphingosine','xanthan-gum','cetyl-alcohol','polysorbate-20','ethylhexylglycerin','ceramides'];
type Shape = {type:string;optional?:boolean;nullable?:boolean;max?:number;min?:number;empty?:boolean;values?:readonly (string|number)[];fields?:Record<string,Shape>;item?:Shape;unique?:boolean};
const text=(max:number,empty=false):Shape=>({type:'text',max,empty});
const nullable=(s:Shape):Shape=>({...s,nullable:true});
const object=(fields:Record<string,Shape>):Shape=>({type:'object',fields});
const array=(item:Shape,max=12,min=0,unique=false):Shape=>({type:'array',item,max,min,unique});
const id:Shape={type:'identifier'}, date:Shape={type:'date'}, url:Shape={type:'url'};
const source=object({label:text(200),url});
const section=object({title:text(200),body:text(4000)});
const price=object({cents:{type:'integer',min:0,max:100000000},currency:{type:'enum',values:['USD']},sourceUrl:nullable(url),checkedOn:nullable(date),illustrative:{type:'boolean'}});
const product=object({id,name:text(200),brand:nullable(text(100)),variant:nullable(text(200)),sizeLabel:text(120,true),productUrl:nullable(url),imageUrl:nullable({type:'image'}),reference:nullable(text(1000)),displayPrice:nullable(price),sourceLabel:{...text(200),optional:true}});
const usage=object({periods:array({type:'enum',values:['morning','evening']},2,1,true),order:{type:'integer',min:1,max:50},short:object({morning:nullable(text(2000)),evening:nullable(text(2000))}),instructions:array(text(2000),12,1)});
const guide=object({id,productId:nullable(id),title:text(200),intro:text(4000,true),steps:array(object({title:nullable(text(200)),body:text(4000)})),careNote:nullable(text(4000)),sources:array(source)});
const comparison=object({label:text(200),currentText:text(4000),proposedText:text(4000),significance:text(4000),ingredientGuideKey:nullable({type:'enum',values:ingredientGuideKeys}),guideNote:nullable(text(4000)),sources:array(source)});
const fact=object({title:text(200),body:text(4000),ingredientGuideKey:nullable({type:'enum',values:ingredientGuideKeys}),sources:array(source)});
export const stepShape=object({id,kind:{type:'enum',values:['product','instruction']},slot:nullable(id),productId:nullable(id),product:nullable(product),title:text(200),usage});
const card=object({id,slot:id,kind:{type:'enum',values:['replace','keep','finish_then_replace','no_addition','addition','optional_alternative','pause','leave_out']},recommendationId:nullable(id),title:text(200),subtitle:text(200,true),rationaleTitle:text(200),reasons:array(section,12,1),actions:array(text(2000)),currentProduct:nullable(product),proposedProduct:nullable(product),usage:nullable(usage),comparisons:array(comparison),factsTitle:text(200),facts:array(fact),how:guide,sources:array(source),group:{...id,optional:true},decisionLabels:{...object({current:text(120),proposed:text(120)}),optional:true}});
export const intakePresentationShape=object({schemaVersion:{type:'enum',values:[2]},consultationSections:array(section),baselineRoutine:array(stepShape,50),currentProductsStatus:{type:'enum',values:['none','recorded'],optional:true}});
const routineBasis=object({products:array(object({slot:id,productId:id,source:object({kind:{type:'enum',values:['baseline','activation']},publicationVersion:{type:'integer',min:1,max:9007199254740991},recommendationId:nullable(id)})}),50)});
export const presentationShape=object({schemaVersion:{type:'enum',values:[2]},title:text(200),summary:text(4000,true),preparedBy:text(200),preparedOn:nullable(date),sources:array(source),consultationSections:array(section),categoryCards:array(card,50),routineBasis:{...routineBasis,optional:true},baselineRoutine:array(stepShape,50),currentProductsStatus:{type:'enum',values:['none','recorded'],optional:true},routineGuides:array(guide)});

/** No fetching or DNS resolution. Require a public DNS-form host; reject all IP
 * literals/ambiguous numerical hosts as well as local suffixes and credentials. */
export function readPresentationUrl(value:unknown,image=false):string {
 const s=readText(value,2048);
 if(image && /^assets\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:jpg|jpeg|png|webp)$/.test(s))return s;
 requireValue(!/[\s\\\u0000-\u001f\u007f]/u.test(s) && /^https:\/\//.test(s));
 const host=/^https:\/\/([^/?#]+)(?:[/?#]|$)/.exec(s)?.[1];
 requireValue(host && !host.includes('@') && /^(?=.{1,259}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}(?::[0-9]{1,5})?$/.test(host));
 const name=host.split(':')[0]!.toLowerCase();
 requireValue(name.length<=253&&!/(?:^|\.)(?:localhost|local|internal|lan|home|test|invalid)$/.test(name));
 requireValue(!/(?:^|\.)xn--/i.test(name));
 let parsed:URL;try{parsed=new URL(s);}catch{throw new Error('invalid_input');}
 requireValue(!parsed.username&&!parsed.password&&parsed.protocol==='https:');
 requireValue(!s.replace(/%[0-9a-f]{2}/gi,'').includes('%'));
 const decoded=s.replace(/%([0-9a-f]{2})/gi,(_,hex:string)=>{const n=Number.parseInt(hex,16);return n<128?String.fromCharCode(n):'%'+hex;}).toLowerCase();
 requireValue(!/\/\.{1,2}(?:\/|[?#]|$)/.test(decoded)&&!decoded.includes('\u0000')&&!/\/storage\/v1\/(?:object|render\/image)\/(?:sign|authenticated)(?:\/|[?#])|concierge-(?:checkin-photos|payment-evidence)|customer-skin-photos|[?&#](?:token|access_token|authorization|apikey|signature|sig|x-amz-[a-z-]+|x-goog-[a-z-]+)=/.test(decoded));
 return s;
}
export function readPresentationShape(value:unknown,s:Shape):unknown {
 if(value===null&&s.nullable)return null;
 switch(s.type){
  case 'object':{const v=readObject(value),fields=s.fields!;requireValue(Object.keys(v).every(k=>Object.hasOwn(fields,k))&&Object.entries(fields).every(([k,shape])=>shape.optional||Object.hasOwn(v,k)));return Object.fromEntries(Object.entries(fields).filter(([k,shape])=>!shape.optional||v[k]!==undefined).map(([k,shape])=>[k,readPresentationShape(v[k],shape)]));}
  case 'array':{const a=readArray(value,s.max);requireValue(a.length>=(s.min??0));if(s.unique)requireValue(new Set(a).size===a.length);return a.map(v=>readPresentationShape(v,s.item!));}
  case 'text':{const v=readText(value,s.max!,s.empty);requireValue(!/<[^>]*>/u.test(v));return v;}
  case 'identifier':return readIdentifier(value);
  case 'integer':return readInteger(value,s.min,s.max);
  case 'date':return readDate(value);
  case 'url':return readPresentationUrl(value);
  case 'image':return readPresentationUrl(value,true);
  case 'boolean':requireValue(typeof value==='boolean');return value;
  case 'enum':requireValue(s.values!.includes(value as string|number));return value;
  default:throw new Error('invalid_input');
 }
}
function validateSteps(steps:Step[],baseline:{slot:string;productId:string}[]|undefined,status:unknown):void {
 requireValue(new Set(steps.map(x=>x.id)).size===steps.length);
 const products=steps.filter(s=>s.kind==='product');requireValue(products.length===0?status==='none':status!=='none');requireValue(new Set(products.map(s=>s.slot)).size===products.length);
 for(const s of steps)requireValue(s.kind==='instruction'?s.slot===null&&s.productId===null&&s.product===null:s.slot!==null&&s.productId!==null&&s.product?.id===s.productId);
 if(baseline)requireValue(products.length===baseline.length&&baseline.every(b=>products.some(s=>s.slot===b.slot&&s.productId===b.productId)));
}
export function readIntakePresentation(value:unknown,baseline?:{slot:string;productId:string}[]):IntakePresentation {
 const p=readPresentationShape(value,intakePresentationShape) as IntakePresentation;validateSteps(p.baselineRoutine,baseline,p.currentProductsStatus);return p;
}
export function readPresentation(value:unknown,recs?:ConciergeRecommendation[],baseline?:{slot:string;productId:string}[]):Presentation {
 const p=readPresentationShape(value,presentationShape) as Presentation;validateSteps(p.baselineRoutine,baseline,p.currentProductsStatus);
 if(p.routineBasis){validateSteps(p.baselineRoutine,p.routineBasis.products,p.currentProductsStatus);requireValue(new Set(p.routineBasis.products.map(x=>x.slot)).size===p.routineBasis.products.length);for(const b of p.routineBasis.products)requireValue(b.source.kind==='baseline'?b.source.recommendationId===null:b.source.recommendationId!==null);}
 requireValue(p.baselineRoutine.length+p.categoryCards.filter(c=>c.kind==='addition').length<=50);
 requireValue(new Set(p.categoryCards.map(c=>c.id)).size===p.categoryCards.length&&new Set(p.categoryCards.map(c=>c.slot)).size===p.categoryCards.length);
 const bound=p.categoryCards.filter(c=>c.recommendationId!==null);requireValue(new Set(bound.map(c=>c.recommendationId)).size===bound.length);
 const baselineProducts=new Map(p.baselineRoutine.filter(s=>s.kind==='product').map(s=>[s.slot,s.productId]));
 const products=new Set(p.baselineRoutine.flatMap(s=>s.productId?[s.productId]:[]));
 for(const c of p.categoryCards){
  if(c.currentProduct===null&&(c.kind==='addition'||p.currentProductsStatus!==undefined||p.routineBasis))requireValue(c.comparisons.length===0);
  if(c.kind==='addition')requireValue(c.currentProduct===null&&!baselineProducts.has(c.slot)&&!p.baselineRoutine.some(s=>s.id===c.id)&&c.proposedProduct!==null&&c.usage!==null&&c.recommendationId!==null&&c.proposedProduct.displayPrice!==null);
  else if(c.kind==='optional_alternative')requireValue(c.currentProduct!==null&&baselineProducts.get(c.slot)===c.currentProduct.id&&c.proposedProduct!==null&&c.usage!==null);
  else if(c.kind==='pause'||c.kind==='leave_out')requireValue(c.currentProduct!==null&&c.recommendationId===null&&c.usage===null&&(c.kind!=='leave_out'||c.proposedProduct===null));
  else if(c.kind==='no_addition')requireValue(c.recommendationId===null&&c.currentProduct===null&&c.proposedProduct===null&&c.usage===null);
  else {
   requireValue(c.currentProduct!==null&&c.usage!==null);
   if(c.kind==='keep')requireValue(c.recommendationId===null&&c.proposedProduct===null);
   else requireValue(c.proposedProduct!==null&&(c.kind!=='replace'||c.recommendationId!==null));
   requireValue(baselineProducts.get(c.slot)===c.currentProduct.id);
  }
  if(c.recommendationId!==null){requireValue(['replace','finish_then_replace','addition','optional_alternative'].includes(c.kind));if(c.kind==='addition'||c.kind==='optional_alternative')requireValue(c.proposedProduct?.displayPrice!==null&&c.proposedProduct?.displayPrice!==undefined);}
  if(c.currentProduct)products.add(c.currentProduct.id);if(c.proposedProduct)products.add(c.proposedProduct.id);
 }
 for(const g of [...p.routineGuides,...p.categoryCards.map(c=>c.how)])requireValue(g.productId===null||products.has(g.productId));
 if(recs){requireValue(bound.length===recs.length);for(const r of recs){const c=bound.find(c=>c.recommendationId===r.id);requireValue(c&&c.slot===r.slot&&(c.currentProduct?.id??null)===r.currentProductId&&c.proposedProduct?.id===r.proposedProductId&&c.usage);if(c.proposedProduct.displayPrice)requireValue(c.proposedProduct.displayPrice.cents===r.priceCents);}}
 return p;
}
