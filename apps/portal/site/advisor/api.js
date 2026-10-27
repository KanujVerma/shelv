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
export function consumeCallback(location, history) {
  const url=new URL(location.href), hash=new URLSearchParams(url.hash.slice(1));
  let tokenHash=url.searchParams.get('token_hash'), accessToken=hash.get('access_token'),
    refreshToken=hash.get('refresh_token'), code=url.searchParams.get('code');
  const type=url.searchParams.get('type') || hash.get('type') || 'email';
  let error=Boolean(hash.get('error') || url.searchParams.get('error'));
  const secretKeys=['token_hash','type','error','error_code','error_description','code','access_token','refresh_token','expires_at','expires_in','token_type','provider_token','provider_refresh_token'];
  const hasCredential=tokenHash || accessToken || refreshToken || code || error || secretKeys.some(key=>url.searchParams.has(key));
  if(hasCredential) {
    for(const key of secretKeys)url.searchParams.delete(key);
    url.hash='';history.replaceState(null,'',url.pathname+url.search);
  }
  if([tokenHash,accessToken,code].filter(Boolean).length>1 || (accessToken?.length??0)>16384 || (refreshToken?.length??0)>8192 || (tokenHash?.length??0)>2048 || (code?.length??0)>2048) {
    error=true;tokenHash=null;accessToken=null;refreshToken=null;code=null;
  }
  const kind=code?'pkce':tokenHash?'token_hash':accessToken?'implicit':null;
  return {kind,tokenHash,accessToken,refreshToken,code,type,error};
}
