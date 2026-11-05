import type {AccountProfileCommand, AccountProfileResult} from '../../../../src/contracts/PortalAccountProfile.ts';
import {readAccountProfileCommand} from '../../../../src/contracts/PortalAccountProfileValidation.ts';
import {mapAccountProfileResult} from '../../../../src/contracts/PortalAccountProfileMapping.ts';
import type {ApplicationSession} from './session.ts';
import {clientCookieRequest} from './retained.ts';
import type {CookieChannel, CookieSessionPort, OperationOptions, OperationPort} from '../transport/session.ts';
import {TransportError} from '../transport/session.ts';

// Literal-only pending bridge. No allowlist/registry is added here. Root owns
// registration; the retained factory refuses this channel until it is admitted.
type ProfileFactory = (channel:CookieChannel|'account-profile', session:CookieSessionPort)=>(command:unknown, options?:OperationOptions)=>Promise<unknown>;
export function createClientAccountProfileRequest(runtime:ApplicationSession): OperationPort<AccountProfileCommand,AccountProfileResult> {
  const boundary=runtime.getSnapshot().boundary;
  function current() {
    if (!boundary || runtime.getSnapshot().boundary!==boundary || !boundary.isCurrent() || runtime.cookie.audience!=='client' || runtime.cookie.identity?.role!=='client') throw new TransportError(401);
  }
  return {async execute(input, options={}) {
    current();
    let command: AccountProfileCommand;
    try { command=readAccountProfileCommand(input); } catch { throw new TransportError(400); }
    current();
    const kind=command.action==='read_account_profile_v1'?'read':'write';
    if (runtime.cookie.status!=='ready') throw new TransportError(503,kind);
    if (runtime.cookie._view?.capabilities.view!==true) throw new TransportError(403,kind);
    const fingerprint=()=>JSON.stringify([runtime.cookie.identity,runtime.cookie.generation,runtime.cookie._epoch,runtime.cookie._view]);
    const original=fingerprint();
    const applicable=()=>{
      current();
      if (runtime.cookie.status!=='ready' || fingerprint()!==original || runtime.cookie._view?.capabilities.view!==true || options.signal?.aborted) return false;
      let allowed=false;
      try { allowed=options.isApplicable===undefined || options.isApplicable()===true; } catch { /* Deny-only relevance. */ }
      current();
      return allowed && runtime.cookie.status==='ready' && fingerprint()===original && runtime.cookie._view?.capabilities.view===true && !options.signal?.aborted;
    };
    let request: ReturnType<ProfileFactory>;
    try { request=(clientCookieRequest as ProfileFactory)('account-profile',runtime.cookie); }
    catch { current(); throw new TransportError(503,kind); }
    const port=runtime.transport.bind<AccountProfileCommand,AccountProfileResult>({kind,
      invoke:(value,opts)=>request(value,opts),decode:value=>{
        if (!applicable()) throw new TransportError(503,kind);
        try { return mapAccountProfileResult(value,command); } catch { throw new TransportError(503,kind); }
      }});
    try {
      const value=await port.execute(command,{...options,isApplicable:applicable});
      current();if (!applicable()) throw new TransportError(503,kind);
      return value;
    } catch(error) { current(); throw error; }
  }};
}
