// Actual retained ApplicationSession/cookie factories. Finite synthetic HTTP only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createCookieRequest} from '../site/auth/advisor-cookie-session.js';
import {createClientCookieRequest} from '../site/auth/client-cookie-session.js';
import * as metadata from '../site/auth/review-actions.js';
const api=await import('../src/app/advisor-review-request.ts').catch(()=>({}));
const owner='11111111-1111-4111-8111-111111111111',requestId='22222222-2222-4222-8222-222222222222';
const codes={invalid_input:400,not_ready:400,unauthorized:401,session_ended:401,forbidden:403,candidate_inactive:403,not_found:404,revision_conflict:409,request_conflict:409,approval_conflict:409,basis_conflict:409,source_conflict:409,cursor_conflict:409,photo_unavailable:409,content_version_required:409,guidance_version_required:409,guidance_conflict:409,too_large:413,unsupported_media_type:415,rate_limited:429,unavailable:503,uncertain:503};
const reads={reviews:metadata.advisorReviewReads,guidance:metadata.advisorGuidanceReads};
const actions={reviews:metadata.advisorReviewActions,guidance:metadata.advisorGuidanceActions};
const first={reviews:'read_advisor_care_history_v1',guidance:'read_guidance_draft_v1'};
const write={reviews:'record_conversation_v1',guidance:'create_guidance_draft_v1'};
const raw=(family,action=first[family])=>({schemaVersion:1,action,requestId});
const delay=()=>{let enter,release;const entered=new Promise(r=>enter=r),promise=new Promise(r=>release=r);return{entered,promise,enter,release};};
async function fixture(t,audience='advisor'){
 let login={signedIn:true,ownerId:owner,generation:1,csrf:'review-guidance-csrf',capabilities:{view:true,edit:true,publish:true,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'};
 let http=200,data={raw:'response'},hold=null;const calls=[];
 const runtime=createApplicationSession({audience,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  assert.ok([`/api/${audience}/session`,`/api/${audience}/reviews`,`/api/${audience}/guidance`,`/api/${audience}/logout`].includes(url),'unexpected HTTP '+url);
  assert.equal(new Headers(init.headers).has('authorization'),false);assert.equal(new Headers(init.headers).has('apikey'),false);
  calls.push({url,init});if(url.endsWith('/session'))return Response.json(login);if(url.endsWith('/logout'))return Response.json({signedOut:true});
  const captured={http,data};if(hold){const h=hold;hold=null;h.enter();await h.promise;}return Response.json(captured.data,{status:captured.http});
 }});
 await runtime.restore();t.after(()=>runtime.dispose());
 return {runtime,calls,setReply(v,status=200){data=v;http=status;},setLogin(value){login={...login,...value};},hold(){hold=delay();return hold;}};
}
function port(f,family){const fn=api[family==='reviews'?'createAdvisorReviewRequest':'createAdvisorGuidanceRequest'];assert.equal(typeof fn,'function','raw export exists; module absence alone is not a product RED');return fn(f.runtime);}

test('existing advisor cookie factory now recognizes only finite new channels; clients cannot gain guidance or advisor actions',async t=>{
 const f=await fixture(t);for(const family of ['reviews','guidance']){
  const execute=createCookieRequest(family,f.runtime.cookie);await execute(raw(family));
  for(const action of ['grant_task_v1','set_sami_approval_policy_v1','submit_goal_report_v1'])await assert.rejects(execute({schemaVersion:1,action}),e=>e.status===403);
  const form=new FormData();form.action=first[family];await assert.rejects(execute(form),e=>e.status===403);
 }
 const client=await fixture(t,'client');assert.throws(()=>createClientCookieRequest('guidance',client.runtime.cookie),e=>e.status===403);
 const clientReview=createClientCookieRequest('reviews',client.runtime.cookie);await assert.rejects(clientReview(raw('reviews')),e=>e.status===403);
});
for(const family of ['reviews','guidance']){
 test(family+' raw export uses actual fixed cookie/CSRF/no-store and retains only its actions',async t=>{
  const f=await fixture(t),p=port(f,family);assert.deepEqual(await p.execute(raw(family)),{raw:'response'});const c=f.calls.at(-1);
  assert.equal(c.url,'/api/advisor/'+family);assert.equal(c.init.credentials,'same-origin');assert.equal(c.init.cache,'no-store');assert.equal(c.init.redirect,'error');assert.equal(new Headers(c.init.headers).get('x-shelv-csrf'),'review-guidance-csrf');
  assert.equal('token'in f.runtime.cookie,false);assert.equal('access_token'in f.runtime.cookie,false);assert.equal('refresh_token'in f.runtime.cookie,false);
  const before=f.calls.length;for(const value of [null,[],{},undefined,{...raw(family),schemaVersion:2},{schemaVersion:1,action:'grant_task_v1'},{schemaVersion:1,action:'read_unknown'}])await assert.rejects(p.execute(value),e=>[400,403].includes(e.status));assert.equal(f.calls.length,before);
  for(const action of actions[family])await p.execute(raw(family,action));
  assert.deepEqual(f.calls.filter(c=>c.url.endsWith('/'+family)).slice(1).map(c=>JSON.parse(c.init.body).action),actions[family]);
 });
 test(family+' exact raw500000-byte bound snapshots caller wire before any awaited acquire',async t=>{
  const f=await fixture(t),p=port(f,family),base={...raw(family,write[family]),note:''},size=Buffer.byteLength(JSON.stringify(base));
  const input={...base,note:'é'.repeat(100)+'a'.repeat(500000-size-200)};await p.execute(input);assert.equal(Buffer.byteLength(f.calls.at(-1).init.body),500000);
  const before=f.calls.length;await assert.rejects(p.execute({...input,note:input.note+'a'}),e=>e.status===413);await assert.rejects(p.execute({...base,note:'é'.repeat(250000)}),e=>e.status===413);assert.equal(f.calls.length,before);
  const command={...raw(family,write[family]),nested:{value:'captured'}},wire=JSON.stringify(command);const pending=p.execute(command);command.action='grant_task_v1';command.nested.value='replaced';await pending;assert.equal(f.calls.at(-1).init.body,wire);
 });
 test(family+' every status/read503 is rejected and every write503 uncertain, with exact same UUID/body retry',async t=>{
  const f=await fixture(t),p=port(f,family);for(const action of actions[family]){
   const command=raw(family,action),wire=JSON.stringify(command);f.setReply({code:'unavailable'},503);
   await assert.rejects(p.execute(command),e=>e.status===503&&e.outcome===(reads[family].includes(action)?'rejected':'uncertain')&&e.code==='unavailable');
   assert.equal(f.runtime.cookie.status,'offline');await f.runtime.restore();f.setReply({raw:'retry'});assert.deepEqual(await p.execute(command),{raw:'retry'});assert.equal(f.calls.at(-1).init.body,wire);
  }
 });
 for(const replacement of [{ownerId:'33333333-3333-4333-8333-333333333333'},{csrf:'replacement-csrf'}])test(family+' old port cannot egress after '+Object.keys(replacement)[0]+' replacement',async t=>{
  const f=await fixture(t),p=port(f,family);f.setLogin(replacement);await f.runtime.restore();const before=f.calls.length;await assert.rejects(p.execute(raw(family)),e=>e.status===401);assert.equal(f.calls.length,before);await port(f,family).execute(raw(family));
 });
 test(family+' same owner/csrf restored after local epoch retirement never revives an old port',async t=>{
  const f=await fixture(t),p=port(f,family);f.runtime.cookie._end();await f.runtime.restore();const before=f.calls.length;await assert.rejects(p.execute(raw(family)),e=>e.status===401);assert.equal(f.calls.length,before);await port(f,family).execute(raw(family));
 });
 test(family+' local generation replacement retires captured ports before any command egress',async t=>{
  const f=await fixture(t),p=port(f,family);f.runtime.cookie.generation++;await f.runtime.restore();const before=f.calls.length;
  await assert.rejects(p.execute(raw(family)),e=>e.status===401);assert.equal(f.calls.length,before);await port(f,family).execute(raw(family));
 });
 for(const responseStatus of [200,403,409,503])test(family+' held'+responseStatus+' cannot cross CSRF replacement',async t=>{
  const f=await fixture(t),p=port(f,family);f.setReply(responseStatus===200?{raw:'private held result'}:{code:'forbidden'},responseStatus);const h=f.hold(),pending=p.execute(raw(family));const rejected=assert.rejects(pending,e=>e.status===401);
  await h.entered;f.setLogin({csrf:'replacement-csrf'});await f.runtime.restore();h.release();await rejected;
 });
 test(family+' logout retires held success and future old port work',async t=>{
  const f=await fixture(t),p=port(f,family),h=f.hold(),pending=p.execute(raw(family));const rejected=assert.rejects(pending,e=>e.status===401);await h.entered;await f.runtime.signOut();h.release();await rejected;const before=f.calls.length;await assert.rejects(p.execute(raw(family)),e=>e.status===401);assert.equal(f.calls.length,before);
 });
 test(family+' current source-policy403 remains denied with original wire, no fallback or acknowledgement',async t=>{
  const f=await fixture(t),p=port(f,family);f.setReply({code:'forbidden'},403);const input=raw(family,write[family]),wire=JSON.stringify(input);
  await assert.rejects(p.execute(input),e=>e.status===403&&e.code==='forbidden'&&e.outcome==='rejected');assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls.at(-1).init.body,wire);assert.equal(f.calls.length,2);
 });
 test(family+' aborts reject reads/write uncertainty without new egress; late abort never returns success',async t=>{
  const f=await fixture(t),p=port(f,family);for(const action of [first[family],write[family]]){const controller=new AbortController();controller.abort();const before=f.calls.length;await assert.rejects(p.execute(raw(family,action),{signal:controller.signal}),e=>e.status===503&&e.outcome===(action===first[family]?'rejected':'uncertain'));assert.equal(f.calls.length,before);}
  const controller=new AbortController(),h=f.hold(),pending=p.execute(raw(family),{signal:controller.signal});const rejected=assert.rejects(pending,e=>e.status===503&&e.outcome==='rejected');await h.entered;controller.abort();h.release();await rejected;
 });
 test(family+' finite current errors survive;401 retires authority and unknown/private namespaces are discarded',async t=>{
  const f=await fixture(t);for(const [code,http] of Object.entries(codes)){
   if(f.runtime.cookie.status!=='ready')await f.runtime.restore();const p=port(f,family);f.setReply({code},http);await assert.rejects(p.execute(raw(family)),e=>e.status===http&&e.code===(http===401?undefined:code));
  }
  await f.runtime.restore();const p=port(f,family);for(const code of ['private_error_canary','concierge_guidance_conflict','other_content_version_required']){f.setReply({code},409);await assert.rejects(p.execute(raw(family)),e=>e.status===409&&e.code===undefined);}
 });
 test(family+' client audience and disposed boundaries cannot create advisor transport',async t=>{
  const f=await fixture(t,'client'),fn=api[family==='reviews'?'createAdvisorReviewRequest':'createAdvisorGuidanceRequest'];assert.equal(typeof fn,'function');assert.throws(()=>fn(f.runtime),e=>e.status===401);assert.equal(f.calls.length,1);
  const advisor=await fixture(t);advisor.runtime.dispose();assert.throws(()=>fn(advisor.runtime),e=>e.status===401);
 });
}
