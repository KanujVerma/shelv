import type {PlanTemplateCommand,PlanTemplateResult,PlanTemplateRpcCall} from './PortalPlanTemplate.ts';
import {readPlanTemplateCommand,readPlanTemplateResult} from './PortalPlanTemplateValidation.ts';
export function buildPlanTemplateRpc(input:unknown):PlanTemplateRpcCall{
 return Object.freeze({name:'concierge_plan_template_command_v1',args:Object.freeze({p_command:readPlanTemplateCommand(input)})});
}
export function mapPlanTemplateResult(input:unknown,command:PlanTemplateCommand):PlanTemplateResult{
 try{return readPlanTemplateResult(input,readPlanTemplateCommand(command));}catch{throw Error('unavailable');}
}
