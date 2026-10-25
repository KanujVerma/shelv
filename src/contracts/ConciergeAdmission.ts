import {exactKeys,readObject,readText,readUuid,requireValue} from './ConciergePortalValidation.ts';

export type AdmissionCommand={action:'capabilities'}|{action:'admission_status';requestId:string}|{action:'add_client';requestId:string;email:string;displayName:string};
export type AdmissionReceipt={requestId:string;status:'admitted'|'already_admitted';clientId:string;displayName:string;email:string;emailSent:false;portalUrl:'https://portal.goshelv.com/'};
export type AdmissionIdentity={id:string;email:string;is_anonymous:boolean};
export function admissionEmail(value:unknown):string{
 const email=readText(value,254).trim().toLowerCase();
 requireValue(/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email));
 return email;
}
export function admissionName(value:unknown):string{const name=readText(value,200).trim();requireValue(!/[\u0000-\u001f\u007f]/.test(name));return name;}
export function parseAdmissionCommand(value:unknown):AdmissionCommand{
 const input=readObject(value);
 if(input.action==='capabilities'){exactKeys(input,['action']);return{action:'capabilities'};}
 if(input.action==='admission_status'){exactKeys(input,['action','requestId']);return{action:'admission_status',requestId:readUuid(input.requestId).toLowerCase()};}
 requireValue(input.action==='add_client');exactKeys(input,['action','requestId','email','displayName']);
 return{action:'add_client',requestId:readUuid(input.requestId).toLowerCase(),email:admissionEmail(input.email),displayName:admissionName(input.displayName)};
}
export function mapAdmissionReceipt(value:unknown):AdmissionReceipt{
 const raw=readObject(value);requireValue(raw.status==='admitted'||raw.status==='already_admitted');requireValue(raw.emailSent===false&&raw.portalUrl==='https://portal.goshelv.com/');
 return{requestId:readUuid(raw.requestId),status:raw.status,clientId:readUuid(raw.clientId),displayName:admissionName(raw.displayName),email:admissionEmail(raw.email),emailSent:false,portalUrl:'https://portal.goshelv.com/'};
}
