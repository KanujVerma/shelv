# W2 advisor reports and exact guidance UI, source phase

Owner: Kanuj. 31 October 2026. Isolated source implementation only, with no App activation, browser, native, SQL or release acceptance.

## Verified identity and scope

Starting parent `1b507a093616d46a91cd2806ea5e3f1854342602`, clean T3 worktree `/Users/kanuj/.t3/worktrees/shelv/t3-8ddcfb34`, branch `t3/advisor-guidance-ui`. Actual parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`, project `ac0af19d-d404-4f53-a870-02bfd76c2a80` from live thread readback. Actual task correlation `portal-rebuild-w2-guidance-ui-source-20261031-r1`; backing thread `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w2-guidance-ui-source-20261031-r1`, ordinal1 run started `2026-10-31T18:14:53.859Z`. The parent owns the authoritative task handle; none is guessed here.

Live capabilities and thread configuration both establish `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access/default. The Sol descriptor supports low/medium/high/xhigh/max/ultra and default/priority; selected values match. Project model/default-subagent and all eight role TOMLs pin Sol/xhigh, parsed before implementation. T3 project's defaultModelSelection is null; this thread's explicit selection and the actual local project pins provide the runtime evidence. No configuration changed, nested delegation, resource acquisition or remote freshness claim. Local origin/main remains the retained reference; no network fetch under the source-only boundary.

Only new `apps/portal/src/features/advisor/guidance/**`, new `apps/portal/tests/rebuild-advisor-guidance*.mjs`, this report, and ignored own evidence are writable. Existing advisor/App/ports/session/routes/plan/history/UI/contracts/SQL/packages/locks/status/TASKS/CONTEXT_SYNC remain unchanged. Every Node/npm invocation explicitly selects `/Users/kanuj/.nvm/versions/node/v22.23.0/bin`. Portal-only locked offline install added130 packages; no lockfile or dependency changes.

Read root/portal AGENTS, full95,388-byte original input A/B/C, approved decisions/desktop/full manifest, contracts/workstreams/status/UI rules, W1 report/guidance contracts and implementation, W7 backend R1/R2/R3, transport and M62 reports, prior care dependency report/R3 and actual transitive contracts. Five originals match INPUT_PROVENANCE. Prior RG1-RG5/M59/M62 and care CD1-CD3 remain bounded attributed evidence, not recertified here.

Applied implementation/TDD/verification, React, Figma design-to-code and repository task-first UX guidance. Live Figma DESIGN API context and screenshots read the actual manifest's A07 `500:846` and A03 `500:500`, session `0112b6bb-9517-48ec-9838-cbf88866c02b`. Shared wrappers, cream/forest tokens, A07 main/private columns and explicit client-visible/private separation govern. Parent retains shell/sidebar, navigation, final visual comparison and responsive acceptance. No browser/DOM/preview used. Figma assets are interface Lucide icons already supplied by the shared library; no temporary asset URL enters source.

## Early seam and evidence

`createAdvisorGuidanceAdapters(runtime)` uses only the actual `createAdvisorReviewRequest` and `createAdvisorGuidanceRequest`, both exported from `app/advisor-review-request.ts`. It positively parses before await, maps every success through Root, uses exact READ metadata including status, preserves finite errors and creation-bound session/owner/audience/epoch/generation/CSRF fences. There is no URL/fetch/credential/RPC argument or successful production placeholder.

Exports: `AdvisorReviewCommand`, `AdvisorGuidanceAdapters`, `AdvisorGuidanceSelection`, `AdvisorGuidanceNavigation`, `GuidanceDependencyRequest`, `guidanceDependencies`, `AdvisorGuidanceOptions`, `ExactGuidanceSelection`. Four typed unavailable requests cover raw private-source/detail grants, exact guidance authority/policy, changed legacy-basis content, and photo upload. They are requests, not invented executable protocols or authority.

Initial throwing seam gives four intended failures; the first harness registered cleanup too late and retained session timers. Corrected cleanup produces four terminal intended failures (`ports-red-terminal.log`), followed by4/4 GREEN through actual ApplicationSession/cookie/raw factories/Root mapping. Original timed-out setup log is retained separately. Frontend tracked strict/noUnchecked configuration exits0. Logs are ignored `.local-artifacts/portal-rebuild/w2-guidance/`. No browser, database, provider, Auth, SourceStorage, fixture or native resource was acquired.

The early seam's containing commit is returned to the parent after `git diff --check`; no self-referential hash is embedded here. Fuller controller/UI implementation and final verification follow in owned commits.
