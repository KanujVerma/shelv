// Closed synthetic HTTP only. No successful OperationPort/session/Vault substitute.
import assert from 'node:assert/strict';
import {createApplicationSession as physicalApplication} from '../src/app/session.ts';
import {historicalUnregisteredApplication} from './helpers/historical-unregistered-session.mjs';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {dirname,resolve,relative} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const repo=resolve(fileURLToPath(new URL('../../..',import.meta.url)));
let projected;
function projection(){
 if(projected)return projected;
 const evidence=resolve(repo,'.local-artifacts/account-profile-consumer');mkdirSync(evidence,{recursive:true});
 const destination=mkdtempSync(resolve(evidence,'synthetic-channel-'));
 const pending=['apps/portal/src/features/account/profile/controller.ts'],seen=new Set(),rows=[];
 while(pending.length){
  const path=pending.pop();if(seen.has(path))continue;seen.add(path);
  const bytes=readFileSync(resolve(repo,path));let post=bytes;
  if(path==='apps/portal/site/auth/client-cookie-session.js'){
   const before=bytes.toString(),needle="  this.actions.notifications=['list_inbox_v1','mark_seen_v1','request_status_v1'];";
   assert.equal(before.split(needle).length,2,'exact retained constructor preimage');
   post=Buffer.from(before.replace(needle,needle+"\n  this.actions['account-profile']=['read_account_profile_v1','set_account_display_name_v1'];"));
  }
  const out=resolve(destination,path);mkdirSync(dirname(out),{recursive:true});writeFileSync(out,post,{flag:'wx'});
  rows.push({path,originalSha256:createHash('sha256').update(bytes).digest('hex'),projectedSha256:createHash('sha256').update(post).digest('hex'),changed:!bytes.equals(post)});
  for(const m of bytes.toString().matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){
   if(m[1].startsWith('.'))pending.push(relative(repo,resolve(dirname(resolve(repo,path)),m[1])));
  }
 }
 assert.deepEqual(rows.filter(row=>row.changed).map(row=>row.path),['apps/portal/site/auth/client-cookie-session.js']);
 writeFileSync(resolve(destination,'manifest.json'),JSON.stringify({scope:'SYNTHETIC channel-admission fixture ONLY',delta:"add exactly this.actions['account-profile']=['read_account_profile_v1','set_account_display_name_v1']; in real constructor",rows},null,2));
 projected=destination;return destination;
}
export async function requestApi(){return import(pathToFileURL(resolve(projection(),'apps/portal/src/app/account-profile-request.ts')).href);}
export async function controllerApi({physical=false}={}){
 return import(pathToFileURL(resolve(physical?repo:projection(),'apps/portal/src/features/account/profile/controller.ts')).href);
}
import {readAccountProfileCommand} from '../../../src/contracts/PortalAccountProfileValidation.ts';
import {mapAccountProfileResult} from '../../../src/contracts/PortalAccountProfileMapping.ts';
export const owner='11111111-1111-4111-8111-111111111111';
export const initial=()=>({schemaVersion:1,profileRevision:7,displayName:'  Maya Example  ',currentEmail:{state:'known',address:'maya@example.invalid',verified:true}});
export const gate=()=>{let resolve,enter;const promise=new Promise(r=>resolve=r),entered=new Promise(r=>enter=r);return {promise,entered,resolve,enter};};
export async function fixture(t,{physical=false,historicalUnregistered=false}={}){
 const createApplicationSession=historicalUnregistered?await historicalUnregisteredApplication():physical?physicalApplication:(await import(pathToFileURL(resolve(projection(),'apps/portal/src/app/session.ts')).href)).createApplicationSession;
 let login={signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-profile-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'},current=initial(),next=null,hold=null,acquires=0,acquireHold=null,now=Date.parse('2026-11-02T12:00:00Z');
 const calls=[],receipts=new Map(),originalFetch=globalThis.fetch;
 globalThis.fetch=async()=>{throw Error('unexpected global network');};t.after(()=>{globalThis.fetch=originalFetch;});
 const runtime=createApplicationSession({audience:'client',now:()=>now,locks:{request:async(_name,_options,run)=>run()},fetcher:async(url,init)=>{
  assert.ok(['/api/client/session','/api/client/account-profile','/api/client/logout'].includes(url),'closed unexpected URL '+url);
  if(url.endsWith('/session'))return Response.json(login);
  if(url.endsWith('/logout'))return Response.json({signedOut:true});
  const command=readAccountProfileCommand(JSON.parse(init.body));calls.push({command,wire:init.body,init});let result,status=200;
  const reply=next;next=null;
  if(reply){result=reply.data;status=reply.status;}
  else if(command.action==='read_account_profile_v1')result=current;
  else if(receipts.has(command.requestId)){
   const prior=receipts.get(command.requestId);
   if(prior.wire!==init.body){result={code:'request_conflict'};status=409;}else result=prior.value;
  }else if(command.expectedRevision!==current.profileRevision){result={code:'revision_conflict'};status=409;}
  else{
   const previousRevision=current.profileRevision,revision=previousRevision+(current.displayName===command.displayName?0:1);
   current={...current,displayName:command.displayName,profileRevision:revision};
   result={schemaVersion:1,requestId:command.requestId,action:command.action,previousRevision,revision,displayName:command.displayName,recordedAt:'2026-11-02T12:00:00Z'};
   receipts.set(command.requestId,{wire:init.body,value:result});
  }
  if(status===200&&!reply)result=mapAccountProfileResult(result,command);
  if(hold){const h=hold;hold=null;h.enter();await h.promise;}
  return Response.json(result,{status});
 }});
 await runtime.restore();runtime.cookie.channel?.unref?.();t.after(()=>runtime.dispose());
 const acquire=runtime.cookie.acquire.bind(runtime.cookie);runtime.cookie.acquire=async()=>{acquires++;if(acquireHold?.at===acquires){const h=acquireHold;acquireHold=null;h.enter();await h.promise;}return acquire();};
 return {runtime,calls,receipts,current:()=>current,setCurrent:v=>current=v,reply:(data,status=200)=>next={data,status},login:v=>login={...login,...v},now:v=>now=v,hold(){hold=gate();return hold;},holdAcquire(offset){acquireHold={...gate(),at:acquires+offset};return acquireHold;}};
}
