import type {NotificationCommand,NotificationRpcCall,NotificationSource,NotificationDestination} from './PortalNotification.ts';
import {readPlanShape} from './PortalRebuildValidation.ts';
import type {PlanShape} from './PortalRebuildValidation.ts';
import {readObject,requireValue} from './ConciergePortalValidation.ts';
import {notificationCommandMaxBytes,notificationPageMax,notificationStatuses} from './PortalNotificationValues.ts';
export const object=(fields:Record<string,PlanShape>):PlanShape=>({type:'object',fields});
export const en=(...values:(string|number|boolean|null)[]):PlanShape=>({type:'enum',values});
export const nil=(s:PlanShape):PlanShape=>({...s,nullable:true});
export const uuid:PlanShape={type:'uuid'},rev:PlanShape={type:'integer',min:0,max:Number.MAX_SAFE_INTEGER},positive:PlanShape={...rev,min:1},instant:PlanShape={type:'instant'},cursor:PlanShape={type:'text',max:38,empty:false};
const union=(...variants:PlanShape[]):PlanShape=>({type:'union',variants});
const source=union(object({kind:en('publication'),publicationVersion:positive}),object({kind:en('care'),recordId:uuid,version:positive,eventKind:en('use_reported','use_amended','report_amended')}),object({kind:en('review'),recordId:uuid,version:positive,eventKind:en('goal_reported','conversation_recorded','report_amended')}),object({kind:en('guidance'),recordId:uuid,version:positive,eventKind:en('review_published','instruction_published','reply_published')}));
const destination=union(object({kind:en('plan_version'),version:positive}),object({kind:en('public_history'),recordKind:en('review','instruction','reply'),recordId:uuid}),object({kind:en('unavailable'),reason:en('advisor_review_resolution_unavailable')}));
export const notificationEventShape=object({eventId:uuid,createdAt:instant,source,destination});
export const notificationWriteFields={requestId:uuid,deliveryId:uuid,expectedRevision:rev};
export const notificationWriteShape=object({schemaVersion:en(1),action:en('mark_seen_v1','retry_failed_email_v1'),...notificationWriteFields});
export const notificationReceiptShape=object({requestId:uuid,action:en('mark_seen_v1','retry_failed_email_v1'),deliveryId:uuid,previousRevision:rev,revision:rev,recordedAt:instant,effect:en('seen','already_seen','retry_queued')});
export const notificationStatusShape=object({status:en(...notificationStatuses),revision:rev});
export const notificationCommandFields:Record<NotificationCommand['action'],Record<string,PlanShape>>={
 list_inbox_v1:{cursor:nil(cursor),limit:{...positive,max:notificationPageMax}},read_event_deliveries_v1:{eventId:uuid,cursor:nil(cursor),limit:{...positive,max:notificationPageMax}},mark_seen_v1:notificationWriteFields,retry_failed_email_v1:notificationWriteFields,request_status_v1:{original:notificationWriteShape},
};
export const notificationBytes=(v:unknown)=>new TextEncoder().encode(JSON.stringify(v)).byteLength;
export function readNotificationCommand(value:unknown):NotificationCommand{
 requireValue(notificationBytes(value)<=notificationCommandMaxBytes);const v=readObject(value);
 requireValue(typeof v.action==='string'&&Object.hasOwn(notificationCommandFields,v.action));
 const c=readPlanShape(v,object({schemaVersion:en(1),action:en(v.action),...notificationCommandFields[v.action as NotificationCommand['action']]})) as NotificationCommand;
 if('cursor'in c&&c.cursor!==null)requireValue(/^n:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(c.cursor));
 return JSON.parse(JSON.stringify(c),(_k,v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)?v.toLowerCase():v) as NotificationCommand;
}
export function buildNotificationRpc(value:unknown):NotificationRpcCall{return {name:'concierge_notification_command_v1',args:{p_command:readNotificationCommand(value)}};}
export function validateNotificationDestination(s:NotificationSource,d:NotificationDestination):void{
 if(s.kind==='publication')requireValue(d.kind==='plan_version'&&d.version===s.publicationVersion);
 else if(s.kind==='guidance')requireValue(d.kind==='public_history'&&d.recordId===s.recordId&&`${d.recordKind}_published`===s.eventKind);
 else requireValue(d.kind==='unavailable'&&d.reason==='advisor_review_resolution_unavailable');
}
