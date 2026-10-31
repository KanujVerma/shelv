import type {ReviewCommand,GuidanceCommand} from './PortalReview.ts';
import {planContentShape} from './PortalRebuildValidation.ts';
export const reviewCommandMaxBytes=500000;
export const reviewResponseMaxBytes=1800000;
export const reviewPageMaxBytes=400000;
export const reviewBodyMaxBytes=90000;
export const conversationBodyMaxBytes=250000;
export const guidanceBodyMaxBytes=120000;
export const reviewTextMax=4000;
export const reviewComfortMax=1000;
export const reviewGoalsMax=50;
export const reviewPhotosMax=100;
export const reviewReferencesMax=100;
export const conversationFactsMax=50;
export const reviewSourcesPerFactMax=20;
export const reviewPageMax=100;
/** A decision's actual product-ref union is bounded by the global document products. */
export const reviewInstructionScopesMax=planContentShape.fields!.routine.max!+planContentShape.fields!.decisions.max!*planContentShape.fields!.products.max!;
export const reviewReadActions=['read_care_history_v1','read_advisor_care_history_v1','read_client_plan_v3','read_advisor_publication_v3','read_advisor_reported_products_v1','read_client_instruction_manifest_v1','read_advisor_instruction_manifest_v1','read_client_instruction_v1','read_advisor_instruction_v1','request_status_v1'] as const;
export const guidanceReadActions=['read_guidance_draft_v1','request_status_v1'] as const;
export const reviewClientActions=['submit_goal_report_v1','amend_report_v1','read_care_history_v1','read_client_plan_v3','read_client_instruction_manifest_v1','read_client_instruction_v1','record_decision_v2','request_status_v1'] as const;
export const reviewHumanActions=['record_conversation_v1','append_private_review_note_v1','read_advisor_care_history_v1','read_advisor_publication_v3','read_advisor_reported_products_v1','read_advisor_instruction_manifest_v1','read_advisor_instruction_v1','request_status_v1'] as const;
export const guidanceHumanActions=['create_guidance_draft_v1','read_guidance_draft_v1','save_guidance_draft_v1','rebase_guidance_draft_v1','review_guidance_v1','approve_guidance_v1','publish_guidance_v1','revoke_guidance_approval_v1','request_status_v1'] as const;
export const reviewErrorStatuses=Object.freeze({invalid_input:400,not_ready:400,unauthorized:401,session_ended:401,forbidden:403,candidate_inactive:403,not_found:404,revision_conflict:409,request_conflict:409,approval_conflict:409,basis_conflict:409,source_conflict:409,cursor_conflict:409,photo_unavailable:409,content_version_required:409,guidance_version_required:409,guidance_conflict:409,too_large:413,unsupported_media_type:415,rate_limited:429,unavailable:503,uncertain:503});
export type PortalReviewErrorCode=keyof typeof reviewErrorStatuses;
/** Classification is transport metadata, not authorization. SQL must recheck real rights. */
export function portalReviewAccess(family:'review'|'guidance',action:string,audience:'client'|'human'|'task_agent'):'READ'|'WRITE'|'DENY'{
 if(audience==='task_agent')return 'DENY';
 const allowed:readonly string[]=family==='guidance'?(audience==='human'?guidanceHumanActions:[]):audience==='client'?reviewClientActions:reviewHumanActions;
 if(!allowed.includes(action))return 'DENY';
 const reads:readonly string[]=family==='review'?reviewReadActions:guidanceReadActions;return reads.includes(action)?'READ':'WRITE';
}
export const isPortalReviewRead=(command:ReviewCommand|GuidanceCommand):boolean=>([...reviewReadActions,...guidanceReadActions] as readonly string[]).includes(command.action);
