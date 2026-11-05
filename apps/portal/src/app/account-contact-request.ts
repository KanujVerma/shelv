import type {AccountContactCommand,AccountContactResult} from '../../../../src/contracts/PortalAccountContact.ts';
import {readAccountContactCommand} from '../../../../src/contracts/PortalAccountContactValidation.ts';
import {mapAccountContactResult} from '../../../../src/contracts/PortalAccountContactMapping.ts';
import type {ApplicationSession} from './session.ts';
import {clientCookieRequest} from './retained.ts';
import {TransportError} from '../transport/session.ts';
import type {CookieRequestFactory,OperationOptions,OperationPort} from '../transport/session.ts';

// Literal structural call bridge only. This does not register or permit a channel.
type ContactFactory=(channel:'account-contact',...args:Parameters<CookieRequestFactory> extends [unknown,...infer Rest]?Rest:never)=>ReturnType<CookieRequestFactory>;
export function createClientAccountContactRequest(runtime:ApplicationSession):OperationPort<AccountContactCommand,AccountContactResult> {
  const boundary=runtime.getSnapshot().boundary;
  function current(ready=false):void {
    if(!boundary||runtime.getSnapshot().boundary!==boundary||!boundary.isCurrent()||runtime.cookie.audience!=='client'||runtime.cookie.identity?.role!=='client')throw new TransportError(401);
    if(runtime.cookie._view?.capabilities.view!==true)throw new TransportError(403);
    if(ready&&runtime.cookie.status!=='ready')throw new TransportError(503);
  }
  return {async execute(input,options:OperationOptions={}) {
    current(true);
    const signal=options.signal,isApplicable=options.isApplicable;
    current(true);
    let command:AccountContactCommand;
    try {command=readAccountContactCommand(input);}catch {current();throw new TransportError(400);}
    const kind=command.action==='request_account_email_change_v1'?'write':'read';
    const applicable=()=>{
      current(true);
      let result=true;
      try {result=isApplicable===undefined||isApplicable()===true;}catch {result=false;}
      current(true);return result;
    };
    if(signal?.aborted||!applicable())throw new TransportError(503,kind);
    // Establish physical absence before calling the real factory. No received
    // 403, provider failure or factory error is reclassified by its text/status.
    const registry:unknown=Reflect.get(runtime.cookie,'actions');
    current(true);
    const registered=!!registry&&typeof registry==='object'&&Object.hasOwn(registry,'account-contact');
    current(true);
    if(!registered)throw new TransportError(503,kind);
    let request:ReturnType<CookieRequestFactory>;
    try{request=(clientCookieRequest as unknown as ContactFactory)('account-contact',runtime.cookie);}
    catch(error){current();throw error;}
    current(true);
    const port=runtime.transport.bind<AccountContactCommand,AccountContactResult>({kind,invoke:(value,opts)=>request(value,opts),decode:value=>{
      current(true);if(signal?.aborted||!applicable())throw new TransportError(503,kind);
      const result=mapAccountContactResult(value,command);
      current(true);return result;
    }});
    try {
      const value=await port.execute(command,{signal,isApplicable:applicable});
      current(true);if(signal?.aborted||!applicable())throw new TransportError(503,kind);
      return value;
    }catch(error){
      // Preserve genuine received denials even if local applicability changed.
      current();throw error;
    }
  }};
}
