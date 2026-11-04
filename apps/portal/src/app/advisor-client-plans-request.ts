import type {ApplicationSession} from './session.ts';
import {advisorCookieRequest} from './retained.ts';
import {TransportError} from '../transport/session.ts';
import type {OperationPort} from '../transport/session.ts';
import type {PlanDirectory} from '../../../../src/contracts/PortalRebuildMapping.ts';
import {mapPlanResult} from '../../../../src/contracts/PortalRebuildMapping.ts';
import {readPlanCommand,planCommandFields} from '../../../../src/contracts/PortalRebuildValidation.ts';
import {readReviewShape,reviewJsonBytes} from '../../../../src/contracts/PortalReviewValidation.ts';
import {readUuid} from '../../../../src/contracts/ConciergePortalValidation.ts';

type PageInput={cursor:string|null;limit:number};
/** Fixed client context, canonical metadata only. ClientId selects the requested
 * record; the actual human session and server remain the permission boundary. */
export function createAdvisorClientPlansRequest(runtime:ApplicationSession,clientId:string):OperationPort<PageInput,PlanDirectory>{
 const selectedClient=readUuid(clientId).toLowerCase(),boundary=runtime.getSnapshot().boundary,cookie=runtime.cookie,
  actor=cookie.identity?.ownerId;
 function current(){if(!boundary||!actor||runtime.getSnapshot().boundary!==boundary||!boundary.isCurrent()||
  runtime.getSnapshot().boundary!==boundary||cookie.audience!=='advisor'||cookie.identity?.role!=='advisor'||cookie.identity.ownerId!==actor)throw new TransportError(401);}
 return {async execute(input,options={}){
  current();const view=cookie._view,generation=cookie.generation,epoch=cookie._epoch,csrf=view?.csrf,serverGeneration=view?.generation;
  function ready(){current();if(cookie.status!=='ready'||cookie._view!==view||cookie.generation!==generation||cookie._epoch!==epoch||cookie._view?.csrf!==csrf||cookie._view?.generation!==serverGeneration)throw new TransportError(503);
   if(view?.capabilities.view!==true)throw new TransportError(403);}
  ready();let command;
  try{
   if(reviewJsonBytes(input)>8192)throw Error('invalid_input');
   const fields=planCommandFields.list_plans_v1;
   const page=readReviewShape(input,{type:'object',fields:{cursor:fields.cursor!,limit:fields.limit!}}) as PageInput;
   command=readPlanCommand({schemaVersion:1,action:'list_plans_v1',clientId:selectedClient,...page});
  }catch{ready();throw new TransportError(400);}
  ready();let signal,local;
  try{signal=options.signal;local=options.isApplicable;}catch{ready();throw new TransportError(503);}
  ready();const applicable=()=>{ready();const cancelled=signal?.aborted===true;ready();if(cancelled)return false;
   let allowed=true;try{if(local!==undefined)allowed=local()===true;}catch{allowed=false;}ready();const aborted=signal?.aborted===true;ready();return allowed&&!aborted;};
  if(!applicable())throw new TransportError(503);
  const request=advisorCookieRequest('plans',cookie);ready();
  const bound=runtime.transport.bind({kind:'read',invoke:(value,opts)=>request(value,opts),decode:raw=>{
   if(!applicable())throw new TransportError(503);
   let result:PlanDirectory;
   try{result=mapPlanResult(raw,command) as PlanDirectory;
    if(command.action!=='list_plans_v1'||result.drafts.length+result.publications.length>command.limit||
      result.nextCursor!==null&&result.nextCursor===command.cursor||
      result.drafts.some(row=>row.clientId?.toLowerCase()!==selectedClient)||result.publications.some(row=>row.clientId.toLowerCase()!==selectedClient))throw Error('unavailable');
   }catch{ready();throw new TransportError(503);}
   if(!applicable())throw new TransportError(503);return result;
  }});
  const result=await bound.execute(command,{signal,isApplicable:applicable});
  if(!applicable())throw new TransportError(503);return result;
 }};
}
