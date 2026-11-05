export const accountProfileCommandMaxBytes=8192;
export const accountProfileResultMaxBytes=16384;
export const accountProfileAuthMaxBytes=8192;
export const accountProfileOperationMilliseconds=10000;
export const accountProfileErrorStatuses:Readonly<Record<string,number>>=Object.freeze({unauthorized:401,session_ended:401,forbidden:403,invalid_input:400,too_large:413,revision_conflict:409,request_conflict:409,unavailable:503});
