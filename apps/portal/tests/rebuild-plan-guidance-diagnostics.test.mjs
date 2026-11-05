// Pure collector/file checks. Fake observer records are not application ports or DOM evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdir, mkdtemp, readFile, readdir, symlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {budget2550TestName, createBudgetDiagnostics} from './rebuild-plan-guidance-diagnostics.mjs';
const root = fileURLToPath(new URL('../../../.local-artifacts/portal-rebuild/w3-v3-ci-telemetry-source/pure/', import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
async function directory() { await mkdir(root, {recursive:true}); return mkdtemp(path.join(root, 'case-')); }
class Page extends EventEmitter {
  url() { return 'https://shelv-v3-guidance.invalid/plan?routine=morning'; }
  async evaluate() { return {body:'instructions and reported use need review',counts:{loading:0,paused:50,notice:1,dialogs:1}}; }
  async screenshot() { return Buffer.from('89504e470d0a1a0a00000000', 'hex'); }
}
const request = (action='read_client_plan_v3', url='https://shelv-v3-guidance.invalid/api/client/reviews') => ({
  method:()=> 'POST',url:()=>url,postData:()=>JSON.stringify({schemaVersion:1,action,version:null}),
  headers:()=>{throw Error('headers must never be read');},failure:()=>({errorText:'net::ERR_ABORTED'}),
});
test('undefined opt-in and other exact names do not create or attach a collector', () => {
  const page = new Page();
  assert.equal(createBudgetDiagnostics({testName:budget2550TestName,directory:undefined}),null);
  assert.equal(createBudgetDiagnostics({testName:budget2550TestName+' other',directory:root}),null);
  assert.equal(page.eventNames().length,0);
});
test('opted observer binds actual object identities, hashes and monotonic order without awaiting delivery', async () => {
  const dir=await directory();let time=0;const d=createBudgetDiagnostics({testName:budget2550TestName,directory:dir,now:()=>++time});assert.ok(d);
  const page=new Page();d.attach(page,{browserVersion:'synthetic-observer-record'});
  const a=request(),b=request();let finishBody;const body=new Promise(r=>finishBody=r);const response={request:()=>a,status:()=>200,body:()=>body};
  assert.equal(page.emit('request',a),true);page.emit('request',b);page.emit('response',response);page.emit('requestfinished',a);page.emit('requestfailed',b);
  // This event must remain deliverable while response observation is unresolved.
  const marker=[];page.on('marker',()=>marker.push('delivered'));page.emit('marker');assert.deepEqual(marker,['delivered']);
  finishBody(Buffer.from('finite synthetic response'));
  d.routeCall({path:'/api/client/reviews',command:{schemaVersion:1,action:'read_client_plan_v3'},wire:a.postData()});
  await d.captureTerminal(page,{outcome:'fail',error:new Error('actual synthetic assertion')});page.emit('close');d.closed();const result=await d.persist();
  const trace=JSON.parse(await readFile(path.join(result.directory,'trace.json'))),state=JSON.parse(await readFile(path.join(result.directory,'state.json')));
  const req=trace.events.filter(x=>x.event==='request');assert.equal(req.length,2);assert.notEqual(req[0].id,req[1].id);assert.equal(req[0].wireHash,hash(a.postData()));
  assert.equal(trace.events.find(x=>x.event==='response').id,req[0].id);assert.equal(trace.events.find(x=>x.event==='finished').id,req[0].id);
  assert.equal(trace.events.find(x=>x.event==='response-bytes').sha256,hash('finite synthetic response'));
  assert.ok(trace.events.every((x,i,all)=>i===0||x.atMs>=all[i-1].atMs));assert.equal(trace.events.at(-1).event,'normal-closure');
  assert.equal(state.outcome,'fail');assert.equal(state.counts.paused,50);assert.equal(state.body,'instructions and reported use need review');
  assert.deepEqual((await readdir(result.directory)).sort(),['page.png','source.json','state.json','trace.json']);assert.equal(page.listenerCount('request'),0);
});
test('only fixed synthetic routes/actions are recorded and sensitive error text is redacted', async () => {
  const d=createBudgetDiagnostics({testName:budget2550TestName,directory:await directory()});assert.ok(d);const page=new Page();d.attach(page,{browserVersion:'observer'});
  for(const r of [request('read_client_plan_v3','https://private.invalid/api/client/reviews?token=PRIVATE'),request('private_action'),request('read_client_plan_v3','https://shelv-v3-guidance.invalid/api/client/reviews?token=PRIVATE')]) page.emit('request',r);
  page.emit('pageerror',new Error('Authorization: Bearer PRIVATE_CREDENTIAL'));page.emit('console',{type:()=> 'error',text:()=> 'safe synthetic error'});
  await d.captureTerminal(undefined,{outcome:'fail',error:new Error('cookie=PRIVATE_COOKIE')});d.closed();const r=await d.persist();
  const text=(await readFile(path.join(r.directory,'trace.json'),'utf8'))+(await readFile(path.join(r.directory,'state.json'),'utf8'));
  assert.doesNotMatch(text,/PRIVATE|Bearer|Authorization|PRIVATE_COOKIE|private\.invalid/);assert.equal(JSON.parse(await readFile(path.join(r.directory,'trace.json'))).events.filter(e=>e.event==='request').length,0);
  assert.match(text,/redacted/);assert.deepEqual((await readdir(r.directory)).sort(),['source.json','state.json','trace.json']);
});
test('missing failed page persists bounded state and unique per-run directories', async () => {
  const dir=await directory(),paths=[];
  for(let i=0;i<2;i++){const d=createBudgetDiagnostics({testName:budget2550TestName,directory:dir});assert.ok(d);await d.captureTerminal(null,{outcome:'fail',error:new Error('setup failed')});d.closed();const r=await d.persist();paths.push(r.directory);const s=JSON.parse(await readFile(path.join(r.directory,'state.json')));assert.equal(s.pageAvailable,false);assert.equal(s.outcome,'fail');assert.equal(path.dirname(r.directory),dir);}
  assert.notEqual(paths[0],paths[1]);
});
test('relative/traversing paths and symlink destinations fail closed without external writes', async () => {
  assert.throws(()=>createBudgetDiagnostics({testName:budget2550TestName,directory:'relative'}),/absolute/);
  assert.throws(()=>createBudgetDiagnostics({testName:budget2550TestName,directory:root+'/../escape'}),/normalized/);
  const dir=await directory(),outside=await directory();await symlink(outside,path.join(dir,'link'));
  const d=createBudgetDiagnostics({testName:budget2550TestName,directory:path.join(dir,'link')});assert.ok(d);await assert.rejects(d.persist(),/symlink/);assert.deepEqual(await readdir(outside),[]);
});
test('prepared and served bundle hashes bind original buffers while unknown files are rejected', async () => {
  const d=createBudgetDiagnostics({testName:budget2550TestName,directory:await directory()});assert.ok(d);const bytes=Buffer.from('actual prepared output'),files=new Map([['rebuild-plan-guidance-browser-entry.js',bytes]]);
  d.prepared({files,inputs:{},workingDirectory:fileURLToPath(new URL('../',import.meta.url))});
  d.served('rebuild-plan-guidance-browser-entry.js',bytes);d.served('../private.env',Buffer.from('PRIVATE_SOURCE'));
  await d.captureTerminal(null,{outcome:'pass'});d.closed();const r=await d.persist(),source=JSON.parse(await readFile(path.join(r.directory,'source.json')));
  assert.equal(source.outputs[0].sha256,hash(bytes));assert.equal(source.served[0].sha256,source.outputs[0].sha256);assert.equal(source.served[0].matchesPrepared,true);assert.equal(source.served.length,1);assert.match(source.sourceHead,/^[0-9a-f]{40}$/);assert.doesNotMatch(JSON.stringify(source),/PRIVATE_SOURCE|private\.env/);
});
test('event/body/response limits are bounded without mutating observed records', async () => {
  const d=createBudgetDiagnostics({testName:budget2550TestName,directory:await directory()});assert.ok(d);const page=new Page();d.attach(page);
  page.evaluate=async()=>({body:'x'.repeat(130000),counts:{loading:0,paused:50,notice:0,dialogs:1}});
  const first=Object.freeze(request());page.emit('request',first);for(let i=1;i<300;i++)page.emit('request',Object.freeze(request()));
  page.emit('response',{request:()=>first,status:()=>200,body:async()=>Buffer.alloc(1800001)});
  const r=Object.freeze(request());page.emit('request',r);d.routeCall({path:'/api/client/reviews',command:{action:'record_decision_v2'},wire:r.postData()});
  await d.captureTerminal(page,{outcome:'fail'});d.closed();const result=await d.persist();const trace=JSON.parse(await readFile(path.join(result.directory,'trace.json'))),state=JSON.parse(await readFile(path.join(result.directory,'state.json')));
  assert.equal(trace.events.filter(e=>e.event==='request').length,256);assert.ok(trace.dropped>=44);assert.equal(trace.events.filter(e=>e.event==='route-call').length,0);assert.equal(state.body.length,120000);assert.equal(trace.events.find(e=>e.event==='response-bytes').oversize,true);
});
test('real write:false source preparation binds compiled inputs/outputs without browser execution', async () => {
  const {prepareGuidanceBrowserSource}=await import('./rebuild-plan-guidance-browser.mjs');
  const d=createBudgetDiagnostics({testName:budget2550TestName,directory:await directory()});assert.ok(d);
  const files=await prepareGuidanceBrowserSource({budgetDiagnostics:d});const bytes=files.get('rebuild-plan-guidance-browser-entry.js');d.served('rebuild-plan-guidance-browser-entry.js',bytes);
  await d.captureTerminal(null,{outcome:'pass'});d.closed();const result=await d.persist(),source=JSON.parse(await readFile(path.join(result.directory,'source.json')));
  assert.ok(source.inputs.length>0);assert.ok(source.inputs.some(i=>i.path==='apps/portal/src/features/plan/guidanceHydration.ts'));assert.equal(source.outputs.find(o=>o.name==='rebuild-plan-guidance-browser-entry.js').sha256,hash(bytes));assert.equal(source.served[0].matchesPrepared,true);assert.match(source.inputHash,/^[0-9a-f]{64}$/);
});
test('sensitive visible text is redacted and cannot be copied into a PNG', async () => {
  const d=createBudgetDiagnostics({testName:budget2550TestName,directory:await directory()});assert.ok(d);const page=new Page();let screenshots=0;
  page.evaluate=async()=>({body:'safe synthetic line\nauthorization: Bearer PRIVATE_VALUE',counts:{loading:0,paused:50,notice:0,dialogs:1}});page.screenshot=async()=>{screenshots++;throw Error('must not capture sensitive text');};
  await d.captureTerminal(page,{outcome:'fail'});d.closed();const r=await d.persist();const state=JSON.parse(await readFile(path.join(r.directory,'state.json')));
  assert.equal(screenshots,0);assert.equal(state.body,'safe synthetic line\n[redacted sensitive line]');assert.deepEqual((await readdir(r.directory)).sort(),['source.json','state.json','trace.json']);assert.doesNotMatch(JSON.stringify(state),/PRIVATE_VALUE|Bearer/);
});
