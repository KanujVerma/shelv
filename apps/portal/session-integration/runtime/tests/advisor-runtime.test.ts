import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {buildCandidate} from '../scripts/build.mjs';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {createPreviewRequests} from '../../../site/advisor/fixtures.js';
const origin='https://portal.goshelv.com',supabase='https://snojlbqovlawewwqbviz.supabase.co',owner='11111111-1111-4111-8111-111111111111',ps='22222222-2222-4222-8222-222222222222';
function token(){return [Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({iss:supabase+'/auth/v1',sub:owner,session_id:ps,role:'authenticated',is_anonymous:false,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'synthetic-signature'].join('.');}
const ck=(r:any,k:string)=>{const v=(r.headers.get('set-cookie')??'').match(new RegExp(`${k}=([^;]+)`));assert.ok(v,`cookie missing ${k}`);return v[1];};
const doName=(kind:string,id:string)=>`${kind}:${createHash('sha256').update(`${kind}:${id}`).digest('base64url')}`;
export async function advisorRuntime(){
 await buildCandidate({advisor:true});const preview=createPreviewRequests({scenario:'unapproved'});let enabled=true,privateLeak=false;const paths:string[]=[];let contextCalls=0;
 const user={id:owner,is_anonymous:false,aud:'authenticated',email:'synthetic@example.test',created_at:new Date().toISOString(),app_metadata:{},user_metadata:{}};
 const root=resolve('../candidate/site');
 const staticFetch=async(req:any)=>{if(new URL(req.url).pathname==='/portal-config.json')return Response.json({authUrl:supabase,publishableKey:'sb_publishable_synthetic',operationsUrl:supabase+'/functions/v1/concierge-operations',paymentsUrl:supabase+'/functions/v1/concierge-payments',checkinsUrl:supabase+'/functions/v1/concierge-checkins',clientSharedSessions:true,advisorSharedSessions:true});try{const path=resolve(root,'.'+new URL(req.url).pathname.replace(/\/$/,'/index.html'));assert.ok(path.startsWith(root+'/'));const bytes=await readFile(path);return new Response(bytes,{headers:{'Content-Type':({'.js':'text/javascript','.json':'application/json','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'} as any)[extname(path)]??'application/octet-stream'}});}catch{return new Response('not found',{status:404});}};
 const outbound=async(req:any)=>{const url=new URL(req.url);paths.push(url.pathname);assert.equal(url.origin,supabase);
  if(url.pathname.endsWith('/otp')){const body=await req.json();assert.equal(body.create_user,false);assert.ok(body.code_challenge);assert.equal(url.searchParams.get('redirect_to'),origin+'/?workspace=advisor');return Response.json({});}
  if(url.pathname.endsWith('/token'))return Response.json({access_token:token(),refresh_token:'synthetic-refresh',expires_in:3600,token_type:'bearer',user});
  if(url.pathname.endsWith('/user'))return Response.json(user);
  if(url.pathname.endsWith('/logout'))return new Response(null,{status:204});
  if(url.pathname.endsWith('/concierge_advisor_session_context')){contextCalls++;return enabled?Response.json({ownerId:owner,providerSessionId:ps,role:'advisor',sessionNotAfter:null,capabilities:{view:true,edit:true,publish:true,confirmPayments:true}}):Response.json({code:'session_ended'},{status:401});}
  if(url.pathname.endsWith('/concierge-admission')){const command=await req.json();assert.equal(command.action,'capabilities');return Response.json({canAddClient:false});}
  if(url.pathname.endsWith('/concierge-operations')){const command=await req.json();const data=await preview.core(command);return Response.json(privateLeak?{...data,privateNotes:'PRIVATE_CANARY'}:data);}
  assert.fail('unexpected outbound '+url.pathname);
 };
 const raw:any={cf:false,logRequests:false,upstream:origin,workers:[
  {name:'gateway',routes:['portal.goshelv.com/*'],modules:true,scriptPath:'dist/advisor-pages/_worker.js',compatibilityDate:'2026-10-20',compatibilityFlags:['nodejs_compat'],bindings:{PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true',ADVISOR_SHARED_SESSIONS:'true'},durableObjects:{ADVISOR_SESSIONS:{className:'AdvisorSessionObject',scriptName:'vault',useSQLite:true}},serviceBindings:{ASSETS:staticFetch}},
  {name:'vault',modules:true,scriptPath:'dist/vault/index.js',compatibilityDate:'2026-10-20',compatibilityFlags:['nodejs_compat'],durableObjects:{ADVISOR_SESSIONS:{className:'AdvisorSessionObject',useSQLite:true}},bindings:{PORTAL_ORIGIN:origin,SUPABASE_PUBLIC_KEY:'sb_publishable_synthetic',ADVISOR_SESSION_KEYS:JSON.stringify({active:'fixture',keys:{fixture:Buffer.alloc(32,23).toString('base64url')}}),SESSION_IDLE_SECONDS:'3600',SESSION_ABSOLUTE_SECONDS:'28800',SESSION_FLOW_SECONDS:'600',CLIENT_SHARED_SESSIONS:'true',ADVISOR_SHARED_SESSIONS:'true',CLIENT_REMEMBER_IDLE_SECONDS:'604800',CLIENT_REMEMBER_ABSOLUTE_SECONDS:'2592000'},outboundService:outbound}
 ]};
 const mf=new Miniflare({...convertV4MiniflareOptions(raw),unsafeInspectDurableObjects:true,telemetry:{enabled:false}});
 const call=(path:string,body?:unknown,cookies='',csrf='',headers:Record<string,string>={})=>mf.dispatchFetch(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':'192.0.2.77',Cookie:cookies,...(body===undefined?{}:{'Content-Type':'application/json','X-Shelv-CSRF':csrf}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
 let nextIP=1;
 async function login(remember=false){const headers={'CF-Connecting-IP':`192.0.2.${nextIP++}`};const boot=await call('/api/advisor/session',undefined,'','',headers),pending=await boot.json() as any,fc='__Host-shelv_advisor_flow='+ck(boot,'__Host-shelv_advisor_flow');assert.equal(boot.status,200);
  const sent=await call('/api/advisor/auth/request',{email:'synthetic@example.test',remember},fc,pending.csrf,headers);assert.equal(sent.status,200,await sent.clone().text());
  const complete=await call('/api/advisor/auth/complete',{code:'synthetic-code'},fc,pending.csrf,headers);assert.equal(complete.status,200,await complete.clone().text());const session=await complete.json() as any,sid=ck(complete,'__Host-shelv_advisor');return {fc,sc:'__Host-shelv_advisor='+sid,sid,complete,session,pending};}
 return {mf,call,login,paths,disable:()=>enabled=false,leak:()=>privateLeak=true,contextCalls:()=>contextCalls};
}

async function bind(context:any,f:any){await context.route('**/*',async(route:any)=>{try{
 const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();
 const headers=await req.allHeaders();headers['cf-connecting-ip']='192.0.2.190';if(url.pathname.startsWith('/api/')&&!headers.origin)headers.origin=origin;
 const res=await f.mf.dispatchFetch(req.url(),{method:req.method(),headers,body:req.postDataBuffer()??undefined});
 const h:Record<string,string>={};res.headers.forEach((v:string,k:string)=>h[k]=v);await route.fulfill({status:res.status,headers:h,body:Buffer.from(await res.arrayBuffer())});
}catch(error){await route.abort().catch(()=>{});}});}
async function signIn(page:any,remember:boolean){await page.goto(origin+'/?workspace=advisor');await page.locator('#login-email').waitFor();assert.equal(await page.locator('#remember-device').isEnabled(),true);if(remember)await page.locator('#remember-device').check();await page.locator('#login-email').fill('synthetic@example.test');await page.getByRole('button',{name:'Send sign-in link'}).click();await page.getByText(/on its way/).waitFor();await page.goto(origin+'/?workspace=advisor&code=synthetic-code');await page.locator('#advisor-signout').waitFor();}
test('advisor native gateway/Vault persists consent, SQLite policy and expiry; role, CSRF, logout and revocation fail closed',async()=>{
 const f=await advisorRuntime();try{
  for(const remember of [false,true]){
   const s=await f.login(remember);assert.equal(s.session.remembered,remember);assert.equal(/Max-Age=/.test(s.complete.headers.get('set-cookie')!),remember);assert.match(s.complete.headers.get('set-cookie')!,/Secure; HttpOnly; SameSite=Lax/);assert.ok(Date.parse(s.session.absoluteExpiresAt)-Date.now()<=28800000);assert.ok(Date.parse(s.session.idleExpiresAt)-Date.now()<=3600000);
   const storage=await f.mf.unsafeGetDurableObjectStorage('vault','AdvisorSessionObject',{name:doName('session',s.sid)});const rows=await storage.exec('select json from session_record'),r=JSON.parse(String(rows[0].json));assert.equal(r.audience,'advisor');assert.equal(r.policyId,remember?'advisor-remember-v1':'advisor-session-v1');assert.doesNotMatch(JSON.stringify(r),/synthetic-refresh|synthetic-signature/);
   await f.mf.unsafeEvictDurableObject('vault','AdvisorSessionObject',{name:doName('session',s.sid)});assert.equal((await f.call('/api/advisor/session',undefined,s.sc)).status,200);
   const before=f.contextCalls();assert.equal((await f.call('/api/advisor/operations',{action:'advisor_list'},s.sc,s.session.csrf)).status,200);assert.equal(f.contextCalls()-before,2);
   assert.equal((await f.call('/api/advisor/operations',{action:'client_read_v2'},s.sc,s.session.csrf)).status,403);assert.equal((await f.call('/api/advisor/operations',{action:'advisor_list'},s.sc,'wrong')).status,403);
   const clientAttempt=await f.call('/api/client/operations',{action:'client_read_v2'},s.sc,s.session.csrf);assert.equal(clientAttempt.status,401);
   const ns:any=await f.mf.getDurableObjectNamespace('ADVISOR_SESSIONS','vault');assert.equal((await ns.getByName(doName('session',s.sid)).invoke({type:'session.view',audience:'client'})).error.status,403);
   assert.equal((await f.call('/api/advisor/logout',{},s.sc+'; '+s.fc,s.session.csrf)).status,200);assert.equal((await f.call('/api/advisor/session',undefined,s.sc)).status,401);
  }
  for(const kind of ['idle','absolute']){const s=await f.login(true),storage=await f.mf.unsafeGetDurableObjectStorage('vault','AdvisorSessionObject',{name:doName('session',s.sid)});const rows=await storage.exec('select json from session_record'),r=JSON.parse(String(rows[0].json));if(kind==='idle')r.lastActive=Date.now()-3600001;else r.absoluteAt=Date.now()-1;await storage.exec('update session_record set json=?',JSON.stringify(r));assert.equal((await f.call('/api/advisor/session',undefined,s.sc)).status,401);}
  const s=await f.login(true);f.disable();assert.equal((await f.call('/api/advisor/session',undefined,s.sc)).status,401);
 }finally{await f.mf.dispose();}
});
test('advisor Chrome reload, second tab, logout propagation and restart after logout deny private return',async()=>{
 const f=await advisorRuntime();const {chromium}=await import(new URL('../../../node_modules/playwright-core/index.mjs',import.meta.url).href);const profile=await mkdtemp(resolve(tmpdir(),'shelv-advisor-durable-'));let context:any;
 try{
  context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true});await bind(context,f);const page=await context.newPage();await signIn(page,true);await page.reload();await page.locator('#advisor-signout').waitFor();const other=await context.newPage();await other.goto(origin+'/?workspace=advisor');await other.locator('#advisor-signout').waitFor();
  for(const p of [page,other]){const state=await p.evaluate(()=>({local:{...localStorage},session:{...sessionStorage},cookie:document.cookie}));assert.doesNotMatch(JSON.stringify(state),/access_token|refresh_token|synthetic-refresh|synthetic-signature|__Host-shelv_advisor=/);}
  await page.locator('#advisor-signout').click();await page.locator('#login-email').waitFor();await other.locator('#login-email').waitFor();await other.reload();await other.locator('#login-email').waitFor();await context.close();
  context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true});await bind(context,f);const returned=await context.newPage();await returned.goto(origin+'/?workspace=advisor');await returned.locator('#login-email').waitFor();assert.equal(f.paths.filter(p=>p.endsWith('/otp')).length,1);
 }finally{await context?.close();await f.mf.dispose();await rm(profile,{recursive:true,force:true});}
});
test('actual Chrome process restart restores only consenting advisor session',async()=>{
 const f=await advisorRuntime();const {chromium}=await import(new URL('../../../node_modules/playwright-core/index.mjs',import.meta.url).href);
 try{for(const remember of [false,true]){const profile=await mkdtemp(resolve(tmpdir(),'shelv-advisor-restart-'));let context:any;try{
  context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true});await bind(context,f);const page=await context.newPage();await signIn(page,remember);const cookies=await context.cookies();const cookie=cookies.find((c:any)=>c.name==='__Host-shelv_advisor');assert.ok(cookie?.httpOnly&&cookie.secure);assert.equal(cookie.expires>0,remember);await context.close();
  context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true});await bind(context,f);const returned=await context.newPage();await returned.goto(origin+'/?workspace=advisor');await returned.locator(remember?'#advisor-signout':'#login-email').waitFor();
 }finally{await context?.close();await rm(profile,{recursive:true,force:true});}}}finally{await f.mf.dispose();}
});
test('failed advisor logout survives full Chrome restart as a token-free ending intent and completes before restore',async()=>{
 const f=await advisorRuntime();const {chromium}=await import(new URL('../../../node_modules/playwright-core/index.mjs',import.meta.url).href);const profile=await mkdtemp(resolve(tmpdir(),'shelv-advisor-ending-'));let context:any;
 try{
  context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true});await bind(context,f);const page=await context.newPage();await signIn(page,true);const before=await context.cookies(),sid=before.find((c:any)=>c.name==='__Host-shelv_advisor').value;
  await context.route('**/api/advisor/logout',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'unavailable'})}));
  await page.locator('#advisor-signout').click();await page.locator('#login-email').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('shelv:advisor:signout-pending')),'1');assert.equal((await f.call('/api/advisor/session',undefined,'__Host-shelv_advisor='+sid)).status,200,'server logout acknowledgement is still pending');await context.close();
  context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true});await bind(context,f);const returned=await context.newPage();await returned.goto(origin+'/?workspace=advisor');await returned.locator('#login-email').waitFor();assert.equal((await f.call('/api/advisor/session',undefined,'__Host-shelv_advisor='+sid)).status,401);assert.equal(await returned.evaluate(()=>localStorage.getItem('shelv:advisor:signout-pending')),null);assert.equal(f.paths.filter(p=>p.endsWith('/otp')).length,1);
 }finally{await context?.close();await f.mf.dispose();await rm(profile,{recursive:true,force:true});}
});
