"""M60 own-fixture regressions for independent RG1/RG2/RG3. No reviewer fixture use."""
from pathlib import Path
import concurrent.futures,copy,hashlib,importlib.util,json,subprocess,sys,time,unittest,uuid
spec=importlib.util.spec_from_file_location('fix_wire',Path(__file__).with_name('portal-review-wire-budget-native.py'));wire=importlib.util.module_from_spec(spec);spec.loader.exec_module(wire);n=wire.n
M60=n.ROOT/'supabase/migrations/20261031141212_portal_rebuild_reviews_guidance_fixes_v1.sql'
def edge(actor,action,family='review',**fields):
 command=dict(action=action,**fields)
 if family not in ('checkins','operations'):command=dict(schemaVersion=1,**command)
 n.guard();r=subprocess.run([n.NODE,'--experimental-strip-types',str(n.ROOT/'tests/portal-review-guidance-fixes-edge.mjs')],cwd=n.ROOT,env=n.ENV,input=json.dumps(dict(actor=actor,family=family,command=command)),text=True,capture_output=True,timeout=60)
 if r.returncode:raise AssertionError(r.stderr)
 return json.loads(r.stdout)
def retain(name,value):
 (n.E/(name+'.json')).write_text(json.dumps(value,indent=2,ensure_ascii=False));print(name,json.dumps(value,ensure_ascii=False),flush=True)
def function_snapshot():
 signatures=['concierge.review_guidance_issues(uuid,jsonb,jsonb,jsonb,boolean)','concierge.review_guidance_draft_view(concierge.review_guidance_drafts)','public.concierge_checkin_read(uuid)','public.concierge_checkin_advisor_read(uuid)','public.concierge_advisor_preview_v2(uuid,text,bigint)','concierge.review_source_check(uuid,jsonb,uuid)','concierge.review_guidance_sources_check(uuid,jsonb,uuid)','concierge.review_guidance_source_locations(uuid,jsonb)']
 return [json.loads(n.q("select jsonb_build_object('signature',p.oid::regprocedure::text,'oid',p.oid,'owner',p.proowner::regrole::text,'acl',p.proacl,'config',p.proconfig,'definer',p.prosecdef,'volatility',p.provolatile,'strict',p.proisstrict,'parallel',p.proparallel,'body',p.prosrc) from pg_proc p where p.oid="+n.lit(sig)+'::regprocedure')) for sig in signatures]
def apply():
 before=function_snapshot();tables=n.q("select tablename from pg_tables where schemaname='concierge' order by tablename").splitlines();ident=lambda value:'"'+value.replace('"','""')+'"'
 query="select jsonb_object_agg(name,rows)::text from ("+' union all '.join("select "+n.lit(t)+" name,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') rows from concierge."+ident(t)+' x' for t in tables)+") z"
 rows=n.q(query);n.q(M60.read_text());after=function_snapshot();assert n.q(query)==rows,'M60 rewrote canonical rows'
 assert [{k:v for k,v in x.items() if k!='body'} for x in before]==[{k:v for k,v in x.items() if k!='body'} for x in after],'M60 changed function identity/ACL'
 (n.E/'m60-functions-applied-before.json').write_text(json.dumps(before,indent=2));(n.E/'m60-functions-applied-after.json').write_text(json.dumps(after,indent=2));(n.E/'m60-data-preservation.json').write_text(json.dumps(dict(tableCount=len(tables),equal=True,allColumns=True,sha256=hashlib.sha256(rows.encode()).hexdigest()),indent=2))
def prepare():
 wire.prepare()
 if M60.stat().st_size:apply()
n.prepare=prepare
class FixTests(unittest.TestCase):
 setUp=n.ReviewTests.setUp;draft=n.ReviewTests.draft;saved=n.ReviewTests.saved;reviewed=n.ReviewTests.reviewed;approved=n.ReviewTests.approved;fund=n.ReviewTests.fund;publish=n.ReviewTests.publish;ok=n.ReviewTests.ok;body=n.ReviewTests.body;submit=n.ReviewTests.submit;guidance_body=n.ReviewTests.guidance_body;guidance=n.ReviewTests.guidance;publish_guidance=n.ReviewTests.publish_guidance;g=n.ReviewTests.g
 def tearDown(self):n.backup('m60-'+self._testMethodName)
 def legacy(self):
  prepare();n.q('insert into auth.users(id) values('+n.lit(n.S)+'),('+n.lit(n.D)+'),('+n.lit(n.G)+');insert into public.profiles(id) select id from auth.users where id in ('+n.lit(n.S)+','+n.lit(n.D)+','+n.lit(n.G)+');insert into auth.sessions(id,user_id) select id,id from auth.users;insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values('+n.lit(n.A)+',true,true,true,true,true),('+n.lit(n.S)+',true,true,true,true,true);insert into concierge.plan_principals(actor_id,kind) values('+n.lit(n.A)+",'owner'),("+n.lit(n.S)+",'human'),("+n.lit(n.G)+",'agent');update concierge.plan_policy set activated=true,owner_actor_id="+n.lit(n.A)+',revision=1')
  return n.q('select id from concierge.checkin_reports limit 1')
 def conversation(self,locators,split=False):
  sources=[dict(sourceId=self.source,sourceVersion=1,locator=l) for l in locators]
  facts=[dict(id='f'+str(i),text='OWN_M60_PRIVATE_LOCATOR',sources=[loc]) for i,loc in enumerate(sources)] if split else [dict(id='f',text='OWN_M60_PRIVATE_LOCATOR',sources=sources)]
  return dict(publication=dict(version=1,documentSchemaVersion=3),occurredOn=dict(state='unknown'),channel='text',clientReported=facts,advisorConclusions=[],agentProposals=[],contradictions=[])
 def direct_conversation(self,body,revision=0):
  cmd=dict(schemaVersion=1,action='record_conversation_v1',requestId=str(uuid.uuid4()),clientId=n.C,expectedReportRevision=revision,body=body)
  return n.raw(n.w.session(n.A)+'select public.concierge_review_command_v1('+n.lit(json.dumps(cmd))+'::jsonb);commit;')
 def source_setup(self):
  self.publish();self.source=str(uuid.uuid4());n.q('insert into concierge.plan_sources(id,client_id,version) values('+n.lit(self.source)+','+n.lit(n.C)+',1)')
 def test_01_rg1_blank_changes_cannot_be_reviewed_and_published(self):
  self.publish();body=self.guidance_body();body['changes']=[' \t'];draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=n.C,body=body))['draft'];target=draft['target'];review=self.g('review_guidance_v1',requestId=str(uuid.uuid4()),target=target);approval=self.g('approve_guidance_v1',requestId=str(uuid.uuid4()),target=target,publisher=dict(kind='human',actorId=n.A),scope='review.publish');pub=self.g('publish_guidance_v1',requestId=str(uuid.uuid4()),target=target,approvalId=approval['body']['approval']['id'],publisher=dict(kind='human',actorId=n.A)) if approval['status']==200 else None;history=edge(n.C,'read_care_history_v1',cursor=None,limit=100,version=None)
  retain('m60-rg1-outcome',dict(saveIssues=draft['issues'],review=review,approvalStatus=approval['status'],published=pub,historyStatus=history['status'],outputs=n.q('select count(*) from concierge.review_guidance_outputs')));self.assertEqual(review['status'],400);self.assertEqual(approval['status'],400);self.assertEqual(history['status'],200)
 def test_02_rg2_typed_legacy_report_reply_requires_old_reader_version(self):
  report=self.legacy();body=dict(kind='reply',publication=dict(version=2,documentSchemaVersion=2),reportRef=dict(kind='legacy_report',id=report),reply='typed reviewed reply',nextStep='complete next step');self.publish_guidance(body);client=edge(n.C,'client_read','checkins');advisor=edge(n.A,'advisor_read','checkins',clientId=n.C);preview=edge(n.A,'advisor_preview_read_v2','operations',clientId=n.C,mode='published',expectedRevision=None);history=edge(n.C,'read_care_history_v1',cursor=None,limit=100,version=None)
  retain('m60-rg2-outcome',dict(client=client,advisor=advisor,preview=preview,newHistoryStatus=history['status']));self.assertEqual(client,dict(status=409,body=dict(code='content_version_required',retryable=False)));self.assertEqual(advisor['status'],409);self.assertEqual(preview['status'],409);self.assertEqual(history['status'],200)
 def test_03_rg3_every_locator_precedes_permission_dedup(self):
  self.source_setup();body=self.conversation([dict(kind='text',start=0,end=1),dict(kind='text',start=8,end=4)]);handler=edge(n.A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=n.C,expectedReportRevision=0,body=body);direct=self.direct_conversation(body);history=edge(n.A,'read_advisor_care_history_v1',clientId=n.C,cursor=None,limit=100,version=None)
  retain('m60-rg3-outcome',dict(handler=handler,rpcExit=direct.returncode,rpcOut=direct.stdout,rpcError=direct.stderr,historyStatus=history['status'],stored=n.q('select count(*) from concierge.review_conversations')));self.assertEqual(handler['status'],400);self.assertNotEqual(direct.returncode,0);self.assertEqual(history['status'],200)
 def test_04_rg1_incomplete_variants_quiet_but_no_change_and_valid_changes_readable(self):
  self.publish();events=n.q('select count(*) from concierge.plan_events')
  for changes in [[''],[' \t'],['valid change',' \n'],['\u2003\ufeff']]:
   body=self.guidance_body();body['changes']=changes;draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=n.C,body=body))['draft'];self.assertEqual(draft['body']['changes'],changes);self.assertTrue(any(x['path']=='body' and x['code']=='required' for x in draft['issues']));saved=self.ok(self.g('save_guidance_draft_v1',requestId=str(uuid.uuid4()),target=draft['target'],body=body))['draft'];self.assertEqual(saved['body'],body);self.assertIsNone(saved['review']);self.assertIsNone(saved['approval']);self.assertEqual(self.g('review_guidance_v1',requestId=str(uuid.uuid4()),target=saved['target'])['status'],400);self.assertEqual(self.g('approve_guidance_v1',requestId=str(uuid.uuid4()),target=saved['target'],publisher=dict(kind='human',actorId=n.A),scope='review.publish')['status'],400)
  self.assertEqual(n.q('select count(*) from concierge.plan_events'),events);self.assertEqual(n.q('select count(*) from concierge.review_guidance_outputs'),'0');self.assertEqual(n.q('select count(*) from concierge.review_guidance_receipts'),'0')
  for changes in [[],['use the authored schedule']]:
   body=self.guidance_body();body['changes']=changes;receipt=self.publish_guidance(body);history=self.ok(edge(n.C,'read_care_history_v1',cursor=None,limit=100,version=None));self.assertEqual(next(x['guidance']['body']['changes'] for x in history['entries'] if x['kind']=='guidance' and x['guidance']['record']==receipt['record']),changes)
  self.assertEqual(n.q('select published_version from concierge.cases where client_id='+n.lit(n.C)),'1');self.assertEqual(n.q('select count(*) from concierge.activations'),'0')
 def test_05_rg2_null_next_step_explicit_binding_and_plain_legacy_control(self):
  rid=self.legacy();before=edge(n.C,'client_read','checkins');self.assertEqual(before['status'],200);self.assertEqual(before['body']['reports'][0]['advisorReplies'][0]['reply'],'legacy original reply');self.assertEqual(edge(n.A,'advisor_read','checkins',clientId=n.C)['status'],200)
  body=dict(kind='reply',publication=dict(version=2,documentSchemaVersion=2),reportRef=dict(kind='legacy_report',id=rid),reply='typed reply with explicit publication',nextStep=None);draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=n.C,body=body))['draft'];self.assertIsNone(draft['approval']);self.assertEqual(edge(n.C,'client_read','checkins')['status'],200)
  receipt=self.publish_guidance(body);client=edge(n.C,'client_read','checkins');advisor=edge(n.A,'advisor_read','checkins',clientId=n.C);preview=edge(n.A,'advisor_preview_read_v2','operations',clientId=n.C,mode='published',expectedRevision=None);self.assertEqual(client,dict(status=409,body=dict(code='content_version_required',retryable=False)));self.assertEqual(advisor['status'],409);self.assertEqual(preview['status'],409);self.assertEqual(edge(n.D,'advisor_read','checkins',clientId=n.C)['status'],403)
  history=self.ok(edge(n.C,'read_care_history_v1',cursor=None,limit=100,version=None));actual=next(x['guidance'] for x in history['entries'] if x['kind']=='guidance' and x['guidance']['record']==receipt['record']);self.assertEqual(actual['body'],body);retain('m60-rg2-gateway-input',dict(client=client,advisor=advisor,preview=preview))
 def test_06_rg3_range_permutations_every_fact_and_closed_shape(self):
  self.source_setup();vectors=[]
  for kind in ['text','time']:
   fields=('start','end') if kind=='text' else ('startMs','endMs');good={"kind":kind,fields[0]:0,fields[1]:1}
   for end in [4,8]:
    bad={"kind":kind,fields[0]:8,fields[1]:end}
    for pair in [[good,bad],[bad,good]]:
     for split in [False,True]:vectors.append(self.conversation(pair,split))
  malformed=[{'kind':'TEXT','start':0,'end':1},{'kind':'whole','extra':'PRIVATE'},{'kind':'page','page':0},{'kind':'text','start':0,'end':1,'extra':True},{'kind':'time','startMs':.5,'endMs':1}]
  vectors.extend(self.conversation([dict(kind='whole'),x]) for x in malformed)
  for bucket in ['advisorConclusions','agentProposals']:
   body=self.conversation([dict(kind='text',start=0,end=1)]);fact=dict(id='other-bucket',text='OWN_M60_PRIVATE_OTHER_BUCKET',sources=[dict(sourceId=self.source,sourceVersion=1,locator=dict(kind='time',startMs=8,endMs=4))])
   if bucket=='agentProposals':fact['proposedBy']=dict(state='unknown')
   body[bucket]=[fact];vectors.append(body)
  for version in [0,.5,9007199254740992]:
   body=self.conversation([dict(kind='whole')]);body['clientReported'][0]['sources'][0]['sourceVersion']=version;vectors.append(body)
  body=self.conversation([dict(kind='whole')]);body['clientReported'][0]['sources'][0]['credential']='PRIVATE';vectors.append(body)
  for body in vectors:
   self.assertEqual(edge(n.A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=n.C,expectedReportRevision=0,body=body)['status'],400);direct=self.direct_conversation(body);self.assertNotEqual(direct.returncode,0);self.assertIn('concierge_invalid_input',direct.stderr)
  self.assertEqual(n.q('select count(*) from concierge.review_conversations'),'0');self.assertEqual(n.q('select concierge.review_report_revision('+n.lit(n.C)+')'),'0');self.assertEqual(edge(n.A,'read_advisor_care_history_v1',clientId=n.C,cursor=None,limit=100,version=None)['status'],200)
 def test_07_rg3_valid_whole_page_ranges_retained_and_duplicate_tuple_count(self):
  self.source_setup();locators=[dict(kind='whole'),dict(kind='page',page=1),dict(kind='text',start=0,end=1),dict(kind='text',start=8,end=9),dict(kind='time',startMs=1,endMs=2)];body=self.conversation(locators);first=self.ok(edge(n.A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=n.C,expectedReportRevision=0,body=body));direct=self.direct_conversation(body,1);self.assertEqual(direct.returncode,0,direct.stderr);history=self.ok(edge(n.A,'read_advisor_care_history_v1',clientId=n.C,cursor=None,limit=100,version=None));conversations=[x['event'] for x in history['entries'] if x['kind']=='conversation'];self.assertEqual(len(conversations),2);self.assertTrue(all(x['body']['clientReported'][0]['sources']==body['clientReported'][0]['sources'] for x in conversations));review=self.guidance_body();review['reportRefs']=[dict(kind='conversation',id=x['id']) for x in conversations];draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=n.C,body=review))['draft'];self.assertEqual(draft['capturedBasis']['sourceManifest']['count'],5)
  duplicated=self.conversation([locators[2],locators[2]],True);event=self.ok(edge(n.A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=n.C,expectedReportRevision=2,body=duplicated))['event'];draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=n.C,body=self.guidance_body(event)))['draft'];self.assertEqual(draft['capturedBasis']['sourceManifest']['count'],1)
 def test_08_rg2_current_session_after_client_wait_precedes_version_fence(self):
  rid=self.legacy();self.publish_guidance(dict(kind='reply',publication=dict(version=2,documentSchemaVersion=2),reportRef=dict(kind='legacy_report',id=rid),reply='typed reply',nextStep=None));m=n.guard();locker=subprocess.Popen([str(n.PG/'psql'),'-X','-w','-h',m['socket'],'-p',n.PORT,'-U','postgres','-d',n.DB,'-At','-v','ON_ERROR_STOP=1'],env={**n.ENV,'PGPASSFILE':m['socket']+'/no-password'},text=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  try:
   locker.stdin.write('begin;select client_id from concierge.cases where client_id='+n.lit(n.C)+" for update;select 'LOCKED';\n");locker.stdin.flush()
   for _ in range(4):
    if locker.stdout.readline().strip()=='LOCKED':break
   n.q('update auth.sessions set not_after=clock_timestamp()+interval \'2 seconds\' where id='+n.lit(n.C))
   with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    future=pool.submit(edge,n.C,'client_read','checkins');blocked=False
    for _ in range(100):
     if n.q("select exists(select 1 from pg_stat_activity where pid<>pg_backend_pid() and wait_event_type='Lock' and query like '%concierge_checkin_read%')")=='t':blocked=True;break
     time.sleep(.01)
    self.assertTrue(blocked);time.sleep(2.2);locker.stdin.write('commit;\n');locker.stdin.close();result=future.result(timeout=10);self.assertEqual(result,dict(status=401,body=dict(code='session_ended',retryable=False)));direct=n.raw(n.w.session(n.C)+'select public.concierge_checkin_read('+n.lit(n.C)+');commit;');self.assertNotEqual(direct.returncode,0);self.assertIn('concierge_session_ended',direct.stderr);self.assertNotIn('concierge_content_version_required',direct.stderr);retain('m60-rg4-gateway-input',result);self.assertNotIn('reports',result['body'])
  finally:
   if locker.stdin and not locker.stdin.closed:locker.stdin.close()
   locker.wait(timeout=10);locker.stdout.close();locker.stderr.close()
 def test_09_pre_fix_approved_blank_is_unusable_and_atomic_without_row_rewrite(self):
  wire.prepare();self.setUp();self.publish();body=self.guidance_body();body['changes']=[' \t'];draft,approval=self.guidance(body);before=n.q('select jsonb_build_object(\'events\',(select count(*) from concierge.plan_events),\'deliveries\',(select count(*) from concierge.plan_deliveries),\'outputs\',(select count(*) from concierge.review_guidance_outputs),\'receipts\',(select count(*) from concierge.review_guidance_receipts))');original=n.q('select body from concierge.review_guidance_revisions where draft_id='+n.lit(draft['target']['draftId']));apply();fresh=self.ok(self.g('read_guidance_draft_v1',draftId=draft['target']['draftId']));self.assertEqual(fresh['body'],body);self.assertIsNone(fresh['review']);self.assertIsNone(fresh['approval']);rid=str(uuid.uuid4());pub=self.g('publish_guidance_v1',requestId=rid,target=draft['target'],approvalId=approval['id'],publisher=dict(kind='human',actorId=n.A));self.assertEqual(pub['status'],409);self.assertEqual(pub['body']['code'],'basis_conflict');self.assertEqual(n.q('select body from concierge.review_guidance_revisions where draft_id='+n.lit(draft['target']['draftId'])),original);self.assertEqual(n.q('select jsonb_build_object(\'events\',(select count(*) from concierge.plan_events),\'deliveries\',(select count(*) from concierge.plan_deliveries),\'outputs\',(select count(*) from concierge.review_guidance_outputs),\'receipts\',(select count(*) from concierge.review_guidance_receipts))'),before);self.assertEqual(self.ok(self.g('request_status_v1',requestId=rid)),dict(status='absent'))
  self.assertIsNone(self.ok(self.g('read_guidance_draft_v1',draftId=draft['target']['draftId']))['approval'])
if __name__=='__main__':
 n.guard()
 if '--prepare' in sys.argv:prepare()
 elif '--apply' in sys.argv:apply()
 elif '--retained' in sys.argv:unittest.main(module=n,argv=[sys.argv[0]])
 elif '--wire' in sys.argv:unittest.main(module=wire,argv=[sys.argv[0]])
 else:unittest.main()
