"""Characterize existing domain rules in a fresh local-only PostgreSQL cluster.
Run: python3 backend/tests/consultation-decisions.sql.py
No SQL change is proposed by this UI slice; the reviewed Maya proposal is reused.
"""
from pathlib import Path
import copy,importlib.util,json,sys
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('ui_contract_maya',Path(__file__).with_name('maya-contract.sql.py'))
m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
p=m.p
write,ok,lit,C,A=m.write,m.ok,m.lit,m.C,m.A

class ConsultationDecisions(m.Maya):
 def test_ui_01_intake_identity_is_fixed_but_details_instructions_and_notes_are_editable(self):
  f=self.maya
  write(A,'presentation_write','save_intake_v2',dict(goal='Original goal',note='',baseline=f['baseline'],presentation=f['intakePresentation']),0)
  for change in ['product','category','remove','add']:
   baseline=copy.deepcopy(f['baseline'])
   if change=='product':baseline[0]['productId']='different-product'
   if change=='category':baseline[0]['slot']='different-category'
   if change=='remove':baseline.pop()
   if change=='add':baseline.append(dict(slot='extra-category',productId='extra-product'))
   p.m.Workflows.deny_write(self,A,'presentation_write','save_intake_v2',dict(goal='Edited goal',note='',baseline=baseline,presentation=f['intakePresentation']),1,'baseline_conflict')
  presentation=copy.deepcopy(f['intakePresentation']);presentation['baselineRoutine'].pop(0)
  presentation['baselineRoutine'][0]['product']['name']='Corrected same-product display name'
  presentation['baselineRoutine'][0]['usage']['instructions']=['Corrected instruction']
  presentation['consultationSections']=[dict(title='Corrected consultation',body='Synthetic editable public copy')]
  result=write(A,'presentation_write','save_intake_v2',dict(goal='Corrected goal',note='Synthetic editable private note',baseline=f['baseline'],presentation=presentation),1)
  self.assertEqual(result['revision'],2)
  view=self.read(A);self.assertEqual(view['intake']['goal'],'Corrected goal');self.assertEqual(view['intake']['note'],'Synthetic editable private note')
  self.assertEqual(view['intake']['presentation'],presentation)
  self.assertEqual(json.loads(ok('select jsonb_agg(jsonb_build_object(\'slot\',slot,\'productId\',product_id) order by slot) from concierge.baselines where client_id='+lit(C))),sorted(f['baseline'],key=lambda x:x['slot']))
 def test_ui_02_unreceived_approval_and_decline_corrections_only_update_choice_and_cart(self):
  self.publish_maya();self.fund();before=self.read()['routine'];item=self.maya['recommendations'][0]
  for revision,choice,reason,cart_count in [(3,'approved','',1),(4,'declined','Synthetic correction',0),(5,'approved','',1)]:
   write(C,'write','decide',dict(version=1,recommendationId=item['id'],choice=choice,reason=reason),revision)
   view=self.read();state=next(s for s in view['plan']['itemStates'] if s['recommendationId']==item['id'])
   self.assertEqual(state['choice'],choice);self.assertEqual(state['reason'],reason if choice=='declined' else None)
   self.assertEqual(len(view['orderProposal']['items']),cart_count);self.assertEqual(view['routine'],before)
 def test_ui_03_receipt_and_start_both_prevent_choice_reversal(self):
  self.publish_maya();self.fund();item=self.maya['recommendations'][0];self.decision(item,3)
  write(C,'write','receive',dict(version=1,recommendationId=item['id']),4)
  payload=dict(version=1,recommendationId=item['id'],choice='declined',reason='Too late')
  p.m.Workflows.deny_write(self,C,'write','decide',payload,5,'already_received')
  write(C,'write','start',dict(version=1,recommendationId=item['id'],startedOn=self.today.isoformat()),5)
  p.m.Workflows.deny_write(self,C,'write','decide',payload,6,'already_received')
  self.assertEqual(self.read()['revision'],6)
 def test_ui_04_funded_choice_change_does_not_reverse_confirmed_ledger(self):
  self.publish_maya();self.fund();item=self.maya['recommendations'][0];self.decision(item,3)
  write(C,'payment_write','confirm_shipping_address',dict(address=p.m.Workflows.address(self)),3)
  total=item['priceCents'];money=dict(publicationVersion=1,serviceCents=0,servicePeriod=None,shippingAddressVersion=1,items=[dict(recommendationId=item['id'],quantity=1,unitPriceCents=total,lineTotalCents=total)],productSubtotalCents=total,taxCents=0,shippingCents=0,productTotalCents=total,totalCents=total)
  quote=write(A,'payment_write','issue_quote',money,4);receipt,_=p.m.Workflows.claim_confirm(self,quote,5,0,total)
  self.assertEqual(receipt['productOrderStatus'],'ready_to_purchase')
  before=m.call(C,'concierge_payment_view',[lit(C)])
  write(C,'write','decide',dict(version=1,recommendationId=item['id'],choice='declined',reason='Synthetic correction after funding'),4)
  self.assertEqual(m.call(C,'concierge_payment_view',[lit(C)]),before)
  self.assertEqual(self.read()['orderProposal']['items'],[])
  state=next(s for s in self.read()['plan']['itemStates'] if s['recommendationId']==item['id'])
  self.assertEqual(state['choice'],'declined');self.assertFalse(state['received'])

p.ConsultationDecisions=ConsultationDecisions
if __name__=='__main__':
 if len(sys.argv)==1:sys.argv.extend('ConsultationDecisions.'+name for name in sorted(ConsultationDecisions.__dict__) if name.startswith('test_ui_'))
 sys.exit(p.main())
