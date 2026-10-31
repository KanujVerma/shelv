import assert from 'node:assert/strict';
import test from 'node:test';
import {parseCommand,PORTAL_ORIGIN,SUPABASE_ORIGIN,type Channel,type Operation} from '../server/policy';
import {parseClientCommand} from '../server/client-policy';
import {SupabaseProvider} from '../server/upstream';
import {ClientProvider} from '../server/client-upstream';
import clientGateway,{advisorGateway,type GatewayEnv} from '../server/gateway';
import {SessionVault} from '../server/session-vault';
import {CredentialEnvelope} from '../server/credential-envelope';
import type {SessionRecord} from '../server/types';
import * as metadata from '../../../site/auth/review-actions.js';
import {reviewClientActions,reviewHumanActions,guidanceHumanActions,reviewReadActions,guidanceReadActions,reviewErrorStatuses,portalReviewAccess} from '../../../../../src/contracts/PortalReviewValues.ts';
import {readReviewCommand,readGuidanceCommand} from '../../../../../src/contracts/PortalReviewValidation.ts';
import {createReviewPorts} from '../../../../../supabase/functions/concierge-reviews/runtime.ts';
import {createGuidancePorts} from '../../../../../supabase/functions/concierge-guidance/runtime.ts';
import {handleReviewRequest} from '../../../../../supabase/functions/concierge-reviews/handler.ts';
import {handleGuidanceRequest} from '../../../../../supabase/functions/concierge-guidance/handler.ts';

// Source/API component proof. All fetches are finite synthetic functions; no listeners or DO runtime.
const owner='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222',requestId='33333333-3333-4333-8333-333333333333';
const publication={version:1,documentSchemaVersion:3};
const snapshot={publication,currentPublication:publication,useHead:0,reportHead:0,instructionHead:0,serviceRevision:0,decisionRevision:0,asOfDay:'2026-10-31',manifestHash:'a'.repeat(64)};
const target={draftId:id,clientId:owner,kind:'review',revision:1,contentHash:'a'.repeat(64),basisHash:'b'.repeat(64)};
const basis={schemaVersion:1,publication,legacyBasis:{publicationVersion:1,useRevision:0},legacyBasisManifestHash:'c'.repeat(64),useHead:0,reportHead:0,instructionHead:0,references:[],sourceManifest:{schemaVersion:1,count:0,hash:'d'.repeat(64)}};
const body={kind:'review',publication,reportRefs:[],occurredOn:{state:'unknown'},channel:'call',clientReport:'',conclusion:'',rationale:'',changes:[],nextStep:'',nextReviewOn:null};
const status={schemaVersion:1,action:'request_status_v1',requestId};
const submit={schemaVersion:1,action:'submit_goal_report_v1',requestId,expectedReportRevision:0,occurredOn:{state:'unknown'},body:{publication,answers:[],comfort:null,notes:null,actualUseEventIds:[],photoIds:[]}};
const history={schemaVersion:1,action:'read_care_history_v1',version:null,cursor:null,limit:10};
const conversation={schemaVersion:1,action:'record_conversation_v1',requestId,clientId:owner,expectedReportRevision:0,body:{publication,occurredOn:{state:'unknown'},channel:'call',clientReported:[],advisorConclusions:[],agentProposals:[],contradictions:[]}};
const reviewCommands=[submit,{schemaVersion:1,action:'amend_report_v1',requestId,expectedReportRevision:0,event:{kind:'goal_report',id},expectedAmendmentHeadId:null,replacement:{kind:'goal_report',body:submit.body},occurredOn:{state:'unknown'},reason:'correction'},conversation,{schemaVersion:1,action:'append_private_review_note_v1',requestId,clientId:owner,reviewEvent:{kind:'goal_report',id},note:'private synthetic note'},history,{...history,action:'read_advisor_care_history_v1',clientId:owner},status,{schemaVersion:1,action:'read_client_plan_v3',version:null},{schemaVersion:1,action:'read_advisor_publication_v3',clientId:owner,version:null},{schemaVersion:1,action:'read_advisor_reported_products_v1',clientId:owner,cursor:null,limit:100,expectedUseRevision:0,publicationVersion:null},{schemaVersion:1,action:'read_client_instruction_manifest_v1',snapshot,cursor:null,limit:100},{schemaVersion:1,action:'read_advisor_instruction_manifest_v1',clientId:owner,snapshot,cursor:null,limit:100},{schemaVersion:1,action:'read_client_instruction_v1',snapshot,instructionId:id,version:1,contentHash:'a'.repeat(64)},{schemaVersion:1,action:'read_advisor_instruction_v1',clientId:owner,snapshot,instructionId:id,version:1,contentHash:'a'.repeat(64)},{schemaVersion:1,action:'record_decision_v2',requestId,expectedDecisionRevision:0,publicationVersion:1,decisionId:'decision',choice:'approved',reason:null,snapshot}];
const guidanceCommands=[{schemaVersion:1,action:'create_guidance_draft_v1',requestId,clientId:owner,body},{schemaVersion:1,action:'read_guidance_draft_v1',draftId:id},{schemaVersion:1,action:'save_guidance_draft_v1',requestId,target,body},{schemaVersion:1,action:'rebase_guidance_draft_v1',requestId,target,expectedBasis:basis},{schemaVersion:1,action:'review_guidance_v1',requestId,target},{schemaVersion:1,action:'approve_guidance_v1',requestId,target,publisher:{kind:'human',actorId:owner},scope:'review.publish'},{schemaVersion:1,action:'publish_guidance_v1',requestId,target,approvalId:id,publisher:{kind:'human',actorId:owner}},{schemaVersion:1,action:'revoke_guidance_approval_v1',requestId,approvalId:id,expectedPolicyRevision:1},status];
const view={view:true,edit:false,publish:false,confirmPayments:false},edit={...view,edit:true},all={...edit,publish:true};
const credentials={access_token:'synthetic-review-access',refresh_token:'synthetic-review-refresh',expires_at:9999999999,user:{id:owner},providerSessionId:id};
const channel=(s:string)=>s as Channel;
const rejects=(run:()=>unknown,s:number)=>assert.throws(run,e=>(e as {status?:number}).status===s);
const op=(family:string,command:unknown,client=false)=>client?parseClientCommand(channel(family),command):parseCommand(channel(family),command);
const err=(s:number,code?:string)=>(e:unknown)=>(e as {status?:number}).status===s&&(!code||(e as {code?:string}).code===code);

test('new metadata exactly matches canonical eight/eight/nine actions, reads and22 errors',()=>{
 assert.deepEqual(metadata.clientReviewActions,reviewClientActions);
 assert.deepEqual(metadata.advisorReviewActions,reviewHumanActions);
 assert.deepEqual(metadata.advisorGuidanceActions,guidanceHumanActions);
 assert.deepEqual(metadata.advisorReviewReads,reviewHumanActions.filter(a=>(reviewReadActions as readonly string[]).includes(a)));
 assert.deepEqual(metadata.advisorGuidanceReads,guidanceReadActions);
 assert.deepEqual(metadata.reviewErrorCodes,Object.keys(reviewErrorStatuses));
 assert.deepEqual([reviewClientActions.length,reviewHumanActions.length,guidanceHumanActions.length,Object.keys(reviewErrorStatuses).length],[8,8,9,22]);
 assert.equal(metadata.REVIEW_COMMAND_MAX_BYTES,500000);
});
test('actual retained parsers admit only canonical family/audience commands with strict fields',()=>{
 for(const raw of reviewCommands){const command=readReviewCommand(raw);for(const client of [false,true]){
  const allowed=(client?reviewClientActions:reviewHumanActions) as readonly string[];
  if(allowed.includes(command.action))assert.deepEqual(op('reviews',raw,client),{kind:'command',channel:'reviews',command});
  else rejects(()=>op('reviews',raw,client),403);
 }}
 for(const raw of guidanceCommands){const command=readGuidanceCommand(raw);assert.deepEqual(op('guidance',raw),{kind:'command',channel:'guidance',command});rejects(()=>op('guidance',raw,true),403);if(raw.action!=='request_status_v1')rejects(()=>op('reviews',raw),400);}
});
test('unknown routes/actions/schema and owner/role/RPC fields fail before provider egress',()=>{
 for(const raw of [null,{},[],{...status,action:'read_unknown_v1'},{...status,schemaVersion:2},{...status,clientId:owner},{...status,role:'owner'},{...status,rpc:'other'},{...status,ownerId:owner},{...history,limit:''},{...history,limit:'10'},{...history,limit:0}])rejects(()=>op('reviews',raw,true),400);
 for(const extra of [{actorId:owner},{approved:true},{sourcePermission:true},{headers:{}},{clientId:id}])rejects(()=>op('guidance',{...guidanceCommands[2],...extra}),400);
 rejects(()=>op('unrecognized',status),403);
 for(const family of ['review','guidance'] as const)for(const command of family==='review'?reviewCommands:guidanceCommands)assert.equal(portalReviewAccess(family,command.action,'task_agent'),'DENY');
});
test('safe view and private edit/publish capability gates follow actual SQL before egress',async()=>{
 let calls=0;const provider=new SupabaseProvider('sb_publishable_synthetic',async()=>{calls++;return Response.json({});});
 for(const raw of reviewCommands.filter(c=>(reviewHumanActions as readonly string[]).includes(c.action))){
  const operation=op('reviews',raw),needed=['record_conversation_v1','append_private_review_note_v1','read_advisor_care_history_v1'].includes(raw.action)?'edit':'view';
  const before=calls;await assert.rejects(provider.perform(credentials,needed==='edit'?view:{...view,view:false},operation),err(403));assert.equal(calls,before);
  await assert.rejects(provider.perform(credentials,edit,operation),err(503));assert.equal(calls,before+1);
 }
 for(const raw of guidanceCommands){const operation=op('guidance',raw),before=calls;
  await assert.rejects(provider.perform(credentials,view,operation),err(403));assert.equal(calls,before);
  if(raw.action==='publish_guidance_v1'){await assert.rejects(provider.perform(credentials,edit,operation),err(403));await assert.rejects(provider.perform(credentials,{...view,publish:true},operation),err(403));assert.equal(calls,before);}
  await assert.rejects(provider.perform(credentials,all,operation),err(503));assert.equal(calls,before+1);
 }
});
test('actual provider -> reviewed handler/runtime uses fixed RPC with public apikey and original caller bearer',async()=>{
 for(const [family,create,handle,rpc] of [['reviews',createReviewPorts,handleReviewRequest,'concierge_review_command_v1'],['guidance',createGuidancePorts,handleGuidanceRequest,'concierge_guidance_command_v1']] as const){
  const seen:string[]=[],publicKey='sb_publishable_synthetic';
  const ports=create({supabaseUrl:SUPABASE_ORIGIN,publicKey,allowedOrigins:[PORTAL_ORIGIN],fetch:async(input,init)=>{
   const url=String(input);seen.push(url);assert.equal(new Headers(init?.headers).get('apikey'),publicKey);assert.equal(new Headers(init?.headers).get('authorization'),'Bearer '+credentials.access_token);
   if(url===SUPABASE_ORIGIN+'/auth/v1/user')return Response.json({id:owner,is_anonymous:false});
   assert.equal(url,SUPABASE_ORIGIN+'/rest/v1/rpc/'+rpc);assert.deepEqual(JSON.parse(String(init?.body)),{p_command:status});return Response.json({status:'absent'});
  }});
  const provider=new SupabaseProvider(publicKey,async(input,init)=>{assert.equal(String(input),SUPABASE_ORIGIN+'/functions/v1/concierge-'+family);return handle(new Request(String(input),init),ports as never);});
  assert.deepEqual(await provider.perform(credentials,all,op(family,status)),{status:200,body:{status:'absent'}});
  assert.deepEqual(seen,[SUPABASE_ORIGIN+'/auth/v1/user',SUPABASE_ORIGIN+'/rest/v1/rpc/'+rpc]);
 }
});
test('malformed success is unavailable for reads and uncertain for writes; current exact failure namespace survives',async()=>{
 let data:unknown={},http=200;const provider=new ClientProvider('sb_publishable_synthetic',async()=>Response.json(data,{status:http}));
 for(const command of [status,submit])await assert.rejects(provider.perform(credentials,view,op('reviews',command,true)),err(503,command===status?'unavailable':'uncertain'));
 for(const [code,httpStatus] of Object.entries(reviewErrorStatuses)){data={code};http=httpStatus;await assert.rejects(provider.perform(credentials,view,op('reviews',status,true)),err(httpStatus,httpStatus===503?'unavailable':code));}
 for(const code of ['concierge_guidance_conflict','other_content_version_required','concierge_private_sql','CONCIERGE_content_version_required']){data={code};http=409;await assert.rejects(provider.perform(credentials,view,op('reviews',status,true)),err(409,'unavailable'));}
 data={code:'concierge_content_version_required'};await assert.rejects(provider.perform(credentials,view,op('reviews',status,true)),err(409,'content_version_required'));
});
test('private extras, wrong owner/version and cross-family receipt never cross actual client provider',async()=>{
 const read={schemaVersion:1,action:'read_client_plan_v3',version:null};
 const preparation={schemaVersion:3,access:'preparation',plan:null,decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null,use:{revision:0,planProducts:[],reportedProducts:{items:[],nextCursor:null}},latestPublicReview:null,currentGuidance:null,decisionGuidance:[]};
 let data:unknown=preparation;const provider=new ClientProvider('sb_publishable_synthetic',async()=>Response.json(data));
 assert.deepEqual((await provider.perform(credentials,view,op('reviews',read,true))).body,preparation);
 for(const extra of ['private_note','conversation','legacy_review_note','rawSourceManifest']){data={...preparation,[extra]:'PRIVATE_REVIEW_CANARY'};await assert.rejects(provider.perform(credentials,view,op('reviews',read,true)),err(503));}
 data={status:'committed',receipt:{requestId,approvalId:id,revokedBy:owner,revokedAt:'2026-10-31T00:00:00Z',policyRevision:1}};await assert.rejects(provider.perform(credentials,view,op('reviews',status,true)),err(503));
 const advisorRead={schemaVersion:1,action:'read_advisor_reported_products_v1',clientId:owner,cursor:null,limit:1,expectedUseRevision:0,publicationVersion:null};
 data={revision:1,items:[],nextCursor:null};const advisor=new SupabaseProvider('sb_publishable_synthetic',async()=>Response.json(data));await assert.rejects(advisor.perform(credentials,view,op('reviews',advisorRead)),err(503));
});
function fakeGateway(){const calls:unknown[]=[];let value:unknown={status:'absent'};const env={PORTAL_ORIGIN,CLIENT_SHARED_SESSIONS:'true',ADVISOR_SESSIONS:{getByName:(name:string)=>({invoke:async(command:unknown)=>{calls.push({name,command});return {ok:true,value:{status:200,body:value}};}})},ASSETS:{fetch:()=>assert.fail('no API asset fallback')}} as unknown as GatewayEnv;return {env,calls,set:(v:unknown)=>value=v};}
function request(audience:string,family:string,wire:string,headers:Record<string,string>={}){return new Request(PORTAL_ORIGIN+'/api/'+audience+'/'+family,{method:'POST',headers:{origin:PORTAL_ORIGIN,'content-type':'application/json','x-shelv-csrf':'synthetic-csrf',cookie:'__Host-shelv_'+audience+'='+'x'.repeat(43),...headers},body:wire});}
test('three fixed routes use existing audience namespace/Vault operation and revalidate results at cookie boundary',async()=>{
 const f=fakeGateway();for(const [audience,family,gateway] of [['client','reviews',clientGateway],['advisor','reviews',advisorGateway],['advisor','guidance',advisorGateway]] as const){
  const response=await gateway.fetch(request(audience,family,JSON.stringify(status)),f.env);assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:'absent'});assert.match(response.headers.get('cache-control')??'',/private, no-store/);
  const call=f.calls.at(-1) as {name:string;command:{audience?:string;type:string;csrf:string;operation:Operation}};assert.match(call.name,audience==='client'?/^client:session:/:/^session:/);assert.equal(call.command.type,'session.execute');assert.equal(call.command.csrf,'synthetic-csrf');assert.deepEqual(call.command.operation,{kind:'command',channel:family,command:status});
  f.set({status:'absent',private_note:'PRIVATE_COOKIE_CANARY'});const malformed=await gateway.fetch(request(audience,family,JSON.stringify(status)),f.env);assert.equal(malformed.status,503);f.set({status:'absent'});
 }
 const before=f.calls.length;assert.equal((await clientGateway.fetch(request('client','guidance',JSON.stringify(status)),f.env)).status,404);assert.equal(f.calls.length,before);
});
test('new JSON request budgets are500000 UTF8 while legacy100000 and multipart boundaries remain',async()=>{
 const f=fakeGateway();for(const [audience,family,gateway] of [['client','reviews',clientGateway],['advisor','reviews',advisorGateway],['advisor','guidance',advisorGateway]] as const){
  const wire=JSON.stringify(status),exact=wire+' '.repeat(500000-Buffer.byteLength(wire));
  assert.equal((await gateway.fetch(request(audience,family,exact),f.env)).status,200);
  const before=f.calls.length;assert.equal((await gateway.fetch(request(audience,family,exact+' '),f.env)).status,413);assert.equal((await gateway.fetch(request(audience,family,wire+'é'.repeat(250000)),f.env)).status,413);assert.equal(f.calls.length,before);
  assert.equal((await gateway.fetch(request(audience,family,wire,{'content-type':'multipart/form-data; boundary=synthetic'}),f.env)).status,415);
 }
 assert.equal((await advisorGateway.fetch(request('advisor','operations',' '.repeat(100001)),f.env)).status,413);
});
test('origin, CSRF, audience and unknown request fields deny before any Vault operation',async()=>{
 const f=fakeGateway();for(const headers of [{origin:'https://other.invalid'},{'x-shelv-csrf':''},{'sec-fetch-site':'same-site'},{cookie:''}]){const r=await advisorGateway.fetch(request('advisor','reviews',JSON.stringify(status),headers),f.env);assert.ok([401,403].includes(r.status));}
 for(const raw of [{...status,role:'admin'},{...status,clientId:owner},{...status,schemaVersion:9}])assert.equal((await clientGateway.fetch(request('client','reviews',JSON.stringify(raw)),f.env)).status,400);
 assert.equal(f.calls.length,0);
});
test('provider2M response bound still contains domain1.8M and400k page limits',async()=>{
 for(const bytes of [400001,1800001,2000001]){const p=new ClientProvider('sb_publishable_synthetic',async()=>new Response(JSON.stringify({padding:'x'.repeat(bytes)})));await assert.rejects(p.perform(credentials,view,op('reviews',history,true)),err(503,'unavailable'));}
});
test('existing Vault execute retains CSRF/current context and held logout fences with new operations',async()=>{
 let record:SessionRecord|null=null,enabled=true;const caps=all;
 const auth={context:async()=>{assert.ok(enabled);return {ownerId:owner,providerSessionId:id,capabilities:caps};},refresh:async()=>credentials,logout:async()=>{}};
 const vault=new SessionVault({read:()=>record,write:r=>{record=r;}},new CredentialEnvelope(JSON.stringify({active:'test',keys:{test:Buffer.alloc(32,7).toString('base64url')}}),'session:review-guidance'),auth,{now:()=>1800000000000,idleMs:3600000,absoluteMs:28800000,recheckContext:true});
 const initial=await vault.initialize(credentials,'synthetic-grant');let calls=0;
 await assert.rejects(vault.execute('wrong',async()=>{calls++;return {};}),err(403));assert.equal(calls,0);
 let enter!:()=>void,release!:()=>void;const entered=new Promise<void>(r=>enter=r),held=new Promise<void>(r=>release=r);
 const pending=vault.execute(initial.csrf,async()=>{calls++;enter();await held;return {status:'absent'};});const rejected=assert.rejects(pending,err(401));await entered;await vault.logout(initial.csrf);release();await rejected;
 assert.equal(record?.status,'revoked');assert.equal(record?.credentials,null);
});
