import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const site=path.resolve(fileURLToPath(new URL('../site/',import.meta.url)));
const artifacts=fileURLToPath(new URL('../../../.local-artifacts/ux-20261026/advisor/',import.meta.url));
const clientId='10000000-0000-4000-8000-000000000001';
let browser;
before(async()=>{await fs.mkdir(artifacts,{recursive:true});browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-networking','--no-proxy-server','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});});
after(async()=>browser?.close());

async function fixture(width,run,{url='/__advisor#/advisor',history=false,service=false}={}){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});
 await context.setOffline(true);const errors=[],external=[],missing=[];
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin!=='http://localhost'||route.request().method()!=='GET'){external.push(u.origin+u.pathname);return route.abort();}
  if(u.pathname==='/__advisor')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/advisor/workspace.css"><link rel="stylesheet" href="/advisor/presentation-editor.css"><div id="root"></div>'});
  const file=path.resolve(site,'.'+decodeURIComponent(u.pathname));if(!file.startsWith(site+path.sep))return route.abort();
  try{return route.fulfill({body:await fs.readFile(file),contentType:({'.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream'});}catch{missing.push(u.pathname);return route.fulfill({status:404,body:''});}
 });
 const page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto('http://localhost'+url);
  await page.evaluate(async({withHistory,service})=>{
   const [{mountAdvisorWorkspace},{createPreviewRequests},{mountCheckinsPanel},{createCheckinPreviewStore,createCheckinPreviewRequest},{mountPaymentsPanel},{createPaymentPreviewStore,createPaymentPreviewRequest}]=await Promise.all([import('/advisor/workspace.js'),import('/advisor/fixtures.js'),import('/features/checkins/index.js'),import('/features/checkins/fixtures.js'),import('/features/payments/index.js'),import('/features/payments/fixtures.js')]);
   const source=createPreviewRequests(),stores=new Map(),paymentStores=new Map();window.__commands=[];window.__paymentCommands=[];window.__serviceCommands=[];window.__loseReply=false;window.__losePayment=false;window.__loseService=false;window.__publicationBump=0;
   const {mountServicePanel}=await import('/features/service/index.js');const {createServicePreviewRequests}=await import('/features/service/fixtures.js');
   const serviceStores=new Map();
   const request=async command=>{const result=await source.core(command.clientId==='10000000-0000-4000-8000-000000000001'?{...command,clientId:source.clientId}:command);if(command.action==='advisor_list')result.clients[0].clientId='10000000-0000-4000-8000-000000000001';if(command.action==='advisor_read_v2'&&result.client.plan&&window.__publicationBump)result.client.plan.version+=window.__publicationBump;if(withHistory&&command.action==='advisor_read_v2'&&result.client.plan){result.client.history=[{...structuredClone(result.client.plan),version:1,publishedAt:'2026-10-01T12:00:00Z'}];result.client.plan.version=2;result.client.plan.publishedAt='2026-10-20T12:00:00Z';}return result;};
   const mountFeature=async(kind,host,options)=>{
    if(kind==='service'){if(!serviceStores.has(options.clientId))serviceStores.set(options.clientId,createServicePreviewRequests({clientId:options.clientId,clientView:options.clientView,now:'2026-10-26T12:00:00Z'}));const source=serviceStores.get(options.clientId).advisor,request=async command=>{if(command.action==='record_review')window.__serviceCommands.push(structuredClone(command));const result=await source(command);if(command.action==='record_review'&&window.__loseService){window.__loseService=false;throw {status:503};}return result;};return mountServicePanel(host,{...options,request,now:()=>new Date('2026-10-26T12:00:00Z')});}
    if(kind==='checkins'){
     if(!stores.has(options.clientId))stores.set(options.clientId,createCheckinPreviewStore());
     const source=createCheckinPreviewRequest({mode:'advisor',store:stores.get(options.clientId)});
     const request=async command=>{if(command.action==='send_advisor_reply')window.__commands.push(structuredClone(command));const result=await source(command);if(command.action==='send_advisor_reply'&&window.__loseReply){window.__loseReply=false;throw {status:503};}return result;};
     return mountCheckinsPanel(host,{...options,request});
    }
    if(!paymentStores.has(options.clientId))paymentStores.set(options.clientId,createPaymentPreviewStore());
    const source=createPaymentPreviewRequest({mode:'advisor',store:paymentStores.get(options.clientId)}),request=async command=>{if(command.action==='issue_quote')window.__paymentCommands.push(structuredClone(command));const result=await source(command);if(command.action==='issue_quote'&&window.__losePayment){window.__losePayment=false;throw {status:503};}return result;};return mountPaymentsPanel(host,{...options,request});
   };
   window.__mount=()=>mountAdvisorWorkspace(document.querySelector('#root'),{request,mountFeature,onSignOut:()=>{},preview:true,serviceEnabled:service});
   window.__dispose=window.__mount();
  },{withHistory:history,service});
  await page.getByRole('button',{name:/Alex Morgan/}).waitFor();
  await run(page);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(missing,[]);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Advisor tasks fit the viewport');
 }finally{await context.close();}
}
const open=async page=>{await page.getByRole('button',{name:/Alex Morgan/}).click();await page.locator('#intake-form').waitFor();};
const task=async(page,name,feature)=>{await page.getByRole('button',{name,exact:true}).click();if(feature)await page.locator('.'+feature+'[aria-busy="false"]').waitFor();};

for(const width of [320,390,1440]){
 test(`advisor replies and private notes survive task navigation at ${width}px`,()=>fixture(width,async page=>{
  await open(page);await task(page,'Check-ins','shelv-checkins');
  await page.getByLabel('Reply to client',{exact:true}).fill('Public reply still being prepared');
  await page.getByLabel('Private meeting note',{exact:true}).fill('Private thought still being prepared');
  await task(page,'Payments','shelv-payments');await task(page,'Check-ins','shelv-checkins');
  assert.equal(await page.getByLabel('Reply to client',{exact:true}).inputValue(),'Public reply still being prepared');
  assert.equal(await page.getByLabel('Private meeting note',{exact:true}).inputValue(),'Private thought still being prepared');
  await page.screenshot({path:path.join(artifacts,`checkins-${width}.png`),fullPage:true});
 }));
 test(`advisor task URLs and browser history restore the selected client at ${width}px`,()=>fixture(width,async page=>{
  await open(page);await task(page,'Check-ins','shelv-checkins');
  const target=new URL(page.url());assert.equal(target.searchParams.get('advisorClient'),clientId);assert.equal(target.searchParams.get('advisorTask'),'checkins');
  await task(page,'Payments','shelv-payments');await page.goBack();await page.locator('.shelv-checkins[aria-busy="false"]').waitFor();
  await page.goForward();await page.locator('.shelv-payments[aria-busy="false"]').waitFor();
  await page.evaluate(()=>{window.__dispose();window.__dispose=window.__mount();});await page.locator('.shelv-payments[aria-busy="false"]').waitFor();
 }));
}
test('an interrupted reply keeps its exact retry intent after leaving and returning',()=>fixture(390,async page=>{
 await open(page);await task(page,'Check-ins','shelv-checkins');await page.getByLabel('Reply to client',{exact:true}).fill('One reply, despite a lost acknowledgement');
 await page.evaluate(()=>window.__loseReply=true);await page.getByRole('button',{name:'Send reply',exact:true}).click();await page.getByRole('button',{name:'Retry same submission',exact:true}).waitFor();
 await task(page,'Payments','shelv-payments');await task(page,'Check-ins','shelv-checkins');
 await page.getByRole('button',{name:'Retry same submission',exact:true}).click();await page.locator('.shelv-checkins[aria-busy="false"]').waitFor();
 const commands=await page.evaluate(()=>window.__commands);assert.equal(commands.length,2);assert.deepEqual(commands[1],commands[0]);
 assert.equal(await page.locator('.checkin-reply-body').count(),1);
}));
test('leaving a client guards unsent replies and clears them after confirmed departure',()=>fixture(390,async page=>{
 await open(page);await task(page,'Check-ins','shelv-checkins');await page.getByLabel('Reply to client',{exact:true}).fill('Do not silently lose this');
 page.once('dialog',dialog=>dialog.dismiss());await page.locator('#back-clients').click();assert.equal(await page.locator('.shelv-checkins').count(),1);
 page.once('dialog',dialog=>dialog.accept());await page.locator('#back-clients').click();await page.getByRole('button',{name:/Alex Morgan/}).waitFor();
 await open(page);await task(page,'Check-ins','shelv-checkins');assert.equal(await page.getByLabel('Reply to client',{exact:true}).inputValue(),'');
}));
test('advisor publication history shows immutable prior versions in the client workspace',()=>fixture(390,async page=>{
 await open(page);await task(page,'Plan history');
 assert.equal(await page.getByRole('heading',{name:'Plan version 1',exact:true}).count(),1);
 assert.equal(await page.getByRole('heading',{name:'Plan version 2',exact:true}).count(),1);
 await page.getByRole('button',{name:'View plan version 1',exact:true}).click();await page.getByRole('dialog',{name:'Plan version 1',exact:true}).waitFor();await page.keyboard.press('Escape');
}, {history:true}));
test('quote preparation uses the saved plan version and named approved products',()=>fixture(390,async page=>{
 await open(page);await task(page,'Payments','shelv-payments');
 const version=page.getByLabel('Published plan version',{exact:true});assert.equal(await version.inputValue(),'1');assert.equal(await version.getAttribute('readonly'),'');
 await page.getByRole('button',{name:'Add product line',exact:true}).click();const product=page.getByLabel('Product',{exact:true});assert.ok((await product.locator('option').allTextContents()).some(text=>text.includes('Vanicream')),await product.evaluate(el=>el.outerHTML));
 assert.equal(await page.getByLabel('Recommendation ID',{exact:true}).count(),0);
}));
test('an unfinished final quote survives task navigation without preserving its final-cost confirmation',()=>fixture(390,async page=>{
 await open(page);await task(page,'Payments','shelv-payments');await page.getByRole('button',{name:'Add product line',exact:true}).click();
 const quantity=page.getByLabel('Quantity',{exact:true});await quantity.fill('2');await page.getByLabel('Unit price in USD',{exact:true}).fill('12.34');await page.getByLabel('Final product shipping in USD',{exact:true}).fill('3.50');
 await page.getByLabel('Tax and shipping are final, including any zero amounts',{exact:true}).check();
 await task(page,'Check-ins','shelv-checkins');await task(page,'Payments','shelv-payments');
 assert.equal(await quantity.inputValue(),'2');assert.equal(await page.getByLabel('Unit price in USD',{exact:true}).inputValue(),'12.34');assert.equal(await page.getByLabel('Final product shipping in USD',{exact:true}).inputValue(),'3.50');
 assert.equal(await page.getByLabel('Tax and shipping are final, including any zero amounts',{exact:true}).isChecked(),false);
}));
test('a conversation review draft retains separate visible conclusions and private notes across tasks',()=>fixture(390,async page=>{
 await open(page);await task(page,'Service and reviews','shelv-service');await page.getByText('Record a conversation review',{exact:true}).click();
 await page.getByLabel('Client-visible summary',{exact:true}).fill('Visible conclusion still being prepared');await page.getByLabel('Private advisor note (optional)',{exact:true}).fill('Separate private draft');
 await task(page,'Check-ins','shelv-checkins');await task(page,'Service and reviews','shelv-service');await page.getByText('Record a conversation review',{exact:true}).click();
 assert.equal(await page.getByLabel('Client-visible summary',{exact:true}).inputValue(),'Visible conclusion still being prepared');assert.equal(await page.getByLabel('Private advisor note (optional)',{exact:true}).inputValue(),'Separate private draft');
},{service:true}));
test('an uncertain quote retries the original immutable command after task remount',()=>fixture(390,async page=>{
 await open(page);await task(page,'Payments','shelv-payments');await page.getByLabel('Tax and shipping are final, including any zero amounts',{exact:true}).check();
 await page.evaluate(()=>window.__losePayment=true);await page.getByRole('button',{name:'Issue final quote',exact:true}).click();await page.getByRole('button',{name:'Retry same request',exact:true}).waitFor();
 await task(page,'Check-ins','shelv-checkins');await task(page,'Payments','shelv-payments');await page.getByRole('button',{name:'Retry same request',exact:true}).click();await page.locator('.shelv-payments[aria-busy="false"]').waitFor();
 const commands=await page.evaluate(()=>window.__paymentCommands);assert.equal(commands.length,2);assert.deepEqual(commands[1],commands[0]);
 assert.equal(await page.locator('.payment-card-head').count(),2,'The original quote plus exactly one newly issued quote');
}));
test('a changed publication preserves unfinished amounts and requires an explicit fresh quote',()=>fixture(390,async page=>{
 await open(page);await task(page,'Payments','shelv-payments');await page.getByLabel('Final product tax in USD',{exact:true}).fill('2.10');await task(page,'Check-ins','shelv-checkins');
 await page.evaluate(()=>window.__publicationBump=1);await task(page,'Payments','shelv-payments');
 assert.equal(await page.getByLabel('Published plan version',{exact:true}).inputValue(),'2');assert.equal(await page.getByLabel('Final product tax in USD',{exact:true}).inputValue(),'2.10');assert.equal(await page.getByRole('button',{name:'Issue final quote',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Start a new quote',exact:true}).click();assert.equal(await page.getByLabel('Final product tax in USD',{exact:true}).inputValue(),'0.00');assert.equal(await page.getByRole('button',{name:'Issue final quote',exact:true}).isDisabled(),false);
}));
test('an uncertain conversation review retains the exact request and separate private note on retry',()=>fixture(390,async page=>{
 await open(page);await task(page,'Service and reviews','shelv-service');await page.getByText('Record a conversation review',{exact:true}).click();
 await page.getByLabel('Client-visible summary',{exact:true}).fill('Visible one-time conclusion');await page.getByLabel('Observed or reported use',{exact:true}).fill('Client described regular use');await page.getByLabel('Decision',{exact:true}).fill('Keep the current routine');await page.getByLabel('Private advisor note (optional)',{exact:true}).fill('Private one-time note');
 await page.evaluate(()=>window.__loseService=true);await page.getByRole('button',{name:'Record review',exact:true}).click();await page.getByRole('button',{name:'Retry same submission',exact:true}).waitFor();
 await task(page,'Check-ins','shelv-checkins');await task(page,'Service and reviews','shelv-service');await page.getByRole('button',{name:'Retry same submission',exact:true}).click();await page.locator('.shelv-service[aria-busy="false"]').waitFor();
 const commands=await page.evaluate(()=>window.__serviceCommands);assert.equal(commands.length,2);assert.deepEqual(commands[1],commands[0]);assert.equal(await page.getByText('Visible one-time conclusion',{exact:true}).count(),1);assert.equal(await page.getByText('Private one-time note',{exact:true}).count(),1);
},{service:true}));
test('browser Back cannot silently leave an unfinished client workspace',()=>fixture(390,async page=>{
 await open(page);await task(page,'Check-ins','shelv-checkins');await page.getByLabel('Reply to client',{exact:true}).fill('Unfinished reply');await page.goBack();await page.locator('#intake-form').waitFor();
 page.once('dialog',dialog=>dialog.dismiss());await page.goBack();await page.locator('#intake-form').waitFor();assert.equal(new URL(page.url()).searchParams.get('advisorClient'),clientId);assert.equal(new URL(page.url()).searchParams.get('advisorTask'),'overview');
 await task(page,'Check-ins','shelv-checkins');assert.equal(await page.getByLabel('Reply to client',{exact:true}).inputValue(),'Unfinished reply');
}));
for(const width of [320,390,1440])test(`saved draft, revision-bound preview and explicit publication remain distinct at ${width}px`,()=>fixture(width,async page=>{
 await page.screenshot({path:path.join(artifacts,`clients-${width}.png`),fullPage:true});await open(page);await task(page,'Plan draft');
 await page.locator('#draft-private-note').fill('Synthetic private draft retained through save');assert.equal(await page.locator('#publish-plan').isDisabled(),true);assert.equal(await page.locator('#preview-draft').getAttribute('href'),null);
 await page.locator('#save-draft').click();await page.waitForFunction(()=>document.querySelector('#draft-save-state')?.textContent==='Draft saved');const preview=new URL(await page.locator('#preview-draft').getAttribute('href'));assert.equal(preview.searchParams.get('clientId'),clientId);assert.equal(preview.searchParams.get('advisorPreview'),'draft');assert.equal(preview.searchParams.get('revision'),'5');
 await page.screenshot({path:path.join(artifacts,`draft-${width}.png`),fullPage:true});
 await page.locator('#publish-plan').click();const dialog=page.getByRole('dialog',{name:'Publish this plan?',exact:true});await dialog.waitFor();assert.match(await dialog.innerText(),/Private consultation and draft notes/);assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true);
 await dialog.getByRole('button',{name:'Publish plan',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#advisor-notice')?.textContent.includes('Plan version 2 published')).catch(async()=>assert.fail(await page.locator('#advisor-notice').innerText()));
 await task(page,'Plan history');assert.equal(await page.getByRole('heading',{name:'Plan version 1',exact:true}).count(),1);assert.equal(await page.getByRole('heading',{name:'Plan version 2',exact:true}).count(),1);await page.screenshot({path:path.join(artifacts,`history-${width}.png`),fullPage:true});
 await task(page,'Payments','shelv-payments');await page.screenshot({path:path.join(artifacts,`payments-${width}.png`),fullPage:true});
}));
