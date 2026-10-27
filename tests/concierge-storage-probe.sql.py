"""Storage1.80.2 INSERT/rollback/final-write compatibility on native PostgreSQL.

Only --reset replaces this exact marker-verified disposable DB. No hosted calls,
real users, role changes or Storage HTTP service. Existing R1/R2 tests run too.
"""
from pathlib import Path
import importlib.util
import json
import sys
import unittest
import uuid
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('r2_fixture',Path(__file__).with_name('concierge-presentation.sql.py'))
r2=importlib.util.module_from_spec(spec);spec.loader.exec_module(r2)
DB='derive_disposable_concierge_storage_probe_20261019_01'
MARKER='Synthetic concierge Storage1.80.2 probe fixture only 20261019'
TEMPLATE='derive_disposable_concierge_presentation_20261019_01'
r2.DB=DB;r2.MARKER=MARKER;r2.m.DB=DB;r2.m.MARKER=MARKER;r2.m.q.__defaults__=(DB,)
C,D,A=r2.C,r2.D,r2.A
q,ok,lit,call,write=r2.q,r2.ok,r2.lit,r2.call,r2.write
BUCKETS=('concierge-checkin-photos','concierge-payment-evidence')
MAX_BYTES=5242880

class StorageProbe(r2.Presentation):
 def setUp(self):
  super().setUp()
  # Dedicated marker-checked clone only. storage.objects has no auth-user FK,
  # so the inherited synthetic-user reset does not remove old fixture objects.
  ok("delete from storage.objects where bucket_id in ('concierge-checkin-photos','concierge-payment-evidence','probe-unrelated-fixture')")
 def reserve(self,bucket,size=None):
  if bucket==BUCKETS[0]:
   size=45632 if size is None else size
   rev=int(ok('select coalesce((select revision from concierge.checkin_heads where client_id='+lit(C)+'),0)'))
   d=write(C,'checkin_write','reserve_photo',dict(angle='front',contentType='image/png',sizeBytes=size,sha256='a'*64),rev)
   return dict(bucket=bucket,path=d['path'],bytes=size,descriptor=d)
  size=50455 if size is None else size
  self.published();quote=self.issue()
  d=call(C,'concierge_payment_evidence_reserve',[lit(C),lit(uuid.uuid4()),'1',lit(quote['quoteId']),'1',lit('image/png'),str(size),lit('b'*64)])
  return dict(bucket=bucket,path=d['storagePath'],bytes=size,descriptor=d,quote=quote)
 def probe(self,d):return dict(mimetype='image/png',contentLength=d['bytes'])
 def final(self,d):return dict(mimetype='image/png',size=d['bytes'],contentLength=d['bytes'])
 def insert_sql(self,d,metadata,version=None,upsert=False):
  statement='insert into storage.objects(name,bucket_id,metadata,version) values('+','.join([lit(d['path']),lit(d['bucket']),lit(json.dumps(metadata))+'::jsonb',lit(version or uuid.uuid4())])+')'
  if upsert:statement+=' on conflict(name,bucket_id) do update set metadata=excluded.metadata,version=excluded.version'
  return statement+';'
 def execute(self,sql,end='commit',role='service_role'):
  return q('begin;set local role '+role+';'+sql+end+';')
 def assert_ok(self,result):self.assertEqual(result.returncode,0,result.stderr)
 def denied_insert(self,d,metadata,version=None,code='invalid_input'):
  result=self.execute(self.insert_sql(d,metadata,version)+'select \'UNEXPECTED_INSERT\';',end='rollback')
  self.assertNotEqual(result.returncode,0,result.stdout);self.assertIn('concierge_'+code,result.stderr)
 def count(self,d):return int(ok('select count(*) from storage.objects where bucket_id='+lit(d['bucket'])+' and name='+lit(d['path'])))
 def complete(self,d):
  desc=d['descriptor']
  if d['bucket']==BUCKETS[0]:return write(C,'checkin_write','complete_photo',dict(photoId=desc['photoId']),desc['revision'])
  return call(C,'concierge_payment_evidence_commit',[lit(desc['evidenceId']),lit(uuid.uuid4())])
 def test_storage_01_probe_rolls_back_then_final_upsert_commits_and_completes(self):
  for bucket in BUCKETS:
   with self.subTest(bucket=bucket):
    self.setUp();d=self.reserve(bucket)
    result=self.execute(self.insert_sql(d,self.probe(d),'1')+'select \'PROBE_INSERTED\';',end='rollback')
    self.assert_ok(result);self.assertIn('PROBE_INSERTED',result.stdout);self.assertEqual(self.count(d),0)
    self.assert_ok(self.execute(self.insert_sql(d,self.final(d),upsert=True)))
    self.assertEqual(self.count(d),1);self.complete(d)
 def test_storage_02_probe_cannot_commit_even_with_forged_version1(self):
  for bucket in BUCKETS:
   with self.subTest(bucket=bucket):
    self.setUp();d=self.reserve(bucket)
    result=self.execute(self.insert_sql(d,self.probe(d),'1')+'select \'PROBE_INSERTED\';')
    self.assertIn('PROBE_INSERTED',result.stdout);self.assertNotEqual(result.returncode,0);self.assertIn('concierge_invalid_input',result.stderr);self.assertEqual(self.count(d),0)
 def test_storage_03_savepoint_rollback_and_probe_delete_commit(self):
  for bucket in BUCKETS:
   with self.subTest(bucket=bucket):
    self.setUp();d=self.reserve(bucket)
    self.assert_ok(self.execute('savepoint permission_probe;'+self.insert_sql(d,self.probe(d),'1')+'rollback to savepoint permission_probe;'))
    self.assertEqual(self.count(d),0)
    self.assert_ok(self.execute(self.insert_sql(d,self.probe(d),'1')+'delete from storage.objects where name='+lit(d['path'])+';'))
    self.assertEqual(self.count(d),0)
 def test_storage_04_probe_cannot_complete_before_final_size(self):
  for bucket in BUCKETS:
   with self.subTest(bucket=bucket):
    self.setUp();d=self.reserve(bucket);desc=d['descriptor']
    action='select public.concierge_checkin_write('+','.join([lit(C),lit('complete_photo'),str(desc.get('revision',1)),lit(uuid.uuid4()),lit(json.dumps(dict(photoId=desc.get('photoId'))))+'::jsonb'])+');' if bucket==BUCKETS[0] else 'select public.concierge_payment_evidence_commit('+lit(desc['evidenceId'])+','+lit(uuid.uuid4())+');'
    result=self.execute(self.insert_sql(d,self.probe(d),'1')+"select 'PROBE_INSERTED';set local role authenticated;set local request.jwt.claim.sub="+lit(C)+';'+action)
    self.assertIn('PROBE_INSERTED',result.stdout);self.assertNotEqual(result.returncode,0);self.assertIn('concierge_upload_incomplete',result.stderr);self.assertEqual(self.count(d),0)
 def test_storage_05_force_immediate_constraints_cannot_bypass_commit_guard(self):
  d=self.reserve(BUCKETS[0]);result=self.execute(self.insert_sql(d,self.probe(d),'1')+"select 'PROBE_INSERTED';set constraints all immediate;")
  self.assertIn('PROBE_INSERTED',result.stdout);self.assertNotEqual(result.returncode,0);self.assertIn('concierge_invalid_input',result.stderr)
 def test_storage_06_malformed_negative_fractional_huge_or_string_lengths(self):
  for bucket in BUCKETS:
   self.setUp();d=self.reserve(bucket)
   values=[None,False,str(d['bytes']),'NaN','not-a-number',0,-1,d['bytes']+0.5,MAX_BYTES+1,10**50,{},[]]
   for field in ('size','contentLength'):
    for value in values:
     with self.subTest(bucket=bucket,field=field,value=value):
      metadata=self.final(d);metadata[field]=value;self.denied_insert(d,metadata)
   for value in values:
    with self.subTest(bucket=bucket,probe_length=value):self.denied_insert(d,dict(mimetype='image/png',contentLength=value),'1')
 def test_storage_07_missing_or_conflicting_lengths_and_invalid_probe_shapes(self):
  for bucket in BUCKETS:
   self.setUp();d=self.reserve(bucket);valid=self.probe(d)
   for metadata,version in [(valid,str(uuid.uuid4())),(valid,'01'),(dict(mimetype='image/png'),'1'),(dict(valid,size=None),'1'),(dict(valid,extra='unrecognized'),'1'),(dict(contentType='image/png',contentLength=d['bytes']),'1'),(dict(valid,contentEncoding=None),'1'),(dict(valid,contentEncoding=1),'1'),(dict(valid,contentEncoding='bad\r\nheader'),'1'),(dict(valid,contentEncoding='x'*257),'1'),([], '1'),(None,'1')]:
    with self.subTest(bucket=bucket,metadata=metadata,version=version):self.denied_insert(d,metadata,version)
   for field in ('size','contentLength'):
    metadata=self.final(d);metadata[field]+=1;self.denied_insert(d,metadata)
 def test_storage_08_size_only_completed_rows_and_supported_probe_encoding(self):
  for bucket in BUCKETS:
   self.setUp();d=self.reserve(bucket)
   self.assert_ok(self.execute(self.insert_sql(d,dict(self.probe(d),contentEncoding='gzip, br'),'1'),end='rollback'))
   self.assert_ok(self.execute(self.insert_sql(d,dict(mimetype='image/png',size=d['bytes']))));self.complete(d)
 def test_storage_09_wrong_owner_path_purpose_and_mime_stay_forbidden(self):
  for bucket in BUCKETS:
   self.setUp();d=self.reserve(bucket)
   for bad in [dict(d,path=D+'/'+d['path'].split('/',1)[1]),dict(d,path=C+'/'+str(uuid.uuid4())+'.png'),dict(d,bucket=BUCKETS[1] if bucket==BUCKETS[0] else BUCKETS[0]),dict(d,path='not-a-uuid/file.png')]:
    with self.subTest(bucket=bucket,path=bad['path']):self.denied_insert(bad,self.final(d),code='forbidden')
   self.denied_insert(d,dict(self.final(d),mimetype='image/jpeg'))
   result=self.execute(self.insert_sql(d,self.final(d)),role='authenticated');self.assertNotEqual(result.returncode,0);self.assertEqual(self.count(d),0)
 def test_storage_10_probe_does_not_survive_revocation_or_deletion_between_phases(self):
  for bucket in BUCKETS:
   for fence in ('revoked','cancelled','deletion'):
    with self.subTest(bucket=bucket,fence=fence):
     self.setUp();d=self.reserve(bucket);self.assert_ok(self.execute(self.insert_sql(d,self.probe(d),'1'),end='rollback'))
     ok('update public.profiles set deletion_started_at=now() where id='+lit(C) if fence=='deletion' else 'update concierge.enrollments set status='+lit(fence)+' where client_id='+lit(C))
     self.denied_insert(d,self.final(d),code='forbidden')
 def test_storage_11_consumed_reservations_stay_unusable(self):
  for bucket in BUCKETS:
   self.setUp();d=self.reserve(bucket);self.assert_ok(self.execute(self.insert_sql(d,self.final(d))));self.complete(d)
   self.assert_ok(self.execute('delete from storage.objects where name='+lit(d['path'])+';'))
   self.denied_insert(d,self.final(d),code='forbidden')
 def test_storage_12_stale_or_settled_payment_quotes_cannot_upload(self):
  for state in ('superseded','settled'):
   self.setUp();d=self.reserve(BUCKETS[1]);self.assert_ok(self.execute(self.insert_sql(d,self.probe(d),'1'),end='rollback'))
   if state=='superseded':self.issue(revision=1)
   else:self.claim_confirm(d['quote'],1)
   self.denied_insert(d,self.final(d),code='forbidden')
 def test_storage_13_expired_service_refuses_photo_after_successful_probe(self):
  self.paid();d=self.reserve(BUCKETS[0]);self.assert_ok(self.execute(self.insert_sql(d,self.probe(d),'1'),end='rollback'))
  # Privileged synthetic fixture seed only; never modify real periods or triggers.
  ok('delete from concierge.service_periods where client_id='+lit(C))
  ok("insert into concierge.service_periods(claim_id,client_id,starts_on,ends_on) select claim_id,client_id,(now() at time zone 'America/Chicago'-interval '2 months')::date,((now() at time zone 'America/Chicago'-interval '2 months')::date+interval '1 month')::date from concierge.payment_confirmations where client_id="+lit(C))
  self.denied_insert(d,self.final(d),code='forbidden')
 def test_storage_14_private_updates_moves_and_collision_upserts_stay_denied(self):
  for bucket in BUCKETS:
   self.setUp();d=self.reserve(bucket);self.assert_ok(self.execute(self.insert_sql(d,self.final(d))))
   statements=['update storage.objects set metadata=metadata where name='+lit(d['path'])+';','update storage.objects set bucket_id='+lit(BUCKETS[1] if bucket==BUCKETS[0] else BUCKETS[0])+' where name='+lit(d['path'])+';',self.insert_sql(d,self.final(d),upsert=True),self.insert_sql(d,self.probe(d),'1',upsert=True)]
   for sql in statements:
    result=self.execute(sql);self.assertNotEqual(result.returncode,0);self.assertIn('concierge_immutable',result.stderr)
   self.assertEqual(self.count(d),1)
 def test_storage_15_native_cleanup_delete_allowed_after_deletion_fence(self):
  for bucket in BUCKETS:
   self.setUp();d=self.reserve(bucket);self.assert_ok(self.execute(self.insert_sql(d,self.final(d))))
   ok('update public.profiles set deletion_started_at=now() where id='+lit(C))
   self.assert_ok(self.execute('delete from storage.objects where name='+lit(d['path'])+';'));self.assertEqual(self.count(d),0)
 def test_storage_16_raw_private_reads_and_deletes_stay_denied(self):
  d=self.reserve(BUCKETS[0]);self.assert_ok(self.execute(self.insert_sql(d,self.final(d))))
  for role in ('anon','authenticated'):
   for statement in ['select * from storage.objects where name='+lit(d['path'])+';','delete from storage.objects where name='+lit(d['path'])+';']:
    result=self.execute(statement,role=role)
    if result.returncode==0:self.assertNotIn(d['path'],result.stdout)
   self.assertEqual(self.count(d),1)
 def test_storage_17_unrelated_bucket_is_unchanged_and_private_buckets_remain_private(self):
  ok("insert into storage.buckets(id,name,public) values('probe-unrelated-fixture','probe-unrelated-fixture',false) on conflict do nothing")
  d=dict(bucket='probe-unrelated-fixture',path='unrelated',bytes=1);self.assert_ok(self.execute(self.insert_sql(d,dict(size='unchanged'))))
  self.assertEqual(self.count(d),1);self.assertEqual(ok("select bool_and(not public) from storage.buckets where id in ('concierge-checkin-photos','concierge-payment-evidence')"),'t')
 def test_storage_18_probe_delete_then_valid_same_ID_is_not_false_rejected(self):
  d=self.reserve(BUCKETS[0]);oid=str(uuid.uuid4());probe=self.insert_sql(d,self.probe(d),'1').replace('storage.objects(name,bucket_id,metadata,version)','storage.objects(id,name,bucket_id,metadata,version)').replace('values(', 'values('+lit(oid)+',',1)
  final=self.insert_sql(d,self.final(d)).replace('storage.objects(name,bucket_id,metadata,version)','storage.objects(id,name,bucket_id,metadata,version)').replace('values(', 'values('+lit(oid)+',',1)
  self.assert_ok(self.execute(probe+'delete from storage.objects where id='+lit(oid)+';'+final));self.assertEqual(self.count(d),1)
 def test_storage_19_minimum_and_maximum_reserved_lengths_complete(self):
  # Metadata contract only: these are not decoded image/Storage HTTP tests.
  for bucket in BUCKETS:
   for size in (1,MAX_BYTES):
    with self.subTest(bucket=bucket,size=size):
     self.setUp();d=self.reserve(bucket,size)
     self.assert_ok(self.execute(self.insert_sql(d,self.probe(d),'1'),end='rollback'))
     self.assert_ok(self.execute(self.insert_sql(d,self.final(d))));self.complete(d)
 def test_storage_20_new_helpers_are_private_and_constraint_is_deferred(self):
  for role in ('anon','authenticated','service_role'):
   for signature in ('concierge.storage_metadata_bytes(jsonb,text)','concierge.storage_probe_commit_fence()'):
    with self.subTest(role=role,function=signature):self.assertEqual(ok('select has_function_privilege('+lit(role)+','+lit(signature)+',\'execute\')'),'f')
  self.assertEqual(ok("select tgdeferrable and tginitdeferred from pg_trigger where tgrelid='storage.objects'::regclass and tgname='concierge_private_storage_commit_size'"),'t')
  self.assertEqual(ok("select prosecdef and proconfig=array['search_path=\"\"'] from pg_proc where oid='concierge.storage_probe_commit_fence()'::regprocedure"),'t')

if __name__=='__main__':
 if '--reset' in sys.argv:
  sys.argv.remove('--reset');exists=q('select 1 from pg_database where datname='+lit(DB),'postgres').stdout.strip()=='1'
  if exists:
   assert ok("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()")==MARKER
   assert q('drop database '+DB,'postgres').returncode==0
  assert q('create database '+DB+' template '+TEMPLATE,'postgres').returncode==0
  assert q('comment on database '+DB+' is '+lit(MARKER),'postgres').returncode==0
 if '--apply' in sys.argv:
  sys.argv.remove('--apply');assert ok("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()")==MARKER
  migration=sorted((Path(__file__).parents[1]/'supabase/migrations').glob('*_concierge_storage_probe_compat.sql'));assert len(migration)==1
  ok(migration[0].read_text())
 unittest.main()
