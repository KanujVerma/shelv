import type {CareCommand,CareRpcCall,ProductRef} from './PortalCare.ts';
import {readPlanShape} from './PortalRebuildValidation.ts';
import type {PlanShape} from './PortalRebuildValidation.ts';
import {readObject,requireValue} from './ConciergePortalValidation.ts';
import {careNameMax,carePhotosMax,carePageMax,careTextMax} from './PortalCareValues.ts';
export const careObject=(fields:Record<string,PlanShape>):PlanShape=>({type:'object',fields});
export const careArray=(item:PlanShape,max=carePageMax):PlanShape=>({type:'array',item,max,min:0});
export const careEnum=(...values:(string|number|boolean|null)[]):PlanShape=>({type:'enum',values});
export const careNull=(s:PlanShape):PlanShape=>({...s,nullable:true});
export const careUnion=(...variants:PlanShape[]):PlanShape=>({type:'union',variants});
export const careUuid:PlanShape={type:'uuid'},careRevision:PlanShape={type:'integer',min:0,max:Number.MAX_SAFE_INTEGER},carePositive:PlanShape={...careRevision,min:1},careText:PlanShape={type:'text',max:careTextMax,empty:false},careName:PlanShape={...careText,max:careNameMax},careInstant:PlanShape={type:'instant'},careBool:PlanShape={type:'boolean'},careCursor:PlanShape={type:'text',max:200,empty:false};
export const careKnown=(value:PlanShape)=>careUnion(careObject({state:careEnum('unknown')}),careObject({state:careEnum('known'),value}));
export const careDay=careKnown({type:'date'});
export const carePublication=careObject({version:carePositive,documentSchemaVersion:careEnum(1,2,3)});
export const carePlanProduct=careObject({kind:careEnum('plan_product'),publication:carePublication,productId:{type:'identifier'},slotId:careNull({type:'identifier'})});
export const careReportedProduct=careObject({kind:careEnum('client_reported_product'),reportedProductId:careUuid,version:carePositive});
export const careProduct=careUnion(carePlanProduct,careReportedProduct);
const photos:PlanShape={...careArray(careUuid,carePhotosMax),unique:true};
export const careDescriptor=careObject({name:careName,brand:careKnown(careName),variant:careKnown(careName),strength:careKnown(careName),sizeLabel:careKnown(careName),labelPhotoIds:photos});
export const careIdentityTarget=careObject({subject:careProduct,comparedWith:careNull(carePlanProduct)});
export const careIdentityAnswer=careObject({match:careEnum('yes','no','not_sure'),reportedName:careNull(careName),variant:careKnown(careName),strength:careKnown(careName),labelPhotoIds:photos});
export const careChange=careUnion(careObject({kind:careEnum('started')}),careObject({kind:careEnum('paused','stopped'),details:careNull(careText)}),careObject({kind:careEnum('different'),frequency:careKnown(careText),amount:careKnown(careText),details:careText}),careObject({kind:careEnum('unreviewed_added'),details:careNull(careText)}));
export const careOccurrence={occurredOn:careDay,channel:careEnum('portal','text','call','video','in_person')};
export const careAcquisition=careEnum('shelv','self','already_owned','unknown');
export const careReplacement=careObject({product:careProduct,change:careChange,sourcePublication:careNull(carePublication),occurredOn:careDay,acquisition:careAcquisition,identityEventId:careNull(careUuid)});
const write={requestId:careUuid,expectedUseRevision:careRevision};
const report={...write,product:careDescriptor,sourcePublication:careNull(carePublication),...careOccurrence,acquisition:careAcquisition};
const use={...write,...careReplacement.fields!,channel:careOccurrence.channel};
const history={product:careNull(careProduct),cursor:careNull(careCursor),limit:{...carePositive,max:carePageMax}};
export const careCommandFields:Record<CareCommand['action'],Record<string,PlanShape>>={
 report_unreviewed_product_v1:report,record_client_unreviewed_product_v1:{...report,clientId:careUuid,confirmedClientReport:careEnum(true)},
 amend_reported_product_v1:{...write,product:careReportedProduct,replacement:careDescriptor,reason:careText},
 report_identity_v1:{...write,target:careIdentityTarget,answer:careIdentityAnswer,sourcePublication:careNull(carePublication),...careOccurrence},
 report_product_use_v1:use,record_client_use_v1:{...use,clientId:careUuid,confirmedClientReport:careEnum(true)},
 amend_use_v1:{...write,eventId:careUuid,expectedAmendmentHeadId:careNull(careUuid),replacement:careReplacement,reason:careText},
 read_client_plan_v2:{version:careNull(carePositive)},read_advisor_publication_v2:{clientId:careUuid,version:careNull(carePositive)},
 read_reported_products_v1:{cursor:careNull(careCursor),limit:{...carePositive,max:carePageMax},expectedUseRevision:careRevision,publicationVersion:careNull(carePositive)},
 read_use_history_v1:history,read_advisor_use_history_v1:{...history,clientId:careUuid},request_status_v1:{requestId:careUuid},
};
/** Canonical equality is order-independent and never coerces identifiers or versions. */
export function sameCareValue(a:unknown,b:unknown):boolean{
 if(a===b)return true;if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return false;
 if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>sameCareValue(v,b[i]));
 const x=a as Record<string,unknown>,y=b as Record<string,unknown>;return Object.keys(x).length===Object.keys(y).length&&Object.keys(x).every(k=>Object.hasOwn(y,k)&&sameCareValue(x[k],y[k]));
}
export function checkUseProduct(product:ProductRef,change:{kind:string}):void{requireValue(change.kind!=='unreviewed_added'||product.kind==='client_reported_product');}
export function readCareCommand(value:unknown):CareCommand{
 const v=readObject(value);requireValue(typeof v.action==='string'&&Object.hasOwn(careCommandFields,v.action));
 const c=readPlanShape(v,careObject({schemaVersion:careEnum(1),action:careEnum(v.action),...careCommandFields[v.action as CareCommand['action']]})) as CareCommand;
 if('cursor'in c&&c.cursor!==null)requireValue(/^c:[a-f0-9]{64}:[0-9a-f-]{36}$/.test(c.cursor));
 if(c.action==='report_identity_v1'&&c.target.subject.kind==='plan_product'&&c.target.comparedWith!==null)requireValue(sameCareValue(c.target.subject,c.target.comparedWith));
 if(c.action==='report_product_use_v1'||c.action==='record_client_use_v1')checkUseProduct(c.product,c.change);
 if(c.action==='amend_use_v1')checkUseProduct(c.replacement.product,c.replacement.change);
 const occurrence='occurredOn'in c?c.occurredOn:c.action==='amend_use_v1'?c.replacement.occurredOn:null;
 if(occurrence?.state==='known')requireValue(occurrence.value<=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
 return c;
}
export function buildCareRpc(value:unknown):CareRpcCall{return {name:'concierge_care_command_v1',args:{p_command:readCareCommand(value)}};}
