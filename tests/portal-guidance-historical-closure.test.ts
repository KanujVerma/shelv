import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {loadPortalCiBaselines} from './helpers/portal-ci-baselines.ts';
import {sharedCiBaselines} from './helpers/portal-shared-ci-baselines.ts';
const base='58c0669d0c5507c0eb7087fe0a0b0e0785743d5e';
const paths=['apps/portal/src/transport/session.ts','apps/portal/src/features/plan/guidanceHydration.ts','apps/portal/src/features/plan/guidancePort.ts'];
const fixture=new URL('./fixtures/portal-shared-ci-baselines.json',import.meta.url);
test('old-cookie closure keeps the historical error constructor and both original public bindings coherent',()=>{
 const generic=sharedCiBaselines.readBytes(base,paths[0]).toString('utf8');
 assert.match(generic,/export class TransportError extends Error/);
 assert.doesNotMatch(generic,/cookieDenialStatus|from .*site\/auth/);
 for(const path of paths.slice(1)){
  const text=sharedCiBaselines.readBytes(base,path).toString('utf8');
  assert.match(text,/import[^\n]*TransportError[^\n]*transport\/session/);
  assert.doesNotMatch(text,/transport\/error/);
 }
});
for(const path of paths)for(const kind of ['corrupt','missing'])test('historical closure refuses '+kind+' input '+path+' even with a rebound outer hash',()=>{
 const data=JSON.parse(readFileSync(fixture,'utf8'));
 const row=data.commits.find((c:{commit:string})=>c.commit===base).entries.find((e:{path:string})=>e.path===path);
 if(kind==='corrupt')row.content.data=Buffer.from('changed source').toString('base64');else delete row.content;
 const raw=Buffer.from(JSON.stringify(data)),folder=new URL('../.local-artifacts/guidance-closure-validation/',import.meta.url);
 mkdirSync(folder,{recursive:true});const target=new URL(randomUUID()+'.json',folder);writeFileSync(target,raw);
 try{assert.throws(()=>loadPortalCiBaselines(target,createHash('sha256').update(raw).digest('hex')).readBytes(base,path),kind==='corrupt'?/historical_content_/:/missing_historical_snapshot/);}finally{unlinkSync(target);}
});

