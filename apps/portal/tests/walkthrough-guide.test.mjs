import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../site'),out=path.resolve(process.env.WALKTHROUGH_GUIDE_ARTIFACTS||path.join(os.tmpdir(),'shelv-guide'));
let browser;
before(async()=>{await fs.mkdir(out,{recursive:true});browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-networking','--no-proxy-server','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});});
after(async()=>browser?.close());
for(const width of [320,390,768,1440])test(`guided public sample preserves navigation, sample context and safe actions at ${width}px`,async()=>{
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});await context.setOffline(true);const errors=[],unexpected=[];
 await context.route('**/*',async route=>{const request=route.request(),url=new URL(request.url());if(url.origin!=='http://localhost'||request.method()!=='GET'){unexpected.push(url.pathname);return route.abort();}const file=path.resolve(site,'.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));try{if(!file.startsWith(site+path.sep))return route.abort();await route.fulfill({body:await fs.readFile(file),contentType:({'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json'})[path.extname(file)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:''});}});
 const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://localhost/maya/?guided=1');const guide=page.locator('.maya-tour-popover'),welcome=page.getByRole('dialog',{name:'See how Shelv works'});await page.locator('[data-presentation-card]').first().waitFor();assert.match(await page.locator('#preview-banner').innerText(),/Fictional sample/);assert.match(await welcome.innerText(),/3–4 minutes/i);assert.equal(await page.locator('.walkthrough-guide').count(),0);
  await welcome.getByRole('button',{name:'Start tour',exact:true}).click();await guide.getByRole('heading',{name:'We start with a conversation',exact:true}).waitFor();
  await guide.getByRole('button',{name:'Next',exact:true}).click();await page.waitForURL(/step=plan-reasoning/);await guide.getByRole('button',{name:'Back',exact:true}).click();await page.waitForURL(/step=meet-maya/);await page.goBack();await page.waitForURL(/step=plan-reasoning/);await page.reload();await page.locator('[data-presentation-card]').first().waitFor();await guide.getByRole('heading',{name:'First, keep what works',exact:true}).waitFor();assert.equal(await welcome.count(),0);
  await page.evaluate(()=>{const p=new URLSearchParams(location.hash.slice(1));p.set('step','review-decision');location.hash=p.toString();});await page.locator('.shelv-service[aria-busy=false]').waitFor();assert.match(await page.locator('.shelv-service').innerText(),/twice in week one/i);assert.equal(await page.locator('.service-record').count(),1);assert.equal(await page.locator('textarea,input[type=file]').count(),0);
  await guide.getByRole('button',{name:'Next',exact:true}).click();await guide.getByRole('heading',{name:'We stay involved',exact:true}).waitFor();await guide.getByRole('button',{name:'Finish tour',exact:true}).click();await guide.waitFor({state:'detached'});assert.equal(await page.locator('.maya-tour-highlight,.maya-tour-pointer,.maya-tour-welcome,.walkthrough-guide').count(),0);
  await page.locator('#client-payments').click();await page.locator('.shelv-payments[aria-busy=false]').waitFor();assert.match(await page.locator('.walkthrough-portal').innerText(),/Nothing is charged or sent/);assert.equal(await page.locator('input[type=file],.payment-selected-recipient,a[href*="cash.app"],img[alt*="QR"]').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(out,`guide-${width}.png`),fullPage:true});await page.getByRole('button',{name:'View tour',exact:true}).click();await welcome.getByRole('button',{name:'Start tour',exact:true}).click();await guide.getByRole('heading',{name:'We start with a conversation',exact:true}).waitFor();await guide.getByRole('button',{name:'Exit tour',exact:true}).click();await guide.waitFor({state:'detached'});await page.locator('#client-checkins').click();await page.locator('.shelv-checkins[aria-busy=false]').waitFor();assert.equal(await page.locator('.shelv-checkins input[type=file],.shelv-checkins textarea').count(),0);assert.equal(await page.locator('.checkin-photo').count(),0);assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
 }finally{await context.close();}
});
