import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';
import {mayaPlan} from './rebuild/plan-fixture.mjs';
import {parseRoute} from '../src/navigation/routes.ts';
const portal=fileURLToPath(new URL('../',import.meta.url)),repo=path.resolve(portal,'../..'),artifacts=path.join(repo,'.local-artifacts/portal-rebuild/w3-recovery/browser');
const origin='http://shelv-plan.invalid';let browser,files;
const sourceAssets=new Map(mayaPlan().plan.content.products.flatMap(p=>p.imageUrl?[[p.imageUrl,path.join(portal,'site',new URL(p.imageUrl).pathname)]]:[]));
before(async()=>{await fs.mkdir(artifacts,{recursive:true});const result=await build({absWorkingDir:portal,entryPoints:['tests/rebuild/plan-browser-entry.tsx'],outdir:artifacts,tsconfig:'tsconfig.frontend.json',bundle:true,format:'esm',write:false,loader:{'.woff2':'file','.woff':'file'},assetNames:'fonts/[name]-[hash]'});files=new Map(result.outputFiles.map(f=>[f.path,Buffer.from(f.contents)]));browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});});
after(async()=>browser?.close());
async function setup(initial='/plan',width=1440){const context=await browser.newContext({viewport:{width,height:960},serviceWorkers:'block'}),errors=[],unexpected=[];await context.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(req.method()==='GET'&&sourceAssets.has(req.url()))return route.fulfill({body:await fs.readFile(sourceAssets.get(req.url())),contentType:({'.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'})[path.extname(sourceAssets.get(req.url()))]});if(url.origin!==origin||req.method()!=='GET'){unexpected.push(req.method()+' '+url.pathname);return route.abort();}if(parseRoute(url.pathname+url.search))return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/plan-browser-entry.css"><div id="root"></div><script type="module" src="/plan-browser-entry.js"></script></html>'});if(url.pathname==='/assets/cerave.png'||url.pathname==='/assets/azelaic.png')return route.fulfill({contentType:'image/png',body:await fs.readFile(path.join(repo,'docs/portal-rebuild/design/assets',url.pathname.includes('cerave')?'C03-imgProductPhoto.png':'C02-imgProductPhoto.png'))});const file=path.resolve(artifacts,'.'+url.pathname);if(!file.startsWith(artifacts+path.sep)||!files.has(file)){unexpected.push(url.pathname);return route.abort();}return route.fulfill({body:files.get(file),contentType:({'.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff'})[path.extname(file)]});});const page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto(origin+initial,{waitUntil:'domcontentloaded',timeout:10000});await page.evaluate(()=>document.fonts.ready);return {page,async close(){await context.close();assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);}};}


const recommendation={name:'recommendation',decisionId:'maya-card-treatments',routine:'morning'};
const retry=p=>p.getByRole('button',{name:'retry latest plan',exact:true});
const ack=p=>p.getByRole('button',{name:'i’ve reviewed this plan',exact:true});
const ledger=p=>p.evaluate(()=>JSON.stringify([...window.__planHarness.memory]));
async function startConflict(p){
 await p.getByRole('button',{name:'approve product',exact:true}).waitFor();
 await p.evaluate(()=>{const h=window.__planHarness,v=h.getView();v.plan.version=2;v.decisionRevision=4;v.plan.content.summary='CURRENT_FETCHED_PLAN';h.status=409;h.readStatus=503;h.readView=v;});
 await p.getByRole('button',{name:'approve product',exact:true}).click();
 await p.getByText('plan changed',{exact:true}).waitFor();
 await p.getByRole('button',{name:'back to plan',exact:true}).click();
 await p.getByRole('heading',{name:'your current routine'}).waitFor();
 await p.evaluate(()=>{const h=window.__planHarness;h.readStatus=0;h.readDelay=true;});
 await retry(p).click();
 await p.waitForFunction(()=>!!window.__planHarness.resolveRead);
 await p.evaluate(()=>{const h=window.__planHarness;h.oldResolve=h.resolveRead;h.original=h.getRenderView();});
 assert.equal(await ack(p).isDisabled(),true);
}
async function supersede(p,transition='active'){
 await p.evaluate(transition=>{const h=window.__planHarness,v=h.getView();if(transition==='mode')h.set({mode:'private-walkthrough'});else if(transition==='read-only')h.set({view:{...v,access:'read_only'}});else{v.plan.content.summary='NEW_ENCLOSING_CONTEXT';h.set({view:v});}},transition);
 if(transition==='mode')await p.locator('.shelv-shell[data-mode="private-walkthrough"]').waitFor();
 else if(transition==='read-only')await p.getByText('read-only plan',{exact:true}).first().waitFor();
 else await p.getByText('NEW_ENCLOSING_CONTEXT',{exact:true}).waitFor();
 if(transition!=='active'){
  await p.evaluate(()=>{const h=window.__planHarness;h.set({mode:'client',view:h.original});});
  await p.locator('.shelv-shell[data-mode="client"]').waitFor();
  if(transition==='read-only')await p.getByText('read-only plan',{exact:true}).waitFor({state:'hidden'});
 }
 await retry(p).waitFor();assert.equal(await retry(p).isEnabled(),true);
 assert.equal(await ack(p).isDisabled(),true);
}
async function currentRead(p,{pending=false,failed=false}={}){
 await p.evaluate(({pending,failed})=>{const h=window.__planHarness;h.readDelay=pending;h.readStatus=failed?503:0;delete h.resolveRead;},{pending,failed});
 const before=await p.evaluate(()=>window.__planHarness.reads.length);
 await retry(p).click();
 assert.equal(await p.evaluate(()=>window.__planHarness.reads.length),before+1,'current enabled retry must start without waiting for the obsolete promise');
 if(pending){await p.waitForFunction(()=>!!window.__planHarness.resolveRead);await p.evaluate(()=>{const h=window.__planHarness;h.newResolve=h.resolveRead;});}
 else if(failed)await p.getByText('latest plan unavailable',{exact:true}).waitFor();
 else await p.getByText('CURRENT_FETCHED_PLAN',{exact:true}).waitFor();
}
async function finishReview(p){
 assert.equal(await p.getByText('plan changed',{exact:true}).count(),1);
 assert.equal(await ack(p).isEnabled(),true);
 assert.equal(await p.evaluate(()=>window.__planHarness.calls.length),1,'fetch must never replay the rejected write');
 await p.evaluate(()=>window.__planHarness.readDelay=false);
 await ack(p).click();await p.getByText('plan changed',{exact:true}).waitFor({state:'hidden'});
 assert.equal(await p.evaluate(()=>window.__planHarness.calls.length),1,'deliberate review only reads');
}

// These cases catch a context-blind busy flag, accepting obsolete reads to free
// it, or an old finally releasing a newer operation's busy/loading ownership.
for(const transition of ['active','read-only'])test('R3-1 '+transition+' current retry and deliberate review complete while obsolete read never resolves',async()=>{
 const f=await setup('/plan/recommendations/maya-card-treatments');try{const p=f.page;
 await startConflict(p);await supersede(p,transition);await currentRead(p,{pending:true});
 assert.equal(await ack(p).isDisabled(),true);assert.equal(await p.evaluate(()=>window.__planHarness.applied.length),0);
 assert.equal(await p.getByText('plan changed',{exact:true}).count(),1);
 await p.evaluate(()=>window.__planHarness.newResolve());await p.getByText('CURRENT_FETCHED_PLAN',{exact:true}).waitFor();
 // The acknowledgement itself must actually reread before unlocking.
 await p.evaluate(()=>{const h=window.__planHarness;delete h.resolveRead;});
 await ack(p).click();await p.waitForFunction(()=>!!window.__planHarness.resolveRead);
 assert.equal(await p.getByText('plan changed',{exact:true}).count(),1);assert.equal(await p.evaluate(()=>window.__planHarness.calls.length),1);
 await p.evaluate(()=>window.__planHarness.resolveRead());await p.getByText('plan changed',{exact:true}).waitFor({state:'hidden'});
 await p.evaluate(route=>{const h=window.__planHarness;h.status=0;h.readDelay=false;delete h.readView;h.navigator.navigate(route);},recommendation);
 await p.getByRole('button',{name:'decline',exact:true}).click();await p.getByText('choice recorded',{exact:true}).waitFor();
 const calls=await p.evaluate(()=>window.__planHarness.calls);assert.equal(calls.length,2);assert.equal(calls[1].publicationVersion,2);assert.equal(calls[1].expectedDecisionRevision,4);assert.equal(calls[1].choice,'declined');assert.notEqual(calls[1].requestId,calls[0].requestId);
 }finally{await f.close();}
});
for(const timing of ['before','during','after'])test('R3-1 old finally '+timing+' current read cannot apply or release newer ownership',async()=>{
 const f=await setup('/plan/recommendations/maya-card-treatments');try{const p=f.page;
 await startConflict(p);await supersede(p);
 if(timing==='before'){const memory=await ledger(p);await p.evaluate(()=>window.__planHarness.oldResolve());assert.equal(await p.evaluate(()=>window.__planHarness.applied.length),0);assert.equal(await ledger(p),memory);}
 await currentRead(p,{pending:true});
 if(timing==='during'){
  const memory=await ledger(p);await p.evaluate(()=>window.__planHarness.oldResolve());assert.equal(await p.evaluate(()=>window.__planHarness.applied.length),0);assert.equal(await ledger(p),memory);
  const count=await p.evaluate(()=>window.__planHarness.reads.length);assert.equal(await retry(p).isDisabled(),true);
  // Deliver a duplicate event directly: the real handler must retain the new lock.
  await retry(p).dispatchEvent('click');assert.equal(await p.evaluate(()=>window.__planHarness.reads.length),count);
 }
 await p.evaluate(()=>window.__planHarness.newResolve());await p.getByText('CURRENT_FETCHED_PLAN',{exact:true}).waitFor();
 if(timing==='after'){const memory=await ledger(p);await p.evaluate(()=>window.__planHarness.oldResolve());assert.equal(await p.evaluate(()=>window.__planHarness.applied.length),1);assert.equal(await ledger(p),memory);}
 await finishReview(p);assert.equal(await p.evaluate(()=>window.__planHarness.applied.length),2);
 }finally{await f.close();}
});
test('R3-1 failing current read releases only itself and can retry while obsolete read remains pending',async()=>{
 const f=await setup('/plan/recommendations/maya-card-treatments');try{const p=f.page;
 await startConflict(p);await supersede(p);await currentRead(p,{failed:true});
 assert.equal(await ack(p).isDisabled(),true);assert.equal(await p.evaluate(()=>window.__planHarness.applied.length),0);
 await currentRead(p);await finishReview(p);assert.equal(await p.evaluate(()=>window.__planHarness.calls.length),1);
 }finally{await f.close();}
});
test('R3-1 mode roundtrip retires pending read without applying it or changing the client ledger',async()=>{
 const f=await setup('/plan/recommendations/maya-card-treatments');try{const p=f.page;
 await startConflict(p);const memory=await ledger(p);await supersede(p,'mode');
 await p.evaluate(()=>window.__planHarness.oldResolve());assert.equal(await ledger(p),memory);assert.equal(await p.evaluate(()=>window.__planHarness.applied.length),0);
 await currentRead(p);await finishReview(p);
 }finally{await f.close();}
});
test('R3-1 logout clears intent and rejects old read without restoring private content',async()=>{
 const f=await setup('/plan/recommendations/maya-card-treatments');try{const p=f.page;
 await startConflict(p);await p.evaluate(()=>window.__planHarness.invalidate());await p.getByText('session changed',{exact:true}).waitFor();
 await p.evaluate(()=>window.__planHarness.oldResolve());assert.equal(await p.evaluate(()=>window.__planHarness.applied.length),0);assert.equal(await p.evaluate(()=>window.__planHarness.memory.size),0);assert.equal(await p.locator('.plan-view').count(),0);assert.equal(await p.evaluate(()=>window.__planHarness.calls.length),1);
 }finally{await f.close();}
});
test('R3-1 session replacement permits new recovery while the old session read remains fenced',async()=>{
 const f=await setup('/plan/recommendations/maya-card-treatments');try{const p=f.page;
 await startConflict(p);await p.evaluate(()=>window.__planHarness.replace());await p.getByText('plan changed',{exact:true}).waitFor({state:'hidden'});
 await p.evaluate(route=>{const h=window.__planHarness;h.readDelay=false;h.navigator.navigate(route);},recommendation);
 await p.getByRole('button',{name:'decline',exact:true}).waitFor();assert.equal(await p.getByRole('button',{name:'decline',exact:true}).isEnabled(),true);
 await p.evaluate(()=>window.__planHarness.oldResolve());assert.equal(await p.evaluate(()=>window.__planHarness.applied.length),0);assert.equal(await p.evaluate(()=>window.__planHarness.memory.size),0);assert.equal(await p.evaluate(()=>window.__planHarness.calls.length),1);
 }finally{await f.close();}
});
