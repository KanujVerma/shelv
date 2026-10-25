-- Requires the reviewed concierge R1 migration. No users, enrollments or advisor
-- capabilities are provisioned here. All financial confirmations remain manual.
begin;
do $$ begin
 if to_regprocedure('public.concierge_write(uuid,text,bigint,uuid,jsonb)') is null then
  raise exception 'concierge_r1_prerequisite_missing';
 end if;
end $$;
alter table concierge.advisors add column can_view boolean not null default false,
 add column can_edit boolean not null default false,
 add column can_publish boolean not null default false,
 add column can_confirm_payments boolean not null default false;
create table concierge.enrollments (
 client_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(concierge.trim_text(display_name)) between 1 and 200),
 status text not null check(status in ('active','cancelled','revoked')),
 phase text not null default 'premeeting' check(phase in ('premeeting','ongoing')),
 created_at timestamptz not null default now()
);
create table concierge.meeting_notes (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references concierge.cases on delete cascade,
 kind text not null check(kind in ('notes','transcript')), body text not null check(length(concierge.trim_text(body)) between 1 and 20000),
 created_at timestamptz not null default now(), created_by uuid not null
);
create table concierge.payment_heads (
 client_id uuid primary key references concierge.cases on delete cascade,
 revision bigint not null default 0 check(revision between 0 and 9007199254740991), quote_version integer not null default 0, address_version integer not null default 0
);
create table concierge.shipping_addresses (
 client_id uuid not null references concierge.cases on delete cascade, version integer not null,
 address jsonb not null, confirmed_by uuid not null, confirmed_at timestamptz not null default now(), primary key(client_id,version)
);
create table concierge.quotes (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references concierge.cases on delete cascade,
 version integer not null, publication_version integer not null check(publication_version>=0), shipping_address_version integer, money jsonb not null,
 created_at timestamptz not null default now(), created_by uuid not null,
 unique(client_id,version), unique(client_id,id), foreign key(client_id,shipping_address_version) references concierge.shipping_addresses(client_id,version)
);
create table concierge.quote_states (quote_id uuid primary key references concierge.quotes on delete cascade,
 status text not null check(status in ('payable','superseded','settled')));
create table concierge.payment_evidence (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references concierge.cases on delete cascade,
 quote_id uuid not null, quote_version integer not null, reserved_by uuid not null,
 path text not null unique, content_type text not null check(content_type in ('image/jpeg','image/png')),
 size_bytes bigint not null check(size_bytes between 1 and 5242880), sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
 state text not null check(state in ('reserved','uploaded')), created_at timestamptz not null default now(),
 foreign key(client_id,quote_id) references concierge.quotes(client_id,id) on delete cascade
);
create table concierge.claims (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references concierge.cases on delete cascade,
 quote_id uuid not null, evidence_id uuid references concierge.payment_evidence deferrable initially deferred,
 created_at timestamptz not null default now(), foreign key(client_id,quote_id) references concierge.quotes(client_id,id) on delete cascade
);
create table concierge.claim_states (claim_id uuid primary key references concierge.claims on delete cascade,
 status text not null check(status in ('submitted_unverified','confirmed','rejected')));
create table concierge.payment_confirmations (
 claim_id uuid primary key references concierge.claims on delete cascade,
 quote_id uuid not null unique references concierge.quotes on delete cascade,
 client_id uuid not null references concierge.cases on delete cascade, advisor_id uuid not null,
 confirmed_at timestamptz not null default now(), service_cents bigint not null check(service_cents in (0,10000)),
 product_cents bigint not null check(product_cents between 0 and 100000000), total_cents bigint not null,
 service_start date, service_end date,
 check(total_cents=service_cents+product_cents and total_cents between 1 and 100000000),
 check((service_cents=0 and service_start is null and service_end is null) or
  (service_cents=10000 and ((service_start is null and service_end is null) or (service_start is not null and service_end=(service_start+interval '1 month')::date))))
);
create table concierge.service_periods (
 claim_id uuid primary key references concierge.payment_confirmations on delete cascade,
 client_id uuid not null references concierge.cases on delete cascade, starts_on date, ends_on date,
 check((starts_on is null and ends_on is null) or (starts_on is not null and ends_on=(starts_on+interval '1 month')::date))
);
create unique index one_pending_service_period on concierge.service_periods(client_id) where starts_on is null;
create table concierge.entitled_publications (
 client_id uuid not null, version integer not null, claim_id uuid not null references concierge.payment_confirmations on delete cascade,
 starts_on date not null, primary key(client_id,version), foreign key(client_id,version) references concierge.publications on delete cascade
);
create table concierge.product_orders (
 quote_id uuid primary key references concierge.quotes on delete cascade,
 status text not null check(status='ready_to_purchase'), created_at timestamptz not null default now()
);
create table concierge.payment_audit (
 id bigint generated always as identity primary key, client_id uuid not null references concierge.cases on delete cascade,
 actor_id uuid not null, action text not null check(action in ('issue_quote','submit_claim','confirm_payment','reject_claim')),
 quote_id uuid not null references concierge.quotes on delete cascade, claim_id uuid references concierge.claims on delete cascade,
 reason_code text check(reason_code in ('not_received','amount_mismatch','duplicate_claim','wrong_recipient')),
 created_at timestamptz not null default now()
);
create table concierge.checkin_heads (
 client_id uuid primary key references concierge.cases on delete cascade, revision bigint not null default 0 check(revision between 0 and 9007199254740991), next_checkin_on date
);
create table concierge.checkin_photos (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references concierge.cases on delete cascade,
 reserved_by uuid not null, reservation_revision bigint not null check(reservation_revision between 1 and 9007199254740991),
 path text not null unique, angle text not null check(angle in ('front','left','right')),
 content_type text not null check(content_type in ('image/jpeg','image/png','image/webp')),
 size_bytes bigint not null check(size_bytes between 1 and 5242880), sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
 state text not null check(state in ('pending','complete')), created_at timestamptz not null default now()
);
create table concierge.checkin_reports (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references concierge.cases on delete cascade,
 comfort text not null check(length(concierge.trim_text(comfort)) between 1 and 1000),
 consistency text not null check(length(concierge.trim_text(consistency)) between 1 and 1000),
 changes text not null check(length(changes)<=1000), submitted_at timestamptz not null default now(), unique(client_id,id)
);
create table concierge.report_photos (
 photo_id uuid primary key references concierge.checkin_photos on delete cascade,
 report_id uuid not null references concierge.checkin_reports on delete cascade
);
create table concierge.checkin_notes (
 id uuid primary key default gen_random_uuid(), client_id uuid not null, report_id uuid not null,
 note text not null check(length(concierge.trim_text(note)) between 1 and 4000), created_at timestamptz not null default now(), created_by uuid not null,
 foreign key(client_id,report_id) references concierge.checkin_reports(client_id,id) on delete cascade
);
create table concierge.workflow_requests (
 actor_id uuid not null references auth.users on delete cascade, request_id uuid not null,
 client_id uuid not null references concierge.cases on delete cascade, fingerprint bytea not null, result jsonb not null,
 primary key(actor_id,request_id)
);

create function concierge.capability(u uuid, capability text) returns void language plpgsql set search_path='' as $$ begin
 perform 1 from concierge.advisors where user_id=u and active and can_view and case capability
  when 'view' then true when 'edit' then can_edit when 'publish' then can_publish when 'confirm' then can_confirm_payments else false end for share;
 if not found then perform concierge.fail('forbidden');end if;
end $$;
create function concierge.access(c uuid, capability text default null, writing boolean default false) returns uuid language plpgsql set search_path='' as $$
declare u uuid:=concierge.actor();e concierge.enrollments;begin
 if capability is not null then perform concierge.capability(u,capability);
 elsif c is distinct from u then perform concierge.fail('forbidden');end if;
 perform concierge.target(c);
 select * into e from concierge.enrollments where client_id=c for share;
 if not found or (capability is null and e.status='revoked') or (writing and e.status<>'active') then perform concierge.fail('forbidden');end if;
 return u;
end $$;
create function concierge.service_active(c uuid) returns boolean language sql set search_path='' as $$
 select exists(select 1 from concierge.service_periods p join concierge.enrollments e on e.client_id=p.client_id
  where p.client_id=c and e.status='active' and p.starts_on<=(now() at time zone 'America/Chicago')::date and p.ends_on>(now() at time zone 'America/Chicago')::date);
$$;
create function concierge.service_projection(c uuid) returns jsonb language plpgsql set search_path='' as $$
declare p concierge.service_periods;status text;begin
 select * into p from concierge.service_periods where client_id=c order by
  case when starts_on<=(now() at time zone 'America/Chicago')::date and ends_on>(now() at time zone 'America/Chicago')::date then 0 else 1 end,
  starts_on desc nulls last,claim_id limit 1;
 if not found then return jsonb_build_object('status','unpaid','period',concierge.invoice_period(c));end if;
 status:=case when (select e.status from concierge.enrollments e where e.client_id=c)='cancelled' then 'cancelled'
  when concierge.service_active(c) then 'active' when p.starts_on is null then 'pending_publication' else 'expired' end;
 return jsonb_build_object('status',status,'period',case when p.starts_on is not null then jsonb_build_object('startOn',p.starts_on,'endOn',p.ends_on) end);
end $$;
create function concierge.service_anchor(c uuid) returns date language sql set search_path='' as $$
 select coalesce((select max(ends_on) from concierge.service_periods where client_id=c),
  (select (published_at at time zone 'America/Chicago')::date from concierge.publications where client_id=c order by version limit 1));
$$;
create function concierge.invoice_period(c uuid) returns jsonb language sql set search_path='' as $$
 select case when d is not null then jsonb_build_object('startOn',d,'endOn',(d+interval '1 month')::date) end from (select concierge.service_anchor(c) d) q;
$$;
create function concierge.activate_service(c uuid) returns void language plpgsql set search_path='' as $$
declare first_day date;begin
 select (published_at at time zone 'America/Chicago')::date into first_day from concierge.publications where client_id=c order by version limit 1;
 if first_day is null then return;end if;
 update concierge.service_periods set starts_on=first_day,ends_on=(first_day+interval '1 month')::date where client_id=c and starts_on is null;
 insert into concierge.entitled_publications(client_id,version,claim_id,starts_on)
 select distinct on(p.version) c,p.version,s.claim_id,s.starts_on from concierge.publications p join concierge.service_periods s on s.client_id=p.client_id
 where p.client_id=c and s.starts_on is not null and (p.published_at at time zone 'America/Chicago')::date<s.ends_on
 order by p.version,s.starts_on,s.claim_id on conflict do nothing;
end $$;
create function concierge.period_immutable() returns trigger language plpgsql set search_path='' as $$ begin
 if old.starts_on is not null or old.claim_id<>new.claim_id or old.client_id<>new.client_id or new.starts_on is null
  or new.starts_on is distinct from (select (published_at at time zone 'America/Chicago')::date from concierge.publications where client_id=old.client_id order by version limit 1) then perform concierge.fail('immutable');end if;
 return new;
end $$;
create trigger service_period_once before update on concierge.service_periods for each row execute function concierge.period_immutable();
create function concierge.checkin_guard(c uuid) returns void language plpgsql set search_path='' as $$ begin
 if ((select phase from concierge.enrollments where client_id=c)='ongoing' or exists(select 1 from concierge.service_periods where client_id=c and starts_on is not null)) and not concierge.service_active(c) then perform concierge.fail('forbidden');end if;
end $$;
create function concierge.workflow_fingerprint(c uuid, stream text, action text, rev bigint, payload jsonb) returns bytea language sql set search_path='' as $$
 select sha256(convert_to(jsonb_build_array(c,stream,action,rev,payload)::text,'UTF8'));
$$;
create function concierge.workflow_begin(u uuid,c uuid,request uuid,stream text,action text,rev bigint,payload jsonb) returns jsonb language plpgsql set search_path='' as $$
declare prior concierge.workflow_requests;fp bytea;begin
 if request is null or rev is null or rev not between 0 and 9007199254740991 or jsonb_typeof(payload) is distinct from 'object' or pg_column_size(payload)>100000 then perform concierge.fail('invalid_input');end if;
 perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||u::text||':'||request::text,0));
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||c::text,0));
 fp:=concierge.workflow_fingerprint(c,stream,action,rev,payload);
 select * into prior from concierge.workflow_requests where actor_id=u and request_id=request;
 if found then if prior.fingerprint<>fp or prior.client_id<>c then perform concierge.fail('request_conflict');end if;return prior.result;end if;
 if exists(select 1 from concierge.requests where actor_id=u and request_id=request) then perform concierge.fail('request_conflict');end if;
 insert into concierge.cases(client_id) values(c) on conflict do nothing;
 return null;
end $$;
create function concierge.workflow_finish(u uuid,c uuid,request uuid,stream text,action text,rev bigint,payload jsonb,result jsonb) returns jsonb language plpgsql set search_path='' as $$ begin
 insert into concierge.workflow_requests values(u,request,c,concierge.workflow_fingerprint(c,stream,action,rev,payload),result);return result;
end $$;
create function concierge.day(v jsonb,k text) returns date language plpgsql set search_path='' as $$ declare s text;d date;begin
 s:=concierge.txt(v,k,10);if s !~ '^\d{4}-\d{2}-\d{2}$' then perform concierge.fail('invalid_input');end if;d:=s::date;
 if d<'1900-01-01'::date or to_char(d,'YYYY-MM-DD')<>s then perform concierge.fail('invalid_input');end if;return d;
exception when datetime_field_overflow or invalid_datetime_format then perform concierge.fail('invalid_input');return null;end $$;

-- Keep the proven R1 transitions private; public wrappers always recheck new
-- guards before invoking R1, including when R1 returns an exact retry receipt.
alter function public.concierge_write(uuid,text,bigint,uuid,jsonb) set schema concierge;
alter function concierge.concierge_write(uuid,text,bigint,uuid,jsonb) rename to r1_write;
alter function public.concierge_advisor_view(uuid) set schema concierge;
alter function concierge.concierge_advisor_view(uuid) rename to r1_advisor_view;

create function public.concierge_advisor_directory() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.actor();a concierge.advisors;clients jsonb;begin
 perform concierge.capability(u,'view');select * into a from concierge.advisors where user_id=u;
 select coalesce(jsonb_agg(jsonb_build_object('clientId',e.client_id,'displayName',e.display_name,'enrollmentStatus',e.status,
  'revision',coalesce(c.revision,0),'publishedVersion',coalesce(c.published_version,0),'hasDraft',exists(select 1 from concierge.drafts d where d.client_id=e.client_id)) order by e.display_name,e.client_id),'[]') into clients
 from concierge.enrollments e join auth.users au on au.id=e.client_id and au.is_anonymous is false
 join public.profiles pp on pp.id=e.client_id and pp.deletion_started_at is null left join concierge.cases c on c.client_id=e.client_id;
 return jsonb_build_object('capabilities',jsonb_build_object('view',a.can_view,'edit',a.can_edit,'publish',a.can_publish,'confirmPayments',a.can_confirm_payments),'clients',clients);
end $$;
create function public.concierge_advisor_view(p_client_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.access(p_client_id,'view');v jsonb;notes jsonb;begin
 v:=concierge.r1_advisor_view(p_client_id);
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'kind',kind,'text',body,'createdAt',created_at) order by created_at,id),'[]') into notes from concierge.meeting_notes where client_id=p_client_id;
 return v||jsonb_build_object('meetingNotes',notes);
end $$;
create function public.concierge_advisor_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.access(p_client_id,'edit',true);prior jsonb;c concierge.cases;r jsonb;g text;n text;iv integer;begin
 if p_action not in ('save_intake','save_meeting_note') or p_action is null then perform concierge.fail('invalid_input');end if;
 prior:=concierge.workflow_begin(u,p_client_id,p_request_id,'advisor',p_action,p_expected_revision,p_payload);if prior is not null then return prior;end if;
 select * into c from concierge.cases where client_id=p_client_id for update;
 if c.revision<>p_expected_revision then perform concierge.fail('revision_conflict');end if;
 if p_action='save_intake' then
  perform concierge.keys(p_payload,array['goal','note','baseline']);g:=concierge.txt(p_payload,'goal',300);n:=concierge.txt(p_payload,'note',4000,true);
  if jsonb_typeof(p_payload->'baseline') is distinct from 'array' then perform concierge.fail('invalid_input');end if;
  if jsonb_array_length(p_payload->'baseline') not between 1 and 50 or
   (select count(distinct x->>'slot') from jsonb_array_elements(p_payload->'baseline')j(x))<>jsonb_array_length(p_payload->'baseline') then perform concierge.fail('invalid_input');end if;
  if exists(select 1 from concierge.intakes where client_id=p_client_id) and (
   (select count(*) from concierge.baselines where client_id=p_client_id)<>jsonb_array_length(p_payload->'baseline') or exists(
    select 1 from concierge.baselines b where b.client_id=p_client_id and not exists(select 1 from jsonb_array_elements(p_payload->'baseline')j(x) where x->>'slot'=b.slot and x->>'productId'=b.product_id))) then perform concierge.fail('baseline_conflict');end if;
  for r in select value from jsonb_array_elements(p_payload->'baseline') loop
   perform concierge.keys(r,array['slot','productId']);perform concierge.identifier(concierge.txt(r,'slot',100));perform concierge.identifier(concierge.txt(r,'productId',100));
   insert into concierge.baselines values(p_client_id,r->>'slot',r->>'productId') on conflict do nothing;
  end loop;
  select coalesce(max(version),0)+1 into iv from concierge.intakes where client_id=p_client_id;
  insert into concierge.intakes(client_id,version,goal,note) values(p_client_id,iv,g,n);
 else
  perform concierge.keys(p_payload,array['kind','text']);g:=concierge.txt(p_payload,'kind',10);n:=concierge.txt(p_payload,'text',20000);
  if g not in ('notes','transcript') then perform concierge.fail('invalid_input');end if;
  insert into concierge.meeting_notes(client_id,kind,body,created_by) values(p_client_id,g,n,u);
 end if;
 update concierge.cases set revision=revision+1 where client_id=p_client_id returning * into c;
 return concierge.workflow_finish(u,p_client_id,p_request_id,'advisor',p_action,p_expected_revision,p_payload,
  jsonb_build_object('revision',c.revision,'publishedVersion',c.published_version,'operation',p_action));
end $$;

-- Client snapshots are limited to publications that a bank-confirmed service
-- period actually entitled. Cancellation retains the last such snapshot.
create function concierge.portal_projection(c uuid) returns jsonb language plpgsql set search_path='' as $$
declare rev bigint;v integer;items jsonb:='[]';plan jsonb;history jsonb;states jsonb;orders jsonb;routine jsonb;starts jsonb;begin
 select revision into rev from concierge.cases where client_id=c for share;
 select coalesce(max(version),0) into v from concierge.entitled_publications where client_id=c and starts_on<=(now() at time zone 'America/Chicago')::date;
 if v=0 then return jsonb_build_object('revision',coalesce(rev,0),'plan',null,'history','[]'::jsonb,'orderProposal',jsonb_build_object('kind','proposal','currency','USD','items','[]'::jsonb,'subtotalCents',0,'payable',false,'shippingAndTaxConfirmed',false),'routine','[]'::jsonb,'routineHistory','[]'::jsonb);end if;
 select recommendations into items from concierge.publications where client_id=c and version=v;
 select coalesce(jsonb_agg(jsonb_build_object('recommendationId',r->>'id','choice',s.choice,'reason',s.reason,'received',o.client_id is not null,'startedOn',a.started_on) order by n),'[]') into states
  from jsonb_array_elements(items) with ordinality j(r,n) join concierge.item_states s on s.client_id=c and s.version=v and s.recommendation_id=r->>'id'
  left join concierge.receipts o on o.client_id=c and o.slot=r->>'slot' and o.product_id=r->>'proposedProductId' left join concierge.activations a on a.id=s.activation_id;
 plan:=jsonb_build_object('version',v,'recommendations',concierge.public_items(items),'itemStates',states);
 select coalesce(jsonb_agg(jsonb_build_object('version',p.version,'recommendations',concierge.public_items(p.recommendations)) order by p.version),'[]') into history
  from concierge.publications p join concierge.entitled_publications e on e.client_id=p.client_id and e.version=p.version where p.client_id=c and p.version<v and e.starts_on<=(now() at time zone 'America/Chicago')::date;
 select coalesce(jsonb_agg(r order by n),'[]') into orders from jsonb_array_elements(concierge.public_items(items)) with ordinality j(r,n)
  join concierge.item_states s on s.client_id=c and s.version=v and s.recommendation_id=r->>'id' and s.choice='approved'
  where not exists(select 1 from concierge.receipts o where o.client_id=c and o.slot=r->>'slot' and o.product_id=r->>'proposedProductId');
 select coalesce(jsonb_agg(jsonb_build_object('slot',b.slot,'productId',coalesce(a.product_id,b.product_id)) order by b.slot),'[]') into routine from concierge.baselines b
  left join lateral(select a.product_id from concierge.activations a join concierge.entitled_publications e on e.client_id=a.client_id and e.version=a.version where a.client_id=c and a.slot=b.slot and a.version<=v and e.starts_on<=(now() at time zone 'America/Chicago')::date and a.started_on<=(now() at time zone 'UTC')::date order by a.started_on desc,a.id desc limit 1)a on true where b.client_id=c;
 select coalesce(jsonb_agg(jsonb_build_object('version',a.version,'recommendationId',a.recommendation_id,'slot',a.slot,'productId',a.product_id,'startedOn',a.started_on) order by a.started_on,a.id),'[]') into starts from concierge.activations a join concierge.entitled_publications e on e.client_id=a.client_id and e.version=a.version where a.client_id=c and a.version<=v and e.starts_on<=(now() at time zone 'America/Chicago')::date;
 return jsonb_build_object('revision',rev,'plan',plan,'history',history,'orderProposal',jsonb_build_object('kind','proposal','currency','USD','items',orders,'subtotalCents',(select coalesce(sum((r->>'priceCents')::bigint),0) from jsonb_array_elements(orders)j(r)),'payable',false,'shippingAndTaxConfirmed',false),'routine',routine,'routineHistory',starts);
end $$;
create or replace function public.concierge_client_view() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.actor();begin perform concierge.access(u);return concierge.portal_projection(u);end $$;
create function public.concierge_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid;result jsonb;was_replay boolean;begin
 if p_action='save_draft' then u:=concierge.access(p_client_id,'edit',true);
 elsif p_action='publish' then u:=concierge.access(p_client_id,'publish',true);
 elsif p_action in ('decide','receive','start') then
  u:=concierge.access(p_client_id,null,true);
  if not concierge.service_active(p_client_id) then perform concierge.fail('forbidden');end if;
 else perform concierge.fail('forbidden');end if;
 perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||u::text||':'||p_request_id::text,0));
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));
 if exists(select 1 from concierge.workflow_requests where actor_id=u and request_id=p_request_id) then perform concierge.fail('request_conflict');end if;
 if p_action in ('decide','receive','start') and not exists(select 1 from concierge.cases c join concierge.entitled_publications e on e.client_id=c.client_id and e.version=c.published_version where c.client_id=p_client_id and e.starts_on<=(now() at time zone 'America/Chicago')::date) then perform concierge.fail('forbidden');end if;
 was_replay:=exists(select 1 from concierge.requests where actor_id=u and request_id=p_request_id);
 result:=concierge.r1_write(p_client_id,p_action,p_expected_revision,p_request_id,p_payload);
 if not was_replay and p_action in ('publish','decide','receive') then
  update concierge.quote_states st set status='superseded' from concierge.quotes qq where qq.id=st.quote_id and qq.client_id=p_client_id and st.status='payable' and (qq.money->>'productTotalCents')::bigint>0;
 end if;
 if p_action='publish' and not was_replay then
  -- A changed recommendation ID is a new purchase obligation. R1 carries choice
  -- by slot/SKU; require fresh approval for renamed, unreceived items instead.
  -- Received/started continuity remains governed by the existing R1 receipt.
  update concierge.item_states st set choice=null,reason=null
   from concierge.publications current_pub cross join lateral jsonb_array_elements(current_pub.recommendations)j(item)
   join concierge.publications previous_pub on previous_pub.client_id=current_pub.client_id and previous_pub.version=current_pub.version-1
   cross join lateral jsonb_array_elements(previous_pub.recommendations)old(item)
   where current_pub.client_id=p_client_id and current_pub.version=(result->>'publishedVersion')::integer
    and st.client_id=current_pub.client_id and st.version=current_pub.version and st.recommendation_id=j.item->>'id'
    and old.item->>'slot'=j.item->>'slot' and old.item->>'proposedProductId'=j.item->>'proposedProductId' and old.item->>'id'<>j.item->>'id'
    and not exists(select 1 from concierge.receipts r where r.client_id=p_client_id and r.slot=j.item->>'slot' and r.product_id=j.item->>'proposedProductId');
  perform concierge.activate_service(p_client_id);
 end if;
 return result;
end $$;

create function concierge.quote_json(q concierge.quotes) returns jsonb language sql set search_path='' as $$
 select q.money||jsonb_build_object('id',q.id,'version',q.version,'publicationVersion',q.publication_version,'currency','USD','status',s.status,'shippingAddressVersion',q.shipping_address_version) from concierge.quote_states s where s.quote_id=q.id;
$$;
create function concierge.claim_json(c concierge.claims) returns jsonb language sql set search_path='' as $$
 select jsonb_build_object('id',c.id,'quoteId',q.id,'quoteVersion',q.version,'status',s.status,'evidenceId',c.evidence_id,'shippingAddressVersion',q.shipping_address_version,
  'serviceCents',(q.money->>'serviceCents')::bigint,'productCents',(q.money->>'productTotalCents')::bigint,'totalCents',(q.money->>'totalCents')::bigint)
 from concierge.quotes q join concierge.claim_states s on s.claim_id=c.id where q.id=c.quote_id;
$$;
create function public.concierge_payment_view(p_client_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.actor();v jsonb;begin
 perform concierge.access(p_client_id,case when u=p_client_id then null else 'view' end);
 perform 1 from concierge.cases where client_id=p_client_id for share;
 return jsonb_build_object('revision',coalesce((select revision from concierge.payment_heads where client_id=p_client_id),0),
  'quotes',(select coalesce(jsonb_agg(concierge.quote_json(q) order by version),'[]') from concierge.quotes q where client_id=p_client_id),
  'claims',(select coalesce(jsonb_agg(concierge.claim_json(c) order by created_at,id),'[]') from concierge.claims c where client_id=p_client_id),
  'shippingAddress',(select jsonb_build_object('version',version,'address',address) from concierge.shipping_addresses where client_id=p_client_id order by version desc limit 1),
  'shippingAddresses',(select coalesce(jsonb_agg(jsonb_build_object('version',version,'address',address) order by version),'[]') from concierge.shipping_addresses where client_id=p_client_id),
  'service',concierge.service_projection(p_client_id),'nextServicePeriod',concierge.invoice_period(p_client_id));
end $$;
-- Immutable confirmed quotes are the funding ledger. The common client lock
-- serializes every financial write; the key is recommendation identity across
-- publications, never a lifetime product/SKU key. Exact replay runs first.
create function concierge.require_unfunded(c uuid,items jsonb) returns void language plpgsql set search_path='' as $$ begin
 if exists(select 1 from concierge.payment_confirmations pc join concierge.quotes q on q.id=pc.quote_id
  cross join lateral jsonb_array_elements(q.money->'items')funded(item)
  join jsonb_array_elements(items)candidate(item) on candidate.item->>'recommendationId'=funded.item->>'recommendationId'
  where pc.client_id=c and pc.product_cents>0) then perform concierge.fail('product_already_funded');end if;
end $$;
create function concierge.validate_quote(c uuid,p jsonb) returns void language plpgsql set search_path='' as $$
declare r jsonb;published integer;service bigint;subtotal bigint:=0;products bigint;total bigint;tax bigint;shipping bigint;quantity bigint;unit bigint;line bigint;period jsonb;start_day date;end_day date;begin
 perform concierge.keys(p,array['publicationVersion','serviceCents','servicePeriod','items','productSubtotalCents','taxCents','shippingCents','productTotalCents','totalCents','shippingAddressVersion']);
 published:=concierge.integer(p,'publicationVersion');
 if published is distinct from (select published_version from concierge.cases where client_id=c) or published<0 then perform concierge.fail('publication_conflict');end if;
 service:=concierge.integer(p,'serviceCents');period:=p->'servicePeriod';
 if service=0 then if period is distinct from 'null'::jsonb then perform concierge.fail('invalid_input');end if;
 elsif service=10000 then
  start_day:=concierge.service_anchor(c);
  if start_day is null then if period is distinct from 'null'::jsonb then perform concierge.fail('invalid_input');end if;
  else perform concierge.keys(period,array['startOn','endOn']);end_day:=concierge.day(period,'endOn');
   if concierge.day(period,'startOn')<>start_day or end_day<>(start_day+interval '1 month')::date then perform concierge.fail('invalid_input');end if;end if;
  if exists(select 1 from concierge.service_periods where client_id=c and starts_on is null) then perform concierge.fail('request_conflict');end if;
 else perform concierge.fail('invalid_input');end if;
 if published=0 and (service<>10000 or p->'servicePeriod' is distinct from 'null'::jsonb) then perform concierge.fail('invalid_input');end if;
 if jsonb_typeof(p->'items') is distinct from 'array' then perform concierge.fail('invalid_input');end if;
 if jsonb_array_length(p->'items')>50 or (select count(distinct x->>'recommendationId') from jsonb_array_elements(p->'items')j(x))<>jsonb_array_length(p->'items') then perform concierge.fail('invalid_input');end if;
 for r in select value from jsonb_array_elements(p->'items') loop
  perform concierge.keys(r,array['recommendationId','quantity','unitPriceCents','lineTotalCents']);perform concierge.identifier(concierge.txt(r,'recommendationId',100));
  quantity:=concierge.integer(r,'quantity');unit:=concierge.integer(r,'unitPriceCents');line:=concierge.integer(r,'lineTotalCents');
  if quantity not between 1 and 100 or unit not between 1 and 100000000 or line<>quantity*unit then perform concierge.fail('invalid_input');end if;
  if not exists(select 1 from concierge.publications p cross join lateral jsonb_array_elements(p.recommendations)j(x)
   join concierge.item_states s on s.client_id=p.client_id and s.version=p.version and s.recommendation_id=x->>'id'
   where p.client_id=c and p.version=published and x->>'id'=r->>'recommendationId' and (x->>'priceCents')::bigint=unit and s.choice='approved'
   and not exists(select 1 from concierge.receipts o where o.client_id=c and o.slot=x->>'slot' and o.product_id=x->>'proposedProductId')) then perform concierge.fail('product_not_approved');end if;
  subtotal:=subtotal+line;
 end loop;
 tax:=concierge.integer(p,'taxCents');shipping:=concierge.integer(p,'shippingCents');products:=concierge.integer(p,'productTotalCents');total:=concierge.integer(p,'totalCents');
 if products>0 then
  if published=0 or concierge.integer(p,'shippingAddressVersion') is distinct from (select address_version from concierge.payment_heads where client_id=c) or not exists(select 1 from concierge.shipping_addresses a where a.client_id=c and a.version=(p->>'shippingAddressVersion')::integer and a.confirmed_by=c) then perform concierge.fail('publication_conflict');end if;
 elsif p->'shippingAddressVersion' is distinct from 'null'::jsonb then perform concierge.fail('invalid_input');end if;
 if subtotal<>concierge.integer(p,'productSubtotalCents') or tax not between 0 and 100000000 or shipping not between 0 and 100000000 or products<>subtotal+tax+shipping or products>100000000 or total<>service+products or total not between 1 and 100000000 or (jsonb_array_length(p->'items')=0 and (tax<>0 or shipping<>0)) then perform concierge.fail('invalid_input');end if;
 perform concierge.require_unfunded(c,p->'items');
end $$;
create function concierge.validate_address(a jsonb) returns void language plpgsql set search_path='' as $$ begin
 perform concierge.keys(a,array['recipientName','line1','line2','city','region','postalCode','countryCode']);
 perform concierge.txt(a,'recipientName',200);perform concierge.txt(a,'line1',200);perform concierge.txt(a,'line2',200,true);
 perform concierge.txt(a,'city',100);perform concierge.txt(a,'region',100);perform concierge.txt(a,'postalCode',20);
 if concierge.txt(a,'countryCode',2) !~ '^[A-Z]{2}$' then perform concierge.fail('invalid_input');end if;
end $$;
create function public.concierge_payment_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid;prior jsonb;h concierge.payment_heads;q concierge.quotes;cl concierge.claims;qs text;cs text;result jsonb;qid uuid;cid uuid;service bigint;products bigint;total bigint;start_day date;end_day date;reason text;begin
 if p_action='submit_claim' then u:=concierge.access(p_client_id,null,true);
 elsif p_action='issue_quote' then u:=concierge.access(p_client_id,'edit',true);
 elsif p_action='confirm_payment' then u:=concierge.access(p_client_id,'confirm',true);
 elsif p_action='reject_claim' then u:=concierge.access(p_client_id,'edit',true);
 elsif p_action='confirm_shipping_address' then u:=concierge.access(p_client_id,null,true);
 else perform concierge.fail('invalid_input');end if;
 prior:=concierge.workflow_begin(u,p_client_id,p_request_id,'payment',p_action,p_expected_revision,p_payload);if prior is not null then return prior;end if;
 insert into concierge.payment_heads(client_id) values(p_client_id) on conflict do nothing;
 select * into h from concierge.payment_heads where client_id=p_client_id for update;
 if h.revision<>p_expected_revision then perform concierge.fail('revision_conflict');end if;
 if p_action='confirm_shipping_address' then
  perform concierge.keys(p_payload,array['address']);perform concierge.validate_address(p_payload->'address');
  insert into concierge.shipping_addresses(client_id,version,address,confirmed_by) values(p_client_id,h.address_version+1,p_payload->'address',u);
  update concierge.quote_states st set status='superseded' from concierge.quotes qq where qq.id=st.quote_id and qq.client_id=p_client_id and st.status='payable' and (qq.money->>'productTotalCents')::bigint>0;
  update concierge.payment_heads set revision=revision+1,address_version=address_version+1 where client_id=p_client_id returning * into h;
  return concierge.workflow_finish(u,p_client_id,p_request_id,'payment',p_action,p_expected_revision,p_payload,jsonb_build_object('revision',h.revision,'operation',p_action,'addressVersion',h.address_version));
 elsif p_action='issue_quote' then
  perform concierge.validate_quote(p_client_id,p_payload);
  update concierge.quote_states s set status='superseded' from concierge.quotes qq where qq.id=s.quote_id and qq.client_id=p_client_id and s.status='payable';
  insert into concierge.quotes(client_id,version,publication_version,shipping_address_version,money,created_by) values(p_client_id,h.quote_version+1,(p_payload->>'publicationVersion')::integer,(p_payload->>'shippingAddressVersion')::integer,p_payload-'publicationVersion'-'shippingAddressVersion',u) returning * into q;
  insert into concierge.quote_states values(q.id,'payable');qid:=q.id;qs:='payable';
 else
  if p_action='submit_claim' then perform concierge.keys(p_payload,array['quoteId','quoteVersion','serviceCents','productCents','totalCents','shippingAddressVersion','evidenceId']);
  elsif p_action='confirm_payment' then perform concierge.keys(p_payload,array['quoteId','quoteVersion','serviceCents','productCents','totalCents','shippingAddressVersion','claimId','bankReceiptVerified']);
  else perform concierge.keys(p_payload,array['quoteId','quoteVersion','serviceCents','productCents','totalCents','shippingAddressVersion','claimId','reasonCode']);end if;
  qid:=(p_payload->>'quoteId')::uuid;
  select * into q from concierge.quotes where id=qid and client_id=p_client_id;
  if not found then perform concierge.fail('not_found');end if;
  select status into qs from concierge.quote_states where quote_id=q.id;
  if qs<>'payable' or q.version<>concierge.integer(p_payload,'quoteVersion') or q.version<>h.quote_version or ((q.money->>'productTotalCents')::bigint>0 and q.publication_version<>(select published_version from concierge.cases where client_id=p_client_id)) then perform concierge.fail('publication_conflict');end if;
  if (p_payload->>'shippingAddressVersion')::integer is distinct from q.shipping_address_version or (q.shipping_address_version is not null and q.shipping_address_version<>h.address_version) then perform concierge.fail('publication_conflict');end if;
  service:=concierge.integer(p_payload,'serviceCents');products:=concierge.integer(p_payload,'productCents');total:=concierge.integer(p_payload,'totalCents');
  if service<>(q.money->>'serviceCents')::bigint or products<>(q.money->>'productTotalCents')::bigint or total<>(q.money->>'totalCents')::bigint then perform concierge.fail('invalid_input');end if;
  if p_action in ('submit_claim','confirm_payment') then perform concierge.require_unfunded(p_client_id,q.money->'items');end if;
  if p_action='submit_claim' then
   if p_payload->'evidenceId' is distinct from 'null'::jsonb and not exists(select 1 from concierge.payment_evidence e where e.id=(p_payload->>'evidenceId')::uuid and e.client_id=p_client_id and e.quote_id=q.id and e.state='uploaded' and e.reserved_by=u) then perform concierge.fail('forbidden');end if;
   if exists(select 1 from concierge.claims c join concierge.claim_states s on s.claim_id=c.id where c.quote_id=q.id and s.status='submitted_unverified') then perform concierge.fail('request_conflict');end if;
   insert into concierge.claims(client_id,quote_id,evidence_id) values(p_client_id,q.id,(p_payload->>'evidenceId')::uuid) returning * into cl;
   cid:=cl.id;cs:='submitted_unverified';insert into concierge.claim_states values(cl.id,cs);
  else
   cid:=(p_payload->>'claimId')::uuid;
   select * into cl from concierge.claims where id=cid and client_id=p_client_id and quote_id=q.id;
   if not found then perform concierge.fail('not_found');end if;
   select status into cs from concierge.claim_states where claim_id=cl.id;
   if cs<>'submitted_unverified' then perform concierge.fail('request_conflict');end if;
   if p_action='confirm_payment' then
    if p_payload->'bankReceiptVerified' is distinct from 'true'::jsonb then perform concierge.fail('invalid_input');end if;
    if service>0 then
     if exists(select 1 from concierge.service_periods where client_id=p_client_id and starts_on is null) then perform concierge.fail('request_conflict');end if;
     if q.money->'servicePeriod' is distinct from 'null'::jsonb then
      start_day:=concierge.day(q.money->'servicePeriod','startOn');end_day:=concierge.day(q.money->'servicePeriod','endOn');
      if start_day is distinct from concierge.service_anchor(p_client_id) then perform concierge.fail('request_conflict');end if;
     else start_day:=concierge.service_anchor(p_client_id);if start_day is not null then end_day:=(start_day+interval '1 month')::date;end if;end if;
     if exists(select 1 from concierge.service_periods p where p.client_id=p_client_id and daterange(p.starts_on,p.ends_on,'[)')&&daterange(start_day,end_day,'[)')) then perform concierge.fail('request_conflict');end if;
    end if;
    insert into concierge.payment_confirmations(claim_id,quote_id,client_id,advisor_id,service_cents,product_cents,total_cents,service_start,service_end) values(cl.id,q.id,p_client_id,u,service,products,total,start_day,end_day);
    if service>0 then
     insert into concierge.service_periods(claim_id,client_id,starts_on,ends_on) values(cl.id,p_client_id,start_day,end_day);
     perform concierge.activate_service(p_client_id);
    end if;
    if products>0 then insert into concierge.product_orders(quote_id,status) values(q.id,'ready_to_purchase');end if;
    cs:='confirmed';update concierge.quote_states set status='settled' where quote_id=q.id;
   else
    reason:=concierge.txt(p_payload,'reasonCode',30);if reason not in ('not_received','amount_mismatch','duplicate_claim','wrong_recipient') then perform concierge.fail('invalid_input');end if;cs:='rejected';
   end if;
   update concierge.claim_states set status=cs where claim_id=cl.id;
  end if;
 end if;
 update concierge.payment_heads set revision=revision+1,quote_version=case when p_action='issue_quote' then q.version else quote_version end where client_id=p_client_id returning * into h;
 insert into concierge.payment_audit(client_id,actor_id,action,quote_id,claim_id,reason_code) values(p_client_id,u,p_action,q.id,cid,reason);
 result:=jsonb_build_object('revision',h.revision,'operation',p_action,'quoteId',q.id,'claimId',cid,'status',case when p_action='issue_quote' then 'payable' else cs end,
  'serviceUnlocked',p_action='confirm_payment' and service>0 and concierge.service_active(p_client_id),
  'serviceAccessStatus',case when p_action='confirm_payment' and service>0 then case when concierge.service_active(p_client_id) then 'active' when (concierge.service_projection(p_client_id)->>'status')='pending_publication' then 'pending_publication' end end,
  'productOrderStatus',case when p_action='confirm_payment' and products>0 then 'ready_to_purchase' end);
 return concierge.workflow_finish(u,p_client_id,p_request_id,'payment',p_action,p_expected_revision,p_payload,result);
exception when invalid_text_representation or numeric_value_out_of_range then perform concierge.fail('invalid_input');return null;
end $$;

create function concierge.evidence_descriptor(e concierge.payment_evidence) returns jsonb language sql set search_path='' as $$
 select jsonb_build_object('evidenceId',e.id,'clientId',e.client_id,'quoteId',e.quote_id,'quoteVersion',e.quote_version,
  'storagePath',e.path,'contentType',e.content_type,'sizeBytes',e.size_bytes,'sha256',e.sha256,'status',e.state);
$$;
create function public.concierge_payment_evidence_reserve(p_client_id uuid,p_request_id uuid,p_expected_revision bigint,p_quote_id uuid,p_quote_version integer,p_content_type text,p_size_bytes bigint,p_sha256 text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.access(p_client_id,null,true);payload jsonb;prior jsonb;q concierge.quotes;e concierge.payment_evidence;eid uuid:=gen_random_uuid();begin
 payload:=jsonb_build_object('quoteId',p_quote_id,'quoteVersion',p_quote_version,'contentType',p_content_type,'sizeBytes',p_size_bytes,'sha256',p_sha256);
 prior:=concierge.workflow_begin(u,p_client_id,p_request_id,'evidence','reserve',p_expected_revision,payload);if prior is not null then return prior;end if;
 if p_expected_revision is distinct from (select revision from concierge.payment_heads where client_id=p_client_id) then perform concierge.fail('revision_conflict');end if;
 select * into q from concierge.quotes where id=p_quote_id and client_id=p_client_id;
 if not found or q.version is distinct from p_quote_version or not exists(select 1 from concierge.quote_states s where s.quote_id=q.id and s.status='payable') or ((q.money->>'productTotalCents')::bigint>0 and q.publication_version<>(select published_version from concierge.cases where client_id=p_client_id)) then perform concierge.fail('publication_conflict');end if;
 if p_content_type is null or p_content_type not in ('image/jpeg','image/png') or p_size_bytes is null or p_size_bytes not between 1 and 5242880 or p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$' then perform concierge.fail('invalid_input');end if;
 insert into concierge.payment_evidence(id,client_id,quote_id,quote_version,reserved_by,path,content_type,size_bytes,sha256,state)
 values(eid,p_client_id,q.id,q.version,u,p_client_id::text||'/'||q.id::text||'/'||eid::text||case when p_content_type='image/jpeg' then '.jpg' else '.png' end,p_content_type,p_size_bytes,p_sha256,'reserved') returning * into e;
 return concierge.workflow_finish(u,p_client_id,p_request_id,'evidence','reserve',p_expected_revision,payload,concierge.evidence_descriptor(e));
end $$;
create function concierge.object_complete(bucket text,path text,mime text,bytes bigint) returns void language plpgsql set search_path='' as $$ begin
 perform 1 from storage.objects o where o.bucket_id=bucket and o.name=path and (o.metadata->>'size')::bigint=bytes and coalesce(o.metadata->>'mimetype',o.metadata->>'contentType')=mime for share;
 if not found then perform concierge.fail('upload_incomplete');end if;
exception when invalid_text_representation or numeric_value_out_of_range then perform concierge.fail('upload_incomplete');end $$;
create function public.concierge_payment_evidence_commit(p_evidence_id uuid,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.actor();e concierge.payment_evidence;prior jsonb;payload jsonb:=jsonb_build_object('evidenceId',p_evidence_id);begin
 select * into e from concierge.payment_evidence where id=p_evidence_id;if not found then perform concierge.fail('not_found');end if;
 perform concierge.access(e.client_id,null,true);if e.reserved_by<>u then perform concierge.fail('forbidden');end if;
 prior:=concierge.workflow_begin(u,e.client_id,p_request_id,'evidence','complete',0,payload);if prior is not null then return prior;end if;
 if not exists(select 1 from concierge.quotes q join concierge.quote_states s on s.quote_id=q.id join concierge.cases c on c.client_id=q.client_id where q.id=e.quote_id and s.status='payable' and ((q.money->>'productTotalCents')::bigint=0 or q.publication_version=c.published_version)) then perform concierge.fail('publication_conflict');end if;
 perform concierge.object_complete('concierge-payment-evidence',e.path,e.content_type,e.size_bytes);
 if e.state<>'reserved' then perform concierge.fail('request_conflict');end if;
 update concierge.payment_evidence set state='uploaded' where id=e.id;
 return concierge.workflow_finish(u,e.client_id,p_request_id,'evidence','complete',0,payload,jsonb_build_object('evidenceId',e.id,'quoteId',e.quote_id,'quoteVersion',e.quote_version,'status','uploaded_unverified'));
end $$;
create function public.concierge_payment_evidence_access(p_evidence_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.actor();e concierge.payment_evidence;begin
 select * into e from concierge.payment_evidence where id=p_evidence_id;if not found then perform concierge.fail('not_found');end if;
 perform concierge.access(e.client_id,case when u=e.client_id then null else 'view' end);
 if e.state<>'uploaded' then perform concierge.fail('upload_incomplete');end if;
 perform concierge.object_complete('concierge-payment-evidence',e.path,e.content_type,e.size_bytes);return concierge.evidence_descriptor(e);
end $$;

create function concierge.checkin_projection(c uuid,advisor boolean) returns jsonb language plpgsql set search_path='' as $$
declare v jsonb;begin
 v:=jsonb_build_object('revision',coalesce((select revision from concierge.checkin_heads where client_id=c),0),
  'nextCheckinOn',(select next_checkin_on from concierge.checkin_heads where client_id=c),
  'reports',(select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'submittedAt',r.submitted_at,'comfort',r.comfort,'consistency',r.consistency,'changes',r.changes,
   'photos',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'angle',p.angle) order by p.angle),'[]') from concierge.report_photos a join concierge.checkin_photos p on p.id=a.photo_id where a.report_id=r.id)) order by r.submitted_at,r.id),'[]') from concierge.checkin_reports r where client_id=c));
 if advisor then return jsonb_build_object('client',v,'meetingNotes',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'checkinId',report_id,'note',note,'createdAt',created_at) order by created_at,id),'[]') from concierge.checkin_notes where client_id=c));end if;
 return v;
end $$;
create function public.concierge_checkin_read(p_client_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 perform concierge.access(p_client_id);perform 1 from concierge.cases where client_id=p_client_id for share;return concierge.checkin_projection(p_client_id,false);
end $$;
create function public.concierge_checkin_advisor_read(p_client_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 perform concierge.access(p_client_id,'view');perform 1 from concierge.cases where client_id=p_client_id for share;return concierge.checkin_projection(p_client_id,true);
end $$;
create function concierge.photo_reservation_immutable() returns trigger language plpgsql set search_path='' as $$ begin
 if (to_jsonb(new)-'state') is distinct from (to_jsonb(old)-'state') or old.state<>'pending' or new.state<>'complete' then perform concierge.fail('immutable');end if;
 return new;
end $$;
create trigger checkin_photo_reservation_immutable before update on concierge.checkin_photos for each row execute function concierge.photo_reservation_immutable();
create function concierge.photo_descriptor(p concierge.checkin_photos,revision bigint) returns jsonb language sql set search_path='' as $$
 select jsonb_build_object('revision',revision,'photoId',p.id,'ownerId',p.client_id,'bucket','concierge-checkin-photos','path',p.path,
  'angle',p.angle,'contentType',p.content_type,'sizeBytes',p.size_bytes,'sha256',p.sha256,'state',p.state);
$$;
create function public.concierge_checkin_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid;prior jsonb;h concierge.checkin_heads;p concierge.checkin_photos;pid uuid;rid uuid;photo_ids uuid[];g text;n text;changes text;angle text;mime text;size bigint;digest text;next_day date;result jsonb;begin
 if p_action in ('submit_report','reserve_photo','complete_photo') then u:=concierge.access(p_client_id,null,true);perform concierge.checkin_guard(p_client_id);
 elsif p_action in ('set_next_checkin','add_meeting_note') then u:=concierge.access(p_client_id,'edit',true);
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
create function public.concierge_checkin_photo_authorize(p_client_id uuid,p_photo_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.actor();p concierge.checkin_photos;begin
 perform concierge.access(p_client_id,case when u=p_client_id then null else 'view' end);
 select * into p from concierge.checkin_photos where id=p_photo_id and client_id=p_client_id and state='complete';if not found then perform concierge.fail('not_found');end if;
 perform concierge.object_complete('concierge-checkin-photos',p.path,p.content_type,p.size_bytes);
 return concierge.photo_descriptor(p,(select revision from concierge.checkin_heads where client_id=p_client_id));
end $$;

-- Service-only Storage I/O still passes a DB deletion fence: an already
-- authorized HTTP upload cannot insert its object after deletion inventory.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('concierge-payment-evidence','concierge-payment-evidence',false,5242880,array['image/jpeg','image/png']),
 ('concierge-checkin-photos','concierge-checkin-photos',false,5242880,array['image/jpeg','image/png','image/webp']);
create function concierge.storage_fence() returns trigger language plpgsql security definer set search_path='' as $$
declare c uuid;mime text;bytes bigint;begin
 if tg_op='UPDATE' and old.bucket_id in ('concierge-payment-evidence','concierge-checkin-photos') then perform concierge.fail('immutable');end if;
 if new.bucket_id not in ('concierge-payment-evidence','concierge-checkin-photos') then return new;end if;
 if tg_op='UPDATE' then perform concierge.fail('immutable');end if;
 begin c:=split_part(new.name,'/',1)::uuid;exception when invalid_text_representation then perform concierge.fail('forbidden');end;
 perform concierge.target(c);
 perform 1 from concierge.enrollments where client_id=c and status='active' for share;if not found then perform concierge.fail('forbidden');end if;
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||c::text,0));
 if new.bucket_id='concierge-payment-evidence' then
  select e.client_id,e.content_type,e.size_bytes into c,mime,bytes from concierge.payment_evidence e join concierge.quotes q on q.id=e.quote_id join concierge.quote_states s on s.quote_id=q.id join concierge.cases cs on cs.client_id=e.client_id
  where e.path=new.name and e.state='reserved' and s.status='payable' and ((q.money->>'productTotalCents')::bigint=0 or q.publication_version=cs.published_version) for share of e,q,s,cs;
 else
  select client_id,content_type,size_bytes into c,mime,bytes from concierge.checkin_photos where path=new.name and state='pending' for share;
 end if;
 if c is null then perform concierge.fail('forbidden');end if;
 perform concierge.target(c);
 perform 1 from concierge.enrollments where client_id=c and status='active' for share;if not found then perform concierge.fail('forbidden');end if;
 if new.bucket_id='concierge-checkin-photos' then perform concierge.checkin_guard(c);end if;
 if (new.metadata->>'size')::bigint is distinct from bytes or coalesce(new.metadata->>'mimetype',new.metadata->>'contentType') is distinct from mime then perform concierge.fail('invalid_input');end if;
 return new;
end $$;
create trigger concierge_private_storage_fence before insert or update on storage.objects for each row execute function concierge.storage_fence();

-- No raw customer reads/list/signs/writes. Restrictive fences also defeat any
-- broader existing authenticated Storage policy for these new private buckets.
create policy concierge_private_storage_deny on storage.objects as restrictive for all to anon,authenticated
 using(bucket_id not in ('concierge-payment-evidence','concierge-checkin-photos'))
 with check(bucket_id not in ('concierge-payment-evidence','concierge-checkin-photos'));
do $$ declare t text;f record;begin
 foreach t in array array['enrollments','meeting_notes','shipping_addresses','service_periods','payment_heads','quotes','quote_states','payment_evidence','claims','claim_states','payment_confirmations','entitled_publications','product_orders','payment_audit','checkin_heads','checkin_photos','checkin_reports','report_photos','checkin_notes','workflow_requests'] loop
  execute format('alter table concierge.%I enable row level security',t);
  execute format('revoke all on concierge.%I from public,anon,authenticated,service_role',t);
 end loop;
 foreach t in array array['meeting_notes','shipping_addresses','quotes','claims','payment_confirmations','entitled_publications','product_orders','payment_audit','checkin_reports','checkin_notes','workflow_requests'] loop
  execute format('create trigger %I before update on concierge.%I for each row execute function concierge.immutable()',t||'_immutable',t);
 end loop;
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'concierge\_%' escape '\' loop
  execute format('revoke all on function %s from public,anon,service_role',f.signature);
  execute format('grant execute on function %s to authenticated',f.signature);
 end loop;
end $$;
revoke all on all functions in schema concierge from public,anon,authenticated,service_role;
revoke all on all sequences in schema concierge from public,anon,authenticated,service_role;
commit;
