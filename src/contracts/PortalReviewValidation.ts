import type {ReviewCommand,ReviewRpcCall,GuidanceCommand,GuidanceRpcCall,GoalReportBody,ConversationBody,GuidanceBody,GuidanceBasis} from './PortalReview.ts';
import {readObject,requireValue,readDate} from './ConciergePortalValidation.ts';
import {readPlanShape,planScheduleShape,planDependencyBasisShape,planCommandFields} from './PortalRebuildValidation.ts';
import type {PlanShape} from './PortalRebuildValidation.ts';
import {careObject as obj,careArray as arr,careEnum as en,careNull as nil,careUnion as union,careUuid as uuid,careRevision as rev,carePositive as pos,careBool as bool,careDay as day,careKnown as known,carePublication as publication,sameCareValue} from './PortalCareValidation.ts';
import {reviewCommandMaxBytes,reviewBodyMaxBytes,conversationBodyMaxBytes,guidanceBodyMaxBytes,reviewTextMax,reviewComfortMax,reviewGoalsMax,reviewPhotosMax,reviewReferencesMax,conversationFactsMax,reviewSourcesPerFactMax,reviewPageMax} from './PortalReviewValues.ts';

export const reviewTextShape:PlanShape={type:'text',max:reviewTextMax,empty:false};
const blank:PlanShape={...reviewTextShape,empty:true},legacyText:PlanShape={...reviewTextShape,max:1000};
const identifier:PlanShape={type:'identifier'};
const uuidList=(max=reviewReferencesMax):PlanShape=>({...arr(uuid,max),unique:true});
const channel=en('portal','text','call','video','in_person');
export const reviewReportRefShape=obj({kind:en('legacy_report','goal_report'),id:uuid});
export const reviewPriorReviewShape=obj({kind:en('review'),id:uuid});
export const privateNoteSubjectShape=obj({kind:en('legacy_report','goal_report','conversation','review'),id:uuid});
export const reviewInputRefShape=obj({kind:en('legacy_report','goal_report','conversation','use','identity','reported_product'),id:uuid});
export const reviewOutputRefShape=obj({kind:en('review','instruction','reply'),id:uuid});
export const reviewSourceLocationShape=obj({sourceId:uuid,sourceVersion:pos,locator:union(obj({kind:en('whole')}),obj({kind:en('time'),startMs:rev,endMs:pos}),obj({kind:en('text'),start:rev,end:pos}),obj({kind:en('page'),page:pos}))});
export const goalReportBodyShape=obj({publication,answers:arr(obj({goalId:identifier,change:en('better','same','worse','not_sure')}),reviewGoalsMax),comfort:nil({...blank,max:reviewComfortMax}),actualUseEventIds:uuidList(),notes:nil(blank),photoIds:uuidList(reviewPhotosMax)});
export const legacyReportBodyShape=obj({comfort:legacyText,consistency:legacyText,changes:{...legacyText,empty:true},photoIds:uuidList(reviewPhotosMax)});
export const reportReplacementShape=union(obj({kind:en('goal_report'),body:goalReportBodyShape}),obj({kind:en('legacy_report'),body:legacyReportBodyShape}));
const factFields={id:identifier,text:reviewTextShape,sources:arr(reviewSourceLocationShape,reviewSourcesPerFactMax)};
const factRef=obj({kind:en('client_report','advisor_conclusion','agent_proposal'),id:identifier});
export const conversationBodyShape=obj({publication,occurredOn:day,channel:en('text','call','video','in_person'),clientReported:arr(obj(factFields),conversationFactsMax),advisorConclusions:arr(obj(factFields),conversationFactsMax),agentProposals:arr(obj({...factFields,proposedBy:known(uuid)}),conversationFactsMax),contradictions:arr(obj({left:factRef,right:factRef,note:reviewTextShape}),reviewReferencesMax)});
export const guidanceTargetShape=obj({draftId:uuid,clientId:uuid,kind:en('review','instruction','reply'),revision:pos,contentHash:{type:'hash'},basisHash:{type:'hash'}});
export const guidancePublisherShape=obj({kind:en('human'),actorId:uuid});
export const guidanceScopeShape=en('review.publish','instruction.publish','reply.publish');
export const guidanceBasisShape=obj({schemaVersion:en(1),publication,legacyBasis:planDependencyBasisShape.fields!.legacyBasis,legacyBasisManifestHash:planDependencyBasisShape.fields!.legacyBasisManifestHash,useHead:rev,reportHead:rev,instructionHead:rev,references:arr(obj({event:reviewInputRefShape,amendmentHeadId:nil(uuid)}),reviewReferencesMax),sources:arr(reviewSourceLocationShape,reviewReferencesMax)});
export const guidanceBodyShape=union(
 obj({kind:en('review'),publication,reportRefs:arr(reviewInputRefShape,reviewReferencesMax),occurredOn:day,channel,clientReport:blank,conclusion:blank,rationale:blank,changes:arr(blank,50),nextStep:blank,nextReviewOn:nil({type:'date'})}),
 obj({kind:en('instruction'),publication:obj({version:pos,documentSchemaVersion:en(3)}),slotId:identifier,productId:nil(identifier),baseInstructionId:nil(uuid),baseInstructionVersion:rev,useBasis:nil(obj({useRevision:rev,latestEventId:nil(uuid),amendmentHeadId:nil(uuid)})),directions:arr(blank,50),cautions:arr(blank,50),schedule:planScheduleShape,reason:blank,effectiveOn:{type:'date'},reviewId:nil(uuid)}),
 obj({kind:en('reply'),publication,reportRef:reviewReportRefShape,reply:blank,nextStep:nil(blank)})
);
export const guidanceReadSnapshotShape=obj({publication,currentPublication:publication,useHead:rev,reportHead:rev,instructionHead:rev,serviceRevision:rev,decisionRevision:rev,asOfDay:{type:'date'},manifestHash:{type:'hash'}});
const manifestRead={snapshot:guidanceReadSnapshotShape,cursor:nil({type:'text',max:104,empty:false}),limit:{...pos,max:reviewPageMax}};
const instructionRead={snapshot:guidanceReadSnapshotShape,instructionId:uuid,version:pos,contentHash:{type:'hash'} as PlanShape};
const write={requestId:uuid},reportWrite={...write,expectedReportRevision:{...rev,max:Number.MAX_SAFE_INTEGER-1}};
const page={cursor:nil({type:'text',max:104,empty:false}),limit:{...pos,max:reviewPageMax},version:nil(pos)};
export const reviewCommandFields:Record<ReviewCommand['action'],Record<string,PlanShape>>={
 submit_goal_report_v1:{...reportWrite,body:goalReportBodyShape,occurredOn:day},
 amend_report_v1:{...reportWrite,event:reviewReportRefShape,expectedAmendmentHeadId:nil(uuid),replacement:reportReplacementShape,occurredOn:day,reason:reviewTextShape},
 record_conversation_v1:{...reportWrite,clientId:uuid,body:conversationBodyShape},
 append_private_review_note_v1:{...write,clientId:uuid,reviewEvent:privateNoteSubjectShape,note:reviewTextShape},
 read_care_history_v1:page,read_advisor_care_history_v1:{...page,clientId:uuid},request_status_v1:write
 ,read_client_plan_v3:{version:nil(pos)},read_advisor_publication_v3:{clientId:uuid,version:nil(pos)},
 read_client_instruction_manifest_v1:manifestRead,read_advisor_instruction_manifest_v1:{...manifestRead,clientId:uuid},
 read_client_instruction_v1:instructionRead,read_advisor_instruction_v1:{...instructionRead,clientId:uuid},
 record_decision_v2:{...planCommandFields.record_decision_v1,expectedDecisionRevision:{...rev,max:Number.MAX_SAFE_INTEGER-1},snapshot:guidanceReadSnapshotShape}
};
export const guidanceCommandFields:Record<GuidanceCommand['action'],Record<string,PlanShape>>={
 create_guidance_draft_v1:{...write,clientId:uuid,body:guidanceBodyShape},read_guidance_draft_v1:{draftId:uuid},
 save_guidance_draft_v1:{...write,target:guidanceTargetShape,body:guidanceBodyShape},
 rebase_guidance_draft_v1:{...write,target:guidanceTargetShape,expectedBasis:guidanceBasisShape},
 review_guidance_v1:{...write,target:guidanceTargetShape},
 approve_guidance_v1:{...write,target:guidanceTargetShape,publisher:guidancePublisherShape,scope:guidanceScopeShape},
 publish_guidance_v1:{...write,target:guidanceTargetShape,approvalId:uuid,publisher:guidancePublisherShape},
 revoke_guidance_approval_v1:{...write,approvalId:uuid,expectedPolicyRevision:rev},request_status_v1:write
};

/** Accept JSON values only: no getters, React elements, class instances, cycles or lossy undefined. */
export function reviewJsonBytes(value:unknown):number{
 const active=new Set<object>();let nodes=0;
 const visit=(v:unknown,depth:number):void=>{
  requireValue(++nodes<=100000&&depth<=32);
  if(v===null||typeof v==='string'||typeof v==='boolean')return;
  if(typeof v==='number'){requireValue(Number.isFinite(v));return;}
  requireValue(typeof v==='object');const object=v as object;
  requireValue(!active.has(object)&&Object.getOwnPropertySymbols(object).length===0);
  requireValue(Array.isArray(v)||Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
  active.add(object);
  const names=Object.getOwnPropertyNames(v);
  requireValue(names.every(k=>Array.isArray(v)&&k==='length'||Object.getOwnPropertyDescriptor(v,k)?.enumerable===true&&Object.hasOwn(Object.getOwnPropertyDescriptor(v,k)!,'value')));
  if(Array.isArray(v)){requireValue(Object.keys(v).length===v.length);for(let i=0;i<v.length;i++){requireValue(Object.hasOwn(v,i));visit(v[i],depth+1);}}
  else for(const item of Object.values(v as object))visit(item,depth+1);
  active.delete(object);
 };
 visit(value,0);return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
/** Same exact shape reader as Plan/Care; normalize only UUID-typed fields, never ContentIds. */
export function readReviewShape(value:unknown,shape:PlanShape):unknown{
 const parsed=readPlanShape(value,shape);
 const normalize=(v:unknown,s:PlanShape):unknown=>{
  if(v===null)return null;if(s.type==='uuid')return (v as string).toLowerCase();
  if(s.type==='instant'){const stamp=v as string;readDate(stamp.slice(0,10));requireValue(Number(stamp.slice(11,13))<=23&&Number(stamp.slice(14,16))<=59&&Number(stamp.slice(17,19))<=59);return stamp;}
  if(s.type==='object')return Object.fromEntries(Object.entries(s.fields!).filter(([k])=>Object.hasOwn(v as object,k)).map(([k,f])=>[k,normalize((v as Record<string,unknown>)[k],f)]));
  if(s.type==='array')return (v as unknown[]).map(item=>normalize(item,s.item!));
  if(s.type==='union'){for(const variant of s.variants!){try{readPlanShape(v,variant);return normalize(v,variant);}catch{/* next exact variant */}}throw Error('invalid_input');}
  return v;
 };
 return normalize(parsed,shape);
}
export const validReviewCursor=(value:string):boolean=>/^r:[a-f0-9]{64}:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
export function checkSourceLocation(source:import('./PortalRebuild.ts').SourceLocation):void{
 if(source.locator.kind==='text')requireValue(source.locator.end>source.locator.start);
 if(source.locator.kind==='time')requireValue(source.locator.endMs>source.locator.startMs);
}
export function checkGoalReport(body:GoalReportBody):void{
 requireValue(reviewJsonBytes(body)<=reviewBodyMaxBytes);
 requireValue(new Set(body.answers.map(a=>a.goalId)).size===body.answers.length);
 for(const ids of [body.photoIds,body.actualUseEventIds])requireValue(new Set(ids).size===ids.length);
}
export function checkConversation(body:ConversationBody):void{
 requireValue(reviewJsonBytes(body)<=conversationBodyMaxBytes);
 const buckets={client_report:body.clientReported,advisor_conclusion:body.advisorConclusions,agent_proposal:body.agentProposals};
 const facts=Object.values(buckets).flat();requireValue(facts.length<=conversationFactsMax&&new Set(facts.map(f=>f.id)).size===facts.length);
 facts.forEach(f=>f.sources.forEach(checkSourceLocation));
 for(const conflict of body.contradictions){requireValue(!sameCareValue(conflict.left,conflict.right));for(const ref of [conflict.left,conflict.right])requireValue(buckets[ref.kind].some(f=>f.id===ref.id));}
}
function distinctReferences(refs:unknown[]):void{requireValue(new Set(refs.map(r=>JSON.stringify(r))).size===refs.length);}
export function checkGuidanceBasis(basis:GuidanceBasis):void{
 basis.sources.forEach(checkSourceLocation);distinctReferences(basis.references.map(r=>r.event));
}
export function checkGuidanceBody(body:GuidanceBody):void{
 requireValue(reviewJsonBytes(body)<=guidanceBodyMaxBytes);
 if(body.kind==='instruction'){
  requireValue((body.baseInstructionId===null)===(body.baseInstructionVersion===0));
  requireValue((body.productId===null)===(body.useBasis===null));
  if(body.useBasis)requireValue(body.useBasis.amendmentHeadId===null||body.useBasis.latestEventId!==null);
  requireValue(new Set(body.schedule.stages.map(s=>s.id)).size===body.schedule.stages.length);
 }else if(body.kind==='review')distinctReferences(body.reportRefs);
}
function checkPast(dayValue:import('./PortalRebuild.ts').Known<string>):void{
 if(dayValue.state==='known')requireValue(dayValue.value<=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
}
function parseCommand<T extends {action:string}>(value:unknown,fields:Record<string,Record<string,PlanShape>>):T{
 requireValue(reviewJsonBytes(value)<=reviewCommandMaxBytes);
 const v=readObject(value);requireValue(typeof v.action==='string'&&Object.hasOwn(fields,v.action));
 return readReviewShape(v,obj({schemaVersion:en(1),action:en(v.action),...fields[v.action]})) as T;
}
export function readReviewCommand(value:unknown):ReviewCommand{
 const command=parseCommand<ReviewCommand>(value,reviewCommandFields);
 if('cursor'in command&&command.cursor!==null)requireValue(validReviewCursor(command.cursor));
 if(command.action==='submit_goal_report_v1'){checkGoalReport(command.body);checkPast(command.occurredOn);}
 if(command.action==='amend_report_v1'){
  requireValue(command.event.kind===command.replacement.kind);checkPast(command.occurredOn);
  if(command.replacement.kind==='goal_report')checkGoalReport(command.replacement.body);
 }
 if(command.action==='record_conversation_v1'){checkConversation(command.body);checkPast(command.body.occurredOn);}
 if(command.action==='record_decision_v2')requireValue(command.expectedDecisionRevision===command.snapshot.decisionRevision&&command.publicationVersion===command.snapshot.publication.version&&sameCareValue(command.snapshot.publication,command.snapshot.currentPublication));
 return command;
}
export function readGuidanceCommand(value:unknown):GuidanceCommand{
 const command=parseCommand<GuidanceCommand>(value,guidanceCommandFields);
 if('body'in command){checkGuidanceBody(command.body);if('target'in command)requireValue(command.target.kind===command.body.kind);if(command.body.kind==='review')checkPast(command.body.occurredOn);}
 if(command.action==='approve_guidance_v1')requireValue(command.scope===`${command.target.kind}.publish`);
 if(command.action==='rebase_guidance_draft_v1')checkGuidanceBasis(command.expectedBasis);
 return command;
}
export function buildReviewRpc(value:unknown):ReviewRpcCall{return {name:'concierge_review_command_v1',args:{p_command:readReviewCommand(value)}};}
export function buildGuidanceRpc(value:unknown):GuidanceRpcCall{return {name:'concierge_guidance_command_v1',args:{p_command:readGuidanceCommand(value)}};}
/** Empty/whitespace-only submissions are a neutral no-op, never a fabricated report. */
export function goalReportHasObservation(body:GoalReportBody):boolean{return body.answers.length>0||!!body.comfort?.trim()||body.actualUseEventIds.length>0||!!body.notes?.trim()||body.photoIds.length>0;}
