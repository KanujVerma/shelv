/** Proposed limits for this family only; no transport or role allowlist is changed. */
export const sourceAccountCommandMaxBytes = 100000;
export const sourceAccountResponseMaxBytes = 1800000;
export const sourceAccountPageMaxBytes = 400000;
export const sourceAccountPageMax = 100;
export const sourceAccountDisclosureMaxScalars = 4000;
export const sourceAccountReadActions = ['list_source_consents_v1','request_status_v1'] as const;
export const sourceAccountWriteActions = ['withdraw_source_consent_v1'] as const;
export const sourceAccountActions = [...sourceAccountReadActions,...sourceAccountWriteActions] as const;
export const sourceAccountErrorStatuses = Object.freeze({
  invalid_input:400, unauthorized:401, session_ended:401, forbidden:403, not_found:404,
  revision_conflict:409, request_conflict:409, consent_conflict:409, cursor_conflict:409,
  too_large:413, rate_limited:429, unavailable:503, uncertain:503,
});
export type SourceAccountErrorCode = keyof typeof sourceAccountErrorStatuses;
export const isSourceAccountRead = (action:string):boolean =>
  (sourceAccountReadActions as readonly string[]).includes(action);
