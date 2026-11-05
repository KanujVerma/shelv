// Opt-in genuine local Auth -> unmodified native Edge -> PostgREST -> canonical SQL.
// No hosted target, browser identity substitution, synthetic JWT or real payment.
import assert from 'node:assert/strict';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {randomUUID,randomBytes} from 'node:crypto';
import path from 'node:path';
import {preparePortalAdmissionFixture} from '../apps/portal/scripts/local-admission.mjs';
import {validateRuntimeLineage} from '../apps/portal/scripts/local-admission-lineage.mjs';
import {createEmptyPlanContent} from '../src/contracts/PortalRebuild.ts';
import {readPlanCommand} from '../src/contracts/PortalRebuildValidation.ts';
import {mapPlanResult} from '../src/contracts/PortalRebuildMapping.ts';
import {buildPaymentCallV2,mapPaymentReceiptV2,mapPaymentViewV2} from '../supabase/functions/concierge-payments/methods.ts';

assert.equal(process.env.SHELV_PLAN_AUTH_NATIVE,'1','Explicit disposable local verification opt-in required');
assert.ok(process.env.SHELV_PLAN_AUTH_FIXTURE_DIR&&process.env.SHELV_PLAN_AUTH_OWNER_FILE,'Select the owned fixture and its synthetic owner identity file');
const fixture=await preparePortalAdmissionFixture(process.cwd(),process.env.SHELV_PLAN_AUTH_FIXTURE_DIR),{directory,projectId,manifest}=fixture;
assert.equal(fixture.migrationCount,55);
const config=JSON.parse(await readFile(path.join(directory,'status.private.json'),'utf8'));
assert.equal(config.API_URL,'http://127.0.0.1:57421');
const ownerFile=path.resolve(process.env.SHELV_PLAN_AUTH_OWNER_FILE);assert.ok(ownerFile.startsWith(directory+path.sep));assert.equal((await stat(ownerFile)).mode&0o077,0);
const ownerIdentity=JSON.parse(await readFile(ownerFile,'utf8'));assert.match(ownerIdentity.id,/^[0-9a-f-]{36}$/);
const helpers=JSON.parse(await readFile(path.join(directory,'edge/HELPERS.json'),'utf8'));assert.equal(helpers.ownerId,manifest.ownerId);assert.equal(helpers.endpoint,'http://127.0.0.1:57440');
const env={...process.env,DOCKER_HOST:'unix:///Users/kanuj/.colima/shelv-portal-20261024/docker.sock'};delete env.DOCKER_CONTEXT;
const docker=(...args)=>execFileSync('docker',args,{env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const db='supabase_db_'+projectId,labels=JSON.parse(docker('inspect',db,'--format','{{json .Config.Labels}}'));
assert.equal(labels['com.supabase.cli.project'],projectId);assert.equal(labels['com.supabase.cli.workdir'],directory);
assert.equal(JSON.parse(docker('inspect',helpers.edge))[0].Config.Labels['shelv.fixture.owner'],manifest.ownerId);
const sql=s=>execFileSync('docker',['exec','-i',db,'psql','-U','postgres','-d','postgres','-X','-At','-v','ON_ERROR_STOP=1'],{input:s,env,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const binding=JSON.parse(await readFile(path.join(directory,'RUNTIME-BINDING.json'),'utf8'));
assert.deepEqual(JSON.parse(sql('select payload from public.shelv_portal_fixture_attestation where singleton')),binding);
const ledger=JSON.parse(sql("select coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name,'statements',statements) order by version),'[]'::jsonb) from supabase_migrations.schema_migrations"));
validateRuntimeLineage(manifest,ledger,binding);
assert.equal(sql('select owner_actor_id from concierge.plan_policy where singleton'),ownerIdentity.id,'Only the explicitly bootstrapped synthetic owner is allowed');
const require=createRequire(new URL('../apps/portal/package.json',import.meta.url)),{GoTrueClient}=require('@supabase/auth-js');
const auth=key=>new GoTrueClient({url:config.API_URL+'/auth/v1',headers:{apikey:key,Authorization:'Bearer '+key},persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,skipAutoInitialize:true,debug:false});
const admin=auth(config.SERVICE_ROLE_KEY),sessions=[],closedSessions=new Set(),identities=[ownerIdentity],checks=[];
const pass=label=>checks.push({label,status:'PASS'}),id=()=>randomUUID();
async function signIn(identity){const r=await auth(config.ANON_KEY).signInWithPassword({email:identity.email,password:identity.password});assert.equal(r.error,null);assert.equal(r.data.user.id,identity.id);sessions.push(r.data.session.access_token);return {...identity,token:r.data.session.access_token};}
async function create(kind){const identity={email:'native-plan-'+id()+'@example.invalid',password:randomBytes(32).toString('hex')};const r=await admin.admin.createUser({...identity,email_confirm:true});assert.equal(r.error,null);identity.id=r.data.user.id;identities.push(identity);
 sql(`insert into public.profiles(id) values('${identity.id}') on conflict do nothing;`);
 if(kind==='client')sql(`insert into concierge.cases(client_id) values('${identity.id}');insert into concierge.enrollments(client_id,display_name,status) values('${identity.id}','Synthetic native plan client','active');`);
 else sql(`insert into concierge.plan_principals(actor_id,kind) values('${identity.id}','agent');`);
 return signIn(identity);}
async function edge(actor,input,want=200){const command=readPlanCommand({schemaVersion:1,...input}),r=await fetch(helpers.endpoint+'/',{method:'POST',redirect:'error',headers:{origin:'https://portal.goshelv.com','content-type':'application/json',...(actor?{authorization:'Bearer '+actor.token}:{} )},body:JSON.stringify(command)}),value=await r.json();assert.equal(r.status,want,input.action+': '+value.code);if(['read_client_plan_v1','read_advisor_gate_v1','read_advisor_publication_v1'].includes(input.action)||want!==200)assert.ok(!JSON.stringify(value).includes('PRIVATE_REAL_AUTH_CANARY'));return want===200?mapPlanResult(value,command):value;}
async function pay(actor,input){const call=buildPaymentCallV2({schemaVersion:2,...input},actor.id);assert.ok(['concierge_payment_write_v2','concierge_payment_view_v2'].includes(call.name));const r=await fetch(config.API_URL+'/rest/v1/rpc/'+call.name,{method:'POST',redirect:'error',headers:{apikey:config.ANON_KEY,authorization:'Bearer '+actor.token,'content-type':'application/json'},body:JSON.stringify(call.args)}),value=await r.json();assert.equal(r.status,200,input.action+': '+value.code);return call.name==='concierge_payment_view_v2'?mapPaymentViewV2(value):mapPaymentReceiptV2(value,call);}
async function review(owner,view){for(const section of view.sections)await edge(owner,{action:'review_section_v1',requestId:id(),draftId:view.draft.id,expectedContentRevision:view.draft.contentRevision,expectedAssignmentRevision:view.draft.assignmentRevision,sectionId:section.sectionId,sectionHash:section.sectionHash});return edge(owner,{action:'read_draft_v1',draftId:view.draft.id});}
const result={kind:'genuine-local-auth-native-edge-postgrest',projectId,migrationCount:55,checks,hostedRequests:0,realEmails:0,realFunds:0};
try{
 const owner=await signIn(ownerIdentity),client=await create('client'),other=await create('client'),agent=await create('agent');
 await writeFile(path.join(directory,'PLAN-IDENTITIES.private.json'),JSON.stringify({owner:ownerIdentity,client:identities.find(x=>x.id===client.id),other:identities.find(x=>x.id===other.id),agent:identities.find(x=>x.id===agent.id)},null,2)+'\n',{mode:0o600});
 assert.equal((await edge(owner,{action:'read_policy_v1'})).ownerActorId,owner.id);pass('Real password sessions and unchanged native production Edge reach the current canonical policy');
 await edge(null,{action:'read_client_plan_v1',version:null},401);await edge(client,{action:'read_draft_v1',draftId:id()},403);pass('Anonymous and ordinary client advisor operations are denied by the actual service');
 const usersBefore=sql('select count(*) from auth.users');let view=await edge(owner,{action:'create_draft_v1',requestId:id(),kind:'care_plan',templateVersionId:null});assert.equal(view.draft.clientId,null);
 view=await edge(owner,{action:'save_draft_v1',requestId:id(),draftId:view.draft.id,expectedContentRevision:0,expectedAssignmentRevision:0,kind:'care_plan',content:{...view.draft.content,title:'unfinished'}});assert.ok(view.issues.length>0);
 view=await edge(owner,{action:'assign_draft_v1',requestId:id(),draftId:view.draft.id,expectedContentRevision:view.draft.contentRevision,expectedAssignmentRevision:0,fromClientId:null,toClientId:client.id});assert.equal(sql('select count(*) from auth.users'),usersBefore);assert.equal(view.draft.clientId,client.id);pass('An incomplete unassigned draft saves and assigns to an existing client without creating Auth identities');
 const content=createEmptyPlanContent();Object.assign(content,{title:'synthetic comfort plan',summary:'a simple routine'});content.context={products:{state:'none',factId:'none'},facts:[{id:'none',kind:'client_report',visibility:'client',text:'no current products',sources:[],contradicts:[]},{id:'private',kind:'advisor_conclusion',visibility:'advisor_only',text:'PRIVATE_REAL_AUTH_CANARY',sources:[],contradicts:[]}]};content.goals=[{id:'comfort',text:'comfort',factIds:['none']}];content.followUp.criteria=['contact shelv if uncomfortable'];content.decisions=[{id:'no-addition',slotId:'none',recommendationId:null,kind:'no_addition',goalIds:['comfort'],currentProductIds:[],primaryProductId:null,alternativeProductIds:[],reason:'no addition needed',directions:['keep the plan simple'],cautions:[],limitations:[],schedule:null,factIds:['none'],guidance:{title:'keep it simple',subtitle:'',rationaleTitle:'why',reasons:[],actions:[],comparisons:[],factsTitle:'',facts:[],how:null,sources:[],group:null,decisionLabels:null}}];
 // Private facts are valid advisor input; only client/public results must omit them.
 const save=readPlanCommand({schemaVersion:1,action:'save_draft_v1',requestId:id(),draftId:view.draft.id,expectedContentRevision:view.draft.contentRevision,expectedAssignmentRevision:view.draft.assignmentRevision,kind:'care_plan',content});
 const response=await fetch(helpers.endpoint+'/',{method:'POST',headers:{origin:'https://portal.goshelv.com','content-type':'application/json',authorization:'Bearer '+owner.token},body:JSON.stringify(save)});assert.equal(response.status,200);view=mapPlanResult(await response.json(),save);assert.equal(view.sections.length,5);assert.ok(view.sections.every(s=>!s.reviewed));assert.ok(JSON.stringify(view.draft.content).includes('PRIVATE_REAL_AUTH_CANARY'));
 view=await review(owner,view);assert.equal(view.issues.length,0);const publisher={kind:'human',actorId:owner.id},approval=await edge(owner,{action:'approve_publication_v1',requestId:id(),target:view.target,scope:'care_plan.publish',publisher});
 await edge(owner,{action:'publish_plan_v1',requestId:id(),target:view.target,approvalId:approval.id,firstServiceClaimId:null},409);assert.equal(sql(`select count(*) from concierge.publications where client_id='${client.id}'`),'0');pass('Complete exact human reviews and approval still cannot publish before the applicable verified first service receipt');
 sql('update concierge.payment_recipient_status set enabled=true,allow_service=true;');
 const quote=await pay(owner,{action:'issue_quote',requestId:id(),expectedRevision:0,clientId:client.id,publicationVersion:0,serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000});
 const finances=await pay(owner,{action:'advisor_read',clientId:client.id}),option=finances.quotes.find(q=>q.id===quote.quoteId).paymentOptions.find(o=>o.available);assert.ok(option);
 const basis={quoteId:quote.quoteId,quoteVersion:1,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,paymentOptionId:option.id};
 const claim=await pay(client,{action:'submit_claim',requestId:id(),expectedRevision:quote.revision,...basis,evidenceId:null});
 await pay(owner,{action:'confirm_payment',requestId:id(),expectedRevision:claim.revision,clientId:client.id,...basis,claimId:claim.claimId,receiptVerified:true});
 assert.equal(sql(`select count(*) from concierge.service_periods where client_id='${client.id}' and starts_on is not null`),'0');assert.equal(sql(`select count(*) from concierge.plan_review_schedule where client_id='${client.id}'`),'0');
 const gate=await edge(owner,{action:'read_advisor_gate_v1',target:view.target,publisher});assert.equal(gate.approval.id,approval.id);assert.equal(gate.publication,'first');assert.equal(gate.capabilities.actorId,owner.id);pass('The real v2 frozen quote/claim/manual synthetic confirmation preserves unchanged content approval');
 const publish={action:'publish_plan_v1',requestId:id(),target:view.target,approvalId:approval.id,firstServiceClaimId:claim.claimId},[a,b]=await Promise.all([edge(owner,publish),edge(owner,publish)]);assert.deepEqual(a,b);assert.equal(a.firstServiceStarted,true);
 assert.equal(sql(`select count(*) from concierge.publications where client_id='${client.id}'`),'1');assert.equal(sql(`select count(*) from concierge.plan_deliveries d join concierge.plan_events e on e.id=d.event_id where e.client_id='${client.id}'`),'2');assert.equal(sql(`select count(*) from concierge.activations where client_id='${client.id}'`),'0');pass('Concurrent exact publication returns one receipt/document/event and two queued delivery rows, with no Start');
 const publicView=await edge(client,{action:'read_client_plan_v1',version:null});assert.equal(publicView.plan.version,1);assert.equal(publicView.access,'active');assert.deepEqual(publicView.actualUse,[]);assert.equal((await edge(other,{action:'read_client_plan_v1',version:null})).plan,null);
 const audit=await edge(owner,{action:'read_advisor_publication_v1',clientId:client.id,version:1});assert.equal(audit.plan.publishedAt,a.publishedAt);assert.equal(audit.clientAccess.canRead,true);assert.equal(audit.reviewSchedule.firstPublicationAt,a.publishedAt);assert.equal(sql(`select count(*) from concierge.service_periods where client_id='${client.id}' and starts_on is not null`),'1');pass('Entitled client and immutable advisor read agree; service/review clocks begin at publication and another real owner receives only their own preparation state');
 const decision={action:'record_decision_v1',requestId:id(),publicationVersion:1,expectedDecisionRevision:publicView.decisionRevision,decisionId:'no-addition',choice:'approved',reason:null};await edge(client,decision);const chosen=await edge(client,{action:'read_client_plan_v1',version:null});assert.equal(chosen.decisions[0].choice,'approved');assert.deepEqual(chosen.actualUse,[]);assert.equal(sql(`select count(*) from concierge.activations where client_id='${client.id}'`),'0');pass('The actual client decision persists and rereads without payment, receipt or Start inference');
 const providerSessionId=JSON.parse(Buffer.from(agent.token.split('.')[1],'base64url').toString()).session_id;
 const grant=await edge(owner,{action:'grant_task_v1',requestId:id(),agentActorId:agent.id,providerSessionId,clientId:null,draftId:view.draft.id,actions:['read_advisor_publication_v1'],sourceIds:[],expiresAt:new Date(Date.now()+3600000).toISOString()});
 assert.equal((await edge(agent,{action:'read_advisor_publication_v1',clientId:client.id,version:1})).version,1);await edge(agent,{action:'read_advisor_publication_v1',clientId:other.id,version:null},403);await edge(owner,{action:'revoke_task_v1',requestId:id(),grantId:grant.grantId});await edge(agent,{action:'read_advisor_publication_v1',clientId:client.id,version:1},403);pass('A genuine agent session requires the exact explicit draft-bound read grant and loses it immediately after revocation');
 const endedClient=await admin.admin.signOut(client.token,'local');assert.equal(endedClient.error,null);closedSessions.add(client.token);await edge(client,{action:'read_client_plan_v1',version:null},401);pass('Supported provider sign-out revokes the actual client session despite its previously valid bearer');
 result.status='PASS';
}catch(error){result.status='FAIL';result.failure=error instanceof assert.AssertionError?error.message:String(error?.message??'native_verification_failed');}
finally{
 try{let failures=0;for(const token of sessions){if(closedSessions.has(token))continue;try{const ended=await admin.admin.signOut(token,'local');assert.equal(ended.error,null);closedSessions.add(token);}catch{failures++;}}const ids=sessions.map(t=>JSON.parse(Buffer.from(t.split('.')[1],'base64url').toString()).session_id);ids.forEach(x=>assert.match(x,/^[0-9a-f-]{36}$/));assert.equal(sql('select count(*) from auth.sessions where id in('+ids.map(x=>"'"+x+"'").join(',')+')'),'0');assert.equal(failures,0);result.sessionCleanup={issued:sessions.length,closed:closedSessions.size,remaining:0};pass('Every issued provider session is closed; synthetic records and private identity fixtures remain available for composition');}catch{result.status='FAIL';result.failure='owned_provider_session_cleanup_failed';}
}
await writeFile(path.join(directory,'PLAN-AUTH-RESULT.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(result.status!=='PASS')process.exitCode=1;
