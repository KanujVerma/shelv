import assert from 'node:assert/strict';
import test from 'node:test';
import {parseCommand,type Operation} from '../server/policy';
import {parseClientCommand} from '../server/client-policy';
import {SupabaseProvider} from '../server/upstream';
import {ClientProvider} from '../server/client-upstream';
import clientGateway,{advisorGateway,type GatewayEnv} from '../server/gateway';
import {CookieAdvisorSession,createCookieRequest} from '../../../site/auth/advisor-cookie-session.js';
import {CookieClientSession,createClientCookieRequest} from '../../../site/auth/client-cookie-session.js';
import {careCommandMaxBytes,careClientActions,careAdvisorActions} from '../../../../../src/contracts/PortalCareValues.ts';
import {CARE_COMMAND_MAX_BYTES,clientCareActions,advisorCareActions} from '../../../site/auth/care-actions.js';

// Synthetic protocol proof only. No Auth, database, provider or money action.
const owner='11111111-1111-4111-8111-111111111111',sessionId='22222222-2222-4222-8222-222222222222',requestId='33333333-3333-4333-8333-333333333333';
const publication={version:1,documentSchemaVersion:3};
const use={schemaVersion:1,action:'report_product_use_v1',requestId,expectedUseRevision:0,product:{kind:'plan_product',publication,productId:'existing-cleanser',slotId:null},change:{kind:'stopped',details:null},sourcePublication:publication,occurredOn:{state:'unknown'},channel:'portal',acquisition:'already_owned',identityEventId:null};
const recorded={...use,action:'record_client_use_v1',clientId:owner,confirmedClientReport:true};
const read={schemaVersion:1,action:'read_client_plan_v2',version:null};
const preparation={schemaVersion:2,access:'preparation',plan:null,decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null,use:{revision:0,planProducts:[],reportedProducts:{items:[],nextCursor:null}},latestPublicReview:null};
const receipt={requestId,event:{kind:'use',id:requestId},revision:1,recordedAt:'2026-10-30T00:00:00Z',notificationEventId:null};
const credentials={access_token:'synthetic-care-access',refresh_token:'synthetic-care-refresh',expires_at:9999999999,user:{id:owner},providerSessionId:sessionId};
const view={view:true,edit:false,publish:false,confirmPayments:false};
const rejects=(run:()=>unknown,status:number)=>assert.throws(run,e=>(e as {status?:number}).status===status);

test('care commands preserve owner inference and reject all extra authority before dispatch',()=>{
 assert.deepEqual(parseClientCommand('care',read),{kind:'command',channel:'care',command:read});
 assert.deepEqual(parseClientCommand('care',use),{kind:'command',channel:'care',command:use});
 assert.deepEqual(parseCommand('care',recorded),{kind:'command',channel:'care',command:recorded});
 for(const extra of [{clientId:owner},{rpc:'other'},{actorId:owner},{approved:true},{url:'https://other.invalid'},{startedOn:'2026-10-01'}])rejects(()=>parseClientCommand('care',{...use,...extra}),400);
 rejects(()=>parseClientCommand('care',recorded),403);
 rejects(()=>parseCommand('care',use),403);
 rejects(()=>parseClientCommand('care',{schemaVersion:1,action:'grant_task_v1'}),400);
});

test('advisor care writes need edit before fixed Edge egress and strict receipts bind the request',async()=>{
 const calls:{url:string;body:unknown}[]=[];let data:unknown=receipt;
 const provider=new SupabaseProvider('sb_publishable_synthetic',async(url,init)=>{calls.push({url:String(url),body:JSON.parse(String(init?.body))});return Response.json(data);});
 const operation={kind:'command',channel:'care',command:recorded} as Operation;
 await assert.rejects(provider.perform(credentials,view,operation),e=>(e as {status?:number}).status===403);assert.equal(calls.length,0);
 assert.deepEqual(await provider.perform(credentials,{...view,edit:true},operation),{status:200,body:receipt});
 assert.deepEqual(calls,[{url:'https://snojlbqovlawewwqbviz.supabase.co/functions/v1/concierge-care',body:recorded}]);
 for(data of [{...receipt,requestId:sessionId},{...receipt,privateNotes:'PRIVATE_CARE_CANARY'},{saved:true},{...receipt,access_token:credentials.access_token}])await assert.rejects(provider.perform(credentials,{...view,edit:true},operation),e=>(e as {status?:number}).status===503);
});

test('safe care advisor history uses view while the client cannot select another owner',async()=>{
 const command={schemaVersion:1,action:'read_advisor_use_history_v1',clientId:owner,product:null,cursor:null,limit:10};
 rejects(()=>parseClientCommand('care',command),403);
 const data={revision:0,entries:[],nextCursor:null},calls:string[]=[];
 const provider=new SupabaseProvider('sb_publishable_synthetic',async(url)=>{calls.push(String(url));return Response.json(data);});
 assert.deepEqual(await provider.perform(credentials,view,parseCommand('care',command)),{status:200,body:data});
 assert.deepEqual(calls,['https://snojlbqovlawewwqbviz.supabase.co/functions/v1/concierge-care']);
 await assert.rejects(provider.perform(credentials,{...view,view:false},parseCommand('care',command)),e=>(e as {status?:number}).status===403);assert.equal(calls.length,1);
});

test('client care responses are finite, credential-free and keep safe version conflicts',async()=>{
 let data:unknown=preparation,status=200;const calls:string[]=[];
 const provider=new ClientProvider('sb_publishable_synthetic',async(url)=>{calls.push(String(url));return Response.json(data,{status});});
 const operation={kind:'command',channel:'care',command:read} as Operation;
 assert.deepEqual(await provider.perform(credentials,view,operation),{status:200,body:preparation});
 assert.equal(calls[0],'https://snojlbqovlawewwqbviz.supabase.co/functions/v1/concierge-care');
 for(data of [{...preparation,privateNotes:'PRIVATE_CARE_CANARY'},{...preparation,transcript:'PRIVATE_CARE_CANARY'},{...preparation,use:{...preparation.use,extra:true}}])await assert.rejects(provider.perform(credentials,view,operation),e=>(e as {status?:number}).status===503);
 data={code:'use_version_required'};status=409;await assert.rejects(provider.perform(credentials,view,operation),e=>(e as {status?:number;code?:string}).status===409&&(e as {code?:string}).code==='use_version_required');
});

test('care routes retain CSRF, no-store and missing-session boundaries for both audiences',async()=>{
 const env={PORTAL_ORIGIN:'https://portal.goshelv.com',CLIENT_SHARED_SESSIONS:'true',ADVISOR_SESSIONS:{getByName:()=>assert.fail('no session dispatch')},ASSETS:{fetch:()=>assert.fail('API must not fall through')}} as GatewayEnv;
 for(const [audience,gateway,command] of [['client',clientGateway,read],['advisor',advisorGateway,recorded]] as const){
  const call=(csrf?:string)=>gateway.fetch(new Request('https://portal.goshelv.com/api/'+audience+'/care',{method:'POST',headers:{origin:'https://portal.goshelv.com','content-type':'application/json',...(csrf?{'x-shelv-csrf':csrf}:{})},body:JSON.stringify(command)}),env);
  assert.equal((await call()).status,403);const response=await call('synthetic-care-csrf');assert.equal(response.status,401);assert.match(response.headers.get('cache-control')??'',/no-store/);
 }
});

test('retained cookie factories carry care without provider credentials and retain byte limits',async()=>{
 for(const audience of ['client','advisor'] as const){
  const calls:{url:string;init:RequestInit}[]=[],state={signedIn:true,ownerId:owner,generation:1,csrf:'care-csrf',capabilities:view,idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+7200000).toISOString()};
  const fetcher=async(url:string,init:RequestInit)=>{calls.push({url,init});return Response.json(url.endsWith('/session')?state:preparation);};
  const locks={request:async(_n:string,_o:unknown,run:()=>Promise<unknown>)=>run()};
  const session=audience==='client'?new CookieClientSession({fetcher,locks}):new CookieAdvisorSession({fetcher,locks});
  try{await session.restore();const execute=audience==='client'?createClientCookieRequest('care',session):createCookieRequest('care',session);await execute(audience==='client'?read:recorded);
   const sent=calls.at(-1)!;assert.equal(sent.url,'/api/'+audience+'/care');const h=new Headers(sent.init.headers);assert.equal(h.get('x-shelv-csrf'),'care-csrf');assert.equal(h.has('authorization'),false);assert.equal(h.has('apikey'),false);assert.equal(sent.init.credentials,'same-origin');assert.equal(sent.init.cache,'no-store');assert.equal(sent.init.redirect,'error');
   await assert.rejects(execute({...(audience==='client'?read:recorded),extra:'x'.repeat(careCommandMaxBytes+1)}),e=>(e as {status?:number}).status===413);
  }finally{session.dispose();}
 }
});

test('plan dependency seams stay advisor-only and require edit before egress',async()=>{
 const command={schemaVersion:1,action:'read_draft_dependencies_v1',draftId:sessionId,contentRevision:1,assignmentRevision:1};
 const operation=parseCommand('plans',command);rejects(()=>parseClientCommand('plans',command),403);
 let calls=0;const provider=new SupabaseProvider('sb_publishable_synthetic',async()=>{calls++;return Response.json({});});
 await assert.rejects(provider.perform(credentials,view,operation),e=>(e as {status?:number}).status===403);assert.equal(calls,0);
});


test('browser care metadata matches the canonical finite protocol and size cap',()=>{
 assert.deepEqual(clientCareActions,careClientActions);assert.deepEqual(advisorCareActions,careAdvisorActions);assert.equal(CARE_COMMAND_MAX_BYTES,careCommandMaxBytes);
});
