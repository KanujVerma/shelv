import {ingredientButton} from '../client/ingredient-components.js';
import {esc,money,title,safeUrl,clientPreview} from './model.js';
import {catalog} from './catalog.js';
import {ingredientContent,loadIngredientLibrary} from '../client/ingredient-library.js';
export {ingredientContent} from '../client/ingredient-library.js';

const ingredientNames={niacinamide:'Niacinamide',squalane:'Squalane',ceramides:'Ceramides',glycerin:'Glycerin'};
const productIngredients={'cerave-pm':['niacinamide','ceramides'],'vanicream-daily':['squalane','ceramides'],'cerave-cleanser':['glycerin','ceramides'],'boj-relief-sun':['niacinamide']};
function ingredientPills(item){const keys=[...new Set([...(productIngredients[item.currentProductId]||[]),...(productIngredients[item.proposedProductId]||[])])];return keys.length?`<section class="ingredient-differences"><h3>Ingredient guide</h3><div class="client-ingredient-pills">${keys.map(key=>ingredientButton(key,ingredientNames[key])).join('')}</div></section>`:'';}


const guideNavigation=new WeakMap();
export function wireIngredientGuide(root,display,back){
  const doc=root.ownerDocument;
  let navigation=guideNavigation.get(doc);
  if(!navigation){navigation={generation:0};guideNavigation.set(doc,navigation);doc.addEventListener('close',()=>navigation.generation++,true);}
  root.querySelectorAll('[data-ingredient]').forEach(button=>button.onclick=async()=>{
    const key=button.dataset.ingredient,label=button.dataset.ingredientName||button.textContent.trim(),originScroll=root.scrollTop;
    const open=async(retry=false,trigger=button)=>{
      const generation=++navigation.generation,originDialog=trigger.closest('dialog'),activeDialog=doc.querySelector('dialog[open]'),heading=activeDialog?.querySelector('h2');
      const library=await loadIngredientLibrary({retry});
      if(generation!==navigation.generation||!trigger.isConnected||originDialog&&!originDialog.open||doc.querySelector('dialog[open]')!==activeDialog||activeDialog?.querySelector('h2')!==heading)return;
      const host=display(`<button class="text-button" data-ingredient-back>Back</button>${ingredientContent(key,library,{label})}`);
      host?.querySelector('[data-ingredient-back]')?.addEventListener('click',()=>{
        const restored=back?.();
        const target=button.isConnected?button:[...(restored||root).querySelectorAll('[data-ingredient]')].find(el=>el.dataset.ingredient===key);
        if(target?.closest('details'))target.closest('details').open=true;
        (restored||root).scrollTop=originScroll;target?.focus({preventScroll:true});
      });
      host?.querySelector('[data-ingredient-retry]')?.addEventListener('click',event=>open(true,event.currentTarget));
    };await open();
  });
}

export function productCard(productId,label,priceCents) {
  const product=catalog[productId];
  if(!product)return `<div class="product-card missing-product"><span class="keep-label">${esc(label)}</span><h3>Product details unavailable</h3><p>${esc(productId)}</p></div>`;
  return `<div class="product-card"><span class="keep-label">${esc(label)}</span><div class="product-card-photo"><img src="${esc(product.image)}" alt="${esc(product.name)}"></div><h3>${esc(product.name)}</h3><p>${esc(product.size)}${priceCents==null?'':` · ${money(priceCents)}`}</p>${safeUrl(product.url)?`<a class="product-page-link" href="${esc(product.url)}" target="_blank" rel="noopener noreferrer">Product page ↗</a>`:''}</div>`;
}

/** Only allowlisted client fields enter the preview markup. */
export function planPreviewMarkup(draft) {
  const preview=clientPreview(draft);
  if(!preview.recommendations.length)return '<div class="advisor-empty"><h3>No recommendations yet</h3><p>Add a selected replacement to preview the client plan.</p></div>';
  return preview.recommendations.map(item=>`<article class="recommendation advisor-preview-card"><div class="card-heading"><h2>${esc(title(item.slot))}</h2></div><div class="product-pair">${productCard(item.currentProductId,'REPLACE')}${productCard(item.proposedProductId,'WITH',item.priceCents)}</div><div class="rationale"><h3>Why I chose this for you</h3><div class="personal-note"><p>${esc(item.rationale).replace(/\n/g,'<br>')}</p></div>${ingredientPills(item)}</div></article>`).join('');
}
