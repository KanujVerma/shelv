-- Storage1.80.2 permission-probe compatibility; no access/grant expansion.
-- Preserve the applied workflow migration and strict completed-object gate.
begin;
create function concierge.storage_metadata_bytes(metadata jsonb,key text) returns bigint
language plpgsql immutable set search_path='' as $$
declare n numeric;begin
 if jsonb_typeof(metadata) is distinct from 'object' or jsonb_typeof(metadata->key) is distinct from 'number' then perform concierge.fail('invalid_input');end if;
 n:=(metadata->>key)::numeric;
 -- Validate numeric type, integrality and bounds BEFORE the bigint cast.
 if n<>trunc(n) or n not between 1 and 5242880 then perform concierge.fail('invalid_input');end if;
 return n::bigint;
end $$;

create or replace function concierge.storage_fence() returns trigger language plpgsql security definer set search_path='' as $$
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
 -- Storage1.80.2 first tests INSERT permission using version1 + declared
 -- length, then ROLLS BACK that transaction/savepoint before writing bytes.
 -- It later inserts final backend metadata with actual size on the fresh path.
 if jsonb_typeof(new.metadata) is distinct from 'object' or coalesce(new.metadata->>'mimetype',new.metadata->>'contentType') is distinct from mime then perform concierge.fail('invalid_input');end if;
 if new.metadata ? 'size' then
  if concierge.storage_metadata_bytes(new.metadata,'size')<>bytes then perform concierge.fail('invalid_input');end if;
 else
  if new.version is distinct from '1' or not (new.metadata ?& array['mimetype','contentLength'])
   or (new.metadata-array['mimetype','contentLength','contentEncoding'])<>'{}'::jsonb then perform concierge.fail('invalid_input');end if;
  if new.metadata ? 'contentEncoding' then
   if jsonb_typeof(new.metadata->'contentEncoding') is distinct from 'string' or length(new.metadata->>'contentEncoding')>256
    or (new.metadata->>'contentEncoding') !~ '^[!#$%&''*+.^_`|~0-9A-Za-z-]+(, [!#$%&''*+.^_`|~0-9A-Za-z-]+)*$' then perform concierge.fail('invalid_input');end if;
  end if;
 end if;
 if new.metadata ? 'contentLength' and concierge.storage_metadata_bytes(new.metadata,'contentLength')<>bytes then perform concierge.fail('invalid_input');end if;
 return new;
end $$;

-- Version1 is only a shape marker, not proof that an INSERT will roll back.
-- Prevent any probe-only row from persisting even if a privileged caller forges
-- that shape. A genuine permission-test ROLLBACK discards this deferred event.
create function concierge.storage_probe_commit_fence() returns trigger
language plpgsql security definer set search_path='' as $$ begin
 -- Inspect the CURRENT row by immutable ID with owner visibility. A row deleted
 -- before COMMIT needs no check; any reinserted row was separately INSERT-fenced.
 perform concierge.storage_metadata_bytes(o.metadata,'size') from storage.objects o
  where o.id=new.id and o.bucket_id in ('concierge-payment-evidence','concierge-checkin-photos');
 return null;
end $$;
create constraint trigger concierge_private_storage_commit_size
 after insert on storage.objects deferrable initially deferred for each row
 when (new.bucket_id in ('concierge-payment-evidence','concierge-checkin-photos') and not (new.metadata ? 'size'))
 execute function concierge.storage_probe_commit_fence();
revoke all on function concierge.storage_metadata_bytes(jsonb,text),concierge.storage_probe_commit_fence() from public,anon,authenticated,service_role;
commit;
