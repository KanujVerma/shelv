-- M05 diagnostic oracle only. Never a client read path or a seed/migration.
-- Parent supplies issued A/B UUIDs and selection_json {"a":[...],"b":[...]}.
-- Every requested positive version is returned, including actual absence.
-- Run only against the separately approved owned fixture. This file grants nothing.
-- Parent: psql -X -A -t -v ON_ERROR_STOP=1 -v a_id=... -v b_id=...
--   -v selection_json=... -f apps/portal/tests/genuine/client-history-observation.sql
\set ON_ERROR_STOP on
begin transaction isolation level repeatable read read only;
set local time zone 'UTC';
with input as (
  select :'a_id'::uuid a, :'b_id'::uuid b, :'selection_json'::jsonb selection
), valid_input as (
  select * from input
  where a <> b and jsonb_typeof(selection) = 'object'
    and selection ?& array['a','b'] and selection - 'a' - 'b' = '{}'::jsonb
    and jsonb_typeof(selection->'a') = 'array'
    and jsonb_typeof(selection->'b') = 'array'
), requested as (
  select 'a'::text actor, a client_id, v::integer version
  from valid_input cross join lateral jsonb_array_elements_text(selection->'a') v
  union all
  select 'b'::text actor, b client_id, v::integer version
  from valid_input cross join lateral jsonb_array_elements_text(selection->'b') v
), bytes as (
  select q.actor, q.client_id, q.version, p.client_id is not null present,
    p.document_schema_version, r.id receipt_id, r.event_id,
    case when p.client_id is not null then
      jsonb_build_object('publication',to_jsonb(p),'document',to_jsonb(d))::text
    end snapshot_text,
    d.document::text document_text
  from requested q
  left join concierge.publications p
    on p.client_id=q.client_id and p.version=q.version
  left join concierge.plan_documents d
    on d.client_id=p.client_id and d.version=p.version
  left join concierge.plan_publication_receipts r
    on r.id=d.receipt_id and r.client_id=p.client_id and r.version=p.version
), rows as (
  select jsonb_agg(jsonb_build_object(
    'actor',actor,'clientId',client_id,'version',version,'present',present,
    'documentSchemaVersion',document_schema_version,
    'publicationReceiptId',receipt_id,'notificationEventId',event_id,
    'snapshotText',snapshot_text,
    'snapshotSha256',encode(sha256(convert_to(snapshot_text,'UTF8')),'hex'),
    'documentText',document_text,
    'documentSha256',encode(sha256(convert_to(document_text,'UTF8')),'hex')
  ) order by actor,version) value from bytes
)
select jsonb_build_object(
  'schemaVersion',1,'encoding','PostgreSQL jsonb::text / UTF-8',
  'actors',jsonb_build_object('a',a,'b',b),
  'heads',jsonb_build_object(
    'a',(select published_version from concierge.cases where client_id=a),
    'b',(select published_version from concierge.cases where client_id=b)),
  'rows',coalesce(rows.value,'[]'::jsonb)
) from valid_input cross join rows;
rollback;
