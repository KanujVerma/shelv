import {reviewPageMaxBytes,reviewInstructionScopesMax,reviewResponseMaxBytes} from './PortalReviewValues.ts';
import {careTextMax} from './PortalCareValues.ts';
export const finalExportCommandMaxBytes=100000;
export const finalExportPartMaxBytes=reviewPageMaxBytes;
/** A code-point part, including worst-case JSON escaping, fits the retained 400000-byte page. */
export const finalExportPartCharacters=32768;
export const finalExportInstructionScopesMax=reviewInstructionScopesMax;
export const finalExportHashProfile='shelv.final-export.folded-sha256.v1' as const;
/** UTF8 JSON escaping <=6 bytes/scalar. R2 union <=50 baseline+2*50 card products. */
export const finalExportUseMax=150;
export const finalExportPlanUnitMaxBytes=2*reviewResponseMaxBytes+finalExportUseMax*(3*careTextMax*6+2048)+65536;
/** Retained full detail cap plus a conservatively bounded export-only wrapper/metadata. */
export const finalExportInstructionUnitMaxBytes=2*reviewPageMaxBytes+65536;
export const finalExportTotalMaxBytes=finalExportPlanUnitMaxBytes+reviewInstructionScopesMax*finalExportInstructionUnitMaxBytes;
export const finalExportReasons=['service_end_unknown','service_not_ended','entitled_publication_missing','public_document_missing','legacy_snapshot_missing','instructions_incomplete'] as const;
export const finalExportErrorStatuses=Object.freeze({invalid_input:400,unauthorized:401,session_ended:401,forbidden:403,not_found:404,basis_conflict:409,too_large:413,unsupported_media_type:415,unavailable:503});
