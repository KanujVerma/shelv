import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat,readdir,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Inert source module. No dependencies, launch, sockets, DB, resource discovery
// or local-bindings assumptions. Parent owns the exact later execution grant,
// fresh browser/context, native fixture and fixed-RPC/DB/Vault observations.
// Run only AFTER Name has joined and released its browser. Never borrow its tab.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const command=Object.freeze({schemaVersion:1,action:'read_client_orders_v1'});
const ordersPath='/api/client/client-orders';
const hash=value=>createHash('sha256').update(value).digest('hex');
const exact=(value,keys)=>assert.deepEqual(Object.keys(value).sort(),[...keys].sort(),'unexpected readback fields');
const only=(value)=>{assert.ok(Array.isArray(value)&&value.length===1,'expected the one actual seeded record');return value[0];};
function endpoint(value,protocol){
  assert.equal(typeof value,'string');
  const u=new URL(value);
  assert.equal(u.protocol,protocol);assert.equal(u.hostname,'127.0.0.1');
  assert.ok(u.port&&Number(u.port)>1023,'explicit unprivileged loopback port required');
  assert.equal(u.username,'');assert.equal(u.password,'');
  assert.equal(u.pathname,'/');assert.equal(u.search,'');assert.equal(u.hash,'');
  assert.ok(value===u.origin||value===u.origin+'/','literal loopback origin required');
  return u.origin;
}
function seedIdentity(d){
  assert.equal(d?.schemaVersion,1);assert.match(d.ownerId,uuid);
  assert.ok(d.actors?.a&&d.actors?.b);
  for(const actor of [d.actors.a,d.actors.b]){
    assert.match(actor.id,uuid);assert.match(actor.email,/^[^\s@]+@[^\s@]+\.invalid$/);
  }
  assert.notEqual(d.actors.a.id,d.actors.b.id);assert.notEqual(d.actors.a.email,d.actors.b.email);
}
/** Validation checks the optional seed's complete actual readback. It creates
 * neither an execution grant nor fabricated application data/currentness. */
export function validateOrdersFixture(d){
  seedIdentity(d);
  assert.match(d.sourceCommit,/^[0-9a-f]{40}$/);assert.ok(d.projectId);
  assert.ok(path.isAbsolute(d.fixtureDirectory)&&path.isAbsolute(d.privateDirectory));
  endpoint(d.endpoints.portal,'https:');endpoint(d.endpoints.supabase,'https:');endpoint(d.endpoints.mailpit,'http:');
  assert.equal(new URL(d.endpoints.supabase).port,'58621','Supabase must match the corrected Parent TLS endpoint');
  assert.equal(new Set(Object.values(d.endpoints).map(v=>new URL(v).port)).size,Object.values(d.endpoints).length);
  const orders=d.ordersScenario;assert.ok(orders,'optional orders seed has not been applied');
  exact(orders,['schemaVersion','a','b']);assert.equal(orders.schemaVersion,1);
  const ids=new Set();
  for(const key of ['a','b']){
    const s=orders[key],other=orders[key==='a'?'b':'a'];
    exact(s,['clientId','purchaseId','returnId','eventId','marker','view']);
    assert.equal(s.clientId,d.actors[key].id);
    for(const id of [s.purchaseId,s.returnId,s.eventId]){assert.match(id,uuid);assert.ok(!ids.has(id),'reused recorded ID');ids.add(id);}
    assert.equal(s.marker,`ORDERS_${d.ownerId.replaceAll('-','').toLowerCase()}_${key.toUpperCase()}`);
    const v=s.view;exact(v,['schemaVersion','revision','purchases','returns']);assert.equal(v.schemaVersion,1);assert.equal(v.revision,1);
    const p=only(v.purchases),r=only(v.returns),e=only(r.events);
    exact(p,['id','quoteId','recommendationId','retailer','seller','productId','productName','quantity','unitPriceCents','taxCents','shippingCents','purchasedOn','deliveredOn','policy','recordedBy','recordedAt']);
    assert.equal(p.id,s.purchaseId);assert.equal(p.recordedBy,s.clientId);
    assert.equal(p.productId,`historical_${key}`);assert.equal(p.productName,`historical synthetic purchase ${s.marker}`);
    assert.equal(p.retailer,`retailer ${s.marker}`);assert.equal(p.seller,`seller ${s.marker}`);
    assert.equal(p.quoteId,null);assert.equal(p.recommendationId,null);
    assert.equal(p.quantity,2);assert.equal(p.unitPriceCents,1234);assert.equal(p.taxCents,137);assert.equal(p.shippingCents,289);
    assert.equal(p.purchasedOn,'2026-10-01');assert.equal(p.deliveredOn,null);
    assert.equal(Date.parse(p.recordedAt),Date.parse('2026-10-02T11:00:00Z'));
    assert.deepEqual(p.policy,{checkedOn:'2026-10-01',url:'https://example.com/historical-terms',summary:`saved conditions ${s.marker}`,openedAllowed:null,finalSale:false,returnBy:null,shipBy:null,returnCostCents:415});
    exact(r,['id','purchaseId','quantity','reason','condition','status','requestedAt','events']);
    assert.equal(r.id,s.returnId);assert.equal(r.purchaseId,p.id);assert.equal(r.quantity,1);
    assert.equal(r.reason,`historical request ${s.marker}`);assert.equal(r.condition,'opened');assert.equal(r.status,'reviewing');
    assert.equal(Date.parse(r.requestedAt),Date.parse('2026-10-03T11:00:00Z'));
    exact(e,['id','status','note','expectedRefundCents','retailerRefundCents','clientRepaidCents','policyCheckedOn','actorId','recordedAt']);
    assert.equal(e.id,s.eventId);assert.equal(e.actorId,s.clientId);assert.equal(e.status,'reviewing');assert.equal(e.note,`historical review ${s.marker}`);
    assert.equal(Date.parse(e.recordedAt),Date.parse('2026-10-04T11:00:00Z'));
    for(const field of ['expectedRefundCents','retailerRefundCents','clientRepaidCents','policyCheckedOn'])assert.equal(e[field],null);
    assert.ok(!JSON.stringify(v).includes(other.marker),'foreign marker in own readback');
  }
  return d;
}
export function ordersSeedPsqlVariables(descriptor) {
  // UUID validation precedes any caller-provided process invocation. Pass this
  // ARRAY to spawn/execFile, never join into a shell command. No DB URL here.
  seedIdentity(descriptor);
  return ['-v', `actor_a_id=${descriptor.actors.a.id}`, '-v', `actor_b_id=${descriptor.actors.b.id}`, '-v', `owner_id=${descriptor.ownerId}`];
}

function privateScan(text,needles){
  for(const needle of needles){
    // Response JSON escapes newlines/quotes in an exact private key/value.
    // Check both wire representation and literal text without logging either.
    const wire=JSON.stringify(needle).slice(1,-1);
    assert.ok(!text.includes(needle)&&!text.includes(wire),'private credential/canary disclosure');
  }
}
async function evidenceTarget(directory,fixtureDirectory){
  assert.ok(path.isAbsolute(directory));
  const canonical=await realpath(directory),fixture=await realpath(fixtureDirectory);
  assert.equal(canonical,path.resolve(directory),'evidence directory must be canonical');
  const relative=path.relative(fixture,canonical);
  assert.ok(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'evidence must belong to this fresh fixture');
  const state=await lstat(canonical);
  assert.ok(state.isDirectory()&&(state.mode&0o077)===0,'owned evidence directory must be private');
  assert.deepEqual(await readdir(canonical),[],'use a fresh empty evidence directory; retain prior attempts');
  return canonical;
}
async function facts(locator){
  return locator.locator('dt').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.textContent,n.nextElementSibling?.textContent])));
}
const amount=n=>`${Math.floor(n/100)}.${String(n%100).padStart(2,'0')}`;

/** Receives an actual, separately allocated, empty Playwright page/context.
 * This function does not import an SDK, launch a browser or create a context.
 * It returns browser observations, never full feature or independent acceptance.
 * privateNeedles must come from the new fixture's actual server-only credentials
 * and canaries under Parent's later packet; they are never saved or printed. */
export async function runRecordedOrdersJourney({page,descriptor,evidenceDirectory,privateNeedles}){
  validateOrdersFixture(descriptor); // Before ANY browser or filesystem effect.
  assert.ok(Array.isArray(privateNeedles)&&privateNeedles.length>0&&privateNeedles.every(n=>typeof n==='string'&&n.length>=8),'actual fixture privacy needles required');
  const d=structuredClone(descriptor),portal=endpoint(d.endpoints.portal,'https:'),provider=endpoint(d.endpoints.supabase,'https:'),mailpit=endpoint(d.endpoints.mailpit,'http:');
  const directory=await evidenceTarget(evidenceDirectory,d.fixtureDirectory);
  const result={kind:'recorded-orders-browser-observations',sourceCommit:d.sourceCommit,ownerId:d.ownerId,projectId:d.projectId,status:'RUNNING',checks:[],requests:[],reads:[],blockedRequests:0,localLoginEmails:0,serverEffects:'requires actual Parent fixed-RPC/DB observations',financialJourneyAccepted:false};
  const pending=new Set(),failures=[];
  let active='a',phase='new context',releaseHeld,heldWork,delayHandler,traceStarted=false;
  const pass=label=>result.checks.push({label,at:new Date().toISOString()});
  const orders=()=>page.locator('[data-client-orders="read-only"]');
  const save=async name=>{await page.screenshot({path:path.join(directory,`${name}.png`),fullPage:true});};
  const browserPolicy=async route=>{
    const u=new URL(route.request().url());
    if(u.origin===portal||(u.origin===provider&&u.pathname==='/auth/v1/verify'))return route.continue();
    result.blockedRequests++;return route.abort('blockedbyclient');
  };
  const onResponse=response=>{
    const actor=active; // Capture owner at the event, before any awaited bytes.
    const work=(async()=>{
      const u=new URL(response.url());if(u.origin!==portal||!u.pathname.startsWith('/api/client/'))return;
      const headers=await response.allHeaders(),body=await response.body();
      privateScan(body.toString('utf8'),privateNeedles);
      // Headers are checked in memory and never emitted (cookies/CSRF are not
      // evidence fields). Login callback URLs/codes are likewise never logged.
      privateScan(JSON.stringify(headers),privateNeedles);
      assert.match(headers['cache-control']??'',/no-store/);
      if(actor==='b')assert.ok(!body.toString('utf8').includes(d.ordersScenario.a.marker),'A marker in B response');
      result.requests.push({path:u.pathname,method:response.request().method(),status:response.status(),requestSha256:hash(response.request().postData()??''),bytes:body.length,sha256:hash(body),actor,at:new Date().toISOString()});
    })().catch(()=>{failures.push('response privacy/cache/isolation observation failed');}).finally(()=>pending.delete(work));
    pending.add(work);
  };
  const drain=async()=>{while(pending.size)await Promise.all([...pending]);assert.deepEqual(failures,[]);assert.equal(result.blockedRequests,0,'unexpected external browser request');};
  const canonical=async(body,retainedCsrf=null)=>page.evaluate(async({body,path,retainedCsrf})=>{
    let csrf=retainedCsrf;
    if(csrf===null){const session=await fetch('/api/client/session',{cache:'no-store'});const state=await session.json();csrf=state.csrf??'';}
    const response=await fetch(path,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','x-shelv-csrf':csrf},body:JSON.stringify(body)});
    return {status:response.status,path:new URL(response.url).pathname,value:await response.json()};
  },{body,path:ordersPath,retainedCsrf});
  const assertRead=async key=>{
    const read=await canonical(command);assert.equal(read.status,200,'real own Orders fixed-RPC read failed');
    assert.deepEqual(read.value,d.ordersScenario[key].view,'canonical own read differs from post-seed readback');
    privateScan(JSON.stringify(read.value),privateNeedles);
    assert.equal(read.path,ordersPath,'successful read must use the exact Orders gateway path');
    // Append only after an actual successful, exact canonical read. This is
    // correlation data, never a replacement response or currentness grant.
    result.reads.push({sequence:result.reads.length+1,actor:key,clientId:d.actors[key].id,
      path:read.path,route:new URL(page.url()).pathname,revision:read.value.revision,
      marker:read.value.purchases[0].productName.slice('historical synthetic purchase '.length),
      requestSha256:hash(JSON.stringify(command)),observedAt:new Date().toISOString(),view:structuredClone(read.value)});
    return read;
  };
  const shown=async(key,detail=false)=>{
    const p=d.ordersScenario[key].view.purchases[0],other=d.ordersScenario[key==='a'?'b':'a'];
    await orders().getByRole('heading',{name:detail?'recorded purchase':'orders',exact:true}).waitFor();
    await orders().getByRole('heading',{name:p.productName,level:2,exact:true}).waitFor();
    const text=await orders().innerText();assert.ok(!text.includes(other.marker),'foreign marker in own UI');privateScan(text,privateNeedles);
    assert.equal(await orders().getByRole('button',{name:/pay|purchase now|request return|start using/i}).count(),0);
    if(detail){
      const f=await facts(orders().locator('dl').first());
      assert.deepEqual(f,{retailer:p.retailer,seller:p.seller,quantity:String(p.quantity),'purchase date':p.purchasedOn,'delivery date in the purchase record':'not recorded','purchase recorded at':p.recordedAt,'unit amount':amount(p.unitPriceCents),tax:amount(p.taxCents),shipping:amount(p.shippingCents),'recorded purchase total':amount(p.quantity*p.unitPriceCents+p.taxCents+p.shippingCents),currency:'not provided'});
      const policy=orders().getByRole('region',{name:'saved return conditions',exact:true});
      assert.deepEqual(await facts(policy),{'checked on':p.policy.checkedOn,'opened items':'not provided','final sale':'not recorded as final sale','return by':'not recorded','ship by':'not recorded','recorded return cost':`${amount(p.policy.returnCostCents)} · currency not provided`});
      assert.equal(await policy.getByRole('link',{name:'recorded policy link',exact:true}).getAttribute('href'),p.policy.url);
      const history=orders().getByRole('region',{name:'recorded return history',exact:true});
      await history.getByText(d.ordersScenario[key].view.returns[0].reason,{exact:true}).waitFor();
      assert.deepEqual(await facts(history.locator('li')) ,{'expected refund recorded':'not provided','retailer funds recorded':'not provided','client repayment recorded':'not provided',currency:'not provided','policy checked on':'not recorded'});
      assert.ok(!text.includes('USD')&&!text.includes('$'),'currency was manufactured');
      assert.ok(text.includes('current delivery and tracking details are not provided.'));
    }
    await assertRead(key);await drain();
  };
  async function localMessages(){
    const r=await page.context().request.get(mailpit+'/api/v1/messages',{maxRedirects:0});assert.equal(r.status(),200);return r.json();
  }
  async function login(key){
    active=key;const actor=d.actors[key];phase=`${key} ordinary PKCE login`;
    await page.goto(portal+'/orders');await page.getByRole('textbox',{name:'email',exact:true}).waitFor();
    const before=await localMessages(),seen=new Set(before.messages.map(m=>m.ID));
    await page.getByRole('textbox',{name:'email',exact:true}).fill(actor.email);
    await page.getByRole('button',{name:'send sign-in link',exact:true}).click();
    await page.getByText('check your email',{exact:true}).waitFor();
    const deadline=Date.now()+12000;let received;
    while(Date.now()<deadline){
      const list=await localMessages(),matches=[];
      for(const item of list.messages.filter(m=>!seen.has(m.ID))){
        const r=await page.context().request.get(mailpit+'/api/v1/message/'+encodeURIComponent(item.ID),{maxRedirects:0});assert.equal(r.status(),200);
        const message=await r.json();if(message.To?.some(to=>to.Address===actor.email))matches.push(message);
      }
      assert.ok(matches.length<=1,'multiple new emails for the selected recipient');
      if(matches.length===1){received=matches[0];break;}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    assert.ok(received,'no actual local sign-in email');
    const links=[...(received.HTML??received.Text??'').matchAll(/https?:[^\s"<>]+/g)].map(m=>m[0].replaceAll('&amp;','&')).filter(raw=>{
      const u=new URL(raw);return u.origin===provider&&u.pathname==='/auth/v1/verify'&&!u.username&&!u.password;
    });
    assert.ok(links.length===1||new Set(links).size===1,'ambiguous actual Auth verification link');assert.ok(links.length);
    // Real provider redirect and callback consumed by the actual application.
    await page.goto(links[0]);received=null;
    await page.waitForURL(portal+'/orders');await shown(key);
    const cookies=await page.context().cookies(portal),cookie=cookies.find(c=>c.name==='__Host-shelv_client');
    assert.ok(cookie?.httpOnly&&cookie.secure&&cookie.sameSite==='Lax'&&cookie.path==='/');
    assert.ok(!cookies.some(c=>c.name==='__Host-shelv_advisor'));
    const storage=await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage},cookie:document.cookie,history:history.state}));
    privateScan(storage,privateNeedles);assert.ok(!storage.includes('__Host-shelv_client='));
    assert.ok(!/access_token|refresh_token|code_verifier/.test(storage));
    result.localLoginEmails++;pass(`${key} real PKCE/cookie own positive read`);
  }
  async function logout(){
    await page.getByRole('button',{name:'sign out',exact:true}).click();
    await page.getByRole('textbox',{name:'email',exact:true}).waitFor();
    assert.equal(await orders().count(),0);
    const text=await page.locator('body').innerText();
    for(const key of ['a','b'])assert.ok(!text.includes(d.ordersScenario[key].marker),'private record after logout');
  }
  try{
    const cookies=await page.context().cookies(portal);
    assert.ok(!cookies.some(c=>/^__Host-shelv_(client|advisor)/.test(c.name)),'Orders needs its separately allocated empty context');
    await page.context().tracing.start({screenshots:true,snapshots:true,sources:false});traceStarted=true;
    await page.route('**/*',browserPolicy);page.on('response',onResponse);
    for(const key of ['a','b']){
      await login(key);const s=d.ordersScenario[key],other=d.ordersScenario[key==='a'?'b':'a'];
      phase=`${key} list to exact detail`;
      await orders().getByRole('button',{name:'view purchase',exact:true}).click();
      await page.waitForURL(portal+'/orders/'+s.purchaseId);await shown(key,true);await save(key+'-detail');
      phase=`${key} refresh and history navigation`;
      await page.reload();await shown(key,true);
      await page.goBack();await page.waitForURL(portal+'/orders');await shown(key);
      await page.goForward();await page.waitForURL(portal+'/orders/'+s.purchaseId);await shown(key,true);
      await orders().getByRole('button',{name:'back to orders',exact:true}).click();await page.waitForURL(portal+'/orders');await shown(key);
      pass(`${key} exact recorded list/detail/refresh/Back/Forward`);
      phase=`${key} foreign detail and extra selectors`;
      await page.goto(portal+'/orders/'+other.purchaseId);
      await orders().getByText('this purchase is unavailable',{exact:true}).waitFor();
      const foreign=await orders().innerText();assert.ok(!foreign.includes(other.marker));assert.equal(await orders().getByRole('heading',{name:other.view.purchases[0].productName,exact:true}).count(),0);
      for(const field of ['clientId','ownerId','purchaseId','orderId','p_client_id','client_id','owner_id','id']){
        const probe={...command,[field]:['purchaseId','orderId','id'].includes(field)?other.purchaseId:other.clientId};
        const denied=await canonical(probe);
        assert.equal(denied.status,400,'extra selector must reject');
        assert.ok(!JSON.stringify(denied.value).includes(other.marker));
        result.checks.push({label:`${key} ${field} selector`,requestSha256:hash(JSON.stringify(probe)),status:denied.status,at:new Date().toISOString(),serverEffects:'Parent must correlate fixed-RPC/DB observations'});
        await assertRead(key);
      }
      pass(`${key} foreign ID unavailable and selectors rejected with unchanged canonical reread`);
      await page.goto(portal+'/orders');await shown(key);
      if(key==='a'){
        phase='A delayed genuine response across logout';
        let heldResolve,release,endedSessionCsrf;
        const held=new Promise(resolve=>{heldResolve=resolve;});
        const gate=new Promise(resolve=>{release=resolve;});releaseHeld=release;
        const delay=async route=>{
          heldWork=(async()=>{
            assert.equal(route.request().method(),'POST');assert.deepEqual(route.request().postDataJSON(),command);
            endedSessionCsrf=(await route.request().allHeaders())['x-shelv-csrf'];
            assert.ok(typeof endedSessionCsrf==='string'&&endedSessionCsrf.length>0&&endedSessionCsrf.length<=128,'actual original read CSRF header required');
            const response=await route.fetch({maxRedirects:0});assert.equal(response.status(),200);
            const body=await response.body();assert.deepEqual(JSON.parse(body.toString('utf8')),s.view);privateScan(body.toString('utf8'),privateNeedles);
            result.delayedResponse={sha256:hash(body),bytes:body.length,status:response.status()};
            heldResolve();await gate;
            // Delay only: exact real status/headers/body, unchanged bytes.
            try{await route.fulfill({response,body});result.delayedResponse.delivery='released';}
            catch{result.delayedResponse.delivery='browser cancelled after logout';}
          })();
          heldWork.catch(()=>heldResolve());await heldWork;
        };
        delayHandler=delay;await page.route(portal+ordersPath,delay,{times:1});
        await orders().getByRole('button',{name:'refresh orders',exact:true}).click();
        let timeout;
        try{await Promise.race([held,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('no genuine delayed read')),12000);})]);}
        finally{clearTimeout(timeout);}
        await logout();release();releaseHeld=null;await heldWork;
        await page.unroute(portal+ordersPath,delay);delayHandler=null;
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        assert.equal(await orders().count(),0);assert.ok(!(await page.locator('body').innerText()).includes(s.marker));
        const signedOut=await canonical(command,endedSessionCsrf);assert.equal(signedOut.status,401);assert.ok(!JSON.stringify(signedOut.value).includes(s.marker));
        await save('a-logout-delayed-response');pass(`A logout clears UI; unchanged real read ${result.delayedResponse.delivery}; signed-out read denies`);
      }else await logout();
    }
    phase='A new ordinary login persistence';await login('a');
    await orders().getByRole('button',{name:'view purchase',exact:true}).click();
    await page.waitForURL(portal+'/orders/'+d.ordersScenario.a.purchaseId);await shown('a',true);await save('a-new-login');
    await logout();await drain();pass('A persisted recorded values survive a new ordinary login');
    result.status='BROWSER_OBSERVED';
  }catch(error){
    result.status='FAIL';result.failurePhase=phase;
    result.failureKind=error?.name==='AssertionError'?'assertion':'browser-or-fixture-operation';
    // Never emit assertion actual/expected values, links, cookies or credentials.
  }finally{
    releaseHeld?.();if(heldWork)await heldWork.catch(()=>{});
    if(delayHandler)await page.unroute(portal+ordersPath,delayHandler).catch(()=>{});
    if(result.status!=='BROWSER_OBSERVED'){
      // Logout only through the real UI; resource/context teardown stays with
      // its captured custodian. Failure never turns into an accepted result.
      try{if(await page.getByRole('button',{name:'sign out',exact:true}).count())await logout();}catch{result.sessionCleanup='uncertain; Parent must join and revoke own issued session';}
    }
    await drain().catch(()=>{result.status='FAIL';result.failurePhase??='privacy/cache/isolation observations';});
    await page.unroute('**/*',browserPolicy).catch(()=>{});page.off('response',onResponse);
    if(traceStarted){
      try{await page.context().tracing.stop({path:path.join(directory,'orders-browser-private-trace.zip')});result.trace='orders-browser-private-trace.zip';}
      catch{result.status='FAIL';result.traceCleanup='uncertain; Parent must join own trace handle';}
    }
    await writeFile(path.join(directory,'orders-browser-result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
  }
  assert.equal(result.status,'BROWSER_OBSERVED',`recorded Orders blocked in ${result.failurePhase??phase}`);
  return result;
}

// Built-in SOURCE unit fixtures below do not contact their example endpoints.
// They test refusal/argument construction only and are never browser results.
async function sourceUnitChecks(){
 const {default:test}=await import('node:test');
const uuid=n=>`a1000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function fixture(){
 const ownerId=uuid(1),actors={a:{id:uuid(2),email:'orders-a@example.invalid',initialDisplayName:'Synthetic A'},b:{id:uuid(3),email:'orders-b@example.invalid',initialDisplayName:'Synthetic B'}};
 const scenario=key=>{const n=key==='a'?10:20,marker=`ORDERS_${ownerId.replaceAll('-','')}_${key.toUpperCase()}`,clientId=actors[key].id,purchaseId=uuid(n),returnId=uuid(n+1),eventId=uuid(n+2);
  return {clientId,purchaseId,returnId,eventId,marker,view:{schemaVersion:1,revision:1,purchases:[{id:purchaseId,quoteId:null,recommendationId:null,retailer:`retailer ${marker}`,seller:`seller ${marker}`,productId:`historical_${key}`,productName:`historical synthetic purchase ${marker}`,quantity:2,unitPriceCents:1234,taxCents:137,shippingCents:289,purchasedOn:'2026-10-01',deliveredOn:null,policy:{checkedOn:'2026-10-01',url:'https://example.com/historical-terms',summary:`saved conditions ${marker}`,openedAllowed:null,finalSale:false,returnBy:null,shipBy:null,returnCostCents:415},recordedBy:clientId,recordedAt:'2026-10-02T11:00:00+00:00'}],returns:[{id:returnId,purchaseId,quantity:1,reason:`historical request ${marker}`,condition:'opened',status:'reviewing',requestedAt:'2026-10-03T11:00:00+00:00',events:[{id:eventId,status:'reviewing',note:`historical review ${marker}`,expectedRefundCents:null,retailerRefundCents:null,clientRepaidCents:null,policyCheckedOn:null,actorId:clientId,recordedAt:'2026-10-04T11:00:00+00:00'}]}]}};
 };
 return {schemaVersion:1,ownerId,projectId:'fresh-owned-orders-unit',fixtureDirectory:'/tmp/unit-fixture',privateDirectory:'/tmp/unit-fixture/private',sourceCommit:'8b32873843841ed16e8c2b5b40bff8e20e7bad20',endpoints:{portal:'https://127.0.0.1:49301',supabase:'https://127.0.0.1:58621',mailpit:'http://127.0.0.1:49303'},actors,ordersScenario:{schemaVersion:1,a:scenario('a'),b:scenario('b')}};
}
test('valid exact readback stays unchanged, including actual nulls',()=>{const d=fixture();assert.strictEqual(validateOrdersFixture(d),d);assert.equal(d.ordersScenario.a.view.purchases[0].deliveredOn,null);});
test('the source seed fixture conforms to the actual production Orders DTO',async()=>{
 const {readClientOrdersReadView}=await import('../../../../src/contracts/PortalClientOrdersValidation.ts');
 const d=fixture();for(const key of ['a','b'])assert.deepEqual(readClientOrdersReadView(d.ordersScenario[key].view),d.ordersScenario[key].view);
});
for(const [name,mutate] of [
 ['foreign origin',d=>d.endpoints.portal='https://example.com:443'],
 ['URL credentials',d=>d.endpoints.portal='https://user@127.0.0.1:49301'],
 ['path-bearing endpoint',d=>d.endpoints.supabase+='/?redirect=external'],
 ['actor SQL injection',d=>d.actors.a.id="x'; select 1; --"],
 ['cross-owner readback',d=>d.ordersScenario.b.clientId=d.actors.a.id],
 ['wrong purchase relation',d=>d.ordersScenario.a.view.returns[0].purchaseId=d.ordersScenario.b.purchaseId],
 ['duplicate purchase identity',d=>d.ordersScenario.b.purchaseId=d.ordersScenario.a.purchaseId],
 ['wrong return-event relation',d=>d.ordersScenario.a.view.returns[0].events[0].id=d.ordersScenario.b.eventId],
 ['B leaks A marker',d=>d.ordersScenario.b.view.purchases[0].seller+=d.ordersScenario.a.marker],
 ['unread extra purchase',d=>d.ordersScenario.a.view.purchases.push({...d.ordersScenario.a.view.purchases[0],id:uuid(50)})],
 ['invented currency field',d=>d.ordersScenario.a.view.purchases[0].currency='USD'],
 ['missing canonical head',d=>d.ordersScenario.a.view.revision=0],
 ['foreign recipient',d=>d.actors.b.email='real@example.com'],
 ['missing optional seed',d=>delete d.ordersScenario],
 ['forged known delivery',d=>d.ordersScenario.a.view.purchases[0].deliveredOn='2026-10-05'],
 ['forged refund amount',d=>d.ordersScenario.a.view.returns[0].events[0].clientRepaidCents=1],
])test(`rejects ${name} before any browser effect`,()=>{const d=fixture();mutate(d);assert.throws(()=>validateOrdersFixture(d));});
test('psql variables use UUID-only array arguments and exact actor IDs',()=>{const d=fixture();assert.deepEqual(ordersSeedPsqlVariables(d),['-v',`actor_a_id=${d.actors.a.id}`,'-v',`actor_b_id=${d.actors.b.id}`,'-v',`owner_id=${d.ownerId}`]);d.actors.a.id='bad';assert.throws(()=>ordersSeedPsqlVariables(d));});
test('invalid descriptor rejects before touching a browser object',async()=>{
 const d=fixture();d.ordersScenario.b.clientId=d.actors.a.id;
 let effects=0;const page=new Proxy({}, {get(){effects++;throw new Error('browser effect before validation');}});
 await assert.rejects(runRecordedOrdersJourney({page,descriptor:d,evidenceDirectory:'/not-opened',privateNeedles:[]}));
 assert.equal(effects,0);
});
test('corrected actual Supabase HTTPS is accepted and cannot downgrade',()=>{
 const d=fixture();assert.strictEqual(validateOrdersFixture(d),d);
 d.endpoints.supabase='http://127.0.0.1:58621';assert.throws(()=>validateOrdersFixture(d));
 d.endpoints.supabase='https://127.0.0.1:49302';assert.throws(()=>validateOrdersFixture(d));
});
test('privacy scan rejects JSON-escaped exact private values',()=>{
 const secret='UNIT_PRIVATE_LINE\nWITH_QUOTE"';
 assert.throws(()=>privateScan(JSON.stringify({value:secret}),[secret]));
});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length===3&&process.argv[2]==='--self-test')await sourceUnitChecks();
 else {process.stderr.write('Inert Orders module: import runRecordedOrdersJourney only under the exact Parent resource packet, or use --self-test.\n');process.exitCode=2;}
}
