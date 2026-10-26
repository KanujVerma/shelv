-- Add only the signed-in client's canonical enrollment name to the existing read.
-- CREATE OR REPLACE preserves the current signature, owner and EXECUTE grants.
create or replace function public.concierge_client_view_v2() returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=concierge.actor();
 v jsonb;
 account_name text;
begin
 perform concierge.access(u);
 v:=concierge.presentation_projection(u,concierge.portal_projection(u));
 select display_name into account_name from concierge.enrollments where client_id=u;
 return v||jsonb_build_object('account',jsonb_build_object('displayName',account_name));
end $$;
