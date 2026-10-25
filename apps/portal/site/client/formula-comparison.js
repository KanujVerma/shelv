import {productFormula} from './formula-data.js';
import {ingredientLookupKey} from './ingredient-library.js';

// Public product-pair data, shared by every client and every purchase decision.
const profiles={
 'cerave-pm|vanicream-daily':{
  ingredients:[['Niacinamide','niacinamide','Niacinamide is listed in CeraVe PM and not in Vanicream’s listed formula.'],['Squalane','squalane','Squalane is listed in Vanicream and not in CeraVe PM’s listed formula.'],['Ceramides','ceramides','Both contain ceramides. More types do not establish better performance.']],
  context:[],
 },
 'cerave-pm|neutrogena-hydro-boost-water-cream-6806486':{
  ingredients:[['Niacinamide','niacinamide','Niacinamide is one ingredient you would remove with this switch.'],['Ceramides','ceramides','Both contain ceramides; the number of types does not establish better performance.'],['Urea','urea','Urea is listed in this Water Cream and not in CeraVe PM.']],
  context:[{title:'Texture',body:'CeraVe PM is a lightweight lotion; Hydro Boost Water Cream has a different cream texture. The ingredient lists do not establish which will feel better for you.'}],
 },
 'cerave-hydrating-cleanser|aveeno-soothing-oat-cleanser':{
  ingredients:[['Ceramides','ceramides','CeraVe lists ceramides; Aveeno’s listed formula does not. This does not establish which cleanser will feel more comfortable.'],['Coco-Glucoside','coco-glucoside','Aveeno lists coco-glucoside as part of its cleansing system.'],['Sodium Cocoyl Glutamate','sodium-cocoyl-glutamate','Aveeno also lists this cleansing ingredient; CeraVe uses a different cleansing system.']],
  context:[{title:'Texture',body:'CeraVe is creamy and non-foaming; Aveeno is a foaming gel. Neither ingredient list establishes greater gentleness.'}],
 },
 'bioderma-sensibio-h2o|cerave-makeup-removing-balm':{
  ingredients:[['PEG-6 Caprylic/Capric Glycerides','peg-6-caprylic-capric-glycerides','Bioderma lists this ingredient in its water-based micellar formula.'],['Ethylhexyl Palmitate','ethylhexyl-palmitate','CeraVe lists this ingredient in its oil-rich balm.'],['Ceramides','ceramides','The balm lists ceramides; Bioderma’s listed formula does not. Their presence does not establish better makeup removal.']],
  context:[{title:'Removal method',body:'Use Bioderma with a well-soaked soft pad. The balm is massaged onto dry skin, mixed with water and rinsed off. Use one makeup remover, then your cleanser.'}],
 },
};
const genericLabels=new Set(['texture','moisturizing ingredients','cleansing base','other ingredients','removal method','hydration & feel','barrier lipids']);
const ceramideTypes=['NP','AP','EOP','NG','AS','EOS','NS'];
function presence(record,key,label){
 if(key==='ceramides'){
  const types=ceramideTypes.filter(type=>record.ingredients.some(name=>ingredientLookupKey(name)===ingredientLookupKey('Ceramide '+type)));
  return types.length?`${types.length} ${types.length===1?'type':'types'}\n${types.slice(0,3).join(' · ')}${types.length>3?'\n'+types.slice(3).join(' · '):''}`:'Not in listed formula';
 }
 return record.ingredients.some(name=>ingredientLookupKey(name)===ingredientLookupKey(label))?'Contains it':'Not in listed formula';
}
export function formulaComparison(card){
 const authored=Array.isArray(card?.comparisons)?card.comparisons:[],current=productFormula(card?.currentProduct),proposed=productFormula(card?.proposedProduct);
 const profile=current?.status==='verified'&&proposed?.status==='verified'?profiles[current.key+'|'+proposed.key]:null;
 if(profile){
  const rows=profile.ingredients.map(([label,ingredientKey,significance])=>{
   const prior=authored.find(row=>ingredientLookupKey(row.label)===ingredientLookupKey(label)||row.ingredientGuideKey===ingredientKey);
   return {...prior,label,ingredientKey,currentText:prior?.currentText||presence(current,ingredientKey,label),proposedText:prior?.proposedText||presence(proposed,ingredientKey,label),significance:prior?.significance||significance};
  });
  return {rows,context:profile.context};
 }
 return {rows:authored.filter(row=>row.ingredientGuideKey||!genericLabels.has(ingredientLookupKey(row.label))),context:authored.filter(row=>!row.ingredientGuideKey&&genericLabels.has(ingredientLookupKey(row.label))).map(row=>({title:row.label,body:[row.currentText,row.proposedText,row.significance].filter(Boolean).join(' · ')}))};
}
