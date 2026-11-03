import {exactKeys,readObject,readUuid,requireValue} from './ConciergePortalValidation.ts';
import {accountProfileText} from './PortalAccountProfileValidation.ts';
import type {AccountContactCommand} from './PortalAccountContact.ts';
import {accountContactCommandMaxBytes} from './PortalAccountContactValues.ts';

function object(value:unknown,keys:string[]):Record<string,unknown> {
  const v=readObject(value),prototype=Object.getPrototypeOf(v);
  requireValue(prototype===Object.prototype||prototype===null);
  exactKeys(v,keys);requireValue(Reflect.ownKeys(v).length===keys.length);
  for(const key of keys){const d=Object.getOwnPropertyDescriptor(v,key);requireValue(d&&Object.hasOwn(d,'value')&&d.enumerable);}
  return v;
}
function bytes(value:unknown,maximum:number):void {
  requireValue(new TextEncoder().encode(JSON.stringify(value)).byteLength<=maximum);
}
function basis(value:unknown):string {
  requireValue(typeof value==='string'&&/^[0-9a-f]{64}$/.test(value));return value;
}
function email(value:unknown):string {
  const s=accountProfileText(value);
  // Conservative request syntax, not provider acceptance or deliverability validation.
  // Preserve spelling. No domain, normalization or universal address-length policy.
  requireValue(s===s.trim()&&!/[\u0000-\u001f\u007f-\u009f]/u.test(s)&&/^[^\s@]+@[^\s@]+$/u.test(s));
  return s;
}
export function readAccountContactCommand(value:unknown):AccountContactCommand {
  const raw=readObject(value),action=Object.getOwnPropertyDescriptor(raw,'action');
  requireValue(action&&Object.hasOwn(action,'value'));
  let command:AccountContactCommand;
  if(action.value==='read_account_contact_v1'){
    const v=object(value,['schemaVersion','action']);requireValue(v.schemaVersion===1);
    command={schemaVersion:1,action:'read_account_contact_v1'};
  }else if(action.value==='request_account_email_change_v1'){
    const v=object(value,['schemaVersion','action','requestId','expectedContactBasis','email']);requireValue(v.schemaVersion===1);
    command={schemaVersion:1,action:'request_account_email_change_v1',requestId:readUuid(v.requestId).toLowerCase(),expectedContactBasis:basis(v.expectedContactBasis),email:email(v.email)};
  }else{
    requireValue(action.value==='read_account_email_change_request_v1');
    const v=object(value,['schemaVersion','action','requestId']);requireValue(v.schemaVersion===1);
    command={schemaVersion:1,action:'read_account_email_change_request_v1',requestId:readUuid(v.requestId).toLowerCase()};
  }
  bytes(command,accountContactCommandMaxBytes);return Object.freeze(command);
}
