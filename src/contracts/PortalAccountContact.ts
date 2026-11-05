import type {AccountProfileView} from './PortalAccountProfile.ts';

/** Canonical profile facts only. Neither this view nor its basis grants authority. */
export type CurrentAccountEmail = AccountProfileView['currentEmail'];
export type PendingAccountEmail =
  | {state:'unknown'}
  | {state:'none'}
  | {state:'pending';address:string};
export type AccountContactView = {
  schemaVersion:1;
  contactBasis:string;
  currentEmail:CurrentAccountEmail;
  pendingEmail:PendingAccountEmail;
};
export type AccountContactCommand =
  | {schemaVersion:1;action:'read_account_contact_v1'}
  | {schemaVersion:1;action:'request_account_email_change_v1';requestId:string;expectedContactBasis:string;email:string}
  | {schemaVersion:1;action:'read_account_email_change_request_v1';requestId:string};
/** Historical provider acknowledgement only; never delivery, verification or currentness. */
export type AccountEmailChangeReceipt = {
  schemaVersion:1;
  action:'request_account_email_change_v1';
  requestId:string;
  outcome:'provider_accepted';
  recordedAt:string;
};
export type AccountEmailChangeStatus = {
  schemaVersion:1;
  action:'read_account_email_change_request_v1';
  requestId:string;
  state:'not_found'|'registered'|'dispatch_unknown'|'provider_accepted'|'provider_rejected';
};
export type AccountContactResult = AccountContactView|AccountEmailChangeReceipt|AccountEmailChangeStatus;
