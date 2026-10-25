/** Explicit advisor route only; ordinary client R2 auth never consumes advisor cookies. */
export function useAdvisorCookies(config,url,pendingPreview=false){
 if(config?.advisorSharedSessions!==true||url.searchParams.get('preview')==='1')return false;
 return pendingPreview||url.searchParams.get('workspace')==='advisor'||url.searchParams.has('advisorPreview')||url.hash.startsWith('#/advisor');
}
const ended=()=>Object.assign(new Error('Your session has ended. Sign in again.'),{status:401,code:'session_ended'});
export function createAdvisorSessionBridge({Cookie,onState=()=>{},fetcher}={}){
 let disposed=false;
 const cookie=new Cookie({...(fetcher?{fetcher}:{}),onState:state=>{if(!disposed)onState(state);}});
 const guard=()=>{if(disposed)throw ended();};
 return {
  cookie,storage:Object.freeze({get durableAvailable(){return cookie.audience==='client'||cookie.audience==='advisor';},ambiguous:false}),
  get status(){return disposed?'signedout':cookie.status;},get identity(){return disposed?null:cookie.identity;},get generation(){return cookie.generation;},
  get disposed(){return disposed;},
  async accept(callback={}){guard();if(callback.error)throw ended();if(callback.kind){if(callback.kind!=='pkce'||typeof callback.code!=='string')throw ended();await cookie.complete(callback.code);}else await cookie.restore();guard();return cookie.status==='ready';},
  async sendLink(email,redirect,remember=false){guard();return cookie.sendLink(email,redirect,remember);},
  async recover(){guard();return cookie.restore();},suspend(){if(!disposed)cookie.suspend();},
  async signOut(){guard();return cookie.signOut();},dispose(){disposed=true;cookie.dispose?.();},
  requestFor(createRequest,channel){const request=createRequest(channel,cookie);return async(command,options)=>{guard();const result=await request(command,options);guard();return result;};}
 };
}
