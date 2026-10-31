-- Allocated by Supabase CLI2.121.0 for CN1 filtered-history correction.
-- Implementation is owned by the next bounded fix task; frozen M56 remains unchanged.

-- CN1: missing optional amendment paths are nonmatches. Keep exact filter semantics.
begin;
create or replace function concierge.care_history_page(c uuid,p jsonb,token text,lim integer,h bigint) returns jsonb language plpgsql set search_path='' as $$
declare last_id uuid:=concierge.care_cursor_check(token,c,null,p,h);last_revision bigint:=0;r concierge.care_events;item jsonb;items jsonb:='[]';body jsonb;next_id uuid;counted integer:=0;begin
 if last_id is not null then select revision into last_revision from concierge.care_events where client_id=c and id=last_id;if not found then perform concierge.fail('cursor_conflict');end if;end if;
 for r in select * from concierge.care_events where client_id=c and revision>last_revision order by revision loop
  body:=case when r.kind='use' then concierge.care_use_event(r) when r.kind='reported_product' then r.payload||jsonb_build_object('initialUse',concierge.care_use_event(r)) else r.payload end;
  if p<>'null'::jsonb and (concierge.care_same_product(r.product,p) or (r.kind='use' and concierge.care_same_product(body->'amendment'->'replacement'->'product',p)) or (r.kind='reported_product' and concierge.care_same_product(body->'initialUse'->'amendment'->'replacement'->'product',p))) is not true then continue;end if;
  item:=case when r.kind='amendment' then jsonb_build_object('kind','amendment','amendment',body) else jsonb_build_object('kind',r.kind,'event',body) end;
  if counted>=lim or octet_length(jsonb_build_object('revision',h,'entries',items||jsonb_build_array(item),'nextCursor',repeat('x',103))::text)>400000 then return jsonb_build_object('revision',h,'entries',items,'nextCursor',concierge.care_cursor(c,null,p,h,next_id));end if;
  items:=items||jsonb_build_array(item);counted:=counted+1;next_id:=r.id;
 end loop;return jsonb_build_object('revision',h,'entries',items,'nextCursor',null);
end $$;
commit;
