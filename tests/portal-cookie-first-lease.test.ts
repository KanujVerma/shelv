import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {clientCookieRequest} from '../apps/portal/src/app/retained.ts';
import {TransportError} from '../apps/portal/src/transport/session.ts';
import type {CookieChannel} from '../apps/portal/src/transport/session.ts';
import {mapPaymentViewV2} from '../supabase/functions/concierge-payments/methods.ts';
import {mapServiceView} from '../src/contracts/ConciergeService.ts';

globalThis.fetch=async()=>{throw Error('global_network_denied');};
const owner='11111111-1111-4111-8111-111111111111';
const login={signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-first-lease',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'};
const payment={schemaVersion:2,revision:0,quotes:[],claims:[],service:{status:'active',period:null},nextServicePeriod:null,shippingAddress:null,shippingAddresses:[]};
const service={revision:0,reviews:[],instructions:[],purchases:[],returns:[],cancellation:null};
const command=(channel:CookieChannel)=>channel==='payments'?{schemaVersion:2,action:'client_read'}:{action:'service_client_read'};
const deferred=()=>{let resolve!:()=>void;return {promise:new Promise<void>(r=>{resolve=r;}),resolve:()=>resolve()};};
async function fixture(){
 const calls:string[]=[];let view={...login};
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n:unknown,_o:unknown,run:()=>unknown)=>run()} as unknown as Pick<LockManager,'request'>,fetcher:async(url,init)=>{
  calls.push(String(url));if(url==='/api/client/session')return Response.json(view);
  assert.ok(['/api/client/payments','/api/client/operations','/api/client/checkins'].includes(String(url)));
  assert.equal(init?.cache,'no-store');assert.equal(init?.credentials,'same-origin');
  if(url==='/api/client/checkins')return Response.json({code:'unavailable'},{status:503});
  return Response.json(url==='/api/client/payments'?payment:service);
 }});await runtime.restore();
 const cookie=runtime.cookie as typeof runtime.cookie&{suspend():void};
 return {runtime,cookie,calls,async outage(){await assert.rejects(clientCookieRequest('checkins',runtime.cookie)({action:'client_read'}),{status:503});},async restore(patch:Partial<typeof login>={}){view={...view,...patch};return runtime.restore();}};
}

for(const channel of ['payments','operations'] as const)for(const kind of ['read','write'] as const)test(`actual first ${channel}/${kind} lease released after real sibling503 stays unavailable without dispatch/decode`,async()=>{
 const f=await fixture(),entered=deferred(),release=deferred();let decoded=0;
 try{
  const original=f.runtime.cookie.acquire.bind(f.runtime.cookie);let first=true;
  f.runtime.cookie.acquire=async()=>{const lease=await original();if(first){first=false;entered.resolve();await release.promise;}return lease;};
  const boundary=f.runtime.getSnapshot().boundary,port=f.runtime.transport.bindCookieChannel(clientCookieRequest,channel,kind,value=>{decoded++;return value;});
  const input=command(channel),wire=JSON.stringify(input);const pending=port.execute(input);
  const rejected=assert.rejects(pending,{status:503,outcome:kind==='write'?'uncertain':'rejected'});
  await entered.promise;await f.outage();release.resolve();await rejected;
  assert.equal(decoded,0);assert.equal(f.calls.includes(`/api/client/${channel}`),false);assert.equal(JSON.stringify(input),wire);
  assert.equal(boundary!.isCurrent(),true);assert.equal(f.runtime.cookie.status,'offline');
 }finally{release.resolve();f.runtime.dispose();}
});

for(const stage of ['acquire','post-acquire-applicability','pre-invoke-applicability','decode-return','decode-error','cleanup'] as const)test(`real suspension at ${stage} never fabricates401 or returns private data`,async()=>{
 const f=await fixture();let decodeCalls=0,applies=0;
 try{
  if(stage==='acquire'){
   const original=f.runtime.cookie.acquire.bind(f.runtime.cookie);f.runtime.cookie.acquire=async()=>{const lease=await original();f.cookie.suspend();return lease;};
  }
  const controller=new AbortController();
  if(stage==='cleanup'){
   const remove=controller.signal.removeEventListener.bind(controller.signal);
   controller.signal.removeEventListener=((...args:Parameters<AbortSignal['removeEventListener']>)=>{remove(...args);f.cookie.suspend();}) as AbortSignal['removeEventListener'];
  }
  const port=f.runtime.transport.bindCookieChannel(clientCookieRequest,'payments','write',value=>{
   decodeCalls++;const result=mapPaymentViewV2(value);
   if(stage==='decode-return'||stage==='decode-error')f.cookie.suspend();
   if(stage==='decode-error')throw new TransportError(409);
   return result;
  });
  const isApplicable=()=>{applies++;if(stage==='post-acquire-applicability'&&applies===2||stage==='pre-invoke-applicability'&&applies===3)f.cookie.suspend();return true;};
  await assert.rejects(port.execute(command('payments'),{signal:controller.signal,...(stage.includes('applicability')?{isApplicable}:{})}),{status:503,outcome:'uncertain'});
  assert.equal(f.runtime.cookie.status,'offline');assert.equal(f.runtime.getSnapshot().boundary!.isCurrent(),true);
  if(['acquire','post-acquire-applicability','pre-invoke-applicability'].includes(stage)){assert.equal(decodeCalls,0);assert.equal(f.calls.includes('/api/client/payments'),false);}
 }finally{f.runtime.dispose();}
});

for(const change of ['end','owner','server-generation','expired'] as const)test(`actual ${change} during first lease cannot borrow its returned lease or affect B`,async()=>{
 const f=await fixture(),entered=deferred(),release=deferred();let decoded=0;
 try{
  const original=f.runtime.cookie.acquire.bind(f.runtime.cookie);let first=true;
  f.runtime.cookie.acquire=async()=>{const lease=await original();if(first){first=false;entered.resolve();await release.promise;}return lease;};
  const pending=f.runtime.transport.bindCookieChannel(clientCookieRequest,'payments','read',value=>{decoded++;return mapPaymentViewV2(value);}).execute(command('payments'));
  const denied=assert.rejects(pending,{status:401});await entered.promise;
  await f.outage();
  if(change==='end')f.runtime.cookie._end();
  if(change==='owner')await f.restore({ownerId:'22222222-2222-4222-8222-222222222222',csrf:'replacement'});
  if(change==='server-generation')await f.restore({generation:2});
  if(change==='expired')await assert.rejects(f.restore({idleExpiresAt:'2000-01-01'}),{status:401});
  release.resolve();await denied;assert.equal(decoded,0);
  if(change==='owner'||change==='server-generation'){
   assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.runtime.getSnapshot().boundary!.isCurrent(),true);
   assert.deepEqual(await f.runtime.transport.bindCookieChannel(clientCookieRequest,'operations','read',value=>mapServiceView(value,false)).execute(command('operations')),mapServiceView(service,false));
  }
 }finally{release.resolve();f.runtime.dispose();}
});

test('a failed actual acquire supplies no lease and cannot reuse an earlier acquired actor',async()=>{
 const f=await fixture();try{
  const port=f.runtime.transport.bindCookieChannel(clientCookieRequest,'payments','read',value=>mapPaymentViewV2(value));
  assert.deepEqual(await port.execute(command('payments')),mapPaymentViewV2(payment));
  const original=f.runtime.cookie.acquire.bind(f.runtime.cookie);f.runtime.cookie.acquire=async()=>{f.runtime.cookie._end();return original();};
  await assert.rejects(port.execute(command('payments')),{status:401});assert.equal(f.runtime.cookie.status,'signedout');
 }finally{f.runtime.dispose();}
});

for(const change of ['suspend','end'] as const)test(`actual currentness clock ${change} cannot certify an obsolete private success`,async()=>{
 const f=await fixture();try{
  const clock=f.runtime.cookie.now;assert.equal(typeof clock,'function');if(!clock)throw Error('actual clock missing');const actual=()=>clock.call(f.runtime.cookie);let armed=false;
  f.runtime.cookie.now=()=>{const now=actual();if(armed){armed=false;if(change==='suspend')f.cookie.suspend();else f.runtime.cookie._end();}return now;};
  const port=f.runtime.transport.bindCookieChannel(clientCookieRequest,'payments','read',value=>{const result=mapPaymentViewV2(value);armed=true;return result;});
  await assert.rejects(port.execute(command('payments')),{status:change==='suspend'?503:401});
 }finally{f.runtime.dispose();}
});
