import type {ServiceFinancialsCommand,ServiceFinancialsRpcCall,ServiceFinancialsView} from './PortalServiceFinancials.ts';
import {readServiceFinancialsCommand,readServiceFinancialsView} from './PortalServiceFinancialsValidation.ts';
export function buildServiceFinancialsRpc(input:unknown):ServiceFinancialsRpcCall{
 return Object.freeze({name:'concierge_client_service_financials_read_v1',args:Object.freeze({p_command:readServiceFinancialsCommand(input)})});
}
export function mapServiceFinancialsResult(input:unknown,command:ServiceFinancialsCommand):ServiceFinancialsView{
 try{return readServiceFinancialsView(input,readServiceFinancialsCommand(command));}catch{throw Error('unavailable');}
}
