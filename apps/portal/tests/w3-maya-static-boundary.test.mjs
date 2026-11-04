import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
import {assertMayaStaticImages} from './w3/maya-static-images.mjs';
const {exports:{createMayaDemoController,renderMaya}}=await sourceModule('tests/rebuild-maya-five-stage-ssr.ts');

test('static-image assertions reject an external image in actual SSR',t=>{
  const controller=createMayaDemoController();t.after(controller.dispose);
  const html=renderMaya(controller);assertMayaStaticImages(html);
  const external=html.replace(/(<img\b[^>]*\bsrc=")[^"]+/, '$1https://other.example/product.png');
  assert.notEqual(external,html);
  assert.throws(()=>assertMayaStaticImages(external),/only an exact packaged Maya asset/);
});

test('static-image assertions reject the wrong allowed product image in actual SSR',t=>{
  const controller=createMayaDemoController();t.after(controller.dispose);
  const html=renderMaya(controller);
  const wrong=html.replace(/(<img\b[^>]*\bsrc=")[^"]+/, '$1/assets/maya-glycolic.png');
  assert.notEqual(wrong,html);
  assert.throws(()=>assertMayaStaticImages(wrong),/source image bound to selected product/);
});
