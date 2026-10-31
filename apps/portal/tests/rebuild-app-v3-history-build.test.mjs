import test from 'node:test';import assert from 'node:assert/strict';
import {build} from 'esbuild';import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import path from 'node:path';
const repo=path.resolve(import.meta.dirname,'../../..'),portal=path.join(repo,'apps/portal'),area=path.join(repo,'.local-artifacts/portal-rebuild/w0-v3-history');
const sha=b=>createHash('sha256').update(b).digest('hex');
test('actual App entry bundles real V3/History/session/Root composition with write:false and exact own provenance',async()=>{
 const result=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['src/main.tsx'],outdir:path.join(area,'never-emitted'),bundle:true,format:'esm',splitting:true,target:['es2022'],metafile:true,entryNames:'application',chunkNames:'chunks/[name]-[hash]',assetNames:'fonts/[name]-[hash]',loader:{'.woff2':'file','.woff':'file'},legalComments:'linked',write:false});
 const inputs=[];for(const source of Object.keys(result.metafile.inputs).sort()){const absolute=path.resolve(portal,source),b=await readFile(absolute);inputs.push({source:path.relative(repo,absolute),bytes:b.length,sha256:sha(b)});}
 for(const name of ['src/app/client-composition.ts','src/app/ClientHistory.tsx','src/app/review-request.ts','src/features/plan/guidancePort.ts','src/features/history/port.ts','src/features/history/controller.ts','site/auth/client-cookie-session.js','site/auth/review-actions.js'])assert.ok(inputs.some(i=>i.source==='apps/portal/'+name),name);
 for(const name of ['PortalReview.ts','PortalReviewValidation.ts','PortalReviewMapping.ts','PortalReviewValues.ts']){assert.ok(result.metafile.inputs['../../src/contracts/'+name]||name==='PortalReview.ts','runtime contract '+name);}
 assert.ok(!inputs.some(i=>i.source.includes('tests/')),'no synthetic DTO/control enters production graph');assert.ok(!inputs.some(i=>i.source.includes('server/vault')||i.source.includes('features/orders')));
 const outputs=result.outputFiles.map(f=>({path:path.relative(area,f.path),bytes:f.contents.length,sha256:sha(f.contents)}));
 const provenance={candidate:true,proof:'source build only; write:false; no browser, gateway or native execution',sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),sourceDirty:execFileSync('git',['status','--porcelain'],{cwd:repo,encoding:'utf8'}).trim()!=='',node:process.execPath,nodeVersion:process.version,entry:'apps/portal/src/main.tsx',inputs,outputs};
 await mkdir(area,{recursive:true});await writeFile(path.join(area,'source-build-provenance.json'),JSON.stringify(provenance,null,2)+'\n');await writeFile(path.join(area,'source-build-metafile.json'),JSON.stringify(result.metafile,null,2)+'\n');assert.ok(outputs.length>0);
});
