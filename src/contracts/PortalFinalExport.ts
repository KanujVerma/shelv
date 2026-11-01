import type {ClientPlanContent,Known,Schedule,LegacyPlan} from './PortalRebuild.ts';
import type {Usage} from './ConciergePresentation.ts';

/** Public consistency only. Every read separately checks the current own-client session. */
export type FinalCareBasis={supportEndsOn:string;supportEndsAt:string;readOnlyEndsOn:string;readOnlyEndsAt:string;publication:{version:number;documentSchemaVersion:2|3};publishedAt:string};
export type FinalExportPlan={documentSchemaVersion:3;content:ClientPlanContent}|{documentSchemaVersion:2;legacyOriginal:LegacyPlan;goal:string};
export type FinalExportUse={productId:string;state:'not_reported'|'using'|'paused'|'stopped'|'using_differently'|'unreviewed';originalStart:Known<string>;occurredOn:Known<string>;details:string|null;frequency:Known<string>|null;amount:Known<string>|null;contradiction:boolean};
export type FinalExportInstruction={instructionId:string;version:number;slotId:string;productId:string|null;effectiveOn:string;publishedAt:string;originalStart:Known<string>|null;content:{format:'authored_schedule';directions:string[];cautions:string[];schedule:Schedule;reason:string}|{format:'legacy_usage';usage:Usage;reason:string}};
export type FinalExportRecord={schemaVersion:1;careBasis:FinalCareBasis;plan:FinalExportPlan;use:FinalExportUse[];instructions:FinalExportInstruction[]};
export type FinalExportSelectionBasis=FinalCareBasis&{hashProfile:'shelv.final-export.folded-sha256.v1';selectionHash:string;unitCount:number;instructionCount:number};
export type FinalExportPlanUnit={schemaVersion:1;kind:'plan';careBasis:FinalCareBasis;plan:FinalExportPlan;use:FinalExportUse[]};
export type FinalExportInstructionUnit={schemaVersion:1;kind:'instruction';instruction:FinalExportInstruction};
export type FinalExportUnit=FinalExportPlanUnit|FinalExportInstructionUnit;
export type FinalExportPartIndex={unitIndex:number;segmentIndex:number};
export type FinalExportUnavailableReason='service_end_unknown'|'service_not_ended'|'entitled_publication_missing'|'public_document_missing'|'legacy_snapshot_missing'|'instructions_incomplete';
export type FinalExportManifest={schemaVersion:1;status:'available';basis:FinalExportSelectionBasis;rootHash:string;partCount:number;totalBytes:number}|{schemaVersion:1;status:'unavailable';reason:FinalExportUnavailableReason};
export type FinalExportPart={schemaVersion:1;basis:FinalExportSelectionBasis;partIndex:FinalExportPartIndex;kind:'plan'|'instruction';segmentCount:number;unitCharacters:number;unitBytes:number;text:string;leafHash:string};
export type FinalExportCommand={schemaVersion:1;action:'read_final_export_manifest_v1'}|{schemaVersion:1;action:'read_final_export_part_v1';basis:FinalExportSelectionBasis;partIndex:FinalExportPartIndex};
export type FinalExportRpcCall={name:'concierge_final_export_command_v1';args:{p_command:FinalExportCommand}};
export type FinalExportResult=FinalExportManifest|FinalExportPart;
export type DeepReadonly<T>=T extends readonly (infer U)[]?readonly DeepReadonly<U>[]:T extends object?{readonly [K in keyof T]:DeepReadonly<T[K]>}:T;
export type AvailableFinalExport=Extract<FinalExportManifest,{status:'available'}>;
export type FinalExportSink<T>={stage(unit:DeepReadonly<FinalExportUnit>,unitIndex:number,manifest:DeepReadonly<AvailableFinalExport>):Promise<void>;commit(manifest:DeepReadonly<AvailableFinalExport>):Promise<T>;abort():Promise<void>};
export type FinalExportStreamReceipt<T>={manifest:DeepReadonly<AvailableFinalExport>;commitResult:T};
