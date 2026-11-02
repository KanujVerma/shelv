import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {loadPortalCiBaselines} from './helpers/portal-ci-baselines.ts';
import {sharedCiBaselines,sharedFixtureSha256,reviewedSharedCommit,reviewedSourceSha256,currentSourceSha256} from './helpers/portal-shared-ci-baselines.ts';
const file=new URL('./fixtures/portal-shared-ci-baselines.json',import.meta.url),base='58c0669d0c5507c0eb7087fe0a0b0e0785743d5e';
test('shared historical fixture independently binds inventory, source bytes and reviewed current identity',()=>{
 assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),sharedFixtureSha256);
 assert.equal(sharedCiBaselines.paths(base).length,2058);
 assert.equal(reviewedSharedCommit,'556befca22e0c2d7aa9cb63913eadaf45fb7b853');
 const generic='apps/portal/src/transport/session.ts';
 const bytes=sharedCiBaselines.readBytes(reviewedSharedCommit,generic);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),reviewedSourceSha256(generic));
 for(const path of [generic,'apps/portal/src/transport/error.ts','apps/portal/src/features/plan/guidanceHydration.ts','apps/portal/src/features/plan/guidancePort.ts']){
  assert.equal(createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),currentSourceSha256(path));
 }
 assert.throws(()=>sharedCiBaselines.readBytes(base,'../private'));
 assert.throws(()=>sharedCiBaselines.paths('07c4ae82def408bf9526f48a48eb987e4506f83e'),/incomplete_historical_inventory/);
});
test('even a rebound outer hash cannot admit corrupt historical content or invalid paths',()=>{
 const raw=readFileSync(file,'utf8'),folder=new URL('../.local-artifacts/shared-fixture-validation/',import.meta.url);mkdirSync(folder,{recursive:true});
 for(const kind of ['content','path','missing']){
  const data=JSON.parse(raw),entry=data.commits[0].entries.find((entry:{content?:unknown})=>entry.content);
  const path=entry.path;
  if(kind==='content')entry.content.data=Buffer.from('unreviewed bytes').toString('base64');
  if(kind==='path')entry.path='../private';
  if(kind==='missing')delete entry.content;
  const bytes=Buffer.from(JSON.stringify(data)),target=new URL(randomUUID()+'.json',folder);writeFileSync(target,bytes);
  try{
   const run=()=>{const loaded=loadPortalCiBaselines(target,createHash('sha256').update(bytes).digest('hex'));if(kind==='missing')loaded.readBytes(base,path);};
   assert.throws(run,kind==='content'?/historical_content_/:kind==='path'?/ambiguous_historical_path/:/missing_historical_snapshot/);
  }finally{unlinkSync(target);}
 }
});
