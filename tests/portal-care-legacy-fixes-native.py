"""CB1/CB2 regressions, actual Care/Plan handlers and own marked Unix-only PG15.

Requires .local-artifacts/w1-care-fixes-r1/fixture.json for an independently
allocated RUNNING cluster. Never starts/adopts an old author/reviewer fixture.
--prepare replays the retained minimal harness; --retained runs its unchanged26.
Only fixture constants/import paths are adapted in ignored copies, with hashes.
Auth identity/session claims are synthetic; SQL, handlers and mappers are real.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import unittest
import uuid

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / '.local-artifacts/w1-care-fixes-r1'
FIXTURE = json.loads((ART / 'fixture.json').read_text())
SOCKET = FIXTURE['socket']
DB = 'shelv_cfix_e26d_synthetic'
MARKER = 'W1 care fixes e26d synthetic Unix-only 20261031'
assert FIXTURE['workspace'] == str(ROOT) and FIXTURE['state'] == 'RUNNING'
assert SOCKET.startswith('/tmp/sh-cfix-e26d-') and len(SOCKET) == 26
assert FIXTURE['database'] == DB and FIXTURE['marker'] == MARKER and FIXTURE['port'] == 55473
assert Path(FIXTURE['data']).resolve() == ART / 'pg/data'
os.environ['SHELV_CARE_SOCKET'] = SOCKET
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
os.environ['PATH'] = '/Users/kanuj/.nvm/versions/node/v22.23.0/bin:/opt/homebrew/opt/postgresql@15/bin:' + os.environ['PATH']


def digest(data):
    return hashlib.sha256(data).hexdigest()


copies = {}
for original, destination in [('portal-care-native.py', 'native.py'), ('portal-care-native-edge.mjs', 'edge.mjs')]:
    path = ROOT / 'tests' / original
    text = path.read_text()
    adapted = text.replace('55461', '55473').replace('shelv_care_caf2b712_synthetic', DB).replace('W1 care caf2b712 synthetic Unix-only 20261031', MARKER).replace('shelv-care-caf2b712', 'shelv-care-fixes-e26d')
    if original.endswith('.py'):
        adapted = adapted.replace("ROOT=Path(__file__).resolve().parents[1]", 'ROOT=Path(' + repr(str(ROOT)) + ')')
        adapted = adapted.replace("SOCKET.startswith('/tmp/sh-care-caf2b712-') and len(SOCKET)==30", 'SOCKET==' + repr(SOCKET))
        adapted = adapted.replace("ROOT/'tests/portal-care-native-edge.mjs'", 'Path(' + repr(str(ART / 'edge.mjs')) + ')')
    else:
        adapted = adapted.replace("'../supabase/", "'" + str(ROOT) + '/supabase/')
        adapted = adapted.replace("!/^\\/tmp\\/sh-care-caf2b712-[a-f0-9]{8}$/.test(socket)", 'socket!==' + json.dumps(SOCKET))
    (ART / destination).write_text(adapted)
    copies[original] = dict(originalSha256=digest(path.read_bytes()), copySha256=digest(adapted.encode()), copy=str(ART / destination))
(ART / 'harness-copy.json').write_text(json.dumps(copies, indent=2))
spec = importlib.util.spec_from_file_location('care_legacy_own', ART / 'native.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
w, q, lit, care, plan = m.w, m.q, m.lit, m.care, m.plan
A, S, C = m.A, m.S, m.C
probe = m.raw("select jsonb_build_object('data',current_setting('data_directory'),'socket',current_setting('unix_socket_directories'),'port',current_setting('port'),'listen',current_setting('listen_addresses'),'pid',pg_postmaster_start_time())", 'postgres')
assert probe.returncode == 0, probe.stderr
identity = json.loads(probe.stdout)
assert identity['data'] == FIXTURE['data'] and identity['socket'] == SOCKET and identity['port'] == '55473' and identity['listen'] == ''
assert int((Path(FIXTURE['data']) / 'postmaster.pid').read_text().splitlines()[0]) == FIXTURE['pid']

TABLES = ['publications', 'publication_presentations', 'plan_documents', 'plan_publication_receipts', 'intakes', 'activations', 'receipts', 'quotes', 'claims', 'payment_confirmations', 'service_periods', 'entitled_publications', 'plan_review_schedule']


def snapshot(tables):
    sql = "select jsonb_object_agg(name,rows)::text from (" + ' union all '.join("select '" + t + "' name,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') rows from concierge." + t + ' x' for t in tables) + ') z'
    result = m.raw("begin;set local timezone='UTC';" + sql + ';commit;')
    assert result.returncode == 0, result.stderr
    return next(line for line in result.stdout.split('\n') if line.startswith('{'))


class LegacyFixTests(unittest.TestCase):
    def setUp(self):
        m.prepare()
        self.t = m.CareTests()
        self.t.setUp()
        self.today = q("select (clock_timestamp() at time zone 'America/Chicago')::date")
        self.yesterday = q("select (clock_timestamp() at time zone 'America/Chicago')::date-1")

    def ok(self, result):
        self.assertEqual(result['status'], 200, result)
        return result['body']

    def legacy(self, start):
        # Exact R2 repro: original publication/finance/Start exist BEFORE M56.
        w.prepare()
        q((ROOT / 'supabase/migrations/20261031003846_portal_rebuild_advisor_reads_v1.sql').read_text())
        self.t.setUp()
        presentation = json.loads((ROOT / 'tests/fixtures/concierge-presentation.json').read_text())['presentation']
        q('update concierge.plan_policy set activated=false;insert into concierge.intakes values(' + lit(C) + ",1,'original goal','PRIVATE_LEGACY_CANARY',now());insert into concierge.publications(client_id,version,intake_version,recommendations,published_by) values(" + lit(C) + ",1,1,'[]'," + lit(A) + '),(' + lit(C) + ",2,1,'[]'," + lit(A) + ');insert into concierge.publication_presentations values(' + lit(C) + ',2,' + lit(json.dumps(presentation)) + ');update concierge.cases set published_version=2 where client_id=' + lit(C) + ';update concierge.plan_policy set activated=true')
        self.t.fund()
        q('insert into concierge.activations(client_id,version,recommendation_id,slot,product_id,started_on) values(' + lit(C) + ",2,'original-baseline','moisturizer','original'," + lit(start) + ')')
        before = snapshot(TABLES)
        dispatcher = q("select prosrc from pg_proc where oid='public.concierge_plan_command_v1(jsonb)'::regprocedure")
        q(m.MIGRATION.read_text())
        self.assertEqual(snapshot(TABLES), before)
        self.assertEqual(q("select prosrc from pg_proc where oid='concierge.plan_command_before_care_v1(jsonb)'::regprocedure"), dispatcher)
        view = self.ok(care(C, 'read_client_plan_v2', version=2))
        self.t.product = dict(kind='plan_product', publication=dict(version=2, documentSchemaVersion=2), productId='original', slotId=None)
        self.p = next(p for p in view['plan']['content']['products'] if p['id'] == 'original')
        self.original = before

    def state(self, version=None):
        return next(s for s in self.ok(care(C, 'read_client_plan_v2', version=version))['use']['planProducts'] if s['product']['productId'] == self.t.product['productId'])

    def report(self, kind, occurrence=None, actor=C, **changes):
        command = self.t.command(kind, revision=int(q('select concierge.care_revision(' + lit(C) + ')')))
        command.update(sourcePublication=self.t.product['publication'], occurredOn=occurrence or dict(state='unknown'), **changes)
        action = 'report_product_use_v1' if actor == C else 'record_client_use_v1'
        if actor != C:
            command.update(clientId=C, confirmedClientReport=True)
        return self.ok(care(actor, action, **command))

    def publish_v3(self, different=True):
        v = self.t.saved()
        d = v['draft']
        body = d['content']
        body['products'] = [{**self.p, **(dict(variant='different exact synthetic variant') if different else {})}]
        v = self.ok(plan(A, 'save_draft_v1', requestId=str(uuid.uuid4()), draftId=d['id'], expectedContentRevision=d['contentRevision'], expectedAssignmentRevision=d['assignmentRevision'], kind='care_plan', content=body))
        d = v['draft']
        for section in v['sections']:
            self.ok(plan(A, 'review_section_v1', requestId=str(uuid.uuid4()), draftId=d['id'], expectedContentRevision=d['contentRevision'], expectedAssignmentRevision=d['assignmentRevision'], sectionId=section['sectionId'], sectionHash=section['sectionHash']))
        v = self.ok(plan(A, 'read_draft_v1', draftId=d['id']))
        approval = self.ok(plan(A, 'approve_publication_v1', requestId=str(uuid.uuid4()), target=v['target'], scope='care_plan.publish', publisher=dict(kind='human', actorId=A)))
        pub = self.ok(plan(A, 'publish_plan_v1', requestId=str(uuid.uuid4()), target=v['target'], approvalId=approval['id'], firstServiceClaimId=None))
        self.assertEqual(pub['publicationVersion'], 3)
        self.assertFalse(pub['firstServiceStarted'])
        self.t.product = {**self.t.product, 'publication': dict(version=3, documentSchemaVersion=3)}

    def assert_legacy_fence(self, denied=True):
        before = snapshot(TABLES + ['care_events', 'care_use_events', 'care_use_amendments', 'care_use_heads', 'care_report_heads', 'care_instruction_heads', 'care_requests', 'care_attention', 'plan_requests', 'plan_events', 'plan_deliveries'])
        for actor, action, fields in [(C, 'read_client_plan_v1', dict(version=None)), (A, 'read_advisor_publication_v1', dict(clientId=C, version=None))]:
            result = plan(actor, action, **fields)
            if denied:
                self.assertEqual(result, dict(status=409, body=dict(code='use_version_required')))
            else:
                self.ok(result)
        # Actual retained public R1/R2 surfaces sharing the helper, no raw-helper permission.
        v3 = q('select exists(select 1 from concierge.publications where client_id=' + lit(C) + ' and document_schema_version=3)') == 't'
        for actor, invocation in [(C, 'concierge_client_view()'), (C, 'concierge_client_view_v2()'), (A, 'concierge_advisor_view(' + lit(C) + ')'), (A, 'concierge_advisor_view_v2(' + lit(C) + ')'), (A, 'concierge_advisor_preview_v2(' + lit(C) + ",'published',null)")]:
            result = m.raw(w.session(actor) + 'select public.' + invocation + ';commit;')
            # R1 cannot express R2; all retained surfaces already reject V3.
            content_denied = v3 or invocation.startswith(('concierge_client_view()', 'concierge_advisor_view('))
            if content_denied or denied:
                self.assertNotEqual(result.returncode, 0, invocation)
                self.assertIn('concierge_content_version_required' if content_denied else 'concierge_use_version_required', result.stderr, (invocation, result.stderr))
            else:
                self.assertEqual(result.returncode, 0, (invocation, result.stderr))
        self.assertEqual(snapshot(TABLES + ['care_events', 'care_use_events', 'care_use_amendments', 'care_use_heads', 'care_report_heads', 'care_instruction_heads', 'care_requests', 'care_attention', 'plan_requests', 'plan_events', 'plan_deliveries']), before)

    def test_01_cb1_r2_backdated_stop_flags_legacy_start(self):
        self.legacy(self.today)
        receipt = self.report('stopped', dict(state='known', value=self.yesterday))
        for zone in ['UTC', 'Pacific/Honolulu', 'Asia/Tokyo']:
            q('alter database ' + DB + ' set timezone=' + lit(zone))
            before = snapshot(TABLES + ['care_events', 'care_use_heads', 'care_attention', 'plan_deliveries'])
            s = self.state(2)
            self.assertEqual(s['state'], 'stopped')
            self.assertEqual(s['originalStart'], dict(state='known', value=self.today))
            self.assertEqual(s['latestEvent']['occurredOn'], dict(state='known', value=self.yesterday))
            self.assertTrue(s['contradiction'], 'CB1: newer preserved legacy Start must participate')
            self.assertEqual(s['latestEvent']['eventId'], receipt['event']['id'])
            self.assertEqual(snapshot(TABLES + ['care_events', 'care_use_heads', 'care_attention', 'plan_deliveries']), before)
        self.assertEqual(snapshot(TABLES), self.original)
        self.assert_legacy_fence()

    def test_02_cb2_r2_changed_variant_unknown_start_denies_actual_plan_handler(self):
        self.legacy('2024-02-29')
        originals = snapshot(['publications', 'publication_presentations', 'activations', 'receipts'])
        self.publish_v3()
        self.report('started')
        s = self.state(3)
        self.assertEqual((s['state'], s['originalStart']), ('using', dict(state='unknown')))
        for zone in ['UTC', 'Pacific/Honolulu', 'Asia/Tokyo']:
            q('alter database ' + DB + ' set timezone=' + lit(zone))
            self.assertEqual(plan(C, 'read_client_plan_v1', version=3), dict(status=409, body=dict(code='use_version_required')))
            self.assert_legacy_fence()
        preserved = json.loads(snapshot(['publications', 'publication_presentations', 'activations', 'receipts']))
        old = json.loads(originals)
        self.assertEqual(preserved['publications'][:2], old['publications'])
        for name in ['publication_presentations', 'activations', 'receipts']:
            self.assertEqual(preserved[name], old[name])

    def test_03_cb1_independent_v3_candidate(self):
        self.t.published_product()
        q('insert into concierge.activations(client_id,version,recommendation_id,slot,product_id,started_on) values(' + lit(C) + ",1,'original-synthetic','original-synthetic-slot'," + lit(self.t.product['productId']) + ',' + lit(self.today) + ')')
        original = snapshot(TABLES)
        self.report('stopped', dict(state='known', value=self.yesterday))
        self.assertTrue(self.state(1)['contradiction'], 'CB1 V3: legacy actual Start omitted')
        self.assertEqual(self.state(1)['state'], 'stopped')
        self.assertEqual(snapshot(TABLES), original)

    def test_04_cb2_independent_v3_candidate(self):
        self.t.published_product()
        q('insert into concierge.activations(client_id,version,recommendation_id,slot,product_id,started_on) values(' + lit(C) + ",1,'original-synthetic','original-synthetic-slot'," + lit(self.t.product['productId']) + ",'2024-02-29')")
        self.t.next_publication(lambda b: b['products'][0].update(variant='different exact synthetic variant'))
        self.t.product = {**self.t.product, 'publication': dict(version=2, documentSchemaVersion=3)}
        self.report('started')
        self.assertEqual(self.state(2)['originalStart'], dict(state='unknown'))
        self.assertEqual(plan(C, 'read_client_plan_v1', version=2), dict(status=409, body=dict(code='use_version_required')))

    def test_05_legacy_equal_after_unknown_stop_controls(self):
        for kind, occurrence in [('stopped', dict(state='known', value=self.today)), ('paused', dict(state='unknown')), ('stopped', dict(state='unknown'))]:
            with self.subTest(kind=kind, occurrence=occurrence):
                self.legacy(self.yesterday)
                self.report(kind, occurrence)
                s = self.state(2)
                self.assertEqual(s['state'], kind)
                self.assertFalse(s['contradiction'])
                self.assertEqual(s['originalStart'], dict(state='known', value=self.yesterday))
        self.legacy(self.today)
        self.report('stopped', dict(state='known', value=self.today))
        self.assertFalse(self.state(2)['contradiction'])

    def test_06_compatible_legacy_remains_readable_including_same_tuple_v3(self):
        self.legacy('2024-02-29')
        self.assert_legacy_fence(False)
        self.publish_v3(False)
        self.assertEqual(self.state(3)['originalStart'], dict(state='known', value='2024-02-29'))
        self.assert_legacy_fence(False)
        self.report('started', dict(state='known', value='2024-02-29'))
        self.assert_legacy_fence(False)

    def test_07_no_event_changed_descriptor_cannot_borrow_legacy_start(self):
        self.legacy('2024-02-29')
        self.publish_v3()
        before = snapshot(['activations', 'care_events', 'care_use_heads', 'plan_events', 'plan_deliveries'])
        self.assertEqual(self.state(3)['state'], 'not_reported')
        self.assertEqual(self.state(3)['originalStart'], dict(state='unknown'))
        self.assert_legacy_fence()
        self.assertEqual(snapshot(['activations', 'care_events', 'care_use_heads', 'plan_events', 'plan_deliveries']), before)

    def test_08_amended_backdate_attribution_originals_and_current_history(self):
        self.legacy(self.today)
        receipt = self.report('stopped', dict(state='known', value=self.yesterday), actor=S, channel='call')
        original = q('select body from concierge.care_use_events where event_id=' + lit(receipt['event']['id']))
        replacement = dict(product=self.t.product, change=dict(kind='stopped', details='correct occurrence'), sourcePublication=self.t.product['publication'], occurredOn=dict(state='known', value=self.today), acquisition='self', identityEventId=None)
        amendment = self.ok(care(S, 'amend_use_v1', requestId=str(uuid.uuid4()), expectedUseRevision=1, eventId=receipt['event']['id'], expectedAmendmentHeadId=None, replacement=replacement, reason='confirmed correction'))
        s = self.state(2)
        self.assertFalse(s['contradiction'])
        self.assertEqual(s['state'], 'stopped')
        self.assertEqual((s['latestEvent']['reportedBy'], s['latestEvent']['recordedBy'], s['latestEvent']['channel']), (C, S, 'call'))
        self.assertEqual(s['latestEvent']['occurredOn'], dict(state='known', value=self.yesterday))
        self.assertEqual(s['latestEvent']['amendment']['occurredOn'], replacement['occurredOn'])
        self.assertEqual(s['latestEvent']['amendment']['amendedBy'], S)
        history = self.ok(care(C, 'read_use_history_v1', product=self.t.product, cursor=None, limit=100))
        self.assertEqual([e['kind'] for e in history['entries']], ['use', 'amendment'])
        self.assertEqual(history['entries'][0]['event']['recordedAt'], receipt['recordedAt'])
        self.assertEqual(history['entries'][1]['amendment']['id'], amendment['event']['id'])
        self.assertEqual(q('select body from concierge.care_use_events where event_id=' + lit(receipt['event']['id'])), original)
        self.assertEqual(snapshot(TABLES), self.original)

    def test_09_compatible_descriptor_unknown_or_new_restart_is_not_old_v1_start(self):
        for occurrence in [dict(state='unknown'), dict(state='known', value=self.today)]:
            with self.subTest(occurrence=occurrence):
                self.legacy('2024-02-29')
                self.report('started', occurrence)
                s = self.state(2)
                self.assertEqual(s['state'], 'using')
                # Original Start is preserved separately from the latest report.
                self.assertEqual(s['originalStart'], dict(state='known', value='2024-02-29'))
                self.assertEqual(s['latestEvent']['occurredOn'], occurrence)
                self.assertFalse(s['contradiction'])
                self.assert_legacy_fence()
                self.assertEqual(snapshot(TABLES), self.original)

    def test_10_later_compatible_legacy_start_also_participates_in_conflict(self):
        self.legacy('2024-02-29')
        q('insert into concierge.activations(client_id,version,recommendation_id,slot,product_id,started_on) values(' + lit(C) + ",2,'original-baseline','moisturizer','original'," + lit(self.today) + ')')
        before = snapshot(TABLES)
        self.report('stopped', dict(state='known', value=self.yesterday))
        self.assertEqual(self.state(2)['originalStart'], dict(state='known', value='2024-02-29'))
        self.assertTrue(self.state(2)['contradiction'])
        self.assertEqual(self.state(2)['state'], 'stopped')
        self.assertEqual(snapshot(TABLES), before)

    def test_11_unselected_legacy_row_cannot_exempt_v1(self):
        self.legacy('2024-02-29')
        view = self.ok(care(C, 'read_client_plan_v2', version=2))
        other = next(p for p in view['plan']['content']['products'] if p['id'] != 'original')
        # A real other product wins the retained per-slot Start projection.
        q('insert into concierge.activations(client_id,version,recommendation_id,slot,product_id,started_on) values(' + lit(C) + ",2,'replacement','moisturizer'," + lit(other['id']) + ',' + lit(self.today) + ')')
        self.assertEqual(self.state(2)['state'], 'using')
        self.assert_legacy_fence()


if __name__ == '__main__':
    if '--prepare' in sys.argv:
        m.prepare()
    elif '--retained' in sys.argv:
        result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(m.CareTests))
        sys.exit(not result.wasSuccessful())
    else:
        unittest.main(verbosity=2)
