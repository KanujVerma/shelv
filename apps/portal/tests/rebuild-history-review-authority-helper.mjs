// Source/actual SSR only. Finite HTTP DTOs use the retained cookie/raw factory,
// canonical Root decoder and real controller; no successful port/current substitute.
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
import {denialFixture,basis,history,uncertain,receipt,deferred,addNote} from './rebuild-history-denial-helper.mjs';
export {denialFixture,basis,history,uncertain,receipt,deferred,addNote};
export const area=path.resolve(import.meta.dirname,'../../../.local-artifacts/portal-rebuild/w4-history-rh2',process.env.W4_RH2_SOURCE_RUN??'current');
await fs.mkdir(area,{recursive:true});
export const writeCalls=f=>f.calls.filter(x=>['submit_goal_report_v1','amend_report_v1'].includes(x.command.action));
export const statusReceipt=p=>Response.json({status:'committed',receipt:receipt(p)});
export async function observe(f,name){
 const state=f.controller.getSnapshot(),r=f.runtime,b=r.getSnapshot().boundary;
 const calls=structuredClone(f.calls),wireEvidence=writeCalls(f).map(c=>({requestId:c.command.requestId,bytes:Buffer.byteLength(c.wire),sha256:createHash('sha256').update(c.wire).digest('hex')}));
 await fs.writeFile(path.join(area,name+'.json'),JSON.stringify({state,historyHTML:f.html(),updateHTML:f.html(f.controller,'update'),calls,wireEvidence,session:{status:r.cookie.status,boundary:b?.key,current:b?.isCurrent(),owner:r.cookie.identity?.ownerId,generation:r.cookie.generation,epoch:r.cookie._epoch}},null,2));
}
export async function heldOriginal(t,f,operation){
 const entered=deferred(),held=deferred();let work;
 t.after(()=>held.resolve(Response.json({code:'unavailable'},{status:503})));
 if(operation==='status'){
  await uncertain(f);f.respond(c=>{if(c.action==='request_status_v1'){entered.resolve();return held.promise;}return null;});work=f.controller.checkStatus();
 }else{
  await f.controller.load();f.controller.startReport();addNote(f.controller,'RH2_ORIGINAL_A');
  f.respond(c=>{if(c.action==='submit_goal_report_v1'){entered.resolve();return held.promise;}return null;});work=f.controller.submit();
 }
 await entered.promise;const pending=f.controller.getSnapshot().pending,wire=writeCalls(f)[0].wire,intent=f.controller.getSnapshot().intent;
 assert.equal(JSON.stringify(pending),wire);
 return {pending,wire,intent,work,release(){held.resolve(operation==='status'?statusReceipt(pending):Response.json(receipt(pending)));}};
}
export async function fullDenial(f,stage='history'){
 f.respond(c=>c.action===(stage==='plan'?'read_client_plan_v3':'read_care_history_v1')?Response.json({code:'forbidden'},{status:403}):null);
 await f.controller.load();assert.equal(f.controller.getSnapshot().phase,'denied');
}
export async function displayedReturn(f,{version=1,head=1,readonly=true}={}){
 f.respond(null);
 if(readonly){const v=basis(version,head,'RH2_DISPLAYED_READ_ONLY');v.access='read_only';f.data(v,history(version,head));await f.controller.load();assert.match(f.html(),/read-only record/);}
 f.data(basis(version,head,'RH2_DISPLAYED_ACTIVE'),history(version,head));await f.controller.load();
 assert.match(f.html(f.controller,'update'),/current fetched record/);assert.equal(f.controller.getSnapshot().needsReview,true);
 return f.controller.getSnapshot().view;
}
export async function freshCommandRequiresReview(f,original,{version=1,head=1}={}){
 // These are actual controller navigation/start/edit actions, rendered via SSR.
 // Browser navigation remains a separate, currently ungranted proof level.
 await f.controller.load();f.controller.startReport();addNote(f.controller,'RH2_NEW_B');
 const before=writeCalls(f).length,uuids=f.uuidCalls();await f.controller.submit();
 assert.equal(writeCalls(f).length,before,'a historical receipt cannot unlock a fresh mutation');assert.equal(f.uuidCalls(),uuids);
 assert.match(f.html(f.controller,'update'),/review the current record/);assert.equal(f.controller.getSnapshot().needsReview,true);
 await f.controller.reviewCurrent();assert.equal(f.controller.getSnapshot().needsReview,false);
 f.respond(c=>c.action==='submit_goal_report_v1'?Response.json(receipt(c)):null);await f.controller.submit();
 const next=writeCalls(f).at(-1);assert.notEqual(next.command.requestId,original.requestId);assert.equal(next.command.expectedReportRevision,head);assert.equal(next.command.body.publication.version,version);assert.equal(next.command.body.notes,'RH2_NEW_B');assert.equal(writeCalls(f).length,before+1);
}
