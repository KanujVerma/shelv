-- Additive SOURCE candidate. Canonical62 is immutable. No existing API, table or ACL is replaced.
-- Static own-client final care export is independent of expired interactive care access.
begin;

create function concierge.final_export_authorize_v1() returns uuid
language plpgsql set search_path='' as $$
declare u uuid:=auth.uid();s uuid;expiry numeric;begin
 if u is null or auth.jwt()->>'role' is distinct from 'authenticated' then perform concierge.fail('unauthorized');end if;
 begin s:=(auth.jwt()->>'session_id')::uuid;expiry:=(auth.jwt()->>'exp')::numeric;
 exception when invalid_text_representation or numeric_value_out_of_range then perform concierge.fail('session_ended');end;
 if s is null or expiry is null or expiry<=extract(epoch from clock_timestamp()) then perform concierge.fail('session_ended');end if;
 perform concierge.plan_session(u,s);
 perform concierge.plan_target_client(u,false);
 -- This family supplies no human-advisor or task-agent authority, even for a selected client.
 if exists(select 1 from concierge.plan_principals where actor_id=u and active) then perform concierge.fail('forbidden');end if;
 -- Target/enrollment checks can block: repeat live session/deletion/ban checks afterward.
 perform concierge.plan_session(u,s);
 if expiry<=extract(epoch from clock_timestamp()) then perform concierge.fail('session_ended');end if;
 return u;
end $$;

create function concierge.final_export_document_v1(c uuid,v integer) returns jsonb
language plpgsql set search_path='' as $$
declare p concierge.publications;d jsonb;legacy jsonb;goal text;shape jsonb;begin
 select * into p from concierge.publications where client_id=c and version=v;
 if not found then return null;end if;
 if p.document_schema_version=3 then
  select document into d from concierge.plan_documents where client_id=c and version=v;
  if d is null then return null;end if;
  -- plan_documents already contains the immutable client projection. Validate the exact public
  -- context shape, without reprojecting public facts as if they were private draft facts.
  shape:=jsonb_set(concierge.plan_content_shape(),'{fields,context,fields,facts,item}',
    '{"type":"object","fields":{"id":{"type":"identifier"},"kind":{"type":"enum","values":["client_report","advisor_conclusion","agent_proposal"]},"text":{"type":"text","max":4000,"empty":true}}}');
  perform concierge.plan_shape(d,shape);
  return jsonb_build_object('documentSchemaVersion',3,'content',d);
 end if;
 select presentation into d from concierge.publication_presentations where client_id=c and version=v;
 -- R1 baselines are mutable and have no historical snapshot. Never invent a frozen routine.
 if d is null then return null;end if;
 perform concierge.validate_presentation_shape(d,concierge.presentation_shape(false));
 select i.goal into goal from concierge.intakes i where i.client_id=c and i.version=p.intake_version;
 if goal is null then return null;end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',r->'id','slot',r->'slot','currentProductId',r->'currentProductId','proposedProductId',r->'proposedProductId','priceCents',r->'priceCents','currency',r->'currency','rationale',r->'rationale') order by n),'[]') into legacy from jsonb_array_elements(p.recommendations) with ordinality x(r,n);
 return jsonb_build_object('documentSchemaVersion',2,'goal',goal,'legacyOriginal',jsonb_build_object('version',v,'recommendations',legacy,'presentation',d));
end $$;

create function concierge.final_export_scopes_v1(doc jsonb) returns table(slot_id text,product_id text)
language sql set search_path='' as $$
 select distinct slot,product from (
  select r->>'slotId' slot,r->>'productId' product from jsonb_array_elements(doc->'content'->'routine') r
  union all select d->>'slotId',pid#>>'{}' from jsonb_array_elements(doc->'content'->'decisions') d cross join lateral jsonb_array_elements((d->'currentProductIds')||(d->'alternativeProductIds')||case when d->>'primaryProductId' is null then '[]'::jsonb else jsonb_build_array(d->'primaryProductId') end) pid
  union all select r->>'slot',r->>'productId' from jsonb_array_elements(doc->'legacyOriginal'->'presentation'->'baselineRoutine') r where r->>'slot' is not null
  union all select r->>'slot',p->>'id' from jsonb_array_elements(doc->'legacyOriginal'->'presentation'->'categoryCards') r cross join lateral jsonb_array_elements(jsonb_build_array(r->'currentProduct',r->'proposedProduct')) p where p<>'null'::jsonb
 ) s
$$;

create function concierge.final_export_events_v1(c uuid,cutoff timestamptz,v integer)
returns table(revision bigint,recorded_at timestamptz,effective_recorded_at timestamptz,body jsonb)
language sql set search_path='' as $$
 select e.revision,e.recorded_at,coalesce(am.recorded_at,e.recorded_at),coalesce(am.body->'replacement',ue.body)
 from concierge.care_events e join concierge.care_use_events ue on ue.event_id=e.id
 left join lateral(select a.body,ae.recorded_at from concierge.care_use_amendments a join concierge.care_events ae on ae.id=a.id where a.event_id=e.id and ae.client_id=c and ae.recorded_at<cutoff order by ae.revision desc limit 1) am on true
 where e.client_id=c and e.recorded_at<cutoff and coalesce(am.body->'replacement',ue.body)->'product'->>'kind'='plan_product'
 and exists(select 1 from concierge.entitled_publications ep join concierge.publications p on p.client_id=ep.client_id and p.version=ep.version where ep.client_id=c and ep.version=(coalesce(am.body->'replacement',ue.body)->'product'->'publication'->>'version')::integer and ep.version<=v and ep.starts_on<(cutoff at time zone 'America/Chicago')::date and p.published_at<cutoff)
$$;

create function concierge.final_export_use_v1(c uuid,ref jsonb,cutoff timestamptz) returns jsonb
language plpgsql set search_path='' as $$
declare e record;a record;start jsonb:='{"state":"unknown"}';first_start jsonb;state text:='not_reported';conflict boolean:=false;begin
 select act.* into a from concierge.activations act join concierge.entitled_publications ep on ep.client_id=act.client_id and ep.version=act.version
 where act.client_id=c and act.product_id=ref->>'productId' and act.confirmed_at<cutoff and act.started_on<(cutoff at time zone 'America/Chicago')::date and ep.starts_on<(cutoff at time zone 'America/Chicago')::date and act.version<=(ref->'publication'->>'version')::integer
 and concierge.care_use_compatible(c,jsonb_build_object('kind','plan_product','publication',concierge.care_publication_ref(c,act.version),'productId',act.product_id,'slotId',act.slot),ref)
 order by act.started_on,act.id limit 1;
 if a.id is not null then state:='using';start:=jsonb_build_object('state','known','value',a.started_on);end if;
 select x.* into e from concierge.final_export_events_v1(c,cutoff,(ref->'publication'->>'version')::integer) x
 where concierge.care_use_candidate(c,x.body->'product',ref)
 order by coalesce(((x.body->'occurredOn'->>'value')::date::timestamp at time zone 'America/Chicago'),x.effective_recorded_at) desc,x.effective_recorded_at desc,x.revision desc limit 1;
 if a.id is null then
  select x.body->'occurredOn' into first_start from concierge.final_export_events_v1(c,cutoff,(ref->'publication'->>'version')::integer) x where concierge.care_use_compatible(c,x.body->'product',ref) and x.body->'change'->>'kind'='started' order by x.revision limit 1;
  start:=coalesce(first_start,start);
 end if;
 if e.body is not null then
  if not concierge.care_use_compatible(c,e.body->'product',ref) then state:='not_reported';start:='{"state":"unknown"}';conflict:=true;
  else
   state:=case e.body->'change'->>'kind' when 'started' then 'using' when 'paused' then 'paused' when 'stopped' then 'stopped' when 'different' then 'using_differently' else 'unreviewed' end;
   select exists(select 1 from concierge.final_export_events_v1(c,cutoff,(ref->'publication'->>'version')::integer) x where concierge.care_use_candidate(c,x.body->'product',ref) and x.effective_recorded_at>e.effective_recorded_at and x.body->'change'->>'kind' is distinct from e.body->'change'->>'kind') into conflict;
   conflict:=conflict or exists(select 1 from concierge.activations act where act.client_id=c and act.product_id=ref->>'productId' and act.confirmed_at<cutoff and act.started_on<(cutoff at time zone 'America/Chicago')::date and act.version<=(ref->'publication'->>'version')::integer and e.body->'change'->>'kind'<>'started' and act.started_on>(e.body->'occurredOn'->>'value')::date and concierge.care_use_compatible(c,jsonb_build_object('kind','plan_product','publication',concierge.care_publication_ref(c,act.version),'productId',act.product_id,'slotId',act.slot),ref));
  end if;
 end if;
 return jsonb_build_object('productId',ref->'productId','state',state,'originalStart',start,'occurredOn',coalesce(e.body->'occurredOn','{"state":"unknown"}'::jsonb),'details',e.body->'change'->'details','frequency',e.body->'change'->'frequency','amount',e.body->'change'->'amount','contradiction',conflict);
end $$;

create function concierge.final_export_instructions_v1(c uuid,ref jsonb,cutoff timestamptz) returns setof jsonb
language plpgsql set search_path='' as $$
declare r record;u jsonb;begin
 for r in select distinct on(slot,product) * from (
  select o.id,o.output_version version,o.body->>'slotId' slot,o.body->>'productId' product,o.body,o.recorded_at published_at,'authored_schedule'::text format
  from concierge.review_guidance_outputs o where o.client_id=c and o.kind='instruction' and o.body->'publication'=ref and o.recorded_at<cutoff and (o.body->>'effectiveOn')::date<(cutoff at time zone 'America/Chicago')::date and concierge.review_is_published(o)
  union all
  select ip.id,ip.version,d.data->>'slot',d.data->>'productId',d.data,ip.created_at,'legacy_usage'
  from concierge.instruction_publications ip join concierge.instruction_drafts d on d.id=ip.draft_id
  where ip.client_id=c and (d.data->>'planVersion')::integer=(ref->>'version')::integer and ref->>'documentSchemaVersion'='2' and ip.created_at<cutoff and (d.data->>'effectiveOn')::date<(cutoff at time zone 'America/Chicago')::date
  and not exists(select 1 from concierge.review_guidance_outputs linked where linked.id=ip.id and linked.kind='instruction')
 ) q order by slot,product,version desc,published_at desc,id desc loop
  u:=case when r.product is not null then concierge.final_export_use_v1(c,jsonb_build_object('kind','plan_product','publication',ref,'productId',r.product,'slotId',null),cutoff) end;
  return next jsonb_build_object('instructionId',r.id,'version',r.version,'slotId',r.slot,'productId',r.product,'effectiveOn',r.body->'effectiveOn','publishedAt',concierge.care_instant(r.published_at),'originalStart',u->'originalStart','content',case when r.format='authored_schedule' then jsonb_build_object('format',r.format,'directions',r.body->'directions','cautions',r.body->'cautions','schedule',r.body->'schedule','reason',r.body->'reason') else jsonb_build_object('format',r.format,'usage',r.body->'usage','reason',r.body->'reason') end);
 end loop;return;
end $$;

create function concierge.final_export_record_v1(c uuid) returns jsonb
language plpgsql set search_path='' as $$
declare last_end date;cancel_end date;cutoff timestamptz;p concierge.publications;doc jsonb;ref jsonb;instructions jsonb;uses jsonb;begin
 select max(ends_on) into last_end from concierge.service_periods where client_id=c;
 select (data->>'supportEndsOn')::date into cancel_end from concierge.service_cancellations where client_id=c;
 if last_end is null or exists(select 1 from concierge.service_periods where client_id=c and starts_on is null) then return jsonb_build_object('unavailable','service_end_unknown');end if;
 if cancel_end is not null then last_end:=least(last_end,cancel_end);end if;
 cutoff:=last_end::timestamp at time zone 'America/Chicago';
 if cutoff>clock_timestamp() then return jsonb_build_object('unavailable','service_not_ended');end if;
 select pub.* into p from concierge.publications pub join concierge.entitled_publications ep on ep.client_id=pub.client_id and ep.version=pub.version join concierge.service_periods sp on sp.claim_id=ep.claim_id and sp.client_id=ep.client_id
 where pub.client_id=c and pub.published_at<cutoff and ep.starts_on=sp.starts_on and ep.starts_on<last_end order by pub.version desc limit 1;
 if not found then return jsonb_build_object('unavailable','entitled_publication_missing');end if;
 doc:=concierge.final_export_document_v1(c,p.version);
 if doc is null then return jsonb_build_object('unavailable',case when p.document_schema_version=3 then 'public_document_missing' else 'legacy_snapshot_missing' end);end if;
 ref:=jsonb_build_object('version',p.version,'documentSchemaVersion',doc->'documentSchemaVersion');
 if exists(select 1 from concierge.review_guidance_outputs o where o.client_id=c and o.kind='instruction' and o.body->'publication'=ref and o.recorded_at<cutoff and (o.body->>'effectiveOn')::date<last_end and not concierge.review_is_published(o)) then return jsonb_build_object('unavailable','instructions_incomplete');end if;
 -- A canonical V3 instruction without its completed output/receipt is not an empty instruction set.
 if exists(select 1 from concierge.instruction_publications ip join concierge.instruction_drafts d on d.id=ip.draft_id where ip.client_id=c and ip.created_at<cutoff and (d.data->>'planVersion')::integer=p.version and (d.data->>'effectiveOn')::date<last_end and ref->>'documentSchemaVersion'='3' and not exists(select 1 from concierge.review_guidance_outputs o where o.id=ip.id and o.client_id=c and o.kind='instruction' and o.body->'publication'=ref and o.recorded_at<cutoff and concierge.review_is_published(o))) then return jsonb_build_object('unavailable','instructions_incomplete');end if;
 select coalesce(jsonb_agg(i order by i->>'instructionId'),'[]') into instructions from concierge.final_export_instructions_v1(c,ref,cutoff) i;
 if jsonb_array_length(instructions)>2550 or exists(select 1 from jsonb_array_elements(instructions) i where not exists(select 1 from concierge.final_export_scopes_v1(doc) s where s.slot_id=i->>'slotId' and s.product_id is not distinct from i->>'productId')) then return jsonb_build_object('unavailable','instructions_incomplete');end if;
 select coalesce(jsonb_agg(concierge.final_export_use_v1(c,jsonb_build_object('kind','plan_product','publication',ref,'productId',pid,'slotId',null),cutoff) order by pid),'[]') into uses from (
  select x->>'id' pid from jsonb_array_elements(doc->'content'->'products') x
  union select x->'product'->>'id' from jsonb_array_elements(doc->'legacyOriginal'->'presentation'->'baselineRoutine') x where x->'product'<>'null'::jsonb
  union select prod->>'id' from jsonb_array_elements(doc->'legacyOriginal'->'presentation'->'categoryCards') x cross join lateral jsonb_array_elements(jsonb_build_array(x->'currentProduct',x->'proposedProduct')) prod where prod<>'null'::jsonb
 ) products;
 return jsonb_build_object('schemaVersion',1,'careBasis',jsonb_build_object('supportEndsOn',last_end,'supportEndsAt',concierge.care_instant(cutoff),'readOnlyEndsOn',last_end+30,'readOnlyEndsAt',concierge.care_instant((last_end+30)::timestamp at time zone 'America/Chicago'),'publication',ref,'publishedAt',concierge.care_instant(p.published_at)),'plan',doc,'use',uses,'instructions',instructions);
end $$;

create function concierge.final_export_manifest_v1(r jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select case when r?'unavailable' then jsonb_build_object('schemaVersion',1,'status','unavailable','reason',r->'unavailable') else jsonb_build_object('schemaVersion',1,'status','available','basis',r->'careBasis'||jsonb_build_object('recordHash',concierge.plan_hash(r),'recordBytes',octet_length(convert_to(r::text,'UTF8')),'recordCharacters',char_length(r::text),'partCount',(char_length(r::text)+32767)/32768,'instructionCount',jsonb_array_length(r->'instructions'))) end
$$;

create function public.concierge_final_export_command_v1(p_command jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c uuid;sid text;action text;r jsonb;m jsonb;result jsonb;n integer;begin
 c:=concierge.final_export_authorize_v1();sid:=auth.jwt()->>'session_id';
 if octet_length(convert_to(p_command::text,'UTF8'))>100000 then perform concierge.fail('too_large');end if;
 action:=p_command->>'action';
 if action='read_final_export_manifest_v1' then perform concierge.keys(p_command,array['schemaVersion','action']);
 elsif action='read_final_export_part_v1' then perform concierge.keys(p_command,array['schemaVersion','action','basis','partIndex']);
 else perform concierge.fail('invalid_input');end if;
 if p_command->'schemaVersion' is distinct from '1'::jsonb then perform concierge.fail('invalid_input');end if;
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||c::text,0));
 if concierge.final_export_authorize_v1() is distinct from c or auth.jwt()->>'session_id' is distinct from sid then perform concierge.fail('session_ended');end if;
 r:=concierge.final_export_record_v1(c);m:=concierge.final_export_manifest_v1(r);
 if action='read_final_export_manifest_v1' then result:=m;
 else
  if m->>'status'<>'available' or p_command->'basis' is distinct from m->'basis' then perform concierge.fail('basis_conflict');end if;
  perform concierge.plan_shape(p_command->'partIndex',jsonb_build_object('type','integer','min',0,'max',(m->'basis'->>'partCount')::integer-1));
  n:=(p_command->>'partIndex')::integer;
  result:=jsonb_build_object('schemaVersion',1,'basis',m->'basis','partIndex',n,'text',substring(r::text from n*32768+1 for 32768));
 end if;
 if octet_length(convert_to(result::text,'UTF8'))>400000 then perform concierge.fail('unavailable');end if;
 if concierge.final_export_authorize_v1() is distinct from c or auth.jwt()->>'session_id' is distinct from sid then perform concierge.fail('session_ended');end if;
 return result;
end $$;

revoke all on function concierge.final_export_authorize_v1() from public,anon,authenticated,service_role;
revoke all on function concierge.final_export_document_v1(uuid,integer) from public,anon,authenticated,service_role;
revoke all on function concierge.final_export_scopes_v1(jsonb) from public,anon,authenticated,service_role;
revoke all on function concierge.final_export_events_v1(uuid,timestamptz,integer) from public,anon,authenticated,service_role;
revoke all on function concierge.final_export_use_v1(uuid,jsonb,timestamptz) from public,anon,authenticated,service_role;
revoke all on function concierge.final_export_instructions_v1(uuid,jsonb,timestamptz) from public,anon,authenticated,service_role;
revoke all on function concierge.final_export_record_v1(uuid) from public,anon,authenticated,service_role;
revoke all on function concierge.final_export_manifest_v1(jsonb) from public,anon,authenticated,service_role;
revoke all on function public.concierge_final_export_command_v1(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.concierge_final_export_command_v1(jsonb) to authenticated;
commit;
