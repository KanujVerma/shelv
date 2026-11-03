import type {Credentials} from './credentials.ts';
import type {ConciergeTransportConfiguration} from '../../../../../supabase/functions/concierge-operations/runtime.ts';
import type {AccountProfileIdentity,AccountProfileView} from '../../../../../src/contracts/PortalAccountProfile.ts';
import type {AccountContactCommand,AccountContactResult,AccountContactView} from '../../../../../src/contracts/PortalAccountContact.ts';
import {readUuid,requireValue} from '../../../../../src/contracts/ConciergePortalValidation.ts';
import {buildAccountProfileRpc,mapAccountProfileResult} from '../../../../../src/contracts/PortalAccountProfileMapping.ts';
import {accountProfileErrorStatuses,accountProfileAuthMaxBytes,accountProfileResultMaxBytes} from '../../../../../src/contracts/PortalAccountProfileValues.ts';
import {readAccountContactCommand} from '../../../../../src/contracts/PortalAccountContactValidation.ts';
import {mapAccountContactResult} from '../../../../../src/contracts/PortalAccountContactMapping.ts';
import {accountContactAuthMaxBytes,accountContactCommandMaxBytes,accountContactResultMaxBytes,accountContactOperationMilliseconds} from '../../../../../src/contracts/PortalAccountContactValues.ts';
import {AccountProfileFailure,accountProfileWait,accountProfileReceivedDenial,setAccountProfileDeadline} from '../../../../../supabase/functions/concierge-account-profile/body.ts';
import {createAccountProfilePorts} from '../../../../../supabase/functions/concierge-account-profile/runtime.ts';

export type AccountContactProvider = {
  perform(credentials:Credentials,command:AccountContactCommand,signal:AbortSignal):Promise<AccountContactResult>;
};

/** Read-only composition of the canonical authenticated profile producer.
 * No durable contact-flow producer is pinned: mutation AND original status deny.
 * This module is not a registered gateway, Vault operation or email-change flow.
 */
export function createAccountContactProvider(config:ConciergeTransportConfiguration):AccountContactProvider {
  // Guard nested wire bounds rather than silently inheriting future wider caps.
  requireValue(accountProfileAuthMaxBytes===accountContactAuthMaxBytes&&accountProfileResultMaxBytes===accountContactResultMaxBytes);
  const ports=createAccountProfilePorts(config);
  const call=buildAccountProfileRpc({schemaVersion:1,action:'read_account_profile_v1'});
  return Object.freeze({
    async perform(credentials:Credentials,input:AccountContactCommand,caller:AbortSignal):Promise<AccountContactResult> {
      // One absolute budget, before serialization, credential reads or first await.
      const deadline=Date.now()+accountContactOperationMilliseconds;
      const controller=new AbortController(),signal=controller.signal;
      const timer=setTimeout(()=>controller.abort(),accountContactOperationMilliseconds);
      const abort=()=>controller.abort();
      let result:AccountContactView|undefined,failure:AccountProfileFailure|undefined;
      let original:{token:string;owner:string;session:string;expiry:number;user:Credentials['user']}|undefined;
      const unavailable=()=>new AccountProfileFailure(503,'unavailable');
      const check=()=>{
        // Capture all mutable reads before the final signal/deadline check. Accessors
        // and observer callbacks cannot make a replacement context return success.
        if(original){
          const token=credentials.access_token,user=credentials.user,owner=user.id,session=credentials.providerSessionId,expiry=credentials.expires_at;
          if(token!==original.token||user!==original.user||owner!==original.owner||session!==original.session||expiry!==original.expiry)throw unavailable();
        }
        if(signal.aborted||caller.aborted||Date.now()>=deadline)throw unavailable();
        if(original&&original.expiry*1000<=Date.now())throw new AccountProfileFailure(401,'session_ended');
      };
      try {
        setAccountProfileDeadline(signal,deadline);
        caller.addEventListener('abort',abort,{once:true});if(caller.aborted)abort();
        let command:AccountContactCommand;
        try{command=readAccountContactCommand(input);}catch{throw new AccountProfileFailure(400,'invalid_input');}
        check();
        // No actual durable reservation/pending/status producer exists. In particular,
        // absence of that producer cannot be translated into journal not_found.
        if(command.action!=='read_account_contact_v1')throw unavailable();
        const token=credentials.access_token,user=credentials.user,owner=user.id,session=credentials.providerSessionId,expiry=credentials.expires_at;
        requireValue(typeof token==='string'&&token.length>0&&new TextEncoder().encode(token).byteLength<=accountContactCommandMaxBytes);
        readUuid(owner);readUuid(session);requireValue(Number.isSafeInteger(expiry));
        original=Object.freeze({token,owner,session,expiry,user});check();
        const authenticate=async()=>{
          check();const identity:AccountProfileIdentity=await accountProfileWait(()=>ports.authenticate(token,signal),signal);check();
          if(identity.id!==owner.toLowerCase()||identity.sessionId!==session.toLowerCase()||identity.expiresAt!==expiry||identity.is_anonymous!==false)throw new AccountProfileFailure(403,'forbidden');
          if(identity.expiresAt*1000<=Date.now())throw new AccountProfileFailure(401,'session_ended');
          check();
        };
        const readProfile=async():Promise<AccountProfileView>=>{
          check();const raw=await accountProfileWait(()=>ports.rpc(token,call,signal),signal);check();
          if(raw.error){
            if(raw.error.status===401||raw.error.status===403)throw new AccountProfileFailure(raw.error.status,raw.error.status===401?'session_ended':'forbidden');
            const code=Object.keys(accountProfileErrorStatuses).find(key=>raw.error?.message===`concierge_${key}`);
            throw new AccountProfileFailure(code?(accountProfileErrorStatuses[code]??503):503,code??'unavailable');
          }
          try{
            const mapped=mapAccountProfileResult(raw.data,call.args.p_command);requireValue('currentEmail' in mapped);check();return mapped;
          }catch(e){if(e instanceof AccountProfileFailure)throw e;throw unavailable();}
        };
        await authenticate();check();
        const first=await readProfile();check();
        // The strict profile mapper reconstructs currentEmail in state/address/verified
        // order. Pending truth is unavailable, never a guessed absence.
        const pendingEmail=Object.freeze({state:'unknown'} as const);
        const canonical=new TextEncoder().encode(JSON.stringify([1,first.currentEmail,pendingEmail]));check();
        const hash=await accountProfileWait(()=>crypto.subtle.digest('SHA-256',canonical),signal);check();
        const contactBasis=Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');
        await authenticate();check();
        const current=await readProfile();check();
        if(JSON.stringify(first)!==JSON.stringify(current))throw new AccountProfileFailure(409,'basis_conflict');
        await authenticate();check();
        const mapped=mapAccountContactResult({schemaVersion:1,contactBasis,currentEmail:current.currentEmail,pendingEmail},command);
        requireValue('currentEmail' in mapped);result=mapped;check();
      }catch(error){
        failure=error instanceof AccountProfileFailure?error:unavailable();
      }finally{
        clearTimeout(timer);
        try{caller.removeEventListener('abort',abort);}catch{failure??=unavailable();}
      }
      // Known received denial survives failing body/cleanup/local cancellation.
      // No private return is evaluated until caller cleanup and context revalidation.
      const denial=accountProfileReceivedDenial(signal);if(denial)throw denial;
      try{check();}catch(error){
        if(failure&&(failure.status===401||failure.status===403))throw failure;
        throw error instanceof AccountProfileFailure?error:unavailable();
      }
      if(failure)throw failure;
      if(!result)throw unavailable();
      return result;
    },
  });
}
