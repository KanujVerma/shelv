"""CN1: actual Care handler/parser/positive mapper and persisted role SQL.

Auth identity/session claims are synthetic, never genuine Auth acceptance.
Requires an independently allocated RUNNING socket-only PG15 receipt under
.local-artifacts/w1-care-history-filter. No server lifecycle is performed here.
--prepare-baseline replays the minimal prerequisites through frozen M56.
--red runs the intended exact-membership/HTTP200 assertions before M57.
--apply verifies all rows/catalog properties while applying only allocated M57.
--preservation replays frozen M56 with old rows, then verifies RED/apply/GREEN.
Default runs regressions; --retained26 / --legacy11 retain old assertions.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import os
import re
import subprocess
import sys
import unittest
import uuid

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / '.local-artifacts/w1-care-history-filter'
FIXTURE = json.loads((ART / 'fixture.json').read_text())
SOCKET = FIXTURE['socket']
DB = 'shelv_history_08cf_synthetic'
MARKER = 'W1 CN1 08cf synthetic Unix-only 20261031'
PORT = 55479
M57 = ROOT / 'supabase/migrations/20261031073004_portal_rebuild_care_history_filter_v1.sql'
M56 = ROOT / 'supabase/migrations/20261031043655_portal_rebuild_care_use_v1.sql'
assert FIXTURE['workspace'] == str(ROOT) and FIXTURE['state'] == 'RUNNING'
assert re.fullmatch(r'/tmp/sh-hf08-[a-f0-9]{8}', SOCKET)
assert FIXTURE['database'] == DB and FIXTURE['marker'] == MARKER and FIXTURE['port'] == PORT
assert Path(FIXTURE['data']).resolve() == ART / 'pg/data'
os.environ['SHELV_CARE_SOCKET'] = SOCKET
os.environ['PATH'] = '/Users/kanuj/.nvm/versions/node/v22.23.0/bin:/opt/homebrew/opt/postgresql@15/bin:' + os.environ['PATH']
sys.dont_write_bytecode = True


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# Only paths/fixture constants are adapted. Original assertions are untouched.
copies = {}
for name, destination in [('portal-care-native.py', 'native.py'), ('portal-care-native-edge.mjs', 'edge.mjs')]:
    path = ROOT / 'tests' / name
    body = path.read_text().replace('55461', str(PORT)).replace('shelv_care_caf2b712_synthetic', DB).replace('W1 care caf2b712 synthetic Unix-only 20261031', MARKER).replace('shelv-care-caf2b712', 'shelv-history-08cf')
    if name.endswith('.py'):
        body = body.replace('ROOT=Path(__file__).resolve().parents[1]', 'ROOT=Path(' + repr(str(ROOT)) + ')')
        body = body.replace("SOCKET.startswith('/tmp/sh-care-caf2b712-') and len(SOCKET)==30", 'SOCKET==' + repr(SOCKET))
        body = body.replace("ROOT/'tests/portal-care-native-edge.mjs'", 'Path(' + repr(str(ART / 'edge.mjs')) + ')')
    else:
        body = body.replace("'../supabase/", "'" + str(ROOT) + '/supabase/')
        body = body.replace("!/^\\/tmp\\/sh-care-caf2b712-[a-f0-9]{8}$/.test(socket)", 'socket!==' + json.dumps(SOCKET))
    (ART / destination).write_text(body)
    copies[name] = dict(originalSha256=digest(path.read_bytes()), copySha256=digest(body.encode()))
(ART / 'harness-copy.json').write_text(json.dumps(copies, indent=2))
m = load('history_owned_native', ART / 'native.py')
w, q, lit, care = m.w, m.q, m.lit, m.care
A, S, G, C, D = m.A, m.S, m.G, m.C, m.D
probe = m.raw("select jsonb_build_object('data',current_setting('data_directory'),'socket',current_setting('unix_socket_directories'),'port',current_setting('port'),'listen',current_setting('listen_addresses'))", 'postgres')
assert probe.returncode == 0, probe.stderr
identity = json.loads(probe.stdout)
assert identity == dict(data=FIXTURE['data'], socket=SOCKET, port=str(PORT), listen='')
assert int((Path(FIXTURE['data']) / 'postmaster.pid').read_text().splitlines()[0]) == FIXTURE['pid']


def snapshot():
    tables = json.loads(q("select coalesce(jsonb_agg(format('%I.%I',n.nspname,c.relname) order by n.nspname,c.relname),'[]') from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ('auth','public','storage','concierge')"))
    return q("select jsonb_object_agg(name,rows) from (" + ' union all '.join("select " + lit(t) + " name,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') rows from " + t + ' x' for t in tables) + ') z')


def catalog():
    return json.loads(q("select jsonb_agg(to_jsonb(p) order by p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','concierge')"))


def apply_forward():
    before, functions = snapshot(), catalog()
    (ART / 'before-m57-rows.private.json').write_text(before)
    (ART / 'before-m57-rows.private.json').chmod(0o600)
    q(M57.read_text())
    after, changed = snapshot(), catalog()
    assert after == before, 'M57 must not mutate ANY seeded row'
    deltas = []
    for old, new in zip(functions, changed):
        assert old['oid'] == new['oid']
        if old != new:
            assert old['proname'] == 'care_history_page'
            assert {k: v for k, v in old.items() if k != 'prosrc'} == {k: v for k, v in new.items() if k != 'prosrc'}, 'only prosrc may change'
            deltas.append(old['proname'])
    assert len(functions) == len(changed) and deltas == ['care_history_page']
    (ART / 'migration-preservation.json').write_text(json.dumps(dict(rowsSha256=digest(before.encode()), rowTables='all auth/public/storage/concierge tables', changedFunctions=deltas, onlyProsrcChanged=True, migrationSha256=digest(M57.read_bytes())), indent=2))
    print('M57: all seeded rows identical; only private care_history_page.prosrc changed; OID/owner/ACL/config preserved')


def ids(page):
    return [x['amendment']['id'] if x['kind'] == 'amendment' else x['event']['eventId'] for x in page['entries']]


class HistoryFilterTests(unittest.TestCase):
    def setUp(self):
        self.t = m.CareTests()
        self.t.setUp()
        self.t.published_product()
        self.p = self.t.product

    def ok(self, result):
        self.assertEqual(result['status'], 200, result)
        return result['body']

    def head(self):
        return int(q('select concierge.care_revision(' + lit(C) + ')'))

    def write(self, action, **fields):
        return self.ok(care(C, action, requestId=str(uuid.uuid4()), expectedUseRevision=self.head(), **fields))

    def reported(self, name):
        body = dict(name=name, brand=dict(state='unknown'), variant=dict(state='unknown'), strength=dict(state='unknown'), sizeLabel=dict(state='unknown'), labelPhotoIds=[])
        result = self.write('report_unreviewed_product_v1', product=body, sourcePublication=None, occurredOn=dict(state='unknown'), channel='portal', acquisition='self')
        return result['product'], result['receipt']['event']['id'], body

    def use(self, product, change=None):
        return self.write('report_product_use_v1', product=product, change=change or dict(kind='paused', details=None), sourcePublication=None, occurredOn=dict(state='unknown'), channel='portal', acquisition='self', identityEventId=None)['event']['id']

    def amend(self, event, product, change=None, reason='synthetic product correction'):
        return self.write('amend_use_v1', eventId=event, expectedAmendmentHeadId=None, replacement=dict(product=product, change=change or dict(kind='stopped', details=None), sourcePublication=None, occurredOn=dict(state='unknown'), acquisition='self', identityEventId=None), reason=reason)['event']['id']

    def history(self, product, actor=C, cursor=None, limit=100):
        return care(actor, 'read_use_history_v1' if actor == C else 'read_advisor_use_history_v1', **({} if actor == C else dict(clientId=C)), product=product, cursor=cursor, limit=limit)

    def both(self, product, expected):
        before = snapshot()
        client = self.ok(self.history(product))
        advisor = self.ok(self.history(product, A))
        self.assertEqual(ids(client), expected)
        self.assertEqual(advisor, client)
        self.assertEqual(snapshot(), before, 'reads must not create event/head/queue/date/status')
        return client

    def test_01_cn1_unrelated_unamended_use_and_descriptor_correction(self):
        unrelated = self.use(self.p)
        other, creation, body = self.reported('unrelated synthetic descriptor')
        correction = self.write('amend_reported_product_v1', product=other, replacement={**body, 'name': 'corrected unrelated descriptor'}, reason='correct label')['event']['id']
        selected, event, _ = self.reported('selected synthetic descriptor')
        raw_page = json.loads(q('select concierge.care_history_page(' + lit(C) + ',' + lit(json.dumps(selected)) + "::jsonb,null,100," + str(self.head()) + ')'))
        with self.subTest(boundary='SQL exact membership'):
            self.assertEqual(ids(raw_page), [event], 'unrelated use/correction must be skipped even with missing optional paths')
        before = snapshot()
        for actor in [C, A]:
            with self.subTest(boundary='actual handler HTTP200', actor=actor):
                self.assertEqual(ids(self.ok(self.history(selected, actor))), [event])
        self.assertEqual(ids(self.ok(self.history(None))), [unrelated, creation, correction, event])
        self.assertEqual(snapshot(), before)

    def test_02_reported_product_id_and_descriptor_version_exact(self):
        one, creation, body = self.reported('selected v1')
        other, _, _ = self.reported('other ID')
        correction = self.write('amend_reported_product_v1', product=one, replacement={**body, 'name': 'selected v2'}, reason='correct name')['event']['id']
        two = {**one, 'version': 2}
        self.use(other)
        self.both(one, [creation])
        page = self.both(two, [correction])
        self.assertIsNone(page['entries'][0]['event']['initialUse'])
        for p in [{**one, 'version': 3}, {**one, 'reportedProductId': str(uuid.uuid4())}]:
            self.assertEqual(self.history(p)['status'], 404)

    def test_03_null_slot_aggregates_only_exact_publication_schema_and_product(self):
        def content(body):
            p = body['products'][0]
            body['products'].append({**p, 'id': 'second-product'})
            schedule = dict(periods=['evening'], days=dict(kind='daily'), condition=None, asNeeded=False, stages=[], anchor='actual_start', automaticAdvance=False)
            body['routine'] = [dict(id=s, slotId=s, kind='product', productId=p['id'], title='synthetic use', directions=['as authored'], cautions=[], schedule=schedule) for s in ['slot-a', 'slot-b']]
        self.t.next_publication(content)
        p = {**self.p, 'publication': dict(version=2, documentSchemaVersion=3)}
        plain = self.use(p)
        slot_a = self.use({**p, 'slotId': 'slot-a'})
        slot_b = self.use({**p, 'slotId': 'slot-b'})
        other = self.use({**p, 'productId': 'second-product'})
        self.t.next_publication()
        latest = {**p, 'publication': dict(version=3, documentSchemaVersion=3)}
        # Same descriptor carries current use; history stays exact-context.
        self.both(latest, [])
        self.both(p, [plain, slot_a, slot_b])
        self.both({**p, 'slotId': 'slot-a'}, [slot_a])
        self.both({**p, 'slotId': 'slot-b'}, [slot_b])
        self.both({**p, 'productId': 'second-product'}, [other])
        self.both(self.p, [])
        self.assertEqual(self.history({**p, 'publication': dict(version=2, documentSchemaVersion=2)})['status'], 409)

    def test_04_identity_matches_subject_not_comparison(self):
        reported, creation, _ = self.reported('comparison synthetic')
        answer = dict(match='not_sure', reportedName=None, variant=dict(state='unknown'), strength=dict(state='unknown'), labelPhotoIds=[])
        target = self.write('report_identity_v1', target=dict(subject=self.p, comparedWith=self.p), answer=answer, sourcePublication=None, occurredOn=dict(state='unknown'), channel='portal')['event']['id']
        compared = self.write('report_identity_v1', target=dict(subject=reported, comparedWith=self.p), answer=answer, sourcePublication=None, occurredOn=dict(state='unknown'), channel='portal')['event']['id']
        self.both(self.p, [target])
        self.both(reported, [creation, compared])

    def test_05_use_original_or_current_replacement_separate_amendment_replacement_only(self):
        reported, creation, _ = self.reported('replacement synthetic')
        original = self.use(self.p)
        amendment = self.amend(original, reported)
        page = self.both(self.p, [original])
        self.assertEqual(page['entries'][0]['event']['product'], self.p)
        self.both(reported, [creation, original, amendment])

    def test_06_nested_initial_use_product_change_and_correction_null(self):
        first, original, body = self.reported('first nested synthetic')
        second, selected, _ = self.reported('second nested synthetic')
        amendment = self.amend(original, second)
        correction = self.write('amend_reported_product_v1', product=first, replacement={**body, 'name': 'first corrected'}, reason='correct descriptor')['event']['id']
        page = self.both(second, [original, selected, amendment])
        self.assertEqual(page['entries'][0]['event']['initialUse']['product'], first)
        self.assertEqual(page['entries'][0]['event']['initialUse']['amendment']['replacement']['product'], second)
        self.both(first, [original])
        self.both({**first, 'version': 2}, [correction])

    def pages(self, product, limit=2, actor=C):
        result, cursor, cursors, sizes = [], None, set(), []
        for _ in range(100):
            page = self.ok(self.history(product, actor, cursor, limit))
            sizes.append(len(json.dumps(page, ensure_ascii=False, separators=(',', ':')).encode()))
            self.assertLessEqual(sizes[-1], 400000)
            self.assertLessEqual(len(page['entries']), limit)
            result.extend(ids(page))
            cursor = page['nextCursor']
            if cursor is None:
                self.assertEqual(len(result), len(set(result)))
                return result, sizes
            self.assertTrue(page['entries'], 'no empty continuation page')
            self.assertNotIn(cursor, cursors)
            cursors.add(cursor)
        self.fail('infinite pagination')

    def test_07_filtered_pages_skip_nonmatches_before_limit_and_head_cursor(self):
        selected, event, _ = self.reported('paged synthetic')
        expected = [event]
        for _ in range(6):
            self.use(self.p)
            expected.append(self.use(selected))
        self.assertEqual(self.pages(selected)[0], expected)
        self.assertEqual(self.pages(selected, actor=A)[0], expected)
        first = self.ok(self.history(selected, limit=2))
        self.assertEqual(self.history(self.p, cursor=first['nextCursor'], limit=2)['status'], 409)
        self.use(self.p)
        self.assertEqual(self.history(selected, cursor=first['nextCursor'], limit=2)['body'], dict(code='cursor_conflict'))
        for bound in [0, 101]:
            self.assertEqual(self.history(selected, limit=bound)['status'], 400)

    def test_08_byte_budget_filtered_completeness_and_single_entry_fit(self):
        selected, creation, _ = self.reported('UTF8 selected')
        expected = [creation]
        big = dict(kind='different', frequency=dict(state='known', value='😀' * 4000), amount=dict(state='known', value='😀' * 4000), details='😀' * 4000)
        for _ in range(7):
            self.use(self.p, big)
            event = self.use(selected, big)
            amendment = self.amend(event, selected, big, '😀' * 4000)
            expected.extend([event, amendment])
        # Each original embeds its later amendment; order remains event revision.
        got, sizes = self.pages(selected, limit=100)
        self.assertEqual(got, expected)
        self.assertGreater(len(sizes), 1, 'exercise actual byte budget, not only item limit')
        self.assertEqual(self.pages(selected, limit=1)[0], expected)
        self.assertEqual(self.pages(selected, limit=100, actor=A)[0], expected)
        (ART / 'byte-pages.json').write_text(json.dumps(dict(matchingEntries=len(expected), totalEvents=self.head(), pageBytes=sizes, limit=100, allUnique=True), indent=2))

    def test_09_owner_readonly_view_role_and_payload_authority_unchanged(self):
        selected, event, _ = self.reported('owner synthetic')
        before = snapshot()
        self.assertEqual(care(C, 'read_use_history_v1', product=selected, cursor=None, limit=10, clientId=D)['status'], 400)
        self.assertEqual(care(D, 'read_use_history_v1', product=selected, cursor=None, limit=10)['status'], 404)
        self.assertEqual(care(G, 'read_advisor_use_history_v1', clientId=C, product=selected, cursor=None, limit=10)['status'], 403)
        self.assertEqual(snapshot(), before)
        q('update concierge.advisors set can_edit=false,can_publish=false where user_id=' + lit(S))
        self.assertEqual(ids(self.ok(self.history(selected, S))), [event])
        command = self.t.command('stopped', product=selected, revision=self.head())
        self.assertEqual(care(S, 'record_client_use_v1', clientId=C, confirmedClientReport=True, **command)['status'], 403)
        q('insert into concierge.service_cancellations(client_id,actor_id,data) values(' + lit(C) + ',' + lit(A) + ",jsonb_build_object('supportEndsOn',(clock_timestamp() at time zone 'America/Chicago')::date::text))")
        self.both(selected, [event])
        self.assertEqual(care(C, 'report_product_use_v1', **command)['status'], 403)
        denied = m.raw(w.session(C) + 'select concierge.care_history_page(' + lit(C) + ",'null',null,100,1);commit;")
        self.assertNotEqual(denied.returncode, 0)
        self.assertIn('permission denied', denied.stderr)


if __name__ == '__main__':
    if '--prepare-baseline' in sys.argv:
        m.prepare()
    elif '--apply' in sys.argv:
        apply_forward()
    elif '--preservation' in sys.argv:
        m.prepare()
        original = json.loads(snapshot())
        q('insert into auth.sessions(id,user_id) select id,id from auth.users;insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values(' + lit(A) + ',true,true,true,true,true);insert into concierge.plan_principals(actor_id,kind) values(' + lit(A) + ",'owner');update concierge.plan_policy set activated=true,owner_actor_id=" + lit(A) + ',revision=1;')
        t = HistoryFilterTests()
        other, _, descriptor = t.reported('preservation unrelated descriptor')
        t.write('amend_reported_product_v1', product=other, replacement={**descriptor, 'name': 'preservation corrected'}, reason='synthetic label correction')
        t.use({**other, 'version': 2})
        selected, event, _ = t.reported('preservation selected descriptor')
        unfiltered = t.ok(t.history(None))
        for actor in [C, A]:
            assert t.history(selected, actor) == dict(status=503, body=dict(code='unavailable'))
        apply_forward()
        for actor in [C, A]:
            assert ids(t.ok(t.history(selected, actor))) == [event]
            assert t.ok(t.history(None, actor)) == unfiltered
        after = json.loads(snapshot())
        preserved = ['publications', 'publication_presentations', 'activations', 'receipts', 'intakes', 'quotes', 'claims', 'payment_confirmations', 'service_periods', 'entitled_publications']
        for table in preserved:
            key = 'concierge.' + table
            assert after[key] == original[key], key
        assert after['concierge.activations'], 'actual preserved legacy Start required'
        (ART / 'preservation-http.json').write_text(json.dumps(dict(beforeFilteredClient=503, beforeFilteredAdvisor=503, afterFilteredClient=200, afterFilteredAdvisor=200, exactEntries=1, unfilteredBodyIdentical=True, preservedOriginalTables=preserved), indent=2))
        print('Original R1/R2/intake/Start/receipt/payment/period/entitlement rows preserved; exact filtered client/advisor503 -> 200, unfiltered body identical')
    elif '--red' in sys.argv:
        suite = unittest.TestSuite([HistoryFilterTests('test_01_cn1_unrelated_unamended_use_and_descriptor_correction')])
        sys.exit(not unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful())
    elif '--retained26' in sys.argv or '--legacy11' in sys.argv:
        # Old cases that replay M56 also apply M57 in that same owned fixture.
        chain = ART / 'migration-chain.sql'
        chain.write_text(M56.read_text() + '\n' + M57.read_text())
        m.MIGRATION = chain
        if '--retained26' in sys.argv:
            suite = unittest.defaultTestLoader.loadTestsFromTestCase(m.CareTests)
        else:
            original = (ROOT / 'tests/portal-care-legacy-fixes-native.py').read_text()
            start = original.index('TABLES = ')
            end = original.index("if __name__")
            # Reuse the unchanged test class, bound to this already guarded m/w.
            namespace = dict(__name__='history_retained_legacy', m=m, w=w, q=q, lit=lit, care=care, plan=m.plan, A=A, S=S, C=C, ROOT=ROOT, DB=DB, unittest=unittest, json=json, uuid=uuid, snapshot=None)
            exec(compile(original[start:end], 'portal-care-legacy-fixes-native.py', 'exec'), namespace)
            suite = unittest.defaultTestLoader.loadTestsFromTestCase(namespace['LegacyFixTests'])
        sys.exit(not unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful())
    else:
        unittest.main(verbosity=2)
