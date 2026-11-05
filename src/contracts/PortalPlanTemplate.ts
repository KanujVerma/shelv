import type {Hash,PlanContent,UUID} from './PortalRebuild.ts';

/** Template management is human-only. These identities and hashes grant no client/Source rights. */
export type PlanTemplateListScope={kind:'catalog'}|{kind:'versions';templateId:UUID};
export type PlanTemplateCreateCommand={schemaVersion:1;action:'create_plan_template_v1';requestId:UUID;name:string;content:PlanContent};
export type PlanTemplateSaveCommand={schemaVersion:1;action:'save_plan_template_version_v1';requestId:UUID;templateId:UUID;expectedVersion:number;name:string;content:PlanContent};
export type PlanTemplateWriteCommand=PlanTemplateCreateCommand|PlanTemplateSaveCommand;
export type PlanTemplateCommand=PlanTemplateWriteCommand
 |{schemaVersion:1;action:'list_plan_templates_v1';scope:PlanTemplateListScope;cursor:string|null;limit:number}
 |{schemaVersion:1;action:'read_plan_template_version_v1';templateVersionId:UUID}
 |{schemaVersion:1;action:'plan_template_request_status_v1';requestId:UUID};
export type PlanTemplateRpcCall={name:'concierge_plan_template_command_v1';args:{p_command:PlanTemplateCommand}};
export type PlanTemplateVersionMetadata={schemaVersion:1;templateId:UUID;templateVersionId:UUID;version:number;versionHash:Hash;name:string;createdAt:string;createdBy:UUID};
/** Immutable version, never a claim about the current mutable head. */
export type PlanTemplateVersion=PlanTemplateVersionMetadata&{content:PlanContent};
export type PlanTemplatePage={schemaVersion:1;scope:PlanTemplateListScope;consistency:'live_keyset';observedAt:string;entries:PlanTemplateVersionMetadata[];nextCursor:string|null};
export type PlanTemplateReceipt={schemaVersion:1;requestId:UUID;action:PlanTemplateWriteCommand['action'];version:PlanTemplateVersion};
export type PlanTemplateStatus={schemaVersion:1;requestId:UUID;status:'absent'}|{schemaVersion:1;requestId:UUID;status:'committed';original:PlanTemplateWriteCommand;receipt:PlanTemplateReceipt};
export type PlanTemplateResult=PlanTemplatePage|PlanTemplateVersion|PlanTemplateReceipt|PlanTemplateStatus;
