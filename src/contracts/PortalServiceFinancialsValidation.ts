import type {ServiceFinancialsCommand,ServiceFinancialsView} from './PortalServiceFinancials.ts';
import {requireValue,readDate} from './ConciergePortalValidation.ts';
import {readReviewShape,reviewJsonBytes} from './PortalReviewValidation.ts';
import {careObject as object,careArray as array,careEnum as member,careNull as nullable,careKnown as known,careUuid as uuid,careRevision as revision,carePositive as positive,careInstant as instant} from './PortalCareValidation.ts';
import {serviceFinancialsCommandMaxBytes,serviceFinancialsResultMaxBytes,serviceFinancialsCursorMaxBytes,serviceFinancialsPageMax,serviceFinancialsUnavailableCodes} from './PortalServiceFinancialsValues.ts';
const day={type:'date'} as const;
const chicagoFormatter=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'});
function chicagoDay(instant:string):string{
 const parts=Object.fromEntries(chicagoFormatter.formatToParts(new Date(instant)).map(p=>[p.type,p.value]));
 return readDate(`${parts.year}-${parts.month}-${parts.day}`);
}
const cursor=nullable({type:'text',max:serviceFinancialsCursorMaxBytes,empty:false} as const);
export const serviceFinancialsSnapshotShape=object({paymentRevision:revision,serviceRevision:revision,asOfDay:day,hash:{type:'hash'}});
const commandShape=object({schemaVersion:member(1),action:member('read_client_service_financials_v1'),snapshot:nullable(serviceFinancialsSnapshotShape),cursor,limit:{...positive,max:serviceFinancialsPageMax}});
const period=object({state:member('scheduled'),startOn:day,endOn:day});
const payment=object({kind:member('canonical_payment'),claimId:uuid,quoteId:uuid,verifiedAt:instant,serviceCents:{...positive,max:100000000},period:{type:'union',variants:[object({state:member('pending_publication')}),period]}});
const viewShape=object({schemaVersion:member(1),snapshot:serviceFinancialsSnapshotShape,payments:array(payment,serviceFinancialsPageMax),nextCursor:cursor,firstPublicationOn:known(day),pendingServiceQuotes:array(object({id:uuid,version:positive}),100),guarantee:object({state:member('unavailable'),code:member(...serviceFinancialsUnavailableCodes)})});
const freeze=<T>(value:T):T=>{
 if(value!==null&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;
};
function checkCursor(value:string|null):void{
 if(value===null)return;
 requireValue(new TextEncoder().encode(value).byteLength<=serviceFinancialsCursorMaxBytes&&!/[\u0000-\u001f\u007f]/.test(value));
 for(const scalar of value){const n=scalar.codePointAt(0)!;requireValue(n<0xd800||n>0xdfff);}
}
export function readServiceFinancialsCommand(value:unknown):ServiceFinancialsCommand{
 requireValue(reviewJsonBytes(value)<=serviceFinancialsCommandMaxBytes);
 const command=readReviewShape(value,commandShape) as ServiceFinancialsCommand;
 checkCursor(command.cursor);requireValue(command.cursor===null||command.snapshot!==null);return freeze(command);
}
/** Validate recorded one-month boundaries; this does not compute coverage or refund eligibility. */
function nextMonthEnd(start:string):string|null{
 let [year,month,date]=start.split('-').map(Number) as [number,number,number];month++;if(month===13){month=1;year++;}if(year>9999)return null;
 const leap=year%4===0&&(year%100!==0||year%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month-1]!;
 return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(Math.min(date,days)).padStart(2,'0')}`;
}
export function readServiceFinancialsView(value:unknown,command:ServiceFinancialsCommand):ServiceFinancialsView{
 requireValue(reviewJsonBytes(value)<=serviceFinancialsResultMaxBytes);
 const view=readReviewShape(value,viewShape) as ServiceFinancialsView;
 checkCursor(view.nextCursor);
 requireValue(view.firstPublicationOn.state==='unknown'||view.firstPublicationOn.value<=view.snapshot.asOfDay);
 if(command.snapshot!==null){const a=command.snapshot,b=view.snapshot;requireValue(a.paymentRevision===b.paymentRevision&&a.serviceRevision===b.serviceRevision&&a.asOfDay===b.asOfDay&&a.hash===b.hash);}
 requireValue(view.payments.length<=command.limit&&(view.nextCursor===null||view.payments.length>0&&view.nextCursor!==command.cursor));
 const claims=new Set<string>(),quotes=new Set<string>(),pending=new Set<string>();
 for(const row of view.payments){
  requireValue(chicagoDay(row.verifiedAt)<=view.snapshot.asOfDay);
  requireValue(!claims.has(row.claimId)&&!quotes.has(row.quoteId));claims.add(row.claimId);quotes.add(row.quoteId);
  if(row.period.state==='scheduled')requireValue(nextMonthEnd(row.period.startOn)===row.period.endOn);
 }
 for(const quote of view.pendingServiceQuotes){requireValue(!pending.has(quote.id)&&!quotes.has(quote.id));pending.add(quote.id);}
 return freeze(view);
}
