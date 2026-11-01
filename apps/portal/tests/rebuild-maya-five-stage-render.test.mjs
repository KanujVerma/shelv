import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
const {exports:{renderMaya,renderSharedPlan,createMayaDemoController},inputs}=await sourceModule('tests/rebuild-maya-five-stage-ssr.ts');
for(const [stage,id,distinct] of [[1,'meet-maya','start with Maya'],[2,'meaningful-decision','review a recommendation'],[3,'daily-use','try sample use states'],[4,'follow-up','sample follow-up'],[5,'next-step','what comes next']])test('actual shared SSR stage '+stage+' renders a distinct reachable guide view',()=>{
  const c=createMayaDemoController({initialStage:stage}),html=renderMaya(c);assert.match(html,new RegExp('data-maya-stage="'+id+'"'));assert.match(html,new RegExp(distinct));assert.match(html,new RegExp('stage '+stage+' of 5'));assert.match(html,/fictional staged sample/);assert.match(html,/exit guide/);assert.match(html,/explore on my own/);assert.match(html,/reset demo/);assert.match(html,stage===5?/finish guide/:/>next</);assert.match(html,/>back</);if(stage===2){assert.match(html,/>approve product</);assert.match(html,/>decide later</);assert.match(html,/>decline</);assert.match(html,/15–20%/);assert.match(html,/10%/);}c.dispose();
});
test('source render graph uses actual ClientPlan, product/evidence/schedule/use modules and semantic wrappers',()=>{
  for(const file of ['features/plan/ClientPlan.tsx','features/plan/content.tsx','features/plan/DecisionControls.tsx','features/plan/UseFacts.tsx','features/plan/UseReport.tsx','ui/overlay.tsx','ui/primitives.tsx'])assert.ok(inputs.some(f=>f.endsWith(file)),file);
  assert.equal(inputs.some(f=>/app\/(?:Application|.*ports|bootstrap)|session-integration|private-walkthrough|\/server\//.test(f)),false);
});
test('exiting/collapsing removes guide rail; replay/reset remain explicit and preserve honest reported use',()=>{
  const c=createMayaDemoController({initialStage:3});c.reportExample('started-unknown');c.reportExample('stopped-unknown');let html=renderMaya(c);assert.match(html,/data-care-state="stopped"/);assert.match(html,/occurred date not known/);assert.match(html,/actual start date not known/);c.exit();html=renderMaya(c);assert.doesNotMatch(html,/<aside class="maya-guide-rail"/);assert.doesNotMatch(html,/exit guide/);assert.match(html,/view tour/);c.reopen();assert.match(renderMaya(c),/daily use/);c.collapse();assert.match(renderMaya(c),/show guide/);c.reset();assert.doesNotMatch(renderMaya(c),/data-care-state="stopped"/);c.dispose();
});
test('product-bound CeraVe evidence never becomes azelaic evidence, and unknown product is unavailable',()=>{
  const c=createMayaDemoController();c.navigate({name:'product-evidence',productId:'cerave-pm',routine:'morning'});let html=renderSharedPlan(c.getPlanProps());assert.match(html,/CeraVe PM Facial Moisturizing Lotion · ingredients/);assert.doesNotMatch(html,/Patch test first/);c.navigate({name:'product-evidence',productId:'ordinary-azelaic-10',routine:'evening'});html=renderSharedPlan(c.getPlanProps());for(const text of ['Patch test first','intact skin','eyes, lips and broken skin','two nonconsecutive evenings','glycolic','rinse off and stop','swelling or breathing trouble'])assert.ok(html.includes(text),text);c.navigate({name:'product-evidence',productId:'not-public',routine:'morning'});assert.match(renderSharedPlan(c.getPlanProps()),/this item is unavailable/);c.dispose();
});
test('responsive rail references only defined shared tokens and never covers the actual plan',async()=>{
  const css=await readFile(new URL('../src/features/walkthrough/maya/maya.css',import.meta.url),'utf8'),tokens=await readFile(new URL('../src/ui/tokens.css',import.meta.url),'utf8');
  for(const [,name] of css.matchAll(/var\((--[a-z0-9-]+)/g))assert.ok(tokens.includes(name+':'),'undefined semantic token '+name);
  for(const width of [1440,1180,390,320])assert.ok(css.includes('max-width:'+width+'px'));
  assert.doesNotMatch(css,/position:\s*(?:absolute|fixed)|display:\s*none|text-transform/);assert.match(css,/prefers-reduced-motion/);
});
