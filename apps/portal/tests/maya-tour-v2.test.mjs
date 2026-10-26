import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const site=path.resolve(fileURLToPath(new URL('../site/',import.meta.url))),origin='http://localhost';
const artifacts=path.resolve(process.env.MAYA_TOUR_ARTIFACTS||fileURLToPath(new URL('../../../.local-artifacts/maya-tour-v2/qa/',import.meta.url)));
const visibleTour='.maya-tour-welcome[open],.maya-tour-popover,.maya-tour-pointer,.maya-tour-highlight';
const privateFixture=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/advisor/workspace.css"><link rel="stylesheet" href="/walkthrough/guide.css"><main id="viewer"></main><script type="module">
import {mountWalkthroughViewer} from '/walkthrough/viewer.js';
import {createApprovedAlexPresentation} from '/advisor/presentation-fixtures.js';
const snapshot={schemaVersion:1,caseId:'ef000000-0000-4000-8000-000000000001',versionId:'ef000000-0000-4000-8000-000000000002',presentation:createApprovedAlexPresentation(),stages:[{id:'overview',title:'Synthetic private guide',section:'plan',day:'2026-10-20',body:'A generic local fixture.',messages:[]},{id:'next',title:'Synthetic next stop',section:'routine',day:'2026-10-21',body:'A generic routine.',messages:[]}]};
mountWalkthroughViewer(document.querySelector('#viewer'),{snapshot,authorize:async()=>snapshot});
</script>`;
let browser;
before(async()=>{
 await fs.mkdir(artifacts,{recursive:true});
 browser=await chromium.launch({channel:'chrome',headless:process.env.PORTAL_TEST_HEADED!=='1',args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});
});
after(async()=>browser?.close());

async function localContext({width=390,height=900,reducedMotion='no-preference',blockedStorage=false}={}){
 const context=await browser.newContext({viewport:{width,height},reducedMotion,serviceWorkers:'block'});
 await context.setOffline(true);const unexpected=[],errors=[];
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.origin!==origin||request.method()!=='GET'){unexpected.push(`${request.method()} ${url.origin}${url.pathname}`);return route.abort();}
  if(url.pathname==='/synthetic-private-viewer')return route.fulfill({body:privateFixture,contentType:'text/html'});
  const file=path.resolve(site,'.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(site+path.sep)){unexpected.push(url.pathname);return route.abort();}
  try{return route.fulfill({body:await fs.readFile(file),contentType:({'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'});}
  catch{return route.fulfill({status:404,body:''});}
 });
 if(blockedStorage)await context.addInitScript(()=>{for(const key of ['localStorage','sessionStorage'])Object.defineProperty(window,key,{get(){throw new DOMException('Storage disabled for local QA','SecurityError');}});});
 const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',error=>errors.push(error.message));
 return {context,page,assertSafe(){assert.deepEqual(errors,[],'No uncaught browser error');assert.deepEqual(unexpected,[],'All requests stay local, read-only and synthetic');}};
}
async function fixture(options,run){const env=await localContext(options);try{await run(env.page,env);env.assertSafe();}catch(error){
 await env.page.screenshot({path:path.join(artifacts,`failure-${options.width||390}.png`)}).catch(()=>{});
 await fs.writeFile(path.join(artifacts,`failure-${options.width||390}.json`),JSON.stringify(await env.page.evaluate(()=>{const rect=e=>{const r=e?.getBoundingClientRect();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null;};return {url:location.pathname+location.search+location.hash,heading:document.querySelector('.maya-tour-popover h2')?.textContent,popup:rect(document.querySelector('.maya-tour-popover')),target:rect(document.querySelector('.maya-tour-target')),targetKey:document.querySelector('.maya-tour-target')?.dataset.tourTarget,highlight:rect(document.querySelector('.maya-tour-highlight')),highlightHidden:document.querySelector('.maya-tour-highlight')?.hidden,scrollY,viewport:{width:innerWidth,height:innerHeight}};}).catch(()=>({})),null,2)+'\n');
 throw error;
}finally{await env.context.close();}}
const welcome=page=>page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'See how Shelv works',exact:true})});
const popup=page=>page.getByRole('region').filter({has:page.getByRole('button',{name:'Back',exact:true})});
async function ready(page,url='/maya/?guided=1'){await page.goto(origin+url);await page.locator('[data-presentation-card]').first().waitFor();}
async function start(page){await welcome(page).getByRole('button',{name:'Start tour',exact:true}).click();await popup(page).waitFor();}
async function stage(page,index){
 const current=popup(page);await current.getByText(new RegExp(`(?:^| · )Step ${index+1} of 7$`)).waitFor();assert.equal(await page.getByRole('button',{name:'View tour',exact:true}).isVisible(),false,'The replay launcher stays quiet until the tour closes');return current;
}
async function next(page,index){await (await stage(page,index)).getByRole('button',{name:'Next',exact:true}).click();await stage(page,index+1);}
async function noTour(page){
 await page.waitForFunction(selector=>document.querySelectorAll(selector).length===0,visibleTour);
 assert.equal(await page.locator('.walkthrough-guide').count(),0,'Exit removes the permanent guide column');
 assert.equal(await page.getByRole('button',{name:'View tour',exact:true}).count(),1,'One quiet replay launcher remains');
 assert.equal(await page.getByRole('button',{name:'View tour',exact:true}).isVisible(),true);
 assert.equal(await page.getByRole('button',{name:'View tour',exact:true}).evaluate(e=>e.classList.contains('quiet')),true);
 const geometry=await page.locator('.walkthrough-portal').evaluate(el=>{const p=el.getBoundingClientRect(),s=el.parentElement.getBoundingClientRect();return {left:p.left-s.left,width:p.width,shellWidth:s.width};});
 assert.ok(Math.abs(geometry.left)<=1&&Math.abs(geometry.width-geometry.shellWidth)<=2,JSON.stringify(geometry));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
}
async function stored(page){return page.evaluate(()=>({local:Object.fromEntries(Object.entries(localStorage)),session:Object.fromEntries(Object.entries(sessionStorage))}));}
function assertGenericStorage(state){
 for(const [kind,entries] of Object.entries(state))for(const [key,value] of Object.entries(entries)){
  assert.match(key,/tour/i,`${kind} key is a generic tour preference`);
  assert.match(value,/^(?:1|0|true|false|seen|active|closed|welcome|resume)$/i,`${kind} persists only a UI flag: ${key}`);
  assert.doesNotMatch(key+value,/maya|ec000000|caseId|versionId|access|capability|skin|health|ingredient|answer|azelaic|treatment/i);
 }
}

test('fresh guided Maya starts with a company welcome and an optional seven-stop tour',()=>fixture({},async page=>{
 await ready(page);const intro=welcome(page);await intro.waitFor();
 assert.equal(await page.getByRole('button',{name:'View tour',exact:true}).isVisible(),false);
 assert.equal(await popup(page).count(),0);assert.equal(await page.locator('.walkthrough-guide').count(),0);
 await intro.getByRole('button',{name:'Explore on my own',exact:true}).waitFor();await intro.getByRole('button',{name:'Close tour',exact:true}).waitFor();
 assert.match(await intro.innerText(),/Shelv|\bwe\b/i);assert.doesNotMatch(await intro.innerText(),/Kanuj researches|medical advice|guaranteed/i);
 await start(page);await stage(page,0);assert.equal(await (await stage(page,0)).getByRole('button',{name:'Back',exact:true}).isDisabled(),true);
 await next(page,0);await (await stage(page,1)).getByRole('button',{name:'Back',exact:true}).click();await stage(page,0);
 assertGenericStorage(await stored(page));
}));

test('dismissal persists in this browser, replay is explicit, Exit clears history and browser Back stays closed',()=>fixture({},async(page,env)=>{
 await ready(page);await welcome(page).getByRole('button',{name:'Explore on my own',exact:true}).click();await noTour(page);
 await ready(page);await noTour(page);assert.equal(await page.getByRole('heading',{name:'See how Shelv works',exact:true}).count(),0);
 const another=await env.context.newPage();await ready(another);await noTour(another);await another.close();
 await page.getByRole('button',{name:'View tour',exact:true}).click();await welcome(page).waitFor();await welcome(page).getByRole('button',{name:'Close tour',exact:true}).click();await noTour(page);
 await page.getByRole('button',{name:'View tour',exact:true}).click();await welcome(page).waitFor();await start(page);await next(page,0);await next(page,1);
 await (await stage(page,2)).getByRole('button',{name:'Exit tour',exact:true}).first().click();await noTour(page);
 assert.equal(new URLSearchParams(new URL(page.url()).hash.slice(1)).has('step'),false);
 await page.goBack();await noTour(page);assert.equal(await popup(page).count(),0);
 await page.reload();await page.locator('[data-presentation-card]').first().waitFor();await noTour(page);
 await page.getByRole('button',{name:'View tour',exact:true}).click();await welcome(page).waitFor();await page.keyboard.press('Escape');await noTour(page);
 assertGenericStorage(await stored(page));
 const fresh=await localContext();try{await ready(fresh.page);await welcome(fresh.page).waitFor();fresh.assertSafe();}finally{await fresh.context.close();}
}));

test('an active same-tab reload resumes its stop and Exit preserves unrelated fragment values',()=>fixture({},async page=>{
 await ready(page,'/maya/?guided=1#visitor=synthetic-marker');await start(page);await next(page,0);await next(page,1);await next(page,2);
 const title=await (await stage(page,3)).getByRole('heading').innerText();await page.reload();await page.locator('.walkthrough-portal').waitFor();
 assert.equal(await (await stage(page,3)).getByRole('heading').innerText(),title);assert.equal(await welcome(page).count(),0);
 await (await stage(page,3)).getByRole('button',{name:'Exit tour',exact:true}).first().click();await noTour(page);
 const hash=new URLSearchParams(new URL(page.url()).hash.slice(1));assert.equal(hash.get('visitor'),'synthetic-marker');for(const key of ['step','explore','tour'])assert.equal(hash.has(key),false);
}));

test('real overview and product interactions remain optional, and the finish leaves a safe usable portal',()=>fixture({width:1440},async page=>{
 await ready(page);await start(page);
 const interactions=await page.evaluate(async()=>{const {mayaTourConfiguration,createGuidedMayaSnapshot}=await import('/walkthrough/maya.js');return createGuidedMayaSnapshot().stages.map(stage=>({id:stage.id,...mayaTourConfiguration.steps[stage.id]}));});
 let opened=0;
 for(let index=0;index<7;index++){
  const callout=await stage(page,index),interaction=interactions[index].interaction;
  if(interaction&&/open-overview|open-keep-card|open-treatment-card|open-routine-product/.test(interaction.action)){
   await callout.getByRole('button',{name:interaction.label,exact:true}).click();const dialog=page.locator('dialog.client-dialog[open]');await dialog.waitFor();
   assert.ok((await dialog.getByRole('heading').count())>0);if(interaction.action==='open-overview')await dialog.getByRole('heading',{name:'Plan overview',exact:true}).waitFor();
   await dialog.getByRole('button',{name:'Close dialog',exact:true}).click();opened++;
  }
  if(index<6)await next(page,index);else await callout.getByRole('button',{name:'Finish tour',exact:true}).click();
 }
 assert.ok(opened>=2,'The actual tour offers at least overview and product inspection');
 await noTour(page);
 await page.getByRole('button',{name:'Payments',exact:true}).click();await page.locator('.shelv-payments[aria-busy=false]').waitFor();
 assert.match(await page.locator('.walkthrough-portal').innerText(),/Nothing is charged or sent/);
 assert.equal(await page.locator('input[type=file],.payment-selected-recipient,a[href*="cash.app"],img[alt*="QR"]').count(),0);
 await page.getByRole('button',{name:'Check-ins',exact:true}).click();await page.locator('.shelv-checkins[aria-busy=false]').waitFor();assert.equal(await page.locator('.shelv-checkins textarea,.shelv-checkins input[type=file],.checkin-photo').count(),0);
 assertGenericStorage(await stored(page));
}));

test('blocked browser storage still permits welcome, progress, Escape and exploration',()=>fixture({blockedStorage:true,reducedMotion:'reduce'},async page=>{
 await ready(page);await welcome(page).waitFor();await start(page);await next(page,0);await page.keyboard.press('Escape');await noTour(page);
 await page.getByRole('button',{name:'Plan overview',exact:true}).click();await page.locator('dialog.client-dialog[open]').getByRole('heading',{name:'Plan overview',exact:true}).waitFor();await page.keyboard.press('Escape');
}));

test('an optional real dialog keeps Next usable and closing it restores the original anchor',()=>fixture({width:390},async page=>{
 await ready(page);await start(page);const originalKey=await page.locator('.maya-tour-target').getAttribute('data-tour-target');
 const label=await page.evaluate(async()=>{const {mayaTourConfiguration}=await import('/walkthrough/maya.js');return mayaTourConfiguration.steps['meet-maya'].interaction.label;});
 await (await stage(page,0)).getByRole('button',{name:label,exact:true}).click();await page.locator('dialog.client-dialog[open]').waitFor();
 assert.equal(await page.locator('.maya-tour-popover').evaluate(e=>Boolean(e.closest('dialog[open]'))),true,'The callout enters its owned real dialog so its controls stay usable');
 await page.screenshot({path:path.join(artifacts,'maya-390-overview-dialog.png')});
 await page.locator('dialog.client-dialog[open]').getByRole('button',{name:'Close dialog',exact:true}).click();await stage(page,0);
 assert.equal(await page.locator('.maya-tour-target').getAttribute('data-tour-target'),originalKey,'Close dialog restores the portal target');
 await (await stage(page,0)).getByRole('button',{name:label,exact:true}).click();await page.locator('dialog.client-dialog[open]').waitFor();await next(page,0);assert.equal(await page.locator('dialog.client-dialog[open]').count(),0);
}));

test('tour Next remains usable after an ingredient drilldown replaces the owned product dialog',()=>fixture({width:1440},async page=>{
 await ready(page);await start(page);await next(page,0);
 const label=await page.evaluate(async()=>{const {mayaTourConfiguration}=await import('/walkthrough/maya.js');return mayaTourConfiguration.steps['plan-reasoning'].interaction.label;});
 await (await stage(page,1)).getByRole('button',{name:label,exact:true}).click();const dialog=page.locator('dialog.client-dialog[open]');await dialog.waitFor();
 await dialog.getByText('Full ingredient list',{exact:true}).click();await dialog.getByRole('button',{name:/Learn more about AVOBENZONE/i}).click();await dialog.getByRole('heading',{name:/Avobenzone/i}).waitFor();
 await page.waitForFunction(()=>Boolean(document.querySelector('.maya-tour-popover')?.closest('dialog.client-dialog[open]')));
 await page.screenshot({path:path.join(artifacts,'maya-1440-ingredient-dialog.png')});await next(page,1);assert.equal(await page.locator('dialog.client-dialog[open]').count(),0);
}));

test('ordinary Maya and Alex keep their shared fonts and never auto-start this tour',()=>fixture({width:1440},async page=>{
 const fonts=()=>page.evaluate(()=>Object.fromEntries([['body',document.body],['heading',document.querySelector('header h1')],['button',document.querySelector('#download-plan')]].map(([key,el])=>[key,getComputedStyle(el).fontFamily])));
 await ready(page,'/maya/');assert.equal(await page.locator(visibleTour).count(),0);assert.equal(await page.getByRole('button',{name:'View tour',exact:true}).count(),0);const maya=await fonts();
 await ready(page,'/?preview=1&state=unapproved#/client');assert.equal(await page.locator(visibleTour).count(),0);assert.equal(await page.getByRole('button',{name:'View tour',exact:true}).count(),0);assert.deepEqual(await fonts(),maya);
 await ready(page);await welcome(page).getByRole('button',{name:'Explore on my own',exact:true}).click();await noTour(page);assert.deepEqual(await fonts(),maya);
}));

test('the default authorized private viewer retains its existing guide and does not persist tour preferences',()=>fixture({width:1440},async page=>{
 await page.goto(origin+'/synthetic-private-viewer');const guide=page.getByRole('complementary',{name:'Walkthrough guide'});await guide.getByRole('heading',{name:'Synthetic private guide',exact:true}).waitFor();
 assert.equal(await page.locator(visibleTour).count(),0);assert.equal(await page.getByRole('button',{name:'View tour',exact:true}).count(),0);assert.deepEqual(await stored(page),{local:{},session:{}});
 await guide.getByRole('button',{name:'Next',exact:true}).click();await guide.getByRole('heading',{name:'Synthetic next stop',exact:true}).waitFor();assert.deepEqual(await stored(page),{local:{},session:{}});
}));

for(const width of [320,390,768,1440])test(`seven anchored stops remain visible and keyboard accessible at ${width}px`,()=>fixture({width,reducedMotion:'reduce'},async page=>{
 await ready(page);const intro=welcome(page);await intro.waitFor();
 assert.equal(await intro.evaluate(e=>e.contains(document.activeElement)),true,'The welcome owns initial focus');
 for(const control of await intro.getByRole('button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')||e.textContent,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewport:{width:innerWidth,height:innerHeight}};})))assert.ok(control.width>=44&&control.height>=44&&control.left>=0&&control.right<=control.viewport.width&&control.top>=0&&control.bottom<=control.viewport.height,JSON.stringify(control));
 await page.screenshot({path:path.join(artifacts,`maya-${width}-welcome.png`)});await start(page);
 const geometries=[];
 for(let index=0;index<7;index++){
  const callout=await stage(page,index);await page.locator('.maya-tour-highlight').waitFor();await page.locator('.maya-tour-pointer').waitFor();
  await page.locator('.maya-tour-popover[data-positioned="true"]').waitFor();
  const geometry=await page.evaluate(()=>{
   const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
   const p=document.querySelector('.maya-tour-popover'),h=document.querySelector('.maya-tour-highlight'),t=document.querySelector('.maya-tour-target');
   return {popup:rect(p),highlight:rect(h),target:t?rect(t):null,targetKey:t?.dataset.tourTarget,pointer:rect(document.querySelector('.maya-tour-pointer')),viewport:{width:innerWidth,height:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth,controls:[...p.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().width).map(e=>({label:e.getAttribute('aria-label')||e.textContent,...rect(e)})),focusInside:p.contains(document.activeElement)};
  });
  const p=geometry.popup,h=geometry.highlight,v=geometry.viewport;
  assert.equal(geometry.overflow,false,JSON.stringify(geometry));assert.ok(p.left>=0&&p.top>=0&&p.right<=v.width+1&&p.bottom<=v.height+1,JSON.stringify(geometry));
  assert.ok(h.right>0&&h.left<v.width&&h.bottom>0&&h.top<v.height,'The highlighted real target is visible');
  assert.ok(p.right<=h.left+2||p.left>=h.right-2||p.bottom<=h.top+2||p.top>=h.bottom-2,`Callout covers target: ${JSON.stringify(geometry)}`);
  assert.ok(geometry.target,'The tour marks the actual target element');
  const expectedTarget=['overview','keep-card','approval-controls','routine-grid','support','review','terms'][index];assert.equal(geometry.targetKey,expectedTarget,'The highlighted element matches this stage');
  const t=geometry.target;assert.ok(h.left>=t.left-2&&h.top>=t.top-2&&h.right<=t.right+2&&h.bottom<=t.bottom+2,'Highlight follows the visible part of the real target');
  for(const control of geometry.controls)assert.ok(control.width>=44&&control.height>=44,JSON.stringify(control));
  assert.equal(geometry.focusInside,true,'Step changes focus a control or heading inside the callout');
  geometries.push(geometry);await page.screenshot({path:path.join(artifacts,`maya-${width}-step-${index+1}.png`)});
  if(index===4){const copy=callout.locator('.maya-tour-copy');if(await copy.evaluate(e=>e.scrollHeight>e.clientHeight+1)){await copy.evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok(await copy.evaluate(e=>e.scrollTop>0),'Long authored messages remain scrollable while the controls stay visible');await page.screenshot({path:path.join(artifacts,`maya-${width}-support-reply.png`)});}}
  if(index<6)await next(page,index);
 }
 await fs.writeFile(path.join(artifacts,`maya-${width}-geometry.json`),JSON.stringify(geometries,null,2)+'\n');
 await page.keyboard.press('Escape');await noTour(page);assert.equal(await page.locator('.maya-tour-target').count(),0);
 await page.screenshot({path:path.join(artifacts,`maya-${width}-exited.png`)});
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:path.join(artifacts,`maya-${width}-exited-header.png`)});
 await page.getByRole('button',{name:'View tour',exact:true}).click();await welcome(page).waitFor();await page.keyboard.press('Escape');await noTour(page);
}));
