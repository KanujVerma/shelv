import {createConciergeAuthenticatedPorts} from '../concierge-operations/runtime.ts';
import type {ConciergeTransportConfiguration} from '../concierge-operations/runtime.ts';
import type {FinalExportRpcCall} from '../../../src/contracts/PortalFinalExport.ts';
import type {FinalExportPorts} from './handler.ts';
import {finalExportPartMaxBytes} from '../../../src/contracts/PortalFinalExportValues.ts';
import {readFinalExportBytes} from './body.ts';

/** Retain actual Auth/bearer/origin/timeout behavior; only one fixed RPC, with bounded upstream bytes. */
export function createFinalExportPorts(config:ConciergeTransportConfiguration):FinalExportPorts{
 const send=config.fetch??globalThis.fetch;
 const bounded:typeof fetch=async(input,init)=>{
  const response=await send(input,init);
  if(response.body===null)return response;
  const bytes=await readFinalExportBytes(response.body,finalExportPartMaxBytes);
  return new Response(bytes,{status:response.status,statusText:response.statusText,headers:response.headers});
 };
 return createConciergeAuthenticatedPorts<FinalExportRpcCall>({...config,fetch:bounded,allowedRpcNames:['concierge_final_export_command_v1']});
}
