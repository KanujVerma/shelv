import test from 'node:test';
import assert from 'node:assert/strict';
import {validateNegativeInputs,parseCheckpointText,checkNoEffects,runHistoryNegativeSchedule} from '../source/negative-schedules.mjs';

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
test('oversized raw checkpoint is refused without accepting a parsed substitute',()=>{
  const r=parseCheckpointText(' '.repeat(1048577),'baseline');assert.match(r.errors[0].message,/1MiB/);
});
test('unknown checkpoint label and label mismatch are refusals',()=>{
  assert.match(parseCheckpointText('{}','other').errors[0].message,/unknown checkpoint label/);
  const text=JSON.stringify({schemaVersion:1,label:'cleaned',actors:{},history:{},noEffects:{},authSessions:[],probeRequests:[],requestLinks:[]});assert.match(parseCheckpointText(text,'baseline').errors[0].message,/label mismatch/);
});
test('objects carrying claimed success or private no-effects rows are malformed callback data',()=>{
  const r=parseCheckpointText(JSON.stringify({schemaVersion:1,label:'baseline',actors:{},history:{},noEffects:{fullPrivateRows:[]},authSessions:[],probeRequests:[],requestLinks:[],success:true}),'baseline');assert.ok(r.errors.length);
});
test('four JavaScript object callbacks are not four raw canonical SQL observations',()=>{
  const r=checkNoEffects([{},{},{},{}]);assert.ok(r.errors.length);assert.ok(r.pending.length);
});
