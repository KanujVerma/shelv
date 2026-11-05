// Immutable SOURCE identities only. No SQL, browser or clinical-equivalence claim.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {loadPortalCiBaselines} from './helpers/portal-ci-baselines.ts';
import {ownAdminSourceCommit,ownAdminSourceFixtureSha256,ownAdminSourcePaths,ownAdminSourceBytes,ownAdminSourceSha256} from './helpers/portal-own-admin-source-baselines.ts';
import {sharedFixtureSha256} from './helpers/portal-shared-ci-baselines.ts';
import {privateRedirectHistoricalPreimage} from './helpers/portal-private-redirect-preimage.ts';
const file=new URL('./fixtures/portal-own-admin-source-baselines.json',import.meta.url);
test('eight exact admin37 source identities retain complete bodies and full reviewed provenance',()=>{
 const raw=readFileSync(file),data=JSON.parse(raw.toString());
 assert.equal(createHash('sha256').update(raw).digest('hex'),ownAdminSourceFixtureSha256);
 assert.equal(data.reviewReport,'9fc0aafe8e26eb0e5b194f2fda55a57b638ac8a7');
 assert.equal(data.commits.length,1);assert.equal(data.commits[0].commit,ownAdminSourceCommit);
 assert.equal(data.commits[0].completeInventory,false);
 assert.deepEqual(data.commits[0].entries.map((row:{path:string})=>row.path),ownAdminSourcePaths);
 assert.equal(ownAdminSourcePaths.length,8);
 for(const path of ownAdminSourcePaths){
  const bytes=Buffer.from(privateRedirectHistoricalPreimage(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path));
  assert.deepEqual(bytes,ownAdminSourceBytes(path),path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),ownAdminSourceSha256(path));
 }
 assert.equal(ownAdminSourceBytes('../private'),null);
 assert.throws(()=>loadPortalCiBaselines(file,ownAdminSourceFixtureSha256).paths(ownAdminSourceCommit),/incomplete_historical_inventory/);
 // The older 2058-row/shared compiler fixture is unchanged, not rewritten.
 assert.equal(createHash('sha256').update(readFileSync(new URL('./fixtures/portal-shared-ci-baselines.json',import.meta.url))).digest('hex'),sharedFixtureSha256);
});
test('rebound outer seals still refuse corrupt, missing and traversing admin snapshot bodies',()=>{
 const folder=new URL('../.local-artifacts/admin-source-fixture-controls/',import.meta.url);mkdirSync(folder,{recursive:true});
 for(const kind of ['content','missing','path']){
  const data=JSON.parse(readFileSync(file,'utf8')),entry=data.commits[0].entries[0],path=entry.path;
  if(kind==='content')entry.content.data=Buffer.from('unknown clinical executable change').toString('base64');
  if(kind==='missing')delete entry.content;
  if(kind==='path')entry.path='../private';
  const raw=Buffer.from(JSON.stringify(data)),target=new URL(randomUUID()+'.json',folder);writeFileSync(target,raw);
  try{
   assert.throws(()=>loadPortalCiBaselines(target,createHash('sha256').update(raw).digest('hex')).readBytes(ownAdminSourceCommit,path),kind==='content'?/historical_content_/:kind==='path'?/ambiguous_historical_path/:/missing_historical_snapshot/);
  }finally{unlinkSync(target);}
 }
});
