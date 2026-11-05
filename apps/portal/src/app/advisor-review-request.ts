import type {ApplicationSession} from './session.ts';
import {advisorCookieRequest} from './retained.ts';
import {TransportError,type OperationKind,type OperationPort,type OperationOptions} from '../transport/session.ts';
// @ts-expect-error retained JavaScript protocol metadata, parity-tested against Root
import {advisorReviewActions,advisorReviewReads,advisorGuidanceActions,advisorGuidanceReads,reviewErrorCodes,REVIEW_COMMAND_MAX_BYTES} from '../../site/auth/review-actions.js';

/** Raw retained cookie transport. Positive Root domain adapters own command and
 * response schemas; this seam supplies no URL, credential, owner or fetch port. */
function createAdvisorRequest(runtime:ApplicationSession,channel:'reviews'|'guidance',actions:readonly string[],reads:readonly string[]):OperationPort<unknown,unknown>{
 const boundary=runtime.getSnapshot().boundary;
 const current=()=>{
  if(runtime.cookie.audience!=='advisor'||runtime.cookie.identity?.role!=='advisor'||!boundary?.isCurrent()||runtime.getSnapshot().boundary!==boundary)throw new TransportError(401);
 };
 current();
 return{async execute(input:unknown,options?:OperationOptions){
  current();let command:{schemaVersion:number;action:string};
  try{
   const wire=JSON.stringify(input);
   if(typeof wire!=='string')throw new TransportError(400);
   if(new TextEncoder().encode(wire).length>REVIEW_COMMAND_MAX_BYTES)throw new TransportError(413);
   // Capture caller-owned wire before either retained async lease acquisition.
   const value:unknown=JSON.parse(wire);
   if(!value||typeof value!=='object'||Array.isArray(value)||(value as {schemaVersion?:unknown}).schemaVersion!==1||typeof(value as {action?:unknown}).action!=='string')throw new TransportError(400);
   command=value as typeof command;
  }catch(error){if(error instanceof TransportError)throw error;throw new TransportError(400);}
  if(!actions.includes(command.action))throw new TransportError(403);
  const kind:OperationKind=reads.includes(command.action)?'read':'write';
  const request=advisorCookieRequest(channel,runtime.cookie);
  let upstreamCode:string|undefined,upstreamStatus:number|undefined;
  try{
   const value=await runtime.transport.bind<typeof command,unknown>({kind,decode:value=>value,invoke:async(value,opts)=>{
    try{return await request(value,opts);}catch(error){
     const e=error as {code?:unknown;status?:unknown};
     if(typeof e?.code==='string'&&(reviewErrorCodes as readonly string[]).includes(e.code)&&typeof e.status==='number'){upstreamCode=e.code;upstreamStatus=e.status;}
     throw error;
    }
   }}).execute(command,options);
   current();return value;
  }catch(error){
   current();
   if(error instanceof TransportError&&upstreamCode&&error.status===upstreamStatus)Object.defineProperty(error,'code',{value:upstreamCode});
   throw error;
  }
 }};
}
export function createAdvisorReviewRequest(runtime:ApplicationSession):OperationPort<unknown,unknown>{
 return createAdvisorRequest(runtime,'reviews',advisorReviewActions,advisorReviewReads);
}
export function createAdvisorGuidanceRequest(runtime:ApplicationSession):OperationPort<unknown,unknown>{
 return createAdvisorRequest(runtime,'guidance',advisorGuidanceActions,advisorGuidanceReads);
}
