import assert from 'node:assert/strict';
import {createMayaSample} from '../../site/advisor/maya-sample.js';
import {adaptLegacyPlan,projectClientPlan} from '../../../../src/contracts/PortalRebuild.ts';

const files=['moisturizer.jpg','sunscreen.webp','makeup.jpg','remover.jpg','cleanser.jpg','azelaic.png','hydro.jpg','aveeno.jpg','balm.jpg','ha.png','niacinamide.png','glycolic.png'];
const allowed=new Set(files.map(file=>'/assets/maya-'+file));
const source=createMayaSample().clientView.plan;
const content=projectClientPlan(adaptLegacyPlan({version:source.version,presentation:source.presentation,recommendations:source.recommendations},2).content);
const products=new Map(content.products.filter(product=>product.imageUrl).map(product=>[product.id,'/assets/maya-'+new URL(product.imageUrl).pathname.split('/').at(-1)]));

/** Inspect actual SSR slots independently of the implementation's resolver.
 * Local static bytes are allowed; external/business loads remain forbidden. */
export function assertMayaStaticImages(html,{required=true}={}) {
  assert.doesNotMatch(html,/<(?:iframe|script)\b|<link[^>]+rel="preconnect"/);
  const images=[...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g)];
  if(required)assert.ok(images.length>0,'available sample images must be rendered');
  for(const [,url] of images)assert.ok(allowed.has(url),'only an exact packaged Maya asset: '+url);
  for(const [,tag,url] of html.matchAll(/(<link\b[^>]*\brel="preload"[^>]*\bhref="([^"]+)"[^>]*>)/g)){
    assert.match(tag,/\bas="image"/);
    assert.ok(allowed.has(url),'only an exact local image preload: '+url);
  }
  let slots=0;
  for(const [,id,body] of html.matchAll(/<div\b[^>]*\bdata-product-photo="([^"]+)"[^>]*>([\s\S]*?)<\/div>/g)){
    const image=body.match(/<img\b[^>]*\bsrc="([^"]+)"/);
    if(image){assert.equal(image[1],products.get(id),'source image bound to selected product '+id);slots++;}
  }
  assert.equal(slots,images.length,'each image occupies a product recognition slot');
}
