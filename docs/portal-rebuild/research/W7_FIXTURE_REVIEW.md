# W7 independent fixture-path review

Review date: 30 October 2026. Owner: Kanuj. Reviewer: delegated independent W7 reviewer.

## Verdicts

- **Specification compliance: PASS for this bounded fixture-path slice.** No blocking or important correctness finding. Explicit selection, default preparation compatibility, owned identity, source checks, selected subprocess routing, stop after source drift and refusal before unrelated lifecycle actions are supported by inspected source and the independent checks below.
- **Code quality: PASS with one non-blocking low-priority coverage finding (Q1).** The small change reuses existing ownership/lineage/locking logic rather than creating a second lifecycle implementation. The corrected child-directory handoff works, but neither side has a regression assertion in the committed 14 pure cases.
- These verdicts do not accept the unfinished plan backend, new publication gates, production release, or a real lifecycle run performed by this reviewer.

## Exact review identity and scope

| Item | Verified value |
| --- | --- |
| Base | `7abaabc008a3cfdeeeafa8f9e231737ccffabb09` |
| Head reviewed | `e0c8d406138b23775aa9e76f5e5abd7be1df37e9` |
| Workspace | `/Users/kanuj/.t3/worktrees/shelv/t3-b37512ad` |
| Branch | `t3/review-fixture-path-slice` |
| Initial state | Clean checkout exactly at reviewed head |
| Patch package | `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/.local-artifacts/portal-rebuild/fixture-path-review.patch` |
| Patch SHA-256 | `32e0680d2546595f8886bdeee970d0eac4d4364eee7a2b7f84a5f8cf87722d4d` |
| Live model evidence | Fresh `mcp__t3_code__orchestrator_capabilities({"search":"gpt-6.1-sol"})` returned `inheritedProviderInstanceId=codex`, `inheritedModel=gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default mode |
| Review task identity in that response | `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-fixture-review-20261030-r1` |
| Node | `v22.23.0`, `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` |
| Freshness | `git fetch origin` succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`; `git rev-list --left-right --count origin/main...HEAD` returned `0 13` |

The patch has exactly eight changed paths, 178 insertions and 16 deletions. `git apply --reverse --check <patch-package>` exited 0. Independently compared every patch old/new blob identity with `git rev-parse <base-or-head>:<path>`, including the new-file absence at base, and compared the complete path set against `git diff --name-only 7abaabc..e0c8d40`: all eight match. The reviewed head is one commit after base.

Read applicable global/root/portal AGENTS, the rebuild entry point, D01-D48, full desktop specification, implementation contracts, acceptance matrix, workstream registry, current status, PLAN_API_V1, coordinator record diff, fixture README, and relevant W1 local-admission allocation/lineage evidence at `research/W1_BACKEND.md:407-450`. Inspected complete runner/lineage helper/native-lineage child, all three focused test files, and the bootstrap/native/browser consumers needed to trace selected environment fields. No unfinished SQL/Edge/backend review was attempted.

## Q1: preserve the corrected subprocess handoff in the focused regression suite

**Priority: low, non-blocking.** Location: `apps/portal/tests/admission-fixture-paths.test.mjs:56-68`; correction endpoints are `apps/portal/scripts/local-admission.mjs:110-111` and `apps/portal/tests/admission-lineage-native.mjs:8`.

The only new CLI test invokes `prepare`, then checks a missing argument. It never invokes the child-lineage boundary. In a disposable copy, deleting only `SHELV_ADMISSION_FIXTURE_DIR:directory,` from the runner still produced **14 passing focused tests**. Restoring that producer and independently deleting only the child's `,process.env.SHELV_ADMISSION_FIXTURE_DIR` argument also produced **14 passing focused tests**.

The appendix's mocked-process probe executes the actual copied lineage child. Each mutation makes that child select the baseline container instead of the selected project; the probe rejects that exact target. The unmodified head passes. This reproduces the regression mechanism without a real Docker/SQL/Auth call.

The correction is therefore covered by the coordinator's retained successful real run and this independent one-off probe, **not by the committed focused 14-case regression suite**. Add a bounded regression that observes both the produced environment and actual child fixture resolution, with a baseline whose frozen source differs from the selected snapshot. It can use synthetic process ports; no additional heavy stack allocation is necessary for this recommendation. No source fix was authored during review.

## Requirement evidence

| Requirement | Source and independent evidence |
| --- | --- |
| Default compatibility; a new path gets a distinct owner/project | Runner `13-49`; existing preparation cases plus selected-path test pass. Appendix prepares baseline SQL `select 1` and selected SQL `select 2`, retaining different projects/snapshots. This is source/identity proof, not volume creation proof. |
| Artifact containment, ancestor and symlink refusal | Runner `13-24` resolves to an absolute descendant and inspects existing components with `lstat`. Existing tests reject checkout/source/artifact-root/escape paths and a redirected component. Appendix checks nine invalid API values on both prepare/read, selected unmarked preservation, and leaf/intermediate symlink refusal. |
| Missing, empty, malformed or duplicate flags fail before lifecycle work | Runner `120-132`; appendix checks eight forms, each exit 1 with zero child commands: missing, empty, whitespace, next-option-as-value, duplicate fixture flag, unsupported equals syntax, unknown option and duplicate browser flag. |
| All child inputs stay selected | Runner `110-113` overrides selected fixture/config/container/report/artifact values; native-lineage child `8-16` derives its DB from that fixture. Bootstrap/native consumers use the supplied selected config/container; browser uses those native ports and selected artifacts. Appendix executes the actual read-only lineage child against mocked selected DB responses, checks selected paths for every child, and confirms no lineage output appears under baseline. |
| Both canonical source verifications stay selected | Runner `64,106,114` closes over selectedDirectory. Appendix's successful run has an older incompatible baseline, so rechecking that default would fail. Injected drift after the mocked native step rejects the final source check and stops only the selected project. |
| Stop works after canonical drift | Runner `51-55,65,84-85` reads the selected prepared receipt/config rather than preparing current source. Appendix invokes selected `stop` after drift: only selected stop is requested, no prepare/start. |
| Unmarked, foreign, stale, attestation and lifecycle ownership remain fail-closed | Existing preparation, lineage and exact-lock tests pass. Unchanged helper `23-30` verifies project/owner/snapshot/workdir/volume creation identity before startup and before the cleanup try/finally. Appendix separately corrupts synthetic workdir/owner/snapshot/volume-time bindings; each refuses with zero Supabase calls, including zero stop. Actual runtime-attestation mismatch cases are represented by the pure lineage tests, not a reviewer-operated database. |
| No arbitrary project selection or cross-project cleanup | CLI accepts a directory, never a project/container/volume override. Identity comes from generated/revalidated prepared ownership; subprocesses use argument arrays. Resource checks precede cleanup eligibility, and stop explicitly names selected workdir/project. No remove-volume/reset command is added. Inspected and mocked traces show no unrelated target. Exported root injection remains the existing trusted test-helper seam; it is not a new remotely exposed API. |
| Docs and scope stay truthful | README states fixed ports/one active fixture, retained volumes and explicit same-path lifecycle commands. Coordinator records distinguish typed seam, existing Auth acceptance and unfinished publication backend. No historical migration/backend/application behavior is changed in this patch. |

## Commands and results

Executed in the review workspace on reviewed head:

```sh
node --version
command -v node
git status --short --branch
git rev-parse HEAD
git rev-parse 7abaabc e0c8d40
git fetch origin
git rev-list --left-right --count origin/main...HEAD
git diff --stat 7abaabc..e0c8d40
git diff --name-only 7abaabc..e0c8d40
git apply --reverse --check /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/.local-artifacts/portal-rebuild/fixture-path-review.patch
node --test apps/portal/tests/admission-fixture.test.mjs apps/portal/tests/admission-lineage.test.mjs apps/portal/tests/admission-fixture-paths.test.mjs
git diff --check
```

All commands exited 0. Focused test result: **14 tests, 14 pass, zero failures/skips/cancellations**. Whitespace check passed. Appendix's final independent probe exited 0: **13 assertion groups passed**, including independent producer/consumer mutation checks and four refusal variants. It creates and removes only disposable synthetic files. Every Docker/Supabase process request is intercepted; only Node is genuinely spawned for the actual copied lineage child.

One earlier version of the reviewer probe exited 1 at its expected-error assertion because its synthetic baseline lacked `RUNTIME-BINDING.json`: the mutated child failed at that missing baseline receipt before reaching the expected container assertion. Added a synthetic baseline receipt to the probe, preserving the application's code, then reran successfully. This was a probe-fixture correction, not a product defect. The final appendix also makes the baseline and selected source snapshots differ.

## Retained author evidence and limits

Read only these safe outer logs under the coordinator's ignored `.local-artifacts/portal-rebuild/`:

| File | SHA-256 | Observed content |
| --- | --- | --- |
| `fixture-paths-red.log` | `8f84f6af659887c68e2f1f137433564d9aa16e80a1328f4a4e233a44506c49fc` | Four failures: old snapshot/path behavior, containment, symlink, selected prepare CLI. Author evidence, not an independent base replay. |
| `fixture-paths-green.log` | `031063e740be9a1254c689a5e95f5677ff41ba8d2ddb8516fa896525a26c8851` | Fourteen passes. Independently reproduced on head above. |
| `fixture-paths-native.log` | `6dfb38ebb5bdf72cfea861a9a226e6cbe55d2bf1204b3ef57983f261688c0e9e` | One safe result line: selected `shelv-portal-admission-5fad8862e696`, 53 migrations, `fresh:false`, `PASS`, 15 cases, browser true, hostedChanges false, realEmails 0. |

The native result records snapshot `08743ec0013c34976d23b889b19df95bc30e248fac62e10e5203e2d9e2b465b6` and ledger `6c71b732a6ff1e1bdf8504d120aae2a0845bf4f5a30ef5c2c59b36c0f966bf14`. The coordinator's execution log and task brief attribute the initial stopped-default-container failure, subsequent correction, successful retained-instance rerun and normal cleanup. The safe outer native log independently corroborates the final selected-project success summary; it does not itself contain the initial error or stopped-state inventory.

Baseline `8cb3813a54e9` and selected `5fad8862e696` being stopped with volumes retained is coordinator-provided state, not a fresh reviewer lifecycle observation. No Docker/Colima/real Auth lifecycle, private status/credential read, hosted access, email, client data or money action was performed. No full root/Expo/SQL/browser suite, CI watching, push, PR, merge or deployment was run. Broader implementation and release checks remain coordinator-owned; pure and mocked checks here are not real lifecycle acceptance.

Only this report is authored. No source, test, config, coordinator status or CONTEXT_SYNC edit is included, as required by the explicit review write-set. Extracted the appendix from this report and reran it through `zsh`: exit 0, all 13 groups passed exactly as written. Report code fences are balanced and no em dash is present. This report contains no Markdown link targets requiring a separate link check; cited repository paths were read during review.

## Reproducible independent probe

Run from this checkout's root at the reviewed head. The complete command below records the synthetic checks and mutations without retaining a second test file or modifying checkout source.

```sh
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {preparePortalAdmissionFixture as prepare,readPreparedPortalAdmissionFixture as read} from './apps/portal/scripts/local-admission.mjs';
import {attestFreshRuntime} from './apps/portal/scripts/local-admission-lineage.mjs';
const root=await fs.realpath(await fs.mkdtemp(path.join(tmpdir(),'shelv-w7-fixture-review-')));
const migration='20261030000000_fixture.sql',checks=[];
const pass=s=>{checks.push(s);console.log('ok '+checks.length+' - '+s);};
try {
 const scripts=path.join(root,'apps/portal/scripts'),tests=path.join(root,'apps/portal/tests');
 await fs.mkdir(scripts,{recursive:true});await fs.mkdir(tests,{recursive:true});
 for(const name of ['local-admission.mjs','local-admission-lineage.mjs'])await fs.copyFile('apps/portal/scripts/'+name,path.join(scripts,name));
 for(const name of ['admission-lineage-native.mjs','admission-fixture.test.mjs','admission-lineage.test.mjs','admission-fixture-paths.test.mjs'])await fs.copyFile('apps/portal/tests/'+name,path.join(tests,name));
 const config=path.join(root,'apps/portal/test-fixtures/admission/supabase');await fs.mkdir(config,{recursive:true});await fs.copyFile('apps/portal/test-fixtures/admission/supabase/config.toml',path.join(config,'config.toml'));
 await fs.mkdir(path.join(root,'supabase/migrations'),{recursive:true});const source=path.join(root,'supabase/migrations',migration);await fs.writeFile(source,'select 1;\n');
 const baseline=await prepare(root);await fs.writeFile(source,'select 2;\n');const selected=await prepare(root,'.local-artifacts/selected');
 const ledger=[{version:'20261030000000',name:'fixture',statements:['select 2']}];
 const bind=fixture=>attestFreshRuntime(fixture.manifest,ledger,{name:'supabase_db_'+fixture.projectId,createdAt:'synthetic-volume'},fixture.directory);
 const binding=bind(selected);
 for(const fixture of [baseline,selected])await fs.writeFile(path.join(fixture.directory,'RUNTIME-BINDING.json'),JSON.stringify(bind(fixture)));
 assert.notEqual(baseline.projectId,selected.projectId);pass('relative selected path has distinct identity');
 const invalid=[null,'',' ',42,root,path.dirname(root),'.local-artifacts','.local-artifacts/../outside','.local-artifacts-sibling/x'];
 for(const value of invalid){await assert.rejects(()=>prepare(root,value));await assert.rejects(()=>read(root,value));}
 pass('9 invalid API selections rejected by prepare and read');
 await fs.mkdir(path.join(root,'.local-artifacts/unmarked'));await fs.writeFile(path.join(root,'.local-artifacts/unmarked/keep'),'keep');await assert.rejects(()=>prepare(root,'.local-artifacts/unmarked'),/unmarked/);assert.equal(await fs.readFile(path.join(root,'.local-artifacts/unmarked/keep'),'utf8'),'keep');pass('selected unmarked folder preserved');
 await fs.symlink(selected.directory,path.join(root,'.local-artifacts/link'));
 for(const value of ['.local-artifacts/link','.local-artifacts/link/child']){await assert.rejects(()=>prepare(root,value),/symlink/);await assert.rejects(()=>read(root,value),/symlink/);}
 pass('leaf and intermediate symlink rejected by prepare and read');
 const runner=path.join(scripts,'local-admission.mjs');
 async function mockMain(){
  const {default:cp}=await import('node:child_process'),{syncBuiltinESMExports}=await import('node:module'),{readFileSync,writeFileSync}=await import('node:fs'),{default:path}=await import('node:path'),{pathToFileURL}=await import('node:url'),{default:assert}=await import('node:assert/strict');
  const input=JSON.parse(process.env.W7_REVIEW_INPUT),originalExec=cp.execFileSync,calls=[],container='supabase_db_'+input.fixture.projectId;
  cp.execFileSync=(program,args,options={})=>{
   calls.push({program:program===process.execPath?'node':program,args,fixture:options.env?.SHELV_ADMISSION_FIXTURE_DIR});
   if(program==='docker'){
    if(args[0]==='volume'&&args[1]==='ls')return container+'\n';
    if(args[0]==='volume'&&args[1]==='inspect'){assert.equal(args[2],container);return JSON.stringify([{Name:container,CreatedAt:'synthetic-volume',Labels:{'com.supabase.cli.project':input.fixture.projectId}}]);}
    if(args[0]==='ps')return '';
    if(args[0]==='exec'){
     assert.equal(args[2],container,'probe targeted the stopped baseline instead of selected fixture');
     const sql=args.at(-1);
     if(sql.includes('to_regclass'))return 't';
     if(sql.startsWith('select payload'))return JSON.stringify(input.binding);
     if(sql.includes('schema_migrations'))return JSON.stringify(input.ledger);
    }
    throw Error('UNEXPECTED MOCK DOCKER CALL');
   }
   if(program==='supabase'){
    assert.equal(args[args.indexOf('--workdir')+1],input.fixture.directory);
    if(args[0]==='stop')assert.equal(args.at(-1),input.fixture.projectId);
    return args[0]==='status'?JSON.stringify({API_URL:'http://127.0.0.1:57421'}):'';
   }
   assert.equal(program,process.execPath,'No external programs are permitted');
   const env=options.env;assert.equal(env.SHELV_ADMISSION_DB_CONTAINER,container);assert.equal(env.SHELV_ADMISSION_LOCAL_CONFIG,path.join(input.fixture.directory,'status.private.json'));assert.equal(env.SHELV_ADMISSION_REPORT,path.join(input.fixture.directory,'NATIVE-RESULT.json'));assert.equal(env.SHELV_ADMISSION_UI_ARTIFACTS,path.join(input.fixture.directory,'screenshots'));
   if(args[0].endsWith('admission-lineage-native.mjs'))return originalExec(process.execPath,['--input-type=module','-e',process.env.W7_REVIEW_WRAPPER,path.join(input.root,args[0])],{...options,env:{...env,W7_REVIEW_CHILD:'1'}});
   if(args.at(-1).endsWith('concierge-admission-native.mjs')){
    writeFileSync(env.SHELV_ADMISSION_REPORT,JSON.stringify({status:'MOCK_ONLY',checks:[]}));
    if(input.drift)writeFileSync(input.source,'select 3;\n');
   }
   return 'MOCK_ONLY';
  };syncBuiltinESMExports();
  try{await import(pathToFileURL(process.argv[1]).href);}finally{if(!process.env.W7_REVIEW_CHILD)writeFileSync(path.join(input.root,'calls.json'),JSON.stringify(calls));}
 }
 const wrapper='('+mockMain.toString()+')()';
 const invoke=(args,changes={})=>spawnSync(process.execPath,['--input-type=module','-e',wrapper,runner,...args],{cwd:root,env:{...process.env,W7_REVIEW_INPUT:JSON.stringify({root,fixture:selected,binding,ledger,source,...changes}),W7_REVIEW_WRAPPER:wrapper},encoding:'utf8'});
 const calls=async()=>JSON.parse(await fs.readFile(path.join(root,'calls.json'),'utf8'));
 const malformed=[['run','--fixture-dir'],['stop','--fixture-dir',''],['run','--fixture-dir',' '],['run','--fixture-dir','--browser'],['run','--fixture-dir',selected.directory,'--fixture-dir',selected.directory],['run','--fixture-dir='+selected.directory],['run','--unknown'],['run','--browser','--browser']];
 for(const args of malformed){const out=invoke(args);assert.equal(out.status,1,out.stdout);assert.deepEqual(await calls(),[]);}
 pass('8 malformed/duplicate CLI forms rejected before any child command');
 let out=invoke(['run','--fixture-dir',selected.directory,'--browser']);assert.equal(out.status,0,out.stderr);assert.match(out.stdout,/MOCK_ONLY/);let trace=await calls();assert.equal(trace.filter(c=>c.program==='supabase'&&c.args[0]==='stop').length,1);assert.ok(existsSync(path.join(selected.directory,'RETAINED-LINEAGE-REGRESSION.json')));assert.ok(!existsSync(path.join(baseline.directory,'RETAINED-LINEAGE-REGRESSION.json')));pass('mocked run executes actual read-only lineage child on selected fixture; stops only selected project');
 out=invoke(['run','--fixture-dir',selected.directory],{drift:true});assert.equal(out.status,1);assert.match(out.stderr,/snapshot drift/);trace=await calls();assert.equal(trace.filter(c=>c.program==='supabase'&&c.args[0]==='stop').length,1);pass('source drift after mocked native step fails final selected check and stops only selected project');
 out=invoke(['stop','--fixture-dir',selected.directory]);assert.equal(out.status,0,out.stderr);trace=await calls();assert.deepEqual(trace.filter(c=>c.program==='supabase').map(c=>c.args[0]),['stop']);pass('selected stop after canonical source drift neither prepares nor starts another fixture');
 await fs.writeFile(source,'select 2;\n');
 const original=await fs.readFile(runner,'utf8');assert.ok(original.includes('SHELV_ADMISSION_FIXTURE_DIR:directory,'));await fs.writeFile(runner,original.replace('SHELV_ADMISSION_FIXTURE_DIR:directory,',''));
 out=spawnSync(process.execPath,['--test',...['admission-fixture.test.mjs','admission-lineage.test.mjs','admission-fixture-paths.test.mjs'].map(n=>path.join(tests,n))],{encoding:'utf8'});assert.equal(out.status,0,out.stderr);assert.match(out.stdout,/# pass 14/);pass('mutation removing selected-directory producer still passes committed 14 pure tests');
 out=invoke(['run','--fixture-dir',selected.directory]);assert.equal(out.status,1);trace=await calls();assert.equal(trace.filter(c=>c.program==='supabase'&&c.args[0]==='stop').length,1);const failure=await fs.readFile(path.join(selected.directory,'lineage-regression.log'),'utf8');assert.match(failure,/stopped baseline instead of selected fixture/);pass('same mutation fails mocked child routing; cleanup remains selected');

 await fs.writeFile(runner,original);
 const lineageChild=path.join(tests,'admission-lineage-native.mjs'),childOriginal=await fs.readFile(lineageChild,'utf8');
 assert.ok(childOriginal.includes('undefined,process.env.SHELV_ADMISSION_FIXTURE_DIR'));await fs.writeFile(lineageChild,childOriginal.replace('undefined,process.env.SHELV_ADMISSION_FIXTURE_DIR','undefined'));
 out=spawnSync(process.execPath,['--test',...['admission-fixture.test.mjs','admission-lineage.test.mjs','admission-fixture-paths.test.mjs'].map(n=>path.join(tests,n))],{encoding:'utf8'});assert.equal(out.status,0,out.stderr);assert.match(out.stdout,/# pass 14/);pass('independent mutation removing selected-directory consumer also passes committed 14 pure tests');
 out=invoke(['run','--fixture-dir',selected.directory]);assert.equal(out.status,1);assert.match(await fs.readFile(path.join(selected.directory,'lineage-regression.log'),'utf8'),/stopped baseline instead of selected fixture/);pass('consumer mutation also targets baseline in mocked child');
 await fs.writeFile(lineageChild,childOriginal);
 for(const [field,value,reason] of [['workdirSha256','other-checkout',/foreign checkout/],['ownerId','other-owner',/resource owner/],['snapshotSha256','stale-snapshot',/retained snapshot/],['volumeCreatedAt','replaced-volume',/volume was replaced/]]){
  await fs.writeFile(path.join(selected.directory,'RUNTIME-BINDING.json'),JSON.stringify({...binding,[field]:value}));
  out=invoke(['run','--fixture-dir',selected.directory]);assert.equal(out.status,1);assert.match(out.stderr,reason);assert.equal((await calls()).filter(c=>c.program==='supabase').length,0);
 }
 pass('foreign checkout/owner, stale snapshot and replaced-volume bindings refuse before startup or cleanup');

 console.log(JSON.stringify({status:'PASS',groups:checks.length,scope:'synthetic files and mocked processes only; zero Docker/Supabase/Auth/browser lifecycle'}));
}finally{await fs.rm(root,{recursive:true,force:true});}
NODE
```
