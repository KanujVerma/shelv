import test from 'node:test';import assert from 'node:assert/strict';
import {SupabaseProvider} from '../server/upstream';import {PORTAL_ORIGIN,SUPABASE_ORIGIN} from '../server/policy';
import {advisorGateway} from '../server/gateway';import {SessionVault} from '../server/session-vault';import {CredentialEnvelope} from '../server/credential-envelope';import {digest} from '../server/types';
import {chromium} from 'playwright-core';import {readFile,mkdir} from 'node:fs/promises';import {resolve,extname,sep} from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const client='bf000000-0000-4000-8000-000000000001',advisor='bf000000-0000-4000-8000-000000000002',quote='bf000000-0000-4000-8000-000000000003',evidence='bf000000-0000-4000-8000-000000000004',option='bf000000-0000-4000-8000-000000000005';
const credentials={access_token:'synthetic-advisor-access',refresh_token:'synthetic-advisor-refresh',expires_at:Date.now()/1000+3600,user:{id:advisor},providerSessionId:option},capabilities={view:true,edit:false,publish:false,confirmPayments:false};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64');
function source(){let descriptor:any={evidenceId:evidence,schemaVersion:2,paymentOptionId:option,expiresInSeconds:60,signedUrl:`${SUPABASE_ORIGIN}/storage/v1/object/sign/concierge-payment-evidence/${client}/${quote}/${evidence}.png?token=synthetic-private-signature`},storage=0,edge=0,denied=false;const calls:any[]=[];
 const provider=new SupabaseProvider('sb_publishable_synthetic',async(input:any,init:any)=>{calls.push({url:String(input),init});if(String(input).includes('/functions/')){edge++;if(denied)return Response.json({code:'forbidden'},{status:403});return Response.json(descriptor);}storage++;assert.equal(new Headers(init?.headers).has('Authorization'),false);return new Response(png,{headers:{'content-type':'image/png'}});});
 return {provider,calls,patch:(value:any)=>descriptor={...descriptor,...value},deny:()=>denied=true,counts:()=>({edge,storage})};
}
test('advisor evidence URL is replaced by a token-free owner-bound proxy and bytes reauthorize the signed source',async()=>{
 const s=source(),command:any={kind:'command',channel:'payments',command:{action:'evidence_url',evidenceId:evidence,schemaVersion:2}};
 const result=await s.provider.perform(credentials,capabilities,command),body=result.body as any;
 const proxy=new URL(body.signedUrl);assert.equal(proxy.origin,PORTAL_ORIGIN);assert.equal(proxy.pathname,'/api/advisor/media/evidence');assert.equal(proxy.searchParams.get('clientId'),client);assert.equal(proxy.searchParams.get('evidenceId'),evidence);assert.equal(proxy.searchParams.get('v'),'2');assert.match(proxy.searchParams.get('view')||'',/^[a-f0-9-]{36}$/);assert.equal(body.paymentOptionId,option);assert.doesNotMatch(JSON.stringify(body),/synthetic-private-signature|synthetic-advisor-access|synthetic-advisor-refresh|\/storage\//);
 const image=await s.provider.perform(credentials,capabilities,{kind:'advisor-evidence',clientId:client,evidenceId:evidence,schemaVersion:2} as any);assert.deepEqual(Buffer.from(image.bytes!),png);assert.deepEqual(s.counts(),{edge:2,storage:1});
 s.deny();await assert.rejects(s.provider.perform(credentials,capabilities,{kind:'advisor-evidence',clientId:client,evidenceId:evidence,schemaVersion:2} as any),(error:any)=>error.status===403);assert.equal(s.counts().storage,1);
});
test('advisor screenshot proxy refuses foreign target/path/origin, signatures and malformed metadata before image fetch',async()=>{
 for(const patch of [{signedUrl:`https://attacker.invalid/storage/v1/object/sign/concierge-payment-evidence/${client}/${quote}/${evidence}.png?token=x`},{signedUrl:`${SUPABASE_ORIGIN}/storage/v1/object/sign/concierge-checkin-photos/${client}/${evidence}.png?token=x`},{signedUrl:`${SUPABASE_ORIGIN}/storage/v1/object/sign/concierge-payment-evidence/${advisor}/${quote}/${evidence}.png?token=x`},{signedUrl:`${SUPABASE_ORIGIN}/storage/v1/object/sign/concierge-payment-evidence/${client}/${quote}/${evidence}.png?token=x&extra=y`},{paymentOptionId:'PRIVATE_CANARY'},{expiresInSeconds:61},{evidenceId:quote}]){
  const s=source();s.patch(patch);await assert.rejects(s.provider.perform(credentials,capabilities,{kind:'advisor-evidence',clientId:client,evidenceId:evidence,schemaVersion:2} as any));assert.equal(s.counts().storage,0);
 }
});

test('actual advisor cookie transport opens private screenshot bytes and fences held images after permission loss or logout', {timeout:30000},async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-networking','--no-proxy-server','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});
 const site=resolve(fileURLToPath(new URL('../../../site/',import.meta.url))),gateway=process.env.ADVISOR_EVIDENCE_GATEWAY_MODULE?(await import(pathToFileURL(process.env.ADVISOR_EVIDENCE_GATEWAY_MODULE).href)).default:advisorGateway;
 const output=process.env.ADVISOR_EVIDENCE_ARTIFACTS;if(output)await mkdir(output,{recursive:true});
 try{for(const ending of ['permission','logout']){
  let enabled=true,record:any=null,hold=false,entered!:()=>void,release!:()=>void;const waiting=new Promise<void>(done=>entered=done),gate=new Promise<void>(done=>release=done),apiResults:{path:string;status:number}[]=[],outside:string[]=[],errors:string[]=[];
  const view={schemaVersion:2,revision:1,quotes:[{id:quote,version:1,publicationVersion:0,currency:'USD',status:'payable',serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000,contractVersion:2,paymentOptions:[{id:option,recipientVersion:1,recipient:{method:'zelle',name:'Synthetic advisor',email:'advisor@example.invalid',phone:'9255550101'},available:true}]}],claims:[{id:advisor,quoteId:quote,quoteVersion:1,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,status:'submitted_unverified',evidenceId:evidence,paymentOptionId:option}],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:null,shippingAddresses:[]};
  const provider=new SupabaseProvider('sb_publishable_synthetic',async(input:any,init:any)=>{
   const url=new URL(String(input));assert.equal(url.origin,SUPABASE_ORIGIN);if(url.pathname.includes('/functions/')){const command=JSON.parse(init.body);if(command.action==='advisor_read')return Response.json(view);assert.equal(command.action,'evidence_url');assert.equal(command.evidenceId,evidence);return Response.json({schemaVersion:2,paymentOptionId:option,evidenceId:evidence,expiresInSeconds:60,signedUrl:`${SUPABASE_ORIGIN}/storage/v1/object/sign/concierge-payment-evidence/${client}/${quote}/${evidence}.png?token=synthetic-private-signature`});}
   assert.equal(new Headers(init?.headers).has('Authorization'),false);if(hold){entered();await gate;}return new Response(png,{headers:{'content-type':'image/png'}});
  });
  const auth={refresh:async()=>credentials,context:async()=>{if(!enabled)throw Object.assign(Error('forbidden'),{status:403,code:'forbidden'});return {ownerId:advisor,providerSessionId:option,capabilities};},logout:async()=>{}};
  const vault=new SessionVault({read:()=>structuredClone(record),write:value=>{record=structuredClone(value);}},new CredentialEnvelope(JSON.stringify({active:'synthetic',keys:{synthetic:Buffer.alloc(32,7).toString('base64url')}}),'advisor-evidence:'+ending),auth,{now:()=>Date.now(),idleMs:3600000,absoluteMs:28800000,recheckContext:true,policyAudience:'advisor'});
  const initial=await vault.initialize(credentials,'synthetic-evidence-grant'),sid='A'.repeat(43),namespace='session:'+await digest('session:'+sid);
  const env:any={
   PORTAL_ORIGIN,ADVISOR_SHARED_SESSIONS:'true',CLIENT_SHARED_SESSIONS:'true',ASSETS:{fetch:async()=>new Response('',{status:404})},
   ADVISOR_SESSIONS:{getByName:(name:string)=>({invoke:async(command:any)=>{
    try{
     assert.equal(name,namespace);let value;
     if(command.type==='session.view')value=await vault.view();
     else if(command.type==='session.execute')value=await vault.execute(command.csrf,(c,k)=>provider.perform(c,k,command.operation));
     else if(command.type==='session.logout-context')value=vault.logoutContext();
     else if(command.type==='session.logout')value=await vault.logout(command.csrf);
     else assert.fail(command.type);
     return {ok:true,value};
    }catch(error:any){return {ok:false,error:{status:error.status??503,code:error.code??'unavailable'}};}
   }})}
  };
  const ctx=await browser.newContext({viewport:{width:390,height:1000},serviceWorkers:'block'});await ctx.setOffline(true);await ctx.addCookies([{name:'__Host-shelv_advisor',value:sid,domain:'portal.goshelv.com',path:'/',httpOnly:true,secure:true,sameSite:'Lax'}]);
  await ctx.route('**/*',async route=>{const request=route.request(),url=new URL(request.url());if(url.origin!==PORTAL_ORIGIN){outside.push(url.origin);return route.abort();}
   if(url.pathname.startsWith('/api/')){const headers=new Headers(await request.allHeaders());headers.set('sec-fetch-site','same-origin');if(request.method()==='POST')headers.set('origin',PORTAL_ORIGIN);const body=request.postDataBuffer();const result=await gateway.fetch(new Request(request.url(),{method:request.method(),headers,...(body?{body}:{}),redirect:'manual'}),env);apiResults.push({path:url.pathname,status:result.status});return route.fulfill({status:result.status,headers:Object.fromEntries(result.headers),body:Buffer.from(await result.arrayBuffer())});}
   if(url.pathname==='/__advisor-evidence.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><p>Local synthetic advisor transport test. No funds or real receipt.</p><div id="payments"></div>'});
   const file=resolve(site,'.'+url.pathname);if(!file.startsWith(site+sep))return route.abort();try{return route.fulfill({body:await readFile(file),contentType:({'.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream'});}catch{return route.fulfill({status:404,body:''});}
  });
  const page=await ctx.newPage();page.setDefaultTimeout(5000);page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(PORTAL_ORIGIN+'/__advisor-evidence.html');await page.evaluate(async({client,adapter,feature})=>{const [{CookieAdvisorSession,createCookieRequest},{mountPaymentsPanel}]=await Promise.all([import(adapter),import(feature)]);const session=new CookieAdvisorSession();(window as any).__evidenceSession=session;await session.restore();mountPaymentsPanel(document.querySelector('#payments'),{mode:'advisor',clientId:client,request:createCookieRequest('payments',session),canWrite:false,canConfirm:false});},{client,adapter:'/auth/advisor-cookie-session.js',feature:'/features/payments/index.js'});
   await page.locator('.shelv-payments[aria-busy=false]').waitFor();await page.getByRole('button',{name:'View private screenshot',exact:true}).click();await page.locator('.payment-evidence img').waitFor();await page.waitForFunction(()=>{const image=document.querySelector('.payment-evidence img') as HTMLImageElement;return image?.complete&&image.naturalWidth>0;});
   assert.match(await page.locator('.payment-evidence img').getAttribute('src')||'',/\/api\/advisor\/media\/evidence\?/);assert.doesNotMatch(await page.content(),/synthetic-private-signature|synthetic-advisor-access|synthetic-advisor-refresh|\/storage\/v1\/object\/sign\//);
   if(output&&ending==='permission')await page.screenshot({path:resolve(output,'advisor-cookie-private-screenshot-390.png'),fullPage:true});
   await page.getByRole('button',{name:'Hide screenshot',exact:true}).click();hold=true;await page.getByRole('button',{name:'View private screenshot',exact:true}).click();let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([waiting,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Reopened image did not reauthorize its source through the gateway')),5000);})]);}finally{clearTimeout(timer);}
   if(ending==='permission')enabled=false;else await vault.logout(initial.csrf);release();await page.waitForFunction(()=>{const image=document.querySelector('.payment-evidence img') as HTMLImageElement;return image?.complete&&image.naturalWidth===0;});
   assert.ok(apiResults.some(result=>result.path==='/api/advisor/media/evidence'&&[401,403].includes(result.status)),'Held private bytes are refused after session or permission ends');assert.equal(record.credentials,null);assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);
  }finally{release();await page.evaluate(()=>(window as any).__evidenceSession?.dispose()).catch(()=>{});await ctx.close();await vault.retire();}
 }}finally{await browser.close();}
});
