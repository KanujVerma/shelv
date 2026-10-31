import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {execFile,execFileSync} from 'node:child_process';
import {promisify} from 'node:util';
import {readdir,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {attestFixture} from '../scripts/rebuild-native-fixture.mjs';
import {connectedStack,sourceRoot,artifacts} from './rebuild-native-stack.mjs';

assert.equal(process.env.SHELV_REBUILD_NATIVE_FAILURE_PROBES,'1');assert.equal(process.env.SHELV_REBUILD_NATIVE,'1');
const f=await attestFixture(sourceRoot),checks=[];
await mkdir(artifacts,{recursive:true});
const zeroAuth=()=>{assert.equal(f.sql('select count(*) from auth.sessions'),'0');assert.equal(f.sql('select count(*) from auth.refresh_tokens'),'0');};
const directories=async()=>new Set((await readdir(artifacts)).filter(name=>name.startsWith('stack-')));
function ownRuntimeProcesses() {
  const rows=execFileSync('ps',['-axo','pid=,ppid=,command='],{encoding:'utf8'}).split('\n').map(line=>{const match=line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);return match?{pid:Number(match[1]),parent:Number(match[2]),command:match[3]}:null;}).filter(Boolean);
  const descendants=new Set([process.pid]);for(let n=0;n<5;n++)for(const row of rows)if(descendants.has(row.parent))descendants.add(row.pid);
  return rows.filter(row=>descendants.has(row.pid)&&/\/workerd(?:\s|$)/.test(row.command)).map(row=>row.pid);
}

test('runtime readiness rejection disposes its actual Miniflare acquisition before returning failure',async()=>{
  zeroAuth();const blocker=net.createServer();await new Promise((resolve,reject)=>{blocker.once('error',reject);blocker.listen(0,'127.0.0.1',resolve);});
  const port=blocker.address().port,events=[];let rescue;
  try {
    await assert.rejects(connectedStack(f,{failureProbe:{listenPort:port},onRuntime(value){events.push(value.event);if(value.event==='allocated')rescue=value.dispose;}}));
    assert.equal(events.filter(event=>event==='readiness-failure-disposed').length,1,'Actual rejected acquisition must dispose before rejection escapes');
    const runtimePids=ownRuntimeProcesses();assert.deepEqual(runtimePids,[],'No owned runtime process may remain before diagnostic rescue');
    checks.push({label:'occupied-loopback-port actual readiness rejection',events,authIssued:0,ownedRuntimePidsBeforeRescue:runtimePids,status:'PASS'});
  } finally {try{await rescue?.();}catch{}finally{await new Promise(resolve=>blocker.close(resolve));zeroAuth();}}
});

for(const [label,value] of [['invalid-run','not-a-valid-run'],['missing-receipt','00000000-0000-4000-8000-000000000001']]) {
  test(label+' fails before runtime allocation or Auth issuance',async()=>{
    zeroAuth();const before=await directories();let failure;
    try {
      await promisify(execFile)(process.execPath,['--experimental-strip-types',path.join(sourceRoot,'apps/portal/tests/rebuild-native-readonly-browser.mjs')],{cwd:sourceRoot,env:{...process.env,SHELV_REBUILD_NATIVE_BROWSER:'1',SHELV_REBUILD_NATIVE_CASE_RUN:value},timeout:15000,maxBuffer:1024*1024});
    }catch(error){failure=error;}
    assert.equal(failure?.code,1,'Preflight should fail promptly without a runtime/Chrome process');
    const added=[...await directories()].filter(name=>!before.has(name));assert.deepEqual(added,[],'Invalid preflight must not allocate a stack');zeroAuth();
    checks.push({label,status:'PASS',newRuntimeDirectories:0,authIssued:0});
  });
}

test.after(async()=>{await writeFile(path.join(artifacts,'cleanup-negative-result.json'),JSON.stringify({checks,fixtureSessions:Number(f.sql('select count(*) from auth.sessions')),fixtureRefreshTokens:Number(f.sql('select count(*) from auth.refresh_tokens'))},null,2)+'\n',{mode:0o600});});
