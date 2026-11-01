import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync} from 'node:fs';
const id='10000000-0000-4000-8000-000000000001', other='10000000-0000-4000-8000-000000000002';
// A caller-supplied address or success-only status mapper must break this test.
test('notification command and response boundary rejects private selectors and binds the original once-only intent',async()=>{
 assert.ok(existsSync(new URL('../src/contracts/PortalNotificationValidation.ts',import.meta.url)),'missing actual notification command parser; existing claim IDs are not a payload');
 const {readNotificationCommand}=await import('../src/contracts/PortalNotificationValidation.ts');
 const {mapNotificationResult}=await import('../src/contracts/PortalNotificationMapping.ts');
 const command={schemaVersion:1,action:'mark_seen_v1',requestId:id,deliveryId:other,expectedRevision:0};
 assert.deepEqual(readNotificationCommand(command),command);
 for(const extra of [{clientId:id},{recipientId:id},{address:'private@synthetic.invalid'},{providerReconciled:true},{role:'owner'},{endpoint:'https://external.invalid'},{current:true}])assert.throws(()=>readNotificationCommand({...command,...extra}));
 const status=readNotificationCommand({schemaVersion:1,action:'request_status_v1',original:command});
 assert.deepEqual(mapNotificationResult({status:'unknown'},status),{status:'unknown'});
 assert.throws(()=>mapNotificationResult({status:'absent'},status));
 assert.throws(()=>mapNotificationResult({status:'committed',receipt:{requestId:other}},status));
});
const stamp='2026-11-01T00:00:00Z';
const fact={eventId:id,createdAt:stamp,source:{kind:'publication',publicationVersion:1},destination:{kind:'plan_version',version:1}};
test('live inbox keysets bind cursor and limit, reject duplicate/backward pages and keep email acceptance separate from seen',async()=>{
 const {readNotificationCommand}=await import('../src/contracts/PortalNotificationValidation.ts');const {mapNotificationResult}=await import('../src/contracts/PortalNotificationMapping.ts');
 const c=readNotificationCommand({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:1});
 const item={deliveryId:id,revision:0,seenAt:null,event:fact,email:{status:'accepted',revision:2}};
 const page={schemaVersion:1,consistency:'live_keyset',observedAt:stamp,cursor:null,items:[item],nextCursor:`n:${id}`};
 assert.deepEqual(mapNotificationResult(page,c),page);
 for(const value of [{...page,total:1},{...page,complete:true},{...page,clock:stamp},{...page,items:[item,item]},{...page,items:[{...item,privateNote:'PRIVATE'}]},{...page,items:[{...item,email:{...item.email,providerMessageId:'private'}}]},{...page,items:[{...item,event:{...fact,destination:{kind:'plan_version',version:2}}}]}])assert.throws(()=>mapNotificationResult(value,c));
 const next=readNotificationCommand({...c,cursor:`n:${id}`});assert.throws(()=>mapNotificationResult({...page,cursor:`n:${id}`,nextCursor:null},next));
 assert.deepEqual(mapNotificationResult({...page,cursor:`n:${id}`,items:[],nextCursor:`n:${other}`},next),{...page,cursor:`n:${id}`,items:[],nextCursor:`n:${other}`});
 for(const cursor of ['n:bad','n:a0000000-0000-4000-8000-000000000001'.toUpperCase(),'https://external.invalid',`n:${'0'.repeat(36)}`])assert.throws(()=>readNotificationCommand({...c,cursor}));
 for(const limit of [0,51,1.5,Number.MAX_SAFE_INTEGER])assert.throws(()=>readNotificationCommand({...c,limit}));
});
test('public source destinations cannot be swapped across records or manufactured into an A07 private URL',async()=>{
 const {readNotificationEvent}=await import('../src/contracts/PortalNotificationMapping.ts');
 const guidance={...fact,source:{kind:'guidance',recordId:id,version:1,eventKind:'reply_published'},destination:{kind:'public_history',recordKind:'reply',recordId:id}};
 assert.deepEqual(readNotificationEvent(guidance),guidance);
 for(const destination of [{...guidance.destination,recordId:other},{...guidance.destination,recordKind:'review'},{kind:'plan_version',version:1}])assert.throws(()=>readNotificationEvent({...guidance,destination}));
 const attention={...fact,source:{kind:'review',recordId:other,version:1,eventKind:'goal_reported'},destination:{kind:'unavailable',reason:'advisor_review_resolution_unavailable'}};
 assert.deepEqual(readNotificationEvent(attention),attention);
 assert.throws(()=>readNotificationEvent({...attention,destination:{kind:'advisor_review',url:`/advisor/reviews/${other}`}}));
});
test('journal receipts bind exact request/action/target/CAS and unknown never claims new success',async()=>{
 const {readNotificationCommand}=await import('../src/contracts/PortalNotificationValidation.ts');const {mapNotificationResult,decodeNotificationResponse}=await import('../src/contracts/PortalNotificationMapping.ts');
 const c=readNotificationCommand({schemaVersion:1,action:'mark_seen_v1',requestId:id,deliveryId:other,expectedRevision:2});
 const receipt={requestId:id,action:'mark_seen_v1',deliveryId:other,previousRevision:2,revision:3,recordedAt:stamp,effect:'seen'};
 assert.deepEqual(mapNotificationResult(receipt,c),receipt);
 for(const change of [{requestId:other},{deliveryId:id},{previousRevision:1},{revision:2},{effect:'retry_queued'},{privateAddress:'PRIVATE'}])assert.throws(()=>mapNotificationResult({...receipt,...change},c));
 const status=readNotificationCommand({schemaVersion:1,action:'request_status_v1',original:c});assert.deepEqual(mapNotificationResult({status:'committed',receipt},status),{status:'committed',receipt});
 const changed=readNotificationCommand({...status,original:{...c,expectedRevision:1}});assert.throws(()=>mapNotificationResult({status:'committed',receipt},changed));
 assert.equal(decodeNotificationResponse(c,200,{status:'unknown'}).state,'uncertain');assert.equal(decodeNotificationResponse(status,503,{code:'unavailable'}).state,'rejected');
});
test('finite advisor status and failed-only retry exclude addresses, reconciliation and agent authority',async()=>{
 const {readNotificationCommand}=await import('../src/contracts/PortalNotificationValidation.ts');const {mapNotificationResult}=await import('../src/contracts/PortalNotificationMapping.ts');const {notificationAccess}=await import('../src/contracts/PortalNotificationValues.ts');
 const c=readNotificationCommand({schemaVersion:1,action:'read_event_deliveries_v1',eventId:id,cursor:null,limit:50});
 const p={schemaVersion:1,consistency:'live_keyset',observedAt:stamp,cursor:null,event:fact,items:[{deliveryId:other,channel:'email',status:'failed',revision:2,seenAt:null}],nextCursor:null};assert.deepEqual(mapNotificationResult(p,c),p);
 assert.throws(()=>mapNotificationResult({...p,event:{...fact,eventId:other}},c));assert.throws(()=>mapNotificationResult({...p,items:[{...p.items[0],seenAt:stamp}]},c));
 assert.equal(notificationAccess(c.action,'task_agent'),'DENY');assert.equal(notificationAccess(c.action,'client'),'DENY');assert.equal(notificationAccess(c.action,'human'),'READ');assert.equal(notificationAccess('retry_failed_email_v1','client'),'DENY');
 const retry=readNotificationCommand({schemaVersion:1,action:'retry_failed_email_v1',requestId:id,deliveryId:other,expectedRevision:2});assert.deepEqual(mapNotificationResult({requestId:id,action:'retry_failed_email_v1',deliveryId:other,previousRevision:2,revision:3,recordedAt:stamp,effect:'retry_queued'},retry),{requestId:id,action:'retry_failed_email_v1',deliveryId:other,previousRevision:2,revision:3,recordedAt:stamp,effect:'retry_queued'});
});
test('exact maximum page is bounded and oversized output or raw command is rejected',async()=>{
 const {readNotificationCommand}=await import('../src/contracts/PortalNotificationValidation.ts');const {mapNotificationResult}=await import('../src/contracts/PortalNotificationMapping.ts');
 const c=readNotificationCommand({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:50});
 const items=Array.from({length:50},(_,i)=>({deliveryId:`10000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,revision:0,seenAt:null,event:fact,email:{status:'queued',revision:0}}));
 const p={schemaVersion:1,consistency:'live_keyset',observedAt:stamp,cursor:null,items,nextCursor:null};assert.equal((mapNotificationResult(p,c) as {items:unknown[]}).items.length,50);
 assert.throws(()=>mapNotificationResult({...p,padding:'🧴'.repeat(25001)},c));assert.throws(()=>readNotificationCommand({...c,padding:'x'.repeat(8193)}));
});
test('every unavailable write response stays uncertain and invalid next cursor cannot be accepted as a usable continuation',async()=>{
 const {decodeNotificationResponse,mapNotificationResult}=await import('../src/contracts/PortalNotificationMapping.ts');const {readNotificationCommand}=await import('../src/contracts/PortalNotificationValidation.ts');
 const write=readNotificationCommand({schemaVersion:1,action:'mark_seen_v1',requestId:id,deliveryId:other,expectedRevision:0});
 assert.equal(decodeNotificationResponse(write,503,{code:'unavailable'}).state,'uncertain');
 const read=readNotificationCommand({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:1});
 assert.throws(()=>mapNotificationResult({schemaVersion:1,consistency:'live_keyset',observedAt:stamp,cursor:null,items:[],nextCursor:'n:ffffffff-ffff-ffff-ffff-ffffffffffff'},read));
});

// Every test fails closed if any dependency falls back to global network.
import {before,after} from 'node:test';
const originalGlobalFetch=globalThis.fetch;before(()=>{globalThis.fetch=async()=>{throw Error('global_external_fetch_denied');};});after(()=>{globalThis.fetch=originalGlobalFetch;});
