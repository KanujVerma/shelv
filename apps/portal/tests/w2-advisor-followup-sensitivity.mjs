// Finite source mutation controls only. No browser, server, Auth or DB resources.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const controller=path.join(root,'apps/portal/src/features/advisor/controller.ts');
const testFile=path.join(root,'apps/portal/tests/rebuild-advisor-followup.test.mjs');
const artifact=path.join(root,'.local-artifacts/w2/followup-sensitivity-configured');await mkdir(artifact,{recursive:true});
const source=await readFile(controller,'utf8'),tests=await readFile(testFile,'utf8');
const digest=s=>createHash('sha256').update(s).digest('hex');
assert.equal(digest(tests),'ab93c0e8cde162deaf4c83d3bfcc31d4219a651f4851b7f41fe08f0619b6564b');
const from=source.indexOf('  function beginRead(purpose: string) {'),to=source.indexOf('  const deny =',from);assert.ok(from>=0&&to>from);
const lease=source.slice(from,to);
const basis=`      operation === operationGeneration &&
      state.view === view &&
      state.local === local &&
      state.pending === pending &&
      (target == null || sameTarget(state.view?.target, target));`;
const purpose='      readGenerations.get(purpose) === generation &&\n';
assert.equal(lease.split(basis).length,2);assert.equal(lease.split(purpose).length,2);
const variants=[
 {name:'CURRENT',lease,expected:0},
 {name:'REMOVE_OPERATION_AND_VIEW',lease:lease.replace(basis,'      true;'),expected:1,case:/not ok \d+ - R3-1 loadDirectory old success at B-pending/},
 {name:'REMOVE_PURPOSE_GENERATION',lease:lease.replace(purpose,''),expected:1,case:/not ok \d+ - R3-1 .* purpose generation ignores old success/},
];
const results=[];
for(const variant of variants){
 const mutated=source.slice(0,from)+variant.lease+source.slice(to),outfile=path.join(artifact,variant.name+'.cjs');
 await build({tsconfig:path.join(root,'apps/portal/tsconfig.frontend.json'),entryPoints:[testFile],outfile,absWorkingDir:root,platform:'node',format:'cjs',bundle:true,plugins:[{name:'exact-finite-source-control',setup(b){b.onLoad({filter:/features\/advisor\/controller\.ts$/},args=>{assert.equal(args.path,controller);return{contents:mutated,loader:'ts',resolveDir:path.dirname(controller)};});}}]});
 const child=spawnSync(process.execPath,['--test',outfile],{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024});
 const output=(child.stdout??'')+(child.stderr??'');await writeFile(path.join(artifact,variant.name+'.log'),output);
 assert.equal(child.error,undefined);assert.equal(child.signal,null);
 if(variant.expected===0)assert.equal(child.status,0);else{assert.notEqual(child.status,0);assert.match(output,variant.case);}
 const result={variant:variant.name,sourceSHA256:digest(mutated),testSHA256:digest(tests),exit:child.status,pass:Number(output.match(/^# pass (\d+)/m)?.[1]),fail:Number(output.match(/^# fail (\d+)/m)?.[1])};results.push(result);console.log(JSON.stringify(result));
}
assert.equal(await readFile(controller,'utf8'),source);assert.equal(await readFile(testFile,'utf8'),tests);
await writeFile(path.join(artifact,'RESULT.json'),JSON.stringify({controllerSHA256:digest(source),testSHA256:digest(tests),results},null,2)+'\n');
