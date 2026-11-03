-- SOURCE ONLY, UNRUN. Sole new-migration reservation: client-orders-read producer.
-- Additive own administration; no care projection, journal, head insertion,
-- financial mutation, legacy helper replacement or policy/trigger changes.
begin;

create function concierge.client_orders_projection_v1(u uuid) returns jsonb
language sql set search_path='' as $$
 select jsonb_build_object('schemaVersion',1,
  'revision',coalesce((select revision from concierge.service_heads where client_id=u),0),
  'purchases',(select coalesce(jsonb_agg(jsonb_build_object(
   'id',p.id,'quoteId',p.data->'quoteId','recommendationId',p.data->'recommendationId',
   'retailer',p.data->'retailer','seller',p.data->'seller','productId',p.data->'productId','productName',p.data->'productName',
   'quantity',p.data->'quantity','unitPriceCents',p.data->'unitPriceCents','taxCents',p.data->'taxCents','shippingCents',p.data->'shippingCents',
   'purchasedOn',p.data->'purchasedOn','deliveredOn',p.data->'deliveredOn',
   'policy',jsonb_build_object('checkedOn',p.data->'policy'->'checkedOn','url',p.data->'policy'->'url',
    'summary',p.data->'policy'->'summary','openedAllowed',p.data->'policy'->'openedAllowed','finalSale',p.data->'policy'->'finalSale',
    'returnBy',p.data->'policy'->'returnBy','shipBy',p.data->'policy'->'shipBy','returnCostCents',p.data->'policy'->'returnCostCents'),
   'recordedBy',p.actor_id,'recordedAt',p.recorded_at) order by p.recorded_at,p.id),'[]'::jsonb)
   from concierge.retail_purchases p where p.client_id=u),
  'returns',(select coalesce(jsonb_agg(jsonb_build_object(
   'id',r.id,'purchaseId',r.purchase_id,'quantity',r.data->'quantity','reason',r.data->'reason','condition',r.data->'condition',
   'status',concierge.return_status(r.id),'requestedAt',r.requested_at,
   'events',(select coalesce(jsonb_agg(jsonb_build_object(
    'id',e.id,'status',e.data->'status','note',e.data->'note','expectedRefundCents',e.data->'expectedRefundCents',
    'retailerRefundCents',e.data->'retailerRefundCents','clientRepaidCents',e.data->'clientRepaidCents',
    'policyCheckedOn',e.data->'policyCheckedOn','actorId',e.actor_id,'recordedAt',e.recorded_at) order by e.sequence),'[]'::jsonb)
    from concierge.return_events e where e.client_id=u and e.return_id=r.id)) order by r.requested_at,r.id),'[]'::jsonb)
   from concierge.return_cases r where r.client_id=u))
$$;

create function public.concierge_client_orders_read_v1(p_command jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();s uuid;expiry numeric;enrollment concierge.enrollments;head bigint;result jsonb;
begin
 -- Capture real caller context before any potentially waiting operation.
 if u is null or auth.jwt()->>'role' is distinct from 'authenticated' then perform concierge.fail('unauthorized');end if;
 begin s:=(auth.jwt()->>'session_id')::uuid;expiry:=(auth.jwt()->>'exp')::numeric;
 exception when invalid_text_representation or numeric_value_out_of_range then perform concierge.fail('session_ended');end;
 -- Existing private helper is identity-only: real permanent Auth user/session,
 -- deletion/ban/expiry and no active advisor or any plan-principal persona.
 -- It takes no enrollment/profile-head lock and grants no care rights.
 perform concierge.account_profile_authorize_v1(u,s,expiry);
 if p_command is null or jsonb_typeof(p_command) is distinct from 'object' then perform concierge.fail('invalid_input');end if;
 if octet_length(convert_to(p_command::text,'UTF8'))>8192 then perform concierge.fail('too_large');end if;
 perform concierge.keys(p_command,array['schemaVersion','action']);
 if p_command->'schemaVersion' is distinct from '1'::jsonb or p_command->>'action' is distinct from 'read_client_orders_v1' then perform concierge.fail('invalid_input');end if;

 -- Read-only canonical enrollment lock, with no SHARE-to-UPDATE upgrade. This
 -- precedes the existing client read context and authoritative global head.
 select * into enrollment from concierge.enrollments where client_id=u for share;
 perform concierge.account_profile_authorize_v1(u,s,expiry);
 if enrollment.client_id is null or enrollment.status='revoked'
  or not exists(select 1 from concierge.cases where client_id=u) then perform concierge.fail('forbidden');end if;
 -- Shares the actual legacy service writer namespace. It also serializes first
 -- writes when no service_heads row exists; never insert a head during a read.
 perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||u::text,0));
 perform concierge.account_profile_authorize_v1(u,s,expiry);
 select revision into head from concierge.service_heads where client_id=u for share;
 perform concierge.account_profile_authorize_v1(u,s,expiry);
 if head is null and (exists(select 1 from concierge.retail_purchases where client_id=u)
  or exists(select 1 from concierge.return_cases where client_id=u)
  or exists(select 1 from concierge.return_events where client_id=u)) then perform concierge.fail('unavailable');end if;
 result:=concierge.client_orders_projection_v1(u);
 if result is null or result->'revision' is distinct from to_jsonb(coalesce(head,0)) then perform concierge.fail('unavailable');end if;
 -- This first packet is the entire own recorded collection, or explicit safe
 -- unavailable. No row-count truncation, pagination or error-as-empty fallback.
 if octet_length(convert_to(result::text,'UTF8'))>2000000 then perform concierge.fail('unavailable');end if;
 if not exists(select 1 from concierge.enrollments where client_id=u and status<>'revoked') then perform concierge.fail('forbidden');end if;
 if concierge.client_orders_projection_v1(u) is distinct from result then perform concierge.fail('revision_conflict');end if;
 perform concierge.account_profile_authorize_v1(u,s,expiry);
 return result;
end $$;
revoke all on function concierge.client_orders_projection_v1(uuid) from public,anon,authenticated,service_role;
revoke all on function public.concierge_client_orders_read_v1(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.concierge_client_orders_read_v1(jsonb) to authenticated;
commit;

-- Rollback SOURCE plan, UNRUN: retire any later consumer/gateway registration,
-- revoke/drop only this new public RPC and private projection. No data was added
-- or changed. Do not restore any historical service/payment/care/Start facts,
-- modify original functions/ACL/RLS/triggers, or remove private order records.
