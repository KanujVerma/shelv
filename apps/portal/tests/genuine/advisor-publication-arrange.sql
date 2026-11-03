-- M04 OPTIONAL TEST SOURCE ONLY. Despite the allocated filename, NO ARRANGE
-- writes occur here. Parent owns fresh synthetic setup, actual Auth, principal
-- enrollment and canonical quote/claim operations after independent review.
-- SOURCE ONLY: this file has NOT been parsed or run against any database.
--
-- Parent's reviewed read-only connection must supply actual observed UUIDs as
-- psql variables client_id, draft_id, quote_id, claim_id. Never guess IDs.
-- Capture one JSON result before/after EACH denial, before/after publication,
-- and after exact replay. before-publication is AFTER canonical synthetic
-- receipt confirmation; its service period must still have NULL dates.
-- No provider delivery/claim worker may run between after/replay snapshots.
-- This diagnostic connection is never the browser's client or write path.
\set ON_ERROR_STOP on
\set QUIET on
\pset tuples_only on
\pset format unaligned

begin transaction isolation level repeatable read read only;
set local time zone 'UTC';

with input as (
  select :'client_id'::uuid as client_id, :'draft_id'::uuid as draft_id,
         :'quote_id'::uuid as quote_id, :'claim_id'::uuid as claim_id
)
select jsonb_build_object(
  'schemaVersion', 1,
  'clientId', i.client_id,
  'draftId', i.draft_id,
  'caseRevision', (select c.revision from concierge.cases c where c.client_id = i.client_id),
  'publishedVersion', (select c.published_version from concierge.cases c where c.client_id = i.client_id),
  'draft', (
    select jsonb_build_object(
      'id', d.id, 'clientId', d.client_id, 'contentRevision', d.content_revision,
      'assignmentRevision', d.assignment_revision, 'state', d.state,
      'target', concierge.plan_exact(d)
    ) from concierge.plan_drafts d where d.id = i.draft_id and d.client_id = i.client_id
  ),
  'expectedDocument', (
    select concierge.plan_client_content(p.content)
    from concierge.plan_draft_private p join concierge.plan_drafts d on d.id = p.draft_id
    where d.id = i.draft_id and d.client_id = i.client_id
  ),
  'publications', coalesce((
    select jsonb_agg(jsonb_build_object(
      'clientId', p.client_id, 'version', p.version, 'publishedAt', p.published_at,
      'publishedBy', p.published_by, 'documentSchemaVersion', p.document_schema_version
    ) order by p.version) from concierge.publications p where p.client_id = i.client_id
  ), '[]'::jsonb),
  'documents', coalesce((
    select jsonb_agg(jsonb_build_object(
      'clientId', d.client_id, 'version', d.version, 'document', d.document,
      'approvalId', d.approval_id, 'receiptId', d.receipt_id
    ) order by d.version) from concierge.plan_documents d where d.client_id = i.client_id
  ), '[]'::jsonb),
  'receipts', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id, 'approvalId', r.approval_id, 'clientId', r.client_id,
      'version', r.version, 'actorId', r.actor_id, 'requestId', r.request_id,
      'firstServiceClaimId', r.first_service_claim_id, 'eventId', r.event_id,
      'receipt', r.receipt
    ) order by r.version) from concierge.plan_publication_receipts r where r.client_id = i.client_id
  ), '[]'::jsonb),
  'approvals', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id, 'target', a.target, 'publisher', a.publisher, 'scope', a.scope,
      'approvedBy', a.approved_by, 'approvedAt', a.approved_at,
      'revoked', exists(select 1 from concierge.plan_approval_revocations r where r.approval_id = a.id)
    ) order by a.id) from concierge.plan_approvals a where a.draft_id = i.draft_id
  ), '[]'::jsonb),
  'events', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', e.id, 'clientId', e.client_id, 'publicationVersion', e.publication_version,
      'kind', e.kind, 'sourceKind', e.source_kind
    ) order by e.id) from concierge.plan_events e where e.client_id = i.client_id
  ), '[]'::jsonb),
  'deliveries', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', d.id, 'eventId', d.event_id, 'recipientId', d.recipient_id,
      'channel', d.channel, 'status', d.status, 'revision', d.revision,
      'attempts', d.attempts, 'seenAt', d.seen_at
    ) order by d.id) from concierge.plan_deliveries d
    join concierge.plan_events e on e.id = d.event_id where e.client_id = i.client_id
  ), '[]'::jsonb),
  'entitlements', coalesce((
    select jsonb_agg(jsonb_build_object(
      'clientId', e.client_id, 'version', e.version, 'claimId', e.claim_id, 'startsOn', e.starts_on
    ) order by e.version) from concierge.entitled_publications e where e.client_id = i.client_id
  ), '[]'::jsonb),
  'requests', coalesce((
    select jsonb_agg(jsonb_build_object(
      'actorId', r.actor_id, 'requestId', r.request_id, 'command', r.command, 'result', r.result
    ) order by r.request_id) from concierge.plan_requests r
    where r.scope_client_id = i.client_id and r.command ->> 'action' = 'publish_plan_v1'
  ), '[]'::jsonb),
  'servicePeriods', coalesce((
    select jsonb_agg(jsonb_build_object(
      'claimId', s.claim_id, 'clientId', s.client_id, 'startsOn', s.starts_on, 'endsOn', s.ends_on
    ) order by s.claim_id) from concierge.service_periods s where s.client_id = i.client_id
  ), '[]'::jsonb),
  'reviewSchedules', coalesce((
    select jsonb_agg(jsonb_build_object(
      'clientId', s.client_id, 'firstPublicationAt', s.first_publication_at,
      'twoWeekOn', s.two_week_on, 'monthOneOn', s.month_one_on,
      'monthTwoOn', s.month_two_on, 'monthThreeOn', s.month_three_on
    ) order by s.client_id) from concierge.plan_review_schedule s where s.client_id = i.client_id
  ), '[]'::jsonb),
  'actualStarts', (select count(*) from concierge.activations a where a.client_id = i.client_id),
  'payment', (
    select jsonb_build_object(
      'quoteId', q.id, 'quoteClientId', q.client_id, 'publicationVersion', q.publication_version,
      'quoteStatus', qs.status, 'serviceCents', (q.money ->> 'serviceCents')::bigint,
      'productCents', (q.money ->> 'productTotalCents')::bigint,
      'totalCents', (q.money ->> 'totalCents')::bigint,
      'claimId', c.id, 'claimClientId', c.client_id, 'claimQuoteId', c.quote_id,
      'claimStatus', cs.status, 'paymentOptionId', po.id,
      'confirmedBy', pc.advisor_id, 'confirmedAt', pc.confirmed_at,
      'confirmationClientId', pc.client_id, 'confirmationQuoteId', pc.quote_id,
      'confirmedServiceCents', pc.service_cents, 'confirmedProductCents', pc.product_cents,
      'confirmedTotalCents', pc.total_cents
    ) from concierge.quotes q
    join concierge.quote_states qs on qs.quote_id = q.id
    join concierge.claims c on c.id = i.claim_id and c.client_id = q.client_id and c.quote_id = q.id
    join concierge.claim_states cs on cs.claim_id = c.id
    join concierge.payment_claim_options co on co.claim_id = c.id and co.client_id = c.client_id and co.quote_id = q.id
    join concierge.payment_quote_options po on po.id = co.option_id and po.client_id = c.client_id and po.quote_id = q.id
    left join concierge.payment_confirmations pc on pc.claim_id = c.id
    where q.id = i.quote_id and q.client_id = i.client_id
  )
) as m04_observation from input i;

rollback;
