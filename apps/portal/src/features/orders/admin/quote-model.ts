import type {CommerceDetail,CommerceDraftView,CommerceSnapshot,Known,CheckedMoney,ProductQuoteDraftBody,ProductQuoteLineDraft} from '../../../../../../src/contracts/PortalCommerce.ts';
import {emptyProductQuoteDraft,emptyProductQuoteLine,readCommerceShape,readCommerceCommand,commerceLineReady,commerceCanonicalJson,cDraftBody,cDraftLine,cSnapshot,cDay,cUuid,co,ca} from '../../../../../../src/contracts/PortalCommerceValidation.ts';
import {commerceDetailShape} from '../../../../../../src/contracts/PortalCommerceMapping.ts';
import {exactKeys,readObject,requireValue} from '../../../../../../src/contracts/ConciergePortalValidation.ts';
import {MAX_PAYMENT_CENTS} from '../../../../../../supabase/functions/concierge-payments/contract.ts';
import type {ProductQuotePreparation,AdminQuoteDraftSave,AdminQuoteLineSave,AdminQuoteIssue,AdminQuoteDraftSaveInput,AdminQuoteLineSaveInput,AdminQuoteIssueInput} from './types.ts';

function immutable<T>(value:T):T {
 if(value!==null&&typeof value==='object'){
  for(const item of Object.values(value))immutable(item);
  Object.freeze(value);
 }
 return value;
}
function preparation(value:ProductQuotePreparation):ProductQuotePreparation {
 const parsed=readCommerceShape<ProductQuotePreparation>(value,co({body:cDraftBody,lines:ca(cDraftLine,50)}));
 const ids=parsed.lines.map(line=>line.lineId);
 requireValue(new Set(ids).size===ids.length&&ids.length===parsed.body.lineIds.length&&parsed.body.lineIds.every(id=>ids.includes(id)));
 return parsed;
}
function currentDraft(value:CommerceDraftView,clientId:string):CommerceDraftView {
 const client=readCommerceShape<string>(clientId,cUuid);
 const parsed=readCommerceShape<CommerceDetail>(value,commerceDetailShape);
 requireValue(parsed.kind==='quote_draft'&&parsed.clientId===client&&parsed.readyToIssue===(parsed.issues.length===0));
 return parsed;
}

export function newProductQuotePreparation():ProductQuotePreparation {
 return immutable({body:emptyProductQuoteDraft(),lines:[]});
}
export function addProductQuoteLine(value:ProductQuotePreparation,lineId:string):ProductQuotePreparation {
 const parsed=preparation(value),line=emptyProductQuoteLine(lineId);
 requireValue(!parsed.body.lineIds.includes(line.lineId));
 return immutable(preparation({body:{...parsed.body,lineIds:[...parsed.body.lineIds,line.lineId]},lines:[...parsed.lines,line]}));
}
export function replaceProductQuoteLine(value:ProductQuotePreparation,line:ProductQuoteLineDraft):ProductQuotePreparation {
 const parsed=preparation(value),next=readCommerceShape<ProductQuoteLineDraft>(line,cDraftLine);
 requireValue(parsed.body.lineIds.includes(next.lineId));
 return immutable({body:parsed.body,lines:parsed.lines.map(item=>item.lineId===next.lineId?next:item)});
}

/** Form-only conversion. Empty is unknown, and decimal dollars are converted
 * exactly without floating-point rounding, inferred tax or currency conversion. */
export function parseProductQuoteCents(value:string):number|null {
 requireValue(typeof value==='string');const text=value.trim();if(text==='')return null;
 const match=/^(\d+)(?:\.(\d{1,2}))?$/.exec(text);requireValue(match!==null&&text.length<=20);
 const cents=BigInt(match[1]!)*100n+BigInt((match[2]??'').padEnd(2,'0')||'0');
 requireValue(cents<=BigInt(MAX_PAYMENT_CENTS));return Number(cents);
}
export function productQuoteCheckedMoney(amount:string,checkedOn:string):Known<CheckedMoney> {
 const cents=parseProductQuoteCents(amount);
 requireValue(typeof checkedOn==='string');const day=checkedOn.trim();
 if(cents===null&&day==='')return {state:'unknown'};
 requireValue(cents!==null&&day!=='');readCommerceShape(day,cDay);
 return {state:'known',value:{cents,checkedOn:day}};
}

/** The client ID is result correlation supplied by the parent. These pure
 * producers grant no finance capability; the fixed W0 port and SQL must recheck. */
export function buildAdminQuoteDraftSave(input:AdminQuoteDraftSaveInput):AdminQuoteDraftSave {
 exactKeys(readObject(input),['clientId','requestId','draft','body']);
 const draft=input.draft===null?null:currentDraft(input.draft,input.clientId);
 const command=readCommerceCommand({schemaVersion:1,action:'save_product_quote_draft_v1',clientId:input.clientId,requestId:input.requestId,
  draftId:draft?.target.draftId??null,expectedQuoteDraftRevision:draft?.target.revision??0,body:input.body});
 requireValue(command.action==='save_product_quote_draft_v1');return immutable(command);
}
export function buildAdminQuoteLineSave(input:AdminQuoteLineSaveInput):AdminQuoteLineSave {
 exactKeys(readObject(input),['clientId','requestId','draft','line']);
 const draft=currentDraft(input.draft,input.clientId),line=readCommerceShape<ProductQuoteLineDraft>(input.line,cDraftLine);
 requireValue(draft.body.lineIds.includes(line.lineId));
 const command=readCommerceCommand({schemaVersion:1,action:'save_product_quote_line_v1',clientId:input.clientId,requestId:input.requestId,target:draft.target,body:line});
 requireValue(command.action==='save_product_quote_line_v1');return immutable(command);
}
export function buildAdminQuoteIssue(input:AdminQuoteIssueInput):AdminQuoteIssue {
 exactKeys(readObject(input),['clientId','requestId','draft','snapshot','lines']);
 const draft=currentDraft(input.draft,input.clientId),snapshot=readCommerceShape<CommerceSnapshot>(input.snapshot,cSnapshot);
 const body=readCommerceShape<ProductQuoteDraftBody>(draft.body,cDraftBody),lines=readCommerceShape<ProductQuoteLineDraft[]>(input.lines,ca(cDraftLine,50));
 requireValue(draft.readyToIssue&&draft.issues.length===0&&body.publication.state==='known'&&body.tax.state==='known'&&body.shipping.state==='known'&&body.shippingAddressVersion.state==='known'&&body.serviceCents.state==='known');
 requireValue(lines.length>0&&lines.length===body.lineIds.length&&new Set(lines.map(line=>line.lineId)).size===lines.length&&body.lineIds.every(id=>lines.some(line=>line.lineId===id)));
 for(const line of lines){
  requireValue(commerceLineReady(line)&&line.selection.state==='known');
  requireValue(commerceCanonicalJson(line.selection.value.publication)===commerceCanonicalJson(body.publication.value));
 }
 const command=readCommerceCommand({schemaVersion:1,action:'issue_product_quote_v1',clientId:input.clientId,requestId:input.requestId,target:draft.target,expectedPaymentRevision:snapshot.paymentRevision});
 requireValue(command.action==='issue_product_quote_v1');return immutable(command);
}
