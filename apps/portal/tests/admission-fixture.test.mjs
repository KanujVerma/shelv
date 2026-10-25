import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
const runner=await import('../scripts/local-admission.mjs').catch(()=>null);
test('portal Auth fixture snapshots canonical migrations and keeps confirmation links separate from Expo',async()=>{
 assert.ok(runner,'Portable portal admission fixture runner exists');const root=await mkdtemp(path.join(tmpdir(),'shelv-admission-prepare-'));
 try{
  await mkdir(path.join(root,'supabase/migrations'),{recursive:true});await writeFile(path.join(root,'supabase/migrations/20261024000000_fixture.sql'),'select 1;\n');
  const prepared=await runner.preparePortalAdmissionFixture(root);const config=await readFile(path.join(prepared.directory,'supabase/config.toml'),'utf8');
  assert.match(config,/project_id = "shelv-portal-admission-[a-f0-9]{12}"/);assert.match(config,/enable_confirmations = true/);assert.doesNotMatch(config,/templates\.|content_path|service_role|SUPABASE_SERVICE_ROLE_KEY/);
  assert.equal(await readFile(path.join(prepared.directory,'supabase/migrations/20261024000000_fixture.sql'),'utf8'),'select 1;\n');assert.equal(prepared.migrationCount,1);
  assert.deepEqual(await runner.preparePortalAdmissionFixture(root),prepared);
  await writeFile(path.join(root,'supabase/migrations/20261024000000_fixture.sql'),'select 2;\n');await assert.rejects(()=>runner.preparePortalAdmissionFixture(root),/snapshot drift/);
  assert.ok(runner.readPreparedPortalAdmissionFixture,'Stopping a marked fixture does not depend on unchanged current source');assert.equal((await runner.readPreparedPortalAdmissionFixture(root)).projectId,prepared.projectId);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('preparation refuses an unrelated directory instead of overwriting it',async()=>{
 assert.ok(runner);const root=await mkdtemp(path.join(tmpdir(),'shelv-admission-unrelated-'));
 try{await mkdir(path.join(root,'supabase/migrations'),{recursive:true});await writeFile(path.join(root,'supabase/migrations/20261024000000_fixture.sql'),'select 1;\n');await mkdir(path.join(root,'.local-artifacts/portal-admission-fixture'),{recursive:true});await writeFile(path.join(root,'.local-artifacts/portal-admission-fixture/keep'),'preserve');await assert.rejects(()=>runner.preparePortalAdmissionFixture(root),/unmarked fixture/);assert.equal(await readFile(path.join(root,'.local-artifacts/portal-admission-fixture/keep'),'utf8'),'preserve');}
 finally{await rm(root,{recursive:true,force:true});}
});
test('overlapping lifecycle commands are rejected until the exact owner releases its lock',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'shelv-admission-lock-'));let release,entered;const inside=new Promise(resolve=>entered=resolve),held=new Promise(resolve=>release=resolve);
 try{const first=runner.withFixtureLock(directory,async()=>{entered();await held;});await inside;await assert.rejects(()=>runner.withFixtureLock(directory,async()=>assert.fail('must not enter')),/already locked/);release();await first;assert.equal(await runner.withFixtureLock(directory,async()=>'available'),'available');}
 finally{release?.();await rm(directory,{recursive:true,force:true});}
});
test('concurrent initial preparation reserves one owner rather than overwriting project identity',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'shelv-admission-owner-'));
 try{await mkdir(path.join(root,'supabase/migrations'),{recursive:true});await writeFile(path.join(root,'supabase/migrations/20261024000000_fixture.sql'),'select 1;\n');const attempts=await Promise.allSettled([runner.preparePortalAdmissionFixture(root),runner.preparePortalAdmissionFixture(root)]);assert.equal(attempts.filter(result=>result.status==='fulfilled').length,1);const prepared=attempts.find(result=>result.status==='fulfilled').value;assert.equal((await runner.readPreparedPortalAdmissionFixture(root)).projectId,prepared.projectId);}
 finally{await rm(root,{recursive:true,force:true});}
});
