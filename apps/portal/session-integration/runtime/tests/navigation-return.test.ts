import test from 'node:test';import assert from 'node:assert/strict';
import {ClientProvider} from '../server/client-upstream';import {SupabaseProvider} from '../server/upstream';
const origin='https://portal.goshelv.com',client='11111111-1111-4111-8111-111111111111';
for(const audience of ['client','advisor'] as const)test(`${audience} OTP keeps validated navigation and rejects redirect/credential injection before provider traffic`,async()=>{
 const requests:URL[]=[];const fetcher=async(input:any)=>{requests.push(new URL(String(input)));return Response.json({});};const Provider=audience==='client'?ClientProvider:SupabaseProvider;const provider=new Provider('sb_publishable_synthetic',fetcher);
 const target=audience==='client'?'/?workspace=client&clientView=routine&product=step%3Abaseline-moisturizer':`/?workspace=advisor&advisorClient=${client}&advisorTask=draft`;
 await provider.requestOtp('synthetic@example.invalid',target);assert.equal(requests[0].searchParams.get('redirect_to'),origin+target);
 await provider.requestOtp('synthetic@example.invalid');assert.equal(requests[1].searchParams.get('redirect_to'),origin+'/?workspace='+audience);
 for(const target of ['https://evil.example/','//evil.example/','/\\evil.example/','/other?workspace='+audience,'/?workspace='+audience+'#access_token=secret','/?workspace='+audience+'&token=secret','/?workspace='+audience+'&clientView=routine&unknown=1','/?workspace='+audience+'&workspace='+audience,'/?workspace='+(audience==='client'?'advisor':'client'),'/?workspace=advisor&advisorClient=not-a-uuid&advisorTask=draft','/?workspace=client&clientView=routine&product=step%3A..%2Fprivate']){
  const before=requests.length;await assert.rejects(provider.requestOtp('synthetic@example.invalid',target));assert.equal(requests.length,before,'Invalid continuation never reaches the provider');
 }
});

import gateway,{advisorGateway} from '../server/gateway';
import {CookieAdvisorSession} from '../../../site/auth/advisor-cookie-session.js';
import {CookieClientSession} from '../../../site/auth/client-cookie-session.js';
import {portalLoginRedirect,portalReturnPath,navigationReturnTo} from '../../../site/auth/navigation-return.js';
for(const audience of ['client','advisor'] as const)test(`${audience} cookie auth request preserves only validated continuation and gateway rejects unknown input`,async()=>{
 const target=audience==='client'?'/?workspace=client&clientView=history':`/?workspace=advisor&advisorClient=${client}&advisorTask=draft`;
 const outbound:any[]=[];const Session=audience==='client'?CookieClientSession:CookieAdvisorSession;
 const session=new Session({locks:{request:async(_n:any,_o:any,fn:any)=>fn()},fetcher:async(path:any,init:any)=>{outbound.push({path,init});return Response.json(path.endsWith('/session')?{signedIn:false,csrf:'synthetic-flow',flowExpiresAt:'2099-01-01T00:00:00Z'}:{sent:true});}});
 try{await session.sendLink('synthetic@example.invalid',origin+target);assert.deepEqual(JSON.parse(outbound.at(-1).init.body),{email:'synthetic@example.invalid',remember:false,returnTo:target});}finally{session.dispose();}
 const commands:any[]=[],env:any={PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true',ADVISOR_SESSIONS:{getByName:()=>({invoke:async(command:any)=>{commands.push(command);return {ok:true,value:command.type==='limit'?{allowed:true}:{sent:true}};}})}};
 const request=(returnTo:any)=>new Request(origin+`/api/${audience}/auth/request`,{method:'POST',headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':'192.0.2.1','Content-Type':'application/json','X-Shelv-CSRF':'synthetic-flow',Cookie:`__Host-shelv_${audience}_flow=${'a'.repeat(43)}`},body:JSON.stringify({email:'synthetic@example.invalid',remember:false,returnTo})});
 const route=audience==='client'?gateway:advisorGateway;assert.equal((await route.fetch(request(target),env)).status,200);assert.equal(commands.at(-1).returnTo,target);
 for(const invalid of ['//evil.example/','/?workspace='+audience+'&access_token=private','/?workspace='+(audience==='client'?'advisor':'client')]){const before=commands.length;assert.equal((await route.fetch(request(invalid),env)).status,400);assert.equal(commands.length,before);}
});
test('login return builder drops unrelated URL inputs and retains only valid role navigation',()=>{
 assert.equal(portalLoginRedirect({href:origin+`/?workspace=advisor&advisorClient=${client}&advisorTask=draft&health=private#/advisor`},'advisor'),origin+`/?workspace=advisor&advisorClient=${client}&advisorTask=draft`);
 assert.equal(portalLoginRedirect({href:origin+'/?clientView=routine&product=step%3Abaseline-moisturizer&token=private#/client'},'client'),origin+'/?workspace=client&clientView=routine&product=step%3Abaseline-moisturizer');
 assert.equal(portalLoginRedirect({href:origin+'/?advisorClient=invalid&advisorTask=draft'},'advisor'),origin+'/?workspace=advisor');
});

import {AuthFlow} from '../server/auth-flow';import {CredentialEnvelope} from '../server/credential-envelope';
test('PKCE flow forwards only the transient return argument without adding persisted navigation state',async()=>{
 let record:any=null,seen:string|undefined;const target='/?workspace=client&clientView=routine';
 const auth:any={requestOtp:async(_email:string,returnTo?:string)=>{seen=returnTo;return {verifier:'synthetic'};}};
 const flow=new AuthFlow({read:()=>record,write:value=>{record=structuredClone(value);}},new CredentialEnvelope(JSON.stringify({active:'one',keys:{one:Buffer.alloc(32,9).toString('base64url')}}),'flow-synthetic'),auth,()=>({} as any),{now:()=>1800000000000,flowMs:600000});
 const state=await flow.bootstrap();await flow.request(state.csrf,'synthetic@example.invalid',false,target);assert.equal(seen,target);assert.doesNotMatch(JSON.stringify(record),/clientView|returnTo|workspace/);
});

for(const audience of ['client','advisor'] as const)test(`${audience} semantic continuation survives cookie factory, gateway and OTP without granting owner authority`,async()=>{
 const target=audience==='client'?'/plan/products/cerave-pm/evidence?routine=evening':'/advisor/plans/draft-opaque/review-publish';
 const requests:URL[]=[],Provider=audience==='client'?ClientProvider:SupabaseProvider;
 const provider=new Provider('sb_publishable_synthetic',async(input:any)=>{requests.push(new URL(String(input)));return Response.json({});});
 await provider.requestOtp('synthetic@example.invalid',target);assert.equal(requests[0].searchParams.get('redirect_to'),origin+target);
 const outbound:any[]=[],Session=audience==='client'?CookieClientSession:CookieAdvisorSession;
 const session=new Session({locks:{request:async(_n:any,_o:any,fn:any)=>fn()},fetcher:async(path:any,init:any)=>{outbound.push({path,init});return Response.json(path.endsWith('/session')?{signedIn:false,csrf:'synthetic-flow',flowExpiresAt:'2099-01-01T00:00:00Z'}:{sent:true});}});
 try{await session.sendLink('synthetic@example.invalid',origin+target);assert.equal(JSON.parse(outbound.at(-1).init.body).returnTo,target);}finally{session.dispose();}
 const commands:any[]=[],env:any={PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true',ADVISOR_SESSIONS:{getByName:()=>({invoke:async(command:any)=>{commands.push(command);return {ok:true,value:command.type==='limit'?{allowed:true}:{sent:true}};}})}};
 const request=new Request(origin+`/api/${audience}/auth/request`,{method:'POST',headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':'192.0.2.1','Content-Type':'application/json','X-Shelv-CSRF':'synthetic-flow',Cookie:`__Host-shelv_${audience}_flow=${'a'.repeat(43)}`},body:JSON.stringify({email:'synthetic@example.invalid',remember:false,returnTo:target})});
 assert.equal((await (audience==='client'?gateway:advisorGateway).fetch(request,env)).status,200);assert.equal(commands.at(-1).returnTo,target);
 assert.equal(navigationReturnTo(origin+(audience==='client'?'/plan':'/advisor/plans'),audience,origin),audience==='client'?'/plan':'/advisor/plans','Paths without query strings remain real destinations');
});
test('semantic login return builder strips unrelated query/fragment inputs and uses the shared route grammar',()=>{
 assert.equal(portalLoginRedirect({href:origin+'/plan/products/cerave-pm/evidence?routine=evening&token=private#access_token=private'},'client'),origin+'/plan/products/cerave-pm/evidence?routine=evening');
 assert.equal(portalLoginRedirect({href:origin+'/advisor/clients/client-opaque?task=draft&health=private'},'advisor'),origin+'/advisor/clients/client-opaque?task=draft');
 for(const target of ['/plan','/history/new','/history/versions/3','/orders/order-opaque','/account/service','/notifications'])assert.equal(portalReturnPath(target,'client'),target);
 for(const target of ['/advisor/clients','/advisor/plans','/advisor/permissions','/advisor/plans/draft-opaque/preview','/advisor/reviews/report-opaque'])assert.equal(portalReturnPath(target,'advisor'),target);
 assert.equal(portalReturnPath('/plan/products/card%3Atreatment?routine=morning','client'),'/plan/products/card%3Atreatment');
});
test('semantic auth recovery rejects cross-audience, unknown, credential-bearing and encoded escape routes before any provider request',async()=>{
 let calls=0;const provider=new ClientProvider('sb_publishable_synthetic',async()=>{calls++;return Response.json({});});
 for(const target of ['/maya?stage=2','/advisor/clients','/plan?routine=evening&routine=morning','/plan?workspace=client','/plan?access_token=private','/plan/products/a%2Fb','/plan/products/%2e%2e','/plan/../account','/plan/products/a%5Cb','/plan/products/a%00b','/plan/products/%252e%252e','/account/unknown']){
  await assert.rejects(provider.requestOtp('synthetic@example.invalid',target),undefined,target);assert.equal(calls,0);
 }
 for(const target of ['/plan','/maya','/history'])assert.throws(()=>portalReturnPath(target,'advisor'));
 assert.throws(()=>navigationReturnTo('https://user:private@portal.goshelv.com/plan','client',origin));
 assert.equal(portalLoginRedirect({href:origin+'/advisor/plans/draft/preview'},'client'),origin+'/?workspace=client');
});
