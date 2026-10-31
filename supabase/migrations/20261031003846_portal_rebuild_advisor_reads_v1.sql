-- Bounded advisor public read projections. No identity/grant seeds or raw ACL additions.
begin;
-- Retain the reviewed 22-action implementation byte-for-byte behind a closed dispatcher.
alter function public.concierge_plan_command_v1(jsonb) set schema concierge;
alter function concierge.concierge_plan_command_v1(jsonb) rename to plan_command_base_v1;
revoke all on function concierge.plan_command_base_v1(jsonb) from public,anon,authenticated,service_role;
alter function concierge.plan_command_fields() rename to plan_command_fields_base_v1;
create function concierge.plan_command_fields() returns jsonb language sql immutable set search_path='' as $fn$
 select jsonb_set(jsonb_set(concierge.plan_command_fields_base_v1(),'{grant_task_v1,actions,item,values}','["list_plans_v1","read_draft_v1","create_draft_v1","save_draft_v1","checkpoint_draft_v1","assign_draft_v1","compare_import_v1","apply_import_v1","validate_draft_v1","preview_draft_v1","publish_plan_v1","request_status_v1","read_advisor_gate_v1","read_advisor_publication_v1"]'::jsonb),'{grant_task_v1,actions,max}','14'::jsonb) || $shape${"read_advisor_gate_v1":{"target":{"type":"object","fields":{"draftId":{"type":"uuid"},"clientId":{"type":"uuid"},"contentRevision":{"type":"integer","min":0,"max":9007199254740991},"assignmentRevision":{"type":"integer","min":0,"max":9007199254740991},"contentHash":{"type":"hash"}}},"publisher":{"type":"union","variants":[{"type":"object","fields":{"kind":{"type":"enum","values":["human"]},"actorId":{"type":"uuid"}}},{"type":"object","fields":{"kind":{"type":"enum","values":["task_agent"]},"actorId":{"type":"uuid"},"taskGrantId":{"type":"uuid"}}}]}},"read_advisor_publication_v1":{"clientId":{"type":"uuid"},"version":{"type":"integer","min":1,"max":9007199254740991,"nullable":true}}}$shape$::jsonb
$fn$;

-- View authority is independent from edit and raw-source authority. No caller role/GUC switch.
create function concierge.plan_advisor_read_guard() returns concierge.plan_principals language plpgsql set search_path='' as $$
declare p concierge.plan_policy;r concierge.plan_principals;u uuid:=auth.uid();s uuid;begin
 select * into p from concierge.plan_policy where singleton for share;
 if p.activated is distinct from true then perform concierge.fail('candidate_inactive');end if;
 begin s:=(auth.jwt()->>'session_id')::uuid;exception when invalid_text_representation then perform concierge.fail('session_ended');end;
 if u is null or s is null then perform concierge.fail('session_ended');end if;
 select * into r from concierge.plan_principals where actor_id=u and active for share;
 if not found then perform concierge.fail('forbidden');end if;
 perform concierge.plan_session(u,s);
 if r.kind in ('owner','human') then perform concierge.capability(u,'view');end if;
 if r.kind='owner' and r.actor_id is distinct from p.owner_actor_id then perform concierge.fail('forbidden');end if;
 return r;
end $$;
create function concierge.plan_advisor_read_authorize(a text,d uuid,c uuid,exact_grant uuid default null) returns uuid language plpgsql set search_path='' as $$
declare pr concierge.plan_principals:=concierge.plan_advisor_read_guard();g concierge.plan_task_grants;begin
 if a not in ('read_advisor_gate_v1','read_advisor_publication_v1') or c is null then perform concierge.fail('forbidden');end if;
 if pr.kind in ('owner','human') then return null;end if;
 select * into g from concierge.plan_task_grants t where t.actor_id=pr.actor_id and t.session_id=(auth.jwt()->>'session_id')::uuid
 and t.actions ? a and t.expires_at>clock_timestamp() and (exact_grant is null or t.id=exact_grant)
 and not exists(select 1 from concierge.plan_task_revocations rv where rv.grant_id=t.id)
 and (t.client_id=c or (d is not null and t.draft_id=d and exists(select 1 from concierge.plan_drafts pd where pd.id=d and pd.client_id=c)))
 order by t.id limit 1 for share;
 if not found then perform concierge.fail('forbidden');end if;
 perform concierge.plan_session(g.actor_id,g.session_id);
 -- Snapshot after a possibly waiting grant lock, not the pre-wait predicate.
 if g.expires_at<=clock_timestamp() or exists(select 1 from concierge.plan_task_revocations where grant_id=g.id) then perform concierge.fail('forbidden');end if;
 return g.id;
end $$;

-- These predicates inspect private dependencies but return booleans only. They grant no raw read.
create function concierge.plan_read_human_live(u uuid) returns boolean language plpgsql set search_path='' as $$begin
 perform 1 from concierge.plan_principals p join concierge.plan_policy pol on pol.singleton where p.actor_id=u and p.active and (p.kind='human' and p.actor_id is distinct from pol.owner_actor_id or p.kind='owner' and pol.owner_actor_id=u) for share of p;
 if not found then return false;end if;
 perform 1 from concierge.advisors where user_id=u and active and can_view and can_edit for share;
 if not found then return false;end if;
 perform 1 from auth.users where id=u and is_anonymous is false and deleted_at is null and (banned_until is null or banned_until<=clock_timestamp()) for share;
 if not found then return false;end if;
 perform 1 from public.profiles where id=u and deletion_started_at is null for share;
 return found;
end $$;
create function concierge.plan_read_sources_live(body jsonb,d uuid,c uuid,u uuid,g uuid default null) returns boolean language plpgsql set search_path='' as $$
declare loc jsonb;s concierge.plan_sources;begin
 for loc in select l.value from jsonb_array_elements(body->'context'->'facts') f cross join lateral jsonb_array_elements(f->'sources') l loop
  select * into s from concierge.plan_sources where id=(loc->>'sourceId')::uuid for share;
  if not found or not s.active or s.version<>(loc->>'sourceVersion')::bigint or not concierge.plan_source_scope(s,d,c) then return false;end if;
  if g is not null then
   if not exists(select 1 from concierge.plan_task_grants where id=g and source_ids ? (loc->>'sourceId')) then return false;end if;
  elsif u is distinct from (select owner_actor_id from concierge.plan_policy where singleton) then
   perform 1 from concierge.plan_source_permissions where actor_id=u and source_id=s.id for share;
   if not found then return false;end if;
  end if;
 end loop;
 return true;
end $$;
create function concierge.plan_read_publisher_live(p jsonb,d uuid,c uuid,check_sources boolean default true) returns boolean language plpgsql set search_path='' as $$
declare g concierge.plan_task_grants;body jsonb;begin
 if p->>'kind'='human' then
  if not concierge.plan_read_human_live((p->>'actorId')::uuid) then return false;end if;
  perform 1 from concierge.advisors where user_id=(p->>'actorId')::uuid and active and can_view and can_edit and can_publish for share;
  if not found then return false;end if;
 else
  perform 1 from concierge.plan_principals where actor_id=(p->>'actorId')::uuid and kind='agent' and active for share;
  if not found then return false;end if;
  select * into g from concierge.plan_task_grants where id=(p->>'taskGrantId')::uuid and actor_id=(p->>'actorId')::uuid and actions ? 'publish_plan_v1' and (draft_id=d or client_id=c) for share;
  if not found then return false;end if;
  if g.expires_at<=clock_timestamp() or exists(select 1 from concierge.plan_task_revocations where grant_id=g.id) then return false;end if;
  begin perform concierge.plan_session(g.actor_id,g.session_id);exception when sqlstate 'P0001' then return false;end;
 end if;
 if not check_sources then return true;end if;
 select content into body from concierge.plan_draft_private where draft_id=d;
 return concierge.plan_read_sources_live(body,d,c,(p->>'actorId')::uuid,g.id);
end $$;
create function concierge.plan_read_current_approval(d concierge.plan_drafts,pub jsonb) returns jsonb language plpgsql set search_path='' as $$
declare ap concierge.plan_approvals;pol concierge.plan_policy;body jsonb;begin
 select * into pol from concierge.plan_policy where singleton;
 if d.state<>'working' or jsonb_array_length(concierge.plan_issues(d))>0 then return null;end if;
 if not concierge.plan_read_publisher_live(pub,d.id,d.client_id) then return null;end if;
 select content into body from concierge.plan_draft_private where draft_id=d.id;
 for ap in select * from concierge.plan_approvals where draft_id=d.id and target=concierge.plan_exact(d) and publisher=pub and scope='care_plan.publish' and policy_revision=pol.revision order by approved_at desc,id desc for share loop
  if exists(select 1 from concierge.plan_approval_revocations where approval_id=ap.id) or exists(select 1 from concierge.plan_publication_receipts where approval_id=ap.id) then continue;end if;
  if not concierge.plan_read_human_live(ap.approved_by) then continue;end if;
  if (pol.require_kanuj_approval or pub->>'kind'='task_agent') and ap.approved_by<>pol.owner_actor_id then continue;end if;
  if ap.approved_by<>pol.owner_actor_id and (pub->>'kind'<>'human' or pub->>'actorId'<>ap.approved_by::text) then continue;end if;
  if not concierge.plan_read_sources_live(body,d.id,d.client_id,ap.approved_by) then continue;end if;
  -- Recheck live predicates after any principal/session/source/approval lock waits.
  if not concierge.plan_read_publisher_live(pub,d.id,d.client_id) or jsonb_array_length(concierge.plan_issues(d))>0 or ap.target is distinct from concierge.plan_exact(d) then continue;end if;
  return ap.target||jsonb_build_object('id',ap.id,'scope',ap.scope,'approvedBy',ap.approved_by,'approvedAt',ap.approved_at,'publisher',ap.publisher,'revokedAt',null,'publicationReceiptId',null);
 end loop;
 return null;
end $$;
create function concierge.plan_read_capabilities(d concierge.plan_drafts,g uuid) returns jsonb language plpgsql set search_path='' as $$
declare pr concierge.plan_principals;ad concierge.advisors;pol concierge.plan_policy;acts jsonb:='[]';body jsonb;edit boolean:=false;pub boolean:=false;assign boolean:=false;begin
 select * into pr from concierge.plan_principals where actor_id=auth.uid();select * into pol from concierge.plan_policy where singleton;
 if pr.kind in ('owner','human') then
  select * into ad from concierge.advisors where user_id=pr.actor_id;
  edit:=ad.active and ad.can_view and ad.can_edit;pub:=edit and ad.can_publish;assign:=edit;
 else
  select actions into acts from concierge.plan_task_grants where id=g;select content into body from concierge.plan_draft_private where draft_id=d.id;
  if concierge.plan_read_sources_live(body,d.id,d.client_id,pr.actor_id,g) then edit:=acts ? 'save_draft_v1';pub:=acts ? 'publish_plan_v1';assign:=acts ? 'assign_draft_v1';end if;
 end if;
 return jsonb_build_object('actorId',pr.actor_id,'view',true,'edit',edit,'assign',assign,'review',edit and pr.kind in ('owner','human'),'approve',edit and (pr.kind='owner' or pr.kind='human' and not pol.require_kanuj_approval),'publish',pub,'confirmPayments',coalesce(ad.active and ad.can_view and ad.can_confirm_payments,false));
end $$;

-- Canonical immutable public document plus real client state; never call the owner-derived reader
-- with an advisor's session, substitute a JWT, or reconstruct publication from its working draft.
create function concierge.plan_advisor_publication(c uuid,v integer) returns jsonb language plpgsql set search_path='' as $$
declare p concierge.publications;doc jsonb;legacy jsonb;plan_info jsonb;states jsonb;revision bigint;care text;entitled boolean;readable boolean;writable boolean;schedule jsonb;begin
 select * into p from concierge.publications where client_id=c and version=v;
 if not found then perform concierge.fail('not_found');end if;
 if p.document_schema_version=3 then
  select document into doc from concierge.plan_documents where client_id=c and version=p.version;
  if not found then perform concierge.fail('incomplete_publication');end if;
  plan_info:=jsonb_build_object('documentSchemaVersion',3,'version',p.version,'publishedAt',p.published_at,'content',doc);
 else
  select jsonb_build_object('version',p.version,'recommendations',p.recommendations,'presentation',pp.presentation) into legacy from (select 1) z left join concierge.publication_presentations pp on pp.client_id=c and pp.version=p.version;
  doc:=concierge.plan_client_content(concierge.plan_legacy_content(c,p.version));
  plan_info:=jsonb_build_object('documentSchemaVersion',case when legacy->'presentation'='null'::jsonb then 1 else 2 end,'version',p.version,'publishedAt',p.published_at,'content',doc,'legacyOriginal',legacy);
 end if;
 with historical as (
  select coalesce(card.value->>'id',st.recommendation_id) decision_id,st.choice,st.reason from concierge.item_states st left join concierge.publication_presentations pp on pp.client_id=st.client_id and pp.version=st.version left join lateral (select value from jsonb_array_elements(pp.presentation->'categoryCards') where value->>'recommendationId'=st.recommendation_id) card on true where st.client_id=c and st.version=p.version and st.choice is not null
 ),responses as (
  select pd.decision_id,pd.choice,pd.reason from concierge.plan_decisions pd where pd.client_id=c and pd.version=p.version
  union all select h.* from historical h where not exists(select 1 from concierge.plan_decisions pd where pd.client_id=c and pd.version=p.version and pd.decision_id=h.decision_id)
 ) select coalesce(jsonb_agg(jsonb_build_object('decisionId',decision_id,'choice',choice,'reason',reason) order by decision_id),'[]'::jsonb) into states from responses;
 select coalesce(h.revision,0) into revision from concierge.plan_decision_heads h where client_id=c;
 entitled:=exists(select 1 from concierge.entitled_publications where client_id=c and version=p.version);
 care:=case when not exists(select 1 from concierge.entitled_publications where client_id=c) then 'preparation' else concierge.plan_care_window(c) end;
 if care='expired' then care:='ended';end if;
 readable:=entitled and care in ('active','read_only');writable:=readable and care='active' and exists(select 1 from concierge.enrollments where client_id=c and status='active');
 select jsonb_build_object('firstPublicationAt',first_publication_at,'twoWeekOn',two_week_on,'monthOneOn',month_one_on,'monthTwoOn',month_two_on,'monthThreeOn',month_three_on) into schedule from concierge.plan_review_schedule where client_id=c;
 return jsonb_build_object('schemaVersion',1,'clientId',c,'version',p.version,'plan',plan_info,'decisionRevision',coalesce(revision,0),'decisions',states,'actualUse',coalesce((select jsonb_agg(jsonb_build_object('slot',act.slot,'productId',act.product_id,'startedOn',act.started_on,'publicationVersion',act.version) order by act.slot) from (select distinct on(slot) slot,product_id,started_on,version,id from concierge.activations where client_id=c and started_on<=(clock_timestamp() at time zone 'America/Chicago')::date order by slot,started_on desc,id desc) act),'[]'::jsonb),'nextReviewOn',(select next_checkin_on from concierge.checkin_heads where client_id=c),'reviewSchedule',schedule,'clientAccess',jsonb_build_object('care',care,'entitled',entitled,'canRead',readable,'canWrite',writable));
end $$;

create function public.concierge_plan_command_v1(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a text:=p_command->>'action';pr concierge.plan_principals;pol concierge.plan_policy;d concierge.plan_drafts;did uuid;c uuid;g uuid;old_c uuid;v integer;pub jsonb;approval jsonb;caps jsonb;result jsonb;begin
 if a is null or a not in ('read_advisor_gate_v1','read_advisor_publication_v1') then return concierge.plan_command_base_v1(p_command);end if;
 if pg_column_size(p_command)>500000 or jsonb_typeof(p_command) is distinct from 'object' then perform concierge.fail('invalid_input');end if;
 perform concierge.plan_shape(p_command,jsonb_build_object('type','object','fields',jsonb_build_object('schemaVersion',jsonb_build_object('type','enum','values',jsonb_build_array(1)),'action',jsonb_build_object('type','enum','values',jsonb_build_array(a)))||(concierge.plan_command_fields()->a)));
 pr:=concierge.plan_advisor_read_guard();select * into pol from concierge.plan_policy where singleton;
 if a='read_advisor_gate_v1' then
  did:=(p_command->'target'->>'draftId')::uuid;c:=(p_command->'target'->>'clientId')::uuid;pub:=p_command->'publisher';
 else
  c:=(p_command->>'clientId')::uuid;v:=(p_command->>'version')::integer;
  if v is null then select published_version into v from concierge.cases where client_id=c;end if;
  select pa.draft_id into did from concierge.plan_documents pd join concierge.plan_approvals pa on pa.id=pd.approval_id where pd.client_id=c and pd.version=v;
 end if;
 g:=concierge.plan_advisor_read_authorize(a,did,c);
 -- Publisher locks precede client/draft locks just as the write path's principal/grant locks do.
 if a='read_advisor_gate_v1' then
  perform concierge.plan_read_human_live(pol.owner_actor_id);
  perform concierge.plan_read_publisher_live(pub,did,c,false);
 end if;
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||c::text,0));
 perform concierge.plan_target_client(c,false);
 if a='read_advisor_gate_v1' then
  select * into d from concierge.plan_drafts where id=did for share;
  if not found then perform concierge.fail('not_found');end if;
  perform ps.id from concierge.plan_sources ps where ps.id in (select (loc->>'sourceId')::uuid from concierge.plan_draft_private dp cross join lateral jsonb_array_elements(dp.content->'context'->'facts') f cross join lateral jsonb_array_elements(f->'sources') loc where dp.draft_id=did) order by ps.id for share;
  if d.client_id is distinct from c or concierge.plan_exact(d) is distinct from p_command->'target' then perform concierge.fail('revision_conflict');end if;
  approval:=concierge.plan_read_current_approval(d,pub);caps:=concierge.plan_read_capabilities(d,g);
  result:=jsonb_build_object('schemaVersion',1,'clientId',c,'target',p_command->'target','publisher',pub,'approval',approval,'publication',case when (select published_version from concierge.cases where client_id=c)=0 then 'first' else 'later' end,'coverage',case when concierge.plan_care_window(c)='active' and exists(select 1 from concierge.enrollments where client_id=c and status='active') then 'active' else 'inactive' end,'capabilities',caps,'policy',jsonb_build_object('revision',pol.revision,'ownerActorId',pol.owner_actor_id,'requireKanujApproval',pol.require_kanuj_approval));
 else
  -- Resolve current again after the client lock; draft-scoped tasks must match that exact version.
  v:=(p_command->>'version')::integer;if v is null then select published_version into v from concierge.cases where client_id=c;end if;
  select pa.draft_id into did from concierge.plan_documents pd join concierge.plan_approvals pa on pa.id=pd.approval_id where pd.client_id=c and pd.version=v;
  g:=concierge.plan_advisor_read_authorize(a,did,c,g);
  result:=concierge.plan_advisor_publication(c,v);
 end if;
 -- Fresh snapshots and clock_timestamp after every potentially waiting authorization/target read.
 perform concierge.plan_advisor_read_authorize(a,did,c,g);
 perform concierge.plan_target_client(c,false);
 perform concierge.plan_advisor_read_guard();
 if a='read_advisor_gate_v1' and concierge.plan_exact(d) is distinct from p_command->'target' then perform concierge.fail('revision_conflict');end if;
 return result;
end $$;
-- No new public endpoint, raw table/helper privilege, global agent right or service-role read.
revoke all on function concierge.plan_command_base_v1(jsonb),
 concierge.plan_command_fields_base_v1(),
 concierge.plan_command_fields(),
 concierge.plan_advisor_read_guard(),
 concierge.plan_advisor_read_authorize(text,uuid,uuid,uuid),
 concierge.plan_read_human_live(uuid),
 concierge.plan_read_sources_live(jsonb,uuid,uuid,uuid,uuid),
 concierge.plan_read_publisher_live(jsonb,uuid,uuid,boolean),
 concierge.plan_read_current_approval(concierge.plan_drafts,jsonb),
 concierge.plan_read_capabilities(concierge.plan_drafts,uuid),
 concierge.plan_advisor_publication(uuid,integer) from public,anon,authenticated,service_role;
revoke all on function public.concierge_plan_command_v1(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.concierge_plan_command_v1(jsonb) to authenticated;
commit;
