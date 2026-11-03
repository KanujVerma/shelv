import type {Credentials} from './credentials.ts';
import type {WireResponse} from './protocol.ts';
import {SessionError} from './types.ts';
import {PORTAL_ORIGIN,SUPABASE_ORIGIN} from './policy.ts';
import type {ConciergeTransportConfiguration} from '../../../../../supabase/functions/concierge-operations/runtime.ts';
import {createAccountProfilePorts} from '../../../../../supabase/functions/concierge-account-profile/runtime.ts';
import {handleAccountProfileRequest} from '../../../../../supabase/functions/concierge-account-profile/handler.ts';
import {AccountProfileFailure,accountProfileWait,accountProfileReceivedDenial,readAccountProfileJson} from '../../../../../supabase/functions/concierge-account-profile/body.ts';
import {createClientOrdersReadPorts} from '../../../../../supabase/functions/concierge-client-orders/runtime.ts';
import {handleClientOrdersReadRequest} from '../../../../../supabase/functions/concierge-client-orders/handler.ts';
import {createAccountContactProvider} from './account-contact-provider.ts';
import {readAccountContactCommand} from '../../../../../src/contracts/PortalAccountContactValidation.ts';
import {buildAccountProfileRpc,mapAccountProfileResult} from '../../../../../src/contracts/PortalAccountProfileMapping.ts';
import {buildClientOrdersReadRpc,mapClientOrdersReadResult} from '../../../../../src/contracts/PortalClientOrdersMapping.ts';
import {mapAccountContactResult} from '../../../../../src/contracts/PortalAccountContactMapping.ts';
import {exactKeys,readObject,requireValue} from '../../../../../src/contracts/ConciergePortalValidation.ts';

export type OwnAdminChannel='account-profile'|'account-contact'|'client-orders';

/** Private Worker composition, not a deployed Edge function or caller dispatcher.
 * The caller owns the original registered ten-second signal and actual context.
 */
export function createOwnAdminProvider(config:ConciergeTransportConfiguration){
  const allowedOrigins=Object.freeze([...config.allowedOrigins]),key=config.publicKey,send=config.fetch??globalThis.fetch;
  requireValue(config.supabaseUrl===SUPABASE_ORIGIN&&allowedOrigins.includes(PORTAL_ORIGIN));
  const captured=Object.freeze({supabaseUrl:SUPABASE_ORIGIN,publicKey:key,allowedOrigins,fetch:send});
  const profile=createAccountProfilePorts(captured),orders=createClientOrdersReadPorts(captured),contact=createAccountContactProvider(captured);
  const retire=(response:Response)=>{try{void response.body?.cancel().catch(()=>{});}catch{}};
  const received=(response:Response,signal:AbortSignal)=>{
    const status=response.status;
    if(status===401||status===403){const denial=accountProfileReceivedDenial(signal,status)!;retire(response);throw denial;}
    return response;
  };
  const response=async(start:()=>Promise<Response>,signal:AbortSignal)=>{
    let held:Response|undefined,retired=false;
    const cleanup=()=>{if(held&&!retired){retired=true;retire(held);}};
    try{return await accountProfileWait(()=>start().then(value=>{
      held=received(value,signal);
      // A fetch that ignores abort can arrive after the outer wait has ended.
      // Recheck the same registered lifetime at receipt and retire locally.
      return accountProfileWait(()=>Promise.resolve(value),signal).catch(error=>{cleanup();throw error;});
    }),signal);}
    catch(error){cleanup();throw error;}
  };
  const decode=async(value:Response,maximum:number,signal:AbortSignal)=>{
    try{return await readAccountProfileJson(value.body,maximum,signal);}
    catch{throw new AccountProfileFailure(503,'unavailable');}
  };
  const knownError=(value:unknown,status:number)=>{
    let code='unavailable';
    try{
      const v=readObject(value);exactKeys(v,['code']);
      const statuses:Readonly<Record<string,number>>={invalid_input:400,too_large:413,unsupported_media_type:415,revision_conflict:409,request_conflict:409,basis_conflict:409,unavailable:503};
      if(typeof v.code==='string'&&statuses[v.code]===status)code=v.code;
    }catch{}
    throw new SessionError(code==='unavailable'?503:status,code);
  };
  return Object.freeze({
    async readContext(credentials:Credentials,signal:AbortSignal):Promise<unknown>{
      const token=credentials.access_token;requireValue(typeof token==='string'&&token.length>0&&new TextEncoder().encode(token).byteLength<=8192);
      const value=await response(()=>{
        // Keep standard Fetch privacy options across DOM and Worker declarations.
        const init:RequestInit & {credentials:'omit'}={
          method:'POST',headers:{authorization:`Bearer ${token}`,apikey:key,'content-type':'application/json',origin:PORTAL_ORIGIN},
          body:'{}',signal,credentials:'omit',redirect:'manual',cache:'no-store',
        };
        return send(`${SUPABASE_ORIGIN}/rest/v1/rpc/concierge_client_session_context`,init);
      },signal);
      if(value.status!==200){retire(value);throw new AccountProfileFailure(503,'unavailable');}
      return decode(value,8192,signal);
    },
    async perform(credentials:Credentials,channel:OwnAdminChannel,input:unknown,signal:AbortSignal):Promise<WireResponse>{
      requireValue(channel==='account-profile'||channel==='account-contact'||channel==='client-orders');
      if(channel==='account-contact'){
        const command=readAccountContactCommand(input);
        // No durable email-flow/status producer exists. Never dispatch or infer absence.
        if(command.action!=='read_account_contact_v1')throw new SessionError(503,'unavailable');
        return {status:200,body:mapAccountContactResult(await contact.perform(credentials,command,signal),command)};
      }
      const command=channel==='account-profile'?buildAccountProfileRpc(input).args.p_command:buildClientOrdersReadRpc(input).args.p_command;
      const request=new Request(`${PORTAL_ORIGIN}/api/client/${channel}`,{method:'POST',headers:{origin:PORTAL_ORIGIN,authorization:`Bearer ${credentials.access_token}`,'content-type':'application/json'},body:JSON.stringify(command),signal});
      const value=await response(()=>channel==='account-profile'?handleAccountProfileRequest(request,profile):handleClientOrdersReadRequest(request,orders),signal);
      const body=await decode(value,channel==='account-profile'?16384:2000000,signal);
      if(value.status!==200)knownError(body,value.status);
      return {status:200,body:channel==='account-profile'?mapAccountProfileResult(body,buildAccountProfileRpc(command).args.p_command):mapClientOrdersReadResult(body,buildClientOrdersReadRpc(command).args.p_command)};
    },
  });
}
