import type {ApplicationSession} from './session.ts';
import {clientCookieRequest} from './retained.ts';
import {TransportError,type OperationKind,type OperationPort} from '../transport/session.ts';
// @ts-expect-error retained JavaScript protocol metadata, exercised by actual factories
import {clientReviewActions,clientReviewReads,reviewErrorCodes,REVIEW_COMMAND_MAX_BYTES} from '../../site/auth/review-actions.js';

/** Raw cookie transport only. The enclosing feature must parse commands and
 * positively validate responses with the canonical Review contract. No URL,
 * owner selector, credential, server gateway or domain projection is supplied. */
export function createClientReviewRequest(runtime:ApplicationSession):OperationPort<unknown,unknown>{
 const boundary=runtime.getSnapshot().boundary;
 const current=()=>{
  if(runtime.cookie.audience!=='client'||runtime.cookie.identity?.role!=='client'||!boundary?.isCurrent()||runtime.getSnapshot().boundary!==boundary)throw new TransportError(401);
 };
 current();
 return{async execute(input,options){
  current();let command:{schemaVersion:number;action:string};
  try{
   const wire=JSON.stringify(input);
   if(typeof wire!=='string')throw new TransportError(400);
   if(new TextEncoder().encode(wire).length>REVIEW_COMMAND_MAX_BYTES)throw new TransportError(413);
   // Detach caller-owned references before the cookie's async lease acquisition.
   const value:unknown=JSON.parse(wire);
   if(!value||typeof value!=='object'||Array.isArray(value)||(value as {schemaVersion?:unknown}).schemaVersion!==1||typeof(value as {action?:unknown}).action!=='string')throw new TransportError(400);
   command=value as typeof command;
  }catch(error){if(error instanceof TransportError)throw error;throw new TransportError(400);}
  if(!(clientReviewActions as readonly string[]).includes(command.action))throw new TransportError(403);
  const kind:OperationKind=(clientReviewReads as readonly string[]).includes(command.action)?'read':'write';
  const request=clientCookieRequest('reviews',runtime.cookie);
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
