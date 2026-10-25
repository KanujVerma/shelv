"""R2 synthetic native SQL acceptance. Only the separately marked R2 DB is reset.
No hosted connections, real accounts, JWT gateway or native Storage HTTP.
"""
from pathlib import Path
import importlib.util
import json
import sys
import unittest
import uuid
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('workflow_fixture',Path(__file__).with_name('concierge-workflows.sql.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
DB='derive_disposable_concierge_presentation_20261019_01'
MARKER='Synthetic R2 presentation acceptance fixture only 20261019'
m.DB=DB;m.MARKER=MARKER;m.q.__defaults__=(DB,)
C,D,A,V,N=m.C,m.D,m.A,m.V,m.N
q,ok,lit,call,write=m.q,m.ok,m.lit,m.call,m.write
FIXTURE=Path(__file__).with_name('fixtures')/'concierge-presentation.json'
MIGRATION=Path(__file__).parents[1]/'supabase/migrations/20261019015338_concierge_presentation_r2.sql'

class Presentation(m.Workflows):
 def setUp(self):
  super().setUp();f=json.loads(FIXTURE.read_text());self.p=f['presentation'];self.ip=f['intakePresentation'];self.baseline=f['baseline'];
  if self._testMethodName.startswith('test_r2_'): self.recommendation['id']='moisturizer-v2'
 def v2(self,action,payload,rev,request=None,actor=A):return write(actor,'presentation_write',action,payload,rev,request=request)
 def rich(self):
  self.v2('save_intake_v2',dict(goal='Goal',note='PRIVATE_INTAKE_CANARY',baseline=self.baseline,presentation=self.ip),0)
  self.v2('save_draft_v2',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote='PRIVATE_DRAFT_CANARY',presentation=self.p),1)
  return self.v2('publish_v2',{},2)
 def read(self,actor=C):return call(actor,'concierge_client_view_v2',[]) if actor==C else call(actor,'concierge_advisor_view_v2',[lit(C)])
 def fund(self):return self.claim_confirm(self.issue(),1)
 def test_r2_01_private_draft_atomic_publication_and_public_metadata(self):
  receipt=self.rich();self.assertEqual(receipt['operation'],'publish_v2');self.assertEqual(self.read()['plan'],None)
  advisor=self.read(A);self.assertEqual(advisor['client']['plan']['presentation'],self.p);self.assertIsNone(advisor['draft'])
  self.fund();public=self.read();self.assertEqual(public['plan']['presentation'],self.p)
  self.assertNotIn('PRIVATE_',json.dumps(public));self.assertEqual(len(public['activeRoutine']),4)
  self.assertEqual({x['source']['publicationVersion'] for x in public['activeRoutine']},{1})
  self.assertEqual(ok('select count(*) from concierge.receipts'),'0');self.assertEqual(ok('select count(*) from concierge.activations'),'0')
 def test_r2_02_full_metadata_fingerprint_and_revoked_retry(self):
  request=str(uuid.uuid4());payload=dict(goal='Goal',note='Private',baseline=self.baseline,presentation=self.ip)
  receipt=self.v2('save_intake_v2',payload,0,request);self.assertEqual(self.v2('save_intake_v2',payload,0,request),receipt)
  changed=json.loads(json.dumps(payload));changed['presentation']['consultationSections'][0]['body']='Changed'
  self.deny_write(A,'presentation_write','save_intake_v2',changed,0,'request_conflict',request=request)
  ok('update concierge.advisors set active=false where user_id='+lit(A));self.deny_write(A,'presentation_write','save_intake_v2',payload,0,request=request)
 def test_r2_03_binding_validation_rolls_back_and_legacy_downgrade_fails(self):
  self.v2('save_intake_v2',dict(goal='Goal',note='',baseline=self.baseline,presentation=self.ip),0)
  p=json.loads(json.dumps(self.p));p['categoryCards'][0]['proposedProduct']['id']='mismatch'
  self.deny_write(A,'presentation_write','save_draft_v2',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote='',presentation=p),1,'invalid_input')
  self.assertEqual(ok('select revision from concierge.cases where client_id='+lit(C)),'1')
  self.deny_write(A,'write','save_draft',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote=''),1,'content_version_required')
  self.deny_write(A,'advisor_write','save_intake',dict(goal='Goal',note='',baseline=self.baseline),1,'content_version_required')
  # A private R2 intake/draft must not make an owner's legacy read disclose R2.
  self.assertIsNone(call(C,'concierge_client_view',[])['plan'])
 def test_r2_04_active_instructions_only_change_at_actual_start_and_history_is_immutable(self):
  self.rich();self.fund();before=self.read();original=next(x for x in before['activeRoutine'] if x['slot']=='moisturizer')
  write(C,'write','decide',dict(version=1,recommendationId='moisturizer-v2',choice='approved',reason=''),3)
  write(C,'write','receive',dict(version=1,recommendationId='moisturizer-v2'),4)
  self.assertEqual(next(x for x in self.read()['activeRoutine'] if x['slot']=='moisturizer'),original)
  write(C,'write','start',dict(version=1,recommendationId='moisturizer-v2',startedOn=self.today.isoformat()),5)
  active=next(x for x in self.read()['activeRoutine'] if x['slot']=='moisturizer');self.assertEqual(active['productId'],'replacement');self.assertEqual(active['source']['kind'],'activation')
  p=json.loads(json.dumps(self.p));p['categoryCards'][0]['usage']['instructions']=['Future instructions'];p['baselineRoutine'][1]['usage']['instructions']=['Future baseline']
  self.v2('save_draft_v2',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote='',presentation=p),6)
  self.v2('publish_v2',{},7);view=self.read();self.assertEqual(view['history'][0]['presentation'],self.p);self.assertEqual(next(x for x in view['activeRoutine'] if x['slot']=='moisturizer')['usage'],active['usage'])
  self.assertEqual(next(x for x in view['activeRoutine'] if x['slot']=='cleanser')['source']['publicationVersion'],1)
 def test_r2_05_native_schema_bounds_url_and_grants(self):
  for url in ['javascript:alert(1)','https://127.1/','https://localhost/','https://user:pass@example.com/','https://example.com\\evil/','https://example.com:99999/','https://xn--a.example/','https://project.supabase.co/storage/v1/object/sign/concierge-checkin-photos/owner/photo.png?token=private-token','https://example.com/%63oncierge-payment-evidence/photo.png','https://example.com/p?access_%74oken=secret','https://project.supabase.co/storage/v1/object/folder/%2e%2e/authenticated/customer-skin-photos/private.jpg']:
   p=json.loads(json.dumps(self.ip));p['baselineRoutine'][1]['product']['productUrl']=url
   self.deny_write(A,'presentation_write','save_intake_v2',dict(goal='Goal',note='',baseline=self.baseline,presentation=p),0,'invalid_input')
  self.rich();self.fund();self.denied(C,'concierge_client_view',[],code='content_version_required')
  self.denied(D,'concierge_advisor_view_v2',[lit(C)])
  self.assertEqual(ok("select has_function_privilege('anon','public.concierge_client_view_v2()','execute')"),'f')
  self.assertEqual(ok("select has_table_privilege('authenticated','concierge.publication_presentations','select')"),'f')
  self.assertEqual(ok("select has_table_privilege('service_role','concierge.publication_presentations','insert')"),'f')
  self.assertNotEqual(q('update concierge.publication_presentations set presentation=presentation where client_id='+lit(C)).returncode,0)
  ok('delete from auth.users where id='+lit(C));self.assertEqual(ok('select count(*) from concierge.publication_presentations'),'0')

 def test_r2_06_actual_sql_views_pass_operations_allowlist_mapping(self):
  self.rich();self.fund()
  import subprocess
  root=Path(__file__).parents[1]
  script="""import assert from 'node:assert/strict';import {presentationShape,intakePresentationShape} from './src/contracts/ConciergePresentationValidation.ts';import {handleConciergeRequest} from './supabase/functions/concierge-operations/handler.ts';
  const chunks=[];for await(const chunk of process.stdin)chunks.push(chunk);const v=JSON.parse(Buffer.concat(chunks).toString());assert.deepEqual(v.shapes,{presentation:presentationShape,intake:intakePresentationShape});
  for(const [action,data] of [['client_read_v2',v.client],['advisor_read_v2',v.advisor]]){
   const body={action,...(action==='advisor_read_v2'?{clientId:'10000000-0000-4000-8000-000000000001'}:{})};
   const r=await handleConciergeRequest(new Request('https://example.com/operations',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify(body)}),{allowedOrigins:[],authenticate:async()=>({id:'10000000-0000-4000-8000-000000000003',is_anonymous:false}),rpc:async()=>({data,error:null})});
   if(r.status!==200)throw Error(action+':'+r.status);const text=await r.text();if(action==='client_read_v2'&&text.includes('PRIVATE_'))throw Error('private leak');
  }"""
  result=subprocess.run(['/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node','--experimental-strip-types','--input-type=module','-e',script],cwd=root,input=json.dumps(dict(client=self.read(),advisor=self.read(A),shapes=json.loads(ok("select jsonb_build_object('presentation',concierge.presentation_shape(false),'intake',concierge.presentation_shape(true))")))),text=True,capture_output=True)
  self.assertEqual(result.returncode,0,result.stderr)

 def test_r2_07_publication_failure_rolls_back_sidecar_base_service_and_retry(self):
  self.v2('save_intake_v2',dict(goal='Goal',note='',baseline=self.baseline,presentation=self.ip),0)
  self.v2('save_draft_v2',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote='',presentation=self.p),1)
  # Force metadata persistence failure after base publish to prove transactionality.
  ok("create function concierge.r2_fixture_reject() returns trigger language plpgsql as $$begin raise exception 'synthetic_sidecar_failure';end$$;create trigger r2_fixture_reject before insert on concierge.publication_presentations for each row execute function concierge.r2_fixture_reject()")
  request=str(uuid.uuid4())
  try:
   result=m.invoke(A,'concierge_presentation_write',[lit(C),lit('publish_v2'),'2',lit(request),"'{}'::jsonb"])
   self.assertNotEqual(result.returncode,0);self.assertIn('synthetic_sidecar_failure',result.stderr)
   self.assertEqual(ok('select published_version from concierge.cases where client_id='+lit(C)),'0')
   self.assertEqual(ok('select revision from concierge.cases where client_id='+lit(C)),'2')
   self.assertEqual(ok('select count(*) from concierge.publications'),'0');self.assertEqual(ok('select count(*) from concierge.draft_presentations'),'1')
   self.assertEqual(ok('select count(*) from concierge.requests where request_id='+lit(request)),'0')
  finally:ok('drop trigger r2_fixture_reject on concierge.publication_presentations;drop function concierge.r2_fixture_reject()')
  self.assertEqual(self.v2('publish_v2',{},2,request)['publishedVersion'],1)
 def test_r2_08_simultaneous_exact_publish_and_cross_stream_UUID(self):
  from concurrent.futures import ThreadPoolExecutor
  self.v2('save_intake_v2',dict(goal='Goal',note='',baseline=self.baseline,presentation=self.ip),0)
  self.v2('save_draft_v2',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote='',presentation=self.p),1)
  request=str(uuid.uuid4())
  with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:self.v2('publish_v2',{},2,request),range(2)))
  self.assertEqual(results[0],results[1]);self.assertEqual(ok('select count(*) from concierge.publications'),'1');self.assertEqual(ok('select count(*) from concierge.publication_presentations'),'1')
  self.deny_write(A,'advisor_write','save_meeting_note',dict(kind='notes',text='Other intent'),3,'request_conflict',request=request)
 def test_r2_09_r1_history_survives_r2_and_private_draft_does_not_leak(self):
  self.recommendation['id']='replacement-v1';self.published();self.fund()
  before=ok('select recommendations::text from concierge.publications where version=1')
  p=json.loads(json.dumps(self.p));p['baselineRoutine']=[x for x in p['baselineRoutine'] if x['kind']=='instruction' or x['slot']=='moisturizer'];p['categoryCards']=[x for x in p['categoryCards'] if x['slot'] in ('moisturizer','treatments')];p['categoryCards'][0]['recommendationId']='replacement-v1'
  self.v2('save_draft_v2',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote='PRIVATE',presentation=p),3)
  self.assertEqual(call(C,'concierge_client_view',[])['plan']['version'],1)
  self.assertIsNone(self.read()['plan']['presentation'])
  self.v2('publish_v2',{},4);view=self.read();self.assertIsNone(view['history'][0]['presentation']);self.assertEqual(view['plan']['presentation'],p)
  self.assertEqual(ok('select recommendations::text from concierge.publications where version=1'),before)
  self.denied(C,'concierge_client_view',[],code='content_version_required')
 def test_r2_10_cancelled_retains_rich_snapshot_revoked_denies(self):
  self.rich();self.fund();before=self.read();ok('update concierge.enrollments set status=\'cancelled\' where client_id='+lit(C))
  self.assertEqual(self.read(),before)
  self.deny_write(A,'presentation_write','publish_v2',{},3)
  ok('update concierge.enrollments set status=\'revoked\' where client_id='+lit(C));self.denied(C,'concierge_client_view_v2',[])

 def test_r2_11_authored_ID_cannot_collide_with_generated_activation_ID(self):
  identity=ok("select last_value+case when is_called then 1 else 0 end from concierge.activations_id_seq")
  self.ip['baselineRoutine'][0]['id']='activation-'+identity;self.p['baselineRoutine'][0]['id']='activation-'+identity
  self.rich();self.fund()
  write(C,'write','decide',dict(version=1,recommendationId='moisturizer-v2',choice='approved',reason=''),3)
  write(C,'write','receive',dict(version=1,recommendationId='moisturizer-v2'),4)
  write(C,'write','start',dict(version=1,recommendationId='moisturizer-v2',startedOn=self.today.isoformat()),5)
  active=self.read()['activeRoutine'];self.assertEqual(len({x['id'] for x in active}),len(active))
  self.assertEqual(next(x for x in active if x['slot']=='moisturizer')['id'],self.p['baselineRoutine'][1]['id'])

 def test_r2_12_complete_approved_synthetic_frontend_payload_roundtrips_without_content_loss(self):
  f=json.loads(FIXTURE.with_name('concierge-presentation-approved-synthetic.json').read_text())
  self.p=f['presentation'];self.ip=f['intakePresentation'];self.baseline=f['baseline'];self.recommendation=f['recommendations'][0]
  self.rich();self.fund();view=self.read()
  self.assertEqual(view['plan']['presentation'],f['presentation'])
  self.assertEqual(view['plan']['recommendations'],f['recommendations'])
  self.assertEqual(len(view['plan']['recommendations']),1)
  self.assertEqual([x['kind'] for x in view['plan']['presentation']['categoryCards']],['replace','finish_then_replace','keep','no_addition'])
  self.assertEqual(ok('select count(*) from concierge.activations'),'0')

if __name__=='__main__':
 if '--reset' in sys.argv:
  sys.argv.remove('--reset')
  exists=q('select 1 from pg_database where datname='+lit(DB),'postgres').stdout.strip()=='1'
  if exists:
   assert ok("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()")==MARKER
   assert q('drop database '+DB,'postgres').returncode==0
  assert q('create database '+DB+' template derive_disposable_concierge_workflows_20261018_01','postgres').returncode==0
  assert q('comment on database '+DB+' is '+lit(MARKER),'postgres').returncode==0
 if '--apply' in sys.argv:
  sys.argv.remove('--apply');assert ok("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()")==MARKER
  ok(MIGRATION.read_text())
 unittest.main()
