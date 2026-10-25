import {createCheckinDraftState} from './features/checkins/draft-state.js';
import {useAdvisorCookies,createAdvisorSessionBridge} from './auth/advisor-session-bridge.js';
import {useClientCookies} from './auth/client-cookie-session.js';
import {readConfig,createRequest,createPhotoUpload,consumeCallback} from './advisor/api.js';
import {PortalSession} from './auth/session.js';
import {esc} from './advisor/model.js';
import {parsePreviewTarget,previewHref,createPreviewTargetStore} from './preview/target.js';

const callback=consumeCallback(window.location,window.history);
const root=document.querySelector('#portal-root'),params=new URLSearchParams(location.search),preview=params.get('preview')==='1';
let cleanup=null,routeSequence=0,session=null,requests=null,config={enabled:false},previewClientId=null,previewControl=null,advisorPreviewContext=false;
let sessionMode='r2';
let bootstrapped=false,mountedGeneration=null,suspendedDialogs=[],recovering=null;
let clientDraftScope=null,clientDraftOwner=null,clientDraftGeneration=null;
function releaseClientDraft(){clientDraftScope?.dispose();clientDraftScope=null;clientDraftOwner=null;clientDraftGeneration=null;}
function clientDraftForSession(){
 const owner=session?.identity?.ownerId,generation=session?.generation;
 if(!owner||session?.status!=='ready'){releaseClientDraft();return null;}
 if(!clientDraftScope||clientDraftOwner!==owner||clientDraftGeneration!==generation){releaseClientDraft();clientDraftScope=createCheckinDraftState();clientDraftOwner=owner;clientDraftGeneration=generation;}
 return clientDraftScope;
}
const authStatus=document.createElement('div');authStatus.id='portal-auth-status';authStatus.hidden=true;document.body.append(authStatus);
const previewAdapters=new Map(),previewStores=new Map();
let advisorTarget=null,previewTargetError=null;
let targetStorage=null;try{targetStorage=window.sessionStorage;}catch{}
const previewTargetStore=createPreviewTargetStore(targetStorage);
try {
  const explicit=parsePreviewTarget(location.search);
  const returning=Boolean(callback.kind||callback.error);
  if(!explicit&&!returning&&!preview)previewTargetStore.clear();
  advisorTarget=explicit||(returning?previewTargetStore.get({strict:true}):null);
  if(advisorTarget&&preview)throw new Error('invalid_preview_target');
  if(advisorTarget){previewTargetStore.put(advisorTarget);if(!explicit)history.replaceState(null,'',previewHref(advisorTarget,location.origin+location.pathname));}
}catch(error){previewTargetStore.clear();previewTargetError=error;}


const advisorGuidance=()=>sessionMode==='cookie'?'Open the email link in this browser. Your advisor tabs reconnect automatically.':previewSignInGuidance;
const previewSignInGuidance='Open the email link in this preview tab. Copy the link from your email and paste it into this tab’s address bar. If it opens another tab, return here and request a new link, then paste that new link into this preview tab.';

function login(message='') {
  ++routeSequence;
  cleanup?.();cleanup=null;
  restoreVisibility(false);
  root.innerHTML=`<main class="advisor-login-shell"><a href="./" class="wordmark">shelv<span>concierge</span></a><section class="advisor-login-card"><h1>Your plan, together.</h1><p>Sign in with the email address on your invitation. We’ll send you a private sign-in link.</p>${advisorTarget?`<p id="preview-signin-guidance">${esc(advisorGuidance())}</p>`:''}${sessionMode==='client-cookie'?'<a class="quiet" href="?workspace=advisor#/advisor">Advisor sign-in</a>':''}<form id="email-login"><label for="login-email">Email address</label><input id="login-email" type="email" autocomplete="email" required placeholder="you@example.com" ${!config.enabled?'disabled':''}><label class="portal-remember"><input id="remember-device" type="checkbox" ${!config.enabled||!session?.storage.durableAvailable?'disabled':''}><span>Remember me</span></label><button class="solid" ${!config.enabled?'disabled':''}>Send sign-in link</button></form><p id="login-status" class="advisor-login-status" role="status">${esc(message||(!config.enabled?'This portal is being connected. Your invitation will work once setup is complete.':''))}</p>${sessionMode==='client-cookie'?'<a class="quiet" href="https://derive-beta-site.vercel.app/support" target="_blank" rel="noopener noreferrer">Get help with your invitation</a>':''}</section></main>`;
  root.querySelector('#email-login').onsubmit=async event=>{
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('button'),input=form.querySelector('#login-email');button.disabled=true;
    root.querySelector('#login-status').textContent='Requesting your sign-in link…';
    if(advisorTarget)previewTargetStore.put(advisorTarget);
    try {await session.sendLink(input.value.trim(),`${location.origin}${location.pathname}${advisorTarget||params.get('workspace')==='advisor'||location.hash.startsWith('#/advisor')?'?workspace=advisor':''}`,form.querySelector('#remember-device').checked);root.querySelector('#login-status').textContent='If this email has been invited, a sign-in link is on its way. '+(advisorTarget?advisorGuidance():'Open it in this browser to continue.');input.value='';}
    catch {root.querySelector('#login-status').textContent='We could not request a link. Wait a moment and try again.';}
    finally {button.disabled=false;}
  };
}

function restoreVisibility(reopen=true) {
  if(!preview){
    const banner=document.querySelector('#preview-banner');
    banner.hidden=!(sessionMode==='r2'&&session?.status==='ready'&&callback.kind&&!advisorTarget&&!previewTargetError);
    if(!banner.hidden){banner.setAttribute('role','status');banner.textContent='If you requested this sign-in for a preview, return to the original preview tab. Request a new link there and paste the new link into that same tab’s address bar. A link already used here cannot sign in the preview tab.';}
  }
  authStatus.hidden=true;authStatus.replaceChildren();root.hidden=false;root.inert=false;
  for(const dialog of suspendedDialogs){if(!dialog.isConnected)continue;dialog.hidden=false;if(reopen&&!dialog.open)try{dialog.showModal();}catch{}}
  suspendedDialogs=[];
}
function suspendPrivate() {
  if(!preview)document.querySelector('#preview-banner').hidden=true;
  root.hidden=true;root.inert=true;
  suspendedDialogs=[...new Set([...suspendedDialogs,...document.querySelectorAll('dialog[open]')])];
  for(const dialog of suspendedDialogs){if(dialog.open)dialog.close();dialog.hidden=true;}
  authStatus.hidden=false;
  authStatus.innerHTML='<main class="advisor-login-shell"><section class="advisor-login-card"><h1>Reconnect to your private workspace</h1><p>Your session is kept on this device while we verify your connection and access. Private content stays hidden until verification succeeds.</p><button id="auth-reconnect" class="solid">Reconnect</button><button id="auth-recovery-signout" class="quiet">Sign out</button><p id="auth-recovery-status" role="status"></p></section></main>';
  authStatus.querySelector('#auth-reconnect').onclick=()=>recoverConnection();
  authStatus.querySelector('#auth-recovery-signout').onclick=()=>session.signOut();
}
async function recoverConnection() {
  if(recovering||!session)return recovering;
  const button=authStatus.querySelector('#auth-reconnect');if(button)button.disabled=true;
  recovering=session.recover().catch(()=>{const status=authStatus.querySelector('#auth-recovery-status');if(status)status.textContent='We could not verify access yet. Check your connection and try again.';}).finally(()=>{recovering=null;const button=authStatus.querySelector('#auth-reconnect');if(button)button.disabled=false;});
  return recovering;
}
function authChanged(state) {
  if(!bootstrapped)return;
  if(state.status==='offline'){suspendPrivate();return;}
  if(state.status==='signedout'){releaseClientDraft();mountedGeneration=null;login();return;}
  if(state.status==='checking'){
    if(mountedGeneration!==null&&mountedGeneration!==state.generation){++routeSequence;cleanup?.();cleanup=null;restoreVisibility(false);root.innerHTML='<div class="advisor-loading" role="status">Verifying your workspace…</div>';}
    return;
  }
  if(state.status==='ready'){
    if(mountedGeneration!==state.generation){mountedGeneration=state.generation;restoreVisibility(false);void route();}
    else if(advisorTarget){restoreVisibility(false);void route();}
    else restoreVisibility();
  }
}

async function featureRequestFor(kind,options,source=requests) {
  let featureRequest=source[kind];
  if(preview){
    options={...options,productLabels:{...previewControl?.productLabels,...options.productLabels}};
    const storeKey=`${kind}:${options.clientId||previewClientId}`,adapterKey=`${storeKey}:${options.mode}`;
    if(kind==='payments'){
      const fixture=await import('./features/payments/fixtures.js');if(!previewStores.has(storeKey))previewStores.set(storeKey,fixture.createPaymentPreviewStore({unitPriceCents:0,onConfirmed:receipt=>{if(receipt.serviceUnlocked)previewControl?.confirmService(options.clientId||previewClientId);}}));
      fixture.syncPaymentPreviewProposal(previewStores.get(storeKey),previewControl.readClientView(options.clientId||previewClientId));
      if(!previewAdapters.has(adapterKey))previewAdapters.set(adapterKey,fixture.createPaymentPreviewRequest({mode:options.mode,store:previewStores.get(storeKey),scenario:params.get('state')==='uncertain'?'uncertain':'default'}));
    }else if(!previewAdapters.has(adapterKey)){
      const fixture=await import('./features/checkins/fixtures.js');if(!previewStores.has(storeKey)&&fixture.createCheckinPreviewStore)previewStores.set(storeKey,fixture.createCheckinPreviewStore());previewAdapters.set(adapterKey,fixture.createCheckinPreviewRequest({mode:options.mode,store:previewStores.get(storeKey)}));
    }
    featureRequest=previewAdapters.get(adapterKey);
  }
  if(!featureRequest)throw new Error(`${kind==='payments'?'Payments':'Check-ins'} still needs its service connection.`);
  return featureRequest;
}
async function mountFeature(kind,element,options,source=requests) {
  const featureRequest=await featureRequestFor(kind,options,source);
  if(preview)options={...options,productLabels:{...previewControl?.productLabels,...options.productLabels}};
  if(kind==='payments') {const module=await import('./features/payments/index.js');return module.mountPaymentsPanel(element,{...options,request:featureRequest,uploadEvidence:options.readOnly?undefined:source.uploadEvidence});}
  const module=await import('./features/checkins/index.js');return module.mountCheckinsPanel(element,{...options,request:featureRequest,uploadPhoto:options.readOnly?undefined:source.uploadPhoto,viewPhoto:options.readOnly?undefined:source.viewPhoto});
}

async function route() {
  const current=++routeSequence;
  cleanup?.();cleanup=null;root.innerHTML='<div class="advisor-loading" role="status">Opening your workspace…</div>';
  let path=location.hash,initialDirectory=null;
  const onSignOut=async()=>{if(preview){cleanup?.();cleanup=null;location.href=location.pathname;return;}await session.signOut();};
  try {
    if(previewTargetError)throw Object.assign(new Error('Invalid preview link'),{code:'invalid_preview_target',status:400});
    if(advisorTarget){
      let envelope;
      if(advisorTarget.kind==='sample'){
        const directory=await requests.core({action:'advisor_list'});
        if(directory?.capabilities?.view!==true)throw Object.assign(new Error('Advisor access required'),{status:403});
        if(advisorTarget.sampleId==='maya'){const sample=await import('./advisor/maya-sample.js');envelope=sample.createMayaSample();}
        else {const sample=await import('./advisor/alex-sample.js');envelope=sample.createAlexSample();}
      }else{
        envelope=await requests.core({action:'advisor_preview_read_v2',clientId:advisorTarget.clientId,mode:advisorTarget.mode,expectedRevision:advisorTarget.expectedRevision});
        if(envelope?.clientId!==advisorTarget.clientId||envelope.mode!==advisorTarget.mode||(advisorTarget.mode==='draft'&&(envelope.revision!==advisorTarget.expectedRevision||envelope.draft?.savedRevision!==advisorTarget.expectedRevision)))throw Object.assign(new Error('Preview response mismatch'),{status:503});
      }
      if(current!==routeSequence)return;
      const {createReadOnlyPreviewRequests}=await import('./preview/adapter.js');
      const readonly=createReadOnlyPreviewRequests(envelope),module=await import('./client/view.js');
      if(current!==routeSequence)return;
      const label=advisorTarget.kind==='sample'?(advisorTarget.sampleId==='maya'?'Maya · Sample':'Alex · Sample'):advisorTarget.mode==='draft'?'Unpublished':'View as client · Read only';
      cleanup=module.mountClientPortal(root,{request:readonly.core,mountFeature:(kind,element,options)=>mountFeature(kind,element,{...options,canWrite:false,readOnly:true},readonly),onSignOut,clientId:envelope.clientId,avatar:advisorTarget.sampleId==='maya'?'M':'A',readOnly:true,draft:envelope.draft,previewLabel:label});
      previewTargetStore.clear();
      return;
    }
    if(sessionMode==='cookie'&&!advisorTarget)path='#/advisor';
    if(sessionMode==='client-cookie')path='#/client';
    if(!path&&!preview){try{initialDirectory=await requests.core({action:'advisor_list'});path='#/advisor';}catch(error){if(error.status===403)path='#/client';else throw error;}}
    if(!path)path='#/advisor';
    if(preview){const banner=document.querySelector('#preview-banner'),query=esc('?'+params.toString());if(!path.startsWith('#/client'))advisorPreviewContext=true;banner.innerHTML=path.startsWith('#/client')?'Fictional sample · no real clients or transactions':`Fictional sample · advisor preview <a href="${query}#/advisor">Advisor</a><a href="${query}#/client">Client</a>`;}
    if(path.startsWith('#/client')) {const module=await import('./client/view.js');if(current!==routeSequence)return;cleanup=await module.mountClientPortal(root,{request:requests.core,mountFeature,readPaymentStatus:async options=>(await featureRequestFor('payments',{clientId:previewClientId,mode:'client'}))({action:'client_read',schemaVersion:2},options),onSignOut,clientId:previewClientId,preview,draftState:preview?null:clientDraftForSession(),managerPreview:preview&&advisorPreviewContext});}
    else {const module=await import('./advisor/workspace.js');if(current!==routeSequence)return;cleanup=module.mountAdvisorWorkspace(root,{request:requests.core,requestAdmission:requests.admission||null,mountFeature,onSignOut,preview,scenario:params.get('state')||'ready',initialDirectory});}
  }catch(error){
    if(current!==routeSequence)return;
    if(advisorTarget||previewTargetError){
      const code=error?.code,heading=code==='stale_draft'?'Draft changed':code==='draft_missing'?'Draft unavailable':code==='invalid_preview_target'?'Invalid preview link':error?.status===403?'Advisor access required':'Unable to open preview';
      const message=code==='stale_draft'?'This saved draft has changed. Return to the advisor workspace, save the current draft and open a new preview.':code==='draft_missing'?'The saved draft is no longer available. Return to the advisor workspace to review it.':code==='invalid_preview_target'?'Open a new preview link from the advisor workspace.':error?.status===403?'This account cannot preview the selected client. Sign in with an authorized advisor account.':'The preview could not be verified. Refresh to retry the same saved revision.';
      const freshSignInHref=advisorTarget?previewHref(advisorTarget,location.origin+location.pathname,{freshSignIn:true}):null;
      root.innerHTML=`<main class="advisor-login-shell"><section class="advisor-login-card"><h1>${esc(heading)}</h1><p>${esc(message)}</p>${error?.status===403&&freshSignInHref?`<a class="quiet" href="${esc(freshSignInHref)}">Sign in as advisor</a>`:''}<a class="quiet" href="./#/advisor">Advisor workspace</a><button id="preview-error-signout" class="quiet">Sign out</button></section></main>`;
      root.querySelector('#preview-error-signout').onclick=onSignOut;
    }else root.innerHTML='<main class="advisor-login-shell"><section class="advisor-login-card"><h1>Unable to open the portal</h1><p>Refresh the page to try again.</p></section></main>';
  }
}

window.addEventListener('hashchange',()=>{if(requests?.core&&(preview||(sessionMode!=='r2'?session?.status==='ready':session?.token)))route();});

if(preview) {
  document.title='Synthetic preview · Shelv Concierge';
  const banner=document.querySelector('#preview-banner'),previewQuery=esc('?'+params.toString());banner.hidden=false;banner.innerHTML=`Synthetic preview · no real clients, emails or payments <a href="${previewQuery}#/advisor">Advisor</a><a href="${previewQuery}#/client">Client</a>`;
  const {createPreviewRequests}=await import('./advisor/fixtures.js');const fixture=createPreviewRequests({viewer:params.get('role')==='viewer',scenario:params.get('state')||'ready'});previewControl=fixture;requests={core:fixture.core};previewClientId=fixture.clientId;
  await route();
} else {
  try {const response=await fetch('portal-config.json',{cache:'no-store',credentials:'omit',redirect:'error'});if(response.ok){const raw=await response.json();config=readConfig(raw);sessionMode=useAdvisorCookies(raw,new URL(location.href),Boolean(advisorTarget))?'cookie':useClientCookies(raw,new URL(location.href),Boolean(advisorTarget))?'client-cookie':'r2';}}catch{}
  if(!config.enabled)login();
  else {
    if(sessionMode==='cookie'){
      const {CookieAdvisorSession,createCookieRequest}=await import('./auth/advisor-cookie-session.js');
      session=createAdvisorSessionBridge({Cookie:CookieAdvisorSession,onState:authChanged});
      requests={admission:session.requestFor(createCookieRequest,'admission'),core:session.requestFor(createCookieRequest,'operations'),payments:session.requestFor(createCookieRequest,'payments'),checkins:session.requestFor(createCookieRequest,'checkins')};
    }else if(sessionMode==='client-cookie'){
      const {CookieClientSession,createClientCookieRequest,createClientPhotoUpload}=await import('./auth/client-cookie-session.js');
      session=createAdvisorSessionBridge({Cookie:CookieClientSession,onState:authChanged});
      requests={core:session.requestFor(createClientCookieRequest,'operations'),payments:session.requestFor(createClientCookieRequest,'payments'),checkins:session.requestFor(createClientCookieRequest,'checkins'),uploadPhoto:createClientPhotoUpload(session.cookie)};
    }else{
    session=new PortalSession(config,fetch,{onState:authChanged,restore:params.get('signin')!=='1'&&!callback.kind&&!callback.error});
    const request=endpoint=>createRequest(endpoint,session,fetch,config.publishableKey);
    requests={core:request(config.operationsUrl),payments:config.paymentsUrl?request(config.paymentsUrl):null,checkins:config.checkinsUrl?request(config.checkinsUrl):null};
    if(config.checkinsUrl)requests.uploadPhoto=createPhotoUpload(config.checkinsUrl,session,fetch,config.publishableKey);
    }
    const recheck=()=>{if(bootstrapped&&session.status!=='signedout'&&session.status!=='checking'&&document.visibilityState!=='hidden')void recoverConnection();};
    window.addEventListener('offline',()=>session.suspend());window.addEventListener('online',recheck);
    window.addEventListener('pageshow',recheck);window.addEventListener('focus',recheck);document.addEventListener('visibilitychange',recheck);
    window.addEventListener('pagehide',event=>{if(!event.persisted){releaseClientDraft();session.dispose();}});
    try {
      const accepted=await session.accept(callback);bootstrapped=true;
      if(accepted){mountedGeneration=session.generation;restoreVisibility(false);await route();}
      else login(callback.error?'This sign-in link has expired. Request a new one.':session.storage.ambiguous?'More than one account is remembered here. Use a sign-in link to choose your account.':'');
    } catch(error) {
      bootstrapped=true;
      if(session.status==='offline')suspendPrivate();
      else login(sessionMode==='client-cookie'&&error.status===403?'Your invitation access could not be confirmed. Please get help with your invitation.':sessionMode==='r2'&&advisorTarget&&callback.kind&&error.status<500?'This sign-in link could not open this preview. If it was already opened in another tab, request a new link here, then paste the new link into this preview tab’s address bar.':error.code==='pkce_verifier_missing'?'This browser could not retain the sign-in request. Open the link in the browser where you requested it. If browser storage is blocked, allow it and request a new link.':error.status>=500?'We could not verify your session. Check your connection and refresh to try again.':'This sign-in link could not be verified. Request a new one.');
    }
  }
}
