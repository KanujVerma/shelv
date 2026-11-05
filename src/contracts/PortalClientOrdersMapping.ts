import type {ClientOrdersReadCommand,ClientOrdersReadView,ClientOrdersReadRpcCall} from './PortalClientOrders.ts';
import {readClientOrdersReadCommand,readClientOrdersReadView} from './PortalClientOrdersValidation.ts';

export function buildClientOrdersReadRpc(value:unknown):ClientOrdersReadRpcCall{
 return Object.freeze({name:'concierge_client_orders_read_v1',args:Object.freeze({p_command:readClientOrdersReadCommand(value)})});
}
export function mapClientOrdersReadResult(value:unknown,command:ClientOrdersReadCommand):ClientOrdersReadView{
 readClientOrdersReadCommand(command);return readClientOrdersReadView(value);
}
