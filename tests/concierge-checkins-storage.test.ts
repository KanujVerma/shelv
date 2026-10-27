import assert from 'node:assert/strict';
import test from 'node:test';
import { createCheckinStorage } from '../supabase/functions/concierge-checkins/storage.ts';
import type { PrivateCheckinPhoto } from '../supabase/functions/concierge-checkins/types.ts';
const origin = 'https://synthetic.supabase.test';
const owner = 'ae000000-0000-4000-8000-000000000001', id = 'ae000000-0000-4000-8000-000000000002';
const photo: PrivateCheckinPhoto = { revision:1, ownerId:owner, photoId:id, bucket:'concierge-checkin-photos', path:`${owner}/${id}.png`,
  angle:'front', contentType:'image/png', sizeBytes:3, sha256:'a'.repeat(64), state:'pending' };

test('native Storage transport uses server credentials only at exact immutable upload/read/sign paths', async () => {
  const calls: { url:string; options:RequestInit }[] = [];
  const transport: typeof fetch = async (url, options = {}) => {
    calls.push({url:String(url),options});
    if (String(url).includes('/object/sign/')) return Response.json({signedURL:`/object/sign/${photo.bucket}/${photo.path}?token=synthetic`});
    if (options.method === 'GET') return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/png'}});
    return Response.json({Key:'private'});
  };
  const storage = createCheckinStorage({supabaseUrl:origin,serviceKey:'synthetic-storage-only',fetch:transport});
  assert.equal(await storage.upload(photo,new Blob([new Uint8Array([1,2,3])],{type:'image/png'})),'uploaded');
  assert.deepEqual(new Uint8Array(await (await storage.read(photo)).arrayBuffer()),new Uint8Array([1,2,3]));
  assert.equal(await storage.sign(photo,60),`${origin}/storage/v1/object/sign/${photo.bucket}/${photo.path}?token=synthetic`);
  for (const call of calls) {
    const headers = new Headers(call.options.headers);
    assert.equal(headers.get('authorization'),'Bearer synthetic-storage-only');
    assert.equal(call.options.redirect,'error'); assert.equal(call.options.credentials,'omit'); assert.equal(call.options.cache,'no-store');
    assert.ok(call.options.signal);
  }
  assert.equal(new Headers(calls[0].options.headers).get('x-upsert'),'false');
  assert.deepEqual(JSON.parse(String(calls[2].options.body)),{expiresIn:60});
  assert.equal(calls[1].url,`${origin}/storage/v1/object/authenticated/${photo.bucket}/${photo.path}`);
});
test('only explicit duplicate response is recoverable; reads are bounded and signing cannot exceed 60 seconds', async () => {
  const duplicate = createCheckinStorage({supabaseUrl:origin,serviceKey:'synthetic',fetch:async()=>new Response('',{status:409})});
  assert.equal(await duplicate.upload(photo,new Blob()),'exists');
  const unavailable = createCheckinStorage({supabaseUrl:origin,serviceKey:'synthetic',fetch:async()=>Response.json({message:'private upstream details'},{status:400})});
  await assert.rejects(unavailable.upload(photo,new Blob()),{message:'storage_unavailable'});
  const oversized = createCheckinStorage({supabaseUrl:origin,serviceKey:'synthetic',fetch:async()=>new Response(new Uint8Array(5*1024*1024+1))});
  await assert.rejects(oversized.read(photo),{message:'storage_unavailable'});
  await assert.rejects(duplicate.sign(photo,61),{message:'storage_unavailable'});
  assert.throws(()=>createCheckinStorage({supabaseUrl:'http://evil.test',serviceKey:'synthetic'}),{message:'storage_unavailable'});
});
