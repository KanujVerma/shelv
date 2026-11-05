// Explicitly authorized synthetic Chrome only. This runner preserves production
// files and substitutes exactly one frozen build input for the RED sensitivity run.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const mode=process.argv[2];assert.ok(['red','green'].includes(mode));assert.equal(process.version,'v22.23.0');
const portal=path.resolve(import.meta.dirname,'..'),repo=path.resolve(portal,'../..');
const run=process.env.W4_RH2_BROWSER_RUN??`ordinal6-${mode}`;
assert.match(run,/^[a-zA-Z0-9-]+$/);
const area=path.join(repo,'.local-artifacts/portal-rebuild/w4-history-rh2-browser-ordinal6',run);
await fs.mkdir(area,{recursive:false});
const require=createRequire(path.join(portal,'package.json'));
const controller=path.join(portal,'src/features/history/controller.ts');
const baseline='9d189480e59e634d384eae55a6753cf98bcbbcc5';
const frozen=execFileSync('git',['show',`${baseline}:apps/portal/src/features/history/controller.ts`],{cwd:repo});
const hash=b=>createHash('sha256').update(b).digest('hex');
await fs.writeFile(path.join(area,'frozen-controller.ts'),frozen);
const harnessFile=path.join(portal,'tests/rebuild-history-browser-harness.mjs');
const testFile=path.join(portal,'tests/rebuild-history-review-authority-browser.test.mjs');
let harness=await fs.readFile(harnessFile,'utf8');const originalHarness=harness;
function replaceOnce(text,from,to){assert.equal(text.split(from).length,2,from);return text.replace(from,to);}
harness=replaceOnce(harness,"from 'esbuild'",`from ${JSON.stringify(require.resolve('esbuild'))}`);
harness=replaceOnce(harness,"from 'playwright-core'",`from ${JSON.stringify(path.join(path.dirname(require.resolve('playwright-core/package.json')),'index.mjs'))}`);
harness=replaceOnce(harness,"from './rebuild-history-helper.mjs'",`from ${JSON.stringify(path.join(portal,'tests/rebuild-history-helper.mjs'))}`);
for(const name of ['PortalReviewValidation','PortalReviewMapping'])harness=replaceOnce(harness,`from '../../../src/contracts/${name}.ts'`,`from ${JSON.stringify(path.join(repo,`src/contracts/${name}.ts`))}`);
harness=replaceOnce(harness,"path.resolve(import.meta.dirname,'..')",JSON.stringify(portal));
// No response/current/session/port/action overrides: identical HTTP harness.
// esbuild consumes the exact old controller bytes only in red mode.
const plugin=mode==='red'?`[{name:'frozen-rh2-controller-only',setup(b){b.onLoad({filter:/controller\\.ts$/},async args=>args.path===${JSON.stringify(controller)}?{contents:await fs.readFile(${JSON.stringify(path.join(area,'frozen-controller.ts'))},'utf8'),loader:'ts',resolveDir:${JSON.stringify(path.dirname(controller))}}:undefined);}}]`:'[]';
harness=replaceOnce(harness,'const r=await build({',`const r=await build({plugins:${plugin},`);
harness=replaceOnce(harness,'inputs[p]=hash(await fs.readFile(path.resolve(portal,p)));',`inputs[p]=hash(await fs.readFile(${mode==='red'?`path.resolve(portal,p)===${JSON.stringify(controller)}?${JSON.stringify(path.join(area,'frozen-controller.ts'))}:`:''}path.resolve(portal,p)));`);
harness=replaceOnce(harness,"JSON.stringify({entry:'tests/rebuild-history-browser-entry.tsx'",`JSON.stringify({sensitivity:${JSON.stringify({mode,overriddenInput:mode==='red'?'src/features/history/controller.ts':null,baseline:mode==='red'?baseline:null,frozenSha256:mode==='red'?hash(frozen):null})},entry:'tests/rebuild-history-browser-entry.tsx'`);
const test=await fs.readFile(testFile,'utf8');
await fs.writeFile(path.join(area,'harness.mjs'),harness);
await fs.writeFile(path.join(area,'browser.test.mjs'),replaceOnce(test,"from './rebuild-history-browser-harness.mjs'","from './harness.mjs'"));
await fs.writeFile(path.join(area,'provenance.json'),JSON.stringify({mode,baseline,sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),sourceControllerSha256:hash(await fs.readFile(controller)),frozenControllerSha256:hash(frozen),originalHarnessSha256:hash(originalHarness),materializedHarnessSha256:hash(harness),testSourceSha256:hash(test),testImportOnlyChange:true},null,2));
const result=spawnSync(process.execPath,['--experimental-strip-types','--test','--test-concurrency=1',path.join(area,'browser.test.mjs')],{cwd:repo,env:{...process.env,W4_BROWSER_RUN:`rh2-ordinal6/${run}`},stdio:'inherit'});
assert.equal(result.signal,null);process.exitCode=result.status??1;
