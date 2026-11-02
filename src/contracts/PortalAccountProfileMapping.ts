import type {AccountProfileCommand,AccountProfileRpcCall,AccountProfileResult} from './PortalAccountProfile.ts';
import {readAccountProfileCommand,readAccountProfileView,readAccountProfileReceipt} from './PortalAccountProfileValidation.ts';
export function buildAccountProfileRpc(value:unknown):AccountProfileRpcCall{
 return Object.freeze({name:'concierge_account_profile_command_v1',args:Object.freeze({p_command:readAccountProfileCommand(value)})});
}
export function mapAccountProfileResult(value:unknown,command:AccountProfileCommand):AccountProfileResult{
 const original=readAccountProfileCommand(command);
 return original.action==='read_account_profile_v1'?readAccountProfileView(value):readAccountProfileReceipt(value,original);
}
