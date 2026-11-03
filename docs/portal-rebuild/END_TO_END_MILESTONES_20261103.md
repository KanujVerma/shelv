# End-to-end delivery milestones

Owner: Kanuj / coordinator. This execution schedule changes neither the full D01–D48 specification, the 26 approved frames, the ten required journeys, nor any authorization or evidence policy. There is one existing goal and one Root integration authority. Milestone IDs are stable identifiers, not a promise of numeric execution order.

## Acceptance accounting

At this checkpoint: **0 completed bounded capabilities; 0 fully accepted screens / 26; 0 complete accepted journeys / 10.** Mounted24/26 and complete frame-local SOURCE wiring12/26 are separate implementation counts. A capability receipt never automatically accepts its containing screen or journey. Every frame retains its own mounted, fully source-wired, browser-verified and accepted states in the [screen inventory](acceptance/CURRENT_SCREEN_INVENTORY_20261102.json) and [acceptance matrix](ACCEPTANCE_MATRIX.md).

A milestone is accepted only after its reviewed implementation is integrated, applicable tests/types pass, the actual current revision runs against authorized real isolated persistence, the principal browser flow plus refresh/recovery and authorization negatives pass, canonical persistent effects or absence of effects are correlated with requests, relevant visual/a11y checks pass, and independent verification approves the complete evidence. Record exact source, environment, actors, requests, revisions, receipts, captures, raw failures, resource custody and review. Unknown or unrun checks keep the milestone open. Source, finite HTTP, synthetic browser, CI and release proof remain distinct.

## M01: own Account profile persistence — executing

- User action/outcome: sign in normally, read own name, save the exact Unicode/whitespace name, reread canonically, refresh, sign out and sign in again to the persisted value.
- Exact affected frame: C08 Account and its existing edit-details dialog/secondary route. This does not accept all Account, cancellation, contact, export, service or C08R requirements.
- Owner: coordinator, with exclusive fixture, host and verification lanes. Source/controller/persistence: actual Account entry/details, profile controller, cookie gateway, ClientProvider/SQLite Vault and canonical account-profile SQL command/head/journal. No clinical-plan prerequisite.
- Dependencies: real isolated R8 Auth/DB with all68 migrations, actual A/B users, reviewed workerd-compatible private transport and versioned same-live host update preserving DB, sessions, keys and Vault state.
- Tests: exact save and receipt/head/revision correlation; refresh/re-login; positive B own read and no A disclosure; wrong-owner/selector, same-origin/CSRF and ended/expired session denial; interrupted-save outcome/recovery using the same original request; actual bytes returning after logout must not revive state; no denied write effects. Check keyboard/dialog focus, accessible names, narrow layout and relevant approved frame appearance.
- Independent review/integration gate: transport R1 WDPR1 failure is preserved. Corrected772c complete-seven R2 Source gate passes; primary87/87 and independent96/96. Parent actual Root87/87+gateway24/24 are separate. Versioned fixture/host source and resource grants need their own review before execution. Final acceptance additionally requires independent review of real browser/SQL evidence on the integrated revision.
- Current outcome: normal TLS/CLI bootstrap,68 migrations and genuine A login succeeded. First profile read returned503 before any name write. Workerd rejects `redirect: error`; the corrected manual mode explicitly refuses redirects and retires late responses. The failed browser capture is preserved; its dynamic private scan passed, its browser process joined, and code1 host closed with no uncertainty. R8 DB remains live; no reset/reseed or fixture stop occurred. **Not accepted.**

## M02: recorded Orders ownership and persistence

- User action/outcome: read actual recorded purchases/returns, open the recorded item, refresh/re-login and retain the same owner-bound history.
- Exact affected frames: bounded recorded-history portions of C06/C06D and their existing secondary details. Quotes, purchases, fulfillment, delivery and Start remain separate requirements.
- Owner: Orders lane; coordinator owns integration, optional test-data application and serialized browser custody.
- Source/controller/persistence: existing Orders entry/read controller/view, strict fixed gateway/codec/handler, canonical purchases/returns/events/service head. Synthetic historical rows are explicitly test records, never money or fulfillment.
- Dependencies: M01 environment/auth continuity and separately reviewed optional seed plus read-only observation oracle. No seed runs during M01.
- Tests: actual row IDs/revision/markers agree with browser responses; refresh/re-login; A/B positive own views and negative cross-owner/selector/session access; baseline/final canonical and protected row digests unchanged across reads; no Start or financial inference. Check keyboard access, empty/error/history states and narrow layout.
- Gate/accepted criterion: source and SQL/role/seed review, relevant configured tests, actual browser plus before/after SQL evidence, and independent verification all pass at the exact integrated revision. Current source preparations are **not accepted**.

## M04: deliberate advisor publication to client plan

- User action/outcome: an authorized advisor prepares and reviews exact content, obtains exact approval and applicable verified first-service payment, deliberately publishes once, and the client receives the immutable current plan with transactional notification events.
- Exact affected frames: A00,A01,A02,A03,A04,A04P,A05,A06; C01/C01E; associated history/inbox secondary routes. A07 remains independently held and is not rerouted.
- Owner: publication lane; coordinator exclusively arranges reviewed actual synthetic advisor permissions, canonical test financial records and integration.
- Source/controller/persistence: actual advisor-plan route/controller and closed PlanCommand; canonical approval, payment-v2, publication, entitlement, document, receipt, event and portal/email outbox writers. No inserted successful publication/approval/outbox surrogate, no actual email send or real funds.
- Dependencies: M01 auth/environment continuity; approved synthetic advisor/viewer principals and real canonical quote/claim/confirmation inputs. Missing prerequisites produce explicit blocked results.
- Tests: missing approval/payment, wrong role/client, stale CAS and replay refuse or preserve exact original effects; one deliberate UI publication yields the actual immutable version/receipt/event/delivery IDs; refresh and client read agree; notification failure cannot republish. Check review diff, disabled gates, accessible actions and narrow layout.
- Gate/accepted criterion: producer and consumer review plus actual roles/RLS, browser, canonical transaction/outbox and replay/no-effect evidence independently pass on the integrated revision. Returned records remain observations until that gate. **Not accepted.**

## M03: own notification inbox acknowledgement

- User action/outcome: open an actual own publication notification, follow its safe client destination, mark it seen, and retain seen state after refresh/re-login.
- Exact affected approved frames: C01/C01E bell; `/notifications` and historical-version destinations are secondary routes, not a 27th frame.
- Owner: notification lane; coordinator integrates and grants serialized actual persistence/browser work.
- Source/controller/persistence: existing inbox controller, fixed notification gateway and canonical events/deliveries/head/request journal. Consume M04's actual publication event and portal delivery IDs; no fabricated plan or email delivery claim.
- Dependencies: M04 produces canonical event/delivery records. Source implementation can proceed in parallel; execution waits for those records.
- Tests: actual before/seen/replay/owner-denial/session-denial/re-login SQL snapshots correlate with browser request IDs; A/B positive own inbox and cross-owner refusal; no duplicate acknowledgement effects; no private payload leakage. Check bell/dialog focus, list/live-state announcements, safe link and narrow layout.
- Gate/accepted criterion: reviewed code, actual browser and SQL acknowledgement/replay/no-effect evidence and independent verification pass at the integrated revision. Email sending/retry remains separate. **Not accepted.**

## M05: immutable client history snapshot

- User action/outcome: open an actual prior plan version, refresh/deep-link/Back to it, and observe unchanged historical bytes after a newer deliberate publication.
- Exact affected frame: C04 and existing historical-version secondary routes.
- Owner: history lane; coordinator integrates and controls publication/browser sequencing.
- Source/controller/persistence: actual ClientHistory/controller, fixed plan/history commands, canonical publication/document/receipt and current head. No generated care plan or successful authority substitute.
- Dependencies: M04 produces the selected actor's actual older and newer versions. B positive own publication or verified unavailable state is explicit.
- Tests: real canonical JSONB UTF8 snapshot/hash remains unchanged; current head advances only through canonical publication; invalid/missing versions, wrong-owner/session and retained callbacks after leaving refuse private content. Browser refresh, deep links, Back, keyboard history controls, error state and narrow layout must pass.
- Gate/accepted criterion: reviewed source, actual immutable before/after SQL and browser observations plus owner/session/route negatives independently pass at the integrated revision. **Not accepted.**

## Remaining scheduling and integration

Next execution sequence is M01, M02, then M04 feeding M03 and M05. Source preparation is concurrent with disjoint ownership. Consent, Sources, check-in/review, recommendations/product/actual use, service/cancellation, read-only/export/unfinished administration, permissions and Maya will be decomposed into similarly bounded milestones before dispatch/execution. Their complete master requirements remain in the approved specification and acceptance matrix; this schedule neither removes them nor promotes partial evidence. Guidance private return, M65 and provider-refused photo holds remain held.

Only coordinator edits shared runtime/auth/routes, migration order, Root composition, resource grants and release state. Up to seven useful isolated Sol/xhigh/default children may implement/review disjoint critical-path work. Terminal, queued or waiting lanes are not counted as executing. Each new independent review is a new task; reports are only required integration/CI/genuine gates. Refill a returned slot when independent useful work exists.

Current implementation allocation: fixture live-code binding; host state-preserving code update; independent transport review (now returned); Orders oracle; publication; notification acknowledgement; history. Literal task IDs and exclusive write sets belong in TASKS.json and the preserved dispatch receipts. No extra coordinator or competing native goal is created.
