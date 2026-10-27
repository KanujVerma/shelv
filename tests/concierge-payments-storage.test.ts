import assert from 'node:assert/strict';
import test from 'node:test';
import {createPaymentStorage} from '../supabase/functions/concierge-payments/storage.ts';
const client='00000000-0000-4000-8000-000000000001',quote='00000000-0000-4000-8000-000000000003',evidence='00000000-0000-4000-8000-000000000006';
const path=`${client}/${quote}/${evidence}.png`,bytes=new Uint8Array([137,80,78,71]);
function fixture(responses:Response[]){const calls:{url:string;options:RequestInit}[]=[];const storage=createPaymentStorage({supabaseUrl:'https://project.supabase.co',serviceKey:'synthetic-server-key',fetch:async(input,options)=>{calls.push({url:String(input),options:options!});const r=responses.shift();if(!r)throw new Error('unexpected request');return r;}});return {storage,calls};}
test('private storage writes the reserved bucket and exact immutable path without upsert',async()=>{
 const p=fixture([new Response('{}')]);await p.storage.upload(path,bytes,'image/png');
 assert.equal(p.calls.length,1);assert.equal(p.calls[0].url,`https://project.supabase.co/storage/v1/object/concierge-payment-evidence/${path}`);
 const headers=new Headers(p.calls[0].options.headers);assert.equal(headers.get('x-upsert'),'false');assert.equal(headers.get('authorization'),'Bearer synthetic-server-key');assert.equal(headers.get('content-type'),'image/png');
 assert.equal(p.calls[0].options.redirect,'error');assert.equal(p.calls[0].options.credentials,'omit');
});
test('existing-object retry verifies actual stored bytes and rejects different bytes',async()=>{
 const p=fixture([new Response('{}',{status:409}),new Response(bytes)]);await p.storage.upload(path,bytes,'image/png');assert.equal(p.calls.length,2);assert.match(p.calls[1].url,/\/object\/authenticated\/concierge-payment-evidence\//);
 const changed=fixture([new Response('{}',{status:409}),new Response(new Uint8Array([1,2,3]))]);await assert.rejects(changed.storage.upload(path,bytes,'image/png'),/unavailable/);
 const duplicate=fixture([new Response('{"statusCode":"409","error":"Duplicate"}',{status:400}),new Response(bytes)]);await duplicate.storage.upload(path,bytes,'image/png');
});
test('signed reads enforce short expiry and exact trusted storage origin/path',async()=>{
 const p=fixture([new Response(JSON.stringify({signedURL:`/object/sign/concierge-payment-evidence/${path}?token=synthetic`}))]);
 assert.equal(await p.storage.sign(path,60),`https://project.supabase.co/storage/v1/object/sign/concierge-payment-evidence/${path}?token=synthetic`);
 assert.deepEqual(JSON.parse(String(p.calls[0].options.body)),{expiresIn:60});
 await assert.rejects(p.storage.sign(path,61),/unavailable/);
 const evil=fixture([new Response('{"signedURL":"https://evil.invalid/object?token=secret"}')]);await assert.rejects(evil.storage.sign(path,60),/unavailable/);
});
test('path traversal, other buckets and invalid configuration never reach Storage',async()=>{
 const p=fixture([]);for(const invalid of ['../private/file.png','other-bucket/'+path,path+'?download=1',path.replace('.png','.svg')])await assert.rejects(p.storage.upload(invalid,bytes,'image/png'),/unavailable/);assert.equal(p.calls.length,0);
 for(const supabaseUrl of ['http://project.supabase.co','https://user:password@project.supabase.co','https://project.supabase.co/path','https://project.supabase.co?key=x'])assert.throws(()=>createPaymentStorage({supabaseUrl,serviceKey:'synthetic'}),/unavailable/);
});
