import type {DraftDependenciesView} from './PortalCare.ts';
import {planDependenciesShape} from './PortalRebuildValidation.ts';
import type {PlanCommand,PlanContent,ClientPlanContent,DraftView,ExactTarget,Approval,PublishReceipt,ClientPlanView,PlanPolicyView,ReadinessIssue,UUID,AdvisorGateView,AdvisorPublicationView} from './PortalRebuild.ts';
import {planContentShape,readPlanShape,readPlanContent,readLegacyPlan} from './PortalRebuildValidation.ts';
import type {PlanShape} from './PortalRebuildValidation.ts';
import {presentationShape} from './ConciergePresentationValidation.ts';
import {readObject,requireValue} from './ConciergePortalValidation.ts';
const obj=(fields:Record<string,PlanShape>):PlanShape=>({type:'object',fields});
const arr=(item:PlanShape,max=1000):PlanShape=>({type:'array',item,max});
const en=(...values:(string|number|boolean|null)[]):PlanShape=>({type:'enum',values});
const nil=(s:PlanShape):PlanShape=>({...s,nullable:true});
const uuid:PlanShape={type:'uuid'},id:PlanShape={type:'identifier'},rev:PlanShape={type:'integer',min:0,max:Number.MAX_SAFE_INTEGER},pos:PlanShape={...rev,min:1},hash:PlanShape={type:'hash'},date:PlanShape={type:'date'},instant:PlanShape={type:'instant'},text:PlanShape={type:'text',max:4000,empty:true},bool:PlanShape={type:'boolean'};
const target=obj({draftId:uuid,clientId:uuid,contentRevision:rev,assignmentRevision:rev,contentHash:hash});
const publisher:PlanShape={type:'union',variants:[obj({kind:en('human'),actorId:uuid}),obj({kind:en('task_agent'),actorId:uuid,taskGrantId:uuid})]};
const issues=arr(obj({section:en('sources','context','decisions','routine','follow_up'),path:text,code:id}));
const draft=obj({id:uuid,clientId:nil(uuid),kind:en('care_plan'),state:en('working','published','archived'),contentRevision:rev,assignmentRevision:rev,contentHash:hash,content:planContentShape,savedAt:instant,basis:obj({publicationVersion:nil(pos),useRevision:rev}),origin:obj({kind:en('new','template','legacy','historical'),id:nil(text)})});
const draftView=obj({draft,target:nil(target),sections:arr(obj({sectionId:en('sources','context','decisions','routine','follow_up'),sectionHash:hash,reviewed:bool}),5),issues});
const clientContent:PlanShape={...planContentShape,fields:{...planContentShape.fields!,context:obj({products:planContentShape.fields!.context!.fields!.products!,facts:arr(obj({id,kind:en('client_report','advisor_conclusion','agent_proposal'),text}),200)})}};
const legacyOriginal=obj({version:pos,recommendations:arr(obj({id,slot:id,currentProductId:nil(id),proposedProductId:id,priceCents:{...rev,max:100000000},currency:en('USD'),rationale:text}),50),presentation:nil(presentationShape as PlanShape)});
const publishedPlan:PlanShape={type:'union',variants:[obj({documentSchemaVersion:en(3),version:pos,publishedAt:instant,content:clientContent}),obj({documentSchemaVersion:en(1,2),version:pos,publishedAt:instant,content:clientContent,legacyOriginal})]};
const approval=obj({...target.fields!,id:uuid,scope:en('care_plan.publish'),approvedBy:uuid,approvedAt:instant,publisher,revokedAt:nil(instant),publicationReceiptId:nil(uuid)});
const publication=obj({requestId:uuid,publicationReceiptId:uuid,target,kind:en('care_plan'),publicationVersion:pos,instructionId:en(null),reviewId:en(null),publishedAt:instant,firstServiceStarted:bool,notificationEventId:uuid});
const policy=obj({revision:rev,ownerActorId:uuid,requireKanujApproval:bool});
const capabilities=obj({actorId:uuid,view:bool,edit:bool,assign:bool,review:bool,approve:bool,publish:bool,confirmPayments:bool});
const decisionState={decisionRevision:rev,decisions:arr(obj({decisionId:id,choice:en('approved','deferred','declined'),reason:nil(text)}),50),actualUse:arr(obj({slot:id,productId:id,startedOn:date,publicationVersion:pos})),nextReviewOn:nil(date)};
export type PlanDirectory={nextCursor:string|null;drafts:Pick<DraftView['draft'],'id'|'clientId'|'state'|'contentRevision'|'assignmentRevision'|'savedAt'>[];publications:{clientId:UUID;version:number;publishedAt:string;documentSchemaVersion:1|2|3}[]};
export type PlanValidation={target:ExactTarget|null;issues:ReadinessIssue[]};
export type PlanPreview=PlanValidation&{mode:'advisor-preview';published:false;content:ClientPlanContent};
export type PlanImportComparison={baseContentRevision:number;baseAssignmentRevision:number;latest:DraftView;proposed:PlanContent;stale:boolean;proposalHash:string};
export type PlanDecisionReceipt={requestId:UUID;decisionRevision:number;publicationVersion:number;decisionId:string;choice:'approved'|'deferred'|'declined';reason:string|null};
export type PlanBusinessResult=DraftDependenciesView|DraftView|Approval|PublishReceipt|ClientPlanView|AdvisorGateView|AdvisorPublicationView|PlanPolicyView|PlanDirectory|PlanValidation|PlanPreview|PlanImportComparison|PlanDecisionReceipt|{checkpointId:UUID;target:ExactTarget|null}|{approvalId:UUID;revoked:true}|{grantId:UUID;revoked?:true};
export type PlanResult=PlanBusinessResult|{status:'absent'}|{status:'committed';receipt:PlanBusinessResult};
const shapes:Record<Exclude<PlanCommand['action'],'request_status_v1'>,PlanShape>={
 read_draft_dependencies_v1:planDependenciesShape,rebase_draft_dependencies_v1:draftView,
 create_draft_v1:draftView,save_draft_v1:draftView,read_draft_v1:draftView,assign_draft_v1:draftView,apply_import_v1:draftView,review_section_v1:draftView,restore_publication_v1:draftView,
 compare_import_v1:obj({baseContentRevision:rev,baseAssignmentRevision:rev,latest:draftView,proposed:planContentShape,stale:bool,proposalHash:hash}),
 checkpoint_draft_v1:obj({checkpointId:uuid,target:nil(target)}),validate_draft_v1:obj({target:nil(target),issues}),preview_draft_v1:obj({mode:en('advisor-preview'),published:en(false),target:nil(target),content:clientContent,issues}),
 approve_publication_v1:approval,revoke_approval_v1:obj({approvalId:uuid,revoked:en(true)}),publish_plan_v1:publication,
 read_advisor_gate_v1:obj({schemaVersion:en(1),clientId:uuid,target,publisher,approval:nil(approval),publication:en('first','later'),coverage:en('active','inactive'),capabilities,policy}),
 read_advisor_publication_v1:obj({schemaVersion:en(1),clientId:uuid,version:pos,plan:publishedPlan,...decisionState,reviewSchedule:nil(obj({firstPublicationAt:instant,twoWeekOn:date,monthOneOn:date,monthTwoOn:date,monthThreeOn:date})),clientAccess:obj({care:en('preparation','active','read_only','ended'),entitled:bool,canRead:bool,canWrite:bool})}),
 read_client_plan_v1:obj({schemaVersion:en(1),access:en('preparation','active','read_only'),plan:nil(publishedPlan),decisionRevision:rev,decisions:arr(obj({decisionId:id,choice:en('approved','deferred','declined'),reason:nil(text)}),50),actualUse:arr(obj({slot:id,productId:id,startedOn:date,publicationVersion:pos})),nextReviewOn:nil(date)}),
 record_decision_v1:obj({requestId:uuid,decisionRevision:pos,publicationVersion:pos,decisionId:id,choice:en('approved','deferred','declined'),reason:nil(text)}),
 read_policy_v1:policy,set_sami_approval_policy_v1:policy,grant_task_v1:obj({grantId:uuid}),revoke_task_v1:obj({grantId:uuid,revoked:en(true)}),
 list_plans_v1:obj({nextCursor:nil({type:'cursor'}),drafts:arr(obj({id:uuid,clientId:nil(uuid),state:en('working','published','archived'),contentRevision:rev,assignmentRevision:rev,savedAt:instant}),100),publications:arr(obj({clientId:uuid,version:pos,publishedAt:instant,documentSchemaVersion:en(1,2,3)}))}),
};
/** Response validation is strict as well: an added private field is a server error, never a pass-through. */
export function mapPlanResult(value:unknown,command:PlanCommand):PlanResult{
 if(command.action==='request_status_v1'){
  const v=readObject(value);
  if(v.status==='absent')return readPlanShape(v,obj({status:en('absent')})) as {status:'absent'};
  requireValue(v.status==='committed'&&Object.keys(v).length===2&&Object.hasOwn(v,'receipt'));
  // Stored receipts have the same finite response union; status cannot turn arbitrary JSON into trusted content.
  for(const [action,shape] of Object.entries(shapes)){if(action==='read_advisor_gate_v1'||action==='read_advisor_publication_v1'||action==='read_draft_dependencies_v1')continue;try{return {status:'committed',receipt:readPlanShape(v.receipt,shape) as PlanBusinessResult};}catch{/* next strict result */}}
  throw Error('invalid_input');
 }
 const shape=shapes[command.action];requireValue(shape);
 const result=readPlanShape(value,shape) as PlanBusinessResult;
 if(command.action==='read_draft_dependencies_v1'){const r=result as DraftDependenciesView;requireValue(r.draftId===command.draftId&&r.contentRevision===command.contentRevision&&r.assignmentRevision===command.assignmentRevision);}
 if('draft' in result){readPlanContent(result.draft.content);if('draftId' in command)requireValue(result.draft.id===command.draftId);}
 if(command.action==='record_decision_v1'){const r=result as PlanDecisionReceipt;requireValue(r.requestId===command.requestId&&r.decisionId===command.decisionId&&r.publicationVersion===command.publicationVersion&&r.choice===command.choice);}
 if(command.action==='publish_plan_v1'){const r=result as PublishReceipt;requireValue(r.requestId===command.requestId&&r.target.contentHash===command.target.contentHash&&r.target.clientId===command.target.clientId&&r.target.draftId===command.target.draftId);}
 if(command.action==='read_advisor_gate_v1'){
  const r=result as AdvisorGateView;
  const sameTarget=(a:ExactTarget,b:ExactTarget)=>a.draftId===b.draftId&&a.clientId===b.clientId&&a.contentRevision===b.contentRevision&&a.assignmentRevision===b.assignmentRevision&&a.contentHash===b.contentHash;
  const samePublisher=(a:AdvisorGateView['publisher'],b:AdvisorGateView['publisher'])=>a.kind===b.kind&&a.actorId===b.actorId&&(a.kind!=='task_agent'||b.kind==='task_agent'&&a.taskGrantId===b.taskGrantId);
  requireValue(r.clientId===command.target.clientId&&sameTarget(r.target,command.target)&&samePublisher(r.publisher,command.publisher));
  if(r.approval)requireValue(sameTarget(r.approval,command.target)&&samePublisher(r.approval.publisher,command.publisher)&&r.approval.revokedAt===null&&r.approval.publicationReceiptId===null);
 }
 if(command.action==='read_advisor_publication_v1'){
  const r=result as AdvisorPublicationView,a=r.clientAccess;
  requireValue(r.clientId===command.clientId&&(command.version===null||r.version===command.version)&&r.version===r.plan.version);
  if('legacyOriginal' in r.plan){requireValue(r.plan.legacyOriginal.version===r.version);readLegacyPlan(r.plan.legacyOriginal,r.plan.documentSchemaVersion);}
  requireValue(a.canRead===(a.entitled&&(a.care==='active'||a.care==='read_only'))&&(!a.canWrite||a.canRead&&a.care==='active'));
 }
 return result;
}
