import type {ReviewCommand,GuidanceCommand,ReviewResult,GuidanceResult,PortalReviewOutcome,ReviewWriteResult,GuidanceWriteResult,GuidanceDraftView,GuidanceApproval,GuidanceReceipt,ReportEvent,ReportAmendment,ClientCareHistoryPage,AdvisorCareHistoryPage,PublishedGuidance,GuidanceBody} from './PortalReview.ts';
import type {PlanShape} from './PortalRebuildValidation.ts';
import {readObject,requireValue} from './ConciergePortalValidation.ts';
import {careObject as obj,careArray as arr,careEnum as en,careNull as nil,careUnion as union,careUuid as uuid,careRevision as rev,carePositive as pos,careInstant as instant,careBool as bool,careDay as day,carePublication as publication,sameCareValue} from './PortalCareValidation.ts';
import {careHistoryEntryShape,mapCareResult} from './PortalCareMapping.ts';
import {reviewReportRefShape,reviewPriorReviewShape,privateNoteSubjectShape,reviewOutputRefShape,goalReportBodyShape,legacyReportBodyShape,reportReplacementShape,conversationBodyShape,guidanceTargetShape,guidancePublisherShape,guidanceScopeShape,guidanceBasisShape,guidanceBodyShape,reviewTextShape,reviewJsonBytes,readReviewShape,validReviewCursor,checkGoalReport,checkConversation,checkGuidanceBody,checkGuidanceBasis,readReviewCommand,readGuidanceCommand} from './PortalReviewValidation.ts';
import {reviewPageMax,reviewPageMaxBytes,reviewResponseMaxBytes,reviewErrorStatuses,isPortalReviewRead} from './PortalReviewValues.ts';
import type {PortalReviewErrorCode} from './PortalReviewValues.ts';

const attribution={occurredOn:day,channel:en('portal','text','call','video','in_person'),reportedBy:uuid,recordedBy:uuid,recordedAt:instant};
export const reportEventShape=union(obj({kind:en('goal_report'),id:uuid,body:goalReportBodyShape,...attribution}),obj({kind:en('legacy_report'),id:uuid,body:legacyReportBodyShape,...attribution}));
export const reportAmendmentShape=obj({id:uuid,event:reviewReportRefShape,previousAmendmentHeadId:nil(uuid),replacement:reportReplacementShape,occurredOn:day,reason:reviewTextShape,amendedBy:uuid,recordedAt:instant,attention:nil(obj({id:uuid,priorReview:reviewPriorReviewShape,state:en('unresolved','resolved'),resolvedBy:nil(reviewPriorReviewShape)}))});
const privateNoteShape=obj({id:uuid,reviewEvent:privateNoteSubjectShape,note:reviewTextShape,recordedBy:uuid,recordedAt:instant});
export const guidanceReviewShape=obj({id:uuid,target:guidanceTargetShape,reviewedBy:uuid,reviewedAt:instant});
export const guidanceApprovalShape=obj({id:uuid,target:guidanceTargetShape,scope:guidanceScopeShape,publisher:guidancePublisherShape,approvedBy:uuid,approvedAt:instant,policyRevision:rev,revokedAt:nil(instant),receiptId:nil(uuid)});
const issueShape=obj({path:en('body','body.clientReport','body.conclusion','body.rationale','body.nextStep','body.reply','body.directions','body.reason','body.schedule','basis','review'),code:en('required','unresolved_reference','basis_conflict','review_required')});
export const guidanceDraftViewShape=obj({target:guidanceTargetShape,body:guidanceBodyShape,capturedBasis:guidanceBasisShape,currentBasis:guidanceBasisShape,needsRebase:bool,savedAt:instant,recordedBy:uuid,review:nil(guidanceReviewShape),approval:nil(guidanceApprovalShape),issues:arr(issueShape,20)});
export const guidanceReceiptShape=obj({requestId:uuid,receiptId:uuid,target:guidanceTargetShape,approvalId:uuid,publisher:guidancePublisherShape,record:reviewOutputRefShape,publishedAt:instant,notificationEventId:uuid});
const draftReceipt=obj({requestId:uuid,draft:guidanceDraftViewShape});
const approvalReceipt=obj({requestId:uuid,approval:guidanceApprovalShape});
const revocationReceipt=obj({requestId:uuid,approvalId:uuid,revokedBy:uuid,revokedAt:instant,policyRevision:rev});
const guidanceWriteShape=union(draftReceipt,approvalReceipt,revocationReceipt,guidanceReceiptShape);
export const reportWriteReceiptShape=obj({requestId:uuid,action:en('submit_goal_report_v1','amend_report_v1','record_conversation_v1'),event:obj({kind:en('goal_report','legacy_report','conversation'),id:uuid}),amendmentId:nil(uuid),revision:pos,recordedAt:instant,notificationEventId:uuid,attentionEventId:uuid});
export const privateNoteReceiptShape=obj({requestId:uuid,action:en('append_private_review_note_v1'),noteId:uuid,reviewEvent:privateNoteSubjectShape,recordedBy:uuid,recordedAt:instant,notificationEventId:en(null)});
const reviewWriteShape=union(reportWriteReceiptShape,privateNoteReceiptShape);
const publishedShape=obj({record:reviewOutputRefShape,body:guidanceBodyShape,publishedBy:uuid,publishedAt:instant,originalStart:nil(day)});
export const clientCareHistoryEntryShape=union(...careHistoryEntryShape.variants!,obj({kind:en('publication'),publication,publishedAt:instant,recordedBy:uuid}),obj({kind:en('report'),event:reportEventShape}),obj({kind:en('report_amendment'),original:reportEventShape,amendment:reportAmendmentShape}),obj({kind:en('guidance'),guidance:publishedShape}));
export const advisorCareHistoryEntryShape=union(...clientCareHistoryEntryShape.variants!,obj({kind:en('conversation'),event:obj({id:uuid,body:conversationBodyShape,reportedBy:uuid,recordedBy:uuid,recordedAt:instant})}),obj({kind:en('private_note'),note:privateNoteShape}));
const pageFields={schemaVersion:en(1),version:nil(pos),heads:obj({useHead:rev,reportHead:rev,instructionHead:rev,serviceRevision:rev,publicationVersion:nil(pos)}),nextCursor:nil({type:'text',max:104,empty:false})};
export const clientCareHistoryPageShape=obj({...pageFields,audience:en('client'),entries:arr(clientCareHistoryEntryShape,reviewPageMax)});
export const advisorCareHistoryPageShape=obj({...pageFields,audience:en('advisor'),clientId:uuid,entries:arr(advisorCareHistoryEntryShape,reviewPageMax)});
const absentShape=obj({status:en('absent')});

function checkApproval(approval:GuidanceApproval):void{requireValue(approval.scope===`${approval.target.kind}.publish`);}
function checkReceipt(receipt:GuidanceReceipt):void{requireValue(receipt.record.kind===receipt.target.kind);}
function checkDraft(draft:GuidanceDraftView):void{
 checkGuidanceBody(draft.body);checkGuidanceBasis(draft.capturedBasis);checkGuidanceBasis(draft.currentBasis);
 requireValue(draft.target.kind===draft.body.kind&&sameCareValue(draft.body.publication,draft.capturedBasis.publication));
 requireValue(draft.needsRebase===!sameCareValue(draft.capturedBasis,draft.currentBasis));
 if(draft.review)requireValue(sameCareValue(draft.review.target,draft.target)&&!draft.needsRebase);
 if(draft.approval){checkApproval(draft.approval);requireValue(draft.review!==null&&sameCareValue(draft.approval.target,draft.target)&&draft.approval.revokedAt===null&&draft.approval.receiptId===null&&!draft.needsRebase);}
 const refs=draft.body.kind==='review'?draft.body.reportRefs:draft.body.kind==='reply'?[draft.body.reportRef]:[];
 for(const ref of refs)requireValue(draft.capturedBasis.references.some(r=>sameCareValue(r.event,ref)));
 const use=draft.body.kind==='instruction'?draft.body.useBasis:null;
 if(use){requireValue(use.useRevision===draft.capturedBasis.useHead);if(use.latestEventId)requireValue(draft.capturedBasis.references.some(r=>r.event.kind==='use'&&r.event.id===use.latestEventId&&r.amendmentHeadId===use.amendmentHeadId));}
}
function checkReportEvent(event:ReportEvent):void{if(event.kind==='goal_report'){checkGoalReport(event.body);requireValue(event.channel==='portal'&&event.reportedBy===event.recordedBy);}}
function checkAmendment(original:ReportEvent,amendment:ReportAmendment):void{
 checkReportEvent(original);requireValue(amendment.event.kind===original.kind&&amendment.event.id===original.id&&amendment.replacement.kind===original.kind);
 if(amendment.replacement.kind==='goal_report')checkGoalReport(amendment.replacement.body);
 if(amendment.attention)requireValue((amendment.attention.state==='resolved')===(amendment.attention.resolvedBy!==null));
}
function checkPublished(guidance:PublishedGuidance):void{
 checkGuidanceBody(guidance.body);requireValue(guidance.record.kind===guidance.body.kind);
 const nonblank=(s:string)=>s.trim().length>0;
 if(guidance.body.kind==='review')requireValue([guidance.body.clientReport,guidance.body.conclusion,guidance.body.rationale,guidance.body.nextStep].every(nonblank)&&guidance.body.changes.every(nonblank));
 if(guidance.body.kind==='reply')requireValue(nonblank(guidance.body.reply));
 if(guidance.body.kind==='instruction')requireValue(nonblank(guidance.body.reason)&&guidance.body.directions.length>0&&guidance.body.directions.every(nonblank));
 requireValue((guidance.body.kind==='instruction'&&guidance.body.productId!==null)===(guidance.originalStart!==null));
}
function checkHistory(page:ClientCareHistoryPage|AdvisorCareHistoryPage,command:Extract<ReviewCommand,{action:'read_care_history_v1'|'read_advisor_care_history_v1'}>):void{
 requireValue(reviewJsonBytes(page)<=reviewPageMaxBytes&&page.entries.length<=command.limit&&page.version===command.version);
 if(page.nextCursor!==null)requireValue(page.entries.length>0&&validReviewCursor(page.nextCursor));
 const care:import('./PortalCare.ts').UseHistoryEntry[]=[];const keys=new Set<string>();
 for(const entry of page.entries){
  let publicationVersion:number|null=null,key:string;
  switch(entry.kind){
   case 'publication':publicationVersion=entry.publication.version;key=`publication:${publicationVersion}`;break;
   case 'report':checkReportEvent(entry.event);publicationVersion=entry.event.kind==='goal_report'?entry.event.body.publication.version:null;key=`report:${entry.event.id}`;break;
   case 'report_amendment':checkAmendment(entry.original,entry.amendment);publicationVersion=entry.original.kind==='goal_report'?entry.original.body.publication.version:null;key=`amendment:${entry.amendment.id}`;break;
   case 'conversation':checkConversation(entry.event.body);publicationVersion=entry.event.body.publication.version;key=`conversation:${entry.event.id}`;break;
   case 'private_note':key=`note:${entry.note.id}`;break;
   case 'guidance':checkPublished(entry.guidance);publicationVersion=entry.guidance.body.publication.version;key=`guidance:${entry.guidance.record.id}`;break;
   case 'amendment':care.push(entry);publicationVersion=entry.amendment.replacement.product.kind==='plan_product'?entry.amendment.replacement.product.publication.version:null;key=`use_amendment:${entry.amendment.id}`;break;
   default:care.push(entry);publicationVersion=entry.event.sourcePublication?.version??null;key=`${entry.kind}:${entry.event.eventId}`;
  }
  requireValue(!keys.has(key));keys.add(key);
  if(command.version!==null)requireValue(publicationVersion===command.version);
 }
 if(care.length)mapCareResult({revision:page.heads.useHead,entries:care,nextCursor:null},{schemaVersion:1,action:'read_use_history_v1',product:null,cursor:null,limit:reviewPageMax});
}
function parseReviewWrite(value:unknown,requestId:string):ReviewWriteResult{
 const result=readReviewShape(value,reviewWriteShape) as ReviewWriteResult;requireValue(result.requestId===requestId);
 if(result.action!=='append_private_review_note_v1'){
  requireValue((result.action==='amend_report_v1')===(result.amendmentId!==null));
  requireValue(result.action==='submit_goal_report_v1'?result.event.kind==='goal_report':result.action==='record_conversation_v1'?result.event.kind==='conversation':result.event.kind!=='conversation');
 }
 return result;
}
function parseGuidanceWrite(value:unknown,requestId:string):GuidanceWriteResult{
 const result=readReviewShape(value,guidanceWriteShape) as GuidanceWriteResult;requireValue(result.requestId===requestId);
 if('draft'in result)checkDraft(result.draft);if('approval'in result)checkApproval(result.approval);if('record'in result)checkReceipt(result);
 return result;
}
/** Positive public and private envelopes are disjoint. Private fields are rejected, never hidden in UI. */
export function mapReviewResult(value:unknown,command:ReviewCommand):ReviewResult{
 requireValue(reviewJsonBytes(value)<=reviewResponseMaxBytes);
 if(command.action==='request_status_v1'){
  const v=readObject(value);if(v.status==='absent')return readReviewShape(v,absentShape) as {status:'absent'};
  const envelope=readReviewShape(v,obj({status:en('committed'),receipt:reviewWriteShape})) as {status:'committed';receipt:ReviewWriteResult};
  return {status:'committed',receipt:parseReviewWrite(envelope.receipt,command.requestId)};
 }
 if(command.action==='read_care_history_v1'||command.action==='read_advisor_care_history_v1'){
  const page=readReviewShape(value,command.action==='read_care_history_v1'?clientCareHistoryPageShape:advisorCareHistoryPageShape) as ClientCareHistoryPage|AdvisorCareHistoryPage;
  if(command.action==='read_advisor_care_history_v1')requireValue('clientId'in page&&page.clientId===command.clientId);
  checkHistory(page,command);return page;
 }
 const result=parseReviewWrite(value,command.requestId);requireValue(result.action===command.action);
 if(command.action==='append_private_review_note_v1'){requireValue(result.action==='append_private_review_note_v1'&&sameCareValue(result.reviewEvent,command.reviewEvent));}
 else {requireValue(result.action!=='append_private_review_note_v1'&&result.revision===command.expectedReportRevision+1);if(command.action==='amend_report_v1')requireValue(sameCareValue(result.event,command.event));}
 return result;
}
export function mapGuidanceResult(value:unknown,command:GuidanceCommand):GuidanceResult{
 requireValue(reviewJsonBytes(value)<=reviewResponseMaxBytes);
 if(command.action==='request_status_v1'){
  const v=readObject(value);if(v.status==='absent')return readReviewShape(v,absentShape) as {status:'absent'};
  const envelope=readReviewShape(v,obj({status:en('committed'),receipt:guidanceWriteShape})) as {status:'committed';receipt:GuidanceWriteResult};
  return {status:'committed',receipt:parseGuidanceWrite(envelope.receipt,command.requestId)};
 }
 if(command.action==='read_guidance_draft_v1'){
  const draft=readReviewShape(value,guidanceDraftViewShape) as GuidanceDraftView;checkDraft(draft);requireValue(draft.target.draftId===command.draftId);return draft;
 }
 const shape=command.action==='approve_guidance_v1'?approvalReceipt:command.action==='publish_guidance_v1'?guidanceReceiptShape:command.action==='revoke_guidance_approval_v1'?revocationReceipt:draftReceipt;
 const result=readReviewShape(value,shape) as GuidanceWriteResult;requireValue(result.requestId===command.requestId);
 if(command.action==='approve_guidance_v1'){
  requireValue('approval'in result);checkApproval(result.approval);requireValue(sameCareValue(result.approval.target,command.target)&&sameCareValue(result.approval.publisher,command.publisher)&&result.approval.scope===command.scope&&result.approval.revokedAt===null&&result.approval.receiptId===null);
 }else if(command.action==='publish_guidance_v1'){
  requireValue('record'in result);checkReceipt(result);requireValue(sameCareValue(result.target,command.target)&&sameCareValue(result.publisher,command.publisher)&&result.approvalId===command.approvalId);
 }else if(command.action==='revoke_guidance_approval_v1'){
  requireValue('revokedAt'in result&&result.approvalId===command.approvalId&&result.policyRevision===command.expectedPolicyRevision);
 }else {
  requireValue('draft'in result);checkDraft(result.draft);const next=result.draft;
  if(command.action==='create_guidance_draft_v1')requireValue(next.target.clientId===command.clientId&&next.target.revision===1&&sameCareValue(next.body,command.body)&&next.review===null&&next.approval===null);
  else{
   requireValue(next.target.draftId===command.target.draftId&&next.target.clientId===command.target.clientId&&next.target.kind===command.target.kind);
   if(command.action==='review_guidance_v1')requireValue(sameCareValue(next.target,command.target)&&next.review!==null&&sameCareValue(next.review.target,command.target));
   else {requireValue(next.target.revision===command.target.revision+1&&next.review===null&&next.approval===null);if(command.action==='save_guidance_draft_v1')requireValue(sameCareValue(next.body,command.body));else requireValue(sameCareValue(next.capturedBasis,command.expectedBasis)&&!next.needsRebase);}
  }
 }
 return result;
}
export function decodePortalReviewResponse(family:'review'|'guidance',command:ReviewCommand|GuidanceCommand,status:number,value:unknown):PortalReviewOutcome<ReviewResult|GuidanceResult>{
 // Parsing again guarantees an uncertain retry contains the identical bounded, secret-free payload.
 const parsed=family==='review'?readReviewCommand(command):readGuidanceCommand(command),read=isPortalReviewRead(parsed);
 const failed=():PortalReviewOutcome<never>=>read?{state:'rejected',status:503,code:'unavailable'}:{state:'uncertain',status:503,code:'uncertain',retry:parsed};
 if(status>=200&&status<300){try{return {state:'ok',value:family==='review'?mapReviewResult(value,parsed as ReviewCommand):mapGuidanceResult(value,parsed as GuidanceCommand)};}catch{return failed();}}
 try{
  requireValue(reviewJsonBytes(value)<=1024);const error=readReviewShape(value,obj({code:en(...Object.keys(reviewErrorStatuses))})) as {code:PortalReviewErrorCode};
  requireValue(reviewErrorStatuses[error.code]===status);
  if(status===503)return failed();return {state:'rejected',status,code:error.code};
 }catch{return failed();}
}
