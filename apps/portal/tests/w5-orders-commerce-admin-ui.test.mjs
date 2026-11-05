import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,symlink,realpath} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {fixture,load,client,draftId,draft,body,index,detail,components,line} from './w5-orders-commerce-admin-helper.mjs';
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');
let module;
async function ui(){
 if(!module){const home=resolve(import.meta.dirname,'../../../.local-artifacts/w5-commerce-admin-ui'),out=resolve(home,'runtime/ProductQuoteAdmin.mjs');await mkdir(dirname(out),{recursive:true});const modules=resolve(import.meta.dirname,'../node_modules'),link=resolve(home,'node_modules');try{await symlink(modules,link,'dir');}catch(error){if(error.code!=='EEXIST')throw error;}assert.equal(await realpath(link),await realpath(modules),'isolated SSR dependency link must match this checkout');await build({stdin:{contents:"export {ProductQuoteAdmin} from './features/orders/admin/ProductQuoteAdmin.tsx';export {OverlayProvider} from './ui/index.ts';export {QuoteLineFields} from './features/orders/admin/QuoteFields.tsx';",resolveDir:resolve(import.meta.dirname,'../src'),loader:'ts'},outfile:out,bundle:true,platform:'node',format:'esm',jsx:'automatic',packages:'external',loader:{'.css':'empty'},logLevel:'silent'});module=await import(pathToFileURL(out));}
 assert.equal(typeof module.ProductQuoteAdmin,'function');return module;
}
async function render(c,props={}){return renderToStaticMarkup(createElement((await ui()).OverlayProvider,null,createElement((await ui()).ProductQuoteAdmin,{controller:c,...props})));}
async function setup(t){const f=await fixture(t),c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());await c.refresh();await c.openDraft(draftId);return {...f,c};}
test('product quote review names the actual published variant, economics and explicit actions without raw selectors',async t=>{
 const f=await setup(t),before=f.calls.length,html=await render(f.c,{clientName:'Synthetic Client'});
 assert.match(html,/product quote/);assert.match(html,/Synthetic Client/);assert.match(html,/synthetic moisturizer/);assert.match(html,/fragrance free/);assert.match(html,/50 ml/);assert.match(html,/\$25\.00/);assert.match(html,/\$30\.00/);assert.match(html,/save quote details/);assert.match(html,/review quote/);assert.match(html,/choose confirmed address/);
 assert.doesNotMatch(html,/name="(?:clientId|productId|shippingAddressVersion)"|type="number"[^>]*version|charge card|place order|publish plan|start product/i);assert.equal(f.calls.length,before,'SSR cannot dispatch');
});
test('missing optional request remains unavailable without a fabricated empty history or enabled writer',async t=>{
 const f=await fixture(t),c=createProductQuoteAdminController({runtime:f.runtime,clientId:client});t.after(()=>c.dispose());const html=await render(c);assert.match(html,/product quotes are unavailable/);assert.doesNotMatch(html,/no saved product quotes|<form|issue quote/);assert.equal(f.calls.length,0);
});
test('selected address display refuses mismatched client, head or version instead of using a latest/profile fallback',async t=>{
 const f=await setup(t),address={recipientName:'Synthetic Recipient',line1:'2 Synthetic Street',line2:'',city:'Test City',region:'WI',postalCode:'55555',countryCode:'US'},shipping={clientId:client,paymentRevision:11,shippingAddress:{version:2,address}};
 assert.match(await render(f.c,{shipping}),/2 Synthetic Street/);
 for(const changed of [{...shipping,clientId:'e0000000-0000-4000-8000-000000000003'},{...shipping,paymentRevision:12},{...shipping,shippingAddress:{version:3,address}}]){const html=await render(f.c,{shipping:changed});assert.match(html,/selected address is unavailable/);assert.doesNotMatch(html,/2 Synthetic Street/);}
});
test('invalid raw field remains visible and blocks final quote review',async t=>{
 const f=await setup(t);f.c.setHeaderInputs({...f.c.getSnapshot().inputs.header,taxAmount:'1.'});const html=await render(f.c);assert.match(html,/value="1\."/);assert.match(html,/check the exact amount/);assert.match(html,/unsaved changes/);assert.match(html,/<button[^>]*disabled=""[^>]*>review quote<\/button>/);
});
test('uncertain result keeps explicit original retry and status recovery instead of a second draft command',async t=>{
 const f=await setup(t);f.setReply(async()=>Response.json({error:'service_unavailable'},{status:503}));await f.c.saveDraft();const count=f.calls.length,html=await render(f.c);assert.match(html,/result is uncertain/);assert.match(html,/check original status/);assert.match(html,/retry original/);assert.equal(f.calls.length,count);
});
test('actual denied financial read clears private quote projection in the rendered panel',async t=>{
 const f=await setup(t);f.setReply(async()=>Response.json({error:'forbidden'},{status:403}));await f.c.refresh();const html=await render(f.c);assert.match(html,/product quotes are unavailable/);assert.doesNotMatch(html,/synthetic moisturizer|50 ml|2 Synthetic Street/);
});

test('new local address selection displays only its exact matching confirmed VM',async t=>{
 const f=await setup(t);assert.equal(f.c.newDraft(),true);const shipping={clientId:client,paymentRevision:11,shippingAddress:{version:3,address:{recipientName:'Synthetic Recipient',line1:'3 Synthetic Street',line2:'',city:'Test City',region:'WI',postalCode:'55555',countryCode:'US'}}};
 assert.equal(await f.c.chooseShippingAddress(async()=>shipping),true);assert.match(await render(f.c,{shipping}),/3 Synthetic Street/);assert.match(await render(f.c),/selected address is unavailable/);
});
test('base, current and proposed conflict values remain distinct with retained incomplete raw fields',async t=>{
 const f=await setup(t);f.c.setHeaderInputs({...f.c.getSnapshot().inputs.header,note:'unsent proposal',taxAmount:'1.'});
 const newer={...draft(),target:{...draft().target,revision:8,contentHash:'d'.repeat(64)},body:{...body(),note:'current server note'}};
 f.setReply(async command=>Response.json(command.action==='read_advisor_commerce_v1'?{...index(),entries:[{...index().entries[0],entity:{...index().entries[0].entity,revision:8}}]}:command.action==='read_advisor_commerce_detail_v1'?{...detail(),detail:newer}:{...components(command),quote:{kind:'draft',target:newer.target}}));
 await f.c.refresh();assert.equal(f.c.getSnapshot().phase,'conflict');const html=await render(f.c);assert.match(html,/your starting version/);assert.match(html,/current saved version/);assert.match(html,/current server note/);assert.match(html,/unsent proposal/);assert.match(html,/value="1\."/);assert.match(html,/keep local edits on current version/);assert.match(html,/discard local changes and use saved version/);
});
async function fields(value){const {productQuoteLineInputs}=await load('apps/portal/src/features/orders/admin/quote-form.ts');const props={value:productQuoteLineInputs(value),disabled:false,onChange(){},error:undefined},Component=(await ui()).QuoteLineFields,controls=new Map();
 function visit(node){if(Array.isArray(node)){node.forEach(visit);return;}if(!node||typeof node!=='object'||!node.props)return;if(node.props.label&&node.props.children?.props)controls.set(node.props.label,node.props.children.props);visit(node.props.children);}
 visit(Component(props));return {html:renderToStaticMarkup(createElement(Component,props)),controls};}

test('line editor preserves checked zero and explicit no separate deadline without raw identity/version inputs',async()=>{
 const {html,controls}=await fields(line());assert.match(html,/value="0\.00"/);assert.equal(controls.get('separate ship-by deadline').value,'none');assert.match(html,/return policy source link/);assert.match(html,/record the retailer price without a shelv markup/);assert.doesNotMatch(html,/name="(?:productId|publication|shippingAddressVersion)"/);
});
test('unknown return facts remain unknown in the editor instead of fabricated final sale or delivery dates',async()=>{
 const value=line();value.returnTerms={...value.returnTerms,openedAllowed:{state:'unknown'},deadline:{kind:'unknown'},returnCost:{kind:'unknown'}};
 const {html,controls}=await fields(value);assert.equal(controls.get('return window').value,'unknown');assert.equal(controls.get('opened products').value,'unknown');assert.doesNotMatch(html,/label[^>]*>return by|label[^>]*>ship by|value="2026-12-03"/);
});
test('relative delivery terms keep the actual delivery anchor and separate shipping window',async()=>{
 const value=line();value.returnTerms.deadline={kind:'relative',days:{state:'known',value:30},anchor:{state:'known',value:'delivery'},shipWithinDays:{state:'known',value:7}};
 const {html,controls}=await fields(value);assert.equal(controls.get('window starts from').value,'delivery');assert.equal(controls.get('separate shipping window').value,'days');assert.match(html,/value="30"/);assert.match(html,/value="7"/);assert.match(html,/ship within days/);assert.doesNotMatch(html,/value="2026-12-03"/);
});
