"""Synthetic PostgreSQL acceptance. No hosted connections, JWTs or Storage service.

Requires the previously approved local R1 fixture and existing PostgreSQL roles.
--reset clones only that fixture, and replaces only this marked disposable DB.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import date
import calendar
import json
import os
import subprocess
import sys
import unittest
import uuid

ROOT = Path(__file__).resolve().parents[1]
BIN = Path('/opt/homebrew/opt/postgresql@15/bin')
DB = 'derive_disposable_concierge_workflows_20261018_01'
TEMPLATE = 'derive_disposable_concierge_r1_20261015_01'
MARKER = 'Synthetic concierge workflow acceptance fixture only 20261018'
ENV = {k: v for k, v in os.environ.items() if not k.startswith('PG')}
ENV.update(PGPASSFILE=str(ROOT/'tests/.disabled-pgpass-never-create'), PGSERVICEFILE='/dev/null', PGAPPNAME='synthetic-concierge-workflows')
CONNECTION = ['-w', '-h', '/tmp/derive-storage-20261015-01', '-p', '52819', '-U', 'postgres']
C, D, A, V, N = [f'10000000-0000-4000-8000-{i:012d}' for i in range(1, 6)]


def lit(v):
    return "'" + str(v).replace("'", "''") + "'"


def q(sql, db=DB):
    assert db in (DB, 'postgres')
    return subprocess.run([str(BIN / 'psql'), '-X', *CONNECTION, '-d', db, '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql],
                          env=ENV, text=True, capture_output=True, timeout=20)


def ok(sql):
    r = q(sql)
    if r.returncode:
        raise AssertionError(r.stderr)
    return r.stdout.strip()


def scalar(sql):
    return json.loads(ok(sql).rsplit('\n', 1)[-1])


def invoke(actor, name, args):
    sql = 'begin;set local role authenticated;set local request.jwt.claim.sub=' + lit(actor) + ';select public.' + name + '(' + ','.join(args) + ');commit;'
    return q(sql)


def call(actor, name, args):
    r = invoke(actor, name, args)
    if r.returncode:
        raise AssertionError(r.stderr)
    return json.loads(next(line for line in reversed(r.stdout.strip().split('\n')) if line.startswith(('{', '['))))


def write(actor, stream, action, payload, revision, client=C, request=None):
    return call(actor, 'concierge_' + stream, [lit(client), lit(action), str(revision), lit(request or uuid.uuid4()), lit(json.dumps(payload)) + '::jsonb'])


def next_month(day):
    year, month = day.year + (day.month == 12), day.month % 12 + 1
    return date(year, month, min(day.day, calendar.monthrange(year, month)[1]))


class Workflows(unittest.TestCase):
    def setUp(self):
        self.assertEqual(ok("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()"), MARKER)
        ok('truncate auth.users cascade')
        ok('insert into auth.users(id,is_anonymous) values ' + ','.join('(' + lit(x) + ',false)' for x in [C, D, A, V, N]))
        ok('insert into concierge.enrollments(client_id,display_name,status) values ' + ','.join('(' + lit(x) + ", 'Synthetic client', 'active')" for x in [C, D]))
        ok('insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values (' + lit(A) + ',true,true,true,true,true),(' + lit(V) + ',true,true,false,false,false)')
        self.today = date.fromisoformat(ok("select (now() at time zone 'America/Chicago')::date"))
        self.recommendation = dict(id='replacement-v1', slot='moisturizer', currentProductId='original', proposedProductId='replacement', priceCents=1600, currency='USD', rationale='Synthetic public rationale')

    def denied(self, actor, name, args, code='forbidden'):
        r = invoke(actor, name, args)
        self.assertNotEqual(r.returncode, 0, r.stdout)
        self.assertIn('concierge_' + code, r.stderr)

    def deny_write(self, actor, stream, action, payload, rev, code='forbidden', client=C, request=None):
        self.denied(actor, 'concierge_' + stream, [lit(client), lit(action), str(rev), lit(request or uuid.uuid4()), lit(json.dumps(payload)) + '::jsonb'], code)

    def address(self, line='100 Synthetic Lane'):
        return dict(recipientName='Synthetic Recipient',line1=line,line2='',city='Fixture City',region='IL',postalCode='00000',countryCode='US')

    def published(self):
        write(A, 'advisor_write', 'save_intake', dict(goal='Comfort', note='PRIVATE_INTAKE_CANARY', baseline=[dict(slot='moisturizer', productId='original')]), 0)
        write(A, 'write', 'save_draft', dict(intakeVersion=1, recommendations=[self.recommendation], advisorNote='PRIVATE_DRAFT_CANARY'), 1)
        return write(A, 'write', 'publish', {}, 2)

    def issue(self, revision=0, service=10000, products=False, start=None):
        start = start or self.today
        items = [dict(recommendationId='replacement-v1', quantity=1, unitPriceCents=1600, lineTotalCents=1600)] if products else []
        payload = dict(publicationVersion=1, serviceCents=service, servicePeriod=dict(startOn=start.isoformat(), endOn=next_month(start).isoformat()) if service else None,
                       items=items, productSubtotalCents=1600 if products else 0, taxCents=0, shippingCents=0, productTotalCents=1600 if products else 0, totalCents=service + (1600 if products else 0), shippingAddressVersion=1 if products else None)
        return write(A, 'payment_write', 'issue_quote', payload, revision)

    def claim_confirm(self, quote, revision, service=10000, products=0):
        basis = dict(quoteId=quote['quoteId'], quoteVersion=scalar('select version from concierge.quotes where id=' + lit(quote['quoteId'])), serviceCents=service, productCents=products, totalCents=service+products, shippingAddressVersion=1 if products else None)
        claim = write(C, 'payment_write', 'submit_claim', dict(**basis, evidenceId=None), revision)
        confirmation = dict(**basis, claimId=claim['claimId'], bankReceiptVerified=True)
        return write(A, 'payment_write', 'confirm_payment', confirmation, revision+1), confirmation

    def paid(self):
        self.published()
        quote = self.issue()
        return self.claim_confirm(quote, 1)

    def test_00_acl_private_schema_and_no_seeded_authority(self):
        self.assertEqual(ok("select has_function_privilege('anon','public.concierge_advisor_directory()','execute')"), 'f')
        self.assertEqual(ok("select has_function_privilege('authenticated','concierge.r1_write(uuid,text,bigint,uuid,jsonb)','execute')"), 'f')
        self.assertEqual(ok("select has_table_privilege('service_role','concierge.payment_confirmations','insert')"), 'f')
        self.assertEqual(ok("select bool_and(relrowsecurity) from pg_class t join pg_namespace n on n.oid=t.relnamespace where n.nspname='concierge' and t.relkind='r'"), 't')
        self.assertEqual(ok("select bool_and(not has_function_privilege('anon',p.oid,'execute')) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'concierge_%'"), 't')

    def test_01_invitation_capability_and_private_intake(self):
        self.denied(N, 'concierge_client_view', [])
        self.denied(C, 'concierge_advisor_directory', [])
        directory = call(V, 'concierge_advisor_directory', [])
        self.assertEqual(directory['capabilities'], dict(view=True, edit=False, publish=False, confirmPayments=False))
        self.assertEqual(len(directory['clients']), 2)
        self.deny_write(V, 'advisor_write', 'save_intake', {}, 0)
        self.deny_write(C, 'write', 'submit_intake', {}, 0)
        self.published()
        public = call(C, 'concierge_client_view', [])
        self.assertIsNone(public['plan'])
        self.assertNotIn('PRIVATE_', json.dumps(public))
        private = call(V, 'concierge_advisor_view', [lit(C)])
        self.assertEqual(private['intake']['note'], 'PRIVATE_INTAKE_CANARY')
        self.assertEqual(private['client']['plan']['version'], 1)
        self.deny_write(V, 'write', 'publish', {}, 3)
        self.denied(D, 'concierge_checkin_read', [lit(C)])

    def test_02_private_notes_and_frozen_baseline(self):
        self.published()
        write(A, 'advisor_write', 'save_meeting_note', dict(kind='transcript', text='PRIVATE_TRANSCRIPT_CANARY'), 3)
        self.assertEqual(call(A, 'concierge_advisor_view', [lit(C)])['meetingNotes'][0]['text'], 'PRIVATE_TRANSCRIPT_CANARY')
        self.assertNotIn('PRIVATE_', json.dumps(call(C, 'concierge_client_view', [])))
        self.deny_write(A, 'advisor_write', 'save_intake', dict(goal='Later', note='', baseline=[dict(slot='moisturizer', productId='forged')]), 4, 'baseline_conflict')

    def test_03_exact_retry_revoked_before_replay(self):
        request = str(uuid.uuid4())
        payload = dict(goal='Comfort', note='', baseline=[dict(slot='moisturizer', productId='original')])
        first = write(A, 'advisor_write', 'save_intake', payload, 0, request=request)
        self.assertEqual(write(A, 'advisor_write', 'save_intake', payload, 0, request=request), first)
        self.deny_write(A, 'advisor_write', 'save_intake', dict(payload, goal='Changed'), 0, 'request_conflict', request=request)
        ok('update concierge.advisors set can_edit=false where user_id=' + lit(A))
        self.deny_write(A, 'advisor_write', 'save_intake', payload, 0, request=request)

    def test_04_unverified_claim_does_not_unlock_and_confirm_is_atomic(self):
        self.published(); quote = self.issue()
        basis = dict(quoteId=quote['quoteId'], quoteVersion=1, serviceCents=10000, productCents=0, totalCents=10000, shippingAddressVersion=None)
        claim = write(C, 'payment_write', 'submit_claim', dict(**basis, evidenceId=None), 1)
        self.assertEqual(claim['status'], 'submitted_unverified'); self.assertFalse(claim['serviceUnlocked'])
        self.assertIsNone(call(C, 'concierge_client_view', [])['plan'])
        payload = dict(**basis, claimId=claim['claimId'], bankReceiptVerified=True)
        self.deny_write(V, 'payment_write', 'confirm_payment', payload, 2)
        self.deny_write(A, 'payment_write', 'confirm_payment', dict(payload, bankReceiptVerified=False), 2, 'invalid_input')
        request = str(uuid.uuid4()); confirmed = write(A, 'payment_write', 'confirm_payment', payload, 2, request=request)
        self.assertTrue(confirmed['serviceUnlocked']); self.assertIsNone(confirmed['productOrderStatus'])
        self.assertEqual(write(A, 'payment_write', 'confirm_payment', payload, 2, request=request), confirmed)
        self.assertEqual(ok('select count(*) from concierge.payment_confirmations'), '1')
        self.assertEqual(call(C, 'concierge_client_view', [])['plan']['version'], 1)
        self.deny_write(A, 'payment_write', 'confirm_payment', payload, 3, 'publication_conflict')
        self.assertEqual(ok("select count(*) from concierge.payment_audit where action='confirm_payment'"), '1')

    def test_05_stale_quote_and_integer_allocations(self):
        self.published(); old = self.issue(); current = self.issue(1)
        bad = dict(quoteId=old['quoteId'], quoteVersion=1, serviceCents=10000, productCents=0, totalCents=10000, shippingAddressVersion=None, evidenceId=None)
        self.deny_write(C, 'payment_write', 'submit_claim', bad, 2, 'publication_conflict')
        bad.update(quoteId=current['quoteId'], quoteVersion=2, totalCents=10001)
        self.deny_write(C, 'payment_write', 'submit_claim', bad, 2, 'invalid_input')
        bad.update(totalCents=10000.5)
        self.deny_write(C, 'payment_write', 'submit_claim', bad, 2, 'invalid_input')

    def test_06_service_dates_derive_from_first_publication(self):
        self.published()
        quote = self.issue()
        record = call(C, 'concierge_payment_view', [lit(C)])['quotes'][0]
        self.assertEqual(record['servicePeriod'], dict(startOn=self.today.isoformat(), endOn=next_month(self.today).isoformat()))
        self.claim_confirm(quote, 1)
        self.assertEqual(ok('select count(*) from concierge.activations'), '0')
        money = dict(record)
        for key in ['id','version','currency','status']: money.pop(key)
        money['servicePeriod'] = dict(startOn='2027-01-31',endOn='2027-02-28')
        self.deny_write(A, 'payment_write', 'issue_quote', money, 3, 'invalid_input')

    def test_07_product_paid_is_only_ready_and_receive_start_separate(self):
        self.paid()
        write(C, 'write', 'decide', dict(version=1, recommendationId='replacement-v1', choice='approved', reason=''), 3)
        write(C, 'payment_write', 'confirm_shipping_address', dict(address=self.address()), 3)
        quote = self.issue(4, 0, True)
        result, _ = self.claim_confirm(quote, 5, 0, 1600)
        self.assertEqual(result['productOrderStatus'], 'ready_to_purchase'); self.assertFalse(result['serviceUnlocked'])
        self.assertEqual(call(C, 'concierge_client_view', [])['routine'][0]['productId'], 'original')
        payload = dict(version=1, recommendationId='replacement-v1', startedOn=self.today.isoformat())
        self.deny_write(C, 'write', 'start', payload, 4, 'product_not_received')
        write(C, 'write', 'receive', dict(version=1, recommendationId='replacement-v1'), 4)
        self.assertEqual(call(C, 'concierge_client_view', [])['routine'][0]['productId'], 'original')
        write(C, 'write', 'start', payload, 5)
        self.assertEqual(call(C, 'concierge_client_view', [])['routine'][0]['productId'], 'replacement')

    def test_08_cancelled_read_and_revoked_replay(self):
        self.paid()
        payload = dict(comfort='Fine', consistency='Daily', changes='', photoIds=[]); request = str(uuid.uuid4())
        write(C, 'checkin_write', 'submit_report', payload, 0, request=request)
        ok("update concierge.enrollments set status='cancelled' where client_id=" + lit(C))
        self.assertEqual(call(C, 'concierge_client_view', [])['plan']['version'], 1)
        self.deny_write(C, 'checkin_write', 'submit_report', payload, 0, request=request)
        self.deny_write(C, 'write', 'receive', dict(version=1, recommendationId='replacement-v1'), 3)
        ok("update concierge.enrollments set status='revoked' where client_id=" + lit(C))
        self.denied(C, 'concierge_client_view', [])

    def test_09_optional_premeeting_reports_private_notes_and_expiry(self):
        payload = dict(comfort='Fine', consistency='Daily', changes='', photoIds=[])
        report = write(C, 'checkin_write', 'submit_report', payload, 0)
        write(A, 'checkin_write', 'add_meeting_note', dict(checkinId=report['reportId'], note='PRIVATE_CHECKIN_CANARY'), 1)
        public = call(C, 'concierge_checkin_read', [lit(C)])
        self.assertNotIn('PRIVATE_', json.dumps(public)); self.assertNotIn('meetingNotes', public)
        self.assertEqual(call(V, 'concierge_checkin_advisor_read', [lit(C)])['meetingNotes'][0]['note'], 'PRIVATE_CHECKIN_CANARY')
        ok("update concierge.enrollments set phase='ongoing' where client_id=" + lit(C))
        self.deny_write(C, 'checkin_write', 'submit_report', payload, 2)

    def test_10_photo_reserve_complete_attach_owner_and_no_reuse(self):
        descriptor = write(C, 'checkin_write', 'reserve_photo', dict(angle='front', contentType='image/png', sizeBytes=100, sha256='a'*64), 0)
        self.assertTrue(descriptor['path'].startswith(C+'/')); self.assertEqual(descriptor['state'], 'pending')
        self.deny_write(C, 'checkin_write', 'complete_photo', dict(photoId=descriptor['photoId']), 1, 'upload_incomplete')
        self.denied(D, 'concierge_checkin_photo_authorize', [lit(C), lit(descriptor['photoId'])])
        ok("insert into storage.objects(bucket_id,name,metadata) values('concierge-checkin-photos',"+lit(descriptor['path'])+",'{\"size\":100,\"mimetype\":\"image/png\"}')")
        write(C, 'checkin_write', 'complete_photo', dict(photoId=descriptor['photoId']), 1)
        authorized = call(C, 'concierge_checkin_photo_authorize', [lit(C), lit(descriptor['photoId'])])
        self.assertEqual(authorized['state'], 'complete')
        payload = dict(comfort='Fine', consistency='Daily', changes='', photoIds=[descriptor['photoId']])
        self.deny_write(D, 'checkin_write', 'submit_report', payload, 0)
        write(C, 'checkin_write', 'submit_report', payload, 2)
        self.deny_write(C, 'checkin_write', 'submit_report', payload, 3)
        public = call(C, 'concierge_checkin_read', [lit(C)])
        self.assertEqual(public['reports'][0]['photos'], [dict(id=descriptor['photoId'], angle='front')])
        self.assertNotIn(descriptor['path'], json.dumps(public))

    def test_11_evidence_unverified_not_financial_and_immutable(self):
        self.published(); quote = self.issue(); request = str(uuid.uuid4())
        args = [lit(C), lit(request), '1', lit(quote['quoteId']), '1', lit('image/png'), '100', lit('b'*64)]
        descriptor = call(C, 'concierge_payment_evidence_reserve', args)
        self.assertEqual(call(C, 'concierge_payment_evidence_reserve', args), descriptor)
        self.assertEqual(call(C, 'concierge_payment_view', [lit(C)])['revision'], 1)
        ok("insert into storage.objects(bucket_id,name,metadata) values('concierge-payment-evidence',"+lit(descriptor['storagePath'])+",'{\"size\":100,\"mimetype\":\"image/png\"}')")
        complete = call(C, 'concierge_payment_evidence_commit', [lit(descriptor['evidenceId']), lit(uuid.uuid4())])
        self.assertEqual(complete['status'], 'uploaded_unverified')
        self.assertEqual(call(C, 'concierge_payment_view', [lit(C)])['revision'], 1)
        self.assertIsNone(call(C, 'concierge_client_view', [])['plan'])
        self.denied(D, 'concierge_payment_evidence_access', [lit(descriptor['evidenceId'])])
        r = q("update storage.objects set metadata='{\"size\":101,\"mimetype\":\"image/png\"}' where name="+lit(descriptor['storagePath']))
        self.assertNotEqual(r.returncode, 0); self.assertIn('concierge_immutable', r.stderr)

    def test_12_deletion_fence_blocks_authorized_but_delayed_upload(self):
        descriptor = write(C, 'checkin_write', 'reserve_photo', dict(angle='front', contentType='image/png', sizeBytes=100, sha256='c'*64), 0)
        ok('update public.profiles set deletion_started_at=now() where id='+lit(C))
        r = q("insert into storage.objects(bucket_id,name,metadata) values('concierge-checkin-photos',"+lit(descriptor['path'])+",'{\"size\":100,\"mimetype\":\"image/png\"}')")
        self.assertNotEqual(r.returncode, 0); self.assertIn('concierge_forbidden', r.stderr)
        self.denied(C, 'concierge_checkin_read', [lit(C)])

    def test_13_simultaneous_confirm_exact_retry_applies_once(self):
        self.published(); quote = self.issue()
        basis = dict(quoteId=quote['quoteId'], quoteVersion=1, serviceCents=10000, productCents=0, totalCents=10000, shippingAddressVersion=None)
        claim = write(C, 'payment_write', 'submit_claim', dict(**basis, evidenceId=None), 1)
        payload = dict(**basis, claimId=claim['claimId'], bankReceiptVerified=True); request = str(uuid.uuid4())
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: write(A, 'payment_write', 'confirm_payment', payload, 2, request=request), range(2)))
        self.assertEqual(results[0], results[1]); self.assertEqual(ok('select count(*) from concierge.payment_confirmations'), '1')

    def test_14_paid_before_publication_starts_once_at_first_publish(self):
        money = dict(publicationVersion=0,serviceCents=10000,servicePeriod=None,items=[],productSubtotalCents=0,taxCents=0,shippingCents=0,productTotalCents=0,totalCents=10000,shippingAddressVersion=None)
        quote = write(A,'payment_write','issue_quote',money,0)
        receipt, _ = self.claim_confirm(quote,1)
        self.assertFalse(receipt['serviceUnlocked']); self.assertEqual(receipt['serviceAccessStatus'],'pending_publication')
        self.assertEqual(call(C,'concierge_payment_view',[lit(C)])['service'],dict(status='pending_publication',period=None))
        self.assertIsNone(call(C,'concierge_client_view',[])['plan'])
        write(C,'checkin_write','submit_report',dict(comfort='Before meeting',consistency='Optional',changes='',photoIds=[]),0)
        self.published()
        service = call(C,'concierge_payment_view',[lit(C)])['service']
        self.assertEqual(service,dict(status='active',period=dict(startOn=self.today.isoformat(),endOn=next_month(self.today).isoformat())))
        write(A,'write','save_draft',dict(intakeVersion=1,recommendations=[dict(self.recommendation,rationale='Updated published context')],advisorNote='Private'),3)
        write(A,'write','publish',{},4)
        self.assertEqual(call(C,'concierge_payment_view',[lit(C)])['service'],service)
        self.assertEqual(ok('select count(*) from concierge.service_periods'),'1')
        self.assertEqual(call(C,'concierge_payment_view',[lit(C)])['quotes'][0]['servicePeriod'],None)
        self.assertEqual(call(C,'concierge_client_view',[])['plan']['version'],2)

    def test_15_shipping_confirmation_is_private_versioned_and_stales_product_quote(self):
        self.paid()
        write(C,'write','decide',dict(version=1,recommendationId='replacement-v1',choice='approved',reason=''),3)
        address = write(C,'payment_write','confirm_shipping_address',dict(address=self.address()),3)
        self.assertEqual(address['addressVersion'],1)
        quote = self.issue(4,0,True)
        write(C,'payment_write','confirm_shipping_address',dict(address=self.address('200 Synthetic Lane')),5)
        view = call(C,'concierge_payment_view',[lit(C)])
        self.assertEqual(view['shippingAddress']['version'],2)
        self.assertEqual(view['quotes'][-1]['status'],'superseded')
        self.deny_write(C,'payment_write','submit_claim',dict(quoteId=quote['quoteId'],quoteVersion=2,serviceCents=0,productCents=1600,totalCents=1600,shippingAddressVersion=1,evidenceId=None),6,'publication_conflict')
        self.assertNotIn('Synthetic Lane',json.dumps(call(C,'concierge_client_view',[])))
        self.deny_write(D,'payment_write','confirm_shipping_address',dict(address=self.address()),0,client=C)
        self.assertEqual(ok('select count(*) from concierge.shipping_addresses'),'2')

    def test_16_decline_after_quote_blocks_bank_confirmation(self):
        self.paid()
        write(C,'write','decide',dict(version=1,recommendationId='replacement-v1',choice='approved',reason=''),3)
        write(C,'payment_write','confirm_shipping_address',dict(address=self.address()),3)
        quote=self.issue(4,0,True)
        basis=dict(quoteId=quote['quoteId'],quoteVersion=2,serviceCents=0,productCents=1600,totalCents=1600,shippingAddressVersion=1)
        claim=write(C,'payment_write','submit_claim',dict(**basis,evidenceId=None),5)
        write(C,'write','decide',dict(version=1,recommendationId='replacement-v1',choice='declined',reason='Changed my choice'),4)
        self.deny_write(A,'payment_write','confirm_payment',dict(**basis,claimId=claim['claimId'],bankReceiptVerified=True),6,'publication_conflict')
        self.assertEqual(ok('select count(*) from concierge.product_orders'),'0')

    def test_17_auth_delete_cascades_evidence_backed_claim_and_private_rows(self):
        self.published(); quote=self.issue()
        d=call(C,'concierge_payment_evidence_reserve',[lit(C),lit(uuid.uuid4()),'1',lit(quote['quoteId']),'1',lit('image/png'),'100',lit('e'*64)])
        ok("insert into storage.objects(bucket_id,name,metadata) values('concierge-payment-evidence',"+lit(d['storagePath'])+",'{\"size\":100,\"mimetype\":\"image/png\"}')")
        call(C,'concierge_payment_evidence_commit',[lit(d['evidenceId']),lit(uuid.uuid4())])
        basis=dict(quoteId=quote['quoteId'],quoteVersion=1,serviceCents=10000,productCents=0,totalCents=10000,shippingAddressVersion=None)
        claim=write(C,'payment_write','submit_claim',dict(**basis,evidenceId=d['evidenceId']),1)
        write(A,'payment_write','confirm_payment',dict(**basis,claimId=claim['claimId'],bankReceiptVerified=True),2)
        write(C,'payment_write','confirm_shipping_address',dict(address=self.address()),3)
        # The service deletion handler removes private Storage first; this models
        # its successful Storage response, then the real FK cascade transaction.
        ok('delete from storage.objects where name='+lit(d['storagePath']))
        ok('delete from auth.users where id='+lit(C))
        for table in ['cases','enrollments','claims','payment_evidence','payment_confirmations','service_periods','shipping_addresses','workflow_requests']:
            self.assertEqual(ok('select count(*) from concierge.'+table+' where client_id='+lit(C)),'0',table)

    def test_18_prepaid_renewal_does_not_replace_current_period_or_extend_on_republish(self):
        self.paid()
        period=call(C,'concierge_payment_view',[lit(C)])['service']['period']
        quote=self.issue(3,start=next_month(self.today))
        self.claim_confirm(quote,4)
        self.assertEqual(call(C,'concierge_payment_view',[lit(C)])['service']['period'],period)
        self.assertEqual(ok('select count(*) from concierge.service_periods'),'2')

    def test_19_settled_order_retains_bound_private_address_snapshot(self):
        self.paid()
        write(C,'write','decide',dict(version=1,recommendationId='replacement-v1',choice='approved',reason=''),3)
        write(C,'payment_write','confirm_shipping_address',dict(address=self.address()),3)
        quote=self.issue(4,0,True);self.claim_confirm(quote,5,0,1600)
        write(C,'payment_write','confirm_shipping_address',dict(address=self.address('200 Synthetic Lane')),7)
        view=call(V,'concierge_payment_view',[lit(C)])
        settled=next(q for q in view['quotes'] if q['id']==quote['quoteId'])
        self.assertEqual(settled['shippingAddressVersion'],1)
        self.assertEqual(settled['status'],'settled')
        bound=next(a for a in view['shippingAddresses'] if a['version']==settled['shippingAddressVersion'])
        self.assertEqual(bound['address'],self.address())
        self.assertEqual(view['shippingAddress']['version'],2)

    def test_20_old_publish_exact_retry_does_not_supersede_a_new_quote(self):
        write(A,'advisor_write','save_intake',dict(goal='Comfort',note='',baseline=[dict(slot='moisturizer',productId='original')]),0)
        write(A,'write','save_draft',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote=''),1)
        request=str(uuid.uuid4());published=write(A,'write','publish',{},2,request=request)
        quote=self.issue();self.claim_confirm(quote,1)
        write(A,'write','save_draft',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote=''),3)
        write(A,'write','publish',{},4)
        money=dict(publicationVersion=2,serviceCents=10000,servicePeriod=dict(startOn=next_month(self.today).isoformat(),endOn=next_month(next_month(self.today)).isoformat()),items=[],productSubtotalCents=0,taxCents=0,shippingCents=0,productTotalCents=0,totalCents=10000,shippingAddressVersion=None)
        current=write(A,'payment_write','issue_quote',money,3)
        self.assertEqual(write(A,'write','publish',{},2,request=request),published)
        view=call(C,'concierge_payment_view',[lit(C)])
        self.assertEqual(next(q for q in view['quotes'] if q['id']==current['quoteId'])['status'],'payable')

    def test_21_server_invoice_period_and_separate_rejection_capability(self):
        self.published()
        unpaid=call(C,'concierge_payment_view',[lit(C)])
        expected=dict(startOn=self.today.isoformat(),endOn=next_month(self.today).isoformat())
        self.assertEqual(unpaid['service'],dict(status='unpaid',period=expected))
        self.assertEqual(unpaid['nextServicePeriod'],expected)
        quote=self.issue()
        basis=dict(quoteId=quote['quoteId'],quoteVersion=1,serviceCents=10000,productCents=0,totalCents=10000,shippingAddressVersion=None)
        claim=write(C,'payment_write','submit_claim',dict(**basis,evidenceId=None),1)
        ok('update concierge.advisors set can_edit=true where user_id='+lit(V))
        self.deny_write(V,'payment_write','confirm_payment',dict(**basis,claimId=claim['claimId'],bankReceiptVerified=True),2)
        rejected=write(V,'payment_write','reject_claim',dict(**basis,claimId=claim['claimId'],reasonCode='not_received'),2)
        self.assertEqual(rejected['status'],'rejected')

    def test_22_service_only_invoice_and_private_proof_survive_republication(self):
        self.published();quote=self.issue()
        write(A,'write','save_draft',dict(intakeVersion=1,recommendations=[self.recommendation],advisorNote='Private revision'),3)
        write(A,'write','publish',{},4)
        d=call(C,'concierge_payment_evidence_reserve',[lit(C),lit(uuid.uuid4()),'1',lit(quote['quoteId']),'1',lit('image/png'),'100',lit('f'*64)])
        ok("insert into storage.objects(bucket_id,name,metadata) values('concierge-payment-evidence',"+lit(d['storagePath'])+",'{\"size\":100,\"mimetype\":\"image/png\"}')")
        call(C,'concierge_payment_evidence_commit',[lit(d['evidenceId']),lit(uuid.uuid4())])
        receipt,_=self.claim_confirm(quote,1)
        self.assertTrue(receipt['serviceUnlocked'])
        self.assertEqual(call(C,'concierge_client_view',[])['plan']['version'],2)


if __name__ == '__main__':
    if '--reset' in sys.argv:
        sys.argv.remove('--reset')
        marker = q("select shobj_description(oid,'pg_database') from pg_database where datname="+lit(DB), 'postgres')
        assert marker.returncode == 0 and marker.stdout.strip() == MARKER, marker.stderr
        for command in [[str(BIN/'dropdb'), *CONNECTION, DB], [str(BIN/'createdb'), *CONNECTION, '-T', TEMPLATE, DB]]:
            subprocess.run(command, env=ENV, check=True, capture_output=True, text=True, timeout=20)
        ok('comment on database '+DB+' is '+lit(MARKER))
        subprocess.run([str(BIN/'psql'), '-X', *CONNECTION, '-d', DB, '-v', 'ON_ERROR_STOP=1', '-f', str(ROOT/'supabase/migrations/20261018234537_concierge_portal_workflows.sql')], env=ENV, check=True, stdout=subprocess.DEVNULL, timeout=20)
    unittest.main(verbosity=2)
