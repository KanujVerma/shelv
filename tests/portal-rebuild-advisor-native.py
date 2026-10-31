"""Persisted advisor reads. Synthetic Auth bridge only, no JWT/PostgREST acceptance.

Set SHELV_PLAN_NATIVE_MODULE to a fixture-location-only adapted copy of the retained
native harness when its default fixture is exclusively allocated to another task.
"""
import concurrent.futures
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import time
import unittest
import uuid

module = Path(os.environ.get('SHELV_PLAN_NATIVE_MODULE', Path(__file__).with_name('portal-rebuild-native.py')))
spec = importlib.util.spec_from_file_location('advisor_native_fixture', module)
w = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w)
A,S,G,C,D = w.A,w.S,w.G,w.C,w.D
PORT=os.environ.get('SHELV_PLAN_NATIVE_PORT','55439')

class AdvisorReadTests(unittest.TestCase):
    setUp=w.PlanTests.setUp
    draft=w.PlanTests.draft
    saved=w.PlanTests.saved
    reviewed=w.PlanTests.reviewed
    approved=w.PlanTests.approved
    fund=w.PlanTests.fund
    publish=w.PlanTests.publish
    deny=w.PlanTests.deny

    def gate(self,v,publisher=None,actor=A):
        return w.edge(actor,'read_advisor_gate_v1',target=v['target'],publisher=publisher or dict(kind='human',actorId=A))
    def publication(self,actor=A,client=C,version=None):
        return w.edge(actor,'read_advisor_publication_v1',clientId=client,version=version)
    def grant(self,actions,draft=None,client=None,ttl="1 hour"):
        return w.write(A,'grant_task_v1',agentActorId=G,providerSessionId=G,clientId=client,draftId=draft,actions=actions,sourceIds=[],expiresAt=w.q("select to_char((clock_timestamp() at time zone 'UTC')+interval "+w.lit(ttl)+",'YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')"))
    def ok(self,r):
        self.assertEqual(r['status'],200,r);return r['body']
    def test_01_restart_approval_recovery_and_payment_independence(self):
        v,a=self.approved()
        self.assertEqual(self.ok(self.gate(v))['approval'],a)
        self.fund()
        g=self.ok(self.gate(v));self.assertEqual(g['approval'],a);self.assertEqual(g['publication'],'first');self.assertEqual(g['coverage'],'inactive')
        self.assertEqual(w.q('select count(*) from concierge.publications'),'0')
    def test_02_content_assignment_hash_and_client_binding(self):
        v,a=self.approved()
        for delta in [dict(contentRevision=99),dict(assignmentRevision=99),dict(contentHash='a'*64),dict(clientId=D)]:
            self.assertEqual(w.edge(A,'read_advisor_gate_v1',target={**v['target'],**delta},publisher=dict(kind='human',actorId=A))['status'],409)
        d=v['draft'];c=d['content'];c['summary']='changed'
        changed=w.write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=d['assignmentRevision'],kind='care_plan',content=c)
        self.assertEqual(self.gate(v)['status'],409);self.assertIsNone(self.ok(self.gate(changed))['approval'])
    def test_03_revocation_policy_and_selected_publisher_invalidate(self):
        v,a=self.approved();self.assertIsNone(self.ok(self.gate(v,dict(kind='human',actorId=S)))['approval'])
        w.write(A,'set_sami_approval_policy_v1',expectedPolicyRevision=1,requireKanujApproval=False,confirmed=True)
        self.assertIsNone(self.ok(self.gate(v))['approval'])
        a=w.write(A,'approve_publication_v1',target=v['target'],scope='care_plan.publish',publisher=dict(kind='human',actorId=A))
        w.write(A,'revoke_approval_v1',approvalId=a['id'],expectedPolicyRevision=2)
        self.assertIsNone(self.ok(self.gate(v))['approval'])
    def test_04_current_publisher_principal_and_capability(self):
        v,a=self.approved(publisher=dict(kind='human',actorId=S));self.assertEqual(self.ok(self.gate(v,dict(kind='human',actorId=S)))['approval'],a)
        w.q('update concierge.advisors set can_publish=false where user_id='+w.lit(S))
        self.assertIsNone(self.ok(self.gate(v,dict(kind='human',actorId=S)))['approval'])
        w.q('update concierge.advisors set can_publish=true where user_id='+w.lit(S)+';update concierge.plan_principals set active=false where actor_id='+w.lit(S))
        self.assertIsNone(self.ok(self.gate(v,dict(kind='human',actorId=S)))['approval'])
    def test_05_consumed_approval_is_not_current_and_history_is_immutable(self):
        v,a,claim,receipt=self.publish();g=self.ok(self.gate(v));self.assertIsNone(g['approval']);self.assertEqual(g['publication'],'later');self.assertEqual(g['coverage'],'active')
        p=self.ok(self.publication());self.assertEqual(p['clientId'],C);self.assertEqual(p['version'],1);self.assertEqual(p['plan']['publishedAt'],receipt['publishedAt']);self.assertEqual(p['plan']['content']['title'],'gentle care');self.assertTrue(p['clientAccess']['entitled'])
        draft=w.write(A,'restore_publication_v1',clientId=C,publicationVersion=1,expectedWorkingDraftId=None)['draft'];c=draft['content'];c['title']='mutable unrelated title'
        w.write(A,'save_draft_v1',draftId=draft['id'],expectedContentRevision=draft['contentRevision'],expectedAssignmentRevision=draft['assignmentRevision'],kind='care_plan',content=c)
        self.assertEqual(self.ok(self.publication(version=1))['plan'],p['plan'])
    def test_06_no_publication_wrong_version_and_cross_client_fail_closed(self):
        self.assertEqual(self.publication()['status'],404);self.publish()
        self.assertEqual(self.publication(version=2)['status'],404);self.assertEqual(self.publication(client=D,version=1)['status'],404)
        self.assertEqual(self.publication(actor=C,client=D,version=1)['status'],403)
        self.assertEqual(w.edge(C,'read_client_plan_v1',version=1,clientId=D)['status'],400)
    def test_07_advisor_audit_outlives_actual_client_access(self):
        self.publish();w.q('insert into concierge.service_cancellations(client_id,actor_id,data) values('+w.lit(C)+','+w.lit(A)+",jsonb_build_object('supportEndsOn',((now() at time zone 'America/Chicago')::date-30)::text))")
        p=self.ok(self.publication());self.assertEqual(p['clientAccess'],dict(care='ended',entitled=True,canRead=False,canWrite=False))
        self.assertEqual(w.edge(C,'read_client_plan_v1',version=1)['status'],403)
        w.q('update auth.sessions set not_after=clock_timestamp()-interval \'1 second\' where id='+w.lit(A));self.assertEqual(self.publication()['status'],401)
    def test_08_actual_view_only_capabilities_no_name_inference(self):
        v,a=self.approved();w.q('update concierge.advisors set can_edit=false,can_publish=false,can_confirm_payments=false where user_id='+w.lit(S))
        g=self.ok(self.gate(v,actor=S));self.assertEqual(g['approval'],a);self.assertEqual(g['capabilities'],dict(actorId=S,view=True,edit=False,assign=False,review=False,approve=False,publish=False,confirmPayments=False))
        self.assertEqual(self.gate(v,actor=C)['status'],403)
        w.q('update concierge.advisors set can_view=false where user_id='+w.lit(S));self.assertEqual(self.gate(v,actor=S)['status'],403)
    def test_09_agent_requires_explicit_exact_client_draft_session_action(self):
        v,a,claim,r=self.publish();self.assertEqual(self.publication(actor=G)['status'],403)
        old=self.grant(['read_draft_v1'],draft=v['draft']['id']);self.assertEqual(self.publication(actor=G)['status'],403);self.assertEqual(self.gate(v,actor=G)['status'],403);w.write(A,'revoke_task_v1',grantId=old['grantId'])
        grant=self.grant(['read_advisor_publication_v1'],client=D);self.assertEqual(self.publication(actor=G)['status'],403)
        w.write(A,'revoke_task_v1',grantId=grant['grantId']);grant=self.grant(['read_advisor_gate_v1','read_advisor_publication_v1'],draft=v['draft']['id'])
        self.ok(self.gate(v,actor=G));self.ok(self.publication(actor=G));self.assertEqual(self.publication(actor=G,client=D)['status'],403)
        w.write(A,'revoke_task_v1',grantId=grant['grantId']);self.assertEqual(self.publication(actor=G)['status'],403)
    def test_10_task_expiry_and_session_expiry(self):
        v=self.saved();grant=self.grant(['read_advisor_gate_v1'],client=C,ttl='0.5 seconds');self.ok(self.gate(v,actor=G))
        time.sleep(0.6);self.assertEqual(self.gate(v,actor=G)['status'],403)
        self.grant(['read_advisor_gate_v1'],draft=v['draft']['id']);w.q('delete from auth.sessions where id='+w.lit(G));self.assertEqual(self.gate(v,actor=G)['status'],401)
    def test_11_private_sources_independent_and_source_version_changes(self):
        v=self.saved();source=str(uuid.uuid4());d=v['draft'];c=d['content'];c['context']['facts'].append(dict(id='private-canary',kind='client_report',visibility='advisor_only',text='PRIVATE_RAW_CANARY',sources=[dict(sourceId=source,sourceVersion=1,locator=dict(kind='text',start=1,end=3))],contradicts=[]))
        w.q('insert into concierge.plan_sources(id,client_id,version) values('+w.lit(source)+','+w.lit(C)+',1)')
        v=w.write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=d['assignmentRevision'],kind='care_plan',content=c);d=v['draft']
        for sec in v['sections']:w.write(A,'review_section_v1',draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=d['assignmentRevision'],sectionId=sec['sectionId'],sectionHash=sec['sectionHash'])
        a=w.write(A,'approve_publication_v1',target=v['target'],scope='care_plan.publish',publisher=dict(kind='human',actorId=A))
        g=self.ok(self.gate(v,actor=S));self.assertEqual(g['approval'],a);self.assertNotIn('PRIVATE_RAW_CANARY',json.dumps(g));self.assertNotIn(source,json.dumps(g))
        self.assertEqual(w.edge(S,'read_draft_v1',draftId=d['id'])['status'],403)
        grant=self.grant(['read_advisor_gate_v1'],draft=d['id']);self.ok(self.gate(v,actor=G))
        claim=self.fund();w.write(A,'publish_plan_v1',target=v['target'],approvalId=a['id'],firstServiceClaimId=claim)
        p=self.ok(self.publication());self.assertNotIn('PRIVATE_RAW_CANARY',json.dumps(p));self.assertNotIn(source,json.dumps(p));self.assertNotIn('private-canary',json.dumps(p))
        w.q('update concierge.plan_sources set version=2 where id='+w.lit(source));self.assertEqual(self.gate(v)['status'],409)
    def test_12_reads_do_not_write_clocks_requests_outbox_use_or_start(self):
        v,a,claim,r=self.publish()
        snapshot="select jsonb_object_agg(t,rows)::text from ("+' union all '.join("select '"+t+"' t,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') rows from concierge."+t+' x' for t in ['cases','plan_drafts','plan_requests','plan_approvals','plan_publication_receipts','plan_review_schedule','checkin_heads','service_periods','entitled_publications','plan_events','plan_deliveries','activations','receipts','plan_decisions'])+") z"
        before=w.q(snapshot)
        for _ in range(3):self.ok(self.gate(v));self.ok(self.publication())
        self.assertEqual(w.q(snapshot),before)
    def test_13_sql_ts_shapes_and_acl_search_paths(self):
        r=subprocess.run(['node','--experimental-strip-types','--input-type=module','-e',"import {planCommandFields} from './src/contracts/PortalRebuildValidation.ts';process.stdout.write(JSON.stringify(planCommandFields))"],cwd=w.ROOT,env=w.ENV,text=True,capture_output=True)
        self.assertEqual(r.returncode,0,r.stderr);fields=json.loads(r.stdout);self.assertEqual(json.loads(w.q('select concierge.plan_command_fields()')),fields)
        base=json.loads(w.q('select concierge.plan_command_fields_base_v1()'));fields.pop('read_advisor_gate_v1');fields.pop('read_advisor_publication_v1');fields['grant_task_v1']['actions']['item']['values']=[a for a in fields['grant_task_v1']['actions']['item']['values'] if a not in ['read_advisor_gate_v1','read_advisor_publication_v1']];fields['grant_task_v1']['actions']['max']=12;self.assertEqual(base,fields)
        self.assertEqual(w.q("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='concierge' and p.proname like 'plan_%' and (has_function_privilege('authenticated',p.oid,'execute') or has_function_privilege('anon',p.oid,'execute') or has_function_privilege('service_role',p.oid,'execute'))"),'0')
        self.assertEqual(w.q("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='concierge' and c.relname like 'plan_%' and c.relkind='r' and (not c.relrowsecurity or has_table_privilege('authenticated',c.oid,'select,insert,update,delete'))"),'0')
    def test_14_legacy_r1_r2_actual_decisions_use_and_schedule(self):
        w.q('update concierge.plan_policy set activated=false;insert into concierge.intakes values('+w.lit(C)+",1,'original comfort','PRIVATE_LEGACY_CANARY',now());insert into concierge.publications(client_id,version,intake_version,recommendations,published_by) values("+w.lit(C)+",1,1,'[]',"+w.lit(A)+'),('+w.lit(C)+",2,1,'[]',"+w.lit(A)+');update concierge.cases set published_version=2 where client_id='+w.lit(C))
        fixture=json.loads((w.ROOT/'tests/fixtures/concierge-presentation.json').read_text())['presentation'];w.q('insert into concierge.publication_presentations values('+w.lit(C)+',2,'+w.lit(json.dumps(fixture))+');update concierge.plan_policy set activated=true')
        p=self.ok(self.publication(version=1));self.assertEqual(p['plan']['documentSchemaVersion'],1);self.assertFalse(p['clientAccess']['entitled']);self.assertFalse(p['clientAccess']['canRead']);self.assertIsNone(p['reviewSchedule'])
        p=self.ok(self.publication());self.assertEqual(p['plan']['documentSchemaVersion'],2);self.assertEqual(p['plan']['legacyOriginal']['presentation'],fixture);self.assertNotIn('PRIVATE_LEGACY_CANARY',json.dumps(p))
        self.fund();card=fixture['categoryCards'][0]
        w.edge(C,'record_decision_v1',requestId=str(uuid.uuid4()),expectedDecisionRevision=0,publicationVersion=2,decisionId=card['id'],choice='deferred',reason='later')
        p=self.ok(self.publication());self.assertEqual(p['decisions'],[dict(decisionId=card['id'],choice='deferred',reason='later')]);self.assertEqual(p['actualUse'],[])
        w.q('insert into concierge.activations(client_id,version,recommendation_id,slot,product_id,started_on) values('+w.lit(C)+",1,'old-decision','same-slot','old-product',(now() at time zone 'America/Chicago')::date-1),("+w.lit(C)+",2,'new-decision','same-slot','new-product',(now() at time zone 'America/Chicago')::date)")
        use=self.ok(self.publication())['actualUse'];self.assertEqual(len(use),1);self.assertEqual(use[0]['productId'],'new-product');self.assertEqual(w.q('select count(*) from concierge.activations'),'2')
    def test_15_current_after_case_wait_session_expiry(self):
        v=self.saved()
        sql='begin;select pg_advisory_xact_lock(hashtextextended(\'concierge:client:'+C+"',0));select 'LOCKED';select pg_sleep(0.6);commit;"
        w.q('update auth.sessions set not_after=clock_timestamp()+interval \'0.3 seconds\' where id='+w.lit(A))
        locker=subprocess.Popen(['psql','-X','-w','-h',w.SOCKET,'-p',PORT,'-U','postgres','-d',w.DB,'-At'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=w.ENV)
        try:
            locker.stdin.write(sql);locker.stdin.close()
            for _ in range(8):
                if locker.stdout.readline().strip()=='LOCKED':break
            self.assertEqual(self.gate(v)['status'],401)
        finally:
            locker.wait(timeout=5);locker.stdout.close();locker.stderr.close()

    def test_16_task_publisher_approval_revocation_is_current_not_remembered(self):
        v=self.reviewed();grant=self.grant(['publish_plan_v1'],draft=v['draft']['id'])
        publisher=dict(kind='task_agent',actorId=G,taskGrantId=grant['grantId'])
        a=w.write(A,'approve_publication_v1',target=v['target'],scope='care_plan.publish',publisher=publisher)
        self.assertEqual(self.ok(self.gate(v,publisher))['approval'],a)
        w.write(A,'revoke_task_v1',grantId=grant['grantId'])
        self.assertIsNone(self.ok(self.gate(v,publisher))['approval'])
    def test_17_current_and_historical_v3_version_binding_with_real_schedule_use(self):
        v,a,claim,r=self.publish()
        p1=self.ok(self.publication(version=1));schedule=p1['reviewSchedule'];self.assertIsNotNone(schedule);self.assertEqual(schedule['firstPublicationAt'],r['publishedAt']);self.assertEqual(p1['nextReviewOn'],schedule['twoWeekOn'])
        restored=w.write(A,'restore_publication_v1',clientId=C,publicationVersion=1,expectedWorkingDraftId=None);d=restored['draft'];c=d['content'];c['title']='second immutable version'
        v2=w.write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=d['assignmentRevision'],kind='care_plan',content=c);d=v2['draft']
        for sec in v2['sections']:w.write(A,'review_section_v1',draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=d['assignmentRevision'],sectionId=sec['sectionId'],sectionHash=sec['sectionHash'])
        a2=w.write(A,'approve_publication_v1',target=v2['target'],scope='care_plan.publish',publisher=dict(kind='human',actorId=A));w.write(A,'publish_plan_v1',target=v2['target'],approvalId=a2['id'],firstServiceClaimId=None)
        p2=self.ok(self.publication());self.assertEqual(p2['version'],2);self.assertEqual(p2['plan']['content']['title'],'second immutable version');self.assertEqual(self.ok(self.publication(version=1))['plan'],p1['plan']);self.assertEqual(p2['reviewSchedule'],schedule)
        self.grant(['read_advisor_publication_v1'],draft=v['draft']['id']);self.ok(self.publication(actor=G,version=1));self.assertEqual(self.publication(actor=G)['status'],403)
    def test_18_task_revocation_committed_while_grant_wait_denies(self):
        v=self.saved();grant=self.grant(['read_advisor_gate_v1'],draft=v['draft']['id'])
        sql='begin;select id from concierge.plan_task_grants where id='+w.lit(grant['grantId'])+' for update;insert into concierge.plan_task_revocations(grant_id,actor_id) values('+w.lit(grant['grantId'])+','+w.lit(A)+");select 'LOCKED';select pg_sleep(0.4);commit;"
        locker=subprocess.Popen(['psql','-X','-w','-h',w.SOCKET,'-p',PORT,'-U','postgres','-d',w.DB,'-At'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=w.ENV)
        try:
            locker.stdin.write(sql);locker.stdin.close()
            for _ in range(8):
                if locker.stdout.readline().strip()=='LOCKED':break
            self.assertEqual(self.gate(v,actor=G)['status'],403)
        finally:
            locker.wait(timeout=5);locker.stdout.close();locker.stderr.close()

    def test_19_source_permission_revocation_invalidates_approval_without_granting_raw_read(self):
        v=self.saved();d=v['draft'];c=d['content'];source=str(uuid.uuid4())
        c['context']['facts'].append(dict(id='private-permission',kind='client_report',visibility='advisor_only',text='PRIVATE_PERMISSION_CANARY',sources=[dict(sourceId=source,sourceVersion=1,locator=dict(kind='whole'))],contradicts=[]))
        w.q('insert into concierge.plan_sources(id,client_id,version) values('+w.lit(source)+','+w.lit(C)+',1);insert into concierge.plan_source_permissions values('+w.lit(S)+','+w.lit(source)+')')
        v=w.write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=d['assignmentRevision'],kind='care_plan',content=c);d=v['draft']
        for sec in v['sections']:w.write(A,'review_section_v1',draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=d['assignmentRevision'],sectionId=sec['sectionId'],sectionHash=sec['sectionHash'])
        w.write(A,'set_sami_approval_policy_v1',expectedPolicyRevision=1,requireKanujApproval=False,confirmed=True)
        pub=dict(kind='human',actorId=S);a=w.write(S,'approve_publication_v1',target=v['target'],scope='care_plan.publish',publisher=pub)
        self.assertEqual(self.ok(self.gate(v,pub))['approval'],a)
        w.q('delete from concierge.plan_source_permissions where actor_id='+w.lit(S))
        g=self.ok(self.gate(v,pub,actor=S));self.assertIsNone(g['approval']);self.assertNotIn('PRIVATE_PERMISSION_CANARY',json.dumps(g));self.assertEqual(w.edge(S,'read_draft_v1',draftId=d['id'])['status'],403)

    def sourced(self):
        v=self.saved();d=v['draft'];c=d['content'];source=str(uuid.uuid4())
        c['context']['facts'].append(dict(id='wait-private',kind='client_report',visibility='advisor_only',text='WAIT_PRIVATE_CANARY',sources=[dict(sourceId=source,sourceVersion=1,locator=dict(kind='whole'))],contradicts=[]))
        w.q('insert into concierge.plan_sources(id,client_id,version) values('+w.lit(source)+','+w.lit(C)+',1)')
        return w.write(A,'save_draft_v1',draftId=d['id'],expectedContentRevision=d['contentRevision'],expectedAssignmentRevision=d['assignmentRevision'],kind='care_plan',content=c),source
    def lock_wait(self,sql):
        locker=subprocess.Popen(['psql','-X','-w','-h',w.SOCKET,'-p',PORT,'-U','postgres','-d',w.DB,'-At'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=w.ENV)
        locker.stdin.write("begin;"+sql+";select 'LOCKED';select pg_sleep(0.8);commit;");locker.stdin.close()
        for _ in range(8):
            if locker.stdout.readline().strip()=='LOCKED':return locker
        locker.kill();self.fail('owned lock handshake failed')
    def test_20_gate_rechecks_reader_session_after_source_lock_wait(self):
        v,source=self.sourced();locker=self.lock_wait('select id from concierge.plan_sources where id='+w.lit(source)+' for update')
        try:
            w.q('update auth.sessions set not_after=clock_timestamp()+interval '+w.lit('0.3 seconds')+' where id='+w.lit(A))
            self.assertEqual(self.gate(v)['status'],401)
        finally:
            locker.wait(timeout=5);locker.stdout.close();locker.stderr.close()
    def test_21_gate_rechecks_task_expiry_after_source_lock_wait(self):
        v,source=self.sourced();self.grant(['read_advisor_gate_v1'],draft=v['draft']['id'],ttl='0.5 seconds');locker=self.lock_wait('select id from concierge.plan_sources where id='+w.lit(source)+' for update')
        try:self.assertEqual(self.gate(v,actor=G)['status'],403)
        finally:
            locker.wait(timeout=5);locker.stdout.close();locker.stderr.close()
    def test_22_publication_reads_actual_support_end_committed_during_client_wait(self):
        self.publish();locker=self.lock_wait("select pg_advisory_xact_lock(hashtextextended('concierge:client:"+C+"',0));insert into concierge.service_cancellations(client_id,actor_id,data) values("+w.lit(C)+','+w.lit(A)+",jsonb_build_object('supportEndsOn',((clock_timestamp() at time zone 'America/Chicago')::date-30)::text))")
        try:
            p=self.ok(self.publication());self.assertEqual(p['clientAccess'],dict(care='ended',entitled=True,canRead=False,canWrite=False))
        finally:
            locker.wait(timeout=5);locker.stdout.close();locker.stderr.close()

    def test_23_owner_role_demotion_cannot_retain_owner_approval_authority(self):
        v,a=self.approved();self.assertEqual(self.ok(self.gate(v,actor=S))['approval'],a)
        w.q("update concierge.plan_principals set kind='human' where actor_id="+w.lit(A))
        self.assertIsNone(self.ok(self.gate(v,actor=S))['approval'])

    def test_24_actual_read_only_window_is_distinct_from_advisor_audit(self):
        self.publish();self.assertEqual(w.edge(C,'read_client_plan_v1',version=1)['status'],200)
        w.q('insert into concierge.service_cancellations(client_id,actor_id,data) values('+w.lit(C)+','+w.lit(A)+",jsonb_build_object('supportEndsOn',((clock_timestamp() at time zone 'America/Chicago')::date-29)::text))")
        p=self.ok(self.publication());self.assertEqual(p['clientAccess'],dict(care='read_only',entitled=True,canRead=True,canWrite=False));self.assertEqual(w.edge(C,'read_client_plan_v1',version=1)['body']['access'],'read_only')

if __name__=='__main__':unittest.main()
