import test from 'node:test';
import assert from 'node:assert/strict';
import {createOverlayCoordinator} from '../src/ui/overlay-state.ts';

test('only one dialog or sheet owns the modal layer and only its owner may release it',()=>{
  const layer=createOverlayCoordinator();let changes=0;const unsubscribe=layer.subscribe(()=>changes++);
  assert.equal(layer.claim('product'),true);assert.equal(layer.claim('payment'),false);
  layer.release('payment');assert.equal(layer.getSnapshot(),'product');
  layer.release('product');assert.equal(layer.claim('payment'),true);
  assert.equal(changes,3);unsubscribe();
});
