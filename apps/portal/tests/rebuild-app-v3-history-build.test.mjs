import test from 'node:test';import assert from 'node:assert/strict';
import {build} from 'esbuild';import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import path from 'node:path';
const repo=path.resolve(import.meta.dirname,'../../..'),portal=path.join(repo,'apps/portal'),area=path.join(repo,'.local-artifacts/portal-rebuild/w0-v3-history');
const sha=b=>createHash('sha256').update(b).digest('hex');
// Current Root mounts only the reviewed read-only Orders subtree. Any extra
// Orders module still requires explicit review; this is not a namespace grant.
const requiredOrdersInputs=Object.freeze([
 'apps/portal/src/features/orders/read/ClientOrdersView.tsx',
 'apps/portal/src/features/orders/read/controller.ts',
 'apps/portal/src/features/orders/read/model.ts',
]);
// Root imports the controller and view directly; the barrel is permitted only
// when it actually occurs in the observed graph, never required by the guard.
const reviewedOrdersInputs=Object.freeze([
 ...requiredOrdersInputs,'apps/portal/src/features/orders/read/index.ts',
]);
// Existing Root8b pure parsers/mappers, not handlers, transport or private storage.
const reviewedPublicRootInputs=Object.freeze({
 "supabase/functions/concierge-payments/contract.ts": "843f746ee73c7a3d38832a75bb7cd4c518fb92d93714438434d7bd15964b75f0",
 "supabase/functions/concierge-payments/methods.ts": "136aed10e5a1c2e74b9297a41f13a8698106c32b182bea6ea4ae8d0c0ee57f24",
 "supabase/functions/concierge-operations/commands.ts": "0bd59e2c20cd98d1a97be8866c53a73befdaae5e96904dcfe3fd6158d5497f90"
});
function assertClientBundleBoundary(sources){
 for(const source of sources){
  assert.ok(!source.includes('tests/'),'no synthetic DTO/control enters production graph');
  assert.ok(!/(?:^|\/)server\//.test(source)&&!source.includes('server/vault'),'no private server or vault implementation enters production graph');
  assert.ok((!source.startsWith('supabase/functions/')||Object.hasOwn(reviewedPublicRootInputs,source))&&!source.includes('/backend/source/')&&!source.includes('/workers/session-vault/'),'no private source backend or vault worker enters production graph');
  if(source.includes('features/orders'))assert.ok(reviewedOrdersInputs.includes(source),'unreviewed Orders input: '+source);
 }
 for(const source of requiredOrdersInputs)assert.ok(sources.includes(source),'missing reviewed read-only Orders input: '+source);
}
test('client bundle boundary admits only the exact reviewed Orders closure and refuses private or unknown inputs',()=>{
 assert.doesNotThrow(()=>assertClientBundleBoundary(requiredOrdersInputs));
 assert.doesNotThrow(()=>assertClientBundleBoundary(reviewedOrdersInputs));
 assert.doesNotThrow(()=>assertClientBundleBoundary([...reviewedOrdersInputs,...Object.keys(reviewedPublicRootInputs)]));
 for(const source of [
  'apps/portal/src/features/orders/write.ts',
  'apps/portal/src/features/orders/read/extra.ts',
  'apps/portal/src/features/orders/read/private/source.ts',
  'apps/portal/session-integration/runtime/server/vault.ts',
  'apps/portal/session-integration/runtime/server/session-vault.ts',
  'apps/portal/session-integration/runtime/server/source-provider.ts',
  'apps/portal/session-integration/runtime/workers/session-vault/index.ts',
  'supabase/functions/concierge-operations/private-storage-cleanup.ts',
  'supabase/functions/concierge-operations/runtime.ts',
  'supabase/functions/concierge-payments/handler.ts',
  'supabase/functions/concierge-payments/extra-contract.ts',
  'apps/portal/backend/source/src/contracts/ConciergeService.ts',
  'apps/portal/tests/rebuild/plan-fixture.mjs',
 ])assert.throws(()=>assertClientBundleBoundary([...reviewedOrdersInputs,source]),{name:'AssertionError'},source);
 for(const source of requiredOrdersInputs)assert.throws(()=>assertClientBundleBoundary(reviewedOrdersInputs.filter(input=>input!==source)),/missing reviewed read-only Orders input/);
});
test('actual App entry bundles real V3/History/session/Root composition with write:false and exact own provenance',async()=>{
 const result=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['src/main.tsx'],outdir:path.join(area,'never-emitted'),bundle:true,format:'esm',splitting:true,target:['es2022'],metafile:true,entryNames:'application',chunkNames:'chunks/[name]-[hash]',assetNames:'fonts/[name]-[hash]',loader:{'.woff2':'file','.woff':'file'},legalComments:'linked',write:false});
 const inputs=[];for(const source of Object.keys(result.metafile.inputs).sort()){const absolute=path.resolve(portal,source),b=await readFile(absolute);inputs.push({source:path.relative(repo,absolute),bytes:b.length,sha256:sha(b)});}
 for(const name of ['src/app/client-composition.ts','src/app/ClientHistory.tsx','src/app/review-request.ts','src/features/plan/guidancePort.ts','src/features/history/port.ts','src/features/history/controller.ts','site/auth/client-cookie-session.js','site/auth/review-actions.js'])assert.ok(inputs.some(i=>i.source==='apps/portal/'+name),name);
 for(const name of ['PortalReview.ts','PortalReviewValidation.ts','PortalReviewMapping.ts','PortalReviewValues.ts']){assert.ok(result.metafile.inputs['../../src/contracts/'+name]||name==='PortalReview.ts','runtime contract '+name);}
 assertClientBundleBoundary(inputs.map(i=>i.source));
 for(const input of inputs)if(Object.hasOwn(reviewedPublicRootInputs,input.source))assert.equal(input.sha256,reviewedPublicRootInputs[input.source],'reviewed pure Root contract changed: '+input.source);
 const outputs=result.outputFiles.map(f=>({path:path.relative(area,f.path),bytes:f.contents.length,sha256:sha(f.contents)}));
 const provenance={candidate:true,proof:'source build only; write:false; no browser, gateway or native execution',sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),sourceDirty:execFileSync('git',['status','--porcelain'],{cwd:repo,encoding:'utf8'}).trim()!=='',node:process.execPath,nodeVersion:process.version,entry:'apps/portal/src/main.tsx',inputs,outputs};
 await mkdir(area,{recursive:true});await writeFile(path.join(area,'source-build-provenance.json'),JSON.stringify(provenance,null,2)+'\n');await writeFile(path.join(area,'source-build-metafile.json'),JSON.stringify(result.metafile,null,2)+'\n');assert.ok(outputs.length>0);
});
