import {buildGuidanceRpc,readGuidanceCommand} from '../../../../../src/contracts/PortalReviewValidation.ts';
import {decodePortalReviewResponse} from '../../../../../src/contracts/PortalReviewMapping.ts';
import {portalReviewAccess,isPortalReviewRead} from '../../../../../src/contracts/PortalReviewValues.ts';
import {demand,SessionError} from './types';

export function parseGuidanceCommand(value:unknown):Record<string,unknown>{
 let command;
 try{command=buildGuidanceRpc(value).args.p_command;}catch{throw new SessionError(400,'invalid_request');}
 demand(portalReviewAccess('guidance',command.action,'human')!=='DENY',403,'action_forbidden');
 return command;
}
export function mapGuidanceResponse(value:unknown,input:unknown){
 const command=readGuidanceCommand(input),outcome=decodePortalReviewResponse('guidance',command,200,value);
 if(outcome.state!=='ok')throw new SessionError(outcome.status,outcome.code);
 return outcome.value;
}
/** All Guidance paths (including READ/status) start at SQL plan_guard/edit.
 * Actual publication additionally requires the authenticated publisher right. */
export function guidanceCapabilities(action:unknown):readonly ('edit'|'publish')[]{
 demand(typeof action==='string'&&portalReviewAccess('guidance',action,'human')!=='DENY',403,'action_forbidden');
 return action==='publish_guidance_v1'?['edit','publish']:['edit'];
}
export function guidanceTransportError(error:unknown,input:unknown):never{
 if((error as {status?:unknown})?.status===503)throw new SessionError(503,isPortalReviewRead(readGuidanceCommand(input))?'unavailable':'uncertain');
 throw error;
}
