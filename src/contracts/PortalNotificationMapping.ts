import type {NotificationCommand,NotificationResult,NotificationWrite,NotificationWriteReceipt,NotificationEvent,NotificationOutcome} from './PortalNotification.ts';
import {readPlanShape} from './PortalRebuildValidation.ts';
import {readObject,requireValue} from './ConciergePortalValidation.ts';
import {object,en,nil,uuid,rev,instant,cursor,notificationEventShape,notificationReceiptShape,notificationStatusShape,notificationBytes,validateNotificationDestination} from './PortalNotificationValidation.ts';
import {notificationResponseMaxBytes,notificationPageMax,notificationStatuses,notificationErrorStatuses} from './PortalNotificationValues.ts';
const array=(item:import('./PortalRebuildValidation.ts').PlanShape)=>({type:'array' as const,item,max:notificationPageMax,min:0});
const page={schemaVersion:en(1),consistency:en('live_keyset'),observedAt:instant,cursor:nil(cursor),nextCursor:nil(cursor)};
const inboxShape=object({...page,items:array(object({deliveryId:uuid,revision:rev,seenAt:nil(instant),event:notificationEventShape,email:nil(notificationStatusShape)}))});
const deliveryShape=object({...page,event:notificationEventShape,items:array(object({deliveryId:uuid,channel:en('portal','email'),status:en(...notificationStatuses),revision:rev,seenAt:nil(instant)}))});
export function readNotificationEvent(v:unknown):NotificationEvent{const e=readPlanShape(v,notificationEventShape) as NotificationEvent;validateNotificationDestination(e.source,e.destination);return e;}
function receipt(v:unknown,c:NotificationWrite):NotificationWriteReceipt{
 const r=readPlanShape(v,notificationReceiptShape) as NotificationWriteReceipt;
 requireValue(r.requestId===c.requestId&&r.action===c.action&&r.deliveryId===c.deliveryId&&r.previousRevision===c.expectedRevision);
 if(r.action==='mark_seen_v1')requireValue(r.effect==='seen'&&r.revision===r.previousRevision+1||r.effect==='already_seen'&&r.revision===r.previousRevision);
 else requireValue(r.effect==='retry_queued'&&r.revision===r.previousRevision+1);
 return r;
}
export function mapNotificationResult(v:unknown,c:NotificationCommand):NotificationResult{
 requireValue(notificationBytes(v)<=notificationResponseMaxBytes);
 if(c.action==='request_status_v1'){
  const r=readObject(v);if(r.status==='unknown')return readPlanShape(v,object({status:en('unknown')})) as {status:'unknown'};
  requireValue(r.status==='committed'&&Object.keys(r).length===2);return {status:'committed',receipt:receipt(r.receipt,c.original)};
 }
 if(c.action==='mark_seen_v1'||c.action==='retry_failed_email_v1')return receipt(v,c);
 const p=readPlanShape(v,c.action==='list_inbox_v1'?inboxShape:deliveryShape) as import('./PortalNotification.ts').NotificationInboxPage|import('./PortalNotification.ts').NotificationDeliveryPage;
 requireValue(p.cursor===c.cursor&&p.items.length<=c.limit);let previous=c.cursor?.slice(2)??'';
 for(const item of p.items){requireValue(item.deliveryId>previous);previous=item.deliveryId;if('event'in item)readNotificationEvent(item.event);else requireValue(item.channel!=='email'||item.seenAt===null);}
 if(p.nextCursor!==null)requireValue(/^n:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(p.nextCursor)&&p.nextCursor>(c.cursor??'')&&p.nextCursor.slice(2)>=previous);
 if('event'in p){readNotificationEvent(p.event);requireValue(c.action==='read_event_deliveries_v1'&&p.event.eventId===c.eventId);}
 return p;
}
export function decodeNotificationResponse(c:NotificationCommand,status:number,v:unknown):NotificationOutcome{
 if(status===200){try{return {state:'ok',value:mapNotificationResult(v,c)};}catch{/* closed below */}}
 else if(!(status===503&&(c.action==='mark_seen_v1'||c.action==='retry_failed_email_v1'))) {try{const e=readPlanShape(v,object({code:{type:'text',max:80,empty:false}})) as {code:string};if(notificationErrorStatuses[e.code]===status&&e.code!=='uncertain')return {state:'rejected',status,code:e.code};}catch{/* no raw error */}}
 return c.action==='mark_seen_v1'||c.action==='retry_failed_email_v1'?{state:'uncertain',status:503,code:'uncertain',original:c}:{state:'rejected',status:503,code:'unavailable'};
}
