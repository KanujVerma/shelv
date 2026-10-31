import type {ApplicationSession} from '../../app/session.ts';
import type {OperationPort} from '../../transport/session.ts';
import type {HistoryCommand,HistoryPort,HistoryOutcome} from './types.ts';
import {readReviewCommand} from '../../../../../src/contracts/PortalReviewValidation.ts';
import {decodePortalReviewResponse} from '../../../../../src/contracts/PortalReviewMapping.ts';

export const historyActions=Object.freeze(['submit_goal_report_v1','amend_report_v1','read_care_history_v1','read_client_plan_v3','request_status_v1'] as const);
/** Coordinator supplies a retained cookie/Vault Review request port. This module
 * has no URL, RPC selector, bearer, credential or network fallback. Creation binds
 * the real audience, identity, cookie epochs and application boundary. */
export function createHistoryPort(runtime:ApplicationSession,request:OperationPort<HistoryCommand,unknown>):HistoryPort {
  const boundary=runtime.getSnapshot().boundary,cookie=runtime.cookie;
  const audience=cookie.audience,owner=cookie.identity?.ownerId,generation=cookie.generation,epoch=cookie._epoch;
  const current=()=>audience==='client'&&cookie.audience===audience&&cookie.identity?.role==='client'&&cookie.identity.ownerId===owner&&cookie.generation===generation&&cookie._epoch===epoch&&runtime.getSnapshot().boundary===boundary&&boundary?.isCurrent();
  return {async execute(input,options):Promise<HistoryOutcome>{
    if(!current())return {state:'rejected',status:401,code:'session_ended'};
    let command:HistoryCommand;
    try{
      const parsed=readReviewCommand(input);
      if(!(historyActions as readonly string[]).includes(parsed.action))return {state:'rejected',status:403,code:'forbidden'};
      command=parsed as HistoryCommand;
    }catch{return {state:'rejected',status:400,code:'invalid_input'};}
    const failure=(status:number,code:string)=>decodePortalReviewResponse('review',command,status,{code}) as HistoryOutcome;
    if(options?.signal?.aborted)return failure(503,'unavailable');
    try{
      const raw=await request.execute(command,options);
      if(!current())return {state:'rejected',status:401,code:'session_ended'};
      if(options?.signal?.aborted)return failure(503,'unavailable');
      return decodePortalReviewResponse('review',command,200,raw) as HistoryOutcome;
    }catch(error){
      if(!current())return {state:'rejected',status:401,code:'session_ended'};
      const e=error as {status?:number;code?:string};
      const status=typeof e?.status==='number'?e.status:503;
      const fallback:Record<number,string>={400:'invalid_input',401:'session_ended',403:'forbidden',404:'not_found',409:'revision_conflict',413:'too_large',415:'unsupported_media_type',429:'rate_limited',503:'unavailable'};
      return failure(status,e?.code??fallback[status]??'unavailable');
    }
  }};
}
