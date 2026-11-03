import type {ServiceView} from './ConciergeService.ts';

/** Own recorded administration only; conveys no care, purchase or refund authority. */
export type ClientOrdersReadCommand={schemaVersion:1;action:'read_client_orders_v1'};
export type ClientOrdersReadView={schemaVersion:1}&Pick<ServiceView,'revision'|'purchases'|'returns'>;
export type ClientOrdersReadRpcCall={name:'concierge_client_orders_read_v1';args:{p_command:ClientOrdersReadCommand}};
/** Auth verifies permanent identity; token session/expiry are correlation for SQL. */
export type ClientOrdersReadIdentity={id:string;is_anonymous:false;sessionId:string;expiresAt:number};
export type ClientOrdersReadPorts={
 allowedOrigins:readonly string[];
 authenticate(token:string,signal:AbortSignal):Promise<ClientOrdersReadIdentity>;
 rpc(token:string,call:ClientOrdersReadRpcCall,signal:AbortSignal):Promise<{data:unknown;error:{status?:number;message?:string}|null}>;
};
