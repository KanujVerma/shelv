import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createEmptyPlanContent} from '../../../src/contracts/PortalRebuild.ts';
import {readPlanCommand} from '../../../src/contracts/PortalRebuildValidation.ts';
let api={};
for(const suffix of ['Values','Validation','Mapping']){
 try{api={...api,...await import(new URL('../../../src/contracts/PortalPlanTemplate'+suffix+'.ts',import.meta.url))};}
 catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
}
const call=(name,...args)=>{assert.equal(typeof api[name],'function','new template export '+name+' must exist');return api[name](...args);};
const id='10000000-0000-4000-8000-000000000001',versionId='10000000-0000-4000-8000-000000000002',requestId='10000000-0000-4000-8000-000000000003',actorId='10000000-0000-4000-8000-000000000004';
const content=()=>({...createEmptyPlanContent(),title:'generic routine',sources:[{label:'public reference',url:'https://example.com/reference'}]});
const create=()=>({schemaVersion:1,action:'create_plan_template_v1',requestId,name:'routine template',content:content()});
const save=()=>({...create(),action:'save_plan_template_version_v1',templateId:id,expectedVersion:3});
const metadata=(version=1)=>({schemaVersion:1,templateId:id,templateVersionId:versionId,version,versionHash:'a'.repeat(64),name:'routine template',createdAt:'2026-11-03T10:00:00Z',createdBy:actorId});
const version=(n=1)=>({...metadata(n),content:content()});
const receipt=(command=create())=>({schemaVersion:1,requestId,action:command.action,version:version(command.action==='create_plan_template_v1'?1:command.expectedVersion+1)});
const list=(scope={kind:'catalog'})=>({schemaVersion:1,action:'list_plan_templates_v1',scope,cursor:null,limit:100});
const page=(scope={kind:'catalog'})=>({schemaVersion:1,scope,consistency:'live_keyset',observedAt:'2026-11-03T11:00:00Z',entries:[metadata()],nextCursor:null});
test('five actions use one fixed new RPC and exact human transport classification',()=>{
 const commands=[list(),{schemaVersion:1,action:'read_plan_template_version_v1',templateVersionId:versionId},create(),save(),{schemaVersion:1,action:'plan_template_request_status_v1',requestId}];
 assert.equal(api.planTemplateActions.length,5);
 for(const command of commands){
  assert.deepEqual(call('buildPlanTemplateRpc',command),{name:'concierge_plan_template_command_v1',args:{p_command:command}});
  assert.equal(call('planTemplateAccess',command.action,'human'),command.action.startsWith('create_')||command.action.startsWith('save_')?'WRITE':'READ');
  for(const principal of ['client','task_agent'])assert.equal(call('planTemplateAccess',command.action,principal),'DENY');
 }
 assert.equal(call('planTemplateAccess','request_status_v1','human'),'DENY');
});
test('new-family limits do not change the original Plan template-create command',()=>{
 assert.equal(api.planTemplateCommandMaxBytes,500000);assert.equal(api.planTemplateResultMaxBytes,1800000);assert.equal(api.planTemplateListMaxBytes,100000);assert.equal(api.planTemplateCursorMaxBytes,512);
 const original={schemaVersion:1,action:'create_draft_v1',requestId,kind:'care_plan',templateVersionId:versionId};
 assert.deepEqual(readPlanCommand(original),original);assert.throws(()=>call('readPlanTemplateCommand',original),/invalid_input/);
});
for(const extra of [{clientId:id},{actorId:id},{owner:true},{rpc:'other'},{url:'https://example.com'},{taskGrantId:id},{approved:true}])test('no template caller selector or authority '+Object.keys(extra)[0],()=>assert.throws(()=>call('readPlanTemplateCommand',{...create(),...extra}),/invalid_input/));
test('incomplete generic content saves without adding context, review or preparation',()=>{
 const parsed=call('readPlanTemplateCommand',create());assert.deepEqual(parsed,create());assert.deepEqual(parsed.content.context,{products:{state:'unknown'},facts:[]});
});
for(const change of [c=>c.context.products={state:'none',factId:'fact'},c=>c.context.products={state:'recorded',productIds:[]},c=>c.context.facts=[{id:'fact',kind:'client_report',visibility:'client',text:'private',sources:[],contradicts:[]}],c=>c.consultationSections=[{title:'private',body:'consultation'}],c=>c.preparation.by='author',c=>c.preparation.on='2026-11-03'])test('generic templates reject client context/preparation instead of stripping '+change.toString(),()=>{
 const command=create();change(command.content);assert.throws(()=>call('readPlanTemplateCommand',command),/invalid_input/);
});
test('private Source locations, approval and clinical authoring metadata are not generic template fields',()=>{
 for(const extra of [{sourceId:id},{review:{approved:true}},{approvalId:id},{basis:{hash:'a'.repeat(64)}},{consent:true}])assert.throws(()=>call('readPlanTemplateCommand',{...create(),content:{...content(),...extra}}),/invalid_input/);
});
const product=()=>({id:'product',name:'generic product',brand:null,variant:null,sizeLabel:'',productUrl:null,imageUrl:null,reference:null,displayPrice:null,strength:{state:'unknown'},category:{state:'unknown'},identity:'unresolved',formula:'unknown',factIds:[],guides:[],evidence:[]});
const decision=()=>({id:'decision',slotId:'slot',recommendationId:null,kind:'addition',goalIds:[],currentProductIds:[],primaryProductId:'product',alternativeProductIds:[],reason:'',directions:[],cautions:[],limitations:[],schedule:null,factIds:[],guidance:{title:'',subtitle:'',rationaleTitle:'',reasons:[],actions:[],comparisons:[],factsTitle:'',facts:[],how:null,sources:[],group:null,decisionLabels:null}});
test('generic products/decisions remain incomplete but cannot carry client confirmation or legacy recommendation identity',()=>{
 const c=content();c.products=[product()];c.decisions=[decision()];assert.deepEqual(call('readPlanTemplateContent',c),c);
 for(const mutate of [v=>v.products[0].identity='client_confirmed',v=>v.decisions[0].recommendationId='legacy-recommendation',v=>v.decisions[0].currentProductIds=['product'],v=>v.products[0].factIds=['private-fact']]){
  const bad=structuredClone(c);mutate(bad);assert.throws(()=>call('readPlanTemplateContent',bad),/invalid_input/);
 }
});
test('same schema denies code/private URLs and invalid content references',()=>{
 for(const c of [{...content(),summary:'<script>bad</script>'},{...content(),sources:[{label:'bad',url:'javascript:bad'}]},{...content(),goals:[{id:'goal',text:'',factIds:['missing']}]}])assert.throws(()=>call('readPlanTemplateContent',c),/invalid_input/);
});
test('name/page/cursor domains are bounded without lossy Unicode replacement',()=>{
 assert.equal(call('readPlanTemplateCommand',{...create(),name:'🧴'.repeat(200)}).name,'🧴'.repeat(200));
 for(const name of ['', ' ', 'a'.repeat(201),'\ud800'])assert.throws(()=>call('readPlanTemplateCommand',{...create(),name}),/invalid_input/);
 for(let limit=1;limit<=100;limit++)assert.equal(call('readPlanTemplateCommand',{...list(),limit}).limit,limit);
 for(const limit of [0,101,1.5])assert.throws(()=>call('readPlanTemplateCommand',{...list(),limit}),/invalid_input/);
 for(const cursor of ['é'.repeat(257),'next\n','\ud800'])assert.throws(()=>call('readPlanTemplateCommand',{...list(),cursor}),/invalid_input/);
 assert.equal(call('readPlanTemplateCommand',{...list(),cursor:'é'.repeat(256)}).cursor,'é'.repeat(256));
});
test('catalog/latest and immutable version history are explicit correlated paginated scopes',()=>{
 assert.deepEqual(call('mapPlanTemplateResult',page(),list()),page());
 const scope={kind:'versions',templateId:id};assert.deepEqual(call('mapPlanTemplateResult',page(scope),list(scope)),page(scope));
 assert.throws(()=>call('mapPlanTemplateResult',page(),list(scope)),/unavailable/);
 assert.throws(()=>call('readPlanTemplateCommand',{...list(),scope:{kind:'versions',templateId:id,clientId:id}}),/invalid_input/);
 assert.throws(()=>call('mapPlanTemplateResult',{...page(),count:1},list()),/unavailable/);
});
test('metadata pages enforce ordering, unique actual IDs, limits and cursor progress, never infer total',()=>{
 for(const delta of [{entries:[metadata(),metadata()]},{entries:[],nextCursor:'next'},{nextCursor:'same'},{entries:[{...metadata(),createdAt:'2026-11-04T00:00:00Z'}]}])assert.throws(()=>call('mapPlanTemplateResult',{...page(),...delta},{...list(),cursor:'same'}),/unavailable/);
 const scope={kind:'versions',templateId:id};const entries=[{...metadata(3),templateVersionId:requestId},metadata(1)];
 assert.deepEqual(call('mapPlanTemplateResult',{...page(scope),entries},list(scope)).entries,entries);
 assert.throws(()=>call('mapPlanTemplateResult',{...page(scope),entries:[...entries].reverse()},list(scope)),/unavailable/);
 assert.throws(()=>call('mapPlanTemplateResult',{...page(scope),entries:[{...metadata(),templateId:actorId}]},list(scope)),/unavailable/);
});
test('immutable version preview binds the requested actual version ID and rejects private fields',()=>{
 const command={schemaVersion:1,action:'read_plan_template_version_v1',templateVersionId:versionId};assert.deepEqual(call('mapPlanTemplateResult',version(),command),version());
 for(const v of [{...version(),templateVersionId:id},{...version(),privateNotes:'private'},{...version(),versionHash:'x'.repeat(64)}])assert.throws(()=>call('mapPlanTemplateResult',v,command),/unavailable/);
});
test('create/append receipts bind the full accepted name/content/request/action and exact version',()=>{
 for(const command of [create(),save()]){
  assert.deepEqual(call('mapPlanTemplateResult',receipt(command),command),receipt(command));
  for(const delta of [{requestId:id},{action:'other'},{version:{...receipt(command).version,version:99}},{version:{...receipt(command).version,name:'other'}},{version:{...receipt(command).version,content:{...content(),summary:'other'}}}])assert.throws(()=>call('mapPlanTemplateResult',{...receipt(command),...delta},command),/unavailable/);
 }
 assert.throws(()=>call('mapPlanTemplateResult',{...receipt(save()),version:{...version(4),templateId:actorId}},save()),/unavailable/);
});
test('append rejects unsafe current-version arithmetic without inventing a head',()=>{
 for(const expectedVersion of [0,Number.MAX_SAFE_INTEGER,-1,1.5])assert.throws(()=>call('readPlanTemplateCommand',{...save(),expectedVersion}),/invalid_input/);
});
test('new actor-own status validates exact original+historical receipt and never becomes a current-head claim',()=>{
 const command={schemaVersion:1,action:'plan_template_request_status_v1',requestId};
 const absent={schemaVersion:1,status:'absent',requestId};assert.deepEqual(call('mapPlanTemplateResult',absent,command),absent);
 const committed={schemaVersion:1,status:'committed',requestId,original:save(),receipt:receipt(save())};assert.deepEqual(call('mapPlanTemplateResult',committed,command),committed);
 for(const change of [v=>v.original.requestId=id,v=>v.receipt.requestId=id,v=>v.receipt.version.content.summary='other',v=>v.currentVersion=4,v=>v.original.action='create_draft_v1']){
  const v=structuredClone(committed);change(v);assert.throws(()=>call('mapPlanTemplateResult',v,command),/unavailable/);
 }
 assert.throws(()=>call('mapPlanTemplateResult',{schemaVersion:1,status:'tombstoned',requestId},command),/unavailable/);
});
test('input getters/cycles/sparse arrays cannot supply JSON or run getters, and outputs are detached frozen values',()=>{
 let reads=0;const v=create();Object.defineProperty(v,'name',{enumerable:true,get(){reads++;return 'bad';}});
 assert.throws(()=>call('readPlanTemplateCommand',v),/invalid_input/);assert.equal(reads,0);
 const cyc=create();cyc.content.context=cyc;assert.throws(()=>call('readPlanTemplateCommand',cyc),/invalid_input/);
 const sparse=create();sparse.content.goals=Array(1);assert.throws(()=>call('readPlanTemplateCommand',sparse),/invalid_input/);
 const input=create(),parsed=call('readPlanTemplateCommand',input);input.content.title='changed';assert.equal(parsed.content.title,'generic routine');assert.equal(Object.isFrozen(parsed.content.sources[0]),true);
});
test('complete original+receipt replay has its own bound and legacy-family metadata pages remain 100K',()=>{
 const c=create();c.content.followUp.authoredNotes=Array(50).fill('a'.repeat(3500));
 const r={schemaVersion:1,requestId,action:c.action,version:{...version(),content:c.content}};
 const value={schemaVersion:1,status:'committed',requestId,original:c,receipt:r};const command={schemaVersion:1,action:'plan_template_request_status_v1',requestId};
 assert.deepEqual(call('mapPlanTemplateResult',value,command),value);
 const huge=create();huge.content.followUp.authoredNotes=Array(50).fill('🧴'.repeat(4000));assert.throws(()=>call('readPlanTemplateCommand',huge),/invalid_input/);
});
test('full replay of accepted structured content is not truncated by another family node ceiling',()=>{
 const c=create();c.content.products=Array.from({length:50},(_,i)=>({...product(),id:'p'+i,guides:Array.from({length:23},(_,j)=>({id:'g'+i+'_'+j,productId:'p'+i,title:'',intro:'',steps:Array.from({length:12},()=>({title:null,body:''})),careNote:null,sources:[]}))}));
 const count=v=>v!==null&&typeof v==='object'?1+Object.values(v).reduce((n,x)=>n+count(x),0):1;
 const r={schemaVersion:1,requestId,action:c.action,version:{...version(),content:c.content}};
 const value={schemaVersion:1,status:'committed',requestId,original:c,receipt:r};
 assert.ok(new TextEncoder().encode(JSON.stringify(c)).byteLength<=500000);assert.ok(count(value)>100000);assert.deepEqual(call('readPlanTemplateCommand',c),c);
 assert.deepEqual(call('mapPlanTemplateResult',value,{schemaVersion:1,action:'plan_template_request_status_v1',requestId}),value);
});
test('bounded Unicode/name roundtrips preserve exact accepted payloads and frozen detachment',()=>{
 for(const scalar of ['a','é','€','🧴'])for(const length of [1,2,99,199,200]){
  const input={...create(),name:scalar.repeat(length)},first=call('readPlanTemplateCommand',input),second=call('readPlanTemplateCommand',JSON.parse(JSON.stringify(first)));
  assert.deepEqual(first,input);assert.deepEqual(second,first);assert.notEqual(first.content,input.content);assert.equal(Object.isFrozen(second.content),true);
 }
 assert.equal(api.planTemplateVersionHashDomain,'plan_template_version_v1');
});
