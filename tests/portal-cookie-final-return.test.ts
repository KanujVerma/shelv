import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {clientCookieRequest} from '../apps/portal/src/app/retained.ts';
import {TransportError} from '../apps/portal/src/transport/session.ts';
import {mapPaymentViewV2} from '../supabase/functions/concierge-payments/methods.ts';

globalThis.fetch=async()=>{throw Error('global_network_denied');};
const owner='11111111-1111-4111-8111-111111111111';
const canary='SYNTHETIC_FINAL_RETURN_PRIVATE_ADDRESS';
const address={recipientName:canary,line1:'1 Synthetic Address',line2:'',city:'Madison',region:'WI',postalCode:'53703',countryCode:'US'};
const payment={schemaVersion:2,revision:1,quotes:[],claims:[],service:{status:'active',period:null},nextServicePeriod:null,shippingAddress:{version:1,address},shippingAddresses:[{version:1,address}]};
const modes=['live','initial-irrelevant','cleanup-irrelevant','cleanup-throws','cleanup-suspends','cleanup-ends','cleanup-aborts'] as const;

for(const kind of ['read','write'] as const)for(const mode of modes)test(`actual ${kind} private return rechecks ${mode} after caller cleanup`,async()=>{
 let applies=mode!=='initial-irrelevant',removed=0,decoded=0,dispatched=0,checksAfterCleanup=0;
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n:unknown,_o:unknown,run:()=>unknown)=>run()} as unknown as Pick<LockManager,'request'>,fetcher:async(url,init)=>{
  assert.ok(['/api/client/session','/api/client/payments'].includes(String(url)),'closed synthetic HTTP only');
  if(url==='/api/client/session')return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-final-return',capabilities:{view:true},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});
  assert.deepEqual(JSON.parse(String(init?.body)),{schemaVersion:2,action:'client_read'});
  assert.equal(init?.cache,'no-store');assert.equal(init?.credentials,'same-origin');
  assert.equal(new Headers(init?.headers).get('x-shelv-csrf'),'synthetic-final-return');
  dispatched++;return Response.json(payment);
 }});
 try{
  await runtime.restore();const cookie=runtime.cookie as typeof runtime.cookie&{suspend():void};const boundary=runtime.getSnapshot().boundary;assert.ok(boundary);
  const caller=new AbortController(),remove=caller.signal.removeEventListener.bind(caller.signal);
  caller.signal.removeEventListener=((...args:Parameters<AbortSignal['removeEventListener']>)=>{
   remove(...args);removed++;
   if(mode==='cleanup-irrelevant')applies=false;
   if(mode==='cleanup-suspends')cookie.suspend();
   if(mode==='cleanup-ends')runtime.cookie._end();
   if(mode==='cleanup-aborts')caller.abort();
  }) as AbortSignal['removeEventListener'];
  const port=runtime.transport.bindCookieChannel(clientCookieRequest,'payments',kind,value=>{decoded++;return mapPaymentViewV2(value);});
  let value:ReturnType<typeof mapPaymentViewV2>|undefined,error:unknown;
  try{value=await port.execute({schemaVersion:2,action:'client_read'},{signal:caller.signal,isApplicable:()=>{
   if(removed){checksAfterCleanup++;if(mode==='cleanup-throws')throw Error('local relevance observer failed');}
   return applies;
  }});}catch(cause){error=cause;}
  if(mode==='live'){
   assert.equal(error,undefined);assert.ok(value);assert.equal(JSON.stringify(value).includes(canary),true);
   assert.equal(dispatched,1);assert.equal(decoded,1);assert.equal(removed,1);
  }else{
   assert.ok(error instanceof TransportError,'cleanup relevance/cancellation must reject private success');
   assert.equal(error.status,mode==='cleanup-ends'?401:503);
   assert.equal(error.outcome,mode==='cleanup-ends'?'session-ended':kind==='write'?'uncertain':'rejected');
   assert.equal(value,undefined);assert.equal(JSON.stringify(value)?.includes(canary)??false,false);
  }
  if(mode==='initial-irrelevant'){assert.equal(dispatched,0);assert.equal(decoded,0);assert.equal(removed,0);}
  if(mode==='cleanup-irrelevant'||mode==='cleanup-throws')assert.ok(checksAfterCleanup>0);
  if(mode!=='cleanup-ends'){assert.equal(runtime.getSnapshot().boundary,boundary);assert.equal(boundary.isCurrent(),true);}
  if(mode==='cleanup-suspends')assert.equal(runtime.cookie.status,'offline');
  if(mode==='cleanup-ends')assert.equal(runtime.cookie.status,'signedout');
 }finally{runtime.dispose();}
});
