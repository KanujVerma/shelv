-- Additive user-selected manual methods. New channels remain disabled pending exact release configuration review.
begin;
create table concierge.payment_recipients(id text not null,version integer not null check(version>0),recipient jsonb not null,primary key(id,version));
create table concierge.payment_recipient_status(recipient_id text not null,recipient_version integer not null,enabled boolean not null default false,allow_service boolean not null default false,allow_products boolean not null default false,primary key(recipient_id,recipient_version),foreign key(recipient_id,recipient_version) references concierge.payment_recipients(id,version));
insert into concierge.payment_recipients values
 ('zelle-approved',1,'{"method":"zelle","name":"Kanuj Verma","email":"kanuj.verma12@gmail.com","phone":"(925)719-1334"}'),
 ('cash-app-kanuj',1,'{"method":"cash_app","name":"Kanuj Verma","cashtag":"$KanujVerma"}'),
 ('apple-cash-kanuj',1,'{"method":"apple_cash","name":"Kanuj Verma","phone":"(925)719-1334"}');
insert into concierge.payment_recipient_status values ('zelle-approved',1,true,true,true),('cash-app-kanuj',1,false,true,true),('apple-cash-kanuj',1,false,true,true);
create table concierge.payment_contract_quotes(quote_id uuid primary key references concierge.quotes on delete cascade,client_id uuid not null references concierge.cases on delete cascade);
create table concierge.payment_quote_options(id uuid primary key default gen_random_uuid(),client_id uuid not null,quote_id uuid not null,recipient_id text not null,recipient_version integer not null,recipient jsonb not null,unique(client_id,quote_id,id),foreign key(client_id,quote_id) references concierge.quotes(client_id,id) on delete cascade,foreign key(recipient_id,recipient_version) references concierge.payment_recipients(id,version));
create table concierge.payment_claim_options(claim_id uuid primary key references concierge.claims on delete cascade,client_id uuid not null,quote_id uuid not null,option_id uuid not null,foreign key(client_id,quote_id,option_id) references concierge.payment_quote_options(client_id,quote_id,id) on delete cascade);
create table concierge.payment_evidence_options(evidence_id uuid primary key references concierge.payment_evidence on delete cascade,client_id uuid not null,quote_id uuid not null,option_id uuid not null,foreign key(client_id,quote_id,option_id) references concierge.payment_quote_options(client_id,quote_id,id) on delete cascade);
create table concierge.payment_v2_requests(actor_id uuid not null,request_id uuid not null,client_id uuid not null references concierge.cases on delete cascade,fingerprint bytea not null,result jsonb not null,primary key(actor_id,request_id),foreign key(actor_id,request_id) references concierge.workflow_requests(actor_id,request_id) on delete cascade);
do $$declare t text;begin
 foreach t in array array['payment_recipients','payment_recipient_status','payment_contract_quotes','payment_quote_options','payment_claim_options','payment_evidence_options','payment_v2_requests'] loop
  execute format('alter table concierge.%I enable row level security',t);execute format('revoke all on table concierge.%I from public,anon,authenticated,service_role',t);
  if t<>'payment_recipient_status' then execute format('create trigger %I before update on concierge.%I for each row execute function concierge.immutable()',t||'_immutable',t);end if;
 end loop;
end $$;

alter function public.concierge_payment_view(uuid) set schema concierge;
alter function concierge.concierge_payment_view(uuid) rename to payment_view_v1_core;
alter function public.concierge_payment_write(uuid,text,bigint,uuid,jsonb) set schema concierge;
alter function concierge.concierge_payment_write(uuid,text,bigint,uuid,jsonb) rename to payment_write_v1_core;
alter function public.concierge_payment_evidence_reserve(uuid,uuid,bigint,uuid,integer,text,bigint,text) set schema concierge;
alter function concierge.concierge_payment_evidence_reserve(uuid,uuid,bigint,uuid,integer,text,bigint,text) rename to payment_evidence_reserve_v1_core;
alter function public.concierge_payment_evidence_commit(uuid,uuid) set schema concierge;
alter function concierge.concierge_payment_evidence_commit(uuid,uuid) rename to payment_evidence_commit_v1_core;
alter function public.concierge_payment_evidence_access(uuid) set schema concierge;
alter function concierge.concierge_payment_evidence_access(uuid) rename to payment_evidence_access_v1_core;

create function concierge.payment_action_actor(c uuid,action text) returns uuid language plpgsql set search_path='' as $$begin
 if action in ('submit_claim','confirm_shipping_address') then return concierge.access(c,null,true);
 elsif action='confirm_payment' then return concierge.access(c,'confirm',true);
 elsif action in ('issue_quote','reject_claim') then return concierge.access(c,'edit',true);
 else perform concierge.fail('invalid_input');return null;end if;
end $$;
create function concierge.payment_option_available(o concierge.payment_quote_options) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from concierge.payment_recipient_status s join concierge.quotes q on q.id=o.quote_id where s.recipient_id=o.recipient_id and s.recipient_version=o.recipient_version and s.enabled and ((q.money->>'serviceCents')::bigint=0 or s.allow_service) and ((q.money->>'productTotalCents')::bigint=0 or s.allow_products));
$$;
create function concierge.payment_option(c uuid,q uuid,o uuid,available boolean) returns concierge.payment_quote_options language plpgsql set search_path='' as $$declare r concierge.payment_quote_options;begin
 select * into r from concierge.payment_quote_options where id=o and client_id=c and quote_id=q;
 if not found then perform concierge.fail('payment_method_conflict');end if;
 perform 1 from concierge.payment_recipient_status where recipient_id=r.recipient_id and recipient_version=r.recipient_version for share;
 if available and not concierge.payment_option_available(r) then perform concierge.fail('payment_method_unavailable');end if;return r;
end $$;
create function public.concierge_payment_view(p_client_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare u uuid:=concierge.actor();begin
 perform concierge.access(p_client_id,case when u=p_client_id then null else 'view' end);
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));
 if exists(select 1 from concierge.payment_contract_quotes where client_id=p_client_id) then perform concierge.fail('payment_contract_upgrade_required');end if;
 return concierge.payment_view_v1_core(p_client_id);
end $$;
create function public.concierge_payment_view_v2(p_client_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare v jsonb;begin
 v:=concierge.payment_view_v1_core(p_client_id);
 return v||jsonb_build_object('schemaVersion',2,
 'quotes',(select coalesce(jsonb_agg(x||jsonb_build_object('contractVersion',case when cq.quote_id is null then 1 else 2 end,'paymentOptions',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'recipientVersion',o.recipient_version,'recipient',o.recipient,'available',concierge.payment_option_available(o)) order by o.recipient_id,o.id),'[]') from concierge.payment_quote_options o where o.quote_id=(x->>'id')::uuid and o.client_id=p_client_id)) order by (x->>'version')::integer),'[]') from jsonb_array_elements(v->'quotes')j(x) left join concierge.payment_contract_quotes cq on cq.quote_id=(x->>'id')::uuid),
 'claims',(select coalesce(jsonb_agg(x||jsonb_build_object('paymentOptionId',o.option_id)),'[]') from jsonb_array_elements(v->'claims')j(x) left join concierge.payment_claim_options o on o.claim_id=(x->>'id')::uuid));
end $$;
create function public.concierge_payment_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare u uuid:=concierge.payment_action_actor(p_client_id,p_action);begin
 perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||u::text||':'||p_request_id::text,0));perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));
 if exists(select 1 from concierge.payment_v2_requests where actor_id=u and request_id=p_request_id) or exists(select 1 from concierge.payment_contract_quotes where client_id=p_client_id and quote_id=(p_payload->>'quoteId')::uuid) then perform concierge.fail('payment_contract_upgrade_required');end if;
 return concierge.payment_write_v1_core(p_client_id,p_action,p_expected_revision,p_request_id,p_payload);
exception when invalid_text_representation then perform concierge.fail('invalid_input');return null;end $$;
create function public.concierge_payment_write_v2(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.payment_action_actor(p_client_id,p_action);fp bytea;prior concierge.payment_v2_requests;payload jsonb:=p_payload;result jsonb;qid uuid;oid uuid;r concierge.payment_quote_options;rec record;snapshots jsonb:='[]';snap jsonb;begin
 if p_action not in ('issue_quote','submit_claim','confirm_payment','reject_claim') or p_request_id is null or p_expected_revision is null or p_expected_revision not between 0 and 9007199254740991 or jsonb_typeof(p_payload) is distinct from 'object' or pg_column_size(p_payload)>100000 then perform concierge.fail('invalid_input');end if;
 perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||u::text||':'||p_request_id::text,0));perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));
 fp:=concierge.workflow_fingerprint(p_client_id,'payment-v2',p_action,p_expected_revision,p_payload);
 select * into prior from concierge.payment_v2_requests where actor_id=u and request_id=p_request_id;
 if found then if prior.client_id<>p_client_id or prior.fingerprint<>fp then perform concierge.fail('request_conflict');end if;return prior.result;end if;
 if exists(select 1 from concierge.workflow_requests where actor_id=u and request_id=p_request_id) then perform concierge.fail('request_conflict');end if;
 if p_action='issue_quote' then
  for rec in select d.* from concierge.payment_recipients d join concierge.payment_recipient_status s on s.recipient_id=d.id and s.recipient_version=d.version where s.enabled and (concierge.integer(p_payload,'serviceCents')=0 or s.allow_service) and (concierge.integer(p_payload,'productTotalCents')=0 or s.allow_products) order by d.id for share of s,d loop
   snapshots:=snapshots||jsonb_build_array(jsonb_build_object('id',rec.id,'version',rec.version,'recipient',rec.recipient));
  end loop;
  if jsonb_array_length(snapshots)=0 then perform concierge.fail('payment_method_unavailable');end if;
 else
  if p_action='submit_claim' then perform concierge.keys(p_payload,array['quoteId','quoteVersion','serviceCents','productCents','totalCents','shippingAddressVersion','evidenceId','paymentOptionId']);
  elsif p_action='confirm_payment' then perform concierge.keys(p_payload,array['quoteId','quoteVersion','serviceCents','productCents','totalCents','shippingAddressVersion','claimId','receiptVerified','paymentOptionId']);
  else perform concierge.keys(p_payload,array['quoteId','quoteVersion','serviceCents','productCents','totalCents','shippingAddressVersion','claimId','reasonCode','paymentOptionId']);end if;
  qid:=(p_payload->>'quoteId')::uuid;oid:=(p_payload->>'paymentOptionId')::uuid;r:=concierge.payment_option(p_client_id,qid,oid,p_action='submit_claim');payload:=p_payload-'paymentOptionId';
  if p_action='submit_claim' and p_payload->'evidenceId' is distinct from 'null'::jsonb and not exists(select 1 from concierge.payment_evidence_options e where e.evidence_id=(p_payload->>'evidenceId')::uuid and e.option_id=oid and e.client_id=p_client_id and e.quote_id=qid) then perform concierge.fail('payment_method_conflict');end if;
  if p_action in ('confirm_payment','reject_claim') and not exists(select 1 from concierge.payment_claim_options c where c.claim_id=(p_payload->>'claimId')::uuid and c.option_id=oid and c.client_id=p_client_id and c.quote_id=qid) then perform concierge.fail('payment_method_conflict');end if;
  if p_action='confirm_payment' then if p_payload->'receiptVerified' is distinct from 'true'::jsonb then perform concierge.fail('invalid_input');end if;payload:=(payload-'receiptVerified')||jsonb_build_object('bankReceiptVerified',true);end if;
 end if;
 result:=concierge.payment_write_v1_core(p_client_id,p_action,p_expected_revision,p_request_id,payload);qid:=(result->>'quoteId')::uuid;
 if p_action='issue_quote' then
  insert into concierge.payment_contract_quotes values(qid,p_client_id);
  for snap in select value from jsonb_array_elements(snapshots) loop insert into concierge.payment_quote_options(client_id,quote_id,recipient_id,recipient_version,recipient) values(p_client_id,qid,snap->>'id',(snap->>'version')::integer,snap->'recipient');end loop;
 elsif p_action='submit_claim' then insert into concierge.payment_claim_options values((result->>'claimId')::uuid,p_client_id,qid,oid);end if;
 result:=result||jsonb_build_object('schemaVersion',2,'paymentOptionId',oid);
 insert into concierge.payment_v2_requests values(u,p_request_id,p_client_id,fp,result);return result;
exception when invalid_text_representation or numeric_value_out_of_range then perform concierge.fail('invalid_input');return null;end $$;

create function public.concierge_payment_evidence_reserve(p_client_id uuid,p_request_id uuid,p_expected_revision bigint,p_quote_id uuid,p_quote_version integer,p_content_type text,p_size_bytes bigint,p_sha256 text) returns jsonb language plpgsql security definer set search_path='' as $$declare u uuid:=concierge.access(p_client_id,null,true);begin
 perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||u::text||':'||p_request_id::text,0));perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));
 if exists(select 1 from concierge.payment_contract_quotes where quote_id=p_quote_id and client_id=p_client_id) then perform concierge.fail('payment_contract_upgrade_required');end if;
 return concierge.payment_evidence_reserve_v1_core(p_client_id,p_request_id,p_expected_revision,p_quote_id,p_quote_version,p_content_type,p_size_bytes,p_sha256);end $$;
create function public.concierge_payment_evidence_reserve_v2(p_client_id uuid,p_request_id uuid,p_expected_revision bigint,p_quote_id uuid,p_quote_version integer,p_content_type text,p_size_bytes bigint,p_sha256 text,p_payment_option_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare u uuid:=concierge.access(p_client_id,null,true);result jsonb;prior uuid;begin
 perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||u::text||':'||p_request_id::text,0));perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));
 perform concierge.payment_option(p_client_id,p_quote_id,p_payment_option_id,false);
 result:=concierge.payment_evidence_reserve_v1_core(p_client_id,p_request_id,p_expected_revision,p_quote_id,p_quote_version,p_content_type,p_size_bytes,p_sha256);
 select option_id into prior from concierge.payment_evidence_options where evidence_id=(result->>'evidenceId')::uuid;
 if found then if prior<>p_payment_option_id then perform concierge.fail('request_conflict');end if;
 else perform concierge.payment_option(p_client_id,p_quote_id,p_payment_option_id,true);insert into concierge.payment_evidence_options values((result->>'evidenceId')::uuid,p_client_id,p_quote_id,p_payment_option_id);end if;
 return result||jsonb_build_object('schemaVersion',2,'paymentOptionId',p_payment_option_id);end $$;
create function public.concierge_payment_evidence_commit(p_evidence_id uuid,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare u uuid:=concierge.actor();c uuid;begin
 select client_id into c from concierge.payment_evidence where id=p_evidence_id;if c is null then perform concierge.fail('not_found');end if;perform concierge.access(c,null,true);
 perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||u::text||':'||p_request_id::text,0));perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||c::text,0));
 if exists(select 1 from concierge.payment_evidence_options where evidence_id=p_evidence_id) then perform concierge.fail('payment_contract_upgrade_required');end if;return concierge.payment_evidence_commit_v1_core(p_evidence_id,p_request_id);end $$;
create function public.concierge_payment_evidence_commit_v2(p_evidence_id uuid,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare result jsonb;oid uuid;begin
 result:=concierge.payment_evidence_commit_v1_core(p_evidence_id,p_request_id);select option_id into oid from concierge.payment_evidence_options where evidence_id=p_evidence_id;if oid is null then perform concierge.fail('payment_method_conflict');end if;return result||jsonb_build_object('schemaVersion',2,'paymentOptionId',oid);end $$;
create function public.concierge_payment_evidence_access(p_evidence_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare u uuid:=concierge.actor();c uuid;begin
 select client_id into c from concierge.payment_evidence where id=p_evidence_id;if c is null then perform concierge.fail('not_found');end if;perform concierge.access(c,case when u=c then null else 'view' end);
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||c::text,0));
 if exists(select 1 from concierge.payment_evidence_options where evidence_id=p_evidence_id) then perform concierge.fail('payment_contract_upgrade_required');end if;return concierge.payment_evidence_access_v1_core(p_evidence_id);end $$;
create function public.concierge_payment_evidence_access_v2(p_evidence_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare result jsonb;oid uuid;begin
 result:=concierge.payment_evidence_access_v1_core(p_evidence_id);select option_id into oid from concierge.payment_evidence_options where evidence_id=p_evidence_id;return result||jsonb_build_object('schemaVersion',2,'paymentOptionId',oid);end $$;

revoke all on all functions in schema concierge from public,anon,authenticated,service_role;
do $$declare f record;begin for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'concierge_payment_%' loop execute format('revoke all on function %s from public,anon,service_role',f.signature);execute format('grant execute on function %s to authenticated',f.signature);end loop;end $$;
create or replace function public.concierge_advisor_preview_v2(
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
  'payments',public.concierge_payment_view_v2(p_client_id),
  'checkins',concierge.checkin_projection(p_client_id,false));
end $$;

commit;
