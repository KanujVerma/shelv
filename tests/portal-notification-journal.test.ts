// SOURCE TEXT / FINITE HTTP ONLY. None of these tests executes a SQL function or proves a race.
import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {portalCiBaselines} from './helpers/portal-ci-baselines.ts';
const globalFetch=globalThis.fetch;before(()=>{globalThis.fetch=async()=>{throw Error('global_external_fetch_denied');};});after(()=>{globalThis.fetch=globalFetch;});
const migration='supabase/migrations/20261101191527_portal_rebuild_notifications_v1.sql';
const review='supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql';
const oldFamilies=['plan_requests','requests','workflow_requests','care_requests','review_requests'];
const allFamilies=[...oldFamilies,'notification_requests'];
const original=portalCiBaselines.readBytes('e89f83ed3d4149dfaabf10d30aa3fa5b1dba59c3',migration).toString('utf8');
const old=readFileSync(new URL('../'+review,import.meta.url),'utf8');
const current=()=>readFileSync(new URL('../'+migration,import.meta.url),'utf8');
function helper(sql:string):string|null{return [...sql.matchAll(/create (?:or replace )?function concierge\.review_request_collision\(\) returns trigger[\s\S]*?end \$\$;/g)].at(-1)?.[0]??null;}
function inventory(sql:string){
 const combined=old+'\n'+sql,fn=helper(combined);assert.ok(fn,'actual source must retain its canonical helper');
 const checked=[...(fn.match(/foreach t in array array\[([^\]]+)\]/)?.[1]??'').matchAll(/'([^']+)'/g)].map(m=>m[1]!);
 const register=old.split('\n').find(l=>l.includes('create trigger review_request_collision before insert'));assert.ok(register);
 const attached=[...(register.match(/foreach t in array array\[([^\]]+)\]/)?.[1]??'').matchAll(/'([^']+)'/g)].map(m=>m[1]!);
 if(/create trigger review_request_collision before insert on concierge\.notification_requests for each row execute function concierge\.review_request_collision\(\);/.test(sql))attached.push('notification_requests');
 const command=sql.match(/create function concierge\.notification_command\(v jsonb\)[\s\S]*?end \$\$;/)?.[0];assert.ok(command);
 const lock=command.match(/pg_advisory_xact_lock\(hashtextextended\('([^']+)'/)?.[1];
 const helperLock=fn.match(/pg_advisory_xact_lock\(hashtextextended\('([^']+)'/)?.[1];
 const edges=allFamilies.flatMap(from=>allFamilies.filter(to=>to!==from).map(to=>({from,to,guarded:attached.includes(from)&&checked.includes(to)})));
 return {fn,checked,attached,edges,lock,helperLock};
}
test('actual forward source puts the new journal in both directions of the existing common actor/request collision domain',t=>{
 const baseline=inventory(original),live=inventory(current());
 assert.equal(baseline.edges.filter(e=>e.guarded).length,20);assert.equal(baseline.edges.filter(e=>(e.from==='notification_requests'||e.to==='notification_requests')&&e.guarded).length,0);assert.notEqual(baseline.lock,baseline.helperLock);
 assert.equal(live.edges.filter(e=>e.guarded).length,30,'actual migration must represent all directed pairs, including both new directions');assert.equal(live.lock,'concierge:request:');assert.equal(live.lock,live.helperLock);
 t.diagnostic(JSON.stringify({kind:'SOURCE_TEXT_ONLY',original:{oldDirected:20,newDirectedGuarded:0,commonLock:false},current:{allDirected:live.edges.length,guarded:live.edges.filter(e=>e.guarded).length,newDirectedGuarded:live.edges.filter(e=>(e.from==='notification_requests'||e.to==='notification_requests')&&e.guarded).length,commonLock:live.lock===live.helperLock},sqlExecuted:false}));
});
test('replacement preserves the exact original trigger body and attributes except its six-family list, and old trigger bindings stay installed',()=>{
 const v=current(),originalHelper=helper(old);assert.ok(originalHelper);
 const replacement=helper(v);assert.ok(replacement);
 const restored=replacement.replace('create or replace function','create function').replace(",'notification_requests']",']');assert.equal(restored,originalHelper,'same signature/header/default attributes/predicates/error/return as actual old source');
 assert.equal((v.match(/create or replace function /g)??[]).length,1);assert.doesNotMatch(v,/drop function|alter function|drop trigger|grant .*review_request_collision|revoke .*review_request_collision/i);
 const addition='\n-- N1: extend the existing shared trigger in place, preserving its OID/ACL and old bindings.\n'+replacement+'\ncreate trigger review_request_collision before insert on concierge.notification_requests for each row execute function concierge.review_request_collision();\n';
 assert.equal(v.replace(addition,'').replace("'concierge:request:'||u::text||':'||req::text","'concierge:notification:request:'||u::text||':'||req::text"),original,'the approved bounded migration delta is the entire production change');
 const bindings=inventory(v).attached;assert.deepEqual(bindings,allFamilies);
});
test('the actual source guard is sensitive independently to each missing registration, omitted family and wrong command lock',()=>{
 const v=current();
 const missingRegistration=v.replace('create trigger review_request_collision before insert on concierge.notification_requests for each row execute function concierge.review_request_collision();','');assert.equal(inventory(missingRegistration).edges.filter(e=>e.guarded).length,25);
 const missingLookup=v.replace(",'notification_requests']",']');assert.equal(inventory(missingLookup).edges.filter(e=>e.guarded).length,25);
 const wrongCommandLock=v.replace("'concierge:request:'||u::text||':'||req::text","'concierge:notification:request:'||u::text||':'||req::text");assert.notEqual(inventory(wrongCommandLock).lock,inventory(wrongCommandLock).helperLock);
});
import {handleNotificationRequest} from '../supabase/functions/concierge-notifications/handler.ts';
import {createNotificationPorts} from '../supabase/functions/concierge-notifications/runtime.ts';
import {readNotificationCommand} from '../src/contracts/PortalNotificationValidation.ts';
import {decodeNotificationResponse,mapNotificationResult} from '../src/contracts/PortalNotificationMapping.ts';
import type {NotificationCommand} from '../src/contracts/PortalNotification.ts';
const actor='10000000-0000-4000-8000-000000000001',requestId='10000000-0000-4000-8000-000000000002',deliveryId='10000000-0000-4000-8000-000000000003',other='10000000-0000-4000-8000-000000000004';
const mark=readNotificationCommand({schemaVersion:1,action:'mark_seen_v1',requestId,deliveryId,expectedRevision:4});
const seenReceipt={requestId,action:'mark_seen_v1',deliveryId,previousRevision:4,revision:5,recordedAt:'2026-11-01T20:00:00Z',effect:'seen'};
const retry=readNotificationCommand({schemaVersion:1,action:'retry_failed_email_v1',requestId,deliveryId,expectedRevision:4});
const retryReceipt={...seenReceipt,action:'retry_failed_email_v1',effect:'retry_queued'};
async function finite(command:NotificationCommand,reply:unknown,options:{status?:number;endAfterRpc?:boolean}={}){
 let authCalls=0,rpcCalls=0;const ports=createNotificationPorts({supabaseUrl:'https://journal.synthetic.invalid',publicKey:'SYNTHETIC-public',allowedOrigins:[],fetch:async(input,init)=>{
  const url=new URL(String(input));assert.equal(url.origin,'https://journal.synthetic.invalid');assert.equal(new Headers(init?.headers).get('authorization'),'Bearer SYNTHETIC-token');
  if(url.pathname==='/auth/v1/user'){authCalls++;if(options.endAfterRpc&&authCalls===2)return Response.json({message:'ended'},{status:401});return Response.json({id:actor,is_anonymous:false});}
  assert.equal(url.pathname,'/rest/v1/rpc/concierge_notification_command_v1');assert.deepEqual(JSON.parse(String(init?.body)),{p_command:command});rpcCalls++;return Response.json(reply,{status:options.status??200});
 }});
 const response=await handleNotificationRequest(new Request('https://edge.synthetic.invalid',{method:'POST',headers:{authorization:'Bearer SYNTHETIC-token','content-type':'application/json'},body:JSON.stringify(command)}),ports);
 return {status:response.status,body:await response.json(),authCalls,rpcCalls};
}
test('closed actual Root/handler/runtime retain exact own mark and retry receipts on repeated command and original status',async()=>{
 for(const [command,receipt] of [[mark,seenReceipt],[retry,retryReceipt]] as const){
  const first=await finite(command,receipt),replay=await finite(command,receipt);assert.equal(first.status,200);assert.deepEqual(first.body,receipt);assert.deepEqual(replay.body,first.body);assert.equal(replay.rpcCalls,1);
  const status=readNotificationCommand({schemaVersion:1,action:'request_status_v1',original:command});const result=await finite(status,{status:'committed',receipt});assert.equal(result.status,200);assert.deepEqual(result.body,{status:'committed',receipt});assert.equal(result.authCalls,2);
 }
});
test('changed content/action/target/CAS/request cannot be accepted as matching own original receipt through actual Root codecs',async()=>{
 for(const change of [{requestId:other},{deliveryId:other},{expectedRevision:3},{action:'retry_failed_email_v1'}]){
  const changed=readNotificationCommand({...mark,...change});assert.throws(()=>mapNotificationResult(seenReceipt,changed));
  const status=readNotificationCommand({schemaVersion:1,action:'request_status_v1',original:changed});const result=await finite(status,{status:'committed',receipt:seenReceipt});assert.deepEqual({status:result.status,body:result.body},{status:503,body:{code:'unavailable'}});
  const write=await finite(changed,seenReceipt);assert.deepEqual({status:write.status,body:write.body},{status:503,body:{code:'uncertain'}});
 }
});
test('a foreign-family collision returned by the finite SQL boundary remains a409 rejection for writes, rather than success or retry',async()=>{
 for(const command of [mark,retry]){
  const r=await finite(command,{message:'concierge_request_conflict'},{status:400});assert.deepEqual({status:r.status,body:r.body},{status:409,body:{code:'request_conflict'}});assert.equal(decodeNotificationResponse(command,r.status,r.body).state,'rejected');
 }
});
test('unknown and purged status never certify absence or a new receipt; real final Auth loss supersedes retained exact success',async()=>{
 const command=readNotificationCommand({schemaVersion:1,action:'request_status_v1',original:mark});
 const unknown=await finite(command,{status:'unknown'});assert.deepEqual({status:unknown.status,body:unknown.body},{status:200,body:{status:'unknown'}});
 const absent=await finite(command,{status:'absent'});assert.deepEqual({status:absent.status,body:absent.body},{status:503,body:{code:'unavailable'}});
 for(const c of [mark,command]){const ended=await finite(c,c===mark?seenReceipt:{status:'committed',receipt:seenReceipt},{endAfterRpc:true});assert.deepEqual({status:ended.status,body:ended.body},{status:401,body:{code:'session_ended'}});}
 const forbidden=await finite(command,{message:'concierge_forbidden'},{status:403});assert.deepEqual({status:forbidden.status,body:forbidden.body},{status:403,body:{code:'forbidden'}});
});

test('the complete migration inventory preserves both original writers and the exact approved profile successor',()=>{
 const root=new URL('../supabase/migrations/',import.meta.url),definitions:{file:string;text:string}[]=[];
 for(const file of readdirSync(root).filter(p=>p.endsWith('.sql')).sort()){const text=readFileSync(new URL(file,root),'utf8');if(helper(text))definitions.push({file,text:helper(text)!});}
 const profile='20261102110000_portal_rebuild_account_profile_v1.sql';
 assert.deepEqual(definitions.map(d=>d.file),[review.split('/').at(-1),migration.split('/').at(-1),profile]);
 assert.equal(definitions[1]?.text,helper(current()));
 // SOURCE identity only: this entire guarded append was independently reviewed in profile R2.
 assert.equal(createHash('sha256').update(readFileSync(new URL(profile,root))).digest('hex'),'7dcde23039959d60dc1a964b50f22012991139e3d68d5889282ab4524c82b23b');
});
