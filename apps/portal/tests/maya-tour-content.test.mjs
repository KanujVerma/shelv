import test from 'node:test';
import assert from 'node:assert/strict';
import * as maya from '../site/walkthrough/maya.js';
import {createMayaSample} from '../site/advisor/maya-sample.js';
import {createWalkthroughAdapters} from '../site/walkthrough/adapters.js';
import {presentationConsultationMarkup,presentationFeedMarkup,presentationCardDetail} from '../site/client/presentation-renderer.js';

const stageIds=['meet-maya','plan-reasoning','spending','daily-routine','between-reviews','review-decision','ongoing-support'];
const allowedTargets=new Set(['overview','keep-card','treatment-card','approval-controls','routine-grid','routine-product','support','review','terms']);
const allowedActions=new Set(['open-overview','open-keep-card','open-treatment-card','open-routine-product']);
const localProduct=product=>product&&({...product,imageUrl:product.imageUrl?.includes('/maya/assets/')?'assets/'+product.imageUrl.split('/maya/assets/')[1]:product.imageUrl});

test('the Maya tour pairs every stable service stop with a supported view and optional read action',()=>{
 const snapshot=maya.createGuidedMayaSnapshot(),tour=maya.mayaTourConfiguration;
 assert.ok(tour,'Maya must opt in to the service tour configuration.');
 assert.deepEqual(snapshot.stages.map(stage=>stage.id),stageIds);
 assert.deepEqual(Object.keys(tour.steps),stageIds);
 for(const stage of snapshot.stages){
  const step=tour.steps[stage.id];
  assert.ok(allowedTargets.has(step.target),`${stage.id} has an anchored portal target`);
  assert.equal(step.view,stage.section,`${stage.id} opens the view containing its target`);
  assert.deepEqual(Object.keys(step).sort(),(step.interaction?['interaction','target','view']:['target','view']));
  if(step.interaction){assert.ok(allowedActions.has(step.interaction.action));assert.equal(typeof step.interaction.label,'string');assert.deepEqual(Object.keys(step.interaction).sort(),['action','label']);}
 }
 for(const panel of [tour.intro,tour.finish]){assert.equal(typeof panel.title,'string');assert.ok(panel.body.length>0&&panel.body.every(text=>typeof text==='string'&&text.trim()));assert.equal(typeof panel.meta,'string');}
 assert.equal(typeof tour.intro.primaryLabel,'string');assert.equal(typeof tour.intro.secondaryLabel,'string');
 assert.doesNotMatch(JSON.stringify(tour),/querySelector|onclick|https?:|caseId|versionId|maya-card-/i,'Layout configuration carries no account, product identifiers or executable selectors.');
});

test('the guided public plan renders company authorship without changing source facts or directions',()=>{
 const source=createMayaSample().clientView.plan.presentation,before=structuredClone(source),guided=maya.createGuidedMayaSnapshot(source).presentation;
 assert.equal(guided.preparedBy,'Shelv');
 const editorial=presentationConsultationMarkup(guided)+presentationFeedMarkup(guided);
 assert.doesNotMatch(editorial,/\bI(?:[’'](?:d|m|ll)| (?:chose|can|want|would))\b|\btell me\b/i);
 assert.match(editorial,/\bwe(?:[’'](?:d|re|ll))?\b/i);
 assert.equal(guided.title,source.title);assert.equal(guided.summary,source.summary);assert.equal(guided.preparedOn,source.preparedOn);
 assert.deepEqual(guided.sources,source.sources);assert.deepEqual(guided.routineGuides,source.routineGuides);
 assert.deepEqual(guided.baselineRoutine,source.baselineRoutine.map(step=>({...step,...(step.product?{product:localProduct(step.product)}:{})})));
 for(let index=0;index<source.categoryCards.length;index++){
  const original=source.categoryCards[index],card=guided.categoryCards[index];
  for(const key of ['id','slot','kind','recommendationId','actions','usage','how','facts','sources','decisionLabels'])assert.deepEqual(card[key],original[key],`${original.id}: ${key} retains the public source`);
  for(const key of ['currentProduct','proposedProduct'])assert.deepEqual(card[key],localProduct(original[key]),`${original.id}: ${key} keeps exact identity, links and reference price`);
  assert.deepEqual(card.comparisons?.map(({significance,...facts})=>facts),original.comparisons?.map(({significance,...facts})=>facts));
  assert.equal(presentationCardDetail(card),presentationCardDetail({...original,rationaleTitle:card.rationaleTitle,reasons:card.reasons,currentProduct:localProduct(original.currentProduct),proposedProduct:localProduct(original.proposedProduct)}),'Product details retain exact approved identities, evidence and directions; only the separately reviewed rationale authorship changes.');
 }
 assert.deepEqual(source,before,'A guided presentation never mutates the ordinary Maya source.');
 assert.equal(createMayaSample().clientView.plan.presentation.preparedBy,'Kanuj');
});

test('tour progression never fabricates approval, payment, purchase, receipt or Start to tell the story',async()=>{
 const snapshot=maya.createGuidedMayaSnapshot(),initial=await createWalkthroughAdapters(snapshot,{index:0});
 for(let index=0;index<snapshot.stages.length;index++){
  const adapters=await createWalkthroughAdapters(snapshot,{index}),view=adapters.read(),service=adapters.service.read();
  assert.equal(view.revision,0);assert.deepEqual(view.plan.itemStates,initial.read().plan.itemStates);
  assert.deepEqual(view.activeRoutine,initial.read().activeRoutine);assert.deepEqual(view.routineHistory,[]);
  assert.equal(view.activeRoutine.some(step=>step.productId==='ordinary-azelaic-10'),false);
  assert.deepEqual(adapters.paymentStore.quotes,[]);assert.equal(adapters.paymentStore.shippingAddress,null);
  assert.deepEqual(service.purchases,[]);assert.deepEqual(service.returns,[]);assert.deepEqual(service.instructions,[]);
  assert.deepEqual(adapters.checkinStore.reports,[]);assert.equal(service.reviews.length,index>=5?1:0);
 }
 const spending=await createWalkthroughAdapters(snapshot,{index:2});
 await spending.core({action:'decide',version:1,recommendationId:'maya-azelaic-1',choice:'approved',requestId:'ec000000-0000-4000-8000-000000000009',expectedRevision:0});
 assert.equal(spending.read().plan.itemStates.find(item=>item.recommendationId==='maya-azelaic-1').choice,'approved');
 assert.deepEqual(spending.read().activeRoutine,initial.read().activeRoutine,'Trying approval does not start the product.');
 assert.deepEqual(spending.paymentStore.quotes,[]);assert.deepEqual(spending.service.read().purchases,[]);
});

test('the later authored review preserves limited reported use and a no-purchase decision',async()=>{
 const snapshot=maya.createGuidedMayaSnapshot(),adapters=await createWalkthroughAdapters(snapshot,{index:5});
 const [review]=adapters.service.read().reviews;
 assert.match(review.summary,/authored sample/i);
 assert.match(review.reportedUse,/twice in week one and once so far in week two/i);
 assert.match(review.reportedUse,/exact start date (?:was )?not (?:supplied|recorded)/i);
 assert.match(review.decision,/no additional purchase/i);assert.match(review.decision,/keep the current instructions/i);
 assert.match(review.decision,/few uses do not establish efficacy/i);assert.equal(review.nextReviewOn,'2026-11-20');
 assert.deepEqual(snapshot.stages.flatMap(stage=>stage.messages).map(message=>message.speaker),['Maya','Shelv']);
 assert.match(snapshot.stages[4].body,/sample text exchange.*outside the portal/i);
 assert.doesNotMatch(snapshot.stages.map(stage=>stage.body).join(' '),/\bKanuj\b|\bAI\b|scanner|diagnos/i);
});
