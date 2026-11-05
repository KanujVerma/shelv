import {readNotificationCommand} from '../../../../src/contracts/PortalNotificationValidation.ts';

/** SYNTHETIC ONLY. A committed fixture publication permits its exact initial
 * delivery READ to return not-found. This invents no event/delivery facts and
 * permits no inbox, retry, status or mutation request. The caller retains its
 * existing origin and unknown-request traps. */
export function publicationDeliveryReadUnavailable(request,{csrf,publication}){
 if(request.pathname!=='/api/advisor/notifications'||request.method!=='POST'||
   typeof csrf!=='string'||!csrf||request.csrf!==csrf||!publication)return null;
 const event=Object.getOwnPropertyDescriptor(publication,'notificationEventId');
 if(!event||!Object.hasOwn(event,'value')||typeof event.value!=='string')return null;
 const input=request.command;
 if(!input||typeof input!=='object'||Array.isArray(input)||
   ![Object.prototype,null].includes(Object.getPrototypeOf(input)))return null;
 const descriptors=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(descriptors);
 if(keys.some(key=>typeof key!=='string')||keys.sort().join(',')!=='action,cursor,eventId,limit,schemaVersion')return null;
 const detached={};
 for(const key of keys){const field=descriptors[key];if(!Object.hasOwn(field,'value')||!field.enumerable)return null;detached[key]=field.value;}
 if(detached.schemaVersion!==1||detached.action!=='read_event_deliveries_v1'||typeof detached.eventId!=='string'||detached.cursor!==null||detached.limit!==50)return null;
 let command;try{command=readNotificationCommand(detached);}catch{return null;}
 if(command.action!=='read_event_deliveries_v1'||command.eventId!==event.value||command.cursor!==null||command.limit!==50)return null;
 return Object.freeze({status:404,json:Object.freeze({code:'not_found'})});
}
