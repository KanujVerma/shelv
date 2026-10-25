import test from 'node:test';
import assert from 'node:assert/strict';
import {CookieClientSession,createClientCookieRequest,createClientPhotoUpload,useClientCookies} from '../../candidate/site/auth/client-cookie-session.js';
const owner='11111111-1111-4111-8111-111111111111';
const view={signedIn:true,ownerId:owner,generation:1,csrf:'csrf-synthetic',remembered:true,capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+86400000).toISOString()};
const locks={request:async(_n:any,_o:any,fn:any)=>fn()};
test('client routing is opt-in, excludes advisor intent and all public sample routes',()=>{
 for(const path of ['/?workspace=advisor','/#/advisor','/?advisorPreview=published','/?preview=1#/client'])assert.equal(useClientCookies({clientSharedSessions:true},new URL('https://portal.goshelv.com'+path)),false);
 assert.equal(useClientCookies({clientSharedSessions:false},new URL('https://portal.goshelv.com/')),false);assert.equal(useClientCookies({clientSharedSessions:true},new URL('https://portal.goshelv.com/')),true);
});
test('failed logout persists only a boolean intent and reload retries revocation before any restore',async()=>{
 const data=new Map();const prior=globalThis.localStorage;Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)}});
 let fail=true,active=true,reads=0,completes=0;
 const fetcher=async(path:string,init:any)=>{if(path.endsWith('/auth/complete')){completes++;return Response.json(view);}if(path.endsWith('/logout')){if(fail)throw Error('offline');active=false;return Response.json({providerRevoked:true});}if(init.headers['X-Shelv-Logout']==='1')return Response.json({csrf:'csrf-synthetic'});reads++;return Response.json(active?view:{signedIn:false,csrf:'flow-synthetic'});};
 const a=new CookieClientSession({fetcher,locks});let b:any;
 try{await a.restore();await assert.rejects(a.signOut());assert.deepEqual([...data.values()],['1']);b=new CookieClientSession({fetcher,locks});await assert.rejects(b.restore());assert.equal(reads,1,'pending logout must not attempt authenticated restore');await assert.rejects(b.complete('retained-completed-code'));assert.equal(completes,0,'retained callback must not bypass failed logout');fail=false;assert.equal(await b.restore(),null);assert.equal(data.size,0);assert.equal(active,false);}
 finally{a.dispose();b?.dispose();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:prior});}
});
test('held multipart and raw-photo replies cannot return data after local logout epoch changes',async()=>{
 for(const raw of [false,true]){let release!:(v:any)=>void;const s=new CookieClientSession({locks,fetcher:async()=>Response.json(view)});s._accept(view);s._fetch=()=>new Promise(r=>release=r);
  const file=new Blob(['synthetic'],{type:'image/png'}),form=new FormData();form.set('file',file);form.set('metadata','{}');
  const pending=raw?createClientPhotoUpload(s)({file,angle:'front',requestId:owner,completionRequestId:owner,expectedRevision:0}):createClientCookieRequest('payments',s)(form);
  await new Promise(r=>setImmediate(r));s._end();release({private:'PRIVATE_CANARY'});await assert.rejects(pending);s.dispose();
 }
});

test('readable but unwritable storage cannot erase same-instance failed logout intent',async()=>{
 const prior=globalThis.localStorage;Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{throw Error('quota');},removeItem:()=>{}}});
 let restores=0,completes=0;const s=new CookieClientSession({locks,fetcher:async(path,init)=>{if(path.endsWith('/logout'))throw Error('offline');if(path.endsWith('/auth/complete'))completes++;if(!init.headers['X-Shelv-Logout'])restores++;return Response.json(view);}});
 try{await s.restore();await assert.rejects(s.signOut());await assert.rejects(s.restore());await assert.rejects(s.complete('retained-code'));assert.equal(restores,1);assert.equal(completes,0);}
 finally{s.dispose();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:prior});}
});

test('token-free ending cookie preserves failed logout across fresh adapters when localStorage is denied',async()=>{
 const oldStore=globalThis.localStorage,oldDocument=globalThis.document;let marker='';
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');},removeItem:()=>{}}});
 Object.defineProperty(globalThis,'document',{configurable:true,value:{get cookie(){return marker;},set cookie(v){marker=v.includes('Max-Age=0')?'':v.split(';')[0];}}});
 let reads=0;const fetcher=async(path,init)=>{if(path.endsWith('/logout'))throw Error('offline');if(!init.headers['X-Shelv-Logout'])reads++;return Response.json(view);};
 const a=new CookieClientSession({locks,fetcher});let b;
 try{await a.restore();await assert.rejects(a.signOut());assert.equal(marker,'__Host-shelv_client_ending=1');b=new CookieClientSession({locks,fetcher});await assert.rejects(b.restore());await assert.rejects(b.complete('retained-code'));assert.equal(reads,1);}
 finally{a.dispose();b?.dispose();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:oldStore});Object.defineProperty(globalThis,'document',{configurable:true,value:oldDocument});}
});
