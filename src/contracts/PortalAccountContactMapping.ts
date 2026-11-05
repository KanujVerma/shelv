import type {AccountContactCommand,AccountContactResult,AccountContactView,CurrentAccountEmail,PendingAccountEmail,AccountEmailChangeReceipt,AccountEmailChangeStatus} from './PortalAccountContact.ts';
import {readAccountContactCommand} from './PortalAccountContactValidation.ts';

import {exactKeys,readObject,requireValue} from './ConciergePortalValidation.ts';
import {accountProfileText} from './PortalAccountProfileValidation.ts';
import {accountContactResultMaxBytes} from './PortalAccountContactValues.ts';

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
function instant(value:unknown):string {
  const s=accountProfileText(value);
  requireValue(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(s));
  const ms=Date.parse(s);requireValue(Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,19)===s.slice(0,19));return s;
}

function readAccountContactView(value:unknown):AccountContactView {
  const v=object(value,['schemaVersion','contactBasis','currentEmail','pendingEmail']);requireValue(v.schemaVersion===1);
  const rawCurrent=readObject(v.currentEmail);let currentEmail:CurrentAccountEmail;
  if(Object.getOwnPropertyDescriptor(rawCurrent,'state')?.value==='unknown'){
    object(rawCurrent,['state']);currentEmail=Object.freeze({state:'unknown'});
  }else{
    const e=object(rawCurrent,['state','address','verified']);requireValue(e.state==='known'&&typeof e.verified==='boolean');
    const address=accountProfileText(e.address);requireValue(address.length>0);
    currentEmail=Object.freeze({state:'known',address,verified:e.verified});
  }
  const rawPending=readObject(v.pendingEmail),state=Object.getOwnPropertyDescriptor(rawPending,'state')?.value;let pendingEmail:PendingAccountEmail;
  if(state==='unknown'||state==='none'){
    object(rawPending,['state']);pendingEmail=Object.freeze({state});
  }else{
    const e=object(rawPending,['state','address']);requireValue(e.state==='pending');
    pendingEmail=Object.freeze({state:'pending',address:email(e.address)});
  }
  const view:AccountContactView={schemaVersion:1,contactBasis:basis(v.contactBasis),currentEmail,pendingEmail};
  bytes(view,accountContactResultMaxBytes);return Object.freeze(view);
}

function readAccountEmailChangeReceipt(value:unknown,command:Extract<AccountContactCommand,{action:'request_account_email_change_v1'}>):AccountEmailChangeReceipt {
  const v=object(value,['schemaVersion','action','requestId','outcome','recordedAt']);
  requireValue(v.schemaVersion===1&&v.action===command.action&&v.requestId===command.requestId&&v.outcome==='provider_accepted');
  const receipt:AccountEmailChangeReceipt={schemaVersion:1,action:command.action,requestId:command.requestId,outcome:'provider_accepted',recordedAt:instant(v.recordedAt)};
  bytes(receipt,accountContactResultMaxBytes);return Object.freeze(receipt);
}

function readAccountEmailChangeStatus(value:unknown,command:Extract<AccountContactCommand,{action:'read_account_email_change_request_v1'}>):AccountEmailChangeStatus {
  const v=object(value,['schemaVersion','action','requestId','state']);
  requireValue(v.schemaVersion===1&&v.action===command.action&&v.requestId===command.requestId);
  const state=v.state;requireValue(state==='not_found'||state==='registered'||state==='dispatch_unknown'||state==='provider_accepted'||state==='provider_rejected');
  const status:AccountEmailChangeStatus={schemaVersion:1,action:command.action,requestId:command.requestId,state};
  bytes(status,accountContactResultMaxBytes);return Object.freeze(status);
}

export function mapAccountContactResult(value:unknown,command:AccountContactCommand):AccountContactResult {
  const original=readAccountContactCommand(command);
  switch(original.action){
    case 'read_account_contact_v1':return readAccountContactView(value);
    case 'request_account_email_change_v1':return readAccountEmailChangeReceipt(value,original);
    case 'read_account_email_change_request_v1':return readAccountEmailChangeStatus(value,original);
  }
}
