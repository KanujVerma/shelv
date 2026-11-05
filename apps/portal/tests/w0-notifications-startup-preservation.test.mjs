import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {selfPurchaseApplicationPreimage} from './helpers/self-purchase-application-preimage.mjs';
const source=await readFile(new URL('../src/app/Application.tsx',import.meta.url),'utf8');
test('only the exact inbox and composition branches reverse through client-entry and Self to the complete old App',()=>{
 assert.equal(createHash('sha256').update(source).digest('hex'),'9ff9dfb2273ad80262ea00236c04e7671e4dd59d98c737665c05459b94f40510');
 const original=selfPurchaseApplicationPreimage(source);
 assert.equal(createHash('sha256').update(original).digest('hex'),'c242959d3f600cf28ce24f1af8ba6221c44ea24c54b9bfb7552f93c09536504f');
});
for(const [name,mutate] of [
 ['broader branch',s=>s.replace('route.name === "advisor-notifications" ? (','true ? (')],
 ['audience guard',s=>s.replace('route.name.startsWith("advisor-") !== (audience === "advisor")','false')],
 ['unknown suffix',s=>s+'\n'],
])test('notification inverse refuses undeclared '+name,()=>{
 const changed=mutate(source);assert.notEqual(changed,source);assert.throws(()=>selfPurchaseApplicationPreimage(changed));
});
