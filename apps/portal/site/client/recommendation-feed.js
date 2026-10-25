import {productIngredientsButton} from './product-ingredients.js';
import {ingredientButton,comparisonTableMarkup} from './ingredient-components.js';
import {esc,money,title,safeUrl} from '../advisor/model.js';
import {catalog} from '../advisor/catalog.js';

export const categories=['moisturizer','cleanser','sunscreen','treatments'];
const lineIcon=name=>`<svg class="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${({check:'<path d="m5 12 5 5L19 7"/>',x:'<path d="m6 6 12 12M18 6 6 18"/>',swap:'<path d="M7 7h10l-3-3M17 17H7l3 3M17 7l-3 3M7 17l3-3"/>',arrow:'<path d="M7 17 17 7M7 7h10v10"/>'})[name]}</svg>`;
const link=(url,label,cls='')=>safeUrl(url)?`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`:'';

/** Reuses the approved product-card structure, with metadata supplied by the plan adapter. */
export function originalProductCard(item,{product=null}={}){
 const replace=item.decision==='REPLACE',optional=item.decision==='OPTIONAL ALTERNATIVE';
 return `<section class="product-card ${replace?'current':optional?'optional':'proposed'}"><div class="product-card-copy"><span class="product-label"><span class="decision-icon" aria-hidden="true">${optional?lineIcon('swap').replace('class="line-icon"','class="line-icon" data-icon="swap"'):lineIcon(replace?'x':'check')}</span> ${esc(item.decision)}</span><div class="product-card-info"><h3>${esc(item.brand||item.name)}</h3><p class="product-variant">${esc(item.variant||'')}</p><p class="product-card-meta">${typeof item.price==='number'?`<strong>${item.priceSource&&safeUrl(item.priceSource)?link(item.priceSource,`$${item.price.toFixed(2)}`):`$${item.price.toFixed(2)}`}</strong>`:''}${item.size?`<span>${esc(item.size)}</span>`:''}${typeof item.price==='number'&&item.priceCheckedOn?`<small class="price-reference">Reference price</small>`:''}</p>${link(item.url,`Product page ${lineIcon('arrow')}<span class="sr-only"> for ${esc(item.name)}</span>`,'product-page-link')}${productIngredientsButton(product||{id:item.id||item.name,name:item.name,productUrl:item.url})}</div></div><div class="product-card-photo">${item.image?`<img src="${esc(item.image)}" alt="${esc(item.name)}">`:''}</div></section>`;
}
function catalogProduct(id,decision,priceCents){
 const p=catalog[id];return p?{decision,brand:p.brand,variant:p.name.startsWith(p.brand)?p.name.slice(p.brand.length).trim():p.name,name:p.name,size:p.size,image:p.image,url:p.url,...(priceCents==null?{}:{price:priceCents/100})}:{decision,name:id,brand:'Product details unavailable',variant:id};
}
function emphasizeReason(value){return esc(value).replace('it keeps stinging and you’ve started skipping it','<strong>it keeps stinging and you’ve started skipping it</strong>').replace('try Vanicream Daily Facial in its place','<strong>try Vanicream Daily Facial in its place</strong>');}
function approvedMatch(item){return item.slot==='moisturizer'&&item.currentProductId==='cerave-pm'&&item.proposedProductId==='vanicream-daily';}
export function formulaMarkup(presentation){
 const meaning=presentation.plan.formulaExplanations;
 return comparisonTableMarkup({currentLabel:'CeraVe PM',proposedLabel:'Vanicream',rows:[
  {label:'Niacinamide',ingredientGuideKey:'niacinamide',currentText:'Contains it',proposedText:'Not in listed formula',significance:meaning.niacinamide},
  {label:'Squalane',ingredientGuideKey:'squalane',currentText:'Not in listed formula',proposedText:'Contains it',significance:meaning.squalane},
  {label:'Ceramides',ingredientGuideKey:'ceramides',currentText:'3 types\nNP · AP · EOP',proposedText:'5 types\nNP · AP · EOP\nNG · AS',significance:meaning.ceramides}
 ]});
}

function recommendationMarkup(item,presentation,readOnly=false){
 const rich=presentation&&approvedMatch(item);
 const current=rich?presentation.current:catalogProduct(item.currentProductId,'REPLACE');
 const proposed=rich?{...presentation.proposed,price:item.priceCents/100}:catalogProduct(item.proposedProductId,'WITH',item.priceCents);
 return `<article class="recommendation" data-plan-recommendation="${esc(item.id)}"><div class="card-heading"><div class="category"><span class="category-mark" aria-hidden="true">◒</span><h2>${esc(title(item.slot))}</h2></div></div><div class="comparison" ${rich?'id="product-comparison"':''}>${originalProductCard(current)}${originalProductCard(proposed)}</div><div class="rationale"><h3>Why I chose this for you</h3><div class="personal-note" ${rich?'id="reason-list"':''}><p>${emphasizeReason(item.rationale)}</p>${rich?`<h4 class="actions-heading">Actions</h4><ul class="consultation-actions">${presentation.plan.actions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</div>${rich?formulaMarkup(presentation):''}</div>${readOnly?'':`<div class="client-decision-footer" data-controls="${esc(item.id)}"></div>`}</article>`;
}
function factsMarkup(item){return `<section class="product-facts"><h3>${esc(item.factsTitle||'What matters for your skin')}</h3>${item.facts.map(f=>`<div class="product-fact">${f.ingredient?ingredientButton(f.ingredient,f.title):`<h4>${esc(f.title)}</h4>`}<p>${esc(f.body)}</p></div>`).join('')}</section>`;}
export function howMarkup(item){return `<section class="product-how"><h3>${esc(item.howTitle)}</h3><ol>${item.how.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>`;}
function sourcesMarkup(item){return `<div class="product-sources">${item.sources.map(x=>link(x.url,`${esc(x.label)} ↗`)).join('')}</div>`;}
function bodyMarkup(item){return `<div class="rationale"><h3>${esc(item.rationaleTitle||(item.key==='treatments'?'Why I’m holding off':'Why I’m keeping this for you'))}</h3><div class="personal-note"><p>${esc(item.reason)}</p></div><h4 class="actions-heading">Actions</h4><ul class="consultation-actions">${item.actions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${factsMarkup(item)}</div>`;}
function heroMarkup(item){
 if(item.nextProduct)return `<div class="product-pair">${originalProductCard({decision:'FINISH THIS',brand:'CeraVe',variant:'Hydrating Facial Cleanser',name:item.name,price:item.price,size:item.size,priceSource:item.priceSource,priceChecked:item.priceChecked,image:item.image,url:item.sources[0].url})}${originalProductCard({...item.nextProduct,decision:'NEXT BOTTLE'})}</div>`;
 if(!item.image)return `<div class="treatment-hero"><span class="keep-label">NO ADDITION</span><h3>${esc(item.name)}</h3></div>`;
 return `<div class="keep-product-wrap">${originalProductCard({brand:'Beauty of Joseon',variant:'Relief Sun · Rice + Niacinamide',size:'SPF50+ PA++++',decision:'KEEP',name:item.name,image:item.image,url:item.sources[0].url})}</div>`;
}

/** Extra approved Alex content must be explicitly supplied by the synthetic adapter. */
export function recommendationFeedMarkup(plan,{presentation=null,reviewed=new Set(),expanded=new Set(categories),readOnly=false}={}){
 const keys=presentation?categories:[...new Set(plan.recommendations.map(r=>r.slot))];
 return `<div class="category-tabs" role="group" aria-label="Recommendation category">${keys.map((key,i)=>`<button data-category="${esc(key)}" aria-pressed="${i===0}">${esc(title(key))}</button>`).join('')}</div><div class="feed-tools"><span id="feed-status" role="status">${keys.length} ${keys.length===1?'recommendation':'recommendations'} to review</span></div>${keys.map(key=>{
  const recs=plan.recommendations.filter(r=>r.slot===key),extra=presentation?.feed[key],done=!readOnly&&reviewed.has(key),open=expanded.has(key);
  return `<div id="${esc(key)}-panel" class="feed-item" tabindex="-1">${done?`<div class="reviewed-summary"><div class="reviewed-copy"><span class="review-check">${lineIcon('check')}</span><div><strong>${esc(extra?.name||title(key))}</strong><small>Reviewed</small></div></div><div class="reviewed-actions"><button data-expand="${esc(key)}" class="text-button">${open?'Hide':'View'}</button><button data-undo-review="${esc(key)}" class="text-button">Undo</button></div></div>`:''}<div ${done&&!open?'hidden':''}>${recs.length?recs.map(r=>recommendationMarkup(r,presentation,readOnly)).join(''):extra?`<article class="recommendation"><div class="card-heading"><h2>${esc(extra.category)}</h2></div>${heroMarkup(extra)}${bodyMarkup(extra)}<div class="category-footer">${sourcesMarkup(extra)}${readOnly?'':`<button data-review="${esc(key)}" class="${done?'quiet':'solid'}">${done?'Undo review':'Mark reviewed'}</button>`}</div></article>`:''}</div></div>`;
 }).join('')}`;
}
export function approvedProductDetail(key,presentation,plan){
 if(key==='moisturizer'){
  const item=plan.recommendations.find(r=>approvedMatch(r));if(!item)return '';
  return `<h2 tabindex="-1">${esc(presentation.proposed.name)}</h2><div class="detail-product-image"><img src="${esc(presentation.proposed.image)}" alt="${esc(presentation.proposed.name)}"></div><h3>Why I chose this for you</h3><div class="personal-note"><p>${emphasizeReason(item.rationale)}</p><h4 class="actions-heading">Actions</h4><ul class="consultation-actions">${presentation.plan.actions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>${formulaMarkup(presentation)}${howMarkup({howTitle:'How to use it',how:presentation.moisturizerHow})}<p class="care-note">Your approval adds this to the plan and cart. It does not record that you have started using it.</p><div class="product-sources">${link(presentation.proposed.url,'Vanicream product page ↗')}</div>`;
 }
 const item=presentation.feed[key];if(!item)return '';
 return `<h2 tabindex="-1">${esc(item.name)}</h2>${item.image?`<div class="detail-product-image"><img src="${esc(item.image)}" alt="${esc(item.name)}"></div>`:''}${bodyMarkup(item)}${howMarkup(item)}${sourcesMarkup(item)}`;
}
export function consultationMarkup(presentation){return `<h2 tabindex="-1">Your consultation</h2>${presentation.profile.map(item=>`<h3>${esc(item.title)}</h3><p>${esc(item.body)}</p>`).join('')}`;}
export function applicationMarkup(presentation){const app=presentation.application;return `<section class="application-guide" id="application-guide"><h2>${esc(app.title)}</h2><p>${esc(app.intro)}</p><div class="application-steps">${app.steps.map(item=>`<article><span class="step-art">${esc(item.number)}</span><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></article>`).join('')}</div><p class="care-note">${esc(app.care)}</p>${link(app.source.url,`${esc(app.source.label)} ↗`,'text-button')}</section>`;}
export function planSourcesMarkup(presentation){return `<section class="source-links"><span>Sources</span>${presentation.sources.map(item=>link(item.url,`${esc(item.label)} ↗`)).join('')}</section>`;}
