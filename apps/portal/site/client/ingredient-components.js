import {esc} from '../advisor/model.js';
import {safeContentUrl} from '../advisor/presentation-model.js';
import {externalArrow} from './ui-icons.js';
const plain=value=>esc(value).replace(/\r\n?|\n/g,'<br>');

/** Canonical Alex chip, shared by comparison rows, facts and full INCI lists. */
export function ingredientButton(key,label){
 return `<button class="ingredient-link" data-ingredient="${esc(key||label)}" data-ingredient-name="${esc(label)}" aria-label="Learn more about ${esc(label)}"><span>${plain(label)}</span><span class="ingredient-arrow" aria-hidden="true">${externalArrow}</span></button>`;
}
function comparisonText(value){
 const [first,...details]=String(value??'').split(/\r\n?|\n/);
 return details.length?`<b>${esc(first)}</b><small>${details.map(esc).join('<br>')}</small>`:plain(first);
}
function rowMarkup(row){
 const refs=(row.sources||[]).flatMap(source=>{
  const url=safeContentUrl(source?.url);return url?[`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${plain(source.label)} ${externalArrow}</a>`]:[];
 }).join('');
 const note=row.guideNote&&row.guideNote!==row.significance?`<br><br>${plain(row.guideNote)}`:'';
 return `<div class="formula-row" role="row"><div role="rowheader">${ingredientButton(row.ingredientGuideKey||row.ingredientKey||row.label,row.label)}</div><span role="cell">${comparisonText(row.currentText)}</span><span role="cell">${comparisonText(row.proposedText)}</span></div><div role="row"><p class="formula-meaning" role="cell" aria-colspan="3">${plain(row.significance)}${note}${refs?`<span class="product-sources">${refs}</span>`:''}</p></div>`;
}

/** One row/component tree for both legacy Alex and R2 client presentations. */
export function comparisonTableMarkup({currentLabel,proposedLabel,rows=[]}){
 if(!rows.length)return '';
 return `<section class="ingredient-differences"><h3>The formula differences that matter</h3><div class="formula-table" role="table" aria-label="Formula comparison"><div class="formula-heading" role="row"><span role="columnheader"><span class="sr-only">Ingredient</span></span><strong role="columnheader">${plain(currentLabel)}</strong><strong role="columnheader">${plain(proposedLabel)}</strong></div>${rows.map(rowMarkup).join('')}</div></section>`;
}
