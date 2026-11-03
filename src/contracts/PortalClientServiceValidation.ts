import type {ServiceCancellation} from './ConciergeService.ts';
import type {ClientServiceCommand,ClientServiceCancelCommand,ClientServiceView,ClientServiceReceipt,ClientServiceStatus} from './PortalClientService.ts';
import {exactKeys,readDate,readInteger,readObject,readText,readUuid,requireValue} from './ConciergePortalValidation.ts';
import {clientServiceCommandMaxBytes,clientServiceResultMaxBytes,clientServiceMaximumRevision,clientServiceDefaultCancellationReason} from './PortalClientServiceValues.ts';
const bytes=(value:unknown,max:number)=>requireValue(new TextEncoder().encode(JSON.stringify(value)).byteLength<=max);
const uuid=(value:unknown)=>readUuid(value).toLowerCase();
const hash=(value:unknown)=>{requireValue(typeof value==='string'&&/^[a-f0-9]{64}$/.test(value));return value;};
const text=(value:unknown)=>{
 const result=readText(value,2000);requireValue(!result.includes('\0'));
 // Reject lone surrogates instead of silently changing their stored representation.
 for(const scalar of result){const n=scalar.codePointAt(0)!;requireValue(n<0xd800||n>0xdfff);}
 return result;
};
const member=<T extends string>(v:unknown,values:readonly T[]):T=>{requireValue(values.includes(v as T));return v as T;};
const dayPlus30=(day:string)=>{const d=new Date(`${day}T00:00:00.000Z`);d.setUTCDate(d.getUTCDate()+30);return readDate(d.toISOString().slice(0,10));};
function cancellation(value:unknown):ServiceCancellation{
 const v=readObject(value);exactKeys(v,['id','kind','supportEndsOn','reason','recordedBy','recordedAt']);
 const stamp=readText(v.recordedAt,60);requireValue(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.test(stamp)&&Number.isFinite(Date.parse(stamp)));
 return Object.freeze({id:uuid(v.id),kind:member(v.kind,['period_end','early_departure'] as const),supportEndsOn:readDate(v.supportEndsOn),reason:text(v.reason),recordedBy:uuid(v.recordedBy),recordedAt:stamp});
}
export function readClientServiceCommand(value:unknown):ClientServiceCommand{
 const v=readObject(value);bytes(v,clientServiceCommandMaxBytes);requireValue(v.schemaVersion===1);
 if(v.action==='read_client_service_v1'){exactKeys(v,['schemaVersion','action']);return Object.freeze({schemaVersion:1,action:v.action});}
 if(v.action==='client_service_request_status_v1'){exactKeys(v,['schemaVersion','action','requestId']);return Object.freeze({schemaVersion:1,action:v.action,requestId:uuid(v.requestId)});}
 requireValue(v.action==='cancel_client_service_period_end_v1');
 exactKeys(v,['schemaVersion','action','requestId','expectedServiceRevision','expectedBasisHash','reason','confirmed']);requireValue(v.confirmed===true);
 return Object.freeze({schemaVersion:1,action:v.action,requestId:uuid(v.requestId),expectedServiceRevision:readInteger(v.expectedServiceRevision,0,clientServiceMaximumRevision-1),expectedBasisHash:hash(v.expectedBasisHash),reason:v.reason===null?null:text(v.reason),confirmed:true});
}
export function readClientServiceView(value:unknown):ClientServiceView{
 const v=readObject(value),hasAccess=Object.hasOwn(v,'postServiceAccess');exactKeys(v,['schemaVersion','serviceRevision','basisHash','asOfDay','coverage','cancellation','periodEndCancellation',...(hasAccess?['postServiceAccess']:[])]);bytes(v,clientServiceResultMaxBytes);requireValue(v.schemaVersion===1);
 const asOfDay=readDate(v.asOfDay),c=readObject(v.coverage);exactKeys(c,['status','period','paidSupportEndsOn','pendingPublication']);requireValue(typeof c.pendingPublication==='boolean');
 const status=member(c.status,['unpaid','pending_publication','active','expired','cancelled'] as const);
 const period=c.period===null?null:(()=>{const p=readObject(c.period);exactKeys(p,['startOn','endOn']);const result=Object.freeze({startOn:readDate(p.startOn),endOn:readDate(p.endOn)});requireValue(result.startOn<result.endOn);return result;})();
 const paidSupportEndsOn=c.paidSupportEndsOn===null?null:readDate(c.paidSupportEndsOn),cancel=v.cancellation===null?null:cancellation(v.cancellation);
 requireValue(period===null||paidSupportEndsOn!==null&&paidSupportEndsOn>=period.endOn);
 if(status==='active')requireValue(period!==null&&period.startOn<=asOfDay&&asOfDay<period.endOn&&(cancel===null||asOfDay<cancel.supportEndsOn));
 if(status==='unpaid')requireValue(period===null&&paidSupportEndsOn===null&&!c.pendingPublication&&cancel===null);
 if(status==='pending_publication')requireValue(c.pendingPublication===true);
 const e=readObject(v.periodEndCancellation);let eligibility:ClientServiceView['periodEndCancellation'];
 if(e.state==='available'){
  exactKeys(e,['state','supportEndsOn','readOnlyEndsOn']);const supportEndsOn=readDate(e.supportEndsOn),readOnlyEndsOn=readDate(e.readOnlyEndsOn);
  requireValue(cancel===null&&status==='active'&&!c.pendingPublication&&supportEndsOn===paidSupportEndsOn&&supportEndsOn>asOfDay&&dayPlus30(supportEndsOn)===readOnlyEndsOn);
  eligibility=Object.freeze({state:'available',supportEndsOn,readOnlyEndsOn});
 }else{exactKeys(e,['state','reason']);requireValue(e.state==='unavailable');const reason=member(e.reason,['already_cancelled','coverage_unknown','not_active'] as const);requireValue((reason==='already_cancelled')===(cancel!==null));eligibility=Object.freeze({state:'unavailable',reason});}
 let postServiceAccess:ClientServiceView['postServiceAccess'];
 if(hasAccess){
  const a=readObject(v.postServiceAccess);
  if(a.state==='unknown'){exactKeys(a,['state']);postServiceAccess=Object.freeze({state:'unknown'});}
  else{
   exactKeys(a,['state','supportEndsOn','readOnlyEndsOn']);requireValue(a.state==='known');
   const supportEndsOn=readDate(a.supportEndsOn),readOnlyEndsOn=readDate(a.readOnlyEndsOn);
   requireValue(!c.pendingPublication&&paidSupportEndsOn!==null);
   const effectiveEnd=cancel!==null&&cancel.supportEndsOn<paidSupportEndsOn?cancel.supportEndsOn:paidSupportEndsOn;
   requireValue(supportEndsOn===effectiveEnd&&dayPlus30(supportEndsOn)===readOnlyEndsOn);
   postServiceAccess=Object.freeze({state:'known',supportEndsOn,readOnlyEndsOn});
  }
 }
 return Object.freeze({schemaVersion:1,serviceRevision:readInteger(v.serviceRevision),basisHash:hash(v.basisHash),asOfDay,coverage:Object.freeze({status,period,paidSupportEndsOn,pendingPublication:c.pendingPublication}),cancellation:cancel,periodEndCancellation:eligibility,...(hasAccess?{postServiceAccess}:{})});
}
export function readClientServiceReceipt(value:unknown,command:ClientServiceCancelCommand):ClientServiceReceipt{
 const v=readObject(value);exactKeys(v,['schemaVersion','requestId','action','previousServiceRevision','serviceRevision','expectedBasisHash','cancellation']);bytes(v,clientServiceResultMaxBytes);
 const cancel=cancellation(v.cancellation);requireValue(v.schemaVersion===1&&v.action===command.action&&uuid(v.requestId)===command.requestId&&v.previousServiceRevision===command.expectedServiceRevision&&v.serviceRevision===command.expectedServiceRevision+1&&hash(v.expectedBasisHash)===command.expectedBasisHash&&cancel.kind==='period_end'&&cancel.reason===(command.reason??clientServiceDefaultCancellationReason));
 return Object.freeze({schemaVersion:1,requestId:command.requestId,action:command.action,previousServiceRevision:command.expectedServiceRevision,serviceRevision:command.expectedServiceRevision+1,expectedBasisHash:command.expectedBasisHash,cancellation:cancel});
}
export function readClientServiceStatus(value:unknown,requestId:string):ClientServiceStatus{
 const v=readObject(value);bytes(v,clientServiceResultMaxBytes);requireValue(v.schemaVersion===1&&uuid(v.requestId)===requestId);
 if(v.state==='absent'){exactKeys(v,['schemaVersion','requestId','state']);return Object.freeze({schemaVersion:1,requestId,state:'absent'});}
 exactKeys(v,['schemaVersion','requestId','state','original','receipt']);requireValue(v.state==='committed');
 const original=readClientServiceCommand(v.original);requireValue(original.action==='cancel_client_service_period_end_v1'&&original.requestId===requestId);
 return Object.freeze({schemaVersion:1,requestId,state:'committed',original,receipt:readClientServiceReceipt(v.receipt,original)});
}
