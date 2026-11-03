import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {ClientProvider} from '../server/client-upstream';
import {SupabaseProvider} from '../server/upstream';
import type {Operation} from '../server/policy';

// Actual workerd fetch/Request behavior, with every outbound request intercepted.
// No Auth, database, durable object, browser, credentials or retained fixture.
const root=fileURLToPath(new URL('../',import.meta.url));
const origin='https://snojlbqovlawewwqbviz.supabase.co';
const owner='11111111-1111-4111-8111-111111111111';
const session='22222222-2222-4222-8222-222222222222';
const delivery='33333333-3333-4333-8333-333333333333';
const requestId='44444444-4444-4444-8444-444444444444';
const at='2026-11-03T12:00:00Z';
const cases=[
 {audience:'client',channel:'notifications',command:{schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:10}},
 {audience:'advisor',channel:'notifications',command:{schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:10}},
 {audience:'client',channel:'notifications',command:{schemaVersion:1,action:'mark_seen_v1',requestId,deliveryId:delivery,expectedRevision:1}},
 {audience:'advisor',channel:'notifications',command:{schemaVersion:1,action:'retry_failed_email_v1',requestId,deliveryId:delivery,expectedRevision:1}},
 {audience:'client',channel:'checkins',command:{action:'read_photo_inventory_v1',cursor:null,limit:10,expectedRevision:null}},
];
function success(command:Record<string,unknown>){
 if(command.action==='read_photo_inventory_v1')return {revision:1,photos:[],nextCursor:null};
 if(command.action==='list_inbox_v1')return {schemaVersion:1,consistency:'live_keyset',observedAt:at,cursor:null,items:[],nextCursor:null};
 return {requestId:command.requestId,action:command.action,deliveryId:command.deliveryId,previousRevision:1,revision:2,recordedAt:at,effect:command.action==='mark_seen_v1'?'seen':'retry_queued'};
}
test('finite provider redirects cancel without reading or awaiting an unbounded body',{timeout:5000},async t=>{
 const expiry=Math.floor(Date.now()/1000)+3600;
 const token=Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:owner,session_id:session,exp:expiry})).toString('base64url')+'.synthetic';
 const credentials={access_token:token,refresh_token:'SYNTHETIC-unused-refresh',expires_at:expiry,user:{id:owner},providerSessionId:session};
 for(const c of cases)await t.test(c.audience+' '+c.command.action,async()=>{
  let cancelled=0,reads=0,contexts=0;
  const fetcher:typeof fetch=async(input,init)=>{
   const path=new URL(String(input)).pathname;
   assert.equal(init?.redirect,'manual');
   if(path.startsWith('/rest/v1/rpc/')){contexts++;return Response.json({ownerId:owner,providerSessionId:session,role:c.audience,sessionNotAfter:null,capabilities:{view:true,edit:c.audience==='advisor',publish:false,confirmPayments:false}});}
   const stream=new ReadableStream({cancel(){cancelled++;return new Promise<void>(()=>{});}});
   Object.defineProperty(stream,'getReader',{value:()=>{reads++;throw Error('redirect body must not be read');}});
   return new Response(stream,{status:302,headers:{Location:'https://never-dispatch.example/private'}});
  };
  const provider=new (c.audience==='client'?ClientProvider:SupabaseProvider)('sb_publishable_synthetic',fetcher,1000,true);
  await assert.rejects(provider.perform(credentials,{view:true,edit:c.audience==='advisor',publish:false,confirmPayments:false},{kind:'command',channel:c.channel,command:c.command} as Operation),error=>{
   const e=error as {status:number;code:string};
   return e.status===503&&e.code===(['mark_seen_v1','retry_failed_email_v1'].includes(c.command.action)?'uncertain':'unavailable');
  });
  assert.equal(reads,0);assert.equal(cancelled,1);assert.equal(contexts,1);
 });
});
test('private providers work in workerd and never follow an upstream redirect',{timeout:60000},async t=>{
 const bundle=await build({absWorkingDir:root,stdin:{resolveDir:root,loader:'ts',contents:`
 import {ClientProvider} from './server/client-upstream.ts';
 import {SupabaseProvider} from './server/upstream.ts';
 import {encode} from './server/types.ts';
 export default {async fetch(request){
  if(new URL(request.url).pathname==='/unsupported'){
   try{new Request('https://never-dispatch.example/',{redirect:'error'});return Response.json({rejected:false});}
   catch(error){return Response.json({rejected:error instanceof TypeError});}
  }
  const input=await request.json(),expiry=Math.floor(Date.now()/1000)+3600;
  const token=encode(new TextEncoder().encode('{}'))+'.'+encode(new TextEncoder().encode(JSON.stringify({sub:${JSON.stringify(owner)},session_id:${JSON.stringify(session)},exp:expiry})))+'.synthetic';
  const credentials={access_token:token,refresh_token:'SYNTHETIC-unused-refresh',expires_at:expiry,user:{id:${JSON.stringify(owner)}},providerSessionId:${JSON.stringify(session)}};
  const provider=new (input.audience==='client'?ClientProvider:SupabaseProvider)('sb_publishable_synthetic',undefined,1000,true);
  const capabilities={view:true,edit:input.audience==='advisor',publish:false,confirmPayments:false};
  try{return Response.json(await provider.perform(credentials,capabilities,{kind:'command',channel:input.channel,command:input.command}));}
  catch(error){return Response.json({status:error.status,code:error.code});}
 }};`},bundle:true,platform:'browser',format:'esm',write:false});
 let upstreamStatus=200,contextStatus=200;
 const calls:{path:string;authorization:boolean}[]=[];
 const forbiddenDestinations:string[]=[];
 const mf=new Miniflare({...convertV4MiniflareOptions({cf:false,logRequests:false,modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-10-20',compatibilityFlags:['nodejs_compat'],outboundService:async(request:Request)=>{
  const url=new URL(request.url);
  if(url.origin!==origin){forbiddenDestinations.push(url.origin);throw Error('unexpected network destination');}
  const authorization=request.headers.get('authorization')??'';
  assert.match(authorization,/^Bearer [^.]+\.[^.]+\.synthetic$/);
  assert.equal(request.headers.get('apikey'),'sb_publishable_synthetic');
  calls.push({path:url.pathname,authorization:true});
  if(url.pathname.startsWith('/rest/v1/rpc/concierge_')){
   assert.ok(['/rest/v1/rpc/concierge_client_session_context','/rest/v1/rpc/concierge_advisor_session_context'].includes(url.pathname));
   if(contextStatus!==200)return Response.json({code:contextStatus===401?'session_ended':'forbidden'},{status:contextStatus});
   const audience=url.pathname.includes('_client_')?'client':'advisor';
   return Response.json({ownerId:owner,providerSessionId:session,role:audience,sessionNotAfter:null,capabilities:{view:true,edit:audience==='advisor',publish:false,confirmPayments:false}});
  }
  assert.ok(['/functions/v1/concierge-notifications','/functions/v1/concierge-checkins'].includes(url.pathname));
  const command=await request.json() as Record<string,unknown>;
  if(upstreamStatus>=300&&upstreamStatus<400)return new Response(JSON.stringify(success(command)),{status:upstreamStatus,headers:{Location:'https://never-dispatch.example/private','Content-Type':'application/json'}});
  return Response.json(upstreamStatus===200?success(command):{code:upstreamStatus===401?'session_ended':'forbidden'},{status:upstreamStatus});
 }}),telemetry:{enabled:false}});
 try{
  await t.test('workerd rejects redirect:error before dispatch',async()=>{
   assert.deepEqual(await (await mf.dispatchFetch('https://local.test/unsupported')).json(),{rejected:true});
   assert.equal(calls.length,0);
  });
  for(const c of cases){
   const label=c.audience+' '+c.command.action;
   await t.test(label+' reaches the fixed endpoint and returns the real mapped response',async()=>{
    upstreamStatus=200;contextStatus=200;calls.length=0;
    const result=await (await mf.dispatchFetch('https://local.test/',{method:'POST',body:JSON.stringify(c)})).json() as {status:number;body:unknown};
    assert.equal(result.status,200);
    assert.deepEqual(result.body,success(c.command));
    assert.deepEqual(calls.map(x=>x.path),['/functions/v1/concierge-'+(c.channel==='checkins'?'checkins':'notifications'),'/rest/v1/rpc/concierge_'+c.audience+'_session_context']);
   });
   for(const status of [301,302,303,307,308])await t.test(label+' refuses HTTP'+status+' without following Location',async()=>{
    upstreamStatus=status;contextStatus=200;calls.length=0;
    const result=await (await mf.dispatchFetch('https://local.test/',{method:'POST',body:JSON.stringify(c)})).json();
    assert.deepEqual(result,{status:503,code:['mark_seen_v1','retry_failed_email_v1'].includes(c.command.action)?'uncertain':'unavailable'});
    assert.equal(calls.filter(x=>x.path.startsWith('/functions/')).length,1,'original endpoint dispatched once');
    assert.equal(calls.length,2,'one original request and one actual context recheck');
   });
  }
  for(const status of [401,403])await t.test('current context HTTP'+status+' overrides a redirected read',async()=>{
   upstreamStatus=302;contextStatus=status;calls.length=0;
   const result=await (await mf.dispatchFetch('https://local.test/',{method:'POST',body:JSON.stringify(cases[0])})).json();
   assert.deepEqual(result,{status,code:status===401?'session_ended':'forbidden'});
   assert.equal(calls.length,2);
  });
  assert.deepEqual(forbiddenDestinations,[],'no attempt to send credentials to a redirect destination');
 }finally{await mf.dispose();}
});
