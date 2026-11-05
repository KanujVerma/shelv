import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {loadPortalCiBaselines,portalCiBaselines} from './helpers/portal-ci-baselines.ts';

const commit='e89f83ed3d4149dfaabf10d30aa3fa5b1dba59c3';
const migration='supabase/migrations/20261101191527_portal_rebuild_notifications_v1.sql';
const base='d4125cca52cb21d0c0a79a5733662f782a0dea76';
const expected='4780789ebe52ed47a3ba74bd1bae7d08dd5b115e91588288ca1413123f3b5e41';
const fixtureUrl=new URL('./fixtures/portal-ci-baselines.json',import.meta.url);
const evidence=fileURLToPath(new URL('../.local-artifacts/portal-rebuild/',import.meta.url));
mkdirSync(evidence,{recursive:true});
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');

test('historical reader supplies the complete immutable notification preimage, not current migration bytes',()=>{
  const bytes=portalCiBaselines.readBytes(commit,migration);
  assert.equal(bytes.length,22787);
  assert.equal(hash(bytes),expected);
  assert.notEqual(hash(readFileSync(new URL('../'+migration,import.meta.url))),expected);
  bytes.fill(0);
  assert.equal(hash(portalCiBaselines.readBytes(commit,migration)),expected,'a caller cannot mutate the retained preimage');
});

test('historical inventory distinguishes old absence from a missing required snapshot without current fallback',()=>{
  const paths=portalCiBaselines.paths(base);
  assert.equal(paths.length,1991);
  assert.ok(paths.includes('README.md'));
  assert.equal(paths.includes('tests/helpers/portal-ci-baselines.ts'),false);
  assert.throws(()=>portalCiBaselines.readBytes(base,'README.md'),/missing_historical_snapshot/);
  assert.throws(()=>portalCiBaselines.readBytes(base,'tests/helpers/portal-ci-baselines.ts'),/historical_path_absent/);
  assert.throws(()=>portalCiBaselines.paths(commit),/incomplete_historical_inventory/);
  assert.throws(()=>portalCiBaselines.readBytes(commit,'README.md'),/missing_historical_snapshot/,'a partial inventory cannot certify an uncaptured path absent');
  assert.throws(()=>{(paths as string[]).push('current-only');},TypeError);
});

test('historical identity refuses abbreviated, unknown and path-injected requests',()=>{
  for(const ref of ['d4125cca','b42742a1','HEAD','0'.repeat(40)]){
    assert.throws(()=>portalCiBaselines.readBytes(ref,migration),/historical_commit/);
  }
  for(const name of ['../'+migration,'/'+migration,'a/../'+migration]){
    assert.throws(()=>portalCiBaselines.readBytes(commit,name),/historical_path/);
  }
});

test('fixture corruption, wrong provenance and omitted or duplicated snapshots fail closed before a read',()=>{
  const area=mkdtempSync(path.join(evidence,'ci-baseline-negative-'));
  try{
    const original=readFileSync(fixtureUrl,'utf8');
    const parsed=JSON.parse(original);
    const mutations=[
      original.slice(0,-2),
      original.replace('e89f83ed3d4149dfaabf10d30aa3fa5b1dba59c3','0'.repeat(40)),
      JSON.stringify({...parsed,commits:[...parsed.commits,parsed.commits[0]]}),
      original.replace('"bytes": 22787','"bytes": 22786'),
      original.replace(expected,'0'.repeat(64)),
      original.replace(/"data": "[A-Za-z0-9+/=]+"/,'"data": "AA=="'),
      JSON.stringify({...parsed,commits:[]}),
    ];
    for(const [i,bytes] of mutations.entries()){
      assert.notEqual(bytes,original);
      const file=path.join(area,i+'.json');writeFileSync(file,bytes);
      assert.throws(()=>loadPortalCiBaselines(file),/historical_fixture_integrity/);
    }
  }finally{rmSync(area,{recursive:true,force:true});}
});

test('the actual shared reader works with an empty own Git store and no historical objects',()=>{
  const area=mkdtempSync(path.join(evidence,'ci-baseline-empty-'));
  try{
    const git=path.join(area,'empty.git');
    const initEnv={...process.env};
    for(const key of ['GIT_DIR','GIT_WORK_TREE','GIT_COMMON_DIR','GIT_INDEX_FILE','GIT_OBJECT_DIRECTORY','GIT_ALTERNATE_OBJECT_DIRECTORIES'])delete initEnv[key];
    const init=spawnSync('git',['init','--bare',git],{env:initEnv,encoding:'utf8'});assert.equal(init.status,0,init.stderr);
    const env={...initEnv,GIT_DIR:git,GIT_WORK_TREE:fileURLToPath(new URL('../',import.meta.url))};
    const absent=spawnSync('git',['cat-file','-e',commit+'^{commit}'],{env,encoding:'utf8'});
    assert.notEqual(absent.status,0);
    const source=`import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {portalCiBaselines as b} from ${JSON.stringify(new URL('./helpers/portal-ci-baselines.ts',import.meta.url).href)};assert.equal(createHash('sha256').update(b.readBytes(${JSON.stringify(commit)},${JSON.stringify(migration)})).digest('hex'),${JSON.stringify(expected)});assert.equal(b.paths(${JSON.stringify(base)}).length,1991);`;
    const result=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',source],{env,encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
  }finally{rmSync(area,{recursive:true,force:true});}
});
