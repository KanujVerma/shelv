-- AUTHORED BUT UNRUN in W1's SOURCE-only phase. No resource grant is implied.
-- Later canonical replay must additionally exercise actual ended own-client fixtures,
-- concurrent revocation/waits, entitlement cutoffs and complete instruction receipts.
begin;
select no_plan();
select has_function('public','concierge_final_export_command_v1',array['jsonb'],'one fixed final-export RPC');
select ok(has_function_privilege('authenticated','public.concierge_final_export_command_v1(jsonb)','execute'),'authenticated execution is available');
select ok(not has_function_privilege('anon','public.concierge_final_export_command_v1(jsonb)','execute'),'anonymous execution denied');
select ok(not has_function_privilege('service_role','public.concierge_final_export_command_v1(jsonb)','execute'),'service-key execution denied');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where n.nspname='public' and p.proname='concierge_final_export_command_v1' and a.grantee=0 and a.privilege_type='EXECUTE'),'PUBLIC execution revoked');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='concierge' and p.proname like 'final_export_%'),14,'fourteen private producer helpers');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='concierge' and p.proname like 'final_export_%' and (has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute') or has_function_privilege('service_role',p.oid,'execute'))),0,'no helper EXECUTE leaks');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='concierge' and p.proname like 'final_export_%' or n.nspname='public' and p.proname='concierge_final_export_command_v1') and not coalesce(p.proconfig @> array['search_path=""'],false)),0,'all final-export functions have empty search_path');
select ok((select prosecdef from pg_proc where oid='public.concierge_final_export_command_v1(jsonb)'::regprocedure),'only fixed wrapper is security definer');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='concierge' and p.proname like 'final_export_%' and p.prosecdef),0,'private helpers are invoker functions');
select is((select count(*)::integer from jsonb_object_keys(concierge.plan_command_fields())),26,'Plan26 unchanged');
select is((select count(*)::integer from jsonb_object_keys(concierge.care_command_fields())),13,'Care13 unchanged');
select is((select count(*)::integer from jsonb_object_keys(concierge.review_command_fields())),15,'Review15 unchanged');
select is(jsonb_array_length(concierge.plan_command_fields()->'grant_task_v1'->'actions'->'item'->'values'),14,'Task14 gains no final-export right');

select set_config('request.jwt.claims','{}',true);
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','',true);
select throws_ok($$select public.concierge_final_export_command_v1('{"schemaVersion":1,"action":"read_final_export_manifest_v1"}')$$,'P0001','concierge_unauthorized','missing own session denied before data');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","session_id":"10000000-0000-4000-8000-000000000002","exp":0}',true);
select throws_ok($$select public.concierge_final_export_command_v1('{"schemaVersion":1,"action":"read_final_export_manifest_v1"}')$$,'P0001','concierge_session_ended','expired JWT cannot obtain final data');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"service_role","session_id":"10000000-0000-4000-8000-000000000002","exp":9999999999}',true);
select throws_ok($$select public.concierge_final_export_command_v1('{"schemaVersion":1,"action":"read_final_export_manifest_v1"}')$$,'P0001','concierge_unauthorized','service claim cannot impersonate own-client export');
select set_config('request.jwt.claims','{}',true);

select is(concierge.final_export_selection_v1('ffffffff-ffff-4fff-8fff-ffffffffffff')->>'unavailable','service_end_unknown','no actual service facts is unavailable, not none');
select ok(concierge.final_export_document_v1('ffffffff-ffff-4fff-8fff-ffffffffffff',1) is null,'missing publication cannot fabricate a public document');
select is(concierge.final_export_manifest_v1('ffffffff-ffff-4fff-8fff-ffffffffffff','{"unavailable":"legacy_snapshot_missing"}'),'{"schemaVersion":1,"status":"unavailable","reason":"legacy_snapshot_missing"}'::jsonb,'missing immutable legacy snapshot is explicit');
select is(concierge.final_export_manifest_v1('ffffffff-ffff-4fff-8fff-ffffffffffff','{"unavailable":"instructions_incomplete"}')->>'reason','instructions_incomplete','incomplete instructions remain unavailable');

-- Pure SQL producer helper units. These do not replace actual authenticated fixture journeys.
with doc as(select jsonb_build_object('content',jsonb_build_object(
 'routine',(select jsonb_agg(jsonb_build_object('slotId','routine-'||i,'productId','product-0')) from generate_series(0,49) i),
 'decisions',(select jsonb_agg(jsonb_build_object('slotId','decision-'||i,'currentProductIds',(select jsonb_agg('product-'||j) from generate_series(0,49) j),'alternativeProductIds','[]'::jsonb,'primaryProductId',null)) from generate_series(0,49) i))) d)
select is((select count(*)::integer from concierge.final_export_scopes_v1(d)),2550,'all 2550 declared rich instruction scopes remain enumerable') from doc;
select is((select count(*)::integer from concierge.final_export_scopes_v1('{"content":{"routine":[{"slotId":"rinse","productId":null},{"slotId":"rinse","productId":null}],"decisions":[]}}')),1,'same scope deduplicates without inventing a product');
select is((select product_id from concierge.final_export_scopes_v1('{"content":{"routine":[{"slotId":"rinse","productId":null}],"decisions":[]}}')),null::text,'nonproduct scope stays nonproduct');

select is(concierge.final_export_leaf_v1(1,'instruction',0,1,'abc'),'5a488c988768f734aef377c03bf1ca450e0364f2c5979307009afe5470f141bb','exact independently calculated segment/domain/byte framing');
select isnt(concierge.final_export_leaf_v1(1,'instruction',0,1,'abc'),concierge.final_export_leaf_v1(1,'instruction',0,2,'abc'),'segment completeness count is in the leaf');
select isnt(concierge.final_export_leaf_v1(1,'instruction',0,1,'abc'),concierge.final_export_leaf_v1(0,'plan',0,1,'abc'),'unit identity and kind are in the leaf');
select isnt(concierge.final_export_metadata_fold_v1(repeat('0',64),'use_event','[1,2]'),concierge.final_export_metadata_fold_v1(repeat('0',64),'use_event','[2,1]'),'selection metadata order is committed');
select isnt(concierge.final_export_metadata_fold_v1(repeat('0',64),'use_event','[1,2]'),concierge.final_export_metadata_fold_v1(repeat('0',64),'use_amendment','[1,2]'),'selection reference domains cannot collide');
select is(concierge.care_instant('2026-11-01'::date::timestamp at time zone 'America/Chicago'),'2026-11-01T05:00:00.000000Z','actual exclusive Chicago support midnight before DST change');
select is(concierge.care_instant(('2026-11-01'::date+30)::timestamp at time zone 'America/Chicago'),'2026-12-01T06:00:00.000000Z','thirty calendar days crosses DST without adding fixed elapsed hours');
select * from finish();
rollback;
