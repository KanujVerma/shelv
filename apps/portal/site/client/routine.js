import {productIngredientsMarkup} from './product-ingredients.js';
import {externalArrow} from './ui-icons.js';
import {catalog} from '../advisor/catalog.js';
import {esc,title,safeUrl} from '../advisor/model.js';

// Display directions retained from the approved plan and product-specific guidance.
// Active products always come from the server's routine projection, never approval/payment/receipt.
const usage={
  'cerave-pm':{periods:['morning','evening'],order:20,short:{morning:'Before sunscreen. Apply your usual moisturizer following its label.',evening:'After cleansing. Apply an even layer following its label.'},steps:['Apply your usual moisturizer after cleansing, following the directions on your product’s label.','In the morning, follow with your sunscreen before makeup.']},
  'vanicream-daily':{periods:['morning','evening'],order:20,short:{morning:'Before sunscreen. Apply an even layer while skin is slightly damp.',evening:'After cleansing. Apply an even layer as your final moisturizer.'},steps:['Before full-face use, test a small inner-arm area twice daily for 7–10 days using your normal amount. Stop if it irritates your skin.','After cleansing, gently pat your face and apply an even layer while your skin is slightly damp. Avoid getting it in your eyes.','Use the same moisturizer morning and evening. In the morning, follow with your sunscreen before makeup.','Notice how your cheeks feel later and how your usual sunscreen and makeup wear. Stop if it stings or irritates your skin and let your advisor know.']},
  'cerave-cleanser':{periods:['evening'],order:10,short:{evening:'Cleanse gently, rinse, then pat dry before moisturizer.'},steps:['Use your evening cleanser with lukewarm water, following its label. Use your existing makeup remover first only when needed.','Rinse thoroughly and gently pat dry, then follow with your moisturizer.']},
  'aveeno-cleanser':{periods:['evening'],order:10,short:{evening:'Massage gently with lukewarm water, rinse and pat dry.'},steps:['Introduce Aveeno as your evening cleanser when the previous bottle is finished and the moisturizer change is settled, following its label.','Use lukewarm water, gently massage, then rinse thoroughly and pat dry. Follow with your moisturizer.','Keep your existing makeup remover for heavier makeup that needs it.']},
  'boj-relief-sun':{periods:['morning'],order:30,short:{morning:'Last skincare step, before makeup. Apply generously.'},steps:['After moisturizer, spread a generous, even layer over sun-exposed skin as your final morning skincare step, before makeup.','Reapply at least every two hours outdoors. For swimming or sweating, use a water-resistant sunscreen and follow its label, including after towel drying.']},
};

function reasoning(view,item){
  const publications=[...(view.history||[]),...(view.plan?[view.plan]:[])];
  const activation=(view.routineHistory||[]).filter(a=>a.slot===item.slot&&a.productId===item.productId).slice().sort((a,b)=>b.startedOn.localeCompare(a.startedOn)||b.version-a.version)[0];
  if(activation){const publication=publications.find(p=>p.version===activation.version),recommendation=publication?.recommendations.find(r=>r.id===activation.recommendationId);if(recommendation)return {text:recommendation.rationale,heading:'Why I chose this for you'};}
  for(const publication of publications.slice().reverse()){const recommendation=publication.recommendations.find(r=>r.proposedProductId===item.productId);if(recommendation)return {text:recommendation.rationale,heading:'Why I chose this for you'};}
  const next=view.plan?.recommendations.find(r=>r.currentProductId===item.productId&&r.proposedProductId!==item.productId);
  return next?{text:next.rationale,heading:'Your advisor’s reasoning for the next change'}:null;
}

export function routineSections(view){
  const result={morning:[],evening:[],unplaced:[]};
  for(const item of view.routine||[]){
    const product=catalog[item.productId],directions=usage[item.productId];
    const step={...item,product,usage:directions,reason:reasoning(view,item)};
    if(!product||!directions){result.unplaced.push(step);continue;}
    for(const period of directions.periods)result[period].push(step);
  }
  for(const period of ['morning','evening'])result[period].sort((a,b)=>a.usage.order-b.usage.order||a.slot.localeCompare(b.slot));
  return result;
}

function stepMarkup(step,period){
  const name=step.product?.name||title(step.slot);
  return `<li><button class="routine-product client-routine-product" data-routine-product="${esc(step.productId)}" aria-label="Open ${esc(name)} details">${step.product?.image?`<img src="${esc(step.product.image)}" alt="">`:''}<span><strong>${esc(name)}</strong>${step.product?.size?`<small>${esc(step.product.size)}</small>`:''}</span><span class="client-routine-arrow" aria-hidden="true">${externalArrow}</span></button>${step.usage?.short[period]?`<p>${esc(step.usage.short[period])}</p>`:''}</li>`;
}

export function routineMarkup(view){
  const groups=routineSections(view);
  return `<div class="routine-intro"><h2>Morning & evening</h2></div><div class="daily-grid client-daily-grid">${['morning','evening'].map(period=>`<section aria-labelledby="routine-${period}"><h3 id="routine-${period}">${title(period)}</h3>${groups[period].length?`<ol>${groups[period].map(step=>stepMarkup(step,period)).join('')}</ol>`:'<p class="advisor-subtitle">No steps added yet.</p>'}</section>`).join('')}</div>${groups.unplaced.length?`<section class="advisor-panel client-routine-unplaced"><h3>Directions to confirm</h3><ul>${groups.unplaced.map(step=>stepMarkup(step,'')).join('')}</ul></section>`:''}`;
}

export function routineProductDetail(view,productId){
  const item=(view.routine||[]).find(r=>r.productId===productId);if(!item)return '<h2 tabindex="-1">Product unavailable</h2><p>Reload your current routine to view this product.</p>';
  const product=catalog[productId],directions=usage[productId],reason=reasoning(view,item);
  return `<h2 tabindex="-1">${esc(product?.name||title(item.slot))}</h2>${product?`<div class="client-routine-detail-product"><img src="${esc(product.image)}" alt="${esc(product.name)}"><div><p>${esc(product.size)}</p>${safeUrl(product.url)?`<a class="text-button" href="${esc(product.url)}" target="_blank" rel="noopener noreferrer">Product page ${externalArrow}</a>`:''}</div></div>`:''}<section class="product-how"><h3>How to use it</h3>${directions?`<ol>${directions.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol>`:'<p>Directions are not available for this product yet. Confirm them with your advisor before changing how you use it.</p>'}</section>${reason?`<section class="client-routine-reason"><h3>${esc(reason.heading)}</h3><p>${esc(reason.text).replace(/\n/g,'<br>')}</p></section>`:''}${productIngredientsMarkup({name:product?.name||title(item.slot),productUrl:product?.url},{collapsible:true})}`;
}
