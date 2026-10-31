import test from 'node:test';
import assert from 'node:assert/strict';
import {filteredHistoryCommand} from '../scripts/rebuild-care-native-history.mjs';
assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE_GUARDS,'1');
const clientId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const plan={kind:'plan_product',publication:{version:1,documentSchemaVersion:3},productId:'cerave-pm',slotId:null};
const reported={kind:'client_reported_product',reportedProductId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',version:2};
test('filtered native client history always sends its exact nonnull filter without an owner selector',()=>{
  for(const product of [plan,reported])assert.deepEqual(filteredHistoryCommand('client',{product}),{schemaVersion:1,action:'read_use_history_v1',product,cursor:null,limit:2});
  assert.throws(()=>filteredHistoryCommand('client',{product:null}));
  assert.throws(()=>filteredHistoryCommand('client',{product:plan,clientId}));
});
test('filtered native advisor history requires the actual selected client and preserves version/slot/cursor',()=>{
  const command=filteredHistoryCommand('advisor',{clientId,product:{...plan,slotId:'care-slot'},cursor:null,limit:1});
  assert.equal(command.action,'read_advisor_use_history_v1');assert.equal(command.clientId,clientId);assert.equal(command.product.slotId,'care-slot');assert.equal(command.limit,1);
  assert.throws(()=>filteredHistoryCommand('advisor',{product:reported}));
  assert.throws(()=>filteredHistoryCommand('advisor',{clientId,product:null}));
});
test('filtered lane denies unknown audiences, selectors and malformed references instead of falling back to all history',()=>{
  assert.throws(()=>filteredHistoryCommand('agent',{clientId,product:plan}));
  assert.throws(()=>filteredHistoryCommand('client',{product:{...reported,version:0}}));
  assert.throws(()=>filteredHistoryCommand('client',{product:plan,limit:101}));
  assert.throws(()=>filteredHistoryCommand('client',{product:plan,endpoint:'arbitrary'}));
});
