# Portal source provenance

## Current UX deployment provenance, 26 October 2026

The user-authorized PR 209 deployment uses source head `7f3ba7a03d6168e7c5ec899578529ccddc9c6761`, retaining application freeze `2539d0729bffcb32318add72575a1e28168a1a9d`. [Release result](PORTAL_RELEASE_RESULT.md) owns the current Pages/vault identities, package hashes, preservation and recovery; [acceptance](PORTAL_ACCEPTANCE.md) owns hosted checks and limits. No Git merge occurred.

| Exact forward source | SHA-256 | Actual hosted ledger version |
| --- | --- | --- |
| `20261026185922_concierge_client_account_display_name.sql` | `ebfc7b5782bb95b0b9ad6c37044f53ce14e3f7973d2893809a3447f60dae5edd` | `20261026230521` |

The provider-assigned alias above is recorded without renaming the canonical migration or repairing the historical ledger. Only the signed-in actor's enrollment display name was added to the guarded read. Function OID `72612`, owner `postgres`, empty search path, security-definer setting and existing ACL were identical before and after; anon and service-role EXECUTE remain denied. All 78 prior migration entries were retained, producing 79.

Fresh hosted source comparison found one existing runtime-file delta: `src/contracts/ConciergePortalMapping.ts` in `concierge-operations`, from SHA-256 `8076df4ac4c170060d0221edece62d6dff08b0c3e652196be7464a09aaa136e0` to `5cd13e35fef8bf55c0cb2746793c66fc9a058d7f13d84d2d41b76bbfa4940d99`. The conservative frozen closure includes 20 source files, including type-only dependencies omitted by provider runtime extraction. Operations version 7 returned all 17 runtime files with exact candidate contents; payments/check-ins/admission remained at versions 4/4/2. Every function retains JWT verification true.

The frozen four-function source capsule SHA-256 is `f57ba14bcb4a2c52eb86d6298cd0f1b9e0d9642f37e7164d27425871f27c8904`, aggregate `20df93f2334c972fd61c323713e407c12dc39fb11b2ecbef622ada42a0230eae`; only its operations closure was deployed. Deployment manifest SHA-256 is `1e01fd2ad1f44384f181ffaa81aae8360f3fd939110311876ffe569cd6dfd505`. Vault metadata SHA-256 `cb27b77636724bc1517d16c63ea15fb12e890fbf68c6ee069334e1136b99f5c3` echoes the exact installed SQLite export with retained binding types and no lifecycle effects. Provider-returned module bytes independently match the candidate vault hash. Pages exposes its static-file manifest and deployment acknowledgement; the generated gateway hash is tied to the exact upload bytes, without claiming a provider raw-gateway download.

Private rollback evidence preserves the immediate predecessor's exact package and all 120 verified public files, the raw 415,542-byte vault module with SHA-256 `ceb946c3843235c903b461488bef7dd6a5da7ba9d7b1e33c6e35c7039e75900e`, and all four hosted function preimages. Historical target descriptors below retain their original pins and were not rewritten for this deployment.

## UX source lineage, 26 October 2026

[PR 209](https://github.com/KanujVerma/shelv/pull/209), `codex/shelv-ux-skill-pilot-20261026`, began at `bc4568e4e3af0936fd027351002f65b77512e00d` on the unmerged PR 207/206 stack. It did not yet include the later PR 208 walkthrough/service/tour source. Six exact `cherry-pick -x` operations reconciled that source through `de698807e8affefad45f5355f078525990744a67`; their original SHA trailers are retained:

| Original PR 208 commit | Reconciled PR 209 commit |
| --- | --- |
| `87ad5a9c1e467a3dbc8a2ecfa1edd9b8e266e410` | `dd31397` |
| `0d5e6f784cb652fafef89f151b5c23e348d10798` | `93b3754` |
| `44c3d371fe63aaf23a64b87d0ef459ecc85343d4` | `589602a` |
| `db6b8e9e52d5cf28f8e82c4ccd3a75d505cebf95` | `202378f` |
| `b22436f58e32ea21668dd350269b46227669ab43` | `c7ba4c4` |
| `2901f6c150b184bf0e1db9ca15e2a01be4dfcfb2` | `de69880` |

The local UX checkpoints are shared foundations `45b539b`, hover/menu corrections `457a243`/`fc43ffe`, advisor `038f82e`, client `e4baacd`, advisor correction `d79e680`, client correction `163754e` and final shared-focus correction `2539d0729bffcb32318add72575a1e28168a1a9d`. All six independent findings are closed with specification/quality PASS for the scoped corrections. [UX delivery](PORTAL_UX_DELIVERY.md) owns the changes, research revisions, screenshot provenance, verification results and limitations; it must not be read as a deployment receipt. The primary dirty checkout remains preserved.

The final local build from `2539d07` has 132 packaged assets and client/advisor/walkthrough gateway routes. ZIP SHA-256: `307472c8b6836ae5858d625cd6b0e36748cf8f8b32054967af38b862b2062875`; vault SHA-256: `12ccdf38776e434a5e53233cf3806d755e8cf50a1cd028e8989fe5dd73b99126`. The final verification digest is `ac4f96f16c08d19bbc51c7a2673fe6bca743b5487e48164e3a1c1685463739ab`, covering `apps/portal/site` plus `session-integration/runtime/server` and `workers`; the exact Git commit separately identifies complete source. The build reports `productionDeploymentChanged:false`. Documentation-only commits do not replace this application freeze.

Forward source `supabase/migrations/20261026185922_concierge_client_account_display_name.sql`, SHA-256 `ebfc7b5782bb95b0b9ad6c37044f53ce14e3f7973d2893809a3447f60dae5edd`, adds only the actor's optional enrollment display name to the existing guarded client read. It was first tested locally, then applied only under the separate deployment authorization recorded above. Hosted email callback acceptance for the bounded auth continuation remains unrun. The implementation candidate itself did not authorize hosted activation.

## Historical Maya tour source, 25 October 2026

The preceding public application source was [b22436f58e32ea21668dd350269b46227669ab43](https://github.com/KanujVerma/shelv/commit/b22436f58e32ea21668dd350269b46227669ab43), on the existing `codex/walkthroughs-service-20261025` branch and unmerged PR 206/207/208 lineage. Pages `17546896-f89f-4300-b9f8-252a4734984c` served the reviewed 123-entry package, with all 120 public files matched exactly. ZIP SHA-256 is `e5a4c04bee3213826155fc7c55aad72665e14d456915c01af5e56a6f59b10d49`; build manifest SHA-256 is `15d239c82ee1f56a2f0061d740ed9bdb4ba3e459ba94aa253db6d828896bbfd0`. The later release-record commit changed documentation only.

This bounded update changes public Maya narration, anchored tour UI/preferences and optional shared-client controls. Private inputs are absent from source, runtime and ZIP scans. Generated gateway, routes and headers match the prior package byte-for-byte; vault source/deployment/version, Edge functions, migrations, grants and private stores are unchanged. [Release result](PORTAL_RELEASE_RESULT.md) owns exact release evidence; [acceptance](PORTAL_ACCEPTANCE.md) distinguishes current UI checks from retained backend evidence.

## Walkthrough/service backend baseline and lineage, 25 October 2026

The earlier application was [44c3d371fe63aaf23a64b87d0ef459ecc85343d4](https://github.com/KanujVerma/shelv/commit/44c3d371fe63aaf23a64b87d0ef459ecc85343d4), on `codex/walkthroughs-service-20261025` from decision head `45c5112cb5c7c420b38e965804933a3986050743` and the unmerged PR 206/207 lineage. All three exact-source CI jobs passed. This approved activation supersedes local-only candidate claims; it does not merge that lineage. Private named inputs, current private version identifiers, consultation notes, credentials and screenshots remain outside public Git and static assets.

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
