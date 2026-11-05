# M05: genuine client history observation assets

Owner: Kanuj. Date: 3 November 2026. Status: SOURCE implementation and built-in negative controls only; genuine execution pending M04, independent review, and a concrete Parent resource packet after M01. No C04, whole-decision, or journey acceptance increment.

Parent is the sole integrator at `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030`, inspected at `004c7a3a145f472f79c2bb6860ebf917798527b8`. This worktree is `/Users/kanuj/.t3/worktrees/shelv/t3-8b0c20b0`, branch `t3/client-history-milestone`, prepared INPUT ancestry `772c4fae7904e39a9e793627023adf56de811d8e` rather than Root. The relevant ClientHistory, History controller, routes, Review contracts, and publication/review SQL match exact Root; `git diff 004c7a3a145f472f79c2bb6860ebf917798527b8 HEAD --name-only -- <those paths>` returned no differences. No production source was imported or edited. Inspected Root blob IDs: ClientHistory `c785617a45de049b9d11819dd50e20adafdce582`; History controller `439e760bb64cf5a255f843015b156b4b9d289cdf`; ReviewMapping `917b81da881ae8e091c2414ff4864fa936367bbd`; original publication migration `9f9351c969acc1d143269274f6e144ece4e61f12`.

Literal returned taskId, forwarded separately by Parent:

```text
node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Amilestone-20261103-history-current-snapshot
```

Self and Parent `t3_thread_configure` READs, with `modelSelection` omitted, both returned `instanceId=codex`, `model=gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`. Explicit Node returned `v22.23.0`. No nested agent, browser, SDK, compiler, SQL parser, DB/Auth connection, server, network request, engine, or fixture query ran. The Supabase skill was consulted for the SQL artifact; the task's explicit source-only boundary forbids its network/query steps here.

## Scope and acceptance criteria

M01 is Account; M02 recorded Orders; M04 publication produces real M03 notification events and M05 immutable history. Numeric IDs do not prescribe execution order. Full 26-screen/D01-D48/10-journey scope remains unchanged.

Root inventory identifies C04 `498:304`, 1440x960, routes `/history`, `/history/:eventId`, `/history/versions/:version`. The historical version is a required C04 secondary flow using the shared client renderer, rather than a newly invented approved frame. D10/D14/D32/D38/D40/D46/D48 and the C04 return/denial requirements apply. C05-to-A07 review/amendment acceptance remains separate.

The eventual named capability requires:

1. An ordinarily UI-authenticated own client opens real published history, selects the exact version, and renders its canonical immutable plan. Refresh, a direct URL, the visible Back control, and browser Back retain the correct version or return to the actual history parent.
2. M04 deliberately publishes a newer version through its reviewed real path. The old publication/document UTF-8 bytes and hashes remain identical, while the current head and newer canonical receipt agree. Current reported use and current instruction heads are not falsely treated as frozen publication-time state.
3. A/B use their own actual Auth sessions. B needs its own publication or a verified unavailable positive control. Wrong owner, session-ended, and delayed bytes after leave/logout cannot disclose or restore private content. Those schedules are pending Parent's real helpers.
4. Every invalid positive version is observed absent in the canonical SQL oracle and receives a genuine denial; malformed routes retire the plan DOM. Every phase has real private-scan, capture, canonical-read, and exact network-read observations. Exceptions, errors, empty observations, and unresolved operations refuse the phase.
5. Independent verification binds the actual integrated code, owned resource packet, actors, SQL, browser observations, private-byte exclusions, screenshots/trace, and negatives. Source tests alone satisfy none of these runtime gates.

## Approved public ABI and publication dependency

The proposal was sent to Parent before exports. Parent approved the bounded ABI and then forwarded the actual descriptor shape. Its exact public v1 keys are:

```text
{schemaVersion:1, ownerId, projectId, fixtureDirectory, sourceCommit,
 endpoints:{portal,supabase,mailpit},
 actors:{a:{id,email,initialDisplayName},b:{id,email,initialDisplayName}},
 privateDirectory, fingerprints:{source,config,images,processes,resources}}
```

Values are strings except schemaVersion. This is shape information only. No Base/private/resource descriptor was read. No `generation`, `origin`, authorization flag, or invented currentness/context exists. Public fingerprint references and a copied sourceCommit are caller metadata, not verification of a running host.

Only `client-history.browser.mjs` exports:

- `validateHistoryInputs({descriptor, historyScenario})`: detached shape validation; throws on invalid input. It establishes neither resource custody nor publication/Auth success.
- `observeClientHistory({page, descriptor, historyScenario, phase, helpers, timeoutMs})`: caller-owned, already ordinarily UI-authenticated Page; phase is `before` or `after-new-publication`. It observes UI navigation and existing response events. It has no fetch, API login, response replacement, request interception, publication callback, or resource launcher.
- `compareHistoryObservations({descriptor, historyScenario, before, after})`: each side contains `{oracle, browser}`. Diagnostic comparisons return `kind: 'OBSERVATIONS_ONLY'`, observations, errors, and pending gates; no success/accepted/authorization flags.

`historyScenario` has exactly `{schemaVersion:1, publicationMilestoneId:'M04', actor:'a'|'b', publications:{a,b}, newPublication, invalidVersions}`. Each a/b value is null or `{older,current}`. Each publication reference is exactly `{version, publicationReceiptId, notificationEventId, documentSchemaVersion:3, markers:[actual rendered public strings]}`. `newPublication` is null until M04 supplies a genuinely newer receipt. One initial publication may fill both older/current with the same exact reference; B may be unknown. The selected actor requires a real initial publication. Immutability acceptance later requires distinct old and new versions. Different actors' observation markers must be distinct. Invalid positive candidates fit the actual PostgreSQL integer column and still require observed absence.

Root `publish_plan_v1` constructs `publicationReceiptId`, `publicationVersion`, and `notificationEventId` in the result, not a fabricated care-plan ID. `plan_documents.receipt_id` joins `plan_publication_receipts.id`; the actual receipt's `event_id` supplies the notification identity. The scenario `version` is populated from actual `publicationVersion`. Root publication identity is `(client_id, version)`; URL version alone is not owner authority. No actual M04 publication/receipt/event IDs are available to this lane yet.

Helpers are required and return exactly `{observations, errors}`, both arrays:

```text
privateScan({phase,page,descriptor})
capture({phase,page,descriptor})
captureCanonical(label)
```

Every helper requires nonempty observations. Canonical capture returns exactly one object emitted by the SQL artifact. Errors and thrown name/message are preserved on the phase; the phase also records a failure in top-level errors. The first helper refusal stops the phase before further capture/read helpers. A bounded observation deadline records a failure plus an explicit unjoined caller operation, rather than inventing completion. Parent must resolve those real handles. Missing helper functions refuse before observer attachment/navigation; claimed-success envelopes refuse at the first checkpoint. No owner/session/delayed-byte schedule is implemented with a placeholder.

## Read-only SQL and encoding

`client-history-observation.sql` is an unexecuted psql observation artifact, not a migration or seed. Parent supplies actual issued `a_id`, `b_id`, and `selection_json={"a":[actual versions plus invalid candidate],"b":[actual versions or empty]}`. Both clients must be distinct. No arbitrary client identifier is read beyond those A/B inputs. A repeatable-read, read-only transaction reads only `cases`, `publications`, `plan_documents`, and `plan_publication_receipts`, then rolls back. It emits both current heads and every requested row, including null-content absent rows. No client-facing command uses this privileged diagnostic query.

The encoding label is `PostgreSQL jsonb::text / UTF-8`. Snapshot text is the actual server expression `jsonb_build_object('publication',to_jsonb(p),'document',to_jsonb(d))::text` with UTC session timezone; document text is `d.document::text`. SHA-256 is calculated by the server over `convert_to(text,'UTF8')`. The module verifies those exact received strings against their hashes and compares their unchanged bytes across observations. JavaScript object-key sorting is used only to compare the parsed SQL document with the observed browser `plan.content`. JavaScript JSON serialization, SQLite JSON, raw browser wire bytes, and PostgreSQL JSONB text are not claimed to be interchangeable canonical encodings. Source-only controls do not authenticate the SQL producer.

The browser module captures raw response text and its separate wire hash, and requires matching actual selected-version reads for select/refresh/deep-link, actual own history-list versions/current head, and invalid-version denials. Async response reads are joined or explicitly marked unjoined; read exceptions remain errors. Captures over 2,000,000 UTF-8 bytes refuse observation rather than change the API. All actions remain read-only UI navigation. Invalid-version phases finish at the unavailable route; the caller owns subsequent ordinary navigation and cleanup.

## Verification record

All test invocations used cwd `/Users/kanuj/.t3/worktrees/shelv/t3-8b0c20b0` and exact argv:

```json
["/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node","--test","--test-reporter=spec","apps/portal/tests/genuine/client-history-oracle.test.mjs"]
```

| Stage | Exit | Raw result | Meaning |
| --- | --- | --- | --- |
| Initial permissive source scaffold | 1 | tests4, pass0, fail4, cancelled0, skipped0, todo0 | meaningful missing-refusal RED |
| First implementation | 0 | tests4, pass4, fail0, cancelled0, skipped0, todo0 | same four assertions GREEN |
| Expanded controls | 0 | tests37, pass37, fail0 | descriptor/hash/absence controls |
| Immutable/helper controls | 0 | tests49, pass49, fail0 | rehashed old-content and helper refusals |
| Event-read controls | 0 | tests54, pass54, fail0 | body/command read and selector/write refusal |
| Bounded observation controls | 0 | tests55, pass55, fail0, cancelled0, skipped0, todo0 | bounded caller-observation failure |
| Null boundary regression RED | 1 | tests57, pass55, fail2 | returned-shape violation reproduced |
| Null boundary correction GREEN | 0 | tests57, pass57, fail0 | same two assertions now refuse in observation envelope |
| Scan-stop regression RED | 1 | tests58, pass57, fail1 | captures after scan refusal reproduced |
| Scan-stop focused unchanged RED | 1 | tests1, pass0, fail1 | full raw failure preserved below |
| Final source controls GREEN | 0 | tests58, pass58, fail0, cancelled0, skipped0, todo0 | final built-in source controls |

The controls contain explicitly labeled constructed data and failure-only page surfaces. They issue no API success response, Auth credential, OperationPort success, fixture query, or successful browser transcript. Their valid SQL-shaped controls proceed only to the missing-genuine-browser refusal. SQL execution/parsing, application suites, TypeScript/build, browser/visual/a11y, real Auth/DB, and CI were not run under this grant.

Setup is separate: initial Git status was clean; explicit Node `--version` exited0. An exploratory unquoted source glob returned `zsh: no matches found`, and several source-only searches returned exit1/no matches; these are setup/read errors, not test RED or runtime defects. The first delete/add-in-one-file patch request was rejected before mutation; the subsequent update applied normally. The first staged `git diff --cached --check` exited2 on two trailing-whitespace lines inside terminal output; only trailing terminal spaces were removed from the displayed logs. Original raw tool output remains in the task transcript. Final `git diff --check` and `git diff --cached --check` exit0; staged name/stat inspection contains exactly the four owned new files (776 lines at that inspection), with no production/shared files.

<details><summary>Preserved initial source and raw meaningful RED/GREEN excerpt</summary>

Initial source, before implementation:

```js
// M05 source scaffold. No resource acquisition or execution on import.
export function validateHistoryInputs(input) { return input; }
export function compareHistoryObservations() { return {kind:'OBSERVATIONS_ONLY', observations:[], errors:[]}; }
export async function observeClientHistory() { return {kind:'OBSERVATIONS_ONLY', observations:[], errors:[]}; }
```

Original unchanged four assertions failed with these raw diagnostics (full tool output remains in this task's execution transcript):

```text
✖ missing actual descriptor and publication scenario refuse before any page use (0.585833ms)
✖ a claimed publication flag cannot replace canonical M04 receipt/version/event identities (0.077083ms)
✖ empty oracle/browser observations cannot report an error-free comparison (4.987917ms)
✖ missing page and helpers are a failed observation phase, never an optional pass (0.351333ms)
ℹ tests 4
ℹ suites 0
ℹ pass 0
ℹ fail 4
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 54.210625
AssertionError [ERR_ASSERTION]: Missing expected exception.
AssertionError [ERR_ASSERTION]: Missing expected exception.
AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
  assert.ok(result.errors.length > 0)
AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
  assert.ok(result.errors.length > 0)
```

First GREEN:

```text
✔ missing actual descriptor and publication scenario refuse before any page use (0.563416ms)
✔ a claimed publication flag cannot replace canonical M04 receipt/version/event identities (0.356917ms)
✔ empty oracle/browser observations cannot report an error-free comparison (0.406375ms)
✔ missing page and helpers are a failed observation phase, never an optional pass (0.268917ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 63.9845
```

</details>

<details><summary>Null boundary RED (full raw output); exit 1</summary>

```text
✔ missing actual descriptor and publication scenario refuse before any page use (0.835958ms)
✔ a claimed publication flag cannot replace canonical M04 receipt/version/event identities (0.163ms)
✔ empty oracle/browser observations cannot report an error-free comparison (0.178375ms)
✔ missing page and helpers are a failed observation phase, never an optional pass (0.240125ms)
✔ one actual publication shape and unknown B do not require invented second versions (0.898416ms)
✔ input refuses unknown descriptor authority flag (0.0895ms)
✔ input refuses alternate actor key (0.130333ms)
✔ input refuses private credential field (0.109667ms)
✔ input refuses nonliteral portal host (0.237ms)
✔ input refuses nonlocal portal endpoint (0.339417ms)
✔ input refuses duplicate actors (0.19425ms)
✔ input refuses missing actual publication (0.140875ms)
✔ input refuses no M04 lineage (0.06375ms)
✔ input refuses unknown receipt field (0.059ms)
✔ input refuses malformed receipt UUID (0.051958ms)
✔ input refuses nonpositive invalid-version candidate (0.099709ms)
✔ input refuses known version as invalid (0.067167ms)
✔ input refuses duplicate invalid-version candidates (0.056041ms)
✔ input refuses unsafe integer version (0.100875ms)
✔ input refuses positive candidate outside actual PostgreSQL version range (0.05625ms)
✔ input refuses rewound newer publication (0.058042ms)
✔ valid controlled bytes reach the missing-browser refusal, never fabricated browser success (0.961667ms)
✔ oracle refuses a row attributed to B with A bytes (0.125166ms)
✔ oracle refuses swapped actors (0.092708ms)
✔ oracle refuses missing current-head authority (0.146209ms)
✔ oracle refuses duplicate selected rows (0.104166ms)
✔ oracle refuses UTF-8 hash mismatch (0.091958ms)
✔ oracle refuses snapshot hash mismatch (0.219ms)
✔ oracle does not hash a regenerated JSON representation (0.117084ms)
✔ oracle refuses valid hash of content bound to a different publication (0.22675ms)
✔ oracle refuses a canonical receipt mismatch (0.215167ms)
✔ oracle requires explicit absent-row observation for invalid positive version (0.127333ms)
✔ oracle refuses content smuggled into an absent row (0.108042ms)
✔ oracle refuses replacement of server encoding declaration (0.082042ms)
✔ page shape refusal makes no navigation/auth/connection attempt (0.113959ms)
✔ missing helpers refuse before observer attachment or navigation (0.355208ms)
✔ later-phase execution requires actual newer M04 receipt before page use (0.08325ms)
✔ SQL artifact is a read-only two-actor observation, with no mutable seed or RPC (0.745834ms)
✔ new publication never substitutes an old immutable snapshot with validly rehashed bytes (0.300875ms)
✔ new publication cannot drop the old row (0.521833ms)
✔ new current head must equal the actual newer M04 version (0.2395ms)
✔ newer receipt cannot be substituted (0.145875ms)
✔ a changed old notification linkage is refused even with unchanged document bytes (0.132ms)
✔ unchanged controlled SQL bytes still require genuine browser observations (0.1425ms)
✔ privateScan thrown error is preserved and fails the phase (0.427625ms)
✔ capture thrown error is preserved and fails the phase (0.135541ms)
✔ captureCanonical thrown error is preserved and fails the phase (0.426917ms)
✔ helper envelope errors are retained without success flags (0.300042ms)
✔ an empty helper observation cannot pass a phase (0.182542ms)
✔ claimed helper success envelope is invalid (0.155333ms)
✔ real observer failure seam retains command-read-failure without a success response (0.327875ms)
✔ real observer failure seam retains body-read-failure without a success response (0.202667ms)
✔ real observer failure seam retains extra-owner-selector without a success response (0.1655ms)
✔ real observer failure seam retains unexpected-write without a success response (0.235209ms)
✔ an unresolved caller helper is bounded and explicitly remains unjoined (11.181125ms)
✖ null comparison input remains observations-only with a refusal (0.181167ms)
✖ null browser input remains observations-only with a refusal (0.210584ms)
ℹ tests 57
ℹ suites 0
ℹ pass 55
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 76.422625

✖ failing tests:

test at apps/portal/tests/genuine/client-history-oracle.test.mjs:152:1
✖ null comparison input remains observations-only with a refusal (0.181167ms)
  TypeError: Cannot destructure property 'descriptor' of '(intermediate value)(intermediate value)(intermediate value)' as it is null.
      at compareHistoryObservations (file:///Users/kanuj/.t3/worktrees/shelv/t3-8b0c20b0/apps/portal/tests/genuine/client-history.browser.mjs:118:45)
      at TestContext.<anonymous> (file:///Users/kanuj/.t3/worktrees/shelv/t3-8b0c20b0/apps/portal/tests/genuine/client-history-oracle.test.mjs:153:11)
      at Test.runInAsyncScope (node:async_hooks:214:14)
      at Test.run (node:internal/test_runner/test:1047:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:744:18)
      at Test.postRun (node:internal/test_runner/test:1173:19)
      at Test.run (node:internal/test_runner/test:1101:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:744:7)

test at apps/portal/tests/genuine/client-history-oracle.test.mjs:155:1
✖ null browser input remains observations-only with a refusal (0.210584ms)
  TypeError: Cannot destructure property 'page' of '(intermediate value)(intermediate value)(intermediate value)' as it is null.
      at observeClientHistory (file:///Users/kanuj/.t3/worktrees/shelv/t3-8b0c20b0/apps/portal/tests/genuine/client-history.browser.mjs:140:45)
      at TestContext.<anonymous> (file:///Users/kanuj/.t3/worktrees/shelv/t3-8b0c20b0/apps/portal/tests/genuine/client-history-oracle.test.mjs:156:17)
      at Test.runInAsyncScope (node:async_hooks:214:14)
      at Test.run (node:internal/test_runner/test:1047:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:744:18)
      at Test.postRun (node:internal/test_runner/test:1173:19)
      at Test.run (node:internal/test_runner/test:1101:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
```

</details>

<details><summary>Scan-stop focused RED (full raw output; extra argv --test-name-pattern=private scan refusal); exit 1</summary>

```text
✖ private scan refusal stops before capture or further canonical reads (2.684125ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 57.892875

✖ failing tests:

test at apps/portal/tests/genuine/client-history-oracle.test.mjs:158:1
✖ private scan refusal stops before capture or further canonical reads (2.684125ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    [
      'privateScan',
  +   'capture',
  +   'captureCanonical'
    ]

      at TestContext.<anonymous> (file:///Users/kanuj/.t3/worktrees/shelv/t3-8b0c20b0/apps/portal/tests/genuine/client-history-oracle.test.mjs:160:114)
      at async Test.run (node:internal/test_runner/test:1054:7)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:296:3) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: [ 'privateScan', 'capture', 'captureCanonical' ],
    expected: [ 'privateScan' ],
    operator: 'deepStrictEqual',
    diff: 'simple'
  }
```

</details>

<details><summary>Final GREEN (full raw output); exit 0</summary>

```text
✔ missing actual descriptor and publication scenario refuse before any page use (0.912208ms)
✔ a claimed publication flag cannot replace canonical M04 receipt/version/event identities (0.171917ms)
✔ empty oracle/browser observations cannot report an error-free comparison (0.182542ms)
✔ missing page and helpers are a failed observation phase, never an optional pass (0.264083ms)
✔ one actual publication shape and unknown B do not require invented second versions (0.946333ms)
✔ input refuses unknown descriptor authority flag (0.103792ms)
✔ input refuses alternate actor key (0.1395ms)
✔ input refuses private credential field (0.116209ms)
✔ input refuses nonliteral portal host (0.280625ms)
✔ input refuses nonlocal portal endpoint (0.285292ms)
✔ input refuses duplicate actors (0.137292ms)
✔ input refuses missing actual publication (0.100083ms)
✔ input refuses no M04 lineage (0.054167ms)
✔ input refuses unknown receipt field (0.060334ms)
✔ input refuses malformed receipt UUID (0.455458ms)
✔ input refuses nonpositive invalid-version candidate (0.124125ms)
✔ input refuses known version as invalid (0.078875ms)
✔ input refuses duplicate invalid-version candidates (0.059208ms)
✔ input refuses unsafe integer version (0.129084ms)
✔ input refuses positive candidate outside actual PostgreSQL version range (0.064042ms)
✔ input refuses rewound newer publication (0.185667ms)
✔ valid controlled bytes reach the missing-browser refusal, never fabricated browser success (0.866583ms)
✔ oracle refuses a row attributed to B with A bytes (0.126208ms)
✔ oracle refuses swapped actors (0.093084ms)
✔ oracle refuses missing current-head authority (0.148167ms)
✔ oracle refuses duplicate selected rows (0.1055ms)
✔ oracle refuses UTF-8 hash mismatch (0.100416ms)
✔ oracle refuses snapshot hash mismatch (0.234083ms)
✔ oracle does not hash a regenerated JSON representation (0.126459ms)
✔ oracle refuses valid hash of content bound to a different publication (0.156792ms)
✔ oracle refuses a canonical receipt mismatch (0.18775ms)
✔ oracle requires explicit absent-row observation for invalid positive version (0.1125ms)
✔ oracle refuses content smuggled into an absent row (0.09575ms)
✔ oracle refuses replacement of server encoding declaration (0.077667ms)
✔ page shape refusal makes no navigation/auth/connection attempt (0.104792ms)
✔ missing helpers refuse before observer attachment or navigation (0.144959ms)
✔ later-phase execution requires actual newer M04 receipt before page use (0.072417ms)
✔ SQL artifact is a read-only two-actor observation, with no mutable seed or RPC (1.246459ms)
✔ new publication never substitutes an old immutable snapshot with validly rehashed bytes (0.398584ms)
✔ new publication cannot drop the old row (0.460959ms)
✔ new current head must equal the actual newer M04 version (0.155209ms)
✔ newer receipt cannot be substituted (0.14125ms)
✔ a changed old notification linkage is refused even with unchanged document bytes (0.14275ms)
✔ unchanged controlled SQL bytes still require genuine browser observations (0.18275ms)
✔ privateScan thrown error is preserved and fails the phase (0.451084ms)
✔ capture thrown error is preserved and fails the phase (0.162458ms)
✔ captureCanonical thrown error is preserved and fails the phase (0.329417ms)
✔ helper envelope errors are retained without success flags (0.185291ms)
✔ an empty helper observation cannot pass a phase (0.139583ms)
✔ claimed helper success envelope is invalid (0.21925ms)
✔ real observer failure seam retains command-read-failure without a success response (0.388667ms)
✔ real observer failure seam retains body-read-failure without a success response (0.190041ms)
✔ real observer failure seam retains extra-owner-selector without a success response (0.141625ms)
✔ real observer failure seam retains unexpected-write without a success response (0.181375ms)
✔ an unresolved caller helper is bounded and explicitly remains unjoined (9.677166ms)
✔ null comparison input remains observations-only with a refusal (0.067458ms)
✔ null browser input remains observations-only with a refusal (0.051709ms)
✔ private scan refusal stops before capture or further canonical reads (0.223041ms)
ℹ tests 58
ℹ suites 0
ℹ pass 58
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 70.26275
```

</details>

## Minimal Parent handoff prompt

Independently review only the four M05 files in the ordinary source commit on `t3/client-history-milestone`; use actual Root `004c7a3a` ABI, exact Node22.23.0 and verified Sol/xhigh/default. Keep source controls distinct from genuine acceptance. M04 must supply actual publicationVersion/publicationReceiptId/notificationEventId and public markers; NamedAuth fixture must supply ordinary A/B sessions. After M01 and source review, Parent alone may provide the reviewed integrated source/resource packet and real page/privateScan/capture/captureCanonical helpers. Run no resources from this handoff alone. Owner/session/leave/delayed bytes and B unavailable-positive helper remain pending. Guidance/M65/provider-photo holds stay held. No Root/shared/auth/route/migration changes, PR/push/watch/merge/deploy or real-client action are authorized here.
