import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createEmptyPlanContent, projectClientPlan} from '../src/contracts/PortalRebuild.ts';
import type {DraftView, PlanCommand} from '../src/contracts/PortalRebuild.ts';
import {handlePlanRequest} from '../supabase/functions/concierge-plans/handler.ts';
import {createPlanPorts} from '../supabase/functions/concierge-plans/runtime.ts';
import type {createPortalPlanAgentClient as Factory} from '../src/clients/PortalPlanAgent.ts';

// Every network/Auth/RPC response here is a closed synthetic transcript. The real
// SDK, Edge handler, Auth/RPC runtime and Root codecs run; SQL/grants do not.
const modulePath='../src/clients/PortalPlanAgent.ts';
const sdk: {createPortalPlanAgentClient: typeof Factory}|null=await import(modulePath).catch(()=>null);
const create: typeof Factory=(config)=>{assert.ok(sdk,'allocated SDK module must exist');return sdk.createPortalPlanAgentClient(config);};
const id='10000000-0000-4000-8000-000000000001';
const other='10000000-0000-4000-8000-000000000002';
const hash='a'.repeat(64);
const origin='https://synthetic.supabase.invalid';
const key='sb_publishable_synthetic';
const jwt=(exp=Math.floor(Date.now()/1000)+3600, extra={})=>`eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({exp,...extra})).toString('base64url')}.synthetic`;
const token=jwt();
const read: PlanCommand={schemaVersion:1,action:'read_draft_v1',draftId:id};
const write: PlanCommand={schemaVersion:1,action:'save_draft_v1',requestId:other,draftId:id,expectedContentRevision:0,expectedAssignmentRevision:0,kind:'care_plan',content:createEmptyPlanContent()};
const view=():DraftView=>({draft:{id,clientId:null,kind:'care_plan',state:'working',contentRevision:1,assignmentRevision:0,contentHash:hash,content:createEmptyPlanContent(),savedAt:'2026-11-02T00:00:00Z',basis:{publicationVersion:null,useRevision:0},origin:{kind:'new',id:null}},target:null,sections:[],issues:[]});
const config=(fetcher:typeof fetch,getAccessToken:(signal?:AbortSignal)=>Promise<string|null>=async()=>token,timeoutMs=200)=>({supabaseUrl:origin,anonKey:key,getAccessToken,fetch:fetcher,timeoutMs});
const fault=(status:number,code:string,outcome?:string)=>(error:unknown)=>{
 assert.ok(error instanceof Error);assert.equal(error.message,code);
 const value=error as Error&{status:number;code:string;outcome:string};
 assert.equal(value.status,status);assert.equal(value.code,code);if(outcome)assert.equal(value.outcome,outcome);
 assert.ok(!JSON.stringify(value).includes('PRIVATE'));return true;
};
function edge(result:unknown=view(), rejection?:{status:number;message:string}) {
 const requests:Request[]=[];
 const upstream:{url:string;body:unknown;authorization:string|null}[]=[];
 const ports=createPlanPorts({supabaseUrl:origin,publicKey:key,allowedOrigins:[],fetch:async(input,init)=>{
  const request=new Request(input,init),url=new URL(request.url);
  const body=request.method==='POST'?await request.json():null;
  upstream.push({url:url.pathname,body,authorization:request.headers.get('authorization')});
  if(url.pathname==='/auth/v1/user')return Response.json({id,is_anonymous:false});
  assert.equal(url.pathname,'/rest/v1/rpc/concierge_plan_command_v1');
  return rejection?Response.json({message:rejection.message},{status:rejection.status}):Response.json(result);
 }});
 const fetcher:typeof fetch=async(input,init)=>{const request=new Request(input,init);requests.push(request.clone());return handlePlanRequest(request,ports);};
 return {fetcher,requests,upstream};
}

test('construction is zero I/O and captures trusted fixed configuration',async()=>{
 let tokens=0,sends=0;
 const cfg=config(async(input,init)=>{sends++;assert.equal(String(input),origin+'/functions/v1/concierge-plans');assert.equal(new Headers(init?.headers).get('apikey'),key);return Response.json(view());},async()=>{tokens++;return token;});
 const client=create(cfg);assert.equal(tokens,0);assert.equal(sends,0);
 cfg.supabaseUrl='https://changed.invalid';cfg.anonKey='sb_publishable_changed';cfg.fetch=async()=>{throw Error('PRIVATE');};cfg.getAccessToken=async()=>null;
 assert.deepEqual(await client.execute(read),view());assert.equal(sends,1);assert.ok(tokens>=2);
});

test('constructor rejects paths, insecure origins, privileged keys and invalid deadlines without I/O',()=>{
 const base=config(async()=>{assert.fail('no I/O');});
 for(const supabaseUrl of ['http://synthetic.invalid','https://x.invalid/path','https://u:p@x.invalid','https://x.invalid/?token=x','https://x.invalid/#x'])assert.throws(()=>create({...base,supabaseUrl}),fault(503,'unavailable','not_dispatched'));
 for(const anonKey of ['', 'service-role-secret',jwt(undefined,{role:'service_role'}),'sb_secret_synthetic','sb_publishable_x\n'])assert.throws(()=>create({...base,anonKey}),fault(503,'unavailable','not_dispatched'));
 for(const timeoutMs of [0,-1,Infinity,NaN,1.5,2147483648])assert.throws(()=>create({...base,timeoutMs}),fault(503,'unavailable','not_dispatched'));
 assert.throws(()=>create({...base,getAccessToken:null as never}),fault(503,'unavailable','not_dispatched'));
});

test('actual SDK → handler → Auth/RPC runtime uses fixed routes and strict Root mapping',async()=>{
 const f=edge(),client=create(config(f.fetcher));assert.deepEqual(await client.execute(read),view());
 assert.deepEqual(f.upstream.map(c=>c.url),['/auth/v1/user','/rest/v1/rpc/concierge_plan_command_v1']);
 assert.equal(f.upstream[1]?.authorization,`Bearer ${token}`);
 assert.deepEqual(f.upstream[1]?.body,{p_command:read});
 assert.equal(f.requests[0]?.headers.get('apikey'),key);
});

test('all required permitted draft DTO operations traverse the actual handler unchanged',async()=>{
 const common={requestId:other,draftId:id,expectedContentRevision:0,expectedAssignmentRevision:0};
 const cases:[PlanCommand,unknown][]=[
  [{schemaVersion:1,action:'list_plans_v1',clientId:id,cursor:null,limit:10},{nextCursor:null,drafts:[],publications:[]}],
  [read,view()],
  [{schemaVersion:1,action:'create_draft_v1',requestId:other,kind:'care_plan',templateVersionId:null},view()],
  [write,view()],
  [{schemaVersion:1,action:'checkpoint_draft_v1',...common,label:'checkpoint'},{checkpointId:other,target:null}],
  [{schemaVersion:1,action:'assign_draft_v1',...common,fromClientId:null,toClientId:id},view()],
  [{schemaVersion:1,action:'compare_import_v1',draftId:id,baseContentRevision:0,baseAssignmentRevision:0,content:createEmptyPlanContent()},{baseContentRevision:0,baseAssignmentRevision:0,latest:view(),proposed:createEmptyPlanContent(),stale:false,proposalHash:hash}],
  [{schemaVersion:1,action:'apply_import_v1',...common,baseContentRevision:0,proposalHash:hash,content:createEmptyPlanContent()},view()],
  [{schemaVersion:1,action:'validate_draft_v1',draftId:id,contentRevision:0,assignmentRevision:0},{target:null,issues:[]}],
  [{schemaVersion:1,action:'preview_draft_v1',draftId:id,contentRevision:0,assignmentRevision:0},{target:null,issues:[],mode:'advisor-preview',published:false,content:projectClientPlan(createEmptyPlanContent())}],
 ];
 for(const [command,result] of cases){const f=edge(result);assert.deepEqual(await create(config(f.fetcher)).execute(command),result);assert.deepEqual(f.upstream[1]?.body,{p_command:command});}
});

test('unknown/code/forged approval/actor/endpoint fields fail before token or network',async()=>{
 let callbacks=0;
 const client=create(config(async()=>{assert.fail('no dispatch');},async()=>{callbacks++;return token;}));
 for(const value of [{...read,clientId:other},{...read,approved:true},{...read,actorId:id},{...read,rpc:'arbitrary'},{...write,content:{...createEmptyPlanContent(),title:'<script>x</script>'}},{...write,content:{...createEmptyPlanContent(),buttonLabel:'publish'}}])await assert.rejects(client.execute(value as PlanCommand),fault(400,'invalid_input','not_dispatched'));
 assert.equal(callbacks,0);
});

test('only plain data is accepted; getters/toJSON/prototypes/cycles never reach credentials',async()=>{
 let accessors=0,tokens=0;const client=create(config(async()=>{assert.fail('no I/O');},async()=>{tokens++;return token;}));
 const getter={...read};Object.defineProperty(getter,'draftId',{enumerable:true,get(){accessors++;return id;}});
 const cycle:Record<string,unknown>={...read};cycle.extra=cycle;
 for(const command of [getter,{...read,toJSON(){accessors++;return read;}},Object.assign(Object.create({}),read),cycle])await assert.rejects(client.execute(command as PlanCommand),fault(400,'invalid_input'));
 assert.equal(tokens,0);assert.equal(accessors,0);
});

test('command and nested content detach before token callback can edit caller values',async()=>{
 const command=structuredClone(write);assert.equal(command.action,'save_draft_v1');command.content.title='captured';
 const f=edge();let calls=0;const client=create(config(f.fetcher,async()=>{calls++;command.draftId=other;command.requestId=id;command.content.title='mutated';return token;}));
 await client.execute(command);assert.ok(calls>=2);
 const raw=await f.requests[0]!.json();assert.equal(raw.draftId,id);assert.equal(raw.requestId,other);assert.equal(raw.content.title,'captured');
});

test('UTF8 command budget rejects oversize before I/O and admits rich valid >100000 bytes',async()=>{
 const command=structuredClone(write);assert.equal(command.action,'save_draft_v1');command.content.consultationSections=Array.from({length:50},()=>({title:'synthetic',body:'🧴'.repeat(4000)}));
 let tokens=0;const f=edge(),client=create(config(f.fetcher,async()=>{tokens++;return token;}));
 await assert.rejects(client.execute(command),fault(413,'too_large','not_dispatched'));assert.equal(tokens,0);assert.equal(f.requests.length,0);
 command.content.consultationSections=command.content.consultationSections.slice(0,8);assert.ok(Buffer.byteLength(JSON.stringify(command))>100000);
 await client.execute(command);assert.equal(f.requests.length,1);
});

test('missing, malformed and expired tokens deny before dispatch; no caller role grants',async()=>{
 for(const credential of [null,'', 'opaque',jwt(Math.floor(Date.now()/1000)-1)]){
  await assert.rejects(create(config(async()=>{assert.fail('no dispatch');},async()=>credential)).execute(read),fault(401,'session_ended','not_dispatched'));
 }
 const f=edge(undefined,{status:403,message:'concierge_forbidden'});
 await assert.rejects(create(config(f.fetcher,async()=>jwt(undefined,{role:'owner',approved:true}))).execute(read),fault(403,'forbidden','rejected'));
});

test('credential replacement before egress and after private decode prevents stale returns',async()=>{
 const next=jwt(undefined,{changed:true});let calls=0,sends=0;
 await assert.rejects(create(config(async()=>{sends++;return Response.json(view());},async()=>++calls===1?token:next)).execute(read),fault(401,'session_ended','not_dispatched'));assert.equal(sends,0);
 calls=0;await assert.rejects(create(config(async()=>{sends++;return Response.json(view());},async()=>++calls<3?token:next)).execute(write),fault(401,'session_ended','uncertain'));assert.equal(sends,1);
});

test('abort, throwing token callback and token acquisition stall finish without dispatch',async()=>{
 const abort=new AbortController();abort.abort();let tokens=0;
 await assert.rejects(create(config(async()=>{assert.fail('no dispatch');},async()=>{tokens++;return token;})).execute(read,{signal:abort.signal}),fault(503,'unavailable','not_dispatched'));assert.equal(tokens,0);
 for(const getAccessToken of [async()=>{throw Error('PRIVATE');},()=>new Promise<string|null>(()=>{})])await assert.rejects(create(config(async()=>{assert.fail('no dispatch');},getAccessToken,25)).execute(read),fault(503,'unavailable','not_dispatched'));
});

test('reentrant token callback cancellation and simultaneous executions fence each operation',async()=>{
 const abort=new AbortController();let sends=0;
 await assert.rejects(create(config(async()=>{sends++;return Response.json(view());},async()=>{abort.abort();return token;})).execute(read,{signal:abort.signal}),fault(503,'unavailable'));assert.equal(sends,0);
 let nested:Promise<unknown>|undefined,entered=false;
 const client=create(config(async()=>Response.json(view()),async()=>{if(!entered){entered=true;nested=client.execute(read);}return token;}));
 assert.deepEqual(await client.execute(read),view());assert.deepEqual(await nested,view());
});

test('caller abort and stalled fetch/body/cancel settle dispatched writes as uncertain',async()=>{
 for(const body of [false,true]){
  let cancelled=0;const controller=new AbortController();
  const fetcher:typeof fetch=async()=>body?new Response(new ReadableStream<Uint8Array>({pull(){return new Promise(()=>{});},cancel(){cancelled++;return new Promise(()=>{});}})):new Promise<Response>(()=>{});
  const pending=create(config(fetcher,undefined,40)).execute(write,{signal:controller.signal});setTimeout(()=>controller.abort(),5);
  await assert.rejects(pending,fault(503,'uncertain','uncertain'));if(body)assert.equal(cancelled,1);
 }
});

test('single absolute deadline spans token, fetch, body and final credential recheck',async()=>{
 let tokens=0;
 const getAccessToken=async()=>{tokens++;await new Promise(resolve=>setTimeout(resolve,12));return token;};
 const fetcher:typeof fetch=async()=>new Response(new ReadableStream<Uint8Array>({async start(controller){await new Promise(resolve=>setTimeout(resolve,18));controller.enqueue(new TextEncoder().encode(JSON.stringify(view())));controller.close();}}));
 await assert.rejects(create(config(fetcher,getAccessToken,32)).execute(write),fault(503,'uncertain','uncertain'));assert.equal(tokens,2);
 let checks=0;await assert.rejects(create(config(async()=>Response.json(view()),()=>++checks===3?new Promise(()=>{}):Promise.resolve(token),25)).execute(read),fault(503,'unavailable'));
});

test('response cap uses actual stream bytes and cancels; oversized data never partially maps',async()=>{
 let cancelled=0;
 const fetcher:typeof fetch=async()=>new Response(new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(2000001));},cancel(){cancelled++;return new Promise(()=>{});}}),{headers:{'content-length':'1','content-type':'application/json'}});
 await assert.rejects(create(config(fetcher)).execute(read),fault(413,'too_large'));assert.equal(cancelled,1);
 await assert.rejects(create(config(fetcher)).execute(write),fault(413,'too_large','uncertain'));
});

test('malformed/invalid UTF8/private-field successes and non-native Response fail safely',async()=>{
 for(const response of [new Response('{PRIVATE'),new Response(Uint8Array.of(0xff)),Response.json({...view(),privateNote:'PRIVATE'}),{status:200,body:null} as Response])await assert.rejects(create(config(async()=>response)).execute(read),fault(503,'unavailable'));
 const f=edge({...view(),privateNote:'PRIVATE'});await assert.rejects(create(config(f.fetcher)).execute(write),fault(503,'unavailable','uncertain'));
});

test('known 401 and 403 survive failing, stalled or oversized denial bodies',async()=>{
 for(const status of [401,403])for(const kind of ['error','stall','large']){
  let cancelled=0;const response=new Response(new ReadableStream<Uint8Array>({start(c){if(kind==='error')c.error(Error('PRIVATE'));if(kind==='large')c.enqueue(new Uint8Array(2000001));},cancel(){cancelled++;return new Promise(()=>{});}}),{status});
  await assert.rejects(create(config(async()=>response)).execute(write),fault(status,status===401?'session_ended':'forbidden','rejected'));if(kind!=='error')assert.equal(cancelled,1);
 }
});

test('valid received denial codes retain the matching Root error namespace',async()=>{
 // PostgREST P0001 arrives as400; the actual Plan handler maps this known SQL
 // message to403. An upstream403 is deliberately normalized to forbidden there.
 const f=edge(undefined,{status:400,message:'concierge_candidate_inactive'});
 await assert.rejects(create(config(f.fetcher)).execute(read),fault(403,'candidate_inactive','rejected'));
 await assert.rejects(create(config(async()=>Response.json({code:'unauthorized'},{status:401}))).execute(read),fault(401,'unauthorized','rejected'));
});

test('wrong client/scope, stale revision and forged publication remain Root-denied transcripts',async()=>{
 for(const [command,status,code] of [[{schemaVersion:1,action:'list_plans_v1',clientId:other,cursor:null,limit:10},403,'forbidden'],[read,403,'forbidden'],[write,409,'revision_conflict'],[{schemaVersion:1,action:'publish_plan_v1',requestId:other,target:{draftId:id,clientId:other,contentRevision:0,assignmentRevision:0,contentHash:hash},approvalId:other,firstServiceClaimId:null},409,'approval_conflict']] as const){
  const f=edge(undefined,{status,message:`concierge_${code}`});await assert.rejects(create(config(f.fetcher)).execute(command),fault(status,code,'rejected'));assert.equal(f.requests.length,1);
 }
});

test('safe error namespace rejects private/unknown/mismatched codes without replay',async()=>{
 for(const [status,payload,expected,outcome] of [[409,{code:'PRIVATE SQL'},'unavailable','uncertain'],[409,{code:'forbidden'},'unavailable','uncertain'],[503,{code:'uncertain'},'uncertain','uncertain'],[409,{code:'revision_conflict'},'revision_conflict','rejected']] as const){
  let sends=0;await assert.rejects(create(config(async()=>{sends++;return Response.json(payload,{status});})).execute(write),fault(expected==='revision_conflict'?409:503,expected,outcome));assert.equal(sends,1);
 }
});

test('explicit exact retry/status commands retain caller UUID and body; no automatic retry',async()=>{
 const f=edge(),client=create(config(f.fetcher));await client.execute(write);await client.execute(write);
 assert.equal(f.requests.length,2);assert.equal(await f.requests[0]!.text(),await f.requests[1]!.text());
 const status:PlanCommand={schemaVersion:1,action:'request_status_v1',requestId:other};
 const receipt={status:'committed',receipt:view()};const s=edge(receipt);assert.deepEqual(await create(config(s.fetcher)).execute(status),receipt);assert.deepEqual(s.upstream[1]?.body,{p_command:status});
 let sends=0;await assert.rejects(create(config(async()=>{sends++;throw Error('PRIVATE');})).execute(write),fault(503,'uncertain','uncertain'));assert.equal(sends,1);
});

test('native reader cleanup callbacks run before final credential fencing',async()=>{
 let current=token;
 const fetcher:typeof fetch=async()=>{
  const response=Response.json(view()),stream=response.body!;
  const acquire=stream.getReader.bind(stream);
  Object.defineProperty(stream,'getReader',{value:()=>{
   const reader=acquire(),release=reader.releaseLock.bind(reader);
   reader.releaseLock=()=>{release();current=jwt(undefined,{changed:true});};return reader;
  }});
  return response;
 };
 await assert.rejects(create(config(fetcher,async()=>current)).execute(read),fault(401,'session_ended','uncertain'));
});

test('exact 500000 UTF8 request and 2000000 response boundaries are inclusive',async()=>{
 const command=structuredClone(write);assert.equal(command.action,'save_draft_v1');
 command.content.consultationSections=Array.from({length:50},()=>({title:'padding',body:''}));
 let remaining=500000-Buffer.byteLength(JSON.stringify(command));
 for(const section of command.content.consultationSections){const bytes=Math.min(16000,remaining);section.body='🧴'.repeat(Math.floor(bytes/4))+'x'.repeat(bytes%4);remaining-=bytes;}
 assert.equal(remaining,0);assert.equal(Buffer.byteLength(JSON.stringify(command)),500000);
 const f=edge();await create(config(f.fetcher)).execute(command);assert.equal(Buffer.byteLength(await f.requests[0]!.text()),500000);
 command.content.title='x';await assert.rejects(create(config(async()=>{assert.fail('no dispatch');})).execute(command),fault(413,'too_large','not_dispatched'));
 const raw=JSON.stringify(view()),full=raw+' '.repeat(2000000-Buffer.byteLength(raw));
 assert.deepEqual(await create(config(async()=>new Response(full))).execute(read),view());
});

test('a late fetch result is cancelled after timeout and never returns private data',async()=>{
 let cancelled=0;
 const client=create(config(()=>new Promise<Response>(resolve=>setTimeout(()=>resolve(new Response(new ReadableStream<Uint8Array>({cancel(){cancelled++;}}))),20)),undefined,5));
 await assert.rejects(client.execute(read),fault(503,'unavailable','uncertain'));
 await new Promise(resolve=>setTimeout(resolve,30));assert.equal(cancelled,1);
});

test('token expiry during private body receipt rejects the result on real wall time',async()=>{
 const exp=Math.floor(Date.now()/1000)+2,credential=jwt(exp);
 const client=create(config(async()=>new Response(new ReadableStream<Uint8Array>({start(controller){setTimeout(()=>{controller.enqueue(new TextEncoder().encode(JSON.stringify(view())));controller.close();},exp*1000-Date.now()+10);}})),async()=>credential,3000));
 await assert.rejects(client.execute(read),fault(401,'session_ended','uncertain'));
});

test('another execution observing credential replacement retires an older pending credential result',async()=>{
 const next=jwt(undefined,{changed:true});let calls=0,release!:(value:string)=>void,entered!:()=>void;
 const pendingCredential=new Promise<string>(resolve=>{release=resolve;}),waiting=new Promise<void>(resolve=>{entered=resolve;});
 const client=create(config(async()=>Response.json(view()),async()=>{calls++;if(calls===3){entered();return pendingCredential;}return calls<3?token:next;}));
 const old=client.execute(read);await waiting;assert.deepEqual(await client.execute(read),view());
 release(token);await assert.rejects(old,fault(401,'session_ended','uncertain'));
});

test('observed credential ABA during a body wait never revives the original operation',async()=>{
 let current=token,release!:()=>void,entered!:()=>void,sends=0;
 const waiting=new Promise<void>(resolve=>{entered=resolve;});
 const client=create(config(async()=>{if(++sends>1)return Response.json(view());return new Response(new ReadableStream<Uint8Array>({start(controller){release=()=>{controller.enqueue(new TextEncoder().encode(JSON.stringify(view())));controller.close();};entered();}}));},async()=>current));
 const old=client.execute(read);await waiting;current=jwt(undefined,{changed:true});await client.execute(read);current=token;release();
 await assert.rejects(old,fault(401,'session_ended','uncertain'));
});

test('final credential callback logout/throw/cancellation cannot expose a private success',async()=>{
 for(const failure of ['logout','throw','abort']){
  let calls=0;const abort=new AbortController();
  const client=create(config(async()=>Response.json(view()),async()=>{if(++calls===3){if(failure==='throw')throw Error('PRIVATE');if(failure==='abort')abort.abort();else return null;}return token;}));
  await assert.rejects(client.execute(read,{signal:abort.signal}),fault(failure==='logout'?401:503,failure==='logout'?'session_ended':'unavailable','uncertain'));
 }
});

test('redirects, body-read throws and synchronous fetch throws cannot become saved or auto-retried',async()=>{
 for(const fetcher of [async()=>new Response(null,{status:307,headers:{location:'https://foreign.invalid'}}),async()=>new Response(new ReadableStream({start(c){c.error(Error('PRIVATE'));}})),()=>{throw Error('PRIVATE');}] as (typeof fetch)[]){
  let sends=0;await assert.rejects(create(config((input,init)=>{sends++;assert.equal(init?.redirect,'error');assert.equal(init?.credentials,'omit');return fetcher(input,init);})).execute(write),error=>{
   assert.ok(error instanceof Error);assert.ok(['unavailable','uncertain'].includes(error.message));assert.equal((error as Error&{outcome:string}).outcome,'uncertain');assert.ok(!JSON.stringify(error).includes('PRIVATE'));return true;
  });assert.equal(sends,1);
 }
});
