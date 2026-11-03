import type {PlanShape} from './PortalRebuildValidation.ts';
import {readReviewShape,reviewJsonBytes} from './PortalReviewValidation.ts';
import {requireValue} from './ConciergePortalValidation.ts';
import {buildPaymentCallV2} from '../../supabase/functions/concierge-payments/methods.ts';
import {MAX_PAYMENT_CENTS} from '../../supabase/functions/concierge-payments/contract.ts';
import type {CommerceCommand,CommerceRpcCall,FrozenProductLine,ProductQuoteLineDraft,ProductQuoteDraftBody,PrivateRepaymentDestination,ManualPaymentBasis,ServiceRefundAssessment} from './PortalCommerce.ts';
import {commerceActions,commerceReadActions,commerceCommandMaxBytes,commerceQuoteLinesMax,commerceReturnStatuses} from './PortalCommerceValues.ts';
export const co=(fields:Record<string,PlanShape>):PlanShape=>({type:'object',fields});
export const ca=(item:PlanShape,max=100,min=0,unique=false):PlanShape=>({type:'array',item,max,min,unique});
export const ce=(...values:(string|number|boolean)[]):PlanShape=>({type:'enum',values});
export const ct=(max=4000,empty=false):PlanShape=>({type:'text',max,empty});
export const cn=(shape:PlanShape):PlanShape=>({...shape,nullable:true});
export const cu=(...variants:PlanShape[]):PlanShape=>({type:'union',variants});
export const ck=(shape:PlanShape):PlanShape=>cu(co({state:ce('unknown')}),co({state:ce('known'),value:shape}));
export const cid:PlanShape={type:'identifier'},cUuid:PlanShape={type:'uuid'},cHash:PlanShape={type:'hash'},cDay:PlanShape={type:'date'},cInstant:PlanShape={type:'instant'},cBool:PlanShape={type:'boolean'};
export const cRev:PlanShape={type:'integer',min:0,max:Number.MAX_SAFE_INTEGER},cPositive:PlanShape={...cRev,min:1},cMoney:PlanShape={...cRev,max:MAX_PAYMENT_CENTS},cAmount:PlanShape={...cMoney,min:1};
export const cPublication=co({version:cPositive,documentSchemaVersion:ce(1,2,3)}),cQuote=co({quoteId:cUuid,quoteVersion:cPositive,termsHash:cHash}),cDraft=co({draftId:cUuid,revision:cRev,contentHash:cHash,selectionHash:cHash});
export const cSelection=co({publication:cPublication,decisionId:cid,productId:cid}),cCheckedMoney=co({cents:cMoney,checkedOn:cDay});
export const cStrength=cu(ck(ct(200)),co({state:ce('not_applicable'),reason:ct(1000)}));
export const cIdentity=co({name:ct(200,true),variant:ck(ct(200,true)),strength:cStrength,sizeLabel:ck(ct(200,true))});
export const cPolicy=co({checkedOn:cDay,sourceUrl:{type:'url'},summary:ct(2000),openedAllowed:cBool,deadline:cu(co({kind:ce('final_sale')}),co({kind:ce('absolute'),returnBy:cDay,shipBy:cn(cDay)}),co({kind:ce('relative'),days:cPositive,anchor:ce('purchase','delivery'),shipWithinDays:cn(cPositive)})),returnCost:cu(co({kind:ce('known'),cents:cMoney}),co({kind:ce('client_pays'),description:ct(2000)}),co({kind:ce('not_applicable'),reason:ce('final_sale')}))});
export const cDraftPolicy=co({checkedOn:ck(cDay),sourceUrl:ck({type:'url'}),summary:ct(2000,true),openedAllowed:ck(cBool),deadline:cu(co({kind:ce('unknown')}),co({kind:ce('final_sale')}),co({kind:ce('absolute'),returnBy:ck(cDay),shipBy:ck(cn(cDay))}),co({kind:ce('relative'),days:ck(cPositive),anchor:ck(ce('purchase','delivery')),shipWithinDays:ck(cn(cPositive))})),returnCost:cu(co({kind:ce('unknown')}),co({kind:ce('known'),cents:ck(cMoney)}),co({kind:ce('client_pays'),description:ct(2000,true)}),co({kind:ce('not_applicable'),reason:ce('final_sale')}))});
export const cDraftLine=co({lineId:cid,selection:ck(cSelection),identity:cIdentity,quantity:ck({...cPositive,max:100}),retailer:ck(ct(200,true)),seller:ck(ct(200,true)),fulfiller:ck(ct(200,true)),sourceUrl:ck({type:'url'}),checkedOn:ck(cDay),unitPrice:ck(cCheckedMoney),returnTerms:cDraftPolicy});
export const cFrozenLine=co({lineId:cid,selection:cSelection,identity:cIdentity,quantity:{...cPositive,max:100},retailer:ct(200),seller:ct(200),fulfiller:ck(ct(200)),sourceUrl:{type:'url'},checkedOn:cDay,unitPrice:cCheckedMoney,lineTotalCents:cAmount,returnTerms:cPolicy});
export const cPeriod=co({startOn:cDay,endOn:cDay});
export const cDraftBody=co({publication:ck(cPublication),lineIds:ca(cid,commerceQuoteLinesMax,0,true),tax:ck(cCheckedMoney),shipping:ck(cCheckedMoney),shippingAddressVersion:ck(cPositive),serviceCents:ck(ce(0,10000)),servicePeriod:cn(cPeriod),note:cn(ct())});
export const cSnapshot=co({revision:cRev,paymentRevision:cRev,serviceRevision:cRev,asOfDay:cDay,hash:cHash});
export const cEntity=co({kind:ce('quote_draft','quote','purchase','return_case','refund_request','obligation','referral','reconciliation','event','repayment_details','quote_acceptance'),id:cUuid,revision:cRev});
export const cPage={snapshot:cn(cSnapshot),cursor:cn(ct(160)),limit:{...cPositive,max:100}};
export const cQuoteSource=cu(co({kind:ce('draft'),target:cDraft}),co({kind:ce('issued'),target:cQuote}));
export const cAddress=co({recipientName:ct(200),line1:ct(200),line2:ct(200,true),city:ct(100),region:ct(100),postalCode:ct(20),countryCode:ct(2)});
export const cDestination=cu(co({method:ce('zelle'),name:ct(100),email:ct(254),phone:ct(4000)}),co({method:ce('cash_app'),name:ct(100),cashtag:ct(21)}),co({method:ce('apple_cash'),name:ct(100),phone:ct(4000)}));
export const cRepaymentConfirmation=cu(co({kind:ce('client_submission'),receivedAt:cInstant}),co({kind:ce('manual'),confirmedAt:ck(cInstant),channel:ck(ce('text','call','video','in_person')),confirmationReference:ct(1000)}));
export const cOption=co({id:cUuid,recipientVersion:cPositive,recipient:cDestination,available:cBool});
export const cPayment=co({currency:ce('USD'),quoteId:cUuid,quoteVersion:cPositive,shippingAddressVersion:cn(cPositive),serviceCents:ce(0,10000),productCents:cMoney,totalCents:cAmount,paymentOptionId:cUuid});
export const cFulfillment=cu(co({kind:ce('ordered'),occurredOn:ck(cDay)}),co({kind:ce('shipped'),occurredOn:ck(cDay),trackingReference:ct(1000)}),co({kind:ce('delivery_confirmed'),occurredOn:ck(cDay),basis:ce('founder_observed','confirmed_client_report')}));
export const cReturnEvent=co({status:ce(...commerceReturnStatuses),note:ct(),expectedRefundCents:cn(cMoney),retailerRefundCents:cn(cMoney),clientRepaidCents:cn(cMoney),policyCheckedOn:cn(cDay)});
export const cObligationEvent=cu(co({kind:ce('repayment_initiated'),amountCents:cAmount,occurredAt:cInstant,detailsId:cUuid,privateReference:ct(1000)}),co({kind:ce('receipt_confirmed'),amountCents:cAmount,occurredAt:cInstant,initiationEventId:cUuid,privateReference:ct(1000)}),co({kind:ce('failed'),occurredAt:cInstant,initiationEventId:cUuid,reasonCode:ce('rejected','returned')}),co({kind:ce('uncertain'),occurredAt:cInstant,initiationEventId:cUuid,reasonCode:ce('unknown_outcome')}));
const client={clientId:cUuid},write={requestId:cUuid},detail={snapshot:cSnapshot,entity:cEntity},components={...cPage,quote:cQuoteSource,component:ce('lines','payment_options')},history={...cPage,entity:cEntity};
export const commerceCommandFields:Record<CommerceCommand['action'],Record<string,PlanShape>>={
 read_commerce_v1:cPage,read_advisor_commerce_v1:{...client,...cPage},read_commerce_detail_v1:detail,read_advisor_commerce_detail_v1:{...client,...detail},read_quote_components_v1:components,read_advisor_quote_components_v1:{...client,...components},read_commerce_history_v1:history,read_advisor_commerce_history_v1:{...client,...history},read_private_commerce_v1:{...client,...history},request_status_v1:write,
 save_product_quote_draft_v1:{...write,...client,draftId:cn(cUuid),expectedQuoteDraftRevision:cRev,body:cDraftBody},save_product_quote_line_v1:{...write,...client,target:cDraft,body:cDraftLine},issue_product_quote_v1:{...write,...client,target:cDraft,expectedPaymentRevision:cRev},accept_product_quote_v1:{...write,quote:cQuote},
 submit_payment_claim_v1:{...write,expectedPaymentRevision:cRev,quote:cQuote,payment:cPayment,evidenceId:cn(cUuid)},confirm_payment_v1:{...write,...client,expectedPaymentRevision:cRev,quote:cQuote,payment:cPayment,claimId:cUuid,receiptVerified:ce(true),receipt:co({grossCents:cAmount,feeCents:ck(cMoney),netCents:ck(cMoney),receivedAt:ck(cInstant),privateReference:ct(1000)})},reject_payment_claim_v1:{...write,...client,expectedPaymentRevision:cRev,quote:cQuote,payment:cPayment,claimId:cUuid,reasonCode:ce('not_received','amount_mismatch','duplicate_claim','wrong_recipient')},
 record_purchase_v2:{...write,...client,expectedServiceRevision:cRev,quote:cQuote,lineId:cid,quantity:{...cPositive,max:100},taxCents:cMoney,shippingCents:cMoney,purchasedOn:cDay,orderReference:ct(1000),receiptReference:ct(1000)},record_fulfillment_v1:{...write,...client,purchaseId:cUuid,expectedFulfillmentRevision:cRev,channel:ce('portal','text','call','video','in_person'),event:cFulfillment},confirm_product_received_v1:{...write,purchaseId:cUuid,expectedFulfillmentRevision:cRev,occurredOn:ck(cDay)},record_quote_reconciliation_v1:{...write,...client,oldQuote:cQuote,expectedReconciliationRevision:cRev,replacementQuote:cn(cQuote),acceptanceId:cn(cUuid),reason:ct(),disposition:ce('awaiting_client','replacement_accepted','manual_repayment_required')},
 request_product_return_v1:{...write,purchaseId:cUuid,expectedReturnRevision:cRev,quantity:{...cPositive,max:100},reason:ct(2000),condition:ce('unopened','opened','used','damaged')},record_product_return_event_v1:{...write,...client,returnId:cUuid,expectedReturnRevision:cRev,event:cReturnEvent,occurredAt:ck(cInstant),privateReference:ct(1000,true)},record_founder_fault_resolution_v1:{...write,...client,returnId:cUuid,expectedReturnRevision:cRev,resolution:ce('replacement_quote_required','manual_repayment_required'),reason:ct(),confirmationReference:ct(1000)},
 request_service_refund_v1:{...write,reason:cn(ct())},record_service_refund_request_v1:{...write,...client,occurredAt:cInstant,channel:ce('text','call','video','in_person'),confirmedClientRequest:ce(true),reason:cn(ct())},submit_repayment_details_v1:{...write,obligationId:cUuid,expectedObligationRevision:cRev,destination:cDestination},record_repayment_details_v1:{...write,...client,obligationId:cUuid,expectedObligationRevision:cRev,destination:cDestination,confirmedWithPayee:ce(true),confirmedAt:ck(cInstant),channel:ck(ce('text','call','video','in_person')),confirmationReference:ct(1000)},record_obligation_event_v1:{...write,...client,obligationId:cUuid,expectedObligationRevision:cRev,event:cObligationEvent},record_referral_v1:{...write,...client,expectedReferralRevision:cRev,partnerId:cUuid,payeeId:cUuid,designationReference:ct(1000),newReferralEvidence:cn(co({verificationReference:ct(1000)}))}
};
export function readCommerceShape<T>(value:unknown,shape:PlanShape):T{return readReviewShape(value,shape) as T;}
export function commerceJsonBytes(value:unknown):number{return reviewJsonBytes(value);}
export function commerceCanonicalJson(value:unknown):string{commerceJsonBytes(value);const sorted=(v:unknown):unknown=>Array.isArray(v)?v.map(sorted):v!==null&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,x])=>[k,sorted(x)])):v;return JSON.stringify(sorted(value));}
export async function hashCommerceCommand(command:CommerceCommand):Promise<string>{const bytes=new TextEncoder().encode(commerceCanonicalJson(readCommerceCommand(command)));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
export function readPrivateRepaymentDestination(value:unknown):PrivateRepaymentDestination{
 const d=readCommerceShape<PrivateRepaymentDestination>(value,cDestination);requireValue(d.name.trim().length>0&&Array.from(d.name).length<=100&&!/[\u0000-\u001f\uD800-\uDFFF]/u.test(d.name));
 const phone=(p:string)=>/^\+?[\d() .-]+$/.test(p)&&p.replace(/\D/g,'').length>=10&&p.replace(/\D/g,'').length<=15;
 if(d.method==='zelle')requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)&&phone(d.phone));else if(d.method==='apple_cash')requireValue(phone(d.phone));else requireValue(/^\$[A-Za-z][A-Za-z0-9_]{0,19}$/.test(d.cashtag));return d;
}
export function readCommerceCommand(value:unknown):CommerceCommand{
 requireValue(commerceJsonBytes(value)<=commerceCommandMaxBytes);const row=value as Record<string,unknown>;requireValue(row!==null&&typeof row==='object'&&typeof row.action==='string'&&(commerceActions as readonly string[]).includes(row.action));const fields=commerceCommandFields[row.action as CommerceCommand['action']];requireValue(fields!==undefined);const c=readCommerceShape<CommerceCommand>(value,co({schemaVersion:ce(1),action:ce(row.action),...fields}));checkCommerceCommand(c);return c;
}
export function buildCommerceRpc(value:unknown):CommerceRpcCall{return {name:'concierge_commerce_command_v1',args:{p_command:readCommerceCommand(value)}};}
/** Pure preparation/read validation only. Live source/selection/funds authority is SQL work after pin. */
export function commerceLineReady(value:ProductQuoteLineDraft):boolean{
 try{readCommerceShape(value,cDraftLine);requireValue(value.selection.state==='known'&&value.quantity.state==='known'&&value.retailer.state==='known'&&value.seller.state==='known'&&value.sourceUrl.state==='known'&&value.checkedOn.state==='known'&&value.unitPrice.state==='known');
 checkFrozenCommerceLine({lineId:value.lineId,selection:value.selection.value,identity:value.identity,quantity:value.quantity.value,retailer:value.retailer.value,seller:value.seller.value,fulfiller:value.fulfiller,sourceUrl:value.sourceUrl.value,checkedOn:value.checkedOn.value,unitPrice:value.unitPrice.value,lineTotalCents:value.quantity.value*value.unitPrice.value.cents,returnTerms:freezeCommerceReturnTerms(value.returnTerms)});return true;}catch{return false;}
}
export function checkFrozenCommerceLine(value:FrozenProductLine):void{
 const v=readCommerceShape<FrozenProductLine>(value,cFrozenLine);requireValue(v.identity.name.trim().length>0&&v.identity.variant.state==='known'&&v.identity.variant.value.trim().length>0&&v.identity.sizeLabel.state==='known'&&v.identity.sizeLabel.value.trim().length>0&&v.identity.strength.state!=='unknown');
 if(v.identity.strength.state==='known')requireValue(v.identity.strength.value.trim().length>0);
 requireValue(v.unitPrice.cents>0&&v.quantity*v.unitPrice.cents===v.lineTotalCents&&v.lineTotalCents<=MAX_PAYMENT_CENTS);checkCommercePolicy(v.returnTerms);
}
export const cRefundBasis=co({policy:ce('first_three_monthly_periods'),termsVersion:cPositive,firstPublicationOn:ck(cDay),periods:ca(co({ordinal:ce(1,2,3),claimId:cUuid,quoteId:cUuid,serviceCents:ce(10000),verifiedAt:cInstant,period:cn(cPeriod)}),3),periodThreeEndsOn:ck(cDay),requestDeadline:ck(cDay),broaderPromiseRef:cn(cUuid)});
export const cRefundAssessment=cu(co({state:ce('supported'),basis:cRefundBasis,refundableCents:cMoney,eligibility:ce('eligible','outside_recorded_terms')}),co({state:ce('unavailable'),code:ce('legacy_payment_provenance_required','service_terms_unavailable','period_basis_unavailable')}),co({state:ce('unavailable'),code:ce('broader_terms_unavailable'),termsRef:cUuid}),co({state:ce('unavailable'),code:ce('calendar_policy_unavailable'),terms:co({id:cUuid,version:cPositive})}));
/** Calendar validation of supplied server facts, never eligibility from a client clock. */
export function commerceAddCalendarDays(day:string,days:number):string{
 readCommerceShape(day,cDay);requireValue(Number.isInteger(days)&&days>=0&&days<=30);let [year,month,date]=day.split('-').map(Number) as [number,number,number];
 const monthDays=(y:number,m:number)=>[31,(y%4===0&&(y%100!==0||y%400===0))?29:28,31,30,31,30,31,31,30,31,30,31][m-1]!;
 for(let i=0;i<days;i++){date++;if(date>monthDays(year,month)){date=1;month++;if(month>12){month=1;year++;}}}requireValue(year<=9999);return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(date).padStart(2,'0')}`;
}
export function checkServiceRefundAssessment(value:ServiceRefundAssessment):void{
 const v=readCommerceShape<ServiceRefundAssessment>(value,cRefundAssessment);if(v.state==='unavailable')return;const b=v.basis,p=b.periods;requireValue(new Set(p.map(x=>x.claimId)).size===p.length&&new Set(p.map(x=>x.quoteId)).size===p.length&&p.every((x,i)=>x.ordinal===i+1)&&p.reduce((s,x)=>s+x.serviceCents,0)===v.refundableCents);
 if(b.firstPublicationOn.state==='known'){requireValue(p.length>0);let startsOn=b.firstPublicationOn.value;for(const paid of p){requireValue(paid.period!==null&&paid.period.startOn===startsOn&&commerceCalendarMonthEnd(startsOn)===paid.period.endOn);startsOn=paid.period.endOn;}}
 else requireValue(p.length<=1&&p.every(paid=>paid.period===null));
 const calendar=deriveServiceRefundCalendar(b.firstPublicationOn);requireValue(commerceCanonicalJson(b.periodThreeEndsOn)===commerceCanonicalJson(calendar.periodThreeEndsOn)&&commerceCanonicalJson(b.requestDeadline)===commerceCanonicalJson(calendar.requestDeadline));
 requireValue(b.broaderPromiseRef===null); // Preserve broader evidence via unavailable, never narrow it to this baseline.
}
export function checkCommercePolicy(p:import('./PortalCommerce.ts').CommerceReturnTerms):void{
 readCommerceShape(p,cPolicy);if(p.returnCost.kind==='not_applicable')requireValue(p.deadline.kind==='final_sale');
}
export function validCommerceCursor(cursor:string,hash?:string):boolean{const m=/^c:([a-f0-9]{64}):([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}):([1-9][0-9]{0,15})$/.exec(cursor);return !!m&&Number.isSafeInteger(Number(m[3]))&&(hash===undefined||m[1]===hash);}
export function checkCommerceCommand(c:CommerceCommand):void{
 if('cursor'in c&&c.cursor!==null)requireValue(c.snapshot!==null&&validCommerceCursor(c.cursor,c.snapshot.hash));
 if(c.action==='read_quote_components_v1')requireValue(c.quote.kind==='issued');
 if('destination'in c)readPrivateRepaymentDestination(c.destination);
 if(c.action==='save_product_quote_draft_v1'){requireValue(c.draftId!==null||c.expectedQuoteDraftRevision===0);if(c.body.serviceCents.state==='known'&&c.body.serviceCents.value===0)requireValue(c.body.servicePeriod===null);}

 if(c.action==='record_quote_reconciliation_v1')requireValue(c.disposition==='replacement_accepted'?c.replacementQuote!==null&&c.acceptanceId!==null:c.acceptanceId===null);
 if('payment'in c){requireValue(c.quote.quoteId===c.payment.quoteId&&c.quote.quoteVersion===c.payment.quoteVersion);
  requireValue(c.payment.serviceCents+c.payment.productCents===c.payment.totalCents&&(c.payment.productCents>0)===(c.payment.shippingAddressVersion!==null));
  if(c.action==='confirm_payment_v1'){const r=c.receipt;requireValue(r.grossCents===c.payment.totalCents);if(r.feeCents.state==='known')requireValue(r.feeCents.value<=r.grossCents);if(r.netCents.state==='known')requireValue(r.netCents.value<=r.grossCents);if(r.feeCents.state==='known'&&r.netCents.state==='known')requireValue(r.feeCents.value+r.netCents.value===r.grossCents);}
 }
 if(c.action==='record_product_return_event_v1')checkCommerceReturnEvent(c.event);
}
export function checkCommerceReturnEvent(e:import('./PortalCommerce.ts').CommerceReturnEventBody):void{readCommerceShape(e,cReturnEvent);requireValue((e.status==='retailer_funds_received')===(e.retailerRefundCents!==null)&&(e.status==='client_repaid')===(e.clientRepaidCents!==null));}
/** Existing proportional ceiling, including a remainder cent; relational cumulative checks remain SQL. */
export function commerceReturnCap(p:{quantity:number;unitPriceCents:number;taxCents:number;shippingCents:number},quantity:number,alreadyRetailerReceived:number):number{
 readCommerceShape(p,co({quantity:{...cPositive,max:100},unitPriceCents:cAmount,taxCents:cMoney,shippingCents:cMoney}));readCommerceShape(quantity,{...cPositive,max:100});readCommerceShape(alreadyRetailerReceived,cMoney);const total=p.quantity*p.unitPriceCents+p.taxCents+p.shippingCents;requireValue(quantity<=p.quantity&&total<=MAX_PAYMENT_CENTS&&alreadyRetailerReceived<=total);return Math.min(quantity*p.unitPriceCents+Math.ceil((p.taxCents+p.shippingCents)*quantity/p.quantity),total-alreadyRetailerReceived);
}
/** Reuses the actual V2 parser as a validator descriptor; never dispatches its RPC. */
export function validateCommercePayment(action:'submit_claim'|'confirm_payment'|'reject_claim',payment:ManualPaymentBasis,owner:string,requestId:string,expectedRevision:number,extras:Record<string,unknown>){requireValue(payment.currency==='USD');const {currency:_currency,...legacyBasis}=payment;return buildPaymentCallV2({schemaVersion:2,action,requestId,expectedRevision,...(action==='submit_claim'?{}:{clientId:owner}),...legacyBasis,...extras},owner);}
export function emptyProductQuoteDraft():ProductQuoteDraftBody{return {publication:{state:'unknown'},lineIds:[],tax:{state:'unknown'},shipping:{state:'unknown'},shippingAddressVersion:{state:'unknown'},serviceCents:{state:'unknown'},servicePeriod:null,note:null};}
export function emptyProductQuoteLine(lineId:string):ProductQuoteLineDraft{return readCommerceShape({lineId,selection:{state:'unknown'},identity:{name:'',variant:{state:'unknown'},strength:{state:'unknown'},sizeLabel:{state:'unknown'}},quantity:{state:'unknown'},retailer:{state:'unknown'},seller:{state:'unknown'},fulfiller:{state:'unknown'},sourceUrl:{state:'unknown'},checkedOn:{state:'unknown'},unitPrice:{state:'unknown'},returnTerms:emptyCommerceReturnTerms()},cDraftLine);}
export {commerceReadActions};

/** Exact elapsed time on actual supplied instants; calendar period/deadline rules use civil days. */
export function commerceInstantMicros(value:string):bigint{readCommerceShape(value,cInstant);const fraction=/\.(\d{1,6})/.exec(value)?.[1]??'';const base=value.replace(/\.\d{1,6}/,'.000');return BigInt(Date.parse(base))*1000n+BigInt(fraction.padEnd(6,'0')||'0');}

/** Proleptic Gregorian day arithmetic, bounded binary search; no JS month rollover or 90-day clock. */
export function commerceCalendarDayNumber(value:string):number{
 readCommerceShape(value,cDay);const [y,m,d]=value.split('-').map(Number) as [number,number,number];const beforeYear=y-1;const leap=y%4===0&&(y%100!==0||y%400===0);const offsets=[0,31,59,90,120,151,181,212,243,273,304,334];return beforeYear*365+Math.floor(beforeYear/4)-Math.floor(beforeYear/100)+Math.floor(beforeYear/400)+offsets[m-1]!+(leap&&m>2?1:0)+d-1;
}
export function commerceCalendarAdd(value:string,count:number):string|null{
 requireValue(Number.isSafeInteger(count)&&count>=0);const target=commerceCalendarDayNumber(value)+count;if(!Number.isSafeInteger(target)||target>commerceCalendarDayNumber('9999-12-31'))return null;
 let lo=1900,hi=9999;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(commerceCalendarDayNumber(`${String(mid).padStart(4,'0')}-01-01`)<=target)lo=mid;else hi=mid-1;}
 for(let month=12;month>=1;month--){const prefix=`${String(lo).padStart(4,'0')}-${String(month).padStart(2,'0')}-`;const first=commerceCalendarDayNumber(prefix+'01');if(first<=target)return prefix+String(target-first+1).padStart(2,'0');}throw Error('invalid_input');
}
export function resolveCommerceReturnWindow(policy:import('./PortalCommerce.ts').CommerceReturnTerms,purchasedOn:string,delivery:import('./PortalCommerce.ts').CommerceDelivery|null):import('./PortalCommerce.ts').CommerceReturnWindow{
 checkCommercePolicy(policy);readCommerceShape(purchasedOn,cDay);const p=policy.deadline;if(p.kind==='final_sale')return {kind:'final_sale'};if(p.kind==='absolute')return {kind:'resolved',returnBy:p.returnBy,shipBy:p.shipBy,anchor:{kind:'absolute'}};
 if(p.anchor==='delivery'&&(!delivery||delivery.occurredOn.state==='unknown'))return {kind:'unresolved',reason:'awaiting_actual_delivery'};
 const anchorOn=p.anchor==='purchase'?purchasedOn:delivery!.occurredOn.state==='known'?delivery!.occurredOn.value:purchasedOn;const returnBy=commerceCalendarAdd(anchorOn,p.days);const shipBy=p.shipWithinDays===null?null:commerceCalendarAdd(anchorOn,p.shipWithinDays);if(returnBy===null||p.shipWithinDays!==null&&shipBy===null)return {kind:'unresolved',reason:'date_out_of_range'};
 return {kind:'resolved',returnBy,shipBy,anchor:p.anchor==='purchase'?{kind:'purchase',purchasedOn}:{kind:'delivery',eventId:delivery!.eventId,occurredOn:anchorOn}};
}

export function commerceCalendarMonthEnd(value:string):string|null{
 readCommerceShape(value,cDay);let [year,month,day]=value.split('-').map(Number) as [number,number,number];month++;if(month>12){year++;month=1;}if(year>9999)return null;const leap=year%4===0&&(year%100!==0||year%400===0);const max=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month-1]!;return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(Math.min(day,max)).padStart(2,'0')}`;
}

export function emptyCommerceReturnTerms():import('./PortalCommerce.ts').CommerceReturnTermsDraft{return {checkedOn:{state:'unknown'},sourceUrl:{state:'unknown'},summary:'',openedAllowed:{state:'unknown'},deadline:{kind:'unknown'},returnCost:{kind:'unknown'}};}
export function prepareCommerceReturnTerms(policy:import('./PortalCommerce.ts').CommerceReturnTerms):import('./PortalCommerce.ts').CommerceReturnTermsDraft{
 checkCommercePolicy(policy);const known=<T>(value:T)=>({state:'known' as const,value});const d=policy.deadline;return {checkedOn:known(policy.checkedOn),sourceUrl:known(policy.sourceUrl),summary:policy.summary,openedAllowed:known(policy.openedAllowed),deadline:d.kind==='final_sale'?d:d.kind==='absolute'?{kind:'absolute',returnBy:known(d.returnBy),shipBy:known(d.shipBy)}:{kind:'relative',days:known(d.days),anchor:known(d.anchor),shipWithinDays:known(d.shipWithinDays)},returnCost:policy.returnCost.kind==='known'?{kind:'known',cents:known(policy.returnCost.cents)}:policy.returnCost};
}
export function freezeCommerceReturnTerms(preparation:import('./PortalCommerce.ts').CommerceReturnTermsDraft):import('./PortalCommerce.ts').CommerceReturnTerms{
 const p=readCommerceShape<import('./PortalCommerce.ts').CommerceReturnTermsDraft>(preparation,cDraftPolicy);requireValue(p.checkedOn.state==='known'&&p.sourceUrl.state==='known'&&p.openedAllowed.state==='known');let deadline:import('./PortalCommerce.ts').CommerceReturnTerms['deadline'];const d=p.deadline;requireValue(d.kind!=='unknown');
 if(d.kind==='final_sale')deadline=d;else if(d.kind==='absolute'){requireValue(d.returnBy.state==='known'&&d.shipBy.state==='known');deadline={kind:'absolute',returnBy:d.returnBy.value,shipBy:d.shipBy.value};}else{requireValue(d.days.state==='known'&&d.anchor.state==='known'&&d.shipWithinDays.state==='known');deadline={kind:'relative',days:d.days.value,anchor:d.anchor.value,shipWithinDays:d.shipWithinDays.value};}
 const cost=p.returnCost;requireValue(cost.kind!=='unknown');let returnCost:import('./PortalCommerce.ts').CommerceReturnTerms['returnCost'];if(cost.kind==='known'){requireValue(cost.cents.state==='known');returnCost={kind:'known',cents:cost.cents.value};}else returnCost=cost;
 const result={checkedOn:p.checkedOn.value,sourceUrl:p.sourceUrl.value,summary:p.summary,openedAllowed:p.openedAllowed.value,deadline,returnCost};checkCommercePolicy(result);return result;
}

/** Retained sequential calendar months, independent of how many fees were actually paid. */
export function deriveServiceRefundCalendar(firstPublicationOn:import('./PortalCommerce.ts').Known<string>):import('./PortalCommerce.ts').ServiceRefundCalendar{
 const anchor=readCommerceShape<import('./PortalCommerce.ts').Known<string>>(firstPublicationOn,ck(cDay));if(anchor.state==='unknown')return {periodThreeEndsOn:{state:'unknown'},requestDeadline:{state:'unknown'}};
 let end=anchor.value;for(let i=0;i<3;i++){const next=commerceCalendarMonthEnd(end);requireValue(next!==null);end=next;}
 return {periodThreeEndsOn:{state:'known',value:end},requestDeadline:{state:'known',value:commerceAddCalendarDays(end,30)}};
}

/** Fresh return intent uses the existing client-wide canonical service CAS, never an entity/fulfillment revision. */
export function commerceReturnBasis(snapshot:unknown):{expectedReturnRevision:import('./PortalCommerce.ts').Revision}{
 const current=readCommerceShape<import('./PortalCommerce.ts').CommerceSnapshot>(snapshot,cSnapshot);return {expectedReturnRevision:current.serviceRevision};
}
