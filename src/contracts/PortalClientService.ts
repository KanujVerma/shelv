import type {ServiceCancellation} from './ConciergeService.ts';
/** Own administration only. None of these fields grants care, payment or source rights. */
export type ClientServiceCancelCommand={schemaVersion:1;action:'cancel_client_service_period_end_v1';requestId:string;expectedServiceRevision:number;expectedBasisHash:string;reason:string|null;confirmed:true};
export type ClientServiceCommand=
 | {schemaVersion:1;action:'read_client_service_v1'}
 | ClientServiceCancelCommand
 | {schemaVersion:1;action:'client_service_request_status_v1';requestId:string};
/** Current boundaries under recorded paid coverage/cancellation, subject to later canonical changes.
 * Both dates are EXCLUSIVE America/Chicago calendar boundaries, never care permission. */
export type ClientServicePostServiceAccess=
 | {state:'known';supportEndsOn:string;readOnlyEndsOn:string}
 | {state:'unknown'};
export type ClientServiceView={
 schemaVersion:1;serviceRevision:number;basisHash:string;asOfDay:string;
 coverage:{status:'unpaid'|'pending_publication'|'active'|'expired'|'cancelled';
  /** startOn inclusive, endOn EXCLUSIVE, using America/Chicago calendar days. */
  period:{startOn:string;endOn:string}|null;
  /** EXCLUSIVE paid support boundary across ALL dated paid periods, including prepaid future periods. */
  paidSupportEndsOn:string|null;pendingPublication:boolean};
 cancellation:ServiceCancellation|null;
 /** Both boundaries are EXCLUSIVE Chicago dates; this is an exact-current preview, not authority. */
 periodEndCancellation:{state:'available';supportEndsOn:string;readOnlyEndsOn:string}|{state:'unavailable';reason:'already_cancelled'|'coverage_unknown'|'not_active'};
 /** Older V1 responses omit this property. Absence is unknown; consumers must not infer dates. */
 postServiceAccess?:ClientServicePostServiceAccess;
};
/** Historical immutable acknowledgement, never a current service projection. */
export type ClientServiceReceipt={schemaVersion:1;requestId:string;action:'cancel_client_service_period_end_v1';previousServiceRevision:number;serviceRevision:number;expectedBasisHash:string;cancellation:ServiceCancellation};
export type ClientServiceStatus=
 | {schemaVersion:1;requestId:string;state:'absent'}
 | {schemaVersion:1;requestId:string;state:'committed';original:ClientServiceCancelCommand;receipt:ClientServiceReceipt};
export type ClientServiceResult=ClientServiceView|ClientServiceReceipt|ClientServiceStatus;
export type ClientServiceRpcCall={name:'concierge_client_service_command_v1';args:{p_command:ClientServiceCommand}};
/** Token context correlates actual Auth and SQL session checks. It is not authority. */
export type ClientServiceIdentity={id:string;is_anonymous:false;sessionId:string;expiresAt:number};
export type ClientServicePorts={
 allowedOrigins:readonly string[];
 authenticate(token:string,signal:AbortSignal):Promise<ClientServiceIdentity>;
 rpc(token:string,call:ClientServiceRpcCall,signal:AbortSignal):Promise<{data:unknown;error:{status?:number;message?:string}|null}>;
};
