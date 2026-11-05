"""W7 regressions against persisted SQL and the actual plan handler.

Uses only the exclusively allocated, marked Unix-only W1 synthetic fixture.
Run --prepare with portal-rebuild-native.py first. Auth here is synthetic.
"""
import concurrent.futures
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import unittest
import uuid

spec = importlib.util.spec_from_file_location('w1', Path(__file__).with_name('portal-rebuild-native.py'))
w = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w)
A, S, G, C, D = w.A, w.S, w.G, w.C, w.D


class FixTests(unittest.TestCase):
    setUp = w.PlanTests.setUp
    draft = w.PlanTests.draft
    saved = w.PlanTests.saved
    reviewed = w.PlanTests.reviewed
    approved = w.PlanTests.approved
    fund = w.PlanTests.fund
    publish = w.PlanTests.publish
    deny = w.PlanTests.deny

    def save(self, d, content, actor=A, request=None):
        command = dict(action='save_draft_v1', requestId=request or str(uuid.uuid4()), draftId=d['id'],
                       expectedContentRevision=d['contentRevision'], expectedAssignmentRevision=d['assignmentRevision'],
                       kind='care_plan', content=content)
        reply = w.edge(actor, **command)
        self.assertEqual(reply['status'], 200, reply)
        return reply['body'], command

    def review(self, view):
        d = view['draft']
        for section in view['sections']:
            w.write(A, 'review_section_v1', draftId=d['id'], expectedContentRevision=d['contentRevision'],
                    expectedAssignmentRevision=d['assignmentRevision'], sectionId=section['sectionId'], sectionHash=section['sectionHash'])
        return w.call(A, 'read_draft_v1', draftId=d['id'])

    def old(self, action, payload, revision, client=C):
        name = 'concierge_advisor_write' if action == 'save_intake' else 'concierge_presentation_write' if action == 'save_draft_v2' else 'concierge_write'
        return w.raw(w.session(A) + 'select public.' + name + '(' + w.lit(client) + ',' + w.lit(action) + ',' + str(revision) + ',' + w.lit(uuid.uuid4()) + ',' + w.lit(json.dumps(payload)) + ');commit;')

    def legacy(self, rich=False):
        fixture = json.loads((w.ROOT / 'tests/fixtures/concierge-presentation.json').read_text())
        r = self.old('save_intake', dict(goal='legacy goal', note='PRIVATE_LEGACY_INTAKE', baseline=fixture['baseline'] if rich else [dict(slot='old-slot', productId='old-product')]), 0)
        self.assertEqual(r.returncode, 0, r.stderr)
        payload = dict(intakeVersion=1, recommendations=[], advisorNote='PRIVATE_UNPUBLISHED_LEGACY_NOTE')
        if rich:
            payload['presentation'] = fixture['presentation']
            payload['recommendations'] = [dict(id=card['recommendationId'], slot=card['slot'], currentProductId=card['currentProduct']['id'], proposedProductId=card['proposedProduct']['id'], priceCents=2500, currency='USD', rationale='synthetic original rationale') for card in fixture['presentation']['categoryCards'] if card['recommendationId'] is not None]
        r = self.old('save_draft_v2' if rich else 'save_draft', payload, 1)
        self.assertEqual(r.returncode, 0, r.stderr)
        return payload

    def source_save(self, actor=S, draft_bound=False):
        d = self.draft() if draft_bound else self.saved()['draft']
        source = str(uuid.uuid4())
        scope = 'draft_id' if draft_bound else 'client_id'
        w.q('insert into concierge.plan_sources(id,' + scope + ',version) values(' + w.lit(source) + ',' + w.lit(d['id'] if draft_bound else C) + ',1);insert into concierge.plan_source_permissions values(' + w.lit(actor) + ',' + w.lit(source) + ')')
        content = w.content()
        content['context']['facts'].append(dict(id='private-source', kind='client_report', visibility='advisor_only', text='PRIVATE_REVOKED_FACT_CANARY', sources=[dict(sourceId=source, sourceVersion=1, locator=dict(kind='whole'))], contradicts=[]))
        view, command = self.save(d, content, actor)
        return view, command, source

    def assert_receipt_denied(self, actor, command, code):
        for request in [command, dict(action='request_status_v1', requestId=command['requestId'])]:
            reply = w.edge(actor, **request)
            self.assertEqual(reply['body'], dict(code=code), reply)
            self.assertNotIn('PRIVATE_REVOKED_FACT_CANARY', json.dumps(reply))

    def test_f1_human_receipts_reauthorize_stored_sources_after_removal_and_reassignment(self):
        for change in ['permission', 'inactive', 'version']:
            with self.subTest(change=change):
                self.setUp()
                view, command, source = self.source_save()
                stored = w.q('select result::text from concierge.plan_requests where actor_id=' + w.lit(S) + ' and request_id=' + w.lit(command['requestId']))
                # The latest body no longer references this source and belongs to another client.
                latest, _ = self.save(view['draft'], w.content())
                current = w.write(A, 'assign_draft_v1', draftId=latest['draft']['id'], expectedContentRevision=latest['draft']['contentRevision'], expectedAssignmentRevision=latest['draft']['assignmentRevision'], fromClientId=C, toClientId=D)
                if change == 'permission':
                    replacement = str(uuid.uuid4())
                    w.q('insert into concierge.plan_sources(id,client_id,version) values(' + w.lit(replacement) + ',' + w.lit(D) + ',1);insert into concierge.plan_source_permissions values(' + w.lit(S) + ',' + w.lit(replacement) + ')')
                    content = w.content()
                    content['context']['facts'][0]['sources'] = [dict(sourceId=replacement, sourceVersion=1, locator=dict(kind='whole'))]
                    self.save(current['draft'], content)
                    w.q('delete from concierge.plan_source_permissions where actor_id=' + w.lit(S) + ' and source_id=' + w.lit(source))
                    self.assertEqual(w.edge(S, 'read_draft_v1', draftId=current['draft']['id'])['status'], 200)
                else:
                    w.q('update concierge.plan_sources set ' + ('active=false' if change == 'inactive' else 'version=2') + ' where id=' + w.lit(source))
                self.assert_receipt_denied(S, command, 'forbidden' if change == 'permission' else 'source_conflict')
                self.assertEqual(w.q('select result::text from concierge.plan_requests where actor_id=' + w.lit(S) + ' and request_id=' + w.lit(command['requestId'])), stored)

    def test_f1_agent_receipts_check_historical_source_grant_even_when_current_body_is_clean(self):
        view, _, source = self.source_save(A)
        grant = w.write(A, 'grant_task_v1', agentActorId=G, providerSessionId=G, clientId=C, draftId=None, actions=['save_draft_v1', 'read_draft_v1'], sourceIds=[source], expiresAt=w.q("select to_char((now() at time zone 'UTC')+interval '1 hour','YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')"))
        view, command = self.save(view['draft'], view['draft']['content'], G)
        self.save(view['draft'], w.content())
        # A fixed grant is immutable in production; replacement/revocation is the actual public seam.
        w.write(A, 'revoke_task_v1', grantId=grant['grantId'])
        self.assert_receipt_denied(G, command, 'forbidden')

    def test_f1_draft_bound_receipt_survives_lawful_assignment_but_not_source_deactivation(self):
        view, command, source = self.source_save(S, draft_bound=True)
        w.write(A, 'assign_draft_v1', draftId=view['draft']['id'], expectedContentRevision=1, expectedAssignmentRevision=0, fromClientId=None, toClientId=C)
        self.assertEqual(w.edge(S, **command)['status'], 200)
        self.assertEqual(w.edge(S, 'request_status_v1', requestId=command['requestId'])['status'], 200)
        w.q('update concierge.plan_sources set active=false where id=' + w.lit(source))
        self.assert_receipt_denied(S, command, 'source_conflict')

    def test_f2_expired_administration_excludes_care_but_keeps_orders_returns_cancellation(self):
        w.q('update concierge.plan_policy set activated=false')
        data = dict(channel='call', occurredOn=w.q("select (clock_timestamp() at time zone 'America/Chicago')::date"), summary='EXPIRED_CARE_CANARY', reportedUse='unchanged', decision='continue comfortable care', nextReviewOn=None, privateNote='PRIVATE_REVIEW')
        r = w.raw(w.session(A) + 'select public.concierge_service_write(' + w.lit(C) + ",'record_review',0," + w.lit(uuid.uuid4()) + ',' + w.lit(json.dumps(data)) + ');commit;')
        self.assertEqual(r.returncode, 0, r.stderr)
        w.q('update concierge.plan_policy set activated=true')
        self.publish()
        # Persist a valid legacy instruction as historical fixture state. New V3 instruction writes remain fenced.
        instruction = str(uuid.uuid4())
        usage = json.loads((w.ROOT / 'tests/fixtures/concierge-presentation.json').read_text())['presentation']['baselineRoutine'][0]['usage']
        instruction_data = dict(slot='legacy-slot', productId='legacy-product', planVersion=1, baseInstructionVersion=0, usage=usage, reason='EXPIRED_INSTRUCTION_CANARY', reviewId=None, effectiveOn=data['occurredOn'])
        w.q('update concierge.plan_policy set activated=false;insert into concierge.instruction_drafts(id,client_id,data,source,actor_id) values(' + w.lit(instruction) + ',' + w.lit(C) + ',' + w.lit(json.dumps(instruction_data)) + ",'{}'," + w.lit(A) + ');insert into concierge.instruction_publications(client_id,draft_id,version,actor_id) values(' + w.lit(C) + ',' + w.lit(instruction) + ',1,' + w.lit(A) + ');update concierge.plan_policy set activated=true')
        purchase, ret = str(uuid.uuid4()), str(uuid.uuid4())
        w.q('insert into concierge.retail_purchases(id,client_id,data,actor_id) values(' + w.lit(purchase) + ',' + w.lit(C) + ",'{}'," + w.lit(A) + ');insert into concierge.return_cases(id,client_id,purchase_id,data,actor_id) values(' + w.lit(ret) + ',' + w.lit(C) + ',' + w.lit(purchase) + ",'{}'," + w.lit(A) + ')')
        for days, visible in [(29, True), (30, False), (31, False)]:
            w.q('delete from concierge.service_cancellations;insert into concierge.service_cancellations(client_id,data,actor_id) values(' + w.lit(C) + ",jsonb_build_object('supportEndsOn',(clock_timestamp() at time zone 'America/Chicago')::date-" + str(days) + '),' + w.lit(A) + ')')
            r = w.raw(w.session(C) + 'select public.concierge_service_client_view();commit;')
            self.assertEqual(r.returncode, 0, r.stderr)
            result = json.loads(next(s for s in r.stdout.splitlines() if s.startswith('{')))
            self.assertEqual('EXPIRED_CARE_CANARY' in json.dumps(result), visible)
            self.assertEqual('EXPIRED_INSTRUCTION_CANARY' in json.dumps(result), visible)
            self.assertEqual(result['purchases'][0]['id'], purchase)
            self.assertEqual(result['returns'][0]['id'], ret)
            self.assertIsNotNone(result['cancellation'])
        # Current session/deletion/enrollment checks are common to care and administration.
        w.q('delete from auth.sessions where id=' + w.lit(C))
        r = w.raw(w.session(C) + 'select public.concierge_service_client_view();commit;')
        self.assertIn('session_ended', r.stderr)

    def test_f2_checkin_history_and_photo_authorization_obey_exclusive_care_cutoff(self):
        self.publish()
        for days, allowed in [(29, True), (30, False)]:
            w.q('delete from concierge.service_cancellations;insert into concierge.service_cancellations(client_id,data,actor_id) values(' + w.lit(C) + ",jsonb_build_object('supportEndsOn',(clock_timestamp() at time zone 'America/Chicago')::date-" + str(days) + '),' + w.lit(A) + ')')
            for rpc in ['concierge_checkin_read(' + w.lit(C) + ')', 'concierge_checkin_photo_authorize(' + w.lit(C) + ',' + w.lit(uuid.uuid4()) + ')']:
                r = w.raw(w.session(C) + 'select public.' + rpc + ';commit;')
                if not allowed:
                    self.assertIn('concierge_forbidden', r.stderr, rpc)
                elif 'photo_authorize' in rpc:
                    self.assertIn('concierge_not_found', r.stderr)
                else:
                    self.assertEqual(r.returncode, 0, r.stderr)

    def test_f2_history_rechecks_current_session_after_waiting_for_case(self):
        self.publish()
        locker = subprocess.Popen(['psql','-X','-w','-h',w.SOCKET,'-p','55439','-U','postgres','-d',w.DB,'-At'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=w.ENV)
        locker.stdin.write('begin;select client_id from concierge.cases where client_id=' + w.lit(C) + " for update;select 'LOCKED';select pg_sleep(1);commit;")
        locker.stdin.close()
        try:
            for _ in range(8):
                if locker.stdout.readline().strip() == 'LOCKED':
                    break
            else:
                self.fail('case lock handshake failed')
            w.q('update auth.sessions set not_after=clock_timestamp()+interval \'400 milliseconds\' where id=' + w.lit(C))
            r = w.raw(w.session(C) + 'select public.concierge_checkin_read(' + w.lit(C) + ');commit;')
            self.assertIn('concierge_session_ended', r.stderr)
        finally:
            locker.wait(timeout=5)
            locker.stdout.close()
            locker.stderr.close()

    def test_f3_every_mutable_published_root_field_invalidates_affected_review(self):
        view = self.reviewed()
        original = copy.deepcopy(view['draft']['content'])
        changes = dict(title='updated title', summary='updated summary', preparation=dict(by='new author', on='2026-10-30'), consultationSections=[dict(title='context', body='changed context')], routineGuides=[dict(id='guide', productId=None, title='directions', intro='care', steps=[dict(title=None, body='new instruction')], careNote=None, sources=[])], sources=[dict(label='evidence', url='https://example.com/evidence')], context={**original['context'], 'facts':original['context']['facts'] + [dict(id='new-fact', kind='advisor_conclusion', visibility='client', text='new fact', sources=[], contradicts=[])]}, goals=[dict(id='comfort', text='new goal', factIds=[])], products=[self.product()], decisions=[self.decision()], routine=[dict(id='rinse', slotId='rinse', kind='instruction', productId=None, title='rinse', directions=['use water'], cautions=[], schedule=self.schedule())], followUp=dict(criteria=['new follow up'], authoredNotes=[]))
        for field, value in changes.items():
            with self.subTest(field=field):
                content = copy.deepcopy(original)
                content[field] = value
                if field == 'decisions':
                    content['products'] = [self.product()]
                changed, _ = self.save(view['draft'], content)
                invalidated = [s['sectionId'] for s in changed['sections'] if not s['reviewed']]
                self.assertTrue(invalidated, field)
                if field == 'routineGuides':
                    self.assertIn('routine', invalidated)
                    self.assertNotIn('follow_up', invalidated)
                # Restore and review so each field starts from the same reviewed dependencies.
                restored, _ = self.save(changed['draft'], original)
                view = self.review(restored)
        before = view['sections']
        self.fund()
        self.assertEqual(w.call(A, 'read_draft_v1', draftId=view['draft']['id'])['sections'], before)

    def test_f4_assignment_requires_exact_human_adoption_and_preserves_both_work_bodies(self):
        self.legacy()
        original = w.q('select row_to_json(d)::text from concierge.drafts d where client_id=' + w.lit(C))
        d = self.draft()
        args = dict(draftId=d['id'], expectedContentRevision=0, expectedAssignmentRevision=0, fromClientId=None, toClientId=C)
        self.deny(A, 'assign_draft_v1', 'legacy_draft_conflict', requestId=str(uuid.uuid4()), **args)
        # Adoption is deliberate, exact and only into an empty draft; no manual body is overwritten.
        nonempty, _ = self.save(d, w.content())
        r = w.edge(A, 'assign_draft_v1', requestId=str(uuid.uuid4()), **{**args, 'expectedContentRevision':1}, legacyAdoption=dict(expectedCaseRevision=2, strategy='adopt_legacy'))
        self.assertEqual(r['body'], dict(code='legacy_draft_conflict'))
        d = self.draft()
        args['draftId'] = d['id']
        r = w.edge(A, 'assign_draft_v1', requestId=str(uuid.uuid4()), **args, legacyAdoption=dict(expectedCaseRevision=1, strategy='adopt_legacy'))
        self.assertEqual(r['body'], dict(code='revision_conflict'))
        request = str(uuid.uuid4())
        cmd = dict(action='assign_draft_v1', requestId=request, **args, legacyAdoption=dict(expectedCaseRevision=2, strategy='adopt_legacy'))
        adopted = w.edge(A, **cmd)
        self.assertEqual(adopted['status'], 200, adopted)
        body = adopted['body']['draft']
        self.assertEqual(body['origin']['kind'], 'legacy')
        self.assertIn('PRIVATE_UNPUBLISHED_LEGACY_NOTE', json.dumps(body['content']))
        self.assertIn('PRIVATE_LEGACY_INTAKE', json.dumps(body['content']))
        self.assertEqual(w.call(A, 'read_draft_v1', draftId=nonempty['draft']['id'])['draft']['content'], nonempty['draft']['content'])
        self.assertEqual(w.q('select row_to_json(d)::text from concierge.drafts d where client_id=' + w.lit(C)), original)
        self.assertEqual(w.edge(A, **cmd), adopted)
        for action in ['save_draft', 'save_draft_v2']:
            r = self.old(action, {}, 2)
            self.assertIn('content_version_required', r.stderr)
        self.assertEqual(w.q('select count(*) from concierge.plan_legacy_adoptions'), '1')
        self.deny(A, 'assign_draft_v1', requestId=str(uuid.uuid4()), draftId=body['id'], expectedContentRevision=1, expectedAssignmentRevision=1, fromClientId=C, toClientId=D)

    def test_f4_rich_legacy_adoption_retains_complete_guidance_and_private_provenance(self):
        payload = self.legacy(rich=True)
        d = self.draft()
        r = w.edge(A, 'assign_draft_v1', requestId=str(uuid.uuid4()), draftId=d['id'], expectedContentRevision=0, expectedAssignmentRevision=0, fromClientId=None, toClientId=C, legacyAdoption=dict(expectedCaseRevision=2, strategy='adopt_legacy'))
        self.assertEqual(r['status'], 200, r)
        content = r['body']['draft']['content']
        self.assertEqual(content['consultationSections'], payload['presentation']['consultationSections'])
        self.assertEqual(content['routineGuides'], payload['presentation']['routineGuides'])
        self.assertEqual(content['decisions'][0]['guidance']['how'], payload['presentation']['categoryCards'][0]['how'])
        preview = w.call(A, 'preview_draft_v1', draftId=d['id'], contentRevision=1, assignmentRevision=1)
        self.assertNotIn('PRIVATE_', json.dumps(preview))

    def test_f4_legacy_save_and_new_assignment_serialize_to_one_writable_authority(self):
        self.legacy()
        d = self.draft()
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            saved = pool.submit(self.old, 'save_draft', dict(intakeVersion=1, recommendations=[], advisorNote='concurrent manual work'), 2)
            assigned = pool.submit(w.edge, A, 'assign_draft_v1', requestId=str(uuid.uuid4()), draftId=d['id'], expectedContentRevision=0, expectedAssignmentRevision=0, fromClientId=None, toClientId=C, legacyAdoption=dict(expectedCaseRevision=2, strategy='adopt_legacy'))
            old, new = saved.result(), assigned.result()
        self.assertEqual(int(old.returncode == 0) + int(new['status'] == 200), 1, (old.stderr, new))

    @staticmethod
    def schedule():
        return dict(periods=['evening'], days=dict(kind='daily'), condition=None, asNeeded=False, stages=[], anchor='actual_start', automaticAdvance=False)

    @staticmethod
    def product():
        return dict(id='new-product', name='synthetic moisturizer', brand=None, variant=None, sizeLabel='', productUrl=None, imageUrl=None, reference=None, displayPrice=None, strength=dict(state='unknown'), category=dict(state='unknown'), identity='client_confirmed', formula='unknown', factIds=[], guides=[], evidence=[])

    def decision(self, directions=None):
        return dict(id='addition', slotId='care-slot', recommendationId=None, kind='addition', goalIds=['comfort'], currentProductIds=[], primaryProductId='new-product', alternativeProductIds=[], reason='comfortable care', directions=['use gently'] if directions is None else directions, cautions=[], limitations=[], schedule=self.schedule(), factIds=[], guidance=dict(title='add moisturizer', subtitle='', rationaleTitle='comfort', reasons=[], actions=[], comparisons=[], factsTitle='', facts=[], how=None, sources=[], group=None, decisionLabels=None))

    def test_f5_blank_directions_store_but_block_both_sql_and_handler_approval_and_publication(self):
        view = self.saved()
        claim = self.fund()
        for directions in [[], [''], [' \t\r\n'], ['\u00a0\u1680\u2000\u200a\u2028\u2029\u202f\u205f\u3000\ufeff'], ['use gently', ' ']]:
            for kind in ['addition', 'replace', 'finish_then_replace', 'optional_alternative']:
                with self.subTest(directions=directions, kind=kind):
                    content = w.content()
                    content['products'] = [self.product()]
                    content['decisions'] = [{**self.decision(directions), 'kind':kind}]
                    view, _ = self.save(view['draft'], content)
                    view = self.review(view)
                    self.assertTrue(any(i['code'] == 'guidance_incomplete' for i in view['issues']), view['issues'])
                    self.deny(A, 'approve_publication_v1', 'not_ready', requestId=str(uuid.uuid4()), target=view['target'], scope='care_plan.publish', publisher=dict(kind='human', actorId=A))
                    reply = w.edge(A, 'approve_publication_v1', requestId=str(uuid.uuid4()), target=view['target'], scope='care_plan.publish', publisher=dict(kind='human', actorId=A))
                    self.assertEqual(reply['body'], dict(code='not_ready'))
                    # Fixture-only exact approval represents previously issued/corrupt readiness state.
                    # Both publication boundaries must independently reject it without any effects.
                    approval = str(uuid.uuid4())
                    w.q('insert into concierge.plan_approvals(id,draft_id,target,publisher,scope,approved_by,policy_revision) values(' + w.lit(approval) + ',' + w.lit(view['draft']['id']) + ',' + w.lit(json.dumps(view['target'])) + ',' + w.lit(json.dumps(dict(kind='human', actorId=A))) + ",'care_plan.publish'," + w.lit(A) + ',1)')
                    self.deny(A, 'publish_plan_v1', 'not_ready', requestId=str(uuid.uuid4()), target=view['target'], approvalId=approval, firstServiceClaimId=claim)
                    reply = w.edge(A, 'publish_plan_v1', requestId=str(uuid.uuid4()), target=view['target'], approvalId=approval, firstServiceClaimId=claim)
                    self.assertEqual(reply['body'], dict(code='not_ready'))
                    self.assertEqual(w.q('select count(*) from concierge.publications'), '0')
        # Meaningful Unicode-padded text is valid; a no-product/no-purchase plan remains publishable.
        complete = w.content()
        complete['routine'] = [dict(id='water-rinse', slotId='water', kind='instruction', productId=None, title='rinse', directions=['\u00a0use water gently\u3000'], cautions=[], schedule=self.schedule())]
        complete['decisions'] = [{**self.decision([]), 'kind':'no_addition', 'primaryProductId':None, 'schedule':None}]
        view, _ = self.save(view['draft'], complete)
        view = self.review(view)
        a = w.write(A, 'approve_publication_v1', target=view['target'], scope='care_plan.publish', publisher=dict(kind='human', actorId=A))
        w.write(A, 'publish_plan_v1', target=view['target'], approvalId=a['id'], firstServiceClaimId=claim)
        self.assertEqual(w.q('select count(*) from concierge.product_orders'), '0')
        self.assertEqual(w.q('select count(*) from concierge.activations'), '0')

    def test_q1_restore_explicitly_adopts_original_draft_source_without_transferring_identity(self):
        view, _, source = self.source_save(A, draft_bound=True)
        original = view['draft']['id']
        view = w.write(A, 'assign_draft_v1', draftId=original, expectedContentRevision=1, expectedAssignmentRevision=0, fromClientId=None, toClientId=C)
        view = self.review(view)
        a = w.write(A, 'approve_publication_v1', target=view['target'], scope='care_plan.publish', publisher=dict(kind='human', actorId=A))
        w.write(A, 'publish_plan_v1', target=view['target'], approvalId=a['id'], firstServiceClaimId=self.fund())
        before = w.q('select row_to_json(s)::text from concierge.plan_sources s where id=' + w.lit(source))
        r = w.edge(A, 'restore_publication_v1', requestId=str(uuid.uuid4()), clientId=C, publicationVersion=1, expectedWorkingDraftId=None)
        self.assertEqual(r['status'], 200, r)
        restored = r['body']['draft']
        self.assertNotEqual(restored['id'], original)
        self.assertEqual(restored['content'], view['draft']['content'])
        self.assertEqual(w.q('select row_to_json(s)::text from concierge.plan_sources s where id=' + w.lit(source)), before)
        self.assertEqual(w.call(A, 'read_draft_v1', draftId=restored['id'])['draft']['content'], restored['content'])
        # Lawful source references remain grantable to this exact restored draft, never client-wide.
        w.write(A, 'grant_task_v1', agentActorId=G, providerSessionId=G, clientId=None, draftId=restored['id'], actions=['read_draft_v1','save_draft_v1'], sourceIds=[source], expiresAt=w.q("select to_char((now() at time zone 'UTC')+interval '1 hour','YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')"))
        self.assertEqual(w.edge(G, 'read_draft_v1', draftId=restored['id'])['status'], 200)
        self.deny(A, 'assign_draft_v1', 'source_conflict', requestId=str(uuid.uuid4()), draftId=restored['id'], expectedContentRevision=0, expectedAssignmentRevision=0, fromClientId=C, toClientId=D)
        w.q('update concierge.plan_sources set active=false where id=' + w.lit(source))
        self.deny(S, 'read_draft_v1', 'source_conflict', draftId=restored['id'])

    def service(self, invocation):
        return w.raw('set role service_role;select public.' + invocation)

    def test_q2_null_claim_limit_cannot_claim_unbounded_jobs(self):
        _, _, _, receipt = self.publish()
        w.q('insert into auth.users(id) select gen_random_uuid() from generate_series(1,55);insert into concierge.plan_deliveries(event_id,recipient_id,channel) select ' + w.lit(receipt['notificationEventId']) + ",id,'email' from auth.users where id not in (" + ','.join(w.lit(x) for x in [A,S,G,C,D]) + ')')
        for limit in ['null', '0', '51']:
            r = self.service('concierge_plan_delivery_claim_v1(' + limit + ')')
            self.assertIn('concierge_invalid_input', r.stderr)
            self.assertEqual(w.q("select count(*) from concierge.plan_deliveries where status='claimed'"), '0')
        r = self.service('concierge_plan_delivery_claim_v1(50)')
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(len(json.loads(r.stdout.splitlines()[-1])), 50)

    def test_q2_delivery_null_cas_and_reconciliation_are_rejected_without_changes(self):
        self.publish()
        job = json.loads(self.service('concierge_plan_delivery_claim_v1(1)').stdout.splitlines()[-1])[0]
        def result(status="'uncertain'", delivery=None, lease=None):
            return self.service('concierge_plan_delivery_result_v1(' + (w.lit(job['deliveryId']) if delivery is None else delivery) + ',' + (w.lit(job['leaseId']) if lease is None else lease) + ',' + status + ',null,null)')
        for fields in [dict(status='null'), dict(delivery='null'), dict(lease='null')]:
            r = result(**fields)
            self.assertIn('concierge_invalid_input', r.stderr)
        r = result(status="'uncertain'")
        self.assertEqual(r.returncode, 0, r.stderr)
        revision = json.loads(r.stdout.splitlines()[-1])['revision']
        snapshot = w.q('select row_to_json(d)::text from concierge.plan_deliveries d where id=' + w.lit(job['deliveryId']))
        for expected, reconciled, code in [('null','true','invalid_input'), (str(revision),'null','invalid_input'), (str(revision),'false','revision_conflict'), (str(revision-1),'true','revision_conflict')]:
            r = self.service('concierge_plan_delivery_retry_v1(' + w.lit(job['deliveryId']) + ',' + expected + ',' + reconciled + ')')
            self.assertIn('concierge_' + code, r.stderr)
            self.assertEqual(w.q('select row_to_json(d)::text from concierge.plan_deliveries d where id=' + w.lit(job['deliveryId'])), snapshot)
        self.assertEqual(self.service('concierge_plan_delivery_retry_v1(' + w.lit(job['deliveryId']) + ',' + str(revision) + ',true)').returncode, 0)


if __name__ == '__main__':
    unittest.main()
