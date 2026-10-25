import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/advisor-durable.test.ts','tests/advisor-logout.test.ts'],outdir:'.test-build',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','.test-build/advisor-durable.test.js','.test-build/advisor-logout.test.js'],{stdio:'inherit'});process.exitCode=result.status??1;
