import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHistoryController} from '../src/features/history/controller.ts';
import {mapReviewResult} from '../../../src/contracts/PortalReviewMapping.ts';
import {harness,view,page,uid,owner,publication,receipt} from './rebuild-history-helper.mjs';

// Real controller, validator, mapper and SSR; the fixed Review endpoint is a
// controlled boundary. These are consumer regressions, not Auth/SQL proof.
const area=path.resolve(import.meta.dirname,'../../../.local-artifacts/w4/20261103/use-linkage');
await mkdir(area,{recursive:true});
await build({absWorkingDir:path.resolve(import.meta.dirname,'..'),tsconfig:'tsconfig.frontend.json',entryPoints:['tests/rebuild-history-ssr-entry.tsx'],outfile:path.join(area,'entry.cjs'),platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});
const m=(await import(pathToFileURL(path.join(area,'entry.cjs')).href)).default;
const {createElement:h,renderToStaticMarkup:render}=m;
const navigation={openUpdate(){},back(){}};

function reportedProduct({initial=true,amended=false}={}){
  const product={kind:'client_reported_product',reportedProductId:uid(901),version:initial?1:2};
  const attribution={occurredOn:{state:'known',value:'2026-10-20'},channel:'portal',reportedBy:owner,recordedBy:owner,recordedAt:'2026-10-21T12:00:00Z',sourcePublication:publication};
  const initialUse={...attribution,eventId:uid(902),product,change:{kind:'unreviewed_added',details:null},acquisition:'self',identityEventId:null,originalActivationId:null,amendment:amended?{
    id:uid(903),eventId:uid(902),previousAmendmentHeadId:null,
    replacement:{product,change:{kind:'paused',details:'Separate correction'},sourcePublication:publication,occurredOn:{state:'known',value:'2026-10-22'},acquisition:'self',identityEventId:null},
    amendedBy:owner,amendedAt:'2026-10-23T12:00:00Z',reason:'Reported later'
  }:null};
  return {kind:'reported_product',event:{...attribution,eventId:uid(902),product,descriptor:{name:'Client reported serum',brand:{state:'unknown'},variant:{state:'unknown'},strength:{state:'unknown'},sizeLabel:{state:'unknown'},labelPhotoIds:[]},previousVersion:initial?null:1,reason:initial?null:'Label correction',initialUse:initial?initialUse:null}};
}
async function ready(t,entries){
  const f=harness(),p=page();p.entries=entries;
  // Derive fixtures from the canonical positive mapper, not partial UI doubles.
  const mapped=mapReviewResult(p,{schemaVersion:1,action:'read_care_history_v1',version:null,cursor:null,limit:40});
  f.set(command=>({state:'ok',value:command.action==='read_client_plan_v3'?view():command.action==='submit_goal_report_v1'?receipt(command):mapped}));
  const controller=createHistoryController(f.context,()=>uid(910));
  t.after(()=>controller.dispose());await controller.load();controller.startReport();
  return {...f,controller};
}

test('a check-in submits the exact loaded initial-use event of a reported product',async t=>{
  const f=await ready(t,[reportedProduct()]);
  const intent=structuredClone(f.controller.getSnapshot().intent);
  intent.body.actualUseEventIds=[uid(902)];f.controller.edit(intent);
  await f.controller.submit();
  assert.equal(f.controller.getSnapshot().mutation,'confirmed');
  assert.deepEqual(f.calls.at(-1),{schemaVersion:1,action:'submit_goal_report_v1',requestId:uid(910),expectedReportRevision:0,body:{publication,answers:[],comfort:null,actualUseEventIds:[uid(902)],notes:null,photoIds:[]},occurredOn:{state:'unknown'}});
});

test('the optional use picker includes initial reports without replacing their date by a correction',async t=>{
  const f=await ready(t,[reportedProduct({amended:true})]);
  const html=render(h(m.ClientHistory,{controller:f.controller,screen:'update',navigation,productLabel:()=> 'Client reported serum'}));
  assert.match(html,/<button[^>]*>Client reported serum[^<]*unreviewed added[^<]*2026-10-20<\/button>/);
  assert.doesNotMatch(html,/no actual-use reports are loaded/);
});

test('a descriptor correction without an initial-use event cannot invent a selectable report',async t=>{
  const f=await ready(t,[reportedProduct({initial:false})]);
  const html=render(h(m.ClientHistory,{controller:f.controller,screen:'update',navigation}));
  assert.match(html,/no actual-use reports are loaded/);
  const intent=structuredClone(f.controller.getSnapshot().intent);
  intent.body.actualUseEventIds=[uid(902)];f.controller.edit(intent);await f.controller.submit();
  assert.equal(f.calls.filter(c=>c.action==='submit_goal_report_v1').length,0);
  assert.equal(f.controller.getSnapshot().mutation,'idle');
});

test('standalone use references still submit and an unknown event cannot cross the form boundary',async t=>{
  const event=reportedProduct().event.initialUse;
  const f=await ready(t,[{kind:'use',event}]);
  const intent=structuredClone(f.controller.getSnapshot().intent);
  intent.body.actualUseEventIds=[uid(999)];f.controller.edit(intent);await f.controller.submit();
  assert.equal(f.calls.filter(c=>c.action==='submit_goal_report_v1').length,0);
  intent.body.actualUseEventIds=[uid(902)];f.controller.edit(intent);await f.controller.submit();
  assert.equal(f.controller.getSnapshot().mutation,'confirmed');
  assert.deepEqual(f.calls.at(-1).body.actualUseEventIds,[uid(902)]);
});
