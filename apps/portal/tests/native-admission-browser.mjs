// Runs only when the caller supplies its marked local native Auth/SQL ports.
import {chromium} from 'playwright-core';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function runNativeAdmissionBrowser({admission,directory,readCase,email,artifacts}){
 const site=fileURLToPath(new URL('../site/',import.meta.url)),browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-networking']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});await context.setOffline(true);
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());assert.equal(u.origin,'http://localhost');
   if(u.pathname==='/native-admission')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name=viewport content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>'});
   const file=path.resolve(site,'.'+u.pathname);assert.ok(file.startsWith(site));try{return route.fulfill({body:await readFile(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream'});}catch{return route.fulfill({status:404,body:''});}
  });
  const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.exposeFunction('nativeAdmission',admission);await page.exposeFunction('nativeDirectory',directory);await page.exposeFunction('nativeCase',readCase);
  await page.goto('http://localhost/native-admission');
  await page.evaluate(async()=>{
   const{mountAdvisorWorkspace}=await import('/advisor/workspace.js');for(const href of ['/style.css','/advisor/workspace.css']){const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);}
   window.dispose=mountAdvisorWorkspace(document.querySelector('#root'),{request:command=>command.action==='advisor_list'?window.nativeDirectory():window.nativeCase(command.clientId),requestAdmission:command=>window.nativeAdmission(command),mountFeature:async()=>()=>{},onSignOut:()=>{}});
  });
  await page.getByRole('button',{name:'Add client',exact:true}).click();await page.getByLabel('Client name',{exact:true}).fill('Synthetic Native Browser Client');await page.getByLabel('Client email',{exact:true}).fill(email);
  await page.locator('dialog[open]').getByRole('button',{name:'Add client',exact:true}).click();await page.getByText('No email has been sent.',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('Portal link',{exact:true}).inputValue(),'https://portal.goshelv.com/');
  if(artifacts){await mkdir(artifacts,{recursive:true});await page.screenshot({path:path.join(artifacts,'native-add-client-390.png'),fullPage:true});}
  await page.getByRole('button',{name:'Open client',exact:true}).click();await page.getByRole('heading',{name:'Synthetic Native Browser Client',exact:true}).waitFor();await page.getByRole('heading',{name:'Private consultation notes',exact:true}).waitFor();assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.evaluate(()=>window.dispose());await context.close();
 }finally{await browser.close();}
}
