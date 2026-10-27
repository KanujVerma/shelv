-- Client-visible replies are separate from private advisor notes. Existing action branches remain unchanged.
begin;
create table concierge.checkin_replies (
 id uuid primary key default gen_random_uuid(), client_id uuid not null, report_id uuid not null,
 reply text not null check(length(reply) between 1 and 4000 and length(concierge.trim_text(reply))>0),
 created_at timestamptz not null default now(), created_by uuid not null,
 foreign key(client_id,report_id) references concierge.checkin_reports(client_id,id) on delete cascade
);
create index checkin_replies_report_order on concierge.checkin_replies(client_id,report_id,created_at,id);
alter table concierge.checkin_replies enable row level security;
revoke all on table concierge.checkin_replies from public,anon,authenticated,service_role;
create trigger checkin_replies_immutable before update on concierge.checkin_replies for each row execute function concierge.immutable();

create or replace function concierge.checkin_projection(c uuid,advisor boolean) returns jsonb language plpgsql set search_path='' as $$
declare v jsonb;begin
 v:=jsonb_build_object('revision',coalesce((select revision from concierge.checkin_heads where client_id=c),0),
  'nextCheckinOn',(select next_checkin_on from concierge.checkin_heads where client_id=c),
  'reports',(select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'submittedAt',r.submitted_at,'comfort',r.comfort,'consistency',r.consistency,'changes',r.changes,
   'advisorReplies',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'reply',a.reply,'authorId',a.created_by,'createdAt',a.created_at) order by a.created_at,a.id),'[]') from concierge.checkin_replies a where a.client_id=c and a.report_id=r.id),
   'photos',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'angle',p.angle) order by p.angle),'[]') from concierge.report_photos a join concierge.checkin_photos p on p.id=a.photo_id where a.report_id=r.id)) order by r.submitted_at,r.id),'[]') from concierge.checkin_reports r where client_id=c));
 if advisor then return jsonb_build_object('client',v,'meetingNotes',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'checkinId',report_id,'note',note,'createdAt',created_at) order by created_at,id),'[]') from concierge.checkin_notes where client_id=c));end if;
 return v;
end $$;
create or replace function public.concierge_checkin_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid;prior jsonb;h concierge.checkin_heads;p concierge.checkin_photos;pid uuid;rid uuid;photo_ids uuid[];g text;n text;changes text;angle text;mime text;size bigint;digest text;next_day date;result jsonb;begin
 if p_action in ('submit_report','reserve_photo','complete_photo') then u:=concierge.access(p_client_id,null,true);perform concierge.checkin_guard(p_client_id);
 elsif p_action in ('set_next_checkin','add_meeting_note','send_advisor_reply') then u:=concierge.access(p_client_id,'edit',true);
 else perform concierge.fail('invalid_input');end if;
 prior:=concierge.workflow_begin(u,p_client_id,p_request_id,'checkin',p_action,p_expected_revision,p_payload);if prior is not null then return prior;end if;
 insert into concierge.checkin_heads(client_id) values(p_client_id) on conflict do nothing;
 select * into h from concierge.checkin_heads where client_id=p_client_id for update;
 -- Completion is fenced to its immutable reservation, not unrelated writes.
 if p_action<>'complete_photo' and h.revision<>p_expected_revision then perform concierge.fail('revision_conflict');end if;
 if p_action='submit_report' then
  perform concierge.keys(p_payload,array['comfort','consistency','changes','photoIds']);g:=concierge.txt(p_payload,'comfort',1000);n:=concierge.txt(p_payload,'consistency',1000);changes:=concierge.txt(p_payload,'changes',1000,true);
  if jsonb_typeof(p_payload->'photoIds') is distinct from 'array' then perform concierge.fail('invalid_input');end if;
  if jsonb_array_length(p_payload->'photoIds')>3 then perform concierge.fail('invalid_input');end if;
  select coalesce(array_agg(x::uuid),'{}'::uuid[]) into photo_ids from jsonb_array_elements_text(p_payload->'photoIds')j(x);
  if cardinality(photo_ids)<>(select count(distinct x) from unnest(photo_ids)j(x)) then perform concierge.fail('invalid_input');end if;
  if cardinality(photo_ids)<>(select count(*) from concierge.checkin_photos ph where ph.id=any(photo_ids) and ph.client_id=p_client_id and ph.reserved_by=u and ph.state='complete' and not exists(select 1 from concierge.report_photos a where a.photo_id=ph.id)) then perform concierge.fail('forbidden');end if;
  if cardinality(photo_ids)<>(select count(distinct ph.angle) from concierge.checkin_photos ph where ph.id=any(photo_ids)) then perform concierge.fail('invalid_input');end if;
  insert into concierge.checkin_reports(client_id,comfort,consistency,changes) values(p_client_id,g,n,changes) returning id into rid;
  insert into concierge.report_photos select x,rid from unnest(photo_ids)j(x);
 elsif p_action='set_next_checkin' then
  perform concierge.keys(p_payload,array['nextCheckinOn']);if p_payload->'nextCheckinOn' is distinct from 'null'::jsonb then next_day:=concierge.day(p_payload,'nextCheckinOn');end if;
  update concierge.checkin_heads set next_checkin_on=next_day where client_id=p_client_id;
 elsif p_action='add_meeting_note' then
  perform concierge.keys(p_payload,array['checkinId','note']);rid:=(p_payload->>'checkinId')::uuid;n:=concierge.txt(p_payload,'note',4000);
  if not exists(select 1 from concierge.checkin_reports where client_id=p_client_id and id=rid) then perform concierge.fail('not_found');end if;
  insert into concierge.checkin_notes(client_id,report_id,note,created_by) values(p_client_id,rid,n,u);rid:=null;
 elsif p_action='send_advisor_reply' then
  perform concierge.keys(p_payload,array['checkinId','reply']);rid:=(p_payload->>'checkinId')::uuid;n:=concierge.txt(p_payload,'reply',4000);
  if not exists(select 1 from concierge.checkin_reports where client_id=p_client_id and id=rid) then perform concierge.fail('not_found');end if;
  insert into concierge.checkin_replies(client_id,report_id,reply,created_by) values(p_client_id,rid,n,u);
 elsif p_action='reserve_photo' then
  perform concierge.keys(p_payload,array['angle','contentType','sizeBytes','sha256']);angle:=concierge.txt(p_payload,'angle',5);mime:=concierge.txt(p_payload,'contentType',20);size:=concierge.integer(p_payload,'sizeBytes');digest:=concierge.txt(p_payload,'sha256',64);
  if angle not in ('front','left','right') or mime not in ('image/jpeg','image/png','image/webp') or size not between 1 and 5242880 or digest !~ '^[a-f0-9]{64}$' then perform concierge.fail('invalid_input');end if;
  pid:=gen_random_uuid();insert into concierge.checkin_photos(id,client_id,reserved_by,reservation_revision,path,angle,content_type,size_bytes,sha256,state)
  values(pid,p_client_id,u,h.revision+1,p_client_id::text||'/'||pid::text||case mime when 'image/jpeg' then '.jpg' when 'image/png' then '.png' else '.webp' end,angle,mime,size,digest,'pending') returning * into p;
 else
  perform concierge.keys(p_payload,array['photoId']);pid:=(p_payload->>'photoId')::uuid;
  select * into p from concierge.checkin_photos where id=pid and client_id=p_client_id and reserved_by=u;
  if not found then perform concierge.fail('forbidden');end if;
  if p.reservation_revision<>p_expected_revision then perform concierge.fail('revision_conflict');end if;
  if p.state<>'pending' then perform concierge.fail('request_conflict');end if;
  perform concierge.object_complete('concierge-checkin-photos',p.path,p.content_type,p.size_bytes);
  update concierge.checkin_photos set state='complete' where id=p.id;
 end if;
 update concierge.checkin_heads set revision=revision+1 where client_id=p_client_id returning * into h;
 result:=case when p_action='reserve_photo' then concierge.photo_descriptor(p,h.revision) else jsonb_build_object('revision',h.revision,'operation',p_action,'reportId',rid) end;
 return concierge.workflow_finish(u,p_client_id,p_request_id,'checkin',p_action,p_expected_revision,p_payload,result);
exception when invalid_text_representation or numeric_value_out_of_range then perform concierge.fail('invalid_input');return null;
end $$;
-- Replacement retains the existing RPC owner and grants; explicitly preserve least privilege.
revoke all on function public.concierge_checkin_write(uuid,text,bigint,uuid,jsonb) from public,anon,service_role;
grant execute on function public.concierge_checkin_write(uuid,text,bigint,uuid,jsonb) to authenticated;
revoke all on function concierge.checkin_projection(uuid,boolean) from public,anon,authenticated,service_role;
commit;
