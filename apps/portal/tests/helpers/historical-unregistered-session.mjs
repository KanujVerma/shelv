// Historical negative controls only. Current registered API behavior is tested
// separately; this source graph grants no operation, session or authority result.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {dirname,resolve,relative} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {sharedCiBaselines,reviewedSharedCommit} from '../../../../tests/helpers/portal-shared-ci-baselines.ts';

const root=fileURLToPath(new URL('../../../../',import.meta.url));
const cookie='apps/portal/site/auth/client-cookie-session.js';
const historicalSha256='7d0d8e9d89d51ab7d0221059168d47b9b9c69ff5609c97436fea372ab66f9f3a';
let application;
export async function historicalUnregisteredApplication() {
  if(application)return application;
  const evidence=resolve(root,'.local-artifacts/historical-unregistered-consumer');
  mkdirSync(evidence,{recursive:true});
  const destination=mkdtempSync(resolve(evidence,'source-'));
  const historical=sharedCiBaselines.readBytes(reviewedSharedCommit,cookie);
  assert.equal(createHash('sha256').update(historical).digest('hex'),historicalSha256);
  const pending=['apps/portal/src/app/session.ts'],seen=new Set(),rows=[];
  while(pending.length){
    const path=pending.pop();if(seen.has(path))continue;seen.add(path);
    assert.ok(!path.startsWith('../')&&!path.startsWith('/'),'own source containment');
    const current=readFileSync(resolve(root,path)),selected=path===cookie?historical:current;
    const output=resolve(destination,path);mkdirSync(dirname(output),{recursive:true});writeFileSync(output,selected,{flag:'wx'});
    rows.push({path,currentSha256:createHash('sha256').update(current).digest('hex'),selectedSha256:createHash('sha256').update(selected).digest('hex'),historical:path===cookie});
    for(const match of selected.toString().matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){
      if(match[1].startsWith('.'))pending.push(relative(root,resolve(dirname(resolve(root,path)),match[1])));
    }
  }
  assert.deepEqual(rows.filter(row=>row.historical).map(row=>row.path),[cookie]);
  writeFileSync(resolve(destination,'manifest.json'),JSON.stringify({scope:'HISTORICAL unregistered constructor ONLY; never current physical registry',reference:reviewedSharedCommit,historicalSha256,rows},null,2)+'\n',{flag:'wx'});
  application=(await import(pathToFileURL(resolve(destination,'apps/portal/src/app/session.ts')).href)).createApplicationSession;
  return application;
}
