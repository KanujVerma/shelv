// Exact non-JSX production entry/helper extraction. Imports bind to the same real
// controllers; only React/view imports are omitted. No hooks or authority stubs.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createApplicationSession} from '../src/app/session.ts';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {readAccountProfileCommand} from '../../../src/contracts/PortalAccountProfileValidation.ts';
import {mapAccountProfileResult} from '../../../src/contracts/PortalAccountProfileMapping.ts';
import {readAccountContactCommand} from '../../../src/contracts/PortalAccountContactValidation.ts';
import {mapAccountContactResult} from '../../../src/contracts/PortalAccountContactMapping.ts';
const root=fileURLToPath(new URL('../../../',import.meta.url));let api;
async function source(){
 if(api)return api;
 const file=path.join(root,'apps/portal/src/app/account-entry.tsx'),original=await readFile(file,'utf8');
 const start=original.indexOf('type Profile ='),end=original.indexOf('\nfunction AccountDetails(');assert.ok(start>0&&end>start);
 const body=original.slice(start,end),url=p=>pathToFileURL(path.join(root,p)).href;
 const imports=`import type {ApplicationSession} from '${url('apps/portal/src/app/session.ts')}';\nimport type {PortalNavigationCore} from '${url('apps/portal/src/navigation/react.tsx')}';\nimport {buildRoute,parseRoute} from '${url('apps/portal/src/navigation/routes.ts')}';\nimport {createAccountProfileController} from '${url('apps/portal/src/features/account/profile/controller.ts')}';\nimport {createAccountContactController} from '${url('apps/portal/src/features/account/contact/controller.ts')}';\n`;
 const contents=imports+body+'\nexport {createDetailsActivation as testCreateDetailsActivation};\n';
 const dir=path.join(root,'.local-artifacts/portal-rebuild/account-aec-correction/pure-'+crypto.randomUUID());await mkdir(dir,{recursive:true});
 await writeFile(path.join(dir,'entry.ts'),contents,{flag:'wx'});await writeFile(path.join(dir,'manifest.json'),JSON.stringify({source:file,sourceSha256:createHash('sha256').update(original).digest('hex'),extractedBodySha256:createHash('sha256').update(body).digest('hex'),generatedSha256:createHash('sha256').update(contents).digest('hex'),adaptation:'Only imports to identical concrete controllers/type-only bindings, exact non-JSX production body, appended private-helper test export; NOT React hook/effect/SSR acceptance'},null,2),{flag:'wx'});
 api=await import(pathToFileURL(path.join(dir,'entry.ts')).href);return api;
}
function windowModel(){const listeners=new Map(),entries=[{url:'/account',state:null}];let cursor=0;const location={pathname:'/account',search:''};const set=url=>{const u=new URL(url,'https://portal.synthetic.invalid');location.pathname=u.pathname;location.search=u.search;};return {location,document:{activeElement:null,getElementById(){return null;},querySelector(){return null;}},scrollY:0,scrollTo(){},requestAnimationFrame:fn=>queueMicrotask(fn),addEventListener(n,fn){if(!listeners.has(n))listeners.set(n,new Set());listeners.get(n).add(fn);},removeEventListener(n,fn){listeners.get(n)?.delete(fn);},history:{scrollRestoration:'auto',get state(){return entries[cursor].state;},replaceState(state,_t,url){entries[cursor]={state,url};set(url);},pushState(state,_t,url){entries.splice(++cursor);entries[cursor]={state,url};set(url);},back(){this.go(-1);},go(delta){cursor+=delta;set(entries[cursor].url);for(const fn of listeners.get('popstate')??[])fn();}}};}
export async function detailsFixture(t){
 const prior=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;t.after(()=>globalThis.BroadcastChannel=prior);
 const calls=[];let profile={schemaVersion:1,profileRevision:7,displayName:'Synthetic Name',currentEmail:{state:'known',address:'Current@Example.test',verified:true}};
 const contact={schemaVersion:1,contactBasis:'a'.repeat(64),currentEmail:profile.currentEmail,pendingEmail:{state:'unknown'}};
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url==='/api/client/session')return Response.json({signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'SYNTHETIC-details',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});
  assert.ok(['/api/client/account-profile','/api/client/account-contact'].includes(url),'unexpected egress');assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');const isProfile=url.endsWith('account-profile'),command=(isProfile?readAccountProfileCommand:readAccountContactCommand)(JSON.parse(init.body));calls.push(command);
  assert.ok(command.action==='read_account_profile_v1'||command.action==='read_account_contact_v1','no write/status in details controls');return Response.json(isProfile?mapAccountProfileResult(profile,command):mapAccountContactResult(contact,command));
 }});t.after(()=>runtime.dispose());await runtime.restore();const win=windowModel(),navigation=createPortalNavigator(win,{scopeKey:runtime.getSnapshot().boundary.key});t.after(()=>navigation.dispose());
 const m=await source(),entry=m.createAccountEntry(runtime,navigation);t.after(()=>entry.dispose());await entry.start();assert.equal(entry.getSnapshot().profile.getSnapshot().phase,'ready');assert.equal(entry.getSnapshot().contact.getSnapshot().phase,'ready');return {entry,runtime,navigation,calls,details:()=>m.testCreateDetailsActivation(entry)};
}
