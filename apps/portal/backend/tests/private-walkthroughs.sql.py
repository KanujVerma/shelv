"""Real SQL authorization and immutability checks in a fresh socket-only PostgreSQL fixture.
No hosted database, real identity, named consultation or existing cluster is used.
"""
from pathlib import Path
import copy, hashlib, importlib.util, json, os, sys, time, unittest, uuid
from concurrent.futures import ThreadPoolExecutor
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('private_walkthrough_preview', Path(__file__).with_name('preview.sql.py'))
p = importlib.util.module_from_spec(spec); sys.modules[spec.name] = p; spec.loader.exec_module(p)
ok, q, lit, A, V, N = p.ok, p.q, p.lit, p.A, p.V, p.N
ROOT = Path(__file__).resolve().parents[1]
S = '20000000-0000-4000-8000-000000000001'
C = '20000000-0000-4000-8000-000000000002'
VERSION = '20000000-0000-4000-8000-000000000003'

def jsonsql(value): return lit(json.dumps(value)) + '::jsonb'
def invoke(role, function, argument, actor=A):
    claims = json.dumps({'sub':actor, 'session_id':S, 'role':role, 'user_metadata':{'can_share':True}})
    return q('begin;set local role ' + role + ';set local request.jwt.claim.sub=' + lit(actor) + ';set local request.jwt.claims=' + lit(claims) + ';select public.' + function + '(' + argument + ');commit;')
def call(role, function, argument, actor=A):
    result = invoke(role, function, argument, actor)
    if result.returncode: raise AssertionError(result.stderr)
    rows=[line for line in result.stdout.strip().splitlines() if line.startswith(('{','[','null'))]
    return json.loads(rows[-1]) if rows else None
def command(value, actor=A): return call('authenticated','walkthrough_advisor_command',jsonsql(value),actor)

class PrivateWalkthroughs(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ok((ROOT/'proposals/concierge_maya_contract.sql').read_text())
        ok("create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;")
        ok((ROOT.parent/'session-integration/sql/concierge_advisor_session_context.sql').read_text())
        ok((ROOT/'proposals/private_walkthroughs.sql').read_text())
    def setUp(self):
        ok('truncate walkthroughs.cases cascade')
        p.m.Workflows.setUp(self)
        ok('insert into auth.sessions(id,user_id,not_after) values ('+lit(S)+','+lit(A)+",clock_timestamp()+interval '1 hour')")
        ok('insert into walkthroughs.advisor_grants(user_id,active,can_view,can_share) values ('+lit(A)+',true,true,true),('+lit(V)+',true,true,false)')
        presentation=json.loads((ROOT/'source/tests/fixtures/concierge-presentation.json').read_text())['presentation']
        presentation['title']='Private generic routine'
        self.input={'schemaVersion':1,'case':{'id':C,'title':'Generic consultation','status':'ready','sourceReference':'PRIVATE_SOURCE_CANARY'},'version':{'id':VERSION,'createdAt':'2026-10-01T00:00:00.000Z','presentation':presentation,'stages':[{'id':'begin','title':'Your plan','section':'plan','day':'2026-10-01','body':'Keep the simple routine.','messages':[]}],'provenance':{'rawNotes':'PRIVATE_NOTES_CANARY','founderConfirmation':'Synthetic fixture only'}}}
        self.imported=call('service_role','walkthrough_private_import',jsonsql(self.input))
        self.digest=hashlib.sha256(os.urandom(32)).hexdigest()
    def create(self, **overrides):
        self.create_command={'action':'share_create','caseId':C,'versionId':VERSION,'requestId':str(uuid.uuid4()),'digest':self.digest,**overrides}
        return command(self.create_command)
    def denied(self,role,function,argument,actor=A,code=None):
        result=invoke(role,function,argument,actor);self.assertNotEqual(result.returncode,0,result.stdout)
        if code:self.assertIn(code,result.stderr)
    def test_01_private_by_default_and_no_live_client_or_provenance_projection(self):
        self.assertEqual(ok('select count(*) from walkthroughs.share_grants'),'0')
        self.assertEqual(ok('select count(*) from concierge.enrollments where client_id='+lit(C)),'0')
        self.assertEqual(ok('select count(*) from auth.users where id='+lit(C)),'0')
        self.assertIsNone(call('service_role','walkthrough_capability_read',lit(self.digest)))
        result=command({'action':'open','caseId':C})
        self.assertEqual(set(result['snapshot']),{'schemaVersion','caseId','versionId','presentation','stages'})
        self.assertNotIn('PRIVATE_',json.dumps(result))
        self.assertEqual(command({'action':'library'})['entries'][0]['sourceReference'],'PRIVATE_SOURCE_CANARY')
    def test_02_ordinary_roles_cannot_read_import_or_bypass_tables(self):
        for role in ['anon','authenticated']:
            self.denied(role,'walkthrough_capability_read',lit(self.digest))
            self.denied(role,'walkthrough_private_import',jsonsql(self.input))
            result=q('begin;set local role '+role+';select * from walkthroughs.versions;rollback;');self.assertNotEqual(result.returncode,0)
        self.denied('anon','walkthrough_advisor_command',jsonsql({'action':'library'}))
        self.denied('authenticated','walkthrough_advisor_command',jsonsql({'action':'library'}),N,'forbidden')
    def test_03_live_explicit_grants_and_session_required_on_every_management_read(self):
        command({'action':'library'})
        ok('update walkthroughs.advisor_grants set active=false where user_id='+lit(A))
        self.denied('authenticated','walkthrough_advisor_command',jsonsql({'action':'library'}),code='forbidden')
        ok('update walkthroughs.advisor_grants set active=true where user_id='+lit(A))
        ok('delete from auth.sessions where id='+lit(S))
        self.denied('authenticated','walkthrough_advisor_command',jsonsql({'action':'open','caseId':C}),code='session_ended')
    def test_04_exact_retry_scope_conflict_default_expiry_and_digest_only(self):
        created=self.create();retry=command(self.create_command);self.assertEqual(created,retry)
        self.assertEqual(ok('select count(*) from walkthroughs.share_grants'),'1')
        self.assertEqual(ok("select extract(epoch from expires_at-created_at)::int from walkthroughs.share_grants"),str(30*86400))
        self.assertNotIn(self.digest,json.dumps(created))
        self.denied('authenticated','walkthrough_advisor_command',jsonsql({**self.create_command,'digest':'1'*64}),code='request_conflict')
        self.assertEqual(call('service_role','walkthrough_capability_read',lit(self.digest))['versionId'],VERSION)
    def test_05_old_grants_bind_immutable_version_after_new_content(self):
        self.create();changed=copy.deepcopy(self.input);changed['version']['id']=str(uuid.uuid4());changed['version']['presentation']['title']='A new version'
        call('service_role','walkthrough_private_import',jsonsql(changed))
        self.assertEqual(command({'action':'open','caseId':C})['snapshot']['versionId'],changed['version']['id'])
        self.assertEqual(call('service_role','walkthrough_capability_read',lit(self.digest))['presentation']['title'],'Private generic routine')
        changed['version']['presentation']['title']='Forbidden rewrite'
        self.denied('service_role','walkthrough_private_import',jsonsql(changed),code='immutable_version')
    def test_06_expired_revoked_unknown_reads_all_null_and_revocation_exact_retry(self):
        grant=self.create()['grant'];revoke={'action':'share_revoke','caseId':C,'grantId':grant['id'],'requestId':str(uuid.uuid4())}
        response=command(revoke);self.assertEqual(response,command(revoke));self.assertEqual(response['grant']['status'],'revoked')
        self.assertIsNone(call('service_role','walkthrough_capability_read',lit(self.digest)))
        self.assertIsNone(call('service_role','walkthrough_capability_read',lit('0'*64)))
        self.digest='2'*64;self.create();ok("update walkthroughs.share_grants set created_at=clock_timestamp()-interval '2 days',expires_at=clock_timestamp()-interval '1 day' where secret_digest="+lit(self.digest))
        self.assertIsNone(call('service_role','walkthrough_capability_read',lit(self.digest)))
    def test_07_share_requires_live_publish_and_explicit_share_but_view_still_works(self):
        self.create();ok('update concierge.advisors set can_publish=false where user_id='+lit(A))
        self.assertFalse(command({'action':'library'})['entries'][0]['canShare'])
        command({'action':'open','caseId':C})
        self.denied('authenticated','walkthrough_advisor_command',jsonsql({**self.create_command,'requestId':str(uuid.uuid4()),'digest':'3'*64}),code='forbidden')
        grant=command({'action':'share_list','caseId':C})['grants'][0]
        self.denied('authenticated','walkthrough_advisor_command',jsonsql({'action':'share_revoke','caseId':C,'grantId':grant['id'],'requestId':str(uuid.uuid4())}),code='forbidden')
    def test_08_allowlist_rejects_unapproved_keys_photos_and_corrupt_read(self):
        for mutate in [lambda v:v['version']['presentation'].update(privateNotes='LEAK'),lambda v:v['version']['stages'][0].update(photos=['PRIVATE_PHOTO']),lambda v:v['version']['stages'][0].update(clientId=A)]:
            value=copy.deepcopy(self.input);value['version']['id']=str(uuid.uuid4());mutate(value)
            self.denied('service_role','walkthrough_private_import',jsonsql(value),code='invalid_input')
        self.assertEqual(ok('select count(*) from walkthroughs.versions'),'1')
        self.create();ok('alter table walkthroughs.versions disable trigger versions_immutable')
        ok("update walkthroughs.versions set snapshot=jsonb_set(snapshot,'{privateNotes}','\"LEAK\"'::jsonb)")
        self.denied('service_role','walkthrough_capability_read',lit(self.digest),code='invalid_input')
        ok('alter table walkthroughs.versions enable trigger versions_immutable')
    def test_09_no_table_grants_or_public_definer_wrappers(self):
        self.assertEqual(ok("select count(*) from pg_policies where schemaname='walkthroughs'"),'0')
        self.assertEqual(ok("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'walkthrough_%' and p.prosecdef"),'0')
        self.assertEqual(ok("select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='walkthroughs' and c.relkind='r'"),'t')
    def seed_grants(self,count,revoked=False):
        # Explicit admin-only legacy fixture, including timestamp collisions below response precision.
        ok("insert into walkthroughs.share_grants(case_id,version_id,secret_digest,created_by,created_at,expires_at,revoked_at) select "+lit(C)+","+lit(VERSION)+",md5(i::text)||md5((i+10000)::text),"+lit(A)+",date_trunc('milliseconds',clock_timestamp())+interval '100 microseconds',clock_timestamp()+interval '720 hours',"+("clock_timestamp()" if revoked else "null")+" from generate_series(1,"+str(count)+") i")
    def test_10_active_cap_serializes_concurrent_boundary_and_revoke_frees_slot(self):
        first=self.create();first_command=copy.deepcopy(self.create_command);self.seed_grants(98)
        commands=[{**first_command,'requestId':str(uuid.uuid4()),'digest':hashlib.sha256(os.urandom(32)).hexdigest()} for _ in range(2)]
        # Hold the exact per-case cap fence and observe both independent creates
        # queued before releasing it. This proves overlap rather than relying on timing.
        app='walkthrough-cap-boundary-'+str(uuid.uuid4())
        blocker=p.subprocess.Popen([str(p.BIN/'psql'),'-X',*p.m.CONNECTION,'-d',p.m.DB,'-At','-v','ON_ERROR_STOP=1'],env={**p.m.ENV,'PGAPPNAME':app},stdin=p.subprocess.PIPE,stdout=p.subprocess.DEVNULL,stderr=p.subprocess.PIPE,text=True)
        pool=ThreadPoolExecutor(max_workers=2)
        try:
            blocker.stdin.write("begin;select pg_advisory_xact_lock(hashtextextended('walkthroughs:active-grants:"+C+"',0));\n");blocker.stdin.flush()
            deadline=time.monotonic()+5
            while ok("select exists(select 1 from pg_locks l join pg_stat_activity a on a.pid=l.pid where a.application_name="+lit(app)+" and l.locktype='advisory' and l.granted)")!='t':
                self.assertLess(time.monotonic(),deadline,'cap blocker must acquire lock');time.sleep(.01)
            futures=[pool.submit(invoke,'authenticated','walkthrough_advisor_command',jsonsql(value)) for value in commands]
            deadline=time.monotonic()+5
            while ok("select count(*) from pg_stat_activity where wait_event='advisory' and query like '%public.walkthrough_advisor_command%'")!='2':
                self.assertLess(time.monotonic(),deadline,'both creates must overlap at the cap fence');time.sleep(.01)
            blocker.stdin.write('commit;\n');blocker.stdin.close();blocker.stdin=None;blocker.wait(timeout=5)
            results=[future.result(timeout=10) for future in futures]
        finally:
            if blocker.poll() is None:blocker.terminate()
            blocker.wait(timeout=5)
            if blocker.stdin is not None:blocker.stdin.close()
            if blocker.stderr is not None:blocker.stderr.close()
            pool.shutdown(wait=True,cancel_futures=True)
        self.assertEqual(sum(r.returncode==0 for r in results),1)
        self.assertEqual(sum('share_limit_reached' in r.stderr for r in results),1)
        self.assertEqual(ok('select count(*) from walkthroughs.share_grants where revoked_at is null'),'100')
        self.assertEqual(command(first_command),first)
        rejected=commands[next(i for i,r in enumerate(results) if r.returncode)]
        self.denied('authenticated','walkthrough_advisor_command',jsonsql(rejected),code='share_limit_reached')
        command({'action':'share_revoke','caseId':C,'grantId':first['grant']['id'],'requestId':str(uuid.uuid4())})
        self.assertEqual(command(rejected)['grant']['status'],'active')
        self.assertEqual(ok('select count(*) from walkthroughs.share_grants where revoked_at is null'),'100')
    def test_11_old_active_link_is_listed_before_more_than_200_newer_inactive_grants(self):
        first=self.create();self.seed_grants(201,revoked=True)
        listed=command({'action':'share_list','caseId':C});self.assertEqual(len(listed['grants']),200)
        self.assertEqual(listed['grants'][0]['id'],first['grant']['id']);self.assertEqual(listed['nextCursor']['phase'],'inactive')
        self.assertEqual(call('service_role','walkthrough_capability_read',lit(self.digest))['caseId'],C)
        command({'action':'share_revoke','caseId':C,'grantId':first['grant']['id'],'requestId':str(uuid.uuid4())})
        self.assertIsNone(call('service_role','walkthrough_capability_read',lit(self.digest)))
    def test_12_pre_cap_active_overflow_has_complete_keyset_management_pages(self):
        first=self.create();self.seed_grants(201)
        page1=command({'action':'share_list','caseId':C});self.assertEqual(len(page1['grants']),200);self.assertEqual(page1['nextCursor']['phase'],'active')
        page2=command({'action':'share_list','caseId':C,'cursor':page1['nextCursor']});self.assertEqual(len(page2['grants']),2);self.assertIsNone(page2['nextCursor'])
        grants=page1['grants']+page2['grants'];self.assertEqual(len({g['id'] for g in grants}),202);self.assertIn(first['grant']['id'],[g['id'] for g in grants])
        self.denied('authenticated','walkthrough_advisor_command',jsonsql({**self.create_command,'requestId':str(uuid.uuid4()),'digest':'f'*64}),code='share_limit_reached')
        command({'action':'share_revoke','caseId':C,'grantId':first['grant']['id'],'requestId':str(uuid.uuid4())})
        self.assertIsNone(call('service_role','walkthrough_capability_read',lit(self.digest)))

p.PrivateWalkthroughs=PrivateWalkthroughs
if __name__=='__main__':
    if len(sys.argv)==1:sys.argv.append('PrivateWalkthroughs')
    sys.exit(p.main())
