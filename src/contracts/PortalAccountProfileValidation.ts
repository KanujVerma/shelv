import {exactKeys,readInteger,readObject,readUuid,requireValue} from './ConciergePortalValidation.ts';
import type {AccountProfileCommand,AccountProfileView,AccountProfileReceipt} from './PortalAccountProfile.ts';
import {accountProfileCommandMaxBytes,accountProfileResultMaxBytes} from './PortalAccountProfileValues.ts';

export function accountProfileText(value:unknown):string{
 requireValue(typeof value==='string'&&!value.includes('\0'));
 // PostgreSQL UTF8 cannot represent unpaired UTF16 surrogates; do not silently replace them.
 for(const c of value){const n=c.codePointAt(0)!;requireValue(n<0xd800||n>0xdfff);}
 return value;
}
export function accountProfileName(value:unknown):string{
 const name=accountProfileText(value),length=Array.from(name.trim()).length;
 requireValue(length>=1&&length<=200);return name;
}
export function accountProfileBytes(value:unknown,maximum:number):void{
 requireValue(new TextEncoder().encode(JSON.stringify(value)).byteLength<=maximum);
}
export function readAccountProfileCommand(value:unknown):AccountProfileCommand{
 const v=readObject(value);requireValue(v.schemaVersion===1);let command:AccountProfileCommand;
 if(v.action==='read_account_profile_v1'){exactKeys(v,['schemaVersion','action']);command={schemaVersion:1,action:v.action};}
 else {requireValue(v.action==='set_account_display_name_v1');exactKeys(v,['schemaVersion','action','requestId','expectedRevision','displayName']);command={schemaVersion:1,action:v.action,requestId:readUuid(v.requestId).toLowerCase(),expectedRevision:readInteger(v.expectedRevision),displayName:accountProfileName(v.displayName)};}
 accountProfileBytes(command,accountProfileCommandMaxBytes);return Object.freeze(command);
}
export function readAccountProfileView(value:unknown):AccountProfileView{
 const v=readObject(value);exactKeys(v,['schemaVersion','profileRevision','displayName','currentEmail']);requireValue(v.schemaVersion===1);
 const e=readObject(v.currentEmail);let email:AccountProfileView['currentEmail'];
 if(e.state==='unknown'){exactKeys(e,['state']);email={state:'unknown'};}
 else {exactKeys(e,['state','address','verified']);requireValue(e.state==='known'&&typeof e.verified==='boolean');const address=accountProfileText(e.address);requireValue(address.length>0);email={state:'known',address,verified:e.verified};}
 const view:AccountProfileView={schemaVersion:1,profileRevision:readInteger(v.profileRevision),displayName:accountProfileName(v.displayName),currentEmail:Object.freeze(email)};
 accountProfileBytes(view,accountProfileResultMaxBytes);return Object.freeze(view);
}
function instant(value:unknown):string{
 const s=accountProfileText(value);requireValue(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(s));
 const ms=Date.parse(s);requireValue(Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,19)===s.slice(0,19));return s;
}
export function readAccountProfileReceipt(value:unknown,command:Extract<AccountProfileCommand,{action:'set_account_display_name_v1'}>):AccountProfileReceipt{
 const v=readObject(value);exactKeys(v,['schemaVersion','requestId','action','previousRevision','revision','displayName','recordedAt']);
 requireValue(v.schemaVersion===1&&v.action===command.action&&v.requestId===command.requestId&&v.displayName===command.displayName);
 const previousRevision=readInteger(v.previousRevision),revision=readInteger(v.revision);requireValue(previousRevision===command.expectedRevision&&(revision===previousRevision||revision===previousRevision+1));
 const receipt:AccountProfileReceipt={schemaVersion:1,requestId:command.requestId,action:command.action,previousRevision,revision,displayName:accountProfileName(v.displayName),recordedAt:instant(v.recordedAt)};
 accountProfileBytes(receipt,accountProfileResultMaxBytes);return Object.freeze(receipt);
}
