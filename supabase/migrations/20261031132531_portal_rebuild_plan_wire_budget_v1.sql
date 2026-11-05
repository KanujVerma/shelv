-- Forward-only correction:500000 compact bytes remains the Plan wire contract.
-- Canonical Edge JSON safe integers gain at most2 separator spaces/value child
-- in jsonb text.500000+2*(250001-1)=1000000 is a derived representation guard.
-- JSONB parse/detoast AND initial text materialization precede this SQL check.
begin;
create function concierge.plan_wire_count_v1(v jsonb,depth integer default 0) returns bigint[]
language plpgsql immutable set search_path='' as $$
declare bytes bigint:=0;nodes bigint:=1;k text;x jsonb;r bigint[];s text;n numeric;t text:=jsonb_typeof(v);begin
 if depth<0 or depth>=10 then perform concierge.fail('invalid_input');end if;
 if t='object' then
  bytes:=2;
  for k,x in select * from jsonb_each(v) loop
   if octet_length(k)>500000 then perform concierge.fail('invalid_input');end if;
   r:=concierge.plan_wire_count_v1(x,depth+1);
   bytes:=bytes+octet_length(to_jsonb(k)::text)+1+r[1]+case when nodes>1 then 1 else 0 end;nodes:=nodes+r[2];
   if bytes>500000 or nodes>250001 then perform concierge.fail('invalid_input');end if;
  end loop;
 elsif t='array' then
  if jsonb_array_length(v)>250000 then perform concierge.fail('invalid_input');end if;
  bytes:=2;
  for x in select value from jsonb_array_elements(v) loop
   r:=concierge.plan_wire_count_v1(x,depth+1);
   bytes:=bytes+r[1]+case when nodes>1 then 1 else 0 end;nodes:=nodes+r[2];
   if bytes>500000 or nodes>250001 then perform concierge.fail('invalid_input');end if;
  end loop;
 elsif t='string' then
  s:=v#>>'{}';if octet_length(s)>500000 then perform concierge.fail('invalid_input');end if;
  bytes:=octet_length(to_jsonb(s)::text);
 elsif t='number' then
  n:=(v#>>'{}')::numeric;
  if n<>trunc(n) or abs(n)>9007199254740991 then perform concierge.fail('invalid_input');end if;
  -- Plan26 has only finite safe integral numeric values. Do not count retained
  -- JSONB scale or expand a nonintegral/unsafe value into an accepted command.
  bytes:=octet_length((trunc(n)::bigint)::text);
 elsif t in ('boolean','null') then bytes:=octet_length(v::text);
 else perform concierge.fail('invalid_input');end if;
 if bytes>500000 then perform concierge.fail('invalid_input');end if;
 return array[bytes,nodes];
end $$;
create function concierge.plan_wire_budget_bytes_v1(p_command jsonb) returns bigint
language plpgsql immutable set search_path='' as $$declare fields jsonb;r bigint[];begin
 if jsonb_typeof(p_command) is distinct from 'object' then perform concierge.fail('invalid_input');end if;
 if octet_length(p_command::text)>1000000 then perform concierge.fail('invalid_input');end if;
 fields:=concierge.plan_command_fields()->(p_command->>'action');
 if fields is null then perform concierge.fail('invalid_input');end if;
 -- Exact existing closed26 action metadata, before the bounded traversal.
 perform concierge.plan_shape(p_command,jsonb_build_object('type','object','fields',jsonb_build_object('schemaVersion',jsonb_build_object('type','enum','values',jsonb_build_array(1)),'action',jsonb_build_object('type','enum','values',jsonb_build_array(p_command->>'action')))||fields));
 r:=concierge.plan_wire_count_v1(p_command,0);return r[1];
end $$;
revoke all on function concierge.plan_wire_count_v1(jsonb,integer),concierge.plan_wire_budget_bytes_v1(jsonb) from public,anon,authenticated,service_role;
-- Recreate the exact retained definition with ONLY its size-condition token
-- changed. Fail rather than patch a different source, owner, ACL or signature.
do $forward$
declare id oid:='concierge.plan_command_base_v1(jsonb)'::regprocedure;before_identity jsonb;after_identity jsonb;body text;updated_body text;definition text;after_body text;
 old_token constant text:='pg_column_size(p_command)>500000';new_token constant text:='concierge.plan_wire_budget_bytes_v1(p_command)>500000';begin
 select p.prosrc,pg_get_functiondef(p.oid),jsonb_build_object('oid',p.oid,'owner',p.proowner,'acl',p.proacl,'config',p.proconfig,'definer',p.prosecdef,'volatility',p.provolatile,'strict',p.proisstrict,'parallel',p.proparallel,'return',p.prorettype,'arguments',p.proargtypes::text)
 into body,definition,before_identity from pg_proc p where p.oid=id;
 if encode(sha256(convert_to(body,'UTF8')),'hex')<>'4be414067afedcf3456ae79523c69aaef25a964bddba0f9544836d3fff7552fa'
 or (length(body)-length(replace(body,old_token,'')))/length(old_token)<>1 then raise exception 'concierge_wire_budget_base_mismatch';end if;
 updated_body:=replace(body,old_token,new_token);
 if encode(sha256(convert_to(updated_body,'UTF8')),'hex')<>'e1309a1f3e1fad3a952fe6a0786956d6237b2446bb37a5105ba03dbd42d29aa6' then raise exception 'concierge_wire_budget_base_mismatch';end if;
 execute replace(definition,old_token,new_token);
 select p.prosrc,jsonb_build_object('oid',p.oid,'owner',p.proowner,'acl',p.proacl,'config',p.proconfig,'definer',p.prosecdef,'volatility',p.provolatile,'strict',p.proisstrict,'parallel',p.proparallel,'return',p.prorettype,'arguments',p.proargtypes::text)
 into after_body,after_identity from pg_proc p where p.oid=id;
 if after_identity is distinct from before_identity or after_body is distinct from updated_body or replace(body,old_token,'') is distinct from replace(after_body,new_token,'') then raise exception 'concierge_wire_budget_identity_mismatch';end if;
end $forward$;
commit;
