import test from 'node:test';import assert from 'node:assert/strict';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {clientCookieRequest,advisorCookieRequest} from '../apps/portal/src/app/retained.ts';
const owner='11111111-1111-4111-8111-111111111111';
globalThis.fetch=async()=>{throw Error('global_network_denied');};
test('sibling HTTP503 cannot erase a real uncancelled401/403 or label an offline success as authority revocation',async()=>{
 for(const audience of ['client','advisor'] as const)for(const first of ['operations','payments'] as const)for(const status of [200,401,403]){
  let release!:()=>void;const held=new Promise<void>(r=>{release=r;});
  const runtime=createApplicationSession({audience,locks:{request:async(_n:unknown,_o:unknown,run:()=>unknown)=>run()} as unknown as Pick<LockManager,'request'>,fetcher:async(input,init)=>{
   if(input===`/api/${audience}/session`)return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-provenance',capabilities:{view:true,edit:audience==='advisor',publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});
   const path=String(input).split('/').at(-1);if(path===first)return Response.json({code:'unavailable'},{status:503});await held;return Response.json(status===200?{public:'never_accept_offline_success'}:{code:status===401?'session_ended':'forbidden'},{status});
  }});
  try{await runtime.restore();const boundary=runtime.getSnapshot().boundary;const remove=runtime.subscribe(()=>{if(runtime.cookie.status==='offline')release();});
   const factory=audience==='client'?clientCookieRequest:advisorCookieRequest;
   const operation=runtime.transport.bindCookieChannel(factory,'operations','read',v=>v),payment=runtime.transport.bindCookieChannel(factory,'payments','read',v=>v);
   const values=await Promise.allSettled([operation.execute({action:audience==='client'?'service_client_read':'advisor_list'}),payment.execute({action:audience==='client'?'client_read':'advisor_read',clientId:owner})]);
   const second=first==='operations'?values[1]!:values[0]!;assert.equal(second.status,'rejected');if(second.status!=='rejected')throw Error('unexpected success');
   assert.equal(second.reason.status,status===200?503:status,`${audience}/${first}/HTTP${status}`);
   assert.equal(runtime.cookie.status,status===401?'signedout':'offline');assert.equal(boundary?.isCurrent(),status!==401);remove();
  }finally{release?.();runtime.dispose();}
 }
});
// @ts-ignore retained JavaScript provenance is a private-map lookup, never a caller flag
import {cookieDenialStatus} from '../apps/portal/site/auth/advisor-cookie-session.js';
test('denial provenance cannot be forged with caller fields and a reentrant clock cannot classify a replacement',async()=>{
 let now=Date.now(),clock=()=>now;
 const runtime=createApplicationSession({audience:'client',now:()=>clock(),locks:{request:async(_n:unknown,_o:unknown,run:()=>unknown)=>run()} as unknown as Pick<LockManager,'request'>,fetcher:async(input)=>input==='/api/client/session'?Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-provenance',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'}):Response.json({code:'forbidden'},{status:403})});
 try{await runtime.restore();const lease=await runtime.cookie.acquire();const fake={status:403,http:true,received:true,cookieDenialStatus:403};assert.equal(cookieDenialStatus(fake,runtime.cookie,lease),null);
  let denial:unknown;try{await clientCookieRequest('operations',runtime.cookie)({action:'service_client_read'});}catch(e){denial=e;}
  assert.equal(cookieDenialStatus(denial,runtime.cookie,lease),403);clock=()=>{runtime.cookie._end();return now;};assert.equal(cookieDenialStatus(denial,runtime.cookie,lease),null);
 }finally{runtime.dispose();}
});
test('headers received only after the actual composed caller abort never revoke the still-valid session',async()=>{
 for(const status of [401,403]){let release!:()=>void,enter!:()=>void;const entered=new Promise<void>(r=>{enter=r;}),held=new Promise<void>(r=>{release=r;});const controller=new AbortController();
  const runtime=createApplicationSession({audience:'client',locks:{request:async(_n:unknown,_o:unknown,run:()=>unknown)=>run()} as unknown as Pick<LockManager,'request'>,fetcher:async(input)=>{
   if(input==='/api/client/session')return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-provenance',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});enter();await held;return Response.json({code:status===401?'session_ended':'forbidden'},{status});
  }});try{await runtime.restore();const boundary=runtime.getSnapshot().boundary;const port=runtime.transport.bindCookieChannel(clientCookieRequest,'operations','read',v=>v),pending=port.execute({action:'service_client_read'},{signal:controller.signal});await entered;controller.abort();const rejected=assert.rejects(pending,{status:503});release();await rejected;assert.equal(runtime.cookie.status,'ready');assert.equal(boundary?.isCurrent(),true);}finally{release?.();runtime.dispose();}
 }
});
test('an old HTTP401 cannot end B after actual same-owner/CSRF server-generation replacement',async()=>{
 let generation=1,enter!:()=>void,release!:()=>void;const entered=new Promise<void>(r=>{enter=r;}),held=new Promise<void>(r=>{release=r;});
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n:unknown,_o:unknown,run:()=>unknown)=>run()} as unknown as Pick<LockManager,'request'>,fetcher:async(input)=>{
  if(input==='/api/client/session')return Response.json({signedIn:true,ownerId:owner,generation,csrf:'synthetic-provenance',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});enter();await held;return Response.json({code:'session_ended'},{status:401});
 }});try{await runtime.restore();const pending=clientCookieRequest('operations',runtime.cookie)({action:'service_client_read'});await entered;generation=2;await runtime.restore();const boundary=runtime.getSnapshot().boundary;const rejected=assert.rejects(pending);release();await rejected;assert.equal(runtime.cookie.status,'ready');assert.equal(boundary?.isCurrent(),true);}finally{release?.();runtime.dispose();}
});
test('certified uncancelled current HTTP401 still ends the actual generic cookie session',async()=>{
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n:unknown,_o:unknown,run:()=>unknown)=>run()} as unknown as Pick<LockManager,'request'>,fetcher:async(input)=>input==='/api/client/session'?Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-provenance',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'}):Response.json({code:'session_ended'},{status:401})});
 try{await runtime.restore();const boundary=runtime.getSnapshot().boundary;await assert.rejects(clientCookieRequest('operations',runtime.cookie)({action:'service_client_read'}),{status:401});assert.equal(runtime.cookie.status,'signedout');assert.equal(boundary?.isCurrent(),false);}finally{runtime.dispose();}
});
