-- Additive completed-photo metadata only. No raw-file permission or clinical fallback.
begin;

-- Existing indexes do not support bounded own-client completed-ID keyset scans.
create index checkin_photos_complete_client_id_v1 on concierge.checkin_photos(client_id,id) where state='complete';

create function public.concierge_checkin_photo_inventory_v1(p_cursor uuid,p_limit integer,p_expected_revision bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid;h bigint;rows jsonb;next_cursor uuid;begin
 if p_limit is null or p_limit not between 1 and 50
    or (p_expected_revision is not null and p_expected_revision not between 0 and 9007199254740991)
    or (p_cursor is not null and p_expected_revision is null) then perform concierge.fail('invalid_input');end if;
 u:=concierge.photo_head_client_guard_v1();
 -- Reuse the actual reader, not a second Auth/care model or an inferred Review head.
 -- It guards before/after the canonical client advisory wait, then takes the actual
 -- case SHARE and checkin-head SHARE locks, all held until this transaction ends.
 h:=(public.concierge_checkin_head_v1()->>'revision')::bigint;
 if p_expected_revision is not null and h<>p_expected_revision then perform concierge.fail('revision_conflict');end if;
 -- Limit before aggregation. Associations, reservation actors and clinical history
 -- do not narrow this metadata inventory of ALL this owner's completed photos.
 select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'angle',q.angle) order by q.id),'[]'::jsonb) into rows
 from (select id,angle from concierge.checkin_photos
       where client_id=u and state='complete' and (p_cursor is null or id>p_cursor)
       order by id limit p_limit+1) q;
 if jsonb_array_length(rows)>p_limit then
  rows:=rows-p_limit;
  next_cursor:=(rows->(p_limit-1)->>'id')::uuid;
 end if;
 if concierge.photo_head_client_guard_v1() is distinct from u then perform concierge.fail('forbidden');end if;
 return jsonb_build_object('revision',h,'photos',rows,'nextCursor',next_cursor);
end $$;
revoke all on function public.concierge_checkin_photo_inventory_v1(uuid,integer,bigint) from public,anon,authenticated,service_role;
grant execute on function public.concierge_checkin_photo_inventory_v1(uuid,integer,bigint) to authenticated;

commit;
