import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { handleCheckinsRequest } from '../supabase/functions/concierge-checkins/handler.ts';
import type { CheckinPorts, CheckinRpcCall, PrivateCheckinPhoto } from '../supabase/functions/concierge-checkins/types.ts';

const owner = 'ae000000-0000-4000-8000-000000000001';
const advisor = 'ae000000-0000-4000-8000-000000000002';
const reserveA = 'ae000000-0000-4000-8000-000000000003';
const completeA = 'ae000000-0000-4000-8000-000000000004';
const photoA = 'ae000000-0000-4000-8000-000000000005';
const reserveB = 'ae000000-0000-4000-8000-000000000006';
const completeB = 'ae000000-0000-4000-8000-000000000007';
const photoB = 'ae000000-0000-4000-8000-000000000008';
const advisorRequest = 'ae000000-0000-4000-8000-000000000009';
const nextAdvisorRequest = 'ae000000-0000-4000-8000-00000000000a';
const bytes = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'));
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}
function upload(requestId: string, completionId: string, revision: number, angle = 'front') {
  return new Request('https://edge.test/concierge-checkins/upload', { method:'POST', body:bytes,
    headers:{ authorization:'Bearer owner', 'content-type':'image/png', 'x-request-id':requestId,
      'x-completion-request-id':completionId, 'x-expected-revision':String(revision), 'x-photo-angle':angle } });
}
function changeDate(requestId: string, revision: number, nextCheckinOn: string) {
  return new Request('https://edge.test/concierge-checkins', { method:'POST', headers:{authorization:'Bearer advisor','content-type':'application/json'},
    body:JSON.stringify({action:'set_next_checkin',clientId:owner,requestId,expectedRevision:revision,nextCheckinOn}) });
}

/** External RPC contract double, not SQL acceptance: core separately exercises native locks/guards. */
function scenario(options: { legacyGlobalFence?: boolean; loseFirstCompletionAck?: boolean } = {}) {
  let head = 8, nextDate: string | null = null, revoked = false, loseAck = options.loseFirstCompletionAck === true;
  let objectWrites = 0, objectReads = 0, completionWrites = 0;
  const calls: CheckinRpcCall[] = [];
  const objects = new Map<string,Blob>();
  const photos = new Map<string,{descriptor:PrivateCheckinPhoto;reservedBy:string;reservationRevision:number;complete:boolean}>();
  const receipts = new Map<string,{fingerprint:string;data:unknown}>();
  const barriers = new Map([photoA,photoB].map(id => [id,{started:deferred(),release:deferred()}]));
  const error = (message: string) => ({data:null,error:{message}});
  const ports: CheckinPorts = {
    allowedOrigins:[],
    authenticate:async token => token === 'owner' || token === 'advisor' ? {id:token === 'owner' ? owner : advisor,is_anonymous:false} : null,
    rpc:async (token,call) => {
      calls.push(structuredClone(call));
      if(revoked || call.args.p_client_id !== owner) return error('concierge_forbidden');
      if(call.name !== 'concierge_checkin_write') throw Error('Unexpected read/rebase RPC');
      const args=call.args,actor=token === 'owner' ? owner : advisor;
      if((args.p_action === 'set_next_checkin') !== (actor === advisor)) return error('concierge_forbidden');
      const key=actor+':'+args.p_request_id,fingerprint=JSON.stringify(args),previous=receipts.get(key);
      if(previous) return previous.fingerprint === fingerprint ? {data:structuredClone(previous.data),error:null} : error('concierge_request_conflict');
      let data:unknown;
      if(args.p_action === 'reserve_photo') {
        if(args.p_expected_revision !== head)return error('concierge_revision_conflict');
        const id=args.p_request_id === reserveA ? photoA : photoB;
        const descriptor:PrivateCheckinPhoto={revision:++head,photoId:id,ownerId:owner,bucket:'concierge-checkin-photos',path:`${owner}/${id}.png`,
          angle:args.p_payload.angle as PrivateCheckinPhoto['angle'],contentType:'image/png',sizeBytes:Number(args.p_payload.sizeBytes),
          sha256:String(args.p_payload.sha256),state:'pending'};
        photos.set(id,{descriptor,reservedBy:actor,reservationRevision:descriptor.revision,complete:false});data=descriptor;
      } else if(args.p_action === 'complete_photo') {
        const record=photos.get(String(args.p_payload.photoId));
        if(!record || record.reservedBy !== actor)return error('concierge_forbidden');
        // This fence belongs to the immutable reservation, not an independently changing head.
        if(args.p_expected_revision !== record.reservationRevision)return error('concierge_request_conflict');
        if(options.legacyGlobalFence && args.p_expected_revision !== head)return error('concierge_revision_conflict');
        const object=objects.get(record.descriptor.path);
        if(!object || record.complete)return error('concierge_request_conflict');
        assert.equal(object.type,record.descriptor.contentType);assert.equal(object.size,record.descriptor.sizeBytes);
        assert.equal(createHash('sha256').update(new Uint8Array(await object.arrayBuffer())).digest('hex'),record.descriptor.sha256);
        record.complete=true;completionWrites++;data={revision:++head,operation:'complete_photo',reportId:null};
      } else if(args.p_action === 'set_next_checkin') {
        if(args.p_expected_revision !== head)return error('concierge_revision_conflict');
        nextDate=String(args.p_payload.nextCheckinOn);data={revision:++head,operation:'set_next_checkin',reportId:null};
      } else throw Error('Unexpected action');
      receipts.set(key,{fingerprint,data:structuredClone(data)});
      if(args.p_action === 'complete_photo' && loseAck){loseAck=false;throw new TypeError('Synthetic acknowledgement lost after commit');}
      return {data:structuredClone(data),error:null};
    },
    storage:{origin:'https://synthetic.supabase.test',
      upload:async (photo,body) => {
        const barrier=barriers.get(photo.photoId)!;barrier.started.resolve();await barrier.release.promise;
        if(objects.has(photo.path))return 'exists';objects.set(photo.path,body);objectWrites++;return 'uploaded';
      },
      read:async photo => {objectReads++;const object=objects.get(photo.path);assert.ok(object);return object;},
      sign:async () => {throw Error('Unexpected signing');},
    },
  };
  return {ports,calls,started:(id:string)=>barriers.get(id)!.started.promise,release:(id:string)=>barriers.get(id)!.release.resolve(),
    releaseAll:()=>{for(const barrier of barriers.values())barrier.release.resolve();},revoke:()=>{revoked=true;},
    state:()=>({head,nextDate,objectWrites,objectReads,completionWrites}),
  };
}

test('overlapping uploads finish against their original reservations and exact retries preserve original phase arguments', {timeout:5000}, async () => {
  const s=scenario();
  try {
    const first=handleCheckinsRequest(upload(reserveA,completeA,8),s.ports);await s.started(photoA);
    const second=handleCheckinsRequest(upload(reserveB,completeB,9,'left'),s.ports);await s.started(photoB);
    assert.equal(s.state().head,10);
    s.release(photoA);const firstResponse=await first;assert.equal(firstResponse.status,200);
    assert.deepEqual(await firstResponse.json(),{revision:11,photo:{id:photoA,angle:'front'}});
    s.release(photoB);const secondResponse=await second;assert.equal(secondResponse.status,200);
    assert.deepEqual(await secondResponse.json(),{revision:12,photo:{id:photoB,angle:'left'}});
    const retry=await handleCheckinsRequest(upload(reserveA,completeA,8),s.ports);assert.equal(retry.status,200);
    assert.deepEqual(await retry.json(),{revision:11,photo:{id:photoA,angle:'front'}});
    const firstPhase=s.calls.filter(c=>c.name==='concierge_checkin_write'&&c.args.p_request_id===completeA);
    assert.equal(firstPhase.length,2);assert.deepEqual(firstPhase[0],firstPhase[1]);
    assert.deepEqual(s.state(),{head:12,nextDate:null,objectWrites:2,objectReads:1,completionWrites:2});
  } finally {s.releaseAll();}
});

test('advisor date changes during upload and after a lost completion acknowledgement do not strand the same upload intent', {timeout:5000}, async () => {
  const s=scenario({loseFirstCompletionAck:true});
  try {
    const first=handleCheckinsRequest(upload(reserveA,completeA,8),s.ports);await s.started(photoA);
    assert.equal((await handleCheckinsRequest(changeDate(advisorRequest,9,'2026-11-01'),s.ports)).status,200);
    s.release(photoA);assert.equal((await first).status,503);assert.equal(s.state().head,11);
    assert.equal((await handleCheckinsRequest(changeDate(nextAdvisorRequest,11,'2026-11-05'),s.ports)).status,200);
    const retried=await handleCheckinsRequest(upload(reserveA,completeA,8),s.ports);assert.equal(retried.status,200);
    assert.deepEqual(await retried.json(),{revision:11,photo:{id:photoA,angle:'front'}});
    const completeCalls=s.calls.filter(c=>c.name==='concierge_checkin_write'&&c.args.p_action==='complete_photo');
    assert.equal(completeCalls.length,2);assert.deepEqual(completeCalls[0],completeCalls[1]);
    assert.deepEqual(s.state(),{head:12,nextDate:'2026-11-05',objectWrites:1,objectReads:1,completionWrites:1});
    s.revoke();assert.equal((await handleCheckinsRequest(upload(reserveA,completeA,8),s.ports)).status,403);
    assert.deepEqual(s.state(),{head:12,nextDate:'2026-11-05',objectWrites:1,objectReads:1,completionWrites:1});
  } finally {s.releaseAll();}
});

test('access revoked while Storage is paused refuses completion without creating a completion receipt', {timeout:5000}, async () => {
  const s=scenario();
  try {
    const first=handleCheckinsRequest(upload(reserveA,completeA,8),s.ports);await s.started(photoA);
    s.revoke();s.release(photoA);
    const response=await first;assert.equal(response.status,403);
    assert.deepEqual(await response.json(),{code:'forbidden',retryable:false});
    assert.deepEqual(s.state(),{head:9,nextDate:null,objectWrites:1,objectReads:0,completionWrites:0});
    const replay=await handleCheckinsRequest(upload(reserveA,completeA,8),s.ports);assert.equal(replay.status,403);
    assert.deepEqual(s.state(),{head:9,nextDate:null,objectWrites:1,objectReads:0,completionWrites:0});
  } finally {s.releaseAll();}
});

test('a completion request UUID already bound to another photo conflicts instead of adopting that photo or receipt', {timeout:5000}, async () => {
  const s=scenario();
  try {
    const first=handleCheckinsRequest(upload(reserveA,completeA,8),s.ports);await s.started(photoA);s.release(photoA);assert.equal((await first).status,200);
    const collision=handleCheckinsRequest(upload(reserveB,completeA,10,'left'),s.ports);await s.started(photoB);s.release(photoB);
    const response=await collision;assert.equal(response.status,409);assert.deepEqual(await response.json(),{code:'request_conflict',retryable:false});
    assert.equal(s.state().completionWrites,1);
    const valid=await handleCheckinsRequest(upload(reserveB,completeB,10,'left'),s.ports);assert.equal(valid.status,200);
    assert.deepEqual(await valid.json(),{revision:12,photo:{id:photoB,angle:'left'}});
  } finally {s.releaseAll();}
});

test('regression control: a global-head completion fence returns the same unrecoverable conflict on exact retry', {timeout:5000}, async () => {
  const s=scenario({legacyGlobalFence:true});
  try {
    const first=handleCheckinsRequest(upload(reserveA,completeA,8),s.ports);await s.started(photoA);
    assert.equal((await handleCheckinsRequest(changeDate(advisorRequest,9,'2026-11-01'),s.ports)).status,200);
    s.release(photoA);assert.equal((await first).status,409);
    const retry=await handleCheckinsRequest(upload(reserveA,completeA,8),s.ports);assert.equal(retry.status,409);
    assert.deepEqual(await retry.json(),{code:'revision_conflict',retryable:false});assert.equal(s.state().completionWrites,0);
  } finally {s.releaseAll();}
});
