import type {PlanDirectoryV2Command,PlanDirectoryV2Draft,PlanDirectoryV2Row,PlanDirectoryV2View} from './PortalPlanDirectoryV2.ts';
import {requireValue} from './ConciergePortalValidation.ts';
import {readReviewShape,reviewJsonBytes} from './PortalReviewValidation.ts';
import {careObject as object,careArray as array,careEnum as member,careNull as nullable,careUnion as union,careKnown as known,careUuid as uuid,careRevision as revision,carePositive as positive,careInstant as instant} from './PortalCareValidation.ts';
import {planDirectoryV2CommandMaxBytes,planDirectoryV2ResultMaxBytes,planDirectoryV2CursorMaxBytes,planDirectoryV2PageMax,planDirectoryV2Filters,planDirectoryV2WorkflowValues} from './PortalPlanDirectoryV2Values.ts';
const cursor=nullable({type:'text',max:planDirectoryV2CursorMaxBytes,empty:false});
const title=known({type:'text',max:200,empty:true});
const filter=member(...planDirectoryV2Filters);
const commandShape=object({schemaVersion:member(2),action:member('list_advisor_plan_directory_v2'),clientId:nullable(uuid),filter,publisherContext:member('current_human'),cursor,limit:{...positive,max:planDirectoryV2PageMax}});
const draft=object({kind:member('draft'),id:uuid,clientId:nullable(uuid),state:member('working','published','archived'),contentRevision:revision,assignmentRevision:revision,savedAt:instant,title,review:member('needs_review','reviewed','unavailable'),workflow:known(member(...planDirectoryV2WorkflowValues))});
// Actual publications.version is a positive PostgreSQL integer, preserving its ten-digit live key.
const publication=object({kind:member('publication'),clientId:uuid,version:{...positive,max:2147483647},documentSchemaVersion:member(1,2,3),publishedAt:instant,title});
const viewShape=object({schemaVersion:member(2),clientId:nullable(uuid),filter,publisher:object({kind:member('human'),actorId:uuid}),consistency:member('live_keyset'),observedAt:instant,reviewClassification:member('complete','incomplete','unavailable'),rows:array(union(draft,publication),planDirectoryV2PageMax),nextCursor:cursor});
const freeze=<T>(value:T):T=>{if(value!==null&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
function scalars(value:string):void{for(const scalar of value){const code=scalar.codePointAt(0)!;requireValue(code<0xd800||code>0xdfff);}}
function checkCursor(value:string|null):void{if(value!==null){scalars(value);requireValue(new TextEncoder().encode(value).byteLength<=planDirectoryV2CursorMaxBytes&&!/[\u0000-\u001f\u007f]/.test(value));}}
function rowKey(row:PlanDirectoryV2Row):string{return row.kind==='draft'?`d:${row.id}`:`p:${row.clientId}:${String(row.version).padStart(10,'0')}`;}
function workflow(row:PlanDirectoryV2Draft):void{
 if(row.state!=='working')requireValue(row.review!=='needs_review');
 if(row.workflow.state==='unknown')return;
 const value=row.workflow.value;
 if(value==='published'||value==='archived'){requireValue(row.state===value);return;}
 requireValue(row.state==='working');
 if(value==='needs_review')requireValue(row.review==='needs_review');
 if(value==='approval_required'||value==='approved_awaiting_payment'||value==='ready_to_publish')requireValue(row.clientId!==null&&row.review==='reviewed');
}
export function readPlanDirectoryV2Command(input:unknown):PlanDirectoryV2Command{
 requireValue(reviewJsonBytes(input)<=planDirectoryV2CommandMaxBytes);
 const command=readReviewShape(input,commandShape) as PlanDirectoryV2Command;checkCursor(command.cursor);return freeze(command);
}
export function readPlanDirectoryV2View(input:unknown,command:PlanDirectoryV2Command):PlanDirectoryV2View{
 requireValue(reviewJsonBytes(input)<=planDirectoryV2ResultMaxBytes);
 const view=readReviewShape(input,viewShape) as PlanDirectoryV2View;checkCursor(view.nextCursor);
 requireValue(view.clientId===command.clientId&&view.filter===command.filter&&view.rows.length<=command.limit&&(view.nextCursor===null||view.rows.length===command.limit&&view.nextCursor!==command.cursor));
 let prior:string|undefined;
 for(const row of view.rows){
  const key=rowKey(row);requireValue(prior===undefined||prior<key);prior=key;
  if(command.clientId!==null)requireValue(row.clientId===command.clientId);
  if(command.filter==='unassigned')requireValue(row.kind==='draft'&&row.clientId===null);
  if(command.filter==='needs_review')requireValue(row.kind==='draft'&&row.state==='working'&&row.review==='needs_review');
  if(row.title.state==='known')scalars(row.title.value);
  const at=row.kind==='draft'?row.savedAt:row.publishedAt;requireValue(Date.parse(at)<=Date.parse(view.observedAt));
  if(row.kind==='draft'){
   workflow(row);if(view.reviewClassification==='complete'&&row.state==='working')requireValue(row.review!=='unavailable');
  }else if(row.documentSchemaVersion===1)requireValue(row.title.state==='unknown');
 }
 return freeze(view);
}
