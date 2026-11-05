-- Canonical source tuples retain exact safe integer values, independent of JSON numeric scale.
begin;
do $guard$ begin if (select encode(sha256(convert_to(prosrc,'UTF8')),'hex') from pg_proc where oid='concierge.review_source_location_canonical(jsonb)'::regprocedure) is distinct from 'e91f089a98082b34a48ff2b1b74e37e30962762c5a5df8e5686d20279c2bed35' then raise exception 'unexpected retained locator function';end if;end $guard$;
create or replace function concierge.review_source_location_canonical(l jsonb) returns jsonb language plpgsql immutable set search_path='' as $$declare p jsonb:=l->'locator';k text;begin
 perform concierge.review_validate_source_location_v1(l);
 for k in select jsonb_object_keys(p) loop if k<>'kind' then p:=jsonb_set(p,array[k],to_jsonb(concierge.integer(p,k)));end if;end loop;
 return jsonb_build_object('sourceId',(l->>'sourceId')::uuid,'sourceVersion',concierge.integer(l,'sourceVersion'),'locator',p);
end $$;
do $guard$ begin if (select encode(sha256(convert_to(prosrc,'UTF8')),'hex') from pg_proc where oid='concierge.review_source_check(uuid,jsonb,uuid)'::regprocedure) is distinct from 'fc303e1751469639736edea87a221ff98ced98c979c4cff36520d37b7cc7ba7e' then raise exception 'unexpected retained locator function';end if;end $guard$;
CREATE OR REPLACE FUNCTION concierge.review_source_check(c uuid, locations jsonb, actor uuid DEFAULT auth.uid())
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$declare l jsonb;s concierge.plan_sources;begin
 if not concierge.plan_read_human_live(actor) then perform concierge.fail('forbidden');end if;
 for l in select value from jsonb_array_elements(locations) loop perform concierge.review_validate_source_location_v1(l);end loop;
 for l in select distinct on(value->>'sourceId',value->>'sourceVersion') value from jsonb_array_elements(locations) order by value->>'sourceId',value->>'sourceVersion' loop
  if l->'locator'->>'kind'='time' and concierge.integer(l->'locator','endMs')<=concierge.integer(l->'locator','startMs') or l->'locator'->>'kind'='text' and concierge.integer(l->'locator','end')<=concierge.integer(l->'locator','start') then perform concierge.fail('invalid_input');end if;
  select * into s from concierge.plan_sources where id=(l->>'sourceId')::uuid for share;
  if not found or not s.active or s.version<>concierge.integer(l,'sourceVersion') or (s.client_id=c or exists(select 1 from concierge.plan_drafts d where d.client_id=c and concierge.plan_source_scope(s,d.id,c))) is not true then perform concierge.fail('source_conflict');end if;
  if actor is distinct from (select owner_actor_id from concierge.plan_policy where singleton) then perform 1 from concierge.plan_source_permissions where actor_id=actor and source_id=s.id for share;if not found then perform concierge.fail('forbidden');end if;end if;
 end loop;
 if not concierge.plan_read_human_live(actor) then perform concierge.fail('forbidden');end if;
 if actor=auth.uid() then perform concierge.plan_session(actor,(auth.jwt()->>'session_id')::uuid);end if;
end $function$
;
commit;
