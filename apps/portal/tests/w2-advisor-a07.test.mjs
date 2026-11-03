// Permitted A07 UI only. Finite synthetic HTTP + SSR, never held audit clearance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createAdvisorGuidanceController} from '../src/features/advisor/guidance/controller.ts';
import {guidanceApp,selection,ids,clone} from './rebuild-advisor-guidance-fixture.mjs';
// Explicit OLD control: only this component comes from the frozen baseline.
// All canonical dependencies remain the unchanged baseline files in this branch.
const original=process.env.W2_A07_ORIGINAL==='1' ? execFileSync('git',['show','8c5c6b2d72e75f620487f1b2b110655b03551b17:apps/portal/src/features/advisor/guidance/AdvisorGuidanceWorkspace.tsx'],{cwd:new URL('..',import.meta.url),encoding:'utf8'}) : null;
const plugins=original ? [{name:'frozen-original-component',setup(b){b.onLoad({filter:/guidance\/AdvisorGuidanceWorkspace\.tsx$/},()=>({contents:original,loader:'tsx'}));}}] : [];
const output=new URL('../../../.local-artifacts/w2/a07-ssr.cjs',import.meta.url);
await mkdir(new URL('.',output),{recursive:true});
await build({plugins,absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{contents:`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{AdvisorGuidanceWorkspace}from'./src/features/advisor/guidance/AdvisorGuidanceWorkspace.tsx';export const render=(props)=>renderToStaticMarkup(React.createElement(AdvisorGuidanceWorkspace,props));`,resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},outfile:output.pathname,platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});
const {render}=createRequire(import.meta.url)(output.pathname);
const ref={kind:'goal_report',id:ids.report};
const html=(c,reportRef=ref)=>render({controller:c,reportRef,clientLabel:'Synthetic Client',navigation:{selection:c.getSnapshot().selection??selection,onSelect(){},onBack(){}}});

test('A07 missing selected report never substitutes another report or exposes drafting controls',async t=>{
 const h=await guidanceApp(t,createAdvisorGuidanceController);await h.c.open(selection);
 const markup=html(h.c,{kind:'goal_report',id:ids.other});
 assert.match(markup,/selected check-in unavailable/);
 assert.doesNotMatch(markup,/SYNTHETIC original comfort|prepare review|private working note|<textarea/);
});
test('A07 selected immutable report is shown before the public draft and binds private-note subject',async t=>{
 const h=await guidanceApp(t,createAdvisorGuidanceController);await h.c.open(selection);
 const markup=html(h.c);
 assert.match(markup,/selected check-in/);
 assert.ok(markup.indexOf('SYNTHETIC original comfort')<markup.indexOf('client-visible after publication'));
 assert.match(markup,/private advisor notes/);
 assert.match(markup,/attached to the selected check-in/);
 assert.doesNotMatch(markup,/attach private note to|prepare an instruction change/);
});
test('A07 report kind is part of identity, even if UUID matches',async t=>{
 const h=await guidanceApp(t,createAdvisorGuidanceController);await h.c.open(selection);
 const markup=html(h.c,{kind:'legacy_report',id:ids.report});
 assert.match(markup,/selected check-in unavailable/);
 assert.doesNotMatch(markup,/SYNTHETIC original comfort/);
});
test('A07 keeps an unrelated unsent reply and prevents preparing over it',async t=>{
 const h=await guidanceApp(t,createAdvisorGuidanceController);await h.c.open(selection);
 h.c.startDraft({...clone(h.data.body),kind:'reply',reportRef:{kind:'goal_report',id:ids.other},reply:'SYNTHETIC unrelated unsent reply',nextStep:null});
 const before=clone(h.c.getSnapshot().body),markup=html(h.c);
 assert.match(markup,/another guidance draft is open/);
 assert.doesNotMatch(markup,/SYNTHETIC unrelated unsent reply|<textarea[^>]*>SYNTHETIC unrelated/);
 assert.deepEqual(h.c.getSnapshot().body,before);
});
test('A07 denied private access does not render selected report, notes or actions',async t=>{
 const h=await guidanceApp(t,createAdvisorGuidanceController);h.override('read_advisor_care_history_v1',{code:'forbidden'},403);await h.c.open(selection);
 const markup=html(h.c);
 assert.match(markup,/check-in access unavailable/);
 assert.doesNotMatch(markup,/SYNTHETIC original comfort|<textarea|prepare review/);
});

test('A07 correction-only history preserves original report and shows the attributed correction',async t=>{
 const h=await guidanceApp(t,createAdvisorGuidanceController);
 h.setHistory([{...clone(h.data.page),entries:[{kind:'report_amendment',original:clone(h.data.report),amendment:{id:ids.amend,event:ref,previousAmendmentHeadId:null,replacement:{kind:'goal_report',body:{...clone(h.data.report.body),notes:'SYNTHETIC corrected account'}},occurredOn:{state:'unknown'},reason:'SYNTHETIC correction reason',amendedBy:ids.client,recordedAt:'2026-10-02T12:00:00Z',attention:null}}]}]);
 await h.c.open(selection);const markup=html(h.c);
 assert.match(markup,/SYNTHETIC original comfort/);assert.match(markup,/SYNTHETIC corrected account/);assert.match(markup,/SYNTHETIC correction reason/);assert.match(markup,/amended by/);
 assert.equal((markup.match(/SYNTHETIC corrected account/g)??[]).length,1);
});
test('A07 complete report resolution waits for all history pages without inventing absence',async t=>{
 const h=await guidanceApp(t,createAdvisorGuidanceController),next=`r:${'a'.repeat(64)}:${ids.report}`;
 h.setHistory([{...clone(h.data.page),entries:[{kind:'report',event:{...clone(h.data.report),id:ids.other}}],nextCursor:next},clone(h.data.page)]);
 await h.c.open(selection);let markup=html(h.c);
 assert.match(markup,/check-in history incomplete/);assert.match(markup,/load more care history/);assert.doesNotMatch(markup,/selected check-in unavailable|<textarea|prepare review/);
 await h.c.loadMoreHistory();markup=html(h.c);
 assert.match(markup,/SYNTHETIC original comfort/);assert.doesNotMatch(markup,/check-in history incomplete/);
});
test('A07 view-only session cannot read private check-in data or prepare a response',async t=>{
 const h=await guidanceApp(t,createAdvisorGuidanceController);await h.caps({edit:false,publish:false});await h.c.open(selection);
 const markup=html(h.c);assert.doesNotMatch(markup,/SYNTHETIC original comfort|<textarea|prepare review|save private note/);
 assert.equal(h.calls.filter(c=>c.action==='read_advisor_care_history_v1').length,0);
});
