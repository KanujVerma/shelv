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

export function validateCareBrowserApplication({provenance,head,dirty,outputs,expected}) {
  assert.match(head,/^[0-9a-f]{40}$/);assert.equal(dirty,false,'Run from a clean committed checkout');
  assert.ok(expected?.provenance&&expected?.outputs,'Fresh compiler/builder-derived expected outputs are required');
  assert.equal(provenance.schemaVersion,1);assert.equal(provenance.candidate,true);assert.equal(provenance.gatewayIncluded,false);
  assert.equal(provenance.sourceHead,head);assert.equal(provenance.sourceDirty,false,'Rebuild candidate after the source commit');
  assert.equal(provenance.entry,'apps/portal/src/main.tsx');assert.equal(provenance.template,'apps/portal/src/app/index.html');
  assert.equal(expected.provenance.sourceHead,head);
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
  assert.equal(sha(JSON.stringify(canonical(provenance))),sha(JSON.stringify(canonical(expected.provenance))),'Candidate provenance differs from fresh exact source/asset declarations');
  assert.deepEqual(Object.keys(outputs).sort(),Object.keys(expected.outputs).sort(),'Candidate must have exactly the compiler/builder-declared output set');
  for(const [relative,bytes] of Object.entries(outputs)) {
    assert.ok(!path.isAbsolute(relative)&&!relative.split('/').includes('..'));assert.ok(Buffer.isBuffer(bytes));
    assert.ok(!/(?:^|\/)(?:_worker\.js|_routes\.json|.*\.private\..*|SELECTION\.json)$/.test(relative),'No gateway or private resource file in ASSETS');
    const declared=expected.outputs[relative];assert.ok(Buffer.isBuffer(declared));assert.equal(bytes.length,declared.length,'Candidate byte length differs: '+relative);assert.equal(sha(bytes),sha(declared),'Candidate bytes differ: '+relative);
  }
  assert.ok(Object.hasOwn(outputs,'application.js'));
  return {sourceHead:head,sourceDirty:false,gatewayIncluded:false,inputs:provenance.inputs.length,assets:provenance.assets.length,outputs:Object.fromEntries(Object.entries(outputs).sort(([a],[b])=>a.localeCompare(b)).map(([file,bytes])=>[file,{bytes:bytes.length,sha256:sha(bytes)}])),provenanceSha256:sha(JSON.stringify(provenance))};
}

// Own local build/source reads only; no fixture, native or browser resource access.
export async function attestCareBrowserApplication(root=careBrowserRoot) {
  assert.equal(root,careBrowserRoot);assert.equal(await realpath(root),root);
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const head=git('rev-parse','HEAD'),dirty=git('status','--porcelain')!=='';
  git('merge-base','--is-ancestor',careBrowserPins.parentCommit,head);
  assert.equal(dirty,false,'Run from a clean committed checkout');
  const directory=path.join(root,'.local-artifacts/portal-rebuild/application');
  const {expectedCareBrowserApplication}=await import('./rebuild-care-native-browser-compile.mjs'),expected=await expectedCareBrowserApplication({sourceHead:head}),outputs=Object.create(null);
  async function visit(dir,prefix='') {for(const e of await readdir(dir,{withFileTypes:true})) {assert.ok(!e.isSymbolicLink());const relative=prefix+e.name,file=path.join(dir,e.name);if(e.isDirectory())await visit(file,relative+'/');else{assert.ok(e.isFile());assert.ok(Object.hasOwn(expected.outputs,relative),'Undeclared candidate output: '+relative);outputs[relative]=await readFile(file);}}}
  await visit(directory);
  assert.ok(outputs['application-provenance.json'],'Missing generated provenance');
  const provenance=JSON.parse(outputs['application-provenance.json']),receipt=validateCareBrowserApplication({provenance,head,dirty,outputs,expected});
  return {...receipt,directory,expectedDirectory:expected.expectedDirectory};
}
