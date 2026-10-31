const messages = {401:'Your session has ended. Sign in again.',403:'You do not have access to this action.',404:'This record is no longer available.',409:'This record changed. Your edits are preserved; review the latest version before saving again.',413:'This file or request is too large.',429:'Please wait before trying again.'};
export class PortalError extends Error {
  constructor(status,code='unavailable') { super(messages[status] || (status === 400 ? 'Check the form and try again.' : 'We could not connect. Try again.')); this.status=status; this.code=/^[a-z0-9_]{1,80}$/.test(code) ? code : 'unavailable'; }
}
export function readConfig(raw) {
  if (!raw?.authUrl || !raw?.publishableKey || !raw?.operationsUrl) return {enabled:false};
  const clean = key => {
    if (!raw[key]) return null;
    const url = new URL(raw[key]);
    if (url.username || url.password) throw new Error('Configuration URLs cannot contain credentials.');
    if (url.protocol !== 'https:') throw new Error('Configuration endpoints must use HTTPS.');
    if (url.search || url.hash) throw new Error('Configuration endpoints must not contain query strings.');
    return url.href.replace(/\/$/,'');
  };
  if (typeof raw.publishableKey !== 'string' || raw.publishableKey.startsWith('sb_secret_')) throw new Error('Use a public publishable key only.');
  return {enabled:true,authUrl:clean('authUrl'),publishableKey:raw.publishableKey,operationsUrl:clean('operationsUrl'),paymentsUrl:clean('paymentsUrl'),checkinsUrl:clean('checkinsUrl')};
}
export function createRequest(endpoint, access, fetcher = fetch, publicKey = null) {
  return async (command, {signal} = {}) => {
    if (!endpoint) throw new Error('This portal still needs its service connection.');
    const lease = await access.acquire(); const token = lease?.token;
    if (!token) throw new PortalError(401);
    const multipart=typeof FormData!=='undefined' && command instanceof FormData;
    const body=multipart?command:JSON.stringify(command);
    if(!multipart&&new TextEncoder().encode(body).length>100000)throw new PortalError(413,'request_too_large');
    let response;
    try {
      response=await fetcher(endpoint,{method:'POST',headers:{...(!multipart?{'Content-Type':'application/json'}:{}),Authorization:`Bearer ${token}`,...(publicKey?{apikey:publicKey}:{})},body,signal,cache:'no-store',credentials:'omit',redirect:'error'});
    } catch(error) { if(error.name==='AbortError') throw error; access.suspend?.(); throw new PortalError(503); }
    if(!access.isCurrent(lease))throw new PortalError(401);
    if(response.status===401){await access.reject(lease);throw new PortalError(401);}
    let data;try { data=await response.json(); } catch { throw new PortalError(503); }
    if(!access.isCurrent(lease))throw new PortalError(401);
    if (!response.ok) throw new PortalError(response.status,data?.code);
    return data;
  };
}
export function createPhotoUpload(endpoint,access,fetcher=fetch,publicKey=null) {
  return async ({file,angle,requestId,completionRequestId,expectedRevision},{signal}={})=>{
    if(!endpoint)throw new Error('Check-ins still needs its service connection.');
    const lease=await access.acquire(),token=lease?.token;if(!token)throw new PortalError(401);
    let response;
    try {response=await fetcher(`${endpoint.replace(/\/$/,'')}/upload`,{method:'POST',headers:{Authorization:`Bearer ${token}`,...(publicKey?{apikey:publicKey}:{}),'Content-Type':file.type,'x-request-id':requestId,'x-completion-request-id':completionRequestId,'x-expected-revision':String(expectedRevision),'x-photo-angle':angle},body:file,signal,cache:'no-store',credentials:'omit',redirect:'error'});}
    catch(error){if(error.name==='AbortError')throw error;access.suspend?.();throw new PortalError(503);}
    if(!access.isCurrent(lease))throw new PortalError(401);
    if(response.status===401){await access.reject(lease);throw new PortalError(401);}
    let result;try{result=await response.json();}catch{throw new PortalError(503);}
    if(!access.isCurrent(lease))throw new PortalError(401);
    if(!response.ok)throw new PortalError(response.status,result?.code);return result;
  };
}
import {portalReturnPath} from '../auth/navigation-return.js';
import {parseRoute} from '../auth/portal-routes.js';
import {parsePreviewTarget} from '../preview/target.js';
export function consumeCallback(location, history) {
  const url=new URL(location.href), query=new URLSearchParams(url.search), hash=new URLSearchParams(url.hash.slice(1));
  const keys=['token_hash','type','error','error_code','error_description','code','access_token','refresh_token','expires_at','expires_in','token_type','provider_token','provider_refresh_token'];
  const empty={kind:null,tokenHash:null,accessToken:null,refreshToken:null,code:null,type:'email',error:false};
  const present=keys.filter(key=>query.has(key)||hash.has(key));
  if(!present.length)return empty;

  // Scrub before returning anything to auth, routing or rendering. Only an
  // existing validated navigation grammar may survive a callback URL.
  for(const key of keys)url.searchParams.delete(key);
  url.hash='';
  let navigationValid=false;
  const path=url.pathname+url.search;
  for(const audience of ['client','advisor']) {
    try {portalReturnPath(path,audience);navigationValid=true;} catch {}
  }
  if(parseRoute(path)?.name==='maya')navigationValid=true;
  if(url.pathname==='/'&&url.searchParams.has('advisorPreview')) {
    try {
      const allowed=['advisorPreview','clientId','revision','sample','signin'];
      navigationValid=[...url.searchParams.keys()].every(key=>allowed.includes(key)&&url.searchParams.getAll(key).length===1)
        &&(!url.searchParams.has('signin')||url.searchParams.get('signin')==='1')&&!!parsePreviewTarget(url.search);
    } catch {navigationValid=false;}
  }
  if(!navigationValid)url.search='';
  history.replaceState(null,'',url.pathname+url.search);

  const invalid=()=>({...empty,error:true});
  if(!navigationValid||present.some(key=>query.getAll(key).length+hash.getAll(key).length!==1))return invalid();
  const value=key=>query.get(key)??hash.get(key);
  if(present.some(key=>!value(key)||value(key).trim()!==value(key)))return invalid();
  if(['error','error_code','error_description'].some(key=>present.includes(key)))return invalid();
  const type=value('type')??'email';
  if(!['email','signup','invite','magiclink','recovery','email_change'].includes(type))return invalid();
  const code=query.get('code'),tokenHash=query.get('token_hash'),accessToken=hash.get('access_token'),refreshToken=hash.get('refresh_token');
  if([code,tokenHash,accessToken].filter(Boolean).length!==1)return invalid();
  const kind=code?'pkce':tokenHash?'token_hash':'implicit';
  const allowed=kind==='pkce'?['code','type']:kind==='token_hash'?['token_hash','type']:['access_token','refresh_token','expires_at','expires_in','token_type','type','provider_token','provider_refresh_token'];
  if(present.some(key=>!allowed.includes(key)))return invalid();
  if(hash.has('code')||hash.has('token_hash')||query.has('access_token')||query.has('refresh_token'))return invalid();
  if(kind==='implicit'&&present.some(key=>key!=='type'&&query.has(key)))return invalid();
  const limits={code:2048,token_hash:2048,access_token:16384,refresh_token:8192,provider_token:16384,provider_refresh_token:8192};
  if(Object.entries(limits).some(([key,max])=>(value(key)?.length??0)>max))return invalid();
  if(['expires_at','expires_in'].some(key=>present.includes(key)&&(!/^[0-9]{1,16}$/.test(value(key))||!Number.isSafeInteger(Number(value(key)))||Number(value(key))<=0)))return invalid();
  if(present.includes('token_type')&&value('token_type')!=='bearer')return invalid();
  return {kind,tokenHash,accessToken,refreshToken,code,type,error:false};
}
