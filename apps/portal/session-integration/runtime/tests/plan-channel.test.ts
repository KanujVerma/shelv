import assert from 'node:assert/strict';
import test from 'node:test';
import {parseCommand,type Operation} from '../server/policy';
import {parseClientCommand} from '../server/client-policy';
import {SupabaseProvider} from '../server/upstream';
import {ClientProvider} from '../server/client-upstream';
import clientGateway,{advisorGateway,type GatewayEnv} from '../server/gateway';
import {CookieAdvisorSession,createCookieRequest} from '../../../site/auth/advisor-cookie-session.js';
import {CookieClientSession,createClientCookieRequest} from '../../../site/auth/client-cookie-session.js';
import {createEmptyPlanContent} from '../../../../../src/contracts/PortalRebuild.ts';

const owner='11111111-1111-4111-8111-111111111111',draft='22222222-2222-4222-8222-222222222222',requestId='33333333-3333-4333-8333-333333333333';
const create={schemaVersion:1,action:'create_draft_v1',requestId,kind:'care_plan',templateVersionId:null};
const read={schemaVersion:1,action:'read_client_plan_v1',version:null};
const preparation={schemaVersion:1,access:'preparation',plan:null,decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null};
const savedDraft={draft:{id:draft,clientId:null,kind:'care_plan',state:'working',contentRevision:0,assignmentRevision:0,contentHash:'a'.repeat(64),content:createEmptyPlanContent(),savedAt:'2026-10-30T00:00:00Z',basis:{publicationVersion:null,useRevision:0},origin:{kind:'new',id:null}},target:null,sections:[],issues:[]};
const view={view:true,edit:false,publish:false,confirmPayments:false};
const credentials={access_token:'synthetic-plan-access',refresh_token:'synthetic-plan-refresh',expires_at:9999999999,user:{id:owner},providerSessionId:draft};
const rejects=(fn:()=>unknown,status:number)=>assert.throws(fn,error=>(error as {status?:number}).status===status);

test('the advisor plan channel accepts an unassigned draft operation and strictly rejects injected authority or RPCs',()=>{
 const parsed=parseCommand('plans',create);
 assert.equal(parsed.kind,'command');
 assert.deepEqual(parsed,{kind:'command',channel:'plans',command:create});
 assert.deepEqual(parseCommand('plans',{schemaVersion:1,action:'read_draft_v1',draftId:draft}),{kind:'command',channel:'plans',command:{schemaVersion:1,action:'read_draft_v1',draftId:draft}});
 for(const extra of [{approved:true},{rpc:'arbitrary'},{clientId:owner},{authorization:'secret'}])rejects(()=>parseCommand('plans',{...create,...extra}),400);
});

test('client plan commands derive the owner and cannot reach advisor or agent-grant commands',()=>{
 assert.deepEqual(parseClientCommand('plans',read),{kind:'command',channel:'plans',command:read});
 rejects(()=>parseClientCommand('plans',{...read,clientId:owner}),400);
 for(const command of [create,{schemaVersion:1,action:'read_draft_v1',draftId:draft},{schemaVersion:1,action:'read_policy_v1'}])rejects(()=>parseClientCommand('plans',command),403);
});

test('plan provider routing uses one fixed Edge function and requires edit or publication capability before egress',async()=>{
 const calls:{url:string;body:unknown}[]=[];
 const provider=new SupabaseProvider('sb_publishable_synthetic',async(input,init)=>{
  calls.push({url:String(input),body:JSON.parse(String(init?.body))});return Response.json(savedDraft);
 });
 const operation={kind:'command',channel:'plans',command:create} as Operation;
 await assert.rejects(provider.perform(credentials,view,operation),error=>(error as {status?:number}).status===403);
 assert.equal(calls.length,0);
 const result=await provider.perform(credentials,{...view,edit:true},operation);
 assert.deepEqual(result,{status:200,body:savedDraft});
 assert.deepEqual(calls,[{url:'https://snojlbqovlawewwqbviz.supabase.co/functions/v1/concierge-plans',body:create}]);
 const publish={kind:'command',channel:'plans',command:{schemaVersion:1,action:'publish_plan_v1',requestId,target:{draftId:draft,clientId:owner,contentRevision:1,assignmentRevision:1,contentHash:'a'.repeat(64)},approvalId:requestId,firstServiceClaimId:requestId}} as Operation;
 await assert.rejects(provider.perform(credentials,{...view,edit:true},publish),error=>(error as {status?:number}).status===403);
 assert.equal(calls.length,1);
});

test('malformed plan success data cannot become a trusted response',async()=>{
 const provider=new SupabaseProvider('sb_publishable_synthetic',async()=>Response.json({saved:true}));
 const operation={kind:'command',channel:'plans',command:create} as Operation;
 await assert.rejects(provider.perform(credentials,{...view,edit:true},operation),error=>(error as {status?:number}).status===503);
});
test('known payment conflicts retain their safe code across the provider boundary',async()=>{
 const provider=new SupabaseProvider('sb_publishable_synthetic',async()=>Response.json({code:'payment_required'},{status:409}));
 const operation={kind:'command',channel:'plans',command:create} as Operation;
 await assert.rejects(provider.perform(credentials,{...view,edit:true},operation),error=>(error as {status?:number;code?:string}).status===409&&(error as {code?:string}).code==='payment_required');
});

test('client plan provider preserves the client-only gate and credential/private-field fences',async()=>{
 let leak=false;const calls:string[]=[];
 const provider=new ClientProvider('sb_publishable_synthetic',async(input)=>{calls.push(String(input));return Response.json(leak?{...preparation,privateNotes:'PRIVATE_PLAN_CANARY'}:preparation);});
 const operation={kind:'command',channel:'plans',command:read} as Operation;
 assert.deepEqual(await provider.perform(credentials,view,operation),{status:200,body:preparation});
 assert.deepEqual(calls,['https://snojlbqovlawewwqbviz.supabase.co/functions/v1/concierge-plans']);
 await assert.rejects(provider.perform(credentials,{...view,edit:true},operation),error=>(error as {status?:number}).status===403);
 leak=true;await assert.rejects(provider.perform(credentials,view,operation),error=>(error as {status?:number}).status===503);
});

test('the retained browser factories expose the fixed plan channel with cookie, CSRF and no-store transport',async()=>{
 for(const audience of ['advisor','client'] as const){
  const calls:{url:string;init:RequestInit}[]=[];
  const sessionView={signedIn:true,ownerId:owner,generation:1,csrf:'csrf-plan',capabilities:view,idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+7200000).toISOString()};
  const fetcher=async(url:string,init:RequestInit)=>{calls.push({url,init});return Response.json(url.endsWith('/session')?sessionView:preparation);};
  const locks={request:async(_name:string,_options:unknown,run:()=>Promise<unknown>)=>run()};
  const session=audience==='client'?new CookieClientSession({fetcher,locks}):new CookieAdvisorSession({fetcher,locks});
  try{
   await session.restore();
   const execute=audience==='client'?createClientCookieRequest('plans',session):createCookieRequest('plans',session);
   await execute(audience==='client'?read:create);
   const emitted=calls.at(-1)!;assert.equal(emitted.url,'/api/'+audience+'/plans');
   const headers=new Headers(emitted.init.headers);assert.equal(headers.get('x-shelv-csrf'),'csrf-plan');assert.equal(headers.has('authorization'),false);
   assert.equal(emitted.init.credentials,'same-origin');assert.equal(emitted.init.cache,'no-store');assert.equal(emitted.init.redirect,'error');
  }finally{session.dispose();}
 }
});

test('new plan gateway routes retain CSRF and missing-session denial before any vault invocation',async()=>{
 const env={PORTAL_ORIGIN:'https://portal.goshelv.com',CLIENT_SHARED_SESSIONS:'true',ADVISOR_SESSIONS:{getByName:()=>assert.fail('no vault invocation without a session')},ASSETS:{fetch:()=>assert.fail('API must not fall through to assets')}} as GatewayEnv;
 for(const [audience,gateway,command] of [['advisor',advisorGateway,create],['client',clientGateway,read]] as const){
  const call=(csrf?:string)=>gateway.fetch(new Request('https://portal.goshelv.com/api/'+audience+'/plans',{method:'POST',headers:{origin:'https://portal.goshelv.com','sec-fetch-site':'same-origin','content-type':'application/json',...(csrf?{'x-shelv-csrf':csrf}:{})},body:JSON.stringify(command)}),env);
  assert.equal((await call()).status,403);const absent=await call('synthetic-csrf');assert.equal(absent.status,401);assert.match(absent.headers.get('cache-control')??'',/no-store/);
 }
});

test('only the richer plan protocol accepts bounded JSON above the retained 100KB legacy limit',async()=>{
 const content=createEmptyPlanContent();
 content.context.facts=Array.from({length:80},(_,i)=>({id:'fact-'+i,kind:'client_report',visibility:'advisor_only',text:'x'.repeat(1500),sources:[],contradicts:[]}));
 const command={schemaVersion:1,action:'save_draft_v1',requestId,draftId:draft,kind:'care_plan',expectedContentRevision:0,expectedAssignmentRevision:0,content};
 assert.ok(new TextEncoder().encode(JSON.stringify(command)).length>100000);
 const sessionView={signedIn:true,ownerId:owner,generation:1,csrf:'csrf-plan',capabilities:{...view,edit:true},idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+7200000).toISOString()};
 const sent:string[]=[];
 const session=new CookieAdvisorSession({locks:{request:async(_name:string,_options:unknown,run:()=>Promise<unknown>)=>run()},fetcher:async(url:string)=>{sent.push(url);return Response.json(url.endsWith('/session')?sessionView:savedDraft);}});
 try{
  await session.restore();await createCookieRequest('plans',session)(command);assert.equal(sent.at(-1),'/api/advisor/plans');
  await assert.rejects(createCookieRequest('operations',session)({action:'save_draft_v2',data:'x'.repeat(110000)}),error=>(error as {status?:number}).status===413);
  await assert.rejects(createCookieRequest('plans',session)({...command,extra:'x'.repeat(500001)}),error=>(error as {status?:number}).status===413);
 }finally{session.dispose();}
 const env={PORTAL_ORIGIN:'https://portal.goshelv.com',ADVISOR_SESSIONS:{getByName:()=>assert.fail('no unauthenticated dispatch')},ASSETS:{fetch:()=>assert.fail('no API asset fallback')}} as GatewayEnv;
 const call=(channel:string,body:unknown)=>advisorGateway.fetch(new Request('https://portal.goshelv.com/api/advisor/'+channel,{method:'POST',headers:{origin:'https://portal.goshelv.com','sec-fetch-site':'same-origin','content-type':'application/json','x-shelv-csrf':'synthetic'},body:JSON.stringify(body)}),env);
 assert.equal((await call('plans',command)).status,401);
 assert.equal((await call('operations',command)).status,413);
 assert.equal((await call('plans',{...command,extra:'x'.repeat(500001)})).status,413);
});
