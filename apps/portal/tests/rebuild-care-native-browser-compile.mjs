import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,readdir,lstat,mkdir,mkdtemp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {compileCareNativeSource} from './rebuild-care-native-compile.mjs';
import {careBrowserRoot} from './rebuild-care-native-browser-source.mjs';
import {sha} from '../scripts/rebuild-native-boundary.mjs';
import {writeEmittedNotices} from '../scripts/emitted-notices.mjs';

// The same application entry/options/output names as the retained builder, write:false.
// This compiles current source bytes without mounting React or allocating any runtime.
export async function compileCareBrowserApplication() {
  assert.equal(process.version,'v22.23.0');
  const portal=path.join(careBrowserRoot,'apps/portal'),outdir=path.join(careBrowserRoot,'.local-artifacts/portal-rebuild/application');
  return build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['src/main.tsx'],outdir,bundle:true,format:'esm',splitting:true,target:['es2022'],metafile:true,entryNames:'application',chunkNames:'chunks/[name]-[hash]',assetNames:'fonts/[name]-[hash]',loader:{'.woff2':'file','.woff':'file'},legalComments:'linked',write:false});
}

// Independent expected build. Reads current compiler inputs and tracked builder
// declarations, never the candidate's provenance or its actual directory set.
// sourceHead is only an offline retrospective provenance label; the live attestor
// always supplies the actual clean current Git head.
export async function expectedCareBrowserApplication({sourceHead}={}) {
  assert.equal(process.version,'v22.23.0');
  const root=careBrowserRoot,portal=path.join(root,'apps/portal'),directory=path.join(root,'.local-artifacts/portal-rebuild/application');
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const head=sourceHead??git('rev-parse','HEAD');assert.match(head,/^[0-9a-f]{40}$/);git('merge-base','--is-ancestor',head,'HEAD');
  const compiled=await compileCareBrowserApplication(),outputs=Object.create(null),inputs=[];
  function emit(relative,bytes){assert.ok(relative&&!path.isAbsolute(relative)&&!relative.split('/').includes('..'));assert.ok(!Object.hasOwn(outputs,relative),'Duplicate expected output');outputs[relative]=Buffer.from(bytes);}
  async function source(relative,{tracked=false}={}){const file=path.resolve(root,relative);assert.ok(file.startsWith(root+path.sep),'Expected source must be in this checkout');if(tracked)git('ls-files','--error-unmatch','--',relative);const stat=await lstat(file);assert.ok(stat.isFile()&&!stat.isSymbolicLink());return readFile(file);}
  for(const file of compiled.outputFiles){const relative=path.relative(directory,file.path);assert.ok(!relative.startsWith('..'));emit(relative,file.contents);}
  for(const input of Object.keys(compiled.metafile.inputs).sort()){const relative=path.relative(root,path.resolve(portal,input)),bytes=await source(relative);inputs.push({source:relative,bytes:bytes.length,sha256:sha(bytes)});}
  const template='apps/portal/src/app/index.html',html=await source(template,{tracked:true});inputs.push({source:template,bytes:html.length,sha256:sha(html)});emit('index.html',html);
  emit('build-metadata.json',Buffer.from(JSON.stringify(compiled.metafile,null,2)+'\n'));
  const assets=[];
  async function copy(relative,output,expected){const bytes=await source(relative,{tracked:true}),sha256=sha(bytes);if(expected)assert.equal(sha256,expected,'Tracked approved asset differs');emit(output,bytes);assets.push({source:relative,output,bytes:bytes.length,sha256});}
  const catalog=JSON.parse(await source('docs/portal-rebuild/design/ASSETS.json',{tracked:true}));
  for(const asset of catalog.assets)await copy('docs/portal-rebuild/design/'+asset.path,'assets/approved/'+path.basename(asset.path),asset.sha256);
  await copy('apps/portal/site/assets/shelv-mark.png','assets/shelv-mark.png');
  const retained=git('ls-files','-z','--','apps/portal/site/maya/assets').split('\0').filter(file=>/\.(png|jpg|webp)$/.test(file)).map(file=>path.basename(file)).sort();
  for(const name of retained)await copy('apps/portal/site/maya/assets/'+name,'maya/assets/'+name);
  const provenance={schemaVersion:1,candidate:true,gatewayIncluded:false,sourceHead:head,sourceDirty:false,entry:'apps/portal/src/main.tsx',template,inputs,assets};
  emit('application-provenance.json',Buffer.from(JSON.stringify(provenance,null,2)+'\n'));
  const expectedRoot=path.join(root,'.local-artifacts/portal-rebuild/w6-care-native-browser-r7/source');await mkdir(expectedRoot,{recursive:true});
  const expectedDirectory=await mkdtemp(path.join(expectedRoot,'expected-only-'));
  await writeEmittedNotices(compiled.metafile,{workingDirectory:portal,outputDirectory:expectedDirectory});
  async function notices(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){assert.ok(!entry.isSymbolicLink());const file=path.join(dir,entry.name),relative=prefix+entry.name;if(entry.isDirectory())await notices(file,relative+'/');else{assert.ok(entry.isFile());emit(relative,await readFile(file));}}}
  await notices(expectedDirectory);
  return {directory,expectedDirectory,provenance,outputs};
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
