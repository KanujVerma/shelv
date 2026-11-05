// Subprocess/lineage coverage with synthetic CLI output. No Docker or database is used.
import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {preparePortalAdmissionFixture} from '../scripts/local-admission.mjs';
import {attestFreshRuntime} from '../scripts/local-admission-lineage.mjs';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const attestationQuery='select payload from public.shelv_portal_fixture_attestation where singleton';
const ledgerQuery="select coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name,'statements',statements) order by version),'[]'::jsonb) from supabase_migrations.schema_migrations";

test('the real lineage probe reads complete bounded CLI output and retains its lineage fences',async t=>{
 await mkdir(path.join(root,'.local-artifacts'),{recursive:true});
 const own=await mkdtemp(path.join(root,'.local-artifacts/admission-lineage-output-'));
 try{
  const fixture=await preparePortalAdmissionFixture(root,path.join(own,'fixture'));
  const files=(await readdir(path.join(fixture.directory,'supabase/migrations'))).sort();
  const ledger=await Promise.all(files.map(async name=>({version:name.split('_')[0],name:name.slice(name.indexOf('_')+1,-4),statements:[await readFile(path.join(fixture.directory,'supabase/migrations',name),'utf8')]})));
  // Keep this boundary regression meaningful even if the source SQL later shrinks.
  ledger[0].statements.push('-- synthetic catalog output padding: '+ 'x'.repeat(2*1024*1024));
  const binding=attestFreshRuntime(fixture.manifest,ledger,{name:'supabase_db_'+fixture.projectId,createdAt:'synthetic-cli-only'},fixture.directory);
  await writeFile(path.join(fixture.directory,'RUNTIME-BINDING.json'),JSON.stringify(binding));
  const bin=path.join(own,'bin'),data=path.join(own,'cli.json'),calls=path.join(own,'calls.jsonl');await mkdir(bin);
  const args=['exec','-i','supabase_db_'+fixture.projectId,'psql','-U','postgres','-d','postgres','-X','-At','-v','ON_ERROR_STOP=1','-c'];
  await writeFile(path.join(bin,'docker'),`#!/usr/bin/env node
const assert=require('node:assert/strict'),fs=require('node:fs');
const data=JSON.parse(fs.readFileSync(process.env.SHELV_LINEAGE_TEST_DATA,'utf8')),args=process.argv.slice(2);
assert.deepEqual(args.slice(0,-1),data.args);
const query=args.at(-1);assert.ok(query===data.attestationQuery||query===data.ledgerQuery,'Only the two retained read-only queries are allowed');
fs.appendFileSync(process.env.SHELV_LINEAGE_TEST_CALLS,JSON.stringify(query===data.attestationQuery?'attestation':'ledger')+'\\n');
process.stdout.write(JSON.stringify(query===data.attestationQuery?data.binding:data.ledger)+'\\n');
`,{mode:0o700});
  const run=async value=>{
   await writeFile(data,JSON.stringify({args,binding,ledger:value,attestationQuery,ledgerQuery}));await writeFile(calls,'');
   return spawnSync(process.execPath,['apps/portal/tests/admission-lineage-native.mjs'],{cwd:root,encoding:'utf8',maxBuffer:24*1024*1024,env:{...process.env,PATH:bin+path.delimiter+process.env.PATH,DOCKER_HOST:'unix:///synthetic-cli-only/no-socket',SHELV_ADMISSION_FIXTURE_DIR:fixture.directory,SHELV_LINEAGE_TEST_DATA:data,SHELV_LINEAGE_TEST_CALLS:calls}});
  };
  const resultFile=path.join(fixture.directory,'RETAINED-LINEAGE-REGRESSION.json');
  await t.test('complete output above the default 1 MiB succeeds without truncation',async()=>{
   assert.ok(Buffer.byteLength(JSON.stringify(ledger))>1024*1024);
   const result=await run(ledger);assert.equal(result.status,0,result.stderr.slice(-1800));
   const receipt=JSON.parse(await readFile(resultFile,'utf8'));
   assert.equal(receipt.status,'PASS');assert.equal(receipt.actualMigrationCount,files.length);assert.equal(receipt.databaseWrites,0);
   assert.deepEqual((await readFile(calls,'utf8')).trim().split('\n').map(JSON.parse),['attestation','ledger']);
  });
  await t.test('a changed statement at the end of the large ledger still fails lineage verification',async()=>{
   await rm(resultFile,{force:true});const changed=structuredClone(ledger);changed.at(-1).statements.push('select 999;');
   const result=await run(changed);assert.equal(result.status,1);assert.match(result.stderr,/Applied runtime ledger differs/);
   await assert.rejects(()=>readFile(resultFile),{code:'ENOENT'});
  });
  await t.test('catalog capture retains a finite 16 MiB ceiling',async()=>{
   const excessive=structuredClone(ledger);excessive[0].statements.push('x'.repeat(16*1024*1024));
   const result=await run(excessive);assert.equal(result.status,1);assert.match(result.stderr,/ENOBUFS/);
   await assert.rejects(()=>readFile(resultFile),{code:'ENOENT'});
  });
 }finally{await rm(own,{recursive:true,force:true});}
});
