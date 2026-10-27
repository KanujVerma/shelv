import test from 'node:test';import assert from 'node:assert/strict';
import {previewEnvelope} from './fixtures/preview-envelope';
import {SupabaseProvider} from '../server/upstream';import {SessionError} from '../server/types';
const owner='11111111-1111-4111-8111-111111111111',sessionId='22222222-2222-4222-8222-222222222222',clientId='33333333-3333-4333-8333-333333333333';
const caps={view:true,edit:true,publish:true,confirmPayments:true};
function published(photos:any[]=[]){return previewEnvelope('published',clientId,photos.map(p=>({...p,angle:'front'})));}
function token(){return [Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:owner,session_id:sessionId,iss:'https://snojlbqovlawewwqbviz.supabase.co/auth/v1',exp:Math.floor(Date.now()/1000)+3600,role:'authenticated',is_anonymous:false})).toString('base64url'),'synthetic-signature'].join('.');}
function setup(){const calls:any[]=[];let failRefresh=false,response:unknown={ok:true};
 const user={id:owner,is_anonymous:false,aud:'authenticated',role:'authenticated',email:'synthetic@example.test',created_at:new Date().toISOString(),app_metadata:{},user_metadata:{}};
 const fetcher:typeof fetch=async(input,init)=>{const req=new Request(input,init),url=new URL(req.url);const raw=req.method==='POST'?await req.text():'';const body=raw?JSON.parse(raw):null;calls.push({url:url.href,body,headers:req.headers});
  if(url.pathname.endsWith('/otp'))return Response.json({});
  if(url.pathname.endsWith('/token')){if(failRefresh)return new Response('synthetic-sensitive-canary',{status:503});return Response.json({access_token:token(),refresh_token:'synthetic-rotated-refresh',expires_in:3600,token_type:'bearer',user});}
  if(url.pathname.endsWith('/user'))return Response.json(user);
  if(url.pathname.endsWith('/logout'))return Response.json({});
  if(url.pathname.endsWith('/concierge_advisor_session_context'))return Response.json({ownerId:owner,capabilities:caps});
  return Response.json(response);
 };
 const provider=new SupabaseProvider('sb_publishable_synthetic',fetcher);const credentials={access_token:token(),refresh_token:'synthetic-refresh',expires_at:Date.now()/1000+3600,user:{id:owner},providerSessionId:sessionId};
 return {provider,calls,credentials,fail:()=>{failRefresh=true;},respond:(value:unknown)=>{response=value;}};
}
test('pinned Auth SDK requests existing-account PKCE and exchanges only its encrypted-storage verifier',async()=>{
 const f=setup(),sdk=await f.provider.requestOtp('synthetic@example.test');const otp=f.calls.find(x=>x.url.includes('/otp'));
 assert.equal(otp.body.create_user,false);assert.equal(otp.body.code_challenge_method,'s256');assert.ok(otp.body.code_challenge);assert.ok(JSON.stringify(sdk).includes('code-verifier'));
 const pair=await f.provider.exchange('synthetic-code',sdk);assert.equal(pair.user.id,owner);const exchange=f.calls.find(x=>x.url.includes('/token?grant_type=pkce'));assert.equal(exchange.body.auth_code,'synthetic-code');assert.ok(exchange.body.code_verifier);
 assert.equal((await f.provider.context(pair)).capabilities.view,true);
});
test('SDK refresh uses public key, pins identity and performs no transport retry on uncertainty',async()=>{
 const f=setup();const fresh=await f.provider.refresh(f.credentials);assert.equal(fresh.providerSessionId,sessionId);assert.equal(f.calls.filter(x=>x.url.includes('grant_type=refresh_token')).length,1);
 f.fail();await assert.rejects(f.provider.refresh(fresh));assert.equal(f.calls.filter(x=>x.url.includes('grant_type=refresh_token')).length,2);
 assert.ok(f.calls.every(x=>x.headers.get('apikey')==='sb_publishable_synthetic'));
 assert.throws(()=>new SupabaseProvider('sb_secret_synthetic',fetch),/configuration_missing/);
});
test('legacy upgrade verifies the supplied unexpired JWT through Auth and current authorization without refresh',async()=>{
 const f=setup();const credentials=await f.provider.upgrade({accessToken:f.credentials.access_token,refreshToken:f.credentials.refresh_token});
 assert.equal(credentials.user.id,owner);assert.equal(credentials.providerSessionId,sessionId);
 assert.ok(f.calls.some(x=>new URL(x.url).pathname.endsWith('/user')));assert.ok(f.calls.some(x=>new URL(x.url).pathname.endsWith('/concierge_advisor_session_context')));
 assert.ok(f.calls.every(x=>!new URL(x.url).pathname.endsWith('/token')));
});
test('logout uses the normal user-JWT endpoint with scope=local and never refreshes',async()=>{
 const f=setup();await f.provider.logout(f.credentials);assert.equal(f.calls.length,1);assert.match(f.calls[0].url,/\/auth\/v1\/logout\?scope=local$/);assert.equal(f.calls[0].headers.get('authorization'),`Bearer ${f.credentials.access_token}`);
});
test('operation allowlist and capabilities reject client mutations and forbidden publish before upstream',async()=>{
 const f=setup();await assert.rejects(f.provider.perform(f.credentials,caps,{kind:'command',channel:'operations',command:{action:'decide',clientId}}),/action_forbidden/);assert.equal(f.calls.length,0);
 await assert.rejects(f.provider.perform(f.credentials,{...caps,publish:false},{kind:'command',channel:'operations',command:{action:'publish_v2',clientId}}),/forbidden/);assert.equal(f.calls.length,0);
 await f.provider.perform(f.credentials,caps,{kind:'command',channel:'operations',command:{action:'advisor_read_v2',clientId}});assert.match(f.calls.at(-1).url,/\/functions\/v1\/concierge-operations$/);assert.equal(f.calls.at(-1).headers.get('origin'),'https://portal.goshelv.com');
});
test('upstream errors and successful credential canaries never cross the gateway contract',async()=>{
 const f=setup();f.respond({access_token:'synthetic-canary'});await assert.rejects(f.provider.perform(f.credentials,caps,{kind:'command',channel:'operations',command:{action:'advisor_list'}}),/unavailable/);
});
test('advisor photo link has no storage signature and preview photo verifies client-visible membership first',async()=>{
 const f=setup();const result=await f.provider.perform(f.credentials,caps,{kind:'command',channel:'checkins',command:{action:'advisor_photo_view',clientId,photoId:owner}});
 assert.equal(f.calls.length,0);assert.match((result.body as any).signedUrl,/^https:\/\/portal.goshelv.com\/api\/advisor\/preview\/photo\?/);assert.ok(!(result.body as any).signedUrl.includes('token='));
 f.respond(published());await assert.rejects(f.provider.perform(f.credentials,caps,{kind:'photo',clientId,photoId:owner}),/photo_unavailable/);assert.equal(f.calls.length,1);assert.match(f.calls[0].url,/concierge-operations$/);
});
test('Worker transport uses supported manual redirects and rejects every redirect before reading private data',async()=>{
 let calls=0,mode:string|undefined;const provider=new SupabaseProvider('sb_publishable_synthetic',async(_input,init)=>{calls++;mode=init?.redirect;return new Response(null,{status:302,headers:{Location:'https://evil.example/private'}});});const f=setup();
 await assert.rejects(provider.context(f.credentials),e=>(e as any).status===503);assert.equal(calls,1);assert.equal(mode,'manual');
});
test('normal provider logout accepts an empty 204 response',async()=>{
 const f=setup();const provider=new SupabaseProvider('sb_publishable_synthetic',async()=>new Response(null,{status:204}));await provider.logout(f.credentials);
});
test('photo proxy returns bounded image bytes only for the exact visible photo path',async()=>{
 const f=setup(),photoId=owner;let bad=false,calls=0;const provider=new SupabaseProvider('sb_publishable_synthetic',async(input)=>{calls++;const url=new URL(String(input));
  if(url.pathname.endsWith('/concierge-operations'))return Response.json(published([{id:photoId}]));
  if(url.pathname.endsWith('/concierge-checkins'))return Response.json({photoId,expiresIn:60,signedUrl:`https://snojlbqovlawewwqbviz.supabase.co/storage/v1/object/sign/concierge-checkin-photos/${clientId}/${bad?sessionId:photoId}.png?token=synthetic-storage-signature`});
  return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/png'}});
 });
 const result=await provider.perform(f.credentials,caps,{kind:'photo',clientId,photoId});assert.deepEqual(result.bytes,new Uint8Array([1,2,3]));assert.equal(result.contentType,'image/png');assert.equal(calls,3);
 bad=true;calls=0;await assert.rejects(provider.perform(f.credentials,caps,{kind:'photo',clientId,photoId}),/unavailable/);assert.equal(calls,2);
});
