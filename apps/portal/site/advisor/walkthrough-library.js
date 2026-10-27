import {esc} from './model.js';

const unavailable='Walkthrough access could not be verified. Refresh to try again.';
const nonce=()=>{const bytes=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const when=value=>new Date(value).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'});
const privateHref=(entry,guided)=>{const url=new URL(location.pathname,location.origin);url.searchParams.set('workspace','advisor');url.searchParams.set('walkthrough',entry.caseId);url.searchParams.set('version',entry.versionId);if(guided)url.searchParams.set('guided','1');return url.pathname+url.search;};

/** Authenticated library only. Reusable secrets live solely in this mount's memory. */
export function mountWalkthroughLibrary(root,{request}){
 let disposed=false,generation=0,entries=[];
 const controller=new AbortController(),grants=new Map(),pending=new Map(),links=new Map(),busy=new Set();
 const call=command=>request(command,{signal:controller.signal});
 const status=(id,message)=>{const el=[...root.querySelectorAll('[data-walkthrough-status]')].find(el=>el.dataset.walkthroughStatus===id);if(el)el.textContent=message;};
 const current=value=>!disposed&&value===generation;
 function showUnavailable(){root.innerHTML=`<h2>Walkthroughs</h2><p role="alert">${unavailable}</p><button class="quiet" data-library-retry>Try again</button>`;root.querySelector('[data-library-retry]').onclick=load;}
 function authorizationDenied(error){
  if(![401,403].includes(error?.status))return false;
  // Fence all outstanding operations before clearing every case's reusable secret.
  ++generation;pending.clear();links.clear();grants.clear();busy.clear();entries=[];
  showUnavailable();return true;
 }
 function render(){
  root.innerHTML=`<div class="advisor-section-title"><div><h2>Walkthroughs</h2><p>Choose a plan to explore or share. These are separate from your client records.</p></div></div><p>Anyone with this link can view this walkthrough until it expires or you revoke it.</p><div class="walkthrough-library">${entries.map(entry=>{
   const list=grants.get(entry.caseId)||[],active=list.filter(grant=>grant.status==='active'),link=links.get(entry.caseId),disabled=busy.has(entry.caseId)?'disabled':'';
   return `<article class="advisor-panel" data-walkthrough-case="${esc(entry.caseId)}"><h3>${esc(entry.title)}</h3><p>${entry.status==='ready'?'Ready to share':'Private draft'}</p><div class="advisor-header-buttons">${entry.versionId?`<a class="quiet" target="_blank" rel="noopener noreferrer" href="${esc(privateHref(entry,false))}">Open ↗</a><a class="quiet" target="_blank" rel="noopener noreferrer" href="${esc(privateHref(entry,true))}">Start guided walkthrough ↗</a>`:''}${entry.canShare&&entry.versionId?`<button class="quiet" data-share-create="${esc(entry.caseId)}" ${disabled}>${pending.has(entry.caseId)?'Retry same link':active.length?'Create another link':'Create share link'}</button>`:''}</div>${entry.sourceReference?`<details><summary>Private source reference</summary><p>${esc(entry.sourceReference)}</p></details>`:''}<ul>${list.map(grant=>`<li>${grant.status==='active'?'Active until':grant.status==='expired'?'Expired':'Revoked'} ${esc(when(grant.status==='revoked'?grant.revokedAt:grant.expiresAt))}${entry.canShare&&grant.status==='active'?` <button class="quiet" data-share-revoke="${esc(grant.id)}" data-case="${esc(entry.caseId)}" ${disabled}>Revoke</button>`:''}</li>`).join('')}</ul>${link?`<label>New share link<input data-share-link readonly value="${esc(link)}"></label><button class="quiet" data-share-copy="${esc(entry.caseId)}">Copy link</button><p>Keep this link private. It is shown here only while this view stays open.</p>`:''}<p data-walkthrough-status="${esc(entry.caseId)}" role="status"></p></article>`;
  }).join('')}</div><p>Revoking a link prevents future access. It cannot erase information someone has already viewed or copied.</p>`;
  root.querySelectorAll('[data-share-create]').forEach(button=>button.onclick=()=>create(button.dataset.shareCreate));
  root.querySelectorAll('[data-share-revoke]').forEach(button=>button.onclick=()=>revoke(button.dataset.case,button.dataset.shareRevoke));
  root.querySelectorAll('[data-share-copy]').forEach(button=>button.onclick=async()=>{try{await navigator.clipboard.writeText(links.get(button.dataset.shareCopy));status(button.dataset.shareCopy,'Link copied.');}catch{status(button.dataset.shareCopy,'Select the link above to copy it.');}});
 }
 async function readGrants(id,epoch){const collected=new Map(),seen=new Set();let cursor=null;do{const result=await call({action:'share_list',caseId:id,...(cursor?{cursor}:{})});if(!current(epoch))return;if(!Array.isArray(result?.grants))throw Error(unavailable);for(const grant of result.grants)collected.set(grant.id,grant);cursor=result.nextCursor?.phase==='active'?result.nextCursor:null;if(cursor){const key=JSON.stringify(cursor);if(seen.has(key)||seen.size>=1000)throw Error(unavailable);seen.add(key);}}while(cursor&&current(epoch));if(current(epoch))grants.set(id,[...collected.values()]);}
 async function load(){const current=++generation;root.innerHTML='<p role="status">Loading walkthroughs…</p>';try{
  const result=await call({action:'library'});if(disposed||current!==generation)return;
  if(!Array.isArray(result?.entries))throw Error(unavailable);entries=result.entries;
  await Promise.all(entries.map(entry=>readGrants(entry.caseId,current)));if(disposed||current!==generation)return;render();
 }catch(error){if(!disposed&&current===generation){if(authorizationDenied(error))return;showUnavailable();}}}
 async function create(id){
  const entry=entries.find(entry=>entry.caseId===id);if(disposed||busy.has(id)||!entry?.canShare||!entry.versionId)return;
  const epoch=generation;
  if(!pending.has(id))pending.set(id,{action:'share_create',caseId:id,versionId:entry.versionId,requestId:crypto.randomUUID(),token:nonce()});
  busy.add(id);render();status(id,'Creating link…');
  try{const command=pending.get(id),result=await call(command);if(!current(epoch))return;if(!result?.grant?.id)throw Error(unavailable);
   const url=new URL('/walkthrough/',location.origin);url.hash=new URLSearchParams({access:command.token}).toString();links.set(id,url.href);pending.delete(id);await readGrants(id,epoch);if(!current(epoch))return;busy.delete(id);render();status(id,'Link created. Nothing has been sent.');
  }catch(error){if(!current(epoch))return;if(authorizationDenied(error))return;busy.delete(id);if(error.status&&error.status<500&&![408,429].includes(error.status))pending.delete(id);render();status(id,error.code==='share_limit_reached'?'This walkthrough already has 100 active links. Revoke an existing link before creating another.':pending.has(id)?'The result could not be confirmed. Retry the same link to avoid a duplicate.':unavailable);}
 }
 async function revoke(id,grantId){
  if(disposed||busy.has(id))return;const epoch=generation;busy.add(id);render();status(id,'Revoking link…');
  const key='revoke:'+grantId;if(!pending.has(key))pending.set(key,{action:'share_revoke',caseId:id,grantId,requestId:crypto.randomUUID()});
  try{await call(pending.get(key));if(!current(epoch))return;pending.delete(key);links.delete(id);await readGrants(id,epoch);if(!current(epoch))return;busy.delete(id);render();status(id,'Link revoked.');}
  catch(error){if(!current(epoch))return;if(authorizationDenied(error))return;busy.delete(id);render();status(id,'Revocation could not be confirmed. Retry Revoke.');}
 }
 const focus=()=>{if(!busy.size&&!disposed)void load();};window.addEventListener('focus',focus);void load();return ()=>{disposed=true;window.removeEventListener('focus',focus);++generation;controller.abort();pending.clear();links.clear();grants.clear();busy.clear();entries=[];root.replaceChildren();};
}
