/** Own-account administration only. These records convey no care or source authority. */
export type AccountProfileCommand =
 | {schemaVersion:1;action:'read_account_profile_v1'}
 | {schemaVersion:1;action:'set_account_display_name_v1';requestId:string;expectedRevision:number;displayName:string};
export type AccountProfileView={schemaVersion:1;profileRevision:number;displayName:string;currentEmail:{state:'known';address:string;verified:boolean}|{state:'unknown'}};
/** Immutable acknowledgement of an earlier command, never a current profile projection. */
export type AccountProfileReceipt={schemaVersion:1;requestId:string;action:'set_account_display_name_v1';previousRevision:number;revision:number;displayName:string;recordedAt:string};
export type AccountProfileResult=AccountProfileView|AccountProfileReceipt;
export type AccountProfileRpcCall={name:'concierge_account_profile_command_v1';args:{p_command:AccountProfileCommand}};
/** Auth verifies id/permanent identity; token context is correlation, not session authority. */
export type AccountProfileIdentity={id:string;is_anonymous:false;sessionId:string;expiresAt:number};
export type AccountProfilePorts={
 allowedOrigins:readonly string[];
 authenticate(token:string,signal:AbortSignal):Promise<AccountProfileIdentity>;
 rpc(token:string,call:AccountProfileRpcCall,signal:AbortSignal):Promise<{data:unknown;error:{status?:number;message?:string}|null}>;
};
