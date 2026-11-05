import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {clientCookieRequest} from '../apps/portal/src/app/retained.ts';

globalThis.fetch=async()=>{throw Error('global_network_denied');};
const owner='11111111-1111-4111-8111-111111111111';
const login={signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-offline-return',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'};

test('native Response.json microtasks in both real-cookie lanes never invent local401 or decode an offline return',async()=>{
 let cases=0,local401=0,offlineDecodes=0;
 for(let delay=0;delay<=20;delay++)for(const failure of ['operations','payments']){
  const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
   if(url==='/api/client/session')return Response.json(login);
   assert.ok(['/api/client/operations','/api/client/payments'].includes(url));
   const failing=url.endsWith('/'+failure),response=Response.json(failing?{code:'unavailable'}:{private:'SYNTHETIC_PRIVATE_RETURN'},{status:failing?503:200});
   const json=response.json.bind(response);response.json=async()=>{if(failing)for(let i=0;i<delay;i++)await Promise.resolve();return json();};return response;
  }});
  try{await runtime.restore();const boundary=runtime.getSnapshot().boundary;
   const decode=value=>{if(runtime.cookie.status!=='ready')offlineDecodes++;assert.equal(runtime.cookie.status,'ready');return value;};
   const ports=['operations','payments'].map(channel=>runtime.transport.bindCookieChannel(clientCookieRequest,channel,'read',decode));
   const results=await Promise.allSettled([ports[0].execute({action:'service_client_read'}),ports[1].execute({schemaVersion:2,action:'client_read'})]);
   for(const result of results)if(result.status==='rejected'){if(result.reason.status===401)local401++;assert.equal(result.reason.status,503);assert.doesNotMatch(JSON.stringify(result.reason),/SYNTHETIC_PRIVATE_RETURN/);}
   assert.equal(runtime.cookie.status,'offline');assert.equal(boundary.isCurrent(),true);cases++;
  }finally{runtime.dispose();}
 }
 assert.equal(cases,42);assert.equal(local401,0);assert.equal(offlineDecodes,0);
});

for(const change of ['ended','replaced','expired'])test(`true ${change} context remains401 with no private decoding`,async()=>{
 let enter,release,view={...login};const entered=new Promise(r=>{enter=r;}),held=new Promise(r=>{release=r;});let decoded=0;
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url)=>{
  if(url==='/api/client/session')return Response.json(view);
  if(url==='/api/client/logout')return Response.json({signedOut:true});
  if(url==='/api/client/payments')return Response.json({code:'unavailable'},{status:503});
  assert.equal(url,'/api/client/operations');enter();await held;return Response.json({private:'SYNTHETIC_PRIVATE_RETURN'});
 }});
 try{await runtime.restore();const pending=runtime.transport.bindCookieChannel(clientCookieRequest,'operations','read',value=>{decoded++;return value;}).execute({action:'service_client_read'});const rejected=assert.rejects(pending,{status:401});await entered;
  await assert.rejects(runtime.transport.bindCookieChannel(clientCookieRequest,'payments','read',v=>v).execute({action:'client_read'}),{status:503});
  if(change==='ended')await runtime.signOut();
  else if(change==='replaced'){view={...view,ownerId:'22222222-2222-4222-8222-222222222222',csrf:'replacement-csrf'};await runtime.restore();}
  else{view={...view,idleExpiresAt:'2000-01-01'};await assert.rejects(runtime.restore(),{status:401});}
  release();await rejected;assert.equal(decoded,0);
 }finally{release?.();runtime.dispose();}
});
