import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {selfPurchaseApplicationPreimage} from './helpers/self-purchase-application-preimage.mjs';
const source=await readFile(new URL('../src/app/Application.tsx',import.meta.url),'utf8');
const hash=s=>createHash('sha256').update(s).digest('hex');
test('exact scoped-entry and self-purchase additions reverse to the entire original App',()=>{
 assert.doesNotMatch(source,/function AdvisorClientRecovery\(|no draft found|controller\.loadDirectory\(\)/);
 assert.equal(hash(selfPurchaseApplicationPreimage(source)),'c242959d3f600cf28ce24f1af8ba6221c44ea24c54b9bfb7552f93c09536504f');
});
for(const [name,mutate] of [
 ['scope identity',s=>s.replace('clientId={route.clientId}','clientId="foreign"')],
 ['trusted name binding',s=>s.replace('c.clientId.toLowerCase()===route.clientId.toLowerCase()','true')],
 ['unknown bytes',s=>s+'\n'],
])test('entry preservation rejects undeclared App changes: '+name,()=>{const changed=mutate(source);assert.notEqual(changed,source);assert.throws(()=>selfPurchaseApplicationPreimage(changed));});
