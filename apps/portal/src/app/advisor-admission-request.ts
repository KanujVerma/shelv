import type {ApplicationSession} from './session.ts';
import {advisorCookieRequest} from './retained.ts';
// @ts-ignore Actual retained JavaScript error class; no declaration in the frontend graph.
import {CookieSessionError} from '../../site/auth/advisor-cookie-session.js';
import {TransportError} from '../transport/session.ts';
import type {OperationKind,OperationOptions,OperationPort} from '../transport/session.ts';
import {parseAdmissionCommand,mapAdmissionReceipt} from '../../../../src/contracts/ConciergeAdmission.ts';
import type {AdmissionCommand,AdmissionReceipt} from '../../../../src/contracts/ConciergeAdmission.ts';
import {exactKeys,readObject,readUuid} from '../../../../src/contracts/ConciergePortalValidation.ts';

const errorStatuses:Readonly<Record<string,number>>=Object.freeze({
 invalid_input:400,too_large:413,concierge_admission_forbidden:403,
 concierge_admission_session_ended:401,concierge_admission_conflict:409,
 concierge_admission_not_found:404,concierge_admission_pending:503,
});
function receipt(value:unknown,requestId:string):AdmissionReceipt{
 const raw=readObject(value);exactKeys(raw,['requestId','status','clientId','displayName','email','emailSent','portalUrl']);
 const result=mapAdmissionReceipt(raw);
 if(result.requestId.toLowerCase()!==requestId.toLowerCase())throw Error('unavailable');
 return result;
}
function statusResult(value:unknown,command:Extract<AdmissionCommand,{action:'admission_status'}>){
 const raw=readObject(value);exactKeys(raw,['requestId','status','client']);
 const requestId=readUuid(raw.requestId).toLowerCase();if(requestId!==command.requestId)throw Error('unavailable');
 if(raw.status==='pending'&&raw.client===null)return{requestId,status:'pending' as const,client:null};
 if(raw.status!=='ready'||raw.client===null)throw Error('unavailable');
 return{requestId,status:'ready' as const,client:receipt(raw.client,command.requestId)};
}

/** Existing fixed advisor admission channel only. The actual backend capability
 * and identity operation remain authoritative; local relevance can only deny. */
export function createAdvisorAdmissionPorts(runtime:ApplicationSession){
 const cookie=runtime.cookie,boundary=runtime.getSnapshot().boundary,actor=cookie.identity?.ownerId;
 const epoch=cookie._epoch,generation=cookie.generation,serverGeneration=cookie._view?.generation,csrf=cookie._view?.csrf;
 const same=()=>!!boundary&&!!actor&&runtime.getSnapshot().boundary===boundary&&cookie.audience==='advisor'&&
  cookie.identity?.role==='advisor'&&cookie.identity.ownerId===actor&&cookie._epoch===epoch&&cookie.generation===generation&&
  cookie._view?.generation===serverGeneration&&cookie._view?.csrf===csrf;
 function current(){if(!same())throw new TransportError(401);const valid=boundary!.isCurrent();if(!valid||!same())throw new TransportError(401);}
 function port<I extends AdmissionCommand,O>(action:I['action'],kind:OperationKind,decode:(value:unknown,command:I)=>O):OperationPort<I,O>{
  return Object.freeze({async execute(input:I,options:OperationOptions={}){
   current();const view=cookie._view;
   const ready=()=>{current();if(cookie.status!=='ready'||cookie._view!==view)throw new TransportError(503,kind);if(view?.capabilities.view!==true)throw new TransportError(403,kind);};
   ready();let command:I;
   try{
    const detached=structuredClone(input);ready();const wire=JSON.stringify(detached);ready();
    if(typeof wire!=='string')throw Error('invalid_input');if(new TextEncoder().encode(wire).byteLength>4096)throw new TransportError(413,kind);
    const parsed=parseAdmissionCommand(detached);if(parsed.action!==action)throw new TransportError(400,kind);command=parsed as I;
   }catch(error){ready();throw error instanceof TransportError?error:new TransportError(400,kind);}
   let signal:AbortSignal|undefined,local:OperationOptions['isApplicable'];
   try{signal=options.signal;ready();local=options.isApplicable;ready();}catch{ready();throw new TransportError(503,kind);}
   const applicable=()=>{
    ready();const before=signal?.aborted===true;ready();if(before)return false;
    let allowed=true;try{if(local!==undefined)allowed=local()===true;}catch{allowed=false;}
    ready();const aborted=signal?.aborted===true;ready();return allowed&&!aborted;
   };
   if(!applicable())throw new TransportError(503,kind);
   const request=advisorCookieRequest('admission',cookie);
   let received:{status:number;code:string}|null=null;
   const bound=runtime.transport.bind<I,O>({kind,invoke:async(value,opts)=>{
    try{return await request(value,opts);}
    catch(error){
     const e=error as {status?:unknown;code?:unknown};
     if(error instanceof CookieSessionError&&typeof e.status==='number'&&typeof e.code==='string'&&errorStatuses[e.code]===e.status)received={status:e.status,code:e.code};
     throw error;
    }
   },decode:value=>{
    if(!applicable())throw new TransportError(503,kind);let mapped:O;
    try{mapped=decode(value,command);}catch{ready();throw new TransportError(503,kind);}
    if(!applicable())throw new TransportError(503,kind);return mapped;
   }});
   try{const result=await bound.execute(command,{signal,isApplicable:applicable});if(!applicable())throw new TransportError(503,kind);return result;}
   catch(error){
    current();
    // A business code is retained only from this actual fixed SDK invocation,
    // with its exact status and still-current READY view. Local errors cannot
    // manufacture the definitive conflict/not-found recovery pair.
    const known=received as {status:number;code:string}|null;
    if(known&&error instanceof TransportError&&error.status===known.status&&cookie.status==='ready'&&cookie._view===view&&same())Object.defineProperty(error,'code',{value:known.code});
    throw error;
   }
  }});
 }
 return Object.freeze({
  capabilities:port<Extract<AdmissionCommand,{action:'capabilities'}>,{canAddClient:boolean}>('capabilities','read',value=>{
   const raw=readObject(value);exactKeys(raw,['canAddClient']);if(typeof raw.canAddClient!=='boolean')throw Error('unavailable');return{canAddClient:raw.canAddClient};
  }),
  add:port<Extract<AdmissionCommand,{action:'add_client'}>,AdmissionReceipt>('add_client','write',(value,command)=>{
   const result=receipt(value,command.requestId);
   if(result.email!==command.email||result.status==='admitted'&&result.displayName!==command.displayName)throw Error('unavailable');return result;
  }),
  status:port<Extract<AdmissionCommand,{action:'admission_status'}>,ReturnType<typeof statusResult>>('admission_status','read',statusResult),
 });
}
