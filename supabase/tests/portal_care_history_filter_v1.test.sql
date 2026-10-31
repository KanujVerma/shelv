begin;
select plan(24);

-- Transaction-local helper fixtures only; not genuine Auth/HTTP acceptance.
-- Literal expected labels are independent of the production match predicate.
create temporary table hf_refs(name text primary key, ref jsonb);
insert into hf_refs values
 ('p1', '{"kind":"plan_product","publication":{"version":1,"documentSchemaVersion":3},"productId":"p1","slotId":null}'),
 ('p1a', '{"kind":"plan_product","publication":{"version":1,"documentSchemaVersion":3},"productId":"p1","slotId":"a"}'),
 ('p1b', '{"kind":"plan_product","publication":{"version":1,"documentSchemaVersion":3},"productId":"p1","slotId":"b"}'),
 ('p2pub', '{"kind":"plan_product","publication":{"version":2,"documentSchemaVersion":3},"productId":"p1","slotId":"a"}'),
 ('wrong_schema', '{"kind":"plan_product","publication":{"version":1,"documentSchemaVersion":2},"productId":"p1","slotId":null}'),
 ('other_plan', '{"kind":"plan_product","publication":{"version":1,"documentSchemaVersion":3},"productId":"other","slotId":null}'),
 ('r1', '{"kind":"client_reported_product","reportedProductId":"20000000-0000-4000-8000-000000000001","version":1}'),
 ('r2', '{"kind":"client_reported_product","reportedProductId":"20000000-0000-4000-8000-000000000001","version":2}'),
 ('other', '{"kind":"client_reported_product","reportedProductId":"20000000-0000-4000-8000-000000000002","version":1}'),
 ('nested', '{"kind":"client_reported_product","reportedProductId":"20000000-0000-4000-8000-000000000003","version":1}'),
 ('absent', '{"kind":"client_reported_product","reportedProductId":"20000000-0000-4000-8000-000000000004","version":1}');
create function pg_temp.hf_ref(n text) returns jsonb language sql as $$select ref from hf_refs where name=n$$;
create temporary table hf_clients(name text primary key,id uuid default gen_random_uuid());
insert into hf_clients(name) values ('owner'),('other');
insert into auth.users(id,email) select id,'cn1-'||id::text||'@synthetic.invalid' from hf_clients;
insert into concierge.cases(client_id) select id from hf_clients;
create temporary table hf_events(label text primary key,id uuid default gen_random_uuid(),revision bigint,kind text,product jsonb,client_id uuid,payload jsonb);
insert into hf_events(label,revision,kind,product) values
 ('unrelated-use',1,'use',pg_temp.hf_ref('other_plan')),
 ('unrelated-correction',2,'reported_product',pg_temp.hf_ref('other')),
 ('selected-creation',3,'reported_product',pg_temp.hf_ref('r1')),
 ('selected-use',4,'use',pg_temp.hf_ref('r1')),
 ('selected-v2',5,'reported_product',pg_temp.hf_ref('r2')),
 ('other-creation',6,'reported_product',pg_temp.hf_ref('other')),
 ('original-use',7,'use',pg_temp.hf_ref('p1a')),
 ('use-amendment',8,'amendment',pg_temp.hf_ref('r1')),
 ('slot-b',9,'use',pg_temp.hf_ref('p1b')),
 ('reported-identity',10,'identity',pg_temp.hf_ref('r1')),
 ('plan-identity',11,'identity',pg_temp.hf_ref('p1a')),
 ('other-publication',12,'use',pg_temp.hf_ref('p2pub')),
 ('nested-creation',13,'reported_product',pg_temp.hf_ref('nested')),
 ('nested-amendment',14,'amendment',pg_temp.hf_ref('r1')),
 ('cross-client',1,'use',pg_temp.hf_ref('r1'));
update hf_events set client_id=(select id from hf_clients where name=case when label='cross-client' then 'other' else 'owner' end);
update hf_events set payload=jsonb_build_object('eventId',id,'product',product,'amendment',null);
update hf_events set payload=payload||jsonb_build_object('target',jsonb_build_object('subject',product,'comparedWith',pg_temp.hf_ref('p1a'))) where kind='identity';
update hf_events e set payload=jsonb_build_object('id',e.id,'eventId',(select original.id from hf_events original where original.label=case when e.label='use-amendment' then 'original-use' else 'nested-creation' end),'replacement',jsonb_build_object('product',e.product)) where e.kind='amendment';
insert into concierge.care_events(id,client_id,revision,kind,product,payload,recorded_by) select id,client_id,revision,kind,product,payload,client_id from hf_events;
insert into concierge.care_use_events(event_id,body) select id,payload from hf_events where kind='use' or label in ('selected-creation','other-creation','nested-creation');
insert into concierge.care_use_amendments(id,event_id,previous_id,body) select id,(payload->>'eventId')::uuid,null,payload from hf_events where kind='amendment';

create function pg_temp.hf_page(p jsonb,lim integer default 100,token text default null) returns jsonb language sql as $$
 select concierge.care_history_page((select id from hf_clients where name='owner'),p,token,lim,14)
$$;
create function pg_temp.hf_labels(page jsonb) returns text[] language sql as $$
 select coalesce(array_agg(e.label order by x.ord),'{}') from jsonb_array_elements(page->'entries') with ordinality x(item,ord) join hf_events e on e.id=coalesce(x.item->'event'->>'eventId',x.item->'amendment'->>'id')::uuid
$$;

select is(concierge.care_same_product(null::jsonb,pg_temp.hf_ref('r1')),null::boolean,'missing optional product comparison really is SQL NULL');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('r1'))),array['selected-creation','selected-use','original-use','use-amendment','reported-identity','nested-creation','nested-amendment'],'mixed history includes exactly original/replacement/subject members');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('r2'))),array['selected-v2'],'descriptor version is exact; corrections with initialUse null cannot admit unrelated rows');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('other'))),array['unrelated-correction','other-creation'],'different reported UUID stays separate');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('p1'))),array['original-use','slot-b','plan-identity'],'null slot aggregates exact publication/product contexts only');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('p1a'))),array['original-use','plan-identity'],'nonnull slot is exact; comparison target alone does not select identity');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('p1b'))),array['slot-b'],'other slot excluded');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('p2pub'))),array['other-publication'],'current-use cross-publication carry never broadens history');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('wrong_schema'))),'{}'::text[],'document schema is exact');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('absent'))),'{}'::text[],'all nonmatches returns empty valid page');
select is(pg_temp.hf_page(pg_temp.hf_ref('absent'))->'nextCursor','null'::jsonb,'empty final page has no continuation');
select is(jsonb_array_length(pg_temp.hf_page('null')->'entries'),14,'null product includes all and only this owner events');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('nested'))),array['nested-creation'],'original nested descriptor still matches after product amendment');
select is(pg_temp.hf_page(pg_temp.hf_ref('r2'))->'entries'->0->'event'->'initialUse','null'::jsonb,'descriptor correction has no fabricated initial use');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('r1'),2)),array['selected-creation','selected-use'],'skip unrelated rows before item count');
select is(pg_temp.hf_labels(pg_temp.hf_page(pg_temp.hf_ref('r1'),2,pg_temp.hf_page(pg_temp.hf_ref('r1'),2)->>'nextCursor')),array['original-use','use-amendment'],'next page resumes after last included event with no duplicate or skip');
select throws_ok($$select concierge.care_history_page((select id from hf_clients where name='owner'),pg_temp.hf_ref('r1'),pg_temp.hf_page(pg_temp.hf_ref('r1'),2)->>'nextCursor',2,15)$$,'P0001','concierge_cursor_conflict','changed head conflicts');
select throws_ok($$select public.concierge_care_command_v1('{"schemaVersion":1,"action":"read_use_history_v1","product":null,"cursor":null,"limit":0}')$$,'P0001','concierge_invalid_input','public minimum page bound unchanged');
select throws_ok($$select public.concierge_care_command_v1('{"schemaVersion":1,"action":"read_use_history_v1","product":null,"cursor":null,"limit":101}')$$,'P0001','concierge_invalid_input','public maximum page bound unchanged');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role']) r where has_function_privilege(r,'concierge.care_history_page(uuid,jsonb,text,integer,bigint)','execute')),'private helper remains non-executable by API roles');
select ok((select not prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='concierge.care_history_page(uuid,jsonb,text,integer,bigint)'::regprocedure),'private invoker and empty search path preserved');
select is((select count(*)::integer from jsonb_object_keys(concierge.care_command_fields())),13,'no new care action');
select is((select count(*)::integer from jsonb_object_keys(concierge.plan_command_fields())),26,'no new plan action');
select is(jsonb_array_length(concierge.plan_command_fields()->'grant_task_v1'->'actions'->'item'->'values'),14,'no task authority added');
select * from finish();
rollback;
