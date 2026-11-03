import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {privateRedirectHistoricalPreimage} from './helpers/portal-private-redirect-preimage.ts';
import {ownAdminSourceBytes} from './helpers/portal-own-admin-source-baselines.ts';
import {sharedCiBaselines} from './helpers/portal-shared-ci-baselines.ts';
const base='07c4ae82def408bf9526f48a48eb987e4506f83e';
for(const name of ['upstream','client-upstream']){
 const path=`apps/portal/session-integration/runtime/server/${name}.ts`;
 const current=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const historical=(ownAdminSourceBytes(path)??sharedCiBaselines.readBytes(base,path)).toString('utf8');
 test(name+' exact redirect inverse retains the complete original source bytes',()=>{
  assert.equal(privateRedirectHistoricalPreimage(current,path),historical);
  assert.equal(privateRedirectHistoricalPreimage(historical,path),historical);
 });
 for(const [label,change] of [
  ['follow mode',(s:string)=>s.replace("redirect:'manual'","redirect:'follow'")],
  ['missing redirect guard',(s:string)=>s.replace('response.status>=300&&response.status<400','false')],
  ['unrelated context authority',(s:string)=>s.replace('current.ownerId===credentials.user.id','true')],
 ] as const)test(name+' inverse refuses '+label,()=>{
  const mutated=change(current);assert.notEqual(mutated,current);
  assert.throws(()=>privateRedirectHistoricalPreimage(mutated,path),/exact private redirect postimage/);
 });
}
test('redirect inverse cannot rewrite another source path',()=>{
 const text="redirect:'manual'";
 assert.equal(privateRedirectHistoricalPreimage(text,'unrelated.ts'),text);
});
