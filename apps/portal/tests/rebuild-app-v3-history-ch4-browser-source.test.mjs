// Compilation only. Never import/execute the frozen browser probe: its R3
// grant/head/observers remain historical. New execution requires Parent scope.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';
import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
const repo=path.resolve(import.meta.dirname,'../../..'),portal=path.join(repo,'apps/portal');
const sha=x=>createHash('sha256').update(x).digest('hex');
test('CH4 exact R3 browser probe and actual startup graph compile without executing browser or DOM',async()=>{
 const probe=path.join(import.meta.dirname,'rebuild-app-v3-history-ch4-browser.mjs'),entry=path.join(import.meta.dirname,'rebuild-app-v3-history-ch4-browser-entry.tsx');
 const probeBytes=await readFile(probe),entryBytes=await readFile(entry);
 assert.equal(sha(probeBytes),'75c02ea6a220e576fa69d1231427640fbd88b02c6cf0f69cbf8603441bcfd96f');assert.equal(sha(entryBytes),'e6f4fabf2210b1ddd93a4e3050cf57efdc27702a989786506e4fc6661cf376b9');
 const harness=await build({absWorkingDir:portal,entryPoints:[probe],bundle:true,platform:'node',format:'esm',target:'node22',packages:'external',write:false});
 assert.ok(harness.outputFiles[0].contents.length>probeBytes.length);
 const graph=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:[entry],outdir:'never-emitted-ch4-browser',bundle:true,format:'esm',splitting:true,target:['es2022'],metafile:true,entryNames:'application',chunkNames:'chunks/[name]-[hash]',assetNames:'fonts/[name]-[hash]',loader:{'.woff2':'file','.woff':'file'},legalComments:'linked',write:false});
 const inputs=await Promise.all(Object.keys(graph.metafile.inputs).sort().map(async p=>{const f=path.resolve(portal,p),bytes=await readFile(f);return{source:path.relative(repo,f),bytes:bytes.length,sha256:sha(bytes)};}));
 for(const file of ['Application.tsx','ClientHistory.tsx','session.ts','client-composition.ts'])assert.ok(inputs.some(x=>x.source==='apps/portal/src/app/'+file));
 assert.ok(!inputs.some(x=>x.source.includes('helper.mjs')),'finite HTTP model must stay outside browser graph');
 const outputs=graph.outputFiles.map(x=>({path:path.relative(portal,x.path),bytes:x.contents.length,sha256:sha(x.contents)}));
 const area=path.join(repo,'.local-artifacts/portal-rebuild/w0-ch4');await mkdir(area,{recursive:true});
 await writeFile(path.join(area,'browser-source-prepared.json'),JSON.stringify({proof:'SOURCE compile only; write:false; no browser/DOM/harness execution',sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),sourceDirty:execFileSync('git',['status','--porcelain'],{cwd:repo,encoding:'utf8'}).trim()!=='',node:process.execPath,version:process.version,frozenProbeSha256:sha(probeBytes),frozenEntrySha256:sha(entryBytes),harnessOutputs:harness.outputFiles.map(x=>({bytes:x.contents.length,sha256:sha(x.contents)})),inputs,outputs},null,2));
 assert.equal(outputs.length,15);
});
