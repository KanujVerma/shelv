import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
const {exports:{createMayaDemoController,renderSlot}}=await sourceModule('tests/w3/maya-shell-slot.tsx');

for(const stage of [1,2,3,4,5])test(`stage ${stage} offers only its left client canvas to the shared shell`,t=>{
  const controller=createMayaDemoController({initialStage:stage});t.after(controller.dispose);
  const html=renderSlot(controller),start=html.indexOf('<w3-shell-placement-probe>'),end=html.indexOf('</w3-shell-placement-probe>',start);
  assert.ok(start>=0,'the W0-provided shell renderer is invoked');
  assert.match(html.slice(start,end),/fictional staged sample/);
  assert.ok(html.indexOf('<aside class="maya-guide-rail"')>end,'guide rail remains outside the client shell');
  assert.equal(controller.getPlanProps().ports,undefined,'placement adds no live capability');
});

test('omitting the optional slot preserves existing standalone callers',t=>{
  const controller=createMayaDemoController();t.after(controller.dispose);
  const html=renderSlot(controller,false);
  assert.doesNotMatch(html,/w3-shell-placement-probe/);
  assert.match(html,/fictional staged sample/);
  assert.match(html,/maya-guide-rail/);
});
