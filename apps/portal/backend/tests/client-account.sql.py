"""Own display-name projection through the existing authorized read, isolated PostgreSQL only."""
from pathlib import Path
import importlib.util,sys,json
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('account_preview',HERE/'preview.sql.py');p=importlib.util.module_from_spec(spec);sys.modules[spec.name]=p;spec.loader.exec_module(p)
MIGRATION=HERE.parents[3]/'supabase/migrations/20261026185922_concierge_client_account_display_name.sql'
class Account(p.Preview):
 def setUp(self):
  super().setUp();p.ok(MIGRATION.read_text())
 def test_account_own_name_without_plan_or_payment_and_no_other_fields(self):
  p.ok("update concierge.enrollments set display_name='Canonical owner name' where client_id="+p.lit(p.C))
  result=p.call(p.C,'concierge_client_view_v2',[])
  self.assertEqual(result['account'],{'displayName':'Canonical owner name'})
  self.assertIsNone(result['plan']);self.assertNotIn('PRIVATE_',json.dumps(result))
 def test_account_other_owner_reads_only_their_own_name(self):
  for actor,name in [(p.C,'First owner'),(p.D,'Second owner')]:p.ok('update concierge.enrollments set display_name='+p.lit(name)+' where client_id='+p.lit(actor))
  self.assertEqual(p.call(p.C,'concierge_client_view_v2',[])['account'],{'displayName':'First owner'})
  self.assertEqual(p.call(p.D,'concierge_client_view_v2',[])['account'],{'displayName':'Second owner'})
 def test_account_revocation_anonymous_deletion_and_no_argument_fail_closed(self):
  p.ok("update concierge.enrollments set status='revoked' where client_id="+p.lit(p.C));self.assertNotEqual(p.m.invoke(p.C,'concierge_client_view_v2',[]).returncode,0)
  p.ok("update concierge.enrollments set status='active' where client_id="+p.lit(p.C));p.ok('update auth.users set is_anonymous=true where id='+p.lit(p.C));self.assertNotEqual(p.m.invoke(p.C,'concierge_client_view_v2',[]).returncode,0)
  p.ok('update auth.users set is_anonymous=false where id='+p.lit(p.C));p.ok('update public.profiles set deletion_started_at=now() where id='+p.lit(p.C));self.assertNotEqual(p.m.invoke(p.C,'concierge_client_view_v2',[]).returncode,0)
  self.assertNotEqual(p.m.invoke(p.D,'concierge_client_view_v2',[p.lit(p.C)]).returncode,0)
 def test_account_preserves_function_acl_and_definer_search_path(self):
  self.assertEqual(p.ok("select prosecdef and proconfig=array['search_path=\"\"'] from pg_proc where oid='public.concierge_client_view_v2()'::regprocedure"),'t')
  self.assertEqual(p.ok("select has_function_privilege('authenticated','public.concierge_client_view_v2()','execute') and not has_function_privilege('anon','public.concierge_client_view_v2()','execute') and not has_function_privilege('service_role','public.concierge_client_view_v2()','execute')"),'t')
if __name__=='__main__':
 p.Account=Account
 names=[name for name in Account.__dict__ if name.startswith('test_account_')]
 sys.argv=[sys.argv[0]]+['Account.'+name for name in names]
 sys.exit(p.main())
