/** Opt-in actual Edge handler -> isolated, Unix-socket-only PostgreSQL. No provider/network ports. */
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync,execFile} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {handleCheckinsRequest} from '../supabase/functions/concierge-checkins/handler.ts';
import type {CheckinPorts,CheckinRpcCall} from '../supabase/functions/concierge-checkins/types.ts';
const enabled=process.env.CONCIERGE_REPLIES_NATIVE_SQL==='1',root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bin=process.env.CONCIERGE_TEST_PG_BIN||'/opt/homebrew/opt/postgresql@15/bin';
const artifacts=path.join(root,'.local-artifacts/checkin-replies/native-'+process.pid),db='shelv_checkin_replies';
const env={...Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('PG'))),NODE_ENV:process.env.NODE_ENV??'test',PGPASSFILE:'/dev/null',PGSERVICEFILE:'/dev/null',PGCONNECT_TIMEOUT:'5',PGAPPNAME:'shelv-isolated-checkin-replies'};
let socket='',started=false;
const lit=(value:unknown):string=>typeof value==='number'?String(value):"'"+String(typeof value==='object'?JSON.stringify(value):value).replaceAll("'","''")+"'"+(typeof value==='object'?'::jsonb':'');
const args=(database=db)=>['-X','-w','-h',socket,'-p','55449','-U','postgres','-d',database,'-Atq','-v','ON_ERROR_STOP=1'];
function command(name:string,argv:string[]){const result=spawnSync(path.join(bin,name),argv,{env,encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr||String(result.error));return result.stdout.trim();}
function sql(query:string){return command('psql',[...args(),'-c',query]);}
function deniedSql(query:string,code:string){const result=spawnSync(path.join(bin,'psql'),[...args(),'-c',query],{env,encoding:'utf8',timeout:10000});assert.notEqual(result.status,0);assert.match(result.stderr,new RegExp(code));}
before(()=>{
 if(!enabled)return;fs.mkdirSync(artifacts,{recursive:true});socket=fs.mkdtempSync('/tmp/shelv-replies-');
 command('initdb',['-D',path.join(artifacts,'data'),'-U','postgres','--auth=trust','--no-locale','-E','UTF8']);
 command('pg_ctl',['-D',path.join(artifacts,'data'),'-l',path.join(artifacts,'postgres.log'),'-o',`-k ${socket} -p 55449 -c listen_addresses=''`,'-w','start']);started=true;
 command('psql',[...args('postgres'),'-c',`create database ${db}`]);
 sql(`comment on database ${db} is 'Task-owned synthetic check-in reply acceptance';create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,is_anonymous boolean default false);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table public.profiles(id uuid primary key references auth.users on delete cascade,deletion_started_at timestamptz);create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb);alter table storage.objects enable row level security;`);
 const migrations=['20261017190016_concierge_persistence_r1.sql','20261018234537_concierge_portal_workflows.sql','20261019015338_concierge_presentation_r2.sql','20261020002348_concierge_advisor_preview_v2.sql',...fs.readdirSync(path.join(root,'supabase/migrations')).filter(name=>name.endsWith('_concierge_checkin_replies.sql'))];
 for(const name of migrations)command('psql',[...args(),'-f',path.join(root,'supabase/migrations',name)]);
 assert.equal(sql('show listen_addresses'),'');
 fs.writeFileSync(path.join(artifacts,'BOOTSTRAP.json'),JSON.stringify({database:db,listenAddresses:'',migrations,synthetic:true})+'\n');
});
after(()=>{if(started){command('pg_ctl',['-D',path.join(artifacts,'data'),'-m','fast','-w','stop']);fs.rmSync(path.join(artifacts,'data'),{recursive:true,force:true});}if(socket)fs.rmSync(socket,{recursive:true,force:true});});
const signature:Record<CheckinRpcCall['name'],string[]>={concierge_checkin_read:['p_client_id'],concierge_checkin_advisor_read:['p_client_id'],concierge_checkin_write:['p_client_id','p_action','p_expected_revision','p_request_id','p_payload'],concierge_checkin_photo_authorize:['p_client_id','p_photo_id']};
function setup(){
 const [client,other,advisor,viewer]=Array.from({length:4},()=>randomUUID());
 sql(`insert into auth.users(id) values ${[client,other,advisor,viewer].map(id=>`(${lit(id)})`).join(',')};insert into public.profiles(id) select id from auth.users on conflict do nothing;insert into concierge.enrollments(client_id,display_name,status) values (${lit(client)},'Synthetic reply client','active'),(${lit(other)},'Synthetic other client','active');insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values (${lit(advisor)},true,true,true,false,false),(${lit(viewer)},true,true,false,false,true);`);
 const owners:Record<string,string>={client,other,advisor,viewer};let loseReply=false;
 const ports:CheckinPorts={allowedOrigins:[],authenticate:async token=>owners[token]?{id:owners[token],is_anonymous:false}:null,rpc:async(token,call)=>{
  const body=call.args as Record<string,unknown>,query=`begin;set local role authenticated;set local request.jwt.claim.sub=${lit(owners[token])};select public.${call.name}(${signature[call.name].map(key=>lit(body[key])).join(',')});commit;`;
  const outcome=await new Promise<{stdout:string;stderr:string;failed:boolean}>(resolve=>execFile(path.join(bin,'psql'),[...args(),'-c',query],{env,encoding:'utf8',timeout:10000},(error,stdout,stderr)=>resolve({stdout,stderr,failed:Boolean(error)})));
  if(outcome.failed)return {data:null,error:{message:/ERROR:\s+(concierge_[a-z_]+)/.exec(outcome.stderr)?.[1]||'synthetic_sql_error'}};
  const data=JSON.parse(outcome.stdout.trim().split('\n').find(line=>line.startsWith('{'))!);
  if(loseReply&&call.name==='concierge_checkin_write'&&call.args.p_action==='send_advisor_reply'){loseReply=false;throw Error('Synthetic lost response after commit');}
  return {data,error:null};
 },storage:{origin:'https://synthetic.invalid',upload:async()=>{throw Error('unused');},read:async()=>{throw Error('unused');},sign:async()=>{throw Error('unused');}}};
 const http=async(token:string,body:unknown,status=200)=>{const response=await handleCheckinsRequest(new Request('https://synthetic.invalid/checkins',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body)}),ports),data=await response.json();assert.equal(response.status,status,JSON.stringify(data));return data as any;};
 const submit=()=>http('client',{action:'submit_report',comfort:'Synthetic comfort',consistency:'Synthetic consistency',changes:'',photoIds:[],requestId:randomUUID(),expectedRevision:0});
 return {client,other,advisor,viewer,http,submit,loseNextReply(){loseReply=true;}};
}

test('native handler stores server-authored public replies separately from private notes and denies other clients', {skip:!enabled},async()=>{
 const s=setup(),report=await s.submit();
 await s.http('advisor',{action:'add_meeting_note',clientId:s.client,checkinId:report.reportId,note:'PRIVATE_NOTE_CANARY',requestId:randomUUID(),expectedRevision:1});
 const body='<script>window.replyExecuted=true</script> Public guidance';
 await s.http('advisor',{action:'send_advisor_reply',clientId:s.client,checkinId:report.reportId,reply:body,requestId:randomUUID(),expectedRevision:2});
 const view=await s.http('client',{action:'client_read'}),reply=view.reports[0].advisorReplies[0];
 assert.equal(reply.reply,body);assert.equal(reply.authorId,s.advisor);assert.ok(Number.isFinite(Date.parse(reply.createdAt)));assert.doesNotMatch(JSON.stringify(view),/PRIVATE_NOTE_CANARY|meetingNotes|checkin_notes/);
 const advisor=await s.http('advisor',{action:'advisor_read',clientId:s.client});assert.equal(advisor.meetingNotes[0].note,'PRIVATE_NOTE_CANARY');assert.deepEqual(advisor.client.reports[0].advisorReplies,[reply]);
 assert.equal((await s.http('other',{action:'client_read'})).reports.length,0);
 await s.http('other',{action:'advisor_read',clientId:s.client},403);
 assert.equal(sql(`select count(*) from concierge.activations where client_id=${lit(s.client)}`),'0');
 for(const role of ['anon','authenticated','service_role'])deniedSql(`set role ${role};select * from concierge.checkin_replies`,'permission denied');
 deniedSql(`update concierge.checkin_replies set reply='changed' where id=${lit(reply.id)}`,'concierge_immutable');
});

test('native reply rights require edit and exact report ownership, and revocation denies exact replay', {skip:!enabled},async()=>{
 const s=setup(),report=await s.submit(),command={action:'send_advisor_reply',clientId:s.client,checkinId:report.reportId,reply:'Public guidance',requestId:randomUUID(),expectedRevision:1};
 await s.http('client',command,403);await s.http('viewer',command,403);
 await s.http('advisor',{...command,clientId:s.other,expectedRevision:0},404);
 const receipt=await s.http('advisor',command);assert.equal(receipt.revision,2);assert.deepEqual(await s.http('advisor',command),receipt);
 sql(`update concierge.advisors set active=false where user_id=${lit(s.advisor)}`);await s.http('advisor',command,403);
 sql(`update concierge.advisors set active=true where user_id=${lit(s.advisor)};update concierge.enrollments set status='revoked' where client_id=${lit(s.client)}`);
 await s.http('client',{action:'client_read'},403);await s.http('advisor',command,403);
 assert.equal(sql(`select count(*) from concierge.checkin_replies where client_id=${lit(s.client)}`),'1');
});

test('native exact lost-response retry appends once and concurrent or changed intents fail closed', {skip:!enabled},async()=>{
 const s=setup(),report=await s.submit(),command={action:'send_advisor_reply',clientId:s.client,checkinId:report.reportId,reply:'First public reply',requestId:randomUUID(),expectedRevision:1};
 s.loseNextReply();await s.http('advisor',command,503);const receipt=await s.http('advisor',command);assert.equal(receipt.revision,2);
 await s.http('advisor',{...command,reply:'Different body'},409);
 await s.http('advisor',{...command,requestId:randomUUID()},409);
 const send=(reply:string)=>s.http('advisor',{...command,reply,requestId:randomUUID(),expectedRevision:2});
 // Race independent real SQL transactions; precisely one head revision may win.
 const outcomes=await Promise.allSettled([send('Concurrent A'),send('Concurrent B')]);
 assert.equal(outcomes.filter(result=>result.status==='fulfilled').length,1);
 assert.match(String((outcomes.find(result=>result.status==='rejected') as PromiseRejectedResult).reason),/revision_conflict/);
 const view=await s.http('client',{action:'client_read'});assert.equal(view.revision,3);assert.equal(view.reports[0].advisorReplies.length,2);assert.equal(view.reports[0].advisorReplies[0].reply,'First public reply');
});
