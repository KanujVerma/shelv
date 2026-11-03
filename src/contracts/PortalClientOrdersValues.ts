export const clientOrdersReadCommandMaxBytes=8192;
export const clientOrdersReadAuthMaxBytes=8192;
/** First packet is a complete bounded view, with explicit refusal for larger histories. */
export const clientOrdersReadResultMaxBytes=2000000;
export const clientOrdersReadOperationMilliseconds=10000;
export const clientOrdersReadErrorStatuses:Readonly<Record<string,number>>=Object.freeze({
 unauthorized:401,session_ended:401,forbidden:403,invalid_input:400,too_large:413,
 revision_conflict:409,unavailable:503,
});
