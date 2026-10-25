# Portal source provenance

The current portal is a separate web application from the older scanner. Its deployed source had advanced beyond GitHub integration. This reconciliation imports the reviewed portal and its supporting source into `apps/portal/` on an isolated branch without changing the primary dirty checkout or historical release folders.

## Pinned deployed release

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

Only these four new reviewed sources are pending hosted application:

| Pending source file | SHA256 |
| --- | --- |
| `20261024230528_concierge_founder_admission.sql` | `4f45572f8e6f7d04e1bb1c4316fd950ef517e78a282b0584ec1f8d239fd97197` |
| `20261024230829_concierge_checkin_replies.sql` | `539f882a4944a7a13959436e0775c22beb6d0ba4d0ce1cc5c7d83bb26d20f47b` |
| `20261024234059_concierge_manual_payment_methods.sql` | `6ebf8543d4102451cdfc9138020b8d3f1b34afe2b71fccf9fe09f340117fe574` |
| `20261025011331_concierge_no_current_products.sql` | `2076cef0e5a647d62eaa9b95e512687dab24b5cf696c4028e387409f34916adf` |

Apply only those reviewed bytes through the supported migration tool after release approval. The tool has no caller-supplied version parameter: record `sourceFile + sourceSha256 → actualServerVersion` from each installation result/readback. Never blanket-push local history or repair historical aliases.

## Reviewed Edge source capsule

The reviewed `SUPABASE-FUNCTION-SOURCES.json` has file SHA256 `c54497e67e320d031c77e40946051a152a03d6631c7ae410b4c3ffafe80e35d8` and aggregate source digest `a9fe81c99ea9e45735a2502bc17a3f02ffbd17d66d30ce822155aa3aa8538f4b`. It binds 40 unique local files across four self-contained closures:

| Function | Closure files | Required and captured `verify_jwt` |
| --- | ---: | --- |
| `concierge-operations` | 19 | `true` |
| `concierge-payments` | 30 | `true` |
| `concierge-checkins` | 23 | `true` |
| `concierge-admission` | 22 | `true` |

Shared files occur in more than one closure. Existing hosted JWT verification stays true for the first three; admission's explicit source configuration is also true. Per-file content/hash, function digest and aggregate bind the embedded upload contents. TypeScript 6.0.3 resolves the supported static ESM graph; unsupported CommonJS loaders and unresolvable references fail closed. Current closures contain no external npm/jsr imports. Deploy the embedded reviewed contents, not later mutable workspace reads.

Application and release-tooling reviews passed, including both corrected release-guard findings. This is source-review approval, not Git publication or production-release authorization. Publication, migrations, function updates and portal deployment remain pending the concrete [release plan](PORTAL_RELEASE_PLAN.md).

## GitHub and private preservation

Live GitHub reads confirmed `main` at `33e90b0208f8a84ba1fbcd4aef788a26cf378bc6` before this integration. [PR 204](https://github.com/KanujVerma/shelv/pull/204) remained an open draft at `9fc7b601f7b6ae4a8e1b7a4c621bfa814f2a85ce`; it contains the earlier concierge foundation. [PR 205](https://github.com/KanujVerma/shelv/pull/205) remained an open documentation-only draft at `b5edefa85f482d8e05d562ae319be331b8193d56`. Neither PR contained the complete current portal.

The isolated working branch is `codex/portal-completion-20261024`. The primary checkout remained on `5d43559fa6ac6250938aee17712ed3a095d83cbf`, with 150 modified tracked files and 469 untracked files inventoried before work. Its index and status hashes were unchanged across preservation/import. These counts describe that preservation boundary, not this branch's final diff.

Private preservation remains outside Git. Its local manifest verifies 382 copied files, the exact ZIP and public-true rollback, source/runtime/supporting fixtures, selected canonical variants, and private binary worktree/index diffs. All 469 untracked files have inventory hashes. Secrets, dependency directories and generated caches were excluded. These private preservation files are not intended for Git staging or public upload.

Source import, local tests, hosted acceptance, publication and Git durability are separate transitions. Preserve their individual receipts and limitations; do not infer deployment or completed hosted workflows from a local build.
