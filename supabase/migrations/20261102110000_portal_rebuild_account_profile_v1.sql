-- SOURCE candidate only; authored under an explicit one-migration reservation. UNRUN.
-- Approved exceptions: guarded append to the existing collision helper, preserving
-- identity/ACL/default attributes/bindings; one display_name UPDATE trigger.
begin;

create table concierge.account_profile_heads_v1 (
 client_id uuid primary key references concierge.enrollments(client_id) on delete cascade,
 revision bigint not null default 0 check(revision between 0 and 9007199254740991)
);
create table concierge.account_profile_requests_v1 (
 actor_id uuid not null references concierge.enrollments(client_id) on delete cascade,
 request_id uuid not null,
 fingerprint bytea not null check(octet_length(fingerprint)=32),
 previous_revision bigint not null check(previous_revision between 0 and 9007199254740991),
 revision bigint not null check(revision between previous_revision and least(previous_revision+1,9007199254740991)),
 recorded_at timestamptz not null,
 primary key(actor_id,request_id)
);
alter table concierge.account_profile_heads_v1 enable row level security;
alter table concierge.account_profile_requests_v1 enable row level security;
revoke all on concierge.account_profile_heads_v1,concierge.account_profile_requests_v1 from public,anon,authenticated,service_role;

-- Migration support, also exercised by the authored catalog-lineage pgTAP cases.
-- Fixed supported body hashes; actual catalog state supplies presence, not flags.
create function concierge.account_profile_collision_successor_v1(body text) returns text
language plpgsql set search_path='' as $$
declare t text;source_table regclass:=to_regclass('concierge.source_requests');
 account_table regclass:=to_regclass('concierge.source_account_requests');h text;
begin
 foreach t in array array['plan_requests','requests','workflow_requests','care_requests','review_requests','notification_requests'] loop
  if not exists(select 1 from pg_class where oid=to_regclass('concierge.'||t) and relkind='r') then raise exception 'account_profile_collision_tables_unsupported';end if;
 end loop;
 if source_table is not null and not exists(select 1 from pg_class where oid=source_table and relkind='r')
  or account_table is not null and not exists(select 1 from pg_class where oid=account_table and relkind='r') then raise exception 'account_profile_collision_tables_unsupported';end if;
 h:=encode(sha256(convert_to(body,'UTF8')),'hex');
 if h='26afa4244895b19a260c379b57a0c2a4292cd18983fa90241b805b8d102cc7dc' and source_table is null and account_table is null then
  return replace(body,'''notification_requests''] loop','''notification_requests'',''account_profile_requests_v1''] loop');
 elsif h='d5aa3b2a59c9f2cdf6cd10f67fa3d4f4bb8642d4cec56013255e1f029c418180' and source_table is not null and account_table is not null then
  return replace(body,'''source_account_requests''] loop','''source_account_requests'',''account_profile_requests_v1''] loop');
 else raise exception 'account_profile_collision_preimage_unsupported';end if;
end $$;
revoke all on function concierge.account_profile_collision_successor_v1(text) from public,anon,authenticated,service_role;

create temporary table account_profile_old_collision_v1 on commit drop as
 select oid,to_jsonb(p)-'prosrc' metadata from pg_proc p where oid='concierge.review_request_collision()'::regprocedure;
create temporary table account_profile_old_collision_bindings_v1 on commit drop as
 select oid,to_jsonb(t) metadata from pg_trigger t where tgfoid='concierge.review_request_collision()'::regprocedure;
do $extend$ declare body text;begin
 select concierge.account_profile_collision_successor_v1(prosrc) into body from pg_proc where oid='concierge.review_request_collision()'::regprocedure;
 if body is null then raise exception 'account_profile_collision_preimage_unsupported';end if;
 execute format('create or replace function concierge.review_request_collision() returns trigger language plpgsql set search_path='''' as %L',body);
 if not exists(select 1 from pg_temp.account_profile_old_collision_v1 b join pg_proc p on p.oid=b.oid where b.metadata is not distinct from to_jsonb(p)-'prosrc') then raise exception 'account_profile_collision_attributes_changed';end if;
 if exists(select 1 from pg_temp.account_profile_old_collision_bindings_v1 b left join pg_trigger t on t.oid=b.oid where t.oid is null or b.metadata is distinct from to_jsonb(t)) then raise exception 'account_profile_collision_bindings_changed';end if;
end $extend$;
create trigger review_request_collision before insert on concierge.account_profile_requests_v1 for each row execute function concierge.review_request_collision();
create trigger account_profile_requests_immutable_v1 before update on concierge.account_profile_requests_v1 for each row execute function concierge.immutable();

create function concierge.account_profile_name_changed_v1() returns trigger
language plpgsql set search_path='' as $$begin
 -- UPDATE already owns the canonical enrollment row, including legacy/admin updates.
 -- A lazy head starts at one if the first observed event is an actual name change.
 if new.display_name is distinct from old.display_name then
  insert into concierge.account_profile_heads_v1(client_id,revision) values(new.client_id,1)
  on conflict(client_id) do update set revision=concierge.account_profile_heads_v1.revision+1;
 end if;
 return new;
end $$;
create trigger account_profile_name_revision_v1 after update of display_name on concierge.enrollments
 for each row execute function concierge.account_profile_name_changed_v1();

-- No enrollment lock in this helper. In particular no SHARE -> UPDATE upgrade.
-- Original actor/session/expiry are captured by the public wrapper before any wait.
create function concierge.account_profile_authorize_v1(u uuid,s uuid,expiry numeric) returns void
language plpgsql set search_path='' as $$begin
 if u is null or auth.jwt()->>'role' is distinct from 'authenticated' then perform concierge.fail('unauthorized');end if;
 if auth.uid() is distinct from u or (auth.jwt()->>'session_id')::uuid is distinct from s
  or (auth.jwt()->>'exp')::numeric is distinct from expiry or s is null or expiry is null
  or expiry not between 0 and 9007199254740991 or expiry<>trunc(expiry)
  or expiry<=extract(epoch from clock_timestamp()) then perform concierge.fail('session_ended');end if;
 -- Verifies actual permanent auth.users (is_anonymous IS FALSE), soft deletion,
 -- ban, profiles.deletion_started_at, and the actual own provider auth.sessions row.
 perform concierge.plan_session(u,s);
 -- Account administration has no selected-client/advisor/task impersonation mode.
 if exists(select 1 from concierge.plan_principals where actor_id=u)
  or exists(select 1 from concierge.advisors where user_id=u and active) then perform concierge.fail('forbidden');end if;
 if expiry<=extract(epoch from clock_timestamp()) then perform concierge.fail('session_ended');end if;
end $$;

create function concierge.account_profile_projection_v1(u uuid) returns jsonb
language sql set search_path='' as $$
 select jsonb_build_object('schemaVersion',1,'profileRevision',h.revision,'displayName',e.display_name,
  'currentEmail',case when a.email is null or a.email='' then jsonb_build_object('state','unknown')
   else jsonb_build_object('state','known','address',a.email,'verified',a.email_confirmed_at is not null) end)
 from concierge.enrollments e join concierge.account_profile_heads_v1 h on h.client_id=e.client_id
 join auth.users a on a.id=e.client_id where e.client_id=u
$$;

create function public.concierge_account_profile_command_v1(p_command jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid();s uuid;expiry numeric;action text;enrollment concierge.enrollments;
 head bigint;expected bigint;request uuid;fingerprint bytea;prior concierge.account_profile_requests_v1;
 accepted_name text;result jsonb;before_view jsonb;now_at timestamptz;
begin
 -- Capture actual caller context before the first potentially waiting operation.
 if u is null or auth.jwt()->>'role' is distinct from 'authenticated' then perform concierge.fail('unauthorized');end if;
 begin s:=(auth.jwt()->>'session_id')::uuid;expiry:=(auth.jwt()->>'exp')::numeric;
 exception when invalid_text_representation or numeric_value_out_of_range then perform concierge.fail('session_ended');end;
 perform concierge.account_profile_authorize_v1(u,s,expiry);
 if p_command is null or jsonb_typeof(p_command) is distinct from 'object' then perform concierge.fail('invalid_input');end if;
 if octet_length(convert_to(p_command::text,'UTF8'))>8192 then perform concierge.fail('too_large');end if;
 action:=p_command->>'action';
 if action='read_account_profile_v1' then perform concierge.keys(p_command,array['schemaVersion','action']);
 elsif action='set_account_display_name_v1' then
  perform concierge.keys(p_command,array['schemaVersion','action','requestId','expectedRevision','displayName']);
  perform concierge.plan_shape(p_command->'requestId','{"type":"uuid"}');
  perform concierge.plan_shape(p_command->'expectedRevision','{"type":"integer","min":0,"max":9007199254740991}');
  if jsonb_typeof(p_command->'displayName') is distinct from 'string'
   or length(concierge.trim_text(p_command->>'displayName')) not between 1 and 200 then perform concierge.fail('invalid_input');end if;
  accepted_name:=p_command->>'displayName';request:=(p_command->>'requestId')::uuid;expected:=(p_command->>'expectedRevision')::numeric::bigint;
 else perform concierge.fail('invalid_input');end if;
 if p_command->'schemaVersion' is distinct from '1'::jsonb then perform concierge.fail('invalid_input');end if;

 -- Both read and write use this order. Another same-actor command waits here,
 -- without holding an enrollment SHARE lock. Legacy UPDATE uses row -> trigger/head.
 select * into enrollment from concierge.enrollments where client_id=u for update;
 perform concierge.account_profile_authorize_v1(u,s,expiry);
 if enrollment.client_id is null or enrollment.status='revoked'
  or not exists(select 1 from concierge.cases where client_id=u) then perform concierge.fail('forbidden');end if;
 if action='set_account_display_name_v1' then
  -- Existing families have varied earlier request/client/scope locks. Never WAIT
  -- on their actor/request lock while holding this canonical enrollment row.
  if not pg_try_advisory_xact_lock(hashtextextended('concierge:request:'||u::text||':'||request::text,0)) then perform concierge.fail('unavailable');end if;
  perform concierge.account_profile_authorize_v1(u,s,expiry);
 end if;
 -- Cancelled/ended clients retain own account administration, with no care grant.
 insert into concierge.account_profile_heads_v1(client_id) values(u) on conflict do nothing;
 select revision into head from concierge.account_profile_heads_v1 where client_id=u for update;
 perform concierge.account_profile_authorize_v1(u,s,expiry);
 before_view:=concierge.account_profile_projection_v1(u);

 if action='read_account_profile_v1' then result:=before_view;
 else
  -- JSONB canonical fingerprint binds the full original accepted command; no
  -- secondary name/email/command copies are persisted in this minimal journal.
  fingerprint:=sha256(convert_to(p_command::text,'UTF8'));
  select * into prior from concierge.account_profile_requests_v1 where actor_id=u and request_id=request;
  if found then
   if prior.fingerprint is distinct from fingerprint then perform concierge.fail('request_conflict');end if;
   -- Reconstruct ONLY from the same verified original payload. This acknowledges
   -- the original value even if another writer subsequently changed the profile.
   result:=jsonb_build_object('schemaVersion',1,'requestId',request,'action',action,'previousRevision',prior.previous_revision,
    'revision',prior.revision,'displayName',accepted_name,'recordedAt',concierge.care_instant(prior.recorded_at));
  else
   if head<>expected then perform concierge.fail('revision_conflict');end if;
   if enrollment.display_name is distinct from accepted_name then
    if head=9007199254740991 then perform concierge.fail('unavailable');end if;
    update concierge.enrollments set display_name=accepted_name where client_id=u;
   end if;
   select revision into head from concierge.account_profile_heads_v1 where client_id=u;
   now_at:=clock_timestamp();
   insert into concierge.account_profile_requests_v1(actor_id,request_id,fingerprint,previous_revision,revision,recorded_at)
    values(u,request,fingerprint,expected,head,now_at);
   result:=jsonb_build_object('schemaVersion',1,'requestId',request,'action',action,'previousRevision',expected,
    'revision',head,'displayName',accepted_name,'recordedAt',concierge.care_instant(now_at));
  end if;
 end if;
 if result is null or octet_length(convert_to(result::text,'UTF8'))>16384 then perform concierge.fail('unavailable');end if;
 -- Still the original current own actor/session after every wait and before any
 -- private return, including historical retries. A reentrant trigger cannot slip
 -- an unrelated enrollment/name revision into a purported current read.
 perform concierge.account_profile_authorize_v1(u,s,expiry);
 if not exists(select 1 from concierge.enrollments where client_id=u and status<>'revoked') then perform concierge.fail('forbidden');end if;
 if action='read_account_profile_v1' and concierge.account_profile_projection_v1(u) is distinct from before_view then perform concierge.fail('revision_conflict');end if;
 return result;
end $$;
revoke all on function concierge.account_profile_name_changed_v1(),concierge.account_profile_authorize_v1(uuid,uuid,numeric),concierge.account_profile_projection_v1(uuid) from public,anon,authenticated,service_role;
revoke all on function public.concierge_account_profile_command_v1(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.concierge_account_profile_command_v1(jsonb) to authenticated;
commit;

-- Rollback SOURCE plan (not executed): retire the unmounted consumer/endpoint,
-- revoke/drop only this public RPC, drop the one account_profile_name_revision_v1
-- trigger, these private helpers, requests and heads. Restore collision helper
-- ONLY from its exact unchanged profile-appended body, retaining the matching
-- six/eight predecessor and all OID/ACL/attributes/bindings; unknown later body
-- requires a new rollback plan. Do NOT remove Source journals or restore old
-- enrollments.display_name values: genuine accepted client edits remain canonical.
-- Deletion follows the existing Storage-first -> Auth deletion chain. Both new
-- relations cascade via enrollments -> auth.users. No new retention exception,
-- obligation clearance, deletion endpoint/job, or immutable secondary PII copy.
