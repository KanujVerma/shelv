-- Additive context-only API. No auth/session row, grant or profile mutations.
create or replace function public.concierge_advisor_session_context() returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 owner_id uuid:=auth.uid();
 deadline timestamptz;
 session_text text:=auth.jwt()->>'session_id';
 grant_row concierge.advisors;
begin
 if owner_id is null then
  raise exception using errcode='PT401',message='session_ended';
 end if;
 if session_text is null or session_text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
  raise exception using errcode='PT401',message='session_ended';
 end if;
 perform 1 from auth.users where id=owner_id and is_anonymous is false for share;
 if not found then raise exception using errcode='PT403',message='forbidden';end if;
 perform 1 from public.profiles where id=owner_id and deletion_started_at is null for share;
 if not found then raise exception using errcode='PT403',message='forbidden';end if;
 select * into grant_row from concierge.advisors where user_id=owner_id and active and can_view for share;
 if not found then raise exception using errcode='PT403',message='forbidden';end if;
 select not_after into deadline from auth.sessions where id=session_text::uuid and user_id=owner_id
  and (not_after is null or not_after>pg_catalog.clock_timestamp()) for share;
 if not found then raise exception using errcode='PT401',message='session_ended';end if;
 return pg_catalog.jsonb_build_object('ownerId',owner_id,'providerSessionId',session_text::uuid,'role','advisor','sessionNotAfter',deadline,'capabilities',pg_catalog.jsonb_build_object(
  'view',grant_row.can_view,'edit',grant_row.can_edit,'publish',grant_row.can_publish,'confirmPayments',grant_row.can_confirm_payments));
end $$;
revoke all on function public.concierge_advisor_session_context() from public,anon,authenticated,service_role;
grant execute on function public.concierge_advisor_session_context() to authenticated;
