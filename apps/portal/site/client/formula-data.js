import {safeContentUrl} from '../advisor/presentation-model.js';
import {productFormulas} from './product-formulas.js';
const urlKey=value=>{
 const safe=safeContentUrl(value);if(!safe)return null;
 const url=new URL(safe);return url.origin+url.pathname.replace(/\/$/,'')+url.search;
};
/** Public formula identity is an exact verified URL, not a similar name/client. */
export function productFormula(product){
 const key=urlKey(product?.productUrl);if(!key)return null;
 return productFormulas.find(record=>record.productUrls.some(url=>urlKey(url)===key))||null;
}
