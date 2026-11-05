import {build} from 'esbuild';
import {createRequire} from 'node:module';
export async function sourceModule(entry) {
  const result=await build({absWorkingDir:new URL('..',import.meta.url).pathname,entryPoints:[entry],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'},tsconfig:'tsconfig.frontend.json',metafile:true});
  const module={exports:{}};
  new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
  return {exports:module.exports,inputs:Object.keys(result.metafile.inputs),code:result.outputFiles[0].text,metafile:result.metafile};
}
