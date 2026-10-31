import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {compileCareNativeSource} from './rebuild-care-native-compile.mjs';
import {careBrowserRoot} from './rebuild-care-native-browser-source.mjs';
import {sha} from '../scripts/rebuild-native-boundary.mjs';

// The same application entry/options/output names as the retained builder, write:false.
// This compiles current source bytes without mounting React or allocating any runtime.
export async function compileCareBrowserApplication() {
  assert.equal(process.version,'v22.23.0');
  const portal=path.join(careBrowserRoot,'apps/portal'),outdir=path.join(careBrowserRoot,'.local-artifacts/portal-rebuild/application');
  return build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['src/main.tsx'],outdir,bundle:true,format:'esm',splitting:true,target:['es2022'],metafile:true,entryNames:'application',chunkNames:'chunks/[name]-[hash]',assetNames:'fonts/[name]-[hash]',loader:{'.woff2':'file','.woff':'file'},legalComments:'linked',write:false});
}

export async function compileCareBrowserSource() {
  const native=await compileCareNativeSource(),app=await compileCareBrowserApplication();
  const runner=await build({absWorkingDir:path.join(careBrowserRoot,'apps/portal'),entryPoints:['tests/rebuild-care-native-browser.mjs'],bundle:true,format:'esm',platform:'node',target:'node22',packages:'external',write:false,legalComments:'none'});
  assert.equal(runner.outputFiles.length,1);
  return {kind:'care-browser-source-only',resourceAcquisition:false,native,application:{inputs:Object.keys(app.metafile.inputs).length,outputs:app.outputFiles.map(f=>({file:path.relative(careBrowserRoot,f.path),bytes:f.contents.length,sha256:sha(f.contents)}))},runner:{bytes:runner.outputFiles[0].contents.length,sha256:sha(runner.outputFiles[0].contents)}};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  assert.equal(process.env.SHELV_REBUILD_CARE_BROWSER_SOURCE,'1','Explicit source-only opt-in required');
  console.log(JSON.stringify(await compileCareBrowserSource()));
}
