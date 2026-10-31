// Closed protocol metadata only. SQL reauthorizes every owner, event and action.
export const CARE_COMMAND_MAX_BYTES=500000;
export const clientCareActions=Object.freeze(['report_unreviewed_product_v1','amend_reported_product_v1','report_identity_v1','report_product_use_v1','amend_use_v1','read_client_plan_v2','read_reported_products_v1','read_use_history_v1','request_status_v1']);
export const advisorCareActions=Object.freeze(['record_client_use_v1','record_client_unreviewed_product_v1','read_advisor_publication_v2','read_advisor_use_history_v1','amend_use_v1','request_status_v1']);
