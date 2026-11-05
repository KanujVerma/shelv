// Compiler only, actual browser target. No output bundles or browser execution.
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
const portal=new URL('..',import.meta.url).pathname,repo=path.resolve(portal,'../..');
const evidence=path.join(repo,'.local-artifacts/portal-rebuild/w3-maya-interactions');
const base='3bd152a259b7b9b9971caa1546e65f69de12aab9',sha=b=>createHash('sha256').update(b).digest('hex');
const changed=new Set(['plan/types.ts','plan/UseReport.tsx','plan/DecisionControls.tsx','plan/ClientPlan.tsx','walkthrough/maya/controller.ts','walkthrough/maya/view.tsx'].map(n=>'apps/portal/src/features/'+n));
const baseline={name:'exact-frozen-preimage',setup(b){b.onLoad({filter:/\.[cm]?tsx?$/},args=>{
  const relative=path.relative(repo,args.path);if(!changed.has(relative))return;
  return {contents:execFileSync('git',['show',base+':'+relative],{cwd:repo,encoding:'utf8'}),loader:relative.endsWith('tsx')?'tsx':'ts'};
});}};
async function compile(entry,old=false){
  // Same esbuild application settings as scripts/build-portal-app.mjs, with
  // write:false. Asset copy/HTML/notices packaging is outside this check.
  const result=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:[entry],outdir:path.join(evidence,'never-emitted'),bundle:true,format:'esm',platform:'browser',splitting:true,target:['es2022'],metafile:true,entryNames:'application',chunkNames:'chunks/[name]-[hash]',assetNames:'fonts/[name]-[hash]',loader:{'.woff2':'file','.woff':'file'},legalComments:'linked',write:false,plugins:old?[baseline]:[]});
  const inputs={};for(const n of Object.keys(result.metafile.inputs)){
    const absolute=path.resolve(portal,n),relative=path.relative(repo,absolute);
    const bytes=old&&changed.has(relative)?execFileSync('git',['show',base+':'+relative],{cwd:repo}):await readFile(absolute);
    inputs[relative]={bytes:bytes.length,sha256:sha(bytes)};
  }
  const outputs=Object.fromEntries(result.outputFiles.map(f=>[path.relative(path.join(evidence,'never-emitted'),f.path),{bytes:f.contents.length,sha256:sha(f.contents)}]));
  const code=result.outputFiles.filter(f=>f.path.endsWith('.js')).map(f=>f.text).join('\n');
  return {inputs,outputs,metafile:result.metafile,code};
}
await mkdir(evidence,{recursive:true});
const [oldMain,main,oldPublic,publicModule]=await Promise.all([compile('src/main.tsx',true),compile('src/main.tsx'),compile('src/app/MayaApplication.tsx',true),compile('src/app/MayaApplication.tsx')]);
if(/createApplicationSession|createSessionTransport|createCookieOperationPort|createCookieRequestFactory|document\.cookie|\/api\/|fetch\(/.test(publicModule.code))throw Error('live operation in public closure');
function correspondence(a,b){return {addedInputs:Object.keys(b.inputs).filter(n=>!a.inputs[n]),removedInputs:Object.keys(a.inputs).filter(n=>!b.inputs[n]),changedInputs:Object.keys(a.inputs).filter(n=>b.inputs[n]&&a.inputs[n].sha256!==b.inputs[n].sha256),changedOutputs:Object.keys(b.outputs).filter(n=>a.outputs[n]?.sha256!==b.outputs[n].sha256),unchangedOutputs:Object.keys(b.outputs).filter(n=>a.outputs[n]?.sha256===b.outputs[n].sha256)};}
const proof={write:false,platform:'browser',base,correspondence:{main:correspondence(oldMain,main),public:correspondence(oldPublic,publicModule)},builds:{}};
for(const [label,data] of Object.entries({oldMain,main,oldPublic,publicModule})){
  const {code,...graph}=data;proof.builds[label]={inputs:Object.keys(data.inputs).length,outputs:data.outputs};
  await writeFile(path.join(evidence,`compiler-${label}-${Date.now()}.json`),JSON.stringify(graph,null,2)+'\n',{flag:'wx',mode:0o444});
}
if(proof.correspondence.main.removedInputs.length||proof.correspondence.public.removedInputs.length)throw Error('unexpected removed input');
if(proof.correspondence.main.changedInputs.some(n=>!changed.has(n))||proof.correspondence.public.changedInputs.some(n=>!changed.has(n)))throw Error('unowned input changed');
if(proof.correspondence.main.addedInputs.some(n=>n!=='apps/portal/src/features/walkthrough/maya/interactions.ts')||proof.correspondence.public.addedInputs.some(n=>n!=='apps/portal/src/features/walkthrough/maya/interactions.ts'))throw Error('unowned added input');
await writeFile(path.join(evidence,'compiler-proof-'+Date.now()+'.json'),JSON.stringify(proof,null,2)+'\n',{flag:'wx',mode:0o444});
console.log(JSON.stringify(proof,null,2));
