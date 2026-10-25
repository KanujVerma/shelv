-- REVIEW CANDIDATE ONLY. Not installed in supabase/migrations.
-- Requires canonical Auth/profiles, anon/authenticated/service_role roles.
-- Intentionally fails on name collision; never replaces an existing API.
create schema concierge;
revoke all on schema concierge from public, anon, authenticated, service_role;
grant usage on schema concierge to service_role;
-- ECMAScript String.trim WhiteSpace + LineTerminator set, independent of locale.
-- NEL U+0085, MVS U+180E and ZWSP U+200B are deliberately not trim characters.
create function concierge.trim_text(s text) returns text
language sql immutable strict parallel safe set search_path='' as $$
 select pg_catalog.btrim(s, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
$$;
create table concierge.advisors(user_id uuid primary key references auth.users(id) on delete cascade, active boolean not null default false);
create table concierge.cases(client_id uuid primary key references auth.users(id) on delete cascade, revision bigint not null default 0 check(revision between 0 and 9007199254740991), published_version integer not null default 0);
create table concierge.intakes(client_id uuid references concierge.cases on delete cascade, version integer not null, goal text not null, note text not null, created_at timestamptz not null default now(), primary key(client_id,version));
create table concierge.baselines(client_id uuid references concierge.cases on delete cascade, slot text not null, product_id text not null, primary key(client_id,slot));
create table concierge.drafts(client_id uuid primary key references concierge.cases on delete cascade, intake_version integer not null, recommendations jsonb not null, advisor_note text not null, foreign key(client_id,intake_version) references concierge.intakes(client_id,version));
create table concierge.publications(client_id uuid references concierge.cases on delete cascade, version integer not null, intake_version integer not null, recommendations jsonb not null, published_at timestamptz not null default now(), published_by uuid not null, primary key(client_id,version), foreign key(client_id,intake_version) references concierge.intakes(client_id,version));
create table concierge.receipts(client_id uuid references concierge.cases on delete cascade, slot text not null, product_id text not null, received_at timestamptz not null default now(), primary key(client_id,slot,product_id));
create table concierge.activations(id bigint generated always as identity primary key, client_id uuid not null, version integer not null, recommendation_id text not null, slot text not null, product_id text not null, started_on date not null, confirmed_at timestamptz not null default now(), unique(client_id,id), foreign key(client_id,version) references concierge.publications on delete cascade);
create index activations_client_slot_date on concierge.activations(client_id,slot,started_on desc,id desc);
create table concierge.item_states(client_id uuid not null, version integer not null, recommendation_id text not null, choice text check(choice in ('approved','declined')), reason text, activation_id bigint, primary key(client_id,version,recommendation_id), foreign key(client_id,version) references concierge.publications on delete cascade, foreign key(client_id,activation_id) references concierge.activations(client_id,id), check((choice='declined' and nullif(concierge.trim_text(reason),'') is not null) or (choice is distinct from 'declined' and reason is null)));
create table concierge.requests(actor_id uuid references auth.users(id) on delete cascade, request_id uuid, client_id uuid not null references concierge.cases on delete cascade, fingerprint bytea not null, result jsonb not null, primary key(actor_id,request_id));
-- No table policy grants clients raw access, including unpublished snapshots.
do $$ declare t record; begin
 for t in select tablename from pg_catalog.pg_tables where schemaname='concierge' loop
  execute format('alter table concierge.%I enable row level security',t.tablename);
  execute format('revoke all on table concierge.%I from public,anon,authenticated,service_role',t.tablename);
 end loop;
end $$;
revoke all on all sequences in schema concierge from public,anon,authenticated,service_role;
grant select,insert,update,delete on concierge.advisors to service_role;

create function concierge.fail(code text) returns void language plpgsql set search_path='' as $$ begin raise exception using message='concierge_'||code,errcode='P0001'; end $$;
create function concierge.actor() returns uuid language plpgsql set search_path='' as $$
declare u uuid:=auth.uid(); begin
 if u is null then perform concierge.fail('unauthorized'); end if;
 perform 1 from auth.users where id=u and is_anonymous is false for share;
 if not found then perform concierge.fail('forbidden'); end if;
 perform 1 from public.profiles where id=u and deletion_started_at is null for share;
 if not found then perform concierge.fail('forbidden'); end if;
 return u;
end $$;
create function concierge.target(p_client_id uuid) returns void language plpgsql set search_path='' as $$ begin
 perform 1 from auth.users au join public.profiles pp on pp.id=au.id where au.id=p_client_id and au.is_anonymous is false and pp.deletion_started_at is null for share of au,pp;
 if not found then perform concierge.fail('forbidden');end if;
end $$;
create function concierge.advisor(u uuid) returns void language plpgsql set search_path='' as $$ begin
 perform 1 from concierge.advisors where user_id=u and active for share;
 if not found then perform concierge.fail('forbidden'); end if;
end $$;
create function concierge.keys(v jsonb, expected text[]) returns void language plpgsql set search_path='' as $$ begin
 if jsonb_typeof(v) is distinct from 'object' then perform concierge.fail('invalid_input'); end if;
 if not (v ?& expected) or (select count(*) from jsonb_object_keys(v))<>cardinality(expected) then perform concierge.fail('invalid_input'); end if;
end $$;
create function concierge.txt(v jsonb,k text,maximum integer,empty_ok boolean default false) returns text language plpgsql set search_path='' as $$ declare s text; begin
 if jsonb_typeof(v->k) is distinct from 'string' then perform concierge.fail('invalid_input'); end if;
 s:=v->>k;
 if length(s)>maximum or (not empty_ok and nullif(concierge.trim_text(s),'') is null) then perform concierge.fail('invalid_input'); end if;
 return s;
end $$;
create function concierge.identifier(s text) returns void language plpgsql set search_path='' as $$ begin
 if s is null or s !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$' or s in ('constructor','prototype','__proto__') then perform concierge.fail('invalid_input'); end if;
end $$;
create function concierge.integer(v jsonb,k text) returns bigint language plpgsql set search_path='' as $$ declare n numeric; begin
 if jsonb_typeof(v->k) is distinct from 'number' then perform concierge.fail('invalid_input'); end if;
 n:=(v->>k)::numeric;
 if n<>trunc(n) or n<0 or n>9007199254740991 then perform concierge.fail('invalid_input'); end if; return n::bigint;
end $$;
create function concierge.validate_items(items jsonb) returns void language plpgsql set search_path='' as $$ declare r jsonb; k text; ids text[]:='{}';slots text[]:='{}'; begin
 if jsonb_typeof(items) is distinct from 'array' then perform concierge.fail('invalid_input'); end if;
 if jsonb_array_length(items)>50 then perform concierge.fail('invalid_input'); end if;
 for r in select value from jsonb_array_elements(items) loop
  perform concierge.keys(r,array['id','slot','currentProductId','proposedProductId','priceCents','currency','rationale']);
  foreach k in array array['id','slot','currentProductId','proposedProductId'] loop perform concierge.identifier(concierge.txt(r,k,100)); end loop;
  perform concierge.txt(r,'rationale',4000);
  if concierge.txt(r,'currency',3)<>'USD' or concierge.integer(r,'priceCents')>100000000 then perform concierge.fail('invalid_input'); end if;
  if (r->>'id')=any(ids) or (r->>'slot')=any(slots) then perform concierge.fail('invalid_input'); end if;
  ids:=array_append(ids,r->>'id');slots:=array_append(slots,r->>'slot');
 end loop;
end $$;
create function concierge.public_items(items jsonb) returns jsonb language sql set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',r->>'id','slot',r->>'slot','currentProductId',r->>'currentProductId','proposedProductId',r->>'proposedProductId','priceCents',r->'priceCents','currency',r->>'currency','rationale',r->>'rationale') order by n),'[]'::jsonb) from jsonb_array_elements(items) with ordinality j(r,n)
$$;
create function concierge.immutable() returns trigger language plpgsql set search_path='' as $$ begin perform concierge.fail('immutable');return new;end $$;
create trigger publications_immutable before update on concierge.publications for each row execute function concierge.immutable();
create trigger activations_immutable before update on concierge.activations for each row execute function concierge.immutable();
create trigger intakes_immutable before update on concierge.intakes for each row execute function concierge.immutable();
create trigger baselines_immutable before update on concierge.baselines for each row execute function concierge.immutable();
create trigger receipts_immutable before update on concierge.receipts for each row execute function concierge.immutable();

create function concierge.client_projection(c uuid) returns jsonb language plpgsql set search_path='' as $$
declare rev bigint;v integer;items jsonb:='[]';plan jsonb;history jsonb;states jsonb;orders jsonb;routine jsonb;starts jsonb; begin
 select revision,published_version into rev,v from concierge.cases where client_id=c for share;
 if not found then return jsonb_build_object('revision',0,'plan',null,'history','[]'::jsonb,'orderProposal',jsonb_build_object('kind','proposal','currency','USD','items','[]'::jsonb,'subtotalCents',0,'payable',false,'shippingAndTaxConfirmed',false),'routine','[]'::jsonb,'routineHistory','[]'::jsonb);end if;
 if v>0 then
  select recommendations into items from concierge.publications where client_id=c and version=v;
  select coalesce(jsonb_agg(jsonb_build_object('recommendationId',r->>'id','choice',s.choice,'reason',s.reason,'received',o.client_id is not null,'startedOn',a.started_on) order by n),'[]') into states
   from jsonb_array_elements(items) with ordinality j(r,n) join concierge.item_states s on s.client_id=c and s.version=v and s.recommendation_id=r->>'id'
   left join concierge.receipts o on o.client_id=c and o.slot=r->>'slot' and o.product_id=r->>'proposedProductId' left join concierge.activations a on a.id=s.activation_id;
  plan:=jsonb_build_object('version',v,'recommendations',concierge.public_items(items),'itemStates',states);
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('version',version,'recommendations',concierge.public_items(recommendations)) order by version),'[]') into history from concierge.publications where client_id=c and version<v;
 select coalesce(jsonb_agg(r order by n),'[]') into orders from jsonb_array_elements(concierge.public_items(items)) with ordinality j(r,n)
  join concierge.item_states s on s.client_id=c and s.version=v and s.recommendation_id=r->>'id' and s.choice='approved'
  where not exists(select 1 from concierge.receipts o where o.client_id=c and o.slot=r->>'slot' and o.product_id=r->>'proposedProductId');
 select coalesce(jsonb_agg(jsonb_build_object('slot',b.slot,'productId',coalesce(a.product_id,b.product_id)) order by b.slot),'[]') into routine from concierge.baselines b
  left join lateral(select product_id from concierge.activations where client_id=c and slot=b.slot and started_on<=(now() at time zone 'UTC')::date order by started_on desc,id desc limit 1)a on true where b.client_id=c;
 select coalesce(jsonb_agg(jsonb_build_object('version',version,'recommendationId',recommendation_id,'slot',slot,'productId',product_id,'startedOn',started_on) order by started_on,id),'[]') into starts from concierge.activations where client_id=c;
 return jsonb_build_object('revision',rev,'plan',plan,'history',history,'orderProposal',jsonb_build_object('kind','proposal','currency','USD','items',orders,'subtotalCents',(select coalesce(sum((r->>'priceCents')::bigint),0) from jsonb_array_elements(orders) j(r)),'payable',false,'shippingAndTaxConfirmed',false),'routine',routine,'routineHistory',starts);
end $$;
create function public.concierge_client_view() returns jsonb language plpgsql security definer set search_path='' as $$ declare u uuid:=concierge.actor();begin return concierge.client_projection(u);end $$;
create function public.concierge_advisor_view(p_client_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.actor();i concierge.intakes;d concierge.drafts;begin
 perform concierge.advisor(u);
 perform concierge.target(p_client_id);
 perform 1 from concierge.cases where client_id=p_client_id for share;
 select * into i from concierge.intakes where client_id=p_client_id order by version desc limit 1;
 select * into d from concierge.drafts where client_id=p_client_id;
 return jsonb_build_object('client',concierge.client_projection(p_client_id),'intake',case when i.client_id is not null then jsonb_build_object('version',i.version,'goal',i.goal,'note',i.note) end,'draft',case when d.client_id is not null then jsonb_build_object('intakeVersion',d.intake_version,'recommendations',concierge.public_items(d.recommendations),'advisorNote',d.advisor_note) end);
end $$;

create function public.concierge_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.actor();c concierge.cases;prior concierge.requests;fingerprint bytea;result jsonb;r jsonb;oldr jsonb;d concierge.drafts;s concierge.item_states;olds concierge.item_states;v integer;iv integer;aid bigint;day date;changed boolean:=true;has_receipt boolean;g text;n text; begin
 if pg_column_size(p_payload)>100000 or p_client_id is null or p_request_id is null or p_expected_revision is null or p_expected_revision<0 or p_expected_revision>9007199254740991 or p_action is null then perform concierge.fail('invalid_input');end if;
 if p_action in ('save_draft','publish') then perform concierge.advisor(u);
 elsif p_action in ('submit_intake','decide','receive','start') then
  if p_client_id<>u then perform concierge.fail('forbidden');end if;
 else perform concierge.fail('invalid_input');end if;
 -- Recheck target permanent identity/deletion fence; no free/paid app gate is changed.
 perform concierge.target(p_client_id);
 perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||u::text||':'||p_request_id::text,0));
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));
 fingerprint:=sha256(convert_to(jsonb_build_array(p_client_id,p_action,p_expected_revision,p_payload)::text,'UTF8'));
 select * into prior from concierge.requests where actor_id=u and request_id=p_request_id;
 if found then
  if prior.client_id<>p_client_id or prior.fingerprint<>fingerprint then perform concierge.fail('request_conflict');end if;
  return prior.result;
 end if;
 if p_action='submit_intake' then insert into concierge.cases(client_id) values(p_client_id) on conflict do nothing;end if;
 select * into c from concierge.cases where client_id=p_client_id for update;
 if not found then perform concierge.fail('not_found');end if;
 if c.revision<>p_expected_revision then perform concierge.fail('revision_conflict');end if;
 v:=c.published_version;
 if p_action='submit_intake' then
  perform concierge.keys(p_payload,array['goal','note','baseline']);g:=concierge.txt(p_payload,'goal',300);n:=concierge.txt(p_payload,'note',4000,true);
  if jsonb_typeof(p_payload->'baseline') is distinct from 'array' then perform concierge.fail('invalid_input');end if;
  if jsonb_array_length(p_payload->'baseline') not between 1 and 50 then perform concierge.fail('invalid_input');end if;
  if (select count(distinct x->>'slot') from jsonb_array_elements(p_payload->'baseline')j(x))<>jsonb_array_length(p_payload->'baseline') then perform concierge.fail('invalid_input');end if;
  -- Later intake context must not add/remove active baseline slots behind Ready.
  if exists(select 1 from concierge.intakes where client_id=p_client_id) and (
   (select count(*) from concierge.baselines where client_id=p_client_id)<>jsonb_array_length(p_payload->'baseline')
   or exists(select 1 from concierge.baselines b where b.client_id=p_client_id and not exists(
    select 1 from jsonb_array_elements(p_payload->'baseline') j(x) where x->>'slot'=b.slot and x->>'productId'=b.product_id))
  ) then perform concierge.fail('baseline_conflict');end if;
  for r in select value from jsonb_array_elements(p_payload->'baseline') loop
   perform concierge.keys(r,array['slot','productId']);perform concierge.identifier(concierge.txt(r,'slot',100));perform concierge.identifier(concierge.txt(r,'productId',100));
   if exists(select 1 from concierge.baselines where client_id=p_client_id and slot=r->>'slot' and product_id<>r->>'productId') then perform concierge.fail('baseline_conflict');end if;
   insert into concierge.baselines values(p_client_id,r->>'slot',r->>'productId') on conflict do nothing;
  end loop;
  select coalesce(max(version),0)+1 into iv from concierge.intakes where client_id=p_client_id;
  insert into concierge.intakes(client_id,version,goal,note) values(p_client_id,iv,g,n);
 elsif p_action='save_draft' then
  perform concierge.keys(p_payload,array['intakeVersion','recommendations','advisorNote']);iv:=concierge.integer(p_payload,'intakeVersion');
  if iv is distinct from (select max(version) from concierge.intakes where client_id=p_client_id) then perform concierge.fail('intake_conflict');end if;
  perform concierge.validate_items(p_payload->'recommendations');n:=concierge.txt(p_payload,'advisorNote',4000,true);
  for r in select value from jsonb_array_elements(p_payload->'recommendations') loop
   if not exists(select 1 from concierge.baselines where client_id=p_client_id and slot=r->>'slot') then perform concierge.fail('invalid_input');end if;
  end loop;
  insert into concierge.drafts values(p_client_id,iv,concierge.public_items(p_payload->'recommendations'),n) on conflict(client_id) do update set intake_version=excluded.intake_version,recommendations=excluded.recommendations,advisor_note=excluded.advisor_note;
 elsif p_action='publish' then
  perform concierge.keys(p_payload,array[]::text[]);
  select * into d from concierge.drafts where client_id=p_client_id;
  if not found then perform concierge.fail('draft_unavailable');end if;
  if d.intake_version is distinct from (select max(version) from concierge.intakes where client_id=p_client_id) then perform concierge.fail('intake_conflict');end if;
  perform concierge.validate_items(d.recommendations);
  insert into concierge.publications(client_id,version,intake_version,recommendations,published_by) values(p_client_id,v+1,d.intake_version,concierge.public_items(d.recommendations),u);
  for r in select value from jsonb_array_elements(d.recommendations) loop
   oldr:=null;olds:=null;
   select j.x into oldr from concierge.publications p cross join lateral jsonb_array_elements(p.recommendations)j(x) where p.client_id=p_client_id and p.version=v and j.x->>'slot'=r->>'slot' and j.x->>'proposedProductId'=r->>'proposedProductId';
   if oldr is not null then select * into olds from concierge.item_states where client_id=p_client_id and version=v and recommendation_id=oldr->>'id';end if;
   select exists(select 1 from concierge.receipts where client_id=p_client_id and slot=r->>'slot' and product_id=r->>'proposedProductId') into has_receipt;
   insert into concierge.item_states(client_id,version,recommendation_id,choice,reason,activation_id)
   values(p_client_id,v+1,r->>'id',case when has_receipt then 'approved' when oldr->'priceCents'=r->'priceCents' and oldr->>'currency'=r->>'currency' then olds.choice end,
    case when not has_receipt and oldr->'priceCents'=r->'priceCents' and oldr->>'currency'=r->>'currency' then olds.reason end,olds.activation_id);
  end loop;
  delete from concierge.drafts where client_id=p_client_id;v:=v+1;
 else
  if p_action='decide' then perform concierge.keys(p_payload,array['version','recommendationId','choice','reason']);
  elsif p_action='receive' then perform concierge.keys(p_payload,array['version','recommendationId']);
  else perform concierge.keys(p_payload,array['version','recommendationId','startedOn']);end if;
  if concierge.integer(p_payload,'version')<>v or v=0 then perform concierge.fail('publication_conflict');end if;
  n:=concierge.txt(p_payload,'recommendationId',100);perform concierge.identifier(n);
  select j.x into r from concierge.publications p cross join lateral jsonb_array_elements(p.recommendations)j(x) where p.client_id=p_client_id and p.version=v and j.x->>'id'=n;
  if r is null then perform concierge.fail('not_found');end if;
  select * into s from concierge.item_states where client_id=p_client_id and version=v and recommendation_id=n;
  select exists(select 1 from concierge.receipts where client_id=p_client_id and slot=r->>'slot' and product_id=r->>'proposedProductId') into has_receipt;
  if p_action='decide' then
   g:=concierge.txt(p_payload,'choice',8);n:=concierge.txt(p_payload,'reason',1000,true);
   if g not in ('approved','declined') or (g='declined' and nullif(concierge.trim_text(n),'') is null) or (g='approved' and n<>'') then perform concierge.fail('invalid_input');end if;
   if has_receipt then perform concierge.fail('already_received');end if;
   update concierge.item_states set choice=g,reason=case when g='declined' then concierge.trim_text(n) end where client_id=p_client_id and version=v and recommendation_id=r->>'id';
  elsif p_action='receive' then
   if s.choice is distinct from 'approved' then perform concierge.fail('product_not_approved');end if;
   changed:=not has_receipt;
   insert into concierge.receipts(client_id,slot,product_id) values(p_client_id,r->>'slot',r->>'proposedProductId') on conflict do nothing;
  else
   if s.choice is distinct from 'approved' or not has_receipt then perform concierge.fail('product_not_received');end if;
   n:=concierge.txt(p_payload,'startedOn',10);
   if n !~ '^\d{4}-\d{2}-\d{2}$' then perform concierge.fail('invalid_input');end if;day:=n::date;
   if day>(now() at time zone 'UTC')::date or day<'1900-01-01'::date then perform concierge.fail('invalid_input');end if;
   if s.activation_id is not null then
    if day is distinct from (select started_on from concierge.activations where id=s.activation_id) then perform concierge.fail('already_started');end if;changed:=false;
   else
    insert into concierge.activations(client_id,version,recommendation_id,slot,product_id,started_on)values(p_client_id,v,r->>'id',r->>'slot',r->>'proposedProductId',day) returning id into aid;
    update concierge.item_states set activation_id=aid where client_id=p_client_id and version=v and recommendation_id=r->>'id';
   end if;
  end if;
 end if;
 update concierge.cases set revision=revision+case when changed then 1 else 0 end,published_version=v where client_id=p_client_id returning revision into c.revision;
 result:=jsonb_build_object('revision',c.revision,'publishedVersion',v,'operation',p_action);
 insert into concierge.requests values(u,p_request_id,p_client_id,fingerprint,result);
 return result;
exception when invalid_text_representation or datetime_field_overflow or numeric_value_out_of_range then perform concierge.fail('invalid_input');return null;
end $$;
-- Explicit ACLs override even the canonical service_role default privileges.
revoke all on all functions in schema concierge from public,anon,authenticated,service_role;
revoke all on function public.concierge_client_view() from public,anon,service_role;
revoke all on function public.concierge_advisor_view(uuid) from public,anon,service_role;
revoke all on function public.concierge_write(uuid,text,bigint,uuid,jsonb) from public,anon,service_role;
grant execute on function public.concierge_client_view() to authenticated;
grant execute on function public.concierge_advisor_view(uuid) to authenticated;
grant execute on function public.concierge_write(uuid,text,bigint,uuid,jsonb) to authenticated;
