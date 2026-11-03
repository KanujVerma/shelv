-- M03 READ ONLY observation packet. The retained filename is not permission to
-- seed: M04's real authorized publication must create BOTH event and delivery.
-- Parent supplies psql quoted JSON variables descriptor, notification_scenario,
-- and capture_label, only after a concrete resource/custody grant. No defaults.
-- Never run against production, real clients or a prior/stopped fixture.
-- No inserts, producer calls, Auth settings, email claims, ACL or RLS changes.
\set ON_ERROR_STOP on
begin transaction isolation level repeatable read read only;
with
packet as (
  select :'descriptor'::jsonb as d, :'notification_scenario'::jsonb as s,
    :'capture_label'::text as label
),
targets as (
  select (v->>'clientId')::uuid client_id,
    (v->>'publicationVersion')::integer publication_version,
    (v->>'notificationEventId')::uuid event_id,
    (v->>'portalDeliveryId')::uuid delivery_id,
    (v->>'publicationReceiptId')::uuid receipt_id,
    (v->>'publishRequestId')::uuid publish_request_id
  from packet cross join lateral (values(s->'a'),(s->'b')) input(v)
),
target_rows as (
  select t.client_id, jsonb_build_object(
    'clientId',t.client_id,'publicationVersion',t.publication_version,
    'notificationEventId',t.event_id,'portalDeliveryId',t.delivery_id,
    'publicationReceiptId',t.receipt_id,'publishRequestId',t.publish_request_id,
    'publication',case when p.client_id is null then null else jsonb_build_object(
      'client_id',p.client_id,'version',p.version,'published_at',p.published_at) end,
    'entitled',exists(select 1 from concierge.entitled_publications ep
      where ep.client_id=t.client_id and ep.version=t.publication_version),
    'event',to_jsonb(e),'delivery',to_jsonb(dl),
    'publicationReceipt',case when r.id is null then null else jsonb_build_object(
      'id',r.id,'client_id',r.client_id,'version',r.version,'event_id',r.event_id,
      'request_id',r.request_id,'receipt',r.receipt) end,
    'publicationRequestMatches',exists(select 1 from concierge.plan_requests pr
      where pr.actor_id=r.actor_id and pr.request_id=t.publish_request_id
        and pr.scope_client_id=t.client_id
        and pr.command->>'action'='publish_plan_v1'
        and pr.command->>'requestId'=t.publish_request_id::text
        and pr.fingerprint=sha256(convert_to(pr.command::text,'UTF8'))
        and pr.result=r.receipt)
  ) as value
  from targets t
  left join concierge.publications p on p.client_id=t.client_id and p.version=t.publication_version
  left join concierge.plan_events e on e.id=t.event_id
  left join concierge.plan_deliveries dl on dl.id=t.delivery_id
  left join concierge.plan_publication_receipts r on r.id=t.receipt_id
),
protected_rows as (
  -- Full rows are digested server-side, so private plan/source/financial bytes
  -- do not leave SQL. All digests cover both clients, with stable JSON ordering.
  select 'cases' key,to_jsonb(x) value from concierge.cases x where client_id in(select client_id from targets)
  union all select 'publications',to_jsonb(x) from concierge.publications x where client_id in(select client_id from targets)
  union all select 'documents',to_jsonb(x) from concierge.plan_documents x where client_id in(select client_id from targets)
  union all select 'entitlements',to_jsonb(x) from concierge.entitled_publications x where client_id in(select client_id from targets)
  union all select 'servicePeriods',to_jsonb(x) from concierge.service_periods x where client_id in(select client_id from targets)
  union all select 'schedule',to_jsonb(x) from concierge.plan_review_schedule x where client_id in(select client_id from targets)
  union all select 'publicationReceipts',to_jsonb(x) from concierge.plan_publication_receipts x where client_id in(select client_id from targets)
  union all select 'planRequests',to_jsonb(x) from concierge.plan_requests x where scope_client_id in(select client_id from targets)
  union all select 'events',to_jsonb(x) from concierge.plan_events x where client_id in(select client_id from targets)
  union all select 'otherDeliveries',to_jsonb(x) from concierge.plan_deliveries x
    where event_id in(select e.id from concierge.plan_events e where e.client_id in(select client_id from targets))
      and id not in(select delivery_id from targets)
  union all select 'attempts',to_jsonb(x) from concierge.plan_delivery_attempts x
    where delivery_id in(select dl.id from concierge.plan_deliveries dl join concierge.plan_events e on e.id=dl.event_id where e.client_id in(select client_id from targets))
  union all select 'careHeads',jsonb_build_object('table','care_use_heads','row',to_jsonb(x)) from concierge.care_use_heads x where client_id in(select client_id from targets)
  union all select 'careHeads',jsonb_build_object('table','care_report_heads','row',to_jsonb(x)) from concierge.care_report_heads x where client_id in(select client_id from targets)
  union all select 'careHeads',jsonb_build_object('table','care_instruction_heads','row',to_jsonb(x)) from concierge.care_instruction_heads x where client_id in(select client_id from targets)
  union all select 'careHeads',jsonb_build_object('table','checkin_heads','row',to_jsonb(x)) from concierge.checkin_heads x where client_id in(select client_id from targets)
),
protected_digests as (
  select k,concierge.plan_hash(coalesce(jsonb_agg(p.value order by p.value::text) filter(where p.value is not null),'[]'::jsonb)) as digest
  from unnest(array['cases','publications','documents','entitlements','servicePeriods','schedule','publicationReceipts','planRequests','events','otherDeliveries','attempts','careHeads']) k
  left join protected_rows p on p.key=k group by k
),
journal as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'actor_id',nr.actor_id,'request_id',nr.request_id,'command',nr.command,
    'fingerprintMatches',nr.fingerprint=concierge.plan_hash(nr.command),
    'event_id',nr.event_id,'delivery_id',nr.delivery_id,'result',nr.result,
    'recorded_at',nr.recorded_at) order by nr.actor_id,nr.request_id),'[]'::jsonb) value
  from concierge.notification_requests nr where nr.actor_id in(select client_id from targets)
)
select jsonb_build_object(
  'label',packet.label,'binding',jsonb_build_object('ownerId',d->>'ownerId',
    'projectId',d->>'projectId','sourceCommit',d->>'sourceCommit'),
  'observedAt',concierge.care_instant(clock_timestamp()),
  'targets',(select coalesce(jsonb_agg(value order by client_id),'[]'::jsonb) from target_rows),
  'protectedState',(select jsonb_object_agg(k,digest) from protected_digests),
  'journal',journal.value
) as observation
from packet cross join journal;
rollback;
