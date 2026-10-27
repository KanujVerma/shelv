-- Local candidate only. Read-only context for client cookie sessions; install is HELD.
create function public.concierge_client_session_context() returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 owner_id uuid:=auth.uid();
 deadline timestamptz;
 enrollment_status text;
 session_text text:=auth.jwt()->>'session_id';
begin
 if owner_id is null then raise exception using errcode='PT401',message='session_ended';end if;
 if session_text is null or session_text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
  raise exception using errcode='PT401',message='session_ended';
 end if;
 perform 1 from auth.users where id=owner_id and is_anonymous is false for share;
 if not found then raise exception using errcode='PT403',message='forbidden';end if;
 perform 1 from public.profiles where id=owner_id and deletion_started_at is null for share;
 if not found then raise exception using errcode='PT403',message='forbidden';end if;
 -- Advisor credentials must never acquire a durable client cookie, including view-disabled advisors.
 if exists(select 1 from concierge.advisors where user_id=owner_id and active) then
  raise exception using errcode='PT403',message='forbidden';
 end if;
 select not_after into deadline from auth.sessions where id=session_text::uuid and user_id=owner_id
  and (not_after is null or not_after>pg_catalog.clock_timestamp()) for share;
 if not found then raise exception using errcode='PT401',message='session_ended';end if;
 -- Exact existing enrollment boundary; no funded service is required to read.
 begin perform concierge.access(owner_id);exception when others then raise exception using errcode='PT403',message='forbidden';end;
 select status into enrollment_status from concierge.enrollments where client_id=owner_id;
 return pg_catalog.jsonb_build_object('ownerId',owner_id,'providerSessionId',session_text::uuid,'role','client','enrollmentStatus',enrollment_status,'canWrite',enrollment_status='active','sessionNotAfter',deadline,'capabilities',pg_catalog.jsonb_build_object(
  'view',true,'edit',false,'publish',false,'confirmPayments',false));
end $$;
revoke all on function public.concierge_client_session_context() from public,anon,authenticated,service_role;
grant execute on function public.concierge_client_session_context() to authenticated;
