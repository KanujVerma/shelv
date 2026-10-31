import {readCareCommand} from '../../../../../src/contracts/PortalCareValidation.ts';
import {mapCareResult} from '../../../../../src/contracts/PortalCareMapping.ts';
import {advisorCareActions,clientCareActions} from '../../../site/auth/care-actions.js';
import {demand,SessionError} from './types';

/** Same finite protocol at cookie and direct Edge boundaries. */
export function parseCareCommand(value:unknown,audience:'client'|'advisor'):Record<string,unknown>{
 let command;
 try{command=readCareCommand(value);}catch{throw new SessionError(400,'invalid_request');}
 demand((audience==='client'?clientCareActions:advisorCareActions).includes(command.action),403,'action_forbidden');
 return command;
}
export function mapCareResponse(value:unknown,command:unknown){
 try{return mapCareResult(value,readCareCommand(command));}catch{throw new SessionError(503,'unavailable');}
}
export function careCapability(action:unknown):'view'|'edit'{
 demand(typeof action==='string'&&advisorCareActions.includes(action),403,'action_forbidden');
 return ['read_advisor_publication_v2','read_advisor_use_history_v1','request_status_v1'].includes(action)?'view':'edit';
}
