-- SOURCE ONLY. Parent executes only after independent source/resource review.
-- Parameters: a_id,b_id,selection_json (original Root M05 shape),probe_id,label.
-- This canonical fragment supplies NO cookie/CSRF/Auth linkage. requestLinks=[]
-- deliberately refuses runtime proof until Parent's actual native request/session
-- receipts are attached by captureCanonical as raw JSON TEXT. Never echo supplied
-- digests or a permission flag as a server authentication observation.
\set ON_ERROR_STOP on
begin transaction isolation level repeatable read read only;
set local time zone 'UTC';
with input as (
 select :'a_id'::uuid a,:'b_id'::uuid b,:'selection_json'::jsonb selection,
        :'probe_id'::uuid probe,:'label'::text label
), valid as (
 select * from input where a<>b and label in ('baseline','retired','released','cleaned')
 and jsonb_typeof(selection)='object' and selection ?& array['a','b']
 and selection-'a'-'b'='{}'::jsonb
 and jsonb_typeof(selection->'a')='array' and jsonb_typeof(selection->'b')='array'
), requested as (
 select 'a'::text actor,a client_id,v::integer version from valid cross join lateral jsonb_array_elements_text(selection->'a') v
 union all
 select 'b'::text actor,b client_id,v::integer version from valid cross join lateral jsonb_array_elements_text(selection->'b') v
), bytes as (
 select q.actor,q.client_id,q.version,p.client_id is not null present,
 p.document_schema_version,r.id receipt_id,r.event_id,
 case when p.client_id is not null then jsonb_build_object('publication',to_jsonb(p),'document',to_jsonb(d))::text end snapshot_text,
 d.document::text document_text
 from requested q
 left join concierge.publications p on p.client_id=q.client_id and p.version=q.version
 left join concierge.plan_documents d on d.client_id=p.client_id and d.version=p.version
 left join concierge.plan_publication_receipts r on r.id=d.receipt_id and r.client_id=p.client_id and r.version=p.version
), history_rows as (
 select coalesce(jsonb_agg(jsonb_build_object(
 'actor',actor,'clientId',client_id,'version',version,'present',present,
 'documentSchemaVersion',document_schema_version,'publicationReceiptId',receipt_id,'notificationEventId',event_id,
 'snapshotText',snapshot_text,'snapshotSha256',encode(sha256(convert_to(snapshot_text,'UTF8')),'hex'),
 'documentText',document_text,'documentSha256',encode(sha256(convert_to(document_text,'UTF8')),'hex')
 ) order by actor,version),'[]'::jsonb) rows from bytes
), domain_rows as (
 select 'cases' name,coalesce(jsonb_agg(to_jsonb(t) order by t.client_id),'[]'::jsonb) rows from concierge.cases t,valid where t.client_id in(a,b)
 union all select 'publications',coalesce(jsonb_agg(to_jsonb(t) order by t.client_id,t.version),'[]'::jsonb) from concierge.publications t,valid where t.client_id in(a,b)
 union all select 'planDocuments',coalesce(jsonb_agg(to_jsonb(t) order by t.client_id,t.version),'[]'::jsonb) from concierge.plan_documents t,valid where t.client_id in(a,b)
 union all select 'publicationReceipts',coalesce(jsonb_agg(to_jsonb(t) order by t.client_id,t.version),'[]'::jsonb) from concierge.plan_publication_receipts t,valid where t.client_id in(a,b)
 union all select 'planEvents',coalesce(jsonb_agg(to_jsonb(t) order by t.client_id,t.id),'[]'::jsonb) from concierge.plan_events t,valid where t.client_id in(a,b)
 union all select 'entitlements',coalesce(jsonb_agg(to_jsonb(t) order by t.client_id,t.version),'[]'::jsonb) from concierge.entitled_publications t,valid where t.client_id in(a,b)
 union all select 'planRequests',coalesce(jsonb_agg(to_jsonb(t) order by t.actor_id,t.request_id),'[]'::jsonb) from concierge.plan_requests t,valid where t.scope_client_id in(a,b) or t.actor_id in(a,b)
 union all select 'reviewRequests',coalesce(jsonb_agg(to_jsonb(t) order by t.actor_id,t.request_id),'[]'::jsonb) from concierge.review_requests t,valid where t.client_id in(a,b)
 union all select 'legacyRequests',coalesce(jsonb_agg(to_jsonb(t) order by t.actor_id,t.request_id),'[]'::jsonb) from concierge.requests t,valid where t.client_id in(a,b)
 union all select 'careRequests',coalesce(jsonb_agg(to_jsonb(t) order by t.actor_id,t.request_id),'[]'::jsonb) from concierge.care_requests t,valid where t.client_id in(a,b)
 union all select 'careEvents',coalesce(jsonb_agg(to_jsonb(t) order by t.client_id,t.id),'[]'::jsonb) from concierge.care_events t,valid where t.client_id in(a,b)
), domain_hash as (
 -- Full private source/journal rows never leave this server-side CTE.
 select jsonb_object_agg(name,jsonb_array_length(rows) order by name) counts,
 encode(sha256(convert_to(jsonb_object_agg(name,rows order by name)::text,'UTF8')),'hex') sha256 from domain_rows
), sessions as (
 select coalesce(jsonb_agg(jsonb_build_object('actor',case when s.user_id=a then 'a' else 'b' end,
 'userId',s.user_id,'sessionId',s.id,'notAfter',s.not_after) order by s.user_id,s.id),'[]'::jsonb) rows
 from auth.sessions s,valid where s.user_id in(a,b)
), probe_rows as (
 select request_id from concierge.plan_requests,valid where request_id=probe and (scope_client_id in(a,b) or actor_id in(a,b))
 union all select request_id from concierge.review_requests,valid where request_id=probe and client_id in(a,b)
 union all select request_id from concierge.requests,valid where request_id=probe and client_id in(a,b)
 union all select request_id from concierge.care_requests,valid where request_id=probe and client_id in(a,b)
)
select jsonb_build_object('schemaVersion',1,'label',label,'actors',jsonb_build_object('a',a,'b',b),
 'history',jsonb_build_object('schemaVersion',1,'encoding','PostgreSQL jsonb::text / UTF-8',
 'actors',jsonb_build_object('a',a,'b',b),'heads',jsonb_build_object(
 'a',(select published_version from concierge.cases where client_id=a),
 'b',(select published_version from concierge.cases where client_id=b)),'rows',history_rows.rows),
 'noEffects',jsonb_build_object('encoding','PostgreSQL jsonb::text / UTF-8','counts',domain_hash.counts,'sha256',domain_hash.sha256),
 'authSessions',sessions.rows,'probeRequests',jsonb_build_array(jsonb_build_object('requestId',probe,'count',(select count(*) from probe_rows))),
 'requestLinks','[]'::jsonb)
from valid cross join history_rows cross join domain_hash cross join sessions;
rollback;
