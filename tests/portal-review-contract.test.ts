import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import type {GoalReportBody,ConversationBody,GuidanceBody,GuidanceTarget,GuidanceBasis,GuidanceDraftView,GuidanceApproval,ReportEvent,ReportAmendment,ClientCareHistoryPage,AdvisorCareHistoryPage,GuidanceReceipt} from '../src/contracts/PortalReview.ts';
import {readReviewCommand,readGuidanceCommand,buildReviewRpc,buildGuidanceRpc,goalReportHasObservation} from '../src/contracts/PortalReviewValidation.ts';
import {mapReviewResult,mapGuidanceResult,decodePortalReviewResponse} from '../src/contracts/PortalReviewMapping.ts';
import {collectInstructionManifest,bindInstructionForScope,instructionScopes} from '../src/contracts/PortalReviewMapping.ts';
import type {ClientPlanViewV3,GuidanceReadSnapshot,InstructionManifestEntry,InstructionManifestPage,InstructionDetail,ReviewCommand} from '../src/contracts/PortalReview.ts';
import {reviewPageMaxBytes,reviewResponseMaxBytes,reviewCommandMaxBytes,portalReviewAccess} from '../src/contracts/PortalReviewValues.ts';
import {careCommandFields} from '../src/contracts/PortalCareValidation.ts';
import {taskActions} from '../src/contracts/PortalRebuildValues.ts';

const id='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',third='10000000-0000-4000-8000-000000000003';
const now='2026-01-01T12:00:00Z',unknown={state:'unknown'} as const,publication={version:1,documentSchemaVersion:3} as const;
const report:GoalReportBody={publication,answers:[],comfort:null,actualUseEventIds:[],notes:null,photoIds:[]};
const submit={schemaVersion:1,action:'submit_goal_report_v1',requestId:id,expectedReportRevision:0,body:report,occurredOn:unknown} as const;
const source={sourceId:id,sourceVersion:1,locator:{kind:'text',start:0,end:3}} as const;
const conversation:ConversationBody={publication,occurredOn:unknown,channel:'call',clientReported:[{id:'reported-comfort',text:'felt dry',sources:[source]}],advisorConclusions:[],agentProposals:[],contradictions:[]};
const body:GuidanceBody={kind:'review',publication,reportRefs:[{kind:'goal_report',id}],occurredOn:unknown,channel:'portal',clientReport:'felt dry',conclusion:'no change',rationale:'reviewed current report',changes:[],nextStep:'contact shelv if comfort changes',nextReviewOn:null};
const target={draftId:id,clientId:other,kind:'review' as const,revision:1,contentHash:'a'.repeat(64),basisHash:'b'.repeat(64)} satisfies GuidanceTarget;
const basis:GuidanceBasis={schemaVersion:1,publication,legacyBasis:{publicationVersion:1,useRevision:0},legacyBasisManifestHash:'e'.repeat(64),useHead:0,reportHead:1,instructionHead:0,references:[{event:{kind:'goal_report',id},amendmentHeadId:null}],sourceManifest:{schemaVersion:1,hash:'f'.repeat(64),count:0}};
const publisher={kind:'human',actorId:third} as const;
const approval:GuidanceApproval={id:third,target,scope:'review.publish',publisher,approvedBy:third,approvedAt:now,policyRevision:1,revokedAt:null,receiptId:null};
const draft:GuidanceDraftView={target,body,capturedBasis:basis,currentBasis:basis,needsRebase:false,savedAt:now,recordedBy:third,review:null,approval:null,issues:[]};
const receipt:GuidanceReceipt={requestId:id,receiptId:third,target,approvalId:third,publisher,record:{kind:'review',id:other},publishedAt:now,notificationEventId:third};
const original:ReportEvent={kind:'goal_report',id,body:{...report,comfort:'original comfortable report'},occurredOn:unknown,channel:'portal',reportedBy:other,recordedBy:other,recordedAt:now};
const amendment:ReportAmendment={id:third,event:{kind:'goal_report',id},previousAmendmentHeadId:null,replacement:{kind:'goal_report',body:{...report,notes:'corrected report'}},occurredOn:{state:'known',value:'2024-02-29'},reason:'corrected date and notes',amendedBy:other,recordedAt:now,attention:{id:third,priorReview:{kind:'review',id:third},state:'unresolved',resolvedBy:null}};
const heads={useHead:0,reportHead:1,instructionHead:0,serviceRevision:0,publicationVersion:1};
const history:ClientCareHistoryPage={schemaVersion:1,audience:'client',version:null,heads,entries:[{kind:'report',event:original},{kind:'report_amendment',original,amendment}],nextCursor:null};
const readHistory={schemaVersion:1,action:'read_care_history_v1',version:null,cursor:null,limit:100} as const;

test('optional goal answers and photos stay optional; empty shape is distinct from an honest observation',()=>{
 assert.deepEqual(buildReviewRpc(submit),{name:'concierge_review_command_v1',args:{p_command:submit}});
 assert.equal(goalReportHasObservation(report),false);
 for(const partial of [{notes:'new concern'},{comfort:'comfortable'},{answers:[{goalId:'goal_acne',change:'not_sure' as const}]},{actualUseEventIds:[id]},{photoIds:[id]}]){
  const next={...report,...partial};assert.equal(goalReportHasObservation(next),true);assert.equal(readReviewCommand({...submit,body:next}).action,'submit_goal_report_v1');
 }
 assert.throws(()=>readReviewCommand({...submit,body:{...report,answers:[{goalId:'goal_acne',change:'unknown'}]}}));
 assert.throws(()=>readReviewCommand({...submit,body:{...report,answers:[{goalId:'x',change:'same'},{goalId:'x',change:'worse'}]}}));
 assert.throws(()=>readReviewCommand({...submit,body:{...report,photoIds:[id,id.toUpperCase()]}}));
 for(const extra of [{clientId:other},{reportedBy:id},{recordedAt:now},{role:'owner'},{rpc:'other'},{apiKey:'secret'},{serviceRole:true}])assert.throws(()=>readReviewCommand({...submit,...extra}));
});
test('known days and nullable fields reject impossible, future, missing and explicit undefined values',()=>{
 assert.equal(readReviewCommand({...submit,occurredOn:{state:'known',value:'2024-02-29'}}).action,'submit_goal_report_v1');
 for(const value of ['2025-02-29','2100-01-01','1899-12-31'])assert.throws(()=>readReviewCommand({...submit,occurredOn:{state:'known',value}}));
 for(const occurredOn of [null,{state:'unknown',value:'2024-02-29'},{state:'known',value:null}])assert.throws(()=>readReviewCommand({...submit,occurredOn}));
 const {comfort:_comfort,...missing}=report;assert.throws(()=>readReviewCommand({...submit,body:missing}));
 assert.throws(()=>readReviewCommand({...submit,body:{...report,comfort:undefined}}));
 const canonical=readReviewCommand({...submit,requestId:id.toUpperCase()});assert.ok('requestId'in canonical);assert.equal(canonical.requestId,id);
});
test('legacy and goal amendments cannot cross kind, erase original identity or inject attribution',()=>{
 const c={schemaVersion:1,action:'amend_report_v1',requestId:id,expectedReportRevision:1,event:{kind:'goal_report',id:other},expectedAmendmentHeadId:null,replacement:{kind:'goal_report',body:report},occurredOn:unknown,reason:'corrected notes'};
 assert.equal(readReviewCommand(c).action,'amend_report_v1');
 const legacy={kind:'legacy_report',body:{comfort:'comfortable',consistency:'most evenings',changes:'',photoIds:[]}};
 assert.equal(readReviewCommand({...c,event:{kind:'legacy_report',id:other},replacement:legacy}).action,'amend_report_v1');
 assert.throws(()=>readReviewCommand({...c,replacement:legacy}));
 assert.throws(()=>readReviewCommand({...c,event:{kind:'use',id:other}}));
 assert.throws(()=>readReviewCommand({...c,replacement:{...c.replacement,amendedBy:id}}));
});
test('actual conversation keeps private provenance buckets and exact source ranges',()=>{
 const command={schemaVersion:1,action:'record_conversation_v1',requestId:id,clientId:other,expectedReportRevision:0,body:conversation};
 assert.equal(readReviewCommand(command).action,'record_conversation_v1');
 const facts={...conversation,agentProposals:[{id:'agent1',text:'proposal only',sources:[],proposedBy:unknown}],contradictions:[{left:{kind:'client_report',id:'reported-comfort'},right:{kind:'agent_proposal',id:'agent1'},note:'unresolved'}]};
 assert.equal(readReviewCommand({...command,body:facts}).action,'record_conversation_v1');
 for(const bad of [{...source,locator:{kind:'text',start:3,end:3}},{...source,locator:{kind:'time',startMs:9,endMs:2}},{...source,locator:{kind:'page',page:0}},{...source,url:'https://private.invalid'}])assert.throws(()=>readReviewCommand({...command,body:{...conversation,clientReported:[{...conversation.clientReported[0],sources:[bad]}]}}));
 assert.throws(()=>readReviewCommand({...command,body:{...facts,contradictions:[{...facts.contradictions[0],right:{kind:'advisor_conclusion',id:'absent'}}]}}));
 assert.throws(()=>readReviewCommand({...command,body:{...conversation,channel:'portal'}}));
 assert.throws(()=>readReviewCommand({...command,body:{...conversation,clientReported:[{...conversation.clientReported[0],kind:'advisor_conclusion'}]}}));
});
test('new families have fixed dispatch, READ status and human-only access without extending care or task grants',()=>{
 assert.equal(Object.keys(careCommandFields).length,13);assert.equal(taskActions.length,14);
 assert.equal(portalReviewAccess('review','read_care_history_v1','client'),'READ');
 assert.equal(portalReviewAccess('review','record_conversation_v1','client'),'DENY');
 for(const family of ['review','guidance'] as const)assert.equal(portalReviewAccess(family,'request_status_v1','human'),'READ');
 for(const action of ['submit_goal_report_v1','record_conversation_v1','request_status_v1'])assert.equal(portalReviewAccess('review',action,'task_agent'),'DENY');
 assert.equal(portalReviewAccess('guidance','publish_guidance_v1','task_agent'),'DENY');
 assert.equal(portalReviewAccess('guidance','read_guidance_draft_v1','client'),'DENY');
 assert.equal(portalReviewAccess('review','not_an_action','human'),'DENY');
 const c={schemaVersion:1,action:'create_guidance_draft_v1',requestId:id,clientId:other,body:{...body,conclusion:'',rationale:'',nextStep:''}};
 assert.deepEqual(buildGuidanceRpc(c),{name:'concierge_guidance_command_v1',args:{p_command:c}});
 assert.throws(()=>readReviewCommand(c));assert.throws(()=>readGuidanceCommand(submit));
});
test('guidance binds kind, exact target, publisher and approval scope; no first-payment or task override',()=>{
 const approve={schemaVersion:1,action:'approve_guidance_v1',requestId:id,target,publisher,scope:'review.publish'};
 assert.equal(readGuidanceCommand(approve).action,'approve_guidance_v1');
 for(const bad of [{...approve,scope:'care_plan.publish'},{...approve,scope:'reply.publish'},{...approve,publisher:{kind:'task_agent',actorId:id,taskGrantId:other}},{...approve,approved:true}])assert.throws(()=>readGuidanceCommand(bad));
 const save={schemaVersion:1,action:'save_guidance_draft_v1',requestId:id,target,body};
 assert.equal(readGuidanceCommand(save).action,'save_guidance_draft_v1');
 assert.throws(()=>readGuidanceCommand({...save,body:{kind:'reply',publication,reportRef:{kind:'goal_report',id},reply:'reply',nextStep:null}}));
 const publish={schemaVersion:1,action:'publish_guidance_v1',requestId:id,target,approvalId:third,publisher};
 for(const extra of [{firstServiceClaimId:id},{restartService:true},{approved:true},{ignoreCoverage:true}])assert.throws(()=>readGuidanceCommand({...publish,...extra}));
});
test('instruction uses exact V3 product/slot/use basis and authored schedule without a Start field',()=>{
 const schedule={periods:['evening'],days:{kind:'daily'},condition:null,asNeeded:false,stages:[],anchor:'actual_start',automaticAdvance:false};
 const instruction={kind:'instruction',publication,slotId:'moisturizer_pm',productId:'CeraVe_PM',baseInstructionId:null,baseInstructionVersion:0,useBasis:{useRevision:2,latestEventId:null,amendmentHeadId:null},directions:[],cautions:[],schedule,reason:'',effectiveOn:'2024-02-29',reviewId:null};
 const command={schemaVersion:1,action:'create_guidance_draft_v1',requestId:id,clientId:other,body:instruction};
 assert.equal(readGuidanceCommand(command).action,'create_guidance_draft_v1');
 for(const bad of [{...instruction,publication:{version:1,documentSchemaVersion:2}},{...instruction,productId:null,useBasis:instruction.useBasis},{...instruction,schedule:{...schedule,automaticAdvance:true}},{...instruction,startedOn:'2024-02-29'},{...instruction,useBasis:{useRevision:0,latestEventId:null,amendmentHeadId:id}}])assert.throws(()=>readGuidanceCommand({...command,body:bad}));
 const nonproduct={...instruction,productId:null,useBasis:null};assert.equal(readGuidanceCommand({...command,body:nonproduct}).action,'create_guidance_draft_v1');
 assert.equal(readGuidanceCommand({...command,body:{...nonproduct,effectiveOn:'2100-01-01'}}).action,'create_guidance_draft_v1','safe draft storage is not a claim that a future instruction is currently applicable');
});
test('positive report receipts bind action, event kind, request and next report revision',()=>{
 const c=readReviewCommand({...submit,body:{...report,notes:'an honest update'}}),r={requestId:id,action:'submit_goal_report_v1',event:{kind:'goal_report',id:other},amendmentId:null,revision:1,recordedAt:now,notificationEventId:third,attentionEventId:third};
 assert.deepEqual(mapReviewResult(r,c),r);
 for(const bad of [{...r,requestId:other},{...r,event:{kind:'conversation',id:other}},{...r,revision:0},{...r,privateNote:'private'},{...r,notificationEventId:null}])assert.throws(()=>mapReviewResult(bad,c));
 const status=readReviewCommand({schemaVersion:1,action:'request_status_v1',requestId:id});
 assert.deepEqual(mapReviewResult({status:'committed',receipt:r},status),{status:'committed',receipt:r});
 assert.throws(()=>mapReviewResult({status:'committed',receipt:history},status));
});
test('private append note has its own actor/receipt, no clinical head or notification',()=>{
 const command=readReviewCommand({schemaVersion:1,action:'append_private_review_note_v1',requestId:id,clientId:other,reviewEvent:{kind:'review',id:third},note:'private observation'});
 const r={requestId:id,action:'append_private_review_note_v1',noteId:other,reviewEvent:{kind:'review',id:third},recordedBy:third,recordedAt:now,notificationEventId:null};
 assert.deepEqual(mapReviewResult(r,command),r);
 assert.throws(()=>mapReviewResult({...r,notificationEventId:id},command));
 assert.throws(()=>mapReviewResult({...r,revision:2},command));
 const beforeReview=readReviewCommand({schemaVersion:1,action:'append_private_review_note_v1',requestId:id,clientId:other,reviewEvent:{kind:'goal_report',id:third},note:'private preparation, before public review'});
 assert.deepEqual(mapReviewResult({...r,reviewEvent:{kind:'goal_report',id:third}},beforeReview),{...r,reviewEvent:{kind:'goal_report',id:third}});
});
test('history preserves full original plus separately attributed amendment and exact prior-review attention',()=>{
 const command=readReviewCommand(readHistory);assert.deepEqual(mapReviewResult(history,command),history);
 assert.equal(original.body.notes,null);assert.ok(amendment.replacement.kind==='goal_report');assert.equal(amendment.replacement.body.notes,'corrected report');
 for(const change of [{amendedBy:undefined},{event:{kind:'goal_report',id:third}},{attention:{...amendment.attention,state:'resolved',resolvedBy:null}}])assert.throws(()=>mapReviewResult({...history,entries:[{kind:'report_amendment',original,amendment:{...amendment,...change}}]},command));
 assert.throws(()=>mapReviewResult({...history,entries:history.entries.slice(0,1),nextCursor:'arbitrary'},command));
 assert.throws(()=>mapReviewResult({...history,version:2},command));
 const attentionEntry={kind:'review_attention',eventId:third,publication,amendmentId:third,event:{kind:'goal_report',id},attention:amendment.attention,recordedAt:now};
 const many={...history,entries:[...history.entries,attentionEntry,{...attentionEntry,eventId:other,attention:{...amendment.attention,id:other,priorReview:{kind:'review',id:other}}}]};
 assert.deepEqual(mapReviewResult(many,command),many,'every dependent review has its own immutable paginated attention relationship');
 const resolved={...attentionEntry,eventId:'10000000-0000-4000-8000-000000000004',attention:{...amendment.attention,state:'resolved',resolvedBy:{kind:'review',id:'10000000-0000-4000-8000-000000000005'}},recordedAt:'2026-01-02T00:00:00Z'};
 const withResolution={...many,entries:[...many.entries,resolved]};assert.deepEqual(mapReviewResult(withResolution,command),withResolution);
 assert.deepEqual(mapReviewResult({...history,entries:[resolved]},command),{...history,entries:[resolved]},'resolution retains relationship identity on its own page');
 assert.throws(()=>mapReviewResult({...many,entries:[...many.entries,{...resolved,eventId:third}]},command));
});
test('client history rejects private conversation/note/source and advisor envelopes at every depth',()=>{
 const command=readReviewCommand(readHistory);
 const event={id,body:conversation,reportedBy:other,recordedBy:third,recordedAt:now};
 const advisor:AdvisorCareHistoryPage={...history,audience:'advisor',clientId:other,entries:[{kind:'conversation',event}]};
 assert.deepEqual(mapReviewResult(advisor,readReviewCommand({...readHistory,action:'read_advisor_care_history_v1',clientId:other})),advisor);
 assert.throws(()=>mapReviewResult(advisor,command));
 assert.throws(()=>mapReviewResult({...history,entries:advisor.entries},command));
 assert.throws(()=>mapReviewResult({...history,entries:[{kind:'report',event:{...original,body:{...report,sources:[source]}}}]},command));
 assert.throws(()=>mapReviewResult({...history,privateNotes:[]},command));
 assert.throws(()=>mapReviewResult({...advisor,clientId:id},readReviewCommand({...readHistory,action:'read_advisor_care_history_v1',clientId:other})));
});
test('draft mapping keeps incomplete save separate from current exact review and approval',()=>{
 const read=readGuidanceCommand({schemaVersion:1,action:'read_guidance_draft_v1',draftId:id});
 assert.deepEqual(mapGuidanceResult(draft,read),draft);
 assert.throws(()=>mapGuidanceResult({...draft,target:{...target,draftId:other}},read));
 assert.throws(()=>mapGuidanceResult({...draft,approval:{...approval,target:{...target,contentHash:'c'.repeat(64)}}},read));
 assert.throws(()=>mapGuidanceResult({...draft,currentBasis:{...basis,reportHead:2},needsRebase:false},read));
 assert.throws(()=>mapGuidanceResult({...draft,body:{...body,privateNote:'private'}},read));
 const create=readGuidanceCommand({schemaVersion:1,action:'create_guidance_draft_v1',requestId:id,clientId:other,body});
 assert.deepEqual(mapGuidanceResult({requestId:id,draft},create),{requestId:id,draft});
 assert.throws(()=>mapGuidanceResult({requestId:other,draft},create));
});
test('no-change guidance receipt binds publisher/approval/target/kind with no plan/service/Start output',()=>{
 const command=readGuidanceCommand({schemaVersion:1,action:'publish_guidance_v1',requestId:id,target,approvalId:third,publisher});
 assert.deepEqual(mapGuidanceResult(receipt,command),receipt);
 for(const bad of [{...receipt,record:{kind:'instruction',id:other}},{...receipt,approvalId:other},{...receipt,publisher:{...publisher,actorId:id}},{...receipt,target:{...target,basisHash:'c'.repeat(64)}},{...receipt,publicationVersion:2},{...receipt,firstServiceStarted:false},{...receipt,notificationEventId:null}])assert.throws(()=>mapGuidanceResult(bad,command));
 const approve=readGuidanceCommand({schemaVersion:1,action:'approve_guidance_v1',requestId:id,target,publisher,scope:'review.publish'});
 assert.deepEqual(mapGuidanceResult({requestId:id,approval},approve),{requestId:id,approval});
 assert.throws(()=>mapGuidanceResult({requestId:id,approval:{...approval,scope:'reply.publish'}},approve));
 const publicReview={record:{kind:'review',id:other},body,publishedBy:third,publishedAt:now,originalStart:null};
 const page={...history,entries:[{kind:'guidance',guidance:publicReview}]};
 assert.deepEqual(mapReviewResult(page,readReviewCommand(readHistory)),page);
 assert.throws(()=>mapReviewResult({...page,entries:[{kind:'guidance',guidance:{...publicReview,target}}]},readReviewCommand(readHistory)));
 assert.throws(()=>mapReviewResult({...page,entries:[{kind:'guidance',guidance:{...publicReview,body:{...body,conclusion:''}}}]},readReviewCommand(readHistory)));
});
test('variable-count UTF8 pages fit exact byte ceiling with honest cursor, and never silently truncate',()=>{
 const make=(n:number):ClientCareHistoryPage=>({...history,entries:Array.from({length:n},(_,index)=>({kind:'report',event:{...original,id:`10000000-0000-4000-8000-${String(index+10).padStart(12,'0')}`,body:{...report,comfort:'🧴'.repeat(1000),notes:'🧴'.repeat(4000)}}})),nextCursor:`r:${'a'.repeat(64)}:${id}`});
 const command=readReviewCommand(readHistory),page=make(10);assert.deepEqual(mapReviewResult(page,command),page);
 const oversized=make(25);assert.ok(Buffer.byteLength(JSON.stringify(oversized))>reviewPageMaxBytes);assert.throws(()=>mapReviewResult(oversized,command));
 const single=make(1);const gap=reviewPageMaxBytes-Buffer.byteLength(JSON.stringify(single));
 // Fill remaining bytes using additional complete reports, then a bounded multibyte-free field.
 const filled=make(19);const deficit=reviewPageMaxBytes-Buffer.byteLength(JSON.stringify(filled));assert.ok(gap>0&&deficit>0);
 const p={...filled,entries:[...filled.entries,{kind:'report' as const,event:{...original,id:other,body:{...report,notes:'a'.repeat(4000)}}}]};
 const remaining=reviewPageMaxBytes-Buffer.byteLength(JSON.stringify(p));assert.ok(remaining>0&&remaining<11997);
 const emoji=Math.floor(remaining/3),remainder=remaining%3,last=p.entries[p.entries.length-1];
 assert.ok(last.kind==='report'&&last.event.kind==='goal_report');
 last.event.body.notes='🧴'.repeat(emoji)+(remainder===1?'é':remainder===2?'☀':'')+'a'.repeat(4000-emoji-(remainder>0?1:0));
 assert.equal(Buffer.byteLength(JSON.stringify(p)),400000);assert.deepEqual(mapReviewResult(p,command),p);
 last.event.body.notes=last.event.body.notes.replace('a','é');assert.equal(Buffer.byteLength(JSON.stringify(p)),400001);assert.throws(()=>mapReviewResult(p,command));
 assert.throws(()=>mapReviewResult({...page,entries:[]},command));
 assert.ok(reviewPageMaxBytes<reviewResponseMaxBytes&&reviewResponseMaxBytes<2000000);
 assert.throws(()=>readReviewCommand({...submit,body:{...report,notes:'a'.repeat(4001)}}));
 const large={...conversation,clientReported:Array.from({length:50},(_,i)=>({id:`fact${i}`,text:'🧴'.repeat(4000),sources:[]}))};
 assert.ok(Buffer.byteLength(JSON.stringify(large))>reviewCommandMaxBytes);
 assert.throws(()=>readReviewCommand({schemaVersion:1,action:'record_conversation_v1',requestId:id,clientId:other,expectedReportRevision:0,body:large}));
});
test('a complete private conversation fits one page at its exact UTF8 body bound without truncation',()=>{
 const facts=Array.from({length:50},(_,i)=>({id:`fact${i}`,text:'🧴'.repeat(1000),sources:[]}));
 const max={...conversation,clientReported:facts};let remaining=250000-Buffer.byteLength(JSON.stringify(max));
 for(const fact of facts){const add=Math.min(remaining,3000);fact.text+='x'.repeat(add);remaining-=add;}
 assert.equal(remaining,0);assert.equal(Buffer.byteLength(JSON.stringify(max)),250000);
 const command=readReviewCommand({schemaVersion:1,action:'record_conversation_v1',requestId:id,clientId:other,expectedReportRevision:0,body:max});assert.equal(command.action,'record_conversation_v1');
 const page:AdvisorCareHistoryPage={...history,audience:'advisor',clientId:other,entries:[{kind:'conversation',event:{id,body:max,reportedBy:other,recordedBy:third,recordedAt:now}}]};
 assert.ok(Buffer.byteLength(JSON.stringify(page))<400000);
 assert.deepEqual(mapReviewResult(page,readReviewCommand({...readHistory,action:'read_advisor_care_history_v1',clientId:other})),page);
 facts[49].text+='x';assert.throws(()=>readReviewCommand({...command,body:max}));
});
test('save, deliberate basis rebase, human review and revocation each bind their actual result',()=>{
 const saved={...draft,target:{...target,revision:2,contentHash:'c'.repeat(64)}};
 const save=readGuidanceCommand({schemaVersion:1,action:'save_guidance_draft_v1',requestId:id,target,body});
 assert.deepEqual(mapGuidanceResult({requestId:id,draft:saved},save),{requestId:id,draft:saved});
 assert.throws(()=>mapGuidanceResult({requestId:id,draft},save));
 const changedBasis={...basis,reportHead:2};const rebased={...saved,target:{...saved.target,basisHash:'d'.repeat(64)},capturedBasis:changedBasis,currentBasis:changedBasis};
 const rebase=readGuidanceCommand({schemaVersion:1,action:'rebase_guidance_draft_v1',requestId:id,target,expectedBasis:changedBasis});
 assert.deepEqual(mapGuidanceResult({requestId:id,draft:rebased},rebase),{requestId:id,draft:rebased});
 assert.throws(()=>mapGuidanceResult({requestId:id,draft:saved},rebase));
 const reviewed={...draft,review:{id:third,target,reviewedBy:third,reviewedAt:now}};
 const review=readGuidanceCommand({schemaVersion:1,action:'review_guidance_v1',requestId:id,target});
 assert.deepEqual(mapGuidanceResult({requestId:id,draft:reviewed},review),{requestId:id,draft:reviewed});
 assert.throws(()=>mapGuidanceResult({requestId:id,draft},review));
 const revoked={requestId:id,approvalId:third,revokedBy:third,revokedAt:now,policyRevision:1};
 const revoke=readGuidanceCommand({schemaVersion:1,action:'revoke_guidance_approval_v1',requestId:id,approvalId:third,expectedPolicyRevision:1});
 assert.deepEqual(mapGuidanceResult(revoked,revoke),revoked);assert.throws(()=>mapGuidanceResult({...revoked,approvalId:id},revoke));
 const status=readGuidanceCommand({schemaVersion:1,action:'request_status_v1',requestId:id});
 assert.deepEqual(mapGuidanceResult({status:'committed',receipt:revoked},status),{status:'committed',receipt:revoked});
 assert.throws(()=>mapGuidanceResult({status:'committed',receipt:{...revoked,privateNote:'private'}},status));
});
test('malformed writes stay uncertain with exact UUID/payload retry; reads and status stay rejected',()=>{
 const command=readReviewCommand(submit),write=decodePortalReviewResponse('review',command,200,{unexpected:'success'});
 assert.deepEqual(write,{state:'uncertain',status:503,code:'uncertain',retry:command});
 assert.deepEqual(decodePortalReviewResponse('review',readReviewCommand(readHistory),200,{unexpected:'success'}),{state:'rejected',status:503,code:'unavailable'});
 const status=readReviewCommand({schemaVersion:1,action:'request_status_v1',requestId:id});
 assert.deepEqual(decodePortalReviewResponse('review',status,503,{code:'uncertain'}),{state:'rejected',status:503,code:'unavailable'});
 assert.deepEqual(decodePortalReviewResponse('review',command,409,{code:'revision_conflict'}),{state:'rejected',status:409,code:'revision_conflict'});
 const safe=decodePortalReviewResponse('review',command,500,{code:'SQL password secret'});assert.equal(JSON.stringify(safe).includes('secret'),false);
 assert.deepEqual(decodePortalReviewResponse('review',command,400,{code:'revision_conflict'}),{state:'uncertain',status:503,code:'uncertain',retry:command});
});
test('recording timestamps reject impossible calendar days and non-JSON objects never enter either seam',()=>{
 const command=readReviewCommand(submit),r={requestId:id,action:'submit_goal_report_v1',event:{kind:'goal_report',id:other},amendmentId:null,revision:1,recordedAt:'2025-02-29T12:00:00Z',notificationEventId:third,attentionEventId:third};
 assert.throws(()=>mapReviewResult(r,command));
 const cyclic:Record<string,unknown>={...submit};cyclic.self=cyclic;
 for(const bad of [cyclic,{...submit,body:{...report,notes:new Date()}},{...submit,body:{...report,notes:()=>null}},{...submit,body:{...report,notes:NaN}},{...submit,body:{...report,notes:Symbol('secret')}}])assert.throws(()=>readReviewCommand(bad));
 const getter={...submit};Object.defineProperty(getter,'body',{enumerable:true,get(){throw Error('getter must not execute');}});assert.throws(()=>readReviewCommand(getter),/invalid_input/);
});
test('guidance basis cannot omit the retained legacy-use manifest even when new care heads are zero',()=>{
 const omitted={schemaVersion:1,publication,useHead:0,reportHead:1,instructionHead:0,references:basis.references,sourceManifest:basis.sourceManifest};
 assert.throws(()=>mapGuidanceResult({...draft,capturedBasis:omitted,currentBasis:omitted},readGuidanceCommand({schemaVersion:1,action:'read_guidance_draft_v1',draftId:id})));
});
test('empty and whitespace-only goal submissions return exact no-op receipts without a report or new head',()=>{
 const whitespace={...report,comfort:' \t\n',notes:'\u2003 '};assert.equal(goalReportHasObservation(whitespace),false);
 const command=readReviewCommand({...submit,body:whitespace});
 const noop={requestId:id,action:'submit_goal_report_v1',outcome:'no_op',reason:'no_observation',revision:0,event:null,amendmentId:null,notificationEventId:null,attentionEventId:null};
 assert.deepEqual(mapReviewResult(noop,command),noop);assert.deepEqual(mapReviewResult(noop,readReviewCommand(submit)),noop);
 const status=readReviewCommand({schemaVersion:1,action:'request_status_v1',requestId:id});
 assert.deepEqual(mapReviewResult({status:'committed',receipt:noop},status),{status:'committed',receipt:noop});
 assert.throws(()=>mapReviewResult({...noop,revision:1},command));
 assert.throws(()=>mapReviewResult({...noop,notificationEventId:third},command));
 assert.throws(()=>mapReviewResult(noop,readReviewCommand({...submit,body:{...report,notes:'real observation'}})));
 const fake={requestId:id,action:'submit_goal_report_v1',event:{kind:'goal_report',id:other},amendmentId:null,revision:1,recordedAt:now,notificationEventId:third,attentionEventId:third};
 assert.throws(()=>mapReviewResult(fake,command));
 assert.throws(()=>mapReviewResult({...history,entries:[{kind:'report',event:{...original,body:report}}]},readReviewCommand(readHistory)));
});
test('new v3 read preserves the immutable plan and carries an explicit bounded instruction-manifest requirement',async()=>{
 const {createEmptyPlanContent,projectClientPlan}=await import('../src/contracts/PortalRebuild.ts');
 const snapshot={publication,currentPublication:publication,useHead:0,reportHead:0,instructionHead:0,serviceRevision:0,decisionRevision:0,asOfDay:'2026-01-01',manifestHash:'a'.repeat(64)};
 const currentGuidance={schemaVersion:1,mode:'current_document',instructionSemantics:'current_for_selected_publication',snapshot,instructionCount:0};
 const view={schemaVersion:3,access:'active',plan:{documentSchemaVersion:3,version:1,publishedAt:now,content:projectClientPlan(createEmptyPlanContent())},decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null,use:{revision:0,planProducts:[],reportedProducts:{items:[],nextCursor:null}},latestPublicReview:null,decisionGuidance:[],currentGuidance};
 const command=readReviewCommand({schemaVersion:1,action:'read_client_plan_v3',version:1});
 assert.deepEqual(mapReviewResult(view,command),view);
 assert.throws(()=>mapReviewResult({...view,currentGuidance:{...currentGuidance,snapshot:{...snapshot,useHead:1}}},command));
 assert.throws(()=>mapReviewResult({...view,currentGuidance:{...currentGuidance,mode:'historical_document'}},command));
 assert.throws(()=>mapReviewResult({...view,currentGuidance:{...currentGuidance,privateNote:'private'}},command));
 const prep={...view,access:'preparation',plan:null,currentGuidance:null};assert.deepEqual(mapReviewResult(prep,readReviewCommand({schemaVersion:1,action:'read_client_plan_v3',version:null})),prep);
 const {access:_access,...advisorBase}=view;
 const advisor={...advisorBase,clientId:other,version:1,reviewSchedule:null,clientAccess:{care:'ended',entitled:true,canRead:false,canWrite:false}};
 const readAdvisor=readReviewCommand({schemaVersion:1,action:'read_advisor_publication_v3',clientId:other,version:1});assert.deepEqual(mapReviewResult(advisor,readAdvisor),advisor);
 assert.throws(()=>mapReviewResult({...advisor,clientId:id},readAdvisor));
 assert.throws(()=>mapReviewResult({...view,latestPublicReview:{reviewId:id,publicationVersion:2,publishedAt:now,occurredOn:unknown,conclusion:'no change',rationale:'reviewed',nextStep:'contact shelv',nextReviewOn:null}},command));
 assert.equal(portalReviewAccess('review','read_client_plan_v3','client'),'READ');assert.equal(portalReviewAccess('review','read_client_plan_v3','task_agent'),'DENY');
});

async function instructionFixture(){
 const {createEmptyPlanContent,projectClientPlan}=await import('../src/contracts/PortalRebuild.ts');
 const schedule={periods:['evening' as const],days:{kind:'daily' as const},condition:null,asNeeded:false,stages:[],anchor:'actual_start' as const,automaticAdvance:false as const};
 const content=createEmptyPlanContent();content.routine=[{id:'rinse',slotId:'rinse',kind:'instruction',productId:null,title:'rinse',directions:['use water'],cautions:[],schedule}];
 const snapshot:GuidanceReadSnapshot={publication,currentPublication:publication,useHead:0,reportHead:0,instructionHead:1,serviceRevision:1,decisionRevision:0,asOfDay:'2026-01-01',manifestHash:'a'.repeat(64)};
 const view:ClientPlanViewV3={schemaVersion:3,access:'active',plan:{documentSchemaVersion:3,version:1,publishedAt:now,content:projectClientPlan(content)},decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null,use:{revision:0,planProducts:[],reportedProducts:{items:[],nextCursor:null}},latestPublicReview:null,decisionGuidance:[],currentGuidance:{schemaVersion:1,mode:'current_document',instructionSemantics:'current_for_selected_publication',snapshot,instructionCount:1}};
 const item:InstructionManifestEntry={instructionId:id,version:1,format:'authored_schedule',scope:{publication,slotId:'rinse',productId:null},contentHash:'b'.repeat(64),effectiveOn:'2024-02-29',baseInstructionId:null,baseInstructionVersion:0,reviewedUseBasis:null,basisStatus:'current',originalStart:null};
 const page:InstructionManifestPage={schemaVersion:1,audience:'client',snapshot,total:1,cursor:null,items:[item],nextCursor:null};
 const detail:InstructionDetail={schemaVersion:1,audience:'client',snapshot,item,content:{format:'authored_schedule',body:{kind:'instruction',publication,slotId:'rinse',productId:null,baseInstructionId:null,baseInstructionVersion:0,useBasis:null,directions:['rinse gently'],cautions:[],schedule,reason:'reviewed practical change',effectiveOn:'2024-02-29',reviewId:null}},publishedBy:third,publishedAt:now};
 return {view,snapshot,item,page,detail,schedule};
}
test('exact instruction manifest/detail reads bind head, day, audience, version, hash and actual scope',async()=>{
 const {view,snapshot,item,page,detail}=await instructionFixture();
 const command=readReviewCommand({schemaVersion:1,action:'read_client_instruction_manifest_v1',snapshot,cursor:null,limit:100});
 assert.deepEqual(mapReviewResult(page,command),page);
 for(const bad of [{...snapshot,useHead:1},{...snapshot,asOfDay:'2026-01-02'}])assert.throws(()=>mapReviewResult({...page,snapshot:bad},command));
 assert.throws(()=>mapReviewResult({...page,items:[{...item,effectiveOn:'2026-01-02'}]},command));
 assert.throws(()=>mapReviewResult({...page,items:[{...item,version:7}]},command));
 assert.throws(()=>mapReviewResult({...page,snapshot:{...snapshot,sourceId:id}},command));
 const nextDay={...snapshot,asOfDay:'2026-01-02',manifestHash:'c'.repeat(64)},nextItem={...item,effectiveOn:'2026-01-02'};
 const nextPage={...page,snapshot:nextDay,items:[nextItem]};assert.deepEqual(mapReviewResult(nextPage,readReviewCommand({schemaVersion:1,action:'read_client_instruction_manifest_v1',snapshot:nextDay,cursor:null,limit:100})),nextPage,'effective day can change applicability without changing numeric heads');
 const read=readReviewCommand({schemaVersion:1,action:'read_client_instruction_v1',snapshot,instructionId:id,version:1,contentHash:item.contentHash});
 assert.deepEqual(mapReviewResult(detail,read),detail);
 for(const bad of [{...item,version:2},{...item,contentHash:'c'.repeat(64)},{...item,scope:{...item.scope,slotId:'other'}}])assert.throws(()=>mapReviewResult({...detail,item:bad},read));
 const manifest=collectInstructionManifest(view,[page]);assert.deepEqual(bindInstructionForScope(view,manifest,item.scope,detail),detail);
 assert.throws(()=>bindInstructionForScope(view,manifest,item.scope,null));
 assert.throws(()=>collectInstructionManifest(view,[]));
 assert.throws(()=>collectInstructionManifest(view,[{...page,items:[{...item,scope:{...item.scope,slotId:'absent'}}]}]));
 const advisor=readReviewCommand({schemaVersion:1,action:'read_advisor_instruction_v1',clientId:other,snapshot,instructionId:id,version:1,contentHash:item.contentHash});
 const advisorDetail={...detail,audience:'advisor',clientId:other};assert.deepEqual(mapReviewResult(advisorDetail,advisor),advisorDetail);
 assert.throws(()=>mapReviewResult({...advisorDetail,clientId:id},advisor));assert.throws(()=>mapReviewResult(advisorDetail,read));
});
test('manifest completeness refuses early terminal pages, duplicates, changed snapshots and missing instructions',async()=>{
 const {view,snapshot,item,page}=await instructionFixture();
 const second={...item,instructionId:other,scope:{...item.scope,slotId:'second'}};
 const c=view.plan!.content;c.routine.push({...c.routine[0],id:'second',slotId:'second'});
 const two={...view,currentGuidance:{...view.currentGuidance!,instructionCount:2}};
 const cursor=`r:${'a'.repeat(64)}:${id}`;
 const pages:InstructionManifestPage[]=[{...page,total:2,nextCursor:cursor},{...page,total:2,cursor,items:[second]}];
 assert.equal(collectInstructionManifest(two,pages).length,2);
 assert.throws(()=>collectInstructionManifest(two,[{...pages[0],nextCursor:null},{...pages[1],cursor:null}]));
 assert.throws(()=>collectInstructionManifest(two,[pages[0]]));
 assert.throws(()=>collectInstructionManifest(two,[pages[0],{...pages[1],snapshot:{...snapshot,instructionHead:2}}]));
 assert.throws(()=>collectInstructionManifest(two,[pages[0],{...pages[1],items:[item]}]));
});
test('source-valid max document/use/reported page and all2550 explicit scopes stay inside each wire budget',async(t)=>{
 const {createEmptyPlanContent,projectClientPlan}=await import('../src/contracts/PortalRebuild.ts');
 const {readPlanContent,planContentShape}=await import('../src/contracts/PortalRebuildValidation.ts');
 const {reviewInstructionScopesMax}=await import('../src/contracts/PortalReviewValues.ts');
 const {schedule}=await instructionFixture(),template=JSON.parse(readFileSync(new URL('./fixtures/concierge-presentation.json',import.meta.url),'utf8')).presentation.categoryCards[0].currentProduct;
 const content=createEmptyPlanContent();content.title='maximum source-valid synthetic plan';
 for(let i=0;i<50;i++)content.products.push({...template,id:`p${i}`,name:'🧴'.repeat(200),brand:'🧴'.repeat(100),variant:'🧴'.repeat(200),sizeLabel:'🧴'.repeat(120),strength:{state:'known',value:'🧴'.repeat(200)},category:{state:'known',value:'🧴'.repeat(200)},identity:'unresolved',formula:'unknown',factIds:[],guides:[],evidence:[]});
 const productIds=content.products.map(p=>p.id);content.context.products={state:'recorded',productIds};
 for(let i=0;i<50;i++){
  content.routine.push({id:`r${i}`,slotId:`r${i}`+'s'.repeat(97-String(i).length),kind:'product',productId:productIds[i],title:'routine',directions:['use as directed'],cautions:[],schedule});
  content.decisions.push({id:`d${i}`,slotId:`d${i}`+'s'.repeat(97-String(i).length),recommendationId:null,kind:'keep',goalIds:[],currentProductIds:productIds,primaryProductId:productIds[i],alternativeProductIds:[],reason:'keep',directions:['use as directed'],cautions:[],limitations:[],schedule,factIds:[],guidance:{title:'',subtitle:'',rationaleTitle:'',reasons:[],actions:[],comparisons:[],factsTitle:'',facts:[],how:null,sources:[],group:null,decisionLabels:null}});
 }
 const bytes=(v:unknown)=>Buffer.byteLength(JSON.stringify(v));
 while(content.consultationSections.length<49&&bytes(content)+16500<498000)content.consultationSections.push({title:'retained source content',body:'🧴'.repeat(4000)});
 const gap=498000-bytes(content)-80;assert.ok(gap>0);content.consultationSections.push({title:'last',body:'🧴'.repeat(Math.min(4000,Math.floor(gap/4)))});
 assert.ok(bytes(content)>480000&&bytes(content)<500000);readPlanContent(content);
 assert.equal(content.routine.length,planContentShape.fields!.routine.max);assert.equal(content.decisions.length,planContentShape.fields!.decisions.max);assert.equal(content.products.length,planContentShape.fields!.products.max);
 const snapshot:GuidanceReadSnapshot={publication,currentPublication:publication,useHead:1,reportHead:1,instructionHead:1,serviceRevision:1,decisionRevision:50,asOfDay:'2026-01-01',manifestHash:'a'.repeat(64)};
 const states=content.products.map(p=>{const ref={kind:'plan_product' as const,publication,productId:p.id,slotId:null},originalRef={...ref,slotId:'s'.repeat(100)};return {product:ref,state:'paused' as const,originalStart:unknown,contradiction:false,identity:{eventId:id,target:{subject:originalRef,comparedWith:originalRef},match:'not_sure' as const,sourcePublication:publication,occurredOn:unknown,recordedAt:now,reportedBy:other,recordedBy:third,channel:'call' as const},latestEvent:{eventId:id,product:originalRef,changeKind:'started' as const,sourcePublication:publication,occurredOn:unknown,recordedAt:now,reportedBy:other,recordedBy:third,channel:'call' as const,acquisition:'self' as const,identityEventId:id,originalActivationId:'9'.repeat(19),amendment:{id:third,eventId:id,previousAmendmentHeadId:id,product:ref,changeKind:'paused' as const,sourcePublication:publication,occurredOn:unknown,acquisition:'self' as const,identityEventId:id,amendedBy:third,amendedAt:now}}};});
 const descriptor={name:'🧴'.repeat(200),brand:{state:'known' as const,value:'🧴'.repeat(200)},variant:{state:'known' as const,value:'🧴'.repeat(200)},strength:{state:'known' as const,value:'🧴'.repeat(200)},sizeLabel:{state:'known' as const,value:'🧴'.repeat(200)},labelPhotoIds:[]};
 const rows=[] as ClientPlanViewV3['use']['reportedProducts']['items'];
 for(let i=0;i<100;i++){const row={product:{kind:'client_reported_product' as const,reportedProductId:`10000000-0000-4000-8000-${String(i+10).padStart(12,'0')}`,version:1},descriptor,state:'unreviewed' as const,originalStart:unknown,latestEvent:null,identity:null,contradiction:false};if(bytes({items:[...rows,row],nextCursor:`c:${'a'.repeat(64)}:${id}`})>399900)break;rows.push(row);}
 assert.ok(rows.length>1&&rows.length<100);
 const view:ClientPlanViewV3={schemaVersion:3,access:'read_only',plan:{documentSchemaVersion:3,version:1,publishedAt:now,content:projectClientPlan(content)},decisionRevision:50,decisions:content.decisions.map(d=>({decisionId:d.id,choice:'approved',reason:'🧴'.repeat(1000)})),decisionGuidance:content.decisions.map((d,i)=>({decisionId:d.id,recordedDecisionRevision:i+1,acceptedSnapshot:{...snapshot,decisionRevision:i},basisStatus:'current'})),actualUse:Array.from({length:1000},(_,i)=>({slot:'old'+String(i).padStart(97,'0'),productId:'old-product'+'p'.repeat(89),startedOn:'2024-02-29',publicationVersion:1})),nextReviewOn:null,use:{revision:1,planProducts:states,reportedProducts:{items:rows,nextCursor:`c:${'a'.repeat(64)}:${id}`}},latestPublicReview:{reviewId:id,publicationVersion:1,publishedAt:now,occurredOn:unknown,conclusion:'🧴'.repeat(4000),rationale:'🧴'.repeat(4000),nextStep:'🧴'.repeat(4000),nextReviewOn:null},currentGuidance:{schemaVersion:1,mode:'current_document',instructionSemantics:'current_for_selected_publication',snapshot,instructionCount:2550}};
 assert.ok(bytes(view)<1800000&&bytes(view)>1400000);const read=readReviewCommand({schemaVersion:1,action:'read_client_plan_v3',version:1});assert.deepEqual(mapReviewResult(view,read),view);
 const omitted={...view,use:{...view.use,planProducts:states.slice(1)}};assert.throws(()=>mapReviewResult(omitted,read));assert.equal(view.use.planProducts.filter(p=>p.state==='paused').length,50);
 const scopes=instructionScopes(view);assert.equal(scopes.length,2550);assert.equal(scopes.length,reviewInstructionScopesMax);
 const entries:InstructionManifestEntry[]=scopes.map((scope,i)=>({instructionId:`10000000-0000-4000-8000-${String(i+1000).padStart(12,'0')}`,version:1,format:'authored_schedule',scope,contentHash:'b'.repeat(64),effectiveOn:'2026-01-01',baseInstructionId:null,baseInstructionVersion:0,reviewedUseBasis:{useRevision:0,latestEventId:null,amendmentHeadId:null},basisStatus:'changed',originalStart:unknown}));
 const pages:InstructionManifestPage[]=[];let cursor:string|null=null;
 for(let i=0;i<entries.length;i+=100){const items=entries.slice(i,i+100),nextCursor=i+100<entries.length?`r:${'a'.repeat(64)}:${items[items.length-1].instructionId}`:null;const page:InstructionManifestPage={schemaVersion:1,audience:'client',snapshot,total:2550,cursor,items,nextCursor};assert.ok(bytes(page)<=400000);assert.deepEqual(mapReviewResult(page,readReviewCommand({schemaVersion:1,action:'read_client_instruction_manifest_v1',snapshot,cursor,limit:100})),page);pages.push(page);cursor=nextCursor;}
 const manifest=collectInstructionManifest(view,pages);assert.equal(manifest.length,2550);assert.equal(pages.length,26);
 let totalDetailBytes=0,firstDetail:InstructionDetail|null=null;
 for(const item of manifest){
  const body:Extract<GuidanceBody,{kind:'instruction'}>={kind:'instruction',publication,slotId:item.scope.slotId,productId:item.scope.productId,baseInstructionId:null,baseInstructionVersion:0,useBasis:item.reviewedUseBasis,directions:Array.from({length:7},()=> '🧴'.repeat(4000)),cautions:[],schedule,reason:'actual reviewed change',effectiveOn:item.effectiveOn,reviewId:null};
  const fill=120000-bytes(body)-3;body.directions.push('🧴'.repeat(Math.floor(fill/4))+'x'.repeat(fill%4));assert.equal(bytes(body),120000);
  const detail:InstructionDetail={schemaVersion:1,audience:'client',snapshot,item,content:{format:'authored_schedule',body},publishedBy:third,publishedAt:now};assert.ok(bytes(detail)<=400000);totalDetailBytes+=bytes(detail);
  assert.deepEqual(mapReviewResult(detail,readReviewCommand({schemaVersion:1,action:'read_client_instruction_v1',snapshot,instructionId:item.instructionId,version:item.version,contentHash:item.contentHash})),detail);if(firstDetail===null)firstDetail=detail;
 }
 assert.ok(totalDetailBytes>300000000,'all full bodies require many bounded reads, never a larger response cap');
 assert.ok(firstDetail);assert.deepEqual(bindInstructionForScope(view,manifest,firstDetail.item.scope,firstDetail),firstDetail);
 const wrongStart={...firstDetail,item:{...firstDetail.item,originalStart:{state:'known' as const,value:'2024-02-29'}}};assert.throws(()=>bindInstructionForScope(view,[wrongStart.item,...manifest.slice(1)],wrongStart.item.scope,wrongStart));
 t.diagnostic(JSON.stringify({documentBytes:bytes(content),v3Bytes:bytes(view),reportedPageBytes:bytes(view.use.reportedProducts),scopeCount:manifest.length,manifestPageCount:pages.length,maxManifestPageBytes:Math.max(...pages.map(bytes)),allDetailBytes:totalDetailBytes,detailBodyBytes:120000,pausedProducts:50}));
});
test('legacy instruction detail retains original source facts while declaring its unversioned review basis',async()=>{
 const {snapshot,item,detail}=await instructionFixture(),legacyPublication={version:1,documentSchemaVersion:2} as const;
 const legacySnapshot={...snapshot,publication:legacyPublication,currentPublication:legacyPublication,useHead:1};
 const legacyItem={...item,format:'legacy_usage',scope:{publication:legacyPublication,slotId:'moisturizer',productId:'CeraVe_PM'},reviewedUseBasis:null,basisStatus:'legacy_unversioned',originalStart:unknown};
 const revision={id,version:1,slot:'moisturizer',productId:'CeraVe_PM',planVersion:1,usage:{periods:['evening'],order:1,short:{morning:null,evening:'apply gently'},instructions:['apply gently']},reason:'actual original instruction',reviewId:null,effectiveOn:'2024-02-29',source:{kind:'baseline',publicationVersion:1,recommendationId:null},originalStartedOn:'2024-02-29',authorId:third,createdAt:now};
 const legacy={...detail,snapshot:legacySnapshot,item:legacyItem,content:{format:'legacy_usage',revision}};
 const command=readReviewCommand({schemaVersion:1,action:'read_client_instruction_v1',snapshot:legacySnapshot,instructionId:id,version:1,contentHash:item.contentHash});
 assert.deepEqual(mapReviewResult(legacy,command),legacy);
 assert.throws(()=>mapReviewResult({...legacy,content:{format:'legacy_usage',revision:{...revision,privateReference:'private'}}},command));
 assert.throws(()=>mapReviewResult({...legacy,item:{...legacyItem,basisStatus:'current'}},command));
});
test('historical documents label current-for-selected instructions and never carry another publication instruction',async()=>{
 const {view,snapshot,page,item}=await instructionFixture();
 const historicalSnapshot={...snapshot,currentPublication:{version:2,documentSchemaVersion:3 as const}};
 const historical={...view,currentGuidance:{...view.currentGuidance!,mode:'historical_document',snapshot:historicalSnapshot}};
 const command=readReviewCommand({schemaVersion:1,action:'read_client_plan_v3',version:1});assert.deepEqual(mapReviewResult(historical,command),historical);
 const read=readReviewCommand({schemaVersion:1,action:'read_client_instruction_manifest_v1',snapshot:historicalSnapshot,cursor:null,limit:100});
 assert.throws(()=>mapReviewResult({...page,snapshot:historicalSnapshot,items:[{...item,scope:{...item.scope,publication:historicalSnapshot.currentPublication}}]},read));
 assert.deepEqual(decodePortalReviewResponse('review',read,409,{code:'guidance_conflict'}),{state:'rejected',status:409,code:'guidance_conflict'});
});
test('new decision write binds the exact current guidance snapshot and returns only canonical decision acknowledgement',async()=>{
 const {snapshot}=await instructionFixture();
 const command={schemaVersion:1,action:'record_decision_v2',requestId:id,expectedDecisionRevision:0,publicationVersion:1,decisionId:'decision_cerave',choice:'approved',reason:null,snapshot};
 const parsed=readReviewCommand(command);
 const receipt={requestId:id,action:'record_decision_v2',snapshot,decisionRevision:1,publicationVersion:1,decisionId:'decision_cerave',choice:'approved',reason:null};
 assert.deepEqual(mapReviewResult(receipt,parsed),receipt);assert.equal(portalReviewAccess('review','record_decision_v2','client'),'WRITE');assert.equal(portalReviewAccess('review','record_decision_v2','task_agent'),'DENY');
 for(const bad of [{...command,expectedDecisionRevision:1},{...command,publicationVersion:2},{...command,snapshot:{...snapshot,currentPublication:{...publication,version:2}}},{...command,startedOn:'2024-02-29'},{...command,paymentClaimId:other}])assert.throws(()=>readReviewCommand(bad));
 for(const bad of [{...receipt,decisionRevision:0},{...receipt,choice:'declined'},{...receipt,snapshot:{...snapshot,instructionHead:2}},{...receipt,firstServiceStarted:false},{...receipt,actualUse:[]}])assert.throws(()=>mapReviewResult(bad,parsed));
 const status=readReviewCommand({schemaVersion:1,action:'request_status_v1',requestId:id});assert.deepEqual(mapReviewResult({status:'committed',receipt},status),{status:'committed',receipt});
 assert.deepEqual(decodePortalReviewResponse('review',parsed,200,{unexpected:'success'}),{state:'uncertain',status:503,code:'uncertain',retry:parsed});
 assert.deepEqual(decodePortalReviewResponse('review',parsed,409,{code:'guidance_version_required'}),{state:'rejected',status:409,code:'guidance_version_required'});
});
test('decision acknowledgement provenance is bounded to actual choices and stable clinical content, not counter/day/bookkeeping',async()=>{
 const {view,snapshot}=await instructionFixture();
 const current={...snapshot,decisionRevision:1};
 const acknowledgement={decisionId:'selected',recordedDecisionRevision:1,acceptedSnapshot:snapshot,basisStatus:'current'};
 const chosen={...view,decisionRevision:1,decisions:[{decisionId:'selected',choice:'approved',reason:null}],currentGuidance:{...view.currentGuidance!,snapshot:current},decisionGuidance:[acknowledgement]};
 const read=readReviewCommand({schemaVersion:1,action:'read_client_plan_v3',version:1});
 assert.deepEqual(mapReviewResult(chosen,read),chosen);
 const {decisionGuidance:_missing,...missing}=chosen;assert.throws(()=>mapReviewResult(missing,read));
 for(const decisionGuidance of [[],[acknowledgement,acknowledgement],[{...acknowledgement,decisionId:'untouched'}],[{...acknowledgement,acceptedSnapshot:null}]])assert.throws(()=>mapReviewResult({...chosen,decisionGuidance},read));
 const later={...chosen,decisionRevision:2,currentGuidance:{...chosen.currentGuidance,snapshot:{...current,decisionRevision:2,asOfDay:'2026-01-02',serviceRevision:20}}};assert.deepEqual(mapReviewResult(later,read),later);
 const changed={...later,currentGuidance:{...later.currentGuidance,snapshot:{...later.currentGuidance.snapshot,manifestHash:'d'.repeat(64)}}};assert.throws(()=>mapReviewResult(changed,read));
 const stale={...changed,decisionGuidance:[{...acknowledgement,basisStatus:'stale'}]};assert.deepEqual(mapReviewResult(stale,read),stale);assert.equal(stale.decisions[0].choice,'approved');
 const legacy={...later,decisionGuidance:[{...acknowledgement,acceptedSnapshot:null,recordedDecisionRevision:2,basisStatus:'legacy_unbound'}]};assert.deepEqual(mapReviewResult(legacy,read),legacy);
 const unprovable={...legacy,decisionGuidance:[{...legacy.decisionGuidance[0],recordedDecisionRevision:null}]};assert.deepEqual(mapReviewResult(unprovable,read),unprovable);
 assert.throws(()=>mapReviewResult({...chosen,decisionGuidance:[{...acknowledgement,acceptedSnapshot:{...snapshot,publication:{...publication,version:2},currentPublication:{...publication,version:2}}}]},read));
 const historical={...chosen,currentGuidance:{...chosen.currentGuidance,mode:'historical_document',snapshot:{...current,currentPublication:{...publication,version:2}}}};assert.deepEqual(mapReviewResult(historical,read),historical);
});
test('legacy public review and reply retain exact original fields with unknown publication rather than fake linkage',()=>{
 const review={id,channel:'call',occurredOn:'2024-02-29',summary:'actual legacy summary',reportedUse:'actual client use report',decision:'no change',nextReviewOn:null,authorId:third,authorLabel:'Review with your advisor',recordedAt:now};
 const page={...history,entries:[{kind:'legacy_review',publication:null,review},{kind:'legacy_reply',id:other,report:{kind:'legacy_report',id},reply:'actual old reply',recordedBy:third,recordedAt:now,publication:null}]};
 assert.deepEqual(mapReviewResult(page,readReviewCommand(readHistory)),page);
 assert.throws(()=>mapReviewResult({...page,entries:[{...page.entries[0],review:{...review,privateNote:'PRIVATE'}}]},readReviewCommand(readHistory)));
 assert.throws(()=>mapReviewResult({...page,version:1},readReviewCommand({...readHistory,version:1})));
});
test('mixed history has one public event per canonical record and preserves actual legacy instruction version',()=>{
 const review={id:other,channel:'call',occurredOn:'2024-02-29',summary:'legacy summary',reportedUse:'legacy use',decision:'legacy decision',nextReviewOn:null,authorId:third,authorLabel:'Review with your advisor',recordedAt:now};
 const instruction={id,version:2,slot:'moisturizer',productId:'CeraVe_PM',planVersion:2,usage:{periods:['evening'],order:1,short:{morning:null,evening:'original short'},instructions:['original instructions']},reason:'original reason',reviewId:null,effectiveOn:'2024-02-29',source:{kind:'activation',publicationVersion:1,recommendationId:'original-decision'},originalStartedOn:'2024-02-20',authorId:third,createdAt:now};
 const entry={kind:'legacy_instruction',revision:instruction};
 const page={...history,version:2,entries:[entry]};
 assert.deepEqual(mapReviewResult(page,readReviewCommand({...readHistory,version:2})),page);
 assert.throws(()=>mapReviewResult({...page,version:1},readReviewCommand({...readHistory,version:1})));
 assert.throws(()=>mapReviewResult({...page,entries:[entry,{...entry,revision:{...instruction,version:3}}]},readReviewCommand({...readHistory,version:2})));
 const mixed={...history,entries:[{kind:'legacy_review',publication:null,review},{kind:'guidance',guidance:{record:{kind:'review',id:other},body,publishedBy:third,publishedAt:now,originalStart:null}}]};
 assert.throws(()=>mapReviewResult(mixed,readReviewCommand(readHistory)));
});
test('legacy review notes retain empty text with unknown attribution only in unfiltered private history',()=>{
 const entry={kind:'legacy_review_note',reviewId:id,note:''};
 const page={...history,audience:'advisor',clientId:other,entries:[entry,{...entry,reviewId:third,note:'PRIVATE_LEGACY_NOTE'}]};
 const command=readReviewCommand({...readHistory,action:'read_advisor_care_history_v1',clientId:other});
 assert.deepEqual(mapReviewResult(page,command),page);
 for(const injected of [{recordedBy:id},{recordedAt:now},{publication}, {authorId:third}])assert.throws(()=>mapReviewResult({...page,entries:[{...entry,...injected}]},command));
 assert.throws(()=>mapReviewResult({...page,entries:[entry,entry]},command));
 assert.throws(()=>mapReviewResult({...page,version:1},readReviewCommand({...command,version:1})));
 assert.throws(()=>mapReviewResult({...history,entries:[entry]},readReviewCommand(readHistory)));
});
test('advisor reported-product paging is a closed safe READ with the retained positive current-state page',()=>{
 const request={schemaVersion:1,action:'read_advisor_reported_products_v1',clientId:other,cursor:null,limit:100,expectedUseRevision:2,publicationVersion:1};
 const command=readReviewCommand(request),page={revision:2,items:[],nextCursor:null};
 assert.deepEqual(command,request);assert.deepEqual(mapReviewResult(page,command),page);
 assert.equal(buildReviewRpc(command).name,'concierge_review_command_v1');
 assert.equal(portalReviewAccess('review',command.action,'human'),'READ');
 for(const audience of ['client','task_agent'] as const)assert.equal(portalReviewAccess('review',command.action,audience),'DENY');
 for(const delta of [{limit:0},{limit:101},{clientId:null},{expectedUseRevision:null},{publicationVersion:0},{cursor:`r:${'a'.repeat(64)}:${id}`},{requestId:id}])assert.throws(()=>readReviewCommand({...request,...delta}));
 const cursor=`c:${'a'.repeat(64)}:${id}`;assert.equal((readReviewCommand({...request,cursor}) as typeof request).cursor,cursor);
 assert.equal((readReviewCommand({...request,publicationVersion:null}) as typeof request).publicationVersion,null);
 for(const delta of [{revision:1},{privateNote:'PRIVATE'},{sourceId:id}])assert.throws(()=>mapReviewResult({...page,...delta},command));
 assert.throws(()=>mapReviewResult({status:'committed',receipt:page},readReviewCommand({schemaVersion:1,action:'request_status_v1',requestId:id})));
});
test('private guidance basis uses a complete source manifest rather than a capped inline source list',()=>{
 const {sources:_old,...rest}=basis as unknown as Record<string,unknown>;
 const captured={...rest,sourceManifest:{schemaVersion:1,hash:'f'.repeat(64),count:101}};
 const value={...draft,capturedBasis:captured,currentBasis:captured};const command=readGuidanceCommand({schemaVersion:1,action:'read_guidance_draft_v1',draftId:id});
 assert.deepEqual(mapGuidanceResult(value,command),value);
 for(const sourceManifest of [{schemaVersion:1,hash:'f'.repeat(64),count:-1},{schemaVersion:1,hash:'f'.repeat(64),count:100001},{schemaVersion:1,hash:'bad',count:101},{schemaVersion:1,hash:'f'.repeat(64),count:101,sources:[source]}])assert.throws(()=>mapGuidanceResult({...value,capturedBasis:{...captured,sourceManifest}},command));
 assert.throws(()=>mapGuidanceResult({...value,capturedBasis:{...captured,sources:[source]}},command));
 assert.throws(()=>mapReviewResult({...history,entries:[{kind:'guidance',guidance:{record:{kind:'review',id:other},body,publishedBy:third,publishedAt:now,originalStart:null,sourceManifest:captured.sourceManifest}}]},readReviewCommand(readHistory)));
});

// Compiler checks use actual imports with --strict and unchanged compiler settings.
if(false){
 // @ts-expect-error no caller-supplied private sources in a goal report
 const badReport:GoalReportBody={...report,sources:[]};
 // @ts-expect-error cross-kind scope cannot be treated as a care-plan approval
 const badApproval:GuidanceApproval={...approval,scope:'care_plan.publish'};
 // @ts-expect-error a reply scope cannot authorize a review target
 const wrongKindApproval:GuidanceApproval={...approval,scope:'reply.publish'};
 // @ts-expect-error an amended report must retain its actual actor
 const badAmendment:ReportAmendment={id, event:{kind:'goal_report',id},previousAmendmentHeadId:null,replacement:{kind:'goal_report',body:report},occurredOn:unknown,reason:'reason',recordedAt:now,attention:null};
 // @ts-expect-error a new decision write cannot omit its exact guidance snapshot
 const badDecision:Extract<ReviewCommand,{action:'record_decision_v2'}>={schemaVersion:1,action:'record_decision_v2',requestId:id,expectedDecisionRevision:0,publicationVersion:1,decisionId:'choice',choice:'approved',reason:null};
 // @ts-expect-error public consistency tokens never contain raw-source locators
 const badSnapshot:GuidanceReadSnapshot={publication,currentPublication:publication,useHead:0,reportHead:0,instructionHead:0,serviceRevision:0,decisionRevision:0,asOfDay:'2026-01-01',manifestHash:'a'.repeat(64),sourceId:id};
 // @ts-expect-error the private manifest replaces a misleading partial inline source list
 const badBasis:GuidanceBasis={...basis,sources:[]};
 void [badReport,badApproval,wrongKindApproval,badAmendment,badDecision,badSnapshot,badBasis];
}
