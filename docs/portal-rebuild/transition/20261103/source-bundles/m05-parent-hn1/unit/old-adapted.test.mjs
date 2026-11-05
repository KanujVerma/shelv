import test from 'node:test';
import assert from 'node:assert/strict';
import {validateNegativeInputs,parseCheckpointText,checkNoEffects,runHistoryNegativeSchedule} from '../receipts/initial-source.mjs';

for(const input of [undefined,null,{},[],{descriptor:{schemaVersion:1,authorized:true}}])test('malformed descriptor refuses before writes: '+JSON.stringify(input),async()=>{
  const r=await validateNegativeInputs(input);assert.equal(r.kind,'OBSERVATIONS_ONLY');assert.ok(r.errors.length);assert.ok(r.pending.length);
});
for(const input of [undefined,null,{},[],Buffer.from('{}'),'','null','{}','[]','{','{"schemaVersion":1,"success":true}'])test('canonical callback refuses malformed/non-text return '+String(input),()=>{
  const r=parseCheckpointText(input,'baseline');assert.equal(r.kind,'OBSERVATIONS_ONLY');assert.ok(r.errors.length);
});
test('missing four checkpoints cannot claim no effects',()=>{
  const r=checkNoEffects([]);assert.equal(r.kind,'OBSERVATIONS_ONLY');assert.ok(r.errors.length);
});
test('missing caller page/proof/helper refuses rather than becoming a pending success',async()=>{
  const r=await runHistoryNegativeSchedule({});assert.equal(r.kind,'OBSERVATIONS_ONLY');assert.ok(r.errors.length);assert.ok(r.pending.length);
});