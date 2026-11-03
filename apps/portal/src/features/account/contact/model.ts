import {readAccountContactCommand} from '../../../../../../src/contracts/PortalAccountContactValidation.ts';
import type {AccountContactSnapshot} from './types.ts';

const empty:AccountContactSnapshot=Object.freeze({phase:'unread',current:null,draft:null,review:null,original:null,receipt:null,originalStatus:null,requestState:'idle',busy:null,emailError:null,message:null});
export function initialAccountContactSnapshot():AccountContactSnapshot {return empty;}
/** Validate through the exact Root command grammar; never normalize the address. */
export function emailDraftError(email:string):string|null {
  try {
    readAccountContactCommand({schemaVersion:1,action:'request_account_email_change_v1',requestId:'00000000-0000-4000-8000-000000000000',expectedContactBasis:'0'.repeat(64),email});
    return null;
  } catch {return 'enter a valid email address without spaces at either end.';}
}
/** Historical request disposition supplies no current-address or delivery fact. */
export function contactRequestNotice(state:AccountContactSnapshot):string|null {
  if(!state.original)return null;
  switch(state.originalStatus?.state){
    case 'not_found':return 'the original request is not in the request record. this does not establish whether an email change occurred.';
    case 'registered':return 'the original request is recorded. provider acceptance and verification are not confirmed.';
    case 'dispatch_unknown':return 'the original request outcome is uncertain. check its status again.';
    case 'provider_rejected':return 'the provider rejected the original request. refresh the current email details.';
    case 'provider_accepted':return 'the provider accepted the original request. this does not confirm verification or the current email address.';
  }
  if(state.receipt)return 'the provider accepted the original request. this does not confirm verification or the current email address.';
  return state.requestState==='requesting'?'requesting the email change.':'the original request outcome is uncertain. check its status.';
}
