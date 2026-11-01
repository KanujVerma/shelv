export const notificationCommandMaxBytes=8192;
export const notificationResponseMaxBytes=100000;
export const notificationPageMax=50;
export const notificationStatuses=['queued','claimed','uncertain','accepted','delivered','failed','bounced'] as const;
export const notificationErrorStatuses:Readonly<Record<string,number>>=Object.freeze({invalid_input:400,unauthorized:401,session_ended:401,forbidden:403,origin_forbidden:403,not_found:404,method_not_allowed:405,revision_conflict:409,request_conflict:409,cursor_conflict:409,reconciliation_unavailable:409,too_large:413,unsupported_media_type:415,candidate_inactive:503,unavailable:503,uncertain:503});
export function notificationAccess(action:string,audience:'client'|'human'|'task_agent'):'READ'|'WRITE'|'DENY'{
 if(audience==='task_agent')return 'DENY';
 if(action==='retry_failed_email_v1')return audience==='human'?'WRITE':'DENY';
 if(action==='read_event_deliveries_v1')return audience==='human'?'READ':'DENY';
 if(action==='mark_seen_v1')return 'WRITE';
 return action==='list_inbox_v1'||action==='request_status_v1'?'READ':'DENY';
}
