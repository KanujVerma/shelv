import assert from 'node:assert/strict';
import {readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {chromium} from 'playwright-core';
import {attestFixture} from '../scripts/rebuild-native-fixture.mjs';
import {portalOrigin,sha} from '../scripts/rebuild-native-boundary.mjs';
import {closeProviderSession} from '../scripts/rebuild-native-cases.mjs';
import {connectedStack,sourceRoot,artifacts,mailSnapshot,captureCallback} from './rebuild-native-stack.mjs';

assert.equal(process.env.SHELV_REBUILD_NATIVE_BROWSER,'1');assert.equal(process.env.SHELV_REBUILD_NATIVE,'1');
const f=await attestFixture(sourceRoot),stack=await connectedStack(f),originals=await f.readPrivate('PLAN-IDENTITIES.private.json');
const selectedRun=process.env.SHELV_REBUILD_NATIVE_CASE_RUN;
if(selectedRun)assert.match(selectedRun,/^[0-9a-f-]{36}$/);
const prior=JSON.parse(await readFile(path.join(artifacts,selectedRun?'browser-result-'+selectedRun+'.json':'browser-result.json'),'utf8'));
const identitiesFile=path.join(f.directory,'edge/w6/identities-'+prior.runId+'.private.json');assert.equal((await stat(identitiesFile)).mode&0o077,0);
const owned=JSON.parse(await readFile(identitiesFile,'utf8')),other=owned.identities.find(x=>x.kind==='other'),viewer=owned.identities.find(x=>x.kind==='viewer');
assert.equal(viewer.id,prior.ownedViewerId);assert.ok(viewer.email.endsWith('.invalid'));assert.match(viewer.id,/^[0-9a-f-]{36}$/);
const result={kind:'genuine-readonly-browser-and-negatives',runId:randomUUID(),status:'RUNNING',checks:[],localEmails:0,realEmails:0,hostedRequests:0};
const contexts=[];let browser,phase='setup',release;
async function login(identity,audience,index,preparation=false) {
  phase='PKCE '+audience;
  const context=await browser.newContext({viewport:{width:1440,height:960},serviceWorkers:'block'});contexts.push(context);await stack.bind(context,index);
  const page=await context.newPage();page.setDefaultTimeout(10000);
  const route=audience==='advisor'?'/advisor/clients':'/plan';
  await page.goto(portalOrigin+route);await page.getByRole('textbox',{name:'email',exact:true}).fill(identity.email);
  const before=await mailSnapshot();await page.getByRole('button',{name:'send sign-in link',exact:true}).click();await page.getByText('check your email',{exact:true}).waitFor();
  let callback=await captureCallback(identity.email,before,route);result.localEmails+=callback.localEmails;await page.goto(callback.url);callback=null;
  await page.waitForURL(portalOrigin+route);
  if(audience==='advisor')await page.getByRole('heading',{name:'clients',exact:true}).waitFor();
  else if(preparation)await page.getByText('your plan is being prepared',{exact:true}).waitFor();
  else await page.getByRole('heading',{name:'your current routine',exact:true}).waitFor();
  const cookie=(await context.cookies()).find(x=>x.name==='__Host-shelv_'+audience);assert.ok(cookie?.secure&&cookie.httpOnly&&cookie.sameSite==='Lax');
  return page;
}
async function command(page,audience,body,headers={}) {return page.evaluate(async({audience,body,headers})=>{const session=await(await fetch('/api/'+audience+'/session')).json();const r=await fetch('/api/'+audience+'/plans',{method:'POST',headers:{'content-type':'application/json','x-shelv-csrf':session.csrf,...headers},body:JSON.stringify(body)});return{status:r.status,value:await r.json()};},{audience,body,headers});}
const read={schemaVersion:1,action:'read_client_plan_v1',version:null};
const snapshot=()=>sha(f.sql(`select jsonb_build_object('case',(select to_jsonb(c) from concierge.cases c where client_id='${originals.client.id}'),'pubs',(select jsonb_agg(to_jsonb(p) order by version) from concierge.publications p where client_id='${originals.client.id}'),'starts',(select jsonb_agg(to_jsonb(a) order by id) from concierge.activations a where client_id='${originals.client.id}'),'service',(select jsonb_agg(to_jsonb(s) order by claim_id) from concierge.service_periods s where client_id='${originals.client.id}'))`));
const beforeHash=snapshot();
try {
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});
  const client=await login(originals.client,'client',11);
  phase='entitled read';let r=await command(client,'client',read);assert.equal(r.status,200);assert.equal(r.value.access,'active');assert.ok(r.value.plan.version>=1);assert.deepEqual(r.value.actualUse,[]);assert.ok(!JSON.stringify(r.value).includes('PRIVATE_REAL_AUTH_CANARY'));assert.ok(!(await client.locator('body').innerText()).includes('PRIVATE_REAL_AUTH_CANARY'));
  await client.reload();await client.getByRole('heading',{name:'your current routine',exact:true}).waitFor();
  result.checks.push('Genuine client app PKCE/cookie/live context/entitled native plan read and reload, private API/DOM exclusion, no Start');
  phase='owner audience csrf';
  assert.equal((await command(client,'client',{...read,clientId:other.id})).status,400);
  assert.equal((await command(client,'client',read,{'x-shelv-csrf':'wrong'})).status,403);
  assert.equal((await command(client,'advisor',{schemaVersion:1,action:'list_plans_v1',clientId:null,cursor:null,limit:25})).status,401);
  const otherPage=await login(other,'client',12,true);r=await command(otherPage,'client',read);assert.equal(r.status,200);assert.equal(r.value.plan,null);
  result.checks.push('Actual cookie owner inference, wrong CSRF and wrong audience reject; second genuine owner receives only preparation');
  phase='viewer role denial';const view=await login(viewer,'advisor',13);assert.equal(await view.getByRole('button',{name:'new plan',exact:true}).count(),0);
  assert.equal((await command(view,'advisor',{schemaVersion:1,action:'create_draft_v1',requestId:randomUUID(),kind:'care_plan',templateVersionId:null})).status,403);
  await new Promise(resolve=>setTimeout(resolve,1100)); // Existing local Auth email max_frequency is 1s.
  phase='fresh viewer live role revoke';const fresh=await login(viewer,'advisor',14);
  assert.equal(f.sql(`select active from concierge.advisors where user_id='${viewer.id}'`),'t');f.sql(`update concierge.advisors set active=false where user_id='${viewer.id}'`);
  await fresh.reload();await fresh.getByRole('button',{name:'send sign-in link',exact:true}).waitFor();
  result.checks.push('Actual view-only human cannot create; revocation of only its new owned local grant ends a fresh genuine browser session');
  phase='late real reply logout';const held=stack.hold('read_client_plan_v1');release=held.release;
  const late=command(client,'client',read).catch(()=>({status:0}));let timer;
  try{await Promise.race([held.entered,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('hold not entered')),15000))]);}finally{clearTimeout(timer);}
  const logoutCommitted=client.waitForResponse(response=>new URL(response.url()).pathname==='/api/client/logout'&&response.request().method()==='POST');
  await client.getByRole('button',{name:'sign out',exact:true}).click();await client.getByRole('button',{name:'send sign-in link',exact:true}).waitFor();assert.equal((await logoutCommitted).status(),200);held.release();release=null;const lateResponse=await late;result.lateStatus=lateResponse.status;assert.ok([401,403].includes(lateResponse.status));
  phase='actual provider revocation';const item=[...stack.issued.values()].find(x=>x.ownerId===other.id&&!x.closed);assert.ok(item);await closeProviderSession(f,item);await otherPage.reload();await otherPage.getByRole('button',{name:'send sign-in link',exact:true}).waitFor();
  result.checks.push('Actual app logout rejects held genuine backend reply; supported provider logout invalidates another real browser cookie');
  assert.equal(snapshot(),beforeHash);result.originalStateSha256=beforeHash;assert.deepEqual(stack.errors,[]);assert.equal(stack.browserScan.credentialLeaks,0);assert.equal(stack.browserScan.privateFactLeaks,0);
  result.status='PASS';
}catch(error){result.status='FAIL';result.failure={phase,type:error.name};}
finally {
  release?.();for(const c of contexts)await c.close().catch(()=>{});await browser?.close().catch(()=>{});
  try{result.cleanup=await stack.cleanup();}catch{result.status='FAIL';result.cleanup='FAILED';}
  result.sessionIds=[...stack.issued.values()].map(x=>({id:x.id,ownerId:x.ownerId,closed:x.closed}));result.browserResponseScan=stack.browserScan;result.errors=stack.errors;result.calls=stack.calls;
  await stack.dispose();await writeFile(path.join(artifacts,'readonly-browser-result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});await writeFile(path.join(artifacts,'readonly-browser-result-'+result.runId+'.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
}
console.log(JSON.stringify({...result,calls:result.calls.length}));if(result.status!=='PASS')process.exitCode=1;
