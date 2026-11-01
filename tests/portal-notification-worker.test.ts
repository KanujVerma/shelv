import assert from 'node:assert/strict';import {test} from 'node:test';import {existsSync} from 'node:fs';import {mkdtemp,readFile,readdir,stat} from 'node:fs/promises';import {join} from 'node:path';
const id='10000000-0000-4000-8000-000000000001',lease='10000000-0000-4000-8000-000000000002',eventId='10000000-0000-4000-8000-000000000003',recipientId='10000000-0000-4000-8000-000000000004';
const claim={deliveryId:id,leaseId:lease,eventId,recipientId,idempotencyKey:id};
const event={eventId,createdAt:'2026-11-01T00:00:00Z',source:{kind:'publication',publicationVersion:1},destination:{kind:'plan_version',version:1}};
const context=()=>({schemaVersion:1,deliveryId:id,leaseId:lease,recipientId,idempotencyKey:id,leaseUntil:new Date(Date.now()+60000).toISOString(),recipient:{email:'case-one@synthetic.invalid'},event});
test('existing IDs-only claim is resolved before actual synthetic filesystem acceptance and duplicate replay creates one receipt',async()=>{
 assert.ok(existsSync(new URL('../supabase/functions/concierge-notifications/worker.ts',import.meta.url)),'IDs-only delivery claim has no actual resolver/worker/sink');
 const {runNotificationBatch}=await import('../supabase/functions/concierge-notifications/worker.ts');
 const {createLocalNotificationSink}=await import('../supabase/functions/concierge-notifications/localSink.ts');
 const dir=await mkdtemp(join(process.cwd(),'.local-artifacts/notification-kernel/sink-case-'));const external=globalThis.fetch;globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
 try{
 const sink=await createLocalNotificationSink(dir);const calls:string[]=[];
 const ports={rpc:async(call:any)=>{calls.push(call.name);if(call.name==='concierge_plan_delivery_claim_v1')return [claim];if(call.name==='concierge_plan_delivery_context_v1')return context();if(call.name==='concierge_plan_delivery_result_v1')return {deliveryId:id,status:call.args.p_status,revision:2};throw Error('unexpected_rpc');}};
 const result=await runNotificationBatch(ports,sink,{portalOrigin:'https://portal.synthetic.invalid',limit:1});
 assert.equal(result.state,'completed');assert.deepEqual(calls,['concierge_plan_delivery_claim_v1','concierge_plan_delivery_context_v1','concierge_plan_delivery_result_v1']);
 const files=await readdir(dir);assert.deepEqual(files,[id+'.json']);const path=join(dir,files[0]!);const bytes=await readFile(path,'utf8');assert.equal((await stat(path)).mode&0o777,0o600);assert.match(bytes,/accepted/);assert.doesNotMatch(bytes,/delivered|PRIVATE|providerReconciled/);
 await runNotificationBatch(ports,sink,{portalOrigin:'https://portal.synthetic.invalid',limit:1});assert.equal(await readFile(path,'utf8'),bytes);assert.equal((await readdir(dir)).length,1);
 // Claim identifiers alone cannot become an accepted message, even with a working sink.
 const idsOnly={rpc:async(call:any)=>call.name==='concierge_plan_delivery_context_v1'?claim:ports.rpc(call)};
 const bad=await runNotificationBatch(idsOnly,sink,{portalOrigin:'https://portal.synthetic.invalid',limit:1});assert.equal(bad.state,'completed');assert.equal(bad.items[0]?.status,'failed');assert.equal((await readdir(dir)).length,1);
 }finally{globalThis.fetch=external;console.log('retained synthetic receipt directory: '+dir);}
});
import type {NotificationWorkerPorts,NotificationWorkerCall,NotificationAdapter} from '../supabase/functions/concierge-notifications/worker.ts';
async function workerFixture(contextValue:unknown=context()){
 const records:Extract<NotificationWorkerCall,{name:'concierge_plan_delivery_result_v1'}>['args'][]=[];
 const ports:NotificationWorkerPorts={rpc:async(call)=>{if(call.name==='concierge_plan_delivery_claim_v1')return [claim];if(call.name==='concierge_plan_delivery_context_v1')return contextValue;records.push(call.args);return {deliveryId:id,status:call.args.p_status,revision:2};}};
 return {ports,records};
}
test('stale lease, cross-recipient, source mismatch, private context and revocation never reach adapter',async()=>{
 const {runNotificationBatch}=await import('../supabase/functions/concierge-notifications/worker.ts');let sends=0;const sink:NotificationAdapter={kind:'local_synthetic_filesystem',send:async()=>{sends++;throw Error('must_not_send');}};
 for(const value of [{...context(),leaseId:recipientId},{...context(),recipientId:lease},{...context(),leaseUntil:'2020-01-01T00:00:00Z'},{...context(),event:{...event,eventId:recipientId}},{...context(),event:{...event,sourceBody:'PRIVATE'}},{...context(),privateAddress:'PRIVATE'}]){
  const f=await workerFixture(value);const r=await runNotificationBatch(f.ports,sink,{portalOrigin:'https://portal.synthetic.invalid',limit:1});assert.equal(r.state,'completed');assert.equal(f.records[0]?.p_status,'failed');
 }
 const f=await workerFixture();const original=f.ports.rpc;f.ports.rpc=async call=>{if(call.name==='concierge_plan_delivery_context_v1')throw Error('concierge_forbidden');return original(call);};await runNotificationBatch(f.ports,sink,{portalOrigin:'https://portal.synthetic.invalid',limit:1});assert.equal(sends,0);
});
test('lost adapter response, malformed acceptance, and lost result remain uncertain without auto retry or fabricated reconciliation',async()=>{
 const {runNotificationBatch}=await import('../supabase/functions/concierge-notifications/worker.ts');
 for(const send of [async()=>{throw Error('PRIVATE_provider_response_lost');},async()=>({status:'accepted',providerMessageId:''})]){
  const f=await workerFixture();const r=await runNotificationBatch(f.ports,{kind:'local_synthetic_filesystem',send:send as NotificationAdapter['send']},{portalOrigin:'https://portal.synthetic.invalid',limit:1});assert.equal(r.state,'completed');assert.equal(f.records[0]?.p_status,'uncertain');assert.equal(f.records[0]?.p_provider_message_id,null);assert.doesNotMatch(JSON.stringify(r),/PRIVATE|providerReconciled/);
 }
 const f=await workerFixture(),base=f.ports.rpc;f.ports.rpc=async call=>{if(call.name==='concierge_plan_delivery_result_v1')throw Error('PRIVATE_result_response_lost');return base(call);};
 const r=await runNotificationBatch(f.ports,{kind:'local_synthetic_filesystem',send:async()=>({status:'accepted',providerMessageId:'synthetic-accepted'})},{portalOrigin:'https://portal.synthetic.invalid',limit:1});assert.equal(r.state,'completed');if(r.state==='completed')assert.deepEqual(r.items,[{deliveryId:id,status:'uncertain',recorded:false}]);
});
test('reentrant batch, duplicate claims, missing adapter and excessive claim caps fail closed',async()=>{
 const {runNotificationBatch}=await import('../supabase/functions/concierge-notifications/worker.ts');const f=await workerFixture();let sends=0;
 const sink:NotificationAdapter={kind:'local_synthetic_filesystem',send:async()=>{sends++;assert.deepEqual(await runNotificationBatch(f.ports,sink,{portalOrigin:'https://portal.synthetic.invalid',limit:1}),{state:'busy'});return {status:'accepted',providerMessageId:'synthetic'};}};
 await runNotificationBatch(f.ports,sink,{portalOrigin:'https://portal.synthetic.invalid',limit:1});assert.equal(sends,1);
 const duplicate:NotificationWorkerPorts={rpc:async()=>[claim,claim]};await assert.rejects(()=>runNotificationBatch(duplicate,sink,{portalOrigin:'https://portal.synthetic.invalid',limit:2}));
 for(const limit of [0,51,1.5])await assert.rejects(()=>runNotificationBatch(f.ports,sink,{portalOrigin:'https://portal.synthetic.invalid',limit}));
 await assert.rejects(()=>runNotificationBatch(f.ports,undefined as never,{portalOrigin:'https://portal.synthetic.invalid',limit:1}));
});
test('local sink rejects real addresses, tampered/partial receipt, unsafe links and symlink paths without a duplicate',async()=>{
 const {createLocalNotificationSink}=await import('../supabase/functions/concierge-notifications/localSink.ts');const {buildNeutralNotificationEmail}=await import('../supabase/functions/concierge-notifications/neutralPayload.ts');
 const {writeFile,symlink}=await import('node:fs/promises');const dir=await mkdtemp(join(process.cwd(),'.local-artifacts/notification-kernel/sink-negative-'));const sink=await createLocalNotificationSink(dir);const p=buildNeutralNotificationEmail(context() as never,'https://portal.synthetic.invalid');
 await assert.rejects(()=>sink.send({...p,to:'someone@example.com'}));await assert.rejects(()=>sink.send({...p,link:'https://external.invalid/private',text:'PRIVATE'}));assert.deepEqual(await readdir(dir),[]);
 await writeFile(join(dir,id+'.json'),'{',{flag:'wx',mode:0o600});assert.deepEqual(await sink.send(p),{status:'uncertain',errorCode:'local_receipt_uncertain'});assert.equal(await readFile(join(dir,id+'.json'),'utf8'),'{');
 const symlinkPath=dir+'-link';await symlink(dir,symlinkPath);await assert.rejects(()=>createLocalNotificationSink(symlinkPath));console.log('retained negative synthetic receipt directory: '+dir);
});
test('deterministic neutral source links preserve exact event kind while A07 uses explicit unavailable resolution',async()=>{
 const {buildNeutralNotificationEmail}=await import('../supabase/functions/concierge-notifications/neutralPayload.ts');const c=context();
 const g={...c,event:{...event,source:{kind:'guidance',recordId:eventId,version:1,eventKind:'instruction_published'},destination:{kind:'public_history',recordKind:'instruction',recordId:eventId}}};
 const p=buildNeutralNotificationEmail(g as never,'https://portal.synthetic.invalid');assert.equal(p.link,`https://portal.synthetic.invalid/history/public_instruction%3A${eventId}`);assert.equal(p.subject,'an update from shelv');assert.doesNotMatch(p.text.split('\n')[0]!,/instruction|skin|PRIVATE|source/);
 const a={...c,event:{...event,source:{kind:'review',recordId:eventId,version:1,eventKind:'goal_reported'},destination:{kind:'unavailable',reason:'advisor_review_resolution_unavailable'}}};assert.equal(buildNeutralNotificationEmail(a as never,'https://portal.synthetic.invalid').link,'https://portal.synthetic.invalid/notifications');
});
test('actual fixed service HTTP transport resolves IDs then writes real sink before existing result RPC',async()=>{
 const {runNotificationBatch,createNotificationWorkerPorts}=await import('../supabase/functions/concierge-notifications/worker.ts');const {createLocalNotificationSink}=await import('../supabase/functions/concierge-notifications/localSink.ts');
 const dir=await mkdtemp(join(process.cwd(),'.local-artifacts/notification-kernel/sink-http-')),sink=await createLocalNotificationSink(dir);const paths:string[]=[];const external=globalThis.fetch;globalThis.fetch=async()=>{throw Error('global_external_fetch_denied');};
 try{
 const ports=createNotificationWorkerPorts({supabaseUrl:'https://worker.synthetic.invalid',serviceKey:'SYNTHETIC-service-fixture-only',fetch:async(input,init)=>{
  const url=new URL(String(input)),body=JSON.parse(String(init?.body));assert.equal(url.origin,'https://worker.synthetic.invalid');assert.equal(init?.redirect,'error');assert.equal(new Headers(init?.headers).get('authorization'),'Bearer SYNTHETIC-service-fixture-only');paths.push(url.pathname);
  if(url.pathname==='/rest/v1/rpc/concierge_plan_delivery_claim_v1'){assert.deepEqual(body,{p_limit:1});return Response.json([claim]);}
  if(url.pathname==='/rest/v1/rpc/concierge_plan_delivery_context_v1'){assert.deepEqual(body,{p_delivery_id:id,p_lease_id:lease});return Response.json(context());}
  assert.equal(url.pathname,'/rest/v1/rpc/concierge_plan_delivery_result_v1');assert.equal((await readdir(dir)).length,1);assert.deepEqual(body,{p_delivery_id:id,p_lease_id:lease,p_status:'accepted',p_provider_message_id:`local-synthetic:${id}`,p_error_code:null});return Response.json({deliveryId:id,status:'accepted',revision:2});
 }});
 const r=await runNotificationBatch(ports,sink,{portalOrigin:'https://portal.synthetic.invalid',limit:1});assert.equal(r.state,'completed');if(r.state==='completed')assert.deepEqual(r.items,[{deliveryId:id,status:'accepted',recorded:true}]);assert.equal(paths.length,3);
 }finally{globalThis.fetch=external;console.log('retained fixed HTTP synthetic receipt directory: '+dir);}
});
test('maximum batch resolves all fifty distinct events into bounded concrete receipts, and concurrent same-ID sink calls never duplicate',async()=>{
 const {runNotificationBatch}=await import('../supabase/functions/concierge-notifications/worker.ts');const {createLocalNotificationSink}=await import('../supabase/functions/concierge-notifications/localSink.ts');const {buildNeutralNotificationEmail}=await import('../supabase/functions/concierge-notifications/neutralPayload.ts');
 const dir=await mkdtemp(join(process.cwd(),'.local-artifacts/notification-kernel/sink-max-')),sink=await createLocalNotificationSink(dir);const ids=Array.from({length:50},(_,i)=>`20000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);let results=0;
 const ports:NotificationWorkerPorts={rpc:async call=>{
  if(call.name==='concierge_plan_delivery_claim_v1'){assert.equal(call.args.p_limit,50);return ids.map(deliveryId=>({...claim,deliveryId,idempotencyKey:deliveryId,eventId:deliveryId}));}
  if(call.name==='concierge_plan_delivery_context_v1')return {...context(),deliveryId:call.args.p_delivery_id,idempotencyKey:call.args.p_delivery_id,event:{...event,eventId:call.args.p_delivery_id}};
  results++;return {deliveryId:call.args.p_delivery_id,status:call.args.p_status,revision:2};
 }};
 const r=await runNotificationBatch(ports,sink,{portalOrigin:'https://portal.synthetic.invalid',limit:50});assert.equal(r.state,'completed');if(r.state==='completed')assert.equal(r.items.filter(i=>i.status==='accepted'&&i.recorded).length,50);assert.equal(results,50);assert.equal((await readdir(dir)).length,50);
 const single=buildNeutralNotificationEmail(context() as never,'https://portal.synthetic.invalid');const responses=await Promise.all([sink.send(single),sink.send(single)]);assert.ok(responses.some(r=>r.status==='accepted'));assert.equal((await readdir(dir)).length,51);assert.equal((await stat(join(dir,id+'.json'))).mode&0o777,0o600);console.log('retained maximum and concurrent synthetic receipt directory: '+dir);
});

// Every test fails closed if any dependency falls back to global network.
import {before,after} from 'node:test';
const originalGlobalFetch=globalThis.fetch;before(()=>{globalThis.fetch=async()=>{throw Error('global_external_fetch_denied');};});after(()=>{globalThis.fetch=originalGlobalFetch;});
