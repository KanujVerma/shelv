export const planDirectoryV2CommandMaxBytes=8192;
export const planDirectoryV2ResultMaxBytes=262144;
export const planDirectoryV2AuthMaxBytes=8192;
export const planDirectoryV2PageMax=100;
export const planDirectoryV2CursorMaxBytes=512;
export const planDirectoryV2OperationMilliseconds=10000;
export const planDirectoryV2Filters=Object.freeze(['all','unassigned','needs_review'] as const);
export const planDirectoryV2WorkflowValues=Object.freeze(['incomplete','needs_review','needs_rebase','approval_required','approved_awaiting_payment','ready_to_publish','publish_not_permitted','published','archived'] as const);
export const planDirectoryV2ErrorStatuses=Object.freeze({invalid_input:400,unauthorized:401,session_ended:401,forbidden:403,not_found:404,cursor_conflict:409,too_large:413,unavailable:503} as const);
/** Transport classification only. Actual permanent-human VIEW and live target guards are mandatory. */
export function planDirectoryV2Access(audience:'human'|'client'|'task_agent'):'READ'|'DENY'{return audience==='human'?'READ':'DENY';}
