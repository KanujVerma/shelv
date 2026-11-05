import test from 'node:test';
import assert from 'node:assert/strict';
import {load,line,body} from './w5-orders-commerce-admin-helper.mjs';
const module=await load('apps/portal/src/features/orders/admin/quote-form.ts').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND'&&error.url?.endsWith('/orders/admin/quote-form.ts'))return {};throw error;});
const fn=name=>{assert.equal(typeof module[name],'function',`missing product quote form ${name}`);return module[name];};
test('complete line form round-trips checked facts without changing published identity',()=>{
 const base=line(),fields=fn('productQuoteLineInputs')(base),result=fn('productQuoteLineFromInputs')(base,fields);assert.deepEqual(result,base);assert.equal(fields.unitPrice,'12.50');assert.equal(fields.returnCostAmount,'0.00');
});
test('empty draft fields remain unknown rather than default quantity, seller, dates or costs',async()=>{
 const {emptyProductQuoteLine}=await load('src/contracts/PortalCommerceValidation.ts'),base=emptyProductQuoteLine('new-line'),fields=fn('productQuoteLineInputs')(base),result=fn('productQuoteLineFromInputs')(base,fields);assert.equal(fields.quantity,'');assert.equal(fields.unitPrice,'');assert.deepEqual(result,base);
});
test('raw partial price/date and URL are retainable strings but cannot serialize invalid facts',()=>{
 const fields=fn('productQuoteLineInputs')(line()),parse=fn('productQuoteLineFromInputs');fields.unitPrice='13.';fields.unitPriceCheckedOn='';assert.throws(()=>parse(line(),fields));fields.unitPrice='13.00';fields.unitPriceCheckedOn='2026-11-03';fields.sourceUrl='https://';assert.throws(()=>parse(line(),fields));assert.equal(fields.sourceUrl,'https://');
});
test('zero and explicit no-return-shipping date differ from unknown',()=>{
 const parse=fn('productQuoteLineFromInputs'),fields=fn('productQuoteLineInputs')(line());fields.shipByKind='unknown';assert.deepEqual(parse(line(),fields).returnTerms.deadline.shipBy,{state:'unknown'});fields.shipByKind='none';assert.deepEqual(parse(line(),fields).returnTerms.deadline.shipBy,{state:'known',value:null});fields.returnCostAmount='';assert.deepEqual(parse(line(),fields).returnTerms.returnCost,{kind:'known',cents:{state:'unknown'}});
});
test('relative policy keeps supplied anchor and days without inventing delivery date',()=>{
 const fields=fn('productQuoteLineInputs')(line());fields.deadline='relative';fields.relativeDays='14';fields.relativeAnchor='delivery';fields.shipWithinKind='none';const result=fn('productQuoteLineFromInputs')(line(),fields);assert.deepEqual(result.returnTerms.deadline,{kind:'relative',days:{state:'known',value:14},anchor:{state:'known',value:'delivery'},shipWithinDays:{state:'known',value:null}});assert.equal('deliveredOn'in result,false);
});
test('unknown versus opened eligibility and actual checked sources survive editing',()=>{
 const fields=fn('productQuoteLineInputs')(line()),parse=fn('productQuoteLineFromInputs');fields.openedAllowed='unknown';assert.deepEqual(parse(line(),fields).returnTerms.openedAllowed,{state:'unknown'});fields.openedAllowed='yes';fields.seller='new actual seller';fields.policySummary='specific checked seller policy';const result=parse(line(),fields);assert.deepEqual(result.returnTerms.openedAllowed,{state:'known',value:true});assert.equal(result.seller.value,'new actual seller');assert.equal(result.returnTerms.summary,'specific checked seller policy');
});
test('invalid quantity, dates and fractional cents refuse without silently rounding',()=>{
 const fields=fn('productQuoteLineInputs')(line()),parse=fn('productQuoteLineFromInputs');for(const patch of [{quantity:'0'},{quantity:'101'},{quantity:'1.5'},{checkedOn:'2026-02-30'},{unitPrice:'1.005'},{returnCostAmount:'-1'}])assert.throws(()=>parse(line(),{...fields,...patch}));
});
test('form cannot insert raw IDs, authority fields or identity replacements',()=>{
 const fields=fn('productQuoteLineInputs')(line()),parse=fn('productQuoteLineFromInputs');for(const extra of [{productId:'forged'},{actorId:'forged'},{role:'owner'},{identity:{name:'different'}}])assert.throws(()=>parse(line(),{...fields,...extra}));const changed=parse(line(),{...fields,retailer:'another retailer'});assert.deepEqual(changed.selection,line().selection);assert.deepEqual(changed.identity,line().identity);
});
test('header form preserves exact unknown/zero tax, shipping and unsent note',()=>{
 const source=body(),fields=fn('productQuoteHeaderInputs')(source);assert.equal(fields.taxAmount,'0.00');assert.equal(fields.shippingAmount,'5.00');assert.deepEqual(fn('productQuoteHeaderFromInputs')(source,fields),source);fields.taxAmount='';fields.taxCheckedOn='';fields.note='private preparation note';const result=fn('productQuoteHeaderFromInputs')(source,fields);assert.deepEqual(result.tax,{state:'unknown'});assert.equal(result.note,'private preparation note');assert.equal(result.shippingAddressVersion.value,2);
});
test('header cannot fabricate service periods or overwrite publication/address through text fields',()=>{
 const fields=fn('productQuoteHeaderInputs')(body()),parse=fn('productQuoteHeaderFromInputs');for(const extra of [{shippingAddressVersion:'99'},{publication:'1'},{clientId:'foreign'},{servicePeriod:{startOn:'2026-01-01'}}])assert.throws(()=>parse(body(),{...fields,...extra}));assert.throws(()=>parse(body(),{...fields,serviceChoice:'recorded_service'}));
});
test('recorded combined service allocation is retained without new calendar inference',()=>{
 const source={...body(),serviceCents:{state:'known',value:10000},servicePeriod:{startOn:'2026-11-03',endOn:'2026-12-03'}},fields=fn('productQuoteHeaderInputs')(source);assert.equal(fields.serviceChoice,'recorded_service');assert.deepEqual(fn('productQuoteHeaderFromInputs')(source,fields),source);const productOnly=fn('productQuoteHeaderFromInputs')(source,{...fields,serviceChoice:'product_only'});assert.deepEqual(productOnly.serviceCents,{state:'known',value:0});assert.equal(productOnly.servicePeriod,null);
});
test('raw form snapshot validator copies bounded strings and refuses unknown keys',()=>{
 const fields=fn('productQuoteLineInputs')(line()),read=fn('readProductQuoteLineInputs');const result=read(fields);fields.retailer='caller edit';assert.notEqual(result.retailer,fields.retailer);assert.throws(()=>read({...fields,sourceUrl:'x'.repeat(4001)}));assert.throws(()=>read({...fields,callback:()=>{}}));
});
