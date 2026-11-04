import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readPlanCommand} from '../../../src/contracts/PortalRebuildValidation.ts';
let api={};
for(const suffix of ['Values','Validation','Mapping']){
 try{api={...api,...await import(new URL('../../../src/contracts/PortalPlanDirectoryV2'+suffix+'.ts',import.meta.url))};}
 catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
}
const call=(name,...args)=>{assert.equal(typeof api[name],'function','new directory export '+name+' must exist');return api[name](...args);};
const draftId='10000000-0000-4000-8000-000000000001',clientId='10000000-0000-4000-8000-000000000002',actorId='10000000-0000-4000-8000-000000000003';
const command=(filter='all')=>({schemaVersion:2,action:'list_advisor_plan_directory_v2',clientId:null,filter,publisherContext:'current_human',cursor:null,limit:100});
const draft=()=>({kind:'draft',id:draftId,clientId:null,state:'working',contentRevision:0,assignmentRevision:0,savedAt:'2026-11-03T10:00:00Z',title:{state:'known',value:''},review:'needs_review',workflow:{state:'unknown'}});
const publication=()=>({kind:'publication',clientId,version:1,documentSchemaVersion:1,publishedAt:'2026-11-03T10:00:00Z',title:{state:'unknown'}});
const view=(filter='all')=>({schemaVersion:2,clientId:null,filter,publisher:{kind:'human',actorId},consistency:'live_keyset',observedAt:'2026-11-03T11:00:00Z',reviewClassification:'complete',rows:[draft()],nextCursor:null});
test('one closed new READ uses one fixed RPC and leaves old list command unchanged',()=>{
 assert.deepEqual(call('buildPlanDirectoryV2Rpc',command()),{name:'concierge_plan_directory_v2',args:{p_command:command()}});
 assert.equal(call('planDirectoryV2Access','human'),'READ');for(const audience of ['task_agent','client'])assert.equal(call('planDirectoryV2Access',audience),'DENY');
 const old={schemaVersion:1,action:'list_plans_v1',clientId:null,cursor:null,limit:100};assert.deepEqual(readPlanCommand(old),old);assert.throws(()=>call('readPlanDirectoryV2Command',old),/invalid_input/);
 assert.equal(api.planDirectoryV2CommandMaxBytes,8192);assert.equal(api.planDirectoryV2ResultMaxBytes,262144);assert.equal(api.planDirectoryV2CursorMaxBytes,512);
});
for(const extra of [{publisher:{kind:'human',actorId}},{actorId},{owner:true},{role:'owner'},{taskGrantId:actorId},{rpc:'other'},{url:'https://example.com'},{search:'name'},{canPublish:true}])test('request cannot add authority/publisher/endpoint/unapproved field '+Object.keys(extra)[0],()=>assert.throws(()=>call('readPlanDirectoryV2Command',{...command(),...extra}),/invalid_input/));
test('declared human context and closed filters cannot become caller-selected publishers or workflow search',()=>{
 for(const publisherContext of ['owner',actorId,{kind:'human',actorId},null])assert.throws(()=>call('readPlanDirectoryV2Command',{...command(),publisherContext}),/invalid_input/);
 for(const filter of ['all','unassigned','needs_review'])assert.equal(call('readPlanDirectoryV2Command',command(filter)).filter,filter);
 for(const filter of ['approved','ready_to_publish','needs-review','working'])assert.throws(()=>call('readPlanDirectoryV2Command',command(filter)),/invalid_input/);
});
test('all page limits and exact opaque Unicode byte bounds remain closed',()=>{
 for(let limit=1;limit<=100;limit++)assert.equal(call('readPlanDirectoryV2Command',{...command(),limit}).limit,limit);
 for(const limit of [0,101,-1,1.5])assert.throws(()=>call('readPlanDirectoryV2Command',{...command(),limit}),/invalid_input/);
 for(const cursor of ['é'.repeat(257),'next\n','\ud800'])assert.throws(()=>call('readPlanDirectoryV2Command',{...command(),cursor}),/invalid_input/);
 assert.equal(call('readPlanDirectoryV2Command',{...command(),cursor:'é'.repeat(256)}).cursor,'é'.repeat(256));
});
test('actual publisher response is a closed human identity, not a model role/capability grant',()=>{
 assert.deepEqual(call('mapPlanDirectoryV2Result',view(),command()).publisher,{kind:'human',actorId});
 for(const publisher of [{kind:'task_agent',actorId},{kind:'human',actorId,owner:true},{kind:'human',actorId,canPublish:true}])assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),publisher},command()),/unavailable/);
});
test('client/filter response scope must equal the exact request; client scope is a filter, not authority',()=>{
 const scoped={...command(),clientId},row={...draft(),clientId},response={...view(),clientId,rows:[row]};assert.deepEqual(call('mapPlanDirectoryV2Result',response,scoped),response);
 for(const changed of [{...response,clientId:actorId},{...response,filter:'unassigned'},{...response,rows:[{...row,clientId:actorId}]}])assert.throws(()=>call('mapPlanDirectoryV2Result',changed,scoped),/unavailable/);
});
test('row kind is explicit and missing title stays unknown while actual empty draft is preserved',()=>{
 const response={...view(),rows:[draft(),publication()]};assert.deepEqual(call('mapPlanDirectoryV2Result',response,command()),response);
 assert.equal(call('mapPlanDirectoryV2Result',view(),command()).rows[0].title.value,'');
 const unknown={...draft(),title:{state:'unknown'}};assert.deepEqual(call('mapPlanDirectoryV2Result',{...view(),rows:[unknown]},command()).rows[0].title,{state:'unknown'});
 const noKind=draft();delete noKind.kind;assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows:[noKind]},command()),/unavailable/);
});
test('legacy R1 title never uses today/current/nearest publication as a fabricated title',()=>{
 assert.deepEqual(call('mapPlanDirectoryV2Result',{...view(),rows:[publication()]},command()).rows[0].title,{state:'unknown'});
 assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows:[{...publication(),title:{state:'known',value:'guessed'}}]},command()),/unavailable/);
 for(const documentSchemaVersion of [2,3])assert.equal(call('mapPlanDirectoryV2Result',{...view(),rows:[{...publication(),documentSchemaVersion,title:{state:'known',value:'actual title'}}]},command()).rows[0].title.value,'actual title');
});
test('unassigned filter requires actual null client draft binding and never returns publications',()=>{
 assert.deepEqual(call('mapPlanDirectoryV2Result',view('unassigned'),command('unassigned')),view('unassigned'));
 for(const row of [{...draft(),clientId},publication()])assert.throws(()=>call('mapPlanDirectoryV2Result',{...view('unassigned'),rows:[row]},command('unassigned')),/unavailable/);
});
test('needs-review selects only known current working review tasks',()=>{
 assert.deepEqual(call('mapPlanDirectoryV2Result',view('needs_review'),command('needs_review')),view('needs_review'));
 for(const row of [{...draft(),review:'unavailable'},{...draft(),review:'reviewed'},{...draft(),state:'archived'},publication()])assert.throws(()=>call('mapPlanDirectoryV2Result',{...view('needs_review'),rows:[row]},command('needs_review')),/unavailable/);
});
test('classification describes all authorized working candidates before filtering, not this page length',()=>{
 for(const reviewClassification of ['complete','incomplete','unavailable']){
  const response={...view('needs_review'),rows:[],reviewClassification};assert.deepEqual(call('mapPlanDirectoryV2Result',response,command('needs_review')),response);
 }
 const unknown={...draft(),review:'unavailable'};
 assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows:[unknown]},command()),/unavailable/);
 assert.equal(call('mapPlanDirectoryV2Result',{...view(),reviewClassification:'incomplete',rows:[unknown]},command()).reviewClassification,'incomplete');
 assert.equal(call('mapPlanDirectoryV2Result',{...view(),reviewClassification:'incomplete'},command()).reviewClassification,'incomplete');
 for(const extra of [{count:0},{total:0},{classificationScope:'page'},{snapshot:'immutable'}])assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows:[],...extra},command()),/unavailable/);
});
test('published/archived draft rows are metadata and never new review tasks',()=>{
 for(const state of ['published','archived']){
  const row={...draft(),state,review:'unavailable',workflow:{state:'known',value:state}};assert.deepEqual(call('mapPlanDirectoryV2Result',{...view(),rows:[row]},command()).rows[0],row);
  assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows:[{...row,review:'needs_review'}]},command()),/unavailable/);
 }
});
test('review classification remains independent of actual viewer publish capability',()=>{
 const row={...draft(),workflow:{state:'known',value:'publish_not_permitted'}};assert.deepEqual(call('mapPlanDirectoryV2Result',{...view(),rows:[row]},command()).rows[0],row);
 const reviewed={...row,review:'reviewed'};assert.deepEqual(call('mapPlanDirectoryV2Result',{...view(),rows:[reviewed]},command()).rows[0],reviewed);
});
test('Known workflows are closed, current-target correlated observations, never a write receipt',()=>{
 for(const value of ['incomplete','needs_review','needs_rebase','publish_not_permitted']){
  const row={...draft(),workflow:{state:'known',value}};assert.deepEqual(call('mapPlanDirectoryV2Result',{...view(),rows:[row]},command()).rows[0],row);
 }
 for(const value of ['approval_required','approved_awaiting_payment','ready_to_publish']){
  const row={...draft(),clientId,review:'reviewed',workflow:{state:'known',value}};assert.deepEqual(call('mapPlanDirectoryV2Result',{...view(),rows:[row]},command()).rows[0],row);
  assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows:[{...row,clientId:null}]},command()),/unavailable/);
  assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows:[{...row,review:'needs_review'}]},command()),/unavailable/);
 }
 for(const workflow of [{state:'known',value:'approved'},{state:'unknown',value:'ready_to_publish'},{state:'known',value:'published'}])assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows:[{...draft(),workflow}]},command()),/unavailable/);
});
test('live merged keyset preserves old draft/publication sort identity and rejects duplicates',()=>{
 const a=publication(),b={...publication(),version:2};const response={...view(),rows:[draft(),a,b]};assert.deepEqual(call('mapPlanDirectoryV2Result',response,command()),response);
 for(const rows of [[a,draft()],[draft(),draft()],[b,a]])assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows},command()),/unavailable/);
});
test('metadata result limit and forward cursor must describe actual nonempty full pages',()=>{
 const req={...command(),limit:1,cursor:'before'};const response={...view(),nextCursor:'after'};assert.deepEqual(call('mapPlanDirectoryV2Result',response,req),response);
 for(const delta of [{nextCursor:'before'},{rows:[]},{rows:[draft(),publication()]},{nextCursor:'é'.repeat(257)}])assert.throws(()=>call('mapPlanDirectoryV2Result',{...response,...delta},req),/unavailable/);
});
test('titles and timestamps are bounded plain content, not markup, source permission or future facts',()=>{
 const row={...draft(),title:{state:'known',value:'🧴'.repeat(200)}};assert.equal(call('mapPlanDirectoryV2Result',{...view(),rows:[row]},command()).rows[0].title.value,'🧴'.repeat(200));
 for(const title of [{state:'known',value:'a'.repeat(201)},{state:'known',value:'\ud800'},{state:'known',value:'<script>x</script>'},null])assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows:[{...draft(),title}]},command()),/unavailable/);
 assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows:[{...draft(),savedAt:'2026-11-04T00:00:00Z'}]},command()),/unavailable/);
});
test('new projection rejects private bodies/notes/source and permission facades at every row',()=>{
 for(const extra of [{content:{title:'private'}},{privateNotes:'private'},{sourceIds:[clientId]},{canReadSources:true},{approvalId:actorId},{photos:[]}])assert.throws(()=>call('mapPlanDirectoryV2Result',{...view(),rows:[{...draft(),...extra}]},command()),/unavailable/);
});
test('descriptor-first JSON rejects getters without evaluation and returns detached frozen metadata',()=>{
 let reads=0;const bad=command();Object.defineProperty(bad,'cursor',{enumerable:true,get(){reads++;return null;}});assert.throws(()=>call('readPlanDirectoryV2Command',bad),/invalid_input/);assert.equal(reads,0);
 const input=view(),parsed=call('mapPlanDirectoryV2Result',input,command());input.rows[0].title.value='changed';assert.equal(parsed.rows[0].title.value,'');assert.equal(Object.isFrozen(parsed.rows[0].workflow),true);
});
test('the combined100-row page stays bounded across both kinds without100-plus100 truncation',()=>{
 const drafts=Array.from({length:50},(_,i)=>({...draft(),id:'10000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),title:{state:'known',value:'🧴'.repeat(200)}}));
 const publications=Array.from({length:50},(_,i)=>({...publication(),version:i+1}));
 const response={...view(),rows:[...drafts,...publications]};
 assert.deepEqual(call('mapPlanDirectoryV2Result',response,command()),response);
 assert.throws(()=>call('mapPlanDirectoryV2Result',{...response,rows:[...response.rows,{...publication(),version:51}]},command()),/unavailable/);
});
test('bounded declared scope/filter roundtrips never manufacture completeness or a workflow',()=>{
 for(const filter of ['all','unassigned','needs_review'])for(const scope of [null,clientId])for(const limit of [1,2,50,100]){
  const request={...command(filter),clientId:scope,limit};
  const rows=filter==='unassigned'&&scope!==null?[]:[{...draft(),clientId:filter==='unassigned'?null:scope}];
  const response={...view(filter),clientId:scope,rows,reviewClassification:'incomplete'};
  const mapped=call('mapPlanDirectoryV2Result',JSON.parse(JSON.stringify(response)),request);
  assert.deepEqual(mapped,response);assert.equal(mapped.reviewClassification,'incomplete');
  if(rows.length)assert.deepEqual(mapped.rows[0].workflow,{state:'unknown'});
 }
});
