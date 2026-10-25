import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const runtime=path.join(root,'session-integration/runtime'),evidence=path.join(root,'evidence/session-contract-recovery');
const source=path.join(runtime,'server/upstream.ts'),original=await readFile(source,'utf8');
const replace=(s,a,b)=>{assert.ok(s.includes(a),'Mutation seam missing');return s.replace(a,b);};
const removeLine=(s,part)=>{const line=s.split('\n').find(line=>line.includes(part));assert.ok(line,'Mutation guard missing');return replace(s,line,'            // Deliberately omitted only in this in-memory mutant.');};
const cases=[
 {name:'missing-client-binding',expected:/ordinary preview command receives/,mutate:s=>replace(s,' && uuid(envelope.clientId) === command.clientId','')},
 {name:'missing-published-null',expected:/published GET maps/,mutate:s=>replace(s,"mode, expectedRevision };","mode, ...(mode === 'draft' ? { expectedRevision } : {}) };")},
 {name:'missing-photo-membership',expected:/top-level report spoofing/,mutate:s=>removeLine(s,'demand(Array.isArray(checkins.reports)')},
 {name:'missing-descriptor-binding',expected:/photo descriptor retains/,mutate:s=>removeLine(s,'demand(descriptor.photoId ===')},
 {name:'missing-storage-path-binding',expected:/photo descriptor retains/,mutate:s=>removeLine(s,"demand(['jpg', 'png', 'webp']")}
];
const results=[];await mkdir(path.join(runtime,'.test-build/mutants'),{recursive:true});
for(const item of cases){
 const output=path.join(runtime,'.test-build/mutants',item.name+'.js'),mutated=item.mutate(original);assert.notEqual(mutated,original);
 await build({absWorkingDir:runtime,entryPoints:['tests/preview-contract.test.ts'],outfile:output,bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'in-memory-mutant',setup(b){b.onLoad({filter:/\/server\/upstream\.ts$/},()=>({contents:mutated,loader:'ts'}));}}]});
 const run=spawnSync(process.execPath,['--test',output],{encoding:'utf8',maxBuffer:2000000});
 const stdout=run.stdout??'',failures=[...stdout.matchAll(/^not ok \d+ - (.+)$/gm)].map(x=>x[1]);
 await writeFile(path.join(evidence,'MUTANT-'+item.name+'.txt'),stdout+(run.stderr??''));
 assert.equal(run.status,1,'Mutant must fail its real behavior test');assert.ok(failures.some(name=>item.expected.test(name)),item.name+' missed intended assertion');
 results.push({name:item.name,killed:true,failedTests:failures});
}
assert.equal(await readFile(source,'utf8'),original,'Production source must stay untouched');
const result={scope:'Five in-memory unsafe variants; real provider tests with synthetic outbound only',productionSha256:createHash('sha256').update(original).digest('hex'),productionUnchanged:true,killed:results.length,results};
await writeFile(path.join(evidence,'MUTATION-CHECKS.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({killed:results.length,total:cases.length,productionUnchanged:true}));
