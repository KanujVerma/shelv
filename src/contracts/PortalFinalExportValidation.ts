import type {FinalCareBasis,FinalExportBasis,FinalExportCommand,FinalExportRecord,FinalExportPlan} from './PortalFinalExport.ts';
import type {PlanShape} from './PortalRebuildValidation.ts';
import {planContentShape,planScheduleShape,readPlanShape,readLegacyPlan} from './PortalRebuildValidation.ts';
import {stepShape} from './ConciergePresentationValidation.ts';
import {readObject,readText,requireValue,exactKeys,readInteger} from './ConciergePortalValidation.ts';
import {finalExportInstructionScopesMax,finalExportRecordMaxBytes,finalExportPartCharacters} from './PortalFinalExportValues.ts';

export const exportObject=(fields:Record<string,PlanShape>):PlanShape=>({type:'object',fields});
export const exportEnum=(...values:(string|number|boolean|null)[]):PlanShape=>({type:'enum',values});
export const exportArray=(item:PlanShape,max:number):PlanShape=>({type:'array',item,max});
export const exportNullable=(shape:PlanShape):PlanShape=>({...shape,nullable:true});
export const exportRevision:PlanShape={type:'integer',min:0,max:Number.MAX_SAFE_INTEGER};
export const exportPositive:PlanShape={...exportRevision,min:1};
export const exportDate:PlanShape={type:'date'},exportInstant:PlanShape={type:'instant'},exportId:PlanShape={type:'identifier'},exportHash:PlanShape={type:'hash'};
const text:PlanShape={type:'text',max:4000,empty:true};
const known=exportObject({state:exportEnum('known'),value:exportDate});
export const exportKnownDate:PlanShape={type:'union',variants:[known,exportObject({state:exportEnum('unknown')})]};
const publication=exportObject({version:exportPositive,documentSchemaVersion:exportEnum(2,3)});
const careFields={supportEndsOn:exportDate,supportEndsAt:exportInstant,readOnlyEndsOn:exportDate,readOnlyEndsAt:exportInstant,publication,publishedAt:exportInstant};
export const finalCareBasisShape=exportObject(careFields);
export const finalExportBasisShape=exportObject({...careFields,recordHash:exportHash,recordBytes:{...exportPositive,max:finalExportRecordMaxBytes},recordCharacters:{...exportPositive,max:finalExportRecordMaxBytes},partCount:{...exportPositive,max:Math.ceil(finalExportRecordMaxBytes/finalExportPartCharacters)},instructionCount:{...exportRevision,max:finalExportInstructionScopesMax}});
const context=planContentShape.fields?.context;
requireValue(context?.fields?.products);
export const finalExportClientContentShape:PlanShape={...planContentShape,fields:{...planContentShape.fields,context:exportObject({products:context.fields.products,facts:exportArray(exportObject({id:exportId,kind:exportEnum('client_report','advisor_conclusion','agent_proposal'),text}),200)})}};
export const finalExportInstructionShape=exportObject({instructionId:{type:'uuid'},version:exportPositive,slotId:exportId,productId:exportNullable(exportId),effectiveOn:exportDate,publishedAt:exportInstant,originalStart:exportNullable(exportKnownDate),content:{type:'union',variants:[exportObject({format:exportEnum('authored_schedule'),directions:exportArray(text,50),cautions:exportArray(text,50),schedule:planScheduleShape,reason:text}),exportObject({format:exportEnum('legacy_usage'),usage:stepShape.fields!.usage!,reason:text})]}});
const knownText:PlanShape={type:'union',variants:[exportObject({state:exportEnum('unknown')}),exportObject({state:exportEnum('known'),value:text})]};
const useShape=exportObject({productId:exportId,state:exportEnum('not_reported','using','paused','stopped','using_differently','unreviewed'),originalStart:exportKnownDate,occurredOn:exportKnownDate,details:exportNullable(text),frequency:exportNullable(knownText),amount:exportNullable(knownText),contradiction:{type:'boolean'}});

/** Refuse executable objects/accessors before detaching; async readers never retain caller-owned JSON. */
export function detachFinalExportInput(value:unknown,depth=0):unknown{
 requireValue(depth<=100);
 if(value===null||typeof value==='string'||typeof value==='boolean')return value;
 if(typeof value==='number'){requireValue(Number.isFinite(value));return value;}
 requireValue(typeof value==='object'&&value!==null);
 if(Array.isArray(value))return Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));requireValue(d&&Object.hasOwn(d,'value'));const item:unknown=d.value;return detachFinalExportInput(item,depth+1);});
 requireValue(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
 return Object.fromEntries(Reflect.ownKeys(value).map(key=>{
  requireValue(typeof key==='string'&&!['__proto__','constructor','prototype'].includes(key));
  const d=Object.getOwnPropertyDescriptor(value,key);requireValue(d&&Object.hasOwn(d,'value')&&d.enumerable);
  const item:unknown=d.value;return [key,detachFinalExportInput(item,depth+1)];
 }));
}
export function freezeFinalExport(value:unknown):void{if(value!==null&&typeof value==='object'){for(const item of Object.values(value))freezeFinalExport(item);Object.freeze(value);}}
export function finalExportBytes(value:string):number{return new TextEncoder().encode(value).byteLength;}
export function assertFinalCareBasis(value:unknown):asserts value is FinalCareBasis{
 readPlanShape(value,finalCareBasisShape);const b=readObject(value);
 requireValue(Date.parse(String(b.publishedAt))<Date.parse(String(b.supportEndsAt))&&String(b.supportEndsOn)<String(b.readOnlyEndsOn));
 // Exact Chicago midnight offsets and calendar addition are produced by SQL, not a caller clock.
 const chicagoDay=(instant:unknown)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(String(instant)));
 requireValue(chicagoDay(b.supportEndsAt)===b.supportEndsOn&&chicagoDay(b.readOnlyEndsAt)===b.readOnlyEndsOn);
 const d=new Date(String(b.supportEndsOn)+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+30);requireValue(d.toISOString().slice(0,10)===b.readOnlyEndsOn);
 for(const at of [b.supportEndsAt,b.readOnlyEndsAt])requireValue(/T\d{2}:00:00\.000000Z$/.test(String(at))&&new Intl.DateTimeFormat('en-GB',{timeZone:'America/Chicago',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(String(at)))==='00:00:00');
}
export function assertFinalExportBasis(value:unknown):asserts value is FinalExportBasis{
 readPlanShape(value,finalExportBasisShape);const b=readObject(value);const {recordHash:_h,recordBytes:_b,recordCharacters:_c,partCount:_p,instructionCount:_i,...care}=b;assertFinalCareBasis(care);
 const chars=readInteger(b.recordCharacters,1),bytes=readInteger(b.recordBytes,1);requireValue(bytes>=chars&&bytes<=chars*4&&b.partCount===Math.ceil(chars/finalExportPartCharacters));
}
export function readFinalExportCommand(input:unknown):FinalExportCommand{
 const v=readObject(detachFinalExportInput(input));requireValue(v.schemaVersion===1);
 if(v.action==='read_final_export_manifest_v1'){exactKeys(v,['schemaVersion','action']);return {schemaVersion:1,action:v.action};}
 requireValue(v.action==='read_final_export_part_v1');exactKeys(v,['schemaVersion','action','basis','partIndex']);assertFinalExportBasis(v.basis);
 const partIndex=readInteger(v.partIndex,0,v.basis.partCount-1);freezeFinalExport(v.basis);return {schemaVersion:1,action:v.action,basis:v.basis,partIndex};
}
export function finalExportProductIds(plan:FinalExportPlan):string[]{
 if(plan.documentSchemaVersion===3)return plan.content.products.map(p=>p.id);
 const p=plan.legacyOriginal.presentation;requireValue(p);return [...new Set([...p.baselineRoutine.flatMap(s=>s.product?[s.product.id]:[]),...p.categoryCards.flatMap(c=>[...(c.currentProduct?[c.currentProduct.id]:[]),...(c.proposedProduct?[c.proposedProduct.id]:[])])])];
}
export function finalExportScopes(plan:FinalExportPlan):{slotId:string;productId:string|null}[]{
 const rows:{slotId:string;productId:string|null}[]=[];
 if(plan.documentSchemaVersion===3){for(const s of plan.content.routine)rows.push({slotId:s.slotId,productId:s.productId});for(const d of plan.content.decisions)for(const id of new Set([...d.currentProductIds,...d.alternativeProductIds,...(d.primaryProductId?[d.primaryProductId]:[])]))rows.push({slotId:d.slotId,productId:id});}
 else {const p=plan.legacyOriginal.presentation;requireValue(p);for(const s of p.baselineRoutine)if(s.slot)rows.push({slotId:s.slot,productId:s.productId});for(const c of p.categoryCards)for(const product of [c.currentProduct,c.proposedProduct])if(product)rows.push({slotId:c.slot,productId:product.id});}
 return [...new Map(rows.map(r=>[JSON.stringify([r.slotId,r.productId]),r])).values()];
}
/** Closed public schema plus complete cross-record binding, without a fabricated care-view envelope. */
function isFinalRecordStructure(value:unknown):value is FinalExportRecord{
 const v=readObject(value);exactKeys(v,['schemaVersion','careBasis','plan','use','instructions']);requireValue(v.schemaVersion===1);assertFinalCareBasis(v.careBasis);
 const p=readObject(v.plan);
 if(p.documentSchemaVersion===3){exactKeys(p,['documentSchemaVersion','content']);readPlanShape(p.content,finalExportClientContentShape);}
 else {requireValue(p.documentSchemaVersion===2);exactKeys(p,['documentSchemaVersion','legacyOriginal','goal']);readLegacyPlan(p.legacyOriginal,2);requireValue(readObject(p.legacyOriginal).presentation!==null);readText(p.goal,4000,true);}
 readPlanShape(v.use,exportArray(useShape,150));readPlanShape(v.instructions,exportArray(finalExportInstructionShape,finalExportInstructionScopesMax));
 return true;
}
export function assertFinalExportRecord(value:unknown):asserts value is FinalExportRecord{
 requireValue(isFinalRecordStructure(value));
 const r=value;requireValue(r.plan.documentSchemaVersion===r.careBasis.publication.documentSchemaVersion);
 if(r.plan.documentSchemaVersion===2)requireValue(r.plan.legacyOriginal.version===r.careBasis.publication.version);
 const ids=finalExportProductIds(r.plan),scopes=finalExportScopes(r.plan);requireValue(new Set(ids).size===ids.length&&r.use.length===ids.length&&new Set(r.use.map(u=>u.productId)).size===ids.length&&r.use.every(u=>ids.includes(u.productId)));
 const unique=new Set<string>();const instructionIds=new Set<string>();
 for(const i of r.instructions){const key=JSON.stringify([i.slotId,i.productId]);requireValue(!unique.has(key)&&!instructionIds.has(i.instructionId)&&scopes.some(s=>s.slotId===i.slotId&&s.productId===i.productId));unique.add(key);instructionIds.add(i.instructionId);
  requireValue(i.effectiveOn<r.careBasis.supportEndsOn&&Date.parse(i.publishedAt)<Date.parse(r.careBasis.supportEndsAt)&&(i.productId===null)===(i.originalStart===null));
  requireValue((i.content.format==='authored_schedule')===(r.plan.documentSchemaVersion===3));
  if(i.productId!==null)requireValue(sameFinalExportValue(i.originalStart,r.use.find(u=>u.productId===i.productId)?.originalStart));
 }
 for(const u of r.use)for(const d of [u.originalStart,u.occurredOn])if(d.state==='known')requireValue(d.value<r.careBasis.supportEndsOn);
}
export function sameFinalExportValue(a:unknown,b:unknown):boolean{
 if(a===b)return true;
 if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>sameFinalExportValue(v,b[i]));
 if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return false;
 const x=readObject(a),y=readObject(b),keys=Object.keys(x);return keys.length===Object.keys(y).length&&keys.every(k=>Object.hasOwn(y,k)&&sameFinalExportValue(x[k],y[k]));
}
