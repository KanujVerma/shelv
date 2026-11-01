import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
import {checkStyles} from '../scripts/check-ui-system.mjs';
const root=new URL('../src/features/walkthrough/maya/',import.meta.url);
test('the owned demo closure has no endpoint, credential, storage, private input or live session construction',async()=>{
  const {inputs,code,metafile}=await sourceModule('src/features/walkthrough/maya/index.ts');
  assert.equal(inputs.some(f=>/session-integration|\/app\/|private-walkthrough|backend\/|supabase\/|\/server\//.test(f)),false);
  // Actual shared guidance imports TransportError from this source file. Input
  // membership is not factory reachability: check the actual emitted closure.
  assert.deepEqual(inputs.filter(f=>/\/transport\//.test(f)),['src/transport/session.ts']);
  assert.ok(Object.values(metafile.outputs).some(o=>o.inputs['src/transport/session.ts']?.bytesInOutput>0));
  assert.match(code,/class extends Error|class TransportError/);
  assert.doesNotMatch(code,/createSessionTransport|createCookieOperationPort|createCookieRequestFactory|createApplicationSession|document\.cookie|\/api\/|fetch\(/);
  assert.deepEqual(inputs.filter(f=>f.includes('site/')).sort(),['site/advisor/maya-sample.js','site/advisor/presentation-model.js','site/auth/portal-routes.js']);
  for(const filename of await readdir(root)){
    const source=await readFile(new URL(filename,root),'utf8');
    assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\s*[.(]|document\.cookie|createApplicationSession|createClientSession|\b(?:Authorization|Bearer)\s*[:=]|PRIVATE_REAL_AUTH_CANARY|PRIVATE_SOURCE_CANARY|\/api\/|process\.env/);
    assert.doesNotMatch(source,/<(?:button|input|select|textarea)\b|dangerouslySetInnerHTML|text-transform\s*:/);
    if(filename.endsWith('.css'))assert.deepEqual(checkStyles({[filename]:source}),[]);
  }
});
test('actual SSR and every deliberate memory action execute with network/storage traps and produce no automatic resource loads',async()=>{
  const priorFetch=globalThis.fetch,priorLocal=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),priorSession=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');let effects=0;
  const denied=()=>{effects++;throw Error('outside demo memory');};globalThis.fetch=denied;
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get:denied});Object.defineProperty(globalThis,'sessionStorage',{configurable:true,get:denied});
  try{
    const {exports:{createMayaDemoController,renderMaya}}=await sourceModule('tests/rebuild-maya-five-stage-ssr.ts');
    const c=createMayaDemoController();for(let stage=1;stage<=5;stage++){c.selectStage(stage);assert.doesNotMatch(renderMaya(c),/<(?:img|iframe|script)\b|<link[^>]+rel="(?:preload|preconnect)"/);}
    c.selectStage(2);const p=c.getPlanProps();await p.demoPorts.decision.execute({schemaVersion:1,action:'record_decision_v1',requestId:'ec000000-0000-4000-8000-000000000900',publicationVersion:1,expectedDecisionRevision:0,decisionId:'maya-card-treatments',choice:'deferred',reason:null});const v=await p.demoPorts.read.execute({schemaVersion:1,action:'read_client_plan_v1',version:null});p.onViewChange(v);c.receiveExample();c.reportExample('started-known');c.reportExample('stopped-unknown');c.exit();c.reopen();c.explore();c.replay();c.reset();c.dispose();assert.equal(effects,0);
  }finally{globalThis.fetch=priorFetch;if(priorLocal)Object.defineProperty(globalThis,'localStorage',priorLocal);else delete globalThis.localStorage;if(priorSession)Object.defineProperty(globalThis,'sessionStorage',priorSession);else delete globalThis.sessionStorage;}
});
test('ordinary shared buttons wire each guide action and keep Escape/focus handling local to the guide',async()=>{
  const source=await readFile(new URL('view.tsx',root),'utf8');for(const action of ['back','next','exit','explore','reopen','collapse','replay','reset'])assert.ok(source.includes('onClick={controller.'+action+'}'),action);assert.match(source,/event.key==='Escape'/);assert.match(source,/aria-labelledby="maya-guide-heading"/);assert.match(source,/tabIndex=\{-1\}/);assert.match(source,/heading.current\?\.focus/);assert.match(source,/launcher.current\?\.focus/);assert.doesNotMatch(source,/addEventListener|removeEventListener/);
});
