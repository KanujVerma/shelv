import type {ReviewCommand,ReviewResult} from '../../../../../src/contracts/PortalReview.ts';
import {readReviewCommand} from '../../../../../src/contracts/PortalReviewValidation.ts';
import {decodePortalReviewResponse} from '../../../../../src/contracts/PortalReviewMapping.ts';
import {reviewErrorStatuses} from '../../../../../src/contracts/PortalReviewValues.ts';
import {TransportError} from '../../transport/error.ts';
import type {OperationPort} from '../../transport/session.ts';
import type {PlanSessionBoundary} from './types.ts';

export const clientGuidanceActions=['read_client_plan_v3','read_client_instruction_manifest_v1','read_client_instruction_v1','record_decision_v2','request_status_v1'] as const;
export type ClientGuidanceCommand=Extract<ReviewCommand,{action:typeof clientGuidanceActions[number]}>;
export type GuidanceDecisionCommand=Extract<ClientGuidanceCommand,{action:'record_decision_v2'}>;
export type ClientGuidancePort=OperationPort<ClientGuidanceCommand,ReviewResult>;
/** Wrap the coordinator's actual createClientReviewRequest(runtime). No URL,
 * actor, header or credential can be selected here. Mode is creation-bound. */
export function createClientGuidancePort({request,session,mode}:{request:OperationPort<unknown,unknown>;session:PlanSessionBoundary;mode:'client'}):ClientGuidancePort {
 if(mode!=='client')throw new TransportError(403);
 const current=()=>{if(!session.isCurrent())throw new TransportError(401);};current();
 return {async execute(value,options){
  current();let command:ReviewCommand;
  try{command=readReviewCommand(value);}catch{throw new TransportError(400);}
  if(!(clientGuidanceActions as readonly string[]).includes(command.action))throw new TransportError(403);
  const kind=command.action==='record_decision_v2'?'write':'read';
  if(options?.signal?.aborted)throw new TransportError(503,kind);
  let raw:unknown;
  try{raw=await request.execute(command,options);}catch(error){
   current();const e=error as {status?:number;code?:string};
   // Decode only the canonical finite status/code pair. Unknown upstream text
   // cannot enter customer copy or turn a failed status READ into a write.
   const outcome=decodePortalReviewResponse('review',command,e.status??503,{code:e.code});
   const safe=new TransportError(outcome.state==='ok'?503:outcome.status,kind);
   if(outcome.state!=='ok'&&e.code&&Object.hasOwn(reviewErrorStatuses,e.code)&&outcome.code===e.code)Object.defineProperty(safe,'code',{value:e.code});
   throw safe;
  }
  current();if(options?.signal?.aborted)throw new TransportError(503,kind);
  const outcome=decodePortalReviewResponse('review',command,200,raw);
  if(outcome.state!=='ok')throw new TransportError(outcome.status,kind);
  return outcome.value as ReviewResult;
 }};
}
