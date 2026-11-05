import type {UUID,ContentId,Revision,Hash,Known,SourceLocation,Schedule,Publisher} from './PortalRebuild.ts';
import type {ClientPublicationRef,Occurrence,UseHistoryEntry,DependencyBasisV2,ClientPlanViewV2,AdvisorPublicationViewV2,ReportedProductsPage} from './PortalCare.ts';
import type {InstructionRevision,ServiceReview} from './ConciergeService.ts';

/** Closed reports and guidance protocol. New agent actions remain denied. */
export type ReportRef={kind:'legacy_report'|'goal_report';id:UUID};
export type ReviewRef={kind:'review';id:UUID};
export type PrivateNoteSubject={kind:'legacy_report'|'goal_report'|'conversation'|'review';id:UUID};
export type GuidanceKind='review'|'instruction'|'reply';
export type GuidanceOutputRef={kind:GuidanceKind;id:UUID};
export type ReviewInputRef=ReportRef|{kind:'conversation'|'use'|'identity'|'reported_product';id:UUID};
export type GoalReportBody={publication:ClientPublicationRef;answers:{goalId:ContentId;change:'better'|'same'|'worse'|'not_sure'}[];comfort:string|null;actualUseEventIds:UUID[];notes:string|null;photoIds:UUID[]};
export type LegacyReportBody={comfort:string;consistency:string;changes:string;photoIds:UUID[]};
export type ReportReplacement={kind:'goal_report';body:GoalReportBody}|{kind:'legacy_report';body:LegacyReportBody};
export type ConversationFact={id:ContentId;text:string;sources:SourceLocation[]};
export type ConversationFactRef={kind:'client_report'|'advisor_conclusion'|'agent_proposal';id:ContentId};
export type ConversationBody={publication:ClientPublicationRef;occurredOn:Known<string>;channel:Exclude<Occurrence['channel'],'portal'>;clientReported:ConversationFact[];advisorConclusions:ConversationFact[];agentProposals:(ConversationFact&{proposedBy:Known<UUID>})[];contradictions:{left:ConversationFactRef;right:ConversationFactRef;note:string}[]};
export type ReportEvent=({kind:'goal_report';body:GoalReportBody}|{kind:'legacy_report';body:LegacyReportBody})&{id:UUID;occurredOn:Known<string>;channel:Occurrence['channel'];reportedBy:UUID;recordedBy:UUID;recordedAt:string};
export type ConversationEvent={id:UUID;body:ConversationBody;reportedBy:UUID;recordedBy:UUID;recordedAt:string};
export type ReviewAttention={id:UUID;priorReview:ReviewRef;state:'unresolved'|'resolved';resolvedBy:ReviewRef|null};
export type ReviewAttentionEvent={eventId:UUID;publication:ClientPublicationRef;amendmentId:UUID;event:ReportRef;attention:ReviewAttention;recordedAt:string};
export type ReportAmendment={id:UUID;event:ReportRef;previousAmendmentHeadId:UUID|null;replacement:ReportReplacement;occurredOn:Known<string>;reason:string;amendedBy:UUID;recordedAt:string;attention:ReviewAttention|null};
export type PrivateReviewNote={id:UUID;reviewEvent:PrivateNoteSubject;note:string;recordedBy:UUID;recordedAt:string};

export type InstructionUseBasis={useRevision:Revision;latestEventId:UUID|null;amendmentHeadId:UUID|null};
export type GuidanceBody=
 |{kind:'review';publication:ClientPublicationRef;reportRefs:ReviewInputRef[];occurredOn:Known<string>;channel:Occurrence['channel'];clientReport:string;conclusion:string;rationale:string;changes:string[];nextStep:string;nextReviewOn:string|null}
 |{kind:'instruction';publication:{version:number;documentSchemaVersion:3};slotId:ContentId;productId:ContentId|null;baseInstructionId:UUID|null;baseInstructionVersion:Revision;useBasis:InstructionUseBasis|null;directions:string[];cautions:string[];schedule:Schedule;reason:string;effectiveOn:string;reviewId:UUID|null}
 |{kind:'reply';publication:ClientPublicationRef;reportRef:ReportRef;reply:string;nextStep:string|null};
export type GuidanceTarget<K extends GuidanceKind=GuidanceKind>={draftId:UUID;clientId:UUID;kind:K;revision:Revision;contentHash:Hash;basisHash:Hash};
/** Captured private basis, independent of PlanDraft and its frozen basis/index semantics. */
export type GuidanceSourceManifest={schemaVersion:1;hash:Hash;count:Revision};
export type GuidanceBasis=Pick<DependencyBasisV2,'legacyBasis'|'legacyBasisManifestHash'|'useHead'|'reportHead'|'instructionHead'>&{schemaVersion:1;publication:ClientPublicationRef;references:{event:ReviewInputRef;amendmentHeadId:UUID|null}[];sourceManifest:GuidanceSourceManifest};
export type GuidancePublisher=Extract<Publisher,{kind:'human'}>;
export type GuidanceScope='review.publish'|'instruction.publish'|'reply.publish';
export type GuidanceReview={id:UUID;target:GuidanceTarget;reviewedBy:UUID;reviewedAt:string};
export type GuidanceApproval={[K in GuidanceKind]:{id:UUID;target:GuidanceTarget<K>;scope:`${K}.publish`;publisher:GuidancePublisher;approvedBy:UUID;approvedAt:string;policyRevision:Revision;revokedAt:string|null;receiptId:UUID|null}}[GuidanceKind];
export type GuidanceIssue={path:'body'|'body.clientReport'|'body.conclusion'|'body.rationale'|'body.nextStep'|'body.reply'|'body.directions'|'body.reason'|'body.schedule'|'basis'|'review';code:'required'|'unresolved_reference'|'basis_conflict'|'review_required'};
export type GuidanceDraftView={target:GuidanceTarget;body:GuidanceBody;capturedBasis:GuidanceBasis;currentBasis:GuidanceBasis;needsRebase:boolean;savedAt:string;recordedBy:UUID;review:GuidanceReview|null;approval:GuidanceApproval|null;issues:GuidanceIssue[]};
/** Persisted linkage must be enforced by deferred SQL constraints, never a caller override. */
export type GuidanceReceipt={requestId:UUID;receiptId:UUID;target:GuidanceTarget;approvalId:UUID;publisher:GuidancePublisher;record:GuidanceOutputRef;publishedAt:string;notificationEventId:UUID};
export type PublishedGuidance={record:GuidanceOutputRef;body:GuidanceBody;publishedBy:UUID;publishedAt:string;originalStart:Known<string>|null};
export type ReportWriteReceipt={requestId:UUID;action:'submit_goal_report_v1'|'amend_report_v1'|'record_conversation_v1';event:ReportRef|{kind:'conversation';id:UUID};amendmentId:UUID|null;revision:Revision;recordedAt:string;notificationEventId:UUID;attentionEventId:UUID};
export type PrivateNoteReceipt={requestId:UUID;action:'append_private_review_note_v1';noteId:UUID;reviewEvent:PrivateNoteSubject;recordedBy:UUID;recordedAt:string;notificationEventId:null};
export type ReportNoopReceipt={requestId:UUID;action:'submit_goal_report_v1';outcome:'no_op';reason:'no_observation';revision:Revision;event:null;amendmentId:null;notificationEventId:null;attentionEventId:null};
export type GuidanceDecisionReceipt=import('./PortalRebuildMapping.ts').PlanDecisionReceipt&{action:'record_decision_v2';snapshot:GuidanceReadSnapshot};
export type ReviewWriteResult=ReportWriteReceipt|PrivateNoteReceipt|ReportNoopReceipt|GuidanceDecisionReceipt;
export type GuidanceDraftReceipt={requestId:UUID;draft:GuidanceDraftView};
export type GuidanceApprovalReceipt={requestId:UUID;approval:GuidanceApproval};
export type GuidanceRevocationReceipt={requestId:UUID;approvalId:UUID;revokedBy:UUID;revokedAt:string;policyRevision:Revision};
export type GuidanceWriteResult=GuidanceDraftReceipt|GuidanceApprovalReceipt|GuidanceRevocationReceipt|GuidanceReceipt;

export type LegacyCareHistoryEntry={kind:'legacy_review';review:ServiceReview;publication:null}|{kind:'legacy_instruction';revision:InstructionRevision}|{kind:'legacy_reply';id:UUID;report:ReportRef;reply:string;recordedBy:UUID;recordedAt:string;publication:null};
export type ClientCareHistoryEntry=
 |{kind:'publication';publication:ClientPublicationRef;publishedAt:string;recordedBy:UUID}
 |{kind:'report';event:ReportEvent}
 |{kind:'report_amendment';original:ReportEvent;amendment:ReportAmendment}
 |({kind:'review_attention'}&ReviewAttentionEvent)
 |{kind:'guidance';guidance:PublishedGuidance}
 |UseHistoryEntry|LegacyCareHistoryEntry;
export type LegacyReviewNote={kind:'legacy_review_note';reviewId:UUID;note:string};
export type AdvisorCareHistoryEntry=ClientCareHistoryEntry|{kind:'conversation';event:ConversationEvent}|{kind:'private_note';note:PrivateReviewNote}|LegacyReviewNote;
export type CareHistoryHeads={useHead:Revision;reportHead:Revision;instructionHead:Revision;serviceRevision:Revision;publicationVersion:number|null};
type HistoryPage={schemaVersion:1;version:number|null;heads:CareHistoryHeads;nextCursor:string|null};
export type ClientCareHistoryPage=HistoryPage&{audience:'client';entries:ClientCareHistoryEntry[]};
export type AdvisorCareHistoryPage=HistoryPage&{audience:'advisor';clientId:UUID;entries:AdvisorCareHistoryEntry[]};
/** Public consistency token, never an access capability or permission frozen at asOfDay. */
export type GuidanceReadSnapshot={publication:ClientPublicationRef;currentPublication:ClientPublicationRef;useHead:Revision;reportHead:Revision;instructionHead:Revision;serviceRevision:Revision;decisionRevision:Revision;asOfDay:string;manifestHash:Hash};
export type CurrentGuidanceRef={schemaVersion:1;mode:'current_document'|'historical_document';instructionSemantics:'current_for_selected_publication';snapshot:GuidanceReadSnapshot;instructionCount:number};
export type DecisionGuidanceState={decisionId:ContentId;recordedDecisionRevision:Revision|null;acceptedSnapshot:GuidanceReadSnapshot|null;basisStatus:'current'|'stale'|'legacy_unbound'};
export type ClientPlanViewV3=Omit<ClientPlanViewV2,'schemaVersion'>&{schemaVersion:3;currentGuidance:CurrentGuidanceRef|null;decisionGuidance:DecisionGuidanceState[]};
export type AdvisorPublicationViewV3=Omit<AdvisorPublicationViewV2,'schemaVersion'>&{schemaVersion:3;currentGuidance:CurrentGuidanceRef;decisionGuidance:DecisionGuidanceState[]};
export type InstructionScope={publication:ClientPublicationRef;slotId:ContentId;productId:ContentId|null};
export type InstructionManifestEntry={instructionId:UUID;version:Revision;format:'authored_schedule'|'legacy_usage';scope:InstructionScope;contentHash:Hash;effectiveOn:string;baseInstructionId:UUID|null;baseInstructionVersion:Revision;reviewedUseBasis:InstructionUseBasis|null;basisStatus:'current'|'changed'|'legacy_unversioned';originalStart:Known<string>|null};
type InstructionAudience={audience:'client'}|{audience:'advisor';clientId:UUID};
export type InstructionManifestPage=InstructionAudience&{schemaVersion:1;snapshot:GuidanceReadSnapshot;total:number;cursor:string|null;items:InstructionManifestEntry[];nextCursor:string|null};
export type InstructionContent={format:'authored_schedule';body:Extract<GuidanceBody,{kind:'instruction'}>}|{format:'legacy_usage';revision:InstructionRevision};
export type InstructionDetail=InstructionAudience&{schemaVersion:1;snapshot:GuidanceReadSnapshot;item:InstructionManifestEntry;content:InstructionContent;publishedBy:UUID;publishedAt:string};
type ManifestRead={snapshot:GuidanceReadSnapshot;cursor:string|null;limit:number};
type InstructionRead={snapshot:GuidanceReadSnapshot;instructionId:UUID;version:Revision;contentHash:Hash};
type ReportWrite={requestId:UUID;expectedReportRevision:Revision};
export type ReviewCommand={schemaVersion:1}&(
 |({action:'submit_goal_report_v1';body:GoalReportBody;occurredOn:Known<string>}&ReportWrite)
 |({action:'amend_report_v1';event:ReportRef;expectedAmendmentHeadId:UUID|null;replacement:ReportReplacement;occurredOn:Known<string>;reason:string}&ReportWrite)
 |({action:'record_conversation_v1';clientId:UUID;body:ConversationBody}&ReportWrite)
 |{action:'append_private_review_note_v1';requestId:UUID;clientId:UUID;reviewEvent:PrivateNoteSubject;note:string}
 |{action:'read_care_history_v1';cursor:string|null;limit:number;version:number|null}
 |{action:'read_advisor_care_history_v1';clientId:UUID;cursor:string|null;limit:number;version:number|null}
 |{action:'read_client_plan_v3';version:number|null}
 |{action:'read_advisor_publication_v3';clientId:UUID;version:number|null}
 |{action:'read_advisor_reported_products_v1';clientId:UUID;cursor:string|null;limit:number;expectedUseRevision:Revision;publicationVersion:number|null}
 |({action:'read_client_instruction_manifest_v1'}&ManifestRead)
 |({action:'read_advisor_instruction_manifest_v1';clientId:UUID}&ManifestRead)
 |({action:'read_client_instruction_v1'}&InstructionRead)
 |({action:'read_advisor_instruction_v1';clientId:UUID}&InstructionRead)
 |{action:'record_decision_v2';requestId:UUID;expectedDecisionRevision:Revision;publicationVersion:number;decisionId:ContentId;choice:'approved'|'deferred'|'declined';reason:string|null;snapshot:GuidanceReadSnapshot}
 |{action:'request_status_v1';requestId:UUID});
export type GuidanceCommand={schemaVersion:1}&(
 |{action:'create_guidance_draft_v1';requestId:UUID;clientId:UUID;body:GuidanceBody}
 |{action:'read_guidance_draft_v1';draftId:UUID}
 |{action:'save_guidance_draft_v1';requestId:UUID;target:GuidanceTarget;body:GuidanceBody}
 |{action:'rebase_guidance_draft_v1';requestId:UUID;target:GuidanceTarget;expectedBasis:GuidanceBasis}
 |{action:'review_guidance_v1';requestId:UUID;target:GuidanceTarget}
 |{action:'approve_guidance_v1';requestId:UUID;target:GuidanceTarget;publisher:GuidancePublisher;scope:GuidanceScope}
 |{action:'publish_guidance_v1';requestId:UUID;target:GuidanceTarget;approvalId:UUID;publisher:GuidancePublisher}
 |{action:'revoke_guidance_approval_v1';requestId:UUID;approvalId:UUID;expectedPolicyRevision:Revision}
 |{action:'request_status_v1';requestId:UUID});
export type ReviewRpcCall={name:'concierge_review_command_v1';args:{p_command:ReviewCommand}};
export type GuidanceRpcCall={name:'concierge_guidance_command_v1';args:{p_command:GuidanceCommand}};
export type ReviewResult=ReviewWriteResult|ClientCareHistoryPage|AdvisorCareHistoryPage|ClientPlanViewV3|AdvisorPublicationViewV3|ReportedProductsPage|InstructionManifestPage|InstructionDetail|{status:'absent'}|{status:'committed';receipt:ReviewWriteResult};
export type GuidanceResult=GuidanceWriteResult|GuidanceDraftView|{status:'absent'}|{status:'committed';receipt:GuidanceWriteResult};
export type PortalReviewOutcome<T>={state:'ok';value:T}|{state:'rejected';status:number;code:import('./PortalReviewValues.ts').PortalReviewErrorCode}|{state:'uncertain';status:503;code:'uncertain';retry:ReviewCommand|GuidanceCommand};
