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
 if exists(select 1 from concierge.plan_principals where actor_id=u and (active or kind='agent')) or exists(select 1 from concierge.advisors where user_id=u and active) then perform concierge.fail('forbidden');end if;
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
 -- R1 baseline updates are guarded, but this profile requires the immutable public
 -- publication presentation. A complete R1-specific public projection remains unimplemented.
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

-- Exact retained cosmetic product compatibility, without calling a current care view or
-- constructing its unrelated decision/activation/history arrays. R1 unknown descriptors
-- follow the existing compatibility semantics only; no R1 final snapshot is fabricated.
create function concierge.final_export_product_descriptor_v1(c uuid,ref jsonb,pid text) returns jsonb
language plpgsql set search_path='' as $$
declare doc jsonb;product jsonb;begin
 if concierge.care_publication_ref(c,(ref->>'version')::integer) is distinct from ref then return null;end if;
 if ref->>'documentSchemaVersion'='3' then
  select x into product from concierge.plan_documents d cross join lateral jsonb_array_elements(d.document->'products') x where d.client_id=c and d.version=(ref->>'version')::integer and x->>'id'=pid limit 1;
  return case when product is not null then concierge.care_product_descriptor(product) end;
 end if;
 select presentation into doc from concierge.publication_presentations where client_id=c and version=(ref->>'version')::integer;
 if doc is not null then
  select p into product from (
   select 1 branch,n,p->'product' p from jsonb_array_elements(doc->'baselineRoutine') with ordinality x(p,n)
   union all select 2,n,p->'currentProduct' from jsonb_array_elements(doc->'categoryCards') with ordinality x(p,n)
   union all select 3,n,p->'proposedProduct' from jsonb_array_elements(doc->'categoryCards') with ordinality x(p,n)
  ) candidates where p->>'id'=pid order by branch,n limit 1;
  if product is null then return null;end if;
  return jsonb_build_array(product->'name',product->'brand',product->'variant',jsonb_build_object('state','unknown'),product->'sizeLabel',product->'productUrl',product->'reference');
 end if;
 if exists(select 1 from concierge.publications p cross join lateral jsonb_array_elements(p.recommendations) r where p.client_id=c and p.version=(ref->>'version')::integer and (r->>'currentProductId'=pid or r->>'proposedProductId'=pid)) then return jsonb_build_array('',null,null,jsonb_build_object('state','unknown'),'',null,null);end if;
 return null;
end $$;
create function concierge.final_export_compatible_v1(c uuid,a jsonb,b jsonb) returns boolean
language plpgsql set search_path='' as $$declare x jsonb;y jsonb;begin
 if a->>'kind' is distinct from 'plan_product' or b->>'kind' is distinct from 'plan_product' or a->'productId' is distinct from b->'productId' then return false;end if;
 if not exists(select 1 from concierge.entitled_publications where client_id=c and version=(a->'publication'->>'version')::integer) or not exists(select 1 from concierge.entitled_publications where client_id=c and version=(b->'publication'->>'version')::integer) then return false;end if;
 x:=concierge.final_export_product_descriptor_v1(c,a->'publication',a->>'productId');y:=concierge.final_export_product_descriptor_v1(c,b->'publication',b->>'productId');return x is not null and y is not null and x=y;
end $$;

create function concierge.final_export_event_v1(c uuid,event_id uuid,cutoff timestamptz,v integer) returns jsonb
language sql set search_path='' as $$
 select jsonb_build_object('body',coalesce(am.body->'replacement',ue.body),'effectiveRecordedAt',concierge.care_instant(coalesce(am.recorded_at,e.recorded_at)),'revision',e.revision)
 from concierge.care_events e join concierge.care_use_events ue on ue.event_id=e.id
 left join lateral(select a.body,ae.recorded_at from concierge.care_use_amendments a join concierge.care_events ae on ae.id=a.id where a.event_id=e.id and ae.client_id=c and ae.recorded_at<cutoff order by ae.revision desc limit 1) am on true
 where e.id=$2 and e.client_id=c and e.recorded_at<cutoff and coalesce(am.body->'replacement',ue.body)->'product'->>'kind'='plan_product'
 and exists(select 1 from concierge.entitled_publications ep join concierge.publications p on p.client_id=ep.client_id and p.version=ep.version where ep.client_id=c and ep.version=(coalesce(am.body->'replacement',ue.body)->'product'->'publication'->>'version')::integer and ep.version<=v and ep.starts_on<(cutoff at time zone 'America/Chicago')::date and p.published_at<cutoff)
$$;

create function concierge.final_export_use_v1(c uuid,ref jsonb,cutoff timestamptz) returns jsonb
language plpgsql set search_path='' as $$
declare row_ref record;a record;event jsonb;body jsonb;chosen jsonb;chosen_at timestamptz;chosen_sort timestamptz;chosen_revision bigint;at_time timestamptz;sort_time timestamptz;start jsonb:='{"state":"unknown"}';seen_start boolean:=false;state text:='not_reported';conflict boolean:=false;begin
 select act.* into a from concierge.activations act join concierge.entitled_publications ep on ep.client_id=act.client_id and ep.version=act.version
 where act.client_id=c and act.product_id=ref->>'productId' and act.confirmed_at<cutoff and act.started_on<(cutoff at time zone 'America/Chicago')::date and ep.starts_on<(cutoff at time zone 'America/Chicago')::date and act.version<=(ref->'publication'->>'version')::integer
 and concierge.final_export_compatible_v1(c,jsonb_build_object('kind','plan_product','publication',concierge.care_publication_ref(c,act.version),'productId',act.product_id,'slotId',act.slot),ref)
 order by act.started_on,act.id limit 1;
 if a.id is not null then state:='using';start:=jsonb_build_object('state','known','value',a.started_on);end if;
 -- Metadata cursor only; fetch one bounded immutable effective body at a time. No body tuplestore.
 for row_ref in select e.id,e.revision from concierge.care_events e where e.client_id=c and e.recorded_at<cutoff and exists(select 1 from concierge.care_use_events ue where ue.event_id=e.id) order by e.revision,e.id loop
  event:=concierge.final_export_event_v1(c,row_ref.id,cutoff,(ref->'publication'->>'version')::integer);body:=event->'body';
  if body is null then continue;end if;
  if a.id is null and not seen_start and body->'change'->>'kind'='started' and concierge.final_export_compatible_v1(c,body->'product',ref) then start:=body->'occurredOn';seen_start:=true;end if;
  if concierge.care_use_candidate(c,body->'product',ref) then
   at_time:=(event->>'effectiveRecordedAt')::timestamptz;sort_time:=coalesce(((body->'occurredOn'->>'value')::date::timestamp at time zone 'America/Chicago'),at_time);
   if chosen is null or row(sort_time,at_time,row_ref.revision)>row(chosen_sort,chosen_at,chosen_revision) then chosen:=body;chosen_at:=at_time;chosen_sort:=sort_time;chosen_revision:=row_ref.revision;end if;
  end if;
 end loop;
 if chosen is not null then
  if not concierge.final_export_compatible_v1(c,chosen->'product',ref) then state:='not_reported';start:='{"state":"unknown"}';conflict:=true;
  else
   state:=case chosen->'change'->>'kind' when 'started' then 'using' when 'paused' then 'paused' when 'stopped' then 'stopped' when 'different' then 'using_differently' else 'unreviewed' end;
   for row_ref in select e.id from concierge.care_events e where e.client_id=c and e.recorded_at<cutoff and exists(select 1 from concierge.care_use_events ue where ue.event_id=e.id) order by e.revision,e.id loop
    event:=concierge.final_export_event_v1(c,row_ref.id,cutoff,(ref->'publication'->>'version')::integer);body:=event->'body';
    if body is not null and concierge.care_use_candidate(c,body->'product',ref) and (event->>'effectiveRecordedAt')::timestamptz>chosen_at and body->'change'->>'kind' is distinct from chosen->'change'->>'kind' then conflict:=true;exit;end if;
   end loop;
   conflict:=conflict or exists(select 1 from concierge.activations act where act.client_id=c and act.product_id=ref->>'productId' and act.confirmed_at<cutoff and act.started_on<(cutoff at time zone 'America/Chicago')::date and act.version<=(ref->'publication'->>'version')::integer and chosen->'change'->>'kind'<>'started' and act.started_on>(chosen->'occurredOn'->>'value')::date and concierge.final_export_compatible_v1(c,jsonb_build_object('kind','plan_product','publication',concierge.care_publication_ref(c,act.version),'productId',act.product_id,'slotId',act.slot),ref));
  end if;
 end if;
 return jsonb_build_object('productId',ref->'productId','state',state,'originalStart',start,'occurredOn',coalesce(chosen->'occurredOn','{"state":"unknown"}'::jsonb),'details',chosen->'change'->'details','frequency',chosen->'change'->'frequency','amount',chosen->'change'->'amount','contradiction',conflict);
end $$;

-- Only bounded scalar descriptors enter this relation/sort, never full instruction bodies.
create function concierge.final_export_instruction_rows_v1(c uuid,ref jsonb,cutoff timestamptz)
returns table(id uuid,version bigint,format text,slot text,product text,effective_on date,published_at timestamptz)
language sql set search_path='' as $$
 select distinct on(slot,product) * from (
  select o.id,o.output_version version,'authored_schedule'::text format,o.body->>'slotId' slot,o.body->>'productId' product,(o.body->>'effectiveOn')::date effective_on,o.recorded_at published_at
  from concierge.review_guidance_outputs o where o.client_id=c and o.kind='instruction' and o.body->'publication'=ref and o.recorded_at<cutoff and (o.body->>'effectiveOn')::date<(cutoff at time zone 'America/Chicago')::date and concierge.review_is_published(o)
  union all
  select ip.id,ip.version,'legacy_usage',d.data->>'slot',d.data->>'productId',(d.data->>'effectiveOn')::date,ip.created_at
  from concierge.instruction_publications ip join concierge.instruction_drafts d on d.id=ip.draft_id
  where ip.client_id=c and (d.data->>'planVersion')::integer=(ref->>'version')::integer and ref->>'documentSchemaVersion'='2' and ip.created_at<cutoff and (d.data->>'effectiveOn')::date<(cutoff at time zone 'America/Chicago')::date
  and not exists(select 1 from concierge.review_guidance_outputs linked where linked.id=ip.id and linked.kind='instruction')
 ) q order by slot,product,version desc,published_at desc,id desc
$$;
create function concierge.final_export_hash_text_v1(t text) returns text language sql immutable set search_path='' as $$select encode(sha256(convert_to(t,'UTF8')),'hex')$$;
-- Selection metadata uses canonical PostgreSQL JSONB arrays, lowercase UUIDs, UTC6 instants,
-- safe integral decimal numbers; every list has an explicit deterministic order. Byte framing
-- distinguishes data containing newlines. This is a full relation commitment, not a max-ID claim.
create function concierge.final_export_metadata_fold_v1(previous text,domain text,item jsonb) returns text
language sql immutable set search_path='' as $$select concierge.final_export_hash_text_v1('shelv.final-export.selection.fold.v1'||E'\n'||previous||E'\n'||domain||E'\n'||octet_length(convert_to(item::text,'UTF8'))::text||E'\n'||item::text)$$;

create function concierge.final_export_selection_v1(c uuid) returns jsonb
language plpgsql set search_path='' as $$
declare last_end date;cancel_end date;cutoff timestamptz;p concierge.publications;doc jsonb;ref jsonb;care jsonb;state text;r record;n integer:=0;begin
 select max(ends_on) into last_end from concierge.service_periods where client_id=c;
 select (data->>'supportEndsOn')::date into cancel_end from concierge.service_cancellations where client_id=c;
 if last_end is null or exists(select 1 from concierge.service_periods where client_id=c and starts_on is null) then return jsonb_build_object('unavailable','service_end_unknown');end if;
 if cancel_end is not null then last_end:=least(last_end,cancel_end);end if;cutoff:=last_end::timestamp at time zone 'America/Chicago';
 if cutoff>clock_timestamp() then return jsonb_build_object('unavailable','service_not_ended');end if;
 select pub.* into p from concierge.publications pub join concierge.entitled_publications ep on ep.client_id=pub.client_id and ep.version=pub.version join concierge.service_periods sp on sp.claim_id=ep.claim_id and sp.client_id=ep.client_id
 where pub.client_id=c and pub.published_at<cutoff and ep.starts_on=sp.starts_on and ep.starts_on<last_end order by pub.version desc limit 1;
 if not found then return jsonb_build_object('unavailable','entitled_publication_missing');end if;
 doc:=concierge.final_export_document_v1(c,p.version);
 if doc is null then return jsonb_build_object('unavailable',case when p.document_schema_version=3 then 'public_document_missing' else 'legacy_snapshot_missing' end);end if;
 ref:=jsonb_build_object('version',p.version,'documentSchemaVersion',doc->'documentSchemaVersion');
 if exists(select 1 from concierge.review_guidance_outputs o where o.client_id=c and o.kind='instruction' and o.body->'publication'=ref and o.recorded_at<cutoff and (o.body->>'effectiveOn')::date<last_end and not concierge.review_is_published(o))
 or exists(select 1 from concierge.instruction_publications ip join concierge.instruction_drafts d on d.id=ip.draft_id where ip.client_id=c and ip.created_at<cutoff and (d.data->>'planVersion')::integer=p.version and (d.data->>'effectiveOn')::date<last_end and ref->>'documentSchemaVersion'='3' and not exists(select 1 from concierge.review_guidance_outputs o where o.id=ip.id and o.client_id=c and o.kind='instruction' and o.body->'publication'=ref and o.recorded_at<cutoff and concierge.review_is_published(o))) then return jsonb_build_object('unavailable','instructions_incomplete');end if;
 care:=jsonb_build_object('supportEndsOn',last_end,'supportEndsAt',concierge.care_instant(cutoff),'readOnlyEndsOn',last_end+30,'readOnlyEndsAt',concierge.care_instant((last_end+30)::timestamp at time zone 'America/Chicago'),'publication',ref,'publishedAt',concierge.care_instant(p.published_at));
 state:=concierge.final_export_hash_text_v1('shelv.final-export.selection.v1'||E'\n'||octet_length(convert_to(care::text,'UTF8'))::text||E'\n'||care::text);
 -- Full public immutable plan commitment is bounded by the plan unit, not the bundle.
 state:=concierge.final_export_metadata_fold_v1(state,'plan',jsonb_build_array(p.version,doc->'documentSchemaVersion',concierge.plan_hash(doc)));
 for r in select * from concierge.final_export_instruction_rows_v1(c,ref,cutoff) order by id loop
  if not exists(select 1 from concierge.final_export_scopes_v1(doc) s where s.slot_id=r.slot and s.product_id is not distinct from r.product) then return jsonb_build_object('unavailable','instructions_incomplete');end if;
  n:=n+1;if n>2550 then return jsonb_build_object('unavailable','instructions_incomplete');end if;
  state:=concierge.final_export_metadata_fold_v1(state,'instruction',jsonb_build_array(r.id::text,r.version,r.format,r.slot,r.product,r.effective_on,concierge.care_instant(r.published_at)));
 end loop;
 -- Every pre-end reference participates, including all amendments and all legacy Starts.
 -- These tables reject updates; deletion/omission changes this fold. No head summary substitutes.
 for r in select id,revision,kind,recorded_at from concierge.care_events where client_id=c and recorded_at<cutoff order by revision,id loop
  state:=concierge.final_export_metadata_fold_v1(state,'use_event',jsonb_build_array(r.id::text,r.revision,r.kind,concierge.care_instant(r.recorded_at)));
 end loop;
 for r in select a.id,a.event_id,a.previous_id,e.revision,e.recorded_at from concierge.care_use_amendments a join concierge.care_events e on e.id=a.id where e.client_id=c and e.recorded_at<cutoff order by e.revision,a.id loop
  state:=concierge.final_export_metadata_fold_v1(state,'use_amendment',jsonb_build_array(r.id::text,r.event_id::text,r.previous_id::text,r.revision,concierge.care_instant(r.recorded_at)));
 end loop;
 for r in select a.* from concierge.activations a join concierge.entitled_publications ep on ep.client_id=a.client_id and ep.version=a.version where a.client_id=c and a.confirmed_at<cutoff and a.started_on<last_end and a.version<=p.version and ep.starts_on<last_end order by a.id loop
  state:=concierge.final_export_metadata_fold_v1(state,'legacy_activation',jsonb_build_array(r.id,r.version,r.recommendation_id,r.slot,r.product_id,r.started_on,concierge.care_instant(r.confirmed_at)));
 end loop;
 return care||jsonb_build_object('hashProfile','shelv.final-export.folded-sha256.v1','selectionHash',state,'unitCount',n+1,'instructionCount',n);
end $$;

create function concierge.final_export_unit_v1(c uuid,b jsonb,unit_index integer) returns jsonb
language plpgsql set search_path='' as $$
declare ref jsonb:=b->'publication';cutoff timestamptz:=(b->>'supportEndsAt')::timestamptz;doc jsonb;uses jsonb;d concierge.instruction_drafts;o concierge.review_guidance_outputs;r record;body jsonb;u jsonb;unit jsonb;begin
 if unit_index=0 then
  doc:=concierge.final_export_document_v1(c,(ref->>'version')::integer);
  select coalesce(jsonb_agg(concierge.final_export_use_v1(c,jsonb_build_object('kind','plan_product','publication',ref,'productId',pid,'slotId',null),cutoff) order by pid),'[]') into uses from (
   select x->>'id' pid from jsonb_array_elements(doc->'content'->'products') x
   union select x->'product'->>'id' from jsonb_array_elements(doc->'legacyOriginal'->'presentation'->'baselineRoutine') x where x->'product'<>'null'::jsonb
   union select prod->>'id' from jsonb_array_elements(doc->'legacyOriginal'->'presentation'->'categoryCards') x cross join lateral jsonb_array_elements(jsonb_build_array(x->'currentProduct',x->'proposedProduct')) prod where prod<>'null'::jsonb
  ) products;
  unit:=jsonb_build_object('schemaVersion',1,'kind','plan','careBasis',b-'hashProfile'-'selectionHash'-'unitCount'-'instructionCount','plan',doc,'use',uses);
 else
  select * into r from concierge.final_export_instruction_rows_v1(c,ref,cutoff) order by id offset unit_index-1 limit 1;
  if not found then perform concierge.fail('not_found');end if;
  if r.format='authored_schedule' then
   select * into o from concierge.review_guidance_outputs where id=r.id and client_id=c;
   if not found or not concierge.review_is_published(o) then perform concierge.fail('unavailable');end if;
   body:=jsonb_build_object('format',r.format,'directions',o.body->'directions','cautions',o.body->'cautions','schedule',o.body->'schedule','reason',o.body->'reason');
  else
   select draft.* into d from concierge.instruction_publications ip join concierge.instruction_drafts draft on draft.id=ip.draft_id where ip.id=r.id and ip.client_id=c;
   if not found then perform concierge.fail('unavailable');end if;
   body:=jsonb_build_object('format',r.format,'usage',d.data->'usage','reason',d.data->'reason');
  end if;
  u:=case when r.product is not null then concierge.final_export_use_v1(c,jsonb_build_object('kind','plan_product','publication',ref,'productId',r.product,'slotId',null),cutoff) end;
  unit:=jsonb_build_object('schemaVersion',1,'kind','instruction','instruction',jsonb_build_object('instructionId',r.id,'version',r.version,'slotId',r.slot,'productId',r.product,'effectiveOn',r.effective_on,'publishedAt',concierge.care_instant(r.published_at),'originalStart',u->'originalStart','content',body));
 end if;
 -- Derived per-unit bounds include use/metadata/wrappers. Never a full-bundle bound or row cap.
 if octet_length(convert_to(unit::text,'UTF8'))>case when unit_index=0 then 14772736 else 865536 end then perform concierge.fail('unavailable');end if;
 return unit;
end $$;
create function concierge.final_export_leaf_v1(unit_index integer,kind text,segment_index integer,segment_count integer,t text) returns text
language sql immutable set search_path='' as $$select concierge.final_export_hash_text_v1('shelv.final-export.segment.v1'||E'\n'||unit_index::text||E'\n'||kind||E'\n'||segment_index::text||E'\n'||segment_count::text||E'\n'||octet_length(convert_to(t,'UTF8'))::text||E'\n'||t)$$;
create function concierge.final_export_manifest_v1(c uuid,b jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare unit jsonb;t text;piece text;state text;leaf text;total_bytes bigint:=0;parts bigint:=0;unit_index integer;segment_index integer;segments integer;begin
 if b?'unavailable' then return jsonb_build_object('schemaVersion',1,'status','unavailable','reason',b->'unavailable');end if;
 state:=concierge.final_export_hash_text_v1('shelv.final-export.root.v1'||E'\n'||(b->>'selectionHash')||E'\n'||(b->>'unitCount')||E'\n'||(b->>'instructionCount')||E'\n');
 for unit_index in 0..(b->>'unitCount')::integer-1 loop
  unit:=concierge.final_export_unit_v1(c,b,unit_index);t:=unit::text;segments:=(char_length(t)+32767)/32768;total_bytes:=total_bytes+octet_length(convert_to(t,'UTF8'));
  for segment_index in 0..segments-1 loop
   piece:=substring(t from segment_index*32768+1 for 32768);leaf:=concierge.final_export_leaf_v1(unit_index,unit->>'kind',segment_index,segments,piece);
   state:=concierge.final_export_hash_text_v1('shelv.final-export.fold.v1'||E'\n'||state||E'\n'||parts::text||E'\n'||leaf||E'\n');parts:=parts+1;
  end loop;
 end loop;
 state:=concierge.final_export_hash_text_v1('shelv.final-export.complete.v1'||E'\n'||state||E'\n'||parts::text||E'\n'||total_bytes::text||E'\n'||(b->>'unitCount')||E'\n'||(b->>'instructionCount')||E'\n');
 return jsonb_build_object('schemaVersion',1,'status','available','basis',b,'rootHash',state,'partCount',parts,'totalBytes',total_bytes);
end $$;

create function public.concierge_final_export_command_v1(p_command jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c uuid;sid text;action text;b jsonb;result jsonb;unit jsonb;t text;piece text;unit_index integer;segment_index integer;segments integer;begin
 c:=concierge.final_export_authorize_v1();sid:=auth.jwt()->>'session_id';
 if octet_length(convert_to(p_command::text,'UTF8'))>100000 then perform concierge.fail('too_large');end if;action:=p_command->>'action';
 if action='read_final_export_manifest_v1' then perform concierge.keys(p_command,array['schemaVersion','action']);
 elsif action='read_final_export_part_v1' then perform concierge.keys(p_command,array['schemaVersion','action','basis','partIndex']);else perform concierge.fail('invalid_input');end if;
 if p_command->'schemaVersion' is distinct from '1'::jsonb then perform concierge.fail('invalid_input');end if;
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||c::text,0));
 if concierge.final_export_authorize_v1() is distinct from c or auth.jwt()->>'session_id' is distinct from sid then perform concierge.fail('session_ended');end if;
 b:=concierge.final_export_selection_v1(c);
 if action='read_final_export_manifest_v1' then result:=concierge.final_export_manifest_v1(c,b);
 else
  if b?'unavailable' or p_command->'basis' is distinct from b then perform concierge.fail('basis_conflict');end if;
  perform concierge.keys(p_command->'partIndex',array['unitIndex','segmentIndex']);
  perform concierge.plan_shape(p_command->'partIndex'->'unitIndex',jsonb_build_object('type','integer','min',0,'max',(b->>'unitCount')::integer-1));
  perform concierge.plan_shape(p_command->'partIndex'->'segmentIndex',jsonb_build_object('type','integer','min',0,'max',450));
  unit_index:=(p_command->'partIndex'->>'unitIndex')::integer;segment_index:=(p_command->'partIndex'->>'segmentIndex')::integer;
  unit:=concierge.final_export_unit_v1(c,b,unit_index);t:=unit::text;segments:=(char_length(t)+32767)/32768;
  if segment_index>=segments then perform concierge.fail('not_found');end if;piece:=substring(t from segment_index*32768+1 for 32768);
  result:=jsonb_build_object('schemaVersion',1,'basis',b,'partIndex',p_command->'partIndex','kind',unit->'kind','segmentCount',segments,'unitCharacters',char_length(t),'unitBytes',octet_length(convert_to(t,'UTF8')),'text',piece,'leafHash',concierge.final_export_leaf_v1(unit_index,unit->>'kind',segment_index,segments,piece));
 end if;
 if octet_length(convert_to(result::text,'UTF8'))>400000 then perform concierge.fail('unavailable');end if;
 if concierge.final_export_selection_v1(c) is distinct from b then perform concierge.fail('basis_conflict');end if;
 if concierge.final_export_authorize_v1() is distinct from c or auth.jwt()->>'session_id' is distinct from sid then perform concierge.fail('session_ended');end if;return result;
end $$;
revoke all on function concierge.final_export_product_descriptor_v1(uuid,jsonb,text),concierge.final_export_compatible_v1(uuid,jsonb,jsonb),concierge.final_export_authorize_v1(),concierge.final_export_document_v1(uuid,integer),concierge.final_export_scopes_v1(jsonb),concierge.final_export_event_v1(uuid,uuid,timestamptz,integer),concierge.final_export_use_v1(uuid,jsonb,timestamptz),concierge.final_export_instruction_rows_v1(uuid,jsonb,timestamptz),concierge.final_export_hash_text_v1(text),concierge.final_export_metadata_fold_v1(text,text,jsonb),concierge.final_export_selection_v1(uuid),concierge.final_export_unit_v1(uuid,jsonb,integer),concierge.final_export_leaf_v1(integer,text,integer,integer,text),concierge.final_export_manifest_v1(uuid,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.concierge_final_export_command_v1(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.concierge_final_export_command_v1(jsonb) to authenticated;
commit;
