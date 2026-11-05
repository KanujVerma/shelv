// Fresh Account-name fixture. Import/sourcecheck never query Docker or open a socket.
// The human/Parent resource grant is external authority; this file only checks its
// exact packet bindings. A manifest or descriptor is never execution evidence.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir,lstat,readlink,realpath,chmod} from 'node:fs/promises';
import {openSync,writeSync,closeSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash,randomUUID,X509Certificate} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import path from 'node:path';
import https from 'node:https';
import {fileURLToPath,pathToFileURL} from 'node:url';
const NODE='/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node';
const SOURCE='004c7a3a145f472f79c2bb6860ebf917798527b8';
const CLI_SHA='6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc';
const R8=Object.freeze({ownerId:'2a771cf9-1a2c-4b60-9569-71d175d26011',projectId:'sa-2a771cf91a2c4b60956971d175d26011',basePacketSha256:'6aeae65c731e1865380205493dd95b18fc727a2b6947919800047f1cf58f94d2',previousSourceSha256:'c0e3b095f870dabf20aa26062aff13ec409e014d4f2957081d9cfe5aac948ba6',previousDescriptorSha256:'65cd3490282fe7b8b6aac2b8b30c502071e77f3718f0b214a302f2e27b9c54f7',resourcesSha256:'fda2dbe3a7ce8006d19a0b6f7c130077dc876c8b13fb9eb69226a0408ba4742e',runtimeLedgerSha256:'6f58db7371ac58fd0c0d967b023ab8a95b176457c7ef8b08faa593d723f32ac4',ledgerFileSha256:'e285c5a56bbb592079ecb34df36fbb37761976a85b6e92f57f8414cfc9ab3679',tlsSha256:'3376bbe0ffc973958179ec90c2fc4fe2702ecf09aaebb55d9b30d2225636b343',statusSha256:'3d52ff126c7ab2550b794767820e692a6735310e49d9ccb6d8224db44fcad9e7',actorsSha256:'c667e51197e49d05bbf551e09a72b09a569d7480b5d9352fc9f109f0d0bfbcce'});

const sha=value=>createHash('sha256').update(value).digest('hex');
const uuid=value=>assert.match(value??'',/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
const keys=(value,expected)=>assert.deepEqual(Object.keys(value).sort(),[...expected].sort(),'Unexpected or missing fields');
const below=(parent,child)=>path.isAbsolute(child)&&child.startsWith(parent+path.sep);
const json=value=>JSON.stringify(value,null,2)+'\n';
async function save(file,value){await writeFile(file,json(value),{flag:'wx',mode:0o600});}
export async function saveOnceExact(file,value){try{const previous=JSON.parse(await readFile(file,'utf8'));assert.deepEqual(previous,value,'Immutable preflight fingerprint drift');}catch(e){if(e.code!=='ENOENT')throw e;await save(file,value);}}
async function noLinks(directory){let current=path.parse(directory).root;for(const part of directory.split(path.sep).filter(Boolean)){current=path.join(current,part);let st;try{st=await lstat(current);}catch(e){if(e.code==='ENOENT')return;throw e;}assert.ok(st.isDirectory()&&!st.isSymbolicLink(),'Directory ancestor is a symlink or non-directory: '+current);}}
async function regular(file){const st=await lstat(file);assert.ok(st.isFile()&&!st.isSymbolicLink(),'Expected a regular file without symlink: '+file);return st;}
export async function assertFreshDirectory(root,directory){
 root=path.resolve(root);assert.equal(path.resolve(directory),directory);assert.ok(below(path.join(root,'.local-artifacts'),directory),'Fixture must be beneath source .local-artifacts');await noLinks(path.dirname(directory));
 try{await lstat(directory);}catch(e){if(e.code==='ENOENT')return directory;throw e;}throw Error('Fresh fixture directory already exists; never adopt or reuse it');
}
export async function sourceLedger(root){
 await noLinks(path.join(root,'supabase/migrations'));
 const names=(await readdir(path.join(root,'supabase/migrations'))).filter(n=>n.endsWith('.sql')).sort();assert.equal(names.length,68,'Exact current68 migration membership required');
 const versions=new Set(),files=[];
 for(const name of names){assert.match(name,/^\d{8,14}_[a-zA-Z0-9_]+\.sql$/);assert.ok(!versions.has(name.split('_')[0]),'Duplicate migration version');versions.add(name.split('_')[0]);const file=path.join(root,'supabase/migrations',name),st=await regular(file),bytes=await readFile(file);files.push({name,bytes:bytes.length,mode:st.mode&0o777,sha256:sha(bytes)});}
 return {migrationCount:68,files,sha256:sha(json(files))};
}
export function validatePacket(p){
 assert.equal(p.schemaVersion,1);uuid(p.ownerId);assert.equal(p.projectId,'sa-'+p.ownerId.replaceAll('-',''));assert.equal(p.sourceCommit,SOURCE);assert.equal(p.migrationCount,68);
 assert.ok(path.isAbsolute(p.sourceRoot)&&path.resolve(p.sourceRoot)===p.sourceRoot);assert.ok(below(path.join(p.sourceRoot,'.local-artifacts'),p.fixtureDirectory));
 keys(p.ports,['api','db','shadow','mailpit','portal']);const ports=Object.values(p.ports);assert.equal(new Set(ports).size,ports.length);for(const port of ports)assert.ok(Number.isInteger(port)&&port>=1024&&port<=65535);
 assert.equal(p.cli.path,'/opt/homebrew/bin/supabase');assert.equal(p.cli.sha256,CLI_SHA);assert.equal(p.dockerPath,'/opt/homebrew/bin/docker');assert.equal(p.dockerHost,'unix:///Users/kanuj/.colima/shelv-portal-20261024/docker.sock');return p;
}
export function renderConfig(p){validatePacket(p);return `# NEW synthetic Account fixture; generated from exact Parent packet.\nproject_id = "${p.projectId}"\n[api]\nenabled = true\nport = ${p.ports.api}\nschemas = ["public", "graphql_public"]\nextra_search_path = ["public", "extensions"]\nmax_rows = 1000\n[api.tls]\nenabled = true\ncert_path = ${JSON.stringify('../private/gateway-fullchain.crt')}\nkey_path = ${JSON.stringify('../private/portal-leaf.key')}\n[db]\nport = ${p.ports.db}\nshadow_port = ${p.ports.shadow}\nmajor_version = 15\n[db.seed]\nenabled = false\n[realtime]\nenabled = true\n[studio]\nenabled = false\n[local_smtp]\nenabled = true\nport = ${p.ports.mailpit}\n[storage]\nenabled = true\nfile_size_limit = "10MiB"\n[auth]\nenabled = true\nsite_url = "https://127.0.0.1:${p.ports.portal}/"\nadditional_redirect_urls = ["https://127.0.0.1:${p.ports.portal}/", "https://127.0.0.1:${p.ports.portal}/account"]\njwt_expiry = 3600\nenable_refresh_token_rotation = true\nrefresh_token_reuse_interval = 10\nenable_signup = true\nenable_anonymous_sign_ins = false\nminimum_password_length = 12\n[auth.email]\nenable_signup = true\ndouble_confirm_changes = true\nenable_confirmations = true\nsecure_password_change = true\nmax_frequency = "1s"\notp_length = 6\notp_expiry = 3600\n[edge_runtime]\nenabled = false\n[analytics]\nenabled = false\n`;}
export function validateDescriptor(d,expectedSource=SOURCE){
 keys(d,['schemaVersion','ownerId','projectId','fixtureDirectory','sourceCommit','endpoints','actors','privateDirectory','fingerprints',...(d.ordersScenario?['ordersScenario']:[])]);assert.equal(d.schemaVersion,1);uuid(d.ownerId);assert.equal(d.sourceCommit,expectedSource);assert.equal(d.projectId,'sa-'+d.ownerId.replaceAll('-',''));assert.ok(path.isAbsolute(d.fixtureDirectory));assert.equal(d.privateDirectory,path.join(d.fixtureDirectory,'private'));
 keys(d.endpoints,['portal','supabase','mailpit']);for(const [kind,endpoint] of Object.entries(d.endpoints)){const u=new URL(endpoint);assert.equal(u.hostname,'127.0.0.1');assert.equal(u.protocol,kind==='mailpit'?'http:':'https:');assert.ok(u.port);assert.equal(u.origin,endpoint);}
 keys(d.actors,['a','b']);for(const actor of Object.values(d.actors)){keys(actor,['id','email','initialDisplayName']);uuid(actor.id);assert.match(actor.email,/^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9.-]+\.invalid$/);assert.ok(typeof actor.initialDisplayName==='string'&&actor.initialDisplayName.trim().length>0);}
 assert.notEqual(d.actors.a.id,d.actors.b.id);assert.notEqual(d.actors.a.email,d.actors.b.email);assert.notEqual(d.actors.a.initialDisplayName,d.actors.b.initialDisplayName);
 keys(d.fingerprints,['source','config','images','processes','resources']);for(const ref of Object.values(d.fingerprints))assert.ok(typeof ref==='string'&&ref.length>0&&!path.isAbsolute(ref)&&!ref.split('/').includes('..'));
 if(d.ordersScenario){assert.ok(d.ordersScenario&&typeof d.ordersScenario==='object');assert.ok(!/password|secret|token|key|cookie/i.test(JSON.stringify(d.ordersScenario)));}return d;
}
// Always retain the ChildProcess AND its close/join promise. Timeouts signal the
// actual child; neither timeout nor abort resolves the join ahead of close.
export class JoinedCommands {
 constructor({directory,node=NODE}){this.directory=directory;this.node=node;this.records=[];}
 assertJoined(){assert.ok(this.records.every(r=>r.joined),'Issued command remains unjoined; clean STOP is forbidden');}
 issue(program,args,{cwd,env=process.env,input,timeoutMs=120000,killGraceMs=1000,maxBytes=16*1024*1024,signal}={}){
  assert.ok(!signal?.aborted,'Observer signal already aborted; no new command');
  assert.ok(path.isAbsolute(program)&&path.isAbsolute(cwd));const id=randomUUID(),base=path.join(this.directory,id),stdout=base+'.stdout',stderr=base+'.stderr',receipt=base+'.json',stdin=input===undefined?null:base+'.stdin';
  const inputData=input===undefined?null:Buffer.from(input);if(stdin)writeFileSync(stdin,inputData,{flag:'wx',mode:0o600});
  writeFileSync(base+'.issued.json',json({id,argv:[program,...args],cwd,issuedAt:new Date().toISOString(),joined:false}),{flag:'wx',mode:0o600});
  const out=openSync(stdout,'wx',0o600),err=openSync(stderr,'wx',0o600);const startedAt=new Date().toISOString();
  const record={id,argv:[program,...args],cwd,startedAt,stdin,inputBytes:inputData?.length??0,inputSha256:inputData?sha(inputData):null,pid:null,joined:false,aborted:false,timedOut:false,overflow:false,code:null,signal:null,error:null,stdout,stderr,receipt};this.records.push(record);
  let child,killTimer,timer,outBytes=0,errBytes=0,finished=false;
  const terminate=()=>{if(finished)return;child?.kill('SIGTERM');killTimer??=setTimeout(()=>{if(!finished)child?.kill('SIGKILL');},killGraceMs);};
  const onAbort=()=>{record.aborted=true;terminate();};
  const join=new Promise(resolve=>{
   const complete=async(code,exitSignal)=>{if(finished)return;finished=true;clearTimeout(timer);clearTimeout(killTimer);signal?.removeEventListener('abort',onAbort);closeSync(out);closeSync(err);Object.assign(record,{code,signal:exitSignal,closed:true,finishedAt:new Date().toISOString()});try{await save(receipt,{...record,joined:true});}catch(e){record.error??=String(e);}record.joined=true;resolve({...record});};
   try{child=spawn(program,args,{cwd,env,stdio:['pipe','pipe','pipe'],shell:false});record.pid=child.pid??null;}catch(e){record.error=String(e);void complete(null,null);return;}
   const capture=(fd,chunk,isOut)=>{const used=isOut?outBytes:errBytes;const retained=chunk.subarray(0,Math.max(0,maxBytes-used));if(retained.length)writeSync(fd,retained);if(isOut)outBytes+=chunk.length;else errBytes+=chunk.length;if(used+chunk.length>maxBytes){record.overflow=true;terminate();}};
   child.stdout.on('data',chunk=>capture(out,chunk,true));child.stderr.on('data',chunk=>capture(err,chunk,false));child.stdin.on('error',e=>{record.stdinError=String(e);});child.on('error',e=>{record.error=String(e);});child.once('close',(code,signal)=>void complete(code,signal));
   timer=setTimeout(()=>{record.timedOut=true;terminate();},timeoutMs);signal?.addEventListener('abort',onAbort,{once:true});if(signal?.aborted)onAbort();child.stdin.end(input);
  });
  record.child=child;record.join=join;
  // The receipt deliberately excludes non-serializable child/promise fields.
  Object.defineProperties(record,{child:{value:child,enumerable:false},join:{value:join,enumerable:false}});
  return record;
 }
 async run(program,args,options){const issued=this.issue(program,args,options),r=await issued.join;if(r.code!==0||r.signal||r.error||r.timedOut||r.overflow||r.aborted)throw Error('Command failed; preserved receipt '+r.receipt);return readFile(r.stdout,'utf8');}
 async joinAll(){await Promise.all(this.records.map(r=>r.join));this.assertJoined();}
}
export const images=Object.freeze([
 ['public.ecr.aws/supabase/postgres:15.19.0.004','sha256:1d141ea194ba9c8d14c64cb93e72704887cd4b011732f122ace1576d29635c17'],
 ['public.ecr.aws/supabase/gotrue:v2.197.0','sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b'],
 ['public.ecr.aws/supabase/storage-api:v1.82.1','sha256:ec2ad41411eac8fc2b769b4bb00d1af32ae37eca3745c15bdb329db27d218934'],
 ['public.ecr.aws/supabase/kong:2.8.1','sha256:1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d'],
 ['public.ecr.aws/supabase/mailpit:v1.31.3','sha256:ed9b00c609e77e99c79b93f1178255ebc271868920f2c69a8d166bd5634ed10d'],
 ['public.ecr.aws/supabase/postgrest:v16.4','sha256:d155c6718ed9a9f990d159a2ab7c0a3f16944dbb6d0a0344557421042acfe0df'],
 ['public.ecr.aws/supabase/realtime:v2.143.4','sha256:35e99d3f1cbba5aa5585e8ac3cf70ecc54909ee4aee0626effed93c60fb41439'],
 ['public.ecr.aws/supabase/edge-runtime:v1.77.4','sha256:ad45164b7548bf5820ed7be714789c17ac2865edce79a09cfb4c3756c3d365a8'],
].map(([reference,id])=>Object.freeze({reference,id})));
function git(root,args){return execFileSync('/usr/bin/git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});}
export async function protectedSnapshot(root){
 await noLinks(root);const index=git(root,['ls-files','--stage','-z']),names=git(root,['ls-files','-z']).split('\0').filter(Boolean),files=[];
 for(const name of names){const full=path.join(root,name);await noLinks(path.dirname(full));const st=await lstat(full),kind=st.isSymbolicLink()?'symlink':st.isFile()?'file':'other';assert.notEqual(kind,'other');const bytes=kind==='symlink'?Buffer.from(await readlink(full)):await readFile(full);files.push({name,kind,mode:st.mode&0o777,bytes:bytes.length,sha256:sha(bytes)});}
 return {head:git(root,['rev-parse','HEAD']).trim(),indexSha256:sha(index),status:git(root,['status','--porcelain=v1','-z']),files,sha256:sha(json(files))};
}
async function codeSnapshot(p,commit){
 await noLinks(p.sourceRoot);assert.equal(await realpath(p.sourceRoot),p.sourceRoot);assert.equal(git(p.sourceRoot,['rev-parse','HEAD']).trim(),commit,'Root source commit changed; request a new Parent packet');
 const ledger=await sourceLedger(p.sourceRoot),binary=await readFile(p.cli.path);assert.equal(sha(binary),p.cli.sha256,'Installed CLI bytes differ; no fallback/install');
 for(const {reference} of images){const tag=reference.slice(reference.lastIndexOf(':')+1);assert.ok(binary.includes(Buffer.from(tag)),'Pinned CLI lacks required compiled image tag '+tag);}
 const source=await protectedSnapshot(p.sourceRoot);return {stage:'SOURCE_CHECK_ONLY',executor:{path:fileURLToPath(import.meta.url),sha256:sha(await readFile(fileURLToPath(import.meta.url)))},sourceCommit:commit,ledger,openssl:{path:'/usr/bin/openssl',sha256:sha(await readFile('/usr/bin/openssl'))},cli:{path:p.cli.path,realpath:await realpath(p.cli.path),sha256:sha(binary)},configSha256:sha(renderConfig(p)),source};
}
export async function checkSource(packet){const p=validatePacket(packet);return codeSnapshot(p,p.sourceCommit);}
function grantFor(grant,p,action){
 assert.equal(grant.executorSha256,sha(readFileSync(fileURLToPath(import.meta.url))),'Grant must bind exact lifecycle source bytes');
 assert.ok(grant.schemaVersion===1||(grant.schemaVersion===2&&['roll_forward_code','observe','stop'].includes(action)),'Unsupported lifecycle grant version/action');if(grant.schemaVersion===2)assert.ok(grant.actions.every(a=>['roll_forward_code','observe','stop'].includes(a)),'V2 cannot start, seed or reset');assert.equal(grant.packetSha256,sha(json(p)),'Grant does not bind exact packet');assert.equal(grant.ownerId,p.ownerId);assert.equal(grant.projectId,p.projectId);assert.equal(grant.parentThreadId,'9b085ada-435f-48d6-8886-957c1ce3e82d');assert.ok(typeof grant.taskId==='string'&&grant.taskId.startsWith('node:delegated-task:'));assert.ok(typeof grant.authorization==='string'&&grant.authorization.length>20,'Parent literal authorization reference required');assert.ok(Date.parse(grant.expiresAt)>Date.now(),'Grant expired');assert.ok(grant.actions.includes(action),'Action outside exact Parent grant');
}
async function prepare(p){
 const checked=await checkSource(p);await assertFreshDirectory(p.sourceRoot,p.fixtureDirectory);await mkdir(path.dirname(p.fixtureDirectory),{recursive:true,mode:0o700});await mkdir(p.fixtureDirectory,{mode:0o700});await mkdir(path.join(p.fixtureDirectory,'private'),{mode:0o700});await mkdir(path.join(p.fixtureDirectory,'supabase/migrations'),{recursive:true,mode:0o700});
 await writeFile(path.join(p.fixtureDirectory,'supabase/config.toml'),renderConfig(p),{flag:'wx',mode:0o600});for(const file of checked.ledger.files)await writeFile(path.join(p.fixtureDirectory,'supabase/migrations',file.name),await readFile(path.join(p.sourceRoot,'supabase/migrations',file.name)),{flag:'wx',mode:file.mode});
 await save(path.join(p.fixtureDirectory,'PACKET.json'),p);await save(path.join(p.fixtureDirectory,'SOURCE.json'),checked);await save(path.join(p.fixtureDirectory,'PREPARED.json'),{ownerId:p.ownerId,projectId:p.projectId,stage:'SOURCE_PREPARED_NOT_RUNNING',at:new Date().toISOString()});return checked;
}
export function validatePublishedPorts(containers,ports){
 const allowed=new Set([ports.api,ports.db,ports.mailpit]);for(const c of containers)for(const bindings of Object.values(c.networkSettings.Ports??{}))for(const b of bindings??[]){assert.ok(['127.0.0.1','::1'].includes(b.HostIp),'Published port is not loopback-only');assert.ok(allowed.has(Number(b.HostPort)),'Published port outside exact packet');}
}

function checkedHash(value){assert.match(value??'',/^[a-f0-9]{64}$/);return value;}
function checkedCommit(value){assert.match(value??'',/^[a-f0-9]{40}$/);return value;}
function completeSnapshot(value,commit){
 keys(value,['head','indexSha256','status','files','sha256']);assert.equal(value.head,commit);checkedHash(value.indexSha256);assert.equal(typeof value.status,'string');assert.ok(Array.isArray(value.files)&&value.files.length>0);
 const seen=new Set();for(const f of value.files){keys(f,['name','kind','mode','bytes','sha256']);assert.ok(typeof f.name==='string'&&f.name&&!path.isAbsolute(f.name)&&!f.name.split('/').includes('..')&&!seen.has(f.name));seen.add(f.name);assert.ok(['file','symlink'].includes(f.kind));assert.ok(Number.isInteger(f.mode)&&f.mode>=0&&f.mode<=0o777);assert.ok(Number.isSafeInteger(f.bytes)&&f.bytes>=0);checkedHash(f.sha256);}
 assert.equal(value.sha256,sha(json(value.files)),'Incomplete or altered full source manifest');return value;
}
function liveIdentity(value,p,observedAt){
 keys(value,['containers','volumes','networks']);assert.ok(value.containers.length>0&&value.volumes.length>0&&value.networks.length>0);const ids=new Set();
 for(const c of value.containers){keys(c,['id','name','imageId','created','startedAt','running','projectId','workdir','ports']);checkedHash(c.id);assert.ok(!ids.has(c.id));ids.add(c.id);assert.ok(c.name.endsWith('_'+p.projectId));assert.equal(c.projectId,p.projectId);assert.equal(c.workdir,p.fixtureDirectory);assert.equal(c.running,true,'Stopped resource cannot roll forward');assert.match(c.imageId,/^sha256:[a-f0-9]{64}$/);const created=Date.parse(c.created),started=Date.parse(c.startedAt);assert.ok(Number.isFinite(created)&&Number.isFinite(started)&&started>=created&&started<=observedAt);}
 for(const v of value.volumes){keys(v,['name','createdAt','labels']);assert.equal(v.name,'supabase_db_'+p.projectId);assert.equal(v.labels?.['com.supabase.cli.project'],p.projectId);assert.ok(Number.isFinite(Date.parse(v.createdAt)));}
 for(const n of value.networks){keys(n,['id','name','createdAt','driver','options','labels']);checkedHash(n.id);assert.equal(n.name,'shelv_account_'+p.ownerId.replaceAll('-',''));assert.equal(n.driver,'bridge');assert.equal(n.options?.['com.docker.network.bridge.host_binding_ipv4'],'127.0.0.1');assert.equal(n.labels?.['com.supabase.cli.project'],p.projectId);assert.equal(n.labels?.['com.supabase.cli.workdir'],p.fixtureDirectory);assert.equal(n.labels?.['shelv.account.owner'],p.ownerId);assert.ok(Number.isFinite(Date.parse(n.createdAt)));}return value;
}
function sameNetworkMembership(before,after){
 const ids=before.containers.map(c=>c.id).sort(),names=before.networks.map(n=>n.Name).sort();
 assert.deepEqual(after.containers.map(c=>c.id).sort(),ids,'Container membership changed');
 assert.deepEqual(after.networks.map(n=>n.Id).sort(),before.networks.map(n=>n.Id).sort(),'Network membership changed');
 for(const prior of before.containers){const now=after.containers.find(c=>c.id===prior.id);assert.ok(now);assert.deepEqual(Object.keys(prior.networkSettings.Networks??{}).sort(),names,'Original network attachments are incomplete');assert.deepEqual(now.networkSettings.Networks,prior.networkSettings.Networks,'Container network attachment drift');}
 for(const prior of before.networks){const now=after.networks.find(n=>n.Id===prior.Id);assert.ok(now);assert.deepEqual(Object.keys(prior.Containers??{}).sort(),ids,'Original network members differ from captured containers');assert.deepEqual(now.Containers,prior.Containers,'Network member/endpoint drift');}
}
async function privateRecord(file){await noLinks(path.dirname(file));const st=await regular(file);assert.equal(st.mode&0o777,0o600,'Lifecycle artifact must remain0600');const bytes=await readFile(file);return {bytes,sha256:sha(bytes),value:JSON.parse(bytes)};}

export class AccountFixture {
 constructor(packet,grant){this.packet=validatePacket(packet);this.grant=grant;this.commands=new JoinedCommands({directory:path.join(packet.fixtureDirectory,'private')});this.resources=null;this.activeSourceV2=null;this.activeBasis=null;this.activeLifecycleAction='observe';this.diagnosticRequests=[];}

 buildSourceV2(b,recordedAt=new Date().toISOString()){
  assert.deepEqual(b.p,this.packet);checkedCommit(b.next.sourceCommit);assert.notEqual(b.next.sourceCommit,b.oldSource.sourceCommit,'No-op/replayed code pin');
  completeSnapshot(b.next.source,b.next.sourceCommit);assert.deepEqual(b.next.ledger,b.oldSource.ledger,'Prepared migration/source schema drift');assert.equal(b.next.ledger.migrationCount,68);
  for(const name of ['configSha256','cli','openssl'])assert.deepEqual(b.next[name],b.oldSource[name],name+' changed during code-only update');
  validateDescriptor(b.descriptor,b.oldSource.sourceCommit);liveIdentity(b.liveResources,this.packet,Date.parse(recordedAt));
  const descriptor=structuredClone(b.descriptor);descriptor.sourceCommit=b.next.sourceCommit;descriptor.fingerprints.source='SOURCE-V2.json';validateDescriptor(descriptor,b.next.sourceCommit);
  const source={schemaVersion:2,kind:'preserved_live_code_roll_forward_v1',stage:'LIVE_CODE_SOURCE_V2',ownerId:this.packet.ownerId,projectId:this.packet.projectId,fixtureDirectory:this.packet.fixtureDirectory,...b.hashes,previousSourceCommit:b.oldSource.sourceCommit,sourceCommit:b.next.sourceCommit,executor:b.next.executor,configSha256:b.oldSource.configSha256,ledger:b.oldSource.ledger,cli:b.oldSource.cli,openssl:b.oldSource.openssl,source:b.next.source,descriptorV2Sha256:sha(json(descriptor)),liveResources:b.liveResources,recordedAt};
  this.validateSourceV2(source,descriptor,b);return {source,descriptor};
 }
 validateSourceV2(v,d,b){
  keys(v,['schemaVersion','kind','stage','ownerId','projectId','fixtureDirectory','basePacketSha256','previousSourceCommit','previousSourceSha256','previousDescriptorSha256','resourcesSha256','runtimeLedgerSha256','sourceCommit','executor','configSha256','ledger','cli','openssl','source','descriptorV2Sha256','liveResources','recordedAt']);
  assert.equal(v.schemaVersion,2);assert.equal(v.kind,'preserved_live_code_roll_forward_v1');assert.equal(v.stage,'LIVE_CODE_SOURCE_V2');assert.equal(v.ownerId,this.packet.ownerId);assert.equal(v.projectId,this.packet.projectId);assert.equal(v.fixtureDirectory,this.packet.fixtureDirectory);
  for(const [name,value] of Object.entries(b.hashes)){checkedHash(v[name]);assert.equal(v[name],value,'Original '+name+' mismatch');}
  assert.equal(v.previousSourceCommit,b.oldSource.sourceCommit);assert.equal(v.sourceCommit,b.next.sourceCommit);assert.notEqual(v.sourceCommit,v.previousSourceCommit);checkedCommit(v.sourceCommit);completeSnapshot(v.source,v.sourceCommit);assert.deepEqual(v.source,b.next.source);
  assert.deepEqual(v.executor,b.next.executor);keys(v.executor,['path','sha256']);assert.ok(path.isAbsolute(v.executor.path));checkedHash(v.executor.sha256);
  for(const name of ['ledger','configSha256','cli','openssl'])assert.deepEqual(v[name],b.oldSource[name],'Original '+name+' drift');assert.equal(v.ledger.migrationCount,68);assert.equal(v.ledger.files.length,68);assert.equal(v.ledger.sha256,sha(json(v.ledger.files)));
  const expected=structuredClone(b.descriptor);expected.sourceCommit=v.sourceCommit;expected.fingerprints.source='SOURCE-V2.json';assert.deepEqual(d,expected,'Descriptor identity/resources changed');validateDescriptor(d,v.sourceCommit);assert.equal(v.descriptorV2Sha256,sha(json(d)));
  assert.ok(Number.isFinite(Date.parse(v.recordedAt)));liveIdentity(v.liveResources,this.packet,Date.parse(v.recordedAt));assert.deepEqual(v.liveResources,b.liveResources);return v;
 }
 async publishSourceV2(built,b){
  this.validateSourceV2(built.source,built.descriptor,b);const source=path.join(this.packet.fixtureDirectory,'SOURCE-V2.json'),descriptor=path.join(this.packet.fixtureDirectory,'DESCRIPTOR-V2.json');
  await noLinks(this.packet.fixtureDirectory);for(const file of [source,descriptor]){try{await lstat(file);throw Error('V2 replay/partial pair already exists; never overwrite or adopt');}catch(e){if(e.code!=='ENOENT')throw e;}}
  await save(descriptor,built.descriptor);
  if(this.grant.schemaVersion===2)await this.revalidateCodeCommit(b);
  await save(source,built.source);return {source,sourceSha256:sha(json(built.source)),descriptor,descriptorSha256:sha(json(built.descriptor))};
 }

 requireRollForwardGrant(action){
  grantFor(this.grant,this.packet,action);if(action==='stop')assert.ok(typeof this.grant.browserReturnReference==='string'&&this.grant.browserReturnReference.length>20,'Parent browser return is required before cleanup inspection');assert.equal(this.grant.schemaVersion,2);assert.equal(this.packet.ownerId,R8.ownerId);assert.equal(this.packet.projectId,R8.projectId);assert.equal(sha(json(this.packet)),R8.basePacketSha256,'Only the original LIVE R8 packet is eligible');
  const f=this.grant.rollforward;assert.ok(f&&typeof f==='object');
  const required=['previousSourceCommit','basePacketSha256','previousSourceSha256','previousDescriptorSha256','resourcesSha256','runtimeLedgerSha256','tlsSha256','statusSha256','actorsSha256','newSourceCommit','newProtectedSha256','newIndexSha256','newSourceStatus','liveResources'];
  const selected=action!=='roll_forward_code';keys(f,[...required,...(selected?['sourceV2Sha256','descriptorV2Sha256']:[])]);assert.equal(f.previousSourceCommit,SOURCE);
  for(const name of ['basePacketSha256','previousSourceSha256','previousDescriptorSha256','resourcesSha256','runtimeLedgerSha256','tlsSha256','statusSha256','actorsSha256'])assert.equal(f[name],R8[name],name+' is not the accepted R8 basis');
  checkedCommit(f.newSourceCommit);assert.notEqual(f.newSourceCommit,SOURCE);checkedHash(f.newProtectedSha256);checkedHash(f.newIndexSha256);assert.equal(typeof f.newSourceStatus,'string');liveIdentity(f.liveResources,this.packet,Date.now());
  if(selected){assert.equal(this.grant.activeSourceRecord,'SOURCE-V2.json','Explicit V2 binding selection required');checkedHash(f.sourceV2Sha256);checkedHash(f.descriptorV2Sha256);}return f;
 }
 async originalRollForwardBasis(f){
  await noLinks(this.packet.fixtureDirectory);try{await lstat(this.file('STOPPED.json'));throw Error('Stopped R8 cannot roll forward or be adopted');}catch(e){if(e.code!=='ENOENT')throw e;}
  await verifyJoinedReceipts(this.file(''));
  const packet=await privateRecord(path.join(this.packet.fixtureDirectory,'PACKET.json')),source=await privateRecord(path.join(this.packet.fixtureDirectory,'SOURCE.json')),descriptor=await privateRecord(path.join(this.packet.fixtureDirectory,'DESCRIPTOR.json')),resources=await privateRecord(this.file('RESOURCES.json')),ledger=await privateRecord(this.file('LEDGER.json')),tls=await privateRecord(this.file('TLS.json')),status=await privateRecord(this.file('status.private.json')),actors=await privateRecord(this.file('ACTORS.json'));
  for(const [r,expected] of [[packet,R8.basePacketSha256],[source,R8.previousSourceSha256],[descriptor,R8.previousDescriptorSha256],[resources,R8.resourcesSha256],[ledger,R8.ledgerFileSha256],[tls,R8.tlsSha256],[status,R8.statusSha256],[actors,R8.actorsSha256]])assert.equal(r.sha256,expected,'Original live-custody artifact drift');
  assert.deepEqual(packet.value,this.packet);assert.equal(source.value.sourceCommit,SOURCE);validateDescriptor(descriptor.value);assert.equal(resources.value.ownerId,this.packet.ownerId);assert.equal(resources.value.projectId,this.packet.projectId);
  assert.equal(ledger.value.runtimeLedgerSha256,R8.runtimeLedgerSha256);assert.equal(sha(json(ledger.value.ledger)),R8.runtimeLedgerSha256);assert.equal(ledger.value.ledger.length,68);assert.equal(ledger.value.sourceLedgerSha256,source.value.ledger.sha256);
  const copied=await sourceLedger(this.packet.fixtureDirectory);assert.deepEqual(copied,source.value.ledger,'Original prepared schema drift');assert.equal(sha(await readFile(path.join(this.packet.fixtureDirectory,'supabase/config.toml'))),source.value.configSha256,'Original running config drift');
  for(const [name,expected] of Object.entries(tls.value.files)){assert.equal(path.basename(name),name);const file=this.file(name),st=await regular(file);assert.equal(st.mode&0o777,0o600);assert.equal(sha(await readFile(file)),expected.sha256,'Preserved TLS key/certificate drift');}
  const next=await codeSnapshot(this.packet,f.newSourceCommit);assert.equal(next.source.sha256,f.newProtectedSha256);assert.equal(next.source.indexSha256,f.newIndexSha256);assert.equal(next.source.status,f.newSourceStatus);assert.deepEqual(next.ledger,source.value.ledger,'New code changes the immutable schema');
  for(const name of ['configSha256','cli','openssl'])assert.deepEqual(next[name],source.value[name]);
  return {p:this.packet,oldSource:source.value,descriptor:descriptor.value,next,hashes:{basePacketSha256:packet.sha256,previousSourceSha256:source.sha256,previousDescriptorSha256:descriptor.sha256,resourcesSha256:resources.sha256,runtimeLedgerSha256:ledger.value.runtimeLedgerSha256},liveResources:f.liveResources,resources:resources.value,actors:actors.value,ledger:ledger.value};
 }
 async verifySameLiveStack(b){
  const expected=b.liveResources,old=b.resources,current={containers:[],networks:[]};assert.deepEqual(expected.containers.map(c=>c.id).sort(),old.containers.map(c=>c.id).sort(),'Captured container membership changed');assert.equal(expected.containers.length,5);assert.equal(expected.volumes.length,old.volumes.length);assert.equal(expected.networks.length,old.networks.length);
  for(const c of expected.containers){const prior=old.containers.find(v=>v.id===c.id);assert.ok(prior);for(const key of ['id','name','imageId','created'])assert.equal(c[key],prior[key]);assert.deepEqual(c.ports,prior.networkSettings.Ports);assert.ok(Date.parse(c.startedAt)<=Date.parse(old.at),'Container restarted after the original live capture');
   const [now]=JSON.parse(await this.docker(['inspect',c.id]));assert.equal(now.Id,c.id);assert.equal(now.Name,c.name);assert.equal(now.Image,c.imageId);assert.equal(now.Created,c.created);assert.equal(now.State.Running,true,'Stopped container cannot be adopted');assert.equal(now.State.Restarting,false);assert.equal(now.State.Paused,false);assert.equal(now.State.StartedAt,c.startedAt,'Container restart/identity drift');assert.equal(now.RestartCount,0,'Restarted container is not the retained original');assert.equal(now.Config.Labels?.['com.supabase.cli.project'],this.packet.projectId);assert.equal(now.Config.Labels?.['com.supabase.cli.workdir'],this.packet.fixtureDirectory);assert.deepEqual(now.NetworkSettings.Ports,c.ports);current.containers.push({id:now.Id,networkSettings:now.NetworkSettings});}
  for(const v of expected.volumes){const prior=old.volumes.find(x=>x.Name===v.name);assert.ok(prior);assert.equal(v.createdAt,prior.CreatedAt);assert.deepEqual(v.labels,prior.Labels);const [now]=JSON.parse(await this.docker(['volume','inspect',v.name]));assert.equal(now.Name,prior.Name);assert.equal(now.CreatedAt,prior.CreatedAt);assert.deepEqual(now.Labels,prior.Labels);}
  for(const n of expected.networks){const prior=old.networks.find(x=>x.Id===n.id);assert.ok(prior);assert.equal(n.name,prior.Name);assert.equal(n.createdAt,prior.Created);assert.equal(n.driver,prior.Driver);assert.deepEqual(n.options,prior.Options);assert.deepEqual(n.labels,prior.Labels);const [now]=JSON.parse(await this.docker(['network','inspect',n.id]));for(const key of ['Id','Name','Created','Driver','Options','Labels'])assert.deepEqual(now[key],prior[key]);current.networks.push(now);}
  sameNetworkMembership(old,current);
  this.resources=old;
  const ledger=JSON.parse(await this.sql("select coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name,'statements',statements) order by version),'[]'::jsonb) from supabase_migrations.schema_migrations;"));assert.deepEqual(ledger,b.ledger.ledger,'Actual runtime schema/ledger changed');assert.equal(sha(json(ledger)),R8.runtimeLedgerSha256);
  const ids=Object.values(b.descriptor.actors).map(a=>{uuid(a.id);return "'"+a.id+"'";}).join(',');
  const actors=JSON.parse(await this.sql("select jsonb_agg(jsonb_build_object('id',u.id,'email',u.email,'permanent',u.is_anonymous is false,'confirmed',u.email_confirmed_at is not null,'profile',p.id is not null,'case',c.client_id is not null,'status',e.status) order by u.id) from auth.users u left join public.profiles p on p.id=u.id left join concierge.enrollments e on e.client_id=u.id left join concierge.cases c on c.client_id=u.id where u.id in ("+ids+");"));assert.equal(actors.length,2);for(const a of actors){const prior=b.actors.find(x=>x.id===a.id);assert.ok(prior);for(const key of ['email','permanent','confirmed','profile','case','status'])assert.equal(a[key],prior[key],'Actor identity/rights changed');}
  this.commands.assertJoined();return expected;
 }
 async rollForwardCode(){
  const f=this.requireRollForwardGrant('roll_forward_code');for(const name of ['SOURCE-V2.json','DESCRIPTOR-V2.json']){try{await lstat(path.join(this.packet.fixtureDirectory,name));throw Error('V2 replay or partial publication; no overwrite/adoption');}catch(e){if(e.code!=='ENOENT')throw e;}}
  const b=await this.originalRollForwardBasis(f);await this.verifySameLiveStack(b);const built=this.buildSourceV2(b);const result=await this.publishSourceV2(built,b);return result;
 }
 async revalidateCodeCommit(b,action='roll_forward_code'){
  const f=this.requireRollForwardGrant(action),next=await codeSnapshot(this.packet,f.newSourceCommit);
  // The filesystem snapshot and all native liveness checks can await. The
  // exact original grant must still be valid when issuing the commit write.
  assert.deepEqual(this.requireRollForwardGrant(action),f,'Grant changed during source verification');
  assert.deepEqual(next,b.next,'Frozen source/ledger/config/index/status changed before commit');
  assert.deepEqual(f.liveResources,b.liveResources,'Granted resource identity changed');
 }
 async attachSourceV2(action){
  const f=this.requireRollForwardGrant(action),b=await this.originalRollForwardBasis(f),v=await privateRecord(path.join(this.packet.fixtureDirectory,'SOURCE-V2.json')),d=await privateRecord(path.join(this.packet.fixtureDirectory,'DESCRIPTOR-V2.json'));
  assert.equal(v.sha256,f.sourceV2Sha256);assert.equal(d.sha256,f.descriptorV2Sha256);this.validateSourceV2(v.value,d.value,b);await this.verifySameLiveStack(b);await this.revalidateCodeCommit(b,action);this.activeSourceV2=v.value;this.activeBasis=b;this.activeLifecycleAction=action;
 }
 async attach(action='observe'){
  if(this.grant.schemaVersion===2)return this.attachSourceV2(action);
  grantFor(this.grant,this.packet,'observe');await noLinks(this.packet.fixtureDirectory);assert.deepEqual(JSON.parse(await readFile(path.join(this.packet.fixtureDirectory,'PACKET.json'),'utf8')),this.packet);
  try{await lstat(this.file('STOPPED.json'));throw Error('Stopped fixture is never reusable');}catch(e){if(e.code!=='ENOENT')throw e;}
  await verifyJoinedReceipts(this.file(''));
  this.resources=JSON.parse(await readFile(this.file('RESOURCES.json'),'utf8'));assert.equal(this.resources.ownerId,this.packet.ownerId);assert.equal(this.resources.projectId,this.packet.projectId);await this.recheck();
 }
 async openPrepared(){
  await noLinks(this.packet.fixtureDirectory);assert.deepEqual(JSON.parse(await readFile(path.join(this.packet.fixtureDirectory,'PACKET.json'),'utf8')),this.packet);
  try{await lstat(this.file('STOPPED.json'));throw Error('Stopped fixture is never reusable');}catch(e){if(e.code!=='ENOENT')throw e;}
  grantFor(this.grant,this.packet,'preflight');try{await lstat(this.file('RESOURCES.json'));throw Error('Already-started fixture requires observe/stop custody continuation');}catch(e){if(e.code!=='ENOENT')throw e;}
  const prepared=JSON.parse(await readFile(path.join(this.packet.fixtureDirectory,'PREPARED.json'),'utf8'));assert.equal(prepared.ownerId,this.packet.ownerId);assert.equal(prepared.projectId,this.packet.projectId);assert.equal(prepared.stage,'SOURCE_PREPARED_NOT_RUNNING');await verifyJoinedReceipts(this.file(''));await this.recheck();await save(this.file('GRANT-'+randomUUID()+'.json'),this.grant);
 }
 async initialize(){grantFor(this.grant,this.packet,'preflight');await prepare(this.packet);await save(this.file('GRANT.json'),this.grant);await mkdir(this.file('docker-config'),{mode:0o700});await save(path.join(this.file('docker-config'),'config.json'),{auths:{}});}
 file(name){return path.join(this.packet.fixtureDirectory,'private',name);}
 env(){return {PATH:'/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin',HOME:this.file('home'),TMPDIR:this.file('tmp'),DOCKER_HOST:this.packet.dockerHost,DOCKER_CONFIG:this.file('docker-config'),SUPABASE_INTERNAL_IMAGE_REGISTRY:'public.ecr.aws',SUPABASE_USE_SLIM_IMAGES:'false',SUPABASE_TELEMETRY_DISABLED:'1',NO_COLOR:'1'};}
 async command(program,args,options={}){return this.commands.run(program,args,{cwd:this.packet.fixtureDirectory,env:this.env(),...options});}
 async docker(args,options){return this.command(this.packet.dockerPath,args,options);}
 async preflight(){
  grantFor(this.grant,this.packet,'preflight');await noLinks(this.file('home'));await noLinks(this.file('tmp'));await mkdir(this.file('home'),{recursive:true,mode:0o700});await mkdir(this.file('tmp'),{recursive:true,mode:0o700});
  // Installed CLI help is observed before any engine call. Cache IDs are then
  // checked individually; never pull, install, query or adopt a stopped project.
  assert.match(await this.command(this.packet.cli.path,['--version']),/^2\.121\.0\s*$/);assert.match(await this.command(this.packet.cli.path,['--help']),/--network-id/);await this.command(this.packet.cli.path,['start','--help']);
  const found=[];for(const image of images){const data=JSON.parse(await this.docker(['image','inspect',image.reference]));assert.equal(data.length,1);assert.equal(data[0].Id,image.id);assert.equal(data[0].Architecture,'arm64');found.push({reference:image.reference,id:data[0].Id,architecture:data[0].Architecture,repoDigests:data[0].RepoDigests});}
  await saveOnceExact(this.file('IMAGES.json'),found);
  for(const kind of ['container','volume','network']){const out=await this.docker([kind,'ls',...(kind==='container'?['-a']:[]),'--filter','label=com.supabase.cli.project='+this.packet.projectId,'--format','{{json .}}']);assert.equal(out.trim(),'','NEW project already has resources; do not query/adopt them');}
  // A granted probe binds only the exact proposed ports, closes, and is joined.
  await this.command(NODE,['--input-type=module','-e',`import net from 'node:net';for(const port of ${JSON.stringify(Object.values(this.packet.ports))}){await new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(port,'127.0.0.1',()=>s.close(resolve));});}`],{timeoutMs:10000});
  this.commands.assertJoined();return {stage:'PREFLIGHT_ONLY',cacheImages:found.length};
 }
 async capture(){
  const p=this.packet,containers=[],volumes=[],networks=[];
  const ids=(await this.docker(['ps','-aq','--filter','label=com.supabase.cli.project='+p.projectId])).trim().split('\n').filter(Boolean);
  for(const id of ids){const [r]=JSON.parse(await this.docker(['inspect',id]));assert.equal(r.Config.Labels?.['com.supabase.cli.project'],p.projectId);assert.equal(r.Config.Labels?.['com.supabase.cli.workdir'],p.fixtureDirectory);containers.push({id:r.Id,name:r.Name,imageId:r.Image,created:r.Created,labels:r.Config.Labels,authIssuerConfiguration:(r.Config.Env??[]).filter(e=>/^(GOTRUE_JWT_ISSUER|GOTRUE_API_EXTERNAL_URL|API_EXTERNAL_URL)=/.test(e)),mounts:r.Mounts,networkSettings:r.NetworkSettings,running:r.State.Running});}
  for(const kind of ['volume','network']){const names=(await this.docker([kind,'ls','--filter','label=com.supabase.cli.project='+p.projectId,'--format','{{.Name}}'])).trim().split('\n').filter(Boolean);for(const name of names){const [r]=JSON.parse(await this.docker([kind,'inspect',name]));assert.equal(r.Labels?.['com.supabase.cli.project'],p.projectId);(kind==='volume'?volumes:networks).push(r);}}
  assert.ok(containers.length&&volumes.length&&networks.length,'New CLI resources must be observable');
  validatePublishedPorts(containers,p.ports);for(const n of networks)assert.equal(n.Options?.['com.docker.network.bridge.host_binding_ipv4'],'127.0.0.1','New network must bind only loopback');
  const allowed=new Set(images.map(i=>i.id));for(const c of containers)assert.ok(allowed.has(c.imageId),'Unexpected image on fresh stack');
  return {ownerId:p.ownerId,projectId:p.projectId,containers,volumes,networks,at:new Date().toISOString()};
 }
 async sql(text){assert.ok(this.resources,'Actual captured resources required');const c=this.resources.containers.find(c=>c.name==='/supabase_db_'+this.packet.projectId);assert.ok(c);return (await this.docker(['exec','-i',c.id,'psql','-U','postgres','-d','postgres','-X','-At','-v','ON_ERROR_STOP=1'],{input:text+'\n'})).trim();}

 diagnosticKongIdentity(r,cli){
  assert.match(r.Id??'',/^[a-f0-9]{64}$/);assert.equal(r.Name,'/supabase_kong_'+this.packet.projectId);
  assert.equal(r.Config?.Labels?.['com.supabase.cli.project'],this.packet.projectId);assert.equal(r.Config?.Labels?.['com.supabase.cli.workdir'],this.packet.fixtureDirectory);
  assert.equal(r.Image,images.find(i=>i.reference.includes('/kong:')).id);
  const observed=Date.now(),issued=Date.parse(cli.startedAt),created=Date.parse(r.Created),started=Date.parse(r.State?.StartedAt);
  assert.ok(Number.isFinite(created)&&Number.isFinite(issued)&&issued<=observed&&created>=issued&&created<=observed,'Kong creation differs from this actual CLI observation window');
  const neverStarted=r.State?.Running===false&&r.State?.Status==='created'&&r.State?.StartedAt==='0001-01-01T00:00:00Z';
  assert.ok(neverStarted||(Number.isFinite(started)&&started>0&&started>=created&&started<=observed),'Kong start clock is invalid or outside actual creation/observation');return r;
 }
 diagnosticHeadEligible(r,cli){
  try{this.diagnosticKongIdentity(r,cli);}catch{return false;}
  if(r.State?.Running!==true||r.State?.Restarting===true)return false;
  const observed=Date.now(),created=Date.parse(r.Created),started=Date.parse(r.State?.StartedAt);
  if(!Number.isFinite(created)||!Number.isFinite(started)||created>observed||started<=0||started<created||started>observed)return false;
  const bindings=r.NetworkSettings?.Ports?.['8443/tcp'];return Array.isArray(bindings)&&bindings.length===1&&bindings[0].HostIp==='127.0.0.1'&&bindings[0].HostPort===String(this.packet.ports.api);
 }
 async joinDiagnosticStart(issued,observe){
  const controller=new AbortController(),cancel=()=>controller.abort();issued.child?.once('close',cancel);if(issued.closed||issued.joined)cancel();
  const observer=Promise.resolve().then(()=>observe(controller.signal)).then(observation=>({observation}),error=>({observation:{code:controller.signal.aborted?'OBSERVER_CANCELLED':'OBSERVER_ERROR',error:String(error)}}));
  const cli=await issued.join;cancel();const result=await observer;issued.child?.removeListener('close',cancel);
  await Promise.all(this.diagnosticRequests.map(h=>h.join));this.commands.assertJoined();assert.ok(this.diagnosticRequests.every(h=>h.joined));return {cli,...result};
 }
 async diagnosticHead(signal){
  assert.ok(!signal.aborted,'Start already settled');const id=randomUUID(),receipt=this.file('DIAGNOSTIC-HEAD-'+id+'.json'),ca=await readFile(this.file('fixture-ca.crt'));
  assert.ok(!signal.aborted,'Start already settled');const record={id,url:'https://127.0.0.1:'+this.packet.ports.api+'/rest-admin/v1/ready',method:'HEAD',startedAt:new Date().toISOString(),caSha256:sha(ca),closed:false,joined:false,aborted:false,timedOut:false,status:null,error:null};
  const errorValue=(e,depth=0)=>e?{name:String(e.name??''),message:String(e.message??e).slice(0,4096),...(typeof e.code==='string'?{code:e.code}:{}),...(e.errno!==undefined?{errno:e.errno}:{}),...(e.syscall?{syscall:e.syscall}:{}),...(e.address?{address:e.address}:{}),...(e.port?{port:e.port}:{}),...(e.reason?{reason:e.reason}:{}),...(e.cause&&depth<3?{cause:errorValue(e.cause,depth+1)}:{})}:null;
  let request,socket,timer,responseClosed=true,finished=false,secureConnected=false;
  const captureTls=()=>{
   const prior=record.tls??{},read=fn=>{try{return fn()??null;}catch{return null;}},current=socket??read(()=>request?.socket),peer=read(()=>current?.getPeerCertificate?.())??{};
   const value=(fn,key)=>read(fn)??prior[key]??null;
   record.tls={observed:current!==null&&current!==undefined,secureConnected,authorized:value(()=>current?.authorized,'authorized'),authorizationError:value(()=>current?.authorizationError,'authorizationError'),protocol:value(()=>current?.getProtocol?.(),'protocol'),peerFingerprint256:value(()=>peer.fingerprint256,'peerFingerprint256'),peerSubject:value(()=>peer.subject,'peerSubject'),peerIssuer:value(()=>peer.issuer,'peerIssuer'),remoteAddress:value(()=>current?.remoteAddress,'remoteAddress'),remotePort:value(()=>current?.remotePort,'remotePort'),localAddress:value(()=>current?.localAddress,'localAddress'),localPort:value(()=>current?.localPort,'localPort')};
  };
  captureTls();const cancel=()=>{record.aborted=true;captureTls();const e=Object.assign(new Error('CLI start settled or observer deadline ended'),{code:'ABORT_ERR'});request?.destroy(e);};
  const join=new Promise(resolve=>{
   const finish=async()=>{if(finished||!record.closed||!responseClosed)return;finished=true;clearTimeout(timer);signal.removeEventListener('abort',cancel);captureTls();record.finishedAt=new Date().toISOString();try{await save(receipt,{...record,joined:true});}catch(e){record.error??=errorValue(e);}record.joined=true;resolve({...record,receipt});};
   try{request=https.request(record.url,{method:'HEAD',ca,rejectUnauthorized:true,headers:{'cache-control':'no-store'},agent:false},response=>{
    responseClosed=false;record.status=response.statusCode;record.headers=response.rawHeaders;record.responseAt=new Date().toISOString();response.on('error',e=>{record.error??=errorValue(e);});response.once('close',()=>{responseClosed=true;void finish();});response.resume();
   });}catch(e){record.error=errorValue(e);record.closed=true;void finish();return;}
   request.on('socket',current=>{socket=current;captureTls();socket.once('connect',captureTls);socket.once('secureConnect',()=>{secureConnected=true;captureTls();});});
   request.on('error',e=>{record.error??=errorValue(e);captureTls();});request.once('close',()=>{record.closed=true;captureTls();void finish();});signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
   timer=setTimeout(()=>{record.timedOut=true;request.destroy(Object.assign(new Error('Pinned-CA HEAD deadline'),{code:'ETIMEDOUT'}));},5000);request.end();
  });
  const handle={request,join,get joined(){return record.joined;}};this.diagnosticRequests.push(handle);return join;
 }
 async observeKongStart(issued,signal){
  const wait=ms=>new Promise(resolve=>{const done=()=>{clearTimeout(timer);signal.removeEventListener('abort',done);resolve();},timer=setTimeout(done,ms);signal.addEventListener('abort',done,{once:true});if(signal.aborted)done();});
  while(!signal.aborted){const raw=await readFile(issued.stderr,'utf8');if(raw.includes('Starting containers...'))break;await wait(100);}
  if(signal.aborted)return {code:'START_SETTLED_BEFORE_CONTAINER_MARKER'};
  const budget=new AbortController(),deadline=setTimeout(()=>budget.abort(),20000),scope=AbortSignal.any([signal,budget.signal]),snapshots=[];let capturedId;
  const run=async args=>{assert.ok(!scope.aborted,'Start settled or observer budget ended');grantFor(this.grant,this.packet,'diagnose_start');return this.docker(args,{signal:scope,timeoutMs:2000,killGraceMs:100,maxBytes:2*1024*1024});};
  const pause=()=>new Promise(resolve=>{const done=()=>{clearTimeout(timer);scope.removeEventListener('abort',done);resolve();},timer=setTimeout(done,250);scope.addEventListener('abort',done,{once:true});if(scope.aborted)done();});
  try{
   for(let attempt=0;attempt<32&&!scope.aborted;attempt++){
    const image=images.find(i=>i.reference.includes('/kong:')).id;
    const ids=capturedId?[capturedId]:(await run(['ps','-aq','--filter','label=com.supabase.cli.project='+this.packet.projectId,'--filter','label=com.supabase.cli.workdir='+this.packet.fixtureDirectory,'--filter','ancestor='+image])).trim().split('\n').filter(Boolean);
    if(scope.aborted)break;assert.ok(ids.length<=1,'Ambiguous fresh Kong identity');if(!ids.length){await pause();continue;}
    assert.match(ids[0],/^[a-f0-9]{12,64}$/);const [r]=JSON.parse(await run(['inspect',ids[0]]));const inspectReceipt=this.commands.records.at(-1).receipt;if(scope.aborted)break;this.diagnosticKongIdentity(r,issued);if(capturedId)assert.equal(r.Id,capturedId,'Captured Kong identity changed');capturedId=r.Id;
    const observation={code:'KONG_OBSERVED_DIAGNOSTIC_ONLY',containerId:r.Id,cliPid:issued.pid,cliStartedAt:issued.startedAt,created:r.Created,state:r.State,ports:r.NetworkSettings?.Ports,inspectReceipt,at:new Date().toISOString()};
    const snapshot=this.file('DIAGNOSTIC-KONG-'+randomUUID()+'.json');await save(snapshot,observation);snapshots.push(snapshot);observation.snapshot=snapshot;observation.snapshots=[...snapshots];
    const beforeLogs=this.commands.records.length;try{await run(['logs','--timestamps','--tail','200',r.Id]);}catch(e){observation.logsError=String(e);}finally{observation.logsReceipts=this.commands.records.slice(beforeLogs).map(r=>({receipt:r.receipt,stdout:r.stdout,stderr:r.stderr}));}
    const cliHealthMarker='HTTP HEAD: https://127.0.0.1:'+this.packet.ports.api+'/rest-admin/v1/ready',cliHealthStarted=!scope.aborted&&(await readFile(issued.stderr,'utf8')).includes(cliHealthMarker);
    if(!scope.aborted&&this.diagnosticHeadEligible(r,issued)&&cliHealthStarted){observation.transport=await this.diagnosticHead(scope);observation.transportCode=observation.transport.status?'HTTP_'+observation.transport.status:observation.transport.error?.code??'NO_HTTP_RESPONSE';return observation;}
    if(!scope.aborted&&(r.State?.Status==='created'||(this.diagnosticHeadEligible(r,issued)&&!cliHealthStarted))){await pause();continue;}
    observation.transportCode=scope.aborted?'OBSERVER_CANCELLED':'NOT_RUNNING_OR_NO_EXACT_TLS_MAPPING';return observation;
   }
   return {code:signal.aborted?'OBSERVER_CANCELLED':budget.signal.aborted?'OBSERVER_20S_DEADLINE':'NO_TRANSPORT_ATTEMPT_WITHIN_32_ATTEMPTS',snapshots};
  }catch(e){return {code:scope.aborted?'OBSERVER_CANCELLED':'OBSERVER_ERROR',error:String(e),snapshots};}finally{clearTimeout(deadline);budget.abort();}
 }
 async makeTls(){
  grantFor(this.grant,this.packet,'tls');assert.equal(this.grant.opensslSha256,sha(await readFile('/usr/bin/openssl')),'Pin installed OpenSSL source bytes before TLS execution');
  const caConfig='[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=ca_extensions\n[dn]\nCN=shelv Account Fixture '+this.packet.ownerId+'\n[ca_extensions]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\nsubjectKeyIdentifier=hash\n';
  const leafConfig='[req]\nprompt=no\ndistinguished_name=dn\n[dn]\nCN=127.0.0.1\n[server_leaf]\nbasicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=IP:127.0.0.1\n';
  await writeFile(this.file('ca.cnf'),caConfig,{flag:'wx',mode:0o600});await writeFile(this.file('leaf.cnf'),leafConfig,{flag:'wx',mode:0o600});
  for(const name of ['fixture-ca.key','fixture-ca.crt','portal-leaf.key','portal-leaf.crt','portal-leaf.csr'])await writeFile(this.file(name),'',{flag:'wx',mode:0o600});
  const ssl=args=>this.command('/usr/bin/openssl',args,{timeoutMs:30000});
  await ssl(['req','-new','-x509','-newkey','rsa:2048','-nodes','-days','2','-keyout',this.file('fixture-ca.key'),'-out',this.file('fixture-ca.crt'),'-config',this.file('ca.cnf')]);
  await ssl(['req','-new','-newkey','rsa:2048','-nodes','-keyout',this.file('portal-leaf.key'),'-out',this.file('portal-leaf.csr'),'-config',this.file('leaf.cnf')]);
  await ssl(['x509','-req','-in',this.file('portal-leaf.csr'),'-CA',this.file('fixture-ca.crt'),'-CAkey',this.file('fixture-ca.key'),'-set_serial','0x'+randomUUID().replaceAll('-',''),'-days','2','-extfile',this.file('leaf.cnf'),'-extensions','server_leaf','-out',this.file('portal-leaf.crt')]);
  const ca=new X509Certificate(await readFile(this.file('fixture-ca.crt'))),leaf=new X509Certificate(await readFile(this.file('portal-leaf.crt')));assert.equal(ca.ca,true);assert.equal(leaf.ca,false);assert.equal(leaf.checkIP('127.0.0.1'),'127.0.0.1');assert.ok(leaf.verify(ca.publicKey));
  // The CLI uses cert_path as explicit trust roots as well as the gateway chain.
  await writeFile(this.file('gateway-fullchain.crt'),Buffer.concat([await readFile(this.file('portal-leaf.crt')),await readFile(this.file('fixture-ca.crt'))]),{flag:'wx',mode:0o600});
  const files={};for(const name of ['fixture-ca.key','fixture-ca.crt','portal-leaf.key','portal-leaf.crt','portal-leaf.csr','gateway-fullchain.crt']){await chmod(this.file(name),0o600);files[name]={sha256:sha(await readFile(this.file(name))),mode:(await lstat(this.file(name))).mode&0o777};}
  await save(this.file('TLS.json'),{ownerId:this.packet.ownerId,san:'127.0.0.1',issuer:leaf.issuer,validTo:leaf.validTo,files});
 }
 async start({diagnostic=false}={}){
  if(diagnostic)grantFor(this.grant,this.packet,'diagnose_start');grantFor(this.grant,this.packet,'start');await this.recheck();await this.makeTls();
  // Actual CLI performs authentic bootstrap and applies the copied current68.
  // All six compiled required images must already match preflight; no pulls.
  const attempts=this.commands.records.length;
  const networkName='shelv_account_'+this.packet.ownerId.replaceAll('-','');const networkId=(await this.docker(['network','create','--driver','bridge','--label','com.supabase.cli.project='+this.packet.projectId,'--label','com.supabase.cli.workdir='+this.packet.fixtureDirectory,'--label','shelv.account.owner='+this.packet.ownerId,'--opt','com.docker.network.bridge.host_binding_ipv4=127.0.0.1',networkName])).trim();assert.match(networkId,/^[a-f0-9]{64}$/);await save(this.file('CREATED-NETWORK.json'),{name:networkName,id:networkId});
  if(diagnostic){
   const issued=this.commands.issue(this.packet.cli.path,['start','--workdir',this.packet.fixtureDirectory,'--debug','--network-id',networkId,'--exclude','realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor'],{cwd:this.packet.fixtureDirectory,env:{...this.env(),NODE_EXTRA_CA_CERTS:this.file('fixture-ca.crt')},timeoutMs:600000});
   const outcome=await this.joinDiagnosticStart(issued,signal=>this.observeKongStart(issued,signal));const report=this.file('DIAGNOSTIC-START-'+randomUUID()+'.json');await save(report,{stage:'DIAGNOSTIC_ONLY_NO_AUTH_OR_SEED',ownerId:this.packet.ownerId,projectId:this.packet.projectId,cli:outcome.cli,observation:outcome.observation});
   if(outcome.cli.code!==0||outcome.cli.signal||outcome.cli.error||outcome.cli.timedOut||outcome.cli.overflow)throw Error('CLI_START_FAILED; diagnostic '+report+'; command '+outcome.cli.receipt);
   return {diagnosticReport:report,cliReceipt:outcome.cli.receipt,transportCode:outcome.observation.transportCode??outcome.observation.code};
  }
  try{await this.command(this.packet.cli.path,['start','--workdir',this.packet.fixtureDirectory,'--debug','--network-id',networkId,'--exclude','realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor'],{timeoutMs:600000,env:{...this.env(),NODE_EXTRA_CA_CERTS:this.file('fixture-ca.crt')}});}
  catch(e){await this.commands.joinAll();await save(this.file('START-FAILED.json'),{stage:'START_FAILED_RESOURCES_UNCERTAIN',attempts,at:new Date().toISOString(),error:String(e)});throw e;}
  this.resources=await this.capture();await save(this.file('RESOURCES.json'),this.resources);
  const ledger=JSON.parse(await this.sql("select coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name,'statements',statements) order by version),'[]'::jsonb) from supabase_migrations.schema_migrations;"));
  const source=JSON.parse(await readFile(path.join(this.packet.fixtureDirectory,'SOURCE.json'),'utf8'));
  assert.deepEqual(ledger.map(r=>r.version+'_'+r.name+'.sql'),source.ledger.files.map(f=>f.name));assert.equal(ledger.length,68);assert.ok(ledger.every(r=>Array.isArray(r.statements)&&r.statements.every(s=>typeof s==='string')));
  await save(this.file('LEDGER.json'),{sourceLedgerSha256:source.ledger.sha256,runtimeLedgerSha256:sha(json(ledger)),ledger});
  assert.equal(await this.sql('select count(*) from auth.users;'),'0','NEW fixture has unexpected preexisting Auth users');
  const status=JSON.parse(await this.command(this.packet.cli.path,['status','--workdir',this.packet.fixtureDirectory,'--output','json']));assert.equal(status.API_URL,'https://127.0.0.1:'+this.packet.ports.api);assert.ok(typeof status.SERVICE_ROLE_KEY==='string'&&status.SERVICE_ROLE_KEY.length>0);assert.ok(typeof status.ANON_KEY==='string'&&status.ANON_KEY.length>0);
  const db=new URL(status.DB_URL);assert.equal(db.hostname,'127.0.0.1');assert.equal(Number(db.port),this.packet.ports.db);await save(this.file('status.private.json'),status);await chmod(this.file('status.private.json'),0o600);
  await this.recheck();return status;
 }
 async request(status,route,{method='GET',body,admin=false}={}){
  const u=new URL(route,status.API_URL);assert.equal(u.origin,'https://127.0.0.1:'+this.packet.ports.api);assert.ok(route.startsWith('/auth/v1/'));
  const key=admin?status.SERVICE_ROLE_KEY:status.ANON_KEY,ca=await readFile(this.file('fixture-ca.crt'));
  const {response,chunks}=await new Promise((resolve,reject)=>{const chunks=[];let size=0;const request=https.request(u,{method,ca,rejectUnauthorized:true,headers:{apikey:key,authorization:'Bearer '+key,'content-type':'application/json'}},response=>{response.on('data',chunk=>{size+=chunk.length;if(size>65536){request.destroy(Error('Auth response exceeds bound'));return;}chunks.push(chunk);});response.on('error',reject);response.on('end',()=>resolve({response,chunks}));});request.setTimeout(15000,()=>request.destroy(Error('Auth request timeout')));request.on('error',reject);request.end(body===undefined?undefined:JSON.stringify(body));});
  const bytes=Buffer.concat(chunks),id=randomUUID();await writeFile(this.file('AUTH-'+id+'.body'),bytes,{flag:'wx',mode:0o600});await save(this.file('AUTH-'+id+'.json'),{url:u.href,method,status:response.statusCode,bytes:bytes.length,sha256:sha(bytes),adminSetup:admin,at:new Date().toISOString()});const data=JSON.parse(bytes.toString('utf8'));assert.ok(response.statusCode>=200&&response.statusCode<300,'Auth API failed: HTTP '+response.statusCode);return data;
 }
 async seed(status){
  grantFor(this.grant,this.packet,'seed');const actors={};
  for(const key of ['a','b']){const email='account-'+key+'-'+this.packet.ownerId+'@example.invalid',initialDisplayName='Synthetic Account '+key.toUpperCase()+' '+this.packet.ownerId;
   const user=await this.request(status,'/auth/v1/admin/users',{method:'POST',admin:true,body:{email,email_confirm:true,user_metadata:{full_name:initialDisplayName}}});uuid(user.id);assert.equal(user.email,email);assert.equal(user.is_anonymous,false);actors[key]={id:user.id,email,initialDisplayName};
   const literal=s=>"'"+s.replaceAll("'","''")+"'";
   await this.sql(`begin;insert into concierge.enrollments(client_id,display_name,status,phase) values(${literal(user.id)},${literal(initialDisplayName)},'active','premeeting');insert into concierge.cases(client_id) values(${literal(user.id)});commit;`);
  }
  const observed=JSON.parse(await this.sql("select jsonb_agg(jsonb_build_object('id',u.id,'email',u.email,'permanent',u.is_anonymous is false,'confirmed',u.email_confirmed_at is not null,'profile',p.id is not null,'name',e.display_name,'status',e.status,'case',c.client_id is not null,'publishedVersion',c.published_version) order by u.email) from auth.users u left join public.profiles p on p.id=u.id left join concierge.enrollments e on e.client_id=u.id left join concierge.cases c on c.client_id=u.id;"));
  assert.equal(observed.length,2);for(const r of observed){assert.ok(r.permanent&&r.confirmed&&r.profile&&r.case);assert.equal(r.status,'active');assert.equal(r.publishedVersion,0);}await save(this.file('ACTORS.json'),observed);
  // No password sign-in, generated link, injected JWT/cookie, or fake session.
  // Browser must use Root's actual OTP/PKCE and read the local Mailpit link.
  const d={schemaVersion:1,ownerId:this.packet.ownerId,projectId:this.packet.projectId,fixtureDirectory:this.packet.fixtureDirectory,sourceCommit:this.packet.sourceCommit,endpoints:{portal:'https://127.0.0.1:'+this.packet.ports.portal,supabase:status.API_URL,mailpit:'http://127.0.0.1:'+this.packet.ports.mailpit},actors,privateDirectory:this.file(''),fingerprints:{source:'SOURCE.json',config:'private/CONFIG.json',images:'private/IMAGES.json',processes:'private/PROCESSES.json',resources:'private/RESOURCES.json'}};
  d.privateDirectory=path.join(this.packet.fixtureDirectory,'private');validateDescriptor(d);await save(this.file('CONFIG.json'),{sha256:sha(await readFile(path.join(this.packet.fixtureDirectory,'supabase/config.toml')))});await this.writeProcesses();await save(path.join(this.packet.fixtureDirectory,'DESCRIPTOR.json'),d);return d;
 }
 async writeProcesses(){await save(this.file('PROCESSES-'+randomUUID()+'.json'),this.commands.records.map(({child,join,...r})=>r));const target=this.file('PROCESSES.json');try{await regular(target);}catch(e){if(e.code==='ENOENT'){await save(target,this.commands.records.map(({child,join,...r})=>r));return;}throw e;}}
 async recheck(){if(this.activeSourceV2){const f=this.requireRollForwardGrant(this.activeLifecycleAction),b=await this.originalRollForwardBasis(f);this.validateSourceV2(this.activeSourceV2,JSON.parse(await readFile(path.join(this.packet.fixtureDirectory,'DESCRIPTOR-V2.json'),'utf8')),b);return;}const now=await checkSource(this.packet),original=JSON.parse(await readFile(path.join(this.packet.fixtureDirectory,'SOURCE.json'),'utf8'));assert.deepEqual(now,original,'Protected source bytes/kinds/modes/index or CLI changed');const copied=await sourceLedger(this.packet.fixtureDirectory);assert.deepEqual(copied,original.ledger);assert.equal(sha(await readFile(path.join(this.packet.fixtureDirectory,'supabase/config.toml'))),original.configSha256);}
 async observe(){
  grantFor(this.grant,this.packet,'observe');if(this.activeBasis)await this.verifySameLiveStack(this.activeBasis);assert.ok(this.resources);const sessions=JSON.parse(await this.sql("select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'userId',s.user_id,'createdAt',s.created_at,'updatedAt',s.updated_at,'notAfter',s.not_after) order by s.id),'[]'::jsonb) from auth.sessions s;"));
  const profiles=JSON.parse(await this.sql("select coalesce(jsonb_agg(jsonb_build_object('id',e.client_id,'displayName',e.display_name,'revision',h.revision) order by e.client_id),'[]'::jsonb) from concierge.enrollments e left join concierge.account_profile_heads_v1 h on h.client_id=e.client_id;"));await this.recheck();const resources=await this.capture();
  if(this.activeBasis)await this.revalidateCodeCommit(this.activeBasis,'observe');else await this.recheck();grantFor(this.grant,this.packet,'observe');
  const observation={at:new Date().toISOString(),sessions,profiles,resources};await save(this.file('OBSERVATION-'+randomUUID()+'.json'),observation);
  if(this.activeBasis)await this.revalidateCodeCommit(this.activeBasis,'observe');else await this.recheck();grantFor(this.grant,this.packet,'observe');return observation;
 }
 async stop(){
  grantFor(this.grant,this.packet,'stop');if(this.activeBasis)await this.verifySameLiveStack(this.activeBasis);assert.ok(typeof this.grant.browserReturnReference==='string'&&this.grant.browserReturnReference.length>20,'Parent must explicitly return joined browser custody before stop');assert.ok(this.resources,'No captured stack to stop');this.commands.assertJoined();
  const now=await this.capture();assert.deepEqual(now.containers.map(c=>c.id).sort(),this.resources.containers.map(c=>c.id).sort(),'Container identities changed');assert.deepEqual(now.volumes,this.resources.volumes,'Volume identities changed');
  const db=this.resources.containers.find(c=>c.name==='/supabase_db_'+this.packet.projectId);assert.ok(db);
  await this.docker(['exec',db.id,'pg_dump','-U','postgres','-d','postgres','--no-owner'],{maxBytes:64*1024*1024});
  if(this.activeBasis)await this.revalidateCodeCommit(this.activeBasis,'stop');else await this.recheck();
  grantFor(this.grant,this.packet,'stop');
  await this.docker(['stop','--time','30',...this.resources.containers.map(c=>c.id)],{timeoutMs:90000});await this.commands.joinAll();
  for(const c of this.resources.containers){const [r]=JSON.parse(await this.docker(['inspect',c.id]));assert.equal(r.State.Running,false);assert.equal(r.Id,c.id);}
  this.commands.assertJoined();await this.recheck();await save(this.file('STOPPED.json'),{stage:'STOPPED_RETAINED',ownerId:this.packet.ownerId,projectId:this.packet.projectId,at:new Date().toISOString(),containers:this.resources.containers.map(c=>c.id),volumesRetained:true,networksRetained:true,allIssuedCommandsJoined:true});
 }
}
export async function verifyJoinedReceipts(directory){
 const names=await readdir(directory);for(const name of names.filter(n=>/^[a-f0-9-]{36}\.issued\.json$/.test(n))){const issued=JSON.parse(await readFile(path.join(directory,name),'utf8')),completion=path.join(directory,name.replace('.issued.json','.json'));let done;try{done=JSON.parse(await readFile(completion,'utf8'));}catch{throw Error('Prior issued command has no joined completion; do not adopt/clean STOP');}assert.equal(done.id,issued.id);assert.equal(done.joined,true,'Prior command unjoined');assert.deepEqual(done.argv,issued.argv);assert.equal(done.cwd,issued.cwd);}
}
async function main(){const [mode,packetFile,grantFile]=process.argv.slice(2);assert.ok(['sourcecheck','prepare','preflight','start','start-prepared','diagnose-start','diagnose-start-prepared','roll-forward-code','observe','stop'].includes(mode),'Use sourcecheck|prepare|preflight|start|start-prepared|diagnose-start|diagnose-start-prepared|roll-forward-code|observe|stop packet.json [grant.json]');const p=validatePacket(JSON.parse(await readFile(packetFile,'utf8')));if(mode==='sourcecheck'){const checked=await checkSource(p);console.log(json({stage:checked.stage,executor:checked.executor,sourceCommit:checked.sourceCommit,migrationCount:checked.ledger.migrationCount,sourceLedgerSha256:checked.ledger.sha256,protectedFiles:checked.source.files.length,protectedSha256:checked.source.sha256,configSha256:checked.configSha256,cli:checked.cli,openssl:checked.openssl}));return;}
 if(mode==='prepare'){await prepare(p);console.log('Source prepared only; no runtime acquired.');return;}
 assert.ok(grantFile,'Exact external Parent resource grant required');const runtime=new AccountFixture(p,JSON.parse(await readFile(grantFile,'utf8')));if(mode==='roll-forward-code'){const result=await runtime.rollForwardCode();console.log(json(result));return;}if(mode==='observe'||mode==='stop'){await runtime.attach(mode);if(mode==='observe'){await runtime.observe();console.log('Actual own DB/session observation retained privately.');}else{await runtime.stop();console.log('Captured NEW stack stopped; evidence, containers, networks and volumes retained.');}return;}if(mode==='start-prepared'||mode==='diagnose-start-prepared')await runtime.openPrepared();else await runtime.initialize();try{await runtime.preflight();if(mode==='diagnose-start'||mode==='diagnose-start-prepared'){const diagnostic=await runtime.start({diagnostic:true});console.log(json(diagnostic));}else if(mode==='start'||mode==='start-prepared'){const status=await runtime.start();const descriptor=await runtime.seed(status);console.log(json({stage:'STACK_SEEDED_NOT_BROWSER_ACCEPTED',descriptor:path.join(p.fixtureDirectory,'DESCRIPTOR.json'),ownerId:descriptor.ownerId,projectId:descriptor.projectId}));}else console.log('Fresh preflight passed; no stack started.');}catch(e){await runtime.commands.joinAll();throw e;}}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){main().catch(error=>{console.error(String(error));process.exitCode=1;});}
