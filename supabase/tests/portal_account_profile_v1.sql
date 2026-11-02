-- AUTHORED UNRUN. SOURCE-only author allocation; no DB/Auth/resource grant.
-- These are actual-role SQL cases for a later isolated native grant, not proof
-- from finite HTTP. Multi-session row-lock schedules are specified at the end.
begin;
select no_plan();
select has_function('public','concierge_account_profile_command_v1',array['jsonb'],'one fixed own-account RPC');
select is((select proargnames from pg_proc where oid='public.concierge_account_profile_command_v1(jsonb)'::regprocedure),array['p_command']::text[],'no actor/client/session/URL selector');
select ok(has_function_privilege('authenticated','public.concierge_account_profile_command_v1(jsonb)','execute'),'exact authenticated RPC');
select ok(not has_function_privilege('anon','public.concierge_account_profile_command_v1(jsonb)','execute') and not has_function_privilege('service_role','public.concierge_account_profile_command_v1(jsonb)','execute'),'anon/service denied');
select ok(not exists(select 1 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where p.oid='public.concierge_account_profile_command_v1(jsonb)'::regprocedure and a.grantee=0 and a.privilege_type='EXECUTE'),'PUBLIC denied');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='concierge' and p.proname like 'account_profile_%' and (has_function_privilege('authenticated',p.oid,'execute') or has_function_privilege('anon',p.oid,'execute') or has_function_privilege('service_role',p.oid,'execute'))),0,'all private helper grants closed');
select ok(not has_table_privilege('authenticated','concierge.account_profile_requests_v1','select') and not has_table_privilege('service_role','concierge.account_profile_heads_v1','update'),'private head/journal inaccessible');
select is((select count(*)::integer from pg_attribute where attrelid='concierge.account_profile_requests_v1'::regclass and attnum>0 and not attisdropped),6,'journal has only actor/request/hash/revisions/time, no secondary name/email');
select is((select count(*)::integer from pg_class where oid in ('concierge.account_profile_heads_v1'::regclass,'concierge.account_profile_requests_v1'::regclass) and relrowsecurity),2,'both private relations enable RLS');

-- Same real migration helper, with exact retained source bytes. Run this file in
-- BOTH granted native lineages (six journals, and Source eight journals). The
-- opposite body must fail against the actual catalog, never silently drop Source.
create temporary table account_profile_collision_bodies as select $six$declare t text;exists_other boolean;begin
 perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||new.actor_id::text||':'||new.request_id::text,0));
 foreach t in array array['plan_requests','requests','workflow_requests','care_requests','review_requests','notification_requests'] loop
  if t=TG_TABLE_NAME then continue;end if;
  execute format('select exists(select 1 from concierge.%I where actor_id=$1 and request_id=$2)',t) into exists_other using new.actor_id,new.request_id;
  if exists_other then perform concierge.fail('request_conflict');end if;
 end loop;return new;
end $six$::text six;
alter table account_profile_collision_bodies add column eight text;
update account_profile_collision_bodies set eight=replace(six,'''notification_requests''] loop','''notification_requests'',''source_requests'',''source_account_requests''] loop');
select is((select encode(sha256(convert_to(six,'UTF8')),'hex') from account_profile_collision_bodies),'26afa4244895b19a260c379b57a0c2a4292cd18983fa90241b805b8d102cc7dc','six-table exact retained preimage');
select is((select encode(sha256(convert_to(eight,'UTF8')),'hex') from account_profile_collision_bodies),'d5aa3b2a59c9f2cdf6cd10f67fa3d4f4bb8642d4cec56013255e1f029c418180','Source-eight exact retained preimage');
select case when to_regclass('concierge.source_requests') is null and to_regclass('concierge.source_account_requests') is null then
 is((select concierge.account_profile_collision_successor_v1(six) from account_profile_collision_bodies),(select replace(six,'''notification_requests''] loop','''notification_requests'',''account_profile_requests_v1''] loop') from account_profile_collision_bodies),'six lineage appends only profile')
 else throws_ok($$select concierge.account_profile_collision_successor_v1(six) from account_profile_collision_bodies$$,'P0001','account_profile_collision_preimage_unsupported','six body cannot erase actual Source tables') end;
select case when to_regclass('concierge.source_requests') is not null and to_regclass('concierge.source_account_requests') is not null then
 is((select concierge.account_profile_collision_successor_v1(eight) from account_profile_collision_bodies),(select replace(eight,'''source_account_requests''] loop','''source_account_requests'',''account_profile_requests_v1''] loop') from account_profile_collision_bodies),'Source eight lineage appends only profile')
 else throws_ok($$select concierge.account_profile_collision_successor_v1(eight) from account_profile_collision_bodies$$,'P0001','account_profile_collision_preimage_unsupported','Source-eight body requires both actual tables') end;
select throws_ok($$select concierge.account_profile_collision_successor_v1('unexpected predecessor')$$,'P0001','account_profile_collision_preimage_unsupported','unknown/newer body fails safely');
select throws_ok($$select concierge.account_profile_collision_successor_v1(null)$$,'P0001','account_profile_collision_preimage_unsupported','missing predecessor fails safely');
select is((select concierge.account_profile_collision_successor_v1(case when to_regclass('concierge.source_requests') is null then six else eight end) from account_profile_collision_bodies),(select prosrc from pg_proc where oid='concierge.review_request_collision()'::regprocedure),'installed helper matches complete supported predecessor plus profile only');

insert into auth.users(id,email,is_anonymous,email_confirmed_at) values
 ('d1300000-0000-4000-8000-000000000001','profile-own@example.invalid',false,clock_timestamp()),
 ('d1300000-0000-4000-8000-000000000002','profile-other@example.invalid',false,null),
 ('d1300000-0000-4000-8000-000000000003','profile-no-enrollment@example.invalid',false,null);
insert into public.profiles(id) select id from auth.users where id::text like 'd1300000-%' on conflict(id) do nothing;
insert into auth.sessions(id,user_id) select id,id from auth.users where id::text like 'd1300000-%';
insert into concierge.cases(client_id) select id from auth.users where id::text like 'd1300000-%';
insert into concierge.enrollments(client_id,display_name,status,phase) values
 ('d1300000-0000-4000-8000-000000000001','  Synthetic Original  ','cancelled','ongoing'),
 ('d1300000-0000-4000-8000-000000000002','Synthetic Other','active','premeeting');

-- Nonempty independent frozen-order/address and exact-approval sentinels. These
-- are synthetic SQL fixture records only; no genuine funds/publication is asserted.
insert into concierge.shipping_addresses(client_id,version,address,confirmed_by) values
 ('d1300000-0000-4000-8000-000000000001',1,'{"recipient":"Synthetic Frozen Recipient","line1":"1 Synthetic Way"}','d1300000-0000-4000-8000-000000000002');
insert into concierge.quotes(id,client_id,version,publication_version,shipping_address_version,money,created_by) values
 ('d1310000-0000-4000-8000-000000000001','d1300000-0000-4000-8000-000000000001',1,0,1,'{"serviceCents":0,"productCents":1234,"recipient":"Synthetic Frozen Recipient"}','d1300000-0000-4000-8000-000000000002');
insert into concierge.claims(id,client_id,quote_id) values('d1350000-0000-4000-8000-000000000001','d1300000-0000-4000-8000-000000000001','d1310000-0000-4000-8000-000000000001');
insert into concierge.payment_confirmations(claim_id,quote_id,client_id,advisor_id,service_cents,product_cents,total_cents) values
 ('d1350000-0000-4000-8000-000000000001','d1310000-0000-4000-8000-000000000001','d1300000-0000-4000-8000-000000000001','d1300000-0000-4000-8000-000000000002',0,1234,1234);
insert into concierge.product_orders(quote_id,status) values('d1310000-0000-4000-8000-000000000001','ready_to_purchase');
insert into concierge.plan_drafts(id,client_id,created_by,basis,basis_manifest) values
 ('d1320000-0000-4000-8000-000000000001','d1300000-0000-4000-8000-000000000001','d1300000-0000-4000-8000-000000000002','{}','{}');
insert into concierge.plan_approvals(id,draft_id,target,publisher,scope,approved_by,policy_revision) values
 ('d1330000-0000-4000-8000-000000000001','d1320000-0000-4000-8000-000000000001','{"contentRevision":0,"syntheticExactHash":"unchanged"}','{"kind":"human"}','care_plan.publish','d1300000-0000-4000-8000-000000000002',0);
create temporary table account_profile_frozen_before as select
 (select to_jsonb(q) from concierge.quotes q where id='d1310000-0000-4000-8000-000000000001') quote,
 (select to_jsonb(a) from concierge.shipping_addresses a where client_id='d1300000-0000-4000-8000-000000000001') address,
 (select to_jsonb(a) from concierge.plan_approvals a where id='d1330000-0000-4000-8000-000000000001') approval,
 (select to_jsonb(o) from concierge.product_orders o where quote_id='d1310000-0000-4000-8000-000000000001') product_order,
 (select to_jsonb(p) from concierge.payment_confirmations p where claim_id='d1350000-0000-4000-8000-000000000001') payment,
 (select to_jsonb(c) from concierge.cases c where client_id='d1300000-0000-4000-8000-000000000001') care;

select set_config('request.jwt.claims','{"sub":"d1300000-0000-4000-8000-000000000001","session_id":"d1300000-0000-4000-8000-000000000001","role":"authenticated","exp":4102444800}',true);
set local role authenticated;
select is(public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}'),'{"schemaVersion":1,"profileRevision":0,"displayName":"  Synthetic Original  ","currentEmail":{"state":"known","address":"profile-own@example.invalid","verified":true}}'::jsonb,'ended/cancelled own account reads canonical identity with actual verified email');
select set_config('shelv.test.profile_receipt',public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"set_account_display_name_v1","requestId":"d1340000-0000-4000-8000-000000000001","expectedRevision":0,"displayName":"  Synthetic Élodie  "}')::text,true);
select is((current_setting('shelv.test.profile_receipt')::jsonb)->'revision','1'::jsonb,'actual changed name advances dedicated revision once');
select is(public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"set_account_display_name_v1","requestId":"d1340000-0000-4000-8000-000000000001","expectedRevision":0,"displayName":"  Synthetic Élodie  "}'),current_setting('shelv.test.profile_receipt')::jsonb,'same original UUID/payload returns same immutable receipt');
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"set_account_display_name_v1","requestId":"d1340000-0000-4000-8000-000000000001","expectedRevision":0,"displayName":"Synthetic Different"}')$$,'P0001','concierge_request_conflict','changed payload under original UUID denied');
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"set_account_display_name_v1","requestId":"d1340000-0000-4000-8000-000000000002","expectedRevision":0,"displayName":"Synthetic Stale"}')$$,'P0001','concierge_revision_conflict','second same-actor stale CAS cannot overwrite');
select is(public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"set_account_display_name_v1","requestId":"d1340000-0000-4000-8000-000000000003","expectedRevision":1.0,"displayName":"  Synthetic Élodie  "}')->'revision','1'::jsonb,'same exact canonical value is no fake revision; decimal integer wire is accepted');
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1","clientId":"d1300000-0000-4000-8000-000000000002"}')$$,'P0001','concierge_invalid_input','selected-client read rejected');
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"set_account_display_name_v1","requestId":"d1340000-0000-4000-8000-000000000004","expectedRevision":1,"displayName":"Synthetic","email":"other@example.invalid"}')$$,'P0001','concierge_invalid_input','email change is not an operation');
reset role;
update concierge.enrollments set display_name='Synthetic Legacy Writer' where client_id='d1300000-0000-4000-8000-000000000001';
select is((select revision from concierge.account_profile_heads_v1 where client_id='d1300000-0000-4000-8000-000000000001'),2::bigint,'another existing writer advances canonical-name revision');
update concierge.enrollments set display_name=display_name where client_id='d1300000-0000-4000-8000-000000000001';
select is((select revision from concierge.account_profile_heads_v1 where client_id='d1300000-0000-4000-8000-000000000001'),2::bigint,'same legacy value does not advance');
set local role authenticated;
select is(public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"set_account_display_name_v1","requestId":"d1340000-0000-4000-8000-000000000001","expectedRevision":0,"displayName":"  Synthetic Élodie  "}'),current_setting('shelv.test.profile_receipt')::jsonb,'old exact retry preserves historical original name after another writer');
select is(public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')->>'displayName','Synthetic Legacy Writer','current read is separate from historical acknowledgement');
select is(public.concierge_account_profile_command_v1(jsonb_build_object('schemaVersion',1,'action','set_account_display_name_v1','requestId','d1340000-0000-4000-8000-000000000005','expectedRevision',2,'displayName',repeat('𐐀',200)))->'revision','3'::jsonb,'full legacy200 Unicode domain accepted');
select throws_ok($$select public.concierge_account_profile_command_v1(jsonb_build_object('schemaVersion',1,'action','set_account_display_name_v1','requestId','d1340000-0000-4000-8000-000000000006','expectedRevision',3,'displayName',repeat('x',201)))$$,'P0001','concierge_invalid_input','201 rejected');
select throws_ok($$select public.concierge_account_profile_command_v1(jsonb_build_object('schemaVersion',1,'action','set_account_display_name_v1','requestId','d1340000-0000-4000-8000-000000000006','expectedRevision',3,'displayName',repeat(' ',8192)||'x'))$$,'P0001','concierge_too_large','command byte budget enforced before name write');
reset role;
select is((select to_jsonb(q) from concierge.quotes q where id='d1310000-0000-4000-8000-000000000001'),(select quote from account_profile_frozen_before),'frozen quote/recipient/money unchanged');
select is((select to_jsonb(a) from concierge.shipping_addresses a where client_id='d1300000-0000-4000-8000-000000000001'),(select address from account_profile_frozen_before),'frozen shipping address unchanged');
select is((select to_jsonb(a) from concierge.plan_approvals a where id='d1330000-0000-4000-8000-000000000001'),(select approval from account_profile_frozen_before),'exact content approval unchanged');
select is((select to_jsonb(o) from concierge.product_orders o where quote_id='d1310000-0000-4000-8000-000000000001'),(select product_order from account_profile_frozen_before),'existing product order unchanged');
select is((select to_jsonb(p) from concierge.payment_confirmations p where claim_id='d1350000-0000-4000-8000-000000000001'),(select payment from account_profile_frozen_before),'verified financial record unchanged');
select is((select to_jsonb(c) from concierge.cases c where client_id='d1300000-0000-4000-8000-000000000001'),(select care from account_profile_frozen_before),'care/publication revision unchanged');
select is((select display_name from concierge.enrollments where client_id='d1300000-0000-4000-8000-000000000002'),'Synthetic Other','other client untouched');

update auth.users set email_confirmed_at=null,email_change='pending-not-current@example.invalid' where id='d1300000-0000-4000-8000-000000000001';
select is(public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')->'currentEmail','{"state":"known","address":"profile-own@example.invalid","verified":false}'::jsonb,'only actual current email and confirmed-at matter, never pending/JWT email');
update auth.users set email=null where id='d1300000-0000-4000-8000-000000000001';
select is(public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')->'currentEmail','{"state":"unknown"}'::jsonb,'missing stored email is unknown');
update auth.users set email='profile-own@example.invalid' where id='d1300000-0000-4000-8000-000000000001';

-- Reentrant name-update trigger invalidates actual session inside the command.
-- Final authorization must reject and roll back both canonical edit and journal.
create function pg_temp.profile_reentrant_expire() returns trigger language plpgsql as $$begin
 update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id=new.client_id;return new;
end $$;
create trigger zz_profile_test_expire after update of display_name on concierge.enrollments for each row execute function pg_temp.profile_reentrant_expire();
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"set_account_display_name_v1","requestId":"d1340000-0000-4000-8000-000000000007","expectedRevision":3,"displayName":"Synthetic Reentrant"}')$$,'P0001','concierge_session_ended','actual reentrant expiry stops private ACK and rolls back edit');
select is((select revision from concierge.account_profile_heads_v1 where client_id='d1300000-0000-4000-8000-000000000001'),3::bigint,'expired command did not advance revision');
select is((select count(*)::integer from concierge.account_profile_requests_v1 where request_id='d1340000-0000-4000-8000-000000000007'),0,'expired command did not leave acknowledgement');
drop trigger zz_profile_test_expire on concierge.enrollments;

-- Cross-family UUID exclusion is bidirectional under the original actor UUID.
select throws_ok($$insert into concierge.workflow_requests(actor_id,request_id,client_id,fingerprint,result) values('d1300000-0000-4000-8000-000000000001','d1340000-0000-4000-8000-000000000001','d1300000-0000-4000-8000-000000000001',sha256('synthetic'::bytea),'{}')$$,'P0001','concierge_request_conflict','legacy family cannot reuse profile actor/UUID');
insert into concierge.workflow_requests(actor_id,request_id,client_id,fingerprint,result) values('d1300000-0000-4000-8000-000000000001','d1340000-0000-4000-8000-000000000010','d1300000-0000-4000-8000-000000000001',sha256('synthetic'::bytea),'{}');
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"set_account_display_name_v1","requestId":"d1340000-0000-4000-8000-000000000010","expectedRevision":3,"displayName":"Synthetic Collision"}')$$,'P0001','concierge_request_conflict','profile cannot reuse a legacy-family actor/UUID');
select is((select revision from concierge.account_profile_heads_v1 where client_id='d1300000-0000-4000-8000-000000000001'),3::bigint,'cross-family conflict rolls back name/revision');
select set_config('request.jwt.claims','{"sub":"d1300000-0000-4000-8000-000000000002","session_id":"d1300000-0000-4000-8000-000000000002","role":"authenticated","exp":4102444800}',true);
select is(public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"set_account_display_name_v1","requestId":"d1340000-0000-4000-8000-000000000001","expectedRevision":0,"displayName":"Synthetic Other Updated"}')->'revision','1'::jsonb,'another actual actor retains its independent UUID namespace');
select set_config('request.jwt.claims','{"sub":"d1300000-0000-4000-8000-000000000001","session_id":"d1300000-0000-4000-8000-000000000001","role":"authenticated","exp":4102444800}',true);

-- Authorization denial is checked even for an existing historical retry.
update auth.users set is_anonymous=true where id='d1300000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')$$,'P0001','concierge_forbidden','actual anonymous cannot use authenticated role');
update auth.users set is_anonymous=false,deleted_at=clock_timestamp() where id='d1300000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')$$,'P0001','concierge_forbidden','soft deletion denied');
update auth.users set deleted_at=null,banned_until=clock_timestamp()+interval '1 day' where id='d1300000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')$$,'P0001','concierge_forbidden','actual ban denied');
update auth.users set banned_until=null where id='d1300000-0000-4000-8000-000000000001';
update public.profiles set deletion_started_at=clock_timestamp() where id='d1300000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"set_account_display_name_v1","requestId":"d1340000-0000-4000-8000-000000000001","expectedRevision":0,"displayName":"  Synthetic Élodie  "}')$$,'P0001','concierge_forbidden','pending deletion also rejects historical receipt');
update public.profiles set deletion_started_at=null where id='d1300000-0000-4000-8000-000000000001';
insert into concierge.plan_principals(actor_id,kind,active) values('d1300000-0000-4000-8000-000000000001','agent',false);
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')$$,'P0001','concierge_forbidden','task principal denied even inactive');
delete from concierge.plan_principals where actor_id='d1300000-0000-4000-8000-000000000001';
insert into concierge.advisors(user_id,active) values('d1300000-0000-4000-8000-000000000001',true);
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')$$,'P0001','concierge_forbidden','advisor denied');
delete from concierge.advisors where user_id='d1300000-0000-4000-8000-000000000001';
update concierge.enrollments set status='revoked' where client_id='d1300000-0000-4000-8000-000000000001';
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')$$,'P0001','concierge_forbidden','revoked enrollment denied');
update concierge.enrollments set status='cancelled' where client_id='d1300000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"d1300000-0000-4000-8000-000000000001","session_id":"d1300000-0000-4000-8000-000000000002","role":"authenticated","exp":4102444800}',true);
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')$$,'P0001','concierge_session_ended','foreign actual provider session denied');
select set_config('request.jwt.claims','{"sub":"d1300000-0000-4000-8000-000000000003","session_id":"d1300000-0000-4000-8000-000000000003","role":"authenticated","exp":4102444800}',true);
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')$$,'P0001','concierge_forbidden','missing enrollment does not reveal existence');
select set_config('request.jwt.claims','{"sub":"d1300000-0000-4000-8000-000000000001","session_id":"d1300000-0000-4000-8000-000000000001","role":"authenticated","exp":1}',true);
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')$$,'P0001','concierge_session_ended','expired JWT denied');
select set_config('request.jwt.claims','{}',true);
select throws_ok($$select public.concierge_account_profile_command_v1('{"schemaVersion":1,"action":"read_account_profile_v1"}')$$,'P0001','concierge_unauthorized','no actor denied before existence');

-- Pure relational deletion proof in the rollback-only future fixture. This does
-- NOT invoke/clear account deletion or its Storage/obligation prerequisites.
delete from concierge.plan_drafts where id='d1320000-0000-4000-8000-000000000001';
delete from auth.users where id='d1300000-0000-4000-8000-000000000001';
select is((select count(*)::integer from concierge.account_profile_heads_v1 where client_id='d1300000-0000-4000-8000-000000000001'),0,'new head follows existing Auth/enrollment cascade');
select is((select count(*)::integer from concierge.account_profile_requests_v1 where actor_id='d1300000-0000-4000-8000-000000000001'),0,'minimal journal does not survive actual account cascade');
select * from finish();
rollback;

-- UNRUN multi-session native schedule, requiring a separate exact grant:
-- A: BEGIN; lock own enrollment FOR UPDATE. B/C: same own JWT and two different
-- request UUIDs/expectedRevision0 names. Both wait at enrollment (neither SHARE
-- upgrade); release A. Exactly one commits revision1, the other gets409. Repeat
-- B/C with same UUID/payload: one row and byte-identical historical receipt.
-- Repeat same UUID/different names: one success, one request_conflict. While A
-- holds the row, expire B JWT or revoke B auth.sessions before release: B denies
-- after its wait and neither name nor journal changes. A legacy UPDATE before B
-- acquires the row advances the trigger head; B's stale CAS denies. No dblink,
-- socket, sleep, reset, or actual DB execution was performed in author phase.
-- Contention case: A holds ONLY the original actor/request advisory lock (no
-- enrollment row); B invokes name write with that UUID. B must promptly return
-- concierge_unavailable (503), not wait/deadlock or claim request_conflict. After
-- A releases without committing a journal, exact B retry may succeed. Repeat with
-- A committing a foreign-family journal: B retry must then be request_conflict.
-- Metadata compatibility: separately replay each exact predecessor, preserving
-- full pg_proc row excluding prosrc and all old pg_trigger rows; mixed/partial
-- Source tables, unknown bodies or missing required tables must abort migration.
