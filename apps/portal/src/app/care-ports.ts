import type {CareCommand,CareResult} from '../../../../src/contracts/PortalCare.ts';
import {readCareCommand} from '../../../../src/contracts/PortalCareValidation.ts';
import {mapCareResult} from '../../../../src/contracts/PortalCareMapping.ts';
import {careClientActions,careAdvisorActions} from '../../../../src/contracts/PortalCareValues.ts';
import type {ApplicationSession} from './session.ts';
import {advisorCookieRequest,clientCookieRequest} from './retained.ts';
import {TransportError,type OperationPort,type OperationKind} from '../transport/session.ts';
export type ClientCareCommand=Extract<CareCommand,{action:typeof careClientActions[number]}>;
export type AdvisorCareCommand=Extract<CareCommand,{action:typeof careAdvisorActions[number]}>;
const reads=new Set<CareCommand['action']>(['read_client_plan_v2','read_advisor_publication_v2','read_reported_products_v1','read_use_history_v1','read_advisor_use_history_v1','request_status_v1']);
function carePort<C extends CareCommand>(runtime:ApplicationSession,audience:'client'|'advisor'):OperationPort<C,CareResult>{
 const boundary=runtime.getSnapshot().boundary;
 const allowed:readonly string[]=audience==='client'?careClientActions:careAdvisorActions;
 const current=(options?:{signal?:AbortSignal},kind:OperationKind='read')=>{
  if(runtime.cookie.audience!==audience||runtime.cookie.identity?.role!==audience||!boundary?.isCurrent()||runtime.getSnapshot().boundary!==boundary)throw new TransportError(401);
  if(options?.signal?.aborted)throw new TransportError(503,kind);
 };
 current();
 return{async execute(value,options){
  current();let command:CareCommand;
  try{command=readCareCommand(value);}catch{throw new TransportError(400);}
  if(!allowed.includes(command.action))throw new TransportError(403);
  const kind=reads.has(command.action)?'read':'write';current(options,kind);
  const result=await runtime.transport.bindCookieChannel<CareCommand,CareResult>(audience==='client'?clientCookieRequest:advisorCookieRequest,'care',kind,raw=>mapCareResult(raw,command)).execute(command,options);
  current(options,kind);return result;
 }};
}
/** Creation-bound ports never survive owner/session replacement. No UI activation. */
export function createClientCarePort(runtime:ApplicationSession):OperationPort<ClientCareCommand,CareResult>{return carePort(runtime,'client');}
export function createAdvisorCarePort(runtime:ApplicationSession):OperationPort<AdvisorCareCommand,CareResult>{return carePort(runtime,'advisor');}
