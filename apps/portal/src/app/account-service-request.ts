import type {ClientServiceCommand,ClientServiceResult} from '../../../../src/contracts/PortalClientService.ts';
import {readClientServiceCommand} from '../../../../src/contracts/PortalClientServiceValidation.ts';
import {mapClientServiceResult} from '../../../../src/contracts/PortalClientServiceMapping.ts';
import type {ApplicationSession} from './session.ts';
import {clientCookieRequest} from './retained.ts';
import type {CookieChannel,CookieSessionPort,OperationOptions,OperationPort} from '../transport/session.ts';
import {TransportError} from '../transport/session.ts';

type ServiceFactory=(channel:CookieChannel|'account-service',session:CookieSessionPort)=>(command:unknown,options?:OperationOptions)=>Promise<unknown>;
/** Fixed pending binding only. Parent owns allowlists, byte budgets and registration. */
export function createClientAccountServiceRequest(runtime:ApplicationSession):OperationPort<ClientServiceCommand,ClientServiceResult> {
  const boundary=runtime.getSnapshot().boundary;
  function current(){
    if(!boundary||runtime.getSnapshot().boundary!==boundary||!boundary.isCurrent()||runtime.getSnapshot().boundary!==boundary||
      runtime.cookie.audience!=='client'||runtime.cookie.identity?.role!=='client')throw new TransportError(401);
  }
  return {async execute(input,options={}){
    current();let command:ClientServiceCommand;
    try{command=readClientServiceCommand(input);}catch{throw new TransportError(400);}
    const kind=command.action==='cancel_client_service_period_end_v1'?'write':'read';
    current();
    if(runtime.cookie.status!=='ready')throw new TransportError(503,kind);
    if(runtime.cookie._view?.capabilities.view!==true)throw new TransportError(403,kind);
    const fingerprint=()=>JSON.stringify([runtime.cookie.identity,runtime.cookie.generation,runtime.cookie._epoch,runtime.cookie._view]);
    const original=fingerprint();
    const applicable=()=>{
      current();if(runtime.cookie.status!=='ready'||fingerprint()!==original||runtime.cookie._view?.capabilities.view!==true||options.signal?.aborted)return false;
      let allowed=false;
      try{allowed=options.isApplicable===undefined||options.isApplicable()===true;}catch{/* Deny-only local relevance. */}
      current();return allowed&&runtime.cookie.status==='ready'&&fingerprint()===original&&runtime.cookie._view?.capabilities.view===true&&!options.signal?.aborted;
    };
    let request:ReturnType<ServiceFactory>;
    try{request=(clientCookieRequest as ServiceFactory)('account-service',runtime.cookie);}
    catch{current();throw new TransportError(503,kind);}
    const port=runtime.transport.bind<ClientServiceCommand,ClientServiceResult>({kind,
      invoke:(value,opts)=>request(value,opts),decode:value=>{
        if(!applicable())throw new TransportError(503,kind);
        try{return mapClientServiceResult(value,command);}catch{throw new TransportError(503,kind);}
      }});
    try{
      const result=await port.execute(command,{...options,isApplicable:applicable});
      current();if(!applicable())throw new TransportError(503,kind);return result;
    }catch(error){
      // Preserve a genuine received denial. Currentness can only remove access.
      current();throw error;
    }
  }};
}
