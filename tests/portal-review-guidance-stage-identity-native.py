"""RG5 stage identities: actual own handlers/fixed RPCs, synthetic Auth only."""
from pathlib import Path
import importlib.util,json,uuid,unittest,copy,hashlib,sys
s=importlib.util.spec_from_file_location('stage_fix',Path(__file__).with_name('portal-review-guidance-fixes-native.py'));f=importlib.util.module_from_spec(s);s.loader.exec_module(f);n=f.n
M61=n.ROOT/'supabase/migrations/20261031161130_portal_rebuild_guidance_schedule_identity_v1.sql'
SIGNATURES=['concierge.review_guidance_body_check(uuid,jsonb)','concierge.review_guidance_issues(uuid,jsonb,jsonb,jsonb,boolean)','concierge.review_guidance_draft_view(concierge.review_guidance_drafts)','concierge.review_request_authorize(concierge.review_requests)']
def function_snapshot():
 return [json.loads(n.q("select jsonb_build_object('signature',p.oid::regprocedure::text,'oid',p.oid,'owner',p.proowner::regrole::text,'acl',p.proacl,'config',p.proconfig,'definer',p.prosecdef,'volatility',p.provolatile,'strict',p.proisstrict,'parallel',p.proparallel,'body',p.prosrc,'allAttributes',to_jsonb(p)-'prosrc') from pg_proc p where p.oid="+n.lit(sig)+'::regprocedure')) for sig in SIGNATURES]
def apply():
 before=function_snapshot();tables=n.q("select tablename from pg_tables where schemaname='concierge' order by tablename").splitlines()
 rows_sql="select jsonb_object_agg(name,rows)::text from ("+' union all '.join("select "+n.lit(t)+" name,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') rows from concierge.\""+t+'\" x' for t in tables)+") z"
 rows=n.q(rows_sql);base=json.loads(n.q("select to_json(prosrc) from pg_proc where oid='concierge.plan_command_base_v1(jsonb)'::regprocedure"));assert hashlib.sha256(base.encode()).hexdigest()=='e1309a1f3e1fad3a952fe6a0786956d6237b2446bb37a5105ba03dbd42d29aa6'
 n.q(M61.read_text());after=function_snapshot();assert n.q(rows_sql)==rows,'M61 changed rows';assert json.loads(n.q("select to_json(prosrc) from pg_proc where oid='concierge.plan_command_base_v1(jsonb)'::regprocedure"))==base
 assert [{k:v for k,v in x.items() if k!='body'} for x in before]==[{k:v for k,v in x.items() if k!='body'} for x in after],'M61 changed function metadata'
 audit=n.E/'m61-application-audits'/uuid.uuid4().hex;audit.mkdir(parents=True);(audit/'before.json').write_text(json.dumps(before,indent=2));(audit/'after.json').write_text(json.dumps(after,indent=2));(audit/'rows.json').write_text(json.dumps(dict(tableCount=len(tables),equal=True,allColumns=True,sha256=hashlib.sha256(rows.encode()).hexdigest()),indent=2))
 (n.E/'m61-functions-before.json').write_text(json.dumps(before,indent=2));(n.E/'m61-functions-after.json').write_text(json.dumps(after,indent=2));(n.E/'m61-data-preservation.json').write_text(json.dumps(dict(tableCount=len(tables),equal=True,allColumns=True,sha256=hashlib.sha256(rows.encode()).hexdigest(),m59BaseUnchanged=True),indent=2))
apply60=f.apply
def prepare60():f.wire.prepare();apply60()
def apply60and61():apply60();apply()
def prepare():prepare60();apply()
n.prepare=prepare
f.apply=apply60and61
class StageIdentity(n.ReviewTests):
 def test_a01_duplicate_schedule_stage_ids_must_not_commit_unreadable_instruction(self):
  self.routine_publish();b=self.instruction_body();stage=dict(id='same-stage',directions='use a small amount',minimumDaysFromActualStart=None,proceedOnlyWhen='comfortable');b['schedule']['stages']=[stage,{**stage,'directions':'use only if comfortable'}]
  request=str(uuid.uuid4());cmd=dict(schemaVersion=1,action='create_guidance_draft_v1',requestId=request,clientId=n.C,body=b);handler=self.g('create_guidance_draft_v1',requestId=request,clientId=n.C,body=b)
  direct=n.raw(n.w.session(n.A)+'select public.concierge_guidance_command_v1('+n.lit(json.dumps(cmd))+'::jsonb);commit;')
  result=dict(input=cmd,handler=handler,directExit=direct.returncode,directError=direct.stderr)
  if direct.returncode==0:
   saved=json.loads(next(x for x in direct.stdout.split('\n') if x.startswith('{')));target=saved['draft']['target'];review=self.g('review_guidance_v1',requestId=str(uuid.uuid4()),target=target);approval=self.g('approve_guidance_v1',requestId=str(uuid.uuid4()),target=target,publisher=dict(kind='human',actorId=n.A),scope='instruction.publish');result.update(target=target,review=review,approval=approval)
   if approval['status']==200:
    pub=self.g('publish_guidance_v1',requestId=str(uuid.uuid4()),target=target,approvalId=approval['body']['approval']['id'],publisher=dict(kind='human',actorId=n.A));result['publish']=pub
    if pub['status']==200:
     v=self.ok(n.edge(n.C,'read_client_plan_v3',version=1));snap=v['currentGuidance']['snapshot'];page=self.ok(n.edge(n.C,'read_client_instruction_manifest_v1',snapshot=snap,cursor=None,limit=100));item=page['items'][0];result['detail']=n.edge(n.C,'read_client_instruction_v1',snapshot=snap,instructionId=item['instructionId'],version=item['version'],contentHash=item['contentHash']);result['history']=n.edge(n.C,'read_care_history_v1',cursor=None,limit=100,version=None);result['outputs']=n.q('select count(*) from concierge.review_guidance_outputs');result['publishedBody']=json.loads(n.q('select body from concierge.review_guidance_outputs'))
  (n.E/'m61-original-duplicate-stages.json').write_text(json.dumps(result,indent=2));print('a01',json.dumps({k:v for k,v in result.items() if k not in ['input','publishedBody']}),flush=True)
  self.assertNotEqual(direct.returncode,0,'fixed authenticated Guidance RPC must reject duplicate stage IDs before persisting an unreadable instruction')
 def test_a02_unique_schedule_stages_are_readable_control(self):
  self.routine_publish();b=self.instruction_body();stage=dict(id='first',directions='use a small amount',minimumDaysFromActualStart=None,proceedOnlyWhen='comfortable');b['schedule']['stages']=[stage,{**stage,'id':'second'}];receipt=self.publish_guidance(b);history=self.ok(n.edge(n.C,'read_care_history_v1',cursor=None,limit=100,version=None));self.assertEqual(next(x['guidance']['body'] for x in history['entries'] if x['kind']=='guidance'),b)
  v=self.ok(n.edge(n.C,'read_client_plan_v3',version=1));snap=v['currentGuidance']['snapshot'];p=self.ok(n.edge(n.C,'read_client_instruction_manifest_v1',snapshot=snap,cursor=None,limit=100));i=p['items'][0];detail=self.ok(n.edge(n.C,'read_client_instruction_v1',snapshot=snap,instructionId=i['instructionId'],version=i['version'],contentHash=i['contentHash']));self.assertEqual(detail['content']['body'],b);(n.E/'m61-original-unique-stages.json').write_text(json.dumps(dict(history=200,detail=200,receipt=receipt),indent=2))

 def direct(self,command,actor=None):
  r=n.raw(n.w.session(actor or n.A)+'select public.concierge_guidance_command_v1('+n.lit(json.dumps(command))+'::jsonb);commit;')
  return r
 def command(self,action,**fields):return dict(schemaVersion=1,action=action,requestId=str(uuid.uuid4()),**fields)
 def stages(self,ids):
  b=self.instruction_body();b['schedule']['stages']=[dict(id=i,directions='same valid directions',minimumDaysFromActualStart=None,proceedOnlyWhen='comfortable') for i in ids];return b
 def counts(self):
  tables=['review_guidance_drafts','review_guidance_revisions','review_guidance_reviews','review_guidance_approvals','review_guidance_outputs','review_guidance_receipts','review_requests','plan_events','plan_deliveries','instruction_drafts','instruction_publications','activations','service_periods','publications']
  return {t:n.q('select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),\'[]\') from concierge.'+t+' x') for t in tables}
 def test_b01_save_duplicate_rejected_without_revision_or_request_and_cas_recovery(self):
  self.routine_publish();b=self.stages(['One','one']);draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=n.C,body=b))['draft'];bad=copy.deepcopy(b);bad['schedule']['stages'][1]['id']='One';cmd=self.command('save_guidance_draft_v1',target=draft['target'],body=bad);before=self.counts()
  self.assertEqual(self.g(cmd['action'],**{k:v for k,v in cmd.items() if k not in ['schemaVersion','action']})['status'],400);direct=self.direct(cmd);self.assertNotEqual(direct.returncode,0);self.assertIn('concierge_invalid_input',direct.stderr);self.assertEqual(self.counts(),before);self.assertEqual(self.ok(self.g('request_status_v1',requestId=cmd['requestId'])),dict(status='absent'))
  # Invalid writes do not reserve UUIDs. Recovery uses the same ID with a valid body.
  good={**cmd,'body':b};saved=self.ok(self.g(good['action'],**{k:v for k,v in good.items() if k not in ['schemaVersion','action']}));self.assertEqual(saved['draft']['body'],b);self.assertEqual(saved['draft']['target']['revision'],2);self.assertEqual(self.ok(self.g(good['action'],**{k:v for k,v in good.items() if k not in ['schemaVersion','action']})),saved)
  self.assertEqual(self.g('save_guidance_draft_v1',requestId=str(uuid.uuid4()),target=draft['target'],body=b)['status'],409)
 def old_approved(self,publish=False):
  prepare60();self.setUp();self.routine_publish();b=self.stages(['same','same']);create=self.command('create_guidance_draft_v1',clientId=n.C,body=b);r=self.direct(create);self.assertEqual(r.returncode,0,r.stderr);draft=json.loads(next(x for x in r.stdout.splitlines() if x.startswith('{')))['draft'];review=self.command('review_guidance_v1',target=draft['target']);self.assertEqual(self.g(review['action'],requestId=review['requestId'],target=review['target'])['status'],503);approval=self.command('approve_guidance_v1',target=draft['target'],publisher=dict(kind='human',actorId=n.A),scope='instruction.publish');ap=self.ok(self.g(approval['action'],**{k:v for k,v in approval.items() if k not in ['schemaVersion','action']}))['approval'];pub=self.command('publish_guidance_v1',target=draft['target'],approvalId=ap['id'],publisher=dict(kind='human',actorId=n.A))
  if publish:self.ok(self.g(pub['action'],**{k:v for k,v in pub.items() if k not in ['schemaVersion','action']}))
  return b,draft,create,review,approval,pub
 def test_b02_old_reviewed_approved_invalid_draft_no_authority_or_replay_effect(self):
  b,d,create,review,approval,pub=self.old_approved();before=self.counts();apply();self.assertEqual(self.counts(),before)
  issues=json.loads(n.q('select concierge.review_guidance_issues('+n.lit(n.C)+','+n.lit(json.dumps(b))+'::jsonb,'+n.lit(json.dumps(d['capturedBasis']))+'::jsonb,'+n.lit(json.dumps(d['capturedBasis']))+'::jsonb,true)'));self.assertIn(dict(path='body.schedule',code='required'),issues)
  self.assertEqual(self.g('read_guidance_draft_v1',draftId=d['target']['draftId']),dict(status=400,body=dict(code='invalid_input')))
  for old in [create,review,approval]:
   self.assertEqual(self.g(old['action'],**{k:v for k,v in old.items() if k not in ['schemaVersion','action']}),dict(status=400,body=dict(code='invalid_input')));self.assertEqual(self.g('request_status_v1',requestId=old['requestId']),dict(status=400,body=dict(code='invalid_input')))
  self.assertEqual(self.g('review_guidance_v1',requestId=str(uuid.uuid4()),target=d['target'])['status'],400);self.assertEqual(self.g('approve_guidance_v1',requestId=str(uuid.uuid4()),target=d['target'],publisher=dict(kind='human',actorId=n.A),scope='instruction.publish')['status'],400)
  self.assertEqual(self.g(pub['action'],**{k:v for k,v in pub.items() if k not in ['schemaVersion','action']}),dict(status=409,body=dict(code='basis_conflict')));self.assertEqual(self.ok(self.g('request_status_v1',requestId=pub['requestId'])),dict(status='absent'))
  rebase=self.g('rebase_guidance_draft_v1',requestId=str(uuid.uuid4()),target=d['target'],expectedBasis=d['capturedBasis']);self.assertEqual(rebase,dict(status=400,body=dict(code='invalid_input')));self.assertEqual(self.counts(),before)
  # Stored authority is immutable evidence, not usable authorization. Valid correction is a new revision.
  corrected=copy.deepcopy(b);corrected['schedule']['stages'][1]['id']='different';saved=self.ok(self.g('save_guidance_draft_v1',requestId=str(uuid.uuid4()),target=d['target'],body=corrected))['draft'];self.assertEqual(saved['target']['revision'],2);self.assertIsNone(saved['review']);self.assertIsNone(saved['approval']);self.assertEqual(json.loads(n.q('select body from concierge.review_guidance_revisions where draft_id='+n.lit(d['target']['draftId'])+' and revision=1')),b)
 def test_b03_invalid_existing_output_is_not_repaired_and_final_deferred_authority_denies(self):
  b,d,create,review,approval,pub=self.old_approved(True);before=self.counts();output=json.loads(n.q('select to_jsonb(o) from concierge.review_guidance_outputs o'));apply();self.assertEqual(self.counts(),before)
  # Existing invalid immutable output remains evidence; no retrospective body or receipt rewrite.
  self.assertEqual(json.loads(n.q('select to_jsonb(o) from concierge.review_guidance_outputs o')),output);self.assertEqual(n.edge(n.C,'read_care_history_v1',cursor=None,limit=100,version=None)['status'],503)
  self.assertEqual(self.g(pub['action'],**{k:v for k,v in pub.items() if k not in ['schemaVersion','action']})['status'],400);self.assertEqual(self.g('request_status_v1',requestId=pub['requestId'])['status'],400)
  # Private function probes exercise real final/deferred authority with actual synthetic owner claims.
  row='jsonb_populate_record(null::concierge.review_guidance_outputs,'+n.lit(json.dumps(output))+'::jsonb)'
  claims=json.dumps(dict(sub=n.A,session_id=n.A,is_anonymous=False));prefix='begin;set local request.jwt.claims='+n.lit(claims)+';'
  r=n.raw(prefix+'select concierge.review_output_authority('+row+');commit;');self.assertNotEqual(r.returncode,0);self.assertIn('concierge_basis_conflict',r.stderr);self.assertEqual(self.counts(),before)
 def test_b06_deferred_output_authority_rejects_before_missing_linkages_without_effects(self):
  b,d,create,review,approval,pub=self.old_approved();apply();before=self.counts();output=dict(id=str(uuid.uuid4()),client_id=n.C,kind='instruction',draft_id=d['target']['draftId'],revision=1,approval_id=pub['approvalId'],body=b,basis=d['capturedBasis'],target=d['target'],publisher=dict(kind='human',actorId=n.A),receipt_id=str(uuid.uuid4()),event_id=str(uuid.uuid4()),output_version=1,original_start=None,recorded_at=n.q("select concierge.care_instant(clock_timestamp())"))
  claims=json.dumps(dict(sub=n.A,session_id=n.A,is_anonymous=False));r=n.raw('begin;set local request.jwt.claims='+n.lit(claims)+';insert into concierge.review_guidance_outputs select (jsonb_populate_record(null::concierge.review_guidance_outputs,'+n.lit(json.dumps(output))+'::jsonb)).*;set constraints concierge.review_output_complete immediate;commit;');self.assertNotEqual(r.returncode,0);self.assertIn('concierge_basis_conflict',r.stderr);self.assertIn('review_output_complete()',r.stderr);self.assertEqual(self.counts(),before)
 def test_b04_case_exact_ids_empty_private_and_twenty_stage_bound(self):
  self.routine_publish()
  for ids in [[],['Case','case'],['non_uuid','non-uuid'],['id'+str(i) for i in range(20)]]:
   b=self.stages(ids);draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=n.C,body=b))['draft'];self.assertEqual(draft['body'],b)
  for ids in [['x']*2,['a']+['id'+str(i) for i in range(18)]+['a'],['id'+str(i) for i in range(21)],['x',' x'],['x','x ']]:
   b=self.stages(ids);r=self.direct(self.command('create_guidance_draft_v1',clientId=n.C,body=b));self.assertNotEqual(r.returncode,0);self.assertIn('concierge_invalid_input',r.stderr)
  incomplete=self.stages([]);incomplete['directions']=[];incomplete['reason']='';incomplete['schedule']['periods']=[];draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=n.C,body=incomplete))['draft'];self.assertEqual(draft['body'],incomplete);self.assertIsNone(draft['review']);self.assertIsNone(draft['approval']);self.assertEqual(self.g('review_guidance_v1',requestId=str(uuid.uuid4()),target=draft['target'])['status'],400)
 def test_b05_acl_current_session_agent_denial_and_private_canary(self):
  self.routine_publish();b=self.stages(['first','second']);b['reason']='PUBLIC_ONLY_STAGE_CONTROL';d=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=n.C,body=b))['draft'];self.assertEqual(self.g('read_guidance_draft_v1',actor=n.G,draftId=d['target']['draftId'])['status'],403);self.assertEqual(self.g('read_guidance_draft_v1',actor=n.D,draftId=d['target']['draftId'])['status'],403)
  for role in ['anon','authenticated','service_role']:self.assertEqual(n.q('select has_function_privilege('+n.lit(role)+",'concierge.review_guidance_stage_ids_unique_v1(jsonb)','execute')"),'f')
  self.assertEqual(n.q("select coalesce(proconfig @> array['search_path=\"\"'],false) and not prosecdef from pg_proc where oid='concierge.review_guidance_stage_ids_unique_v1(jsonb)'::regprocedure"),'t')
  n.q('update auth.sessions set not_after=clock_timestamp()-interval \'1 second\' where id='+n.lit(n.A));r=self.g('read_guidance_draft_v1',draftId=d['target']['draftId']);self.assertEqual(r,dict(status=401,body=dict(code='session_ended')));self.assertNotIn('PUBLIC_ONLY_STAGE_CONTROL',json.dumps(r))

 def test_b07_twenty_stages_exact_guidance_byte_limit_and_readable_detail(self):
  self.routine_publish();b=self.stages(['id'+str(i) for i in range(20)])
  for stage in b['schedule']['stages']:stage['directions']='🧴'*1000;stage['proceedOnlyWhen']='c'*1000
  size=lambda value:len(json.dumps(value,separators=(',',':'),ensure_ascii=False).encode())
  b['directions']=[]
  while size(b)<120000:
   b['directions'].append('');gap=120000-size(b);self.assertGreaterEqual(gap,0);b['directions'][-1]='d'*min(4000,gap)
  self.assertEqual(size(b),120000);self.assertLessEqual(len(b['directions']),50);receipt=self.publish_guidance(b);view=self.ok(n.edge(n.C,'read_client_plan_v3',version=1));snap=view['currentGuidance']['snapshot'];page=self.ok(n.edge(n.C,'read_client_instruction_manifest_v1',snapshot=snap,cursor=None,limit=100));item=page['items'][0];detail=self.ok(n.edge(n.C,'read_client_instruction_v1',snapshot=snap,instructionId=item['instructionId'],version=item['version'],contentHash=item['contentHash']));self.assertEqual(detail['content']['body'],b);self.assertEqual(next(x['guidance']['body'] for x in self.ok(n.edge(n.C,'read_care_history_v1',cursor=None,limit=100,version=None))['entries'] if x['kind']=='guidance' and x['guidance']['record']==receipt['record']),b)
  b['directions'][-1]+='x';self.assertEqual(size(b),120001);self.assertEqual(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=n.C,body=b)['status'],400);self.assertNotEqual(self.direct(self.command('create_guidance_draft_v1',clientId=n.C,body=b)).returncode,0)
  (n.E/'m61-stage-max.json').write_text(json.dumps(dict(stages=20,bodyBytes=120000,detailBytes=size(detail),record=receipt['record'],readable=True),indent=2))

if __name__=='__main__':
 n.guard()
 if '--prepare' in sys.argv:prepare()
 elif '--apply' in sys.argv:apply()
 elif '--retained' in sys.argv:unittest.main(module=n,argv=[sys.argv[0]])
 elif '--wire' in sys.argv:unittest.main(module=f.wire,argv=[sys.argv[0]])
 elif '--fix' in sys.argv:unittest.main(module=f,argv=[sys.argv[0]])
 else:
  names=sys.argv[1:] or [x for x in StageIdentity.__dict__ if x.startswith('test_')]
  r=unittest.TextTestRunner(verbosity=2).run(unittest.TestSuite(StageIdentity(x) for x in names));raise SystemExit(not r.wasSuccessful())
