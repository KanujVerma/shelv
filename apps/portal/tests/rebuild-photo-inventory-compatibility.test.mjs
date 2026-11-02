import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {portalCiBaselines} from '../../../tests/helpers/portal-ci-baselines.ts';
import {withoutPhotoInventory,withApprovedInventoryHandler} from './helpers/photo-inventory-baseline.mjs';

const base='3bd152a259b7b9b9971caa1546e65f69de12aab9';
const root=new URL('../../../',import.meta.url);
const files=['commands','types','projection','handler','index'].map(n=>'supabase/functions/concierge-checkins/'+n+'.ts').concat('supabase/functions/concierge-operations/runtime.ts');
test('the compatibility erasure preserves all six exact old ASTs and passes unrelated files through byte-exact',()=>{
  for(const name of files){
    const previous=portalCiBaselines.readBytes(base,name).toString('utf8'),current=readFileSync(new URL(name,root),'utf8');
    assert.equal(withoutPhotoInventory(current,name),withoutPhotoInventory(previous,name),name);
  }
  const unrelated="if (action === 'read_photo_inventory_v1') { oldAuthority(); }";
  assert.equal(withoutPhotoInventory(unrelated,'unrelated.js'),unrelated);
});
test('old denial and photo-head budget mutations remain visible to the compatibility witness',()=>{
  const handler='supabase/functions/concierge-checkins/handler.ts',runtime='supabase/functions/concierge-operations/runtime.ts';
  const current=readFileSync(new URL(handler,root),'utf8'),changed=current.replace("new HttpFailure(403,'forbidden')","new HttpFailure(200,'forbidden')");
  assert.notEqual(changed,current);
  assert.notEqual(withoutPhotoInventory(changed,handler),withoutPhotoInventory(current,handler));
  const body=readFileSync(new URL(runtime,root),'utf8'),wrong=body.replace('? 4096 :','? 4095 :');
  assert.notEqual(wrong,body);
  assert.notEqual(withoutPhotoInventory(wrong,runtime),withoutPhotoInventory(body,runtime));
});
test('the annotation preimage receives only reversible inventory additions and refuses other handler drift',()=>{
  const handler='supabase/functions/concierge-checkins/handler.ts';
  const historical=portalCiBaselines.readBytes('b42742a190fb55e1b2339c0017472dea03ea4e78',handler).toString('utf8');
  const current=readFileSync(new URL(handler,root),'utf8'),augmented=withApprovedInventoryHandler(historical,current);
  assert.match(augmented,/concierge_checkin_photo_inventory_v1/);
  assert.match(augmented,/mapCheckinPhotoInventory/);
  assert.throws(()=>withApprovedInventoryHandler(historical,current.replace("new HttpFailure(403,'forbidden')","new HttpFailure(200,'forbidden')")),/noninventory handler bytes/);
  assert.throws(()=>withApprovedInventoryHandler(historical,current.replace("call.name === 'concierge_checkin_photo_inventory_v1'","call.name === 'other'")),/one exact inventory/);
});
