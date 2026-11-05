import type {FinalExportCommand,FinalExportResult,FinalExportRpcCall} from '../../../../src/contracts/PortalFinalExport.ts';
import {buildFinalExportRpc,mapFinalExportResult} from '../../../../src/contracts/PortalFinalExportMapping.ts';
import {detachFinalExportInput,finalExportBytes} from '../../../../src/contracts/PortalFinalExportValidation.ts';
import {finalExportCommandMaxBytes} from '../../../../src/contracts/PortalFinalExportValues.ts';
import type {ApplicationSession} from './session.ts';
import {clientCookieRequest} from './retained.ts';
import {TransportError} from '../transport/session.ts';
import type {CookieChannel,CookieSessionPort,OperationOptions,OperationPort} from '../transport/session.ts';

type PendingExportFactory=(channel:CookieChannel|'final-export',session:CookieSessionPort)=>(command:unknown,options?:OperationOptions)=>Promise<unknown>;

/** Fixed own-client READ binding. The retained factory still refuses the
 * unregistered final-export literal; this does not register or authorize it. */
export function createClientFinalExportRequest(runtime:ApplicationSession):OperationPort<FinalExportCommand,FinalExportResult>{
  const cookie=runtime.cookie,boundary=runtime.getSnapshot().boundary,owner=cookie.identity?.ownerId;
  const generation=cookie.generation,epoch=cookie._epoch,view=cookie._view,
    serverGeneration=view?.generation,csrf=view?.csrf;
  const same=()=>!!boundary&&!!owner&&runtime.cookie===cookie&&runtime.getSnapshot().boundary===boundary&&
    cookie.audience==='client'&&cookie.identity?.role==='client'&&cookie.identity.ownerId===owner&&
    cookie.generation===generation&&cookie._epoch===epoch&&cookie._view===view&&
    cookie._view?.generation===serverGeneration&&cookie._view?.csrf===csrf;
  function current(){
    if(!same())throw new TransportError(401,'read');
    const live=boundary!.isCurrent();
    if(!live||!same())throw new TransportError(401,'read');
  }
  function ready(){
    current();
    if(cookie.status!=='ready'||cookie._view!==view)throw new TransportError(503,'read');
    const caps=view?.capabilities;
    const allowed=caps?.view===true&&caps.edit===false&&caps.publish===false&&caps.confirmPayments===false;
    current();
    if(cookie.status!=='ready'||cookie._view!==view)throw new TransportError(503,'read');
    if(!allowed)throw new TransportError(403,'read');
  }
  ready();
  return Object.freeze({async execute(input:FinalExportCommand,options:OperationOptions={}){
    ready();
    let signal:AbortSignal|undefined,local:OperationOptions['isApplicable'];
    try{signal=options.signal;ready();local=options.isApplicable;ready();}
    catch{ready();throw new TransportError(503,'read');}
    const applicable=()=>{
      ready();let aborted:boolean;
      try{aborted=signal?.aborted===true;}catch{ready();return false;}
      ready();if(aborted)return false;
      let allowed=true;
      try{if(local!==undefined)allowed=typeof local==='function'&&local()===true;}catch{allowed=false;}
      ready();
      try{aborted=signal?.aborted===true;}catch{ready();return false;}
      ready();return allowed&&!aborted;
    };
    if(!applicable())throw new TransportError(503,'read');
    let detached:unknown;
    try{detached=detachFinalExportInput(input);}catch{ready();throw new TransportError(400,'read');}
    ready();let text:string;
    try{text=JSON.stringify(detached);}catch{ready();throw new TransportError(400,'read');}
    ready();
    if(finalExportBytes(text)>finalExportCommandMaxBytes)throw new TransportError(413,'read');
    let call:FinalExportRpcCall;
    try{call=buildFinalExportRpc(detached);}catch{ready();throw new TransportError(400,'read');}
    ready();
    if(call.name!=='concierge_final_export_command_v1'||
      !['read_final_export_manifest_v1','read_final_export_part_v1'].includes(call.args.p_command.action))throw new TransportError(400,'read');
    const command=call.args.p_command;
    if(!applicable())throw new TransportError(503,'read');
    let request:ReturnType<PendingExportFactory>;
    try{request=(clientCookieRequest as PendingExportFactory)('final-export',cookie);}
    catch{
      // A local unregistered-factory refusal is unavailable, not received HTTP403.
      ready();throw new TransportError(503,'read');
    }
    ready();
    const bound=runtime.transport.bind<FinalExportCommand,FinalExportResult>({kind:'read',
      invoke:(value,opts)=>request(value,opts),decode:value=>{
        if(!applicable())throw new TransportError(503,'read');
        let result:FinalExportResult;
        try{result=mapFinalExportResult(value,command);}catch{ready();throw new TransportError(503,'read');}
        if(!applicable())throw new TransportError(503,'read');return result;
      }});
    try{
      const result=await bound.execute(command,{signal,isApplicable:applicable});
      if(!applicable())throw new TransportError(503,'read');return result;
    }catch(error){
      // Same-session received denials retain priority over local relevance.
      current();throw error;
    }
  }});
}
