import assert from 'node:assert/strict';
import {readFile,readdir,lstat,realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {selectCareFixture,requireCareCustody,careNativePins} from '../scripts/rebuild-care-native-fixture.mjs';
import {sha} from '../scripts/rebuild-native-boundary.mjs';

export const careBrowserPins=Object.freeze({purpose:'genuine-care-browser',applicationCommit:'18c78b7d',parentCommit:'80b58a4773b12435d19200a7cf7ba1e06bef067d',artifactDirectory:'w6-care-native-browser-r7'});
export const careBrowserRoot=path.resolve(import.meta.dirname,'../../..');
const storageQueries=Object.freeze(["SELECT name FROM sqlite_master WHERE type='table' AND name='session_record'",'SELECT json FROM session_record']);
export function careBrowserStoragePlan({care=false,purpose,selection,grant,workspace}={}) {
  if(purpose!=='genuine-care-browser')return Object.freeze({enabled:false});
  assert.equal(care,true,'Inspection requires the explicit care-browser stack');requireCareCustody(selection,grant,workspace,purpose);
  return Object.freeze({enabled:true,script:'vault',className:'AdvisorSessionObject',queries:storageQueries});
}
export function careBrowserDatabaseId(file,directory,existingFiles) {
  assert.ok(existingFiles.includes(file),'Only actual pre-existing own database files can be inspected');assert.equal(path.resolve(file),file);assert.ok(file.startsWith(directory+path.sep));
  const namespace=path.join(directory,'resources/do/vault-AdvisorSessionObject');
  if(file===path.join(namespace,'metadata.sqlite')||file===path.join(directory,'resources/cache/miniflare-CacheObject/metadata.sqlite'))return null;
  assert.equal(path.dirname(file),namespace,'Only the actual vault script/class namespace is inspectable');const id=path.basename(file,'.sqlite');assert.equal(path.basename(file),id+'.sqlite');assert.match(id,/^[0-9a-f]{64}$/,'Unknown files cannot bootstrap another object');return id;
}

export function careBrowserFailure(error) {
  const name=['Error','AssertionError','TimeoutError','TypeError','TransportError','AggregateError'].includes(error?.name)?error.name:'Error';
  const method=typeof error?.message==='string'?error.message.match(/^(?:locator|page|browser|browserContext)\.[a-zA-Z]+/)?.[0]??null:null;
  const code=typeof error?.code==='string'&&/^(?:ERR_|SQLITE_)[A-Z_]+$/.test(error.code)?error.code:null;
  const result={name,method,code};
  if(error instanceof assert.AssertionError){result.operator=error.operator;for(const key of ['actual','expected'])if(error[key]===null||['number','boolean'].includes(typeof error[key]))result[key]=error[key];}
  return result;
}

// Pure. Selection, native custody and Chrome custody are independent authorizations.
export function requireCareBrowserAuthorization({selection,grant,chromeGrant},workspace) {
  const selected=selectCareFixture(selection);
  requireCareCustody(selected,grant,workspace,careBrowserPins.purpose);
  assert.ok(chromeGrant&&typeof chromeGrant==='object'&&!Array.isArray(chromeGrant),'Separate Chrome grant required');
  assert.deepEqual(Object.keys(chromeGrant).sort(),['format','parentThreadId','purpose','workspace','grantId'].sort());
  assert.equal(chromeGrant.format,1);assert.equal(chromeGrant.parentThreadId,careNativePins.parentThreadId);
  assert.equal(chromeGrant.purpose,careBrowserPins.purpose);assert.equal(chromeGrant.workspace,workspace);
  assert.match(chromeGrant.grantId,/^[a-zA-Z0-9:_-]{1,200}$/);assert.notEqual(chromeGrant.grantId,grant.grantId,'Chrome requires its separate parent reference');
  return {selection:selected,purpose:careBrowserPins.purpose,grantId:grant.grantId,chromeGrantId:chromeGrant.grantId};
}

export function validateCareBrowserApplication({provenance,head,dirty,inputs,outputs}) {
  assert.match(head,/^[0-9a-f]{40}$/);assert.equal(dirty,false,'Run from a clean committed checkout');
  assert.equal(provenance.schemaVersion,1);assert.equal(provenance.candidate,true);assert.equal(provenance.gatewayIncluded,false);
  assert.equal(provenance.sourceHead,head);assert.equal(provenance.sourceDirty,false,'Rebuild candidate after the source commit');
  assert.equal(provenance.entry,'apps/portal/src/main.tsx');assert.equal(provenance.template,'apps/portal/src/app/index.html');
  assert.ok(provenance.inputs.length>0);assert.ok(provenance.assets.length>0);
  const sources=new Set(),emitted=new Set();
  for(const item of [...provenance.inputs,...provenance.assets]) {
    assert.ok(!sources.has(item.source),'Duplicate source provenance');sources.add(item.source);
    const bytes=inputs[item.source];assert.ok(Buffer.isBuffer(bytes),'Missing source bytes');
    assert.equal(bytes.length,item.bytes);assert.equal(sha(bytes),item.sha256,'Candidate source correspondence failed');
    if(item.output){const bytes=outputs[item.output];assert.ok(Buffer.isBuffer(bytes));assert.equal(bytes.length,item.bytes);assert.equal(sha(bytes),item.sha256);}
  }
  for(const [relative,bytes] of Object.entries(outputs)) {
    assert.ok(!path.isAbsolute(relative)&&!relative.split('/').includes('..'));assert.ok(Buffer.isBuffer(bytes));
    assert.ok(!/(?:^|\/)(?:_worker\.js|_routes\.json|.*\.private\..*|SELECTION\.json)$/.test(relative),'No gateway or private resource file in ASSETS');
    emitted.add(relative);
  }
  assert.ok(emitted.has('application.js'));
  return {sourceHead:head,sourceDirty:false,gatewayIncluded:false,inputs:provenance.inputs.length,assets:provenance.assets.length,outputs:Object.fromEntries(Object.entries(outputs).sort(([a],[b])=>a.localeCompare(b)).map(([file,bytes])=>[file,{bytes:bytes.length,sha256:sha(bytes)}])),provenanceSha256:sha(JSON.stringify(provenance))};
}

// Own local build/source reads only; no fixture, native or browser resource access.
export async function attestCareBrowserApplication(root=careBrowserRoot) {
  assert.equal(root,careBrowserRoot);assert.equal(await realpath(root),root);
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const head=git('rev-parse','HEAD'),dirty=git('status','--porcelain')!=='';
  git('merge-base','--is-ancestor',careBrowserPins.parentCommit,head);
  const directory=path.join(root,'.local-artifacts/portal-rebuild/application');
  const provenance=JSON.parse(await readFile(path.join(directory,'application-provenance.json'),'utf8')),inputs={},outputs={};
  for(const item of [...provenance.inputs,...provenance.assets]) {
    const file=path.resolve(root,item.source);assert.ok(file.startsWith(root+path.sep),'Candidate source must be inside this checkout');
    const stat=await lstat(file);assert.ok(stat.isFile()&&!stat.isSymbolicLink());inputs[item.source]=await readFile(file);
  }
  async function visit(dir,prefix='') {for(const e of await readdir(dir,{withFileTypes:true})) {assert.ok(!e.isSymbolicLink());const relative=prefix+e.name,file=path.join(dir,e.name);if(e.isDirectory())await visit(file,relative+'/');else{assert.ok(e.isFile());outputs[relative]=await readFile(file);}}}
  await visit(directory);
  const receipt=validateCareBrowserApplication({provenance,head,dirty,inputs,outputs});
  const metadata=JSON.parse(outputs['build-metadata.json']);
  for(const key of Object.keys(metadata.outputs))assert.ok(Object.hasOwn(outputs,path.relative(directory,path.resolve(root,'apps/portal',key))),'Missing actual emitted file');
  const {compileCareBrowserApplication}=await import('./rebuild-care-native-browser-compile.mjs');
  const compiled=await compileCareBrowserApplication();
  for(const file of compiled.outputFiles) {
    const relative=path.relative(directory,file.path);assert.ok(Object.hasOwn(outputs,relative));
    assert.equal(sha(outputs[relative]),sha(file.contents),'Served bundle differs from current write:false compilation');
  }
  assert.equal(Object.keys(compiled.metafile.inputs).length+1,provenance.inputs.length);
  return {...receipt,directory};
}
