// Synthetic finite HTTP only. Importing/compiling this module opens no browser.
import {build} from 'esbuild';import path from 'node:path';import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const portal=fileURLToPath(new URL('../',import.meta.url)),origin='https://shelv-v3-guidance.invalid';
export const browserArtifacts=path.resolve(process.env.W3_GUIDANCE_BROWSER_ARTIFACTS??path.join(portal,'../../.local-artifacts/portal-rebuild/w3-v3-guidance-browser'));
export const guidanceChromeGrant={phase:'W3_V3_GUIDANCE_SYNTHETIC_CHROME',workspace:path.resolve(portal,'../..'),explicit:true,reference:process.env.W3_GUIDANCE_CHROME_GRANT??'coordinator-w3-v3-guidance-synthetic-chrome-9c5cac1b-20261031'};
export const ownedChromePids=new Set();const liveBrowsers=new Set();
function ownProcessRows(){
 const ids=new Set([process.pid]),pending=[process.pid];
 while(pending.length){const parent=pending.shift();let children='';try{children=execFileSync('pgrep',['-P',String(parent)],{encoding:'utf8'});}catch(error){if(error.status!==1)throw error;}
  for(const value of children.trim().split(/\s+/)){const pid=Number(value);if(pid>0&&!ids.has(pid)){ids.add(pid);pending.push(pid);}}
 }
 const rows=execFileSync('ps',['-p',[...ids].join(','),'-o','pid=,ppid=,lstart=,comm='],{encoding:'utf8'}).trim().split('\n').map(line=>{const m=line.trim().match(/^(\d+)\s+(\d+)\s+([A-Za-z]+\s+[A-Za-z]+\s+\d+\s+[\d:]+\s+\d+)\s+(.*)$/);return m?{pid:+m[1],ppid:+m[2],started:m[3],command:m[4]}:null;}).filter(Boolean);
 return rows;
}
function ownDescendants(){return ownProcessRows().filter(r=>/Google Chrome|Chromium/.test(r.command));}
const baselineRoot=new URL('../test-fixtures/guidance-baselines/',import.meta.url);
const baselineManifestHash='c2145f3917cf83a26cd78915eda569332337999ef1fe81d408e2e809dc9ff3bf';
/** Immutable test input only. The reader seam lets pure tests observe fail-closed file errors. */
export async function readGuidanceBaseline(sourceKey,{readFile=fs.readFile}={}){
 const manifestBytes=Buffer.from(await readFile(new URL('manifest.json',baselineRoot)));
 assert.equal(createHash('sha256').update(manifestBytes).digest('hex'),baselineManifestHash,'guidance baseline manifest hash mismatch');
 const manifest=JSON.parse(manifestBytes.toString('utf8')),entry=manifest.sources.find(s=>s.sourceCommit+':'+s.sourcePath===sourceKey);
 assert.ok(entry,'unknown guidance baseline source');
 const bytes=Buffer.from(await readFile(new URL(entry.fixture,baselineRoot)));
 assert.equal(bytes.length,entry.bytes,'guidance baseline byte count mismatch');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,'guidance baseline source hash mismatch');
 assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),entry.blob,'guidance baseline Git blob mismatch');
 return bytes.toString('utf8');
}
export async function prepareGuidanceBrowserSource({entry}={}){
 assert.ok(entry===undefined||entry==='default'||entry==='context','unknown guidance browser entry');
 const selectedEntry=entry??(process.env.W3_GUIDANCE_CONTEXT_BROWSER_ENTRY==='1'?'context':'default'),outdir=path.join(portal,'../../.local-artifacts/portal-rebuild/w3-v3-guidance/browser'),plugins=[];
 if(process.env.W3_GUIDANCE_BROWSER_CONTEXT_BASELINE==='1')plugins.push({name:'exact-c4-context-inputs',setup(b){b.onLoad({filter:/features\/plan\/(ClientPlan\.tsx|guidanceDecision\.ts)$/},async args=>({contents:await readGuidanceBaseline('c4d5a9e0ed86c2ca703f6e5d0ac73988a4f6af77:'+path.relative(path.resolve(portal,'../..'),args.path)),loader:args.path.endsWith('tsx')?'tsx':'ts'}));}});
 if(process.env.W3_GUIDANCE_BROWSER_OLD_COOKIE==='1')plugins.push({name:'exact-e093-cookie-pair',setup(b){b.onLoad({filter:/site\/auth\/(advisor-cookie-session|client-cookie-session)\.js$/},async args=>({contents:await readGuidanceBaseline('e093dd018d59bd1657297f0a7a186179e59d5fc3:'+path.relative(path.resolve(portal,'../..'),args.path)),loader:'js'}));}});
 const result=await build({absWorkingDir:portal,entryPoints:[selectedEntry==='context'?'tests/rebuild-plan-guidance-context-browser-entry.tsx':'tests/rebuild-plan-guidance-browser-entry.tsx'],entryNames:'rebuild-plan-guidance-browser-entry',outdir,tsconfig:'tsconfig.frontend.json',bundle:true,write:false,format:'esm',loader:{'.woff2':'file','.woff':'file'},assetNames:'fonts/[name]-[hash]',plugins});
 return new Map(result.outputFiles.map(f=>[path.relative(outdir,f.path),Buffer.from(f.contents)]));
}
export async function closeGuidanceBrowsers(){await Promise.all([...liveBrowsers].map(b=>b.close()));liveBrowsers.clear();}
/** Requires the actual new explicit coordinator grant; no native/Auth resources. */
export async function openGrantedGuidanceBrowser({grant=guidanceChromeGrant,view,respond,sessionReply,route='/plan?routine=morning',width=1440,reducedMotion='no-preference',reviewEnabled=true,initialMode='client',entry}){
 assert.equal(grant.phase,'W3_V3_GUIDANCE_SYNTHETIC_CHROME');assert.equal(grant.workspace,path.resolve(portal,'../..'));assert.equal(grant.explicit,true);assert.ok(['coordinator-w3-v3-guidance-synthetic-chrome-9c5cac1b-20261031','coordinator-w3-v3-g1-g2-browser-71c682d7-20261031','coordinator-w3-v3-current-cookie-target3-synthetic-chrome-20261031','coordinator-w3-ci-budget-diagnostic-synthetic-chrome-65363815-20261101'].includes(grant.reference));
 assert.equal(liveBrowsers.size,0,'serial browser custody');
 const files=await prepareGuidanceBrowserSource({entry}),{chromium}=await import('playwright-core');const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});liveBrowsers.add(browser);for(const row of ownDescendants())ownedChromePids.add(row.pid);
 let context;
 try{await fs.mkdir(browserArtifacts,{recursive:true});context=await browser.newContext({viewport:{width,height:960},serviceWorkers:'block',reducedMotion});await context.addInitScript(value=>Object.assign(window,value),{__guidanceInitialReviewEnabled:reviewEnabled,__guidanceInitialMode:initialMode});const page=await context.newPage(),unexpected=[],errors=[],calls=[],cancelled=[],diagnostics=[];
 page.setDefaultTimeout(5000);
 await context.route('**/*',async r=>{try{const req=r.request(),u=new URL(req.url());
  const image=view.plan.content.products.find(p=>p.imageUrl===req.url());if(image&&req.method()==='GET'&&u.origin==='https://portal.goshelv.com'&&/^\/maya\/(assets|images)\/[a-zA-Z0-9._-]+$/.test(u.pathname))return await r.fulfill({body:await fs.readFile(path.join(portal,'site',u.pathname)),contentType:u.pathname.endsWith('.png')?'image/png':u.pathname.endsWith('.webp')?'image/webp':'image/jpeg'});
  if(u.origin!==origin){unexpected.push(req.method()+' '+req.url());return await r.abort();}
  if(req.method()==='POST'&&['/api/client/reviews','/api/client/care'].includes(u.pathname)){assert.equal(req.headers()['x-shelv-csrf'],'v3-synthetic-csrf');assert.equal(req.headers().authorization,undefined);assert.equal(req.headers().apikey,undefined);const command=req.postDataJSON(),call={path:u.pathname,command,wire:req.postData()};calls.push(call);const answer=await respond(command,calls,u.pathname);if(answer){call.replyStatus=answer.status??200;call.replyCode=answer.json?.code??null;return await r.fulfill(answer);}unexpected.push(command.action);return await r.abort();}
  if(u.pathname==='/api/client/session'&&req.method()==='GET')return await r.fulfill({json:sessionReply?.()??{signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'v3-synthetic-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'}});
  if(u.pathname==='/api/client/logout'&&req.method()==='POST')return await r.fulfill({json:{signedOut:true}});
  if(req.method()==='GET'&&u.pathname.startsWith('/plan'))return await r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/rebuild-plan-guidance-browser-entry.css"><div id="root"></div><script type="module" src="/rebuild-plan-guidance-browser-entry.js"></script></html>'});
  const bytes=files.get(u.pathname.slice(1));if(req.method()==='GET'&&bytes)return await r.fulfill({body:bytes,contentType:u.pathname.endsWith('.js')?'text/javascript':u.pathname.endsWith('.css')?'text/css':'font/woff2'});
  unexpected.push(req.method()+' '+u.pathname);await r.abort();
 }catch(e){if(/closed|disposed|canceled|cancelled|interrupted/.test(e.message))cancelled.push(e.message);else{errors.push(e.message);try{await r.abort();}catch{}}}});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('W3_HYDRATION_ERROR'))diagnostics.push(m.text());if(m.type()==='error'&&!m.text().startsWith('Failed to load resource: the server responded with a status of '))errors.push(m.text());});
 let closed=false;const result={page,calls,origin,errors,unexpected,cancelled,diagnostics,async close(){if(closed)return;closed=true;try{await page.evaluate(()=>{const h=window.__guidanceHarness;h?.controller.dispose();h?.navigator.dispose();h?.runtime.dispose();});}catch{}finally{await context.close();await browser.close();liveBrowsers.delete(browser);}assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);}};
 await page.goto(origin+route,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof window.__guidanceHarness?.setMode==='function');return result;
 }catch(e){await context?.close();await browser.close();liveBrowsers.delete(browser);throw e;}
}
export function ownBrowserInventory(){const current=ownDescendants();return{at:new Date().toISOString(),nodePid:process.pid,trackedChromePids:[...ownedChromePids],liveBrowsers:liveBrowsers.size,ownChrome:current,ownedProcesses:ownProcessRows()};}
