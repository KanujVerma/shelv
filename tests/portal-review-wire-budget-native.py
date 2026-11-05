"""M59 own-Unix-PG wire-budget regression. Synthetic identity, no genuine Auth claim."""
from pathlib import Path
import concurrent.futures,copy,hashlib,importlib.util,json,subprocess,sys,time,unittest,uuid
spec=importlib.util.spec_from_file_location('wire_review_native',Path(__file__).with_name('portal-review-native.py'));n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n)
M59=n.ROOT/'supabase/migrations/20261031132531_portal_rebuild_plan_wire_budget_v1.sql'
OLD='pg_column_size(p_command)>500000';NEW='concierge.plan_wire_budget_bytes_v1(p_command)>500000'
BODY_HASH='4be414067afedcf3456ae79523c69aaef25a964bddba0f9544836d3fff7552fa'
SIZE=lambda x:len(json.dumps(x,separators=(',',':'),ensure_ascii=False).encode())
def snapshot():return json.loads(n.q("select jsonb_build_object('oid',p.oid,'owner',p.proowner::regrole::text,'acl',p.proacl,'config',p.proconfig,'securityDefiner',p.prosecdef,'volatility',p.provolatile,'strict',p.proisstrict,'parallel',p.proparallel,'body',p.prosrc) from pg_proc p where p.oid='concierge.plan_command_base_v1(jsonb)'::regprocedure"))
def apply():
 before=snapshot();assert hashlib.sha256(before['body'].encode()).hexdigest()==BODY_HASH
 tables=n.q("select tablename from pg_tables where schemaname='concierge' order by tablename").splitlines()
 ident=lambda value:'"'+value.replace('"','""')+'"'
 rows_sql="select jsonb_object_agg(name,rows)::text from ("+' union all '.join("select "+n.lit(t)+" name,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') rows from concierge."+ident(t)+' x' for t in tables)+") z"
 before_rows=n.q(rows_sql)
 (n.E/'m59-identity-before.json').write_text(json.dumps(before,indent=2));assert M59.stat().st_size>0,'M59 not implemented';n.q(M59.read_text());after=snapshot();(n.E/'m59-identity-after.json').write_text(json.dumps(after,indent=2))
 after_rows=n.q(rows_sql);assert before_rows==after_rows,'M59 mutated canonical rows'
 (n.E/'m59-data-preservation.json').write_text(json.dumps(dict(tableCount=len(tables),equal=True,beforeSha256=hashlib.sha256(before_rows.encode()).hexdigest(),afterSha256=hashlib.sha256(after_rows.encode()).hexdigest()),indent=2))
 assert {k:v for k,v in before.items() if k!='body'}=={k:v for k,v in after.items() if k!='body'}
 assert before['body'].replace(OLD,'')==after['body'].replace(NEW,'')
original_prepare=n.prepare
def prepare():original_prepare();apply()
# Retained source tests that deliberately recreate this OWN database must replay M59 too.
n.prepare=prepare
class WireTests(unittest.TestCase):
 setUp=n.ReviewTests.setUp
 def tearDown(self):n.backup('wire-'+self._testMethodName)
 def ok(self,r):self.assertEqual(r['status'],200,r);return r['body']
 def plan(self,action,actor=n.A,**fields):return n.edge(actor,action,'plan',**fields)
 def command(self,summary=None):
  d=self.ok(self.plan('create_draft_v1',requestId=str(uuid.uuid4()),kind='care_plan',templateVersionId=None))['draft'];body=n.content()
  if summary is not None:body['summary']=summary
  c=dict(schemaVersion=1,action='save_draft_v1',requestId=str(uuid.uuid4()),draftId=d['id'],expectedContentRevision=0,expectedAssignmentRevision=0,kind='care_plan',content=body)
  while SIZE(c)<500000:
   s=dict(title='synthetic padding',body='');body['consultationSections'].append(s);gap=500000-SIZE(c);self.assertGreaterEqual(gap,0);fill=min(16000,gap);s['body']='🧴'*(fill//4)+['','x','é','☀'][fill%4]
  self.assertEqual(SIZE(c),500000);self.assertLessEqual(len(body['consultationSections']),50);self.assertTrue(all(len(s['body'])<=4000 for s in body['consultationSections']));return c
 def send(self,c,actor=n.A):return self.plan(c['action'],actor,**{k:v for k,v in c.items() if k not in ('schemaVersion','action')})
 def direct(self,c):return n.raw(n.w.session(n.A)+'select public.concierge_plan_command_v1('+n.lit(json.dumps(c,ensure_ascii=False))+'::jsonb);commit;')
 def test_01_actual_handler_sql_exact_500000_saves_and_retries_original_after_new_revision(self):
  c=self.command();saved=self.ok(self.send(c));self.assertEqual(saved['draft']['contentRevision'],1);self.assertEqual(saved['draft']['content'],c['content'])
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:retries=list(pool.map(lambda _:self.send(c),range(2)))
  self.assertTrue(all(x['status']==200 for x in retries),retries);self.assertTrue(all(x['body']==saved for x in retries));self.assertEqual(n.q('select content_revision from concierge.plan_drafts where id='+n.lit(c['draftId'])),'1')
  later=self.ok(self.plan('save_draft_v1',requestId=str(uuid.uuid4()),draftId=c['draftId'],expectedContentRevision=1,expectedAssignmentRevision=0,kind='care_plan',content=n.content()));self.assertEqual(later['draft']['contentRevision'],2);self.assertEqual(self.ok(self.send(c)),saved);self.assertEqual(self.ok(self.plan('request_status_v1',requestId=c['requestId'])),dict(status='committed',receipt=saved))
  changed=copy.deepcopy(c);changed['content']['title']='gentle carf';self.assertEqual(SIZE(changed),500000);self.assertEqual(self.send(changed)['status'],409)
 def test_02_500001_http_and_direct_sql_reject_without_journal_or_write(self):
  c=self.command();c['content']['consultationSections'][-1]['body']+='x';self.assertEqual(SIZE(c),500001);r=self.send(c);self.assertEqual(r['status'],413);self.assertEqual(r['body']['code'],'too_large');direct=self.direct(c);self.assertNotEqual(direct.returncode,0);self.assertIn('concierge_invalid_input',direct.stderr);self.assertEqual(n.q('select content_revision from concierge.plan_drafts where id='+n.lit(c['draftId'])),'0');self.assertEqual(n.q('select count(*) from concierge.plan_requests where request_id='+n.lit(c['requestId'])),'0')
 def test_03_exact_utf8_quotes_backslash_controls_and_numeric_forms(self):
  text='quote " slash / backslash \\ controls \b\f\r\n\t\u0001 emoji 🧴 separators \u2028\u2029  inner  spaces '
  c=self.command(text);self.assertEqual(self.ok(self.send(c))['draft']['content']['summary'],text)
  raw=n.raw(n.w.session(n.A)+"select public.concierge_plan_command_v1('{\"schemaVersion\":1.00000,\"action\":\"read_policy_v1\"}'::jsonb);commit;");self.assertEqual(raw.returncode,0,raw.stderr)
 def test_04_fractional_unsafe_unknown_deep_and_malformed_are_finite_rejections(self):
  c=self.command()
  for delta in [dict(expectedContentRevision=.5),dict(expectedContentRevision=9007199254740992),dict(action='execute_sql'),dict(role='owner')]:
   bad={**c,**delta};r=self.send(bad);self.assertIn(r['status'],[400,413]);direct=self.direct(bad);self.assertNotEqual(direct.returncode,0);self.assertIn('concierge_invalid_input',direct.stderr)
  small=dict(schemaVersion=1,action='read_policy_v1');deep=0
  for _ in range(100):deep=[deep]
  direct=self.direct({**small,'extra':deep});self.assertNotEqual(direct.returncode,0);self.assertIn('concierge_invalid_input',direct.stderr)
  code="import {handlePlanRequest} from './supabase/functions/concierge-plans/handler.ts';globalThis.fetch=async()=>{throw Error('network_denied')};const r=await handlePlanRequest(new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:'{\"schemaVersion\":1,'}),{allowedOrigins:[],authenticate:async()=>({id:'"+n.A+"',is_anonymous:false}),rpc:async()=>{throw Error('unexpected_rpc')}});console.log(JSON.stringify({status:r.status,body:await r.json()}));"
  r=subprocess.run([n.NODE,'--experimental-strip-types','--input-type=module','-e',code],cwd=n.ROOT,env=n.ENV,capture_output=True,text=True,check=True);self.assertEqual(json.loads(r.stdout),dict(status=400,body=dict(code='invalid_input')))
  malformed=n.raw("select public.concierge_plan_command_v1('{broken'::jsonb)");self.assertNotEqual(malformed.returncode,0);self.assertIn('invalid input syntax for type json',malformed.stderr)
 def test_05_compressed_3m_representation_rejects_before_any_plan_mutation(self):
  c=self.command();small=copy.deepcopy(c);small['content']['consultationSections']=[]
  sql="create temporary table wire_budget_compressed(v jsonb);insert into wire_budget_compressed values(jsonb_set("+n.lit(json.dumps(small))+"::jsonb,'{content,summary}',to_jsonb(repeat('x',3000000))));select jsonb_build_object('stored',pg_column_size(v),'rendered',octet_length(v::text),'compression',pg_column_compression(v)) from wire_budget_compressed;select concierge.plan_wire_budget_bytes_v1(v) from wire_budget_compressed;"
  r=n.raw(sql);self.assertNotEqual(r.returncode,0);self.assertIn('concierge_invalid_input',r.stderr);row=json.loads(next(x for x in r.stdout.splitlines() if x.startswith('{')));self.assertLess(row['stored'],1000000);self.assertGreater(row['rendered'],3000000);self.assertIsNotNone(row['compression']);self.assertEqual(n.q('select content_revision from concierge.plan_drafts where id='+n.lit(c['draftId'])),'0')
 def test_06_existing_edit_and_current_session_authority_still_required(self):
  c=self.command();n.q('update concierge.advisors set can_edit=false where user_id='+n.lit(n.S));self.assertEqual(self.send(c,n.S)['status'],403);n.q('update auth.sessions set not_after=clock_timestamp()-interval \'1 second\' where id='+n.lit(n.A));self.assertEqual(self.send(c)['status'],401);self.assertEqual(n.q('select content_revision from concierge.plan_drafts where id='+n.lit(c['draftId'])),'0')
 def test_07_concurrent_exact_and_competing_large_writes_preserve_once_and_cas(self):
  c=self.command()
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:r=list(pool.map(lambda _:self.send(c),range(2)))
  self.assertTrue(all(x['status']==200 for x in r),r);self.assertEqual(r[0],r[1]);self.assertEqual(n.q('select content_revision from concierge.plan_drafts where id='+n.lit(c['draftId'])),'1')
  d=self.command();other=copy.deepcopy(d);other['requestId']=str(uuid.uuid4());other['content']['title']='gentle carf'
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:r=list(pool.map(self.send,[d,other]))
  self.assertEqual(sorted(x['status'] for x in r),[200,409]);self.assertEqual(n.q('select content_revision from concierge.plan_drafts where id='+n.lit(d['draftId'])),'1')
 def test_08_exact_source_identity_acl_and_every_other_body_byte_preserved(self):
  before=json.loads((n.E/'m59-identity-before.json').read_text());after=snapshot();self.assertEqual({k:v for k,v in before.items() if k!='body'},{k:v for k,v in after.items() if k!='body'});self.assertEqual(before['body'].replace(OLD,''),after['body'].replace(NEW,''));self.assertEqual(hashlib.sha256(before['body'].encode()).hexdigest(),BODY_HASH)
  for name in ['plan_wire_count_v1(jsonb,integer)','plan_wire_budget_bytes_v1(jsonb)']:
   for role in ['anon','authenticated','service_role']:self.assertEqual(n.q("select has_function_privilege("+n.lit(role)+','+n.lit('concierge.'+name)+",'execute')"),'f')
  self.assertEqual(n.q('select count(*) from jsonb_object_keys(concierge.plan_command_fields())'),'26');self.assertEqual(n.q('select count(*) from jsonb_object_keys(concierge.care_command_fields())'),'13')
 def test_09_after_draft_wait_natural_expiry_then_same_uuid_recovery(self):
  c=self.command();m=n.guard();locker=subprocess.Popen([str(n.PG/'psql'),'-X','-w','-h',m['socket'],'-p',n.PORT,'-U','postgres','-d',n.DB,'-At','-v','ON_ERROR_STOP=1'],env={**n.ENV,'PGPASSFILE':m['socket']+'/no-password'},text=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  try:
   locker.stdin.write('begin;select id from concierge.plan_drafts where id='+n.lit(c['draftId'])+" for update;select 'LOCKED';\n");locker.stdin.flush()
   for _ in range(4):
    if locker.stdout.readline().strip()=='LOCKED':break
   n.q('update auth.sessions set not_after=clock_timestamp()+interval \'2 seconds\' where id='+n.lit(n.A))
   with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    future=pool.submit(self.send,c);blocked=False
    for _ in range(100):
     if n.q("select exists(select 1 from pg_stat_activity where pid<>pg_backend_pid() and wait_event_type='Lock' and query like '%"+c['requestId']+"%')")=='t':blocked=True;break
     time.sleep(.01)
    self.assertTrue(blocked);time.sleep(2.2);locker.stdin.write('commit;\n');locker.stdin.close();r=future.result(timeout=15);self.assertEqual(r['status'],401)
  finally:
   if locker.stdin and not locker.stdin.closed:locker.stdin.close()
   locker.wait(timeout=10);locker.stdout.close();locker.stderr.close()
  self.assertEqual(n.q('select content_revision from concierge.plan_drafts where id='+n.lit(c['draftId'])),'0');self.assertEqual(n.q('select count(*) from concierge.plan_requests where request_id='+n.lit(c['requestId'])),'0');n.q('update auth.sessions set not_after=null where id='+n.lit(n.A));self.assertEqual(self.ok(self.send(c))['draft']['contentRevision'],1)
if __name__=='__main__':
 if '--prepare' in sys.argv:prepare()
 elif '--apply' in sys.argv:apply()
 elif '--retained' in sys.argv:n.guard();unittest.main(module=n,argv=[sys.argv[0]])
 else:n.guard();unittest.main()
