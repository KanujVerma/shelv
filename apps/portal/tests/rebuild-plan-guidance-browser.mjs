// Source-only preparation is safe to import. No browser or resource is opened.
import {build} from 'esbuild';import path from 'node:path';import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const portal=fileURLToPath(new URL('../',import.meta.url)),origin='https://shelv-v3-guidance.invalid';
export async function prepareGuidanceBrowserSource(){const result=await build({absWorkingDir:portal,entryPoints:['tests/rebuild-plan-guidance-browser-entry.tsx'],outdir:path.join(portal,'../../.local-artifacts/portal-rebuild/w3-v3-guidance/browser'),tsconfig:'tsconfig.frontend.json',bundle:true,write:false,format:'esm',loader:{'.woff2':'file','.woff':'file'},assetNames:'fonts/[name]-[hash]'});return new Map(result.outputFiles.map(f=>[path.relative(path.join(portal,'../../.local-artifacts/portal-rebuild/w3-v3-guidance/browser'),f.path),Buffer.from(f.contents)]));}
/** Calling this requires a fresh explicit coordinator allocation. The caller
 * supplies its actual grant receipt; preparation alone never calls it. */
export async function openGrantedGuidanceBrowser({grant,view,respond}){
 assert.equal(grant?.phase,'W3_V3_GUIDANCE_SYNTHETIC_CHROME');assert.equal(grant?.workspace,path.resolve(portal,'../..'));assert.equal(grant?.explicit,true);assert.ok(grant?.reference);
 const files=await prepareGuidanceBrowserSource(),{chromium}=await import('playwright-core');const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});
 const context=await browser.newContext({viewport:{width:1440,height:960},serviceWorkers:'block'}),page=await context.newPage(),unexpected=[],errors=[],calls=[];
 await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());
  const image=view.plan.content.products.find(p=>p.imageUrl===r.url());if(image&&r.method()==='GET'&&u.origin==='https://portal.goshelv.com'&&/^\/maya\/(assets|images)\/[a-zA-Z0-9._-]+$/.test(u.pathname))return route.fulfill({body:await fs.readFile(path.join(portal,'site',u.pathname)),contentType:'image/png'});
  if(u.origin!==origin){unexpected.push(r.method()+' '+r.url());return route.abort();}
  if(r.method()==='POST'&&['/api/client/reviews','/api/client/care'].includes(u.pathname)){assert.equal(r.headers()['x-shelv-csrf'],'v3-synthetic-csrf');const command=r.postDataJSON();calls.push({path:u.pathname,command,wire:r.postData()});const answer=await respond(command,calls);if(answer)return route.fulfill(answer);unexpected.push(command.action);return route.abort();}
  if(u.pathname==='/api/client/session'&&r.method()==='GET')return route.fulfill({json:{signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'v3-synthetic-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'}});
  if(u.pathname==='/api/client/logout'&&r.method()==='POST')return route.fulfill({json:{signedOut:true}});
  if(r.method()==='GET'&&u.pathname.startsWith('/plan'))return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/rebuild-plan-guidance-browser-entry.css"><div id="root"></div><script type="module" src="/rebuild-plan-guidance-browser-entry.js"></script></html>'});
  const bytes=files.get(u.pathname.slice(1));if(r.method()==='GET'&&bytes)return route.fulfill({body:bytes,contentType:u.pathname.endsWith('.js')?'text/javascript':u.pathname.endsWith('.css')?'text/css':'font/woff2'});
  unexpected.push(r.method()+' '+u.pathname);return route.abort();
 });page.on('pageerror',e=>errors.push(e.message));
 return {page,calls,origin,async close(){await context.close();await browser.close();assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);}};
}
