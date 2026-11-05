-- AUTHORED, UNRUN. Requires separately authorized full canonical migration/pgTAP replay.
-- No stubbed authorization, function replacement, grant/owner override or provider side effect.
begin;
select plan(66);
select has_table('concierge'::name,'notification_requests'::name);
select has_function('public','concierge_notification_command_v1',array['jsonb']);
select has_function('public','concierge_plan_delivery_context_v1',array['uuid','uuid']);
select ok((select relrowsecurity from pg_class where oid='concierge.notification_requests'::regclass),'journal enables RLS');
select ok(not has_table_privilege('anon','concierge.notification_requests','SELECT'),'anon cannot read journal');
select ok(not has_table_privilege('authenticated','concierge.notification_requests','SELECT'),'browser cannot read raw journal');
select ok(not has_table_privilege('service_role','concierge.notification_requests','INSERT'),'delivery service cannot forge browser receipts');
select ok(not has_function_privilege('anon','public.concierge_notification_command_v1(jsonb)','EXECUTE'),'anonymous command denied');
select ok(has_function_privilege('authenticated','public.concierge_notification_command_v1(jsonb)','EXECUTE'),'caller command available');
select ok(not has_function_privilege('service_role','public.concierge_notification_command_v1(jsonb)','EXECUTE'),'service key cannot pose as browser');
select ok(not has_function_privilege('authenticated','public.concierge_plan_delivery_context_v1(uuid,uuid)','EXECUTE'),'browser cannot obtain address resolver');
select ok(has_function_privilege('service_role','public.concierge_plan_delivery_context_v1(uuid,uuid)','EXECUTE'),'fixed service resolver available');
select ok(not has_function_privilege('anon','public.concierge_plan_delivery_context_v1(uuid,uuid)','EXECUTE'),'anonymous address resolver denied');
select ok(not has_function_privilege('authenticated','concierge.notification_command(jsonb)','EXECUTE'),'private dispatcher denied');
select ok(not has_function_privilege('service_role','concierge.notification_delivery_context(uuid,uuid)','EXECUTE'),'raw helper denied to service');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='concierge' and p.proname like 'notification\_%' escape '\' or n.nspname='public' and p.proname in ('concierge_notification_command_v1','concierge_plan_delivery_context_v1')) and not(coalesce(p.proconfig,'{}'::text[])@>array['search_path=""'])),'all new functions use empty search path');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='concierge' and p.proname like 'notification\_%' escape '\' and (has_function_privilege('authenticated',p.oid,'EXECUTE') or has_function_privilege('service_role',p.oid,'EXECUTE'))),'every new helper stays private');
select throws_ok($$select public.concierge_plan_delivery_context_v1(null,null)$$,'P0001','concierge_invalid_input','null lease cannot resolve payload');
select throws_ok($$select public.concierge_plan_delivery_context_v1('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002')$$,'P0001','concierge_revision_conflict','unknown claimed delivery is not a fabricated context');
select throws_ok($$select concierge.notification_parse('{"schemaVersion":1,"action":"list_inbox_v1","cursor":null,"limit":51}')$$,'P0001','concierge_invalid_input','list cap enforced');
select throws_ok($$select concierge.notification_parse('{"schemaVersion":1,"action":"list_inbox_v1","cursor":"n:bad","limit":1}')$$,'P0001','concierge_invalid_input','cursor identity validated');
select throws_ok($$select concierge.notification_parse('{"schemaVersion":1,"action":"list_inbox_v1","cursor":null,"limit":1,"clientId":"10000000-0000-4000-8000-000000000001"}')$$,'P0001','concierge_invalid_input','client cannot select a recipient');
select throws_ok($$select concierge.notification_parse('{"schemaVersion":1,"action":"retry_failed_email_v1","requestId":"10000000-0000-4000-8000-000000000001","deliveryId":"10000000-0000-4000-8000-000000000002","expectedRevision":0,"providerReconciled":true}')$$,'P0001','concierge_invalid_input','browser cannot attest provider reconciliation');
select throws_ok($$select concierge.notification_parse('{"schemaVersion":1,"action":"request_status_v1","requestId":"10000000-0000-4000-8000-000000000001"}')$$,'P0001','concierge_invalid_input','status requires original command');
select is(concierge.notification_parse('{"schemaVersion":1,"action":"request_status_v1","original":{"schemaVersion":1,"action":"mark_seen_v1","requestId":"10000000-0000-4000-8000-000000000001","deliveryId":"10000000-0000-4000-8000-000000000002","expectedRevision":0}}')->'original'->>'action','mark_seen_v1','original once-only intent preserved');
select ok(has_function_privilege('service_role','public.concierge_plan_delivery_claim_v1(integer)','EXECUTE'),'existing claim remains service-only available');
select ok(not has_function_privilege('authenticated','public.concierge_plan_delivery_result_v1(uuid,uuid,text,text,text)','EXECUTE'),'browser cannot assert accepted/delivered');
select ok(not has_function_privilege('authenticated','public.concierge_plan_delivery_retry_v1(uuid,bigint,boolean)','EXECUTE'),'old reconciliation bypass not granted to browser');
select ok(not has_function_privilege('authenticated','public.concierge_plan_delivery_expire_v1()','EXECUTE'),'lease expiry stays service-only');
select throws_ok($$select public.concierge_notification_command_v1('{"schemaVersion":1,"action":"list_inbox_v1","cursor":null,"limit":1}')$$,'P0001','concierge_session_ended','sessionless reads never become successful empty inbox');

-- N1 additions, AUTHORED / UNRUN. These real-table trigger cases are not Auth/API proof.
-- They seed only synthetic journal identities and roll back the whole fixture.
select ok(not has_function_privilege('authenticated','concierge.review_request_collision()','EXECUTE'),'shared guard remains private to authenticated callers');
select ok(not has_function_privilege('service_role','concierge.review_request_collision()','EXECUTE'),'shared guard receives no new service execute grant');
select ok((select not p.prosecdef and not p.proisstrict and p.provolatile='v' and p.proparallel='u' and p.prorettype='trigger'::regtype and p.pronargs=0 and p.prolang=(select oid from pg_language where lanname='plpgsql') and p.proconfig=array['search_path=""'] from pg_proc p where p.oid='concierge.review_request_collision()'::regprocedure),'shared guard keeps actual prior-source signature/invoker/default attributes/search path');
select is((select count(*)::integer from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='concierge' and c.relname in ('plan_requests','requests','workflow_requests','care_requests','review_requests','notification_requests') and t.tgname='review_request_collision' and t.tgfoid='concierge.review_request_collision()'::regprocedure and t.tgtype=7 and t.tgenabled='O' and not t.tgisinternal),6,'all six BEFORE INSERT row triggers bind the same shared function OID');
select ok(exists(select 1 from pg_trigger where tgrelid='concierge.notification_requests'::regclass and tgname='notification_requests_immutable' and tgtype=19),'original BEFORE UPDATE journal immutability trigger remains');

insert into auth.users(id,email,is_anonymous) values
 ('2f100000-0000-4000-8000-000000000001','notification-n1-a@synthetic.invalid',false),
 ('2f100000-0000-4000-8000-000000000002','notification-n1-b@synthetic.invalid',false);
insert into public.profiles(id,email) values
 ('2f100000-0000-4000-8000-000000000001','notification-n1-a@synthetic.invalid'),
 ('2f100000-0000-4000-8000-000000000002','notification-n1-b@synthetic.invalid') on conflict(id) do nothing;
insert into concierge.cases(client_id) values('2f100000-0000-4000-8000-000000000001'),('2f100000-0000-4000-8000-000000000002');
-- This helper inserts raw test journal rows, NOT business success receipts or authorization substitutes.
create function pg_temp.notification_seed_journal(family text,u uuid,r uuid) returns void language plpgsql set search_path='' as $$begin
 if family in ('requests','workflow_requests') then execute format('insert into concierge.%I(actor_id,request_id,client_id,fingerprint,result) values($1,$2,$1,decode(''00'',''hex''),''{}''::jsonb)',family) using u,r;
 elsif family='plan_requests' then insert into concierge.plan_requests(actor_id,request_id,command,fingerprint,result) values(u,r,'{}',decode('00','hex'),'{}');
 elsif family='care_requests' then insert into concierge.care_requests(actor_id,request_id,client_id,command,fingerprint,result) values(u,r,u,'{}',decode('00','hex'),'{}');
 elsif family='review_requests' then insert into concierge.review_requests(actor_id,request_id,client_id,family,command,result) values(u,r,u,'review','{}','{}');
 elsif family='notification_requests' then insert into concierge.notification_requests(actor_id,request_id,command,fingerprint,event_id,delivery_id,result) values(u,r,'{}',repeat('a',64),r,r,'{}');
 else raise exception 'unknown synthetic journal fixture family';end if;
end $$;
create function pg_temp.notification_pair(first_family text,second_family text) returns text language plpgsql set search_path='' as $$
declare u uuid:='2f100000-0000-4000-8000-000000000001';r uuid:=gen_random_uuid();msg text;state text;kept integer;blocked integer;begin
 perform pg_temp.notification_seed_journal(first_family,u,r);
 begin perform pg_temp.notification_seed_journal(second_family,u,r);return 'unexpected_second_commit';
 exception when sqlstate 'P0001' then get stacked diagnostics msg=MESSAGE_TEXT,state=RETURNED_SQLSTATE;end;
 execute format('select count(*)::integer from concierge.%I where actor_id=$1 and request_id=$2',first_family) into kept using u,r;
 execute format('select count(*)::integer from concierge.%I where actor_id=$1 and request_id=$2',second_family) into blocked using u,r;
 return state||':'||msg||':'||kept::text||':'||blocked::text;
end $$;
select is(pg_temp.notification_pair(a,b),'P0001:concierge_request_conflict:1:0',a||' then '||b||' conflicts and leaves the original row intact')
 from unnest(array['plan_requests','requests','workflow_requests','care_requests','review_requests','notification_requests']) a
 cross join unnest(array['plan_requests','requests','workflow_requests','care_requests','review_requests','notification_requests']) b where a<>b;
create function pg_temp.notification_actor_control() returns boolean language plpgsql set search_path='' as $$declare r uuid:=gen_random_uuid();begin
 perform pg_temp.notification_seed_journal('notification_requests','2f100000-0000-4000-8000-000000000001',r);
 perform pg_temp.notification_seed_journal('care_requests','2f100000-0000-4000-8000-000000000002',r);
 return exists(select 1 from concierge.notification_requests where actor_id='2f100000-0000-4000-8000-000000000001' and request_id=r) and exists(select 1 from concierge.care_requests where actor_id='2f100000-0000-4000-8000-000000000002' and request_id=r);
end $$;
select ok(pg_temp.notification_actor_control(),'same request UUID for a different actual actor is independent');

/* NATIVE TWO-SESSION CASE GRAPH, AUTHORED / UNRUN. No dblink, extra extension or fake scheduler.
Prerequisite: NEW explicitly granted isolated database, actual canonical schema, committed synthetic
actor/case seed, and a separate copy of notification_seed_journal in each session's pg_temp schema.
For EVERY one of the30 directed pairs(a,b) above, use one shared actorU and fresh requestR:
 COMMIT graph: A BEGIN -> seed(a,U,R) -> hold before COMMIT;
 B BEGIN -> seed(b,U,R), must WAIT at actual shared transaction advisory lock;
 A COMMIT -> B resumes with P0001/concierge_request_conflict -> B ROLLBACK;
 fresh observer sees exactly one first-family row, zero second-family rows.
 ROLLBACK graph: A BEGIN -> seed(a,U,R) -> hold; B attempts seed(b,U,R), must WAIT;
 A ROLLBACK -> B resumes/succeeds -> B COMMIT; observer sees zero first, one second.
Different actors with the same R must not share the actor/request serialization key.
Never substitute the30-edge SOURCE inventory or a JS lock model for these60 real schedules.

Separate ACTUAL PUBLIC-COMMAND/Auth case graph requires a genuinely eligible owned portal delivery,
verified actual client session plus enrolled/unrevoked target, and an authorized human for FAILED retry:
 exact mark/retry command -> repeat identical request -> same original receipt, one side effect/journal;
 changed action OR target OR expectedRevision with same request -> request_conflict, no extra effect;
 stale CAS with fresh request -> revision_conflict; exact original status -> original committed receipt;
 unknown/purged own receipt -> unknown, never absent/new success; current session/enrollment/deletion/
 principal/target revocation before or after lock -> denied with no private receipt return;
 either foreign-family ordering with mark or retry -> conflict and transactional rollback of attempted
 seen/status changes. UNCERTAIN retry remains reconciliation_unavailable, without provider assertions.
No success row seeded above supplies any of this public-command authority or connected evidence.

CATALOG PRE/POST graph: capture actual review_request_collision OID/owner/ACL/language/return type/
argument signature/volatility/strictness/security/parallel/cost/rows/proconfig and the five tgfoid values
BEFORE applying this migration, compare AFTER. CREATE OR REPLACE intent and post-state assertions
above are not a substitute for this still-unrun OID/ACL/attribute preservation observation.
*/

select * from finish();
rollback;
