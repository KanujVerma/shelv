"""Context-only candidate tests in the existing task-owned disposable PostgreSQL harness."""
from pathlib import Path
import importlib.util,json,sys,unittest
ROOT=Path(__file__).resolve().parents[1]
source=ROOT.parent/'backend/tests/preview.sql.py'
spec=importlib.util.spec_from_file_location('preview',source);runner=importlib.util.module_from_spec(spec);sys.modules['preview']=runner;spec.loader.exec_module(runner)
m=runner.m;Base=runner.Preview
MUTATE='--mutate-owner-check' in sys.argv
if MUTATE:sys.argv.remove('--mutate-owner-check')
WITHOUT='--without-context' in sys.argv
if WITHOUT:sys.argv.remove('--without-context')
SESSION='20000000-0000-4000-8000-000000000001'
class Context(unittest.TestCase):
 def setUp(self):
  m.ok("create table if not exists auth.sessions(id uuid primary key,user_id uuid not null references auth.users on delete cascade,not_after timestamptz);create or replace function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;")
  m.Workflows.setUp(self)
  m.ok('insert into auth.sessions values('+m.lit(SESSION)+','+m.lit(m.A)+",now()+interval '1 hour')")
  if not WITHOUT:
   sql=(ROOT/'sql/concierge_advisor_session_context.sql').read_text().replace('create function public.','create or replace function public.',1)
   if MUTATE:sql=sql.replace('and user_id=owner_id','')
   m.ok(sql)
 def invoke(self,actor=None,session=SESSION,role='authenticated'):
  actor=m.A if actor is None else actor
  return m.q('begin;set local role '+role+';set local request.jwt.claim.sub='+m.lit(actor)+';set local request.jwt.claims='+m.lit(json.dumps({'session_id':session}))+';select public.concierge_advisor_session_context();rollback;')
 def view(self,**kw):
  r=self.invoke(**kw);self.assertEqual(r.returncode,0,r.stderr);return json.loads(next(x for x in r.stdout.splitlines() if x.startswith('{')))
 def denied(self,code,**kw):
  actor=kw.get('actor',m.A);session=kw.get('session',SESSION)
  sql='begin;set local role authenticated;set local request.jwt.claim.sub='+m.lit(actor)+';set local request.jwt.claims='+m.lit(json.dumps({'session_id':session}))+";do $$begin perform public.concierge_advisor_session_context();raise exception 'not_rejected';exception when sqlstate '"+code+"' then null;end$$;rollback;"
  r=m.q(sql);self.assertEqual(r.returncode,0,r.stderr)
 def test_01_exact_public_shape(self):
  view=self.view();self.assertEqual(set(view),{'ownerId','providerSessionId','role','sessionNotAfter','capabilities'});self.assertEqual(view['ownerId'],m.A);self.assertEqual(view['providerSessionId'],SESSION);self.assertEqual(view['role'],'advisor');self.assertIsInstance(view['sessionNotAfter'],str);self.assertEqual(view['capabilities'],{'view':True,'edit':True,'publish':True,'confirmPayments':True})
 def test_02_view_only_capabilities(self):
  m.ok('update auth.sessions set user_id='+m.lit(m.V));self.assertEqual(self.view(actor=m.V)['capabilities'],{'view':True,'edit':False,'publish':False,'confirmPayments':False})
 def test_03_missing_or_malformed_session(self):
  for value in [None,'','invalid','20000000-0000-4000-8000-000000000099']:self.denied('PT401',session=value)
 def test_04_deleted_expired_or_other_owner_session(self):
  for update in ["update auth.sessions set not_after=now()-interval '1 second'",'update auth.sessions set user_id='+m.lit(m.C),'delete from auth.sessions']:
   m.ok('truncate auth.sessions;insert into auth.sessions values('+m.lit(SESSION)+','+m.lit(m.A)+",now()+interval '1 hour')")
   m.ok(update);self.denied('PT401')
 def test_05_null_timebox_allows_existing_owned_session(self):
  m.ok('update auth.sessions set not_after=null');self.assertEqual(self.view()['ownerId'],m.A);self.assertIsNone(self.view()['sessionNotAfter'])
 def test_06_live_advisor_revocation(self):
  for field in ['active','can_view']:
   m.ok('update concierge.advisors set '+field+'=false where user_id='+m.lit(m.A));self.denied('PT403');m.ok('update concierge.advisors set '+field+'=true where user_id='+m.lit(m.A))
 def test_07_profile_deletion_and_anonymous_actor(self):
  m.ok('update public.profiles set deletion_started_at=now() where id='+m.lit(m.A));self.denied('PT403');m.ok('update public.profiles set deletion_started_at=null where id='+m.lit(m.A));m.ok('update auth.users set is_anonymous=true where id='+m.lit(m.A));self.denied('PT403')
 def test_08_client_and_missing_actor(self):self.denied('PT403',actor=m.C);self.denied('PT401',actor='')
 def test_09_acl(self):
  for role in ['anon','service_role']:self.assertNotEqual(self.invoke(role=role).returncode,0)
  self.assertEqual(m.ok("select prosecdef and proconfig=ARRAY['search_path=\"\"'] from pg_proc where oid='public.concierge_advisor_session_context()'::regprocedure"),'t')
 def test_10_does_not_modify_session_or_grant(self):
  before=m.ok("select md5(row_to_json(s)::text) from auth.sessions s");self.view();self.assertEqual(before,m.ok("select md5(row_to_json(s)::text) from auth.sessions s"))
runner.Context=Context
if __name__=='__main__':
 sys.argv=[str(source),'Context'];sys.exit(runner.main())
