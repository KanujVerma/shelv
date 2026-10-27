import {readFile,writeFile,mkdir,readdir,chmod,open,unlink} from 'node:fs/promises';
import {existsSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {attestFreshRuntime,validateRuntimeLineage,verifyFixtureResources} from './local-admission-lineage.mjs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const repoRoot=fileURLToPath(new URL('../../../',import.meta.url));
const sourceConfig=new URL('../test-fixtures/admission/supabase/config.toml',import.meta.url);
const projectPrefix='shelv-portal-admission',marker='shelv-portal-admission-fixture-v2';
const sha=value=>createHash('sha256').update(value).digest('hex');
export async function preparePortalAdmissionFixture(root=repoRoot){
 const directory=path.join(root,'.local-artifacts/portal-admission-fixture'),source=path.join(root,'supabase/migrations');
 const manifestPath=path.join(directory,'PREPARED.json');
 if(existsSync(directory))assert.ok(existsSync(manifestPath),'Refusing an unmarked fixture directory');
 const previous=existsSync(manifestPath)?JSON.parse(await readFile(manifestPath,'utf8')):null;
 if(previous)assert.ok(previous.marker===marker&&typeof previous.ownerId==='string','Unbound legacy fixture; preserve it and prepare a new owned instance');
 const ownerId=previous?.ownerId??randomUUID();assert.match(ownerId,/^[0-9a-f-]{36}$/);const projectId=projectPrefix+'-'+ownerId.replaceAll('-','').slice(0,12);
 const template=await readFile(sourceConfig,'utf8');assert.equal((template.match(/^project_id\s*=/gm)??[]).length,1,'Fixture must have exactly one project identity');
 const config=Buffer.from(template.replace(/^project_id\s*=.*$/m,'project_id = '+JSON.stringify(projectId))),files=(await readdir(source)).filter(name=>name.endsWith('.sql')).sort();assert.ok(files.length,'Canonical migrations are required');
 const migrationBytes=await Promise.all(files.map(name=>readFile(path.join(source,name))));
 const manifest={marker,ownerId,projectId,configSha256:sha(config),migrations:Object.fromEntries(files.map((name,i)=>[name,sha(migrationBytes[i])]))};
 if(existsSync(directory)){
  assert.deepEqual(previous,manifest,'Portal admission snapshot drift; preserve the old fixture and explicitly retire it before preparing a changed snapshot');
  assert.equal(sha(await readFile(path.join(directory,'supabase/config.toml'))),manifest.configSha256,'Prepared portal config drift');
  const copied=(await readdir(path.join(directory,'supabase/migrations'))).sort();assert.deepEqual(copied,files,'Prepared migration membership drift');
  for(const name of files)assert.equal(sha(await readFile(path.join(directory,'supabase/migrations',name))),manifest.migrations[name],'Prepared migration bytes drift');
 }else{
  await mkdir(path.dirname(directory),{recursive:true});
  try{await mkdir(directory);}catch{throw Error('Concurrent fixture preparation; the existing owner must finish first');}
  await mkdir(path.join(directory,'supabase/migrations'),{recursive:true});await writeFile(path.join(directory,'supabase/config.toml'),config);
  for(let i=0;i<files.length;i++)await writeFile(path.join(directory,'supabase/migrations',files[i]),migrationBytes[i]);
  await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 }
 return{directory,projectId,migrationCount:files.length,configSha256:manifest.configSha256,manifest};
}
export async function readPreparedPortalAdmissionFixture(root=repoRoot){
 const directory=path.join(root,'.local-artifacts/portal-admission-fixture'),manifest=JSON.parse(await readFile(path.join(directory,'PREPARED.json'),'utf8'));
 assert.equal(manifest.marker,marker,'Refusing an unmarked fixture');assert.match(manifest.ownerId,/^[0-9a-f-]{36}$/);assert.equal(manifest.projectId,projectPrefix+'-'+manifest.ownerId.replaceAll('-','').slice(0,12),'Fixture project mismatch');
 assert.equal(sha(await readFile(path.join(directory,'supabase/config.toml'))),manifest.configSha256,'Prepared portal config drift');
 return{directory,projectId:manifest.projectId,migrationCount:Object.keys(manifest.migrations).length,configSha256:manifest.configSha256,manifest};
}
export async function withFixtureLock(directory,operation){
 const file=path.join(directory,'LIFECYCLE.lock'),token=JSON.stringify({pid:process.pid,id:randomUUID()});let handle;
 try{handle=await open(file,'wx',0o600);await handle.writeFile(token);await handle.close();}catch{await handle?.close().catch(()=>{});throw Error('Fixture lifecycle is already locked; inspect the owning process before recovery');}
 try{return await operation();}finally{assert.equal(await readFile(file,'utf8'),token,'Fixture lock ownership changed');await unlink(file);}
}
async function run(mode,browser){
 assert.ok(['prepare','start','test','stop','run'].includes(mode),'Use prepare, start, test, stop or run');
 const fixture=mode==='stop'?await readPreparedPortalAdmissionFixture():await preparePortalAdmissionFixture(),directory=fixture.directory,projectId=fixture.projectId,manifest=fixture.manifest;
 if(mode==='prepare'){console.log(JSON.stringify({directory,projectId,preparedMigrationCount:fixture.migrationCount,stage:'prepared_source_only',hostedChanges:false}));return;}
 await withFixtureLock(directory,async()=>{
 const dockerHost=process.env.DOCKER_HOST??'unix:///var/run/docker.sock';assert.ok(dockerHost.startsWith('unix:///'),'Only a local Docker socket is allowed');
 const dockerConfig=path.join(directory,'docker-config');await mkdir(dockerConfig,{recursive:true});if(!existsSync(path.join(dockerConfig,'config.json')))await writeFile(path.join(dockerConfig,'config.json'),'{'+'"auths":{}'+'}\n');
 const env={...process.env,DOCKER_HOST:dockerHost,DOCKER_CONFIG:dockerConfig};delete env.DOCKER_CONTEXT;
 const command=(program,args,log)=>{
  try{const output=execFileSync(program,args,{cwd:repoRoot,env,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024});if(log)return writeFile(path.join(directory,log),output,{mode:0o600});return output;}
  catch(error){const file=path.join(directory,log??'failure.private.log');writeFileSync(file,String(error.stdout??'')+String(error.stderr??''),{mode:0o600});throw Error('Local fixture command failed; inspect its private log: '+path.basename(file));}
 };
 const container='supabase_db_'+projectId,volumeName=container,bindingPath=path.join(directory,'RUNTIME-BINDING.json');
 const volumeNames=command('docker',['volume','ls','--format','{{.Name}}']).trim().split('\n').filter(Boolean);
 const volume=volumeNames.includes(volumeName)?JSON.parse(command('docker',['volume','inspect',volumeName]))[0]:null;
 assert.ok(volume||!volumeNames.some(name=>name.endsWith('_'+projectId)),'Refusing orphaned retained project resources');
 const names=command('docker',['ps','-a','--format','{{.Names}}']).trim().split('\n').filter(name=>name.endsWith('_'+projectId));
 const containers=names.map(name=>({Config:{Labels:JSON.parse(command('docker',['inspect',name,'--format','{{json .Config.Labels}}']))}}));
 const binding=existsSync(bindingPath)?JSON.parse(await readFile(bindingPath,'utf8')):null;
 // This check precedes startup AND the finally block: another owner's project is never stopped.
 const resourceState=verifyFixtureResources(manifest,binding,volume,containers,directory);
 const stop=async()=>{await command('supabase',['stop','--workdir',directory,'--project-id',projectId],'stop.private.log');await writeFile(path.join(directory,'STOPPED.json'),JSON.stringify({projectId,ownerId:manifest.ownerId,volumesDeleted:false,profileStopped:false,at:new Date().toISOString()})+'\n');};
 if(mode==='stop'){await stop();console.log(JSON.stringify({mode,projectId,stopped:true,volumesRetained:true}));return;}
 const sql=text=>command('docker',['exec','-i',container,'psql','-U','postgres','-d','postgres','-X','-At','-v','ON_ERROR_STOP=1','-c',text]).trim();
 let attemptedStart=false;
 try{
  if(mode==='start'||mode==='run'){
   attemptedStart=true;await command('supabase',['start','--workdir',directory,'--exclude','realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor'],'start.private.log');
  }else assert.equal(resourceState.fresh,false,'Start the fixture before testing');
  const ledger=JSON.parse(sql("select coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name,'statements',statements) order by version),'[]'::jsonb) from supabase_migrations.schema_migrations"));
  let attestation;
  if(resourceState.fresh){
   const created=JSON.parse(command('docker',['volume','inspect',volumeName]))[0];assert.equal(created.Labels?.['com.supabase.cli.project'],projectId);
   attestation=attestFreshRuntime(manifest,ledger,{name:created.Name,createdAt:created.CreatedAt},directory);
   const payload=JSON.stringify(attestation).replaceAll("'","''");
   sql("begin;create table public.shelv_portal_fixture_attestation(singleton boolean primary key check(singleton),payload jsonb not null);alter table public.shelv_portal_fixture_attestation enable row level security;revoke all on public.shelv_portal_fixture_attestation from public,anon,authenticated,service_role;insert into public.shelv_portal_fixture_attestation values(true,'"+payload+"'::jsonb);commit;");
   await writeFile(bindingPath,JSON.stringify(attestation,null,2)+'\n',{mode:0o600});
  }else{
   assert.equal(sql("select to_regclass('public.shelv_portal_fixture_attestation') is not null"),'t','Refusing unbound retained database');
   attestation=JSON.parse(sql('select payload from public.shelv_portal_fixture_attestation where singleton'));
   assert.deepEqual(attestation,binding,'Database fixture binding differs from its local ownership receipt');
  }
  const runtime=validateRuntimeLineage(manifest,ledger,attestation);
  await preparePortalAdmissionFixture(); // Canonical source must still match the frozen prepared bytes.
  await writeFile(path.join(directory,'RUNTIME-VERIFIED.json'),JSON.stringify({...runtime,ownerId:manifest.ownerId,projectId,fresh:resourceState.fresh,at:new Date().toISOString()},null,2)+'\n');
  const raw=command('supabase',['status','--workdir',directory,'--output','json']);const status=JSON.parse(raw);assert.equal(status.API_URL,'http://127.0.0.1:57421');
  const credentials=path.join(directory,'status.private.json');await writeFile(credentials,JSON.stringify(status),{mode:0o600});await chmod(credentials,0o600);
  Object.assign(env,{SHELV_ADMISSION_LOCAL_CONFIG:credentials,SHELV_ADMISSION_DB_CONTAINER:container,SHELV_ADMISSION_CALLBACK_URL:'http://127.0.0.1:57430/',SHELV_ADMISSION_REPORT:path.join(directory,'NATIVE-RESULT.json'),SHELV_ADMISSION_NATIVE_BROWSER:browser?'1':'0',SHELV_ADMISSION_UI_ARTIFACTS:path.join(directory,'screenshots'),SHELV_ADMISSION_BOOTSTRAP_DISPOSABLE:'1'});
  await command(process.execPath,['apps/portal/tests/admission-lineage-native.mjs'],'lineage-regression.log');
  await command(process.execPath,['tests/concierge-admission-bootstrap.mjs'],'bootstrap.log');
  if(mode!=='start')await command(process.execPath,['--experimental-strip-types','tests/concierge-admission-native.mjs'],'native.log');
  await preparePortalAdmissionFixture(); // Do not report a newer source snapshot against this runtime.
  const result=mode==='start'?{status:'STARTED'}:JSON.parse(await readFile(path.join(directory,'NATIVE-RESULT.json'),'utf8'));
  console.log(JSON.stringify({mode,projectId,migrationCount:runtime.migrationCount,snapshotSha256:runtime.snapshotSha256,ledgerSha256:runtime.ledgerSha256,fresh:resourceState.fresh,status:result.status,cases:result.checks?.length??0,browser,hostedChanges:false,realEmails:0}));
 }finally{if(mode==='run'&&attemptedStart)await stop();}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const mode=process.argv[2]??'run',browser=process.argv.includes('--browser');try{await run(mode,browser);}catch(error){console.error(error instanceof Error?error.message:'Local admission fixture failed');process.exitCode=1;}
}
