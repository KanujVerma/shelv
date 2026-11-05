import type {PlanContent,PlanCommand,PlanRpcCall,LegacyPlan} from './PortalRebuild.ts';
import {decisionKinds,taskActions} from './PortalRebuildValues.ts';
import {readObject,readArray,readIdentifier,readUuid,readText,readDate,readInteger,requireValue,exactKeys,readRecommendations} from './ConciergePortalValidation.ts';
import {presentationShape,readPresentationShape,readPresentationUrl} from './ConciergePresentationValidation.ts';
import type {Presentation} from './ConciergePresentation.ts';
export type PlanShape={type:string;fields?:Record<string,PlanShape>;item?:PlanShape;variants?:PlanShape[];values?:readonly (string|number|boolean|null)[];max?:number;min?:number;empty?:boolean;nullable?:boolean;optional?:boolean;unique?:boolean};
const object=(fields:Record<string,PlanShape>):PlanShape=>({type:'object',fields});
const array=(item:PlanShape,max=50,min=0,unique=false):PlanShape=>({type:'array',item,max,min,unique});
const text=(max=4000):PlanShape=>({type:'text',max,empty:true});
const en=(...values:(string|number|boolean)[]):PlanShape=>({type:'enum',values});
const nullable=(s:PlanShape):PlanShape=>({...s,nullable:true});
const union=(...variants:PlanShape[]):PlanShape=>({type:'union',variants});
const id:PlanShape={type:'identifier'},uuid:PlanShape={type:'uuid'},rev:PlanShape={type:'integer',min:0,max:Number.MAX_SAFE_INTEGER},positive:PlanShape={...rev,min:1},hash:PlanShape={type:'hash'},bool:PlanShape={type:'boolean'},instant:PlanShape={type:'instant'};
const ids=array(id,100,0,true),uuids=array(uuid,100,0,true),texts=array(text(),50);
const known=(value:PlanShape)=>union(object({state:en('unknown')}),object({state:en('known'),value}));
const r2=presentationShape as PlanShape;
const r2card=r2.fields!.categoryCards!.item!,r2product=r2card.fields!.currentProduct!;
// Rich R2 guidance has the same plain-content shape; blank unfinished text is safe storage.
function incomplete(shape:PlanShape):PlanShape{return {...shape,...(shape.type==='text'?{empty:true}:{}),...(shape.fields?{fields:Object.fromEntries(Object.entries(shape.fields).map(([k,s])=>[k,incomplete(s)]))}:{}),...(shape.item?{item:incomplete(shape.item),min:0}: {})};}
const source=incomplete(r2.fields!.sources!.item!),guide=incomplete(r2.fields!.routineGuides!.item!),evidence=incomplete(r2card.fields!.facts!.item!),comparison=incomplete(r2card.fields!.comparisons!.item!);
const location=object({sourceId:uuid,sourceVersion:positive,locator:union(object({kind:en('whole')}),object({kind:en('time'),startMs:rev,endMs:positive}),object({kind:en('text'),start:rev,end:positive}),object({kind:en('page'),page:positive}))});
const fact=object({id,kind:en('client_report','advisor_conclusion','agent_proposal'),visibility:en('advisor_only','client'),text:text(),sources:array(location),contradicts:ids});
export const planScheduleShape=object({periods:array(en('morning','evening'),2,0,true),days:union(object({kind:en('daily')}),object({kind:en('selected'),weekdays:array(en(1,2,3,4,5,6,7),7,0,true)})),condition:nullable(text(1000)),asNeeded:bool,stages:array(object({id,directions:text(),minimumDaysFromActualStart:nullable({...rev,max:3650}),proceedOnlyWhen:text(1000)}),20),anchor:en('actual_start'),automaticAdvance:en(false)});
const product=object({...incomplete(r2product).fields!,strength:known(text(200)),category:known(text(200)),identity:en('possible_match','client_confirmed','unresolved'),formula:en('unknown','label_recorded','verified'),factIds:ids,guides:array(guide),evidence:array(evidence)});
const guidance=object({title:text(200),subtitle:text(200),rationaleTitle:text(200),reasons:array(object({title:text(200),body:text()})),actions:texts,comparisons:array(comparison),factsTitle:text(200),facts:array(evidence),how:nullable(guide),sources:array(source),group:nullable(id),decisionLabels:nullable(object({current:text(120),proposed:text(120)}))});
export const planContentShape=object({schemaVersion:en(1),title:text(200),summary:text(),preparation:object({by:nullable(text(200)),on:nullable({type:'date'})}),consultationSections:array(object({title:text(200),body:text()})),routineGuides:array(guide),sources:array(source),context:object({products:union(object({state:en('unknown')}),object({state:en('none'),factId:id}),object({state:en('recorded'),productIds:ids})),facts:array(fact,200)}),goals:array(object({id,text:text(),factIds:ids})),products:array(product),decisions:array(object({usage:{...incomplete(r2card.fields!.usage!),optional:true},id,slotId:id,recommendationId:nullable(id),kind:en(...decisionKinds),goalIds:ids,currentProductIds:ids,primaryProductId:nullable(id),alternativeProductIds:ids,reason:text(),directions:texts,cautions:texts,limitations:texts,schedule:nullable(planScheduleShape),factIds:ids,guidance})),routine:array(object({usage:{...incomplete(r2.fields!.baselineRoutine!.item!.fields!.usage!),optional:true},id,slotId:id,kind:en('product','instruction'),productId:nullable(id),title:text(200),directions:texts,cautions:texts,schedule:planScheduleShape})),followUp:object({criteria:texts,authoredNotes:texts})});
const target=object({draftId:uuid,clientId:uuid,contentRevision:rev,assignmentRevision:rev,contentHash:hash});
const publisher=union(object({kind:en('human'),actorId:uuid}),object({kind:en('task_agent'),actorId:uuid,taskGrantId:uuid}));
const write={requestId:uuid,draftId:uuid,expectedContentRevision:rev,expectedAssignmentRevision:rev};
const at={draftId:uuid,contentRevision:rev,assignmentRevision:rev};
export const planDependencyBasisShape=object({schemaVersion:en(2),legacyBasis:object({publicationVersion:nullable(positive),useRevision:rev}),legacyBasisManifestHash:hash,useHead:rev,reportHead:rev,instructionHead:rev,references:array(object({event:object({kind:en('legacy_report','goal_report','conversation','use','identity','reported_product','review','reply','instruction'),id:{type:'text',max:100,empty:false}}),amendmentHeadId:nullable(uuid)}),100)});
export const planDependenciesShape=object({...at,captured:planDependencyBasisShape,current:planDependencyBasisShape,needsRebase:bool,affectedSections:array(en('sources','context','decisions','routine','follow_up'),5,0,true)});
export const planCommandFields:Record<PlanCommand['action'],Record<string,PlanShape>>={
 list_plans_v1:{clientId:nullable(uuid),cursor:nullable({type:'cursor'}),limit:{...positive,max:100}},read_draft_v1:{draftId:uuid},
 create_draft_v1:{requestId:uuid,kind:en('care_plan'),templateVersionId:nullable(uuid)},save_draft_v1:{...write,kind:en('care_plan'),content:planContentShape},checkpoint_draft_v1:{...write,label:text(200)},assign_draft_v1:{...write,fromClientId:nullable(uuid),toClientId:uuid,legacyAdoption:{...object({strategy:en('adopt_legacy'),expectedCaseRevision:rev}),optional:true}},
 compare_import_v1:{draftId:uuid,baseContentRevision:rev,baseAssignmentRevision:rev,content:planContentShape},apply_import_v1:{...write,baseContentRevision:rev,proposalHash:hash,content:planContentShape},
 read_draft_dependencies_v1:at,rebase_draft_dependencies_v1:{...write,expectedHeads:object({useHead:rev,reportHead:rev,instructionHead:rev}),expectedLegacyBasis:object({publicationVersion:nullable(positive),useRevision:rev}),expectedLegacyBasisManifestHash:hash},
 validate_draft_v1:at,preview_draft_v1:at,review_section_v1:{...write,sectionId:en('sources','context','decisions','routine','follow_up'),sectionHash:hash},
 approve_publication_v1:{requestId:uuid,target,scope:en('care_plan.publish'),publisher},revoke_approval_v1:{requestId:uuid,approvalId:uuid,expectedPolicyRevision:rev},publish_plan_v1:{requestId:uuid,target,approvalId:uuid,firstServiceClaimId:nullable(uuid)},
 read_advisor_gate_v1:{target,publisher},read_advisor_publication_v1:{clientId:uuid,version:nullable(positive)},
 read_client_plan_v1:{version:nullable(positive)},record_decision_v1:{requestId:uuid,expectedDecisionRevision:rev,publicationVersion:positive,decisionId:id,choice:en('approved','deferred','declined'),reason:nullable(text(1000))},
 restore_publication_v1:{requestId:uuid,clientId:uuid,publicationVersion:positive,expectedWorkingDraftId:nullable(uuid)},request_status_v1:{requestId:uuid},read_policy_v1:{},set_sami_approval_policy_v1:{requestId:uuid,expectedPolicyRevision:rev,requireKanujApproval:bool,confirmed:en(true)},
 grant_task_v1:{requestId:uuid,agentActorId:uuid,providerSessionId:uuid,clientId:nullable(uuid),draftId:nullable(uuid),actions:array(en(...taskActions),taskActions.length,1,true),sourceIds:uuids,expiresAt:instant},revoke_task_v1:{requestId:uuid,grantId:uuid},
};
export function readPlanShape(value:unknown,s:PlanShape):unknown{
 if(value===null&&s.nullable)return null;
 switch(s.type){
 case 'union':for(const variant of s.variants!){try{return readPlanShape(value,variant);}catch{/* next exact variant */}}throw Error('invalid_input');
 case 'object':{const v=readObject(value),fields=s.fields!;requireValue(Object.keys(v).every(k=>Object.hasOwn(fields,k))&&Object.entries(fields).every(([k,f])=>f.optional||Object.hasOwn(v,k)));return Object.fromEntries(Object.entries(fields).filter(([k,f])=>!f.optional||Object.hasOwn(v,k)).map(([k,f])=>[k,readPlanShape(v[k],f)]));}
 case 'array':{const a=readArray(value,s.max);requireValue(a.length>=(s.min??0));if(s.unique)requireValue(new Set(a).size===a.length);return a.map(v=>readPlanShape(v,s.item!));}
 case 'text':{const t=readText(value,s.max!,s.empty);requireValue(!/<[^>]*>|[\u0000]/u.test(t));return t;}
 case 'identifier':return readIdentifier(value);case 'uuid':return readUuid(value);case 'integer':return readInteger(value,s.min,s.max);case 'date':return readDate(value);case 'url':return readPresentationUrl(value);case 'image':return readPresentationUrl(value,true);
 case 'boolean':requireValue(typeof value==='boolean');return value;
 case 'enum':requireValue(s.values!.includes(value as never));return value;
 case 'cursor':{const c=readText(value,100);requireValue(/^(?:d:[0-9a-f-]{36}|p:[0-9a-f-]{36}:[0-9]{10})$/.test(c));return c;}
 case 'hash':{const h=readText(value,64);requireValue(/^[a-f0-9]{64}$/.test(h));return h;}
 case 'instant':{const t=readText(value,40);requireValue(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(t)&&Number.isFinite(Date.parse(t)));return t;}
 default:throw Error('invalid_input');
 }
}
export function readPlanContent(value:unknown):PlanContent{
 const c=readPlanShape(value,planContentShape) as PlanContent;
 for(const values of [c.products,c.goals,c.context.facts,c.decisions,c.routine])requireValue(new Set(values.map(v=>v.id)).size===values.length);
 const products=new Set(c.products.map(p=>p.id)),facts=new Set(c.context.facts.map(f=>f.id)),goals=new Set(c.goals.map(g=>g.id));
 const refs=(ids:string[],available:Set<string>)=>requireValue(ids.every(id=>available.has(id)));
 for(const f of c.context.facts){refs(f.contradicts,facts);for(const s of f.sources)if(s.locator.kind==='time')requireValue(s.locator.endMs>s.locator.startMs);else if(s.locator.kind==='text')requireValue(s.locator.end>s.locator.start);}
 for(const p of c.products)refs(p.factIds,facts);for(const g of c.goals)refs(g.factIds,facts);
 if(c.context.products.state==='recorded')refs(c.context.products.productIds,products);else if(c.context.products.state==='none')refs([c.context.products.factId],facts);
 for(const d of c.decisions){refs(d.goalIds,goals);refs(d.factIds,facts);refs([...d.currentProductIds,...d.alternativeProductIds,...(d.primaryProductId?[d.primaryProductId]:[])],products);}
 for(const s of c.routine)requireValue(s.kind==='instruction'?s.productId===null:s.productId!==null&&products.has(s.productId));
 return c;
}
export function readPlanCommand(value:unknown):PlanCommand{
 const v=readObject(value);requireValue(typeof v.action==='string'&&Object.hasOwn(planCommandFields,v.action));
 const command=readPlanShape(v,object({schemaVersion:en(1),action:en(v.action),...planCommandFields[v.action as PlanCommand['action']]})) as PlanCommand;
 if(command.action==='read_draft_dependencies_v1'||command.action==='rebase_draft_dependencies_v1'){command.draftId=command.draftId.toLowerCase();if('requestId'in command)command.requestId=command.requestId.toLowerCase();}
 if('content' in command)readPlanContent(command.content);
 if(command.action==='grant_task_v1')requireValue((command.clientId===null)!==(command.draftId===null));
 return command;
}
export function buildPlanRpc(value:unknown):PlanRpcCall{return {name:'concierge_plan_command_v1',args:{p_command:readPlanCommand(value)}};}
export function readLegacyPlan(value:unknown,version:1|2):LegacyPlan{
 const v=readObject(value);exactKeys(v,['version','recommendations','presentation']);
 requireValue(version===2?v.presentation!==null:v.presentation===null);
 return {version:readInteger(v.version,1),recommendations:readRecommendations(v.recommendations,{allowAdditions:true}),presentation:version===2?readPresentationShape(v.presentation,presentationShape) as Presentation:null};
}
