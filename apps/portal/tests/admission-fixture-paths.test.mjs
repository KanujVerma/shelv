import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink,cp,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {preparePortalAdmissionFixture,readPreparedPortalAdmissionFixture} from '../scripts/local-admission.mjs';

const migration='20261030000000_fixture.sql';
async function syntheticRoot(){
 const root=await realpath(await mkdtemp(path.join(tmpdir(),'shelv-fixture-path-')));
 await mkdir(path.join(root,'supabase/migrations'),{recursive:true});
 await writeFile(path.join(root,'supabase/migrations',migration),'select 1;\n');
 return root;
}

test('a changed schema gets a distinct owned fixture without overwriting the preserved baseline',async()=>{
 const root=await syntheticRoot();
 try{
  const baseline=await preparePortalAdmissionFixture(root);
  const preserved=await readFile(path.join(baseline.directory,'PREPARED.json'),'utf8');
  await writeFile(path.join(root,'supabase/migrations',migration),'select 2;\n');
  const selected=path.join(root,'.local-artifacts/portal-rebuild/plan-v1');
  const next=await preparePortalAdmissionFixture(root,selected);
  assert.equal(next.directory,selected);
  assert.notEqual(next.projectId,baseline.projectId);
  assert.equal(await readFile(path.join(next.directory,'supabase/migrations',migration),'utf8'),'select 2;\n');
  assert.equal(await readFile(path.join(baseline.directory,'PREPARED.json'),'utf8'),preserved);
  assert.equal((await readPreparedPortalAdmissionFixture(root,selected)).projectId,next.projectId);
  assert.equal((await readPreparedPortalAdmissionFixture(root)).projectId,baseline.projectId);
  assert.deepEqual(await preparePortalAdmissionFixture(root,selected),next);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('fixture selection rejects paths outside the task artifact directory',async()=>{
 const root=await syntheticRoot();
 try{
  for(const selected of [root,path.join(root,'supabase'),path.join(root,'.local-artifacts'),path.join(root,'.local-artifacts/../../outside')]){
   await assert.rejects(()=>preparePortalAdmissionFixture(root,selected),/fixture directory/);
  }
  await assert.rejects(()=>readPreparedPortalAdmissionFixture(root,path.join(root,'supabase')),/fixture directory/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('a symlink cannot redirect fixture preparation to unrelated files',async()=>{
 const root=await syntheticRoot();const outside=await mkdtemp(path.join(tmpdir(),'shelv-fixture-unrelated-'));
 try{
  await mkdir(path.join(root,'.local-artifacts'),{recursive:true});
  await writeFile(path.join(outside,'keep'),'untouched');
  await symlink(outside,path.join(root,'.local-artifacts/redirect'));
  await assert.rejects(()=>preparePortalAdmissionFixture(root,path.join(root,'.local-artifacts/redirect/new-fixture')),/symlink/);
  assert.equal(await readFile(path.join(outside,'keep'),'utf8'),'untouched');
 }finally{await rm(root,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
});

test('the prepare CLI honors its selected fixture directory and rejects a missing value before lifecycle work',async()=>{
 const root=await syntheticRoot();
 try{
  const scripts=path.join(root,'apps/portal/scripts');await mkdir(scripts,{recursive:true});
  for(const name of ['local-admission.mjs','local-admission-lineage.mjs'])await cp(new URL('../scripts/'+name,import.meta.url),path.join(scripts,name));
  const config=path.join(root,'apps/portal/test-fixtures/admission/supabase');await mkdir(config,{recursive:true});
  await cp(new URL('../test-fixtures/admission/supabase/config.toml',import.meta.url),path.join(config,'config.toml'));
  const runner=await realpath(path.join(scripts,'local-admission.mjs'));
  const selected=path.join(root,'.local-artifacts/rebuild-cli');
  const result=JSON.parse(execFileSync(process.execPath,[runner,'prepare','--fixture-dir',selected],{encoding:'utf8'}));
  assert.equal(result.directory,selected);assert.equal(result.stage,'prepared_source_only');
  assert.equal((await readPreparedPortalAdmissionFixture(root,selected)).projectId,result.projectId);
  assert.throws(()=>execFileSync(process.execPath,[runner,'prepare','--fixture-dir'],{encoding:'utf8',stdio:'pipe'}),error=>error.status===1&&/requires a directory/.test(String(error.stderr)));
 }finally{await rm(root,{recursive:true,force:true});}
});
