import {reviewPageMaxBytes,reviewInstructionScopesMax,reviewResponseMaxBytes} from './PortalReviewValues.ts';
export const finalExportCommandMaxBytes=100000;
export const finalExportPartMaxBytes=reviewPageMaxBytes;
/** A code-point part, including worst-case JSON escaping, fits the retained 400000-byte page. */
export const finalExportPartCharacters=32768;
export const finalExportInstructionScopesMax=reviewInstructionScopesMax;
/** Derived from the complete retained plan and every full instruction detail, never a row cap. */
export const finalExportRecordMaxBytes=reviewResponseMaxBytes+reviewInstructionScopesMax*reviewPageMaxBytes;
export const finalExportReasons=['service_end_unknown','service_not_ended','entitled_publication_missing','public_document_missing','legacy_snapshot_missing','instructions_incomplete'] as const;
export const finalExportErrorStatuses=Object.freeze({invalid_input:400,unauthorized:401,session_ended:401,forbidden:403,not_found:404,basis_conflict:409,too_large:413,unsupported_media_type:415,unavailable:503});
