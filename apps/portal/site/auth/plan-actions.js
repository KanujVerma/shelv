// Fixed protocol metadata only. Server SQL still authorizes every target/action.
export const PLAN_COMMAND_MAX_BYTES=500000;
export const clientPlanActions=Object.freeze(['read_client_plan_v1','record_decision_v1','request_status_v1']);
export const advisorPlanActions=Object.freeze([
 'list_plans_v1','read_draft_v1','create_draft_v1','save_draft_v1','checkpoint_draft_v1','assign_draft_v1',
 'compare_import_v1','apply_import_v1','validate_draft_v1','preview_draft_v1','review_section_v1',
 'approve_publication_v1','revoke_approval_v1','publish_plan_v1','restore_publication_v1','request_status_v1',
 'read_policy_v1','set_sami_approval_policy_v1','grant_task_v1','revoke_task_v1',
 'read_advisor_gate_v1','read_advisor_publication_v1','read_draft_dependencies_v1','rebase_draft_dependencies_v1',
]);
