-- Private capability walkthroughs. Schema only: no identities, permissions, case data or links.
-- Public wrappers are SECURITY INVOKER. The two private entry points have explicit
-- execute grants, pinned search paths and independent live authorization.
begin;
create schema walkthroughs;
revoke all on schema walkthroughs from public,anon,authenticated,service_role;
create table walkthroughs.advisor_grants (
 user_id uuid primary key references auth.users(id),active boolean not null default false,
 can_view boolean not null default false,can_share boolean not null default false,
 check(not can_share or can_view)
);
create table walkthroughs.cases (
 id uuid primary key,title text not null check(length(title) between 1 and 200),
 status text not null check(status in ('draft','ready')),source_reference text not null check(length(source_reference) between 1 and 2048),
 latest_version_id uuid
);
create table walkthroughs.versions (
 id uuid primary key,case_id uuid not null references walkthroughs.cases(id),schema_version integer not null check(schema_version=1),
 created_at timestamptz not null,status text not null check(status in ('draft','ready')),snapshot jsonb not null,
 unique(case_id,id),check(octet_length(snapshot::text)<=1500000)
);
alter table walkthroughs.cases add foreign key(id,latest_version_id) references walkthroughs.versions(case_id,id);
create table walkthroughs.provenance (
 version_id uuid primary key references walkthroughs.versions(id),details jsonb not null,
 check(jsonb_typeof(details)='object' and octet_length(details::text)<=100000)
);
create table walkthroughs.share_grants (
 id uuid primary key default gen_random_uuid(),case_id uuid not null,version_id uuid not null,
 secret_digest text not null unique check(secret_digest ~ '^[a-f0-9]{64}$'),
 created_by uuid not null references auth.users(id),created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null,revoked_at timestamptz,
 foreign key(case_id,version_id) references walkthroughs.versions(case_id,id),check(expires_at>created_at)
);
create table walkthroughs.requests (
 actor_id uuid not null references auth.users(id),request_id uuid not null,fingerprint jsonb not null,
 grant_id uuid not null references walkthroughs.share_grants(id),primary key(actor_id,request_id)
);
create trigger versions_immutable before update or delete on walkthroughs.versions for each row execute function concierge.immutable();
create trigger provenance_immutable before update or delete on walkthroughs.provenance for each row execute function concierge.immutable();
alter table walkthroughs.advisor_grants enable row level security;
alter table walkthroughs.cases enable row level security;
alter table walkthroughs.versions enable row level security;
alter table walkthroughs.provenance enable row level security;
alter table walkthroughs.share_grants enable row level security;
alter table walkthroughs.requests enable row level security;
revoke all on all tables in schema walkthroughs from public,anon,authenticated,service_role;

create function walkthroughs.iso(t timestamptz) returns text language sql immutable set search_path='' as $$select to_char(t at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')$$;
create function walkthroughs.validate_snapshot(v jsonb) returns void language plpgsql set search_path='' as $$
declare stage jsonb;event jsonb;image jsonb;previous_day date;stage_day date;recs text[];baseline jsonb;begin
 perform concierge.keys(v,array['schemaVersion','caseId','versionId','presentation','stages']);
 if v->>'schemaVersion'<>'1' or jsonb_typeof(v->'schemaVersion')<>'number' or octet_length(v::text)>1500000 then perform concierge.fail('invalid_input');end if;
 if coalesce(v->>'caseId','') !~ '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$' or coalesce(v->>'versionId','') !~ '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$' then perform concierge.fail('invalid_input');end if;
 select coalesce(jsonb_agg(jsonb_build_object('slot',x->'slot','productId',x->'productId')),'[]'::jsonb) into baseline from jsonb_array_elements(v->'presentation'->'baselineRoutine')j(x) where x->>'kind'='product';
 perform concierge.validate_presentation(v->'presentation',baseline,null,false);
 for image in select jsonb_path_query(v->'presentation','$.**.imageUrl') loop
  if image<>'null'::jsonb and (image#>>'{}') !~ '^assets/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$' then perform concierge.fail('invalid_input');end if;
 end loop;
 perform concierge.validate_presentation_shape(v->'stages',$shape${"type":"array","min":1,"max":30,"item":{"type":"object","fields":{"id":{"type":"identifier"},"title":{"type":"text","max":200},"section":{"type":"enum","values":["plan","routine","checkins","payments","profile","service"]},"day":{"type":"date"},"body":{"type":"text","max":4000,"empty":true},"messages":{"type":"array","min":0,"max":20,"item":{"type":"object","fields":{"speaker":{"type":"text","max":120},"text":{"type":"text","max":2000}}}},"events":{"optional":true,"type":"array","max":20,"item":{"type":"object","fields":{"action":{"type":"enum","values":["decide","receive","start"]},"recommendationId":{"type":"identifier"},"choice":{"type":"enum","values":["approved","declined"],"optional":true},"startedOn":{"type":"date","optional":true}}}},"review":{"optional":true,"type":"object","fields":{"channel":{"type":"enum","values":["text","phone","video","in_person"]},"occurredOn":{"type":"date"},"summary":{"type":"text","max":4000},"reportedUse":{"type":"text","max":4000},"decision":{"type":"text","max":4000},"nextReviewOn":{"type":"date"}}},"instructionUpdates":{"optional":true,"type":"array","max":20,"item":{"type":"object","fields":{"productKey":{"type":"identifier"},"reason":{"type":"text","max":2000},"instructions":{"type":"object","fields":{"morning":{"type":"text","max":2000,"optional":true},"evening":{"type":"text","max":2000,"optional":true},"notes":{"type":"text","max":2000,"optional":true}}}}}}}}}$shape$::jsonb);
 if (select count(distinct x->>'id') from jsonb_array_elements(v->'stages')j(x))<>jsonb_array_length(v->'stages') then perform concierge.fail('invalid_input');end if;
 select array_agg(x->>'recommendationId') into recs from jsonb_array_elements(v->'presentation'->'categoryCards')j(x) where x->>'recommendationId' is not null;
 for stage in select value from jsonb_array_elements(v->'stages') loop
  if stage->>'id' !~ '^[a-z0-9][a-z0-9-]*$' then perform concierge.fail('invalid_input');end if;
  stage_day:=(stage->>'day')::date;
  if previous_day>stage_day then perform concierge.fail('invalid_input');end if;previous_day:=stage_day;
  if stage ? 'review' and ((stage->'review'->>'occurredOn')::date>stage_day or (stage->'review'->>'nextReviewOn')::date<(stage->'review'->>'occurredOn')::date) then perform concierge.fail('invalid_input');end if;
  for event in select value from jsonb_array_elements(coalesce(stage->'events','[]'::jsonb)) loop
   if not coalesce((event->>'recommendationId')=any(recs),false) then perform concierge.fail('invalid_input');end if;
   perform concierge.keys(event,case event->>'action' when 'decide' then array['action','recommendationId','choice'] when 'start' then array['action','recommendationId','startedOn'] else array['action','recommendationId'] end);
   if event->>'action'='start' and (event->>'startedOn')::date>stage_day then perform concierge.fail('invalid_input');end if;
  end loop;
  for event in select value from jsonb_array_elements(coalesce(stage->'instructionUpdates','[]'::jsonb)) loop
   if event->'instructions'='{}'::jsonb or not exists(select 1 from jsonb_array_elements(v->'presentation'->'baselineRoutine')j(x) where x->>'productId'=event->>'productKey') and not exists(select 1 from jsonb_array_elements(v->'presentation'->'categoryCards')j(x) where x->'currentProduct'->>'id'=event->>'productKey' or x->'proposedProduct'->>'id'=event->>'productKey') then perform concierge.fail('invalid_input');end if;
  end loop;
 end loop;
end $$;

create function walkthroughs.live_access(sharing boolean default false) returns boolean language plpgsql security definer set search_path='' as $$
declare context jsonb;grant_row walkthroughs.advisor_grants;begin
 context:=public.concierge_advisor_session_context();
 select * into grant_row from walkthroughs.advisor_grants where user_id=auth.uid() and active and can_view for share;
 if not found or sharing and (not grant_row.can_share or not (context->'capabilities'->>'publish')::boolean) then raise exception using errcode='PT403',message='forbidden';end if;
 return grant_row.can_share and (context->'capabilities'->>'publish')::boolean;
end $$;
create function walkthroughs.grant_projection(g walkthroughs.share_grants) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',g.id,'caseId',g.case_id,'versionId',g.version_id,'createdBy',g.created_by,'createdAt',walkthroughs.iso(g.created_at),'expiresAt',walkthroughs.iso(g.expires_at),'revokedAt',walkthroughs.iso(g.revoked_at),'status',case when g.revoked_at is not null then 'revoked' when clock_timestamp()>=g.expires_at then 'expired' else 'active' end)
$$;
create function walkthroughs.advisor_command(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare action text:=p_command->>'action';can_share boolean;actor uuid:=auth.uid();c walkthroughs.cases;v walkthroughs.versions;g walkthroughs.share_grants;r walkthroughs.requests;v_request_id uuid;fingerprint jsonb;expiry timestamptz;created timestamptz;result jsonb;cursor jsonb;cursor_at timestamptz;cursor_id uuid;cursor_phase text;list_now timestamptz;page_count integer;last_grant walkthroughs.share_grants;next_cursor jsonb;begin
 can_share:=walkthroughs.live_access(action in ('share_create','share_revoke'));
 if action='library' then
  perform concierge.keys(p_command,array['action']);
  select coalesce(jsonb_agg(jsonb_build_object('caseId',x.id,'title',x.title,'status',x.status,'versionId',x.latest_version_id,'createdAt',walkthroughs.iso(y.created_at),'sourceReference',x.source_reference,'canShare',can_share) order by x.title),'[]'::jsonb) into result from walkthroughs.cases x left join walkthroughs.versions y on y.id=x.latest_version_id;
  return jsonb_build_object('schemaVersion',1,'entries',result);
 end if;
 if action not in ('open','share_list','share_create','share_revoke') or action is null then raise exception using errcode='PT403',message='action_forbidden';end if;
 select * into c from walkthroughs.cases where id=(p_command->>'caseId')::uuid for share;
 if not found then raise exception using errcode='PT404',message='unavailable';end if;
 if action='open' then
  perform concierge.keys(p_command,array['action','caseId']||case when p_command ? 'versionId' then array['versionId'] else array[]::text[] end);
  select * into v from walkthroughs.versions where case_id=c.id and id=coalesce((p_command->>'versionId')::uuid,c.latest_version_id);
  if not found then raise exception using errcode='PT404',message='unavailable';end if;
  perform walkthroughs.validate_snapshot(v.snapshot);
  return jsonb_build_object('schemaVersion',1,'snapshot',v.snapshot);
 elsif action='share_list' then
  perform concierge.keys(p_command,array['action','caseId']||case when p_command ? 'cursor' then array['cursor'] else array[]::text[] end);
  cursor:=p_command->'cursor';list_now:=clock_timestamp();page_count:=0;result:='[]'::jsonb;
  if cursor is not null then
   perform concierge.keys(cursor,array['phase','createdAt','id']);
   if coalesce(cursor->>'phase','') not in ('active','inactive') or coalesce(cursor->>'createdAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' or coalesce(cursor->>'id','') !~ '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$' then perform concierge.fail('invalid_input');end if;
   cursor_phase:=cursor->>'phase';cursor_at:=(cursor->>'createdAt')::timestamptz;cursor_id:=(cursor->>'id')::uuid;
  end if;
  -- Every active link comes first. Keyset pagination also preserves a complete
  -- management path for pre-cap stores with more than 200 active links.
  -- Sort at response precision so sub-millisecond DB timestamps cannot skip rows.
  for g in select x.* from walkthroughs.share_grants x where x.case_id=c.id and (
   cursor is null or cursor_phase='active' and ((x.revoked_at is not null or x.expires_at<=list_now) or (date_trunc('milliseconds',x.created_at),x.id)<(cursor_at,cursor_id))
   or cursor_phase='inactive' and (x.revoked_at is not null or x.expires_at<=list_now) and (date_trunc('milliseconds',x.created_at),x.id)<(cursor_at,cursor_id))
   order by (x.revoked_at is null and x.expires_at>list_now) desc,date_trunc('milliseconds',x.created_at) desc,x.id desc limit 201 loop
   page_count:=page_count+1;if page_count>200 then exit;end if;
   result:=result||jsonb_build_array(walkthroughs.grant_projection(g));last_grant:=g;
  end loop;
  next_cursor:=case when page_count>200 then jsonb_build_object('phase',case when last_grant.revoked_at is null and last_grant.expires_at>list_now then 'active' else 'inactive' end,'createdAt',walkthroughs.iso(last_grant.created_at),'id',last_grant.id) else null end;
  return jsonb_build_object('schemaVersion',1,'grants',result,'nextCursor',next_cursor);
 end if;
 if action='share_create' then perform concierge.keys(p_command,array['action','caseId','versionId','requestId','digest']||case when p_command ? 'expiresAt' then array['expiresAt'] else array[]::text[] end);
 else perform concierge.keys(p_command,array['action','caseId','grantId','requestId']);end if;
 v_request_id:=(p_command->>'requestId')::uuid;
 if v_request_id is null then perform concierge.fail('invalid_input');end if;
 perform pg_advisory_xact_lock(hashtextextended('walkthroughs:request:'||actor::text||':'||v_request_id::text,0));
 fingerprint:=p_command-'requestId';
 select * into r from walkthroughs.requests where actor_id=actor and requests.request_id=v_request_id;
 if found then
  if r.fingerprint<>fingerprint then raise exception using errcode='PT409',message='request_conflict';end if;
  select * into g from walkthroughs.share_grants where id=r.grant_id;
  return jsonb_build_object('schemaVersion',1,'grant',walkthroughs.grant_projection(g));
 end if;
 if action='share_create' then
  -- Serialize the active count and insert per case; exact retries already returned.
  perform pg_advisory_xact_lock(hashtextextended('walkthroughs:active-grants:'||c.id::text,0));
  select * into v from walkthroughs.versions where case_id=c.id and id=(p_command->>'versionId')::uuid;
  if not found or c.status<>'ready' or v.status<>'ready' then raise exception using errcode='PT409',message='not_ready';end if;
  perform walkthroughs.validate_snapshot(v.snapshot);
  if coalesce(p_command->>'digest','') !~ '^[a-f0-9]{64}$' then perform concierge.fail('invalid_input');end if;
  created:=clock_timestamp();expiry:=coalesce((p_command->>'expiresAt')::timestamptz,created+interval '720 hours');
  if expiry<=created or expiry>created+interval '2160 hours' then raise exception using errcode='PT400',message='invalid_expiry';end if;
  if exists(select 1 from walkthroughs.share_grants where secret_digest=p_command->>'digest') then raise exception using errcode='PT409',message='request_conflict';end if;
  if (select count(*) from walkthroughs.share_grants where case_id=c.id and revoked_at is null and expires_at>clock_timestamp())>=100 then raise exception using errcode='PT409',message='share_limit_reached';end if;
  insert into walkthroughs.share_grants(case_id,version_id,secret_digest,created_by,created_at,expires_at) values(c.id,v.id,p_command->>'digest',actor,created,expiry) returning * into g;
 else
  select * into g from walkthroughs.share_grants where id=(p_command->>'grantId')::uuid and case_id=c.id for update;
  if not found then raise exception using errcode='PT404',message='unavailable';end if;
  update walkthroughs.share_grants set revoked_at=coalesce(revoked_at,clock_timestamp()) where id=g.id returning * into g;
 end if;
 insert into walkthroughs.requests(actor_id,request_id,fingerprint,grant_id) values(actor,v_request_id,fingerprint,g.id);
 return jsonb_build_object('schemaVersion',1,'grant',walkthroughs.grant_projection(g));
end $$;

create function walkthroughs.capability_read(p_digest text) returns jsonb language plpgsql security definer set search_path='' as $$
declare g walkthroughs.share_grants;v walkthroughs.versions;begin
 if p_digest is null or p_digest !~ '^[a-f0-9]{64}$' then return null;end if;
 select x.* into g from walkthroughs.share_grants x join walkthroughs.cases c on c.id=x.case_id where x.secret_digest=p_digest and x.revoked_at is null and clock_timestamp()<x.expires_at and c.status='ready' for share of x,c;
 if not found then return null;end if;
 select * into v from walkthroughs.versions where id=g.version_id and case_id=g.case_id and status='ready';
 if not found then return null;end if;
 perform walkthroughs.validate_snapshot(v.snapshot);
 return v.snapshot;
end $$;
create function walkthroughs.private_import(p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c jsonb:=p_input->'case';v jsonb:=p_input->'version';snapshot jsonb;v_case_id uuid;v_version_id uuid;prior walkthroughs.versions;begin
 perform concierge.keys(p_input,array['schemaVersion','case','version']);perform concierge.keys(c,array['id','title','status','sourceReference']);perform concierge.keys(v,array['id','createdAt','presentation','stages','provenance']);
 if p_input->>'schemaVersion'<>'1' or jsonb_typeof(p_input->'schemaVersion')<>'number' or c->>'status' not in ('draft','ready') or jsonb_typeof(v->'provenance')<>'object' then perform concierge.fail('invalid_input');end if;
 perform concierge.txt(c,'title',200);perform concierge.txt(c,'sourceReference',2048);
 snapshot:=jsonb_build_object('schemaVersion',1,'caseId',c->'id','versionId',v->'id','presentation',v->'presentation','stages',v->'stages');perform walkthroughs.validate_snapshot(snapshot);
 v_case_id:=(c->>'id')::uuid;v_version_id:=(v->>'id')::uuid;
 perform pg_advisory_xact_lock(hashtextextended('walkthroughs:case:'||v_case_id::text,0));
 select * into prior from walkthroughs.versions where id=v_version_id;
 if found then
  if prior.case_id<>v_case_id or prior.snapshot<>snapshot or prior.created_at<>(v->>'createdAt')::timestamptz or prior.status<>c->>'status' or (select details from walkthroughs.provenance where provenance.version_id=v_version_id)<>v->'provenance' or (select latest_version_id from walkthroughs.cases where id=v_case_id)<>v_version_id then raise exception using errcode='PT409',message='immutable_version';end if;
 else
  insert into walkthroughs.cases(id,title,status,source_reference) values(v_case_id,c->>'title',c->>'status',c->>'sourceReference') on conflict(id) do nothing;
  insert into walkthroughs.versions(id,case_id,schema_version,created_at,status,snapshot) values(v_version_id,v_case_id,1,(v->>'createdAt')::timestamptz,c->>'status',snapshot);
  insert into walkthroughs.provenance(version_id,details) values(v_version_id,v->'provenance');
 end if;
 update walkthroughs.cases set title=c->>'title',status=c->>'status',source_reference=c->>'sourceReference',latest_version_id=v_version_id where id=v_case_id;
 return jsonb_build_object('schemaVersion',1,'caseId',v_case_id,'versionId',v_version_id,'shareGrantsCreated',0);
end $$;

create function public.walkthrough_advisor_command(p_command jsonb) returns jsonb language sql security invoker set search_path='' as $$select walkthroughs.advisor_command(p_command)$$;
create function public.walkthrough_capability_read(p_digest text) returns jsonb language sql security invoker set search_path='' as $$select walkthroughs.capability_read(p_digest)$$;
create function public.walkthrough_private_import(p_input jsonb) returns jsonb language sql security invoker set search_path='' as $$select walkthroughs.private_import(p_input)$$;
revoke all on all functions in schema walkthroughs from public,anon,authenticated,service_role;
revoke all on function public.walkthrough_advisor_command(jsonb),public.walkthrough_capability_read(text),public.walkthrough_private_import(jsonb) from public,anon,authenticated,service_role;
grant usage on schema walkthroughs to authenticated,service_role;
grant execute on function public.walkthrough_advisor_command(jsonb),walkthroughs.advisor_command(jsonb) to authenticated;
grant execute on function public.walkthrough_capability_read(text),walkthroughs.capability_read(text),public.walkthrough_private_import(jsonb),walkthroughs.private_import(jsonb) to service_role;
commit;
