import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

const root=process.env.W5_COMMERCE_ADMIN_SOURCE_ROOT??fileURLToPath(new URL('../../..',import.meta.url));
const modulePath=resolve(root,'apps/portal/src/features/orders/admin/quote-model.ts');
const model=await import(pathToFileURL(modulePath).href).catch(error=>{
 if(error.code==='ERR_MODULE_NOT_FOUND'&&error.url===pathToFileURL(modulePath).href)return {};
 throw error;
});
const {MAX_PAYMENT_CENTS}=await import(pathToFileURL(resolve(root,'supabase/functions/concierge-payments/contract.ts')).href);
const fn=name=>{assert.equal(typeof model[name],'function',`missing new quote model export ${name}`);return model[name];};
const known=value=>({state:'known',value});
const unknown=()=>({state:'unknown'});
const client='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002';
const requestId='10000000-0000-4000-8000-000000000003',draftId='10000000-0000-4000-8000-000000000004';
const publication={version:3,documentSchemaVersion:3},day='2026-11-03';
const line=()=>({lineId:'line-a',selection:known({publication,decisionId:'decision-a',productId:'product-a'}),identity:{name:'synthetic moisturizer',variant:known('fragrance free'),strength:{state:'not_applicable',reason:'no concentration label'},sizeLabel:known('50 ml')},quantity:known(2),retailer:known('synthetic retailer'),seller:known('synthetic seller'),fulfiller:unknown(),sourceUrl:known('https://example.com/item'),checkedOn:known(day),unitPrice:known({cents:1250,checkedOn:day}),returnTerms:{checkedOn:known(day),sourceUrl:known('https://example.com/returns'),summary:'synthetic checked terms',openedAllowed:known(false),deadline:{kind:'absolute',returnBy:known('2026-12-03'),shipBy:known(null)},returnCost:{kind:'known',cents:known(0)}}});
const body=()=>({publication:known(publication),lineIds:['line-a'],tax:known({cents:0,checkedOn:day}),shipping:known({cents:500,checkedOn:day}),shippingAddressVersion:known(2),serviceCents:known(0),servicePeriod:null,note:null});
const draft=()=>({kind:'quote_draft',clientId:client,target:{draftId,revision:7,contentHash:'a'.repeat(64),selectionHash:'b'.repeat(64)},body:body(),savedAt:'2026-11-03T12:00:00Z',readyToIssue:true,issues:[]});
const snapshot=()=>({revision:19,paymentRevision:11,serviceRevision:5,asOfDay:day,hash:'c'.repeat(64)});

test('new quote preparation retains all unknown facts and creates no financial record',()=>{
 const result=fn('newProductQuotePreparation')();assert.deepEqual(result,{body:{publication:unknown(),lineIds:[],tax:unknown(),shipping:unknown(),shippingAddressVersion:unknown(),serviceCents:unknown(),servicePeriod:null,note:null},lines:[]});
 assert.equal('requestId'in result,false);assert.equal('readyToIssue'in result,false);
});
test('blank money remains unknown while deliberate zero remains exact zero',()=>{
 const parse=fn('parseProductQuoteCents');assert.equal(parse(''),null);assert.equal(parse('  '),null);assert.equal(parse('0'),0);assert.equal(parse('0.00'),0);assert.equal(parse('12.50'),1250);assert.equal(parse('19.99'),1999);
});
test('money refuses fractional cents, exponents, negative, locale and unsafe values',()=>{
 const parse=fn('parseProductQuoteCents');for(const value of ['1.005','1e2','-1','+1','1,000.00','$12','NaN','Infinity','999999999999999999'])assert.throws(()=>parse(value),value);
});
test('checked money never invents a checked date or silently drops a supplied amount',()=>{
 const checked=fn('productQuoteCheckedMoney');assert.deepEqual(checked('',''),unknown());assert.throws(()=>checked('12.50',''));assert.throws(()=>checked('',day));assert.throws(()=>checked('12.50','2026-02-30'));assert.deepEqual(checked('0',day),known({cents:0,checkedOn:day}));
});
test('local line preparation has no invented quantity, seller, identity or return rule',()=>{
 const initial=fn('newProductQuotePreparation')(),next=fn('addProductQuoteLine')(initial,'opaque-line');assert.deepEqual(initial.lines,[]);assert.deepEqual(next.body.lineIds,['opaque-line']);const item=next.lines[0];assert.deepEqual(item.quantity,unknown());assert.deepEqual(item.seller,unknown());assert.deepEqual(item.selection,unknown());assert.deepEqual(item.returnTerms.deadline,{kind:'unknown'});assert.deepEqual(item.returnTerms.returnCost,{kind:'unknown'});
});
test('duplicate local line IDs refuse and returned preparations cannot alias private state',()=>{
 const add=fn('addProductQuoteLine'),next=add(fn('newProductQuotePreparation')(),'line-a');assert.throws(()=>add(next,'line-a'));assert.throws(()=>{next.body.lineIds.push('corrupt');});assert.throws(()=>{next.lines[0].identity.name='corrupt';});
});
test('replacing a line keeps exact opaque product/decision/publication and copies the input',()=>{
 const original=line(),initial=fn('addProductQuoteLine')(fn('newProductQuotePreparation')(),'line-a'),next=fn('replaceProductQuoteLine')(initial,original);original.identity.name='caller mutation';assert.equal(next.lines[0].identity.name,'synthetic moisturizer');assert.deepEqual(next.lines[0].selection.value,{publication,decisionId:'decision-a',productId:'product-a'});assert.deepEqual(initial.lines[0].selection,unknown());
});
test('draft save uses quote-draft CAS only and preserves explicit tax/shipping/address',()=>{
 const command=fn('buildAdminQuoteDraftSave')({clientId:client,requestId,draft:draft(),body:body()});assert.equal(command.action,'save_product_quote_draft_v1');assert.equal(command.expectedQuoteDraftRevision,7);assert.equal(command.draftId,draftId);assert.deepEqual(command.body.tax,known({cents:0,checkedOn:day}));assert.deepEqual(command.body.shippingAddressVersion,known(2));
});
test('new draft save alone has null ID and revision zero without invented publication',()=>{
 const command=fn('buildAdminQuoteDraftSave')({clientId:client,requestId,draft:null,body:fn('newProductQuotePreparation')().body});assert.equal(command.draftId,null);assert.equal(command.expectedQuoteDraftRevision,0);assert.deepEqual(command.body.publication,unknown());assert.deepEqual(command.body.tax,unknown());
});
test('draft save rejects foreign client and unsupported selector/authority fields',()=>{
 const build=fn('buildAdminQuoteDraftSave');assert.throws(()=>build({clientId:other,requestId,draft:draft(),body:body()}));for(const extra of [{actorId:client},{role:'owner'},{finance:true},{rpc:'other'},{url:'https://other.invalid'}])assert.throws(()=>build({clientId:client,requestId,draft:draft(),body:body(),...extra}));
});
test('line save binds the exact canonical draft target and declared line membership',()=>{
 const build=fn('buildAdminQuoteLineSave'),d=draft();const command=build({clientId:client,requestId,draft:d,line:line()});assert.deepEqual(command.target,d.target);assert.equal(command.body.lineId,'line-a');d.target.contentHash='d'.repeat(64);assert.equal(command.target.contentHash,'a'.repeat(64));assert.throws(()=>build({clientId:client,requestId,draft:draft(),line:{...line(),lineId:'other-line'}}));
});
test('line save refuses another client and never replaces original target revisions',()=>{
 const build=fn('buildAdminQuoteLineSave');assert.throws(()=>build({clientId:other,requestId,draft:draft(),line:line()}));const command=build({clientId:client,requestId,draft:draft(),line:line()});assert.equal(command.target.revision,7);assert.equal(Object.isFrozen(command.target),true);
});
test('issue binds complete current draft and actual payment head rather than service head',()=>{
 const command=fn('buildAdminQuoteIssue')({clientId:client,requestId,draft:draft(),snapshot:snapshot(),lines:[line()]});assert.equal(command.action,'issue_product_quote_v1');assert.equal(command.expectedPaymentRevision,11);assert.deepEqual(command.target,draft().target);assert.equal('receiptVerified'in command,false);assert.equal('publish'in command,false);
});
test('unknown or server-unready draft cannot issue despite complete-looking local lines',()=>{
 const build=fn('buildAdminQuoteIssue');for(const d of [{...draft(),readyToIssue:false,issues:['method_unavailable']},{...draft(),body:{...body(),shipping:unknown()}},{...draft(),body:{...body(),shippingAddressVersion:unknown()}},{...draft(),body:{...body(),serviceCents:unknown()}}])assert.throws(()=>build({clientId:client,requestId,draft:d,snapshot:snapshot(),lines:[line()]}));
});
test('issue requires exactly all unique declared lines, never a first-page shortcut',()=>{
 const build=fn('buildAdminQuoteIssue'),base={clientId:client,requestId,draft:draft(),snapshot:snapshot()};for(const lines of [[],[line(),line()],[{...line(),lineId:'other'}]])assert.throws(()=>build({...base,lines}));assert.throws(()=>build({...base,draft:{...draft(),body:{...body(),lineIds:['line-a','line-b']}},lines:[line()]}));
});
test('issue refuses a foreign publication, unknown variant and missing checked return terms',()=>{
 const build=fn('buildAdminQuoteIssue'),base={clientId:client,requestId,draft:draft(),snapshot:snapshot()};for(const item of [{...line(),selection:known({...line().selection.value,publication:{...publication,version:2}})},{...line(),identity:{...line().identity,variant:unknown()}},{...line(),returnTerms:{...line().returnTerms,openedAllowed:unknown()}}])assert.throws(()=>build({...base,lines:[item]}));
});
test('issue rejects foreign client, zero product price and fields outside fixed command producer',()=>{
 const build=fn('buildAdminQuoteIssue'),base={clientId:client,requestId,draft:draft(),snapshot:snapshot(),lines:[line()]};assert.throws(()=>build({...base,clientId:other}));assert.throws(()=>build({...base,lines:[{...line(),unitPrice:known({cents:0,checkedOn:day})}]}));assert.throws(()=>build({...base,actorId:client}));
});
test('command producers return immutable snapshots while caller bodies stay unchanged',()=>{
 const source=body(),before=structuredClone(source),command=fn('buildAdminQuoteDraftSave')({clientId:client,requestId,draft:draft(),body:source});assert.deepEqual(source,before);source.tax.value.cents=777;assert.equal(command.body.tax.value.cents,0);assert.throws(()=>{command.body.tax.value.cents=12;});
});

test('generated exact-cent decimals round-trip across the canonical amount range',()=>{
 const parse=fn('parseProductQuoteCents'),maximum=BigInt(MAX_PAYMENT_CENTS);let seed=0x5a17n;
 const values=[0n,1n,9n,10n,99n,100n,101n,maximum-1n,maximum];
 for(let i=0;i<2048;i++){seed=(seed*6364136223846793005n+1442695040888963407n)&((1n<<64n)-1n);values.push(seed%(maximum+1n));}
 for(const cents of values){const decimal=`${cents/100n}.${String(cents%100n).padStart(2,'0')}`;assert.equal(parse(decimal),Number(cents),decimal);assert.throws(()=>parse(decimal+'1'),decimal+'1');}
 const excess=maximum+1n;assert.throws(()=>parse(`${excess/100n}.${String(excess%100n).padStart(2,'0')}`));
});
