import assert from 'node:assert/strict';
import test from 'node:test';
import {handlePaymentRequest, type PaymentPorts} from '../supabase/functions/concierge-payments/handler.ts';

const clientId='00000000-0000-4000-8000-000000000001', quoteId='00000000-0000-4000-8000-000000000003';
const evidenceId='00000000-0000-4000-8000-000000000006',requestId='00000000-0000-4000-8000-000000000005';
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64'));
const completionRequestId='00000000-0000-4000-8000-000000000007';
const metadata={action:'upload_evidence',requestId,completionRequestId,expectedRevision:4,quoteId,quoteVersion:2};
function upload(bytes:Uint8Array=png,mime='image/png',meta:unknown=metadata){
 const form=new FormData();form.set('metadata',JSON.stringify(meta));form.set('file',new Blob([bytes as BlobPart],{type:mime}),'discard-original-name');
 return new Request('https://payments.invalid',{method:'POST',headers:{authorization:'Bearer verified'},body:form});
}
function fixture(){
 const calls:{name:string;args:Record<string,unknown>}[]=[],uploads:{path:string;bytes:Uint8Array;contentType:string}[]=[],signs:{path:string;ttl:number}[]=[];
 let descriptor:Record<string,unknown>={evidenceId,clientId,quoteId,quoteVersion:2,storagePath:`${clientId}/${quoteId}/${evidenceId}.png`,contentType:'image/png',sizeBytes:png.length,sha256:'a'.repeat(64),status:'uploaded'};
 const ports:PaymentPorts={allowedOrigins:[],authenticate:async()=>({id:clientId,is_anonymous:false}),
  rpc:async(_token,call)=>{calls.push(call);if(call.name==='concierge_payment_evidence_reserve'){descriptor={...descriptor,sha256:call.args.p_sha256,sizeBytes:call.args.p_size_bytes,status:'reserved'};return {data:descriptor,error:null};}
    if(call.name==='concierge_payment_evidence_commit')return {data:{evidenceId,quoteId,quoteVersion:2,status:'uploaded_unverified'},error:null};
    return {data:descriptor,error:null};},
  storage:{upload:async(path,bytes,contentType)=>{uploads.push({path,bytes,contentType});},sign:async(path,ttl)=>{signs.push({path,ttl});return 'https://storage.invalid/private/screenshot?token=secret';}}};
 return {ports,calls,uploads,signs,setDescriptor:(value:Record<string,unknown>)=>{descriptor=value;}};
}
test('screenshot upload reserves ownership and quote, binds bytes by hash and commits unverified evidence only',async()=>{
 const p=fixture();const r=await handlePaymentRequest(upload(),p.ports);assert.equal(r.status,200);assert.deepEqual(await r.json(),{evidenceId,quoteId,quoteVersion:2,status:'uploaded_unverified'});
 assert.deepEqual(p.calls.map(x=>x.name),['concierge_payment_evidence_reserve','concierge_payment_evidence_commit']);
 const reserve=p.calls[0].args;assert.equal(reserve.p_client_id,clientId);assert.equal(reserve.p_quote_id,quoteId);assert.equal(reserve.p_request_id,requestId);assert.equal(reserve.p_size_bytes,png.length);assert.match(String(reserve.p_sha256),/^[a-f0-9]{64}$/);
 assert.equal(p.calls[1].args.p_request_id,completionRequestId);assert.equal(p.uploads.length,1);assert.deepEqual(p.uploads[0].bytes,png);assert.equal(p.uploads[0].path,`${clientId}/${quoteId}/${evidenceId}.png`);assert.equal(p.signs.length,0);
});
test('upload validates actual bytes, MIME and size before storage or reservation',async()=>{
 for(const [bytes,mime,status] of [[png,'image/svg+xml',415],[new Uint8Array([1,2,3]),'image/png',415],[new Uint8Array(5*1024*1024+1),'image/png',413]] as const){
  const p=fixture();assert.equal((await handlePaymentRequest(upload(bytes,mime),p.ports)).status,status);assert.equal(p.calls.length,0);assert.equal(p.uploads.length,0);
 }
 const p=fixture();assert.equal((await handlePaymentRequest(upload(png,'image/png',{...metadata,clientId:'forged'}),p.ports)).status,400);assert.equal(p.calls.length,0);
});
test('reservation authorization failure cannot upload; descriptor cannot redirect a privileged upload',async()=>{
 const p=fixture();p.ports.rpc=async()=>({data:null,error:{message:'concierge_forbidden'}});assert.equal((await handlePaymentRequest(upload(),p.ports)).status,403);assert.equal(p.uploads.length,0);
 const other=fixture();other.ports.rpc=async()=>({data:{evidenceId,clientId,quoteId,quoteVersion:2,storagePath:'other-owner/quote/file.png',contentType:'image/png',sizeBytes:png.length,sha256:'a'.repeat(64),status:'reserved'},error:null});
 assert.equal((await handlePaymentRequest(upload(),other.ports)).status,503);assert.equal(other.uploads.length,0);
});
test('private screenshot URL requires fresh authorization and expires in at most 60 seconds',async()=>{
 const p=fixture();const req=()=>new Request('https://payments.invalid',{method:'POST',headers:{authorization:'Bearer verified','content-type':'application/json'},body:JSON.stringify({action:'evidence_url',evidenceId})});
 const r=await handlePaymentRequest(req(),p.ports);assert.equal(r.status,200);assert.deepEqual(await r.json(),{evidenceId,signedUrl:'https://storage.invalid/private/screenshot?token=secret',expiresInSeconds:60});
 assert.deepEqual(p.calls[0],{name:'concierge_payment_evidence_access',args:{p_evidence_id:evidenceId}});assert.equal(p.signs[0].ttl,60);
 p.ports.rpc=async()=>({data:null,error:{message:'concierge_forbidden'}});assert.equal((await handlePaymentRequest(req(),p.ports)).status,403);assert.equal(p.signs.length,1);
});
test('failed upload never commits or returns success, and retries retain reservation identity',async()=>{
 const p=fixture();p.ports.storage!.upload=async()=>{throw new Error('private storage details');};const r=await handlePaymentRequest(upload(),p.ports);assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});assert.equal(p.calls.length,1);
 const again=fixture();await handlePaymentRequest(upload(),again.ports);await handlePaymentRequest(upload(),again.ports);assert.deepEqual(again.calls[0],again.calls[2]);
});

test('truncated and forged image containers never reserve or upload payment evidence',async()=>{
 const fakePng=new Uint8Array(24);fakePng.set([137,80,78,71,13,10,26,10]);fakePng.set([73,72,68,82],12);
 const fakeJpeg=new Uint8Array([255,216,255,217]);
 const fakeWebp=new Uint8Array(20);fakeWebp.set([82,73,70,70,12,0,0,0,87,69,66,80]);
 for(const [bytes,mime] of [[fakePng,'image/png'],[png.slice(0,png.length-1),'image/png'],[fakeJpeg,'image/jpeg'],[fakeWebp,'image/webp']] as const){
  const p=fixture();assert.equal((await handlePaymentRequest(upload(bytes,mime),p.ports)).status,415);assert.equal(p.calls.length,0);assert.equal(p.uploads.length,0);
 }
});
