export const clientServiceCommandMaxBytes=8192;
export const clientServiceAuthMaxBytes=8192;
/** At most original reason and recorded reason (2000 scalars each), JSON escaping included. */
export const clientServiceResultMaxBytes=32768;
export const clientServiceOperationMilliseconds=10000;
/** Matches bigint CHECK revision BETWEEN 0 AND 9007199254740991. Writes need room for +1. */
export const clientServiceMaximumRevision=9007199254740991;
export const clientServiceDefaultCancellationReason='client requested period-end cancellation';
export const clientServiceErrorStatuses:Readonly<Record<string,number>>=Object.freeze({
 unauthorized:401,session_ended:401,forbidden:403,invalid_input:400,too_large:413,
 revision_conflict:409,request_conflict:409,unavailable:503,
});
