import {planErrorStatuses} from './PortalRebuildValues.ts';
export const careCommandMaxBytes=500000;
export const careTextMax=4000;
export const careNameMax=200;
export const carePhotosMax=100;
export const carePageMax=100;
// At most 50 products each with 50 routine and 50 decision slots plus its unslotted identity.
export const carePlanProductsMax=5050;
export const careErrorStatuses=Object.freeze({...planErrorStatuses,use_version_required:409,identity_conflict:409,cursor_conflict:409,photo_unavailable:409});
export const careClientActions=['report_unreviewed_product_v1','amend_reported_product_v1','report_identity_v1','report_product_use_v1','amend_use_v1','read_client_plan_v2','read_reported_products_v1','read_use_history_v1','request_status_v1'] as const;
export const careAdvisorActions=['record_client_use_v1','record_client_unreviewed_product_v1','read_advisor_publication_v2','read_advisor_use_history_v1','amend_use_v1','request_status_v1'] as const;
