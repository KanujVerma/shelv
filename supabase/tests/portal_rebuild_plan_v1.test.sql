-- Canonical pgTAP structural/least-privilege tests. Business/concurrency cases are
-- also exercised with persisted rows by tests/portal-rebuild-native.py.
begin;
select plan(18);
select has_column('concierge','publications','document_schema_version');
select has_table('concierge','plan_documents');
select has_table('concierge','plan_draft_private');
select has_table('concierge','plan_task_grants');
select has_table('concierge','plan_deliveries');
select has_function('public','concierge_plan_command_v1',array['jsonb']);
select ok(not has_table_privilege('authenticated','concierge.plan_draft_private','SELECT'),'no raw clinical provenance access');
select ok(not has_table_privilege('service_role','concierge.plan_policy','UPDATE'),'no service-key policy mutation');
select ok(not has_function_privilege('anon','public.concierge_plan_command_v1(jsonb)','EXECUTE'),'anonymous plan API denied');
select ok(not has_function_privilege('service_role','public.concierge_plan_command_v1(jsonb)','EXECUTE'),'task API cannot use service role');
select ok(has_function_privilege('authenticated','public.concierge_plan_command_v1(jsonb)','EXECUTE'),'caller bearer API available');
select ok(not has_function_privilege('authenticated','concierge.plan_claim_email_deliveries(integer)','EXECUTE'),'agents cannot dispatch mail');
select ok(not has_function_privilege('authenticated','concierge.plan_legacy_write(uuid,text,bigint,uuid,jsonb)','EXECUTE'),'private legacy chain stays private');
select ok(exists(select 1 from pg_trigger where tgname='plan_complete_publication' and tgdeferrable and tginitdeferred),'complete document enforced at commit');
select ok(exists(select 1 from pg_trigger where tgname='plan_reply_barrier'),'old public reply bypass fenced');
select ok(not exists(select 1 from pg_tables t join pg_class c on c.relname=t.tablename join pg_namespace n on n.oid=c.relnamespace and n.nspname=t.schemaname where t.schemaname='concierge' and t.tablename like 'plan\_%' escape '\' and not c.relrowsecurity),'all plan tables enable RLS');
select ok(not has_function_privilege('service_role','concierge.plan_claim_email_deliveries(integer)','EXECUTE'),'raw delivery helpers stay private');
select ok(has_function_privilege('service_role','public.concierge_plan_delivery_claim_v1(integer)','EXECUTE'),'fixed service-only delivery RPC available');
select * from finish();
rollback;
