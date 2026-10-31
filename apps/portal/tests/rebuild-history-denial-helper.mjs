// Finite synthetic HTTP; actual retained session/factory, Root mapping,
// HistoryController and SSR. No browser or successful port/current replacement.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {createApplicationSession} from '../src/app/session.ts';
import {createClientReviewRequest} from '../src/app/review-request.ts';
import {createHistoryPort} from '../src/features/history/port.ts';
import {createHistoryController} from '../src/features/history/controller.ts';
import {readReviewCommand} from '../../../src/contracts/PortalReviewValidation.ts';
import {view,page,owner,uid,receipt,deferred} from './rebuild-history-helper.mjs';
export {owner,uid,receipt,deferred};
const root=path.resolve(import.meta.dirname,'../../..'),portal=path.join(root,'apps/portal');
const area=path.join(root,'.local-artifacts/portal-rebuild/w4-history-rh1',process.env.W4_RH1_SOURCE_RUN??'current');
await mkdir(area,{recursive:true});
await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['tests/rebuild-history-ssr-entry.tsx'],outfile:path.join(area,'ssr.cjs'),platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});
const m=createRequire(import.meta.url)(path.join(area,'ssr.cjs'));
export function basis(version=1,head=0,label='CURRENT_PRIVATE_PLAN'){
  const v=view();v.plan.version=version;v.plan.content.title=label;
  v.currentGuidance.snapshot.publication.version=version;
  v.currentGuidance.snapshot.currentPublication.version=version;
  v.currentGuidance.snapshot.reportHead=head;
  v.use.planProducts.forEach(s=>s.product.publication.version=version);
  return v;
}
export function history(version=1,head=0){const p=page();p.heads.publicationVersion=version;p.heads.reportHead=head;p.nextCursor=`r:${'a'.repeat(64)}:${uid(800)}`;p.entries=[{kind:'guidance',guidance:{record:{kind:'review',id:uid(110)},body:{kind:'review',publication:{version,documentSchemaVersion:3},reportRefs:[],occurredOn:{state:'unknown'},channel:'text',clientReport:'PRIVATE_HISTORY_REPORT',conclusion:'PRIVATE_HISTORY_CONCLUSION',rationale:'PRIVATE_HISTORY_REASON',changes:[],nextStep:'PRIVATE_HISTORY_NEXT_STEP',nextReviewOn:null},publishedBy:uid(111),publishedAt:'2026-10-24T12:00:00Z',originalStart:null}}];return p;}
export async function denialFixture(t){
  let respond=null,current=basis(),first=history(),uuidCalls=0;
  let login={signedIn:true,ownerId:owner,generation:1,csrf:'rh1-synthetic-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+7200000).toISOString()};
  const calls=[];
  const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
    assert.ok(['/api/client/session','/api/client/reviews','/api/client/logout'].includes(url));
    if(url==='/api/client/session')return Response.json(login);
    if(url==='/api/client/logout')return Response.json({signedOut:true});
    assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
    assert.equal(new Headers(init.headers).get('x-shelv-csrf'),login.csrf);assert.equal(new Headers(init.headers).has('authorization'),false);
    const command=readReviewCommand(JSON.parse(init.body));calls.push({command,wire:init.body});
    const result=await respond?.(command);
    if(result)return result;
    return Response.json(command.action==='read_client_plan_v3'?current:command.action==='read_care_history_v1'?first:{status:'absent'});
  }});
  await runtime.restore();const boundary=runtime.getSnapshot().boundary;
  const port=createHistoryPort(runtime,createClientReviewRequest(runtime));
  const controllers=[];
  const make=()=>{const c=createHistoryController({session:boundary,mode:'client',port},()=>uid(2000+uuidCalls++));controllers.push(c);return c;};
  const controller=make();t.after(()=>{controllers.forEach(c=>c.dispose());runtime.dispose();});
  return {runtime,boundary,port,controller,calls,make,uuidCalls:()=>uuidCalls,
    context:()=>({session:boundary,mode:'client',port}),
    data(v,p){current=v;first=p;},
    respond(fn){respond=fn;},login(patch){login={...login,...patch};},
    html(c=controller,screen='history'){return m.renderToStaticMarkup(m.createElement(m.ClientHistory,{controller:c,screen,navigation:{openUpdate(){},back(){}}}));},
  };
}
export function addNote(c,text='RH1_UNSENT_NOTE'){const i=structuredClone(c.getSnapshot().intent);i.body.notes=text;c.edit(i);}
export async function uncertain(f){
  await f.controller.load();f.controller.startReport();addNote(f.controller);
  f.respond(c=>c.action==='submit_goal_report_v1'?Response.json({code:'unavailable'},{status:503}):null);
  await f.controller.submit();await f.runtime.restore();
  const pending=f.controller.getSnapshot().pending,wire=f.calls.find(c=>c.command.action==='submit_goal_report_v1').wire;
  assert.equal(f.controller.getSnapshot().mutation,'uncertain');assert.equal(JSON.stringify(pending),wire);
  return {pending,wire,intent:f.controller.getSnapshot().intent};
}
export function denyContinuation(f){f.respond(c=>c.action==='read_care_history_v1'&&c.cursor?Response.json({code:'forbidden'},{status:403}):null);return f.controller.loadMore();}
