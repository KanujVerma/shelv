import type {
  SourceAccountConsent, SourceAccountConsentRef, SourceAccountPage, SourceAccountRequestStatus,
  SourceAccountSnapshot, SourceAccountStatusCommand, SourceAccountUnavailable, SourceAccountWithdrawCommand,
} from '../../../../../../src/contracts/PortalSourceAccount.ts';

export type ConsentReadonly<T> = T extends object ? {readonly [K in keyof T]:ConsentReadonly<T[K]>} : T;
/** Presentation inputs only. The future authenticated producer owns identity and completeness. */
export type SourceConsentsRead = {readonly state:'unknown'} |
  {readonly state:'unavailable';readonly reason:'backend_unavailable'} |
  {readonly state:'loaded';readonly page:SourceAccountPage|SourceAccountUnavailable};
export type SourceConsentUncommittedStatus = Exclude<SourceAccountRequestStatus,{status:'committed'}>;
/** Supplied by a future original-command journal, never manufactured by this UI. */
export interface SourceConsentRecoveryInput {
  readonly original:SourceAccountWithdrawCommand;
  readonly requestHash:string;
  readonly observation:{readonly state:'unknown'}|{readonly state:'observed';readonly status:SourceConsentUncommittedStatus};
}
export interface SourceConsentReview {
  readonly consent:ConsentReadonly<SourceAccountConsentRef>;
  readonly snapshot:ConsentReadonly<SourceAccountSnapshot>;
  readonly disclosureText:string;
}
/** A local review intent. It is not a wire command, consent grant or withdrawal receipt. */
export interface SourceConsentWithdrawalIntent extends SourceConsentReview {readonly kind:'withdrawal'}
export interface SourceConsentsInput {
  readonly read?:SourceConsentsRead;
  /** Denies local actions only; this is not a service-access or server-permission flag. */
  readonly presentation?:'review'|'read_only';
  readonly recovery?:SourceConsentRecoveryInput;
  readonly onWithdrawalIntent?:(intent:SourceConsentWithdrawalIntent)=>void;
  readonly onCheckStatusIntent?:(command:ConsentReadonly<SourceAccountStatusCommand>)=>void;
  readonly onRetryOriginalIntent?:(command:ConsentReadonly<SourceAccountWithdrawCommand>)=>void;
  readonly onRefreshIntent?:()=>void;
}
export interface SourceConsentRow {
  readonly record:ConsentReadonly<SourceAccountConsent>;
  /** A local control explanation, never Source authority. */
  readonly unavailableReason:string|null;
}
export interface SourceConsentGroup {
  readonly alias:string;
  readonly rows:readonly SourceConsentRow[];
}
export interface SourceConsentsSnapshot {
  readonly read:{readonly state:'unknown'}|{readonly state:'unavailable'}|
    {readonly state:'loaded';readonly page:ConsentReadonly<SourceAccountPage>};
  readonly rows:readonly SourceConsentRow[];
  readonly groups:readonly SourceConsentGroup[];
  readonly confirmation:SourceConsentReview|null;
  readonly intentState:'idle'|'emitted'|'unavailable';
  readonly recovery:{readonly state:'none'|'unknown'|'absent'|'unavailable'|'purged';readonly checkUnavailableReason:string|null;readonly retryUnavailableReason:string|null};
  readonly refreshUnavailableReason:string|null;
}
export interface SourceConsentsModel {
  getSnapshot():SourceConsentsSnapshot;
  subscribe(listener:()=>void):()=>void;
  replace(input:SourceConsentsInput):void;
  reviewWithdrawal(row:SourceConsentRow):void;
  cancelReview(review:SourceConsentReview|null):void;
  confirmWithdrawal(review:SourceConsentReview|null):void;
  checkOriginalResult():void;
  retryOriginal():void;
  refresh():void;
  dispose():void;
}
