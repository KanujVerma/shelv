begin;
-- RG5: exact case-sensitive opaque stage identities, with no authored-body repair.
-- Shapes/counts/identifier syntax remain the existing closed Guidance contract.
create function concierge.review_guidance_stage_ids_unique_v1(b jsonb) returns boolean
language sql immutable set search_path='' as $$
 select case when b->>'kind'='instruction' then
  (select count(*)=count(distinct (stage->>'id') collate "C")
   from jsonb_array_elements(b->'schedule'->'stages') stage)
 else true end
$$;
revoke all on function concierge.review_guidance_stage_ids_unique_v1(jsonb) from public,anon,authenticated,service_role;

-- Preserve existing OID, owner, ACL and all other function attributes.
do $guard$ begin
 if (select encode(sha256(convert_to(prosrc,'UTF8')),'hex') from pg_proc where oid='concierge.review_guidance_body_check(uuid,jsonb)'::regprocedure)<>'53eae2f24d77a8532eaf14fb51682d70d8128859a02a2076c562bf713de606ea' then raise exception 'unexpected M61 retained function body';end if;
end $guard$;
CREATE OR REPLACE FUNCTION concierge.review_guidance_body_check(c uuid, b jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$declare use_basis jsonb;begin
 perform concierge.plan_shape(b,concierge.review_shapes()->'body');if concierge.review_bytes(b)>120000 then perform concierge.fail('invalid_input');end if;
 if not concierge.review_guidance_stage_ids_unique_v1(b) then perform concierge.fail('invalid_input');end if;
 if b->>'kind'='review' then perform concierge.care_occurrence(b->'occurredOn');
 elsif b->>'kind'='instruction' then
  if (b->'baseInstructionId'='null'::jsonb) is distinct from ((b->>'baseInstructionVersion')::bigint=0) or (b->'productId'='null'::jsonb) is distinct from (b->'useBasis'='null'::jsonb) then perform concierge.fail('invalid_input');end if;
  use_basis:=concierge.review_instruction_use(c,b);if b->'useBasis' is distinct from use_basis then perform concierge.fail('basis_conflict');end if;
 end if;
end $function$;

-- Preserve existing OID, owner, ACL and all other function attributes.
do $guard$ begin
 if (select encode(sha256(convert_to(prosrc,'UTF8')),'hex') from pg_proc where oid='concierge.review_guidance_issues(uuid,jsonb,jsonb,jsonb,boolean)'::regprocedure)<>'657477724062f376447412ea6c96a14d279653ac08feeaa5d6336f3739e89f98' then raise exception 'unexpected M61 retained function body';end if;
end $guard$;
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
  if not concierge.review_guidance_stage_ids_unique_v1(b) then r:=r||jsonb_build_array(jsonb_build_object('path','body.schedule','code','required'));end if;
  if jsonb_array_length(b->'directions')=0 or exists(select 1 from jsonb_array_elements_text(b->'directions') x where concierge.trim_text(x)='') then r:=r||jsonb_build_array(jsonb_build_object('path','body.directions','code','required'));end if;
  if concierge.trim_text(b->>'reason')='' then r:=r||jsonb_build_array(jsonb_build_object('path','body.reason','code','required'));end if;
  s:=b->'schedule';if jsonb_array_length(s->'periods')=0 or s->'days'->>'kind'='selected' and jsonb_array_length(s->'days'->'weekdays')=0 or exists(select 1 from jsonb_array_elements(s->'stages') x where concierge.trim_text(x->>'directions')='' or concierge.trim_text(x->>'proceedOnlyWhen')='') then r:=r||jsonb_build_array(jsonb_build_object('path','body.schedule','code','required'));end if;
  s:=concierge.review_scope_check(c,b);if s is not null and coalesce((s->>'contradiction')::boolean,false) then r:=r||jsonb_build_array(jsonb_build_object('path','body','code','unresolved_reference'));end if;
 end if;
 if not reviewed then r:=r||jsonb_build_array(jsonb_build_object('path','review','code','review_required'));end if;return r;
end $function$;

-- Preserve existing OID, owner, ACL and all other function attributes.
do $guard$ begin
 if (select encode(sha256(convert_to(prosrc,'UTF8')),'hex') from pg_proc where oid='concierge.review_guidance_draft_view(concierge.review_guidance_drafts)'::regprocedure)<>'2f96e72c2303a8c9ddb91ec8f7ce47bd2e07b6e31c5c349b2d06c0ce0475d358' then raise exception 'unexpected M61 retained function body';end if;
end $guard$;
CREATE OR REPLACE FUNCTION concierge.review_guidance_draft_view(d concierge.review_guidance_drafts)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r concierge.review_guidance_revisions;cur jsonb;review concierge.review_guidance_reviews;approval concierge.review_guidance_approvals;pol concierge.plan_policy;rv jsonb;ap jsonb;begin
 select * into r from concierge.review_guidance_revisions where draft_id=d.id and revision=d.revision;cur:=concierge.review_guidance_basis(d.client_id,r.body);select * into pol from concierge.plan_policy where singleton;
 if not concierge.review_guidance_stage_ids_unique_v1(r.body) then perform concierge.fail('invalid_input');end if;
 if r.basis=cur and jsonb_array_length(concierge.review_guidance_issues(d.client_id,r.body,r.basis,cur,true))=0 then select * into review from concierge.review_guidance_reviews x where x.draft_id=d.id and x.revision=d.revision and x.target=r.target and concierge.plan_read_human_live(x.actor_id) order by recorded_at desc,id desc limit 1;end if;
 if review.id is not null then
  select * into approval from concierge.review_guidance_approvals a where a.draft_id=d.id and a.revision=d.revision and a.target=r.target and a.policy_revision=pol.revision and (not pol.require_kanuj_approval or a.approved_by=pol.owner_actor_id) and concierge.plan_read_human_live(a.approved_by) and not exists(select 1 from concierge.review_guidance_revocations where approval_id=a.id) and not exists(select 1 from concierge.review_guidance_outputs where approval_id=a.id) order by approved_at desc,id desc limit 1;
  if approval.id is not null then begin perform concierge.review_guidance_publisher(d.client_id,approval.publisher,r.body);ap:=concierge.review_guidance_approval_json(approval);exception when raise_exception then ap:=null;end;end if;
 end if;
 if review.id is not null then rv:=concierge.review_guidance_review_json(review);end if;
 return jsonb_build_object('target',r.target,'body',r.body,'capturedBasis',r.basis,'currentBasis',cur,'needsRebase',r.basis is distinct from cur,'savedAt',concierge.care_instant(r.recorded_at),'recordedBy',r.actor_id,'review',rv,'approval',ap,'issues',concierge.review_guidance_issues(d.client_id,r.body,r.basis,cur,review.id is not null));
end $function$;

-- Preserve existing OID, owner, ACL and all other function attributes.
do $guard$ begin
 if (select encode(sha256(convert_to(prosrc,'UTF8')),'hex') from pg_proc where oid='concierge.review_request_authorize(concierge.review_requests)'::regprocedure)<>'2f15b8909530e641b83769b7892ec9b59fcf0f7f10f58f7dc775c47800498de4' then raise exception 'unexpected M61 retained function body';end if;
end $guard$;
CREATE OR REPLACE FUNCTION concierge.review_request_authorize(r concierge.review_requests)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$declare advisor boolean;body jsonb;begin
 advisor:=r.family='guidance' or r.command?'clientId';perform concierge.review_guard(r.client_id,advisor,false,advisor);
 if r.command->>'action'='record_conversation_v1' then perform concierge.review_source_check(r.client_id,concierge.review_conversation_sources(r.command->'body'));
 elsif r.family='guidance' then
  if r.result?'draft' then body:=r.result->'draft'->'body';
  elsif r.command?'target' then select rev.body into body from concierge.review_guidance_revisions rev where rev.draft_id=(r.command->'target'->>'draftId')::uuid and rev.revision=(r.command->'target'->>'revision')::bigint;
  elsif r.command?'approvalId' then select rev.body into body from concierge.review_guidance_approvals ap join concierge.review_guidance_revisions rev on rev.draft_id=ap.draft_id and rev.revision=ap.revision where ap.id=(r.command->>'approvalId')::uuid;end if;
  if body is null then perform concierge.fail('source_conflict');end if;perform concierge.review_guidance_sources_check(r.client_id,body);
  if not concierge.review_guidance_stage_ids_unique_v1(body) then perform concierge.fail('invalid_input');end if;
 elsif r.command->>'action'='append_private_review_note_v1' then perform concierge.review_note_subject(r.client_id,r.command->'reviewEvent');end if;
 if r.command->>'action'='publish_guidance_v1' then perform concierge.capability(auth.uid(),'publish');end if;
 perform concierge.review_guard(r.client_id,advisor,false,advisor);
end $function$;

commit;
