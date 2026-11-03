export const serviceFinancialsCommandMaxBytes=8192;
export const serviceFinancialsResultMaxBytes=262144;
export const serviceFinancialsAuthMaxBytes=8192;
export const serviceFinancialsPageMax=100;
export const serviceFinancialsCursorMaxBytes=512;
export const serviceFinancialsOperationMilliseconds=10000;
export const serviceFinancialsUnavailableCodes=['payment_lineage_unavailable','legacy_payment_provenance_required','service_terms_unavailable','period_basis_unavailable','calendar_policy_unavailable','broader_terms_unavailable'] as const;
export const serviceFinancialsErrorStatuses:Readonly<Record<string,number>>=Object.freeze({invalid_input:400,unauthorized:401,session_ended:401,forbidden:403,not_found:404,snapshot_conflict:409,cursor_conflict:409,too_large:413,unavailable:503});
/** Transport classification only; current own-client SQL authorization remains mandatory. */
export function serviceFinancialsAccess(audience:'client'|'human'|'task_agent'):'READ'|'DENY'{return audience==='client'?'READ':'DENY';}
