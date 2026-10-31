import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {localPolicy,sha} from '../scripts/rebuild-native-boundary.mjs';

// Bundles bytes only. No Miniflare, Auth, fixture, browser or native resource import/acquisition.
export async function compileCareNativeSource() {
  assert.equal(process.version,'v22.23.0');
  const runtime=path.resolve(import.meta.dirname,'../session-integration/runtime'),seams=[],outputs=[];
  const plugin={name:'exact-reviewed-two-origin-literals',setup(builder){builder.onLoad({filter:/[/\\]server[/\\]policy\.ts$/},async args=>{
    assert.equal(args.path,path.join(runtime,'server/policy.ts'));
    const source=await readFile(args.path,'utf8'),contents=localPolicy(source);
    seams.push({originalSha256:sha(source),testBundleSha256:sha(contents),substitutions:2});return{contents,loader:'ts'};
  });}};
  for(const entry of ['server/advisor-candidate-gateway.ts','workers/session-vault/index.ts']) {
    const result=await build({absWorkingDir:runtime,tsconfig:'tsconfig.json',entryPoints:[entry],bundle:true,format:'esm',platform:'browser',target:'es2022',write:false,external:['cloudflare:workers'],legalComments:'none',plugins:[plugin]});
    assert.equal(result.outputFiles.length,1);outputs.push({entry,sha256:sha(result.outputFiles[0].contents),bytes:result.outputFiles[0].contents.length});
  }
  assert.equal(seams.length,2);return{kind:'source-only-actual-gateway-vault-bundles',outputs,seams,resourceAcquisition:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE_SOURCE,'1','Explicit source-only compile opt-in required');
  console.log(JSON.stringify(await compileCareNativeSource()));
}
