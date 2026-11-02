-- Canonical pgTAP source only. UNRUN: no database/resource grant in this author phase.
-- Concurrent advisory-wait, post-query revocation and real care-window races need
-- a separate granted native executor. Synthetic HTTP is not SQL/ACL acceptance.
begin;
select no_plan();
select has_function('public','concierge_checkin_photo_inventory_v1',array['uuid','integer','bigint'],'fixed own-client page RPC');
select is((select proargnames from pg_proc where oid='public.concierge_checkin_photo_inventory_v1(uuid,integer,bigint)'::regprocedure),array['p_cursor','p_limit','p_expected_revision']::text[],'no client selector or caller authority');
select ok(has_function_privilege('authenticated','public.concierge_checkin_photo_inventory_v1(uuid,integer,bigint)','execute'),'authenticated can invoke');
select ok(not has_function_privilege('anon','public.concierge_checkin_photo_inventory_v1(uuid,integer,bigint)','execute'),'anon denied');
select ok(not has_function_privilege('service_role','public.concierge_checkin_photo_inventory_v1(uuid,integer,bigint)','execute'),'service role denied');
select ok(not exists(select 1 from pg_proc p cross join lateral aclexplode(p.proacl) a where p.oid='public.concierge_checkin_photo_inventory_v1(uuid,integer,bigint)'::regprocedure and a.grantee=0 and a.privilege_type='EXECUTE'),'PUBLIC denied');
select ok((select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='public.concierge_checkin_photo_inventory_v1(uuid,integer,bigint)'::regprocedure),'wrapper has empty search path');
select ok(not has_function_privilege('authenticated','concierge.photo_head_client_guard_v1()','execute') and not has_function_privilege('anon','concierge.photo_head_client_guard_v1()','execute') and not has_function_privilege('service_role','concierge.photo_head_client_guard_v1()','execute'),'actual invoker guard stays private');
select ok((select not prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='concierge.photo_head_client_guard_v1()'::regprocedure),'guard remains invoker with explicit search path');
select ok(exists(select 1 from pg_indexes where schemaname='concierge' and indexname='checkin_photos_complete_client_id_v1' and indexdef like '%(client_id, id)%' and indexdef like '%WHERE%complete%'),'bounded own-complete keyset index');

insert into auth.users(id,email,is_anonymous) values
 ('d1200000-0000-4000-8000-000000000001','inventory-own@example.invalid',false),
 ('d1200000-0000-4000-8000-000000000002','inventory-other@example.invalid',false),
 ('d1200000-0000-4000-8000-000000000003','inventory-no-case@example.invalid',false),
 ('d1200000-0000-4000-8000-000000000004','inventory-no-enrollment@example.invalid',false);
insert into public.profiles(id) select id from auth.users where id::text like 'd1200000-%' on conflict(id) do nothing;
insert into auth.sessions(id,user_id) select id,id from auth.users where id::text like 'd1200000-%';
insert into concierge.cases(client_id) values('d1200000-0000-4000-8000-000000000001'),('d1200000-0000-4000-8000-000000000002'),('d1200000-0000-4000-8000-000000000004');
insert into concierge.enrollments(client_id,display_name,status,phase) values
 ('d1200000-0000-4000-8000-000000000001','synthetic own','active','premeeting'),
 ('d1200000-0000-4000-8000-000000000002','synthetic other','active','premeeting'),
 ('d1200000-0000-4000-8000-000000000003','synthetic absent case','active','premeeting');
select set_config('request.jwt.claims','{"sub":"d1200000-0000-4000-8000-000000000001","session_id":"d1200000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is(public.concierge_checkin_photo_inventory_v1(null,50,null),'{"revision":0,"photos":[],"nextCursor":null}'::jsonb,'actual enrolled initial case has terminal empty inventory');
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,null,null)$$,'P0001','concierge_invalid_input','null limit rejected');
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,0,null)$$,'P0001','concierge_invalid_input','zero limit rejected');
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,51,null)$$,'P0001','concierge_invalid_input','51 limit rejected');
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,-1)$$,'P0001','concierge_invalid_input','negative revision rejected');
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,9007199254740992)$$,'P0001','concierge_invalid_input','unsafe revision rejected');
select throws_ok($$select public.concierge_checkin_photo_inventory_v1('d1210000-0000-4000-8000-000000000001',1,null)$$,'P0001','concierge_invalid_input','later page requires snapshot');
reset role;
select is((select count(*)::integer from concierge.checkin_heads where client_id='d1200000-0000-4000-8000-000000000001'),0,'initial inventory creates no head');
insert into concierge.checkin_heads(client_id,revision) values('d1200000-0000-4000-8000-000000000001',17),('d1200000-0000-4000-8000-000000000002',93);
insert into concierge.care_report_heads(client_id,revision) values('d1200000-0000-4000-8000-000000000001',77);
insert into concierge.checkin_photos(id,client_id,reserved_by,reservation_revision,path,angle,content_type,size_bytes,sha256,state)
select ('d1210000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 'd1200000-0000-4000-8000-000000000001','d1200000-0000-4000-8000-000000000001',1,
 'd1200000-0000-4000-8000-000000000001/synthetic-'||n||'.png',
 case n%3 when 1 then 'front' when 2 then 'left' else 'right' end,'image/png',68,repeat('0',64),case n when 5 then 'pending' else 'complete' end
from generate_series(1,55) g(n);
insert into concierge.checkin_photos(id,client_id,reserved_by,reservation_revision,path,angle,content_type,size_bytes,sha256,state) values
 ('d1210000-0000-4000-8000-000000000000','d1200000-0000-4000-8000-000000000002','d1200000-0000-4000-8000-000000000002',1,'d1200000-0000-4000-8000-000000000002/other.png','front','image/png',68,repeat('0',64),'complete');
-- Real legacy associations and an appended amendment coexist with unattached rows.
-- No transient goal row without its authoritative sidecar/request/event is invented.
insert into concierge.checkin_reports(id,client_id,comfort,consistency,changes) values
 ('d1220000-0000-4000-8000-000000000001','d1200000-0000-4000-8000-000000000001','comfortable','same','');
insert into concierge.report_photos(photo_id,report_id) values('d1210000-0000-4000-8000-000000000001','d1220000-0000-4000-8000-000000000001');
insert into concierge.review_report_amendments(id,client_id,report_id,report_kind,previous_id,body,recorded_by,recorded_at) values
 ('d1220000-0000-4000-8000-000000000002','d1200000-0000-4000-8000-000000000001','d1220000-0000-4000-8000-000000000001','legacy_report',null,
  '{"comfort":"comfortable","consistency":"same","changes":"corrected","photoIds":["d1210000-0000-4000-8000-000000000002"]}',
  'd1200000-0000-4000-8000-000000000001',clock_timestamp());
insert into concierge.review_amendment_photos values('d1220000-0000-4000-8000-000000000002','d1210000-0000-4000-8000-000000000002');
update concierge.plan_policy set activated=true,owner_actor_id='d1200000-0000-4000-8000-000000000002';
set local role authenticated;
-- This fixture is preparation, not entitled active care. Do not forge coverage to
-- make the legacy clinical read pass its earlier care guard. Its exact M59 fence
-- is preserved below as source; entitled Goal/amendment409 is separately exercised
-- by closed HTTP and still needs a granted genuine-care composition.
select ok(position('content_version_required' in pg_get_functiondef('public.concierge_checkin_read(uuid)'::regprocedure))>0,'M59 lossy clinical reader fence retained');
select is(public.concierge_checkin_head_v1(),'{"revision":17}'::jsonb,'original head response is unchanged');
select is(public.concierge_checkin_photo_inventory_v1(null,2,null),'{"revision":17,"photos":[{"id":"d1210000-0000-4000-8000-000000000001","angle":"front"},{"id":"d1210000-0000-4000-8000-000000000002","angle":"left"}],"nextCursor":"d1210000-0000-4000-8000-000000000002"}'::jsonb,'all own completed metadata includes report and amendment attachments without bodies');
select is(public.concierge_checkin_photo_inventory_v1('d1210000-0000-4000-8000-000000000002',2,17),'{"revision":17,"photos":[{"id":"d1210000-0000-4000-8000-000000000003","angle":"right"},{"id":"d1210000-0000-4000-8000-000000000004","angle":"front"}],"nextCursor":"d1210000-0000-4000-8000-000000000004"}'::jsonb,'unattached completed rows are included in ascending ID order');
select is(public.concierge_checkin_photo_inventory_v1('d1210000-0000-4000-8000-000000000004',1,17)->'photos','[{"id":"d1210000-0000-4000-8000-000000000006","angle":"right"}]'::jsonb,'pending reservation is excluded');
select is(jsonb_array_length(public.concierge_checkin_photo_inventory_v1(null,50,17)->'photos'),50,'maximum page returns50 rather than51');
select is(public.concierge_checkin_photo_inventory_v1(null,50,17)->>'nextCursor','d1210000-0000-4000-8000-000000000051','lookahead next cursor is the last returned ID');
select is(public.concierge_checkin_photo_inventory_v1('d1210000-0000-4000-8000-000000000055',1,17),'{"revision":17,"photos":[],"nextCursor":null}'::jsonb,'only actual exhausted query returns terminal empty page');
select is(public.concierge_checkin_photo_inventory_v1('d1210000-0000-4000-8000-000000000054',1,17)->'nextCursor','null'::jsonb,'exactly full terminal page has null next cursor');
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,16)$$,'P0001','concierge_revision_conflict','first page can bind an expected head');
reset role;
update concierge.checkin_heads set revision=18 where client_id='d1200000-0000-4000-8000-000000000001';
set local role authenticated;
select throws_ok($$select public.concierge_checkin_photo_inventory_v1('d1210000-0000-4000-8000-000000000002',2,17)$$,'P0001','concierge_revision_conflict','changed head between pages rejects snapshot');
reset role;
select is((select revision from concierge.care_report_heads where client_id='d1200000-0000-4000-8000-000000000001'),77::bigint,'Review head is unrelated and unchanged');
select is((select revision from concierge.checkin_heads where client_id='d1200000-0000-4000-8000-000000000002'),93::bigint,'other owner head unchanged');
select is((select count(*)::integer from concierge.workflow_requests where client_id='d1200000-0000-4000-8000-000000000001'),0,'inventory has no write receipt');
select set_config('request.jwt.claims','{}',true);
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_unauthorized','missing owner denied');
select set_config('request.jwt.claims','{"sub":"d1200000-0000-4000-8000-000000000003","session_id":"d1200000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_forbidden','absent case never becomes empty inventory');
select set_config('request.jwt.claims','{"sub":"d1200000-0000-4000-8000-000000000004","session_id":"d1200000-0000-4000-8000-000000000004","role":"authenticated"}',true);
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_forbidden','unenrolled case never becomes empty inventory');
select set_config('request.jwt.claims','{"sub":"d1200000-0000-4000-8000-000000000001","session_id":"d1200000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_session_ended','foreign provider session denied');
select set_config('request.jwt.claims','{"sub":"d1200000-0000-4000-8000-000000000001","session_id":"d1200000-0000-4000-8000-000000000001","role":"authenticated"}',true);
update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id='d1200000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_session_ended','expired provider session denied');
update auth.sessions set not_after=null where id='d1200000-0000-4000-8000-000000000001';
update auth.users set banned_until=clock_timestamp()+interval '1 day' where id='d1200000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_forbidden','banned user denied');
update auth.users set banned_until=null,is_anonymous=true where id='d1200000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_forbidden','anonymous user denied');
update auth.users set is_anonymous=false,deleted_at=clock_timestamp() where id='d1200000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_forbidden','deleted user denied');
update auth.users set deleted_at=null where id='d1200000-0000-4000-8000-000000000001';
update public.profiles set deletion_started_at=clock_timestamp() where id='d1200000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_forbidden','pending profile deletion denied');
update public.profiles set deletion_started_at=null where id='d1200000-0000-4000-8000-000000000001';
update concierge.enrollments set status='revoked' where client_id='d1200000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_forbidden','revoked enrollment denied');
update concierge.enrollments set status='active' where client_id='d1200000-0000-4000-8000-000000000001';
insert into concierge.advisors(user_id,active) values('d1200000-0000-4000-8000-000000000001',true);
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_forbidden','active advisor denied even without view grant');
delete from concierge.advisors where user_id='d1200000-0000-4000-8000-000000000001';
insert into concierge.plan_principals(actor_id,kind,active) values('d1200000-0000-4000-8000-000000000001','agent',true);
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_forbidden','task principal denied');
update concierge.plan_principals set active=false where actor_id='d1200000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_forbidden','inactive principal cannot use client bypass');
delete from concierge.plan_principals where actor_id='d1200000-0000-4000-8000-000000000001';
update concierge.enrollments set phase='ongoing' where client_id='d1200000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_forbidden','expired ongoing care does not become preparation');
delete from auth.sessions where id='d1200000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_checkin_photo_inventory_v1(null,1,null)$$,'P0001','concierge_session_ended','revoked provider session denied');
select * from finish();
rollback;
