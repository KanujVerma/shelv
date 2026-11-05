export const planTemplateActions=Object.freeze(['list_plan_templates_v1','read_plan_template_version_v1','create_plan_template_v1','save_plan_template_version_v1','plan_template_request_status_v1'] as const);
export const planTemplateCommandMaxBytes=500000;
export const planTemplateResultMaxBytes=1800000;
export const planTemplateListMaxBytes=100000;
export const planTemplatePageMax=100;
export const planTemplateCursorMaxBytes=512;
export const planTemplateNameMax=200;
export const planTemplateAuthMaxBytes=8192;
export const planTemplateOperationMilliseconds=10000;
export const planTemplateVersionHashDomain='plan_template_version_v1';
export const planTemplateErrorStatuses=Object.freeze({invalid_input:400,unauthorized:401,session_ended:401,forbidden:403,not_found:404,request_conflict:409,revision_conflict:409,cursor_conflict:409,too_large:413,unavailable:503} as const);
/** Classification only; SQL must enforce actual permanent human VIEW/EDIT and live session. */
export function planTemplateAccess(action:string,audience:'human'|'client'|'task_agent'):'READ'|'WRITE'|'DENY'{
 if(audience!=='human'||!planTemplateActions.includes(action as typeof planTemplateActions[number]))return 'DENY';
 return action==='create_plan_template_v1'||action==='save_plan_template_version_v1'?'WRITE':'READ';
}
