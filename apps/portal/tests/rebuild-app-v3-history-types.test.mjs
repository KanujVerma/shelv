import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const repo=path.resolve(import.meta.dirname,'../../..'),portal=path.join(repo,'apps/portal');
test('strict compile preserves exact App Review/History capability types and forbidden authority exports',async()=>{
 const area=path.join(repo,'.local-artifacts/portal-rebuild/w0-v3-history/types');await mkdir(area,{recursive:true});
 const app=path.join(portal,'src/app/client-composition.ts'),runtime=path.join(portal,'src/app/session.ts');
 const source=`import {createClientComposition,createHistoryRestorationScope} from '${app}';
import type {ApplicationSession} from '${runtime}';
import type {ClientGuidanceCommand} from '${path.join(portal,'src/features/plan/guidancePort.ts')}';
import type {HistoryCommand} from '${path.join(portal,'src/features/history/types.ts')}';
// @ts-expect-error no raw URL or bearer entry point is exported
import {createRawReviewPort} from '${app}';
function compile(runtime:ApplicationSession){
 const c=createClientComposition(runtime);
 const boundary=runtime.getSnapshot().boundary!;
 declareUi(boundary,c);
 function declareUi(boundary:NonNullable<ReturnType<ApplicationSession['getSnapshot']>['boundary']>,c:ReturnType<typeof createClientComposition>){
  const win={} as Window;const navigator={} as import('${path.join(portal,'src/navigation/history.ts')}').PortalNavigator;
  const ticket=navigator.restoration.begin()!;
  navigator.restoration.complete(ticket,'saved',()=>boundary.isCurrent());
  // @ts-expect-error ticket identity is opaque, not a caller-created DTO
  navigator.restoration.read({});
  // @ts-expect-error only actual canonical saved context or fallback can be selected
  navigator.restoration.complete(ticket,{scrollY:999,focusKey:'forged'},()=>true);
  const context=navigator.restoration.read(ticket)!;
  // @ts-expect-error saved canonical context is immutable
  context.scrollY=999;

  // @ts-expect-error no caller supplied source/current predicate
  createHistoryRestorationScope({controller:c.history,boundary,navigator,win,isCurrent:()=>true});
  // @ts-expect-error no saved cursor/head object can establish restoration authority
  c.history.restoration?.restore({cursor:'forged',heads:{}});
 };
 c.ports.review.execute({schemaVersion:1,action:'read_client_plan_v3',version:null});
 // @ts-expect-error server derives the client owner
 c.ports.review.execute({schemaVersion:1,action:'read_client_plan_v3',version:null,clientId:'other'});
 // @ts-expect-error Care is a separate capability
 const care:ClientGuidanceCommand={schemaVersion:1,action:'read_client_plan_v2',version:null};
 // @ts-expect-error report writes are a separate capability
 const report:ClientGuidanceCommand={schemaVersion:1,action:'submit_goal_report_v1'};
 // @ts-expect-error decision is a separate capability
 const decision:HistoryCommand={schemaVersion:1,action:'record_decision_v2'};
 // @ts-expect-error preview/demo cannot choose a live mode
 createClientComposition(runtime,{mode:'public-demo'});
 // @ts-expect-error composition exposes no policy/approval/task administration
 c.grantTask;
 void care;void report;void decision;
}
void compile;`;
 await writeFile(path.join(area,'probe.ts'),source);
 const config={extends:path.join(portal,'tsconfig.frontend.json'),compilerOptions:{types:['react','react-dom'],typeRoots:[path.join(portal,'node_modules/@types')]},include:[path.join(portal,'src/**/*.ts'),path.join(portal,'src/**/*.tsx'),path.join(area,'probe.ts'),path.join(portal,'tests/rebuild-plan-guidance-types.ts'),path.join(portal,'tests/rebuild-history-restoration-types.ts')]};
 await writeFile(path.join(area,'tsconfig.json'),JSON.stringify(config,null,2));
 const output=execFileSync(process.execPath,[path.join(portal,'node_modules/typescript/bin/tsc'),'-p',path.join(area,'tsconfig.json')],{cwd:portal,encoding:'utf8'});assert.equal(output,'');
});
