import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { handleCheckinsRequest } from '../supabase/functions/concierge-checkins/handler.ts';
import type { CheckinPorts } from '../supabase/functions/concierge-checkins/types.ts';
const owner = 'ae000000-0000-4000-8000-000000000001', other = 'ae000000-0000-4000-8000-000000000002';
const reserveId = 'ae000000-0000-4000-8000-000000000003', completeId = 'ae000000-0000-4000-8000-000000000004';
const photoId = 'ae000000-0000-4000-8000-000000000005', reportId = 'ae000000-0000-4000-8000-000000000006';
const bytes = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'));
const descriptor = { revision: 9, photoId, ownerId: owner, bucket: 'concierge-checkin-photos', path: `${owner}/${photoId}.png`,
  angle: 'front', contentType: 'image/png', sizeBytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), state: 'pending' };
const origin = 'https://synthetic.supabase.test';
const signedUrl = `${origin}/storage/v1/object/sign/${descriptor.bucket}/${descriptor.path}?token=synthetic`;
function ports(overrides: Partial<CheckinPorts> = {}): CheckinPorts {
  return { allowedOrigins: ['https://portal.test'], authenticate: async () => ({ id: owner, is_anonymous: false }),
    rpc: async (_token, call) => ({ data: call.name === 'concierge_checkin_read' ? { revision: 8, nextCheckinOn: null, reports: [], meetingNotes: ['private'] }
      : call.name === 'concierge_checkin_photo_authorize' ? { ...descriptor, state: 'complete' }
      : call.name === 'concierge_checkin_write' && call.args.p_action === 'reserve_photo' ? descriptor : { revision: 10, operation: 'complete_photo', reportId: null }, error: null }),
    storage: { origin, upload: async () => 'uploaded', read: async () => new Blob([bytes], { type: 'image/png' }), sign: async () => signedUrl }, ...overrides };
}
function json(body: unknown, auth = true) { return new Request('https://edge.test/concierge-checkins', {
  method: 'POST', headers: { 'content-type': 'application/json', ...(auth ? { authorization: 'Bearer synthetic' } : {}) }, body: JSON.stringify(body) }); }
function upload() { return new Request('https://edge.test/concierge-checkins/upload', { method: 'POST', body: bytes,
  headers: { authorization: 'Bearer synthetic', 'content-type': 'image/png', 'x-photo-angle': 'front',
    'x-request-id': reserveId, 'x-completion-request-id': completeId, 'x-expected-revision': '8' } }); }

test('HTTP verifies permanent identity and rejects forbidden origins before any persistence', async () => {
  let calls = 0; const p = ports({ rpc: async () => { calls++; throw new Error(); } });
  assert.equal((await handleCheckinsRequest(json({ action: 'client_read' }, false), p)).status, 401);
  assert.equal((await handleCheckinsRequest(json({ action: 'client_read' }), { ...p, authenticate: async () => ({ id: owner, is_anonymous: true }) })).status, 403);
  const forbidden = json({ action: 'client_read' }); forbidden.headers.set('origin', 'https://wrong.test');
  assert.equal((await handleCheckinsRequest(forbidden, p)).status, 403); assert.equal(calls, 0);
});
test('HTTP owner read and submit use owner-derived targets, preserve request IDs, and strip private fields', async () => {
  const p = ports(); const response = await handleCheckinsRequest(json({ action: 'client_read' }), p);
  assert.deepEqual(await response.json(), { revision: 8, nextCheckinOn: null, reports: [] });
  assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  const write = ports({ rpc: async (_token, call) => {
    assert.deepEqual(call, { name: 'concierge_checkin_write', args: { p_client_id: owner, p_action: 'submit_report',
      p_request_id: reserveId, p_expected_revision: 8, p_payload: { comfort: 'Fine', consistency: 'Often', changes: '', photoIds: [] } } });
    return { data: { revision: 9, operation: 'submit_report', reportId, advisorNote: 'private' }, error: null };
  } });
  assert.deepEqual(await (await handleCheckinsRequest(json({ action: 'submit_report', requestId: reserveId, expectedRevision: 8,
    comfort: 'Fine', consistency: 'Often', changes: '' }), write)).json(), { revision: 9, operation: 'submit_report', reportId });
  assert.equal((await handleCheckinsRequest(json({ action: 'submit_report', clientId: other }), write)).status, 400);
});
test('upload reserves exact immutable metadata and completes with a distinct stable UUID', async () => {
  const p = ports(); const calls: unknown[] = [];
  const rpc = p.rpc; p.rpc = async (token, call) => { calls.push(call); return rpc(token, call); };
  const response = await handleCheckinsRequest(upload(), p);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { revision: 10, photo: { id: photoId, angle: 'front' } });
  assert.deepEqual(calls, [
    { name: 'concierge_checkin_write', args: { p_client_id: owner, p_action: 'reserve_photo', p_request_id: reserveId,
      p_expected_revision: 8, p_payload: { angle: 'front', contentType: 'image/png', sizeBytes: bytes.length, sha256: descriptor.sha256 } } },
    { name: 'concierge_checkin_write', args: { p_client_id: owner, p_action: 'complete_photo', p_request_id: completeId,
      p_expected_revision: 9, p_payload: { photoId } } },
  ]);
});
test('uncertain upload conflict verifies exact bytes and a mismatch never completes', async () => {
  for (const mismatch of [false, true]) {
    const p = ports(); let completed = 0; const rpc = p.rpc;
    p.rpc = async (token, call) => { if (call.name === 'concierge_checkin_write' && call.args.p_action === 'complete_photo') completed++;
      return rpc(token, call); };
    p.storage.upload = async () => 'exists';
    p.storage.read = async () => new Blob([mismatch ? new Uint8Array(bytes.length) : bytes], { type: 'image/png' });
    const response = await handleCheckinsRequest(upload(), p);
    assert.equal(response.status, mismatch ? 503 : 200); assert.equal(completed, mismatch ? 0 : 1);
  }
});
test('revocation, foreign descriptors, storage failure and duplicate phase IDs fail closed', async () => {
  let storageCalls = 0;
  for (const data of [null, { ...descriptor, ownerId: other }, { ...descriptor, path: `${owner}/../other.png` }]) {
    const p = ports({ rpc: async () => data === null ? { data: null, error: { status: 403 } } : { data, error: null } });
    p.storage.upload = async () => { storageCalls++; return 'uploaded'; };
    assert.equal((await handleCheckinsRequest(upload(), p)).status, data === null ? 403 : 503);
  }
  const p = ports(); p.storage.upload = async () => { throw new Error('private upstream credential'); };
  const response = await handleCheckinsRequest(upload(), p);
  assert.equal(response.status, 503); assert.deepEqual(await response.json(), { code: 'upload_failed', retryable: true });
  const request = upload(); request.headers.set('x-completion-request-id', reserveId);
  assert.equal((await handleCheckinsRequest(request, ports())).status, 400); assert.equal(storageCalls, 0);
});
test('photo viewing reauthorizes the opaque reference and only returns an exact short-lived private URL', async () => {
  const p = ports(); let ttl = 0;
  p.storage.sign = async (_descriptor, expiresIn) => { ttl = expiresIn; return signedUrl; };
  const response = await handleCheckinsRequest(json({ action: 'photo_view', photoId }), p);
  assert.deepEqual(await response.json(), { photoId, signedUrl, expiresIn: 60 }); assert.equal(ttl, 60);
  p.storage.sign = async () => 'https://evil.test/public.png';
  assert.equal((await handleCheckinsRequest(json({ action: 'photo_view', photoId }), p)).status, 503);
});

test('malformed upstream identity, reservation metadata and advisor projection are unavailable rather than client input errors', async () => {
  const badIdentity=ports({authenticate:async()=>({id:'not-an-id',is_anonymous:false})});
  assert.equal((await handleCheckinsRequest(json({action:'client_read'}),badIdentity)).status,503);
  const mismatch=ports({rpc:async()=>({data:{...descriptor,sha256:'b'.repeat(64)},error:null})});
  assert.equal((await handleCheckinsRequest(upload(),mismatch)).status,503);
  const badAdvisor=ports({rpc:async()=>({data:{client:{revision:0,nextCheckinOn:null,reports:[]},meetingNotes:[{note:'private'}]},error:null})});
  assert.equal((await handleCheckinsRequest(json({action:'advisor_read',clientId:other}),badAdvisor)).status,503);
});
test('advisor notes are only returned by the separate guarded advisor read and denied writes never reach Storage', async () => {
  const p=ports({rpc:async(_token,call)=>{
    if(call.name==='concierge_checkin_advisor_read')return {data:{client:{revision:0,nextCheckinOn:null,reports:[]},meetingNotes:[{
      id:reserveId,checkinId:reportId,note:'Private meeting note',createdAt:'2026-10-18T12:00:00Z',privateExtra:'strip me'}]},error:null};
    return {data:null,error:{message:'concierge_forbidden'}};
  }});
  const response=await handleCheckinsRequest(json({action:'advisor_read',clientId:other}),p);
  assert.deepEqual(await response.json(),{client:{revision:0,nextCheckinOn:null,reports:[]},meetingNotes:[{
    id:reserveId,checkinId:reportId,note:'Private meeting note',createdAt:'2026-10-18T12:00:00Z'}]});
  assert.equal((await handleCheckinsRequest(json({action:'add_meeting_note',clientId:other,requestId:reserveId,expectedRevision:0,
    checkinId:reportId,note:'Private meeting note'}),p)).status,403);
});

test('bounded multipart upload envelope matches binary workflow and rejects duplicate or authority fields', async () => {
  const make=(metadata:unknown,duplicate=false)=>{
    const form=new FormData();form.set('metadata',JSON.stringify(metadata));form.set('file',new Blob([bytes],{type:'image/png'}),'synthetic.png');
    if(duplicate)form.append('file',new Blob([bytes],{type:'image/png'}),'another.png');
    return new Request('https://edge.test/concierge-checkins',{method:'POST',headers:{authorization:'Bearer synthetic'},body:form});
  };
  const metadata={action:'upload_photo',requestId:reserveId,completionRequestId:completeId,expectedRevision:8,angle:'front'};
  const response=await handleCheckinsRequest(make(metadata),ports());assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{revision:10,photo:{id:photoId,angle:'front'}});
  assert.equal((await handleCheckinsRequest(make({...metadata,ownerId:other}),ports())).status,400);
  assert.equal((await handleCheckinsRequest(make(metadata,true),ports())).status,400);
});

test('lost completion acknowledgement replays original phase arguments, writes one object and rechecks revocation', async () => {
  let reserveWrites=0,completeWrites=0,objectWrites=0,reads=0,authentications=0,lost=true,revoked=false;
  const stored=new Map<string,{fingerprint:string;data:unknown}>();let object:Blob|null=null;
  const calls:unknown[]=[];
  const p=ports({authenticate:async()=>{authentications++;return {id:owner,is_anonymous:false};},rpc:async(_token,call)=>{
    calls.push(call);
    if(revoked)return {data:null,error:{status:403}};
    assert.equal(call.name,'concierge_checkin_write');if(call.name!=='concierge_checkin_write')throw Error();
    const key=call.args.p_request_id,fingerprint=JSON.stringify(call),previous=stored.get(key);
    if(previous){assert.equal(previous.fingerprint,fingerprint);return {data:previous.data,error:null};}
    const data=call.args.p_action==='reserve_photo'?descriptor:{revision:10,operation:'complete_photo',reportId:null};
    if(call.args.p_action==='reserve_photo')reserveWrites++;else completeWrites++;
    stored.set(key,{fingerprint,data});
    if(call.args.p_action==='complete_photo'&&lost){lost=false;throw new TypeError('Synthetic response lost after commit');}
    return {data,error:null};
  }});
  p.storage.upload=async(_descriptor,body)=>{if(object)return 'exists';object=body;objectWrites++;return 'uploaded';};
  p.storage.read=async()=>{reads++;assert.ok(object);return object;};
  assert.equal((await handleCheckinsRequest(upload(),p)).status,503);
  const retried=await handleCheckinsRequest(upload(),p);assert.equal(retried.status,200);
  assert.deepEqual(await retried.json(),{revision:10,photo:{id:photoId,angle:'front'}});
  assert.deepEqual(calls[0],calls[2]);assert.deepEqual(calls[1],calls[3]);
  assert.deepEqual({reserveWrites,completeWrites,objectWrites,reads,authentications},{reserveWrites:1,completeWrites:1,objectWrites:1,reads:1,authentications:2});
  revoked=true;assert.equal((await handleCheckinsRequest(upload(),p)).status,403);
  assert.equal(objectWrites,1);assert.equal(reads,1);assert.equal(authentications,3);
});
