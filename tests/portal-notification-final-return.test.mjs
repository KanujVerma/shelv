import test from 'node:test';import assert from 'node:assert/strict';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {createNotificationRequest} from '../apps/portal/src/app/notification-request.ts';
import {createPhotoInventoryRequest} from '../apps/portal/src/app/photo-inventory-request.ts';
globalThis.fetch=async()=>{throw Error('global_network_denied');};
const owner='11111111-1111-4111-8111-111111111111';
const command={schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:5};
const eventId='55555555-5555-4555-8555-555555555555';
const page={schemaVersion:1,consistency:'live_keyset',observedAt:'2026-11-01T12:00:00.000Z',cursor:null,items:[{deliveryId:'33333333-3333-4333-8333-333333333333',revision:4,seenAt:null,event:{eventId,createdAt:'2026-11-01T00:00:00Z',source:{kind:'publication',publicationVersion:47},destination:{kind:'plan_version',version:47}},email:null}],nextCursor:null};
const mark={schemaVersion:1,action:'mark_seen_v1',requestId:'22222222-2222-4222-8222-222222222222',deliveryId:'33333333-3333-4333-8333-333333333333',expectedRevision:4};
const receipt={requestId:mark.requestId,action:mark.action,deliveryId:mark.deliveryId,previousRevision:4,revision:5,recordedAt:'2026-11-01T12:00:00.000Z',effect:'seen'};
for(const kind of ['read','write'])for(const mode of ['live','irrelevant','abort','suspend','end','caps'])test(`notification facade final await boundary ${kind} ${mode}`,async()=>{
 let applies=true,hooked=false,changed=false,dispatch=0;
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  assert.ok(['/api/client/session','/api/client/notifications'].includes(url));
  if(url==='/api/client/session')return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-r4',capabilities:{view:true},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});
  assert.deepEqual(JSON.parse(init.body),kind==='read'?command:mark);dispatch++;return Response.json(kind==='read'?page:receipt);
 }});
 const any=AbortSignal.any,caller=new AbortController();let api;
 try{
  await runtime.restore();api=createNotificationRequest(runtime);const boundary=runtime.getSnapshot().boundary;
  AbortSignal.any=function(signals){const signal=any.call(this,signals);if(!hooked){hooked=true;const remove=signal.removeEventListener.bind(signal);signal.removeEventListener=(...args)=>{remove(...args);queueMicrotask(()=>{changed=true;if(mode==='irrelevant')applies=false;if(mode==='abort')caller.abort();if(mode==='suspend')runtime.cookie.suspend();if(mode==='end')runtime.cookie._end();if(mode==='caps')runtime.cookie._view.capabilities.view=false;});};}return signal;};
  let value,error;try{value=await api.execute(kind==='read'?command:mark,{signal:caller.signal,isApplicable:()=>applies});}catch(e){error=e;}
  const observation={kind,mode,changed,dispatch,applies,aborted:caller.signal.aborted,status:runtime.cookie.status,boundarySame:runtime.getSnapshot().boundary===boundary,valueReturned:value!==undefined,privateMetadataReturned:JSON.stringify(value)?.includes(kind==='read'?eventId:mark.deliveryId)??false,errorStatus:error?.status};console.log(JSON.stringify(observation));
  assert.equal(changed,true);assert.equal(dispatch,1);
  if(mode==='live'){assert.equal(error,undefined);assert.deepEqual(value,kind==='read'?page:receipt);}
  else {assert.equal(error?.status,mode==='end'?401:mode==='caps'?403:503);assert.equal(value,undefined);}
 }finally{AbortSignal.any=any;api?.dispose();runtime.dispose();}
});
