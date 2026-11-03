import type {ClientServiceCommand,ClientServiceRpcCall,ClientServiceResult} from './PortalClientService.ts';
import {readClientServiceCommand,readClientServiceView,readClientServiceReceipt,readClientServiceStatus} from './PortalClientServiceValidation.ts';
export function buildClientServiceRpc(value:unknown):ClientServiceRpcCall{
 return Object.freeze({name:'concierge_client_service_command_v1',args:Object.freeze({p_command:readClientServiceCommand(value)})});
}
export function mapClientServiceResult(value:unknown,command:ClientServiceCommand):ClientServiceResult{
 const original=readClientServiceCommand(command);
 switch(original.action){
 case 'read_client_service_v1':return readClientServiceView(value);
 case 'cancel_client_service_period_end_v1':return readClientServiceReceipt(value,original);
 case 'client_service_request_status_v1':return readClientServiceStatus(value,original.requestId);
 }
}
