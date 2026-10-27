import {esc} from '../advisor/model.js';
import {safeContentUrl} from '../advisor/presentation-model.js';

// Same identity normalization as the retained corpus: NFC, case and whitespace.
// Punctuation, derivatives and the51 proposed aliases are not guessed.
export const ingredientLookupKey = value => typeof value==='string' ? value.normalize('NFC').trim().replace(/\s+/gu,' ').toLowerCase() : '';
const indexes=new WeakMap();
export function resolveIngredientCard(input,library) {
  if(!library||typeof library!=='object')return null;
  let index=indexes.get(library);
  if(!index){
    index=new Map();
    for(const [id,card]of Object.entries(library)){
      if(!card||typeof card!=='object'||typeof card.name!=='string')continue;
      const identity=card.ingredientId||id;
      for(const name of [id,card.ingredientId,card.name,...(Array.isArray(card.aliases)?card.aliases:[])]){
        const key=ingredientLookupKey(name);if(!key)continue;
        if(index.has(key)&&index.get(key)?.identity!==identity)index.set(key,null);
        else if(!index.has(key))index.set(key,{identity,card});
      }
    }
    indexes.set(library,index);
  }
  return index.get(ingredientLookupKey(input))?.card||null;
}

function entryMarkup(card,{heading=false}={}) {
  const seen=new Set(),fields=['summary','body','detail','caution','amountAndUse','evidence','aliasNotes','distinctIngredients'];
  const copy=fields.flatMap(field=>{
    const value=card[field],key=ingredientLookupKey(value);
    if(typeof value!=='string'||!key||seen.has(key))return [];seen.add(key);
    return [`<p${field==='caution'?' class="ingredient-caution"':''}>${esc(value).replace(/\n/g,'<br>')}</p>`];
  }).join('');
  const sources=(Array.isArray(card.sources)?card.sources:[]).flatMap(source=>{
    const url=safeContentUrl(source?.url);return url?[`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.label||'Ingredient reference')}</a>`]:[];
  });
  return `${heading?`<h3>${esc(card.name)}</h3>`:''}${copy}${sources.length?`<div class="ingredient-references">${[...new Set(sources)].join('')}</div>`:''}`;
}

/** One populated detail component for comparison chips and every full INCI list. */
export function ingredientContent(key,library,{label=key}={}) {
  if(library===null)return `<h2 tabindex="-1">${esc(label||'Ingredient guide')}</h2><p>The ingredient guide could not load. Please try again.</p><button class="quiet" data-ingredient-retry>Try again</button>`;
  if(ingredientLookupKey(key)==='ceramides'){
    const cards=['ceramide-np','ceramide-ap','ceramide-eop','ceramide-ng','ceramide-as'].map(id=>resolveIngredientCard(id,library)).filter(Boolean);
    if(cards.length)return `<h2 tabindex="-1">Ceramides</h2>${cards.map(card=>entryMarkup(card,{heading:true})).join('')}<p>Different ceramide types are not quality grades. The ingredient count does not establish concentration or product performance.</p>`;
  }
  const card=resolveIngredientCard(key,library);
  return card?`<h2 tabindex="-1">${esc(card.name)}</h2>${entryMarkup(card)}`:`<h2 tabindex="-1">${esc(label||key||'Ingredient')}</h2><p>An explanation for this exact ingredient name is not available in the library yet.</p>`;
}

let libraryPromise=null;
export async function loadIngredientLibrary({retry=false}={}){
  if(retry)libraryPromise=null;
  if(!libraryPromise)libraryPromise=fetch(new URL('../ingredient-guide.json',import.meta.url),{credentials:'omit'}).then(response=>{
    if(!response.ok)throw Error('Ingredient guide unavailable');return response.json();
  }).catch(()=>{libraryPromise=null;return null;});
  return libraryPromise;
}
