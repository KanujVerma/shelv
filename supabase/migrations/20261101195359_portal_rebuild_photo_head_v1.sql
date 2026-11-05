-- Additive own-client metadata reader. Existing clinical readers and all writers stay intact.
begin;

create function concierge.photo_head_client_guard_v1() returns uuid
language plpgsql set search_path='' as $$
declare u uuid:=concierge.actor();s text:=auth.jwt()->>'session_id';begin
 if s is null or s !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
  perform concierge.fail('session_ended');
 end if;
 perform concierge.plan_session(u,s::uuid);
 -- A plan/advisor principal never gains a client metadata surface through this RPC.
 perform 1 from concierge.advisors where user_id=u and active for share;
 if found then perform concierge.fail('forbidden');end if;
 perform 1 from concierge.plan_principals where actor_id=u for share;
 if found then perform concierge.fail('forbidden');end if;
 perform concierge.access(u);
 perform concierge.plan_target_client(u,false);
 -- The canonical premeeting optional-photo rule does not require a paid period.
 -- Once service has started, retain the applicable care read window, never a write grant.
 if exists(select 1 from concierge.enrollments where client_id=u and phase='ongoing')
    or exists(select 1 from concierge.service_periods where client_id=u and starts_on is not null) then
  if (select activated from concierge.plan_policy where singleton for share) then
   perform concierge.plan_care_access(u,false);
  else perform concierge.checkin_guard(u);end if;
 end if;
 return u;
end $$;
revoke all on function concierge.photo_head_client_guard_v1() from public,anon,authenticated,service_role;

create function public.concierge_checkin_head_v1() returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid;h bigint;begin
 u:=concierge.photo_head_client_guard_v1();
 -- The same canonical lock serializes creation/advancement of the photo writer head.
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||u::text,0));
 if concierge.photo_head_client_guard_v1() is distinct from u then perform concierge.fail('forbidden');end if;
 perform 1 from concierge.cases where client_id=u for share;
 if not found then perform concierge.fail('forbidden');end if;
 select revision into h from concierge.checkin_heads where client_id=u for share;
 if not found then
  -- Under the client lock, an existing enrolled case with no head has the writer's
  -- canonical initial revision 0. Do not create a head or substitute a Review head.
  h:=0;
 end if;
 if h is null or h not between 0 and 9007199254740991 then perform concierge.fail('unavailable');end if;
 if concierge.photo_head_client_guard_v1() is distinct from u then perform concierge.fail('forbidden');end if;
 return jsonb_build_object('revision',h);
end $$;
revoke all on function public.concierge_checkin_head_v1() from public,anon,authenticated,service_role;
grant execute on function public.concierge_checkin_head_v1() to authenticated;

commit;
