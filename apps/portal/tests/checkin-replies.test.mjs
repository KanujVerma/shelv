import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),site=path.resolve(process.env.PORTAL_SITE_DIR||path.join(root,'site'));
const artifacts=path.resolve(process.env.PORTAL_REPLY_ARTIFACTS||path.join(os.tmpdir(),'shelv-checkin-replies'));
let browser;
before(async()=>{await fs.mkdir(artifacts,{recursive:true});browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});});
after(async()=>browser?.close());
async function fixture(width,run){
 const ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});await ctx.setOffline(true);const errors=[],blocked=[],missing=[];
 await ctx.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.origin!=='http://localhost'||route.request().method()!=='GET'){blocked.push(u.origin+u.pathname);return route.abort();}
  if(u.pathname==='/__replies.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="advisor"></div><div id="client"></div>'});
  const file=path.resolve(site,'.'+decodeURIComponent(u.pathname));if(!file.startsWith(site+path.sep))return route.abort();
  try{return route.fulfill({body:await fs.readFile(file),contentType:({'.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream'});}catch{missing.push(u.pathname);return route.fulfill({status:404,body:''});}
 });
 const page=await ctx.newPage();page.setDefaultTimeout(5000);page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto('http://localhost/__replies.html');
  await page.evaluate(async()=>{
   const [{mountCheckinsPanel},{createCheckinPreviewStore,createCheckinPreviewRequest}]=await Promise.all([import('/features/checkins/index.js'),import('/features/checkins/fixtures.js')]);
   const store=createCheckinPreviewStore(),clientId='ae000000-0000-4000-8000-000000000001';window.__replyCommands=[];window.__loseReply=false;window.__wrongReport=false;window.__failRead=false;window.__replyXss=false;
   const advisor=createCheckinPreviewRequest({mode:'advisor',store}),client=createCheckinPreviewRequest({mode:'client',store});
   window.__clientRead=()=>client({action:'client_read'});window.__forgedReply=()=>client({action:'send_advisor_reply',clientId,checkinId:store.reports[0].id,reply:'Forged client reply',expectedRevision:store.revision,requestId:crypto.randomUUID()});
   const request=async command=>{if(command.action==='advisor_read'&&window.__failRead){window.__failRead=false;throw {status:503};}if(command.action==='send_advisor_reply')window.__replyCommands.push(structuredClone(command));const result=await advisor(command);if(command.action==='send_advisor_reply'&&window.__loseReply){window.__loseReply=false;throw {status:503};}if(command.action==='send_advisor_reply'&&window.__wrongReport){window.__wrongReport=false;return {...result,reportId:'ae000000-0000-4000-8000-000000000099'};}return result;};
   mountCheckinsPanel(document.querySelector('#advisor'),{clientId,mode:'advisor',request,canWrite:true});mountCheckinsPanel(document.querySelector('#client'),{clientId,mode:'client',request:client,canWrite:true});
  });
  await page.locator('#advisor .shelv-checkins[aria-busy="false"]').waitFor();await page.locator('#client .shelv-checkins[aria-busy="false"]').waitFor();
  await run(page);assert.deepEqual(errors,[]);assert.deepEqual(blocked,[],'All requests remain local and intercepted');assert.deepEqual(missing,[]);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Reply layout has no horizontal overflow');
 }finally{await ctx.close();}
}
test('wrong-report acknowledgement cannot clear the public reply intent',async()=>fixture(390,async page=>{
 const a=page.locator('#advisor');await a.getByLabel('Reply to client',{exact:true}).fill('Synthetic public reply');await page.evaluate(()=>window.__wrongReport=true);
 await a.getByRole('button',{name:'Send reply',exact:true}).click();await settled(page);
 assert.equal(await a.getByRole('button',{name:'Retry same submission',exact:true}).count(),1,'A mismatched report receipt is uncertain, not success');
 assert.equal(await a.getByLabel('Reply to client',{exact:true}).inputValue(),'Synthetic public reply');
 await a.getByRole('button',{name:'Retry same submission',exact:true}).click();await settled(page);
 assert.equal((await page.evaluate(()=>window.__clientRead())).reports[0].advisorReplies.length,1);
}));
const settled=page=>page.locator('#advisor .shelv-checkins[aria-busy="false"]').waitFor();
for(const width of [1440,390]){
 test(`advisor explicitly sends plain-text replies visible only to the report owner at ${width}px`,async()=>fixture(width,async page=>{
  const a=page.locator('#advisor'),c=page.locator('#client');
  assert.equal(await a.getByLabel('Reply to client',{exact:true}).inputValue(),'','Private note is never copied into public reply');
  assert.equal(await c.getByLabel('Reply to client',{exact:true}).count(),0);assert.equal(await c.locator('.checkin-advisor-note').count(),0);
  const injection='<img id="reply-payload" src=x onerror="window.__replyXss=true"> Public care guidance';
  await a.getByLabel('Reply to client',{exact:true}).fill(injection);await a.getByRole('button',{name:'Send reply',exact:true}).click();await settled(page);
  await c.getByRole('button',{name:'Reload latest',exact:true}).click();await c.locator('.shelv-checkins[aria-busy="false"]').waitFor();
  assert.equal(await c.locator('.checkin-advisor-replies .checkin-reply-body').innerText(),injection);assert.equal(await page.locator('#reply-payload').count(),0);assert.equal(await page.evaluate(()=>window.__replyXss),false);
  assert.doesNotMatch(await c.innerText(),/Sample meeting note|authorized advisors/);const wire=await page.evaluate(()=>window.__clientRead());assert.equal(wire.reports[0].advisorReplies.length,1);assert.doesNotMatch(JSON.stringify(wire),/meetingNotes|Sample meeting note/);
  assert.equal(await a.getByLabel('Reply to client',{exact:true}).inputValue(),'');
  const denied=await page.evaluate(async()=>{try{await window.__forgedReply();return false;}catch(error){return error.status===403;}});assert.equal(denied,true);
  await c.screenshot({path:path.join(artifacts,`client-reply-${width}.png`)});await a.screenshot({path:path.join(artifacts,`advisor-reply-${width}.png`)});
 }));
 test(`uncertain reply retries its exact intent once and a failed reload stays locked at ${width}px`,async()=>fixture(width,async page=>{
  const a=page.locator('#advisor');await a.getByLabel('Reply to client',{exact:true}).fill('Synthetic public reply');await page.evaluate(()=>window.__loseReply=true);
  await a.getByRole('button',{name:'Send reply',exact:true}).click();await settled(page);assert.equal(await a.getByLabel('Reply to client',{exact:true}).isDisabled(),true);
  await a.getByRole('button',{name:'Retry same submission',exact:true}).click();await settled(page);
  const commands=await page.evaluate(()=>window.__replyCommands);assert.equal(commands.length,2);assert.deepEqual(commands[1],commands[0]);assert.equal((await page.evaluate(()=>window.__clientRead())).reports[0].advisorReplies.length,1);
  await a.getByLabel('Reply to client',{exact:true}).fill('Second reply');await page.evaluate(()=>window.__failRead=true);await a.getByRole('button',{name:'Send reply',exact:true}).click();await settled(page);
  assert.equal(await a.getByRole('button',{name:'Send reply',exact:true}).isDisabled(),true,'A successful write plus failed read does not unlock another write');
  await a.getByRole('button',{name:'Reload latest',exact:true}).click();await settled(page);assert.equal(await a.getByRole('button',{name:'Send reply',exact:true}).isEnabled(),true);
  assert.equal((await page.evaluate(()=>window.__clientRead())).reports[0].advisorReplies.length,2);
 }));
}
