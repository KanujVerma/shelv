/** Account NAME capability only. Importing this module acquires no resources.
 * Parent drives T3 preview first. Playwright execution requires a separately
 * authorized fallback and a NEW incognito Page, never launch/attach here.
 * No OperationPort, Auth/session injection, SQL write, or success interception.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat,realpath,writeFile,chmod} from 'node:fs/promises';
import path from 'node:path';

export const accountNameActions=Object.freeze([
  ['ordinary-login','/account','email','send sign-in link','check your email'],
  ['own-name','profile & contact','dl dt(name) + dd','read current details'],
  ['edit','edit details','dialog:edit details','form:edit your name','name','save name'],
  ['persist','canonical profile reread','refresh','edit details','name'],
  ['fresh-login','sign out','email','send sign-in link','Mailpit PKCE','/account'],
  ['isolation','B ordinary login','B distinct own name','no A marker','extra selector 400/no effects'],
  ['late-response','hold ACTUAL profile-read response','sign out','release unchanged','private UI stays empty'],
]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sha=value=>createHash('sha256').update(value).digest('hex');
const exact=(value,keys)=>assert.deepEqual(Object.keys(value).sort(),[...keys].sort(),'noncanonical keys');
const inside=(parent,child)=>child!==parent && child.startsWith(parent+path.sep);
function noCredentials(value){
  if(!value || typeof value!=='object')return;
  for(const [key,item] of Object.entries(value)){
    assert.ok(!/^(?:access_?token|refresh_?token|service_?role_?key|password|cookie|authorization|secret)$/i.test(key),'credential in public descriptor');
    noCredentials(item);
  }
}
export function validateDescriptor(d){
  assert.equal(d?.schemaVersion,1);assert.match(d.ownerId,uuid);
  assert.match(d.sourceCommit,/^[0-9a-f]{40}$/);assert.match(d.projectId,/^[a-z0-9][a-z0-9-]{3,100}$/);
  for(const name of ['fixtureDirectory','privateDirectory']){
    assert.ok(path.isAbsolute(d[name]));assert.equal(path.normalize(d[name]),d[name]);
  }
  assert.ok(inside(d.fixtureDirectory,d.privateDirectory),'private directory must be within fixture');
  const endpoints=[];
  for(const [key,scheme] of [['portal','https:'],['supabase','https:'],['mailpit','http:']]){
    const raw=d.endpoints?.[key],u=new URL(raw);
    assert.equal(u.protocol,scheme);assert.equal(u.hostname,'127.0.0.1');assert.ok(u.port);
    assert.equal(u.username,'');assert.equal(u.password,'');assert.equal(u.search,'');assert.equal(u.hash,'');
    assert.equal(u.pathname,'/');assert.equal(raw,u.origin,'endpoint must be a literal origin without normalized spelling');endpoints.push(u.origin);
  }
  assert.equal(new Set(endpoints).size,3);
  for(const actor of [d.actors?.a,d.actors?.b]){
    assert.match(actor?.id,uuid);assert.match(actor.email,/^[^\s@]+@[^\s@]+\.invalid$/);
    assert.equal(typeof actor.initialDisplayName,'string');assert.ok(actor.initialDisplayName.trim());
  }
  assert.notEqual(d.actors.a.id,d.actors.b.id);assert.notEqual(d.actors.a.email,d.actors.b.email);
  assert.notEqual(d.actors.a.initialDisplayName,d.actors.b.initialDisplayName);noCredentials(d);
  return d; // Descriptor is observations only, never an execution grant.
}
export function validateCandidate(name){
  assert.equal(typeof name,'string');assert.ok(!name.includes('\0'));
  for(const c of name)assert.ok(c.codePointAt(0)<0xd800 || c.codePointAt(0)>0xdfff);
  assert.ok(name!==name.trim() && /\S {2,}\S/u.test(name.trim()) && /[^\x00-\x7f]/u.test(name));
  assert.ok(Array.from(name.trim()).length>=1 && Array.from(name.trim()).length<=200);
  return name;
}
export function assertPrivateScan(bytes,privateStrings){
  assert.ok(Array.isArray(privateStrings)&&privateStrings.length>0,'exact private inventory missing');
  const haystack=Buffer.from(bytes);
  for(let index=0;index<privateStrings.length;index++){
    const value=privateStrings[index];assert.equal(typeof value,'string');assert.ok(value.length>0);
    const utf16=value.split('').map(c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')).join('');
    for(const candidate of new Set([value,encodeURIComponent(value),Buffer.from(value).toString('base64'),
      JSON.stringify(value).slice(1,-1),utf16,utf16.toUpperCase().replaceAll('\\U','\\u')])){
      assert.ok(!haystack.includes(Buffer.from(candidate)),`private inventory item ${index} leaked`);
    }
  }
}
export function assertProfile(body,{displayName,profileRevision}){
  exact(body,['schemaVersion','profileRevision','displayName','currentEmail']);assert.equal(body.schemaVersion,1);
  assert.equal(body.displayName,displayName);assert.ok(Number.isSafeInteger(body.profileRevision)&&body.profileRevision>=0);
  if(profileRevision!==undefined)assert.equal(body.profileRevision,profileRevision);
  const email=body.currentEmail;
  if(email.state==='known'){exact(email,['state','address','verified']);assert.equal(typeof email.address,'string');assert.equal(typeof email.verified,'boolean');}
  else {exact(email,['state']);assert.equal(email.state,'unknown');}
  return body;
}
export function assertDenial(response,status){
  assert.equal(response.status,status);exact(response.body,['code']);
  const codes={400:['invalid_request','invalid_input'],401:['session_ended'],403:['forbidden','action_forbidden','origin_rejected','csrf_rejected']};
  assert.ok(codes[status]?.includes(response.body.code),'unexpected denial namespace');
}
export function assertSameRelease(original,released){
  assert.equal(released.status,original.status);assert.deepEqual(released.headers,original.headers);
  assert.ok(Buffer.from(original.body).equals(Buffer.from(released.body)),'changed held bytes');
}

/** Real local Mailpit only. Reads fresh messages; never creates an Auth session.
 * Interface intentionally independent of pending prepareLocalBindings ABI.
 */
export function createLocalMailpitHelper(descriptor){
  const d=validateDescriptor(descriptor),base=d.endpoints.mailpit;
  async function json(suffix){const r=await fetch(base+suffix,{redirect:'error',signal:AbortSignal.timeout(10000)});assert.equal(r.status,200);return r.json();}
  return {
    async snapshot(){const list=await json('/api/v1/messages');assert.ok(Array.isArray(list.messages));return list.messages.map(m=>m.ID);},
    async signInLink(email,before){
      assert.ok([d.actors.a.email,d.actors.b.email].includes(email));const end=Date.now()+20000;
      while(Date.now()<end){
        const list=await json('/api/v1/messages'),matches=[];
        for(const item of list.messages.filter(m=>!before.includes(m.ID))){
          const message=await json('/api/v1/message/'+encodeURIComponent(item.ID));
          if(message.To?.some(to=>to.Address===email))matches.push({id:item.ID,message});
        }
        assert.ok(matches.length<=1,'ambiguous fresh Mailpit messages');
        if(matches.length===1){
          const {id,message}=matches[0];
          const links=[...(message.HTML??message.Text??'').matchAll(/https?:[^\s"<>]+/g)]
            .map(m=>m[0].replaceAll('&amp;','&')).filter(raw=>{const u=new URL(raw);return u.origin===d.endpoints.supabase&&u.pathname==='/auth/v1/verify';});
          assert.ok(links.length>0,'real GoTrue verification link missing');
          const u=new URL(links[0]);assert.equal(u.username,'');assert.equal(u.password,'');
          const redirect=new URL(u.searchParams.get('redirect_to'));assert.equal(redirect.origin,d.endpoints.portal);
          assert.equal(redirect.pathname,'/orders');assert.equal(redirect.search,'');assert.equal(redirect.hash,'');
          return {url:u.href,messageId:id};
        }
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      throw new Error('BLOCKER: no new own Mailpit sign-in message within 20s');
    },
  };
}

async function privateDirectory(d,directory){
  assert.ok(inside(d.privateDirectory,directory),'evidence must be within owned private directory');
  for(const p of [d.fixtureDirectory,d.privateDirectory,directory]){
    const s=await lstat(p);assert.ok(s.isDirectory()&&!s.isSymbolicLink());assert.equal(await realpath(p),p);
  }
  assert.equal((await lstat(directory)).mode&0o077,0,'private evidence directory mode');
}
async function persist(directory,name,value){
  const file=path.join(directory,name);await writeFile(file,value,{flag:'wx',mode:0o600});await chmod(file,0o600);return file;
}
function nameCell(page){return page.locator('dl > div').filter({has:page.locator('dt',{hasText:/^name$/})}).locator('dd');}
async function exactValue(locator,expected){
  await locator.waitFor({state:'visible'});
  const actual=await locator.inputValue();assert.equal(actual,expected,'input must preserve exact Unicode/spaces');
}
async function summary(page,expected){
  await page.waitForFunction(expected=>[...document.querySelectorAll('dl > div')].some(row=>
    row.querySelector('dt')?.textContent==='name' && row.querySelector('dd')?.textContent===expected),expected);
  await nameCell(page).waitFor({state:'visible'});assert.equal(await nameCell(page).textContent(),expected);
}
function profileResponse(response,action){
  if(new URL(response.url()).pathname!=='/api/client/account-profile')return false;
  try{return response.request().postDataJSON().action===action;}catch{return false;}
}
async function viewResponse(response){
  assert.equal(response.status(),200);assert.match((await response.allHeaders())['cache-control']??'',/no-store/);
  return response.json();
}
/** Only ordinary same-origin browser fetch, using its actual own session/CSRF.
 * Nothing is written into cookies, storage, Auth, or runtime state.
 */
async function probe(page,command,{csrf=true,origin}={}){
  const result=await page.evaluate(async({command,csrf,origin})=>{
    let token;
    if(typeof csrf==='string')token=csrf;else if(csrf){const session=await fetch('/api/client/session',{credentials:'same-origin',cache:'no-store'});if(session.status!==200)throw new Error('own session unavailable');token=(await session.json()).csrf;}
    const r=await fetch(origin??'/api/client/account-profile',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',
      headers:{'Content-Type':'application/json',...(csrf?{'X-Shelv-CSRF':token}:{})},body:JSON.stringify(command)});
    return {status:r.status,headers:Object.fromEntries(r.headers),body:await r.json()};
  },{command,csrf,origin});
  assert.match(result.headers['cache-control']??'',/no-store/);return result;
}
async function login(page,d,actor,mailpit,observations){
  await page.waitForLoadState('networkidle',{timeout:10000});
  await page.goto(d.endpoints.portal+'/account');
  await page.waitForLoadState('networkidle',{timeout:10000});await page.getByLabel('email',{exact:true}).waitFor({state:'visible'});
  const before=await mailpit.snapshot();await page.getByLabel('email',{exact:true}).fill(actor.email);
  const requested=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/client/auth/request');
  await page.getByRole('button',{name:'send sign-in link',exact:true}).click();assert.equal((await requested).status(),200);
  await page.getByText('check your email',{exact:true}).waitFor({state:'visible'});
  const link=await mailpit.signInLink(actor.email,before),verify=new URL(link.url);
  assert.equal(verify.origin,d.endpoints.supabase);assert.equal(verify.pathname,'/auth/v1/verify');
  assert.equal(verify.username,'');assert.equal(verify.password,'');
  observations.push({kind:'mailpit',actor:actor.id,messageId:link.messageId});
  const completed=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/client/auth/complete');
  await page.goto(link.url);const auth=await completed;assert.equal(auth.status(),200);
  const session=await auth.json();assert.equal(session.ownerId,actor.id);
  const cookies=(await auth.allHeaders())['set-cookie']??'';assert.match(cookies,/__Host-shelv_client=/);assert.match(cookies,/HttpOnly/i);assert.match(cookies,/Secure/i);assert.match(cookies,/SameSite=Lax/i);
  await page.waitForURL(d.endpoints.portal+'/account');assert.equal(new URL(page.url()).search,'');
  await page.waitForLoadState('networkidle',{timeout:10000});
  const cookie=(await page.context().cookies([d.endpoints.portal])).find(c=>c.name==='__Host-shelv_client');assert.ok(cookie,'actual login cookie missing');
  const read=page.waitForResponse(async r=>{if(!profileResponse(r,'read_account_profile_v1'))return false;const h=await r.request().allHeaders();return (h.cookie??'').split(';').map(x=>x.trim()).includes('__Host-shelv_client='+cookie.value);});
  await page.getByRole('button',{name:'read current details',exact:true}).click();
  return viewResponse(await read);
}
async function logout(page,markers){
  const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/client/logout');
  await page.getByRole('button',{name:'sign out',exact:true}).click();assert.equal((await response).status(),200);
  await page.getByLabel('email',{exact:true}).waitFor({state:'visible'});await page.waitForLoadState('networkidle',{timeout:10000});
  const text=await page.locator('body').textContent();for(const marker of markers)assert.ok(!text.includes(marker),'private UI survived logout');
}

async function bounded(promise,milliseconds,message){
  let timer;
  try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error(message)),milliseconds))]);}
  finally{clearTimeout(timer);}
}

/** Caller must supply an actually granted fresh incognito Page and owner-issued
 * exact private inventory (keys/access/refresh credentials + private canaries).
 * A returned observation is NOT independent acceptance or a lifecycle receipt.
 */
export async function runAccountNameScenario({page,descriptor,privateEvidenceDirectory,privateStrings,
  displayName=`  Zoë  e\u0301 🧴 ${descriptor?.ownerId}  `,expectedInitialDisplayName,mailpit}){
  const d=validateDescriptor(descriptor);validateCandidate(displayName);assertPrivateScan(Buffer.alloc(0),privateStrings);
  await privateDirectory(d,privateEvidenceDirectory);assert.equal(page.url(),'about:blank','new blank incognito page required');
  assert.deepEqual(await page.context().cookies([d.endpoints.portal,d.endpoints.supabase]),[],'context already has fixture cookies');
  const sink=mailpit??createLocalMailpitHelper(d),observations=[],pending=new Set(),network=[],errors=[];
  const record=response=>{
    if(new URL(response.url()).origin!==d.endpoints.portal)return;
    const task=(async()=>{
      const body=await response.body(),headers=await response.allHeaders();
      assertPrivateScan(Buffer.concat([body,Buffer.from(JSON.stringify(headers))]),privateStrings);
      network.push({path:new URL(response.url()).pathname,status:response.status(),headers,
        request:response.request().postData(),body:body.toString('base64'),sha256:sha(body),at:new Date().toISOString()});
    })().catch(error=>errors.push(error)).finally(()=>pending.delete(task));pending.add(task);
  };
  page.on('response',record);
  await page.context().tracing.start({screenshots:true,snapshots:true,sources:true});
  const screenshot=async label=>{
    assertPrivateScan(Buffer.from(await page.locator('body').textContent()),privateStrings);
    const file=path.join(privateEvidenceDirectory,label+'.png');await page.screenshot({path:file,fullPage:true});await chmod(file,0o600);
    observations.push({kind:'screenshot',file,sha256:sha(await (await import('node:fs/promises')).readFile(file))});
  };
  try{
    const a=await login(page,d,d.actors.a,sink,observations);assertProfile(a,{displayName:expectedInitialDisplayName??d.actors.a.initialDisplayName});
    await summary(page,a.displayName);await screenshot('01-a-initial');
    await page.getByRole('button',{name:'edit details',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'edit details',exact:true}),form=dialog.getByRole('form',{name:'edit your name',exact:true});
    const input=form.getByLabel('name',{exact:true});await exactValue(input,a.displayName);await input.fill(displayName);await exactValue(input,displayName);
    const saved=page.waitForResponse(r=>profileResponse(r,'set_account_display_name_v1'));
    const reread=page.waitForResponse(r=>profileResponse(r,'read_account_profile_v1'));
    await form.getByRole('button',{name:'save name',exact:true}).click();
    const savedResponse=await saved,command=savedResponse.request().postDataJSON(),receipt=await viewResponse(savedResponse);
    assert.equal(command.displayName,displayName);assert.equal(command.expectedRevision,a.profileRevision);assert.match(command.requestId,uuid);
    exact(receipt,['schemaVersion','action','requestId','previousRevision','revision','displayName','recordedAt']);
    assert.equal(receipt.schemaVersion,1);assert.equal(receipt.action,'set_account_display_name_v1');
    assert.ok(Number.isFinite(Date.parse(receipt.recordedAt)),'actual receipt time missing');
    assert.equal(receipt.requestId,command.requestId);assert.equal(receipt.displayName,displayName);assert.equal(receipt.previousRevision,a.profileRevision);
    assert.equal(receipt.revision,a.profileRevision+1);
    const canonical=assertProfile(await viewResponse(await reread),{displayName,profileRevision:receipt.revision});
    observations.push({kind:'ui-save',actor:d.actors.a.id,command,receipt,canonical});
    await dialog.getByRole('button',{name:'close',exact:true}).click();await summary(page,displayName);await screenshot('02-a-saved');
    const refreshed=page.waitForResponse(r=>profileResponse(r,'read_account_profile_v1'));await page.reload();
    assertProfile(await viewResponse(await refreshed),canonical);await summary(page,displayName);
    await page.getByRole('button',{name:'edit details',exact:true}).click();await exactValue(page.getByRole('form',{name:'edit your name'}).getByLabel('name',{exact:true}),displayName);
    await page.getByRole('dialog',{name:'edit details'}).getByRole('button',{name:'close',exact:true}).click();await screenshot('03-a-refreshed');
    await page.waitForLoadState('networkidle',{timeout:10000});await Promise.all([...pending]);await logout(page,[displayName,d.actors.a.initialDisplayName]);
    assertProfile(await login(page,d,d.actors.a,sink,observations),canonical);await summary(page,displayName);await screenshot('04-a-fresh-login');
    await page.getByRole('button',{name:'edit details',exact:true}).click();await exactValue(page.getByRole('form',{name:'edit your name'}).getByLabel('name',{exact:true}),displayName);
    await page.getByRole('dialog',{name:'edit details'}).getByRole('button',{name:'close',exact:true}).click();
    await page.waitForLoadState('networkidle',{timeout:10000});await Promise.all([...pending]);await logout(page,[displayName,d.actors.a.initialDisplayName]);
    await Promise.all([...pending]);
    const bStart=network.length,b=await login(page,d,d.actors.b,sink,observations);assertProfile(b,{displayName:d.actors.b.initialDisplayName});
    await summary(page,b.displayName);await screenshot('05-b-own-name');
    // Actual browser/gateway selector denial; no SQL or privileged credential.
    for(const selector of ['clientId','ownerId']){
      const bad={schemaVersion:1,action:'set_account_display_name_v1',requestId:crypto.randomUUID(),expectedRevision:b.profileRevision,displayName:'forbidden mutation', [selector]:d.actors.a.id};
      const denial=await probe(page,bad);assertDenial(denial,400);observations.push({kind:'selector-denial',selector,actor:d.actors.b.id,command:bad,response:denial});
    }
    const bAfter=await probe(page,{schemaVersion:1,action:'read_account_profile_v1'});assert.equal(bAfter.status,200);assertProfile(bAfter.body,b);
    const csrfDenied=await probe(page,{schemaVersion:1,action:'read_account_profile_v1'},{csrf:false});assertDenial(csrfDenied,403);observations.push({kind:'csrf-denial',response:csrfDenied});
    await Promise.all([...pending]);
    for(const entry of network.slice(bStart))assertPrivateScan(Buffer.concat([
      Buffer.from(entry.body,'base64'),Buffer.from(JSON.stringify(entry.headers))]),[displayName,d.actors.a.initialDisplayName,d.actors.a.id]);
    const endedCsrf=await page.evaluate(async()=>{const r=await fetch('/api/client/session',{credentials:'same-origin',cache:'no-store'});if(r.status!==200)throw Error('current own session unavailable');return (await r.json()).csrf;});
    await logout(page,[displayName,d.actors.a.initialDisplayName,b.displayName]);
    const signedOut=await probe(page,{schemaVersion:1,action:'read_account_profile_v1'},{csrf:endedCsrf});assertDenial(signedOut,401);
    observations.push({kind:'signed-out-denial',response:signedOut});
    assertProfile(await login(page,d,d.actors.a,sink,observations),canonical);await summary(page,displayName);
    // Left signed in only for the separately granted actual-byte delay schedule.
    return {status:'OBSERVATIONS_ONLY',ownerId:d.ownerId,sourceCommit:d.sourceCommit,actor:d.actors.a.id,
      requestId:command.requestId,profileRevision:canonical.profileRevision,displayName,
      pending:['late actual-response logout schedule','wrong-owner fixed RPC denial','expired-session denial',
        'fixture-owner A/B no-effect/profile/receipt readback','same-origin refusal','dynamic credential inventory rescan',
        'process/resource cleanup receipt','independent verification']};
  }catch(error){
    await persist(privateEvidenceDirectory,'account-name-failure.json',JSON.stringify({message:String(error?.message),stack:String(error?.stack)}));
    throw new Error('BLOCKER: Account scenario stopped; inspect owned private failure evidence');
  }finally{
    page.off('response',record);await Promise.all([...pending]);
    await persist(privateEvidenceDirectory,'account-name-network.json',JSON.stringify(network));
    await persist(privateEvidenceDirectory,'account-name-observations.json',JSON.stringify(observations));
    await persist(privateEvidenceDirectory,'account-name-network-errors.json',JSON.stringify(errors.map(error=>({message:String(error?.message),stack:String(error?.stack)}))));
    const trace=path.join(privateEvidenceDirectory,'account-name-trace.zip');await page.context().tracing.stop({path:trace});await chmod(trace,0o600);
    if(errors.length)throw new Error(`BLOCKER: ${errors.length} network evidence capture/scan failures; inspect private evidence`);
  }
}

/** Fallback-only schedule. route.fetch obtains the ACTUAL response first;
 * route.fulfill releases its unchanged body/status/headers after logout.
 * Parent T3 preview may instead do this with its own byte-delay facility.
 * Aborted fulfillment is retained as uncertainty, never called a late-render pass.
 */
export async function runLateLogoutSchedule({page,descriptor,privateEvidenceDirectory,privateStrings,displayName}){
  const d=validateDescriptor(descriptor);await privateDirectory(d,privateEvidenceDirectory);
  let captured,release,releaseError,heldResolve,heldReject,finishedResolve;
  const held=new Promise((resolve,reject)=>{heldResolve=resolve;heldReject=reject;}),gate=new Promise(resolve=>release=resolve);
  const finished=new Promise(resolve=>finishedResolve=resolve);
  const pattern=d.endpoints.portal+'/api/client/account-profile';
  const handler=async route=>{
    if(route.request().postDataJSON()?.action!=='read_account_profile_v1')return route.continue();
    try{
      const actual=await route.fetch({maxRedirects:0,timeout:10000}),body=await actual.body(),headers=actual.headers();
      captured={status:actual.status(),headers,body};assert.equal(captured.status,200);
      assert.ok(!headers['content-encoding']||headers['content-encoding']==='identity','encoded bytes cannot be faithfully delayed by this fallback');
      assertProfile(JSON.parse(body),{displayName});assertPrivateScan(body,privateStrings);
      await persist(privateEvidenceDirectory,'account-name-held-original.json',JSON.stringify({status:captured.status,headers,body:body.toString('base64'),sha256:sha(body)}));
      heldResolve();await gate;
      const released={status:captured.status,headers:captured.headers,body:captured.body};assertSameRelease(captured,released);
      await route.fulfill(released);
    }catch(error){releaseError=error;heldReject(new Error('BLOCKER: actual response capture or release failed'));}
    finally{finishedResolve();}
  };
  await page.route(pattern,handler);
  try{
    await page.getByRole('button',{name:'read current details',exact:true}).click();
    await bounded(held,15000,'BLOCKER: actual response was not captured');
    await page.waitForLoadState('networkidle',{timeout:10000});await Promise.all([...pending]);await logout(page,[displayName,d.actors.a.initialDisplayName]);
    const delivered=page.waitForResponse(r=>profileResponse(r,'read_account_profile_v1'),{timeout:10000}).catch(()=>null);
    release();await bounded(finished,15000,'BLOCKER: actual route command not joined');
    if(releaseError)throw new Error('BLOCKER: browser aborted actual-byte release; late delivery unproven');
    const response=await delivered;assert.ok(response,'actual delayed response did not reach the browser');
    assertSameRelease(captured,{status:response.status(),headers:await response.allHeaders(),body:await response.body()});
    await page.getByLabel('email',{exact:true}).waitFor({state:'visible'});
    const body=await page.locator('body').textContent();assertPrivateScan(Buffer.from(body),[...privateStrings,displayName,d.actors.a.initialDisplayName]);
    await persist(privateEvidenceDirectory,'account-name-held-response.json',JSON.stringify({status:captured.status,headers:captured.headers,
      body:captured.body.toString('base64'),sha256:sha(captured.body),releasedUnchanged:true,afterLogoutBody:body}));
    return {status:'OBSERVATIONS_ONLY',heldStatus:captured.status,bodySha256:sha(captured.body)};
  }catch(error){
    await persist(privateEvidenceDirectory,'account-name-held-failure.json',JSON.stringify({message:String(error?.message),stack:String(error?.stack)}));
    throw new Error('BLOCKER: late-response schedule incomplete; inspect owned private evidence');
  }finally{release();await page.unroute(pattern,handler);}
}

export {login,logout,probe,summary,exactValue};
