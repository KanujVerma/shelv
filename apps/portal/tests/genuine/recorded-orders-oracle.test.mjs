import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validateOrdersFixture} from './recorded-orders.browser.mjs';

// Inert data validation only. No DB, Auth, fixture, SQL parser, request, browser,
// port or SDK acquisition. This cannot authenticate evidence or accept a feature.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const sha256=/^[0-9a-f]{64}$/;
const digest=value=>createHash('sha256').update(value).digest('hex');
const readPath='/api/client/client-orders';
const readRequestSha256=digest(JSON.stringify({schemaVersion:1,action:'read_client_orders_v1'}));
const relations=Object.freeze([
 'retail_purchases','return_cases','return_events','service_heads',
 'retail_purchase_private','return_event_private','service_review_private','plan_draft_private','review_private_notes',
 'payment_heads','checkin_heads','care_use_heads','care_report_heads','care_instruction_heads','plan_decision_heads','account_profile_heads_v1',
 'cases','enrollments','requests','workflow_requests','payment_v2_requests','care_requests','review_requests','plan_requests',
 'notification_requests','account_profile_requests_v1','admission_intents',
].map(name=>'concierge.'+name));
function need(ok,code){if(!ok)throw new Error(code);}
function exact(value,keys,code){
 need(value!==null&&typeof value==='object'&&!Array.isArray(value),code);
 need([Object.prototype,null].includes(Object.getPrototypeOf(value)),code);
 const fields=Object.getOwnPropertyDescriptors(value);
 need(Reflect.ownKeys(fields).length===keys.length&&keys.every(key=>Object.hasOwn(fields,key)),code);
 need(Object.values(fields).every(field=>Object.hasOwn(field,'value')),code);
}
function dataTree(value,depth=0,seen=new WeakSet()){
 need(depth<40,'data nesting exceeds observation bound');
 if(value===null||typeof value==='string'||typeof value==='boolean')return;
 if(typeof value==='number'){need(Number.isFinite(value),'nonfinite observation');return;}
 need(value&&typeof value==='object'&&!seen.has(value),'non-JSON observation');
 need(Array.isArray(value)||[Object.prototype,null].includes(Object.getPrototypeOf(value)),'non-JSON observation');
 const fields=Object.getOwnPropertyDescriptors(value);
 need(Reflect.ownKeys(fields).every(key=>typeof key==='string'),'non-JSON observation');
 need(Object.values(fields).every(field=>Object.hasOwn(field,'value')),'observation accessor refused');
 seen.add(value);for(const [key,field] of Object.entries(fields))if(!Array.isArray(value)||key!=='length')dataTree(field.value,depth+1,seen);seen.delete(value);
}
function timestamp(value,code){
 need(typeof value==='string'&&value.length<=60&&/(?:Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(Date.parse(value)),code);
 return Date.parse(value);
}
function observationHeader(value,phase){
 exact(value,['schemaVersion','kind','phase','observedAt','readOnly','actors'],'observation envelope incomplete');
 need(value.schemaVersion===1&&value.kind==='recorded-orders-db-observation','observation schema');
 need(value.readOnly===true,'actual read-only transaction required');
 need(value.phase===phase,'observation phase mismatch');
 timestamp(value.observedAt,'observation time missing');
 exact(value.actors,['a','b'],'actors incomplete');
}
function protection(value){
 exact(value,relations,'protected inventory incomplete');
 for(const relation of relations){
  const entry=value[relation];exact(entry,['count','sha256'],'private digest fields only');
  need(Number.isSafeInteger(entry.count)&&entry.count>=0,'invalid protected row count');
  need(typeof entry.sha256==='string'&&sha256.test(entry.sha256),'invalid protected digest');
  if(entry.count===0)need(entry.sha256===digest('[]'),'invalid empty relation digest');
 }
}
function sameProtection(before,after){
 protection(before);protection(after);need(isDeepStrictEqual(before,after),'protected rows changed');
}
function sameActor(before,after){need(isDeepStrictEqual(before,after),'canonical actor observation changed');}
function browserRead(value,scenario){
 exact(value,['sequence','actor','clientId','path','route','revision','marker','requestSha256','observedAt','view'],'browser read incomplete');
 need(value.path===readPath&&value.requestSha256===readRequestSha256,'browser read path/request mismatch');
 need(value.clientId===scenario.clientId,'browser read owner mismatch');
 need(value.revision===scenario.view.revision,'browser read revision mismatch');
 need(value.marker===scenario.marker,'browser read marker mismatch');
 need(isDeepStrictEqual(value.view,scenario.view),'browser read view mismatch');
 need(Number.isSafeInteger(value.sequence)&&value.sequence>=1,'browser read sequence');
 need(value.actor==='a'||value.actor==='b','browser read actor');
 need(typeof value.route==='string'&&/^\/orders(?:\/[0-9a-f-]{36})?$/.test(value.route),'browser read route');
 timestamp(value.observedAt,'browser read time');
}
function correlateReads(reads,requests){
 need(Array.isArray(requests),'browser request correlation missing');
 for(const actor of ['a','b']){
  const count=reads.filter(read=>read.actor===actor).length;
  const received=requests.filter(request=>request.actor===actor&&request.path===readPath&&request.method==='POST'&&request.status===200&&request.requestSha256===readRequestSha256);
  need(received.length>=count,'browser request correlation incomplete');
 }
}
function inputIds(descriptor,phase){
 need(phase==='baseline'||phase==='final','unsupported observation phase');
 dataTree(descriptor);validateOrdersFixture(descriptor);
 const s=descriptor.ordersScenario;
 const ids={actor_a_id:descriptor.actors.a.id,actor_b_id:descriptor.actors.b.id,
  a_purchase_id:s.a.purchaseId,a_return_id:s.a.returnId,a_event_id:s.a.eventId,
  b_purchase_id:s.b.purchaseId,b_return_id:s.b.returnId,b_event_id:s.b.eventId};
 need(Object.values(ids).every(value=>typeof value==='string'&&uuid.test(value))&&new Set(Object.values(ids)).size===8,'invalid/duplicate canonical UUID input');
 return {...ids,phase};
}
/** Safe argument array only. Never joins shell text or starts psql. */
export function ordersObservationPsqlVariables(descriptor,phase){
 return Object.entries(inputIds(descriptor,phase)).flatMap(([name,value])=>['-v',`${name}=${value}`]);
}
function actorObservation(value,scenario){
 exact(value,['clientId','recordIds','view','rows','protected'],'actor observation incomplete');
 need(value.clientId===scenario.clientId,'DB owner mismatch');
 exact(value.recordIds,['purchaseId','returnId','eventId'],'record IDs incomplete');
 for(const key of ['purchaseId','returnId','eventId'])need(value.recordIds[key]===scenario[key],'record identity mismatch');
 need(isDeepStrictEqual(value.view,scenario.view),'DB canonical view mismatch');
 exact(value.rows,['purchases','returns','events','serviceHeads'],'canonical rows incomplete');
 for(const rows of Object.values(value.rows))need(Array.isArray(rows)&&rows.length===1,'canonical row collection incomplete');
 const p=value.rows.purchases[0],r=value.rows.returns[0],e=value.rows.events[0],h=value.rows.serviceHeads[0];
 exact(p,['id','client_id','data','actor_id','recorded_at'],'purchase row fields');
 exact(r,['id','client_id','purchase_id','data','actor_id','requested_at'],'return row fields');
 exact(e,['id','client_id','return_id','data','actor_id','recorded_at','sequence'],'event row fields');
 exact(h,['client_id','revision'],'service head row fields');
 for(const row of [p,r,e,h])need(row.client_id===scenario.clientId,'foreign canonical row owner');
 need(p.id===scenario.purchaseId&&r.id===scenario.returnId&&e.id===scenario.eventId,'canonical row identity mismatch');
 need(r.purchase_id===p.id&&e.return_id===r.id,'canonical row FK mismatch');
 need([p,r,e].every(row=>row.actor_id===scenario.clientId),'canonical recording actor mismatch');
 const purchase=scenario.view.purchases[0],returned=scenario.view.returns[0],event=returned.events[0];
 const {id,recordedBy,recordedAt,...purchaseData}=purchase;
 need(isDeepStrictEqual(p.data,purchaseData)&&p.recorded_at===recordedAt,'raw purchase disagrees with canonical view');
 need(isDeepStrictEqual(r.data,{quantity:returned.quantity,reason:returned.reason,condition:returned.condition})&&r.requested_at===returned.requestedAt,'raw return disagrees with canonical view');
 const {id:eventId,actorId,recordedAt:eventAt,...eventData}=event;
 need(isDeepStrictEqual(e.data,eventData)&&e.recorded_at===eventAt&&Number.isSafeInteger(e.sequence)&&e.sequence>0,'raw event disagrees with canonical view');
 need(h.revision===scenario.view.revision,'canonical service head mismatch');
 protection(value.protected);
 for(const relation of ['retail_purchases','return_cases','return_events','service_heads','cases','enrollments'])need(value.protected['concierge.'+relation].count===1,'incomplete canonical relation count');
}
/** Compares supplied observations only. It does not attest their origin, run
 * SQL, grant rights, prove pre-RPC refusal, or accept C06/C06D or M02. */
export function validateRecordedOrdersObservations(input){
 dataTree(input);exact(input,['descriptor','baseline','final','browser'],'observation packet incomplete');
 const {descriptor:d,baseline,final,browser}=input;
 inputIds(d,'baseline');observationHeader(baseline,'baseline');observationHeader(final,'final');
 const start=Date.parse(baseline.observedAt),end=Date.parse(final.observedAt);need(start<end,'observation chronology mismatch');
 for(const actor of ['a','b']){
  actorObservation(baseline.actors[actor],d.ordersScenario[actor]);actorObservation(final.actors[actor],d.ordersScenario[actor]);
  sameProtection(baseline.actors[actor].protected,final.actors[actor].protected);sameActor(baseline.actors[actor],final.actors[actor]);
 }
 need(browser&&browser.kind==='recorded-orders-browser-observations'&&browser.status==='BROWSER_OBSERVED','complete browser observations missing');
 need(browser.sourceCommit===d.sourceCommit&&browser.ownerId===d.ownerId&&browser.projectId===d.projectId,'browser source/fixture correlation mismatch');
 need(!Object.hasOwn(browser,'accepted')&&!Object.hasOwn(browser,'failurePhase')&&!Object.hasOwn(browser,'failureKind')&&!Object.hasOwn(browser,'traceCleanup')&&!Object.hasOwn(browser,'sessionCleanup'),'browser failure or acceptance claim refused');
 need(browser.financialJourneyAccepted===false&&browser.blockedRequests===0,'browser scope mismatch');
 need(Array.isArray(browser.reads)&&browser.reads.length>=4,'complete A/B browser reads missing');
 for(const [index,read] of browser.reads.entries()){
  need(read?.actor==='a'||read?.actor==='b','browser read actor');
  browserRead(read,d.ordersScenario[read.actor]);need(read.sequence===index+1,'browser read sequence mismatch');
  const at=Date.parse(read.observedAt);need(start<=at&&at<=end,'read outside baseline/final interval');
  need(read.route==='/orders'||[d.ordersScenario.a.purchaseId,d.ordersScenario.b.purchaseId].some(id=>read.route==='/orders/'+id),'unknown browser record route');
 }
 for(const actor of ['a','b'])for(const route of ['/orders','/orders/'+d.ordersScenario[actor].purchaseId])need(browser.reads.some(read=>read.actor===actor&&read.route===route),'positive own list/detail observation missing');
 need(Array.isArray(browser.requests),'request correlation missing');
 for(const request of browser.requests){
  exact(request,['path','method','status','requestSha256','bytes','sha256','actor','at'],'request observation incomplete');
  need(typeof request.path==='string'&&/^\/api\/client\/[a-z0-9/-]+$/.test(request.path)&&['GET','POST'].includes(request.method),'request path/method');
  need(['a','b'].includes(request.actor)&&Number.isSafeInteger(request.status)&&request.status>=100&&request.status<=599,'request actor/status');
  need(Number.isSafeInteger(request.bytes)&&request.bytes>=0&&sha256.test(request.sha256)&&sha256.test(request.requestSha256),'request byte/hash observation');
  timestamp(request.at,'request time');
 }
 correlateReads(browser.reads,browser.requests);
 return Object.freeze({schemaVersion:1,status:'OBSERVATIONS_ONLY',sourceCommit:d.sourceCommit,ownerId:d.ownerId,projectId:d.projectId,
  unchangedRelationsPerActor:relations.length,browserReadCount:browser.reads.length,
  databaseComparison:'equal within the explicit actor/relation scope',requestEffects:'not established by this validator',financialJourneyAccepted:false});
}

async function negativeDataChecks(){
 const {default:test}=await import('node:test');
 // Deliberately incomplete/malformed data only. No positive DB/browser evidence
 // generator and no successful acceptance fixture is used by these source tests.
 const id=n=>`a2000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
 const header=()=>({schemaVersion:1,kind:'recorded-orders-db-observation',phase:'baseline',observedAt:'2026-11-03T08:00:00.000Z',readOnly:true,actors:{}}); // missing actors A/B
 const blankProtection=()=>Object.fromEntries(relations.map(name=>[name,{count:0,sha256:digest('[]')}])); // missing every actual row observation
 const wrongRead=()=>({sequence:1,actor:'a',clientId:id(1),path:readPath,route:'/orders',revision:1,marker:'NOT_A_REAL_MARKER',requestSha256:readRequestSha256,observedAt:'2026-11-03T08:01:00.000Z',view:null});
 const expected=()=>({clientId:id(1),purchaseId:id(2),marker:'EXPECTED_ONLY',view:{revision:1}}); // not a canonical view
 test('rejects missing observation packet',()=>assert.throws(()=>validateRecordedOrdersObservations({})));
 test('rejects forged acceptance field',()=>assert.throws(()=>validateRecordedOrdersObservations({accepted:true})));
 test('rejects writable transaction',()=>{const x=header();x.readOnly=false;assert.throws(()=>observationHeader(x,'baseline'),/read.only/);});
 test('rejects truthy string instead of observed read-only boolean',()=>{const x=header();x.readOnly='on';assert.throws(()=>observationHeader(x,'baseline'),/read.only/);});
 test('rejects wrong phase',()=>{const x=header();x.phase='final';assert.throws(()=>observationHeader(x,'baseline'),/phase/);});
 test('rejects absent observation time',()=>{const x=header();delete x.observedAt;assert.throws(()=>observationHeader(x,'baseline'));});
 test('rejects absent A/B observations',()=>assert.throws(()=>observationHeader(header(),'baseline'),/actors/));
 test('rejects truncated protected inventory',()=>{const x=blankProtection();delete x[relations[0]];assert.throws(()=>protection(x),/inventory/);});
 test('rejects unknown protected relation',()=>{const x=blankProtection();x['concierge.guessed_table']={count:0,sha256:digest('[]')};assert.throws(()=>protection(x),/inventory/);});
 test('rejects leaking private row data beside digest',()=>{const x=blankProtection();x[relations[4]].privateRows=[];assert.throws(()=>protection(x),/digest/);});
 test('rejects invalid whole-row digest',()=>{const x=blankProtection();x[relations[4]].sha256='not-a-hash';assert.throws(()=>protection(x),/digest/);});
 test('rejects impossible negative row count',()=>{const x=blankProtection();x[relations[4]].count=-1;assert.throws(()=>protection(x),/count/);});
 test('rejects nonempty digest represented as zero rows',()=>{const x=blankProtection();x[relations[4]].sha256='a'.repeat(64);assert.throws(()=>protection(x),/empty/);});
 test('rejects before/after private count change',()=>{const x=blankProtection(),y=blankProtection();y[relations[4]]={count:1,sha256:'a'.repeat(64)};assert.throws(()=>sameProtection(x,y),/changed/);});
 test('rejects before/after private bytes change at the same count',()=>{const x=blankProtection(),y=blankProtection();x[relations[4]]={count:1,sha256:'a'.repeat(64)};y[relations[4]]={count:1,sha256:'b'.repeat(64)};assert.throws(()=>sameProtection(x,y),/changed/);});
 test('rejects canonical row change with equal protected claims',()=>{const x={rows:{events:[{sequence:1}]}},y={rows:{events:[{sequence:2}]}};assert.throws(()=>sameActor(x,y),/changed/);});
 // These rows deliberately lack canonical data/timestamps and protection.
 // They reach early identity/FK guards only; they are never accepted DB data.
 const malformedActor=()=>({clientId:id(1),recordIds:{purchaseId:id(2),returnId:id(3),eventId:id(4)},view:null,
  rows:{purchases:[{id:id(2),client_id:id(1),data:null,actor_id:id(1),recorded_at:null}],
   returns:[{id:id(3),client_id:id(1),purchase_id:id(2),data:null,actor_id:id(1),requested_at:null}],
   events:[{id:id(4),client_id:id(1),return_id:id(3),data:null,actor_id:id(1),recorded_at:null,sequence:0}],
   serviceHeads:[{client_id:id(1),revision:0}]},protected:null});
 const malformedScenario=()=>({clientId:id(1),purchaseId:id(2),returnId:id(3),eventId:id(4),view:null});
 test('rejects a foreign row owner before any canonical data can be used',()=>{const x=malformedActor();x.rows.events[0].client_id=id(9);assert.throws(()=>actorObservation(x,malformedScenario()),/owner/);});
 test('rejects a return linked to a foreign purchase',()=>{const x=malformedActor();x.rows.returns[0].purchase_id=id(9);assert.throws(()=>actorObservation(x,malformedScenario()),/FK/);});
 test('rejects an event linked to a foreign return',()=>{const x=malformedActor();x.rows.events[0].return_id=id(9);assert.throws(()=>actorObservation(x,malformedScenario()),/FK/);});
 test('rejects an extra row instead of truncating a collection',()=>{const x=malformedActor();x.rows.purchases.push(x.rows.purchases[0]);assert.throws(()=>actorObservation(x,malformedScenario()),/collection/);});
 test('rejects a missing service head instead of fabricating revision zero',()=>{const x=malformedActor();x.rows.serviceHeads=[];assert.throws(()=>actorObservation(x,malformedScenario()),/collection/);});
 test('rejects a foreign client in a browser observation',()=>{const x=wrongRead();x.clientId=id(9);assert.throws(()=>browserRead(x,expected()),/owner/);});
 test('rejects a foreign marker in a browser observation',()=>assert.throws(()=>browserRead(wrongRead(),expected()),/marker/));
 test('rejects a browser revision that disagrees with readback',()=>{const x=wrongRead();x.revision=2;assert.throws(()=>browserRead(x,expected()),/revision/);});
 test('rejects an alternate RPC/request path',()=>{const x=wrongRead();x.path='/api/advisor/operations';assert.throws(()=>browserRead(x,expected()),/path/);});
 test('rejects absent exact browser view',()=>{const x=wrongRead();x.marker=expected().marker;assert.throws(()=>browserRead(x,expected()),/view/);});
 test('rejects uncorrelated browser reads',()=>assert.throws(()=>correlateReads([wrongRead()],[]),/correlation/));
 test('rejects a 400 as evidence of a successful read',()=>{const x=wrongRead();const r={actor:'a',path:readPath,method:'POST',status:400,requestSha256:readRequestSha256};assert.throws(()=>correlateReads([x],[r]),/correlation/);});
 for(const field of ['a','b'])test(`refuses malformed ${field} actor UUID for psql`,()=>{
  const d={schemaVersion:1,actors:{a:{id:id(1)},b:{id:id(2)}},ordersScenario:{a:{purchaseId:id(3),returnId:id(4),eventId:id(5)},b:{purchaseId:id(6),returnId:id(7),eventId:id(8)}}};d.actors[field].id="x';select 1;--";
  assert.throws(()=>ordersObservationPsqlVariables(d,'baseline'));
 });
 test('refuses an unsupported observation phase before process effects',()=>assert.throws(()=>ordersObservationPsqlVariables({},'after-write')));
 test('rejects a getter in data without invoking it',()=>{let effects=0;const x={};Object.defineProperty(x,'readOnly',{enumerable:true,get(){effects++;return true;}});assert.throws(()=>exact(x,['readOnly'],'invalid data'));assert.equal(effects,0);});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await negativeDataChecks();
