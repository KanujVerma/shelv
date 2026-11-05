# W7 independent documentation and configuration review

Reviewer: W7. Review date: 30 October 2026. This report reviews the initial approved-rebuild checkpoint, not implementation of the portal.

## Exact scope and runtime

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-3717c152`.
- Branch: `t3/w7-portal-docs-review`. Starting working tree was clean.
- Reviewed base: `8ac0826f79b4299b0249c5e18003b6ce08593c60`.
- Reviewed head: `9be041db5b7227637f0c3ba964d932c6bc6d0e06`.
- Full range: 28 changed paths, 2,260 added lines, one removed line and one PNG. Application, gateway, SQL, lockfile and deployed provenance files are unchanged.
- Fresh `orchestrator_capabilities({search:"gpt-6.1-sol"})` returned provider instance `codex`, inherited model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, runtime `full-access`, interaction `default`. The live model descriptor advertises `xhigh`.
- Fresh `t3_thread_configuration({})` independently returned the same model/options for review thread `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-docs-review-20261030-r1`.
- Fresh configuration read for coordinator thread `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` also returned `codex`, `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`.
- Installed executable: `/Users/kanuj/.local/bin/codex`; `codex --version` returned `codex-cli 0.164.0`.
- No subagents were used. Owned write-set is this report only. No production content was edited, no broad application suite was run, and no hosted mutation, private-client access, push, PR, merge or deployment was performed.

## Separate verdicts

**Specification compliance: PASS for this initial documentation/configuration checkpoint.** No blocking or important departure from the supplied approved handoff was found. The imported requirements, prospective precedence rules and future acceptance gates preserve the approved scope. This is not acceptance of unimplemented screens or server behavior.

**Quality: PASS for this checkpoint.** No blocking or important correctness, preservation, configuration or disclosure finding was found. The contracts explicitly identify proposed interfaces and existing backend gaps; implementation evidence remains pending. One minor status correction is recorded below.

## Findings and recommendation

No blocking or important findings.

Nonblocking status inconsistency: [CURRENT_STATUS.md](../CURRENT_STATUS.md), line 10, says the persisted baseline is not yet acquired; [EXECUTION_LOG.md](../EXECUTION_LOG.md), line 13, similarly leaves the stored screenshot pending. The reviewed head actually contains `design/C01-498-85.png` and its hash/size record in `design/ACQUISITION.json`. The log's line 16 correctly records that PNG. In the next coordinator status update, distinguish the acquired and persisted C01 baseline from the 25 outstanding screen references. This does not imply any browser or full-design acceptance.

Recommendation: proceed with the checkpoint and bounded W1/W0 work, retaining the planned backend reconciliation and interface freeze before dependent page work. This report grants no release authority and does not replace fresh review of later implementation.

## Evidence and checks

### Approved input and preservation

Read the retained complete handoff, D01-D48, full desktop specification/manifest, compact map, GOAL, contracts, acceptance matrix, ownership/status/execution/plan records, applicable instructions and all eight role files. Inspected the exact range and the PNG, rather than using the author summary as the review basis.

Python standard-library byte extraction and SHA-256 checks produced:

| Retained file | Bytes | Provenance hash matches |
| --- | ---: | --- |
| `source/APPROVED_INPUT.txt` | 95,388 | yes |
| `APPROVED_DESKTOP_SPEC.md` | 36,823 | yes |
| `shelv_desktop_design_manifest.json` | 12,642 | yes |
| `APPROVED_DECISIONS.md` | 24,755 | yes |
| `SCREEN_MANIFEST.json` | 4,300 | yes |

Appendix A exactly equals `APPROVED_DECISIONS.md`; appendix B exactly equals `APPROVED_DESKTOP_SPEC.md`. The JSON block in appendix C equals the imported manifest with its ordinary final newline added. `APPROVED_DECISIONS.md`, `SCREEN_MANIFEST.json` and `GOAL.md` are byte-identical to base. The two declared preapproval hashes are correctly described as provenance declarations, not verified hashes of separately supplied original files. The committed attachment hash is `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`.

Reconstructing the five existing instruction/founder/UI/context files after removing only the new prospective insertion reproduces their base bytes. Historical evidence and older source are preserved. The README replacement imports the formerly missing companions and adds execution pointers.

### Coverage and business boundaries

- The decision section of `ACCEPTANCE_MATRIX.md` maps D01-D48 exactly once and in order. All 26 full/compact screen codes, titles, nodes and dimensions match. Shared component, icon, foundation and execution-requirement inventories match. All 26 acceptance screen/node rows match the manifests, including D01 at 1800 by 960. V01-V17 are present.
- The mandatory secondary inventory covers auth/callback recovery, prepublication, profile/address/contact verification, service payments/renewal, final quote/claims, returns/refunds, mismatch/unreviewed use, conflicts/uncertain writes, source/upload denial and recovery, historical snapshots/amendments, notifications/retry, no-change reviews, cancellation/read-only/expired care, difficult content, five-stage Maya, responsive/accessibility and private walkthrough compatibility. These are honestly pending targets, not completed routes.
- Exact-human/content/client approval, payment-only revision independence, applicable verified first payment and deliberate publication are explicit in `IMPLEMENTATION_CONTRACTS.md:25`, `:43`, `:51` and `:59`. Agent-specific Kanuj authority remains independent of the owner-controlled Sami policy. Existing entry points must enforce candidate gates or deny; the documents do not bless a legacy bypass.
- Publication and deduplicated event persistence are one reliable business commit; email delivery/retry is separate (`IMPLEMENTATION_CONTRACTS.md:55-63`). The full manifest's `notificationAtomicWithPublication=false` is explicitly qualified as external delivery, with durable transactional event persistence required. It is not a permission to lose an event between commits.
- Service clocks, calendar arithmetic, legacy IDs/dates/actual receipts, explicit Start, frozen commerce facts and separate refund transfers are preserved. Thirty calendar days of post-support read-only care, final entitled export and separately reachable unfinished administration are explicit (`IMPLEMENTATION_CONTRACTS.md:65-72`).
- Source access remains permissioned/task-scoped; development is synthetic; source retention, portal access and history/financial retention remain distinct. No new blanket Sami access, training consent, automatic SMS, retailer/carrier integration, autonomous publishing or clinical clearance is introduced.
- Status distinguishes agreed/designed from implemented/tested/hosted/deployed. Root/portal validation, real isolated Auth/PostgREST/persistence/permission E2E, negative cases, visual comparison, representative-human comprehension, migration/rollback, exact-head CI and separate production authorization remain future gates. No mocked or historical result is presented as rebuild acceptance.

### Existing source cross-check

Inspected `src/contracts/ConciergePortal.ts`, `ConciergePresentation.ts`, `ConciergeService.ts`, relevant validators/command handling and the canonical presentation migration `supabase/migrations/20261025011331_concierge_no_current_products.sql`. Current `save_draft_v2` requires client identity, intake version and a validated presentation; `publish_v2` has an empty payload rather than an exact-human-approval command. This supports the explicitly recorded gaps in `IMPLEMENTATION_CONTRACTS.md:13`; it does not prove all SQL behavior or future compatibility.

Inspected the existing gateway, advisor composition and client/advisor policy allowlists under `apps/portal/session-integration/runtime/server/`, plus `supabase/functions/concierge-operations/commands.ts` and `handler.ts`. Cookie/vault transport, bounded payloads, same-origin/CSRF checks, explicit action parsing and verified-owner handling support the preservation claims. Proposed new command families are correctly left for W1 reconciliation. This was a bounded contract cross-check, not a security certification.

### Configuration compatibility

- Python `tomllib` parsed project configuration and all eight role files. Every role explicitly sets `model="gpt-6.1-sol"` and `model_reasoning_effort="xhigh"`; each referenced role path exists.
- Selected global model/effort are Sol/xhigh. No global role declarations or `.codex/agents/*.toml` overrides were found. Only relevant model/role settings were reported; no credential values were retrieved or recorded.
- `codex features list` exited 0. Because that command alone is not strict field validation, also ran `codex app-server --strict-config --print-startup-config`: exit 0, `appServerVersion=0.164.0`, no stderr. Repeated with explicit `-c` overrides for the model/effort and all four requested `[agents]` keys: exit 0 and no stderr. No model turn or child was started.
- An initial `codex --strict-config features list` attempt exited 1 because `--strict-config` is unsupported for `features`; the supported app-server validation above replaced it. No failure is counted as a pass.
- The fetched [official configuration schema](https://developers.openai.com/codex/config-schema.json), `AgentsToml`, recognizes `enabled`, `max_concurrent_threads_per_session`, `default_subagent_model` and `default_subagent_reasoning_effort`; role `config_file` paths resolve relative to their defining config. File defaults remain separate from live T3 task settings and do not prove a changed native concurrency cap.

### Mechanical and disclosure checks

- `git ls-remote origin refs/heads/main` returned `d39a7d4943209080df7c4cf97d85784f462758bf`; reviewed base/head remain the explicitly pinned range.
- All changed JSON/TOML files parsed. A local Markdown-link target scan of changed text files checked 162 relative targets with zero missing targets. Historical `CONTEXT_SYNC.md` fragment links were not changed by this patch.
- The PNG is 1440 by 960, 138,983 bytes; its SHA-256 matches acquisition metadata. Visual inspection shows the labeled fictional Maya design, not private client source. No browser rendering is certified.
- Read the changed text and ran targeted private-key/provider-token/JWT/temporary-signed-asset URL checks: no matches. This is scoped to the reviewed patch and is not a universal secret-detection guarantee.
- `git diff --check 8ac0826f79b4299b0249c5e18003b6ce08593c60 9be041db5b7227637f0c3ba964d932c6bc6d0e06` exited 0. The added attributes narrowly preserve supplied Markdown hard-break/trailing-source bytes; no trailing whitespace was found in other changed text files.
- Changed-path inventory contains only documentation, nine Codex TOML files, `.gitattributes` and the design PNG. Broad application, Expo, database, hosted, email and browser suites were deliberately not run for this documentation/configuration review.

## Exact uncertainties and acceptance limits

1. The retained attachment is internally hash-consistent; the original external attachment byte stream was not independently available in this review. Separately unavailable preapproval files cannot be authenticated from their declared hashes alone.
2. The C01 file/hash/fictional content are verified. Its original Figma acquisition call/session, live Figma revision and remaining 25 native frame/recovery acquisitions were not independently replayed. No pixel-match or full visual approval is claimed.
3. Fresh coordinator/reviewer configuration is verified. The historical preconfiguration `high` turn and its activity were not independently replayed; the report does not certify every past/future task setting.
4. W1's full SQL/RLS/storage/legacy-path reconciliation, exact new wire interfaces and migration design are still required. No frontend, permission, notification, retention or financial behavior has been implemented or proven by this checkpoint.
5. No real recipient delivery, hosted acceptance, human comprehension, paid-service scope clearance or production release is established. The documents retain these gates explicitly.
