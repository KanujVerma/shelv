"""Persisted after-wait authorization regressions for the marked W1 Unix fixture.

Run the unchanged portal-rebuild-native.py --prepare first. The plan bridge runs
the real handler/parser/mapper and SQL with synthetic Auth, not JWT/PostgREST.
No fixture/server lifecycle or other database is owned by this test file.
"""
import concurrent.futures
from contextlib import contextmanager
import importlib.util
import json
from pathlib import Path
import select
import subprocess
import time
import unittest
import uuid

spec = importlib.util.spec_from_file_location('fixes', Path(__file__).with_name('portal-rebuild-fixes-native.py'))
f = importlib.util.module_from_spec(spec)
spec.loader.exec_module(f)
w = f.w
A, S, G, C, D = f.A, f.S, f.G, f.C, f.D
CANARY = 'PRIVATE_REVOKED_FACT_CANARY'


@contextmanager
def locked(sql):
    """Hold a real lock until the test explicitly releases it, with bounded IO."""
    p = subprocess.Popen(['psql', '-X', '-w', '-h', w.SOCKET, '-p', '55439', '-U', 'postgres',
                          '-d', w.DB, '-At', '-v', 'ON_ERROR_STOP=1'], env=w.ENV, text=True,
                         stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        p.stdin.write("\\o /dev/null\nbegin;set local statement_timeout='8s';" + sql + ";\n\\o\n\\echo WAIT_FENCE_LOCKED\n")
        p.stdin.flush()
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            if not select.select([p.stdout], [], [], 0.1)[0]:
                continue
            if p.stdout.readline().strip() == 'WAIT_FENCE_LOCKED':
                break
        else:
            raise AssertionError('wait-fence lock handshake failed')
        yield p
    finally:
        if p.poll() is None:
            p.stdin.write('commit;\n')
            p.stdin.close()
        p.wait(timeout=10)
        error = p.stderr.read()
        p.stdout.close()
        p.stderr.close()
        assert p.returncode == 0, error


def await_blocked(request_id, future):
    """Prove the real request is waiting on a lock before changing authority."""
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        if w.q("select exists(select 1 from pg_stat_activity where datname=current_database() "
               "and pid<>pg_backend_pid() and state='active' and wait_event_type='Lock' "
               'and strpos(query,' + w.lit(request_id) + ')>0)') == 't':
            return
        if future.done():
            raise AssertionError('request returned without the intended lock wait: ' + str(future.result()))
        time.sleep(0.02)
    raise AssertionError('request did not reach its intended lock wait')


def await_expired(table, identity, column):
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        if w.q('select ' + column + '<clock_timestamp() from ' + table + ' where id=' + w.lit(identity)) == 't':
            return
        time.sleep(0.03)
    raise AssertionError('authoritative deadline did not expire')


def snapshot(tables):
    return w.q('select jsonb_build_object(' + ','.join(
        w.lit(name) + ",coalesce((select jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text) from " +
        query + " t),'[]'::jsonb)" for name, query in tables.items()) + ')::text')


PLAN_EFFECTS = {name: '(select * from concierge.' + name + ')' for name in [
    'plan_requests', 'plan_drafts', 'plan_draft_private', 'plan_checkpoints',
    'publications', 'plan_documents', 'plan_events', 'plan_deliveries', 'plan_publication_receipts']}
CHECKIN_EFFECTS = {name: '(select * from concierge.' + name + ')' for name in [
    'checkin_heads', 'checkin_reports', 'checkin_photos', 'report_photos', 'publications',
    'plan_documents', 'plan_events', 'plan_deliveries']}
CHECKIN_EFFECTS['client_requests'] = '(select * from concierge.workflow_requests where actor_id=' + w.lit(C) + ')'


class WaitFenceTests(unittest.TestCase):
    def setUp(self):
        self.fixture = f.FixTests()
        self.fixture.setUp()

    def grant(self, draft, source, seconds=3600):
        return w.write(A, 'grant_task_v1', agentActorId=G, providerSessionId=G,
                       clientId=C if draft is None else None, draftId=draft,
                       actions=['save_draft_v1', 'read_draft_v1'], sourceIds=[source],
                       expiresAt=w.q("select to_char((clock_timestamp() at time zone 'UTC')+interval '" +
                                     str(seconds) + " seconds','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')"))

    def receipt(self, actor, seconds=3600):
        view, command, source = self.fixture.source_save(A if actor == G else actor)
        grant = None
        if actor == G:
            grant = self.grant(view['draft']['id'], source, seconds)
            view, command = self.fixture.save(view['draft'], view['draft']['content'], G)
        self.fixture.save(view['draft'], w.content())
        self.assertNotIn(CANARY, w.q('select content::text from concierge.plan_draft_private'))
        self.assertIn(CANARY, w.q('select result::text from concierge.plan_requests where request_id=' + w.lit(command['requestId'])))
        return command, source, grant

    def request(self, command, mode):
        return command if mode == 'replay' else dict(action='request_status_v1', requestId=command['requestId'])

    def assert_denial(self, reply, status, code):
        self.assertEqual(reply, dict(status=status, body=dict(code=code)))
        self.assertNotIn(CANARY, json.dumps(reply))

    def receipt_expiry(self, actor, mode):
        command, source, grant = self.receipt(actor, seconds=2)
        if actor == G:
            # A newer lawful grant cannot replace the stored operation's exact grant.
            self.grant(None, source)
        else:
            w.q("update auth.sessions set not_after=clock_timestamp()+interval '1200 milliseconds' where id=" + w.lit(S))
        before = snapshot(PLAN_EFFECTS)
        request = self.request(command, mode)
        with concurrent.futures.ThreadPoolExecutor(1) as pool:
            with locked('select id from concierge.plan_sources where id=' + w.lit(source) + ' for update'):
                future = pool.submit(w.edge, actor, **request)
                await_blocked(command['requestId'], future)
                await_expired('concierge.plan_task_grants' if actor == G else 'auth.sessions',
                              grant['grantId'] if actor == G else S, 'expires_at' if actor == G else 'not_after')
            reply = future.result(timeout=10)
        # Check persistence even on the red baseline; a disclosure never earns a pass.
        self.assertEqual(snapshot(PLAN_EFFECTS), before)
        self.assert_denial(reply, 403 if actor == G else 401, 'forbidden' if actor == G else 'session_ended')
        self.assert_denial(w.edge(actor, **request), 403 if actor == G else 401,
                           'forbidden' if actor == G else 'session_ended')

    def test_r2_1_human_cached_returns_deny_natural_session_expiry_after_source_wait(self):
        for mode in ['replay', 'status']:
            with self.subTest(mode=mode):
                self.setUp()
                self.receipt_expiry(S, mode)

    def test_r2_1_agent_cached_returns_keep_original_exact_grant_after_natural_expiry(self):
        for mode in ['replay', 'status']:
            with self.subTest(mode=mode):
                self.setUp()
                self.receipt_expiry(G, mode)

    def test_receipts_deny_permission_revoked_during_source_wait_without_substituting_latest_body(self):
        for mode in ['replay', 'status']:
            with self.subTest(mode=mode):
                self.setUp()
                command, source, _ = self.receipt(S)
                before = snapshot(PLAN_EFFECTS)
                request = self.request(command, mode)
                with concurrent.futures.ThreadPoolExecutor(1) as pool:
                    with locked('select id from concierge.plan_sources where id=' + w.lit(source) + ' for update') as locker:
                        future = pool.submit(w.edge, S, **request)
                        await_blocked(command['requestId'], future)
                        locker.stdin.write('delete from concierge.plan_source_permissions where actor_id=' + w.lit(S) + ' and source_id=' + w.lit(source) + ';\n')
                        locker.stdin.flush()
                    reply = future.result(timeout=10)
                self.assertEqual(snapshot(PLAN_EFFECTS), before)
                self.assert_denial(reply, 403, 'forbidden')

    def test_receipts_preserve_live_human_and_exact_agent_retries_after_source_wait(self):
        for actor in [S, G]:
            for mode in ['replay', 'status']:
                with self.subTest(actor=actor, mode=mode):
                    self.setUp()
                    command, source, grant = self.receipt(actor)
                    before = snapshot(PLAN_EFFECTS)
                    stored = json.loads(w.q('select result::text from concierge.plan_requests where request_id=' + w.lit(command['requestId'])))
                    with concurrent.futures.ThreadPoolExecutor(1) as pool:
                        with locked('select id from concierge.plan_sources where id=' + w.lit(source) + ' for update'):
                            future = pool.submit(w.edge, actor, **self.request(command, mode))
                            await_blocked(command['requestId'], future)
                        reply = future.result(timeout=10)
                    self.assertEqual(reply, dict(status=200, body=stored if mode == 'replay' else dict(status='committed', receipt=stored)))
                    self.assertIn(CANARY, json.dumps(reply))
                    self.assertEqual(snapshot(PLAN_EFFECTS), before)
                    if grant:
                        w.write(A, 'revoke_task_v1', grantId=grant['grantId'])
                        # Even a replacement source-capable grant cannot revive this receipt.
                        self.grant(None, source)
                        self.assert_denial(w.edge(G, **self.request(command, mode)), 403, 'forbidden')

    def checkin(self, action, revision, payload, request=None):
        return dict(action=action, revision=revision, payload=payload, request=request or str(uuid.uuid4()))

    def checkin_sql(self, command):
        return 'select public.concierge_checkin_write(' + w.lit(C) + ',' + w.lit(command['action']) + ',' + str(command['revision']) + ',' + w.lit(command['request']) + ',' + w.lit(json.dumps(command['payload'])) + '::jsonb);'

    def invoke_checkin(self, command):
        return w.raw(w.session(C) + self.checkin_sql(command) + 'commit;')

    def checkin_command(self, action):
        revision = int(w.q('select revision from concierge.checkin_heads where client_id=' + w.lit(C)))
        if action == 'submit_report':
            return self.checkin(action, revision, dict(comfort='comfortable', consistency='usual routine', changes='SYNTHETIC_WAIT_REPORT', photoIds=[]))
        reservation = self.checkin('reserve_photo', revision, dict(angle='front', contentType='image/png', sizeBytes=16, sha256='a' * 64))
        if action == 'reserve_photo':
            return reservation
        r = self.invoke_checkin(reservation)
        self.assertEqual(r.returncode, 0, r.stderr)
        photo = json.loads(next(line for line in r.stdout.split('\n') if line.startswith('{')))
        # Only metadata exists in this synthetic Storage table. No file/upload claim.
        w.q('insert into storage.objects(bucket_id,name,metadata) values(\'concierge-checkin-photos\',' + w.lit(photo['path']) + ',\'{"mimetype":"image/png","size":16}\')')
        return self.checkin(action, photo['revision'], dict(photoId=photo['photoId']))

    def cancel_sql(self):
        payload = dict(kind='early_departure', supportEndsOn=w.q("select (clock_timestamp() at time zone 'America/Chicago')::date"),
                       reason='synthetic confirmed departure', confirmedWithClient=True)
        return w.session(A).replace('begin;', '') + 'select public.concierge_service_write(' + w.lit(C) + ",'cancel_service',0," + w.lit(uuid.uuid4()) + ',' + w.lit(json.dumps(payload)) + '::jsonb);'

    def checkin_race(self, action, change, replay=False, head_lock=False):
        self.fixture.publish()
        command = self.checkin_command(action)
        if replay:
            first = self.invoke_checkin(command)
            self.assertEqual(first.returncode, 0, first.stderr)
        tail = self.cancel_sql() if change == 'care' else ''
        if change == 'session':
            w.q("update auth.sessions set not_after=clock_timestamp()+interval '1200 milliseconds' where id=" + w.lit(C))
        before = snapshot(CHECKIN_EFFECTS)
        lock_sql = ('select client_id from concierge.checkin_heads where client_id=' + w.lit(C) + ' for update') if head_lock else "select pg_advisory_xact_lock(hashtextextended('concierge:client:" + C + "',0))"
        with concurrent.futures.ThreadPoolExecutor(1) as pool:
            with locked(lock_sql) as locker:
                future = pool.submit(self.invoke_checkin, command)
                await_blocked(command['request'], future)
                if change == 'session':
                    await_expired('auth.sessions', C, 'not_after')
                else:
                    # The actual authenticated public cancellation commits ahead of the waiter.
                    locker.stdin.write(tail + '\n')
                    locker.stdin.flush()
            reply = future.result(timeout=10)
        expected = 'concierge_session_ended' if change == 'session' else 'concierge_forbidden'
        if change == 'care':
            self.assertEqual(w.q('select concierge.plan_care_window(' + w.lit(C) + ')'), 'read_only')
            self.assertEqual(w.q('select count(*) from concierge.service_cancellations where client_id=' + w.lit(C)), '1')
            admin = w.raw(w.session(C) + 'select public.concierge_service_client_view();commit;')
            self.assertEqual(admin.returncode, 0, admin.stderr)
            self.assertIn('cancellation', admin.stdout)
        self.assertNotIn('SYNTHETIC_WAIT_REPORT', reply.stdout)
        self.assertEqual(snapshot(CHECKIN_EFFECTS), before, 'denied check-in must roll back report/photo/revision/request and publication effects')
        self.assertNotEqual(reply.returncode, 0, reply.stdout)
        self.assertIn(expected, reply.stderr)
        again = self.invoke_checkin(command)
        self.assertNotEqual(again.returncode, 0)
        self.assertIn(expected, again.stderr)

    def test_r2_2_all_client_checkin_writes_roll_back_after_session_expiry_during_client_wait(self):
        for action in ['submit_report', 'reserve_photo', 'complete_photo']:
            with self.subTest(action=action):
                self.setUp()
                self.checkin_race(action, 'session')

    def test_r2_2_all_client_checkin_writes_roll_back_after_real_public_cancellation(self):
        for action in ['submit_report', 'reserve_photo', 'complete_photo']:
            with self.subTest(action=action):
                self.setUp()
                self.checkin_race(action, 'care')

    def test_checkin_exact_retry_early_returns_recheck_after_session_or_care_wait(self):
        for action in ['submit_report', 'reserve_photo', 'complete_photo']:
            for change in ['session', 'care']:
                with self.subTest(action=action, change=change):
                    self.setUp()
                    self.checkin_race(action, change, replay=True)

    def test_checkin_head_row_wait_also_rolls_back_after_session_expiry(self):
        self.checkin_race('submit_report', 'session', head_lock=True)

    def test_live_checkin_writes_and_exact_retries_preserve_revision_and_receipt_semantics(self):
        self.fixture.publish()
        for action in ['submit_report', 'reserve_photo', 'complete_photo']:
            command = self.checkin_command(action)
            first = self.invoke_checkin(command)
            self.assertEqual(first.returncode, 0, first.stderr)
            before = snapshot(CHECKIN_EFFECTS)
            retry = self.invoke_checkin(command)
            self.assertEqual(retry.returncode, 0, retry.stderr)
            self.assertEqual(retry.stdout, first.stdout)
            self.assertEqual(snapshot(CHECKIN_EFFECTS), before)
            changed = {**command, 'payload': {**command['payload'], 'unexpected': True}}
            denied = self.invoke_checkin(changed)
            self.assertNotEqual(denied.returncode, 0)
            self.assertIn('concierge_request_conflict', denied.stderr)
            self.assertEqual(snapshot(CHECKIN_EFFECTS), before)
        self.assertEqual(w.q('select count(*) from concierge.checkin_reports'), '1')
        self.assertEqual(w.q("select count(*) from concierge.checkin_photos where state='complete'"), '1')


if __name__ == '__main__':
    unittest.main(verbosity=2)
