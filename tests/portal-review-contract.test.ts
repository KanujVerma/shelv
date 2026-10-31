import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {GoalReportBody,ConversationBody,GuidanceBody,GuidanceTarget,GuidanceBasis,GuidanceDraftView,GuidanceApproval,ReportEvent,ReportAmendment,ClientCareHistoryPage,AdvisorCareHistoryPage,GuidanceReceipt} from '../src/contracts/PortalReview.ts';
import {readReviewCommand,readGuidanceCommand,buildReviewRpc,buildGuidanceRpc,goalReportHasObservation} from '../src/contracts/PortalReviewValidation.ts';
import {mapReviewResult,mapGuidanceResult,decodePortalReviewResponse} from '../src/contracts/PortalReviewMapping.ts';
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
const basis:GuidanceBasis={schemaVersion:1,publication,legacyBasis:{publicationVersion:1,useRevision:0},legacyBasisManifestHash:'e'.repeat(64),useHead:0,reportHead:1,instructionHead:0,references:[{event:{kind:'goal_report',id},amendmentHeadId:null}],sources:[]};
const publisher={kind:'human',actorId:third} as const;
const approval:GuidanceApproval={id:third,target,scope:'review.publish',publisher,approvedBy:third,approvedAt:now,policyRevision:1,revokedAt:null,receiptId:null};
const draft:GuidanceDraftView={target,body,capturedBasis:basis,currentBasis:basis,needsRebase:false,savedAt:now,recordedBy:third,review:null,approval:null,issues:[]};
const receipt:GuidanceReceipt={requestId:id,receiptId:third,target,approvalId:third,publisher,record:{kind:'review',id:other},publishedAt:now,notificationEventId:third};
const original:ReportEvent={kind:'goal_report',id,body:report,occurredOn:unknown,channel:'portal',reportedBy:other,recordedBy:other,recordedAt:now};
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
});
test('positive report receipts bind action, event kind, request and next report revision',()=>{
 const c=readReviewCommand(submit),r={requestId:id,action:'submit_goal_report_v1',event:{kind:'goal_report',id:other},amendmentId:null,revision:1,recordedAt:now,notificationEventId:third,attentionEventId:third};
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
 const omitted={schemaVersion:1,publication,useHead:0,reportHead:1,instructionHead:0,references:basis.references,sources:[]};
 assert.throws(()=>mapGuidanceResult({...draft,capturedBasis:omitted,currentBasis:omitted},readGuidanceCommand({schemaVersion:1,action:'read_guidance_draft_v1',draftId:id})));
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
 void [badReport,badApproval,wrongKindApproval,badAmendment];
}
