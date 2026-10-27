/** Opt-in actual-handler → native SQL interleaving. Synthetic Auth and Storage adapters only. */
import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { handleCheckinsRequest } from '../supabase/functions/concierge-checkins/handler.ts';
import type { CheckinPorts, CheckinRpcCall } from '../supabase/functions/concierge-checkins/types.ts';

// Core provisions this dedicated clone; a database-name AND marker check precedes all fixture writes.
const DB = 'derive_disposable_concierge_checkins_20261019_01';
const MARKER = 'Synthetic check-in feature HTTP SQL fixture only 20261019';
const executable = '/opt/homebrew/opt/postgresql@15/bin/psql';
const connection = ['-X','-w','-h','/tmp/derive-storage-20261015-01','-p','52819','-U','postgres','-d',DB,'-Atq','-v','ON_ERROR_STOP=1'];
const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('PG'))),
  PGPASSFILE:'/tmp/shelv-checkins-disabled-pgpass-never-create', PGSERVICEFILE:'/dev/null', PGCONNECT_TIMEOUT:'5',
  PGAPPNAME:'synthetic-checkins-http-sql', NODE_ENV:process.env.NODE_ENV ?? 'test' };
const lit = (value: unknown): string => value === null ? 'null' : typeof value === 'number' ? String(value)
  : typeof value === 'object' ? lit(JSON.stringify(value)) + '::jsonb' : "'" + String(value).replaceAll("'","''") + "'";
function sql(query: string) {
  const result = spawnSync(executable,[...connection,'-c',query],{env,encoding:'utf8',timeout:20000});
  if(result.error)throw result.error;
  assert.equal(result.status,0,result.stderr);return result.stdout.trim();
}
const signature: Record<CheckinRpcCall['name'],readonly string[]> = {
  concierge_checkin_read:['p_client_id'], concierge_checkin_advisor_read:['p_client_id'],
  concierge_checkin_write:['p_client_id','p_action','p_expected_revision','p_request_id','p_payload'],
  concierge_checkin_photo_authorize:['p_client_id','p_photo_id'],
};
function invoke(actor: string, call: CheckinRpcCall, signal?: AbortSignal) {
  assert.ok(Object.hasOwn(signature,call.name));assert.match(actor,/^[a-f0-9-]{36}$/);
  const args = call.args as Record<string,unknown>;
  const query = `begin;set local role authenticated;set local request.jwt.claim.sub=${lit(actor)};select public.${call.name}(${signature[call.name].map(key=>lit(args[key])).join(',')});commit;`;
  // Separate subprocesses allow native completion transactions to overlap after the Storage gates open.
  return new Promise<{status:number;stdout:string;stderr:string}>(resolve => {
    execFile(executable,[...connection,'-c',query],{env,encoding:'utf8',timeout:20000,maxBuffer:1024*1024,signal},(error,stdout,stderr)=>{
      resolve({status:error ? 1 : 0,stdout,stderr});
    });
  });
}
function deferred() {
  let resolve!: () => void;const promise = new Promise<void>(done => {resolve=done;});return {promise,resolve};
}
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64'));

test('synthetic HTTP→SQL preserves reservation fences across overlapping uploads, advisor writes, lost acknowledgements and revocation',
  {skip:process.env.CONCIERGE_CHECKINS_NATIVE_SQL !== '1',timeout:60000},async()=>{
  assert.equal(sql("select current_database()||'|'||shobj_description(oid,'pg_database') from pg_database where datname=current_database()"),`${DB}|${MARKER}`);
  // Generated fixture actors only. Retain prior runs: no reset/truncate/drop, role DDL, or real client rows.
  const [client,other,advisor,revocable] = Array.from({length:4},()=>randomUUID());
  sql(`insert into auth.users(id,is_anonymous) values ${[client,other,advisor,revocable].map(id=>`(${lit(id)},false)`).join(',')}`);
  sql(`insert into concierge.enrollments(client_id,display_name,status) values ${[client,other,revocable].map(id=>`(${lit(id)},'Synthetic check-in client','active')`).join(',')}`);
  sql(`insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values (${lit(advisor)},true,true,true,false,false)`);
  const actors: Record<string,string> = {client,other,advisor,revocable};
  const objects = new Map<string,Blob>(),calls:CheckinRpcCall[]=[];
  const gates = new Map(['front','left'].map(angle=>[angle,{started:deferred(),release:deferred()}]));
  const [reserveA,completeA,reserveB,completeB] = Array.from({length:4},()=>randomUUID());
  let loseAck = true,originalCompletion:unknown,storageWrites=0,storageReads=0,signs=0;
  const ports: CheckinPorts = {
    allowedOrigins:[],authenticate:async token=>actors[token] ? {id:actors[token],is_anonymous:false} : null,
    rpc:async(token,call,signal)=>{
      calls.push(structuredClone(call));const result=await invoke(actors[token],call,signal);
      if(result.status!==0)return {data:null,error:{message:/ERROR:\s+(concierge_[a-z_]+)/.exec(result.stderr)?.[1] ?? 'fixture_rpc_failed'}};
      const data=JSON.parse(result.stdout.trim().split('\n').reverse().find(line=>line.startsWith('{')||line.startsWith('['))!);
      if(call.name==='concierge_checkin_write' && call.args.p_request_id===completeA && loseAck){
        loseAck=false;originalCompletion=structuredClone(data);throw new TypeError('Synthetic acknowledgement lost after commit');
      }
      return {data,error:null};
    },
    storage:{origin:'https://synthetic.supabase.test',
      upload:async(photo,body)=>{
        const gate=photo.ownerId===client ? gates.get(photo.angle) : undefined;
        if(gate){gate.started.resolve();await gate.release.promise;}
        if(objects.has(photo.path))return 'exists';
        // Real SQL metadata/fence only; no Storage HTTP or image service is contacted.
        sql(`insert into storage.objects(bucket_id,name,metadata) values (${lit(photo.bucket)},${lit(photo.path)},${lit({size:body.size,mimetype:body.type})})`);
        objects.set(photo.path,body);storageWrites++;
        if(photo.ownerId===revocable)sql(`update concierge.enrollments set status='revoked' where client_id=${lit(revocable)}`);
        return 'uploaded';
      },
      read:async photo=>{storageReads++;const body=objects.get(photo.path);assert.ok(body);return body;},
      sign:async(photo,ttl)=>{assert.equal(ttl,60);signs++;return `https://synthetic.supabase.test/storage/v1/object/sign/${photo.bucket}/${photo.path}?token=synthetic`;},
    },
  };
  async function http(token:string,command:unknown,status=200) {
    const response=await handleCheckinsRequest(new Request('https://synthetic.invalid/checkins',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(command)}),ports);
    const body=await response.json();assert.equal(response.status,status,JSON.stringify(body));return body as any;
  }
  const upload=(token:string,reserve:string,complete:string,revision:number,angle:string)=>handleCheckinsRequest(new Request('https://synthetic.invalid/checkins/upload',{
    method:'POST',body:png,headers:{authorization:`Bearer ${token}`,'content-type':'image/png','x-request-id':reserve,'x-completion-request-id':complete,'x-expected-revision':String(revision),'x-photo-angle':angle}}),ports);
  const date=(revision:number,nextCheckinOn:string)=>http('advisor',{action:'set_next_checkin',clientId:client,requestId:randomUUID(),expectedRevision:revision,nextCheckinOn});
  const read=()=>http('client',{action:'client_read'});
  try {
    // Optional pre-meeting uploads have no invented plan/publication/payment prerequisite.
    const first=upload('client',reserveA,completeA,0,'front');await gates.get('front')!.started.promise;
    const second=upload('client',reserveB,completeB,1,'left');await gates.get('left')!.started.promise;
    assert.equal((await date(2,'2026-11-01')).revision,3);
    gates.get('front')!.release.resolve();gates.get('left')!.release.resolve();
    const [firstResponse,secondResponse]=await Promise.all([first,second]);
    assert.equal(firstResponse.status,503);assert.equal(secondResponse.status,200);
    const uploadedB=await secondResponse.json() as any;
    assert.equal((await read()).revision,5);
    await date(5,'2026-11-05');
    const retriedA=await upload('client',reserveA,completeA,0,'front');assert.equal(retriedA.status,200);
    const uploadedA=await retriedA.json() as any;
    assert.equal(uploadedA.revision,(originalCompletion as {revision:number}).revision);
    const retriedB=await upload('client',reserveB,completeB,1,'left');assert.equal(retriedB.status,200);assert.deepEqual(await retriedB.json(),uploadedB);
    assert.equal((await read()).revision,6);assert.equal((await read()).nextCheckinOn,'2026-11-05');
    const aCalls=calls.filter(call=>call.name==='concierge_checkin_write'&&call.args.p_request_id===completeA);
    assert.equal(aCalls.length,2);assert.deepEqual(aCalls[0],aCalls[1]);
    assert.equal(aCalls[0].name==='concierge_checkin_write'&&aCalls[0].args.p_expected_revision,1);
    assert.deepEqual({storageWrites,storageReads},{storageWrites:2,storageReads:2});
    assert.equal(sql(`select count(*) from concierge.checkin_photos where client_id=${lit(client)} and state='complete'`),'2');
    const publicPhotos=[uploadedA.photo.id,uploadedB.photo.id];
    const reportCommand={action:'submit_report',requestId:randomUUID(),expectedRevision:6,comfort:'Comfortable',consistency:'Most days',changes:'',photoIds:publicPhotos};
    const report=await http('client',reportCommand);assert.equal(report.revision,7);assert.deepEqual(await http('client',reportCommand),report);
    await http('advisor',{action:'add_meeting_note',clientId:client,requestId:randomUUID(),expectedRevision:7,checkinId:report.reportId,note:'SYNTHETIC_PRIVATE_MEETING_NOTE'});
    const clientView=await read();assert.equal(clientView.reports.length,1);assert.equal(clientView.reports[0].photos.length,2);
    assert.doesNotMatch(JSON.stringify(clientView),/PRIVATE_MEETING_NOTE|meetingNotes|bucket|path|sha256|ownerId/);
    const advisorView=await http('advisor',{action:'advisor_read',clientId:client});assert.equal(advisorView.meetingNotes[0].note,'SYNTHETIC_PRIVATE_MEETING_NOTE');
    await http('other',{action:'photo_view',photoId:publicPhotos[0]},404);
    await http('other',{action:'advisor_photo_view',clientId:client,photoId:publicPhotos[0]},403);assert.equal(signs,0);
    assert.equal((await http('advisor',{action:'advisor_photo_view',clientId:client,photoId:publicPhotos[0]})).expiresIn,60);assert.equal(signs,1);
    // Reusing another photo's completion UUID conflicts; the original reservation can still finish with its distinct UUID.
    const reserveC=randomUUID(),completeC=randomUUID();
    const collision=await upload('client',reserveC,completeA,8,'right');assert.equal(collision.status,409);
    assert.deepEqual(await collision.json(),{code:'request_conflict',retryable:false});
    const resumed=await upload('client',reserveC,completeC,8,'right');assert.equal(resumed.status,200);
    assert.equal((await read()).revision,10);
    // Service/enrollment guards remain before exact replay; no extra Storage I/O occurs on refusal.
    sql(`update concierge.enrollments set status='revoked' where client_id=${lit(client)}`);
    const before={storageWrites,storageReads};assert.equal((await upload('client',reserveA,completeA,0,'front')).status,403);
    assert.deepEqual({storageWrites,storageReads},before);
    // Revocation after object insertion must still refuse completion; it does not invent cleanup/deletion.
    const revokedReserve=randomUUID(),revokedComplete=randomUUID();
    const revoked=await upload('revocable',revokedReserve,revokedComplete,0,'right');assert.equal(revoked.status,403);
    assert.equal(sql(`select state from concierge.checkin_photos where client_id=${lit(revocable)}`),'pending');
    assert.equal(sql(`select count(*) from concierge.workflow_requests where actor_id=${lit(revocable)} and request_id=${lit(revokedComplete)}`),'0');
    sql(`update concierge.enrollments set phase='ongoing' where client_id=${lit(other)}`);
    await http('other',{action:'submit_report',requestId:randomUUID(),expectedRevision:0,comfort:'Comfortable',consistency:'Most days',changes:'',photoIds:[]},403);
  } finally {for(const gate of gates.values())gate.release.resolve();}
});
