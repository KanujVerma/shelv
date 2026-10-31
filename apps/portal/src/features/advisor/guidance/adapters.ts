import type {ApplicationSession} from '../../../app/session.ts';
import {createAdvisorReviewRequest,createAdvisorGuidanceRequest} from '../../../app/advisor-review-request.ts';
import {TransportError} from '../../../transport/session.ts';
import {readReviewCommand,readGuidanceCommand} from '../../../../../../src/contracts/PortalReviewValidation.ts';
import {mapReviewResult,mapGuidanceResult} from '../../../../../../src/contracts/PortalReviewMapping.ts';
import {reviewHumanActions,guidanceHumanActions,isPortalReviewRead,reviewErrorStatuses} from '../../../../../../src/contracts/PortalReviewValues.ts';
import type {ReviewCommand,GuidanceCommand} from '../../../../../../src/contracts/PortalReview.ts';
import {guidanceDependencies} from './types.ts';
import type {AdvisorGuidanceAdapters,AdvisorReviewCommand} from './types.ts';

/** Only the two actual retained factories. No URL, fetch, credentials or RPC seam. */
export function createAdvisorGuidanceAdapters(runtime:ApplicationSession):AdvisorGuidanceAdapters {
 const boundary=runtime.getSnapshot().boundary,owner=runtime.cookie.identity?.ownerId,epoch=runtime.cookie._epoch,generation=runtime.cookie.generation,csrf=runtime.cookie._view?.csrf;
 let disposed=false;
 const current=()=>!disposed&&!!boundary&&runtime.getSnapshot().boundary===boundary&&boundary.isCurrent()&&runtime.cookie.audience==='advisor'&&runtime.cookie.identity?.role==='advisor'&&runtime.cookie.identity.ownerId===owner&&runtime.cookie._epoch===epoch&&runtime.cookie.generation===generation&&runtime.cookie._view?.csrf===csrf;
 const guard=()=>{if(!current())throw new TransportError(401);};guard();
 const review=createAdvisorReviewRequest(runtime),guidance=createAdvisorGuidanceRequest(runtime);
 function failure(error:unknown,command:ReviewCommand|GuidanceCommand):never {
  guard();const status=(error as {status?:unknown})?.status,kind=isPortalReviewRead(command)?'read':'write';
  const safe=new TransportError(typeof status==='number'&&[400,401,403,404,409,413,415,429,503].includes(status)?status:503,kind);
  const code=(error as {code?:unknown})?.code;
  if(typeof code==='string'&&Object.hasOwn(reviewErrorStatuses,code)&&reviewErrorStatuses[code as keyof typeof reviewErrorStatuses]===safe.status)Object.defineProperty(safe,'code',{value:code});
  throw safe;
 }
 return {
  review:{async execute(input:AdvisorReviewCommand,options){guard();if(!(reviewHumanActions as readonly string[]).includes(input?.action))throw new TransportError(403);let command:ReviewCommand;
   try{command=readReviewCommand(input);}catch{throw new TransportError(400);}
   try{guard();const raw=await review.execute(command,options);guard();return mapReviewResult(raw,command);}catch(error){return failure(error,command);}}},
  guidance:{async execute(input:GuidanceCommand,options){guard();if(!(guidanceHumanActions as readonly string[]).includes(input?.action))throw new TransportError(403);let command:GuidanceCommand;
   try{command=readGuidanceCommand(input);}catch{throw new TransportError(400);}
   try{guard();const raw=await guidance.execute(command,options);guard();return mapGuidanceResult(raw,command);}catch(error){return failure(error,command);}}},
  unavailable:guidanceDependencies,isCurrent:current,dispose(){disposed=true;},
 };
}
