import type {UUID,ContentId,Revision,Hash,Known,SectionId,ClientPlanView,AdvisorPublicationView} from './PortalRebuild.ts';
export type ClientPublicationRef={version:number;documentSchemaVersion:1|2|3};
export type PlanProductRef={kind:'plan_product';publication:ClientPublicationRef;productId:ContentId;slotId:ContentId|null};
export type ReportedProductRef={kind:'client_reported_product';reportedProductId:UUID;version:number};
export type ProductRef=PlanProductRef|ReportedProductRef;
export type Occurrence={occurredOn:Known<string>;channel:'portal'|'text'|'call'|'video'|'in_person'};
export type Acquisition='shelv'|'self'|'already_owned'|'unknown';
export type ReportedProductBody={name:string;brand:Known<string>;variant:Known<string>;strength:Known<string>;sizeLabel:Known<string>;labelPhotoIds:UUID[]};
export type IdentityTarget={subject:ProductRef;comparedWith:PlanProductRef|null};
export type IdentityAnswer={match:'yes'|'no'|'not_sure';reportedName:string|null;variant:Known<string>;strength:Known<string>;labelPhotoIds:UUID[]};
/** The occurrence is the sole reported Start date. */
export type UseChange={kind:'started'}|{kind:'paused'|'stopped';details:string|null}|{kind:'different';frequency:Known<string>;amount:Known<string>;details:string}|{kind:'unreviewed_added';details:string|null};
export type EventRef={kind:'legacy_report'|'goal_report'|'conversation'|'use'|'identity'|'reported_product'|'review'|'reply'|'instruction';id:string};
export type EventReceipt={requestId:UUID;event:EventRef;revision:Revision;recordedAt:string;notificationEventId:UUID|null};
export type Attribution=Occurrence&{reportedBy:UUID;recordedBy:UUID;recordedAt:string;sourcePublication:ClientPublicationRef|null};
export type UseReplacement={product:ProductRef;change:UseChange;sourcePublication:ClientPublicationRef|null;occurredOn:Known<string>;acquisition:Acquisition;identityEventId:UUID|null};
export type UseAmendment={id:UUID;eventId:UUID;previousAmendmentHeadId:UUID|null;replacement:UseReplacement;amendedBy:UUID;amendedAt:string;reason:string};
export type AttributedUseEvent=Attribution&{eventId:UUID;product:ProductRef;change:UseChange;acquisition:Acquisition;identityEventId:UUID|null;originalActivationId:string|null;amendment:UseAmendment|null};
export type AttributedIdentityEvent=Attribution&{eventId:UUID;target:IdentityTarget;answer:IdentityAnswer};
export type UseAmendmentSummary=Pick<UseAmendment,'id'|'eventId'|'previousAmendmentHeadId'|'amendedBy'|'amendedAt'>&Omit<UseReplacement,'change'>&{changeKind:UseChange['kind']};
export type UseEventSummary=Omit<AttributedUseEvent,'change'|'amendment'>&{changeKind:UseChange['kind'];amendment:UseAmendmentSummary|null};
export type IdentityEventSummary=Omit<AttributedIdentityEvent,'answer'>&{match:IdentityAnswer['match']};
export type EffectiveUse<P extends ProductRef=ProductRef>={product:P;state:'not_reported'|'using'|'paused'|'stopped'|'using_differently'|'unreviewed';originalStart:Known<string>;latestEvent:UseEventSummary|null;identity:IdentityEventSummary|null;contradiction:boolean};
export type ReportedProductUse=EffectiveUse<ReportedProductRef>&{descriptor:ReportedProductBody};
export type ReportedProductsPage={revision:Revision;items:ReportedProductUse[];nextCursor:string|null};
export type UseProjection={revision:Revision;planProducts:EffectiveUse<PlanProductRef>[];reportedProducts:{items:ReportedProductUse[];nextCursor:string|null}};
export type PublicReviewSummary={reviewId:UUID;publicationVersion:number;publishedAt:string;occurredOn:Known<string>;conclusion:string;rationale:string;nextStep:string;nextReviewOn:string|null};
export type ClientPlanViewV2=Omit<ClientPlanView,'schemaVersion'>&{schemaVersion:2;use:UseProjection;latestPublicReview:PublicReviewSummary|null};
export type AdvisorPublicationViewV2=Omit<AdvisorPublicationView,'schemaVersion'>&{schemaVersion:2;use:UseProjection;latestPublicReview:PublicReviewSummary|null};
export type ReportedDescriptorEvent=Attribution&{eventId:UUID;product:ReportedProductRef;descriptor:ReportedProductBody;previousVersion:number|null;reason:string|null;initialUse:AttributedUseEvent|null};
export type UseHistoryEntry={kind:'use';event:AttributedUseEvent}|{kind:'identity';event:AttributedIdentityEvent}|{kind:'reported_product';event:ReportedDescriptorEvent}|{kind:'amendment';amendment:UseAmendment};
export type UseHistoryPage={revision:Revision;entries:UseHistoryEntry[];nextCursor:string|null};
type Write={requestId:UUID;expectedUseRevision:Revision};
type UseFields={product:ProductRef;change:UseChange;sourcePublication:ClientPublicationRef|null;acquisition:Acquisition;identityEventId:UUID|null}&Occurrence;
type ReportFields={product:ReportedProductBody;sourcePublication:ClientPublicationRef|null;acquisition:Acquisition}&Occurrence;
export type CareCommand={schemaVersion:1}&(
 |({action:'report_unreviewed_product_v1'}&Write&ReportFields)
 |({action:'record_client_unreviewed_product_v1';clientId:UUID;confirmedClientReport:true}&Write&ReportFields)
 |({action:'amend_reported_product_v1';product:ReportedProductRef;replacement:ReportedProductBody;reason:string}&Write)
 |({action:'report_identity_v1';target:IdentityTarget;answer:IdentityAnswer;sourcePublication:ClientPublicationRef|null}&Write&Occurrence)
 |({action:'report_product_use_v1'}&Write&UseFields)
 |({action:'record_client_use_v1';clientId:UUID;confirmedClientReport:true}&Write&UseFields)
 |({action:'amend_use_v1';eventId:UUID;expectedAmendmentHeadId:UUID|null;replacement:UseReplacement;reason:string}&Write)
 |{action:'read_client_plan_v2';version:number|null}
 |{action:'read_advisor_publication_v2';clientId:UUID;version:number|null}
 |{action:'read_reported_products_v1';cursor:string|null;limit:number;expectedUseRevision:Revision;publicationVersion:number|null}
 |{action:'read_use_history_v1';product:ProductRef|null;cursor:string|null;limit:number}
 |{action:'read_advisor_use_history_v1';clientId:UUID;product:ProductRef|null;cursor:string|null;limit:number}
 |{action:'request_status_v1';requestId:UUID});
export type CareRpcCall={name:'concierge_care_command_v1';args:{p_command:CareCommand}};
export type CareWriteResult=EventReceipt|{receipt:EventReceipt;product:ReportedProductRef};
export type CareResult=CareWriteResult|ClientPlanViewV2|AdvisorPublicationViewV2|ReportedProductsPage|UseHistoryPage|{status:'absent'}|{status:'committed';receipt:CareWriteResult};
export type DependencyBasisV2={schemaVersion:2;legacyBasis:{publicationVersion:number|null;useRevision:Revision};legacyBasisManifestHash:Hash;useHead:Revision;reportHead:Revision;instructionHead:Revision;references:{event:EventRef;amendmentHeadId:UUID|null}[]};
export type DraftDependenciesView={draftId:UUID;contentRevision:Revision;assignmentRevision:Revision;captured:DependencyBasisV2;current:DependencyBasisV2;needsRebase:boolean;affectedSections:SectionId[]};
