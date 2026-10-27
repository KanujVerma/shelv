/** Browser preflight for the frozen R2 content port. The server remains authoritative. */
export const ingredientGuideKeys=new Set(['ceramides','behentrimonium-methosulfate','carbomer','ceramide-ap','ceramide-eop','ceramide-np','ceramide_ap','ceramide_as','ceramide_eop','ceramide_ng','ceramide_np','cetearyl-alcohol','cetyl-alcohol','cholesterol','dimethicone','dipotassium-phosphate','disodium-edta','ethylhexylglycerin','glycerin','glyceryl-stearate','hyaluronic_acid','niacinamide','phenoxyethanol','phytosphingosine','polysorbate-20','potassium-phosphate','sodium-hyaluronate','sodium-lauroyl-lactylate','sodium_hyaluronate','squalane','stearyl-alcohol','tocopherol','xanthan-gum']);
const identifier=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value)&&!['constructor','prototype','__proto__'].includes(value);
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&value>='1900-01-01'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
/** Mirrors core's public-content URL policy; never fetches or resolves DNS. */
export function safeContentUrl(value,{image=false}={}){
 if(typeof value!=='string'||!value.trim()||Array.from(value).length>2048)return null;
 if(image&&/^assets\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:jpg|jpeg|png|webp)$/.test(value))return value;
 if(/[\s\\\u0000-\u001f\u007f]/u.test(value)||!/^https:\/\//.test(value))return null;
 const host=/^https:\/\/([^/?#]+)(?:[/?#]|$)/.exec(value)?.[1];
 if(!host||host.includes('@')||!/^(?=.{1,259}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}(?::[0-9]{1,5})?$/.test(host))return null;
 const name=host.split(':')[0].toLowerCase();
 if(name.length>253||/(?:^|\.)(?:localhost|local|internal|lan|home|test|invalid)$/.test(name)||/(?:^|\.)xn--/i.test(name))return null;
 try{const url=new URL(value);if(url.username||url.password||url.protocol!=='https:')return null;}catch{return null;}
 if(value.replace(/%[0-9a-f]{2}/gi,'').includes('%'))return null;
 const decoded=value.replace(/%([0-9a-f]{2})/gi,(_,hex)=>{const n=Number.parseInt(hex,16);return n<128?String.fromCharCode(n):'%'+hex;}).toLowerCase();
 if(/\/\.{1,2}(?:\/|[?#]|$)/.test(decoded)||decoded.includes('\u0000')||/\/storage\/v1\/(?:object|render\/image)\/(?:sign|authenticated)(?:\/|[?#])|concierge-(?:checkin-photos|payment-evidence)|customer-skin-photos|[?&#](?:token|access_token|authorization|apikey|signature|sig|x-amz-[a-z-]+|x-goog-[a-z-]+)=/.test(decoded))return null;
 return value;
}
const text=(max,empty=false)=>({type:'text',max,empty}),integer=(min,max)=>({type:'integer',min,max}),oneOf=(...values)=>({type:'enum',values}),object=fields=>({type:'object',fields}),array=(item,min=0,max=12)=>({type:'array',item,min,max}),nullable=rule=>({...rule,nullable:true});
const id={type:'id'},url={type:'url'},date={type:'date'},ingredient={type:'ingredient'};
const source=object({label:text(200),url});
const section=object({title:text(200),body:text(4000)});
const price=object({cents:integer(0,100000000),currency:oneOf('USD'),sourceUrl:nullable(url),checkedOn:nullable(date),illustrative:{type:'boolean'}});
const product=object({id,name:text(200),brand:nullable(text(100)),variant:nullable(text(200)),sizeLabel:text(120,true),productUrl:nullable(url),imageUrl:nullable({type:'image'}),reference:nullable(text(1000)),displayPrice:nullable(price),sourceLabel:{...text(200),optional:true}});
const usage=object({periods:array(oneOf('morning','evening'),1,2),order:integer(1,50),short:object({morning:nullable(text(2000)),evening:nullable(text(2000))}),instructions:array(text(2000),1,12)});
const guide=object({id,productId:nullable(id),title:text(200),intro:text(4000,true),steps:array(object({title:nullable(text(200)),body:text(4000)})),careNote:nullable(text(4000)),sources:array(source)});
const comparison=object({label:text(200),currentText:text(4000),proposedText:text(4000),significance:text(4000),ingredientGuideKey:nullable(ingredient),guideNote:nullable(text(4000)),sources:array(source)});
const fact=object({title:text(200),body:text(4000),ingredientGuideKey:nullable(ingredient),sources:array(source)});
const step=object({id,kind:oneOf('product','instruction'),slot:nullable(id),productId:nullable(id),product:nullable(product),title:text(200),usage});
const card=object({id,slot:id,kind:oneOf('replace','keep','finish_then_replace','no_addition','addition','optional_alternative','pause','leave_out'),recommendationId:nullable(id),title:text(200),subtitle:text(200,true),rationaleTitle:text(200),reasons:array(section,1,12),actions:array(text(2000)),currentProduct:nullable(product),proposedProduct:nullable(product),usage:nullable(usage),comparisons:array(comparison),factsTitle:text(200),facts:array(fact),how:guide,sources:array(source),group:{...id,optional:true},decisionLabels:{...object({current:text(120),proposed:text(120)}),optional:true}});
const intakeSchema=object({schemaVersion:oneOf(2),consultationSections:array(section),baselineRoutine:array(step,0,50),currentProductsStatus:{...oneOf('none','recorded'),optional:true}});
const routineBasis=object({products:array(object({slot:id,productId:id,source:object({kind:oneOf('baseline','activation'),publicationVersion:integer(1,9007199254740991),recommendationId:nullable(id)})}),0,50)});
const schema=object({schemaVersion:oneOf(2),title:text(200),summary:text(4000,true),preparedBy:text(200),preparedOn:nullable(date),sources:array(source),consultationSections:array(section),categoryCards:array(card,0,50),routineBasis:{...routineBasis,optional:true},baselineRoutine:array(step,0,50),currentProductsStatus:{...oneOf('none','recorded'),optional:true},routineGuides:array(guide)});
function check(rule,value,path,errors){
 if(rule.optional&&value===undefined)return;
 if(rule.nullable&&value===null)return;
 const fail=message=>errors.push(`${path}: ${message}`);
 switch(rule.type){
  case 'object':if(!plain(value)){fail('complete these fields');return;}if(Object.keys(value).some(key=>!Object.hasOwn(rule.fields,key)))fail('unsupported field');for(const [key,child] of Object.entries(rule.fields))check(child,value[key],`${path}.${key}`,errors);return;
  case 'array':if(!Array.isArray(value)||value.length<rule.min||value.length>rule.max){fail(`use ${rule.min}–${rule.max} entries`);return;}value.forEach((item,index)=>check(rule.item,item,`${path}[${index+1}]`,errors));return;
  case 'text':if(typeof value!=='string'||Array.from(value).length>rule.max||!rule.empty&&!value.trim())fail(`enter ${rule.empty?'at most':'1–'}${rule.max} characters`);return;
  case 'integer':if(!Number.isSafeInteger(value)||value<rule.min||value>rule.max)fail(`enter a whole number ${rule.min}–${rule.max}`);return;
  case 'enum':if(!rule.values.includes(value))fail('choose a supported value');return;
  case 'id':if(!identifier(value))fail('use a valid stable identifier');return;
  case 'boolean':if(typeof value!=='boolean')fail('choose true or false');return;
  case 'date':if(!validDate(value))fail('enter a valid YYYY-MM-DD date');return;
  case 'url':case 'image':if(!safeContentUrl(value,{image:rule.type==='image'}))fail(rule.type==='image'?'use a safe HTTPS image or recovered asset path':'use a public HTTPS URL without credentials');return;
  case 'ingredient':if(!ingredientGuideKeys.has(value))fail('choose an existing ingredient guide');return;
 }
}
function unique(items,key,path,errors){const values=items.map(item=>item?.[key]);if(new Set(values).size!==values.length)errors.push(`${path}: ${key} must be unique`);}
export function validatePresentation(value,{kind='plan',baseline=null,recommendations=null}={}){
 const errors=[];check(kind==='intake'?intakeSchema:schema,value,kind==='intake'?'consultation content':'plan content',errors);
 if(!plain(value))return errors;
 const steps=Array.isArray(value.baselineRoutine)?value.baselineRoutine:[],cards=Array.isArray(value.categoryCards)?value.categoryCards:[];
 if(steps.some(s=>s?.kind==='product')?value.currentProductsStatus==='none':value.currentProductsStatus!=='none')errors.push('current products: explicitly confirm no products or record the current products from the consultation');
 if(steps.length+cards.filter(c=>c?.kind==='addition').length>50)errors.push('active routine: baseline and additions must fit within 50 steps');
 unique(steps,'id','baseline routine',errors);unique(steps.filter(s=>s?.kind==='product'),'slot','baseline routine',errors);unique(cards,'id','category cards',errors);unique(cards,'slot','category cards',errors);
 const baselineProducts=new Map(),productIds=new Set();
 for(const s of steps){if(!plain(s))continue;if(s.usage?.periods&&new Set(s.usage.periods).size!==s.usage.periods.length)errors.push('baseline routine: periods must be unique');if(s.kind==='instruction'){if(s.slot!==null||s.productId!==null||s.product!==null)errors.push('baseline routine: nonproduct instructions cannot create product identities');}else if(s.kind==='product'){if(s.slot===null||!s.product||s.product.id!==s.productId)errors.push('baseline routine: product and category must agree');else{baselineProducts.set(s.slot,s.productId);productIds.add(s.productId);}}}
 if(value.routineBasis?.products){const products=value.routineBasis.products;if(Array.isArray(products)){unique(products,'slot','routine basis',errors);for(const b of products)if(b.source?.kind==='baseline'?b.source.recommendationId!==null:b.source?.recommendationId==null)errors.push('routine basis: retain the actual product source');const expected=products.map(s=>`${s.slot}:${s.productId}`).sort(),actual=[...baselineProducts].map(([slot,pid])=>`${slot}:${pid}`).sort();if(JSON.stringify(expected)!==JSON.stringify(actual))errors.push('routine basis: match each actual current product');}}
 if(baseline){const expected=baseline.map(s=>`${s.slot}:${s.productId}`).sort(),actual=[...baselineProducts].map(([slot,pid])=>`${slot}:${pid}`).sort();if(JSON.stringify(expected)!==JSON.stringify(actual))errors.push('baseline routine: match each authoritative current product exactly once');}
 const bound=[];
 for(const c of cards){if(!plain(c))continue;if(c.currentProduct===null&&(c.kind==='addition'||value.currentProductsStatus!==undefined||value.routineBasis)&&Array.isArray(c.comparisons)&&c.comparisons.length)errors.push('comparisons: a current product is required; use proposed-product facts for an addition');for(const p of [c.currentProduct,c.proposedProduct])if(p?.id)productIds.add(p.id);if(c.usage?.periods&&new Set(c.usage.periods).size!==c.usage.periods.length)errors.push('category usage: periods must be unique');
  if(c.kind==='addition'){if(c.currentProduct!==null||baselineProducts.has(c.slot)||steps.some(step=>step.id===c.id)||!c.proposedProduct||!c.usage||!c.recommendationId||!c.proposedProduct.displayPrice)errors.push('addition card: new product, usage and purchase identity are required without a current product');else bound.push(c);}
  else if(c.kind==='optional_alternative'){if(!c.currentProduct||!c.proposedProduct||!c.usage||baselineProducts.get(c.slot)!==c.currentProduct.id)errors.push('optional alternative: retain the authoritative current product and complete the proposed usage');if(c.recommendationId){bound.push(c);if(!c.proposedProduct?.displayPrice)errors.push('optional alternative: enter the proposed product price');}}
  else if(c.kind==='pause'||c.kind==='leave_out'){if(!c.currentProduct||c.recommendationId!==null||c.usage!==null||c.kind==='leave_out'&&c.proposedProduct!==null)errors.push('paused/reference card: no purchase identity or active usage');}
  else if(c.kind==='no_addition'){if(c.recommendationId!==null||c.currentProduct!==null||c.proposedProduct!==null||c.usage!==null)errors.push('no-addition card: product, usage and purchase identity must be empty');}
  else if(c.kind==='keep'){if(c.recommendationId!==null||!c.currentProduct||c.proposedProduct!==null||baselineProducts.get(c.slot)!==c.currentProduct?.id)errors.push('keep card: retain the authoritative current product without a purchase identity');}
  else if(c.kind==='replace'||c.kind==='finish_then_replace'){if(!c.currentProduct||!c.proposedProduct||!c.usage)errors.push('replacement card: complete both products and usage');if(baselineProducts.get(c.slot)!==c.currentProduct?.id)errors.push('replacement card: match the authoritative current product and category');if(c.kind==='replace'&&!c.recommendationId)errors.push('replacement card: purchase identity is required');if(c.recommendationId){bound.push(c);if(!c.proposedProduct?.displayPrice)errors.push('replacement card: enter the proposed product price');}}
 }
 unique(bound,'recommendationId','purchase recommendations',errors);
 if(recommendations){if(bound.length!==recommendations.length)errors.push('category cards: match every purchase recommendation exactly once');for(const r of recommendations){const c=bound.find(c=>c.recommendationId===r.id);if(!c||c.slot!==r.slot||(c.currentProduct?.id??null)!==r.currentProductId||c.proposedProduct?.id!==r.proposedProductId||c.proposedProduct?.displayPrice&&c.proposedProduct.displayPrice.cents!==r.priceCents)errors.push('category cards: product IDs and displayed price must match the purchase recommendation');}}
 for(const g of [...(Array.isArray(value.routineGuides)?value.routineGuides:[]),...cards.map(c=>c?.how).filter(Boolean)])if(g.productId!==null&&!productIds.has(g.productId))errors.push('usage guide: select a product present in this plan');
 try{if(new TextEncoder().encode(JSON.stringify(value)).length>100000)errors.push('plan content: exceeds the 100,000 byte request limit; shorten the content');}catch{errors.push('plan content: use serializable plain content');}
 return errors;
}
export function deriveRecommendations(value){return (value?.categoryCards||[]).filter(c=>['replace','finish_then_replace','addition','optional_alternative'].includes(c.kind)&&c.recommendationId).map(c=>({id:c.recommendationId,slot:c.slot,currentProductId:c.currentProduct?.id??null,proposedProductId:c.proposedProduct?.id||'',priceCents:c.proposedProduct?.displayPrice?.cents??(c.kind==='optional_alternative'?null:NaN),currency:'USD',rationale:c.reasons?.[0]?.body||''}));}
function project(rule,value){if(rule.optional&&value===undefined)return undefined;if(rule.nullable&&(value===null||value===undefined))return null;if(rule.type==='object')return Object.fromEntries(Object.entries(rule.fields).map(([key,child])=>[key,project(child,plain(value)?value[key]:undefined)]));if(rule.type==='array')return (Array.isArray(value)?value:[]).map(item=>project(rule.item,item));if(rule.type==='url'||rule.type==='image')return safeContentUrl(value,{image:rule.type==='image'});if(value===undefined)return rule.type==='boolean'?false:rule.type==='integer'?0:'';return structuredClone(value);}
export function publicPresentation(value,{kind='plan'}={}){return project(kind==='intake'?intakeSchema:schema,value);}
