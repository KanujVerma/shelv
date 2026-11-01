/** Notification facts identify an existing business event. They confer no access. */
export type NotificationSource =
 | {kind:'publication';publicationVersion:number}
 | {kind:'care';recordId:string;version:number;eventKind:'use_reported'|'use_amended'|'report_amended'}
 | {kind:'review';recordId:string;version:number;eventKind:'goal_reported'|'conversation_recorded'|'report_amended'}
 | {kind:'guidance';recordId:string;version:number;eventKind:'review_published'|'instruction_published'|'reply_published'};
export type NotificationDestination =
 | {kind:'plan_version';version:number}
 | {kind:'public_history';recordKind:'review'|'instruction'|'reply';recordId:string}
 | {kind:'unavailable';reason:'advisor_review_resolution_unavailable'};
export type NotificationEvent={eventId:string;createdAt:string;source:NotificationSource;destination:NotificationDestination};
export type NotificationDeliveryStatus='queued'|'claimed'|'uncertain'|'accepted'|'delivered'|'failed'|'bounced';
export type NotificationEmailObservation={status:NotificationDeliveryStatus;revision:number};
export type NotificationInboxItem={deliveryId:string;revision:number;seenAt:string|null;event:NotificationEvent;email:NotificationEmailObservation|null};
export type NotificationDelivery={deliveryId:string;channel:'portal'|'email';status:NotificationDeliveryStatus;revision:number;seenAt:string|null};
export type NotificationWrite={schemaVersion:1;requestId:string;deliveryId:string;expectedRevision:number}&({action:'mark_seen_v1'}|{action:'retry_failed_email_v1'});
export type NotificationCommand=NotificationWrite
 | {schemaVersion:1;action:'list_inbox_v1';cursor:string|null;limit:number}
 | {schemaVersion:1;action:'read_event_deliveries_v1';eventId:string;cursor:string|null;limit:number}
 | {schemaVersion:1;action:'request_status_v1';original:NotificationWrite};
export type NotificationWriteReceipt={requestId:string;action:NotificationWrite['action'];deliveryId:string;previousRevision:number;revision:number;recordedAt:string;effect:'seen'|'already_seen'|'retry_queued'};
/** A live keyset scan. It is neither an immutable snapshot nor a count of all history. */
export type NotificationInboxPage={schemaVersion:1;consistency:'live_keyset';observedAt:string;cursor:string|null;items:NotificationInboxItem[];nextCursor:string|null};
export type NotificationDeliveryPage={schemaVersion:1;consistency:'live_keyset';observedAt:string;cursor:string|null;event:NotificationEvent;items:NotificationDelivery[];nextCursor:string|null};
export type NotificationResult=NotificationInboxPage|NotificationDeliveryPage|NotificationWriteReceipt|{status:'unknown'}|{status:'committed';receipt:NotificationWriteReceipt};
export type NotificationRpcCall={name:'concierge_notification_command_v1';args:{p_command:NotificationCommand}};
export type NotificationOutcome={state:'ok';value:NotificationResult}|{state:'rejected';status:number;code:string}|{state:'uncertain';status:503;code:'uncertain';original:NotificationWrite};
