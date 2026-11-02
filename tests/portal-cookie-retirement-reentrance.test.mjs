import test from 'node:test';import assert from 'node:assert/strict';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
globalThis.fetch=async()=>{throw Error('global_network_denied');};
async function make(){const calls=[];const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{calls.push(url);assert.ok(['/api/client/session','/api/client/logout'].includes(url));if(url==='/api/client/logout')return Response.json({providerRevoked:true});if(new Headers(init.headers).get('X-Shelv-Logout')==='1')return Response.json({csrf:'reentrant-source'});return Response.json({signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'reentrant-source',capabilities:{view:true},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});}});await runtime.restore();return{runtime,calls};}
test('transport invalidation observer can read cleared memory without recursive invalidation',async()=>{
 const{runtime,calls}=await make();let active=false,reentered=false,seen=0;const observations=[];
 const stop=runtime.transport.subscribeInvalidation(()=>{seen++;if(active){reentered=true;return;}active=true;try{observations.push({value:runtime.transport.memory.get('private'),snapshot:runtime.getSnapshot().boundary});}finally{active=false;}});
 try{runtime.transport.memory.set('private','SYNTHETIC_PRIVATE');await runtime.signOut();console.log(JSON.stringify({seen,reentered,observations,logout:calls.includes('/api/client/logout')}));assert.equal(reentered,false,'reading transport memory during retirement must not synchronously reenter the same observer');assert.equal(calls.includes('/api/client/logout'),true);assert.ok(observations.every(x=>x.value===undefined&&x.snapshot===null));}finally{stop();runtime.dispose();}
});

test('transport invalidation observer can read cleared memory without recursive invalidation',async()=>{
 const{runtime,calls}=await make();let active=false,reentered=false,seen=0;const observations=[];
 const stop=runtime.transport.subscribeInvalidation(()=>{seen++;if(active){reentered=true;}active=true;try{observations.push({value:runtime.transport.memory.get('private'),snapshot:runtime.getSnapshot().boundary});}finally{active=false;}});
 try{runtime.transport.memory.set('private','SYNTHETIC_PRIVATE');await runtime.signOut();console.log(JSON.stringify({seen,reentered,observations,logout:calls.includes('/api/client/logout')}));assert.equal(reentered,false,'reading transport memory during retirement must not synchronously reenter the same observer');assert.equal(calls.includes('/api/client/logout'),true);assert.ok(observations.every(x=>x.value===undefined&&x.snapshot===null));}finally{stop();runtime.dispose();}
});

test('transport invalidation observer can read cleared memory without recursive invalidation',async()=>{
 const{runtime,calls}=await make();let active=false,reentered=false,seen=0;const observations=[],errors=[];
 const stop=runtime.transport.subscribeInvalidation(()=>{seen++;if(active){reentered=true;}active=true;try{try{observations.push({value:runtime.transport.memory.get('private'),snapshot:runtime.getSnapshot().boundary});}catch(error){errors.push(error.name);throw error;}}finally{active=false;}});
 try{runtime.transport.memory.set('private','SYNTHETIC_PRIVATE');await runtime.signOut();console.log(JSON.stringify({seen,reentered,errors,completed:observations.length,logout:calls.includes('/api/client/logout')}));assert.equal(reentered,false,'reading transport memory during retirement must not synchronously reenter the same observer');assert.equal(calls.includes('/api/client/logout'),true);assert.ok(observations.every(x=>x.value===undefined&&x.snapshot===null));}finally{stop();runtime.dispose();}
});
test('repeated reads of a retired binding do not notify its observers again',async()=>{
 const {runtime}=await make();let notifications=0;const stop=runtime.transport.subscribeInvalidation(()=>{notifications++;runtime.transport.memory.get('private');});
 try{await runtime.signOut();const settled=notifications;assert.ok(settled>0);for(let i=0;i<10;i++)assert.equal(runtime.transport.memory.get('private'),undefined);assert.equal(notifications,settled);}
 finally{stop();runtime.dispose();}
});
test('a genuinely later actual cookie binding still retires after signed-out reads settle',async()=>{
 const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';let owner=A,notifications=0;
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-'+owner,capabilities:{view:true},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});}});let stop;
 try{
  await runtime.restore();const prior=runtime.getSnapshot().boundary;runtime.transport.memory.set('private','SYNTHETIC_A');
  stop=runtime.transport.subscribeInvalidation(()=>{notifications++;assert.equal(runtime.transport.memory.get('private'),undefined);});runtime.cookie._end();assert.equal(prior.isCurrent(),false);const endedA=notifications;
  for(let i=0;i<3;i++)assert.equal(runtime.transport.memory.get('private'),undefined);assert.equal(notifications,endedA);
  owner=B;await runtime.restore();const next=runtime.getSnapshot().boundary;assert.notEqual(next,prior);assert.equal(next.isCurrent(),true);assert.equal(runtime.cookie.identity.ownerId,B);runtime.transport.memory.set('private','SYNTHETIC_B');const restoredB=notifications;
  for(let i=0;i<3;i++)assert.equal(runtime.transport.memory.get('private'),'SYNTHETIC_B');assert.equal(notifications,restoredB);
  runtime.cookie._end();assert.ok(notifications>restoredB);assert.equal(next.isCurrent(),false);assert.equal(runtime.transport.memory.get('private'),undefined);
 }finally{stop?.();runtime.dispose();}
});
