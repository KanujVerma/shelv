import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
let preimage;try{({selfPurchaseApplicationPreimage:preimage}=await import('./helpers/self-purchase-application-preimage.mjs'));}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const current=await readFile(new URL('../src/app/Application.tsx',import.meta.url),'utf8');
test('the exact application seam reverses to its entire historical source, not masked blocks',()=>{
 assert.equal(typeof preimage,'function');const before=preimage(current);assert.notEqual(before,current);assert.equal(preimage(before),before);
});
for(const [name,mutate] of [
 ['callback availability',s=>s.replace('runtime&&ports.care?','runtime?')],
 ['retained view callback',s=>s.replace('controller.acceptFrom(state.view)','()=>{}')],
 ['runtime type',s=>s.replace('runtime?: ApplicationSession','runtime?: any')],
 ['unknown trailing bytes',s=>s+'\n'],
])test('undeclared application change is refused: '+name,()=>{
 assert.equal(typeof preimage,'function');const changed=mutate(current);assert.notEqual(changed,current);assert.throws(()=>preimage(changed));
});
