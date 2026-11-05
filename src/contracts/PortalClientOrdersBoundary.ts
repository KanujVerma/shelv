import type {ClientOrdersReadCommand,ClientOrdersReadView} from './PortalClientOrders.ts';
import {buildClientOrdersReadRpc,mapClientOrdersReadResult} from './PortalClientOrdersMapping.ts';

/** New guarded/typed boundaries only. Original V1 status meanings are unchanged. */
export const clientOrdersBoundaryErrorStatuses=Object.freeze({
 unauthorized:401,session_ended:401,forbidden:403,invalid_input:400,too_large:413,
 revision_conflict:409,content_version_required:409,unavailable:503,
} as const);
export type ClientOrdersBoundaryErrorCode=keyof typeof clientOrdersBoundaryErrorStatuses;
/** Prospective fixed source target, not a registered RPC or cutover authorization. */
export type GuardedClientOrdersReadRpcCall={name:'concierge_client_orders_read_guarded_v1';args:{p_command:ClientOrdersReadCommand}};
export function buildGuardedClientOrdersReadRpc(input:unknown):GuardedClientOrdersReadRpcCall{
 const normalized=buildClientOrdersReadRpc(input);
 return Object.freeze({name:'concierge_client_orders_read_guarded_v1',args:normalized.args});
}
/** Only a real guard may emit version-required. Malformed 200 data keeps strict refusal. */
export function mapGuardedClientOrdersReadResult(input:unknown,command:ClientOrdersReadCommand):ClientOrdersReadView{
 return mapClientOrdersReadResult(input,command);
}
