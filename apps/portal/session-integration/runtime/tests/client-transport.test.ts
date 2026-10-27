import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {ClientProvider} from '../server/client-upstream';
import {handlePaymentRequest} from './fixtures/deployed/supabase/functions/concierge-payments/handler';
import {handleCheckinsRequest} from './fixtures/deployed/supabase/functions/concierge-checkins/handler';
const origin='https://portal.goshelv.com',supabase='https://snojlbqovlawewwqbviz.supabase.co',owner='11111111-1111-4111-8111-111111111111',quote='33333333-3333-4333-8333-333333333333',id='44444444-4444-4444-8444-444444444444',requestId='55555555-5555-4555-8555-555555555555',completionRequestId='66666666-6666-4666-8666-666666666666';
function crc(bytes:Buffer){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;}return (c^0xffffffff)>>>0;}
function chunk(kind:string,bytes:Buffer){const content=Buffer.concat([Buffer.from(kind),bytes]),n=Buffer.alloc(4),c=Buffer.alloc(4);n.writeUInt32BE(bytes.length);c.writeUInt32BE(crc(content));return Buffer.concat([n,content,c]);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(1,0);ihdr.writeUInt32BE(1,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.from([0,0,0,0,255]))),chunk('IEND',Buffer.alloc(0))]);
const creds={access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:1800000000,user:{id:owner},providerSessionId:requestId};
const caps={view:true,edit:false,publish:false,confirmPayments:false};
function fixture(){
 const calls:any[]=[],storageCalls:any[]=[];let paymentUploaded=false,photoUploaded=false,deny=false;
 const digest=createHash('sha256').update(png).digest('hex');
 const payment={evidenceId:id,clientId:owner,quoteId:quote,quoteVersion:1,storagePath:`${owner}/${quote}/${id}.png`,contentType:'image/png',sizeBytes:png.length,sha256:digest,status:'reserved'};
 const photo={revision:1,photoId:id,ownerId:owner,bucket:'concierge-checkin-photos',path:`${owner}/${id}.png`,angle:'front',contentType:'image/png',sizeBytes:png.length,sha256:digest,state:'pending'};
 const common={allowedOrigins:[origin],authenticate:async()=>({id:owner,is_anonymous:false})};
 const payments:any={...common,rpc:async(_token:string,call:any)=>{calls.push(call);if(deny)return {data:null,error:{status:403,message:'concierge_forbidden'}};
  if(call.name==='concierge_payment_evidence_reserve'){assert.equal(call.args.p_client_id,owner);return {data:payment,error:null};}
  if(call.name==='concierge_payment_evidence_access')return paymentUploaded?{data:{...payment,status:'uploaded'},error:null}:{data:null,error:{status:400,message:'concierge_upload_incomplete'}};
  if(call.name==='concierge_payment_evidence_commit'){paymentUploaded=true;return {data:{evidenceId:id,quoteId:quote,quoteVersion:1,status:'uploaded_unverified'},error:null};}
  assert.fail(call.name);
 },storage:{upload:async(path:string,bytes:Uint8Array,type:string)=>{assert.equal(path,payment.storagePath);assert.deepEqual(Buffer.from(bytes),png);assert.equal(type,'image/png');storageCalls.push('payment-upload');paymentUploaded=true;},sign:async(path:string)=>supabase+'/storage/v1/object/sign/concierge-payment-evidence/'+path+'?token=synthetic-storage-token'}};
 const checkins:any={...common,supabaseUrl:supabase,rpc:async(_token:string,call:any)=>{calls.push(call);if(deny)return {data:null,error:{status:403,message:'concierge_forbidden'}};
  if(call.name==='concierge_checkin_photo_authorize')return photoUploaded?{data:{...photo,state:'complete'},error:null}:{data:null,error:{message:'concierge_not_found'}};
  if(call.name==='concierge_checkin_write'){
   assert.equal(call.args.p_client_id,owner);if(call.args.p_action==='reserve_photo')return {data:photo,error:null};
   if(call.args.p_action==='complete_photo'){photoUploaded=true;return {data:{revision:2,operation:'complete_photo',reportId:null},error:null};}
  }
  assert.fail(call.name);
 },storage:{origin:supabase,upload:async(_photo:any,body:Blob)=>{assert.deepEqual(Buffer.from(await body.arrayBuffer()),png);storageCalls.push('photo-upload');return 'uploaded';},sign:async(p:any)=>supabase+'/storage/v1/object/sign/'+p.bucket+'/'+p.path+'?token=synthetic-storage-token'}};
 const fetcher:typeof fetch=async(input,init)=>{const req=new Request(input,init),url=new URL(req.url);if(url.pathname.includes('/storage/v1/object/sign/'))return new Response(png,{headers:{'Content-Type':'image/png'}});
  assert.equal(req.headers.get('authorization'),'Bearer synthetic-access');
  const response=await (url.pathname.includes('concierge-payments')?handlePaymentRequest(req,payments):handleCheckinsRequest(req,checkins));if(!response.ok)assert.fail(url.pathname+':'+response.status+':'+await response.clone().text());return response;
 };
 return {provider:new ClientProvider('sb_publishable_synthetic',fetcher),calls,storageCalls,deny:()=>deny=true};
}
test('source-backed payment multipart upload preserves original IDs and returns own screenshot through a token-free byte proxy',async()=>{
 const f=fixture();const operation:any={kind:'client-upload',channel:'payments',metadata:{action:'upload_evidence',requestId,completionRequestId,expectedRevision:0,quoteId:quote,quoteVersion:1},bytes:new Uint8Array(png),contentType:'image/png'};
 const uploaded=await f.provider.perform(creds,caps,operation);assert.equal((uploaded.body as any).status,'uploaded_unverified');assert.equal(f.storageCalls.filter(x=>x==='payment-upload').length,1);
 const again=await f.provider.perform(creds,caps,operation);assert.deepEqual(again.body,uploaded.body);assert.equal(f.storageCalls.length,1,'exact retry must not overwrite immutable bytes');
 assert.equal(f.calls.find(c=>c.name==='concierge_payment_evidence_reserve').args.p_request_id,requestId);assert.equal(f.calls.find(c=>c.name==='concierge_payment_evidence_commit').args.p_request_id,completionRequestId);
 const descriptor=await f.provider.perform(creds,caps,{kind:'command',channel:'payments',command:{action:'evidence_url',evidenceId:id}});assert.equal((descriptor.body as any).signedUrl,origin+'/api/client/media/evidence?id='+id);assert.doesNotMatch(JSON.stringify(descriptor),/synthetic-storage-token|synthetic-refresh|synthetic-access/);
 const image=await f.provider.perform(creds,caps,{kind:'client-media',media:'evidence',id});assert.deepEqual(Buffer.from(image.bytes!),png);f.deny();await assert.rejects(f.provider.perform(creds,caps,{kind:'client-media',media:'evidence',id}));
});
test('source-backed raw check-in image forwarding retains angle, reservation revision and completion identity',async()=>{
 const f=fixture();const uploaded=await f.provider.perform(creds,caps,{kind:'client-upload',channel:'checkins',metadata:{action:'upload_photo',requestId,completionRequestId,expectedRevision:0,angle:'front'},bytes:new Uint8Array(png),contentType:'image/png'});
 assert.deepEqual(uploaded.body,{revision:2,photo:{id,angle:'front'}});assert.equal(f.storageCalls[0],'photo-upload');
 const reserve=f.calls.find(c=>c.args.p_action==='reserve_photo'),complete=f.calls.find(c=>c.args.p_action==='complete_photo');assert.equal(reserve.args.p_request_id,requestId);assert.equal(complete.args.p_request_id,completionRequestId);assert.equal(complete.args.p_expected_revision,1);
 const descriptor=await f.provider.perform(creds,caps,{kind:'command',channel:'checkins',command:{action:'photo_view',photoId:id}});assert.equal((descriptor.body as any).signedUrl,origin+'/api/client/media/photo?id='+id);
 const image=await f.provider.perform(creds,caps,{kind:'client-media',media:'photo',id});assert.deepEqual(Buffer.from(image.bytes!),png);
});
