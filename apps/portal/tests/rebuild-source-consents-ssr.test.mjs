import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {mkdir,writeFile,readFile,lstat} from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {createSourceConsentsModel} from '../src/features/account/source-consents/model.ts';
import {page,consent,loaded,pending,client,recorder,uid} from './rebuild-source-consents-fixture.mjs';
const portal=new URL('..',import.meta.url).pathname,home=new URL('../../../.local-artifacts/portal-rebuild/w6-source-consents-ui/',import.meta.url);
const evidenceRun=process.env.SHELV_SOURCE_CONSENTS_EVIDENCE_RUN??`manual-${process.pid}`;assert.match(evidenceRun,/^[a-zA-Z0-9-]+$/);
async function preserveBuild(label,result){
 await mkdir(home,{recursive:true});const inputs=await Promise.all(Object.keys(result.metafile.inputs).map(async p=>{const file=path.resolve(portal,p),bytes=await readFile(file);return{path:p,bytes:bytes.length,mode:(await lstat(file)).mode,sha256:createHash('sha256').update(bytes).digest('hex')};}));
 const outputs=result.outputFiles.map(file=>({path:file.path,bytes:file.contents.length,sha256:createHash('sha256').update(file.contents).digest('hex')}));
 await writeFile(new URL(`${evidenceRun}-${label}-metafile.json`,home),JSON.stringify({metafile:result.metafile,inputs,outputs},null,2)+'\n',{flag:'wx'});
}
const built=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['tests/rebuild-source-consents-ssr.tsx'],bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',loader:{'.css':'empty'},metafile:true});
await preserveBuild('ssr',built);
const mod={exports:{}};new Function('module','exports','require',built.outputFiles[0].text)(mod,mod.exports,createRequire(import.meta.url));const {renderSection,renderReview,reviewForm}=mod.exports;
test('SSR has different unread, unavailable and actually loaded-empty states; unavailable recovery is disabled with a reason',()=>{
 const unknown=renderSection(createSourceConsentsModel({read:{state:'unknown'}})),unavailable=renderSection(createSourceConsentsModel()),empty=renderSection(createSourceConsentsModel(loaded(page([]))));
 assert.match(unknown,/recorded consents not loaded/);assert.match(unavailable,/recorded consents are unavailable/);assert.match(empty,/no recorded consents in this complete snapshot/);
 for(const html of [unknown,unavailable]){assert.doesNotMatch(html,/no recorded consents/);assert.match(html,/<button[^>]*disabled[^>]*>refresh consents<\/button>/);assert.match(html,/refreshing recorded consents is unavailable here/);}
});
test('SSR shows purposes separately, exact escaped disclosure and known/unknown occurrence without private identifiers',()=>{
 const a=consent(),b=consent(11,'service_review');a.disclosureText='\ufeffSYNTHETIC 2 < 3 & "quotes"\r\nDe\u0301claration';b.confirmation.occurredAt={state:'known',value:'2026-10-31T18:01:02Z'};
 const html=renderSection(createSourceConsentsModel(loaded(page([a,b]))));
 assert.match(html,/storage of consultation material/);assert.match(html,/use to prepare your advice/);assert.match(html,/SYNTHETIC 2 &lt; 3 &amp; &quot;quotes&quot;/);assert.match(html,/De\u0301claration/);assert.match(html,/disclosure version 1/);
 assert.match(html,/confirmation date not known/);assert.match(html,/dateTime="2026-10-31T18:01:02Z"|datetime="2026-10-31T18:01:02Z"/);assert.match(html,/recorded at/);assert.match(html,/confirmation occurred at/);
 for(const privateId of [client,recorder,a.consent.id,a.consent.groupId,a.consent.disclosure.hash])assert.ok(!html.includes(privateId));
 assert.doesNotMatch(html,/sourceId|draftId|provider|credential|evidence|https?:\/\/|active consent|permission granted/);
 assert.match(html,/<button[^>]*disabled[^>]*>review withdrawal<\/button>/);assert.match(html,/withdrawal is unavailable here/);
});
test('SSR keeps lawful groups independent and displays supersession, manual withdrawal and portal withdrawal as records only',()=>{
 const old=consent();old.effective='superseded';const current=consent(12);current.supersedesConsentId=old.consent.id;current.confirmation.decision='withdraw';current.effective='withdrawn';
 const portal=consent(13,'service_review',uid(4));portal.effective='withdrawn';portal.withdrawal={id:uid(80),origin:'client_portal',consent:portal.consent,recordedBy:client,recordedAt:'2026-11-01T13:00:00Z'};
 const html=renderSection(createSourceConsentsModel(loaded(page([old,current,portal]))));
 assert.match(html,/consent group 1/);assert.match(html,/consent group 2/);assert.match(html,/superseded/);assert.match(html,/recorded withdrawal/);assert.match(html,/withdrawal recorded in Account/);assert.doesNotMatch(html,/active consent|withdrawal succeeded|permission granted/);
});
test('SSR retains maximum Root-accepted disclosure and honest partial-page context',()=>{
 const record=consent();record.disclosureText='SYNTHETIC '+ 'x'.repeat(3990);const input=page([record],{total:2,nextCursor:1}),html=renderSection(createSourceConsentsModel(loaded(input)));
 assert.match(html,new RegExp('x'.repeat(3990)));assert.match(html,/records 1 to 1 of 2/);assert.match(html,/other records are outside this page/);assert.doesNotMatch(html,/complete snapshot|no recorded consents/);
});
test('actual confirmation form has a native submit and cancel path bound to the loaded immutable review',()=>{
 const intents=[],m=createSourceConsentsModel(loaded(page(),{onWithdrawalIntent:x=>intents.push(x)}));m.reviewWithdrawal(m.getSnapshot().rows[0]);const review=m.getSnapshot().confirmation;
 const html=renderReview(m,review);assert.match(html,/<form[^>]*aria-label="confirm consent withdrawal"/);assert.match(html,/<button[^>]*type="submit"[^>]*>confirm withdrawal<\/button>/);assert.match(html,/<button[^>]*type="button"[^>]*>cancel<\/button>/);assert.match(html,/SYNTHETIC DISCLOSURE ONLY/);assert.doesNotMatch(html,/requestId|commandHash|clientId|sourceId/);
 let prevented=0;reviewForm(m,review).props.onSubmit({preventDefault(){prevented++;}});assert.equal(prevented,1);assert.equal(intents.length,1);assert.equal(intents[0].snapshot.revision,7);
});
test('SSR recovery states are distinct and have no enabled inert controls or withdrawal success',()=>{
 const states=[['unknown',{state:'unknown'},/original withdrawal result is unknown/],['absent',{state:'observed',status:{schemaVersion:1,visibility:'client_account',clientId:client,requestId:uid(90),status:'absent'}},/no committed result was reported/],['unavailable',{state:'observed',status:{schemaVersion:1,visibility:'client_account',clientId:client,requestId:uid(90),status:'unavailable',code:'request_unavailable'}},/original request status is unavailable/],['purged',{state:'observed',status:{schemaVersion:1,visibility:'client_account',clientId:client,requestId:uid(90),status:'unavailable',code:'request_purged'}},/original request status is no longer retained/]];
 for(const [,observation,text] of states){const html=renderSection(createSourceConsentsModel(loaded(page(),{recovery:pending(observation)})));assert.match(html,text);assert.match(html,/<button[^>]*disabled[^>]*>check original result<\/button>/);assert.match(html,/<button[^>]*disabled[^>]*>retry original withdrawal<\/button>/);assert.doesNotMatch(html,/withdrawal succeeded|successfully withdrawn|has been deleted/);}
});
test('construction and repeated shared-wrapper SSR have zero fetch, storage, random UUID or intent effects',()=>{
 let fetches=0,storage=0,uuids=0,intents=0;const originalFetch=globalThis.fetch,uuid=globalThis.crypto.randomUUID;
 const descriptors=['localStorage','sessionStorage'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]);
 globalThis.fetch=()=>{fetches++;throw Error('fetch trap');};globalThis.crypto.randomUUID=()=>{uuids++;throw Error('UUID trap');};
 for(const [key] of descriptors)Object.defineProperty(globalThis,key,{configurable:true,get(){storage++;throw Error('storage trap');}});
 try{const m=createSourceConsentsModel(loaded(page(),{onWithdrawalIntent:()=>{intents++;}}));for(let i=0;i<3;i++)renderSection(m);assert.deepEqual({fetches,storage,uuids,intents},{fetches:0,storage:0,uuids:0,intents:0});}
 finally{globalThis.fetch=originalFetch;globalThis.crypto.randomUUID=uuid;for(const [key,d] of descriptors){if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key];}}
});
test('browser-target feature closure uses actual Root codecs/shared UI and no transport or Auth adapter',async()=>{
 const result=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['src/features/account/source-consents/index.ts'],bundle:true,write:false,metafile:true,format:'esm',platform:'browser',target:'es2022',outdir:'ignored-source-consents-build'});
 const files=Object.keys(result.metafile.inputs);for(const suffix of ['/PortalSourceAccountValidation.ts','/PortalSourceAccountMapping.ts','/ui/primitives.tsx','/ui/overlay.tsx'])assert.ok(files.some(p=>p.endsWith(suffix)),suffix);
 assert.ok(!files.some(p=>/session-integration|site\/auth|src\/transport|src\/app\/session|PortalSource\.ts$/.test(p)));assert.ok(result.outputFiles.length>0);await preserveBuild('feature',result);
});
test('a retained form renders no obsolete disclosure after cancel, replacement or read-only transition',()=>{
 const input=page();input.entries[0].disclosureText='SYNTHETIC SELECTED DISCLOSURE';const m=createSourceConsentsModel(loaded(input,{onWithdrawalIntent(){}}));m.reviewWithdrawal(m.getSnapshot().rows[0]);const review=m.getSnapshot().confirmation;
 assert.match(renderReview(m,review),/SYNTHETIC SELECTED DISCLOSURE/);m.replace({read:{state:'unknown'}});assert.equal(renderReview(m,review),'');assert.doesNotMatch(renderSection(m),/SYNTHETIC SELECTED DISCLOSURE/);
 m.replace(loaded(page(),{presentation:'read_only',onWithdrawalIntent(){}}));assert.match(renderSection(m),/<button[^>]*disabled[^>]*>review withdrawal<\/button>/);assert.match(renderSection(m),/read-only view/);
});
test('Root-rejected raw fields cannot appear as client HTML, including after replacing a previously loaded page',()=>{
 const m=createSourceConsentsModel(loaded(page()));m.replace(loaded({...page(),sourceId:uid(91),draftId:uid(92),url:'https://private.invalid/PRIVATE_SOURCE_URL',providerCredential:'PRIVATE_CREDENTIAL'}));const html=renderSection(m);
 assert.match(html,/recorded consents are unavailable/);assert.doesNotMatch(html,/PRIVATE_|sourceId|draftId|https?:\/\/private\.invalid|SYNTHETIC DISCLOSURE/);
});
