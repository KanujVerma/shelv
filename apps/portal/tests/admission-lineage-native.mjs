// Read-only ledger regression against the already running, attested local fixture.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {readPreparedPortalAdmissionFixture} from '../scripts/local-admission.mjs';
import {validateRuntimeLineage} from '../scripts/local-admission-lineage.mjs';
const fixture=await readPreparedPortalAdmissionFixture(undefined,process.env.SHELV_ADMISSION_FIXTURE_DIR),manifest=fixture.manifest;
const dockerHost=process.env.DOCKER_HOST??'unix:///var/run/docker.sock';assert.ok(dockerHost.startsWith('unix:///'));
const env={...process.env,DOCKER_HOST:dockerHost};delete env.DOCKER_CONTEXT;
const container='supabase_db_'+fixture.projectId;
const sql=text=>execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-d','postgres','-X','-At','-v','ON_ERROR_STOP=1','-c',text],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const binding=JSON.parse(await readFile(path.join(fixture.directory,'RUNTIME-BINDING.json'),'utf8'));
const attestation=JSON.parse(sql('select payload from public.shelv_portal_fixture_attestation where singleton'));
assert.deepEqual(attestation,binding);
const ledger=JSON.parse(sql("select coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name,'statements',statements) order by version),'[]'::jsonb) from supabase_migrations.schema_migrations"));
const verified=validateRuntimeLineage(manifest,ledger,attestation),output=path.join(fixture.directory,'retained-lineage-regression');await mkdir(output,{recursive:true});
const newer={...manifest,migrations:{...manifest.migrations,'99990101000000_retained_regression.sql':'synthetic-new-version'}};
const first=Object.keys(manifest.migrations)[0],changed={...manifest,migrations:{...manifest.migrations,[first]:'synthetic-same-version-different-content'}};
for(const [name,value,reason] of [['missing-new-version',newer,/runtime migration versions/],['same-version-different-content',changed,/runtime snapshot/]]){
 const file=path.join(output,name+'.json');await writeFile(file,JSON.stringify(value,null,2)+'\n');const prepared=JSON.parse(await readFile(file,'utf8'));assert.throws(()=>validateRuntimeLineage(prepared,ledger,attestation),reason);
}
assert.throws(()=>validateRuntimeLineage(manifest,ledger,null),/unbound runtime/);
const result={status:'PASS',actualMigrationCount:verified.migrationCount,checks:['retained database rejects a new prepared version','retained database rejects changed content under the same version','unbound retained database rejected'],databaseWrites:0,bootstrapCalls:0,nativeWriteCalls:0};
await writeFile(path.join(fixture.directory,'RETAINED-LINEAGE-REGRESSION.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
