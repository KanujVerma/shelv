import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import fs from 'node:fs/promises';
import {checkStyles} from '../scripts/check-ui-system.mjs';
test('exported commerce seam bundles for browser with shared tokens and no runtime server credential dependency',async()=>{
 const result=await build({absWorkingDir:new URL('../',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',entryPoints:['src/features/orders/index.ts'],bundle:true,write:false,platform:'browser',format:'esm',outdir:'ignored-in-memory-w5',metafile:true,treeShaking:true});
 assert.ok(result.outputFiles.some(f=>f.path.endsWith('.js')&&f.contents.length>0));assert.ok(result.outputFiles.some(f=>f.path.endsWith('.css')&&f.contents.length>0));
 assert.equal(Object.keys(result.metafile.inputs).some(p=>/app\/session\.ts|runtime\/workers|node:|supabase-js|service.role/i.test(p)),false);
 const css=await fs.readFile(new URL('../src/features/orders/orders.css',import.meta.url),'utf8');assert.deepEqual(checkStyles({'features/orders/orders.css':css}),[]);
});
