import test from 'node:test';
import assert from 'node:assert/strict';
import {carePlan,summary} from './rebuild/care-fixture.mjs';
import {selectOrderProductUse} from '../src/features/plan/orderUse.ts';

const selection={publication:{version:1,documentSchemaVersion:3},decisionId:'maya-card-treatments',productId:'ordinary-azelaic-10'};
test('an exact selected publication/product exposes the authoritative use row without creating a Start',()=>{
  const view=carePlan(),before=structuredClone(view),result=selectOrderProductUse(view,selection);
  assert.equal(result.status,'available');assert.equal(result.use,view.use.planProducts.find(row=>row.product.productId===selection.productId));
  assert.equal(result.use.state,'not_reported');assert.deepEqual(view,before);
});

for(const state of ['using','paused','stopped','using_differently','unreviewed'])test(`Orders can display ${state} without deriving it from delivery`,()=>{
  const view=carePlan(),row=view.use.planProducts.find(row=>row.product.productId===selection.productId);
  row.state=state;row.latestEvent=summary(row.product,state==='using'?'started':state==='using_differently'?'different':state==='unreviewed'?'unreviewed_added':state);
  const result=selectOrderProductUse(view,selection);assert.equal(result.status,'available');assert.equal(result.use,row);
});

test('a historical selected document retains the original report context of its current-use overlay',()=>{
  const view=carePlan(),row=view.use.planProducts.find(row=>row.product.productId===selection.productId);view.access='read_only';
  row.state='stopped';row.latestEvent=summary({...row.product,publication:{version:9,documentSchemaVersion:3}},'stopped');row.contradiction=true;
  const result=selectOrderProductUse(view,selection);assert.equal(result.status,'available');assert.equal(result.use.latestEvent.product.publication.version,9);assert.equal(result.use.contradiction,true);
});

for(const changed of [{productId:'cerave-pm'},{decisionId:'unknown'},{publication:{version:2,documentSchemaVersion:3}},{publication:{version:1,documentSchemaVersion:2}}])test('mismatched frozen selection remains unavailable '+JSON.stringify(changed),()=>{
  assert.deepEqual(selectOrderProductUse(carePlan(),{...selection,...changed}),{status:'unavailable'});
});

test('no care read, preparation and legacy Start-only reads remain unavailable',()=>{
  const view=carePlan();assert.deepEqual(selectOrderProductUse(null,selection),{status:'unavailable'});
  assert.deepEqual(selectOrderProductUse({...view,access:'preparation',plan:null},selection),{status:'unavailable'});
  const {use,latestPublicReview,...legacy}=view;assert.deepEqual(selectOrderProductUse({...legacy,schemaVersion:1},selection),{status:'unavailable'});
});

test('missing, ambiguous or wrong-publication use rows are not guessed',()=>{
  const view=carePlan(),row=view.use.planProducts.find(row=>row.product.productId===selection.productId);
  const missing=structuredClone(view);missing.use.planProducts=missing.use.planProducts.filter(row=>row.product.productId!==selection.productId);
  assert.deepEqual(selectOrderProductUse(missing,selection),{status:'unavailable'});
  view.use.planProducts.push(row);assert.deepEqual(selectOrderProductUse(view,selection),{status:'unavailable'});
  const wrong=carePlan();wrong.use.planProducts.find(row=>row.product.productId===selection.productId).product.publication.version=9;
  assert.deepEqual(selectOrderProductUse(wrong,selection),{status:'unavailable'});
});
