"""New owned Unix-only PG15 lane. Synthetic Auth identity, never genuine Supabase acceptance."""
from pathlib import Path
import concurrent.futures,datetime,hashlib,importlib.util,json,os,subprocess,sys,time,unittest,uuid
ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'.local-artifacts/portal-rebuild/w1-review'
CURRENT=E/'CURRENT.json'
PG=Path('/opt/homebrew/opt/postgresql@15/bin')
NODE='/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node'
DB='shelv_review_7a7cac7e_synthetic';PORT='55487'
MARKER='W1 review 7a7cac7e synthetic Unix-only 20261031'
ENV={k:v for k,v in os.environ.items() if not k.startswith('PG')}
ENV.update(PGSERVICEFILE='/dev/null',PGAPPNAME='shelv-review-7a7cac7e')
def lit(value):return "'"+str(value).replace("'","''")+"'"
def meta():
 m=json.loads(CURRENT.read_text());assert m['root']==str(ROOT) and m['database']==DB and m['port']==PORT and m['marker']==MARKER
 assert Path(m['data']).resolve().is_relative_to(E.resolve()) and not Path(m['data']).is_symlink()
 assert Path(m['socket']).parent==Path('/tmp') and Path(m['socket']).name.startswith('sh-rv7a-')
 return m
def guard():
 m=meta();pid=Path(m['data'])/'postmaster.pid';assert pid.exists() and int(pid.read_text().splitlines()[0])==m['pid'],'owned PID mismatch'
 assert subprocess.run([str(PG/'pg_ctl'),'-D',m['data'],'status'],env=ENV,capture_output=True).returncode==0
 return m
def raw(sql,db=DB):
 m=guard();assert db in (DB,'postgres');env={**ENV,'PGPASSFILE':m['socket']+'/no-password'}
 return subprocess.run([str(PG/'psql'),'-X','-w','-h',m['socket'],'-p',PORT,'-U','postgres','-d',db,'-At','-v','ON_ERROR_STOP=1'],input=sql,env=env,text=True,capture_output=True,timeout=45)
def q(sql):
 r=raw(sql)
 if r.returncode:raise AssertionError(r.stderr)
 return r.stdout.strip()
def start():
 E.mkdir(parents=True,exist_ok=True)
 if CURRENT.exists():
  old=meta();assert subprocess.run([str(PG/'pg_ctl'),'-D',old['data'],'status'],env=ENV,capture_output=True).returncode!=0,'own fixture already running'
  CURRENT.rename(E/('CURRENT-stopped-'+uuid.uuid4().hex+'.json'))
 token=uuid.uuid4().hex;run=E/'fixture'/token;run.mkdir(parents=True);socket='/tmp/sh-rv7a-'+token[:8];os.mkdir(socket,0o700);data=run/'data'
 result=subprocess.run([str(PG/'initdb'),'-D',str(data),'-U','postgres','-A','trust','--locale=C','-E','UTF8'],env=ENV,text=True,capture_output=True);(run/'initdb.log').write_text(result.stdout+result.stderr);assert result.returncode==0
 args=['-c',"listen_addresses=''",'-k',socket,'-p',PORT,'-c','max_connections=12','-c','shared_buffers=16MB','-c','unix_socket_permissions=0700']
 # pg_ctl parses this controlled option string; no user text or secret is interpolated.
 result=subprocess.run([str(PG/'pg_ctl'),'-D',str(data),'-l',str(run/'postgres.log'),'-o',' '.join(args),'-w','-t','30','start'],env=ENV,text=True,capture_output=True);(run/'start.log').write_text(result.stdout+result.stderr);assert result.returncode==0
 m=dict(root=str(ROOT),database=DB,port=PORT,marker=MARKER,socket=socket,data=str(data),pid=int((data/'postmaster.pid').read_text().splitlines()[0]),run=str(run),prepared=False)
 CURRENT.write_text(json.dumps(m,indent=2));CURRENT.chmod(0o600);print(json.dumps(m))
 assert raw('comment on database postgres is '+lit(MARKER),'postgres').returncode==0
def backup(label):
 m=guard();exists=raw('select 1 from pg_database where datname='+lit(DB),'postgres');assert exists.returncode==0
 if not exists.stdout.strip():return
 assert q("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()")==MARKER
 path=Path(m['run'])/(label+'-'+uuid.uuid4().hex+'.sql');r=subprocess.run([str(PG/'pg_dump'),'-h',m['socket'],'-p',PORT,'-U','postgres','-d',DB,'-f',str(path)],env={**ENV,'PGPASSFILE':m['socket']+'/no-password'},capture_output=True,text=True);assert r.returncode==0,r.stderr;path.chmod(0o600)
def stop():
 m=guard();assert raw("select count(*) from pg_stat_activity where pid<>pg_backend_pid() and backend_type='client backend'",'postgres').stdout.strip()=='0','other connections remain'
 backup('final-preserved');r=subprocess.run([str(PG/'pg_ctl'),'-D',m['data'],'-m','fast','-w','stop'],env=ENV,text=True,capture_output=True);(Path(m['run'])/'stop.log').write_text(r.stdout+r.stderr);assert r.returncode==0
 assert subprocess.run([str(PG/'pg_ctl'),'-D',m['data'],'status'],env=ENV,capture_output=True).returncode!=0
 print('STOPPED and preserved '+m['data'])

# Reuse only source helpers, replacing every resource binding before calling any helper.
spec=importlib.util.spec_from_file_location('review_plan_source',ROOT/'tests/portal-rebuild-native.py');w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w)
w.DB=DB;w.MARKER=MARKER;w.raw=raw;w.ENV=ENV;w.SOCKET='source-only-disabled'
A,S,G,C,D=w.A,w.S,w.G,w.C,w.D
source_content=w.content
def content():
 b=source_content();b['decisions']=[dict(id='no-addition',slotId='no-product-slot',recommendationId=None,kind='no_addition',goalIds=['comfort'],currentProductIds=[],primaryProductId=None,alternativeProductIds=[],reason='no new product is needed',directions=[],cautions=[],limitations=[],schedule=None,factIds=[],guidance=dict(title='',subtitle='',rationaleTitle='',reasons=[],actions=[],comparisons=[],factsTitle='',facts=[],how=None,sources=[],group=None,decisionLabels=None))];return b
w.content=content
def prepare():
 backup('before-prepare');w.prepare()
 for name in ['20261031003846_portal_rebuild_advisor_reads_v1.sql','20261031043655_portal_rebuild_care_use_v1.sql','20261031073004_portal_rebuild_care_history_filter_v1.sql']:q((ROOT/'supabase/migrations'/name).read_text())
 # Explicit synthetic retained storage records, not a genuine historical publication/Auth claim.
 report,review,reply,draft,instruction=[str(uuid.uuid4()) for _ in range(5)]
 q('insert into concierge.checkin_reports(id,client_id,comfort,consistency,changes,submitted_at) values('+lit(report)+','+lit(C)+",'legacy comfort','legacy consistency','legacy change','2026-10-15T12:00:00Z');insert into concierge.checkin_notes(id,client_id,report_id,note,created_at,created_by) values(gen_random_uuid(),"+lit(C)+','+lit(report)+",'PRIVATE_LEGACY_CHECKIN_NOTE','2026-10-15T13:00:00Z',"+lit(A)+')')
 data=dict(channel='call',occurredOn='2026-10-15',summary='legacy original summary',reportedUse='legacy original use',decision='legacy no change',nextReviewOn=None)
 q('insert into concierge.service_reviews values('+lit(review)+','+lit(C)+','+lit(json.dumps(data))+','+lit(A)+",'2026-10-15T14:00:00Z');insert into concierge.service_review_private values("+lit(review)+",'PRIVATE_LEGACY_REVIEW_NOTE');insert into concierge.checkin_replies(id,client_id,report_id,reply,created_at,created_by) values("+lit(reply)+','+lit(C)+','+lit(report)+",'legacy original reply','2026-10-15T15:00:00Z',"+lit(A)+')')
 usage=dict(periods=['evening'],order=1,short=dict(morning=None,evening='legacy directions'),instructions=['legacy original directions'])
 data=dict(slot='old-slot',productId='old-product',planVersion=2,baseInstructionVersion=0,usage=usage,reason='legacy reviewed instructions',reviewId=review,effectiveOn='2026-10-15')
 q('insert into concierge.instruction_drafts values('+lit(draft)+','+lit(C)+','+lit(json.dumps(data))+','+lit(json.dumps(dict(kind='activation',publicationVersion=1,recommendationId='old-decision')))+",'2026-10-03',"+lit(A)+",'2026-10-15T16:00:00Z');insert into concierge.instruction_publications values("+lit(instruction)+','+lit(C)+','+lit(draft)+',1,'+lit(A)+",'2026-10-15T16:00:00Z')")
 tables=q("select tablename from pg_tables where schemaname='concierge' order by tablename").splitlines()
 snapshot="select jsonb_object_agg(name,rows)::text from ("+' union all '.join("select '"+t+"' name,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') rows from concierge."+t+' x' for t in tables)+") z"
 before=q(snapshot);migration=ROOT/'supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql'
 if migration.stat().st_size:q(migration.read_text())
 # The new report discriminator is metadata; retained original row columns stay byte-exact.
 after=q(snapshot.replace('to_jsonb(x) order','to_jsonb(x)-\'report_format\' order'))
 assert json.loads(before)==json.loads(after),'legacy original bytes/IDs/dates preservation'
 Path(meta()['run'],'legacy-preservation.json').write_text(json.dumps(dict(tableCount=len(tables),sha256=hashlib.sha256(before.encode()).hexdigest(),equal=True,scope='all pre-M58 concierge table rows, report_format excluded only after DDL'),indent=2))
 m=meta();m['prepared']=True;CURRENT.write_text(json.dumps(m,indent=2));CURRENT.chmod(0o600);print('Prepared own canonical prerequisite subset plus M54-M58; synthetic Auth only')
def edge(actor,action,family='review',**fields):
 guard();command=dict(action=action,**fields)
 if family not in ('checkins','operations'):command=dict(schemaVersion=1,**command)
 r=subprocess.run([NODE,'--experimental-strip-types',str(ROOT/'tests/portal-review-native-edge.mjs')],cwd=ROOT,env=ENV,input=json.dumps(dict(actor=actor,family=family,command=command)),text=True,capture_output=True,timeout=45)
 if r.returncode:raise AssertionError(r.stderr)
 return json.loads(r.stdout)
w.edge=lambda actor,action,**fields:edge(actor,action,'plan',**fields)
class ReviewTests(unittest.TestCase):
 setUp=w.PlanTests.setUp
 saved=w.PlanTests.saved;draft=w.PlanTests.draft;reviewed=w.PlanTests.reviewed;approved=w.PlanTests.approved;fund=w.PlanTests.fund;publish=w.PlanTests.publish
 def ok(self,result):self.assertEqual(result['status'],200,result);return result['body']
 def tearDown(self):backup('case-'+self._testMethodName)
 def body(self,notes='new observation'):return dict(publication=dict(version=1,documentSchemaVersion=3),answers=[],comfort=None,actualUseEventIds=[],notes=notes,photoIds=[])
 def submit(self,body=None,revision=0,request=None):return edge(C,'submit_goal_report_v1',requestId=request or str(uuid.uuid4()),expectedReportRevision=revision,body=body or self.body(),occurredOn=dict(state='unknown'))
 def test_01_empty_noop_and_material_goal_report(self):
  self.publish();request=str(uuid.uuid4());empty=self.body(None)
  result=self.ok(self.submit(empty,request=request));self.assertEqual(result['outcome'],'no_op');self.assertEqual(self.ok(self.submit(empty,request=request)),result)
  self.assertEqual(self.ok(edge(C,'request_status_v1',requestId=request)),dict(status='committed',receipt=result));blank=self.body('\u2003 \t\n\ufeff');blank['comfort']='\u00a0\r';self.assertEqual(self.ok(self.submit(blank))['outcome'],'no_op')
  self.assertEqual(q('select count(*) from concierge.checkin_reports'),'0');self.assertEqual(q('select count(*) from concierge.plan_events'),'1')
  r=self.ok(self.submit());self.assertEqual(r['event']['kind'],'goal_report');self.assertEqual(r['revision'],1)
  self.assertEqual(q("select (comfort is null and consistency is null and changes is null)::text from concierge.checkin_reports"),'true')
 def test_02_goal_report_is_in_public_history_with_truthful_actor_and_no_legacy_answers(self):
  self.publish();r=self.ok(self.submit());page=self.ok(edge(C,'read_care_history_v1',cursor=None,limit=100,version=None))
  event=next(x['event'] for x in page['entries'] if x['kind']=='report');self.assertEqual(event['id'],r['event']['id']);self.assertEqual(event['reportedBy'],C);self.assertEqual(event['recordedBy'],C);self.assertEqual(event['body']['answers'],[])
 def test_03_append_amendment_preserves_original_and_actor(self):
  self.publish();report=self.ok(self.submit());rid=report['event']['id'];before=q('select body from concierge.review_goal_reports where report_id='+lit(rid));request=str(uuid.uuid4())
  command=dict(requestId=request,expectedReportRevision=1,event=dict(kind='goal_report',id=rid),expectedAmendmentHeadId=None,replacement=dict(kind='goal_report',body=self.body('corrected observation')),occurredOn=dict(state='unknown'),reason='corrected original wording')
  receipt=self.ok(edge(C,'amend_report_v1',**command));self.assertEqual(receipt['revision'],2);self.assertEqual(self.ok(edge(C,'amend_report_v1',**command)),receipt);self.assertEqual(q('select body from concierge.review_goal_reports where report_id='+lit(rid)),before)
  page=self.ok(edge(C,'read_care_history_v1',cursor=None,limit=100,version=None));entry=next(x for x in page['entries'] if x['kind']=='report_amendment');self.assertEqual(entry['original']['body']['notes'],'new observation');self.assertEqual(entry['amendment']['amendedBy'],C);self.assertEqual(entry['amendment']['replacement']['body']['notes'],'corrected observation')
  self.assertEqual(edge(C,'amend_report_v1',**{**command,'requestId':str(uuid.uuid4()),'expectedReportRevision':2})['status'],409)
 def test_04_private_prep_and_actual_conversation_never_become_client_form_or_public_conclusion(self):
  self.publish();report=self.ok(self.submit());before=q('select count(*) from concierge.plan_events');note=self.ok(edge(A,'append_private_review_note_v1',requestId=str(uuid.uuid4()),clientId=C,reviewEvent=report['event'],note='SYNTHETIC_PRIVATE_PREPARATION'))
  self.assertIsNone(note['notificationEventId']);self.assertEqual(q('select count(*) from concierge.plan_events'),before);self.assertEqual(q('select revision from concierge.care_report_heads where client_id='+lit(C)),'1')
  body=dict(publication=dict(version=1,documentSchemaVersion=3),occurredOn=dict(state='unknown'),channel='call',clientReported=[dict(id='client-fact',text='reported comfort',sources=[])],advisorConclusions=[dict(id='conclusion',text='PRIVATE_ADVISOR_CONCLUSION',sources=[])],agentProposals=[dict(id='proposal',text='PRIVATE_AGENT_PROPOSAL',sources=[],proposedBy=dict(state='unknown'))],contradictions=[])
  self.ok(edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=1,body=body));self.assertEqual(q('select count(*) from concierge.checkin_reports'),'1')
  public=self.ok(edge(C,'read_care_history_v1',cursor=None,limit=100,version=None));self.assertNotIn('PRIVATE',json.dumps(public))
  private=self.ok(edge(A,'read_advisor_care_history_v1',clientId=C,cursor=None,limit=100,version=None));conversation=next(x['event'] for x in private['entries'] if x['kind']=='conversation');self.assertEqual(conversation['reportedBy'],C);self.assertEqual(conversation['recordedBy'],A);self.assertEqual(conversation['body']['channel'],'call');self.assertIn('SYNTHETIC_PRIVATE_PREPARATION',json.dumps(private))
  q('update concierge.advisors set can_edit=false where user_id='+lit(S));self.assertEqual(edge(S,'read_advisor_care_history_v1',clientId=C,cursor=None,limit=100,version=None)['status'],403)
 def test_05_owner_goal_refs_pending_photos_stale_heads_and_cross_family_uuid_fail_closed(self):
  self.publish();request=str(uuid.uuid4());self.ok(self.submit(request=request));self.assertEqual(self.submit(request=request,body=self.body('different'))['status'],409)
  self.assertEqual(edge(D,'submit_goal_report_v1',requestId=str(uuid.uuid4()),expectedReportRevision=0,body=self.body(),occurredOn=dict(state='unknown'))['status'],403)
  self.assertEqual(edge(G,'request_status_v1',requestId=request)['status'],403)
  bad=self.body();bad['answers']=[dict(goalId='not-owned-goal',change='same')];self.assertEqual(self.submit(bad,revision=1)['status'],404)
  bad=self.body();bad['photoIds']=[str(uuid.uuid4())];self.assertEqual(self.submit(bad,revision=1)['status'],409)
  pending=str(uuid.uuid4());q('insert into concierge.checkin_photos(id,client_id,reserved_by,reservation_revision,path,angle,content_type,size_bytes,sha256,state) values('+lit(pending)+','+lit(C)+','+lit(C)+',1,'+lit(C+'/'+pending+'.jpg')+",'front','image/jpeg',1,"+lit('a'*64)+",'pending')")
  bad['photoIds']=[pending];self.assertEqual(self.submit(bad,revision=1)['status'],409);self.assertEqual(q('select count(*) from concierge.checkin_reports'),'1')
  command=dict(schemaVersion=1,action='record_decision_v1',requestId=request,expectedDecisionRevision=0,publicationVersion=1,decisionId='no-addition',choice='approved',reason=None)
  result=raw(w.session(C)+'select public.concierge_plan_command_v1('+lit(json.dumps(command))+'::jsonb);commit;');self.assertNotEqual(result.returncode,0);self.assertIn('concierge_request_conflict',result.stderr);self.assertEqual(q('select count(*) from concierge.plan_decisions'),'0')
  descriptor=dict(name='synthetic self product',brand=dict(state='unknown'),variant=dict(state='unknown'),strength=dict(state='unknown'),sizeLabel=dict(state='unknown'),labelPhotoIds=[])
  result=edge(C,'report_unreviewed_product_v1','care',requestId=request,expectedUseRevision=0,product=descriptor,sourcePublication=None,occurredOn=dict(state='unknown'),channel='portal',acquisition='self');self.assertEqual(result['status'],409);self.assertEqual(result['body']['code'],'request_conflict');self.assertEqual(q('select count(*) from concierge.care_events'),'0')
 def g(self,action,actor=A,**fields):return edge(actor,action,'guidance',**fields)
 def guidance_body(self,report=None):return dict(kind='review',publication=dict(version=1,documentSchemaVersion=3),reportRefs=[report] if report else [],occurredOn=dict(state='unknown'),channel='portal',clientReport='client reported comfort',conclusion='no change',rationale='reviewed the current report and plan',changes=[],nextStep='contact shelv if comfort changes',nextReviewOn=None)
 def test_06_guidance_safe_incomplete_save_and_exact_read(self):
  self.publish();report=self.ok(self.submit());body=self.guidance_body(report['event']);body['conclusion']=''
  receipt=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=C,body=body));draft=receipt['draft'];self.assertEqual(draft['target']['kind'],'review');self.assertTrue(draft['issues']);self.assertIsNone(draft['review']);self.assertEqual(draft['body'],body)
  self.assertEqual(self.ok(self.g('read_guidance_draft_v1',draftId=draft['target']['draftId'])),draft)
  body['conclusion']='no change';saved=self.ok(self.g('save_guidance_draft_v1',requestId=str(uuid.uuid4()),target=draft['target'],body=body));self.assertEqual(saved['draft']['target']['revision'],2);self.assertIsNone(saved['draft']['approval'])
  self.assertEqual(self.g('save_guidance_draft_v1',requestId=str(uuid.uuid4()),target=draft['target'],body=body)['status'],409)
 def test_07_v3_safe_read_and_unseen_guidance_decision_snapshot(self):
  self.publish();view=self.ok(edge(C,'read_client_plan_v3',version=None));self.assertEqual(view['schemaVersion'],3);self.assertEqual(view['currentGuidance']['instructionCount'],0);self.assertEqual(view['currentGuidance']['snapshot']['publication'],dict(version=1,documentSchemaVersion=3))
  snap=view['currentGuidance']['snapshot'];receipt=self.ok(edge(C,'record_decision_v2',requestId=str(uuid.uuid4()),snapshot=snap,expectedDecisionRevision=0,publicationVersion=1,decisionId='no-addition',choice='approved',reason=None));self.assertEqual(receipt['decisionRevision'],1);self.assertEqual(q('select count(*) from concierge.activations'),'0')
  reread=self.ok(edge(C,'read_client_plan_v3',version=1));self.assertEqual(reread['decisionGuidance'][0]['basisStatus'],'current');self.assertEqual(reread['decisionGuidance'][0]['acceptedSnapshot'],snap)
 def test_08_null_client_source_from_other_draft_never_enters_this_conversation(self):
  self.publish();draft=w.write(A,'create_draft_v1',kind='care_plan',templateVersionId=None)['draft'];w.write(A,'assign_draft_v1',draftId=draft['id'],expectedContentRevision=0,expectedAssignmentRevision=0,fromClientId=None,toClientId=D)
  source=str(uuid.uuid4());q('insert into concierge.plan_sources(id,draft_id,version) values('+lit(source)+','+lit(draft['id'])+',1)')
  body=dict(publication=dict(version=1,documentSchemaVersion=3),occurredOn=dict(state='unknown'),channel='call',clientReported=[dict(id='reported',text='synthetic report',sources=[dict(sourceId=source,sourceVersion=1,locator=dict(kind='whole'))])],advisorConclusions=[],agentProposals=[],contradictions=[])
  result=edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=0,body=body);self.assertEqual(result['status'],409);self.assertEqual(result['body']['code'],'source_conflict');self.assertEqual(q('select count(*) from concierge.review_conversations'),'0')
 def guidance(self,body):
  draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=C,body=body))['draft'];target=draft['target'];self.ok(self.g('review_guidance_v1',requestId=str(uuid.uuid4()),target=target));approval=self.ok(self.g('approve_guidance_v1',requestId=str(uuid.uuid4()),target=target,publisher=dict(kind='human',actorId=A),scope=body['kind']+'.publish'))['approval'];return draft,approval
 def test_09_no_change_review_exact_human_publication_once_and_receipt(self):
  self.publish();report=self.ok(self.submit());draft,approval=self.guidance(self.guidance_body(report['event']));before=q("select jsonb_build_object('publications',(select jsonb_agg(to_jsonb(x)) from concierge.publications x),'periods',(select jsonb_agg(to_jsonb(x)) from concierge.service_periods x),'schedule',(select jsonb_agg(to_jsonb(x)) from concierge.plan_review_schedule x),'starts',(select jsonb_agg(to_jsonb(x)) from concierge.activations x))")
  request=str(uuid.uuid4());command=dict(requestId=request,target=draft['target'],approvalId=approval['id'],publisher=dict(kind='human',actorId=A));receipt=self.ok(self.g('publish_guidance_v1',**command));self.assertEqual(receipt['record']['kind'],'review');self.assertEqual(self.ok(self.g('publish_guidance_v1',**command)),receipt)
  self.assertEqual(q('select count(*) from concierge.service_reviews'),'1');self.assertEqual(q('select count(*) from concierge.plan_deliveries where event_id='+lit(receipt['notificationEventId'])),'2')
  self.assertEqual(q("select jsonb_build_object('publications',(select jsonb_agg(to_jsonb(x)) from concierge.publications x),'periods',(select jsonb_agg(to_jsonb(x)) from concierge.service_periods x),'schedule',(select jsonb_agg(to_jsonb(x)) from concierge.plan_review_schedule x),'starts',(select jsonb_agg(to_jsonb(x)) from concierge.activations x))"),before)
  view=self.ok(edge(C,'read_client_plan_v3',version=1));self.assertEqual(view['latestPublicReview']['reviewId'],receipt['record']['id']);self.assertEqual(edge(C,'read_client_plan_v2','care',version=1)['status'],409)
  public=self.ok(edge(C,'read_care_history_v1',cursor=None,limit=100,version=None));review=next(x['guidance'] for x in public['entries'] if x['kind']=='guidance');self.assertEqual(review['publishedBy'],A);self.assertEqual(review['body']['changes'],[])
 def publish_guidance(self,body):
  draft,approval=self.guidance(body);return self.ok(self.g('publish_guidance_v1',requestId=str(uuid.uuid4()),target=draft['target'],approvalId=approval['id'],publisher=dict(kind='human',actorId=A)))
 def history(self,limit=100):
  result=[];cursor=None;seen=set()
  while True:
   page=self.ok(edge(C,'read_care_history_v1',cursor=cursor,limit=limit,version=None));result.extend(page['entries']);cursor=page['nextCursor']
   if cursor is None:return result
   self.assertNotIn(cursor,seen);seen.add(cursor)
 def test_10_all_published_review_attention_and_separate_immutable_resolution_events_paginate(self):
  self.publish();report=self.ok(self.submit());reviews=[self.publish_guidance(self.guidance_body(report['event'])) for _ in range(2)];ids=[x['record']['id'] for x in reviews]
  private_draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=C,body=self.guidance_body(report['event'])))['draft'];self.ok(self.g('review_guidance_v1',requestId=str(uuid.uuid4()),target=private_draft['target']))
  before=q('select jsonb_agg(to_jsonb(x) order by id) from concierge.service_reviews x where id in ('+','.join(map(lit,ids))+')')
  amended=self.ok(edge(C,'amend_report_v1',requestId=str(uuid.uuid4()),expectedReportRevision=1,event=report['event'],expectedAmendmentHeadId=None,replacement=dict(kind='goal_report',body=self.body('corrected comfort')),occurredOn=dict(state='unknown'),reason='clarify the original report'))
  self.assertEqual(q('select count(*) from concierge.review_attention'),'2');entries=self.history(2);flags=[x for x in entries if x['kind']=='review_attention'];self.assertEqual(len(flags),2);self.assertEqual({x['attention']['priorReview']['id'] for x in flags},set(ids));self.assertTrue(all(x['attention']['state']=='unresolved' for x in flags));self.assertEqual(len([x for x in entries if x['kind']=='report_amendment']),1)
  resolved=self.publish_guidance(self.guidance_body(report['event']));entries=self.history(2);flags=[x for x in entries if x['kind']=='review_attention'];self.assertEqual(len(flags),4);self.assertEqual(len({x['eventId'] for x in flags}),4);self.assertEqual(len({x['attention']['id'] for x in flags}),2);self.assertEqual(len([x for x in flags if x['attention']['state']=='unresolved']),2);self.assertTrue(all(x['attention']['resolvedBy']['id']==resolved['record']['id'] for x in flags if x['attention']['state']=='resolved'))
  self.assertEqual(q('select jsonb_agg(to_jsonb(x) order by id) from concierge.service_reviews x where id in ('+','.join(map(lit,ids))+')'),before)
 def test_11_decision_read_provenance_stale_review_and_legacy_read_write_fences_with_no_instructions(self):
  self.publish();report=self.ok(self.submit());v=self.ok(edge(C,'read_client_plan_v3',version=1));snap=v['currentGuidance']['snapshot'];request=str(uuid.uuid4());cmd=dict(requestId=request,snapshot=snap,expectedDecisionRevision=0,publicationVersion=1,decisionId='no-addition',choice='approved',reason=None)
  receipt=self.ok(edge(C,'record_decision_v2',**cmd));v=self.ok(edge(C,'read_client_plan_v3',version=1));self.assertEqual(v['decisionGuidance'][0]['basisStatus'],'current');self.assertEqual(v['decisions'][0]['choice'],'approved')
  q('insert into concierge.service_heads values('+lit(C)+',1) on conflict(client_id) do update set revision=concierge.service_heads.revision+1')
  self.ok(edge(A,'append_private_review_note_v1',requestId=str(uuid.uuid4()),clientId=C,reviewEvent=report['event'],note='private bookkeeping only'))
  v=self.ok(edge(C,'read_client_plan_v3',version=1));self.assertEqual(v['decisionGuidance'][0]['basisStatus'],'current')
  tomorrow=json.loads(q('select concierge.review_snapshot('+lit(C)+",'{\"version\":1,\"documentSchemaVersion\":3}',((clock_timestamp() at time zone 'America/Chicago')::date+1))"));self.assertEqual(tomorrow['manifestHash'],v['currentGuidance']['snapshot']['manifestHash']);self.assertNotEqual(tomorrow['asOfDay'],v['currentGuidance']['snapshot']['asOfDay'])
  self.publish_guidance(self.guidance_body(report['event']));v=self.ok(edge(C,'read_client_plan_v3',version=1));self.assertEqual(v['currentGuidance']['instructionCount'],0);self.assertEqual(v['decisionGuidance'][0]['basisStatus'],'stale');self.assertEqual(v['decisions'][0]['choice'],'approved');self.assertEqual(self.ok(edge(C,'record_decision_v2',**cmd)),receipt)
  for family,action in [('plan','read_client_plan_v1'),('care','read_client_plan_v2')]:self.assertEqual(edge(C,action,family,version=1)['body'],dict(code='guidance_version_required'))
  self.assertEqual(edge(C,'record_decision_v1','plan',requestId=str(uuid.uuid4()),expectedDecisionRevision=1,publicationVersion=1,decisionId='no-addition',choice='approved',reason=None)['body'],dict(code='guidance_version_required'))
  self.assertEqual(edge(C,'record_decision_v2',**{**cmd,'requestId':str(uuid.uuid4())})['status'],409)
 def test_12_latest_v1_same_values_supersedes_v2_and_unreceipted_state_is_unbound(self):
  self.publish();view=self.ok(edge(C,'read_client_plan_v3',version=1));snap=view['currentGuidance']['snapshot'];self.ok(edge(C,'record_decision_v2',requestId=str(uuid.uuid4()),snapshot=snap,expectedDecisionRevision=0,publicationVersion=1,decisionId='no-addition',choice='approved',reason=None))
  self.ok(edge(C,'record_decision_v1','plan',requestId=str(uuid.uuid4()),expectedDecisionRevision=1,publicationVersion=1,decisionId='no-addition',choice='approved',reason=None));view=self.ok(edge(C,'read_client_plan_v3',version=1));meta=view['decisionGuidance'][0];self.assertEqual(meta['basisStatus'],'legacy_unbound');self.assertIsNone(meta['acceptedSnapshot']);self.assertEqual(meta['recordedDecisionRevision'],2)
  q('update concierge.plan_decisions set recorded_at=clock_timestamp() where client_id='+lit(C));view=self.ok(edge(C,'read_client_plan_v3',version=1));self.assertEqual(view['decisionGuidance'][0]['basisStatus'],'legacy_unbound');self.assertIsNone(view['decisionGuidance'][0]['recordedDecisionRevision'])
  self.assertEqual(edge(C,'read_client_plan_v1','plan',version=1)['status'],200);self.assertEqual(edge(C,'read_client_plan_v2','care',version=1)['status'],200)
 def routine_publish(self,product=False):
  prior=w.content;selected={}
  def make():
   b=content();schedule=dict(periods=['morning','evening'],days=dict(kind='daily'),condition=None,asNeeded=False,stages=[],anchor='actual_start',automaticAdvance=False)
   if product:
    p=json.loads((ROOT/'tests/fixtures/concierge-presentation.json').read_text())['presentation']['categoryCards'][0]['currentProduct'];p.update(strength=dict(state='unknown'),category=dict(state='unknown'),identity='unresolved',formula='unknown',factIds=[],guides=[],evidence=[]);b['products']=[p];b['context']['products']=dict(state='recorded',productIds=[p['id']]);b['context']['facts'][0]['text']='a moisturizer is reported';selected['id']=p['id']
   b['routine']=[dict(id='routine',slotId='routine',kind='product' if product else 'instruction',productId=selected.get('id'),title='routine',directions=['original directions'],cautions=[],schedule=schedule)];return b
  w.content=make
  try:self.publish()
  finally:w.content=prior
  return selected.get('id')
 def instruction_body(self,product=None,use=None,day=None,base=None,version=0):return dict(kind='instruction',publication=dict(version=1,documentSchemaVersion=3),slotId='routine',productId=product,baseInstructionId=base,baseInstructionVersion=version,useBasis=use,directions=['reviewed practical directions'],cautions=[],schedule=dict(periods=['morning','evening'],days=dict(kind='daily'),condition=None,asNeeded=False,stages=[],anchor='actual_start',automaticAdvance=False),reason='reviewed instructions',effectiveOn=day or q("select to_char((clock_timestamp() at time zone 'America/Chicago')::date,'YYYY-MM-DD')"),reviewId=None)
 def test_13_future_effective_day_changes_fingerprint_without_permission_time_travel(self):
  self.routine_publish();view=self.ok(edge(C,'read_client_plan_v3',version=1));snap=view['currentGuidance']['snapshot'];request=str(uuid.uuid4());cmd=dict(requestId=request,snapshot=snap,expectedDecisionRevision=0,publicationVersion=1,decisionId='no-addition',choice='approved',reason=None);receipt=self.ok(edge(C,'record_decision_v2',**cmd))
  tomorrow=q("select to_char((clock_timestamp() at time zone 'America/Chicago')::date+1,'YYYY-MM-DD')");self.publish_guidance(self.instruction_body(day=tomorrow));today=self.ok(edge(C,'read_client_plan_v3',version=1));self.assertEqual(today['currentGuidance']['instructionCount'],0);self.assertEqual(today['decisionGuidance'][0]['basisStatus'],'current')
  future=json.loads(q('select concierge.review_snapshot('+lit(C)+",'{\"version\":1,\"documentSchemaVersion\":3}',"+lit(tomorrow)+'::date)'));self.assertNotEqual(future['manifestHash'],today['currentGuidance']['snapshot']['manifestHash']);self.assertEqual(future['instructionHead'],today['currentGuidance']['snapshot']['instructionHead'])
  self.assertEqual(edge(C,'read_client_instruction_manifest_v1',snapshot=future,cursor=None,limit=100)['status'],409);self.assertEqual(self.ok(edge(C,'record_decision_v2',**cmd)),receipt)
  entries=json.loads(q('select jsonb_agg(value) from concierge.review_instruction_entries('+lit(C)+",'{\"version\":1,\"documentSchemaVersion\":3}',"+lit(tomorrow)+'::date) value'));self.assertEqual(len(entries),1);self.assertEqual(entries[0]['effectiveOn'],tomorrow)
 def test_14_exact_product_instruction_unknown_start_pause_and_null_product_bypass(self):
  product=self.routine_publish(True);ref=dict(kind='plan_product',publication=dict(version=1,documentSchemaVersion=3),productId=product,slotId='routine')
  use=self.ok(edge(C,'report_product_use_v1','care',requestId=str(uuid.uuid4()),expectedUseRevision=0,product=ref,change=dict(kind='started'),sourcePublication=ref['publication'],occurredOn=dict(state='unknown'),channel='portal',acquisition='already_owned',identityEventId=None))
  basis=dict(useRevision=1,latestEventId=use['event']['id'],amendmentHeadId=None);receipt=self.publish_guidance(self.instruction_body(product,basis));view=self.ok(edge(C,'read_client_plan_v3',version=1));snap=view['currentGuidance']['snapshot'];manifest=self.ok(edge(C,'read_client_instruction_manifest_v1',snapshot=snap,cursor=None,limit=100));self.assertEqual(manifest['total'],1);item=manifest['items'][0];self.assertEqual(item['originalStart'],dict(state='unknown'))
  detail=self.ok(edge(C,'read_client_instruction_v1',snapshot=snap,instructionId=item['instructionId'],version=item['version'],contentHash=item['contentHash']));self.assertEqual(detail['item']['scope']['productId'],product);self.assertEqual(detail['content']['body']['directions'],['reviewed practical directions']);self.assertEqual(q('select count(*) from concierge.activations'),'0')
  self.assertEqual(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=C,body=self.instruction_body(None,None))['status'],404)
  self.ok(edge(C,'report_product_use_v1','care',requestId=str(uuid.uuid4()),expectedUseRevision=1,product=ref,change=dict(kind='paused',details=None),sourcePublication=ref['publication'],occurredOn=dict(state='unknown'),channel='portal',acquisition='already_owned',identityEventId=None));view=self.ok(edge(C,'read_client_plan_v3',version=1));self.assertEqual(view['use']['planProducts'][0]['state'],'paused');self.assertEqual(view['use']['planProducts'][0]['originalStart'],dict(state='unknown'));self.assertEqual(edge(C,'read_client_instruction_manifest_v1',snapshot=snap,cursor=None,limit=100)['status'],409)
 def test_15_seeded_legacy_history_preserves_unknown_publication_origin_version_and_private_canaries(self):
  prepare()
  q('insert into auth.sessions(id,user_id) select id,id from auth.users;insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values('+lit(A)+',true,true,true,true,true);insert into concierge.plan_principals(actor_id,kind) values('+lit(A)+",'owner');update concierge.plan_policy set activated=true,owner_actor_id="+lit(A)+',revision=1')
  entries=self.history(2);review=next(x for x in entries if x['kind']=='legacy_review');reply=next(x for x in entries if x['kind']=='legacy_reply');instruction=next(x for x in entries if x['kind']=='legacy_instruction')
  self.assertIsNone(review['publication']);self.assertIsNone(reply['publication']);self.assertEqual(review['review']['authorId'],A);self.assertEqual(instruction['revision']['planVersion'],2);self.assertEqual(instruction['revision']['source']['publicationVersion'],1);self.assertNotIn('documentSchemaVersion',instruction['revision']);self.assertNotIn('PRIVATE',json.dumps(entries))
  one=self.ok(edge(C,'read_care_history_v1',cursor=None,limit=100,version=1));two=self.ok(edge(C,'read_care_history_v1',cursor=None,limit=100,version=2));self.assertFalse(any(x['kind'].startswith('legacy_') for x in one['entries']));self.assertTrue(any(x['kind']=='legacy_instruction' for x in two['entries']));self.assertFalse(any(x['kind'] in ('legacy_review','legacy_reply') for x in two['entries']))
  self.assertEqual(len([x for x in entries if x['kind']=='legacy_review']),1);self.assertEqual(len([x for x in entries if x['kind']=='legacy_reply']),1)
  old=self.ok(edge(A,'service_advisor_read','operations',clientId=C));self.assertEqual(old['reviews'][0]['id'],review['review']['id']);self.assertEqual({k:v for k,v in old['instructions'][0].items() if k!='createdAt'},{k:v for k,v in instruction['revision'].items() if k!='createdAt'});self.assertEqual(datetime.datetime.fromisoformat(old['instructions'][0]['createdAt']),datetime.datetime.fromisoformat(instruction['revision']['createdAt']));self.assertEqual(old['privateNotes'][0]['note'],'PRIVATE_LEGACY_REVIEW_NOTE')
  legacy_report=next(x['event'] for x in entries if x['kind']=='report');body=self.guidance_body(dict(kind='legacy_report',id=legacy_report['id']));body['publication']=dict(version=2,documentSchemaVersion=2);private=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=C,body=body))['draft'];self.assertIsNone(private['review'])
  mixed=self.history(1);self.assertEqual(len([x for x in mixed if x['kind']=='legacy_review']),1);self.assertFalse(any(x['kind']=='guidance' for x in mixed));self.assertNotIn('PRIVATE',json.dumps(mixed))
  published=self.publish_guidance(body);mixed=self.history(2);self.assertEqual(len([x for x in mixed if x['kind']=='guidance' and x['guidance']['record']==published['record']]),1);self.assertEqual(len([x for x in mixed if x['kind']=='legacy_review']),1);self.assertNotIn('PRIVATE',json.dumps(mixed))
 def test_16_exact_review_scope_publisher_revocation_and_changed_basis_never_bypass(self):
  self.publish();report=self.ok(self.submit());body=self.guidance_body(report['event']);draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=C,body=body))['draft'];target=draft['target']
  self.assertEqual(self.g('approve_guidance_v1',requestId=str(uuid.uuid4()),target=target,publisher=dict(kind='human',actorId=A),scope='review.publish')['status'],400)
  self.ok(self.g('review_guidance_v1',requestId=str(uuid.uuid4()),target=target));ap=self.ok(self.g('approve_guidance_v1',requestId=str(uuid.uuid4()),target=target,publisher=dict(kind='human',actorId=S),scope='review.publish'))['approval']
  self.assertEqual(self.g('publish_guidance_v1',requestId=str(uuid.uuid4()),target=target,approvalId=ap['id'],publisher=dict(kind='human',actorId=S))['status'],403)
  self.ok(self.g('revoke_guidance_approval_v1',requestId=str(uuid.uuid4()),approvalId=ap['id'],expectedPolicyRevision=1));self.assertEqual(self.g('publish_guidance_v1',actor=S,requestId=str(uuid.uuid4()),target=target,approvalId=ap['id'],publisher=dict(kind='human',actorId=S))['status'],409)
  ap=self.ok(self.g('approve_guidance_v1',requestId=str(uuid.uuid4()),target=target,publisher=dict(kind='human',actorId=A),scope='review.publish'))['approval']
  self.ok(edge(C,'amend_report_v1',requestId=str(uuid.uuid4()),expectedReportRevision=1,event=report['event'],expectedAmendmentHeadId=None,replacement=dict(kind='goal_report',body=self.body('new corrected basis')),occurredOn=dict(state='unknown'),reason='correction'))
  self.assertEqual(self.g('publish_guidance_v1',requestId=str(uuid.uuid4()),target=target,approvalId=ap['id'],publisher=dict(kind='human',actorId=A))['status'],409);self.assertEqual(q('select count(*) from concierge.service_reviews'),'0')
  current=self.ok(self.g('read_guidance_draft_v1',draftId=target['draftId']));self.assertTrue(current['needsRebase']);self.assertIsNone(current['approval']);self.assertIsNone(current['review']);rebased=self.ok(self.g('rebase_guidance_draft_v1',requestId=str(uuid.uuid4()),target=target,expectedBasis=current['currentBasis']))['draft'];self.assertEqual(rebased['body'],body);self.assertEqual(rebased['target']['revision'],2)
 def test_17_deferred_outbox_rollback_and_concurrent_exact_once(self):
  self.publish();report=self.ok(self.submit());draft,ap=self.guidance(self.guidance_body(report['event']));cmd=dict(requestId=str(uuid.uuid4()),target=draft['target'],approvalId=ap['id'],publisher=dict(kind='human',actorId=A));before=q('select count(*) from concierge.plan_events')
  q('insert into concierge.service_heads values('+lit(C)+',40) on conflict(client_id) do update set revision=40')
  q("create function concierge.review_test_fail() returns trigger language plpgsql as $$begin raise exception 'synthetic queue rejection';end$$;create trigger review_test_fail before insert on concierge.plan_deliveries for each row execute function concierge.review_test_fail()")
  try:self.assertEqual(self.g('publish_guidance_v1',**cmd)['status'],503)
  finally:q('drop trigger review_test_fail on concierge.plan_deliveries;drop function concierge.review_test_fail()')
  for table in ['review_guidance_outputs','review_guidance_receipts','service_reviews']:self.assertEqual(q('select count(*) from concierge.'+table),'0')
  self.assertEqual(q('select count(*) from concierge.plan_events'),before);self.assertEqual(self.ok(self.g('request_status_v1',requestId=cmd['requestId'])),dict(status='absent'))
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:self.g('publish_guidance_v1',**cmd),range(2)))
  self.assertTrue(all(x['status']==200 for x in results),results);self.assertEqual(results[0],results[1]);self.assertEqual(q('select count(*) from concierge.service_reviews'),'1');self.assertEqual(q('select count(*) from concierge.review_guidance_receipts'),'1');self.assertEqual(q("select count(*) from concierge.plan_deliveries where status<>'queued' or attempts<>0"),'0')
 def wait_client(self,actor,action,fields,family='review',during=None):
  m=guard();env={**ENV,'PGPASSFILE':m['socket']+'/no-password'};locker=subprocess.Popen([str(PG/'psql'),'-X','-w','-h',m['socket'],'-p',PORT,'-U','postgres','-d',DB,'-At','-v','ON_ERROR_STOP=1'],env=env,text=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  try:
   locker.stdin.write("begin;select pg_advisory_xact_lock(hashtextextended('concierge:client:"+C+"',0));select 'LOCKED';\n");locker.stdin.flush();found=False
   for _ in range(4):
    if locker.stdout.readline().strip()=='LOCKED':found=True;break
   self.assertTrue(found)
   with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    future=pool.submit(edge,actor,action,family,**fields);blocked=False
    for _ in range(80):
     if q("select exists(select 1 from pg_stat_activity where pid<>pg_backend_pid() and wait_event_type='Lock' and query like '%"+fields['requestId']+"%')")=='t':blocked=True;break
     time.sleep(.01)
    self.assertTrue(blocked)
    if during:during(locker)
    else:time.sleep(.65)
    locker.stdin.write('commit;\n');locker.stdin.close();result=future.result(timeout=10)
   locker.wait(timeout=10);error=locker.stderr.read();self.assertEqual(locker.returncode,0,error);return result
  finally:
   if locker.stdin and not locker.stdin.closed:locker.stdin.close()
   locker.wait(timeout=10);locker.stdout.close();locker.stderr.close()

 def test_28_public_review_preserves_actual_publisher_separately_from_private_preparer(self):
  self.publish();report=self.ok(self.submit());draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=C,body=self.guidance_body(report['event'])))['draft'];self.ok(self.g('review_guidance_v1',requestId=str(uuid.uuid4()),target=draft['target']));approval=self.ok(self.g('approve_guidance_v1',requestId=str(uuid.uuid4()),target=draft['target'],publisher=dict(kind='human',actorId=S),scope='review.publish'))['approval']
  before=q('select published_version from concierge.cases where client_id='+lit(C));receipt=self.ok(self.g('publish_guidance_v1',actor=S,requestId=str(uuid.uuid4()),target=draft['target'],approvalId=approval['id'],publisher=dict(kind='human',actorId=S)));entry=next(x['guidance'] for x in self.history() if x['kind']=='guidance' and x['guidance']['record']==receipt['record'])
  self.assertEqual(entry['publishedBy'],S);self.assertEqual(q('select actor_id from concierge.service_reviews where id='+lit(receipt['record']['id'])),S);self.assertEqual(q('select actor_id from concierge.review_guidance_revisions where draft_id='+lit(draft['target']['draftId'])),A);self.assertEqual(q('select published_version from concierge.cases where client_id='+lit(C)),before);self.assertEqual(q('select count(*) from concierge.activations'),'0')
 def test_29_complete_private_source_manifest_101_distinct_dedup_and_live_rights(self):
  self.publish();source=str(uuid.uuid4());q('insert into concierge.plan_sources(id,client_id,version) values('+lit(source)+','+lit(C)+',1);insert into concierge.plan_source_permissions values('+lit(S)+','+lit(source)+')');facts=[]
  for i in range(6):facts.append(dict(id='fact'+str(i),text='PRIVATE_SOURCE_OBSERVATION',sources=[dict(sourceId=source.upper(),sourceVersion=1,locator=dict(kind='text',start=i*20+j,end=i*20+j+1)) for j in range(20 if i<5 else 1)]))
  body=dict(publication=dict(version=1,documentSchemaVersion=3),occurredOn=dict(state='unknown'),channel='call',clientReported=facts,advisorConclusions=[],agentProposals=[],contradictions=[]);conv=self.ok(edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=0,body=body));guidance=self.guidance_body(conv['event']);draft=self.ok(self.g('create_guidance_draft_v1',actor=S,requestId=str(uuid.uuid4()),clientId=C,body=guidance))['draft'];manifest=draft['capturedBasis']['sourceManifest'];self.assertEqual(manifest['count'],101);self.assertNotIn('sources',draft['capturedBasis']);self.assertEqual(self.ok(self.g('read_guidance_draft_v1',actor=S,draftId=draft['target']['draftId']))['capturedBasis']['sourceManifest'],manifest)
  q('delete from concierge.plan_source_permissions where actor_id='+lit(S)+' and source_id='+lit(source));self.assertEqual(self.g('read_guidance_draft_v1',actor=S,draftId=draft['target']['draftId'])['status'],403);self.assertEqual(self.ok(self.g('read_guidance_draft_v1',draftId=draft['target']['draftId']))['capturedBasis']['sourceManifest'],manifest)
  body['clientReported']=[dict(id='Case',text='first exact input',sources=[facts[0]['sources'][0]]),dict(id='case',text='second exact input',sources=[facts[0]['sources'][0]])];duplicate=self.ok(edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=1,body=body));dedup=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=C,body=self.guidance_body(duplicate['event'])))['draft'];self.assertEqual(dedup['capturedBasis']['sourceManifest']['count'],1);self.assertNotEqual(dedup['capturedBasis']['sourceManifest']['hash'],manifest['hash'])
  body['clientReported'][0]['sources'][0]['sourceVersion']=2;self.assertEqual(edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=2,body=body)['status'],409);body['clientReported'][0]['sources'][0]['locator']['kind']='TEXT';self.assertEqual(edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=2,body=body)['status'],400)
 def test_30_source_free_input_identity_and_amendment_heads_remain_bound_without_private_note_staleness(self):
  self.publish();body=dict(publication=dict(version=1,documentSchemaVersion=3),occurredOn=dict(state='unknown'),channel='text',clientReported=[dict(id='exact-input',text='source-free actual observation',sources=[])],advisorConclusions=[],agentProposals=[],contradictions=[]);manifests=[]
  for i in range(2):
   conv=self.ok(edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=i,body=body));draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=C,body=self.guidance_body(conv['event'])))['draft'];manifests.append(draft['capturedBasis']['sourceManifest']);self.assertEqual(manifests[-1]['count'],0)
  empty=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=C,body=self.guidance_body()))['draft']['capturedBasis']['sourceManifest'];self.assertEqual(empty['count'],0);self.assertEqual(len({x['hash'] for x in manifests+[empty]}),3)
  report=self.ok(self.submit(revision=2));draft=self.ok(self.g('create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=C,body=self.guidance_body(report['event'])))['draft'];before=draft['capturedBasis']['sourceManifest'];self.ok(edge(A,'append_private_review_note_v1',requestId=str(uuid.uuid4()),clientId=C,reviewEvent=report['event'],note='PRIVATE_ONLY_PREP'));self.assertEqual(self.ok(self.g('read_guidance_draft_v1',draftId=draft['target']['draftId']))['currentBasis']['sourceManifest'],before)
  self.ok(edge(C,'amend_report_v1',requestId=str(uuid.uuid4()),expectedReportRevision=3,event=report['event'],expectedAmendmentHeadId=None,replacement=dict(kind='goal_report',body=self.body('corrected actual observation')),occurredOn=dict(state='unknown'),reason='clarify original'));after=self.ok(self.g('read_guidance_draft_v1',draftId=draft['target']['draftId']));self.assertTrue(after['needsRebase']);self.assertEqual(after['capturedBasis']['sourceManifest'],before);self.assertNotEqual(after['currentBasis']['sourceManifest']['hash'],before['hash']);self.assertEqual(after['currentBasis']['sourceManifest']['count'],0)
  public=self.history();self.assertNotIn('sourceManifest',json.dumps(public));self.assertNotIn('PRIVATE',json.dumps(public))
 def test_31_source_version_and_deletion_after_wait_deny_original_private_receipt(self):
  self.publish();source=str(uuid.uuid4());q('insert into concierge.plan_sources(id,client_id,version) values('+lit(source)+','+lit(C)+',1);insert into concierge.plan_source_permissions values('+lit(S)+','+lit(source)+')');body=dict(publication=dict(version=1,documentSchemaVersion=3),occurredOn=dict(state='unknown'),channel='text',clientReported=[dict(id='reported',text='PRIVATE_LATE_SOURCE_CANARY',sources=[dict(sourceId=source,sourceVersion=1,locator=dict(kind='whole'))])],advisorConclusions=[],agentProposals=[],contradictions=[]);conv=self.ok(edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=0,body=body));request=str(uuid.uuid4());draft=self.ok(self.g('create_guidance_draft_v1',actor=S,requestId=request,clientId=C,body=self.guidance_body(conv['event'])))['draft'];before=q('select result from concierge.review_requests where request_id='+lit(request))
  for deletion in [False,True]:
   if deletion:q('update concierge.plan_sources set version=1 where id='+lit(source))
   m=guard();locker=subprocess.Popen([str(PG/'psql'),'-X','-w','-h',m['socket'],'-p',PORT,'-U','postgres','-d',DB,'-At','-v','ON_ERROR_STOP=1'],env={**ENV,'PGPASSFILE':m['socket']+'/no-password'},text=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
   try:
    locker.stdin.write('begin;select id from concierge.plan_sources where id='+lit(source)+" for update;select 'LOCKED';\n");locker.stdin.flush()
    for _ in range(4):
     if locker.stdout.readline().strip()=='LOCKED':break
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
     future=pool.submit(self.g,'request_status_v1',actor=S,requestId=request);blocked=False
     for _ in range(80):
      if q("select exists(select 1 from pg_stat_activity where pid<>pg_backend_pid() and wait_event_type='Lock' and query like '%"+request+"%')")=='t':blocked=True;break
      time.sleep(.01)
     self.assertTrue(blocked);locker.stdin.write(('delete from concierge.plan_source_permissions where source_id='+lit(source)+';delete from concierge.plan_sources where id='+lit(source) if deletion else 'update concierge.plan_sources set version=2 where id='+lit(source))+';commit;\n');locker.stdin.close();result=future.result(timeout=10);self.assertEqual(result['status'],409);self.assertEqual(result['body']['code'],'source_conflict');self.assertNotIn('CANARY',json.dumps(result))
   finally:
    if locker.stdin and not locker.stdin.closed:locker.stdin.close()
    locker.wait(timeout=10);locker.stdout.close();locker.stderr.close()
   self.assertEqual(q('select result from concierge.review_requests where request_id='+lit(request)),before)
  self.assertEqual(q('select basis->\'sourceManifest\' from concierge.review_guidance_revisions where draft_id='+lit(draft['target']['draftId'])),q('select result->\'draft\'->\'capturedBasis\'->\'sourceManifest\' from concierge.review_requests where request_id='+lit(request)))
 def test_32_guidance_after_client_wait_rechecks_natural_expiry_and_actual_cancellation(self):
  self.publish();report=self.ok(self.submit());body=self.guidance_body(report['event']);fields=dict(requestId=str(uuid.uuid4()),clientId=C,body=body);q('update auth.sessions set not_after=clock_timestamp()+interval \'0.5 seconds\' where id='+lit(S));expired=self.wait_client(S,'create_guidance_draft_v1',fields,family='guidance');self.assertEqual(expired['status'],401);self.assertEqual(q('select count(*) from concierge.review_guidance_drafts'),'0');q('update auth.sessions set not_after=null where id='+lit(S));fields['requestId']=str(uuid.uuid4())
  def cancel(locker):
   payload=dict(kind='early_departure',supportEndsOn=q("select to_char((clock_timestamp() at time zone 'America/Chicago')::date,'YYYY-MM-DD')"),reason='synthetic confirmed guidance cutoff',confirmedWithClient=True);locker.stdin.write(w.session(A).replace('begin;','')+'select public.concierge_service_write('+lit(C)+",'cancel_service',0,"+lit(uuid.uuid4())+','+lit(json.dumps(payload))+"::jsonb);\n");locker.stdin.flush()
  cancelled=self.wait_client(S,'create_guidance_draft_v1',fields,family='guidance',during=cancel);self.assertEqual(cancelled['status'],403);self.assertEqual(q('select count(*) from concierge.review_guidance_drafts'),'0');self.assertEqual(q('select count(*) from concierge.service_cancellations'),'1')
 def test_33_new_receipts_do_not_block_existing_client_deletion_cascade(self):
  self.publish();report=self.ok(self.submit());self.ok(edge(A,'append_private_review_note_v1',requestId=str(uuid.uuid4()),clientId=C,reviewEvent=report['event'],note='PRIVATE_DELETION_CANARY'));self.publish_guidance(self.guidance_body(report['event']));self.ok(edge(C,'amend_report_v1',requestId=str(uuid.uuid4()),expectedReportRevision=1,event=report['event'],expectedAmendmentHeadId=None,replacement=dict(kind='goal_report',body=self.body('corrected deletion fixture')),occurredOn=dict(state='unknown'),reason='clarification'));self.publish_guidance(self.guidance_body(report['event']));self.assertEqual(q('select count(*) from concierge.review_guidance_receipts'),'2');self.assertEqual(q('select count(*) from concierge.review_attention_events'),'2')
  removed=raw('delete from auth.users where id='+lit(C));self.assertEqual(removed.returncode,0,removed.stderr)
  for table in ['review_goal_reports','review_report_amendments','review_private_notes','review_guidance_drafts','review_guidance_outputs','review_guidance_receipts','review_attention','review_attention_events','review_requests','review_decision_provenance']:self.assertEqual(q('select count(*) from concierge.'+table),'0')
 def test_18_actual_after_wait_session_expiry_and_confirmed_cancellation(self):
  self.publish();q('update auth.sessions set not_after=clock_timestamp()+interval \'0.5 seconds\' where id='+lit(C));cmd=dict(requestId=str(uuid.uuid4()),expectedReportRevision=0,body=self.body(),occurredOn=dict(state='unknown'));result=self.wait_client(C,'submit_goal_report_v1',cmd);self.assertEqual(result['body'],dict(code='session_ended'));self.assertEqual(q('select count(*) from concierge.checkin_reports'),'0')
  q('update auth.sessions set not_after=null where id='+lit(C));cmd['requestId']=str(uuid.uuid4())
  def cancel(locker):
   payload=dict(kind='early_departure',supportEndsOn=q("select to_char((clock_timestamp() at time zone 'America/Chicago')::date,'YYYY-MM-DD')"),reason='synthetic confirmed departure',confirmedWithClient=True)
   locker.stdin.write(w.session(A).replace('begin;','')+'select public.concierge_service_write('+lit(C)+",'cancel_service',0,"+lit(uuid.uuid4())+','+lit(json.dumps(payload))+"::jsonb);\n");locker.stdin.flush()
  result=self.wait_client(C,'submit_goal_report_v1',cmd,during=cancel);self.assertEqual(result['status'],403);self.assertEqual(q('select count(*) from concierge.checkin_reports'),'0');self.assertEqual(q('select count(*) from concierge.service_cancellations'),'1');self.assertEqual(self.ok(edge(C,'read_client_plan_v3',version=1))['access'],'read_only')
 def test_19_role_private_source_cached_receipt_and_readonly_receipt_access(self):
  self.publish();report=self.ok(self.submit());source=str(uuid.uuid4());q('insert into concierge.plan_sources(id,client_id,version) values('+lit(source)+','+lit(C)+',1);insert into concierge.plan_source_permissions values('+lit(S)+','+lit(source)+')')
  conversation=dict(publication=dict(version=1,documentSchemaVersion=3),occurredOn=dict(state='unknown'),channel='text',clientReported=[dict(id='source-fact',text='SYNTHETIC_PRIVATE_SOURCE_CANARY',sources=[dict(sourceId=source,sourceVersion=1,locator=dict(kind='whole'))])],advisorConclusions=[],agentProposals=[],contradictions=[])
  conv=self.ok(edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=1,body=conversation));body=self.guidance_body(conv['event']);request=str(uuid.uuid4());old=self.ok(self.g('create_guidance_draft_v1',actor=S,requestId=request,clientId=C,body=body));before=q('select result from concierge.review_requests where request_id='+lit(request));q('delete from concierge.plan_source_permissions where actor_id='+lit(S)+' and source_id='+lit(source));self.assertEqual(self.g('request_status_v1',actor=S,requestId=request)['status'],403);self.assertEqual(q('select result from concierge.review_requests where request_id='+lit(request)),before)
  q('update concierge.advisors set can_edit=false where user_id='+lit(S));self.assertEqual(edge(S,'read_advisor_care_history_v1',clientId=C,cursor=None,limit=100,version=None)['status'],403);self.assertEqual(edge(S,'read_advisor_publication_v3',clientId=C,version=1)['status'],200)
  view=self.ok(edge(C,'read_client_plan_v3',version=1));snap=view['currentGuidance']['snapshot'];request=str(uuid.uuid4());cmd=dict(requestId=request,snapshot=snap,expectedDecisionRevision=0,publicationVersion=1,decisionId='no-addition',choice='approved',reason=None);receipt=self.ok(edge(C,'record_decision_v2',**cmd))
  q('insert into concierge.service_cancellations(client_id,actor_id,data) values('+lit(C)+','+lit(A)+",jsonb_build_object('supportEndsOn',to_char((clock_timestamp() at time zone 'America/Chicago')::date,'YYYY-MM-DD')))")
  self.assertEqual(self.ok(edge(C,'record_decision_v2',**cmd)),receipt);self.assertEqual(self.ok(edge(C,'request_status_v1',requestId=request))['receipt'],receipt)
 def test_20_after_source_lock_wait_revocation_denies_original_private_status_without_rewriting_it(self):
  self.publish();source=str(uuid.uuid4());q('insert into concierge.plan_sources(id,client_id,version) values('+lit(source)+','+lit(C)+',1);insert into concierge.plan_source_permissions values('+lit(S)+','+lit(source)+')')
  body=dict(publication=dict(version=1,documentSchemaVersion=3),occurredOn=dict(state='unknown'),channel='call',clientReported=[dict(id='private',text='SYNTHETIC_ORIGINAL_PRIVATE_CANARY',sources=[dict(sourceId=source,sourceVersion=1,locator=dict(kind='whole'))])],advisorConclusions=[],agentProposals=[],contradictions=[])
  conv=self.ok(edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=0,body=body));request=str(uuid.uuid4());draft=self.ok(self.g('create_guidance_draft_v1',actor=S,requestId=request,clientId=C,body=self.guidance_body(conv['event'])))['draft'];before=q('select result from concierge.review_requests where request_id='+lit(request))
  clean=self.guidance_body();clean['clientReport']='clean current body';self.ok(self.g('save_guidance_draft_v1',actor=S,requestId=str(uuid.uuid4()),target=draft['target'],body=clean))
  m=guard();locker=subprocess.Popen([str(PG/'psql'),'-X','-w','-h',m['socket'],'-p',PORT,'-U','postgres','-d',DB,'-At','-v','ON_ERROR_STOP=1'],env={**ENV,'PGPASSFILE':m['socket']+'/no-password'},text=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  try:
   locker.stdin.write('begin;select id from concierge.plan_sources where id='+lit(source)+" for update;select 'LOCKED';\n");locker.stdin.flush()
   found=False
   for _ in range(4):
    if locker.stdout.readline().strip()=='LOCKED':found=True;break
   self.assertTrue(found)
   with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    future=pool.submit(self.g,'request_status_v1',actor=S,requestId=request);blocked=False
    for _ in range(80):
     if q("select exists(select 1 from pg_stat_activity where pid<>pg_backend_pid() and wait_event_type='Lock' and query like '%"+request+"%')")=='t':blocked=True;break
     time.sleep(.01)
    self.assertTrue(blocked);locker.stdin.write('delete from concierge.plan_source_permissions where actor_id='+lit(S)+' and source_id='+lit(source)+';commit;\n');locker.stdin.close();result=future.result(timeout=10);self.assertEqual(result['status'],403);self.assertNotIn('CANARY',json.dumps(result))
  finally:
   if locker.stdin and not locker.stdin.closed:locker.stdin.close()
   locker.wait(timeout=10);locker.stdout.close();locker.stderr.close()
  self.assertEqual(q('select result from concierge.review_requests where request_id='+lit(request)),before)
 def test_21_two_decisions_share_counter_without_staling_each_other_and_exact_retry_is_once(self):
  prior=w.content
  def make():
   b=content();second=dict(b['decisions'][0]);second.update(id='second-decision',slotId='second-slot');b['decisions'].append(second);return b
  w.content=make
  try:self.publish()
  finally:w.content=prior
  v=self.ok(edge(C,'read_client_plan_v3',version=1));s=v['currentGuidance']['snapshot'];commands=[dict(requestId=str(uuid.uuid4()),snapshot=s,expectedDecisionRevision=0,publicationVersion=1,decisionId=decision,choice='approved',reason=None) for decision in ['no-addition','second-decision']]
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda cmd:edge(C,'record_decision_v2',**cmd),commands))
  self.assertEqual(sorted(x['status'] for x in results),[200,409]);winner=next(x['body']['decisionId'] for x in results if x['status']==200);other=next(x for x in ['no-addition','second-decision'] if x!=winner);v=self.ok(edge(C,'read_client_plan_v3',version=1));self.assertEqual(len(v['decisionGuidance']),1)
  cmd=dict(requestId=str(uuid.uuid4()),snapshot=v['currentGuidance']['snapshot'],expectedDecisionRevision=1,publicationVersion=1,decisionId=other,choice='approved',reason=None)
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:edge(C,'record_decision_v2',**cmd),range(2)))
  self.assertTrue(all(x['status']==200 for x in results),results);self.assertEqual(results[0],results[1]);v=self.ok(edge(C,'read_client_plan_v3',version=1));self.assertEqual(v['decisionRevision'],2);self.assertEqual(len(v['decisionGuidance']),2);self.assertTrue(all(x['basisStatus']=='current' for x in v['decisionGuidance']));self.assertEqual(q('select count(*) from concierge.activations'),'0')
 def test_22_metadata_acl_rls_search_path_and_finite_direct_null_negatives(self):
  r=subprocess.run([NODE,'--experimental-strip-types','tests/portal-review-sql-metadata.mjs'],cwd=ROOT,env=ENV,text=True,capture_output=True);self.assertEqual(r.returncode,0,r.stderr);data=json.loads(r.stdout);self.assertEqual(json.loads(q('select concierge.review_command_fields()')),data['review']);self.assertEqual(json.loads(q('select concierge.guidance_command_fields()')),data['guidance']);self.assertEqual(json.loads(q('select concierge.review_shapes()')),data['shapes']);self.assertEqual(len(data['review']),15);self.assertEqual(len(data['guidance']),9)
  self.assertEqual(q("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='concierge' and (p.proname like 'review_%' or p.proname='guidance_command_fields') and (has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute') or has_function_privilege('service_role',p.oid,'execute') or not coalesce(p.proconfig @> array['search_path=\"\"'],false))"),'0')
  self.assertEqual(q("select count(*) from pg_class t join pg_namespace n on n.oid=t.relnamespace where n.nspname='concierge' and t.relkind='r' and t.relname like 'review_%' and (not t.relrowsecurity or has_table_privilege('authenticated',t.oid,'select,insert,update,delete') or has_table_privilege('anon',t.oid,'select,insert,update,delete') or has_table_privilege('service_role',t.oid,'select,insert,update,delete'))"),'0')
  for fn in ['concierge_review_command_v1','concierge_guidance_command_v1']:self.assertEqual(q("select has_function_privilege('service_role','public."+fn+"(jsonb)','execute')"),'f')
  for limit in [None,0,101]:
   cmd=dict(schemaVersion=1,action='read_care_history_v1',version=None,cursor=None,limit=limit);result=raw(w.session(C)+'select public.concierge_review_command_v1('+lit(json.dumps(cmd))+'::jsonb);commit;');self.assertIn('concierge_invalid_input',result.stderr)
  (E/'pgtap-availability.json').write_text(json.dumps(dict(available=q("select exists(select 1 from pg_available_extensions where name='pgtap')")=='t',scope='owned native PG15 only; parent canonical lane separate')))
 def test_23_old_checkin_service_fences_and_expired_care_keep_unfinished_admin_reachable(self):
  self.publish();self.assertEqual(edge(C,'client_read','checkins')['status'],200)
  result=edge(C,'submit_report','checkins',requestId=str(uuid.uuid4()),expectedRevision=0,comfort='legacy comfort',consistency='legacy consistency',changes='',photoIds=[]);self.assertEqual(result['status'],409);self.assertEqual(result['body']['code'],'content_version_required');self.assertEqual(q('select count(*) from concierge.checkin_reports'),'0')
  report=self.ok(self.submit());result=edge(C,'client_read','checkins');self.assertEqual(result['status'],409);self.assertEqual(result['body']['code'],'content_version_required');self.publish_guidance(self.guidance_body(report['event']));result=edge(C,'service_client_read','operations');self.assertEqual(result['status'],409);self.assertEqual(result['body']['code'],'concierge_content_version_required')
  # Stored-boundary diagnostic only, not a claim of a genuinely elapsed service history.
  q('insert into concierge.service_cancellations(client_id,actor_id,data) values('+lit(C)+','+lit(A)+",jsonb_build_object('kind','early_departure','supportEndsOn',to_char((clock_timestamp() at time zone 'America/Chicago')::date-30,'YYYY-MM-DD'),'reason','synthetic elapsed boundary','confirmedWithClient',true))")
  self.assertEqual(edge(C,'read_client_plan_v3',version=1)['status'],403);self.assertEqual(edge(C,'read_care_history_v1',cursor=None,limit=100,version=None)['status'],403);admin=self.ok(edge(C,'service_client_read','operations'));self.assertEqual(admin['reviews'],[]);self.assertEqual(admin['instructions'],[])
  q('update concierge.advisors set can_edit=false where user_id='+lit(S));audit=self.ok(edge(S,'read_advisor_publication_v3',clientId=C,version=1));self.assertEqual(audit['clientAccess']['care'],'ended');self.assertFalse(audit['clientAccess']['canRead']);self.assertEqual(edge(S,'read_advisor_care_history_v1',clientId=C,cursor=None,limit=100,version=None)['status'],403)
 def test_24_native_utf8_conversation_byte_limit_and_complete_history_pages(self):
  self.publish();facts=[dict(id='fact'+str(i),text='🧴'*1000,sources=[]) for i in range(50)];body=dict(publication=dict(version=1,documentSchemaVersion=3),occurredOn=dict(state='unknown'),channel='call',clientReported=facts,advisorConclusions=[],agentProposals=[],contradictions=[])
  size=lambda obj:len(json.dumps(obj,separators=(',',':'),ensure_ascii=False).encode());left=250000-size(body)
  for fact in facts:add=min(left,3000);fact['text']+='x'*add;left-=add
  self.assertEqual(left,0);self.assertEqual(size(body),250000);self.assertEqual(int(q('select concierge.review_bytes('+lit(json.dumps(body))+'::jsonb)')),250000)
  for i in range(3):self.ok(edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=i,body=body))
  first=self.ok(edge(A,'read_advisor_care_history_v1',clientId=C,cursor=None,limit=100,version=None));self.assertLess(len(first['entries']),4);self.assertIsNotNone(first['nextCursor']);self.assertLessEqual(size(first),400000);entries=first['entries'];cursor=first['nextCursor']
  while cursor:
   page=self.ok(edge(A,'read_advisor_care_history_v1',clientId=C,cursor=cursor,limit=100,version=None));entries.extend(page['entries']);cursor=page['nextCursor'];self.assertLessEqual(size(page),400000)
  self.assertEqual(len([x for x in entries if x['kind']=='conversation']),3);facts[-1]['text']+='x';self.assertEqual(edge(A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=C,expectedReportRevision=3,body=body)['status'],400)
 def test_25_missing_deferred_receipt_rolls_back_every_output_then_exact_retry_publishes_once(self):
  self.publish();report=self.ok(self.submit());draft,ap=self.guidance(self.guidance_body(report['event']));cmd=dict(requestId=str(uuid.uuid4()),target=draft['target'],approvalId=ap['id'],publisher=dict(kind='human',actorId=A));before=q('select count(*) from concierge.plan_events')
  q('create function concierge.review_test_omit_receipt() returns trigger language plpgsql as $$begin return null;end$$;create trigger review_test_omit_receipt before insert on concierge.review_guidance_receipts for each row execute function concierge.review_test_omit_receipt()')
  try:self.assertEqual(self.g('publish_guidance_v1',**cmd)['status'],503)
  finally:q('drop trigger review_test_omit_receipt on concierge.review_guidance_receipts;drop function concierge.review_test_omit_receipt()')
  for table in ['review_guidance_outputs','review_guidance_receipts','service_reviews']:self.assertEqual(q('select count(*) from concierge.'+table),'0')
  self.assertEqual(q('select count(*) from concierge.plan_events'),before);self.assertEqual(self.ok(self.g('request_status_v1',requestId=cmd['requestId'])),dict(status='absent'))
  receipt=self.ok(self.g('publish_guidance_v1',**cmd));self.assertEqual(self.ok(self.g('publish_guidance_v1',**cmd)),receipt)
  entries=self.history(1);self.assertEqual(len([x for x in entries if x['kind']=='guidance' and x['guidance']['record']==receipt['record']]),1);self.assertFalse(any(x['kind']=='legacy_review' for x in entries))
 def test_26_legacy_review_notes_are_private_unknown_attribution_and_hash_bound_across_pages(self):
  prepare();second=str(uuid.uuid4());third=str(uuid.uuid4());data=dict(channel='text',occurredOn='2026-10-16',summary='second legacy review',reportedUse='second legacy use',decision='no change',nextReviewOn=None)
  q('insert into concierge.service_reviews values('+lit(second)+','+lit(C)+','+lit(json.dumps(data))+','+lit(A)+",'2026-10-16T14:00:00Z');insert into concierge.service_reviews values("+lit(third)+','+lit(C)+','+lit(json.dumps(data))+','+lit(A)+",'2026-10-17T14:00:00Z');insert into concierge.service_review_private values("+lit(second)+",'');insert into auth.users(id) values("+lit(S)+');insert into public.profiles(id) values('+lit(S)+');insert into auth.sessions(id,user_id) select id,id from auth.users;insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values('+lit(A)+',true,true,true,true,true),('+lit(S)+',true,true,false,false,false);insert into concierge.plan_principals(actor_id,kind) values('+lit(A)+",'owner'),("+lit(S)+",'human');update concierge.plan_policy set activated=true,owner_actor_id="+lit(A)+',revision=1')
  entries=[];cursor=None
  while True:
   page=self.ok(edge(A,'read_advisor_care_history_v1',clientId=C,cursor=cursor,limit=1,version=None));entries.extend(page['entries']);cursor=page['nextCursor']
   if cursor is None:break
  notes=[x for x in entries if x['kind']=='legacy_review_note'];self.assertEqual(len(notes),2);self.assertEqual({x['reviewId'] for x in notes},{second,q('select review_id from concierge.service_review_private where note<>\'\'')});self.assertEqual(notes[-1],dict(kind='legacy_review_note',reviewId=second,note=''));self.assertTrue(all(set(x)=={'kind','reviewId','note'} for x in notes))
  public=self.history(1);self.assertFalse(any(x['kind']=='legacy_review_note' for x in public));self.assertNotIn('PRIVATE',json.dumps(public));filtered=self.ok(edge(A,'read_advisor_care_history_v1',clientId=C,cursor=None,limit=100,version=2));self.assertFalse(any(x['kind']=='legacy_review_note' for x in filtered['entries']))
  self.assertEqual(edge(S,'read_advisor_care_history_v1',clientId=C,cursor=None,limit=100,version=None)['status'],403);safe=self.ok(edge(S,'read_advisor_publication_v3',clientId=C,version=2));self.assertNotIn('PRIVATE',json.dumps(safe))
  first=self.ok(edge(A,'read_advisor_care_history_v1',clientId=C,cursor=None,limit=1,version=None));self.assertIsNotNone(first['nextCursor']);q("insert into concierge.service_review_private values("+lit(third)+",'CHANGED_PRIVATE_CANARY')");stale=edge(A,'read_advisor_care_history_v1',clientId=C,cursor=first['nextCursor'],limit=1,version=None);self.assertEqual(stale['status'],409);self.assertEqual(stale['body']['code'],'cursor_conflict');self.assertNotIn('CANARY',json.dumps(stale))
 def test_27_advisor_reported_products_complete_byte_pages_and_live_view_revocation(self):
  self.publish();q('update concierge.advisors set can_edit=false where user_id='+lit(S));fields=dict(clientId=C,cursor=None,limit=100,expectedUseRevision=0,publicationVersion=1);self.assertEqual(self.ok(edge(S,'read_advisor_reported_products_v1',**fields)),dict(revision=0,items=[],nextCursor=None))
  descriptor=dict(name='🧴'*200,brand=dict(state='known',value='🧴'*200),variant=dict(state='known',value='🧴'*200),strength=dict(state='known',value='🧴'*200),sizeLabel=dict(state='known',value='🧴'*200),labelPhotoIds=[])
  sql=''
  for i in range(130):
   cmd=dict(schemaVersion=1,action='report_unreviewed_product_v1',requestId=str(uuid.uuid4()),expectedUseRevision=i,product=descriptor,sourcePublication=None,occurredOn=dict(state='unknown'),channel='portal',acquisition='self');sql+=w.session(C)+'select public.concierge_care_command_v1('+lit(json.dumps(cmd))+'::jsonb);commit;'
  q(sql);fields['expectedUseRevision']=130;view=self.ok(edge(S,'read_advisor_publication_v3',clientId=C,version=1));initial=view['use']['reportedProducts'];self.assertLess(len(initial['items']),100);self.assertIsNotNone(initial['nextCursor']);rows=list(initial['items']);cursor=initial['nextCursor'];pages=1
  first=self.ok(edge(S,'read_advisor_reported_products_v1',**fields));self.assertEqual(first['items'],initial['items']);self.assertEqual(first['nextCursor'],initial['nextCursor']);self.assertEqual(self.ok(edge(S,'read_advisor_reported_products_v1',**{**fields,'publicationVersion':None})),first)
  while cursor:
   page=self.ok(edge(S,'read_advisor_reported_products_v1',**{**fields,'cursor':cursor}));self.assertLessEqual(len(json.dumps(page,separators=(',',':'),ensure_ascii=False).encode()),400000);rows.extend(page['items']);cursor=page['nextCursor'];pages+=1
  self.assertGreater(pages,1);self.assertEqual(len(rows),130);self.assertEqual(len({x['product']['reportedProductId'] for x in rows}),130);self.assertTrue(all(x['state']=='unreviewed' and x['originalStart']==dict(state='unknown') for x in rows));self.assertEqual(q('select count(*) from concierge.activations'),'0')
  for delta,expected in [({'expectedUseRevision':129},409),({'publicationVersion':2},404),({'clientId':D,'publicationVersion':None,'expectedUseRevision':0,'cursor':initial['nextCursor']},409)]:self.assertEqual(edge(S,'read_advisor_reported_products_v1',**{**fields,**delta})['status'],expected)
  self.assertEqual(edge(G,'read_advisor_reported_products_v1',**fields)['status'],403);self.assertEqual(edge(C,'read_advisor_reported_products_v1',**fields)['status'],403)
  q('insert into concierge.service_cancellations(client_id,actor_id,data) values('+lit(C)+','+lit(A)+",jsonb_build_object('kind','early_departure','supportEndsOn',to_char((clock_timestamp() at time zone 'America/Chicago')::date,'YYYY-MM-DD'),'reason','synthetic read-only boundary','confirmedWithClient',true))");self.assertEqual(edge(S,'read_advisor_reported_products_v1',**fields)['status'],200);self.assertEqual(edge(S,'read_advisor_care_history_v1',clientId=C,cursor=None,limit=100,version=None)['status'],403)
  m=guard();locker=subprocess.Popen([str(PG/'psql'),'-X','-w','-h',m['socket'],'-p',PORT,'-U','postgres','-d',DB,'-At','-v','ON_ERROR_STOP=1'],env={**ENV,'PGPASSFILE':m['socket']+'/no-password'},text=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  try:
   locker.stdin.write('begin;select user_id from concierge.advisors where user_id='+lit(S)+" for update;select 'LOCKED';\n");locker.stdin.flush()
   for _ in range(4):
    if locker.stdout.readline().strip()=='LOCKED':break
   with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    future=pool.submit(edge,S,'read_advisor_reported_products_v1',**fields);blocked=False
    for _ in range(80):
     if q("select exists(select 1 from pg_stat_activity where pid<>pg_backend_pid() and wait_event_type='Lock' and query like '%read_advisor_reported_products_v1%')")=='t':blocked=True;break
     time.sleep(.01)
    self.assertTrue(blocked);locker.stdin.write('update concierge.advisors set can_view=false where user_id='+lit(S)+';commit;\n');locker.stdin.close();result=future.result(timeout=10);self.assertEqual(result['status'],403);self.assertNotIn('items',result['body'])
  finally:
   if locker.stdin and not locker.stdin.closed:locker.stdin.close()
   locker.wait(timeout=10);locker.stdout.close();locker.stderr.close()

if __name__=='__main__':
 if '--start' in sys.argv:start()
 elif '--stop' in sys.argv:stop()
 elif '--prepare' in sys.argv:prepare()
 else:guard();unittest.main()
