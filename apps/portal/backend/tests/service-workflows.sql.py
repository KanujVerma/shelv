"""Disposable PostgreSQL acceptance of production service RPCs. No provider calls."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import importlib.util,json,sys,tempfile,subprocess,shutil,unittest,copy,uuid
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('preview',HERE/'preview.sql.py');p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
m=p.m;C,D,A,V,N=p.C,p.D,p.A,p.V,p.N
ok,lit,call,write=m.ok,m.lit,m.call,m.write
ROOT=HERE.parents[3]
class Service(p.Preview):
 denied=m.Workflows.denied
 def setUp(self):super().setUp();self.publish();self.fund()
 def sw(self,action,payload,rev,actor=A,request=None):return write(actor,'service_write',action,payload,rev,request=request)
 def read(self,advisor=False):return call(A if advisor else C,'concierge_service_advisor_view' if advisor else 'concierge_service_client_view',[lit(C)] if advisor else [])
 def deny(self,action,payload,rev,code='forbidden',actor=A,request=None):m.Workflows.deny_write(self,actor,'service_write',action,payload,rev,code,request=request)
 def review(self):return dict(channel='text',occurredOn=self.today.isoformat(),summary='Discussed comfort',reportedUse='Reported the existing routine',decision='Keep routine and review',nextReviewOn=self.today.isoformat(),privateNote='PRIVATE_REVIEW_CANARY')
 def draft(self):
  step=next(s for s in call(A,'concierge_advisor_view_v2',[lit(C)])['client']['activeRoutine'] if s['kind']=='product')
  usage=copy.deepcopy(step['usage']);usage['instructions']=['Revised clear instructions']
  return dict(slot=step['slot'],productId=step['productId'],planVersion=1,baseInstructionVersion=0,usage=usage,reason='Clarified following review',reviewId=None,effectiveOn=self.today.isoformat())
 def purchase(self,**changes):
  result=dict(quoteId=None,recommendationId=None,retailer='Neutral retailer',seller='Neutral seller',productId='original',productName='Existing moisturizer',quantity=2,unitPriceCents=1000,taxCents=100,shippingCents=100,purchasedOn=self.today.isoformat(),deliveredOn=self.today.isoformat(),policy=dict(checkedOn=self.today.isoformat(),url='https://example.com/returns',summary='Unopened only; item-specific deadline checked',openedAllowed=False,finalSale=False,returnBy='2099-01-01',shipBy='2099-01-01',returnCostCents=100),orderReference='PRIVATE_ORDER_CANARY',receiptReference='PRIVATE_RECEIPT_CANARY',termsDisclosed=True);result.update(changes);return result
 def event(self,id,status,**changes):
  result=dict(returnId=id,status=status,note='Public return instructions',expectedRefundCents=None,retailerRefundCents=None,clientRepaidCents=None,privateReference='PRIVATE_BANK_CANARY',policyCheckedOn=None);result.update(changes);return result
 def test_service_01_review_no_form_private_authorship_idempotency(self):
  payload=self.review();request=str(uuid.uuid4())
  with ThreadPoolExecutor(max_workers=2) as pool:receipts=list(pool.map(lambda _:self.sw('record_review',payload,0,request=request),range(2)))
  self.assertEqual(receipts[0],receipts[1]);self.assertEqual(len(self.read()['reviews']),1);self.assertNotIn('PRIVATE_',json.dumps(self.read()));self.assertEqual(self.read(True)['privateNotes'][0]['note'],'PRIVATE_REVIEW_CANARY');self.assertEqual(self.read()['reviews'][0]['authorId'],A)
  self.deny('record_review',payload,0,'revision_conflict');self.deny('record_review',{**payload,'decision':'Different'},0,'request_conflict',request=request)
  self.deny('record_review',payload,1,actor=C);self.deny('record_review',payload,1,actor=V)
  r=m.invoke(D,'concierge_service_advisor_view',[lit(C)]);self.assertNotEqual(r.returncode,0)
  ok('update concierge.advisors set can_edit=false where user_id='+lit(A));self.deny('record_review',payload,0,request=request)
 def test_service_02_retained_instruction_draft_publish_twice_history_no_start(self):
  before=call(C,'concierge_client_view_v2',[]);payments=call(C,'concierge_payment_view',[lit(C)])
  draft=self.draft();d=self.sw('save_instruction_draft',draft,0);self.assertEqual(call(C,'concierge_client_view_v2',[]),before)
  self.sw('publish_instruction_revision',dict(draftId=d['entityId']),1)
  after=call(C,'concierge_client_view_v2',[]);self.assertEqual(next(s for s in after['activeRoutine'] if s['kind']=='product')['usage']['instructions'],['Revised clear instructions']);self.assertEqual(after['routineHistory'],before['routineHistory']);self.assertIsNone(self.read()['instructions'][0]['originalStartedOn'])
  self.assertEqual(after['plan'],before['plan']);self.assertEqual(after['history'],before['history']);self.assertEqual(call(C,'concierge_payment_view',[lit(C)]),payments)
  d2=self.sw('save_instruction_draft',{**draft,'baseInstructionVersion':1,'usage':{**draft['usage'],'instructions':['Second revision']}},2);self.sw('publish_instruction_revision',dict(draftId=d2['entityId']),3)
  self.assertEqual([i['version'] for i in self.read()['instructions']],[1,2]);self.assertEqual(next(s for s in call(C,'concierge_client_view_v2',[])['activeRoutine'] if s['kind']=='product')['usage']['instructions'],['Second revision']);self.deny('save_instruction_draft',draft,4,'instruction_conflict')
 def test_service_03_active_product_and_plan_fences(self):
  draft=self.draft();self.deny('save_instruction_draft',{**draft,'productId':'different'},0,'instruction_conflict');self.deny('save_instruction_draft',{**draft,'planVersion':2},0,'instruction_conflict')
  d=self.sw('save_instruction_draft',draft,0);ok('update concierge.cases set published_version=2 where client_id='+lit(C));self.deny('publish_instruction_revision',dict(draftId=d['entityId']),1,'instruction_conflict')
 def test_service_04_returns_require_actual_order_and_quantity_is_serialized(self):
  self.deny('request_return',dict(purchaseId=str(uuid.uuid4()),quantity=1,reason='Unused',condition='unopened'),0,'not_found',actor=C)
  purchase=self.sw('record_purchase',self.purchase(),0)['entityId'];payload=dict(purchaseId=purchase,quantity=1,reason='Unused',condition='unopened')
  self.sw('request_return',payload,1,actor=C);self.sw('request_return',payload,2,actor=C);self.deny('request_return',payload,3,'return_quantity_exceeded',actor=C)
  self.assertNotIn('PRIVATE_',json.dumps(self.read()));self.assertIn('PRIVATE_ORDER_CANARY',json.dumps(self.read(True)))
 def test_service_05_opened_finalsale_expired_restrictions_are_not_automatic_authorization(self):
  for variant,condition in [('opened','opened'),('final','unopened'),('expired','unopened')]:
   policy=self.purchase()['policy'];policy.update(finalSale=variant=='final',returnBy='2000-01-01' if variant=='expired' else '2099-01-01')
   rev=self.read()['revision'];pid=self.sw('record_purchase',self.purchase(policy=policy,orderReference='PRIVATE_ORDER_'+variant,receiptReference='PRIVATE_RECEIPT_'+variant),rev)['entityId'];rid=self.sw('request_return',dict(purchaseId=pid,quantity=1,reason='Please check policy',condition=condition),rev+1,actor=C)['entityId']
   self.sw('record_return_event',self.event(rid,'reviewing'),rev+2);self.deny('record_return_event',self.event(rid,'authorized',policyCheckedOn=self.today.isoformat()),rev+3,'return_ineligible')
   self.sw('record_return_event',self.event(rid,'declined'),rev+3)
 def test_service_06_partial_refund_retailer_receipt_and_client_repayment_distinct(self):
  pid=self.sw('record_purchase',self.purchase(),0)['entityId'];rid=self.sw('request_return',dict(purchaseId=pid,quantity=1,reason='Unused',condition='unopened'),1,actor=C)['entityId']
  for rev,status in [(2,'reviewing'),(3,'authorized'),(4,'awaiting_return'),(5,'in_transit'),(6,'retailer_reviewing')]:self.sw('record_return_event',self.event(rid,status,policyCheckedOn=self.today.isoformat() if status=='authorized' else None,expectedRefundCents=1000 if status=='authorized' else None),rev)
  self.deny('record_return_event',self.event(rid,'retailer_funds_received',retailerRefundCents=1200),7,'refund_exceeded')
  self.sw('record_return_event',self.event(rid,'retailer_funds_received',retailerRefundCents=850),7);self.assertEqual(self.read()['returns'][0]['status'],'retailer_funds_received')
  self.deny('record_return_event',self.event(rid,'client_repaid',clientRepaidCents=900),8,'refund_exceeded');self.sw('record_return_event',self.event(rid,'client_repaid',clientRepaidCents=850),8)
  self.assertEqual(self.read()['returns'][0]['events'][-1]['clientRepaidCents'],850);self.assertEqual(ok('select count(*) from concierge.payment_confirmations'),'1');self.assertNotIn('PRIVATE_',json.dumps(self.read()))
 def test_service_07_cancellation_suppresses_renewals_keeps_paid_access_and_admin(self):
  period=call(C,'concierge_payment_view',[lit(C)])['service']['period'];self.sw('cancel_service',dict(kind='period_end',supportEndsOn=period['endOn'],reason='Client requested cancellation',confirmedWithClient=True),0)
  payments=call(C,'concierge_payment_view',[lit(C)]);self.assertIsNone(payments['nextServicePeriod']);self.assertEqual(payments['service']['status'],'active');self.assertTrue(call(C,'concierge_client_view_v2',[])['plan'])
  money=dict(publicationVersion=1,serviceCents=10000,servicePeriod=dict(startOn=period['endOn'],endOn='2099-01-01'),items=[],productSubtotalCents=0,taxCents=0,shippingCents=0,productTotalCents=0,totalCents=10000,shippingAddressVersion=None)
  m.Workflows.deny_write(self,A,'payment_write','issue_quote',money,3,'renewal_cancelled')
  self.sw('record_purchase',self.purchase(),1);self.assertEqual(len(self.read(True)['purchases']),1)
 def test_service_08_early_end_explicit_and_financial_history_preserved(self):
  payload=dict(kind='early_departure',supportEndsOn=self.today.isoformat(),reason='Confirmed early departure',confirmedWithClient=True);self.sw('cancel_service',payload,0)
  self.assertEqual(ok('select count(*) from concierge.payment_confirmations'),'1');self.assertEqual(call(C,'concierge_payment_view',[lit(C)])['service']['status'],'cancelled')
  self.sw('record_purchase',self.purchase(),1);self.assertEqual(len(self.read(True)['purchases']),1);self.deny('record_review',self.review(),2)
 def test_service_09_table_acl_immutable_histories_and_revocation(self):
  self.sw('record_review',self.review(),0);r=m.q("update concierge.service_reviews set data=data||'{\"summary\":\"changed\"}'::jsonb");self.assertNotEqual(r.returncode,0);self.assertIn('concierge_immutable',r.stderr)
  for role in ['anon','authenticated','service_role']:self.assertEqual(ok("select has_table_privilege("+lit(role)+",'concierge.service_reviews','select')"),'f')
  ok("update concierge.enrollments set status='revoked' where client_id="+lit(C));r=m.invoke(C,'concierge_service_client_view',[]);self.assertNotEqual(r.returncode,0)

 def test_service_10_started_product_revision_preserves_start_and_passes_real_mapper(self):
  write(C,'write','decide',dict(version=1,recommendationId='moisturizer-v2',choice='approved',reason=''),3)
  write(C,'write','receive',dict(version=1,recommendationId='moisturizer-v2'),4)
  write(C,'write','start',dict(version=1,recommendationId='moisturizer-v2',startedOn=self.today.isoformat()),5)
  before=call(C,'concierge_client_view_v2',[]);payload=self.draft();step=next(s for s in before['activeRoutine'] if s['source']['kind']=='activation');payload.update(slot=step['slot'],productId=step['productId']);draft=self.sw('save_instruction_draft',payload,0);self.sw('publish_instruction_revision',dict(draftId=draft['entityId']),1)
  view=call(C,'concierge_client_view_v2',[]);self.assertEqual(view['routineHistory'],before['routineHistory']);self.assertEqual(self.read()['instructions'][0]['originalStartedOn'],self.today.isoformat())
  script="import {mapConciergeClientViewV2} from './src/contracts/ConciergePresentationMapping.ts';import {mapServiceView} from './src/contracts/ConciergeService.ts';const chunks=[];for await(const x of process.stdin)chunks.push(x);const v=JSON.parse(Buffer.concat(chunks).toString());mapConciergeClientViewV2(v.client);mapServiceView(v.service);mapServiceView(v.advisor,true);const {handleConciergeRequest}=await import('./supabase/functions/concierge-operations/handler.ts');for(const [action,data,id] of [['client_read_v2',v.client,'10000000-0000-4000-8000-000000000001'],['service_client_read',v.service,'10000000-0000-4000-8000-000000000001'],['service_advisor_read',v.advisor,'10000000-0000-4000-8000-000000000003']]){const body={action,...(action==='service_advisor_read'?{clientId:'10000000-0000-4000-8000-000000000001'}:{})};const response=await handleConciergeRequest(new Request('https://example.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify(body)}),{allowedOrigins:[],authenticate:async()=>({id,is_anonymous:false}),rpc:async()=>({data,error:null})});if(response.status!==200)throw Error(await response.text());}"
  result=subprocess.run([p.NODE,'--experimental-strip-types','--input-type=module','-e',script],cwd=ROOT,input=json.dumps(dict(client=view,service=self.read(),advisor=self.read(True))),text=True,capture_output=True);self.assertEqual(result.returncode,0,result.stderr)
 def test_service_11_actual_quote_purchase_never_created_by_payment_and_duplicate_guards(self):
  write(C,'write','decide',dict(version=1,recommendationId='moisturizer-v2',choice='approved',reason=''),3)
  write(C,'payment_write','confirm_shipping_address',dict(address=m.Workflows.address(self)),3)
  quote=write(A,'payment_write','issue_quote',dict(publicationVersion=1,serviceCents=0,servicePeriod=None,items=[dict(recommendationId='moisturizer-v2',quantity=1,unitPriceCents=1600,lineTotalCents=1600)],productSubtotalCents=1600,taxCents=0,shippingCents=0,productTotalCents=1600,totalCents=1600,shippingAddressVersion=1),4);m.Workflows.claim_confirm(self,quote,5,0,1600)
  self.assertEqual(self.read()['purchases'],[])
  payload=self.purchase(quoteId=quote['quoteId'],recommendationId='moisturizer-v2',productId='replacement',quantity=1,unitPriceCents=1600,taxCents=0,shippingCents=0)
  self.deny('record_purchase',{**payload,'unitPriceCents':1700},0,'purchase_conflict')
  self.sw('record_purchase',payload,0);self.deny('record_purchase',payload,1,'purchase_conflict');self.deny('record_purchase',{**payload,'quoteId':None,'recommendationId':None},1,'purchase_conflict')
 def test_service_12_sql_payloads_cannot_smuggle_author_or_client_private_data(self):
  self.deny('record_review',{**self.review(),'createdBy':C},0,'invalid_input')
  self.deny('record_review',{**self.review(),'occurredOn':'2099-01-01'},0,'invalid_input')
  self.deny('record_purchase',{**self.purchase(),'termsDisclosed':False},0,'invalid_input')
  self.assertEqual(self.read()['revision'],0)

 def test_service_13_partial_return_remainder_cent_and_aggregate_cap_both_event_orders(self):
  for iteration,(first_index,second_index,first_cents,second_cents) in enumerate([(0,1,1000,1001),(1,0,1000,1001),(0,1,1001,1000),(1,0,1001,1000)]):
   rev=self.read()['revision'];pid=self.sw('record_purchase',self.purchase(quantity=2,taxCents=1,shippingCents=0,orderReference='remainder-order-'+str(iteration),receiptReference='remainder-receipt-'+str(iteration)),rev)['entityId'];rev+=1;cases=[]
   for unused in range(2):cases.append(self.sw('request_return',dict(purchaseId=pid,quantity=1,reason='Unused',condition='unopened'),rev,actor=C)['entityId']);rev+=1
   for rid in cases:
    for status in ['reviewing','authorized','retailer_reviewing']:
     self.sw('record_return_event',self.event(rid,status,policyCheckedOn=self.today.isoformat() if status=='authorized' else None),rev);rev+=1
   first,second=cases[first_index],cases[second_index]
   self.sw('record_return_event',self.event(first,'retailer_funds_received',retailerRefundCents=first_cents),rev);rev+=1
   self.deny('record_return_event',self.event(second,'retailer_funds_received',retailerRefundCents=second_cents+1),rev,'refund_exceeded')
   self.sw('record_return_event',self.event(second,'retailer_funds_received',retailerRefundCents=second_cents),rev);rev+=1
   for rid,paid in [(second,second_cents),(first,first_cents)]:self.sw('record_return_event',self.event(rid,'client_repaid',clientRepaidCents=paid),rev);rev+=1
   self.assertEqual(ok("select sum((e.data->>'retailerRefundCents')::bigint) from concierge.return_events e join concierge.return_cases r on r.id=e.return_id where r.purchase_id="+lit(pid)),'2001')
 def test_service_14_settlement_uses_confirm_permission_without_edit(self):
  pid=self.sw('record_purchase',self.purchase(),0)['entityId'];rid=self.sw('request_return',dict(purchaseId=pid,quantity=1,reason='Unused',condition='unopened'),1,actor=C)['entityId']
  for rev,status in [(2,'reviewing'),(3,'authorized'),(4,'retailer_reviewing')]:self.sw('record_return_event',self.event(rid,status,policyCheckedOn=self.today.isoformat() if status=='authorized' else None),rev)
  ok('update concierge.advisors set can_confirm_payments=true where user_id='+lit(V));ok('update concierge.advisors set can_confirm_payments=false where user_id='+lit(A))
  self.deny('record_return_event',self.event(rid,'retailer_funds_received',retailerRefundCents=900),5,actor=A)
  self.sw('record_return_event',self.event(rid,'retailer_funds_received',retailerRefundCents=900),5,actor=V);self.sw('record_return_event',self.event(rid,'client_repaid',clientRepaidCents=900),6,actor=V)
  self.deny('record_purchase',self.purchase(orderReference='another',receiptReference='another'),7,actor=V)

 def test_service_15_cancelled_enrollment_keeps_administration_and_closes_care(self):
  ok("update concierge.enrollments set status='cancelled' where client_id="+lit(C))
  pid=self.sw('record_purchase',self.purchase(),0)['entityId'];rid=self.sw('request_return',dict(purchaseId=pid,quantity=1,reason='Unused',condition='unopened'),1,actor=C)['entityId']
  self.sw('record_return_event',self.event(rid,'reviewing'),2);self.assertEqual(self.read(True)['returns'][0]['status'],'reviewing');self.deny('record_review',self.review(),3)

# Only service tests, not inherited Preview tests, run here.
def main():
 data=Path(tempfile.mkdtemp(prefix='shelv-service-pg-'));sock=Path(tempfile.mkdtemp(prefix='shelv-service-sock-',dir='/tmp'));started=False
 m.CONNECTION=['-w','-h',str(sock),'-p','58429','-U','postgres']
 try:
  subprocess.run([str(p.BIN/'initdb'),'-D',str(data),'-U','postgres','-A','trust','--no-locale','-E','UTF8'],check=True,capture_output=True,text=True,timeout=30)
  subprocess.run([str(p.BIN/'pg_ctl'),'-D',str(data),'-l',str(data/'postgres.log'),'-o',"-k '"+str(sock)+"' -p 58429 -c listen_addresses=''",'-w','start'],check=True,capture_output=True,text=True,timeout=30);started=True
  assert m.q('create database '+m.DB,'postgres').returncode==0
  ok('comment on database '+m.DB+' is '+lit(m.MARKER))
  ok("create role anon;create role authenticated;create role service_role;create schema auth;create schema storage;create table auth.users(id uuid primary key,is_anonymous boolean not null);create table public.profiles(id uuid primary key references auth.users on delete cascade,deletion_started_at timestamptz);create function public.fixture_profile() returns trigger language plpgsql as $$begin insert into public.profiles(id) values(new.id);return new;end$$;create trigger fixture_profile after insert on auth.users for each row execute function public.fixture_profile();create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,metadata jsonb);alter table storage.objects enable row level security;")
  for migration in sorted((p.SOURCE/'supabase/migrations').glob('*.sql')):ok(migration.read_text())
  for migration in sorted((p.ROOT/'migrations').glob('*.sql')):ok(migration.read_text())
  for name in ['20261020161532_concierge_maya_contract.sql','20261024230829_concierge_checkin_replies.sql','20261024234059_concierge_manual_payment_methods.sql','20261025011331_concierge_no_current_products.sql']:ok((ROOT/'supabase/migrations'/name).read_text())
  proposal=p.ROOT/'proposals/service_workflows.sql'
  if proposal.exists():ok(proposal.read_text())
  names=sys.argv[1:] or [name for name in sorted(Service.__dict__) if name.startswith('test_service_')]
  suite=unittest.TestSuite(Service(name) for name in names)
  return 0 if unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful() else 1
 finally:
  if started:subprocess.run([str(p.BIN/'pg_ctl'),'-D',str(data),'-m','fast','-w','stop'],check=True,capture_output=True,text=True,timeout=30)
  shutil.rmtree(data);shutil.rmtree(sock)
if __name__=='__main__':sys.exit(main())
