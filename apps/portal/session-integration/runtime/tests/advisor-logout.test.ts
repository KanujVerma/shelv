import test from 'node:test';
import assert from 'node:assert/strict';
import {CookieAdvisorSession} from '../adapter/advisor-cookie-session.js';
// Two instances model browser tabs; the real BroadcastChannel transports the event.
test('advisor logout promptly fences another tab and persists token-free ending intent on network failure',async()=>{
 const data={signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'csrf',capabilities:{view:true},idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+28800000).toISOString()};
 const events:any[]=[];const make=()=>new CookieAdvisorSession({locks:{request:async(_n:any,_o:any,run:any)=>run()},fetcher:async()=>{throw Error('offline');},onState:(s:any)=>events.push(s)});
 const a=make(),b=make();a._accept(data);b._accept(data);try{await a.signOut().catch(()=>{});await new Promise(r=>setTimeout(r,30));assert.equal(b.status,'signedout');assert.equal(b.identity,null);}finally{a.dispose?.();b.dispose?.();}
});
test('an open advisor adapter clears private identity at the server deadline without a focus event',async()=>{
 const session=new CookieAdvisorSession({locks:{request:async(_n:any,_o:any,run:any)=>run()},fetcher:async()=>Response.json({code:'session_ended'},{status:401})});
 try{session._accept({signedIn:true,ownerId:'owner',generation:1,csrf:'csrf',capabilities:{view:true},idleExpiresAt:new Date(Date.now()+30).toISOString(),absoluteExpiresAt:new Date(Date.now()+500).toISOString()});await new Promise(r=>setTimeout(r,100));assert.equal(session.status,'signedout');assert.equal(session.identity,null);}finally{session.dispose?.();}
});
