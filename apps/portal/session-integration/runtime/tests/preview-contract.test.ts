import test from 'node:test';
import assert from 'node:assert/strict';
import { SupabaseProvider } from '../server/upstream';
import { previewEnvelope } from './fixtures/preview-envelope';

const owner='11111111-1111-4111-8111-111111111111';
const clientId='33333333-3333-4333-8333-333333333333';
const otherClient='44444444-4444-4444-8444-444444444444';
const photoId='55555555-5555-4555-8555-555555555555';
const caps={view:true,edit:false,publish:false,confirmPayments:false};
const credentials={access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:4102444800,user:{id:owner},providerSessionId:owner};
const host='https://snojlbqovlawewwqbviz.supabase.co';
function envelope(mode:'draft'|'published'='published'):any { return previewEnvelope(mode,clientId,[{id:photoId,angle:'front'}]); }
function setup(mode:'draft'|'published'='published') {
 const calls:{url:URL,body:any,headers:Headers}[]=[];
 let e=envelope(mode),status=200;
 let descriptor:any={photoId,expiresIn:60,signedUrl:`${host}/storage/v1/object/sign/concierge-checkin-photos/${clientId}/${photoId}.png?token=synthetic-signature`};
 let image=()=>new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/png'}});
 const provider=new SupabaseProvider('sb_publishable_synthetic',async(input,init)=>{
  const request=new Request(input,init),url=new URL(request.url),body=request.method==='POST'?await request.json():null;
  calls.push({url,body,headers:request.headers});
  if(url.pathname==='/functions/v1/concierge-operations')return Response.json(e,{status});
  if(url.pathname==='/functions/v1/concierge-checkins')return Response.json(descriptor);
  if(url.pathname.startsWith('/storage/v1/object/sign/'))return image();
  return Response.json({code:'unavailable'},{status:404});
 });
 return {provider,calls,get envelope(){return e;},setEnvelope:(value:any)=>{e=value;},setStatus:(value:number)=>{status=value;},setDescriptor:(value:any)=>{descriptor=value;},get descriptor(){return descriptor;},setImage:(value:()=>Response)=>{image=value;}};
}
const preview=(mode:'draft'|'published'|'payments'|'checkins')=>({kind:'preview' as const,mode,clientId,...(mode==='draft'?{expectedRevision:12}:{})});
const photo={kind:'photo' as const,clientId,photoId};

test('view-only cookie operations forwards the exact existing saved-preview command and full envelope',async()=>{
 const f=setup('draft'),command={action:'advisor_preview_read_v2',clientId,mode:'draft',expectedRevision:12};
 const result=await f.provider.perform(credentials,caps,{kind:'command',channel:'operations',command});
 assert.equal(result.status,200);assert.deepEqual(result.body,f.envelope);
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].url.pathname,'/functions/v1/concierge-operations');assert.deepEqual(f.calls[0].body,command);
 assert.equal(f.calls[0].headers.get('authorization'),'Bearer synthetic-access');
});
for(const mode of ['draft','published','payments','checkins'] as const) test(`${mode} GET maps to fixed operations with mandatory expectedRevision`,async()=>{
 const f=setup(mode==='draft'?'draft':'published');const result=await f.provider.perform(credentials,caps,preview(mode));
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].url.pathname,'/functions/v1/concierge-operations');
 assert.deepEqual(f.calls[0].body,{action:'advisor_preview_read_v2',clientId,mode:mode==='draft'?'draft':'published',expectedRevision:mode==='draft'?12:null});
 assert.deepEqual(result.body,mode==='payments'?f.envelope.payments:mode==='checkins'?f.envelope.checkins:f.envelope);
});
test('preview command rejects missing/null draft revisions, non-null published revisions, unknown modes and injected fields before IO',async()=>{
 for(const command of [
  {action:'advisor_preview_read_v2',clientId,mode:'published'},
  {action:'advisor_preview_read_v2',clientId,mode:'published',expectedRevision:12},
  {action:'advisor_preview_read_v2',clientId,mode:'draft',expectedRevision:null},
  {action:'advisor_preview_read_v2',clientId,mode:'draft',expectedRevision:-1},
  {action:'advisor_preview_read_v2',clientId,mode:'draft',expectedRevision:Number.MAX_SAFE_INTEGER+1},
  {action:'advisor_preview_read_v2',clientId,mode:'payments',expectedRevision:null},
  {action:'advisor_preview_read_v2',clientId,mode:'published',expectedRevision:null,upstream:'https://evil.example'}
 ]){const f=setup();await assert.rejects(f.provider.perform(credentials,caps,{kind:'command',channel:'operations',command}));assert.equal(f.calls.length,0);}
});
test('preview responses bind schema, client, mode, revision and saved revision before exposing any panel',async()=>{
 const faults=[
  (e:any)=>{e.schemaVersion=2;},(e:any)=>{e.clientId=otherClient;},(e:any)=>{e.mode='published';},
  (e:any)=>{e.revision=13;e.clientView.revision=13;e.draft.savedRevision=13;},
  (e:any)=>{e.clientView.revision=11;},(e:any)=>{e.draft.savedRevision=11;},
  (e:any)=>{e.revision=-1;},(e:any)=>{e.payments=null;},(e:any)=>{e.checkins=[];},
  (e:any)=>{e.draft.intakeVersion=0;},(e:any)=>{e.draft.recommendations=null;},(e:any)=>{e.draft.presentation=null;}
 ];
 for(const fault of faults){const f=setup('draft');fault(f.envelope);await assert.rejects(f.provider.perform(credentials,caps,preview('draft')),e=>(e as any).status===503);assert.equal(f.calls.length,1);}
 for(const mode of ['published','payments','checkins'] as const){const f=setup();f.envelope.clientId=otherClient;await assert.rejects(f.provider.perform(credentials,caps,preview(mode)),e=>(e as any).status===503);}
 const published=setup();published.envelope.draft={savedRevision:12};await assert.rejects(published.provider.perform(credentials,caps,preview('published')),e=>(e as any).status===503);
});
test('ordinary preview command receives the same selected-client response fence as GET routes',async()=>{
 const f=setup();f.envelope.clientId=otherClient;
 await assert.rejects(f.provider.perform(credentials,caps,{kind:'command',channel:'operations',command:{action:'advisor_preview_read_v2',clientId,mode:'published',expectedRevision:null}}),e=>(e as any).status===503);
});
test('credential canaries anywhere in an envelope are rejected before panel selection',async()=>{
 for(const mode of ['published','payments','checkins'] as const){const f=setup();f.envelope.unused={refresh_token:'synthetic-canary'};await assert.rejects(f.provider.perform(credentials,caps,preview(mode)),/unavailable/);}
});
test('safe preview envelope does not expose extra upstream root fields',async()=>{
 const f=setup();f.envelope.internalNote='synthetic-private-canary';const result=await f.provider.perform(credentials,caps,preview('published'));assert.equal('internalNote' in (result.body as object),false);
});
test('existing stale/missing/forbidden responses keep their HTTP status without a second request',async()=>{
 for(const status of [403,404,409]){const f=setup('draft');f.setStatus(status);f.setEnvelope({code:status===409?'stale_draft':status===404?'draft_missing':'forbidden'});await assert.rejects(f.provider.perform(credentials,caps,preview('draft')),e=>(e as any).status===status);assert.equal(f.calls.length,1);}
});
test('photo reads published envelope and verifies nested visible membership before descriptor and bytes',async()=>{
 const f=setup();const result=await f.provider.perform(credentials,caps,photo);
 assert.deepEqual(result.bytes,new Uint8Array([1,2,3]));assert.equal(result.contentType,'image/png');assert.equal(f.calls.length,3);
 assert.deepEqual(f.calls[0].body,{action:'advisor_preview_read_v2',clientId,mode:'published',expectedRevision:null});
 assert.deepEqual(f.calls[1].body,{action:'advisor_photo_view',clientId,photoId});
});
test('top-level report spoofing, hidden photos and another selected client never reach the signer',async()=>{
 for(const fault of [(e:any)=>{e.checkins.reports=[];e.reports=[{photos:[{id:photoId}]}];},(e:any)=>{e.checkins.reports[0].photos=[{id:owner}];},(e:any)=>{e.clientId=otherClient;},(e:any)=>{e.checkins.reports=null;}]){
  const f=setup();fault(f.envelope);await assert.rejects(f.provider.perform(credentials,caps,photo));assert.equal(f.calls.length,1);
 }
});
test('photo descriptor retains owner, bucket, exact photo, origin, lifetime and sole-token query checks',async()=>{
 for(const fault of [
  (d:any)=>{d.photoId=owner;},(d:any)=>{d.expiresIn=61;},
  (d:any)=>{d.signedUrl=d.signedUrl.replace(clientId,otherClient);},
  (d:any)=>{d.signedUrl=d.signedUrl.replace(photoId,owner);},
  (d:any)=>{d.signedUrl=d.signedUrl.replace('concierge-checkin-photos','skin-photos');},
  (d:any)=>{d.signedUrl=d.signedUrl.replace(host,'https://evil.example');},
  (d:any)=>{d.signedUrl+='&extra=1';},(d:any)=>{d.signedUrl+='&token=second';},(d:any)=>{d.signedUrl+='#fragment';}
 ]){const f=setup();fault(f.descriptor);await assert.rejects(f.provider.perform(credentials,caps,photo));assert.equal(f.calls.length,2);}
});
test('photo response keeps image type, byte bound and redirect rejection',async()=>{
 for(const image of [
  ()=>new Response('not image',{headers:{'Content-Type':'text/html'}}),
  ()=>new Response(new Uint8Array(5242881),{headers:{'Content-Type':'image/png'}}),
  ()=>new Response(null,{status:302,headers:{Location:'https://evil.example/private'}})
 ]){const f=setup();f.setImage(image);await assert.rejects(f.provider.perform(credentials,caps,photo),/unavailable/);assert.equal(f.calls.length,3);}
});
