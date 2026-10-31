import type {UUID,ContentId,Revision,Hash,Known,SourceLocation,Schedule,Publisher} from './PortalRebuild.ts';
import type {ClientPublicationRef,Occurrence,UseHistoryEntry,DependencyBasisV2} from './PortalCare.ts';

/** Proposed Phase 1 protocol. No runtime dispatch or new task right is activated. */
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
export type ReportAmendment={id:UUID;event:ReportRef;previousAmendmentHeadId:UUID|null;replacement:ReportReplacement;occurredOn:Known<string>;reason:string;amendedBy:UUID;recordedAt:string;attention:ReviewAttention|null};
export type PrivateReviewNote={id:UUID;reviewEvent:PrivateNoteSubject;note:string;recordedBy:UUID;recordedAt:string};

export type InstructionUseBasis={useRevision:Revision;latestEventId:UUID|null;amendmentHeadId:UUID|null};
export type GuidanceBody=
 |{kind:'review';publication:ClientPublicationRef;reportRefs:ReviewInputRef[];occurredOn:Known<string>;channel:Occurrence['channel'];clientReport:string;conclusion:string;rationale:string;changes:string[];nextStep:string;nextReviewOn:string|null}
 |{kind:'instruction';publication:{version:number;documentSchemaVersion:3};slotId:ContentId;productId:ContentId|null;baseInstructionId:UUID|null;baseInstructionVersion:Revision;useBasis:InstructionUseBasis|null;directions:string[];cautions:string[];schedule:Schedule;reason:string;effectiveOn:string;reviewId:UUID|null}
 |{kind:'reply';publication:ClientPublicationRef;reportRef:ReportRef;reply:string;nextStep:string|null};
export type GuidanceTarget<K extends GuidanceKind=GuidanceKind>={draftId:UUID;clientId:UUID;kind:K;revision:Revision;contentHash:Hash;basisHash:Hash};
/** Captured private basis, independent of PlanDraft and its frozen basis/index semantics. */
export type GuidanceBasis=Pick<DependencyBasisV2,'legacyBasis'|'legacyBasisManifestHash'|'useHead'|'reportHead'|'instructionHead'>&{schemaVersion:1;publication:ClientPublicationRef;references:{event:ReviewInputRef;amendmentHeadId:UUID|null}[];sources:SourceLocation[]};
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
export type ReviewWriteResult=ReportWriteReceipt|PrivateNoteReceipt;
export type GuidanceDraftReceipt={requestId:UUID;draft:GuidanceDraftView};
export type GuidanceApprovalReceipt={requestId:UUID;approval:GuidanceApproval};
export type GuidanceRevocationReceipt={requestId:UUID;approvalId:UUID;revokedBy:UUID;revokedAt:string;policyRevision:Revision};
export type GuidanceWriteResult=GuidanceDraftReceipt|GuidanceApprovalReceipt|GuidanceRevocationReceipt|GuidanceReceipt;

export type ClientCareHistoryEntry=
 |{kind:'publication';publication:ClientPublicationRef;publishedAt:string;recordedBy:UUID}
 |{kind:'report';event:ReportEvent}
 |{kind:'report_amendment';original:ReportEvent;amendment:ReportAmendment}
 |{kind:'guidance';guidance:PublishedGuidance}
 |UseHistoryEntry;
export type AdvisorCareHistoryEntry=ClientCareHistoryEntry|{kind:'conversation';event:ConversationEvent}|{kind:'private_note';note:PrivateReviewNote};
export type CareHistoryHeads={useHead:Revision;reportHead:Revision;instructionHead:Revision;serviceRevision:Revision;publicationVersion:number|null};
type HistoryPage={schemaVersion:1;version:number|null;heads:CareHistoryHeads;nextCursor:string|null};
export type ClientCareHistoryPage=HistoryPage&{audience:'client';entries:ClientCareHistoryEntry[]};
export type AdvisorCareHistoryPage=HistoryPage&{audience:'advisor';clientId:UUID;entries:AdvisorCareHistoryEntry[]};
type ReportWrite={requestId:UUID;expectedReportRevision:Revision};
export type ReviewCommand={schemaVersion:1}&(
 |({action:'submit_goal_report_v1';body:GoalReportBody;occurredOn:Known<string>}&ReportWrite)
 |({action:'amend_report_v1';event:ReportRef;expectedAmendmentHeadId:UUID|null;replacement:ReportReplacement;occurredOn:Known<string>;reason:string}&ReportWrite)
 |({action:'record_conversation_v1';clientId:UUID;body:ConversationBody}&ReportWrite)
 |{action:'append_private_review_note_v1';requestId:UUID;clientId:UUID;reviewEvent:PrivateNoteSubject;note:string}
 |{action:'read_care_history_v1';cursor:string|null;limit:number;version:number|null}
 |{action:'read_advisor_care_history_v1';clientId:UUID;cursor:string|null;limit:number;version:number|null}
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
export type ReviewResult=ReviewWriteResult|ClientCareHistoryPage|AdvisorCareHistoryPage|{status:'absent'}|{status:'committed';receipt:ReviewWriteResult};
export type GuidanceResult=GuidanceWriteResult|GuidanceDraftView|{status:'absent'}|{status:'committed';receipt:GuidanceWriteResult};
export type PortalReviewOutcome<T>={state:'ok';value:T}|{state:'rejected';status:number;code:import('./PortalReviewValues.ts').PortalReviewErrorCode}|{state:'uncertain';status:503;code:'uncertain';retry:ReviewCommand|GuidanceCommand};
