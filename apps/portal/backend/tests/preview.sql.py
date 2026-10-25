"""Real PostgreSQL tests in an isolated, fixture-only cluster. Never connects hosted/shared DBs.
Auth UID and profiles/Storage schema are minimal stand-ins; all concierge migrations are real.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import importlib.util,json,os,subprocess,sys,tempfile,unittest,shutil
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'source'
def postgres_tools():
 required=('initdb','pg_ctl','psql')
 def valid(directory):return all((directory/name).is_file() and os.access(directory/name,os.X_OK) for name in required)
 explicit=os.environ.get('PGBIN')
 if explicit:
  directory=Path(explicit).expanduser().resolve()
  if not valid(directory):raise RuntimeError('PGBIN must name a PostgreSQL bin directory containing executable initdb, pg_ctl and psql.')
  return directory
 candidates=[]
 initdb=shutil.which('initdb')
 if initdb:candidates.append(Path(initdb).resolve().parent)
 for command in [('pg_config','--bindir'),('brew','--prefix','postgresql@15')]:
  if not shutil.which(command[0]):continue
  result=subprocess.run(command,capture_output=True,text=True,timeout=10)
  if result.returncode==0 and result.stdout.strip():
   candidate=Path(result.stdout.strip())
   candidates.append(candidate/'bin' if command[0]=='brew' else candidate)
 for candidate in candidates:
  if valid(candidate):return candidate.resolve()
 raise RuntimeError('PostgreSQL fixture tools are unavailable. Set PGBIN to the directory containing initdb, pg_ctl and psql.')

def node_tool():
 selected=os.environ.get('NODE_BIN') or shutil.which('node')
 if not selected:raise RuntimeError('Node.js is unavailable. Set NODE_BIN to a Node.js 22.23.0 or newer executable.')
 resolved=shutil.which(selected)
 if not resolved:raise RuntimeError('NODE_BIN must name an executable Node.js 22.23.0 or newer binary.')
 result=subprocess.run([resolved,'--version'],capture_output=True,text=True,timeout=10)
 try:version=tuple(int(part) for part in result.stdout.strip().lstrip('v').split('.')[:3])
 except ValueError:version=()
 if result.returncode!=0 or version<(22,23,0):raise RuntimeError('Node.js 22.23.0 or newer is required. Select it on PATH or set NODE_BIN explicitly.')
 return str(Path(resolved).resolve())

BIN=postgres_tools()
NODE=node_tool()
spec=importlib.util.spec_from_file_location('workflow',SOURCE/'tests/concierge-workflows.sql.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.BIN=BIN
m.DB='preview_synthetic';m.MARKER='isolated synthetic preview acceptance only';m.q.__defaults__=(m.DB,)
m.ENV={k:v for k,v in os.environ.items() if not k.startswith('PG')}
m.ENV.update(PGPASSFILE=str(ROOT/'tests/never-created.pgpass'),PGSERVICEFILE='/dev/null',PGAPPNAME='isolated-synthetic-preview')
m.CONNECTION=['-w','-h',str(ROOT),'-p','58427','-U','postgres']
C,D,A,V,N=m.C,m.D,m.A,m.V,m.N
q,ok,lit,call,write=m.q,m.ok,m.lit,m.call,m.write

class Preview(unittest.TestCase):
 def setUp(self):
  # Reuse canonical synthetic data and authoritative write entry points, never shared DB bootstrap.
  m.Workflows.setUp(self)
  self.f=json.loads((SOURCE/'tests/fixtures/concierge-presentation.json').read_text())
  self.recommendation['id']='moisturizer-v2'
 def save(self):
  write(A,'presentation_write','save_intake_v2',dict(goal='Synthetic goal',note='PRIVATE_INTAKE_CANARY',baseline=self.f['baseline'],presentation=self.f['intakePresentation']),0)
  write(A,'presentation_write','save_draft_v2',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote='PRIVATE_DRAFT_CANARY',presentation=self.f['presentation']),1)
 def publish(self):
  self.save();write(A,'presentation_write','publish_v2',{},2)
 def preview(self,actor=A,mode='published',revision=None,client=C):
  return call(actor,'concierge_advisor_preview_v2',[lit(client),lit(mode),'null' if revision is None else str(revision)])
 def deny(self,actor=A,mode='published',revision=None,client=C,code='forbidden'):
  r=m.invoke(actor,'concierge_advisor_preview_v2',[lit(client),lit(mode),'null' if revision is None else str(revision)])
  self.assertNotEqual(r.returncode,0,r.stdout);self.assertIn('concierge_'+code,r.stderr)
 def fund(self):
  # Use existing manual synthetic quote/claim/confirm helpers; no provider calls.
  quote=m.Workflows.issue(self);return m.Workflows.claim_confirm(self,quote,1)
 def test_01_published_is_exact_real_owner_projection_and_unpaid_is_hidden(self):
  self.publish()
  advisor=call(A,'concierge_advisor_view_v2',[lit(C)])
  self.assertIsNotNone(advisor['client']['plan'])
  preview=self.preview();self.assertEqual(preview['clientView'],call(C,'concierge_client_view_v2',[]))
  self.assertIsNone(preview['clientView']['plan']);self.assertIsNone(preview['draft'])
  self.assertEqual(set(preview),{'schemaVersion','mode','clientId','revision','clientView','draft','payments','checkins'})
  self.fund();preview=self.preview(actor=V)
  self.assertEqual(preview['clientView'],call(C,'concierge_client_view_v2',[]));self.assertEqual(preview['clientView']['plan']['presentation'],self.f['presentation'])
  self.assertEqual(preview['payments'],call(C,'concierge_payment_view',[lit(C)]));self.assertEqual(preview['checkins'],call(C,'concierge_checkin_read',[lit(C)]))
 def test_02_draft_is_exact_saved_public_content_no_false_publication(self):
  self.save();write(A,'advisor_write','save_meeting_note',dict(kind='notes',text='PRIVATE_MEETING_CANARY'),2)
  p=self.preview(mode='draft',revision=3)
  self.assertEqual(p['revision'],3);self.assertEqual(p['draft'],dict(savedRevision=3,intakeVersion=1,presentation=self.f['presentation'],recommendations=[self.recommendation]))
  self.assertIsNone(p['clientView']['plan']);self.assertEqual(p['clientView']['activeRoutine'],[])
  self.assertNotIn('PRIVATE_',json.dumps(p));self.assertNotIn('version',p['draft'])
 def test_03_exact_revision_and_current_intake_basis_or_no_success(self):
  self.save();self.deny(mode='draft',revision=1,code='stale_draft')
  write(A,'presentation_write','save_intake_v2',dict(goal='New current intake',note='PRIVATE_NEW',baseline=self.f['baseline'],presentation=self.f['intakePresentation']),2)
  self.deny(mode='draft',revision=3,code='stale_draft')
 def test_04_missing_and_legacy_drafts_never_fallback_to_published(self):
  self.deny(mode='draft',revision=0,code='draft_missing')
  self.publish();self.deny(mode='draft',revision=3,code='draft_missing')
  # A saved legacy draft without rich presentation cannot satisfy this renderer.
  ok('delete from concierge.publication_presentations;delete from concierge.intake_presentations')
  write(A,'write','save_draft',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote='PRIVATE_LEGACY'),3)
  self.deny(mode='draft',revision=4,code='draft_missing')
 def test_05_all_live_actor_and_capability_fences(self):
  self.save()
  for actor in [C,D,N]:self.deny(actor=actor)
  self.deny(actor='10000000-0000-4000-8000-000000000099')
  self.deny(actor='',code='unauthorized')
  for sql,restore in [
   ('update concierge.advisors set active=false where user_id='+lit(A),'update concierge.advisors set active=true where user_id='+lit(A)),
   ('update concierge.advisors set can_view=false where user_id='+lit(A),'update concierge.advisors set can_view=true where user_id='+lit(A)),
   ('update auth.users set is_anonymous=true where id='+lit(A),'update auth.users set is_anonymous=false where id='+lit(A)),
   ('update public.profiles set deletion_started_at=now() where id='+lit(A),'update public.profiles set deletion_started_at=null where id='+lit(A))]:
   ok(sql);self.deny();ok(restore)
  self.assertEqual(self.preview(actor=V,mode='draft',revision=2)['draft']['savedRevision'],2)
 def test_06_target_deletion_anonymous_missing_and_revoked_enrollment(self):
  self.save()
  for sql,restore in [
   ('update public.profiles set deletion_started_at=now() where id='+lit(C),'update public.profiles set deletion_started_at=null where id='+lit(C)),
   ('update auth.users set is_anonymous=true where id='+lit(C),'update auth.users set is_anonymous=false where id='+lit(C)),
   ("update concierge.enrollments set status='revoked' where client_id="+lit(C),"update concierge.enrollments set status='active' where client_id="+lit(C))]:
   ok(sql);self.deny();self.deny(mode='draft',revision=2);ok(restore)
  ok('delete from concierge.enrollments where client_id='+lit(C));self.deny();self.deny(mode='draft',revision=2)
  self.deny(client=N);self.deny(client='10000000-0000-4000-8000-000000000099')
 def test_07_cancelled_owner_visibility_and_saved_draft_remain_readable(self):
  self.publish();self.fund();ok("update concierge.enrollments set status='cancelled' where client_id="+lit(C))
  self.assertEqual(self.preview()['clientView'],call(C,'concierge_client_view_v2',[]))
  self.assertEqual(self.preview()['payments'],call(C,'concierge_payment_view',[lit(C)]))
 def test_08_reads_change_no_rows_or_sequences_and_private_checkin_notes_excluded(self):
  self.save()
  ok('insert into concierge.checkin_heads(client_id) values('+lit(C)+')')
  ok('insert into concierge.checkin_reports(id,client_id,comfort,consistency,changes) values('+lit(N)+','+lit(C)+",'Comfort','Consistent','Synthetic changes')")
  ok('insert into concierge.checkin_notes(id,client_id,report_id,note,created_by) values('+','.join(map(lit,[V,C,N,'PRIVATE_CHECKIN_CANARY',A]))+')')
  tables=ok("select tablename from pg_tables where schemaname='concierge' order by tablename").splitlines()
  def snapshot():
   rows={table:ok('select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),\'[]\'::jsonb) from concierge.'+table+' x') for table in tables}
   for seq in ok("select sequencename from pg_sequences where schemaname='concierge' order by sequencename").splitlines():
    rows['sequence:'+seq]=ok('select last_value,is_called from concierge.'+seq)
   return rows
  before=snapshot();p=self.preview(mode='draft',revision=2);self.preview();self.assertEqual(before,snapshot());self.assertNotIn('PRIVATE_',json.dumps(p))
  self.assertEqual(p['checkins'],call(C,'concierge_checkin_read',[lit(C)]))
 def test_09_rpc_acl_and_invalid_direct_sql_inputs(self):
  for role in ['anon','service_role']:
   self.assertEqual(ok("select has_function_privilege("+lit(role)+",'public.concierge_advisor_preview_v2(uuid,text,bigint)','execute')"),'f')
  self.assertEqual(ok("select has_function_privilege('authenticated','public.concierge_advisor_preview_v2(uuid,text,bigint)','execute')"),'t')
  for mode,revision in [('other',None),('published',0),('draft',None),('draft',-1),('draft',9007199254740992)]:self.deny(mode=mode,revision=revision,code='invalid_input')
  for args in [[lit(C),'null','null'],['null',lit('published'),'null']]:
   r=m.invoke(A,'concierge_advisor_preview_v2',args);self.assertNotEqual(r.returncode,0);self.assertIn('concierge_invalid_input',r.stderr)
 def test_10_client_lock_waits_for_concurrent_saved_revision_and_rejects_stale(self):
  import select,time
  self.save()
  blocker=subprocess.Popen([str(BIN/'psql'),'-X',*m.CONNECTION,'-d',m.DB,'-At','-v','ON_ERROR_STOP=1'],env=m.ENV,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
  pool=None;blocker_cleaned=False;blocker_stderr=''
  def cleanup_blocker():
   nonlocal blocker_cleaned,blocker_stderr
   if blocker_cleaned:return blocker_stderr
   try:
    if blocker.stdin is not None:
     try:blocker.stdin.close()
     except BrokenPipeError:pass
     blocker.stdin=None
    if blocker.poll() is None:blocker.terminate()
    try:_,blocker_stderr=blocker.communicate(timeout=2)
    except subprocess.TimeoutExpired:
     blocker.kill();_,blocker_stderr=blocker.communicate(timeout=2)
    return blocker_stderr
   finally:
    blocker_cleaned=True
    for stream in [blocker.stdout,blocker.stderr]:
     if stream is not None:stream.close()
  try:
   try:
    blocker.stdin.write("begin;select pg_advisory_xact_lock(hashtextextended('concierge:client:"+C+"',0));select 'LOCKED';\n");blocker.stdin.flush()
   except BrokenPipeError:self.fail('psql blocker closed input before LOCKED; stderr: '+cleanup_blocker())
   deadline=time.monotonic()+5;output=b'';ready=False;readiness_failure='timed out before LOCKED'
   while time.monotonic()<deadline:
    readable,_,_=select.select([blocker.stdout],[],[],max(0,deadline-time.monotonic()))
    if not readable:break
    chunk=os.read(blocker.stdout.fileno(),4096)
    if not chunk:
     readiness_failure='closed stdout before LOCKED';break
    output+=chunk
    if b'LOCKED' in output.splitlines():ready=True;break
   if not ready:self.fail('psql blocker '+readiness_failure+'; stderr: '+cleanup_blocker())
   pool=ThreadPoolExecutor(max_workers=1)
   future=pool.submit(m.invoke,A,'concierge_advisor_preview_v2',[lit(C),lit('draft'),'2'])
   # Observe the preview waiting on our advisory lock, without relying on timing.
   waiting=False;deadline=time.monotonic()+5
   while time.monotonic()<deadline:
    if ok("select exists(select 1 from pg_stat_activity where application_name='isolated-synthetic-preview' and wait_event='advisory' and query like '%concierge_advisor_preview_v2%')")=='t':waiting=True;break
   self.assertTrue(waiting,'preview must serialize with authoritative client writes')
   blocker.stdin.write('update concierge.cases set revision=revision+1 where client_id='+lit(C)+';commit;\n');blocker.stdin.close();blocker.stdin=None;blocker.wait(timeout=10)
   result=future.result(timeout=10);self.assertNotEqual(result.returncode,0);self.assertIn('concierge_stale_draft',result.stderr)
  finally:
   try:cleanup_blocker()
   finally:
    if pool is not None:pool.shutdown(wait=True,cancel_futures=True)
 def test_11_real_sql_envelopes_pass_handler_allowlists(self):
  self.save();draft=self.preview(mode='draft',revision=2)
  script="""import assert from 'node:assert/strict';import {handleConciergeRequest} from './source/supabase/functions/concierge-operations/handler.ts';const chunks=[];for await(const c of process.stdin)chunks.push(c);const data=JSON.parse(Buffer.concat(chunks).toString());const body={action:'advisor_preview_read_v2',clientId:data.clientId,mode:data.mode,expectedRevision:data.mode==='draft'?data.revision:null};const response=await handleConciergeRequest(new Request('https://example.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify(body)}),{allowedOrigins:[],authenticate:async()=>({id:'10000000-0000-4000-8000-000000000003',is_anonymous:false}),rpc:async()=>({data,error:null})});assert.equal(response.status,200,await response.clone().text());assert.deepEqual(await response.json(),data);"""
  for envelope in [draft,self.preview()]:
   r=subprocess.run([NODE,'--experimental-strip-types','--input-type=module','-e',script],cwd=ROOT,input=json.dumps(envelope),text=True,capture_output=True);self.assertEqual(r.returncode,0,r.stderr)


 def test_12_saved_draft_preserves_actual_paid_plan_history_and_routine(self):
  self.publish();self.fund()
  write(A,'presentation_write','save_draft_v2',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote='PRIVATE_NEXT_DRAFT',presentation=self.f['presentation']),3)
  preview=self.preview(mode='draft',revision=4)
  self.assertEqual(preview['clientView'],call(C,'concierge_client_view_v2',[]))
  self.assertEqual(preview['clientView']['plan']['version'],1)
  self.assertGreater(len(preview['clientView']['activeRoutine']),0)
  self.assertEqual(preview['draft']['savedRevision'],4)
  self.assertNotIn('version',preview['draft'])
  self.assertEqual(preview['payments'],call(C,'concierge_payment_view',[lit(C)]))
  ok("update concierge.enrollments set status='cancelled' where client_id="+lit(C))
  self.assertEqual(self.preview(mode='draft',revision=4)['clientView'],call(C,'concierge_client_view_v2',[]))

def main():
 no_apply='--without-preview' in sys.argv
 if no_apply:sys.argv.remove('--without-preview')
 (ROOT/'evidence').mkdir(exist_ok=True)
 data=Path(tempfile.mkdtemp(prefix='fixture-pg-',dir=ROOT))
 started=False
 socket_dir=Path(tempfile.mkdtemp(prefix='shelv-preview-sock-',dir='/tmp'))
 m.CONNECTION=['-w','-h',str(socket_dir),'-p','58427','-U','postgres']
 try:
  subprocess.run([str(BIN/'initdb'),'-D',str(data),'-U','postgres','-A','trust','--no-locale','-E','UTF8'],check=True,capture_output=True,text=True,timeout=30)
  subprocess.run([str(BIN/'pg_ctl'),'-D',str(data),'-l',str(ROOT/'evidence/postgres.log'),'-o',"-k '"+str(socket_dir)+"' -p 58427 -c listen_addresses='' -c max_connections=12",'-w','start'],check=True,capture_output=True,text=True,timeout=30);started=True
  assert q('create database '+m.DB,'postgres').returncode==0
  ok('comment on database '+m.DB+' is '+lit(m.MARKER))
  ok("create role anon;create role authenticated;create role service_role;create schema auth;create schema storage;create table auth.users(id uuid primary key,is_anonymous boolean not null);create table public.profiles(id uuid primary key references auth.users on delete cascade,deletion_started_at timestamptz);create function public.fixture_profile() returns trigger language plpgsql as $$begin insert into public.profiles(id) values(new.id);return new;end$$;create trigger fixture_profile after insert on auth.users for each row execute function public.fixture_profile();create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,metadata jsonb);alter table storage.objects enable row level security;")
  for migration in sorted((SOURCE/'supabase/migrations').glob('*.sql')):ok(migration.read_text())
  if not no_apply:
   migrations=list((ROOT/'migrations').glob('*.sql'));assert len(migrations)==1,migrations;ok(migrations[0].read_text())
  suite=unittest.defaultTestLoader.loadTestsFromNames(sys.argv[1:] or ['Preview'],module=sys.modules[__name__])
  success=unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful()
  return 0 if success else 1
 finally:
  if started:subprocess.run([str(BIN/'pg_ctl'),'-D',str(data),'-m','fast','-w','stop'],check=True,capture_output=True,text=True,timeout=30)
  shutil.rmtree(data)
  shutil.rmtree(socket_dir)
if __name__=='__main__':sys.exit(main())
