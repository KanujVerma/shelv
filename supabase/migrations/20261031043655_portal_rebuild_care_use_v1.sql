-- Additive care/use/identity, bounded projections and private dependency bases. No principal/config seeds.
begin;
create function concierge.care_command_fields() returns jsonb language sql immutable set search_path='' as $fn$ select $shape${"report_unreviewed_product_v1":{"requestId":{"type":"uuid"},"expectedUseRevision":{"type":"integer","min":0,"max":9007199254740991},"product":{"type":"object","fields":{"name":{"type":"text","max":200,"empty":false},"brand":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"variant":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"strength":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"sizeLabel":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"labelPhotoIds":{"type":"array","item":{"type":"uuid"},"max":100,"min":0,"unique":true}}},"sourcePublication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}},"nullable":true},"occurredOn":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"date"}}}]},"channel":{"type":"enum","values":["portal","text","call","video","in_person"]},"acquisition":{"type":"enum","values":["shelv","self","already_owned","unknown"]}},"record_client_unreviewed_product_v1":{"requestId":{"type":"uuid"},"expectedUseRevision":{"type":"integer","min":0,"max":9007199254740991},"product":{"type":"object","fields":{"name":{"type":"text","max":200,"empty":false},"brand":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"variant":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"strength":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"sizeLabel":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"labelPhotoIds":{"type":"array","item":{"type":"uuid"},"max":100,"min":0,"unique":true}}},"sourcePublication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}},"nullable":true},"occurredOn":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"date"}}}]},"channel":{"type":"enum","values":["portal","text","call","video","in_person"]},"acquisition":{"type":"enum","values":["shelv","self","already_owned","unknown"]},"clientId":{"type":"uuid"},"confirmedClientReport":{"type":"enum","values":[true]}},"amend_reported_product_v1":{"requestId":{"type":"uuid"},"expectedUseRevision":{"type":"integer","min":0,"max":9007199254740991},"product":{"type":"object","fields":{"kind":{"type":"enum","values":["client_reported_product"]},"reportedProductId":{"type":"uuid"},"version":{"type":"integer","min":1,"max":9007199254740991}}},"replacement":{"type":"object","fields":{"name":{"type":"text","max":200,"empty":false},"brand":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"variant":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"strength":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"sizeLabel":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"labelPhotoIds":{"type":"array","item":{"type":"uuid"},"max":100,"min":0,"unique":true}}},"reason":{"type":"text","max":4000,"empty":false}},"report_identity_v1":{"requestId":{"type":"uuid"},"expectedUseRevision":{"type":"integer","min":0,"max":9007199254740991},"target":{"type":"object","fields":{"subject":{"type":"union","variants":[{"type":"object","fields":{"kind":{"type":"enum","values":["plan_product"]},"publication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}}},"productId":{"type":"identifier"},"slotId":{"type":"identifier","nullable":true}}},{"type":"object","fields":{"kind":{"type":"enum","values":["client_reported_product"]},"reportedProductId":{"type":"uuid"},"version":{"type":"integer","min":1,"max":9007199254740991}}}]},"comparedWith":{"type":"object","fields":{"kind":{"type":"enum","values":["plan_product"]},"publication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}}},"productId":{"type":"identifier"},"slotId":{"type":"identifier","nullable":true}},"nullable":true}}},"answer":{"type":"object","fields":{"match":{"type":"enum","values":["yes","no","not_sure"]},"reportedName":{"type":"text","max":200,"empty":false,"nullable":true},"variant":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"strength":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":200,"empty":false}}}]},"labelPhotoIds":{"type":"array","item":{"type":"uuid"},"max":100,"min":0,"unique":true}}},"sourcePublication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}},"nullable":true},"occurredOn":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"date"}}}]},"channel":{"type":"enum","values":["portal","text","call","video","in_person"]}},"report_product_use_v1":{"requestId":{"type":"uuid"},"expectedUseRevision":{"type":"integer","min":0,"max":9007199254740991},"product":{"type":"union","variants":[{"type":"object","fields":{"kind":{"type":"enum","values":["plan_product"]},"publication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}}},"productId":{"type":"identifier"},"slotId":{"type":"identifier","nullable":true}}},{"type":"object","fields":{"kind":{"type":"enum","values":["client_reported_product"]},"reportedProductId":{"type":"uuid"},"version":{"type":"integer","min":1,"max":9007199254740991}}}]},"change":{"type":"union","variants":[{"type":"object","fields":{"kind":{"type":"enum","values":["started"]}}},{"type":"object","fields":{"kind":{"type":"enum","values":["paused","stopped"]},"details":{"type":"text","max":4000,"empty":false,"nullable":true}}},{"type":"object","fields":{"kind":{"type":"enum","values":["different"]},"frequency":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":4000,"empty":false}}}]},"amount":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":4000,"empty":false}}}]},"details":{"type":"text","max":4000,"empty":false}}},{"type":"object","fields":{"kind":{"type":"enum","values":["unreviewed_added"]},"details":{"type":"text","max":4000,"empty":false,"nullable":true}}}]},"sourcePublication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}},"nullable":true},"occurredOn":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"date"}}}]},"acquisition":{"type":"enum","values":["shelv","self","already_owned","unknown"]},"identityEventId":{"type":"uuid","nullable":true},"channel":{"type":"enum","values":["portal","text","call","video","in_person"]}},"record_client_use_v1":{"requestId":{"type":"uuid"},"expectedUseRevision":{"type":"integer","min":0,"max":9007199254740991},"product":{"type":"union","variants":[{"type":"object","fields":{"kind":{"type":"enum","values":["plan_product"]},"publication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}}},"productId":{"type":"identifier"},"slotId":{"type":"identifier","nullable":true}}},{"type":"object","fields":{"kind":{"type":"enum","values":["client_reported_product"]},"reportedProductId":{"type":"uuid"},"version":{"type":"integer","min":1,"max":9007199254740991}}}]},"change":{"type":"union","variants":[{"type":"object","fields":{"kind":{"type":"enum","values":["started"]}}},{"type":"object","fields":{"kind":{"type":"enum","values":["paused","stopped"]},"details":{"type":"text","max":4000,"empty":false,"nullable":true}}},{"type":"object","fields":{"kind":{"type":"enum","values":["different"]},"frequency":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":4000,"empty":false}}}]},"amount":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":4000,"empty":false}}}]},"details":{"type":"text","max":4000,"empty":false}}},{"type":"object","fields":{"kind":{"type":"enum","values":["unreviewed_added"]},"details":{"type":"text","max":4000,"empty":false,"nullable":true}}}]},"sourcePublication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}},"nullable":true},"occurredOn":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"date"}}}]},"acquisition":{"type":"enum","values":["shelv","self","already_owned","unknown"]},"identityEventId":{"type":"uuid","nullable":true},"channel":{"type":"enum","values":["portal","text","call","video","in_person"]},"clientId":{"type":"uuid"},"confirmedClientReport":{"type":"enum","values":[true]}},"amend_use_v1":{"requestId":{"type":"uuid"},"expectedUseRevision":{"type":"integer","min":0,"max":9007199254740991},"eventId":{"type":"uuid"},"expectedAmendmentHeadId":{"type":"uuid","nullable":true},"replacement":{"type":"object","fields":{"product":{"type":"union","variants":[{"type":"object","fields":{"kind":{"type":"enum","values":["plan_product"]},"publication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}}},"productId":{"type":"identifier"},"slotId":{"type":"identifier","nullable":true}}},{"type":"object","fields":{"kind":{"type":"enum","values":["client_reported_product"]},"reportedProductId":{"type":"uuid"},"version":{"type":"integer","min":1,"max":9007199254740991}}}]},"change":{"type":"union","variants":[{"type":"object","fields":{"kind":{"type":"enum","values":["started"]}}},{"type":"object","fields":{"kind":{"type":"enum","values":["paused","stopped"]},"details":{"type":"text","max":4000,"empty":false,"nullable":true}}},{"type":"object","fields":{"kind":{"type":"enum","values":["different"]},"frequency":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":4000,"empty":false}}}]},"amount":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"text","max":4000,"empty":false}}}]},"details":{"type":"text","max":4000,"empty":false}}},{"type":"object","fields":{"kind":{"type":"enum","values":["unreviewed_added"]},"details":{"type":"text","max":4000,"empty":false,"nullable":true}}}]},"sourcePublication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}},"nullable":true},"occurredOn":{"type":"union","variants":[{"type":"object","fields":{"state":{"type":"enum","values":["unknown"]}}},{"type":"object","fields":{"state":{"type":"enum","values":["known"]},"value":{"type":"date"}}}]},"acquisition":{"type":"enum","values":["shelv","self","already_owned","unknown"]},"identityEventId":{"type":"uuid","nullable":true}}},"reason":{"type":"text","max":4000,"empty":false}},"read_client_plan_v2":{"version":{"type":"integer","min":1,"max":9007199254740991,"nullable":true}},"read_advisor_publication_v2":{"clientId":{"type":"uuid"},"version":{"type":"integer","min":1,"max":9007199254740991,"nullable":true}},"read_reported_products_v1":{"cursor":{"type":"text","max":200,"empty":false,"nullable":true},"limit":{"type":"integer","min":1,"max":100},"expectedUseRevision":{"type":"integer","min":0,"max":9007199254740991},"publicationVersion":{"type":"integer","min":1,"max":9007199254740991,"nullable":true}},"read_use_history_v1":{"product":{"type":"union","variants":[{"type":"object","fields":{"kind":{"type":"enum","values":["plan_product"]},"publication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}}},"productId":{"type":"identifier"},"slotId":{"type":"identifier","nullable":true}}},{"type":"object","fields":{"kind":{"type":"enum","values":["client_reported_product"]},"reportedProductId":{"type":"uuid"},"version":{"type":"integer","min":1,"max":9007199254740991}}}],"nullable":true},"cursor":{"type":"text","max":200,"empty":false,"nullable":true},"limit":{"type":"integer","min":1,"max":100}},"read_advisor_use_history_v1":{"product":{"type":"union","variants":[{"type":"object","fields":{"kind":{"type":"enum","values":["plan_product"]},"publication":{"type":"object","fields":{"version":{"type":"integer","min":1,"max":9007199254740991},"documentSchemaVersion":{"type":"enum","values":[1,2,3]}}},"productId":{"type":"identifier"},"slotId":{"type":"identifier","nullable":true}}},{"type":"object","fields":{"kind":{"type":"enum","values":["client_reported_product"]},"reportedProductId":{"type":"uuid"},"version":{"type":"integer","min":1,"max":9007199254740991}}}],"nullable":true},"cursor":{"type":"text","max":200,"empty":false,"nullable":true},"limit":{"type":"integer","min":1,"max":100},"clientId":{"type":"uuid"}},"request_status_v1":{"requestId":{"type":"uuid"}}}$shape$::jsonb $fn$;
alter function concierge.plan_command_fields() rename to plan_command_fields_before_care_v1;
create function concierge.plan_command_fields() returns jsonb language sql immutable set search_path='' as $fn$ select concierge.plan_command_fields_before_care_v1() || $shape${"read_draft_dependencies_v1":{"draftId":{"type":"uuid"},"contentRevision":{"type":"integer","min":0,"max":9007199254740991},"assignmentRevision":{"type":"integer","min":0,"max":9007199254740991}},"rebase_draft_dependencies_v1":{"requestId":{"type":"uuid"},"draftId":{"type":"uuid"},"expectedContentRevision":{"type":"integer","min":0,"max":9007199254740991},"expectedAssignmentRevision":{"type":"integer","min":0,"max":9007199254740991},"expectedHeads":{"type":"object","fields":{"useHead":{"type":"integer","min":0,"max":9007199254740991},"reportHead":{"type":"integer","min":0,"max":9007199254740991},"instructionHead":{"type":"integer","min":0,"max":9007199254740991}}},"expectedLegacyBasis":{"type":"object","fields":{"publicationVersion":{"type":"integer","min":1,"max":9007199254740991,"nullable":true},"useRevision":{"type":"integer","min":0,"max":9007199254740991}}},"expectedLegacyBasisManifestHash":{"type":"hash"}}}$shape$::jsonb $fn$;
create table concierge.care_use_heads(client_id uuid primary key references concierge.cases on delete cascade,revision bigint not null default 0 check(revision between 0 and 9007199254740991));
create table concierge.care_report_heads(client_id uuid primary key references concierge.cases on delete cascade,revision bigint not null default 0 check(revision between 0 and 9007199254740991));
create table concierge.care_instruction_heads(client_id uuid primary key references concierge.cases on delete cascade,revision bigint not null default 0 check(revision between 0 and 9007199254740991));
create table concierge.care_events(id uuid primary key default gen_random_uuid(),client_id uuid not null references concierge.cases on delete cascade,revision bigint not null,kind text not null check(kind in ('use','identity','reported_product','amendment')),product jsonb not null,payload jsonb not null,recorded_at timestamptz not null default clock_timestamp(),recorded_by uuid not null,unique(client_id,revision));
create table concierge.care_use_events(event_id uuid primary key references concierge.care_events on delete cascade,body jsonb not null);
create index care_events_product on concierge.care_events(client_id,kind,revision);
create table concierge.care_reported_products(id uuid primary key default gen_random_uuid(),client_id uuid not null references concierge.cases on delete cascade,created_at timestamptz not null default clock_timestamp());
create table concierge.care_reported_product_versions(product_id uuid not null references concierge.care_reported_products on delete cascade,version bigint not null check(version>0),descriptor jsonb not null,event_id uuid not null unique references concierge.care_events on delete cascade,primary key(product_id,version));
create table concierge.care_use_amendments(id uuid primary key references concierge.care_events on delete cascade,event_id uuid not null references concierge.care_events on delete cascade,previous_id uuid references concierge.care_use_amendments,body jsonb not null);
create unique index care_one_amendment_successor on concierge.care_use_amendments(event_id,coalesce(previous_id,'00000000-0000-0000-0000-000000000000'::uuid));
create table concierge.care_requests(actor_id uuid not null references auth.users on delete cascade,request_id uuid not null,client_id uuid not null references concierge.cases on delete cascade,command jsonb not null,fingerprint bytea not null,result jsonb not null,primary key(actor_id,request_id));
-- Server-managed exact recipient configuration. No public enrollment/configuration command or seed.
create table concierge.care_attention_routes(client_id uuid not null references concierge.cases on delete cascade,advisor_id uuid not null references concierge.plan_principals on delete cascade,email_enabled boolean not null default false,primary key(client_id,advisor_id));
create table concierge.care_attention(event_id uuid primary key references concierge.care_events on delete cascade,client_id uuid not null references concierge.cases on delete cascade,notification_event_id uuid not null unique references concierge.plan_events on delete cascade,created_at timestamptz not null default clock_timestamp());
create table concierge.plan_draft_dependency_bases(draft_id uuid not null references concierge.plan_drafts on delete cascade,content_revision bigint not null,dependency_schema_version integer not null default 2 check(dependency_schema_version=2),heads jsonb not null,review_required boolean not null default false,primary key(draft_id,content_revision));
-- Preserve historical event IDs/publication uniqueness while allowing multiple material reports.
alter table concierge.plan_events drop constraint plan_events_kind_check;
alter table concierge.plan_events drop constraint plan_events_client_id_publication_version_kind_key;
alter table concierge.plan_events add column source_kind text not null default 'publication',add column source_id uuid,add column source_version bigint;
alter table concierge.plan_events add constraint care_event_source_check check((kind='plan_published' and source_kind='publication' and source_id is null and source_version is null) or (kind in ('use_reported','use_amended','report_amended') and source_kind='care' and source_id is not null and source_version is not null and source_version between 1 and 9007199254740991));
create unique index plan_original_publication_event on concierge.plan_events(client_id,publication_version,kind) where kind='plan_published';
create unique index plan_typed_source_event on concierge.plan_events(client_id,source_kind,source_id,source_version) where source_id is not null;
create function concierge.care_immutable() returns trigger language plpgsql set search_path='' as $$begin perform concierge.fail('forbidden');return null;end $$;
do $$declare t text;begin foreach t in array array['care_events','care_use_events','care_reported_product_versions','care_use_amendments','care_requests','care_attention','plan_draft_dependency_bases'] loop execute format('create trigger care_immutable before update on concierge.%I for each row execute function concierge.care_immutable()',t);end loop;end $$;
create function concierge.care_revision(c uuid) returns bigint language sql set search_path='' as $$ select coalesce((select revision from concierge.care_use_heads where client_id=c),0) $$;
create function concierge.care_guard(c uuid,advisor boolean,writing boolean,audit boolean default false) returns void language plpgsql set search_path='' as $$
declare p concierge.plan_policy;pr concierge.plan_principals;s uuid;begin
 select * into p from concierge.plan_policy where singleton for share;if p.activated is distinct from true then perform concierge.fail('candidate_inactive');end if;
 begin s:=(auth.jwt()->>'session_id')::uuid;exception when invalid_text_representation then perform concierge.fail('session_ended');end;
 if auth.uid() is null or s is null then perform concierge.fail('session_ended');end if;
 select * into pr from concierge.plan_principals where actor_id=auth.uid() for share;
 if pr.kind='agent' then perform concierge.fail('forbidden');end if;
 perform concierge.plan_session(auth.uid(),s);
 if advisor then
  if pr.actor_id is null or not pr.active or pr.kind not in ('owner','human') then perform concierge.fail('forbidden');end if;
  if pr.kind='owner' and pr.actor_id is distinct from p.owner_actor_id then perform concierge.fail('forbidden');end if;
  perform concierge.capability(auth.uid(),case when writing then 'edit' else 'view' end);
 elsif c is distinct from auth.uid() or exists(select 1 from concierge.advisors where user_id=auth.uid() and active) then perform concierge.fail('forbidden');end if;
 perform concierge.plan_target_client(c,writing);
 if not audit and (writing or exists(select 1 from concierge.entitled_publications where client_id=c)) then perform concierge.plan_care_access(c,writing);end if;
 if writing and not exists(select 1 from concierge.entitled_publications where client_id=c) then perform concierge.fail('forbidden');end if;
end $$;
create function concierge.care_publication(c uuid,p jsonb) returns jsonb language plpgsql set search_path='' as $$
declare d jsonb;v integer;begin
 if p is null or p='null'::jsonb then return null;end if;v:=(p->>'version')::integer;
 if not exists(select 1 from concierge.entitled_publications where client_id=c and version=v) then perform concierge.fail('not_found');end if;
 d:=concierge.plan_advisor_publication_before_care_v1(c,v)->'plan';
 if d->'documentSchemaVersion' is distinct from p->'documentSchemaVersion' then perform concierge.fail('revision_conflict');end if;
 return d;
end $$;
create function concierge.care_resolve_product(c uuid,p jsonb,current_descriptor boolean default true) returns void language plpgsql set search_path='' as $$
declare d jsonb;begin
 if p->>'kind'='plan_product' then
  d:=concierge.care_publication(c,p->'publication');
  if not exists(select 1 from jsonb_array_elements(d->'content'->'products') x where x->'id'=p->'productId') then perform concierge.fail('not_found');end if;
  if p->'slotId'<>'null'::jsonb and not exists(select 1 from jsonb_array_elements(d->'content'->'routine') x where x->'slotId'=p->'slotId' and x->'productId'=p->'productId') and not exists(select 1 from jsonb_array_elements(d->'content'->'decisions') x where x->'slotId'=p->'slotId' and (x->'primaryProductId'=p->'productId' or (x->'currentProductIds') @> jsonb_build_array(p->'productId') or (x->'alternativeProductIds') @> jsonb_build_array(p->'productId'))) then perform concierge.fail('not_found');end if;
 else
  if not exists(select 1 from concierge.care_reported_products r join concierge.care_reported_product_versions v on v.product_id=r.id where r.client_id=c and r.id=(p->>'reportedProductId')::uuid and v.version=(p->>'version')::bigint) then perform concierge.fail('not_found');end if;
  if current_descriptor and (p->>'version')::bigint<>(select max(version) from concierge.care_reported_product_versions where product_id=(p->>'reportedProductId')::uuid) then perform concierge.fail('identity_conflict');end if;
 end if;
end $$;
create function concierge.care_same_product(a jsonb,b jsonb) returns boolean language sql immutable set search_path='' as $$ select case when a->>'kind'='plan_product' and b->>'kind'='plan_product' then a->'publication'=b->'publication' and a->'productId'=b->'productId' and (b->'slotId'='null'::jsonb or a->'slotId'=b->'slotId') else a=b end $$;
create function concierge.care_occurrence(o jsonb) returns void language plpgsql set search_path='' as $$begin
 if o->>'state'='known' and (o->>'value')::date>(clock_timestamp() at time zone 'America/Chicago')::date then perform concierge.fail('invalid_input');end if;
end $$;

create function concierge.plan_dependency_basis_v2(c uuid) returns jsonb language sql set search_path='' as $$
 select jsonb_build_object('schemaVersion',2,'legacyBasis',jsonb_build_object('publicationVersion',b->'publicationVersion','useRevision',b->'useRevision'),'legacyBasisManifestHash',concierge.plan_hash(b),'useHead',concierge.care_revision(c),'reportHead',coalesce((select revision from concierge.care_report_heads where client_id=c),0),'instructionHead',coalesce((select revision from concierge.care_instruction_heads where client_id=c),0),'references','[]'::jsonb) from (select concierge.plan_basis(c) b) x
$$;
-- Old drafts are explicitly unresolved; never bless an unseen head or change their old basis.
insert into concierge.plan_draft_dependency_bases(draft_id,content_revision,heads,review_required)
 select id,content_revision,jsonb_build_object('schemaVersion',2,'legacyBasis',basis,'legacyBasisManifestHash',concierge.plan_hash(basis_manifest),'useHead',0,'reportHead',0,'instructionHead',0,'references','[]'::jsonb),true from concierge.plan_drafts;
create function concierge.care_capture_dependency() returns trigger language plpgsql set search_path='' as $$
declare h jsonb;r boolean:=false;begin
 if TG_OP='INSERT' then h:=concierge.plan_dependency_basis_v2(new.client_id);
 elsif new.content_revision=old.content_revision then return new;
 elsif new.client_id is distinct from old.client_id then h:=concierge.plan_dependency_basis_v2(new.client_id);
 else select heads,review_required into h,r from concierge.plan_draft_dependency_bases where draft_id=old.id and content_revision=old.content_revision;end if;
 if h is null then h:=concierge.plan_dependency_basis_v2(new.client_id);r:=true;end if;
 insert into concierge.plan_draft_dependency_bases(draft_id,content_revision,heads,review_required) values(new.id,new.content_revision,h,r) on conflict do nothing;
 return new;
end $$;
create trigger care_capture_dependency after insert or update on concierge.plan_drafts for each row execute function concierge.care_capture_dependency();
create function concierge.care_dependencies_current(d concierge.plan_drafts,published_version integer default null) returns boolean language plpgsql set search_path='' as $$
declare h jsonb;need boolean;cur jsonb;basis jsonb;begin
 select heads,review_required into h,need from concierge.plan_draft_dependency_bases where draft_id=d.id and content_revision=d.content_revision;
 if h is null or need then return false;end if;
 cur:=concierge.plan_dependency_basis_v2(d.client_id);
 if published_version is not null then
  basis:=concierge.plan_basis(d.client_id)||jsonb_build_object('publicationVersion',nullif(published_version-1,0));
  cur:=cur||jsonb_build_object('legacyBasis',jsonb_build_object('publicationVersion',basis->'publicationVersion','useRevision',basis->'useRevision'),'legacyBasisManifestHash',concierge.plan_hash(basis));
 end if;
 return h=cur;
end $$;
alter function concierge.plan_exact(concierge.plan_drafts) rename to plan_exact_before_care_v1;
create function concierge.plan_exact(d concierge.plan_drafts) returns jsonb language sql set search_path='' as $$
 select concierge.plan_exact_before_care_v1(d)||jsonb_build_object('contentHash',concierge.plan_hash(jsonb_build_object('oldTarget',concierge.plan_exact_before_care_v1(d),'dependencies',(select heads from concierge.plan_draft_dependency_bases where draft_id=d.id and content_revision=d.content_revision),'reviewRequired',coalesce((select review_required from concierge.plan_draft_dependency_bases where draft_id=d.id and content_revision=d.content_revision),true))))
$$;
alter function concierge.plan_section_hash(concierge.plan_drafts,text) rename to plan_section_hash_before_care_v1;
create function concierge.plan_section_hash(d concierge.plan_drafts,s text) returns text language sql set search_path='' as $$
 select case when s='sources' then concierge.plan_section_hash_before_care_v1(d,s) else concierge.plan_hash(jsonb_build_object('oldHash',concierge.plan_section_hash_before_care_v1(d,s),'captured',(select heads from concierge.plan_draft_dependency_bases where draft_id=d.id and content_revision=d.content_revision),'currentHeads',concierge.plan_dependency_basis_v2(d.client_id)-'legacyBasis'-'legacyBasisManifestHash','reviewRequired',coalesce((select review_required from concierge.plan_draft_dependency_bases where draft_id=d.id and content_revision=d.content_revision),true))) end
$$;
alter function concierge.plan_issues(concierge.plan_drafts,boolean) rename to plan_issues_before_care_v1;
create function concierge.plan_issues(d concierge.plan_drafts,include_reviews boolean default true) returns jsonb language sql set search_path='' as $$
 select concierge.plan_issues_before_care_v1(d,include_reviews)||case when not concierge.care_dependencies_current(d) then jsonb_build_array(jsonb_build_object('section','context','path','dependencies','code','basis_conflict')) else '[]'::jsonb end
$$;
create function concierge.care_legacy_head() returns trigger language plpgsql set search_path='' as $$begin
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||new.client_id::text,0));
 if TG_TABLE_NAME='checkin_reports' then insert into concierge.care_report_heads values(new.client_id,1) on conflict(client_id) do update set revision=concierge.care_report_heads.revision+1;
 else insert into concierge.care_instruction_heads values(new.client_id,1) on conflict(client_id) do update set revision=concierge.care_instruction_heads.revision+1;end if;
 return new;
end $$;
create trigger care_legacy_report_head after insert on concierge.checkin_reports for each row execute function concierge.care_legacy_head();
create trigger care_legacy_instruction_head after insert on concierge.instruction_publications for each row execute function concierge.care_legacy_head();
-- An additional deferred fence checks heads independently from the retained legacy-basis exception.
create function concierge.care_publication_dependency_fence() returns trigger language plpgsql security definer set search_path='' as $$
declare d concierge.plan_drafts;r concierge.plan_publication_receipts;begin
 select * into r from concierge.plan_publication_receipts where client_id=new.client_id and version=new.version;
 if not found then return null;end if;
 select pd.* into d from concierge.plan_approvals ap join concierge.plan_drafts pd on pd.id=ap.draft_id where ap.id=r.approval_id;
 perform concierge.plan_authorize('publish_plan_v1',d.id,d.client_id,r.grant_id);
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||d.client_id::text,0));
 if not concierge.care_dependencies_current(d,new.version) then perform concierge.fail('basis_conflict');end if;
 perform concierge.plan_content_check((select content from concierge.plan_draft_private where draft_id=d.id),d.id,d.client_id,r.grant_id);
 perform concierge.plan_authorize('publish_plan_v1',d.id,d.client_id,r.grant_id);perform concierge.plan_session(auth.uid(),(auth.jwt()->>'session_id')::uuid);
 if not concierge.care_dependencies_current(d,new.version) then perform concierge.fail('basis_conflict');end if;return null;
end $$;
create constraint trigger care_publication_dependency_fence after insert on concierge.publications deferrable initially deferred for each row execute function concierge.care_publication_dependency_fence();
create constraint trigger care_document_dependency_fence after insert on concierge.plan_documents deferrable initially deferred for each row execute function concierge.care_publication_dependency_fence();

create function concierge.care_use_event(e concierge.care_events) returns jsonb language sql set search_path='' as $$
 select (select body from concierge.care_use_events where event_id=e.id)||jsonb_build_object('amendment',(select a.body from concierge.care_use_amendments a join concierge.care_events ae on ae.id=a.id where a.event_id=e.id order by ae.revision desc limit 1))
$$;
create function concierge.care_use_summary(body jsonb) returns jsonb language sql immutable set search_path='' as $$
 select (body-'change'-'amendment')||jsonb_build_object('changeKind',body->'change'->'kind','amendment',case when body->'amendment'='null'::jsonb then 'null'::jsonb else ((body->'amendment')-'reason'-'replacement')||((body->'amendment'->'replacement')-'change')||jsonb_build_object('changeKind',body->'amendment'->'replacement'->'change'->'kind') end)
$$;
-- Only actual use crosses compatible immutable publications, never identity/formula authority.
create function concierge.care_product_descriptor(p jsonb) returns jsonb language sql immutable set search_path='' as $$ select jsonb_build_array(p->'name',p->'brand',p->'variant',p->'strength',p->'sizeLabel',p->'productUrl',p->'reference') $$;
create function concierge.care_publication_ref(c uuid,v integer) returns jsonb language sql set search_path='' as $$ select jsonb_build_object('version',p.version,'documentSchemaVersion',case when p.document_schema_version=3 then 3 when exists(select 1 from concierge.publication_presentations where client_id=c and version=v) then 2 else 1 end) from concierge.publications p where p.client_id=c and p.version=v $$;
create function concierge.care_use_candidate(c uuid,a jsonb,b jsonb) returns boolean language sql set search_path='' as $$
 select case when a->>'kind'='plan_product' and b->>'kind'='plan_product' then a->'productId'=b->'productId' and exists(select 1 from concierge.entitled_publications e where e.client_id=c and e.version=(a->'publication'->>'version')::integer) else a=b end
$$;
create function concierge.care_use_compatible(c uuid,a jsonb,b jsonb) returns boolean language plpgsql set search_path='' as $$
declare x jsonb;y jsonb;begin
 if a->>'kind'<>'plan_product' or b->>'kind'<>'plan_product' then return a=b;end if;
 if not concierge.care_use_candidate(c,a,b) then return false;end if;
 if not exists(select 1 from concierge.entitled_publications where client_id=c and version=(b->'publication'->>'version')::integer) then return false;end if;
 select value into x from jsonb_array_elements(concierge.care_publication(c,a->'publication')->'content'->'products') where value->'id'=a->'productId';
 select value into y from jsonb_array_elements(concierge.care_publication(c,b->'publication')->'content'->'products') where value->'id'=b->'productId';
 return x is not null and y is not null and concierge.care_product_descriptor(x)=concierge.care_product_descriptor(y);
end $$;
create function concierge.care_effective_use(c uuid,p jsonb) returns jsonb language plpgsql set search_path='' as $$
declare e jsonb;first_start jsonb;ident jsonb;state text:=case when p->>'kind'='client_reported_product' then 'unreviewed' else 'not_reported' end;start jsonb:='{"state":"unknown"}';activation bigint;contradiction boolean:=false;effective jsonb;begin
 select id,jsonb_build_object('state','known','value',started_on) into activation,start from concierge.activations where client_id=c and p->>'kind'='plan_product' and product_id=p->>'productId' and concierge.care_use_compatible(c,jsonb_build_object('kind','plan_product','publication',concierge.care_publication_ref(c,version),'productId',product_id,'slotId',slot),p) and started_on<=(clock_timestamp() at time zone 'America/Chicago')::date order by started_on,id limit 1;
 if activation is not null then state:='using';end if;start:=coalesce(start,'{"state":"unknown"}'::jsonb);
 with events as(select ev.revision,ev.recorded_at,concierge.care_use_event(ev) body from concierge.care_events ev where ev.client_id=c and exists(select 1 from concierge.care_use_events ue where ue.event_id=ev.id)),effective as(select *,coalesce(body->'amendment'->'replacement',body) eff from events)
 select body into e from effective where concierge.care_use_candidate(c,eff->'product',p) order by coalesce(((eff->'occurredOn'->>'value')::date::timestamp at time zone 'America/Chicago'),(body->'amendment'->>'amendedAt')::timestamptz,recorded_at) desc,coalesce((body->'amendment'->>'amendedAt')::timestamptz,recorded_at) desc,revision desc limit 1;
 if activation is null then
  with events as(select ev.revision,concierge.care_use_event(ev) body from concierge.care_events ev where ev.client_id=c and exists(select 1 from concierge.care_use_events ue where ue.event_id=ev.id)),effective as(select *,coalesce(body->'amendment'->'replacement',body) eff from events)
  select eff->'occurredOn' into first_start from effective where concierge.care_use_compatible(c,eff->'product',p) and eff->'change'->>'kind'='started' order by revision limit 1;
  start:=coalesce(first_start,start);
 end if;
 if e is not null then
  effective:=coalesce(e->'amendment'->'replacement',e);
  if not concierge.care_use_compatible(c,effective->'product',p) then
   return jsonb_build_object('product',p,'state','not_reported','originalStart',jsonb_build_object('state','unknown'),'latestEvent',concierge.care_use_summary(e),'identity',null,'contradiction',true);
  end if;
  state:=case effective->'change'->>'kind' when 'started' then case when p->>'kind'='client_reported_product' then 'unreviewed' else 'using' end when 'paused' then 'paused' when 'stopped' then 'stopped' when 'different' then 'using_differently' else 'unreviewed' end;
  -- A newer-recorded backdated conflicting report remains explicit, never an automatic advice decision.
  select exists(select 1 from concierge.care_events ev cross join lateral (select concierge.care_use_event(ev) b) b cross join lateral (select coalesce(b.b->'amendment'->'replacement',b.b) x) x where ev.client_id=c and exists(select 1 from concierge.care_use_events ue where ue.event_id=ev.id) and concierge.care_use_candidate(c,x.x->'product',p) and coalesce((b.b->'amendment'->>'amendedAt')::timestamptz,ev.recorded_at)>coalesce((e->'amendment'->>'amendedAt')::timestamptz,(e->>'recordedAt')::timestamptz) and x.x->'change'->>'kind' is distinct from effective->'change'->>'kind') into contradiction;
  -- Preserved actual Starts also participate in chronology. Keep the reported
  -- stop/pause suppression; a conflict is for review, not automatic resumption.
  contradiction:=contradiction or exists(select 1 from concierge.activations a where a.client_id=c and p->>'kind'='plan_product' and a.product_id=p->>'productId' and concierge.care_use_compatible(c,jsonb_build_object('kind','plan_product','publication',concierge.care_publication_ref(c,a.version),'productId',a.product_id,'slotId',a.slot),p) and a.started_on<=(clock_timestamp() at time zone 'America/Chicago')::date and effective->'change'->>'kind'<>'started' and a.started_on>(effective->'occurredOn'->>'value')::date);
 end if;
 select (payload-'answer')||jsonb_build_object('match',payload->'answer'->'match') into ident from concierge.care_events where client_id=c and kind='identity' and concierge.care_same_product(payload->'target'->'subject',p) order by revision desc limit 1;
 return jsonb_build_object('product',p,'state',state,'originalStart',start,'latestEvent',case when e is not null then concierge.care_use_summary(e) end,'identity',ident,'contradiction',contradiction);
end $$;
create function concierge.care_cursor(c uuid,v integer,f jsonb,h bigint,last_id uuid) returns text language sql immutable set search_path='' as $$ select 'c:'||concierge.plan_hash(jsonb_build_array(c,v,f,h))||':'||last_id::text $$;
create function concierge.care_cursor_check(token text,c uuid,v integer,f jsonb,h bigint) returns uuid language plpgsql immutable set search_path='' as $$
declare last_id uuid;begin
 if token is null then return null;end if;
 if token !~ '^c:[a-f0-9]{64}:[0-9a-f-]{36}$' then perform concierge.fail('invalid_input');end if;
 last_id:=split_part(token,':',3)::uuid;
 if token<>concierge.care_cursor(c,v,f,h,last_id) then perform concierge.fail('cursor_conflict');end if;return last_id;
end $$;
create function concierge.care_reported_page(c uuid,v integer,token text,lim integer,h bigint) returns jsonb language plpgsql set search_path='' as $$
declare last_id uuid:=concierge.care_cursor_check(token,c,v,'"reported"',h);r record;item jsonb;items jsonb:='[]';next_id uuid;counted integer:=0;begin
 for r in select rp.id,pv.version,pv.descriptor from concierge.care_reported_products rp join lateral (select * from concierge.care_reported_product_versions where product_id=rp.id order by version desc limit 1) pv on true where rp.client_id=c and (last_id is null or rp.id>last_id) order by rp.id loop
  item:=concierge.care_effective_use(c,jsonb_build_object('kind','client_reported_product','reportedProductId',r.id,'version',r.version))||jsonb_build_object('descriptor',r.descriptor);
  if counted>=lim or octet_length(jsonb_build_object('revision',h,'items',items||jsonb_build_array(item),'nextCursor',repeat('x',103))::text)>400000 then return jsonb_build_object('revision',h,'items',items,'nextCursor',concierge.care_cursor(c,v,'"reported"',h,next_id));end if;
  items:=items||jsonb_build_array(item);counted:=counted+1;next_id:=r.id;
 end loop;
 return jsonb_build_object('revision',h,'items',items,'nextCursor',null);
end $$;
create function concierge.care_history_page(c uuid,p jsonb,token text,lim integer,h bigint) returns jsonb language plpgsql set search_path='' as $$
declare last_id uuid:=concierge.care_cursor_check(token,c,null,p,h);last_revision bigint:=0;r concierge.care_events;item jsonb;items jsonb:='[]';body jsonb;next_id uuid;counted integer:=0;begin
 if last_id is not null then select revision into last_revision from concierge.care_events where client_id=c and id=last_id;if not found then perform concierge.fail('cursor_conflict');end if;end if;
 for r in select * from concierge.care_events where client_id=c and revision>last_revision order by revision loop
  body:=case when r.kind='use' then concierge.care_use_event(r) when r.kind='reported_product' then r.payload||jsonb_build_object('initialUse',concierge.care_use_event(r)) else r.payload end;
  if p<>'null'::jsonb and not concierge.care_same_product(r.product,p) and not ((r.kind='use' and concierge.care_same_product(body->'amendment'->'replacement'->'product',p)) or (r.kind='reported_product' and concierge.care_same_product(body->'initialUse'->'amendment'->'replacement'->'product',p))) then continue;end if;
  item:=case when r.kind='amendment' then jsonb_build_object('kind','amendment','amendment',body) else jsonb_build_object('kind',r.kind,'event',body) end;
  if counted>=lim or octet_length(jsonb_build_object('revision',h,'entries',items||jsonb_build_array(item),'nextCursor',repeat('x',103))::text)>400000 then return jsonb_build_object('revision',h,'entries',items,'nextCursor',concierge.care_cursor(c,null,p,h,next_id));end if;
  items:=items||jsonb_build_array(item);counted:=counted+1;next_id:=r.id;
 end loop;return jsonb_build_object('revision',h,'entries',items,'nextCursor',null);
end $$;
create function concierge.care_projection(c uuid,doc jsonb) returns jsonb language plpgsql set search_path='' as $$
declare items jsonb:='[]';p jsonb;reported jsonb;v integer:=(doc->>'version')::integer;h bigint:=concierge.care_revision(c);begin
 for p in select value from jsonb_array_elements(coalesce(doc->'content'->'products','[]')) loop
  items:=items||jsonb_build_array(concierge.care_effective_use(c,jsonb_build_object('kind','plan_product','publication',jsonb_build_object('version',v,'documentSchemaVersion',doc->'documentSchemaVersion'),'productId',p->'id','slotId',null)));
 end loop;
 reported:=concierge.care_reported_page(c,v,null,100,h)-'revision';return jsonb_build_object('revision',h,'planProducts',items,'reportedProducts',reported);
end $$;

create function concierge.care_notify(c uuid,e uuid,v integer,revision bigint,correction boolean) returns uuid language plpgsql set search_path='' as $$
declare n uuid;r record;begin
 perform 1 from concierge.care_attention_routes where client_id=c order by advisor_id for share;
 insert into concierge.plan_events(client_id,publication_version,kind,source_kind,source_id,source_version) values(c,v,case when correction then 'use_amended' else 'use_reported' end,'care',e,revision) returning id into n;
 insert into concierge.care_attention(event_id,client_id,notification_event_id) values(e,c,n);
 for r in select pr.actor_id,coalesce(rt.email_enabled,false) email_enabled from concierge.plan_principals pr join concierge.advisors ad on ad.user_id=pr.actor_id left join concierge.care_attention_routes rt on rt.advisor_id=pr.actor_id and rt.client_id=c where pr.active and pr.kind in ('owner','human') and ad.active and ad.can_view and ((rt.advisor_id is not null) or (not exists(select 1 from concierge.care_attention_routes where client_id=c) and pr.kind='owner' and pr.actor_id=(select owner_actor_id from concierge.plan_policy where singleton))) order by pr.actor_id loop
  if not concierge.plan_read_human_live(r.actor_id) then continue;end if;
  insert into concierge.plan_deliveries(event_id,recipient_id,channel) values(n,r.actor_id,'portal');
  if r.email_enabled then insert into concierge.plan_deliveries(event_id,recipient_id,channel) values(n,r.actor_id,'email');end if;
 end loop;
 return n;
end $$;
create function concierge.care_request_collision() returns trigger language plpgsql set search_path='' as $$begin
 perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||new.actor_id::text||':'||new.request_id::text,0));
 if TG_TABLE_NAME<>'care_requests' and exists(select 1 from concierge.care_requests where actor_id=new.actor_id and request_id=new.request_id) then perform concierge.fail('request_conflict');end if;
 if TG_TABLE_NAME='care_requests' and (exists(select 1 from concierge.plan_requests where actor_id=new.actor_id and request_id=new.request_id) or exists(select 1 from concierge.requests where actor_id=new.actor_id and request_id=new.request_id) or exists(select 1 from concierge.workflow_requests where actor_id=new.actor_id and request_id=new.request_id)) then perform concierge.fail('request_conflict');end if;
 return new;
end $$;
create trigger care_plan_request_collision before insert on concierge.plan_requests for each row execute function concierge.care_request_collision();
create trigger care_r1_request_collision before insert on concierge.requests for each row execute function concierge.care_request_collision();
create trigger care_workflow_request_collision before insert on concierge.workflow_requests for each row execute function concierge.care_request_collision();
create trigger care_own_request_collision before insert on concierge.care_requests for each row execute function concierge.care_request_collision();

create function concierge.care_instant(t timestamptz) returns text language sql immutable set search_path='' as $$ select to_char(t at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') $$;
create function concierge.care_canonical_ids(v jsonb,parent_key text default null) returns jsonb language plpgsql immutable set search_path='' as $$
declare k text;x jsonb;r jsonb;begin
 if jsonb_typeof(v)='string' and (parent_key in ('requestId','clientId','eventId','expectedAmendmentHeadId','identityEventId','reportedProductId','labelPhotoIds')) then return to_jsonb((v#>>'{}')::uuid::text);end if;
 if jsonb_typeof(v)='array' then r:='[]';for x in select value from jsonb_array_elements(v) loop r:=r||jsonb_build_array(concierge.care_canonical_ids(x,parent_key));end loop;return r;end if;
 if jsonb_typeof(v)='object' then r:='{}';for k,x in select key,value from jsonb_each(v) loop r:=r||jsonb_build_object(k,concierge.care_canonical_ids(x,k));end loop;return r;end if;return v;
end $$;
create function public.concierge_care_command_v1(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a text:=p_command->>'action';c uuid:=auth.uid();u uuid:=auth.uid();advisor boolean:=false;writing boolean;req uuid;prior concierge.care_requests;fp bytea;h bigint;ev uuid:=gen_random_uuid();pid uuid;descriptor_version bigint;pub jsonb;body jsonb;result jsonb;source jsonb;original concierge.care_events;amend jsonb;previous uuid;notification uuid;v integer;photo jsonb;identity concierge.care_events;occurred jsonb;pr concierge.plan_principals;recording_time timestamptz;begin
 if a is null or jsonb_typeof(p_command) is distinct from 'object' or pg_column_size(p_command)>500000 or not (concierge.care_command_fields()?a) then perform concierge.fail('invalid_input');end if;
 perform concierge.plan_shape(p_command,jsonb_build_object('type','object','fields',jsonb_build_object('schemaVersion',jsonb_build_object('type','enum','values',jsonb_build_array(1)),'action',jsonb_build_object('type','enum','values',jsonb_build_array(a)))||(concierge.care_command_fields()->a)));
 p_command:=concierge.care_canonical_ids(p_command);
 writing:=a in ('report_unreviewed_product_v1','record_client_unreviewed_product_v1','amend_reported_product_v1','report_identity_v1','report_product_use_v1','record_client_use_v1','amend_use_v1');
 if a in ('record_client_use_v1','record_client_unreviewed_product_v1','read_advisor_publication_v2','read_advisor_use_history_v1') then c:=(p_command->>'clientId')::uuid;advisor:=true;
 elsif a='amend_use_v1' then
  select * into original from concierge.care_events where id=(p_command->>'eventId')::uuid and exists(select 1 from concierge.care_use_events where event_id=care_events.id);
  if not found then perform concierge.fail('not_found');end if;c:=original.client_id;advisor:=c is distinct from u;
 elsif a='request_status_v1' then
  select * into prior from concierge.care_requests where actor_id=u and request_id=(p_command->>'requestId')::uuid;
  if found then c:=prior.client_id;advisor:=c is distinct from u;elsif exists(select 1 from concierge.plan_principals where actor_id=u and kind in ('owner','human')) then pr:=concierge.plan_advisor_read_guard();perform concierge.plan_session(u,(auth.jwt()->>'session_id')::uuid);return jsonb_build_object('status','absent');end if;
 end if;
 perform concierge.care_guard(c,advisor,writing,a='read_advisor_publication_v2');
 -- Eligible recipient/principal locks precede request/client/domain waits.
 if writing then perform pr2.actor_id from concierge.plan_principals pr2 where pr2.actor_id=(select owner_actor_id from concierge.plan_policy where singleton) or pr2.actor_id in(select advisor_id from concierge.care_attention_routes where client_id=c) order by pr2.actor_id for share;end if;
 req:=(p_command->>'requestId')::uuid;
 if req is not null then
  perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||u::text||':'||req::text,0));
  fp:=sha256(convert_to(p_command::text,'UTF8'));
  if writing and (exists(select 1 from concierge.plan_requests where actor_id=u and request_id=req) or exists(select 1 from concierge.requests where actor_id=u and request_id=req) or exists(select 1 from concierge.workflow_requests where actor_id=u and request_id=req)) then perform concierge.fail('request_conflict');end if;
 end if;
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||c::text,0));
 perform concierge.care_guard(c,advisor,writing,a='read_advisor_publication_v2');
 if a='request_status_v1' then
  select * into prior from concierge.care_requests where actor_id=u and request_id=req;
  perform concierge.care_guard(c,advisor,false);
  if not found or prior.request_id is null then return jsonb_build_object('status','absent');end if;
  return jsonb_build_object('status','committed','receipt',prior.result);
 end if;
 if writing then
  select * into prior from concierge.care_requests where actor_id=u and request_id=req;
  if found then
   if prior.fingerprint<>fp or prior.client_id<>c then perform concierge.fail('request_conflict');end if;
   perform concierge.care_guard(c,advisor,true);return prior.result;
  end if;
 end if;
 h:=concierge.care_revision(c);
 if writing and h is distinct from (p_command->>'expectedUseRevision')::bigint or a='read_reported_products_v1' and h is distinct from (p_command->>'expectedUseRevision')::bigint then perform concierge.fail('revision_conflict');end if;
 if a in ('read_client_plan_v2','read_advisor_publication_v2') then
  v:=(p_command->>'version')::integer;
  if a='read_client_plan_v2' then result:=concierge.plan_client_view_before_care_v1(c,v);else if v is null then select published_version into v from concierge.cases where client_id=c;end if;result:=concierge.plan_advisor_publication_before_care_v1(c,v);end if;
  result:=result||jsonb_build_object('schemaVersion',2,'use',concierge.care_projection(c,result->'plan'),'latestPublicReview',null);
 elsif a='read_reported_products_v1' then
  v:=(p_command->>'publicationVersion')::integer;if v is null then select max(ep.version) into v from concierge.entitled_publications ep where ep.client_id=c;end if;
  if v is not null and not exists(select 1 from concierge.entitled_publications where client_id=c and version=v) then perform concierge.fail('not_found');end if;
  result:=concierge.care_reported_page(c,v,p_command->>'cursor',(p_command->>'limit')::integer,h);
 elsif a in ('read_use_history_v1','read_advisor_use_history_v1') then
  if p_command->'product'<>'null'::jsonb then perform concierge.care_resolve_product(c,p_command->'product',false);end if;
  result:=concierge.care_history_page(c,p_command->'product',p_command->>'cursor',(p_command->>'limit')::integer,h);
 else
  body:=case when a='amend_use_v1' then p_command->'replacement' else p_command end;
  occurred:=body->'occurredOn';if occurred is not null then perform concierge.care_occurrence(occurred);end if;
  source:=body->'sourcePublication';perform concierge.care_publication(c,source);
  -- Until the actual product-label lifecycle is connected, no nonempty ID is claimed authorized.
  photo:=coalesce(case when a in ('report_unreviewed_product_v1','record_client_unreviewed_product_v1') then p_command->'product'->'labelPhotoIds' when a='amend_reported_product_v1' then p_command->'replacement'->'labelPhotoIds' when a='report_identity_v1' then p_command->'answer'->'labelPhotoIds' end,'[]'::jsonb);
  if jsonb_array_length(photo)>0 then perform concierge.fail('photo_unavailable');end if;
  if a in ('report_product_use_v1','record_client_use_v1','amend_use_v1') then
   perform concierge.care_resolve_product(c,body->'product');
   if body->'change'->>'kind'='unreviewed_added' and body->'product'->>'kind'<>'client_reported_product' then perform concierge.fail('invalid_input');end if;
   if body->>'identityEventId' is not null then
    select * into identity from concierge.care_events where id=(body->>'identityEventId')::uuid and client_id=c and kind='identity';
    if not found or identity.payload->'target'->'subject' is distinct from body->'product' then perform concierge.fail('identity_conflict');end if;
   end if;
  end if;
  if a='report_identity_v1' then
   perform concierge.care_resolve_product(c,p_command->'target'->'subject');
   if p_command->'target'->'comparedWith'<>'null'::jsonb then
    perform concierge.care_resolve_product(c,p_command->'target'->'comparedWith');
    if p_command->'target'->'subject'->>'kind'='plan_product' and p_command->'target'->'subject' is distinct from p_command->'target'->'comparedWith' then perform concierge.fail('identity_conflict');end if;
   end if;
  end if;
  insert into concierge.care_use_heads(client_id,revision) values(c,h+1) on conflict(client_id) do update set revision=excluded.revision;
  h:=h+1;recording_time:=clock_timestamp();
  if a in ('report_unreviewed_product_v1','record_client_unreviewed_product_v1','amend_reported_product_v1') then
   if a='amend_reported_product_v1' then
    perform concierge.care_resolve_product(c,p_command->'product');if (select descriptor from concierge.care_reported_product_versions where product_id=(p_command->'product'->>'reportedProductId')::uuid and version=(p_command->'product'->>'version')::bigint) is not distinct from p_command->'replacement' then perform concierge.fail('invalid_input');end if;pid:=(p_command->'product'->>'reportedProductId')::uuid;descriptor_version:=(p_command->'product'->>'version')::bigint+1;body:=p_command->'replacement';
    select payload->'sourcePublication',payload->'occurredOn' into source,occurred from concierge.care_events where id=(select event_id from concierge.care_reported_product_versions where product_id=pid and version=descriptor_version-1);
   else pid:=gen_random_uuid();descriptor_version:=1;body:=p_command->'product';insert into concierge.care_reported_products(id,client_id) values(pid,c);end if;
   pub:=jsonb_build_object('kind','client_reported_product','reportedProductId',pid,'version',descriptor_version);
   body:=jsonb_build_object('eventId',ev,'product',pub,'descriptor',body,'previousVersion',case when descriptor_version>1 then descriptor_version-1 end,'reason',p_command->'reason','initialUse',null,'sourcePublication',source,'occurredOn',occurred,'channel',coalesce(p_command->>'channel','portal'),'reportedBy',c,'recordedBy',u,'recordedAt',concierge.care_instant(recording_time));
   insert into concierge.care_events(id,client_id,revision,kind,product,payload,recorded_by,recorded_at) values(ev,c,h,'reported_product',pub,body,u,recording_time);
   insert into concierge.care_reported_product_versions values(pid,descriptor_version,body->'descriptor',ev);
   if descriptor_version=1 then
    -- Creation and its actual unreviewed-added event are one immutable business event, not Start.
    body:=(body-'descriptor'-'previousVersion'-'reason'-'initialUse')||jsonb_build_object('change',jsonb_build_object('kind','unreviewed_added','details',null),'acquisition',p_command->'acquisition','identityEventId',null,'originalActivationId',null,'amendment',null);
    insert into concierge.care_use_events values(ev,body);
   end if;
  elsif a='report_identity_v1' then
   pub:=p_command->'target'->'subject';body:=jsonb_build_object('eventId',ev,'target',p_command->'target','answer',p_command->'answer','sourcePublication',source,'occurredOn',occurred,'channel',p_command->'channel','reportedBy',c,'recordedBy',u,'recordedAt',concierge.care_instant(recording_time));
   insert into concierge.care_events(id,client_id,revision,kind,product,payload,recorded_by,recorded_at) values(ev,c,h,'identity',pub,body,u,recording_time);
  elsif a='amend_use_v1' then
   select id into previous from concierge.care_use_amendments where event_id=original.id order by (select revision from concierge.care_events where id=care_use_amendments.id) desc limit 1;
   if previous is distinct from (p_command->>'expectedAmendmentHeadId')::uuid then perform concierge.fail('revision_conflict');end if;
   pub:=body->'product';amend:=jsonb_build_object('id',ev,'eventId',original.id,'previousAmendmentHeadId',previous,'replacement',body,'amendedBy',u,'amendedAt',concierge.care_instant(recording_time),'reason',p_command->'reason');
   insert into concierge.care_events(id,client_id,revision,kind,product,payload,recorded_by,recorded_at) values(ev,c,h,'amendment',pub,amend,u,recording_time);
   insert into concierge.care_use_amendments values(ev,original.id,previous,amend);
  else
   pub:=body->'product';body:=jsonb_build_object('eventId',ev,'product',pub,'change',body->'change','sourcePublication',source,'occurredOn',occurred,'channel',p_command->'channel','reportedBy',c,'recordedBy',u,'recordedAt',concierge.care_instant(recording_time),'acquisition',body->'acquisition','identityEventId',body->'identityEventId','originalActivationId',(select id::text from concierge.activations where client_id=c and pub->>'kind'='plan_product' and product_id=pub->>'productId' order by started_on,id limit 1),'amendment',null);
   insert into concierge.care_events(id,client_id,revision,kind,product,payload,recorded_by,recorded_at) values(ev,c,h,'use',pub,body,u,recording_time);
   insert into concierge.care_use_events values(ev,body);
  end if;
  select coalesce((source->>'version')::integer,(select max(ep.version) from concierge.entitled_publications ep where ep.client_id=c)) into v;
  notification:=concierge.care_notify(c,ev,v,h,a in ('amend_use_v1','amend_reported_product_v1'));
  result:=jsonb_build_object('requestId',req,'event',jsonb_build_object('kind',case when a='report_identity_v1' then 'identity' when a in ('report_unreviewed_product_v1','record_client_unreviewed_product_v1','amend_reported_product_v1') then 'reported_product' else 'use' end,'id',ev),'revision',h,'recordedAt',concierge.care_instant((select recorded_at from concierge.care_events where id=ev)),'notificationEventId',notification);
  if a in ('report_unreviewed_product_v1','record_client_unreviewed_product_v1') then result:=jsonb_build_object('receipt',result,'product',pub);end if;
  insert into concierge.care_requests values(u,req,c,p_command,fp,result);
 end if;
 perform concierge.care_guard(c,advisor,writing,a='read_advisor_publication_v2');
 if octet_length(result::text)>1800000 then perform concierge.fail('invalid_input');end if;
 return result;
exception when invalid_text_representation or numeric_value_out_of_range or datetime_field_overflow or invalid_datetime_format then perform concierge.fail('invalid_input');return null;
 when unique_violation then perform concierge.fail('revision_conflict');return null;
end $$;

-- Retain the reviewed55 dispatcher/body privately, without granting any generic bypass.
alter function public.concierge_plan_command_v1(jsonb) set schema concierge;
alter function concierge.concierge_plan_command_v1(jsonb) rename to plan_command_before_care_v1;
create function public.concierge_plan_command_v1(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a text:=p_command->>'action';d concierge.plan_drafts;c uuid;did uuid;pr concierge.plan_principals;req uuid;prior concierge.plan_requests;result jsonb;cur jsonb;cap jsonb;needs boolean;begin
 if a is null or not(concierge.plan_command_fields()?a) then perform concierge.fail('invalid_input');end if;
 if a not in ('read_draft_dependencies_v1','rebase_draft_dependencies_v1') then
  if a<>'request_status_v1' and p_command?'requestId' and exists(select 1 from concierge.care_requests where actor_id=auth.uid() and request_id=(p_command->>'requestId')::uuid) then perform concierge.plan_session(auth.uid(),(auth.jwt()->>'session_id')::uuid);perform concierge.fail('request_conflict');end if;
  return concierge.plan_command_before_care_v1(p_command);end if;
 if pg_column_size(p_command)>500000 then perform concierge.fail('invalid_input');end if;
 perform concierge.plan_shape(p_command,jsonb_build_object('type','object','fields',jsonb_build_object('schemaVersion',jsonb_build_object('type','enum','values',jsonb_build_array(1)),'action',jsonb_build_object('type','enum','values',jsonb_build_array(a)))||(concierge.plan_command_fields()->a)));
 p_command:=jsonb_set(p_command,'{draftId}',to_jsonb((p_command->>'draftId')::uuid::text));if p_command?'requestId' then p_command:=jsonb_set(p_command,'{requestId}',to_jsonb((p_command->>'requestId')::uuid::text));end if;
 pr:=concierge.plan_guard();if pr.kind='agent' then perform concierge.fail('forbidden');end if;
 did:=(p_command->>'draftId')::uuid;select * into d from concierge.plan_drafts where id=did;if not found then perform concierge.fail('not_found');end if;c:=d.client_id;
 req:=(p_command->>'requestId')::uuid;
 if req is not null then
  perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||auth.uid()::text||':'||req::text,0));
  if exists(select 1 from concierge.requests where actor_id=auth.uid() and request_id=req) or exists(select 1 from concierge.workflow_requests where actor_id=auth.uid() and request_id=req) or exists(select 1 from concierge.care_requests where actor_id=auth.uid() and request_id=req) then perform concierge.fail('request_conflict');end if;
 end if;
 if c is not null then perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||c::text,0));perform concierge.plan_target_client(c,false);end if;
 select * into d from concierge.plan_drafts where id=did for update;if d.client_id is distinct from c then perform concierge.fail('revision_conflict');end if;
 perform concierge.plan_content_check((select content from concierge.plan_draft_private where draft_id=did),did,c);
 perform concierge.plan_guard();perform concierge.plan_session(auth.uid(),(auth.jwt()->>'session_id')::uuid);
 if req is not null then
  select * into prior from concierge.plan_requests where actor_id=auth.uid() and request_id=req;
  if found then if prior.command is distinct from p_command then perform concierge.fail('request_conflict');end if;perform concierge.plan_request_authorize(prior);return prior.result;end if;
 end if;
 cur:=concierge.plan_dependency_basis_v2(c);
 select heads,review_required into cap,needs from concierge.plan_draft_dependency_bases where draft_id=did and content_revision=d.content_revision;
 if a='read_draft_dependencies_v1' then
  if d.content_revision is distinct from(p_command->>'contentRevision')::bigint or d.assignment_revision is distinct from(p_command->>'assignmentRevision')::bigint then perform concierge.fail('revision_conflict');end if;
  result:=jsonb_build_object('draftId',did,'contentRevision',d.content_revision,'assignmentRevision',d.assignment_revision,'captured',cap,'current',cur,'needsRebase',needs or cap is distinct from cur,'affectedSections',case when needs or cap is distinct from cur then '["context","decisions","routine","follow_up"]'::jsonb else '[]'::jsonb end);
 else
  if d.state<>'working' or d.content_revision is distinct from(p_command->>'expectedContentRevision')::bigint or d.assignment_revision is distinct from(p_command->>'expectedAssignmentRevision')::bigint or p_command->'expectedHeads' is distinct from jsonb_build_object('useHead',cur->'useHead','reportHead',cur->'reportHead','instructionHead',cur->'instructionHead') or p_command->'expectedLegacyBasis' is distinct from cur->'legacyBasis' or p_command->'expectedLegacyBasisManifestHash' is distinct from cur->'legacyBasisManifestHash' then perform concierge.fail('revision_conflict');end if;
  insert into concierge.plan_draft_dependency_bases(draft_id,content_revision,heads) values(did,d.content_revision+1,cur);
  update concierge.plan_drafts set content_revision=content_revision+1,basis=cur->'legacyBasis',basis_manifest=concierge.plan_basis(c),saved_at=clock_timestamp() where id=did returning * into d;
  result:=concierge.plan_draft_view(d);
  insert into concierge.plan_requests values(auth.uid(),req,p_command,sha256(convert_to(p_command::text,'UTF8')),result,c,did,null);
 end if;
 perform concierge.plan_content_check((select content from concierge.plan_draft_private where draft_id=did),did,c);perform concierge.plan_guard();perform concierge.plan_session(auth.uid(),(auth.jwt()->>'session_id')::uuid);
 return result;
end $$;
-- Keep old Start-only readers truthful. V2 reads the retained lossless document implementation.
alter function concierge.plan_client_view(uuid,integer) rename to plan_client_view_before_care_v1;
alter function concierge.plan_advisor_publication(uuid,integer) rename to plan_advisor_publication_before_care_v1;
create function concierge.care_v1_unsupported(c uuid,doc jsonb) returns boolean language plpgsql set search_path='' as $$
declare p jsonb;s jsonb;ref jsonb;latest jsonb;a record;represented boolean;begin
 for p in select value from jsonb_array_elements(coalesce(doc->'content'->'products','[]')) loop
  ref:=jsonb_build_object('kind','plan_product','publication',jsonb_build_object('version',doc->'version','documentSchemaVersion',doc->'documentSchemaVersion'),'productId',p->'id','slotId',null);
  s:=concierge.care_effective_use(c,ref);
  if (s->>'contradiction')::boolean or s->>'state' in ('paused','stopped','using_differently','unreviewed') then return true;end if;
  represented:=false;
  -- Match the actual retained v1 per-slot projection, not any same-ID row.
  for a in select * from (select distinct on(slot) slot,product_id,started_on,version,id from concierge.activations where client_id=c and started_on<=(clock_timestamp() at time zone 'America/Chicago')::date order by slot,started_on desc,id desc) current_use where product_id=p->>'id' loop
   if not concierge.care_use_compatible(c,jsonb_build_object('kind','plan_product','publication',concierge.care_publication_ref(c,a.version),'productId',a.product_id,'slotId',a.slot),ref) or s->>'state'<>'using' then return true;end if;
   if s->'originalStart'=jsonb_build_object('state','known','value',a.started_on) then represented:=true;end if;
  end loop;
  if s->>'state'='using' then
   if not represented then return true;end if;
   latest:=case when s->'latestEvent'->'amendment'<>'null'::jsonb then s->'latestEvent'->'amendment' else s->'latestEvent' end;
   if latest->>'changeKind'='started' and latest->'occurredOn' is distinct from s->'originalStart' then return true;end if;
  end if;
 end loop;return false;
end $$;
create function concierge.plan_client_view(c uuid,v integer) returns jsonb language plpgsql set search_path='' as $$declare r jsonb;begin
 r:=concierge.plan_client_view_before_care_v1(c,v);if concierge.care_v1_unsupported(c,r->'plan') then perform concierge.fail('use_version_required');end if;return r;
end $$;
create function concierge.plan_advisor_publication(c uuid,v integer) returns jsonb language plpgsql set search_path='' as $$declare r jsonb;begin
 r:=concierge.plan_advisor_publication_before_care_v1(c,v);if concierge.care_v1_unsupported(c,r->'plan') then perform concierge.fail('use_version_required');end if;return r;
end $$;
-- Retained R1/R2 current-use surfaces must also refuse a lossy paused/stopped projection.
create function concierge.care_legacy_current_check(c uuid) returns void language plpgsql set search_path='' as $$
declare v integer;doc jsonb;begin
 if not (select activated from concierge.plan_policy where singleton) then return;end if;
 select published_version into v from concierge.cases where client_id=c;if coalesce(v,0)=0 then return;end if;
 doc:=concierge.plan_advisor_publication_before_care_v1(c,v)->'plan';
 if concierge.care_v1_unsupported(c,doc) then perform concierge.fail('use_version_required');end if;
end $$;
do $ddl$ declare n text;prior text;args text;types text;invoke text;c text;begin
 foreach n in array array['concierge_client_view','concierge_client_view_v2','concierge_advisor_view','concierge_advisor_view_v2','concierge_advisor_preview_v2'] loop
  prior:='care_retained_'||n;
  if n='concierge_advisor_preview_v2' then args:='p_client_id uuid,p_mode text,p_expected_revision bigint default null';types:='uuid,text,bigint';invoke:='p_client_id,p_mode,p_expected_revision';c:='p_client_id';
  elsif n like 'concierge_advisor_view%%' then args:='p_client_id uuid';types:='uuid';invoke:='p_client_id';c:='p_client_id';else args:='';types:='';invoke:='';c:='auth.uid()';end if;
  execute format('alter function public.%I(%s) set schema concierge',n,types);execute format('alter function concierge.%I(%s) rename to %I',n,types,prior);
  execute format($body$create function public.%I(%s) returns jsonb language plpgsql security definer set search_path='' as $fn$ declare r jsonb;begin
   perform concierge.plan_legacy_read_guard(%s,false);perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||%s::text,0));
   r:=concierge.%I(%s);perform concierge.care_legacy_current_check(%s);perform concierge.plan_legacy_read_guard(%s,false);return r;
  end $fn$ $body$,n,args,c,c,prior,invoke,c,c);
  execute format('revoke all on function public.%I(%s) from public,anon,authenticated,service_role',n,types);execute format('grant execute on function public.%I(%s) to authenticated',n,types);
 end loop;
end $ddl$;
-- Enforce privilege boundaries for every newly allocated private object, including renamed bases.
do $$declare r record;begin
 for r in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='concierge' and c.relkind='r' and (c.relname like 'care_%' or c.relname='plan_draft_dependency_bases') loop
  execute format('alter table concierge.%I enable row level security',r.relname);execute format('revoke all on table concierge.%I from public,anon,authenticated,service_role',r.relname);
 end loop;
 for r in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='concierge' and (p.proname like 'care_%' or p.proname like 'plan_%') loop execute format('revoke all on function %s from public,anon,authenticated,service_role',r.signature);end loop;
end $$;
revoke all on function public.concierge_care_command_v1(jsonb),public.concierge_plan_command_v1(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.concierge_care_command_v1(jsonb),public.concierge_plan_command_v1(jsonb) to authenticated;
commit;
