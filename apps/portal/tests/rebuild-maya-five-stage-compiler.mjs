// Full real dependency graph, compiler only. No browser, listener or output emit.
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const portal=new URL('..',import.meta.url).pathname;
const directory=new URL('../../../.local-artifacts/portal-rebuild/maya-five-stage/',import.meta.url);
const sha=value=>createHash('sha256').update(value).digest('hex');
const result=await build({absWorkingDir:portal,entryPoints:['src/features/walkthrough/maya/index.ts'],outdir:new URL('compiler-only/',directory).pathname,bundle:true,write:false,platform:'browser',format:'esm',tsconfig:'tsconfig.frontend.json',metafile:true});
const code=result.outputFiles.find(f=>f.path.endsWith('.js')).text;
if(/createSessionTransport|createCookieOperationPort|createCookieRequestFactory|createApplicationSession|document\.cookie|\/api\/|fetch\(/.test(code))throw Error('forbidden emitted operation');
const inputs=await Promise.all(Object.keys(result.metafile.inputs).map(async name=>({name,sha256:sha(await readFile(new URL(name,new URL('..',import.meta.url))))})));
const proof={write:false,platform:'browser',inputs,outputs:result.outputFiles.map(f=>({path:f.path,bytes:f.contents.length,sha256:sha(f.contents)})),sessionErrorBytes:Object.values(result.metafile.outputs).map(o=>o.inputs['src/transport/session.ts']??null)};
console.log(JSON.stringify({inputs:inputs.length,outputs:proof.outputs,sessionErrorBytes:proof.sessionErrorBytes},null,2));
const bytes=JSON.stringify(proof,null,2)+'\n';await mkdir(directory,{recursive:true});
const target=new URL('browser-graph-'+Date.now()+'.json',directory);await writeFile(target,bytes,{flag:'wx',mode:0o444});
console.log('GRAPH='+target.pathname+' SHA256='+sha(bytes));
