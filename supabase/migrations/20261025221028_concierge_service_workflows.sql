-- Production service workflow proposal. No users, grants, money movement or orders are created by migration.
begin;
create table concierge.service_heads(client_id uuid primary key references concierge.cases on delete cascade,revision bigint not null default 0 check(revision between 0 and 9007199254740991));
create table concierge.service_reviews(id uuid primary key default gen_random_uuid(),client_id uuid not null references concierge.cases on delete cascade,data jsonb not null,actor_id uuid not null,recorded_at timestamptz not null default now(),unique(client_id,id));
create table concierge.service_review_private(review_id uuid primary key references concierge.service_reviews on delete cascade,note text not null);
create table concierge.instruction_drafts(id uuid primary key default gen_random_uuid(),client_id uuid not null references concierge.cases on delete cascade,data jsonb not null,source jsonb not null,original_started_on date,actor_id uuid not null,created_at timestamptz not null default now(),unique(client_id,id));
create table concierge.instruction_publications(id uuid primary key default gen_random_uuid(),client_id uuid not null, draft_id uuid not null unique,version bigint not null,actor_id uuid not null,created_at timestamptz not null default now(),foreign key(client_id,draft_id) references concierge.instruction_drafts(client_id,id) on delete cascade);
create table concierge.retail_purchases(id uuid primary key default gen_random_uuid(),client_id uuid not null references concierge.cases on delete cascade,data jsonb not null,actor_id uuid not null,recorded_at timestamptz not null default now(),unique(client_id,id));
create table concierge.retail_purchase_private(purchase_id uuid primary key references concierge.retail_purchases on delete cascade,order_reference text not null,receipt_reference text not null);
create table concierge.return_cases(id uuid primary key default gen_random_uuid(),client_id uuid not null,purchase_id uuid not null,data jsonb not null,actor_id uuid not null,requested_at timestamptz not null default now(),unique(client_id,id),foreign key(client_id,purchase_id) references concierge.retail_purchases(client_id,id) on delete cascade);
create table concierge.return_events(id uuid primary key default gen_random_uuid(),client_id uuid not null,return_id uuid not null,data jsonb not null,actor_id uuid not null,recorded_at timestamptz not null default now(),sequence bigint generated always as identity,foreign key(client_id,return_id) references concierge.return_cases(client_id,id) on delete cascade);
create table concierge.return_event_private(event_id uuid primary key references concierge.return_events on delete cascade,reference text not null);
create table concierge.service_cancellations(id uuid primary key default gen_random_uuid(),client_id uuid not null unique references concierge.cases on delete cascade,data jsonb not null,actor_id uuid not null,recorded_at timestamptz not null default now());
create function concierge.service_payload_shape(action text) returns jsonb language sql immutable set search_path='' as $$
 select (
 $shape${"record_review":{"type":"object","fields":{"channel":{"type":"enum","values":["text","call","video","in_person"]},"occurredOn":{"type":"date"},"summary":{"type":"text","max":4000,"empty":false},"reportedUse":{"type":"text","max":4000,"empty":false},"decision":{"type":"text","max":4000,"empty":false},"nextReviewOn":{"type":"date","nullable":true},"privateNote":{"type":"text","max":4000,"empty":true}}},"save_instruction_draft":{"type":"object","fields":{"slot":{"type":"identifier"},"productId":{"type":"identifier"},"planVersion":{"type":"integer","min":1,"max":9007199254740991},"baseInstructionVersion":{"type":"integer","min":0,"max":9007199254740991},"usage":{"type":"object","fields":{"periods":{"type":"array","item":{"type":"enum","values":["morning","evening"]},"min":1,"max":2,"unique":true},"order":{"type":"integer","min":1,"max":50},"short":{"type":"object","fields":{"morning":{"type":"text","max":2000,"empty":false,"nullable":true},"evening":{"type":"text","max":2000,"empty":false,"nullable":true}}},"instructions":{"type":"array","item":{"type":"text","max":2000,"empty":false},"min":1,"max":12}}},"reason":{"type":"text","max":4000,"empty":false},"reviewId":{"type":"text","max":36,"empty":false,"nullable":true},"effectiveOn":{"type":"date"}}},"publish_instruction_revision":{"type":"object","fields":{"draftId":{"type":"text","max":36,"empty":false}}},"record_purchase":{"type":"object","fields":{"quoteId":{"type":"text","max":36,"empty":false,"nullable":true},"recommendationId":{"type":"identifier","nullable":true},"retailer":{"type":"text","max":200,"empty":false},"seller":{"type":"text","max":200,"empty":false},"productId":{"type":"identifier"},"productName":{"type":"text","max":200,"empty":false},"quantity":{"type":"integer","min":1,"max":100},"unitPriceCents":{"type":"integer","min":1,"max":100000000},"taxCents":{"type":"integer","min":0,"max":100000000},"shippingCents":{"type":"integer","min":0,"max":100000000},"purchasedOn":{"type":"date"},"deliveredOn":{"type":"date","nullable":true},"policy":{"type":"object","fields":{"checkedOn":{"type":"date"},"url":{"type":"url"},"summary":{"type":"text","max":2000,"empty":false},"openedAllowed":{"type":"boolean","nullable":true},"finalSale":{"type":"boolean"},"returnBy":{"type":"date","nullable":true},"shipBy":{"type":"date","nullable":true},"returnCostCents":{"type":"integer","min":0,"max":100000000}}},"orderReference":{"type":"text","max":1000,"empty":false},"receiptReference":{"type":"text","max":1000,"empty":false},"termsDisclosed":{"type":"enum","values":[true]}}},"request_return":{"type":"object","fields":{"purchaseId":{"type":"text","max":36,"empty":false},"quantity":{"type":"integer","min":1,"max":100},"reason":{"type":"text","max":2000,"empty":false},"condition":{"type":"enum","values":["unopened","opened","used","damaged"]}}},"record_return_event":{"type":"object","fields":{"returnId":{"type":"text","max":36,"empty":false},"status":{"type":"enum","values":["requested","reviewing","authorized","declined","awaiting_return","in_transit","retailer_reviewing","retailer_funds_received","client_repaid"]},"note":{"type":"text","max":4000,"empty":false},"expectedRefundCents":{"type":"integer","min":0,"max":100000000,"nullable":true},"retailerRefundCents":{"type":"integer","min":0,"max":100000000,"nullable":true},"clientRepaidCents":{"type":"integer","min":0,"max":100000000,"nullable":true},"privateReference":{"type":"text","max":1000,"empty":true},"policyCheckedOn":{"type":"date","nullable":true}}},"cancel_service":{"type":"object","fields":{"kind":{"type":"enum","values":["period_end","early_departure"]},"supportEndsOn":{"type":"date"},"reason":{"type":"text","max":2000,"empty":false},"confirmedWithClient":{"type":"enum","values":[true]}}}}$shape$::jsonb)->action
$$;
-- Explicit support end is independent of the payment ledger. Renewal requests
-- stop immediately, while ordinary paid access lasts through its exclusive end.
alter function concierge.service_active(uuid) rename to service_active_before_cancellation;
create function concierge.service_active(c uuid) returns boolean language sql set search_path='' as $$
 select concierge.service_active_before_cancellation(c) and not exists(select 1 from concierge.service_cancellations x where x.client_id=c and (x.data->>'supportEndsOn')::date<=(now() at time zone 'America/Chicago')::date)
$$;
alter function concierge.invoice_period(uuid) rename to invoice_period_before_cancellation;
create function concierge.invoice_period(c uuid) returns jsonb language sql set search_path='' as $$
 select case when exists(select 1 from concierge.service_cancellations where client_id=c) then null else concierge.invoice_period_before_cancellation(c) end
$$;
alter function concierge.service_projection(uuid) rename to service_projection_before_cancellation;
create function concierge.service_projection(c uuid) returns jsonb language plpgsql set search_path='' as $$declare v jsonb:=concierge.service_projection_before_cancellation(c);x concierge.service_cancellations;begin
 select * into x from concierge.service_cancellations where client_id=c;
 if found then v:=v||jsonb_build_object('renewalSuppressed',true,'supportEndsOn',x.data->>'supportEndsOn');if not concierge.service_active(c) then v:=v||jsonb_build_object('status','cancelled');end if;end if;return v;
end $$;
-- Covers both legacy and v2 payment wrappers, including already-created quotes.
create function concierge.prevent_cancelled_renewal() returns trigger language plpgsql set search_path='' as $$begin
 if ((TG_TABLE_NAME='quotes' and (to_jsonb(new)->'money'->>'serviceCents')::bigint>0) or TG_TABLE_NAME='payment_confirmations' and (to_jsonb(new)->>'service_cents')::bigint>0)
 and exists(select 1 from concierge.service_cancellations where client_id=new.client_id) then perform concierge.fail('renewal_cancelled');end if;return new;
end $$;
create trigger prevent_cancelled_renewal_quote before insert on concierge.quotes for each row execute function concierge.prevent_cancelled_renewal();
create trigger prevent_cancelled_renewal_confirmation before insert on concierge.payment_confirmations for each row execute function concierge.prevent_cancelled_renewal();
alter function concierge.validate_quote(uuid,jsonb) rename to validate_quote_before_cancellation;
create function concierge.validate_quote(c uuid,p jsonb) returns void language plpgsql set search_path='' as $$begin
 if (p->>'serviceCents')::bigint>0 and exists(select 1 from concierge.service_cancellations where client_id=c) then perform concierge.fail('renewal_cancelled');end if;
 perform concierge.validate_quote_before_cancellation(c,p);
end $$;
-- Preserve immutable publication content. Override only current active use.
alter function concierge.presentation_projection(uuid,jsonb,boolean) rename to presentation_projection_before_instructions;
create function concierge.instruction_json(d concierge.instruction_drafts,p concierge.instruction_publications) returns jsonb language sql set search_path='' as $$
 select (d.data-'baseInstructionVersion')||jsonb_build_object('id',p.id,'version',p.version,'source',d.source,'originalStartedOn',d.original_started_on,'authorId',p.actor_id,'createdAt',p.created_at)
$$;
create function concierge.active_instruction_basis(c uuid,slot text) returns jsonb language sql set search_path='' as $$
 select s from jsonb_array_elements(concierge.presentation_projection_before_instructions(c,concierge.client_projection(c),true)->'activeRoutine')j(s) where s->>'kind'='product' and s->>'slot'=slot
$$;
create function concierge.presentation_projection(c uuid,v jsonb,advisor boolean default false) returns jsonb language plpgsql set search_path='' as $$
declare result jsonb:=concierge.presentation_projection_before_instructions(c,v,advisor);active jsonb:='[]';s jsonb;i jsonb;begin
 for s in select value from jsonb_array_elements(result->'activeRoutine') loop
  select concierge.instruction_json(d,p) into i from concierge.instruction_drafts d join concierge.instruction_publications p on p.draft_id=d.id
  where d.client_id=c and d.data->>'slot'=s->>'slot' and d.data->>'productId'=s->>'productId' and d.source=s->'source' and (advisor or exists(select 1 from concierge.entitled_publications ep where ep.client_id=c and ep.version=(d.data->>'planVersion')::integer and ep.starts_on<=(now() at time zone 'America/Chicago')::date)) and (d.data->>'effectiveOn')::date<=(now() at time zone 'America/Chicago')::date order by p.version desc limit 1;
  if i is not null then s:=s||jsonb_build_object('usage',i->'usage','instructionRevision',i,'guides',jsonb_build_array(jsonb_build_object('id','instruction-'||(i->>'id'),'productId',s->>'productId','title','Current reviewed instructions','intro',i->>'reason','steps',(select jsonb_agg(jsonb_build_object('title',null,'body',x)) from jsonb_array_elements(i->'usage'->'instructions')j(x)),'careNote',null,'sources','[]'::jsonb)));end if;
  active:=active||jsonb_build_array(s);
 end loop;
 return result||jsonb_build_object('activeRoutine',active);
end $$;
create function concierge.return_status(p_return_id uuid) returns text language sql stable set search_path='' as $$
 select coalesce((select data->>'status' from concierge.return_events where return_id=p_return_id order by sequence desc limit 1),'requested')
$$;
create function concierge.service_projection_data(c uuid,advisor boolean) returns jsonb language plpgsql set search_path='' as $$declare result jsonb;begin
 result:=jsonb_build_object('revision',coalesce((select revision from concierge.service_heads where client_id=c),0),
 'reviews',(select coalesce(jsonb_agg(data||jsonb_build_object('id',id,'authorId',actor_id,'authorLabel','Review with your advisor','recordedAt',recorded_at) order by recorded_at,id),'[]') from concierge.service_reviews where client_id=c),
 'instructions',(select coalesce(jsonb_agg(concierge.instruction_json(d,p) order by p.created_at,p.version),'[]') from concierge.instruction_drafts d join concierge.instruction_publications p on p.draft_id=d.id where d.client_id=c and (advisor or exists(select 1 from concierge.entitled_publications ep where ep.client_id=c and ep.version=(d.data->>'planVersion')::integer and ep.starts_on<=(now() at time zone 'America/Chicago')::date))),
 'purchases',(select coalesce(jsonb_agg(data||jsonb_build_object('id',id,'recordedBy',actor_id,'recordedAt',recorded_at) order by recorded_at,id),'[]') from concierge.retail_purchases where client_id=c),
 'returns',(select coalesce(jsonb_agg(r.data||jsonb_build_object('id',r.id,'purchaseId',r.purchase_id,'status',concierge.return_status(r.id),'requestedAt',r.requested_at,'events',(select coalesce(jsonb_agg(e.data||jsonb_build_object('id',e.id,'actorId',e.actor_id,'recordedAt',e.recorded_at) order by e.sequence),'[]') from concierge.return_events e where e.return_id=r.id)) order by r.requested_at,r.id),'[]') from concierge.return_cases r where r.client_id=c),
 'cancellation',(select data||jsonb_build_object('id',id,'recordedBy',actor_id,'recordedAt',recorded_at) from concierge.service_cancellations where client_id=c));
 if advisor then result:=result||jsonb_build_object(
 'privateNotes',(select coalesce(jsonb_agg(jsonb_build_object('reviewId',r.id,'note',n.note)),'[]') from concierge.service_reviews r join concierge.service_review_private n on n.review_id=r.id where r.client_id=c),
 'instructionDrafts',(select coalesce(jsonb_agg(d.data||jsonb_build_object('id',d.id,'draftId',d.id,'version',(d.data->>'baseInstructionVersion')::bigint+1,'source',d.source,'originalStartedOn',d.original_started_on,'authorId',d.actor_id,'createdAt',d.created_at) order by d.created_at,d.id),'[]') from concierge.instruction_drafts d where d.client_id=c and not exists(select 1 from concierge.instruction_publications p where p.draft_id=d.id)),
 'privatePurchases',(select coalesce(jsonb_agg(jsonb_build_object('purchaseId',p.id,'orderReference',x.order_reference,'receiptReference',x.receipt_reference)),'[]') from concierge.retail_purchases p join concierge.retail_purchase_private x on x.purchase_id=p.id where p.client_id=c),
 'privateReturnEvents',(select coalesce(jsonb_agg(jsonb_build_object('eventId',e.id,'reference',x.reference)),'[]') from concierge.return_events e join concierge.return_event_private x on x.event_id=e.id where e.client_id=c));end if;return result;
end $$;
create function public.concierge_service_client_view() returns jsonb language plpgsql security definer set search_path='' as $$declare u uuid:=concierge.actor();begin perform concierge.access(u);perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||u::text,0));return concierge.service_projection_data(u,false);end $$;
create function public.concierge_service_advisor_view(p_client_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$begin perform concierge.access(p_client_id,'view');perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));return concierge.service_projection_data(p_client_id,true);end $$;
create function public.concierge_service_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid;prior jsonb;h concierge.service_heads;id uuid;basis jsonb;d concierge.instruction_drafts;pub concierge.instruction_publications;p concierge.retail_purchases;r concierge.return_cases;q concierge.quotes;s text;next_status text;policy jsonb;n bigint;cap bigint;got bigint;day date:=(now() at time zone 'America/Chicago')::date;ver bigint;result jsonb;begin
 -- Administration survives end of support; new care edits do not. All live
 -- permissions are rechecked before returning even an exact retry receipt.
 if p_action='request_return' then u:=concierge.access(p_client_id);
 elsif p_action='publish_instruction_revision' then u:=concierge.access(p_client_id,'publish');
 elsif p_action='record_return_event' and p_payload->>'status' in ('retailer_funds_received','client_repaid') then u:=concierge.access(p_client_id,'confirm');
 elsif p_action in ('record_review','save_instruction_draft','record_purchase','record_return_event','cancel_service') then u:=concierge.access(p_client_id,'edit');
 else perform concierge.fail('invalid_input');end if;
 if p_action in ('record_review','save_instruction_draft','publish_instruction_revision') then perform concierge.checkin_guard(p_client_id);end if;
 if p_action='publish_instruction_revision' and not concierge.service_active(p_client_id) then perform concierge.fail('forbidden');end if;
 if p_action in ('record_review','save_instruction_draft','publish_instruction_revision') and exists(select 1 from concierge.service_cancellations where client_id=p_client_id and (data->>'supportEndsOn')::date<=day) then perform concierge.fail('forbidden');end if;
 prior:=concierge.workflow_begin(u,p_client_id,p_request_id,'service',p_action,p_expected_revision,p_payload);if prior is not null then return prior;end if;
 perform concierge.validate_presentation_shape(p_payload,concierge.service_payload_shape(p_action));
 insert into concierge.service_heads(client_id) values(p_client_id) on conflict do nothing;select * into h from concierge.service_heads where client_id=p_client_id for update;
 if h.revision<>p_expected_revision then perform concierge.fail('revision_conflict');end if;
 if p_action='record_review' then
  if concierge.day(p_payload,'occurredOn')>day or (p_payload->>'nextReviewOn')::date<concierge.day(p_payload,'occurredOn') then perform concierge.fail('invalid_input');end if;
  insert into concierge.service_reviews(client_id,data,actor_id) values(p_client_id,p_payload-'privateNote',u) returning service_reviews.id into id;
  if nullif(concierge.trim_text(p_payload->>'privateNote'),'') is not null then insert into concierge.service_review_private values(id,p_payload->>'privateNote');end if;
 elsif p_action in ('save_instruction_draft','publish_instruction_revision') then
  if p_action='save_instruction_draft' then
   basis:=concierge.active_instruction_basis(p_client_id,p_payload->>'slot');
   if basis is null or basis->>'productId'<>p_payload->>'productId' or concierge.integer(p_payload,'planVersion')<>(select published_version from concierge.cases where client_id=p_client_id) then perform concierge.fail('instruction_conflict');end if;
   select coalesce(max(x.version),0) into ver from concierge.instruction_publications x join concierge.instruction_drafts dd on dd.id=x.draft_id where dd.client_id=p_client_id and dd.source=basis->'source' and dd.data->>'slot'=p_payload->>'slot' and dd.data->>'productId'=p_payload->>'productId';
   if concierge.integer(p_payload,'baseInstructionVersion')<>ver then perform concierge.fail('instruction_conflict');end if;
   if concierge.day(p_payload,'effectiveOn')>day then perform concierge.fail('invalid_input');end if;
   if p_payload->>'reviewId' is not null and not exists(select 1 from concierge.service_reviews where client_id=p_client_id and service_reviews.id=(p_payload->>'reviewId')::uuid) then perform concierge.fail('not_found');end if;
   insert into concierge.instruction_drafts(client_id,data,source,original_started_on,actor_id) values(p_client_id,p_payload,basis->'source',(select started_on from concierge.activations where client_id=p_client_id and version=(basis->'source'->>'publicationVersion')::integer and recommendation_id=basis->'source'->>'recommendationId' order by activations.id desc limit 1),u) returning instruction_drafts.id into id;
  else
   select * into d from concierge.instruction_drafts where client_id=p_client_id and instruction_drafts.id=(p_payload->>'draftId')::uuid;
   if not found then perform concierge.fail('not_found');end if;basis:=concierge.active_instruction_basis(p_client_id,d.data->>'slot');
   select coalesce(max(x.version),0) into ver from concierge.instruction_publications x join concierge.instruction_drafts dd on dd.id=x.draft_id where dd.client_id=p_client_id and dd.source=d.source and dd.data->>'slot'=d.data->>'slot' and dd.data->>'productId'=d.data->>'productId';
   if basis is null or basis->>'productId'<>d.data->>'productId' or basis->'source'<>d.source or (d.data->>'planVersion')::bigint<>(select published_version from concierge.cases where client_id=p_client_id) or (d.data->>'baseInstructionVersion')::bigint<>ver or exists(select 1 from concierge.instruction_publications where draft_id=d.id) then perform concierge.fail('instruction_conflict');end if;
   insert into concierge.instruction_publications(client_id,draft_id,version,actor_id) values(p_client_id,d.id,ver+1,u) returning instruction_publications.id into id;
  end if;
 elsif p_action='record_purchase' then
  if exists(select 1 from concierge.retail_purchases rp join concierge.retail_purchase_private x on x.purchase_id=rp.id where rp.client_id=p_client_id and rp.data->>'productId'=p_payload->>'productId' and (x.order_reference=p_payload->>'orderReference' or x.receipt_reference=p_payload->>'receiptReference')) then perform concierge.fail('purchase_conflict');end if;
  if concierge.day(p_payload,'purchasedOn')>day or (p_payload->>'deliveredOn')::date>day or (p_payload->>'deliveredOn')::date<concierge.day(p_payload,'purchasedOn') or (p_payload->'policy'->>'checkedOn')::date>day then perform concierge.fail('invalid_input');end if;
  if (p_payload->>'quantity')::bigint*(p_payload->>'unitPriceCents')::bigint+(p_payload->>'taxCents')::bigint+(p_payload->>'shippingCents')::bigint>100000000 then perform concierge.fail('invalid_input');end if;
  if p_payload->>'quoteId' is not null then
   select * into q from concierge.quotes where client_id=p_client_id and quotes.id=(p_payload->>'quoteId')::uuid;
   if not found or not exists(select 1 from concierge.payment_confirmations where quote_id=q.id and product_cents>0) or not exists(select 1 from jsonb_array_elements(q.money->'items')j(i) join concierge.publications pp on pp.client_id=p_client_id and pp.version=q.publication_version cross join lateral jsonb_array_elements(pp.recommendations)j2(rec) where i->>'recommendationId'=p_payload->>'recommendationId' and rec->>'id'=i->>'recommendationId' and rec->>'proposedProductId'=p_payload->>'productId' and (i->>'quantity')::bigint=(p_payload->>'quantity')::bigint and (i->>'unitPriceCents')::bigint=(p_payload->>'unitPriceCents')::bigint) or (q.money->>'taxCents')::bigint<(p_payload->>'taxCents')::bigint+coalesce((select sum((data->>'taxCents')::bigint) from concierge.retail_purchases where client_id=p_client_id and data->>'quoteId'=p_payload->>'quoteId'),0) or (q.money->>'shippingCents')::bigint<(p_payload->>'shippingCents')::bigint+coalesce((select sum((data->>'shippingCents')::bigint) from concierge.retail_purchases where client_id=p_client_id and data->>'quoteId'=p_payload->>'quoteId'),0) then perform concierge.fail('purchase_conflict');end if;
   if exists(select 1 from concierge.retail_purchases where client_id=p_client_id and data->>'quoteId'=p_payload->>'quoteId' and data->>'recommendationId'=p_payload->>'recommendationId') then perform concierge.fail('purchase_conflict');end if;
  elsif p_payload->>'recommendationId' is not null then perform concierge.fail('invalid_input');end if;
  insert into concierge.retail_purchases(client_id,data,actor_id) values(p_client_id,p_payload-array['orderReference','receiptReference','termsDisclosed'],u) returning retail_purchases.id into id;
  insert into concierge.retail_purchase_private values(id,p_payload->>'orderReference',p_payload->>'receiptReference');
 elsif p_action='request_return' then
  select * into p from concierge.retail_purchases where client_id=p_client_id and retail_purchases.id=(p_payload->>'purchaseId')::uuid;if not found then perform concierge.fail('not_found');end if;
  select coalesce(sum((data->>'quantity')::bigint),0) into n from concierge.return_cases where purchase_id=p.id and concierge.return_status(return_cases.id)<>'declined';
  if n+(p_payload->>'quantity')::bigint>(p.data->>'quantity')::bigint then perform concierge.fail('return_quantity_exceeded');end if;
  insert into concierge.return_cases(client_id,purchase_id,data,actor_id) values(p_client_id,p.id,p_payload-'purchaseId',u) returning return_cases.id into id;
 elsif p_action='record_return_event' then
  select * into r from concierge.return_cases where client_id=p_client_id and return_cases.id=(p_payload->>'returnId')::uuid;if not found then perform concierge.fail('not_found');end if;
  select * into p from concierge.retail_purchases where retail_purchases.id=r.purchase_id;
  s:=concierge.return_status(r.id);next_status:=p_payload->>'status';policy:=p.data->'policy';
  if not ((s='requested' and next_status='reviewing') or (s='reviewing' and next_status in ('authorized','declined')) or (s='authorized' and next_status in ('awaiting_return','in_transit','retailer_reviewing')) or (s='awaiting_return' and next_status in ('in_transit','retailer_reviewing')) or (s='in_transit' and next_status='retailer_reviewing') or (s='retailer_reviewing' and next_status='retailer_funds_received') or (s='retailer_funds_received' and next_status='client_repaid')) then perform concierge.fail('return_transition');end if;
  if next_status='authorized' and (policy->>'finalSale'='true' or (r.data->>'condition'<>'unopened' and policy->>'openedAllowed' is distinct from 'true') or (policy->>'returnBy')::date<day or (policy->>'shipBy')::date<day or p_payload->>'policyCheckedOn' is null or (p_payload->>'policyCheckedOn')::date<>day) then perform concierge.fail('return_ineligible');end if;
  if next_status in ('in_transit','awaiting_return') and (policy->>'shipBy')::date<day then perform concierge.fail('return_ineligible');end if;
  -- A partial quantity may own the proportional ceiling, including a remainder
  -- cent. The common client lock also caps all recorded retailer receipts at
  -- the purchase total, so no ordering of partial cases can allocate it twice.
  cap:=(r.data->>'quantity')::bigint*(p.data->>'unitPriceCents')::bigint+(((p.data->>'taxCents')::bigint+(p.data->>'shippingCents')::bigint)*(r.data->>'quantity')::bigint+(p.data->>'quantity')::bigint-1)/(p.data->>'quantity')::bigint;
  select coalesce(sum((e.data->>'retailerRefundCents')::bigint),0) into n from concierge.return_events e join concierge.return_cases rc on rc.id=e.return_id where rc.purchase_id=p.id and rc.id<>r.id;
  cap:=least(cap,(p.data->>'quantity')::bigint*(p.data->>'unitPriceCents')::bigint+(p.data->>'taxCents')::bigint+(p.data->>'shippingCents')::bigint-n);
  if (p_payload->>'expectedRefundCents')::bigint>cap or (p_payload->>'retailerRefundCents')::bigint>cap then perform concierge.fail('refund_exceeded');end if;
  if (next_status='retailer_funds_received')<>(p_payload->>'retailerRefundCents' is not null) or (next_status='client_repaid')<>(p_payload->>'clientRepaidCents' is not null) then perform concierge.fail('invalid_input');end if;
  if next_status='client_repaid' then select (data->>'retailerRefundCents')::bigint into got from concierge.return_events where return_id=r.id and data->>'status'='retailer_funds_received';if (p_payload->>'clientRepaidCents')::bigint<>got then perform concierge.fail('refund_exceeded');end if;end if;
  insert into concierge.return_events(client_id,return_id,data,actor_id) values(p_client_id,r.id,p_payload-array['returnId','privateReference'],u) returning return_events.id into id;
  insert into concierge.return_event_private values(id,p_payload->>'privateReference');
 elsif p_action='cancel_service' then
  if exists(select 1 from concierge.service_cancellations where client_id=p_client_id) then perform concierge.fail('request_conflict');end if;
  if p_payload->>'kind'='period_end' and (p_payload->>'supportEndsOn')::date is distinct from (select max(ends_on) from concierge.service_periods where client_id=p_client_id and starts_on is not null) then perform concierge.fail('invalid_input');end if;
  if p_payload->>'kind'='early_departure' and ((p_payload->>'supportEndsOn')::date<day or (p_payload->>'supportEndsOn')::date>coalesce((select max(ends_on) from concierge.service_periods where client_id=p_client_id),day)) then perform concierge.fail('invalid_input');end if;
  insert into concierge.service_cancellations(client_id,data,actor_id) values(p_client_id,p_payload-'confirmedWithClient',u) returning service_cancellations.id into id;
  update concierge.quote_states st set status='superseded' from concierge.quotes qq where qq.id=st.quote_id and qq.client_id=p_client_id and st.status='payable' and (qq.money->>'serviceCents')::bigint>0;
 end if;
 update concierge.service_heads set revision=revision+1 where client_id=p_client_id returning * into h;
 result:=jsonb_build_object('revision',h.revision,'operation',p_action,'entityId',id);
 return concierge.workflow_finish(u,p_client_id,p_request_id,'service',p_action,p_expected_revision,p_payload,result);
exception when invalid_text_representation or numeric_value_out_of_range then perform concierge.fail('invalid_input');return null;
end $$;
do $$declare t text;f regprocedure;begin
 foreach t in array array['service_heads','service_reviews','service_review_private','instruction_drafts','instruction_publications','retail_purchases','retail_purchase_private','return_cases','return_events','return_event_private','service_cancellations'] loop
 execute format('alter table concierge.%I enable row level security',t);execute format('revoke all on table concierge.%I from public,anon,authenticated,service_role',t);
 if t<>'service_heads' then execute format('create trigger service_immutable before update on concierge.%I for each row execute function concierge.immutable()',t);end if;end loop;
 for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('concierge_service_client_view','concierge_service_advisor_view','concierge_service_write') loop execute format('revoke all on function %s from public,anon,service_role',f);execute format('grant execute on function %s to authenticated',f);end loop;
end $$;
revoke all on all functions in schema concierge from public,anon,authenticated,service_role;
revoke all on all sequences in schema concierge from public,anon,authenticated,service_role;
commit;
