import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import type {FrozenProductLine,ProductQuoteLineDraft,ServiceRefundAssessment} from '../src/contracts/PortalCommerce.ts';
import {buildCommerceRpc,readCommerceCommand,emptyProductQuoteDraft,emptyProductQuoteLine,commerceLineReady,checkFrozenCommerceLine,readPrivateRepaymentDestination,hashCommerceCommand,checkServiceRefundAssessment,commerceJsonBytes,prepareCommerceReturnTerms} from '../src/contracts/PortalCommerceValidation.ts';
import {buildPaymentCallV2,mapPaymentViewV2} from '../supabase/functions/concierge-payments/methods.ts';
import {mapPaymentView} from '../supabase/functions/concierge-payments/contract.ts';
const id='10000000-0000-4000-8000-000000000001',client='10000000-0000-4000-8000-000000000002',third='10000000-0000-4000-8000-000000000003',day='2026-10-31',now='2026-10-31T12:00:00Z',hash='a'.repeat(64),unknown={state:'unknown'} as const;
const known=<T>(value:T)=>({state:'known' as const,value});
const selection={publication:{version:1,documentSchemaVersion:3 as const},decisionId:'serum_choice',productId:'serum_10'};
const terms={checkedOn:day,sourceUrl:'https://shop.example.com/returns',summary:'checked actual item, final sale',openedAllowed:false,deadline:{kind:'final_sale' as const},returnCost:{kind:'known' as const,cents:0}};
const identity={name:'exact serum',variant:known('gel'),strength:known('10%'),sizeLabel:known('30 ml')};
const line:FrozenProductLine={lineId:'line_serum',selection,identity,quantity:2,retailer:'retailer',seller:'actual seller',fulfiller:unknown,sourceUrl:'https://shop.example.com/item',checkedOn:day,unitPrice:{cents:1500,checkedOn:day},lineTotalCents:3000,returnTerms:terms};
const draftLine:ProductQuoteLineDraft={lineId:line.lineId,selection:known(selection),identity,quantity:known(2),retailer:known(line.retailer),seller:known(line.seller),fulfiller:unknown,sourceUrl:known(line.sourceUrl),checkedOn:known(day),unitPrice:known(line.unitPrice),returnTerms:prepareCommerceReturnTerms(terms)};
const target={quoteId:id,quoteVersion:1,termsHash:hash};
const payment={quoteId:id,quoteVersion:1,shippingAddressVersion:1,serviceCents:0,productCents:3000,totalCents:3000,paymentOptionId:third};
const commercePayment={...payment,currency:'USD' as const};
const assessment:ServiceRefundAssessment={state:'supported',basis:{policy:'first_three_monthly_periods',termsVersion:1,firstPublicationOn:known('2024-01-31'),periods:[{ordinal:1,claimId:id,quoteId:id,serviceCents:10000,verifiedAt:now,period:{startOn:'2024-01-31',endOn:'2024-02-29'}},{ordinal:2,claimId:client,quoteId:client,serviceCents:10000,verifiedAt:now,period:{startOn:'2024-02-29',endOn:'2024-03-29'}},{ordinal:3,claimId:third,quoteId:third,serviceCents:10000,verifiedAt:now,period:{startOn:'2024-03-29',endOn:'2024-04-29'}}],periodThreeEndsOn:known('2024-04-29'),requestDeadline:known('2024-05-29'),broaderPromiseRef:null},refundableCents:30000,eligibility:'eligible'};
globalThis.fetch=async()=>{throw Error('external_network_forbidden');};
test('safe incomplete quote storage never promotes known selection to payable identity or cost',()=>{
 const body=emptyProductQuoteDraft();assert.deepEqual(readCommerceCommand({schemaVersion:1,action:'save_product_quote_draft_v1',requestId:id,clientId:client,draftId:null,expectedQuoteDraftRevision:0,body}).action,'save_product_quote_draft_v1');
 assert.equal(commerceLineReady(draftLine),true);assert.equal(commerceLineReady({...emptyProductQuoteLine('new_line'),selection:known(selection)}),false);
 for(const delta of [{seller:known(' \t')},{identity:{...identity,variant:unknown}},{identity:{...identity,strength:unknown}},{quantity:unknown},{returnTerms:emptyProductQuoteLine('empty').returnTerms},{unitPrice:known({cents:0,checkedOn:day})}])assert.equal(commerceLineReady({...draftLine,...delta}),false);
});
test('frozen lines bind exact all-in facts, genuine known zero and known final sale',()=>{
 checkFrozenCommerceLine(line);assert.throws(()=>checkFrozenCommerceLine({...line,lineTotalCents:2999}));assert.throws(()=>checkFrozenCommerceLine({...line,identity:{...identity,sizeLabel:unknown}}));
});
test('guarantee validates actual first-three calendar allocations, not a 90-day invented deadline',()=>{
 checkServiceRefundAssessment(assessment);assert.throws(()=>checkServiceRefundAssessment({...assessment,refundableCents:29999}));assert.throws(()=>checkServiceRefundAssessment({...assessment,basis:{...assessment.basis,requestDeadline:known('2024-05-30')}}));
});
import {mapCommerceResult,collectCommerceComponents,checkCommerceQuoteHeader} from '../src/contracts/PortalCommerceMapping.ts';
import type {CommerceCommand,CommerceReceipt,CommerceQuoteHeader,CommerceComponentsPage,CommerceSnapshot,CommerceObligation} from '../src/contracts/PortalCommerce.ts';
import {commerceActions,commerceReadActions,commerceWriteActions,commerceTaskActions,commerceFailureCode} from '../src/contracts/PortalCommerceValues.ts';
import {commerceReturnCap,commerceAddCalendarDays,commerceInstantMicros} from '../src/contracts/PortalCommerceValidation.ts';
const snapshot:CommerceSnapshot={revision:1,paymentRevision:1,serviceRevision:1,asOfDay:day,hash};
const cursor=(n:number)=>`c:${hash}:${third}:${n}`;
const option={id:third,recipientVersion:1,recipient:{method:'cash_app' as const,name:'synthetic recipient',cashtag:'$SyntheticPayee'},available:true};
const address={version:1,address:{recipientName:'synthetic client',line1:'1 test street',line2:'',city:'Madison',region:'WI',postalCode:'53703',countryCode:'US'}};
const header:CommerceQuoteHeader={kind:'quote',currency:'USD',target,clientId:client,publication:selection.publication,selectionHash:hash,lineCount:1,optionCount:1,availableOptionCount:1,productSubtotalCents:3000,tax:{cents:0,checkedOn:day},shipping:{cents:0,checkedOn:day},serviceCents:0,servicePeriod:null,totalCents:3000,address,acceptance:{id:third,target,acceptedBy:client,acceptedAt:now},status:'payable',canPay:true,issuedAt:now};
const read={schemaVersion:1 as const,action:'read_quote_components_v1' as const,snapshot,cursor:null,limit:100,quote:{kind:'issued' as const,target},component:'lines' as const};
const page:CommerceComponentsPage={schemaVersion:1,clientId:client,snapshot,quote:read.quote,component:'lines',total:1,entries:[line],nextCursor:null};
const ctx={actorId:client,requestHash:null};
const receipt:CommerceReceipt={schemaVersion:1,requestId:id,commandHash:hash,action:'accept_product_quote_v1',clientId:client,entity:{kind:'quote_acceptance',id:third,revision:1},subject:{kind:'quote',id},quote:target,lineId:null,revision:1,recordedBy:client,recordedAt:now,paymentBasis:null,payment:null};
test('component reader refuses a missing complete first page and all pages are required',()=>{
 assert.throws(()=>mapCommerceResult(read,{...page,entries:[]},ctx),/unavailable/);
 assert.equal(collectCommerceComponents([{command:read,page}]).length,1);
 assert.throws(()=>collectCommerceComponents([{command:read,page:{...page,nextCursor:cursor(1)}}]));
});
test('READ status cannot bless a cross-kind historical receipt subject',()=>{
 const c={schemaVersion:1 as const,action:'request_status_v1' as const,requestId:id};assert.deepEqual(mapCommerceResult(c,{status:'committed',receipt},ctx),{status:'committed',receipt});
 assert.throws(()=>mapCommerceResult(c,{status:'committed',receipt:{...receipt,subject:{kind:'obligation',id}}},ctx),/unavailable/);
});
test('strict closed commands infer client and preserve opaque IDs and complete immutable targets',async()=>{
 const c=readCommerceCommand({schemaVersion:1,action:'accept_product_quote_v1',requestId:id,quote:target});assert.deepEqual(buildCommerceRpc(c),{name:'concierge_commerce_command_v1',args:{p_command:c}});
 for(const delta of [{clientId:third},{role:'owner'},{rpc:'concierge_write'},{approved:true},{serviceRole:'PRIVATE'},{privateSourceIds:[id]}])assert.throws(()=>readCommerceCommand({...c,...delta}));
 assert.throws(()=>readCommerceCommand({...c,schemaVersion:2}));assert.throws(()=>readCommerceCommand({...c,action:'confirm_payment'}));
 const reordered={quote:{termsHash:hash,quoteVersion:1,quoteId:id.toUpperCase()},requestId:id,action:'accept_product_quote_v1',schemaVersion:1};assert.equal(await hashCommerceCommand(c),await hashCommerceCommand(readCommerceCommand(reordered)));assert.notEqual(await hashCommerceCommand(c),await hashCommerceCommand(readCommerceCommand({...c,quote:{...target,quoteVersion:2}})));
 assert.equal(commerceTaskActions.length,0);assert.equal(commerceActions.length,commerceReadActions.length+commerceWriteActions.length);
});
test('actual V2 claim invariants are retained and verified gross differs from fees/net',()=>{
 const c={schemaVersion:1,action:'submit_payment_claim_v1',requestId:id,expectedPaymentRevision:0,quote:target,payment:commercePayment,evidenceId:null};readCommerceCommand(c);assert.equal(buildPaymentCallV2({schemaVersion:2,action:'submit_claim',requestId:id,expectedRevision:0,...payment,evidenceId:null},client).name,'concierge_payment_write_v2');
 for(const change of [{totalCents:2999},{serviceCents:2500},{productCents:.5},{paymentOptionId:'not_uuid'},{shippingAddressVersion:null}])assert.throws(()=>readCommerceCommand({...c,payment:{...commercePayment,...change}}));
 assert.throws(()=>readCommerceCommand({...c,quote:{...target,quoteVersion:2}}));
 const confirm={schemaVersion:1,action:'confirm_payment_v1',requestId:id,clientId:client,expectedPaymentRevision:0,quote:target,payment:commercePayment,claimId:third,receiptVerified:true,receipt:{grossCents:3000,feeCents:known(100),netCents:known(2900),receivedAt:unknown,privateReference:'PRIVATE_RECEIPT'}};readCommerceCommand(confirm);
 for(const delta of [{grossCents:2900},{feeCents:known(101)},{netCents:known(2999)}])assert.throws(()=>readCommerceCommand({...confirm,receipt:{...confirm.receipt,...delta}}));
 assert.throws(()=>readCommerceCommand({...confirm,receiptVerified:false}));
});
test('private destinations match actual three recipient variants without a receiving default',()=>{
 const recipients=[{method:'zelle',name:'Synthetic Person',email:'synthetic@example.com',phone:'+1 202 555 0100'},{method:'cash_app',name:'Synthetic Person',cashtag:'$SyntheticPayee'},{method:'apple_cash',name:'Synthetic Person',phone:'+1 202 555 0100'}];
 for(const recipient of recipients){assert.deepEqual(readPrivateRepaymentDestination(recipient),recipient);const q={id,version:1,publicationVersion:0,currency:'USD',status:'payable',serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000,contractVersion:2,paymentOptions:[{...option,recipient}]};const raw={schemaVersion:2,revision:0,quotes:[q],claims:[],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:null,shippingAddresses:[]};assert.deepEqual(mapPaymentViewV2(raw).quotes[0]!.paymentOptions[0]!.recipient,recipient);}
 for(const bad of [{method:'zelle',name:'x',email:'x@example.com',phone:null},{method:'apple_cash',name:'x',phone:'bad'},{method:'cash_app',name:'x',cashtag:'https://bad.example.com'},{...recipients[0],apiKey:'PRIVATE'}])assert.throws(()=>readPrivateRepaymentDestination(bad));
});
test('checked zero and final-sale are complete; unknown shipping/address/method or acceptance cannot pay',()=>{
 checkCommerceQuoteHeader(header);checkCommerceQuoteHeader({...header,acceptance:null,canPay:false});checkCommerceQuoteHeader({...header,availableOptionCount:0,canPay:false});
 for(const delta of [{tax:{cents:1,checkedOn:day}},{acceptance:null},{availableOptionCount:0},{acceptance:{...header.acceptance!,acceptedBy:third}},{address:{...address,version:0}}])assert.throws(()=>checkCommerceQuoteHeader({...header,...delta}));
 for(const extra of [{startedOn:day},{privateReceipt:'PRIVATE'},{referralPayee:{name:'PRIVATE'}},{sourceManifest:{count:1,hash}}])assert.throws(()=>mapCommerceResult({schemaVersion:1,action:'read_commerce_detail_v1',snapshot,entity:{kind:'quote',id,revision:1}},{schemaVersion:1,clientId:client,snapshot,detail:{...header,...extra}},ctx),/unavailable/);
});
test('positive receipt binds exact intent, actor, subject, terms and READ uncertainty semantics',()=>{
 const c=readCommerceCommand({schemaVersion:1,action:'accept_product_quote_v1',requestId:id,quote:target});assert.deepEqual(mapCommerceResult(c,receipt,{...ctx,requestHash:hash}),receipt);
 for(const delta of [{commandHash:'b'.repeat(64)},{requestId:third},{clientId:third},{recordedBy:third},{quote:{...target,quoteVersion:2}},{entity:{...receipt.entity,kind:'purchase'}},{privateReference:'PRIVATE'}])assert.throws(()=>mapCommerceResult(c,{...receipt,...delta},{...ctx,requestHash:hash}),/uncertain/);
 assert.equal(commerceFailureCode('request_status_v1'),'unavailable');assert.equal(commerceFailureCode('record_purchase_v2'),'uncertain');assert.throws(()=>mapCommerceResult(c,{ok:true},{...ctx,requestHash:hash}),/uncertain/);
});
test('snapshot/cursor/owner/page heads fail closed, with no history reconstruction of current state',()=>{
 assert.deepEqual(mapCommerceResult(read,page,ctx),page);
 for(const delta of [{clientId:third},{snapshot:{...snapshot,revision:2}},{entries:[line,line]},{nextCursor:`c:${'b'.repeat(64)}:${third}:1`}])assert.throws(()=>mapCommerceResult(read,{...page,...delta},ctx),/unavailable/);
 assert.throws(()=>readCommerceCommand({...read,cursor:cursor(1),snapshot:null}));assert.throws(()=>readCommerceCommand({...read,cursor:`c:${'b'.repeat(64)}:${third}:1`}));
 assert.throws(()=>readCommerceCommand({...read,quote:{kind:'draft',target:{draftId:id,revision:1,contentHash:hash,selectionHash:hash}}}));
});
test('return quantity/refund ceiling preserves source remainder math; money stages stay distinct',()=>{
 assert.equal(commerceReturnCap({quantity:3,unitPriceCents:100,taxCents:1,shippingCents:0},1,0),101);assert.equal(commerceReturnCap({quantity:3,unitPriceCents:100,taxCents:1,shippingCents:0},1,201),100);
 assert.throws(()=>commerceReturnCap({quantity:1,unitPriceCents:100,taxCents:0,shippingCents:0},2,0));
 const e={status:'retailer_funds_received',note:'actual receipt',expectedRefundCents:3000,retailerRefundCents:3000,clientRepaidCents:null,policyCheckedOn:day};const c={schemaVersion:1,action:'record_product_return_event_v1',requestId:id,clientId:client,returnId:third,expectedReturnRevision:0,event:e,occurredAt:unknown,privateReference:'PRIVATE_RETAILER'};readCommerceCommand(c);assert.throws(()=>readCommerceCommand({...c,event:{...e,clientRepaidCents:3000}}));assert.throws(()=>readCommerceCommand({...c,photoIds:[id]}));
 readCommerceCommand({schemaVersion:1,action:'record_founder_fault_resolution_v1',requestId:id,clientId:client,returnId:third,expectedReturnRevision:0,resolution:'manual_repayment_required',reason:'wrong item ordered by founder',confirmationReference:'PRIVATE_ACTUAL_CONVERSATION'});
});
test('calendar/elapsed clocks validate actual supplied basis, early/pending periods and unknown legacy amounts',()=>{
 assert.equal(commerceAddCalendarDays('2024-02-29',30),'2024-03-30');assert.equal(commerceInstantMicros('2026-11-01T01:30:00.000001-05:00')-commerceInstantMicros('2026-11-01T01:30:00.000001-06:00'),-3600000000n);
 const early:ServiceRefundAssessment={...assessment,basis:{...assessment.basis,firstPublicationOn:unknown,periods:[{...assessment.basis.periods[0]!,period:null}],periodThreeEndsOn:unknown,requestDeadline:unknown},refundableCents:10000};checkServiceRefundAssessment(early);checkServiceRefundAssessment({state:'unavailable',code:'legacy_payment_provenance_required'});
 assert.throws(()=>checkServiceRefundAssessment({...assessment,basis:{...assessment.basis,periods:[assessment.basis.periods[0]!,assessment.basis.periods[0]!]}}));
 assert.throws(()=>checkServiceRefundAssessment({...early,basis:{...early.basis,periods:[{...early.basis.periods[0]!,serviceCents:2500}]}} as never));
 const c={schemaVersion:1,action:'request_service_refund_v1',requestId:id,reason:null};readCommerceCommand(c);for(const extra of [{eligible:true},{photoIds:[]},{adherence:'complete'},{fourthPaymentConfirmed:true},{clientId:third}])assert.throws(()=>readCommerceCommand({...c,...extra}));
});
import {hashFrozenCommerceTerms,checkFrozenCommerceComposition} from '../src/contracts/PortalCommerceMapping.ts';
import {resolveCommerceReturnWindow,commerceCalendarAdd} from '../src/contracts/PortalCommerceValidation.ts';
test('full frozen hash binds every line, address, option and terms, excluding current availability',async()=>{
 const digest=await hashFrozenCommerceTerms(header,[line],[option]);assert.notEqual(digest,await hashFrozenCommerceTerms({...header,address:{...address,version:2}},[line],[option]));assert.notEqual(digest,await hashFrozenCommerceTerms(header,[{...line,seller:'different actual seller'}],[option]));
 const noMethod={...header,availableOptionCount:0,canPay:false};assert.equal(digest,await hashFrozenCommerceTerms(noMethod,[line],[{...option,available:false}]));
 const q={...header,target:{...target,termsHash:digest},acceptance:{...header.acceptance!,target:{...target,termsHash:digest}}};const quote={kind:'issued' as const,target:q.target};const lp={command:{...read,quote},page:{...page,quote}};const op={command:{...read,quote,component:'payment_options' as const},page:{schemaVersion:1 as const,clientId:client,snapshot,quote,component:'payment_options' as const,total:1,entries:[option],nextCursor:null}};
 await checkFrozenCommerceComposition(q,[lp],[op]);await assert.rejects(checkFrozenCommerceComposition(q,[{...lp,page:{...lp.page,entries:[{...line,seller:'changed'}]}}],[op]));
 assert.throws(()=>checkCommerceQuoteHeader({...q,acceptance:{...q.acceptance!,target}}));
});
test('relative policy waits for actual delivery, preserves separate shipping cutoff and never Start',()=>{
 const policy={...terms,deadline:{kind:'relative' as const,days:30,anchor:'delivery' as const,shipWithinDays:25}};const original=JSON.stringify(policy);assert.deepEqual(resolveCommerceReturnWindow(policy,day,null),{kind:'unresolved',reason:'awaiting_actual_delivery'});
 const delivery={eventId:id,occurredOn:known('2024-02-29'),reportedBy:known(client),recordedBy:client,recordedAt:now};assert.deepEqual(resolveCommerceReturnWindow(policy,day,delivery),{kind:'resolved',returnBy:'2024-03-30',shipBy:'2024-03-25',anchor:{kind:'delivery',eventId:id,occurredOn:'2024-02-29'}});assert.equal(JSON.stringify(policy),original);assert.equal(commerceCalendarAdd('2024-01-31',90),'2024-04-30');
 assert.deepEqual(resolveCommerceReturnWindow({...terms,deadline:{kind:'absolute',returnBy:'2024-03-30',shipBy:'2024-03-25'}},day,null),{kind:'resolved',returnBy:'2024-03-30',shipBy:'2024-03-25',anchor:{kind:'absolute'}});
 readCommerceCommand({schemaVersion:1,action:'confirm_product_received_v1',requestId:id,purchaseId:third,expectedFulfillmentRevision:0,occurredOn:unknown});assert.throws(()=>readCommerceCommand({schemaVersion:1,action:'confirm_product_received_v1',requestId:id,purchaseId:third,expectedFulfillmentRevision:0,occurredOn:unknown,startedOn:day}));
});
test('service obligation clock is later actual request/details, 48 elapsed hours, separate from bank receipt',()=>{
 const obligation:CommerceObligation={kind:'obligation',id,clientId:client,revision:1,stream:'service_refund',sourceId:third,clock:{kind:'service_request_and_details',requestId:third,requestedAt:'2026-11-01T01:30:00.000001-05:00',detailsId:id,detailsConfirmedAt:known('2026-11-01T01:30:00.000001-06:00'),detailsRecordedAt:'2026-11-01T01:30:00.000001-06:00'},amount:known(10000),triggerAt:known('2026-11-01T07:30:00.000001Z'),initiateBy:known('2026-11-03T07:30:00.000001Z'),initiatedCents:0,confirmedCents:0,state:'due',detailsId:id};
 const c={schemaVersion:1 as const,action:'read_commerce_detail_v1' as const,snapshot,entity:{kind:'obligation' as const,id,revision:1}},result={schemaVersion:1,clientId:client,snapshot,detail:obligation};assert.deepEqual(mapCommerceResult(c,result,ctx),result);
 for(const delta of [{triggerAt:known('2026-11-01T06:30:00.000001Z')},{initiateBy:known('2026-11-03T07:30:00.000002Z')},{confirmedCents:10000},{detailsId:third}])assert.throws(()=>mapCommerceResult(c,{...result,detail:{...obligation,...delta}},ctx),/unavailable/);
 const unknownClock={...obligation,clock:{kind:'awaiting_basis'},triggerAt:unknown,initiateBy:unknown,state:'awaiting_basis'};assert.doesNotThrow(()=>mapCommerceResult(c,{...result,detail:unknownClock},ctx));
});
test('public/private projections keep destinations, receipts and referral payees out of client records',()=>{
 const c={schemaVersion:1 as const,action:'read_commerce_v1' as const,snapshot,cursor:null,limit:100};const safe={schemaVersion:1,clientId:client,snapshot,entries:[{entity:{kind:'quote',id,revision:1},label:'exact quote',state:'settled',recordedAt:now}],nextCursor:null};assert.deepEqual(mapCommerceResult(c,safe,ctx),safe);
 for(const extra of [{privateDestination:option.recipient},{privateSource:'PRIVATE_SOURCE'},{referralPayee:'PRIVATE_PAYEE'},{bankReceipt:'PRIVATE_RECEIPT'}])assert.throws(()=>mapCommerceResult(c,{...safe,...extra},ctx),/^Error: unavailable$/);
 const privateRead={schemaVersion:1 as const,action:'read_private_commerce_v1' as const,clientId:client,snapshot,cursor:null,limit:100,entity:{kind:'obligation' as const,id,revision:1}};const details={kind:'repayment_details',id:third,obligationId:id,payeeId:client,destination:{method:'apple_cash',name:'PRIVATE_ACTUAL_PAYEE',phone:'+1 202 555 0100'},confirmation:{kind:'manual',confirmedAt:known(now),channel:known('call'),confirmationReference:'PRIVATE_CONFIRMATION'},recordedBy:id,recordedAt:now};const raw={schemaVersion:1,clientId:client,snapshot,entries:[details],nextCursor:null};assert.deepEqual(mapCommerceResult(privateRead,raw,{actorId:id,requestHash:null}),raw);assert.throws(()=>mapCommerceResult(c,raw,ctx),/unavailable/);assert.throws(()=>mapCommerceResult(privateRead,{...raw,entries:[{...details,obligationId:third}]},{actorId:id,requestHash:null}),/unavailable/);
});
test('referral projection is private, one actual first-payment trigger and no client-refund clawback',()=>{
 const c={schemaVersion:1 as const,action:'read_private_commerce_v1' as const,clientId:client,snapshot,cursor:null,limit:100,entity:{kind:'referral' as const,id,revision:1}};const e={kind:'referral',id,clientId:client,partnerId:third,payeeId:third,newReferralEvidence:{id:third,clientId:client,referralId:id,verificationReference:'PRIVATE_ACTUAL_NEWNESS_CHECK',verifiedBy:id,verifiedAt:now},award:{state:'earned',claimId:id,obligationId:third,newReferralEvidenceId:third,verifiedFirstServiceAt:now,amountCents:10000,initiateBy:'2026-11-02T12:00:00Z',initiatedAt:unknown},noClawback:true};const raw={schemaVersion:1,clientId:client,snapshot,entries:[e],nextCursor:null};assert.deepEqual(mapCommerceResult(c,raw,{actorId:id,requestHash:null}),raw);
 for(const delta of [{award:{...e.award,amountCents:2500}},{award:{...e.award,claimId:null}},{noClawback:false},{clientId:third},{award:{...e.award,initiateBy:'2026-11-03T12:00:00Z'}}])assert.throws(()=>mapCommerceResult(c,{...raw,entries:[{...e,...delta}]},{actorId:id,requestHash:null}),/unavailable/);
});
test('legacy quote/purchase truth is readable without claiming complete payable terms',()=>{
 const q={id,version:1,publicationVersion:0,currency:'USD',status:'payable',serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000};const old=mapPaymentView({revision:0,quotes:[q],claims:[],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:null,shippingAddresses:[]}).quotes[0]!;
 const c={schemaVersion:1 as const,action:'read_commerce_detail_v1' as const,snapshot,entity:{kind:'quote' as const,id,revision:1}};const raw={schemaVersion:1,clientId:client,snapshot,detail:{kind:'legacy_quote',clientId:client,quote:old,canPay:false,terms:'unrepresented'}};assert.deepEqual(mapCommerceResult(c,raw,ctx),raw);assert.throws(()=>mapCommerceResult(c,{...raw,detail:{...raw.detail,canPay:true}},ctx),/unavailable/);
});
test('source-valid 50 maximal UTF8 lines and 101 manual options remain complete in byte-bounded pages',async()=>{
 const text='🧴';const lines=Array.from({length:50},(_,i):FrozenProductLine=>({...line,lineId:`line_${i}`,selection:{...selection,decisionId:`decision_${i}`,productId:`product_${i}`},identity:{name:text.repeat(200),variant:known(text.repeat(200)),strength:known(text.repeat(200)),sizeLabel:known(text.repeat(200))},retailer:text.repeat(200),seller:text.repeat(200),fulfiller:known(text.repeat(200)),sourceUrl:'https://shop.example.com/'+('p'.repeat(1990)),returnTerms:{...terms,summary:text.repeat(2000),returnCost:{kind:'client_pays',description:text.repeat(2000)}}}));
 const options=Array.from({length:101},(_,i)=>({...option,id:`10000000-0000-4000-8000-${String(i+100).padStart(12,'0')}`}));
 const q={...header,lineCount:50,optionCount:101,availableOptionCount:101,productSubtotalCents:150000,totalCents:150000};const termsHash=await hashFrozenCommerceTerms(q,lines,options);q.target={...target,termsHash};q.acceptance={...q.acceptance!,target:q.target};const quote={kind:'issued' as const,target:q.target};
 const pack=(component:'lines'|'payment_options',entries:(FrozenProductLine|typeof option)[])=>{
  const pairs:Parameters<typeof collectCommerceComponents>[0]=[];let at=0,previous:string|null=null;
  while(at<entries.length){const start=at,chunk:(FrozenProductLine|typeof option)[]=[];while(at<entries.length){const next=entries[at]!;const trial={schemaVersion:1,clientId:client,snapshot,quote,component,total:entries.length,entries:[...chunk,next],nextCursor:cursor(at+1)};if(chunk.length>=100||commerceJsonBytes(trial)>400000)break;chunk.push(next);at++;}assert.ok(at>start);const command={...read,quote,component,cursor:previous};const result={schemaVersion:1,clientId:client,snapshot,quote,component,total:entries.length,entries:chunk,nextCursor:at<entries.length?cursor(at):null};const mapped=mapCommerceResult(command,result,ctx) as CommerceComponentsPage;pairs.push({command,page:mapped});previous=result.nextCursor;}
  return pairs;
 };
 const lp=pack('lines',lines),op=pack('payment_options',options);assert.ok(lp.length>1);assert.equal(op.length,2);await checkFrozenCommerceComposition(q,lp,op);assert.equal(collectCommerceComponents(lp).length,50);assert.equal(collectCommerceComponents(op).length,101);
 const last=lp.at(-1)!;if(last.page.component!=='lines')throw Error('line_page_expected');await assert.rejects(checkFrozenCommerceComposition(q,[...lp.slice(0,-1),{...last,page:{...last.page,entries:last.page.entries.slice(1)}}],op));assert.throws(()=>collectCommerceComponents([lp[0]!,lp[0]!,...lp.slice(1)]));
 const perLine=lines.map(l=>({schemaVersion:1,action:'save_product_quote_line_v1',requestId:id,clientId:client,target:{draftId:id,revision:1,contentHash:hash,selectionHash:hash},body:{...draftLine,lineId:l.lineId,selection:known(l.selection),identity:l.identity,retailer:known(l.retailer),seller:known(l.seller),fulfiller:l.fulfiller,sourceUrl:known(l.sourceUrl),returnTerms:prepareCommerceReturnTerms(l.returnTerms)}}));assert.ok(perLine.every(c=>commerceJsonBytes(c)<500000));perLine.forEach(readCommerceCommand);
 const sourceQuote={id,version:1,publicationVersion:0,currency:'USD',status:'payable',serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000,contractVersion:2,paymentOptions:options};assert.equal(mapPaymentViewV2({schemaVersion:2,revision:0,quotes:[sourceQuote],claims:[],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:null,shippingAddresses:[]}).quotes[0]!.paymentOptions.length,101);
 const actualIssue={schemaVersion:2,action:'issue_quote',requestId:id,clientId:client,expectedRevision:0,publicationVersion:1,shippingAddressVersion:1,serviceCents:0,servicePeriod:null,items:lines.map(l=>({recommendationId:l.selection.decisionId,quantity:l.quantity,unitPriceCents:l.unitPrice.cents,lineTotalCents:l.lineTotalCents})),productSubtotalCents:150000,taxCents:0,shippingCents:0,productTotalCents:150000,totalCents:150000};buildPaymentCallV2(actualIssue,id);assert.throws(()=>buildPaymentCallV2({...actualIssue,items:[...actualIssue.items,{...actualIssue.items[0]!,recommendationId:'extra_51'}]},id));
 console.log(JSON.stringify({commerceMaxVector:{lineCount:50,optionCount:101,completeFrozenLinesBytes:commerceJsonBytes(lines),linePages:lp.length,optionPages:op.length,largestPage:Math.max(...[...lp,...op].map(p=>commerceJsonBytes(p.page))),largestLineSave:Math.max(...perLine.map(commerceJsonBytes))}}));
});
test('command bytes, JSON objects, bounds and canonical hashes reject lossy or executable shapes',()=>{
 const valid={schemaVersion:1,action:'request_service_refund_v1',requestId:id,reason:null};
 for(const delta of [{reason:()=>true},{reason:{type:'React'}},{reason:undefined},{amountCents:Number.NaN},{method:'wire'},{privateDestination:{credentials:'PRIVATE'}}])assert.throws(()=>readCommerceCommand({...valid,...delta}));
 const getter={...valid};Object.defineProperty(getter,'reason',{enumerable:true,get(){throw Error('PRIVATE_GETTER');}});assert.throws(()=>readCommerceCommand(getter));assert.throws(()=>readCommerceCommand({...valid,reason:'x'.repeat(500001)}));
 const paidReceipt={...receipt,action:'confirm_payment_v1',entity:{kind:'quote',id,revision:1},subject:null,quote:target,paymentBasis:commercePayment,payment:{schemaVersion:2,revision:1,operation:'confirm_payment',quoteId:id,claimId:third,status:'confirmed',serviceUnlocked:false,serviceAccessStatus:null,productOrderStatus:'ready_to_purchase',paymentOptionId:third}};
 assert.doesNotThrow(()=>mapCommerceResult({schemaVersion:1,action:'request_status_v1',requestId:id},{status:'committed',receipt:paidReceipt},ctx));assert.throws(()=>mapCommerceResult({schemaVersion:1,action:'request_status_v1',requestId:id},{status:'committed',receipt:{...paidReceipt,payment:{...paidReceipt.payment,productOrderStatus:null}}},ctx),/unavailable/);
});
test('confirmed period basis retains actual one-calendar-month semantics and unknown broader promises stay unavailable',()=>{
 const invalid={...assessment,basis:{...assessment.basis,periods:[{...assessment.basis.periods[0]!,period:{startOn:'2024-01-31',endOn:'2024-03-01'}},...assessment.basis.periods.slice(1)]}};assert.throws(()=>checkServiceRefundAssessment(invalid));
 assert.throws(()=>checkServiceRefundAssessment({...assessment,basis:{...assessment.basis,broaderPromiseRef:id}}));
});
test('final-sale inapplicable return costs do not invent a zero-cost refund promise',()=>{
 checkFrozenCommerceLine({...line,returnTerms:{...terms,returnCost:{kind:'not_applicable',reason:'final_sale'}}});assert.throws(()=>checkFrozenCommerceLine({...line,returnTerms:{...terms,deadline:{kind:'relative',days:30,anchor:'delivery',shipWithinDays:null},returnCost:{kind:'not_applicable',reason:'final_sale'}}}));
 checkServiceRefundAssessment({state:'unavailable',code:'broader_terms_unavailable',termsRef:id});
});
test('canonical financial history preserves claim versus verified receipt and unknown actual receipt date',()=>{
 const c={schemaVersion:1 as const,action:'read_commerce_history_v1' as const,snapshot,cursor:null,limit:100,entity:{kind:'quote' as const,id,revision:1}};
 const base={subject:c.entity,occurredOn:unknown,occurredAt:unknown,recordedAt:now,reportedBy:unknown,recordedBy:id,channel:unknown};const entries=[{...base,id,kind:'payment_claim',body:{kind:'payment_claim',claim:{id:third,...payment,status:'submitted_unverified',evidenceId:null}}},{...base,id:third,kind:'payment_confirmed',body:{kind:'payment_confirmed',claimId:third,quoteId:id,serviceCents:0,productCents:3000,totalCents:3000,verifiedAt:now,receivedAt:unknown}}];const raw={schemaVersion:1,clientId:client,snapshot,entries,nextCursor:null};assert.deepEqual(mapCommerceResult(c,raw,ctx),raw);
 assert.throws(()=>mapCommerceResult(c,{...raw,entries:[{...entries[1]!,body:{...entries[1]!.body,totalCents:2999}}]},ctx),/unavailable/);assert.throws(()=>mapCommerceResult(c,{...raw,entries:[{...entries[0]!,privateReceiptReference:'PRIVATE'}]},ctx),/unavailable/);
});
test('all proposed write specimens retain domain references, not free-form effects or actor claims',()=>{
 const draft={draftId:id,revision:1,contentHash:hash,selectionHash:hash},event={status:'reviewing',note:'checking actual seller',expectedRefundCents:null,retailerRefundCents:null,clientRepaidCents:null,policyCheckedOn:day};
 const specimens:unknown[]=[
 {action:'save_product_quote_line_v1',clientId:client,target:draft,body:draftLine},
 {action:'issue_product_quote_v1',clientId:client,target:draft,expectedPaymentRevision:1},
 {action:'record_purchase_v2',clientId:client,expectedServiceRevision:0,quote:target,lineId:line.lineId,quantity:2,taxCents:0,shippingCents:0,purchasedOn:day,orderReference:'PRIVATE_ORDER',receiptReference:'PRIVATE_RECEIPT'},
 {action:'record_fulfillment_v1',clientId:client,purchaseId:id,expectedFulfillmentRevision:0,channel:'text',event:{kind:'delivery_confirmed',occurredOn:unknown,basis:'confirmed_client_report'}},
 {action:'record_quote_reconciliation_v1',clientId:client,oldQuote:target,expectedReconciliationRevision:0,replacementQuote:null,acceptanceId:null,reason:'seller changed',disposition:'awaiting_client'},
 {action:'record_product_return_event_v1',clientId:client,returnId:id,expectedReturnRevision:0,event,occurredAt:unknown,privateReference:''},
 {action:'record_service_refund_request_v1',clientId:client,occurredAt:now,channel:'call',confirmedClientRequest:true,reason:null},
 {action:'record_repayment_details_v1',clientId:client,obligationId:id,expectedObligationRevision:0,destination:option.recipient,confirmedWithPayee:true,confirmedAt:unknown,channel:known('call'),confirmationReference:'PRIVATE_CONFIRMATION'},
 {action:'record_obligation_event_v1',clientId:client,obligationId:id,expectedObligationRevision:0,event:{kind:'repayment_initiated',amountCents:10000,occurredAt:now,detailsId:third,privateReference:'PRIVATE_MANUAL_TRANSFER'}},
 {action:'record_referral_v1',clientId:client,expectedReferralRevision:0,partnerId:id,payeeId:third,designationReference:'PRIVATE_ACTUAL_DESIGNATION',newReferralEvidence:null}];
 for(const specimen of specimens){const c={schemaVersion:1,requestId:id,...specimen as object};readCommerceCommand(c);for(const extra of [{actorId:third},{recordedAt:now},{provider:'bank'},{fundsTransferred:true},{paymentCredentials:'PRIVATE'},{approvedBy:third}])assert.throws(()=>readCommerceCommand({...c,...extra}));}
});
test('partly checked return terms autosave verbatim without becoming complete payable terms',()=>{
 const body={...draftLine,returnTerms:{checkedOn:known(day),sourceUrl:known('https://shop.example.com/returns'),summary:'',openedAllowed:unknown,deadline:{kind:'relative',days:unknown,anchor:known('delivery'),shipWithinDays:unknown},returnCost:{kind:'known',cents:unknown}}};
 const c={schemaVersion:1,action:'save_product_quote_line_v1',requestId:id,clientId:client,target:{draftId:id,revision:1,contentHash:hash,selectionHash:hash},body};assert.deepEqual(readCommerceCommand(c),c);assert.equal(commerceLineReady(body as never),false);
});
test('composition pairs cannot substitute a different component request and private pages reject duplicate identities',()=>{
 assert.throws(()=>collectCommerceComponents([{command:{...read,component:'payment_options'},page}]));
 const c={schemaVersion:1 as const,action:'read_private_commerce_v1' as const,clientId:client,snapshot,cursor:null,limit:100,entity:{kind:'purchase' as const,id,revision:1}};const entry={kind:'purchase_references',purchaseId:id,orderReference:'PRIVATE_ORDER',receiptReference:'PRIVATE_RECEIPT'};assert.throws(()=>mapCommerceResult(c,{schemaVersion:1,clientId:client,snapshot,entries:[entry,entry],nextCursor:null},{actorId:id,requestHash:null}),/unavailable/);
});
function commerceCompileCases():void{
 // @ts-expect-error Client acceptance has no owner selector or authority fields.
 const wrongOwner:CommerceCommand={schemaVersion:1,action:'accept_product_quote_v1',requestId:id,quote:target,clientId:third};
 // @ts-expect-error A provider acknowledgement cannot replace exact actual receipt verification.
 const falseVerification:Extract<CommerceCommand,{action:'confirm_payment_v1'}>['receiptVerified']=false;
 // @ts-expect-error Clinical Start is not a fulfillment event.
 const started:Extract<CommerceCommand,{action:'record_fulfillment_v1'}>['event']={kind:'started',occurredOn:known(day)};
 void wrongOwner;void falseVerification;void started;
}
void commerceCompileCases;
test('unknown manual repayment outcome remains uncertain rather than a proved failure',()=>{
 const base={schemaVersion:1,action:'record_obligation_event_v1',requestId:id,clientId:client,obligationId:id,expectedObligationRevision:0};assert.throws(()=>readCommerceCommand({...base,event:{kind:'failed',occurredAt:now,initiationEventId:third,reasonCode:'unknown_outcome'}}));
 readCommerceCommand({...base,event:{kind:'uncertain',occurredAt:now,initiationEventId:third,reasonCode:'unknown_outcome'}});
});
// CF1-CF3 corrections: immutable calendar and actual confirmation time are distinct from paid/recorded facts.
function cfPaidAssessment(count:1|2|3):Extract<ServiceRefundAssessment,{state:'supported'}>{
 const starts=['2026-01-01','2026-02-01','2026-03-01'] as const,ends=['2026-02-01','2026-03-01','2026-04-01'] as const,ids=[id,client,third];
 return {state:'supported',basis:{policy:'first_three_monthly_periods',termsVersion:1,firstPublicationOn:known('2026-01-01'),periods:Array.from({length:count},(_,i)=>({ordinal:(i+1) as 1|2|3,claimId:ids[i]!,quoteId:ids[i]!,serviceCents:10000,verifiedAt:'2026-01-01T12:00:00Z',period:{startOn:starts[i]!,endOn:ends[i]!}})),periodThreeEndsOn:known('2026-04-01'),requestDeadline:known('2026-05-01'),broaderPromiseRef:null},refundableCents:count*10000,eligibility:'eligible'};
}
const cfRequest='2026-04-01T12:00:00Z',cfRecorded='2026-04-03T12:00:00Z';
const cfManualDetails={schemaVersion:1,action:'record_repayment_details_v1',requestId:id,clientId:client,obligationId:third,expectedObligationRevision:0,destination:option.recipient,confirmedWithPayee:true,confirmedAt:known(cfRequest),channel:known('call'),confirmationReference:'PRIVATE_ACTUAL_APR1_CONFIRMATION'};
const cfClock={kind:'service_request_and_details',requestId:third,requestedAt:cfRequest,detailsId:id,detailsConfirmedAt:known(cfRequest),detailsRecordedAt:cfRecorded};
const cfObligation={kind:'obligation',id,clientId:client,revision:1,stream:'service_refund',sourceId:third,clock:cfClock,amount:known(10000),triggerAt:known(cfRequest),initiateBy:known(cfRecorded),initiatedCents:0,confirmedCents:0,state:'due',detailsId:id};
const cfRead={schemaVersion:1 as const,action:'read_commerce_detail_v1' as const,snapshot,entity:{kind:'obligation' as const,id,revision:1}};
const cfEnvelope=(detail:unknown)=>({schemaVersion:1,clientId:client,snapshot,detail});
test('CF1 calendar end/deadline is representable with one or two actual paid allocations',()=>{
 for(const count of [1,2,3] as const){const a=cfPaidAssessment(count);assert.doesNotThrow(()=>checkServiceRefundAssessment(a));assert.equal(a.refundableCents,count*10000);assert.equal(a.basis.periods.length,count);}
});
test('CF2 manual complete details preserve actual confirmation separately from recording time',()=>{
 assert.deepEqual(readCommerceCommand(cfManualDetails),cfManualDetails);
 assert.deepEqual(mapCommerceResult(cfRead,cfEnvelope(cfObligation),ctx),cfEnvelope(cfObligation));
});
test('CF2 old recording-time clock cannot silently extend an actual repayment obligation',()=>{
 const {detailsConfirmedAt:_actual,...oldClock}=cfClock;assert.throws(()=>mapCommerceResult(cfRead,cfEnvelope({...cfObligation,clock:oldClock,triggerAt:known(cfRecorded),initiateBy:known('2026-04-05T12:00:00Z')}),ctx),/unavailable/);
});
test('CF3 first period and subsequent paid periods must match retained activation calendar',()=>{
 const one=cfPaidAssessment(1);if(one.state!=='supported')throw Error('expected supported');const wrong={...one,basis:{...one.basis,firstPublicationOn:known('2026-01-02'),periods:[one.basis.periods[0]!,{...one.basis.periods[0]!,ordinal:2,claimId:client,quoteId:client,period:{startOn:'2026-03-01',endOn:'2026-04-01'}}],periodThreeEndsOn:unknown,requestDeadline:unknown},refundableCents:20000};
 const c={schemaVersion:1 as const,action:'read_commerce_detail_v1' as const,snapshot,entity:{kind:'refund_request' as const,id:third,revision:1}};assert.throws(()=>mapCommerceResult(c,cfEnvelope({kind:'refund_request',id:third,clientId:client,revision:1,requestedAt:cfRequest,recordedBy:client,assessment:wrong,obligationId:null}),ctx),/unavailable/);
});
import {deriveServiceRefundCalendar} from '../src/contracts/PortalCommerceValidation.ts';
test('CF1 retained month-end/leap/DST calendar is independent of one/two/three paid sums and refund classification',()=>{
 for(const [anchor,ends,deadline] of [['2023-01-31',['2023-02-28','2023-03-28','2023-04-28'],'2023-05-28'],['2024-01-31',['2024-02-29','2024-03-29','2024-04-29'],'2024-05-29'],['2024-02-29',['2024-03-29','2024-04-29','2024-05-29'],'2024-06-28'],['2026-03-08',['2026-04-08','2026-05-08','2026-06-08'],'2026-07-08']] as const){
  const calendar=deriveServiceRefundCalendar(known(anchor));assert.deepEqual(calendar,{periodThreeEndsOn:known(ends[2]),requestDeadline:known(deadline)});
  for(const count of [1,2,3] as const){const a=cfPaidAssessment(count);a.basis.firstPublicationOn=known(anchor);a.basis.periods=a.basis.periods.map((p,i)=>({...p,period:{startOn:i===0?anchor:ends[i-1]!,endOn:ends[i]!}}));Object.assign(a.basis,calendar);const original=JSON.stringify(a.basis.periods);checkServiceRefundAssessment(a);checkServiceRefundAssessment({...a,eligibility:'outside_recorded_terms'});assert.equal(JSON.stringify(a.basis.periods),original);assert.equal(a.refundableCents,count*10000);}
 }
 assert.deepEqual(deriveServiceRefundCalendar(unknown),{periodThreeEndsOn:unknown,requestDeadline:unknown});
});
test('CF3 gaps, overlap, initial anchor mismatch and missing known guarantee dates reject through the positive mapper',()=>{
 const a=cfPaidAssessment(2),cmd={schemaVersion:1 as const,action:'read_commerce_detail_v1' as const,snapshot,entity:{kind:'refund_request' as const,id:third,revision:1}};
 const base={kind:'refund_request',id:third,clientId:client,revision:1,requestedAt:cfRequest,recordedBy:client,assessment:a,obligationId:null};assert.deepEqual(mapCommerceResult(cmd,cfEnvelope(base),ctx),cfEnvelope(base));
 const bases=[{...a.basis,firstPublicationOn:known('2026-01-02')},{...a.basis,periods:[{...a.basis.periods[0]!,period:{startOn:'2025-12-01',endOn:'2026-01-01'}},a.basis.periods[1]!]},{...a.basis,periods:[a.basis.periods[0]!,{...a.basis.periods[1]!,period:{startOn:'2026-03-01',endOn:'2026-04-01'}}]},{...a.basis,periods:[a.basis.periods[0]!,{...a.basis.periods[1]!,period:{startOn:'2026-01-31',endOn:'2026-02-28'}}]},{...a.basis,periodThreeEndsOn:unknown,requestDeadline:unknown},{...a.basis,requestDeadline:known('2026-05-02')}];
 for(const basis of bases)assert.throws(()=>mapCommerceResult(cmd,cfEnvelope({...base,assessment:{...a,basis}}),ctx),/unavailable/);
});
test('CF3 one actual prepublication pending payment is valid; impossible pending/activated combinations are not converted',()=>{
 const a=cfPaidAssessment(1),pending={...a,basis:{...a.basis,firstPublicationOn:unknown,periods:[{...a.basis.periods[0]!,period:null}],periodThreeEndsOn:unknown,requestDeadline:unknown}};checkServiceRefundAssessment(pending);checkServiceRefundAssessment({...pending,basis:{...pending.basis,periods:[]},refundableCents:0});
 for(const bad of [{...pending,basis:{...pending.basis,firstPublicationOn:known('2026-01-01')}},{...pending,basis:{...pending.basis,periods:a.basis.periods}},{...pending,basis:{...pending.basis,periods:[pending.basis.periods[0]!,{...pending.basis.periods[0]!,ordinal:2,claimId:client,quoteId:client}]},refundableCents:20000},{...a,basis:{...a.basis,periods:[]},refundableCents:0}])assert.throws(()=>checkServiceRefundAssessment(bad as ServiceRefundAssessment));
 checkServiceRefundAssessment({state:'unavailable',code:'period_basis_unavailable'});checkServiceRefundAssessment({state:'unavailable',code:'legacy_payment_provenance_required'});checkServiceRefundAssessment({state:'unavailable',code:'broader_terms_unavailable',termsRef:id});
});
test('CF2 late recording cannot change known request/confirmation max; microseconds and elapsed DST remain exact',()=>{
 for(const [requestedAt,confirmedAt,recordedAt,trigger,deadline] of [[cfRequest,cfRequest,cfRecorded,cfRequest,cfRecorded],['2026-04-02T12:00:00Z',cfRequest,cfRecorded,'2026-04-02T12:00:00Z','2026-04-04T12:00:00Z'],[cfRequest,cfRecorded,cfRecorded,cfRecorded,'2026-04-05T12:00:00Z'],['2026-11-01T01:30:00.000001-05:00','2026-11-01T01:30:00.000001-06:00','2026-11-04T12:00:00Z','2026-11-01T07:30:00.000001Z','2026-11-03T07:30:00.000001Z']] as const){
  const value={...cfObligation,clock:{...cfClock,requestedAt,detailsConfirmedAt:known(confirmedAt),detailsRecordedAt:recordedAt},triggerAt:known(trigger),initiateBy:known(deadline)};assert.doesNotThrow(()=>mapCommerceResult(cfRead,cfEnvelope(value),ctx));assert.doesNotThrow(()=>mapCommerceResult(cfRead,cfEnvelope({...value,clock:{...value.clock,detailsRecordedAt:'2026-11-10T12:00:00Z'}}),ctx));
 }
 assert.throws(()=>mapCommerceResult(cfRead,cfEnvelope({...cfObligation,initiateBy:known('2026-04-03T12:00:00.000001Z')}),ctx),/unavailable/);
});
test('CF2 unknown actual historical confirmation stays unknown despite a precise later record or date-bearing reference',()=>{
 const details={...cfManualDetails,confirmedAt:unknown,channel:unknown,confirmationReference:'PRIVATE_CONFIRMED_APR1_MUST_NOT_PARSE'};assert.deepEqual(readCommerceCommand(details),details);
 const value={...cfObligation,clock:{...cfClock,detailsConfirmedAt:unknown},triggerAt:unknown,initiateBy:unknown,state:'awaiting_basis'};assert.doesNotThrow(()=>mapCommerceResult(cfRead,cfEnvelope(value),ctx));
 for(const bad of [{...value,state:'due'},{...value,triggerAt:known(cfRecorded),initiateBy:known('2026-04-05T12:00:00Z')},{...value,clock:{...value.clock,confirmationReference:'PRIVATE_DATE_INFERENCE'}}])assert.throws(()=>mapCommerceResult(cfRead,cfEnvelope(bad),ctx),/unavailable/);
});
test('CF2 private details preserve actual manual/client provenance and reject impossible record time or public disclosure',()=>{
 const c={schemaVersion:1 as const,action:'read_private_commerce_v1' as const,clientId:client,snapshot,cursor:null,limit:100,entity:{kind:'obligation' as const,id,revision:1}};
 const confirmation={kind:'manual',confirmedAt:known(cfRequest),channel:known('call'),confirmationReference:'PRIVATE_REAL_CALL'};const detail={kind:'repayment_details',id:third,obligationId:id,payeeId:client,destination:option.recipient,confirmation,recordedBy:id,recordedAt:cfRecorded};const result={schemaVersion:1,clientId:client,snapshot,entries:[detail],nextCursor:null};assert.deepEqual(mapCommerceResult(c,result,{actorId:id,requestHash:null}),result);
 assert.doesNotThrow(()=>mapCommerceResult(c,{...result,entries:[{...detail,confirmation:{...confirmation,confirmedAt:unknown,channel:unknown}}]},{actorId:id,requestHash:null}));
 const direct={...detail,confirmation:{kind:'client_submission',receivedAt:cfRequest},recordedBy:client};assert.doesNotThrow(()=>mapCommerceResult(c,{...result,entries:[direct]},{actorId:id,requestHash:null}));
 for(const bad of [{...detail,confirmation:{...confirmation,confirmedAt:known('2026-04-04T12:00:00Z')}},{...direct,recordedBy:id},{...direct,confirmation:{...direct.confirmation,receivedAt:'2026-04-04T12:00:00Z'}},{...detail,confirmation:{...confirmation,sourceLocator:'PRIVATE_SOURCE'}}])assert.throws(()=>mapCommerceResult(c,{...result,entries:[bad]},{actorId:id,requestHash:null}),/unavailable/);
 assert.throws(()=>mapCommerceResult({schemaVersion:1,action:'read_commerce_history_v1',snapshot,cursor:null,limit:100,entity:c.entity},result,ctx),/unavailable/);
});
test('CF2 self-submitted details cannot assert an actual receipt timestamp, manual authority, channel or recording time',()=>{
 const own={schemaVersion:1,action:'submit_repayment_details_v1',requestId:id,obligationId:third,expectedObligationRevision:0,destination:option.recipient};readCommerceCommand(own);
 for(const extra of [{confirmedAt:known(cfRequest)},{receivedAt:cfRequest},{recordedAt:cfRecorded},{channel:known('call')},{confirmationReference:'PRIVATE'},{confirmedWithPayee:true},{clientId:client}])assert.throws(()=>readCommerceCommand({...own,...extra}));
 for(const bad of [{...cfManualDetails,confirmedAt:null},{...cfManualDetails,confirmedAt:cfRequest},{...cfManualDetails,confirmedAt:{state:'known',value:'2026-02-30T12:00:00Z'}},{...cfManualDetails,channel:'call'},{...cfManualDetails,recordedAt:cfRequest}])assert.throws(()=>readCommerceCommand(bad));
});
test('CF3 an identified unsupported historical calendar is unavailable with its immutable terms version, never converted',()=>{
 const assessment={state:'unavailable',code:'calendar_policy_unavailable',terms:{id:third,version:2}};assert.doesNotThrow(()=>checkServiceRefundAssessment(assessment as ServiceRefundAssessment));
 const c={schemaVersion:1 as const,action:'read_commerce_detail_v1' as const,snapshot,entity:{kind:'refund_request' as const,id:third,revision:1}},detail={kind:'refund_request',id:third,clientId:client,revision:1,requestedAt:cfRequest,recordedBy:client,assessment,obligationId:null};assert.deepEqual(mapCommerceResult(c,cfEnvelope(detail),ctx),cfEnvelope(detail));
 assert.throws(()=>mapCommerceResult(c,cfEnvelope({...detail,assessment:{...assessment,terms:{id:third,version:0}}}),ctx),/unavailable/);
});
test('CF1-CF3 original paid identities survive an early completed repayment without a fabricated extra period or timing fact',()=>{
 const a=cfPaidAssessment(1),paid=JSON.stringify(a.basis.periods),request={kind:'refund_request',id:third,clientId:client,revision:1,requestedAt:cfRequest,recordedBy:client,assessment:a,obligationId:id};
 const readRequest={schemaVersion:1 as const,action:'read_commerce_detail_v1' as const,snapshot,entity:{kind:'refund_request' as const,id:third,revision:1}};assert.doesNotThrow(()=>mapCommerceResult(readRequest,cfEnvelope(request),ctx));
 const repaid={...cfObligation,clock:{...cfClock,detailsConfirmedAt:unknown},triggerAt:unknown,initiateBy:unknown,initiatedCents:10000,confirmedCents:10000,state:'confirmed'};assert.doesNotThrow(()=>mapCommerceResult(cfRead,cfEnvelope(repaid),ctx));
 checkServiceRefundAssessment(a);assert.equal(JSON.stringify(a.basis.periods),paid);assert.equal(a.refundableCents,10000);assert.equal(a.basis.periods.length,1);assert.deepEqual(a.basis.requestDeadline,known('2026-05-01'));
});
test('CP1 an unrepresented currency cannot be a complete new quote, and the currency digest is explicit',async()=>{
 const digest=await hashFrozenCommerceTerms(header,[line],[option]);console.log('currency-pin-fixture-digest',digest);assert.notEqual(digest,'de3a0e92711bf585689e37dcbd71dfcbdef306b38ebcf4159cf18fc7e26bce42');assert.equal(digest,'88cdd39cd7fe65e5dc4db2e9b6221bd9c5f69fad621e57aba3cf44feb75e2d67');
 const {currency:_currency,...missing}=header as CommerceQuoteHeader&{currency?:string};assert.throws(()=>checkCommerceQuoteHeader(missing as CommerceQuoteHeader));assert.throws(()=>checkCommerceQuoteHeader({...header,currency:'EUR'} as never));
});
test('CP1 missing currency cannot become an exact sent-payment claim basis',()=>{
 const {currency:_currency,...missing}=commercePayment;assert.throws(()=>readCommerceCommand({schemaVersion:1,action:'submit_payment_claim_v1',requestId:id,expectedPaymentRevision:0,quote:target,payment:missing,evidenceId:null}));
});
function cpReturnCommand(revision=23):Extract<CommerceCommand,{action:'request_product_return_v1'}>{return readCommerceCommand({schemaVersion:1,action:'request_product_return_v1',requestId:id,purchaseId:third,expectedReturnRevision:revision,quantity:1,reason:'actual unopened item',condition:'unopened'}) as Extract<CommerceCommand,{action:'request_product_return_v1'}>;}
function cpReturnReceipt(commandHash:string,serviceRevision:number,entityRevision:number):CommerceReceipt{return {...receipt,commandHash,action:'request_product_return_v1',entity:{kind:'return_case',id:third,revision:entityRevision},subject:{kind:'purchase',id:third},quote:null,revision:serviceRevision};}
test('CP2 canonical service receipt23-to24 is separate from proposed entity revision9',async()=>{
 const c=cpReturnCommand(),commandHash=await hashCommerceCommand(c),ack=cpReturnReceipt(commandHash,24,9);assert.deepEqual(mapCommerceResult(c,ack,{...ctx,requestHash:commandHash}),ack);
});
test('CP2 entity revision cannot impersonate the canonical service acknowledgement clock',async()=>{
 const c=cpReturnCommand(),commandHash=await hashCommerceCommand(c);assert.throws(()=>mapCommerceResult(c,cpReturnReceipt(commandHash,9,9),{...ctx,requestHash:commandHash}),/uncertain/);
});
import {commerceReturnBasis} from '../src/contracts/PortalCommerceValidation.ts';
test('CP2 mapped snapshot serviceRevision23 constructs return CAS while entity9 and fulfillment5 stay separate',async()=>{
 const current={...snapshot,serviceRevision:23};const purchase={kind:'purchase',clientId:client,id:third,revision:9,quote:target,line,quantity:2,taxCents:0,shippingCents:0,purchasedOn:day,fulfillmentRevision:5,fulfillmentState:'shipped',delivery:null,returnWindow:{kind:'final_sale'},recordedBy:id,recordedAt:now};
 const readPurchase={schemaVersion:1 as const,action:'read_commerce_detail_v1' as const,snapshot:current,entity:{kind:'purchase' as const,id:third,revision:9}},response={schemaVersion:1,clientId:client,snapshot:current,detail:purchase};const mapped=mapCommerceResult(readPurchase,response,ctx);if(!('snapshot'in mapped))throw Error('mapped snapshot required');
 assert.deepEqual(commerceReturnBasis(mapped.snapshot),{expectedReturnRevision:23});const c=readCommerceCommand({...cpReturnCommand(),...commerceReturnBasis(mapped.snapshot)});assert.ok('expectedReturnRevision'in c);assert.equal(c.expectedReturnRevision,23);assert.equal(purchase.revision,9);assert.equal(purchase.fulfillmentRevision,5);
 const commandHash=await hashCommerceCommand(c),ack=cpReturnReceipt(commandHash,24,9);assert.doesNotThrow(()=>mapCommerceResult(c,ack,{...ctx,requestHash:commandHash}));assert.throws(()=>mapCommerceResult(cpReturnCommand(9),ack,{...ctx,requestHash:commandHash}),/uncertain/);
 assert.throws(()=>mapCommerceResult({...readPurchase,snapshot:{...current,serviceRevision:22}},response,ctx),/unavailable/);assert.throws(()=>commerceReturnBasis({revision:9}),/invalid_input/);assert.throws(()=>commerceReturnBasis({...current,serviceRevision:null}));
 assert.throws(()=>readCommerceCommand({...c,expectedReturnRevision:undefined}));
});
test('CP2 canonical service CAS acknowledgement applies to retained return events, fault resolution and purchases',async()=>{
 const commands=[
 {schemaVersion:1,action:'record_product_return_event_v1',requestId:id,clientId:client,returnId:third,expectedReturnRevision:23,event:{status:'reviewing',note:'actual policy check',expectedRefundCents:null,retailerRefundCents:null,clientRepaidCents:null,policyCheckedOn:day},occurredAt:unknown,privateReference:''},
 {schemaVersion:1,action:'record_founder_fault_resolution_v1',requestId:id,clientId:client,returnId:third,expectedReturnRevision:23,resolution:'manual_repayment_required',reason:'wrong item actually ordered',confirmationReference:'PRIVATE_CLIENT_CONFIRMATION'},
 {schemaVersion:1,action:'record_purchase_v2',requestId:id,clientId:client,expectedServiceRevision:23,quote:target,lineId:line.lineId,quantity:2,taxCents:0,shippingCents:0,purchasedOn:day,orderReference:'PRIVATE_ORDER',receiptReference:'PRIVATE_RECEIPT'}];
 for(const raw of commands){const c=readCommerceCommand(raw);if(c.action!=='record_product_return_event_v1'&&c.action!=='record_founder_fault_resolution_v1'&&c.action!=='record_purchase_v2')throw Error('service-backed command required');const commandHash=await hashCommerceCommand(c);const ack:CommerceReceipt={...receipt,commandHash,action:c.action,entity:{kind:c.action==='record_purchase_v2'?'purchase':'event',id:third,revision:9},subject:{kind:c.action==='record_purchase_v2'?'quote':'return_case',id:c.action==='record_purchase_v2'?id:third},quote:c.action==='record_purchase_v2'?target:null,revision:24};assert.deepEqual(mapCommerceResult(c,ack,{...ctx,requestHash:commandHash}),ack);
  for(const wrong of [0,9,23,25])assert.throws(()=>mapCommerceResult(c,{...ack,revision:wrong},{...ctx,requestHash:commandHash}),/uncertain/);
  assert.deepEqual(mapCommerceResult({schemaVersion:1,action:'request_status_v1',requestId:id},{status:'committed',receipt:ack},{...ctx,requestHash:commandHash}),{status:'committed',receipt:ack});
 }
});
test('CP1 USD is closed in header/basis, legacy descriptors receive no currency override and older data is not defaulted',()=>{
 for(const currency of [undefined,null,'usd','EUR','USDT',0]){
  assert.throws(()=>checkCommerceQuoteHeader({...header,currency} as never));
  assert.throws(()=>readCommerceCommand({schemaVersion:1,action:'submit_payment_claim_v1',requestId:id,expectedPaymentRevision:0,quote:target,payment:{...commercePayment,currency},evidenceId:null}));
 }
 const descriptor=buildCommerceRpc({schemaVersion:1,action:'submit_payment_claim_v1',requestId:id,expectedPaymentRevision:0,quote:target,payment:commercePayment,evidenceId:null});assert.equal(descriptor.args.p_command.action,'submit_payment_claim_v1');
 const {currency:_currency,...missing}=header;const command={schemaVersion:1 as const,action:'read_commerce_detail_v1' as const,snapshot,entity:{kind:'quote' as const,id,revision:1}};assert.throws(()=>mapCommerceResult(command,{schemaVersion:1,clientId:client,snapshot,detail:missing},ctx),/unavailable/);
});
function cpIssueCommand():Extract<CommerceCommand,{action:'issue_product_quote_v1'}>{return readCommerceCommand({schemaVersion:1,action:'issue_product_quote_v1',requestId:id,clientId:client,target:{draftId:third,revision:9,contentHash:hash,selectionHash:hash},expectedPaymentRevision:23}) as Extract<CommerceCommand,{action:'issue_product_quote_v1'}>;}
function cpIssueReceipt(commandHash:string,revision=24):CommerceReceipt{return {...receipt,commandHash,action:'issue_product_quote_v1',entity:{kind:'quote',id,revision:4},subject:{kind:'quote_draft',id:third},quote:{...target,quoteVersion:4},revision};}
test('CP2 issuance payment-head23-to24 is independent of actual quote/entity version4',async()=>{
 const c=cpIssueCommand(),commandHash=await hashCommerceCommand(c),r=cpIssueReceipt(commandHash);assert.deepEqual(mapCommerceResult(c,r,{...ctx,requestHash:commandHash}),r);
});
test('CP2 issuance cannot acknowledge quote version4 as canonical payment head24',async()=>{
 const c=cpIssueCommand(),commandHash=await hashCommerceCommand(c);assert.throws(()=>mapCommerceResult(c,cpIssueReceipt(commandHash,4),{...ctx,requestHash:commandHash}),/uncertain/);
});
test('CP2 issuance binds both clocks, exact returned quote and original draft/client/actor/hash, with historical status',async()=>{
 const c=cpIssueCommand(),commandHash=await hashCommerceCommand(c),r=cpIssueReceipt(commandHash);
 for(const delta of [{revision:0},{revision:4},{revision:23},{revision:25},{entity:{...r.entity,kind:'purchase'}},{entity:{...r.entity,id:third}},{entity:{...r.entity,revision:5}},{quote:{...r.quote!,quoteId:third}},{quote:{...r.quote!,quoteVersion:5}},{subject:{kind:'quote_draft',id}},{clientId:third},{recordedBy:third},{requestId:third},{commandHash:'b'.repeat(64)},{action:'accept_product_quote_v1'},{payment:{schemaVersion:2,operation:'issue_quote'}}])assert.throws(()=>mapCommerceResult(c,{...r,...delta},{...ctx,requestHash:commandHash}),/uncertain/);
 const changed=readCommerceCommand({...c,target:{...c.target,revision:10}}),changedHash=await hashCommerceCommand(changed);assert.throws(()=>mapCommerceResult(changed,r,{...ctx,requestHash:changedHash}),/uncertain/);
 const later={...snapshot,paymentRevision:100};assert.doesNotThrow(()=>mapCommerceResult({schemaVersion:1,action:'read_commerce_v1',snapshot:later,cursor:null,limit:100},{schemaVersion:1,clientId:client,snapshot:later,entries:[],nextCursor:null},ctx));
 assert.deepEqual(mapCommerceResult({schemaVersion:1,action:'request_status_v1',requestId:id},{status:'committed',receipt:r},{...ctx,requestHash:commandHash}),{status:'committed',receipt:r});assert.equal(r.entity.revision,4);assert.equal(r.revision,24);assert.equal(r.quote!.quoteVersion,4);assert.equal(r.payment,null);
});
function cpCurrencyCompileCases():void{
 // @ts-expect-error A new exact sent-payment basis must explicitly contain currency.
 const ambiguous:import('../src/contracts/PortalCommerce.ts').ManualPaymentBasis=payment;
 // @ts-expect-error Canonical Commerce currency is the closed USD literal, never a conversion choice.
 const converted:CommerceQuoteHeader['currency']='EUR';
 void ambiguous;void converted;
}
void cpCurrencyCompileCases;
test('RP1 explicit trusted referral evidence reference and null relation both have a closed source shape',()=>{
 const base={schemaVersion:1,action:'record_referral_v1',requestId:id,clientId:client,expectedReferralRevision:0,partnerId:id,payeeId:third,designationReference:'PRIVATE_PAYEE_DESIGNATION'};
 assert.deepEqual(readCommerceCommand({...base,newReferralEvidence:null}),{...base,newReferralEvidence:null});assert.deepEqual(readCommerceCommand({...base,newReferralEvidence:{verificationReference:'PRIVATE_ACTUAL_NEW_REFERRAL_CHECK'}}),{...base,newReferralEvidence:{verificationReference:'PRIVATE_ACTUAL_NEW_REFERRAL_CHECK'}});
});
test('RP1 private earned referral binds server-derived evidence identity to this exact client/referral',()=>{
 const command={schemaVersion:1 as const,action:'read_private_commerce_v1' as const,clientId:client,snapshot,cursor:null,limit:100,entity:{kind:'referral' as const,id,revision:1}};
 const evidence={id:third,clientId:client,referralId:id,verificationReference:'PRIVATE_ACTUAL_EVIDENCE',verifiedBy:third,verifiedAt:now};const entry={kind:'referral',id,clientId:client,partnerId:third,payeeId:third,newReferralEvidence:evidence,award:{state:'earned',claimId:id,obligationId:third,newReferralEvidenceId:third,verifiedFirstServiceAt:now,amountCents:10000,initiateBy:'2026-11-02T12:00:00Z',initiatedAt:unknown},noClawback:true};const raw={schemaVersion:1,clientId:client,snapshot,entries:[entry],nextCursor:null};assert.deepEqual(mapCommerceResult(command,raw,{actorId:third,requestHash:null}),raw);
});
test('RP1 proof input has no caller actor/time/newness flag, and late private evidence cannot reset the first-payment clock',()=>{
 const base={schemaVersion:1,action:'record_referral_v1',requestId:id,clientId:client,expectedReferralRevision:0,partnerId:id,payeeId:third,designationReference:'PRIVATE_PAYEE',newReferralEvidence:{verificationReference:'PRIVATE_ACTUAL_REFERENCE'}};
 for(const proof of [{verificationReference:''},{verificationReference:'x'.repeat(1001)},{verificationReference:'PRIVATE',verifiedBy:id},{verificationReference:'PRIVATE',verifiedAt:now},{verificationReference:'PRIVATE',new_customer:true},{verificationReference:'PRIVATE',approved:true}])assert.throws(()=>readCommerceCommand({...base,newReferralEvidence:proof}));
 const c={schemaVersion:1 as const,action:'read_private_commerce_v1' as const,clientId:client,snapshot,cursor:null,limit:100,entity:{kind:'referral' as const,id,revision:1}};const evidence={id:third,clientId:client,referralId:id,verificationReference:'PRIVATE_VERIFIED_LATER',verifiedBy:third,verifiedAt:'2026-11-05T12:00:00Z'};const entry={kind:'referral',id,clientId:client,partnerId:third,payeeId:third,newReferralEvidence:evidence,award:{state:'earned',claimId:id,obligationId:third,newReferralEvidenceId:third,verifiedFirstServiceAt:now,amountCents:10000,initiateBy:'2026-11-02T12:00:00Z',initiatedAt:unknown},noClawback:true};const raw={schemaVersion:1,clientId:client,snapshot,entries:[entry],nextCursor:null};assert.deepEqual(mapCommerceResult(c,raw,{actorId:third,requestHash:null}),raw);
 for(const extra of [{newReferralEvidence:null},{newReferralEvidence:{...evidence,clientId:third}},{newReferralEvidence:{...evidence,referralId:third}},{award:{...entry.award,newReferralEvidenceId:id}},{award:{...entry.award,initiateBy:'2026-11-07T12:00:00Z'}}])assert.throws(()=>mapCommerceResult(c,{...raw,entries:[{...entry,...extra}]},{actorId:third,requestHash:null}),/unavailable/);
 const unproven={...entry,newReferralEvidence:null,award:{state:'unproven',code:'new_referral_provenance_required'}};assert.doesNotThrow(()=>mapCommerceResult(c,{...raw,entries:[unproven]},{actorId:third,requestHash:null}));
 assert.throws(()=>mapCommerceResult({schemaVersion:1,action:'read_commerce_v1',snapshot,cursor:null,limit:100},raw,ctx),/unavailable/);
});
test('RQ1 funded no-purchase reconciliation carries a known debt with an unknown clock, never a retailer trigger',()=>{
 const command={schemaVersion:1 as const,action:'read_commerce_detail_v1' as const,snapshot,entity:{kind:'obligation' as const,id,revision:1}};
 const debt={kind:'obligation',id,clientId:client,revision:1,stream:'quote_reconciliation',sourceId:third,clock:{kind:'awaiting_basis'},amount:known(3000),triggerAt:unknown,initiateBy:unknown,initiatedCents:0,confirmedCents:0,state:'awaiting_basis',detailsId:null};const envelope={schemaVersion:1,clientId:client,snapshot,detail:debt};assert.deepEqual(mapCommerceResult(command,envelope,ctx),envelope);
 for(const delta of [{triggerAt:known(now),initiateBy:known('2026-11-02T12:00:00Z')},{clock:{kind:'retailer_funds',returnId:third,eventId:id,receivedAt:unknown}},{state:'due'},{amount:unknown}])assert.throws(()=>mapCommerceResult(command,{...envelope,detail:{...debt,...delta}},ctx));
 const initiated={...debt,initiatedCents:1000,state:'initiated',detailsId:third};assert.deepEqual(mapCommerceResult(command,{...envelope,detail:initiated},ctx),{...envelope,detail:initiated});assert.throws(()=>mapCommerceResult(command,{...envelope,detail:{...initiated,initiatedCents:3001}},ctx));
});
test('RQ1 private original-funds linkage binds exact reconciliation/obligation and rejects excess or invented return evidence',()=>{
 const command={schemaVersion:1 as const,action:'read_private_commerce_v1' as const,clientId:client,snapshot,cursor:null,limit:100,entity:{kind:'obligation' as const,id,revision:1}};
 const funds={kind:'reconciliation_funds',obligationId:id,reconciliationId:third,oldQuoteTarget:target,confirmationClaimId:third,originalProductCents:3000,owedCents:3000,cause:'material_quote_change'};const raw={schemaVersion:1,clientId:client,snapshot,entries:[funds],nextCursor:null};assert.deepEqual(mapCommerceResult(command,raw,{actorId:third,requestHash:null}),raw);
 for(const delta of [{obligationId:third},{owedCents:3001},{originalProductCents:0},{returnId:third},{retailerReceiptReference:'PRIVATE_FALSE_RETAILER'},{serviceCents:10000}])assert.throws(()=>mapCommerceResult(command,{...raw,entries:[{...funds,...delta}]},{actorId:third,requestHash:null}));
 const publicCommand={schemaVersion:1 as const,action:'read_commerce_history_v1' as const,snapshot,cursor:null,limit:100,entity:command.entity};assert.throws(()=>mapCommerceResult(publicCommand,raw,ctx));
});
