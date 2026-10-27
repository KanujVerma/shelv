"""Native PostgreSQL compatibility acceptance in a fresh, Unix-socket-only cluster.
Reuses existing synthetic bootstrap; never connects hosted or shared databases.
"""
from pathlib import Path
import importlib.util,json,sys,uuid
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('isolated_preview',Path(__file__).with_name('preview.sql.py'))
p=importlib.util.module_from_spec(spec);sys.modules[spec.name]=p;spec.loader.exec_module(p)
F=Path(__file__).parents[1]/'source/tests/fixtures/concierge-maya.json'
PROPOSAL=Path(__file__).parents[1]/'proposals/concierge_maya_contract.sql'
without='--without-maya' in sys.argv
if without:sys.argv.remove('--without-maya')
q,ok,lit,call,write=p.q,p.ok,p.lit,p.call,p.write
C,D,A,V,N=p.C,p.D,p.A,p.V,p.N

class Maya(p.Preview):
 denied=p.m.Workflows.denied
 @classmethod
 def setUpClass(cls):
  acl="select jsonb_agg(jsonb_build_array(n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),p.proowner,p.proacl,p.prosecdef,p.proconfig) order by p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('concierge','public')"
  before=ok(acl)
  if not without:ok(PROPOSAL.read_text())
  cls.acl_unchanged=before==ok(acl)
 def setUp(self):
  super().setUp();self.maya=json.loads(F.read_text())
 def read(self,actor=C):return call(actor,'concierge_client_view_v2',[]) if actor==C else call(actor,'concierge_advisor_view_v2',[lit(C)])
 def save_maya(self):
  f=self.maya
  write(A,'presentation_write','save_intake_v2',dict(goal='Synthetic Maya goal',note='PRIVATE_MAYA_INTAKE',baseline=f['baseline'],presentation=f['intakePresentation']),0)
  write(A,'presentation_write','save_draft_v2',dict(intakeVersion=1,recommendations=f['recommendations'],advisorNote='PRIVATE_MAYA_DRAFT',presentation=f['presentation']),1)
 def publish_maya(self):
  self.save_maya();write(A,'presentation_write','publish_v2',{},2)
 def decision(self,item,rev):return write(C,'write','decide',dict(version=1,recommendationId=item['id'],choice='approved',reason=''),rev)
 def test_maya_01_roundtrip_publication_unselected_default_and_no_access_bypass(self):
  self.publish_maya();self.assertIsNone(self.read()['plan']);self.fund();v=self.read()
  self.assertEqual(v['plan']['presentation'],self.maya['presentation']);self.assertNotIn('PRIVATE_',json.dumps(v))
  self.assertEqual(v['orderProposal']['items'],[])
  self.assertTrue(all(s['choice'] is None and not s['received'] and s['startedOn'] is None for s in v['plan']['itemStates']))
  self.assertTrue(self.acl_unchanged,'Migration must preserve every existing owner, ACL, definer mode and search_path')
  # SQL output must pass the actual operations response reconstruction too.
  script="import {mapConciergeClientViewV2} from './source/src/contracts/ConciergePresentationMapping.ts';const chunks=[];for await(const x of process.stdin)chunks.push(x);mapConciergeClientViewV2(JSON.parse(Buffer.concat(chunks).toString()));"
  r=p.subprocess.run([p.NODE,'--experimental-strip-types','--input-type=module','-e',script],cwd=p.ROOT,input=json.dumps(v),text=True,capture_output=True)
  self.assertEqual(r.returncode,0,r.stderr)
 def test_maya_02_bank_funds_receipt_and_explicit_start_use_exact_slots(self):
  self.publish_maya();self.fund();before=self.read()['routine'];rev=3
  for item in self.maya['recommendations']:self.decision(item,rev);rev+=1
  self.assertEqual(self.read()['routine'],before)
  write(C,'payment_write','confirm_shipping_address',dict(address=p.m.Workflows.address(self)),3)
  total=sum(r['priceCents'] for r in self.maya['recommendations'])
  money=dict(publicationVersion=1,serviceCents=0,servicePeriod=None,shippingAddressVersion=1,items=[dict(recommendationId=r['id'],quantity=1,unitPriceCents=r['priceCents'],lineTotalCents=r['priceCents']) for r in self.maya['recommendations']],productSubtotalCents=total,taxCents=0,shippingCents=0,productTotalCents=total,totalCents=total)
  quote=write(A,'payment_write','issue_quote',money,4);receipt,_=p.m.Workflows.claim_confirm(self,quote,5,0,total)
  self.assertEqual(receipt['productOrderStatus'],'ready_to_purchase');self.assertEqual(self.read()['routine'],before)
  for item in self.maya['recommendations']:
   pre=self.read()['routine'];write(C,'write','receive',dict(version=1,recommendationId=item['id']),rev);rev+=1
   self.assertEqual(self.read()['routine'],pre,'Receipt must not activate any product')
   write(C,'write','start',dict(version=1,recommendationId=item['id'],startedOn=self.today.isoformat()),rev);rev+=1
  view=self.read();routine={r['slot']:r['productId'] for r in view['routine']}
  self.assertEqual(routine['makeup-removal'],'cerave-makeup-removing-balm')
  self.assertEqual(routine['cleanser'],'cerave-hydrating-cleanser')
  self.assertEqual(routine['treatments'],'ordinary-azelaic-10')
  self.assertEqual(len(routine),len(self.maya['baseline'])+1)
  active=view['activeRoutine'];self.assertEqual(len([s for s in active if s['slot'] in ['makeup-removal','cleanser']]),2)
  balm=next(s for s in active if s['slot']=='makeup-removal');self.assertNotIn('well-soaked soft pad',json.dumps(balm['guides']))
  self.assertEqual(next(s for s in active if s['slot']=='treatments')['productId'],'ordinary-azelaic-10')
  self.assertTrue(all(s['id'] for s in active));self.assertEqual(len({s['id'] for s in active}),len(active))
 def test_maya_03_renamed_unreceived_optional_requires_fresh_approval(self):
  self.publish_maya();self.fund();item=self.maya['recommendations'][0];self.decision(item,3)
  f=self.maya;item['id']='fresh-optional-obligation';f['presentation']['categoryCards'][0]['recommendationId']=item['id']
  write(A,'presentation_write','save_draft_v2',dict(intakeVersion=1,recommendations=f['recommendations'],advisorNote='',presentation=f['presentation']),4)
  write(A,'presentation_write','publish_v2',{},5)
  state=next(s for s in self.read()['plan']['itemStates'] if s['recommendationId']==item['id'])
  self.assertIsNone(state['choice']);self.assertEqual(self.read()['orderProposal']['items'],[])
 def test_maya_04_invalid_baseline_binding_and_legacy_null_remain_refused(self):
  f=self.maya
  write(A,'presentation_write','save_intake_v2',dict(goal='Goal',note='',baseline=f['baseline'],presentation=f['intakePresentation']),0)
  changed=json.loads(json.dumps(f));changed['presentation']['categoryCards'][0]['currentProduct']['id']='wrong-current';changed['recommendations'][0]['currentProductId']='wrong-current'
  payload=dict(intakeVersion=1,recommendations=changed['recommendations'],advisorNote='',presentation=changed['presentation'])
  p.m.Workflows.deny_write(self,A,'presentation_write','save_draft_v2',payload,1,'invalid_input')
  self.assertEqual(ok('select revision from concierge.cases where client_id='+lit(C)),'1')
  p.m.Workflows.deny_write(self,D,'presentation_write','save_draft_v2',dict(intakeVersion=1,recommendations=f['recommendations'],advisorNote='',presentation=f['presentation']),1)
 def test_maya_05_exact_retry_and_snapshot_survive_later_draft(self):
  self.publish_maya();self.fund();original=self.read()['plan']['presentation']
  f=self.maya;f['presentation']['title']='Synthetic later draft';request=str(uuid.uuid4())
  payload=dict(intakeVersion=1,recommendations=f['recommendations'],advisorNote='',presentation=f['presentation'])
  first=write(A,'presentation_write','save_draft_v2',payload,3,request=request)
  self.assertEqual(first,write(A,'presentation_write','save_draft_v2',payload,3,request=request))
  self.assertEqual(self.read()['plan']['presentation'],original)
 def test_maya_06_failed_sidecar_save_rolls_back_draft_revision_and_request(self):
  f=self.maya
  write(A,'presentation_write','save_intake_v2',dict(goal='Goal',note='',baseline=f['baseline'],presentation=f['intakePresentation']),0)
  ok("create function concierge.maya_fixture_reject() returns trigger language plpgsql as $$begin raise exception 'concierge_synthetic_sidecar_failure';end$$;create trigger maya_fixture_reject before insert on concierge.draft_presentations for each row execute function concierge.maya_fixture_reject()")
  payload=dict(intakeVersion=1,recommendations=f['recommendations'],advisorNote='',presentation=f['presentation']);request=str(uuid.uuid4())
  try:
   p.m.Workflows.deny_write(self,A,'presentation_write','save_draft_v2',payload,1,'synthetic_sidecar_failure',request=request)
   self.assertEqual(ok('select revision from concierge.cases where client_id='+lit(C)),'1')
   self.assertEqual(ok('select count(*) from concierge.drafts'),'0')
   self.assertEqual(ok('select count(*) from concierge.workflow_requests where request_id='+lit(request)),'0')
  finally:ok('drop trigger maya_fixture_reject on concierge.draft_presentations;drop function concierge.maya_fixture_reject()')
  self.assertEqual(write(A,'presentation_write','save_draft_v2',payload,1,request=request)['revision'],2)
 def test_maya_07_historical_baseline_ids_remain_reserved(self):
  self.publish_maya();f=self.maya
  f['presentation']['baselineRoutine'][0]['id']='revised-baseline-instruction'
  next(c for c in f['presentation']['categoryCards'] if c['kind']=='addition')['id']='maya-water-rinse'
  payload=dict(intakeVersion=1,recommendations=f['recommendations'],advisorNote='',presentation=f['presentation'])
  p.m.Workflows.deny_write(self,A,'presentation_write','save_draft_v2',payload,3,'invalid_input')
  self.assertEqual(ok('select revision from concierge.cases where client_id='+lit(C)),'3')
 def prepare_capacity_case(self):
  # A valid 49-step baseline plus one addition fills the mapper's 50-step bound.
  import copy
  f=self.maya;instruction=f['presentation']['baselineRoutine'][0]
  for i in range(43):
   extra=copy.deepcopy(instruction);extra['id']='synthetic-instruction-'+str(i)
   f['presentation']['baselineRoutine'].append(extra)
  f['intakePresentation']['baselineRoutine']=copy.deepcopy(f['presentation']['baselineRoutine'])
  self.publish_maya();self.fund()
  return next(r for r in f['recommendations'] if r['currentProductId'] is None)
 def start_addition(self,item,rev):
  for action,payload in [('decide',dict(version=1,recommendationId=item['id'],choice='approved',reason='')),('receive',dict(version=1,recommendationId=item['id'])),('start',dict(version=1,recommendationId=item['id'],startedOn=self.today.isoformat()))]:
   write(C,'write',action,payload,rev);rev+=1
  return rev
 def change_addition_slot(self):
  f=self.maya;r=next(r for r in f['recommendations'] if r['currentProductId'] is None)
  c=next(c for c in f['presentation']['categoryCards'] if c['kind']=='addition')
  c['slot']=r['slot']='synthetic-second-addition';c['id']='synthetic-second-addition-card';c['recommendationId']=r['id']='synthetic-second-recommendation'
  return dict(intakeVersion=1,recommendations=f['recommendations'],advisorNote='',presentation=f['presentation'])
 def test_maya_08_historical_addition_slots_count_toward_capacity(self):
  item=self.prepare_capacity_case();rev=self.start_addition(item,3)
  self.assertEqual(len(self.read()['activeRoutine']),50)
  p.m.Workflows.deny_write(self,A,'presentation_write','save_draft_v2',self.change_addition_slot(),rev,'invalid_input')
 def test_maya_09_publish_rechecks_capacity_after_intervening_start(self):
  import copy
  item=copy.deepcopy(self.prepare_capacity_case())
  write(A,'presentation_write','save_draft_v2',self.change_addition_slot(),3)
  rev=self.start_addition(item,4)
  p.m.Workflows.deny_write(self,A,'presentation_write','publish_v2',{},rev,'invalid_input')
  self.assertEqual(self.read()['plan']['version'],1)
 def test_maya_10_activated_addition_id_cannot_be_reused_for_another_slot(self):
  self.publish_maya();self.fund();item=next(r for r in self.maya['recommendations'] if r['currentProductId'] is None)
  card=next(c for c in self.maya['presentation']['categoryCards'] if c['kind']=='addition');reserved=card['id']
  rev=self.start_addition(item,3);payload=self.change_addition_slot()
  next(c for c in payload['presentation']['categoryCards'] if c['kind']=='addition')['id']=reserved
  p.m.Workflows.deny_write(self,A,'presentation_write','save_draft_v2',payload,rev,'invalid_input')
 def disguise_addition(self,kind='replace',collision=False):
  import copy
  f=self.maya;card=next(c for c in f['presentation']['categoryCards'] if c['slot']=='treatments')
  item=next(r for r in f['recommendations'] if r['id']==card['recommendationId'])
  current=next(s['product'] for s in f['presentation']['baselineRoutine'] if s['kind']=='product')
  card['kind']=kind;card['currentProduct']=copy.deepcopy(current);item['currentProductId']=current['id']
  if collision:card['id']='maya-water-rinse'
  return item
 def test_maya_11_bound_replacement_kinds_require_exact_authoritative_baseline(self):
  import copy
  for kind in ['replace','finish_then_replace']:
   for mismatch in ['absent-slot','wrong-current']:
    with self.subTest(kind=kind,mismatch=mismatch):
     self.setUp();f=self.maya
     write(A,'presentation_write','save_intake_v2',dict(goal='Goal',note='',baseline=f['baseline'],presentation=f['intakePresentation']),0)
     if mismatch=='absent-slot':self.disguise_addition(kind)
     else:
      card=f['presentation']['categoryCards'][0];card['kind']=kind
      current=next(s['product'] for s in f['presentation']['baselineRoutine'] if s['slot']=='cleanser')
      card['currentProduct']=copy.deepcopy(current);f['recommendations'][0]['currentProductId']=current['id']
     payload=dict(intakeVersion=1,recommendations=f['recommendations'],advisorNote='',presentation=f['presentation'])
     p.m.Workflows.deny_write(self,A,'presentation_write','save_draft_v2',payload,1,'invalid_input')
     self.assertEqual(ok('select revision from concierge.cases where client_id='+lit(C)),'1')
     self.assertEqual(ok('select count(*) from concierge.drafts'),'0')
 def test_maya_12_disguised_replacement_collision_is_rejected_before_persistence(self):
  self.publish_maya();self.fund();before=self.read();self.disguise_addition(collision=True);f=self.maya
  p.m.Workflows.deny_write(self,A,'presentation_write','save_draft_v2',dict(intakeVersion=1,recommendations=f['recommendations'],advisorNote='',presentation=f['presentation']),3,'invalid_input')
  after=self.read();self.assertEqual(after,before)
  script="import {mapConciergeClientViewV2} from './source/src/contracts/ConciergePresentationMapping.ts';const chunks=[];for await(const x of process.stdin)chunks.push(x);mapConciergeClientViewV2(JSON.parse(Buffer.concat(chunks).toString()));"
  r=p.subprocess.run([p.NODE,'--experimental-strip-types','--input-type=module','-e',script],cwd=p.ROOT,input=json.dumps(after),text=True,capture_output=True)
  self.assertEqual(r.returncode,0,r.stderr)
 def test_maya_13_disguised_replacement_cannot_bypass_fifty_step_capacity(self):
  import copy
  self.disguise_addition();f=self.maya;instruction=f['presentation']['baselineRoutine'][0]
  while len(f['presentation']['baselineRoutine'])<50:
   extra=copy.deepcopy(instruction);extra['id']='synthetic-capacity-'+str(len(f['presentation']['baselineRoutine']))
   f['presentation']['baselineRoutine'].append(extra)
  f['intakePresentation']['baselineRoutine']=copy.deepcopy(f['presentation']['baselineRoutine'])
  write(A,'presentation_write','save_intake_v2',dict(goal='Goal',note='',baseline=f['baseline'],presentation=f['intakePresentation']),0)
  p.m.Workflows.deny_write(self,A,'presentation_write','save_draft_v2',dict(intakeVersion=1,recommendations=f['recommendations'],advisorNote='',presentation=f['presentation']),1,'invalid_input')
  self.assertEqual(ok('select count(*) from concierge.drafts'),'0')
 def test_maya_14_publish_revalidates_preexisting_malformed_draft(self):
  self.save_maya();self.disguise_addition(collision=True);f=self.maya
  # Synthetic fixture of content admitted by the prior defective implementation.
  # This does not claim the corrected save path accepted the invalid content.
  ok('update concierge.drafts set recommendations='+lit(json.dumps(f['recommendations']))+'::jsonb where client_id='+lit(C))
  ok('update concierge.draft_presentations set presentation='+lit(json.dumps(f['presentation']))+'::jsonb where client_id='+lit(C))
  before=ok('select count(*) from concierge.workflow_requests');request=str(uuid.uuid4())
  p.m.Workflows.deny_write(self,A,'presentation_write','publish_v2',{},2,'invalid_input',request=request)
  self.assertEqual(ok('select revision from concierge.cases where client_id='+lit(C)),'2')
  self.assertEqual(ok('select count(*) from concierge.publications'),'0')
  self.assertEqual(ok('select count(*) from concierge.publication_presentations'),'0')
  self.assertEqual(ok('select count(*) from concierge.workflow_requests'),before)
  self.assertEqual(ok('select count(*) from concierge.drafts'),'1','Retain invalid draft for reviewed correction; never silently rewrite it')

class WorkflowCompatibility(p.m.Workflows):
 @classmethod
 def setUpClass(cls):
  if not without:ok(PROPOSAL.read_text())

p.Maya=Maya
p.WorkflowCompatibility=WorkflowCompatibility
if __name__=='__main__':
 if len(sys.argv)==1:sys.argv.extend(['Maya','WorkflowCompatibility'])
 sys.exit(p.main())
