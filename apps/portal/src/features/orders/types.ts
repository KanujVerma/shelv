import type {CommerceCommand, CommerceResult, CommerceDetail, CommerceQuoteHeader, FrozenProductLine, FrozenManualOption, CommerceHistoryEntry, CommerceIndexEntry, CommerceSnapshot, CommerceEntityRef} from '../../../../../src/contracts/PortalCommerce.ts';
import type {ApplicationSession} from '../../app/session.ts';
export type OrdersMode = 'client'|'read-only'|'administration'|'historical';
export type ClientCommerceAction = 'read_commerce_v1'|'read_commerce_detail_v1'|'read_quote_components_v1'|'read_commerce_history_v1'|'request_status_v1'|'accept_product_quote_v1'|'submit_payment_claim_v1'|'confirm_product_received_v1'|'request_product_return_v1';
export type ClientCommerceCommand = Extract<CommerceCommand,{action:ClientCommerceAction}>;
export type ClientCommerceWrite = Extract<ClientCommerceCommand,{requestId:string}> & {action:Exclude<ClientCommerceAction,'request_status_v1'>};
/** Future fixed Commerce request only. No admitted Commerce cookie channel exists.
 * Coordinator must supply an independently reviewed request bound to this exact
 * ApplicationSession, with cookie/CSRF/raw-response limits and owner fences. */
export interface FutureCommerceRequest {
 readonly family:'commerce-v1';
 execute(command:ClientCommerceCommand, options:{kind:'read'|'write';signal?:AbortSignal}):Promise<unknown>;
}
export interface CommercePort {
 readonly availability:'available'|'unavailable';
 execute(command:ClientCommerceCommand, options?:{signal?:AbortSignal;statusIntent?:ClientCommerceWrite;basis?:OrdersSelection;isApplicable?:()=>boolean;onDispatch?:()=>void}):Promise<CommerceResult>;
}
export type CommerceRuntime = Pick<ApplicationSession,'cookie'|'getSnapshot'>;
export type OrdersDetail = Exclude<CommerceDetail,{kind:'quote_draft'|'refund_request'|'obligation'}>;
export interface CompleteQuote {header:CommerceQuoteHeader;lines:FrozenProductLine[];options:FrozenManualOption[];verified:true}
export interface OrdersSelection {entity:CommerceEntityRef;snapshot:CommerceSnapshot;detail:OrdersDetail;quote:CompleteQuote|null;history:CommerceHistoryEntry[]}
export interface OrdersIndex {snapshot:CommerceSnapshot;entries:CommerceIndexEntry[];nextCursor:string|null}
/** Shell-owned exact selection adapter; never fabricates PlanContent/actual use. */
export interface OrdersNavigation {
 open(entity:CommerceEntityRef):void;
 back():void;
 product?(selection:FrozenProductLine['selection']):void;
 actualUse?(selection:FrozenProductLine['selection']):void;
 selfPurchase?(selection:FrozenProductLine['selection']):void;
 help?():void;
}
