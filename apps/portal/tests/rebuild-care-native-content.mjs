import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticCareContent} from '../scripts/rebuild-care-native-cases.mjs';
import {readPlanContent} from '../../../src/contracts/PortalRebuildValidation.ts';
import {projectClientPlan} from '../../../src/contracts/PortalRebuild.ts';

assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE_GUARDS,'1');
test('one structured retained product in owned synthetic content has no fake catalog/price/Start',()=>{
  const content=syntheticCareContent();assert.deepEqual(readPlanContent(content),content);
  assert.equal(content.products.length,1);const p=content.products[0];
  assert.equal(p.id,'cerave-pm');assert.equal(p.name,'CeraVe PM Facial Moisturizing Lotion');assert.equal(p.brand,'CeraVe PM');
  assert.equal(p.displayPrice,null);assert.equal(p.formula,'unknown');assert.equal(p.identity,'possible_match');assert.notEqual(p.identity,'client_confirmed');
  assert.equal(content.context.products.state,'none');assert.equal(content.decisions[0].kind,'addition');assert.equal(content.decisions[0].primaryProductId,p.id);
  assert.ok(content.routine.every(r=>r.productId===null));assert.ok(content.routine.every(r=>r.schedule.automaticAdvance===false));
  assert.match(content.summary,/synthetic/i);assert.match(JSON.stringify(content),/W6_PRIVATE_SYNTHETIC_ONLY/);
  assert.doesNotMatch(JSON.stringify(projectClientPlan(content)),/W6_PRIVATE_SYNTHETIC_ONLY/);
});
