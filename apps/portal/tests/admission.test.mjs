import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const site=fileURLToPath(new URL('../site/',import.meta.url)),artifacts=fileURLToPath(new URL('../../../.local-artifacts/admission-ui/',import.meta.url));
let browser;before(async()=>{await fs.mkdir(artifacts,{recursive:true});browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-networking']});});after(async()=>browser?.close());
async function fixture(width,scenario,run){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});await context.setOffline(true);const errors=[];
 await context.route('**/*',async route=>{const u=new URL(route.request().url());assert.equal(u.origin,'http://localhost');if(u.pathname==='/admission-harness')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name=viewport content="width=device-width,initial-scale=1"></head><body></body></html>'});const file=path.resolve(site,'.'+u.pathname);if(!file.startsWith(site))return route.abort();try{return route.fulfill({body:await fs.readFile(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream'});}catch{return route.fulfill({status:404,body:''});}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(2500);
 await page.goto('http://localhost/admission-harness');
 await page.evaluate(async scenario=>{
  const {mountAdvisorWorkspace}=await import('/advisor/workspace.js');document.body.innerHTML='<div id="test-root"></div>';
  for(const href of ['/style.css','/advisor/workspace.css']){const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);}
  const clientId='10000000-0000-4000-8000-000000000001',directory={capabilities:{view:true,edit:true,publish:true,confirmPayments:true},clients:[]};window.intents=[];let failed=false;
  window.directoryReads=0;
  const request=async command=>{
   if(command.action==='advisor_list'){
    window.directoryReads++;
    if(scenario.startsWith('held_')&&window.directoryReads===1)return new Promise((resolve,reject)=>{window.releaseDirectory=()=>{window.firstDirectorySettled=true;scenario==='held_error'?reject(Object.assign(Error('Held directory failure'),{status:503})):resolve(structuredClone(directory));};});
    return structuredClone(directory);
   }
   return{client:{revision:0,plan:null,history:[],orderProposal:{kind:'proposal',currency:'USD',items:[],subtotalCents:0,payable:false,shippingAndTaxConfirmed:false},routine:[],routineHistory:[]},intake:null,draft:null,meetingNotes:[]};
  };
  const requestAdmission=async command=>{
   if(command.action==='capabilities')return{canAddClient:scenario!=='denied'};window.intents.push(structuredClone(command));
   const row={clientId,displayName:command.displayName,enrollmentStatus:'active',revision:0,publishedVersion:0,hasDraft:false};if(!directory.clients.length)directory.clients.push(row);
   if(scenario==='uncertain'&&!failed){failed=true;throw Object.assign(Error('network unavailable'),{status:503});}
   return{requestId:command.requestId,status:scenario==='duplicate'?'already_admitted':'admitted',clientId,displayName:command.displayName,email:command.email,emailSent:false,portalUrl:'https://portal.goshelv.com/'};
  };
  window.dispose=mountAdvisorWorkspace(document.querySelector('#test-root'),{request,requestAdmission,mountFeature:async()=>()=>{},onSignOut:()=>{},initialDirectory:directory});
 },scenario);
 try{await run(page);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 catch(error){await page.screenshot({path:path.join(artifacts,`failure-${scenario}-${width}.png`),fullPage:true});throw error;}
 finally{await context.close();}
}
for(const width of [1440,390]){
 test(`founder adds a client without sending mail and opens the empty consultation at ${width}px`,()=>fixture(width,'new',async page=>{
  await page.getByRole('button',{name:'Add client',exact:true}).click();await page.getByLabel('Client name',{exact:true}).fill('Synthetic Client');await page.getByLabel('Client email',{exact:true}).fill('client+demo@example.com');await page.locator('dialog[open]').getByRole('button',{name:'Add client',exact:true}).click();
  await page.getByText('No email has been sent.',{exact:true}).waitFor();assert.equal((await page.evaluate(()=>window.intents)).length,1);
  assert.equal(await page.getByLabel('Portal link',{exact:true}).inputValue(),'https://portal.goshelv.com/');await page.screenshot({path:path.join(artifacts,`added-${width}.png`),fullPage:true});
  await page.getByRole('button',{name:'Open client',exact:true}).click();await page.getByRole('heading',{name:'Synthetic Client',exact:true}).waitFor();await page.getByRole('heading',{name:'Consultation notes',exact:true}).waitFor();
 }));
 test(`uncertain add preserves the exact request and duplicate opens without reset at ${width}px`,()=>fixture(width,'uncertain',async page=>{
  await page.getByRole('button',{name:'Add client',exact:true}).click();await page.getByLabel('Client name',{exact:true}).fill('Synthetic Client');await page.getByLabel('Client email',{exact:true}).fill('client@example.com');await page.locator('dialog[open]').getByRole('button',{name:'Add client',exact:true}).click();
  await page.getByRole('button',{name:'Retry same add',exact:true}).click();await page.getByText('No email has been sent.',{exact:true}).waitFor();const intents=await page.evaluate(()=>window.intents);assert.equal(intents.length,2);assert.deepEqual(intents[0],intents[1]);
 }));
}
test('edit/publish rights do not reveal Add client without explicit admission capability',()=>fixture(390,'denied',async page=>{await page.waitForTimeout(150);assert.equal(await page.getByRole('button',{name:'Add client',exact:true}).count(),0);}));

test('a completed add does not replace the next Add client form',()=>fixture(390,'new',async page=>{
 await page.getByRole('button',{name:'Add client',exact:true}).click();await page.getByLabel('Client name',{exact:true}).fill('First Client');await page.getByLabel('Client email',{exact:true}).fill('first@example.com');await page.locator('dialog[open]').getByRole('button',{name:'Add client',exact:true}).click();await page.getByText('No email has been sent.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Close dialog',exact:true}).click();await page.getByRole('button',{name:'Add client',exact:true}).click();await page.getByLabel('Client name',{exact:true}).waitFor();assert.equal(await page.getByLabel('Client name',{exact:true}).inputValue(),'');
}));

test('closing a successful result refreshes the client directory',()=>fixture(390,'new',async page=>{
 await page.getByRole('button',{name:'Add client',exact:true}).click();await page.getByLabel('Client name',{exact:true}).fill('Visible New Client');await page.getByLabel('Client email',{exact:true}).fill('visible@example.com');await page.locator('dialog[open]').getByRole('button',{name:'Add client',exact:true}).click();await page.getByText('No email has been sent.',{exact:true}).waitFor();await page.getByRole('button',{name:'Close dialog',exact:true}).click();await page.locator('.advisor-client-name strong').getByText('Visible New Client',{exact:true}).waitFor();
}));

for(const scenario of ['held_success','held_error'])test(`a late admission directory ${scenario} cannot replace unsaved consultation`,()=>fixture(390,scenario,async page=>{
 const dialogs=[];page.on('dialog',async dialog=>{dialogs.push(dialog.message());await dialog.accept();});
 await page.getByRole('button',{name:'Add client',exact:true}).click();await page.getByLabel('Client name',{exact:true}).fill('Race Client');await page.getByLabel('Client email',{exact:true}).fill('race@example.com');await page.locator('dialog[open]').getByRole('button',{name:'Add client',exact:true}).click();await page.getByText('No email has been sent.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.directoryReads),1);
 await page.getByRole('button',{name:'Open client',exact:true}).click();await page.locator('#intake-goal').fill('UNSAVED HELD DIRECTORY CANARY');assert.equal(await page.evaluate(()=>window.directoryReads),2);
 await page.evaluate(async()=>{window.releaseDirectory();await new Promise(resolve=>setTimeout(resolve,0));});
 assert.equal(await page.locator('#intake-goal').count(),1,'Late directory result cannot remove the consultation');assert.equal(await page.locator('#intake-goal').inputValue(),'UNSAVED HELD DIRECTORY CANARY');assert.equal(dialogs.length,0,'No silent replacement or spurious confirmation');await page.getByRole('heading',{name:'Race Client',exact:true}).waitFor();
 await page.locator('#back-clients').click();await page.getByRole('heading',{name:'Clients',exact:true}).waitFor();assert.equal(dialogs.length,1,'Ordinary navigation remains available with the existing unsaved-edits confirmation');await page.locator('[data-client]').first().click();await page.locator('#intake-goal').waitFor();
}));
