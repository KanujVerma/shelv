import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=value=>createHash('sha256').update(value).digest('hex');
export const snapshotDigest=manifest=>sha(JSON.stringify({configSha256:manifest.configSha256,migrations:Object.fromEntries(Object.entries(manifest.migrations).sort(([a],[b])=>a.localeCompare(b)))}));
function checkedLedger(manifest,ledger){
 assert.ok(Array.isArray(ledger),'Missing runtime migration ledger');
 const expected=Object.keys(manifest.migrations).sort().map(name=>{const split=name.indexOf('_');assert.ok(split>0&&name.endsWith('.sql'));return{version:name.slice(0,split),name:name.slice(split+1,-4)};});
 assert.equal(new Set(expected.map(row=>row.version)).size,expected.length,'Duplicate prepared migration versions');
 const actual=ledger.map(row=>{assert.ok(typeof row.version==='string'&&typeof row.name==='string'&&Array.isArray(row.statements)&&row.statements.every(s=>typeof s==='string'),'Incomplete runtime migration ledger');return{version:row.version,name:row.name,statements:row.statements};}).sort((a,b)=>a.version.localeCompare(b.version));
 assert.deepEqual(actual.map(row=>({version:row.version,name:row.name})),expected,'Prepared and runtime migration versions/names differ');
 return{migrationCount:actual.length,ledgerSha256:sha(JSON.stringify(actual)),snapshotSha256:snapshotDigest(manifest)};
}
export function attestFreshRuntime(manifest,ledger,volume,directory){
 const checked=checkedLedger(manifest,ledger);
 return{format:1,ownerId:manifest.ownerId,projectId:manifest.projectId,...checked,volumeName:volume.name,volumeCreatedAt:volume.createdAt,workdirSha256:sha(directory)};
}
export function validateRuntimeLineage(manifest,ledger,attestation){
 const checked=checkedLedger(manifest,ledger);assert.ok(attestation,'Refusing an unbound runtime database');
 assert.equal(attestation.format,1,'Unsupported runtime attestation');assert.equal(attestation.ownerId,manifest.ownerId,'Different runtime owner');assert.equal(attestation.projectId,manifest.projectId,'Different runtime project');
 assert.equal(attestation.snapshotSha256,checked.snapshotSha256,'Prepared and runtime snapshot differ');assert.equal(attestation.ledgerSha256,checked.ledgerSha256,'Applied runtime ledger differs from its attestation');
 return checked;
}
export function verifyFixtureResources(manifest,binding,volume,containers,directory){
 if(!volume&&!containers.length){assert.ok(!binding,'Previously bound runtime volume is missing');return{fresh:true};}
 assert.ok(volume&&binding,'Refusing unbound retained fixture resources');assert.equal(volume.Name,'supabase_db_'+manifest.projectId,'Different runtime volume');
 assert.equal(volume.Labels?.['com.supabase.cli.project'],manifest.projectId,'Different volume project');
 assert.equal(binding.ownerId,manifest.ownerId,'Different resource owner');assert.equal(binding.projectId,manifest.projectId,'Different resource project');assert.equal(binding.snapshotSha256,snapshotDigest(manifest),'Different retained snapshot');
 assert.equal(binding.workdirSha256,sha(directory),'Refusing a foreign checkout binding');assert.equal(binding.volumeName,volume.Name,'Different bound volume');assert.equal(binding.volumeCreatedAt,volume.CreatedAt,'Runtime volume was replaced');
 for(const container of containers){assert.equal(container.Config?.Labels?.['com.supabase.cli.project'],manifest.projectId,'Different container project');assert.equal(container.Config?.Labels?.['com.supabase.cli.workdir'],directory,'Refusing foreign checkout containers');}
 return{fresh:false};
}
