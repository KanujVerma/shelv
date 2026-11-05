import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createMayaSample} from '../site/advisor/maya-sample.js';
import {adaptLegacyPlan,projectClientPlan} from '../../../src/contracts/PortalRebuild.ts';
import {createMayaFixture,MAYA_FOLLOW_UP} from '../src/features/walkthrough/maya/fixture.ts';
import {routineFor} from '../src/features/plan/model.ts';
test('all seven public decisions, product identities, evidence, guides and complete directions survive the canonical adapter',()=>{
  const source=createMayaSample().clientView.plan,expected=projectClientPlan(adaptLegacyPlan({version:source.version,presentation:source.presentation,recommendations:source.recommendations},2).content),{base}=createMayaFixture();
  const actual=base.plan.content;assert.equal(actual.decisions.length,7);assert.deepEqual(actual.decisions,expected.decisions);assert.deepEqual(actual.routineGuides,expected.routineGuides);assert.deepEqual(actual.consultationSections,expected.consultationSections);
  for(const product of expected.products){const imageUrl=product.imageUrl?'assets/maya-'+new URL(product.imageUrl).pathname.split('/').at(-1):null;assert.deepEqual(actual.products.find(p=>p.id===product.id),{...product,imageUrl});}
  for(const step of expected.routine){const changed=structuredClone(step);if(changed.productId==='maybelline-fit-me')changed.schedule.asNeeded=true;if(changed.productId==='bioderma-sensibio-h2o')changed.schedule.condition='if wearing makeup';assert.deepEqual(actual.routine.find(s=>s.id===step.id),changed);}
  assert.equal(actual.context.products.state,expected.context.products.state);assert.equal(actual.products.some(p=>p.strength.state==='unknown'),true);
});
test('source morning/evening conditions and proposal stay distinct without manufacturing a Start',()=>{
  const {base}=createMayaFixture();assert.deepEqual(routineFor(base,'morning').map(s=>s.productId),[null,'cerave-pm','lrp-anthelios-uv-control-spf50','maybelline-fit-me']);assert.deepEqual(routineFor(base,'evening').map(s=>s.productId),['bioderma-sensibio-h2o','cerave-hydrating-cleanser','cerave-pm']);assert.equal(routineFor(base,'morning').at(-1).schedule.asNeeded,true);assert.equal(routineFor(base,'evening')[0].schedule.condition,'if wearing makeup');assert.deepEqual(base.actualUse,[]);assert.equal(base.nextReviewOn,null);
});
test('later story is exactly the public authored example, with unknown Start and no efficacy or purchase assertion',async()=>{
  const source=await readFile(new URL('../site/walkthrough/maya.js',import.meta.url),'utf8');for(const s of [MAYA_FOLLOW_UP.summary,MAYA_FOLLOW_UP.reportedUse,MAYA_FOLLOW_UP.decision,...MAYA_FOLLOW_UP.messages.map(m=>m.text)])assert.ok(source.includes(s));assert.match(MAYA_FOLLOW_UP.reportedUse,/Exact Start date not supplied/);assert.match(MAYA_FOLLOW_UP.decision,/No additional purchase/);assert.match(MAYA_FOLLOW_UP.decision,/do not establish efficacy/);
});

test('every available Maya recognition image is the exact existing same-origin packaged source asset',async()=>{
  const {base}=createMayaFixture();
  for(const product of base.plan.content.products){
    assert.match(product.imageUrl,/^assets\/maya-[a-z0-9-]+\.(?:jpg|png|webp)$/);
    assert.ok((await stat(new URL('../site/maya/assets/'+product.imageUrl.slice('assets/maya-'.length),import.meta.url))).size>0);
  }
  assert.equal(base.plan.content.products.find(p=>p.id==='cerave-pm').imageUrl,'assets/maya-moisturizer.jpg');
  assert.equal(base.plan.content.products.find(p=>p.id==='ordinary-azelaic-10').imageUrl,'assets/maya-azelaic.png');
});
