import type {AccountContactCommand,AccountContactView,AccountEmailChangeReceipt,AccountEmailChangeStatus} from '../../../../../../src/contracts/PortalAccountContact.ts';

export type AccountEmailChangeCommand = Readonly<Extract<AccountContactCommand,{action:'request_account_email_change_v1'}>>;
export interface AccountEmailDraft {readonly email:string;readonly expectedContactBasis:string}
/** Current canonical contact, local edit and historical original never alias. */
export interface AccountContactSnapshot {
  readonly phase:'unread'|'loading'|'ready'|'unavailable'|'denied'|'ended';
  readonly current:(Readonly<Omit<AccountContactView,'currentEmail'|'pendingEmail'>>&{readonly currentEmail:Readonly<AccountContactView['currentEmail']>;readonly pendingEmail:Readonly<AccountContactView['pendingEmail']>})|null;
  readonly draft:AccountEmailDraft|null;
  readonly review:AccountEmailDraft|null;
  readonly original:AccountEmailChangeCommand|null;
  readonly receipt:Readonly<AccountEmailChangeReceipt>|null;
  readonly originalStatus:Readonly<AccountEmailChangeStatus>|null;
  readonly requestState:'idle'|'reviewing'|'requesting'|'uncertain'|'acknowledged'|'conflict';
  readonly busy:'load'|'request'|'status'|null;
  readonly emailError:string|null;
  readonly message:string|null;
}
export interface AccountContactController {
  getSnapshot():AccountContactSnapshot;
  subscribe(listener:()=>void):()=>void;
  load():Promise<boolean>;
  editEmail():void;
  setEmail(email:string):void;
  reviewEmail():boolean;
  requestChange():Promise<boolean>;
  readOriginalStatus():Promise<boolean>;
  discardEdit():void;
  dispose():void;
}
