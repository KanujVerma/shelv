import {esc} from '../advisor/model.js';
import {safeContentUrl} from '../advisor/presentation-model.js';
import {ingredientButton} from './ingredient-components.js';
import {wireIngredientGuide} from '../advisor/plan-preview.js';
import {productFormula} from './formula-data.js';
export {productFormula} from './formula-data.js';
export function productIngredientsButton(product){
 if(!product?.name)return '';
 return `<button class="text-button product-ingredients-button" data-product-ingredients="${esc(product.id||product.name)}" data-product-name="${esc(product.name)}" data-product-url="${esc(safeContentUrl(product.productUrl)||'')}" aria-label="Full ingredient list for ${esc(product.name)}">Full ingredient list</button>`;
}
function listMarkup(label,ingredients){
 if(!ingredients?.length)return '';
 return `${label?`<h4>${esc(label)}</h4>`:''}<ol class="ingredient-grid inci-list">${ingredients.map(item=>{const name=typeof item==='string'?item:item.name,label=typeof item==='string'?item:`${item.name} (${item.percentage}%)`;return `<li>${ingredientButton(name,label)}</li>`;}).join('')}</ol>`;
}
export function productIngredientsMarkup(product,{collapsible=false}={}){
 const formula=productFormula(product),url=safeContentUrl(formula?.sourceUrl||product?.productUrl);
 const content=formula?.status==='verified'?`<p class="ingredient-formula-reference">${esc(formula.displayName)} · ${esc(formula.marketLabel||formula.market)} brand ingredient list</p>${formula.note?`<p>${esc(formula.note)}</p>`:''}${listMarkup('Active ingredients',formula.activeIngredients)}${listMarkup(formula.activeIngredients?.length?'Inactive ingredients':'',formula.ingredients)}<p class="ingredient-formula-limit">Ingredient lists can change. Check the list on your exact package. Presence and order do not establish concentration or performance.</p>`:`<p>${esc(formula?.unavailableReason||'A verified full ingredient list is not available here for this exact formulation. Check your product’s package or brand page.')}</p>`;
 const source=url?`<a class="text-button" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(formula?'Brand ingredient source':'Product page')}</a>`:'';
 return collapsible?`<details class="product-ingredients"><summary>Full ingredient list</summary>${content}${source}</details>`:`<section class="product-ingredients"><h3>Full ingredient list</h3>${content}${source}</section>`;
}
export function productIngredientDetail(product){
 return `<h2 tabindex="-1">${esc(product.name)}</h2>${productIngredientsMarkup(product)}`;
}
export function productIngredientText(product){
 const formula=productFormula(product);
 if(formula?.status!=='verified')return [`Ingredients for ${product.name}`,formula?.unavailableReason||'A verified full ingredient list is not available for this exact formulation.'];
 return [`Ingredients for ${product.name}`,formula.displayName,formula.market,...(formula.note?[formula.note]:[]),...(formula.activeIngredients?.length?['Active ingredients',...formula.activeIngredients.map(item=>`${item.name} (${item.percentage}%)`)]:[]),formula.activeIngredients?.length?'Inactive ingredients':'Ingredients',formula.ingredients.join(', '),'Check the ingredient list on your exact package.',`Brand ingredient source: ${formula.sourceUrl}`];
}
export function wireProductIngredients(root,display){
 root.querySelectorAll('[data-product-ingredients]').forEach(button=>button.onclick=()=>{
  const product={id:button.dataset.productIngredients,name:button.dataset.productName,productUrl:button.dataset.productUrl};
  const open=()=>{const host=display(productIngredientDetail(product));wireIngredientGuide(host,display,open);return host;};
  open();
 });
}
