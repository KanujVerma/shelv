// SOURCE candidate. Inert on import. No action without a NEW external packet.
import assert from 'node:assert/strict';
import path from 'node:path';
import https from 'node:https';
import {readFileSync,writeFileSync,lstatSync,realpathSync,readlinkSync,readdirSync,openSync,closeSync,writeSync,fsyncSync,mkdirSync,existsSync,constants} from 'node:fs';
import {createHash,randomUUID,X509Certificate} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {JoinedCommands} from '../source/native-read-joined.mjs';
const SELF=fileURLToPath(import.meta.url),DIR=path.resolve(path.dirname(SELF),'../source');
const ROOT='/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030',SOURCE='359c6bf0c759357df648ca441e9e3d1c3d29398c';
const TARGET='be2e06bcbd45665e2f2e191dafb5d6d284f0a2591987ad236a6efce02e21eb1e',HELPER='ce531f59f8460ac4e1df7c750401b01d3f69250da3c857ad3ff2108d610e835d',SQL='5a7963f718a6322cb56e88711823ee3e389ec1951f2285e91f1c2dae00345f49';
const SOURCE_TASK='node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Athread-send%3Amilestone-20261103-m04-trusted-principal-executor-source';
const NODE='/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node',DIGEST=/^[a-f0-9]{64}$/,UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const ACTIONS=['create-two-permanent-synthetic-principals','activate-initial-plan-policy'];
const FORMAT='{"Id":{{json .Id}},"Name":{{json .Name}},"Image":{{json .Image}},"Created":{{json .Created}},"State":{{json .State}},"RestartCount":{{json .RestartCount}},"Labels":{{json .Config.Labels}},"Mounts":{{json .Mounts}},"Ports":{{json .NetworkSettings.Ports}},"Networks":{{json .NetworkSettings.Networks}}}';
const sha=x=>createHash('sha256').update(x).digest('hex'),json=x=>JSON.stringify(x,null,2)+'\n';
const need=(ok,code)=>{if(!ok)throw Error(code);};
const exact=(v,keys)=>need(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===[...keys].sort().join('|'),'E_PRINCIPAL_FIELDS');
const absolute=p=>typeof p==='string'&&path.isAbsolute(p)&&path.normalize(p)===p,below=(p,c)=>absolute(c)&&c.startsWith(p+path.sep);
const equal=(a,b,code)=>{try{assert.deepEqual(a,b);}catch{throw Error(code);}};
const parse=(b,code)=>{try{return JSON.parse(b);}catch{throw Error(code);}};

export function validateExecutionGrant(input){
 exact(input,['grantBytes','expectedGrantSha256','executionTaskId','executorSha256','sqlSha256']);
 const {grantBytes,expectedGrantSha256,executionTaskId,executorSha256,sqlSha256}=input;
 need(Buffer.isBuffer(grantBytes)&&grantBytes.length>0&&grantBytes.length<=65536&&DIGEST.test(expectedGrantSha256??'')&&sha(grantBytes)===expectedGrantSha256,'E_PRINCIPAL_RAW_HASH');
 const g=parse(grantBytes,'E_PRINCIPAL_JSON');exact(g,['schemaVersion','kind','parentThreadId','executionTaskId','ownerId','projectId','source','executor','helper','sql','context','attempt','expiresAt','authorization','actions']);
 need(g.schemaVersion===1&&g.kind==='M04_TRUSTED_PRINCIPAL_SETUP','E_PRINCIPAL_VERSION');need(g.parentThreadId==='9b085ada-435f-48d6-8886-957c1ce3e82d','E_PRINCIPAL_PARENT');
 need(typeof executionTaskId==='string'&&executionTaskId.startsWith('node:delegated-task:')&&executionTaskId!==SOURCE_TASK&&g.executionTaskId===executionTaskId,'E_PRINCIPAL_EXECUTION_ID');
 need(UUID.test(g.ownerId)&&g.projectId==='sa-'+g.ownerId.replaceAll('-',''),'E_PRINCIPAL_OWNER');need(typeof g.authorization==='string'&&g.authorization.length>20&&g.authorization.length<1000,'E_PRINCIPAL_AUTHORIZATION');
 need(typeof g.expiresAt==='string'&&Number.isFinite(Date.parse(g.expiresAt))&&Date.parse(g.expiresAt)>Date.now(),'E_PRINCIPAL_EXPIRED');equal(g.actions,ACTIONS,'E_PRINCIPAL_ACTIONS');
 exact(g.source,['root','commit','targetFile','targetSha256','gitMetadata']);need(g.source.root===ROOT&&g.source.commit===SOURCE&&g.source.targetFile===path.join(DIR,'ROOT_359C_SOURCE_TARGET.json')&&g.source.targetSha256===TARGET,'E_PRINCIPAL_SOURCE');
 exact(g.source.gitMetadata,['headFile','headSha256','indexFile','indexSha256','logicalIndexSha256','statusSha256']);const m=g.source.gitMetadata;need(absolute(m.headFile)&&absolute(m.indexFile)&&[m.headSha256,m.indexSha256,m.logicalIndexSha256,m.statusSha256].every(x=>DIGEST.test(x)),'E_PRINCIPAL_GIT_CUSTODY');
 for(const [name,want]of [['executor',SELF],['helper',path.join(DIR,'native-read-joined.mjs')],['sql',path.join(DIR,'principal-setup.sql')]]){exact(g[name],['path','sha256']);need(g[name].path===want&&DIGEST.test(g[name].sha256),'E_PRINCIPAL_OWN_SOURCE');}
 need(DIGEST.test(executorSha256??'')&&g.executor.sha256===executorSha256&&g.helper.sha256===HELPER&&sqlSha256===SQL&&g.sql.sha256===SQL,'E_PRINCIPAL_OWN_SOURCE');
 exact(g.context,['fixtureDirectory','descriptor','sourceRecord','resources','runtimeLedger','status','ca','docker','database']);const c=g.context,b=c.fixtureDirectory;
 need(below(path.join(ROOT,'.local-artifacts'),b),'E_PRINCIPAL_CONTEXT_PATH');
 for(const [key,relative]of [['descriptor','DESCRIPTOR.json'],['sourceRecord','SOURCE.json'],['resources','private/RESOURCES.json'],['runtimeLedger','private/LEDGER.json'],['status','private/status.private.json'],['ca','private/fixture-ca.crt']]){exact(c[key],['file','sha256']);need(c[key].file===path.join(b,relative)&&DIGEST.test(c[key].sha256),'E_PRINCIPAL_CONTEXT_PATH');}
 exact(c.docker,['path','sha256','host']);need(c.docker.path==='/opt/homebrew/bin/docker'&&DIGEST.test(c.docker.sha256)&&c.docker.host==='unix:///Users/kanuj/.colima/shelv-portal-20261024/docker.sock','E_PRINCIPAL_DOCKER');
 exact(c.database,['id','name','imageId','created','startedAt','labels','ports','networks']);const d=c.database;
 need(DIGEST.test(d.id)&&d.name==='/supabase_db_'+g.projectId&&/^sha256:[a-f0-9]{64}$/.test(d.imageId)&&Number.isFinite(Date.parse(d.created))&&Number.isFinite(Date.parse(d.startedAt))&&Date.parse(d.startedAt)>=Date.parse(d.created),'E_PRINCIPAL_DB');
 need(d.labels?.['com.supabase.cli.project']===g.projectId&&d.labels?.['com.supabase.cli.workdir']===b&&d.ports&&d.networks&&Object.keys(d.networks).length>0,'E_PRINCIPAL_DB');
 exact(g.attempt,['claimFile']);need(g.attempt.claimFile===path.join(b,'private/M04-PRINCIPAL-SETUP-ATTEMPT.json'),'E_PRINCIPAL_ATTEMPT_PATH');return Object.freeze(structuredClone(g));
}

// Concurrency bookkeeping only; a native slot grants no actor or resource rights.
class NativeSlot {
 #active=null;
 claim(kind){need(['inspect','sql','https'].includes(kind),'E_PRINCIPAL_SLOT_KIND');need(this.#active===null,'E_PRINCIPAL_SLOT_BUSY');const token=Object.freeze({kind});this.#active=token;return token;}
 release(token){need(token===this.#active&&token!==null,'E_PRINCIPAL_SLOT_OWNER');this.#active=null;}
 assertIdle(){need(this.#active===null,'E_PRINCIPAL_SLOT_UNJOINED');}
}
let activeExecution=null;
function noLinks(dir){need(absolute(dir),'E_PRINCIPAL_PATH');let p=path.parse(dir).root;for(const part of dir.split(path.sep).filter(Boolean)){p=path.join(p,part);const s=lstatSync(p);need(s.isDirectory()&&!s.isSymbolicLink(),'E_PRINCIPAL_SYMLINK');}}
function bytesAt(file,{mode=0o600,max=32*1024*1024,min=1}={}){need(absolute(file),'E_PRINCIPAL_PATH');noLinks(path.dirname(file));const s=lstatSync(file);need(s.isFile()&&!s.isSymbolicLink()&&(s.mode&0o7777)===mode&&s.size>=min&&s.size<=max,'E_PRINCIPAL_FILE_MODE');const fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW);try{const b=readFileSync(fd);need(b.length===s.size,'E_PRINCIPAL_FILE_DRIFT');return b;}finally{closeSync(fd);}}
function save(dir,name,value){noLinks(dir);need((lstatSync(dir).mode&0o7777)===0o700,'E_PRINCIPAL_EVIDENCE_MODE');const f=path.join(dir,name);need(path.dirname(f)===dir,'E_PRINCIPAL_PATH');const fd=openSync(f,'wx',0o600);try{writeSync(fd,Buffer.isBuffer(value)?value:Buffer.from(json(value)));fsyncSync(fd);}finally{closeSync(fd);}return f;}
function initialContext(g){
 for(const key of ['descriptor','sourceRecord','resources','runtimeLedger','status','ca'])need(sha(bytesAt(g.context[key].file))===g.context[key].sha256,'E_PRINCIPAL_CONTEXT_DRIFT');
 const d=parse(bytesAt(g.context.descriptor.file),'E_PRINCIPAL_DESCRIPTOR'),r=parse(bytesAt(g.context.resources.file),'E_PRINCIPAL_RESOURCES');
 need(d.schemaVersion===1&&d.ownerId===g.ownerId&&d.projectId===g.projectId&&d.sourceCommit===SOURCE&&d.fixtureDirectory===g.context.fixtureDirectory&&d.privateDirectory===path.join(g.context.fixtureDirectory,'private')&&r.ownerId===g.ownerId&&r.projectId===g.projectId,'E_PRINCIPAL_CONTEXT_OWNER');
 exact(d.actors,['a','b']);for(const file of ['STOPPED.json','STOPPED_RETAINED.json','START-FAILED.json'])need(!existsSync(path.join(d.privateDirectory,file)),'E_PRINCIPAL_STOPPED_CONTEXT');
}
function capturedStart(resources,db,expected){
 need(db.running===true&&Number.isFinite(Date.parse(resources.at))&&Date.parse(expected.startedAt)<=Date.parse(resources.at)&&Date.parse(db.created)<=Date.parse(expected.startedAt),'E_PRINCIPAL_CAPTURED_START');
 if(db.startedAt!==undefined)need(db.startedAt===expected.startedAt,'E_PRINCIPAL_CAPTURED_START');
 equal(db.labels,expected.labels,'E_PRINCIPAL_CAPTURED_LABELS');
}
function gitRead(ctx,args){
 const choices=[['rev-parse','HEAD'],['ls-files','--stage','-z'],['status','--porcelain=v1','-z'],['rev-parse','--absolute-git-dir']];need(choices.some(v=>JSON.stringify(v)===JSON.stringify(args)),'E_PRINCIPAL_GIT_ARGV');
 const env={PATH:'/usr/bin:/bin',GIT_OPTIONAL_LOCKS:'0',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'};let stdout='',stderr='',exit=0;
 try{stdout=execFileSync('/usr/bin/git',args,{cwd:ROOT,env,encoding:'utf8',maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']});}catch(e){stdout=e.stdout?.toString()??'';stderr=e.stderr?.toString()??'';exit=Number.isInteger(e.status)?e.status:1;}
 save(ctx.directory,randomUUID()+'.git.json',{argv:['/usr/bin/git',...args],cwd:ROOT,env,exit,stdout,stderr});need(exit===0,'E_PRINCIPAL_GIT_READ');return stdout;
}
function fence(ctx){
 const g=ctx.g;need(activeExecution===ctx.token&&!ctx.signal?.aborted,'E_PRINCIPAL_LIFETIME');need(Date.parse(g.expiresAt)>Date.now(),'E_PRINCIPAL_EXPIRED');need(sha(bytesAt(ctx.grantFile,{max:65536}))===ctx.grantHash,'E_PRINCIPAL_GRANT_DRIFT');
 for(const [file,digest]of [[SELF,g.executor.sha256],[g.helper.path,HELPER],[g.sql.path,SQL],[g.source.targetFile,TARGET]])need(sha(bytesAt(file))===digest,'E_PRINCIPAL_OWN_SOURCE');
 const t=parse(bytesAt(g.source.targetFile),'E_PRINCIPAL_TARGET');need(t.head===SOURCE&&t.files.length===2376,'E_PRINCIPAL_TARGET');noLinks(ROOT);need(realpathSync(ROOT)===ROOT,'E_PRINCIPAL_ROOT');
 for(const e of t.files){const f=path.join(ROOT,e.name);need(below(ROOT,f),'E_PRINCIPAL_SOURCE_PATH');noLinks(path.dirname(f));const s=lstatSync(f),link=s.isSymbolicLink();need((e.kind==='symlink'?link:s.isFile()&&!link)&&(s.mode&0o777)===e.mode,'E_PRINCIPAL_SOURCE_MODE');const b=link?Buffer.from(readlinkSync(f)):readFileSync(f);need(b.length===e.bytes&&sha(b)===e.sha256,'E_PRINCIPAL_SOURCE_BYTES');}
 need(t.files.filter(e=>/^supabase\/migrations\/[^/]+\.sql$/.test(e.name)).length===68,'E_PRINCIPAL_LEDGER_SOURCE');
 const gd=gitRead(ctx,['rev-parse','--absolute-git-dir']).trim();need(absolute(gd)&&realpathSync(gd)===gd&&g.source.gitMetadata.headFile===path.join(gd,'HEAD')&&g.source.gitMetadata.indexFile===path.join(gd,'index'),'E_PRINCIPAL_GIT_PATH');
 need(sha(readFileSync(path.join(gd,'HEAD')))===g.source.gitMetadata.headSha256&&sha(readFileSync(path.join(gd,'index')))===g.source.gitMetadata.indexSha256,'E_PRINCIPAL_GIT_RAW_CUSTODY');
 need(gitRead(ctx,['rev-parse','HEAD']).trim()===SOURCE,'E_PRINCIPAL_SOURCE_HEAD');const logical=sha(gitRead(ctx,['ls-files','--stage','-z'])),status=sha(gitRead(ctx,['status','--porcelain=v1','-z']));need(logical===t.indexSha256&&logical===g.source.gitMetadata.logicalIndexSha256&&status===sha(t.status)&&status===g.source.gitMetadata.statusSha256,'E_PRINCIPAL_SOURCE_STAGE_STATUS');
 const p=path.join(g.context.fixtureDirectory,'private');noLinks(p);need((lstatSync(p).mode&0o7777)===0o700,'E_PRINCIPAL_PRIVATE_MODE');
 for(const name of ['descriptor','sourceRecord','resources','runtimeLedger','status','ca'])need(sha(bytesAt(g.context[name].file))===g.context[name].sha256,'E_PRINCIPAL_CONTEXT_DRIFT');
 if(ctx.claimSha)need(sha(bytesAt(g.attempt.claimFile))===ctx.claimSha,'E_PRINCIPAL_ATTEMPT_CUSTODY');
 for(const name of ['STOPPED.json','STOPPED_RETAINED.json','START-FAILED.json'])need(!existsSync(path.join(p,name)),'E_PRINCIPAL_STOPPED_CONTEXT');
 const dr=realpathSync(g.context.docker.path),ds=lstatSync(dr);need(ds.isFile()&&!ds.isSymbolicLink()&&(ds.mode&0o111)!==0&&sha(readFileSync(dr))===g.context.docker.sha256,'E_PRINCIPAL_DOCKER_BYTES');if(ctx.dockerCustody)equal({path:dr,mode:ds.mode&0o7777},ctx.dockerCustody,'E_PRINCIPAL_DOCKER_CUSTODY');else ctx.dockerCustody={path:dr,mode:ds.mode&0o7777};
 const d=parse(bytesAt(g.context.descriptor.file),'E_PRINCIPAL_DESCRIPTOR');need(d.schemaVersion===1&&d.ownerId===g.ownerId&&d.projectId===g.projectId&&d.sourceCommit===SOURCE&&d.fixtureDirectory===g.context.fixtureDirectory&&d.privateDirectory===p,'E_PRINCIPAL_DESCRIPTOR');exact(d.actors,['a','b']);for(const a of Object.values(d.actors))need(UUID.test(a.id)&&typeof a.email==='string'&&a.email.endsWith('.invalid'),'E_PRINCIPAL_ACTOR');need(d.actors.a.id!==d.actors.b.id,'E_PRINCIPAL_ACTOR');const u=new URL(d.endpoints.supabase);need(u.protocol==='https:'&&u.hostname==='127.0.0.1'&&u.port&&u.origin===d.endpoints.supabase,'E_PRINCIPAL_HTTPS_ORIGIN');
 const source=parse(bytesAt(g.context.sourceRecord.file),'E_PRINCIPAL_SOURCE_RECORD');need(source.sourceCommit===SOURCE&&source.source?.head===SOURCE&&source.ledger?.migrationCount===68,'E_PRINCIPAL_SOURCE_RECORD');equal(source.source.files,t.files,'E_PRINCIPAL_SOURCE_RECORD');need(sha(bytesAt(path.join(g.context.fixtureDirectory,'supabase/config.toml')))===source.configSha256,'E_PRINCIPAL_CONFIG_CUSTODY');
 const migrationDir=path.join(g.context.fixtureDirectory,'supabase/migrations'),names=readdirSync(migrationDir).filter(n=>n.endsWith('.sql')).sort();equal(names,source.ledger.files.map(f=>f.name),'E_PRINCIPAL_LEDGER_SOURCE');for(const f of source.ledger.files)need(sha(bytesAt(path.join(migrationDir,f.name),{mode:f.mode}))===f.sha256,'E_PRINCIPAL_LEDGER_SOURCE');
 const resources=parse(bytesAt(g.context.resources.file),'E_PRINCIPAL_RESOURCES');need(resources.ownerId===g.ownerId&&resources.projectId===g.projectId,'E_PRINCIPAL_RESOURCES');const dbs=resources.containers?.filter(r=>r.id===g.context.database.id);need(dbs?.length===1,'E_PRINCIPAL_DB_RESOURCE');const db=dbs[0],expected=g.context.database;need(db.name===expected.name&&db.imageId===expected.imageId&&db.created===expected.created,'E_PRINCIPAL_DB_RESOURCE');capturedStart(resources,db,expected);equal(db.networkSettings?.Ports??db.ports,expected.ports,'E_PRINCIPAL_DB_RESOURCE');equal(db.networkSettings?.Networks??db.networks,expected.networks,'E_PRINCIPAL_DB_RESOURCE');need(Array.isArray(db.mounts??db.Mounts),'E_PRINCIPAL_DB_MOUNTS');
 for(const network of Object.values(expected.networks)){const n=resources.networks?.find(r=>(r.Id??r.id)===network.NetworkID);need(n&&(n.Labels??n.labels)?.['shelv.account.owner']===g.ownerId&&(n.Labels??n.labels)?.['com.supabase.cli.project']===g.projectId,'E_PRINCIPAL_NETWORK_OWNER');}
 const gateway=resources.containers.find(r=>r.name==='/supabase_kong_'+g.projectId),bindings=Object.values(gateway?.networkSettings?.Ports??gateway?.ports??{}).flatMap(v=>v??[]);need(gateway&&bindings.some(b=>b.HostIp==='127.0.0.1'&&b.HostPort===u.port),'E_PRINCIPAL_API_PORT_CUSTODY');
 const statusRecord=parse(bytesAt(g.context.status.file),'E_PRINCIPAL_STATUS');need(statusRecord.API_URL===u.origin&&typeof statusRecord.SERVICE_ROLE_KEY==='string'&&statusRecord.SERVICE_ROLE_KEY.length>0,'E_PRINCIPAL_STATUS');const ca=bytesAt(g.context.ca.file),cert=new X509Certificate(ca);need(cert.ca&&Date.parse(cert.validFrom)<=Date.now()&&Date.parse(cert.validTo)>Date.now(),'E_PRINCIPAL_CA');const ledger=parse(bytesAt(g.context.runtimeLedger.file),'E_PRINCIPAL_LEDGER');need(ledger.ledger?.length===68&&ledger.runtimeLedgerSha256===sha(json(ledger.ledger)),'E_PRINCIPAL_LEDGER');ctx.descriptor=d;ctx.source=source;ctx.resources=resources;ctx.ledger=ledger;ctx.status=statusRecord;ctx.ca=ca;
}
async function command(ctx,kind,args,input){
 fence(ctx);const ticket=ctx.slot.claim(kind);let issued;
 try{
  issued=ctx.commands.issue(ctx.g.context.docker.path,['--host',ctx.g.context.docker.host,...args],{cwd:ctx.g.context.fixtureDirectory,env:{PATH:'/usr/bin:/bin:/opt/homebrew/bin',DOCKER_HOST:ctx.g.context.docker.host},input,timeoutMs:30000,maxBytes:16*1024*1024,signal:ctx.signal});ctx.issued.push(issued);
  const result=await issued.join;fence(ctx);need(result.joined&&result.closed&&result.code===0&&!result.signal&&!result.error&&!result.timedOut&&!result.overflow&&!result.aborted,'E_PRINCIPAL_COMMAND');const bytes=bytesAt(result.stdout,{max:16*1024*1024,min:0});fence(ctx);return {bytes,receipt:result.receipt,stdout:result.stdout,stderr:result.stderr};
 }finally{
  // Joining issued children is mandatory even when a validity fence has failed.
  if(issued&&!issued.joined)await issued.join;
  ctx.slot.release(ticket);
 }
}
async function inspectDb(ctx){
 const result=await command(ctx,'inspect',['inspect','--format',FORMAT,ctx.g.context.database.id]);fence(ctx);const r=parse(result.bytes,'E_PRINCIPAL_INSPECT'),d=ctx.g.context.database;
 exact(r,['Id','Name','Image','Created','State','RestartCount','Labels','Mounts','Ports','Networks']);need(r.Id===d.id&&r.Name===d.name&&r.Image===d.imageId&&r.Created===d.created&&r.State?.Running===true&&r.State.Paused===false&&r.State.Restarting===false&&r.State.StartedAt===d.startedAt&&r.RestartCount===0,'E_PRINCIPAL_DB_LIVE');equal(r.Labels,d.labels,'E_PRINCIPAL_DB_LABELS');equal(r.Ports,d.ports,'E_PRINCIPAL_DB_PORTS');equal(r.Networks,d.networks,'E_PRINCIPAL_DB_NETWORKS');const original=ctx.resources.containers.find(x=>x.id===d.id);equal(r.Mounts,original.mounts??original.Mounts,'E_PRINCIPAL_DB_MOUNTS');fence(ctx);return result;
}
function sqlText(ctx,kind,actors){
 need(['read','apply','roles'].includes(kind),'E_PRINCIPAL_SQL_KIND');
 const all=bytesAt(ctx.g.sql.path).toString('utf8'),section=kind==='apply'?'APPLY':kind==='roles'?'ROLES':'READ',start='-- @'+section+'_BEGIN',end='-- @'+section+'_END';need(all.indexOf(start)>=0&&all.indexOf(end)>all.indexOf(start),'E_PRINCIPAL_SQL_SOURCE');let text=all.slice(all.indexOf(start)+start.length,all.indexOf(end));
 if(kind==='apply'||kind==='roles'){
  const fields={A_ID:ctx.descriptor.actors.a.id,B_ID:ctx.descriptor.actors.b.id,OWNER_ID:actors.owner.id,VIEWER_ID:actors.viewer.id,OWNER_EMAIL:actors.owner.email,VIEWER_EMAIL:actors.viewer.email};
  for(const [key,value]of Object.entries(fields)){need(typeof value==='string'&&!value.includes("'"),'E_PRINCIPAL_SQL_LITERAL');if(key.endsWith('_ID'))need(UUID.test(value),'E_PRINCIPAL_SQL_LITERAL');text=text.replaceAll('__'+key+'__',"'"+value+"'");}need(!text.includes('__'),'E_PRINCIPAL_SQL_SOURCE');
 }
 return text;
}
async function query(ctx,kind,actors){
 await inspectDb(ctx);fence(ctx);const result=await command(ctx,'sql',['exec','-i',ctx.g.context.database.id,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres','-f','-'],sqlText(ctx,kind,actors));fence(ctx);await inspectDb(ctx);fence(ctx);
 if(kind==='apply')return result;const value=parse(result.bytes,'E_PRINCIPAL_SQL_JSON');fence(ctx);return {value,proof:result};
}
function validateRows(ctx,row,actors,baseline,committed=false){
 const expected=[ctx.descriptor.actors.a,ctx.descriptor.actors.b,...Object.values(actors??{})];need(row.users?.length===expected.length,'E_PRINCIPAL_BASELINE_USERS');
 for(const u of row.users){const a=expected.find(a=>a.id===u.id);need(a&&u.email===a.email&&u.anonymous===false&&u.confirmed===true&&u.deleted===null&&(u.bannedUntil===null||Date.parse(u.bannedUntil)<=Date.now()),'E_PRINCIPAL_ACTUAL_IDENTITY');const p=row.profiles?.filter(p=>p.id===u.id);need(p?.length===1&&p[0].email===a.email&&p[0].deletionStartedAt===null,'E_PRINCIPAL_TRIGGER_PROFILE');}
 need(row.profiles.length===expected.length&&row.cases?.length===2&&row.cases.every(c=>[ctx.descriptor.actors.a.id,ctx.descriptor.actors.b.id].includes(c.id)&&c.publishedVersion===0)&&row.enrollments?.length===2&&row.enrollments.every(e=>[ctx.descriptor.actors.a.id,ctx.descriptor.actors.b.id].includes(e.id)&&e.status==='active'),'E_PRINCIPAL_CLIENT_BASELINE');equal(row.ledger,ctx.ledger.ledger,'E_PRINCIPAL_RUNTIME_LEDGER');need(row.effects&&Object.values(row.effects).every(n=>n===0),'E_PRINCIPAL_PRIOR_BUSINESS');
 if(!committed){need(row.advisors?.length===0&&row.principals?.length===0,'E_PRINCIPAL_PRIOR_ROLES');equal(row.policy,{singleton:true,activated:false,owner_actor_id:null,revision:0,require_kanuj_approval:true},'E_PRINCIPAL_POLICY_BASELINE');}
 else{
  need(row.advisors?.length===2&&row.principals?.length===2,'E_PRINCIPAL_FINAL_ROLES');
  for(const [role,a]of Object.entries(actors)){equal(row.advisors.find(v=>v.user_id===a.id),{user_id:a.id,active:true,can_view:true,can_edit:role==='owner',can_publish:role==='owner',can_confirm_payments:role==='owner',can_admit_clients:false},'E_PRINCIPAL_FINAL_ROLES');equal(row.principals.find(v=>v.actor_id===a.id),{actor_id:a.id,kind:role==='owner'?'owner':'human',active:true},'E_PRINCIPAL_FINAL_ROLES');}
  equal(row.policy,{singleton:true,activated:true,owner_actor_id:actors.owner.id,revision:1,require_kanuj_approval:true},'E_PRINCIPAL_FINAL_POLICY');
 }
 if(baseline){for(const key of ['cases','enrollments','profileHeads','administration'])equal(row[key],baseline[key],'E_PRINCIPAL_UNRELATED_EFFECT');const ids=[ctx.descriptor.actors.a.id,ctx.descriptor.actors.b.id];equal(row.profiles.filter(p=>ids.includes(p.id)),baseline.profiles,'E_PRINCIPAL_CLIENT_PROFILE_CHANGED');}
}
async function adminCreate(ctx,role){
 const email=role+'-'+ctx.g.ownerId.toLowerCase()+'@example.invalid';need(['owner','viewer'].includes(role)&&!Object.values(ctx.descriptor.actors).some(a=>a.email===email),'E_PRINCIPAL_EMAIL');
 await inspectDb(ctx);fence(ctx);const ticket=ctx.slot.claim('https');let released=false;
 const url=new URL('/auth/v1/admin/users',ctx.descriptor.endpoints.supabase),body=Buffer.from(JSON.stringify({email,email_confirm:true}));let request,socket,timer,requestClosed=false,responseEnded=false,error=null,status=null,rawRecorded=false;const chunks=[],socketJoins=[];let size=0;
 let endRequest;const requestJoin=new Promise(resolve=>{endRequest=resolve;});
 try{
  request=https.request(url,{method:'POST',ca:ctx.ca,rejectUnauthorized:true,agent:false,headers:{apikey:ctx.status.SERVICE_ROLE_KEY,authorization:'Bearer '+ctx.status.SERVICE_ROLE_KEY,'content-type':'application/json','content-length':body.length,connection:'close'}},response=>{
   status=response.statusCode;socketJoins.push(new Promise(resolve=>response.once('close',resolve)));response.on('data',chunk=>{try{fence(ctx);size+=chunk.length;need(size<=65536,'E_PRINCIPAL_HTTP_SIZE');chunks.push(Buffer.from(chunk));}catch(e){error=e;request.destroy(e);}});response.once('end',()=>{responseEnded=true;});response.once('error',e=>{error??=e;});response.once('close',()=>{if(!responseEnded)error??=Error('E_PRINCIPAL_HTTP_INCOMPLETE');});
  });
  request.once('socket',s=>{socket=s;socketJoins.push(new Promise(resolve=>s.once('close',resolve)));});request.once('error',e=>{error??=e;});request.once('close',()=>{requestClosed=true;endRequest();});
 }catch(e){error=e;endRequest();}
 const resource={request,join:null};
 // A close join must remain live even if a source/expiry fence later refuses.
 resource.join=(async()=>{await requestJoin;await Promise.all(socketJoins);})();ctx.http.push(resource);
 const abort=()=>request?.destroy(Error('E_PRINCIPAL_ABORTED'));
 try{
  if(request){timer=setTimeout(()=>request.destroy(Error('E_PRINCIPAL_HTTP_TIMEOUT')),15000);ctx.signal?.addEventListener('abort',abort,{once:true});if(ctx.signal?.aborted)abort();request.end(body);}
  fence(ctx);await resource.join;fence(ctx);clearTimeout(timer);ctx.signal?.removeEventListener('abort',abort);
  const bytes=Buffer.concat(chunks),rawFile=save(ctx.directory,randomUUID()+'.auth.body',bytes),receipt=save(ctx.directory,randomUUID()+'.auth.json',{url:url.href,method:'POST',status,bytes:bytes.length,sha256:sha(bytes),rawFile,requestClosed,responseEnded,socketClosed:socket?.destroyed??false,error:error?'E_PRINCIPAL_HTTP_FAILURE':null});rawRecorded=true;
  need(!error&&requestClosed&&responseEnded&&socket?.destroyed&&status===200,'E_PRINCIPAL_HTTP_FAILURE');const u=parse(bytes,'E_PRINCIPAL_HTTP_JSON');need(UUID.test(u.id)&&u.email===email&&u.is_anonymous===false&&u.email_confirmed_at,'E_PRINCIPAL_PROVIDER_IDENTITY');
  ctx.slot.release(ticket);released=true;fence(ctx);await inspectDb(ctx);fence(ctx);return {actor:{id:u.id,email},proof:{rawFile,receipt}};
 }finally{
  clearTimeout(timer);ctx.signal?.removeEventListener('abort',abort);if(request&&!requestClosed)request.destroy();await resource.join;
  // Failure audit is not success/private return. Retain only bytes actually
  // received in the original canonical private evidence directory; never retry.
  if(!rawRecorded)try{const bytes=Buffer.concat(chunks),file=save(ctx.directory,randomUUID()+'.auth-partial.body',bytes);save(ctx.directory,randomUUID()+'.auth-partial.json',{status:'FAILED_UNCERTAIN',method:'POST',url:url.href,httpStatus:status,rawFile:file,bytes:bytes.length,sha256:sha(bytes),requestClosed,responseEnded,socketClosed:socket?.destroyed??false,parsed:false});}catch{}
  if(!released)ctx.slot.release(ticket);
 }
}

/** Sole externally granted execution mode. No setup is authorized by import. */
export async function executePrincipalSetup(input){
 exact(input,['mode','grantFile','expectedGrantSha256','executionTaskId','signal']);need(input.mode==='execute','E_PRINCIPAL_MODE');need(DIGEST.test(input.expectedGrantSha256??''),'E_PRINCIPAL_RAW_HASH');need(input.signal===undefined||input.signal instanceof AbortSignal,'E_PRINCIPAL_SIGNAL');need(!input.signal?.aborted,'E_PRINCIPAL_ABORTED');need(process.execPath===NODE&&process.version==='v22.23.0','E_PRINCIPAL_NODE');need(below(path.join(ROOT,'.local-artifacts'),input.grantFile),'E_PRINCIPAL_GRANT_PATH');need(activeExecution===null,'E_PRINCIPAL_SINGLETON');
 const bytes=bytesAt(input.grantFile,{max:65536});need(sha(bytes)===input.expectedGrantSha256,'E_PRINCIPAL_RAW_HASH');const g=validateExecutionGrant({grantBytes:bytes,expectedGrantSha256:input.expectedGrantSha256,executionTaskId:input.executionTaskId,executorSha256:sha(bytesAt(SELF)),sqlSha256:sha(bytesAt(path.join(DIR,'principal-setup.sql')))});
 const privateDir=path.join(g.context.fixtureDirectory,'private');noLinks(privateDir);need((lstatSync(privateDir).mode&0o7777)===0o700,'E_PRINCIPAL_PRIVATE_MODE');initialContext(g);need(!existsSync(g.attempt.claimFile),'E_PRINCIPAL_ATTEMPT_CONSUMED');
 const directory=path.join(privateDir,'m04-principal-'+randomUUID());mkdirSync(directory,{mode:0o700});const token=Symbol('execution');const ctx={g,directory,token,grantFile:input.grantFile,grantHash:input.expectedGrantSha256,signal:input.signal,slot:new NativeSlot(),commands:new JoinedCommands({directory}),issued:[],http:[]};activeExecution=token;let claimed=false,mutated=false;
 try{
  fence(ctx);save(directory,randomUUID()+'.grant.json',bytes);const claim=Buffer.from(json({kind:'IMMUTABLE_PRINCIPAL_SETUP_ATTEMPT',ownerId:g.ownerId,projectId:g.projectId,executionTaskId:g.executionTaskId,grantSha256:ctx.grantHash,executorSha256:g.executor.sha256,directory,claimedAt:new Date().toISOString()}));const fd=openSync(g.attempt.claimFile,'wx',0o600);claimed=true;try{writeSync(fd,claim);fsyncSync(fd);}finally{closeSync(fd);}ctx.claimSha=sha(claim);const parent=openSync(privateDir,constants.O_RDONLY);try{fsyncSync(parent);}finally{closeSync(parent);}fence(ctx);
  const baseline=await query(ctx,'read');fence(ctx);validateRows(ctx,baseline.value,{},null,false);
  mutated=true;const owner=await adminCreate(ctx,'owner');fence(ctx);const afterOwner=await query(ctx,'read');fence(ctx);validateRows(ctx,afterOwner.value,{owner:owner.actor},baseline.value,false);
  const viewer=await adminCreate(ctx,'viewer');fence(ctx);need(owner.actor.id!==viewer.actor.id,'E_PRINCIPAL_IDENTITY_ALIAS');const actors={owner:owner.actor,viewer:viewer.actor};const triggers=await query(ctx,'read');fence(ctx);validateRows(ctx,triggers.value,actors,baseline.value,false);
  const applied=await query(ctx,'apply',actors);fence(ctx);const roles=await query(ctx,'roles',actors);fence(ctx);const final=await query(ctx,'read');fence(ctx);validateRows(ctx,final.value,actors,baseline.value,true);
  const profiles=final.value.profiles.filter(p=>Object.values(actors).some(a=>a.id===p.id)).map(p=>({id:p.id,email:p.email,deletion_started_at:p.deletionStartedAt}));equal(roles.value,{profiles,advisors:final.value.advisors,principals:final.value.principals,policy:final.value.policy},'E_PRINCIPAL_FINAL_RAW_ROLES');ctx.commands.assertJoined();ctx.slot.assertIdle();
  const refs=r=>({receipt:r.receipt,stdout:r.stdout,stderr:r.stderr});
  const observation={status:'OBSERVATIONS_ONLY',genuineAcceptance:'NOT_ASSESSED',ownerId:g.ownerId,projectId:g.projectId,executionTaskId:g.executionTaskId,grantSha256:ctx.grantHash,sourceCommit:SOURCE,executorSha256:g.executor.sha256,helperSha256:HELPER,sqlSha256:SQL,actors,profiles,advisors:final.value.advisors,principals:final.value.principals,policy:final.value.policy,effects:final.value.effects,rawProof:{baseline:refs(baseline.proof),owner:owner.proof,viewer:viewer.proof,triggers:refs(triggers.proof),applied:refs(applied),final:refs(final.proof),roles:refs(roles.proof)},attemptFile:g.attempt.claimFile,evidenceDirectory:directory,recordedAt:new Date().toISOString()};
  fence(ctx);const receiptFile=save(directory,randomUUID()+'.observations.json',observation);fence(ctx);return {status:'OBSERVATIONS_ONLY',genuineAcceptance:'NOT_ASSESSED',receiptFile,evidenceDirectory:directory};
 }catch(error){
  for(const r of ctx.http)try{r.request?.destroy();}catch{}
  // Cleanup joins do not require renewed authority to finish closing handles.
  await Promise.allSettled([...ctx.issued.map(r=>r.join),...ctx.http.map(r=>r.join)]);
  try{ctx.commands.assertJoined();}catch{}
  try{save(directory,randomUUID()+'.failed.json',{status:'FAILED_UNCERTAIN',ownerId:g.ownerId,projectId:g.projectId,executionTaskId:g.executionTaskId,grantSha256:ctx.grantHash,claimed,mutationMayHaveOccurred:mutated,attemptConsumed:claimed,error:/^E_PRINCIPAL_[A-Z_]+$/.test(error?.message??'')?error.message:'E_PRINCIPAL_EXECUTION_FAILURE',recordedAt:new Date().toISOString()});}catch{}
  throw Error(claimed?'E_PRINCIPAL_FAILED_ATTEMPT_CONSUMED':'E_PRINCIPAL_SETUP_REFUSED');
 }finally{activeExecution=null;}
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 const a=process.argv.slice(2);if(a.length!==7||a[0]!=='execute'||a[1]!=='--grant'||a[3]!=='--sha256'||a[5]!=='--execution-id'){process.stderr.write('E_PRINCIPAL_ARGUMENTS\n');process.exitCode=1;}
 else executePrincipalSetup({mode:a[0],grantFile:a[2],expectedGrantSha256:a[4],executionTaskId:a[6],signal:undefined}).then(r=>process.stdout.write(json(r)),()=>{process.stderr.write('E_PRINCIPAL_FAILED; private evidence retained\n');process.exitCode=1;});
}
