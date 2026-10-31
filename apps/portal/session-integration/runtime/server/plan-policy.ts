import {readPlanCommand} from '../../../../../src/contracts/PortalRebuildValidation.ts';
import {mapPlanResult} from '../../../../../src/contracts/PortalRebuildMapping.ts';
import {advisorPlanActions,clientPlanActions} from '../../../site/auth/plan-actions.js';
import {demand,SessionError} from './types';

/** Same strict protocol at the cookie boundary and direct Edge handler. */
export function parsePlanCommand(value:unknown,audience:'client'|'advisor'):Record<string,unknown>{
 let command;
 try{command=readPlanCommand(value);}catch{throw new SessionError(400,'invalid_request');}
 demand((audience==='client'?clientPlanActions:advisorPlanActions).includes(command.action),403,'action_forbidden');
 return command;
}

export function mapPlanResponse(value:unknown,command:unknown){
 try{return mapPlanResult(value,readPlanCommand(command));}catch{throw new SessionError(503,'unavailable');}
}

const publicationActions=new Set(['approve_publication_v1','publish_plan_v1','revoke_approval_v1','set_sami_approval_policy_v1','grant_task_v1','revoke_task_v1']);
const readActions=new Set(['list_plans_v1','read_draft_v1','compare_import_v1','validate_draft_v1','preview_draft_v1','request_status_v1','read_policy_v1','read_advisor_gate_v1','read_advisor_publication_v1']);
export function planCapability(action:unknown):'view'|'edit'|'publish'{
 demand(typeof action==='string'&&advisorPlanActions.includes(action),403,'action_forbidden');
 return publicationActions.has(action)?'publish':readActions.has(action)?'view':'edit';
}
