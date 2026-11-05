import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrowserFinalExportStaging} from '../src/features/account/final-export/writer.ts';

async function boundedOutcome(promise) {
  let timer;
  try { return await Promise.race([
    promise.then(()=>'fulfilled', ()=>'rejected'),
    new Promise(resolve=>{timer=setTimeout(()=>resolve('pending'),50);}),
  ]); } finally { clearTimeout(timer); }
}

test('overlapping abort rejects while the owned backing abort is still pending', async () => {
  let release, entered;
  const waiting=new Promise(resolve=>{release=resolve;}),started=new Promise(resolve=>{entered=resolve;});
  const writer=createBrowserFinalExportStaging({async createWritable(){return{
    async write(){},async close(){},async abort(){entered();await waiting;},
  };}},()=>{});
  await writer.open();const first=writer.abort();await started;
  const result=await boundedOutcome(writer.abort());
  assert.equal(writer.getDisposition(),'aborting');release();await first;
  assert.equal(result,'rejected','a second abort must not wait for or acknowledge an unfinished abort');
});

test('a reentrant backing abort rejects instead of waiting on its own cleanup promise', async () => {
  let writer,aborts=0;
  writer=createBrowserFinalExportStaging({async createWritable(){return{
    async write(){},async close(){},async abort(){aborts++;await writer.abort();},
  };}},()=>{});
  await writer.open();
  assert.equal(await boundedOutcome(writer.abort()),'rejected','cleanup must not await itself');
  assert.equal(aborts,1);assert.equal(writer.getDisposition(),'abort-unconfirmed');
});

test('writer acquisition is dispatched while current, before a subsequent retirement', async () => {
  let current=true,createdAfterRetirement=false;
  const writer=createBrowserFinalExportStaging({async createWritable(){
    createdAfterRetirement=!current;
    return{async write(){},async close(){},async abort(){}};
  }},()=>{if(!current)throw Error('retired');});
  const opening=writer.open();current=false;
  await assert.rejects(opening);
  assert.equal(createdAfterRetirement,false,'open must not defer a new backing acquisition past authority retirement');
});
