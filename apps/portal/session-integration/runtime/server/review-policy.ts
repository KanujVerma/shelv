import {buildReviewRpc,readReviewCommand} from '../../../../../src/contracts/PortalReviewValidation.ts';
import {decodePortalReviewResponse} from '../../../../../src/contracts/PortalReviewMapping.ts';
import {portalReviewAccess,isPortalReviewRead} from '../../../../../src/contracts/PortalReviewValues.ts';
import {demand,SessionError} from './types';

/** Reuse the canonical closed schema. Audience is transport scope, never caller authority. */
export function parseReviewCommand(value:unknown,audience:'client'|'advisor'):Record<string,unknown>{
 let command;
 try{command=buildReviewRpc(value).args.p_command;}catch{throw new SessionError(400,'invalid_request');}
 demand(portalReviewAccess('review',command.action,audience==='advisor'?'human':'client')!=='DENY',403,'action_forbidden');
 return command;
}
export function mapReviewResponse(value:unknown,input:unknown){
 const command=readReviewCommand(input),outcome=decodePortalReviewResponse('review',command,200,value);
 if(outcome.state!=='ok')throw new SessionError(outcome.status,outcome.code);
 return outcome.value;
}
/** A status lookup may return a private original receipt. SQL rechecks that
 * receipt's current edit/source/publish rights; view here grants none of them. */
export function reviewCapability(action:unknown):'view'|'edit'{
 demand(typeof action==='string'&&portalReviewAccess('review',action,'human')!=='DENY',403,'action_forbidden');
 return ['record_conversation_v1','append_private_review_note_v1','read_advisor_care_history_v1'].includes(action)?'edit':'view';
}
export function reviewTransportError(error:unknown,input:unknown):never{
 if((error as {status?:unknown})?.status===503)throw new SessionError(503,isPortalReviewRead(readReviewCommand(input))?'unavailable':'uncertain');
 throw error;
}
