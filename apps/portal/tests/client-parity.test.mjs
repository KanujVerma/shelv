import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const site=path.resolve(process.env.PORTAL_SITE_DIR||path.join(here,'../site'));
const artifacts=path.resolve(process.env.PORTAL_TEST_ARTIFACTS||path.join(os.tmpdir(),'shelv-client-parity'));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href:'playwright-core');
const origin='http://localhost';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR6kAAAAASUVORK5CYII=','base64');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf'};
let browser;
before(async()=>{await fs.mkdir(artifacts,{recursive:true});browser=await chromium.launch({channel:'chrome',headless:process.env.PORTAL_TEST_HEADED!=='1',args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});});
after(async()=>{await browser?.close();});

async function fixture(width,url,run){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});
 await context.setOffline(true);
 const external=[],missing=[],errors=[];
 await context.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url());
  if(u.origin!==origin||request.method()!=='GET'){external.push(request.method()+' '+u.origin+u.pathname);return route.abort();}
  const requested=decodeURIComponent(u.pathname),relative=requested.endsWith('/')?requested+'index.html':requested;
  const file=path.resolve(site,'.'+relative);
  if(!file.startsWith(site+path.sep)){missing.push(relative);return route.abort();}
  try{return route.fulfill({body:await fs.readFile(file),contentType:mime[path.extname(file)]||'application/octet-stream'});}
  catch{missing.push(relative);return route.fulfill({status:404,body:''});}
 });
 const page=await context.newPage();page.setDefaultTimeout(7000);page.on('pageerror',error=>errors.push(error.message));
 try{await page.goto(origin+url);await run(page);assert.deepEqual(errors,[],'No application page errors');assert.deepEqual(missing,[],'No missing local assets');assert.deepEqual(external,[],'No requests leave the intercepted local fixture');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal page overflow');}
 catch(error){await page.screenshot({path:path.join(artifacts,`failure-${url.startsWith('/maya')?'maya':'alex'}-${width}.png`),fullPage:true});throw error;}
 finally{await context.close();}
}
const cases=[
 {name:'Alex',url:'/?preview=1&state=unapproved#/client',recommendation:'moisturizer-1',stopped:'CeraVe PM Facial Moisturizing Lotion',after:'Vanicream Daily Facial Moisturizer',pairs:2},
 {name:'Maya',url:'/maya/',recommendation:'maya-azelaic-1',after:'The Ordinary Azelaic Acid Suspension 10%',pairs:3},
];
async function saved(page){await page.locator('#client-update-notice').getByRole('status').filter({hasText:'Your update is saved.'}).waitFor();}
async function routineNames(page){await page.locator('#client-routine').click();await page.locator('.client-daily-grid').waitFor();return page.locator('.client-daily-grid .client-routine-product strong').allTextContents();}

for(const width of [1440,390]){
 for(const item of cases)test(`${item.name} comparisons and receipt preserve the routine until explicit Start at ${width}px`,async()=>fixture(width,item.url,async page=>{
  await page.locator('[data-presentation-card]').first().waitFor();
  const pairs=page.locator('[data-presentation-card]').filter({has:page.locator('.formula-table')});
  assert.equal(await pairs.count(),item.pairs);
  for(const pair of await pairs.all()){
   assert.equal(await pair.getByRole('rowheader').count(),3,'Formula comparisons retain three ingredient rows');
   await pair.getByRole('rowheader').first().getByRole('button').click();
   await page.locator('dialog[open] h2').waitFor();assert.ok((await page.locator('dialog[open]').innerText()).length>120,'Ingredient explanation is populated');
   await page.locator('dialog[open] [data-ingredient-back]').click();
   for(const button of await pair.locator('[data-product-ingredients]').all()){
    await button.click();await page.locator('dialog[open] .inci-list').first().waitFor();
    assert.ok(await page.locator('dialog[open] .inci-list li').count()>5,'Both products expose populated full ingredient lists');
    await page.locator('dialog[open] .inci-list [data-ingredient]').first().click();await page.locator('dialog[open] [data-ingredient-back]').waitFor();
    await page.locator('dialog[open] [data-ingredient-back]').click();await page.locator('dialog[open] .inci-list').first().waitFor();await page.keyboard.press('Escape');
   }
  }
  const initial=await routineNames(page);assert.ok(!initial.includes(item.after));
  if(item.stopped){assert.ok(!initial.includes(item.stopped),'Explicit stop advice stays outside actionable daily steps');assert.match(await page.locator('.routine-stop-advice').innerText(),/Stop · CeraVe PM Facial Moisturizing Lotion/);}
  await page.locator('#client-recommendations').click();
  await page.locator(`[data-controls="${item.recommendation}"] [data-decline]`).click();
  await page.locator('#decline-reason').fill('Synthetic preference to discuss this option');await page.locator('#send-decline').click();await saved(page);
  assert.deepEqual(await routineNames(page),initial,'Declining does not activate a replacement');await page.locator('#client-recommendations').click();
  await page.locator(`[data-controls="${item.recommendation}"] [data-approve]`).click();await saved(page);
  assert.deepEqual(await routineNames(page),initial,'Approval is a quote choice, not routine activation');
  await page.locator('#client-recommendations').click();await page.locator(`[data-controls="${item.recommendation}"] [data-received]`).click();await saved(page);
  assert.deepEqual(await routineNames(page),initial,'Receipt keeps the existing routine active');
  await page.screenshot({path:path.join(artifacts,`${item.name.toLowerCase()}-${width}-received-routine.png`),fullPage:true});
  await page.locator('#client-recommendations').click();const form=page.locator(`[data-start-form="${item.recommendation}"]`);
  await form.locator('input[type=date]').fill(await form.locator('input[type=date]').getAttribute('max'));await form.getByRole('button').click();await saved(page);
  const active=await routineNames(page);assert.ok(active.includes(item.after),'Explicit Start adds the selected product');
  for(const name of initial)assert.ok(active.includes(name),'Unrelated current products remain active');
  await page.screenshot({path:path.join(artifacts,`${item.name.toLowerCase()}-${width}-started-routine.png`),fullPage:true});
 }));
 test(`Maya photo attaches, survives navigation and opens privately after submission at ${width}px`,async()=>fixture(width,'/maya/',async page=>{
  await page.locator('#client-checkins').click();await page.locator('.shelv-checkins[aria-busy="false"]').waitFor();
  await page.getByLabel('Comfort',{exact:true}).fill('Synthetic comfort answer');await page.getByLabel('Consistency',{exact:true}).fill('Synthetic consistency answer');
  await page.locator('input[type=file]').first().setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:png});
  await page.getByRole('button',{name:'Upload front photo',exact:true}).click();await page.locator('.shelv-checkins[aria-busy="false"]').waitFor();
  assert.equal(await page.locator('.checkin-photo-card').getByText('Front photo attached privately.',{exact:true}).count(),1,'A valid optional photo must attach before a report is submitted');
  await page.locator('#client-plan').click();await page.locator('#client-checkins').click();await page.locator('.shelv-checkins[aria-busy="false"]').waitFor();
  assert.equal(await page.getByLabel('Comfort',{exact:true}).inputValue(),'Synthetic comfort answer');
  assert.equal(await page.locator('.checkin-photo-card').getByText('Front photo attached privately.',{exact:true}).count(),1,'Completed upload reference survives navigation');
  const storage=await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}));assert.doesNotMatch(storage,/Synthetic comfort|synthetic\.png|data:image/,'No answers or selected photo persist in web storage');
  await page.getByRole('button',{name:'Submit before meeting',exact:true}).click();await page.locator('.shelv-checkins[aria-busy="false"]').waitFor();
  assert.equal(await page.getByLabel('Comfort',{exact:true}).inputValue(),'','Successful submission clears the draft');
  assert.equal(await page.getByRole('button',{name:'View private front photo',exact:true}).count(),1,'Exactly one submitted photo is available');
  await page.getByRole('button',{name:'View private front photo',exact:true}).click();await page.locator('.checkin-private-image').waitFor();
  assert.equal(await page.locator('.checkin-private-image').evaluate(img=>img.complete&&img.naturalWidth>0),true,'Private photo view loads');
  await page.screenshot({path:path.join(artifacts,`maya-${width}-submitted-private-photo.png`),fullPage:true});
 }));
}

test('preview domain retains baseline product identity through approval and receipt, then Start changes exactly one slot',async()=>{
 const {createPreviewRequests}=await import(pathToFileURL(path.join(site,'advisor/fixtures.js')).href);
 const fixture=createPreviewRequests({scenario:'unapproved'}),read=()=>fixture.core({action:'client_read_v2'});
 const initial=await read();
 assert.equal(initial.routine.find(item=>item.slot==='moisturizer').productId,'cerave-pm');
 const command=async action=>{const view=await read();return fixture.core({action,version:1,recommendationId:'moisturizer-1',requestId:crypto.randomUUID(),expectedRevision:view.revision,...(action==='decide'?{choice:'approved',reason:''}:action==='start'?{startedOn:'2026-10-24'}:{})});};
 await command('decide');assert.deepEqual((await read()).routine,initial.routine);
 await command('receive');assert.deepEqual((await read()).routine,initial.routine);
 await command('start');const started=await read();assert.equal(started.routine.find(item=>item.slot==='moisturizer').productId,'vanicream-daily');
 assert.deepEqual(started.routine.filter(item=>item.slot!=='moisturizer'),initial.routine.filter(item=>item.slot!=='moisturizer'));
});

test('client cookie adapter hides stale owner replies and keeps provider credentials out of requests and storage',async()=>fixture(390,'/maya/',async page=>{
 const result=await page.evaluate(async()=>{
  const {CookieClientSession,createClientCookieRequest,createClientPhotoUpload}=await import('/auth/client-cookie-session.js');
  const owners=['11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333'];
  const view=i=>({signedIn:true,ownerId:owners[i],generation:1,csrf:'synthetic-csrf-'+i,remembered:false,capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+28800000).toISOString()});
  const outcomes=[],requests=[];
  for(const transport of ['json','evidence','photo']){
   let release,entered;const waiting=new Promise(resolve=>entered=resolve);
   const session=new CookieClientSession({fetcher:async(url,options)=>{requests.push({url,headers:options.headers,credentials:options.credentials,bodyType:options.body instanceof Blob?'blob':options.body instanceof FormData?'form':typeof options.body});entered();return new Promise(resolve=>release=()=>resolve(Response.json({publicCanary:'OWNER_A_PRIVATE_REPLY'})));}});
   session._accept(view(0));const file=new Blob(['synthetic'],{type:'image/png'}),form=new FormData();form.set('file',file);form.set('metadata','{}');
   const promise=transport==='json'?createClientCookieRequest('operations',session)({action:'client_read_v2'}):transport==='evidence'?createClientCookieRequest('payments',session)(form):createClientPhotoUpload(session)({file,angle:'front',requestId:crypto.randomUUID(),completionRequestId:crypto.randomUUID(),expectedRevision:0});
   try{await waiting;session._accept(view(1));release();try{await promise;outcomes.push({transport,rejected:false});}catch(error){outcomes.push({transport,rejected:error.status===401,owner:session.identity?.ownerId});}}
   finally{session.dispose();}
  }
  const session=new CookieClientSession();session._accept(view(0));let forbidden=false;try{await createClientCookieRequest('operations',session)({action:'advisor_list'});}catch(error){forbidden=error.status===403;}finally{session.dispose();}
  return {outcomes,requests,forbidden,storage:JSON.stringify({...localStorage,...sessionStorage})};
 });
 assert.deepEqual(result.outcomes,[{transport:'json',rejected:true,owner:'33333333-3333-4333-8333-333333333333'},{transport:'evidence',rejected:true,owner:'33333333-3333-4333-8333-333333333333'},{transport:'photo',rejected:true,owner:'33333333-3333-4333-8333-333333333333'}]);
 assert.equal(result.forbidden,true,'Client adapter refuses advisor operations before dispatch');
 assert.deepEqual(result.requests.map(request=>request.url),['/api/client/operations','/api/client/payments','/api/client/checkins/photos/upload']);
 for(const request of result.requests){assert.equal(request.credentials,'same-origin');assert.equal(new Headers(request.headers).has('Authorization'),false);}
 assert.doesNotMatch(result.storage,/access_token|refresh_token|OWNER_A_PRIVATE_REPLY/);
}));
