import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {selfPurchaseApplicationPreimage} from './helpers/self-purchase-application-preimage.mjs';
const source=await readFile(new URL('../src/app/Application.tsx',import.meta.url),'utf8');
test('actual notification wrapper preserves the complete original application through exact known inverses',()=>{
 assert.equal(createHash('sha256').update(selfPurchaseApplicationPreimage(source)).digest('hex'),'c242959d3f600cf28ce24f1af8ba6221c44ea24c54b9bfb7552f93c09536504f');
});
for(const [name,change] of [
 ['runtime binding',s=>s.replace('<AdvisorWorkspaceNotifications\n          runtime={runtime}','<AdvisorWorkspaceNotifications\n          runtime={undefined}')],
 ['controller binding',s=>s.replace('controller={connection.controller}\n          navigation={{','controller={undefined}\n          navigation={{')],
 ['retirement order',s=>s.replace('      active = false;\n      controller.dispose();','      active = true;\n      controller.dispose();')],
 ['unknown suffix',s=>s+'\n'],
])test('composition inverse rejects undeclared '+name,()=>{const changed=change(source);assert.notEqual(changed,source);assert.throws(()=>selfPurchaseApplicationPreimage(changed));});
