import {navigationReturnTo} from './navigation-return.js';
import {clientPlanActions} from './plan-actions.js';
import {CookieAdvisorSession, CookieSessionError, createCookieRequest} from './advisor-cookie-session.js';
export function useClientCookies(config,url,pendingPreview=false){
 return config?.clientSharedSessions===true && url.searchParams.get('preview')!=='1' && !pendingPreview && url.searchParams.get('workspace')!=='advisor' && !url.searchParams.has('advisorPreview') && !url.hash.startsWith('#/advisor');
}
export class CookieClientSession extends CookieAdvisorSession {
 constructor(options={}){
  super({...options,audience:'client'});
  this.actions={operations:['client_read_v2','client_read','decide','receive','start','service_client_read','request_return'],payments:['client_read','submit_claim','confirm_shipping_address','evidence_url'],checkins:['client_read','submit_report','photo_view'],plans:clientPlanActions};
  this.logoutKey='shelv:client:signout-pending';
  try{this.logoutPending=globalThis.localStorage.getItem(this.logoutKey)==='1';this.logoutPersisted=this.logoutPending;}catch{}
  try{this.channel=new BroadcastChannel('shelv-client-cookie-events');this.channel.addEventListener('message',e=>{if(e.data?.type==='logout'){this.logoutPending=true;this.logoutIntentId=e.data.id;try{this.logoutPersisted=globalThis.localStorage.getItem(this.logoutKey)==='1';}catch{this.logoutPersisted=this._cookiePending();}this._end();}else if(e.data?.type==='logout-complete'&&e.data.id===this.logoutIntentId){this.logoutPending=false;this.logoutPersisted=false;}});}catch{}
 }
 _cookiePending(){try{return /(?:^|;\s*)__Host-shelv_client_ending=1(?:;|$)/.test(globalThis.document?.cookie??'');}catch{return false;}}
 _markCookie(ending){try{globalThis.document.cookie=`__Host-shelv_client_ending=${ending?'1':''}; Path=/; Secure; SameSite=Lax; Max-Age=${ending?2592000:0}`;}catch{}}
 _hasPendingLogout(){try{return this._cookiePending()||(this.logoutPending===true&&!this.logoutPersisted)||globalThis.localStorage.getItem(this.logoutKey)==='1';}catch{return this._cookiePending()||this.logoutPending===true;}}
 async complete(code){if(this._hasPendingLogout())await this._finishLogout();return super.complete(code);}
 async acquire(){if(this._hasPendingLogout()){this._end();throw new CookieSessionError(401);}return super.acquire();}
 async restore(){if(this._hasPendingLogout())await this._finishLogout();return super.restore();}
 async _finishLogout(){let result;try{result=await super.signOut();}catch(error){if(error.status!==401)throw error;}this.logoutPending=false;this.logoutPersisted=false;this._markCookie(false);try{globalThis.localStorage.removeItem(this.logoutKey);}catch{}this.channel?.postMessage({type:'logout-complete',id:this.logoutIntentId});return result;}
 async sendLink(email,redirect,remember=false){
  const returnTo=navigationReturnTo(redirect,'client');
  if(this._hasPendingLogout())await this._finishLogout();
  await this.prepareFlow();
  return this._fetch('auth/request',{body:{email,remember:remember===true,...(returnTo?{returnTo}:{})},csrf:this._flow.csrf});
 }
 async upgrade(){throw new CookieSessionError(403,'action_forbidden');}
 async signOut(){this.logoutPending=true;this.logoutIntentId=crypto.randomUUID();this._markCookie(true);this.logoutPersisted=this._cookiePending();try{globalThis.localStorage.setItem(this.logoutKey,'1');this.logoutPersisted=true;}catch{}this.channel?.postMessage({type:'logout',id:this.logoutIntentId});return this._finishLogout();}
 dispose(){this._end();this.channel?.close();}
}
export function createClientPhotoUpload(session){
 return async({file,angle,requestId,completionRequestId,expectedRevision},{signal}={})=>{
  const lease=await session.acquire();
  try{
   const data=await session._fetch('checkins/photos/upload',{body:file,signal,csrf:lease.csrf,headers:{'Content-Type':file.type,'x-request-id':requestId,'x-completion-request-id':completionRequestId,'x-expected-revision':String(expectedRevision),'x-photo-angle':angle}});
   if(!session.isCurrent(lease))throw new CookieSessionError(401);return data;
  }catch(error){if(!session.isCurrent(lease))throw new CookieSessionError(401);if(error.status===401)session._end();else if(error.status===503||!error.status)session.suspend();throw error;}
 };
}
export function createClientCookieRequest(channel,session){
 const json=createCookieRequest(channel,session);
 return async(command,options={})=>{
  if(!(command instanceof FormData))return json(command,options);
  if(!['payments','checkins'].includes(channel))throw new CookieSessionError(403,'action_forbidden');
  const file=command.get('file');if(!file||typeof file==='string'||file.size>5242880)throw new CookieSessionError(413,'too_large');
  const lease=await session.acquire();
  try{const data=await session._fetch(channel,{body:command,signal:options.signal,csrf:lease.csrf});if(!session.isCurrent(lease))throw new CookieSessionError(401);return data;}
  catch(error){if(!session.isCurrent(lease))throw new CookieSessionError(401);if(error.status===401)session._end();else if(error.status===503)session.suspend();throw error;}
 };
}
