import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanupConciergePrivateStorage, type ConciergeCleanupPort } from '../supabase/functions/concierge-operations/private-storage-cleanup.ts';
import { ownerId } from './fixtures/concierge.ts';

test('private concierge cleanup inventories nested orphans, removes both buckets and verifies empty', async () => {
  const objects = new Map([
    ['concierge-payment-evidence',new Set([`${ownerId}/quote/evidence.png`])],
    ['concierge-checkin-photos',new Set([`${ownerId}/photo.png`])],
  ]);
  const removed: string[]=[];
  const port: ConciergeCleanupPort={
    list:async(bucket,prefix,offset)=>({error:false,entries:offset ? [] : [...new Set([...objects.get(bucket)!].filter(p=>p.startsWith(prefix+'/')).map(p=>p.slice(prefix.length+1).split('/')[0]))].map(name=>({name,id:objects.get(bucket)!.has(prefix+'/'+name)?'synthetic':null}))}),
    remove:async(bucket,paths)=>{for(const p of paths){removed.push(bucket+'/'+p);objects.get(bucket)!.delete(p);}return true;},
  };
  assert.equal(await cleanupConciergePrivateStorage(ownerId,port),true);
  assert.equal(removed.length,2);assert.equal([...objects.values()].every(v=>v.size===0),true);
});

test('cross-owner path names, list failures, uncertain removal and residual bytes fail closed', async () => {
  for(const kind of ['unsafe','list','remove','residual']){
    let removes=0;
    const port: ConciergeCleanupPort={
      list:async()=>({error:kind==='list',entries:[{name:kind==='unsafe'?'../other/photo.png':'photo.png',id:'synthetic'}]}),
      remove:async()=>{removes++;return kind!=='remove';},
    };
    assert.equal(await cleanupConciergePrivateStorage(ownerId,port),false,kind);
    if(['unsafe','list'].includes(kind)) assert.equal(removes,0);
  }
});

test('storage exceptions and invalid identities never escape or reach another namespace',async()=>{
  const port: ConciergeCleanupPort={list:async()=>{throw Error('private backend detail');},remove:async()=>{assert.fail('unexpected removal');}};
  assert.equal(await cleanupConciergePrivateStorage(ownerId,port),false);
  assert.equal(await cleanupConciergePrivateStorage('../other',port),false);
});
