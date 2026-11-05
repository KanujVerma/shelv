// Inert on import. Only an externally hash-pinned Parent host grant can start.
import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile,mkdir,lstat,readdir,open,realpath,readlink} from 'node:fs/promises';
import {constants,readFileSync,lstatSync,realpathSync} from 'node:fs';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire,registerHooks,isBuiltin,syncBuiltinESMExports} from 'node:module';
import workerThreads from 'node:worker_threads';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const HOST_PINS=Object.freeze({node:'/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node',
  root:'/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030',source:'359c6bf0c759357df648ca441e9e3d1c3d29398c',
  rollforwardSource:'72edabab3afe2532580da4a4069dea1edbd1b952',
  adapterSha256:'65a1830172bafccc00f59001f1ec346738297c5ced99fe5e554dc59313010322',
  runtimeManifestSha256:'2cc3c59ca1be485a60a83b243a5d6957ffc145349025546d0d1bfeb6885beb86',
  rootTargetSha256:'be2e06bcbd45665e2f2e191dafb5d6d284f0a2591987ad236a6efce02e21eb1e',
  portal:'https://127.0.0.1:58630',supabase:'https://127.0.0.1:58621'});
const self=fileURLToPath(import.meta.url),sha=value=>createHash('sha256').update(value).digest('hex');
const digest=/^[a-f0-9]{64}$/,uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const requireValue=(condition,code)=>{if(!condition)throw Error(code);};
const exact=(value,keys)=>requireValue(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join('|')===[...keys].sort().join('|'),'E_FIELDS');
const absolute=file=>typeof file==='string'&&path.isAbsolute(file)&&path.normalize(file)===file;
const below=(parent,file)=>absolute(file)&&file.startsWith(parent+path.sep);
const json=value=>JSON.stringify(value,null,2)+'\n';
function externallyPinned(bytes,expected){requireValue(typeof expected==='string'&&digest.test(expected),'E_EXTERNAL_GRANT');requireValue(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=65536&&sha(bytes)===expected,'E_EXTERNAL_GRANT');return JSON.parse(bytes);}

export function validateHostGrant(bytes,expectedGrantSha256,executorSha256){
  const g=externallyPinned(bytes,expectedGrantSha256);
  requireValue(g.schemaVersion===1,'E_M04_ROOT359_ONLY');
  const roll=g.schemaVersion===2;
  exact(g,['schemaVersion','ownerId','projectId','sourceCommit','sourceRoot','fixtureDirectory','descriptorFile','adapterPath','adapterSha256','executorSha256','dependencyRoots','authorization','expiresAt','actions',...(roll?['rollforward']:[])]);
  requireValue([1,2].includes(g.schemaVersion)&&uuid.test(g.ownerId)&&g.projectId==='sa-'+g.ownerId.replaceAll('-',''),'E_OWNER');
  requireValue(g.sourceRoot===HOST_PINS.root&&g.sourceCommit===(roll?HOST_PINS.rollforwardSource:HOST_PINS.source),'E_SOURCE');
  requireValue(below(path.join(g.sourceRoot,'.local-artifacts'),g.fixtureDirectory)&&g.descriptorFile===path.join(g.fixtureDirectory,roll?'DESCRIPTOR-V2.json':'DESCRIPTOR.json'),'E_PATH');
  requireValue(absolute(g.adapterPath)&&g.adapterSha256===HOST_PINS.adapterSha256,'E_ADAPTER');
  requireValue(digest.test(g.executorSha256)&&g.executorSha256===executorSha256,'E_EXECUTOR');
  requireValue(typeof g.authorization==='string'&&g.authorization.length>20,'E_AUTHORIZATION');
  requireValue(Number.isFinite(Date.parse(g.expiresAt))&&Date.parse(g.expiresAt)>Date.now(),'E_EXPIRED');
  const actions=roll?['code-rollforward','build','host','observe']:['build','host','observe'];
  requireValue(Array.isArray(g.actions)&&g.actions.length===actions.length&&actions.every(action=>g.actions.includes(action)),'E_ACTIONS');
  if(roll)validateRollforwardFields(g);
  const allowed=['node_modules','apps/portal/node_modules','apps/portal/session-integration/runtime/node_modules','apps/portal/session-integration/runtime'].map(name=>path.join(g.sourceRoot,name));
  requireValue(Array.isArray(g.dependencyRoots)&&g.dependencyRoots.length>0&&g.dependencyRoots.length<=4,'E_DEPENDENCIES');
  const seen=new Set();for(const entry of g.dependencyRoots){
    requireValue(entry&&Object.keys(entry).sort().join('|')==='manifestFile|manifestSha256|path'&&allowed.includes(entry.path)&&!seen.has(entry.path)&&absolute(entry.manifestFile)&&digest.test(entry.manifestSha256),'E_DEPENDENCIES');seen.add(entry.path);
  }
  requireValue(g.dependencyRoots.some(entry=>entry.path===path.join(HOST_PINS.root,'apps/portal/session-integration/runtime')&&entry.manifestSha256===HOST_PINS.runtimeManifestSha256),'E_M04_RUNTIME_CLOSURE');
  return Object.freeze(g);
}
function validateRollforwardFields(g){
  const r=g.rollforward,base=g.fixtureDirectory,old=path.join(base,'account-host');
  exact(r,['previousSourceCommit','previousSourceSha256','previousDescriptorSha256','sourceFile','sourceSha256','descriptorSha256','resourcesSha256','runtimeLedgerSha256','previousStartReceipt','previousClosedReceipt','previousStopGrant','browserReturnReference','privateFingerprints','persistenceDirectory']);
  requireValue(r.previousSourceCommit===HOST_PINS.source,'E_SOURCE');
  for(const name of ['previousSourceSha256','previousDescriptorSha256','sourceSha256','descriptorSha256','resourcesSha256','runtimeLedgerSha256'])requireValue(digest.test(r[name]),'E_ROLL_HASH');
  requireValue(r.sourceFile===path.join(base,'SOURCE-V2.json'),'E_PATH');
  requireValue(r.persistenceDirectory===path.join(old,'bundle'),'E_PERSISTENCE');
  for(const [name,pattern]of [['previousStartReceipt',/^START\.json$/],['previousClosedReceipt',/^CLOSE-[a-f0-9-]{36}\.json$/],['previousStopGrant',/^STOP-GRANT-[a-f0-9-]{36}\.json$/]]){
    exact(r[name],['file','sha256']);const selectedParentStop=name==='previousStopGrant'&&absolute(r[name].file)&&path.basename(r[name].file)==='HOST-STOP-R8-CODE1.json';
    requireValue(((path.dirname(r[name].file)===old&&pattern.test(path.basename(r[name].file)))||selectedParentStop)&&digest.test(r[name].sha256),'E_ROLL_RECEIPT');
  }
  exact(r.privateFingerprints,['caSha256','portalCertificateSha256','portalKeySha256','envelopeSha256','anonKeySha256']);
  for(const value of Object.values(r.privateFingerprints))requireValue(digest.test(value),'E_ROLL_HASH');
  requireValue(typeof r.browserReturnReference==='string'&&r.browserReturnReference.length>20,'E_BROWSER_RETURN');
}
export function hostOutputLayout(g){
  if(g.schemaVersion===2){validateRollforwardFields(g);return {artifactDirectory:path.join(g.fixtureDirectory,'account-host-code2'),persistenceDirectory:g.rollforward.persistenceDirectory};}
  requireValue(g.schemaVersion===1&&!Object.hasOwn(g,'rollforward'),'E_FIELDS');return {artifactDirectory:path.join(g.fixtureDirectory,'m04-host'),persistenceDirectory:null};
}
export function priorHostIdentityPresent(prior,observed){
  const start=(value,pid)=>{const parts=String(value).trim().split(/\s+/);requireValue(Number.isInteger(pid)&&pid>0&&Number(parts[0])===pid&&parts.length>=8&&/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/.test(parts[2])&&/^\d{2}:\d{2}:\d{2}$/.test(parts[5])&&/^\d{4}$/.test(parts[6]),'E_PRIOR_PROCESS');return parts.slice(2,7).join(' ');};
  const expected=start(prior?.ps,prior?.pid);return observed===null?false:start(observed,prior.pid)===expected;
}
/** Structural lineage checks. Actual files/hashes/process absence are checked below. */
export function validateRollforwardMetadata(g,{sourceV2:s,previousSource:old,previousDescriptor:d0,descriptor:d,resources,start,closed,stop}){
  const r=g.rollforward;
  requireValue(g.schemaVersion===2&&g.sourceCommit===HOST_PINS.rollforwardSource,'E_SOURCE');
  exact(s,['schemaVersion','kind','stage','ownerId','projectId','fixtureDirectory','basePacketSha256','previousSourceCommit','previousSourceSha256','previousDescriptorSha256','resourcesSha256','runtimeLedgerSha256','sourceCommit','executor','configSha256','ledger','cli','openssl','source','descriptorV2Sha256','liveResources','recordedAt']);
  requireValue(s.schemaVersion===2&&s.kind==='preserved_live_code_roll_forward_v1'&&s.stage==='LIVE_CODE_SOURCE_V2','E_SOURCE_V2');
  requireValue(s.ownerId===g.ownerId&&s.projectId===g.projectId&&s.fixtureDirectory===g.fixtureDirectory&&s.sourceCommit===g.sourceCommit&&s.previousSourceCommit===HOST_PINS.source&&old.sourceCommit===HOST_PINS.source,'E_SOURCE_V2');
  for(const key of ['previousSourceSha256','previousDescriptorSha256','resourcesSha256','runtimeLedgerSha256'])requireValue(s[key]===r[key],'E_ROLL_LINEAGE');
  requireValue(s.descriptorV2Sha256===r.descriptorSha256&&digest.test(s.basePacketSha256)&&Number.isFinite(Date.parse(s.recordedAt)),'E_ROLL_LINEAGE');
  exact(s.executor,['path','sha256']);requireValue(absolute(s.executor.path)&&digest.test(s.executor.sha256),'E_SOURCE_V2');
  for(const key of ['configSha256','ledger','cli','openssl'])assert.deepEqual(s[key],old[key],'E_IMMUTABLE_SOURCE');
  requireValue(s.ledger?.migrationCount===68&&s.ledger.files?.length===68,'E_IMMUTABLE_SOURCE');
  exact(s.source,['head','indexSha256','status','files','sha256']);
  requireValue(s.source.head===g.sourceCommit&&digest.test(s.source.indexSha256)&&typeof s.source.status==='string'&&Array.isArray(s.source.files)&&s.source.files.length>0&&s.source.files.length<=10000,'E_SOURCE_SNAPSHOT');
  const names=new Set();for(const file of s.source.files){exact(file,['name','kind','mode','bytes','sha256']);requireValue(typeof file.name==='string'&&file.name.length>0&&!path.isAbsolute(file.name)&&path.normalize(file.name)===file.name&&!file.name.split(path.sep).includes('..')&&!names.has(file.name)&&['file','symlink'].includes(file.kind)&&Number.isInteger(file.mode)&&file.mode>=0&&file.mode<=0o777&&Number.isSafeInteger(file.bytes)&&file.bytes>=0&&digest.test(file.sha256),'E_SOURCE_SNAPSHOT');names.add(file.name);}
  requireValue(s.source.sha256===sha(json(s.source.files)),'E_SOURCE_SNAPSHOT');
  requireValue(d0.sourceCommit===HOST_PINS.source&&d0.ownerId===g.ownerId&&d0.projectId===g.projectId&&d0.fixtureDirectory===g.fixtureDirectory,'E_DESCRIPTOR');
  assert.deepEqual(d,{...d0,sourceCommit:g.sourceCommit,fingerprints:{...d0.fingerprints,source:'SOURCE-V2.json'}},'E_IMMUTABLE_DESCRIPTOR');
  requireValue(resources.ownerId===g.ownerId&&resources.projectId===g.projectId,'E_RESOURCES');
  const ids=resources.containers.map(row=>row.id).sort();requireValue(ids.length>0&&new Set(ids).size===ids.length,'E_RESOURCES');
  exact(s.liveResources,['containers','volumes','networks']);assert.deepEqual(s.liveResources.containers.map(row=>row.id).sort(),ids,'E_RESOURCES');
  for(const row of s.liveResources.containers){const original=resources.containers.find(item=>item.id===row.id);requireValue(row.running===true&&row.projectId===g.projectId&&row.workdir===g.fixtureDirectory,'E_RESOURCES');for(const key of ['name','imageId','created','startedAt'])if(original[key]!==undefined)assert.deepEqual(row[key],original[key],'E_RESOURCES');
    if(original.networkSettings?.Ports!==undefined)assert.deepEqual(row.ports,original.networkSettings.Ports,'E_RESOURCES');
    if(resources.at!==undefined)requireValue(Number.isFinite(Date.parse(row.startedAt))&&Date.parse(row.startedAt)<=Date.parse(resources.at),'E_RESOURCES');
  }
  assert.deepEqual(s.liveResources.volumes.map(row=>row.name).sort(),resources.volumes.map(row=>row.name??row.Name).sort(),'E_RESOURCES');
  assert.deepEqual(s.liveResources.networks.map(row=>row.id).sort(),resources.networks.map(row=>row.id??row.Id).sort(),'E_RESOURCES');
  for(const receipt of [start,closed])requireValue(receipt.ownerId===g.ownerId&&receipt.projectId===g.projectId&&receipt.resourcesSha256===r.resourcesSha256&&digest.test(receipt.grantSha256)&&digest.test(receipt.executorSha256),'E_PRIOR_RECEIPT');
  requireValue(start.descriptorSha256===r.previousDescriptorSha256&&closed.grantSha256===start.grantSha256&&closed.executorSha256===start.executorSha256,'E_PRIOR_RECEIPT');
  requireValue(closed.stage==='HOST_CLOSED_RETAINED'&&closed.closed===true&&Array.isArray(closed.uncertainty)&&closed.uncertainty.length===0&&closed.reason==='authorized-browser-return','E_PRIOR_CLOSE');
  requireValue(closed.process?.pid===start.process?.pid&&priorHostIdentityPresent(start.process,closed.process.ps),'E_PRIOR_PROCESS');
  assert.deepEqual([...start.containerIds].sort(),ids,'E_PRIOR_RECEIPT');assert.deepEqual([...closed.containerIds].sort(),ids,'E_PRIOR_RECEIPT');
  requireValue(stop.schemaVersion===1&&stop.ownerId===g.ownerId&&stop.projectId===g.projectId&&stop.executorSha256===start.executorSha256&&stop.startGrantSha256===start.grantSha256&&stop.browserReturnReference===r.browserReturnReference&&Array.isArray(stop.actions)&&stop.actions.length===1&&stop.actions[0]==='stop','E_BROWSER_RETURN');
}
async function pinnedJson(file,expected){const bytes=await regularBytes(file,true);requireValue(sha(bytes)===expected,'E_ROLL_FILE_HASH');return JSON.parse(bytes);}
async function verifySnapshot(root,snapshot){
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16_000_000});
  requireValue(git(['rev-parse','HEAD']).trim()===snapshot.head&&sha(git(['ls-files','--stage','-z']))===snapshot.indexSha256&&git(['status','--porcelain=v1','-z'])===snapshot.status,'E_SOURCE_SNAPSHOT');
  assert.deepEqual(git(['ls-files','-z']).split('\0').filter(Boolean),snapshot.files.map(row=>row.name),'E_SOURCE_SNAPSHOT');
  for(const row of snapshot.files){const file=path.join(root,row.name);await noLinks(path.dirname(file));const stat=await lstat(file);requireValue((row.kind==='file'?stat.isFile()&&!stat.isSymbolicLink():stat.isSymbolicLink())&&(stat.mode&0o777)===row.mode,'E_SOURCE_SNAPSHOT');
    const bytes=row.kind==='symlink'?Buffer.from(await readlink(file)):await regularBytes(file);requireValue(bytes.length===row.bytes&&sha(bytes)===row.sha256,'E_SOURCE_SNAPSHOT');}
}
async function verifyRollforwardFiles(g,descriptor,resources){
  const r=g.rollforward,base=g.fixtureDirectory;
  const s=await pinnedJson(r.sourceFile,r.sourceSha256),old=await pinnedJson(path.join(base,'SOURCE.json'),r.previousSourceSha256),d0=await pinnedJson(path.join(base,'DESCRIPTOR.json'),r.previousDescriptorSha256);
  const start=await pinnedJson(r.previousStartReceipt.file,r.previousStartReceipt.sha256),closed=await pinnedJson(r.previousClosedReceipt.file,r.previousClosedReceipt.sha256),stop=await pinnedJson(r.previousStopGrant.file,r.previousStopGrant.sha256);
  validateRollforwardMetadata(g,{sourceV2:s,previousSource:old,previousDescriptor:d0,descriptor,resources,start,closed,stop});
  const packet=await regularBytes(path.join(base,'PACKET.json'),true);requireValue(sha(packet)===s.basePacketSha256,'E_ROLL_LINEAGE');
  const p=JSON.parse(packet);requireValue(p.ownerId===g.ownerId&&p.projectId===g.projectId&&p.fixtureDirectory===base&&p.sourceCommit===HOST_PINS.source,'E_ROLL_LINEAGE');
  requireValue(sha(await regularBytes(path.join(base,'supabase/config.toml'),true))===s.configSha256,'E_IMMUTABLE_SOURCE');
  requireValue(sha(await regularBytes(s.executor.path))===s.executor.sha256,'E_SOURCE_V2');await verifySnapshot(g.sourceRoot,s.source);
  let observed;try{observed=execFileSync('/bin/ps',['-p',String(start.process.pid),'-o','pid=,ppid=,lstart=,comm='],{encoding:'utf8'}).trim();}catch(error){if(error.status===1)observed=null;else throw error;}
  requireValue(!priorHostIdentityPresent(start.process,observed),'E_PRIOR_HOST_STILL_LIVE');
  await noLinks(r.persistenceDirectory);await noLinks(path.join(r.persistenceDirectory,'resources'));await noLinks(path.join(r.persistenceDirectory,'isolated'));
  const names={'fixture-ca.crt':'caSha256','portal-leaf.crt':'portalCertificateSha256','portal-leaf.key':'portalKeySha256','envelope-keys.json':'envelopeSha256','anon-key':'anonKeySha256'};
  for(const [name,key]of Object.entries(names))requireValue(sha(await regularBytes(path.join(descriptor.privateDirectory,name),true))===r.privateFingerprints[key],'E_PRESERVED_KEYS');
  requireValue(sha(await regularBytes(path.join(descriptor.privateDirectory,'status.private.json'),true))===start.statusSha256,'E_PRESERVED_STATUS');
  return {sourceV2:s,start,closed};
}
export function validateHostStop(bytes,expectedSha256,started){
  const g=externallyPinned(bytes,expectedSha256);
  exact(g,['schemaVersion','ownerId','projectId','executorSha256','startGrantSha256','authorization','expiresAt','actions',...(Object.hasOwn(g,'browserReturnReference')?['browserReturnReference']:[])]);
  requireValue(typeof g.browserReturnReference==='string'&&g.browserReturnReference.length>20,'E_BROWSER_RETURN');
  requireValue(g.schemaVersion===1&&g.ownerId===started.grant.ownerId&&g.projectId===started.grant.projectId&&g.executorSha256===started.grant.executorSha256&&g.startGrantSha256===started.grantSha256,'E_STOP_BINDING');
  requireValue(typeof g.authorization==='string'&&g.authorization.length>20,'E_AUTHORIZATION');
  requireValue(Date.parse(g.expiresAt)>Date.now(),'E_EXPIRED');
  requireValue(Array.isArray(g.actions)&&g.actions.length===1&&g.actions[0]==='stop','E_ACTIONS');return g;
}
export function parseHostArguments(args){
  requireValue(args.length===3&&args[0]==='start'&&absolute(args[1])&&digest.test(args[2]),'E_ARGUMENTS');
  return {grantFile:args[1],expectedGrantSha256:args[2]};
}
async function noLinks(directory){
  requireValue(absolute(directory),'E_PATH');let current=path.parse(directory).root;
  for(const part of directory.split(path.sep).filter(Boolean)){current=path.join(current,part);const st=await lstat(current);requireValue(st.isDirectory()&&!st.isSymbolicLink(),'E_PATH_SYMLINK');}
  requireValue(await realpath(directory)===directory,'E_PATH_CANONICAL');
}
async function regularBytes(file,privateMode=false){
  await noLinks(path.dirname(file));const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{const st=await handle.stat();requireValue(st.isFile()&&(!privateMode||(st.mode&0o7777)===0o600),'E_FILE_MODE');return await handle.readFile();}finally{await handle.close();}
}
async function absent(file){try{await lstat(file);}catch(error){if(error.code==='ENOENT')return;throw error;}throw Error('E_NEW_PATH_EXISTS');}
async function save(file,value){await writeFile(file,json(value),{flag:'wx',mode:0o600});}
export async function inventoryHostDependencies(root,allowedRoots=[root]){
  requireValue(allowedRoots.includes(root),'E_DEPENDENCY_ROOT');
  for(const directory of allowedRoots)await noLinks(directory);
  await noLinks(root);const files=[];
  async function visit(directory){for(const name of (await readdir(directory)).sort()){
    const file=path.join(directory,name),stat=await lstat(file),relative=path.relative(root,file),mode=stat.mode&0o7777;
    if(stat.isSymbolicLink()){
      const target=await readlink(file),resolved=await realpath(file);requireValue(allowedRoots.some(directory=>resolved===directory||below(directory,resolved)),'E_DEPENDENCY_SYMLINK');
      const targetStat=await lstat(resolved);requireValue(targetStat.isDirectory()||targetStat.isFile(),'E_DEPENDENCY_KIND');
      files.push({path:relative,kind:'symlink',mode,target,resolved,...(targetStat.isFile()?{targetSha256:sha(await readFile(resolved))}:{})});
    }else if(stat.isDirectory()){files.push({path:relative,kind:'directory',mode});await visit(file);}
    else{requireValue(stat.isFile(),'E_DEPENDENCY_KIND');files.push({path:relative,kind:'file',mode,sha256:sha(await readFile(file))});}
  }}await visit(root);return files;
}
async function verifyDependencies(grant){
  const manifests=[],roots=grant.dependencyRoots.map(entry=>entry.path),rows=[];
  for(const entry of grant.dependencyRoots){const bytes=await regularBytes(entry.manifestFile);requireValue(sha(bytes)===entry.manifestSha256,'E_DEPENDENCY_MANIFEST');
    const manifest=JSON.parse(bytes);exact(manifest,['files']);assert.deepEqual(await inventoryHostDependencies(entry.path,roots),manifest.files,'E_DEPENDENCY_BYTES');
    for(const row of manifest.files)rows.push({...row,absolute:path.join(entry.path,row.path)});manifests.push({...entry});
  }
  const covered=new Set([...roots,...rows.filter(row=>row.kind!=='symlink').map(row=>row.absolute)]);
  for(const row of rows)if(row.kind==='symlink')requireValue(covered.has(row.resolved),'E_DEPENDENCY_TARGET_UNMANIFESTED');
  return {manifests,files:new Map(rows.filter(row=>row.kind==='file').map(row=>[row.absolute,row.sha256]))};
}
async function closedDependencyEntry(grant,name,from){
  const entry=await realpath(createRequire(from).resolve(name));
  for(const root of grant.dependencyRoots){if(!below(root.path,entry))continue;
    const bytes=await regularBytes(root.manifestFile);requireValue(sha(bytes)===root.manifestSha256,'E_DEPENDENCY_MANIFEST');
    const row=JSON.parse(bytes).files.find(row=>row.path===path.relative(root.path,entry)&&row.kind==='file');
    if(row){requireValue(sha(await regularBytes(entry))===row.sha256,'E_DEPENDENCY_BYTES');return entry;}
  }throw Error('E_DEPENDENCY_ENTRY_UNMANIFESTED');
}
/** Every ordinary ESM/CJS transitive resolution must name manifested bytes. */
export function createHostModuleHooks(fileHashes){
  const verify=url=>{
    if(url.startsWith('node:')&&isBuiltin(url))return;
    requireValue(url.startsWith('file:'),'E_DEPENDENCY_MODULE_UNMANIFESTED');
    const file=realpathSync(fileURLToPath(url)),expected=fileHashes.get(file);
    requireValue(typeof expected==='string'&&lstatSync(file).isFile(),'E_DEPENDENCY_MODULE_UNMANIFESTED');
    requireValue(sha(readFileSync(file))===expected,'E_DEPENDENCY_BYTES');
  };
  return {
    resolve(specifier,context,nextResolve){const result=nextResolve(specifier,context);verify(result.url);return result;},
    load(url,context,nextLoad){verify(url);return nextLoad(url,context);},
  };
}
/** A hash-bound memory preload carries the same guard into SDK Worker threads. */
export async function installHostModuleGuard(files,manifestFile){
  const bytes=Buffer.from(json([...files]));await writeFile(manifestFile,bytes,{flag:'wx',mode:0o600});
  const expected=sha(bytes);
  const preload=`import{registerHooks,isBuiltin,syncBuiltinESMExports}from'node:module';import workerThreads from'node:worker_threads';workerThreads.Worker=function(){throw Error('E_DEPENDENCY_NESTED_WORKER');};syncBuiltinESMExports();import{readFileSync,lstatSync,realpathSync}from'node:fs';import{createHash}from'node:crypto';import{fileURLToPath}from'node:url';const requireValue=${requireValue.toString()};const sha=value=>createHash('sha256').update(value).digest('hex');const bytes=readFileSync(${JSON.stringify(manifestFile)});requireValue(sha(bytes)===${JSON.stringify(expected)},'E_DEPENDENCY_MANIFEST');registerHooks((${createHostModuleHooks.toString()})(new Map(JSON.parse(bytes))));`;
  const preloadUrl='data:text/javascript;base64,'+Buffer.from(preload).toString('base64'),previous=workerThreads.Worker,workers=[];
  const classic=`;(()=>{const{registerHooks,isBuiltin,syncBuiltinESMExports}=require('node:module');const workerThreads=require('node:worker_threads');workerThreads.Worker=function(){throw Error('E_DEPENDENCY_NESTED_WORKER');};syncBuiltinESMExports();const{readFileSync,lstatSync,realpathSync}=require('node:fs');const{createHash}=require('node:crypto');const{fileURLToPath}=require('node:url');const requireValue=${requireValue.toString()};const sha=value=>createHash('sha256').update(value).digest('hex');const bytes=readFileSync(${JSON.stringify(manifestFile)});requireValue(sha(bytes)===${JSON.stringify(expected)},'E_DEPENDENCY_MANIFEST');registerHooks((${createHostModuleHooks.toString()})(new Map(JSON.parse(bytes))));})();\n`;
  const hooks=registerHooks(createHostModuleHooks(files));
  // This is the actual native Worker. The SDK's original eval body stays an
  // exact suffix after a denying guard; no fetch, authority or response is replaced.
  class ManifestedWorker extends previous{constructor(filename,options={}){
    const args=options.execArgv??process.execArgv;
    requireValue(!args.some(arg=>arg==='--import'||arg==='--require'||arg==='-r'||arg.startsWith('--import=')||arg.startsWith('--require=')),'E_DEPENDENCY_WORKER_PRELOAD');
    requireValue(!options.eval||(typeof filename==='string'&&options.type!=='module'),'E_DEPENDENCY_WORKER_FORMAT');
    const code=options.eval?classic+filename:filename;
    super(code,{...options,execArgv:options.eval?[...args]:[...args,'--import',preloadUrl]});
    const record={threadId:this.threadId,originalSourceSha256:options.eval?sha(filename):null,guardedSourceSha256:options.eval?sha(code):null,joined:false};
    record.join=new Promise(resolve=>this.once('exit',exitCode=>{record.joined=true;record.exitCode=exitCode;resolve();}));workers.push(record);
  }}
  workerThreads.Worker=ManifestedWorker;syncBuiltinESMExports();
  return {manifestFile,manifestSha256:expected,preloadSha256:sha(preload),workers:()=>workers.map(({join,...record})=>({...record})),joinWorkers:()=>Promise.all(workers.map(record=>record.join)),deregister(){
    requireValue(workers.every(record=>record.joined),'E_DEPENDENCY_WORKERS_UNJOINED');
    requireValue(workerThreads.Worker===ManifestedWorker,'E_DEPENDENCY_GUARD_OWNERSHIP');workerThreads.Worker=previous;syncBuiltinESMExports();hooks.deregister();
  }};
}
function identity(pid){
  const value=execFileSync('/bin/ps',['-p',String(pid),'-o','pid=,ppid=,lstart=,comm='],{encoding:'utf8'}).trim();
  requireValue(value.length>0&&Number(value.split(/\s+/)[0])===pid,'E_PROCESS_IDENTITY');return {pid,ps:value};
}
function ownProcesses(pid=process.pid){
  const result=[identity(pid)];let children=[];
  try{children=execFileSync('/usr/bin/pgrep',['-P',String(pid)],{encoding:'utf8'}).trim().split(/\s+/).filter(Boolean).map(Number);}catch(error){if(error.status!==1)throw error;}
  for(const child of children)try{result.push(...ownProcesses(child));}catch{result.push({pid:child,identityUncertain:true});}return result;
}
function handles(){return process._getActiveHandles().map(handle=>({kind:handle.constructor?.name??'unknown',...(typeof handle.address==='function'?{address:handle.address()}:{}),...(Number.isInteger(handle.pid)?{pid:handle.pid}:{})}));}
async function bounded(promise,label,ms=30000){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label)),ms);})]);}finally{clearTimeout(timer);}}

/** Actual start only. No injectable successful runtime, Auth port or Vault. */
export async function startAccountHost({grantBytes,expectedGrantSha256,signal}={}){
  // Missing/incorrect external hash refuses before source, private or SDK reads.
  externallyPinned(grantBytes,expectedGrantSha256);
  const executorSha256=sha(await regularBytes(self));
  const grant=validateHostGrant(grantBytes,expectedGrantSha256,executorSha256);
  const checkpoint=()=>{if(signal?.aborted)throw Error('E_START_ABORTED');};checkpoint();
  requireValue(process.execPath===HOST_PINS.node,'E_NODE');
  requireValue(execFileSync('git',['rev-parse','HEAD'],{cwd:grant.sourceRoot,encoding:'utf8'}).trim()===grant.sourceCommit,'E_SOURCE');
  const adapterBytes=await regularBytes(grant.adapterPath);requireValue(sha(adapterBytes)===HOST_PINS.adapterSha256,'E_ADAPTER');
  await noLinks(grant.fixtureDirectory);
  const descriptorBytes=await regularBytes(grant.descriptorFile,true),descriptor=JSON.parse(descriptorBytes);
  requireValue(descriptor.ownerId===grant.ownerId&&descriptor.projectId===grant.projectId&&descriptor.sourceCommit===grant.sourceCommit&&descriptor.fixtureDirectory===grant.fixtureDirectory&&descriptor.privateDirectory===path.join(grant.fixtureDirectory,'private'),'E_DESCRIPTOR');
  if(grant.schemaVersion===2)requireValue(sha(descriptorBytes)===grant.rollforward.descriptorSha256,'E_ROLL_FILE_HASH');
  requireValue(descriptor.endpoints?.portal===HOST_PINS.portal&&descriptor.endpoints?.supabase===HOST_PINS.supabase,'E_ENDPOINTS');
  requireValue(descriptor.fingerprints?.resources==='private/RESOURCES.json','E_RESOURCES');
  const resourceBytes=await regularBytes(path.join(grant.fixtureDirectory,'private/RESOURCES.json'),true),resources=JSON.parse(resourceBytes);
  requireValue(resources.ownerId===grant.ownerId&&resources.projectId===grant.projectId&&Array.isArray(resources.containers)&&resources.containers.length>0&&resources.containers.every(item=>/^[a-f0-9]{64}$/.test(item.id)&&item.running===true),'E_RESOURCES');
  const layout=hostOutputLayout(grant),artifactDirectory=layout.artifactDirectory,privateDirectory=descriptor.privateDirectory;
  await absent(artifactDirectory);
  let preserved;
  if(grant.schemaVersion===2){requireValue(sha(resourceBytes)===grant.rollforward.resourcesSha256,'E_RESOURCES');preserved=await verifyRollforwardFiles(grant,descriptor,resources);}
  else{await absent(path.join(privateDirectory,'anon-key'));await absent(path.join(privateDirectory,'envelope-keys.json'));}
  requireValue(((await lstat(privateDirectory)).mode&0o7777)===0o700,'E_FILE_MODE');
  const dependencyClosure=await verifyDependencies(grant),dependencies=dependencyClosure.manifests;
  await closedDependencyEntry(grant,'esbuild',path.join(grant.sourceRoot,'apps/portal/package.json'));
  const runtimeEntry=await closedDependencyEntry(grant,'miniflare',path.join(grant.sourceRoot,'apps/portal/session-integration/runtime/package.json'));
  let status,statusSha256=preserved?.start.statusSha256;
  if(!preserved){const bytes=await regularBytes(path.join(privateDirectory,'status.private.json'),true);status=JSON.parse(bytes);statusSha256=sha(bytes);
    requireValue(status.API_URL===HOST_PINS.supabase&&typeof status.ANON_KEY==='string'&&status.ANON_KEY.length>0,'E_STATUS');
    let claims;try{claims=JSON.parse(Buffer.from(status.ANON_KEY.split('.')[1],'base64url'));}catch{}
    requireValue(claims?.role==='anon','E_ANON_KEY');
  }
  await mkdir(artifactDirectory,{mode:0o700});
  const started={grant,grantSha256:expectedGrantSha256},processIdentity=identity(process.pid);
  let runtime,server,plan,moduleHooks,closed=false,closeInFlight;const sockets=new Set(),socketCloses=[];
  let stage='GRANT_VALIDATED';
  const receipt={schemaVersion:1,ownerId:grant.ownerId,projectId:grant.projectId,grantSha256:expectedGrantSha256,executorSha256,
    descriptorSha256:sha(descriptorBytes),statusSha256,resourcesSha256:sha(resourceBytes),containerIds:resources.containers.map(item=>item.id),
    process:processIdentity,startedAt:new Date().toISOString(),artifactDirectory,...(preserved?{rollforward:grant.rollforward,sourceCommit:grant.sourceCommit}:{} )};
  const observe=async()=>{
    const privateScanFile=path.join(artifactDirectory,'private-scan-'+randomUUID()+'.json');await save(privateScanFile,{values:plan?.privateScanValues()??[]});
    const result={...receipt,stage,observedAt:new Date().toISOString(),processes:ownProcesses(),handles:handles(),
      dependencyWorkers:moduleHooks?.workers()??[],httpsAddress:server?.listening?server.address():null,privateFingerprints:plan?.privateFileFingerprints()??null,providerCalls:plan?.observations()??[],privateScanFile};
    await save(path.join(artifactDirectory,'OBSERVATION-'+randomUUID()+'.json'),result);return result;
  };
  const close=async(reason)=>{
    if(closeInFlight)return closeInFlight;
    closeInFlight=(async()=>{
      const uncertainty=[];stage='CLOSING';
      if(server){try{
        const joined=new Promise((resolve,reject)=>{if(!server.listening)return resolve();server.close(error=>error?reject(error):resolve());});
        server.closeIdleConnections();for(const socket of sockets)socket.destroy();
        await bounded(Promise.all([joined,...socketCloses]),'E_SERVER_CLOSE_UNCERTAIN');
      }catch{uncertainty.push('server-close');}}
      if(runtime)try{await bounded(runtime.dispose(),'E_MINIFLARE_DISPOSE_UNCERTAIN');}catch{uncertainty.push('miniflare-dispose');}
      if(moduleHooks)try{await bounded(moduleHooks.joinWorkers(),'E_DEPENDENCY_WORKER_JOIN_UNCERTAIN');}catch{uncertainty.push('dependency-workers-unjoined');}
      if(uncertainty.length===0&&moduleHooks){moduleHooks.deregister();moduleHooks=undefined;}
      closed=uncertainty.length===0;stage=closed?'HOST_CLOSED_RETAINED':'HOST_CLEANUP_UNCERTAIN';
      let processes;try{processes=ownProcesses();if(processes.length>1)uncertainty.push('descendant-processes-remain');}catch{uncertainty.push('process-identity');}
      if(uncertainty.length){closed=false;stage='HOST_CLEANUP_UNCERTAIN';}
      const result={...receipt,stage,reason,closed,uncertainty,processes:processes??[],handles:handles(),finishedAt:new Date().toISOString()};
      await save(path.join(artifactDirectory,'CLOSE-'+randomUUID()+'.json'),result);return result;
    })();return closeInFlight;
  };
  try{
    checkpoint();
    await save(path.join(artifactDirectory,'START.json'),{...receipt,dependencies,stage});
    if(!preserved){await writeFile(path.join(privateDirectory,'anon-key'),status.ANON_KEY,{flag:'wx',mode:0o600});
      await save(path.join(privateDirectory,'envelope-keys.json'),{active:'local',keys:{local:randomBytes(32).toString('base64url')}});
    }
    const modules=new Map(dependencyClosure.files);modules.set(await realpath(self),executorSha256);modules.set(await realpath(grant.adapterPath),HOST_PINS.adapterSha256);
    const notices=path.join(grant.sourceRoot,'apps/portal/scripts/emitted-notices.mjs');
    const noticeBytes=execFileSync('git',['show',grant.sourceCommit+':apps/portal/scripts/emitted-notices.mjs'],{cwd:grant.sourceRoot,maxBuffer:1048576});
    requireValue(sha(await regularBytes(notices))===sha(noticeBytes),'E_SOURCE');modules.set(await realpath(notices),sha(noticeBytes));
    moduleHooks=await installHostModuleGuard(modules,path.join(artifactDirectory,'module-closure.json'));
    await save(path.join(artifactDirectory,'MODULE-GUARD.json'),{manifestFile:moduleHooks.manifestFile,manifestSha256:moduleHooks.manifestSha256,preloadSha256:moduleHooks.preloadSha256});
    const adapter=await import(pathToFileURL(grant.adapterPath).href);
    plan=await adapter.prepareLocalBindings({sourceRoot:grant.sourceRoot,fixtureDescriptor:descriptor,privateDirectory,artifactDirectory:path.join(artifactDirectory,'bundle'),...(preserved?{rollforward:{previousSourceCommit:HOST_PINS.source,sourceCommit:grant.sourceCommit,persistenceDirectory:layout.persistenceDirectory,grantSha256:expectedGrantSha256}}:{})});
    if(preserved)assert.deepEqual(plan.nativePlan.persistence,{resources:path.join(layout.persistenceDirectory,'resources'),isolated:path.join(layout.persistenceDirectory,'isolated'),tmp:path.join(layout.persistenceDirectory,'tmp')},'E_PERSISTENCE');
    stage='BUILDING';await plan.build();checkpoint();await verifyDependencies(grant);
    const require=createRequire(path.join(grant.sourceRoot,'apps/portal/session-integration/runtime/package.json'));
    const entry=await realpath(require.resolve('miniflare'));requireValue(entry===runtimeEntry,'E_DEPENDENCY_RESOLUTION_CHANGED');
    let packageDirectory=path.dirname(entry),packageFound=false;
    for(let depth=0;depth<8&&below(grant.sourceRoot,packageDirectory);depth++,packageDirectory=path.dirname(packageDirectory)){
      try{const value=JSON.parse(await regularBytes(path.join(packageDirectory,'package.json')));if(value.name==='miniflare'){requireValue(value.version==='5.20261019.0-beta','E_OFFICIAL_RUNTIME_VERSION');packageFound=true;break;}}
      catch(error){if(error.code!=='ENOENT')throw error;}
    }
    requireValue(packageFound,'E_OFFICIAL_RUNTIME_VERSION');
    const official=await import(pathToFileURL(entry).href);requireValue(typeof official.Miniflare==='function'&&typeof official.convertV4MiniflareOptions==='function','E_OFFICIAL_RUNTIME');
    const nativeOptions=await plan.runtimeOptions();checkpoint();
    if(preserved)assert.deepEqual(plan.privateFileFingerprints(),grant.rollforward.privateFingerprints,'E_PRESERVED_KEYS');
    stage='NATIVE_ALLOCATING';runtime=new official.Miniflare({...official.convertV4MiniflareOptions(nativeOptions),telemetry:{enabled:false}});
    const ready=await bounded(runtime.ready,'E_NATIVE_READY_TIMEOUT',60000);requireValue(new URL(String(ready)).hostname==='127.0.0.1','E_NATIVE_ENDPOINT');
    checkpoint();server=await plan.createHttpsHost(runtime);checkpoint();
    server.on('connection',socket=>{sockets.add(socket);socketCloses.push(new Promise(resolve=>socket.once('close',()=>{sockets.delete(socket);resolve();})));});
    stage='HTTPS_BINDING';await bounded(new Promise((resolve,reject)=>{server.once('error',reject);server.listen(58630,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});}),'E_HTTPS_LISTEN_TIMEOUT');
    requireValue(server.listening&&server.address()?.address==='127.0.0.1'&&server.address()?.port===58630,'E_HTTPS_ENDPOINT');
    checkpoint();stage='HOST_LISTENING_NOT_ACCEPTED';const actual=await observe();await save(path.join(artifactDirectory,'LISTENING.json'),actual);
    return Object.freeze({receipt:actual,observe,
      async stop({grantBytes:stopBytes,expectedGrantSha256:stopHash}){const stopGrant=validateHostStop(stopBytes,stopHash,started);await save(path.join(artifactDirectory,'STOP-GRANT-'+randomUUID()+'.json'),stopGrant);return close('authorized-browser-return');},
      fail:()=>close('caller-error'),
    });
  }catch(error){
    const failedStage=stage;let cleanup;
    try{cleanup=await close('start-error');}catch{cleanup={closed:false,uncertainty:['cleanup-record-or-handles']};}
    await save(path.join(artifactDirectory,'FAILURE-'+randomUUID()+'.json'),{...receipt,failedStage,code:/^E_[A-Z_]+$/.test(error.message)?error.message:'E_HOST_FAILURE',cleanup});
    const safe=Error('E_HOST_START_FAILED');safe.cleanup=cleanup;throw safe;
  }
}

async function main(){
  const args=parseHostArguments(process.argv.slice(2));requireValue(typeof process.send==='function'&&process.connected,'E_FORK_IPC_REQUIRED');
  const abort=new AbortController();let controller,authorizedClosed=false;
  const send=value=>process.connected?new Promise((resolve,reject)=>process.send(value,error=>error?reject(error):resolve())):Promise.reject(Error('E_IPC_DISCONNECTED'));
  const fail=async()=>{abort.abort();if(!controller)return;const cleanup=await controller.fail();try{await send({type:'host.failed',cleanup});}catch{}if(cleanup.closed&&process.connected)process.disconnect();process.exitCode=1;};
  // Install ownership/error fences before build or native allocation begins.
  process.once('disconnect',()=>{if(!authorizedClosed)void fail().catch(()=>{process.exitCode=1;});});
  process.once('uncaughtException',()=>{void fail();});process.once('unhandledRejection',()=>{void fail();});
  for(const name of ['SIGTERM','SIGINT'])process.on(name,()=>{if(!controller)abort.abort();else void send({type:'host.stop-requires-browser-return'}).catch(fail);});
  controller=await startAccountHost({grantBytes:await regularBytes(args.grantFile,true),expectedGrantSha256:args.expectedGrantSha256,signal:abort.signal});
  if(abort.signal.aborted){await fail();return;}
  let queue=Promise.resolve();
  process.on('message',message=>{queue=queue.then(async()=>{
    requireValue(message&&typeof message.requestId==='string'&&message.requestId.length<=128,'E_CONTROL');
    if(message.type==='observe')await send({type:'host.observation',requestId:message.requestId,observation:await controller.observe()});
    else if(message.type==='stop'){
      requireValue(absolute(message.grantFile)&&digest.test(message.expectedGrantSha256),'E_CONTROL');
      const cleanup=await controller.stop({grantBytes:await regularBytes(message.grantFile,true),expectedGrantSha256:message.expectedGrantSha256});
      await send({type:'host.stopped',requestId:message.requestId,cleanup});if(cleanup.closed){authorizedClosed=true;process.disconnect();}
    }else throw Error('E_CONTROL');
  }).catch(async()=>{try{await send({type:'host.control-rejected',requestId:typeof message?.requestId==='string'?message.requestId:null});}catch{await fail();}});});
  await send({type:'host.started',receipt:controller.receipt});
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
  main().catch(error=>{if(process.connected)process.send({type:'host.failed',code:'E_HOST_START_FAILED',cleanup:error.cleanup??null},()=>process.disconnect());
    process.stderr.write('Account host failed; consult retained private receipts.\n');process.exitCode=1;});
}

function m04Exact(value,keys,code){requireValue(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join('|')===[...keys].sort().join('|'),code);}
function m04Bytes(bytes,expected,code){requireValue(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=2000000&&digest.test(expected??'')&&sha(bytes)===expected,code);try{return JSON.parse(bytes);}catch{throw Error(code);}}
function m04Raw(capture,binding){
  m04Exact(capture,['binding','bytesBase64','sha256','capturedAt','error'],'E_M04_RAW');
  assert.deepEqual(capture.binding,binding,'E_M04_RAW_BINDING');
  requireValue(capture.error===null&&typeof capture.capturedAt==='string'&&Number.isFinite(Date.parse(capture.capturedAt)),'E_M04_CAPTURE');
  requireValue(typeof capture.bytesBase64==='string'&&capture.bytesBase64.length>0&&capture.bytesBase64.length<=2800000,'E_M04_RAW');
  const bytes=Buffer.from(capture.bytesBase64,'base64');requireValue(bytes.toString('base64')===capture.bytesBase64,'E_M04_RAW');
  return m04Bytes(bytes,capture.sha256,'E_M04_RAW_HASH');
}
function m04Http(capture,binding,audience,action){
  const value=m04Raw(capture,binding);m04Exact(value,['actorId','method','path','request','response'],'E_M04_HTTP');
  requireValue(uuid.test(value.actorId)&&value.method==='POST'&&value.path===`/api/${audience}/payments`&&value.request?.action===action&&value.request.schemaVersion===2&&value.response?.status===200,'E_M04_HTTP');
  requireValue(value.response.body&&typeof value.response.body==='object'&&value.response.body.schemaVersion===2,'E_M04_HTTP');
  const keys={advisor_read:['schemaVersion','action','clientId'],client_read:['schemaVersion','action'],issue_quote:['schemaVersion','action','requestId','expectedRevision','clientId','publicationVersion','serviceCents','servicePeriod','shippingAddressVersion','items','productSubtotalCents','taxCents','shippingCents','productTotalCents','totalCents'],submit_claim:['schemaVersion','action','requestId','expectedRevision','quoteId','quoteVersion','serviceCents','productCents','totalCents','shippingAddressVersion','paymentOptionId','evidenceId']}[action];
  m04Exact(value.request,keys,'E_M04_COMMAND');
  if(action==='issue_quote'||action==='submit_claim')requireValue(uuid.test(value.request.requestId)&&Number.isSafeInteger(value.request.expectedRevision)&&value.request.expectedRevision>=0,'E_M04_COMMAND');
  return value;
}
/** A byte/data join, not a resource grant or assertion of current authority.
 * The real caller/page/server must independently enforce every operation. */
export function preparePublicationInput(input){
  m04Exact(input,['descriptorBytes','expectedDescriptorSha256','binding','setupBytes','expectedSetupSha256','paymentBytes','expectedPaymentSha256','content'],'E_M04_INPUT_FIELDS');
  const {binding:b}=input;
  m04Exact(b,['ownerId','projectId','sourceCommit','rootTargetSha256','runtimeManifestSha256','adapterSha256','callerSha256','descriptorSha256'],'E_M04_BINDING');
  requireValue(uuid.test(b.ownerId)&&b.projectId==='sa-'+b.ownerId.replaceAll('-','')&&b.sourceCommit===HOST_PINS.source,'E_M04_BINDING');
  requireValue(b.rootTargetSha256===HOST_PINS.rootTargetSha256&&b.runtimeManifestSha256===HOST_PINS.runtimeManifestSha256&&b.adapterSha256===HOST_PINS.adapterSha256&&digest.test(b.callerSha256),'E_M04_BINDING');
  requireValue(input.expectedDescriptorSha256===b.descriptorSha256,'E_M04_DESCRIPTOR');
  const d=m04Bytes(input.descriptorBytes,input.expectedDescriptorSha256,'E_M04_DESCRIPTOR');
  requireValue(d.schemaVersion===1&&d.ownerId===b.ownerId&&d.projectId===b.projectId&&d.sourceCommit===b.sourceCommit&&d.endpoints?.portal===HOST_PINS.portal&&d.endpoints?.supabase===HOST_PINS.supabase,'E_M04_DESCRIPTOR');
  requireValue(below(path.join(HOST_PINS.root,'.local-artifacts'),d.fixtureDirectory)&&d.privateDirectory===path.join(d.fixtureDirectory,'private'),'E_M04_DESCRIPTOR');
  m04Exact(d.actors,['a','b'],'E_M04_PUBLIC_DESCRIPTOR');
  for(const actor of [d.actors.a,d.actors.b])requireValue(uuid.test(actor?.id)&&typeof actor.email==='string'&&actor.email.endsWith('.invalid'),'E_M04_ACTOR');
  const setup=m04Bytes(input.setupBytes,input.expectedSetupSha256,'E_M04_SETUP');
  m04Exact(setup,['schemaVersion','kind','binding','raw'],'E_M04_SETUP');
  requireValue(setup.schemaVersion===1&&setup.kind==='M04_SETUP_OBSERVATIONS','E_M04_SETUP');assert.deepEqual(setup.binding,b,'E_M04_SETUP_BINDING');
  m04Exact(setup.raw,['providerOwner','providerViewer','sql'],'E_M04_RAW');
  const expectedEmails={owner:'owner-'+b.ownerId.toLowerCase()+'@example.invalid',viewer:'viewer-'+b.ownerId.toLowerCase()+'@example.invalid'};
  const actors={};
  for(const [role,key] of [['owner','providerOwner'],['viewer','providerViewer']]){
    const actual=m04Raw(setup.raw[key],b);
    m04Exact(actual,['method','path','response'],'E_M04_PROVIDER');
    requireValue(actual.method==='POST'&&actual.path==='/auth/v1/admin/users'&&actual.response?.status===200,'E_M04_PROVIDER');
    const user=actual.response.body;requireValue(uuid.test(user?.id)&&user.email===expectedEmails[role]&&user.is_anonymous===false,'E_M04_PROVIDER');
    actors[role]={id:user.id,email:user.email};
  }
  requireValue(new Set([d.actors.a.id,d.actors.b.id,actors.owner.id,actors.viewer.id]).size===4,'E_M04_ACTOR');
  const rows=m04Raw(setup.raw.sql,b);m04Exact(rows,['profiles','advisors','principals','policy'],'E_M04_ROWS');
  requireValue(Array.isArray(rows.profiles)&&rows.profiles.length===2&&Array.isArray(rows.advisors)&&rows.advisors.length===2&&Array.isArray(rows.principals)&&rows.principals.length===2,'E_M04_ROWS');
  for(const [role,actor] of Object.entries(actors)){
    const profiles=rows.profiles.filter(p=>p.id===actor.id),grants=rows.advisors.filter(p=>p.user_id===actor.id),principals=rows.principals.filter(p=>p.actor_id===actor.id);
    requireValue(profiles.length===1&&profiles[0].email===actor.email&&profiles[0].deletion_started_at===null,'E_M04_PROFILE');
    requireValue(grants.length===1&&principals.length===1,'E_M04_ROWS');
    const g=grants[0],p=principals[0];
    m04Exact(profiles[0],['id','email','deletion_started_at'],'E_M04_PROFILE');
    m04Exact(g,['user_id','active','can_view','can_edit','can_publish','can_confirm_payments','can_admit_clients'],'E_M04_ROLE');
    m04Exact(p,['actor_id','kind','active'],'E_M04_ROLE');
    requireValue(g.active===true&&g.can_view===true&&g.can_admit_clients===false&&g.can_edit===(role==='owner')&&g.can_publish===(role==='owner')&&g.can_confirm_payments===(role==='owner'),'E_M04_ROLE');
    requireValue(p.active===true&&p.kind===(role==='owner'?'owner':'human'),'E_M04_ROLE');
  }
  const policy=rows.policy;
  m04Exact(policy,['singleton','activated','owner_actor_id','revision','require_kanuj_approval'],'E_M04_POLICY_CAS');
  requireValue(policy?.singleton===true&&policy.activated===true&&policy.owner_actor_id===actors.owner.id&&policy.require_kanuj_approval===true&&policy.revision===1,'E_M04_POLICY_CAS');
  const payment=m04Bytes(input.paymentBytes,input.expectedPaymentSha256,'E_M04_PAYMENT');
  m04Exact(payment,['schemaVersion','kind','binding','raw'],'E_M04_PAYMENT');
  requireValue(payment.schemaVersion===1&&payment.kind==='M04_UNVERIFIED_PAYMENT_OBSERVATIONS','E_M04_PAYMENT');assert.deepEqual(payment.binding,b,'E_M04_PAYMENT_BINDING');
  m04Exact(payment.raw,['before','quote','afterQuote','claim','sql'],'E_M04_RAW');
  const before=m04Http(payment.raw.before,b,'advisor','advisor_read');
  const quote=m04Http(payment.raw.quote,b,'advisor','issue_quote');
  const afterQuote=m04Http(payment.raw.afterQuote,b,'client','client_read');
  const claim=m04Http(payment.raw.claim,b,'client','submit_claim');
  requireValue(before.actorId===actors.owner.id&&quote.actorId===actors.owner.id&&afterQuote.actorId===d.actors.a.id&&claim.actorId===d.actors.a.id,'E_M04_PAYMENT_ACTOR');
  const q=quote.request,qr=quote.response.body;
  requireValue(q.clientId===d.actors.a.id&&before.request.clientId===d.actors.a.id&&q.expectedRevision===before.response.body.revision&&qr.revision===q.expectedRevision+1,'E_M04_PAYMENT_CAS');
  requireValue(q.publicationVersion===0&&q.serviceCents===10000&&q.servicePeriod===null&&q.shippingAddressVersion===null&&Array.isArray(q.items)&&q.items.length===0&&q.productSubtotalCents===0&&q.taxCents===0&&q.shippingCents===0&&q.productTotalCents===0&&q.totalCents===10000&&uuid.test(qr.quoteId),'E_M04_QUOTE');
  const quoted=afterQuote.response.body.quotes?.filter(x=>x.id===qr.quoteId);requireValue(quoted?.length===1,'E_M04_QUOTE');
  const actualQuote=quoted[0],c=claim.request,cr=claim.response.body;
  requireValue(qr.operation==='issue_quote'&&qr.status==='payable'&&qr.claimId===null&&qr.paymentOptionId===null&&cr.operation==='submit_claim'&&cr.status==='submitted_unverified','E_M04_RECEIPT');
  for(const receipt of [qr,cr])requireValue(receipt.serviceUnlocked===false&&receipt.serviceAccessStatus===null&&receipt.productOrderStatus===null,'E_M04_RECEIPT');
  requireValue(actualQuote.contractVersion===2&&actualQuote.publicationVersion===0&&actualQuote.status==='payable'&&Number.isSafeInteger(actualQuote.version)&&actualQuote.version>0,'E_M04_QUOTE');
  requireValue(actualQuote.serviceCents===10000&&actualQuote.productTotalCents===0&&actualQuote.totalCents===10000&&afterQuote.response.body.revision===qr.revision,'E_M04_QUOTE');
  requireValue(!Object.hasOwn(c,'clientId')&&c.quoteId===qr.quoteId&&c.quoteVersion===actualQuote.version&&c.expectedRevision===afterQuote.response.body.revision&&cr.revision===c.expectedRevision+1,'E_M04_PAYMENT_CAS');
  requireValue(c.serviceCents===10000&&c.productCents===0&&c.totalCents===10000&&c.shippingAddressVersion===null&&c.evidenceId===null&&uuid.test(c.paymentOptionId)&&uuid.test(cr.claimId)&&cr.quoteId===qr.quoteId&&cr.paymentOptionId===c.paymentOptionId,'E_M04_CLAIM');
  const options=actualQuote.paymentOptions?.filter(x=>x.id===c.paymentOptionId);requireValue(options?.length===1&&options[0].available===true&&Number.isSafeInteger(options[0].recipientVersion)&&options[0].recipientVersion>0,'E_M04_OPTION');
  const sql=m04Raw(payment.raw.sql,b);
  m04Exact(sql,['clientId','quoteId','quoteVersion','claimId','claimStatus','paymentOptionId','publishedVersion','confirmations','servicePeriods','publications','events','deliveries'],'E_M04_PAYMENT_ROWS');
  requireValue(sql.clientId===d.actors.a.id&&sql.quoteId===qr.quoteId&&sql.quoteVersion===actualQuote.version&&sql.claimId===cr.claimId&&sql.claimStatus==='submitted_unverified'&&sql.paymentOptionId===c.paymentOptionId&&sql.publishedVersion===0,'E_M04_PAYMENT_ROWS');
  for(const name of ['confirmations','servicePeriods','publications','events','deliveries'])requireValue(Array.isArray(sql[name])&&sql[name].length===0,'E_M04_PREPUBLICATION');
  const content=structuredClone(input.content),privateFacts=content?.context?.facts?.filter(f=>f.visibility==='advisor_only');
  requireValue(content?.schemaVersion===1&&typeof content.title==='string'&&content.title.includes('SYNTHETIC')&&privateFacts?.length===1&&typeof privateFacts[0].text==='string'&&privateFacts[0].text.includes('SYNTHETIC')&&privateFacts[0].text!==content.title&&content.context.facts.every(f=>Array.isArray(f.sources)&&f.sources.length===0),'E_M04_CONTENT');
  const moduleDescriptor=structuredClone(d);
  moduleDescriptor.actors.advisor=actors.owner;moduleDescriptor.actors.viewer=actors.viewer;
  moduleDescriptor.publicationScenario={clientId:d.actors.a.id,quoteId:qr.quoteId,claimId:cr.claimId,paymentOptionId:c.paymentOptionId,publicMarker:content.title,privateMarker:privateFacts[0].text,content};
  return {status:'OBSERVATIONS_ONLY',genuineAcceptance:'NOT_ASSESSED',moduleDescriptor,
    originalDescriptorSha256:sha(input.descriptorBytes),binding:structuredClone(b),
    evidenceSha256:{setup:input.expectedSetupSha256,payment:input.expectedPaymentSha256},
    phaseOrder:['prepare','missing-approval','approve','missing-payment','wrong-client','wrong-revision','stale-cas','viewer','verify-payment','publish','replay'],
    diagnosticV1:{actions:['read_client_plan_v1'],substitutesForMountedV3:false},
    mountedLeg:{required:true,api:'reviews/read_client_plan_v3',state:'NOT_EXECUTED_HOLD_PRESERVED',failureMayBeReclassified:false}};
}
