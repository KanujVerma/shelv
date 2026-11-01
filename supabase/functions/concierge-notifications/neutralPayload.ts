import type {NotificationEvent} from '../../../src/contracts/PortalNotification.ts';
import {readNotificationEvent} from '../../../src/contracts/PortalNotificationMapping.ts';
import {readPlanShape} from '../../../src/contracts/PortalRebuildValidation.ts';
import {object,en,uuid,instant,notificationBytes} from '../../../src/contracts/PortalNotificationValidation.ts';
import {requireValue} from '../../../src/contracts/ConciergePortalValidation.ts';
export type DeliveryContext={schemaVersion:1;deliveryId:string;leaseId:string;recipientId:string;idempotencyKey:string;leaseUntil:string;recipient:{email:string};event:NotificationEvent};
export type NeutralNotificationEmail={deliveryId:string;to:string;subject:'an update from shelv';link:string;text:string};
/** Strict context parser delegates the exact event union to the browser-safe fact parser. */
export function parseDeliveryContext(v:unknown):DeliveryContext{
 requireValue(v!==null&&typeof v==='object'&&!Array.isArray(v));const r=v as Record<string,unknown>;const event=readNotificationEvent(r.event);
 const shape=object({schemaVersion:en(1),deliveryId:uuid,leaseId:uuid,recipientId:uuid,idempotencyKey:uuid,leaseUntil:instant,recipient:object({email:{type:'text',max:254,empty:false}})});
 const {event:_event,...rest}=r;const c=readPlanShape(rest,shape) as Omit<DeliveryContext,'event'>;
 requireValue(notificationBytes(v)<=8192&&c.idempotencyKey===c.deliveryId&&Date.parse(c.leaseUntil)>Date.now()&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(c.recipient.email));
 return {...c,event};
}
export function buildNeutralNotificationEmail(context:DeliveryContext,portalOrigin:string):NeutralNotificationEmail{
 const c=parseDeliveryContext(context),base=new URL(portalOrigin);requireValue(base.protocol==='https:'&&base.origin===portalOrigin&&!base.username&&!base.password);
 const d=c.event.destination;
 // A07 has no admitted direct resolver. The fixed inbox is an explicit recovery destination.
 const path=d.kind==='plan_version'?`/history/versions/${d.version}`:d.kind==='public_history'?`/history/${encodeURIComponent(`public_${d.recordKind}:${d.recordId}`)}`:'/notifications';
 const link=new URL(path,base).href;
 return {deliveryId:c.deliveryId,to:c.recipient.email,subject:'an update from shelv',link,text:`there is an update in your shelv portal. sign in to view it.\n\n${link}`};
}
export function readNeutralNotificationEmail(v:unknown):NeutralNotificationEmail{
 const p=readPlanShape(v,object({deliveryId:uuid,to:{type:'text',max:254,empty:false},subject:en('an update from shelv'),link:{type:'text',max:1000,empty:false},text:{type:'text',max:1200,empty:false}})) as NeutralNotificationEmail;
 const u=new URL(p.link);requireValue(u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&(/^\/history\/versions\/[1-9][0-9]*$/.test(u.pathname)||/^\/history\/public_(review|instruction|reply)%3A[0-9a-f-]{36}$/.test(u.pathname)||u.pathname==='/notifications'));
 requireValue(p.text===`there is an update in your shelv portal. sign in to view it.\n\n${p.link}`);return p;
}
