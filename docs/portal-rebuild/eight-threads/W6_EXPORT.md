# W6 static final-export consumer

Owner: Kanuj. Source candidate only. Worktree `/Users/kanuj/.t3/worktrees/shelv/kanuj-w6-account-export-20261103`, branch `kanuj/w6-account-export-20261103`, base `c075cbd4ea4b2f4d75959370233745d07145c069`. The service candidate in PR215 and the primary checkout's thirteen uncommitted files remain unchanged.

## Goal and boundary

Implement the Account consumer for D38 and the [static-export addendum](../DECISION_ADDENDA.md#static-final-export-after-the-read-only-window-1-november-2026), C08/C08C/C08R and J08. The last-entitled static public plan/instructions remain downloadable after interactive care access expires. Actual own-client authentication, trusted entitlement selection, server privacy, registration and final return remain mandatory. An export does not restore care access or support.

This slice adds no producer, SQL, route, auth flow, financial logic, Source authority or new global browser type. W0 owns the missing fixed request/namespace/Account lifetime. The existing canonical `PortalFinalExport*` protocol and serializer are retained. Physical browser file delivery, genuine Auth/SQL and complete frame/journey acceptance remain unrun.

## Implementation

Six owned consumer files start from exact `e949c9cc4a352c57d0aebb796c175370f72bd052` postimages. Only `controller.ts` and `writer.ts` change behavior:

- AFEC1: track the actual writer-acquisition promise. A settled acquisition failure with no stream leaves the writer unopened and permits a new explicit attempt. Cancellation while acquisition is outstanding remains unconfirmed until the late stream settles and its owned abort acknowledges. The retired attempt may publish only its own cleanup disposition, never resume content work or overwrite a newer attempt.
- AFEC2: recheck the exact attempt/client readiness after reading and binding the optional picker capability, before unavailable/saving publication or dispatch. Reentrant cancel/dispose remains terminal even when the capability getter returns a function or no capability.
- Preserve the original rejection of overlapping/reentrant abort calls. Returning the active cleanup promise would allow a backing abort to await itself. Preserve immediate acquisition dispatch while the original currentness check holds; do not defer a new backing call past retirement.

The collector validates the complete framed public record and final manifest before close. The result is only `browser-writer-close-acknowledged`, never asserted physical durability, erasure or recalled bytes. Unknown close or abort outcomes remain explicit and block inappropriate new attempts. No browser storage, aggregate Blob, credential, private source or advisor note is added.

## Source test construction

New `w6-account-export-*` tests/helpers use actual consumer, ApplicationSession/cookie, Root codecs, collector, serializer and shared React wrappers. Controlled HTTP/file methods are synthetic. Global unexpected fetch is denied. No server, browser, workerd, Auth, database or backing file is acquired.

The fixture copies the complete imported source closure into this checkout's ignored `.local-artifacts/w6-account-export/`. It records every selected file/hash. Two inputs are qualified explicitly: the retained unregistered constructor is pinned to c075 for historical negative controls, and the one missing W0 `app/final-export-request.ts` is exact e949 source until admitted. No shared working product file changes and no successful authorization/currentness port replaces production logic. A projected request is not registration or genuine authority.

Those two public source inputs are committed as inert `.txt` snapshots under the new test-only `w6-account-export-inputs/` directory and checked against their exact SHA-256 values. The fixture does not require foreign Git objects in a shallow CI checkout. Current admitted request source is used when present; the snapshot supplies only the explicitly missing dependency, never a real registered endpoint. This test-setup successor changes no consumer postimage or scenario assertion.

The original e949 consumer suite is retained with one explicit late-open coordination successor. The old test awaited abort before releasing acquisition. Under the AFEC1 requirement, cleanup cannot acknowledge before acquisition settles, so that original run timed out. The successor captures cleanup, asserts it has not acknowledged early, releases acquisition, then joins cleanup and preserves every original abort-count/no-close/open-rejection assertion. No predicate is removed, skipped or filtered.

The retained SSR predicates change only source-root/dependency binding: one owned locked React/compiler location supplies both renderer and components. Browser-target compilation uses `write:false` and is source evidence, not browser execution.

## Observed proof

All commands use explicit Node 22.23.0. Local raw evidence is outside Git under `.local-artifacts/w6-account-export/` in this export checkout.

| Raw evidence | Observed result |
| --- | --- |
| `recovery-OLD-e949.log` | Exact old e949 consumer, same six AFEC cases: 0/6, exit1. |
| `abort-reentry-OLD.log` | Initial owner correction incorrectly joined overlapping/reentrant cleanup: 0/2. Preserved, then original rejection restored. |
| `acquisition-dispatch-OLD.log` | Intermediate correction deferred acquisition: 2/3. Preserved, then original immediate dispatch restored. |
| `consumer-RETAINED-ORIGINAL-timeout.log` | 27 passed before original late-open coordination timed out; one cancelled file, not a full pass. |
| `consumer-CURRENT.log` | 45/45: retained 36-case successor, AFEC six, three abort/acquisition regressions. No failure/cancel/skip. |
| `ssr-CURRENT.log` | 5/5 retained SSR/browser-target source assertions. No browser or filesystem delivery. |
| `frontend-UNINTEGRATED.log` | Actual configured frontend is missing W0's final-export request; not green. |
| `frontend-PROJECTED.log` | Zero diagnostics in the separate exact configured strict graph with only the pinned missing request input; full dependency hashes are in `TYPE-PROJECTION.json`. Not actual integration acceptance. |
| `shallow-OLD-setup.log` | Original fixture helper fails in a real depth-one clone without the c075/e949 objects. This is test setup, not a product regression. |
| `shallow-CURRENT.log` | The self-contained successor passes all 50 cases in that same shallow checkout, exit0; original helper restored to the exact current bytes before execution. `SHALLOW.json` and `SHALLOW-PROOF.json` bind the absent objects, head, commands and outputs. |

The primary Account Name files and accepted M01 evidence are untouched. No test or source evidence accepts a complete screen, J08, actual download or release.

## Repeated-retirement cleanup successor

Hosted Codex found P2 [4463701284](https://github.com/KanujVerma/shelv/pull/237#discussion_r4463701284) at exact `4bbb313d9053c6bb1e9134bfcc2612cd7a165a40`: cancel a pending writer acquisition, then suspend the actual session before cleanup finishes. The second retirement changes the presentation snapshot. The original snapshot-identity check then discards the late cleanup disposition and leaves saving blocked in `aborting`.

`retirement-OLD-4BBB.log` preserves the unchanged old controller with six original recovery passes and four new failures. The added cases cover cancel then offline, cancel then disposal, refused cleanup, and an already-running error-path cleanup followed by offline retirement. The original six-case file is an exact byte prefix; its assertions and all other retained scenarios are unchanged.

The controller now owns cleanup by the exact writer independently of presentation snapshots. Subsequent retirement keeps its latest phase while that writer's actual acknowledgement or uncertainty updates the cleanup disposition. New attempts remain blocked while cleanup is outstanding; acknowledgement never revives a disposed controller or grants session/content authority. A rejected overlapping abort does not settle the original cleanup. The original open/collection completion also reconciles its actual writer disposition, while the existing overlapping/reentrant abort rejection stays unchanged.

The first owner correction passed53/54 but still lost the already-running error-path cleanup. That result and its patch remain in `retirement-CURRENT.log` and `retirement-FIRST-FIX.patch`; they are not relabeled green. The corrected covering run in `retirement-R2-CURRENT.log` passes54/54 with zero failure/skip/cancel. These are source/finite/SSR results using the actual controller/session/writer with the same explicitly pinned missing request and historical unregistered constructor. The actual configured frontend still lacks W0's request. The prior W7 complete62f/ccb verdicts do not approve this behavioral successor; a fresh complete source gate is required.

## Next gates

### Actual published request binding, 5 November 2026

W0 published the distinct standalone request from `cd8b47334524d98b0f548ab1d1c98e8f97f990b9` through `970ba9e2`; the consumer reconciles normally against published `3f9e2527df9eefcdb3f762c746bd631c9fe6e171`. The actual unmodified frontend now exits0 with the physical request and no virtual declaration. The inert e949 request remains historical input, not the actual binding. Namespace registration, registered invoke/decode/HTTP-denial/private-return behavior, producer facts, entitlement and final-egress acceptance remain held.

The first unchanged consumer run on that actual binding is53/54 (`ACTUAL-BINDING-consumer54.log`): the factory correctly rejects a wrong-audience advisor synchronously at construction, before the old negative assertion receives its promise. The owned test-only successor moves that same factory/execute expression into the assertion's async thunk. Its exact401 predicate, selector/abort predicates, both no-egress call counts and every other scenario assertion remain unchanged. Six product modules and all other helpers/cases are unchanged. This setup correction and the new actual dependency require a new complete exact-head source/hosted gate; the earlier4dc/a646 source verdicts do not approve it.

These are current source captures, not recovery or relabeling of missing old AFEC/native/intermediate raw evidence. Source/finite/SSR and actual type success do not establish a registered export, a real destination, private exclusion or genuine post-window download.

- Freeze this exact owned delta and obtain W7 complete independent source review, including AFEC1/AFEC2, overlapping/reentrant cleanup and all retained predicates.
- W0 independently admits the fixed request/namespace and composes Account under the actual route/session lifetime. Recheck current configured types and affected tests without virtual inputs.
- W7 executes a separately admitted fresh packet: own-client final export after read-only expiry, cross-client/session/logout/late-return denials, trusted last-entitled version/instructions, no private data, actual destination/cleanup semantics, desktop/narrow/keyboard/accessibility and refresh/relogin.
- Exact-head hosted CI and native Codex review remain required before W0 integration. No main merge, deployment, real-client action or stopped-resource reuse is authorized.
