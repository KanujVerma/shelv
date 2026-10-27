-- Forward candidate: requires concierge persistence, workflows and presentation R2.
-- No session/auth changes, data writes, provisioning, or advisor/client API replacement.
begin;
create function public.concierge_advisor_preview_v2(
 p_client_id uuid,p_mode text,p_expected_revision bigint default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u uuid; c concierge.cases; e concierge.enrollments; d concierge.drafts;
 p jsonb; latest_intake integer; client_view jsonb; draft_view jsonb:=null;
begin
 if p_client_id is null or p_mode is null or p_mode not in ('draft','published')
  or (p_mode='published' and p_expected_revision is not null)
  or (p_mode='draft' and (p_expected_revision is null or p_expected_revision<0 or p_expected_revision>9007199254740991)) then
  perform concierge.fail('invalid_input');
 end if;
 -- Existing live actor, can_view, target identity/deletion and enrollment fences.
 -- Advisor access alone accepts revoked enrollment, so enforce the owner boundary explicitly.
 u:=concierge.access(p_client_id,'view');
 select * into e from concierge.enrollments where client_id=p_client_id for share;
 if not found or e.status='revoked' then perform concierge.fail('forbidden');end if;
 -- Same client serialization key as every authoritative core/payment/checkin write.
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));
 select * into c from concierge.cases where client_id=p_client_id for share;
 if p_mode='draft' then
  if c.client_id is null then perform concierge.fail('draft_missing');end if;
  if c.revision<>p_expected_revision then perform concierge.fail('stale_draft');end if;
  select * into d from concierge.drafts where client_id=p_client_id for share;
  if not found then perform concierge.fail('draft_missing');end if;
  select max(version) into latest_intake from concierge.intakes where client_id=p_client_id;
  if d.intake_version is distinct from latest_intake then perform concierge.fail('stale_draft');end if;
  select presentation into p from concierge.draft_presentations
   where client_id=p_client_id and intake_version=d.intake_version for share;
  if not found then perform concierge.fail('draft_missing');end if;
  draft_view:=jsonb_build_object('savedRevision',c.revision,'intakeVersion',d.intake_version,
   'presentation',p,'recommendations',concierge.public_items(d.recommendations));
 end if;
 -- Preserve real client entitlement, paid history, active routine and cancellation semantics.
 client_view:=concierge.presentation_projection(p_client_id,concierge.portal_projection(p_client_id),false);
 return jsonb_build_object('schemaVersion',1,'mode',p_mode,'clientId',p_client_id,
  'revision',coalesce(c.revision,0),'clientView',client_view,'draft',draft_view,
  'payments',public.concierge_payment_view(p_client_id),
  'checkins',concierge.checkin_projection(p_client_id,false));
end $$;
revoke all on function public.concierge_advisor_preview_v2(uuid,text,bigint) from public,anon,authenticated,service_role;
grant execute on function public.concierge_advisor_preview_v2(uuid,text,bigint) to authenticated;
commit;
