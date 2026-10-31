import {parseRoute} from '../navigation/routes.ts';
import type {PortalRoute} from '../navigation/routes.ts';
// @ts-expect-error retained synchronous callback scrubber has no declaration
import {consumeCallback} from '../../site/advisor/api.js';
export interface AuthCallback {kind:'pkce'|'token_hash'|'implicit'|null;code:string|null;error:boolean}
export interface PreparedApplication {route:PortalRoute|null;audience:'client'|'advisor'|null;callback:AuthCallback}
/** Call synchronously before any route, navigation state, cookie or React work.
 * Only the PKCE code survives in short-lived closure memory; never URL/history. */
export function prepareApplication(location:Pick<Location,'href'>,history:Pick<History,'replaceState'>):PreparedApplication {
  const consumed=consumeCallback(location,history) as AuthCallback;
  const url=new URL(location.href),route=parseRoute(url.pathname+url.search);
  const callback:AuthCallback={kind:consumed.kind,code:consumed.kind==='pkce'?consumed.code:null,error:consumed.error||consumed.kind!==null&&consumed.kind!=='pkce'};
  return {route,audience:!route||route.name==='maya'?null:route.name.startsWith('advisor-')?'advisor':'client',callback};
}
