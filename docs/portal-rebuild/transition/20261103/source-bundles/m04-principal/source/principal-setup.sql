-- Fixed SOURCE ONLY template. No SQL parser/database execution has run here.
-- Only validated actual UUID/email literals replace the six named markers.
-- @READ_BEGIN
begin transaction isolation level repeatable read read only;
select jsonb_build_object(
 'users',coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'email',u.email,'anonymous',u.is_anonymous,'confirmed',u.email_confirmed_at is not null,'deleted',u.deleted_at,'bannedUntil',u.banned_until) order by u.id) from auth.users u),'[]'::jsonb),
 'profiles',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'email',p.email,'fullName',p.full_name,'deletionStartedAt',p.deletion_started_at) order by p.id) from public.profiles p join auth.users u on u.id=p.id),'[]'::jsonb),
 'enrollments',coalesce((select jsonb_agg(jsonb_build_object('id',e.client_id,'displayName',e.display_name,'status',e.status,'phase',e.phase) order by e.client_id) from concierge.enrollments e),'[]'::jsonb),
 'cases',coalesce((select jsonb_agg(jsonb_build_object('id',c.client_id,'revision',c.revision,'publishedVersion',c.published_version) order by c.client_id) from concierge.cases c),'[]'::jsonb),
 'profileHeads',coalesce((select jsonb_agg(to_jsonb(h) order by h.client_id) from concierge.account_profile_heads_v1 h),'[]'::jsonb),
 'advisors',coalesce((select jsonb_agg(jsonb_build_object('user_id',a.user_id,'active',a.active,'can_view',a.can_view,'can_edit',a.can_edit,'can_publish',a.can_publish,'can_confirm_payments',a.can_confirm_payments,'can_admit_clients',a.can_admit_clients) order by a.user_id) from concierge.advisors a),'[]'::jsonb),
 'principals',coalesce((select jsonb_agg(jsonb_build_object('actor_id',p.actor_id,'kind',p.kind,'active',p.active) order by p.actor_id) from concierge.plan_principals p),'[]'::jsonb),
 'policy',(select jsonb_build_object('singleton',p.singleton,'activated',p.activated,'owner_actor_id',p.owner_actor_id,'revision',p.revision,'require_kanuj_approval',p.require_kanuj_approval) from concierge.plan_policy p where p.singleton),
 'effects',jsonb_build_object(
  'quotes',(select count(*) from concierge.quotes),'claims',(select count(*) from concierge.claims),
  'confirmations',(select count(*) from concierge.payment_confirmations),'servicePeriods',(select count(*) from concierge.service_periods),
  'entitlements',(select count(*) from concierge.entitled_publications),'publications',(select count(*) from concierge.publications),
  'drafts',(select count(*) from concierge.plan_drafts),'approvals',(select count(*) from concierge.plan_approvals),
  'publicationReceipts',(select count(*) from concierge.plan_publication_receipts),'events',(select count(*) from concierge.plan_events),
  'deliveries',(select count(*) from concierge.plan_deliveries),'reviewSchedules',(select count(*) from concierge.plan_review_schedule),
  'starts',(select count(*) from concierge.activations)),
 'administration',jsonb_build_object('heads',coalesce((select jsonb_agg(to_jsonb(h) order by h.client_id) from concierge.service_heads h),'[]'::jsonb),'purchases',coalesce((select jsonb_agg(to_jsonb(p) order by p.id) from concierge.retail_purchases p),'[]'::jsonb),'returns',coalesce((select jsonb_agg(to_jsonb(r) order by r.id) from concierge.return_cases r),'[]'::jsonb),'returnEvents',coalesce((select jsonb_agg(to_jsonb(e) order by e.id) from concierge.return_events e),'[]'::jsonb)),
 'ledger',coalesce((select jsonb_agg(jsonb_build_object('version',version,'name',name,'statements',statements) order by version) from supabase_migrations.schema_migrations),'[]'::jsonb)
);
rollback;
-- @READ_END

-- @APPLY_BEGIN
begin;
set local lock_timeout='5s';
set local statement_timeout='20s';
lock table auth.users in share mode;
lock table public.profiles in share mode;
lock table concierge.advisors,concierge.plan_principals in share row exclusive mode;
create temporary table m04_exact_inputs(a uuid,b uuid,owner_id uuid,viewer_id uuid,owner_email text,viewer_email text) on commit drop;
insert into m04_exact_inputs values (__A_ID__::uuid,__B_ID__::uuid,__OWNER_ID__::uuid,__VIEWER_ID__::uuid,__OWNER_EMAIL__,__VIEWER_EMAIL__);
do $m04$
declare i m04_exact_inputs; n integer; p concierge.plan_policy;
begin
 select * into strict i from m04_exact_inputs;
 if (select count(distinct x) from unnest(array[i.a,i.b,i.owner_id,i.viewer_id]) x)<>4 then raise exception 'm04_identity_alias';end if;
 if (select count(*) from auth.users)<>4 or exists(select 1 from auth.users where id not in(i.a,i.b,i.owner_id,i.viewer_id) or is_anonymous is distinct from false or email_confirmed_at is null or deleted_at is not null or (banned_until is not null and banned_until>clock_timestamp())) then raise exception 'm04_actual_users_required';end if;
 if not exists(select 1 from auth.users where id=i.owner_id and email=i.owner_email) or not exists(select 1 from auth.users where id=i.viewer_id and email=i.viewer_email) then raise exception 'm04_provider_identity_mismatch';end if;
 if (select count(*) from public.profiles where id in(i.a,i.b,i.owner_id,i.viewer_id) and deletion_started_at is null)<>4 then raise exception 'm04_trigger_profiles_required';end if;
 if (select count(*) from concierge.enrollments where client_id in(i.a,i.b) and status='active')<>2 or (select count(*) from concierge.enrollments)<>2 or (select count(*) from concierge.cases where client_id in(i.a,i.b) and published_version=0)<>2 or (select count(*) from concierge.cases)<>2 then raise exception 'm04_existing_clients_only';end if;
 if exists(select 1 from concierge.advisors) or exists(select 1 from concierge.plan_principals) then raise exception 'm04_prior_roles_refused';end if;
 if exists(select 1 from concierge.publications) or exists(select 1 from concierge.plan_drafts) or exists(select 1 from concierge.plan_approvals) or exists(select 1 from concierge.plan_publication_receipts) or exists(select 1 from concierge.plan_events) or exists(select 1 from concierge.plan_deliveries) or exists(select 1 from concierge.quotes) or exists(select 1 from concierge.claims) or exists(select 1 from concierge.payment_confirmations) or exists(select 1 from concierge.service_periods) or exists(select 1 from concierge.entitled_publications) or exists(select 1 from concierge.plan_review_schedule) or exists(select 1 from concierge.activations) then raise exception 'm04_prior_business_effect_refused';end if;
 select * into strict p from concierge.plan_policy where singleton for update;
 if p.activated or p.owner_actor_id is not null or p.revision<>0 or p.require_kanuj_approval is distinct from true then raise exception 'm04_initial_policy_required';end if;
 insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments,can_admit_clients) values(i.owner_id,true,true,true,true,true,false),(i.viewer_id,true,true,false,false,false,false);
 insert into concierge.plan_principals(actor_id,kind,active) values(i.owner_id,'owner',true),(i.viewer_id,'human',true);
 update concierge.plan_policy set activated=true,owner_actor_id=i.owner_id,revision=1,require_kanuj_approval=true where singleton and not activated and owner_actor_id is null and revision=0 and require_kanuj_approval;
 get diagnostics n=row_count;if n<>1 then raise exception 'm04_policy_cas_conflict';end if;
end $m04$;
commit;
-- @APPLY_END

-- @ROLES_BEGIN
begin transaction isolation level repeatable read read only;
select jsonb_build_object(
 'profiles',(select jsonb_agg(jsonb_build_object('id',p.id,'email',p.email,'deletion_started_at',p.deletion_started_at) order by p.id) from public.profiles p where p.id in(__OWNER_ID__::uuid,__VIEWER_ID__::uuid)),
 'advisors',(select jsonb_agg(jsonb_build_object('user_id',a.user_id,'active',a.active,'can_view',a.can_view,'can_edit',a.can_edit,'can_publish',a.can_publish,'can_confirm_payments',a.can_confirm_payments,'can_admit_clients',a.can_admit_clients) order by a.user_id) from concierge.advisors a),
 'principals',(select jsonb_agg(jsonb_build_object('actor_id',p.actor_id,'kind',p.kind,'active',p.active) order by p.actor_id) from concierge.plan_principals p),
 'policy',(select jsonb_build_object('singleton',p.singleton,'activated',p.activated,'owner_actor_id',p.owner_actor_id,'revision',p.revision,'require_kanuj_approval',p.require_kanuj_approval) from concierge.plan_policy p where p.singleton)
);
rollback;
-- @ROLES_END
