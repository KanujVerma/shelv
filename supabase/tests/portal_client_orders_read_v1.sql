-- AUTHORED UNRUN. Requires a separately authorized isolated native replay of all
-- canonical migrations through the new orders read migration. No grant here.
begin;
select no_plan();
select has_function('public','concierge_client_orders_read_v1',array['jsonb'],'one fixed own-orders read RPC');
select is((select proargnames from pg_proc where oid='public.concierge_client_orders_read_v1(jsonb)'::regprocedure),array['p_command']::text[],'no owner/client/role/currentness selector');
select ok(has_function_privilege('authenticated','public.concierge_client_orders_read_v1(jsonb)','execute'),'authenticated wrapper only');
select ok(not has_function_privilege('anon','public.concierge_client_orders_read_v1(jsonb)','execute') and not has_function_privilege('service_role','public.concierge_client_orders_read_v1(jsonb)','execute'),'anon/service_role denied');
select ok(not exists(select 1 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where p.oid='public.concierge_client_orders_read_v1(jsonb)'::regprocedure and a.grantee=0 and a.privilege_type='EXECUTE'),'PUBLIC has no execute');
select ok(not has_function_privilege('authenticated','concierge.client_orders_projection_v1(uuid)','execute') and not has_function_privilege('service_role','concierge.client_orders_projection_v1(uuid)','execute'),'private selector helper inaccessible');
select is((select proconfig from pg_proc where oid='public.concierge_client_orders_read_v1(jsonb)'::regprocedure),array['search_path=""']::text[],'definer search path empty');
select ok(not has_table_privilege('authenticated','concierge.retail_purchases','select') and not has_table_privilege('authenticated','concierge.return_cases','select') and not has_table_privilege('authenticated','concierge.return_events','select'),'raw table privileges unchanged');
select is((select count(*)::integer from pg_class where oid in ('concierge.retail_purchases'::regclass,'concierge.return_cases'::regclass,'concierge.return_events'::regclass,'concierge.service_heads'::regclass) and relrowsecurity),4,'existing private relations retain RLS');

-- Actual permanent Auth users, provider sessions, profiles, enrollments and
-- persistent purchase/return rows. These are synthetic records, not funds or
-- advice. No successful authorizer, care projection or currentness stub.
insert into auth.users(id,email,is_anonymous) values
 ('d1400000-0000-4000-8000-000000000001','orders-own@example.invalid',false),
 ('d1400000-0000-4000-8000-000000000002','orders-other@example.invalid',false),
 ('d1400000-0000-4000-8000-000000000003','orders-empty@example.invalid',false),
 ('d1400000-0000-4000-8000-000000000004','orders-unenrolled@example.invalid',false);
insert into public.profiles(id) select id from auth.users where id::text like 'd1400000-%' on conflict(id) do nothing;
insert into auth.sessions(id,user_id) select id,id from auth.users where id::text like 'd1400000-%';
insert into concierge.cases(client_id) select id from auth.users where id::text like 'd1400000-%';
insert into concierge.enrollments(client_id,display_name,status,phase) values
 ('d1400000-0000-4000-8000-000000000001','Synthetic Own','cancelled','ongoing'),
 ('d1400000-0000-4000-8000-000000000002','Synthetic Other','active','premeeting'),
 ('d1400000-0000-4000-8000-000000000003','Synthetic Empty','active','premeeting');
insert into concierge.service_heads values('d1400000-0000-4000-8000-000000000001',17);
insert into concierge.retail_purchases(id,client_id,data,actor_id,recorded_at) values
 ('d1410000-0000-4000-8000-000000000001','d1400000-0000-4000-8000-000000000001',
  '{"quoteId":null,"recommendationId":null,"retailer":"Recorded Retailer","seller":"Recorded Seller","productId":"recorded_product","productName":"Exact Recorded Product","quantity":2,"unitPriceCents":1200,"taxCents":192,"shippingCents":300,"purchasedOn":"2026-10-01","deliveredOn":null,"policy":{"checkedOn":"2026-10-01","url":"https://example.com/recorded-synthetic-terms","summary":"Recorded item-specific policy","openedAllowed":null,"finalSale":false,"returnBy":null,"shipBy":null,"returnCostCents":400}}',
  'd1400000-0000-4000-8000-000000000002','2026-10-02T11:00:00Z'),
 ('d1410000-0000-4000-8000-000000000002','d1400000-0000-4000-8000-000000000002',
  '{"quoteId":null,"recommendationId":null,"retailer":"Other Retailer","seller":"Other Seller","productId":"other_product","productName":"OTHER_CLIENT_CANARY","quantity":1,"unitPriceCents":500,"taxCents":0,"shippingCents":0,"purchasedOn":"2026-10-01","deliveredOn":"2026-10-02","policy":{"checkedOn":"2026-10-01","url":"https://example.com/other-synthetic-terms","summary":"Other recorded policy","openedAllowed":true,"finalSale":false,"returnBy":null,"shipBy":null,"returnCostCents":0}}',
  'd1400000-0000-4000-8000-000000000002','2026-10-02T11:00:00Z');
insert into concierge.retail_purchase_private values('d1410000-0000-4000-8000-000000000001','PRIVATE_ORDER_CANARY','PRIVATE_RECEIPT_CANARY');
insert into concierge.return_cases(id,client_id,purchase_id,data,actor_id,requested_at) values
 ('d1420000-0000-4000-8000-000000000001','d1400000-0000-4000-8000-000000000001','d1410000-0000-4000-8000-000000000001',
  '{"quantity":1,"reason":"Recorded client request","condition":"opened"}','d1400000-0000-4000-8000-000000000001','2026-10-02T12:00:00Z');
insert into concierge.return_events(id,client_id,return_id,data,actor_id,recorded_at) values
 ('d1430000-0000-4000-8000-000000000001','d1400000-0000-4000-8000-000000000001','d1420000-0000-4000-8000-000000000001',
  '{"status":"reviewing","note":"First recorded event","expectedRefundCents":null,"retailerRefundCents":null,"clientRepaidCents":null,"policyCheckedOn":null}',
  'd1400000-0000-4000-8000-000000000002','2026-10-03T11:00:00Z'),
 ('d1430000-0000-4000-8000-000000000002','d1400000-0000-4000-8000-000000000001','d1420000-0000-4000-8000-000000000001',
  '{"status":"declined","note":"Second sequence, earlier recording clock","expectedRefundCents":null,"retailerRefundCents":null,"clientRepaidCents":null,"policyCheckedOn":null}',
  'd1400000-0000-4000-8000-000000000002','2026-10-03T10:00:00Z');
insert into concierge.return_event_private values('d1430000-0000-4000-8000-000000000001','PRIVATE_RETURN_CANARY');
-- Actual legacy public mapping oracle, used only by this SQL test. Production
-- never calls the full care projection or fabricates empty care fields.
select set_config('shelv.test.orders_expected',jsonb_build_object('schemaVersion',1,'revision',v->'revision','purchases',v->'purchases','returns',v->'returns')::text,true)
 from (select concierge.service_projection_data('d1400000-0000-4000-8000-000000000001',false) v) x;
create temporary table orders_read_before as select
 (select jsonb_agg(to_jsonb(p) order by p.id) from concierge.retail_purchases p) purchases,
 (select jsonb_agg(to_jsonb(r) order by r.id) from concierge.return_cases r) returns,
 (select jsonb_agg(to_jsonb(e) order by e.sequence) from concierge.return_events e) events,
 (select jsonb_agg(to_jsonb(h) order by h.client_id) from concierge.service_heads h) heads,
 (select count(*) from concierge.workflow_requests) workflow_count,
 (select count(*) from concierge.account_profile_heads_v1) profile_head_count;
select set_config('request.jwt.claims','{"sub":"d1400000-0000-4000-8000-000000000001","session_id":"d1400000-0000-4000-8000-000000000001","role":"authenticated","exp":4102444800}',true);
set local role authenticated;
select is(public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}'),current_setting('shelv.test.orders_expected')::jsonb,'cancelled expired-care own administration equals complete canonical recorded facts');
select is(public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')->'returns'->0->>'status','declined','status follows canonical latest sequence');
select is(public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')->'returns'->0->'events'->0->>'note','First recorded event','event sequence order, not guessed timestamp order');
select ok(public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')::text !~ 'PRIVATE_|OTHER_CLIENT_CANARY|reviews|instructions|originalStartedOn|tracking','no private/foreign/care/tracking/Start facts');
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1","purchaseId":"d1410000-0000-4000-8000-000000000002"}')$$,'P0001','concierge_invalid_input','foreign purchase ID cannot select any record');
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1","clientId":"d1400000-0000-4000-8000-000000000002"}')$$,'P0001','concierge_invalid_input','client UUID forbidden');
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1","current":true}')$$,'P0001','concierge_invalid_input','currentness flags forbidden');
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"request_return"}')$$,'P0001','concierge_invalid_input','read packet cannot request a return or refund');
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":2,"action":"read_client_orders_v1"}')$$,'P0001','concierge_invalid_input','unknown version refused');
select throws_ok($$select public.concierge_client_orders_read_v1(jsonb_build_object('schemaVersion',1,'action','read_client_orders_v1','padding',repeat('x',8192)))$$,'P0001','concierge_too_large','finite command body');
reset role;
select is((select jsonb_agg(to_jsonb(p) order by p.id) from concierge.retail_purchases p),(select purchases from orders_read_before),'read cannot mutate purchase history');
select is((select jsonb_agg(to_jsonb(r) order by r.id) from concierge.return_cases r),(select returns from orders_read_before),'read cannot mutate return cases');
select is((select jsonb_agg(to_jsonb(e) order by e.sequence) from concierge.return_events e),(select events from orders_read_before),'read cannot mutate events');
select is((select jsonb_agg(to_jsonb(h) order by h.client_id) from concierge.service_heads h),(select heads from orders_read_before),'read cannot create or change global heads');
select is((select count(*) from concierge.workflow_requests),(select workflow_count from orders_read_before),'read has no mutation journal');
select is((select count(*) from concierge.account_profile_heads_v1),(select profile_head_count from orders_read_before),'identity helper does not initialize profile mutation state');
delete from concierge.service_heads where client_id='d1400000-0000-4000-8000-000000000001';
set local role authenticated;
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')$$,'P0001','concierge_unavailable','records without an authoritative head are not a successful revision-zero view');
reset role;
insert into concierge.service_heads values('d1400000-0000-4000-8000-000000000001',17);
update concierge.service_heads set revision=18 where client_id='d1400000-0000-4000-8000-000000000001';
set local role authenticated;
select is(public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')->'revision','18'::jsonb,'revision is global service head, including unrelated service advance');
reset role;

-- Complete empty is an authorized successful collection, not an error fallback.
select set_config('request.jwt.claims','{"sub":"d1400000-0000-4000-8000-000000000003","session_id":"d1400000-0000-4000-8000-000000000003","role":"authenticated","exp":4102444800}',true);
set local role authenticated;
select is(public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}'),'{"schemaVersion":1,"revision":0,"purchases":[],"returns":[]}'::jsonb,'prepublication empty own collection, no payment required');
reset role;
select ok(not exists(select 1 from concierge.service_heads where client_id='d1400000-0000-4000-8000-000000000003'),'empty read does not initialize a service head');
select set_config('request.jwt.claims','{"sub":"d1400000-0000-4000-8000-000000000004","session_id":"d1400000-0000-4000-8000-000000000004","role":"authenticated","exp":4102444800}',true);
set local role authenticated;
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')$$,'P0001','concierge_forbidden','permanent Auth alone is not enrollment');
reset role;
select set_config('request.jwt.claims','{"sub":"d1400000-0000-4000-8000-000000000001","session_id":"d1400000-0000-4000-8000-000000000001","role":"authenticated","exp":4102444800}',true);
update concierge.enrollments set status='revoked' where client_id='d1400000-0000-4000-8000-000000000001';
set local role authenticated;
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')$$,'P0001','concierge_forbidden','revoked enrollment denied');
reset role;
update concierge.enrollments set status='cancelled' where client_id='d1400000-0000-4000-8000-000000000001';
update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id='d1400000-0000-4000-8000-000000000001';
set local role authenticated;
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')$$,'P0001','concierge_session_ended','actual expired provider session denied');
reset role;
update auth.sessions set not_after=null where id='d1400000-0000-4000-8000-000000000001';
update public.profiles set deletion_started_at=clock_timestamp() where id='d1400000-0000-4000-8000-000000000001';
set local role authenticated;
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')$$,'P0001','concierge_forbidden','actual deletion fence denied');
reset role;
update public.profiles set deletion_started_at=null where id='d1400000-0000-4000-8000-000000000001';
insert into concierge.advisors(user_id,active) values('d1400000-0000-4000-8000-000000000001',true);
set local role authenticated;
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')$$,'P0001','concierge_forbidden','active view-disabled advisor is not ordinary client persona');
reset role;
delete from concierge.advisors where user_id='d1400000-0000-4000-8000-000000000001';
insert into concierge.plan_principals(actor_id,kind,active) values('d1400000-0000-4000-8000-000000000001','agent',false);
set local role authenticated;
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')$$,'P0001','concierge_forbidden','even inactive plan-principal cannot impersonate own client');
reset role;
delete from concierge.plan_principals where actor_id='d1400000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"d1400000-0000-4000-8000-000000000001","session_id":"d1400000-0000-4000-8000-000000000002","role":"authenticated","exp":4102444800}',true);
set local role authenticated;
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')$$,'P0001','concierge_session_ended','another user session cannot supply own authority');
reset role;
select set_config('request.jwt.claims','{"sub":"d1400000-0000-4000-8000-000000000001","session_id":"d1400000-0000-4000-8000-000000000001","role":"authenticated","exp":0}',true);
set local role authenticated;
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')$$,'P0001','concierge_session_ended','expired JWT denied independently of actual session');
reset role;

-- First packet refuses a complete large history, without LIMIT or truncation.
insert into concierge.retail_purchases(id,client_id,data,actor_id)
 select gen_random_uuid(),'d1400000-0000-4000-8000-000000000001',p.data,p.actor_id
 from concierge.retail_purchases p cross join generate_series(1,4000) n where p.id='d1410000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"d1400000-0000-4000-8000-000000000001","session_id":"d1400000-0000-4000-8000-000000000001","role":"authenticated","exp":4102444800}',true);
set local role authenticated;
select throws_ok($$select public.concierge_client_orders_read_v1('{"schemaVersion":1,"action":"read_client_orders_v1"}')$$,'P0001','concierge_unavailable','oversized full history refuses, never successful partial/empty');
reset role;
select * from finish();
rollback;

-- Required later native schedules, all UNRUN: hold canonical enrollment, then
-- let own read wait; commit revocation/deletion/session expiry before release;
-- read must deny. Hold client advisory context or global service head and expire
-- the actual session/JWT during the wait; every resumed path must reauthorize.
-- Race legacy service writer (including first head creation) against this read;
-- result is one complete serialized head/collection or safe refusal, no partial.
-- Repeat with actual published review/instruction contexts and active/read_only/
-- expired care: preserve legacy content_version_required while orders remain own
-- administration. This file's prepublication/cancelled fixtures do not certify
-- that full published-care matrix or concurrent waits. No helper is stubbed.
