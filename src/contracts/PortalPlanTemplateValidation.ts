import type {PlanContent} from './PortalRebuild.ts';
import type {PlanShape} from './PortalRebuildValidation.ts';
import type {PlanTemplateCommand,PlanTemplatePage,PlanTemplateReceipt,PlanTemplateResult,PlanTemplateStatus,PlanTemplateVersion,PlanTemplateWriteCommand} from './PortalPlanTemplate.ts';
import {planContentShape,readPlanContent} from './PortalRebuildValidation.ts';
import {readReviewShape} from './PortalReviewValidation.ts';
import {requireValue,readObject} from './ConciergePortalValidation.ts';
import {careObject as object,careArray as array,careEnum as member,careNull as nullable,careUnion as union,careUuid as uuid,carePositive as positive,careInstant as instant} from './PortalCareValidation.ts';
import {planTemplateActions,planTemplateCommandMaxBytes,planTemplateResultMaxBytes,planTemplateListMaxBytes,planTemplatePageMax,planTemplateCursorMaxBytes,planTemplateNameMax} from './PortalPlanTemplateValues.ts';

const name:PlanShape={type:'text',max:planTemplateNameMax,empty:false};
const scope=union(object({kind:member('catalog')}),object({kind:member('versions'),templateId:uuid}));
const cursor=nullable({type:'text',max:planTemplateCursorMaxBytes,empty:false});
const write={requestId:uuid,name,content:planContentShape};
const fields:Record<PlanTemplateCommand['action'],Record<string,PlanShape>>={
 list_plan_templates_v1:{scope,cursor,limit:{...positive,max:planTemplatePageMax}},
 read_plan_template_version_v1:{templateVersionId:uuid},
 create_plan_template_v1:write,
 save_plan_template_version_v1:{...write,templateId:uuid,expectedVersion:{...positive,max:Number.MAX_SAFE_INTEGER-1}},
 plan_template_request_status_v1:{requestId:uuid},
};
const metadata={schemaVersion:member(1),templateId:uuid,templateVersionId:uuid,version:positive,versionHash:{type:'hash'} as PlanShape,name,createdAt:instant,createdBy:uuid};
const versionShape=object({...metadata,content:planContentShape});
const receiptShape=object({schemaVersion:member(1),requestId:uuid,action:member('create_plan_template_v1','save_plan_template_version_v1'),version:versionShape});
const pageShape=object({schemaVersion:member(1),scope,consistency:member('live_keyset'),observedAt:instant,entries:array(object(metadata),planTemplatePageMax),nextCursor:cursor});
const freeze=<T>(value:T):T=>{if(value!==null&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const scalarString=(value:string):void=>{for(const scalar of value){const code=scalar.codePointAt(0)!;requireValue(code<0xd800||code>0xdfff);}requireValue(!value.includes('\0'));};
/** New-family JSON copy/budget only. No inherited family's traversal or byte cap changes. */
function snapshot(value:unknown,maximum:number):unknown{
 let nodes=0;const active=new Set<object>();
 const copy=(v:unknown,depth:number):unknown=>{
  requireValue(++nodes<=maximum&&depth<=32);
  if(typeof v==='string'){requireValue(v.length<=maximum);scalarString(v);return v;}
  if(v===null||typeof v==='boolean')return v;
  if(typeof v==='number'){requireValue(Number.isSafeInteger(v));return v;}
  requireValue(v!==null&&typeof v==='object');const source=v as object;
  requireValue(!active.has(source)&&Object.getOwnPropertySymbols(source).length===0&&(Array.isArray(source)||Object.getPrototypeOf(source)===Object.prototype||Object.getPrototypeOf(source)===null));
  active.add(source);const descriptors:Record<string,PropertyDescriptor>=Object.getOwnPropertyDescriptors(source),keys=Object.keys(descriptors);
  requireValue(keys.every(k=>Array.isArray(source)&&k==='length'||descriptors[k]!.enumerable===true&&Object.hasOwn(descriptors[k]!,'value')));
  let result:unknown;
  if(Array.isArray(source)){
   const length=descriptors.length!.value;requireValue(Number.isSafeInteger(length)&&length>=0&&length<=maximum&&keys.length===length+1);
   result=Array.from({length},(_,i)=>{const descriptor=descriptors[String(i)];requireValue(descriptor);return copy(descriptor.value,depth+1);});
  }else result=Object.fromEntries(keys.map(k=>{scalarString(k);return [k,copy(descriptors[k]!.value,depth+1)];}));
  active.delete(source);return result;
 };
 const result=copy(value,0);requireValue(new TextEncoder().encode(JSON.stringify(result)).byteLength<=maximum);return result;
}
const checkCursor=(value:string|null):void=>{if(value!==null)requireValue(new TextEncoder().encode(value).byteLength<=planTemplateCursorMaxBytes&&!/[\u0000-\u001f\u007f]/.test(value));};
function reusable(content:PlanContent):void{
 requireValue(content.context.products.state==='unknown'&&content.context.facts.length===0&&content.consultationSections.length===0&&content.preparation.by===null&&content.preparation.on===null);
 requireValue(content.goals.every(g=>g.factIds.length===0)&&content.products.every(p=>p.factIds.length===0&&p.identity==='unresolved')&&content.decisions.every(d=>d.factIds.length===0&&d.currentProductIds.length===0&&d.recommendationId===null));
}
export function readPlanTemplateContent(input:unknown):PlanContent{
 const parsed=readPlanContent(readReviewShape(snapshot(input,planTemplateCommandMaxBytes),planContentShape));reusable(parsed);return freeze(parsed);
}
export function readPlanTemplateCommand(input:unknown):PlanTemplateCommand{
 const value=readObject(snapshot(input,planTemplateCommandMaxBytes));requireValue(typeof value.action==='string'&&planTemplateActions.includes(value.action as PlanTemplateCommand['action']));
 const command=readReviewShape(value,object({schemaVersion:member(1),action:member(value.action),...fields[value.action as PlanTemplateCommand['action']]})) as PlanTemplateCommand;
 if(command.action==='create_plan_template_v1'||command.action==='save_plan_template_version_v1'){readPlanContent(command.content);reusable(command.content);}
 if(command.action==='list_plan_templates_v1')checkCursor(command.cursor);
 return freeze(command);
}
function version(value:unknown):PlanTemplateVersion{
 const result=readReviewShape(value,versionShape) as PlanTemplateVersion;readPlanTemplateContent(result.content);return result;
}
function receipt(value:unknown,command:PlanTemplateWriteCommand):PlanTemplateReceipt{
 const result=readReviewShape(value,receiptShape) as PlanTemplateReceipt;version(result.version);
 requireValue(result.requestId===command.requestId&&result.action===command.action&&result.version.name===command.name&&JSON.stringify(result.version.content)===JSON.stringify(command.content));
 if(command.action==='create_plan_template_v1')requireValue(result.version.version===1);
 else requireValue(result.version.templateId===command.templateId&&result.version.version===command.expectedVersion+1);
 return result;
}
export function readPlanTemplateResult(input:unknown,command:PlanTemplateCommand):PlanTemplateResult{
 const value=snapshot(input,command.action==='list_plan_templates_v1'?planTemplateListMaxBytes:planTemplateResultMaxBytes);let result:PlanTemplateResult;
 if(command.action==='list_plan_templates_v1'){
  const page=readReviewShape(value,pageShape) as PlanTemplatePage;checkCursor(page.nextCursor);
  requireValue(JSON.stringify(page.scope)===JSON.stringify(command.scope)&&page.entries.length<=command.limit&&(page.nextCursor===null||page.entries.length===command.limit&&page.nextCursor!==command.cursor));
  const versionIds=new Set<string>(),templates=new Set<string>();let prior:PlanTemplatePage['entries'][number]|undefined;
  for(const entry of page.entries){
   requireValue(!versionIds.has(entry.templateVersionId)&&Date.parse(entry.createdAt)<=Date.parse(page.observedAt));versionIds.add(entry.templateVersionId);
   if(command.scope.kind==='catalog'){requireValue(!templates.has(entry.templateId)&&(!prior||prior.templateId<entry.templateId));templates.add(entry.templateId);}
   else requireValue(entry.templateId===command.scope.templateId&&(!prior||prior.version>entry.version));
   prior=entry;
  }
  result=page;
 }else if(command.action==='read_plan_template_version_v1'){
  const v=version(value);requireValue(v.templateVersionId===command.templateVersionId);result=v;
 }else if(command.action==='plan_template_request_status_v1'){
  const raw=readObject(value);
  if(raw.status==='absent')result=readReviewShape(value,object({schemaVersion:member(1),requestId:uuid,status:member('absent')})) as PlanTemplateStatus;
  else{
   requireValue(raw.status==='committed');const keys=Object.keys(raw);requireValue(keys.length===5&&['schemaVersion','requestId','status','original','receipt'].every(k=>Object.hasOwn(raw,k))&&raw.schemaVersion===1);
   const original=readPlanTemplateCommand(raw.original);requireValue(original.action==='create_plan_template_v1'||original.action==='save_plan_template_version_v1');
   const request=readReviewShape(raw.requestId,uuid) as string;requireValue(original.requestId===request);
   result={schemaVersion:1,status:'committed',requestId:request,original,receipt:receipt(raw.receipt,original)};
  }
  requireValue(result.requestId===command.requestId);
 }else result=receipt(value,command);
 return freeze(result);
}
