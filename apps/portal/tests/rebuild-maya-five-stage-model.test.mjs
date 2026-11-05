import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRoute,parseRoute} from '../src/navigation/routes.ts';
const model=new URL('../src/features/walkthrough/maya/model.ts',import.meta.url);
test('D42 exposes exactly five distinct reachable stage identities, rather than the historical seven-stop story',async()=>{
  let source='';try{source=await readFile(model,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  assert.ok(source.includes('meet-maya'),'the approved five-stage model has not been implemented');
  const {MAYA_STAGES}=await import(model);
  assert.deepEqual(MAYA_STAGES.map(s=>s.id),['meet-maya','meaningful-decision','daily-use','follow-up','next-step']);
  assert.equal(new Set(MAYA_STAGES.map(s=>s.number)).size,5);
  for(const s of MAYA_STAGES)assert.deepEqual(parseRoute(buildRoute({name:'maya',stage:s.number})),{name:'maya',stage:s.number});
});
