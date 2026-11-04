import type {Known,Revision,UUID} from './PortalRebuild.ts';
export type PlanDirectoryV2Filter='all'|'unassigned'|'needs_review';
export type PlanDirectoryV2Review='needs_review'|'reviewed'|'unavailable';
export type PlanDirectoryV2ReviewClassification='complete'|'incomplete'|'unavailable';
export type PlanDirectoryV2Workflow='incomplete'|'needs_review'|'needs_rebase'|'approval_required'|'approved_awaiting_payment'|'ready_to_publish'|'publish_not_permitted'|'published'|'archived';
/** Scope is an authorized filter, never a caller-selected principal or permission. */
export type PlanDirectoryV2Command={schemaVersion:2;action:'list_advisor_plan_directory_v2';clientId:UUID|null;filter:PlanDirectoryV2Filter;publisherContext:'current_human';cursor:string|null;limit:number};
export type PlanDirectoryV2RpcCall={name:'concierge_plan_directory_v2';args:{p_command:PlanDirectoryV2Command}};
export type PlanDirectoryV2Draft={kind:'draft';id:UUID;clientId:UUID|null;state:'working'|'published'|'archived';contentRevision:Revision;assignmentRevision:Revision;savedAt:string;title:Known<string>;review:PlanDirectoryV2Review;workflow:Known<PlanDirectoryV2Workflow>};
/** An immutable publication identity, with no claim that it is the current plan. */
export type PlanDirectoryV2Publication={kind:'publication';clientId:UUID;version:number;documentSchemaVersion:1|2|3;publishedAt:string;title:Known<string>};
export type PlanDirectoryV2Row=PlanDirectoryV2Draft|PlanDirectoryV2Publication;
/** Classification covers ALL authorized matching WORKING candidates before needs_review filtering.
 * It is neither page/count/enumeration completeness nor an immutable whole-list snapshot. */
export type PlanDirectoryV2View={schemaVersion:2;clientId:UUID|null;filter:PlanDirectoryV2Filter;publisher:{kind:'human';actorId:UUID};consistency:'live_keyset';observedAt:string;reviewClassification:PlanDirectoryV2ReviewClassification;rows:PlanDirectoryV2Row[];nextCursor:string|null};
