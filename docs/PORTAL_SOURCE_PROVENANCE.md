# Portal source provenance

## Current activated walkthrough/service source, 25 October 2026

The deployed application is [44c3d371fe63aaf23a64b87d0ef459ecc85343d4](https://github.com/KanujVerma/shelv/commit/44c3d371fe63aaf23a64b87d0ef459ecc85343d4), on `codex/walkthroughs-service-20261025` from decision head `45c5112cb5c7c420b38e965804933a3986050743` and the unmerged PR 206/207 lineage. All three exact-source CI jobs passed. This approved activation supersedes local-only candidate claims; it does not merge that lineage. Private named inputs, current private version identifiers, consultation notes, credentials and screenshots remain outside public Git and static assets.

The source binds Pages `88ec5c96-3a0b-415c-8fca-03a2209dee11`, 120 package entries and ZIP SHA-256 `bfd214bc906411c127781d1ea868c1517b0d8251890dc98328e29527d329eb54`. All 117 public files matched their frozen bytes. The private-vault source SHA-256 is `ceb946c3843235c903b461488bef7dd6a5da7ba9d7b1e33c6e35c7039e75900e`. The final vault deployment/version is `21cb5045-e6ab-49f5-ae9d-f378d38f847c` / `eefca083-89af-47c1-8c3c-583d06988624`; its code etag `a598c63657472805fd13a3be87534a4463808de94cece5d4055ee5e98d07664c` stayed unchanged through the one additive private secret.

| Forward source file | Source SHA-256 | Actual hosted ledger version |
| --- | --- | --- |
| `20261025221028_concierge_service_workflows.sql` | `5ebb75645abb8e1002a5a3c7bbc64e53b4bfe7e325a2dd63819ebd6d82671eec` | `20261026002240` |
| `20261025221043_concierge_private_walkthroughs.sql` | `035fd8fa49b3c9ca0314769d24c72e61b83a3d883189588df90966e2f7c2f394` | `20261026002305` |

These are the two new provider-assigned versions, dated 26 October UTC and recorded here as 25 October America/Chicago. All 76 preceding ledger rows were preserved; the current ledger has 78 entries. No old alias, installed source or guard-only registration below was reapplied or repaired.

The current frozen Edge capsule file SHA-256 is `9b99bb23162e6945fb1bff8f760b6b88054b40fb3fd4bfd3077219739b6b4a63`, aggregate `052d4ce390a3cf7f0c9cf0e45512c90fcee383a2d611ca237955b711fec47b13`. Its 41 unique files form operations/payments/check-ins/admission closures of 20/31/24/23 files. Actual deployed versions are 6/4/4/2 respectively, all with JWT verification true. The deployment used frozen embedded contents and verified deployed source, rather than later mutable workspace reads.

The existing namespace, SQLite class/export, session key and old bindings were preserved. The current provider-returned `index.js` module was independently hashed at 415,542 bytes and matched the frozen vault SHA-256; current version-specific exports also matched. Only `SUPABASE_WALKTHROUGH_KEY` was added in the private vault after the selected legacy service-role key passed the exact frozen header-format probe. The four approved private current versions were imported separately from live clients, with two founder grants matched to existing identities and permissions. Explicit user authorization then added one distinct Codex maintenance-advisor identity/grant with no admission permission, preserving the human founders and their sessions/grants. A separate neutral immutable acceptance version and test grants are retained as history; no current private version was shared and zero grants remain active. Dedicated-account Auth, the four-plan UI, neutral sharing API and one retained synthetic-client review passed. [Release result](PORTAL_RELEASE_RESULT.md) owns current deployment and preservation receipts; [acceptance](PORTAL_ACCEPTANCE.md) distinguishes the unrun ordinary client-owner and service-write journeys. No private account identifier or credential belongs in this public provenance.

## Historical completion-release integration and preserved lineage

The remaining records preserve the previous completion release and its earlier deployed baseline. Their identities, package counts, source capsules and migration aliases retain their original scope; they do not identify the current activation.

The current portal is a separate web application from the older scanner. Its deployed source had advanced beyond GitHub integration. This reconciliation imports the reviewed portal and its supporting source into `apps/portal/` on an isolated branch without changing the primary dirty checkout or historical release folders.

The completion release is now deployed and verified. [Release result](PORTAL_RELEASE_RESULT.md) owns current deployment IDs, source commits, actual migration versions, runtime coverage and hosted acceptance. The pinned archive below remains the preserved predecessor; do not rewrite its inventory to represent the new release.

## Preserved deployed baseline before completion

| Component | Identity |
| --- | --- |
| Production origin | https://portal.goshelv.com |
| Pages deployment | `13339bb7-3fd1-41df-af16-2735cce52cfb`, completed October 24, 2026 at 10:13:45 UTC |
| Immutable origin | https://13339bb7.goshelv-portal.pages.dev |
| Original ZIP SHA256 | `3f6ecf472d8c8142754cf99df5b175b734c45d50d1861a23519fd4b5bb173595` |
| Original source | Retained October 24 final-release archive and its private preservation record |
| Source coverage | All 99 ZIP entries matched the local manifest; all 97 publicly served files matched fresh unauthenticated HTTPS reads at 22:57 UTC on October 24 |
| Combined gateway SHA256 | `cdcd16b473de6dae8ebcb4fdf499d828bb1a1efeeaf005a797221584195ab7f4` |
| Private worker deployment/version | `b455619b-8773-4a45-b868-f799818f7bff` / `2508f5b8-10b3-4cd9-9a61-db9b158bc957` |
| Private bundle SHA256 | `e35e06b69df476be6871f22ce611a2710dda4f6305bdbdbd652c0d010d6233bf` |

The gateway and routing file are deployment inputs rather than public static responses. Their hashes matched the retained runtime artifacts locally. Hosted deployment/settings readbacks are separate evidence. Both client and advisor public session flags were enabled in this baseline. The exact prior rollback is deployment `72acf271-1f9d-4f93-a7ca-1c4cf32d95d5`, ZIP SHA256 `88f51e000dec37c829b225624569b8b72d282ac75539fc97158d89e7445bad52`, with both public flags enabled.

The full 99-file hash inventory is versioned in `apps/portal/provenance/DEPLOYED-20261024.json`. Keep it pinned when source changes. `npm run build` generates a new package and records current source/output hashes, source differences from the pinned release, and whether generated gateway/vault bytes match it. A new local package does not change the deployed release.

## Source integration

The approved initial import comprised 303 files, all verified against the reviewed import map before feature edits:

| Destination | Files | Source |
| --- | ---: | --- |
| `apps/portal/site/` | 99 | Exact current release above |
| `apps/portal/session-integration/` | 86 | October 22 advisor durable candidate runtime, browser adapters, context SQL, tests and historical build profile |
| `apps/portal/backend/` | 38 | Current portable preview/Maya backend snapshot and isolated SQL harness dependency |
| Root concierge source, tests and documentation | 80 | Latest reviewed backend overlay, unique canonical payment/check-in source, RPC compatibility recovery and JPEG decoder/licenses |

The latest reviewed backend overlay adds advisor previews, additions with a nullable prior product, source labels and richer consultation card decisions. Nine files differ from the older canonical concierge copy, and `concierge-operations/preview.ts` plus the Maya fixture are new. These reviewed versions take precedence in the import. The separately retained primary versions remain recoverable.

The only existing root file overwritten by the initial import was `supabase/functions/delete-customer-account/index.ts`. Its scoped change cleans concierge private bytes before Auth deletion and preserves the identity when cleanup fails. The historical Maya proposal remains a fixture reference. Canonical Maya and session-context migration files have since been restored from exact existing server SQL, as recorded below; restoring source did not apply a hosted migration.

The portal runtime originated in the retained October 22 advisor durable candidate. The clean RPC recovery checkpoint was `040a025dfa3932794fd2d816132ee1d0eb713979`, including the private-storage probe compatibility follow-up. The older October 18 portable portal and October 20 integration repositories had no Git remote and are historical references rather than the latest deployment source.

## Reconciled migration lineage

These three canonical files restore SQL already installed on the existing hosted project. Their bytes match the connected readback; they are not pending deployment:

| Restored source file | Existing server version | SHA256 |
| --- | --- | --- |
| `20261020161532_concierge_maya_contract.sql` | `20261020161532` | `46ff63781b19322cfd3e091febacadfc0c45062772d031ae54eb7c9b5a623142` |
| `20261020183719_concierge_client_session_context.sql` | `20261020183719` | `6aaaa6df0e4fb70a089d3a94c5d5c64b3df9e7546688060c590b2b5f215e3ffd` |
| `20261023002407_concierge_advisor_durable_session_context.sql` | `20261023002407` | `e019b719464a9c789cea6e2e9ea3a1a1208bfe0bef1c702325db8fa01bd61ec5` |

All migration files are under `supabase/migrations/`. The historical local preview filename `20261020002348_concierge_advisor_preview_v2.sql` matches installed server version `20261020054405` exactly. Preserve that alias mapping; do not reapply the SQL or repair the old ledger to make filenames agree.

At release preparation, these four new reviewed sources were pending. The authorized execution produced the following source-to-server mapping:

| Release source file | SHA256 | Actual server version |
| --- | --- | --- |
| `20261024230528_concierge_founder_admission.sql` | `4f45572f8e6f7d04e1bb1c4316fd950ef517e78a282b0584ec1f8d239fd97197` | `20261025030725` |
| `20261024230829_concierge_checkin_replies.sql` | `539f882a4944a7a13959436e0775c22beb6d0ba4d0ce1cc5c7d83bb26d20f47b` | `20261025030747` |
| `20261024234059_concierge_manual_payment_methods.sql` | `6ebf8543d4102451cdfc9138020b8d3f1b34afe2b71fccf9fe09f340117fe574` | `20261025030748` |
| `20261025011331_concierge_no_current_products.sql` | `2076cef0e5a647d62eaa9b95e512687dab24b5cf696c4028e387409f34916adf` | `20261025031419` (guard-only registration; see below) |

The supported apply tool has no caller-supplied version parameter. Preserve `sourceFile + sourceSha256 → actualServerVersion` for each operation and the recovery exception below. Never blanket-push local history, repair historical aliases or reapply an already committed source merely because registration failed.

### No-current-products registration recovery

The first NoProducts attempt used the reviewed 17,050-byte source with SHA256 `2076cef0e5a647d62eaa9b95e512687dab24b5cf696c4028e387409f34916adf`. Its explicit source COMMIT completed the application DDL, then provider ledger insertion failed with `23505` because generated version `20261025030748` already belonged to manual payment methods. The NoProducts DDL was not replayed or rolled back.

Exact installed state for all eight affected functions matched the native final-schema reference, including bodies/signatures, return types, volatility, definer/search-path/parallel settings, argument names and effective application-role EXECUTE permissions. A separate guard-only supported apply then registered this new attempt as `20261025031419`. The prior 75 ledger rows and the eight function bindings remained unchanged; the ledger count became 76.

The ledger statement is the **5,200-byte registration guard**, SHA256 `b8939edf3940663e69a094eb064b559aaa8c5befb37aa8bd30a75379eca79f16`, not the original application DDL. Its exact text is retained as [operational evidence](../apps/portal/release/evidence/20261025031419_no_current_products_registration_guard.sql), outside the normal migrations directory. It asserts the expected ledger and installed function state, performs no application DDL/DML, and rejects repeat registration. Fresh-database replay continues to use the original canonical migration source; this exception is recovery of one new attempt, not historical ledger repair.

### Existing Durable Object export metadata

The initial code-only vault upload omitted declarative exports and was rejected with `100402 provisioned_class_missing_from_config`; no version/deployment changed. The corrected upload echoed only the already-installed declaration `AdvisorSessionObject: {type: "durable-object", storage: "sqlite"}`. It succeeded with all export-reconciliation arrays empty, preserving the namespace, storage, installed bindings and key. Corrected upload metadata SHA256 is `cb27b77636724bc1517d16c63ea15fb12e890fbf68c6ee069334e1136b99f5c3`.

The preparer now requires sanitized readback of that exact pinned declaration and emits it alongside retained binding types. New classes, tombstones, renames, transfers and storage changes are rejected before metadata output. It sends no Durable Object migration and requires no reconciliation effects. The target descriptor retains the original release baseline IDs; actual deployment receipts are recorded separately rather than silently retargeting historical preparation.

## Reviewed Edge source capsule

The reviewed `SUPABASE-FUNCTION-SOURCES.json` has file SHA256 `c54497e67e320d031c77e40946051a152a03d6631c7ae410b4c3ffafe80e35d8` and aggregate source digest `a9fe81c99ea9e45735a2502bc17a3f02ffbd17d66d30ce822155aa3aa8538f4b`. It binds 40 unique local files across four self-contained closures:

| Function | Closure files | Required and captured `verify_jwt` |
| --- | ---: | --- |
| `concierge-operations` | 19 | `true` |
| `concierge-payments` | 30 | `true` |
| `concierge-checkins` | 23 | `true` |
| `concierge-admission` | 22 | `true` |

Shared files occur in more than one closure. Existing hosted JWT verification stays true for the first three; admission's explicit source configuration is also true. Per-file content/hash, function digest and aggregate bind the embedded upload contents. TypeScript 6.0.3 resolves the supported static ESM graph; unsupported CommonJS loaders and unresolvable references fail closed. Current closures contain no external npm/jsr imports. Deploy the embedded reviewed contents, not later mutable workspace reads.

Application and release-tooling reviews passed, and the user subsequently authorized the bounded release. The reviewed source was published as commit `66f7a22510a9a6ac7753ce98e080325e83024552` in draft [PR 206](https://github.com/KanujVerma/shelv/pull/206), with exact-head CI green and no merge. This document records source and operational provenance; current deployment and hosted-acceptance outcomes remain in [portal acceptance](PORTAL_ACCEPTANCE.md) and the [release plan](PORTAL_RELEASE_PLAN.md).

## GitHub and private preservation

Live GitHub reads confirmed `main` at `33e90b0208f8a84ba1fbcd4aef788a26cf378bc6` before this integration. [PR 204](https://github.com/KanujVerma/shelv/pull/204) remained an open draft at `9fc7b601f7b6ae4a8e1b7a4c621bfa814f2a85ce`; it contains the earlier concierge foundation. [PR 205](https://github.com/KanujVerma/shelv/pull/205) remained an open documentation-only draft at `b5edefa85f482d8e05d562ae319be331b8193d56`. Neither PR contained the complete current portal.

The isolated working branch is `codex/portal-completion-20261024`. The primary checkout remained on `5d43559fa6ac6250938aee17712ed3a095d83cbf`, with 150 modified tracked files and 469 untracked files inventoried before work. Its index and status hashes were unchanged across preservation/import. These counts describe that preservation boundary, not this branch's final diff.

Private preservation remains outside Git. Its local manifest verifies 382 copied files, the exact ZIP and public-true rollback, source/runtime/supporting fixtures, selected canonical variants, and private binary worktree/index diffs. All 469 untracked files have inventory hashes. Secrets, dependency directories and generated caches were excluded. These private preservation files are not intended for Git staging or public upload.

Source import, local tests, hosted acceptance, publication and Git durability are separate transitions. Preserve their individual receipts and limitations; do not infer deployment or completed hosted workflows from a local build.
