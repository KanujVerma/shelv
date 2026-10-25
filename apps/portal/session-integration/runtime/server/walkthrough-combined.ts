import {createWalkthroughGateway} from './walkthrough-gateway';
import {PORTAL_ORIGIN} from './policy';
import {demand,digest,SessionError} from './types';
import type {GatewayEnv} from './gateway';
import type {VaultCommand,VaultResult} from './protocol';
import type {WalkthroughSnapshot} from './walkthrough-contract';

async function invoke<T>(env:GatewayEnv,name:string,command:VaultCommand):Promise<T>{
 const result=await env.ADVISOR_SESSIONS.getByName(name).invoke(command) as VaultResult<T>;
 demand(result&&typeof result.ok==='boolean',503,'unavailable');
 if(!result.ok)throw new SessionError(result.error.status,result.error.code);
 return result.value;
}
export function walkthroughFetch(request:Request,env:GatewayEnv):Promise<Response>{
 return createWalkthroughGateway({origin:PORTAL_ORIGIN,
  read:async tokenDigest=>invoke<WalkthroughSnapshot>(env,`walkthrough:${tokenDigest}`,{type:'walkthrough.view',digest:tokenDigest}),
  limit:async incoming=>{
   demand(env.PORTAL_ORIGIN===PORTAL_ORIGIN&&env.ADVISOR_SESSIONS,503,'configuration_missing');
   const ip=incoming.headers.get('cf-connecting-ip');demand(ip&&ip.length<=64,503,'configuration_missing');
   const key=await digest(`${Math.floor(Date.now()/86400000)}:${ip}`);
   const result=await invoke<{allowed:boolean}>(env,`walkthrough-limit:${key}`,{type:'limit',scope:'walkthrough'});
   return result.allowed;
  },
 }).fetch(request);
}
