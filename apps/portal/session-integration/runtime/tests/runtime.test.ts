import test from 'node:test';import assert from 'node:assert/strict';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {buildCandidate} from '../scripts/build.mjs';import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {previewEnvelope} from './fixtures/preview-envelope';
const origin='https://portal.goshelv.com',owner='11111111-1111-4111-8111-111111111111',providerSession='22222222-2222-4222-8222-222222222222';
function access(expires=3600){return [Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({iss:'https://snojlbqovlawewwqbviz.supabase.co/auth/v1',sub:owner,session_id:providerSession,role:'authenticated',is_anonymous:false,exp:Math.floor(Date.now()/1000)+expires})).toString('base64url'),Buffer.from('synthetic').toString('base64url')].join('.');}
function name(kind:string,id:string){return `${kind}:${createHash('sha256').update(`${kind}:${id}`).digest('base64url')}`;}
function cookie(response:any,key:string){const raw=response.headers.get('set-cookie')??'';const match=raw.match(new RegExp(`(?:^|, )${key}=([^;]+)`));assert.ok(match,`missing ${key}`);return match[1];}
test('real workerd, private binding, SQLite, PKCE, refresh, revocation and assets compose with synthetic outbound only',async()=>{
 await buildCandidate();await build({entryPoints:['tests/fixtures/advisor-gateway.ts'],outfile:'dist/runtime/held-advisor-gateway.js',bundle:true,format:'esm',platform:'browser',target:'es2022',external:['cloudflare:workers']});await build({entryPoints:['tests/fixtures/runtime-vault.ts'],outfile:'dist/runtime/vault.js',bundle:true,format:'esm',platform:'browser',target:'es2022',external:['cloudflare:workers']});let refreshes=0,contexts=0,operations=0,enabled=true,wrongPreviewClient=false,hidePhoto=false;const paths:string[]=[];let heldRefresh:Promise<void>|null=null,refreshEntered:(()=>void)|null=null;
 const user={id:owner,is_anonymous:false,aud:'authenticated',email:'synthetic@example.test',created_at:new Date().toISOString(),app_metadata:{},user_metadata:{}};
 const outbound=async(req:any)=>{const url=new URL(req.url);paths.push(url.pathname);assert.equal(url.origin,'https://snojlbqovlawewwqbviz.supabase.co');
  if(url.pathname.endsWith('/otp')){const b=await req.json();assert.equal(b.create_user,false);assert.ok(b.code_challenge);return Response.json({});}
  if(url.pathname.endsWith('/token')){if(url.searchParams.get('grant_type')==='refresh_token'){refreshes++;refreshEntered?.();if(heldRefresh)await heldRefresh;}return Response.json({access_token:access(),refresh_token:`synthetic-refresh-${refreshes}`,expires_in:3600,token_type:'bearer',user});}
  if(url.pathname.endsWith('/user'))return Response.json(user);
  if(url.pathname.endsWith('/logout'))return new Response(null,{status:204});
  if(url.pathname.endsWith('/concierge_advisor_session_context')){contexts++;return enabled?Response.json({ownerId:owner,capabilities:{view:true,edit:true,publish:true,confirmPayments:true}}):Response.json({code:'forbidden'},{status:403});}
  if(url.pathname.endsWith('/concierge-operations')){
   operations++;const command=await req.json();
   if(command.action==='advisor_preview_read_v2'){
    assert.equal(command.clientId,'33333333-3333-4333-8333-333333333333');
    assert.deepEqual(Object.keys(command).sort(),['action','clientId','expectedRevision','mode']);
    assert.equal(command.expectedRevision,command.mode==='draft'?12:null);
    const e=previewEnvelope(command.mode,command.clientId,hidePhoto?[]:[{id:owner,angle:'front'}]);
    if(wrongPreviewClient)e.clientId=owner;return Response.json(e);
   }
   assert.equal(command.action,'advisor_list');return Response.json({clients:[],capabilities:{view:true}});
  }
  if(url.pathname.endsWith('/concierge-checkins')){assert.deepEqual(await req.json(),{action:'advisor_photo_view',clientId:'33333333-3333-4333-8333-333333333333',photoId:owner});return Response.json({photoId:owner,expiresIn:60,signedUrl:`https://snojlbqovlawewwqbviz.supabase.co/storage/v1/object/sign/concierge-checkin-photos/33333333-3333-4333-8333-333333333333/${owner}.png?token=synthetic-storage-signature`});}
  if(url.pathname.startsWith('/storage/v1/object/sign/'))return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/png'}});
  assert.fail('unexpected upstream path');
 };
 const rawOptions:any={cf:false,logRequests:false,upstream:origin,workers:[
  {name:'gateway',routes:['portal.goshelv.com/*'],modules:true,scriptPath:'dist/runtime/held-advisor-gateway.js',compatibilityDate:'2026-10-20',compatibilityFlags:['nodejs_compat'],bindings:{PORTAL_ORIGIN:origin},durableObjects:{ADVISOR_SESSIONS:{className:'AdvisorSessionObject',scriptName:'vault',useSQLite:true}},serviceBindings:{ASSETS:async()=>new Response('synthetic-static-asset')}},
  {name:'vault',modules:true,scriptPath:'dist/runtime/vault.js',compatibilityDate:'2026-10-20',compatibilityFlags:['nodejs_compat'],durableObjects:{ADVISOR_SESSIONS:{className:'AdvisorSessionObject',useSQLite:true}},bindings:{PORTAL_ORIGIN:origin,SUPABASE_PUBLIC_KEY:'sb_publishable_synthetic',ADVISOR_SESSION_KEYS:JSON.stringify({active:'synthetic',keys:{synthetic:Buffer.alloc(32,11).toString('base64url')}}),SESSION_IDLE_SECONDS:'3600',SESSION_ABSOLUTE_SECONDS:'28800',SESSION_FLOW_SECONDS:'600'},outboundService:outbound}
 ]};const options=()=>({...convertV4MiniflareOptions(rawOptions),unsafeInspectDurableObjects:true,telemetry:{enabled:false}});const mf=new Miniflare(options());
 try{
  const call=(path:string,body?:unknown,cookies='',csrf='',headers:Record<string,string>={})=>mf.dispatchFetch(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':'192.0.2.7',Cookie:cookies,...(body===undefined?{}:{'Content-Type':'application/json','X-Shelv-CSRF':csrf}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
  assert.equal(await (await call('/auth/session.js')).text(),'synthetic-static-asset');assert.equal((await (await mf.getWorker('vault')).fetch(origin+'/')).status,404);
  const bootstrap=await call('/api/advisor/session');assert.equal(bootstrap.status,200);const pending=await bootstrap.json() as any,fid=cookie(bootstrap,'__Host-shelv_advisor_flow');const fc=`__Host-shelv_advisor_flow=${fid}`;
  const sent=await call('/api/advisor/auth/request',{email:'synthetic@example.test'},fc,pending.csrf);assert.equal(sent.status,200,JSON.stringify({error:await sent.text(),paths}));
  const complete=await call('/api/advisor/auth/complete',{code:'synthetic-code'},fc,pending.csrf);assert.equal(complete.status,200);const session=await complete.json() as any,sid=cookie(complete,'__Host-shelv_advisor'),sc=`__Host-shelv_advisor=${sid}`;
  assert.equal(session.ownerId,owner);assert.ok(!JSON.stringify(session).includes('synthetic-refresh'));
  const storage=await mf.unsafeGetDurableObjectStorage('vault','AdvisorSessionObject',{name:name('session',sid)});const rows=await storage.exec('SELECT json FROM session_record');assert.ok(rows.length);assert.ok(!JSON.stringify(rows).includes('synthetic-refresh'));
  await mf.unsafeEvictDurableObject('vault','AdvisorSessionObject',{name:name('session',sid)});assert.equal((await call('/api/advisor/session',undefined,sc)).status,200);
  assert.equal((await call('/api/advisor/operations',{action:'advisor_list'},sc,session.csrf)).status,200);assert.equal(operations,1);assert.ok(contexts>=3);
  const selected='33333333-3333-4333-8333-333333333333';
  const commandPreview=await call('/api/advisor/operations',{action:'advisor_preview_read_v2',clientId:selected,mode:'draft',expectedRevision:12},sc,session.csrf);assert.equal(commandPreview.status,200);assert.equal((await commandPreview.json() as any).draft.savedRevision,12);
  const beforeInvalid=operations;assert.equal((await call('/api/advisor/operations',{action:'advisor_preview_read_v2',clientId:selected,mode:'published'},sc,session.csrf)).status,400);assert.equal(operations,beforeInvalid);
  for(const mode of ['draft','published','payments','checkins']){
   const response=await call(`/api/advisor/preview/${mode}?clientId=${selected}${mode==='draft'?'&expectedRevision=12':''}`,undefined,sc);assert.equal(response.status,200);const body=await response.json() as any;
   if(mode==='payments')assert.ok(Array.isArray(body.quotes));else if(mode==='checkins')assert.equal(body.reports[0].photos[0].id,owner);else{assert.equal(body.clientId,selected);assert.equal(body.mode,mode);assert.equal(body.revision,12);}
  }
  wrongPreviewClient=true;assert.equal((await call(`/api/advisor/preview/payments?clientId=${selected}`,undefined,sc)).status,503);wrongPreviewClient=false;
  const image=await call(`/api/advisor/preview/photo?clientId=${selected}&photoId=${owner}`,undefined,sc);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.deepEqual(new Uint8Array(await image.arrayBuffer()),new Uint8Array([1,2,3]));
  const signerCalls=paths.filter(p=>p.endsWith('/concierge-checkins')).length;hidePhoto=true;assert.equal((await call(`/api/advisor/preview/photo?clientId=${selected}&photoId=${owner}`,undefined,sc)).status,404);assert.equal(paths.filter(p=>p.endsWith('/concierge-checkins')).length,signerCalls);hidePhoto=false;
  const operationsBeforeHeldRace=operations;
  enabled=false;assert.equal((await call('/api/advisor/session',undefined,sc)).status,403);enabled=true;assert.equal((await call('/api/advisor/session',undefined,sc)).status,401);
  const secondBoot=await call('/api/advisor/session'),secondPending=await secondBoot.json() as any,secondFid=cookie(secondBoot,'__Host-shelv_advisor_flow'),secondFc=`__Host-shelv_advisor_flow=${secondFid}`;
  assert.equal((await call('/api/advisor/auth/request',{email:'synthetic@example.test'},secondFc,secondPending.csrf)).status,200);
  const lostReply=await call('/api/advisor/auth/complete',{code:'synthetic-second-code'},secondFc,secondPending.csrf);assert.equal(lostReply.status,200);const lateSid=cookie(lostReply,'__Host-shelv_advisor');
  assert.equal((await call('/api/advisor/logout',{},secondFc,secondPending.csrf)).status,200);
  assert.equal((await call('/api/advisor/session',undefined,`__Host-shelv_advisor=${lateSid}`)).status,401);
  // A second independent login provides near-expiry credentials through the private RPC seam only.
  const ns:any=await mf.getDurableObjectNamespace('ADVISOR_SESSIONS','vault'),syntheticId='c'.repeat(43),stub=ns.getByName(name('session',syntheticId));
  const init=await stub.invoke({type:'session.initialize',credentials:{access_token:access(30),refresh_token:'synthetic-near-expiry',expires_at:Math.floor(Date.now()/1000)+30,user:{id:owner},providerSessionId:providerSession},grant:'synthetic-grant'});assert.equal(init.ok,true);
  const both=await Promise.all([stub.invoke({type:'session.view'}),stub.invoke({type:'session.view'})]);assert.ok(both.every((x:any)=>x.ok));assert.equal(refreshes,1);assert.equal(both[0].value.generation,both[1].value.generation);
  const out=await stub.invoke({type:'session.logout',csrf:init.value.csrf});assert.equal(out.ok,true);assert.equal((await stub.invoke({type:'session.view'})).error.status,401);
  const raceId='d'.repeat(43),race=ns.getByName(name('session',raceId));const raceInit=await race.invoke({type:'session.initialize',credentials:{access_token:access(30),refresh_token:'synthetic-race-refresh',expires_at:Math.floor(Date.now()/1000)+30,user:{id:owner},providerSessionId:providerSession},grant:'synthetic-race-grant'});assert.equal(raceInit.ok,true);
  let release!:()=>void;const entered=new Promise<void>(r=>refreshEntered=r);heldRefresh=new Promise<void>(r=>release=r);
  const delayed=race.invoke({type:'session.execute',csrf:raceInit.value.csrf,operation:{kind:'command',channel:'operations',command:{action:'advisor_list'}}});await entered;
  const raceLogout=await race.invoke({type:'session.logout-context'});assert.equal(raceLogout.ok,true);assert.equal((await race.invoke({type:'session.logout',csrf:raceLogout.value.csrf})).ok,true);release();assert.equal((await delayed).error.status,401);assert.equal(operations,operationsBeforeHeldRace);
  const raceStorage=await mf.unsafeGetDurableObjectStorage('vault','AdvisorSessionObject',{name:name('session',raceId)});const raceRows=await raceStorage.exec('SELECT json FROM session_record');assert.equal(JSON.parse(String(raceRows[0].json)).credentials,null);heldRefresh=null;refreshEntered=null;
  for(const preserve of [false,true]){
   const priorFid=(preserve?'f':'e').repeat(43),priorFlow=ns.getByName(name('flow',priorFid)),priorBoot=await priorFlow.invoke({type:'flow.bootstrap'});
   const priorComplete=await priorFlow.invoke({type:'flow.upgrade',csrf:priorBoot.value.csrf,pair:{accessToken:access(),refreshToken:'synthetic-prior-flow'}});assert.equal(priorComplete.ok,true,JSON.stringify(priorComplete.error));
   const priorSc=`__Host-shelv_advisor=${priorComplete.value.sessionId}`,priorFc=`__Host-shelv_advisor_flow=${priorFid}`;
   const replacement=await call('/api/advisor/session',undefined,`${priorFc}${preserve?`; ${priorSc}`:''}`,'',{'X-Shelv-New-Flow':'1'});assert.equal(replacement.status,200);
   const replacementData=await replacement.json() as any,replacementFc=`__Host-shelv_advisor_flow=${cookie(replacement,'__Host-shelv_advisor_flow')}`;
   assert.equal((await call('/api/advisor/session',undefined,priorSc)).status,preserve?200:401);
   assert.equal((await call('/api/advisor/logout',{},preserve?`${priorSc}; ${replacementFc}`:replacementFc,preserve?priorComplete.value.session.csrf:replacementData.csrf)).status,200);
   assert.equal((await call('/api/advisor/session',undefined,priorSc)).status,401);
  }
  const coordinatedFid='i'.repeat(43);await ns.getByName(name('flow',coordinatedFid)).invoke({type:'flow.bootstrap'});
  const coordinatedFc=`__Host-shelv_advisor_flow=${coordinatedFid}`,freshReplies=await Promise.all([call('/api/advisor/session',undefined,coordinatedFc,'',{'X-Shelv-New-Flow':'1'}),call('/api/advisor/session',undefined,coordinatedFc,'',{'X-Shelv-New-Flow':'1'})]);
  assert.ok(freshReplies.every(r=>r.status===200));assert.equal(cookie(freshReplies[0],'__Host-shelv_advisor_flow'),cookie(freshReplies[1],'__Host-shelv_advisor_flow'),'concurrent fresh flows must share one durable authority');
  const coordinatedCurrent=await (await call('/api/advisor/session',undefined,coordinatedFc,'',{'X-Shelv-Flow':'1'})).json() as any;
  for(const reply of freshReplies){const data=await reply.json() as any;if(data.csrf!==coordinatedCurrent.csrf){const stale=await call('/api/advisor/session/upgrade',{accessToken:access(),refreshToken:'synthetic-stale-restart'},coordinatedFc,data.csrf);assert.equal(stale.status,403);assert.equal(stale.headers.get('set-cookie'),null);}}
  const coordinatedComplete=await call('/api/advisor/session/upgrade',{accessToken:access(),refreshToken:'synthetic-coordinated-flow'},coordinatedFc,coordinatedCurrent.csrf);assert.equal(coordinatedComplete.status,200);
  assert.equal((await call('/api/advisor/logout',{},coordinatedFc,coordinatedCurrent.csrf)).status,200);
  assert.equal((await call('/api/advisor/session',undefined,`__Host-shelv_advisor=${cookie(coordinatedComplete,'__Host-shelv_advisor')}`)).status,401);
  await raceStorage.exec('DELETE FROM session_record');
  const staleCookies=`__Host-shelv_advisor=${raceId}; ${coordinatedFc}`,recovered=await call('/api/advisor/session',undefined,staleCookies,'',{'X-Shelv-New-Flow':'1'});assert.equal(recovered.status,200);assert.match(recovered.headers.get('set-cookie')!,/Max-Age=0/);
  const logoutRecovery=await call('/api/advisor/session',undefined,staleCookies,'',{'X-Shelv-Logout':'1'});assert.equal(logoutRecovery.status,200);const logoutRecoveryData=await logoutRecovery.json() as any;assert.equal((await call('/api/advisor/logout',{},staleCookies,logoutRecoveryData.csrf)).status,200);
  const replay=await call('/api/advisor/auth/complete',{code:'synthetic-code'},fc,pending.csrf);assert.equal(replay.status,401);
  // Expired pending ciphertext must be erased even after Worker key configuration is withdrawn.
  const expiryFid='g'.repeat(43),expiryFlow=ns.getByName(name('flow',expiryFid)),expiryBoot=await expiryFlow.invoke({type:'flow.bootstrap'});
  assert.equal((await expiryFlow.invoke({type:'flow.request',csrf:expiryBoot.value.csrf,email:'synthetic@example.test'})).ok,true);
  const expiryStore=await mf.unsafeGetDurableObjectStorage('vault','AdvisorSessionObject',{name:name('flow',expiryFid)}),expiryRows=await expiryStore.exec('SELECT json FROM session_record');const expiryRecord=JSON.parse(String(expiryRows[0].json));expiryRecord.expiresAt=Date.now()-1000;await expiryStore.exec('UPDATE session_record SET json=?',JSON.stringify(expiryRecord));
  const referenceFid='h'.repeat(43),referenceFlow=ns.getByName(name('flow',referenceFid)),referenceBoot=await referenceFlow.invoke({type:'flow.bootstrap'});
  assert.equal((await referenceFlow.invoke({type:'flow.upgrade',csrf:referenceBoot.value.csrf,pair:{accessToken:access(),refreshToken:'synthetic-reference-flow'}})).ok,true);
  const referenceStore=await mf.unsafeGetDurableObjectStorage('vault','AdvisorSessionObject',{name:name('flow',referenceFid)}),referenceRows=await referenceStore.exec('SELECT json FROM session_record'),referenceRecord=JSON.parse(String(referenceRows[0].json));
  assert.equal(referenceRecord.payloadKind,'reference');referenceRecord.status='failed';referenceRecord.revocationPending=true;referenceRecord.expiresAt=Date.now()-1000;referenceRecord.cleanupAt=Date.now()+1500;await referenceStore.exec('UPDATE session_record SET json=?',JSON.stringify(referenceRecord));
  delete rawOptions.workers[1].bindings.ADVISOR_SESSION_KEYS;await mf.setOptions(options());
  const noKeys:any=await mf.getDurableObjectNamespace('ADVISOR_SESSIONS','vault');assert.equal((await noKeys.getByName(name('flow',expiryFid)).invoke({type:'flow.bootstrap'})).error.status,503);
  const referenceAfter=noKeys.getByName(name('flow',referenceFid));await assert.rejects(referenceAfter.testRunAlarm());
  const nextAlarm=await referenceAfter.testGetAlarm();assert.ok(nextAlarm!==null&&nextAlarm<=referenceRecord.cleanupAt,'failed retirement must preserve the bounded cleanup alarm');
  const erasedByDeadline=async(store:any,attempts:number)=>{for(let i=0;i<attempts;i++){try{const rows=await store.exec('SELECT json FROM session_record');if(!rows.length||JSON.parse(String(rows[0].json)).payload===null)return true;}catch(error){if((error as Error).message.includes('no such table: session_record'))return true;throw error;}await new Promise(r=>setTimeout(r,30));}return false;};
  const afterWithdrawal=await mf.unsafeGetDurableObjectStorage('vault','AdvisorSessionObject',{name:name('flow',expiryFid)});assert.equal(await erasedByDeadline(afterWithdrawal,30),true);
  const afterReferenceWithdrawal=await mf.unsafeGetDurableObjectStorage('vault','AdvisorSessionObject',{name:name('flow',referenceFid)});assert.equal(await erasedByDeadline(afterReferenceWithdrawal,100),true,'retirement reference must be erased at the known deadline without keys');
 }finally{await mf.dispose();}
});
