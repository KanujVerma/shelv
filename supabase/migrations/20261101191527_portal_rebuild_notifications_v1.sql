-- D33/D34 notification kernel SOURCE. Canonical pgTAP authored separately; execution UNGRANTED.
-- Existing events/deliveries/attempts and four service RPC bodies remain unchanged.
begin;
create table concierge.notification_requests (
 actor_id uuid not null references auth.users on delete cascade,
 request_id uuid not null, command jsonb not null, fingerprint text not null,
 event_id uuid not null, delivery_id uuid not null, result jsonb not null,
 recorded_at timestamptz not null default clock_timestamp(), primary key(actor_id,request_id)
);
alter table concierge.notification_requests enable row level security;
revoke all on concierge.notification_requests from public,anon,authenticated,service_role;

-- N1: extend the existing shared trigger in place, preserving its OID/ACL and old bindings.
create or replace function concierge.review_request_collision() returns trigger language plpgsql set search_path='' as $$declare t text;exists_other boolean;begin
 perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||new.actor_id::text||':'||new.request_id::text,0));
 foreach t in array array['plan_requests','requests','workflow_requests','care_requests','review_requests','notification_requests'] loop
  if t=TG_TABLE_NAME then continue;end if;
  execute format('select exists(select 1 from concierge.%I where actor_id=$1 and request_id=$2)',t) into exists_other using new.actor_id,new.request_id;
  if exists_other then perform concierge.fail('request_conflict');end if;
 end loop;return new;
end $$;
create trigger review_request_collision before insert on concierge.notification_requests for each row execute function concierge.review_request_collision();
create trigger notification_requests_immutable before update on concierge.notification_requests for each row execute function concierge.immutable();

create function concierge.notification_identity(u uuid) returns void language plpgsql set search_path='' as $$begin
 perform concierge.target(u);
 perform 1 from auth.users where id=u and is_anonymous is false and deleted_at is null and (banned_until is null or banned_until<=clock_timestamp()) for share;
 if not found then perform concierge.fail('forbidden');end if;
 -- A known revoked principal or agent never becomes an ordinary client by omission.
 perform 1 from concierge.plan_principals where actor_id=u for share;
 if exists(select 1 from concierge.plan_principals where actor_id=u and (not active or kind='agent')) then perform concierge.fail('forbidden');end if;
end $$;
create function concierge.notification_human(u uuid,writing boolean) returns void language plpgsql set search_path='' as $$declare p concierge.plan_principals;pol concierge.plan_policy;begin
 perform concierge.notification_identity(u);
 select * into pol from concierge.plan_policy where singleton for share;
 select * into p from concierge.plan_principals where actor_id=u for share;
 if not pol.activated or p.actor_id is null or not p.active or p.kind not in ('owner','human') or (p.kind='owner') is distinct from (pol.owner_actor_id=u) then perform concierge.fail('forbidden');end if;
 perform concierge.capability(u,case when writing then 'edit' else 'view' end);
 perform concierge.notification_identity(u);
end $$;
create function concierge.notification_actor(advisor boolean default false,writing boolean default false) returns uuid language plpgsql set search_path='' as $$declare u uuid:=auth.uid();s uuid;pol concierge.plan_policy;begin
 begin s:=(auth.jwt()->>'session_id')::uuid;exception when invalid_text_representation then perform concierge.fail('session_ended');end;
 if u is null or s is null then perform concierge.fail('session_ended');end if;
 perform concierge.plan_session(u,s);perform concierge.notification_identity(u);
 select * into pol from concierge.plan_policy where singleton for share;
 if pol.activated is distinct from true then perform concierge.fail('candidate_inactive');end if;
 if advisor or exists(select 1 from concierge.plan_principals where actor_id=u and kind in ('owner','human')) then perform concierge.notification_human(u,writing);
 else
  if exists(select 1 from concierge.advisors where user_id=u and active) then perform concierge.fail('forbidden');end if;
  perform concierge.plan_target_client(u,false);
 end if;
 perform concierge.plan_session(u,s);return u;
end $$;

-- Resolve immutable source identities against the ACTUAL stored producer, never a claim payload.
create function concierge.notification_event(e concierge.plan_events) returns jsonb language plpgsql set search_path='' as $$declare src jsonb;dest jsonb;g concierge.review_guidance_outputs;begin
 if e.source_kind='publication' and e.kind='plan_published' and e.source_id is null and e.source_version is null then
  if not exists(select 1 from concierge.publications where client_id=e.client_id and version=e.publication_version) then perform concierge.fail('not_found');end if;
  src:=jsonb_build_object('kind','publication','publicationVersion',e.publication_version);dest:=jsonb_build_object('kind','plan_version','version',e.publication_version);
 elsif e.source_kind='guidance' and e.kind in ('review_published','instruction_published','reply_published') then
  select * into g from concierge.review_guidance_outputs where id=e.source_id and client_id=e.client_id and event_id=e.id and output_version=e.source_version and kind||'_published'=e.kind and (body->'publication'->>'version')::integer=e.publication_version;
  if not found then perform concierge.fail('not_found');end if;
  src:=jsonb_build_object('kind','guidance','recordId',g.id,'version',g.output_version,'eventKind',e.kind);dest:=jsonb_build_object('kind','public_history','recordKind',g.kind,'recordId',g.id);
 elsif e.source_kind='care' and e.kind in ('use_reported','use_amended','report_amended') then
  if not exists(select 1 from concierge.care_events c join concierge.care_attention a on a.event_id=c.id and a.notification_event_id=e.id where c.id=e.source_id and c.client_id=e.client_id and c.revision=e.source_version) then perform concierge.fail('not_found');end if;
  src:=jsonb_build_object('kind','care','recordId',e.source_id,'version',e.source_version,'eventKind',e.kind);dest:=jsonb_build_object('kind','unavailable','reason','advisor_review_resolution_unavailable');
 elsif e.source_kind='review' and e.kind in ('goal_reported','conversation_recorded','report_amended') then
  if not exists(select 1 from concierge.review_requests r where r.client_id=e.client_id and r.family='review' and r.result->>'notificationEventId'=e.id::text and (r.result->>'revision')::bigint=e.source_version) then perform concierge.fail('not_found');end if;
  if not (e.kind='goal_reported' and exists(select 1 from concierge.review_goal_reports where report_id=e.source_id and client_id=e.client_id)
   or e.kind='conversation_recorded' and exists(select 1 from concierge.review_conversations where id=e.source_id and client_id=e.client_id)
   or e.kind='report_amended' and exists(select 1 from concierge.review_report_amendments where id=e.source_id and client_id=e.client_id)) then perform concierge.fail('not_found');end if;
  src:=jsonb_build_object('kind','review','recordId',e.source_id,'version',e.source_version,'eventKind',e.kind);dest:=jsonb_build_object('kind','unavailable','reason','advisor_review_resolution_unavailable');
 else perform concierge.fail('not_found');end if;
 return jsonb_build_object('eventId',e.id,'createdAt',concierge.care_instant(e.created_at),'source',src,'destination',dest);
end $$;
create function concierge.notification_eligible(e concierge.plan_events,u uuid,ch text) returns boolean language plpgsql set search_path='' as $$declare enabled boolean;begin
 if ch not in ('portal','email') then return false;end if;
 perform 1 from concierge.plan_policy where singleton and activated for share;if not found then return false;end if;
 perform concierge.notification_identity(u);perform concierge.plan_target_client(e.client_id,false);perform concierge.notification_event(e);
 if u=e.client_id then
  if e.source_kind not in ('publication','guidance') or exists(select 1 from concierge.advisors where user_id=u and active) then return false;end if;
  perform concierge.plan_care_access(u,false);
  return exists(select 1 from concierge.entitled_publications where client_id=u and version=e.publication_version);
 end if;
 if e.source_kind not in ('care','review') then return false;end if;
 -- Reuse the actual emission eligibility: view+edit human, current exact route, configured email.
 perform concierge.notification_human(u,true);
 perform 1 from concierge.care_attention_routes where client_id=e.client_id order by advisor_id for share;
 select email_enabled into enabled from concierge.care_attention_routes where client_id=e.client_id and advisor_id=u;
 if found then return ch='portal' or enabled;end if;
 return ch='portal' and not exists(select 1 from concierge.care_attention_routes where client_id=e.client_id) and u=(select owner_actor_id from concierge.plan_policy where singleton);
 exception when sqlstate 'P0001' then return false;
end $$;
create function concierge.notification_event_authority(e concierge.plan_events,writing boolean) returns void language plpgsql set search_path='' as $$begin
 perform concierge.notification_actor(true,writing);perform concierge.plan_target_client(e.client_id,false);perform concierge.notification_event(e);
 -- Status/retry is operational authority, not a publication, care write or source read.
 perform concierge.notification_human(auth.uid(),writing);
end $$;
create function concierge.notification_delivery_target(d concierge.plan_deliveries,action text) returns concierge.plan_events language plpgsql set search_path='' as $$declare e concierge.plan_events;phase integer;begin
 if action='mark_seen_v1' and (d.channel<>'portal' or d.recipient_id is distinct from auth.uid()) then perform concierge.fail('not_found');end if;
 select * into e from concierge.plan_events where id=d.event_id;
 if not found then perform concierge.fail('not_found');end if;
 -- First authorize the actual target, then lock it and repeat after that wait.
 for phase in 1..2 loop
  if action='mark_seen_v1' then
   perform concierge.notification_actor();if not concierge.notification_eligible(e,auth.uid(),'portal') then perform concierge.fail('not_found');end if;
  else
   perform concierge.notification_event_authority(e,true);
   if d.channel<>'email' then perform concierge.fail('not_found');end if;
   if not concierge.notification_eligible(e,d.recipient_id,'email') then perform concierge.fail('forbidden');end if;
  end if;
  if phase=1 then select * into e from concierge.plan_events where id=d.event_id for share;if not found then perform concierge.fail('not_found');end if;end if;
 end loop;return e;
end $$;

create function concierge.notification_fields() returns jsonb language sql immutable set search_path='' as $fn$ select $shape${"list_inbox_v1":{"cursor":{"type":"text","max":38,"empty":false,"nullable":true},"limit":{"type":"integer","min":1,"max":50}},"read_event_deliveries_v1":{"eventId":{"type":"uuid"},"cursor":{"type":"text","max":38,"empty":false,"nullable":true},"limit":{"type":"integer","min":1,"max":50}},"mark_seen_v1":{"requestId":{"type":"uuid"},"deliveryId":{"type":"uuid"},"expectedRevision":{"type":"integer","min":0,"max":9007199254740991}},"retry_failed_email_v1":{"requestId":{"type":"uuid"},"deliveryId":{"type":"uuid"},"expectedRevision":{"type":"integer","min":0,"max":9007199254740991}},"request_status_v1":{"original":{"type":"object","fields":{"schemaVersion":{"type":"enum","values":[1]},"action":{"type":"enum","values":["mark_seen_v1","retry_failed_email_v1"]},"requestId":{"type":"uuid"},"deliveryId":{"type":"uuid"},"expectedRevision":{"type":"integer","min":0,"max":9007199254740991}}}}}$shape$::jsonb $fn$;
create function concierge.notification_parse(v jsonb) returns jsonb language plpgsql set search_path='' as $$declare a text:=v->>'action';c jsonb;begin
 if a is null or not(concierge.notification_fields()?a) or concierge.review_bytes(v)>8192 then perform concierge.fail('invalid_input');end if;
 c:=concierge.review_shape_value(v,jsonb_build_object('type','object','fields',jsonb_build_object('schemaVersion',jsonb_build_object('type','enum','values','[1]'::jsonb),'action',jsonb_build_object('type','enum','values',jsonb_build_array(a)))||(concierge.notification_fields()->a)));
 if c?'cursor' and c->'cursor'<>'null'::jsonb and c->>'cursor' !~ '^n:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then perform concierge.fail('invalid_input');end if;
 return c;
end $$;
create function concierge.notification_command(v jsonb) returns jsonb language plpgsql set search_path='' as $$
declare cmd jsonb:=concierge.notification_parse(v);a text:=cmd->>'action';original jsonb;u uuid;req uuid;d concierge.plan_deliveries;e concierge.plan_events;prior concierge.notification_requests;result jsonb;items jsonb:='[]';item jsonb;email jsonb;cur uuid;last_id uuid;next_cur text;lim integer;before_revision bigint;at_time timestamptz;advisor boolean;begin
 original:=case when a='request_status_v1' then cmd->'original' else cmd end;
 advisor:=a='read_event_deliveries_v1' or original->>'action'='retry_failed_email_v1';
 u:=concierge.notification_actor(advisor,original->>'action'='retry_failed_email_v1');
 if a in ('list_inbox_v1','read_event_deliveries_v1') then
  cur:=case when cmd->'cursor'='null'::jsonb then null else substring(cmd->>'cursor' from 3)::uuid end;lim:=(cmd->>'limit')::integer;
  if a='read_event_deliveries_v1' then
   select * into e from concierge.plan_events where id=(cmd->>'eventId')::uuid;if not found then perform concierge.fail('not_found');end if;
   perform concierge.notification_event_authority(e,false);
   select * into e from concierge.plan_events where id=(cmd->>'eventId')::uuid for share;if not found then perform concierge.fail('not_found');end if;
   perform concierge.notification_event_authority(e,false);
  end if;
  -- Inspect at most limit raw rows. Invisible/revoked rows may produce an empty advancing page.
  for d in select x.* from concierge.plan_deliveries x where (cur is null or x.id>cur) and
   (a='list_inbox_v1' and x.recipient_id=u and x.channel='portal' or a='read_event_deliveries_v1' and x.event_id=e.id)
   order by x.id limit lim for share loop
   last_id:=d.id;
   if a='list_inbox_v1' then
    select * into e from concierge.plan_events where id=d.event_id;
    if not found or not concierge.notification_eligible(e,u,'portal') then continue;end if;
    select * into e from concierge.plan_events where id=d.event_id for share;
    if not found or not concierge.notification_eligible(e,u,'portal') then perform concierge.fail('forbidden');end if;
    select jsonb_build_object('status',x.status,'revision',x.revision) into email from concierge.plan_deliveries x where x.event_id=e.id and x.recipient_id=u and x.channel='email' for share;
    item:=jsonb_build_object('deliveryId',d.id,'revision',d.revision,'seenAt',case when d.seen_at is null then null else concierge.care_instant(d.seen_at) end,'event',concierge.notification_event(e),'email',email);
   else
    item:=jsonb_build_object('deliveryId',d.id,'channel',d.channel,'status',d.status,'revision',d.revision,'seenAt',case when d.channel='portal' and d.seen_at is not null then concierge.care_instant(d.seen_at) else null end);
   end if;
   items:=items||jsonb_build_array(item);
  end loop;
  if last_id is not null and exists(select 1 from concierge.plan_deliveries x where x.id>last_id and (a='list_inbox_v1' and x.recipient_id=u and x.channel='portal' or a='read_event_deliveries_v1' and x.event_id=(cmd->>'eventId')::uuid)) then next_cur:='n:'||last_id::text;end if;
  perform concierge.notification_actor(advisor,false);
  if a='read_event_deliveries_v1' then perform concierge.notification_event_authority(e,false);
  else
   for d in select x.* from concierge.plan_deliveries x where x.id in (select (x->>'deliveryId')::uuid from jsonb_array_elements(items) x) loop
    select * into e from concierge.plan_events where id=d.event_id;
    if not found or d.recipient_id<>u or not concierge.notification_eligible(e,u,'portal') then perform concierge.fail('forbidden');end if;
   end loop;
  end if;
  result:=jsonb_build_object('schemaVersion',1,'consistency','live_keyset','observedAt',concierge.care_instant(clock_timestamp()),'cursor',cmd->'cursor','items',items,'nextCursor',next_cur);
  if a='read_event_deliveries_v1' then result:=result||jsonb_build_object('event',concierge.notification_event(e));end if;
 else
  req:=(original->>'requestId')::uuid;
  -- A request status observes ONLY the matching original command, not a mutable live delivery.
  perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||u::text||':'||req::text,0));
  select * into prior from concierge.notification_requests where actor_id=u and request_id=req;
  if found and (prior.command is distinct from original or prior.fingerprint is distinct from concierge.plan_hash(original)) then perform concierge.fail('request_conflict');end if;
  select * into d from concierge.plan_deliveries where id=(original->>'deliveryId')::uuid;
  if not found then
   if a='request_status_v1' then perform concierge.notification_actor(advisor,advisor);return jsonb_build_object('status','unknown');end if;
   perform concierge.fail('not_found');
  end if;
  e:=concierge.notification_delivery_target(d,original->>'action');
  -- Lock only after current identity/target authorization, and recheck after the wait.
  select * into d from concierge.plan_deliveries where id=d.id for update;
  if not found then perform concierge.fail('not_found');end if;
  e:=concierge.notification_delivery_target(d,original->>'action');
  if a='request_status_v1' then
   perform concierge.notification_actor(advisor,advisor);perform concierge.notification_delivery_target(d,original->>'action');
   if prior.request_id is null then return jsonb_build_object('status','unknown');end if;
   if prior.event_id<>e.id or prior.delivery_id<>d.id then perform concierge.fail('request_conflict');end if;
   return jsonb_build_object('status','committed','receipt',prior.result);
  end if;
  if prior.request_id is not null then
   if prior.event_id<>e.id or prior.delivery_id<>d.id then perform concierge.fail('request_conflict');end if;
   perform concierge.notification_actor(advisor,advisor);perform concierge.notification_delivery_target(d,a);return prior.result;
  end if;
  if d.revision is distinct from (cmd->>'expectedRevision')::bigint then perform concierge.fail('revision_conflict');end if;
  before_revision:=d.revision;at_time:=clock_timestamp();
  if a='mark_seen_v1' then
   if d.seen_at is null then update concierge.plan_deliveries set seen_at=at_time,revision=revision+1,updated_at=at_time where id=d.id returning * into d;item:='"seen"'::jsonb;
   else item:='"already_seen"'::jsonb;end if;
  else
   if d.status='uncertain' then perform concierge.fail('reconciliation_unavailable');end if;
   if d.status<>'failed' then perform concierge.fail('revision_conflict');end if;
   -- Only FAILED. The existing uncertain reconciled=true path is never asserted here.
   perform concierge.plan_retry_email_delivery(d.id,d.revision,false);
   select * into d from concierge.plan_deliveries where id=d.id;item:='"retry_queued"'::jsonb;
  end if;
  result:=jsonb_build_object('requestId',req,'action',a,'deliveryId',d.id,'previousRevision',before_revision,'revision',d.revision,'recordedAt',concierge.care_instant(at_time),'effect',item);
  insert into concierge.notification_requests(actor_id,request_id,command,fingerprint,event_id,delivery_id,result) values(u,req,cmd,concierge.plan_hash(cmd),e.id,d.id,result);
  perform concierge.notification_actor(advisor,advisor);perform concierge.notification_delivery_target(d,a);
 end if;
 if concierge.review_bytes(result)>100000 then perform concierge.fail('unavailable');end if;
 perform concierge.notification_actor(advisor,original->>'action'='retry_failed_email_v1');return result;
end $$;
create function public.concierge_notification_command_v1(p_command jsonb) returns jsonb language sql security definer set search_path='' as $$select concierge.notification_command(p_command)$$;

create function concierge.notification_delivery_context(p_delivery_id uuid,p_lease_id uuid) returns jsonb language plpgsql set search_path='' as $$
declare d concierge.plan_deliveries;e concierge.plan_events;address text;result jsonb;begin
 if p_delivery_id is null or p_lease_id is null then perform concierge.fail('invalid_input');end if;
 select * into d from concierge.plan_deliveries where id=p_delivery_id and channel='email';
 if not found or d.lease_id is distinct from p_lease_id or d.status<>'claimed' or d.lease_until is null or d.lease_until<=clock_timestamp() then perform concierge.fail('revision_conflict');end if;
 select * into e from concierge.plan_events where id=d.event_id;
 if not found or not concierge.notification_eligible(e,d.recipient_id,'email') then perform concierge.fail('forbidden');end if;
 select * into d from concierge.plan_deliveries where id=p_delivery_id and channel='email' for share;
 if not found or d.lease_id is distinct from p_lease_id or d.status<>'claimed' or d.lease_until is null or d.lease_until<=clock_timestamp() then perform concierge.fail('revision_conflict');end if;
 select * into e from concierge.plan_events where id=d.event_id for share;
 if not found or not concierge.notification_eligible(e,d.recipient_id,'email') then perform concierge.fail('forbidden');end if;
 select email into address from auth.users where id=d.recipient_id and is_anonymous is false and deleted_at is null and email_confirmed_at is not null and (banned_until is null or banned_until<=clock_timestamp()) for share;
 if not found or address is null or length(address)>254 or address !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$' then perform concierge.fail('unavailable');end if;
 result:=jsonb_build_object('schemaVersion',1,'deliveryId',d.id,'leaseId',d.lease_id,'recipientId',d.recipient_id,'idempotencyKey',d.id,'leaseUntil',concierge.care_instant(d.lease_until),'recipient',jsonb_build_object('email',address),'event',concierge.notification_event(e));
 -- Final live check follows all potentially waiting locks. No browser-facing address projection.
 if not concierge.notification_eligible(e,d.recipient_id,'email') or d.lease_until<=clock_timestamp() then perform concierge.fail('forbidden');end if;
 if concierge.review_bytes(result)>8192 then perform concierge.fail('unavailable');end if;return result;
end $$;
create function public.concierge_plan_delivery_context_v1(p_delivery_id uuid,p_lease_id uuid) returns jsonb language sql security definer set search_path='' as $$select concierge.notification_delivery_context(p_delivery_id,p_lease_id)$$;
-- Private helpers/table have no direct API. Only two fixed wrappers receive narrow EXECUTE.
do $$declare f record;begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='concierge' and p.proname like 'notification\_%' escape '\' loop execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);end loop;
end $$;
revoke all on function public.concierge_notification_command_v1(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.concierge_notification_command_v1(jsonb) to authenticated;
revoke all on function public.concierge_plan_delivery_context_v1(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.concierge_plan_delivery_context_v1(uuid,uuid) to service_role;
commit;
