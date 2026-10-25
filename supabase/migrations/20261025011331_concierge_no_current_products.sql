-- Explicit founder confirmation for an initial consultation with no products.
-- Baselines remain historical. Routine activation still requires client Start.
begin;

alter function concierge.presentation_shape(boolean) rename to presentation_shape_products_v2;
create function concierge.presentation_shape(intake boolean) returns jsonb language plpgsql immutable set search_path='' as $$
declare s jsonb;begin
 s:=jsonb_set(jsonb_set(concierge.presentation_shape_products_v2(intake),'{fields,baselineRoutine,min}','0'::jsonb),
  '{fields,currentProductsStatus}','{"type":"enum","values":["none","recorded"],"optional":true}'::jsonb);
 if not intake then s:=jsonb_set(s,'{fields,routineBasis}',
 '{"type":"object","optional":true,"fields":{"products":{"type":"array","max":50,"min":0,"unique":false,"item":{"type":"object","fields":{"slot":{"type":"identifier"},"productId":{"type":"identifier"},"source":{"type":"object","fields":{"kind":{"type":"enum","values":["baseline","activation"]},"publicationVersion":{"type":"integer","min":1,"max":9007199254740991},"recommendationId":{"type":"identifier","nullable":true}}}}}}}}'::jsonb);end if;
 return s;
end $$;

alter function concierge.validate_presentation(jsonb,jsonb,jsonb,boolean) rename to validate_presentation_products_v2;
create function concierge.validate_presentation(p jsonb,baseline jsonb,recs jsonb default null,intake boolean default false) returns void language plpgsql set search_path='' as $$
declare product_count integer;begin
 -- Keep all established binding, plain-content, URL, size and identity checks.
 perform concierge.validate_presentation_products_v2(p,baseline,recs,intake);
 select count(*) into product_count from jsonb_array_elements(p->'baselineRoutine')j(s) where s->>'kind'='product';
 if (product_count=0 and p->>'currentProductsStatus' is distinct from 'none')
  or (product_count>0 and p->>'currentProductsStatus'='none') then perform concierge.fail('invalid_input');end if;
 if not intake and p ? 'routineBasis' and exists(select 1 from jsonb_array_elements(p->'routineBasis'->'products')j(b) where (b->'source'->>'kind'='baseline' and b->'source'->'recommendationId'<>'null'::jsonb) or (b->'source'->>'kind'='activation' and b->'source'->'recommendationId'='null'::jsonb)) then perform concierge.fail('invalid_input');end if;
 if not intake and exists(select 1 from jsonb_array_elements(p->'categoryCards')j(c)
  where c->'currentProduct'='null'::jsonb and (c->>'kind'='addition' or p ? 'currentProductsStatus' or p ? 'routineBasis') and jsonb_array_length(c->'comparisons')<>0) then perform concierge.fail('invalid_input');end if;
end $$;

-- Current product identities and their exact immutable direction source. This
-- is an authoring context only; it never inserts an activation or baseline row.
create function concierge.routine_basis(c uuid) returns jsonb language plpgsql set search_path='' as $$
declare raw jsonb;rich jsonb;products jsonb;begin
 raw:=concierge.client_projection(c);rich:=concierge.presentation_projection(c,raw,true);
 if jsonb_array_length(raw->'routine')<>(select count(*) from jsonb_array_elements(rich->'activeRoutine')j(s) where s->>'kind'='product') then perform concierge.fail('routine_basis_conflict');end if;
 select coalesce(jsonb_agg(jsonb_build_object('slot',s->'slot','productId',s->'productId','source',s->'source') order by (s->>'slot') collate "C"),'[]'::jsonb) into products
  from jsonb_array_elements(rich->'activeRoutine')j(s) where s->>'kind'='product';
 return jsonb_build_object('products',products);
end $$;
create function concierge.authoring_baseline(c uuid,p jsonb) returns jsonb language plpgsql set search_path='' as $$
declare baseline jsonb;begin
 if p ? 'routineBasis' then
  if p->'routineBasis' is distinct from concierge.routine_basis(c) then perform concierge.fail('routine_basis_conflict');end if;
  select coalesce(jsonb_agg(jsonb_build_object('slot',b->'slot','productId',b->'productId') order by (b->>'slot') collate "C"),'[]'::jsonb) into baseline from jsonb_array_elements(p->'routineBasis'->'products')j(b);
 else
  -- Existing first-plan/nonempty contracts stay valid. Once the client starts
  -- anything, a new save or publication must name the actual current source.
  if exists(select 1 from concierge.activations where client_id=c and started_on<=(now() at time zone 'UTC')::date) then perform concierge.fail('routine_basis_conflict');end if;
  select coalesce(jsonb_agg(jsonb_build_object('slot',slot,'productId',product_id) order by slot collate "C"),'[]'::jsonb) into baseline from concierge.baselines where client_id=c;
 end if;
 return baseline;
end $$;

-- Retain the entire proven nonempty/Maya transition implementation. The narrow
-- new path shares its authorization, transaction locks and exact-retry stream.
alter function public.concierge_presentation_write(uuid,text,bigint,uuid,jsonb) set schema concierge;
alter function concierge.concierge_presentation_write(uuid,text,bigint,uuid,jsonb) rename to presentation_write_products_v2;
create or replace function concierge.presentation_write_products_v2(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid;prior jsonb;c concierge.cases;baseline jsonb;r jsonb;iv integer;result jsonb;p jsonb;g text;n text;begin
 if p_action is null or p_action not in ('save_intake_v2','save_draft_v2','publish_v2') then perform concierge.fail('invalid_input');end if;
 u:=concierge.access(p_client_id,case when p_action='publish_v2' then 'publish' else 'edit' end,true);
 prior:=concierge.workflow_begin(u,p_client_id,p_request_id,'presentation',p_action,p_expected_revision,p_payload);if prior is not null then return prior;end if;
 select * into c from concierge.cases where client_id=p_client_id for update;
 if c.revision<>p_expected_revision then perform concierge.fail('revision_conflict');end if;
 if p_action='save_intake_v2' then
  perform concierge.keys(p_payload,array['goal','note','baseline','presentation']);g:=concierge.txt(p_payload,'goal',300);n:=concierge.txt(p_payload,'note',4000,true);baseline:=p_payload->'baseline';
  if jsonb_typeof(baseline) is distinct from 'array' then perform concierge.fail('invalid_input');end if;
  if jsonb_array_length(baseline) not between 1 and 50 or (select count(distinct x->>'slot') from jsonb_array_elements(baseline)j(x))<>jsonb_array_length(baseline) then perform concierge.fail('invalid_input');end if;
  for r in select value from jsonb_array_elements(baseline) loop
   perform concierge.keys(r,array['slot','productId']);perform concierge.identifier(concierge.txt(r,'slot',100));perform concierge.identifier(concierge.txt(r,'productId',100));
  end loop;
  if exists(select 1 from concierge.intakes where client_id=p_client_id) and ((select count(*) from concierge.baselines where client_id=p_client_id)<>jsonb_array_length(baseline) or exists(select 1 from concierge.baselines b where b.client_id=p_client_id and not exists(select 1 from jsonb_array_elements(baseline)j(x) where x->>'slot'=b.slot and x->>'productId'=b.product_id))) then perform concierge.fail('baseline_conflict');end if;
  perform concierge.validate_presentation(p_payload->'presentation',baseline,null,true);
  insert into concierge.baselines select p_client_id,x->>'slot',x->>'productId' from jsonb_array_elements(baseline)j(x) on conflict do nothing;
  select coalesce(max(version),0)+1 into iv from concierge.intakes where client_id=p_client_id;
  insert into concierge.intakes(client_id,version,goal,note) values(p_client_id,iv,g,n);
  insert into concierge.intake_presentations values(p_client_id,iv,p_payload->'presentation');
  update concierge.cases set revision=revision+1 where client_id=p_client_id;
 elsif p_action='save_draft_v2' then
  perform concierge.keys(p_payload,array['intakeVersion','recommendations','advisorNote','presentation']);
  baseline:=concierge.authoring_baseline(p_client_id,p_payload->'presentation');
  perform concierge.validate_items(p_payload->'recommendations');perform concierge.validate_presentation(p_payload->'presentation',baseline,p_payload->'recommendations');
  if exists(select 1 from jsonb_array_elements((p_payload->'presentation')->'categoryCards')j(card) where (card->>'kind'='addition' or ((p_payload->'presentation') ? 'routineBasis' and card->>'recommendationId' is not null and not exists(select 1 from concierge.baselines b where b.client_id=p_client_id and b.slot=card->>'slot'))) and (
   exists(select 1 from concierge.publication_presentations pp cross join lateral jsonb_array_elements(pp.presentation->'baselineRoutine')j(step) where pp.client_id=p_client_id and step->>'id'=card->>'id' and (card->>'kind'='addition' or step->>'kind'='instruction' or step->>'slot' is distinct from card->>'slot'))
   or exists(select 1 from concierge.activations ac join concierge.publication_presentations pp on pp.client_id=ac.client_id and pp.version=ac.version
    cross join lateral jsonb_array_elements(pp.presentation->'categoryCards')j(prior_card)
    where ac.client_id=p_client_id and ac.slot<>card->>'slot' and prior_card->>'recommendationId'=ac.recommendation_id and prior_card->>'id'=card->>'id'
     and not exists(select 1 from concierge.baselines b where b.client_id=p_client_id and b.slot=ac.slot))
  )) then perform concierge.fail('invalid_input');end if;
  if (select count(*) from (
   select slot from concierge.baselines where client_id=p_client_id
   union select slot from concierge.activations where client_id=p_client_id
   union select card->>'slot' from jsonb_array_elements((p_payload->'presentation')->'categoryCards')j(card) where card->>'kind'='addition'
  )slots)+(select max(instructions) from (
   select count(*) instructions from jsonb_array_elements((p_payload->'presentation')->'baselineRoutine')j(step) where step->>'kind'='instruction'
   union all select (select count(*) from jsonb_array_elements(pp.presentation->'baselineRoutine')j(step) where step->>'kind'='instruction') from concierge.publication_presentations pp where pp.client_id=p_client_id
  )snapshots)>50 then perform concierge.fail('invalid_input');end if;
  -- R2 addition slots have no baseline row. The full presentation validator
  -- above binds null current identities; keep the same transactional intake fence.
  iv:=concierge.integer(p_payload,'intakeVersion');n:=concierge.txt(p_payload,'advisorNote',4000,true);
  if iv is distinct from (select max(version) from concierge.intakes where client_id=p_client_id) then perform concierge.fail('intake_conflict');end if;
  insert into concierge.drafts values(p_client_id,iv,concierge.public_items(p_payload->'recommendations'),n)
   on conflict(client_id) do update set intake_version=excluded.intake_version,recommendations=excluded.recommendations,advisor_note=excluded.advisor_note;
  update concierge.cases set revision=revision+1 where client_id=p_client_id;
  insert into concierge.draft_presentations values(p_client_id,(p_payload->>'intakeVersion')::integer,p_payload->'presentation') on conflict(client_id) do update set intake_version=excluded.intake_version,presentation=excluded.presentation;
 else
  perform concierge.keys(p_payload,array[]::text[]);
  select dp.presentation,d.recommendations into p,r from concierge.draft_presentations dp join concierge.drafts d on d.client_id=dp.client_id and d.intake_version=dp.intake_version where dp.client_id=p_client_id;
  if not found then perform concierge.fail('content_version_required');end if;
  -- Revalidate persisted content as well as new writes before publication.
  baseline:=concierge.authoring_baseline(p_client_id,p);
  perform concierge.validate_items(r);perform concierge.validate_presentation(p,baseline,r);
  if exists(select 1 from jsonb_array_elements(p->'categoryCards')j(card) where (card->>'kind'='addition' or (p ? 'routineBasis' and card->>'recommendationId' is not null and not exists(select 1 from concierge.baselines b where b.client_id=p_client_id and b.slot=card->>'slot'))) and (
   exists(select 1 from concierge.publication_presentations pp cross join lateral jsonb_array_elements(pp.presentation->'baselineRoutine')j(step) where pp.client_id=p_client_id and step->>'id'=card->>'id' and (card->>'kind'='addition' or step->>'kind'='instruction' or step->>'slot' is distinct from card->>'slot'))
   or exists(select 1 from concierge.activations ac join concierge.publication_presentations pp on pp.client_id=ac.client_id and pp.version=ac.version
    cross join lateral jsonb_array_elements(pp.presentation->'categoryCards')j(prior_card)
    where ac.client_id=p_client_id and ac.slot<>card->>'slot' and prior_card->>'recommendationId'=ac.recommendation_id and prior_card->>'id'=card->>'id'
     and not exists(select 1 from concierge.baselines b where b.client_id=p_client_id and b.slot=ac.slot))
  )) then perform concierge.fail('invalid_input');end if;
  if (select count(*) from (
   select slot from concierge.baselines where client_id=p_client_id
   union select slot from concierge.activations where client_id=p_client_id
   union select card->>'slot' from jsonb_array_elements(p->'categoryCards')j(card) where card->>'kind'='addition'
  )slots)+(select max(instructions) from (
   select count(*) instructions from jsonb_array_elements(p->'baselineRoutine')j(step) where step->>'kind'='instruction'
   union all select (select count(*) from jsonb_array_elements(pp.presentation->'baselineRoutine')j(step) where step->>'kind'='instruction') from concierge.publication_presentations pp where pp.client_id=p_client_id
  )snapshots)>50 then perform concierge.fail('invalid_input');end if;
  result:=concierge.r1_workflow_write(p_client_id,'publish',p_expected_revision,p_request_id,'{}');
  insert into concierge.publication_presentations values(p_client_id,(result->>'publishedVersion')::integer,p);
 end if;
 select * into c from concierge.cases where client_id=p_client_id;
 result:=jsonb_build_object('revision',c.revision,'publishedVersion',c.published_version,'operation',p_action);
 return concierge.workflow_finish(u,p_client_id,p_request_id,'presentation',p_action,p_expected_revision,p_payload,result);
end $$;

create function public.concierge_presentation_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid;prior jsonb;c concierge.cases;iv integer;g text;n text;result jsonb;begin
 if p_action is distinct from 'save_intake_v2' or jsonb_typeof(p_payload->'baseline') is distinct from 'array' then
  return concierge.presentation_write_products_v2(p_client_id,p_action,p_expected_revision,p_request_id,p_payload);
 end if;
 if jsonb_array_length(p_payload->'baseline')<>0 then
  return concierge.presentation_write_products_v2(p_client_id,p_action,p_expected_revision,p_request_id,p_payload);
 end if;
 u:=concierge.access(p_client_id,'edit',true);
 prior:=concierge.workflow_begin(u,p_client_id,p_request_id,'presentation',p_action,p_expected_revision,p_payload);
 if prior is not null then return prior;end if;
 select * into c from concierge.cases where client_id=p_client_id for update;
 if c.revision<>p_expected_revision then perform concierge.fail('revision_conflict');end if;
 perform concierge.keys(p_payload,array['goal','note','baseline','presentation']);
 g:=concierge.txt(p_payload,'goal',300);n:=concierge.txt(p_payload,'note',4000,true);
 -- An established original product baseline can never be cleared by none.
 if exists(select 1 from concierge.baselines where client_id=p_client_id) then perform concierge.fail('baseline_conflict');end if;
 perform concierge.validate_presentation(p_payload->'presentation','[]'::jsonb,null,true);
 select coalesce(max(version),0)+1 into iv from concierge.intakes where client_id=p_client_id;
 insert into concierge.intakes(client_id,version,goal,note) values(p_client_id,iv,g,n);
 insert into concierge.intake_presentations values(p_client_id,iv,p_payload->'presentation');
 update concierge.cases set revision=revision+1 where client_id=p_client_id returning * into c;
 result:=jsonb_build_object('revision',c.revision,'publishedVersion',c.published_version,'operation',p_action);
 return concierge.workflow_finish(u,p_client_id,p_request_id,'presentation',p_action,p_expected_revision,p_payload,result);
end $$;

revoke all on function concierge.routine_basis(uuid),concierge.authoring_baseline(uuid,jsonb),concierge.presentation_shape_products_v2(boolean),concierge.presentation_shape(boolean),concierge.validate_presentation_products_v2(jsonb,jsonb,jsonb,boolean),concierge.validate_presentation(jsonb,jsonb,jsonb,boolean),concierge.presentation_write_products_v2(uuid,text,bigint,uuid,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.concierge_presentation_write(uuid,text,bigint,uuid,jsonb) from public,anon,service_role;
grant execute on function public.concierge_presentation_write(uuid,text,bigint,uuid,jsonb) to authenticated;
commit;
