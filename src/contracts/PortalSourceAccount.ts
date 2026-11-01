/** MODEL PROPOSAL ONLY. No RPC, client action, consent or Source authority is activated. */
import type {UUID, Revision, Hash, Known} from './PortalRebuild.ts';
import type {SourceAccountErrorCode} from './PortalSourceAccountValues.ts';

export type SourceAccountPurpose = 'service_storage' | 'service_review';
/** Same version/hash concept as frozen SourcePolicyRef; no Source15 import/admission. */
export type SourceAccountDisclosureRef = {version:number; hash:Hash};
export type SourceAccountConsentRef = {id:UUID; purpose:SourceAccountPurpose; disclosure:SourceAccountDisclosureRef};
export type SourceAccountSnapshot = {revision:Revision; hash:Hash};
export type SourceAccountListCommand = {
  schemaVersion:1; action:'list_source_consents_v1'; snapshot:SourceAccountSnapshot|null;
  cursor:number|null; limit:number;
};
export type SourceAccountWithdrawCommand = {
  schemaVersion:1; action:'withdraw_source_consent_v1'; requestId:UUID;
  expectedRevision:Revision; consent:SourceAccountConsentRef;
};
export type SourceAccountStatusCommand = {schemaVersion:1; action:'request_status_v1'; requestId:UUID};
export type SourceAccountCommand = SourceAccountListCommand | SourceAccountWithdrawCommand | SourceAccountStatusCommand;
export type SourceAccountRpcCall = {name:'concierge_source_account_command_v1'; args:{p_command:SourceAccountCommand}};

/** Server-attributed portal event, never a fabricated manual call/text/reference. */
export type SourceAccountWithdrawal = {
  id:UUID; origin:'client_portal'; consent:SourceAccountConsentRef; recordedBy:UUID; recordedAt:string;
};
export type SourceAccountConsent = {
  consent:SourceAccountConsentRef; disclosureText:string;
  confirmation:{
    kind:'manual'; decision:'allow'|'withdraw'; channel:'text'|'call'|'video'|'in_person';
    occurredAt:Known<string>; recordedBy:UUID; recordedAt:string;
  };
  /** Display state only. Even current/not_withdrawn is not a grant or current authority. */
  effective:'not_withdrawn'|'withdrawn'|'superseded';
  withdrawal:SourceAccountWithdrawal|null;
};
export type SourceAccountBase = {schemaVersion:1; visibility:'client_account'; clientId:UUID};
export type SourceAccountUnavailable = SourceAccountBase & {
  state:'unavailable'; code:'client_lineage_unavailable'|'consent_unavailable'|'disclosure_unavailable'|'attribution_unavailable'|'lifecycle_unavailable';
};
export type SourceAccountPage = SourceAccountBase & {
  state:'page'; snapshot:SourceAccountSnapshot; cursor:number|null; total:number;
  entries:SourceAccountConsent[]; nextCursor:number|null;
};
export type SourceAccountReceipt = SourceAccountBase & {
  action:'withdraw_source_consent_v1'; requestId:UUID; commandHash:Hash; revision:Revision;
  outcome:'withdrawn'; withdrawal:SourceAccountWithdrawal;
};
export type SourceAccountRequestStatus = SourceAccountBase & {requestId:UUID} & (
  {status:'absent'} | {status:'committed'; receipt:SourceAccountReceipt} |
  {status:'unavailable'; code:'request_unavailable'|'request_purged'}
);
export type SourceAccountResult = SourceAccountPage | SourceAccountUnavailable | SourceAccountReceipt | SourceAccountRequestStatus;
/** Independent local binding from the actual session/original journal, NEVER command JSON or auth. */
export type SourceAccountMappingContext = {
  clientId:UUID;
  originalWithdrawal?:SourceAccountWithdrawCommand;
  requestHash?:Hash;
};
export type SourceAccountPageRead = {command:SourceAccountListCommand; page:SourceAccountPage};
export type SourceAccountCollection = SourceAccountBase & {state:'complete'; snapshot:SourceAccountSnapshot; entries:SourceAccountConsent[]};
export type SourceAccountOutcome = {state:'ok'; value:SourceAccountResult} |
  {state:'rejected'; status:number; code:SourceAccountErrorCode} |
  {state:'uncertain'; status:503; code:'uncertain'; retry:SourceAccountWithdrawCommand};
