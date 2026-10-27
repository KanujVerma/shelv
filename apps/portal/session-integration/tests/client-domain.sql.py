"""Existing enrollment/finance/check-in acceptance, isolated fresh PostgreSQL only."""
from pathlib import Path
import importlib.util,sys
source=Path(__file__).resolve().parents[2]/'backend/tests/preview.sql.py'
spec=importlib.util.spec_from_file_location('preview',source)
runner=importlib.util.module_from_spec(spec);sys.modules['preview']=runner;spec.loader.exec_module(runner)
class ClientAcceptanceWorkflows(runner.m.Workflows):
 def test_33_approved_evidence_free_rejection_never_funds_or_starts_plan(self):
  # Exact approved hosted payment shape, executed only in this disposable local DB.
  self.test_21_server_invoice_period_and_separate_rejection_capability()
  payment=runner.m.call(runner.m.C,'concierge_payment_view',[runner.m.lit(runner.m.C)])
  self.assertEqual(payment['service']['status'],'unpaid')
  self.assertIsNone(runner.m.call(runner.m.C,'concierge_client_view',[])['plan'])
  self.assertNotIn('PRIVATE_',str(runner.m.call(runner.m.C,'concierge_client_view',[])))
  self.assertEqual(runner.m.scalar('select count(*) from concierge.payment_confirmations'),0)
runner.Workflows=ClientAcceptanceWorkflows
if __name__=='__main__':
 sys.argv=[str(source),'Workflows'];sys.exit(runner.main())
