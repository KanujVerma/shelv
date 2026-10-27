import {build} from 'esbuild';
import {readdir,mkdir,cp,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
// Existing fixture imports use this generated directory. Copy the current site;
// never rerun the retired R2 migration over an already composed portal.
const fixtureSite=new URL('../../candidate/site/',import.meta.url);
await rm(fixtureSite,{recursive:true,force:true});
await cp(new URL('../../../site/',import.meta.url),fixtureSite,{recursive:true});
await mkdir('.test-build',{recursive:true});
const entries=(await readdir('tests')).filter(f=>f.endsWith('.test.ts')).map(f=>`tests/${f}`);
await build({entryPoints:entries,outdir:'.test-build',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...entries.map(f=>f.replace('tests/','.test-build/').replace('.ts','.js'))],{stdio:'inherit'});
process.exitCode=result.status??1;
