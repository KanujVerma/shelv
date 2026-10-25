-- Additive R2 presentation snapshots. No real identities, grants or hosted data.
begin;
create table concierge.intake_presentations (
 client_id uuid not null,intake_version integer not null,presentation jsonb not null,
 primary key(client_id,intake_version),foreign key(client_id,intake_version) references concierge.intakes(client_id,version) on delete cascade
);
create table concierge.draft_presentations (
 client_id uuid primary key references concierge.drafts(client_id) on delete cascade,intake_version integer not null,presentation jsonb not null,
 foreign key(client_id,intake_version) references concierge.intakes(client_id,version) on delete cascade
);
create table concierge.publication_presentations (
 client_id uuid not null,version integer not null,presentation jsonb not null,
 primary key(client_id,version),foreign key(client_id,version) references concierge.publications(client_id,version) on delete cascade
);
create trigger intake_presentations_immutable before update on concierge.intake_presentations for each row execute function concierge.immutable();
create trigger publication_presentations_immutable before update on concierge.publication_presentations for each row execute function concierge.immutable();

-- Frozen scalar/object shape is shared with ConciergePresentationValidation.ts.
-- Cross-record authority checks below are independent of this structural shape.
create function concierge.presentation_shape(intake boolean) returns jsonb language sql immutable set search_path='' as $$
 select case when intake then $shape${"type":"object","fields":{"schemaVersion":{"type":"enum","values":[2]},"consultationSections":{"type":"array","item":{"type":"object","fields":{"title":{"type":"text","max":200,"empty":false},"body":{"type":"text","max":4000,"empty":false}}},"max":12,"min":0,"unique":false},"baselineRoutine":{"type":"array","item":{"type":"object","fields":{"id":{"type":"identifier"},"kind":{"type":"enum","values":["product","instruction"]},"slot":{"type":"identifier","nullable":true},"productId":{"type":"identifier","nullable":true},"product":{"type":"object","fields":{"id":{"type":"identifier"},"name":{"type":"text","max":200,"empty":false},"brand":{"type":"text","max":100,"empty":false,"nullable":true},"variant":{"type":"text","max":200,"empty":false,"nullable":true},"sizeLabel":{"type":"text","max":120,"empty":false},"productUrl":{"type":"url","nullable":true},"imageUrl":{"type":"image","nullable":true},"reference":{"type":"text","max":1000,"empty":false,"nullable":true},"displayPrice":{"type":"object","fields":{"cents":{"type":"integer","min":0,"max":100000000},"currency":{"type":"enum","values":["USD"]},"sourceUrl":{"type":"url","nullable":true},"checkedOn":{"type":"date","nullable":true},"illustrative":{"type":"boolean"}},"nullable":true}},"nullable":true},"title":{"type":"text","max":200,"empty":false},"usage":{"type":"object","fields":{"periods":{"type":"array","item":{"type":"enum","values":["morning","evening"]},"max":2,"min":1,"unique":true},"order":{"type":"integer","min":1,"max":50},"short":{"type":"object","fields":{"morning":{"type":"text","max":2000,"empty":false,"nullable":true},"evening":{"type":"text","max":2000,"empty":false,"nullable":true}}},"instructions":{"type":"array","item":{"type":"text","max":2000,"empty":false},"max":12,"min":1,"unique":false}}}}},"max":50,"min":1,"unique":false}}}$shape$::jsonb else $shape${"type":"object","fields":{"schemaVersion":{"type":"enum","values":[2]},"title":{"type":"text","max":200,"empty":false},"summary":{"type":"text","max":4000,"empty":true},"preparedBy":{"type":"text","max":200,"empty":false},"preparedOn":{"type":"date","nullable":true},"sources":{"type":"array","item":{"type":"object","fields":{"label":{"type":"text","max":200,"empty":false},"url":{"type":"url"}}},"max":12,"min":0,"unique":false},"consultationSections":{"type":"array","item":{"type":"object","fields":{"title":{"type":"text","max":200,"empty":false},"body":{"type":"text","max":4000,"empty":false}}},"max":12,"min":0,"unique":false},"categoryCards":{"type":"array","item":{"type":"object","fields":{"id":{"type":"identifier"},"slot":{"type":"identifier"},"kind":{"type":"enum","values":["replace","keep","finish_then_replace","no_addition"]},"recommendationId":{"type":"identifier","nullable":true},"title":{"type":"text","max":200,"empty":false},"subtitle":{"type":"text","max":200,"empty":true},"rationaleTitle":{"type":"text","max":200,"empty":false},"reasons":{"type":"array","item":{"type":"object","fields":{"title":{"type":"text","max":200,"empty":false},"body":{"type":"text","max":4000,"empty":false}}},"max":12,"min":1,"unique":false},"actions":{"type":"array","item":{"type":"text","max":2000,"empty":false},"max":12,"min":0,"unique":false},"currentProduct":{"type":"object","fields":{"id":{"type":"identifier"},"name":{"type":"text","max":200,"empty":false},"brand":{"type":"text","max":100,"empty":false,"nullable":true},"variant":{"type":"text","max":200,"empty":false,"nullable":true},"sizeLabel":{"type":"text","max":120,"empty":false},"productUrl":{"type":"url","nullable":true},"imageUrl":{"type":"image","nullable":true},"reference":{"type":"text","max":1000,"empty":false,"nullable":true},"displayPrice":{"type":"object","fields":{"cents":{"type":"integer","min":0,"max":100000000},"currency":{"type":"enum","values":["USD"]},"sourceUrl":{"type":"url","nullable":true},"checkedOn":{"type":"date","nullable":true},"illustrative":{"type":"boolean"}},"nullable":true}},"nullable":true},"proposedProduct":{"type":"object","fields":{"id":{"type":"identifier"},"name":{"type":"text","max":200,"empty":false},"brand":{"type":"text","max":100,"empty":false,"nullable":true},"variant":{"type":"text","max":200,"empty":false,"nullable":true},"sizeLabel":{"type":"text","max":120,"empty":false},"productUrl":{"type":"url","nullable":true},"imageUrl":{"type":"image","nullable":true},"reference":{"type":"text","max":1000,"empty":false,"nullable":true},"displayPrice":{"type":"object","fields":{"cents":{"type":"integer","min":0,"max":100000000},"currency":{"type":"enum","values":["USD"]},"sourceUrl":{"type":"url","nullable":true},"checkedOn":{"type":"date","nullable":true},"illustrative":{"type":"boolean"}},"nullable":true}},"nullable":true},"usage":{"type":"object","fields":{"periods":{"type":"array","item":{"type":"enum","values":["morning","evening"]},"max":2,"min":1,"unique":true},"order":{"type":"integer","min":1,"max":50},"short":{"type":"object","fields":{"morning":{"type":"text","max":2000,"empty":false,"nullable":true},"evening":{"type":"text","max":2000,"empty":false,"nullable":true}}},"instructions":{"type":"array","item":{"type":"text","max":2000,"empty":false},"max":12,"min":1,"unique":false}},"nullable":true},"comparisons":{"type":"array","item":{"type":"object","fields":{"label":{"type":"text","max":200,"empty":false},"currentText":{"type":"text","max":4000,"empty":false},"proposedText":{"type":"text","max":4000,"empty":false},"significance":{"type":"text","max":4000,"empty":false},"ingredientGuideKey":{"type":"enum","values":["niacinamide","ceramide_np","ceramide_ap","ceramide_eop","glycerin","hyaluronic_acid","sodium_hyaluronate","squalane","dimethicone","ceramide_ng","ceramide_as","cetearyl-alcohol","stearyl-alcohol","potassium-phosphate","ceramide-np","ceramide-ap","ceramide-eop","carbomer","glyceryl-stearate","behentrimonium-methosulfate","sodium-lauroyl-lactylate","sodium-hyaluronate","cholesterol","phenoxyethanol","disodium-edta","dipotassium-phosphate","tocopherol","phytosphingosine","xanthan-gum","cetyl-alcohol","polysorbate-20","ethylhexylglycerin","ceramides"],"nullable":true},"guideNote":{"type":"text","max":4000,"empty":false,"nullable":true},"sources":{"type":"array","item":{"type":"object","fields":{"label":{"type":"text","max":200,"empty":false},"url":{"type":"url"}}},"max":12,"min":0,"unique":false}}},"max":12,"min":0,"unique":false},"factsTitle":{"type":"text","max":200,"empty":false},"facts":{"type":"array","item":{"type":"object","fields":{"title":{"type":"text","max":200,"empty":false},"body":{"type":"text","max":4000,"empty":false},"ingredientGuideKey":{"type":"enum","values":["niacinamide","ceramide_np","ceramide_ap","ceramide_eop","glycerin","hyaluronic_acid","sodium_hyaluronate","squalane","dimethicone","ceramide_ng","ceramide_as","cetearyl-alcohol","stearyl-alcohol","potassium-phosphate","ceramide-np","ceramide-ap","ceramide-eop","carbomer","glyceryl-stearate","behentrimonium-methosulfate","sodium-lauroyl-lactylate","sodium-hyaluronate","cholesterol","phenoxyethanol","disodium-edta","dipotassium-phosphate","tocopherol","phytosphingosine","xanthan-gum","cetyl-alcohol","polysorbate-20","ethylhexylglycerin","ceramides"],"nullable":true},"sources":{"type":"array","item":{"type":"object","fields":{"label":{"type":"text","max":200,"empty":false},"url":{"type":"url"}}},"max":12,"min":0,"unique":false}}},"max":12,"min":0,"unique":false},"how":{"type":"object","fields":{"id":{"type":"identifier"},"productId":{"type":"identifier","nullable":true},"title":{"type":"text","max":200,"empty":false},"intro":{"type":"text","max":4000,"empty":true},"steps":{"type":"array","item":{"type":"object","fields":{"title":{"type":"text","max":200,"empty":false,"nullable":true},"body":{"type":"text","max":4000,"empty":false}}},"max":12,"min":0,"unique":false},"careNote":{"type":"text","max":4000,"empty":false,"nullable":true},"sources":{"type":"array","item":{"type":"object","fields":{"label":{"type":"text","max":200,"empty":false},"url":{"type":"url"}}},"max":12,"min":0,"unique":false}}},"sources":{"type":"array","item":{"type":"object","fields":{"label":{"type":"text","max":200,"empty":false},"url":{"type":"url"}}},"max":12,"min":0,"unique":false}}},"max":50,"min":0,"unique":false},"baselineRoutine":{"type":"array","item":{"type":"object","fields":{"id":{"type":"identifier"},"kind":{"type":"enum","values":["product","instruction"]},"slot":{"type":"identifier","nullable":true},"productId":{"type":"identifier","nullable":true},"product":{"type":"object","fields":{"id":{"type":"identifier"},"name":{"type":"text","max":200,"empty":false},"brand":{"type":"text","max":100,"empty":false,"nullable":true},"variant":{"type":"text","max":200,"empty":false,"nullable":true},"sizeLabel":{"type":"text","max":120,"empty":false},"productUrl":{"type":"url","nullable":true},"imageUrl":{"type":"image","nullable":true},"reference":{"type":"text","max":1000,"empty":false,"nullable":true},"displayPrice":{"type":"object","fields":{"cents":{"type":"integer","min":0,"max":100000000},"currency":{"type":"enum","values":["USD"]},"sourceUrl":{"type":"url","nullable":true},"checkedOn":{"type":"date","nullable":true},"illustrative":{"type":"boolean"}},"nullable":true}},"nullable":true},"title":{"type":"text","max":200,"empty":false},"usage":{"type":"object","fields":{"periods":{"type":"array","item":{"type":"enum","values":["morning","evening"]},"max":2,"min":1,"unique":true},"order":{"type":"integer","min":1,"max":50},"short":{"type":"object","fields":{"morning":{"type":"text","max":2000,"empty":false,"nullable":true},"evening":{"type":"text","max":2000,"empty":false,"nullable":true}}},"instructions":{"type":"array","item":{"type":"text","max":2000,"empty":false},"max":12,"min":1,"unique":false}}}}},"max":50,"min":1,"unique":false},"routineGuides":{"type":"array","item":{"type":"object","fields":{"id":{"type":"identifier"},"productId":{"type":"identifier","nullable":true},"title":{"type":"text","max":200,"empty":false},"intro":{"type":"text","max":4000,"empty":true},"steps":{"type":"array","item":{"type":"object","fields":{"title":{"type":"text","max":200,"empty":false,"nullable":true},"body":{"type":"text","max":4000,"empty":false}}},"max":12,"min":0,"unique":false},"careNote":{"type":"text","max":4000,"empty":false,"nullable":true},"sources":{"type":"array","item":{"type":"object","fields":{"label":{"type":"text","max":200,"empty":false},"url":{"type":"url"}}},"max":12,"min":0,"unique":false}}},"max":12,"min":0,"unique":false}}}$shape$::jsonb end
$$;
create function concierge.presentation_url(s text,image boolean default false) returns void language plpgsql set search_path='' as $$
declare authority text;host text;port text;decoded text;i integer;begin
 if s is null or length(s)>2048 then perform concierge.fail('invalid_input');end if;
 if image and s ~ '^assets/[a-zA-Z0-9][a-zA-Z0-9_-]*\.(jpg|jpeg|png|webp)$' then return;end if;
 -- Public DNS-form only. No fetching, credentials, IP literals, ambiguous
 -- numerical hosts, controls, whitespace, backslash or local suffixes.
 if s !~ '^https://' or s ~ '[[:space:][:cntrl:]\\]' or s ~ U&'[\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]' then perform concierge.fail('invalid_input');end if;
 authority:=substring(s from '^https://([^/?#]+)');
 if authority is null or length(authority)>259 or authority !~ '^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}(:[0-9]{1,5})?$' then perform concierge.fail('invalid_input');end if;
 host:=lower(split_part(authority,':',1));port:=nullif(split_part(authority,':',2),'');
 if host ~ '(^|\.)xn--' then perform concierge.fail('invalid_input');end if;
 if length(host)>253 or host ~ '(^|\.)(localhost|local|internal|lan|home|test|invalid)$' or (port is not null and port::integer>65535) then perform concierge.fail('invalid_input');end if;
 if position('%' in regexp_replace(s,'%[0-9a-fA-F]{2}','','g'))>0 or lower(s) like '%\%00%' escape '\' then perform concierge.fail('invalid_input');end if;
 decoded:=lower(s);
 for i in 1..127 loop decoded:=replace(decoded,'%'||lpad(to_hex(i),2,'0'),chr(i));end loop;
 decoded:=lower(decoded);
 if decoded ~ '/\.{1,2}(/|[?#]|$)' or decoded ~ '/storage/v1/(object|render/image)/(sign|authenticated)(/|[?#])|concierge-(checkin-photos|payment-evidence)|customer-skin-photos|[?&#](token|access_token|authorization|apikey|signature|sig|x-amz-[a-z-]+|x-goog-[a-z-]+)=' then perform concierge.fail('invalid_input');end if;

end $$;
create function concierge.validate_presentation_shape(v jsonb,s jsonb) returns void language plpgsql set search_path='' as $$
declare k text;item jsonb;t text:=s->>'type';n numeric;begin
 if v='null'::jsonb and coalesce((s->>'nullable')::boolean,false) then return;end if;
 if t='object' then
  perform concierge.keys(v,array(select jsonb_object_keys(s->'fields')));
  for k in select jsonb_object_keys(s->'fields') loop perform concierge.validate_presentation_shape(v->k,s->'fields'->k);end loop;
 elsif t='array' then
  if jsonb_typeof(v) is distinct from 'array' then perform concierge.fail('invalid_input');end if;
  if jsonb_array_length(v) not between coalesce((s->>'min')::integer,0) and (s->>'max')::integer then perform concierge.fail('invalid_input');end if;
  if coalesce((s->>'unique')::boolean,false) and (select count(distinct value) from jsonb_array_elements(v))<>jsonb_array_length(v) then perform concierge.fail('invalid_input');end if;
  for item in select value from jsonb_array_elements(v) loop perform concierge.validate_presentation_shape(item,s->'item');end loop;
 elsif t='text' then
  perform concierge.txt(jsonb_build_object('v',v),'v',(s->>'max')::integer,coalesce((s->>'empty')::boolean,false));
  if (v#>>'{}') ~ '<[^>]*>' then perform concierge.fail('invalid_input');end if;
 elsif t='identifier' then perform concierge.identifier(concierge.txt(jsonb_build_object('v',v),'v',100));
 elsif t='integer' then
  n:=concierge.integer(jsonb_build_object('v',v),'v');if n not between (s->>'min')::numeric and (s->>'max')::numeric then perform concierge.fail('invalid_input');end if;
 elsif t='date' then perform concierge.day(jsonb_build_object('v',v),'v');
 elsif t in ('url','image') then
  perform concierge.presentation_url(concierge.txt(jsonb_build_object('v',v),'v',2048),t='image');
 elsif t='boolean' then
  if jsonb_typeof(v) is distinct from 'boolean' then perform concierge.fail('invalid_input');end if;
 elsif t='enum' then
  if v is null or not (s->'values' @> jsonb_build_array(v)) then perform concierge.fail('invalid_input');end if;
 else perform concierge.fail('invalid_input');end if;
end $$;
create function concierge.validate_presentation(p jsonb,baseline jsonb,recs jsonb default null,intake boolean default false) returns void language plpgsql set search_path='' as $$
declare s jsonb;c jsonb;r jsonb;g jsonb;steps jsonb:=p->'baselineRoutine';cards jsonb:=p->'categoryCards';pid text;begin
 perform concierge.validate_presentation_shape(p,concierge.presentation_shape(intake));
 if (select count(distinct x->>'id') from jsonb_array_elements(steps)j(x))<>jsonb_array_length(steps) then perform concierge.fail('invalid_input');end if;
 for s in select value from jsonb_array_elements(steps) loop
  if s->>'kind'='instruction' then
   if s->'slot'<>'null'::jsonb or s->'productId'<>'null'::jsonb or s->'product'<>'null'::jsonb then perform concierge.fail('invalid_input');end if;
  elsif s->'slot'='null'::jsonb or s->'productId'='null'::jsonb or s->'product'='null'::jsonb or s->>'productId' is distinct from s->'product'->>'id' then perform concierge.fail('invalid_input');end if;
 end loop;
 if (select count(*) from jsonb_array_elements(steps)j(x) where x->>'kind'='product')<>jsonb_array_length(baseline) or exists(
  select 1 from jsonb_array_elements(baseline)j(b) where (select count(*) from jsonb_array_elements(steps)j(x) where x->>'kind'='product' and x->>'slot'=b->>'slot' and x->>'productId'=b->>'productId')<>1) then perform concierge.fail('invalid_input');end if;
 if intake then return;end if;
 if (select count(distinct x->>'id') from jsonb_array_elements(cards)j(x))<>jsonb_array_length(cards) or (select count(distinct x->>'slot') from jsonb_array_elements(cards)j(x))<>jsonb_array_length(cards) then perform concierge.fail('invalid_input');end if;
 if (select count(*) from jsonb_array_elements(cards)j(x) where x->>'recommendationId' is not null)<>(select count(distinct x->>'recommendationId') from jsonb_array_elements(cards)j(x)) then perform concierge.fail('invalid_input');end if;
 for c in select value from jsonb_array_elements(cards) loop
  if c->>'kind'='no_addition' then
   if c->'recommendationId'<>'null'::jsonb or c->'currentProduct'<>'null'::jsonb or c->'proposedProduct'<>'null'::jsonb or c->'usage'<>'null'::jsonb then perform concierge.fail('invalid_input');end if;
  else
   if c->'currentProduct'='null'::jsonb or c->'usage'='null'::jsonb then perform concierge.fail('invalid_input');end if;
   if c->>'kind'='keep' then
    if c->'recommendationId'<>'null'::jsonb or c->'proposedProduct'<>'null'::jsonb then perform concierge.fail('invalid_input');end if;
   elsif c->'proposedProduct'='null'::jsonb or (c->>'kind'='replace' and c->'recommendationId'='null'::jsonb) then perform concierge.fail('invalid_input');end if;
   if c->'recommendationId'='null'::jsonb and not exists(select 1 from jsonb_array_elements(baseline)j(b) where b->>'slot'=c->>'slot' and b->>'productId'=c->'currentProduct'->>'id') then perform concierge.fail('invalid_input');end if;
  end if;
 end loop;
 if recs is not null then
  if (select count(*) from jsonb_array_elements(cards)j(x) where x->>'recommendationId' is not null)<>jsonb_array_length(recs) then perform concierge.fail('invalid_input');end if;
  for r in select value from jsonb_array_elements(recs) loop
   select value into c from jsonb_array_elements(cards) where value->>'recommendationId'=r->>'id';
   if not found or c->>'slot' is distinct from r->>'slot' or c->'currentProduct'->>'id' is distinct from r->>'currentProductId' or c->'proposedProduct'->>'id' is distinct from r->>'proposedProductId' or c->'usage'='null'::jsonb then perform concierge.fail('invalid_input');end if;
   if c->'proposedProduct'->'displayPrice'<>'null'::jsonb and c->'proposedProduct'->'displayPrice'->'cents' is distinct from r->'priceCents' then perform concierge.fail('invalid_input');end if;
  end loop;
 end if;
 for g in select value from jsonb_array_elements(p->'routineGuides') union all select x->'how' from jsonb_array_elements(cards)j(x) loop
  pid:=g->>'productId';
  if pid is not null and not exists(select 1 from jsonb_array_elements(steps)j(x) where x->>'productId'=pid) and not exists(select 1 from jsonb_array_elements(cards)j(x) where x->'currentProduct'->>'id'=pid or x->'proposedProduct'->>'id'=pid) then perform concierge.fail('invalid_input');end if;
 end loop;
end $$;

-- Preserve prior transitions privately. Public legacy calls fail closed only
-- where their fixed R1 format would discard authored R2 presentation.
alter function public.concierge_write(uuid,text,bigint,uuid,jsonb) set schema concierge;
alter function concierge.concierge_write(uuid,text,bigint,uuid,jsonb) rename to r1_workflow_write;
alter function public.concierge_advisor_write(uuid,text,bigint,uuid,jsonb) set schema concierge;
alter function concierge.concierge_advisor_write(uuid,text,bigint,uuid,jsonb) rename to r1_advisor_write;
create function concierge.has_presentation(c uuid) returns boolean language sql set search_path='' as $$
 select exists(select 1 from concierge.intake_presentations where client_id=c) or exists(select 1 from concierge.draft_presentations where client_id=c) or exists(select 1 from concierge.publication_presentations where client_id=c)
$$;
create function public.concierge_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if p_action in ('save_draft','publish') then
  perform concierge.access(p_client_id,case when p_action='publish' then 'publish' else 'edit' end,true);
  perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||auth.uid()::text||':'||p_request_id::text,0));
  perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));
  if concierge.has_presentation(p_client_id) then perform concierge.fail('content_version_required');end if;
 end if;
 return concierge.r1_workflow_write(p_client_id,p_action,p_expected_revision,p_request_id,p_payload);
end $$;
create function public.concierge_advisor_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 perform concierge.access(p_client_id,'edit',true);
 if p_action='save_intake' then
  perform pg_advisory_xact_lock(hashtextextended('concierge:request:'||auth.uid()::text||':'||p_request_id::text,0));
  perform pg_advisory_xact_lock(hashtextextended('concierge:client:'||p_client_id::text,0));
  if concierge.has_presentation(p_client_id) then perform concierge.fail('content_version_required');end if;
 end if;
 return concierge.r1_advisor_write(p_client_id,p_action,p_expected_revision,p_request_id,p_payload);
end $$;
create function public.concierge_presentation_write(p_client_id uuid,p_action text,p_expected_revision bigint,p_request_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid;prior jsonb;c concierge.cases;baseline jsonb;r jsonb;iv integer;result jsonb;p jsonb;g text;n text;begin
 if p_action is null or p_action not in ('save_intake_v2','save_draft_v2','publish_v2') then perform concierge.fail('invalid_input');end if;
 u:=concierge.access(p_client_id,case when p_action='publish_v2' then 'publish' else 'edit' end,true);
 prior:=concierge.workflow_begin(u,p_client_id,p_request_id,'presentation',p_action,p_expected_revision,p_payload);if prior is not null then return prior;end if;
 select * into c from concierge.cases where client_id=p_client_id for update;
 if c.revision<>p_expected_revision then perform concierge.fail('revision_conflict');end if;
 if p_action='save_intake_v2' then
  perform concierge.keys(p_payload,array['goal','note','baseline','presentation']);g:=concierge.txt(p_payload,'goal',300);n:=concierge.txt(p_payload,'note',4000,true);baseline:=p_payload->'baseline';
  if jsonb_typeof(baseline) is distinct from 'array' then perform concierge.fail('invalid_input');end if;
  if jsonb_array_length(baseline) not between 1 and 50 or (select count(distinct x->>'slot') from jsonb_array_elements(baseline)j(x))<>jsonb_array_length(baseline) then perform concierge.fail('invalid_input');end if;
  for r in select value from jsonb_array_elements(baseline) loop
   perform concierge.keys(r,array['slot','productId']);perform concierge.identifier(concierge.txt(r,'slot',100));perform concierge.identifier(concierge.txt(r,'productId',100));
  end loop;
  if exists(select 1 from concierge.intakes where client_id=p_client_id) and ((select count(*) from concierge.baselines where client_id=p_client_id)<>jsonb_array_length(baseline) or exists(select 1 from concierge.baselines b where b.client_id=p_client_id and not exists(select 1 from jsonb_array_elements(baseline)j(x) where x->>'slot'=b.slot and x->>'productId'=b.product_id))) then perform concierge.fail('baseline_conflict');end if;
  perform concierge.validate_presentation(p_payload->'presentation',baseline,null,true);
  insert into concierge.baselines select p_client_id,x->>'slot',x->>'productId' from jsonb_array_elements(baseline)j(x) on conflict do nothing;
  select coalesce(max(version),0)+1 into iv from concierge.intakes where client_id=p_client_id;
  insert into concierge.intakes(client_id,version,goal,note) values(p_client_id,iv,g,n);
  insert into concierge.intake_presentations values(p_client_id,iv,p_payload->'presentation');
  update concierge.cases set revision=revision+1 where client_id=p_client_id;
 elsif p_action='save_draft_v2' then
  perform concierge.keys(p_payload,array['intakeVersion','recommendations','advisorNote','presentation']);
  select coalesce(jsonb_agg(jsonb_build_object('slot',slot,'productId',product_id)),'[]') into baseline from concierge.baselines where client_id=p_client_id;
  perform concierge.validate_items(p_payload->'recommendations');perform concierge.validate_presentation(p_payload->'presentation',baseline,p_payload->'recommendations');
  result:=concierge.r1_workflow_write(p_client_id,'save_draft',p_expected_revision,p_request_id,p_payload-'presentation');
  insert into concierge.draft_presentations values(p_client_id,(p_payload->>'intakeVersion')::integer,p_payload->'presentation') on conflict(client_id) do update set intake_version=excluded.intake_version,presentation=excluded.presentation;
 else
  perform concierge.keys(p_payload,array[]::text[]);
  select dp.presentation into p from concierge.draft_presentations dp join concierge.drafts d on d.client_id=dp.client_id and d.intake_version=dp.intake_version where dp.client_id=p_client_id;
  if not found then perform concierge.fail('content_version_required');end if;
  result:=concierge.r1_workflow_write(p_client_id,'publish',p_expected_revision,p_request_id,'{}');
  insert into concierge.publication_presentations values(p_client_id,(result->>'publishedVersion')::integer,p);
 end if;
 select * into c from concierge.cases where client_id=p_client_id;
 result:=jsonb_build_object('revision',c.revision,'publishedVersion',c.published_version,'operation',p_action);
 return concierge.workflow_finish(u,p_client_id,p_request_id,'presentation',p_action,p_expected_revision,p_payload,result);
end $$;

create function concierge.presentation_projection(c uuid,v jsonb,advisor boolean default false) returns jsonb language plpgsql set search_path='' as $$
declare plan jsonb:=v->'plan';history jsonb;baseline jsonb;baseline_version integer;active jsonb:='[]';r jsonb;s jsonb;p jsonb;card jsonb;guides jsonb;a concierge.activations;begin
 if plan<>'null'::jsonb then
  select presentation into p from concierge.publication_presentations where client_id=c and version=(plan->>'version')::integer;
  plan:=plan||jsonb_build_object('presentation',p);
 end if;
 select coalesce(jsonb_agg(x||jsonb_build_object('presentation',pp.presentation) order by n),'[]') into history from jsonb_array_elements(v->'history') with ordinality j(x,n)
 left join concierge.publication_presentations pp on pp.client_id=c and pp.version=(x->>'version')::integer;
 if plan<>'null'::jsonb then
  -- Earliest entitled rich baseline, never latest draft or an unpaid snapshot.
  select pp.presentation,pp.version into baseline,baseline_version from concierge.publication_presentations pp
   where pp.client_id=c and (advisor or exists(select 1 from concierge.entitled_publications e where e.client_id=c and e.version=pp.version and e.starts_on<=(now() at time zone 'America/Chicago')::date))
   order by pp.version limit 1;
  for r in select value from jsonb_array_elements(v->'routine') loop
   select ac.* into a from concierge.activations ac where ac.client_id=c and ac.slot=r->>'slot' and ac.started_on<=(now() at time zone 'UTC')::date
    and (advisor or exists(select 1 from concierge.entitled_publications e where e.client_id=c and e.version=ac.version and e.starts_on<=(now() at time zone 'America/Chicago')::date))
    order by ac.started_on desc,ac.id desc limit 1;
   if found then
    select presentation into p from concierge.publication_presentations where client_id=c and version=a.version;
    select value into card from jsonb_array_elements(p->'categoryCards') where value->>'recommendationId'=a.recommendation_id and value->'proposedProduct'->>'id'=r->>'productId';
    if card is null then continue;end if;
    s:=jsonb_build_object('id',(select x->>'id' from jsonb_array_elements(baseline->'baselineRoutine')j(x) where x->>'kind'='product' and x->>'slot'=a.slot),'kind','product','slot',a.slot,'productId',a.product_id,'product',card->'proposedProduct','title',card->'proposedProduct'->>'name','usage',card->'usage',
     'source',jsonb_build_object('kind','activation','publicationVersion',a.version,'recommendationId',a.recommendation_id));
    select coalesce(jsonb_agg(g),'[]') into guides from (select value g from jsonb_array_elements(p->'routineGuides') union all select card->'how')j
     where g->>'productId' is null or g->>'productId'=a.product_id;
   else
    select value into s from jsonb_array_elements(baseline->'baselineRoutine') where value->>'slot'=r->>'slot' and value->>'productId'=r->>'productId';
    if s is null then continue;end if;
    s:=s||jsonb_build_object('source',jsonb_build_object('kind','baseline','publicationVersion',baseline_version,'recommendationId',null));
    select coalesce(jsonb_agg(g),'[]') into guides from (select value g from jsonb_array_elements(baseline->'routineGuides') union all select value->'how' from jsonb_array_elements(baseline->'categoryCards') where value->'currentProduct'->>'id'=r->>'productId')j
     where g->>'productId' is null or g->>'productId'=r->>'productId';
   end if;
   active:=active||jsonb_build_array(s||jsonb_build_object('guides',guides));
  end loop;
  for s in select value from jsonb_array_elements(baseline->'baselineRoutine') where value->>'kind'='instruction' loop
   active:=active||jsonb_build_array(s||jsonb_build_object('source',jsonb_build_object('kind','baseline','publicationVersion',baseline_version,'recommendationId',null),'guides','[]'::jsonb));
  end loop;
 end if;
 return v||jsonb_build_object('schemaVersion',2,'plan',plan,'history',history,'activeRoutine',active);
end $$;
create function public.concierge_client_view_v2() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.actor();begin perform concierge.access(u);return concierge.presentation_projection(u,concierge.portal_projection(u));end $$;
create function public.concierge_advisor_view_v2(p_client_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.access(p_client_id,'view');v jsonb;i jsonb;d jsonb;notes jsonb;begin
 v:=concierge.r1_advisor_view(p_client_id);
 i:=v->'intake';d:=v->'draft';
 if i<>'null'::jsonb then i:=i||jsonb_build_object('presentation',(select presentation from concierge.intake_presentations where client_id=p_client_id and intake_version=(i->>'version')::integer));end if;
 if d<>'null'::jsonb then d:=d||jsonb_build_object('presentation',(select presentation from concierge.draft_presentations where client_id=p_client_id and intake_version=(d->>'intakeVersion')::integer));end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'kind',kind,'text',body,'createdAt',created_at) order by created_at,id),'[]') into notes from concierge.meeting_notes where client_id=p_client_id;
 return v||jsonb_build_object('client',concierge.presentation_projection(p_client_id,v->'client',true),'intake',i,'draft',d,'meetingNotes',notes);
end $$;
create or replace function public.concierge_client_view() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.actor();v jsonb;begin
 perform concierge.access(u);v:=concierge.portal_projection(u);
 if exists(select 1 from concierge.publication_presentations pp where pp.client_id=u and (pp.version=(v->'plan'->>'version')::integer or exists(select 1 from jsonb_array_elements(v->'history')j(x) where (x->>'version')::integer=pp.version))) then perform concierge.fail('content_version_required');end if;
 return v;
end $$;
create or replace function public.concierge_advisor_view(p_client_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=concierge.access(p_client_id,'view');v jsonb;notes jsonb;begin
 perform 1 from concierge.cases where client_id=p_client_id for share;
 if concierge.has_presentation(p_client_id) then perform concierge.fail('content_version_required');end if;
 v:=concierge.r1_advisor_view(p_client_id);
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'kind',kind,'text',body,'createdAt',created_at) order by created_at,id),'[]') into notes from concierge.meeting_notes where client_id=p_client_id;
 return v||jsonb_build_object('meetingNotes',notes);
end $$;
do $$ declare t text;f regprocedure;begin
 foreach t in array array['intake_presentations','draft_presentations','publication_presentations'] loop
  execute format('alter table concierge.%I enable row level security',t);
  execute format('revoke all on concierge.%I from public,anon,authenticated,service_role',t);
 end loop;
 for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('concierge_client_view','concierge_advisor_view','concierge_write','concierge_advisor_write','concierge_client_view_v2','concierge_advisor_view_v2','concierge_presentation_write') loop
  execute format('revoke all on function %s from public,anon,service_role',f);
  execute format('grant execute on function %s to authenticated',f);
 end loop;
end $$;
revoke all on all functions in schema concierge from public,anon,authenticated,service_role;
commit;
