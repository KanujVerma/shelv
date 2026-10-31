begin;
-- Validate every original tuple before any source/version permission dedup.
create function concierge.review_validate_source_location_v1(l jsonb) returns void language plpgsql immutable set search_path='' as $$declare p jsonb;k text;start_at bigint;end_at bigint;begin
 if jsonb_typeof(l) is distinct from 'object' then perform concierge.fail('invalid_input');end if;
 if not(l?&array['sourceId','sourceVersion','locator']) or (select count(*) from jsonb_object_keys(l))<>3 then perform concierge.fail('invalid_input');end if;
 perform concierge.plan_shape(l->'sourceId','{"type":"uuid"}');
 if concierge.integer(l,'sourceVersion')<1 then perform concierge.fail('invalid_input');end if;
 p:=l->'locator';if jsonb_typeof(p) is distinct from 'object' then perform concierge.fail('invalid_input');end if;
 if jsonb_typeof(p->'kind') is distinct from 'string' then perform concierge.fail('invalid_input');end if;k:=p->>'kind';
 if k='whole' then
  if (select count(*) from jsonb_object_keys(p))<>1 then perform concierge.fail('invalid_input');end if;
 elsif k='page' then
  if not(p?&array['kind','page']) or (select count(*) from jsonb_object_keys(p))<>2 then perform concierge.fail('invalid_input');end if;
  if concierge.integer(p,'page')<1 then perform concierge.fail('invalid_input');end if;
 elsif k in ('text','time') then
  if k='text' then
   if not(p?&array['kind','start','end']) or (select count(*) from jsonb_object_keys(p))<>3 then perform concierge.fail('invalid_input');end if;
   start_at:=concierge.integer(p,'start');end_at:=concierge.integer(p,'end');
  else
   if not(p?&array['kind','startMs','endMs']) or (select count(*) from jsonb_object_keys(p))<>3 then perform concierge.fail('invalid_input');end if;
   start_at:=concierge.integer(p,'startMs');end_at:=concierge.integer(p,'endMs');
  end if;
  if end_at<=start_at then perform concierge.fail('invalid_input');end if;
 else perform concierge.fail('invalid_input');end if;
end $$;
create function concierge.review_guidance_original_source_locations(c uuid,b jsonb) returns setof jsonb language sql set search_path='' as $$
 select loc from jsonb_array_elements(concierge.review_input_refs(b)) ref
 join concierge.review_conversations cv on ref->>'kind'='conversation' and cv.id=(ref->>'id')::uuid and cv.client_id=c
 cross join lateral jsonb_array_elements((cv.body->'clientReported')||(cv.body->'advisorConclusions')||(cv.body->'agentProposals')) f
 cross join lateral jsonb_array_elements(f->'sources') loc
$$;
create function concierge.review_legacy_reply_fence(c uuid) returns void language plpgsql set search_path='' as $$begin
 -- Always called only after the retained reader's current scope/session checks.
 -- Publication binding is unrepresentable even when the typed nextStep is null.
 if exists(select 1 from concierge.review_guidance_outputs o where o.client_id=c and o.kind='reply' and concierge.review_is_published(o)) then perform concierge.fail('content_version_required');end if;
end $$;

-- Forward correction of concierge.review_guidance_issues(uuid,jsonb,jsonb,jsonb,boolean); existing identity/ACL retained.
CREATE OR REPLACE FUNCTION concierge.review_guidance_issues(c uuid, b jsonb, captured jsonb, current_basis jsonb, reviewed boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$declare r jsonb:='[]';k text;s jsonb;begin
 if captured is distinct from current_basis or b->'publication' is distinct from concierge.review_current_ref(c) then r:=r||jsonb_build_array(jsonb_build_object('path','basis','code','basis_conflict'));end if;
 if b->>'kind'='review' then foreach k in array array['clientReport','conclusion','rationale','nextStep'] loop if concierge.trim_text(b->>k)='' then r:=r||jsonb_build_array(jsonb_build_object('path','body.'||k,'code','required'));end if;end loop;
  if exists(select 1 from jsonb_array_elements_text(b->'changes') change where concierge.trim_text(change)='') then r:=r||jsonb_build_array(jsonb_build_object('path','body','code','required'));end if;
 elsif b->>'kind'='reply' then if concierge.trim_text(b->>'reply')='' then r:=r||jsonb_build_array(jsonb_build_object('path','body.reply','code','required'));end if;
 else
  if jsonb_array_length(b->'directions')=0 or exists(select 1 from jsonb_array_elements_text(b->'directions') x where concierge.trim_text(x)='') then r:=r||jsonb_build_array(jsonb_build_object('path','body.directions','code','required'));end if;
  if concierge.trim_text(b->>'reason')='' then r:=r||jsonb_build_array(jsonb_build_object('path','body.reason','code','required'));end if;
  s:=b->'schedule';if jsonb_array_length(s->'periods')=0 or s->'days'->>'kind'='selected' and jsonb_array_length(s->'days'->'weekdays')=0 or exists(select 1 from jsonb_array_elements(s->'stages') x where concierge.trim_text(x->>'directions')='' or concierge.trim_text(x->>'proceedOnlyWhen')='') then r:=r||jsonb_build_array(jsonb_build_object('path','body.schedule','code','required'));end if;
  s:=concierge.review_scope_check(c,b);if s is not null and coalesce((s->>'contradiction')::boolean,false) then r:=r||jsonb_build_array(jsonb_build_object('path','body','code','unresolved_reference'));end if;
 end if;
 if not reviewed then r:=r||jsonb_build_array(jsonb_build_object('path','review','code','review_required'));end if;return r;
end $function$
;

-- Forward correction of concierge.review_guidance_draft_view(concierge.review_guidance_drafts); existing identity/ACL retained.
CREATE OR REPLACE FUNCTION concierge.review_guidance_draft_view(d concierge.review_guidance_drafts)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r concierge.review_guidance_revisions;cur jsonb;review concierge.review_guidance_reviews;approval concierge.review_guidance_approvals;pol concierge.plan_policy;rv jsonb;ap jsonb;begin
 select * into r from concierge.review_guidance_revisions where draft_id=d.id and revision=d.revision;cur:=concierge.review_guidance_basis(d.client_id,r.body);select * into pol from concierge.plan_policy where singleton;
 if r.basis=cur and jsonb_array_length(concierge.review_guidance_issues(d.client_id,r.body,r.basis,cur,true))=0 then select * into review from concierge.review_guidance_reviews x where x.draft_id=d.id and x.revision=d.revision and x.target=r.target and concierge.plan_read_human_live(x.actor_id) order by recorded_at desc,id desc limit 1;end if;
 if review.id is not null then
  select * into approval from concierge.review_guidance_approvals a where a.draft_id=d.id and a.revision=d.revision and a.target=r.target and a.policy_revision=pol.revision and (not pol.require_kanuj_approval or a.approved_by=pol.owner_actor_id) and concierge.plan_read_human_live(a.approved_by) and not exists(select 1 from concierge.review_guidance_revocations where approval_id=a.id) and not exists(select 1 from concierge.review_guidance_outputs where approval_id=a.id) order by approved_at desc,id desc limit 1;
  if approval.id is not null then begin perform concierge.review_guidance_publisher(d.client_id,approval.publisher,r.body);ap:=concierge.review_guidance_approval_json(approval);exception when raise_exception then ap:=null;end;end if;
 end if;
 if review.id is not null then rv:=concierge.review_guidance_review_json(review);end if;
 return jsonb_build_object('target',r.target,'body',r.body,'capturedBasis',r.basis,'currentBasis',cur,'needsRebase',r.basis is distinct from cur,'savedAt',concierge.care_instant(r.recorded_at),'recordedBy',r.actor_id,'review',rv,'approval',ap,'issues',concierge.review_guidance_issues(d.client_id,r.body,r.basis,cur,review.id is not null));
end $function$
;

-- Forward correction of public.concierge_checkin_read(uuid); existing identity/ACL retained.
CREATE OR REPLACE FUNCTION public.concierge_checkin_read(p_client_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare result jsonb;begin
 result:=concierge.review_checkin_read_before_v1(p_client_id);
 if (select activated from concierge.plan_policy where singleton) and (exists(select 1 from concierge.checkin_reports where client_id=p_client_id and report_format='goal') or exists(select 1 from concierge.review_report_amendments where client_id=p_client_id)) then perform concierge.fail('content_version_required');end if;perform concierge.review_legacy_reply_fence(p_client_id);return result;
end $function$
;

-- Forward correction of public.concierge_checkin_advisor_read(uuid); existing identity/ACL retained.
CREATE OR REPLACE FUNCTION public.concierge_checkin_advisor_read(p_client_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare result jsonb;begin
 result:=concierge.review_checkin_advisor_read_before_v1(p_client_id);
 if (select activated from concierge.plan_policy where singleton) and (exists(select 1 from concierge.checkin_reports where client_id=p_client_id and report_format='goal') or exists(select 1 from concierge.review_report_amendments where client_id=p_client_id) or exists(select 1 from concierge.review_conversations where client_id=p_client_id) or exists(select 1 from concierge.review_private_notes where client_id=p_client_id)) then perform concierge.fail('content_version_required');end if;perform concierge.review_legacy_reply_fence(p_client_id);return result;
end $function$
;

-- Forward correction of public.concierge_advisor_preview_v2(uuid,text,bigint); existing identity/ACL retained.
CREATE OR REPLACE FUNCTION public.concierge_advisor_preview_v2(p_client_id uuid, p_mode text, p_expected_revision bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare r jsonb;begin
   perform concierge.plan_legacy_read_guard(p_client_id,false);perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));
   r:=concierge.care_retained_concierge_advisor_preview_v2(p_client_id,p_mode,p_expected_revision);perform concierge.care_legacy_current_check(p_client_id);perform concierge.plan_legacy_read_guard(p_client_id,false);perform concierge.review_legacy_reply_fence(p_client_id);return r;
  end $function$
;

-- Forward correction of concierge.review_source_check(uuid,jsonb,uuid); existing identity/ACL retained.
CREATE OR REPLACE FUNCTION concierge.review_source_check(c uuid, locations jsonb, actor uuid DEFAULT auth.uid())
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$declare l jsonb;s concierge.plan_sources;begin
 if not concierge.plan_read_human_live(actor) then perform concierge.fail('forbidden');end if;
 for l in select value from jsonb_array_elements(locations) loop perform concierge.review_validate_source_location_v1(l);end loop;
 for l in select distinct on(value->>'sourceId',value->>'sourceVersion') value from jsonb_array_elements(locations) order by value->>'sourceId',value->>'sourceVersion' loop
  if l->'locator'->>'kind'='time' and (l->'locator'->>'endMs')::bigint<=(l->'locator'->>'startMs')::bigint or l->'locator'->>'kind'='text' and (l->'locator'->>'end')::bigint<=(l->'locator'->>'start')::bigint then perform concierge.fail('invalid_input');end if;
  select * into s from concierge.plan_sources where id=(l->>'sourceId')::uuid for share;
  if not found or not s.active or s.version<>(l->>'sourceVersion')::bigint or (s.client_id=c or exists(select 1 from concierge.plan_drafts d where d.client_id=c and concierge.plan_source_scope(s,d.id,c))) is not true then perform concierge.fail('source_conflict');end if;
  if actor is distinct from (select owner_actor_id from concierge.plan_policy where singleton) then perform 1 from concierge.plan_source_permissions where actor_id=actor and source_id=s.id for share;if not found then perform concierge.fail('forbidden');end if;end if;
 end loop;
 if not concierge.plan_read_human_live(actor) then perform concierge.fail('forbidden');end if;
 if actor=auth.uid() then perform concierge.plan_session(actor,(auth.jwt()->>'session_id')::uuid);end if;
end $function$
;

-- Forward correction of concierge.review_guidance_sources_check(uuid,jsonb,uuid); existing identity/ACL retained.
CREATE OR REPLACE FUNCTION concierge.review_guidance_sources_check(c uuid, b jsonb, actor uuid DEFAULT auth.uid())
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$declare l jsonb;begin
 -- Grants are source/version scoped. Each representative is a real exact original locator;
 -- all locators remain in the immutable input and complete manifest relation.
 if not concierge.plan_read_human_live(actor) then perform concierge.fail('forbidden');end if;
 for l in select value from concierge.review_guidance_original_source_locations(c,b) value loop perform concierge.review_validate_source_location_v1(l);end loop;
 for l in select distinct on(value->>'sourceId',value->>'sourceVersion') value from concierge.review_guidance_source_locations(c,b) value order by value->>'sourceId',value->>'sourceVersion',concierge.review_compact(value) collate "C" loop
  perform concierge.review_source_check(c,jsonb_build_array(l),actor);
 end loop;
 if not concierge.plan_read_human_live(actor) then perform concierge.fail('forbidden');end if;
 if actor=auth.uid() then perform concierge.plan_session(actor,(auth.jwt()->>'session_id')::uuid);end if;
end $function$
;

-- Forward correction of concierge.review_guidance_source_locations(uuid,jsonb); existing identity/ACL retained.
CREATE OR REPLACE FUNCTION concierge.review_guidance_source_locations(c uuid, b jsonb)
 RETURNS SETOF jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
 select concierge.review_source_location_canonical(value) from concierge.review_guidance_original_source_locations(c,b) value
$function$
;

revoke all on function concierge.review_validate_source_location_v1(jsonb),concierge.review_guidance_original_source_locations(uuid,jsonb),concierge.review_legacy_reply_fence(uuid) from public,anon,authenticated,service_role;
commit;
