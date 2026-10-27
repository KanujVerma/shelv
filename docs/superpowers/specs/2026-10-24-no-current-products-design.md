# Explicit no-current-products consultation

Owner: Kanuj

## Approved outcome

A founder may save a consultation for a client who explicitly confirmed that they currently use no skincare products. The consultation remains human-led. No questionnaire, automated skin analysis, placeholder product or invented routine instruction is introduced.

## Representation and compatibility

R2 intake and plan presentations gain optional `currentProductsStatus: 'none' | 'recorded'`. It describes that snapshot's reviewed baseline, not the client's forever-current routine. A presentation with zero product steps requires explicit `none`, including an instruction-only presentation. `none` with product steps is invalid. `recorded` requires a product step. Missing status continues to accept historical nonempty product baselines; it means unreviewed for an empty baseline and cannot be saved. Unknown statuses are invalid.

The founder chooses the confirmation in the consultation editor. It never removes product steps; it is disabled while products exist and after the original consultation baseline is saved. Original product identity remains fixed. Authenticated client self-service and legacy intake commands retain their existing nonempty rule. Each draft/publication preserves its own reviewed baseline status. A follow-up plan with actual started products records them without changing the original intake confirmation.

## Routine and product journey

Real first products use the existing Maya `addition` contract: null current product, a real proposed product, price, usage and purchase recommendation identity. A card without a current product cannot contain comparisons against an invented comparator. Facts and proposed-product guidance remain available. Approval, service payment, product funding and receipt leave the effective routine empty. Only explicit client Start adds the intended slot and preserves any other slots.

The client routine shows a clear empty state when the active routine contains no steps and the original baseline was confirmed as none. Actual authored nonproduct instructions remain visible. Once Start creates an active product, the empty state disappears even though immutable historical baseline confirmation remains none.

## Authority and invariants

The forward migration follows `20261024234059_concierge_manual_payment_methods.sql`. Older installed migrations remain unchanged. Existing owner, edit, publish, revoked-access, revision, exact-retry, publication immutability and private-note fences remain in force. No finance code, provider configuration, hosted data, email, funds, commits, pushes or deployments are changed.

## Follow-up authoring context

After publication, a new founder plan starts with the server's actual active product metadata and usage, not the original intake's product IDs. Optional `routineBasis.products` records each product's slot, identity and immutable baseline/activation source (`kind`, `publicationVersion`, `recommendationId`), sorted by ASCII slot order, with explicit C collation in SQL. No new action names or permissions are introduced. The server compares this basis to its current projection under the existing client transaction lock, at both save and publish. The presentation baseline must match those products. After a Start exists, new drafts and publication require this explicit basis; old published snapshots remain readable.

The original `concierge.baselines`, intake snapshots and published presentations are never rewritten. The effective routine continues to use original baseline directions or the publication that authorized the actual Start, including while a later replacement is approved, funded or received. New baseline product rows cannot duplicate an already-started addition. A client Start during drafting makes the saved basis stale and publication fails until the founder authors against current reality. After loading the current record, an explicit Use current routine action can replace editable plan content with a fresh current-routine shell. It asks the founder to copy any plan text they want to retain, preserves their private draft note, clears purchase decisions/comparisons for deliberate reauthoring, and makes no client changes until save/publication.

## Verification

Test-first coverage includes unreviewed empty rejection, explicit none acceptance, contradictions, unknown status, no fabricated comparisons/products, actual SQL/handler intake save/reopen/draft/preview/publish, service and product quotes for all three configured manual methods, decisions/receipt/Start, permissions/revocation/revisions/idempotency/privacy, historical nonempty acceptance, and follow-up republish preserving activation directions. Native SQL uses its own Unix-socket-only cluster and supports `CONCIERGE_TEST_PG_BIN`. Browser tests intercept all local requests and reject unexpected network activity. Screenshots cover 320, 390 and 1440 pixels.

## Local Start-date display

The Start form defaults and limits its visible date to the device-local calendar day. A Chicago evening after UTC midnight must not suggest tomorrow. A chosen past date is sent unchanged. Historical backend UTC activation and exact-retry rules remain unchanged.
