import {planErrorStatuses} from './PortalRebuildValues.ts';
export const careCommandMaxBytes=500000;
export const careTextMax=4000;
export const careNameMax=200;
export const carePhotosMax=100;
export const carePageMax=100;
// Current state is product-bound. Original slot context stays on immutable events/history.
export const carePlanProductsMax=50;
export const carePageMaxBytes=400000;
export const careResponseMaxBytes=1800000;
export const careErrorStatuses:Readonly<Record<string,number>>=Object.freeze({...planErrorStatuses,use_version_required:409,identity_conflict:409,cursor_conflict:409,photo_unavailable:409});
export const careClientActions=['report_unreviewed_product_v1','amend_reported_product_v1','report_identity_v1','report_product_use_v1','amend_use_v1','read_client_plan_v2','read_reported_products_v1','read_use_history_v1','request_status_v1'] as const;
export const careAdvisorActions=['record_client_use_v1','record_client_unreviewed_product_v1','read_advisor_publication_v2','read_advisor_use_history_v1','amend_use_v1','request_status_v1'] as const;
