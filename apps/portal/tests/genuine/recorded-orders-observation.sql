-- M02 diagnostic oracle: SOURCE ONLY / SQL AND PARSER UNRUN.
-- Run only under a later exact Parent fixture/administrator READ grant, AFTER
-- Name acceptance and the separately authorized optional historical seed.
-- psql -X -qAt -v ON_ERROR_STOP=1; strict UUID variables come from the actual
-- descriptor. No role/JWT, authorizer, runtime, stored function or DDL changes.
-- Private full rows stay server-side: only counts + whole-row SHA-256 leave DB.
-- This output is an observation, never authenticated client authority.
\set ON_ERROR_STOP on
\if :{?actor_a_id}
\else
  \echo 'missing required Orders observation input'
  \quit 3
\endif
\if :{?actor_b_id}
\else
  \echo 'missing required Orders observation input'
  \quit 3
\endif
\if :{?a_purchase_id}
\else
  \echo 'missing required Orders observation input'
  \quit 3
\endif
\if :{?a_return_id}
\else
  \echo 'missing required Orders observation input'
  \quit 3
\endif
\if :{?a_event_id}
\else
  \echo 'missing required Orders observation input'
  \quit 3
\endif
\if :{?b_purchase_id}
\else
  \echo 'missing required Orders observation input'
  \quit 3
\endif
\if :{?b_return_id}
\else
  \echo 'missing required Orders observation input'
  \quit 3
\endif
\if :{?b_event_id}
\else
  \echo 'missing required Orders observation input'
  \quit 3
\endif
\if :{?phase}
\else
  \echo 'missing required Orders observation input'
  \quit 3
\endif

begin isolation level repeatable read read only;
set local time zone 'UTC';

-- Literal quoting and strict spelling validation precede UUID casts.
select current_setting('transaction_read_only')::boolean
 and current_setting('transaction_isolation')='repeatable read'
 and :'phase' in ('baseline','final')
 and :'actor_a_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
 and :'actor_b_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
 and :'a_purchase_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
 and :'a_return_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
 and :'a_event_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
 and :'b_purchase_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
 and :'b_return_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
 and :'b_event_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
 and (select count(distinct lower(v))=8 from unnest(array[:'actor_a_id',:'actor_b_id',:'a_purchase_id',:'a_return_id',:'a_event_id',:'b_purchase_id',:'b_return_id',:'b_event_id']) a(v)) as orders_inputs_ok \gset
\if :orders_inputs_ok
\else
  \echo 'invalid Orders observation inputs or read-only transaction'
  \quit 3
\endif

-- Refuse a missing/foreign ID or partial collection; never fall back to empty.
with inputs(label,client_id,purchase_id,return_id,event_id) as (values
 ('a',:'actor_a_id'::uuid,:'a_purchase_id'::uuid,:'a_return_id'::uuid,:'a_event_id'::uuid),
 ('b',:'actor_b_id'::uuid,:'b_purchase_id'::uuid,:'b_return_id'::uuid,:'b_event_id'::uuid))
select bool_and(
 (select count(*)=1 from concierge.retail_purchases p where p.client_id=i.client_id)
 and (select count(*)=1 from concierge.return_cases r where r.client_id=i.client_id)
 and (select count(*)=1 from concierge.return_events e where e.client_id=i.client_id)
 and (select count(*)=1 from concierge.service_heads h where h.client_id=i.client_id)
 and exists(select 1 from concierge.retail_purchases p where p.client_id=i.client_id and p.id=i.purchase_id)
 and exists(select 1 from concierge.return_cases r where r.client_id=i.client_id and r.id=i.return_id and r.purchase_id=i.purchase_id)
 and exists(select 1 from concierge.return_events e where e.client_id=i.client_id and e.id=i.event_id and e.return_id=i.return_id)
) as orders_records_ok from inputs i \gset
\if :orders_records_ok
\else
  \echo 'Orders descriptor records unavailable or collection incomplete'
  \quit 3
\endif

with inputs(label,client_id,purchase_id,return_id,event_id) as (values
 ('a',:'actor_a_id'::uuid,:'a_purchase_id'::uuid,:'a_return_id'::uuid,:'a_event_id'::uuid),
 ('b',:'actor_b_id'::uuid,:'b_purchase_id'::uuid,:'b_return_id'::uuid,:'b_event_id'::uuid)),
protected_inventory(relation_name) as (values
 ('concierge.retail_purchases'),
 ('concierge.return_cases'),
 ('concierge.return_events'),
 ('concierge.service_heads'),
 ('concierge.retail_purchase_private'),
 ('concierge.return_event_private'),
 ('concierge.service_review_private'),
 ('concierge.plan_draft_private'),
 ('concierge.review_private_notes'),
 ('concierge.payment_heads'),
 ('concierge.checkin_heads'),
 ('concierge.care_use_heads'),
 ('concierge.care_report_heads'),
 ('concierge.care_instruction_heads'),
 ('concierge.plan_decision_heads'),
 ('concierge.account_profile_heads_v1'),
 ('concierge.cases'),
 ('concierge.enrollments'),
 ('concierge.requests'),
 ('concierge.workflow_requests'),
 ('concierge.payment_v2_requests'),
 ('concierge.care_requests'),
 ('concierge.review_requests'),
 ('concierge.plan_requests'),
 ('concierge.notification_requests'),
 ('concierge.account_profile_requests_v1'),
 ('concierge.admission_intents')),
raw_rows(label,relation_name,row_data) as (
 select i.label,'concierge.retail_purchases',to_jsonb(t) from inputs i join concierge.retail_purchases t on t.client_id=i.client_id
 union all
 select i.label,'concierge.return_cases',to_jsonb(t) from inputs i join concierge.return_cases t on t.client_id=i.client_id
 union all
 select i.label,'concierge.return_events',to_jsonb(t) from inputs i join concierge.return_events t on t.client_id=i.client_id
 union all
 select i.label,'concierge.service_heads',to_jsonb(t) from inputs i join concierge.service_heads t on t.client_id=i.client_id
 union all
 select i.label,'concierge.retail_purchase_private',to_jsonb(t) from inputs i join concierge.retail_purchases p on p.client_id=i.client_id join concierge.retail_purchase_private t on t.purchase_id=p.id
 union all
 select i.label,'concierge.return_event_private',to_jsonb(t) from inputs i join concierge.return_events e on e.client_id=i.client_id join concierge.return_event_private t on t.event_id=e.id
 union all
 select i.label,'concierge.service_review_private',to_jsonb(t) from inputs i join concierge.service_reviews r on r.client_id=i.client_id join concierge.service_review_private t on t.review_id=r.id
 union all
 select i.label,'concierge.plan_draft_private',to_jsonb(t) from inputs i join concierge.plan_drafts d on d.client_id=i.client_id or d.origin_client_id=i.client_id join concierge.plan_draft_private t on t.draft_id=d.id
 union all
 select i.label,'concierge.review_private_notes',to_jsonb(t) from inputs i join concierge.review_private_notes t on t.client_id=i.client_id
 union all
 select i.label,'concierge.payment_heads',to_jsonb(t) from inputs i join concierge.payment_heads t on t.client_id=i.client_id
 union all
 select i.label,'concierge.checkin_heads',to_jsonb(t) from inputs i join concierge.checkin_heads t on t.client_id=i.client_id
 union all
 select i.label,'concierge.care_use_heads',to_jsonb(t) from inputs i join concierge.care_use_heads t on t.client_id=i.client_id
 union all
 select i.label,'concierge.care_report_heads',to_jsonb(t) from inputs i join concierge.care_report_heads t on t.client_id=i.client_id
 union all
 select i.label,'concierge.care_instruction_heads',to_jsonb(t) from inputs i join concierge.care_instruction_heads t on t.client_id=i.client_id
 union all
 select i.label,'concierge.plan_decision_heads',to_jsonb(t) from inputs i join concierge.plan_decision_heads t on t.client_id=i.client_id
 union all
 select i.label,'concierge.account_profile_heads_v1',to_jsonb(t) from inputs i join concierge.account_profile_heads_v1 t on t.client_id=i.client_id
 union all
 select i.label,'concierge.cases',to_jsonb(t) from inputs i join concierge.cases t on t.client_id=i.client_id
 union all
 select i.label,'concierge.enrollments',to_jsonb(t) from inputs i join concierge.enrollments t on t.client_id=i.client_id
 union all
 select i.label,'concierge.requests',to_jsonb(t) from inputs i join concierge.requests t on t.client_id=i.client_id or t.actor_id=i.client_id
 union all
 select i.label,'concierge.workflow_requests',to_jsonb(t) from inputs i join concierge.workflow_requests t on t.client_id=i.client_id or t.actor_id=i.client_id
 union all
 select i.label,'concierge.payment_v2_requests',to_jsonb(t) from inputs i join concierge.payment_v2_requests t on t.client_id=i.client_id or t.actor_id=i.client_id
 union all
 select i.label,'concierge.care_requests',to_jsonb(t) from inputs i join concierge.care_requests t on t.client_id=i.client_id or t.actor_id=i.client_id
 union all
 select i.label,'concierge.review_requests',to_jsonb(t) from inputs i join concierge.review_requests t on t.client_id=i.client_id or t.actor_id=i.client_id
 union all
 select i.label,'concierge.plan_requests',to_jsonb(t) from inputs i join concierge.plan_requests t on t.scope_client_id=i.client_id or t.actor_id=i.client_id or exists(select 1 from concierge.plan_drafts d where d.id=t.scope_draft_id and (d.client_id=i.client_id or d.origin_client_id=i.client_id))
 union all
 select i.label,'concierge.notification_requests',to_jsonb(t) from inputs i join concierge.notification_requests t on t.actor_id=i.client_id or exists(select 1 from concierge.plan_events e where e.id=t.event_id and e.client_id=i.client_id) or exists(select 1 from concierge.plan_deliveries d where d.id=t.delivery_id and d.recipient_id=i.client_id)
 union all
 select i.label,'concierge.account_profile_requests_v1',to_jsonb(t) from inputs i join concierge.account_profile_requests_v1 t on t.actor_id=i.client_id
 union all
 select i.label,'concierge.admission_intents',to_jsonb(t) from inputs i join concierge.admission_intents t on t.actor_id=i.client_id or t.target_id=i.client_id
),
-- Deterministic full-row ordering preserves duplicates and all private fields.
-- No actor/session/provider secrets or private body is exported from this CTE.
digests as (
 select i.label,c.relation_name,count(r.row_data) as row_count,
  encode(sha256(convert_to(coalesce(jsonb_agg(r.row_data order by r.row_data::text collate "C")
   filter(where r.row_data is not null),'[]'::jsonb)::text,'UTF8')),'hex') as row_sha256
 from inputs i cross join protected_inventory c
 left join raw_rows r on r.label=i.label and r.relation_name=c.relation_name
 group by i.label,c.relation_name
), actor_observations as (
 select i.label,jsonb_build_object('clientId',i.client_id,
  'recordIds',jsonb_build_object('purchaseId',i.purchase_id,'returnId',i.return_id,'eventId',i.event_id),
  'view',concierge.client_orders_projection_v1(i.client_id),
  'rows',jsonb_build_object(
   'purchases',(select jsonb_agg(row_data order by row_data::text collate "C") from raw_rows where label=i.label and relation_name='concierge.retail_purchases'),
   'returns',(select jsonb_agg(row_data order by row_data::text collate "C") from raw_rows where label=i.label and relation_name='concierge.return_cases'),
   'events',(select jsonb_agg(row_data order by row_data::text collate "C") from raw_rows where label=i.label and relation_name='concierge.return_events'),
   'serviceHeads',(select jsonb_agg(row_data order by row_data::text collate "C") from raw_rows where label=i.label and relation_name='concierge.service_heads')),
  'protected',(select jsonb_object_agg(relation_name,jsonb_build_object('count',row_count,'sha256',row_sha256)) from digests where label=i.label)) as observation
 from inputs i
)
select jsonb_build_object('schemaVersion',1,'kind','recorded-orders-db-observation',
 'phase',:'phase','observedAt',statement_timestamp(),
 'readOnly',current_setting('transaction_read_only')::boolean,
 'actors',(select jsonb_object_agg(label,observation) from actor_observations));
rollback;
