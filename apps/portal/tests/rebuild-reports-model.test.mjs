import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildReportCommand,appendHistory,emptyBody,historyKey} from '../src/features/history/model.ts';
import {readReviewCommand,goalReportHasObservation} from '../../../src/contracts/PortalReviewValidation.ts';
import {mapReviewResult} from '../../../src/contracts/PortalReviewMapping.ts';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const publication={version:1,documentSchemaVersion:3};
const body=()=>emptyBody(publication);
const intent=()=>({kind:'new',body:body(),occurredOn:{state:'unknown'}});
const page=()=>({schemaVersion:1,audience:'client',version:null,heads:{useHead:0,reportHead:0,instructionHead:0,serviceRevision:1,publicationVersion:1},entries:[],nextCursor:null});
test('source-bound optional reports preserve IDs/text and never accept an unselected use UUID or photo',()=>{
  const i=intent();i.body.answers=[{goalId:'authored-goal',change:'not_sure'}];i.body.notes=' Kept exactly ';
  const c=buildReportCommand(i,2,id(1),['authored-goal'],[]);
  assert.deepEqual(readReviewCommand(c),c);assert.equal(c.body.notes,' Kept exactly ');
  assert.throws(()=>buildReportCommand(i,2,id(2),['Other.Goal'],[]));
  i.body.actualUseEventIds=[id(8)];assert.throws(()=>buildReportCommand(i,2,id(2),['authored-goal'],[]));
  i.body.actualUseEventIds=[];i.body.photoIds=[id(9)];assert.throws(()=>buildReportCommand(i,2,id(2),['authored-goal'],[]));
});
test('empty and whitespace-only reports are structurally valid and only a no-observation receipt maps',()=>{
  const i=intent();i.body.notes=' \t\n';
  const c=buildReportCommand(i,3,id(3),[],[]);assert.equal(goalReportHasObservation(c.body),false);
  const receipt={requestId:id(3),action:c.action,outcome:'no_op',reason:'no_observation',revision:3,event:null,amendmentId:null,notificationEventId:null,attentionEventId:null};
  assert.deepEqual(mapReviewResult(receipt,c),receipt);
  assert.throws(()=>mapReviewResult({...receipt,revision:4},c));
  assert.throws(()=>mapReviewResult({requestId:id(3),action:c.action,event:{kind:'goal_report',id:id(4)},amendmentId:null,revision:4,recordedAt:'2026-10-01T00:00:00Z',notificationEventId:id(5),attentionEventId:id(6)},c));
});
test('pagination refuses changed heads, terminal continuation and duplicate identities across pages',()=>{
  const first=page();first.nextCursor=`r:${'a'.repeat(64)}:${id(9)}`;
  first.entries=[{kind:'publication',publication,publishedAt:'2026-10-01T00:00:00Z',recordedBy:id(20)}];
  const second=page();second.heads.reportHead=1;
  assert.throws(()=>appendHistory([first],second));
  assert.throws(()=>appendHistory([page()],page()));
  second.heads.reportHead=0;second.entries=first.entries;
  assert.throws(()=>appendHistory([first],second));
});
test('distinct attention transitions use event identity, never stable attention identity',()=>{
  const base={kind:'review_attention',publication,amendmentId:id(1),event:{kind:'goal_report',id:id(2)},attention:{id:id(3),priorReview:{kind:'review',id:id(4)},state:'unresolved',resolvedBy:null},recordedAt:'2026-10-01T00:00:00Z'};
  assert.notEqual(historyKey({...base,eventId:id(5)}),historyKey({...base,eventId:id(6),attention:{...base.attention,state:'resolved',resolvedBy:{kind:'review',id:id(7)}}}));
});
