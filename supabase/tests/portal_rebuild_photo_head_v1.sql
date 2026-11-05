-- Authored canonical pgTAP only. UNRUN in the source-only author phase.
-- A separate isolated migration rehearsal and concurrent wait/revocation test remain required.
begin;
select no_plan();
select has_function('public','concierge_checkin_head_v1',array[]::text[],'selector-free public metadata RPC');
select is((select pronargs::integer from pg_proc where oid='public.concierge_checkin_head_v1()'::regprocedure),0,'no client selector or caller authority');
select ok(has_function_privilege('authenticated','public.concierge_checkin_head_v1()','execute'),'authenticated callable');
select ok(not has_function_privilege('anon','public.concierge_checkin_head_v1()','execute'),'anon denied');
select ok(not has_function_privilege('service_role','public.concierge_checkin_head_v1()','execute'),'service role denied');
select ok(not exists(select 1 from pg_proc p cross join lateral aclexplode(p.proacl) a where p.oid='public.concierge_checkin_head_v1()'::regprocedure and a.grantee=0 and a.privilege_type='EXECUTE'),'PUBLIC denied');
select ok(not has_function_privilege('authenticated','concierge.photo_head_client_guard_v1()','execute') and not has_function_privilege('anon','concierge.photo_head_client_guard_v1()','execute') and not has_function_privilege('service_role','concierge.photo_head_client_guard_v1()','execute'),'helper remains private');
select ok((select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='public.concierge_checkin_head_v1()'::regprocedure),'public function has empty search path');
select ok((select not prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='concierge.photo_head_client_guard_v1()'::regprocedure),'private helper has empty search path');
select ok(position('content_version_required' in pg_get_functiondef('public.concierge_checkin_read(uuid)'::regprocedure))>0,'M59 lossy clinical reader fence retained');

insert into auth.users(id,email,is_anonymous) values
 ('d1100000-0000-4000-8000-000000000001','photo-head-own@example.invalid',false),
 ('d1100000-0000-4000-8000-000000000002','photo-head-no-case@example.invalid',false),
 ('d1100000-0000-4000-8000-000000000003','photo-head-no-enrollment@example.invalid',false),
 ('d1100000-0000-4000-8000-000000000004','photo-head-other@example.invalid',false);
insert into public.profiles(id) select id from auth.users where id::text like 'd1100000-%' on conflict(id) do nothing;
insert into auth.sessions(id,user_id) select id,id from auth.users where id::text like 'd1100000-%';
insert into concierge.cases(client_id) values('d1100000-0000-4000-8000-000000000001'),('d1100000-0000-4000-8000-000000000003'),('d1100000-0000-4000-8000-000000000004');
insert into concierge.enrollments(client_id,display_name,status,phase) values
 ('d1100000-0000-4000-8000-000000000001','synthetic own','active','premeeting'),
 ('d1100000-0000-4000-8000-000000000002','synthetic absent case','active','premeeting'),
 ('d1100000-0000-4000-8000-000000000004','synthetic other','active','premeeting');
select set_config('request.jwt.claims','{}',true);
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_unauthorized','null owner cannot receive initial zero');
select set_config('request.jwt.claims','{"sub":"d1100000-0000-4000-8000-000000000002","session_id":"d1100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_forbidden','enrolled absent case cannot receive zero');
select set_config('request.jwt.claims','{"sub":"d1100000-0000-4000-8000-000000000003","session_id":"d1100000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_forbidden','unenrolled actual case cannot receive zero');
select set_config('request.jwt.claims','{"sub":"d1100000-0000-4000-8000-000000000001","session_id":"d1100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select is(public.concierge_checkin_head_v1(),'{"revision":0}'::jsonb,'existing enrolled initial case returns only initial revision');
select is((select count(*)::integer from concierge.checkin_heads where client_id='d1100000-0000-4000-8000-000000000001'),0,'initial read creates no head');
insert into concierge.checkin_heads(client_id,revision) values('d1100000-0000-4000-8000-000000000001',17),('d1100000-0000-4000-8000-000000000004',93);
insert into concierge.care_report_heads(client_id,revision) values('d1100000-0000-4000-8000-000000000001',77);
select is(public.concierge_checkin_head_v1(),'{"revision":17}'::jsonb,'actual own checkin head differs from other-client and Review heads');
select is((select revision from concierge.care_report_heads where client_id='d1100000-0000-4000-8000-000000000001'),77::bigint,'metadata read never advances Review');
select is((select revision from concierge.checkin_heads where client_id='d1100000-0000-4000-8000-000000000004'),93::bigint,'metadata read never changes other owner head');
select is((select count(*)::integer from concierge.workflow_requests where client_id='d1100000-0000-4000-8000-000000000001'),0,'metadata read creates no write receipt');
select is((select count(*)::integer from concierge.checkin_photos where client_id='d1100000-0000-4000-8000-000000000001'),0,'head alone creates no photo or inventory');

select set_config('request.jwt.claims','{"sub":"d1100000-0000-4000-8000-000000000001","session_id":"not-a-session","role":"authenticated"}',true);
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_session_ended','malformed provider session denied');
select set_config('request.jwt.claims','{"sub":"d1100000-0000-4000-8000-000000000001","session_id":"d1100000-0000-4000-8000-000000000004","role":"authenticated"}',true);
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_session_ended','foreign provider session denied');
select set_config('request.jwt.claims','{"sub":"d1100000-0000-4000-8000-000000000001","session_id":"d1100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id='d1100000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_session_ended','expired provider session denied');
update auth.sessions set not_after=null where id='d1100000-0000-4000-8000-000000000001';
update public.profiles set deletion_started_at=clock_timestamp() where id='d1100000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_forbidden','deletion pending denied');
update public.profiles set deletion_started_at=null where id='d1100000-0000-4000-8000-000000000001';
update auth.users set is_anonymous=true where id='d1100000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_forbidden','anonymous owner denied');
update auth.users set is_anonymous=false where id='d1100000-0000-4000-8000-000000000001';
update concierge.enrollments set status='revoked' where client_id='d1100000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_forbidden','enrollment revocation denied');
update concierge.enrollments set status='active' where client_id='d1100000-0000-4000-8000-000000000001';
insert into concierge.advisors(user_id,active) values('d1100000-0000-4000-8000-000000000001',true);
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_forbidden','view-disabled active advisor denied');
delete from concierge.advisors where user_id='d1100000-0000-4000-8000-000000000001';
insert into concierge.plan_principals(actor_id,kind,active) values('d1100000-0000-4000-8000-000000000001','agent',true);
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_forbidden','agent denied even with enrollment');
update concierge.plan_principals set active=false where actor_id='d1100000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_forbidden','inactive principal has no client bypass');
delete from concierge.plan_principals where actor_id='d1100000-0000-4000-8000-000000000001';
update concierge.plan_policy set activated=true,owner_actor_id='d1100000-0000-4000-8000-000000000004';
select is(public.concierge_checkin_head_v1(),'{"revision":17}'::jsonb,'premeeting metadata needs no fake service payment');
update concierge.enrollments set phase='ongoing' where client_id='d1100000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_head_v1()$$,'P0001','concierge_forbidden','ongoing expired care is not made active');
update concierge.enrollments set phase='premeeting',status='cancelled' where client_id='d1100000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_write('d1100000-0000-4000-8000-000000000001','reserve_photo',17,'d1100000-0000-4000-8000-000000000011','{"angle":"front","contentType":"image/png","sizeBytes":1,"sha256":"0000000000000000000000000000000000000000000000000000000000000000"}')$$,'P0001','concierge_forbidden','metadata adds no cancelled-client photo write permission');
select * from finish();
rollback;
