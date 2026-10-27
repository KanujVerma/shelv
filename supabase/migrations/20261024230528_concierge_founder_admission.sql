-- Founder-managed admission only. No identities, grants, messages or business fixtures are seeded.
begin;
alter table concierge.advisors add column can_admit_clients boolean not null default false;
create table concierge.admission_intents(
 actor_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 provider_session_id uuid not null,
 email text not null,
 display_name text not null,
 target_id uuid not null,
 state text not null default 'pending' check(state in('pending','complete')),
 receipt jsonb,
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 primary key(actor_id,request_id),
 check((state='pending' and receipt is null and completed_at is null) or(state='complete' and receipt is not null and completed_at is not null))
);
create index admission_pending_email on concierge.admission_intents(email) where state='pending';
alter table concierge.admission_intents enable row level security;
revoke all on concierge.admission_intents from public,anon,authenticated,service_role;

-- Used inside the authenticated entry points and again by the service-only finalizer.
create function concierge.admission_guard(u uuid,s uuid,require_admit boolean default true) returns boolean
language plpgsql set search_path='' as $$
declare permitted boolean;
begin
 if u is null or s is null then raise exception 'concierge_admission_session_ended';end if;
 perform 1 from auth.users where id=u and is_anonymous is false and deleted_at is null and(banned_until is null or banned_until<=pg_catalog.clock_timestamp()) for share;
 if not found then raise exception 'concierge_admission_forbidden';end if;
 perform 1 from public.profiles where id=u and deletion_started_at is null for share;
 if not found then raise exception 'concierge_admission_forbidden';end if;
 select can_admit_clients into permitted from concierge.advisors where user_id=u and active and can_view for share;
 if not found or(require_admit and not permitted) then raise exception 'concierge_admission_forbidden';end if;
 perform 1 from auth.sessions where id=s and user_id=u and(not_after is null or not_after>pg_catalog.clock_timestamp()) for share;
 if not found then raise exception 'concierge_admission_session_ended';end if;
 return permitted;
end $$;
create function concierge.admission_session() returns uuid language plpgsql set search_path='' as $$
declare s text:=auth.jwt()->>'session_id';begin
 if s is null or s!~'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then raise exception 'concierge_admission_session_ended';end if;
 return s::uuid;
end $$;
create function concierge.admission_target(t uuid,e text) returns void language plpgsql set search_path='' as $$begin
 perform 1 from auth.users au join public.profiles pp on pp.id=au.id where au.id=t and pg_catalog.lower(au.email)=e and au.is_anonymous is false and au.deleted_at is null and(au.banned_until is null or au.banned_until<=pg_catalog.clock_timestamp()) and pp.deletion_started_at is null for share of au,pp;
 if not found then raise exception 'concierge_admission_conflict';end if;
end $$;
create function concierge.admission_receipt(r concierge.admission_intents,existing boolean,n text) returns jsonb language sql set search_path='' as $$
 select pg_catalog.jsonb_build_object('requestId',r.request_id,'status',case when existing then 'already_admitted' else 'admitted' end,'clientId',r.target_id,'displayName',n,'email',r.email,'emailSent',false,'portalUrl','https://portal.goshelv.com/');
$$;
create function public.concierge_admission_capabilities() returns jsonb language plpgsql security definer set search_path='' as $$begin
 return pg_catalog.jsonb_build_object('canAddClient',concierge.admission_guard(auth.uid(),concierge.admission_session(),false));
end $$;
create function public.concierge_admission_begin(p_request_id uuid,p_email text,p_display_name text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();s uuid:=concierge.admission_session();e text:=pg_catalog.lower(pg_catalog.btrim(p_email));n text:=pg_catalog.btrim(p_display_name);
 r concierge.admission_intents;target uuid;candidate_count integer;existing concierge.enrollments;
begin
 perform concierge.admission_guard(u,s);
 if p_request_id is null or e is null or n is null or pg_catalog.length(e)>254 or pg_catalog.length(n) not between 1 and 200 or e!~'^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' or n~'[[:cntrl:]]' then raise exception 'concierge_admission_conflict';end if;
 -- The email lock makes all founders reserve the same pending target UUID.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('concierge-admission:'||e,0));
 select * into r from concierge.admission_intents where actor_id=u and request_id=p_request_id for update;
 if found then
  if r.email<>e or r.display_name<>n then raise exception 'concierge_admission_conflict';end if;
  if r.state='complete' then
   perform concierge.admission_target(r.target_id,e);
   perform 1 from concierge.enrollments where client_id=r.target_id and status='active' for share;
   if not found then raise exception 'concierge_admission_conflict';end if;
   return pg_catalog.jsonb_build_object('state','complete','receipt',r.receipt);
  end if;
  update concierge.admission_intents set provider_session_id=s where actor_id=u and request_id=p_request_id;
 else
  select pg_catalog.count(*),(pg_catalog.array_agg(id))[1] into candidate_count,target from auth.users where pg_catalog.lower(email)=e;
  if candidate_count>1 then raise exception 'concierge_admission_conflict';end if;
  if target is null then
   select target_id into target from concierge.admission_intents where email=e and state='pending' order by created_at,actor_id,request_id limit 1;
   target:=coalesce(target,pg_catalog.gen_random_uuid());
  end if;
  insert into concierge.admission_intents(actor_id,request_id,provider_session_id,email,display_name,target_id) values(u,p_request_id,s,e,n,target) returning * into r;
 end if;
 select pg_catalog.count(*) into candidate_count from auth.users where pg_catalog.lower(email)=e and id<>r.target_id;
 if candidate_count<>0 then raise exception 'concierge_admission_conflict';end if;
 if exists(select 1 from auth.users where id=r.target_id) then
  perform concierge.admission_target(r.target_id,e);
  select * into existing from concierge.enrollments where client_id=r.target_id for share;
  if found then
   if existing.status<>'active' or not exists(select 1 from concierge.cases where client_id=r.target_id) then raise exception 'concierge_admission_conflict';end if;
   r.receipt:=concierge.admission_receipt(r,true,existing.display_name);
   update concierge.admission_intents set state='complete',receipt=r.receipt,completed_at=pg_catalog.clock_timestamp() where actor_id=u and request_id=p_request_id;
   return pg_catalog.jsonb_build_object('state','complete','receipt',r.receipt);
  end if;
  if exists(select 1 from concierge.cases where client_id=r.target_id) then raise exception 'concierge_admission_conflict';end if;
  return pg_catalog.jsonb_build_object('state','identity_ready','targetId',r.target_id,'email',e);
 end if;
 return pg_catalog.jsonb_build_object('state','needs_identity','targetId',r.target_id,'email',e);
end $$;
create function public.concierge_admission_status(p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();r concierge.admission_intents;begin
 perform concierge.admission_guard(u,concierge.admission_session());
 select * into r from concierge.admission_intents where actor_id=u and request_id=p_request_id for share;
 if not found then raise exception 'concierge_admission_not_found';end if;
 if r.state='complete' then
  perform concierge.admission_target(r.target_id,r.email);
  perform 1 from concierge.enrollments where client_id=r.target_id and status='active' for share;
  if not found then raise exception 'concierge_admission_conflict';end if;
 end if;
 return pg_catalog.jsonb_build_object('requestId',p_request_id,'status',case when r.state='complete' then 'ready' else 'pending' end,'client',r.receipt);
end $$;
create function public.concierge_admission_finish(p_actor_id uuid,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r concierge.admission_intents;existing concierge.enrollments;was_existing boolean:=false;begin
 select * into r from concierge.admission_intents where actor_id=p_actor_id and request_id=p_request_id;
 if not found then raise exception 'concierge_admission_not_found';end if;
 perform concierge.admission_guard(r.actor_id,r.provider_session_id);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('concierge-admission:'||r.email,0));
 select * into r from concierge.admission_intents where actor_id=p_actor_id and request_id=p_request_id for update;
 if not found then raise exception 'concierge_admission_not_found';end if;
 perform concierge.admission_target(r.target_id,r.email);
 select * into existing from concierge.enrollments where client_id=r.target_id for update;
 if found then
  if existing.status<>'active' or not exists(select 1 from concierge.cases where client_id=r.target_id) then raise exception 'concierge_admission_conflict';end if;
  was_existing:=true;
 elsif r.state='complete' or exists(select 1 from concierge.cases where client_id=r.target_id) then raise exception 'concierge_admission_conflict';
 else
  insert into concierge.enrollments(client_id,display_name,status,phase) values(r.target_id,r.display_name,'active','premeeting');
  insert into concierge.cases(client_id) values(r.target_id);
 end if;
 if r.state='complete' then return r.receipt;end if;
 r.receipt:=concierge.admission_receipt(r,was_existing,case when was_existing then existing.display_name else r.display_name end);
 update concierge.admission_intents set state='complete',receipt=r.receipt,completed_at=pg_catalog.clock_timestamp() where actor_id=p_actor_id and request_id=p_request_id;
 return r.receipt;
end $$;
-- A reserved target cannot use a FK before Auth creation. Clean its journal when Auth deletion completes.
create function concierge.admission_delete_target() returns trigger language plpgsql security definer set search_path='' as $$begin
 delete from concierge.admission_intents where target_id=old.id;return old;
end $$;
create trigger concierge_admission_delete_target after delete on auth.users for each row execute function concierge.admission_delete_target();
revoke all on function concierge.admission_guard(uuid,uuid,boolean),concierge.admission_session(),concierge.admission_target(uuid,text),concierge.admission_receipt(concierge.admission_intents,boolean,text),concierge.admission_delete_target() from public,anon,authenticated,service_role;
revoke all on function public.concierge_admission_capabilities(),public.concierge_admission_begin(uuid,text,text),public.concierge_admission_status(uuid),public.concierge_admission_finish(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.concierge_admission_capabilities(),public.concierge_admission_begin(uuid,text,text),public.concierge_admission_status(uuid) to authenticated;
grant execute on function public.concierge_admission_finish(uuid,uuid) to service_role;
commit;
