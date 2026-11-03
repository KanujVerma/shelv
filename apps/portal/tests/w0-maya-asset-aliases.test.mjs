import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const repo=fileURLToPath(new URL('../../../',import.meta.url));
const filenames=['moisturizer.jpg','sunscreen.webp','makeup.jpg','remover.jpg','cleanser.jpg','azelaic.png','hydro.jpg','aveeno.jpg','balm.jpg','ha.png','niacinamide.png','glycolic.png'];
test('application packages exact public Maya image aliases accepted by the existing plan URL contract',{timeout:60000},async t=>{
 execFileSync(process.execPath,['apps/portal/scripts/build-portal-app.mjs'],{cwd:repo,stdio:'pipe'});
 const output=new URL('../../../.local-artifacts/portal-rebuild/application/',import.meta.url);
 const provenance=JSON.parse(readFileSync(new URL('application-provenance.json',output),'utf8'));
 assert.equal(provenance.assets.filter(a=>a.output.startsWith('assets/maya-')).length,12);
 for(const filename of filenames)await t.test(filename+' retains exact source bytes and legacy public path',()=>{
  const source='apps/portal/site/maya/assets/'+filename,alias='assets/maya-'+filename;
  const bytes=readFileSync(new URL('../../../'+source,import.meta.url));
  assert.deepEqual(readFileSync(new URL(alias,output)),bytes);
  assert.deepEqual(readFileSync(new URL('maya/assets/'+filename,output)),bytes);
  const record=provenance.assets.find(a=>a.output===alias);assert.ok(record);
  assert.equal(record.source,source);assert.equal(record.bytes,bytes.length);
  assert.equal(record.sha256,createHash('sha256').update(bytes).digest('hex'));
 });
});
