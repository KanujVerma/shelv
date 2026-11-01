// Source-only controls. SSR has no DOM/effects; all reads use actual retained factories/Root.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {runInThisContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createApplicationSession} from '../src/app/session.ts';
import {createClientReviewRequest} from '../src/app/review-request.ts';
import {createClientPorts} from '../src/app/ports.ts';
import {createClientPlanController} from '../src/app/client-state.ts';
import {createClientGuidancePort} from '../src/features/plan/guidancePort.ts';
import {createGuidanceHydrator} from '../src/features/plan/guidanceHydration.ts';
import {productInstructionScopes} from '../src/features/plan/guidancePresentation.ts';
import {TransportError} from '../src/transport/session.ts';
import {GuidanceHttpFixture,largeGuidanceData} from './rebuild-plan-guidance-browser-fixture.mjs';
import {cursor,manifestPage} from './rebuild-plan-guidance-fixture.mjs';
import {mapReviewResult} from '../../../src/contracts/PortalReviewMapping.ts';

const compiled=await build({absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['tests/rebuild-plan-guidance-context-source.tsx'],tsconfig:'tsconfig.frontend.json',bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'}});
const module={exports:{}};
runInThisContext('(function(require,module,exports){'+compiled.outputFiles[0].text+'\n})',{filename:'owned-manifest-precondition-ssr.cjs'})(createRequire(import.meta.url),module,module.exports);
const {renderFeature}=module.exports;

// This consumes the existing public hydrator instance API. It is not wired to the
// browser: the current renderer keeps that actual instance inside GuidanceBoundary.
function acceptedManifest(hydrator,{view,session,mode}){
  const snapshot=view.currentGuidance.snapshot;
  return new Promise((resolve,reject)=>{
    let stop=()=>{},done=false;
    const inspect=()=>{
      if(done)return;
      try{
        if(hydrator.view!==view||hydrator.session!==session||hydrator.mode!==mode||view.currentGuidance.snapshot!==snapshot)throw new TransportError(503);
        if(!session.isCurrent())throw new TransportError(401);
        const state=hydrator.getSnapshot();
        if(state.phase==='retired'||state.phase==='error')throw new TransportError(state.error??503);
        if(state.phase==='ready'&&state.manifest!==null){done=true;stop();resolve(state);}
      }catch(error){done=true;stop();reject(error);}
    };
    stop=hydrator.subscribe(inspect);inspect();
  });
}
async function setup(t){
  const server=new GuidanceHttpFixture(largeGuidanceData());server.pageSize=100;const calls=[];
  const runtime=createApplicationSession({audience:'client',locks:{request:async(_name,_options,run)=>run()},fetcher:async(url,init)=>{
    if(url==='/api/client/session')return Response.json(server.login);
    assert.ok(['/api/client/reviews','/api/client/care'].includes(url));assert.equal(new Headers(init.headers).get('x-shelv-csrf'),server.login.csrf);
    const command=JSON.parse(init.body);calls.push({url,command,wire:init.body});const response=await server.respond(command,calls,url);return Response.json(response.json,{status:response.status??200});
  }});await runtime.restore();const session=runtime.getSnapshot().boundary;
  const review=createClientGuidancePort({request:createClientReviewRequest(runtime),session,mode:'client'}),ports={...createClientPorts(runtime,{care:true}),review};
  const controller=createClientPlanController(session,ports,{readVersion:3});await controller.refresh();const view=controller.getSnapshot().view;
  const hydrator=createGuidanceHydrator({view,session,mode:'client',port:review}),work=[];
  t.after(async()=>{server.release();await Promise.allSettled(work);hydrator.dispose();controller.dispose();runtime.dispose();});
  return{server,runtime,session,review,ports,controller,view,hydrator,context:{view,session,mode:'client'},calls,run(scopes){const p=hydrator.observe(scopes);work.push(p);return p;}};
}
const manifests=f=>f.calls.filter(c=>c.command.action==='read_client_instruction_manifest_v1');
const details=f=>f.calls.filter(c=>c.command.action==='read_client_instruction_v1');
test('held terminal manifest: the old loading proxy is insufficient; existing accepted state stays pending',async t=>{
  const f=await setup(t),terminal=f.server.hold('read_client_instruction_manifest_v1',{predicate:c=>c.cursor===cursor(2500)}),read=f.run([]);await terminal.entered;
  assert.equal(manifests(f).length,26);assert.equal(f.hydrator.getSnapshot().manifest,null);assert.equal(f.hydrator.getSnapshot().phase,'manifest');
  const html=renderFeature({view:f.view,session:f.session,mode:'client',ports:f.ports});
  assert.equal((html.match(/data-care-state="paused"/g)??[]).length,50);assert.doesNotMatch(html,/data-tone="loading"/);assert.equal(details(f).length,0);
  // The counterfactual changes only this source precondition, never Root/current/ports.
  const readiness=process.env.W3_MANIFEST_PROXY_CONTROL==='1'?Promise.resolve():acceptedManifest(f.hydrator,f.context);let completed=false;void readiness.then(()=>completed=true,()=>{});await Promise.resolve();
  assert.equal(completed,false,'zero loading DOM must not release the precondition while the terminal Root manifest is held');
  const same=f.run([]);assert.equal(manifests(f).filter(c=>c.command.cursor===null).length,1);
  terminal.release();await read;await same;const state=await readiness;
  assert.equal(state,f.hydrator.getSnapshot());assert.equal(state.manifest.length,2550);assert.equal(details(f).length,0);assert.equal(f.session.isCurrent(),true);assert.equal(f.controller.getSnapshot().view,f.view);
  const count=f.calls.length;await acceptedManifest(f.hydrator,f.context);assert.equal(f.calls.length,count,'observer must not fetch or refetch');
});
test('ordinary terminal acceptance is separate from the later51-detail scope and preserves all50 paused facts',async t=>{
  const f=await setup(t);await f.run([]);const before=await acceptedManifest(f.hydrator,f.context);assert.equal(before.manifest.length,2550);assert.equal(before.details.size,0);
  const hold=f.server.hold('read_client_instruction_v1',{all:true}),scopes=productInstructionScopes(f.view,'product-0'),read=f.run(scopes);await hold.entered;
  assert.equal(scopes.length,51);assert.equal((await acceptedManifest(f.hydrator,f.context)).manifest,before.manifest);assert.ok(scopes.some(s=>f.hydrator.scope(s).state==='pending'));
  hold.release();await read;assert.equal(new Set(details(f).map(c=>c.command.instructionId)).size,51);assert.ok(details(f).length<100);assert.equal(manifests(f).length,26);assert.ok(f.server.maxDetailActive<=3);assert.equal(f.view.use.planProducts.length,50);assert.ok(f.view.use.planProducts.every(p=>p.state==='paused'));
});
for(const status of [401,403])test('known HTTP'+status+' cannot become manifest readiness or a fallback read',async t=>{
  const f=await setup(t);f.server.override('read_client_instruction_manifest_v1',()=>({status,json:{code:status===401?'session_ended':'forbidden'}}),{once:true});
  const ready=acceptedManifest(f.hydrator,f.context),failure=assert.rejects(ready,e=>e.status===status);await f.run([]);await failure;
  assert.equal(f.hydrator.getSnapshot().manifest,null);assert.ok(f.calls.every(c=>['read_client_plan_v3','read_client_instruction_manifest_v1'].includes(c.command.action)));assert.equal(details(f).length,0);assert.ok(f.view.use.planProducts.every(p=>p.state==='paused'));
});
test('malformed terminal HTTP200 must pass Root collection before acceptance, never raw response readiness',async t=>{
  const f=await setup(t);f.server.override('read_client_instruction_manifest_v1',c=>{if(c.cursor!==cursor(2500))return;const good=f.server.currentDetails(c.snapshot).map(d=>d.item);const page=manifestPage(f.view,good.slice(2500,2549),c.cursor,null);mapReviewResult(page,c);return{json:page};});
  const ready=acceptedManifest(f.hydrator,f.context),failure=assert.rejects(ready,e=>e.status===503);await f.run([]);await failure;assert.equal(f.hydrator.getSnapshot().manifest,null);assert.equal(details(f).length,0);
});
test('exact view/session/mode ownership is required by the passive source observer',async t=>{
  const f=await setup(t);await f.run([]);await assert.rejects(acceptedManifest(f.hydrator,{...f.context,view:{...f.view}}),e=>e.status===503);await assert.rejects(acceptedManifest(f.hydrator,{...f.context,mode:'historical'}),e=>e.status===503);
  const count=f.calls.length;const state=await acceptedManifest(f.hydrator,f.context);assert.equal(state,f.hydrator.getSnapshot());assert.equal(count,f.calls.length);
});
