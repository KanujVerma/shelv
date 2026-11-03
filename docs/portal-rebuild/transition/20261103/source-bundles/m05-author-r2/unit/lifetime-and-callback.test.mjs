import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';import {webcrypto} from 'node:crypto';
import {NativeLifetime} from '../source/native-lifetime.mjs';
const callbackSource=readFileSync(new URL('../source/page-observer.mjs',import.meta.url),'utf8');
const exactCallback=callbackSource.slice(callbackSource.indexOf('export async function pageObserver')).replace('export async function','async function');
const args={op:'install',key:'__negative_control',nonce:'CONTROL',origin:'https://127.0.0.1:54321',version:7,mode:'consumer'};
function callbackWorld(nativeFetch){const win={location:{href:args.origin+'/history'},fetch:nativeFetch};const callback=runInNewContext('('+exactCallback+')',{window:win,URL,Headers,TextEncoder,crypto:webcrypto,Promise,Object,Reflect,Error,Uint8Array,Set});return {win,callback};}

test('raw native EventTarget ownership precedes a later validation failure',async()=>{
  const life=new NativeLifetime(50),target=new EventTarget();let calls=0;const listener=()=>calls++;
  await life.acquire('native listener',()=>{target.addEventListener('tick',listener);return target;},t=>t.removeEventListener('tick',listener));
  assert.throws(()=>{throw new Error('later validation refused');});target.dispatchEvent(new Event('tick'));assert.equal(calls,1);
  const r=await life.close();target.dispatchEvent(new Event('tick'));assert.equal(calls,1);assert.equal(r.observations[0].rawAcquired,true);assert.equal(r.observations[0].cleaned,true);
});
test('acquisition rejection never claims raw success or invokes an inverse',async()=>{
  const life=new NativeLifetime(50);let inverse=0;await assert.rejects(life.acquire('reject',()=>Promise.reject(new Error('RAW REFUSED')),()=>inverse++));const r=await life.close();assert.equal(r.observations[0].rawAcquired,false);assert.equal(inverse,0);assert.match(r.errors[0].message,/RAW REFUSED/);
});
test('late native acquisition remains owned and is cleaned after both bounded joins refused',async()=>{
  const life=new NativeLifetime(1),target=new EventTarget();let release,cleaned=0;const p=life.acquire('late native',()=>new Promise(resolve=>release=resolve),raw=>{assert.equal(raw,target);cleaned++;});
  const r=await life.close();assert.ok(r.pending.length);release(target);await p;await new Promise(resolve=>setImmediate(resolve));assert.equal(cleaned,1);assert.equal(life.slots[0].owned,false);
});
test('retirement blocks reentrant acquisition and cleanup failure stays unresolved',async()=>{
  const life=new NativeLifetime(50);await life.acquire('cleanup-failure',()=>new EventTarget(),()=>{assert.throws(()=>life.acquire('foreign',()=>null,()=>{}),/retired/);throw new Error('NATIVE INVERSE REFUSED');});
  const r=await life.close();assert.ok(r.errors.some(e=>e.message==='NATIVE INVERSE REFUSED'));assert.ok(r.pending.some(v=>v.includes('unjoined native slot')));
});
test('first join observes pending native work before inverse; second join includes cleanup',async()=>{
  const life=new NativeLifetime(50),order=[];let finish;await life.acquire('native',()=>new EventTarget(),async()=>{order.push('inverse');await Promise.resolve();order.push('inverse-joined');});
  const work=life.watch('native work',new Promise(resolve=>finish=()=>{order.push('work');resolve();}));const closed=life.close();finish();await work;const r=await closed;assert.deepEqual(order,['work','inverse','inverse-joined']);assert.equal(r.pending.length,0);
});

test('exact page callback passes identical native fetch arguments/signal and rethrows identical rejection',async()=>{
  const refusal=new TypeError('ALWAYS FAIL FETCH'),seen=[];const {win,callback}=callbackWorld(function(...values){seen.push({self:this,values});return Promise.reject(refusal);});
  const before=Object.getOwnPropertyDescriptor(win,'fetch');await callback(args);const controller=new AbortController(),init={method:'POST',headers:{'X-Shelv-CSRF':'CONTROL NOT ISSUED'},body:'{"schemaVersion":1,"action":"read_client_plan_v3","version":7}',credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal};
  await assert.rejects(win.fetch('/api/client/reviews',init),e=>e===refusal);assert.equal(seen.length,1);assert.equal(seen[0].self,win);assert.equal(seen[0].values[0],'/api/client/reviews');assert.equal(seen[0].values[1],init);assert.equal(seen[0].values[1].signal,controller.signal);assert.equal(controller.signal.aborted,false);
  const snapshot=await callback({...args,op:'snapshot'});assert.ok(snapshot.records.some(e=>e.type==='native-fetch-rejected'));assert.equal(snapshot.records.some(e=>e.type==='json-value-returned'),false);assert.equal('csrf' in snapshot.original,false);
  await callback({...args,op:'restore'});assert.deepEqual(Object.getOwnPropertyDescriptor(win,'fetch'),before);assert.equal(Object.hasOwn(win,args.key),false);
});
test('exact callback preserves a synchronous native throw and leaves AbortController untouched',async()=>{
  const refusal=new Error('SYNC FETCH REFUSED'),{win,callback}=callbackWorld(()=>{throw refusal;});await callback(args);assert.throws(()=>win.fetch('/anything'),e=>e===refusal);await callback({...args,op:'restore'});
});
test('foreign fetch replacement is never overwritten during owned restore',async()=>{
  const {win,callback}=callbackWorld(()=>Promise.reject(new Error('ALWAYS FAIL FETCH')));await callback(args);const foreign=()=>Promise.reject(new Error('FOREIGN ALWAYS FAIL'));win.fetch=foreign;const r=await callback({...args,op:'restore'});assert.equal(win.fetch,foreign);assert.ok(r.errors.some(e=>e.phase==='fetch-restore'));
});
test('partial callback install refuses a nonconfigurable native property and removes only its own binding',async()=>{
  const {win,callback}=callbackWorld(()=>Promise.reject(new Error('ALWAYS FAIL FETCH')));const native=win.fetch;Object.defineProperty(win,'fetch',{value:native,configurable:false,writable:false});await assert.rejects(callback(args));assert.equal(win.fetch,native);assert.equal(Object.hasOwn(win,args.key),false);
});
test('missing captured issued request refuses replay without invoking fetch',async()=>{
  let calls=0;const {callback}=callbackWorld(()=>{calls++;return Promise.reject(new Error('ALWAYS FAIL FETCH'));});await callback(args);await assert.rejects(callback({...args,op:'probe'}),/original issued read unavailable/);assert.equal(calls,0);await callback({...args,op:'restore'});
});
test('replay still rejects through the real failing native fetch, never a Response substitute',async()=>{
  const refusal=new Error('ALWAYS FAIL FETCH'),seen=[];const {win,callback}=callbackWorld((...values)=>{seen.push(values);return Promise.reject(refusal);});await callback(args);
  await assert.rejects(win.fetch('/api/client/reviews',{method:'POST',headers:{'X-Shelv-CSRF':'CONTROL NOT ISSUED'},body:'{"schemaVersion":1,"action":"read_client_plan_v3","version":7}'}),e=>e===refusal);
  await assert.rejects(callback({...args,op:'probe'}),e=>e===refusal);assert.equal(seen.length,2);assert.equal(seen[1][1].headers.Cookie,undefined);assert.equal(seen[1][1].credentials,'same-origin');assert.equal(seen[1][1].headers['X-Shelv-CSRF'],'CONTROL NOT ISSUED');await callback({...args,op:'restore'});
});
test('an unrelated JSON-return record cannot count as selected delayed-result delivery',()=>{
  const source=readFileSync(new URL('../source/negative-schedules.mjs',import.meta.url),'utf8');const expression=source.match(/const returned=(snap\.records\.some\([^\n]*?\)),cancelled=/)?.[1];assert.ok(expression);
  const delivered=runInNewContext(expression,{targetHash:'SELECTED',targetFlight:'HELD',targetJson:'HELD:json:1',snap:{records:[{type:'json-value-returned',localFlightLabel:'OTHER',requestSha256:'UNRELATED'},{type:'native-json-rejected',localFlightLabel:'HELD',requestSha256:'SELECTED',name:'AbortError'}]}});assert.equal(delivered,false);
  const identical=runInNewContext(expression,{targetHash:'SAME-BODY',targetFlight:'HELD',targetJson:'HELD:json:1',snap:{records:[{type:'json-value-returned',localFlightLabel:'OTHER',requestSha256:'SAME-BODY'}]}});assert.equal(identical,false);
  const otherJson=runInNewContext(expression,{targetHash:'SAME-BODY',targetFlight:'HELD',targetJson:'HELD:json:1',snap:{records:[{type:'json-value-returned',localFlightLabel:'HELD',localJsonLabel:'HELD:json:2',requestSha256:'SAME-BODY'}]}});assert.equal(otherJson,false);
});
test('identical-body distinct failing native fetch occurrences are ambiguous, never pick first or last',async()=>{
  const {win,callback}=callbackWorld(()=>Promise.reject(new Error('ALWAYS FAIL FETCH')));await callback(args);const init={method:'POST',headers:{'X-Shelv-CSRF':'CONTROL NOT ISSUED'},body:'{"schemaVersion":1,"action":"read_client_plan_v3","version":7}'};
  await Promise.allSettled([win.fetch('/api/client/reviews',init),win.fetch('/api/client/reviews',init)]);const s=await callback({...args,op:'snapshot'});assert.equal(s.original,null);assert.ok(s.errors.some(e=>/ambiguous/.test(e.message)));await callback({...args,op:'restore'});
});
test('unrelated failures, pre-retirement aborts and generic network failures do not close cancellation',()=>{
  const source=readFileSync(new URL('../source/negative-schedules.mjs',import.meta.url),'utf8');const expression=source.match(/,cancelled=(original\.failed[^;]+);/)?.[1];assert.ok(expression);
  for(const original of [{failed:null,failedOrder:null},{failed:'net::ERR_ABORTED',failedOrder:9},{failed:'net::ERR_CONNECTION_RESET',failedOrder:11}])assert.equal(runInNewContext(expression,{original,retiredOrder:10}),false);
});
