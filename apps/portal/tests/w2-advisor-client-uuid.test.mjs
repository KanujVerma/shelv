// Same UUID identity under the actual fixed scoped adapter; no Auth/SQL resource.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createAdvisorClientPlansRequest} from '../src/app/advisor-client-plans-request.ts';
import {createAdvisorClientWorkspaceController} from '../src/features/advisor/client-workspace/controller.ts';
const client='abcdefab-cdef-4abc-8def-abcdefabcdef',draftId='fedcbafe-dcba-4fed-8abc-fedcbafedcba',actor='10000000-0000-4000-8000-000000000004';
async function setup(t,inputClient,rowClient,rowId=draftId,duplicate=false){
 let c;const calls=[];const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url==='/api/advisor/session')return Response.json({signedIn:true,ownerId:actor,generation:1,csrf:'SYNTHETIC-uuid-scope',capabilities:{view:true,edit:true,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
  assert.equal(url,'/api/advisor/plans');const command=JSON.parse(init.body);calls.push(command);assert.equal(command.clientId,client);
  const row={id:rowId,clientId:rowClient,state:'working',contentRevision:1,assignmentRevision:1,savedAt:'2026-11-03T12:00:00Z'};
  return Response.json({nextCursor:null,drafts:duplicate?[row,{...row,id:row.id.toUpperCase()}]:[row],publications:[{clientId:rowClient,version:1,publishedAt:'2026-11-03T12:00:00Z',documentSchemaVersion:3}]});
 }});t.after(()=>{c?.dispose();runtime.dispose()});await runtime.restore();
 c=createAdvisorClientWorkspaceController({runtime,clientId:inputClient,readPlans:createAdvisorClientPlansRequest(runtime,inputClient)});await c.refresh();return{c,calls};
}
for(const[input,row,id]of[[client.toUpperCase(),client,draftId],[client,client.toUpperCase(),draftId.toUpperCase()],['AbCdEfAb-CdEf-4aBc-8dEf-AbCdEfAbCdEf','aBcDeFaB-cDeF-4AbC-8DeF-aBcDeFaBcDeF',draftId]])test('scoped UUID case is canonical for '+input+' and '+row,async t=>{
 const h=await setup(t,input,row,id),s=h.c.getSnapshot();assert.equal(s.phase,'ready');assert.equal(s.clientId,client);assert.equal(s.directory.drafts[0].clientId,s.clientId);assert.equal(s.directory.publications[0].clientId,s.clientId);assert.equal(s.directory.drafts[0].id,draftId);assert.equal(h.calls.length,1);
});
test('case folding cannot accept an actually different client',async t=>{const h=await setup(t,client.toUpperCase(),'BBBBBBBB-BBBB-4BBB-8BBB-BBBBBBBBBBBB');assert.equal(h.c.getSnapshot().directory,null);assert.notEqual(h.c.getSnapshot().phase,'ready');});
test('case variants of one draft identity cannot create duplicate visible records',async t=>{const h=await setup(t,client,client,draftId,true);assert.equal(h.c.getSnapshot().directory,null);assert.notEqual(h.c.getSnapshot().phase,'ready');});
