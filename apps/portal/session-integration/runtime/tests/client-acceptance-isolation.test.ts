import test from 'node:test';
import assert from 'node:assert/strict';
import {ClientProvider} from '../server/client-upstream';
import {CookieClientSession,createClientCookieRequest,createClientPhotoUpload} from '../../candidate/site/auth/client-cookie-session.js';

const owners=['11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333'];
const sessions=['22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444'];
const caps={view:true,edit:false,publish:false,confirmPayments:false};
function credentials(i:number){return {access_token:[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:owners[i],session_id:sessions[i],exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'synthetic'].join('.'),refresh_token:`synthetic-refresh-${i}`,expires_at:Date.now()/1000+3600,user:{id:owners[i]},providerSessionId:sessions[i]};}
const command:any={kind:'command',channel:'operations',command:{action:'client_read_v2'}};
function view(i:number){return {signedIn:true,ownerId:owners[i],generation:1,csrf:`synthetic-csrf-${i}`,remembered:true,capabilities:caps,idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+86400000).toISOString()};}

test('one client provider alternates two owners without caching authorization or accepting mismatched context',async()=>{
 const pairs=owners.map((_,i)=>credentials(i));let mismatch=false;const seen:string[]=[];
 const provider=new ClientProvider('sb_publishable_synthetic',async(input:any,init:any)=>{
  const authorization=new Headers(init.headers).get('Authorization');
  const i=pairs.findIndex(c=>authorization===`Bearer ${c.access_token}`);assert.notEqual(i,-1);
  seen.push(`${i}:${new URL(String(input)).pathname}`);
  if(String(input).includes('/rest/v1/rpc/'))return Response.json({ownerId:owners[mismatch?1-i:i],providerSessionId:sessions[i],role:'client',sessionNotAfter:null,capabilities:caps});
  return Response.json({ownerId:owners[i],plan:{version:i+1,publicCanary:`PUBLIC_OWNER_${i}`}});
 });
 for(const i of [0,1,0]){
  assert.equal((await provider.context(pairs[i])).ownerId,owners[i]);
  const result=await provider.perform(pairs[i],caps,command);
  assert.deepEqual(result.body,{ownerId:owners[i],plan:{version:i+1,publicCanary:`PUBLIC_OWNER_${i}`}});
 }
 assert.equal(seen.length,6);mismatch=true;await assert.rejects(provider.context(pairs[0]),(e:any)=>e.status===403);
 assert.equal(seen.length,7,'mismatched context performs no domain request');
});

test('client egress rejects nested private notes and provider credentials while allowing public plan data',async()=>{
 const c=credentials(0);let body:any;
 const provider=new ClientProvider('sb_publishable_synthetic',async()=>Response.json(body));
 for(const hidden of [{meetingNotes:['PRIVATE_CANARY']},{nested:{private_notes:'PRIVATE_CANARY'}},{access_token:c.access_token},{nested:{value:c.refresh_token}}]){
  body={plan:{version:1},...hidden};await assert.rejects(provider.perform(c,caps,command),(e:any)=>e.status===503);
 }
 body={plan:{version:1,rationale:'Public recommendation'}};assert.deepEqual((await provider.perform(c,caps,command)).body,body);
});

test('held JSON, evidence and photo replies from client A cannot appear after same-generation client B restore',async()=>{
 for(const transport of ['json','evidence','photo']){
  const s=new CookieClientSession({locks:{request:async(_n:any,_o:any,fn:any)=>fn()}});s._accept(view(0));
  let entered!:()=>void,release!:(v:any)=>void;const waiting=new Promise<void>(r=>entered=r);
  s._fetch=()=>{entered();return new Promise(r=>release=r);};
  const file=new Blob(['synthetic'],{type:'image/png'}),form=new FormData();form.set('file',file);form.set('metadata','{}');
  const pending=transport==='json'?createClientCookieRequest('operations',s)({action:'client_read_v2'}):transport==='evidence'?createClientCookieRequest('payments',s)(form):createClientPhotoUpload(s)({file,angle:'front',requestId:owners[0],completionRequestId:owners[0],expectedRevision:0});
  try{await waiting;s._accept(view(1));release({publicCanary:'PUBLIC_OWNER_0'});await assert.rejects(pending,(e:any)=>e.status===401);assert.equal(s.identity.ownerId,owners[1]);assert.equal(s.status,'ready');assert.equal((await s.acquire()).ownerId,owners[1]);}
  finally{s.dispose();}
 }
});
