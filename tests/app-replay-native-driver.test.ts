import assert from 'node:assert/strict';
import test from 'node:test';
import {createLocalAppReplayDriver,type LocalAppReplayNativePort} from '../src/presentation/session-replay/localNativeDriver.ts';

const nonce='00000000-0000-4000-8000-000000000001';
function port(overrides:Partial<LocalAppReplayNativePort>={}){
 const calls:string[]=[];
 const native:LocalAppReplayNativePort={actualAppAvailability:()=> 'local_only_v1',actualAppPrepare:async()=>{calls.push('prepare');return nonce;},
  actualAppStart:async value=>{calls.push('start:'+value);return true;},actualAppRevoke:()=>{calls.push('revoke');},actualAppFlush:()=>{calls.push('flush');},...overrides};
 return {native,calls};
}

test('only the isolated local native capability can create a driver; there are no host/token arguments',async()=>{
 const {native,calls}=port();const driver=createLocalAppReplayDriver(native);assert.ok(driver);
 assert.equal(await driver.start(1,()=>true),true);assert.deepEqual(calls,['prepare','start:'+nonce]);
 for(const value of ['available','release_disabled','isolated_debug_bundle_required',''])assert.equal(createLocalAppReplayDriver(port({actualAppAvailability:()=>value}).native),null);
 assert.equal(createLocalAppReplayDriver(null),null);
});

test('a closed JS lease never prepares or starts native capture',async()=>{
 const {native,calls}=port();const driver=createLocalAppReplayDriver(native)!;
 assert.equal(await driver.start(1,()=>false),false);assert.equal(calls.length,0);
});

test('Stop during prepare closes native permission and late prepare cannot call Start',async()=>{
 let finish:(value:string)=>void=()=>{};let current=true;
 const {native,calls}=port({actualAppPrepare:()=>new Promise(resolve=>{finish=resolve;})});const driver=createLocalAppReplayDriver(native)!;
 const start=driver.start(1,()=>current);current=false;driver.revoke();finish(nonce);
 assert.equal(await start,false);assert.equal(calls.some(value=>value.startsWith('start:')),false);assert.equal(calls.at(-1),'revoke');
});

test('Stop during native Start cannot regain a JS grant after completion',async()=>{
 let finish:(value:boolean)=>void=()=>{};let current=true;
 const {native,calls}=port({actualAppStart:()=>new Promise(resolve=>{finish=resolve;})});const driver=createLocalAppReplayDriver(native)!;
 const start=driver.start(1,()=>current);await Promise.resolve();current=false;driver.revoke();finish(true);
 assert.equal(await start,false);assert.equal(calls.at(-1),'revoke');
});

test('bad native nonce, false start and private failures fail closed without disclosure',async()=>{
 for(const value of ['','not-a-nonce','SYNTHETIC_PRIVATE_ERROR']){
  const {native,calls}=port({actualAppPrepare:async()=>value});const driver=createLocalAppReplayDriver(native)!;
  assert.equal(await driver.start(1,()=>true),false);assert.equal(calls.some(value=>value.startsWith('start:')),false);
 }
 const driver=createLocalAppReplayDriver(port({actualAppStart:async()=>{throw Error('SYNTHETIC_PRIVATE_ERROR');}}).native)!;
 assert.equal(await driver.start(1,()=>true),false);
});


test('native stop events must match the current generated run and cannot stop a later run',async()=>{
 const {native}=port();const driver=createLocalAppReplayDriver(native)!;
 assert.equal(await driver.start(1,()=>true),true);
 assert.ok('isCurrentNativeRun' in driver);
 const matches=(driver as unknown as {isCurrentNativeRun(value:unknown):boolean}).isCurrentNativeRun;
 assert.equal(matches(nonce),true);assert.equal(matches('SYNTHETIC_OLD_RUN'),false);
 driver.revoke();assert.equal(matches(nonce),false);
});
