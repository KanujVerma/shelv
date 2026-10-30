"""Owned Unix-socket-only synthetic PostgreSQL tests, not Auth/PostgREST acceptance.
Requires the dedicated /tmp/shelv-w1-plan-pg server (no parent fixture/credentials).
Run: python3 tests/portal-rebuild-native.py --prepare, then without --prepare.
"""
from pathlib import Path
import concurrent.futures
import json
import os
import subprocess
import sys
import unittest
import uuid

ROOT=Path(__file__).resolve().parents[1]
DB='shelv_w1_plan_v1_synthetic'
SOCKET='/tmp/shelv-w1-plan-pg/socket'
MARKER='W1 plan v1 synthetic Unix socket fixture 20261030'
ENV={k:v for k,v in os.environ.items() if not k.startswith('PG')}
ENV.update(PGPASSFILE='/tmp/shelv-w1-plan-pg/no-password-file',PGSERVICEFILE='/dev/null',PGAPPNAME='shelv-w1-plan-v1')
A,S,G,C,D=[f'10000000-0000-4000-8000-{i:012}' for i in range(1,6)]
def lit(v):return "'"+str(v).replace("'","''")+"'"
def raw(sql,db=DB):return subprocess.run(['psql','-X','-w','-h',SOCKET,'-p','55439','-U','postgres','-d',db,'-At','-v','ON_ERROR_STOP=1'],input=sql,env=ENV,text=True,capture_output=True,timeout=25)
def q(sql):
 r=raw(sql)
 if r.returncode:raise AssertionError(r.stderr)
 return r.stdout.strip()
def session(actor):return f"begin;set local role authenticated;set local request.jwt.claims={lit(json.dumps({'sub':actor,'session_id':actor,'is_anonymous':False}))};"
def invoke(actor,command):return raw(session(actor)+'select public.concierge_plan_command_v1('+lit(json.dumps(dict(schemaVersion=1,**command)))+'::jsonb);commit;')
def call(actor,action,**kwargs):
 r=invoke(actor,dict(action=action,**kwargs))
 if r.returncode:raise AssertionError(r.stderr)
 return json.loads(next(x for x in reversed(r.stdout.splitlines()) if x.startswith(('{','['))))
def write(actor,action,**kwargs):return call(actor,action,requestId=str(uuid.uuid4()),**kwargs)
def prepare():
 prior=raw("select shobj_description(oid,'pg_database') from pg_database where datname="+lit(DB),'postgres')
 assert prior.returncode==0
 if prior.stdout.strip():assert prior.stdout.strip()==MARKER;assert raw('drop database '+DB,'postgres').returncode==0
 assert raw('create database '+DB+" template template0 encoding 'UTF8'",'postgres').returncode==0
 q('comment on database '+DB+' is '+lit(MARKER))
 q("""do $$ begin create role anon;exception when duplicate_object then null;end $$;
 do $$ begin create role authenticated;exception when duplicate_object then null;end $$;
 do $$ begin create role service_role;exception when duplicate_object then null;end $$;
 create schema auth;create schema storage;
 create table auth.users(id uuid primary key,is_anonymous boolean default false,deleted_at timestamptz,banned_until timestamptz,email text);
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users on delete cascade,not_after timestamptz);
 create table public.profiles(id uuid primary key references auth.users on delete cascade,deletion_started_at timestamptz,display_name text);
 create function auth.jwt() returns jsonb language sql stable as $$select current_setting('request.jwt.claims',true)::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 grant usage on schema auth to authenticated;grant execute on function auth.uid(),auth.jwt() to authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb,owner uuid,owner_id text);
 alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 """)
 for path in sorted((ROOT/'supabase/migrations').glob('*concierge*.sql')):
  r=raw(path.read_text())
  if r.returncode:raise AssertionError(path.name+'\n'+r.stderr)
 # Seed historical rows BEFORE the new migration, preserving their exact original bytes and dates.
 q('insert into auth.users(id) values('+lit(A)+'),('+lit(C)+');insert into public.profiles(id) select id from auth.users;insert into concierge.cases(client_id,published_version) values('+lit(C)+',2);insert into concierge.enrollments(client_id,display_name,status) values('+lit(C)+",'historical synthetic','active');")
 q('insert into concierge.intakes values('+lit(C)+",1,'original goal','PRIVATE_LEGACY_NOTE','2026-10-01T10:00:00Z');insert into concierge.publications(client_id,version,intake_version,recommendations,published_at,published_by) values("+lit(C)+",1,1,'[]','2026-10-01T10:00:00Z',"+lit(A)+'),('+lit(C)+",2,1,'[]','2026-10-02T10:00:00Z',"+lit(A)+')')
 presentation=json.loads((ROOT/'tests/fixtures/concierge-presentation.json').read_text())['presentation'];q('insert into concierge.publication_presentations values('+lit(C)+',2,'+lit(json.dumps(presentation))+')')
 quote,claim=str(uuid.uuid4()),str(uuid.uuid4());q('insert into concierge.quotes(id,client_id,version,publication_version,money,created_by) values('+lit(quote)+','+lit(C)+",1,1,'{\"serviceCents\":10000,\"totalCents\":10000}',"+lit(A)+');insert into concierge.claims(id,client_id,quote_id) values('+lit(claim)+','+lit(C)+','+lit(quote)+');insert into concierge.payment_confirmations(claim_id,quote_id,client_id,advisor_id,service_cents,product_cents,total_cents,service_start,service_end) values('+lit(claim)+','+lit(quote)+','+lit(C)+','+lit(A)+",10000,0,10000,'2026-10-01','2026-11-01');insert into concierge.service_periods values("+lit(claim)+','+lit(C)+",'2026-10-01','2026-11-01');insert into concierge.entitled_publications values("+lit(C)+',1,'+lit(claim)+",'2026-10-01'),("+lit(C)+',2,'+lit(claim)+",'2026-10-01');insert into concierge.receipts values("+lit(C)+",'old-slot','old-product','2026-10-03T10:00:00Z');insert into concierge.activations(client_id,version,recommendation_id,slot,product_id,started_on,confirmed_at) values("+lit(C)+",1,'old-decision','old-slot','old-product','2026-10-03','2026-10-04T10:00:00Z')")
 snapshot="select jsonb_build_object('publications',(select jsonb_agg(to_jsonb(p)-'document_schema_version' order by version) from concierge.publications p),'r2',(select jsonb_agg(to_jsonb(p)) from concierge.publication_presentations p),'intakes',(select jsonb_agg(to_jsonb(p)) from concierge.intakes p),'payments',(select jsonb_agg(to_jsonb(p)) from concierge.payment_confirmations p),'periods',(select jsonb_agg(to_jsonb(p)) from concierge.service_periods p),'entitlements',(select jsonb_agg(to_jsonb(p)) from concierge.entitled_publications p),'receipts',(select jsonb_agg(to_jsonb(p)) from concierge.receipts p),'starts',(select jsonb_agg(to_jsonb(p)) from concierge.activations p))::text"
 before=q(snapshot)
 r=raw((ROOT/'supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql').read_text())
 if r.returncode:raise AssertionError(r.stderr)
 assert q(snapshot)==before,'Historical byte/date/identity preservation failed'
 assert q('select count(*) from concierge.plan_principals')=='0';assert q("select (not activated and owner_actor_id is null)::text from concierge.plan_policy")=='true'
 print('Prepared canonical concierge migrations and W1 migration; historical bytes/dates/payments/Starts preserved; zero seeded owner/grants')

def content():return dict(schemaVersion=1,title='gentle care',summary='a comfortable routine',preparation=dict(by=None,on=None),consultationSections=[],routineGuides=[],sources=[],context=dict(products=dict(state='none',factId='none-fact'),facts=[dict(id='none-fact',kind='client_report',visibility='client',text='no current products',sources=[],contradicts=[])]),goals=[dict(id='comfort',text='comfort',factIds=['none-fact'])],products=[],decisions=[],routine=[],followUp=dict(criteria=['contact shelv if uncomfortable'],authoredNotes=[]))
def edge(actor,action,**kwargs):
 env={**ENV,'PATH':'/Users/kanuj/.nvm/versions/node/v22.23.0/bin:'+ENV['PATH']}
 r=subprocess.run(['node','--experimental-strip-types',str(ROOT/'tests/portal-rebuild-native-edge.mjs')],cwd=ROOT,env=env,input=json.dumps(dict(actor=actor,command=dict(schemaVersion=1,action=action,**kwargs))),text=True,capture_output=True,timeout=15)
 if r.returncode:raise AssertionError(r.stderr)
 return json.loads(r.stdout)

class PlanTests(unittest.TestCase):
 def setUp(self):
  self.assertEqual(q("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()"),MARKER)
  q('truncate auth.users cascade;')
  q('insert into auth.users(id) values '+','.join('('+lit(x)+')' for x in [A,S,G,C,D])+';insert into public.profiles(id) select id from auth.users;insert into auth.sessions(id,user_id) select id,id from auth.users;')
  q('insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values '+','.join('('+lit(x)+',true,true,true,true,true)' for x in [A,S])+';insert into concierge.cases(client_id) values ('+lit(C)+'),('+lit(D)+');insert into concierge.enrollments(client_id,display_name,status) values ('+lit(C)+",'synthetic','active'),("+lit(D)+",'synthetic','active');")
  q('insert into concierge.plan_principals(actor_id,kind) values ('+lit(A)+",'owner'),("+lit(S)+",'human'),("+lit(G)+",'agent');update concierge.plan_policy set activated=true,owner_actor_id="+lit(A)+',revision=1,require_kanuj_approval=true;')
 def deny(self,actor,action,code='forbidden',**kwargs):
  r=invoke(actor,dict(action=action,**kwargs));self.assertNotEqual(r.returncode,0,r.stdout);self.assertIn('concierge_'+code,r.stderr)
 def draft(self,actor=A):return write(actor,'create_draft_v1',kind='care_plan',templateVersionId=None)['draft']
 def saved(self):
  d=self.draft();d=write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=0,expectedAssignmentRevision=0,kind='care_plan',content=content())['draft']
  return write(A,'assign_draft_v1',draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=0,fromClientId=None,toClientId=C)
 def reviewed(self):
  v=self.saved();d=v['draft']
  for section in v['sections']:write(A,'review_section_v1',draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=d['assignmentRevision'],sectionId=section['sectionId'],sectionHash=section['sectionHash'])
  return call(A,'read_draft_v1',draftId=d['id'])
 def approved(self,publisher=None):
  v=self.reviewed();a=write(A,'approve_publication_v1',target=v['target'],scope='care_plan.publish',publisher=publisher or dict(kind='human',actorId=A));return v,a
 def fund(self):
  # Existing frozen quote -> claim -> genuine manual confirmation via canonical public RPC.
  q("update concierge.payment_recipient_status set enabled=true,allow_service=true;")
  day=q("select (now() at time zone 'America/Chicago')::date");end=q("select ("+lit(day)+"::date+interval '1 month')::date")
  version=int(q('select published_version from concierge.cases where client_id='+lit(C)));anchor=q('select concierge.service_anchor('+lit(C)+')');period=dict(startOn=anchor,endOn=q('select ('+lit(anchor)+"::date+interval '1 month')::date")) if anchor else None
  payload=dict(publicationVersion=version,serviceCents=10000,servicePeriod=period,items=[],productSubtotalCents=0,taxCents=0,shippingCents=0,productTotalCents=0,totalCents=10000,shippingAddressVersion=None)
  def pay(actor,action,payload,rev):
   r=raw(session(actor)+"select public.concierge_payment_write_v2("+lit(C)+','+lit(action)+','+str(rev)+','+lit(uuid.uuid4())+','+lit(json.dumps(payload))+"::jsonb);commit;")
   if r.returncode:raise AssertionError(r.stderr)
   return json.loads(next(x for x in r.stdout.splitlines() if x.startswith('{')))
  quote=pay(A,'issue_quote',payload,0);qid=quote['quoteId'];option=q('select id from concierge.payment_quote_options where quote_id='+lit(qid)+' limit 1')
  base=dict(quoteId=qid,quoteVersion=1,serviceCents=10000,productCents=0,totalCents=10000,shippingAddressVersion=None,paymentOptionId=option)
  claim=pay(C,'submit_claim',dict(**base,evidenceId=None),1);cid=claim['claimId'];pay(A,'confirm_payment',dict(**base,claimId=cid,receiptVerified=True),2);return cid
 def publish(self):
  v,a=self.approved();claim=self.fund();receipt=write(A,'publish_plan_v1',target=v['target'],approvalId=a['id'],firstServiceClaimId=claim);return v,a,claim,receipt
 def test_01_unassigned_incomplete_and_cas(self):
  d=self.draft();self.assertIsNone(d['clientId']);self.assertEqual(q('select count(*) from auth.users'),'5');self.assertEqual(q('select count(*) from concierge.cases'),'2')
  c=d['content'];c['title']='unfinished';v=write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=0,expectedAssignmentRevision=0,kind='care_plan',content=c)
  self.assertEqual(call(A,'read_draft_v1',draftId=d['id'])['draft']['content'],c)
  self.deny(A,'save_draft_v1','revision_conflict',requestId=str(uuid.uuid4()),draftId=d['id'],expectedContentRevision=0,expectedAssignmentRevision=0,kind='care_plan',content=c)
 def test_02_exact_review_and_payment_are_independent(self):
  v,a=self.approved();self.deny(A,'publish_plan_v1','payment_required',requestId=str(uuid.uuid4()),target=v['target'],approvalId=a['id'],firstServiceClaimId=None)
  claim=self.fund();self.assertEqual(call(A,'read_draft_v1',draftId=v['draft']['id'])['target'],v['target'])
  receipt=write(A,'publish_plan_v1',target=v['target'],approvalId=a['id'],firstServiceClaimId=claim);self.assertTrue(receipt['firstServiceStarted'])
  self.assertEqual(q('select count(*) from concierge.plan_documents'),'1');self.assertEqual(q('select count(*) from concierge.plan_deliveries'),'2');self.assertEqual(q('select count(*) from concierge.activations'),'0')
 def test_03_idempotent_concurrent_publication(self):
  v,a=self.approved();claim=self.fund();cmd=dict(action='publish_plan_v1',requestId=str(uuid.uuid4()),target=v['target'],approvalId=a['id'],firstServiceClaimId=claim)
  with concurrent.futures.ThreadPoolExecutor(2) as pool:results=list(pool.map(lambda _:invoke(A,cmd),range(2)))
  self.assertTrue(all(r.returncode==0 for r in results),[r.stderr for r in results]);self.assertEqual(results[0].stdout,results[1].stdout)
  self.assertEqual(q('select count(*) from concierge.publications'),'1');self.assertEqual(q('select count(*) from concierge.plan_events'),'1');self.assertEqual(q('select count(*) from concierge.service_periods'),'1')
 def test_04_stale_approval_import_and_private_projection(self):
  v,a=self.approved();d=v['draft'];c=content();c['summary']='changed'
  compare=call(A,'compare_import_v1',draftId=d['id'],baseContentRevision=d['contentRevision'],baseAssignmentRevision=d['assignmentRevision'],content=c)
  write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=d['assignmentRevision'],kind='care_plan',content=c)
  self.deny(A,'apply_import_v1','revision_conflict',requestId=str(uuid.uuid4()),draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=d['assignmentRevision'],baseContentRevision=d['contentRevision'],proposalHash=compare['proposalHash'],content=c)
  self.deny(A,'publish_plan_v1','approval_conflict',requestId=str(uuid.uuid4()),target=v['target'],approvalId=a['id'],firstServiceClaimId=None)
 def test_05_agent_same_handler_real_scope_and_revocation(self):
  grant=write(A,'grant_task_v1',agentActorId=G,providerSessionId=G,clientId=C,draftId=None,actions=['create_draft_v1','read_draft_v1','save_draft_v1','assign_draft_v1'],sourceIds=[],expiresAt=q("select to_char((now() at time zone 'UTC')+interval '1 hour','YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')"))
  d=self.draft(G);c=d['content'];c['title']='agent work';write(G,'save_draft_v1',draftId=d['id'],expectedContentRevision=0,expectedAssignmentRevision=0,kind='care_plan',content=c)
  self.deny(G,'assign_draft_v1',requestId=str(uuid.uuid4()),draftId=d['id'],expectedContentRevision=1,expectedAssignmentRevision=0,fromClientId=None,toClientId=D)
  assigned=write(G,'assign_draft_v1',draftId=d['id'],expectedContentRevision=1,expectedAssignmentRevision=0,fromClientId=None,toClientId=C)
  self.assertEqual(assigned['draft']['clientId'],C);self.assertEqual(q('select count(*) from auth.users'),'5')
  write(G,'save_draft_v1',draftId=d['id'],expectedContentRevision=2,expectedAssignmentRevision=1,kind='care_plan',content=c)
  write(A,'revoke_task_v1',grantId=grant['grantId']);self.deny(G,'read_draft_v1',draftId=d['id'])
 def test_06_client_preparation_and_entitlement(self):
  self.saved();self.assertIsNone(call(C,'read_client_plan_v1',version=None)['plan'])
  # Remove only own unpublished synthetic draft, then publish a fresh one.
  q('delete from concierge.plan_drafts');v,a,claim,r=self.publish();view=call(C,'read_client_plan_v1',version=None);self.assertEqual(view['plan']['version'],1);self.assertEqual(view['actualUse'],[])
  q('delete from auth.sessions where id='+lit(C));self.deny(C,'read_client_plan_v1','session_ended',version=None)
 def test_07_legacy_guidance_and_low_level_bypass_denied(self):
  for table,cols,values in [
   ('publications','client_id,version,intake_version,recommendations,published_by',lit(C)+",1,null,'[]',"+lit(A)),
   ('service_reviews','client_id,data,actor_id',lit(C)+",'{}',"+lit(A)),
   ('instruction_publications','client_id,draft_id,version,actor_id',lit(C)+','+lit(uuid.uuid4())+',1,'+lit(A)),
   ('checkin_replies','client_id,report_id,reply,created_by',lit(C)+','+lit(uuid.uuid4())+",'reply',"+lit(A))]:
   r=raw('insert into concierge.'+table+'('+cols+') values('+values+')');self.assertNotEqual(r.returncode,0);self.assertIn('content_version_required',r.stderr)
 def test_08_raw_acl_and_no_seeded_owner(self):
  self.assertEqual(q("select has_table_privilege('authenticated','concierge.plan_draft_private','SELECT')"),'f');self.assertEqual(q("select has_function_privilege('service_role','public.concierge_plan_command_v1(jsonb)','EXECUTE')"),'f')
 def test_09_full_rollback_on_outbox_failure(self):
  v,a=self.approved();claim=self.fund()
  q("create function public.w1_fail_outbox() returns trigger language plpgsql as $$begin raise exception 'synthetic_outbox_failure';end $$;create trigger w1_outbox_failure before insert on concierge.plan_deliveries for each row execute function public.w1_fail_outbox();")
  try:
   r=invoke(A,dict(action='publish_plan_v1',requestId=str(uuid.uuid4()),target=v['target'],approvalId=a['id'],firstServiceClaimId=claim));self.assertIn('synthetic_outbox_failure',r.stderr)
   for table in ['publications','plan_documents','plan_events','plan_publication_receipts','plan_review_schedule','entitled_publications']:self.assertEqual(q('select count(*) from concierge.'+table),'0')
   self.assertEqual(q('select (starts_on is null)::text from concierge.service_periods'),'true');self.assertEqual(q('select published_version from concierge.cases where client_id='+lit(C)),'0')
  finally:q('drop trigger w1_outbox_failure on concierge.plan_deliveries;drop function public.w1_fail_outbox()')
  self.assertEqual(write(A,'publish_plan_v1',target=v['target'],approvalId=a['id'],firstServiceClaimId=claim)['publicationVersion'],1)
 def test_10_legacy_public_rpcs_and_incomplete_v3_linkage(self):
  for name,action in [('concierge_write','publish'),('concierge_presentation_write','publish_v2'),('concierge_service_write','publish_instruction_revision'),('concierge_service_write','record_review'),('concierge_checkin_write','send_advisor_reply')]:
   r=raw(session(A)+'select public.'+name+'('+lit(C)+','+lit(action)+',0,'+lit(uuid.uuid4())+",'{}');commit;");self.assertNotEqual(r.returncode,0);self.assertIn('content_version_required',r.stderr)
  r=raw("insert into concierge.publications(client_id,version,intake_version,recommendations,published_by,document_schema_version) values("+lit(C)+",1,null,'[]',"+lit(A)+',3)');self.assertNotEqual(r.returncode,0);self.assertIn('approval_conflict',r.stderr)
  self.assertEqual(q('select count(*) from concierge.publications'),'0')
 def test_11_policy_human_review_and_reassignment(self):
  v=self.saved();self.deny(G,'review_section_v1',requestId=str(uuid.uuid4()),draftId=v['draft']['id'],expectedContentRevision=2,expectedAssignmentRevision=1,sectionId='context',sectionHash=v['sections'][1]['sectionHash'])
  self.deny(A,'approve_publication_v1','not_ready',requestId=str(uuid.uuid4()),target=v['target'],scope='care_plan.publish',publisher=dict(kind='human',actorId=A))
  for sec in v['sections']:write(S,'review_section_v1',draftId=v['draft']['id'],expectedContentRevision=2,expectedAssignmentRevision=1,sectionId=sec['sectionId'],sectionHash=sec['sectionHash'])
  self.deny(S,'approve_publication_v1',requestId=str(uuid.uuid4()),target=v['target'],scope='care_plan.publish',publisher=dict(kind='human',actorId=S))
  write(A,'set_sami_approval_policy_v1',expectedPolicyRevision=1,requireKanujApproval=False,confirmed=True)
  ap=write(S,'approve_publication_v1',target=v['target'],scope='care_plan.publish',publisher=dict(kind='human',actorId=S))
  write(A,'assign_draft_v1',draftId=v['draft']['id'],expectedContentRevision=2,expectedAssignmentRevision=1,fromClientId=C,toClientId=D)
  self.deny(S,'publish_plan_v1','approval_conflict',requestId=str(uuid.uuid4()),target=v['target'],approvalId=ap['id'],firstServiceClaimId=None)
 def test_12_private_fact_source_projection_and_invalidation(self):
  v=self.saved();d=v['draft'];source=str(uuid.uuid4());q('insert into concierge.plan_sources(id,client_id,version) values('+lit(source)+','+lit(C)+',1)')
  c=content();c['context']['facts'] += [dict(id='private',kind='client_report',visibility='advisor_only',text='PRIVATE_CLINICAL_CANARY',sources=[dict(sourceId=source,sourceVersion=1,locator=dict(kind='text',start=0,end=5))],contradicts=[])]
  c['goals'][0]['factIds'].append('private')
  d=write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=2,expectedAssignmentRevision=1,kind='care_plan',content=c)['draft']
  preview=call(A,'preview_draft_v1',draftId=d['id'],contentRevision=3,assignmentRevision=1);self.assertNotIn('PRIVATE',json.dumps(preview['content']));self.assertNotIn(source,json.dumps(preview['content']));self.assertEqual(preview['content']['goals'][0]['factIds'],['none-fact'])
  before=call(A,'read_draft_v1',draftId=d['id'])['target'];q('update concierge.plan_sources set version=2 where id='+lit(source));after=call(A,'read_draft_v1',draftId=d['id'])['target'];self.assertNotEqual(before['contentHash'],after['contentHash'])
 def test_13_distinct_requests_race_one_approval(self):
  v,a=self.approved();claim=self.fund()
  commands=[dict(action='publish_plan_v1',requestId=str(uuid.uuid4()),target=v['target'],approvalId=a['id'],firstServiceClaimId=claim) for _ in range(2)]
  with concurrent.futures.ThreadPoolExecutor(2) as pool:results=list(pool.map(lambda cmd:invoke(A,cmd),commands))
  self.assertEqual(sum(r.returncode==0 for r in results),1);self.assertTrue(any('approval_conflict' in r.stderr for r in results));self.assertEqual(q('select count(*) from concierge.publications'),'1')
 def test_14_read_only_and_later_publication_preserves_clocks(self):
  v,a,claim,r=self.publish();original=q('select row_to_json(s)::text from concierge.service_periods s');schedule=q('select row_to_json(s)::text from concierge.plan_review_schedule s')
  d=write(A,'restore_publication_v1',clientId=C,publicationVersion=1,expectedWorkingDraftId=None);dr=d['draft']
  for sec in d['sections']:write(A,'review_section_v1',draftId=dr['id'],expectedContentRevision=0,expectedAssignmentRevision=0,sectionId=sec['sectionId'],sectionHash=sec['sectionHash'])
  ap=write(A,'approve_publication_v1',target=d['target'],scope='care_plan.publish',publisher=dict(kind='human',actorId=A));receipt=write(A,'publish_plan_v1',target=d['target'],approvalId=ap['id'],firstServiceClaimId=None)
  self.assertFalse(receipt['firstServiceStarted']);self.assertEqual(receipt['publicationVersion'],2);self.assertEqual(q('select row_to_json(s)::text from concierge.service_periods s'),original);self.assertEqual(q('select row_to_json(s)::text from concierge.plan_review_schedule s'),schedule)
  self.assertEqual(call(C,'read_client_plan_v1',version=1)['plan']['version'],1)
  page=call(A,'list_plans_v1',clientId=C,cursor=None,limit=1);self.assertLessEqual(len(page['drafts'])+len(page['publications']),1)
  q("insert into concierge.service_cancellations(client_id,data,actor_id) values("+lit(C)+",jsonb_build_object('supportEndsOn',(now() at time zone 'America/Chicago')::date),"+lit(A)+')')
  self.assertEqual(call(C,'read_client_plan_v1',version=None)['access'],'read_only')
  self.deny(C,'record_decision_v1',requestId=str(uuid.uuid4()),expectedDecisionRevision=0,publicationVersion=2,decisionId='anything',choice='approved',reason=None)
 def test_15_expiry_after_wait_and_real_session_revocation(self):
  # Hold the existing client advisory namespace, then expire the live session while command waits.
  locker=subprocess.Popen(['psql','-X','-w','-h',SOCKET,'-p','55439','-U','postgres','-d',DB,'-At'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=ENV)
  sql="begin;select pg_advisory_xact_lock(hashtextextended('concierge:client:"+C+"',0));select 'LOCKED';select pg_sleep(0.5);commit;"
  # Session expiry is not a mocked token or role field. Use a short authoritative expiry before the wait.
  q('update auth.sessions set not_after=clock_timestamp()+interval \'300 milliseconds\' where id='+lit(A))
  locker.stdin.write(sql);locker.stdin.close()
  for _ in range(8):
   if locker.stdout.readline().strip()=='LOCKED':break
  else:self.fail('owned lock handshake failed')
  self.deny(A,'list_plans_v1','session_ended',clientId=C,cursor=None,limit=10);locker.wait(timeout=5);locker.stdout.close();locker.stderr.close()
 def test_16_request_receipt_scope_and_cross_stream_collision(self):
  cmd=dict(action='create_draft_v1',requestId=str(uuid.uuid4()),kind='care_plan',templateVersionId=None);r=invoke(A,cmd);self.assertEqual(r.returncode,0,r.stderr)
  status=call(A,'request_status_v1',requestId=cmd['requestId']);self.assertEqual(status['status'],'committed');self.assertEqual(call(S,'request_status_v1',requestId=cmd['requestId'])['status'],'absent')
  r=raw('insert into concierge.workflow_requests values('+lit(A)+','+lit(cmd['requestId'])+','+lit(C)+",'abc'::bytea,'{}')");self.assertIn('request_conflict',r.stderr)
  q('update concierge.plan_principals set active=false where actor_id='+lit(A));self.deny(A,**cmd)
 def test_17_actual_edge_handler_persisted_agent_create_save_assign(self):
  grant=edge(A,'grant_task_v1',requestId=str(uuid.uuid4()),agentActorId=G,providerSessionId=G,clientId=C,draftId=None,actions=['create_draft_v1','read_draft_v1','save_draft_v1','assign_draft_v1'],sourceIds=[],expiresAt=q("select to_char((now() at time zone 'UTC')+interval '1 hour','YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')"));self.assertEqual(grant['status'],200,grant)
  created=edge(G,'create_draft_v1',requestId=str(uuid.uuid4()),kind='care_plan',templateVersionId=None);self.assertEqual(created['status'],200,created);d=created['body']['draft'];self.assertIsNone(d['clientId'])
  c=d['content'];c['title']='agent handler saved';saved=edge(G,'save_draft_v1',requestId=str(uuid.uuid4()),draftId=d['id'],expectedContentRevision=0,expectedAssignmentRevision=0,kind='care_plan',content=c);self.assertEqual(saved['status'],200,saved)
  assigned=edge(G,'assign_draft_v1',requestId=str(uuid.uuid4()),draftId=d['id'],expectedContentRevision=1,expectedAssignmentRevision=0,fromClientId=None,toClientId=C);self.assertEqual(assigned['status'],200,assigned)
  self.assertEqual(q('select client_id from concierge.plan_drafts where id='+lit(d['id'])),C)
  q('delete from auth.sessions where id='+lit(G));self.assertEqual(edge(G,'read_draft_v1',draftId=d['id'])['status'],401)
 def test_18_decision_is_not_start_payment_or_order(self):
  v=self.saved();d=v['draft'];c=content();c['decisions']=[dict(id='no-addition',slotId='care-slot',recommendationId=None,kind='no_addition',goalIds=['comfort'],currentProductIds=[],primaryProductId=None,alternativeProductIds=[],reason='keep care simple',directions=[],cautions=[],limitations=['review comfort'],schedule=None,factIds=[],guidance=dict(title='no addition',subtitle='',rationaleTitle='comfort',reasons=[],actions=[],comparisons=[],factsTitle='',facts=[],how=None,sources=[],group=None,decisionLabels=None))]
  v=write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=2,expectedAssignmentRevision=1,kind='care_plan',content=c);d=v['draft']
  for sec in v['sections']:write(A,'review_section_v1',draftId=d['id'],expectedContentRevision=3,expectedAssignmentRevision=1,sectionId=sec['sectionId'],sectionHash=sec['sectionHash'])
  a=write(A,'approve_publication_v1',target=v['target'],scope='care_plan.publish',publisher=dict(kind='human',actorId=A));claim=self.fund();receipt=edge(A,'publish_plan_v1',requestId=str(uuid.uuid4()),target=v['target'],approvalId=a['id'],firstServiceClaimId=claim);self.assertEqual(receipt['status'],200,receipt)
  before=q('select row_to_json(p)::text from concierge.payment_confirmations p');request=str(uuid.uuid4());decision=edge(C,'record_decision_v1',requestId=request,expectedDecisionRevision=0,publicationVersion=1,decisionId='no-addition',choice='approved',reason=None);self.assertEqual(decision['status'],200,decision)
  self.assertEqual(edge(C,'request_status_v1',requestId=request)['status'],200)
  view=edge(C,'read_client_plan_v1',version=None);self.assertEqual(view['status'],200,view);self.assertEqual(view['body']['decisions'][0]['choice'],'approved');self.assertEqual(view['body']['actualUse'],[])
  self.assertEqual(q('select row_to_json(p)::text from concierge.payment_confirmations p'),before)
  for table in ['activations','receipts','product_orders']:self.assertEqual(q('select count(*) from concierge.'+table),'0')
 def test_19_task_publication_specific_approval_and_revoked_retry(self):
  v=self.reviewed();d=v['draft'];grant=write(A,'grant_task_v1',agentActorId=G,providerSessionId=G,clientId=None,draftId=d['id'],actions=['read_draft_v1','publish_plan_v1'],sourceIds=[],expiresAt=q("select to_char((now() at time zone 'UTC')+interval '1 hour','YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')"))
  ap=write(A,'approve_publication_v1',target=v['target'],scope='care_plan.publish',publisher=dict(kind='task_agent',actorId=G,taskGrantId=grant['grantId']));claim=self.fund();cmd=dict(action='publish_plan_v1',requestId=str(uuid.uuid4()),target=v['target'],approvalId=ap['id'],firstServiceClaimId=claim)
  r=invoke(G,cmd);self.assertEqual(r.returncode,0,r.stderr);self.assertEqual(invoke(G,cmd).stdout,r.stdout)
  write(A,'revoke_task_v1',grantId=grant['grantId']);self.deny(G,**cmd);self.assertEqual(q('select count(*) from concierge.publications'),'1')
 def test_20_outbox_result_never_republishes_and_claim_is_unique(self):
  self.publish()
  with concurrent.futures.ThreadPoolExecutor(2) as pool:results=list(pool.map(lambda _:q('set role service_role;select public.concierge_plan_delivery_claim_v1(5)'),range(2)))
  rows=[json.loads(r.splitlines()[-1]) for r in results];self.assertEqual(sum(len(r) for r in rows),1);job=next(r[0] for r in rows if r)
  result=q('set role service_role;select public.concierge_plan_delivery_result_v1('+lit(job['deliveryId'])+','+lit(job['leaseId'])+",'failed',null,'synthetic_failure')");self.assertIn('failed',result)
  self.assertEqual(q('select count(*) from concierge.publications'),'1');self.assertEqual(q('select count(*) from concierge.plan_events'),'1');self.assertEqual(q('select count(*) from concierge.plan_delivery_attempts'),'1')
  q('set role service_role;select public.concierge_plan_delivery_retry_v1('+lit(job['deliveryId'])+",2,false)")
  retry=json.loads(q('set role service_role;select public.concierge_plan_delivery_claim_v1(1)').splitlines()[-1])[0];self.assertEqual(retry['deliveryId'],job['deliveryId']);self.assertEqual(q('select count(*) from concierge.plan_delivery_attempts'),'2');self.assertEqual(q('select count(*) from concierge.publications'),'1')
 def test_21_import_checkpoint_revoke_and_strict_sql_validation(self):
  v=self.saved();d=v['draft'];c=content();c['summary']='reviewed comparison'
  compared=call(A,'compare_import_v1',draftId=d['id'],baseContentRevision=2,baseAssignmentRevision=1,content=c)
  imported=write(A,'apply_import_v1',draftId=d['id'],expectedContentRevision=2,expectedAssignmentRevision=1,baseContentRevision=2,proposalHash=compared['proposalHash'],content=c);self.assertEqual(imported['draft']['content']['summary'],c['summary'])
  checkpoint=write(A,'checkpoint_draft_v1',draftId=d['id'],expectedContentRevision=3,expectedAssignmentRevision=1,label='before review');self.assertIn('checkpointId',checkpoint)
  malformed=content();malformed['context']['products']={'state':'none','factId':'missing-fact'}
  self.deny(A,'save_draft_v1','invalid_input',requestId=str(uuid.uuid4()),draftId=d['id'],expectedContentRevision=3,expectedAssignmentRevision=1,kind='care_plan',content=malformed)
  malformed=content();malformed['buttonLabel']='publish'
  self.deny(A,'save_draft_v1','invalid_input',requestId=str(uuid.uuid4()),draftId=d['id'],expectedContentRevision=3,expectedAssignmentRevision=1,kind='care_plan',content=malformed)
 def test_22_scoped_source_grant_and_cross_client_assignment(self):
  v=self.saved();d=v['draft'];source=str(uuid.uuid4());q('insert into concierge.plan_sources(id,client_id,version) values('+lit(source)+','+lit(C)+',1)')
  c=content();c['context']['facts'][0]['sources']=[dict(sourceId=source,sourceVersion=1,locator=dict(kind='whole'))]
  d=write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=2,expectedAssignmentRevision=1,kind='care_plan',content=c)['draft']
  grant=write(A,'grant_task_v1',agentActorId=G,providerSessionId=G,clientId=None,draftId=d['id'],actions=['read_draft_v1'],sourceIds=[],expiresAt=q("select to_char((now() at time zone 'UTC')+interval '1 hour','YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')"))
  self.deny(G,'read_draft_v1',draftId=d['id']);write(A,'revoke_task_v1',grantId=grant['grantId'])
  write(A,'grant_task_v1',agentActorId=G,providerSessionId=G,clientId=None,draftId=d['id'],actions=['read_draft_v1'],sourceIds=[source],expiresAt=q("select to_char((now() at time zone 'UTC')+interval '1 hour','YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')"))
  self.assertEqual(call(G,'read_draft_v1',draftId=d['id'])['draft']['id'],d['id'])
  self.deny(A,'assign_draft_v1','source_conflict',requestId=str(uuid.uuid4()),draftId=d['id'],expectedContentRevision=3,expectedAssignmentRevision=1,fromClientId=C,toClientId=D)
 def test_23_legacy_restore_keeps_rich_guidance_and_identity(self):
  # This is a historical format import, not an activated-candidate old publication acceptance.
  q('update concierge.plan_policy set activated=false;insert into concierge.intakes values('+lit(C)+",1,'original comfort goal','PRIVATE_LEGACY_NOTE',now());insert into concierge.publications(client_id,version,intake_version,recommendations,published_by) values("+lit(C)+",1,1,'[]',"+lit(A)+');update concierge.cases set published_version=1 where client_id='+lit(C))
  fixture=json.loads((ROOT/'tests/fixtures/concierge-presentation.json').read_text())['presentation'];q('insert into concierge.publication_presentations values('+lit(C)+',1,'+lit(json.dumps(fixture))+');update concierge.plan_policy set activated=true')
  self.fund();client=edge(C,'read_client_plan_v1',version=1);self.assertEqual(client['status'],200,client);self.assertEqual(client['body']['plan']['documentSchemaVersion'],2);self.assertEqual(client['body']['plan']['legacyOriginal']['presentation'],fixture)
  decision=edge(C,'record_decision_v1',requestId=str(uuid.uuid4()),expectedDecisionRevision=0,publicationVersion=1,decisionId=fixture['categoryCards'][0]['id'],choice='deferred',reason=None);self.assertEqual(decision['status'],200,decision);self.assertEqual(q('select count(*) from concierge.activations'),'0')
  restored=edge(A,'restore_publication_v1',requestId=str(uuid.uuid4()),clientId=C,publicationVersion=1,expectedWorkingDraftId=None);self.assertEqual(restored['status'],200,restored)
  c=restored['body']['draft']['content'];self.assertEqual(c['consultationSections'],fixture['consultationSections']);self.assertEqual(c['routineGuides'],fixture['routineGuides']);self.assertEqual(c['routine'][0]['usage'],fixture['baselineRoutine'][0]['usage']);self.assertEqual(c['decisions'][0]['guidance']['how'],fixture['categoryCards'][0]['how']);self.assertEqual(c['decisions'][0]['id'],fixture['categoryCards'][0]['id'])
 def test_24_unassigned_checkpoint_and_semantic_readiness(self):
  d=self.draft();r=edge(A,'checkpoint_draft_v1',requestId=str(uuid.uuid4()),draftId=d['id'],expectedContentRevision=0,expectedAssignmentRevision=0,label='unfinished');self.assertEqual(r['status'],200,r);self.assertIsNone(r['body']['target'])
  c=content();c['followUp']['criteria']=[''];d=write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=0,expectedAssignmentRevision=0,kind='care_plan',content=c)['draft']
  v=write(A,'assign_draft_v1',draftId=d['id'],expectedContentRevision=1,expectedAssignmentRevision=0,fromClientId=None,toClientId=C)
  self.assertTrue(any(i['code']=='follow_up_required' for i in v['issues']))
  c=content();c['context']['facts'][0]['contradicts']=['other'];c['context']['facts'].append(dict(id='other',kind='client_report',visibility='advisor_only',text='unresolved contradictory context',sources=[],contradicts=[]))
  v=write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=2,expectedAssignmentRevision=1,kind='care_plan',content=c);self.assertTrue(any(i['code']=='contradiction_unresolved' for i in v['issues']))
 def test_25_historical_receipt_retry_dormant_compatibility_only(self):
  # Deliberately prove old setup only while candidate is dormant; it is never new-publication acceptance.
  q('update concierge.plan_policy set activated=false')
  def old(action,payload,rev,request=None):
   request=request or str(uuid.uuid4());name='concierge_advisor_write' if action=='save_intake' else 'concierge_write';r=raw(session(A)+'select public.'+name+'('+lit(C)+','+lit(action)+','+str(rev)+','+lit(request)+','+lit(json.dumps(payload))+');commit;')
   if r.returncode:raise AssertionError(r.stderr)
   return request,r.stdout
  old('save_intake',dict(goal='historical',note='',baseline=[dict(slot='old-slot',productId='old-product')]),0)
  old('save_draft',dict(intakeVersion=1,recommendations=[],advisorNote=''),1)
  request,receipt=old('publish',{},2);self.assertEqual(q('select count(*) from concierge.service_periods'),'0')
  q('update concierge.plan_policy set activated=true');self.assertEqual(old('publish',{},2,request)[1],receipt);self.assertEqual(q('select count(*) from concierge.publications'),'1')
  self.deny(A,'publish_plan_v1','invalid_input',requestId=str(uuid.uuid4()),target={'clientId':C},approvalId=str(uuid.uuid4()),firstServiceClaimId=None)
  q('delete from auth.sessions where id='+lit(A));r=raw(session(A)+'select public.concierge_write('+lit(C)+",'publish',2,"+lit(request)+",'{}');commit;");self.assertIn('session_ended',r.stderr)
 def test_26_two_connection_edits_cannot_overwrite(self):
  d=self.draft();commands=[]
  for title in ['first proposed change','second proposed change']:
   c=d['content'].copy();c['title']=title;commands.append(dict(action='save_draft_v1',requestId=str(uuid.uuid4()),draftId=d['id'],expectedContentRevision=0,expectedAssignmentRevision=0,kind='care_plan',content=c))
  with concurrent.futures.ThreadPoolExecutor(2) as pool:results=list(pool.map(lambda cmd:invoke(A,cmd),commands))
  self.assertEqual(sum(r.returncode==0 for r in results),1);self.assertTrue(any('revision_conflict' in r.stderr for r in results));self.assertEqual(call(A,'read_draft_v1',draftId=d['id'])['draft']['contentRevision'],1)
 def test_27_grant_revocation_committing_during_wait_is_rechecked(self):
  d=self.draft();grant=write(A,'grant_task_v1',agentActorId=G,providerSessionId=G,clientId=None,draftId=d['id'],actions=['read_draft_v1'],sourceIds=[],expiresAt=q("select to_char((now() at time zone 'UTC')+interval '1 hour','YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')"))
  locker=subprocess.Popen(['psql','-X','-w','-h',SOCKET,'-p','55439','-U','postgres','-d',DB,'-At'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=ENV)
  locker.stdin.write('begin;select id from concierge.plan_task_grants where id='+lit(grant['grantId'])+' for update;insert into concierge.plan_task_revocations(grant_id,actor_id) values('+lit(grant['grantId'])+','+lit(A)+");select 'LOCKED';select pg_sleep(0.5);commit;");locker.stdin.close()
  for _ in range(8):
   if locker.stdout.readline().strip()=='LOCKED':break
  else:self.fail('owned grant lock handshake failed')
  self.deny(G,'read_draft_v1',draftId=d['id']);locker.wait(timeout=5);locker.stdout.close();locker.stderr.close()
 def test_28_current_use_projection_preserves_start_history(self):
  # Persist two explicitly historical synthetic Starts; a read must not report both as current use.
  q('update concierge.plan_policy set activated=false;insert into concierge.intakes values('+lit(C)+",1,'comfort','',now());insert into concierge.publications(client_id,version,intake_version,recommendations,published_by) values("+lit(C)+",1,1,'[]',"+lit(A)+'),('+lit(C)+",2,1,'[]',"+lit(A)+');update concierge.cases set published_version=2 where client_id='+lit(C))
  q("insert into concierge.activations(client_id,version,recommendation_id,slot,product_id,started_on) values("+lit(C)+",1,'old-choice','same-slot','old-product',(now() at time zone 'America/Chicago')::date-1),("+lit(C)+",2,'new-choice','same-slot','new-product',(now() at time zone 'America/Chicago')::date);update concierge.plan_policy set activated=true")
  self.fund();view=edge(C,'read_client_plan_v1',version=None);self.assertEqual(view['status'],200,view);self.assertEqual(len(view['body']['actualUse']),1);self.assertEqual(view['body']['actualUse'][0]['productId'],'new-product');self.assertEqual(q('select count(*) from concierge.activations'),'2')
 def test_29_agent_create_cannot_choose_an_ambiguous_client_grant(self):
  for client in [C,D]:write(A,'grant_task_v1',agentActorId=G,providerSessionId=G,clientId=client,draftId=None,actions=['create_draft_v1'],sourceIds=[],expiresAt=q("select to_char((now() at time zone 'UTC')+interval '1 hour','YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')"))
  self.deny(G,'create_draft_v1',requestId=str(uuid.uuid4()),kind='care_plan',templateVersionId=None);self.assertEqual(q('select count(*) from concierge.plan_drafts'),'0')

if __name__=='__main__':
 if '--prepare' in sys.argv:prepare()
 else:unittest.main()
