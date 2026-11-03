-- OPTIONAL fresh-fixture ADMIN setup, after the independent Account bootstrap.
-- SOURCE ONLY / UNRUN until Parent grants the exact fixture and execution.
-- Historical synthetic bookkeeping, never a business purchase/return command.
-- Invoke psql with -X -qAt -v ON_ERROR_STOP=1, the captured NEW fixture DB,
-- and UUID-only -v actor_a_id=... -v actor_b_id=... -v owner_id=... .
-- These values come from the actual shared descriptor; no prior actor/fixture.
-- psql :'name' quotes literals safely. Never interpolate raw SQL or shell text.
\set ON_ERROR_STOP on
\if :{?actor_a_id}
\else
  \echo 'missing actor_a_id'
  \quit 3
\endif
\if :{?actor_b_id}
\else
  \echo 'missing actor_b_id'
  \quit 3
\endif
\if :{?owner_id}
\else
  \echo 'missing owner_id'
  \quit 3
\endif

begin;
-- Cast before any persistent write. Invalid IDs abort, with no data effects.
create temporary table orders_seed_inputs (
  label text primary key check(label in ('a','b')),
  client_id uuid not null unique,
  owner_id uuid not null,
  purchase_id uuid not null unique default gen_random_uuid(),
  return_id uuid not null unique default gen_random_uuid(),
  event_id uuid not null unique default gen_random_uuid(),
  marker text not null unique
) on commit preserve rows;
insert into orders_seed_inputs(label,client_id,owner_id,marker) values
 ('a',:'actor_a_id'::uuid,:'owner_id'::uuid,'ORDERS_'||replace(:'owner_id'::uuid::text,'-','')||'_A'),
 ('b',:'actor_b_id'::uuid,:'owner_id'::uuid,'ORDERS_'||replace(:'owner_id'::uuid::text,'-','')||'_B');

do $$
declare i record;
begin
 for i in select * from orders_seed_inputs order by client_id loop
  -- The provisioner already created these permanent synthetic actors through
  -- real Auth. Setup never creates sessions, grants rights or edits enrollment.
  if not exists(select 1 from auth.users u where u.id=i.client_id
    and u.is_anonymous=false and u.deleted_at is null
    and u.email like '%@%.invalid') then
   raise exception 'orders seed requires the actual permanent synthetic actor';
  end if;
  perform 1 from concierge.enrollments where client_id=i.client_id and status<>'revoked' for update;
  if not found or not exists(select 1 from concierge.cases where client_id=i.client_id) then
   raise exception 'orders seed requires existing own enrollment and case';
  end if;
  -- Same canonical namespace as the real read/writer. No auth/policy bypass.
  perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||i.client_id::text,0));
  if exists(select 1 from concierge.service_heads where client_id=i.client_id)
   or exists(select 1 from concierge.retail_purchases where client_id=i.client_id)
   or exists(select 1 from concierge.return_cases where client_id=i.client_id)
   or exists(select 1 from concierge.return_events where client_id=i.client_id) then
   raise exception 'orders seed refuses existing administration or repeat setup';
  end if;
 end loop;
end $$;

-- Both owners have real recorded rows and a canonical collection head. The
-- minimal client-orders RPC requires this head when records exist. No plan,
-- first payment, quote, entitlement, Start or delivery record is fabricated.
insert into concierge.service_heads(client_id,revision)
 select client_id,1 from orders_seed_inputs;
insert into concierge.retail_purchases(id,client_id,data,actor_id,recorded_at)
 select purchase_id,client_id,jsonb_build_object(
  'quoteId',null,'recommendationId',null,
  'retailer','retailer '||marker,'seller','seller '||marker,
  'productId','historical_'||label,'productName','historical synthetic purchase '||marker,
  'quantity',2,'unitPriceCents',1234,'taxCents',137,'shippingCents',289,
  'purchasedOn','2026-10-01','deliveredOn',null,
  'policy',jsonb_build_object('checkedOn','2026-10-01',
   'url','https://example.invalid/historical-terms','summary','saved conditions '||marker,
   'openedAllowed',null,'finalSale',false,'returnBy',null,'shipBy',null,'returnCostCents',415)),
  client_id,'2026-10-02T11:00:00Z'::timestamptz from orders_seed_inputs;
insert into concierge.return_cases(id,client_id,purchase_id,data,actor_id,requested_at)
 select return_id,client_id,purchase_id,jsonb_build_object(
  'quantity',1,'reason','historical request '||marker,'condition','opened'),
  client_id,'2026-10-03T11:00:00Z'::timestamptz from orders_seed_inputs;
insert into concierge.return_events(id,client_id,return_id,data,actor_id,recorded_at)
 select event_id,client_id,return_id,jsonb_build_object(
  'status','reviewing','note','historical review '||marker,
  'expectedRefundCents',null,'retailerRefundCents',null,'clientRepaidCents',null,'policyCheckedOn',null),
  client_id,'2026-10-04T11:00:00Z'::timestamptz from orders_seed_inputs;
commit;

-- Actual POST-COMMIT readback, not hand-authored expected-success data. Capture
-- this one JSON row verbatim as descriptor.ordersScenario. The private helper
-- is only an ADMIN diagnostic oracle; browser reads use the real public RPC.
select jsonb_build_object('schemaVersion',1)||jsonb_object_agg(label,
 jsonb_build_object('clientId',client_id,'purchaseId',purchase_id,
  'returnId',return_id,'eventId',event_id,'marker',marker,
  'view',concierge.client_orders_projection_v1(client_id))) from orders_seed_inputs;
drop table orders_seed_inputs;
