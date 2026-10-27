import test from 'node:test';import assert from 'node:assert/strict';
import {CookieAdvisorSession as BaseCookieAdvisorSession,createCookieRequest,upgradeLegacyAdvisor} from '../adapter/advisor-cookie-session.js';
const immediateLocks={request:async(_name:any,_options:any,run:any)=>run()};
class CookieAdvisorSession extends BaseCookieAdvisorSession {constructor(options:any={}){super({locks:immediateLocks,...options});}}
const ownerId='11111111-1111-4111-8111-111111111111';
const view={signedIn:true,ownerId,generation:1,csrf:'synthetic-session-csrf',capabilities:{view:true,edit:true,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T01:00:00Z',absoluteExpiresAt:'2099-01-01T08:00:00Z'};
test('cookie adapter has no token getter or storage sharing and sends same-origin JSON without Authorization',async()=>{
 const calls:any[]=[];Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('storage_must_not_be_used');}});
 const session=new CookieAdvisorSession({fetcher:async(path:any,init:any)=>{calls.push({path,init});return Response.json(path.endsWith('/session')?view:{ok:true});}});
 try{await session.restore();const lease=await session.acquire();assert.equal('token'in lease,false);assert.equal('token'in session,false);
  const request=createCookieRequest('operations',session);await request({action:'advisor_list'});const call=calls.at(-1);assert.equal(call.path,'/api/advisor/operations');assert.equal(call.init.credentials,'same-origin');assert.equal(call.init.headers.Authorization,undefined);assert.equal(call.init.headers['X-Shelv-CSRF'],view.csrf);assert.equal(call.init.cache,'no-store');assert.equal(call.init.redirect,'error');
 }finally{delete (globalThis as any).localStorage;}
});
test('logout immediately fences held replies and surfaces an uncertain server acknowledgement',async()=>{
 let release!:(r:Response)=>void;const gate=new Promise<Response>(r=>release=r);
 const session=new CookieAdvisorSession({fetcher:async(path:string)=>path.endsWith('/session')?Response.json(view):path.endsWith('/logout')?Response.json({providerRevoked:true}):gate});await session.restore();
 const request=createCookieRequest('operations',session),pending=request({action:'advisor_list'});const rejected=assert.rejects(pending,e=>(e as any).status===401);await Promise.resolve();await session.signOut();release(Response.json({private:'synthetic-canary'}));await rejected;assert.equal(session.status,'signedout');
});
test('legacy migration pauses first, retires only after acknowledged same owner, and never signs out',async()=>{
 const events:string[]=[];const pair={accessToken:'synthetic-access',refreshToken:'synthetic-refresh'};let posted:any;
 const cookie=new CookieAdvisorSession({fetcher:async(path:string,init:any)=>{if(path.endsWith('/session'))return Response.json({signedIn:false,csrf:'flow-csrf',flowExpiresAt:'2099-01-01T00:00:00Z'});posted=JSON.parse(init.body);return Response.json(view);}});
 const legacy={ownerId,pause:async()=>{events.push('pause');},readPair:()=>{events.push('read');return pair;},retireLocal:async()=>{events.push('retire');},signOut:async()=>{assert.fail('must_not_revoke_transferred_session');}};
 await upgradeLegacyAdvisor(legacy,cookie);assert.deepEqual(events,['pause','read','retire']);assert.deepEqual(posted,pair);assert.equal(cookie.status,'ready');
});
test('uncertain migration retains paused legacy data for explicit recovery and never retires or resumes it',async()=>{
 const events:string[]=[];const cookie=new CookieAdvisorSession({fetcher:async(path:string)=>{if(path.endsWith('/session'))return Response.json({signedIn:false,csrf:'flow-csrf'});throw Error('synthetic-network-failure');}});
 await assert.rejects(upgradeLegacyAdvisor({ownerId,pause:async()=>{events.push('pause');},readPair:()=>({accessToken:'synthetic',refreshToken:'synthetic'}),retireLocal:async()=>{events.push('retire');}},cookie));assert.deepEqual(events,['pause']);
});
test('restore never resurrects after logout and client mutations/uploads are refused without fetch',async()=>{
 let release!:(r:Response)=>void;let n=0;const gate=new Promise<Response>(r=>release=r);const session=new CookieAdvisorSession({fetcher:async(path:string,init:any)=>{n++;if(init?.headers?.['X-Shelv-Logout']==='1')return Response.json({csrf:'synthetic-current-csrf'});if(path.endsWith('/logout'))return Response.json({providerRevoked:true});return gate;}});
 const pending=session.restore(),rejected=assert.rejects(pending,e=>(e as any).status===401);await session.signOut();release(Response.json(view));await rejected;assert.equal(session.status,'signedout');
 const ready=new CookieAdvisorSession({fetcher:async()=>{n++;return Response.json(view);}});await ready.restore();const before=n;
 await assert.rejects(createCookieRequest('operations',ready)({action:'decide'}));await assert.rejects(createCookieRequest('checkins',ready)(new FormData()));assert.equal(n,before);
});
test('callback restores the existing pending flow without replacing it when an advisor cookie is already active',async()=>{
 const calls:any[]=[];const session=new CookieAdvisorSession({fetcher:async(path:string,init:any)=>{calls.push({path,init});return Response.json(path.endsWith('/session')?{...view,flow:{csrf:'flow-csrf'}}:view);}});
 await session.complete('synthetic-code');assert.equal(calls[0].init.headers['X-Shelv-Flow'],'1');assert.equal(calls[0].init.headers['X-Shelv-New-Flow'],undefined);assert.equal(calls[1].init.headers['X-Shelv-CSRF'],'flow-csrf');
});
test('active use revalidates a stale local idle deadline and a replacement cookie invalidates an old lease',async()=>{
 let now=Date.parse('2098-12-31T23:00:00Z'),reads=0;const session=new CookieAdvisorSession({now:()=>now,fetcher:async()=>{reads++;return Response.json({...view,csrf:reads>=3?'replacement-csrf':view.csrf,idleExpiresAt:reads===1?'2099-01-01T00:00:00Z':'2099-01-01T02:00:00Z'});}});
 await session.restore();const lease=await session.acquire();now=Date.parse('2099-01-01T00:30:00Z');assert.equal((await session.acquire()).ownerId,ownerId);assert.equal(reads,2);await session.restore();assert.equal(session.isCurrent(lease),false);
});
test('two adapter instances serialize first bootstrap response application with one named token-free lock',async()=>{
 let queue=Promise.resolve(),calls=0,active=0,maxActive=0,hasCookie=false,release!:()=>void;const gate=new Promise<void>(r=>release=r);const names:string[]=[];
 const locks={request:(name:string,options:any,run:any)=>{names.push(name);assert.equal(options.mode,'exclusive');const result=queue.then(run);queue=result.catch(()=>{});return result;}};
 const fetcher=async()=>{calls++;active++;maxActive=Math.max(maxActive,active);if(calls===1){assert.equal(hasCookie,false);await gate;hasCookie=true;}else assert.equal(hasCookie,true);active--;return Response.json({signedIn:false,csrf:`csrf-${calls}`});};
 const a=new CookieAdvisorSession({locks,fetcher}),b=new CookieAdvisorSession({locks,fetcher}),one=a.prepareFlow(),two=b.prepareFlow();await new Promise(r=>setTimeout(r,10));assert.equal(calls,1);release();await Promise.all([one,two]);assert.equal(calls,2);assert.equal(maxActive,1);assert.equal(new Set(names).size,1);assert.equal(names[0],'shelv-advisor-cookie-auth');
});
test('missing browser coordination fails closed before bootstrap or authentication fetch',async()=>{
 let calls=0;const session=new CookieAdvisorSession({locks:null,fetcher:async()=>{calls++;return Response.json(view);}});
 await assert.rejects(session.prepareFlow(),e=>(e as any).status===503);await assert.rejects(session.restore(),e=>(e as any).status===503);assert.equal(calls,0);
});
test('cross-tab logout resolves current-cookie CSRF inside the lock after a held login reply',async()=>{
 let queue=Promise.resolve(),cookie='flow',entered!:()=>void,release!:()=>void,logoutCsrf='';const started=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 const locks={request:(_name:any,_options:any,run:any)=>{const result=queue.then(run);queue=result.catch(()=>{});return result;}};
 const fetcher=async(path:string,init:any)=>{if(path.endsWith('/session'))return Response.json(init.headers?.['X-Shelv-Logout']==='1'?{csrf:cookie==='session'?view.csrf:'flow-csrf'}:{signedIn:false,csrf:'flow-csrf'});
  if(path.endsWith('/upgrade')){entered();await gate;cookie='session';return Response.json(view);}if(path.endsWith('/logout')){logoutCsrf=init.headers['X-Shelv-CSRF'];assert.equal(logoutCsrf,view.csrf);cookie='ended';return Response.json({providerRevoked:true});}assert.fail('unexpected path');};
 const a=new CookieAdvisorSession({locks,fetcher}),b=new CookieAdvisorSession({locks,fetcher});await a.prepareFlow();await b.prepareFlow();const complete=a.upgrade({accessToken:'synthetic',refreshToken:'synthetic'});await started;
 const fenced=assert.rejects(complete,(error:any)=>error.status===401);const logout=b.signOut();await new Promise(r=>setTimeout(r,10));assert.equal(logoutCsrf,'');release();await fenced;await logout;assert.equal(cookie,'ended');assert.equal(b.status,'signedout');
});
test('saved-preview operation crosses the token-free browser port with its exact revision selector',async()=>{
 const calls:any[]=[];
 const session=new CookieAdvisorSession({fetcher:async(path:string,init:any)=>{calls.push({path,init});return Response.json(path.endsWith('/session')?view:{schemaVersion:1,mode:'published'});}});
 await session.restore();
 const command={action:'advisor_preview_read_v2',clientId:ownerId,mode:'published',expectedRevision:null};
 const result=await createCookieRequest('operations',session)(command);
 assert.equal(result.mode,'published');assert.equal(calls.at(-1).path,'/api/advisor/operations');assert.deepEqual(JSON.parse(calls.at(-1).init.body),command);assert.equal(calls.at(-1).init.headers.Authorization,undefined);
 const before=calls.length;await assert.rejects(createCookieRequest('payments',session)(command),/access/);assert.equal(calls.length,before);
});
