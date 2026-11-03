import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateHistoryInputs, compareHistoryObservations, observeClientHistory} from './client-history.browser.mjs';

// Invalid-input controls only. These are not issued Auth identities or producer results.
test('missing actual descriptor and publication scenario refuse before any page use', () => {
  assert.throws(() => validateHistoryInputs({}), /descriptor/);
});
test('a claimed publication flag cannot replace canonical M04 receipt/version/event identities', () => {
  assert.throws(() => validateHistoryInputs({descriptor:{schemaVersion:1},historyScenario:{published:true}}), /descriptor|scenario/);
});
test('empty oracle/browser observations cannot report an error-free comparison', () => {
  const result = compareHistoryObservations({});
  assert.equal(result.kind, 'OBSERVATIONS_ONLY');
  assert.ok(result.errors.length > 0);
});
test('missing page and helpers are a failed observation phase, never an optional pass', async () => {
  const result = await observeClientHistory({});
  assert.equal(result.kind, 'OBSERVATIONS_ONLY');
  assert.ok(result.errors.length > 0);
});

// These intentionally constructed values exercise the pure validator, not a
// successful browser/OperationPort/Auth/SQL producer. No genuine claim is made.
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
function inputs(){
  const ref={version:1,publicationReceiptId:id(4),notificationEventId:id(5),documentSchemaVersion:3,markers:['CONTROL ONLY title']};
  return {descriptor:{schemaVersion:1,ownerId:id(1),projectId:'control-only',fixtureDirectory:'/control-only',sourceCommit:'a'.repeat(40),endpoints:{portal:'https://127.0.0.1:54321',supabase:'https://127.0.0.1:54322',mailpit:'http://127.0.0.1:54323'},actors:{a:{id:id(2),email:'a@example.invalid',initialDisplayName:'CONTROL A'},b:{id:id(3),email:'b@example.invalid',initialDisplayName:'CONTROL B'}},privateDirectory:'/control-only/private',fingerprints:{source:'SOURCE-V2.json',config:'CONFIG.json',images:'IMAGES.json',processes:'PROCESSES.json',resources:'RESOURCES.json'}},historyScenario:{schemaVersion:1,publicationMilestoneId:'M04',actor:'a',publications:{a:{older:ref,current:structuredClone(ref)},b:null},newPublication:null,invalidVersions:[999]}};
}
function oracle(){
  const documentText='{ "title": "CONTROL ONLY title", "unicode": "é 🧴" }';
  const snapshotText=JSON.stringify({publication:{client_id:id(2),version:1},document:{client_id:id(2),version:1,receipt_id:id(4),document:JSON.parse(documentText)}});
  const row={actor:'a',clientId:id(2),version:1,present:true,documentSchemaVersion:3,publicationReceiptId:id(4),notificationEventId:id(5),snapshotText,snapshotSha256:hash(snapshotText),documentText,documentSha256:hash(documentText)};
  const missing={actor:'a',clientId:id(2),version:999,present:false,documentSchemaVersion:null,publicationReceiptId:null,notificationEventId:null,snapshotText:null,snapshotSha256:null,documentText:null,documentSha256:null};
  return {schemaVersion:1,encoding:'PostgreSQL jsonb::text / UTF-8',actors:{a:id(2),b:id(3)},heads:{a:1,b:0},rows:[row,missing]};
}
function comparison(change){const input=inputs(),p=oracle();change?.(p,input);return compareHistoryObservations({...input,before:{oracle:p}});}
function rejects(change,match){const out=comparison(change);assert.equal(out.kind,'OBSERVATIONS_ONLY');assert.match(out.errors[0]?.message??'',match);assert.equal('success' in out,false);assert.equal('accepted' in out,false);}

test('one actual publication shape and unknown B do not require invented second versions',()=>{
  const input=inputs(),checked=validateHistoryInputs(input);assert.deepEqual(checked,input);checked.descriptor.actors.a.id=id(6);assert.equal(input.descriptor.actors.a.id,id(2));
});
for(const [name,change] of [
  ['unknown descriptor authority flag',x=>x.descriptor.authorized=true],
  ['alternate actor key',x=>{x.descriptor.actors.a.userId=x.descriptor.actors.a.id;delete x.descriptor.actors.a.id;}],
  ['private credential field',x=>x.descriptor.actors.a.password='CONTROL NEVER A CREDENTIAL'],
  ['nonliteral portal host',x=>x.descriptor.endpoints.portal='https://localhost:54321'],
  ['nonlocal portal endpoint',x=>x.descriptor.endpoints.portal='https://example.invalid:54321'],
  ['duplicate actors',x=>x.descriptor.actors.b.id=x.descriptor.actors.a.id],
  ['missing actual publication',x=>x.historyScenario.publications.a=null],
  ['no M04 lineage',x=>x.historyScenario.publicationMilestoneId='M03'],
  ['unknown receipt field',x=>x.historyScenario.publications.a.older.approved=true],
  ['malformed receipt UUID',x=>x.historyScenario.publications.a.older.publicationReceiptId='invented'],
  ['nonpositive invalid-version candidate',x=>x.historyScenario.invalidVersions=[0]],
  ['known version as invalid',x=>x.historyScenario.invalidVersions=[1]],
  ['duplicate invalid-version candidates',x=>x.historyScenario.invalidVersions=[999,999]],
  ['unsafe integer version',x=>x.historyScenario.invalidVersions=[9007199254740992]],
  ['positive candidate outside actual PostgreSQL version range',x=>x.historyScenario.invalidVersions=[2147483648]],
  ['rewound newer publication',x=>x.historyScenario.newPublication=structuredClone(x.historyScenario.publications.a.current)],
])test(`input refuses ${name}`,()=>{const x=inputs();change(x);assert.throws(()=>validateHistoryInputs(x));});

test('valid controlled bytes reach the missing-browser refusal, never fabricated browser success',()=>rejects(null,/browser: missing\/failed/));
test('oracle refuses a row attributed to B with A bytes',()=>rejects(p=>p.rows[0].clientId=id(3),/wrong owner/));
test('oracle refuses swapped actors',()=>rejects(p=>p.actors.a=id(3),/actor\/head/));
test('oracle refuses missing current-head authority',()=>rejects(p=>p.heads.a=null,/actor\/head/));
test('oracle refuses duplicate selected rows',()=>rejects(p=>p.rows.push(p.rows[0]),/duplicate row/));
test('oracle refuses UTF-8 hash mismatch',()=>rejects(p=>p.rows[0].documentSha256='0'.repeat(64),/document UTF-8 hash/));
test('oracle refuses snapshot hash mismatch',()=>rejects(p=>p.rows[0].snapshotSha256='0'.repeat(64),/snapshot UTF-8 hash/));
test('oracle does not hash a regenerated JSON representation',()=>rejects(p=>p.rows[0].documentSha256=hash(JSON.stringify(JSON.parse(p.rows[0].documentText))),/UTF-8 hash/));
test('oracle refuses valid hash of content bound to a different publication',()=>rejects(p=>{const s=JSON.parse(p.rows[0].snapshotText);s.document.version=2;p.rows[0].snapshotText=JSON.stringify(s);p.rows[0].snapshotSha256=hash(p.rows[0].snapshotText);},/snapshot row\/content/));
test('oracle refuses a canonical receipt mismatch',()=>rejects(p=>p.rows[0].notificationEventId=id(7),/M04 receipt/));
test('oracle requires explicit absent-row observation for invalid positive version',()=>rejects(p=>p.rows.pop(),/not proven absent/));
test('oracle refuses content smuggled into an absent row',()=>rejects(p=>p.rows[1].documentText='PRIVATE',/absent row has content/));
test('oracle refuses replacement of server encoding declaration',()=>rejects(p=>p.encoding='SQLite JSON / UTF-8',/server encoding/));

test('page shape refusal makes no navigation/auth/connection attempt',async()=>{
  let touches=0;const page={goto(){touches++;throw new Error('must not navigate');}};
  const r=await observeClientHistory({...inputs(),page});assert.match(r.errors[0].message,/page.on/);assert.equal(touches,0);
});
test('missing helpers refuse before observer attachment or navigation',async()=>{
  let touches=0;const page=Object.fromEntries(['on','off','goto','reload','goBack','url','locator','getByRole','getByText','waitForURL','waitForResponse','waitForFunction'].map(k=>[k,()=>{touches++;throw new Error('no resource use');}]));
  const r=await observeClientHistory({...inputs(),page});assert.match(r.errors[0].message,/helpers/);assert.equal(touches,0);
});
test('later-phase execution requires actual newer M04 receipt before page use',async()=>{
  const r=await observeClientHistory({...inputs(),phase:'after-new-publication'});assert.match(r.errors[0].message,/new actual M04/);
});
test('SQL artifact is a read-only two-actor observation, with no mutable seed or RPC',()=>{
  const sql=readFileSync(new URL('./client-history-observation.sql',import.meta.url),'utf8').replace(/--[^\n]*/g,'');
  assert.match(sql,/begin transaction isolation level repeatable read read only/i);assert.match(sql,/rollback;/i);
  assert.doesNotMatch(sql,/\b(insert|update|delete|create|alter|drop|grant|revoke|truncate|execute|copy|call)\b/i);
  assert.match(sql,/:'a_id'::uuid/);assert.match(sql,/:'b_id'::uuid/);assert.match(sql,/p.client_id=q.client_id and p.version=q.version/);assert.match(sql,/sha256\(convert_to\(snapshot_text,'UTF8'\)\)/);
});

function successor(){
  const x=inputs(),first=oracle(),next=oracle();
  x.historyScenario.newPublication={...structuredClone(x.historyScenario.publications.a.current),version:2,publicationReceiptId:id(8),notificationEventId:id(9)};
  next.heads.a=2;const row=structuredClone(next.rows[0]);row.version=2;row.publicationReceiptId=id(8);row.notificationEventId=id(9);
  const snap=JSON.parse(row.snapshotText);snap.publication.version=2;snap.document.version=2;snap.document.receipt_id=id(8);row.snapshotText=JSON.stringify(snap);row.snapshotSha256=hash(row.snapshotText);next.rows.push(row);
  return {x,first,next};
}
function successorRejection(change,match){const s=successor();change(s);const r=compareHistoryObservations({...s.x,before:{oracle:s.first},after:{oracle:s.next}});assert.match(r.errors[0]?.message??'',match);}
test('new publication never substitutes an old immutable snapshot with validly rehashed bytes',()=>successorRejection(s=>{
  const row=s.next.rows[0];const document=JSON.parse(row.documentText);document.title='REWRITTEN OLD VERSION';row.documentText=JSON.stringify(document);row.documentSha256=hash(row.documentText);const snap=JSON.parse(row.snapshotText);snap.document.document=document;row.snapshotText=JSON.stringify(snap);row.snapshotSha256=hash(row.snapshotText);
},/immutable historical bytes changed/));
test('new publication cannot drop the old row',()=>successorRejection(s=>s.next.rows.shift(),/immutable historical bytes changed/));
test('new current head must equal the actual newer M04 version',()=>successorRejection(s=>s.next.heads.a=3,/newer current head mismatch/));
test('newer receipt cannot be substituted',()=>successorRejection(s=>s.next.rows[2].notificationEventId=id(10),/M04 receipt/));
test('a changed old notification linkage is refused even with unchanged document bytes',()=>successorRejection(s=>s.next.rows[0].notificationEventId=id(10),/immutable historical bytes changed/));
test('unchanged controlled SQL bytes still require genuine browser observations',()=>successorRejection(()=>{},/browser: missing\/failed/));

// Failure-only surface: no Auth/OperationPort, API response, body, or successful
// browser observation is simulated. It reaches exactly the failing helper seam.
function failurePage(){
  let href='https://127.0.0.1:54321/history';
  return {on(){},off(){},async goto(value){href=value;},url:()=>href,locator:()=>({async waitFor(){}}),getByRole:()=>({async isVisible(){return true;}}),getByText(){throw new Error('unexpected marker read');},reload(){throw new Error('must stop before refresh');},goBack(){throw new Error('must stop before back');},waitForURL(){throw new Error('must stop before URL wait');},waitForResponse(){throw new Error('must stop before pagination');},waitForFunction(){throw new Error('must stop before pagination');}};
}
for(const helper of ['privateScan','capture','captureCanonical'])test(`${helper} thrown error is preserved and fails the phase`,async()=>{
  const helpers=Object.fromEntries(['privateScan','capture','captureCanonical'].map(k=>[k,async()=>{if(k===helper)throw new Error(`CONTROL ${k} exact failure`);return {observations:[{label:'CONTROL ONLY prerequisite observation'}],errors:[]};} ]));
  const r=await observeClientHistory({...inputs(),page:failurePage(),helpers});assert.match(r.errors[0].message,/helper observation failed/);assert.ok(r.observations[0].errors.some(e=>e.helper===helper&&e.message===`CONTROL ${helper} exact failure`));
});
test('helper envelope errors are retained without success flags',async()=>{
  const helpers=Object.fromEntries(['privateScan','capture','captureCanonical'].map(k=>[k,async()=>({observations:[{label:'FAILURE CONTROL'}],errors:[{code:`${k}-refused`} ]})]));
  const r=await observeClientHistory({...inputs(),page:failurePage(),helpers});assert.match(r.errors[0].message,/helper observation failed/);assert.deepEqual(r.observations[0].errors.map(e=>e.error.code),['privateScan-refused']);
});
test('an empty helper observation cannot pass a phase',async()=>{
  const helpers=Object.fromEntries(['privateScan','capture','captureCanonical'].map(k=>[k,async()=>({observations:[],errors:[]})]));
  const r=await observeClientHistory({...inputs(),page:failurePage(),helpers});assert.equal(r.observations[0].errors.length,1);assert.ok(r.observations[0].errors.every(e=>/observation missing/.test(e.message)));
});
test('claimed helper success envelope is invalid',async()=>{
  const helpers=Object.fromEntries(['privateScan','capture','captureCanonical'].map(k=>[k,async()=>({observations:[],errors:[],success:true})]));
  const r=await observeClientHistory({...inputs(),page:failurePage(),helpers});assert.ok(r.observations[0].errors.every(e=>/exact fields/.test(e.message)));
});

for(const mode of ['command-read-failure','body-read-failure','extra-owner-selector','unexpected-write'])test(`real observer failure seam retains ${mode} without a success response`,async()=>{
  const handlers=new Map(),page=failurePage(),command={schemaVersion:1,action:'read_client_plan_v3',version:null};
  if(mode==='extra-owner-selector')command.clientId=id(3);if(mode==='unexpected-write')command.action='publish_plan_v1';
  const request={url:()=>inputs().descriptor.endpoints.portal+'/api/client/reviews',postDataJSON(){if(mode==='command-read-failure')throw new Error('CONTROL exact command read failure');return command;}};
  page.on=(name,fn)=>handlers.set(name,fn);page.off=name=>handlers.delete(name);
  page.goto=async()=>{handlers.get('request')(request);handlers.get('response')({request:()=>request,async text(){throw new Error('CONTROL exact body read failure');},status(){throw new Error('NO SUCCESS STATUS PROVIDED');}});};
  const helpers=Object.fromEntries(['privateScan','capture','captureCanonical'].map(k=>[k,async()=>{throw new Error('CONTROL helper refused');}]));
  const r=await observeClientHistory({...inputs(),page,helpers});const e=r.errors.find(e=>e.phase==='read');assert.ok(e);
  assert.match(e.message,mode==='extra-owner-selector'?/read command: exact fields/:mode==='unexpected-write'?/unexpected history operation/:new RegExp(`exact ${mode==='command-read-failure'?'command':'body'} read failure`));
  assert.equal(handlers.size,0);assert.deepEqual(r.reads,[]);
});
test('an unresolved caller helper is bounded and explicitly remains unjoined',async()=>{
  const helpers=Object.fromEntries(['privateScan','capture','captureCanonical'].map(k=>[k,()=>new Promise(()=>{})]));
  const r=await observeClientHistory({...inputs(),page:failurePage(),helpers,timeoutMs:1});assert.match(r.errors[0].message,/helper observation failed/);assert.equal(r.pending.filter(p=>p.startsWith('unjoined caller')).length,1);assert.ok(r.observations[0].errors.every(e=>/deadline exceeded/.test(e.message)));
});
test('null comparison input remains observations-only with a refusal',()=>{
  const r=compareHistoryObservations(null);assert.equal(r.kind,'OBSERVATIONS_ONLY');assert.ok(r.errors.length);
});
test('null browser input remains observations-only with a refusal',async()=>{
  const r=await observeClientHistory(null);assert.equal(r.kind,'OBSERVATIONS_ONLY');assert.ok(r.errors.length);
});
test('private scan refusal stops before capture or further canonical reads',async()=>{
  const calls=[],helpers=Object.fromEntries(['privateScan','capture','captureCanonical'].map(k=>[k,async()=>{calls.push(k);throw new Error('CONTROL refused');}]));
  const r=await observeClientHistory({...inputs(),page:failurePage(),helpers});assert.ok(r.errors.length);assert.deepEqual(calls,['privateScan']);
});

// Source/route compatibility controls only. They execute no Page, response,
// producer, authority or resource substitute, and prove no genuine acceptance.
const historySource=readFileSync(new URL('./client-history.browser.mjs',import.meta.url),'utf8');
test('HG1 invalid-version title agrees with the actual shared route grammar',async()=>{
  const {parseRoute}=await import('../../site/auth/portal-routes.js');
  const {runInNewContext}=await import('node:vm');
  const expression=historySource.match(/stage='invalid:'\+version;[\s\S]*?page\.getByText\(([\s\S]*?),\{exact:true\}\)\.waitFor/)?.[1];
  assert.ok(expression,'invalid-version exact title expression required');
  for(const version of [999,0,-1,'1.5','9007199254740992']){
    const route=parseRoute('/history/versions/'+version);
    const expected=route?.name==='history-version'?'plan version unavailable':'page unavailable';
    assert.equal(runInNewContext('('+expression+')',{version}),expected,`Root route title for ${version}`);
  }
});
test('HG2 pagination continues until both selected and current publication controls are present',async()=>{
  const {runInNewContext}=await import('node:vm');
  const expression=historySource.match(/for\(let n=0;([\s\S]*?);n\+\+\)/)?.[1];
  assert.ok(expression,'bounded pagination predicate required');
  const predicate=expression.replaceAll('await opener.isVisible()','olderVisible').replaceAll('await currentOpener.isVisible()','currentVisible');
  for(const [olderVisible,currentVisible,expected] of [[true,false,true],[false,true,true],[false,false,true],[true,true,false]]){
    assert.equal(runInNewContext('('+predicate+')',{olderVisible,currentVisible}),expected,`pagination with selected=${olderVisible}, current=${currentVisible}`);
  }
});
test('HG2 selected/current pagination is required before initial and both return-list checkpoints',()=>{
  for(const stage of ['list','back','native-back']){
    const start=historySource.indexOf(`stage='${stage}';`),end=historySource.indexOf(`checkpoint('${stage}')`,start);
    assert.ok(start>=0&&end>start,`${stage} checkpoint source required`);
    assert.ok(historySource.slice(start,end).includes('await loadRequiredVersions()'),`${stage} must load selected and current before capture`);
  }
});
