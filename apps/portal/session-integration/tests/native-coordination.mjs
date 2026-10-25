import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const runtime=path.join(root,'session-integration/runtime'),evidence=path.join(root,'evidence/session-contract-recovery');
await mkdir(path.join(runtime,'evidence'),{recursive:true});await mkdir(evidence,{recursive:true});
const child=spawn(process.execPath,['tests/native-browser-server.mjs'],{cwd:runtime,stdio:['ignore','pipe','pipe']});
let browser;let stderr='';child.stderr.on('data',b=>stderr+=b);
try {
 const origin=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Native fixture startup timed out')),10000);child.once('exit',code=>{clearTimeout(timer);reject(Error('Native fixture exited '+code));});child.stdout.on('data',b=>{text+=b;const match=text.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});});
 const status=async()=>{const response=await fetch(origin+'/status');assert.equal(response.status,200);return response.json();};
 browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext();
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const holder=await context.newPage(),waiter=await context.newPage();await holder.goto(origin+'/?role=holder');await waiter.goto(origin+'/?role=waiter');
 await expect(holder.locator('#capability')).toHaveText('Native Web Locks: available');await holder.click('#prepare');
 await expect.poll(async()=>(await status()).events.some(e=>e.type==='bootstrap-enter'&&e.role==='holder')).toBe(true);
 await waiter.click('#prepare');await expect(waiter.locator('#actions')).toContainText('prepare: pending');
 assert.equal((await status()).events.filter(e=>e.type==='bootstrap-enter').length,1);
 await fetch(origin+'/release-bootstrap',{method:'POST'});await expect(holder.locator('#actions')).toContainText('prepare: passed');await expect(waiter.locator('#actions')).toContainText('prepare: passed');
 await holder.click('#upgrade');await expect.poll(async()=>(await status()).events.some(e=>e.type==='login-enter')).toBe(true);
 await waiter.click('#logout');await expect(waiter.locator('#actions')).toContainText('logout: pending');assert.equal((await status()).events.some(e=>e.type==='logout-context'),false);
 await fetch(origin+'/release-login',{method:'POST'});await expect(holder.locator('#actions')).toContainText('synthetic login: passed');await expect(waiter.locator('#actions')).toContainText('logout: passed');
 await holder.click('#unsupported');await expect(holder.locator('#actions')).toContainText('unsupported locks: passed');
 const result=await status();assert.equal(Object.keys(result.checks).length,6);assert.ok(Object.values(result.checks).every(v=>v===true),JSON.stringify(result.checks));
 await writeFile(path.join(evidence,'NATIVE-COORDINATION.json'),JSON.stringify({scope:'Real Chrome Web Locks/cookies with production adapter and localhost synthetic HTTP fixture; no hosted acceptance',...result},null,2)+'\n');
 console.log(JSON.stringify({ok:true,nativeChecks:6,checks:result.checks}));
} finally {
 await browser?.close();child.kill('SIGINT');await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill('SIGTERM');resolve();},3000);child.once('exit',()=>{clearTimeout(timer);resolve();});});
 if(stderr)process.stderr.write(stderr);
}
