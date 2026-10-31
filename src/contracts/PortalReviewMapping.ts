import type {ReviewCommand,GuidanceCommand,ReviewResult,GuidanceResult,PortalReviewOutcome,ReviewWriteResult,GuidanceWriteResult,GuidanceDraftView,GuidanceApproval,GuidanceReceipt,ReportEvent,ReportAmendment,ClientCareHistoryPage,AdvisorCareHistoryPage,PublishedGuidance,GuidanceBody,ClientPlanViewV3,AdvisorPublicationViewV3,InstructionScope,InstructionManifestEntry,InstructionManifestPage,InstructionDetail,GuidanceReadSnapshot,CurrentGuidanceRef} from './PortalReview.ts';
import type {PlanShape} from './PortalRebuildValidation.ts';
import {readObject,requireValue} from './ConciergePortalValidation.ts';
import {careObject as obj,careArray as arr,careEnum as en,careNull as nil,careUnion as union,careUuid as uuid,careRevision as rev,carePositive as pos,careInstant as instant,careBool as bool,careDay as day,carePublication as publication,sameCareValue} from './PortalCareValidation.ts';
import {careHistoryEntryShape,mapCareResult} from './PortalCareMapping.ts';
import {stepShape} from './ConciergePresentationValidation.ts';
import {reviewReportRefShape,reviewPriorReviewShape,privateNoteSubjectShape,reviewOutputRefShape,goalReportBodyShape,legacyReportBodyShape,reportReplacementShape,conversationBodyShape,guidanceTargetShape,guidancePublisherShape,guidanceScopeShape,guidanceBasisShape,guidanceBodyShape,reviewTextShape,reviewJsonBytes,readReviewShape,validReviewCursor,checkGoalReport,checkConversation,checkGuidanceBody,checkGuidanceBasis,readReviewCommand,readGuidanceCommand,goalReportHasObservation} from './PortalReviewValidation.ts';
import {reviewPageMax,reviewPageMaxBytes,reviewResponseMaxBytes,reviewErrorStatuses,isPortalReviewRead,reviewInstructionScopesMax} from './PortalReviewValues.ts';
import {guidanceReadSnapshotShape} from './PortalReviewValidation.ts';
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
export const reportNoopReceiptShape=obj({requestId:uuid,action:en('submit_goal_report_v1'),outcome:en('no_op'),reason:en('no_observation'),revision:rev,event:en(null),amendmentId:en(null),notificationEventId:en(null),attentionEventId:en(null)});
export const guidanceDecisionReceiptShape=obj({requestId:uuid,action:en('record_decision_v2'),snapshot:guidanceReadSnapshotShape,decisionRevision:pos,publicationVersion:pos,decisionId:{type:'identifier'},choice:en('approved','deferred','declined'),reason:nil({...reviewTextShape,max:1000,empty:true})});
const reviewWriteShape=union(reportWriteReceiptShape,privateNoteReceiptShape,reportNoopReceiptShape,guidanceDecisionReceiptShape);
const publishedShape=obj({record:reviewOutputRefShape,body:guidanceBodyShape,publishedBy:uuid,publishedAt:instant,originalStart:nil(day)});
export const clientCareHistoryEntryShape=union(...careHistoryEntryShape.variants!,obj({kind:en('publication'),publication,publishedAt:instant,recordedBy:uuid}),obj({kind:en('report'),event:reportEventShape}),obj({kind:en('report_amendment'),original:reportEventShape,amendment:reportAmendmentShape}),obj({kind:en('guidance'),guidance:publishedShape}));
export const advisorCareHistoryEntryShape=union(...clientCareHistoryEntryShape.variants!,obj({kind:en('conversation'),event:obj({id:uuid,body:conversationBodyShape,reportedBy:uuid,recordedBy:uuid,recordedAt:instant})}),obj({kind:en('private_note'),note:privateNoteShape}));
const pageFields={schemaVersion:en(1),version:nil(pos),heads:obj({useHead:rev,reportHead:rev,instructionHead:rev,serviceRevision:rev,publicationVersion:nil(pos)}),nextCursor:nil({type:'text',max:104,empty:false})};
export const clientCareHistoryPageShape=obj({...pageFields,audience:en('client'),entries:arr(clientCareHistoryEntryShape,reviewPageMax)});
export const advisorCareHistoryPageShape=obj({...pageFields,audience:en('advisor'),clientId:uuid,entries:arr(advisorCareHistoryEntryShape,reviewPageMax)});
const absentShape=obj({status:en('absent')});
const identifier:PlanShape={type:'identifier'},hash:PlanShape={type:'hash'},date:PlanShape={type:'date'};
const manifestCursor=nil({type:'text',max:104,empty:false});
export const instructionScopeShape=obj({publication,slotId:identifier,productId:nil(identifier)});
const instructionUseShape=nil(obj({useRevision:rev,latestEventId:nil(uuid),amendmentHeadId:nil(uuid)}));
export const instructionManifestEntryShape=obj({instructionId:uuid,version:pos,format:en('authored_schedule','legacy_usage'),scope:instructionScopeShape,contentHash:hash,effectiveOn:date,baseInstructionId:nil(uuid),baseInstructionVersion:rev,reviewedUseBasis:instructionUseShape,basisStatus:en('current','changed','legacy_unversioned'),originalStart:nil(day)});
export const instructionManifestPageShape=obj({audience:en('client'),schemaVersion:en(1),snapshot:guidanceReadSnapshotShape,total:{...rev,max:reviewInstructionScopesMax},cursor:manifestCursor,items:arr(instructionManifestEntryShape,reviewPageMax),nextCursor:manifestCursor});
export const advisorInstructionManifestPageShape=obj({...instructionManifestPageShape.fields!,audience:en('advisor'),clientId:uuid});
const legacyInstructionShape=obj({id:uuid,version:pos,slot:identifier,productId:identifier,planVersion:pos,usage:stepShape.fields!.usage as PlanShape,reason:reviewTextShape,reviewId:nil(uuid),effectiveOn:date,source:obj({kind:en('baseline','activation'),publicationVersion:pos,recommendationId:nil(identifier)}),originalStartedOn:nil(date),authorId:uuid,createdAt:instant});
const authoredInstructionShape=guidanceBodyShape.variants![1];
export const instructionDetailShape=obj({audience:en('client'),schemaVersion:en(1),snapshot:guidanceReadSnapshotShape,item:instructionManifestEntryShape,content:union(obj({format:en('authored_schedule'),body:authoredInstructionShape}),obj({format:en('legacy_usage'),revision:legacyInstructionShape})),publishedBy:uuid,publishedAt:instant});
export const advisorInstructionDetailShape=obj({...instructionDetailShape.fields!,audience:en('advisor'),clientId:uuid});
export const currentGuidanceRefShape=obj({schemaVersion:en(1),mode:en('current_document','historical_document'),instructionSemantics:en('current_for_selected_publication'),snapshot:guidanceReadSnapshotShape,instructionCount:{...rev,max:reviewInstructionScopesMax}});
const publicReviewShape=nil(obj({reviewId:uuid,publicationVersion:pos,publishedAt:instant,occurredOn:day,conclusion:reviewTextShape,rationale:reviewTextShape,nextStep:reviewTextShape,nextReviewOn:nil(date)}));

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
function checkReportEvent(event:ReportEvent):void{if(event.kind==='goal_report'){checkGoalReport(event.body);requireValue(goalReportHasObservation(event.body)&&event.channel==='portal'&&event.reportedBy===event.recordedBy);}}
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
 if(result.action==='record_decision_v2')requireValue(result.decisionRevision===result.snapshot.decisionRevision+1&&result.publicationVersion===result.snapshot.publication.version&&sameCareValue(result.snapshot.publication,result.snapshot.currentPublication));
 else if(result.action!=='append_private_review_note_v1'&&!('outcome'in result)){
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
/** Enumerate only declared pairs. A decision may explicitly reference many products. */
export function instructionScopes(view:ClientPlanViewV3|AdvisorPublicationViewV3):InstructionScope[]{
 if(!view.plan)return [];const p=view.plan,scopes=new Map<string,InstructionScope>();
 const add=(slotId:string,productId:string|null)=>{const scope={publication:{version:p.version,documentSchemaVersion:p.documentSchemaVersion},slotId,productId};scopes.set(JSON.stringify([slotId,productId]),scope);};
 for(const step of p.content.routine)add(step.slotId,step.productId);
 for(const decision of p.content.decisions)for(const product of new Set([...decision.currentProductIds,...decision.alternativeProductIds,...(decision.primaryProductId?[decision.primaryProductId]:[])]))add(decision.slotId,product);
 requireValue(scopes.size<=reviewInstructionScopesMax);return [...scopes.values()];
}
function checkInstructionItem(item:InstructionManifestEntry,snapshot:GuidanceReadSnapshot):void{
 requireValue(sameCareValue(item.scope.publication,snapshot.publication)&&item.effectiveOn<=snapshot.asOfDay);
 requireValue((item.baseInstructionId===null)===(item.baseInstructionVersion===0));
 requireValue(item.version===item.baseInstructionVersion+1);
 requireValue((item.scope.productId===null)===(item.originalStart===null));
 if(item.format==='authored_schedule')requireValue(item.scope.publication.documentSchemaVersion===3&&(item.scope.productId===null)===(item.reviewedUseBasis===null)&&item.basisStatus!=='legacy_unversioned');
 else requireValue(item.scope.publication.documentSchemaVersion!==3&&item.scope.productId!==null&&item.reviewedUseBasis===null&&item.basisStatus==='legacy_unversioned');
 if(item.reviewedUseBasis){requireValue(item.reviewedUseBasis.amendmentHeadId===null||item.reviewedUseBasis.latestEventId!==null);if(item.basisStatus==='current')requireValue(item.reviewedUseBasis.useRevision===snapshot.useHead);}
}
function checkInstructionDetail(detail:InstructionDetail):void{
 const {item,snapshot,content}=detail;checkInstructionItem(item,snapshot);requireValue(content.format===item.format);
 if(content.format==='authored_schedule'){
  const body=content.body;checkGuidanceBody(body);requireValue(sameCareValue(body.publication,item.scope.publication)&&body.slotId===item.scope.slotId&&body.productId===item.scope.productId&&body.effectiveOn===item.effectiveOn&&body.baseInstructionId===item.baseInstructionId&&body.baseInstructionVersion===item.baseInstructionVersion&&sameCareValue(body.useBasis,item.reviewedUseBasis));
  requireValue(body.reason.trim().length>0&&body.directions.length>0&&body.directions.every(s=>s.trim().length>0));
 }else{
  const body=content.revision;requireValue(body.id===item.instructionId&&body.version===item.version&&body.slot===item.scope.slotId&&body.productId===item.scope.productId&&body.planVersion===item.scope.publication.version&&body.effectiveOn===item.effectiveOn&&body.authorId===detail.publishedBy&&body.createdAt===detail.publishedAt);
 }
}
function mapPlanV3(value:unknown,command:Extract<ReviewCommand,{action:'read_client_plan_v3'|'read_advisor_publication_v3'}>):ClientPlanViewV3|AdvisorPublicationViewV3{
 const raw=readObject(value);requireValue(raw.schemaVersion===3&&Object.hasOwn(raw,'currentGuidance')&&Object.hasOwn(raw,'latestPublicReview'));
 const {schemaVersion:_schema,currentGuidance,latestPublicReview,...rest}=raw;
 const base=mapCareResult({...rest,schemaVersion:2,latestPublicReview:null},command.action==='read_client_plan_v3'?{schemaVersion:1,action:'read_client_plan_v2',version:command.version}:{schemaVersion:1,action:'read_advisor_publication_v2',clientId:command.clientId,version:command.version}) as import('./PortalCare.ts').ClientPlanViewV2|import('./PortalCare.ts').AdvisorPublicationViewV2;
 const latest=readReviewShape(latestPublicReview,publicReviewShape) as ClientPlanViewV3['latestPublicReview'];
 const guidance=currentGuidance===null?null:readReviewShape(currentGuidance,currentGuidanceRefShape) as CurrentGuidanceRef;
 const result={...base,schemaVersion:3 as const,currentGuidance:guidance,latestPublicReview:latest} as ClientPlanViewV3|AdvisorPublicationViewV3;
 if(!result.plan){requireValue(guidance===null&&latest===null);return result;}
 requireValue(guidance!==null);const snapshot=guidance.snapshot;
 requireValue(sameCareValue(snapshot.publication,{version:result.plan.version,documentSchemaVersion:result.plan.documentSchemaVersion})&&snapshot.useHead===result.use.revision&&snapshot.decisionRevision===result.decisionRevision);
 requireValue(snapshot.currentPublication.version>=snapshot.publication.version&&guidance.mode===(sameCareValue(snapshot.publication,snapshot.currentPublication)?'current_document':'historical_document'));
 if(snapshot.publication.version===snapshot.currentPublication.version)requireValue(sameCareValue(snapshot.publication,snapshot.currentPublication));
 requireValue(guidance.instructionCount<=instructionScopes(result).length);
 if(latest)requireValue(latest.publicationVersion===snapshot.publication.version);
 return result;
}
/** Complete head-bound manifest; absence of a required page is not "no instruction". */
export function collectInstructionManifest(view:ClientPlanViewV3|AdvisorPublicationViewV3,pages:InstructionManifestPage[]):InstructionManifestEntry[]{
 requireValue(reviewJsonBytes(view)<=reviewResponseMaxBytes);const reference=view.currentGuidance;requireValue(reference!==null);
 if(reference.instructionCount===0){requireValue(pages.length===0);return [];}
 requireValue(pages.length>0);let cursor:string|null=null;const entries:InstructionManifestEntry[]=[],ids=new Set<string>(),scopes=new Set<string>(),seenCursors=new Set<string>();
 const allowed=new Set(instructionScopes(view).map(scope=>JSON.stringify([scope.slotId,scope.productId])));
 for(const [index,input] of pages.entries()){
  requireValue(reviewJsonBytes(input)<=reviewPageMaxBytes);const page=readReviewShape(input,'clientId'in view?advisorInstructionManifestPageShape:instructionManifestPageShape) as InstructionManifestPage;
  if('clientId'in view)requireValue('clientId'in page&&page.clientId===view.clientId);
  requireValue(sameCareValue(page.snapshot,reference.snapshot)&&page.total===reference.instructionCount&&page.cursor===cursor&&page.items.length>0);
  for(const item of page.items){checkInstructionItem(item,page.snapshot);const key=JSON.stringify([item.scope.slotId,item.scope.productId]);requireValue(allowed.has(key)&&!scopes.has(key)&&!ids.has(item.instructionId));scopes.add(key);ids.add(item.instructionId);entries.push(item);}
  if(page.nextCursor!==null){requireValue(validReviewCursor(page.nextCursor)&&!seenCursors.has(page.nextCursor));seenCursors.add(page.nextCursor);}cursor=page.nextCursor;
  if(index<pages.length-1)requireValue(cursor!==null);
 }
 requireValue(cursor===null&&entries.length===reference.instructionCount);return entries;
}
/** Pure shared-renderer join for one required scope. Missing detail blocks stale directions. */
export function bindInstructionForScope(view:ClientPlanViewV3|AdvisorPublicationViewV3,manifest:InstructionManifestEntry[],scope:InstructionScope,detail:InstructionDetail|null):InstructionDetail|null{
 const reference=view.currentGuidance;requireValue(reference!==null&&manifest.length===reference.instructionCount&&sameCareValue(scope.publication,reference.snapshot.publication));
 requireValue(instructionScopes(view).some(actual=>sameCareValue(actual,scope)));
 const matches=manifest.filter(item=>sameCareValue(item.scope,scope));requireValue(matches.length<=1);
 if(matches.length===0){requireValue(detail===null);return null;}
 requireValue(detail!==null&&reviewJsonBytes(detail)<=reviewPageMaxBytes);const parsed=readReviewShape(detail,'clientId'in view?advisorInstructionDetailShape:instructionDetailShape) as InstructionDetail;checkInstructionDetail(parsed);
 if('clientId'in view)requireValue('clientId'in parsed&&parsed.clientId===view.clientId);
 requireValue(sameCareValue(parsed.snapshot,reference.snapshot)&&sameCareValue(parsed.item,matches[0]));
 if(scope.productId!==null){const use=view.use.planProducts.find(state=>state.product.productId===scope.productId);requireValue(use!==undefined&&sameCareValue(parsed.item.originalStart,use.originalStart));if(parsed.item.basisStatus==='current'){requireValue(parsed.item.reviewedUseBasis?.latestEventId===(use.latestEvent?.eventId??null)&&parsed.item.reviewedUseBasis?.amendmentHeadId===(use.latestEvent?.amendment?.id??null));}}
 return parsed;
}
/** Positive public and private envelopes are disjoint. Private fields are rejected, never hidden in UI. */
export function mapReviewResult(value:unknown,command:ReviewCommand):ReviewResult{
 requireValue(reviewJsonBytes(value)<=reviewResponseMaxBytes);
 if(command.action==='read_client_plan_v3'||command.action==='read_advisor_publication_v3')return mapPlanV3(value,command);
 if(command.action==='read_client_instruction_manifest_v1'||command.action==='read_advisor_instruction_manifest_v1'){
  requireValue(reviewJsonBytes(value)<=reviewPageMaxBytes);const page=readReviewShape(value,command.action==='read_advisor_instruction_manifest_v1'?advisorInstructionManifestPageShape:instructionManifestPageShape) as InstructionManifestPage;
  if(command.action==='read_advisor_instruction_manifest_v1')requireValue('clientId'in page&&page.clientId===command.clientId);
  requireValue(sameCareValue(page.snapshot,command.snapshot)&&page.cursor===command.cursor&&page.items.length<=command.limit);
  requireValue(page.nextCursor===null||validReviewCursor(page.nextCursor)&&page.items.length>0);requireValue(page.items.length<=page.total);
  const ids=new Set<string>(),scopes=new Set<string>();for(const item of page.items){checkInstructionItem(item,page.snapshot);const key=JSON.stringify([item.scope.slotId,item.scope.productId]);requireValue(!ids.has(item.instructionId)&&!scopes.has(key));ids.add(item.instructionId);scopes.add(key);}
  return page;
 }
 if(command.action==='read_client_instruction_v1'||command.action==='read_advisor_instruction_v1'){
  requireValue(reviewJsonBytes(value)<=reviewPageMaxBytes);const detail=readReviewShape(value,command.action==='read_advisor_instruction_v1'?advisorInstructionDetailShape:instructionDetailShape) as InstructionDetail;checkInstructionDetail(detail);
  if(command.action==='read_advisor_instruction_v1')requireValue('clientId'in detail&&detail.clientId===command.clientId);
  requireValue(sameCareValue(detail.snapshot,command.snapshot)&&detail.item.instructionId===command.instructionId&&detail.item.version===command.version&&detail.item.contentHash===command.contentHash);return detail;
 }
 if(command.action==='request_status_v1'){
  const v=readObject(value);if(v.status==='absent')return readReviewShape(v,absentShape) as {status:'absent'};
  const envelope=readReviewShape(v,obj({status:en('committed'),receipt:reviewWriteShape})) as {status:'committed';receipt:ReviewWriteResult};
  return {status:'committed',receipt:parseReviewWrite(envelope.receipt,command.requestId)};
 }
 if(command.action==='record_decision_v2'){
  const receipt=parseReviewWrite(value,command.requestId);requireValue(receipt.action==='record_decision_v2'&&sameCareValue(receipt.snapshot,command.snapshot)&&receipt.decisionRevision===command.expectedDecisionRevision+1&&receipt.publicationVersion===command.publicationVersion&&receipt.decisionId===command.decisionId&&receipt.choice===command.choice&&receipt.reason===command.reason);return receipt;
 }
 if(command.action==='read_care_history_v1'||command.action==='read_advisor_care_history_v1'){
  const page=readReviewShape(value,command.action==='read_care_history_v1'?clientCareHistoryPageShape:advisorCareHistoryPageShape) as ClientCareHistoryPage|AdvisorCareHistoryPage;
  if(command.action==='read_advisor_care_history_v1')requireValue('clientId'in page&&page.clientId===command.clientId);
  checkHistory(page,command);return page;
 }
 const result=parseReviewWrite(value,command.requestId);requireValue(result.action===command.action);
 if(command.action==='append_private_review_note_v1'){requireValue(result.action==='append_private_review_note_v1'&&sameCareValue(result.reviewEvent,command.reviewEvent));}
 else if('outcome'in result){requireValue(command.action==='submit_goal_report_v1'&&!goalReportHasObservation(command.body)&&result.revision===command.expectedReportRevision);}
 else {requireValue(result.action!=='append_private_review_note_v1'&&result.revision===command.expectedReportRevision+1);if(command.action==='submit_goal_report_v1')requireValue(goalReportHasObservation(command.body));if(command.action==='amend_report_v1')requireValue(sameCareValue(result.event,command.event));}
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
